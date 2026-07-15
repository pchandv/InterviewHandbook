/* ═══════════════════════════════════════════════════════════════════
   C# — Memory Management, GC, IDisposable, Span<T>, Object Pooling
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('csharp-memory', {
    title: 'Memory Management',
    description: 'Understanding stack vs heap, garbage collection generations, IDisposable pattern, Span<T>, Memory<T>, object pooling, and diagnosing memory issues in production.',
    sections: [
        {
            title: 'Stack vs Heap',
            content: `<p>The .NET runtime uses two primary memory regions: the <strong>stack</strong> (fast, LIFO, per-thread, automatic cleanup) and the <strong>heap</strong> (managed by GC, shared across threads, longer-lived objects).</p>
            <ul>
                <li><strong>Stack</strong> — value types (local variables), method parameters, return addresses. Fixed size (~1MB per thread). Freed automatically when method returns.</li>
                <li><strong>Heap</strong> — reference types (objects, arrays, strings). Managed by GC. Objects survive until no references exist.</li>
                <li><strong>LOH</strong> — Large Object Heap for objects >= 85KB. Collected less frequently, not compacted by default.</li>
            </ul>`,
            code: `// Stack allocation:
void Calculate()
{
    int x = 42;              // Stack — 4 bytes
    double y = 3.14;         // Stack — 8 bytes
    Span<byte> buf = stackalloc byte[256]; // Stack — 256 bytes
    Point p = new Point(1, 2); // Stack (if Point is struct)
} // ALL freed instantly when method returns — no GC!

// Heap allocation:
void CreateObjects()
{
    var user = new User("Alice"); // Heap — GC manages lifetime
    var list = new List<int>();   // Heap — internal array on heap
    string name = "Hello";        // Heap (interned string pool)
    int[] arr = new int[100];     // Heap — arrays are always on heap
}

// Memory layout of a reference type on heap:
// [Sync Block (8 bytes)] [Method Table Ptr (8 bytes)] [Fields...]
// Minimum object size: 24 bytes on 64-bit (even an empty class!)

// struct on stack vs heap:
public struct Point { public int X, Y; } // 8 bytes, inline

Point local = new Point(1, 2);    // Stack — inline 8 bytes
Point[] array = new Point[100];   // Heap, but Points are inline (contiguous)
object boxed = local;              // HEAP — boxing allocates 24+ bytes!

// Key insight: arrays of structs are cache-friendly (contiguous memory)
// arrays of classes have pointer indirection (cache misses)`,
            language: 'csharp'
        },
        {
            title: 'Garbage Collection — Generations & Modes',
            content: `<p>The .NET GC is <strong>generational</strong> (Gen 0/1/2), <strong>mark-and-sweep</strong>, and <strong>compacting</strong>. It operates on the hypothesis that most objects die young — so it collects Gen 0 frequently and Gen 2 rarely.</p>`,
            code: `// Generation lifecycle:
// 1. Object allocated → Gen 0 (nursery)
// 2. Survives Gen 0 collection → promoted to Gen 1
// 3. Survives Gen 1 collection → promoted to Gen 2
// 4. Gen 2 + LOH collected during full GC (most expensive)

// GC Modes:
// Workstation GC — single thread, lower latency, less throughput
//   Best for: desktop apps, services with few cores
// Server GC — one GC thread per core, higher throughput, more memory
//   Best for: ASP.NET Core APIs, high-throughput services

// Configuration in .csproj or runtimeconfig.json:
// <ServerGarbageCollection>true</ServerGarbageCollection>
// <ConcurrentGarbageCollection>true</ConcurrentGarbageCollection>

// Monitoring GC (NEVER call GC.Collect in production):
Console.WriteLine($"Gen 0 collections: {GC.CollectionCount(0)}");
Console.WriteLine($"Gen 1 collections: {GC.CollectionCount(1)}");
Console.WriteLine($"Gen 2 collections: {GC.CollectionCount(2)}");
Console.WriteLine($"Total memory: {GC.GetTotalMemory(false):N0}");

// GC pressure indicators:
// - % Time in GC > 5% = problem
// - Gen 2 collections frequent = long-lived allocations accumulating
// - LOH allocations frequent = large arrays being created/discarded

// .NET 8+ DATAS (Dynamic Adaptation To Application Sizes)
// GC auto-tunes heap size based on container memory limits
// Set container memory limit: docker run --memory 512m

// GC regions (.NET 7+):
// Replaces segments with smaller regions for better memory utilization
// Especially beneficial for server GC with many heaps`,
            language: 'csharp',
            callout: { type: 'warning', title: 'Never GC.Collect() in Production', text: 'GC.Collect() forces a blocking full collection, pausing ALL threads. The GC is self-tuning — forcing collection disrupts its heuristics and typically makes performance worse. The only valid use is benchmarking to establish a clean baseline.' }
        },
        {
            title: 'IDisposable & Resource Management',
            content: `<p>The <code>IDisposable</code> pattern provides deterministic cleanup of unmanaged resources (file handles, DB connections, network sockets). The <code>using</code> statement guarantees <code>Dispose()</code> is called even if exceptions occur.</p>`,
            code: `// Basic IDisposable usage
using var connection = new SqlConnection(connStr); // Disposed at end of scope
using var reader = await command.ExecuteReaderAsync();

// Classic using block (explicit scope)
using (var stream = File.OpenRead("data.bin"))
{
    // stream is disposed when block exits (even on exception)
}

// Implementing IDisposable — the full pattern
public class DatabaseService : IDisposable
{
    private SqlConnection? _connection;
    private bool _disposed;

    public DatabaseService(string connectionString)
    {
        _connection = new SqlConnection(connectionString);
    }

    public void DoWork()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        // ... use _connection
    }

    // Protected virtual for inheritance
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                // Managed resources
                _connection?.Dispose();
                _connection = null;
            }
            // Unmanaged resources (if any) cleaned here
            _disposed = true;
        }
    }

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this); // Prevent finalizer from running
    }
}

// IAsyncDisposable for async cleanup (.NET Core 3+)
public class AsyncService : IAsyncDisposable
{
    private readonly HttpClient _client = new();
    
    public async ValueTask DisposeAsync()
    {
        await FlushBuffersAsync();
        _client.Dispose();
    }
}

// Usage:
await using var service = new AsyncService();`,
            language: 'csharp'
        },
        {
            title: 'Object Pooling & Zero-Allocation Patterns',
            content: `<p>For high-throughput systems, reducing allocations directly reduces GC pauses. <strong>Object pooling</strong> reuses objects instead of allocating/collecting them, and <strong>Span&lt;T&gt;/stackalloc</strong> avoids heap entirely.</p>`,
            code: `// ArrayPool<T> — reuse arrays instead of allocating new ones
byte[] buffer = ArrayPool<byte>.Shared.Rent(4096); // Get from pool
try
{
    int bytesRead = await stream.ReadAsync(buffer);
    ProcessData(buffer.AsSpan(0, bytesRead));
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer, clearArray: true); // Return to pool
}

// ObjectPool<T> (Microsoft.Extensions.ObjectPool)
var policy = new DefaultPooledObjectPolicy<StringBuilder>();
var pool = new DefaultObjectPool<StringBuilder>(policy, maximumRetained: 100);

var sb = pool.Get();
try
{
    sb.Clear();
    sb.Append("Building report...");
    return sb.ToString();
}
finally
{
    pool.Return(sb);
}

// stackalloc — allocate on stack (zero GC pressure)
Span<char> buffer = stackalloc char[128];
if (value.TryFormat(buffer, out int written))
{
    ReadOnlySpan<char> formatted = buffer[..written];
    // Use formatted — no heap allocation at all!
}

// RecyclableMemoryStream — pooled MemoryStream for high-throughput I/O
var manager = new RecyclableMemoryStreamManager();
using var stream = manager.GetStream("serialize");
await JsonSerializer.SerializeAsync(stream, data);

// String.Create — allocate string and fill in-place (no intermediate buffer)
string result = string.Create(length, state, (span, s) =>
{
    // Write directly into the string's memory
    s.AsSpan().CopyTo(span);
});`,
            language: 'csharp',
            callout: { type: 'info', title: 'When to Pool', text: 'Pool objects that are: (1) expensive to create, (2) created/destroyed frequently, (3) short-lived. Don\'t pool cheap objects — the pooling overhead itself has a cost. Profile first with BenchmarkDotNet.' }
        }
    ],
    questions: [
        {
            question: 'Explain the .NET garbage collector generations. Why does it use a generational approach?',
            difficulty: 'medium',
            answer: `<p>The .NET GC divides objects into three generations (0, 1, 2) based on survival count. It collects Gen 0 frequently (milliseconds), Gen 1 less often, and Gen 2 rarely (full GC). This is based on the <strong>generational hypothesis</strong>: most objects die young, so checking young objects frequently and old objects rarely is efficient.</p>
            <ul>
                <li><strong>Gen 0</strong> (~256KB threshold) — newly allocated. Collected most often. Fast: small area to scan.</li>
                <li><strong>Gen 1</strong> — survived one collection. Buffer zone between short and long-lived.</li>
                <li><strong>Gen 2</strong> — survived multiple collections. Includes LOH (≥85KB objects). Full GC is expensive.</li>
            </ul>`,
            code: `// Object lifecycle through generations:
var temp = new byte[100];    // Gen 0
// GC runs Gen 0...
// 'temp' is unreachable → collected (never leaves Gen 0)

var cache = new Dictionary<string, object>(); // Gen 0
// GC runs Gen 0... 'cache' survives → promoted to Gen 1
// GC runs Gen 1... 'cache' survives → promoted to Gen 2
// 'cache' stays in Gen 2 for the app's lifetime

// Why generational is efficient:
// - Gen 0 is tiny (~256KB) → scanning is fast
// - 90%+ of objects die in Gen 0 → most work is cheap
// - Gen 2 full collections are rare → expensive ops happen infrequently

// Monitoring in production:
// dotnet-counters monitor --process-id <pid>
//   gen-0-gc-count, gen-1-gc-count, gen-2-gc-count
//   gc-heap-size, time-in-gc

// Signs of GC pressure:
// - High Gen 0 rate → allocating too fast (reduce allocations)
// - High Gen 2 rate → long-lived objects accumulating (check for leaks)
// - Time in GC > 5% → significant throughput loss

// Solutions by generation:
// Gen 0 pressure: use Span<T>, stackalloc, object pooling
// Gen 2 pressure: fix memory leaks, use weak references for caches
// LOH pressure: use ArrayPool, RecyclableMemoryStream`,
            language: 'csharp',
            bestPractices: [
                'Design for short-lived objects (die in Gen 0) or very long-lived (static singletons)',
                'Avoid mid-life crisis objects that survive to Gen 1/2 then die (worst case for GC)',
                'Use dotnet-counters and Application Insights to monitor GC metrics',
                'Configure Server GC for multi-core API servers, Workstation for desktop'
            ],
            commonMistakes: [
                'Calling GC.Collect() thinking it helps (disrupts GC heuristics)',
                'Creating large temporary arrays (LOH allocations are expensive)',
                'Holding references to objects longer than needed (prevents promotion avoidance)',
                'Not understanding that finalizers delay collection by one generation'
            ],
            interviewTip: 'Draw the generation diagram with promotion arrows. Explain the generational hypothesis with a real analogy: "It\'s like sorting recycling — check the kitchen bin daily (Gen 0), garage monthly (Gen 2)." Mention concrete thresholds.',
            followUp: ['What triggers a GC collection?', 'What is the LOH and why is it special?', 'How do finalizers affect GC?', 'What is Server GC vs Workstation GC?'],
            seniorPerspective: 'I set up GC dashboards (via EventCounters) for all production services. When Gen 2 collection count spikes, it\'s usually a memory leak in a cache or event handler subscription. I use dotMemory snapshots to find the root cause.',
            architectPerspective: 'In containerized microservices, GC behavior interacts with Kubernetes memory limits. A Gen 2 collection can spike memory temporarily, triggering OOM kills. I configure GC heap hard limits (GCHeapHardLimit) to match container memory minus 20% headroom.'
        },
        {
            question: 'What is the IDisposable pattern and when should you implement it?',
            difficulty: 'medium',
            answer: `<p>The <code>IDisposable</code> pattern provides <strong>deterministic cleanup</strong> of resources that the GC cannot manage automatically — file handles, database connections, network sockets, unmanaged memory. Implement it when your class owns resources that must be released promptly rather than waiting for GC finalization.</p>`,
            code: `// When to implement IDisposable:
// 1. Your class OWNS another IDisposable resource
// 2. Your class holds unmanaged resources (P/Invoke handles)
// 3. Your class subscribes to events (to unsubscribe)

// Modern simplified pattern (no finalizer needed for managed-only):
public sealed class ApiClient : IDisposable
{
    private HttpClient? _client = new();
    private bool _disposed;

    public async Task<string> FetchAsync(string url)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        return await _client!.GetStringAsync(url);
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            _client?.Dispose();
            _client = null;
            _disposed = true;
        }
    }
}

// Full pattern (needed ONLY with unmanaged resources or inheritance):
public class UnmanagedWrapper : IDisposable
{
    private IntPtr _nativeHandle; // Unmanaged resource
    private Stream? _stream;      // Managed resource
    private bool _disposed;

    ~UnmanagedWrapper() => Dispose(disposing: false); // Finalizer: safety net

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _stream?.Dispose(); // Only cleanup managed in Dispose(true)
            }
            // Always clean unmanaged:
            if (_nativeHandle != IntPtr.Zero)
            {
                NativeMethods.CloseHandle(_nativeHandle);
                _nativeHandle = IntPtr.Zero;
            }
            _disposed = true;
        }
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this); // Skip finalizer — already cleaned up
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Always use using/await using statements for IDisposable objects',
                'Implement IDisposable when your class OWNS other disposable resources',
                'Use the sealed + simple pattern unless you need inheritance or unmanaged resources',
                'Call GC.SuppressFinalize only when you have a finalizer'
            ],
            commonMistakes: [
                'Not disposing HttpClient properly (use IHttpClientFactory instead)',
                'Implementing finalizers unnecessarily (adds GC overhead even if never called)',
                'Disposing objects you don\'t own (DI container manages service lifetimes)',
                'Forgetting IAsyncDisposable for async cleanup (database connections, streams)'
            ],
            interviewTip: 'Know when you DON\'T need the full finalizer pattern — most classes only hold managed IDisposable resources and should use the simple sealed pattern. The full pattern with finalizer is rare (P/Invoke, COM interop).',
            followUp: ['What is the difference between Dispose and Finalize?', 'Why call GC.SuppressFinalize?', 'What is IAsyncDisposable?', 'How does DI manage disposable services?'],
            seniorPerspective: 'In modern .NET, I rarely write finalizers. DI container handles service disposal, HttpClientFactory handles HttpClient, and EF Core manages DbContext lifetime. The key is knowing WHEN you own the resource vs when the framework does.',
            architectPerspective: 'At the system level, resource leaks (undisposed connections, file handles) cause cascading failures under load. I enforce Roslyn analyzers (CA2000, CA1001) that flag undisposed resources at build time.'
        },
        {
            question: 'What is Span<T> and how does it help performance? What are its limitations?',
            difficulty: 'advanced',
            answer: `<p><code>Span&lt;T&gt;</code> is a ref struct providing a type-safe, bounds-checked view over contiguous memory — arrays, stackalloc, or native buffers — without heap allocation. It enables zero-copy slicing and high-performance parsing by avoiding array copies and string allocations.</p>`,
            code: `// Span over array — zero-copy slice
int[] data = { 1, 2, 3, 4, 5, 6, 7, 8 };
Span<int> slice = data.AsSpan(2, 4); // [3, 4, 5, 6] — no copy!
slice[0] = 99; // Modifies original array!

// Span over stackalloc — pure stack, zero GC
Span<byte> buffer = stackalloc byte[256];
int written = Encoding.UTF8.GetBytes("Hello", buffer);
ProcessBytes(buffer[..written]);

// String parsing without allocation
ReadOnlySpan<char> line = "name=Alice;age=30;dept=Engineering".AsSpan();
foreach (var segment in line.Split(';')) // .NET 8 MemoryExtensions.Split
{
    var part = line[segment];
    int eq = part.IndexOf('=');
    var key = part[..eq];
    var value = part[(eq + 1)..];
    // No string allocations! All views into original span
}

// Memory<T> — heap-storable alternative to Span
// Use when you need to store the reference or use in async methods
Memory<byte> memory = new byte[1024];
await ProcessAsync(memory); // OK — Memory works in async!

// LIMITATIONS of Span<T>:
// 1. Cannot store on heap (no class fields, no boxing)
// 2. Cannot use in async methods (stack-only lifetime)
// 3. Cannot use in lambdas/closures
// 4. Cannot use in iterators (yield return)

// class MyClass { Span<int> field; } // ERROR: ref struct cannot be field
// async Task Foo(Span<int> span) { } // ERROR: cannot use in async

// Solution: Use Memory<T> when you need heap storage or async
public async Task ProcessAsync(Memory<byte> data)
{
    // Memory<T> stores on heap, .Span gives temporary Span access
    DoWork(data.Span); // Get Span only for synchronous section
    await Task.Delay(100);
    DoMoreWork(data.Span);
}`,
            language: 'csharp',
            bestPractices: [
                'Use Span<T> for synchronous hot paths (parsing, formatting, buffer manipulation)',
                'Use Memory<T> when you need async or heap storage',
                'Combine stackalloc + Span for zero-allocation temporary buffers',
                'Use ReadOnlySpan<char> for string manipulation without allocation'
            ],
            commonMistakes: [
                'Trying to store Span<T> in a class field (it is a ref struct)',
                'Using Span in async methods (use Memory<T> instead)',
                'Creating Span over data that might be collected (dangling reference)',
                'Not understanding that Span is stack-only and cannot escape the method'
            ],
            interviewTip: 'Explain WHY Span is stack-only: it contains a managed pointer (ref T) + length. The GC cannot track interior pointers across suspension points (await). Memory<T> wraps an array with offset/length — heap-safe but slightly slower.',
            followUp: ['What is the difference between Span and Memory?', 'Why can\'t Span be used in async?', 'How does System.IO.Pipelines use Memory<T>?'],
            seniorPerspective: 'Switching string.Substring to ReadOnlySpan<char> slicing in our JSON parser reduced allocations by 85% and improved throughput by 3x. Span is the single most impactful performance tool in modern .NET.',
            architectPerspective: 'In I/O-heavy systems (API gateways, message brokers), the Pipelines API (PipeReader/PipeWriter) with Memory<T> enables zero-copy processing of network buffers — the same pattern Kestrel uses internally for HTTP parsing.'
        },
        {
            question: 'How do you diagnose and fix memory leaks in a .NET application?',
            difficulty: 'expert',
            answer: `<p>Memory leaks in .NET occur when objects remain referenced (rooted) unintentionally — event subscriptions, static collections, closures, or undisposed resources. Diagnosis involves capturing memory snapshots, analyzing retention paths, and identifying which objects are growing unexpectedly.</p>`,
            code: `// Common leak sources:

// 1. Event handler subscription without unsubscription
public class Subscriber
{
    public Subscriber(Publisher pub)
    {
        pub.DataReceived += OnDataReceived; // LEAK: pub holds ref to this!
    }
    // Fix: implement IDisposable, unsubscribe in Dispose
}

// 2. Static collections that grow unbounded
public static class Cache
{
    static readonly Dictionary<string, object> _items = new(); // Never shrinks!
    public static void Add(string key, object val) => _items[key] = val;
    // Fix: use MemoryCache with expiration, or ConcurrentDictionary with eviction
}

// 3. Closures capturing large objects
byte[] largeBuffer = new byte[10_000_000];
var timer = new Timer(_ =>
{
    // Lambda captures 'largeBuffer' — it can never be GC'd!
    Log(largeBuffer.Length);
}, null, 0, 1000);

// 4. HttpClient misuse (socket exhaustion)
// BAD: new HttpClient() per request → sockets in TIME_WAIT
// FIX: IHttpClientFactory or static singleton

// DIAGNOSTIC TOOLS:
// 1. dotnet-dump — capture heap snapshot
//    dotnet-dump collect --process-id <pid>
//    dotnet-dump analyze <dump-file>
//    > dumpheap -stat         (top objects by count/size)
//    > dumpheap -type String  (all strings on heap)
//    > gcroot <address>       (why object is alive)

// 2. dotnet-counters — real-time GC metrics
//    dotnet-counters monitor --process-id <pid>

// 3. Visual Studio / JetBrains dotMemory
//    Take snapshots, compare, find retention paths

// 4. EventCounters in code:
var listener = new EventListener();
// Subscribe to "System.Runtime" for GC counters

// Production-safe leak detection pattern:
public class LeakDetector : IHostedService
{
    private readonly ILogger _logger;
    private Timer? _timer;

    public Task StartAsync(CancellationToken ct)
    {
        _timer = new Timer(CheckMemory, null, TimeSpan.Zero, TimeSpan.FromMinutes(5));
        return Task.CompletedTask;
    }

    private void CheckMemory(object? state)
    {
        var info = GC.GetGCMemoryInfo();
        _logger.LogInformation("Heap: {Heap:N0}, Committed: {Committed:N0}, Gen2: {Gen2}",
            info.HeapSizeBytes, info.TotalCommittedBytes, GC.CollectionCount(2));
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Monitor GC metrics in production (Gen 2 count, heap size, % time in GC)',
                'Use MemoryCache with size limits and expiration instead of static dictionaries',
                'Always unsubscribe from events in Dispose',
                'Use weak references for caches that should be GC-collectible'
            ],
            commonMistakes: [
                'Assuming GC prevents all memory leaks (references keep objects alive)',
                'Not profiling until production incidents occur (profile during development)',
                'Using static collections as unbounded caches without eviction',
                'Forgetting that timers and event handlers are GC roots'
            ],
            interviewTip: 'Walk through a systematic debugging process: (1) observe symptoms (growing memory), (2) take heap snapshots, (3) compare snapshots to find growing types, (4) find retention paths with gcroot, (5) fix the root reference. Show you\'ve done this in production.',
            followUp: ['What tools do you use for memory profiling?', 'How do weak references help with caches?', 'What is the difference between a memory leak and GC pressure?'],
            seniorPerspective: 'My production debugging workflow: dotnet-counters to confirm leak → dotnet-dump to capture snapshot → analyze with gcroot to find the root. 90% of leaks I\'ve found are event subscriptions or static dictionary caches without eviction.',
            architectPerspective: 'Memory leaks in long-running services compound: a 1MB/hour leak takes days to notice but crashes pods at 3am. I implement memory pressure monitors that alert before OOM, and establish maximum working set thresholds in health checks.'
        },
        {
            question: 'What is the Large Object Heap (LOH), why is it treated differently, and how do you avoid fragmentation?',
            difficulty: 'advanced',
            answer: `<p>The <strong>Large Object Heap</strong> stores objects of <strong>85,000 bytes or more</strong> (mainly large arrays). It is collected only during a <strong>Gen 2 (full) collection</strong> and, by default, is <strong>not compacted</strong> — so freed gaps are reused rather than squeezed out. Repeated allocate/free of differently sized large buffers causes <strong>fragmentation</strong>: free space exists but no single gap is big enough, inflating committed memory and risking OutOfMemoryException.</p>`,
            explanation: `The LOH is like a warehouse for oversized crates. Moving big crates around is expensive, so the warehouse leaves gaps when crates leave. Over time you get many awkward gaps and cannot fit a new big crate even though total free space looks sufficient.`,
            code: `// Anything >= 85,000 bytes goes on the LOH:
byte[] small = new byte[80_000];   // small object heap (Gen 0)
byte[] large = new byte[100_000];  // LARGE OBJECT HEAP

// FRAGMENTATION pattern to avoid: churn of varied large buffers
for (int i = 0; i < 10_000; i++)
{
    var buffer = new byte[90_000 + i]; // each slightly different size
    Process(buffer);                    // freed buffers leave mismatched gaps
}

// FIX 1: pool and reuse fixed-size buffers (no LOH churn)
byte[] buf = ArrayPool<byte>.Shared.Rent(128 * 1024);
try { ProcessInto(buf); }
finally { ArrayPool<byte>.Shared.Return(buf); }

// FIX 2: chunk work so individual buffers stay under 85KB
const int ChunkSize = 81_920; // < 85,000 -> stays off the LOH

// FIX 3: stream instead of buffering whole payloads
using var pooled = _recyclableStreamManager.GetStream();
await JsonSerializer.SerializeAsync(pooled, data);

// LAST RESORT: opportunistic LOH compaction (do not do this routinely)
GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce;
GC.Collect(); // blocking, expensive -> only at a known idle point

// Monitoring:
var info = GC.GetGCMemoryInfo();
Console.WriteLine($"Fragmented bytes: {info.FragmentedBytes:N0}");`,
            language: 'csharp',
            bestPractices: [
                'Pool large buffers with ArrayPool<T> instead of allocating fresh arrays',
                'Keep buffer sizes consistent so freed gaps are reusable',
                'Chunk large I/O into sub-85KB segments to keep data off the LOH',
                'Use RecyclableMemoryStream for high-throughput serialization'
            ],
            commonMistakes: [
                'Allocating many differently sized large arrays in a tight loop',
                'Routinely forcing LOH compaction with GC.Collect (blocking, hurts throughput)',
                'Assuming the LOH is compacted like the small object heap (it is not by default)',
                'Ignoring FragmentedBytes when diagnosing rising committed memory'
            ],
            interviewTip: 'Lead with the 85,000-byte threshold and the two distinguishing facts: collected only in Gen 2 and not compacted by default. Then connect fragmentation to ArrayPool as the standard mitigation.',
            followUp: ['Why is the LOH threshold 85,000 bytes?', 'How does ArrayPool reduce LOH pressure?', 'When is LOH compaction justified?'],
            seniorPerspective: `When committed memory climbs while live objects stay flat, I check FragmentedBytes — it is usually LOH fragmentation from large-buffer churn. Switching to ArrayPool with fixed bucket sizes almost always fixes it without forcing compaction.`,
            architectPerspective: `In high-throughput services (serializers, file/network pipelines), LOH discipline is an architectural concern. We standardize on pooled, fixed-size buffers and streaming APIs so steady-state allocation stays off the LOH entirely, keeping GC pauses predictable.`
        },
        {
            question: 'When and how should you use object pooling (ArrayPool<T>, ObjectPool<T>)? What are the pitfalls?',
            difficulty: 'hard',
            answer: `<p>Object pooling reuses instances instead of allocating and collecting them, cutting GC pressure for objects that are <strong>expensive to create and used frequently and briefly</strong>. <code>ArrayPool&lt;T&gt;</code> pools arrays (buffers); <code>ObjectPool&lt;T&gt;</code> pools reference objects like <code>StringBuilder</code>. The risk is in <strong>correct lifetime management</strong>: returning too early, using after return, or leaking pooled instances.</p>`,
            explanation: `Pooling is a library of reference books: you borrow one, use it, and return it for the next reader. Trouble starts if you keep reading after returning it, or hand the same book to two readers at once.`,
            code: `// ArrayPool<T>: rent -> use -> return in a finally
byte[] buffer = ArrayPool<byte>.Shared.Rent(minimumLength: 4096);
try
{
    int read = await stream.ReadAsync(buffer.AsMemory(0, 4096));
    Process(buffer.AsSpan(0, read));
}
finally
{
    // clearArray: true wipes sensitive data before reuse
    ArrayPool<byte>.Shared.Return(buffer, clearArray: true);
}
// NOTE: Rent may return a LARGER array than requested -> always track length

// ObjectPool<T> for reusable mutable objects
var provider = new DefaultObjectPoolProvider();
ObjectPool<StringBuilder> pool = provider.CreateStringBuilderPool();

var sb = pool.Get();
try
{
    sb.Append("report");          // reset state on get/return
    return sb.ToString();
}
finally
{
    pool.Return(sb);              // pool resets length for StringBuilder
}

// PITFALL: use-after-return (corruption / data races)
var rented = ArrayPool<byte>.Shared.Rent(1024);
ArrayPool<byte>.Shared.Return(rented);
rented[0] = 1;                    // BUG: another caller may now own this array!

// When NOT to pool: cheap, rarely-created objects -> pooling overhead wins`,
            language: 'csharp',
            bestPractices: [
                'Rent and Return in a try/finally so buffers are always returned',
                'Track the requested length; Rent can hand back a larger array',
                'Pass clearArray: true when buffers held sensitive data',
                'Profile with BenchmarkDotNet first; only pool hot, expensive, short-lived objects'
            ],
            commonMistakes: [
                'Using a buffer after returning it to the pool',
                'Returning the same array twice (double-return corrupts the pool)',
                'Assuming Rent returns exactly the requested size',
                'Pooling cheap objects where allocation was never the bottleneck'
            ],
            interviewTip: 'Show the rent/use/return-in-finally discipline and call out that Rent can return an oversized array. Mention use-after-return as the classic bug — it behaves like a use-after-free in unmanaged code.',
            followUp: ['How does ArrayPool.Shared differ from a custom pool?', 'Why does Rent return a possibly larger array?', 'How do you decide what is worth pooling?'],
            seniorPerspective: `I reserve pooling for proven hot paths: network buffers, serialization scratch space, parsers. I always benchmark before and after, because misapplied pooling adds complexity and can even slow code that was not allocation-bound.`,
            architectPerspective: `Pooling is core to high-performance .NET infrastructure — Kestrel, System.IO.Pipelines, and gRPC all pool buffers to hold steady-state allocation near zero. The architectural tradeoff is added lifetime-management complexity in exchange for predictable GC behavior under load.`
        }
    ,
        {
            question: 'Explain value types vs reference types, where each lives, and the real cost of boxing.',
            difficulty: 'hard',
            answer: `<p><strong>Value types</strong> (struct, int, enum) hold their data inline; <strong>reference types</strong> (class) hold a reference to data on the managed heap. Locals of value type typically live on the stack, but a value type embedded in a class lives on the heap with its owner \u2014 "stack vs heap" is about <em>where it is stored</em>, not the type itself.</p>
            <p><strong>Boxing</strong> wraps a value type in a heap object to treat it as <code>object</code>/an interface; <strong>unboxing</strong> copies it back. The cost is a heap allocation + copy + GC pressure, and it is easy to trigger accidentally (adding structs to a non-generic collection, <code>string.Format</code> with value args, calling an interface method on a struct).</p>`,
            explanation: 'A value type is the actual item; a reference type is a sticky note with the item\u2019s address. Boxing is putting the item in a shipping box just so it fits on a shelf built for boxes \u2014 you pay for the box and the packing every time.',
            code: `int x = 42;
object boxed = x;        // BOX: heap allocation + copy
int y = (int)boxed;      // UNBOX: copy back

// Accidental boxing in a hot path:
ArrayList list = new();  // non-generic -> boxes every int
list.Add(42);            // boxed!
List<int> ok = new();    // generic -> no boxing
ok.Add(42);

// Interface call on a struct can box unless constrained generics are used
void Print<T>(T v) where T : IFormattable => Console.WriteLine(v.ToString(null, null)); // no box`,
            language: 'csharp',
            bestPractices: ['Use generics (List<T>) instead of non-generic collections to avoid boxing', 'Use constrained generics (where T : IFormattable) so interface calls on structs do not box', 'Keep structs small and avoid passing them as object/interface in hot paths', 'Profile allocations to catch hidden boxing in tight loops'],
            commonMistakes: ['Believing all value types live on the stack (a struct field of a class is on the heap)', 'Accidental boxing via non-generic collections, string formatting, or interface calls', 'Using large mutable structs that get copied repeatedly', 'Assuming boxing is free \u2014 it allocates and pressures the GC'],
            interviewTip: 'Correct the "stack vs heap = value vs reference" oversimplification: storage location depends on context. Then name concrete accidental-boxing triggers \u2014 that detail signals real experience.',
            followUp: ['How would you detect boxing in production?', 'When does a struct live on the heap?', 'How do constrained generics avoid boxing?'],
            seniorPerspective: 'The boxing that hurts is the invisible kind \u2014 an interface call on a struct inside a million-iteration loop. I hunt it with allocation profiling rather than reasoning about it, because it rarely appears where you expect.',
            architectPerspective: 'Value vs reference semantics ripple through API design: exposing mutable structs invites defensive-copy bugs, while well-designed readonly structs cut allocations on hot paths. It is a deliberate performance/correctness trade-off, not an afterthought.'
        },
        {
            question: 'What are stackalloc and ref structs, and how do they enable allocation-free hot paths?',
            difficulty: 'advanced',
            answer: `<p><code>stackalloc</code> allocates a buffer on the stack rather than the heap, so it incurs no GC cost and is freed automatically when the method returns. Combined with <code>Span&lt;T&gt;</code> it gives a safe, bounds-checked view over that stack memory.</p>
            <p>A <strong>ref struct</strong> (like <code>Span&lt;T&gt;</code> itself) is guaranteed to live only on the stack \u2014 the compiler forbids it from being boxed, stored in a field of a class, captured by a lambda, or used across an <code>await</code>. That guarantee is what makes <code>Span&lt;T&gt;</code> safe to point at stack memory: it can never outlive the frame.</p>`,
            explanation: 'stackalloc is scratch paper on your desk \u2014 instant to grab, gone when you stand up. A ref struct is a tool chained to that desk: the compiler refuses to let you carry it to another room where the scratch paper no longer exists.',
            code: `// Parse without heap allocation using a stack buffer + Span
Span<char> buffer = stackalloc char[16];   // no heap, no GC
int written = FormatId(id, buffer);
ReadOnlySpan<char> text = buffer.Slice(0, written);

// Span<T> is a ref struct: these are COMPILE ERRORS, by design
// class Holder { Span<int> s; }            // cannot be a field of a class
// object o = (object)mySpan;                // cannot box
// async Task M() { Span<int> s = ...; await X(); } // cannot live across await`,
            language: 'csharp',
            bestPractices: ['Use stackalloc + Span<T> for small, short-lived buffers to avoid heap allocation', 'Bound stackalloc sizes (e.g., <= 1KB) to avoid stack overflow', 'Use ReadOnlySpan<char> over substring to slice strings without allocating', 'Accept the ref-struct constraints rather than fighting them with workarounds'],
            commonMistakes: ['stackalloc with an unbounded/large size, risking stack overflow', 'Trying to store a Span in a field, capture it in a lambda, or use it across await', 'Returning a Span over a stackalloc buffer (it points to a freed frame)', 'Reaching for stackalloc everywhere instead of where allocations actually matter'],
            interviewTip: 'Tie the two together: ref struct constraints exist precisely so a Span over stackalloc memory can never escape its frame. Knowing why you cannot await with a Span in scope is the senior signal.',
            followUp: ['Why can a Span<T> not be used across an await?', 'How do you size a stackalloc safely?', 'What is the difference between Span<T> and Memory<T> here?'],
            seniorPerspective: 'I reach for stackalloc + Span on genuinely hot, small-buffer paths (parsing, formatting, serialization) where I have profiled allocations as the bottleneck. Elsewhere the readability cost is not worth it \u2014 it is a scalpel, not a default.',
            architectPerspective: 'Span and ref structs let .NET offer zero-copy, allocation-free APIs (e.g., System.Text.Json, pipelines) while staying memory-safe. Designing libraries around Span pushes allocation decisions to the caller, which is what makes high-throughput frameworks possible.'
        },
        {
            question: 'How do Memory<T> and ref structs differ, and when do you use Memory<T> over Span<T>?',
            difficulty: 'advanced',
            answer: `<p><code>Span&lt;T&gt;</code> is a ref struct \u2014 stack-only, so it cannot be stored on the heap or used across <code>await</code>/yield. <code>Memory&lt;T&gt;</code> is a regular struct that represents the same kind of contiguous region but <em>can</em> live on the heap, be a class field, and survive across asynchronous boundaries. You get a <code>Span</code> from it on demand via <code>memory.Span</code>.</p>
            <p>Use <strong>Span</strong> for synchronous, in-method processing (fastest, zero overhead). Use <strong>Memory</strong> when the buffer must persist \u2014 stored in a field, passed to an async method, or returned \u2014 e.g., async I/O (<code>Stream.ReadAsync(Memory&lt;byte&gt;)</code>).</p>`,
            explanation: 'Span is a tool chained to the desk (fast, but stays put). Memory is the same tool with a carrying case \u2014 slightly more overhead, but you can take it into the async meeting room where Span is forbidden.',
            code: `// Span: synchronous, hot path
void Process(Span<byte> data) { /* ... */ }

// Memory: needed because the buffer crosses an await
async Task ReadAsync(Memory<byte> buffer, Stream stream)
{
    int read = await stream.ReadAsync(buffer);   // Span could NOT be used here
    Process(buffer.Span.Slice(0, read));          // get a Span when synchronous again
}

// Memory can be a field; Span cannot
class Buffered { private Memory<byte> _pending; }`,
            language: 'csharp',
            bestPractices: ['Default to Span<T> for synchronous processing; it is the lightest', 'Use Memory<T> for buffers stored in fields, returned, or used across await', 'Convert Memory to Span (.Span) only inside synchronous code sections', 'Use IMemoryOwner<T> / MemoryPool<T> to manage pooled Memory lifetimes'],
            commonMistakes: ['Trying to use Span across an await (compile error) instead of Memory', 'Calling .Span and holding the Span across async boundaries', 'Allocating fresh arrays for async I/O instead of pooled Memory', 'Using Memory everywhere and paying overhead where Span would do'],
            interviewTip: 'The crisp distinction: Span is stack-only (sync hot paths), Memory is heap-capable (async/stored buffers). Mentioning Stream.ReadAsync(Memory<byte>) anchors it in a real API.',
            followUp: ['How does IMemoryOwner<T> manage buffer lifetime?', 'Why is async I/O designed around Memory, not Span?', 'What overhead does Memory add over Span?'],
            seniorPerspective: 'My rule: Span until the compiler stops me at an await, then Memory, converting back to Span for the synchronous inner work. Pairing Memory with MemoryPool/ArrayPool is how I get allocation-free async I/O end to end.',
            architectPerspective: 'The Span/Memory split is what lets .NET expose one allocation-free buffer model across both sync and async APIs. Designing pipeline and I/O layers around Memory<T> + pooling is the foundation of high-throughput, low-GC services like Kestrel.'
        }
    ,
        {
            question: 'Compare Workstation vs Server GC and concurrent/background GC. How do you choose and tune them?',
            difficulty: 'advanced',
            answer: `<p>.NET offers GC <em>flavors</em> tuned for different workloads:</p>
            <ul>
                <li><strong>Workstation GC</strong> \u2014 one heap, optimized for low latency on client/desktop apps and low core counts.</li>
                <li><strong>Server GC</strong> \u2014 a heap and a dedicated GC thread <em>per logical core</em>, maximizing throughput for multi-core server workloads (default for ASP.NET Core). Uses more memory.</li>
                <li><strong>Background GC</strong> \u2014 collects gen 2 concurrently with application threads, reducing pause times; on by default for both flavors.</li>
            </ul>
            <p>Choose Server GC for throughput-bound services on many cores; Workstation for memory-constrained or latency-sensitive single-tenant apps. Tune via runtimeconfig (<code>ServerGarbageCollection</code>, <code>ConcurrentGarbageCollection</code>) and validate with real load \u2014 Server GC's per-core heaps can balloon memory in containers with high core counts.</p>`,
            explanation: 'Workstation GC is one checkout lane optimized to keep each customer moving; Server GC opens a lane per cashier to maximize total throughput \u2014 great in a big store, wasteful in a tiny kiosk with limited space (memory).',
            code: `// runtimeconfig.json
{
  "configProperties": {
    "System.GC.Server": true,           // Server GC (throughput)
    "System.GC.Concurrent": true,       // background gen-2 collection
    "System.GC.HeapHardLimitPercent": 75 // cap heap in containers
  }
}
// In containers: Server GC creates a heap per core -> set core/heap limits
// or use System.GC.HeapCount to avoid memory blow-up on big hosts.`,
            language: 'json',
            bestPractices: ['Use Server GC for multi-core throughput services; Workstation for latency/memory-constrained apps', 'Keep Background GC on to minimize gen-2 pause times', 'In containers, cap heap (HeapHardLimitPercent) or HeapCount \u2014 Server GC scales heaps per core', 'Change GC flavor based on measured latency/throughput/memory, not assumptions'],
            commonMistakes: ['Running Server GC in a small container and being surprised by high memory use', 'Assuming GC config changes improve things without load testing', 'Disabling concurrent GC and causing long stop-the-world gen-2 pauses', 'Ignoring that ASP.NET Core defaults to Server GC already'],
            interviewTip: 'Frame it as throughput (Server, per-core heaps) vs latency/memory (Workstation), with Background GC reducing pauses. The container memory gotcha with Server GC is a strong senior detail.',
            followUp: ['Why can Server GC use much more memory in a container?', 'What is the difference between background and concurrent GC?', 'How does TieredCompilation/TieredPGO interact with startup?'],
            seniorPerspective: 'The trap I have hit is Server GC (the ASP.NET default) inside a small Kubernetes pod spinning up a heap per node-core and OOM-ing. I now always set heap limits or HeapCount for containerized services and verify memory under load.',
            architectPerspective: 'GC configuration is a per-deployment-shape decision: the same binary wants different settings on a 64-core host versus a 0.5-CPU container. Treating GC flavor and heap limits as part of the deployment profile prevents both latency spikes and OOMs.'
        },
        {
            question: 'How do you handle low-latency scenarios with GCSettings.LatencyMode and the Pinned Object Heap?',
            difficulty: 'expert',
            answer: `<p>For latency-critical sections (trading, real-time), you can hint the GC via <code>GCSettings.LatencyMode</code>: <code>LowLatency</code> or <code>SustainedLowLatency</code> suppress full blocking gen-2 collections for a bounded window so you avoid pauses during critical work. You can also use <code>GC.TryStartNoGCRegion(size)</code> to pre-reserve a budget and prevent GC entirely for a region.</p>
            <p>The <strong>Pinned Object Heap (POH)</strong> (.NET 5+) is a separate heap segment for pinned objects. Historically, pinning (e.g., for interop/<code>fixed</code>) fragmented gen-0/gen-2 because the GC could not move pinned objects; allocating them on the POH (<code>GC.AllocateArray&lt;T&gt;(len, pinned: true)</code>) isolates pinning so it no longer fragments the normal heaps.</p>`,
            explanation: 'LatencyMode is telling the GC "please don\u2019t do the big cleanup during my live performance." The Pinned Object Heap is a special parking area for cars that can\u2019t be moved, so they stop blocking the regular lot from being reorganized.',
            code: `// Suppress disruptive gen-2 GC during a latency-critical window
var old = GCSettings.LatencyMode;
GCSettings.LatencyMode = GCLatencyMode.SustainedLowLatency;
try { DoLatencyCriticalWork(); }
finally { GCSettings.LatencyMode = old; }

// Hard guarantee: no GC for a region (must fit the budget)
if (GC.TryStartNoGCRegion(64 * 1024 * 1024))
{
    try { ProcessBurst(); }
    finally { GC.EndNoGCRegion(); }
}

// Pinned buffer on the POH (no fragmentation of normal heaps)
byte[] pinned = GC.AllocateArray<byte>(4096, pinned: true);`,
            language: 'csharp',
            bestPractices: ['Use SustainedLowLatency only for bounded critical windows, then restore the mode', 'Size TryStartNoGCRegion realistically \u2014 exceeding the budget triggers a GC anyway', 'Allocate long-lived pinned interop buffers on the POH to avoid fragmentation', 'Measure: latency hints reduce pauses but can increase memory and overall GC work'],
            commonMistakes: ['Leaving LowLatency mode on globally, causing memory to balloon', 'Assuming LatencyMode disables GC entirely (it only suppresses some collections)', 'Pinning many short-lived objects on the normal heap, fragmenting it', 'Using NoGCRegion with an undersized budget so GC fires mid-region anyway'],
            interviewTip: 'Distinguish the tools: LatencyMode hints, NoGCRegion guarantees (budgeted), POH solves pinning fragmentation. Most candidates have never touched these \u2014 naming them with correct semantics is a strong signal.',
            followUp: ['Why does pinning fragment the heap, and how does POH fix it?', 'What happens if you exceed a NoGCRegion budget?', 'How would you verify these actually reduced pauses?'],
            seniorPerspective: 'I treat these as last resorts after reducing allocations first \u2014 the best way to avoid GC pauses is to not allocate. When I do use them, it is for tightly bounded windows with measurement, because globally fiddling LatencyMode usually trades pauses for memory growth and more total GC work.',
            architectPerspective: 'These knobs matter in a narrow class of systems (HFT, real-time) where tail latency is the product. For most services the architectural win is allocation reduction and pooling; reaching for GC latency modes signals you have already exhausted the cheaper, more durable options.'
        },
        {
            question: 'Explain finalizers, the dispose/finalize relationship, and why SafeHandle is preferred.',
            difficulty: 'hard',
            answer: `<p>A <strong>finalizer</strong> (<code>~Type()</code>) runs on a dedicated GC thread before an object\u2019s memory is reclaimed, as a safety net to release <em>unmanaged</em> resources. But finalization is non-deterministic and costly: finalizable objects survive an extra GC generation (promoted, then collected later), adding pressure.</p>
            <p>The classic pattern pairs <code>Dispose()</code> (deterministic cleanup) with a finalizer fallback, calling <code>GC.SuppressFinalize(this)</code> in Dispose so the finalizer is skipped when cleaned up properly. <strong>SafeHandle</strong> is preferred over a raw finalizer: it wraps the unmanaged handle, handles its own finalization correctly (even across P/Invoke and async), and avoids the subtle bugs and handle-recycling races of hand-written finalizers.</p>`,
            explanation: 'A finalizer is a last-will-and-testament the GC executes whenever it gets around to it \u2014 unreliable timing. Dispose is cleaning up yourself when you leave. SafeHandle is hiring a bonded specialist to manage the dangerous (unmanaged) item so you don\u2019t write the risky cleanup code yourself.',
            code: `// Modern: wrap the unmanaged handle in a SafeHandle \u2014 no custom finalizer needed
sealed class FileWrapper : IDisposable
{
    private readonly SafeFileHandle _handle;   // SafeHandle owns finalization
    public FileWrapper(string path) => _handle = File.OpenHandle(path);
    public void Dispose() => _handle.Dispose(); // deterministic; SafeHandle handles the rest
}

// Legacy dispose+finalize pattern (only if you hold a raw IntPtr):
class Legacy : IDisposable
{
    private IntPtr _raw;
    public void Dispose() { Release(); GC.SuppressFinalize(this); }
    ~Legacy() { Release(); }            // finalizer fallback
    private void Release() { /* free _raw once */ }
}`,
            language: 'csharp',
            bestPractices: ['Prefer SafeHandle over writing your own finalizer for unmanaged handles', 'In Dispose, call GC.SuppressFinalize(this) to skip the finalizer when cleaned up properly', 'Only managed objects with NO unmanaged resources should have no finalizer at all', 'Keep finalizers fast and exception-free \u2014 they run on a single GC thread'],
            commonMistakes: ['Writing finalizers for purely managed resources (needless GC overhead)', 'Forgetting SuppressFinalize, so objects still pay the finalization cost', 'Hand-rolled finalizers with handle-recycling races SafeHandle would prevent', 'Throwing from a finalizer or doing slow work that stalls the finalizer thread'],
            interviewTip: 'Lead with "prefer SafeHandle; write a finalizer only for raw unmanaged handles." Explaining that finalizable objects survive an extra GC generation shows you understand the actual cost.',
            followUp: ['Why does a finalizable object survive an extra GC generation?', 'What race does SafeHandle prevent that a raw finalizer does not?', 'When is no finalizer the right choice?'],
            seniorPerspective: 'In modern code I almost never write a finalizer \u2014 SafeHandle or the framework wrappers handle unmanaged lifetime correctly. A hand-written finalizer is a smell that usually means someone is holding a raw IntPtr they should have wrapped.',
            architectPerspective: 'Deterministic resource cleanup (Dispose/using) is the contract; finalization is only the safety net. Designing types so unmanaged resources are always behind SafeHandle removes a whole class of leak and handle-recycle bugs from the codebase.'
        }
    ]
});
