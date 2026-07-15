/* ═══════════════════════════════════════════════════════════════════
   C# — Async/Await, TPL, Concurrency
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('csharp-async', {
    title: 'Async/Await & Task Parallel Library',
    description: 'Mastering asynchronous programming patterns, Task mechanics, cancellation, synchronization, and avoiding common pitfalls.',
    quickRecall: [
        'async/await compiles to a state machine (IAsyncStateMachine struct)',
        'ConfigureAwait(false) skips SynchronizationContext capture — use in libraries',
        'ValueTask avoids heap allocation when result is often synchronous',
        'Always pass CancellationToken and check token.ThrowIfCancellationRequested()',
        'Never use .Result or .Wait() on async code — causes deadlocks in UI/ASP.NET',
        'Task.WhenAll runs tasks concurrently; Task.WhenAny completes on first finish',
        'async void is fire-and-forget — only for event handlers, never for logic'
    ],
    sections: [
        {
            title: 'How async/await Works Under the Hood',
            content: `<p>The C# compiler transforms an <code>async</code> method into a <strong>state machine</strong>. Each <code>await</code> point becomes a state. When the awaited task completes, the continuation resumes at the next state — potentially on a different thread (unless <code>ConfigureAwait(false)</code> is used).</p>
            <ul>
                <li><strong>State Machine</strong> — compiler-generated struct implementing <code>IAsyncStateMachine</code></li>
                <li><strong>Awaiter Pattern</strong> — any type with <code>GetAwaiter()</code> returning <code>IsCompleted</code>, <code>OnCompleted</code>, <code>GetResult</code></li>
                <li><strong>SynchronizationContext</strong> — determines which thread the continuation runs on (UI thread, ASP.NET request context, or thread pool)</li>
            </ul>`,
            code: `// What you write:
public async Task<string> FetchDataAsync(string url)
{
    using var client = new HttpClient();
    var response = await client.GetAsync(url);        // State 0 → 1
    response.EnsureSuccessStatusCode();
    var content = await response.Content.ReadAsStringAsync(); // State 1 → 2
    return content;
}

// What the compiler generates (simplified):
// A struct state machine with MoveNext() method:
// - State 0: Start GetAsync, if not complete → suspend
// - State 1: Resume, start ReadAsStringAsync, if not complete → suspend  
// - State 2: Resume, set result, complete Task<string>`,
            language: 'csharp'
        },
        {
            title: 'Task vs ValueTask',
            content: `<p><code>Task&lt;T&gt;</code> always allocates on the heap. <code>ValueTask&lt;T&gt;</code> is a struct that avoids allocation when the result is available synchronously (e.g., cached values, completed I/O).</p>`,
            code: `// Task<T> — always allocates (safe to await multiple times)
public async Task<User> GetUserAsync(int id)
{
    return await _repository.FindAsync(id);
}

// ValueTask<T> — zero allocation when synchronous path
public ValueTask<User> GetUserAsync(int id)
{
    if (_cache.TryGetValue(id, out var user))
        return ValueTask.FromResult(user); // No allocation!
    
    return new ValueTask<User>(LoadFromDbAsync(id)); // Falls back to Task
}

// RULES for ValueTask:
// 1. Never await a ValueTask more than once
// 2. Never call .Result before completion
// 3. Never use with WhenAll/WhenAny (convert to Task first)
// 4. Use when >50% of calls complete synchronously`,
            language: 'csharp',
            callout: { type: 'warning', title: 'ValueTask Pitfall', text: 'ValueTask can only be awaited ONCE. If you need to await multiple times or store the result, convert with .AsTask() first. Violating this causes undefined behavior.' }
        },
        {
            title: 'Cancellation Pattern',
            content: `<p>Cooperative cancellation in .NET uses <code>CancellationTokenSource</code> (producer) and <code>CancellationToken</code> (consumer). The token is threaded through the call chain.</p>`,
            code: `// API Controller — token auto-bound from HTTP request abort
[HttpGet("data")]
public async Task<IActionResult> GetData(CancellationToken ct)
{
    var data = await _service.FetchDataAsync(ct);
    return Ok(data);
}

// Service layer — pass token through
public async Task<Data> FetchDataAsync(CancellationToken ct)
{
    ct.ThrowIfCancellationRequested(); // Check early
    
    var result = await _httpClient.GetAsync("/api/data", ct);
    
    // Long-running loop with cancellation
    await foreach (var item in GetItemsAsync(ct))
    {
        ct.ThrowIfCancellationRequested();
        await ProcessItemAsync(item, ct);
    }
    
    return result;
}

// Timeout pattern
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
using var linked = CancellationTokenSource.CreateLinkedTokenSource(cts.Token, ct);

try
{
    await LongOperationAsync(linked.Token);
}
catch (OperationCanceledException) when (!ct.IsCancellationRequested)
{
    // Timeout, not user cancellation
    throw new TimeoutException("Operation timed out after 30s");
}`,
            language: 'csharp'
        },
        {
            title: 'Threading Fundamentals',
            content: `<p>Understanding threads is foundational to async/parallel programming in .NET:</p>
<ul>
<li><strong>Thread</strong> — OS-level execution unit with its own stack (~1MB). Creating threads is expensive (kernel call + memory allocation).</li>
<li><strong>ThreadPool</strong> — .NET maintains a pool of reusable worker threads. Async completions and Task.Run use pool threads.</li>
<li><strong>Thread Safety</strong> — Multiple threads accessing shared mutable state without synchronization causes race conditions.</li>
<li><strong>lock (Monitor)</strong> — Mutual exclusion for critical sections. Only one thread can hold the lock at a time.</li>
<li><strong>Interlocked</strong> — Atomic operations (Increment, CompareExchange) without locks. Fastest synchronization.</li>
<li><strong>volatile</strong> — Ensures reads/writes are not reordered by compiler/CPU. Does NOT provide atomicity.</li>
<li><strong>Thread.Sleep vs Task.Delay</strong> — Sleep blocks the thread; Delay frees it. Never use Sleep in async code.</li>
</ul>`,
            code: `// Thread creation (rarely needed — prefer Task.Run or async)
var thread = new Thread(() =>
{
    Console.WriteLine($"Running on thread {Thread.CurrentThread.ManagedThreadId}");
});
thread.IsBackground = true; // Won't keep app alive
thread.Start();

// ThreadPool — .NET manages thread lifecycle
ThreadPool.QueueUserWorkItem(_ =>
{
    // Runs on a pool thread
    ProcessWork();
});

// lock — mutual exclusion
private readonly object _lock = new();
private int _count;

public void IncrementSafe()
{
    lock (_lock)
    {
        _count++; // Only one thread at a time
    }
}

// Interlocked — lock-free atomic operations (fastest)
private int _counter;
public void IncrementLockFree()
{
    Interlocked.Increment(ref _counter);
}

// Compare-and-swap pattern (optimistic concurrency)
public void UpdateIfGreater(int newValue)
{
    int current;
    do
    {
        current = _counter;
        if (newValue <= current) return;
    }
    while (Interlocked.CompareExchange(ref _counter, newValue, current) != current);
}

// ReaderWriterLockSlim — many readers, exclusive writer
private readonly ReaderWriterLockSlim _rwLock = new();
private Dictionary<string, object> _cache = new();

public object Read(string key)
{
    _rwLock.EnterReadLock();
    try { return _cache[key]; }
    finally { _rwLock.ExitReadLock(); }
}

public void Write(string key, object value)
{
    _rwLock.EnterWriteLock();
    try { _cache[key] = value; }
    finally { _rwLock.ExitWriteLock(); }
}`,
            language: 'csharp'
        },
        {
            title: 'Task Parallel Library (TPL)',
            content: `<p>The TPL provides higher-level parallelism abstractions for CPU-bound work:</p>
<ul>
<li><strong>Parallel.For / Parallel.ForEach</strong> — Partition work across threads automatically</li>
<li><strong>Parallel.ForEachAsync</strong> (.NET 6+) — Async-aware parallel iteration with configurable degree of parallelism</li>
<li><strong>PLINQ (Parallel LINQ)</strong> — .AsParallel() on LINQ queries for data-parallel processing</li>
<li><strong>Dataflow (TPL Dataflow)</strong> — Building blocks for async pipelines (ActionBlock, TransformBlock, BatchBlock)</li>
</ul>
<p><strong>When to use TPL vs async:</strong> TPL is for CPU-bound parallelism (process data faster by using multiple cores). Async/await is for I/O-bound concurrency (handle more requests without more threads).</p>`,
            code: `// ═══ Parallel.For — CPU-bound data processing ═══
var data = new double[1_000_000];
Parallel.For(0, data.Length, i =>
{
    data[i] = Math.Sqrt(i) * Math.Sin(i); // CPU work on multiple cores
});

// ═══ Parallel.ForEach with options ═══
var options = new ParallelOptions
{
    MaxDegreeOfParallelism = Environment.ProcessorCount, // Don't over-subscribe
    CancellationToken = ct
};

Parallel.ForEach(images, options, image =>
{
    var resized = ResizeImage(image, 800, 600); // CPU-bound
    SaveToCache(resized);
});

// ═══ Parallel.ForEachAsync (.NET 6+) — async + parallel ═══
await Parallel.ForEachAsync(urls, 
    new ParallelOptions { MaxDegreeOfParallelism = 10 },
    async (url, ct) =>
    {
        var content = await httpClient.GetStringAsync(url, ct);
        await ProcessContentAsync(content, ct);
    });

// ═══ PLINQ — Parallel LINQ ═══
var results = data
    .AsParallel()
    .WithDegreeOfParallelism(4)
    .WithCancellation(ct)
    .Where(x => x > threshold)        // Filtered in parallel
    .Select(x => ExpensiveTransform(x)) // Transformed in parallel
    .ToList();                          // Merge results

// Ordered PLINQ (preserves input order at cost of performance)
var ordered = data.AsParallel().AsOrdered()
    .Select(x => Transform(x))
    .ToList();

// ═══ TPL Dataflow — async processing pipeline ═══
var downloadBlock = new TransformBlock<string, byte[]>(
    async url => await httpClient.GetByteArrayAsync(url),
    new ExecutionDataflowBlockOptions { MaxDegreeOfParallelism = 5 });

var processBlock = new TransformBlock<byte[], Result>(
    data => CpuIntensiveProcess(data),
    new ExecutionDataflowBlockOptions { MaxDegreeOfParallelism = Environment.ProcessorCount });

var saveBlock = new ActionBlock<Result>(
    async result => await SaveAsync(result));

// Link the pipeline
downloadBlock.LinkTo(processBlock, new DataflowLinkOptions { PropagateCompletion = true });
processBlock.LinkTo(saveBlock, new DataflowLinkOptions { PropagateCompletion = true });

// Feed the pipeline
foreach (var url in urls)
    await downloadBlock.SendAsync(url);

downloadBlock.Complete();
await saveBlock.Completion; // Wait for entire pipeline to drain`,
            language: 'csharp'
        },
        {
            title: 'Thread Pool & Starvation',
            content: `<p>The .NET ThreadPool is a managed pool of worker threads that services Task.Run, async completions, and timer callbacks. Understanding its behavior is critical for production systems:</p>
<ul>
<li><strong>Min threads</strong> — Pool starts with Environment.ProcessorCount threads. Below this, new threads are created immediately on demand.</li>
<li><strong>Thread injection</strong> — Above min threads, the pool adds threads slowly (~1 per 500ms) to avoid over-subscription.</li>
<li><strong>Starvation</strong> — When all pool threads are blocked (sync-over-async, long CPU work, blocking I/O), new work items queue up. Latency spikes, timeouts cascade.</li>
<li><strong>Detection</strong> — Monitor ThreadPool.ThreadCount, ThreadPool.PendingWorkItemCount, and thread injection rate.</li>
</ul>`,
            code: `// Monitor thread pool health
var workerThreads = 0; var ioThreads = 0;
ThreadPool.GetAvailableThreads(out workerThreads, out ioThreads);
ThreadPool.GetMinThreads(out var minWorker, out var minIo);
Console.WriteLine($"Available: {workerThreads}/{ioThreads}, Min: {minWorker}/{minIo}");
Console.WriteLine($"Pending items: {ThreadPool.PendingWorkItemCount}");
Console.WriteLine($"Thread count: {ThreadPool.ThreadCount}");

// Prevent starvation: increase min threads for bursty workloads
ThreadPool.SetMinThreads(
    workerThreads: 100,  // Immediate thread creation up to this count
    completionPortThreads: 100);

// ANTI-PATTERN: blocking thread pool threads
public async Task BadAsync()
{
    // This blocks a thread pool thread waiting for I/O!
    var data = httpClient.GetStringAsync("/api").Result; // ❌ STARVATION!
}

// If all pool threads are blocked like this, new incoming requests
// wait for thread injection (500ms/thread) → cascading timeouts

// CORRECT: Never block in async code
public async Task GoodAsync()
{
    var data = await httpClient.GetStringAsync("/api"); // Thread returned to pool
}`,
            language: 'csharp'
        }
    ],
    questions: [
        {"question":"What does ConfigureAwait(false) do, and when should you use it?","difficulty":"hard","answer":"<p>By default, <code>await</code> captures the current <strong>SynchronizationContext</strong> and resumes the continuation on it (e.g., the UI thread). <code>ConfigureAwait(false)</code> tells the runtime it does not need to resume on that context — the continuation may run on any thread-pool thread.</p><p>Use it in <strong>library and server code</strong> to avoid unnecessary context marshaling and to prevent deadlocks caused by blocking on async code that is trying to resume on a captured context. In UI code you generally omit it when the continuation must touch UI elements. ASP.NET Core has no SynchronizationContext, so it matters most for libraries and legacy UI/ASP.NET contexts.</p>","explanation":"ConfigureAwait(false) is telling the worker \"you do not have to come back to my specific desk to finish — any free desk is fine.\" It avoids waiting for one busy desk (the UI thread), which can otherwise cause a gridlock.","bestPractices":["Use ConfigureAwait(false) throughout library code","Omit it where the continuation must run on the UI thread","Never block on async (.Result/.Wait) on a captured-context thread"],"commonMistakes":["Blocking on async code with .Result causing deadlocks","Using ConfigureAwait(false) then touching UI in the continuation","Assuming it matters in ASP.NET Core (no SyncContext there)"],"interviewTip":"Tie it to the classic deadlock: blocking (.Result) on a method that awaits and tries to resume on the captured UI/ASP.NET context. ConfigureAwait(false) breaks that.","followUp":["What causes the classic async deadlock?","Why does ASP.NET Core not need ConfigureAwait(false)?","What is a SynchronizationContext?"]},
        {"question":"What is the difference between Task and ValueTask, and when should you use ValueTask?","difficulty":"hard","answer":"<p><strong>Task&lt;T&gt;</strong> is a reference type; every async operation allocates one. <strong>ValueTask&lt;T&gt;</strong> is a struct that can wrap either a synchronously-available result (no allocation) or an underlying Task — reducing allocations when a method often completes synchronously (e.g., a cache hit).</p><p>Use ValueTask for hot, high-frequency async APIs that frequently complete synchronously. But it has rules: a ValueTask must be awaited <strong>only once</strong>, not blocked on, and not stored/awaited multiple times. When in doubt, use Task — ValueTask is an optimization, not a default.</p>","explanation":"Task is always renting a delivery van even when the item is already on your desk. ValueTask lets you just hand over the item directly when it is ready, and only call the van when it truly needs shipping.","bestPractices":["Use ValueTask on hot paths that often complete synchronously","Await a ValueTask exactly once","Default to Task unless profiling shows allocation pressure"],"commonMistakes":["Awaiting a ValueTask more than once","Blocking on a ValueTask or calling .Result","Using ValueTask everywhere as a premature optimization"],"interviewTip":"Frame ValueTask as an allocation optimization for often-synchronous hot paths, and recite its rules (await once, do not block) — those rules are what interviewers probe.","followUp":["Why can awaiting a ValueTask twice be a bug?","What is IValueTaskSource?","How do you measure async allocation pressure?"]},
        {
            question: 'What is the difference between Task.Run and async/await? When should you use each?',
            difficulty: 'medium',
            answer: `<p><code>Task.Run</code> offloads CPU-bound work to the thread pool. <code>async/await</code> is for I/O-bound work — it frees the thread while waiting for I/O completion. They solve different problems and should not be confused.</p>
            <ul>
                <li><strong>async/await</strong> — I/O-bound operations (HTTP calls, DB queries, file I/O). Does NOT create a new thread.</li>
                <li><strong>Task.Run</strong> — CPU-bound operations (calculations, compression, serialization). Explicitly uses a thread pool thread.</li>
            </ul>`,
            explanation: 'async/await is like placing a food order and doing other things while waiting — you don\'t need a dedicated waiter standing at the kitchen. Task.Run is like hiring a sous chef to handle prep work in parallel.',
            code: `// CORRECT: I/O-bound — use async/await directly
public async Task<string> GetApiDataAsync()
{
    var response = await _httpClient.GetAsync("/api/data");
    return await response.Content.ReadAsStringAsync();
}

// CORRECT: CPU-bound — use Task.Run to offload
public async Task<byte[]> CompressFileAsync(string path)
{
    var data = await File.ReadAllBytesAsync(path);
    return await Task.Run(() => Compress(data)); // CPU-bound work on thread pool
}

// WRONG: Wrapping async in Task.Run (wastes a thread pool thread!)
public Task<string> GetDataWrong()
{
    return Task.Run(async () => await _httpClient.GetStringAsync("/api"));
    // ❌ This holds a thread pool thread just to wait for I/O!
}

// WRONG: Blocking on async (deadlock risk!)
public string GetDataDeadlock()
{
    return _httpClient.GetStringAsync("/api").Result; // ❌ DEADLOCK!
}`,
            language: 'csharp',
            bestPractices: [
                'Use async/await for all I/O operations (DB, HTTP, file, network)',
                'Use Task.Run only for CPU-bound work in UI or ASP.NET contexts',
                'Never wrap async methods in Task.Run on the server (double thread usage)',
                'Always pass CancellationToken through the call chain',
                'Use ConfigureAwait(false) in library code'
            ],
            commonMistakes: [
                'Using Task.Run for I/O (wastes thread pool thread)',
                'Blocking on async with .Result or .Wait() (causes deadlocks)',
                'async void methods (fire-and-forget, swallows exceptions)',
                'Not passing CancellationToken (operations can\'t be cancelled on HTTP disconnect)'
            ],
            interviewTip: 'Explain that async/await doesn\'t create threads — it uses I/O completion ports (IOCP) on Windows. The thread is returned to the pool during the await, which is why ASP.NET can handle thousands of concurrent requests with few threads.',
            followUp: ['What causes an async deadlock?', 'When should you use ConfigureAwait(false)?', 'What is the thread pool starvation problem?'],
            seniorPerspective: 'The biggest async mistake I see in codebases is Task.Run wrapping async calls in ASP.NET. It doubles thread usage and halves throughput. I enforce this in code reviews.',
            architectPerspective: 'In high-load services (10K+ RPS), proper async discipline is the difference between 100 threads handling all requests vs thread pool starvation. Monitor ThreadPool.PendingWorkItemCount.'
        },
        {
            question: 'Explain async deadlocks. How do they happen and how do you prevent them?',
            difficulty: 'advanced',
            answer: `<p>An async deadlock occurs when code blocks synchronously (.Result, .Wait()) on a task that needs the <strong>same synchronization context</strong> to complete its continuation. The blocked thread holds the context, but the continuation needs that context — classic deadlock.</p>`,
            explanation: 'Imagine a one-lane bridge. You\'re parked on it waiting for a delivery truck. But the truck is waiting for you to clear the bridge. Neither can proceed.',
            code: `// THE DEADLOCK (ASP.NET/WinForms with SynchronizationContext):
public string GetData()
{
    // Blocks the thread that owns the SynchronizationContext
    var result = GetDataAsync().Result; // ❌ DEADLOCK!
    return result;
}

private async Task<string> GetDataAsync()
{
    // After this await, continuation needs the SynchronizationContext
    // But it's blocked by .Result above!
    var data = await _httpClient.GetStringAsync("/api");
    return data; // Never reaches here — deadlock!
}

// FIX 1: Go async all the way up (BEST)
public async Task<string> GetDataAsync()
{
    return await _httpClient.GetStringAsync("/api");
}

// FIX 2: ConfigureAwait(false) in libraries
private async Task<string> GetDataInternalAsync()
{
    var data = await _httpClient.GetStringAsync("/api")
        .ConfigureAwait(false); // Don't capture context
    return data;
}

// FIX 3: JoinableTaskFactory (Visual Studio SDK pattern)
// For cases where you MUST block on async in UI contexts

// FIX 4: Task.Run wrapping (last resort, wastes a thread)
public string GetDataSync()
{
    return Task.Run(() => GetDataAsync()).GetAwaiter().GetResult();
}`,
            language: 'csharp',
            bestPractices: [
                'Async all the way — never block on async code',
                'Use ConfigureAwait(false) in all library/infrastructure code',
                'In ASP.NET Core, there is no SynchronizationContext (deadlock-free), but avoid .Result anyway',
                'Use GetAwaiter().GetResult() over .Result for better exception handling'
            ],
            commonMistakes: [
                'Mixing sync and async code (.Result, .Wait())',
                'Forgetting ConfigureAwait(false) in shared libraries',
                'Assuming ASP.NET Core immunity means blocking is fine (it still wastes threads)',
                'async void in non-event-handler code (unobserved exceptions)'
            ],
            interviewTip: 'Note that ASP.NET Core removed SynchronizationContext, so classic deadlocks don\'t occur there. But blocking still causes thread pool starvation — a different but equally serious problem.',
            followUp: ['Why doesn\'t ASP.NET Core have SynchronizationContext?', 'What is thread pool starvation?', 'How does ConfigureAwait(false) prevent deadlocks?'],
            seniorPerspective: 'I enforce async-all-the-way via code review and Roslyn analyzers (VSTHRD110). The rare cases where sync-over-async is needed get explicit Task.Run with a code comment explaining why.',
            architectPerspective: 'Thread pool starvation (the ASP.NET Core equivalent of deadlocks) manifests as sudden latency spikes under load. We monitor ThreadPool.ThreadCount vs MinThreads and have alerts when growth rate exceeds 2/sec.'
        },
        {
            question: 'How would you implement a rate-limited concurrent processor using SemaphoreSlim?',
            difficulty: 'expert',
            answer: `<p><code>SemaphoreSlim</code> provides async-compatible concurrency limiting. Combined with <code>Task.WhenAll</code> and <code>Channel&lt;T&gt;</code>, it enables bounded-concurrency processing patterns.</p>`,
            code: `// Pattern: Process N items with max M concurrent operations
public async Task ProcessAllAsync(
    IEnumerable<WorkItem> items,
    int maxConcurrency = 10,
    CancellationToken ct = default)
{
    using var semaphore = new SemaphoreSlim(maxConcurrency);
    
    var tasks = items.Select(async item =>
    {
        await semaphore.WaitAsync(ct); // Wait for a slot
        try
        {
            await ProcessItemAsync(item, ct);
        }
        finally
        {
            semaphore.Release(); // Free the slot
        }
    });
    
    await Task.WhenAll(tasks);
}

// Advanced: Channel-based pipeline with backpressure
public async Task RunPipelineAsync(CancellationToken ct)
{
    var channel = Channel.CreateBounded<WorkItem>(
        new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.Wait // Backpressure!
        });
    
    // Producer
    var producer = Task.Run(async () =>
    {
        await foreach (var item in GetItemsAsync(ct))
        {
            await channel.Writer.WriteAsync(item, ct);
        }
        channel.Writer.Complete();
    }, ct);
    
    // Consumers (N workers)
    var consumers = Enumerable.Range(0, 5).Select(_ => Task.Run(async () =>
    {
        await foreach (var item in channel.Reader.ReadAllAsync(ct))
        {
            await ProcessItemAsync(item, ct);
        }
    }, ct));
    
    await Task.WhenAll(consumers.Append(producer));
}`,
            language: 'csharp',
            bestPractices: [
                'Always use SemaphoreSlim (not Semaphore) for async code',
                'Wrap the work in try/finally to always Release()',
                'Use Channel<T> for producer-consumer patterns with backpressure',
                'Set bounded capacity to prevent unbounded memory growth',
                'Pass CancellationToken to WaitAsync for responsive shutdown'
            ],
            commonMistakes: [
                'Forgetting to release the semaphore (causes eventual deadlock)',
                'Using lock statement with async (not allowed — use SemaphoreSlim)',
                'Creating unbounded task lists without throttling (OOM under load)',
                'Not handling exceptions in individual tasks (one failure shouldn\'t kill all)'
            ],
            interviewTip: 'Show the Channel<T> pattern — it demonstrates knowledge of modern .NET concurrent primitives beyond basic Task.WhenAll. Mention Polly for retry/circuit-breaker on top.',
            followUp: ['How does Channel<T> compare to BlockingCollection<T>?', 'What is backpressure and why does it matter?', 'How would you add retry logic to each item?'],
            seniorPerspective: 'I use this pattern for batch API calls, bulk database operations, and file processing. The key insight: maxConcurrency should match the downstream bottleneck (e.g., DB connection pool size).',
            architectPerspective: 'At scale, the Channel + bounded consumers pattern is how we build internal message processors that rival dedicated queue consumers (RabbitMQ, SQS) but with in-process simplicity and zero infrastructure.'
        },
        {
            question: 'What does ConfigureAwait(false) actually do, and where should you use it in modern .NET?',
            difficulty: 'medium',
            answer: `<p><code>ConfigureAwait(false)</code> tells the awaiter <strong>not to capture and restore the current SynchronizationContext (or TaskScheduler)</strong> for the continuation. The continuation runs on whatever thread completes the awaited operation (typically a thread-pool thread) instead of marshaling back to the original context.</p>
            <ul>
                <li><strong>Avoids deadlocks</strong> when callers block on the task (legacy WinForms/WPF/old ASP.NET).</li>
                <li><strong>Improves performance</strong> by skipping the context-capture-and-post round trip.</li>
                <li><strong>ASP.NET Core has no SynchronizationContext</strong>, so it has no functional effect there, but it is still recommended in shared libraries.</li>
            </ul>`,
            explanation: `Think of it as telling a courier "do not bother returning to my exact desk to deliver the reply, just hand it to whoever is free". You skip the trip back to a specific location.`,
            code: `// LIBRARY CODE — always use ConfigureAwait(false)
public async Task<string> DownloadAsync(string url)
{
    using var client = new HttpClient();
    // No need to resume on the caller's context inside a library
    var response = await client.GetAsync(url).ConfigureAwait(false);
    return await response.Content.ReadAsStringAsync().ConfigureAwait(false);
}

// UI/APP CODE — do NOT use ConfigureAwait(false) when you need the context
private async void OnButtonClick(object sender, EventArgs e)
{
    // Must resume on UI thread to touch controls -> default (capture context)
    var data = await _service.LoadAsync();
    label.Text = data; // Safe: continuation marshaled back to UI thread
}

// ASP.NET Core: no SynchronizationContext, so it is a no-op functionally,
// but harmless and recommended for code shared with other runtimes.

// .NET 8 alternative for advanced scheduling control:
await SomeOperationAsync().ConfigureAwait(ConfigureAwaitOptions.None);`,
            language: 'csharp',
            bestPractices: [
                'Use ConfigureAwait(false) in all library and infrastructure code',
                'Omit it (capture context) in UI event handlers that touch controls',
                'Apply it to every await in a method, not just the first one',
                'Treat it as a no-op in ASP.NET Core but keep it for portability'
            ],
            commonMistakes: [
                'Applying ConfigureAwait(false) then touching UI controls in the continuation',
                'Adding it to only the first await and forgetting subsequent ones',
                'Assuming it changes behavior in ASP.NET Core (it does not, there is no context)',
                'Believing it makes blocking on async safe in every scenario'
            ],
            interviewTip: 'Clarify that ConfigureAwait(false) controls CONTEXT capture, not thread switching guarantees. The continuation may still run on a different thread; you are simply opting out of forcing it back to the original context.',
            followUp: ['Why does ASP.NET Core lack a SynchronizationContext?', 'What is ConfigureAwaitOptions in .NET 8?', 'Does ConfigureAwait(false) affect the awaited operation or only the continuation?'],
            seniorPerspective: `In reusable libraries I enforce ConfigureAwait(false) through the VSTHRD analyzers. It is invisible in ASP.NET Core but prevents deadlocks when the same NuGet package is consumed by a WPF or WinForms app.`,
            architectPerspective: `For shared platform libraries that ship to many app types, ConfigureAwait(false) is a contract: the library promises not to depend on or hijack the caller's context. This keeps the library deadlock-safe regardless of the host runtime.`
        },
        {
            question: 'How does exception handling work with Task.WhenAll? What happens when multiple tasks fail?',
            difficulty: 'hard',
            answer: `<p><code>Task.WhenAll</code> waits for all tasks to complete and aggregates their exceptions into an <code>AggregateException</code> on the returned task. However, <strong>awaiting</strong> the WhenAll task only rethrows the <strong>first</strong> exception. To observe all failures you must inspect the task's <code>Exception</code> property or iterate the individual tasks.</p>`,
            explanation: `It is like mailing five letters and getting back a single envelope of replies. When you await, you only read the top reply by default; to see every failure you have to open the whole stack.`,
            code: `// Awaiting WhenAll rethrows only the FIRST exception
var tasks = new[] { FailAsync("A"), FailAsync("B"), OkAsync() };
try
{
    await Task.WhenAll(tasks); // throws ONE exception (the first)
}
catch (Exception ex)
{
    // ex is just the first failure -> the others are hidden here
}

// To observe ALL failures, capture the WhenAll task and inspect it:
var whenAll = Task.WhenAll(tasks);
try
{
    await whenAll;
}
catch
{
    // whenAll.Exception is the AggregateException with EVERY failure
    foreach (var inner in whenAll.Exception!.InnerExceptions)
        _logger.LogError(inner, "Task failed");
}

// Robust pattern: never let one failure cancel the batch silently
var results = await Task.WhenAll(ids.Select(async id =>
{
    try { return Result.Ok(await ProcessAsync(id)); }
    catch (Exception ex) { return Result.Fail(id, ex); }
}));
// Now every item has an explicit success/failure result -> no lost errors`,
            language: 'csharp',
            bestPractices: [
                'Capture the WhenAll task in a variable to access AggregateException.InnerExceptions',
                'Wrap per-item work in try/catch to convert failures into result objects',
                'Pass a CancellationToken so a fatal failure can cancel remaining work intentionally',
                'Log all inner exceptions, not just the first rethrown one'
            ],
            commonMistakes: [
                'Assuming await on WhenAll surfaces every failure (it surfaces only the first)',
                'Letting one task exception hide failures in the other tasks',
                'Not awaiting the returned task, leaving exceptions unobserved',
                'Mixing ValueTask into WhenAll without converting to Task first'
            ],
            interviewTip: 'The key nuance: WhenAll STORES all exceptions in an AggregateException, but the await keyword UNWRAPS and rethrows only the first inner exception. Knowing this distinction signals real concurrency experience.',
            followUp: ['How does Task.WhenAny differ in exception handling?', 'What happens to exceptions from tasks you never await?', 'How does TaskScheduler.UnobservedTaskException relate to this?'],
            seniorPerspective: `For batch jobs I always project each operation into a Result type so a single failure never masks the rest. Aggregating partial successes and failures is essential for idempotent retry logic.`,
            architectPerspective: `In fan-out/fan-in pipelines, swallowing secondary exceptions hides systemic issues (e.g., one bad shard). I require structured per-item results so monitoring can distinguish a single transient failure from a widespread outage.`
        },
        {
            question: 'What is IAsyncEnumerable<T> and when would you use await foreach over returning a Task<List<T>>?',
            difficulty: 'advanced',
            answer: `<p><code>IAsyncEnumerable&lt;T&gt;</code> (C# 8) represents an <strong>asynchronous stream</strong> — items produced over time, each potentially requiring an async operation, consumed with <code>await foreach</code>. Unlike <code>Task&lt;List&lt;T&gt;&gt;</code>, it streams results incrementally instead of buffering the entire set in memory before returning.</p>`,
            explanation: `Task<List<T>> is like waiting for an entire pizza to be cooked before any slice is served. IAsyncEnumerable is a conveyor belt — each slice is handed to you as soon as it is ready.`,
            code: `// Producer: yields items as they arrive (paged API, DB cursor, file stream)
public async IAsyncEnumerable<Order> GetOrdersAsync(
    [EnumeratorCancellation] CancellationToken ct = default)
{
    string? cursor = null;
    do
    {
        var page = await _api.GetPageAsync(cursor, ct);
        foreach (var order in page.Items)
            yield return order; // streamed, not buffered

        cursor = page.NextCursor;
    }
    while (cursor is not null);
}

// Consumer: processes each item without loading everything first
await foreach (var order in GetOrdersAsync(ct).WithCancellation(ct))
{
    await ProcessAsync(order); // backpressure: producer pauses while you work
}

// Why not Task<List<Order>>?
// - Millions of rows would blow up memory if fully materialized
// - First item is available immediately (lower time-to-first-byte)
// - Natural backpressure: the producer only advances as the consumer pulls

// EF Core supports it natively:
await foreach (var user in dbContext.Users.AsAsyncEnumerable().WithCancellation(ct))
{
    // streamed straight from the data reader
}`,
            language: 'csharp',
            bestPractices: [
                'Annotate the token parameter with [EnumeratorCancellation] so WithCancellation flows it',
                'Use IAsyncEnumerable for large or unbounded streams to avoid buffering',
                'Prefer Task<List<T>> for small, bounded result sets that fit comfortably in memory',
                'Combine with System.Linq.Async for streaming Where/Select operators'
            ],
            commonMistakes: [
                'Forgetting [EnumeratorCancellation], so cancellation does not reach the iterator',
                'Calling ToListAsync immediately, which defeats the streaming benefit',
                'Using it for tiny collections where the overhead is not justified',
                'Blocking inside the loop, which stalls the entire stream'
            ],
            interviewTip: 'Emphasize two benefits: lower memory (no full buffering) and lower latency to first result. Mention [EnumeratorCancellation] — interviewers love when you know cancellation must be wired explicitly into async iterators.',
            followUp: ['How does [EnumeratorCancellation] work?', 'How does IAsyncEnumerable provide backpressure?', 'How does it compare to Channel<T> or Reactive Extensions?'],
            seniorPerspective: `I switched several report exporters from Task<List<T>> to IAsyncEnumerable streamed directly to the HTTP response. Memory dropped from gigabytes to megabytes and time-to-first-byte improved dramatically.`,
            architectPerspective: `Async streams let services process data sets larger than RAM with constant memory. Combined with gRPC server streaming or chunked HTTP responses, they enable backpressure-aware data pipelines without an external queue.`
        },
        {
            question: 'How does the C# async state machine work internally? What does the compiler generate when you write an async method?',
            difficulty: 'advanced',
            answer: `<p>The C# compiler transforms every <code>async</code> method into a <strong>state machine struct</strong> (implementing <code>IAsyncStateMachine</code>). The method body is rewritten into a <code>MoveNext()</code> method with a switch on an integer state field. Each <code>await</code> becomes a state transition point.</p>
            <p>When the method hits an await on an incomplete Task, it: (1) stores the current state number, (2) captures local variables into fields on the struct, (3) schedules a continuation via the <code>AsyncMethodBuilder</code>, and (4) returns to the caller. When the awaited Task completes, the continuation calls MoveNext() again, which resumes at the saved state number.</p>
            <p>Key implementation details: The state machine starts as a struct on the stack. If the first await is incomplete (needs to actually suspend), it gets boxed to the heap. If the method completes synchronously (all awaits already complete), it stays on the stack with zero heap allocations — this is the "fast path" optimization.</p>`,
            explanation: 'The compiler turns your async method into a bookmark-aware book reader. Each await is a bookmark. When you have to wait, you save your place and put the book down. When notified the page is ready, you pick the book back up at your bookmark and keep reading.',
            code: `// YOUR CODE:
public async Task<int> CalculateAsync(int x)
{
    var a = await GetValueAsync(x);
    var b = await GetValueAsync(a + 1);
    return a + b;
}

// WHAT THE COMPILER GENERATES (simplified):
[StructLayout(LayoutKind.Auto)]
private struct <CalculateAsync>d__0 : IAsyncStateMachine
{
    public int <>1__state;          // -1=start, 0=first await, 1=second await
    public AsyncTaskMethodBuilder<int> <>t__builder;
    public int x;                    // parameter, captured
    private int <a>5__1;            // local 'a', captured as field
    private int <b>5__2;            // local 'b', captured as field
    private TaskAwaiter<int> <>u__1; // reused awaiter slot

    public void MoveNext()
    {
        int result;
        try
        {
            TaskAwaiter<int> awaiter;
            switch (<>1__state)
            {
                case 0: goto Resume0;
                case 1: goto Resume1;
            }
            // State -1: first execution
            awaiter = GetValueAsync(x).GetAwaiter();
            if (!awaiter.IsCompleted)       // Needs to suspend?
            {
                <>1__state = 0;             // Save state
                <>u__1 = awaiter;           // Save awaiter
                <>t__builder.AwaitUnsafeOnCompleted(ref awaiter, ref this);
                return;                     // Return to caller (suspend)
            }
            Resume0:
            <a>5__1 = awaiter.GetResult(); // Get result, continue

            awaiter = GetValueAsync(<a>5__1 + 1).GetAwaiter();
            if (!awaiter.IsCompleted)
            {
                <>1__state = 1;
                <>u__1 = awaiter;
                <>t__builder.AwaitUnsafeOnCompleted(ref awaiter, ref this);
                return;
            }
            Resume1:
            <b>5__2 = awaiter.GetResult();
            result = <a>5__1 + <b>5__2;
        }
        catch (Exception ex)
        {
            <>t__builder.SetException(ex);
            return;
        }
        <>t__builder.SetResult(result);
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Understand the fast path: if awaited tasks are already complete, no heap allocation occurs',
                'Use ValueTask<T> to avoid Task allocation on the synchronous completion path',
                'Minimize local variables in async methods — each becomes a field on the state machine',
                'Use [AsyncMethodBuilder(typeof(PoolingAsyncValueTaskMethodBuilder<>))] for hot paths in .NET 7+'
            ],
            commonMistakes: [
                'Assuming every async method allocates a Task (synchronous completion avoids it with ValueTask)',
                'Having large structs as locals in async methods (they become fields, increasing state machine size)',
                'Not realizing that try/catch in async methods adds completion-state tracking overhead',
                'Overusing async when the method could return a cached/completed task directly'
            ],
            interviewTip: 'Describe the state machine as a struct with a MoveNext() switch statement. Mention the fast path (no boxing if completed synchronously) and that locals become fields. This shows compiler-level understanding beyond just using async/await.',
            followUp: ['Why is the state machine a struct initially?', 'What does AwaitUnsafeOnCompleted do differently from AwaitOnCompleted?', 'How does ValueTask avoid the Task allocation?']
        },
        {
            question: 'Explain SynchronizationContext and why library code should always use ConfigureAwait(false). What happens if you don\'t?',
            difficulty: 'hard',
            answer: `<p><code>SynchronizationContext</code> controls WHERE a continuation resumes after an await. In UI apps (WPF, WinForms), it posts continuations back to the UI thread. In ASP.NET Core there is no SynchronizationContext (continuations run on thread pool threads).</p>
            <p>When library code does NOT use <code>ConfigureAwait(false)</code> and runs in a context that has a SynchronizationContext (UI apps, legacy ASP.NET): (1) every continuation is marshaled back to the original context thread, causing unnecessary thread marshaling overhead; (2) if the calling code does <code>.Result</code> or <code>.Wait()</code> on the returned Task, it <strong>deadlocks</strong> — the continuation needs the context thread, but .Result is blocking that exact thread.</p>
            <p>In library/infrastructure code, <code>ConfigureAwait(false)</code> says "I don't need to resume on the original context — resume on any thread pool thread." This prevents deadlocks, reduces overhead, and makes the library safe to call from any environment.</p>`,
            explanation: 'SynchronizationContext is like a rule saying "after every coffee break, return to YOUR desk." ConfigureAwait(false) says "sit at any available desk." Libraries should not assume they need your specific desk — that assumption causes traffic jams (deadlocks) when someone blocks the hallway.',
            code: `// THE DEADLOCK SCENARIO:
// UI button click handler:
private void Button_Click(object sender, EventArgs e)
{
    // This blocks the UI thread waiting for the result:
    var result = GetDataAsync().Result; // DEADLOCK!
}
public async Task<string> GetDataAsync()
{
    // After this await completes, the continuation tries to resume
    // on the UI thread (SynchronizationContext). But .Result is
    // BLOCKING that thread. Deadlock!
    var data = await httpClient.GetStringAsync(url);
    return data;
}

// THE FIX — ConfigureAwait(false) in library code:
public async Task<string> GetDataAsync()
{
    var data = await httpClient.GetStringAsync(url)
        .ConfigureAwait(false); // Resume on ANY thread pool thread
    // Now .Result won't deadlock (continuation doesn't need the UI thread)
    return data;
}

// BEST PRACTICE for libraries — ConfigureAwait(false) on EVERY await:
public async Task<ProcessedData> ProcessAsync(int id, CancellationToken ct)
{
    var raw = await _repo.GetByIdAsync(id, ct).ConfigureAwait(false);
    var transformed = await TransformAsync(raw, ct).ConfigureAwait(false);
    var validated = await ValidateAsync(transformed, ct).ConfigureAwait(false);
    return validated;
}

// .NET 7+: Use ConfigureAwaitOptions for more control:
await task.ConfigureAwait(ConfigureAwaitOptions.ForceYielding);

// ASP.NET Core: No SynchronizationContext exists, so ConfigureAwait(false)
// is technically unnecessary but still recommended for:
// 1. Library portability (may be called from UI code)
// 2. Tiny performance gain (skips the context check)
// 3. Code consistency and good habits`,
            language: 'csharp',
            bestPractices: [
                'Always use ConfigureAwait(false) in library/infrastructure code on every await',
                'Application-level code (UI handlers, controllers) can omit it when context is needed',
                'Never call .Result or .Wait() on async code in a context with SynchronizationContext',
                'Use ConfigureAwaitOptions in .NET 7+ for more granular control',
                'Document whether your library is SynchronizationContext-safe'
            ],
            commonMistakes: [
                'Omitting ConfigureAwait(false) in a NuGet library, causing deadlocks for UI consumers',
                'Using ConfigureAwait(false) then accessing UI elements (Context is lost)',
                'Assuming ASP.NET Core has a SynchronizationContext (it does not, but libraries should be portable)',
                'Thinking ConfigureAwait(false) makes code faster — it avoids deadlocks, not adds speed'
            ],
            interviewTip: 'Explain the deadlock mechanism step by step: blocked context thread + continuation needing that thread = deadlock. Then state the rule: library code always ConfigureAwait(false), app code keeps the context when needed.',
            followUp: ['What is the difference between SynchronizationContext and TaskScheduler?', 'Why did ASP.NET Core remove SynchronizationContext?', 'How does ConfigureAwaitOptions.ForceYielding differ from ConfigureAwait(false)?']
        },
        {
            question: 'What is thread pool starvation and how do you diagnose and fix it in production?',
            difficulty: 'hard',
            answer: `<p><strong>Thread pool starvation</strong> occurs when all thread pool threads are blocked (typically by sync-over-async code), and new work items queue up waiting for threads. The pool injects new threads slowly (~1 per 500ms above min count), causing cascading latency spikes and timeouts.</p>
<p><strong>Symptoms:</strong> Sudden p99 latency spikes under load, HTTP 503s, upstream timeouts, thread count climbing steadily.</p>
<p><strong>Diagnosis:</strong></p>
<ul>
<li><code>ThreadPool.PendingWorkItemCount</code> > 0 sustained</li>
<li><code>ThreadPool.ThreadCount</code> climbing above ProcessorCount</li>
<li>dotnet-counters: <code>dotnet-counters monitor --counters System.Runtime</code></li>
<li>Thread dump shows many threads blocked on .Result/.Wait()/Thread.Sleep</li>
</ul>
<p><strong>Fixes:</strong></p>
<ul>
<li>Eliminate sync-over-async (.Result, .Wait()) — go async all the way</li>
<li>Increase ThreadPool.SetMinThreads as a band-aid (not a fix)</li>
<li>Use async DB/HTTP clients (no blocking I/O)</li>
<li>Offload truly blocking third-party calls to dedicated threads (not pool threads)</li>
</ul>`,
            language: 'csharp',
            bestPractices: ['Monitor ThreadPool.PendingWorkItemCount in production metrics', 'Never block thread pool threads with sync I/O', 'Set MinThreads higher for bursty startup patterns', 'Use dedicated threads for unavoidably blocking third-party libraries'],
            commonMistakes: ['Increasing MinThreads as a permanent fix (masks the real blocking issue)', 'Using Thread.Sleep in async methods', 'Calling synchronous database APIs from async handlers', 'Not monitoring thread pool metrics in production'],
            interviewTip: 'Describe the ramp-up delay: above MinThreads the pool only adds 1 thread per 500ms. A burst of 100 blocking calls on a 16-core machine needs 84 new threads = 42 seconds of degraded performance.',
            followUp: ['How does SetMinThreads help with bursty workloads?', 'What dotnet-counters metrics indicate starvation?', 'How does async I/O avoid consuming thread pool threads?']
        },
        {
            question: 'When would you use Parallel.ForEachAsync vs Task.WhenAll with SemaphoreSlim? What are the trade-offs?',
            difficulty: 'hard',
            answer: `<p>Both achieve bounded-concurrency async processing, but with different trade-offs:</p>
<table>
<tr><th>Aspect</th><th>Parallel.ForEachAsync (.NET 6+)</th><th>Task.WhenAll + SemaphoreSlim</th></tr>
<tr><td>API simplicity</td><td>One-liner, built-in</td><td>Manual semaphore management</td></tr>
<tr><td>Partitioning</td><td>Automatic work-stealing partitioner</td><td>You control task creation</td></tr>
<tr><td>Cancellation</td><td>Built-in via ParallelOptions.CancellationToken</td><td>Manual CancellationToken wiring</td></tr>
<tr><td>Error handling</td><td>Stops on first exception (default)</td><td>WhenAll waits for all, collects all exceptions</td></tr>
<tr><td>Backpressure</td><td>Built-in (does not enumerate ahead)</td><td>Must be careful not to enumerate entire source</td></tr>
<tr><td>Available since</td><td>.NET 6</td><td>.NET Standard 2.0+</td></tr>
</table>
<p><strong>Choose Parallel.ForEachAsync:</strong> Simple fan-out processing, .NET 6+, want auto-partitioning and built-in cancellation.</p>
<p><strong>Choose SemaphoreSlim:</strong> Need to collect all results (success + failure), target older .NET, need custom completion semantics, or need to integrate with Channel&lt;T&gt; pipelines.</p>`,
            bestPractices: ['Prefer Parallel.ForEachAsync for new .NET 6+ code — cleaner and handles edge cases', 'Always set MaxDegreeOfParallelism (default is unbounded!)', 'For result collection, SemaphoreSlim + Task.WhenAll gives you Result<T> per item', 'Match parallelism to the bottleneck (DB pool size, API rate limit, core count)'],
            commonMistakes: ['Not setting MaxDegreeOfParallelism on Parallel.ForEachAsync (defaults to ProcessorCount)', 'Enumerating entire source into memory before throttling with semaphore', 'Using Parallel.For for I/O-bound work (it is designed for CPU-bound)', 'Forgetting to Release() semaphore in finally block'],
            interviewTip: 'Show you know both patterns. Mention that Parallel.ForEachAsync is the modern choice but SemaphoreSlim gives more control for complex scenarios (partial results, different error strategies).'
        },
        {
            question: 'Explain Parallel LINQ (PLINQ). When does it help and when does it hurt performance?',
            difficulty: 'medium',
            answer: `<p>PLINQ (.AsParallel()) partitions a LINQ query across multiple threads for data-parallel processing. It is for <strong>CPU-bound</strong> operations on large in-memory collections.</p>
<p><strong>Helps when:</strong></p>
<ul>
<li>Processing large collections (10K+ items) with expensive per-item transforms</li>
<li>Operations are CPU-bound and independent (no shared state)</li>
<li>Running on multi-core machines with available CPU headroom</li>
</ul>
<p><strong>Hurts when:</strong></p>
<ul>
<li>Collections are small (partitioning overhead > computation savings)</li>
<li>Operations are I/O-bound (use async instead — PLINQ blocks threads)</li>
<li>Order matters and you use AsOrdered() (synchronization overhead)</li>
<li>Operations share mutable state (requires locking, negates parallelism)</li>
<li>Server is already CPU-saturated (adding parallelism makes it worse)</li>
</ul>
<p><strong>Rule of thumb:</strong> Benchmark first. PLINQ only helps when per-item work is expensive enough to amortize the partitioning/synchronization cost. For most CRUD apps, it is overkill.</p>`,
            bestPractices: ['Benchmark with and without PLINQ — measure, do not assume', 'Set WithDegreeOfParallelism to avoid consuming all CPU on multi-tenant servers', 'Use ForAll() for side-effect operations instead of ToList() (avoids merge overhead)', 'Prefer Parallel.ForEach over PLINQ when you do not need LINQ operators'],
            commonMistakes: ['Using PLINQ for I/O-bound work (blocks threads, causes starvation)', 'Forgetting AsOrdered() when output order matters', 'Sharing mutable state across PLINQ iterations without locks', 'Using PLINQ on trivially small collections (overhead > benefit)'],
            interviewTip: 'Key insight: PLINQ is for CPU-bound data parallelism on in-memory collections. It is NOT a replacement for async I/O. If your transform calls a database or API, use async patterns instead.'
        }
    ]
});
