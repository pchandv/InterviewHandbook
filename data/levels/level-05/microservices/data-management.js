/* ═══════════════════════════════════════════════════════════════════
   MICROSERVICES — Data Management
   Database-per-service, eventual consistency, sagas, transactional
   outbox, CQRS read models, event sourcing, and the 2PC pitfall.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('microservices-data', {

    title: 'Microservices: Data Management',
    level: 5,
    group: 'microservices',
    description: 'Managing data across services: database-per-service, eventual consistency, the saga pattern (orchestration vs choreography), the transactional outbox, CQRS read models, event sourcing, and why distributed 2PC transactions do not scale.',
    difficulty: 'advanced',
    estimatedMinutes: 45,
    prerequisites: ['microservices', 'arch-cap'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Data is the hardest part of microservices. In a monolith a single database and ACID
            transactions make consistency easy. Split into services with a database each, and you lose cross-service
            transactions — you must now manage consistency <strong>across</strong> independent stores.</p>
            <p>This lesson covers the database-per-service principle, why you accept eventual consistency, the saga
            pattern for multi-service workflows, the transactional outbox for reliable event publishing, CQRS read
            models for cross-service queries, and event sourcing. It complements
            <a href="#arch-cap">CAP, BASE &amp; Theorems</a> (the theory) and
            <a href="#event-driven-architecture">Event-Driven Architecture</a> (the messaging side).</p>`
        },
        {
            title: 'Database per Service',
            content: `<p>Each service <strong>owns its data store privately</strong>. No other service reads or
            writes it directly — they go through the owning service's API or react to its events.</p>
            <h4>Why</h4>
            <ul>
                <li><strong>Loose coupling</strong> — a service can change its schema without breaking others.</li>
                <li><strong>Polyglot persistence</strong> — each service picks the best store (PostgreSQL for
                orders, Redis for inventory cache, a document store for catalog).</li>
                <li><strong>Independent scaling</strong> — scale each data store to its own load.</li>
            </ul>
            <h4>The cost</h4>
            <p>You can no longer JOIN across services or wrap a change in one ACID transaction. Those are solved
            with sagas (writes) and CQRS/API composition (reads), covered below.</p>`,
            callout: {
                type: 'warning',
                title: 'A shared database is the #1 coupling trap',
                text: 'The fastest way to build a distributed monolith is to let two services share a database table. A schema change then breaks multiple services at once. Ownership must be exclusive; synchronize state with events.'
            }
        },
        {
            title: 'Eventual Consistency',
            content: `<p>Because each service commits to its own store and propagates changes asynchronously, the
            system is <strong>eventually consistent</strong>: after a change, different services are briefly out of
            sync, then converge once events are processed.</p>
            <p>This is a deliberate trade (see <a href="#arch-cap">CAP</a>): you give up immediate global consistency
            to gain availability and loose coupling. The design work is deciding <strong>where eventual consistency
            is acceptable and where it is not</strong>. Displaying a slightly stale product count is fine; taking
            payment twice is not. Money and compliance paths often need strong consistency inside a single service,
            while cross-service propagation is eventual.</p>`
        },
        {
            title: 'The Saga Pattern',
            content: `<p>A <strong>saga</strong> maintains consistency across services without a distributed
            transaction. It is a sequence of local transactions; each step commits in one service and triggers the
            next. If a step fails, <strong>compensating transactions</strong> semantically undo the completed steps
            (release stock, refund a charge) — there is no automatic rollback.</p>
            <h4>Orchestration</h4>
            <p>A central <em>orchestrator</em> invokes each step and tracks state. The flow is explicit, easy to
            monitor, and changed in one place — but the orchestrator grows complex and is a coupling point.</p>
            <h4>Choreography</h4>
            <p>Services react to each other's events with no central brain. Maximally decoupled, but the end-to-end
            flow is implicit and harder to trace.</p>
            <p><strong>Rule of thumb:</strong> choreography for short flows (2-3 steps); orchestration once a
            workflow has many steps, branching, or needs clear visibility.</p>`,
            mermaid: `flowchart LR
    subgraph Orchestration["Orchestration (central coordinator)"]
        O["Saga Orchestrator"]
        O -->|"1 reserve stock"| OI["Inventory"]
        O -->|"2 charge"| OP["Payment"]
        O -->|"3 confirm"| OO["Order"]
        OP -.->|"on fail: release stock"| OI
    end
    subgraph Choreography["Choreography (event driven)"]
        CO["Order"] -->|"OrderCreated"| CI["Inventory"]
        CI -->|"StockReserved"| CP["Payment"]
        CP -->|"PaymentCompleted"| CO2["Order confirms"]
        CP -->|"PaymentFailed"| CI2["Inventory releases stock"]
    end`
        },
        {
            title: 'Saga: Compensation Example',
            content: `<p>The critical part of a saga is designing the <strong>compensations</strong>. Consider a
            "place order" saga: reserve stock, charge payment, confirm order. If payment fails after stock was
            reserved, the saga must release the stock. Compensations must themselves be idempotent and must handle
            the case where the forward action partially applied.</p>`,
            code: `// A minimal orchestration-style saga step with compensation.
public sealed class PlaceOrderSaga
{
    public async Task<OrderResult> RunAsync(OrderRequest req, CancellationToken ct)
    {
        var compensations = new Stack<Func<Task>>();
        try
        {
            var reservation = await _inventory.ReserveAsync(req.Items, ct);
            compensations.Push(() => _inventory.ReleaseAsync(reservation.Id));

            var charge = await _payment.ChargeAsync(req.CustomerId, req.Total, ct);
            compensations.Push(() => _payment.RefundAsync(charge.TransactionId));

            await _orders.ConfirmAsync(req.OrderId, ct);
            return OrderResult.Confirmed(req.OrderId);
        }
        catch (Exception ex)
        {
            // Unwind in reverse order — each compensation is idempotent
            while (compensations.Count > 0)
                await compensations.Pop()();
            return OrderResult.Failed(req.OrderId, ex.Message);
        }
    }
}`,
            language: 'csharp',
            callout: {
                type: 'info',
                title: 'Sagas do not give isolation',
                text: 'Unlike an ACID transaction, a saga has no isolation — other operations can observe intermediate states (stock reserved but order not yet confirmed). Handle this with semantic locks or status flags (e.g., order status Pending) so readers know the state is provisional.'
            }
        },
        {
            title: 'The Transactional Outbox',
            content: `<p>A subtle, critical bug: the <strong>dual-write problem</strong>. A service updates its
            database AND publishes an event as two separate operations. A crash between them loses the event (DB
            committed, event never sent) or emits a phantom event (event sent, DB rolled back). A database and a
            broker cannot share one atomic transaction.</p>
            <p>The <strong>Transactional Outbox</strong> writes the event into an <code>outbox</code> table
            <em>in the same local DB transaction</em> as the business change. A separate relay (a poller, or
            change-data-capture reading the DB log) publishes unsent rows and marks them sent. Delivery is
            <strong>at-least-once</strong>, so consumers must be idempotent.</p>`,
            code: `-- Business row and outbox row commit in ONE transaction (no dual-write)
BEGIN TRANSACTION;

INSERT INTO Orders (Id, CustomerId, Total, Status)
VALUES (@OrderId, @CustomerId, @Total, 'Pending');

INSERT INTO Outbox (Id, Type, Payload, OccurredAt, Published)
VALUES (NEWID(), 'OrderCreated', @PayloadJson, SYSUTCDATETIME(), 0);

COMMIT TRANSACTION;

-- A relay process publishes unsent rows, then marks them sent:
--   SELECT TOP 100 * FROM Outbox WHERE Published = 0 ORDER BY OccurredAt;
--   (publish each to the broker)
--   UPDATE Outbox SET Published = 1 WHERE Id = @Id;`,
            language: 'sql'
        },
        {
            title: 'CQRS & Read Models for Cross-Service Queries',
            content: `<p>With database-per-service you cannot JOIN across services. To answer a query spanning
            several services, use one of these, in increasing decoupling:</p>
            <ul>
                <li><strong>API Composition</strong> — a gateway/aggregator calls each service and joins in memory.
                Simple, but adds latency and couples to callee availability; poor for large joins or
                filtering/sorting across services.</li>
                <li><strong>CQRS read model</strong> — maintain a separate, denormalized query store built by
                subscribing to services' events. Reads hit one optimized store; the trade-off is eventual
                consistency and the cost of maintaining the projection.</li>
            </ul>
            <p><strong>CQRS</strong> (Command Query Responsibility Segregation) separates the write model from one
            or more read models. Writes go to the owning service; a projector consumes events and updates a read
            model shaped for queries. Use API composition for simple, low-fan-out reads; move to a CQRS read model
            when a query is hot, spans many services, or needs rich filtering.</p>`,
            mermaid: `flowchart LR
    OrderSvc["Order Service"] -->|"OrderCreated"| Bus["Event Bus"]
    PaymentSvc["Payment Service"] -->|"PaymentCompleted"| Bus
    Bus --> Proj["Projector"]
    Proj --> RM[("Read Model (denormalized)")]
    Client["Query"] --> RM`
        },
        {
            title: 'Event Sourcing',
            content: `<p><strong>Event sourcing</strong> stores state as an append-only log of events rather than the
            current state. Instead of a row that says <em>balance = 100</em>, you store <em>Deposited 60</em>,
            <em>Deposited 50</em>, <em>Withdrew 10</em>, and derive the balance by replaying them.</p>
            <h4>Benefits</h4>
            <ul>
                <li>Complete audit trail — every change is a recorded fact (great for finance/compliance)</li>
                <li>Time travel — reconstruct state at any past point</li>
                <li>Natural fit with CQRS — project events into any number of read models</li>
            </ul>
            <h4>Costs</h4>
            <ul>
                <li>Steep learning curve; querying current state requires projections</li>
                <li><strong>Schema/versioning</strong> of events over time is hard</li>
                <li>Replay and snapshotting add operational complexity</li>
            </ul>
            <p>Event sourcing is powerful but not a default — use it where the audit log and temporal queries are
            genuinely valuable, not everywhere. See <a href="#event-driven-architecture">Event-Driven
            Architecture</a> for more.</p>`
        },
        {
            title: 'Why Two-Phase Commit (2PC) Does Not Scale',
            content: `<p>The obvious idea — use a distributed ACID transaction across services (two-phase commit) —
            fails at scale. In 2PC a coordinator asks all participants to <em>prepare</em>, then tells them to
            <em>commit</em>. Problems:</p>
            <ul>
                <li><strong>Blocking</strong> — participants hold locks from prepare until commit; a slow or crashed
                coordinator freezes everyone.</li>
                <li><strong>Availability</strong> — it needs every participant up simultaneously; overall
                availability is the product of all participants.</li>
                <li><strong>Coupling</strong> — services must expose transaction internals and share a coordinator,
                defeating autonomy.</li>
            </ul>
            <p>This is why microservices use <strong>sagas + eventual consistency</strong> instead of distributed
            ACID. Accept eventual consistency; design compensations.</p>`
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Shared database</h4>
            <p>Two services on the same tables = distributed monolith. Own data exclusively; sync via events.</p>
            <h4>Dual-write without an outbox</h4>
            <p>Writing to the DB and publishing an event separately loses or duplicates events on crash. Use the
            transactional outbox.</p>
            <h4>Assuming exactly-once delivery</h4>
            <p>Messaging is at-least-once; consumers must be idempotent (dedupe on message id / inbox table).</p>
            <h4>Reaching for distributed transactions</h4>
            <p>2PC across services does not scale. Use sagas.</p>
            <h4>Forgetting saga isolation</h4>
            <p>Intermediate saga states are visible; mark provisional state (e.g., Pending) so readers are not
            misled.</p>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Database-per-service</strong> — private data, synchronized via events, never shared tables</li>
                <li>Accept <strong>eventual consistency</strong> where safe; keep strong consistency inside a service for money/compliance</li>
                <li><strong>Saga</strong> (orchestration vs choreography) replaces distributed transactions; design compensations</li>
                <li><strong>Transactional outbox</strong> solves the dual-write problem; consumers must be idempotent</li>
                <li><strong>CQRS read models</strong> answer cross-service queries; <strong>2PC</strong> does not scale</li>
            </ul>`
        },
        {
            title: 'Continue the Series',
            content: `<p>Previous: <a href="#microservices-communication">← Communication</a> ·
            Back to <a href="#microservices">Overview</a> ·
            Next: <a href="#microservices-resilience">Resilience →</a></p>`
        }
    ],

    questions: [
        {
            question: 'What is the database-per-service pattern and what is its main trade-off?',
            difficulty: 'medium',
            answer: `<p>Each service owns a private data store; no other service reads or writes it directly. This
            gives loose coupling (independent schema evolution), polyglot persistence (best store per service), and
            independent data scaling.</p>
            <p>The main trade-off: you lose cross-service JOINs and cross-service ACID transactions. You solve reads
            with API composition or CQRS read models, and writes with sagas plus eventual consistency.</p>`,
            explanation: 'Each department keeps its own filing cabinet, so it can reorganize freely — but answering a question that spans departments now needs a phone call around, not one look in a shared cabinet.',
            bestPractices: ['Exclusive data ownership per service', 'Synchronize state via events', 'Use CQRS read models for cross-service queries'],
            commonMistakes: ['Sharing a database "for one join"', 'Assuming cross-service ACID is available', 'Ignoring the cross-service query cost'],
            interviewTip: 'State benefit (loose coupling) and cost (no cross-service joins/transactions) together — then name the solutions (CQRS, sagas).',
            followUp: ['How do you query across services?', 'What is eventual consistency?', 'Why not use a shared database?']
        },
        {
            question: 'Explain the saga pattern and when you would choose orchestration over choreography.',
            difficulty: 'hard',
            answer: `<p>A <strong>saga</strong> maintains cross-service consistency without a distributed
            transaction: a sequence of local transactions, each triggering the next, with compensating transactions
            to undo completed steps on failure.</p>
            <p><strong>Orchestration</strong>: a central coordinator drives each step — explicit, monitorable,
            changed in one place, but complex and a coupling point. <strong>Choreography</strong>: services react to
            events with no central brain — decoupled, but the flow is implicit and harder to trace. Use
            choreography for short flows (2-3 steps); orchestration for many steps, branching, or when visibility
            matters.</p>`,
            explanation: 'Choreography is dancers each reacting to the music and to each other; orchestration is a conductor cueing each section. Few dancers self-organize fine; a large complex piece needs a conductor.',
            bestPractices: ['Design a compensation for every reversible step', 'Make steps and compensations idempotent', 'Persist saga state to recover after a crash', 'Choreography for short flows, orchestration for complex ones'],
            commonMistakes: ['Assuming a saga gives ACID isolation', 'Missing compensations for side effects', 'A giant orchestrator that becomes a coupling hub'],
            interviewTip: 'Lead with "no distributed ACID, so local transactions + compensations," then contrast the two styles by workflow complexity. Mentioning the lack of isolation is a senior signal.',
            followUp: ['What happens if a compensation fails?', 'What is a semantic lock in a saga?', 'How does the outbox relate to sagas?'],
            seniorPerspective: 'I default to choreography for two or three steps to keep services autonomous, and switch to an explicit orchestrator the moment the workflow branches or needs an audit trail. The case I design first is partial success — stock reserved, payment declined — because that is where naive implementations leak money or inventory.'
        },
        {
            question: 'What is the dual-write problem and how does the transactional outbox solve it?',
            difficulty: 'hard',
            answer: `<p>The <strong>dual-write problem</strong>: a service updates its database and publishes an event
            as two separate operations. A crash between them either loses the event (DB committed, publish failed)
            or emits a phantom event (published, DB rolled back). A DB and a broker cannot be in one atomic
            transaction.</p>
            <p>The <strong>transactional outbox</strong> writes the event into an outbox table in the same local DB
            transaction as the business change. A relay (polling or change-data-capture) publishes unsent rows and
            marks them sent. Delivery becomes at-least-once, so consumers must be idempotent.</p>`,
            explanation: 'Instead of updating your ledger and mailing a letter as two risky separate acts, you write both the ledger entry and "letter to send" on the same page in one stroke; a mail clerk later posts the letters and ticks each off.',
            bestPractices: ['Business row + outbox row in one transaction', 'Publish via CDC (Debezium) or a polling relay', 'Make consumers idempotent (dedupe on event id)', 'Include event id + occurred-at for dedup/ordering'],
            commonMistakes: ['Publishing directly and hoping it succeeds', 'Assuming exactly-once delivery', 'No consumer-side dedup'],
            interviewTip: 'State plainly: "a DB and broker cannot be atomic, so make the event part of the DB transaction." Naming CDC/Debezium and at-least-once shows real experience.',
            followUp: ['What is the inbox pattern?', 'CDC vs polling relay?', 'How do you preserve event ordering with an outbox?']
        },
        {
            question: 'Why must event consumers be idempotent, and how do you implement idempotency?',
            difficulty: 'hard',
            answer: `<p>Reliable messaging is <strong>at-least-once</strong> — brokers redeliver on timeout, outbox
            relays may re-publish after a crash, consumers may re-read after a failed ack — so the same event can
            arrive more than once. Idempotency means processing a duplicate has no extra effect, essential when the
            handler charges money or decrements stock.</p>
            <p>Implement with a <strong>dedup/inbox table</strong> (record each processed message id under a unique
            key, in the same transaction as the side effect; a duplicate insert fails and you skip), an
            <strong>idempotency key</strong> upsert, or <strong>naturally idempotent</strong> operations (set status
            = Paid rather than increment).</p>`,
            explanation: 'A duplicate instruction is like being told twice to ship order #123. An idempotent worker checks a ledger — "did I already ship #123?" — before acting, so twice does no harm.',
            bestPractices: ['Persist processed message ids and check before acting', 'Dedup insert + side effect in one transaction', 'Prefer state-setting over incremental operations'],
            commonMistakes: ['Assuming exactly-once exists', 'Checking "already processed?" in a separate transaction (race)', 'Non-unique dedup key'],
            interviewTip: 'Anchor on "delivery is at-least-once, so handlers must be idempotent," then describe the inbox table committed with the side effect.',
            followUp: ['How is exactly-once approximated in Kafka?', 'Where do you store dedup keys at high volume?', 'How does idempotency interact with saga compensations?']
        },
        {
            question: 'With database-per-service, how do you answer a query that needs data from several services?',
            difficulty: 'advanced',
            answer: `<p>No cross-service JOIN is possible. Options in increasing decoupling: <strong>API
            composition</strong> (an aggregator calls each service and joins in memory — simple but adds latency and
            couples to callee availability), and <strong>CQRS read model</strong> (a denormalized query store built
            by subscribing to services' events — reads hit one optimized store, at the cost of eventual consistency
            and maintaining the projection).</p>
            <p>Use composition for simple, low-fan-out reads; move to a CQRS read model when the query is hot, spans
            many services, or needs rich filtering/sorting.</p>`,
            explanation: 'Instead of walking to five departments for every combined report (composition), you keep a continuously-updated summary binder (read model) each department writes to — instant to read, but momentarily behind.',
            bestPractices: ['API composition for simple low-fan-out reads', 'CQRS read model for hot, cross-service, filter-heavy reads', 'Rebuild projections from the event log when the model changes', 'Idempotent projection updates'],
            commonMistakes: ['Reaching into another service database to join', 'Composing across many services on a hot path', 'Forgetting the read model is eventually consistent'],
            interviewTip: 'Open with "no cross-service joins — each owns its data," then present composition vs CQRS as a latency/consistency trade-off.',
            followUp: ['How do you rebuild a CQRS read model after a bug?', 'How stale can a read model be?', 'How does this relate to event sourcing?']
        },
        {
            question: 'Why does two-phase commit (2PC) not scale for microservices, and what is used instead?',
            difficulty: 'hard',
            answer: `<p>2PC has a coordinator ask participants to prepare, then commit. It does not scale because it
            is <strong>blocking</strong> (participants hold locks between prepare and commit; a stalled coordinator
            freezes everyone), it hurts <strong>availability</strong> (needs all participants up at once — overall
            availability is the product of each), and it creates <strong>coupling</strong> (shared coordinator,
            exposed transaction internals) that defeats service autonomy.</p>
            <p>Instead, microservices use <strong>sagas with eventual consistency</strong>: local transactions plus
            compensating actions, coordinated by events or an orchestrator.</p>`,
            explanation: 'A synchronized transaction across services is like requiring five people in different cities to sign a document at the exact same second — if any one is unreachable, nobody can proceed, and everybody waits with pen in hand.',
            bestPractices: ['Use sagas + compensations instead of 2PC', 'Keep strong consistency within a single service', 'Design for eventual consistency across services'],
            commonMistakes: ['Trying distributed ACID across services', 'Holding cross-service locks', 'Assuming 2PC is fine "at our scale" until it stalls'],
            interviewTip: 'Name the three killers — blocking, availability product, coupling — then pivot to sagas as the accepted alternative.',
            followUp: ['How does a saga differ from 2PC?', 'What is the coordinator single-point-of-failure problem?', 'When is strong consistency still required?']
        },
        {
            question: 'What is event sourcing, and what are its benefits and costs?',
            difficulty: 'advanced',
            answer: `<p><strong>Event sourcing</strong> stores state as an append-only log of events rather than
            current state; you derive current state by replaying events. Benefits: a complete audit trail (every
            change is a recorded fact), time-travel to any past state, and a natural fit with CQRS (project events
            into many read models).</p>
            <p>Costs: a steep learning curve, querying current state requires projections/snapshots, and
            <strong>event schema versioning</strong> over time is genuinely hard. Use it where audit and temporal
            queries are valuable (finance, compliance), not as a default everywhere.</p>`,
            explanation: 'Instead of keeping only your current bank balance, you keep every deposit and withdrawal and add them up. You can see exactly how you got here and reconstruct any past balance — but you must re-add the list to know "how much now?"',
            bestPractices: ['Use for audit-heavy/temporal domains', 'Pair with CQRS projections + snapshots', 'Plan event versioning from the start'],
            commonMistakes: ['Event sourcing everything by default', 'No snapshotting, so replay gets slow', 'Ignoring event schema evolution'],
            interviewTip: 'Balance benefits (audit, time travel, CQRS fit) against real costs (versioning, complexity) — and say it is not a default.',
            followUp: ['How do snapshots speed up replay?', 'How do you version events over time?', 'How does event sourcing pair with CQRS?']
        },
        {
            question: 'How do you decide which data can be eventually consistent and which must be strongly consistent?',
            difficulty: 'hard',
            answer: `<p>Classify by the <strong>cost of being wrong for a moment</strong>. Data where brief staleness
            is harmless (a product view count, a recommendation, a dashboard) can be eventually consistent across
            services. Data where a temporary inconsistency causes real harm (charging a card twice, overselling the
            last unit, regulatory limits) needs strong consistency.</p>
            <p>The practical design: keep the strongly-consistent invariant <strong>inside a single service and its
            transaction</strong> (so ACID still applies locally), and let cross-service propagation be eventual. In
            a betting platform, for example, odds updates propagate eventually, but bet placement and settlement are
            strongly consistent and isolated within their service.</p>`,
            explanation: 'Some facts can lag like a scoreboard that updates a few seconds late (fine); others must be exact the instant they happen, like the till that must never take your money twice.',
            bestPractices: ['Keep money/compliance invariants inside one service transaction', 'Let cross-service propagation be eventual', 'Make the consistency boundary an explicit design decision'],
            commonMistakes: ['Making everything eventually consistent, including payments', 'Spreading a strong invariant across services', 'Not documenting where the consistency boundary is'],
            interviewTip: 'Show you can place the boundary deliberately — "strong within the service that owns the money, eventual across services." That judgment is the whole point.',
            followUp: ['How do you enforce a strong invariant in one service?', 'What is a semantic lock?', 'How does CAP inform this decision?'],
            architectPerspective: 'The most important data decision in a microservices design is drawing the line between what must be strongly consistent and what can converge later. I make that line explicit per capability, because getting it wrong either oversells inventory and double-charges customers, or drags unnecessary distributed-transaction complexity into places that never needed it.'
        }
    ]
});
