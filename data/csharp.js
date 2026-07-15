/* ═══════════════════════════════════════════════════════════════════
   C# — Variables, Types, Collections, LINQ, Delegates
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

// ─── C# Variables & Types ───────────────────────────────────────────
PageData.register('csharp-variables', {
    title: 'C# Variables & Types',
    description: 'Deep understanding of the C# type system — value types, reference types, boxing, nullable, and memory layout.',
    sections: [
        {
            title: 'Value Types vs Reference Types',
            content: `<p>In C#, all types derive from <code>System.Object</code> but fall into two categories that differ in <strong>memory allocation</strong> and <strong>assignment semantics</strong>.</p>
            <ul>
                <li><strong>Value Types</strong> — stored on the stack (or inline in objects), copied on assignment. Includes: <code>int</code>, <code>double</code>, <code>bool</code>, <code>struct</code>, <code>enum</code>, <code>Span&lt;T&gt;</code>.</li>
                <li><strong>Reference Types</strong> — stored on the heap, variables hold a pointer. Includes: <code>class</code>, <code>string</code>, <code>array</code>, <code>delegate</code>, <code>interface</code>.</li>
            </ul>`,
            code: `// Value type — each variable has its own copy
int a = 42;
int b = a;   // b is a COPY
b = 100;     // a is still 42

// Reference type — both point to same object
var list1 = new List<int> { 1, 2, 3 };
var list2 = list1;  // same reference
list2.Add(4);       // list1 now also has 4 elements

// Struct (value type)
public readonly struct Point
{
    public double X { get; init; }
    public double Y { get; init; }
    
    public double DistanceTo(Point other) =>
        Math.Sqrt(Math.Pow(X - other.X, 2) + Math.Pow(Y - other.Y, 2));
}`,
            language: 'csharp'
        },
        {
            title: 'Boxing and Unboxing',
            content: `<p><strong>Boxing</strong> wraps a value type in an object on the heap. <strong>Unboxing</strong> extracts it back. Both have performance costs — boxing allocates heap memory, unboxing requires a type check + copy.</p>`,
            code: `int number = 42;
object boxed = number;   // Boxing: allocates on heap
int unboxed = (int)boxed; // Unboxing: type check + copy

// Hidden boxing in older code:
ArrayList old = new ArrayList();
old.Add(42);  // BOXES the int — avoid this!

// Generic collections avoid boxing:
List<int> modern = new List<int>();
modern.Add(42);  // No boxing — stored as raw int`,
            language: 'csharp',
            callout: { type: 'warning', title: 'Performance Impact', text: 'Boxing allocates ~12 bytes on the heap per value type instance. In hot paths, this causes GC pressure. Use generics and Span<T> to avoid boxing.' }
        },
        {
            title: 'Nullable Value Types & Null Safety',
            content: `<p>C# 8+ introduced <strong>nullable reference types</strong> (NRT) at the compiler level, complementing nullable value types (<code>int?</code>) from C# 2.</p>`,
            code: `// Nullable value type (since C# 2)
int? age = null;
int actualAge = age ?? 0;         // null-coalescing
int required = age!.Value;        // null-forgiving (dangerous!)

// Null-conditional operator
string? name = person?.Address?.City;

// Pattern matching null check
if (name is { Length: > 0 } validName)
{
    Console.WriteLine(validName);
}

// Required members (C# 11)
public class Config
{
    public required string ConnectionString { get; init; }
    public required int MaxRetries { get; init; }
}`,
            language: 'csharp'
        }
    ],
    questions: [
        {"question":"What is the difference between value types and reference types, and where are they stored?","difficulty":"easy","answer":"<p><strong>Value types</strong> (int, bool, struct, enum) hold their data directly and are copied by value on assignment. <strong>Reference types</strong> (class, string, array, delegate) hold a reference to data on the managed heap; assignment copies the reference, so two variables can point to the same object.</p><p>Storage is nuanced: value-type <em>locals</em> typically live on the stack, but a value type that is a field of a class lives on the heap inside that object. The reliable mental model is copy-semantics (value = copied data, reference = shared object), not \"stack vs heap\".</p>","explanation":"A value type is like handing someone a photocopy — they can scribble on it without changing your original. A reference type is like sharing a link to one document — edits by either person change the same file.","bestPractices":["Keep structs small and immutable to avoid costly copies","Use classes for entities with identity and shared state","Prefer copy-semantics reasoning over \"stack vs heap\""],"commonMistakes":["Assuming all value types always live on the stack","Making large mutable structs (expensive copies, surprising bugs)","Expecting changes to a copied struct to affect the original"],"interviewTip":"Lead with copy-semantics (copied data vs shared reference); mention that \"stack vs heap\" is an implementation detail that breaks down for struct fields inside classes.","followUp":["When would you define a struct instead of a class?","What is a readonly struct?","How does the ref keyword change value-type passing?"]},
        {"question":"What is boxing and unboxing in C#, and why is it a performance concern?","difficulty":"medium","answer":"<p><strong>Boxing</strong> wraps a value type in a heap-allocated object so it can be treated as an <code>object</code> (or interface). <strong>Unboxing</strong> extracts the value back out. Each boxing operation allocates on the heap and copies the value; each unboxing does a type check and copy.</p><p>It is a concern because it creates heap allocations and GC pressure, often invisibly — e.g., putting <code>int</code>s into a non-generic collection, string formatting, or calling an interface method on a struct. Generics (List&lt;int&gt;) and Span-based APIs avoid it.</p>","explanation":"Boxing is putting a small item in a big shipping crate just so it fits on a truck that only carries crates. Do it a million times and you have a warehouse full of crates (heap garbage) to clean up.","bestPractices":["Use generic collections (List<int>) instead of ArrayList","Avoid boxing in hot paths and tight loops","Watch for hidden boxing when a struct implements an interface"],"commonMistakes":["Using non-generic collections for value types","Boxing in high-frequency logging/formatting","Ignoring boxing from struct-to-interface calls"],"interviewTip":"Give a concrete hidden-boxing example (int into ArrayList, or struct via interface) — recognizing invisible boxing is the senior signal.","followUp":["How do generics eliminate boxing?","Does calling ToString() on an int box it?","How can a struct implementing an interface cause boxing?"]},
        {
            question: 'What is the difference between a value type and a reference type in C#?',
            difficulty: 'easy',
            answer: `<p>Value types store data directly on the stack (or inline), are copied on assignment, and include <code>int</code>, <code>struct</code>, <code>enum</code>. Reference types store a pointer on the stack that references heap-allocated data — assignment copies the reference, not the data.</p>`,
            explanation: 'Think of value types as sticky notes (each person gets their own copy) and reference types as a shared Google Doc link (everyone edits the same document).',
            code: `struct Point { public int X, Y; }  // Value type
class Person { public string Name; } // Reference type

Point p1 = new Point { X = 1, Y = 2 };
Point p2 = p1;  // Full copy
p2.X = 99;      // p1.X is still 1

Person a = new Person { Name = "Alice" };
Person b = a;   // Same object
b.Name = "Bob"; // a.Name is now "Bob" too`,
            language: 'csharp',
            bestPractices: [
                'Use struct for small, immutable data (< 16 bytes)',
                'Make structs readonly to prevent defensive copies',
                'Use record struct for value semantics with equality',
                'Prefer reference types for complex objects with behavior'
            ],
            commonMistakes: [
                'Mutating structs through interfaces (causes unexpected behavior due to boxing)',
                'Creating large structs (copying overhead exceeds heap allocation)',
                'Confusing assignment semantics — modifying a copied struct doesn\'t affect the original'
            ],
            interviewTip: 'Draw a stack/heap diagram when explaining. Senior interviewers look for understanding of memory layout, not just syntax.',
            followUp: ['How does boxing affect performance?', 'When would you choose struct over class?', 'How do records differ from classes?'],
            seniorPerspective: 'In production, the value vs reference decision impacts GC pressure and cache locality. I use structs for hot-path DTOs in high-throughput APIs (e.g., Span<byte> for parsing), but classes for domain entities with behavior.',
            architectPerspective: 'At scale, understanding allocation patterns determines whether your service can handle 10K or 100K RPS. Tools like BenchmarkDotNet and dotMemory reveal where boxing and heap allocations creep in.'
        },
        {
            question: 'Explain boxing and unboxing. When does it happen implicitly?',
            difficulty: 'medium',
            answer: `<p><strong>Boxing</strong> converts a value type to <code>object</code> (or an interface it implements) by allocating a wrapper on the heap. <strong>Unboxing</strong> extracts the value type from the boxed object with a type check.</p>`,
            explanation: 'Boxing is like putting a number into a shipping box to send through a generic mail system. Unboxing is opening that box and verifying it contains what you expect.',
            code: `// Explicit boxing
int value = 42;
object boxed = value;  // Heap allocation!

// Implicit boxing scenarios:
IComparable c = value;     // Interface assignment
string s = string.Format("{0}", value); // Before interpolation optimization
Dictionary<string, object> dict = new();
dict["key"] = value;       // Boxing!

// Avoiding boxing with generics:
void Process<T>(T value) where T : struct { } // No boxing
Span<int> span = stackalloc int[100]; // Stack only, zero boxing`,
            language: 'csharp',
            bestPractices: [
                'Use generic collections (List<T>) instead of non-generic (ArrayList)',
                'Implement IEquatable<T> on structs to avoid boxing in comparisons',
                'Use constrained generics (where T : struct) for value-type methods',
                'Profile with BenchmarkDotNet to detect hidden boxing'
            ],
            commonMistakes: [
                'Using non-generic collections that box every value type',
                'Calling GetHashCode() or Equals() on structs without overriding (causes boxing)',
                'Passing value types as interface parameters without generics'
            ],
            interviewTip: 'Mention the 12-24 byte overhead per boxing allocation and how it creates GC pressure in hot paths. Show you understand the IL-level mechanics.',
            followUp: ['How can you detect boxing with IL inspection?', 'What\'s the memory overhead of a boxed int?', 'How does Span<T> avoid boxing?'],
            seniorPerspective: 'I\'ve seen services drop from 50K to 5K RPS due to accidental boxing in serialization paths. Always check hot paths with profilers.',
            architectPerspective: 'In high-frequency trading or real-time systems, zero-allocation patterns (Span, stackalloc, object pooling) are non-negotiable. Boxing is the first thing to eliminate.'
        },
        {
            question: 'What are records in C# and when should you use them?',
            difficulty: 'medium',
            answer: `<p><strong>Records</strong> (C# 9+) are reference types with value-based equality semantics. <strong>Record structs</strong> (C# 10+) are value types with the same features. They provide immutability, deconstruction, and with-expressions out of the box.</p>`,
            explanation: 'Records are like pre-printed forms — they define a shape of data and two forms with the same data are considered equal, regardless of which copy you hold.',
            code: `// Record class (reference type, value equality)
public record Person(string FirstName, string LastName, int Age);

// Record struct (value type, value equality)
public readonly record struct Coordinate(double Lat, double Lng);

// Usage
var p1 = new Person("John", "Doe", 35);
var p2 = new Person("John", "Doe", 35);
Console.WriteLine(p1 == p2);  // True (value equality!)

// With-expression (non-destructive mutation)
var p3 = p1 with { Age = 36 };

// Deconstruction
var (first, last, age) = p1;

// Inheritance
public record Employee(string FirstName, string LastName, int Age, string Department) 
    : Person(FirstName, LastName, Age);`,
            language: 'csharp',
            bestPractices: [
                'Use records for DTOs, API responses, and event payloads',
                'Prefer record struct for small value types needing equality',
                'Use with-expressions for immutable updates',
                'Leverage positional syntax for concise declarations'
            ],
            commonMistakes: [
                'Using records for mutable domain entities (records are best for immutable data)',
                'Forgetting that record classes are still reference types (heap allocated)',
                'Not considering the ToString() output in logging (records auto-generate verbose ToString)'
            ],
            interviewTip: 'Show you understand the generated IL: Equals, GetHashCode, ==, !=, ToString, Deconstruct, and the copy constructor for with-expressions.',
            followUp: ['Can records be inherited?', 'What\'s the difference between record class and record struct?', 'How does EF Core work with records?'],
            seniorPerspective: 'Records transformed how I write API contracts. DTOs as records give you immutability, equality, and clean serialization with minimal ceremony.',
            architectPerspective: 'In event-sourced systems, events as records are a perfect fit — immutable, value-equal, and self-documenting through positional parameters.'
        },
        {
            question: 'Explain the difference between const, readonly, and static readonly.',
            difficulty: 'medium',
            answer: `<p><code>const</code> is compile-time constant (inlined at call site), <code>readonly</code> is runtime constant (set in constructor), <code>static readonly</code> is shared across all instances and set once at type initialization.</p>`,
            code: `public class Constants
{
    // Compile-time constant — inlined in IL, cannot be changed without recompilation
    public const int MaxRetries = 3;
    public const string ApiVersion = "v2";
    
    // Runtime constant — set in constructor, per-instance
    public readonly DateTime CreatedAt;
    
    // Static runtime constant — set once for the type
    public static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(30);
    public static readonly Guid ServiceId = Guid.NewGuid(); // Computed at runtime!
    
    public Constants()
    {
        CreatedAt = DateTime.UtcNow; // Allowed: readonly set in ctor
    }
}

// DANGER: const across assemblies
// If Assembly B references Assembly A's const, the VALUE is inlined.
// Updating A without recompiling B = stale values!`,
            language: 'csharp',
            difficulty: 'medium',
            bestPractices: [
                'Use const only for truly immutable values (math constants, protocol versions)',
                'Use static readonly for values computed at runtime',
                'Prefer static readonly for cross-assembly constants to avoid version mismatch',
                'Use readonly struct fields for thread-safe immutable data'
            ],
            commonMistakes: [
                'Using const for values that might change between versions (breaks cross-assembly)',
                'Forgetting that const only works with primitive types and strings',
                'Not marking struct fields readonly (causes defensive copies)'
            ],
            interviewTip: 'The cross-assembly const pitfall is a classic senior-level question. Explain that const values are burned into the calling assembly\'s IL at compile time.',
            followUp: ['What happens with const across assembly boundaries?', 'Can you have a const of a reference type?', 'What is a "defensive copy" with readonly structs?'],
            seniorPerspective: 'I\'ve debugged production issues caused by const versioning. Rule of thumb: use static readonly for any value that might ever change in a library consumed by other assemblies.',
            architectPerspective: 'In distributed systems with NuGet packages, const values in shared libraries can cause subtle bugs when packages are updated independently. Always prefer static readonly for shared configs.'
        },
        {
            question: 'What is Span<T> and how does it improve performance?',
            difficulty: 'advanced',
            answer: `<p><code>Span&lt;T&gt;</code> is a ref struct that provides a type-safe, memory-safe view over contiguous memory (arrays, stackalloc, native memory) without heap allocation. It enables zero-copy slicing and high-performance parsing.</p>`,
            code: `// Span over array (zero allocation slice)
int[] numbers = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
Span<int> slice = numbers.AsSpan(2, 5); // [3, 4, 5, 6, 7] — no copy!
slice[0] = 99; // Modifies original array!

// Span over stackalloc (pure stack, zero GC pressure)
Span<byte> buffer = stackalloc byte[256];
int bytesRead = stream.Read(buffer);
ProcessData(buffer[..bytesRead]);

// String parsing without allocation
ReadOnlySpan<char> input = "2024-01-15".AsSpan();
ReadOnlySpan<char> year = input[..4];   // No string allocation!
ReadOnlySpan<char> month = input[5..7];
ReadOnlySpan<char> day = input[8..10];
int y = int.Parse(year);  // Parse directly from span

// High-performance formatting
Span<char> destination = stackalloc char[64];
if (value.TryFormat(destination, out int written))
{
    ReadOnlySpan<char> formatted = destination[..written];
}`,
            language: 'csharp',
            bestPractices: [
                'Use Span<T> for parsing, formatting, and buffer manipulation',
                'Use ReadOnlySpan<T> for read-only views (string operations)',
                'Combine with stackalloc for zero-allocation temporary buffers',
                'Use Memory<T> when you need to store the reference (Span cannot be stored on heap)'
            ],
            commonMistakes: [
                'Trying to store Span<T> in a class field (ref struct cannot live on heap)',
                'Using Span in async methods (not allowed — use Memory<T> instead)',
                'Creating Span from pinned arrays without understanding lifetime'
            ],
            interviewTip: 'Span<T> is a ref struct — explain WHY it can\'t be stored on the heap (it contains a managed pointer + length, and GC can\'t track interior pointers across async boundaries).',
            followUp: ['Why can\'t Span be used in async methods?', 'What\'s the difference between Span and Memory?', 'How does stackalloc work with Span?'],
            seniorPerspective: 'Span transformed our JSON parsing performance. Switching from string.Substring to Span slicing reduced allocations by 90% in our API serialization layer.',
            architectPerspective: 'In systems processing millions of messages/sec (trading, telemetry), Span + Pipelines (System.IO.Pipelines) is the standard pattern for zero-allocation I/O.'
        },
        {
            question: 'How does the garbage collector work in .NET? Explain generations.',
            difficulty: 'expert',
            answer: `<p>.NET uses a <strong>generational, mark-and-sweep, compacting</strong> garbage collector. Objects are categorized into generations (0, 1, 2) based on survival — younger objects are collected more frequently (generational hypothesis: most objects die young).</p>
            <ul>
                <li><strong>Gen 0</strong> — newly allocated objects. Collected most frequently (~ms). Threshold ~256KB.</li>
                <li><strong>Gen 1</strong> — survived one GC. Buffer between short and long-lived.</li>
                <li><strong>Gen 2</strong> — survived multiple GCs. Collected least frequently. Includes the Large Object Heap (LOH, objects ≥85KB).</li>
            </ul>`,
            explanation: 'Think of GC like a house cleaner with three rooms: a kitchen (Gen 0, cleaned daily), living room (Gen 1, cleaned weekly), and attic (Gen 2, cleaned monthly). New trash goes to the kitchen first.',
            code: `// Force GC (DON'T do this in production!)
GC.Collect(generation: 0, GCCollectionMode.Forced);
GC.WaitForPendingFinalizers();

// Check generation
var obj = new byte[100];
Console.WriteLine(GC.GetGeneration(obj)); // 0

// Monitor GC pressure
Console.WriteLine($"Gen0: {GC.CollectionCount(0)}");
Console.WriteLine($"Gen1: {GC.CollectionCount(1)}");
Console.WriteLine($"Gen2: {GC.CollectionCount(2)}");
Console.WriteLine($"Total Memory: {GC.GetTotalMemory(false):N0} bytes");

// Object pooling to reduce GC pressure
private static readonly ObjectPool<StringBuilder> _pool = 
    new DefaultObjectPoolPolicy<StringBuilder>();

public string BuildReport()
{
    var sb = _pool.Get();
    try
    {
        sb.Clear();
        sb.Append("Report: ");
        // ... build report
        return sb.ToString();
    }
    finally
    {
        _pool.Return(sb);
    }
}

// ArrayPool for temporary arrays
byte[] buffer = ArrayPool<byte>.Shared.Rent(4096);
try
{
    // Use buffer...
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer);
}`,
            language: 'csharp',
            bestPractices: [
                'Never call GC.Collect() in production code',
                'Use object pooling (ArrayPool, ObjectPool) for frequently allocated objects',
                'Implement IDisposable for unmanaged resources',
                'Use weak references for caches that should be GC-collectible',
                'Profile with dotnet-counters and dotnet-trace for GC metrics'
            ],
            commonMistakes: [
                'Calling GC.Collect() thinking it improves performance (it usually hurts)',
                'Creating large objects (>85KB) frequently (LOH is not compacted by default)',
                'Not disposing resources (IDisposable) causing memory leaks',
                'Holding references to large object graphs preventing collection'
            ],
            interviewTip: 'At the architect level, discuss workstation GC vs server GC, background GC, and how to configure GC modes in containerized environments (GC heap limits in Docker).',
            followUp: ['What\'s the difference between workstation and server GC?', 'How does LOH fragmentation affect performance?', 'What are GC roots?', 'How do finalizers work?'],
            seniorPerspective: 'I tune GC behavior per deployment: Server GC for multi-core API servers, Workstation for desktop apps. In Kubernetes, setting GC heap limits prevents OOM kills.',
            architectPerspective: 'For latency-sensitive services, understanding GC pause times (Gen 2 collections can take 10-100ms) is critical. We use metrics dashboards tracking P99 GC pause times alongside response latency.'
        },
        {
            question: 'What is the performance impact of boxing and unboxing, and how do you detect and eliminate it in production code?',
            difficulty: 'hard',
            answer: `<p><strong>Boxing</strong> allocates a new object on the heap every time a value type is converted to a reference type (object, interface, dynamic). This causes: (1) heap allocation pressure increasing GC frequency, (2) memory overhead of the object header (16 bytes on x64), and (3) cache misses because boxed values are scattered on the heap rather than contiguous in memory.</p>
            <p>In hot paths, hidden boxing is a silent performance killer. Common sources include: passing value types to non-generic APIs (string.Format with int args before interpolation), storing structs in non-generic collections, casting to interfaces (e.g., calling IComparable on a struct), and LINQ operations that close over value types.</p>
            <p>Detection: Use a memory profiler (dotMemory, PerfView) to find excessive Gen 0 collections. Use BenchmarkDotNet with <code>[MemoryDiagnoser]</code> to see allocations per operation. Static analysis with Roslyn analyzers (e.g., CA1834, CA1825) can catch some patterns at compile time.</p>`,
            explanation: 'Boxing is like gift-wrapping every coin before putting it in a jar — the wrapping paper costs more than the coin and you have to unwrap it every time you want to use it.',
            code: `// HIDDEN BOXING EXAMPLES:
// 1. String interpolation in older target frameworks:
int count = 42;
string s = string.Format("{0} items", count); // boxes 'count' to object

// 2. Interface dispatch on structs (boxes unless constrained generic):
IComparable comp = 42; // BOXES — allocates on heap
comp.CompareTo(43);     // operates on the boxed copy

// 3. LINQ over value types without struct enumerators:
int[] numbers = { 1, 2, 3, 4, 5 };
var sum = numbers.Cast<object>().Count(); // boxes every element!

// SOLUTIONS:
// 1. Use generic methods with constraints:
public static int CompareValues<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b); // NO boxing — constrained call

// 2. Use Span<T> and stack allocation for temp buffers:
Span<int> buffer = stackalloc int[64];

// 3. Use string interpolation (modern C# avoids boxing):
string modern = $"{count} items"; // C# 10+ with handler, no boxing

// 4. Benchmark to prove it matters:
[Benchmark] public object Boxed() => 42;           // allocates
[Benchmark] public int NotBoxed() => 42;           // no allocation`,
            language: 'csharp',
            bestPractices: [
                'Use generic APIs with constraints instead of object-accepting overloads',
                'Profile with BenchmarkDotNet [MemoryDiagnoser] to measure allocations per operation',
                'Prefer IEquatable<T> and IComparable<T> on structs to avoid interface boxing',
                'Use modern string interpolation handlers (C# 10+) that avoid boxing value types',
                'Run Roslyn analyzers in CI to catch boxing introduced in new code'
            ],
            commonMistakes: [
                'Assuming boxing is always negligible — in hot loops it dominates GC pressure',
                'Implementing only IComparable (non-generic) on structs, forcing boxing on every comparison',
                'Using Dictionary<Enum, T> without a custom comparer (Enum.GetHashCode boxes in older runtimes)',
                'Ignoring boxing in logging calls that accept object params on high-frequency paths'
            ],
            interviewTip: 'Show you can identify HIDDEN boxing scenarios (interface dispatch, LINQ, string formatting) and quantify the cost with tooling. Mentioning the 16-byte object header overhead and GC Gen 0 pressure demonstrates systems-level understanding.',
            followUp: ['How does constrained callvirt avoid boxing on interface calls?', 'What changed with default interface methods regarding boxing?', 'How does the JIT optimize boxing in some cases?']
        },
        {
            question: 'Explain the differences between readonly and const in C#. When would you choose one over the other in a library?',
            difficulty: 'hard',
            answer: `<p><code>const</code> is a <strong>compile-time constant</strong> — its value is embedded directly at every call site during compilation. <code>readonly</code> is a <strong>runtime constant</strong> — its value is assigned once (at declaration or in the constructor) and read from the field at runtime.</p>
            <p>The critical difference for library authors: if you change a <code>const</code> value, all consuming assemblies must be <strong>recompiled</strong> to pick up the new value, because the old value was literally inlined into their IL. A <code>readonly</code> change only requires redeploying the library assembly — consumers read the new value at runtime.</p>
            <p>Additionally, <code>const</code> only supports primitive types and strings (compile-time evaluable). <code>readonly</code> supports any type, including objects initialized at runtime. <code>static readonly</code> is the pattern for "constants" that are reference types or computed values.</p>`,
            explanation: 'const is like printing a number directly on every page of a book — to change it you must reprint every page. readonly is like writing the number on a whiteboard that every page references — you change the whiteboard once and everyone sees it.',
            code: `// CONST — baked into call-site IL at compile time
public const int MaxRetries = 3;
// In consumer's compiled IL: ldc.i4.3 (literal 3, not a field read)

// READONLY — read from the field at runtime
public static readonly TimeSpan Timeout = TimeSpan.FromSeconds(30);
// In consumer's IL: ldsfld (reads the field each time)

// THE VERSIONING TRAP:
// Library v1: public const string ApiVersion = "v1";
// Library v2: public const string ApiVersion = "v2";
// Consumer compiled against v1 STILL uses "v1" until recompiled!

// WHEN TO USE CONST:
// - Truly immutable, never-changing values (Math.PI, bit flags)
// - Private/internal constants (no cross-assembly inlining risk)
public const double Pi = 3.14159265358979;

// WHEN TO USE READONLY / STATIC READONLY:
// - Public values that might change between library versions
// - Reference types or runtime-computed values
// - Configuration-like values in public APIs
public static readonly Encoding Utf8NoBom = new UTF8Encoding(false);
public readonly int Port; // set in constructor

// BEST PATTERN for public "constants":
public static readonly int DefaultPageSize = 25; // safe to change
// Or even better — a property:
public static int DefaultPageSize => 25; // inlineable, versionable`,
            language: 'csharp',
            bestPractices: [
                'Use const only for values that are truly permanent (mathematical constants, private constants)',
                'Use static readonly for public values that could conceivably change between versions',
                'Prefer static properties over public const for API stability and versioning safety',
                'Document that changing a public const is a binary-breaking change for consumers',
                'Use readonly fields for instance-level immutability set in constructors'
            ],
            commonMistakes: [
                'Using public const for version numbers or configuration values that may change',
                'Not realizing that changing a const requires recompilation of ALL consuming assemblies',
                'Using static readonly where const would enable better compiler optimizations (private, truly fixed values)',
                'Confusing readonly with immutability — readonly reference types can still have their contents mutated'
            ],
            interviewTip: 'The key insight interviewers want is the VERSIONING implication: const inlines the value at compile-time, making it a binary-breaking change. Show you understand this is why public library APIs prefer static readonly or properties over const.',
            followUp: ['What types can be const?', 'Can readonly fields be modified via reflection?', 'How does the JIT treat static readonly differently from const?']
        },
        {
            question: 'What is boxing\'s performance impact in hot paths, what are hidden boxing scenarios most developers miss, and how do you eliminate boxing in performance-critical code?',
            difficulty: 'hard',
            answer: `<p>Each boxing operation allocates 12-16 bytes on the heap (object header + method table pointer + value) and creates GC pressure through Gen 0 collections. In hot loops processing millions of items, boxing can dominate both allocation rate and CPU time due to cache misses from scattered heap objects.</p>
            <p>Hidden boxing scenarios include: structs implementing interfaces dispatched through the interface type (e.g., calling IComparable.CompareTo on a struct without a generic constraint), enum values used as dictionary keys (Enum.GetHashCode boxes on older runtimes), string.Format/interpolation with value-type arguments in older target frameworks, and LINQ closures that capture value types into compiler-generated display classes.</p>
            <p>Elimination strategies: use constrained generic calls (where T : IComparable<T>) so the JIT emits constrained.callvirt avoiding boxing; implement IEquatable<T> on structs to avoid object.Equals boxing; use modern interpolated string handlers (C# 10+) that accept generic TWritable; replace Dictionary<Enum, T> with an int-keyed dictionary or provide a custom IEqualityComparer<TEnum> to skip default boxing.</p>`,
            explanation: 'Boxing is wrapping every coin in a shipping box before counting them — the wrapping and unwrapping takes longer than the counting itself when you have millions of coins.',
            code: `// HIDDEN BOXING #1: Interface dispatch on struct
struct MyStruct : IComparable<MyStruct> {
    public int Value;
    public int CompareTo(MyStruct other) => Value - other.Value;
}
IComparable<MyStruct> boxed = new MyStruct(); // BOXES!

// FIX: constrained generic avoids boxing
void Sort<T>(T[] items) where T : IComparable<T> {
    // T.CompareTo called via constrained.callvirt — no boxing
}

// HIDDEN BOXING #2: Enum as dictionary key (pre-.NET 7)
var dict = new Dictionary<DayOfWeek, string>(); // GetHashCode boxes!
// FIX:
var dict = new Dictionary<DayOfWeek, string>(EnumComparer<DayOfWeek>.Default);

// HIDDEN BOXING #3: Interpolation on older TFMs
int count = 42;
string s = $"Count: {count}"; // may box on netstandard2.0 targets

// DETECTION: BenchmarkDotNet
[MemoryDiagnoser]
public class BoxingBenchmark {
    [Benchmark] public object WithBoxing() => 42; // 24 bytes allocated
    [Benchmark] public int NoBoxing() => 42;      // 0 bytes allocated
}`,
            language: 'csharp',
            bestPractices: [
                'Use constrained generics (where T : IInterface<T>) to avoid interface dispatch boxing',
                'Implement IEquatable<T> on all custom structs used in collections',
                'Use [MemoryDiagnoser] in BenchmarkDotNet to detect per-operation allocations from boxing',
                'Provide custom IEqualityComparer<TEnum> for enum dictionary keys',
                'Target .NET 7+ where many framework APIs have been de-boxed'
            ],
            commonMistakes: [
                'Assuming generic collections never box (interface dispatch through a non-generic path still boxes)',
                'Not profiling — boxing is invisible in code review without tooling',
                'Over-optimizing cold paths where boxing overhead is immeasurable',
                'Using object parameters in logging APIs called on every request'
            ],
            interviewTip: 'Demonstrate you can identify non-obvious boxing (interface dispatch, enum keys, older interpolation) and that you use profiling to confirm before optimizing. Mention the 16-byte per-box overhead and Gen 0 pressure as the primary costs.',
            followUp: ['How does constrained.callvirt at the IL level prevent boxing?', 'What changed in .NET 7 regarding Enum.GetHashCode boxing?', 'How do you detect boxing with PerfView or dotnet-trace?']
        },
        {
            question: 'What are ref structs and Span<T>? Explain the stack-only constraint, why they cannot be used in async methods, and when you would use them for zero-allocation parsing.',
            difficulty: 'advanced',
            answer: `<p>A <code>ref struct</code> is a value type that the compiler guarantees will only ever live on the stack — it cannot be boxed, stored in a class field, captured in a lambda, or used across await boundaries. <code>Span&lt;T&gt;</code> is the most important ref struct: it provides a type-safe, bounds-checked view over contiguous memory (arrays, stackalloc, native buffers) without allocating.</p>
            <p>The stack-only constraint exists because Span internally holds a managed reference (ByReference<T>) plus a length. The GC cannot track interior managed pointers that escape to the heap — if a Span were stored on the heap, the GC might move the underlying array while the Span still points to the old location, causing memory corruption.</p>
            <p>For zero-allocation parsing, Span enables slicing strings and buffers without creating new string objects: ReadOnlySpan<char> can slice a string into tokens using Slice or range operators, and int.Parse/DateTime.Parse accept spans directly. Combined with stackalloc for temporary buffers, entire parsing pipelines produce zero heap allocations — critical for high-throughput JSON/protocol parsing.</p>`,
            explanation: 'A ref struct is like a library book that can never leave the building — it is powerful while you are inside (stack scope), but the librarian physically prevents it from going home with you (heap/async).',
            code: `// ref struct — compiler-enforced stack-only lifetime
public ref struct TokenParser {
    private ReadOnlySpan<char> _remaining;
    
    public TokenParser(ReadOnlySpan<char> input) => _remaining = input;
    
    public ReadOnlySpan<char> NextToken(char delimiter) {
        int idx = _remaining.IndexOf(delimiter);
        if (idx == -1) {
            var token = _remaining;
            _remaining = ReadOnlySpan<char>.Empty;
            return token;
        }
        var result = _remaining[..idx];
        _remaining = _remaining[(idx + 1)..];
        return result;
    }
}

// Zero-allocation CSV line parsing
public static void ParseCsvLine(ReadOnlySpan<char> line) {
    var parser = new TokenParser(line);
    ReadOnlySpan<char> name = parser.NextToken(',');   // no string alloc
    ReadOnlySpan<char> ageStr = parser.NextToken(','); // no string alloc
    int age = int.Parse(ageStr);                       // parses from span
}

// stackalloc + Span for temp buffers
Span<byte> buffer = stackalloc byte[512];
int bytesWritten = Encoding.UTF8.GetBytes(input, buffer);
ProcessUtf8(buffer[..bytesWritten]); // zero heap allocation

// CANNOT DO with ref structs:
// class Holder { Span<int> field; }          // ERROR: heap storage
// async Task Foo() { Span<int> s = ...; }    // ERROR: across await
// Func<Span<int>> factory = () => ...;       // ERROR: lambda capture`,
            language: 'csharp',
            bestPractices: [
                'Use Span<T>/ReadOnlySpan<T> for parsing hot paths to eliminate substring allocations',
                'Use stackalloc with Span for temporary buffers under 512 bytes',
                'Use Memory<T>/ReadOnlyMemory<T> when you need heap storage or async compatibility',
                'Combine with System.IO.Pipelines for zero-allocation network I/O',
                'Benchmark with [MemoryDiagnoser] to confirm zero allocations'
            ],
            commonMistakes: [
                'Trying to use Span<T> in async methods — use Memory<T>.Span within synchronous sections instead',
                'Allocating large stackalloc buffers that overflow the stack (keep under ~1KB)',
                'Returning a Span that references a local stackalloc buffer (dangling pointer)',
                'Forgetting that ReadOnlySpan<char> from string.AsSpan() cannot outlive the string'
            ],
            interviewTip: 'Explain the WHY behind the constraint: GC cannot track interior pointers on the heap. Then show a practical zero-alloc parsing example. Mentioning Memory<T> as the async-friendly alternative shows you understand the full picture.',
            followUp: ['What is the difference between Span<T> and Memory<T>?', 'How does System.IO.Pipelines use Span internally?', 'Can a ref struct implement interfaces in C# 13?']
        }
    ]
});
