PageData.register('concurrency-patterns', {
    title: 'Concurrency Patterns in .NET',
    description: 'Advanced concurrency patterns beyond async/await: Channel<T>, SemaphoreSlim, lock-free programming, producer-consumer pipelines, and thread-safe collection patterns.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>Async/await handles I/O concurrency. But real applications also need CPU parallelism, bounded concurrency, thread-safe shared state, and producer-consumer pipelines. This topic covers the patterns that go beyond basic async — the ones that distinguish senior engineers in interviews.</p><p>Key distinction: <strong>concurrency</strong> = multiple tasks in progress (interleaved). <strong>Parallelism</strong> = multiple tasks executing simultaneously (multi-core). Most patterns here address concurrency; TPL addresses parallelism.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<ul><li><strong>Thread Safety</strong> — Code that behaves correctly when accessed from multiple threads simultaneously</li><li><strong>Critical Section</strong> — Code region where shared state is accessed; must be protected</li><li><strong>Lock (Monitor)</strong> — Mutual exclusion; only one thread enters at a time</li><li><strong>SemaphoreSlim</strong> — Limits concurrent access to N (async-compatible)</li><li><strong>Interlocked</strong> — Atomic operations without locks (fastest synchronization)</li><li><strong>Channel&lt;T&gt;</strong> — Thread-safe async producer-consumer queue with backpressure</li><li><strong>ConcurrentDictionary</strong> — Thread-safe dictionary with atomic operations</li><li><strong>ReaderWriterLockSlim</strong> — Many concurrent readers OR one exclusive writer</li><li><strong>Volatile</strong> — Prevents compiler/CPU instruction reordering (NOT atomicity)</li><li><strong>SpinLock</strong> — Busy-wait lock for very short critical sections (avoid in most cases)</li></ul>`
        },
        {
            title: 'How It Works',
            content: `<p>Choosing the right synchronization primitive depends on the access pattern:</p>`,
            mermaid: `flowchart TD
    A[Need Thread Safety?] -->|Yes| B{Access Pattern?}
    B -->|Single counter/flag| C[Interlocked]
    B -->|Short critical section| D[lock/Monitor]
    B -->|Many readers, few writers| E[ReaderWriterLockSlim]
    B -->|Limit concurrent access to N| F[SemaphoreSlim]
    B -->|Producer-consumer pipeline| G[Channel T]
    B -->|Thread-safe collection| H[ConcurrentDictionary]
    B -->|Async throttling| I[SemaphoreSlim + async]
    A -->|No shared state| J[No synchronization needed]`
        },
        {
            title: 'Visual Diagram',
            content: `<p>Producer-Consumer pipeline with Channel&lt;T&gt; and bounded concurrency:</p>`,
            mermaid: `flowchart LR
    subgraph Producers
        P1[Producer 1]
        P2[Producer 2]
    end
    subgraph Channel["Channel T - Bounded Buffer"]
        Q[Queue capacity: 100]
    end
    subgraph Consumers
        C1[Consumer 1]
        C2[Consumer 2]
        C3[Consumer 3]
    end
    P1 -->|WriteAsync| Q
    P2 -->|WriteAsync| Q
    Q -->|ReadAllAsync| C1
    Q -->|ReadAllAsync| C2
    Q -->|ReadAllAsync| C3
    Q -.->|Backpressure when full| P1
    Q -.->|Backpressure when full| P2`
        },
        {
            title: 'Implementation',
            content: `<p>Complete patterns with production-ready code:</p>`,
            code: `// ═══ Channel<T> — Producer-Consumer Pipeline ═══
public class OrderProcessor
{
    private readonly Channel<Order> _channel;
    
    public OrderProcessor(int capacity = 100)
    {
        _channel = Channel.CreateBounded<Order>(new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.Wait, // Backpressure
            SingleReader = false,
            SingleWriter = false
        });
    }

    // Producer: enqueue orders
    public async ValueTask EnqueueAsync(Order order, CancellationToken ct)
    {
        await _channel.Writer.WriteAsync(order, ct);
    }

    // Start N consumer workers
    public Task StartConsumers(int workerCount, CancellationToken ct)
    {
        var workers = Enumerable.Range(0, workerCount)
            .Select(_ => ProcessAsync(ct));
        return Task.WhenAll(workers);
    }

    private async Task ProcessAsync(CancellationToken ct)
    {
        await foreach (var order in _channel.Reader.ReadAllAsync(ct))
        {
            await HandleOrderAsync(order, ct);
        }
    }

    public void Complete() => _channel.Writer.Complete();
}

// ═══ SemaphoreSlim — Bounded Concurrency ═══
public class ThrottledHttpClient
{
    private readonly HttpClient _http;
    private readonly SemaphoreSlim _semaphore;

    public ThrottledHttpClient(HttpClient http, int maxConcurrent = 10)
    {
        _http = http;
        _semaphore = new SemaphoreSlim(maxConcurrent);
    }

    public async Task<string> GetAsync(string url, CancellationToken ct)
    {
        await _semaphore.WaitAsync(ct);
        try
        {
            return await _http.GetStringAsync(url, ct);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<T[]> GetManyAsync<T>(IEnumerable<string> urls, CancellationToken ct)
    {
        var tasks = urls.Select(async url =>
        {
            await _semaphore.WaitAsync(ct);
            try
            {
                var json = await _http.GetStringAsync(url, ct);
                return JsonSerializer.Deserialize<T>(json)!;
            }
            finally { _semaphore.Release(); }
        });
        return await Task.WhenAll(tasks);
    }
}

// ═══ Interlocked — Lock-Free Counter ═══
public class MetricsCounter
{
    private long _requestCount;
    private long _errorCount;
    private long _totalLatencyMs;

    public void RecordRequest(long latencyMs, bool isError)
    {
        Interlocked.Increment(ref _requestCount);
        Interlocked.Add(ref _totalLatencyMs, latencyMs);
        if (isError) Interlocked.Increment(ref _errorCount);
    }

    public (long Requests, long Errors, double AvgLatency) GetSnapshot()
    {
        var reqs = Interlocked.Read(ref _requestCount);
        var errs = Interlocked.Read(ref _errorCount);
        var lat = Interlocked.Read(ref _totalLatencyMs);
        return (reqs, errs, reqs > 0 ? (double)lat / reqs : 0);
    }
}

// ═══ ReaderWriterLockSlim — Read-Heavy Cache ═══
public class ThreadSafeCache<TKey, TValue> where TKey : notnull
{
    private readonly ReaderWriterLockSlim _lock = new();
    private readonly Dictionary<TKey, TValue> _cache = new();

    public bool TryGet(TKey key, out TValue value)
    {
        _lock.EnterReadLock();
        try { return _cache.TryGetValue(key, out value!); }
        finally { _lock.ExitReadLock(); }
    }

    public void Set(TKey key, TValue value)
    {
        _lock.EnterWriteLock();
        try { _cache[key] = value; }
        finally { _lock.ExitWriteLock(); }
    }

    public TValue GetOrAdd(TKey key, Func<TKey, TValue> factory)
    {
        _lock.EnterUpgradeableReadLock();
        try
        {
            if (_cache.TryGetValue(key, out var existing))
                return existing;
            _lock.EnterWriteLock();
            try
            {
                var value = factory(key);
                _cache[key] = value;
                return value;
            }
            finally { _lock.ExitWriteLock(); }
        }
        finally { _lock.ExitUpgradeableReadLock(); }
    }
}

// ═══ ConcurrentDictionary — Atomic Operations ═══
public class ConnectionPool
{
    private readonly ConcurrentDictionary<string, Lazy<Task<Connection>>> _pool = new();

    public Task<Connection> GetOrCreateAsync(string endpoint)
    {
        // Lazy ensures factory runs exactly once even under contention
        var lazy = _pool.GetOrAdd(endpoint, 
            ep => new Lazy<Task<Connection>>(() => ConnectAsync(ep)));
        return lazy.Value;
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Best Practices',
            content: `<ul><li><strong>Prefer immutability</strong> — Immutable objects are inherently thread-safe; no locks needed</li><li><strong>Use the narrowest lock scope</strong> — Hold locks for the shortest possible duration</li><li><strong>Prefer SemaphoreSlim over lock for async</strong> — lock cannot be held across await points</li><li><strong>Use Channel&lt;T&gt; for pipelines</strong> — Built-in backpressure, async-native, no manual synchronization</li><li><strong>Interlocked for simple counters</strong> — 10x faster than lock for single-variable updates</li><li><strong>ConcurrentDictionary with Lazy&lt;T&gt;</strong> — Prevents duplicate factory execution under contention</li><li><strong>Always release in finally</strong> — Semaphore, ReaderWriterLock must be released even on exception</li><li><strong>Avoid nested locks</strong> — Deadlock risk; if unavoidable, enforce consistent lock ordering</li><li><strong>Test with ThreadPool stress</strong> — Concurrency bugs only appear under load; use stress tests</li><li><strong>Prefer higher-level abstractions</strong> — Channel > manual lock + queue; Parallel.ForEachAsync > manual semaphore</li></ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul><li><strong>Using lock with async</strong> — You cannot await inside a lock statement; use SemaphoreSlim(1) instead</li><li><strong>Forgetting to release SemaphoreSlim</strong> — Always use try/finally; a missed Release causes gradual thread starvation</li><li><strong>ConcurrentDictionary GetOrAdd with side effects</strong> — The factory may run multiple times under contention; wrap in Lazy&lt;T&gt;</li><li><strong>Locking on this or Type</strong> — External code might lock on the same reference; always lock on a private readonly object</li><li><strong>Double-checked locking without volatile</strong> — CPU may reorder writes; the pattern is broken without volatile or Lazy&lt;T&gt;</li><li><strong>Unbounded Channel</strong> — Channel.CreateUnbounded has no backpressure; producers can OOM the process</li><li><strong>Task.Run in a loop without throttling</strong> — Creates thousands of tasks that overwhelm the ThreadPool</li><li><strong>Sharing mutable state in Parallel.ForEach</strong> — Each iteration must be independent or use Interlocked/lock</li></ul>`
        },
        {
            title: 'Comparison',
            content: `<p>When to use which synchronization primitive:</p>`,
            table: {
                headers: ['Primitive', 'Use Case', 'Async?', 'Perf', 'Complexity'],
                rows: [
                    ['lock (Monitor)', 'Short critical sections, simple mutual exclusion', 'No', 'Fast', 'Low'],
                    ['SemaphoreSlim', 'Limit N concurrent, async throttling', 'Yes', 'Good', 'Low'],
                    ['Interlocked', 'Counters, flags, CAS patterns', 'N/A', 'Fastest', 'Medium'],
                    ['Channel<T>', 'Producer-consumer pipelines with backpressure', 'Yes', 'Excellent', 'Low'],
                    ['ReaderWriterLockSlim', 'Many readers, rare writers (caches)', 'No', 'Good for reads', 'Medium'],
                    ['ConcurrentDictionary', 'Thread-safe key-value with atomic ops', 'N/A', 'Good', 'Low'],
                    ['SpinLock', 'Very short locks, no contention expected', 'No', 'Best for 0 contention', 'High'],
                    ['Mutex', 'Cross-process synchronization', 'No', 'Slow (kernel)', 'Medium']
                ]
            }
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul><li><strong>lock vs SemaphoreSlim</strong> — Do you know lock cannot be used with async?</li><li><strong>Channel&lt;T&gt; knowledge</strong> — Shows you know modern .NET beyond basic async</li><li><strong>Interlocked awareness</strong> — Can you use CAS (CompareExchange) for lock-free patterns?</li><li><strong>Deadlock prevention</strong> — Can you identify and prevent deadlock scenarios?</li><li><strong>Real experience</strong> — Have you built producer-consumer pipelines or throttled APIs?</li><li><strong>Trade-off thinking</strong> — When is lock fine vs when do you need something more?</li></ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul><li>lock is for short synchronous critical sections; SemaphoreSlim for async</li><li>Channel&lt;T&gt; replaces manual lock + queue for producer-consumer</li><li>Interlocked is 10x faster than lock for simple counters</li><li>ConcurrentDictionary + Lazy prevents duplicate work under contention</li><li>Always release synchronization primitives in finally blocks</li><li>Prefer immutability and message-passing over shared mutable state</li><li>Test concurrency under realistic load — bugs hide at low traffic</li><li>Bounded everything — unbounded queues and unlimited parallelism cause OOM/starvation</li></ul>`
        }
    ],
    questions: [
        {
            id: 'conc-q1',
            level: 'junior',
            title: 'What is the difference between lock and SemaphoreSlim in .NET?',
            answer: `<p><strong>lock (Monitor)</strong> — Mutual exclusion for synchronous code. Only one thread can enter the locked section at a time. Cannot be used across await points (compiler error). Automatically released when the block exits.</p><p><strong>SemaphoreSlim</strong> — Limits concurrent access to N slots. Supports async via WaitAsync(). Can throttle to any number (not just 1). Must be manually released in a finally block.</p><p>Use lock for simple, short synchronous critical sections. Use SemaphoreSlim when you need async compatibility or want to allow N concurrent accessors.</p>`
        },
        {
            id: 'conc-q2',
            level: 'junior',
            title: 'Why should you never lock on this or a public object?',
            answer: `<p>Locking on <code>this</code> or a public object means external code can also lock on the same reference, causing unexpected deadlocks:</p><pre><code>// BAD: external code can deadlock you
public class MyService {
    public void DoWork() { lock (this) { ... } }
}
// Elsewhere: lock (myService) { myService.DoWork(); } // DEADLOCK!

// GOOD: private dedicated lock object
private readonly object _lock = new();
public void DoWork() { lock (_lock) { ... } }</code></pre><p>Rule: always lock on a <code>private readonly object</code> that only your class can access.</p>`
        },
        {
            id: 'conc-q3',
            level: 'mid',
            title: 'How does Channel&lt;T&gt; provide backpressure in a producer-consumer pattern?',
            answer: `<p><code>Channel.CreateBounded&lt;T&gt;(capacity)</code> creates a fixed-size buffer. When the buffer is full:</p><ul><li><code>BoundedChannelFullMode.Wait</code> — WriteAsync blocks the producer until space is available (backpressure)</li><li><code>BoundedChannelFullMode.DropOldest</code> — Oldest item is discarded to make room</li><li><code>BoundedChannelFullMode.DropNewest</code> — New item is discarded</li><li><code>BoundedChannelFullMode.DropWrite</code> — Write fails silently</li></ul><p>This prevents producers from overwhelming consumers and causing unbounded memory growth. The bounded capacity acts as a buffer between different processing speeds.</p><p>Compare to unbounded: <code>Channel.CreateUnbounded&lt;T&gt;()</code> never blocks writers but can OOM if consumers cannot keep up.</p>`
        },
        {
            id: 'conc-q4',
            level: 'mid',
            title: 'What is the Interlocked.CompareExchange pattern and when would you use it?',
            answer: `<p><code>Interlocked.CompareExchange</code> (CAS — Compare-And-Swap) is the foundation of lock-free programming. It atomically: reads the current value, compares it to an expected value, and only writes the new value if the comparison matches.</p><pre><code>// Lock-free "update if greater" pattern
int current;
do {
    current = _maxValue;
    if (newValue <= current) return; // No update needed
} while (Interlocked.CompareExchange(ref _maxValue, newValue, current) != current);
// If another thread changed _maxValue between read and CAS, loop retries</code></pre><p>Use when: simple atomic state transitions (counters, flags, max/min tracking) where lock overhead is unacceptable. Avoid when: the retry loop body is expensive or contention is very high (spinning wastes CPU).</p>`
        },
        {
            id: 'conc-q5',
            level: 'mid',
            title: 'Why can you not use lock with async/await? What do you use instead?',
            answer: `<p>The <code>lock</code> statement uses thread affinity — the same thread must enter and exit the lock. But <code>await</code> may resume on a different thread, which would mean a different thread tries to exit the lock it did not enter. The compiler prevents this with a compile error.</p><p><strong>Solution:</strong> Use <code>SemaphoreSlim(1, 1)</code> as an async-compatible mutex:</p><pre><code>private readonly SemaphoreSlim _mutex = new(1, 1);

public async Task DoWorkAsync()
{
    await _mutex.WaitAsync();
    try
    {
        await SomeAsyncOperation(); // Safe: no thread affinity requirement
    }
    finally
    {
        _mutex.Release();
    }
}</code></pre><p>SemaphoreSlim has no thread affinity — any thread can release it, which is compatible with async continuations.</p>`
        },
        {
            id: 'conc-q6',
            level: 'senior',
            title: 'How would you implement a rate limiter using SemaphoreSlim and a timer?',
            answer: `<p>A sliding-window rate limiter using SemaphoreSlim for token-bucket semantics:</p><pre><code>public class RateLimiter : IDisposable
{
    private readonly SemaphoreSlim _semaphore;
    private readonly Timer _timer;

    public RateLimiter(int requestsPerSecond)
    {
        _semaphore = new SemaphoreSlim(requestsPerSecond, requestsPerSecond);
        // Replenish tokens every second
        _timer = new Timer(_ =>
        {
            int toRelease = requestsPerSecond - _semaphore.CurrentCount;
            if (toRelease > 0) _semaphore.Release(toRelease);
        }, null, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(1));
    }

    public async Task&lt;T&gt; ExecuteAsync&lt;T&gt;(Func&lt;Task&lt;T&gt;&gt; action, CancellationToken ct)
    {
        await _semaphore.WaitAsync(ct); // Wait for available token
        return await action();
        // Token consumed; replenished by timer
    }

    public void Dispose() { _timer.Dispose(); _semaphore.Dispose(); }
}</code></pre><p>This implements token-bucket: N tokens per second, each request consumes one. If tokens are exhausted, requests wait until the timer replenishes.</p>`
        },
        {
            id: 'conc-q7',
            level: 'senior',
            title: 'What is the difference between ConcurrentDictionary.GetOrAdd and AddOrUpdate? When does the factory run multiple times?',
            answer: `<p><code>GetOrAdd(key, factory)</code> — Returns existing value or creates a new one. The factory MAY run multiple times under contention (multiple threads see key missing simultaneously), but only one result is stored.</p><p><code>AddOrUpdate(key, addFactory, updateFactory)</code> — Adds if missing, updates if present. Both factories may run multiple times.</p><p><strong>Problem:</strong> If the factory has side effects (DB call, HTTP request), duplicate execution wastes resources.</p><p><strong>Fix:</strong> Wrap in <code>Lazy&lt;T&gt;</code>:</p><pre><code>var cache = new ConcurrentDictionary&lt;string, Lazy&lt;Task&lt;Data&gt;&gt;&gt;();
var lazy = cache.GetOrAdd(key, k => new Lazy&lt;Task&lt;Data&gt;&gt;(() => FetchAsync(k)));
var data = await lazy.Value; // Factory runs exactly once</code></pre><p>Lazy ensures the factory executes exactly once regardless of contention.</p>`
        },
        {
            id: 'conc-q8',
            level: 'senior',
            title: 'When would you use ReaderWriterLockSlim over a regular lock?',
            answer: `<p>Use ReaderWriterLockSlim when:</p><ul><li>Reads vastly outnumber writes (10:1 or higher ratio)</li><li>Read operations are non-trivial (iterating a collection, computing aggregates)</li><li>Multiple readers must proceed concurrently for throughput</li></ul><p>A regular lock serializes ALL access. RWLS allows unlimited concurrent readers, only blocking when a writer needs exclusive access.</p><p><strong>Do NOT use when:</strong></p><ul><li>Reads and writes are roughly equal — RWLS has higher overhead than lock</li><li>Critical section is very short — lock is faster due to less bookkeeping</li><li>You need async — RWLS is not async-compatible; use SemaphoreSlim patterns instead</li></ul><p>In practice: ConcurrentDictionary often replaces RWLS for dictionary-like patterns with less code.</p>`
        },
        {
            id: 'conc-q9',
            level: 'architect',
            title: 'How would you design a high-throughput event processing pipeline with backpressure?',
            answer: `<p>Multi-stage pipeline using Channel&lt;T&gt; between stages:</p><pre><code>// Stage 1: Ingest (bounded, backpressure to callers)
var ingest = Channel.CreateBounded&lt;RawEvent&gt;(1000);
// Stage 2: Enrich (transform, add metadata)
var enrich = Channel.CreateBounded&lt;EnrichedEvent&gt;(500);
// Stage 3: Persist (write to DB/queue)
var persist = Channel.CreateBounded&lt;EnrichedEvent&gt;(200);

// Wire stages with different parallelism per stage
var ingestWorkers = RunWorkers(5, ingest.Reader, async evt =&gt; {
    var enriched = await EnrichAsync(evt);
    await enrich.Writer.WriteAsync(enriched);
});
var enrichWorkers = RunWorkers(3, enrich.Reader, async evt =&gt; {
    await persist.Writer.WriteAsync(evt);
});
var persistWorkers = RunWorkers(10, persist.Reader, PersistAsync);</code></pre><p>Each bounded channel provides natural backpressure: if persist is slow, enrich fills up, which backs up ingest, which eventually blocks producers. No manual throttling needed.</p><p>Monitor: channel.Reader.Count for buffer utilization; alert when sustained at capacity.</p>`
        },
        {
            id: 'conc-q10',
            level: 'architect',
            title: 'What are the trade-offs between lock-free programming and traditional locking?',
            answer: `<p><strong>Lock-free (Interlocked, CAS loops):</strong></p><ul><li>Pro: No blocking — threads never sleep waiting for a lock</li><li>Pro: No deadlocks — impossible without locks</li><li>Pro: Better throughput under low-moderate contention</li><li>Con: Complex to implement correctly (ABA problem, memory ordering)</li><li>Con: Under high contention, CAS retry loops burn CPU (worse than lock)</li><li>Con: Hard to reason about correctness; subtle bugs</li></ul><p><strong>Traditional locking (lock/Monitor):</strong></p><ul><li>Pro: Simple mental model — critical section is exclusive</li><li>Pro: Easy to verify correctness</li><li>Pro: Under high contention, waiting threads sleep (no CPU waste)</li><li>Con: Deadlock risk with multiple locks</li><li>Con: Priority inversion possible</li><li>Con: Serializes access — limits throughput</li></ul><p><strong>Guidance:</strong> Use lock by default. Use lock-free only for proven hot paths where profiling shows lock contention is the bottleneck. In 15 years of .NET, I have needed lock-free code in maybe 3 situations.</p>`
        }
    ]
});
