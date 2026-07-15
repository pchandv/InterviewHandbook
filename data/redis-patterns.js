'use strict';

PageData.register('redis-patterns', {
    title: 'Redis Advanced Patterns',
    description: 'Data structures, caching strategies, distributed locks, rate limiting, and cluster operations',
    sections: [
        {
            title: 'Redis Data Structures',
            content: `<p>Redis is an in-memory data structure store. Each data type has specific use cases and performance characteristics.</p>
<ul>
<li><strong>Strings</strong> - Simple key-value, counters, binary data. O(1) get/set.</li>
<li><strong>Hashes</strong> - Object-like field-value maps. Efficient for storing objects with many fields.</li>
<li><strong>Lists</strong> - Ordered collections (linked list). Good for queues, recent items.</li>
<li><strong>Sets</strong> - Unordered unique values. Fast membership test, intersections, unions.</li>
<li><strong>Sorted Sets</strong> - Unique values with scores for ranking. Leaderboards, priority queues.</li>
<li><strong>Streams</strong> - Append-only log with consumer groups. Event streaming, activity feeds.</li>
<li><strong>HyperLogLog</strong> - Probabilistic unique counting. Massive cardinality with tiny memory.</li>
</ul>`
        },
        {
            title: 'Data Structure Selection Guide',
            mermaid: `graph TD
    A[What do you need?] -->|Key-value pairs| B[String]
    A -->|Object with fields| C[Hash]
    A -->|Ordered list / Queue| D[List]
    A -->|Unique membership| E[Set]
    A -->|Ranking / Scoring| F[Sorted Set]
    A -->|Event log with consumers| G[Stream]
    A -->|Count unique items| H[HyperLogLog]
    
    B --> B1["Cache, counters, session tokens"]
    C --> C1["User profiles, product details"]
    D --> D1["Recent activity, job queues"]
    E --> E1["Tags, online users, feature flags"]
    F --> F1["Leaderboards, rate limiting windows"]
    G --> G1["Event sourcing, activity feeds"]
    H --> H1["Unique visitors, unique searches"]`,
            content: `<p>Choose the data structure that matches your access pattern. Redis operations are O(1) or O(log n) for most data types, making them extremely fast for the right use case.</p>`
        },
        {
            title: 'Caching Patterns',
            code: `// Cache-Aside (Lazy Loading) - most common pattern
public async Task<Product> GetProductAsync(string productId)
{
    var cacheKey = $"product:{productId}";
    
    // 1. Check cache
    var cached = await _redis.StringGetAsync(cacheKey);
    if (cached.HasValue)
        return JsonSerializer.Deserialize<Product>(cached);
    
    // 2. Cache miss - load from database
    var product = await _db.Products.FindAsync(productId);
    
    // 3. Populate cache with TTL
    await _redis.StringSetAsync(cacheKey, 
        JsonSerializer.Serialize(product),
        TimeSpan.FromMinutes(30));
    
    return product;
}

// Write-Through - update cache on every write
public async Task UpdateProductAsync(Product product)
{
    await _db.SaveChangesAsync();
    await _redis.StringSetAsync($"product:{product.Id}",
        JsonSerializer.Serialize(product),
        TimeSpan.FromMinutes(30));
}

// Write-Behind (Write-Back) - write to cache, async persist to DB
// Higher performance, risk of data loss if Redis crashes before persist
public async Task IncrementViewCount(string articleId)
{
    // Immediate - fast
    await _redis.StringIncrementAsync($"views:{articleId}");
    
    // Periodic background job flushes to database
    // Every 5 minutes: read counters, batch update DB, reset counters
}

// Cache invalidation on update
public async Task InvalidateProductCache(string productId)
{
    await _redis.KeyDeleteAsync($"product:{productId}");
    await _redis.KeyDeleteAsync($"products:list:*"); // related lists
}`,
            language: 'csharp'
        },
        {
            title: 'Distributed Locks (Redlock)',
            code: `// Simple distributed lock with Redis
public class RedisDistributedLock
{
    private readonly IDatabase _redis;
    private readonly string _lockKey;
    private readonly string _lockValue;
    private readonly TimeSpan _expiry;

    public async Task<bool> AcquireAsync()
    {
        // SET key value NX EX seconds
        // NX = only set if not exists, EX = expiration
        _lockValue = Guid.NewGuid().ToString(); // unique per holder
        return await _redis.StringSetAsync(
            _lockKey, _lockValue, _expiry, When.NotExists);
    }

    public async Task<bool> ReleaseAsync()
    {
        // Lua script for atomic check-and-delete
        // Only release if we still hold the lock (value matches)
        var script = @"
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            else
                return 0
            end";
        
        var result = await _redis.ScriptEvaluateAsync(
            script, new RedisKey[] { _lockKey }, new RedisValue[] { _lockValue });
        return (int)result == 1;
    }
}

// Using StackExchange.Redis lock extension
await using (var lockObj = await _redis.LockTakeAsync(
    "payment-lock:" + orderId, 
    Environment.MachineName, 
    TimeSpan.FromSeconds(30)))
{
    if (lockObj)
    {
        await ProcessPayment(orderId);
    }
    else
    {
        throw new ConcurrencyException("Could not acquire lock");
    }
}

// Redlock algorithm (multi-node) - for high availability
// Acquire lock on majority of N independent Redis nodes
// Lock valid only if acquired on N/2+1 nodes within drift time`,
            language: 'csharp'
        },
        {
            title: 'Rate Limiting with Sliding Window',
            code: `// Sliding window rate limiter using sorted sets
public class RedisSlidingWindowRateLimiter
{
    private readonly IDatabase _redis;
    
    public async Task<bool> IsAllowedAsync(string clientId, int maxRequests, TimeSpan window)
    {
        var key = $"ratelimit:{clientId}";
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var windowStart = now - (long)window.TotalMilliseconds;
        
        // Lua script for atomic rate limit check
        var script = @"
            local key = KEYS[1]
            local now = tonumber(ARGV[1])
            local window_start = tonumber(ARGV[2])
            local max_requests = tonumber(ARGV[3])
            
            -- Remove expired entries
            redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
            
            -- Count current requests in window
            local count = redis.call('ZCARD', key)
            
            if count < max_requests then
                -- Add this request
                redis.call('ZADD', key, now, now .. ':' .. math.random())
                redis.call('EXPIRE', key, math.ceil(tonumber(ARGV[4]) / 1000))
                return 1
            else
                return 0
            end";
        
        var result = await _redis.ScriptEvaluateAsync(script,
            new RedisKey[] { key },
            new RedisValue[] { now, windowStart, maxRequests, (long)window.TotalMilliseconds });
        
        return (int)result == 1;
    }
}

// Token bucket alternative (simpler)
// INCR key, check if > limit, EXPIRE for window reset`,
            language: 'csharp'
        },
        {
            title: 'Pub/Sub and Redis Streams',
            code: `// Pub/Sub - fire-and-forget broadcast (no persistence)
// Publisher
await _subscriber.PublishAsync("notifications", JsonSerializer.Serialize(new {
    UserId = userId, Message = "Order shipped"
}));

// Subscriber
_subscriber.Subscribe("notifications", (channel, message) =>
{
    var notification = JsonSerializer.Deserialize<Notification>(message);
    DisplayNotification(notification);
});

// Redis Streams - persistent, with consumer groups (like Kafka lite)
// Add to stream
await _redis.StreamAddAsync("orders-stream", new NameValueEntry[]
{
    new("orderId", orderId),
    new("event", "placed"),
    new("timestamp", DateTime.UtcNow.ToString("O"))
});

// Create consumer group
await _redis.StreamCreateConsumerGroupAsync(
    "orders-stream", "processing-group", StreamPosition.NewMessages);

// Read as consumer in group
var entries = await _redis.StreamReadGroupAsync(
    "orders-stream", "processing-group", "consumer-1",
    count: 10);

foreach (var entry in entries)
{
    var orderId = entry.Values.First(v => v.Name == "orderId").Value;
    await ProcessOrder(orderId);
    
    // Acknowledge processing complete
    await _redis.StreamAcknowledgeAsync(
        "orders-stream", "processing-group", entry.Id);
}

// Check pending (unacknowledged) messages
var pending = await _redis.StreamPendingMessagesAsync(
    "orders-stream", "processing-group", count: 10);`,
            language: 'csharp'
        },
        {
            title: 'Redis Cluster and Persistence',
            mermaid: `graph TD
    subgraph "Redis Cluster - 3 Masters + 3 Replicas"
        M1[Master 1 - Slots 0-5460] --> R1[Replica 1]
        M2[Master 2 - Slots 5461-10922] --> R2[Replica 2]
        M3[Master 3 - Slots 10923-16383] --> R3[Replica 3]
    end
    
    subgraph "Key Routing"
        K1["user:123 → CRC16('user:123') % 16384 → Slot 8920 → Master 2"]
        K2["{order}:456 → Hash tag: CRC16('order') → Same slot"]
    end
    
    subgraph "Persistence Modes"
        P1[RDB - Point-in-time snapshots]
        P2[AOF - Append-only file, every write]
        P3[RDB + AOF - Recommended for durability]
    end`,
            content: `<p><strong>Cluster mode</strong> shards data across multiple masters using hash slots (16384 total). Keys are assigned to slots via CRC16(key) % 16384. Replicas provide failover.</p>
<p><strong>Persistence:</strong> RDB creates periodic snapshots (fast recovery, some data loss). AOF logs every write (durable but slower recovery). Use both for production: AOF for durability, RDB for fast restart.</p>
<p><strong>Eviction policies:</strong> volatile-lru (evict keys with TTL, LRU), allkeys-lru (evict any key, LRU), noeviction (return errors when full). Choose based on whether all keys should have TTLs.</p>`
        },
        {
            title: 'Lua Scripting for Atomic Operations',
            code: `// Lua scripts execute atomically - no other command runs during execution
// Use for operations that require multiple steps to be atomic

// Compare-and-swap (CAS)
var casScript = @"
    local current = redis.call('GET', KEYS[1])
    if current == ARGV[1] then
        redis.call('SET', KEYS[1], ARGV[2])
        return 1
    else
        return 0
    end";

// Atomic transfer between two keys
var transferScript = @"
    local from = tonumber(redis.call('GET', KEYS[1]))
    local amount = tonumber(ARGV[1])
    if from >= amount then
        redis.call('DECRBY', KEYS[1], amount)
        redis.call('INCRBY', KEYS[2], amount)
        return 1
    else
        return 0
    end";

var success = await _redis.ScriptEvaluateAsync(transferScript,
    new RedisKey[] { "balance:alice", "balance:bob" },
    new RedisValue[] { 100 });

// Conditional set with complex logic
var conditionalScript = @"
    local stock = tonumber(redis.call('HGET', KEYS[1], 'quantity'))
    local reserved = tonumber(redis.call('HGET', KEYS[1], 'reserved'))
    local available = stock - reserved
    local requested = tonumber(ARGV[1])
    if available >= requested then
        redis.call('HINCRBY', KEYS[1], 'reserved', requested)
        return available - requested
    else
        return -1
    end";`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'Explain cache-aside vs write-through vs write-behind caching patterns. When would you use each?',
            difficulty: 'medium',
            answer: `<p><strong>Cache-Aside (Lazy Loading):</strong></p>
<ul>
<li>Application manages cache explicitly: check cache → miss → load from DB → populate cache</li>
<li>Pros: Only caches data that is actually read, simple to implement</li>
<li>Cons: First request always slow (cache miss), potential stale data</li>
<li>Use when: Read-heavy workloads, data can tolerate short staleness</li>
</ul>
<p><strong>Write-Through:</strong></p>
<ul>
<li>Every write goes to cache AND database synchronously</li>
<li>Pros: Cache always consistent with DB, no stale reads</li>
<li>Cons: Write latency increased (two writes), cache contains data that may never be read</li>
<li>Use when: Strong consistency required, read-after-write must be immediate</li>
</ul>
<p><strong>Write-Behind (Write-Back):</strong></p>
<ul>
<li>Write to cache immediately, asynchronously flush to database</li>
<li>Pros: Fastest writes, can batch DB updates, absorbs write spikes</li>
<li>Cons: Risk of data loss if cache crashes before flush, complex consistency</li>
<li>Use when: Write-heavy with tolerance for brief inconsistency (view counters, analytics)</li>
</ul>`,
            interviewTip: 'Draw the read/write flow for each pattern. Show you understand the consistency vs performance tradeoff in each case.',
            followUp: ['How do you handle cache stampede (thundering herd)?', 'What about read-through caching?'],
            seniorPerspective: 'Cache-aside is the default choice for 80% of use cases. Write-through adds complexity for consistency-sensitive paths. Write-behind is reserved for high-write scenarios where you accept the risk.',
            architectPerspective: 'Caching strategy should match your consistency requirements per use case. User sessions need write-through. View counters can use write-behind. Product catalog uses cache-aside with TTL.'
        },
        {
            question: 'How does the Redlock algorithm work for distributed locks? What are its limitations?',
            difficulty: 'hard',
            answer: `<p><strong>Redlock</strong> (by Redis creator Antirez) achieves distributed locking across multiple independent Redis nodes.</p>
<p><strong>Algorithm:</strong></p>
<ol>
<li>Get current time in milliseconds</li>
<li>Try to acquire lock on N independent Redis instances (SET NX with TTL)</li>
<li>Lock acquired if: majority (N/2+1) instances grant it AND total acquisition time < lock TTL</li>
<li>Effective lock time = TTL - acquisition time - clock drift</li>
<li>If lock fails, release on all instances (even those that granted it)</li>
</ol>
<p><strong>Release:</strong> Use Lua script to atomically check value matches before deleting (prevents releasing someone else's lock).</p>
<p><strong>Limitations (famously critiqued by Martin Kleppmann):</strong></p>
<ul>
<li><strong>Clock drift</strong> - Relies on approximately synchronized clocks. NTP jumps can break safety.</li>
<li><strong>GC pauses</strong> - Client may pause (GC) while holding lock, lock expires, another client acquires, first client resumes thinking it still holds the lock.</li>
<li><strong>Network partitions</strong> - Split-brain scenarios where two clients believe they hold the lock.</li>
</ul>
<p><strong>Mitigation:</strong> Use fencing tokens (monotonically increasing token returned with lock, resource rejects stale tokens).</p>`,
            interviewTip: 'Mention the Kleppmann-Antirez debate. Shows you understand the theoretical limitations and real-world considerations. Fencing tokens are the key safety mechanism.',
            followUp: ['What is a fencing token?', 'When is a simple single-node lock sufficient vs Redlock?'],
            seniorPerspective: 'For most applications, a single Redis instance lock with proper TTL is sufficient. Redlock adds complexity for marginal safety. If you need strong consistency guarantees, use ZooKeeper or etcd instead.',
            architectPerspective: 'Distributed locks are a code smell in many architectures. Consider whether you can redesign to use optimistic concurrency, partitioning, or leader election instead of distributed mutual exclusion.'
        },
        {
            question: 'How would you implement rate limiting with Redis? Compare fixed window vs sliding window.',
            difficulty: 'medium',
            answer: `<p><strong>Fixed Window:</strong></p>
<ul>
<li>Count requests per fixed time window (e.g., per minute starting at :00)</li>
<li>Simple: INCR key, EXPIRE key 60. Check if count > limit.</li>
<li>Problem: burst at window boundary (59.9s + 0.1s can get 2x limit)</li>
</ul>
<p><strong>Sliding Window (Log):</strong></p>
<ul>
<li>Track timestamps of all requests in a sorted set</li>
<li>Remove entries older than window, count remaining</li>
<li>Accurate but uses more memory (stores all request timestamps)</li>
</ul>
<p><strong>Sliding Window (Counter):</strong></p>
<ul>
<li>Weighted average of current and previous fixed windows</li>
<li>Less memory than log, more accurate than fixed window</li>
</ul>
<p><strong>Token Bucket:</strong></p>
<ul>
<li>Tokens added at fixed rate, each request consumes one token</li>
<li>Allows bursts up to bucket size, smooths over time</li>
<li>Best for APIs that want to allow brief bursts</li>
</ul>
<pre><code>// Fixed window - simple but has boundary problem
var key = $"ratelimit:{clientId}:{DateTime.UtcNow:yyyyMMddHHmm}";
var count = await _redis.StringIncrementAsync(key);
if (count == 1) await _redis.KeyExpireAsync(key, TimeSpan.FromMinutes(1));
return count <= maxRequests;</code></pre>`,
            interviewTip: 'Explain the boundary problem with fixed windows. Then present sliding window as the solution. Token bucket is good for APIs allowing bursts.',
            followUp: ['How do you handle rate limiting across multiple servers?', 'What about rate limiting by different dimensions (IP, user, API key)?'],
            seniorPerspective: 'Use existing libraries (AspNetCoreRateLimit, or built-in .NET 7 rate limiting middleware) rather than rolling your own. Custom Redis rate limiters are needed only for distributed multi-service scenarios.',
            architectPerspective: 'Rate limiting should be applied at multiple layers: API gateway (global), service level (per-tenant), and resource level (database connection pools). Each layer has different limits and windows.'
        },
        {
            question: 'What is cache stampede and how do you prevent it?',
            difficulty: 'hard',
            answer: `<p><strong>Cache stampede</strong> (thundering herd) occurs when a popular cache key expires and many concurrent requests simultaneously hit the database to rebuild it.</p>
<p><strong>Prevention strategies:</strong></p>
<ul>
<li><strong>Locking</strong> - First request acquires a lock and rebuilds cache. Others wait or get stale data.</li>
<li><strong>Probabilistic early expiration</strong> - Randomly refresh before TTL expires (XFetch algorithm). Each request has small probability of refreshing early.</li>
<li><strong>Background refresh</strong> - Never let cache expire. Background job refreshes before TTL.</li>
<li><strong>Stale-while-revalidate</strong> - Serve stale data immediately, refresh asynchronously.</li>
</ul>
<pre><code>// Lock-based stampede prevention
public async Task&lt;T&gt; GetWithLock&lt;T&gt;(string key, Func&lt;Task&lt;T&gt;&gt; factory)
{
    var cached = await _redis.StringGetAsync(key);
    if (cached.HasValue) return Deserialize&lt;T&gt;(cached);
    
    var lockKey = $"lock:{key}";
    var acquired = await _redis.StringSetAsync(lockKey, "1", TimeSpan.FromSeconds(10), When.NotExists);
    
    if (acquired)
    {
        try
        {
            var value = await factory(); // rebuild cache
            await _redis.StringSetAsync(key, Serialize(value), TimeSpan.FromMinutes(30));
            return value;
        }
        finally
        {
            await _redis.KeyDeleteAsync(lockKey);
        }
    }
    
    // Could not get lock - wait and retry, or return stale
    await Task.Delay(100);
    return await GetWithLock&lt;T&gt;(key, factory); // retry
}</code></pre>`,
            interviewTip: 'Name the problem before describing solutions. Show you understand WHY it happens (high traffic + expired popular key = N concurrent DB queries for the same data).',
            followUp: ['What is the XFetch algorithm?', 'How does stale-while-revalidate work in practice?'],
            seniorPerspective: 'For most systems, staggered TTLs (add random jitter to expiration) combined with background refresh is sufficient. Full lock-based stampede prevention is needed only for extremely hot keys.',
            architectPerspective: 'Cache stampede is a symptom of coupling between cache lifetime and traffic patterns. Decouple by using background refresh (cache never truly expires) for critical hot paths.'
        },
        {
            question: 'When would you use Redis Streams over Pub/Sub? Compare with Kafka.',
            difficulty: 'medium',
            answer: `<p><strong>Redis Pub/Sub:</strong></p>
<ul>
<li>Fire-and-forget broadcast - no persistence</li>
<li>If subscriber is disconnected, messages are lost</li>
<li>No consumer groups, no acknowledgment</li>
<li>Use for: real-time notifications where loss is acceptable</li>
</ul>
<p><strong>Redis Streams:</strong></p>
<ul>
<li>Persistent, append-only log with consumer groups</li>
<li>Messages persist until explicitly trimmed</li>
<li>Consumer groups with per-consumer acknowledgment</li>
<li>Pending entry list (PEL) tracks unacknowledged messages</li>
<li>Use for: task queues, event logs, activity feeds</li>
</ul>
<p><strong>Redis Streams vs Kafka:</strong></p>
<ul>
<li>Kafka: designed for massive throughput (millions/sec), multi-datacenter replication, long retention</li>
<li>Redis Streams: lighter weight, lower latency, fits when Redis is already in your stack and volume is moderate</li>
<li>Kafka: horizontal scaling via partitions across brokers</li>
<li>Redis Streams: limited by single-server memory (or cluster shard)</li>
</ul>
<p>Use Redis Streams when: moderate throughput, Redis already deployed, need simple consumer groups without Kafka operational complexity.</p>`,
            interviewTip: 'Position Redis Streams as "Kafka lite" - same concepts (consumer groups, offsets) but simpler operations and lower throughput. Good for right-sizing.',
            followUp: ['How do you handle pending messages in Redis Streams?', 'What is XAUTOCLAIM for?'],
            seniorPerspective: 'Redis Streams are underused. Many teams deploy Kafka when Redis Streams would suffice (< 100K messages/sec, Redis already in infrastructure). Right-size your infrastructure.',
            architectPerspective: 'The choice between Redis Streams and Kafka is about scale and durability requirements. Redis Streams for intra-service communication, Kafka for inter-service event backbone.'
        },
        {
            question: 'Explain Redis eviction policies. How do you choose the right one?',
            difficulty: 'easy',
            answer: `<p>Eviction policies determine what Redis does when memory is full and a new write arrives.</p>
<p><strong>Policies:</strong></p>
<ul>
<li><strong>noeviction</strong> - Return error on writes. Use when data loss is never acceptable (sessions, locks).</li>
<li><strong>volatile-lru</strong> - Evict least recently used keys that have a TTL set. Default for cache use cases.</li>
<li><strong>allkeys-lru</strong> - Evict any key using LRU. Use when all keys are cache-able (no persistent data).</li>
<li><strong>volatile-ttl</strong> - Evict keys closest to expiration. Prioritizes keeping longer-lived data.</li>
<li><strong>volatile-random</strong> / <strong>allkeys-random</strong> - Random eviction. Simpler but less optimal.</li>
<li><strong>volatile-lfu</strong> / <strong>allkeys-lfu</strong> - Least Frequently Used. Better for access patterns with hot keys.</li>
</ul>
<p><strong>Decision:</strong></p>
<ul>
<li>Pure cache (all data rebuildable): <code>allkeys-lru</code> or <code>allkeys-lfu</code></li>
<li>Mixed (some data has TTL, some is persistent): <code>volatile-lru</code></li>
<li>Critical data that must not be evicted: <code>noeviction</code></li>
<li>Workload with very hot keys: <code>*-lfu</code> variants</li>
</ul>`,
            interviewTip: 'Know the difference between volatile (only evict keys with TTL) and allkeys (evict anything). Explain why LFU is better than LRU for skewed access patterns.',
            followUp: ['What is the difference between LRU and LFU?', 'How does Redis approximate LRU?'],
            seniorPerspective: 'Monitor eviction rate. High eviction means your dataset exceeds memory - either add memory, reduce data, or accept that cold data will be re-fetched from the database.',
            architectPerspective: 'Memory planning: know your key count, average key size, and growth rate. Redis memory usage includes overhead per key (pointers, metadata). Plan for 2-3x raw data size.'
        },
        {
            question: 'How would you use Redis sorted sets for a real-time leaderboard?',
            difficulty: 'easy',
            answer: `<p>Sorted sets are perfect for leaderboards: each member has a score, and Redis maintains order automatically.</p>
<pre><code>// Add/update score - O(log N)
await _redis.SortedSetAddAsync("leaderboard:weekly", userId, score);

// Increment score atomically
await _redis.SortedSetIncrementAsync("leaderboard:weekly", userId, points);

// Get rank (0-indexed, highest score = rank 0)
var rank = await _redis.SortedSetRankAsync("leaderboard:weekly", userId, Order.Descending);

// Get top 10
var top10 = await _redis.SortedSetRangeByRankWithScoresAsync(
    "leaderboard:weekly", 0, 9, Order.Descending);

// Get players around a specific player (context)
var userRank = await _redis.SortedSetRankAsync("leaderboard:weekly", userId, Order.Descending);
var nearby = await _redis.SortedSetRangeByRankWithScoresAsync(
    "leaderboard:weekly", userRank.Value - 5, userRank.Value + 5, Order.Descending);

// Total player count
var total = await _redis.SortedSetLengthAsync("leaderboard:weekly");

// Weekly reset via key rotation
// Current: leaderboard:weekly:2024-01
// Archive: leaderboard:archive:2024-01
await _redis.KeyRenameAsync("leaderboard:weekly:2024-01", "leaderboard:archive:2024-01");</code></pre>
<p>All operations are O(log N) - even with millions of players, rank lookup and updates are sub-millisecond.</p>`,
            interviewTip: 'Highlight the O(log N) complexity and the fact that Redis maintains sort order automatically. This is dramatically more efficient than SQL ORDER BY on every request.',
            followUp: ['How would you handle millions of players efficiently?', 'How do you handle ties in scores?'],
            seniorPerspective: 'For very large leaderboards (100M+ members), consider sharding by score range or using approximate rankings with periodic full recalculation.',
            architectPerspective: 'Sorted sets combine storage and indexing in one structure. In SQL, you would need a table + index + query optimizer. Redis gives you O(log N) ranked access as a primitive.'
        },
        {
            question: 'How does Redis Cluster handle data distribution and failover?',
            difficulty: 'advanced',
            answer: `<p><strong>Data distribution:</strong></p>
<ul>
<li>Redis Cluster uses 16,384 hash slots</li>
<li>Each master owns a subset of slots</li>
<li>Key assignment: <code>CRC16(key) % 16384</code> → slot number → owning master</li>
<li>Hash tags: <code>{user:123}:profile</code> and <code>{user:123}:settings</code> route to same slot (CRC16 computed on content within {})</li>
</ul>
<p><strong>Failover:</strong></p>
<ol>
<li>Each master has one or more replicas</li>
<li>Nodes gossip via cluster bus (heartbeat every 1s)</li>
<li>If majority of masters mark a node as unreachable (PFAIL → FAIL), failover triggers</li>
<li>Replica of failed master promotes itself to master</li>
<li>Clients receive MOVED redirect and update slot mapping</li>
</ol>
<p><strong>Limitations:</strong></p>
<ul>
<li>Multi-key operations only work if all keys are on the same slot (use hash tags)</li>
<li>Lua scripts must access keys on same slot</li>
<li>Transactions (MULTI/EXEC) limited to single slot</li>
<li>Database selection (SELECT) not supported (only db 0)</li>
</ul>
<p><strong>Scaling:</strong> Resharding (moving slots between nodes) can be done live without downtime.</p>`,
            interviewTip: 'The hash tag trick is essential knowledge. Explain that multi-key operations fail across slots unless you use hash tags to co-locate related keys.',
            followUp: ['What happens during a resharding operation?', 'How do you handle the MOVED and ASK redirections?'],
            seniorPerspective: 'Design your key schema with clustering in mind from day one. If you need transactions across keys, they must share a hash tag. This affects your data modeling decisions.',
            architectPerspective: 'Redis Cluster trades some flexibility (cross-slot operations) for horizontal scaling. For most caching use cases this is fine. For transactional workloads across keys, consider single-instance with Sentinel for HA instead.'
        },
        {
            question: 'Design a session store using Redis that handles millions of concurrent users.',
            difficulty: 'expert',
            answer: `<p><strong>Design decisions:</strong></p>
<pre><code>// Key structure: session:{sessionId} → Hash
// Hash fields: userId, createdAt, lastAccess, ip, userAgent, data

// Create session
var sessionId = Guid.NewGuid().ToString("N");
await _redis.HashSetAsync($"session:{sessionId}", new HashEntry[]
{
    new("userId", userId),
    new("createdAt", DateTime.UtcNow.Ticks.ToString()),
    new("lastAccess", DateTime.UtcNow.Ticks.ToString()),
    new("data", JsonSerializer.Serialize(sessionData))
});
await _redis.KeyExpireAsync($"session:{sessionId}", TimeSpan.FromHours(24));

// Secondary index: user → sessions (for "log out all devices")
await _redis.SetAddAsync($"user-sessions:{userId}", sessionId);

// Access session (refresh TTL on access)
var session = await _redis.HashGetAllAsync($"session:{sessionId}");
if (session.Length > 0)
{
    await _redis.HashSetAsync($"session:{sessionId}",
        new HashEntry[] { new("lastAccess", DateTime.UtcNow.Ticks.ToString()) });
    await _redis.KeyExpireAsync($"session:{sessionId}", TimeSpan.FromHours(24)); // sliding
}

// Invalidate all sessions for a user
var sessions = await _redis.SetMembersAsync($"user-sessions:{userId}");
foreach (var sid in sessions)
    await _redis.KeyDeleteAsync($"session:{sid}");
await _redis.KeyDeleteAsync($"user-sessions:{userId}");</code></pre>
<p><strong>Scaling considerations:</strong></p>
<ul>
<li><strong>Memory</strong> - 1M sessions x 1KB average = ~1GB. Redis handles this easily.</li>
<li><strong>Cluster</strong> - Sessions naturally distribute (random session IDs spread across hash slots)</li>
<li><strong>TTL</strong> - Sliding expiration (refresh on access) or absolute (fixed duration)</li>
<li><strong>Serialization</strong> - Keep session data small. Store references (userId) not full objects.</li>
<li><strong>Eviction</strong> - Use volatile-lru; sessions have TTL so they are evictable under memory pressure</li>
</ul>`,
            interviewTip: 'Cover the secondary index for "log out all devices" - this is a real production requirement that shows you think about operational scenarios beyond happy path.',
            followUp: ['How do you handle session store failover?', 'How do you migrate sessions when adding cluster nodes?'],
            seniorPerspective: 'Keep session data minimal. Store only identifiers and let the application load full user data from the database. This keeps memory usage predictable and sessions small.',
            architectPerspective: 'For millions of concurrent sessions, Redis Cluster with read replicas is the standard architecture. Consider sticky sessions at the load balancer to reduce cross-node reads, with fallback to any-node reads.'
        }
    ]
});
