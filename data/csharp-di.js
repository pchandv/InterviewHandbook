/* ═══════════════════════════════════════════════════════════════════
   C# — Dependency Injection, IoC Container, Service Lifetimes
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('csharp-di', {
    title: 'Dependency Injection',
    description: 'Mastering the built-in .NET DI container — service lifetimes, registration patterns, keyed services, factory methods, and avoiding common pitfalls like captive dependencies.',
    quickRecall: [
        'Transient: new instance every time — lightweight, stateless services',
        'Scoped: one instance per HTTP request — DbContext, UnitOfWork',
        'Singleton: one instance for app lifetime — caches, config, HttpClient',
        'Constructor injection is preferred — explicit, testable, immutable',
        'Captive dependency: singleton holds scoped/transient — causes memory leaks',
        'IServiceProvider.GetRequiredService<T>() throws if not registered',
        'Register interfaces to implementations: AddScoped<IService, Service>()'
    ],
    sections: [
        {
            title: 'DI Container Architecture',
            mermaid: `graph TB
    subgraph Registration[Service Registration - Startup]
        REG[builder.Services.AddScoped&lt;IOrderService, OrderService&gt;]
        REG2[builder.Services.AddSingleton&lt;ICache, RedisCache&gt;]
        REG3[builder.Services.AddTransient&lt;IValidator, OrderValidator&gt;]
    end
    subgraph Container[DI Container - IServiceProvider]
        SC[Service Collection<br/>Type Registry]
        SF[Service Factory<br/>Creates Instances]
        SL[Lifetime Manager<br/>Scoped/Singleton/Transient]
    end
    subgraph Resolution[Dependency Resolution - Runtime]
        CTRL[Controller Constructor]
        SVC[OrderService]
        REPO[IOrderRepository]
        CACHE[ICache - Singleton]
        VAL[IValidator - Transient]
    end
    REG & REG2 & REG3 --> SC
    SC --> SF --> SL
    CTRL -->|resolve| SVC
    SVC -->|inject| REPO & CACHE & VAL`,
            content: `<p>The DI container manages three responsibilities: <strong>registration</strong> (what types satisfy which interfaces), <strong>resolution</strong> (creating instance graphs), and <strong>lifetime management</strong> (when to create new vs reuse).</p>`
        },
        {
            title: 'DI Fundamentals & Why It Matters',
            content: `<p><strong>Dependency Injection</strong> is the practice of providing dependencies to a class from the outside rather than having the class create them. It enables testability, loose coupling, and adherence to SOLID principles (especially Dependency Inversion and Single Responsibility).</p>
            <ul>
                <li><strong>Constructor Injection</strong> — dependencies declared in constructor (preferred)</li>
                <li><strong>Method Injection</strong> — dependencies passed per-call (rare, for transient context)</li>
                <li><strong>Property Injection</strong> — set after construction (avoid — hides dependencies)</li>
            </ul>`,
            code: `// WITHOUT DI — tightly coupled, untestable
public class OrderService
{
    private readonly SqlOrderRepository _repo = new(); // Hard dependency!
    private readonly SmtpEmailService _email = new();  // Hard dependency!
    
    public void PlaceOrder(Order order)
    {
        _repo.Save(order);      // Can't mock for testing
        _email.Send(order);     // Can't test without SMTP server
    }
}

// WITH DI — loosely coupled, testable
public class OrderService
{
    private readonly IOrderRepository _repo;
    private readonly INotificationService _notifications;

    public OrderService(IOrderRepository repo, INotificationService notifications)
    {
        _repo = repo;                // Injected — can be mocked
        _notifications = notifications; // Injected — can be faked
    }

    public async Task PlaceOrderAsync(Order order)
    {
        await _repo.SaveAsync(order);
        await _notifications.NotifyAsync(order);
    }
}

// Registration in Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();
builder.Services.AddScoped<INotificationService, EmailNotificationService>();
builder.Services.AddScoped<OrderService>();`,
            language: 'csharp'
        },
        {
            title: 'Service Lifetimes — Transient, Scoped, Singleton',
            content: `<p>The three lifetimes control how often a new instance is created and when it is disposed:</p>
            <ul>
                <li><strong>Transient</strong> — new instance every time it is requested. Best for lightweight, stateless services.</li>
                <li><strong>Scoped</strong> — one instance per scope (typically per HTTP request in ASP.NET). Best for database contexts, unit-of-work.</li>
                <li><strong>Singleton</strong> — one instance for the application lifetime. Best for caches, configuration, HttpClient wrappers.</li>
            </ul>`,
            code: `// Registration
builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();   // New each time
builder.Services.AddScoped<IUnitOfWork, EfUnitOfWork>();          // Per request
builder.Services.AddSingleton<ICacheService, RedisCacheService>(); // App lifetime

// Lifetime behavior demonstration:
public class DemoController : ControllerBase
{
    // All three injected in same request:
    public DemoController(
        ITransientService t1,    // Instance A
        ITransientService t2,    // Instance B (different!)
        IScopedService s1,       // Instance C
        IScopedService s2,       // Instance C (same within request!)
        ISingletonService sing1  // Instance D (same across ALL requests)
    ) { }
}

// DANGER: Captive Dependency (lifetime mismatch)
// A Singleton holding a Scoped service = bug!
builder.Services.AddSingleton<ICacheService, CacheService>();
builder.Services.AddScoped<IDbContext, AppDbContext>();

public class CacheService : ICacheService
{
    private readonly IDbContext _db; // CAPTIVE! Scoped inside Singleton
    // This DbContext instance lives forever — stale data, connection leaks!
}

// .NET validates this at startup in Development:
// InvalidOperationException: Cannot consume scoped service from singleton

// Valid lifetime combinations (consumer → dependency):
// Singleton → Singleton     ✓
// Singleton → Transient     ⚠️ (becomes effectively singleton)
// Singleton → Scoped        ✗ CAPTIVE DEPENDENCY
// Scoped    → Singleton     ✓
// Scoped    → Scoped        ✓
// Scoped    → Transient     ✓
// Transient → Singleton     ✓
// Transient → Scoped        ✓ (within scope)
// Transient → Transient     ✓`,
            language: 'csharp',
            callout: { type: 'warning', title: 'Captive Dependencies', text: 'A Singleton consuming a Scoped service "captures" a single instance that should be per-request. The scoped service becomes a de-facto singleton with stale state. .NET detects this in Development with ValidateScopes but NOT in Production by default.' }
        },
        {
            title: 'Advanced Registration Patterns',
            content: `<p>Beyond basic AddScoped/AddTransient, the .NET DI container supports factories, open generics, keyed services (.NET 8), decorators, and conditional registration.</p>`,
            code: `// Factory registration — runtime logic for instance creation
builder.Services.AddScoped<IPaymentGateway>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var env = config["Environment"];
    return env == "Production"
        ? new StripeGateway(config["Stripe:Key"]!)
        : new MockPaymentGateway();
});

// Open generic registration — one line for all generic types
builder.Services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
// Resolving IRepository<User> → creates EfRepository<User>
// Resolving IRepository<Order> → creates EfRepository<Order>

// Keyed services (.NET 8) — multiple implementations of same interface
builder.Services.AddKeyedScoped<INotificationSender, EmailSender>("email");
builder.Services.AddKeyedScoped<INotificationSender, SmsSender>("sms");
builder.Services.AddKeyedScoped<INotificationSender, PushSender>("push");

public class NotificationOrchestrator(
    [FromKeyedServices("email")] INotificationSender email,
    [FromKeyedServices("sms")] INotificationSender sms)
{
    public async Task NotifyAsync(User user, string message)
    {
        await email.SendAsync(user.Email, message);
        if (user.PhoneVerified)
            await sms.SendAsync(user.Phone, message);
    }
}

// Decorator pattern with DI (using Scrutor or manual)
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.Decorate<IOrderService, CachingOrderService>();
builder.Services.Decorate<IOrderService, LoggingOrderService>();
// Resolution order: Logging → Caching → OrderService

// TryAdd — only register if not already registered (library-friendly)
builder.Services.TryAddScoped<IUserService, DefaultUserService>();

// Options pattern — inject configuration
builder.Services.Configure<SmtpOptions>(config.GetSection("Smtp"));
// Inject: IOptions<SmtpOptions>, IOptionsSnapshot<SmtpOptions>, IOptionsMonitor<SmtpOptions>`,
            language: 'csharp'
        },
        {
            title: 'Testing with DI — Mocking & Faking',
            content: `<p>DI makes services testable by allowing you to substitute real implementations with mocks, fakes, or stubs during testing. Constructor injection makes dependencies explicit and easy to replace.</p>`,
            code: `// Unit test with Moq — mock dependencies
[Fact]
public async Task PlaceOrder_SavesAndNotifies()
{
    // Arrange
    var mockRepo = new Mock<IOrderRepository>();
    var mockNotify = new Mock<INotificationService>();
    var service = new OrderService(mockRepo.Object, mockNotify.Object);
    var order = new Order { Id = 1, Total = 99.99m };

    // Act
    await service.PlaceOrderAsync(order);

    // Assert
    mockRepo.Verify(r => r.SaveAsync(order, It.IsAny<CancellationToken>()), Times.Once);
    mockNotify.Verify(n => n.NotifyAsync(order, It.IsAny<CancellationToken>()), Times.Once);
}

// Integration test — use real DI container with overrides
public class OrderServiceIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public OrderServiceIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace real DB with in-memory for testing
                services.RemoveAll<IOrderRepository>();
                services.AddScoped<IOrderRepository, InMemoryOrderRepository>();
                
                // Replace external services with fakes
                services.RemoveAll<INotificationService>();
                services.AddScoped<INotificationService, FakeNotificationService>();
            });
        });
    }

    [Fact]
    public async Task PostOrder_Returns201()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/orders", new { Total = 50m });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}`,
            language: 'csharp'
        }
    ],
    questions: [
        {"question":"What are the DI service lifetimes in .NET (transient, scoped, singleton), and what is the captive dependency problem?","difficulty":"hard","answer":"<p><strong>Transient</strong>: a new instance every time it is requested. <strong>Scoped</strong>: one instance per scope (per HTTP request in ASP.NET Core). <strong>Singleton</strong>: one instance for the whole application lifetime.</p><p>The <strong>captive dependency</strong> problem is injecting a shorter-lived service into a longer-lived one — e.g., a <em>scoped</em> DbContext into a <em>singleton</em>. The singleton captures and reuses that single scoped instance forever, across requests and threads, causing stale data, concurrency bugs, and disposed-object errors. Rule: a service may only depend on services with an equal-or-longer lifetime; to use a scoped service from a singleton, resolve it per-operation via a scope factory.</p>","explanation":"A singleton holding a scoped DbContext is like one permanent employee keeping a visitor badge that was meant to expire daily — they keep using yesterday's badge forever, and it eventually stops working.","bestPractices":["Depend only on equal-or-longer lifetimes","Resolve scoped services from a singleton via IServiceScopeFactory","Keep DbContext scoped, never singleton"],"commonMistakes":["Injecting a scoped/transient service into a singleton","Making DbContext a singleton","Capturing a scoped service in a static/singleton field"],"interviewTip":"Define the three lifetimes crisply, then nail the captive dependency (scoped-into-singleton) with the DbContext example and the \"equal-or-longer lifetime\" rule.","followUp":["How do you use a scoped service inside a singleton correctly?","Why must DbContext be scoped?","Does the built-in container detect captive dependencies?"]},
        {"question":"What is constructor injection, and why is it preferred over the service locator pattern?","difficulty":"medium","answer":"<p><strong>Constructor injection</strong> passes a class's dependencies through its constructor, so the object cannot be created without them. The <strong>service locator</strong> pattern instead has classes pull dependencies from a global container on demand (e.g., <code>Locator.Get&lt;IFoo&gt;()</code>).</p><p>Constructor injection is preferred because dependencies are <strong>explicit</strong> (visible in the signature), the object is always in a valid state, it is easily unit-tested (pass mocks), and the compiler enforces them. The service locator hides dependencies, making code harder to test and reason about — it is widely considered an anti-pattern.</p>","explanation":"Constructor injection is a recipe that lists all ingredients up front. A service locator is a cook who wanders to the pantry mid-recipe for unlisted items — you never know what they actually need until it fails.","bestPractices":["Prefer constructor injection for required dependencies","Keep constructors free of heavy work — just assign dependencies","Make dependencies explicit and minimal (watch for too many params)"],"commonMistakes":["Using a static service locator, hiding dependencies","Doing real work in constructors","A huge constructor signaling the class does too much"],"interviewTip":"Contrast \"explicit + testable + always-valid\" (constructor) vs \"hidden + hard to test\" (locator), and call the locator an anti-pattern.","followUp":["When is a service locator sometimes acceptable?","What does a too-large constructor tell you?","How does constructor injection aid testing?"]},
        {
            question: 'What are the three service lifetimes in .NET DI and when do you use each?',
            difficulty: 'easy',
            answer: `<p>The three lifetimes determine instance creation and disposal timing:</p>
            <ul>
                <li><strong>Transient</strong> — new instance per injection. Use for: lightweight, stateless services (validators, formatters, factories).</li>
                <li><strong>Scoped</strong> — one instance per scope (HTTP request). Use for: DbContext, UnitOfWork, request-specific state.</li>
                <li><strong>Singleton</strong> — one instance for app lifetime. Use for: caches, configuration, HttpClient factories, thread-safe shared state.</li>
            </ul>`,
            code: `// Registration:
services.AddTransient<IValidator, OrderValidator>();        // New each injection
services.AddScoped<AppDbContext>();                         // Per-request
services.AddSingleton<IMemoryCache, MemoryCache>();         // App lifetime

// Real-world decision matrix:
// DbContext         → Scoped    (tracks changes per request)
// HttpClient        → Singleton (via IHttpClientFactory)
// ILogger<T>        → Singleton (thread-safe, shared)
// Validation logic  → Transient (stateless, cheap)
// User session data → Scoped    (per-request context)
// Background worker → Singleton (long-running)
// Email sender      → Transient (or Scoped if needs UoW)

// Verifying lifetimes in development:
builder.Host.UseDefaultServiceProvider(options =>
{
    options.ValidateScopes = true;  // Detect captive dependencies
    options.ValidateOnBuild = true; // Detect missing registrations at startup
});`,
            language: 'csharp',
            bestPractices: [
                'Default to Scoped for services with state tied to a request',
                'Use Transient for stateless, lightweight services',
                'Use Singleton only for thread-safe services (caches, config, factories)',
                'Enable ValidateScopes and ValidateOnBuild in Development'
            ],
            commonMistakes: [
                'Registering DbContext as Singleton (stale data, connection pool exhaustion)',
                'Using Scoped services inside Singletons (captive dependency)',
                'Making everything Transient (unnecessary object creation and GC pressure)',
                'Not understanding that Singleton services must be thread-safe'
            ],
            interviewTip: 'Draw a timeline showing request lifecycle: Scoped created at request start, disposed at end. Singleton persists across requests. Transient is unique per injection point. Then explain the captive dependency problem.',
            followUp: ['What is a captive dependency?', 'How does IServiceScopeFactory solve the singleton-scoped problem?', 'What happens to disposable transient services?'],
            seniorPerspective: 'My rule: if in doubt, use Scoped. It\'s safe in most ASP.NET scenarios. Singletons require thread-safety auditing. I only use Transient when the service truly needs a fresh instance per injection (e.g., random number generators).',
            architectPerspective: 'Lifetime choices have system-wide implications. A Singleton cache with Scoped DbContext access requires IServiceScopeFactory — this pattern appears in background services, SignalR hubs, and middleware that outlives the request scope.'
        },
        {
            question: 'What is the captive dependency problem and how do you solve it?',
            difficulty: 'medium',
            answer: `<p>A <strong>captive dependency</strong> occurs when a longer-lived service (Singleton) holds a reference to a shorter-lived service (Scoped/Transient). The shorter-lived service becomes "captured" — it lives as long as its captor, violating its intended lifetime. For Scoped services, this means one request\'s DbContext is shared across ALL subsequent requests.</p>`,
            code: `// THE PROBLEM:
services.AddSingleton<ICacheWarmer, CacheWarmer>();
services.AddScoped<AppDbContext>(); // Should be per-request!

public class CacheWarmer : ICacheWarmer // Singleton
{
    private readonly AppDbContext _db; // CAPTIVE! Lives forever now.
    
    public CacheWarmer(AppDbContext db) // Injected once at app start
    {
        _db = db; // This SINGLE DbContext is shared across all requests!
        // Stale data, disposed connection, thread-safety violations
    }
}

// SOLUTION 1: IServiceScopeFactory (recommended)
public class CacheWarmer : ICacheWarmer
{
    private readonly IServiceScopeFactory _scopeFactory;

    public CacheWarmer(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory; // Singleton-safe!
    }

    public async Task WarmCacheAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // Fresh DbContext, properly scoped, disposed after use
        var data = await db.Products.ToListAsync();
    }
}

// SOLUTION 2: Factory delegate
services.AddSingleton<ICacheWarmer>(sp =>
{
    // Don't resolve scoped here — use factory pattern
    return new CacheWarmer(() => 
        sp.CreateScope().ServiceProvider.GetRequiredService<AppDbContext>());
});

// SOLUTION 3: Func<T> injection (requires registration)
services.AddScoped<AppDbContext>();
services.AddSingleton<Func<AppDbContext>>(sp => 
    () => sp.CreateScope().ServiceProvider.GetRequiredService<AppDbContext>());

// DETECTION: Enable scope validation
builder.Host.UseDefaultServiceProvider(options =>
{
    options.ValidateScopes = true; // Throws in Development!
});`,
            language: 'csharp',
            bestPractices: [
                'Enable ValidateScopes in Development to catch captive dependencies early',
                'Use IServiceScopeFactory in Singletons that need scoped services',
                'Never inject Scoped services directly into Singleton constructors',
                'Consider using IOptionsMonitor<T> (Singleton-safe) instead of IOptionsSnapshot<T> (Scoped)'
            ],
            commonMistakes: [
                'Injecting DbContext into Singleton services (most common captive dependency)',
                'Not enabling ValidateScopes (problem goes undetected until production)',
                'Using service locator pattern (GetService) as a general solution instead of proper DI',
                'Forgetting to dispose the scope created by IServiceScopeFactory'
            ],
            interviewTip: 'Explain the concrete failure mode: Singleton creates one DbContext at startup, reuses it for millions of requests. The connection goes stale, change tracking accumulates, and thread-safety violations cause intermittent crashes.',
            followUp: ['How does IServiceScopeFactory work?', 'What is the service locator anti-pattern?', 'How do background services access scoped services?'],
            seniorPerspective: 'Every background service (IHostedService) I write uses IServiceScopeFactory. It\'s the standard pattern for any long-lived component that needs per-operation database access. I enforce this via code review.',
            architectPerspective: 'Captive dependencies are a class of bugs that only manifest under load (connection exhaustion, stale state). I add custom Roslyn analyzers that detect Singleton services resolving Scoped dependencies at compile time.'
        },
        {
            question: 'How do you register multiple implementations of the same interface? What are keyed services?',
            difficulty: 'advanced',
            answer: `<p>.NET 8 introduced <strong>keyed services</strong> — resolving specific implementations by a string/enum key. Before .NET 8, you used factories, named options, or third-party containers (Autofac). Keyed services solve the "multiple implementations" problem natively.</p>`,
            code: `// .NET 8 Keyed Services:
builder.Services.AddKeyedScoped<IPaymentProcessor, StripeProcessor>("stripe");
builder.Services.AddKeyedScoped<IPaymentProcessor, PayPalProcessor>("paypal");
builder.Services.AddKeyedScoped<IPaymentProcessor, ApplePayProcessor>("applepay");

// Injection with [FromKeyedServices] attribute:
public class CheckoutService(
    [FromKeyedServices("stripe")] IPaymentProcessor stripe,
    [FromKeyedServices("paypal")] IPaymentProcessor paypal)
{
    public Task ProcessAsync(string method, decimal amount) =>
        method switch
        {
            "stripe" => stripe.ChargeAsync(amount),
            "paypal" => paypal.ChargeAsync(amount),
            _ => throw new NotSupportedException()
        };
}

// Alternative: Resolve all implementations (IEnumerable<T>)
builder.Services.AddScoped<INotificationSender, EmailSender>();
builder.Services.AddScoped<INotificationSender, SmsSender>();
builder.Services.AddScoped<INotificationSender, PushSender>();

public class BroadcastService(IEnumerable<INotificationSender> senders)
{
    public async Task NotifyAllAsync(string message)
    {
        // Iterates ALL registered implementations
        foreach (var sender in senders)
            await sender.SendAsync(message);
    }
}

// Factory pattern (pre-.NET 8 approach, still useful)
builder.Services.AddScoped<Func<string, IPaymentProcessor>>(sp => key => key switch
{
    "stripe" => sp.GetRequiredService<StripeProcessor>(),
    "paypal" => sp.GetRequiredService<PayPalProcessor>(),
    _ => throw new ArgumentException($"Unknown payment: {key}")
});

// Strategy pattern with DI
builder.Services.AddScoped<IDiscountStrategy, VolumeDiscount>();
builder.Services.AddScoped<IDiscountStrategy, LoyaltyDiscount>();
builder.Services.AddScoped<IDiscountStrategy, SeasonalDiscount>();

public class PricingEngine(IEnumerable<IDiscountStrategy> strategies)
{
    public decimal CalculateDiscount(Order order) =>
        strategies.Sum(s => s.Calculate(order));
}`,
            language: 'csharp',
            bestPractices: [
                'Use keyed services (.NET 8+) for selecting specific implementations by key',
                'Use IEnumerable<T> injection when ALL implementations should run (chain of responsibility)',
                'Use factory delegates when selection logic is complex or runtime-dependent',
                'Register concrete types alongside interface registrations when needed for keyed access'
            ],
            commonMistakes: [
                'Registering multiple implementations and expecting only one to resolve (last wins)',
                'Using service locator (GetService<T>) instead of proper keyed injection',
                'Not realizing IEnumerable<T> gives ALL registrations in order',
                'Forgetting that without keyed services, GetService<T> returns the LAST registration'
            ],
            interviewTip: 'Show the evolution: before .NET 8, multiple implementations required factory delegates or Autofac. .NET 8 keyed services solve this natively. Demonstrate both IEnumerable<T> (run all) and keyed (select one) patterns.',
            followUp: ['How does IEnumerable<T> injection order work?', 'What is the difference between keyed services and named services?', 'When would you still need Autofac over the built-in container?'],
            seniorPerspective: 'I use keyed services for plugin-style architectures (payment processors, notification channels) where the selection is configuration-driven. IEnumerable<T> works great for validation pipelines where all validators must run.',
            architectPerspective: 'Multiple implementation patterns enable open/closed design: adding a new payment processor means adding one class and one DI registration — no existing code changes. This is how we scale teams: each team owns their implementation behind a shared interface.'
        },
        {
            question: 'What is the difference between IOptions<T>, IOptionsSnapshot<T>, and IOptionsMonitor<T>?',
            difficulty: 'medium',
            answer: `<p>The Options pattern provides typed access to configuration with three interfaces that differ in lifetime and reload behavior:</p>
            <ul>
                <li><code>IOptions&lt;T&gt;</code> — Singleton. Reads config once at startup. Never refreshes.</li>
                <li><code>IOptionsSnapshot&lt;T&gt;</code> — Scoped. Re-reads config per request. Safe for Scoped services.</li>
                <li><code>IOptionsMonitor&lt;T&gt;</code> — Singleton. Supports real-time change notifications. Safe for Singleton services.</li>
            </ul>`,
            code: `// Configuration in appsettings.json:
// { "Smtp": { "Host": "smtp.example.com", "Port": 587 } }

// Options class:
public class SmtpOptions
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public string? Username { get; set; }
}

// Registration:
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));

// IOptions<T> — Singleton, reads ONCE
public class EmailService(IOptions<SmtpOptions> options)
{
    private readonly SmtpOptions _config = options.Value; // Read once, cached forever
    // If appsettings.json changes at runtime: NOT reflected here!
}

// IOptionsSnapshot<T> — Scoped, re-reads per request
public class EmailService(IOptionsSnapshot<SmtpOptions> options)
{
    public void Send()
    {
        var config = options.Value; // Fresh value per request
        // If appsettings.json changes: reflected on NEXT request
    }
}

// IOptionsMonitor<T> — Singleton, live notifications
public class EmailService(IOptionsMonitor<SmtpOptions> monitor)
{
    public void Send()
    {
        var config = monitor.CurrentValue; // Always current
    }

    // React to changes:
    public EmailService(IOptionsMonitor<SmtpOptions> monitor)
    {
        monitor.OnChange(newConfig =>
        {
            _logger.LogInformation("SMTP config changed: {Host}", newConfig.Host);
            // Reconnect, re-initialize, etc.
        });
    }
}

// Decision guide:
// Singleton service → use IOptions<T> or IOptionsMonitor<T>
// Scoped service    → use IOptionsSnapshot<T>
// Need live reload  → use IOptionsMonitor<T>
// Simple, startup   → use IOptions<T>`,
            language: 'csharp',
            bestPractices: [
                'Use IOptions<T> for config that never changes at runtime',
                'Use IOptionsSnapshot<T> in Scoped services for per-request fresh config',
                'Use IOptionsMonitor<T> in Singleton services that need live reload',
                'Add validation with ValidateDataAnnotations() or ValidateOnStart()'
            ],
            commonMistakes: [
                'Using IOptionsSnapshot in a Singleton (fails: Scoped inside Singleton)',
                'Expecting IOptions to reflect runtime config changes (it does not)',
                'Not validating options at startup (invalid config discovered only when used)',
                'Forgetting that IOptionsMonitor.OnChange fires on file change — handle exceptions!'
            ],
            interviewTip: 'Map lifetime to options interface: Singleton→IOptions/IOptionsMonitor, Scoped→IOptionsSnapshot. The key insight: IOptionsSnapshot is Scoped, so it cannot be injected into Singleton services (captive dependency again!).',
            followUp: ['How do you validate options at startup?', 'What is IConfigureOptions<T>?', 'How do named options work?'],
            seniorPerspective: 'I always add .ValidateDataAnnotations().ValidateOnStart() to catch misconfiguration at deploy time rather than when the first request hits the broken code path.',
            architectPerspective: 'In feature-flag systems, IOptionsMonitor enables real-time configuration changes without redeployment. Combined with Azure App Configuration or Consul, it enables dynamic feature toggles across a fleet of services.'
        },
        {
            question: 'How does the .NET DI container dispose services, and what are the disposal pitfalls per lifetime?',
            difficulty: 'advanced',
            answer: `<p>The container <strong>tracks and disposes only the disposable instances it creates</strong>. <strong>Scoped and transient</strong> disposables created within a scope are disposed when that <strong>scope</strong> is disposed (e.g., end of an HTTP request). <strong>Singletons</strong> are disposed when the <strong>root container</strong> is disposed (app shutdown). The dangerous case is <strong>transient disposables resolved from the root provider</strong>, which the container holds until shutdown — a slow leak.</p>`,
            explanation: `The container is a responsible host: it cleans up the dishes it handed out, when the party (scope) ends. But if you keep asking the host directly for disposable dishes at the front door (root), the host stacks them up until the building closes for good.`,
            code: `// Container disposes ONLY what it creates:
services.AddScoped<DbConnectionHolder>();   // disposed at end of scope
services.AddSingleton<CacheClient>();       // disposed at app shutdown
services.AddTransient<TempBuffer>();        // disposed with its owning scope

// HTTP request -> a scope is created and disposed automatically:
using (var scope = provider.CreateScope())
{
    var holder = scope.ServiceProvider.GetRequiredService<DbConnectionHolder>();
    // ... use holder ...
} // scope.Dispose() -> holder.Dispose() called here

// PITFALL 1: transient IDisposable from the ROOT provider -> held until shutdown
var rootProvider = services.BuildServiceProvider();
for (int i = 0; i < 100_000; i++)
    rootProvider.GetRequiredService<TempBuffer>(); // each one captured -> LEAK
// Fix: resolve transient disposables inside a scope, not from the root

// PITFALL 2: instances YOU construct are NOT tracked
services.AddSingleton(new HttpClient()); // YOU made it -> container won't dispose it
// Better: let the container build it so it owns disposal:
services.AddSingleton<MyClient>();        // container disposes MyClient at shutdown

// PITFALL 3: captured disposables in long-lived singletons
// Use IServiceScopeFactory to create/dispose a scope per unit of work:
public class Worker(IServiceScopeFactory factory)
{
    public async Task RunAsync()
    {
        using var scope = factory.CreateScope();
        var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        await uow.CommitAsync();   // uow disposed when scope is disposed
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Resolve transient/scoped disposables inside an explicit scope, never from the root',
                'Let the container construct services so it owns their disposal',
                'Use IServiceScopeFactory in singletons and background services for per-operation scopes',
                'Implement IAsyncDisposable for services that need async cleanup'
            ],
            commonMistakes: [
                'Resolving transient disposables from the root provider (held until shutdown)',
                'Registering a pre-built instance and expecting the container to dispose it',
                'Disposing services manually that the container already owns (double dispose)',
                'Forgetting that the container does not dispose instances it did not create'
            ],
            interviewTip: 'The core rule: the container disposes what it creates, tied to the scope that created it. The classic leak is transient disposables pulled from the root provider — they accumulate for the entire application lifetime.',
            followUp: ['Why are root-resolved transients not collected?', 'How does IAsyncDisposable integrate with DI?', 'When does the request scope get disposed in ASP.NET Core?'],
            seniorPerspective: `A subtle production leak I have chased was transient disposables resolved from the root provider in a background loop. They were never released until shutdown. The fix is always a per-iteration scope via IServiceScopeFactory.`,
            architectPerspective: `Disposal semantics shape resource safety across a service. We standardize on scope-per-unit-of-work in workers and message consumers so connections, contexts, and buffers are released deterministically rather than lingering on a singleton.`
        },
        {
            question: 'Why is constructor injection preferred, and what is the service locator anti-pattern?',
            difficulty: 'medium',
            answer: `<p><strong>Constructor injection</strong> makes dependencies <strong>explicit, required, and immutable</strong> — they appear in the signature, the object cannot be built without them, and they can be stored in <code>readonly</code> fields. The <strong>service locator anti-pattern</strong> hides dependencies by pulling them from a container (<code>IServiceProvider.GetService</code>) inside the class, making the type dishonest about what it needs and hard to test.</p>`,
            explanation: `Constructor injection is a recipe listing every ingredient up front, so you know exactly what to buy. A service locator is a recipe that just says "grab whatever you need from the pantry mid-cook" — you only discover a missing ingredient when the dish fails.`,
            code: `// PREFERRED: constructor injection -> dependencies are explicit and verifiable
public class OrderService
{
    private readonly IOrderRepository _repo;
    private readonly ILogger<OrderService> _logger;

    public OrderService(IOrderRepository repo, ILogger<OrderService> logger)
    {
        _repo = repo;       // required, immutable, obvious from the signature
        _logger = logger;
    }
}
// Easy to test: new OrderService(mockRepo, mockLogger)

// ANTI-PATTERN: service locator -> hidden, runtime-resolved dependencies
public class BadOrderService
{
    private readonly IServiceProvider _sp;
    public BadOrderService(IServiceProvider sp) => _sp = sp; // hides everything

    public void Place(Order o)
    {
        // Dependencies invisible to callers and tests; failures surface at runtime
        var repo = _sp.GetRequiredService<IOrderRepository>();
        repo.Save(o);
    }
}

// Why constructor injection wins:
// - Compile-time + startup validation (ValidateOnBuild) of the graph
// - Honest API: the constructor documents required collaborators
// - Trivial unit testing: pass fakes directly, no container needed
// - readonly fields guarantee dependencies cannot change after construction

// Legitimate exceptions: factory delegates, or IServiceScopeFactory in
// singletons/background services that genuinely need per-operation scopes.`,
            language: 'csharp',
            bestPractices: [
                'Use constructor injection and store dependencies in readonly fields',
                'Keep constructors free of work; only assign dependencies',
                'Enable ValidateOnBuild to verify the dependency graph at startup',
                'Reserve IServiceProvider/IServiceScopeFactory for factories and scope creation only'
            ],
            commonMistakes: [
                'Injecting IServiceProvider and resolving dependencies inside methods',
                'Property injection that leaves objects in a half-constructed state',
                'Constructors that perform I/O or heavy work instead of just wiring',
                'Over-injection: a huge constructor signaling a class doing too much'
            ],
            interviewTip: 'Name the anti-pattern explicitly (service locator) and explain WHY it is bad: it hides dependencies, defeats startup validation, and makes testing painful. Note that injecting IServiceProvider is the usual tell.',
            followUp: ['When is injecting IServiceProvider acceptable?', 'What does a large constructor signature indicate?', 'How does ValidateOnBuild catch graph errors?'],
            seniorPerspective: `A constructor with eight dependencies is not a DI problem — it is a single-responsibility problem. I treat constructor bloat as a refactoring signal, not a reason to hide dependencies behind a service locator.`,
            architectPerspective: `Explicit constructor injection keeps the dependency graph analyzable, which lets us validate it at startup and reason about coupling across modules. Service-locator usage erodes that, turning a verifiable graph into runtime surprises.`
        },
        {
            question: 'What is the captive dependency problem (scoped service injected into a singleton), and how do you detect and prevent it?',
            difficulty: 'hard',
            answer: `<p>A <strong>captive dependency</strong> occurs when a shorter-lived service (scoped or transient) is injected into a longer-lived service (singleton). The shorter-lived service is "captured" and held alive for the singleton's entire lifetime, violating its intended lifecycle.</p>
            <p>Consequences:</p>
            <ul>
                <li><strong>Scoped in singleton</strong> \u2014 A single DbContext instance is shared across ALL requests for the app's lifetime. This causes stale data, connection pool exhaustion, and thread-safety violations (DbContext is not thread-safe).</li>
                <li><strong>Transient in singleton</strong> \u2014 A single instance of a "supposedly fresh each time" service is reused forever. Less dangerous but still violates intent.</li>
            </ul>
            <p>Detection and prevention:</p>
            <ul>
                <li><code>ValidateScopes = true</code> (Development) \u2014 throws at resolution time if a scoped service is resolved from the root provider</li>
                <li><code>ValidateOnBuild = true</code> \u2014 validates the entire DI graph at startup, catching mismatches before any request</li>
                <li>Code review: any singleton constructor with a scoped dependency is a bug</li>
            </ul>`,
            explanation: 'A captive dependency is like hiring a day-laborer (scoped DbContext) and accidentally putting them on a permanent contract (singleton). They were meant to start fresh each day, but now they are stuck forever, carrying stale data into every request.',
            code: `// THE BUG: Scoped DbContext captured in a singleton
builder.Services.AddDbContext<AppDbContext>(); // scoped by default
builder.Services.AddSingleton<CacheWarmer>(); // singleton

public class CacheWarmer // lives forever
{
    private readonly AppDbContext _db; // CAPTURED! Same instance for all requests
    public CacheWarmer(AppDbContext db) => _db = db; // BUG!
    // _db is now a stale, never-disposed, thread-unsafe DbContext
}

// DETECTION: Enable scope validation
builder.Host.UseDefaultServiceProvider(options =>
{
    options.ValidateScopes = true;   // throws on scoped-from-root resolution
    options.ValidateOnBuild = true;  // validates entire graph at startup
});
// With ValidateOnBuild, the app CRASHES at startup with:
// "Cannot consume scoped service 'AppDbContext' from singleton 'CacheWarmer'"

// FIX 1: Inject IServiceScopeFactory and create scopes manually
public class CacheWarmer
{
    private readonly IServiceScopeFactory _scopeFactory;
    public CacheWarmer(IServiceScopeFactory scopeFactory)
        => _scopeFactory = scopeFactory;

    public async Task WarmCacheAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // Fresh DbContext, properly scoped, disposed at end of using
        var data = await db.Products.ToListAsync();
    }
}

// FIX 2: Inject a factory delegate
builder.Services.AddSingleton<CacheWarmer>();
builder.Services.AddScoped<AppDbContext>();
builder.Services.AddSingleton<Func<AppDbContext>>(sp =>
    () => sp.CreateScope().ServiceProvider.GetRequiredService<AppDbContext>());

// FIX 3: Use IDbContextFactory<T> (.NET 5+ EF Core pattern)
builder.Services.AddDbContextFactory<AppDbContext>();
public class CacheWarmer(IDbContextFactory<AppDbContext> factory)
{
    public async Task WarmAsync()
    {
        await using var db = await factory.CreateDbContextAsync();
        // Fresh, short-lived DbContext
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Always enable ValidateScopes and ValidateOnBuild in Development environment',
                'Use IServiceScopeFactory in singletons to create proper scopes for scoped dependencies',
                'Use IDbContextFactory<T> for DbContext access in singletons and background services',
                'Run ValidateOnBuild in CI/CD pipeline to catch captive dependencies before deployment',
                'Document service lifetimes in registration code with comments'
            ],
            commonMistakes: [
                'Injecting a scoped service (DbContext, HttpContext accessor) into a singleton directly',
                'Disabling ValidateScopes in production because it "throws errors" (hiding the real bug)',
                'Not testing with ValidateOnBuild enabled (graph issues hide until runtime under load)',
                'Using IServiceProvider.GetService() in a singleton without creating a scope first'
            ],
            interviewTip: 'Name the problem precisely (captive dependency), explain the consequence (scoped service lives as a singleton), show the fix (IServiceScopeFactory), and mention the detection mechanism (ValidateScopes/ValidateOnBuild). This demonstrates production awareness.',
            followUp: ['What is the difference between ValidateScopes and ValidateOnBuild?', 'Why is DbContext not thread-safe?', 'Can you have a transient captured in a scoped service?']
        },
        {
            question: 'Explain keyed services in .NET 8. What problem do they solve, and when would you use them instead of named options or factories?',
            difficulty: 'hard',
            answer: `<p><strong>Keyed services</strong> (.NET 8) allow registering multiple implementations of the same interface, distinguished by a <strong>key</strong> (string, enum, or any object). You resolve the specific implementation you need using <code>[FromKeyedServices("key")]</code> attribute or <code>IServiceProvider.GetRequiredKeyedService&lt;T&gt;(key)</code>.</p>
            <p>Problem they solve: before .NET 8, registering multiple implementations of the same interface required workarounds like:</p>
            <ul>
                <li>Factory pattern with a switch statement</li>
                <li>Func&lt;string, IService&gt; delegates</li>
                <li>Named registrations in third-party DI containers (Autofac, etc.)</li>
            </ul>
            <p>Keyed services provide first-class support in the built-in container, eliminating these workarounds. They are ideal for: multiple notification channels, storage providers, payment gateways, or any scenario where you have multiple implementations selected at design time by a known key.</p>`,
            explanation: 'Before keyed services, having two implementations of INotifier was like having two plumbers in the phonebook under "plumber" \u2014 you could not specify which one to call. Keyed services add names: "plumber-joe" and "plumber-sarah" so you can request exactly who you need.',
            code: `// REGISTRATION with keys (.NET 8):
builder.Services.AddKeyedSingleton<INotificationService, EmailNotifier>("email");
builder.Services.AddKeyedSingleton<INotificationService, SmsNotifier>("sms");
builder.Services.AddKeyedSingleton<INotificationService, PushNotifier>("push");

// INJECTION via attribute:
public class OrderService
{
    private readonly INotificationService _email;
    private readonly INotificationService _sms;

    public OrderService(
        [FromKeyedServices("email")] INotificationService email,
        [FromKeyedServices("sms")] INotificationService sms)
    {
        _email = email;
        _sms = sms;
    }

    public async Task NotifyAsync(Order order)
    {
        await _email.SendAsync(order.CustomerEmail, "Order confirmed");
        if (order.SmsOptIn)
            await _sms.SendAsync(order.CustomerPhone, "Order confirmed");
    }
}

// RESOLUTION via service provider (dynamic selection):
public class NotificationRouter(IServiceProvider sp)
{
    public async Task RouteAsync(string channel, string message)
    {
        var notifier = sp.GetRequiredKeyedService<INotificationService>(channel);
        await notifier.SendAsync(message);
        // channel = "email" | "sms" | "push" -> resolves correct implementation
    }
}

// KEYED SERVICES vs ALTERNATIVES:

// Before .NET 8 (factory workaround):
builder.Services.AddSingleton<Func<string, INotificationService>>(sp => key => key switch
{
    "email" => sp.GetRequiredService<EmailNotifier>(),
    "sms" => sp.GetRequiredService<SmsNotifier>(),
    _ => throw new ArgumentException($"Unknown key: {key}")
});
// Ugly, not validated at startup, loses DI container benefits

// USE KEYED SERVICES WHEN:
// - Multiple implementations of same interface, selected by design-time key
// - The key is known at registration/compile time (not a dynamic runtime lookup)
// - You want proper DI lifetime management per keyed registration

// USE FACTORIES WHEN:
// - Selection logic is complex (not just a key match)
// - Implementation is determined by runtime data (user preference, config)`,
            language: 'csharp',
            bestPractices: [
                'Use keyed services when you have multiple implementations selected by a known key',
                'Prefer enum keys over magic strings for type safety and refactoring support',
                'Register with proper lifetimes per key (email=singleton, dbLogger=scoped)',
                'Use [FromKeyedServices] for constructor injection when the key is static',
                'Use IServiceProvider.GetRequiredKeyedService for dynamic key resolution'
            ],
            commonMistakes: [
                'Using keyed services for dynamic runtime selection where a strategy pattern is clearer',
                'Mixing keyed and non-keyed registrations of the same interface (confusing resolution)',
                'Using string keys without constants (typo-prone, no compile-time safety)',
                'Overusing keyed services when a simple generic type parameter would suffice'
            ],
            interviewTip: 'Show the before (factory/delegate workaround) and after (keyed services). Explain that keyed services are first-class in the built-in container, validated at startup, and properly lifetime-managed. Distinguish from runtime strategy selection.',
            followUp: ['Can keyed services have different lifetimes for the same interface?', 'How do keyed services interact with ValidateOnBuild?', 'When would you still prefer a factory over keyed services?']
        }

    ]
});
