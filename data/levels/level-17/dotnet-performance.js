'use strict';

PageData.register('dotnet-performance', {
  title: '.NET Performance & Internals',
  description: 'Master zero-allocation patterns, GC internals, JIT tiering, Native AOT, and high-performance I/O for Staff/Principal .NET engineers building latency-sensitive systems.',
  sections: [
    {
      title: 'Introduction',
      content: `
        <p>Performance engineering in .NET has evolved dramatically since .NET Core. The runtime now provides primitives for zero-allocation code paths, hardware-accelerated operations, and ahead-of-time compilation that rival C++ in specific scenarios.</p>
        <p>At Staff+ level, you're expected to reason about GC pressure, JIT behavior, memory layouts, and pipeline stalls. This isn't about premature optimization — it's about understanding the cost model of your abstractions so you can make informed trade-offs.</p>
        <p>This topic covers the internals: how the GC decides what to collect and when, how the JIT optimizes hot paths through tiered compilation and PGO, and how modern APIs like Span&lt;T&gt; and System.IO.Pipelines eliminate allocations in high-throughput scenarios.</p>
      `
    },
    {
      title: 'Core Concepts',
      content: `
        <p><strong>Allocation is the enemy</strong>: Every heap allocation creates future GC work. In high-throughput systems (100K+ requests/sec), GC pauses dominate tail latency. The goal: eliminate allocations from hot paths.</p>
        <p><strong>Value types vs reference types</strong>: Structs live on the stack (or inline in containing objects). No GC pressure, no indirection. But beware copying costs for large structs and boxing in generic contexts.</p>
        <p><strong>Span&lt;T&gt; and Memory&lt;T&gt;</strong>: Stack-only (ref struct) and heap-safe views over contiguous memory. Enable slicing without allocation — parse a 1MB buffer by passing Span slices, never copying.</p>
        <p><strong>Pooling</strong>: ArrayPool&lt;T&gt; and ObjectPool&lt;T&gt; recycle expensive allocations. System.IO.Pipelines builds on this for I/O buffers.</p>
        <p><strong>JIT Tiering</strong>: Tier 0 = fast compile, slow code. Tier 1 = optimized after method is called enough. PGO (Profile-Guided Optimization) uses runtime profile data to make Tier 1 even better.</p>
      `
    },
    {
      title: 'GC Internals: Generations, LOH, and Modes',
      mermaid: `graph TD
    subgraph "GC Generations"
        G0[Gen 0<br/>Short-lived<br/>~256KB-4MB] -->|Survives| G1[Gen 1<br/>Medium-lived<br/>Buffer zone]
        G1 -->|Survives| G2[Gen 2<br/>Long-lived<br/>Full GC required]
    end
    subgraph "Large Object Heap"
        LOH[LOH<br/>Objects >= 85KB<br/>Only collected with Gen 2]
        POH[POH .NET 5+<br/>Pinned Object Heap<br/>Reduces fragmentation]
    end
    subgraph "GC Modes"
        WS[Workstation GC<br/>Single GC thread<br/>Lower latency per-GC]
        SVR[Server GC<br/>One GC thread per core<br/>Higher throughput]
        BG[Background GC<br/>Gen 2 concurrent<br/>Shorter pauses]
    end
    G2 -.->|Triggered together| LOH`,
      content: `
        <p><strong>Generational Hypothesis</strong>: Most objects die young. Gen 0 collections are fast (~1ms) and frequent. Gen 2 collections are expensive (10-100ms) and should be rare in well-tuned applications.</p>
        <p><strong>Large Object Heap (LOH)</strong>: Objects ≥ 85,000 bytes go directly to LOH. Only collected during Gen 2 GC. Not compacted by default (causes fragmentation). In .NET 5+, use GCSettings.LargeObjectHeapCompactionMode for periodic compaction.</p>
        <p><strong>Pinned Object Heap (POH)</strong>: .NET 5+ provides a dedicated heap for pinned objects (GC.AllocateArray with pinned=true). This prevents pinned objects from fragmenting the normal heap.</p>
        <p><strong>Server vs Workstation GC</strong>: Server GC allocates a heap per logical processor, collects in parallel — higher throughput but more memory. Workstation GC uses one heap — lower memory, lower per-GC latency but less throughput.</p>
        <p><strong>Background GC</strong>: Gen 2 collections run concurrently with application threads (only brief suspension for root scanning). Essential for latency-sensitive services. Enabled by default in .NET Core.</p>
        <p><strong>GC Configuration in .NET 8+</strong>:</p>
        <ul>
          <li><strong>DOTNET_GCHeapCount</strong>: Override heap count for server GC (useful in containers with CPU limits)</li>
          <li><strong>DOTNET_GCConserveMemory</strong> (0-9): Higher values = GC triggers earlier, less memory used, more frequent collections</li>
          <li><strong>DOTNET_GCHeapHardLimit</strong>: Set maximum heap size — GC becomes more aggressive as limit approaches</li>
          <li><strong>Region-based GC</strong> (.NET 7+): Replaces segment-based heap management. Better memory reuse, less fragmentation, more granular decommit of unused memory.</li>
        </ul>
      `,
      code: {
        language: 'csharp',
        content: `// GC monitoring and tuning example
public class GcMonitoringService : BackgroundService
{
    private readonly ILogger<GcMonitoringService> _logger;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        // Register for GC notifications
        GC.RegisterForFullGCNotification(10, 10);

        while (!ct.IsCancellationRequested)
        {
            // Check for approaching full GC
            var status = GC.WaitForFullGCApproach(100);
            if (status == GCNotificationStatus.Succeeded)
            {
                _logger.LogWarning("Full GC approaching. Gen2 count: {Count}, " +
                    "LOH size: {LohSize}MB, Total memory: {Total}MB",
                    GC.CollectionCount(2),
                    GC.GetGCMemoryInfo().GenerationInfo[3].SizeAfterBytes / 1_000_000,
                    GC.GetTotalMemory(false) / 1_000_000);
            }

            await Task.Delay(1000, ct);
        }
    }
}

// Using GC.GetGCMemoryInfo() for diagnostics
public static class GcDiagnostics
{
    public static void PrintGcStats()
    {
        var info = GC.GetGCMemoryInfo();
        Console.WriteLine($"Heap size: {info.HeapSizeBytes / 1_000_000}MB");
        Console.WriteLine($"Fragmented: {info.FragmentedBytes / 1_000_000}MB");
        Console.WriteLine($"Pinned objects: {info.PinnedObjectsCount}");
        Console.WriteLine($"GC pause (last): {info.PauseTimePercentage}%");
        Console.WriteLine($"Compacted: {info.Compacted}");

        for (int gen = 0; gen <= 2; gen++)
            Console.WriteLine($"Gen {gen} collections: {GC.CollectionCount(gen)}");
    }
}`
      }
    },
    {
      title: 'Span<T>, Memory<T>, and Zero-Allocation Patterns',
      content: `
        <p><strong>Span&lt;T&gt;</strong> is a ref struct that represents a contiguous region of memory. Being a ref struct, it can only live on the stack — cannot be stored in fields, captured by lambdas, or used in async methods.</p>
        <p><strong>Memory&lt;T&gt;</strong> is the heap-safe counterpart. It can be stored in fields and passed to async methods, then sliced into a Span when you need to do actual work.</p>
        <p><strong>Key patterns</strong>:</p>
        <ul>
          <li><strong>Parsing without allocation</strong>: Slice a ReadOnlySpan&lt;char&gt; from a string instead of Substring (which allocates)</li>
          <li><strong>stackalloc + Span</strong>: Allocate small buffers on the stack, use Span to pass them safely</li>
          <li><strong>ArrayPool + Span</strong>: Rent a buffer, wrap in Span, return when done — zero GC pressure</li>
        </ul>
      `,
      code: {
        language: 'csharp',
        content: `// Zero-allocation string parsing with Span<T>
public static (int statusCode, ReadOnlySpan<char> reason) ParseStatusLine(
    ReadOnlySpan<char> line)
{
    // "HTTP/1.1 200 OK" — no substring allocations
    var afterProtocol = line.Slice(line.IndexOf(' ') + 1);
    var spaceIdx = afterProtocol.IndexOf(' ');
    var statusCode = int.Parse(afterProtocol.Slice(0, spaceIdx));
    var reason = afterProtocol.Slice(spaceIdx + 1);
    return (statusCode, reason);
}

// stackalloc for small buffers
public static string FormatHex(ReadOnlySpan<byte> data)
{
    Span<char> buffer = data.Length <= 128
        ? stackalloc char[data.Length * 2]
        : new char[data.Length * 2]; // fallback for large data

    for (int i = 0; i < data.Length; i++)
        data[i].TryFormat(buffer.Slice(i * 2, 2), out _, "X2");

    return new string(buffer);
}

// ArrayPool usage pattern
public static async Task ProcessDataAsync(Stream stream)
{
    byte[] buffer = ArrayPool<byte>.Shared.Rent(4096);
    try
    {
        int bytesRead = await stream.ReadAsync(buffer.AsMemory(0, 4096));
        ProcessChunk(buffer.AsSpan(0, bytesRead));
    }
    finally
    {
        ArrayPool<byte>.Shared.Return(buffer, clearArray: true);
    }
}`
      }
    },
    {
      title: 'System.IO.Pipelines for High-Throughput I/O',
      mermaid: `sequenceDiagram
    participant Writer as PipeWriter<br/>(Network I/O)
    participant Pipe as Pipe Buffer<br/>(Pooled Memory)
    participant Reader as PipeReader<br/>(Parser)
    Writer->>Pipe: GetMemory() → write data
    Writer->>Pipe: Advance(bytesWritten)
    Writer->>Pipe: FlushAsync()
    Pipe->>Reader: ReadAsync() → ReadResult
    Reader->>Reader: Parse(buffer.Slice(...))
    Reader->>Pipe: AdvanceTo(consumed, examined)
    Note over Pipe: Recycles consumed segments`,
      content: `
        <p><strong>System.IO.Pipelines</strong> solves the classic problem of high-performance I/O parsing: managing buffers, handling partial reads, and avoiding copies between read and parse operations.</p>
        <p><strong>Key concepts</strong>:</p>
        <ul>
          <li><strong>PipeWriter</strong>: Writes data into pooled buffer segments (no allocation per write)</li>
          <li><strong>PipeReader</strong>: Reads a ReadOnlySequence&lt;byte&gt; — potentially spanning multiple buffer segments</li>
          <li><strong>Back-pressure</strong>: Built-in flow control. If the reader is slow, FlushAsync pauses the writer (configurable thresholds)</li>
          <li><strong>No buffer management</strong>: The pipe owns the buffers, pools them, and recycles consumed segments automatically</li>
        </ul>
        <p>Kestrel (ASP.NET Core's web server) uses Pipelines internally. It can handle 7M+ requests/sec on commodity hardware partly because the I/O path is allocation-free.</p>
        <p><strong>ReadOnlySequence&lt;byte&gt;</strong>: A linked list of memory segments. Handles the case where a message spans two buffers (partial read). SequenceReader&lt;byte&gt; abstracts the multi-segment iteration, so parser code doesn't need to handle segment boundaries manually.</p>
        <p><strong>AdvanceTo semantics</strong>: consumed = data that's been fully processed (can be released back to pool). examined = data that's been looked at but not fully consumed (e.g., partial message). This distinction is critical — without it, the pipe would re-deliver already-examined data on every read, causing infinite loops for partial messages.</p>
        <p><strong>Integration with sockets</strong>: .NET's Socket class has native Pipelines support via <code>socket.ReceiveAsync(writer.GetMemory())</code>. Zero-copy from kernel buffer to pipe segment. The entire path: NIC → kernel buffer → pipe segment → parser Span → response pipe → kernel buffer → NIC has minimal copies.</p>
      `,
      code: {
        language: 'csharp',
        content: `// High-throughput protocol parser with System.IO.Pipelines
public class LineProtocolParser
{
    private readonly PipeReader _reader;

    public LineProtocolParser(PipeReader reader) => _reader = reader;

    public async IAsyncEnumerable<string> ParseLinesAsync(
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        while (true)
        {
            ReadResult result = await _reader.ReadAsync(ct);
            ReadOnlySequence<byte> buffer = result.Buffer;

            while (TryReadLine(ref buffer, out ReadOnlySequence<byte> line))
            {
                yield return Encoding.UTF8.GetString(line);
            }

            // Tell the pipe what we consumed and examined
            _reader.AdvanceTo(buffer.Start, buffer.End);

            if (result.IsCompleted) break;
        }

        await _reader.CompleteAsync();
    }

    private static bool TryReadLine(
        ref ReadOnlySequence<byte> buffer, out ReadOnlySequence<byte> line)
    {
        var reader = new SequenceReader<byte>(buffer);
        if (reader.TryReadTo(out line, (byte)'\\n'))
        {
            buffer = buffer.Slice(reader.Position);
            return true;
        }
        line = default;
        return false;
    }
}`
      }
    },
    {
      title: 'Native AOT Compilation',
      content: `
        <p><strong>Native AOT</strong> compiles .NET code directly to native machine code at build time — no JIT, no IL, no runtime code generation. The result is a self-contained native binary.</p>
        <p><strong>Benefits</strong>:</p>
        <ul>
          <li>Instant startup (no JIT warmup) — 10-50ms vs 500ms-2s for JIT</li>
          <li>Smaller memory footprint (no JIT compiler in memory, reduced metadata)</li>
          <li>Predictable performance (no JIT tier transitions during runtime)</li>
          <li>Single-file deployment without runtime dependency</li>
        </ul>
        <p><strong>Limitations</strong>:</p>
        <ul>
          <li>No runtime reflection (or severely limited via source generators)</li>
          <li>No dynamic assembly loading</li>
          <li>No runtime code generation (Expression.Compile, Reflection.Emit)</li>
          <li>Longer build times (full program analysis)</li>
          <li>Larger binary size than trimmed IL (includes native runtime)</li>
        </ul>
        <p><strong>When to use</strong>: CLI tools, serverless functions (cold start sensitive), microservices with minimal reflection, embedded/IoT scenarios. Not ideal for plugin-heavy apps or heavy reflection users (EF Core has limited support).</p>
        <p><strong>AOT compatibility workflow</strong>:</p>
        <ul>
          <li>Add <code>&lt;IsAotCompatible&gt;true&lt;/IsAotCompatible&gt;</code> to project. Build emits trim/AOT warnings.</li>
          <li>Replace Reflection-based patterns with source generators: System.Text.Json source gen, DI container source gen, minimal API source gen.</li>
          <li>Use <code>[DynamicallyAccessedMembers]</code> annotations to preserve types needed at runtime.</li>
          <li>Test with <code>dotnet publish -r linux-x64 -c Release /p:PublishAot=true</code>. Any runtime failures = missing type metadata.</li>
        </ul>
        <p><strong>Size optimization</strong>: Use <code>&lt;OptimizationPreference&gt;Size&lt;/OptimizationPreference&gt;</code> for smaller binaries (5-15% slower execution, 20-30% smaller binary). Combine with <code>&lt;InvariantGlobalization&gt;true&lt;/InvariantGlobalization&gt;</code> to trim ICU data (~30MB savings).</p>
      `
    },
    {
      title: 'JIT Tiering and Profile-Guided Optimization',
      content: `
        <p><strong>Tiered Compilation</strong> (.NET Core 3.0+): Methods start at Tier 0 (minimal optimization, fast compile). After ~30 calls, they're recompiled at Tier 1 (full optimizations: inlining, loop unrolling, devirtualization).</p>
        <p><strong>Why Tier 0?</strong> Many methods run once (startup, config loading). JIT-ing them fully wastes time. Tier 0 gets the app running fast; hot paths get optimized later when it matters.</p>
        <p><strong>Dynamic PGO</strong> (.NET 7+): Tier 0 collects runtime profile data (branch frequencies, type feedback for virtual calls). Tier 1 uses this profile to make better optimization decisions:</p>
        <ul>
          <li><strong>Guarded devirtualization</strong>: If 95% of virtual calls target one type, inline that path with a type check guard</li>
          <li><strong>Hot/cold path splitting</strong>: Move rarely-executed code out of the hot path for better instruction cache utilization</li>
          <li><strong>Branch prediction hints</strong>: Layout code blocks by frequency for hardware branch predictor</li>
        </ul>
        <p><strong>On-Stack Replacement (OSR)</strong>: Allows Tier 1 replacement of methods currently on the call stack (important for long-running loops that would never return to get recompiled).</p>
      `,
      code: {
        language: 'csharp',
        content: `// BenchmarkDotNet example demonstrating allocation measurement
[MemoryDiagnoser]
[DisassemblyDiagnoser(maxDepth: 2)]
public class SpanVsSubstringBenchmark
{
    private string _input = "HTTP/1.1 200 OK";

    [Benchmark(Baseline = true)]
    public int ParseWithSubstring()
    {
        // Allocates new string for each Substring call
        var afterProtocol = _input.Substring(_input.IndexOf(' ') + 1);
        var statusStr = afterProtocol.Substring(0, afterProtocol.IndexOf(' '));
        return int.Parse(statusStr);
    }

    [Benchmark]
    public int ParseWithSpan()
    {
        // Zero allocations — works on stack-only spans
        ReadOnlySpan<char> span = _input.AsSpan();
        var afterProtocol = span.Slice(span.IndexOf(' ') + 1);
        var statusSlice = afterProtocol.Slice(0, afterProtocol.IndexOf(' '));
        return int.Parse(statusSlice);
    }
}
// Results: Span version is 3-5x faster with 0 bytes allocated vs 80+ bytes`
      }
    },
    {
      title: 'High-Performance Collections: Frozen & Immutable',
      content: `
        <p><strong>FrozenSet&lt;T&gt; and FrozenDictionary&lt;K,V&gt;</strong> (.NET 8+): Optimized for read-heavy scenarios where the collection is built once and queried millions of times. The frozen creation step analyzes the data to choose optimal internal representations:</p>
        <ul>
          <li>For small sets: array scan (cache-friendly, no hashing overhead)</li>
          <li>For string keys: may use length-based bucketing or substring comparison</li>
          <li>For integer keys: may use direct array indexing if the range is small</li>
        </ul>
        <p><strong>When to use</strong>: Configuration lookups, routing tables, enum-to-string mappings, feature flags — anywhere you build once at startup and query on every request.</p>
        <p><strong>ImmutableDictionary vs FrozenDictionary</strong>: Immutable collections optimize for efficient creation of modified copies (structural sharing). Frozen collections optimize for read speed. Different use cases: immutable for evolving state, frozen for static reference data.</p>
        <p><strong>ref struct patterns</strong>: Use ref struct for types that must stay on the stack (Span&lt;T&gt; is a ref struct). Prevents accidental heap allocation. Combine with scoped parameters in .NET 7+ for safe lifetime management.</p>
      `
    },
    {
      title: 'Common Mistakes',
      content: `
        <ul>
          <li><strong>Premature optimization without measurement</strong>: Always benchmark first with BenchmarkDotNet. Intuition about performance is often wrong. Measure allocation rate, GC pause times, and p99 latency.</li>
          <li><strong>Using Server GC for small services</strong>: Server GC allocates memory per-core. A 2-core container with Server GC uses 2x memory for heaps. Workstation GC may be better for small services.</li>
          <li><strong>Ignoring LOH fragmentation</strong>: Allocating and releasing 85KB+ arrays fragments LOH. Use ArrayPool for large arrays or enable periodic LOH compaction.</li>
          <li><strong>async over sync for hot paths</strong>: async state machines allocate (Task + state machine struct on heap). For truly hot paths that rarely block, synchronous code with ValueTask eliminates this overhead.</li>
          <li><strong>Pooling objects that are cheap to allocate</strong>: ObjectPool has overhead (thread-safety, lifetime management). Pool expensive objects (connections, large buffers). Don't pool small DTOs.</li>
          <li><strong>Span in async methods</strong>: Span&lt;T&gt; is a ref struct — cannot cross await boundaries. Use Memory&lt;T&gt; in async code, convert to Span for synchronous processing.</li>
        </ul>
      `
    },
    {
      title: 'Interview Tips',
      callout: true,
      content: `
        <p><strong>Know your numbers</strong>: Gen 0 GC ≈ 1ms, Gen 2 ≈ 10-100ms. Object header = 8 bytes (x64) + method table pointer. Array minimum size = 24 bytes. Be able to estimate allocation cost.</p>
        <p><strong>Profiling fluency</strong>: Mention tools by name — dotnet-counters for live GC stats, dotnet-trace for CPU profiling, PerfView for allocation tracking, BenchmarkDotNet for microbenchmarks. Show you've used them in production.</p>
        <p><strong>Trade-off awareness</strong>: "We reduced allocations by 90% using Span, but it made the code harder to maintain and limited composability with async." Interviewers want to see you balance performance with engineering velocity.</p>
        <p><strong>GC tuning experience</strong>: If asked about GC, mention real scenarios — "We switched to Server GC and saw throughput increase 40%, but Gen 2 pauses went from 20ms to 80ms. We addressed this by reducing Gen 2 promotions through better object lifetime management."</p>
        <p><strong>Native AOT awareness</strong>: Understand the ecosystem compatibility matrix. Know which NuGet packages work with AOT and which don't (reflection-heavy libraries). Mention trimming warnings and source generators as the path forward.</p>
      `
    },
    {
      title: 'Key Takeaways',
      content: `
        <ul>
          <li>Span&lt;T&gt; enables zero-allocation parsing and slicing — the most impactful single API for .NET performance on hot paths</li>
          <li>System.IO.Pipelines provides back-pressure-aware, pooled-buffer I/O processing — Kestrel's secret to 7M+ req/sec</li>
          <li>GC generations implement the generational hypothesis — keep objects short-lived (Gen 0) or truly long-lived (Gen 2 static), avoid the middle ground</li>
          <li>Server GC vs Workstation GC is a per-service decision based on core count, memory budget, and latency requirements</li>
          <li>JIT tiering + Dynamic PGO means .NET code gets faster over time — but Native AOT trades this for instant startup and predictable performance</li>
          <li>FrozenDictionary and FrozenSet optimize read-heavy lookup patterns that occur on every request — 2-5x faster than Dictionary for static data</li>
          <li>BenchmarkDotNet is the standard for microbenchmarks — always measure before and after, report allocations alongside time</li>
          <li>ArrayPool and ObjectPool eliminate GC pressure for frequently allocated/discarded buffers — essential for high-throughput services</li>
        </ul>
      `
    }
  ],
  advancedTopics: [
    {
      title: 'ObjectPool<T> and Custom Pooling Patterns',
      content: `
        <p><strong>Microsoft.Extensions.ObjectPool</strong>: A thread-safe pool for reusing expensive objects. Unlike ArrayPool (arrays only), ObjectPool works with any type.</p>
        <p><strong>When to pool</strong>:</p>
        <ul>
          <li>Object construction is expensive (> 1μs): database connections, compiled regex, large buffers</li>
          <li>Object is used frequently and briefly: per-request StringBuilder, serialization buffers</li>
          <li>Object is large and would pressure Gen 2/LOH: output formatters, image processing buffers</li>
        </ul>
        <p><strong>When NOT to pool</strong>:</p>
        <ul>
          <li>Object is cheap to create (small DTOs, value types) — pool overhead exceeds allocation cost</li>
          <li>Object holds user-specific state that's hard to reset — risk of data leakage between requests</li>
          <li>Pool contention exceeds allocation cost — under extreme parallelism, pool lock becomes bottleneck</li>
        </ul>
        <p><strong>Custom pooling with IObjectPolicy&lt;T&gt;</strong>: Define Create() and Return() methods. Return() resets the object to a clean state. If reset fails (corrupted state), return false to discard.</p>
        <p><strong>Pool sizing</strong>: Default pool size = 2 × ProcessorCount. For bursty workloads, increase. For steady-state, default is usually optimal. Monitor pool miss rate — high misses mean the pool is too small.</p>
      `
    },
    {
      title: 'Allocation-Free Async Patterns',
      content: `
        <p><strong>The async state machine cost</strong>: Each async method creates a state machine struct. If the method awaits (doesn't complete synchronously), the struct is boxed to the heap as a Task. For hot paths called millions of times, this allocation adds up.</p>
        <p><strong>ValueTask + IValueTaskSource pooling</strong>: The most advanced pattern. Instead of allocating a new Task for each async operation, reuse a pooled IValueTaskSource object. Socket operations in .NET use this internally — AwaitableSocketAsyncEventArgs is pooled and reused across reads.</p>
        <p><strong>ref struct async (C# 13 preview)</strong>: Future language feature allowing ref structs in async methods with limited scope. Will eliminate boxing for many common async patterns.</p>
        <p><strong>Synchronous fast-path optimization</strong>:</p>
        <ul>
          <li>Check cache synchronously before awaiting async path</li>
          <li>Use ValueTask and return synchronous result when cache hits</li>
          <li>Only allocate Task/state-machine on the slow path (cache miss)</li>
        </ul>
        <p><strong>ConfigureAwait(false)</strong>: In library code, avoids capturing SynchronizationContext — reduces allocation of callback delegates and prevents deadlocks. Not needed in ASP.NET Core (no SyncContext) but still good practice for libraries used in both environments.</p>
      `
    },
    {
      title: 'Performance Profiling Workflow',
      content: `
        <p><strong>Production profiling stack</strong>:</p>
        <ul>
          <li><strong>dotnet-counters</strong>: Live view of GC stats, thread pool, exception rate. Low overhead (< 1% CPU). Always-on in production. Command: <code>dotnet-counters monitor -p {pid} --counters System.Runtime</code></li>
          <li><strong>dotnet-trace</strong>: CPU profiling via EventPipe. Moderate overhead (5-15%). Use for targeted investigation. Produces .nettrace file analyzable in PerfView or VS.</li>
          <li><strong>dotnet-dump</strong>: Heap snapshot for memory leak analysis. Point-in-time, no ongoing overhead. Take two dumps 10 minutes apart, compare growth.</li>
          <li><strong>dotnet-gcdump</strong>: GC-specific heap dump. Lighter than full dump. Shows object graph and GC roots.</li>
          <li><strong>PerfView</strong>: The gold standard for deep analysis. Correlates CPU, GC, allocations, thread contention. Steep learning curve but unmatched insight.</li>
          <li><strong>BenchmarkDotNet</strong>: Microbenchmarks for comparing implementations. Handles warmup, statistical analysis, GC measurement. Always use [MemoryDiagnoser] to track allocations.</li>
        </ul>
        <p><strong>Workflow</strong>: Observe (counters) → Hypothesize → Measure (benchmarks/trace) → Fix → Verify (re-measure). Never skip measurement — performance intuition is wrong more often than right.</p>
      `
    }
  ],
  questions: [
    {
      question: "Explain the difference between Span<T> and Memory<T>. When would you use each?",
      difficulty: "medium",
      answer: "<p><strong>Span&lt;T&gt;</strong> is a <code>ref struct</code> — it can only live on the stack. This means it cannot be stored in class fields, captured by lambdas, or used across await boundaries. It provides the fastest possible access to contiguous memory (array, stackalloc, native pointer) with bounds checking.</p><p><strong>Memory&lt;T&gt;</strong> is a regular struct that can live on the heap. It wraps a reference to the underlying memory (array or IMemoryOwner) and can be stored in fields and passed to async methods. Call <code>.Span</code> to get a Span for actual operations.</p><p><strong>Use Span&lt;T&gt;</strong>: Synchronous methods, parsing hot paths, stack-allocated buffers, any method that processes data and returns without storing the reference.</p><p><strong>Use Memory&lt;T&gt;</strong>: Async methods, pipeline stages that buffer data, any scenario where the memory reference must outlive a single stack frame.</p><p>Pattern: Accept Memory&lt;T&gt; in async APIs, convert to Span&lt;T&gt; for the synchronous processing portion.</p>",
      interviewTip: "Demonstrate understanding of ref struct limitations. Mention that Span<T> cannot be boxed, used in generics over reference types, or stored in arrays — this is enforced by the compiler.",
      followUp: ["What is ReadOnlySpan<T> and when would you use it over Span<T>?", "How does the .NET runtime implement Span<T> internally (ByReference<T>)?"],
      seniorPerspective: "In high-performance libraries, you'll expose both Span and Memory overloads. The Span overload is the hot path for sync callers. The Memory overload wraps the async plumbing. This dual-API pattern is throughout the BCL.",
      architectPerspective: "Span<T> represents a broader .NET evolution toward zero-cost abstractions. The ref struct family (Span, ReadOnlySpan, ref struct types) enables C-level performance with C# safety guarantees — this changes the calculus for 'should we write this in C++?'"
    },
    {
      question: "Describe .NET GC generations and explain a scenario where Gen 2 collections become problematic. How would you fix it?",
      difficulty: "hard",
      answer: "<p><strong>Generations</strong>: Gen 0 (short-lived, fast to collect ~1ms), Gen 1 (buffer between 0 and 2), Gen 2 (long-lived, expensive to collect 10-100ms). Objects promote from Gen 0→1→2 if they survive collections.</p><p><strong>Problematic scenario</strong>: A web service allocates large response buffers (90KB+) per request. These go directly to LOH (collected with Gen 2). Under high load, LOH fills → frequent Gen 2 GCs → 50-100ms pauses → p99 latency spikes.</p><p><strong>Fix</strong>:</p><ol><li><strong>ArrayPool&lt;byte&gt;.Shared.Rent()</strong>: Pool the large buffers instead of allocating per-request. Eliminates LOH allocations entirely.</li><li><strong>Reduce buffer sizes below 85KB</strong>: If possible, use streaming (chunked responses) to avoid needing large contiguous buffers.</li><li><strong>Enable LOH compaction periodically</strong>: <code>GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce</code> before a scheduled GC.</li><li><strong>Use POH for pinned buffers</strong>: If buffers are pinned for native I/O, allocate on the Pinned Object Heap to prevent normal heap fragmentation.</li></ol>",
      interviewTip: "Share a real-world story if possible: 'We reduced p99 from 200ms to 15ms by pooling response buffers.' Numbers make answers memorable.",
      followUp: ["What is the difference between blocking GC and background GC for Gen 2?", "How would you use dotnet-counters to diagnose excessive Gen 2 collections?"],
      seniorPerspective: "Monitor GC metrics in production: Gen 0/1/2 collection counts, pause times, LOH size, allocation rate. Alert on Gen 2 frequency exceeding 1/minute for latency-sensitive services. Use EventCounters or OpenTelemetry for this.",
      architectPerspective: "GC tuning is a system-wide concern. In Kubernetes, set memory limits considering GC overhead (GC needs ~2x live data to collect efficiently). A 512MB container with 400MB live data will GC constantly. Size for headroom."
    },
    {
      question: "How does System.IO.Pipelines improve over traditional Stream-based I/O? Explain the back-pressure mechanism.",
      difficulty: "hard",
      answer: "<p><strong>Traditional Stream problems</strong>:</p><ul><li>Caller manages buffers (size guessing, reallocation)</li><li>No built-in back-pressure (fast writer can overwhelm slow reader)</li><li>Partial reads require manual assembly of complete messages across read boundaries</li><li>Buffer ownership is ambiguous (who allocates? who returns to pool?)</li></ul><p><strong>Pipelines advantages</strong>:</p><ul><li><strong>Pooled buffers</strong>: The pipe manages a chain of segments from MemoryPool. No allocation per read/write.</li><li><strong>ReadOnlySequence&lt;byte&gt;</strong>: The reader gets a sequence that may span multiple segments — handles message boundaries naturally.</li><li><strong>AdvanceTo semantics</strong>: Reader declares how much was consumed (can be released) and examined (don't re-deliver). Partially parsed data stays in the pipe.</li></ul><p><strong>Back-pressure</strong>: PipeOptions.PauseWriterThreshold and ResumeWriterThreshold. When unread data exceeds PauseWriterThreshold, FlushAsync returns an incomplete ValueTask — the writer is paused. When the reader catches up below ResumeWriterThreshold, the writer resumes. This prevents memory growth under load without dropping data.</p>",
      interviewTip: "Mention that Kestrel uses Pipelines end-to-end: socket→PipeReader→HTTP parser→PipeWriter→socket. This is why ASP.NET Core achieves millions of req/sec with low memory.",
      followUp: ["How would you implement a protocol parser (like Redis RESP) using PipeReader?", "What is the relationship between Pipelines and the new Socket APIs in .NET?"],
      seniorPerspective: "In practice, set pause/resume thresholds based on your protocol. For HTTP: 64KB pause (one response worth). For streaming: 1MB+ pause. Too low = writer stalls frequently. Too high = memory growth under slow consumers.",
      architectPerspective: "Pipelines represent the 'mechanical sympathy' principle in .NET — the API is designed around how network I/O actually works (variable-size chunks, partial messages, buffer recycling) rather than forcing a byte-stream abstraction."
    },
    {
      question: "When would you choose Native AOT over regular .NET JIT compilation? What are the trade-offs?",
      difficulty: "medium",
      answer: "<p><strong>Choose Native AOT when</strong>:</p><ul><li><strong>Startup time is critical</strong>: Serverless functions (cold start penalty), CLI tools (user perceives 2s startup), sidecar proxies (fast pod startup in Kubernetes)</li><li><strong>Memory footprint matters</strong>: IoT devices, edge computing, density-optimized containers where you run 100+ instances per node</li><li><strong>Predictable latency</strong>: No JIT compilation during runtime means no surprise pauses from tier transitions or method compilation on first call</li><li><strong>Self-contained deployment</strong>: Single native binary with no runtime dependency — simplifies container images (FROM scratch)</li></ul><p><strong>Trade-offs against JIT</strong>:</p><ul><li>No Dynamic PGO (JIT code gets faster over time based on runtime profiles — AOT code is static)</li><li>No runtime reflection (must use source generators for serialization, DI)</li><li>Larger binary (includes GC, threading, native runtime — 10-30MB minimum vs 1MB IL)</li><li>Slower build (full program analysis, cross-module optimization)</li><li>Limited ecosystem compatibility (libraries using Reflection.Emit, dynamic proxies won't work)</li></ul><p><strong>Sweet spot</strong>: Greenfield microservices, gRPC services, serverless functions, CLI tools. Bad fit: plugin architectures, EF Core heavy apps, dynamic scripting hosts.</p>",
      interviewTip: "Frame as 'JIT wins for long-running services with warm-up time, AOT wins for short-lived or startup-sensitive workloads.' Show you understand both compilation models.",
      followUp: ["How do trimming warnings and source generators relate to AOT readiness?", "Can you use Native AOT with ASP.NET Core? What limitations exist?"],
      seniorPerspective: "In practice, test AOT compatibility early in a project. Add <PublishAot>true</PublishAot> to CI and fix trimming warnings incrementally. Retrofitting AOT onto a large reflection-heavy app is painful.",
      architectPerspective: "Native AOT changes the deployment architecture. With JIT, you ship IL and the target runtime compiles optimally for the host CPU. With AOT, you ship per-architecture binaries. For multi-arch deployments (x64 + ARM64), this means separate build pipelines."
    },
    {
      question: "Explain JIT tiered compilation and Dynamic PGO. How do they work together?",
      difficulty: "advanced",
      answer: "<p><strong>Tiered Compilation flow</strong>:</p><ol><li><strong>Tier 0</strong>: Method first called → JIT compiles quickly with minimal optimization (no inlining, basic register allocation). Fast startup but slow execution.</li><li><strong>Call counting</strong>: Runtime tracks invocation count (threshold ~30 calls). When exceeded, method is queued for recompilation.</li><li><strong>Tier 1</strong>: Background recompilation with full optimizations: inlining, loop optimizations, dead code elimination, devirtualization.</li></ol><p><strong>Dynamic PGO</strong> adds instrumentation to Tier 0 code:</p><ul><li>Branch counters track which paths are taken</li><li>Type profiling records actual types at virtual call sites</li><li>Loop iteration counts inform unrolling decisions</li></ul><p>Tier 1 with PGO uses this data for:</p><ul><li><strong>Guarded devirtualization</strong>: 'If type == ExpectedType, call directly (inlinable); else virtual dispatch.' Eliminates vtable lookup for the common case.</li><li><strong>Hot/cold splitting</strong>: Moves rarely-executed blocks (error handling) away from the hot path, improving instruction cache hit rate.</li><li><strong>Optimized switch/if-else ordering</strong>: Most frequent branches first.</li></ul><p>Result: .NET 8 with PGO shows 10-20% throughput improvement over .NET 6 for typical web workloads, approaching hand-optimized C++ performance on hot paths.</p>",
      interviewTip: "Mention that Dynamic PGO is enabled by default in .NET 8. Prior versions needed DOTNET_TieredPGO=1 environment variable. This is one of the biggest single perf wins in recent .NET history.",
      followUp: ["What is On-Stack Replacement (OSR) and why is it needed for tiered compilation?", "How does crossgen2 (ReadyToRun) complement tiered compilation?"],
      seniorPerspective: "For latency-sensitive services, use ReadyToRun (R2R) images for startup + tiered compilation for steady-state. R2R provides pre-compiled code (not optimized) that starts fast, then Tier 1 replaces it with optimized code over time.",
      architectPerspective: "Dynamic PGO means that benchmarking .NET applications requires warm-up. A benchmark taken in the first 10 seconds (Tier 0) will show dramatically different numbers than one after 60 seconds (Tier 1 + PGO). CI/CD performance tests must account for this."
    },
    {
      question: "How would you diagnose and fix a memory leak in a .NET service running in production?",
      difficulty: "hard",
      answer: "<p><strong>Diagnosis steps</strong>:</p><ol><li><strong>Confirm it's a leak</strong>: Monitor GC heap size (dotnet-counters). If Gen 2 size grows continuously without stabilizing, there's a leak. Check if it's managed (GC heap) or native (process working set minus GC heap).</li><li><strong>Capture a memory dump</strong>: <code>dotnet-dump collect -p &lt;pid&gt;</code> — take two dumps 10 minutes apart.</li><li><strong>Analyze with dotnet-dump analyze</strong>: <code>dumpheap -stat</code> shows object count by type. Compare between dumps — growing types are suspects. <code>gcroot &lt;address&gt;</code> shows why an object is retained.</li><li><strong>Common culprits</strong>: Event handlers not unsubscribed (prevents GC of subscriber), static collections growing unbounded, IDisposable not disposed (timer callbacks), string interning/caching without eviction.</li></ol><p><strong>Fix patterns</strong>:</p><ul><li>Use <code>WeakReference&lt;T&gt;</code> for caches that should allow GC</li><li>Use <code>ConditionalWeakTable&lt;K,V&gt;</code> for metadata attached to objects</li><li>Implement bounded caches with eviction (MemoryCache with size limit)</li><li>Use <code>-=</code> to unsubscribe events, or use weak event patterns</li></ul>",
      interviewTip: "Walk through the diagnostic workflow step by step. Mention specific tools: dotnet-counters for live monitoring, dotnet-dump for heap analysis, PerfView for allocation stacks. Show operational experience.",
      followUp: ["What is the difference between a managed memory leak and a native memory leak in .NET?", "How do finalizers and the finalization queue contribute to memory pressure?"],
      seniorPerspective: "In production, set up proactive alerts: GC heap size > 80% of container memory limit, Gen 2 collection rate > 1/min, or LOH size continuously growing. Catch leaks before OOM kills the pod.",
      architectPerspective: "Memory leaks in long-lived services are architectural issues, not just bugs. Design for bounded memory: capped caches, request-scoped lifetimes via DI, and periodic recycling of worker processes (like IIS app pool recycling) as a safety net."
    },
    {
      question: "Design a zero-allocation HTTP request parser using Span<T> and System.IO.Pipelines.",
      difficulty: "expert",
      answer: "<p><strong>Architecture</strong>:</p><ol><li><strong>PipeReader</strong> receives bytes from the socket. We read into ReadOnlySequence&lt;byte&gt;.</li><li><strong>Find delimiter</strong>: Scan for CRLF (\\r\\n) in the sequence to locate header line boundaries.</li><li><strong>Parse without allocation</strong>: Use ReadOnlySpan&lt;byte&gt; slicing on each line. Compare method bytes directly (GET = 3 bytes to compare, no string creation).</li><li><strong>AdvanceTo</strong>: Report consumed position (fully parsed headers) and examined position (all data we've looked at). Partially received headers stay in the pipe.</li></ol><p><strong>Key techniques</strong>:</p><ul><li><code>SequenceReader&lt;byte&gt;</code>: Efficiently walks across sequence segments, handling the segment boundary case (header split across two buffers)</li><li><strong>Utf8 comparison</strong>: Compare bytes directly against known ASCII values. 'GET' is [0x47, 0x45, 0x54] — no encoding/decoding needed.</li><li><strong>Value-type state machine</strong>: Parser state is a struct on the stack. No heap allocation for parser state between reads.</li><li><strong>Pre-allocated header name lookup</strong>: Use FrozenDictionary&lt;ReadOnlyMemory&lt;byte&gt;&gt; for known header names to avoid string allocation for header matching.</li></ul><p>This is essentially how Kestrel's HTTP/1.1 parser works internally. It achieves ~7 million req/sec with near-zero GC pressure from parsing.</p>",
      interviewTip: "You don't need to write the full parser in an interview. Describe the architecture, mention the key APIs (PipeReader, SequenceReader, Span slicing), and explain why each eliminates allocation.",
      followUp: ["How does Kestrel handle HTTP/2 frame parsing differently from HTTP/1.1?", "What are the challenges of parsing across sequence segment boundaries?"],
      seniorPerspective: "In practice, you rarely write your own HTTP parser. But understanding this architecture helps you design zero-allocation parsers for custom protocols (binary protocols, game packets, financial market data feeds).",
      architectPerspective: "The Pipelines+Span architecture represents a template for any high-throughput parser: pooled I/O buffers → back-pressure-aware pipe → zero-copy parsing with Span → pooled output. This pattern applies to database wire protocols, message brokers, and real-time data feeds."
    },
    {
      question: "Compare Server GC vs Workstation GC. How do you choose for a containerized microservice?",
      difficulty: "medium",
      answer: "<p><strong>Server GC</strong>: One managed heap and GC thread per logical processor. Collections happen in parallel across all threads. Higher throughput but uses more memory (one SOH + LOH per core). Better for multi-threaded workloads with high allocation rates.</p><p><strong>Workstation GC</strong>: Single managed heap, single GC thread. Lower memory overhead. Individual GC pauses may block the single GC thread longer, but total memory footprint is predictable.</p><p><strong>Container decision factors</strong>:</p><ul><li><strong>CPU cores available</strong>: 1-2 cores → Workstation (Server GC with 1 heap has overhead with no parallelism benefit). 4+ cores → Server GC.</li><li><strong>Memory limit</strong>: If container limit is tight (256-512MB), Workstation GC uses less memory for its heaps. Server GC may trigger OOM earlier.</li><li><strong>Latency vs throughput</strong>: Server GC has better throughput. Workstation GC has more predictable (though sometimes longer) individual pauses.</li></ul><p><strong>Recommendation for containers</strong>: .NET 8+ has GC DPAD (Dynamic Processor Allocation Detection) — it adjusts heap count based on cgroup CPU limits. Use Server GC with <code>GCHeapCount</code> set to match your container's CPU limit for optimal behavior.</p>",
      interviewTip: "Mention that .NET automatically detects container CPU limits (cgroup v1/v2) since .NET Core 3.0. The runtime adjusts thread pool and GC behavior accordingly.",
      followUp: ["What is GC.TryStartNoGCRegion and when would you use it?", "How does the GC handle memory pressure from the OS or container runtime?"],
      seniorPerspective: "Always test GC mode in production-like load. We've seen cases where switching from Server to Workstation GC in a 2-core container reduced p99 latency by 40% because it eliminated GC thread contention.",
      architectPerspective: "GC configuration should be part of your container sizing strategy. Server GC with N heaps effectively needs N * 2 * segment_size (default 256MB for 64-bit) of free memory to collect efficiently. Under-provisioned memory leads to constant GC thrashing."
    },
    {
      question: "What are FrozenDictionary and FrozenSet? When do they outperform regular collections?",
      difficulty: "medium",
      answer: "<p><strong>FrozenDictionary&lt;TKey, TValue&gt;</strong> and <strong>FrozenSet&lt;T&gt;</strong> (.NET 8+) are immutable collections optimized for read performance after a one-time build phase.</p><p><strong>How they're faster</strong>: During creation (Freeze()), the implementation analyzes the actual data to choose the optimal internal strategy:</p><ul><li>For string keys: May use length-based pre-filtering, then compare only the discriminating substring</li><li>For small collections (≤10 items): Linear scan (cache line friendly, avoids hash computation)</li><li>For integer keys in a small range: Direct array indexing (O(1) with no hashing)</li><li>For general cases: Optimized hash table with pre-computed hash codes stored inline</li></ul><p><strong>Performance gains</strong>: 2-5x faster than Dictionary for lookups. The frozen creation is expensive (analyzes data, chooses strategy), so only amortized over millions of reads.</p><p><strong>Ideal use cases</strong>: Route tables, configuration lookups, enum mappings, HTTP header name matching, MIME type resolution — anything built at startup and queried per-request.</p><p><strong>Not suitable for</strong>: Collections that change, small number of lookups (creation cost not amortized), or when creation latency matters.</p>",
      interviewTip: "Mention that FrozenDictionary is what Kestrel uses internally for header lookup tables. It's a great example of 'optimize for the read path' in request-processing code.",
      followUp: ["How does FrozenDictionary choose its internal implementation strategy?", "What is the difference between ImmutableDictionary and FrozenDictionary in terms of use case?"],
      seniorPerspective: "Profile before switching. FrozenDictionary wins when you have many lookups per creation. For a config dictionary read once per request at 10K req/sec, the win is massive. For a dictionary read once at startup, it's pointless overhead.",
      architectPerspective: "FrozenDictionary represents a broader design principle: optimize for the common case. In web services, reads vastly outnumber writes. Architecture that acknowledges this asymmetry (CQRS, read replicas, frozen reference data) consistently outperforms symmetric designs."
    },
    {
      question: "Explain ValueTask<T> and when it provides benefits over Task<T>. What are the pitfalls?",
      difficulty: "advanced",
      answer: "<p><strong>ValueTask&lt;T&gt;</strong> is a struct (discriminated union) that can wrap either a completed value (no allocation) or an actual Task (when the operation is truly async). It eliminates the Task allocation for the synchronous-completion case.</p><p><strong>When it helps</strong>: Hot async methods that complete synchronously most of the time. Example: cache reads (99% cache hit = synchronous return from ConcurrentDictionary, 1% miss = await network call). With Task&lt;T&gt;, every call allocates a Task object. With ValueTask&lt;T&gt;, the 99% sync path has zero allocation.</p><p><strong>Pitfalls</strong>:</p><ul><li><strong>Cannot await twice</strong>: ValueTask can only be consumed once. Awaiting or calling .Result twice is undefined behavior (not enforced at compile time).</li><li><strong>Cannot use WhenAll/WhenAny</strong>: These require Task. Must call .AsTask() first (which allocates, defeating the purpose).</li><li><strong>IValueTaskSource pooling complexity</strong>: For advanced scenarios, custom IValueTaskSource implementations pool the underlying state machine. Incorrect pooling = use-after-free bugs.</li></ul><p><strong>Rule of thumb</strong>: Use ValueTask&lt;T&gt; for interface methods and virtual methods that are frequently called and usually complete synchronously. Use Task&lt;T&gt; for methods that are genuinely async most of the time.</p>",
      interviewTip: "Mention that .NET runtime itself uses IValueTaskSource extensively (Socket.ReceiveAsync returns ValueTask backed by a pooled AwaitableSocketAsyncEventArgs). This is the pattern for maximum throughput async I/O.",
      followUp: ["How does IValueTaskSource enable object pooling for async operations?", "What diagnostic tools can detect double-await bugs with ValueTask?"],
      seniorPerspective: "In library code, prefer ValueTask for public async APIs because you can't predict whether callers will hit the sync or async path. In application code, Task is fine unless profiling shows allocation pressure from Task objects specifically.",
      architectPerspective: "ValueTask represents the performance maturation of async/await in .NET. The first generation (Task-based) prioritized correctness and usability. ValueTask adds a performance dimension for hot paths. This evolution mirrors how language features mature — correctness first, then zero-cost abstraction."
    }
  ]
});
