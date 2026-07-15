/* ═══════════════════════════════════════════════════════════════════
   ASP.NET Core — Caching (In-Memory, Distributed, Output, Response)
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('aspnet-caching', {
    title: 'Caching in ASP.NET Core',
    description: 'In-memory caching, distributed caching with Redis, output caching, response caching, cache invalidation strategies, and avoiding common pitfalls like thundering herd.',
    sections: [
        {
            title: 'In-Memory Cache (IMemoryCache)',
            content: `<p><code>IMemoryCache</code> stores data in the application's process memory. It is fast (no network), simple, and suitable for single-instance applications. Data is lost on app restart and not shared across instances.</p>`,
            code: `// Registration
builder.Services.AddMemoryCache();

// Usage with cache-aside pattern
public class ProductService
{
    private readonly IMemoryCache _cache;
    private readonly IProductRepository _repo;

    public async Task<Product?> GetByIdAsync(int id)
    {
        var cacheKey = $"product:{id}";
        
        if (!_cache.TryGetValue(cacheKey, out Product? product))
        {
            product = await _repo.GetByIdAsync(id);
            
            if (product is not null)
            {
                var options = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(10))
                    .SetSlidingExpiration(TimeSpan.FromMinutes(2))
                    .SetSize(1)   // For size-limited caches
                    .SetPriority(CacheItemPriority.Normal)
                    .RegisterPostEvictionCallback((key, value, reason, state) =>
                    {
                        // Log eviction for monitoring
                    });
                
                _cache.Set(cacheKey, product, options);
            }
        }
        return product;
    }

    // GetOrCreate — atomic pattern (preferred)
    public async Task<Product?> GetByIdSafeAsync(int id)
    {
        return await _cache.GetOrCreateAsync($"product:{id}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
            entry.SlidingExpiration = TimeSpan.FromMinutes(2);
            return await _repo.GetByIdAsync(id);
        });
    }

    // Invalidation
    public async Task UpdateAsync(Product product)
    {
        await _repo.UpdateAsync(product);
        _cache.Remove($"product:{product.Id}");     // Remove specific
        // Or tag-based: remove all products
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Distributed Cache (Redis)',
            content: `<p><code>IDistributedCache</code> stores data externally (Redis, SQL Server, NCache) — shared across multiple app instances. Essential for load-balanced deployments and microservices.</p>`,
            code: `// Registration — Redis
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = "localhost:6379,password=secret,abortConnect=false";
    options.InstanceName = "myapp:";  // Key prefix
});

// Usage with IDistributedCache
public class SessionService
{
    private readonly IDistributedCache _cache;
    
    public async Task<UserSession?> GetSessionAsync(string sessionId)
    {
        var bytes = await _cache.GetAsync($"session:{sessionId}");
        if (bytes is null) return null;
        return JsonSerializer.Deserialize<UserSession>(bytes);
    }

    public async Task SetSessionAsync(string sessionId, UserSession session)
    {
        var bytes = JsonSerializer.SerializeToUtf8Bytes(session);
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1),
            SlidingExpiration = TimeSpan.FromMinutes(20)
        };
        await _cache.SetAsync($"session:{sessionId}", bytes, options);
    }
}

// HybridCache (.NET 9) — combines in-memory + distributed
builder.Services.AddHybridCache(options =>
{
    options.DefaultEntryOptions = new HybridCacheEntryOptions
    {
        Expiration = TimeSpan.FromMinutes(5),
        LocalCacheExpiration = TimeSpan.FromMinutes(1) // L1 in-memory
    };
});

public class ProductService(HybridCache cache)
{
    public async Task<Product> GetAsync(int id, CancellationToken ct)
    {
        return await cache.GetOrCreateAsync(
            $"product:{id}",
            async token => await _repo.GetByIdAsync(id, token),
            cancellationToken: ct
        );
        // Checks L1 (memory) → L2 (Redis) → Factory (DB)
        // Prevents thundering herd with built-in stampede protection!
    }
}`,
            language: 'csharp',
            callout: { type: 'info', title: 'HybridCache (.NET 9)', text: 'HybridCache is the recommended caching API going forward. It provides L1 (in-memory) + L2 (distributed) caching with built-in stampede protection, serialization, and tag-based invalidation — replacing manual IMemoryCache + IDistributedCache patterns.' }
        },
        {
            title: 'Output Caching & Response Caching',
            content: `<p><strong>Output Caching</strong> (.NET 7+) caches entire HTTP responses server-side. <strong>Response Caching</strong> leverages HTTP cache headers for client/CDN caching. Both reduce server load but serve different purposes.</p>`,
            code: `// OUTPUT CACHING — server-side response caching (.NET 7+)
builder.Services.AddOutputCache(options =>
{
    // Named policies
    options.AddPolicy("ShortCache", p => p.Expire(TimeSpan.FromSeconds(30)));
    options.AddPolicy("ProductCache", p => 
        p.Expire(TimeSpan.FromMinutes(5)).Tag("products"));
    options.AddPolicy("ByUser", p => 
        p.SetVaryByHeader("Authorization"));
});

app.UseOutputCache();

// Apply to endpoints:
app.MapGet("/api/products", GetProducts)
    .CacheOutput("ProductCache");

app.MapGet("/api/products/{id}", GetProduct)
    .CacheOutput(p => p.Expire(TimeSpan.FromMinutes(2)).Tag("products"));

// Tag-based invalidation:
app.MapPost("/api/products", async (Product p, IOutputCacheStore store) =>
{
    await SaveProduct(p);
    await store.EvictByTagAsync("products", default); // Purge all product caches
    return Results.Created($"/api/products/{p.Id}", p);
});

// RESPONSE CACHING — HTTP cache headers (client + CDN)
app.MapGet("/api/weather", GetWeather)
    .WithMetadata(new ResponseCacheAttribute
    {
        Duration = 60,           // Cache-Control: max-age=60
        Location = ResponseCacheLocation.Any, // public
        VaryByHeader = "Accept"
    });

// Custom cache headers for CDN:
app.MapGet("/api/static-data", () =>
{
    return Results.Ok(data).WithHeaders(new Dictionary<string, string>
    {
        ["Cache-Control"] = "public, max-age=3600, stale-while-revalidate=600",
        ["CDN-Cache-Control"] = "max-age=86400", // CDN-specific longer TTL
        ["ETag"] = ComputeETag(data)
    });
});`,
            language: 'csharp'
        },
        {
            title: 'Cache Invalidation Strategies',
            content: `<p>Cache invalidation is the hardest problem in caching. The right strategy depends on data freshness requirements, update frequency, and system architecture.</p>`,
            table: {
                headers: ['Strategy', 'How It Works', 'Best For'],
                rows: [
                    ['TTL (Time-to-Live)', 'Cache expires after fixed duration', 'Data that can be slightly stale (product catalogs, configs)'],
                    ['Sliding Expiration', 'Extends TTL on each access', 'Session data, frequently-accessed hot items'],
                    ['Event-driven', 'Invalidate on write/update event', 'Real-time consistency (inventory, pricing)'],
                    ['Tag-based', 'Group entries by tag, purge by tag', 'Related data (all products for category X)'],
                    ['Write-through', 'Update cache AND source simultaneously', 'Frequent reads, predictable writes'],
                    ['Cache-aside (lazy)', 'Load into cache on miss', 'Unpredictable access patterns, read-heavy'],
                    ['Stale-while-revalidate', 'Serve stale, refresh in background', 'High availability, eventual consistency OK']
                ]
            }
        }
    ],
    questions: [
        {"question":"Compare in-memory caching and distributed caching in ASP.NET Core. When do you use each?","difficulty":"medium","answer":"<p><strong>IMemoryCache</strong> stores data in the process memory of a single instance — fastest, but not shared across instances and lost on restart. <strong>IDistributedCache</strong> (Redis, SQL Server) stores data out-of-process, shared across all instances and surviving individual restarts, at the cost of network/serialization overhead.</p><p>Use in-memory for single-instance apps or per-instance hot data that can tolerate duplication; use distributed caching when you scale out (multiple instances/load-balanced) and need a consistent shared cache — e.g., sessions, shared reference data. A common pattern layers both (L1 in-memory + L2 distributed).</p>","explanation":"In-memory cache is a sticky note on your own desk (instant, but only you see it). Distributed cache is a shared whiteboard everyone reads (slightly slower to walk to, but consistent for the whole team).","bestPractices":["Distributed cache when running multiple instances","Set expirations (absolute/sliding) to bound staleness","Consider an L1+L2 (in-memory over distributed) layering"],"commonMistakes":["Using IMemoryCache in a load-balanced app (inconsistent per instance)","No expiration, causing stale data or unbounded growth","Caching per-user data in a shared cache without keying by user"],"interviewTip":"Tie the choice to scale-out: single instance -> in-memory; multiple instances -> distributed. Mention L1+L2 layering as an advanced answer.","followUp":["What is cache stampede and how do you prevent it?","Absolute vs sliding expiration?","How does output caching differ?"]},
        {"question":"What is a cache stampede (thundering herd) and how do you prevent it?","difficulty":"hard","answer":"<p>A <strong>cache stampede</strong> happens when a popular cached entry expires and many concurrent requests simultaneously miss the cache and all hit the backing store to recompute the same value — spiking load exactly when the cache should protect it.</p><p>Prevent it with: a <strong>lock/semaphore</strong> so only one request recomputes while others wait for the result; <strong>stale-while-revalidate</strong> (serve the old value while one worker refreshes); <strong>jittered expirations</strong> so keys do not all expire together; and pre-warming hot keys. .NET's <code>HybridCache</code> (or a GetOrCreate with locking) provides stampede protection.</p>","explanation":"When a popular checkout lane closes (key expires), everyone rushes the other lanes at once. The fix is a single person reopening the lane while others wait, instead of all piling in simultaneously.","bestPractices":["Single-flight recompute via lock/semaphore","Serve stale-while-revalidate on refresh","Add jitter to expirations; pre-warm hot keys"],"commonMistakes":["Naive GetOrCreate with no locking under high concurrency","All keys sharing the same expiry time","No protection on expensive-to-compute values"],"interviewTip":"Name the mechanism (many concurrent misses hammer the backend on expiry) and the fixes (single-flight lock, stale-while-revalidate, jitter). Mentioning HybridCache is a plus.","followUp":["What is single-flight / request coalescing?","How does HybridCache help?","Why add jitter to TTLs?"]},
        {
            question: 'What is the cache-aside pattern? How does it compare to write-through and write-behind?',
            difficulty: 'medium',
            answer: `<p><strong>Cache-aside</strong> (lazy loading): application checks cache first; on miss, loads from DB and stores in cache. <strong>Write-through</strong>: writes go to cache AND DB simultaneously. <strong>Write-behind</strong> (write-back): writes go to cache, asynchronously persisted to DB later. Each has different consistency and performance trade-offs.</p>`,
            code: `// CACHE-ASIDE (most common in .NET):
public async Task<Product?> GetAsync(int id)
{
    // 1. Check cache
    var cached = await _cache.GetAsync<Product>($"product:{id}");
    if (cached is not null) return cached;
    
    // 2. Cache miss — load from DB
    var product = await _db.Products.FindAsync(id);
    
    // 3. Store in cache for next time
    if (product is not null)
        await _cache.SetAsync($"product:{id}", product, TimeSpan.FromMinutes(5));
    
    return product;
}

// Problem: Thundering herd (cache stampede)
// 1000 requests hit simultaneously when cache expires
// ALL 1000 query the database at once!

// Solution: Stampede protection with SemaphoreSlim
private static readonly SemaphoreSlim _lock = new(1, 1);

public async Task<Product?> GetWithLockAsync(int id)
{
    var key = $"product:{id}";
    var cached = await _cache.GetAsync<Product>(key);
    if (cached is not null) return cached;
    
    await _lock.WaitAsync();
    try
    {
        // Double-check after acquiring lock
        cached = await _cache.GetAsync<Product>(key);
        if (cached is not null) return cached;
        
        var product = await _db.Products.FindAsync(id);
        if (product is not null)
            await _cache.SetAsync(key, product, TimeSpan.FromMinutes(5));
        return product;
    }
    finally { _lock.Release(); }
}

// Or use HybridCache (.NET 9) which handles this automatically:
var product = await _hybridCache.GetOrCreateAsync(key, 
    async ct => await _db.Products.FindAsync(id, ct));`,
            language: 'csharp',
            bestPractices: [
                'Use cache-aside for read-heavy workloads with infrequent updates',
                'Implement stampede protection (lock, HybridCache, or Lazy<Task<T>>)',
                'Set appropriate TTLs based on data staleness tolerance',
                'Use write-through when consistency between cache and DB is critical'
            ],
            commonMistakes: [
                'No stampede protection (thousands of concurrent DB queries on cache miss)',
                'Caching null results indefinitely (negative caching without TTL)',
                'Not invalidating cache on writes (serving stale data)',
                'Using the same TTL for all data regardless of update frequency'
            ],
            interviewTip: 'Draw the sequence diagram for each pattern. Cache-aside: App → Cache (miss) → DB → Cache (set). Write-through: App → Cache + DB simultaneously. Explain thundering herd and how to prevent it.',
            followUp: ['What is the thundering herd problem?', 'How does Redis pub/sub help with cache invalidation?', 'What is stale-while-revalidate?'],
            seniorPerspective: 'I use HybridCache in .NET 9 or a Lazy<Task<T>> wrapper in older versions for stampede protection. For distributed invalidation, Redis pub/sub notifies all instances when data changes.',
            architectPerspective: 'In global deployments, I implement multi-tier caching: CDN (edge) → Output Cache (server) → Redis (distributed) → DB. Each tier has decreasing latency and increasing staleness tolerance. Invalidation propagates from innermost (DB event) outward.'
        },
        {
            question: 'When would you use in-memory cache vs distributed cache (Redis)? What are the trade-offs?',
            difficulty: 'medium',
            answer: `<p><strong>In-memory</strong> is faster (no network), simpler, but limited to a single instance and lost on restart. <strong>Distributed (Redis)</strong> is shared across instances, survives restarts, but adds network latency and operational complexity. The choice depends on deployment topology and data sharing requirements.</p>`,
            code: `// IN-MEMORY (IMemoryCache):
// + Zero network latency (~1-5 microseconds)
// + Simple setup (no infrastructure)
// + No serialization overhead
// - Not shared between instances (each has its own)
// - Lost on app restart/deploy
// - Memory-limited to process

// DISTRIBUTED (Redis via IDistributedCache):
// + Shared across all app instances
// + Survives app restarts
// + Can store large datasets (dedicated memory)
// + Supports pub/sub for invalidation
// - Network latency (~0.5-2ms per call)
// - Requires serialization (JSON/binary)
// - Operational overhead (Redis cluster management)

// Decision matrix:
// Single instance + small dataset    → IMemoryCache
// Multiple instances + shared state  → IDistributedCache (Redis)
// Hot data + any topology            → HybridCache (L1 memory + L2 Redis)
// Session/user data + load balanced  → Redis
// Reference data (rarely changes)    → IMemoryCache (replicate on each instance)

// HybridCache combines both — best of both worlds:
builder.Services.AddHybridCache(); // L1: in-process, L2: distributed
// Lookup order: L1 (memory, ~1μs) → L2 (Redis, ~1ms) → Factory (DB, ~10ms)

// Practical pattern for multi-instance:
// 1. Cache frequently accessed data in-memory (short TTL, 30s-2min)
// 2. Back with Redis (longer TTL, 5-30min)
// 3. On write: invalidate Redis (pub/sub notifies all instances to clear L1)`,
            language: 'csharp',
            bestPractices: [
                'Use HybridCache (.NET 9) for automatic L1 + L2 caching',
                'Use in-memory for hot, read-only data that can be stale per-instance briefly',
                'Use Redis for shared state, sessions, and distributed locks',
                'Set memory cache size limits to prevent unbounded growth (OOM)'
            ],
            commonMistakes: [
                'Using only in-memory cache in a load-balanced deployment (inconsistent data)',
                'Not setting size limits on IMemoryCache (grows until OOM kill)',
                'Caching mutable reference types in IMemoryCache (consumers modify cached object!)',
                'Over-caching in Redis (high serialization cost for data that doesn\'t benefit from caching)'
            ],
            interviewTip: 'Show you think about the deployment topology. Single server = in-memory is fine. Load-balanced = need distributed. Modern answer: HybridCache gives you both layers with one API.',
            followUp: ['How do you handle cache invalidation across instances?', 'What is the cost of serialization in distributed caching?', 'How does Redis Cluster differ from Redis Sentinel?'],
            seniorPerspective: 'I default to HybridCache in new projects. For existing apps, I layer IMemoryCache (30s TTL) in front of Redis (5min TTL) manually. The memory layer absorbs hot-path reads; Redis provides consistency across instances.',
            architectPerspective: 'Caching architecture decisions cascade: choosing Redis means you need cluster management, monitoring (redis-cli, Grafana), failover strategy, and eviction policies. I treat cache infrastructure as a first-class service with its own SLOs and capacity planning.'
        },
        {
            question: 'What is cache stampede (thundering herd) and how do you prevent it?',
            difficulty: 'advanced',
            answer: `<p><strong>Cache stampede</strong> occurs when a popular cache entry expires and hundreds of concurrent requests simultaneously query the database to rebuild it — causing a spike of identical expensive queries. Prevention: SemaphoreSlim locking (one thread rebuilds, others wait), HybridCache (built-in stampede protection), or stale-while-revalidate (serve stale, refresh in background).</p>`,
            bestPractices: ['Use HybridCache (.NET 9) which has built-in stampede protection', 'Implement lock-based cache rebuild (SemaphoreSlim or distributed lock)', 'Use staggered TTLs (random jitter) to prevent synchronized expiration', 'Consider stale-while-revalidate: serve expired data while refreshing in background'],
            commonMistakes: ['No stampede protection on high-traffic cache keys (DB overwhelmed on expiry)', 'Using a global lock for all keys (blocks unrelated cache operations)', 'Setting the same TTL for all entries (mass expiration at the same time)', 'Not monitoring cache miss rates (stampede detected only when DB alerts fire)'],
            interviewTip: 'Draw the timeline: cache expires → 500 requests arrive → ALL hit database simultaneously → DB overwhelmed → cascade failure. Then show the fix: first request acquires lock, rebuilds cache; other 499 wait on lock then read from fresh cache. Only 1 DB query instead of 500.',
            followUp: ['What is stale-while-revalidate?', 'How does HybridCache prevent stampede internally?', 'What is cache warming as a preventive measure?'],
            seniorPerspective: 'I use a Lazy<Task<T>> wrapper around cache operations: ConcurrentDictionary<string, Lazy<Task<T>>>. The Lazy ensures only one async factory executes per key, even with hundreds of concurrent callers. HybridCache in .NET 9 formalizes this pattern.',
            architectPerspective: 'At scale, cache stampede is a reliability concern, not just performance. A single popular key expiring can DDoS your own database. I implement circuit breakers on DB connections AND stampede protection on cache — belt and suspenders for the cache layer.'
        },
        {
            question: 'What is the difference between Output Caching and Response Caching in ASP.NET Core, and when do you use each?',
            difficulty: 'medium',
            answer: `<p>They solve different problems despite the similar name:</p>
            <ul>
                <li><strong>Response Caching</strong> emits HTTP cache headers (<code>Cache-Control</code>, <code>Expires</code>, <code>Vary</code>) so the <em>client, browser, or a downstream CDN/proxy</em> caches the response. The server keeps little or no copy; you are delegating caching to others and depending on their compliance</li>
                <li><strong>Output Caching</strong> (.NET 7+) stores the full rendered response <em>on the server</em> (memory or a distributed store) and serves it without re-running the endpoint. It does not require client cooperation and supports <strong>tag-based invalidation</strong> (<code>EvictByTagAsync</code>), explicit policies, and locking to prevent stampede</li>
            </ul>
            <p>Use response caching for cacheable, public GETs you want a CDN to absorb at the edge; use output caching when you must guarantee server-side caching, need programmatic invalidation, or cache per-user/varying content.</p>`,
            explanation: 'Response caching is leaving a sticky note asking others to remember the answer for you — they might ignore it. Output caching is you keeping the answer in your own drawer, so you control exactly when it is used and when it is thrown away.',
            code: `// OUTPUT CACHING — server keeps the response; you control invalidation
builder.Services.AddOutputCache(options =>
{
    options.AddPolicy("Products",
        p => p.Expire(TimeSpan.FromMinutes(5)).Tag("products"));
});
var app = builder.Build();
app.UseOutputCache();

app.MapGet("/api/products", GetProducts).CacheOutput("Products");

// Explicit, immediate invalidation on write:
app.MapPost("/api/products", async (Product p, IOutputCacheStore store) =>
{
    await SaveAsync(p);
    await store.EvictByTagAsync("products", default); // purge all product responses
    return Results.Created($"/api/products/{p.Id}", p);
});

// RESPONSE CACHING — headers only; client/CDN does the caching
builder.Services.AddResponseCaching();
app.UseResponseCaching();
app.MapGet("/api/weather", (HttpContext ctx) =>
{
    ctx.Response.GetTypedHeaders().CacheControl = new()
    {
        Public = true, MaxAge = TimeSpan.FromSeconds(60)
    };
    ctx.Response.Headers[HeaderNames.Vary] = "Accept-Encoding";
    return Results.Ok(GetWeather());
});`,
            language: 'csharp',
            bestPractices: [
                'Use output caching when you need guaranteed server-side caching and tag-based invalidation',
                'Use response caching to let a CDN/proxy absorb traffic at the edge for public GETs',
                'Set Vary correctly (Accept-Encoding, Authorization) to avoid serving wrong variants',
                'Never cache authenticated/user-specific responses as public'
            ],
            commonMistakes: [
                'Expecting response caching to store data on the server (it only sets headers)',
                'Caching personalized responses without VaryBy, leaking one user data to another',
                'Forgetting to call UseOutputCache/UseResponseCaching middleware',
                'Marking private/authenticated content as public in Cache-Control'
            ],
            interviewTip: 'One sentence nails it: response caching tells someone else to cache (headers), output caching caches on the server. Then mention output caching\'s killer feature — programmatic EvictByTagAsync invalidation.',
            followUp: ['Why can a CDN ignore your response-cache headers?', 'How does VaryByHeader prevent serving the wrong cached variant?', 'Can output caching use a distributed store?'],
            seniorPerspective: 'For public catalog endpoints I combine both: response-cache headers so the CDN serves most traffic at the edge, and output caching as a server-side backstop with tag invalidation so a write instantly purges both layers via an EvictByTag plus a CDN purge call.',
            architectPerspective: 'I think in cache tiers: CDN (response headers) -> server output cache -> distributed cache -> DB. Each tier has its own TTL and invalidation path. The architectural discipline is ensuring a single write propagates an invalidation outward through every tier so no layer serves stale data longer than the SLA allows.'
        },
        {
            question: 'How do you invalidate caches consistently across multiple application instances?',
            difficulty: 'advanced',
            answer: `<p>The hard case is per-instance in-memory (L1) caches: removing a key on the instance that handled the write leaves stale copies on every other instance. Strategies:</p>
            <ul>
                <li><strong>Shared store as source of truth</strong> — keep authoritative cached data in Redis so all instances read the same value; invalidate once centrally</li>
                <li><strong>Pub/sub fan-out</strong> — on a write, publish an invalidation message (e.g. Redis pub/sub); every instance subscribes and evicts the key from its local L1 cache</li>
                <li><strong>Tag/version keys</strong> — store a version number per logical group; bump it on write so stale entries are bypassed without explicit deletes</li>
                <li><strong>Short L1 TTLs</strong> — accept brief staleness by keeping in-memory entries very short-lived, letting them self-heal</li>
                <li><strong>HybridCache (.NET 9)</strong> — its <code>RemoveByTagAsync</code> and backplane integration coordinate L1+L2 eviction for you</li>
            </ul>`,
            explanation: 'Each instance keeping its own sticky notes is the problem. You either keep one shared whiteboard everyone reads (Redis), or you shout "erase that note!" over the intercom so every desk wipes its copy (pub/sub).',
            code: `// Pub/sub invalidation across instances (StackExchange.Redis):
public class CacheInvalidator : IHostedService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IMemoryCache _local;
    public CacheInvalidator(IConnectionMultiplexer redis, IMemoryCache local)
        => (_redis, _local) = (redis, local);

    public async Task StartAsync(CancellationToken ct)
    {
        var sub = _redis.GetSubscriber();
        await sub.SubscribeAsync(
            RedisChannel.Literal("cache:invalidate"),
            (_, key) => _local.Remove(key.ToString())); // evict local L1 on every node
    }
    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}

// On write: update source + broadcast eviction to ALL instances
public async Task UpdateProductAsync(Product p)
{
    await _repo.UpdateAsync(p);
    await _distributed.RemoveAsync($"product:{p.Id}");           // L2 (shared)
    var sub = _redis.GetSubscriber();
    await sub.PublishAsync(RedisChannel.Literal("cache:invalidate"),
        $"product:{p.Id}");                                       // L1 on every node
}

// .NET 9 HybridCache does the coordination for you:
// await hybridCache.RemoveByTagAsync("products");`,
            language: 'csharp',
            bestPractices: [
                'Treat a shared store (Redis) as the source of truth and invalidate it centrally',
                'Use pub/sub to evict per-instance L1 caches so no node serves stale data',
                'Prefer HybridCache RemoveByTagAsync in .NET 9 to coordinate L1+L2 automatically',
                'Keep L1 TTLs short as a safety net against missed invalidation messages'
            ],
            commonMistakes: [
                'Calling IMemoryCache.Remove on one instance and assuming all instances cleared',
                'Relying solely on pub/sub (a missed message leaves a node stale — pair with short TTLs)',
                'Invalidating L2 (Redis) but forgetting the per-instance L1 copies',
                'No invalidation strategy at all, serving stale data after writes'
            ],
            interviewTip: 'Name the specific failure: in-memory caches are per-process, so a local Remove does not reach other nodes. Then offer the two real fixes — shared source of truth and pub/sub fan-out — and mention HybridCache as the modern built-in.',
            followUp: ['Why pair pub/sub with short L1 TTLs?', 'How does HybridCache backplane invalidation work?', 'What is version/tag-based invalidation?'],
            seniorPerspective: 'I default to HybridCache in .NET 9; before it, I layered IMemoryCache with a Redis pub/sub invalidator and short L1 TTLs. The TTL is deliberate insurance — if an invalidation message is ever dropped, the worst case is a few seconds of staleness, not indefinite.',
            architectPerspective: 'Cross-instance invalidation is an at-least-once messaging problem in disguise. I design for missed messages (idempotent eviction + TTL backstop) rather than assuming the backplane is perfectly reliable, because a single permanently-stale hot key is far worse than uniform short-lived staleness.'
        },
        {
            question: 'What is HybridCache in .NET 9 and what problems does it solve over using IMemoryCache and IDistributedCache directly?',
            difficulty: 'hard',
            answer: `<p><code>HybridCache</code> is a unified two-tier caching abstraction: <strong>L1</strong> in-process memory plus <strong>L2</strong> distributed (Redis/SQL). A single <code>GetOrCreateAsync</code> call checks L1, then L2, then invokes your factory and populates both. It bundles the patterns teams previously hand-rolled:</p>
            <ul>
                <li><strong>Stampede protection</strong> — concurrent callers for the same key share one factory execution (no thundering herd)</li>
                <li><strong>Built-in serialization</strong> — pluggable serializers handle L2 storage; no manual byte juggling</li>
                <li><strong>Tag-based invalidation</strong> — <code>RemoveByTagAsync</code> across tiers</li>
                <li><strong>Backplane coordination</strong> — keeps L1 copies across instances consistent</li>
            </ul>
            <p>It replaces the error-prone "IMemoryCache in front of IDistributedCache with a SemaphoreSlim and JSON serialization" boilerplate with one tested API.</p>`,
            explanation: 'HybridCache is a pre-assembled two-shelf pantry: a small fast shelf at arm\'s reach (memory) and a big shared pantry down the hall (Redis). When you ask for something it checks both shelves, and if it has to cook a fresh batch, everyone who asked at once waits for that single batch instead of all cooking duplicates.',
            code: `builder.Services.AddHybridCache(options =>
{
    options.DefaultEntryOptions = new HybridCacheEntryOptions
    {
        Expiration = TimeSpan.FromMinutes(10),          // L2 (distributed) lifetime
        LocalCacheExpiration = TimeSpan.FromMinutes(1)  // L1 (in-memory) lifetime
    };
});
// Add an L2 provider (otherwise L1-only):
builder.Services.AddStackExchangeRedisCache(o => o.Configuration = "localhost:6379");

public class ProductService(HybridCache cache, IProductRepo repo)
{
    public async Task<Product?> GetAsync(int id, CancellationToken ct)
    {
        return await cache.GetOrCreateAsync(
            $"product:{id}",
            async token => await repo.GetByIdAsync(id, token), // runs ONCE under contention
            tags: new[] { "products" },
            cancellationToken: ct);
        // Flow: L1 hit? -> L2 hit? -> factory -> populate L1 + L2
    }

    public async Task InvalidateCategoryAsync(CancellationToken ct)
        => await cache.RemoveByTagAsync("products", ct); // evicts across tiers + instances
}`,
            language: 'csharp',
            bestPractices: [
                'Prefer HybridCache for new code instead of hand-wiring IMemoryCache + IDistributedCache',
                'Set LocalCacheExpiration shorter than the distributed Expiration so L1 self-heals',
                'Tag entries so related data can be invalidated together with RemoveByTagAsync',
                'Register an L2 provider (Redis) to get true distributed behavior, not just L1'
            ],
            commonMistakes: [
                'Assuming HybridCache is distributed without registering an L2 provider (it is L1-only then)',
                'Setting L1 expiration equal to or longer than L2, defeating cross-instance freshness',
                'Re-implementing stampede locks on top of HybridCache (it already handles it)',
                'Caching huge objects that are expensive to serialize for marginal hit benefit'
            ],
            interviewTip: 'Frame it as "the boilerplate killer": stampede protection + serialization + L1/L2 + tag invalidation + backplane, all in one API. Mention you must add an L2 provider or it degrades to in-memory only.',
            followUp: ['How does HybridCache prevent cache stampede internally?', 'What happens if you do not register a distributed L2 provider?', 'How does RemoveByTagAsync coordinate across instances?'],
            seniorPerspective: 'HybridCache is now my default. The win is not just convenience — it eliminates the subtle bugs teams ship when hand-rolling stampede locks and serialization, which are exactly the things that fail under production load rather than in tests.',
            architectPerspective: 'A standardized caching primitive across services makes caching behavior auditable and consistent: same stampede semantics, same invalidation model, same telemetry. That consistency matters more at scale than squeezing out the last few microseconds from a bespoke per-service cache.'
        },
        {
            question: 'What is cache stampede (thundering herd) and what strategies prevent it in a distributed caching system?',
            difficulty: 'hard',
            answer: `<p>A <strong>cache stampede</strong> occurs when a popular cache entry expires and hundreds of concurrent requests all miss the cache simultaneously, causing them all to hit the backend (database/service) at once. This can overwhelm the backend, cause cascading failures, and paradoxically slow recovery because the backend is too overloaded to serve the data needed to repopulate the cache.</p>
            <p>Prevention strategies:</p>
            <ul>
                <li><strong>Lock/Semaphore (single-flight)</strong> \u2014 only one request computes the value; others wait for that result. HybridCache does this automatically.</li>
                <li><strong>Probabilistic early expiration</strong> \u2014 before actual expiry, a random request refreshes the cache proactively (XFetch algorithm)</li>
                <li><strong>Stale-while-revalidate</strong> \u2014 serve stale data immediately while one background request refreshes</li>
                <li><strong>External lock (distributed mutex)</strong> \u2014 Redis SETNX-based lock so only one instance across the cluster refreshes</li>
                <li><strong>Never-expire + background refresh</strong> \u2014 cache never truly expires; a background job keeps it fresh</li>
            </ul>`,
            explanation: 'A cache stampede is like a food truck that closes its window for 30 seconds to refill, and the entire line of 200 people rushes to the restaurant next door simultaneously, crashing it. The fix: one person from the line helps refill while others wait or get the last batch.',
            code: `// STRATEGY 1: SemaphoreSlim (in-process lock) — simplest
private static readonly SemaphoreSlim _lock = new(1, 1);
private static readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

public async Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory)
{
    var cached = await _cache.GetAsync<T>(key);
    if (cached is not null) return cached;

    var keyLock = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
    await keyLock.WaitAsync();
    try
    {
        // Double-check after acquiring lock
        cached = await _cache.GetAsync<T>(key);
        if (cached is not null) return cached;

        var value = await factory(); // Only ONE caller executes this
        await _cache.SetAsync(key, value, TimeSpan.FromMinutes(5));
        return value;
    }
    finally { keyLock.Release(); }
}

// STRATEGY 2: Probabilistic early expiration (XFetch)
public async Task<T> GetWithXFetch<T>(string key, Func<Task<T>> factory, TimeSpan ttl)
{
    var entry = await _cache.GetWithMetadataAsync<T>(key);
    if (entry is not null)
    {
        var remaining = entry.Expiry - DateTime.UtcNow;
        var delta = ttl * 0.1; // recompute window = 10% of TTL
        // Probabilistically refresh before expiry:
        var shouldRefresh = remaining < delta * Math.Log(Random.Shared.NextDouble()) * -1;
        if (!shouldRefresh) return entry.Value;
    }
    // Refresh (first caller wins, others get stale or wait)
    var value = await factory();
    await _cache.SetAsync(key, value, ttl);
    return value;
}

// STRATEGY 3: HybridCache (.NET 9) handles it automatically:
var product = await _hybridCache.GetOrCreateAsync(
    "product:123",
    async ct => await _repo.GetByIdAsync(123, ct)); // single-flight built in`,
            language: 'csharp',
            bestPractices: [
                'Use HybridCache (.NET 9) or a proven library rather than hand-rolling stampede protection',
                'Implement per-key locking (not a global lock) to allow parallel requests for different keys',
                'Use double-check after acquiring the lock to avoid redundant computation',
                'Consider stale-while-revalidate for read-heavy endpoints where slight staleness is acceptable',
                'Monitor cache hit rates and backend load during expiration windows'
            ],
            commonMistakes: [
                'Using a global lock for all cache keys (serializes unrelated requests)',
                'Not double-checking after acquiring the lock (wastes the computation another thread already did)',
                'Setting identical TTLs on all entries (synchronized expiration causes synchronized stampedes)',
                'Ignoring the problem assuming the database can handle burst load (it often cannot)'
            ],
            interviewTip: 'Name the problem precisely (cache stampede / thundering herd), then walk through at least two solutions with trade-offs. Mention HybridCache as the modern .NET answer and explain it uses single-flight internally.',
            followUp: ['How does stale-while-revalidate work at the HTTP level vs application level?', 'What is the XFetch algorithm?', 'How do you prevent stampede across multiple server instances (not just threads)?']
        },
        {
            question: 'What strategies exist for distributed cache invalidation, and what are the consistency trade-offs of each?',
            difficulty: 'hard',
            answer: `<p>Distributed cache invalidation is one of the hardest problems in computing. Strategies differ in consistency guarantee, complexity, and latency:</p>
            <ul>
                <li><strong>TTL-based expiration</strong> \u2014 simplest; entries expire after a fixed time. Trade-off: stale data for up to TTL duration. Best for: data that tolerates eventual consistency.</li>
                <li><strong>Event-driven invalidation</strong> \u2014 publish cache-invalidation events (via Redis Pub/Sub, message bus) when data changes. Trade-off: more complex, events can be lost. Best for: moderate freshness requirements.</li>
                <li><strong>Write-through cache</strong> \u2014 all writes go through the cache layer, which updates both cache and database atomically. Trade-off: write latency, coupling. Best for: high-read, low-write workloads.</li>
                <li><strong>Cache-aside with versioning</strong> \u2014 store a version counter; readers check version before using cached data. Trade-off: extra round-trip for version check.</li>
                <li><strong>Tag-based invalidation</strong> \u2014 tag entries with entity/category names; invalidate all entries with a tag. HybridCache supports this with RemoveByTagAsync.</li>
            </ul>
            <p>No strategy gives you both instant consistency AND zero overhead. The choice depends on how stale your users can tolerate the data being.</p>`,
            explanation: 'Cache invalidation is like recalling a newspaper after printing. TTL is "tomorrow we print a correction." Event-driven is "send a messenger to every newsstand now." Write-through is "never print without the latest draft." Each costs more effort for more freshness.',
            code: `// STRATEGY 1: TTL-based (simple, eventual consistency)
await cache.SetAsync("user:123", user, new DistributedCacheEntryOptions
{
    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
    SlidingExpiration = TimeSpan.FromMinutes(1)
});
// Data may be up to 5 minutes stale — acceptable for profiles, not for balances

// STRATEGY 2: Event-driven via Redis Pub/Sub
public class UserUpdatedHandler : INotificationHandler<UserUpdated>
{
    private readonly IDistributedCache _cache;
    private readonly IConnectionMultiplexer _redis;

    public async Task Handle(UserUpdated notification, CancellationToken ct)
    {
        // Remove from local cache
        await _cache.RemoveAsync($"user:{notification.UserId}", ct);
        // Notify other instances via pub/sub
        await _redis.GetSubscriber()
            .PublishAsync("cache-invalidation", $"user:{notification.UserId}");
    }
}
// Each instance subscribes and clears its local cache on message

// STRATEGY 3: Tag-based invalidation (HybridCache .NET 9)
await _hybridCache.GetOrCreateAsync(
    $"product:{id}",
    async ct => await _repo.GetAsync(id, ct),
    tags: new[] { "products", $"category:{product.CategoryId}" });
// Invalidate all products in a category:
await _hybridCache.RemoveByTagAsync($"category:{categoryId}");

// STRATEGY 4: Write-through pattern
public async Task UpdateUserAsync(User user)
{
    await _repository.UpdateAsync(user);          // DB first
    await _cache.SetAsync($"user:{user.Id}", user); // then cache
    // Or: remove from cache and let next read repopulate
}`,
            language: 'csharp',
            bestPractices: [
                'Default to TTL-based expiration unless freshness requirements demand more',
                'Use event-driven invalidation for data that must be fresh within seconds',
                'Combine TTL with event-driven as a safety net (TTL catches missed events)',
                'Use tag-based invalidation for related entity groups (all products in a category)',
                'Monitor cache staleness metrics to validate your consistency SLA'
            ],
            commonMistakes: [
                'Assuming event-driven invalidation is perfectly reliable (messages can be lost)',
                'Invalidating without TTL backup (a lost event means stale data forever)',
                'Over-invalidating (clearing entire cache on any write, defeating the purpose)',
                'Not considering multi-region: invalidation events have network propagation delay'
            ],
            interviewTip: 'Frame it as a spectrum from simple+stale (TTL) to complex+fresh (write-through). Show awareness that no solution is perfect and that combining strategies (event + TTL safety net) is the production pattern.',
            followUp: ['How do you handle cache invalidation across multiple data centers?', 'What consistency model does your caching layer provide?', 'How does CAP theorem apply to distributed caching?']
        },
        {
            question: 'What is cache stampede (thundering herd) and how do you prevent it? Explain the SemaphoreSlim pattern, Lazy<T> in ConcurrentDictionary, HybridCache single-flight, and probabilistic early refresh.',
            difficulty: 'advanced',
            answer: `<p>Cache stampede occurs when a cached item expires and multiple concurrent requests simultaneously attempt to recompute the same expensive value â€” all hit the database/service at once, potentially causing cascading failures. Instead of 1 recomputation, you get N (where N = concurrent requests for that key).</p>
            <p>Prevention patterns: (1) <strong>SemaphoreSlim per key</strong> â€” only one thread recomputes while others wait; (2) <strong>Lazy&lt;T&gt; in ConcurrentDictionary</strong> â€” GetOrAdd with Lazy ensures the factory runs exactly once; (3) <strong>HybridCache (.NET 9)</strong> â€” built-in single-flight semantics where the framework deduplicates concurrent requests for the same key; (4) <strong>Probabilistic early refresh</strong> â€” before actual expiration, a random subset of requests trigger background refresh (XFetch algorithm), so the cache never truly expires under load.</p>
            <p>The best production approach combines: Lazy/SemaphoreSlim for single-flight protection, a short stale-while-revalidate window where expired values are served while refresh happens in background, and probabilistic early refresh for high-traffic keys. HybridCache in .NET 9 implements most of this out of the box.</p>`,
            explanation: 'Cache stampede is like a store opening with 1000 people rushing the door at once when a "sale starts" sign flips. Single-flight is a bouncer that lets one person in to check if the sale is real while everyone else waits for their report.',
            code: `// PATTERN 1: SemaphoreSlim per cache key
private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

public async Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory)
{
    if (_cache.TryGetValue(key, out T cached))
        return cached;
    
    var semaphore = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
    await semaphore.WaitAsync();
    try
    {
        // Double-check after acquiring lock
        if (_cache.TryGetValue(key, out cached))
            return cached;
        
        var value = await factory();
        _cache.Set(key, value, TimeSpan.FromMinutes(5));
        return value;
    }
    finally { semaphore.Release(); }
}

// PATTERN 2: Lazy<T> for synchronous single-flight
var cache = new ConcurrentDictionary<string, Lazy<ExpensiveResult>>();
var result = cache.GetOrAdd(key,
    k => new Lazy<ExpensiveResult>(() => Compute(k))).Value;

// PATTERN 3: HybridCache (.NET 9) â€” built-in stampede prevention
public async Task<Product> GetProductAsync(int id)
{
    return await _hybridCache.GetOrCreateAsync(
        $"product:{id}",
        async ct => await _db.Products.FindAsync(id, ct),
        new HybridCacheEntryOptions
        {
            Expiration = TimeSpan.FromMinutes(10),
            LocalCacheExpiration = TimeSpan.FromMinutes(2)
        });
    // Multiple concurrent calls for same key = ONE database query
}

// PATTERN 4: Probabilistic early refresh (XFetch)
bool ShouldRefreshEarly(DateTimeOffset expiry, TimeSpan window)
{
    var timeToExpiry = expiry - DateTimeOffset.UtcNow;
    if (timeToExpiry > window) return false;
    var probability = 1.0 - (timeToExpiry / window);
    return Random.Shared.NextDouble() < probability;
}`,
            language: 'csharp',
            bestPractices: [
                'Always use single-flight protection for expensive cache misses (DB queries, API calls)',
                'Use HybridCache in .NET 9+ for built-in stampede prevention and L1/L2 caching',
                'Implement stale-while-revalidate to serve expired values while refreshing in background',
                'Use probabilistic early refresh for extremely high-traffic keys to avoid any expiration gap',
                'Clean up SemaphoreSlim instances to prevent memory leaks in long-running services'
            ],
            commonMistakes: [
                'Using a single global lock instead of per-key locks (serializes ALL cache misses)',
                'Not double-checking the cache after acquiring the lock (all waiters recompute)',
                'Holding the lock during the entire factory execution including I/O (blocks all waiters for full duration)',
                'Ignoring stampede prevention for "fast" operations that become slow under load'
            ],
            interviewTip: 'Name all four patterns and explain the trade-off spectrum: SemaphoreSlim (simple, per-key locking), Lazy (single-flight for sync), HybridCache (framework-level), probabilistic refresh (zero-downtime). Show you know the double-check pattern after lock acquisition.',
            followUp: ['How does HybridCache differ from IDistributedCache?', 'What is the XFetch algorithm for probabilistic early refresh?', 'How do you handle cache stampede in a distributed (multi-node) environment?']
        },
        {
            question: 'What are the main distributed cache invalidation patterns? Explain pub/sub fan-out, tag-based invalidation, version keys, and the "short TTL as safety net" approach.',
            difficulty: 'hard',
            answer: `<p>Distributed cache invalidation addresses the problem: when data changes in the database, how do ALL cache nodes learn about it? Four complementary patterns handle this:</p>
            <p><strong>Pub/sub fan-out</strong>: When data is written, publish an invalidation message (e.g., via Redis Pub/Sub, RabbitMQ) containing the cache key or entity ID. All application nodes subscribe and evict locally. Fast (sub-second) but unreliable â€” messages can be lost during deployments or network partitions.</p>
            <p><strong>Tag-based invalidation</strong>: Associate cache entries with tags (e.g., "product:123", "category:electronics"). When a category changes, invalidate all entries tagged with that category. Efficient for hierarchical relationships. Redis supports this via Sets tracking which keys belong to which tag.</p>
            <p><strong>Version keys</strong>: Instead of invalidating, increment a version counter in the cache. Cache keys include the version: "products:v5:list". When the version bumps to v6, old keys become unreachable (and expire via TTL). Zero-cost invalidation â€” just one counter write.</p>
            <p><strong>Short TTL safety net</strong>: Always set a TTL even with event-driven invalidation. If an invalidation event is lost (network issue, crashed subscriber), the TTL guarantees eventual consistency within a bounded window. This is the "belt and suspenders" approach.</p>`,
            explanation: 'Pub/sub is like a PA announcement ("aisle 5 restocked!"). Tag-based is like pulling all books by one author off shelves at once. Version keys are like changing the library catalog number so old references lead nowhere. Short TTL is the janitor who checks every shelf hourly regardless.',
            code: `// PATTERN 1: Pub/Sub fan-out with Redis
public class CacheInvalidationService
{
    private readonly ISubscriber _subscriber;
    private readonly IMemoryCache _localCache;
    
    public CacheInvalidationService(IConnectionMultiplexer redis, IMemoryCache cache)
    {
        _localCache = cache;
        _subscriber = redis.GetSubscriber();
        _subscriber.Subscribe("cache:invalidate", (channel, key) =>
        {
            _localCache.Remove(key.ToString()); // Evict locally
        });
    }
    
    public async Task InvalidateAsync(string key)
    {
        _localCache.Remove(key); // Local eviction
        await _subscriber.PublishAsync("cache:invalidate", key); // Fan-out
    }
}

// PATTERN 2: Tag-based invalidation
public async Task InvalidateByTagAsync(string tag)
{
    var db = _redis.GetDatabase();
    var keys = await db.SetMembersAsync($"tag:{tag}"); // Get all tagged keys
    foreach (var key in keys)
        await db.KeyDeleteAsync(key.ToString());
    await db.KeyDeleteAsync($"tag:{tag}"); // Clean up tag set
}

// PATTERN 3: Version keys
public async Task<string> GetCacheKeyAsync(string entity)
{
    var db = _redis.GetDatabase();
    var version = await db.StringGetAsync($"{entity}:version");
    return $"{entity}:v{version}:data";
}
public async Task BumpVersionAsync(string entity)
{
    await _redis.GetDatabase().StringIncrementAsync($"{entity}:version");
    // Old versioned keys expire naturally via TTL â€” no explicit delete needed
}

// PATTERN 4: Always combine with TTL safety net
var options = new DistributedCacheEntryOptions
{
    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30), // Safety net
    SlidingExpiration = TimeSpan.FromMinutes(5) // Keep hot data alive
};`,
            language: 'csharp',
            bestPractices: [
                'Always combine event-driven invalidation with TTL as a safety net for lost events',
                'Use pub/sub for real-time invalidation across nodes (sub-second freshness)',
                'Use tag-based invalidation for related entities (all products in a category)',
                'Use version keys for high-write scenarios where explicit deletion is expensive',
                'Monitor cache staleness metrics to validate your consistency SLA'
            ],
            commonMistakes: [
                'Relying solely on pub/sub without TTL backup (lost messages mean stale data forever)',
                'Over-invalidating (clearing entire cache on any write, defeating the purpose of caching)',
                'Not considering multi-region propagation delay for invalidation events',
                'Using tag invalidation with thousands of keys per tag (O(n) delete operation)'
            ],
            interviewTip: 'Frame it as a spectrum from simple+stale (TTL only) to complex+fresh (pub/sub + tags + version keys). Show awareness that no single solution is perfect and that combining strategies is the production pattern. Always mention TTL as the safety net.',
            followUp: ['How do you handle cache invalidation across multiple data centers?', 'What consistency model does your caching layer provide?', 'How does CAP theorem apply to distributed caching?']
        }
    ]
});
