/* ═══════════════════════════════════════════════════════════════════
   Architecture Decision Library
   Kafka vs RabbitMQ, SQL vs NoSQL, Monolith vs Microservices,
   REST vs gRPC, CQRS vs CRUD, and more trade-off analyses.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('architecture-decisions-library', {
    title: 'Architecture Decision Library',
    description: 'Real architecture decisions with trade-off analysis: Kafka vs RabbitMQ, SQL vs NoSQL, Monolith vs Microservices, REST vs gRPC, CQRS vs CRUD, Event Sourcing vs Traditional, Kubernetes vs Container Apps. Each decision includes when to choose what, costs, complexity, and interview discussion points.',
    difficulty: 'expert',
    estimatedMinutes: 50,
    prerequisites: ['arch-styles', 'arch-distributed'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Architecture is not about knowing patterns &mdash; it is about making <strong>decisions</strong>. Senior/staff interviews test your ability to evaluate trade-offs, justify choices, and articulate why one option fits better than another for a given context.</p>
            <p>This section covers the most commonly debated architecture decisions. For each: <strong>when to choose A, when to choose B, hidden costs, and what interviewers want to hear.</strong></p>`
        },
        {
            title: 'Kafka vs RabbitMQ',
            content: `<p>The most common messaging decision in backend interviews.</p>`,
            table: {
                headers: ['Aspect', 'Apache Kafka', 'RabbitMQ'],
                rows: [
                    ['Model', 'Distributed log (append-only)', 'Message broker (queue/exchange)'],
                    ['Ordering', 'Per-partition guaranteed', 'Per-queue (single consumer)'],
                    ['Replay', 'Yes (consumers can rewind)', 'No (message deleted after ACK)'],
                    ['Throughput', 'Millions/sec (sequential I/O)', 'Tens of thousands/sec'],
                    ['Latency', 'Higher (batching)', 'Lower (immediate delivery)'],
                    ['Scaling', 'Horizontal (add partitions)', 'Vertical + clustering'],
                    ['Complexity', 'High (Zookeeper/KRaft, partitions, offsets)', 'Medium (exchanges, bindings)'],
                    ['Best for', 'Event streaming, audit logs, analytics, CDC', 'Task queues, RPC, fan-out notifications'],
                    ['Retention', 'Configurable (days/forever)', 'Until consumed'],
                    ['Consumer model', 'Pull (consumer controls pace)', 'Push (broker delivers)']
                ]
            },
            callout: { type: 'tip', title: 'Interview Answer', text: 'Choose Kafka when you need event replay, ordering at scale, or stream processing. Choose RabbitMQ when you need simple task queues, routing flexibility, or low-latency delivery. If unsure, start with RabbitMQ (simpler) and migrate to Kafka when you need replay or higher throughput.' }
        },
        {
            title: 'SQL vs NoSQL',
            content: `<p>Not a binary choice &mdash; many systems use both (polyglot persistence).</p>`,
            table: {
                headers: ['Aspect', 'SQL (Relational)', 'NoSQL (Document/Key-Value)'],
                rows: [
                    ['Schema', 'Strict (enforced)', 'Flexible (schema-on-read)'],
                    ['Relationships', 'Excellent (JOINs, FKs)', 'Poor (denormalized, embedded)'],
                    ['Transactions', 'ACID (multi-table)', 'Limited (single-document usually)'],
                    ['Scaling', 'Vertical primarily (read replicas for reads)', 'Horizontal (partition/shard natively)'],
                    ['Query flexibility', 'SQL (ad-hoc queries)', 'Limited (query by key/index)'],
                    ['Best for', 'Complex queries, relationships, financial data', 'High write throughput, flexible schema, caching'],
                    ['Examples', 'PostgreSQL, SQL Server, MySQL', 'MongoDB, DynamoDB, Cosmos DB, Redis'],
                    ['Consistency', 'Strong (default)', 'Eventual (configurable)']
                ]
            },
            callout: { type: 'tip', title: 'Interview Answer', text: 'Default to SQL unless you have a specific reason not to. Choose NoSQL when: schema evolves rapidly, you need horizontal write scaling, data is naturally document-shaped, or you need sub-millisecond reads (Redis). Never choose NoSQL just because "it scales better" without understanding your actual scale requirements.' }
        },
        {
            title: 'Monolith vs Microservices',
            content: `<p>The decision that defines system architecture &mdash; and the most misunderstood.</p>`,
            table: {
                headers: ['Aspect', 'Monolith', 'Microservices'],
                rows: [
                    ['Deployment', 'Single unit (all or nothing)', 'Independent per service'],
                    ['Complexity', 'Low (one codebase, one DB)', 'High (networking, discovery, tracing)'],
                    ['Team size', 'Small teams (< 10 devs)', 'Multiple independent teams'],
                    ['Data consistency', 'Easy (single DB, transactions)', 'Hard (eventual consistency, sagas)'],
                    ['Performance', 'In-process calls (nanoseconds)', 'Network calls (milliseconds)'],
                    ['Debugging', 'Easy (single process, stack trace)', 'Hard (distributed tracing required)'],
                    ['Scaling', 'Scale entire app', 'Scale individual services'],
                    ['Time to market', 'Faster initially', 'Faster at scale (independent teams)'],
                    ['Operational cost', 'Low', 'High (K8s, service mesh, observability)']
                ]
            },
            callout: { type: 'warning', title: 'The Right Answer', text: 'Start with a monolith (or modular monolith). Extract microservices ONLY when: (1) you have multiple teams that need to deploy independently, (2) parts of the system have genuinely different scaling needs, or (3) you need technology heterogeneity. Microservices are a scaling solution for ORGANIZATIONS, not for code.' },
            mermaid: `graph TD
    START[New Project] --> Q1{Team size > 10?}
    Q1 -->|No| MONO[Modular Monolith]
    Q1 -->|Yes| Q2{Independent deploy needed?}
    Q2 -->|No| MONO
    Q2 -->|Yes| Q3{Different scaling needs?}
    Q3 -->|No| MONO
    Q3 -->|Yes| MS[Microservices]
    MONO -->|"grows beyond 1 team"| MS

    style MONO fill:#10b981,color:#fff
    style MS fill:#3b82f6,color:#fff`
        },
        {
            title: 'REST vs gRPC',
            content: `<p>API protocol choice depends on context: external/public vs internal/service-to-service.</p>`,
            table: {
                headers: ['Aspect', 'REST (HTTP/JSON)', 'gRPC (HTTP/2 + Protobuf)'],
                rows: [
                    ['Format', 'JSON (text, human-readable)', 'Protobuf (binary, compact)'],
                    ['Performance', 'Slower (text parsing)', 'Faster (binary serialization, HTTP/2 multiplexing)'],
                    ['Streaming', 'Limited (SSE, chunked)', 'Native bidirectional streaming'],
                    ['Browser support', 'Excellent (native)', 'Limited (needs grpc-web proxy)'],
                    ['Contract', 'OpenAPI (optional)', 'Proto files (mandatory, code-gen)'],
                    ['Tooling', 'Postman, curl, browser', 'grpcurl, Evans, BloomRPC'],
                    ['Best for', 'Public APIs, web frontends, CRUD', 'Internal service-to-service, high throughput, streaming'],
                    ['Error handling', 'HTTP status codes', 'Rich status with details']
                ]
            },
            callout: { type: 'tip', title: 'Interview Answer', text: 'Use REST for public/external APIs (browsers, third-party consumers). Use gRPC for internal service-to-service communication where performance matters and you control both ends. Many companies use both: REST at the edge (API gateway), gRPC internally between services.' }
        },
        {
            title: 'CQRS vs CRUD',
            content: `<p>Separating reads from writes adds complexity but enables optimization at scale.</p>`,
            table: {
                headers: ['Aspect', 'CRUD (single model)', 'CQRS (separate read/write)'],
                rows: [
                    ['Complexity', 'Simple (one model, one DB)', 'High (two models, sync between them)'],
                    ['Read optimization', 'Limited (same schema for read/write)', 'Unlimited (denormalized read projections)'],
                    ['Write optimization', 'Limited (read indexes slow writes)', 'Optimized (write model is lean)'],
                    ['Consistency', 'Immediate', 'Eventually consistent (read model lags)'],
                    ['Scaling', 'Scale together', 'Scale reads/writes independently'],
                    ['Best for', 'Simple domains, 80% of applications', 'Read-heavy with complex queries, event-sourced systems'],
                    ['Team overhead', 'Low', 'Higher (maintain two models + projection logic)']
                ]
            },
            callout: { type: 'tip', title: 'Decision Rule', text: 'Use CRUD unless you have: (1) read/write ratio > 100:1 AND (2) complex read queries that conflict with write performance AND (3) team capable of managing eventual consistency. CQRS without Event Sourcing is valid and simpler.' }
        },
        {
            title: 'Event Sourcing vs Traditional Database',
            content: `<p>Event Sourcing stores events (facts) instead of current state. Powerful but complex.</p>`,
            table: {
                headers: ['Aspect', 'Traditional (State Store)', 'Event Sourcing'],
                rows: [
                    ['Storage', 'Current state only', 'All events (immutable log)'],
                    ['History', 'Lost (unless audited separately)', 'Complete (rebuild any past state)'],
                    ['Complexity', 'Low', 'High (projections, snapshots, versioning)'],
                    ['Debugging', 'What IS the state now?', 'What HAPPENED and why? (full audit)'],
                    ['Schema changes', 'Migration (ALTER TABLE)', 'Event versioning (upcasting)'],
                    ['Storage cost', 'Low (only current state)', 'Higher (all events forever)'],
                    ['Best for', 'Most CRUD apps, simple domains', 'Financial systems, audit-heavy, complex domains'],
                    ['Replay', 'Not possible', 'Replay all events to rebuild state or create new projections']
                ]
            },
            callout: { type: 'warning', title: 'Honest Advice', text: 'Event Sourcing is powerful but most teams underestimate the complexity: event versioning, snapshot management, eventual consistency, projection rebuilds. Use it for domains where audit trail IS the product (finance, compliance, gaming). For typical web apps, a regular DB with an audit table is simpler and sufficient.' }
        },
        {
            title: 'Kubernetes vs Azure Container Apps',
            content: `<p>Container orchestration: full control vs managed simplicity.</p>`,
            table: {
                headers: ['Aspect', 'Kubernetes (AKS/EKS)', 'Azure Container Apps / AWS App Runner'],
                rows: [
                    ['Control', 'Full (networking, scheduling, storage)', 'Limited (opinionated defaults)'],
                    ['Complexity', 'High (YAML, networking, RBAC, upgrades)', 'Low (deploy container, done)'],
                    ['Operational cost', 'Dedicated platform team needed', 'Minimal ops (managed scaling, TLS)'],
                    ['Scaling', 'HPA, VPA, custom metrics, KEDA', 'Built-in autoscaling (HTTP or event)'],
                    ['Networking', 'Full control (ingress, service mesh, CNI)', 'Simplified (built-in ingress, mTLS)'],
                    ['Cost', 'Higher (control plane + idle nodes)', 'Lower (scale to zero, pay per use)'],
                    ['Best for', 'Complex workloads, many services, custom networking', 'Simple APIs, event-driven, small teams'],
                    ['Team size for ops', '2-3 platform engineers minimum', '0 (managed)']
                ]
            },
            callout: { type: 'tip', title: 'Decision Rule', text: 'If you have < 10 services and no platform team: Container Apps/App Runner. If you have 20+ services, custom networking needs, or a platform team: Kubernetes. The worst choice is Kubernetes without a team to maintain it.' }
        },
        {
            title: 'How to Present Architecture Decisions',
            content: `<p>Use the <strong>ADR (Architecture Decision Record)</strong> format in interviews:</p>
            <ul>
                <li><strong>Context:</strong> What is the situation? What constraints exist?</li>
                <li><strong>Options:</strong> What alternatives were considered?</li>
                <li><strong>Decision:</strong> What was chosen and why?</li>
                <li><strong>Consequences:</strong> What trade-offs are accepted?</li>
            </ul>
            <p><strong>Interview formula:</strong> "We chose X because [context]. We considered Y but [trade-off]. The consequence is [accepted downside], which we mitigate by [strategy]."</p>`,
            callout: { type: 'tip', title: 'Staff-Level Signal', text: 'Interviewers want to hear trade-off reasoning, not just "we used Kafka." Show you considered alternatives, understood costs, and made a conscious choice. Bonus: mention what would make you switch to the other option.' }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Architecture decisions are about trade-offs, not "best practices"</li>
                <li>Context matters: team size, scale, timeline, domain all affect the right choice</li>
                <li>Default to simpler option unless you have proven need for complexity</li>
                <li>Every decision should be reversible or have a migration path</li>
                <li>Use ADR format in interviews: Context, Options, Decision, Consequences</li>
                <li>The best answer includes: "We would switch to X if [condition changes]"</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'arch-dec-q1',
            level: 'senior',
            title: 'Your team is choosing between Kafka and RabbitMQ. What questions would you ask?',
            answer: `<p><strong>Key questions:</strong></p><ul><li>Do we need to replay events? (Yes = Kafka)</li><li>What throughput do we need? (> 100K msg/sec = Kafka)</li><li>Do we need strict ordering? (Yes per key = Kafka partitions)</li><li>Is this task queue or event stream? (Task queue = RabbitMQ, stream = Kafka)</li><li>What operational expertise does the team have? (No Kafka experience = start RabbitMQ)</li><li>Do downstream consumers need to read at their own pace? (Yes = Kafka)</li></ul><p><strong>Default:</strong> RabbitMQ unless you need replay, high throughput, or stream processing.</p>`
        },
        {
            id: 'arch-dec-q2',
            level: 'architect',
            title: 'When would you choose a monolith over microservices for a new project?',
            answer: `<p><strong>Choose monolith when:</strong></p><ul><li>Team is small (< 8 developers)</li><li>Domain is not well understood yet (boundaries will be wrong)</li><li>Speed to market matters more than scalability</li><li>You cannot afford K8s/service mesh/distributed tracing operational cost</li><li>The system does not have genuinely different scaling needs per component</li></ul><p><strong>Key insight:</strong> Microservices solve organizational scaling problems, not technical ones. A well-structured modular monolith with clear module boundaries can be extracted to microservices later when team grows.</p>`,
            interviewTip: 'Saying "I would start with a monolith" shows experience. Junior engineers say microservices for everything. Staff engineers know when NOT to use them.'
        },
        {
            id: 'arch-dec-q3',
            level: 'senior',
            title: 'SQL or NoSQL for an e-commerce product catalog?',
            answer: `<p><strong>Analysis:</strong></p><ul><li>Product attributes vary widely (electronics vs clothing vs food) = flexible schema needed</li><li>Catalog is read-heavy (1000:1 read/write ratio)</li><li>Complex search with filters (faceted search) needed</li><li>Relationships exist (product &rarr; categories, variants, reviews)</li></ul><p><strong>Decision:</strong> Hybrid approach: PostgreSQL for orders/inventory/transactions (relational, ACID). MongoDB or Elasticsearch for product catalog (flexible schema, fast reads, faceted search). Sync via CDC/events.</p><p><strong>Why not pure NoSQL:</strong> Orders need transactions. Why not pure SQL: product schema varies too much.</p>`
        },
        {
            id: 'arch-dec-q4',
            level: 'lead',
            title: 'Should we add CQRS to our existing system?',
            answer: `<p><strong>Decision framework:</strong></p><ol><li>Is read/write ratio > 100:1? If no, probably not worth it.</li><li>Are read queries getting complex/slow because of write-optimized schema? If no, stay CRUD.</li><li>Can the team handle eventual consistency? If not, too risky.</li><li>Is there a specific bounded context where it fits? (Do not apply globally)</li></ol><p><strong>Pragmatic approach:</strong> Apply CQRS to ONE bounded context where the pain is clear (e.g., reporting/dashboard that slows down writes). Keep everything else CRUD. Evaluate after 3 months.</p>`
        },
        {
            id: 'arch-dec-q5',
            level: 'mid',
            title: 'REST or gRPC for communication between your .NET microservices?',
            answer: `<p><strong>For internal service-to-service:</strong> gRPC is better because:</p><ul><li>Binary serialization (Protobuf) is 5-10x faster than JSON</li><li>HTTP/2 multiplexing reduces connection overhead</li><li>Strongly-typed contracts prevent integration bugs</li><li>Streaming support for real-time data</li></ul><p><strong>Keep REST for:</strong> Public API (browser consumers), third-party integrations, simple CRUD endpoints where performance is not critical.</p><p><strong>Common pattern:</strong> REST at API gateway (external), gRPC internally between services.</p>`
        },
        {
            id: 'arch-dec-q6',
            level: 'architect',
            title: 'How do you decide between Event Sourcing and a traditional database?',
            answer: `<p><strong>Use Event Sourcing when:</strong></p><ul><li>Complete audit trail is a business requirement (finance, compliance, gaming)</li><li>You need to rebuild state at any point in time ("what was the account balance on March 3?")</li><li>Domain is naturally event-driven (order lifecycle, payment processing)</li><li>You need to create multiple read projections from same events</li></ul><p><strong>Do NOT use when:</strong></p><ul><li>Simple CRUD with no audit needs</li><li>Team has no ES experience (learning curve is 3-6 months)</li><li>Schema changes frequently in early stages (event versioning is painful)</li></ul><p><strong>Middle ground:</strong> Regular DB + audit table (append-only log of changes). Gets 80% of the benefit at 20% complexity.</p>`
        },
        {
            id: 'arch-dec-q7',
            level: 'senior',
            title: 'Redis or in-memory cache (IMemoryCache)? When each?',
            answer: `<p><strong>IMemoryCache when:</strong></p><ul><li>Single instance/pod (no sharing needed)</li><li>Cache data is small (< 100MB)</li><li>Cache loss is cheap (just slower until repopulated)</li><li>Simplicity matters (zero infrastructure)</li></ul><p><strong>Redis when:</strong></p><ul><li>Multiple instances/pods need shared cache</li><li>Cache must survive restarts</li><li>You need TTL, pub/sub, distributed locks, or rate limiting</li><li>Cache dataset is large (GBs)</li></ul><p><strong>Default:</strong> Start with IMemoryCache. Move to Redis when you scale beyond 1 instance or need shared state.</p>`
        },
        {
            id: 'arch-dec-q8',
            level: 'architect',
            title: 'How do you make an architecture decision reversible?',
            answer: `<p><strong>Reversibility strategies:</strong></p><ul><li><strong>Interface abstraction:</strong> Program to interfaces, swap implementations (IMessageBroker can be RabbitMQ or Kafka)</li><li><strong>Strangler Fig:</strong> Run old and new side-by-side during transition</li><li><strong>Feature flags:</strong> Route traffic to old or new implementation dynamically</li><li><strong>Data portability:</strong> Use standard formats; avoid vendor lock-in for data storage</li><li><strong>Small blast radius:</strong> Limit decision scope to one bounded context</li></ul><p><strong>Key insight:</strong> Two-way doors (reversible) deserve fast decisions. One-way doors (irreversible like data model choices) deserve careful analysis. Most decisions are two-way doors disguised as one-way doors.</p>`
        }
    ]
});
