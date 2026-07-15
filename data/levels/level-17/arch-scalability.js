'use strict';

PageData.register('arch-scalability', {
  title: 'Scalability Patterns',
  description: 'Architectural patterns for building systems that scale horizontally, including database sharding, CQRS, back-pressure mechanisms, and cache strategies at scale.',
  sections: [
    {
      title: 'Introduction',
      content: `
        <p>Scalability is the ability of a system to handle increased load by adding resources — not by 
        rewriting the application. The distinction between <strong>scaling up</strong> (bigger machines) and 
        <strong>scaling out</strong> (more machines) fundamentally shapes architecture decisions.</p>
        <p>This topic covers the patterns that enable applications to grow from handling hundreds to millions 
        of requests, from single-database to globally distributed data, and from synchronous request-response 
        to event-driven async processing.</p>
      `
    },
    {
      title: 'Core Concepts',
      content: `
        <h3>Horizontal vs Vertical Scaling</h3>
        <p><strong>Vertical scaling</strong> (scale up): More CPU, RAM, faster disks on one machine. Simple 
        but has a ceiling (hardware limits) and a single point of failure.</p>
        <p><strong>Horizontal scaling</strong> (scale out): More machines behind a load balancer. Requires 
        stateless services, distributed data, and coordination mechanisms. No ceiling but adds complexity.</p>

        <h3>Database Sharding</h3>
        <ul>
          <li><strong>Range-based:</strong> Partition by key ranges (users A-M on shard 1, N-Z on shard 2). 
          Simple but prone to hotspots if distribution is uneven.</li>
          <li><strong>Hash-based:</strong> Consistent hashing distributes keys evenly. Handles node additions 
          gracefully but makes range queries difficult.</li>
          <li><strong>Geographic:</strong> Data lives near users (EU shard, US shard, APAC shard). Reduces 
          latency but complicates cross-region queries.</li>
        </ul>

        <h3>Read Replicas + Write-Ahead</h3>
        <p>Separate read and write paths: one primary accepts writes and streams changes (WAL) to multiple 
        read replicas. Reads scale linearly by adding replicas. Trade-off: replication lag means reads may 
        return slightly stale data.</p>

        <h3>CQRS (Command Query Responsibility Segregation)</h3>
        <p>Separate write model (optimized for transactions, validation, business rules) from read model 
        (optimized for queries, denormalized, possibly different storage). Connected via events.</p>

        <h3>Back-Pressure and Load Shedding</h3>
        <ul>
          <li><strong>Back-pressure:</strong> When a component is overloaded, it signals upstream to slow down 
          (TCP window, reactive streams, queue depth limits).</li>
          <li><strong>Load shedding:</strong> Deliberately dropping low-priority requests to protect the system 
          during overload. Better to serve 80% of users well than 100% poorly.</li>
        </ul>

        <h3>Connection Pooling</h3>
        <p>Database connections are expensive (TCP handshake, authentication, memory allocation). Connection 
        pools (PgBouncer, HikariCP) maintain warm connections and multiplex requests. Critical for horizontal 
        scaling where N service instances multiplied by M connections per instance can overwhelm the database.</p>

        <h3>Async Processing with Queues</h3>
        <p>Decouple time-sensitive operations from heavy processing. Accept the request, enqueue work, return 
        immediately. Workers process at their own pace. Queues absorb traffic spikes without propagating 
        pressure upstream.</p>
      `
    },
    {
      title: 'Scalability Architecture Overview',
      content: `
        <p>This diagram shows a horizontally scaled system with CQRS, caching, and async processing:</p>
        <div class="mermaid-diagram">
          <pre class="mermaid">
graph TB
    subgraph Clients["Client Tier"]
        CDN[CDN / Edge Cache]
        LB[Load Balancer<br/>Round-robin + health check]
    end

    subgraph AppTier["Application Tier (Stateless)"]
        API1[API Instance 1]
        API2[API Instance 2]
        API3[API Instance N]
    end

    subgraph WritePath["Write Path"]
        CMD[Command Service]
        VAL[Validation + Rules]
        WDB[(Write DB<br/>Primary)]
        EVT[Event Bus]
    end

    subgraph ReadPath["Read Path"]
        QRY[Query Service]
        CACHE[(Redis Cache<br/>Cache-aside)]
        RDB1[(Read Replica 1)]
        RDB2[(Read Replica 2)]
    end

    subgraph AsyncPath["Async Processing"]
        QUEUE[Message Queue<br/>RabbitMQ / SQS]
        W1[Worker 1]
        W2[Worker N]
    end

    CDN --> LB
    LB --> API1
    LB --> API2
    LB --> API3
    API1 -->|commands| CMD
    API2 -->|queries| QRY
    CMD --> VAL --> WDB
    WDB -->|WAL replication| RDB1
    WDB -->|WAL replication| RDB2
    WDB -->|publish events| EVT
    EVT --> QUEUE
    QUEUE --> W1
    QUEUE --> W2
    QRY --> CACHE
    CACHE -->|miss| RDB1
    EVT -->|invalidate| CACHE
          </pre>
        </div>
      `
    },
    {
      title: 'Auto-Scaling Decision Flow',
      content: `
        <p>How auto-scaling policies decide when to add or remove capacity:</p>
        <div class="mermaid-diagram">
          <pre class="mermaid">
stateDiagram-v2
    [*] --> Monitoring

    Monitoring --> ScaleOut: CPU > 70% for 3min<br/>OR Queue depth > 1000<br/>OR p99 latency > 500ms
    Monitoring --> ScaleIn: CPU < 20% for 10min<br/>AND Queue depth < 50<br/>AND instances > min
    Monitoring --> Monitoring: Metrics within bounds

    ScaleOut --> Provisioning: Add instances<br/>(max 2x current)
    Provisioning --> Warming: Health check pass
    Warming --> Monitoring: Ready to serve traffic

    ScaleIn --> Draining: Stop accepting new requests
    Draining --> Terminating: Active requests complete
    Terminating --> Monitoring: Instance removed

    ScaleOut --> LoadShedding: Scale limit reached
    LoadShedding --> Monitoring: Shed low-priority traffic<br/>Alert on-call team
          </pre>
        </div>
      `
    },
    {
      title: 'Implementation',
      content: `
        <h3>CQRS with Separate Read/Write Models (C#)</h3>
        <pre><code class="language-csharp">// Write side - rich domain model with validation
public class OrderCommandService
{
    private readonly IWriteDbContext _writeDb;
    private readonly IEventBus _eventBus;

    public async Task&lt;Result&lt;Guid&gt;&gt; PlaceOrder(PlaceOrderCommand cmd)
    {
        // Validate with full business rules
        var customer = await _writeDb.Customers.FindAsync(cmd.CustomerId);
        if (customer == null)
            return Result.Fail&lt;Guid&gt;("Customer not found");

        if (customer.HasOutstandingDebt)
            return Result.Fail&lt;Guid&gt;("Cannot place order with outstanding debt");

        var order = Order.Create(customer, cmd.Items, cmd.ShippingAddress);

        // Persist to write-optimized store
        _writeDb.Orders.Add(order);
        await _writeDb.SaveChangesAsync();

        // Publish event for read model projection
        await _eventBus.PublishAsync(new OrderPlacedEvent
        {
            OrderId = order.Id,
            CustomerId = customer.Id,
            Items = order.Items.Select(i => new OrderItemDto(i)).ToList(),
            TotalAmount = order.TotalAmount,
            PlacedAt = order.CreatedAt,
        });

        return Result.Ok(order.Id);
    }
}

// Read side - denormalized projection optimized for queries
public class OrderReadModelProjection : IEventHandler&lt;OrderPlacedEvent&gt;
{
    private readonly IReadDbContext _readDb;

    public async Task HandleAsync(OrderPlacedEvent evt)
    {
        var readModel = new OrderReadModel
        {
            OrderId = evt.OrderId,
            CustomerName = await GetCustomerName(evt.CustomerId),
            ItemCount = evt.Items.Count,
            TotalAmount = evt.TotalAmount,
            Status = "Placed",
            PlacedAt = evt.PlacedAt,
            // Denormalized: no JOINs needed for common queries
            ItemSummary = string.Join(", ", evt.Items.Select(i => i.Name)),
        };

        await _readDb.OrderViews.UpsertAsync(readModel);
    }
}

// Query service - fast reads from denormalized store
public class OrderQueryService
{
    private readonly IDistributedCache _cache;
    private readonly IReadDbContext _readDb;

    public async Task&lt;PagedResult&lt;OrderReadModel&gt;&gt; GetCustomerOrders(
        Guid customerId, int page, int pageSize)
    {
        var cacheKey = $"orders:customer:{customerId}:page:{page}";

        return await _cache.GetOrCreateAsync(cacheKey, async () =>
        {
            return await _readDb.OrderViews
                .Where(o => o.CustomerId == customerId)
                .OrderByDescending(o => o.PlacedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToPagedResultAsync();
        }, TimeSpan.FromMinutes(5));
    }
}</code></pre>

        <h3>Cache-Aside Pattern with Thundering Herd Protection (C#)</h3>
        <pre><code class="language-csharp">public class ResilientCacheService
{
    private readonly IDistributedCache _cache;
    private readonly SemaphoreSlim _lockPool = new(1, 1);
    private static readonly ConcurrentDictionary&lt;string, SemaphoreSlim&gt; _keyLocks = new();

    public async Task&lt;T?&gt; GetOrCreateAsync&lt;T&gt;(
        string key,
        Func&lt;Task&lt;T&gt;&gt; factory,
        CacheOptions options) where T : class
    {
        // Try cache first
        var cached = await _cache.GetAsync&lt;T&gt;(key);
        if (cached != null) return cached;

        // Single-flight: only one caller fetches on cache miss
        var keyLock = _keyLocks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));

        await keyLock.WaitAsync();
        try
        {
            // Double-check after acquiring lock
            cached = await _cache.GetAsync&lt;T&gt;(key);
            if (cached != null) return cached;

            var value = await factory();

            // Probabilistic early expiration to prevent thundering herd
            var jitter = TimeSpan.FromSeconds(Random.Shared.Next(0, 30));
            var ttl = options.TTL - jitter;

            await _cache.SetAsync(key, value, ttl);
            return value;
        }
        finally
        {
            keyLock.Release();
        }
    }
}</code></pre>

        <h3>Back-Pressure with Rate Limiting (C#)</h3>
        <pre><code class="language-csharp">// Middleware implementing adaptive load shedding
public class AdaptiveLoadSheddingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMetrics _metrics;
    private readonly LoadSheddingConfig _config;

    public async Task InvokeAsync(HttpContext context)
    {
        var queueDepth = _metrics.GetCurrentQueueDepth();
        var cpuUsage = _metrics.GetCpuUsage();
        var p99Latency = _metrics.GetP99Latency();

        // Determine if we should shed this request
        if (ShouldShed(context, queueDepth, cpuUsage, p99Latency))
        {
            _metrics.IncrementShedCounter();
            context.Response.StatusCode = 503;
            context.Response.Headers["Retry-After"] = "5";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Service temporarily overloaded",
                retryAfter = 5
            });
            return;
        }

        await _next(context);
    }

    private bool ShouldShed(HttpContext ctx, int queueDepth,
        double cpu, TimeSpan p99)
    {
        // Never shed health checks or critical operations
        if (ctx.Request.Path.StartsWithSegments("/health")) return false;
        if (ctx.Request.Headers.ContainsKey("X-Priority-High")) return false;

        // Progressive shedding based on load
        if (cpu > 90) return true;                    // Shed everything non-critical
        if (cpu > 80 && IsLowPriority(ctx)) return true; // Shed low priority
        if (queueDepth > _config.MaxQueueDepth) return true;
        if (p99 > _config.LatencyThreshold) return IsLowPriority(ctx);

        return false;
    }
}</code></pre>
      `
    },
    {
      title: 'Common Mistakes',
      content: `
        <ul>
          <li><strong>Premature sharding:</strong> Sharding adds enormous complexity (cross-shard queries, 
          rebalancing, operational burden). Most applications should exhaust vertical scaling + read replicas 
          + caching before considering sharding.</li>
          <li><strong>Stateful services:</strong> Storing session data, file uploads, or computed state in 
          application instances prevents horizontal scaling. Move state to external stores (Redis, S3).</li>
          <li><strong>Ignoring connection limits:</strong> 100 service instances × 20 connections each = 2000 
          database connections. PostgreSQL default max_connections is 100. Use connection poolers.</li>
          <li><strong>Synchronous chains:</strong> Service A calls B calls C calls D synchronously. Latency 
          compounds, and any service failure cascades. Prefer async messaging for non-time-critical paths.</li>
          <li><strong>Cache without invalidation strategy:</strong> Adding a cache layer without thinking about 
          when and how to invalidate leads to serving stale data indefinitely.</li>
          <li><strong>Auto-scaling without drain:</strong> Terminating instances without draining active 
          connections drops in-flight requests. Always implement graceful shutdown.</li>
          <li><strong>Equal treatment of all traffic:</strong> During overload, shedding randomly affects 
          paying customers equally. Implement priority tiers for load shedding.</li>
        </ul>
      `
    },
    {
      title: 'Interview Tips',
      type: 'callout',
      content: `
        <div class="callout callout-tip">
          <h4>Interview Tips</h4>
          <ul>
            <li>Always ask "what is the current scale?" before proposing solutions. A system handling 100 
            QPS does not need sharding.</li>
            <li>Quantify: "We can handle 10x growth with read replicas + caching before needing to shard. 
            That buys us 18 months based on growth rate."</li>
            <li>Discuss <strong>trade-offs explicitly</strong>: CQRS adds complexity and eventual consistency — 
            only worth it when read/write patterns differ significantly.</li>
            <li>Know <strong>Amdahl's Law</strong>: the sequential portion of your system limits how much 
            parallelism helps. Identify bottlenecks before adding capacity.</li>
            <li>Mention <strong>observability</strong>: you can't scale what you can't measure. Discuss 
            metrics like p99 latency, queue depth, cache hit ratio, connection pool utilization.</li>
            <li>For architect roles: discuss capacity planning, cost modeling, and the organizational changes 
            needed to support distributed systems (on-call, runbooks, SLOs).</li>
          </ul>
        </div>
      `
    },
    {
      title: 'Key Takeaways',
      content: `
        <ul>
          <li>Exhaust simpler options (caching, read replicas, vertical scaling) before adding distributed 
          system complexity (sharding, CQRS, microservices).</li>
          <li>Stateless services are a prerequisite for horizontal scaling — externalize all state.</li>
          <li>CQRS separates read and write concerns, allowing independent optimization and scaling of each path.</li>
          <li>Back-pressure and load shedding protect system stability during traffic spikes better than 
          unbounded queuing.</li>
          <li>Connection pooling is critical when scaling horizontally — compute the total connection count 
          across all instances.</li>
          <li>Auto-scaling needs proper signals (not just CPU), warm-up time, and graceful draining.</li>
          <li>Cache-aside with thundering herd protection prevents database storms on cache invalidation.</li>
        </ul>
      `
    }
  ],

  questions: [
    {
      id: 'arch-scale-q1',
      level: 'junior',
      title: 'What is the difference between horizontal and vertical scaling?',
      answer: `
        <p><strong>Vertical scaling (scale up)</strong> means adding more resources to an existing machine: 
        more CPU cores, more RAM, faster SSDs. It is simple (no code changes) but has limits — you cannot 
        buy a server with 1TB RAM indefinitely, and it creates a single point of failure.</p>
        <p><strong>Horizontal scaling (scale out)</strong> means adding more machines and distributing the 
        load across them. It requires stateless application design, a load balancer, and often data 
        partitioning. The benefit is virtually unlimited scale and fault tolerance.</p>
        <p>Most systems start vertical (simpler) and move horizontal when they hit the ceiling or need 
        high availability. The key architectural requirement for horizontal scaling is that <em>any instance 
        can handle any request</em> — no request affinity or local state.</p>
      `
    },
    {
      id: 'arch-scale-q2',
      level: 'mid',
      title: 'Explain the Cache-Aside pattern and its failure modes.',
      answer: `
        <p><strong>Cache-Aside</strong> (also called lazy-loading): The application checks the cache first. 
        On a miss, it fetches from the database, stores in cache, and returns. On writes, it updates the 
        database and invalidates (or updates) the cache.</p>
        <p><strong>Failure modes:</strong></p>
        <ul>
          <li><strong>Thundering herd:</strong> When a popular cache key expires, hundreds of concurrent 
          requests all miss the cache and hit the database simultaneously. Solution: single-flight (lock 
          so only one request fetches) or probabilistic early refresh.</li>
          <li><strong>Stale reads after write:</strong> If cache invalidation fails (network issue), the 
          cache serves stale data until TTL expires. Solution: write-through or TTL + background refresh.</li>
          <li><strong>Cache stampede on cold start:</strong> A new deployment or cache restart causes 100% 
          miss rate. Solution: cache warming on deployment.</li>
          <li><strong>Hot key problem:</strong> One extremely popular key gets all traffic to a single cache 
          node. Solution: replicate hot keys across nodes or use local in-process cache for hottest keys.</li>
        </ul>
      `
    },
    {
      id: 'arch-scale-q3',
      level: 'mid',
      title: 'When would you choose message queues over synchronous HTTP for service communication?',
      answer: `
        <p>Use <strong>message queues</strong> when:</p>
        <ul>
          <li><strong>Fire-and-forget:</strong> The caller does not need an immediate response (send email, 
          generate report, process payment).</li>
          <li><strong>Traffic spikes:</strong> Queues absorb bursts that would overwhelm downstream services.</li>
          <li><strong>Reliability:</strong> Messages persist even if the consumer is temporarily down.</li>
          <li><strong>Fan-out:</strong> One event needs to trigger multiple independent consumers.</li>
          <li><strong>Rate limiting:</strong> Control how fast consumers process (worker concurrency limits).</li>
        </ul>
        <p>Use <strong>synchronous HTTP</strong> when:</p>
        <ul>
          <li>The user is waiting for the response (query data, validate input).</li>
          <li>The operation is fast (< 200ms) and reliable.</li>
          <li>Ordering and exactly-once semantics are hard to guarantee with async.</li>
        </ul>
        <p>Hybrid approach: Accept synchronously (return 202 Accepted with a tracking ID), process 
        asynchronously via queue, provide a status polling endpoint or push notification on completion.</p>
      `
    },
    {
      id: 'arch-scale-q4',
      level: 'senior',
      title: 'Design a database sharding strategy for a multi-tenant SaaS application.',
      answer: `
        <p>For multi-tenant SaaS, <strong>tenant-based sharding</strong> is the natural partitioning strategy:</p>
        <ol>
          <li><strong>Shard key:</strong> Tenant ID. All data for one tenant lives on the same shard, 
          eliminating cross-shard queries for normal operations.</li>
          <li><strong>Routing:</strong> A lightweight routing service maps tenant → shard. This mapping is 
          cached aggressively (rarely changes).</li>
          <li><strong>Sizing:</strong> Use hash-based assignment for even distribution. Large tenants 
          (enterprise customers) get dedicated shards.</li>
        </ol>
        <pre><code class="language-csharp">public class TenantShardRouter
{
    private readonly IShardMap _shardMap;
    private readonly IConnectionFactory _connectionFactory;

    public IDbConnection GetConnection(Guid tenantId)
    {
        var shardId = _shardMap.GetShardForTenant(tenantId);
        return _connectionFactory.Create(shardId);
    }

    // For cross-tenant operations (admin, reporting)
    public IEnumerable&lt;IDbConnection&gt; GetAllShardConnections()
    {
        return _shardMap.GetAllShards()
            .Select(s => _connectionFactory.Create(s));
    }
}

// Shard assignment strategy
public class ConsistentHashShardMap : IShardMap
{
    private readonly ConsistentHash&lt;ShardInfo&gt; _ring;

    public ShardInfo GetShardForTenant(Guid tenantId)
    {
        // Enterprise tenants get dedicated shards
        if (_dedicatedShards.TryGetValue(tenantId, out var dedicated))
            return dedicated;

        // Others use consistent hashing for even distribution
        return _ring.GetNode(tenantId.ToString());
    }
}</code></pre>
        <p>Key concerns: rebalancing when adding shards (move tenants with minimal downtime), cross-shard 
        queries for admin/reporting (fan out + merge), and data isolation for compliance (some tenants 
        require geographic placement).</p>
      `
    },
    {
      id: 'arch-scale-q5',
      level: 'senior',
      title: 'How does back-pressure work in a reactive/event-driven system?',
      answer: `
        <p>Back-pressure is a mechanism where a slow consumer signals the producer to reduce its sending rate, 
        preventing buffer overflow and system collapse.</p>
        <p><strong>Levels of back-pressure:</strong></p>
        <ol>
          <li><strong>Transport level:</strong> TCP flow control (receive window). If the consumer cannot 
          process fast enough, the TCP window shrinks, naturally throttling the sender.</li>
          <li><strong>Application level:</strong> Reactive Streams (Project Reactor, RxJava) where the 
          subscriber explicitly requests N items at a time. The publisher cannot emit more than requested.</li>
          <li><strong>Queue level:</strong> Bounded queues reject or redirect messages when full. Dead-letter 
          queues capture overflow for later processing.</li>
          <li><strong>Service level:</strong> HTTP 429 (Too Many Requests) with Retry-After header. Circuit 
          breakers that open when downstream is overwhelmed.</li>
        </ol>
        <p><strong>Strategies when back-pressure activates:</strong></p>
        <ul>
          <li><strong>Buffer:</strong> Queue messages temporarily (bounded buffer)</li>
          <li><strong>Drop:</strong> Discard newest or oldest messages (real-time systems)</li>
          <li><strong>Sample:</strong> Process every Nth message (metrics, monitoring)</li>
          <li><strong>Throttle:</strong> Delay processing to match consumer rate</li>
        </ul>
        <p>Without back-pressure, systems fail catastrophically under load — unbounded queues consume all 
        memory, latency spikes cascade, and the entire system becomes unresponsive.</p>
      `
    },
    {
      id: 'arch-scale-q6',
      level: 'architect',
      title: 'Design an auto-scaling strategy for a system with mixed workload types.',
      answer: `
        <p>Mixed workloads (API serving + batch processing + real-time streaming) require 
        <strong>independent scaling per workload type</strong> with separate metrics:</p>
        <ol>
          <li><strong>API tier:</strong> Scale on request rate, p99 latency, and CPU. Target: p99 < 200ms. 
          Scale out at 70% CPU sustained for 2 minutes. Scale in below 30% for 10 minutes.</li>
          <li><strong>Worker tier:</strong> Scale on queue depth and processing lag. Target: queue drain 
          time < 5 minutes. Scale out when depth exceeds 1000 messages.</li>
          <li><strong>Streaming tier:</strong> Scale on consumer lag (how far behind real-time). Target: 
          lag < 30 seconds. Scale based on partition assignment.</li>
        </ol>
        <pre><code class="language-csharp">// Auto-scaling policy configuration
public class ScalingPolicy
{
    public string WorkloadType { get; init; }
    public int MinInstances { get; init; }
    public int MaxInstances { get; init; }
    public TimeSpan CooldownPeriod { get; init; }
    public List&lt;ScalingRule&gt; ScaleOutRules { get; init; }
    public List&lt;ScalingRule&gt; ScaleInRules { get; init; }
    public GracefulShutdown Draining { get; init; }
}

// Predictive scaling based on historical patterns
public class PredictiveScaler
{
    public int PredictRequiredInstances(DateTime targetTime)
    {
        // Use historical data to predict load
        var historicalLoad = _metrics.GetLoadAt(
            targetTime.DayOfWeek, targetTime.TimeOfDay);

        var predicted = (int)Math.Ceiling(
            historicalLoad * _config.HeadroomFactor);

        // Pre-warm instances 5 minutes before predicted spike
        return Math.Max(predicted, _currentInstances);
    }
}</code></pre>
        <p>Advanced considerations: predictive scaling (pre-warm before known peaks), spot/preemptible 
        instances for batch workloads (cost savings), and scaling limits with alerting (if max is reached, 
        page on-call rather than silently degrading).</p>
      `
    },
    {
      id: 'arch-scale-q7',
      level: 'architect',
      title: 'Your system handles 10K requests/second. Design the path to 1M requests/second.',
      answer: `
        <p>A 100x scale increase requires changes at every layer:</p>
        <ol>
          <li><strong>CDN + Edge:</strong> Move static assets and cacheable API responses to edge (CloudFront, 
          Fastly). Target: 60-70% of requests served from edge without hitting origin.</li>
          <li><strong>Application tier:</strong> Scale to 50-100 instances behind a global load balancer with 
          geographic routing. Ensure zero shared state between instances.</li>
          <li><strong>Database:</strong> Read replicas handle query load. Implement CQRS to separate write 
          path. Shard by tenant or geographic region when single-primary write throughput caps out.</li>
          <li><strong>Caching:</strong> Multi-layer cache: in-process (hot keys) → distributed Redis cluster → 
          database. Target 95%+ cache hit rate for reads.</li>
          <li><strong>Async offload:</strong> Move all non-time-critical work to queues. Notifications, 
          analytics, reporting, PDF generation — none of these belong in the request path.</li>
          <li><strong>Connection management:</strong> Connection pooling (PgBouncer), HTTP/2 for service 
          mesh, gRPC for internal communication (persistent connections, multiplexing).</li>
        </ol>
        <p><strong>Incremental path:</strong></p>
        <ul>
          <li>10K → 50K: Caching + read replicas + CDN</li>
          <li>50K → 200K: CQRS + async processing + horizontal app scaling</li>
          <li>200K → 1M: Sharding + multi-region + edge compute + protocol optimization</li>
        </ul>
        <p>Each phase should be validated with load testing (k6, Locust) before production. Monitor cost 
        per request — scaling should be sub-linear (cost grows slower than traffic).</p>
      `
    },
    {
      id: 'as-q8',
      level: 'architect',
      title: 'How do you implement database sharding and what are the common pitfalls?',
      answer: `
        <p><strong>Database sharding</strong> horizontally partitions data across multiple database instances, each 
        holding a subset of the data. It is the last resort for write scaling when a single database cannot handle 
        the load — but it introduces significant complexity.</p>
        <h4>Sharding Strategies:</h4>
        <ul>
          <li><strong>Hash-based:</strong> Apply a hash function to the shard key (e.g., hash(user_id) % N). 
          Distributes data evenly but makes range queries across shards expensive.</li>
          <li><strong>Range-based:</strong> Partition by value range (users A-M on shard 1, N-Z on shard 2). 
          Enables efficient range queries but risks hotspots if distribution is uneven.</li>
          <li><strong>Geography-based:</strong> Partition by region (EU data on EU shard, US on US shard). 
          Reduces latency for regional users and helps with data sovereignty compliance.</li>
          <li><strong>Tenant-based:</strong> Each large tenant gets a dedicated shard; small tenants share shards. 
          Natural for multi-tenant SaaS with skewed usage patterns.</li>
        </ul>
        <h4>Common Pitfalls:</h4>
        <ul>
          <li><strong>Wrong shard key:</strong> Choosing a key with low cardinality (e.g., country) creates 
          hotspots. The key must distribute writes evenly AND match query access patterns.</li>
          <li><strong>Cross-shard queries:</strong> JOINs across shards are expensive or impossible. Design 
          the data model so most queries hit a single shard. If you need cross-shard data, denormalize or 
          maintain a global index.</li>
          <li><strong>Rebalancing:</strong> Adding a new shard requires data migration. Without consistent 
          hashing, a naive hash(key) % N redistributes most data when N changes.</li>
          <li><strong>Distributed transactions:</strong> ACID across shards requires 2PC (slow, fragile) or 
          saga patterns (eventually consistent). Avoid cross-shard transactions by design.</li>
          <li><strong>Operational complexity:</strong> Schema migrations must be applied to ALL shards. 
          Backups, monitoring, and failover multiply by shard count.</li>
        </ul>
        <p><strong>Key decision:</strong> Exhaust vertical scaling, read replicas, caching, and CQRS before 
        sharding. Sharding is irreversible complexity — once you shard, every query, migration, and operation 
        must be shard-aware forever.</p>
      `
    }
  ]
});
