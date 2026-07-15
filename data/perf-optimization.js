/* ═══════════════════════════════════════════════════════════════════
   Performance — Optimization & Scaling
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('perf-optimization', {
    title: 'Optimization & Scaling',
    description: 'BenchmarkDotNet, profiling, load testing, horizontal vs vertical scaling, async patterns for throughput, and identifying and fixing performance bottlenecks.',
    sections: [
        {
            title: 'Profiling & Benchmarking',
            content: `<p>Performance optimization starts with measurement. Never optimize without profiling — intuition about bottlenecks is wrong 80% of the time.</p>`,
            code: `// BenchmarkDotNet — micro-benchmarking
[MemoryDiagnoser]
[SimpleJob(RuntimeMoniker.Net80)]
public class SerializationBenchmark
{
    private readonly User _user = new("Alice", 30, "alice@example.com");

    [Benchmark(Baseline = true)]
    public string SystemTextJson() => JsonSerializer.Serialize(_user);

    [Benchmark]
    public string SystemTextJsonSourceGen() => 
        JsonSerializer.Serialize(_user, AppJsonContext.Default.User);

    [Benchmark]
    public string Newtonsoft() => JsonConvert.SerializeObject(_user);
}
// Results show: source-gen is 3x faster, 0 allocations

// Load testing with k6:
// k6 run --vus 100 --duration 60s loadtest.js
// Measures: RPS, P50/P95/P99 latency, error rate under load

// Profiling tools:
// dotnet-trace: lightweight sampling profiler (production-safe)
// dotnet-counters: real-time GC/CPU/exception metrics
// dotMemory: heap snapshots, retention analysis
// Visual Studio Profiler: CPU, memory, database, async waits

// Key metrics to track:
// P99 latency (not average — averages hide tail latency)
// Throughput (requests/second at acceptable latency)
// Error rate under load (when does the system break?)
// GC pause time (correlates with latency spikes)
// Connection pool saturation (DB connections exhausted?)

// Common .NET performance wins:
// 1. Use async/await for I/O (don't block threads)
// 2. Use connection pooling (HttpClientFactory, EF Core)
// 3. Reduce allocations in hot paths (Span<T>, stackalloc, pooling)
// 4. Use compiled queries in EF Core for repeated queries
// 5. Add appropriate indexes (most common DB performance issue)
// 6. Use output caching for expensive computations
// 7. Batch operations (bulk insert instead of N individual inserts)`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'How do you identify and fix performance bottlenecks in a .NET API?',
            difficulty: 'advanced',
            answer: `<p>Systematic approach: (1) Measure under realistic load (k6/Artillery), (2) Profile to find the bottleneck (dotnet-trace, Application Insights), (3) Fix the specific issue, (4) Re-measure to verify improvement. The bottleneck is usually: N+1 queries, missing indexes, synchronous I/O blocking threads, excessive allocations causing GC pressure, or connection pool exhaustion.</p>`,
            bestPractices: ['Always measure before and after optimization (avoid premature optimization)', 'Profile in production-like conditions (dev environment hides issues)', 'Focus on P99 latency not average (tail latency affects real users)', 'Optimize the bottleneck, not random code (Amdahl Law: 10% of code causes 90% of latency)'],
            commonMistakes: ['Optimizing without profiling (fixing the wrong thing)', 'Looking only at average latency (P99 reveals the real user experience)', 'Micro-optimizing code that is not the bottleneck (net zero impact)', 'Not load testing before production (issues appear only under concurrency)'],
            interviewTip: 'Show a systematic process: "I start with load testing to reproduce the issue under realistic traffic. Then I use Application Insights to identify slow endpoints. I drill into traces to find whether it is DB, external API, or computation. I fix the specific bottleneck and verify with another load test."',
            followUp: ['What tools do you use for load testing?', 'How do you handle connection pool exhaustion?', 'What is the difference between throughput and latency optimization?'],
            seniorPerspective: 'The top 5 performance issues I encounter repeatedly: (1) N+1 queries in EF Core, (2) missing database indexes, (3) synchronous HTTP calls blocking thread pool, (4) no caching for expensive operations, (5) large response payloads without pagination. Fixing these covers 90% of cases.',
            architectPerspective: 'Performance is a system property, not a code property. I establish performance budgets (P99 < 200ms), automated load tests in CI/CD, and production performance monitoring with alerting. Performance regression is caught before it reaches production, not after users complain.'
        },
        {
            question: 'What is the N+1 query problem and how do you fix it in EF Core?',
            difficulty: 'easy',
            answer: `<p>The <strong>N+1 problem</strong>: loading a parent entity then lazily loading each child separately — resulting in 1 query for parents + N queries for children. Instead of 1 efficient query, you execute N+1 queries. Fix: eager loading with <code>.Include()</code>, projection with <code>.Select()</code>, or split queries with <code>.AsSplitQuery()</code>.</p>`,
            code: `// THE PROBLEM (N+1):
var orders = await db.Orders.ToListAsync(); // 1 query: all orders
foreach (var order in orders)
{
    Console.WriteLine(order.Customer.Name); // N queries! One per order!
}
// If 100 orders: 101 database queries! Devastating under load.

// FIX 1: Eager loading (.Include)
var orders = await db.Orders
    .Include(o => o.Customer)
    .Include(o => o.OrderLines)
    .ToListAsync(); // 1 query with JOINs

// FIX 2: Projection (load only what you need)
var orderDtos = await db.Orders
    .Select(o => new OrderDto
    {
        Id = o.Id,
        CustomerName = o.Customer.Name,
        LineCount = o.OrderLines.Count,
        Total = o.OrderLines.Sum(l => l.Price * l.Quantity)
    })
    .ToListAsync(); // 1 optimized query, no extra entities loaded

// FIX 3: Split query (avoids cartesian explosion with multiple includes)
var orders = await db.Orders
    .Include(o => o.OrderLines)
    .Include(o => o.Payments)
    .AsSplitQuery() // Separate SQL query per Include (avoids row multiplication)
    .ToListAsync();`,
            language: 'csharp',
            bestPractices: ['Always use .Include() for navigation properties you will access', 'Use projection (.Select) when you only need a subset of fields', 'Use AsSplitQuery() for multiple collection includes (prevents cartesian explosion)', 'Enable EF Core query logging in development to catch N+1 issues early'],
            commonMistakes: ['Accessing navigation properties in loops without Include (silent N+1)', 'Including too many entities (load only what the endpoint needs)', 'Not using AsNoTracking for read-only queries (unnecessary change tracking overhead)', 'Using lazy loading globally (masks N+1 problems until production load hits)'],
            interviewTip: 'This is the single most common EF Core performance issue. Show you know how to detect it (EF Core logging, MiniProfiler) and fix it (Include, projection, split query). Mention the numbers: 100 orders × 1 extra query each = 100x slower than necessary.',
            followUp: ['What is cartesian explosion with multiple Includes?', 'How does AsSplitQuery help?', 'Should you use lazy loading in production?'],
            seniorPerspective: 'I disable lazy loading in all production projects and enforce explicit loading. This makes N+1 impossible — any missing Include causes an immediate null exception during development, not a silent performance issue in production.',
            architectPerspective: 'At the system level, N+1 queries are a symptom of leaky abstractions — the ORM hides database access behind property access, making it invisible. I advocate for the CQRS approach: commands use the domain model (Include as needed), queries use Dapper or raw SQL (no ORM, explicit and fast).'
        },
        {
            question: 'How do you write a trustworthy micro-benchmark with BenchmarkDotNet, and what makes hand-rolled Stopwatch timing unreliable?',
            difficulty: 'medium',
            answer: `<p><strong>BenchmarkDotNet</strong> handles the hard parts of micro-benchmarking that a manual <code>Stopwatch</code> loop gets wrong:</p>
            <ul>
                <li><strong>Warmup &amp; JIT:</strong> it runs warmup iterations so the JIT has tiered-compiled the hot path before measuring — the first call is always slower (cold JIT).</li>
                <li><strong>Multiple iterations + statistics:</strong> it runs many iterations and reports mean, median, standard deviation, and outliers, not a single noisy number.</li>
                <li><strong>Isolation:</strong> each benchmark runs in its own process to avoid interference; it pins runtime and can compare multiple runtimes.</li>
                <li><strong>Allocation tracking:</strong> <code>[MemoryDiagnoser]</code> reports bytes allocated and GC counts per operation.</li>
                <li><strong>Dead-code elimination guard:</strong> returning a value stops the JIT from optimizing the work away.</li>
            </ul>
            <p>A hand-rolled <code>Stopwatch</code> measures cold JIT, ignores GC, has no statistical rigor, and is easily fooled by the optimizer removing unused results.</p>`,
            explanation: 'It is like timing a sprinter with a phone stopwatch on their very first cold step versus using an official timing system after a proper warmup over many runs — the casual measurement is dominated by noise and startup effects.',
            code: `[MemoryDiagnoser]                       // report allocations + GC
[SimpleJob(RuntimeMoniker.Net80)]
public class StringJoinBenchmark
{
    private readonly string[] _items = Enumerable.Range(0, 100)
        .Select(i => i.ToString()).ToArray();

    [Benchmark(Baseline = true)]
    public string Concatenation()        // O(n^2) allocations
    {
        var s = "";
        foreach (var item in _items) s += item + ",";
        return s;                         // return value -> not optimized away
    }

    [Benchmark]
    public string StringBuilderJoin()
    {
        var sb = new StringBuilder();
        foreach (var item in _items) sb.Append(item).Append(',');
        return sb.ToString();
    }

    [Benchmark]
    public string StringJoin() => string.Join(",", _items);
}
// Run: dotnet run -c Release
// Output shows StringJoin is fastest with the fewest allocations.`,
            language: 'csharp',
            bestPractices: ['Always run benchmarks in Release configuration, never Debug', 'Return a value from each benchmark so the JIT cannot eliminate the work', 'Add [MemoryDiagnoser] to see allocations alongside time', 'Compare with [Benchmark(Baseline = true)] to get ratios, not just absolute times'],
            commonMistakes: ['Benchmarking in Debug build (disables optimizations, meaningless numbers)', 'Using a single Stopwatch run that captures cold-JIT and GC noise', 'Not consuming the result, so the optimizer deletes the code being measured', 'Drawing conclusions from differences smaller than the reported standard deviation'],
            interviewTip: 'Emphasize the three things BenchmarkDotNet does that a Stopwatch cannot: warmup for JIT, statistical aggregation over many runs, and allocation tracking. Mention Release-only as a non-negotiable.',
            followUp: ['What does [MemoryDiagnoser] add to the output?', 'Why does the first invocation of a method run slower?', 'How would you benchmark across multiple .NET runtime versions?'],
            seniorPerspective: 'I treat micro-benchmarks as a last-resort tool, not a first one. Most real performance problems live in I/O, queries, and allocations at scale — not in nanosecond differences between two methods. I reach for BenchmarkDotNet only when a hot path is proven (via profiling) to dominate, and I always pair the time numbers with the allocation column, because allocation pressure usually matters more for throughput than raw CPU.',
            architectPerspective: 'I keep a small suite of BenchmarkDotNet benchmarks for genuinely hot, library-level code (serializers, parsers, custom collections) and track results across releases to catch regressions. But I am explicit with teams that micro-benchmark wins rarely move a system-level SLO — those are dominated by network, database, and concurrency. Benchmarks inform local design choices; load tests and production telemetry inform architecture.'
        },
        {
            question: 'What causes GC pressure in a hot path, and what techniques reduce allocations in .NET?',
            difficulty: 'hard',
            answer: `<p><strong>GC pressure</strong> comes from allocating many short-lived objects on the managed heap in a hot path. Each allocation is cheap individually, but high allocation rates trigger frequent Gen 0 collections, and objects that survive get promoted to Gen 1/2 where collections are more expensive and can cause latency spikes (especially blocking GC pauses).</p>
            <p>Common allocation sources: boxing value types, LINQ in hot loops (closures + iterators), string concatenation, params arrays, lambdas capturing variables, and <code>async</code> state machines for trivial methods.</p>
            <p>Techniques to reduce allocations:</p>
            <ul>
                <li><strong><code>Span&lt;T&gt;</code> / <code>ReadOnlySpan&lt;T&gt;</code>:</strong> slice arrays/strings without copying.</li>
                <li><strong><code>stackalloc</code>:</strong> allocate small buffers on the stack (no GC).</li>
                <li><strong>Object/array pooling:</strong> <code>ArrayPool&lt;T&gt;</code> and <code>ObjectPool&lt;T&gt;</code> reuse buffers.</li>
                <li><strong><code>struct</code> for small value-like types,</strong> avoiding boxing and heap allocation.</li>
                <li><strong><code>StringBuilder</code> / string interpolation handlers</strong> instead of repeated concatenation.</li>
                <li><strong><code>ValueTask</code></strong> for hot async methods that often complete synchronously.</li>
            </ul>`,
            explanation: 'Think of the heap as a busy kitchen: if every order uses a new disposable plate (allocation), the dishwasher (GC) runs constantly and occasionally stops the whole kitchen to catch up. Reusing plates (pooling) and using the prep counter for quick jobs (stack/Span) keeps the dishwasher idle.',
            code: `// ALLOCATION-HEAVY: substring + LINQ allocate on every call
public int CountDigitsSlow(string csv)
{
    return csv.Split(',')                       // string[] + N substrings
              .Where(p => int.TryParse(p, out _))
              .Sum(p => p.Length);              // closure + iterator allocations
}

// LOW-ALLOCATION: Span-based parsing, zero heap allocations
public int CountDigitsFast(ReadOnlySpan<char> csv)
{
    int total = 0;
    foreach (var range in csv.Split(','))       // Span enumerator, no array
    {
        var part = csv[range];
        if (int.TryParse(part, out _)) total += part.Length;
    }
    return total;
}

// Pooling a reusable buffer instead of allocating per call
private static readonly ArrayPool<byte> Pool = ArrayPool<byte>.Shared;
public void Process(int size)
{
    byte[] buffer = Pool.Rent(size);
    try { /* use buffer */ }
    finally { Pool.Return(buffer); }            // returned for reuse, not GC'd
}`,
            language: 'csharp',
            bestPractices: ['Profile allocations with dotnet-counters or the VS allocation tool before optimizing', 'Use Span<T>/stackalloc for transient buffers in hot paths', 'Pool large or frequently-reused arrays with ArrayPool<T>', 'Prefer ValueTask for hot async methods that usually complete synchronously'],
            commonMistakes: ['Micro-optimizing allocations in cold code that runs rarely (no benefit)', 'Returning Span<T> from a method that points to stack memory (use-after-free)', 'Forgetting to return rented arrays to the pool (defeats the purpose, can leak)', 'Overusing structs so large they cost more to copy than they save in allocation'],
            interviewTip: 'Connect allocations to latency: high allocation rate means frequent GC, and GC pauses show up as p99 latency spikes. Then list the concrete tools — Span, stackalloc, ArrayPool — and note you only apply them to proven hot paths.',
            followUp: ['What is the difference between Gen 0, Gen 1, and Gen 2 collections?', 'When does Server GC outperform Workstation GC?', 'Why can ValueTask be dangerous if awaited twice?'],
            seniorPerspective: 'Allocation reduction is a scalpel, not a hammer. I have seen developers rewrite readable LINQ into unreadable Span code in a method that runs once per request — net zero gain, big readability loss. I only go low-allocation where a profiler proves the path is hot and GC is actually the cost. There, the wins are real: removing allocations from a per-message handler in a high-throughput service can cut GC pauses and flatten the latency tail dramatically.',
            architectPerspective: 'At scale, GC behavior is an architectural concern. I choose Server GC for throughput services, watch Gen 2 and LOH (large object heap) growth as leading indicators of latency problems, and design high-throughput pipelines (parsers, serializers, message handlers) to be allocation-aware from the start. The goal is predictable tail latency, which allocation discipline protects more than raw CPU optimization does.'
        },
        {
            question: 'How does async/await improve throughput, and why does blocking on async code hurt scalability?',
            difficulty: 'advanced',
            answer: `<p><strong>async/await</strong> improves throughput for I/O-bound work by freeing the thread while waiting. When a request awaits a database query or HTTP call, the thread is returned to the thread pool to serve other requests instead of blocking idle. This lets a small number of threads handle a large number of concurrent requests — the key to server scalability.</p>
            <p><strong>Blocking on async code</strong> (<code>.Result</code>, <code>.Wait()</code>, <code>GetAwaiter().GetResult()</code>) defeats this and causes two problems:</p>
            <ul>
                <li><strong>Thread-pool starvation:</strong> each blocked request holds a thread idle while waiting. Under load, the pool exhausts, new work queues, latency climbs, and the server appears hung — even though CPUs are idle.</li>
                <li><strong>Deadlocks:</strong> in contexts with a synchronization context (legacy ASP.NET, UI), blocking on a task that needs to resume on the same context deadlocks.</li>
            </ul>
            <p>The rule is async all the way: <code>await</code> from the top of the call stack down, never block.</p>`,
            explanation: 'A blocking thread is like a waiter who takes an order then stands frozen at the kitchen until the food is ready, ignoring every other table. Async is the waiter handing the ticket to the kitchen and serving other tables until the food is up — the same staff serves far more customers.',
            code: `// SCALABILITY KILLER: blocks a thread-pool thread per request
public IActionResult GetBlocking(int id)
{
    var order = _repo.GetOrderAsync(id).Result;   // thread blocked while waiting
    return Ok(order);                             // can deadlock + starves pool
}

// SCALABLE: thread is released back to the pool during the await
public async Task<IActionResult> GetAsync(int id)
{
    var order = await _repo.GetOrderAsync(id);    // thread freed during I/O
    return Ok(order);
}

// Parallel independent I/O: await many calls concurrently
public async Task<Dashboard> BuildDashboardAsync(int userId)
{
    var ordersTask = _orders.GetRecentAsync(userId);
    var statsTask  = _stats.GetAsync(userId);
    var feedTask   = _feed.GetAsync(userId);
    await Task.WhenAll(ordersTask, statsTask, feedTask);  // overlap, not serialize
    return new Dashboard(ordersTask.Result, statsTask.Result, feedTask.Result);
}`,
            language: 'csharp',
            bestPractices: ['Use async all the way down — never mix blocking and async on the same call path', 'Use Task.WhenAll to overlap independent I/O instead of awaiting sequentially', 'Use ConfigureAwait(false) in library code to avoid capturing a synchronization context', 'Pass CancellationToken through async calls so requests can be cancelled cleanly'],
            commonMistakes: ['Calling .Result or .Wait() on async code (deadlocks + thread-pool starvation)', 'Using async for CPU-bound work expecting it to speed up (it does not; use parallelism)', 'Awaiting independent calls sequentially when they could run concurrently', 'async void methods (exceptions are unobservable and crash the process)'],
            interviewTip: 'Make the distinction crisp: async/await is about scalability (more concurrent requests per thread), not raw speed of a single request. Then explain thread-pool starvation as the concrete failure mode of blocking — a server that looks hung with idle CPUs.',
            followUp: ['What is the difference between concurrency and parallelism here?', 'Why is async void dangerous?', 'How does ConfigureAwait(false) help in a library?'],
            seniorPerspective: 'The most damaging production incident pattern I see is a single blocking call (often .Result in a library buried in the request path) that quietly starves the thread pool under load. CPU sits near idle, but latency explodes and the service looks dead. Fixing it is rarely about adding threads — it is about removing the block and going async end to end. I audit hot paths specifically for sync-over-async.',
            architectPerspective: 'I treat the async contract as a system-wide invariant: every I/O boundary is async, cancellation tokens flow through, and no layer blocks. This is what lets a modestly-sized fleet absorb high concurrency. For CPU-bound work I deliberately separate the concern — offload to a dedicated worker, queue, or Parallel/PLINQ with bounded degree-of-parallelism — rather than abusing async, which only helps I/O.'
        },
        {
            question: 'When do you scale vertically versus horizontally, and what makes a service horizontally scalable?',
            difficulty: 'expert',
            answer: `<p><strong>Vertical scaling</strong> (scale up) means a bigger machine — more CPU, RAM, faster disk. <strong>Horizontal scaling</strong> (scale out) means more machines/instances behind a load balancer.</p>
            <p><strong>Vertical</strong> is simple (no code changes, no distribution concerns) and ideal for quick headroom or for components that are hard to distribute (a single relational primary). But it has a hard ceiling, gets expensive at the top end, and the machine is a single point of failure.</p>
            <p><strong>Horizontal</strong> scales effectively without limit, adds redundancy (lose a node, stay up), and enables elastic autoscaling — but it requires the service to be <strong>stateless</strong> and introduces distributed-system complexity (load balancing, data consistency, distributed caching).</p>
            <p>What makes a service horizontally scalable:</p>
            <ul>
                <li><strong>Stateless instances:</strong> no in-memory session/state; any instance can serve any request.</li>
                <li><strong>Externalized state:</strong> sessions/cache in Redis, data in a shared store.</li>
                <li><strong>Idempotent, share-nothing request handling</strong> so requests don't depend on a specific node.</li>
                <li><strong>A scalable data tier:</strong> read replicas, partitioning, or sharding so the database isn't the bottleneck.</li>
            </ul>
            <p>Typical strategy: scale up the stateful data tier (within reason) and scale out the stateless app tier.</p>`,
            explanation: 'Vertical scaling is hiring one super-strong worker; horizontal scaling is hiring many ordinary workers. The strong worker is simple to manage but there is a limit to how strong one person can get, and if they call in sick everything stops. A crew keeps working if one is out — but only if the work is organized so any worker can pick up any task.',
            code: `// Horizontal scaling demands STATELESS instances.
// ANTI-PATTERN: in-memory session ties a user to one instance (sticky)
public class CartController : ControllerBase
{
    private static readonly Dictionary<int, Cart> _carts = new(); // breaks scale-out!
    // Instance B has no idea about a cart created on instance A.
}

// SCALABLE: externalize state so any instance can serve any request
public class CartController : ControllerBase
{
    private readonly IDistributedCache _cache;   // Redis - shared across instances
    public CartController(IDistributedCache cache) => _cache = cache;

    public async Task<Cart> GetCartAsync(int userId)
    {
        var json = await _cache.GetStringAsync($"cart:{userId}");
        return json is null ? new Cart() : JsonSerializer.Deserialize<Cart>(json)!;
    }
}
// Now a load balancer can route any request to any instance,
// and autoscaling can add/remove instances freely.`,
            language: 'csharp',
            bestPractices: ['Design app tiers stateless from day one so scale-out is always available', 'Externalize session/cache to Redis and avoid sticky sessions where possible', 'Scale out the stateless tier; scale up (then replica/shard) the data tier', 'Provision horizontal capacity with headroom + N+1 so losing a node does not breach SLO'],
            commonMistakes: ['Storing session/cache in process memory, forcing sticky sessions and blocking scale-out', 'Assuming horizontal scaling fixes a database bottleneck (it just shifts load to the DB)', 'Scaling vertically until you hit the ceiling with no scale-out plan', 'Ignoring distributed concerns (consistency, cache coherence) when scaling out'],
            interviewTip: 'State the trade-off crisply: vertical = simple but capped and a single point of failure; horizontal = unlimited + redundant but requires statelessness. The senior signal is naming statelessness as the precondition for horizontal scaling, and noting the database usually becomes the real limit.',
            followUp: ['Why are sticky sessions a problem for autoscaling?', 'How do you scale the data tier when the app tier is already horizontal?', 'What is the difference between scaling for throughput and for availability?'],
            seniorPerspective: 'In practice the app tier is the easy part — make it stateless and you can scale out almost arbitrarily. The conversation I always steer toward is the data tier, because horizontal app scaling just relocates the bottleneck to the database. So I pair scale-out of the stateless services with a concrete data-scaling plan: caching and read replicas first, partitioning/sharding only when writes or storage genuinely exceed one node. Statelessness is the discipline that keeps the cheap option (add instances) on the table.',
            architectPerspective: 'I design for horizontal scaling as the default and treat vertical scaling as a tactical lever for the few inherently stateful components (typically the relational primary). The architecture principles that make this work — stateless services, externalized state, idempotent handlers, a partitionable data model — are decided early, because retrofitting statelessness onto a system that assumed in-process state is one of the most expensive migrations a team can face. Capacity then becomes an elastic, autoscaled, cost-optimized concern rather than a re-architecture.'
        }
    ,
        {
            question: 'What profiling tools and signals do you use to find a performance problem in production .NET?',
            difficulty: 'advanced',
            answer: `<p>Measure before optimizing, using the right tool for the symptom:</p>
            <ul>
                <li><strong>dotnet-counters</strong> \u2014 live, low-overhead metrics (CPU, GC gen sizes/rate, ThreadPool queue length, exceptions/sec, lock contention). First stop to characterize the problem.</li>
                <li><strong>dotnet-trace / PerfView</strong> \u2014 CPU sampling and ETW events to find hot methods and GC/allocation activity.</li>
                <li><strong>dotnet-gcdump / dotnet-dump</strong> \u2014 heap snapshots to find what is retained (leaks) and analyze with SOS.</li>
                <li><strong>Distributed tracing (OpenTelemetry/App Insights)</strong> \u2014 to locate <em>which hop</em> is slow before profiling a process.</li>
            </ul>
            <p>Key signals: high ThreadPool queue length (starvation), rising gen-2/LOH (leak or churn), high time-in-GC %, lock-contention counts. Diagnose top-down: trace the slow hop, then profile that process.</p>`,
            explanation: 'It is medical diagnosis: vitals first (dotnet-counters), then targeted imaging (trace/heap dump) on the area that looks wrong. You don\u2019t do surgery (optimize) before the scan tells you where the problem is.',
            code: `# Live vitals (CPU, GC, thread pool, contention) \u2014 attach to a running PID
dotnet-counters monitor -p <pid> --counters System.Runtime

# CPU + allocation trace for hot-path analysis (open in PerfView/VS)
dotnet-trace collect -p <pid> --providers Microsoft-DotNETCore-SampleProfiler

# Heap snapshot to investigate a suspected leak
dotnet-gcdump collect -p <pid>`,
            language: 'bash',
            bestPractices: ['Characterize with dotnet-counters before deep profiling', 'Use distributed tracing to find the slow hop before profiling a process', 'Capture heap dumps (gcdump) to diagnose retention/leaks, not guesswork', 'Profile in an environment that mirrors production load and config'],
            commonMistakes: ['Optimizing from intuition without measuring', 'Micro-optimizing CPU when the real cost is a downstream call or GC', 'Profiling on a dev box that does not reproduce prod load', 'Ignoring ThreadPool starvation as a cause of latency spikes'],
            interviewTip: 'Name the actual tooling (dotnet-counters/trace/gcdump, PerfView) and map a symptom to a tool. The senior move is top-down: trace to find the slow hop, then profile that process.',
            followUp: ['How would you detect ThreadPool starvation?', 'What counter tells you GC pressure is the problem?', 'How do you profile a leak vs allocation churn?'],
            seniorPerspective: 'I always start with dotnet-counters in prod because it is nearly free and instantly tells me whether I am CPU-bound, GC-bound, contended, or starved \u2014 which determines the entire direction of the investigation. Guessing wastes hours.',
            architectPerspective: 'Observability is the precondition for performance work: without tracing and runtime counters wired in, every investigation is archaeology. I treat the diagnostic toolchain as part of the platform so any team can go from symptom to root cause quickly.'
        },
        {
            question: 'How do you parallelize CPU-bound work in .NET, and how do Parallel, PLINQ, and Channels differ from async?',
            difficulty: 'advanced',
            answer: `<p>First distinguish the workload: <strong>async/await</strong> is for I/O-bound work (free the thread while waiting); <strong>parallelism</strong> is for CPU-bound work (use multiple cores). Confusing them wastes threads.</p>
            <ul>
                <li><strong>Parallel.For / Parallel.ForEach</strong> \u2014 data parallelism: partition a collection across cores for CPU-heavy per-item work.</li>
                <li><strong>PLINQ (AsParallel)</strong> \u2014 declarative parallel queries; good for CPU-bound transforms, but ordering/merging adds overhead.</li>
                <li><strong>System.Threading.Channels</strong> \u2014 producer/consumer pipelines with backpressure; ideal for streaming work between stages.</li>
                <li><strong>Parallel.ForEachAsync</strong> \u2014 bounded concurrency for many async I/O operations.</li>
            </ul>
            <p>Watch for false sharing, non-thread-safe state, and over-parallelizing tiny work items (scheduling overhead exceeds the gain).</p>`,
            explanation: 'async is one chef who starts the oven and does other prep while it bakes (don\u2019t stand idle). Parallelism is hiring four chefs to chop vegetables at once (more hands for hands-on work). Using four chefs to "wait for the oven" helps nothing \u2014 that\u2019s the async-vs-parallel mistake.',
            code: `// CPU-bound: data parallelism across cores
Parallel.ForEach(images, img => Resize(img));   // each item is CPU-heavy

// PLINQ for parallel transform
var results = data.AsParallel().Select(Heavy).ToArray();

// Bounded concurrency for many async I/O calls
await Parallel.ForEachAsync(urls,
    new ParallelOptions { MaxDegreeOfParallelism = 8 },
    async (url, ct) => await httpClient.GetAsync(url, ct));

// Channel: producer/consumer with backpressure
var ch = Channel.CreateBounded<Work>(100);`,
            language: 'csharp',
            bestPractices: ['Use async for I/O-bound, parallelism for CPU-bound \u2014 do not mix them up', 'Bound concurrency (MaxDegreeOfParallelism) to avoid resource exhaustion', 'Use Channels for streaming producer/consumer stages with backpressure', 'Ensure shared state is thread-safe or partitioned to avoid races/false sharing'],
            commonMistakes: ['Using Task.Run/Parallel to "speed up" I/O-bound work (just wastes threads)', 'Parallelizing tiny work items where scheduling overhead dominates', 'Unbounded parallelism exhausting the thread pool or downstream services', 'Sharing mutable state across parallel iterations without synchronization'],
            interviewTip: 'Lead with the I/O-bound (async) vs CPU-bound (parallel) distinction \u2014 mixing them up is the most common mistake. Then match the tool: Parallel/PLINQ for data parallelism, Channels for pipelines.',
            followUp: ['When does parallelism make things slower?', 'What is false sharing and how do you avoid it?', 'How do Channels provide backpressure?'],
            seniorPerspective: 'The first question I ask is "is this CPU-bound or I/O-bound?" because the answer flips the entire approach. I have seen teams wrap HTTP calls in Task.Run thinking it parallelizes I/O \u2014 it just burns thread-pool threads and can cause starvation.',
            architectPerspective: 'Choosing the right concurrency model per workload shapes throughput and resource use system-wide. Channel-based pipelines with bounded backpressure are my default for streaming workloads because they make load-shedding and flow control explicit rather than emergent.'
        },
        {
            question: 'What is ThreadPool starvation, how does it manifest, and how do you prevent it?',
            difficulty: 'expert',
            answer: `<p><strong>ThreadPool starvation</strong> happens when all pool threads are blocked (or busy) and queued work cannot run. The classic cause is <strong>sync-over-async</strong> \u2014 blocking on async code with <code>.Result</code>/<code>.Wait()</code> \u2014 which ties up a pool thread waiting for a continuation that itself needs a pool thread, creating a feedback loop.</p>
            <p>Symptoms: latency climbs while CPU is <em>low</em>, requests time out, and the ThreadPool slowly injects threads (one every ~500ms by default), so recovery is sluggish. Prevent it by going <strong>async all the way</strong> (never block on async), avoiding long synchronous/blocking calls on pool threads, using dedicated threads for long CPU work, and watching the ThreadPool queue-length counter.</p>`,
            explanation: 'It is a restaurant where every waiter is standing frozen waiting for a chef who is also a waiter. New customers pile up at the door even though the kitchen isn\u2019t busy \u2014 the staff are all blocked waiting on each other instead of serving.',
            code: `// CAUSE: sync-over-async blocks a pool thread waiting on async work
public IActionResult Bad()
{
    var data = _service.GetAsync().Result;   // blocks a ThreadPool thread \u2014 starvation risk
    return Ok(data);
}

// FIX: async all the way down \u2014 the thread is released while awaiting
public async Task<IActionResult> Good()
{
    var data = await _service.GetAsync();    // no thread blocked
    return Ok(data);
}
// Monitor: dotnet-counters -> ThreadPool Queue Length climbing while CPU is low`,
            language: 'csharp',
            bestPractices: ['Go async all the way \u2014 never call .Result/.Wait() on async code in request paths', 'Keep blocking/long-CPU work off ThreadPool threads (dedicated threads/Channels)', 'Monitor ThreadPool queue length and thread count as starvation signals', 'Set a sensible minimum thread count only as a stopgap, not a cure'],
            commonMistakes: ['Sync-over-async (.Result/.Wait) in web request handlers', 'Long blocking calls (sync I/O, Thread.Sleep) on pool threads', 'Diagnosing as "need more CPU" when CPU is actually idle', 'Relying on raising minThreads instead of removing the blocking'],
            interviewTip: 'The tell-tale signal is high latency with low CPU \u2014 say that explicitly. Root cause is almost always sync-over-async; the fix is async all the way, not more threads.',
            followUp: ['Why does sync-over-async cause a feedback loop?', 'How does the ThreadPool inject threads, and why is that slow?', 'When is raising minThreads justified?'],
            seniorPerspective: 'When I see latency spike while CPU sits low, ThreadPool starvation from a stray .Result is my first hypothesis. Bumping minThreads can mask it temporarily, but the only real fix is making the path async end to end.',
            architectPerspective: 'Starvation is why "async all the way" is an architectural rule, not a style preference \u2014 a single blocking call deep in a hot path can throttle an entire service. I enforce it with analyzers and code review because the failure mode is non-obvious and systemic.'
        }
    ]
});
