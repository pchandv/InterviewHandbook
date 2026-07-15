/* ═══════════════════════════════════════════════════════════════════
   Architecture — Distributed Patterns: CQRS, Event Sourcing, Saga, Outbox
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('arch-distributed', {
    title: 'Distributed Patterns',
    description: 'CQRS, Event Sourcing, Saga, Transactional Outbox, Circuit Breaker, Retry, and Bulkhead — patterns for building reliable, scalable distributed systems.',
    quickRecall: [
        'CQRS: separate read model (denormalized) from write model (normalized)',
        'Event Sourcing: append-only event log IS the source of truth, not current state',
        'Saga orchestration: central coordinator directs steps and compensations',
        'Saga choreography: each service reacts to events — no central coordinator',
        'Circuit Breaker: Closed → Open (fail fast) → Half-Open (probe recovery)',
        'Outbox pattern: write event + business data in same transaction for consistency'
    ],
    sections: [
        {
            title: 'CQRS — Command Query Responsibility Segregation',
            content: `<p><strong>CQRS</strong> separates read operations (queries) from write operations (commands) into different models. At its simplest: different DTOs for reads vs writes. At its most advanced: separate databases optimized for each workload.</p>`,
            mermaid: `flowchart LR
    Client["Client / UI"]
    subgraph CommandSide["Command Side (Write)"]
        direction TB
        Cmd["Command Bus"]
        Handler["Command Handler"]
        Domain["Domain Model<br/>(Aggregates)"]
        WriteDB[("Write DB<br/>(Normalized)")]
        Cmd --> Handler --> Domain --> WriteDB
    end
    subgraph QuerySide["Query Side (Read)"]
        direction TB
        Query["Query Bus"]
        QHandler["Query Handler"]
        ReadDB[("Read DB<br/>(Denormalized)")]
        Query --> QHandler --> ReadDB
    end
    Client -->|"POST /orders"| Cmd
    Client -->|"GET /orders/summary"| Query
    WriteDB -.->|"Domain Events<br/>(async projection)"| ReadDB
    style CommandSide fill:#fef3c7,color:#1e293b
    style QuerySide fill:#dbeafe,color:#1e293b`,
            code: `// Level 1: Separate models (same database)
// Command side — rich domain model, validates, enforces invariants
public class PlaceOrderCommand : IRequest<OrderId>
{
    public CustomerId CustomerId { get; init; }
    public List<OrderLineDto> Lines { get; init; }
}

public class PlaceOrderHandler : IRequestHandler<PlaceOrderCommand, OrderId>
{
    private readonly IOrderRepository _repo;
    
    public async Task<OrderId> Handle(PlaceOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId);
        foreach (var line in cmd.Lines)
            order.AddLine(line.ProductId, line.Price, line.Quantity);
        order.Submit();
        await _repo.SaveAsync(order, ct);
        return order.Id;
    }
}

// Query side — thin, optimized read model (no domain logic)
public class GetOrderSummaryQuery : IRequest<OrderSummaryDto> { public Guid OrderId { get; init; } }

public class GetOrderSummaryHandler : IRequestHandler<GetOrderSummaryQuery, OrderSummaryDto>
{
    private readonly IDbConnection _db; // Direct DB access, no ORM overhead
    
    public async Task<OrderSummaryDto> Handle(GetOrderSummaryQuery q, CancellationToken ct)
    {
        return await _db.QuerySingleOrDefaultAsync<OrderSummaryDto>(
            @"SELECT o.Id, o.Status, o.Total, c.Name AS CustomerName,
                     COUNT(ol.Id) AS LineCount
              FROM Orders o
              JOIN Customers c ON o.CustomerId = c.Id
              LEFT JOIN OrderLines ol ON ol.OrderId = o.Id
              WHERE o.Id = @Id
              GROUP BY o.Id, o.Status, o.Total, c.Name",
            new { Id = q.OrderId });
    }
}

// Level 2: Separate databases (read replica or denormalized store)
// Write DB: Normalized SQL (3NF, optimized for writes)
// Read DB: Denormalized views, Redis cache, Elasticsearch
// Sync: Domain events → projections update read store

// Level 3: Event Sourcing + CQRS
// Write: Append events to event store
// Read: Project events into materialized read models`,
            language: 'csharp'
        },
        {
            title: 'CQRS Implementation Levels',
            content: `<p>CQRS is a spectrum — start simple and add complexity only when needed. Click each level to see the implementation approach, data flow, and when to upgrade.</p>`,
            tabs: [
                {
                    label: 'Level 1: Same DB, Different Models',
                    content: `<p><strong>Simplest CQRS:</strong> Same database, but commands use rich domain model (EF Core entities) and queries use optimized DTOs (Dapper or raw SQL). ~80% of CQRS benefits at ~20% complexity.</p>
                    <ul>
                        <li><strong>Commands:</strong> MediatR handler → Domain model → EF Core → SQL DB</li>
                        <li><strong>Queries:</strong> MediatR handler → Dapper → SQL DB (same DB, different path)</li>
                        <li><strong>Consistency:</strong> Strong (same DB, same transaction)</li>
                        <li><strong>When to use:</strong> Most applications. Start here.</li>
                    </ul>`,
                    mermaid: `flowchart LR
    C["Controller"]
    C -->|Command| CH["Command Handler<br/>(Domain + EF Core)"]
    C -->|Query| QH["Query Handler<br/>(Dapper, raw SQL)"]
    CH --> DB[("Single SQL Database")]
    QH --> DB`
                },
                {
                    label: 'Level 2: Read Replicas',
                    content: `<p><strong>Medium CQRS:</strong> Write to primary DB, read from replicas or denormalized views. Adds scalability for read-heavy workloads without changing code structure.</p>
                    <ul>
                        <li><strong>Commands:</strong> Write to primary SQL database</li>
                        <li><strong>Queries:</strong> Read from read-replica or materialized views</li>
                        <li><strong>Consistency:</strong> Eventual (replica lag: typically ms to seconds)</li>
                        <li><strong>When to upgrade:</strong> Read/write ratio > 10:1, need to scale reads independently</li>
                    </ul>`,
                    mermaid: `flowchart LR
    C["Controller"]
    C -->|Command| CH["Command Handler"]
    C -->|Query| QH["Query Handler"]
    CH --> Primary[("Primary DB<br/>(writes)")]
    Primary -.->|"async replication"| Replica[("Read Replica<br/>(reads)")]
    QH --> Replica`
                },
                {
                    label: 'Level 3: Separate Stores',
                    content: `<p><strong>Full CQRS:</strong> Different databases for write and read, synced via domain events. Write store normalized for consistency, read store denormalized for query performance.</p>
                    <ul>
                        <li><strong>Commands:</strong> Domain model → SQL (normalized, ACID)</li>
                        <li><strong>Queries:</strong> Elasticsearch, Redis, or Cosmos DB (denormalized, fast)</li>
                        <li><strong>Sync:</strong> Domain events → projector → updates read store</li>
                        <li><strong>When to upgrade:</strong> Complex read patterns, full-text search, or extreme read scalability needed</li>
                    </ul>`,
                    mermaid: `flowchart LR
    C["Controller"]
    C -->|Command| CH["Command Handler"]
    C -->|Query| QH["Query Handler"]
    CH --> WriteDB[("SQL Server<br/>(normalized)")]
    WriteDB -.->|"Domain Events"| Projector["Event Projector"]
    Projector --> ReadDB[("Elasticsearch<br/>(denormalized)")]
    QH --> ReadDB`
                }
            ]
        },
        {
            title: 'Saga Pattern — Distributed Transactions',
            content: `<p>The <strong>Saga pattern</strong> manages data consistency across multiple services without distributed transactions (2PC). Each step has a compensating action that undoes its effect if a later step fails.</p>`,
            mermaid: `sequenceDiagram
    participant O as Order Service
    participant P as Payment Service
    participant I as Inventory Service
    participant N as Notification Service
    
    O->>O: Create Order (PENDING)
    O->>P: Charge Payment
    P-->>O: Payment Success
    O->>I: Reserve Stock
    I-->>O: Stock Reserved
    O->>O: Confirm Order (CONFIRMED)
    O->>N: Send Confirmation
    
    Note over O,I: COMPENSATION (if stock fails):
    I--xO: Stock Unavailable!
    O->>P: Refund Payment (compensate)
    O->>O: Cancel Order (CANCELLED)
    O->>N: Send Cancellation`,
            code: `// Problem: Place order spans 3 services
// 1. Order Service: Create order
// 2. Payment Service: Charge customer
// 3. Inventory Service: Reserve stock
// If step 3 fails, must undo steps 1 and 2!

// CHOREOGRAPHY SAGA — services react to events (decentralized)
// Order Created → Payment charges → Payment Succeeded → Inventory reserves
// If Inventory fails → emits StockReservationFailed
// Payment listens → issues Refund
// Order listens → sets status to Cancelled

// ORCHESTRATION SAGA — central coordinator manages flow (recommended)
public class PlaceOrderSaga : ISaga<PlaceOrderSagaState>
{
    public async Task HandleAsync(OrderSubmittedEvent evt, ISagaContext ctx)
    {
        ctx.State.OrderId = evt.OrderId;
        
        // Step 1: Charge payment
        await ctx.SendAsync(new ChargePaymentCommand
        {
            OrderId = evt.OrderId,
            Amount = evt.Total,
            CustomerId = evt.CustomerId
        });
    }

    public async Task HandleAsync(PaymentChargedEvent evt, ISagaContext ctx)
    {
        ctx.State.PaymentId = evt.PaymentId;
        
        // Step 2: Reserve inventory
        await ctx.SendAsync(new ReserveStockCommand
        {
            OrderId = ctx.State.OrderId,
            Items = ctx.State.Items
        });
    }

    public async Task HandleAsync(StockReservedEvent evt, ISagaContext ctx)
    {
        // All steps succeeded — complete saga
        await ctx.SendAsync(new ConfirmOrderCommand { OrderId = ctx.State.OrderId });
        ctx.Complete();
    }

    // COMPENSATION — undo on failure
    public async Task HandleAsync(StockReservationFailedEvent evt, ISagaContext ctx)
    {
        // Compensate step 1: refund payment
        await ctx.SendAsync(new RefundPaymentCommand
        {
            PaymentId = ctx.State.PaymentId,
            Reason = "Stock unavailable"
        });
        // Cancel order
        await ctx.SendAsync(new CancelOrderCommand
        {
            OrderId = ctx.State.OrderId,
            Reason = evt.Reason
        });
        ctx.Complete();
    }
}`,
            language: 'csharp',
            callout: { type: 'warning', title: 'Sagas are Complex', text: 'Every step needs a compensating action. Consider: what if the compensation fails? You need idempotent operations, retry logic, and dead-letter queues for unrecoverable failures. Only use sagas when you truly need cross-service consistency.' }
        },
        {
            title: 'Transactional Outbox & Resilience Patterns',
            content: `<p>The <strong>Transactional Outbox</strong> ensures reliable event publishing by writing events to a local DB table in the same transaction as the business data. A background process then publishes them to the message broker.</p>`,
            mermaid: `flowchart LR
    subgraph App["Application"]
        Service["Order Service"]
    end
    subgraph DB["Database (single transaction)"]
        Orders[("Orders Table")]
        Outbox[("Outbox Table")]
    end
    subgraph Worker["Background Worker"]
        Processor["Outbox Processor"]
    end
    subgraph Broker["Message Broker"]
        Topic["order-events topic"]
    end
    subgraph Consumers["Downstream Services"]
        Pay["Payment Service"]
        Inv["Inventory Service"]
        Notif["Notification Service"]
    end
    Service -->|"1. Save Order + Event<br/>(same TX)"| DB
    Orders -..- Outbox
    Processor -->|"2. Poll unprocessed"| Outbox
    Processor -->|"3. Publish"| Topic
    Topic --> Pay
    Topic --> Inv
    Topic --> Notif
    style DB fill:#dbeafe,color:#1e293b
    style Broker fill:#fef3c7,color:#1e293b`,
            code: `// Problem: DB write succeeds but message publish fails → inconsistency
// Or: message publishes but DB transaction rolls back → phantom events

// TRANSACTIONAL OUTBOX — atomic write of data + events
public class OrderService
{
    public async Task SubmitOrderAsync(Order order, CancellationToken ct)
    {
        order.Submit(); // Raises domain events internally

        using var transaction = await _db.BeginTransactionAsync(ct);
        
        // Save order (business data)
        await _db.Orders.AddAsync(order, ct);
        
        // Save outbox messages (in SAME transaction)
        foreach (var evt in order.DomainEvents)
        {
            await _db.OutboxMessages.AddAsync(new OutboxMessage
            {
                Id = Guid.NewGuid(),
                Type = evt.GetType().FullName,
                Payload = JsonSerializer.Serialize(evt),
                CreatedAt = DateTime.UtcNow,
                ProcessedAt = null
            }, ct);
        }
        
        await _db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        // Both data AND events committed atomically!
    }
}

// Background worker publishes outbox messages to broker:
public class OutboxProcessor : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var messages = await _db.OutboxMessages
                .Where(m => m.ProcessedAt == null)
                .OrderBy(m => m.CreatedAt)
                .Take(100)
                .ToListAsync(ct);

            foreach (var msg in messages)
            {
                await _messageBus.PublishAsync(msg.Type, msg.Payload, ct);
                msg.ProcessedAt = DateTime.UtcNow;
            }
            await _db.SaveChangesAsync(ct);
            await Task.Delay(TimeSpan.FromSeconds(1), ct);
        }
    }
}

// CIRCUIT BREAKER — prevent cascading failures
builder.Services.AddHttpClient("PaymentApi")
    .AddPolicyHandler(Policy
        .Handle<HttpRequestException>()
        .OrResult<HttpResponseMessage>(r => r.StatusCode >= HttpStatusCode.InternalServerError)
        .CircuitBreakerAsync(
            handledEventsAllowedBeforeBreaking: 3,
            durationOfBreak: TimeSpan.FromSeconds(30)
        ));

// RETRY with exponential backoff
builder.Services.AddHttpClient("InventoryApi")
    .AddPolicyHandler(Policy
        .Handle<HttpRequestException>()
        .WaitAndRetryAsync(3, attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt))));`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'What is CQRS and when should you use it?',
            difficulty: 'medium',
            answer: `<p><strong>CQRS</strong> separates the write model (commands that mutate state) from the read model (queries that return data). Use it when read and write workloads have different requirements — different schemas, different scaling needs, or when the domain model is complex but reads need simple, denormalized views.</p>`,
            mermaid: `flowchart LR
    UI["Client"]
    UI -->|"Commands<br/>(PlaceOrder, CancelOrder)"| CmdHandler["Command Handler<br/>(validates, enforces rules)"]
    CmdHandler --> WriteDB[("Write Model<br/>Normalized SQL")]
    WriteDB -.->|"Domain Events<br/>(async)"| Projector["Event Projector"]
    Projector --> ReadDB[("Read Model<br/>Denormalized Views")]
    UI -->|"Queries<br/>(GetOrderSummary)"| QueryHandler["Query Handler<br/>(thin, fast)"]
    QueryHandler --> ReadDB`,
            code: `// When CQRS adds value:
// 1. Read/write ratio is heavily skewed (1000:1 reads to writes)
// 2. Read model needs denormalization (dashboards, reports)
// 3. Write model needs rich domain logic (validation, invariants)
// 4. Different scaling: reads scale with replicas, writes scale with sharding
// 5. Event sourcing: events are the write model, projections are read models

// When CQRS is overkill:
// 1. Simple CRUD with same model for reads and writes
// 2. Small application with low traffic
// 3. Team unfamiliar with the pattern (adds cognitive load)

// Simple CQRS (same DB, different models):
// Commands: go through domain model with validation
// Queries: bypass domain, use Dapper/raw SQL for performance

// Advanced CQRS (separate stores):
// Write: SQL Server (normalized, ACID transactions)
// Read: Elasticsearch (full-text search, fast aggregations)
// Sync: Domain events project into read store async

// The trade-off:
// + Optimized read performance (purpose-built read models)
// + Simpler write model (no read concerns polluting domain)
// + Independent scaling of read vs write
// - Eventual consistency between write and read models
// - More code (two models instead of one)
// - Sync complexity (projections, error handling)`,
            language: 'csharp',
            bestPractices: [
                'Start with simple CQRS (same DB, different DTOs) before adding separate stores',
                'Use MediatR or similar to route commands vs queries cleanly',
                'Accept eventual consistency in read models (usually milliseconds delay)',
                'Keep read models purpose-built per view (one per UI screen or API endpoint)'
            ],
            commonMistakes: [
                'Applying CQRS everywhere (most CRUD apps don\'t need it)',
                'Not handling eventual consistency in the UI (stale reads after write)',
                'Making read models too generic (defeats the purpose of optimization)',
                'Coupling command and query models (shared entities between both sides)'
            ],
            interviewTip: 'Show the spectrum: simple CQRS (separate DTOs, same DB) → medium (read replicas) → full (event sourcing + projections). Most teams benefit from simple CQRS without the complexity of separate databases.',
            followUp: ['How does CQRS relate to Event Sourcing?', 'How do you handle eventual consistency in the UI?', 'What is a read model projection?'],
            seniorPerspective: 'I use simple CQRS in every project: MediatR separates commands (rich validation, domain logic) from queries (Dapper, optimized SQL). This gives 80% of CQRS benefits at 20% complexity. Separate databases only when performance demands it.',
            architectPerspective: 'Full CQRS with event sourcing is warranted for financial systems, audit-heavy domains, and high-throughput event processing. For most business applications, simple CQRS (same DB, different models via MediatR) is the sweet spot between complexity and benefit.'
        },
        {
            question: 'What is the Transactional Outbox pattern and why is it needed?',
            difficulty: 'advanced',
            answer: `<p>The <strong>Transactional Outbox</strong> solves the dual-write problem: when you need to both save to a database AND publish a message/event atomically. Without it, if you save to DB then publish, the publish can fail (lost event). If you publish then save, the save can fail (phantom event). The outbox writes both in a single DB transaction, then a background process reliably publishes.</p>`,
            code: `// THE PROBLEM (dual-write):
public async Task PlaceOrder(Order order)
{
    await _db.SaveChangesAsync();      // ✓ Succeeds
    await _messageBus.PublishAsync(     // ✗ Network error!
        new OrderPlacedEvent(order.Id)
    );
    // Result: Order saved but event never published
    // Downstream services never know about the order!
}

// THE SOLUTION (transactional outbox):
public async Task PlaceOrder(Order order)
{
    // Single atomic transaction:
    await _db.Orders.AddAsync(order);
    await _db.OutboxMessages.AddAsync(new OutboxMessage
    {
        Type = "OrderPlaced",
        Payload = Serialize(new OrderPlacedEvent(order.Id)),
        CreatedAt = DateTime.UtcNow
    });
    await _db.SaveChangesAsync(); // BOTH saved atomically!
    // If DB fails → nothing saved (consistent)
    // If DB succeeds → both order AND outbox message exist
}

// Background processor (reliable publisher):
// Polls outbox table → publishes to broker → marks as processed
// If publish fails → retries on next poll
// Guarantees: at-least-once delivery (consumers must be idempotent!)

// Alternative: Change Data Capture (CDC)
// Debezium reads DB transaction log → publishes events automatically
// No outbox table needed, but requires CDC infrastructure

// Consumer idempotency (handling duplicate deliveries):
public class OrderPlacedHandler
{
    public async Task HandleAsync(OrderPlacedEvent evt)
    {
        // Idempotency check:
        if (await _processed.ContainsAsync(evt.EventId))
            return; // Already processed — skip
        
        await ProcessOrder(evt);
        await _processed.AddAsync(evt.EventId);
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Write outbox messages in the SAME transaction as business data',
                'Make consumers idempotent (at-least-once delivery guarantees duplicates)',
                'Add a unique EventId to each outbox message for deduplication',
                'Monitor outbox table size and processing lag (alert if growing)'
            ],
            commonMistakes: [
                'Publishing events outside the DB transaction (dual-write risk)',
                'Not making consumers idempotent (duplicates cause bugs)',
                'Not cleaning up processed outbox messages (table grows unbounded)',
                'Relying on in-memory events that are lost on app crash'
            ],
            interviewTip: 'Draw the sequence diagram: App → DB (save order + outbox in one tx) → Background Worker → Message Broker → Consumer. Explain why this guarantees consistency: either both are saved or neither is. The worker provides reliable delivery.',
            followUp: ['What is Change Data Capture (CDC)?', 'How do you handle outbox processing failures?', 'What is the Inbox pattern (consumer deduplication)?'],
            seniorPerspective: 'I use MassTransit or Wolverine which have built-in outbox support — no manual outbox table management. For simpler cases, EF Core interceptors can automatically capture domain events into an outbox during SaveChanges.',
            architectPerspective: 'The outbox pattern is non-negotiable in event-driven architectures. Without it, you have no delivery guarantees. Combined with the inbox pattern (consumer-side deduplication), you get exactly-once effective processing even with at-least-once delivery infrastructure.'
        },
        {
            question: 'What is Event Sourcing, and what do you gain and lose compared to storing current state?',
            difficulty: 'advanced',
            answer: `<p><strong>Event Sourcing</strong> persists state as an <strong>append-only sequence of immutable events</strong> rather than as a single mutable row. The current state of an aggregate is derived by <strong>replaying its events</strong> from the beginning (often optimized with snapshots). Instead of <code>UPDATE account SET balance = 90</code>, you append <code>MoneyDeposited(100)</code> then <code>MoneyWithdrawn(10)</code> and fold them to get 90.</p>
            <p><strong>What you gain:</strong></p>
            <ul>
                <li><strong>Complete audit history</strong> — every change is a first-class, queryable fact (priceless in finance, compliance, betting).</li>
                <li><strong>Temporal queries</strong> — reconstruct state at any past point in time.</li>
                <li><strong>Rebuildable read models</strong> — project events into new shapes retroactively; fix a projection bug and replay.</li>
                <li><strong>Natural fit with CQRS and domain events</strong> — the events are the write model.</li>
            </ul>
            <p><strong>What you lose:</strong></p>
            <ul>
                <li><strong>Simplicity</strong> — no trivial SQL queries on current state; you need projections.</li>
                <li><strong>Schema evolution pain</strong> — old events are immutable, so you must version event shapes and upcast them.</li>
                <li><strong>Eventual consistency</strong> between the event store and read models.</li>
                <li><strong>Operational complexity</strong> — snapshots, replay performance, and tooling.</li>
            </ul>`,
            explanation: 'Storing current state is like keeping only your bank account balance. Event sourcing is keeping the full transaction ledger: the balance is just the sum of every deposit and withdrawal. The ledger lets you audit, reconstruct any past balance, and recompute things you never thought to track — but you can no longer glance at one number.',
            code: `// Events are the source of truth — immutable, append-only
public abstract record AccountEvent;
public record AccountOpened(Guid Id, string Owner) : AccountEvent;
public record MoneyDeposited(decimal Amount) : AccountEvent;
public record MoneyWithdrawn(decimal Amount) : AccountEvent;

public class Account
{
    public Guid Id { get; private set; }
    public decimal Balance { get; private set; }

    // Current state is FOLDED from the event stream
    public static Account Rehydrate(IEnumerable<AccountEvent> history)
    {
        var account = new Account();
        foreach (var e in history) account.Apply(e);
        return account;
    }

    private void Apply(AccountEvent e) => Balance = e switch
    {
        AccountOpened o    => 0,
        MoneyDeposited d   => Balance + d.Amount,
        MoneyWithdrawn w   => Balance - w.Amount,
        _ => Balance
    };

    // Behavior validates against derived state, then APPENDS a new event
    public AccountEvent Withdraw(decimal amount)
    {
        if (amount > Balance) throw new DomainException("Insufficient funds");
        var e = new MoneyWithdrawn(amount);
        Apply(e);          // update in-memory state
        return e;          // caller appends to the event store
    }
}

// Snapshot optimization: persist Balance every N events so rehydration
// replays only events since the last snapshot, not the entire history.`,
            language: 'csharp',
            bestPractices: [
                'Version event schemas and upcast old events; never mutate stored events',
                'Use snapshots to bound replay cost for long-lived aggregates',
                'Pair event sourcing with CQRS — project events into read-optimized models',
                'Keep events business-meaningful (MoneyWithdrawn), not technical CRUD (RowUpdated)'
            ],
            commonMistakes: [
                'Applying event sourcing system-wide instead of to the few aggregates that need audit',
                'Storing technical CRUD diffs as events instead of domain-meaningful facts',
                'Forgetting event versioning, so a schema change breaks replay of historical events',
                'Querying current state directly from the event store instead of from projections'
            ],
            interviewTip: 'Use the bank ledger analogy and immediately name the cost: you trade easy current-state queries for a full history. Mention snapshots and projections proactively — they show you understand how it works at scale, not just the concept.',
            followUp: ['How do snapshots work and when do you take them?', 'How do you handle event schema versioning (upcasting)?', 'How does event sourcing combine with CQRS?'],
            seniorPerspective: 'I apply event sourcing surgically — to the handful of aggregates where the audit trail is itself a business requirement (ledgers, bet placement, order lifecycle). Using it everywhere imposes replay, versioning, and projection overhead on simple CRUD that gains nothing, which is how teams end up resenting the pattern.',
            architectPerspective: 'Event sourcing turns history into an asset: you can build read models you never anticipated by replaying the log, and you get audit and temporal queries for free. The architectural commitment is real, though — event versioning is forever, and the team must internalize that events are an immutable contract, not a table they can ALTER.'
        },
        {
            question: 'Compare choreography and orchestration for implementing a Saga. When would you choose each?',
            difficulty: 'advanced',
            answer: `<p>A <strong>Saga</strong> coordinates a multi-step business transaction across services without a distributed (2PC) transaction, using <strong>compensating actions</strong> to undo completed steps on failure. There are two coordination styles:</p>
            <ul>
                <li><strong>Choreography</strong> — no central coordinator. Each service reacts to events and emits its own. Order emits <code>OrderCreated</code>; Payment listens and emits <code>PaymentCaptured</code>; Inventory listens and emits <code>StockReserved</code>. The workflow is the emergent sum of these reactions.</li>
                <li><strong>Orchestration</strong> — a central <strong>orchestrator</strong> (the saga) explicitly commands each step and reacts to results, owning the workflow state and the compensation logic.</li>
            </ul>
            <p><strong>Choose choreography</strong> for short, simple flows (2-3 steps) with few participants, where you want maximum decoupling and no single owner. <strong>Choose orchestration</strong> for complex flows with many steps, branching, or compensation logic, where the explicit, centralized control flow is far easier to understand, debug, and modify.</p>
            <p>The core trade-off: choreography maximizes decoupling but the end-to-end process is implicit and hard to trace; orchestration centralizes the logic (a slight coupling cost) but makes the workflow explicit and observable.</p>`,
            explanation: 'Choreography is a dance troupe with no director — each dancer reacts to the others, and the routine emerges. Beautiful when simple, chaos when complex. Orchestration is a conductor with a score — one entity directs every section. Easier to follow and correct, at the cost of a central figure everyone depends on.',
            mermaid: `flowchart TB
    subgraph Choreography["Choreography (event-driven, no coordinator)"]
        direction LR
        O1["Order"] -->|OrderCreated| P1["Payment"]
        P1 -->|PaymentCaptured| I1["Inventory"]
        I1 -->|StockReserved| S1["Shipping"]
        I1 -.->|StockFailed| P1
    end
    subgraph Orchestration["Orchestration (central saga)"]
        direction TB
        Sg["Order Saga (coordinator)"]
        Sg -->|1. Capture| P2["Payment"]
        Sg -->|2. Reserve| I2["Inventory"]
        Sg -->|3. Ship| S2["Shipping"]
        Sg -.->|compensate: Refund| P2
    end
    style Choreography fill:#fef3c7,color:#1e293b
    style Orchestration fill:#dbeafe,color:#1e293b`,
            code: `// ORCHESTRATION — the saga owns the flow and the compensation explicitly
public class PlaceOrderSaga
{
    public async Task HandleAsync(OrderSubmitted e, ISagaContext ctx)
    {
        ctx.State.OrderId = e.OrderId;
        await ctx.SendAsync(new CapturePayment(e.OrderId, e.Total)); // step 1
    }

    public async Task HandleAsync(PaymentCaptured e, ISagaContext ctx)
    {
        ctx.State.PaymentId = e.PaymentId;
        await ctx.SendAsync(new ReserveStock(ctx.State.OrderId));    // step 2
    }

    public async Task HandleAsync(StockReserved e, ISagaContext ctx)
    {
        await ctx.SendAsync(new ConfirmOrder(ctx.State.OrderId));    // success
        ctx.Complete();
    }

    // Compensation is centralized and easy to follow
    public async Task HandleAsync(StockReservationFailed e, ISagaContext ctx)
    {
        await ctx.SendAsync(new RefundPayment(ctx.State.PaymentId)); // undo step 1
        await ctx.SendAsync(new CancelOrder(ctx.State.OrderId));
        ctx.Complete();
    }
}

// CHOREOGRAPHY equivalent: NO saga class exists. Each service just subscribes:
//   PaymentService:   on OrderCreated  -> capture, emit PaymentCaptured / PaymentFailed
//   InventoryService: on PaymentCaptured -> reserve, emit StockReserved / StockFailed
//   PaymentService:   on StockFailed   -> refund (compensation lives in each service)
// The full workflow is never written down in one place.`,
            language: 'csharp',
            bestPractices: [
                'Use orchestration when the flow has many steps, branches, or compensations',
                'Use choreography for short, stable flows where decoupling matters most',
                'Make every step idempotent and every compensation safe to retry',
                'Persist saga state and add timeouts so a stuck step does not hang forever'
            ],
            commonMistakes: [
                'Using choreography for complex flows, producing implicit logic no one can trace',
                'Forgetting compensating actions, leaving the system in a half-completed state',
                'Assuming compensation always succeeds (it can fail and needs its own handling)',
                'Building synchronous call chains and calling it a saga (no compensation, tight coupling)'
            ],
            interviewTip: 'State the decision rule crisply: choreography for simple/decoupled, orchestration for complex/observable. Then add the killer detail — in choreography the end-to-end process exists nowhere as a single artifact, which is what makes debugging hard.',
            followUp: ['How do you handle a compensation that itself fails?', 'How does a saga differ from a two-phase commit?', 'How do you monitor a long-running saga?'],
            seniorPerspective: 'I default to orchestration for anything beyond three steps because the explicit state machine is dramatically easier to debug at 3am than tracing events across five services. Choreography is elegant on a whiteboard but the operational cost of an implicit workflow is routinely underestimated.',
            architectPerspective: 'The choice is really about where the business process should live. Orchestration makes the process a first-class, versioned artifact you can reason about and evolve; choreography spreads it across services as emergent behavior. For regulated or revenue-critical workflows I want that process explicit, observable, and owned — which almost always means orchestration.'
        },
        {
            question: 'Explain the Circuit Breaker, Retry, and Bulkhead patterns. How do they work together to prevent cascading failures?',
            difficulty: 'hard',
            answer: `<p>These three <strong>stability patterns</strong> protect a service when a downstream dependency degrades, stopping one slow component from taking down the whole system.</p>
            <ul>
                <li><strong>Retry</strong> — transparently re-attempt a failed call, ideally with <strong>exponential backoff + jitter</strong>. Handles transient blips (a dropped packet, a brief restart). Only safe for <strong>idempotent</strong> operations, and must have a bounded attempt count or it amplifies load.</li>
                <li><strong>Circuit Breaker</strong> — after a failure threshold, it <strong>trips open</strong> and fails fast for a cooldown period instead of hammering a dead dependency. After the cooldown it goes <strong>half-open</strong>, lets a trial request through, and either closes (recovered) or re-opens. This gives the downstream room to recover and frees the caller resources.</li>
                <li><strong>Bulkhead</strong> — isolates resources (separate connection/thread pools per dependency) so a flood of slow calls to one service cannot consume all threads and starve calls to healthy services. Named after a ship hull compartment that contains flooding.</li>
            </ul>
            <p>Together they form layered defense: <strong>Bulkhead</strong> contains the blast radius, <strong>Retry</strong> absorbs transient faults, and the <strong>Circuit Breaker</strong> stops retries from piling onto a genuinely failing dependency. Critically, retry must sit <em>inside</em> the breaker so that an open circuit short-circuits the retries rather than multiplying them.</p>`,
            explanation: 'A circuit breaker is the electrical one in your house: when there is a fault it trips to protect the wiring, and you reset it after the problem clears. Bulkheads are a ship hull divided into sealed compartments so one breach does not sink the vessel. Retry is simply knocking on the door again — useful once or twice, foolish a hundred times in a row.',
            code: `// Polly resilience pipeline (.NET 8) — order matters: timeout -> retry -> circuit breaker
builder.Services.AddHttpClient("payments", c =>
    {
        c.BaseAddress = new Uri("http://payment-svc");
    })
    .AddResilienceHandler("payments-pipeline", pipeline =>
    {
        // Innermost: per-attempt timeout so one hung call cannot block forever
        pipeline.AddTimeout(TimeSpan.FromSeconds(2));

        // Retry transient faults — bounded, exponential, jittered (idempotent calls only)
        pipeline.AddRetry(new HttpRetryStrategyOptions
        {
            MaxRetryAttempts = 3,
            BackoffType = DelayBackoffType.Exponential,
            UseJitter = true
        });

        // Circuit breaker wraps the retries: if failures persist, trip OPEN and fail fast
        pipeline.AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
        {
            FailureRatio = 0.5,                       // open when >50% of calls fail
            MinimumThroughput = 10,                   // ... over a meaningful sample
            SamplingDuration = TimeSpan.FromSeconds(30),
            BreakDuration = TimeSpan.FromSeconds(15)  // cooldown before half-open trial
        });
    });

// BULKHEAD: give each downstream its OWN client/pool so a slow dependency
// cannot exhaust the threads/connections that healthy dependencies rely on.
builder.Services.AddHttpClient("inventory");   // separate pipeline + pool
builder.Services.AddHttpClient("notifications"); // isolated from the others`,
            language: 'csharp',
            bestPractices: [
                'Place retry inside the circuit breaker so an open circuit stops retry amplification',
                'Always use bounded retries with exponential backoff and jitter',
                'Give each downstream dependency its own bulkhead (pool) to isolate failures',
                'Set an explicit, aggressive timeout on every remote call'
            ],
            commonMistakes: [
                'Retrying non-idempotent operations, causing duplicate side effects',
                'Unbounded or synchronized retries that create a thundering-herd retry storm',
                'No circuit breaker, so callers keep hammering a dead dependency and exhaust threads',
                'A single shared pool, so one slow dependency starves calls to all the others'
            ],
            interviewTip: 'Walk the circuit breaker state machine out loud: closed to open at the threshold, open fails fast during cooldown, half-open trials one request, then closes or re-opens. Then add the ordering insight: retry must be inside the breaker, not outside.',
            followUp: ['Why must retries be limited to idempotent operations?', 'How does the half-open state decide whether to close?', 'How do bulkheads differ from rate limiting?'],
            seniorPerspective: 'The subtle bug I watch for is retry-outside-breaker, where a tripped circuit still gets multiplied retry traffic. I also treat timeouts as a budget that tightens down the call chain, so a deep dependency can never blow the top-level SLA. The biggest real-world win, though, is deleting non-critical synchronous calls entirely by moving them onto a bus.',
            architectPerspective: 'These patterns are table stakes, but they treat symptoms. Cascading failure is fundamentally a coupling problem, so at the architecture level I minimize synchronous fan-out, make each service degrade independently with sensible fallbacks, and keep non-critical dependencies off the critical path. Resilience libraries buy time; decoupling removes the failure mode.'
        },
        {
            question: 'In a distributed system, why is true exactly-once delivery impractical, and how do you achieve exactly-once effects instead?',
            difficulty: 'expert',
            answer: `<p>True <strong>exactly-once delivery</strong> over a network is impractical because of the <strong>two-generals problem</strong>: after a consumer processes a message, its acknowledgment can be lost in transit. The broker, never seeing the ack, must either redeliver (risking a duplicate = at-least-once) or not redeliver (risking loss = at-most-once). It cannot distinguish a lost ack from a crashed consumer, so a duplicate is always possible.</p>
            <p>The practical answer is to accept <strong>at-least-once delivery</strong> and make processing <strong>idempotent</strong>, yielding exactly-once <em>effects</em>. Techniques:</p>
            <ul>
                <li><strong>Inbox / dedup table</strong> — record each processed message id under a unique constraint, in the <em>same transaction</em> as the side effect. A redelivered message fails the insert and is safely skipped.</li>
                <li><strong>Natural idempotency</strong> — design operations as set-based or upserts (<code>SET status = Paid</code>) rather than deltas (<code>balance += 10</code>).</li>
                <li><strong>Optimistic concurrency / conditional writes</strong> — a version or ETag rejects a stale duplicate.</li>
                <li><strong>Idempotency keys</strong> — a client-supplied stable key lets the server return the original result on retry.</li>
            </ul>
            <p>Combined with a <strong>transactional outbox</strong> on the producer (no lost or phantom publishes), inbox + idempotent handlers give end-to-end exactly-once effects on top of at-least-once infrastructure.</p>`,
            explanation: 'Two generals on opposite hills must attack together, but every messenger they send might be captured, and so might the reply confirming receipt. They can never be perfectly certain the other got the message. So you stop chasing certainty: assume messages may arrive twice and make acting on a duplicate harmless — like writing down each order number you have filled so a repeat order ticket is simply ignored.',
            code: `// Inbox pattern: dedup id + side effect committed atomically
public async Task HandleAsync(PaymentReceived msg, CancellationToken ct)
{
    await using var tx = await _db.Database.BeginTransactionAsync(ct);

    // Unique index on MessageId enforces deduplication
    _db.ProcessedMessages.Add(new ProcessedMessage { MessageId = msg.MessageId });
    try
    {
        await _db.SaveChangesAsync(ct); // throws on duplicate key -> already handled
    }
    catch (DbUpdateException) when (IsUniqueViolation())
    {
        await tx.RollbackAsync(ct);
        return; // idempotent skip — a redelivery, not new work
    }

    // Side effect committed in the SAME transaction as the dedup record.
    // A crash between them cannot leave "processed but not applied".
    var order = await _db.Orders.FindAsync(new object[] { msg.OrderId }, ct);
    order!.MarkPaid();              // set-based, naturally idempotent
    await _db.SaveChangesAsync(ct);
    await tx.CommitAsync(ct);
}`,
            language: 'csharp',
            bestPractices: [
                'Assume at-least-once delivery and make every consumer idempotent',
                'Use a stable, producer-assigned message id for dedup, not a broker id that changes on redelivery',
                'Commit the dedup record and the side effect in one transaction (inbox pattern)',
                'Pair with a transactional outbox on the producer to avoid lost or phantom events'
            ],
            commonMistakes: [
                'Believing a broker offers true exactly-once delivery and skipping idempotency',
                'Recording the message id and performing the side effect in two separate transactions',
                'Using non-deterministic dedup keys so retries look like brand-new messages',
                'Incremental operations (balance += amount) that double-apply on redelivery'
            ],
            interviewTip: 'Say the sentence interviewers are listening for: "exactly-once delivery is impossible, so I get exactly-once effect via at-least-once delivery plus an idempotent consumer." Then explain the inbox table and why dedup + side effect must share one transaction.',
            followUp: ['How does Kafka exactly-once semantics (idempotent producer + transactions) actually work?', 'How do you bound the growth of the dedup/inbox table?', 'How do poison messages and dead-letter queues fit in?'],
            seniorPerspective: 'I pair a producer-side outbox with a consumer-side inbox, give the inbox a retention window so it does not grow unbounded, and wire dead-letter queues with alerting. A message that fails repeatedly is a poison message — it must not block the partition, and silently dropping it loses data, so it needs a deliberate quarantine-and-alert path.',
            architectPerspective: 'Idempotency is a system-wide contract, not a per-handler afterthought. I ship a shared messaging library that enforces stable message ids and the inbox pattern so teams cannot accidentally deploy a non-idempotent consumer. Partition keys (typically by aggregate id) are designed up front so related events stay ordered while still allowing throughput — ordering and exactly-once effect are intertwined with the partitioning strategy.'
        }
    ,
        {
            question: 'What problem does distributed consensus (e.g., Raft) solve, and how does leader election work at a high level?',
            difficulty: 'expert',
            answer: `<p><strong>Consensus</strong> is getting a group of nodes to agree on a single value/state despite failures and network delays \u2014 the basis for a replicated, consistent log (used by etcd, Consul, ZooKeeper, Kafka controllers). <strong>Raft</strong> makes this understandable by decomposing it into leader election, log replication, and safety.</p>
            <ul>
                <li><strong>Leader election</strong> \u2014 nodes are followers; if a follower hears nothing for a randomized timeout it becomes a candidate, increments the <em>term</em>, and requests votes. A node winning a <strong>majority</strong> becomes leader.</li>
                <li><strong>Log replication</strong> \u2014 the leader accepts writes, replicates entries to followers, and commits once a majority acknowledges.</li>
                <li><strong>Safety via quorum</strong> \u2014 majority voting + terms prevent two leaders\u2019 conflicting decisions; a partitioned minority cannot make progress.</li>
            </ul>`,
            explanation: 'It is like a committee that must always have exactly one chairperson making decisions. If members stop hearing from the chair, someone calls a new election; whoever gets a majority of votes leads. A splinter group without a majority simply cannot pass motions.',
            bestPractices: ['Use a proven consensus system (etcd/Consul/ZooKeeper) rather than building your own', 'Run an odd number of nodes (3/5) so a majority is well-defined', 'Understand that a minority partition cannot make progress (CP under partition)', 'Keep the replicated state small \u2014 consensus is for coordination, not bulk data'],
            commonMistakes: ['Rolling your own consensus (notoriously hard to get right)', 'Even-numbered clusters that can split-vote', 'Expecting availability in the minority side of a partition', 'Putting high-throughput application data through the consensus log'],
            interviewTip: 'Anchor on "agreement despite failures via majority quorum + terms," then sketch Raft\u2019s election (randomized timeout \u2192 candidate \u2192 majority vote). Note that the minority partition cannot progress \u2014 that is the CP trade-off made concrete.',
            followUp: ['Why an odd number of nodes?', 'How does Raft prevent two simultaneous leaders?', 'How does this relate to the CAP theorem?'],
            seniorPerspective: 'I never build consensus myself \u2014 I delegate it to etcd/Consul/ZooKeeper and treat them as the coordination backbone. What I do reason about is the implication: the cluster is unavailable on the minority side of a partition, so I design the rest of the system to tolerate that.',
            architectPerspective: 'Consensus is the foundation under leader election, distributed locks, config, and service discovery. Recognizing that these all reduce to "agree via a majority quorum" \u2014 and that it costs availability under partition \u2014 lets me use one well-understood primitive instead of reinventing coordination per subsystem.'
        },
        {
            question: 'How do distributed locks work, and why are they dangerous? How would you implement one safely?',
            difficulty: 'expert',
            answer: `<p>A <strong>distributed lock</strong> coordinates mutually-exclusive access across processes/nodes (e.g., only one worker runs a job). A common approach is a key in Redis with <code>SET key token NX PX ttl</code> or a lease in a consensus store (etcd/ZooKeeper ephemeral node).</p>
            <p>They are dangerous because of <strong>timing</strong>: a holder can be paused (GC, VM stall) past the TTL, the lock expires, another node acquires it, and now <em>two</em> nodes believe they hold it \u2014 corrupting whatever the lock protected. Mitigations: a <strong>fencing token</strong> (monotonically increasing number issued with the lock; the protected resource rejects writes with a stale token), short leases with renewal, and \u2014 most importantly \u2014 designing the protected operation to be <strong>idempotent</strong> so a brief double-execution is harmless.</p>`,
            explanation: 'A distributed lock is a "do not disturb" sign on a shared room. The danger: you hang the sign, step out frozen (GC pause), the sign auto-expires, someone else enters \u2014 now two people are rearranging the room at once. A fencing token is a numbered ticket the room checks, so the stale holder\u2019s changes are refused.',
            code: `// Redis lock with token (NX PX) \u2014 necessary but NOT sufficient
var token = Guid.NewGuid().ToString();
bool got = await redis.StringSetAsync(key, token, TimeSpan.FromSeconds(10), When.NotExists);
// ... do work ...
// Release ONLY if we still own it (token check via Lua, atomic)
// if redis.get(key)==token then redis.del(key)
//
// SAFER: the protected resource enforces a fencing token:
// writes must carry a token >= the highest seen; stale (paused) holders are rejected.`,
            language: 'csharp',
            bestPractices: ['Always release with an ownership (token) check, never a blind DEL', 'Use fencing tokens so the protected resource rejects stale lock holders', 'Keep critical sections short; renew leases for long work', 'Design the protected operation to be idempotent so double-execution is safe'],
            commonMistakes: ['Assuming a TTL lock guarantees mutual exclusion (GC/VM pauses break it)', 'Releasing a lock without verifying ownership (deleting a newer holder\u2019s lock)', 'No fencing token, so a paused holder corrupts state after expiry', 'Using a distributed lock where idempotency/optimistic concurrency would be safer'],
            interviewTip: 'The differentiating insight: a TTL lock alone is unsafe because of process pauses \u2014 you need fencing tokens and/or idempotency. Many candidates stop at "use Redis SET NX"; going further is the senior signal.',
            followUp: ['What exactly is a fencing token and who validates it?', 'Why is Redlock controversial?', 'When can you avoid the lock entirely with idempotency?'],
            seniorPerspective: 'My first instinct is to avoid distributed locks \u2014 if I can make the operation idempotent or use optimistic concurrency (a version/ETag), I do, because locks invite the pause-past-TTL failure. When I must lock, I insist on fencing tokens; a bare TTL lock is a correctness bug waiting for a GC pause.',
            architectPerspective: 'Distributed locks are a tempting but leaky abstraction \u2014 they imply a safety they cannot fully deliver across asynchronous networks. I architect around them where possible (idempotency, single-writer partitioning, optimistic concurrency), reserving true locks for short, fenced, last-resort coordination.'
        },
        {
            question: 'Why can you not rely on wall-clock time for ordering in distributed systems, and what are logical/vector clocks?',
            difficulty: 'expert',
            answer: `<p>Physical clocks on different machines drift and are only loosely synchronized (NTP), so wall-clock timestamps cannot reliably order events across nodes \u2014 event A may have a later timestamp than B yet actually have happened first. This breaks "last write wins" and causal reasoning.</p>
            <ul>
                <li><strong>Lamport clocks</strong> \u2014 a per-node counter incremented on events and carried on messages (receiver sets its clock to max(local, received)+1). They give a consistent <em>total-ish</em> order respecting causality, but cannot tell you whether two events are concurrent.</li>
                <li><strong>Vector clocks</strong> \u2014 each node tracks a vector of all nodes\u2019 counters; comparing vectors tells you if one event <em>happened-before</em> another or if they are <strong>concurrent</strong> (conflicting). Dynamo-style stores use them to detect write conflicts.</li>
            </ul>`,
            explanation: 'Two people in different time zones with slightly wrong watches can\u2019t settle who texted first by comparing watch times. Instead they number their messages and track each other\u2019s counts \u2014 that bookkeeping (logical clocks) reveals true order and spots genuine "at the same time" ties.',
            bestPractices: ['Do not order cross-node events by wall-clock timestamps alone', 'Use logical clocks (Lamport) for causal ordering, vector clocks to detect concurrency/conflicts', 'Pair last-writer-wins with awareness of its lost-update risk under clock skew', 'Consider hybrid logical clocks (HLC) when you want near-physical-time + causality'],
            commonMistakes: ['Using server timestamps for "last write wins" and silently losing updates', 'Assuming NTP makes clocks accurate enough to order fine-grained events', 'Ignoring concurrent writes that vector clocks would flag as conflicts', 'Confusing Lamport (no concurrency detection) with vector clocks (detects it)'],
            interviewTip: 'Lead with "clocks drift, so timestamps don\u2019t order events," then distinguish Lamport (causal order, no concurrency detection) from vector clocks (detects concurrent/conflicting writes). Citing Dynamo\u2019s use of vector clocks shows real grounding.',
            followUp: ['How do vector clocks detect a write conflict?', 'What is a hybrid logical clock?', 'How does this connect to last-writer-wins in DynamoDB Global Tables?'],
            seniorPerspective: 'Whenever I see "we\u2019ll just use the timestamp to decide the winner," I flag it \u2014 clock skew makes that a silent data-loss bug. If conflicts matter, I want vector clocks or an explicit conflict-resolution strategy, not a false sense of ordering from wall time.',
            architectPerspective: 'Time and ordering are foundational, under-appreciated concerns in distributed design. Choosing how you order and resolve concurrent events (logical clocks, vector clocks, HLC, CRDTs) is an architectural decision that determines whether your eventually-consistent system silently loses data or correctly converges.'
        }
    ]
});
