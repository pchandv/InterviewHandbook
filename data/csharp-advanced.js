/* ═══════════════════════════════════════════════════════════════════
   C# — Advanced: Reflection, Expression Trees, Source Generators,
   Attributes, Dynamic, Interceptors
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('csharp-advanced', {
    title: 'Advanced C#',
    description: 'Expert-level C# features — Reflection, Source Generators, Expression Trees, Attributes, dynamic, and cutting-edge .NET features for metaprogramming and framework building.',
    sections: [
        {
            title: 'Reflection — Runtime Type Inspection',
            content: `<p><strong>Reflection</strong> allows inspecting and manipulating types, methods, properties, and attributes at runtime. It powers serialization, DI containers, ORM mapping, and plugin architectures — but comes with performance costs.</p>`,
            code: `// Get type information
Type type = typeof(User);
Type runtimeType = user.GetType(); // Runtime type (polymorphism)

// Inspect members
PropertyInfo[] props = type.GetProperties(BindingFlags.Public | BindingFlags.Instance);
foreach (var prop in props)
{
    Console.WriteLine($"{prop.Name}: {prop.PropertyType.Name} = {prop.GetValue(user)}");
}

// Invoke methods dynamically
MethodInfo method = type.GetMethod("Validate")!;
object? result = method.Invoke(user, new object[] { "param1" });

// Create instances dynamically
object instance = Activator.CreateInstance(type)!;
// Or with parameters:
object instance2 = Activator.CreateInstance(type, "Alice", 30)!;

// Generic type construction
Type openGeneric = typeof(Repository<>);
Type closedGeneric = openGeneric.MakeGenericType(typeof(User));
object repo = Activator.CreateInstance(closedGeneric, dbContext)!;

// Custom attribute reading
var attrs = type.GetCustomAttributes<TableAttribute>();
var tableName = attrs.FirstOrDefault()?.Name ?? type.Name;

// PERFORMANCE: Reflection is 100-1000x slower than direct calls
// Cache MethodInfo/PropertyInfo objects — don't look them up repeatedly!
private static readonly PropertyInfo _nameProp = 
    typeof(User).GetProperty(nameof(User.Name))!;

// Better: Compile to delegate for repeated use
var getter = (Func<User, string>)Delegate.CreateDelegate(
    typeof(Func<User, string>), _nameProp.GetMethod!);
string name = getter(user); // Near-native speed after compilation`,
            language: 'csharp'
        },
        {
            title: 'Source Generators — Compile-Time Code Generation',
            content: `<p><strong>Source Generators</strong> (C# 9+) run during compilation to produce additional C# source files. They replace runtime reflection with compile-time code generation — eliminating the performance overhead while maintaining the convenience of attribute-driven programming.</p>`,
            code: `// Source generators replace runtime reflection with compile-time codegen:
// BEFORE (reflection-based, slow):
var json = JsonSerializer.Serialize(user); // Uses reflection at runtime

// AFTER (source-generated, fast):
[JsonSerializable(typeof(User))]
public partial class AppJsonContext : JsonSerializerContext { }

var json = JsonSerializer.Serialize(user, AppJsonContext.Default.User);
// Zero reflection! Serialization code generated at compile time.

// How source generators work:
// 1. You write a generator class implementing IIncrementalGenerator
// 2. The compiler runs it during build
// 3. It inspects your code (via Roslyn syntax/semantic model)
// 4. It emits new .cs files that are compiled into your assembly

[Generator]
public class AutoMapperGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        // Find all classes with [AutoMap] attribute
        var classes = context.SyntaxProvider
            .ForAttributeWithMetadataName("AutoMapAttribute", 
                predicate: (node, _) => node is ClassDeclarationSyntax,
                transform: (ctx, _) => GetMapInfo(ctx));
        
        // Generate mapping code for each
        context.RegisterSourceOutput(classes, (spc, info) =>
        {
            var code = GenerateMappingCode(info);
            spc.AddSource($"{info.Name}_Mapper.g.cs", code);
        });
    }
}

// Real-world source generators in .NET:
// System.Text.Json       — [JsonSerializable] for AOT-friendly serialization
// Regex                  — [GeneratedRegex] for compiled regex
// Logging               — [LoggerMessage] for high-perf structured logging
// AutoMapper            — compile-time mappings (no reflection)
// MediatR               — compile-time handler registration

// Example: High-performance logging
public static partial class LogMessages
{
    [LoggerMessage(Level = LogLevel.Information, Message = "Order {OrderId} placed by {Customer}")]
    public static partial void OrderPlaced(ILogger logger, int orderId, string customer);
}
// Generated: zero-allocation, structured logging with no boxing`,
            language: 'csharp',
            callout: { type: 'info', title: 'AOT & Trimming', text: 'Source generators are essential for Native AOT compilation. Reflection-based code cannot be trimmed safely. By generating code at compile-time, source generators make your app AOT-compatible and trimmable — smaller binaries, faster startup.' }
        },
        {
            title: 'Attributes & Metaprogramming',
            content: `<p><strong>Attributes</strong> attach metadata to code elements (classes, methods, properties). They are used by frameworks for configuration, validation, serialization control, and aspect-oriented programming.</p>`,
            code: `// Built-in attributes:
[Obsolete("Use NewMethod instead", error: true)]
public void OldMethod() { }

[Required, StringLength(100, MinimumLength = 3)]
public string Name { get; set; }

[HttpGet("api/users/{id}")]
[Authorize(Roles = "Admin")]
[ProducesResponseType(typeof(User), 200)]
public IActionResult GetUser(int id) { }

// Custom attribute definition:
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class AuditLogAttribute : Attribute
{
    public string Action { get; }
    public AuditLevel Level { get; set; } = AuditLevel.Info;
    
    public AuditLogAttribute(string action) => Action = action;
}

// Usage:
[AuditLog("UserCreated", Level = AuditLevel.Critical)]
public class CreateUserHandler { }

// Reading attributes at runtime:
var attr = typeof(CreateUserHandler)
    .GetCustomAttribute<AuditLogAttribute>();
Console.WriteLine(attr?.Action); // "UserCreated"

// Conditional attributes (compile-time):
[Conditional("DEBUG")]
public void DebugLog(string message) => Console.WriteLine(message);
// Calls to DebugLog are REMOVED in Release builds!

// CallerInfo attributes — compiler fills in values:
public void Log(string message,
    [CallerMemberName] string member = "",
    [CallerFilePath] string file = "",
    [CallerLineNumber] int line = 0)
{
    Console.WriteLine($"[{member}:{line}] {message}");
}
Log("Something happened"); // Auto-fills caller info`,
            language: 'csharp'
        },
        {
            title: 'Dynamic, ExpandoObject & Interop',
            content: `<p>The <code>dynamic</code> keyword defers type checking to runtime. It is used for COM interop, working with dynamic languages (Python via IronPython), ExpandoObject for flexible data, and scenarios where the type system is too restrictive.</p>`,
            code: `// dynamic — type resolved at runtime (no compile-time checking)
dynamic obj = GetExternalData();
var result = obj.SomeMethod(); // No compile error even if method doesn't exist
// Throws RuntimeBinderException at runtime if method is missing

// ExpandoObject — dynamic property bag
dynamic config = new ExpandoObject();
config.Host = "localhost";
config.Port = 5432;
config.ConnectionString = $"Host={config.Host};Port={config.Port}";

// Cast to IDictionary for enumeration:
var dict = (IDictionary<string, object>)config;
foreach (var kvp in dict)
    Console.WriteLine($"{kvp.Key} = {kvp.Value}");

// COM Interop (Excel automation):
dynamic excel = Activator.CreateInstance(Type.GetTypeFromProgID("Excel.Application")!);
excel.Visible = true;
dynamic workbook = excel.Workbooks.Add();
dynamic sheet = workbook.Sheets[1];
sheet.Cells[1, 1].Value = "Hello from C#";

// When to use dynamic:
// 1. COM interop (Office, legacy ActiveX)
// 2. Interacting with dynamic languages (IronPython, JavaScript via engines)
// 3. Working with JSON without deserializing to a type
// 4. DLR (Dynamic Language Runtime) scenarios

// When NOT to use dynamic:
// 1. Regular application code (lose type safety, IntelliSense, refactoring)
// 2. Performance-sensitive code (DLR overhead per call)
// 3. When generics or interfaces can solve the problem

// Safer alternative: anonymous types + pattern matching
var data = new { Name = "Alice", Age = 30 };
// Or use records for structured dynamic-like data:
public record DynamicConfig(Dictionary<string, object> Values)
{
    public T Get<T>(string key) => (T)Values[key];
}`,
            language: 'csharp',
            callout: { type: 'warning', title: 'Avoid dynamic in Application Code', text: 'dynamic disables compile-time type checking, IntelliSense, and refactoring support. It has 10-100x overhead per call due to DLR binding. Use it only for COM interop or truly dynamic scenarios — never as a lazy substitute for proper typing.' }
        }
    ],
    questions: [
        {
            question: 'What is Reflection in C# and what are its performance implications?',
            difficulty: 'medium',
            answer: `<p><strong>Reflection</strong> is the ability to inspect and manipulate type metadata at runtime — discovering types, properties, methods, attributes, and invoking members dynamically. It powers DI containers, ORMs, serializers, and plugin systems. However, it is 100-1000x slower than direct calls and incompatible with AOT trimming.</p>`,
            code: `// Common reflection uses:
// 1. DI container resolving types
Type serviceType = typeof(IUserService);
Type implType = typeof(UserService);
object instance = ActivatorUtilities.CreateInstance(sp, implType);

// 2. ORM mapping (EF Core, Dapper)
foreach (var prop in typeof(User).GetProperties())
{
    var columnAttr = prop.GetCustomAttribute<ColumnAttribute>();
    var columnName = columnAttr?.Name ?? prop.Name;
    // Map DB column to property
}

// 3. Serialization
foreach (var prop in type.GetProperties())
{
    var value = prop.GetValue(obj);
    writer.WriteProperty(prop.Name, value);
}

// PERFORMANCE MITIGATION STRATEGIES:

// Strategy 1: Cache PropertyInfo/MethodInfo
private static readonly PropertyInfo[] _cachedProps = 
    typeof(User).GetProperties();

// Strategy 2: Compiled delegates (near-native speed)
var getter = (Func<User, string>)_nameProp.GetMethod!
    .CreateDelegate(typeof(Func<User, string>));

// Strategy 3: Expression tree compilation
var param = Expression.Parameter(typeof(User));
var body = Expression.Property(param, "Name");
var lambda = Expression.Lambda<Func<User, string>>(body, param);
var compiled = lambda.Compile(); // Reuse this!

// Strategy 4: Source generators (zero runtime reflection)
[JsonSerializable(typeof(User))]
partial class MyContext : JsonSerializerContext { }

// Benchmark comparison (getting a property value):
// Direct access:        ~1ns
// Cached delegate:      ~2ns
// Expression compiled:  ~3ns
// PropertyInfo.GetValue: ~200ns
// Type.GetProperty + GetValue: ~2000ns`,
            language: 'csharp',
            bestPractices: [
                'Cache all reflection results (PropertyInfo, MethodInfo, Type) — never look up per call',
                'Compile to delegates for repeated invocation (CreateDelegate or Expression.Compile)',
                'Prefer source generators over reflection for new projects (AOT-friendly)',
                'Use reflection only at startup/initialization, not in hot paths'
            ],
            commonMistakes: [
                'Looking up PropertyInfo inside loops (massive overhead per iteration)',
                'Using reflection in hot paths without caching or compilation',
                'Not considering AOT/trimming implications (reflection breaks trimmed apps)',
                'Using reflection where generics or interfaces would work'
            ],
            interviewTip: 'Show the performance hierarchy: direct call → cached delegate → cached PropertyInfo → uncached reflection. Mention that modern .NET is moving away from reflection toward source generators for AOT compatibility.',
            followUp: ['How do you make reflection AOT-compatible?', 'What are the alternatives to reflection?', 'How does EF Core use reflection internally?'],
            seniorPerspective: 'I treat reflection as an implementation detail that should be hidden behind well-typed APIs. At startup, I build compiled accessor caches — by the time requests arrive, all "reflection" is actually compiled delegate calls.',
            architectPerspective: 'In the age of Native AOT and serverless (cold starts matter), eliminating reflection is a strategic priority. Source generators provide the same magic (attribute-driven behavior) without the runtime cost or trimming issues.'
        },
        {
            question: 'What are Source Generators and how do they replace reflection?',
            difficulty: 'advanced',
            answer: `<p><strong>Source Generators</strong> are compiler plugins that run during build to emit additional C# code. They inspect your code via Roslyn APIs and produce .cs files that are compiled into your assembly. They replace runtime reflection with compile-time code generation — faster execution, AOT compatibility, and better tooling support.</p>`,
            code: `// The problem with reflection:
// 1. Slow (runtime type inspection)
// 2. Not AOT-friendly (trimmer can't analyze dynamic access)
// 3. No compile-time validation (errors at runtime)
// 4. Poor tooling (no IntelliSense for dynamically invoked members)

// Source generators solve all four:
// 1. Generated code is direct method calls (native speed)
// 2. No reflection at runtime (fully AOT compatible)
// 3. Compile-time errors if types/members don't exist
// 4. Full IntelliSense on generated code

// EXAMPLE: System.Text.Json source generation
[JsonSerializable(typeof(WeatherForecast))]
[JsonSerializable(typeof(WeatherForecast[]))]
public partial class WeatherContext : JsonSerializerContext { }

// Generated code (simplified) — you never write this:
// public class WeatherContext
// {
//     public JsonTypeInfo<WeatherForecast> WeatherForecast => _weatherForecast;
//     private JsonTypeInfo<WeatherForecast> _weatherForecast = CreateWeatherForecast();
//     static JsonTypeInfo<WeatherForecast> CreateWeatherForecast()
//     {
//         // Direct property access, no reflection
//         info.AddProperty("Temperature", static (obj) => obj.Temperature, ...);
//     }
// }

// Usage — 3-5x faster than reflection-based:
var json = JsonSerializer.Serialize(forecast, WeatherContext.Default.WeatherForecast);
var obj = JsonSerializer.Deserialize(json, WeatherContext.Default.WeatherForecast);

// EXAMPLE: Generated Regex (C# 11)
[GeneratedRegex(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")]
private static partial Regex EmailRegex();
// Compiler generates optimized state machine — faster than interpreted regex

// EXAMPLE: LoggerMessage source generation
public static partial class Log
{
    [LoggerMessage(EventId = 1, Level = LogLevel.Info, Message = "Processing order {OrderId}")]
    public static partial void ProcessingOrder(ILogger logger, int orderId);
}
// Generated: zero-allocation, pre-formatted log with no boxing`,
            language: 'csharp',
            bestPractices: [
                'Use [JsonSerializable] for all serialized types in APIs (performance + AOT)',
                'Use [GeneratedRegex] for all regex patterns (compiled at build time)',
                'Use [LoggerMessage] for high-performance structured logging',
                'Design your own generators for repetitive boilerplate (mappers, validators)'
            ],
            commonMistakes: [
                'Not marking context classes as partial (source generators require partial)',
                'Forgetting to reference the generated context in serialization calls',
                'Assuming source generators work with runtime-loaded types (they cannot)',
                'Not understanding that generators only SEE your source — not third-party compiled code'
            ],
            interviewTip: 'Explain the paradigm shift: reflection does work at RUNTIME (inspecting compiled assemblies), source generators do work at COMPILE TIME (inspecting source code via Roslyn). This is why generators are AOT-safe and reflection is not.',
            followUp: ['How do you write a custom source generator?', 'What is incremental generation?', 'What are interceptors (C# 12)?'],
            seniorPerspective: 'I add [JsonSerializable] and [LoggerMessage] as standard practices in all new services. The performance gains are free — same API surface, zero reflection, measurable throughput improvement under load.',
            architectPerspective: 'Source generators are the foundation of our "no reflection" architecture policy for serverless functions. Cold start times dropped from 3s to 200ms by eliminating JIT-time reflection in DI and serialization paths.'
        },
        {
            question: 'What is the difference between dynamic and object? When is dynamic appropriate?',
            difficulty: 'medium',
            answer: `<p><code>object</code> is the base type of all types — it provides compile-time type safety but requires casting. <code>dynamic</code> bypasses compile-time checking entirely — member access is resolved at runtime via the DLR (Dynamic Language Runtime). The compiler does not verify method calls, property access, or operators on dynamic.</p>`,
            code: `// object — compile-time type checking, requires casts
object obj = "hello";
// int len = obj.Length;     // ERROR: 'object' has no 'Length'
int len = ((string)obj).Length; // Must cast explicitly

// dynamic — no compile-time checking, resolved at runtime
dynamic dyn = "hello";
int len2 = dyn.Length;      // OK at compile time, resolved at runtime
// dyn.NonExistentMethod(); // Compiles fine! Throws RuntimeBinderException at runtime

// Performance comparison:
// object: normal .NET dispatch (fast)
// dynamic: DLR binding per call site (10-100x slower, cached after first call)

// APPROPRIATE uses of dynamic:
// 1. COM interop (Office automation)
dynamic excel = Marshal.GetActiveObject("Excel.Application");
excel.Visible = true; // No interop assembly needed

// 2. Working with ExpandoObject (dynamic data structures)
dynamic settings = new ExpandoObject();
settings.Theme = "dark";
settings.FontSize = 14;
// Useful for plugins that define arbitrary configuration

// 3. Interacting with dynamic languages
dynamic pyResult = pythonEngine.Execute("2 + 2");

// 4. Late-bound dispatch (visitor without double-dispatch)
void Process(dynamic shape) // Calls most specific overload at runtime
{
    Draw(shape); // Dispatches to Draw(Circle) or Draw(Square) at runtime
}

// INAPPROPRIATE uses (use these alternatives instead):
// Instead of dynamic for JSON: use JsonElement, records, or typed DTOs
// Instead of dynamic for flexibility: use generics with constraints
// Instead of dynamic for duck typing: use interfaces

// Type-safe alternative to dynamic:
using var doc = JsonDocument.Parse(json);
int age = doc.RootElement.GetProperty("age").GetInt32(); // Type-safe!`,
            language: 'csharp',
            bestPractices: [
                'Use dynamic only for COM interop or truly dynamic scenarios',
                'Prefer strongly-typed alternatives: generics, interfaces, JsonElement',
                'Wrap dynamic access in try-catch (RuntimeBinderException)',
                'Document WHY dynamic is used — it should be rare and justified'
            ],
            commonMistakes: [
                'Using dynamic to avoid writing proper types (technical debt)',
                'Not realizing dynamic disables all compile-time safety and refactoring',
                'Using dynamic in performance-sensitive code (DLR overhead)',
                'Confusing dynamic with var (var is compile-time inferred, dynamic is runtime-bound)'
            ],
            interviewTip: 'The key insight: var determines type at compile time (just saves typing), dynamic determines type at runtime (opts out of the type system). Show you understand the DLR call-site caching that makes subsequent dynamic calls faster.',
            followUp: ['How does the DLR cache call sites?', 'What is ExpandoObject used for?', 'How does dynamic interact with overload resolution?'],
            seniorPerspective: 'I see dynamic as a code smell in application code — it almost always indicates missing type design. The only legitimate uses I encounter are COM interop with legacy Office automation and occasional reflection replacement for internal tools.',
            architectPerspective: 'Dynamic is banned in our production codebase by analyzer rules. The loss of static analysis, refactoring safety, and AOT compatibility outweighs any convenience. For truly dynamic data, we use JsonElement or discriminated unions.'
        },
        {
            question: 'What are Interceptors (C# 12) and how do they enable AOP-like patterns?',
            difficulty: 'expert',
            answer: `<p><strong>Interceptors</strong> (C# 12, experimental) allow source generators to redirect calls to specific methods at compile time. Combined with source generators, they enable aspect-oriented programming (logging, caching, validation) without runtime proxies or reflection — zero overhead at runtime.</p>`,
            code: `// The concept: redirect a method call at compile time
// Original code (user writes):
public class UserService
{
    public User GetUser(int id) => _repo.Find(id);
}

// Source generator detects [Cacheable] attribute and emits interceptor:
// [InterceptsLocation("UserService.cs", line: 5, character: 38)]
// public static User GetUser_Intercepted(this UserService self, int id)
// {
//     if (_cache.TryGetValue(id, out var cached)) return cached;
//     var result = self.GetUser_Original(id); // Call original
//     _cache[id] = result;
//     return result;
// }

// How interceptors work:
// 1. Source generator analyzes your code
// 2. Identifies call sites to intercept (by file, line, character)
// 3. Emits interceptor method with [InterceptsLocation] attribute
// 4. Compiler redirects the call to interceptor at compile time
// Result: zero runtime overhead — the indirection is resolved during compilation

// Real-world applications:
// - Compile-time AOP (logging, caching, retry, auth checks)
// - Framework optimization (ASP.NET Minimal API route handlers)
// - Compile-time validation of SQL queries, API calls
// - Performance: replace virtual dispatch with direct calls

// ASP.NET Core uses interceptors internally:
// app.MapGet("/users/{id}", GetUser);
// The source generator intercepts this and generates optimized routing code
// that avoids reflection-based parameter binding at runtime

// Current state (as of .NET 8/9):
// - Experimental feature, requires opt-in
// - Used internally by ASP.NET Core for Request Delegate Generators
// - Not yet recommended for application-level code
// - Will mature as source generators become more capable

// Practical AOP today (without interceptors):
// Use decorators + DI for cross-cutting concerns:
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.Decorate<IUserService, CachingDecorator>();
builder.Services.Decorate<IUserService, LoggingDecorator>();`,
            language: 'csharp',
            bestPractices: [
                'Watch interceptors maturity — they will become mainstream for framework authors',
                'Today, use DI decorators or middleware for AOP patterns',
                'Understand interceptors conceptually for architect-level interviews',
                'Source generators + interceptors = compile-time AOP with zero runtime cost'
            ],
            commonMistakes: [
                'Trying to use interceptors in production code (still experimental)',
                'Confusing interceptors with runtime proxies (Castle, DispatchProxy)',
                'Not understanding that interceptors are a source generator feature, not user-facing',
                'Assuming interceptors replace DI decorators for all scenarios'
            ],
            interviewTip: 'Interceptors show you understand the cutting edge of .NET. Explain the evolution: runtime proxies (Castle DynamicProxy) → compile-time generation (source generators) → compile-time interception (interceptors). Each step eliminates runtime overhead.',
            followUp: ['How does this differ from DispatchProxy?', 'What is the Request Delegate Generator in ASP.NET?', 'How does compile-time AOP compare to runtime AOP?'],
            seniorPerspective: 'I track interceptors as the future of zero-cost cross-cutting concerns. Today I use Scrutor decorators for caching/logging, but interceptors will eventually make this completely zero-overhead.',
            architectPerspective: 'Interceptors represent the final piece in .NET\'s "zero overhead abstraction" story. Combined with source generators, they enable framework-level magic (like ASP.NET route binding) with the performance of hand-written code — no more choosing between developer experience and runtime efficiency.'
        },
        {
            question: 'What are Expression Trees and how do you build and compile them at runtime?',
            difficulty: 'advanced',
            answer: `<p>An <strong>Expression Tree</strong> is an in-memory, inspectable representation of code as data (<code>System.Linq.Expressions</code>). Unlike a compiled delegate, it can be <strong>analyzed, transformed, or translated</strong> (e.g., to SQL) — and it can be <strong>compiled to a delegate at runtime</strong> via <code>Compile()</code>, giving near-native speed after a one-time cost.</p>`,
            explanation: `A delegate is a sealed machine: you can press start but cannot look inside. An expression tree is the blueprint of that machine — you can read it, redraw it, and then have it built into a real machine on demand.`,
            code: `using System.Linq.Expressions;

// 1. Compiler-built tree from a lambda
Expression<Func<int, int>> square = x => x * x;
Func<int, int> compiled = square.Compile();  // build delegate at runtime
int r = compiled(5);                          // 25, near-native speed

// 2. Hand-built tree (no source lambda)
var p = Expression.Parameter(typeof(int), "x");
var body = Expression.Multiply(p, p);
var lambda = Expression.Lambda<Func<int, int>>(body, p);
var fn = lambda.Compile();

// 3. Real use: a fast property setter built once and cached
public static Action<T, object?> BuildSetter<T>(string propertyName)
{
    var target = Expression.Parameter(typeof(T), "t");
    var value  = Expression.Parameter(typeof(object), "v");
    var prop   = Expression.Property(target, propertyName);
    var assign = Expression.Assign(prop,
        Expression.Convert(value, prop.Type));
    return Expression.Lambda<Action<T, object?>>(assign, target, value).Compile();
}
// Cache the compiled delegate -> reflection-speed lookup once, fast calls after

// 4. Transforming trees: ExpressionVisitor rewrites nodes (tenant filters,
//    soft-delete, parameter replacement) before a provider translates them.`,
            language: 'csharp',
            bestPractices: [
                'Compile expression trees once and cache the resulting delegate',
                'Use ExpressionVisitor to transform trees rather than rebuilding by hand',
                'Use Expression<Func<...>> parameters for IQueryable to keep SQL translation',
                'Prefer source generators for static scenarios; use expression trees for runtime-dynamic ones'
            ],
            commonMistakes: [
                'Calling Compile() on every invocation (compilation is expensive, cache it)',
                'Building trees with mismatched types and hitting runtime InvalidOperationException',
                'Using compiled delegates where a plain lambda would suffice (over-engineering)',
                'Forgetting that not every expression can be translated by a given provider'
            ],
            interviewTip: 'Contrast Func (opaque, fast, cannot inspect) with Expression<Func> (inspectable data you can translate or compile). The killer detail: cache the Compile() result — uncached compilation negates the performance win.',
            followUp: ['How does ExpressionVisitor enable query rewriting?', 'When would you choose source generators over expression trees?', 'How does EF Core consume expression trees?'],
            seniorPerspective: `I use compiled expression trees to build fast accessors at startup for serializers and mappers. The cost is paid once during warm-up, after which calls are effectively direct property access rather than reflection.`,
            architectPerspective: `Expression trees are the backbone of cross-cutting query concerns — multi-tenancy filters, soft-delete, auditing — injected by visiting and rewriting IQueryable trees before SQL generation, all without touching call-site code.`
        },
        {
            question: 'How do custom attributes and metaprogramming work in C#, and what are the performance considerations?',
            difficulty: 'hard',
            answer: `<p><strong>Attributes</strong> attach declarative metadata to code elements; they are inert until something <strong>reads them via reflection</strong>. You define them by deriving from <code>System.Attribute</code>, control placement with <code>[AttributeUsage]</code>, and read them with <code>GetCustomAttributes</code>. The performance concern is that <strong>reflection-based attribute reading is slow</strong>, so results should be cached or replaced by source-generated lookups.</p>`,
            explanation: `Attributes are sticky notes on your code. The notes do nothing on their own — a reader (a framework using reflection) has to walk by and read them. Reading every note repeatedly at runtime is slow, so smart readers photograph the notes once and reuse the photo.`,
            code: `// Define a custom attribute
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = true)]
public sealed class ColumnAttribute : Attribute
{
    public string Name { get; }
    public bool IsKey { get; init; }
    public ColumnAttribute(string name) => Name = name;
}

public class User
{
    [Column("user_id", IsKey = true)] public int Id { get; set; }
    [Column("full_name")]             public string Name { get; set; } = "";
}

// Read attributes via reflection (slow -> cache the result!)
private static readonly Dictionary<PropertyInfo, ColumnAttribute> _map =
    typeof(User).GetProperties()
        .Where(p => p.GetCustomAttribute<ColumnAttribute>() is not null)
        .ToDictionary(p => p, p => p.GetCustomAttribute<ColumnAttribute>()!);
// Build once, reuse forever -> avoids per-call reflection cost

// Compiler-supplied metadata via CallerInfo attributes (zero reflection):
public void Trace(string msg,
    [CallerMemberName] string member = "",
    [CallerLineNumber] int line = 0)
    => Console.WriteLine($"[{member}:{line}] {msg}");

// Conditional attribute: calls removed entirely in non-DEBUG builds
[Conditional("DEBUG")]
public void Assert(bool ok) { if (!ok) throw new Exception("assert"); }

// Modern alternative: a source generator reads the attributes at COMPILE time
// and emits a direct mapping method -> no runtime reflection at all.`,
            language: 'csharp',
            bestPractices: [
                'Cache attribute lookups; never call GetCustomAttribute in hot paths repeatedly',
                'Constrain placement with [AttributeUsage] to catch misuse at compile time',
                'Prefer CallerInfo attributes over reflection for caller context (zero cost)',
                'Consider a source generator to read attributes at compile time for AOT and speed'
            ],
            commonMistakes: [
                'Reading attributes via reflection inside loops or per-request code',
                'Omitting [AttributeUsage], allowing attributes on unintended targets',
                'Assuming attributes execute code (they are passive metadata until read)',
                'Relying on reflection-based attribute scanning in trimmed/Native AOT apps'
            ],
            interviewTip: 'Two points land well: attributes are inert metadata (something must read them) and reflection reading is the slow part, so caching or source generation is the fix. Bonus: CallerMemberName/CallerLineNumber are filled by the compiler with no reflection.',
            followUp: ['How do CallerInfo attributes avoid reflection?', 'How does [Conditional] remove calls at compile time?', 'How would a source generator replace attribute reflection?'],
            seniorPerspective: `Whenever I see attribute reflection in a request path, I move it to a static cache built at startup. Mappers and validators that scan attributes once and cache the result run orders of magnitude faster than naive per-call reflection.`,
            architectPerspective: `Attributes are the declarative configuration layer of frameworks (routing, validation, serialization). The modern architectural shift is to consume that metadata at compile time via source generators, preserving the ergonomic attribute model while eliminating runtime reflection and enabling Native AOT.`
        }
    ,
        {
            question: 'What are ref returns, ref locals, and in parameters, and when do they matter?',
            difficulty: 'advanced',
            answer: `<p>These features let you pass and return <em>references</em> to storage locations instead of copies, avoiding large-struct copies and enabling in-place mutation.</p>
            <ul>
                <li><strong>ref return / ref local</strong> \u2014 a method returns a reference to existing storage (e.g., an array element); the caller can read or mutate it in place without copying.</li>
                <li><strong>in parameter</strong> \u2014 passes a value type by readonly reference, avoiding a copy of a large struct while guaranteeing the callee will not modify it (the compiler may make a defensive copy if the struct is not <code>readonly</code>).</li>
                <li><strong>ref readonly</strong> \u2014 returns a readonly reference (no copy, no mutation).</li>
            </ul>
            <p>They matter for high-performance code over large structs (graphics, math, buffers); for normal small types the copy is cheaper and clearer.</p>`,
            explanation: 'Normally you hand someone a photocopy of a document. ref hands them the original so edits land on it; in hands them the original under glass \u2014 they can read it without making a copy, but cannot write on it.',
            code: `// ref return + ref local: mutate an array element in place, no copy
ref int Find(int[] arr, int i) => ref arr[i];
ref int slot = ref Find(data, 3);
slot = 99;                       // writes directly into data[3]

// 'in' avoids copying a large struct; mark struct readonly to avoid defensive copies
readonly struct BigMatrix { /* many fields */ }
double Determinant(in BigMatrix m) { /* read m, no copy */ return 0; }`,
            language: 'csharp',
            bestPractices: ['Use in + readonly struct together to avoid both copies and defensive copies', 'Use ref returns for in-place mutation of large structs in arrays/buffers', 'Reserve these for measured hot paths over large value types', 'Prefer ref readonly when you want no-copy reads without allowing mutation'],
            commonMistakes: ['Using in on a non-readonly struct, causing hidden defensive copies', 'Returning a ref to a local or stack value that goes out of scope', 'Using ref/in for small types where it adds complexity for no gain', 'Exposing ref returns that let callers mutate internal state unexpectedly'],
            interviewTip: 'Stress the defensive-copy gotcha: in on a non-readonly struct can copy anyway, defeating the purpose. Knowing that pairing readonly struct + in is the win shows depth.',
            followUp: ['Why can in cause a defensive copy?', 'How does ref return avoid struct copies?', 'What are the lifetime rules for ref returns?'],
            seniorPerspective: 'I only reach for ref/in plumbing when profiling shows large-struct copies dominating, and I always make those structs readonly so in does not silently copy. Misused, these features add complexity and subtle aliasing bugs for no measurable gain.',
            architectPerspective: 'Ref semantics are what let .NET expose high-performance numeric and buffer APIs without allocations or copies. They are a low-level optimization tool \u2014 valuable in libraries and hot paths, but not something to spread through ordinary business code.'
        },
        {
            question: 'What are static abstract members in interfaces, and how do they enable generic math?',
            difficulty: 'expert',
            answer: `<p><strong>Static abstract (and static virtual) interface members</strong> (C# 11 / .NET 7) let an interface declare static members \u2014 including operators \u2014 that implementing types must provide. This unlocks <strong>generic math</strong>: you can write one generic algorithm constrained to <code>INumber&lt;T&gt;</code> that works for <code>int</code>, <code>double</code>, <code>decimal</code>, etc., calling <code>+</code>, <code>T.Zero</code>, <code>T.One</code> generically.</p>
            <p>Before this, you could not call operators or static factory methods on a generic <code>T</code>, forcing duplicated overloads per numeric type or slow <code>dynamic</code>. Now the constraint carries the static surface the algorithm needs.</p>`,
            explanation: 'Previously a generic method could call instance methods on T but not "+" or "T.Zero", so math code was copy-pasted for every number type. Static abstract members let the interface promise "every T here supports + and has a Zero," so one generic version works for all of them.',
            code: `using System.Numerics;

// One generic Sum that works for int, double, decimal, long, ...
static T Sum<T>(IEnumerable<T> items) where T : INumber<T>
{
    T total = T.Zero;                 // static abstract member
    foreach (var x in items) total += x;   // static abstract operator +
    return total;
}

int a = Sum(new[] { 1, 2, 3 });        // 6
double b = Sum(new[] { 1.5, 2.5 });    // 4.0

// Define your own:
interface IAddable<T> { static abstract T operator +(T a, T b); }`,
            language: 'csharp',
            bestPractices: ['Use INumber<T> / the generic-math interfaces to write one algorithm for all numeric types', 'Constrain to the narrowest static-abstract interface your algorithm needs', 'Prefer this over dynamic or per-type overloads for numeric generality', 'Reserve custom static-abstract interfaces for genuine abstraction needs (factories, parsing)'],
            commonMistakes: ['Still duplicating numeric methods per type instead of using generic math', 'Reaching for dynamic to call operators on T (slow, unsafe)', 'Over-engineering ordinary code with static-abstract interfaces', 'Confusing static abstract (must implement) with static virtual (optional override)'],
            interviewTip: 'Anchor on the concrete win: before C# 11 you could not call + or T.Zero on a generic T. Naming INumber<T> and a real generic Sum shows you have used generic math, not just heard of it.',
            followUp: ['What is the difference between static abstract and static virtual members?', 'How was generic numeric code written before C# 11?', 'Where else (besides math) are static abstract members useful?'],
            seniorPerspective: 'Generic math finally killed the per-type numeric overload duplication I used to maintain. Beyond math, static abstract members are great for generic factories and TryParse-style contracts, but I keep them out of everyday code where they just add ceremony.',
            architectPerspective: 'Static abstract members close a long-standing gap in the generic type system, letting libraries (System.Numerics, parsing, serialization) offer truly type-generic APIs. It is a foundational language capability that library authors exploit far more than application developers.'
        },
        {
            question: 'What are default interface methods, and what problem do they solve (and create)?',
            difficulty: 'advanced',
            answer: `<p><strong>Default interface methods (DIMs)</strong> (C# 8) let an interface provide a method <em>body</em>, so implementers inherit behavior without writing it. The primary motivation is <strong>API evolution</strong>: you can add a method to a published interface with a default implementation without breaking the thousands of existing implementers.</p>
            <p>Trade-offs: they blur the line between interfaces and abstract classes, introduce a form of multiple inheritance (with diamond-resolution rules), and a DIM is only callable through the interface reference, not the implementing type directly \u2014 which can surprise people. Use them mainly for safe interface evolution, not as a default design tool.</p>`,
            explanation: 'Normally adding a method to an interface breaks everyone who implemented it. A default interface method is like adding a new feature to a contract while supplying a built-in fallback, so existing signatories are not suddenly in breach.',
            code: `interface ILogger
{
    void Log(string message);

    // Added later WITHOUT breaking existing implementers:
    void LogError(string message) => Log("ERROR: " + message);  // default body
}

class ConsoleLogger : ILogger
{
    public void Log(string m) => Console.WriteLine(m);
    // LogError inherited from the interface default
}

ILogger logger = new ConsoleLogger();
logger.LogError("boom");      // works via the interface
// ((ConsoleLogger)logger).LogError(...) would NOT compile \u2014 DIM is interface-only`,
            language: 'csharp',
            bestPractices: ['Use DIMs primarily to evolve published interfaces without breaking implementers', 'Keep default bodies thin \u2014 delegate to abstract members of the same interface', 'Document that DIMs are callable only through the interface reference', 'Prefer abstract base classes when you truly want shared state/behavior'],
            commonMistakes: ['Using DIMs as a substitute for abstract classes (they cannot hold state)', 'Expecting to call a DIM via the concrete type (only the interface sees it)', 'Creating diamond-inheritance ambiguity across multiple interfaces', 'Putting heavy logic in defaults, eroding the interface/implementation boundary'],
            interviewTip: 'Lead with the real motivation \u2014 backward-compatible interface evolution \u2014 then note the gotcha that a DIM is only accessible through the interface, not the implementing class. That pairing is the senior-level nuance.',
            followUp: ['Why can a default method only be called via the interface?', 'How does C# resolve diamond inheritance with DIMs?', 'When would you still prefer an abstract base class?'],
            seniorPerspective: 'I use DIMs almost exclusively to grow an interface that external code already implements \u2014 adding a method with a sensible default avoids a breaking change. As a general design tool they tempt people into interface-as-base-class, which muddies the model.',
            architectPerspective: 'DIMs are an API-versioning feature first and a language feature second: they let framework authors extend contracts across major versions without a breaking change. That backward-compat lever matters most at the library/platform boundary, less in app code.'
        }
    ,
        {
            question: 'Walk through the key C# 12/13 features (primary constructors, collection expressions, required members) and when to use them.',
            difficulty: 'advanced',
            answer: `<p>Recent C# adds productivity and safety features:</p>
            <ul>
                <li><strong>Primary constructors</strong> (C# 12, on classes/structs) \u2014 declare constructor parameters on the type itself; they are in scope for field initializers and members, cutting boilerplate for DI-heavy classes.</li>
                <li><strong>Collection expressions</strong> (C# 12) \u2014 a unified <code>[...]</code> literal for arrays, lists, spans, etc., including the spread operator <code>..</code>.</li>
                <li><strong>required members</strong> (C# 11) \u2014 force callers to set a property during initialization, giving immutable-friendly object construction without a giant constructor.</li>
                <li><strong>Primary-constructor + records</strong> still differ: records add value equality and <code>with</code>; primary constructors on plain classes do not.</li>
            </ul>`,
            explanation: 'These are mostly boilerplate-killers: primary constructors remove the "assign every ctor param to a field" ritual, collection expressions remove ceremony around building lists/arrays, and required members give you "you must set this" without writing a positional constructor.',
            code: `// Primary constructor: params in scope for the whole class (great for DI)
class OrderService(IOrderRepo repo, ILogger<OrderService> logger)
{
    public Task<Order> Get(int id)
    {
        logger.LogInformation("get {Id}", id);
        return repo.GetAsync(id);
    }
}

// Collection expressions + spread
int[] a = [1, 2, 3];
List<int> b = [0, ..a, 4];        // 0,1,2,3,4
Span<int> s = [10, 20, 30];

// required members: caller MUST set Name (compile error otherwise)
class Customer { public required string Name { get; init; } public int Age { get; init; } }
var c = new Customer { Name = "Ada" };`,
            language: 'csharp',
            bestPractices: ['Use primary constructors to cut DI boilerplate on services', 'Use collection expressions for concise, target-typed collection creation', 'Use required members for mandatory init-only properties instead of huge constructors', 'Still use records when you need value equality and non-destructive with-mutation'],
            commonMistakes: ['Assuming a primary constructor on a class gives record-style value equality (it does not)', 'Capturing primary-constructor params into multiple fields unintentionally (they become captured state)', 'Overusing new syntax where it reduces clarity for the team', 'Forgetting required members are enforced at compile time only for the initializer'],
            interviewTip: 'Show you know the boundaries: primary constructors are not records (no value equality), and required members enforce initialization without a positional constructor. Naming the version each landed in signals you track the language.',
            followUp: ['How does a primary constructor differ from a record?', 'How do required members interact with serialization?', 'What does the spread operator compile to?'],
            seniorPerspective: 'Primary constructors meaningfully cut noise in DI-heavy service classes, and required members let me keep init-only immutability without a 10-parameter constructor. I adopt these once the whole team is on a compiler version, since mixing styles hurts readability more than the syntax helps.',
            architectPerspective: 'These features nudge the language toward concise, immutable-by-default modeling, which improves correctness in concurrent and functional-leaning codebases. The architectural value is subtle: less boilerplate means the domain intent (required data, immutability) is more visible in the type itself.'
        },
        {
            question: 'When would you use unsafe code, pointers, and function pointers in C#, and what are the risks?',
            difficulty: 'expert',
            answer: `<p><code>unsafe</code> code lets you use pointers (<code>int*</code>), <code>fixed</code> to pin memory, and <code>delegate*</code> <strong>function pointers</strong> for low-overhead indirect calls. It bypasses the runtime\u2019s memory safety, so it is reserved for performance-critical interop and hot loops.</p>
            <ul>
                <li><strong>Interop</strong> \u2014 calling native APIs that take pointers; <code>fixed</code> pins managed arrays so the GC won\u2019t move them during the call.</li>
                <li><strong>Performance</strong> \u2014 pointer arithmetic over buffers can beat bounds-checked access in extreme hot paths (though <code>Span&lt;T&gt;</code> now covers most cases safely).</li>
                <li><strong>Function pointers</strong> (<code>delegate*</code>) \u2014 avoid delegate allocation/indirection for callbacks, useful in interop and high-performance dispatch.</li>
            </ul>
            <p>Risks: memory corruption, buffer overruns, GC-move bugs if not pinned, and loss of type/memory safety \u2014 so it must be isolated, audited, and justified by measurement.</p>`,
            explanation: 'unsafe is taking the safety guards off a power tool: occasionally necessary for a cut the guarded tool can\u2019t make, but you only do it deliberately, in a controlled spot, when you\u2019ve measured that nothing safer works.',
            code: `// Pin a managed array and use a pointer (interop / hot loop)
unsafe void XorInPlace(byte[] data, byte key)
{
    fixed (byte* p = data)            // pin so GC won't move it
    {
        for (int i = 0; i < data.Length; i++)
            p[i] ^= key;
    }
}

// Function pointer: no delegate allocation
unsafe void Apply(int* arr, int len, delegate*<int, int> f)
{
    for (int i = 0; i < len; i++) arr[i] = f(arr[i]);
}`,
            language: 'csharp',
            bestPractices: ['Prefer Span<T>/safe APIs first \u2014 reach for unsafe only when profiling justifies it', 'Always pin managed memory with fixed before taking a pointer to it', 'Isolate unsafe code in small, well-tested, audited methods', 'Use function pointers for hot interop/dispatch where delegate allocation matters'],
            commonMistakes: ['Using unsafe for perf without measuring \u2014 Span is usually as fast and safe', 'Taking a pointer to managed memory without pinning (GC moves it \u2192 corruption)', 'Letting pointers escape the fixed block', 'Spreading unsafe across the codebase instead of isolating it'],
            interviewTip: 'Lead with "Span<T> made most unsafe code unnecessary" \u2014 then give the legitimate cases (native interop, function pointers to avoid delegate allocation). Mentioning fixed/pinning and GC-move corruption shows real understanding.',
            followUp: ['Why must you pin memory before using a pointer to it?', 'How do function pointers differ from delegates in cost?', 'When does Span<T> NOT replace unsafe?'],
            seniorPerspective: 'I treat any unsafe block as a code-review red flag that must earn its place with a benchmark. Span and the modern buffer APIs eliminated the vast majority of cases where I used to drop into pointers; what remains is mostly native interop.',
            architectPerspective: 'unsafe is a contained escape hatch: valuable in interop layers and a handful of perf-critical libraries, but it forfeits the memory-safety guarantees the platform is built on. Architecturally I quarantine it behind safe abstractions so the rest of the system never sees a raw pointer.'
        }
    ]
});
