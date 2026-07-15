/* ═══════════════════════════════════════════════════════════════════
   C# — Collections, Data Structures, Concurrent Collections
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('csharp-collections', {
    title: 'C# Collections & Data Structures',
    description: 'Mastering List<T>, Dictionary<TKey,TValue>, HashSet<T>, concurrent collections, and choosing the right data structure for performance-critical scenarios.',
    sections: [
        {
            title: 'Collection Hierarchy Overview',
            content: `<p>C# collections live in <code>System.Collections.Generic</code> (strongly-typed) and <code>System.Collections.Concurrent</code> (thread-safe). Key interfaces form a hierarchy:</p>
            <ul>
                <li><code>IEnumerable&lt;T&gt;</code> — iteration only (forward, read-only)</li>
                <li><code>ICollection&lt;T&gt;</code> — adds Count, Add, Remove, Contains</li>
                <li><code>IList&lt;T&gt;</code> — adds indexer, Insert, RemoveAt</li>
                <li><code>IDictionary&lt;TKey, TValue&gt;</code> — key-value lookup</li>
                <li><code>ISet&lt;T&gt;</code> — unique elements, set operations</li>
            </ul>`,
            code: `// Interface hierarchy
IEnumerable<T>        // foreach support
  └── ICollection<T>  // Count, Add, Remove
        ├── IList<T>          // Index access [i]
        ├── ISet<T>           // UnionWith, IntersectWith
        └── IDictionary<K,V>  // Key-value pairs

// Common implementations
List<T>                    // Dynamic array, O(1) index, O(n) insert
Dictionary<TKey, TValue>   // Hash table, O(1) lookup
HashSet<T>                 // Unique items, O(1) contains
SortedDictionary<K,V>     // Red-black tree, O(log n) operations
LinkedList<T>              // Doubly-linked, O(1) insert at known node
Queue<T>                   // FIFO, O(1) enqueue/dequeue
Stack<T>                   // LIFO, O(1) push/pop
PriorityQueue<T, P>       // .NET 6+, O(log n) enqueue/dequeue`,
            language: 'csharp'
        },
        {
            title: 'List<T> — The Workhorse',
            content: `<p><code>List&lt;T&gt;</code> is a dynamic array that doubles capacity when full. It provides O(1) amortized Add and O(1) random access, but O(n) insertion/removal at arbitrary positions.</p>`,
            code: `// Basic usage
var users = new List<User>(capacity: 100); // Pre-allocate if size known
users.Add(new User("Alice", 30));
users.AddRange(moreUsers);

// Performance-aware patterns
users.Sort((a, b) => a.Age.CompareTo(b.Age)); // In-place sort
int idx = users.BinarySearch(target, comparer); // O(log n) on sorted list

// Span access (zero-copy slice) — .NET 5+
Span<User> slice = CollectionsMarshal.AsSpan(users);
ref User first = ref slice[0]; // Direct memory access

// EnsureCapacity — avoid reallocations
users.EnsureCapacity(10000);

// Common pitfall: Remove during iteration
// WRONG: foreach + Remove causes InvalidOperationException
// RIGHT: Use RemoveAll or iterate backwards
users.RemoveAll(u => u.Age < 18);

// Or iterate backwards for manual removal:
for (int i = users.Count - 1; i >= 0; i--)
{
    if (users[i].IsInactive) users.RemoveAt(i);
}`,
            language: 'csharp',
            callout: { type: 'warning', title: 'Capacity vs Count', text: 'List<T>.Capacity is the internal array size. Count is how many items are stored. When Count exceeds Capacity, the list allocates a new array (2x size) and copies everything — O(n) operation. Pre-size when possible.' }
        },
        {
            title: 'Dictionary<TKey, TValue> — Hash Table',
            content: `<p><code>Dictionary&lt;TKey, TValue&gt;</code> provides O(1) average-case lookup, insertion, and deletion via hashing. Keys must implement <code>GetHashCode()</code> and <code>Equals()</code> correctly.</p>`,
            code: `// Creation patterns
var cache = new Dictionary<string, User>(StringComparer.OrdinalIgnoreCase);

// Safe access patterns
if (cache.TryGetValue("alice", out var user))
{
    Console.WriteLine(user.Name);
}

// GetOrAdd pattern (manual)
if (!cache.TryGetValue(key, out var value))
{
    value = ExpensiveComputation(key);
    cache[key] = value;
}

// CollectionsMarshal.GetValueRefOrAddDefault — .NET 6+ (zero-copy)
ref var entry = ref CollectionsMarshal.GetValueRefOrAddDefault(cache, key, out bool exists);
if (!exists)
{
    entry = new User("New", 0); // Write directly to dictionary slot
}

// Bulk operations
var grouped = users.ToDictionary(u => u.Id, u => u); // Throws on duplicate keys
var lookup = users.ToLookup(u => u.Department); // Allows duplicate keys

// Custom equality comparer
public class CaseInsensitiveComparer : IEqualityComparer<string>
{
    public bool Equals(string x, string y) => 
        string.Equals(x, y, StringComparison.OrdinalIgnoreCase);
    public int GetHashCode(string obj) => 
        obj.ToUpperInvariant().GetHashCode();
}`,
            language: 'csharp'
        },
        {
            title: 'Concurrent Collections',
            content: `<p>Thread-safe collections in <code>System.Collections.Concurrent</code> use fine-grained locking or lock-free algorithms for high-throughput multi-threaded scenarios.</p>`,
            code: `// ConcurrentDictionary — thread-safe hash table
var counters = new ConcurrentDictionary<string, int>();
counters.AddOrUpdate("pageViews", 1, (key, old) => old + 1);
var value = counters.GetOrAdd("sessions", key => ComputeDefault(key));

// ConcurrentQueue — lock-free FIFO
var queue = new ConcurrentQueue<WorkItem>();
queue.Enqueue(new WorkItem());
if (queue.TryDequeue(out var item)) Process(item);

// ConcurrentBag — unordered, optimized for same-thread add/take
var bag = new ConcurrentBag<Connection>();
bag.Add(connection);
if (bag.TryTake(out var conn)) Use(conn);

// Channel<T> — modern producer/consumer (.NET Core 3+)
var channel = Channel.CreateBounded<Message>(new BoundedChannelOptions(1000)
{
    FullMode = BoundedChannelFullMode.Wait
});

// Producer
await channel.Writer.WriteAsync(new Message("Hello"));

// Consumer
await foreach (var msg in channel.Reader.ReadAllAsync())
{
    await ProcessAsync(msg);
}`,
            language: 'csharp',
            callout: { type: 'info', title: 'Channel vs ConcurrentQueue', text: 'Channel<T> is the preferred choice for async producer/consumer patterns. It supports backpressure (bounded), async enumeration, and clean completion signaling. ConcurrentQueue requires manual polling.' }
        },
        {
            title: 'Choosing the Right Collection',
            content: `<p>Selecting the appropriate collection is a key performance decision. Consider: access pattern, thread safety, ordering requirements, and memory overhead.</p>`,
            table: {
                headers: ['Scenario', 'Best Choice', 'Why'],
                rows: [
                    ['Index-based access', 'List&lt;T&gt;', 'O(1) random access, contiguous memory'],
                    ['Key-value lookup', 'Dictionary&lt;K,V&gt;', 'O(1) hash-based lookup'],
                    ['Unique items + set ops', 'HashSet&lt;T&gt;', 'O(1) Contains, union/intersect'],
                    ['Sorted key-value', 'SortedDictionary&lt;K,V&gt;', 'O(log n) ordered iteration'],
                    ['FIFO processing', 'Queue&lt;T&gt; or Channel&lt;T&gt;', 'O(1) enqueue/dequeue'],
                    ['LIFO/undo stack', 'Stack&lt;T&gt;', 'O(1) push/pop'],
                    ['Priority scheduling', 'PriorityQueue&lt;T,P&gt;', 'O(log n) ordered by priority'],
                    ['Thread-safe lookup', 'ConcurrentDictionary', 'Fine-grained locking'],
                    ['Async producer/consumer', 'Channel&lt;T&gt;', 'Backpressure + async'],
                    ['Immutable snapshots', 'ImmutableList&lt;T&gt;', 'Thread-safe sharing, structural sharing']
                ]
            }
        }
    ],
    questions: [
        {"question":"When would you choose a Dictionary, a List, and a HashSet, and what are their lookup costs?","difficulty":"easy","answer":"<p><strong>List&lt;T&gt;</strong> is an ordered, index-accessible sequence — great for iteration and positional access; <code>Contains</code> is O(n). <strong>Dictionary&lt;K,V&gt;</strong> maps keys to values with O(1) average lookup/insert by key. <strong>HashSet&lt;T&gt;</strong> stores unique items with O(1) average membership tests and set operations.</p><p>Choose by the dominant operation: index/iteration → List; keyed lookup → Dictionary; uniqueness / fast \"does it contain?\" → HashSet. Dictionary and HashSet rely on good <code>GetHashCode</code>/<code>Equals</code>.</p>","explanation":"A List is a numbered row of lockers (go straight to #5, but scan them all to find a name). A Dictionary is a coat check (give a ticket, get the coat instantly). A HashSet is a guest list you only check names against.","bestPractices":["Pick the structure by the dominant operation","Ensure good GetHashCode/Equals for keys/set elements","Pre-size collections when the count is known to avoid resizes"],"commonMistakes":["Using List.Contains in a hot loop (O(n)) instead of a HashSet","Poor/ mutable hash keys causing lookups to miss","Choosing a structure by habit rather than access pattern"],"interviewTip":"Answer by access pattern and Big-O: \"keyed lookup → Dictionary O(1), uniqueness → HashSet O(1), iteration/index → List\".","followUp":["What makes a good dictionary key?","When would you use a SortedDictionary?","What is the cost of List insertion in the middle?"]},
        {"question":"What is the difference between IEnumerable, ICollection, and IList?","difficulty":"medium","answer":"<p>They form a capability hierarchy. <strong>IEnumerable&lt;T&gt;</strong> is the minimum — forward iteration only (foreach), and supports lazy/deferred sequences. <strong>ICollection&lt;T&gt;</strong> adds <code>Count</code>, <code>Add</code>, <code>Remove</code>, and <code>Contains</code> (a known-size, modifiable collection). <strong>IList&lt;T&gt;</strong> adds positional access — indexing and <code>Insert</code>/<code>RemoveAt</code>.</p><p>Expose the least specific type that satisfies callers: return IEnumerable for read-only iteration, ICollection when count/membership matters, IList when index access is required.</p>","explanation":"It is like access levels: IEnumerable lets you walk the line of people; ICollection lets you count them and add/remove; IList lets you say \"the 3rd person\" and insert someone at position 2.","bestPractices":["Accept the least specific interface parameters need","Return IEnumerable for read-only sequences","Be aware IEnumerable may be lazily evaluated (multiple enumeration)"],"commonMistakes":["Returning List<T> everywhere, leaking implementation","Enumerating an IEnumerable multiple times (re-runs the query)","Requiring IList when IEnumerable would do"],"interviewTip":"Describe it as a capability ladder (iterate → count/modify → index) and mention exposing the least-specific type.","followUp":["What is multiple enumeration and why is it risky?","When does IReadOnlyList fit?","How does deferred execution relate to IEnumerable?"]},
        {
            question: 'What is the difference between List<T> and Array in C#? When would you choose one over the other?',
            difficulty: 'easy',
            answer: `<p><code>Array</code> is fixed-size (allocated once), while <code>List&lt;T&gt;</code> is a dynamic array that grows automatically. List&lt;T&gt; wraps an internal array and provides convenience methods (Add, Remove, Find, Sort).</p>
            <ul>
                <li><strong>Array</strong>: fixed size, slightly less overhead, best for known-size buffers and interop</li>
                <li><strong>List&lt;T&gt;</strong>: dynamic size, richer API, best for general-purpose collections</li>
            </ul>`,
            code: `// Array — fixed size, allocated on heap (or stack with stackalloc)
int[] numbers = new int[100];
numbers[0] = 42;
// numbers.Add(1); // ERROR: no Add method!

// List<T> — dynamic, resizable
var list = new List<int>(capacity: 100);
list.Add(42);
list.AddRange(new[] { 1, 2, 3 });

// Performance comparison:
// Array:  Lower memory overhead (no object header beyond array)
// List:   Extra 16 bytes (Count, Capacity, internal array reference)
// Both:   O(1) index access, contiguous memory (cache-friendly)

// When to use Array:
// - Fixed-size buffers (byte[] for I/O)
// - Interop with native code
// - stackalloc for zero-heap temporary buffers
Span<byte> buffer = stackalloc byte[256];

// When to use List<T>:
// - Size unknown at compile time
// - Need Add/Remove/Find/Sort operations
// - Building collections incrementally`,
            language: 'csharp',
            bestPractices: [
                'Use List<T> for general-purpose dynamic collections',
                'Use arrays for fixed-size buffers, especially in I/O paths',
                'Pre-allocate List<T> capacity when size is approximately known',
                'Use Span<T> or Memory<T> for slicing without allocation'
            ],
            commonMistakes: [
                'Not pre-sizing List<T> when final size is known (causes repeated resizing)',
                'Using arrays when the collection needs to grow dynamically',
                'Returning List<T> from public APIs (expose IReadOnlyList<T> instead)'
            ],
            interviewTip: 'Mention that List<T> internally IS an array — it just manages resizing for you. Show awareness of the doubling strategy and its amortized O(1) complexity.',
            followUp: ['What happens when List<T> runs out of capacity?', 'How does List<T>.Sort compare to Array.Sort?', 'What is CollectionsMarshal.AsSpan?'],
            seniorPerspective: 'In high-throughput APIs, I expose IReadOnlyList<T> from services and use List<T> internally. For hot paths, ArrayPool<T>.Shared avoids repeated allocations entirely.',
            architectPerspective: 'At scale, collection choices cascade: a List<T> returned from a repository that gets serialized 10K times/sec means 10K array allocations. Consider returning IAsyncEnumerable<T> for streaming scenarios.'
        },
        {
            question: 'How does Dictionary<TKey, TValue> work internally? What are hash collisions and how are they resolved?',
            difficulty: 'medium',
            answer: `<p>Dictionary uses a <strong>hash table</strong> with separate chaining. Internally it maintains two arrays: <code>buckets</code> (indices) and <code>entries</code> (key-value-hash-next). When adding a key, it computes <code>GetHashCode()</code>, maps to a bucket index, and stores the entry. Collisions are handled by chaining entries in the same bucket via a linked list (next pointers in the entries array).</p>`,
            code: `// Simplified internal structure:
// buckets: int[] — maps hash % length → first entry index
// entries: Entry[] — stores { hashCode, next, key, value }

// Lookup: dict["alice"]
// 1. hash = "alice".GetHashCode()      → 1234567
// 2. bucket = hash % buckets.Length     → 42
// 3. entryIndex = buckets[42]           → 7
// 4. Walk chain: entries[7].key == "alice"? → Yes! Return value

// Collision resolution (separate chaining):
// If two keys hash to same bucket:
// entries[7] = { hash=111, next=12, key="alice", value=... }
// entries[12] = { hash=222, next=-1, key="bob", value=... }
// Both in bucket 42, linked via 'next'

// CRITICAL: GetHashCode() contract
public class UserId
{
    public int Id { get; }
    
    // MUST override both when used as dictionary key
    public override int GetHashCode() => Id.GetHashCode();
    public override bool Equals(object obj) => 
        obj is UserId other && Id == other.Id;
}

// Performance degradation:
// Good hash distribution: O(1) average lookup
// Poor distribution (all same bucket): O(n) — becomes linked list!
// .NET resizes when load factor exceeds threshold (~72%)`,
            language: 'csharp',
            bestPractices: [
                'Always override both GetHashCode() and Equals() together',
                'Use immutable keys (mutable keys that change hash = lost entries)',
                'Specify initial capacity to avoid rehashing: new Dictionary<K,V>(expectedSize)',
                'Use StringComparer.OrdinalIgnoreCase for case-insensitive string keys'
            ],
            commonMistakes: [
                'Overriding Equals without GetHashCode (violates contract, causes lookup failures)',
                'Using mutable objects as keys then mutating them (entry becomes unreachable)',
                'Not specifying a comparer for string keys (default is case-sensitive ordinal)',
                'Calling dict[key] without checking existence (throws KeyNotFoundException)'
            ],
            interviewTip: 'Draw the buckets/entries structure. Explain the hash → bucket index → chain walk process. Mention that .NET uses prime-number bucket counts and resizes at ~72% load factor.',
            followUp: ['What happens during dictionary resize?', 'Why must GetHashCode be consistent with Equals?', 'How does FrozenDictionary (.NET 8) differ?'],
            seniorPerspective: 'I use FrozenDictionary<K,V> for lookup tables that are built once and read millions of times — it optimizes the hash function at freeze time for the actual keys present.',
            architectPerspective: 'In distributed caches (Redis), understanding hash distribution is critical for even key distribution across shards. The same principles apply at a larger scale.'
        },
        {
            question: 'What is the difference between IEnumerable<T>, ICollection<T>, and IList<T>? Which should you use for method parameters and return types?',
            difficulty: 'medium',
            answer: `<p>These interfaces form a hierarchy of increasing capability:</p>
            <ul>
                <li><code>IEnumerable&lt;T&gt;</code> — read-only forward iteration (foreach). Supports deferred execution (LINQ).</li>
                <li><code>ICollection&lt;T&gt;</code> — adds Count, Add, Remove, Contains. Implies materialized collection.</li>
                <li><code>IList&lt;T&gt;</code> — adds index access [i], Insert, RemoveAt. Implies ordered, indexed collection.</li>
            </ul>`,
            code: `// Method parameter: accept the LEAST specific interface needed
public double CalculateAverage(IEnumerable<int> numbers)  // Most flexible
{
    return numbers.Average(); // Works with any sequence
}

// Return type: expose the LEAST capability the caller needs
public IReadOnlyList<User> GetActiveUsers()  // Ordered, indexed, but immutable
{
    return _users.Where(u => u.IsActive).ToList();
}

public IReadOnlyDictionary<int, User> GetUserLookup()  // Read-only lookup
{
    return _users.ToDictionary(u => u.Id);
}

// AVOID: exposing concrete types
// BAD: public List<User> GetUsers() — caller can modify internal state!
// GOOD: public IReadOnlyList<User> GetUsers()

// Interface selection guide:
// Accept:  IEnumerable<T>  (maximum flexibility for callers)
// Return:  IReadOnlyList<T> or IReadOnlyCollection<T> (prevent mutation)
// Internal: List<T>, Dictionary<K,V> (concrete for performance)

// IAsyncEnumerable<T> for streaming (C# 8+)
public async IAsyncEnumerable<User> StreamUsersAsync(
    [EnumeratorCancellation] CancellationToken ct = default)
{
    await foreach (var user in _dbContext.Users.AsAsyncEnumerable())
    {
        ct.ThrowIfCancellationRequested();
        yield return user;
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Accept the least specific interface as parameters (IEnumerable<T> for read)',
                'Return IReadOnlyList<T> or IReadOnlyCollection<T> from public APIs',
                'Use concrete types internally for performance (List<T>, Dictionary<K,V>)',
                'Use IAsyncEnumerable<T> for streaming large result sets'
            ],
            commonMistakes: [
                'Returning List<T> from public methods (exposes mutation)',
                'Accepting IList<T> when only iteration is needed (over-constrains callers)',
                'Multiple enumeration of IEnumerable<T> without materializing (can cause multiple DB queries)',
                'Assuming IEnumerable<T> is materialized (it might be a deferred LINQ query)'
            ],
            interviewTip: 'This is a design question. Show you think about API contracts: what you accept vs. what you return. Mention Postel\'s Law: be liberal in what you accept, conservative in what you return.',
            followUp: ['What is multiple enumeration and why is it dangerous?', 'When would you use IAsyncEnumerable?', 'What is IReadOnlyCollection vs IReadOnlyList?'],
            seniorPerspective: 'I follow the rule: accept IEnumerable<T>, return IReadOnlyList<T>. It gives callers maximum flexibility while protecting internal state. For hot paths, I use Span<T> or Memory<T> to avoid allocations entirely.',
            architectPerspective: 'In API boundaries (service layers, gRPC), collection interface choices determine whether you can stream or must buffer. IAsyncEnumerable enables backpressure-aware streaming in high-volume scenarios.'
        },
        {
            question: 'When would you use ConcurrentDictionary vs a regular Dictionary with locking? What are the pitfalls?',
            difficulty: 'advanced',
            answer: `<p><code>ConcurrentDictionary</code> uses fine-grained locking (striped locks) for high-throughput concurrent access. A regular Dictionary with a single lock serializes all operations. Choose ConcurrentDictionary when multiple threads read/write frequently; use lock + Dictionary when operations need to be atomic across multiple keys or when the dictionary is rarely contested.</p>`,
            code: `// ConcurrentDictionary — fine-grained locking
var cache = new ConcurrentDictionary<string, ExpensiveObject>();

// PITFALL: Factory can execute multiple times!
var value = cache.GetOrAdd("key", key => {
    // This factory may run concurrently for the same key!
    // Only ONE result is stored, but computation happens multiple times
    return ExpensiveComputation(key);
});

// Solution: Lazy<T> wrapper for expensive factories
var lazyCache = new ConcurrentDictionary<string, Lazy<ExpensiveObject>>();
var lazyValue = lazyCache.GetOrAdd("key", 
    key => new Lazy<ExpensiveObject>(() => ExpensiveComputation(key)));
var result = lazyValue.Value; // Only one thread computes

// PITFALL: Compound operations are NOT atomic
// This is NOT thread-safe:
if (!cache.ContainsKey("key"))     // Another thread might add between
    cache.TryAdd("key", value);     // these two lines!

// Use atomic operations instead:
cache.AddOrUpdate("key", 
    addValue: newValue,
    updateValueFactory: (key, existing) => Merge(existing, newValue));

// When to use lock + Dictionary instead:
private readonly object _lock = new();
private readonly Dictionary<string, Account> _accounts = new();

public void Transfer(string from, string to, decimal amount)
{
    lock (_lock) // Need atomicity across multiple keys
    {
        _accounts[from].Balance -= amount;
        _accounts[to].Balance += amount;
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Use ConcurrentDictionary for independent key operations with high concurrency',
                'Use Lazy<T> values to prevent duplicate factory execution',
                'Use lock + Dictionary when operations span multiple keys atomically',
                'Prefer Channel<T> over ConcurrentQueue for producer/consumer patterns'
            ],
            commonMistakes: [
                'Assuming GetOrAdd factory runs only once (it can run concurrently)',
                'Performing check-then-act (ContainsKey + TryAdd) without atomicity',
                'Using ConcurrentDictionary when atomicity across keys is needed',
                'Not considering that AddOrUpdate factory can also run multiple times'
            ],
            interviewTip: 'Show awareness of the double-execution pitfall in GetOrAdd. Explain striped locking (ConcurrentDictionary uses ~32 locks by default, each covering a bucket range). Compare throughput characteristics.',
            followUp: ['How does ConcurrentDictionary implement striped locking?', 'What is the performance difference vs ReaderWriterLockSlim?', 'When would you use ImmutableDictionary instead?'],
            seniorPerspective: 'In production caches, I use ConcurrentDictionary<string, Lazy<Task<T>>> for async cache-aside patterns. The Lazy ensures only one async operation fires per key, even under thundering herd.',
            architectPerspective: 'At scale, in-process ConcurrentDictionary is a starting point. We typically graduate to distributed caches (Redis) with consistent hashing for horizontal scaling, keeping ConcurrentDictionary as L1 cache.'
        },
        {
            question: 'What are immutable collections and when should you use them?',
            difficulty: 'advanced',
            answer: `<p>Immutable collections (in <code>System.Collections.Immutable</code>) cannot be modified after creation. Every "modification" returns a new collection, sharing structure with the original (structural sharing). They are inherently thread-safe and ideal for functional programming patterns, snapshot semantics, and undo/redo.</p>`,
            code: `using System.Collections.Immutable;

// Creation
var list = ImmutableList<int>.Empty;
var list2 = list.Add(1).Add(2).Add(3); // Returns new list each time

// Builder pattern for bulk creation (avoids intermediate allocations)
var builder = ImmutableList.CreateBuilder<int>();
builder.AddRange(Enumerable.Range(1, 10000));
ImmutableList<int> final = builder.ToImmutable();

// ImmutableDictionary
var config = ImmutableDictionary<string, string>.Empty
    .Add("host", "localhost")
    .Add("port", "5432");

var updated = config.SetItem("port", "5433"); // New dict, original unchanged

// FrozenDictionary (.NET 8) — optimized for read-heavy after creation
FrozenDictionary<string, int> lookup = data.ToFrozenDictionary(x => x.Key, x => x.Value);
// Optimizes hash function for the actual keys present — faster reads than Dictionary!

// Use cases:
// 1. Thread-safe sharing without locks
// 2. Snapshot semantics (event sourcing state)
// 3. Undo/redo (keep history of immutable states)
// 4. Configuration that should never be mutated accidentally

// Performance comparison:
// ImmutableList<T>.Add     → O(log n) — tree-based
// ImmutableArray<T>.Add    → O(n) — copies entire array
// FrozenDictionary lookup  → faster than Dictionary (optimized hash)`,
            language: 'csharp',
            bestPractices: [
                'Use ImmutableList<T> for frequent modifications (structural sharing, O(log n))',
                'Use ImmutableArray<T> for rarely-modified, frequently-read collections',
                'Use FrozenDictionary/FrozenSet for build-once-read-many scenarios (.NET 8+)',
                'Use Builder pattern for bulk construction of immutable collections'
            ],
            commonMistakes: [
                'Using ImmutableArray for frequent Add/Remove (O(n) copies each time)',
                'Forgetting to capture the return value: list.Add(item) does NOT modify list',
                'Not using builders for batch creation (creating 1000 intermediate lists)',
                'Choosing immutable collections where ConcurrentDictionary is more appropriate'
            ],
            interviewTip: 'Differentiate between ImmutableList (tree-based, O(log n) modification) and ImmutableArray (copied, O(n) modification but O(1) index). Mention FrozenDictionary for .NET 8+ as the go-to for lookup tables.',
            followUp: ['How does structural sharing work in ImmutableList?', 'What is the difference between ImmutableArray and ReadOnlyCollection?', 'When would you choose FrozenDictionary over Dictionary?'],
            seniorPerspective: 'I use ImmutableDictionary for configuration state in DI — services get a snapshot that can never be corrupted by concurrent updates. FrozenDictionary replaced our static Dictionary lookups with measurable throughput improvement.',
            architectPerspective: 'In event-sourced systems, aggregate state as immutable collections enables time-travel debugging, concurrent read access without locks, and clean snapshot isolation between event projections.'
        },
        {
            question: 'Explain HashSet<T> and its set operations. When is it better than List<T>?',
            difficulty: 'easy',
            answer: `<p><code>HashSet&lt;T&gt;</code> stores unique elements with O(1) Contains, Add, and Remove (average case). It provides mathematical set operations: union, intersection, difference, and symmetric difference. Use it over List&lt;T&gt; when you need fast membership testing or need to enforce uniqueness.</p>`,
            code: `// Basic usage — enforces uniqueness
var tags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
tags.Add("CSharp");
tags.Add("csharp"); // Returns false — duplicate (case-insensitive)

// Fast membership testing — O(1) vs List's O(n)
if (tags.Contains("CSharp")) { /* O(1) lookup */ }

// Set operations
var backend = new HashSet<string> { "C#", "SQL", "Azure", "Docker" };
var frontend = new HashSet<string> { "TypeScript", "Angular", "Docker" };

backend.IntersectWith(frontend);  // { "Docker" } — common skills
backend.UnionWith(frontend);      // All skills combined
backend.ExceptWith(frontend);     // Backend-only skills
backend.SymmetricExceptWith(frontend); // Skills unique to each

// Real-world: deduplication
var uniqueEmails = new HashSet<string>(allEmails, StringComparer.OrdinalIgnoreCase);

// Real-world: fast lookup for validation
var validCountryCodes = new HashSet<string> { "US", "UK", "CA", "AU" };
if (!validCountryCodes.Contains(input.CountryCode))
    throw new ValidationException("Invalid country code");

// Performance comparison (10,000 items):
// List<T>.Contains:    O(n) — scans entire list
// HashSet<T>.Contains: O(1) — single hash computation + bucket check`,
            language: 'csharp',
            bestPractices: [
                'Use HashSet<T> when uniqueness is required or Contains is called frequently',
                'Always specify IEqualityComparer for string-based sets',
                'Use FrozenSet<T> (.NET 8) for build-once-read-many uniqueness checks',
                'Prefer HashSet over List for lookup/validation scenarios'
            ],
            commonMistakes: [
                'Using List<T>.Contains for frequent membership checks (O(n) vs O(1))',
                'Forgetting that HashSet does not preserve insertion order',
                'Not implementing IEquatable<T> on custom types used in HashSet',
                'Using LINQ .Distinct() repeatedly instead of collecting into a HashSet once'
            ],
            interviewTip: 'Quantify the difference: for 10K items, List.Contains averages 5000 comparisons; HashSet.Contains averages 1-2. This makes HashSet essential for validation sets and deduplication.',
            followUp: ['How does HashSet handle collisions?', 'What is the difference between HashSet and SortedSet?', 'Can you iterate a HashSet in insertion order?'],
            seniorPerspective: 'In API validation layers, I pre-build HashSets of valid values at startup (country codes, currency codes, feature flags) for O(1) validation in request processing.',
            architectPerspective: 'At the systems level, bloom filters are probabilistic HashSets used in distributed caches and databases to avoid unnecessary disk/network lookups. Same principle, larger scale.'
        },
        {
            question: 'Explain how ConcurrentDictionary achieves thread safety internally. What are the trade-offs compared to a lock around a regular Dictionary?',
            difficulty: 'hard',
            answer: `<p><code>ConcurrentDictionary&lt;TKey, TValue&gt;</code> uses <strong>fine-grained locking with striped locks</strong> (lock striping). Internally it partitions buckets into segments, each guarded by its own lock. This means multiple threads can read and write <em>concurrently</em> as long as they target different stripes — unlike a global lock that serializes all access.</p>
            <p>Reads are <strong>lock-free</strong> (using volatile reads and Interlocked operations on the bucket chains). Writes only lock the specific stripe that contains the target bucket. The default concurrency level (stripe count) equals the processor count, so on an 8-core machine, up to 8 threads can write simultaneously to different stripes without contention.</p>
            <p>Trade-offs: ConcurrentDictionary uses more memory (stripe metadata, extra nodes). Enumeration is a snapshot-in-time without a consistent view. Composite operations like "check then add" still require atomic APIs (GetOrAdd, AddOrUpdate) — you cannot safely do <code>if (!dict.ContainsKey(k)) dict[k] = v;</code> even with ConcurrentDictionary.</p>`,
            explanation: 'A regular Dictionary with a lock is like a library with one door — everyone queues. ConcurrentDictionary is like a library with many doors to different wings — people in different wings never block each other.',
            code: `// ConcurrentDictionary — atomic composite operations
var cache = new ConcurrentDictionary<string, ExpensiveObject>();

// WRONG — race condition even with ConcurrentDictionary:
if (!cache.ContainsKey(key))       // another thread can insert between
    cache[key] = ComputeExpensive(); // these two lines

// CORRECT — atomic GetOrAdd:
var value = cache.GetOrAdd(key, k => ComputeExpensive(k));

// WARNING: the factory in GetOrAdd is NOT guaranteed to run only once!
// Under contention, multiple threads may invoke the factory, but only
// one result is stored. Use Lazy<T> to ensure single execution:
var lazyCache = new ConcurrentDictionary<string, Lazy<ExpensiveObject>>();
var result = lazyCache.GetOrAdd(key,
    k => new Lazy<ExpensiveObject>(() => ComputeExpensive(k))).Value;

// AddOrUpdate — atomic upsert with update function:
var counts = new ConcurrentDictionary<string, int>();
counts.AddOrUpdate("hits", 1, (key, old) => old + 1);

// Tuning concurrency level for known high-contention scenarios:
var highContention = new ConcurrentDictionary<int, string>(
    concurrencyLevel: Environment.ProcessorCount * 2,
    capacity: 1000);`,
            language: 'csharp',
            bestPractices: [
                'Use GetOrAdd/AddOrUpdate instead of ContainsKey + indexer for atomic operations',
                'Wrap expensive factories in Lazy<T> to prevent duplicate computation under contention',
                'Set concurrencyLevel based on expected writer thread count for optimal striping',
                'Prefer ConcurrentDictionary over lock+Dictionary when reads vastly outnumber writes',
                'Use TryRemove/TryUpdate for conditional mutations'
            ],
            commonMistakes: [
                'Assuming GetOrAdd factory executes exactly once (it may run on multiple threads)',
                'Using ContainsKey followed by indexer assignment (race condition)',
                'Enumerating and expecting a consistent snapshot (enumeration is moment-in-time per bucket)',
                'Defaulting to ConcurrentDictionary when a simple lock suffices (adds complexity and memory overhead for low-contention scenarios)'
            ],
            interviewTip: 'Emphasize lock striping (not lock-free writes) and that reads ARE lock-free. The classic follow-up trap is the GetOrAdd factory race — show you know Lazy<T> solves duplicate computation.',
            followUp: ['Why might GetOrAdd invoke the factory multiple times?', 'How does lock striping differ from a reader-writer lock?', 'When would you prefer ImmutableDictionary over ConcurrentDictionary?']
        },
        {
            question: 'When should you use IEnumerable<T> vs IList<T> vs ICollection<T> as parameter and return types? What are the design implications?',
            difficulty: 'hard',
            answer: `<p>The choice of collection interface communicates <strong>intent and capabilities</strong> to consumers and affects performance, flexibility, and API evolution:</p>
            <ul>
                <li><strong>IEnumerable&lt;T&gt;</strong> — minimal contract: "you can iterate once." Ideal for method parameters when you only need to loop. Supports deferred execution (LINQ chains, yield return). Cannot index, count without enumerating, or modify.</li>
                <li><strong>ICollection&lt;T&gt;</strong> — adds Count, Add, Remove, Contains. Use when you need to know the size or modify the collection. Signals "this is a materialized, finite collection."</li>
                <li><strong>IList&lt;T&gt;</strong> — adds indexer access (random access by position). Use when order and positional access matter. Signals "you can access the nth element efficiently."</li>
            </ul>
            <p><strong>Design rule</strong>: Accept the <em>weakest</em> interface that satisfies your needs (Postel's law). Return the <em>strongest</em> concrete type that doesn't leak implementation details. This maximizes flexibility for callers while providing rich capabilities to consumers.</p>`,
            explanation: 'IEnumerable is a conveyor belt — you can only watch items pass. ICollection is a box — you know how many items and can add/remove. IList is a numbered shelf — you can grab item #5 directly.',
            code: `// PARAMETER TYPES — accept the weakest interface you need:

// Only iterating? Accept IEnumerable<T>:
public decimal CalculateTotal(IEnumerable<OrderLine> lines)
    => lines.Sum(l => l.Price * l.Quantity);
// Callers can pass List, array, LINQ query, generator — maximum flexibility

// Need Count or Contains? Accept ICollection<T>:
public bool HasMinimumItems(ICollection<OrderLine> lines)
    => lines.Count >= 3; // O(1) Count guaranteed

// Need index access? Accept IList<T> or IReadOnlyList<T>:
public OrderLine GetMiddle(IReadOnlyList<OrderLine> lines)
    => lines[lines.Count / 2]; // O(1) random access

// RETURN TYPES — return strong types, prefer read-only:
public IReadOnlyList<User> GetActiveUsers() // rich + immutable contract
    => _users.Where(u => u.IsActive).ToList();

// NOT this — exposes mutation to callers:
public List<User> GetActiveUsers() => _users.ToList(); // caller can Add/Remove

// COMMON TRAP — IEnumerable return with deferred execution:
public IEnumerable<User> GetUsers()
{
    using var conn = new SqlConnection(cs);
    return conn.Query<User>("SELECT ...");
    // BUG: connection disposed before caller enumerates!
    // Fix: materialize with .ToList() before returning
}

// INTERFACE SEGREGATION in practice:
public interface IReadOnlyRepository<T>
{
    IReadOnlyList<T> GetAll();           // strong read contract
    T? GetById(int id);
}
public interface IRepository<T> : IReadOnlyRepository<T>
{
    void Add(T entity);                   // mutation only where needed
    void Remove(T entity);
}`,
            language: 'csharp',
            bestPractices: [
                'Parameters: accept the weakest interface (IEnumerable for iteration, IReadOnlyList for indexed access)',
                'Return types: prefer IReadOnlyList<T> or IReadOnlyCollection<T> to prevent unintended mutation',
                'Materialize (ToList/ToArray) before returning IEnumerable from methods that own disposable resources',
                'Use IReadOnlyList<T> over IList<T> in return types to communicate immutability intent',
                'Consider IAsyncEnumerable<T> for streaming large result sets'
            ],
            commonMistakes: [
                'Returning IEnumerable<T> from a database query with deferred execution (disposed connection)',
                'Accepting IList<T> when you only need to iterate (unnecessarily restricts callers)',
                'Returning List<T> publicly, allowing consumers to mutate your internal collection',
                'Calling .Count() on IEnumerable<T> multiple times (re-enumerates each time unless materialized)'
            ],
            interviewTip: 'State the design rule: "accept weak, return strong." Then show awareness of the deferred execution trap with IEnumerable returns and explain why IReadOnlyList is superior to List for public APIs.',
            followUp: ['What is Postel\'s law and how does it apply to API design?', 'Why is IReadOnlyList<T> preferred over IEnumerable<T> as a return type?', 'How does returning IEnumerable interact with multiple enumeration warnings?']
        },
        {
            question: 'Explain ConcurrentDictionary internals — how does lock striping work, why are reads lock-free, and what is the GetOrAdd factory race condition? How does wrapping with Lazy<T> solve it?',
            difficulty: 'advanced',
            answer: `<p>ConcurrentDictionary partitions its internal hash buckets into segments (stripes), each protected by its own lock. The default stripe count equals Environment.ProcessorCount, so on an 8-core machine, 8 writers can proceed simultaneously as long as they target different stripes. Reads are lock-free because bucket chains use volatile reads and Interlocked operations — a reader never takes a lock, making read-heavy workloads extremely efficient.</p>
            <p>The GetOrAdd race condition: when two threads call GetOrAdd with the same key simultaneously, both may invoke the value factory because the factory runs BEFORE the lock is taken for insertion. Only one result is stored, but the expensive computation runs multiple times, wasting CPU and potentially causing side effects. This is by design for performance — locking during factory execution would serialize all writes to the same stripe.</p>
            <p>The Lazy<T> pattern solves this: store Lazy<T> as the value and use GetOrAdd(key, k => new Lazy<T>(() => Compute(k))). Creating a Lazy<T> is trivial (no computation), so duplicate creation is cheap. The actual expensive computation runs exactly once when .Value is first accessed, because Lazy<T> internally uses its own lock (LazyThreadSafetyMode.ExecutionAndPublication by default).</p>`,
            explanation: 'Lock striping is like a parking garage with separate gates per floor — cars going to different floors never queue behind each other. The Lazy pattern is like putting a "will be built" sign on a parking spot instead of building the structure immediately — only one builder actually constructs it.',
            code: `// The race condition in action:
var cache = new ConcurrentDictionary<string, ExpensiveResult>();
// Thread A and B both call simultaneously for same key:
var result = cache.GetOrAdd("report", key => {
    Console.WriteLine($"Computing on thread {Thread.CurrentThread.ManagedThreadId}");
    return ExpensiveComputation(key); // May run TWICE!
});

// FIX: Lazy<T> ensures single execution
var lazyCache = new ConcurrentDictionary<string, Lazy<ExpensiveResult>>();
var result = lazyCache.GetOrAdd("report",
    key => new Lazy<ExpensiveResult>(
        () => ExpensiveComputation(key),
        LazyThreadSafetyMode.ExecutionAndPublication
    )).Value; // .Value triggers computation exactly once

// Understanding lock striping:
// Default: concurrencyLevel = Environment.ProcessorCount
// Each stripe guards ~(capacity / concurrencyLevel) buckets
var highContention = new ConcurrentDictionary<string, int>(
    concurrencyLevel: 32,  // More stripes = less contention
    capacity: 10000);

// Lock-free reads use volatile semantics:
// Internally: Volatile.Read on bucket head, then traverse chain
// No lock acquisition for TryGetValue, ContainsKey, indexer get`,
            language: 'csharp',
            bestPractices: [
                'Use Lazy<T> pattern for expensive factory functions to guarantee single execution',
                'Tune concurrencyLevel to expected writer thread count for high-contention scenarios',
                'Prefer ConcurrentDictionary for read-heavy workloads (lock-free reads scale linearly)',
                'Use GetOrAdd/AddOrUpdate for atomic composite operations — never ContainsKey + indexer',
                'Consider IMemoryCache with SemaphoreSlim for cache entries that need expiration'
            ],
            commonMistakes: [
                'Assuming GetOrAdd factory runs exactly once (it is intentionally not guaranteed)',
                'Not wrapping expensive factories in Lazy<T> causing duplicate computation under load',
                'Setting concurrencyLevel too high (wastes memory) or too low (increases contention)',
                'Using ConcurrentDictionary as a cache without expiration (memory leak over time)'
            ],
            interviewTip: 'Clearly distinguish: reads are lock-FREE (volatile + interlocked), writes use fine-grained lock STRIPING (not a single lock). The Lazy<T> pattern is the expected answer to the factory race — explain both the problem and why Lazy solves it atomically.',
            followUp: ['How does lock striping compare to ReaderWriterLockSlim?', 'What happens during ConcurrentDictionary resize — do all stripes lock?', 'When would ImmutableDictionary be better than ConcurrentDictionary?']
        },
        {
            question: 'When should you use ImmutableCollections vs FrozenCollections (.NET 8) vs ConcurrentCollections? What is the decision framework?',
            difficulty: 'hard',
            answer: `<p><strong>ConcurrentCollections</strong> (ConcurrentDictionary, ConcurrentQueue) are for read-write-shared scenarios where multiple threads need to mutate the collection simultaneously. They use lock striping or lock-free algorithms and are optimized for concurrent mutation.</p>
            <p><strong>ImmutableCollections</strong> (ImmutableDictionary, ImmutableList) are for scenarios requiring snapshot semantics — each modification produces a NEW collection sharing structure with the old one (persistent data structures). They are thread-safe by nature (no mutation possible) but have O(log n) overhead per operation due to balanced tree internals. Best for: event sourcing, undo/redo, passing state across async boundaries without defensive copying.</p>
            <p><strong>FrozenCollections</strong> (.NET 8: FrozenDictionary, FrozenSet) are for build-once-read-many scenarios. You pay a high upfront cost to construct an optimized, read-only structure that delivers faster lookups than even Dictionary<TKey,TValue>. Internally they can use perfect hashing, length-bucketing, or specialized comparers. Best for: application startup configuration, static lookup tables, DI container registrations.</p>`,
            explanation: 'ConcurrentCollections are a shared whiteboard with multiple markers (everyone writes). ImmutableCollections are a stack of transparencies (each edit creates a new layer, old ones are preserved). FrozenCollections are a printed reference card (expensive to print, but fastest to read).',
            code: `// DECISION FRAMEWORK:
// 1. Multiple writers + readers at runtime? → ConcurrentDictionary
var liveCache = new ConcurrentDictionary<string, Session>();
liveCache.TryAdd(sessionId, session); // concurrent mutation

// 2. Need snapshot/versioned state, undo, or event sourcing? → Immutable
var state = ImmutableDictionary<string, int>.Empty;
var newState = state.Add("counter", 1); // returns NEW dictionary
// state is unchanged — safe to pass to other threads

// 3. Build once at startup, read millions of times? → Frozen (.NET 8)
var routes = new Dictionary<string, Handler> { /* build phase */ };
FrozenDictionary<string, Handler> frozen = routes.ToFrozenDictionary();
// frozen.TryGetValue is FASTER than Dictionary for read-hot paths

// Performance characteristics:
// ConcurrentDictionary: O(1) read (lock-free), O(1) write (striped lock)
// ImmutableDictionary:  O(log n) read, O(log n) "write" (new version)
// FrozenDictionary:     O(1) read (optimized), construction is expensive
// Regular Dictionary:   O(1) read/write, NOT thread-safe

// Real-world: config loaded at startup
var config = LoadAllSettings();
FrozenDictionary<string, string> appSettings = config.ToFrozenDictionary();
// Injected as singleton — all requests read from frozen, zero contention`,
            language: 'csharp',
            bestPractices: [
                'Use Frozen for static lookup tables known at startup (route maps, config, feature flags)',
                'Use Immutable for state that needs versioning or snapshot isolation across threads',
                'Use Concurrent for genuinely concurrent read-write workloads at runtime',
                'Default to regular Dictionary with a lock for simple low-contention cases',
                'Benchmark your specific access pattern — the theoretical best choice may not win empirically'
            ],
            commonMistakes: [
                'Using ImmutableDictionary for a cache that changes frequently (O(log n) per mutation adds up)',
                'Using ConcurrentDictionary for data that never changes after initialization (Frozen is faster)',
                'Assuming Frozen is always faster (construction cost is high — only amortizes with many reads)',
                'Not considering memory: Immutable shares structure (low duplication), Frozen optimizes for speed (may use more memory)'
            ],
            interviewTip: 'Frame the answer as a 2x2: mutation frequency (never/frequent) × thread safety need (single/multi). Frozen = never-mutated + multi-reader, Immutable = snapshot-versioned + any thread, Concurrent = actively-mutated + multi-writer.',
            followUp: ['How does FrozenDictionary achieve faster reads than Dictionary?', 'What is structural sharing in ImmutableCollections?', 'Can you convert between these collection types efficiently?']
        }
    ]
});
