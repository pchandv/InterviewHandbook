/* ═══════════════════════════════════════════════════════════════════
   MICROSERVICES — Patterns Catalog
   The core microservices pattern catalog: gateway, aggregator, ACL,
   strangler fig, sidecar/ambassador, saga, outbox, CQRS, event sourcing.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('microservices-patterns', {

    title: 'Microservices: Patterns Catalog',
    level: 5,
    group: 'microservices',
    description: 'A catalog of the patterns that recur across microservices systems — API gateway, aggregator, anti-corruption layer, strangler fig, sidecar/ambassador, saga, transactional outbox, CQRS, and event sourcing — with the problem each solves and its trade-off.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['microservices', 'microservices-data'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Microservices problems recur, and so do their solutions. Knowing the pattern
            <strong>catalog</strong> lets you name the right tool for a situation and explain its trade-off — exactly
            what senior/architect interviews probe. This lesson groups the patterns by the problem they solve and
            deep-dives the ones you must be able to discuss.</p>
            <p>Some patterns are covered in depth elsewhere in this curriculum and cross-linked here: saga, outbox,
            CQRS and event sourcing in <a href="#microservices-data">Data Management</a>; gateway/BFF and discovery
            in <a href="#microservices-communication">Communication</a>; circuit breaker/bulkhead in
            <a href="#microservices-resilience">Resilience</a>.</p>`
        },
        {
            title: 'Pattern Catalog (Reference)',
            content: `<p>The patterns most frequently referenced, grouped by category:</p>`,
            table: {
                headers: ['Pattern', 'Category', 'Problem it solves', 'Key trade-off'],
                rows: [
                    ['API Gateway', 'Communication', 'Single entry point: routing, auth, rate limiting', 'Can become a bottleneck/god-object'],
                    ['Backend for Frontend', 'Communication', 'Per-client tailored gateway', 'More gateways to maintain'],
                    ['Aggregator / Composition', 'Communication', 'Combine data from several services', 'Adds latency; couples to callees'],
                    ['Anti-Corruption Layer', 'Integration', 'Translate to/from a legacy or 3rd-party model', 'Extra translation code'],
                    ['Strangler Fig', 'Migration', 'Incrementally replace a monolith', 'Two systems run in parallel'],
                    ['Sidecar / Ambassador', 'Cross-cutting', 'Offload TLS/retries/telemetry to a co-located proxy', 'Extra container/resource per pod'],
                    ['Saga', 'Data consistency', 'Coordinate a transaction across services', 'No isolation; must design compensations'],
                    ['Transactional Outbox', 'Data consistency', 'Atomic DB write + event publish', 'Needs a relay; dedup downstream'],
                    ['CQRS', 'Data model', 'Separate write model from optimized reads', 'Eventual consistency; more moving parts'],
                    ['Event Sourcing', 'Data model', 'State as an append-only event log', 'Learning curve; event versioning'],
                    ['Circuit Breaker', 'Resilience', 'Stop calling a failing dependency', 'Needs tuning; can flap'],
                    ['Bulkhead', 'Resilience', 'Isolate resource pools', 'Lower peak resource utilization']
                ]
            }
        },
        {
            title: 'Edge & Composition Patterns',
            content: `<p><strong>API Gateway</strong> is the single entry point handling routing, auth, and rate
            limiting at the edge; <strong>Backend for Frontend</strong> specializes it per client type. The
            <strong>Aggregator</strong> (a.k.a. API Composition) pattern combines data from multiple services into
            one response — useful for a screen that needs order + payment + shipping data, but it adds latency and
            couples the aggregator to callee availability, so keep it off hot paths and prefer a CQRS read model for
            heavy cross-service queries.</p>`,
            mermaid: `flowchart TB
    Client["Client"] --> Agg["Aggregator / Composition"]
    Agg --> OrderSvc["Order Service"]
    Agg --> PaymentSvc["Payment Service"]
    Agg --> ShipSvc["Shipping Service"]
    Agg --> Resp["Combined response"]`
        },
        {
            title: 'Anti-Corruption Layer (ACL)',
            content: `<p>When your service must integrate with a legacy system or a third-party API whose model is
            messy or different, an <strong>Anti-Corruption Layer</strong> is a translation boundary that converts
            between the external model and your clean internal model. It stops the foreign model from leaking into
            and corrupting your domain.</p>
            <p>It is essential during monolith migration (the new service talks to the legacy via an ACL) and when
            integrating vendors (e.g., wrapping a betting-odds feed like Betradar behind an ACL so the rest of the
            system speaks your own domain language, not the vendor's).</p>`,
            code: `// ACL: translate the external/legacy model into our clean domain model.
public sealed class LegacyPricingAcl : IPricingProvider
{
    private readonly ILegacyPricingApi _legacy;   // messy external contract
    public LegacyPricingAcl(ILegacyPricingApi legacy) => _legacy = legacy;

    public async Task<Price> GetPriceAsync(Sku sku, CancellationToken ct)
    {
        // Call the foreign API, then translate its shape into OUR domain type.
        var raw = await _legacy.GetPrice_v2(sku.Value, ct); // e.g. { amt: "12.50", cur: "USD", flags: 3 }
        return new Price(
            amount: decimal.Parse(raw.amt),
            currency: Currency.From(raw.cur));
        // The legacy 'flags' field and string amounts never leak past this boundary.
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Strangler Fig (Migration)',
            content: `<p>The <strong>Strangler Fig</strong> pattern incrementally replaces a monolith, named after a
            vine that grows around a tree and gradually supplants it. Put a routing facade in front of the monolith,
            extract one capability at a time into a new service, route just that capability's traffic to it, and
            repeat until the monolith can be retired.</p>
            <p>It avoids the enormous risk of a big-bang rewrite: the system keeps working throughout, each slice is
            independently validated, and the monolith remains a fallback. Pair it with an ACL so the new service
            does not inherit the legacy model.</p>`,
            mermaid: `flowchart LR
    Client["Client"] --> Facade["Routing Facade"]
    Facade -->|"migrated capability"| NewSvc["New Service"]
    Facade -->|"not yet migrated"| Mono["Monolith"]
    NewSvc -.->|"ACL"| Mono`
        },
        {
            title: 'Sidecar & Ambassador',
            content: `<p>The <strong>Sidecar</strong> pattern deploys a helper container alongside a service (in the
            same pod) to handle cross-cutting concerns — TLS, retries, metrics, config — without changing the
            service code. This is exactly how a service mesh works (the sidecar proxy is the mesh data plane).</p>
            <p>The <strong>Ambassador</strong> is a specialized sidecar that proxies <em>outbound</em> calls: the
            service talks to a local ambassador, which handles discovery, retries, and TLS to the remote service.
            Both keep language-agnostic infrastructure concerns out of application code, at the cost of an extra
            container per pod.</p>`
        },
        {
            title: 'Data & Consistency Patterns (cross-links)',
            content: `<p>The data-side patterns are the heart of microservices consistency and are covered in depth
            in <a href="#microservices-data">Data Management</a>. In brief:</p>
            <ul>
                <li><strong>Saga</strong> — coordinate a multi-service transaction with local steps + compensations
                (orchestration or choreography). No isolation, so mark provisional state.</li>
                <li><strong>Transactional Outbox</strong> — write the event in the same DB transaction as the
                business change; a relay publishes it. Solves the dual-write problem; consumers must be idempotent.</li>
                <li><strong>CQRS</strong> — separate the write model from denormalized read models built from
                events; answers cross-service queries at the cost of eventual consistency.</li>
                <li><strong>Event Sourcing</strong> — store state as an append-only event log; full audit trail and
                time travel, but event versioning is hard.</li>
            </ul>`
        },
        {
            title: 'Choosing the Right Pattern',
            content: `<p>Patterns are answers to specific problems — apply them to the problem, not for their own
            sake:</p>`,
            table: {
                headers: ['If you need to...', 'Reach for'],
                rows: [
                    ['Give clients one entry point', 'API Gateway (BFF if clients diverge)'],
                    ['Assemble data from many services', 'Aggregator, or CQRS read model if hot'],
                    ['Integrate a legacy/3rd-party model', 'Anti-Corruption Layer'],
                    ['Migrate a monolith safely', 'Strangler Fig (+ ACL)'],
                    ['Add mTLS/telemetry without code changes', 'Sidecar / service mesh'],
                    ['Keep a transaction consistent across services', 'Saga (+ Transactional Outbox)'],
                    ['Answer complex cross-service queries', 'CQRS read model'],
                    ['Contain a failing dependency', 'Circuit Breaker + Bulkhead']
                ]
            },
            callout: {
                type: 'warning',
                title: 'Do not cargo-cult patterns',
                text: 'Every pattern adds moving parts. Event sourcing, CQRS, and a full service mesh each carry real cost. Apply a pattern when its specific problem is present, not because it is on a diagram of "how Netflix does it."'
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Know the catalog by <strong>problem → pattern → trade-off</strong>, not just names</li>
                <li><strong>Gateway/BFF/Aggregator</strong> handle edge and composition; <strong>ACL</strong> isolates foreign models</li>
                <li><strong>Strangler Fig</strong> migrates monoliths safely; <strong>sidecar/ambassador</strong> offload cross-cutting concerns</li>
                <li><strong>Saga, outbox, CQRS, event sourcing</strong> manage distributed data (see Data Management)</li>
                <li>Apply patterns to real problems — every one adds complexity</li>
            </ul>`
        },
        {
            title: 'Continue the Series',
            content: `<p>Previous: <a href="#microservices-deployment">← Deployment &amp; Operations</a> ·
            Back to <a href="#microservices">Overview</a> ·
            Next: <a href="#microservices-testing">Testing →</a></p>`
        }
    ],

    questions: [
        {
            question: 'What is the Anti-Corruption Layer pattern and when do you use it?',
            difficulty: 'medium',
            answer: `<p>An <strong>Anti-Corruption Layer (ACL)</strong> is a translation boundary between your service
            and an external system (legacy or third-party) whose model differs from or would corrupt your domain. It
            converts the foreign model into your clean internal model (and back), so the external model never leaks
            into your code.</p>
            <p>Use it during monolith migration (new service talks to legacy via an ACL) and when integrating
            vendors — e.g., wrapping a betting-odds feed so the rest of the system speaks your domain language, not
            the vendor's field names and quirks.</p>`,
            explanation: 'An ACL is a translator at a border: your side speaks your language, the other side speaks theirs, and the translator ensures neither side has to adopt the other\'s confusing dialect.',
            bestPractices: ['Isolate all foreign-model translation in the ACL', 'Keep your domain model clean of vendor fields', 'Use it for legacy integration during migration'],
            commonMistakes: ['Letting vendor/legacy models spread through the domain', 'Skipping the ACL to "save time", then coupling everywhere', 'Bidirectional leakage of models'],
            interviewTip: 'Emphasize "stops the foreign model corrupting your domain" and give a concrete integration example — that shows practical use, not just definition.',
            followUp: ['How does an ACL help monolith migration?', 'Where does the ACL live — its own service or a library?', 'How does it relate to bounded contexts?']
        },
        {
            question: 'Explain the Strangler Fig pattern and why it beats a big-bang rewrite.',
            difficulty: 'medium',
            answer: `<p>The <strong>Strangler Fig</strong> pattern incrementally replaces a monolith: put a routing
            facade in front, extract one capability at a time into a new service with its own data, route that
            capability's traffic to the new service, and repeat until the monolith is retired.</p>
            <p>It beats a big-bang rewrite because the system keeps working throughout, each extracted slice is
            independently validated and reversible, and risk is spread over many small steps rather than one
            high-stakes cutover. Pair it with an ACL so the new service does not inherit the legacy model.</p>`,
            explanation: 'Rather than demolishing a house while living in it, you build and move into one new room at a time, redirecting daily life room by room until the old structure is empty.',
            bestPractices: ['Front the monolith with a routing facade', 'Extract by bounded context', 'Migrate the highest-value/volatile slice first', 'Use an ACL to avoid leaking the legacy model'],
            commonMistakes: ['Big-bang rewrite', 'Extracting a service that still shares the monolith DB', 'A trivial first slice that proves nothing'],
            interviewTip: 'Contrast explicitly with big-bang and stress "one capability at a time behind a facade" plus the shared-DB trap.',
            followUp: ['How do you split the data during a strangle?', 'What is the routing facade?', 'How do you choose the first capability?']
        },
        {
            question: 'What is the sidecar pattern, and how does it relate to a service mesh?',
            difficulty: 'medium',
            answer: `<p>The <strong>sidecar</strong> pattern deploys a helper container next to a service (same pod)
            to handle cross-cutting concerns — TLS, retries, telemetry, config — without changing service code. It
            keeps language-agnostic infrastructure out of the application.</p>
            <p>A <strong>service mesh</strong> is built on sidecars: each service gets a sidecar proxy (the mesh data
            plane) configured by a central control plane, giving mTLS, traffic policy, and observability uniformly.
            The <strong>ambassador</strong> variant is a sidecar that proxies outbound calls (discovery, retries,
            TLS to remote services).</p>`,
            explanation: 'A sidecar is a co-pilot in the same cockpit who handles radios, navigation, and safety checks so the pilot (your code) can focus on flying — and every plane gets the same standardized co-pilot.',
            bestPractices: ['Offload TLS/retries/telemetry to the sidecar', 'Use sidecars for language-agnostic concerns', 'Account for the extra container per pod'],
            commonMistakes: ['Duplicating sidecar concerns in app code too', 'Ignoring sidecar resource/latency overhead', 'Putting business logic in the sidecar'],
            interviewTip: 'Connect it to the mesh — "the mesh data plane is a sidecar proxy per service" — to show you understand the mechanism.',
            followUp: ['What is the ambassador variant?', 'How does the mesh control plane configure sidecars?', 'What is the sidecar latency cost?']
        },
        {
            question: 'When would you use API composition (aggregator) versus a CQRS read model for cross-service queries?',
            difficulty: 'hard',
            answer: `<p><strong>API composition</strong> has an aggregator call each service at query time and join in
            memory — simple and always fresh, but it adds latency, couples to callee availability, and handles large
            joins or cross-service filtering/sorting poorly. <strong>CQRS read model</strong> maintains a
            denormalized query store updated from events — reads hit one optimized store, at the cost of eventual
            consistency and maintaining the projection.</p>
            <p>Use composition for simple, low-fan-out, low-frequency reads; move to a CQRS read model when the query
            is hot, spans many services, or needs rich filtering/sorting.</p>`,
            explanation: 'Composition is phoning every department for each report (fresh but slow and fragile). A CQRS read model is a continuously-updated summary binder (instant reads, but slightly behind).',
            bestPractices: ['Composition for simple low-fan-out reads', 'CQRS read model for hot, filter-heavy, cross-service reads', 'Rebuild projections from the event log when needed'],
            commonMistakes: ['Composing across many services on a hot path', 'Reaching into another service database to join', 'Forgetting the read model is eventually consistent'],
            interviewTip: 'Frame it as a latency/freshness vs consistency trade-off and give the threshold (hot/large/filter-heavy → CQRS).',
            followUp: ['How do you rebuild a CQRS read model?', 'How stale can a read model be?', 'How does this relate to event sourcing?']
        },
        {
            question: 'How do you avoid cargo-culting microservices patterns?',
            difficulty: 'hard',
            answer: `<p>Apply each pattern to the <strong>specific problem it solves</strong>, and weigh its cost.
            Every pattern adds moving parts: event sourcing adds versioning and replay complexity, CQRS adds a second
            model and eventual consistency, a full service mesh adds operational overhead. Adopting them because a
            famous company does, without their scale or problem, is over-engineering.</p>
            <p>Start with the simplest thing that works (often a modular monolith or plain HTTP + a database),
            introduce a pattern when a concrete pain point appears, and be able to state the trade-off you are
            accepting. "It depends on scale, team, and the actual problem" is the mature answer.</p>`,
            explanation: 'Patterns are power tools. A nail gun is great for framing a house and absurd for hanging one picture. Match the tool to the job, not to what the pros on TV use.',
            bestPractices: ['Introduce a pattern against a proven pain point', 'Always state the trade-off you accept', 'Prefer the simplest solution first'],
            commonMistakes: ['Adopting patterns "because Netflix does"', 'Event sourcing/CQRS everywhere by default', 'A mesh for a handful of services'],
            interviewTip: 'Naming the cost of each fancy pattern (and when NOT to use it) signals senior judgment more than reciting the pattern itself.',
            followUp: ['When is a modular monolith the better choice?', 'What is the cost of event sourcing?', 'When is a service mesh premature?'],
            architectPerspective: 'I treat the pattern catalog as a menu of trade-offs, not a checklist to complete. The strongest designs I have seen use the fewest patterns necessary; complexity added "just in case" is complexity you pay for forever, so I require a concrete, current problem before introducing any of the heavyweight ones.'
        },
        {
            question: 'What problem does the API Gateway pattern solve, and how can it become an anti-pattern?',
            difficulty: 'medium',
            answer: `<p>The <strong>API Gateway</strong> gives external clients a single entry point and centralizes
            cross-cutting concerns — routing, authentication, rate limiting, TLS termination, and sometimes
            aggregation — so clients do not call dozens of services directly.</p>
            <p>It becomes an anti-pattern when it accumulates <strong>business logic</strong>, turning into a bloated
            god-object that couples all services to it and becomes a deployment bottleneck and single point of
            failure. Keep it to edge concerns, keep it highly available, and use BFFs when per-client shaping grows.</p>`,
            explanation: 'A gateway is a building reception desk — checking IDs and directing visitors. It goes wrong when reception starts making the decisions that belong to the departments upstairs.',
            bestPractices: ['Keep the gateway to edge concerns only', 'No business logic in the gateway', 'Make it highly available; use BFFs when needed'],
            commonMistakes: ['Business logic creeping into the gateway', 'Single point of failure with no redundancy', 'One gateway trying to serve every client shape'],
            interviewTip: 'Name the edge concerns it owns, then the "no business logic / god-object" failure mode — the boundary is what interviewers probe.',
            followUp: ['What is a BFF?', 'How do you keep the gateway HA?', 'What belongs in the gateway vs the mesh?']
        },
        {
            question: 'What is the Aggregator pattern and what are its downsides on hot paths?',
            difficulty: 'medium',
            answer: `<p>The <strong>Aggregator</strong> (API Composition) pattern has one component call several
            services and combine their responses into a single result — e.g., an order-details view that needs order,
            payment, and shipping data.</p>
            <p>On hot paths its downsides bite: latency is the slowest callee plus overhead (often several
            sequential/parallel calls), and availability drops because the aggregator depends on all callees being
            up. For frequent or heavy cross-service reads, precompute a <strong>CQRS read model</strong> instead so
            the query hits one store.</p>`,
            explanation: 'An aggregator is a personal assistant who phones several departments and compiles one report. Fine occasionally; but if you need that report every second, you keep a pre-compiled summary instead.',
            bestPractices: ['Use for occasional low-fan-out composition', 'Parallelize independent calls', 'Switch to a CQRS read model for hot/heavy reads'],
            commonMistakes: ['Aggregating many services on every request', 'Sequential calls that could be parallel', 'Ignoring the multiplicative availability hit'],
            interviewTip: 'Quantify the availability hit (product of callees) and give the CQRS alternative for hot paths.',
            followUp: ['How does parallelizing calls help?', 'When does composition beat a read model?', 'How does the gateway relate to aggregation?']
        },
        {
            question: 'How would you group the microservices pattern catalog, and why is that framing useful?',
            difficulty: 'medium',
            answer: `<p>Group by the <strong>problem category</strong>: <em>communication/edge</em> (API gateway, BFF,
            aggregator), <em>integration</em> (anti-corruption layer), <em>migration</em> (strangler fig),
            <em>cross-cutting</em> (sidecar/ambassador, service mesh), <em>data consistency</em> (saga, outbox),
            <em>data model</em> (CQRS, event sourcing), and <em>resilience</em> (circuit breaker, bulkhead, retry).</p>
            <p>This framing is useful because in an interview or design you start from a problem ("I need to keep a
            transaction consistent across services") and the grouping leads you straight to the candidate patterns
            and their trade-offs, rather than trying to recall a flat list of names.</p>`,
            explanation: 'It is like organizing a toolbox by job — cutting, fastening, measuring — so when you face a task you go straight to the right drawer instead of rummaging through every tool.',
            bestPractices: ['Map problems to pattern categories', 'Learn one representative pattern per category deeply', 'Always attach the trade-off'],
            commonMistakes: ['Memorizing names without the problem they solve', 'No sense of the trade-offs', 'Picking patterns before defining the problem'],
            interviewTip: 'Answering by category ("for data consistency I would consider a saga plus outbox, trading isolation for availability") shows structured thinking.',
            followUp: ['Which pattern for cross-service queries?', 'Which for safe monolith migration?', 'Which for containing failure?']
        }
    ]
});
