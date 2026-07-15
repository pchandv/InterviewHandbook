PageData.register('microservices-observability', {
    title: 'Microservices Observability',
    description: 'Distributed tracing, correlation IDs, structured logging, metrics, and health checks in microservices architectures',
    sections: [
        {
            title: 'Introduction',
            content: `<p>In a monolith, debugging means searching one log file. In microservices, a single user request may traverse 10+ services, each with its own logs, metrics, and failure modes. Without observability, microservices are a <strong>black box of distributed chaos</strong>.</p>
<p>Microservices observability is the discipline of making every service boundary, every async message, and every database call visible, queryable, and alertable — so you can answer "why is checkout slow for 2% of users?" in minutes, not days.</p>
<p>This topic focuses on the <strong>microservices-specific challenges</strong>: cross-service correlation, async message tracing, service mesh telemetry, and health check patterns.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>Microservices observability builds on the Three Pillars (logs, metrics, traces) but adds distributed-specific concerns:</p>`,
            table: {
                headers: ['Concept', 'What It Solves', 'Implementation'],
                rows: [
                    ['Correlation ID', 'Link all logs/spans across services for one request', 'W3C traceparent header propagated via HTTP/gRPC/message headers'],
                    ['Distributed Tracing', 'Visualize request path + latency across service boundaries', 'OpenTelemetry spans with parent-child relationships'],
                    ['Service Dependency Map', 'Understand which services call which', 'Auto-generated from trace data (Jaeger/Tempo service graphs)'],
                    ['Health Checks', 'Know if a service is ready to accept traffic', 'Liveness (restart if dead), Readiness (remove from LB if not ready), Startup (give time to boot)'],
                    ['Circuit Breaker Metrics', 'Know when a dependency is failing and being bypassed', 'Polly/Resilience4j exposes open/closed/half-open state as metric'],
                    ['Async Message Tracing', 'Follow events through queues/topics', 'Inject trace context into message headers; consumer extracts and links spans'],
                    ['Service Mesh Telemetry', 'Observe traffic without app-level instrumentation', 'Istio/Linkerd proxy emits RED metrics + mTLS handshake data']
                ]
            }
        },
        {
            title: 'How It Works',
            content: `<p>A request enters the system and generates correlated telemetry at every hop:</p>`,
            mermaid: `sequenceDiagram
    participant Client
    participant Gateway
    participant OrderSvc
    participant Kafka
    participant PaymentSvc
    participant NotifySvc

    Client->>Gateway: POST /orders (trace_id generated)
    Gateway->>OrderSvc: Forward + traceparent header
    Note over OrderSvc: Span: "CreateOrder"<br/>Log: order_created, trace_id=abc
    OrderSvc->>Kafka: Publish OrderCreated event<br/>(trace_id in message header)
    Kafka-->>PaymentSvc: Consume OrderCreated
    Note over PaymentSvc: New span linked to trace_id=abc<br/>Span: "ProcessPayment"
    PaymentSvc->>Kafka: Publish PaymentCompleted
    Kafka-->>NotifySvc: Consume PaymentCompleted
    Note over NotifySvc: Span: "SendConfirmation"<br/>linked to same trace_id=abc
    Note over Client,NotifySvc: ONE trace spans sync HTTP + async Kafka messages`
        },
        {
            title: 'Visual Diagram',
            content: '<p>Architecture of a complete microservices observability platform:</p>',
            mermaid: `graph TB
    subgraph Services
        A[Order Service]
        B[Payment Service]
        C[Inventory Service]
        D[Notification Service]
    end

    subgraph Collection Layer
        E[OTel Sidecar Collectors]
        F[Kafka Consumer Instrumentation]
    end

    subgraph Processing
        G[OTel Gateway Collector]
        H[Tail-Based Sampler]
    end

    subgraph Storage
        I[Prometheus/Mimir - Metrics]
        J[Loki - Logs]
        K[Tempo - Traces]
    end

    subgraph Visualization
        L[Grafana Dashboards]
        M[Service Dependency Graph]
        N[SLO Burn-Rate Alerts]
    end

    A --> E
    B --> E
    C --> E
    D --> E
    F --> G
    E --> G
    G --> H
    H --> I
    H --> J
    H --> K
    I --> L
    J --> L
    K --> L
    K --> M
    I --> N`
        },
        {
            title: 'Implementation',
            content: `<p>Key patterns for microservices observability in .NET:</p>
<h4>1. Correlation ID Middleware (propagate context through all services)</h4>`,
            code: `// Middleware that ensures every request has a correlation ID
public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    private const string CorrelationHeader = "X-Correlation-Id";

    public CorrelationIdMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        // Extract or generate correlation ID
        if (!context.Request.Headers.TryGetValue(CorrelationHeader, out var correlationId))
        {
            correlationId = Activity.Current?.TraceId.ToString() 
                ?? Guid.NewGuid().ToString();
        }

        // Add to response headers (for client debugging)
        context.Response.Headers[CorrelationHeader] = correlationId;

        // Add to logging scope (appears in every log within this request)
        using (context.RequestServices
            .GetRequiredService<ILogger<CorrelationIdMiddleware>>()
            .BeginScope(new Dictionary<string, object>
            {
                ["CorrelationId"] = correlationId.ToString()
            }))
        {
            await _next(context);
        }
    }
}

// Propagate correlation ID in outgoing HTTP calls
public class CorrelationIdHandler : DelegatingHandler
{
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        // Forward trace context via W3C standard headers (OTel does this automatically)
        // But also forward custom correlation header for legacy services
        if (Activity.Current != null)
        {
            request.Headers.TryAddWithoutValidation(
                "X-Correlation-Id", Activity.Current.TraceId.ToString());
        }
        return base.SendAsync(request, cancellationToken);
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Async Message Tracing',
            content: `<p>The hardest part of microservices observability: following traces through message brokers.</p>`,
            code: `// Producer: Inject trace context into Kafka message headers
public class TracedKafkaProducer<TKey, TValue>
{
    private readonly IProducer<TKey, TValue> _producer;
    private static readonly ActivitySource Source = new("Kafka.Producer");

    public async Task ProduceAsync(string topic, TKey key, TValue value)
    {
        using var activity = Source.StartActivity($"Kafka Produce {topic}",
            ActivityKind.Producer);

        var headers = new Headers();

        // Inject W3C trace context into Kafka message headers
        if (activity != null)
        {
            var propagator = Propagators.DefaultTextMapPropagator;
            propagator.Inject(
                new PropagationContext(activity.Context, Baggage.Current),
                headers,
                (h, key, value) => h.Add(key, Encoding.UTF8.GetBytes(value)));

            activity.SetTag("messaging.system", "kafka");
            activity.SetTag("messaging.destination", topic);
            activity.SetTag("messaging.operation", "publish");
        }

        await _producer.ProduceAsync(topic, new Message<TKey, TValue>
        {
            Key = key,
            Value = value,
            Headers = headers
        });
    }
}

// Consumer: Extract trace context and link the consumer span
public class TracedKafkaConsumer<TKey, TValue>
{
    private static readonly ActivitySource Source = new("Kafka.Consumer");

    public void ProcessMessage(ConsumeResult<TKey, TValue> result)
    {
        // Extract parent context from message headers
        var propagator = Propagators.DefaultTextMapPropagator;
        var parentContext = propagator.Extract(
            default,
            result.Message.Headers,
            (headers, key) =>
            {
                var header = headers.FirstOrDefault(h => h.Key == key);
                return header != null
                    ? new[] { Encoding.UTF8.GetString(header.GetValueBytes()) }
                    : Enumerable.Empty<string>();
            });

        // Create consumer span LINKED to the producer span
        using var activity = Source.StartActivity(
            $"Kafka Consume {result.Topic}",
            ActivityKind.Consumer,
            parentContext.ActivityContext);  // This links the traces!

        activity?.SetTag("messaging.system", "kafka");
        activity?.SetTag("messaging.operation", "receive");
        activity?.SetTag("messaging.kafka.partition", result.Partition.Value);
        activity?.SetTag("messaging.kafka.offset", result.Offset.Value);

        // Now process the message — all logs/spans inside are part of the same trace
        HandleMessage(result.Message.Value);
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Health Checks',
            content: `<p>Health checks are the foundation of service reliability in Kubernetes/load-balanced environments:</p>`,
            code: `// Program.cs — Comprehensive health check setup
builder.Services.AddHealthChecks()
    // Liveness: "Is the process alive?" (if fails → K8s restarts the pod)
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: new[] { "live" })
    
    // Readiness: "Can this instance serve traffic?" (if fails → removed from LB)
    .AddSqlServer(
        connectionString: builder.Configuration.GetConnectionString("OrderDb")!,
        name: "database",
        tags: new[] { "ready" })
    .AddRedis(
        connectionString: builder.Configuration["Redis:Connection"]!,
        name: "redis-cache",
        tags: new[] { "ready" })
    .AddUrlGroup(
        new Uri("http://payment-service/health/live"),
        name: "payment-service",
        tags: new[] { "ready" })
    .AddKafka(
        config => config.BootstrapServers = "kafka:9092",
        name: "kafka",
        tags: new[] { "ready" });

var app = builder.Build();

// Map health endpoints
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("live"),
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

// Kubernetes probes configuration (in deployment.yaml):
// livenessProbe:
//   httpGet: { path: /health/live, port: 8080 }
//   initialDelaySeconds: 5
//   periodSeconds: 10
// readinessProbe:
//   httpGet: { path: /health/ready, port: 8080 }
//   initialDelaySeconds: 10
//   periodSeconds: 5`,
            language: 'csharp'
        },
        {
            title: 'Best Practices',
            content: `<ul>
<li><strong>Every service MUST emit RED metrics</strong> — Rate, Errors, Duration. This is non-negotiable. Use a shared library/middleware that does it automatically.</li>
<li><strong>Propagate trace context through EVERYTHING</strong> — HTTP headers, gRPC metadata, Kafka message headers, RabbitMQ properties, background job payloads. If context breaks, your trace breaks.</li>
<li><strong>Use semantic conventions</strong> — OpenTelemetry defines standard attribute names (http.method, db.system, messaging.system). Don't invent your own.</li>
<li><strong>Health checks must be fast and dependency-aware</strong> — Liveness = process alive (no I/O). Readiness = dependencies reachable. Never make liveness depend on external services.</li>
<li><strong>Add service version to all telemetry</strong> — When latency spikes, you need to know which deployment caused it. Tag every span/metric with service.version.</li>
<li><strong>Create a shared observability package</strong> — Don't copy-paste OTel setup across 20 services. Create a NuGet package with your standard configuration.</li>
<li><strong>Emit deployment events as annotations</strong> — Mark deployments on Grafana dashboards. Most incidents correlate with recent deploys.</li>
<li><strong>Monitor inter-service latency, not just total</strong> — If OrderService → PaymentService takes 2s, you need to see that breakdown, not just "order took 3s total."</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>Breaking trace propagation at message boundaries</strong> — Publishing to Kafka without injecting traceparent into message headers. The consumer starts a new, disconnected trace. Fix: always inject/extract context.</li>
<li><strong>Making liveness probes depend on external services</strong> — Database is down → health check fails → K8s kills ALL pods → total outage (the database being down killed the pods that don't even need it for startup). Liveness must only check the process itself.</li>
<li><strong>Logging request/response bodies in production</strong> — PII exposure risk + massive log volume. Log sanitized summaries, not full payloads. Exception: keep a sampling mechanism for debugging specific issues.</li>
<li><strong>No baseline metrics before launch</strong> — You deploy a new service and have no idea what "normal" looks like. Set up dashboards and run load tests BEFORE production traffic hits.</li>
<li><strong>One giant dashboard for all services</strong> — 50 panels, nobody can find anything. One dashboard per service, with a top-level "platform health" overview linking to each.</li>
<li><strong>Ignoring async latency</strong> — Kafka consumer lag = invisible latency. Users see "order pending" for 30 minutes because no one monitors consumer group lag metrics.</li>
<li><strong>No trace context in error responses</strong> — When an API returns 500, include the trace_id in the error response body. Support engineers can jump directly to the trace.</li>
</ul>`
        },
        {
            title: 'Interview Tips',
            content: `<p>Microservices observability questions reveal whether you've actually operated distributed systems in production:</p>`,
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>End-to-end trace thinking</strong> — Can you explain how a request is traced from API gateway through async message queues to the final consumer? Candidates who only know HTTP tracing get filtered out.</li>
<li><strong>Health check depth</strong> — Do you know the difference between liveness and readiness? Can you explain why a bad health check can cause cascading failures?</li>
<li><strong>Real incident stories</strong> — "Walk me through debugging a latency issue across 5 services." Real production experience shines here.</li>
<li><strong>Cost/volume awareness</strong> — At scale, observability is expensive. Showing you understand sampling trade-offs and retention policies signals senior maturity.</li>
<li><strong>Service mesh awareness</strong> — Know that Istio/Linkerd can provide observability without app changes (proxy-level metrics/traces) and when that's sufficient vs when you need custom instrumentation.</li>
</ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li>Every microservice MUST emit RED metrics (Rate, Errors, Duration) — no exceptions</li>
<li>Trace context must propagate through HTTP, gRPC, AND message brokers (Kafka/RabbitMQ)</li>
<li>Health checks: Liveness = process alive (no I/O), Readiness = dependencies reachable</li>
<li>Service dependency graphs auto-generate from trace data — invaluable for incident response</li>
<li>Async message tracing requires explicit context injection/extraction in message headers</li>
<li>Shared observability library prevents inconsistency across 20+ services</li>
<li>Consumer lag metrics are as important as HTTP latency in event-driven architectures</li>
<li>Service mesh provides basic observability for free; custom instrumentation adds business context</li>
</ul>`
        }
    ],
    questions: [
        {
            id: 'ms-obs-q1',
            level: 'junior',
            title: 'What is a correlation ID and why is it important in microservices?',
            answer: `<p>A <strong>correlation ID</strong> is a unique identifier (typically a UUID or trace ID) that follows a single user request across all the microservices it touches.</p>
<p><strong>Why it matters:</strong></p>
<ul>
<li>Without it, if Order Service logs "payment failed" and Payment Service logs "timeout on card processor," you have NO way to know these relate to the same request</li>
<li>With it, you filter all logs by correlation_id="abc-123" and see the complete story across all services</li>
</ul>
<p><strong>How it works:</strong></p>
<ol>
<li>First service (usually API Gateway) generates the ID or uses an existing trace ID</li>
<li>Every outgoing HTTP/gRPC call includes it as a header (e.g., X-Correlation-Id or W3C traceparent)</li>
<li>Every log entry includes the correlation ID as a structured field</li>
<li>When debugging, you search by this ID to see all events for one request</li>
</ol>
<p>In OpenTelemetry, the <code>trace_id</code> serves as the correlation ID automatically when you use the SDK.</p>`
        },
        {
            id: 'ms-obs-q2',
            level: 'mid',
            title: 'Explain the difference between liveness, readiness, and startup probes in Kubernetes. What happens if you get them wrong?',
            answer: `<p><strong>Three probe types with different purposes:</strong></p>
<ul>
<li><strong>Liveness Probe:</strong> "Is the process alive and not deadlocked?" If it fails, Kubernetes KILLS and restarts the pod.</li>
<li><strong>Readiness Probe:</strong> "Can this instance handle traffic right now?" If it fails, the pod is removed from the Service's load balancer endpoints (but NOT killed).</li>
<li><strong>Startup Probe:</strong> "Has the application finished booting?" Disables liveness/readiness checks until startup succeeds (prevents killing slow-starting apps).</li>
</ul>
<p><strong>What goes wrong if misconfigured:</strong></p>
<ul>
<li><strong>Liveness depends on database:</strong> Database goes down → liveness fails → K8s kills ALL pods → cascading outage. The app might still serve cached data, but K8s killed it anyway.</li>
<li><strong>No startup probe for slow apps:</strong> App takes 60s to load data. Liveness check at 30s fails → K8s kills it → restart → 30s → kill again → infinite restart loop.</li>
<li><strong>Readiness too sensitive:</strong> Brief network blip → readiness fails → pod removed from LB → traffic shifts to remaining pods → they get overloaded → their readiness fails → cascading removal.</li>
</ul>
<p><strong>Rule of thumb:</strong> Liveness = check only the process (no external calls). Readiness = check critical dependencies. Startup = give slow apps time to initialize.</p>`
        },
        {
            id: 'ms-obs-q3',
            level: 'mid',
            title: 'How do you trace a request through an asynchronous message broker like Kafka or RabbitMQ?',
            answer: `<p><strong>The challenge:</strong> HTTP tracing propagates context automatically via headers. Message brokers break this chain because the producer and consumer are decoupled in time and space.</p>
<p><strong>Solution: Inject/Extract pattern</strong></p>
<ol>
<li><strong>Producer side:</strong> Before publishing, inject the current trace context (traceparent, tracestate) into message headers/properties</li>
<li><strong>Broker:</strong> Message travels through Kafka/RabbitMQ with trace headers attached (brokers don't modify them)</li>
<li><strong>Consumer side:</strong> Before processing, extract trace context from message headers and create a new span LINKED to the original trace</li>
</ol>
<p><strong>Span relationship:</strong> The consumer span should use a LINK (not parent-child) because:</p>
<ul>
<li>A consumer may batch-process messages from different traces</li>
<li>The time gap between produce and consume can be hours</li>
<li>Parent-child implies synchronous call; link implies "related but independent"</li>
</ul>
<p><strong>What you see in Jaeger/Tempo:</strong> The original trace shows "Published to orders.created" and a link to the consumer trace. Clicking the link jumps to the consumer's processing trace.</p>
<p>OpenTelemetry's messaging semantic conventions define standard attributes: <code>messaging.system</code>, <code>messaging.destination</code>, <code>messaging.operation</code>, <code>messaging.kafka.partition</code>.</p>`
        },
        {
            id: 'ms-obs-q4',
            level: 'senior',
            title: 'How would you build a service dependency graph that auto-updates as services are added or removed?',
            answer: `<p><strong>A service dependency graph</strong> shows which services call which, with traffic volume and error rates on each edge. It should be auto-generated, never manually maintained.</p>
<p><strong>Approach 1: Trace-based (recommended)</strong></p>
<ul>
<li>Every distributed trace contains caller → callee relationships (parent span service → child span service)</li>
<li>Trace backends (Tempo, Jaeger) aggregate these into a service graph with edge metrics (requests/sec, error rate, latency)</li>
<li>As new services appear in traces, they auto-appear in the graph</li>
<li>Grafana's "Service Graph" panel renders this as a topology view</li>
</ul>
<p><strong>Approach 2: Service mesh (Istio/Linkerd)</strong></p>
<ul>
<li>Sidecar proxies see ALL traffic between services</li>
<li>Kiali (Istio) or Linkerd Viz auto-generates the dependency graph from proxy metrics</li>
<li>Advantage: works even without application-level instrumentation</li>
<li>Disadvantage: only sees network calls, not logical dependencies (e.g., shared database)</li>
</ul>
<p><strong>Approach 3: Hybrid</strong></p>
<ul>
<li>Use trace-based graph for application dependencies</li>
<li>Enrich with infrastructure dependencies (databases, caches, queues) from health check registrations</li>
<li>Store in a graph database (Neo4j) for complex queries: "What services would be affected if Redis goes down?"</li>
</ul>
<p><strong>Production tip:</strong> The graph is most valuable DURING incidents. Show error rates on edges in real-time. "OrderService → PaymentService edge is 40% errors" immediately tells you where to look.</p>`
        },
        {
            id: 'ms-obs-q5',
            level: 'senior',
            title: 'What metrics should every microservice expose? How do you standardize this across 50+ services?',
            answer: `<p><strong>Mandatory metrics per service (RED + business):</strong></p>
<p><strong>RED metrics (request-driven):</strong></p>
<ul>
<li><code>http_requests_total{method, path, status_code}</code> — Rate + Errors</li>
<li><code>http_request_duration_seconds{method, path}</code> — Duration (histogram with p50/p95/p99)</li>
</ul>
<p><strong>Dependency metrics:</strong></p>
<ul>
<li><code>outgoing_requests_total{target_service, status}</code> — Calls to other services</li>
<li><code>outgoing_request_duration_seconds{target_service}</code> — Latency to dependencies</li>
<li><code>circuit_breaker_state{target_service}</code> — 0=closed, 1=open, 0.5=half-open</li>
</ul>
<p><strong>Infrastructure metrics:</strong></p>
<ul>
<li><code>db_connections_active</code>, <code>db_connections_idle</code> — Connection pool health</li>
<li><code>message_consumer_lag{topic, group}</code> — Kafka consumer lag</li>
<li><code>process_cpu_seconds_total</code>, <code>process_memory_bytes</code> — Runtime resource usage</li>
</ul>
<p><strong>Standardization approach for 50+ services:</strong></p>
<ol>
<li>Create a shared NuGet package (e.g., <code>Company.Observability</code>) that registers all standard middleware + metrics</li>
<li>Package includes: OTel SDK configuration, correlation middleware, health check base, standard metric names</li>
<li>Services call <code>builder.Services.AddStandardObservability()</code> — one line for full setup</li>
<li>Enforce via CI: fail the build if the package isn't referenced or version is outdated</li>
<li>Template Grafana dashboards that work with the standard metric names — auto-provision per service</li>
</ol>`
        },
        {
            id: 'ms-obs-q6',
            level: 'senior',
            title: 'How does a service mesh (Istio/Linkerd) provide observability without application code changes? What are its limitations?',
            answer: `<p><strong>How it works:</strong> A service mesh injects a sidecar proxy (Envoy in Istio, linkerd-proxy in Linkerd) next to every pod. ALL traffic goes through this proxy.</p>
<p><strong>What the proxy provides for free:</strong></p>
<ul>
<li><strong>RED metrics</strong> — request rate, error rate, latency for every service-to-service call</li>
<li><strong>mTLS handshake data</strong> — which service authenticated as what identity</li>
<li><strong>TCP-level metrics</strong> — connection count, bytes transferred, retries</li>
<li><strong>Basic distributed tracing</strong> — the proxy can generate/propagate trace headers (but only for the network hop, not inside the application)</li>
<li><strong>Service dependency graph</strong> — auto-generated from observed traffic</li>
</ul>
<p><strong>Limitations (why you still need app-level instrumentation):</strong></p>
<ul>
<li><strong>No business context</strong> — The proxy sees HTTP 500, but not "payment_declined" vs "timeout" vs "insufficient_funds"</li>
<li><strong>No internal spans</strong> — Inside the service, database calls, cache lookups, and business logic are invisible</li>
<li><strong>No async message tracing</strong> — Kafka/RabbitMQ traffic doesn't go through the HTTP proxy</li>
<li><strong>Shallow traces</strong> — You see service-to-service hops but not what happened WITHIN each service</li>
<li><strong>No custom metrics</strong> — Business KPIs (orders/minute, revenue) require app code</li>
</ul>
<p><strong>Best practice:</strong> Use service mesh as the baseline (free RED metrics + dependency graph) and add OpenTelemetry for depth (custom spans, business metrics, async tracing).</p>`
        },
        {
            id: 'ms-obs-q7',
            level: 'lead',
            title: 'You have 30 microservices and inconsistent observability. How do you drive adoption of a unified observability standard across all teams?',
            answer: `<p><strong>This is an organizational challenge as much as a technical one.</strong></p>
<p><strong>Phase 1: Establish the standard (Week 1-2)</strong></p>
<ul>
<li>Define the "Observability Contract" — every service MUST: emit RED metrics, propagate trace context, expose health endpoints, use structured logging with standard fields</li>
<li>Write an ADR documenting the decision and tooling choices</li>
<li>Build the shared library/package that implements the contract with one line of code</li>
</ul>
<p><strong>Phase 2: Make it easy (Week 3-4)</strong></p>
<ul>
<li>Create a service template (dotnet new template) with observability pre-configured</li>
<li>Build Grafana dashboard templates that auto-work when services use the standard metrics</li>
<li>Provide a migration guide for existing services (usually 1-2 hours of work per service)</li>
<li>Offer "office hours" where platform team helps migrate services</li>
</ul>
<p><strong>Phase 3: Make it mandatory (Month 2)</strong></p>
<ul>
<li>CI gate: new services must reference the observability package</li>
<li>Compliance dashboard: "Service X has health checks: YES, traces: NO, metrics: PARTIAL"</li>
<li>Tie to deployment: you cannot deploy to production without passing observability readiness check</li>
</ul>
<p><strong>Phase 4: Show value (ongoing)</strong></p>
<ul>
<li>Demo how observability saved an incident (5-minute MTTR vs 2 hours previously)</li>
<li>Celebrate teams that find issues via dashboards BEFORE customers report them</li>
<li>Share weekly "Observability Wins" in engineering channel</li>
</ul>
<p><strong>Key principle:</strong> Make the right thing the easy thing. If using your observability library is harder than not using it, adoption will fail.</p>`
        },
        {
            id: 'ms-obs-q8',
            level: 'lead',
            title: 'How do you monitor and alert on Kafka consumer lag effectively? What does high lag actually mean?',
            answer: `<p><strong>Consumer lag</strong> = the difference between the latest offset in a partition and the consumer group's committed offset. It represents "how many messages are waiting to be processed."</p>
<p><strong>What high lag means:</strong></p>
<ul>
<li><strong>Processing is slower than production rate</strong> — consumers can't keep up</li>
<li><strong>Users experience delays</strong> — an order published 10 minutes ago still hasn't been processed</li>
<li><strong>Potential data staleness</strong> — read models, caches, and projections are out of date</li>
</ul>
<p><strong>Monitoring approach:</strong></p>
<ol>
<li><strong>Metric:</strong> <code>kafka_consumer_group_lag{group, topic, partition}</code> (exposed by Kafka Exporter or Burrow)</li>
<li><strong>Alert on lag RATE, not absolute value:</strong> A spike from 0 to 10,000 is concerning. A steady 500 might be normal (processing batches).</li>
<li><strong>Alert on lag AGE:</strong> "Oldest unprocessed message is 5 minutes old" is more meaningful than "5000 messages behind" (because message rate varies).</li>
</ol>
<p><strong>Alert thresholds (example):</strong></p>
<ul>
<li><strong>Warning:</strong> Lag age > 2 minutes (create ticket)</li>
<li><strong>Critical:</strong> Lag age > 10 minutes (page on-call)</li>
<li><strong>Emergency:</strong> Lag growing continuously for 30+ minutes (all hands)</li>
</ul>
<p><strong>Common causes of high lag:</strong></p>
<ul>
<li>Consumer is processing each message too slowly (add more consumers or optimize processing)</li>
<li>Consumer is stuck/crashed (pod OOMKilled, unhandled exception in processing loop)</li>
<li>Rebalance storm (consumers repeatedly joining/leaving group)</li>
<li>Burst of messages from upstream (spike in orders/events)</li>
</ul>
<p><strong>Resolution:</strong> Scale consumers (more pods), fix slow processing, or temporarily increase partition count for more parallelism.</p>`
        },
        {
            id: 'ms-obs-q9',
            level: 'architect',
            title: 'Design an observability platform for a 200-service company. What are the key architectural decisions?',
            answer: `<p><strong>At 200 services, observability becomes a platform product served by a dedicated team.</strong></p>
<p><strong>Key architectural decisions:</strong></p>
<p><strong>1. Collection topology:</strong></p>
<ul>
<li>OTel Collector as DaemonSet (one per node) for low-latency local collection</li>
<li>OTel Collector Gateway (per-region) for sampling, enrichment, and routing</li>
<li>Reason: DaemonSet handles volume locally; Gateway provides central policy control</li>
</ul>
<p><strong>2. Storage backend:</strong></p>
<ul>
<li>Metrics: Mimir (horizontally scalable Prometheus, backed by S3)</li>
<li>Logs: Loki (label-indexed, object storage backend, cost-effective at scale)</li>
<li>Traces: Tempo (trace-ID lookup + TraceQL, S3 backend, scales to petabytes)</li>
<li>All three use object storage (S3/GCS) for infinite retention at low cost</li>
</ul>
<p><strong>3. Multi-tenancy:</strong></p>
<ul>
<li>Each team gets their own tenant in the observability platform</li>
<li>Quotas per tenant (prevent one noisy service from consuming all capacity)</li>
<li>Teams own their dashboards, alerts, and SLOs</li>
<li>Platform team owns the infrastructure and shared standards</li>
</ul>
<p><strong>4. Sampling strategy:</strong></p>
<ul>
<li>Tail-based sampling at the Gateway Collector: keep 100% of errors + slow requests + random 5% of healthy</li>
<li>Expected reduction: 80-90% less trace volume while keeping all interesting data</li>
<li>Per-service override: high-value services (payments) keep 100%</li>
</ul>
<p><strong>5. Self-service:</strong></p>
<ul>
<li>Shared NuGet/npm packages for standard instrumentation</li>
<li>Dashboard-as-code (Terraform/Grafana provisioning) so teams manage their own dashboards via PR</li>
<li>SLO definition in YAML checked into each service's repo, auto-provisioned into alerting</li>
</ul>
<p><strong>6. Cost model:</strong></p>
<ul>
<li>Chargeback: each team sees their monthly telemetry cost</li>
<li>Budget alerts: "Your service is generating 10x more logs than last month — investigate?"</li>
<li>Cost optimization reviews quarterly (remove unused dashboards, tighten sampling, reduce retention)</li>
</ul>`
        },
        {
            id: 'ms-obs-q10',
            level: 'architect',
            title: 'How would you diagnose and fix a latency issue where p99 is 10x worse than p50 across a chain of 8 microservices?',
            answer: `<p><strong>Systematic approach using observability data:</strong></p>
<p><strong>Step 1: Identify the scope</strong></p>
<ul>
<li>Check: Is p99 elevated for ALL endpoints or specific ones? (metric: http_request_duration_seconds by path)</li>
<li>Check: Is it ALL users or a subset? (trace exemplars to identify patterns)</li>
<li>In this case: POST /checkout p99=4.5s, p50=400ms — 10x gap confirmed</li>
</ul>
<p><strong>Step 2: Find the bottleneck service</strong></p>
<ul>
<li>Look at the service dependency graph with edge latency. Which edge has the highest p99?</li>
<li>Example: OrderService → InventoryService edge shows p99=3.2s (most of the 4.5s total)</li>
</ul>
<p><strong>Step 3: Drill into traces</strong></p>
<ul>
<li>Filter traces: duration > 4s AND service = "InventoryService"</li>
<li>Compare slow traces vs fast traces. What's different?</li>
<li>Finding: Slow traces all have a span "SELECT ... FROM inventory WHERE sku IN (...)" taking 2.8s</li>
</ul>
<p><strong>Step 4: Root cause</strong></p>
<ul>
<li>The slow query only triggers when the cart has 10+ items (large IN clause)</li>
<li>p50 = most carts have 2-3 items (fast). p99 = carts with 15+ items (slow query plan, missing index)</li>
</ul>
<p><strong>Step 5: Fix + verify</strong></p>
<ul>
<li>Add covering index on inventory.sku</li>
<li>Watch p99 drop from 4.5s to 600ms in real-time on the latency histogram dashboard</li>
<li>Confirm no SLO budget was consumed during the issue</li>
</ul>
<p><strong>Key tooling used:</strong> Metrics (identified p99 vs p50 gap) → Service Graph (found the bottleneck edge) → Traces (identified the slow span) → Logs (showed the actual query) → Metrics again (confirmed fix). This is the power of correlated observability.</p>`
        }
    ]
});
