/* ═══════════════════════════════════════════════════════════════════
   Performance — Caching Strategies
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('perf-caching', {
    title: 'Caching Strategies',
    description: 'Cache-aside, write-through, write-behind, CDN caching, cache invalidation, and multi-tier caching architectures for high-performance applications.',
    sections: [
        {
            title: 'Multi-Layer Cache Architecture',
            mermaid: `graph LR
    REQ["Client"] --> CDN["CDN Edge"]
    CDN -->|miss| APP["App Server"]
    APP --> L1["L1 In-Process<br/>(IMemoryCache)"]
    L1 -->|miss| L2["L2 Distributed<br/>(Redis)"]
    L2 -->|miss| DB["Database"]
    DB --> L2
    L2 --> L1
    L1 --> APP`,
            content: `<p>Production systems use layered caching: CDN for static/public content, in-process memory for hot data, distributed Redis for shared cache, with the database as the source of truth.</p>`
        },
        {
            title: 'Caching Patterns & Architecture',
            content: `<p>Caching is the single most effective performance optimization — turning 50ms database queries into 0.1ms memory lookups. The challenge is keeping cached data fresh.</p>`,
            code: `// MULTI-TIER CACHING ARCHITECTURE:
// L1: In-process memory (IMemoryCache) — 0.001ms, per-instance
// L2: Distributed cache (Redis) — 0.5-2ms, shared across instances
// L3: CDN edge cache — varies by region, global
// Origin: Database — 5-50ms

// Cache strategies by data type:
// Static reference data (countries, currencies): L1 long TTL (hours) + L2
// User session: L2 only (Redis, shared across instances)
// API response: CDN + L2 (short TTL, tag-based invalidation)
// Database query results: L1 short TTL + L2 medium TTL
// Computed/aggregated data: L2 with scheduled refresh

// Cache invalidation strategies:
// 1. TTL-based: expires after fixed time (simple, eventual staleness)
// 2. Event-driven: invalidate when source data changes (immediate, complex)
// 3. Tag-based: group entries by tag, purge tag (e.g., "product:123")
// 4. Version-based: cache key includes version/ETag (never stale, cold start)

// CDN caching headers:
// Cache-Control: public, max-age=3600 (CDN + browser cache 1 hour)
// Cache-Control: private, max-age=60 (browser only, not CDN)
// Cache-Control: no-store (never cache — sensitive data)
// Vary: Authorization (different cache per user token)
// ETag: "abc123" (conditional requests — 304 Not Modified)

// Cache warming (pre-populate on startup or schedule):
public class CacheWarmupService : IHostedService
{
    public async Task StartAsync(CancellationToken ct)
    {
        var products = await _db.Products.Where(p => p.IsPopular).ToListAsync(ct);
        foreach (var p in products)
            await _cache.SetAsync($"product:{p.Id}", p, TimeSpan.FromHours(1));
    }
}`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'What caching strategies would you use for a high-traffic e-commerce API?',
            difficulty: 'advanced',
            answer: `<p>Multi-tier approach: (1) CDN for static assets and public product pages, (2) distributed cache (Redis) for product details, user sessions, and cart data, (3) in-memory cache for hot reference data (categories, config). Invalidation via event-driven (product updated → purge cache) + short TTLs for acceptable staleness windows.</p>`,
            bestPractices: ['Use CDN for static content and cacheable API responses (product catalogs)', 'Use Redis for shared state (sessions, carts) and frequently queried data', 'Use in-memory for hot, rarely-changing reference data (country lists, feature flags)', 'Implement cache warming for predictable hot data (popular products, homepage content)'],
            commonMistakes: ['Caching without an invalidation strategy (serving stale prices/inventory)', 'Single cache layer without fallback (Redis down = everything hits DB)', 'Caching too aggressively on sensitive data (another user sees cached personal data)', 'Not monitoring cache hit rates (low hit rate means cache is providing no benefit)'],
            interviewTip: 'Structure your answer by data type: What do you cache? Where (CDN/Redis/memory)? How long (TTL)? How do you invalidate? Show you think about the invalidation problem, not just the happy path.',
            followUp: ['How do you handle cache thundering herd?', 'What is cache-aside vs write-through?', 'How do you implement tag-based invalidation?'],
            seniorPerspective: 'I measure cache hit rates obsessively. A cache with 30% hit rate is barely helping. I target 90%+ for hot paths by tuning TTLs, pre-warming popular data, and using event-driven invalidation rather than short TTLs for frequently-changing data.',
            architectPerspective: 'Caching architecture determines system throughput ceiling. Without cache: limited by DB (5K RPS). With Redis: 50K RPS. With CDN: 500K RPS. Each tier is a 10x multiplier. I design cache layers as a first-class architectural concern, not an afterthought.'
        },
        {
            question: 'Compare cache-aside, write-through, and write-behind. When would you choose each?',
            difficulty: 'hard',
            answer: `<p>These are the three core read/write caching patterns, differing in how and when the cache and the backing store are kept in sync:</p>
<ul>
<li><strong>Cache-aside (lazy loading)</strong>: Application code checks the cache first; on a miss it reads from the DB and populates the cache. Writes go directly to the DB and the cache entry is invalidated. The cache only ever holds data that was actually requested. Best general-purpose pattern for read-heavy workloads.</li>
<li><strong>Write-through</strong>: Writes go to the cache, which synchronously writes to the DB before returning. The cache is always consistent with the store, but every write pays the latency of both hops. Pairs well with read-through for data that is read soon after being written.</li>
<li><strong>Write-behind (write-back)</strong>: Writes go to the cache and return immediately; the DB is updated asynchronously in batches. Lowest write latency and highest write throughput, but risks data loss if the cache fails before flushing, and adds complexity (ordering, retries, durability).</li>
</ul>
<p><strong>Choose</strong> cache-aside as the default; write-through when read-after-write consistency matters and write volume is moderate; write-behind only for high-volume writes where some durability risk is acceptable (e.g., metrics, counters, view tracking).</p>`,
            explanation: 'Cache-aside is like only restocking a shelf when someone asks for an item. Write-through is updating the shelf and the warehouse at the same time. Write-behind is updating the shelf now and syncing the warehouse later.',
            code: `// Cache-aside (lazy loading)
public async Task<Product> GetProductAsync(int id)
{
    var key = $"product:{id}";
    var cached = await _cache.GetAsync<Product>(key);
    if (cached != null) return cached;            // hit

    var product = await _db.Products.FindAsync(id); // miss -> load
    await _cache.SetAsync(key, product, TimeSpan.FromMinutes(10));
    return product;
}

public async Task UpdateProductAsync(Product p)
{
    await _db.SaveChangesAsync();                 // write to store
    await _cache.RemoveAsync($"product:{p.Id}");  // invalidate, not update
}

// Write-through: cache writes synchronously to the store
public async Task SaveWriteThroughAsync(Product p)
{
    await _db.SaveChangesAsync();                 // store updated first
    await _cache.SetAsync($"product:{p.Id}", p, TimeSpan.FromMinutes(10));
}`,
            language: 'csharp',
            bestPractices: ['Default to cache-aside for read-heavy systems and invalidate on write rather than updating in place', 'Use write-through when consumers read immediately after writing and staleness is unacceptable', 'Reserve write-behind for high-write, loss-tolerant data and add a durable buffer (e.g., a queue) for the async flush', 'Set sane TTLs even with event-driven invalidation as a safety net against missed invalidations'],
            commonMistakes: ['Updating the cache in place on write in cache-aside, which creates race conditions under concurrency (prefer invalidate)', 'Using write-behind for financial or order data where lost writes are catastrophic', 'Forgetting that write-through still leaves reads cold unless paired with read-through or pre-population', 'Assuming write-through guarantees consistency across multiple cache nodes without coordination'],
            interviewTip: 'Frame the trade-off as consistency vs latency vs durability, then pick a default (cache-aside) and name the specific conditions that push you to the others.',
            followUp: ['How does cache-aside behave under concurrent read/write races?', 'How would you make write-behind durable?', 'Where does read-through fit relative to these patterns?'],
            seniorPerspective: 'In production I have seen write-behind cause silent data loss during a Redis failover because the in-flight batch was never persisted. I now only use write-behind when the async path is backed by a durable queue and the data is reconstructable, otherwise I default to cache-aside with invalidate-on-write.',
            architectPerspective: 'The pattern choice is really a consistency-model decision that ripples through the whole system. Write-behind effectively makes the cache the system of record for a window of time, which forces you to design for reconciliation, idempotent flushes, and failure recovery — that is an architectural commitment, not a caching tweak.'
        },
        {
            question: 'Explain cache stampede (thundering herd) and the techniques to prevent it.',
            difficulty: 'advanced',
            answer: `<p>A <strong>cache stampede</strong> (thundering herd) occurs when a popular cache entry expires and many concurrent requests simultaneously miss the cache and hammer the backing store to recompute the same value, often overwhelming the database and causing a cascading outage.</p>
<p>Key mitigations:</p>
<ul>
<li><strong>Request coalescing / single-flight locking</strong>: only one request recomputes the value while others wait for the result. Implemented with a distributed lock (e.g., Redis <code>SET NX PX</code>) or an in-process lock per key.</li>
<li><strong>Probabilistic early expiration</strong>: refresh the value slightly before its TTL expires based on a random probability, spreading recomputation over time instead of a synchronized cliff.</li>
<li><strong>Stale-while-revalidate</strong>: serve the stale value immediately while a background task refreshes it, so users never wait on the recompute.</li>
<li><strong>Jittered TTLs</strong>: add randomness to TTLs so many keys created together do not all expire at the same instant.</li>
<li><strong>Cache warming</strong>: pre-populate hot keys before they are needed.</li>
</ul>`,
            explanation: 'Imagine a store with one popular item. The moment the shelf empties, 500 customers rush the stockroom at once. Instead, you let one person restock while everyone else waits, or you refill just before it runs out.',
            code: `// Single-flight with a distributed lock (Redis SET NX)
public async Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan ttl)
{
    var cached = await _cache.GetAsync<T>(key);
    if (cached != null) return cached;

    var lockKey = $"lock:{key}";
    var token = Guid.NewGuid().ToString();
    // Only one caller acquires the lock
    var gotLock = await _redis.StringSetAsync(lockKey, token, TimeSpan.FromSeconds(5), When.NotExists);

    if (!gotLock)
    {
        // Wait briefly and read the value the winner produced
        await Task.Delay(50);
        return await _cache.GetAsync<T>(key) ?? await factory();
    }

    try
    {
        var value = await factory();              // single recompute
        await _cache.SetAsync(key, value, ttl);
        return value;
    }
    finally
    {
        // Release only if we still own the lock (token check)
        await _redis.ScriptEvaluateAsync(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
            new RedisKey[] { lockKey }, new RedisValue[] { token });
    }
}`,
            language: 'csharp',
            bestPractices: ['Coalesce concurrent misses to a single recompute using a per-key distributed lock with a safe expiry', 'Add TTL jitter so co-created keys do not expire simultaneously', 'Prefer stale-while-revalidate for hot keys so users never block on regeneration', 'Always use a fenced/token-based lock release to avoid deleting a lock another worker acquired'],
            commonMistakes: ['Using a distributed lock without an expiry, which can deadlock the key if the holder crashes', 'Releasing a lock without verifying ownership, deleting a newer holder\'s lock', 'Relying solely on short TTLs, which increases miss frequency and stampede risk', 'Ignoring the cold-start case where the key never existed (first-ever request is also a herd)'],
            interviewTip: 'Name the failure mode first (synchronized expiry causing a DB pile-on) then offer two or three concrete mitigations rather than just locking.',
            followUp: ['How do you set a safe lock timeout?', 'What is the difference between stampede and a cold cache?', 'How would you implement stale-while-revalidate in Redis?'],
            seniorPerspective: 'I once watched a single expired homepage key take down a database during a traffic spike — thousands of requests recomputed the same aggregate at once. The fix was single-flight plus serving stale content during revalidation, which dropped origin load by over 99% on that path.',
            architectPerspective: 'Stampede protection is part of designing for graceful degradation. At scale I treat the cache as a load shield, so I architect hot paths to always have a fallback value (stale or default) and never let a cache miss translate directly into unbounded origin concurrency.'
        },
        {
            question: 'A user reports seeing stale data after an update in a multi-instance, Redis-backed deployment. How do you diagnose and fix it?',
            difficulty: 'hard',
            answer: `<p>The likely culprit is an <strong>L1/L2 coherence gap</strong>: each application instance holds its own in-process (L1) cache, and an update only invalidated the shared Redis (L2) entry and the local instance's L1 — other instances keep serving their stale L1 copies until TTL expiry.</p>
<p>Diagnosis steps:</p>
<ul>
<li>Confirm whether the stale read is sticky to specific instances (points to per-instance L1) versus global (points to a missed L2 invalidation).</li>
<li>Check the write path: does it invalidate L2 <em>and</em> broadcast invalidation to all instances' L1?</li>
<li>Inspect TTLs and whether invalidation events are actually firing (logs/metrics on invalidation count).</li>
</ul>
<p>Fixes:</p>
<ul>
<li><strong>Backplane invalidation</strong>: publish a key-invalidation message over Redis pub/sub so every instance evicts its L1 entry. .NET 8's <code>HybridCache</code> formalizes this L1+L2 pattern with tag-based invalidation.</li>
<li><strong>Short L1 TTLs</strong> to bound staleness when broadcast is impractical.</li>
<li><strong>Version-stamped keys</strong> so updates produce a new key and old entries become unreachable.</li>
</ul>`,
            explanation: 'Each cashier keeps a sticky note of prices at their own till. When a price changes, you update the central board but forget to tell the other cashiers, so they keep charging the old price until their note happens to fall off.',
            code: `// Redis pub/sub backplane to evict L1 across all instances
public class HybridCacheService
{
    private readonly IMemoryCache _l1;
    private readonly IConnectionMultiplexer _redis;

    public HybridCacheService(IMemoryCache l1, IConnectionMultiplexer redis)
    {
        _l1 = l1;
        _redis = redis;
        // Every instance subscribes and evicts its own L1 copy
        _redis.GetSubscriber().Subscribe("cache-invalidate", (_, key) =>
            _l1.Remove((string)key));
    }

    public async Task InvalidateAsync(string key)
    {
        await _redis.GetDatabase().KeyDeleteAsync(key);     // L2
        _l1.Remove(key);                                    // local L1
        await _redis.GetSubscriber()
            .PublishAsync("cache-invalidate", key);         // tell other instances
    }
}`,
            language: 'csharp',
            bestPractices: ['Treat L1 and L2 as one coherent system — every invalidation must reach both layers on every instance', 'Use a pub/sub backplane (or HybridCache) to broadcast evictions across instances', 'Keep L1 TTLs short relative to acceptable staleness as a backstop', 'Emit metrics on invalidation publish/receive so you can prove evictions are happening'],
            commonMistakes: ['Invalidating only Redis and the local L1, forgetting other instances hold their own L1', 'Assuming a single TTL value bounds staleness when L1 and L2 TTLs differ', 'No observability on invalidation events, making the bug impossible to confirm', 'Caching user-specific data in a shared key, causing one user to see another\'s data'],
            interviewTip: 'Lead with the hypothesis (per-instance L1 not being invalidated across the fleet) and describe how you would confirm it before jumping to the fix.',
            followUp: ['How does .NET 8 HybridCache handle this?', 'What are the trade-offs of pub/sub invalidation vs short TTLs?', 'How would version-stamped keys eliminate the race entirely?'],
            seniorPerspective: 'This exact class of bug is hard to reproduce because it depends on which instance serves the request behind a load balancer. I debug it by adding the serving instance ID to responses/logs; once you see staleness correlate with specific instances, the per-instance L1 cause is obvious and the pub/sub backplane is the fix.',
            architectPerspective: 'Multi-tier caching introduces a distributed consistency problem that most teams underestimate. At the architecture level I decide explicitly how strong the coherence guarantee needs to be — eventual with short TTLs for catalog data, near-immediate with a backplane for pricing — because the invalidation mechanism, not the cache itself, is what determines correctness at scale.'
        },
        {
            question: 'How does HTTP/CDN caching work, and how do Cache-Control, ETag, and stale-while-revalidate fit together at the edge?',
            difficulty: 'advanced',
            answer: `<p>CDN/HTTP caching pushes responses to edge nodes close to users, serving them without touching the origin. The behavior is driven by response headers:</p>
<ul>
<li><strong><code>Cache-Control</code></strong> is the primary directive. <code>public</code> allows shared (CDN) caching; <code>private</code> restricts to the browser; <code>max-age=N</code> sets freshness lifetime in seconds; <code>s-maxage=N</code> overrides max-age for shared caches only; <code>no-store</code> forbids caching entirely (use for sensitive data).</li>
<li><strong><code>ETag</code></strong> enables <strong>conditional revalidation</strong>: the response carries a content hash; on a subsequent request the client sends <code>If-None-Match</code>, and the origin returns <code>304 Not Modified</code> (no body) if unchanged — saving bandwidth while confirming freshness.</li>
<li><strong><code>Vary</code></strong> tells the cache which request headers create distinct cache entries (e.g., <code>Vary: Accept-Encoding</code>, <code>Vary: Authorization</code>) — misusing it (e.g., varying on a unique header) destroys cache hit rate.</li>
<li><strong><code>stale-while-revalidate=N</code></strong> lets the edge serve a stale response immediately while it revalidates in the background, so users never wait on the origin; <strong><code>stale-if-error=N</code></strong> serves stale content if the origin is down (resilience).</li>
</ul>
<p>For invalidation beyond TTLs, CDNs support <strong>explicit purge</strong> (by URL or by surrogate/cache tag) so you can evict on content change rather than waiting for expiry.</p>`,
            explanation: 'A CDN is like local convenience stores stocked from a central warehouse. Cache-Control says how long each store can sell an item before checking; ETag is the store phoning the warehouse to ask "still the same?" and hearing "yep, no need to reship"; stale-while-revalidate means the store keeps selling the current stock while quietly reordering.',
            code: `// Cacheable public product page: edge caches 5 min, serves stale up to 1 day while refreshing
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=86400
ETag: "v3-9f8a2c"
Vary: Accept-Encoding

// Per-user, browser-only, never shared at the edge
Cache-Control: private, max-age=30
Vary: Authorization

// Conditional revalidation round-trip:
// Request:  GET /product/123   If-None-Match: "v3-9f8a2c"
// Response: 304 Not Modified   (empty body — client reuses its cached copy)`,
            language: 'bash',
            bestPractices: ['Use s-maxage for the CDN and max-age for the browser so you can tune each tier independently', 'Pair long edge TTLs with surrogate/cache-tag purge so you invalidate on change instead of guessing TTLs', 'Use stale-while-revalidate and stale-if-error to hide origin latency and origin outages from users', 'Set Vary precisely — only on headers that genuinely change the response — to protect hit rate'],
            commonMistakes: ['Caching authenticated/personalized responses as public, leaking one user\'s data to others', 'Over-broad Vary (e.g., on a per-request header) that fragments the cache and yields near-zero hits', 'Relying only on TTL expiry with no purge mechanism, forcing a trade-off between staleness and load', 'Forgetting no-store on sensitive endpoints and assuming private is enough at intermediary proxies'],
            interviewTip: 'Distinguish max-age (browser) from s-maxage (shared/CDN) and explain ETag revalidation versus expiry — that precision separates candidates who have actually tuned a CDN from those who have only read about it.',
            followUp: ['How do surrogate keys / cache tags enable targeted purges?', 'What is the difference between expiration and validation?', 'How would you cache personalized pages at the edge safely?'],
            seniorPerspective: 'The biggest wins I have shipped at the edge came from cache-tag-based purging: long s-maxage so the CDN absorbs almost all traffic, plus a purge-by-tag on content publish so editors see changes instantly. That combination gave us both high offload and immediate freshness, which short TTLs alone can never achieve simultaneously.',
            architectPerspective: 'Edge caching is a capacity and resilience strategy, not just a latency one. Designing cacheability into the API contract — clean separation of public vs personalized responses, surrogate keys, and stale-if-error fallbacks — lets the CDN shield the origin during traffic spikes and partial outages, which shifts the system\'s scaling ceiling from origin capacity to edge capacity.'
        },
        {
            question: 'Explain Redis eviction policies and memory management. How do you choose a maxmemory-policy and avoid surprises?',
            difficulty: 'hard',
            answer: `<p>Redis holds data in memory, so when it hits <code>maxmemory</code> it must decide what to do via <code>maxmemory-policy</code>. The choice depends on whether you use Redis purely as a cache or also for must-keep data.</p>
<ul>
<li><strong>noeviction</strong> (default): rejects writes once full (returns errors). Correct when Redis is a datastore where losing keys is unacceptable — but a full instance then breaks writes.</li>
<li><strong>allkeys-lru / allkeys-lfu</strong>: evict the least-recently/least-frequently used key across all keys. Ideal for a pure cache. <strong>LFU</strong> (frequency) often beats LRU for skewed access where a few hot keys dominate.</li>
<li><strong>volatile-lru / volatile-lfu / volatile-ttl</strong>: evict only among keys that have a TTL set, choosing by recency, frequency, or nearest expiry. Use when mixing evictable cache entries with persistent keys (only the TTL\u2019d ones get evicted).</li>
</ul>
<p>Key pitfalls: with a <strong>volatile-*</strong> policy, if no keys have a TTL, Redis behaves like noeviction and writes fail. Eviction is <strong>approximate</strong> (it samples a few keys rather than scanning all) to stay fast. Watch memory <em>fragmentation</em> and the cost of large keys/values, and monitor <code>used_memory</code>, <code>evicted_keys</code>, and hit rate. Choose <strong>allkeys-lfu</strong> for a typical hot-key cache, <strong>volatile-ttl</strong> when cache and durable data coexist, and <strong>noeviction</strong> only when Redis is the source of truth and you provision and alert on memory.</p>`,
            explanation: 'Redis memory is a small fridge. maxmemory-policy is your rule for when it is full: allkeys-LRU throws out whatever you have not touched recently, allkeys-LFU throws out what you rarely use, volatile-* only throws out items you already marked "okay to toss" (gave a TTL), and noeviction means you simply cannot fit anything new until you remove something yourself.',
            code: `# redis.conf - pure cache: cap memory and evict least-frequently-used keys
maxmemory 4gb
maxmemory-policy allkeys-lfu      # frequency-based; great for skewed hot keys
maxmemory-samples 10              # bigger sample = more accurate (approximate) eviction

# Mixed use (cache entries + persistent keys): only evict keys that have a TTL
# maxmemory-policy volatile-ttl   # but ensure cache keys actually SET a TTL,
                                  # or writes will start failing like noeviction

# Monitor: redis-cli INFO memory  -> used_memory, mem_fragmentation_ratio
#          redis-cli INFO stats   -> evicted_keys, keyspace_hits/misses`,
            language: 'bash',
            bestPractices: ['Set an explicit maxmemory and a policy matching the use case', 'Use allkeys-lfu/lru for a pure cache; volatile-* when mixing durable data', 'Always set TTLs if using a volatile-* policy', 'Monitor used_memory, evicted_keys, fragmentation, and hit rate'],
            commonMistakes: ['Leaving noeviction on a cache, so a full instance fails writes', 'volatile-* policy with no TTLs set (behaves like noeviction)', 'Assuming exact LRU/LFU — eviction is approximate by sampling', 'Ignoring large keys/fragmentation until an OOM or latency spike'],
            interviewTip: 'Tie the policy to intent: "is Redis a cache or a datastore?" allkeys-* for cache, noeviction for source-of-truth — and flag the volatile-*-with-no-TTL trap as the gotcha.',
            followUp: ['When is LFU better than LRU?', 'What happens to writes under noeviction when full?', 'Why is Redis eviction approximate rather than exact?'],
            seniorPerspective: 'The outage pattern I warn teams about is shipping Redis with its default noeviction policy while treating it as a cache: it runs fine until memory fills, then every write starts erroring and the app falls over in a way that looks nothing like "the cache is full." For caches I default to allkeys-lfu because real traffic is skewed — a small set of hot keys should survive while one-off keys get evicted — and I always wire alerts on evicted_keys and used_memory so memory pressure is visible long before it becomes an incident.',
            architectPerspective: 'The first architectural question is whether Redis is a disposable cache or a system of record, because that single decision drives eviction policy, persistence (RDB/AOF), and replication/HA design. Mixing both roles in one instance is where teams get hurt; I prefer separate instances — an evictable allkeys-lfu cache tier and a noeviction, persisted, properly-sized data tier — so the memory and durability guarantees of each are explicit rather than accidentally coupled.'
        },
        {
            question: 'How do you handle cache invalidation for a product catalog that changes frequently?',
            difficulty: 'hard',
            answer: `<p><strong>Cache invalidation for dynamic catalogs</strong> requires balancing freshness (users see current prices/availability) with performance (cache hit rate stays high). No single strategy fits all — you layer multiple approaches.</p>
            <h4>Strategies by Freshness Need:</h4>
            <ul>
                <li><strong>Event-driven invalidation</strong>: When the catalog service updates a product, it publishes a "product.updated" event. Cache subscribers invalidate or refresh that specific key. Provides near-real-time freshness with surgical precision.</li>
                <li><strong>Short TTL + stale-while-revalidate</strong>: Set TTL to 30-60 seconds. Serve stale data immediately while refreshing in the background. Users get fast responses; data is at most TTL seconds stale.</li>
                <li><strong>Write-through/write-behind</strong>: Update the cache synchronously (write-through) or asynchronously (write-behind) on every catalog write. Keeps cache always warm but adds write latency or complexity.</li>
                <li><strong>Versioned keys</strong>: Include a version or timestamp in the cache key (<code>product:123:v47</code>). On update, increment version — old entries naturally expire via TTL while new version is cached fresh.</li>
            </ul>
            <h4>Layered Approach for Product Catalog:</h4>
            <ol>
                <li>Event-driven invalidation for price/availability changes (must be fresh)</li>
                <li>Short TTL (60s) for product metadata (descriptions, images — tolerate slight staleness)</li>
                <li>Longer TTL (1hr) for category structures and navigation (changes rarely)</li>
                <li>Stale-while-revalidate for all layers (never block the user waiting for a refresh)</li>
            </ol>`,
            bestPractices: ['Classify data by freshness requirement and apply different TTLs per category', 'Use event-driven invalidation for business-critical fields (price, stock)', 'Implement stale-while-revalidate so cache misses never block user requests', 'Monitor cache hit rate and invalidation event lag as key health metrics'],
            commonMistakes: ['Single TTL for everything (either too stale for prices or too fresh for static content)', 'Invalidating the entire cache on any change (cache stampede, defeats the purpose)', 'No monitoring of invalidation lag (events delayed = stale data served longer than expected)', 'Cache-aside without invalidation (relying purely on TTL means users see stale prices for minutes)'],
            interviewTip: 'Show that you treat different data differently: "prices need event-driven invalidation within seconds, but product descriptions can tolerate a 60-second TTL." This demonstrates real-world judgment over textbook answers.',
            followUp: ['How do you prevent cache stampedes during bulk invalidation?', 'What happens if the invalidation event is lost?', 'How does CDN caching interact with application-level cache invalidation?'],
            seniorPerspective: 'For a product catalog, I tier the caching strategy by business impact: price and availability get event-driven invalidation (stale price = lost revenue or angry customers), while descriptions and images use a short TTL because slight staleness is acceptable. The key is making staleness budgets explicit per data type.',
            architectPerspective: 'Cache invalidation at scale is a distributed consistency problem. I design it as an event-driven system: catalog writes produce invalidation events, cache nodes subscribe and invalidate surgically. Combined with stale-while-revalidate for graceful degradation, this provides fresh data under normal conditions and acceptable staleness under event delivery delays.'
        },
        {
            question: 'What is the thundering herd problem and how do you prevent it?',
            difficulty: 'hard',
            answer: `<p>The <strong>thundering herd</strong> (also called cache stampede or dog-piling) occurs when a popular cache entry expires and many concurrent requests simultaneously miss the cache, all hitting the backend/database at once. This can overwhelm the origin and cascade into a broader outage.</p>
            <h4>Scenario:</h4>
            <p>A product page cached for 60 seconds gets 10,000 requests/sec. When TTL expires, all 10,000 concurrent requests miss the cache simultaneously and hit the database. The database, sized for 100 QPS (because the cache normally absorbs 99% of traffic), collapses under 10,000 sudden queries.</p>
            <h4>Prevention Strategies:</h4>
            <ul>
                <li><strong>Request coalescing (single-flight)</strong>: When a cache miss occurs, only one request fetches from the origin. All other concurrent requests for the same key wait for that single fetch to complete and share the result. Libraries: Go's <code>singleflight</code>, .NET's <code>LazyCache</code> with locking.</li>
                <li><strong>Stale-while-revalidate</strong>: Serve the stale cached value immediately while one background request refreshes the cache. Users never wait; the origin sees exactly one refresh request.</li>
                <li><strong>Probabilistic early expiration (PER)</strong>: Each request has a small probability of refreshing the cache <em>before</em> TTL expires. The probability increases as TTL approaches. Result: the cache is refreshed by a single "lucky" request before it actually expires.</li>
                <li><strong>Locking/lease</strong>: On cache miss, acquire a short-lived distributed lock for the key. Only the lock holder fetches from origin; others either wait or get a stale fallback.</li>
                <li><strong>Jittered TTL</strong>: Add random variance to TTL (e.g., 55-65 seconds instead of exactly 60). Prevents many keys from expiring at the exact same moment.</li>
            </ul>`,
            bestPractices: ['Use request coalescing as the default protection for any shared cache', 'Combine with stale-while-revalidate for hot keys (users never blocked)', 'Add TTL jitter to prevent synchronized mass expiration', 'Monitor origin QPS spikes as an early indicator of stampede behavior'],
            commonMistakes: ['No stampede protection on high-traffic keys (works fine until the key expires at peak hour)', 'Lock without timeout (if the fetcher crashes, all waiters hang indefinitely)', 'Stale-while-revalidate without a maximum stale age (serving days-old data if refresh keeps failing)', 'Assuming the problem does not apply because "we use short TTLs" (short TTLs make it worse — more frequent expiration = more frequent stampedes)'],
            interviewTip: 'Name the problem concisely (many requests hit origin simultaneously when cache expires), then present request coalescing as the primary solution and stale-while-revalidate as the complementary pattern. Mentioning probabilistic early expiration shows depth.',
            followUp: ['How does singleflight work in Go?', 'What is the XFetch algorithm?', 'How does a CDN handle thundering herd differently from an application cache?'],
            seniorPerspective: 'Every high-traffic cache I operate has request coalescing and stale-while-revalidate as standard patterns. The thundering herd has caused more outages than cache misses themselves — I have seen a single popular key expiring at the wrong moment take down a database that was otherwise healthy.',
            architectPerspective: 'Thundering herd is an emergent property of caching at scale — the cache that protects the origin becomes a synchronized trigger for overwhelming it. My architectural response is defense in depth: TTL jitter prevents mass synchronized expiration, request coalescing limits concurrent origin fetches per key, and stale-while-revalidate ensures the user path is never blocked by a cache refresh.'
        }
    ]
});
