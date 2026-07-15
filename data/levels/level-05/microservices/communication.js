/* ═══════════════════════════════════════════════════════════════════
   MICROSERVICES — Communication
   Synchronous (REST/gRPC) vs asynchronous (messaging), API gateway,
   BFF, service discovery, and how to choose between them.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('microservices-communication', {

    title: 'Microservices: Communication',
    level: 5,
    group: 'microservices',
    description: 'How services talk: synchronous REST/gRPC vs asynchronous messaging, the API gateway and Backend-for-Frontend patterns, service discovery, and a decision framework for choosing synchronous vs asynchronous.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['microservices', 'microservices-decomposition'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Once a system is split into services, <strong>how they communicate</strong> determines its
            latency, coupling, and failure behavior. There are two fundamental styles: <strong>synchronous</strong>
            request/response (the caller waits) and <strong>asynchronous</strong> messaging (the caller fires an
            event and moves on).</p>
            <p>This lesson covers both styles, the infrastructure around them (API gateway, Backend-for-Frontend,
            service discovery), and a decision framework. For deep coverage of protocol-level API design (REST
            maturity, gRPC, GraphQL, versioning, idempotency) see <a href="#api-design-patterns">API Design
            Patterns</a>; for event-driven specifics see <a href="#event-driven-architecture">Event-Driven
            Architecture</a>. Here we focus on the service-to-service communication decisions.</p>`
        },
        {
            title: 'Synchronous Communication (REST & gRPC)',
            content: `<p>In synchronous communication the caller sends a request and <strong>blocks until it gets a
            response</strong>. Two dominant choices:</p>
            <h4>REST over HTTP/JSON</h4>
            <p>Ubiquitous, human-readable, easy to debug and cache. Ideal for external-facing APIs and
            low-frequency internal calls. The cost is JSON serialization overhead and larger payloads.</p>
            <h4>gRPC over HTTP/2 (Protocol Buffers)</h4>
            <p>Binary, contract-first (<code>.proto</code>), supports streaming, and is typically 5-10x faster than
            REST/JSON. Ideal for high-throughput internal service-to-service calls. The cost is less
            human-readability and weaker browser support (needs a proxy for browsers).</p>
            <p>Every synchronous call is a potential failure and latency source, so it MUST have a
            <strong>timeout</strong> and should be wrapped with a circuit breaker (see
            <a href="#microservices-resilience">Resilience</a>).</p>`,
            code: `// gRPC contract-first: a .proto defines the service and messages
syntax = "proto3";
package inventory;

service Inventory {
  rpc GetStock (StockRequest) returns (StockReply);
  rpc StreamLowStock (Empty) returns (stream StockReply); // server streaming
}

message StockRequest { string sku = 1; }
message StockReply   { string sku = 1; int32 available = 2; }
message Empty {}

// The C# client call — strongly typed, generated from the .proto
var reply = await _inventoryClient.GetStockAsync(
    new StockRequest { Sku = "SKU-123" },
    deadline: DateTime.UtcNow.AddSeconds(2)); // gRPC deadline == timeout
Console.WriteLine($"Available: {reply.Available}");`,
            language: 'protobuf'
        },
        {
            title: 'Asynchronous Communication (Messaging & Events)',
            content: `<p>In asynchronous communication a service publishes a <strong>message or event</strong> to a
            broker (Kafka, RabbitMQ, Azure Service Bus, NATS) and continues without waiting. Interested services
            consume it independently.</p>
            <h4>Two message intents</h4>
            <ul>
                <li><strong>Commands</strong> — "do this" sent to one specific consumer (e.g., <em>ChargePayment</em>).</li>
                <li><strong>Events</strong> — "this happened" broadcast to any interested subscribers (e.g.,
                <em>OrderCreated</em>). Events are the backbone of loose coupling: the publisher does not know or
                care who consumes them.</li>
            </ul>
            <h4>Why async</h4>
            <p>It decouples services in time (the consumer can be down and catch up later), enables fan-out to many
            consumers, buffers load spikes, and removes the compounding latency and failure of synchronous chains.
            The cost is <strong>eventual consistency</strong> and harder end-to-end tracing.</p>`,
            code: `// Publish an event (MassTransit + RabbitMQ/Kafka). Fire-and-continue.
await _publishEndpoint.Publish(new OrderCreated(
    OrderId: order.Id,
    CustomerId: order.CustomerId,
    Total: order.Total), ct);

// Any number of services subscribe independently — the publisher is unaware.
public sealed class OrderCreatedConsumer : IConsumer<OrderCreated>
{
    private readonly IPaymentProcessor _payments;
    public OrderCreatedConsumer(IPaymentProcessor payments) => _payments = payments;

    public async Task Consume(ConsumeContext<OrderCreated> ctx)
    {
        var m = ctx.Message;
        var result = await _payments.ChargeAsync(m.CustomerId, m.Total);
        await ctx.Publish(result.Success
            ? (object)new PaymentCompleted(m.OrderId, result.TxnId)
            : new PaymentFailed(m.OrderId, result.Reason));
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Choosing Synchronous vs Asynchronous',
            content: `<p>The single best discriminator: <strong>does the caller need an answer before it can
            proceed?</strong> If yes and the chain is short, use synchronous. Otherwise prefer asynchronous.</p>`,
            table: {
                headers: ['Use Synchronous when', 'Use Asynchronous when'],
                rows: [
                    ['Caller needs the result to continue', 'Caller can continue without the result'],
                    ['Real-time read/query', 'A state change others should react to'],
                    ['Short, low fan-out call chain', 'Fan-out to many consumers'],
                    ['Strong request/response semantics', 'Loose coupling and buffering matter more'],
                    ['gRPC for hot internal read paths', 'Kafka/broker for workflows & integration'],
                    ['User is waiting on the screen for this exact value', 'Work can be processed slightly later']
                ]
            },
            callout: {
                type: 'warning',
                title: 'Beware synchronous chains',
                text: 'A→B→C→D synchronous chains compound latency (sum of every hop) and failure (any hop down fails the whole request). Reserve synchronous calls for real-time reads; use events for multi-step workflows.'
            }
        },
        {
            title: 'API Gateway',
            content: `<p>An <strong>API Gateway</strong> is the single entry point for external clients. Instead of
            clients calling dozens of services directly, they call the gateway, which handles cross-cutting concerns
            in one place:</p>
            <ul>
                <li><strong>Routing</strong> to the correct backend service</li>
                <li><strong>Authentication &amp; authorization</strong> (validate tokens once at the edge)</li>
                <li><strong>Rate limiting &amp; throttling</strong></li>
                <li><strong>TLS termination</strong>, request/response transformation, protocol translation</li>
                <li><strong>Response aggregation</strong> (compose data from several services)</li>
            </ul>
            <p>Common gateways: YARP, Ocelot (.NET), Kong, NGINX, AWS API Gateway. The risk is turning the gateway
            into a bloated "god object" full of business logic — keep it to cross-cutting concerns only.</p>`,
            mermaid: `flowchart LR
    Web["Web App"] --> GW["API Gateway"]
    Mobile["Mobile App"] --> GW
    GW -->|"auth, rate limit, route"| OS["Order Service"]
    GW --> PS["Payment Service"]
    GW --> IS["Inventory Service"]
    GW --> US["User Service"]`
        },
        {
            title: 'Backend for Frontend (BFF)',
            content: `<p>Different clients need different data shapes: a mobile app wants small, aggregated payloads
            to save bandwidth; a web app wants richer data. A single one-size-fits-all gateway API forces awkward
            compromises.</p>
            <p>The <strong>Backend-for-Frontend</strong> pattern gives each client type its own gateway tailored to
            its needs — a Mobile BFF, a Web BFF, a Partner-API BFF. Each BFF aggregates and shapes data for its
            specific client, and is owned by the team building that client.</p>
            <p>The trade-off is more gateways to maintain, and some duplicated aggregation logic. Use BFFs when
            client needs genuinely diverge; a single gateway is fine when they do not.</p>`,
            mermaid: `flowchart TB
    MobileApp["Mobile App"] --> MBFF["Mobile BFF"]
    WebApp["Web App"] --> WBFF["Web BFF"]
    Partner["Partner API"] --> PBFF["Partner BFF"]
    MBFF --> Svc["Shared Services"]
    WBFF --> Svc
    PBFF --> Svc`
        },
        {
            title: 'Service Discovery',
            content: `<p>Service instances come and go — they scale up and down, move between hosts, and fail. A
            caller cannot hard-code an address. <strong>Service discovery</strong> resolves a logical service name
            to a healthy instance address dynamically.</p>
            <h4>Client-side discovery</h4>
            <p>The caller queries a registry (Consul, Eureka) for instances and load-balances itself.</p>
            <h4>Server-side discovery</h4>
            <p>The caller hits a stable virtual address; the platform routes to a healthy instance. This is what
            <strong>Kubernetes</strong> does out of the box — a Service DNS name (e.g.,
            <code>http://inventory-service</code>) resolves to healthy pods via kube-proxy, so most teams on
            Kubernetes get discovery "for free" without a separate registry.</p>
            <p>Discovery relies on <strong>health checks</strong> so only healthy instances receive traffic (see
            <a href="#microservices-observability">Observability</a>).</p>`
        },
        {
            title: 'Common Mistakes',
            content: `<h4>No timeouts on synchronous calls</h4>
            <p>A missing timeout lets one slow dependency exhaust the caller's threads and cascade. Every remote
            call needs a timeout.</p>
            <h4>Synchronous chains for workflows</h4>
            <p>Modeling a multi-step business process as A calls B calls C synchronously compounds latency and
            failure. Use events + a saga instead (see <a href="#microservices-data">Data Management</a>).</p>
            <h4>Business logic in the gateway</h4>
            <p>The gateway should route, authenticate, and rate-limit — not make business decisions. Logic there
            couples all services to the gateway.</p>
            <h4>Chatty communication</h4>
            <p>Fine-grained calls that require many round trips per request destroy performance. Batch, compose, or
            denormalize (see <a href="#microservices-bottlenecks">Bottlenecks</a>).</p>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Synchronous</strong> (REST/gRPC) for real-time reads on short chains; always with a timeout</li>
                <li><strong>Asynchronous</strong> (events) for workflows, fan-out, and loose coupling — at the cost of eventual consistency</li>
                <li>Use <strong>gRPC</strong> for hot internal paths, <strong>REST</strong> for external/simple APIs</li>
                <li>An <strong>API gateway</strong> centralizes routing/auth/rate-limiting; a <strong>BFF</strong> tailors it per client</li>
                <li><strong>Service discovery</strong> (often free on Kubernetes) resolves logical names to healthy instances</li>
            </ul>`
        },
        {
            title: 'Continue the Series',
            content: `<p>Previous: <a href="#microservices-decomposition">← Decomposition &amp; Boundaries</a> ·
            Back to <a href="#microservices">Overview</a> ·
            Next: <a href="#microservices-data">Data Management →</a></p>`
        }
    ],

    questions: [
        {
            question: 'What is the core difference between synchronous and asynchronous service communication, and how do you choose?',
            difficulty: 'medium',
            answer: `<p><strong>Synchronous</strong> (REST/gRPC): the caller blocks waiting for a response.
            <strong>Asynchronous</strong> (messaging/events): the caller publishes and continues; consumers react
            independently.</p>
            <p>Choose by asking "does the caller need the answer to proceed?" If yes and the chain is short, use
            sync. If the caller can continue, if many consumers care, or if it is a multi-step workflow, use async.
            Async trades immediate consistency for loose coupling, buffering, and resilience.</p>`,
            explanation: 'Synchronous is a phone call (you wait on the line); asynchronous is a text message (you send it and carry on). You phone when you need the answer right now; you text when it can wait.',
            bestPractices: ['Sync for real-time reads on short chains', 'Async for workflows and fan-out', 'Always put a timeout on sync calls'],
            commonMistakes: ['Sync chains for multi-step workflows', 'Async where the user is blocked waiting for the exact value', 'No timeout on sync calls'],
            interviewTip: 'Anchor on the one question — "does the caller need the answer to proceed?" — and mention the eventual-consistency cost of async.',
            followUp: ['Why do synchronous chains compound failure?', 'What is a command vs an event?', 'How does async enable eventual consistency?']
        },
        {
            question: 'When would you choose gRPC over REST/JSON for internal communication?',
            difficulty: 'medium',
            answer: `<p>Choose <strong>gRPC</strong> for high-throughput internal service-to-service calls where
            performance matters: it uses binary Protocol Buffers over HTTP/2, is typically 5-10x faster than
            REST/JSON, is contract-first (strong typing from a <code>.proto</code>), and supports streaming.</p>
            <p>Keep <strong>REST/JSON</strong> for external-facing APIs, simple/low-frequency calls, and anywhere
            human-readability, easy debugging, browser support, or HTTP caching matter. Many systems use both:
            REST at the edge, gRPC between hot internal services.</p>`,
            explanation: 'REST/JSON is like writing a letter in plain English — anyone can read it. gRPC/Protobuf is like a compressed, pre-agreed shorthand — much faster to send, but you need the codebook to read it.',
            bestPractices: ['gRPC for hot internal paths and streaming', 'REST for external/public and simple APIs', 'Set a gRPC deadline (timeout) on every call'],
            commonMistakes: ['Using gRPC for public browser APIs without a proxy', 'JSON on ultra-hot internal paths where CPU is the bottleneck', 'Forgetting deadlines/timeouts'],
            interviewTip: 'Quantify it ("5-10x faster, binary over HTTP/2, contract-first") and note REST still wins for external/debuggable APIs — the "use both" answer shows maturity.',
            followUp: ['What is Protocol Buffers?', 'How does HTTP/2 help gRPC?', 'How do browsers call gRPC services?']
        },
        {
            question: 'What does an API gateway do, and what should NOT live in it?',
            difficulty: 'medium',
            answer: `<p>An <strong>API gateway</strong> is the single entry point for external clients. It handles
            cross-cutting concerns in one place: routing to services, authentication/authorization, rate limiting,
            TLS termination, request/response transformation, and sometimes response aggregation.</p>
            <p>What should NOT live in it: <strong>business logic</strong>. Putting domain decisions in the gateway
            couples every service to it and turns it into a bloated god-object and a deployment bottleneck. Keep it
            to edge concerns; business rules belong in the services.</p>`,
            explanation: 'A gateway is the building reception desk: it checks IDs, directs visitors, and stops overcrowding. It should not start making the decisions that belong to the departments upstairs.',
            bestPractices: ['Centralize auth, rate limiting, routing at the edge', 'Keep business logic in services', 'Use it for aggregation sparingly'],
            commonMistakes: ['Business logic in the gateway', 'Making the gateway a single point of failure without redundancy', 'Overloading it with per-client shaping (use a BFF instead)'],
            interviewTip: 'List the edge concerns it owns, then explicitly say "no business logic" — that boundary is what interviewers probe.',
            followUp: ['What is a Backend-for-Frontend?', 'How do you keep the gateway highly available?', 'How does the gateway handle auth?']
        },
        {
            question: 'What is the Backend-for-Frontend (BFF) pattern and when is it worth it?',
            difficulty: 'medium',
            answer: `<p><strong>BFF</strong> gives each client type its own gateway/backend tailored to its needs — a
            Mobile BFF returning small aggregated payloads, a Web BFF returning richer data, a Partner BFF for
            third parties. Each BFF aggregates and shapes data for its client and is usually owned by that client's
            team.</p>
            <p>It is worth it when client needs genuinely diverge (mobile bandwidth vs web richness) or when a
            single gateway API forces awkward compromises. If clients need essentially the same data, a single
            gateway is simpler — do not add BFFs speculatively.</p>`,
            explanation: 'A BFF is like having a dedicated waiter per table who knows exactly what that table likes, instead of one menu that tries to satisfy everyone and pleases no one.',
            bestPractices: ['Add a BFF per client type when needs diverge', 'Let the client team own its BFF', 'Keep shared logic in the underlying services'],
            commonMistakes: ['Creating BFFs when clients need the same data', 'Duplicating business logic across BFFs', 'Letting a BFF grow into a second monolith'],
            interviewTip: 'Frame it as solving "one API cannot serve mobile and web well" and note the cost (more gateways) so it does not sound like a silver bullet.',
            followUp: ['How does a BFF differ from an API gateway?', 'Who owns a BFF?', 'How do you avoid duplicating logic across BFFs?']
        },
        {
            question: 'How does service discovery work, and why can you not just hard-code service addresses?',
            difficulty: 'medium',
            answer: `<p>Instances are dynamic — they scale, move hosts, and fail — so a fixed address breaks
            constantly. <strong>Service discovery</strong> resolves a logical service name to a healthy instance at
            call time.</p>
            <p><strong>Client-side discovery</strong>: the caller queries a registry (Consul, Eureka) and
            load-balances itself. <strong>Server-side discovery</strong>: the caller hits a stable virtual
            address and the platform routes to healthy instances — this is what Kubernetes Service DNS does out of
            the box. Discovery depends on health checks so only healthy instances receive traffic.</p>`,
            explanation: 'Hard-coding an address is like memorizing a friend\'s exact seat in a stadium; if they move you cannot find them. Discovery is asking the information desk "where is this person right now?"',
            bestPractices: ['Use logical names, not hard-coded addresses', 'Rely on Kubernetes DNS where available', 'Gate traffic on health checks'],
            commonMistakes: ['Hard-coding IPs/hostnames', 'Routing to unhealthy instances (no health checks)', 'Rolling your own registry when the platform provides one'],
            interviewTip: 'Distinguish client-side vs server-side discovery and note Kubernetes gives you server-side discovery for free.',
            followUp: ['What is the role of health checks in discovery?', 'How does Kubernetes Service DNS work?', 'Client-side vs server-side load balancing?']
        },
        {
            question: 'Why are long synchronous call chains dangerous, and what do you use instead?',
            difficulty: 'hard',
            answer: `<p>A synchronous chain A→B→C→D has two compounding problems. <strong>Latency</strong> adds up:
            total time is the sum of every hop plus network overhead. <strong>Failure</strong> multiplies:
            availability is the product of each hop's availability, so a chain of four 99.9% services is only about
            99.6% available, and any single slow hop stalls the entire request and can exhaust upstream threads.</p>
            <p>Instead, model multi-step work as <strong>asynchronous events</strong> coordinated by a
            <strong>saga</strong>: each service does its local step and emits an event; the flow proceeds without a
            blocking chain, and failures are handled with compensations. Reserve synchronous calls for short
            real-time reads, protected by timeouts and circuit breakers.</p>`,
            explanation: 'A sync chain is a line of people passing a bucket — if any one is slow or drops it, the whole line stops and water piles up behind them. Async events are everyone filling their own bucket when they can.',
            bestPractices: ['Convert workflows to async events + saga', 'Keep sync chains short; add timeouts + circuit breakers', 'Cache or denormalize to remove read hops'],
            commonMistakes: ['Deep sync chains for business workflows', 'No timeout, so one slow hop cascades', 'Ignoring the multiplicative availability math'],
            interviewTip: 'Do the availability math out loud (0.999^4 ≈ 0.996) — quantifying the failure compounding is a strong senior signal.',
            followUp: ['What is the saga pattern?', 'How do circuit breakers help here?', 'How do you measure end-to-end latency across hops?'],
            seniorPerspective: 'When I see a request touching five services synchronously, my first move is to ask which of those hops actually need to be in the request path. Usually most can become asynchronous reactions or be served from a local read model, collapsing a fragile chain into one fast call plus background work.'
        },
        {
            question: 'What is the difference between a command and an event in messaging?',
            difficulty: 'medium',
            answer: `<p>A <strong>command</strong> is an instruction to do something, addressed to one specific
            consumer, expressed in imperative form (<em>ChargePayment</em>, <em>ReserveStock</em>). The sender
            expects it to be handled and may care about the outcome.</p>
            <p>An <strong>event</strong> is a statement that something already happened, in past tense
            (<em>OrderCreated</em>, <em>PaymentCompleted</em>), broadcast to any interested subscribers. The
            publisher does not know or care who consumes it — this is what enables loose coupling.</p>`,
            explanation: 'A command is "please ship this order" said to one courier. An event is announcing "the order shipped!" to the whole room — whoever cares can react, and you do not need to know who is listening.',
            bestPractices: ['Name commands imperatively, events in past tense', 'Send commands to one owner; broadcast events', 'Prefer events for decoupling'],
            commonMistakes: ['Broadcasting commands to many consumers', 'Coupling publishers to specific consumers', 'Using events where an explicit command is clearer'],
            interviewTip: 'The tense tells the story: imperative = command (one handler), past tense = event (many subscribers).',
            followUp: ['How does event choreography differ from orchestration?', 'When is a command better than an event?', 'What is a message broker?']
        },
        {
            question: 'How do you make service-to-service communication resilient at the communication layer?',
            difficulty: 'hard',
            answer: `<p>Layer several protections on every synchronous call: a <strong>timeout</strong> (never wait
            indefinitely), <strong>retries with exponential backoff and jitter</strong> for transient failures
            only, a <strong>circuit breaker</strong> to fail fast when a dependency is down, and a
            <strong>bulkhead</strong> to isolate resource pools so one slow dependency cannot exhaust all threads.
            Add a <strong>fallback</strong> (cached/default data) for non-critical dependencies.</p>
            <p>For workflows, prefer asynchronous messaging so a consumer being down does not fail the caller — the
            broker buffers until it recovers. Full detail in <a href="#microservices-resilience">Resilience</a>.</p>`,
            explanation: 'It is defensive driving for network calls: leave stopping distance (timeout), do not slam the accelerator when traffic is jammed (backoff), take a detour when a road is closed (circuit breaker), and keep lanes separated so one crash does not block everyone (bulkhead).',
            bestPractices: ['Timeout + retry(backoff+jitter) + circuit breaker + bulkhead together', 'Retry only idempotent, transient failures', 'Buffer workflows via async messaging'],
            commonMistakes: ['Retrying non-idempotent calls', 'Retries in both a mesh and the app (retry storm)', 'No bulkhead, so one dependency exhausts the thread pool'],
            interviewTip: 'List the patterns as a combined stack and warn about double-retries (mesh + app) — a subtle mistake that amplifies outages.',
            followUp: ['How does a circuit breaker transition open/half-open/closed?', 'What is retry jitter and why does it matter?', 'When should you NOT retry?']
        }
    ]
});
