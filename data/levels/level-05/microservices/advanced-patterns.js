/* ═══════════════════════════════════════════════════════════════════
   MICROSERVICES — Advanced Patterns (Expert-Level)
   Patterns and techniques known primarily to senior/staff engineers:
   idempotency, CDC/outbox relay, event versioning, distributed locking,
   service mesh internals, multi-tenancy, zero-downtime deployment.
   Reference: https://microservices.io/patterns/index.html
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('microservices-advanced-patterns', {

    title: 'Microservices: Advanced Patterns',
    level: 5,
    group: 'microservices',
    description: 'Expert-level microservices patterns rarely covered in tutorials but essential in production: idempotency keys, Change Data Capture, event schema evolution, distributed locking with fencing tokens, service mesh internals, multi-tenancy isolation, and zero-downtime deployment mechanics.',
    difficulty: 'expert',
    estimatedMinutes: 50,
    prerequisites: ['microservices-patterns', 'microservices-data', 'microservices-resilience', 'microservices-deployment'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>The standard microservices curriculum (sagas, circuit breakers, API gateways) gets you to
            <em>mid-level</em>. The patterns in this lesson separate senior/staff engineers from the rest — they
            address problems that only surface in <strong>production at scale</strong>: duplicate processing,
            schema drift, split-brain coordination, noisy-neighbor isolation, and deployments that must not drop
            a single request.</p>
            <p>These patterns come from the <a href="https://microservices.io/patterns/index.html"
            target="_blank">microservices.io pattern language</a> and real production war stories. Each is a
            response to a specific failure mode you will only encounter once your system has real traffic.</p>`
        },
        {
            title: 'Idempotency Patterns',
            content: `<p><strong>Idempotency</strong> means processing a request multiple times produces the same
            result as processing it once. In distributed systems, retries are inevitable (network timeouts, at-least-once
            delivery) — without idempotency, a retried payment charges twice.</p>
            <ul>
                <li><strong>Idempotency Key</strong> — the client sends a unique key (UUID) with each request;
                the server stores (key → result) and returns the cached result on duplicates.</li>
                <li><strong>Deduplication Store</strong> — consumers track processed message IDs and skip
                duplicates. Essential for event-driven systems with at-least-once brokers.</li>
                <li><strong>Natural Idempotency</strong> — design operations to be inherently idempotent (e.g.,
                "set balance to X" not "add X to balance").</li>
            </ul>`,
            code: `// Idempotency key pattern (server-side, C#)
[HttpPost("payments")]
public async Task<IActionResult> CreatePayment(
    [FromHeader(Name = "Idempotency-Key")] string idempotencyKey,
    [FromBody] PaymentRequest request)
{
    // 1. Check if we already processed this key
    var existing = await _dedup.GetAsync(idempotencyKey);
    if (existing is not null)
        return Ok(existing);  // Return cached result — no double-charge

    // 2. Process the payment
    var result = await _paymentService.ChargeAsync(request);

    // 3. Store the result keyed by idempotency key (TTL: 24h)
    await _dedup.SetAsync(idempotencyKey, result, TimeSpan.FromHours(24));

    return Created($"payments/{result.Id}", result);
}

// Consumer-side deduplication (event handler)
public async Task HandleOrderCreated(OrderCreatedEvent evt)
{
    // Skip if already processed (at-least-once delivery)
    if (await _processedEvents.ContainsAsync(evt.EventId))
        return;

    await _inventoryService.ReserveStock(evt.Items);
    await _processedEvents.AddAsync(evt.EventId);  // Mark processed
}`,
            language: 'csharp',
            callout: { type: 'warning', title: 'Race condition', text: 'The check-then-process-then-store sequence has a race window. Use a database UNIQUE constraint on the idempotency key or an atomic upsert to prevent concurrent duplicates.' }
        },
        {
            title: 'Change Data Capture (CDC) & Outbox Relay',
            content: `<p>The <strong>Transactional Outbox</strong> solves the dual-write problem (write to DB + publish
            event atomically), but <em>something</em> must relay outbox rows to the broker. That relay is powered by
            <strong>Change Data Capture (CDC)</strong> — reading the database transaction log to detect new outbox
            entries and publishing them.</p>
            <ul>
                <li><strong>Log-based CDC</strong> (Debezium, AWS DMS) — reads the DB WAL/binlog; zero polling,
                near-real-time, no changes to application code.</li>
                <li><strong>Polling Publisher</strong> — a scheduled job queries the outbox table for unpublished
                rows. Simpler, but adds latency and DB load.</li>
                <li><strong>Exactly-once semantics</strong> — CDC + idempotent consumers achieve effective
                exactly-once processing without distributed transactions.</li>
            </ul>`,
            mermaid: `flowchart LR
    App["Service"] -->|"1. INSERT order + outbox row in ONE transaction"| DB["Database"]
    CDC["CDC / Debezium"] -->|"2. Read WAL/binlog"| DB
    CDC -->|"3. Publish event"| Broker["Kafka / RabbitMQ"]
    Broker -->|"4. Deliver"| Consumer["Consumer (idempotent)"]`,
            code: `-- Outbox table schema (SQL Server / PostgreSQL)
CREATE TABLE Outbox (
    Id            BIGINT IDENTITY PRIMARY KEY,
    AggregateId   UNIQUEIDENTIFIER NOT NULL,
    EventType     NVARCHAR(256) NOT NULL,
    Payload       NVARCHAR(MAX) NOT NULL,   -- JSON serialized event
    CreatedAt     DATETIME2 DEFAULT SYSUTCDATETIME(),
    PublishedAt   DATETIME2 NULL            -- NULL = not yet relayed
);

-- Application writes both in one transaction:
BEGIN TRANSACTION;
    INSERT INTO Orders (Id, CustomerId, Total, Status)
    VALUES (@orderId, @customerId, @total, 'Created');

    INSERT INTO Outbox (AggregateId, EventType, Payload)
    VALUES (@orderId, 'OrderCreated', @eventJson);
COMMIT;
-- If either fails, both roll back → no orphan event, no missing event.

-- Polling relay (simple approach):
-- SELECT TOP 100 * FROM Outbox WHERE PublishedAt IS NULL ORDER BY Id;
-- Publish each to broker, then UPDATE SET PublishedAt = GETUTCDATE();

-- Log-based CDC (Debezium) eliminates the polling — it tails the WAL
-- and streams new Outbox rows to Kafka automatically.`,
            language: 'sql'
        },
        {
            title: 'Event Schema Evolution & Versioning',
            content: `<p>Events published today must be readable by consumers deployed months later (and vice versa).
            <strong>Schema evolution</strong> is how you change event structure without breaking existing
            consumers — one of the hardest operational problems in event-driven systems.</p>
            <ul>
                <li><strong>Backward compatible</strong> — new consumers can read old events (add optional fields,
                never remove/rename required fields).</li>
                <li><strong>Forward compatible</strong> — old consumers can read new events (ignore unknown fields).</li>
                <li><strong>Schema Registry</strong> (Confluent, AWS Glue) — central store of event schemas with
                compatibility checks on publish. Rejects breaking changes at deploy time.</li>
                <li><strong>Versioned event types</strong> — publish <code>OrderCreated.v2</code> alongside v1;
                consumers upgrade on their own schedule.</li>
            </ul>`,
            code: `// Schema evolution rules (Avro/Protobuf style):
// ✅ SAFE changes (backward + forward compatible):
//   - Add an optional field with a default value
//   - Add a new event type (existing consumers ignore it)
//   - Deprecate a field (keep it, stop populating)

// ❌ BREAKING changes (require versioning or migration):
//   - Remove a required field
//   - Rename a field
//   - Change a field's type (int → string)
//   - Change the meaning of a field

// Versioned event approach (C#):
public abstract record OrderEvent(Guid OrderId, DateTime OccurredAt);
public record OrderCreatedV1(Guid OrderId, DateTime OccurredAt,
    string CustomerId, decimal Total) : OrderEvent(OrderId, OccurredAt);
public record OrderCreatedV2(Guid OrderId, DateTime OccurredAt,
    string CustomerId, decimal Total, string Currency,  // NEW: added
    Address? ShippingAddress) : OrderEvent(OrderId, OccurredAt);  // NEW: optional

// Consumer handles both versions via pattern matching:
public async Task Handle(OrderEvent evt) => evt switch
{
    OrderCreatedV2 v2 => await Process(v2.CustomerId, v2.Total, v2.Currency),
    OrderCreatedV1 v1 => await Process(v1.CustomerId, v1.Total, "USD"), // default
    _ => throw new UnknownEventVersionException(evt)
};

// Schema Registry enforces at publish time:
// Producer registers schema → registry checks compatibility mode →
// REJECT if breaking → producer must fix before deploying.`,
            language: 'csharp',
            callout: { type: 'info', title: 'The golden rule', text: 'Never remove or rename a field in a published event. Only add optional fields. If you must make a breaking change, publish a new event type version and run both in parallel until all consumers migrate.' }
        },
        {
            title: 'Distributed Locking & Fencing Tokens',
            content: `<p>Sometimes you need mutual exclusion across services — a scheduled job that must run on
            exactly one instance, or a resource that only one consumer should process at a time. <strong>Distributed
            locks</strong> provide this, but they are treacherous: network partitions and GC pauses can violate the
            lock guarantee.</p>
            <ul>
                <li><strong>Redlock</strong> (Redis) — acquire a lock on N/2+1 Redis nodes; if the majority agrees,
                you hold the lock. Still controversial (see Martin Kleppmann's analysis).</li>
                <li><strong>Fencing tokens</strong> — each lock acquisition gets a monotonically increasing token;
                the protected resource rejects requests with a stale (lower) token. This is what makes distributed
                locks safe even when a lock holder is falsely considered dead.</li>
                <li><strong>Lease-based locks</strong> — lock auto-expires after a TTL; the holder must renew.
                If it crashes, the lock self-heals. But if GC pauses exceed the TTL, the lock is violated without
                fencing.</li>
            </ul>`,
            code: `// Distributed lock with fencing token (conceptual C#)
public class DistributedLock
{
    private readonly IRedisClient _redis;

    public async Task<LockResult?> AcquireAsync(string resource, TimeSpan ttl)
    {
        var fencingToken = await _redis.IncrementAsync("lock:token:" + resource);
        var acquired = await _redis.SetIfNotExistsAsync(
            "lock:" + resource,
            fencingToken.ToString(),
            ttl);

        return acquired ? new LockResult(fencingToken, ttl) : null;
    }
}

// The protected resource validates the fencing token:
public async Task<IActionResult> ProcessExclusiveJob(
    [FromHeader(Name = "X-Fencing-Token")] long fencingToken,
    [FromBody] JobRequest request)
{
    // Reject if a newer lock holder already wrote
    var lastToken = await _db.GetLastFencingTokenAsync(request.ResourceId);
    if (fencingToken <= lastToken)
        return Conflict("Stale lock — a newer holder already processed this.");

    await _db.ProcessAndRecordTokenAsync(request, fencingToken);
    return Ok();
}

// WHY fencing tokens matter:
// 1. Service A acquires lock (token=42), then has a long GC pause
// 2. Lock TTL expires; Service B acquires lock (token=43), processes work
// 3. Service A wakes up, thinks it still holds the lock, sends request
// 4. Resource sees token 42 < 43 → REJECTS A's stale request
// Without fencing: A's stale write would corrupt data.`,
            language: 'csharp'
        },
        {
            title: 'Service Mesh Internals',
            content: `<p>A <strong>service mesh</strong> (Istio, Linkerd, Consul Connect) provides mTLS, traffic
            management, and observability without application code changes. Understanding <em>how</em> it works
            separates staff engineers from those who just know the name.</p>`,
            table: {
                headers: ['Layer', 'Component', 'Responsibility'],
                rows: [
                    ['Data Plane', 'Sidecar proxy (Envoy)', 'Intercepts all traffic; handles mTLS, retries, load balancing, metrics'],
                    ['Control Plane', 'Istiod / Linkerd control', 'Configures proxies, pushes policy, issues certificates'],
                    ['Certificate Authority', 'Built-in CA (SPIFFE)', 'Issues short-lived mTLS certs per workload identity'],
                    ['Traffic Policy', 'VirtualService / TrafficSplit', 'Canary routing, fault injection, rate limiting per route'],
                    ['Observability', 'Metrics + traces via proxy', 'Golden signals (latency, traffic, errors, saturation) without app instrumentation']
                ]
            },
            code: `# Istio traffic splitting (canary release) — YAML
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts: [order-service]
  http:
  - route:
    - destination:
        host: order-service
        subset: stable
      weight: 90          # 90% to current version
    - destination:
        host: order-service
        subset: canary
      weight: 10          # 10% to new version
---
# Destination rules define subsets (versions)
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: order-service
spec:
  host: order-service
  subsets:
  - name: stable
    labels: { version: v1 }
  - name: canary
    labels: { version: v2 }

# What the mesh gives you WITHOUT code changes:
# • mTLS between every service (zero-trust network)
# • Per-route retries, timeouts, circuit breakers
# • Canary/blue-green traffic splitting
# • Distributed tracing propagation (headers injected by proxy)
# • Metrics (p50/p99 latency, error rate) per service pair`,
            language: 'yaml',
            callout: { type: 'info', title: 'Cost of a mesh', text: 'A service mesh adds ~2-5ms latency per hop (proxy overhead), doubles pod count (sidecar per service), and requires operational expertise. It pays off at 20+ services with security/compliance requirements. For 5 services, it is usually overkill.' }
        },
        {
            title: 'Multi-Tenancy Patterns',
            content: `<p><strong>Multi-tenancy</strong> serves multiple customers (tenants) from shared infrastructure.
            The challenge: isolate tenants so one cannot access another's data or starve another's resources
            (noisy neighbor). Three isolation models exist, each trading cost against isolation strength.</p>`,
            table: {
                headers: ['Model', 'Isolation Level', 'Cost', 'Use When'],
                rows: [
                    ['Shared everything (pool)', 'Row-level (tenant_id column)', 'Lowest', 'Many small tenants, cost-sensitive SaaS'],
                    ['Database-per-tenant', 'Schema/DB level', 'Medium', 'Compliance requires data separation'],
                    ['Instance-per-tenant (silo)', 'Full compute+data', 'Highest', 'Enterprise customers with strict SLA/compliance']
                ]
            },
            code: `// Shared-pool tenancy: every query must include tenant_id
// CRITICAL: a missing WHERE tenant_id = @tenantId leaks data across tenants!

// Middleware extracts tenant from JWT/header and sets context:
public class TenantMiddleware
{
    public async Task InvokeAsync(HttpContext ctx, ITenantContext tenantCtx)
    {
        var tenantId = ctx.User.FindFirst("tenant_id")?.Value
            ?? throw new UnauthorizedAccessException("No tenant claim");
        tenantCtx.Set(tenantId);
        await _next(ctx);
    }
}

// EF Core global query filter — automatically adds WHERE tenant_id = X
public class AppDbContext : DbContext
{
    private readonly ITenantContext _tenant;
    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Order>().HasQueryFilter(o => o.TenantId == _tenant.Id);
        mb.Entity<Product>().HasQueryFilter(p => p.TenantId == _tenant.Id);
        // Every query on these entities automatically scoped — can't forget!
    }
}

// Noisy-neighbor prevention (rate limiting per tenant):
// Use a per-tenant token bucket or sliding window:
services.AddRateLimiter(opts =>
{
    opts.AddPolicy("per-tenant", ctx =>
    {
        var tenantId = ctx.User.FindFirst("tenant_id")?.Value ?? "anon";
        return RateLimitPartition.GetTokenBucketLimiter(tenantId,
            _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 100,
                ReplenishmentPeriod = TimeSpan.FromSeconds(10),
                TokensPerPeriod = 50
            });
    });
});`,
            language: 'csharp'
        },
        {
            title: 'Zero-Downtime Deployment Mechanics',
            content: `<p>Deploying without dropping requests requires coordination at the infrastructure level.
            The principles: <strong>graceful shutdown</strong> (drain in-flight requests before stopping),
            <strong>readiness probes</strong> (don't route until ready), and <strong>connection draining</strong>
            (load balancer stops sending new traffic, waits for existing connections to finish).</p>`,
            code: `// .NET 8 graceful shutdown — drain in-flight requests
var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(k =>
{
    k.Limits.KeepAliveTimeout = TimeSpan.FromSeconds(120);
});
var app = builder.Build();

// IHostApplicationLifetime hooks:
app.Lifetime.ApplicationStopping.Register(() =>
{
    // Kubernetes sends SIGTERM → this fires
    // 1. Mark unhealthy (readiness probe fails → no new traffic)
    // 2. Wait for in-flight requests to complete (gracePeriod)
    Log.Information("Shutting down — draining connections...");
});

// appsettings.json: configure shutdown timeout
// { "HostOptions": { "ShutdownTimeout": "00:00:30" } }
// Kestrel waits up to 30s for in-flight requests before force-stopping.

// Kubernetes deployment with zero-downtime:
// spec:
//   containers:
//   - name: order-service
//     readinessProbe:
//       httpGet: { path: /health/ready, port: 8080 }
//       initialDelaySeconds: 5
//       periodSeconds: 3
//     livenessProbe:
//       httpGet: { path: /health/live, port: 8080 }
//       periodSeconds: 10
//     lifecycle:
//       preStop:
//         exec:
//           command: ["sleep", "5"]  # Wait for LB to deregister
//   strategy:
//     type: RollingUpdate
//     rollingUpdate:
//       maxUnavailable: 0      # Never have fewer than desired pods
//       maxSurge: 1            # Spin up new pod BEFORE killing old one

// Sequence for zero-downtime:
// 1. New pod starts, passes readiness → receives traffic
// 2. Old pod marked for termination:
//    a. preStop hook runs (sleep 5 — gives LB time to deregister)
//    b. SIGTERM sent → app drains in-flight requests
//    c. After ShutdownTimeout, SIGKILL if still running
// 3. No gap in available pods (maxUnavailable: 0)`,
            language: 'csharp'
        },
        {
            title: 'Consumer-Driven Contract Testing',
            content: `<p>In microservices, a provider (API) can break its consumers without knowing. <strong>Consumer-
            Driven Contract Testing</strong> (Pact, Spring Cloud Contract) inverts this: each consumer declares a
            contract ("I call GET /orders/123 and expect { id, status, total }"), and the provider verifies all
            consumer contracts in its CI pipeline. A breaking change is caught before deploy.</p>`,
            code: `// Pact consumer test (TypeScript / Jest):
describe('Order API - consumer contract', () => {
  const provider = new PactV3({
    consumer: 'PaymentService',
    provider: 'OrderService',
  });

  it('GET /orders/:id returns order with status', async () => {
    provider.addInteraction({
      states: [{ description: 'order 123 exists' }],
      uponReceiving: 'a request for order 123',
      withRequest: { method: 'GET', path: '/orders/123' },
      willRespondWith: {
        status: 200,
        body: {
          id: like('123'),
          status: like('Confirmed'),
          total: like(99.99),
          // Consumer only cares about these 3 fields
          // Provider can add new fields freely (won't break this contract)
        }
      }
    });

    await provider.executeTest(async (mockServer) => {
      const client = new OrderClient(mockServer.url);
      const order = await client.getById('123');
      expect(order.status).toBe('Confirmed');
    });
  });
});

// Provider verification (runs in OrderService CI):
// The provider fetches all consumer contracts from a Pact Broker
// and verifies it can satisfy each one. If a code change breaks
// a consumer contract → CI fails → deploy blocked.

// WHY this matters:
// • Integration tests are slow, flaky, and need a full environment
// • Contract tests are fast, local, and catch interface breakage
// • Enables independent deployment: if contracts pass, deploy safely
// • The consumer declares what it needs, not the full API surface`,
            language: 'typescript'
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Idempotency</strong> is non-negotiable for any money/state-changing path in a distributed system — use idempotency keys + deduplication stores</li>
                <li><strong>CDC/Outbox relay</strong> (Debezium) solves the dual-write problem without 2PC — the only production-grade way to publish events atomically with DB writes</li>
                <li><strong>Event versioning</strong> via schema registry + backward compatibility rules prevents consumer breakage as events evolve</li>
                <li><strong>Distributed locks</strong> are unsafe without fencing tokens — a crashed holder's stale request must be rejected by the resource</li>
                <li><strong>Service mesh</strong> (data plane + control plane) gives mTLS/traffic-splitting/observability without code — but only pays off at 20+ services</li>
                <li><strong>Multi-tenancy</strong> requires both data isolation (query filters) and resource isolation (per-tenant rate limiting) to prevent noisy-neighbor and data leakage</li>
                <li><strong>Zero-downtime deploys</strong> need the trinity: readiness probes + graceful shutdown + rolling updates with maxUnavailable=0</li>
                <li><strong>Contract testing</strong> (Pact) enables independent deploy by catching interface breakage in CI, not production</li>
            </ul>`
        },
        {
            title: 'Continue the Series',
            content: `<p>Previous: <a href="#microservices-case-studies">\u2190 Case Studies</a> \u00b7
            Back to <a href="#microservices">Overview</a></p>`
        }
    ],

    questions: [
        {
            question: "What is an idempotency key, and why is it critical for microservices that handle payments or state changes?",
            difficulty: "hard",
            answer: "<p>An <strong>idempotency key</strong> is a unique identifier (typically a client-generated UUID) sent with a request so the server can detect retries and return the cached result instead of re-processing. In distributed systems, retries are inevitable (timeouts, network failures, at-least-once delivery), so without idempotency, a retried payment charges twice or a retried order creates duplicates.</p><p>The server stores (key \u2192 result) atomically with the operation. On a duplicate request with the same key, it returns the stored result. Use a UNIQUE constraint or atomic upsert to prevent race conditions between concurrent duplicates.</p>",
            explanation: "An idempotency key is like a receipt number: if you present the same receipt twice, the cashier checks the log and says \"already processed\" instead of charging again.",
            bestPractices: ["Client generates UUID per logical operation", "Server stores key+result atomically (same transaction as the write)", "Use UNIQUE constraint to prevent concurrent duplicate processing", "Set a TTL on stored keys (24h is typical)"],
            commonMistakes: ["Check-then-process without atomicity (race condition window)", "Server-generated keys (client retries get a new key, defeating the purpose)", "No TTL on stored keys (unbounded storage growth)", "Applying idempotency only at the API layer, not at the message consumer layer"],
            interviewTip: "Lead with WHY (retries are inevitable in distributed systems), then the mechanism (client key + server dedup store + atomic check), then the race condition fix (UNIQUE constraint).",
            followUp: ["How do you handle idempotency for event consumers?", "What is the difference between idempotency and exactly-once delivery?", "How do you clean up expired idempotency keys?"]
        },
        {
            question: "Explain Change Data Capture (CDC) and how it powers the Transactional Outbox relay. Why is it preferred over polling?",
            difficulty: "hard",
            answer: "<p><strong>CDC</strong> reads the database transaction log (WAL/binlog) to detect committed changes in near-real-time. For the outbox pattern, CDC (e.g., Debezium) watches the outbox table and publishes new rows to the message broker automatically \u2014 no application-level polling needed.</p><p>Preferred over polling because: (1) near-zero latency (events published within seconds of commit), (2) no DB query load from repeated SELECT/UPDATE cycles, (3) guaranteed ordering (log is sequential), (4) no missed events (log is append-only). The polling approach adds latency (poll interval), DB load, and can miss events during failures.</p>",
            explanation: "CDC is like having a security camera on the database vault door \u2014 it sees every committed change the instant it happens, rather than sending a guard to check the vault every 5 seconds (polling).",
            bestPractices: ["Use Debezium or equivalent for log-based CDC", "Outbox rows contain the full event payload (no back-reference needed)", "Consumers must be idempotent (CDC guarantees at-least-once)", "Monitor CDC lag as a key operational metric"],
            commonMistakes: ["Polling with long intervals (high latency, missed events during failures)", "Not handling CDC connector restarts (ensure offsets are persisted)", "Forgetting consumer idempotency (CDC replays on restart)", "Storing only a reference in outbox instead of the full payload"],
            interviewTip: "Show the full chain: app writes outbox row in same transaction \u2192 CDC reads WAL \u2192 publishes to broker \u2192 idempotent consumer processes. Mention Debezium by name \u2014 it is the industry standard.",
            followUp: ["What happens if the CDC connector goes down?", "How does CDC handle schema changes in the outbox table?", "What is the difference between log-based and trigger-based CDC?"]
        },
        {
            question: "How do you evolve event schemas in a microservices system without breaking consumers?",
            difficulty: "hard",
            answer: "<p>Use <strong>backward-compatible changes only</strong>: add optional fields with defaults, never remove or rename existing fields. Enforce this via a <strong>Schema Registry</strong> (Confluent, AWS Glue) that validates compatibility before allowing publication. For breaking changes, publish a new versioned event type (e.g., OrderCreated.v2) alongside the old one, letting consumers migrate on their own schedule. Old consumers ignore unknown fields (forward compatibility); new consumers handle both versions via pattern matching.</p>",
            explanation: "Event schema evolution is like updating a form: you can add new optional boxes, but if you remove a box people are already filling in, everyone's workflow breaks.",
            bestPractices: ["Only add optional fields with sensible defaults", "Never remove, rename, or retype existing fields", "Use a Schema Registry with compatibility checks in CI", "Version breaking changes as new event types (OrderCreated.v2)"],
            commonMistakes: ["Renaming fields (breaks all existing consumers)", "No schema registry (breaking changes discovered in production)", "Tight coupling between producer and consumer deploy schedules", "Changing field semantics without a new version"],
            interviewTip: "State the golden rule: only add optional fields. Then mention Schema Registry as the enforcement mechanism and versioned event types as the escape hatch for breaking changes.",
            followUp: ["What compatibility modes does a schema registry support?", "How do you handle event replay after a schema change?", "What is the difference between Avro and Protobuf for schema evolution?"]
        },
        {
            question: "Why are distributed locks dangerous without fencing tokens? Explain the failure scenario.",
            difficulty: "expert",
            answer: "<p>A distributed lock can be <strong>violated by a slow holder</strong>: Service A acquires a lock with TTL, then experiences a long GC pause or network delay that exceeds the TTL. The lock expires; Service B acquires it and processes the resource. When A wakes up, it believes it still holds the lock and sends its (now stale) write \u2014 corrupting B's work.</p><p><strong>Fencing tokens</strong> fix this: each lock acquisition gets a monotonically increasing token. The protected resource tracks the highest token it has seen and rejects any request with a lower token. A's stale request (token 42) arrives after B's (token 43), so the resource rejects it.</p>",
            explanation: "Without fencing tokens, a distributed lock is like a hotel key card that doesn't know the room was re-assigned: you walk in and find someone else's luggage because your card still works after checkout.",
            bestPractices: ["Always pair distributed locks with fencing tokens", "The protected resource must validate the token (reject stale)", "Use monotonically increasing tokens (not random UUIDs)", "Set lock TTL shorter than the expected operation time, with renewal"],
            commonMistakes: ["Trusting lock TTL alone without fencing (GC pauses violate it)", "Using Redlock without understanding its limitations", "Fencing token stored client-side only (resource must enforce)", "No renewal mechanism (long operations exceed TTL)"],
            interviewTip: "Walk through the exact failure: acquire \u2192 GC pause \u2192 TTL expires \u2192 new holder processes \u2192 old holder wakes and writes stale data. Then show how fencing token + resource validation prevents it. Reference Martin Kleppmann's analysis for credibility.",
            followUp: ["What is the Kleppmann vs Antirez debate about Redlock?", "When is a distributed lock the wrong tool?", "How do fencing tokens compare to optimistic concurrency (ETags)?"]
        },
        {
            question: "Describe the data plane vs control plane in a service mesh. What does each do?",
            difficulty: "hard",
            answer: "<p>The <strong>data plane</strong> consists of sidecar proxies (typically Envoy) deployed alongside every service instance. They intercept all inbound/outbound traffic and handle: mTLS termination/origination, load balancing, retries/timeouts, circuit breaking, and metric collection \u2014 all without application code changes.</p><p>The <strong>control plane</strong> (e.g., Istiod) is the brain: it configures all data-plane proxies with routing rules, issues and rotates mTLS certificates, pushes traffic policies (canary splits, fault injection), and aggregates telemetry. The data plane is the muscle; the control plane is the nervous system.</p>",
            explanation: "The data plane is like traffic lights at every intersection (doing the actual routing). The control plane is the city traffic management center that programs all those lights from one place.",
            bestPractices: ["Data plane handles all L4/L7 traffic transparently", "Control plane manages config, certs, and policy centrally", "Monitor data plane latency overhead (typically 2-5ms per hop)", "Use mesh only when service count and security requirements justify it"],
            commonMistakes: ["Confusing the mesh with an API gateway (different layer and purpose)", "Not accounting for sidecar resource overhead (CPU/memory per pod doubles)", "Adopting a mesh for 3-5 services (operational cost exceeds benefit)", "Assuming the mesh replaces application-level error handling"],
            interviewTip: "Name the concrete components: Envoy (data plane), Istiod (control plane), SPIFFE (identity). Then list what each handles. Mentioning the latency trade-off and the scale threshold (20+ services) shows real-world judgment.",
            followUp: ["How does mTLS work in a mesh without app code changes?", "What is traffic splitting used for?", "When is a mesh overkill?"]
        },
        {
            question: "How do you prevent the noisy-neighbor problem in a multi-tenant microservices system?",
            difficulty: "hard",
            answer: "<p>The <strong>noisy-neighbor problem</strong> occurs when one tenant's heavy usage degrades performance for others sharing the same infrastructure. Prevention requires isolation at multiple layers:</p><ul><li><strong>Rate limiting per tenant</strong> \u2014 token bucket or sliding window scoped to tenant_id, so one tenant cannot exhaust shared capacity.</li><li><strong>Resource quotas</strong> \u2014 per-tenant CPU/memory limits in Kubernetes (ResourceQuota per namespace) or dedicated thread pools.</li><li><strong>Data isolation</strong> \u2014 query filters (EF Core global filters with tenant_id) prevent cross-tenant data access; heavy queries from one tenant don't lock tables others need.</li><li><strong>Queue isolation</strong> \u2014 separate message queues or partitions per tenant for processing fairness.</li></ul>",
            explanation: "Noisy-neighbor prevention is like noise insulation in apartments: without it, one loud tenant ruins everyone's sleep. You install soundproofing (rate limits), separate utility meters (resource quotas), and lockable mailboxes (data isolation).",
            bestPractices: ["Per-tenant rate limiting at the API gateway or middleware", "Kubernetes ResourceQuotas or dedicated node pools for large tenants", "EF Core global query filters or RLS policies for data isolation", "Monitor per-tenant resource consumption and alert on outliers"],
            commonMistakes: ["Shared rate limit across all tenants (one large tenant starves small ones)", "No data isolation beyond application logic (SQL injection = full breach)", "Same queue for all tenants (one slow consumer blocks everyone)", "No per-tenant metrics (can't identify the noisy neighbor)"],
            interviewTip: "Structure the answer by layer: API (rate limiting), compute (resource quotas), data (query filters/RLS), messaging (queue isolation). Show you think about isolation holistically, not just one layer.",
            followUp: ["When would you move a tenant to a dedicated silo?", "How does Row-Level Security differ from query filters?", "How do you handle tenant-specific configuration?"]
        },
        {
            question: "Walk through the mechanics of a zero-downtime rolling deployment. What can go wrong?",
            difficulty: "hard",
            answer: "<p>A zero-downtime rolling update replaces pods one at a time: (1) new pod starts and passes <strong>readiness probe</strong> \u2192 load balancer routes traffic to it; (2) old pod is marked for termination: <code>preStop</code> hook runs (sleep 3-5s for LB deregistration), then SIGTERM triggers <strong>graceful shutdown</strong> (drain in-flight requests within ShutdownTimeout); (3) <code>maxUnavailable: 0</code> ensures no capacity gap.</p><p><strong>What can go wrong:</strong> (a) no preStop delay \u2192 LB still sends traffic to the terminating pod (connection errors), (b) no graceful shutdown \u2192 in-flight requests are killed (SIGKILL after 30s), (c) readiness probe too eager \u2192 traffic sent before app is truly ready, (d) database schema incompatible with old version still running (expand-contract migration needed).</p>",
            explanation: "A rolling deploy is like replacing tiles on a busy road one at a time: each new tile must be set (ready) before removing the old one (drain traffic), and you must never have a hole (maxUnavailable: 0).",
            bestPractices: ["maxUnavailable: 0, maxSurge: 1 (new pod ready before old dies)", "preStop sleep 3-5s to allow LB deregistration", "App handles SIGTERM with graceful drain (finish in-flight, reject new)", "Readiness probe checks app is truly ready (DB connected, caches warm)"],
            commonMistakes: ["No preStop hook (LB routes to dying pod for seconds)", "Immediate SIGKILL (no graceful shutdown configured)", "Database migration breaks old pods still running (use expand-contract)", "Readiness probe returns healthy before initialization completes"],
            interviewTip: "Walk through the exact sequence: new pod ready \u2192 old pod preStop \u2192 SIGTERM \u2192 drain \u2192 terminate. Then name the failure modes. This level of specificity proves operational experience.",
            followUp: ["What is an expand-contract database migration?", "How does Kubernetes determine when to send SIGKILL?", "How do you handle long-running requests during shutdown?"]
        },
        {
            question: "What is Consumer-Driven Contract Testing, and how does it enable independent deployment of microservices?",
            difficulty: "hard",
            answer: "<p><strong>Consumer-Driven Contract Testing</strong> (Pact, Spring Cloud Contract) has each consumer declare a contract \u2014 the specific requests it makes and responses it expects. These contracts are verified against the provider in the provider's CI pipeline. If a provider code change would break any consumer contract, CI fails and the deploy is blocked.</p><p>It enables <strong>independent deployment</strong> because: if all consumer contracts pass, the provider can deploy safely without coordinating with consumers. Consumers can also deploy independently because their contract is verified. No shared integration environment is needed \u2014 contracts are fast, local, and deterministic.</p>",
            explanation: "Contract testing is like a handshake agreement: each consumer writes down what it expects, and the provider promises not to break those expectations. If a change would break the promise, it is caught before deployment.",
            bestPractices: ["Consumers own their contracts (they declare what they need)", "Provider verifies ALL consumer contracts in CI", "Use a Pact Broker to share contracts between repos", "Only verify the fields the consumer actually uses (not the full API)"],
            commonMistakes: ["Provider-defined contracts (misses what consumers actually use)", "Testing the full response body instead of relevant fields", "No broker (contracts shared via ad-hoc file copying)", "Skipping contract tests because integration tests exist (they are complementary, not redundant)"],
            interviewTip: "Emphasize the inversion: the consumer declares what it needs, not the provider. This decouples deploy schedules. Mention Pact by name and the Pact Broker for cross-repo sharing.",
            followUp: ["How do contracts handle optional/nullable fields?", "What is the can-i-deploy check?", "How does this complement integration testing?"]
        }
    ]
});
