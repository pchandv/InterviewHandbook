/* ═══════════════════════════════════════════════════════════════════
   Design Patterns — Creational, Structural, Behavioral
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('dp-creational', {
    title: 'Creational Design Patterns',
    description: 'Patterns that deal with object creation mechanisms — Singleton, Factory, Abstract Factory, Builder, and Prototype.',
    quickRecall: [
        'Singleton: use Lazy<T> or static readonly for thread-safe instance',
        'Factory Method: subclass decides which concrete type to create',
        'Builder: step-by-step construction of complex objects with fluent API',
        'Abstract Factory: creates families of related objects without concrete classes',
        'Prototype: clone existing objects when creation is expensive',
        'Dont use patterns for simple problems — over-engineering is an anti-pattern',
        'Prefer composition over inheritance — Strategy/Decorator over subclassing'
    ],
    sections: [
        {
            title: 'Overview',
            content: `<p>Creational patterns abstract the instantiation process, making a system independent of how objects are created, composed, and represented.</p>
            <table>
                <thead><tr><th>Pattern</th><th>Intent</th><th>Use When</th></tr></thead>
                <tbody>
                    <tr><td><strong>Singleton</strong></td><td>Ensure a class has only one instance</td><td>Shared resource (config, connection pool, cache)</td></tr>
                    <tr><td><strong>Factory Method</strong></td><td>Define interface for creating objects, let subclasses decide</td><td>Object type depends on runtime conditions</td></tr>
                    <tr><td><strong>Abstract Factory</strong></td><td>Create families of related objects</td><td>UI themes, cross-platform components, environment-specific services</td></tr>
                    <tr><td><strong>Builder</strong></td><td>Construct complex objects step by step</td><td>Object with many optional parameters</td></tr>
                    <tr><td><strong>Prototype</strong></td><td>Clone existing objects</td><td>Creating objects is expensive, use pre-configured templates</td></tr>
                </tbody>
            </table>`,
            mermaid: `classDiagram
    class INotificationSender {
        <<interface>>
        +SendAsync(recipient, message) Task
    }
    class EmailSender {
        +SendAsync(recipient, message) Task
    }
    class SmsSender {
        +SendAsync(recipient, message) Task
    }
    class PushSender {
        +SendAsync(recipient, message) Task
    }
    class NotificationFactory {
        +Create(channel) INotificationSender
    }
    INotificationSender <|.. EmailSender
    INotificationSender <|.. SmsSender
    INotificationSender <|.. PushSender
    NotificationFactory ..> INotificationSender : creates`
        },
        {
            title: 'Factory Method Pattern',
            content: `<p>The Factory Method defines an interface for creating an object but lets subclasses decide which class to instantiate. In C#, this often manifests as a static factory method or a factory class.</p>`,
            code: `// Interface
public interface INotificationSender
{
    Task SendAsync(string recipient, string message, CancellationToken ct);
}

// Concrete implementations
public class EmailSender : INotificationSender
{
    public async Task SendAsync(string recipient, string message, CancellationToken ct)
    {
        // Send via SMTP
        await _smtpClient.SendMailAsync(new MailMessage("noreply@app.com", recipient, "Notification", message), ct);
    }
}

public class SmsSender : INotificationSender
{
    public async Task SendAsync(string recipient, string message, CancellationToken ct)
    {
        await _twilioClient.SendSmsAsync(recipient, message, ct);
    }
}

public class PushNotificationSender : INotificationSender
{
    public async Task SendAsync(string recipient, string message, CancellationToken ct)
    {
        await _firebaseClient.SendPushAsync(recipient, message, ct);
    }
}

// Factory
public interface INotificationFactory
{
    INotificationSender Create(NotificationType type);
}

public class NotificationFactory : INotificationFactory
{
    private readonly IServiceProvider _services;

    public NotificationFactory(IServiceProvider services) => _services = services;

    public INotificationSender Create(NotificationType type) => type switch
    {
        NotificationType.Email => _services.GetRequiredService<EmailSender>(),
        NotificationType.Sms => _services.GetRequiredService<SmsSender>(),
        NotificationType.Push => _services.GetRequiredService<PushNotificationSender>(),
        _ => throw new ArgumentOutOfRangeException(nameof(type))
    };
}

// Usage
public class NotificationService
{
    private readonly INotificationFactory _factory;

    public async Task NotifyAsync(User user, string message, CancellationToken ct)
    {
        foreach (var pref in user.NotificationPreferences)
        {
            var sender = _factory.Create(pref.Type);
            await sender.SendAsync(pref.Address, message, ct);
        }
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Builder Pattern',
            content: `<p>Builder separates construction of a complex object from its representation. Essential for objects with many optional parameters or multi-step construction.</p>`,
            code: `// Fluent Builder pattern (most common in C#)
public class HttpRequestBuilder
{
    private string _url = "";
    private HttpMethod _method = HttpMethod.Get;
    private readonly Dictionary<string, string> _headers = new();
    private string? _body;
    private TimeSpan _timeout = TimeSpan.FromSeconds(30);
    private int _retries = 0;
    private string? _bearerToken;

    public HttpRequestBuilder WithUrl(string url) { _url = url; return this; }
    public HttpRequestBuilder WithMethod(HttpMethod method) { _method = method; return this; }
    public HttpRequestBuilder WithHeader(string key, string value) { _headers[key] = value; return this; }
    public HttpRequestBuilder WithJsonBody(object body) { _body = JsonSerializer.Serialize(body); return this; }
    public HttpRequestBuilder WithTimeout(TimeSpan timeout) { _timeout = timeout; return this; }
    public HttpRequestBuilder WithRetries(int count) { _retries = count; return this; }
    public HttpRequestBuilder WithBearerToken(string token) { _bearerToken = token; return this; }

    public HttpRequestMessage Build()
    {
        if (string.IsNullOrEmpty(_url)) throw new InvalidOperationException("URL is required");

        var request = new HttpRequestMessage(_method, _url);
        
        foreach (var (key, value) in _headers)
            request.Headers.Add(key, value);
        
        if (_bearerToken != null)
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _bearerToken);
        
        if (_body != null)
            request.Content = new StringContent(_body, Encoding.UTF8, "application/json");

        return request;
    }
}

// Usage — readable, self-documenting
var request = new HttpRequestBuilder()
    .WithUrl("https://api.example.com/orders")
    .WithMethod(HttpMethod.Post)
    .WithBearerToken(token)
    .WithJsonBody(new { customerId = 123, items = cart })
    .WithTimeout(TimeSpan.FromSeconds(10))
    .WithRetries(3)
    .Build();`,
            language: 'csharp'
        },
        {
            title: 'Singleton Pattern',
            content: `<p>Singleton ensures a class has only one instance and provides global access to it. In modern .NET, the DI container largely replaces hand-rolled Singletons — you register with <code>AddSingleton&lt;T&gt;()</code>.</p>
<p><strong>When to use:</strong> Shared resources (connection pools, caches, configuration), logging infrastructure, metrics collectors.</p>
<p><strong>Modern approach:</strong> DI-managed singleton (testable, replaceable) over static Singleton (hidden dependency, untestable).</p>`,
            code: `// Thread-safe Singleton using Lazy<T> (classic approach)
public sealed class AppConfig
{
    private static readonly Lazy<AppConfig> _instance =
        new(() => new AppConfig(), LazyThreadSafetyMode.ExecutionAndPublication);

    public static AppConfig Instance => _instance.Value;
    private AppConfig() { /* load from file */ }

    public string ConnectionString { get; private set; } = "";
}

// MODERN: Let DI manage it (preferred in 99% of cases)
builder.Services.AddSingleton<IAppConfig, AppConfig>();
// - Testable (inject a mock IAppConfig)
// - No hidden static dependency
// - Lifetime managed by container`,
            language: 'csharp'
        },
        {
            title: 'Abstract Factory Pattern',
            content: `<p>Abstract Factory creates <strong>families of related objects</strong> without specifying their concrete classes. The key value: products from one factory are guaranteed compatible with each other.</p>
<p><strong>When to use:</strong> Cross-platform UI, environment-specific service stacks (dev/prod), cloud provider abstraction (AWS/Azure), themed component sets.</p>`,
            code: `// Abstract Factory for cloud-provider independence
public interface ICloudFactory
{
    IBlobStorage CreateStorage();
    IMessageQueue CreateQueue();
    ISecretVault CreateVault();
}

public class AzureFactory : ICloudFactory
{
    public IBlobStorage CreateStorage() => new AzureBlobStorage();
    public IMessageQueue CreateQueue() => new AzureServiceBusQueue();
    public ISecretVault CreateVault() => new AzureKeyVault();
}

public class AwsFactory : ICloudFactory
{
    public IBlobStorage CreateStorage() => new S3Storage();
    public IMessageQueue CreateQueue() => new SqsQueue();
    public ISecretVault CreateVault() => new SecretsManager();
}

// Client code is cloud-agnostic — factory chosen at startup:
public class DocumentService(ICloudFactory cloud)
{
    private readonly IBlobStorage _storage = cloud.CreateStorage();
    private readonly IMessageQueue _queue = cloud.CreateQueue();

    public async Task UploadAsync(Document doc, CancellationToken ct)
    {
        await _storage.UploadAsync(doc.Content, ct);
        await _queue.PublishAsync(new DocumentUploaded(doc.Id), ct);
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Prototype Pattern',
            content: `<p>Prototype creates new objects by cloning an existing instance. Useful when construction is expensive or you need pre-configured templates.</p>
<p><strong>Key C# concern:</strong> Shallow copy (MemberwiseClone, record <code>with</code>) shares reference-type members. Deep copy duplicates the entire object graph.</p>`,
            code: `// Template-based object creation using Prototype
public class ReportTemplate : ICloneable
{
    public string Title { get; set; } = "";
    public List<string> Sections { get; set; } = new();
    public ReportFormat Format { get; set; }
    public Dictionary<string, object> Parameters { get; set; } = new();

    // Deep clone — independent copy
    public ReportTemplate DeepClone()
    {
        return new ReportTemplate
        {
            Title = Title,
            Sections = new List<string>(Sections),      // New list
            Format = Format,
            Parameters = new Dictionary<string, object>(Parameters)  // New dict
        };
    }

    object ICloneable.Clone() => DeepClone();
}

// Usage — stamp out variations from a template
var monthlyTemplate = new ReportTemplate
{
    Title = "Monthly Revenue",
    Sections = new() { "Summary", "By Region", "Trends" },
    Format = ReportFormat.Pdf
};

var januaryReport = monthlyTemplate.DeepClone();
januaryReport.Parameters["month"] = "January";  // Independent copy

var februaryReport = monthlyTemplate.DeepClone();
februaryReport.Parameters["month"] = "February"; // Does NOT affect January`,
            language: 'csharp'
        },
        {
            title: 'When to Use Which Pattern',
            content: `<p>A decision guide for choosing the right creational pattern:</p>`,
            mermaid: `flowchart TD
    A[Need to create objects?] --> B{What is the problem?}
    B -->|"Single shared instance"| C[Singleton via DI AddSingleton]
    B -->|"Choose type at runtime"| D[Factory Method / Simple Factory]
    B -->|"Family of related types"| E[Abstract Factory]
    B -->|"Many optional params"| F[Builder]
    B -->|"Expensive creation / templates"| G[Prototype]
    B -->|"None of the above"| H[Just use new / DI]
    
    C --> I[Modern: DI container]
    D --> J[Modern: Keyed services .NET 8]
    F --> K[Modern: required + init properties]
    G --> L[Modern: records with expression]`
        },
        {
            title: 'Best Practices',
            content: `<ul>
<li><strong>Let DI manage lifetimes</strong> — AddSingleton/Scoped/Transient replaces hand-rolled Singletons and most Factories</li>
<li><strong>Keyed services (.NET 8) replace many factories</strong> — Register multiple implementations, resolve by key at runtime</li>
<li><strong>Use Builder for genuinely complex construction</strong> — Validate invariants in Build(); produce immutable results</li>
<li><strong>Abstract Factory earns its cost only for product families</strong> — Don't use it for a single product type</li>
<li><strong>Prefer records + with for simple cloning</strong> — Only use explicit Prototype when deep copying complex graphs</li>
<li><strong>Factory Method for frameworks/base classes</strong> — When a template algorithm needs subclasses to supply one piece</li>
<li><strong>Return interfaces from factories, never concrete types</strong> — The whole point is abstraction</li>
<li><strong>Keep factories close to the composition root</strong> — Business logic should not know about creation mechanics</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>Factory for everything</strong> — Creating IFooFactory when simple DI registration suffices</li>
<li><strong>Static Singleton with mutable state</strong> — Global variables dressed up as a pattern; breaks testing</li>
<li><strong>Builder for 2-parameter objects</strong> — A constructor is simpler; Builder adds ceremony without value</li>
<li><strong>Abstract Factory with one product</strong> — That's just Factory Method with extra abstraction tax</li>
<li><strong>Shallow clone bugs</strong> — Using MemberwiseClone or record with and not realizing nested objects are shared</li>
<li><strong>Pattern by name, not by problem</strong> — "We need a Factory here" without identifying what creation problem exists</li>
<li><strong>Exposing concrete types from factories</strong> — Defeats the purpose of the abstraction</li>
<li><strong>Not considering modern C# alternatives</strong> — required members, primary constructors, keyed services</li>
</ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>Pattern-to-problem mapping</strong> — Don't just define patterns. Show you choose based on the actual creation problem.</li>
<li><strong>Modern awareness</strong> — Know that DI, keyed services, records, and required members have absorbed many pattern use cases.</li>
<li><strong>Real examples</strong> — "We used Builder for our Polly retry policies because..." beats textbook definitions.</li>
<li><strong>Over-engineering awareness</strong> — Knowing when NOT to use a pattern is the senior signal.</li>
<li><strong>Code on demand</strong> — Be ready to implement Factory or Builder live on a whiteboard.</li>
<li><strong>Shallow vs Deep copy</strong> — A common trap question. Know the C# specifics (MemberwiseClone, record with).</li>
</ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li>Creational patterns abstract object creation to decouple client code from concrete types</li>
<li>DI container (AddSingleton/Scoped/Transient) replaces most hand-rolled creational patterns in modern .NET</li>
<li>Factory Method: one product, subclass decides. Abstract Factory: family of products, consistency guaranteed.</li>
<li>Builder: step-by-step complex construction with validation. Use for fluent APIs and multi-optional-param objects.</li>
<li>Prototype: clone expensive/templated objects. In C#, beware shallow vs deep copy semantics.</li>
<li>Modern C# (keyed services, required members, records) reduces the need for explicit pattern implementations</li>
<li>The pattern is the solution to a problem — identify the problem first, then reach for the pattern</li>
<li>Over-engineering (pattern without problem) is the most common mistake with creational patterns</li>
</ul>`
        }
    ],
    questions: [
        {"question":"Compare the Factory Method and Abstract Factory creational patterns.","difficulty":"medium","answer":"<p><strong>Factory Method</strong> defines an interface for creating <em>one</em> product but lets subclasses decide which concrete type to instantiate — it defers instantiation of a single product to subclasses. <strong>Abstract Factory</strong> provides an interface for creating <em>families</em> of related products without specifying concrete classes — one factory produces multiple related objects that are meant to work together.</p><p>Use Factory Method to decouple creation of a single product from its use; use Abstract Factory when you must create sets of related products consistently (e.g., a UI toolkit producing matching buttons, checkboxes, and menus for a given theme).</p>","explanation":"Factory Method is a bakery that lets each branch decide which bread to bake. Abstract Factory is choosing an entire themed dinner set (matching plates, cups, cutlery) — one factory yields a coordinated family.","bestPractices":["Factory Method to defer a single product type to subclasses","Abstract Factory for consistent families of related products","Favor these over scattering new expressions across code"],"commonMistakes":["Over-engineering simple object creation with factories","Confusing the two (one product vs a family)","Abstract factories that leak concrete types"],"interviewTip":"One product vs a family of related products is the crisp distinction; give the UI-theme example for Abstract Factory.","followUp":["When is a simple factory (not a pattern) enough?","How does DI relate to factories?","What problem does the Builder pattern solve instead?"]},
        {"question":"What problem does the Builder pattern solve, and when is it preferable to a constructor?","difficulty":"medium","answer":"<p>The <strong>Builder</strong> pattern constructs a complex object step by step, separating construction from representation. It shines when an object has <strong>many optional parameters</strong> or requires multi-step, validated assembly — replacing telescoping constructors (many overloads) and long ambiguous parameter lists.</p><p>Prefer it over a constructor when: there are many optional fields, you want readable named steps (a fluent API), you need to enforce invariants before producing an immutable result, or construction order/validation matters. For simple objects with few fields, a constructor or object initializer is clearer.</p>","explanation":"A Builder is ordering a custom sandwich step by step (\"add cheese, no onions, extra sauce\") instead of memorizing one giant order with ten positional slots where you cannot tell what each means.","bestPractices":["Use for objects with many optional parameters","Provide a fluent, readable API; validate before Build()","Produce an immutable result"],"commonMistakes":["Builders for trivial objects (over-engineering)","Telescoping constructors instead of a builder","Builders that allow invalid partial objects to escape"],"interviewTip":"Trigger phrase: \"many optional parameters / telescoping constructors.\" Note it pairs well with immutability (validate then Build).","followUp":["How does Builder compare to an object initializer?","What is a fluent builder?","How do records/with-expressions overlap with Builder?"]},
        {
            question: 'Is Singleton still relevant in modern .NET with DI containers? When would you use it?',
            difficulty: 'advanced',
            answer: `<p>The classic GoF Singleton (static instance, double-lock) is <strong>largely obsolete</strong> in modern .NET because DI containers handle lifetime management. However, the <strong>concept</strong> (single instance per app) remains essential — you just achieve it via <code>AddSingleton&lt;T&gt;()</code>.</p>
            <p>Direct Singleton pattern is still valid for: pre-DI infrastructure (logging, config bootstrapping), static helper classes, or when you genuinely need eager initialization before the DI container exists.</p>`,
            code: `// MODERN approach: DI container manages the singleton lifetime
builder.Services.AddSingleton<IConnectionPool, ConnectionPool>();
builder.Services.AddSingleton<ICacheService, RedisCacheService>();

// Container ensures SINGLE INSTANCE across all consumers
// Benefits: testable (mock IConnectionPool), no static state

// CLASSIC Singleton (still valid for pre-DI scenarios)
public sealed class AppMetrics
{
    private static readonly Lazy<AppMetrics> _instance = 
        new(() => new AppMetrics(), LazyThreadSafetyMode.ExecutionAndPublication);
    
    public static AppMetrics Instance => _instance.Value;
    
    private readonly ConcurrentDictionary<string, long> _counters = new();
    
    private AppMetrics() { } // Private ctor
    
    public void Increment(string metric) => _counters.AddOrUpdate(metric, 1, (_, v) => v + 1);
    public long Get(string metric) => _counters.GetValueOrDefault(metric);
}

// When classic Singleton is appropriate:
// 1. Logging infrastructure (available before DI container builds)
// 2. Assembly-level initialization (ModuleInitializer)
// 3. Interop with legacy code expecting static access`,
            language: 'csharp',
            bestPractices: [
                'Prefer DI container AddSingleton<T>() over static Singleton classes',
                'If using classic Singleton, use Lazy<T> for thread-safe lazy initialization',
                'Make singleton classes sealed to prevent inheritance issues',
                'Consider if Singleton is actually needed vs just a long-lived scoped service'
            ],
            commonMistakes: [
                'Using Singleton for mutable shared state without thread safety',
                'Making everything a Singleton (creates hidden coupling)',
                'Not considering testability — static singletons are hard to mock',
                'Double-check locking without volatile (subtle threading bug in older .NET)'
            ],
            interviewTip: 'Show evolution: GoF Singleton → IoC Singleton registration. Explain WHY DI-managed singletons are better (testable, replaceable, lifetime-managed). But know when classic is still needed.',
            followUp: ['How does AddSingleton behave in multi-tenant applications?', 'What threading issues can Singleton cause?', 'How do you test code that depends on a Singleton?'],
            seniorPerspective: 'I ban static Singletons in business logic code. They\'re invisible dependencies that break unit testing. The DI container is the singleton manager — use it.',
            architectPerspective: 'In distributed systems, "singleton" is a process-level concept. A horizontally scaled service has N singleton instances. If you need TRUE single-instance behavior, use distributed locking (Redis, DB) instead.'
        },
        {
            question: 'Explain the Builder pattern. How does it differ from the Factory pattern?',
            difficulty: 'medium',
            answer: `<p><strong>Builder</strong> constructs a complex object step by step, allowing fine-grained control over the construction process. <strong>Factory</strong> creates an object in one shot based on input parameters.</p>
            <ul>
                <li><strong>Builder</strong>: Many optional parameters, multi-step construction, fluent API. Example: HttpRequestMessage, IHostBuilder, StringBuilder.</li>
                <li><strong>Factory</strong>: Choosing between related types at runtime. Example: LoggerFactory, DbProviderFactory.</li>
            </ul>`,
            explanation: 'Builder is like customizing a burger at a restaurant (add lettuce? cheese? sauce? extra patty?). Factory is like choosing from the menu (Big Mac or Quarter Pounder?).',
            code: `// BUILDER — Step by step construction of complex object
var host = Host.CreateDefaultBuilder(args)
    .ConfigureServices(services => 
    {
        services.AddHttpClient();
        services.AddMemoryCache();
    })
    .ConfigureLogging(logging =>
    {
        logging.AddConsole();
        logging.SetMinimumLevel(LogLevel.Information);
    })
    .Build(); // Final construction

// FACTORY — Choose type based on runtime input
public class PaymentProcessorFactory
{
    public IPaymentProcessor Create(PaymentMethod method) => method switch
    {
        PaymentMethod.CreditCard => new StripeProcessor(),
        PaymentMethod.PayPal => new PayPalProcessor(),
        PaymentMethod.BankTransfer => new BankProcessor(),
        _ => throw new NotSupportedException()
    };
}

// KEY DIFFERENCE:
// Builder: SAME type, different configuration
// Factory: DIFFERENT types, uniform interface`,
            language: 'csharp',
            interviewTip: 'Real examples: IHostBuilder (builder), ILoggerFactory (factory), StringBuilder (builder), DbProviderFactory (abstract factory). Use framework examples to show you understand the patterns in practice.',
            followUp: ['When would you combine Builder with Factory?', 'How does the Builder pattern enable immutability?', 'What is the Director in the Builder pattern?'],
            seniorPerspective: 'I use Builder for configuration objects (FluentValidation rules, Polly policies, HttpClient setup). The fluent API is self-documenting and prevents invalid state through compile-time guidance.',
            architectPerspective: 'Builder + immutable records is a powerful combination for creating validated domain objects. The builder enforces invariants during construction, and the resulting record guarantees immutability after.'
        },
        {
            question: 'What is the Factory Method pattern, and how does it differ from a Simple Factory and Abstract Factory?',
            difficulty: 'medium',
            answer: `<p><strong>Factory Method</strong> defines a method (often abstract) that subclasses override to decide which concrete type to create — creation is deferred to subclasses. A <strong>Simple Factory</strong> is just a single class/method with a switch that returns the right type (not a formal GoF pattern). An <strong>Abstract Factory</strong> creates whole <em>families</em> of related objects through a set of factory methods.</p>
            <ul>
                <li><strong>Simple Factory:</strong> one decision point, returns one product</li>
                <li><strong>Factory Method:</strong> subclass-driven creation, one product per subclass</li>
                <li><strong>Abstract Factory:</strong> creates a coordinated set of products</li>
            </ul>`,
            explanation: 'A Simple Factory is a vending machine: press a button, get the matching item. Factory Method is a franchise where each branch decides how to make its signature dish. Abstract Factory is a furniture brand that produces a whole matching set (chair + sofa + table) in one style.',
            code: `// SIMPLE FACTORY — not GoF; a switch in one place
public static class LoggerFactory
{
    public static ILogger Create(string kind) => kind switch
    {
        "file"    => new FileLogger(),
        "console" => new ConsoleLogger(),
        _ => throw new ArgumentOutOfRangeException(nameof(kind))
    };
}

// FACTORY METHOD — subclasses decide the concrete product
public abstract class DialogBase
{
    protected abstract IButton CreateButton(); // the factory method

    public void Render()
    {
        var button = CreateButton();
        button.Paint();
    }
}

public class WindowsDialog : DialogBase
{
    protected override IButton CreateButton() => new WindowsButton();
}

public class WebDialog : DialogBase
{
    protected override IButton CreateButton() => new HtmlButton();
}`,
            language: 'csharp',
            bestPractices: [
                'Use Factory Method when a base workflow needs subclasses to supply the concrete part',
                'Use a Simple Factory for straightforward "pick by key" creation',
                'Return interfaces/abstractions from factories, not concrete types',
                'In modern .NET, a DI container often replaces hand-rolled factories'
            ],
            commonMistakes: [
                'Calling every switch-based creator a "Factory Method" (it is usually a Simple Factory)',
                'Returning concrete types, defeating the abstraction',
                'Adding factories where direct construction or DI would be simpler',
                'Confusing Factory Method (one product) with Abstract Factory (product families)'
            ],
            interviewTip: 'Be precise that Simple Factory is not a GoF pattern. The distinguishing axis: Factory Method uses inheritance/overriding, Abstract Factory produces a coordinated family of products.',
            followUp: ['When does a DI container replace a factory?', 'How does Factory Method support the Open/Closed Principle?', 'What is a keyed service in .NET 8?'],
            seniorPerspective: 'In application code I rarely write the inheritance-based Factory Method; DI plus a small resolver covers most needs. I reserve true Factory Method for framework-style base classes where subclasses must supply one concrete piece of an otherwise fixed algorithm.',
            architectPerspective: 'Factories are the seam for swapping implementations per environment or tenant. Keeping creation behind an abstraction means runtime selection (feature flag, tenant config) never leaks into business logic.'
        },
        {
            question: 'Explain the Abstract Factory pattern. Give a real scenario where it earns its complexity.',
            difficulty: 'hard',
            answer: `<p><strong>Abstract Factory</strong> provides an interface for creating <strong>families of related objects</strong> without specifying their concrete classes. It guarantees that products from one factory are compatible with each other.</p>
            <p>It earns its complexity when you must produce a coordinated set of objects that must not be mixed across families — for example, cross-platform UI widgets, environment-specific service stacks, or cloud-provider resource clients where every piece must come from the same provider.</p>`,
            explanation: 'Abstract Factory is like ordering a themed party kit: choose "pirate" and you get matching plates, cups, and napkins. You can never accidentally end up with pirate plates and unicorn cups, because one factory produces the whole consistent set.',
            code: `// Product families that must stay consistent
public interface IButton { void Paint(); }
public interface ICheckbox { void Render(); }

// Abstract factory — one method per product in the family
public interface IUiFactory
{
    IButton CreateButton();
    ICheckbox CreateCheckbox();
}

// Concrete family 1: Windows
public class WindowsFactory : IUiFactory
{
    public IButton CreateButton() => new WindowsButton();
    public ICheckbox CreateCheckbox() => new WindowsCheckbox();
}

// Concrete family 2: macOS
public class MacFactory : IUiFactory
{
    public IButton CreateButton() => new MacButton();
    public ICheckbox CreateCheckbox() => new MacCheckbox();
}

// Client works only against abstractions; the family is chosen once
public class Application
{
    private readonly IButton _button;
    private readonly ICheckbox _checkbox;

    public Application(IUiFactory factory)
    {
        _button = factory.CreateButton();
        _checkbox = factory.CreateCheckbox(); // guaranteed same family
    }

    public void Render() { _button.Paint(); _checkbox.Render(); }
}

// Selection happens once at composition root:
IUiFactory factory = OperatingSystem.IsWindows()
    ? new WindowsFactory()
    : new MacFactory();
var app = new Application(factory);`,
            language: 'csharp',
            bestPractices: [
                'Use it when products MUST be used together and mixing families is invalid',
                'Select the concrete factory once, at the composition root',
                'Keep client code dependent only on the abstract factory and abstract products',
                'Add a new family by adding a factory, not by editing clients (Open/Closed)'
            ],
            commonMistakes: [
                'Using Abstract Factory when products are independent (a Simple Factory suffices)',
                'Leaking concrete product types into client code',
                'Adding a new product type, which forces every factory to change (a known trade-off)',
                'Over-applying it for a single product — that is just Factory Method'
            ],
            interviewTip: 'Stress the "family consistency" guarantee — that is the whole point. Note the known weakness: adding a new product KIND requires changing every factory interface and implementation.',
            followUp: ['What is the main drawback when adding a new product type?', 'How does DI relate to Abstract Factory?', 'How would you make factory selection configuration-driven?'],
            seniorPerspective: 'I only reach for Abstract Factory when there is a real invariant that products must match. Otherwise it is ceremony. The cross-cloud abstraction (same-provider storage + queue + secrets clients) is the case where it has genuinely paid off for me.',
            architectPerspective: 'Abstract Factory underpins provider-agnostic architectures. It localizes the "which vendor" decision to one place, so swapping a cloud provider or database family becomes a configuration change rather than a code-wide refactor.'
        },
        {
            question: 'What is the Prototype pattern, and how do shallow vs deep copies affect it in C#?',
            difficulty: 'medium',
            answer: `<p><strong>Prototype</strong> creates new objects by cloning an existing instance rather than constructing from scratch — useful when construction is expensive or when you want pre-configured templates.</p>
            <p>In C#, the key concern is <strong>shallow vs deep copy</strong>:</p>
            <ul>
                <li><strong>Shallow copy</strong> (e.g., <code>MemberwiseClone</code>, record <code>with</code>) copies references — nested objects are shared between original and clone.</li>
                <li><strong>Deep copy</strong> duplicates the entire object graph, so the clone is fully independent.</li>
            </ul>`,
            explanation: 'A shallow copy is photocopying a form that still points to the same attached folder — edit the folder via either copy and both see the change. A deep copy duplicates the folder too, so the two are completely independent.',
            code: `public class Address { public string City { get; set; } = ""; }

public class Customer
{
    public string Name { get; set; } = "";
    public Address Address { get; set; } = new();

    // Shallow copy — Address reference is SHARED
    public Customer ShallowClone() => (Customer)MemberwiseClone();

    // Deep copy — Address is duplicated, fully independent
    public Customer DeepClone() => new Customer
    {
        Name = Name,
        Address = new Address { City = Address.City }
    };
}

// Demonstration of the trap:
var original = new Customer { Name = "Ana", Address = new Address { City = "Oslo" } };
var shallow = original.ShallowClone();
shallow.Address.City = "Bergen";
// original.Address.City is now ALSO "Bergen" — shared reference!

// Records give a shallow copy via 'with' (same caveat for reference members):
public record Point(int X, int Y);
var p1 = new Point(1, 2);
var p2 = p1 with { Y = 5 }; // value members copied; reference members would be shared`,
            language: 'csharp',
            bestPractices: [
                'Be explicit about shallow vs deep — choose based on whether the clone must be independent',
                'For deep copies, clone mutable reference members manually or via a serializer',
                'Prefer immutable types/records so cloning concerns largely disappear',
                'Use Prototype when construction is genuinely expensive or template-driven'
            ],
            commonMistakes: [
                'Assuming MemberwiseClone or record with gives a deep copy (it does not)',
                'Sharing mutable nested objects between original and clone unintentionally',
                'Using serialization-based deep clone in hot paths (slow)',
                'Reaching for Prototype when a constructor or factory is clearer'
            ],
            interviewTip: 'The shallow-vs-deep distinction is the heart of any Prototype question in C#. Mention that record "with" expressions are shallow copies — a common gotcha.',
            followUp: ['Does ICloneable guarantee deep or shallow copy?', 'How do records change the cloning story?', 'When is serialization-based cloning acceptable?'],
            seniorPerspective: 'I avoid ICloneable because its contract never specifies deep vs shallow, which causes bugs. When I need clones I write an explicit method with a clear name and intent, or I make the type immutable so the question is moot.',
            architectPerspective: 'Prototype matters most for configuration templates and test data builders. In domain modeling I lean toward immutability instead — it removes the entire class of shared-mutable-state bugs that cloning is often trying to work around.'
        },
        {
            question: 'How do you choose among the creational patterns, and how has modern C# changed the picture?',
            difficulty: 'advanced',
            answer: `<p>Pick the creational pattern by the <strong>problem</strong>, not by habit:</p>
            <ul>
                <li><strong>Single shared instance</strong> → register as a DI singleton (the modern Singleton)</li>
                <li><strong>Choose one type at runtime</strong> → Factory Method / Simple Factory / keyed services</li>
                <li><strong>Create a consistent family</strong> → Abstract Factory</li>
                <li><strong>Many optional parameters / step-wise build</strong> → Builder</li>
                <li><strong>Clone an expensive or templated object</strong> → Prototype</li>
            </ul>
            <p>Modern C# absorbs much of this: the DI container manages lifetimes (Singleton), <code>required</code> members and primary constructors reduce the need for Builders, records give cheap copies (Prototype-lite), and target-typed <code>new</code> simplifies construction.</p>`,
            explanation: 'Choosing a creational pattern is like choosing a tool: a screwdriver for screws, a wrench for bolts. The mistake is owning a fancy multi-tool (a pattern) and forcing every job through it. Modern C# is like a cordless driver that handles the common jobs out of the box.',
            code: `// MODERN C# reduces classic creational boilerplate:

// 1. DI replaces hand-written Singleton
services.AddSingleton<ICache, MemoryCache>();

// 2. Keyed services (.NET 8) replace many Simple Factories
services.AddKeyedScoped<INotifier, EmailNotifier>("email");
services.AddKeyedScoped<INotifier, SmsNotifier>("sms");
// Resolve: serviceProvider.GetRequiredKeyedService<INotifier>("sms");

// 3. 'required' + object initializer reduces the need for a Builder
public class EmailOptions
{
    public required string From { get; init; }
    public required string To { get; init; }
    public string? Cc { get; init; }
}
var opts = new EmailOptions { From = "a@x.com", To = "b@y.com" };

// 4. Records give cheap, safe copies (Prototype-lite)
public record Quote(string Symbol, decimal Price);
var updated = original with { Price = 101.5m };

// Still hand-roll a Builder when construction is genuinely multi-step
// and needs validation between steps (e.g., fluent query/policy builders).`,
            language: 'csharp',
            bestPractices: [
                'Let the DI container own lifetimes instead of static Singletons',
                'Prefer required members and records over Builders for simple object shapes',
                'Use keyed services for runtime selection before writing a custom factory',
                'Reserve explicit patterns for cases the language features do not cover well'
            ],
            commonMistakes: [
                'Writing a custom factory when keyed DI services would do',
                'Building a Builder for an object with two optional properties',
                'Static Singletons that hide dependencies and resist testing',
                'Applying a pattern by name without identifying the actual creation problem'
            ],
            interviewTip: 'Show that you map pattern to problem and that you know modern C# features (DI lifetimes, keyed services, required, records) have absorbed many classic creational use cases. That demonstrates current, pragmatic judgment.',
            followUp: ['When is a hand-written Builder still justified?', 'How do keyed services compare to a factory class?', 'What problems do records NOT solve for object creation?'],
            seniorPerspective: 'My default is the simplest construction the language allows, escalating to a pattern only when I feel real pain. Most "factory" needs in a modern codebase are satisfied by DI registration; most "builder" needs by required members and initializers.',
            architectPerspective: 'Creation strategy is an architectural seam: centralizing it (composition root, factories, DI registration) keeps construction policy out of business logic, which is what enables per-environment and per-tenant variation without touching domain code.'
        }
    ,
        {
            question: 'When should you NOT use a design pattern, and what are the most common pattern anti-patterns?',
            difficulty: 'advanced',
            answer: `<p>Patterns are solutions to <em>recurring problems</em> \u2014 applying one without the problem adds complexity for no benefit. Use a pattern when it removes real pain (duplication, rigidity, untestability), not to demonstrate knowledge. Favor the simplest thing that works (KISS/YAGNI) and refactor <em>to</em> a pattern when the need actually emerges.</p>
            <p>Common anti-patterns:</p>
            <ul>
                <li><strong>Pattern fever / over-engineering</strong> \u2014 a factory + strategy + decorator stack for what a plain method would do.</li>
                <li><strong>Singleton abuse</strong> \u2014 global mutable state masquerading as a pattern; hurts testability and hides dependencies (prefer DI).</li>
                <li><strong>Anemic domain model</strong> \u2014 data bags + procedural services, missing real OO behavior.</li>
                <li><strong>Speculative generality</strong> \u2014 abstractions "for future flexibility" that never arrives.</li>
            </ul>`,
            explanation: 'Patterns are power tools. Using a pneumatic nail gun to hang one picture frame is not impressive \u2014 it is reckless. You reach for the tool when the job\u2019s scale actually calls for it, not to show you own it.',
            bestPractices: ['Apply a pattern only when the recurring problem it solves is actually present', 'Prefer the simplest design (KISS/YAGNI); refactor to a pattern when pain emerges', 'Replace Singletons with DI-managed lifetimes for testability', 'Let abstractions earn their place with a second concrete use case (rule of three)'],
            commonMistakes: ['Applying patterns to show off, adding indirection without benefit', 'Singletons as global mutable state, harming testing and hiding dependencies', 'Speculative abstraction for imagined future needs that never materialize', 'Anemic models where behavior leaks into procedural service classes'],
            interviewTip: 'The senior signal is restraint: say patterns are tools for recurring problems, name over-engineering and Singleton abuse as anti-patterns, and cite YAGNI + "refactor to patterns" rather than designing them in upfront.',
            followUp: ['Why is Singleton often considered an anti-pattern?', 'What is "refactor to patterns"?', 'How does the rule of three apply to abstraction?'],
            seniorPerspective: 'In reviews I push back more often on too much pattern than too little \u2014 premature abstraction is harder to undo than duplication. I want to see the problem first; then I am happy to refactor toward the pattern that genuinely fits.',
            architectPerspective: 'Patterns are a shared vocabulary, not a goal. Over-applied, they become accidental complexity that slows every future change; the architectural skill is choosing the minimum structure that meets real, present requirements and letting designs evolve toward patterns as needs prove themselves.'
        }
    ]
});
