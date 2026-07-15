/* ═══════════════════════════════════════════════════════════════════
   Architecture — Communication Patterns: REST, gRPC, GraphQL, Messaging
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('arch-communication', {
    title: 'Communication Patterns',
    description: 'REST, GraphQL, gRPC, WebSocket, event-driven architecture, API Gateway, BFF (Backend for Frontend), and choosing the right communication style.',
    sections: [
        {
            title: 'Synchronous: REST vs gRPC vs GraphQL',
            content: `<p>Three primary synchronous communication styles, each with distinct strengths.</p>`,
            table: {
                headers: ['Aspect', 'REST', 'gRPC', 'GraphQL'],
                rows: [
                    ['Protocol', 'HTTP/1.1 or HTTP/2, JSON', 'HTTP/2, Protocol Buffers (binary)', 'HTTP, JSON (single endpoint)'],
                    ['Contract', 'OpenAPI/Swagger (optional)', 'Protobuf schema (required, strict)', 'Schema + introspection (required)'],
                    ['Performance', 'Good (text-based, human-readable)', 'Excellent (binary, 10x smaller, streaming)', 'Variable (depends on query complexity)'],
                    ['Streaming', 'Limited (SSE, WebSocket separate)', 'Built-in (server/client/bidirectional)', 'Subscriptions (via WebSocket)'],
                    ['Browser support', 'Native', 'Requires grpc-web proxy', 'Native (single POST endpoint)'],
                    ['Best for', 'Public APIs, CRUD, broad compatibility', 'Internal service-to-service, low latency', 'Mobile/SPA with varied data needs'],
                    ['Tooling', 'Universal (Postman, curl, any language)', 'Strong (.NET, Go, Java)', 'Growing (Apollo, HotChocolate)'],
                    ['Versioning', 'URL/header versioning', 'Package versioning + backward compat', 'Schema evolution (deprecated fields)']
                ]
            }
        },
        {
            title: 'Code Examples — REST vs gRPC vs GraphQL',
            content: `<p>See how the same "Get User by ID" operation looks in each style:</p>`,
            tabs: [
                {
                    label: 'REST (ASP.NET Core)',
                    code: `// REST Controller — resource-oriented, HTTP verbs
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(UserDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _service.GetByIdAsync(id);
        return user is not null ? Ok(user) : NotFound();
    }

    [HttpPost]
    [ProducesResponseType(typeof(UserDto), 201)]
    public async Task<IActionResult> Create(CreateUserRequest req)
    {
        var user = await _service.CreateAsync(req);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }
}
// Client: GET https://api.example.com/api/users/123
// Response: { "id": 123, "name": "Alice", "email": "alice@co.com" }`,
                    language: 'csharp'
                },
                {
                    label: 'gRPC (.NET)',
                    code: `// Proto definition (user.proto):
// service UserService {
//   rpc GetUser (GetUserRequest) returns (UserResponse);
//   rpc CreateUser (CreateUserRequest) returns (UserResponse);
// }
// message GetUserRequest { int32 id = 1; }
// message UserResponse { int32 id = 1; string name = 2; string email = 3; }

// Server implementation:
public class UserGrpcService : UserService.UserServiceBase
{
    public override async Task<UserResponse> GetUser(
        GetUserRequest request, ServerCallContext context)
    {
        var user = await _service.GetByIdAsync(request.Id);
        if (user is null) throw new RpcException(new Status(StatusCode.NotFound, "User not found"));
        return new UserResponse { Id = user.Id, Name = user.Name, Email = user.Email };
    }
}
// Client (auto-generated from .proto):
// var response = await client.GetUserAsync(new GetUserRequest { Id = 123 });
// Binary transfer, ~10x smaller than JSON, bidirectional streaming`,
                    language: 'csharp'
                },
                {
                    label: 'GraphQL (HotChocolate)',
                    code: `// GraphQL Query type:
public class Query
{
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<User> GetUsers([Service] AppDbContext db) => db.Users;

    public async Task<User?> GetUserById(int id, [Service] IUserService service)
        => await service.GetByIdAsync(id);
}

// Client query — client specifies EXACTLY what fields it needs:
// query {
//   userById(id: 123) {
//     name
//     email
//     orders(first: 5) { id, total, date }
//   }
// }
// Result: only requested fields returned (no over-fetching!)
// Single endpoint: POST /graphql
// Mobile gets minimal payload, Web gets full payload — same API`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Asynchronous: Event-Driven Architecture',
            content: `<p>Asynchronous messaging decouples services in time and availability — the sender doesn't wait for processing and doesn't need to know who handles the message.</p>`,
            mermaid: `flowchart LR
    subgraph Producers["Event Producers"]
        OS["Order Service"]
        US["User Service"]
        PS2["Payment Service"]
    end
    subgraph Broker["Message Broker"]
        direction TB
        T1["order-events"]
        T2["user-events"]
        T3["payment-events"]
    end
    subgraph Consumers["Event Consumers"]
        Inv["Inventory"]
        Notif["Notifications"]
        Analytics["Analytics"]
        Search["Search Index"]
    end
    OS --> T1
    US --> T2
    PS2 --> T3
    T1 --> Inv
    T1 --> Notif
    T1 --> Analytics
    T2 --> Notif
    T2 --> Search
    T3 --> Notif
    T3 --> Analytics
    style Broker fill:#fef3c7,color:#1e293b`,
            code: `// MESSAGING PATTERNS:

// 1. POINT-TO-POINT (Command/Queue) — one producer, one consumer
// Use: task processing, order fulfillment, work distribution
// Guarantee: each message processed by exactly one consumer
// Tech: Azure Service Bus Queue, RabbitMQ Queue, SQS

// 2. PUBLISH-SUBSCRIBE (Event/Topic) — one producer, many consumers
// Use: event notification, data sync, audit logging
// Guarantee: all subscribers receive the message
// Tech: Azure Service Bus Topic, RabbitMQ Exchange, SNS, Kafka

// 3. EVENT STREAMING (Log) — ordered, replayable event log
// Use: event sourcing, data pipelines, real-time analytics
// Guarantee: ordered within partition, consumer controls offset
// Tech: Kafka, Azure Event Hub, AWS Kinesis

// CHOOSING BETWEEN SYNC AND ASYNC:
// Sync (REST/gRPC): user needs immediate response, query data, simple CRUD
// Async (messaging): fire-and-forget, long processing, cross-service coordination

// Example: Order placement
// Sync: POST /orders → validate → save → return 201 (user waits)
// Async: POST /orders → save → publish OrderCreated → return 202 Accepted
//   Then: PaymentService handles payment (async)
//         InventoryService reserves stock (async)
//         NotificationService sends email (async)

// API GATEWAY pattern:
// Single entry point for all clients
// Responsibilities: routing, rate limiting, auth, request transformation
// Implementation: Azure API Management, Kong, AWS API Gateway, YARP

// BFF (Backend for Frontend):
// Separate API per client type (mobile BFF, web BFF, admin BFF)
// Each BFF aggregates/transforms data for its specific client needs
// Reduces over-fetching and under-fetching for each client type`,
            language: 'csharp'
        }
    ],
    questions: [
        {"question":"Compare REST, gRPC, and GraphQL. When would you choose each?","difficulty":"hard","answer":"<p><strong>REST</strong> (HTTP/JSON): simple, cacheable, universally supported — great for public/external APIs and CRUD resources; can over/under-fetch and need many round trips. <strong>gRPC</strong> (HTTP/2, Protobuf): binary, contract-first, fast, streaming — ideal for high-throughput internal service-to-service calls; weaker browser support. <strong>GraphQL</strong>: a query language letting clients request exactly the fields they need in one round trip — great for diverse clients and aggregating many sources; adds server complexity (resolvers, N+1, caching, query-cost control).</p><p>Rule of thumb: REST for public/simple APIs, gRPC for hot internal paths, GraphQL when clients need flexible, precise, aggregated data.</p>","explanation":"REST is a fixed-menu diner (order set dishes). gRPC is a fast private hotline between kitchens. GraphQL is a build-your-own-plate buffet where you take exactly what you want in one trip.","bestPractices":["REST for public/cacheable CRUD APIs","gRPC for hot internal, high-throughput/streaming calls","GraphQL for flexible client-shaped queries; guard against N+1 and costly queries"],"commonMistakes":["gRPC for public browser APIs without a proxy","GraphQL without query-cost limits or N+1 protection","REST with chatty round trips where GraphQL/gRPC fit better"],"interviewTip":"Give a one-line strength and best-fit for each, and name GraphQL costs (resolver N+1, caching, query complexity) — acknowledging downsides signals depth.","followUp":["How do you solve the GraphQL N+1 problem?","Why is gRPC hard in browsers?","How does HTTP caching favor REST?"]},
        {"question":"What is the difference between an API gateway and a service mesh in service communication?","difficulty":"hard","answer":"<p>An <strong>API gateway</strong> handles <em>north-south</em> traffic (external clients into the system): routing, authentication, rate limiting, TLS termination, and aggregation at the edge. A <strong>service mesh</strong> handles <em>east-west</em> traffic (service-to-service inside the system) via sidecar proxies: mTLS, retries, timeouts, traffic shifting, and uniform observability — without changing app code.</p><p>They are complementary: the gateway is the front door for clients; the mesh governs internal calls between services. Small systems often need only a gateway; a mesh becomes worthwhile at scale (many polyglot services needing uniform mTLS and traffic policy).</p>","explanation":"The API gateway is the building's front reception (who comes in from outside). The service mesh is the internal switchboard and security badges governing how staff talk to each other inside.","bestPractices":["Gateway for north-south (client) concerns","Mesh for east-west (service-to-service) concerns","Adopt a mesh at scale/polyglot; a gateway suffices for small systems"],"commonMistakes":["Conflating the two roles","Adopting a mesh for a handful of services","Putting business logic in the gateway"],"interviewTip":"Use the north-south vs east-west framing — that one distinction cleanly separates gateway from mesh.","followUp":["What is a Backend-for-Frontend?","When is a service mesh premature?","How does the mesh provide mTLS without code changes?"]},
        {
            question: 'When would you choose gRPC over REST for service-to-service communication?',
            difficulty: 'medium',
            answer: `<p>Choose <strong>gRPC</strong> over REST for internal service-to-service communication when you need: high performance (binary serialization is 10x smaller/faster), streaming (bidirectional built-in), strict contracts (protobuf schema enforcement), and code generation (clients auto-generated from .proto files). Choose REST for public APIs, browser clients, and broad ecosystem compatibility.</p>`,
            bestPractices: ['Use gRPC for internal microservice communication (performance + contracts)', 'Use REST for public-facing APIs (universal compatibility)', 'Use GraphQL when clients have varied data needs (mobile vs web)', 'Use async messaging for fire-and-forget and cross-service coordination'],
            commonMistakes: ['Using REST for high-throughput internal communication (JSON overhead)', 'Using gRPC for public APIs (poor browser support without grpc-web)', 'Sync communication everywhere (creates tight coupling and cascading failures)', 'Not considering async patterns for operations that do not need immediate response'],
            interviewTip: 'Frame it as a decision matrix: Who is the consumer? (browser=REST, service=gRPC). Does the caller need an immediate response? (yes=sync, no=async/messaging). Does the client need flexible queries? (yes=GraphQL).',
            followUp: ['How does Protocol Buffers compare to JSON?', 'What is the BFF pattern?', 'When would you use event-driven over request/response?'],
            seniorPerspective: 'In my microservice architectures: gRPC between services (performance, type safety), REST for public API (compatibility), Service Bus for cross-domain events (decoupling). Each pattern chosen for its strength in context.',
            architectPerspective: 'Communication style determines coupling: synchronous creates temporal coupling (both must be available), asynchronous creates only data coupling (message format). I default to async between bounded contexts and sync within — this gives independence between teams while maintaining simplicity within each service.'
        },
        {
            question: 'What problems does an API Gateway solve, and when does the BFF pattern make more sense?',
            difficulty: 'medium',
            answer: `<p>An <strong>API Gateway</strong> is a single entry point that fronts many backend services and centralizes <strong>cross-cutting concerns</strong>: routing, authentication/authorization, TLS termination, rate limiting, request/response transformation, caching, and aggregation. It stops every client from needing to know your internal topology and prevents each service from re-implementing the same edge logic.</p>
            <p>A <strong>Backend for Frontend (BFF)</strong> is a specialized gateway per client type (web, mobile, partner). Each BFF tailors payloads, aggregates calls, and applies client-specific logic. You reach for BFF when a single generic gateway forces compromises — e.g. mobile needs trimmed payloads and fewer round-trips while the web SPA needs richer data. The rule of thumb: one gateway for shared edge concerns; add BFFs when client needs diverge enough that a one-size API causes over- or under-fetching.</p>`,
            explanation: 'A gateway is the building’s front desk that everyone passes through. A BFF is a dedicated concierge per guest type — one for tour groups, one for VIPs — each shaping the experience for their visitor.',
            code: `// YARP (Yet Another Reverse Proxy) as a lightweight API Gateway in .NET
// appsettings.json
{
  "ReverseProxy": {
    "Routes": {
      "orders": {
        "ClusterId": "orders-cluster",
        "Match": { "Path": "/api/orders/{**catch-all}" },
        "RateLimiterPolicy": "per-user"
      }
    },
    "Clusters": {
      "orders-cluster": {
        "Destinations": { "d1": { "Address": "http://orders-svc:8080/" } }
      }
    }
  }
}

// Program.cs
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
builder.Services.AddRateLimiter(/* per-user policy */);
var app = builder.Build();
app.UseRateLimiter();
app.MapReverseProxy();`,
            language: 'json',
            bestPractices: ['Centralize auth, rate limiting, and TLS at the gateway so services stay focused on domain logic', 'Add a BFF only when client needs genuinely diverge — do not create one per minor screen', 'Keep aggregation logic thin; the gateway should orchestrate, not own business rules', 'Version and own each BFF with the team that owns that frontend'],
            commonMistakes: ['Letting the gateway accumulate business logic until it becomes a distributed monolith chokepoint', 'A single shared gateway that forces mobile to download web-sized payloads', 'Making the gateway a single point of failure with no redundancy or timeouts/circuit breakers', 'Duplicating auth in every service instead of terminating it once at the edge'],
            interviewTip: 'Contrast the two clearly: gateway = shared edge concerns for all clients; BFF = client-specific shaping. Mention that BFF is essentially "one gateway per UX team".',
            followUp: ['How do you prevent the gateway from becoming a bottleneck?', 'Where do you terminate authentication — gateway or service?', 'How does a BFF differ from GraphQL for client-specific data shaping?'],
            seniorPerspective: 'I keep gateways dumb and BFFs owned by the frontend teams. The failure I have seen repeatedly is a "smart" gateway that grows orchestration and business rules until every team is blocked on one shared deploy. I enforce timeouts, retries with budgets, and circuit breakers at the edge so a slow downstream cannot exhaust the gateway’s thread/connection pool.',
            architectPerspective: 'The gateway is an organizational boundary as much as a technical one: it is where you enforce zero-trust auth, quota, and observability uniformly. BFFs align ownership with Conway’s Law — the team building the mobile app owns its BFF, so their release cadence is decoupled from other clients. I weigh BFF proliferation against operational cost; sometimes GraphQL or a single flexible gateway is the cheaper answer than N BFFs.'
        },
        {
            question: 'A message consumer can receive the same message more than once. How do you design for idempotency and what delivery guarantees are realistic?',
            difficulty: 'hard',
            answer: `<p>Most brokers (SQS, Service Bus, Kafka, RabbitMQ) provide <strong>at-least-once</strong> delivery — true exactly-once across a network is generally impractical because the ack itself can be lost. So the consumer must be <strong>idempotent</strong>: processing the same message twice yields the same end state.</p>
            <p>Common techniques:</p>
            <ul>
                <li><strong>Idempotency key / dedup table</strong> — store each processed message id in a table with a unique constraint; on replay, the insert fails and you skip the work.</li>
                <li><strong>Natural idempotency</strong> — design operations as upserts or set-based state changes (\"set status = Paid\") rather than deltas (\"add $10\").</li>
                <li><strong>Conditional writes / optimistic concurrency</strong> — use a version or ETag so a stale duplicate is rejected.</li>
                <li><strong>Transactional outbox + inbox</strong> — record the message id in an inbox table within the same transaction as the side effect so dedup and work commit atomically.</li>
            </ul>
            <p>"Exactly-once processing" is achievable as an <em>effect</em> (at-least-once delivery + idempotent consumer), even though exactly-once <em>delivery</em> is not.</p>`,
            explanation: 'Assume the mail carrier might drop two copies of the same letter. Write down the letter’s tracking number when you act on it; if a second copy arrives with a number you already handled, you toss it. Same result either way.',
            code: `// Inbox-based idempotent consumer (EF Core + SQL unique constraint on MessageId)
public async Task HandleAsync(OrderPaid msg, CancellationToken ct)
{
    await using var tx = await _db.Database.BeginTransactionAsync(ct);

    // Unique index on MessageId enforces dedup
    _db.ProcessedMessages.Add(new ProcessedMessage { MessageId = msg.MessageId });
    try
    {
        await _db.SaveChangesAsync(ct); // throws on duplicate key -> already handled
    }
    catch (DbUpdateException) when (IsUniqueViolation())
    {
        await tx.RollbackAsync(ct);
        return; // idempotent skip
    }

    // Side effect committed atomically with the dedup record
    var order = await _db.Orders.FindAsync([msg.OrderId], ct);
    order!.MarkPaid();                 // set-based, naturally idempotent
    await _db.SaveChangesAsync(ct);
    await tx.CommitAsync(ct);
}`,
            language: 'csharp',
            bestPractices: ['Treat at-least-once as the default and make every consumer idempotent', 'Carry a stable producer-assigned message id for dedup, not a broker-generated one that changes on redelivery', 'Prefer set-based/upsert operations over incremental deltas', 'Use a transactional outbox on the producer to avoid the dual-write problem'],
            commonMistakes: ['Assuming the broker gives true exactly-once delivery and skipping idempotency', 'Using non-deterministic dedup keys so replays are treated as new messages', 'Doing the side effect and recording the message id in two separate transactions (a crash between them re-runs the work)', 'Incremental operations (balance += amount) that double-apply on redelivery'],
            interviewTip: 'Say the line interviewers want: "exactly-once delivery is impractical, so I get exactly-once effect via at-least-once delivery plus an idempotent consumer." Then describe the inbox/dedup mechanism.',
            followUp: ['What is the transactional outbox pattern and what problem does it solve?', 'How does Kafka’s idempotent producer / transactions work?', 'How do you handle poison messages and dead-letter queues?'],
            seniorPerspective: 'In production I pair an outbox on the write side with an inbox dedup table on the read side, and I bound the dedup table with a retention window so it does not grow unbounded. I also wire dead-letter queues with alerting — a message that fails repeatedly is a poison message that must not block the partition, and silently dropping it loses data.',
            architectPerspective: 'Idempotency is a system-wide contract, not a per-handler afterthought. I push a shared messaging library that enforces the inbox pattern and stable message ids so teams cannot accidentally ship non-idempotent consumers. Ordering and exactly-once effect interact with partitioning strategy, so I design partition keys (e.g. by aggregate id) up front to keep related events ordered while preserving throughput.'
        },
        {
            question: 'When would you choose WebSocket over Server-Sent Events or long polling for real-time updates, and what are the operational trade-offs at scale?',
            difficulty: 'advanced',
            answer: `<p>The choice depends on <strong>directionality</strong>, <strong>message frequency</strong>, and <strong>infrastructure</strong>:</p>
            <ul>
                <li><strong>WebSocket</strong> — full-duplex, persistent TCP connection. Best when the client and server both push frequently (chat, collaborative editing, multiplayer, trading). Higher operational cost: stateful connections, sticky routing, and connection limits.</li>
                <li><strong>Server-Sent Events (SSE)</strong> — server-to-client only, over plain HTTP, with automatic reconnection and event ids. Ideal for one-way streams (live scores, notifications, progress feeds). Simpler to operate; works through most proxies; limited by per-domain connection caps on HTTP/1.1.</li>
                <li><strong>Long polling</strong> — fallback for restrictive networks/legacy proxies. High latency and overhead (a new request per message cycle); use only when nothing else gets through.</li>
            </ul>
            <p>In .NET, <strong>SignalR</strong> abstracts this: it negotiates WebSocket first and gracefully falls back to SSE then long polling, so you code one hub and let transport selection adapt to the client/network.</p>`,
            explanation: 'WebSocket is a phone call — both sides talk anytime. SSE is a radio broadcast — the station talks, you only listen. Long polling is repeatedly calling to ask "anything new yet?" and hanging up each time.',
            code: `// SignalR hub: one programming model, transport auto-negotiated (WS -> SSE -> long poll)
public class ScoreHub : Hub
{
    public async Task JoinMatch(string matchId) =>
        await Groups.AddToGroupAsync(Context.ConnectionId, matchId);
}

// Server pushes to a group (one-way fan-out, e.g. live score update)
await _hub.Clients.Group(matchId).SendAsync("ScoreUpdated", new { home, away });

// Client (TypeScript)
const conn = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/score")
    .withAutomaticReconnect()
    .build();
conn.on("ScoreUpdated", s => render(s));
await conn.start();`,
            language: 'typescript',
            bestPractices: ['Use SSE for one-way streams — it is simpler, proxy-friendly, and reconnects automatically', 'Reserve WebSocket for genuinely bidirectional, high-frequency interaction', 'Use a backplane (Redis, Azure SignalR Service) to fan out across multiple server instances', 'Plan for sticky sessions or a managed service since WebSocket connections are stateful'],
            commonMistakes: ['Using WebSocket for one-way notifications where SSE would be far cheaper to operate', 'Forgetting a backplane, so messages only reach clients connected to the same instance', 'Ignoring connection limits and load-balancer idle timeouts that silently drop sockets', 'No reconnect/heartbeat strategy, leading to silent stale clients behind NAT/proxies'],
            interviewTip: 'Lead with directionality (one-way vs two-way), then bring up the scaling pain point — stateful connections need a backplane and sticky routing. That distinguishes someone who has run this in production.',
            followUp: ['How does a SignalR backplane work and why is it needed?', 'What load-balancer settings matter for long-lived connections?', 'How do you authenticate and authorize a WebSocket connection?'],
            seniorPerspective: 'At scale I offload connection management to Azure SignalR Service (or a Redis backplane) so my app servers stay stateless and can scale/restart without dropping every client. The non-obvious costs are idle-timeout tuning on the LB, heartbeats to detect half-open connections behind NAT, and graceful drain on deploy so a rolling update does not stampede tens of thousands of simultaneous reconnects.',
            architectPerspective: 'Persistent connections invert the usual stateless-scaling assumption, so I treat connection capacity as a first-class capacity-planning dimension (connections-per-node, memory per connection, reconnect storms). I also separate the transport from the delivery semantics: real-time push is best-effort, so anything that must not be missed (e.g. an order confirmation) flows through a durable channel as well, with the socket used purely for low-latency UX.'
        },
        {
            question: 'Synchronous request/response chains across services cause cascading failures under load. What patterns do you apply to contain them?',
            difficulty: 'advanced',
            answer: `<p>A chain A→B→C→D couples availability and latency: D slowing down backs up C, then B, then A, exhausting thread/connection pools and taking the whole chain down. The defenses are <strong>resilience patterns</strong> plus <strong>architectural decoupling</strong>:</p>
            <ul>
                <li><strong>Timeouts</strong> — every remote call must have an aggressive, explicit timeout; never inherit an infinite default. A caller’s timeout should be shorter than the time its own caller will wait.</li>
                <li><strong>Circuit breaker</strong> — after a failure threshold, stop calling the failing dependency and fail fast, giving it time to recover and freeing caller resources.</li>
                <li><strong>Bulkheads</strong> — isolate resources (separate connection/thread pools per dependency) so one slow downstream cannot starve calls to healthy ones.</li>
                <li><strong>Retries with backoff + jitter</strong> — only for idempotent calls, with a budget, to avoid retry storms that amplify load.</li>
                <li><strong>Fallbacks / graceful degradation</strong> — return cached or default data when a non-critical dependency is down.</li>
                <li><strong>Decouple with async</strong> — convert non-critical synchronous calls into events so the caller does not block on them at all.</li>
            </ul>`,
            explanation: 'One stalled checkout lane should not freeze the whole supermarket. You cap how long each lane waits (timeout), close a broken lane so people stop queueing at it (circuit breaker), and keep separate carts per lane so one jam does not block the others (bulkhead).',
            code: `// Polly resilience pipeline in .NET — timeout + retry + circuit breaker per client
builder.Services.AddHttpClient("inventory", c =>
    {
        c.BaseAddress = new Uri("http://inventory-svc");
        c.Timeout = TimeSpan.FromSeconds(2); // hard ceiling
    })
    .AddResilienceHandler("inv", pipeline =>
    {
        pipeline.AddRetry(new HttpRetryStrategyOptions
        {
            MaxRetryAttempts = 3,
            BackoffType = DelayBackoffType.Exponential,
            UseJitter = true            // avoid synchronized retry storms
        });
        pipeline.AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
        {
            FailureRatio = 0.5,         // open if >50% fail
            MinimumThroughput = 10,
            BreakDuration = TimeSpan.FromSeconds(15)
        });
        pipeline.AddTimeout(TimeSpan.FromSeconds(2));
    });`,
            language: 'csharp',
            bestPractices: ['Set an explicit, aggressive timeout on every outbound call', 'Use circuit breakers so a failing dependency fails fast instead of queueing requests', 'Isolate dependencies with bulkheads (separate pools) to prevent resource starvation', 'Retry only idempotent operations, with exponential backoff and jitter and a retry budget'],
            commonMistakes: ['Infinite or default timeouts that let a slow downstream exhaust the caller’s thread pool', 'Retrying non-idempotent calls, causing duplicates or amplifying the outage', 'Synchronized retries with no jitter creating a thundering-herd retry storm', 'Deep synchronous call chains where every hop must be up for any request to succeed'],
            interviewTip: 'Lead with the failure mechanism — pool/thread exhaustion propagating up the chain — then list timeout, circuit breaker, bulkhead. Add that the real fix is often removing the synchronous dependency entirely via events.',
            followUp: ['How does a circuit breaker’s half-open state work?', 'Why must retries be limited to idempotent operations?', 'How would you redesign a long sync chain to be event-driven?'],
            seniorPerspective: 'I treat timeouts as a budget that shrinks down the chain: if the user-facing request has a 3s SLA, the inner calls get progressively tighter ceilings so a deep dependency can never blow the top-level budget. The biggest win in practice is not tuning Polly but deleting synchronous hops — moving non-critical work (emails, analytics, search indexing) onto a bus so the critical path has fewer things that can take it down.',
            architectPerspective: 'Cascading failure is fundamentally a coupling problem, so I attack it at the boundary design: minimize synchronous fan-out, make each service degrade independently, and ensure no single non-critical dependency sits on the critical path. Resilience libraries are table stakes, but the architecture-level lever is shaping bounded contexts and async event flows so failures stay contained rather than propagating across the system.'
        },
        {
            question: 'When would you choose a log-based event stream (Kafka, Event Hubs) over a traditional message queue (RabbitMQ, SQS, Service Bus)?',
            difficulty: 'advanced',
            answer: `<p>They look similar but have fundamentally different semantics around <strong>consumption and retention</strong>:</p>
            <ul>
                <li><strong>Traditional queue (RabbitMQ, SQS, Service Bus):</strong> messages are <strong>consumed and removed</strong>. A message is delivered to one competing consumer, acknowledged, and gone. Built for <strong>work distribution</strong> — load-balancing tasks across workers. Once processed, the message no longer exists.</li>
                <li><strong>Log-based stream (Kafka, Event Hubs, Kinesis):</strong> events are <strong>appended to an immutable, ordered log</strong> and retained for a configured window (or forever). Consumers track their own <strong>offset</strong> and read independently; reading does not delete. Built for <strong>event distribution and replay</strong> — many independent consumers, each at their own position.</li>
            </ul>
            <p><strong>Choose a stream when</strong> you need: multiple independent consumer groups reading the same events, the ability to <strong>replay</strong> history (rebuild a read model, onboard a new consumer, reprocess after a bug), strict <strong>ordering within a partition</strong>, very high throughput, or event sourcing. <strong>Choose a queue when</strong> you need: competing-consumer work distribution, per-message operations like delay/priority/dead-lettering, and you do not need replay — once a task is done it should disappear.</p>
            <p>The mental model: a queue is a <strong>to-do list</strong> you cross items off; a log is a <strong>ledger</strong> you append to and can re-read from any point.</p>`,
            explanation: 'A message queue is a deli ticket dispenser: each customer takes a number, gets served once, and the ticket is thrown away. A log-based stream is the CCTV recording of the deli: many people can watch it independently, rewind to any moment, and the footage stays until the tape recycles. One distributes work; the other distributes a replayable history.',
            mermaid: `flowchart LR
    subgraph Queue["Message Queue (consume + delete)"]
        P1["Producer"] --> Q[("Queue")]
        Q -->|msg A| W1["Worker 1"]
        Q -->|msg B| W2["Worker 2"]
        Q -->|msg C| W3["Worker 3"]
    end
    subgraph Log["Log-based Stream (append + retain + replay)"]
        P2["Producer"] --> L[("Partitioned Log<br/>offsets 0..N")]
        L --> CGa["Consumer Group A<br/>(offset 1042)"]
        L --> CGb["Consumer Group B<br/>(offset 5)<br/>replaying history"]
    end
    style Queue fill:#fef3c7,color:#1e293b
    style Log fill:#dbeafe,color:#1e293b`,
            code: `// Kafka consumer: offset is owned by the consumer; reading does NOT delete.
// A new consumer group can start at offset 0 and REPLAY the entire history.
var config = new ConsumerConfig
{
    BootstrapServers = "broker:9092",
    GroupId = "analytics-projector",      // each group has its own offset cursor
    AutoOffsetReset = AutoOffsetReset.Earliest, // <- replay from the beginning
    EnableAutoCommit = false              // commit only after successful processing
};

using var consumer = new ConsumerBuilder<string, string>(config).Build();
consumer.Subscribe("order-events");
while (!ct.IsCancellationRequested)
{
    var result = consumer.Consume(ct);
    await ProjectAsync(result.Message.Key, result.Message.Value); // ordering preserved per partition (key)
    consumer.Commit(result); // advance THIS group's offset; events remain for others
}

// Contrast — a traditional queue: receiving + completing DELETES the message.
// await processor.CompleteMessageAsync(msg); // gone; no replay, no second consumer group`,
            language: 'csharp',
            bestPractices: [
                'Use a log-based stream when multiple independent consumers or replay are required',
                'Use a queue for competing-consumer work distribution with per-message control',
                'Choose partition keys (e.g. aggregate id) deliberately — ordering is per-partition only',
                'Set stream retention based on the longest realistic replay/reprocessing window'
            ],
            commonMistakes: [
                'Using a queue then discovering you need a second consumer or replay (messages already deleted)',
                'Assuming Kafka gives total global ordering — ordering holds only within a partition',
                'Using a stream for simple task distribution and reinventing queue features (delay, priority)',
                'Setting retention too short and losing the ability to rebuild read models'
            ],
            interviewTip: 'Anchor on the core semantic difference: queues consume-and-delete for work distribution; logs append-and-retain for replayable event distribution. Then name the deciding factors — multiple consumers, replay, and per-partition ordering point to a stream.',
            followUp: [
                'How does Kafka guarantee ordering, and what is the role of partitions?',
                'How does consumer-group offset management enable replay?',
                'When would you use both a stream and a queue in the same system?'
            ],
            seniorPerspective: 'My deciding question is "will more than one thing need these events, now or later, and might I need to replay them?" If yes, I start with a log even though a queue looks simpler today — retrofitting replay onto a consume-and-delete queue is painful because the history is already gone. For pure background task distribution, though, a queue with native dead-lettering and delay is the better, simpler tool.',
            architectPerspective: 'Log-based streams are the backbone of event-driven and event-sourced architectures because they decouple producers from an open-ended set of consumers across time — a new service can join months later and replay history to build its own state. I treat the event log as a long-lived integration contract, which raises the bar on schema governance (compatibility, versioning) compared to transient queue messages.'
        }
    ]
});
