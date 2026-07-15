/* ═══════════════════════════════════════════════════════════════════
   C# — Generics, Constraints, Variance (Covariance/Contravariance)
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('csharp-generics', {
    title: 'C# Generics',
    description: 'Deep dive into generic classes, methods, constraints, covariance, contravariance, and advanced generic patterns for type-safe, reusable code.',
    sections: [
        {
            title: 'Why Generics? Type Safety Without Boxing',
            content: `<p>Generics provide <strong>compile-time type safety</strong> and <strong>eliminate boxing</strong> for value types. Before generics (C# 1.0), collections used <code>object</code> — causing boxing for value types and requiring casts for reference types.</p>
            <ul>
                <li><strong>Type safety</strong> — compiler catches type errors, not runtime</li>
                <li><strong>No boxing</strong> — value types stored directly (no heap allocation)</li>
                <li><strong>Code reuse</strong> — one implementation works for any type</li>
                <li><strong>Performance</strong> — JIT generates specialized code per value type</li>
            </ul>`,
            code: `// Without generics (C# 1.0) — boxing + no type safety
ArrayList old = new ArrayList();
old.Add(42);           // BOXING: int → object (heap allocation)
old.Add("hello");      // No compile error — mixed types allowed!
int value = (int)old[0]; // Must cast — could throw InvalidCastException

// With generics — type safe, no boxing
List<int> modern = new List<int>();
modern.Add(42);        // No boxing — stored as raw int
// modern.Add("hello"); // COMPILE ERROR — type safety!
int value = modern[0]; // No cast needed

// JIT specialization:
// List<int>    → JIT generates code with native int operations
// List<double> → JIT generates separate code for double
// List<string> → JIT shares code (all reference types share one version)

// Generic class
public class Repository<TEntity> where TEntity : class, IEntity
{
    private readonly DbContext _context;
    
    public async Task<TEntity?> GetByIdAsync(int id) =>
        await _context.Set<TEntity>().FindAsync(id);
    
    public async Task AddAsync(TEntity entity) =>
        await _context.Set<TEntity>().AddAsync(entity);
}

// Generic method
public T Max<T>(T a, T b) where T : IComparable<T> =>
    a.CompareTo(b) >= 0 ? a : b;`,
            language: 'csharp'
        },
        {
            title: 'Generic Constraints',
            content: `<p>Constraints restrict the types that can be used as generic arguments, enabling you to call methods on the type parameter. Without constraints, only <code>System.Object</code> members are available.</p>`,
            code: `// Constraint types:
where T : struct          // Must be value type (not nullable)
where T : class           // Must be reference type
where T : class?          // Reference type (nullable)
where T : notnull         // Non-nullable (value or reference)
where T : new()           // Must have parameterless constructor
where T : BaseClass       // Must derive from BaseClass
where T : IInterface      // Must implement interface
where T : U               // Must derive from another type parameter

// Multiple constraints combined:
public class Service<TEntity, TKey>
    where TEntity : class, IEntity<TKey>, new()
    where TKey : struct, IEquatable<TKey>
{
    public TEntity CreateDefault()
    {
        var entity = new TEntity(); // Allowed by 'new()' constraint
        entity.Id = default;        // Allowed by IEntity<TKey>
        return entity;
    }
}

// Constraint enables method calls:
public T Clamp<T>(T value, T min, T max) where T : IComparable<T>
{
    if (value.CompareTo(min) < 0) return min;  // CompareTo available!
    if (value.CompareTo(max) > 0) return max;
    return value;
}

// C# 11: static abstract interface members
public interface IAddable<T> where T : IAddable<T>
{
    static abstract T operator +(T left, T right);
    static abstract T Zero { get; }
}

public T Sum<T>(IEnumerable<T> values) where T : IAddable<T>
{
    T result = T.Zero; // Static abstract member!
    foreach (var v in values) result = result + v;
    return result;
}`,
            language: 'csharp',
            callout: { type: 'info', title: 'Generic Math (.NET 7+)', text: 'C# 11 static abstract interface members enable generic math. INumber<T>, IAdditionOperators<T,T,T>, etc. let you write algorithms that work with int, double, decimal — any numeric type — without boxing or separate overloads.' }
        },
        {
            title: 'Covariance and Contravariance',
            content: `<p><strong>Variance</strong> defines how generic type inheritance relates to argument type inheritance. It applies only to interfaces and delegates with reference type arguments.</p>
            <ul>
                <li><strong>Covariance</strong> (<code>out T</code>) — can use a more derived type. "Produces T". <code>IEnumerable&lt;Cat&gt;</code> → <code>IEnumerable&lt;Animal&gt;</code></li>
                <li><strong>Contravariance</strong> (<code>in T</code>) — can use a less derived type. "Consumes T". <code>Action&lt;Animal&gt;</code> → <code>Action&lt;Cat&gt;</code></li>
                <li><strong>Invariance</strong> — no conversion. <code>List&lt;Cat&gt;</code> is NOT <code>List&lt;Animal&gt;</code></li>
            </ul>`,
            code: `// COVARIANCE (out T) — "produces" T, can return more derived
public interface IReadOnlyRepository<out TEntity> // out = covariant
{
    TEntity GetById(int id);        // T in return position — OK
    IEnumerable<TEntity> GetAll();  // T in return position — OK
    // void Add(TEntity entity);    // ERROR: T in input position not allowed with 'out'
}

// Usage: can assign more derived to less derived
IReadOnlyRepository<Cat> catRepo = new CatRepository();
IReadOnlyRepository<Animal> animalRepo = catRepo; // Covariance! Cat IS Animal

// Built-in covariant interfaces:
IEnumerable<string> strings = new List<string> { "hello" };
IEnumerable<object> objects = strings; // OK — covariant!

// CONTRAVARIANCE (in T) — "consumes" T, can accept less derived
public interface IComparer<in T> // in = contravariant
{
    int Compare(T x, T y); // T in input position — OK
    // T GetDefault();      // ERROR: T in return position not allowed with 'in'
}

// Usage: can assign less derived to more derived
IComparer<Animal> animalComparer = new AnimalByWeightComparer();
IComparer<Cat> catComparer = animalComparer; // Contravariance! 
// Makes sense: if you can compare any Animal, you can compare Cats

// Delegates follow the same rules:
Func<Animal> producer = () => new Cat();   // Covariant return
Action<Cat> consumer = (Animal a) => { };  // Contravariant parameter

// INVARIANCE — List<T> is invariant (both reads and writes)
List<Cat> cats = new List<Cat>();
// List<Animal> animals = cats; // ERROR: List is invariant
// Why? Because you could do: animals.Add(new Dog()); — breaks type safety!`,
            language: 'csharp'
        },
        {
            title: 'Advanced Generic Patterns',
            content: `<p>Generics enable powerful architectural patterns: generic repositories, specification pattern, result types, and the curiously recurring template pattern (CRTP).</p>`,
            code: `// Result<T> Pattern — error handling without exceptions
public readonly struct Result<T>
{
    public T? Value { get; }
    public string? Error { get; }
    public bool IsSuccess { get; }

    private Result(T value) { Value = value; IsSuccess = true; Error = null; }
    private Result(string error) { Value = default; IsSuccess = false; Error = error; }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(string error) => new(error);

    public TOut Match<TOut>(Func<T, TOut> onSuccess, Func<string, TOut> onFailure) =>
        IsSuccess ? onSuccess(Value!) : onFailure(Error!);
}

// Usage:
Result<User> result = await GetUserAsync(id);
var response = result.Match(
    user => Ok(user),
    error => NotFound(error)
);

// CRTP — Curiously Recurring Template Pattern (fluent builders)
public abstract class Builder<TSelf> where TSelf : Builder<TSelf>
{
    protected string Name;
    public TSelf WithName(string name) { Name = name; return (TSelf)this; }
}

public class UserBuilder : Builder<UserBuilder>
{
    private int _age;
    public UserBuilder WithAge(int age) { _age = age; return this; }
}
// Fluent: new UserBuilder().WithName("Alice").WithAge(30) — returns UserBuilder!

// Generic specification pattern
public interface ISpecification<T>
{
    Expression<Func<T, bool>> ToExpression();
    bool IsSatisfiedBy(T entity);
}

public class ActiveUserSpec : ISpecification<User>
{
    public Expression<Func<User, bool>> ToExpression() => 
        u => u.IsActive && u.LastLogin > DateTime.UtcNow.AddDays(-30);
    public bool IsSatisfiedBy(User user) => ToExpression().Compile()(user);
}

// Used in repository:
public async Task<List<T>> FindAsync<T>(ISpecification<T> spec) where T : class =>
    await _context.Set<T>().Where(spec.ToExpression()).ToListAsync();`,
            language: 'csharp'
        }
    ],
    questions: [
        {"question":"What are generic constraints, and why would you use them?","difficulty":"medium","answer":"<p><strong>Generic constraints</strong> (the <code>where</code> clause) restrict the types a generic parameter accepts, which both enforces requirements and unlocks operations on the type. Common ones: <code>where T : class</code> / <code>struct</code>, <code>where T : new()</code> (parameterless ctor), <code>where T : IComparable&lt;T&gt;</code> (interface), <code>where T : BaseClass</code>, and <code>where T : notnull</code>.</p><p>Without a constraint, the compiler only knows T is <code>object</code>. Constraining to an interface, for example, lets you call that interface's members on T with full type safety and no boxing.</p>","code":"public T Max<T>(T a, T b) where T : IComparable<T>\n    => a.CompareTo(b) >= 0 ? a : b; // CompareTo available thanks to the constraint","language":"csharp","explanation":"A constraint is a job requirement: \"must have a driving licence.\" Once you require it, you can safely ask every applicant (T) to drive, instead of hoping they can.","bestPractices":["Constrain to the minimum interface/base the method needs","Use where T : notnull / struct / class to express intent","Use new() constraint when you must instantiate T"],"commonMistakes":["Leaving T unconstrained then casting to object","Over-constraining and reducing reusability","Boxing value types instead of using an interface constraint"],"interviewTip":"Explain constraints unlock operations (you can call the constrained interface on T) while keeping type safety and avoiding boxing.","followUp":["What does the new() constraint enable?","How do constraints avoid boxing?","What is where T : notnull for?"]},
        {"question":"Explain covariance and contravariance in generics with examples.","difficulty":"hard","answer":"<p><strong>Covariance</strong> (<code>out</code>) lets you use a more-derived type where a less-derived is expected: <code>IEnumerable&lt;string&gt;</code> is assignable to <code>IEnumerable&lt;object&gt;</code> because items only come <em>out</em>. <strong>Contravariance</strong> (<code>in</code>) is the reverse for inputs: <code>Action&lt;object&gt;</code> is assignable to <code>Action&lt;string&gt;</code> because the type only goes <em>in</em> (an object-handler can handle a string).</p><p>Variance applies to interfaces and delegates (not classes), and only to reference types. The mental rule: <code>out</code> = output/producer position (covariant), <code>in</code> = input/consumer position (contravariant).</p>","explanation":"Covariance: a basket of apples can be treated as a basket of fruit (you only take fruit out). Contravariance: a machine that processes any fruit can be used as an apple-processor (you only put apples in).","bestPractices":["Remember out=producer (covariant), in=consumer (contravariant)","Rely on it for flexible APIs (IEnumerable<out T>)","Know it applies to interfaces/delegates and reference types only"],"commonMistakes":["Expecting variance on classes or value types","Confusing which direction out vs in allows","Assuming List<string> is a List<object> (it is not — invariant)"],"interviewTip":"Anchor on the out/in mnemonic and give the IEnumerable (covariant) and Action (contravariant) examples — concrete cases beat definitions.","followUp":["Why is List<T> invariant while IEnumerable<T> is covariant?","Why does variance only work on reference types?","Where is contravariance useful in real APIs?"]},
        {
            question: 'What are generic constraints and why are they important?',
            difficulty: 'easy',
            answer: `<p>Generic constraints (<code>where T : ...</code>) restrict which types can be substituted for a type parameter. They enable the compiler to allow operations on T that would otherwise be unavailable (since unconstrained T is treated as <code>object</code>). Constraints provide type safety at compile time and enable richer operations on generic types.</p>`,
            code: `// Without constraint — can only use Object methods
public void Print<T>(T item)
{
    Console.WriteLine(item.ToString()); // Only Object methods available
    // item.CompareTo(other); // ERROR — no constraint!
}

// With constraint — unlocks interface methods
public T Max<T>(T a, T b) where T : IComparable<T>
{
    return a.CompareTo(b) >= 0 ? a : b; // CompareTo available!
}

// Real-world: Generic repository with multiple constraints
public class Repository<TEntity, TKey>
    where TEntity : class, IEntity<TKey>, new()  // reference type, has Id, constructible
    where TKey : struct, IEquatable<TKey>         // value type, comparable
{
    public TEntity Create()
    {
        return new TEntity(); // 'new()' constraint enables this
    }

    public bool Exists(TKey id)
    {
        return _entities.Any(e => e.Id.Equals(id)); // IEquatable enables this
    }
}

// Constraint summary:
// struct     → enables Nullable<T>, ensures no null
// class      → enables null checks, reference semantics
// new()      → enables new T(), must be last constraint
// interface  → enables calling interface methods
// base class → enables casting and method access`,
            language: 'csharp',
            bestPractices: [
                'Use the minimum constraints needed (don\'t over-constrain)',
                'Prefer interface constraints over class constraints for flexibility',
                'Use new() constraint only when you truly need to instantiate T',
                'Combine constraints to express exactly what operations you need'
            ],
            commonMistakes: [
                'Over-constraining: adding constraints you don\'t actually use',
                'Forgetting new() must be the last constraint in the list',
                'Not realizing struct constraint implies non-nullable',
                'Using class constraint when notnull would be more appropriate'
            ],
            interviewTip: 'Show a before/after: without constraint you get compile errors trying to call methods; adding the right constraint unlocks the API. Explain the trade-off: more constraints = more power but less flexibility for callers.',
            followUp: ['Can you constrain to multiple interfaces?', 'What does the unmanaged constraint do?', 'How do static abstract interface members change generics?'],
            seniorPerspective: 'I design generic APIs constraint-first: what operations does this method NEED on T? That determines the constraint. Over-constraining makes the API hard to use; under-constraining requires runtime casting.',
            architectPerspective: 'Constraints are the generic equivalent of interface contracts. In Clean Architecture, repository interfaces use constraints to ensure entities have proper identity and auditing capabilities without coupling to a specific base class.'
        },
        {
            question: 'Explain covariance and contravariance in C#. Give practical examples.',
            difficulty: 'advanced',
            answer: `<p><strong>Covariance</strong> (<code>out T</code>) allows using a more-derived type where a less-derived is expected (output position). <strong>Contravariance</strong> (<code>in T</code>) allows using a less-derived type where a more-derived is expected (input position). These apply only to interfaces and delegates with reference type arguments.</p>`,
            code: `// COVARIANCE — "I produce T, so a Cat-producer IS an Animal-producer"
IEnumerable<string> strings = new List<string> { "hello", "world" };
IEnumerable<object> objects = strings; // VALID — covariance!
// Safe because IEnumerable only READS (produces) items

// Real example: Repository returning derived types
IReadOnlyList<Cat> cats = GetCats();
IReadOnlyList<Animal> animals = cats; // Covariant — safe, read-only
PrintAnimals(animals); // Works!

// CONTRAVARIANCE — "I consume T, so an Animal-consumer IS a Cat-consumer"
Action<Animal> feedAnimal = animal => Console.WriteLine($"Feeding {animal.Name}");
Action<Cat> feedCat = feedAnimal; // VALID — contravariance!
feedCat(new Cat("Whiskers")); // A Cat IS an Animal, so feedAnimal handles it

// Real example: Comparer
IComparer<Animal> byWeight = Comparer<Animal>.Create((a, b) => a.Weight - b.Weight);
IComparer<Cat> catComparer = byWeight; // Contravariant — can compare Cats
cats.Sort(catComparer); // Works!

// WHY List<T> is INVARIANT (neither covariant nor contravariant):
List<Cat> cats = new List<Cat>();
// List<Animal> animals = cats; // ERROR! And here's why:
// If this worked: animals.Add(new Dog()); // Dog into a Cat list! Type safety broken!

// Summary:
// out T (covariant):  IEnumerable<out T>, IReadOnlyList<out T>, Func<out T>
// in T (contravariant): IComparer<in T>, Action<in T>, IEqualityComparer<in T>
// invariant:           List<T>, Dictionary<K,V> (both read and write)`,
            language: 'csharp',
            bestPractices: [
                'Use out T when your interface only produces/returns T',
                'Use in T when your interface only consumes/accepts T',
                'Return IReadOnlyList<T> (covariant) instead of List<T> (invariant) from APIs',
                'Think "produces = out = covariant, consumes = in = contravariant"'
            ],
            commonMistakes: [
                'Trying to make an interface both covariant and contravariant on the same T',
                'Assuming List<Derived> is assignable to List<Base> (it is not)',
                'Forgetting variance only works with reference types (not int, struct)',
                'Confusing which direction the assignment goes (derived→base vs base→derived)'
            ],
            interviewTip: 'Use the Animal/Cat analogy. Covariant: "a bag of cats IS a bag of animals" (safe to read). Contravariant: "a vet who treats any animal CAN treat cats" (safe to pass in). The key insight: it\'s about safety of operations.',
            followUp: ['Why doesn\'t variance work with value types?', 'Can you have variance on a class (not interface)?', 'How does variance relate to Liskov Substitution?'],
            seniorPerspective: 'I design interfaces with variance in mind from day one. Splitting IRepository<T> into IReadRepository<out T> and IWriteRepository<in T> enables better composition and CQRS patterns.',
            architectPerspective: 'Variance is the generic type system\'s answer to Liskov Substitution. In large codebases, proper variance annotations prevent breaking changes when interfaces evolve — new derived types slot in without modification.'
        },
        {
            question: 'How does the JIT handle generics for value types vs reference types?',
            difficulty: 'expert',
            answer: `<p>The JIT generates <strong>separate native code for each value type</strong> argument (specialization) and <strong>shares one version for all reference types</strong>. This is because value types differ in size and layout, while all reference types are pointer-sized.</p>`,
            code: `// Value types — JIT creates specialized code per type:
List<int> intList;      // JIT generates code using 4-byte int operations
List<double> dblList;   // JIT generates SEPARATE code using 8-byte double ops
List<Guid> guidList;    // JIT generates SEPARATE code using 16-byte Guid ops

// Each specialization:
// - Uses correct size for stack allocation
// - Uses correct CPU instructions (integer vs floating point)
// - Eliminates boxing entirely
// - Can inline small struct methods

// Reference types — JIT shares ONE code version:
List<string> strings;   // Shares code with...
List<User> users;       // ...same native code (both are pointer-sized)
List<object> objects;   // ...same native code

// Shared reference type code uses pointer operations:
// - All refs are IntPtr-sized (4 or 8 bytes)
// - GC tracking is identical regardless of concrete type
// - Type checks are done via method table pointer

// Performance implications:
// 1. First use of a value-type generic triggers JIT compilation
// 2. More value type specializations = more JIT time + more code in memory
// 3. Reference types incur no extra JIT cost after first generic use

// Compared to Java (type erasure):
// Java: List<Integer> uses boxing (Integer wrapper class)
// C#:   List<int> stores raw ints — no boxing, native performance
// Java: generic type info erased at runtime
// C#:   full generic type info available via reflection

// You can verify at runtime:
Console.WriteLine(typeof(List<int>));    // System.Collections.Generic.List\`1[System.Int32]
Console.WriteLine(typeof(List<string>)); // System.Collections.Generic.List\`1[System.String]
// Full type identity preserved — unlike Java!`,
            language: 'csharp',
            bestPractices: [
                'Prefer value types as generic args in hot paths (JIT specialization eliminates boxing)',
                'Be aware that many value type specializations increase working set size',
                'Use generic math interfaces (INumber<T>) for numeric algorithms without boxing',
                'Leverage JIT specialization for high-performance data structures'
            ],
            commonMistakes: [
                'Assuming C# generics are like Java generics (type erasure — they are not)',
                'Not realizing each value type creates separate JIT compilation',
                'Expecting runtime performance to be identical for value and reference type args',
                'Using object instead of generics and losing JIT specialization benefits'
            ],
            interviewTip: 'Compare C# reification vs Java erasure. In C#, typeof(List<int>) != typeof(List<string>) at runtime — full type identity. In Java, erasure means ArrayList<Integer> == ArrayList<String> at runtime. This is why C# generics are faster and more powerful.',
            followUp: ['How do generics differ between C# and Java?', 'What is the memory impact of many value type specializations?', 'How does generic virtualization in .NET 8 work?'],
            seniorPerspective: 'Understanding JIT specialization explains why Span<byte>-based parsers are so fast — the JIT generates perfect code for the specific value type, with no indirection or boxing overhead.',
            architectPerspective: 'In high-frequency systems, this knowledge drives design: using struct-based generic state machines (IValueTaskSource<T>) instead of class-based ones eliminates per-operation heap allocations entirely.'
        },
        {
            question: 'How do you use generics to implement the Repository and Specification patterns?',
            difficulty: 'medium',
            answer: `<p>Generics allow creating a single repository implementation that works with any entity type, and specifications that encapsulate query logic as reusable, composable objects — both without duplicating code per entity.</p>`,
            code: `// Generic Repository Interface
public interface IRepository<TEntity, TKey>
    where TEntity : class, IEntity<TKey>
    where TKey : struct
{
    Task<TEntity?> GetByIdAsync(TKey id, CancellationToken ct = default);
    Task<IReadOnlyList<TEntity>> GetAllAsync(CancellationToken ct = default);
    Task<IReadOnlyList<TEntity>> FindAsync(ISpecification<TEntity> spec, CancellationToken ct = default);
    Task AddAsync(TEntity entity, CancellationToken ct = default);
    Task UpdateAsync(TEntity entity, CancellationToken ct = default);
    Task DeleteAsync(TKey id, CancellationToken ct = default);
}

// Generic Specification
public abstract class Specification<T> where T : class
{
    public abstract Expression<Func<T, bool>> ToExpression();
    
    public Specification<T> And(Specification<T> other) =>
        new AndSpecification<T>(this, other);
    
    public Specification<T> Or(Specification<T> other) =>
        new OrSpecification<T>(this, other);
    
    public Specification<T> Not() => new NotSpecification<T>(this);
}

// Concrete specification
public class ActiveUsersInDepartment : Specification<User>
{
    private readonly string _department;
    public ActiveUsersInDepartment(string dept) => _department = dept;
    
    public override Expression<Func<User, bool>> ToExpression() =>
        u => u.IsActive && u.Department == _department;
}

// Usage — composable, testable, reusable
var spec = new ActiveUsersInDepartment("Engineering")
    .And(new CreatedAfter(DateTime.UtcNow.AddMonths(-6)));

var users = await _userRepo.FindAsync(spec);

// DI Registration — one line registers all repositories
services.AddScoped(typeof(IRepository<,>), typeof(EfRepository<,>));`,
            language: 'csharp',
            bestPractices: [
                'Use open generic registration in DI: typeof(IRepository<,>)',
                'Constrain TEntity to ensure it has required properties (Id, etc.)',
                'Make specifications composable (And, Or, Not)',
                'Return IReadOnlyList from repository reads to prevent mutation'
            ],
            commonMistakes: [
                'Making the generic repository too generic (leaking IQueryable)',
                'Not providing escape hatches for complex queries that don\'t fit the pattern',
                'Over-abstracting: one-off queries don\'t need the specification pattern',
                'Forgetting that generic constraints propagate (callers must satisfy them too)'
            ],
            interviewTip: 'Show the DI open generic registration — services.AddScoped(typeof(IRepo<,>), typeof(EfRepo<,>)) — this is how one registration serves ALL entity types. It demonstrates real-world generic power.',
            followUp: ['What are the downsides of the generic repository pattern?', 'How do open generics work in DI?', 'When should you NOT use a generic repository?'],
            seniorPerspective: 'I use a thin generic repository for standard CRUD and dedicated query services for complex operations. The specification pattern shines when the same filter logic is used in multiple places (APIs, background jobs, reports).',
            architectPerspective: 'In Domain-Driven Design, the generic repository provides infrastructure plumbing, while domain-specific repositories add aggregate-specific methods. Specifications become a shared language between domain experts and developers.'
        },
        {
            question: 'How does generic type inference work for methods, and when must you specify type arguments explicitly?',
            difficulty: 'medium',
            answer: `<p>The compiler infers generic type arguments for <strong>methods</strong> from the <strong>argument types</strong> at the call site. Inference fails — requiring explicit type arguments — when a type parameter appears <strong>only in the return type</strong>, only in a constraint, or when arguments are ambiguous (e.g., <code>null</code> or mismatched lambdas). Note that type inference applies to generic methods, not generic class type parameters.</p>`,
            explanation: `Inference is like a tailor guessing your size from the clothes you hand over. If you only describe what you want back (the return type) without handing anything in, the tailor cannot guess and you must state your size.`,
            code: `public static T First<T>(IEnumerable<T> source) => source.First();
public static TOut Map<TIn, TOut>(TIn input, Func<TIn, TOut> f) => f(input);
public static T Create<T>() where T : new() => new T();

// INFERRED from arguments -> no explicit type args needed
var n = First(new[] { 1, 2, 3 });          // T = int
var s = Map(5, x => x.ToString());          // TIn = int, TOut = string

// MUST be explicit: T appears only in the return type
var list = Create<User>();                  // cannot infer from nothing
// var bad = Create();                       // ERROR: cannot infer T

// MUST be explicit: null gives the compiler nothing to infer
// var x = First(null);                      // ERROR
var x = First<string>(null!);               // OK with explicit T

// Inference flows through lambdas (return type drives TOut):
var lengths = items.Select(i => i.Name.Length); // Select<TSource,int> inferred

// Class type parameters are NEVER inferred from constructor args:
// var r = new Repository(ctx);              // ERROR (if Repository<T>)
var r = new Repository<User>(ctx);          // must specify T explicitly`,
            language: 'csharp',
            bestPractices: [
                'Design generic methods so type parameters appear in the parameter list for inference',
                'Use a static factory method to enable inference where a constructor cannot',
                'Provide explicit type arguments when passing null or ambiguous literals',
                'Order type parameters so the inferable ones support the non-inferable ones'
            ],
            commonMistakes: [
                'Expecting class type parameters to be inferred from constructor arguments',
                'Putting a type parameter only in the return type and being surprised inference fails',
                'Passing null without an explicit type argument',
                'Assuming inference reads target assignment type (it generally does not for method args)'
            ],
            interviewTip: 'The crisp rule: method type inference works from arguments, not from the return type or the assignment target. Constructors never infer class type parameters — that is why factory methods like Tuple.Create exist.',
            followUp: ['Why does Tuple.Create exist when you can call the constructor?', 'How do target-typed new and inference differ?', 'How does inference interact with overload resolution?'],
            seniorPerspective: `I add static factory methods (Result.Ok, Option.Some) specifically so callers benefit from inference instead of repeating verbose type arguments. It is a small ergonomics win that compounds across a codebase.`,
            architectPerspective: `Inference quality shapes how pleasant a generic API feels. Library designers intentionally place type parameters in argument positions and add factory helpers so consumers rarely write angle brackets, which keeps call sites readable.`
        },
        {
            question: 'What are static abstract interface members, and how do they enable generic math in .NET 7+?',
            difficulty: 'advanced',
            answer: `<p><strong>Static abstract (and static virtual) interface members</strong> (C# 11 / .NET 7) let an interface declare <strong>static methods, operators, and properties</strong> that implementers must provide. This is the foundation of <strong>generic math</strong>: interfaces like <code>INumber&lt;T&gt;</code> and <code>IAdditionOperators&lt;T,T,T&gt;</code> let you write numeric algorithms generic over any numeric type — no overloads, no boxing.</p>`,
            explanation: `Before this, an interface could only require instance behavior ("each object can do X"). Now it can require type-level behavior ("the type itself provides a Zero and a + operator"), so an algorithm can ask any number type for its zero and add two of them.`,
            code: `// Constraint to the abstraction instead of a concrete numeric type
using System.Numerics;

public static T Sum<T>(IEnumerable<T> values) where T : INumber<T>
{
    T total = T.Zero;                 // static abstract member on the interface
    foreach (var v in values)
        total += v;                   // static abstract operator +
    return total;
}

int    i = Sum(new[] { 1, 2, 3 });        // works for int
double d = Sum(new[] { 1.5, 2.5 });       // and double
decimal m = Sum(new[] { 1.1m, 2.2m });    // and decimal -> no overloads needed

// Defining your own static abstract contract:
public interface IParsable2<TSelf> where TSelf : IParsable2<TSelf>
{
    static abstract TSelf Parse(string s);   // type-level factory
    static abstract TSelf Zero { get; }
}

public readonly struct Meters : IParsable2<Meters>
{
    public double Value { get; }
    public Meters(double v) => Value = v;
    public static Meters Parse(string s) => new(double.Parse(s));
    public static Meters Zero => new(0);
}

// Generic algorithm over the contract:
public static TSelf Average<TSelf>(IReadOnlyList<TSelf> xs)
    where TSelf : INumber<TSelf>
    => xs.Aggregate(TSelf.Zero, (a, b) => a + b) / TSelf.CreateChecked(xs.Count);`,
            language: 'csharp',
            bestPractices: [
                'Constrain to INumber<T> (or a narrower interface) for type-agnostic numeric code',
                'Use the curiously recurring pattern where T : IFoo<T> for static self-returning members',
                'Use CreateChecked/CreateTruncating for safe numeric conversions across T',
                'Prefer the narrowest math interface (IAdditionOperators) that your algorithm needs'
            ],
            commonMistakes: [
                'Calling static abstract members on an instance (they are accessed via the type parameter)',
                'Forgetting the self-referential constraint where T : IInterface<T>',
                'Assuming static abstract members are virtual-dispatched at runtime (resolved via generics)',
                'Over-constraining to INumber<T> when only addition is required'
            ],
            interviewTip: 'Emphasize that this finally lets you write one numeric algorithm for int, double, decimal, and custom value types without overloads or object boxing. Mention it is resolved through the generic type parameter, not virtual dispatch.',
            followUp: ['How does this differ from operator overloading without generics?', 'What is the difference between static abstract and static virtual?', 'Why does INumber<T> use the self-referential constraint?'],
            seniorPerspective: `Generic math removed a pile of duplicated numeric overloads in our math/stats utilities. One generic implementation now covers every numeric type and is JIT-specialized per type, so there is no boxing penalty.`,
            architectPerspective: `Static abstract members extend the type system to express type-level contracts (factories, identity elements, operators). This unlocks truly reusable numeric and parsing libraries, and it is how the BCL exposes a single generic surface over all primitive number types.`
        },
        {
            question: 'Explain covariance and contravariance in C# generics with real-world examples. Why can\'t classes be variant?',
            difficulty: 'hard',
            answer: `<p><strong>Covariance</strong> (<code>out T</code>) allows a generic type to be used as a more derived type — it preserves the assignment compatibility direction. <strong>Contravariance</strong> (<code>in T</code>) reverses it — a more base type can be used where a derived type is expected.</p>
            <p>Covariance applies when T is only used in <strong>output</strong> positions (return values). Example: <code>IEnumerable&lt;out T&gt;</code> — an <code>IEnumerable&lt;Dog&gt;</code> can be assigned to <code>IEnumerable&lt;Animal&gt;</code> because you only read items out.</p>
            <p>Contravariance applies when T is only used in <strong>input</strong> positions (parameters). Example: <code>Action&lt;in T&gt;</code> — an <code>Action&lt;Animal&gt;</code> can be assigned to <code>Action&lt;Dog&gt;</code> because a method that accepts any Animal can certainly handle a Dog.</p>
            <p>Classes cannot be variant because they typically have fields (both read AND write), making the type parameter appear in both input and output positions. Only interfaces and delegates (which can restrict usage to one direction) support variance annotations.</p>`,
            explanation: 'Covariance is like a "dog photographer" can work as an "animal photographer" (output: they produce animal photos). Contravariance is like an "animal trainer" can work as a "dog trainer" (input: they accept dogs because they handle any animal).',
            code: `// COVARIANCE (out) — IEnumerable<out T>
IEnumerable<Dog> dogs = new List<Dog> { new Dog("Rex") };
IEnumerable<Animal> animals = dogs; // OK! Covariant — Dog IS-A Animal
// Safe because you can only READ from IEnumerable (output position)
Animal first = animals.First(); // Returns a Dog, which IS an Animal ✓

// CONTRAVARIANCE (in) — Action<in T>, IComparer<in T>
Action<Animal> feedAnimal = a => Console.WriteLine($"Feeding {a.Name}");
Action<Dog> feedDog = feedAnimal; // OK! Contravariant — accepts Dog as Animal
// Safe because the delegate only CONSUMES T (input position)
feedDog(new Dog("Rex")); // Passes Dog to a method expecting Animal ✓

// REAL-WORLD: IComparer<in T> is contravariant
IComparer<Animal> animalComparer = Comparer<Animal>.Create(
    (a, b) => a.Weight.CompareTo(b.Weight));
IComparer<Dog> dogComparer = animalComparer; // Contravariant!
// A comparer that can compare any Animal can certainly compare Dogs

// CUSTOM VARIANT INTERFACE:
public interface IProducer<out T>  // covariant — T only in output
{
    T Produce();
    // void Consume(T item); // COMPILE ERROR! T in input position
}
public interface IConsumer<in T>   // contravariant — T only in input
{
    void Consume(T item);
    // T Produce(); // COMPILE ERROR! T in output position
}

// WHY CLASSES CANNOT BE VARIANT:
public class Box<T>  // Cannot add 'out' or 'in' here
{
    private T _value;     // T in output (getter) AND input (setter)
    public T Value
    {
        get => _value;    // output position
        set => _value = value; // input position — violates both out and in
    }
}
// If Box<Dog> were covariant (assignable to Box<Animal>):
// Box<Animal> box = new Box<Dog>();
// box.Value = new Cat(); // CRASH! Stored a Cat in a Dog box!`,
            language: 'csharp',
            bestPractices: [
                'Use out T when the interface only produces/returns T (IEnumerable, IReadOnlyList, Func<T>)',
                'Use in T when the interface only consumes T (IComparer, Action<T>, IEqualityComparer)',
                'Design interfaces to be variant-friendly by separating read and write concerns',
                'Leverage variance in DI: register IProducer<Dog>, resolve as IProducer<Animal>',
                'Document variance behavior for consumers of your generic interfaces'
            ],
            commonMistakes: [
                'Trying to make a class covariant or contravariant (only interfaces and delegates)',
                'Using T in both input and output positions then wondering why out/in won\'t compile',
                'Confusing the direction: covariance preserves direction (Dog→Animal), contravariance reverses it',
                'Forgetting that IList<T> is INVARIANT (read + write) while IReadOnlyList<T> is covariant'
            ],
            interviewTip: 'Use the mnemonic: "out = output = covariant (preserves direction), in = input = contravariant (reverses direction)." Then explain WHY with the type safety argument — show the Cat-in-Dog-box violation.',
            followUp: ['Why is IList<T> invariant but IReadOnlyList<T> covariant?', 'Can you have both in and out on the same interface with different type parameters?', 'How does array covariance in C# violate type safety?']
        },
        {
            question: 'When and why would you use different generic constraints (where T : class, struct, new(), interface, base class)? Give a scenario for each.',
            difficulty: 'hard',
            answer: `<p>Generic constraints restrict what types can be used as type arguments, enabling the compiler to guarantee certain operations are safe. Each constraint unlocks specific capabilities and communicates intent:</p>
            <ul>
                <li><code>where T : struct</code> — T is a value type. Enables Nullable&lt;T&gt; usage, guarantees no null, enables stack allocation patterns. Use for: high-performance collections, math operations.</li>
                <li><code>where T : class</code> — T is a reference type. Enables null comparisons, weak references, reference equality. Use for: caching, nullable patterns, entity tracking.</li>
                <li><code>where T : new()</code> — T has a parameterless constructor. Enables <code>new T()</code>. Use for: factories, object pooling, deserialization.</li>
                <li><code>where T : IDisposable</code> (interface) — ensures T implements the contract. Use for: resource management wrappers, generic cleanup patterns.</li>
                <li><code>where T : BaseClass</code> — ensures inheritance. Use for: type-safe builders, plugin systems with a known base.</li>
                <li><code>where T : notnull</code> — T cannot be null (either value type or non-nullable reference type). Use for: dictionary keys, identifiers.</li>
                <li><code>where T : unmanaged</code> — T is an unmanaged type (no reference fields). Use for: interop, Span&lt;T&gt;, pointer operations.</li>
            </ul>`,
            explanation: 'Constraints are like job requirements on a hiring post. "where T : struct" means "must be a local worker (stack-allocated)." "where T : new()" means "must be able to start from scratch." Each requirement enables specific things you can safely do with the hire.',
            code: `// struct constraint — enables Nullable<T> and guarantees stack allocation
public struct Optional<T> where T : struct
{
    private readonly T? _value;
    public bool HasValue => _value.HasValue;
    public T Value => _value ?? throw new InvalidOperationException();
    public Optional(T value) => _value = value;
}

// class constraint — enables null checks and reference semantics
public class WeakCache<TKey, TValue> where TKey : notnull where TValue : class
{
    private readonly Dictionary<TKey, WeakReference<TValue>> _cache = new();
    public TValue? TryGet(TKey key) =>
        _cache.TryGetValue(key, out var wr) && wr.TryGetTarget(out var val) ? val : null;
}

// new() constraint — enables factory/activation patterns
public class ObjectPool<T> where T : class, new()
{
    private readonly ConcurrentBag<T> _pool = new();
    public T Rent() => _pool.TryTake(out var item) ? item : new T();
    public void Return(T item) => _pool.Add(item);
}

// Interface constraint — enables calling interface methods
public async Task SafeDisposeAsync<T>(T resource) where T : IAsyncDisposable
{
    await resource.DisposeAsync(); // compiler knows T has DisposeAsync
}

// Multiple constraints combined — real-world repository pattern:
public interface IRepository<TEntity, TId>
    where TEntity : class, IEntity<TId>  // reference type + implements interface
    where TId : struct, IEquatable<TId>  // value type + comparable
{
    Task<TEntity?> FindAsync(TId id);
    Task<TId> CreateAsync(TEntity entity);
}

// unmanaged constraint — enables pointer/interop work
public unsafe void WriteToBuffer<T>(Span<byte> buffer, T value) where T : unmanaged
{
    MemoryMarshal.Write(buffer, ref value); // safe — T has no managed refs
}`,
            language: 'csharp',
            bestPractices: [
                'Apply the minimal constraints necessary — over-constraining limits reuse',
                'Use notnull for dictionary keys and identifiers to prevent null key bugs',
                'Combine struct + IEquatable<T> for high-performance value type collections',
                'Use unmanaged constraint for interop and binary serialization scenarios',
                'Document WHY a constraint exists, not just what it is'
            ],
            commonMistakes: [
                'Using new() constraint when a factory delegate (Func<T>) would be more flexible',
                'Over-constraining with both class and new() when only new() is needed (class is implied)',
                'Forgetting that new() only allows parameterless constructors (use factories for parameterized)',
                'Not realizing struct constraint implies notnull and non-nullable'
            ],
            interviewTip: 'For each constraint, give a one-sentence scenario: "struct for math utilities, class for caching with WeakReference, new() for object pooling, unmanaged for binary interop." This shows you use constraints deliberately, not decoratively.',
            followUp: ['What is the difference between notnull and class constraints in nullable context?', 'Can you use a generic constraint to require a specific constructor signature?', 'How do constraints affect JIT code generation for value types?']
        },
        {
            question: 'Explain covariance and contravariance with real-world examples. Why can interfaces be variant but classes cannot? What is the array covariance hole in C#?',
            difficulty: 'hard',
            answer: `<p><strong>Covariance</strong> (out T) allows a generic type to be used as a less-derived type: IEnumerable<Dog> can be assigned to IEnumerable<Animal> because it only PRODUCES T values. <strong>Contravariance</strong> (in T) allows assignment to a more-derived type: Action<Animal> can be assigned to Action<Dog> because it only CONSUMES T values. The direction of assignability is preserved (covariant) or reversed (contravariant).</p>
            <p>Classes cannot be variant because they typically have fields that are both read (output) and written (input). If Box<Dog> were covariant to Box<Animal>, you could assign it to Box<Animal> and then store a Cat via the setter — violating type safety. Interfaces can separate read-only (out) and write-only (in) contracts, making variance provably safe.</p>
            <p>The array covariance hole: C# arrays are covariant by design (string[] is assignable to object[]) for Java compatibility, but this is NOT type-safe. You can assign a Cat to an Animal[] that is actually a Dog[] at runtime, causing an ArrayTypeMismatchException. This was a deliberate design mistake preserved for backward compatibility — generic collections (List<T>) are correctly invariant.</p>`,
            explanation: 'Covariance is like a contract that says "I will only give you animals" — if I give you dogs specifically, that is fine (dogs ARE animals). Contravariance is "I accept any animal" — you can send me just dogs. Array covariance is a lie: the array claims to accept any animal but crashes when you give it the wrong specific type.',
            code: `// COVARIANCE (out T) — IEnumerable<out T>, IReadOnlyList<out T>
IEnumerable<Dog> dogs = new List<Dog> { new Dog("Rex") };
IEnumerable<Animal> animals = dogs; // Legal! Covariant.
// Safe because IEnumerable only PRODUCES items (no Add method)

// CONTRAVARIANCE (in T) — Action<in T>, IComparer<in T>
Action<Animal> feedAnimal = a => Console.WriteLine($"Feeding {a.Name}");
Action<Dog> feedDog = feedAnimal; // Legal! Contravariant.
feedDog(new Dog("Rex")); // Passes Dog to Action<Animal> — safe!

// WHY CLASSES CANNOT BE VARIANT:
// class Box<T> { public T Value { get; set; } }
// If covariant: Box<Animal> box = new Box<Dog>();
// box.Value = new Cat(); // Would put Cat in Dog box — type violation!

// THE ARRAY COVARIANCE HOLE:
Dog[] dogs = new Dog[] { new Dog("Rex"), new Dog("Buddy") };
Animal[] animals = dogs;  // LEGAL but dangerous (array covariance)
animals[0] = new Cat();   // COMPILES but throws ArrayTypeMismatchException!

// SAFE alternative: use generic collections (invariant)
List<Dog> dogList = new List<Dog>();
// List<Animal> animalList = dogList; // COMPILE ERROR — correctly invariant

// Real-world DI example with variance:
services.AddSingleton<IProducer<Dog>, DogFactory>();
// Can resolve as IProducer<Animal> if IProducer<out T>`,
            language: 'csharp',
            bestPractices: [
                'Use out T when interfaces only return/produce T (factory interfaces, read-only collections)',
                'Use in T when interfaces only accept/consume T (comparers, validators, handlers)',
                'Prefer IReadOnlyList<T> (covariant) over IList<T> (invariant) in return types for variance flexibility',
                'Avoid array covariance in new code — use generic collections which are correctly invariant',
                'Design interfaces with variance in mind by separating read and write contracts'
            ],
            commonMistakes: [
                'Trying to make a class covariant or contravariant (only interfaces and delegates support variance)',
                'Relying on array covariance which throws at runtime instead of catching at compile time',
                'Confusing covariant direction (out = produces = preserves direction) with contravariant (in = consumes = reverses)',
                'Using IList<T> when IReadOnlyList<T> would enable covariant assignment'
            ],
            interviewTip: 'Use the Cat-in-Dog-box argument to explain WHY classes cannot be variant. Then show the array covariance hole as a historical mistake. The mnemonic "out = output = covariant, in = input = contravariant" with a concrete DI or collection example is the clearest way to demonstrate understanding.',
            followUp: ['Why is IList<T> invariant but IReadOnlyList<T> covariant?', 'How does Func<in T, out TResult> use both variance directions?', 'Can you have variance on value-type type arguments?']
        },
        {
            question: 'What are the generic constraints in C# (struct, class, new(), unmanaged, notnull) and how do they affect JIT specialization? When would you use each in production code?',
            difficulty: 'hard',
            answer: `<p>Generic constraints restrict type arguments and enable the compiler/JIT to make guarantees: <code>struct</code> ensures T is a value type (enables Nullable<T>, guarantees no null, stack allocation); <code>class</code> ensures T is a reference type (enables null checks, weak references); <code>new()</code> requires a parameterless constructor (enables new T()); <code>unmanaged</code> ensures T has no reference-type fields (enables pointer operations, Span reinterpretation, binary serialization); <code>notnull</code> forbids null for both value and reference types (NRT-aware).</p>
            <p>JIT specialization: for each distinct value-type argument, the JIT generates a separate native code version with the actual type baked in — List<int> and List<double> have different machine code, enabling inlining, SIMD, and elimination of boxing. All reference-type arguments share ONE code version (using object pointers). The struct constraint guarantees the JIT will specialize, enabling optimizations like devirtualization of interface calls on the constrained type and eliminating null checks.</p>
            <p>Production scenarios: struct for high-performance math (Vector<T>), class for entity caching (WeakReference<T>), new() for factory/pool patterns, unmanaged for memory-mapped I/O and interop (MemoryMarshal.Cast), notnull for dictionary keys where null would cause subtle bugs.</p>`,
            explanation: 'Constraints are like job posting requirements — "must lift 50 lbs" (struct: stack-friendly), "must have a phone" (class: can be null-checked), "must start Monday" (new(): can be instantiated). Each requirement unlocks operations you can safely perform on the hire.',
            code: `// struct constraint — enables Nullable<T> and JIT specialization
public T Add<T>(T a, T b) where T : struct, INumber<T>
    => a + b; // JIT generates native int/double/float versions separately

// class constraint — enables null checks and WeakReference
public class Cache<T> where T : class {
    private WeakReference<T>? _ref;
    public void Set(T value) => _ref = new WeakReference<T>(value);
    public T? TryGet() { _ref?.TryGetTarget(out var val); return val; }
}

// new() constraint — factory/pool pattern
public class Pool<T> where T : class, new() {
    private readonly ConcurrentBag<T> _bag = new();
    public T Rent() => _bag.TryTake(out var item) ? item : new T();
    public void Return(T item) => _bag.Add(item);
}

// unmanaged constraint — binary interop, pointer operations
public static Span<TTo> ReinterpretCast<TFrom, TTo>(Span<TFrom> source)
    where TFrom : unmanaged
    where TTo : unmanaged
    => MemoryMarshal.Cast<TFrom, TTo>(source);

// notnull constraint — safe dictionary keys
public class Registry<TKey, TValue> where TKey : notnull {
    private readonly Dictionary<TKey, TValue> _map = new();
    // Compiler guarantees TKey cannot be null — no NullReferenceException
}

// JIT SPECIALIZATION in action:
// GenericClass<int>.Method()    → unique native code (int-specialized)
// GenericClass<double>.Method() → unique native code (double-specialized)
// GenericClass<string>.Method() → shared code (all ref types share)`,
            language: 'csharp',
            bestPractices: [
                'Apply the minimal constraint needed — over-constraining reduces generic reusability',
                'Use struct + INumber<T> (.NET 7+) for generic math to get JIT-specialized arithmetic',
                'Use unmanaged for interop scenarios where you need pointer-safe types',
                'Combine struct + IEquatable<T> for high-performance generic collections',
                'Document constraint rationale — explain WHY not just WHAT'
            ],
            commonMistakes: [
                'Using new() when a Func<T> factory would be more flexible (supports parameterized construction)',
                'Adding class constraint unnecessarily when notnull would suffice (allows both value and ref types)',
                'Not realizing that struct implies notnull and non-nullable (redundant to combine both)',
                'Forgetting that JIT shares code for all reference types but specializes for each value type'
            ],
            interviewTip: 'For each constraint, name a specific real production use case and explain what it unlocks at the JIT level. The JIT specialization insight (separate native code per value type, shared for reference types) shows deep understanding beyond syntax.',
            followUp: ['How does the static abstract interface member feature (C# 11) relate to constraints?', 'What is the allows ref struct anti-constraint in C# 13?', 'How do constraints enable devirtualization in the JIT?']
        }
    ]
});
