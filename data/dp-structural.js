/* ═══════════════════════════════════════════════════════════════════
   Design Patterns — Structural: Adapter, Decorator, Proxy, Facade, Composite
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('dp-structural', {
    title: 'Structural Design Patterns',
    description: 'Patterns that deal with object composition — Adapter, Decorator, Proxy, Facade, Composite, Bridge, and Flyweight — with modern C# implementations and real-world .NET examples.',
    sections: [
        {
            title: 'Adapter Pattern',
            content: `<p>The <strong>Adapter</strong> converts one interface into another that clients expect. It allows incompatible interfaces to work together — commonly used to integrate third-party libraries or legacy code without modifying existing interfaces.</p>`,
            mermaid: `classDiagram
    class IPaymentGateway {
        <<interface>>
        +ChargeAsync(customerId, amount, currency) Task~PaymentResult~
    }
    class StripePaymentAdapter {
        -StripeClient stripe
        +ChargeAsync(customerId, amount, currency) Task~PaymentResult~
    }
    class PayPalPaymentAdapter {
        -PayPalSDK paypal
        +ChargeAsync(customerId, amount, currency) Task~PaymentResult~
    }
    class StripeClient {
        <<third-party>>
        +CreateChargeAsync(StripeChargeRequest) Task~StripeCharge~
    }
    class PayPalSDK {
        <<third-party>>
        +ExecutePayment(PayPalRequest) PayPalResponse
    }
    IPaymentGateway <|.. StripePaymentAdapter : implements
    IPaymentGateway <|.. PayPalPaymentAdapter : implements
    StripePaymentAdapter --> StripeClient : adapts
    PayPalPaymentAdapter --> PayPalSDK : adapts
    note for IPaymentGateway "YOUR interface.\nAdapters translate\nthird-party APIs to it."`,
            code: `// Your application expects this interface:
public interface IPaymentGateway
{
    Task<PaymentResult> ChargeAsync(string customerId, decimal amount, string currency);
}

// Third-party SDK has an incompatible interface:
public class StripeClient  // You don't own this code
{
    public Task<StripeCharge> CreateChargeAsync(StripeChargeRequest request);
}

// ADAPTER — bridges the gap:
public class StripePaymentAdapter : IPaymentGateway
{
    private readonly StripeClient _stripe;
    private readonly ILogger<StripePaymentAdapter> _logger;

    public StripePaymentAdapter(StripeClient stripe, ILogger<StripePaymentAdapter> logger)
    {
        _stripe = stripe;
        _logger = logger;
    }

    public async Task<PaymentResult> ChargeAsync(string customerId, decimal amount, string currency)
    {
        // Translate YOUR model → THEIR model
        var request = new StripeChargeRequest
        {
            CustomerId = customerId,
            AmountInCents = (long)(amount * 100),
            Currency = currency.ToLower(),
            IdempotencyKey = Guid.NewGuid().ToString()
        };

        var charge = await _stripe.CreateChargeAsync(request);

        // Translate THEIR result → YOUR model
        return new PaymentResult
        {
            TransactionId = charge.Id,
            Success = charge.Status == "succeeded",
            ErrorMessage = charge.FailureMessage
        };
    }
}

// DI registration — swap adapters without changing consumers:
services.AddScoped<IPaymentGateway, StripePaymentAdapter>(); // Production
// services.AddScoped<IPaymentGateway, PayPalPaymentAdapter>(); // Alternative
// services.AddScoped<IPaymentGateway, MockPaymentGateway>();   // Testing

// Real .NET examples of Adapter:
// - DbDataAdapter (ADO.NET)
// - IHostedService adapting BackgroundService
// - HttpMessageHandler wrapping different HTTP implementations`,
            language: 'csharp'
        },
        {
            title: 'Decorator Pattern',
            content: `<p>The <strong>Decorator</strong> adds behavior to an object dynamically by wrapping it in another object with the same interface. It follows the Open/Closed Principle — extend behavior without modifying existing code. In .NET, this is the foundation of middleware, logging decorators, and caching wrappers.</p>`,
            mermaid: `classDiagram
    class IOrderService {
        <<interface>>
        +GetByIdAsync(id) Task~OrderDto~
        +CreateAsync(request) Task~OrderDto~
    }
    class OrderService {
        +GetByIdAsync(id) Task~OrderDto~
        +CreateAsync(request) Task~OrderDto~
    }
    class CachingOrderService {
        -IOrderService inner
        -IMemoryCache cache
        +GetByIdAsync(id) Task~OrderDto~
        +CreateAsync(request) Task~OrderDto~
    }
    class LoggingOrderService {
        -IOrderService inner
        -ILogger logger
        +GetByIdAsync(id) Task~OrderDto~
        +CreateAsync(request) Task~OrderDto~
    }
    IOrderService <|.. OrderService
    IOrderService <|.. CachingOrderService
    IOrderService <|.. LoggingOrderService
    LoggingOrderService o-- IOrderService : wraps
    CachingOrderService o-- IOrderService : wraps
    note for LoggingOrderService "Call chain:\nLogging → Caching → OrderService\n(registered via Scrutor)"`,
            code: `// Base interface
public interface IOrderService
{
    Task<OrderDto> GetByIdAsync(int id, CancellationToken ct);
    Task<OrderDto> CreateAsync(CreateOrderRequest request, CancellationToken ct);
}

// Core implementation
public class OrderService : IOrderService
{
    public async Task<OrderDto> GetByIdAsync(int id, CancellationToken ct) => /* DB access */;
    public async Task<OrderDto> CreateAsync(CreateOrderRequest req, CancellationToken ct) => /* logic */;
}

// DECORATOR 1: Caching
public class CachingOrderService : IOrderService
{
    private readonly IOrderService _inner;
    private readonly IMemoryCache _cache;

    public CachingOrderService(IOrderService inner, IMemoryCache cache)
    {
        _inner = inner;
        _cache = cache;
    }

    public async Task<OrderDto> GetByIdAsync(int id, CancellationToken ct)
    {
        return await _cache.GetOrCreateAsync($"order:{id}",
            async entry => { entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
                             return await _inner.GetByIdAsync(id, ct); });
    }

    public Task<OrderDto> CreateAsync(CreateOrderRequest req, CancellationToken ct)
        => _inner.CreateAsync(req, ct); // No caching for writes
}

// DECORATOR 2: Logging
public class LoggingOrderService : IOrderService
{
    private readonly IOrderService _inner;
    private readonly ILogger<LoggingOrderService> _logger;

    public async Task<OrderDto> GetByIdAsync(int id, CancellationToken ct)
    {
        _logger.LogInformation("Getting order {Id}", id);
        var sw = Stopwatch.StartNew();
        var result = await _inner.GetByIdAsync(id, ct);
        _logger.LogInformation("Got order {Id} in {Elapsed}ms", id, sw.ElapsedMilliseconds);
        return result;
    }
}

// Registration with Scrutor — stacks decorators:
services.AddScoped<IOrderService, OrderService>();
services.Decorate<IOrderService, CachingOrderService>();  // Wraps OrderService
services.Decorate<IOrderService, LoggingOrderService>();  // Wraps CachingOrderService
// Call chain: Logging → Caching → OrderService`,
            language: 'csharp',
            callout: { type: 'info', title: 'Decorator in .NET', text: 'ASP.NET Core middleware IS the decorator pattern — each middleware wraps the next. HttpClient DelegatingHandlers are decorators. Polly resilience policies are decorators. You use this pattern constantly without realizing it.' }
        },
        {
            title: 'Proxy & Facade Patterns',
            content: `<p><strong>Proxy</strong> controls access to an object — adding lazy loading, access control, or remote communication. <strong>Facade</strong> provides a simplified interface to a complex subsystem — reducing coupling between clients and complex internal APIs.</p>`,
            code: `// PROXY — controls access to the real object
// Virtual Proxy (lazy loading):
public class LazyImageProxy : IImage
{
    private readonly string _path;
    private RealImage? _realImage;

    public LazyImageProxy(string path) => _path = path;

    public void Display()
    {
        _realImage ??= new RealImage(_path); // Load only when needed!
        _realImage.Display();
    }
}

// Protection Proxy (access control):
public class SecureOrderServiceProxy : IOrderService
{
    private readonly IOrderService _real;
    private readonly ICurrentUser _user;

    public async Task<OrderDto> GetByIdAsync(int id, CancellationToken ct)
    {
        var order = await _real.GetByIdAsync(id, ct);
        if (order.CustomerId != _user.Id && !_user.IsAdmin)
            throw new ForbiddenException("Cannot access other users' orders");
        return order;
    }
}

// .NET Proxy examples:
// - EF Core lazy loading proxies
// - Castle DynamicProxy (mocking frameworks)
// - gRPC client proxies (remote communication)
// - DispatchProxy (runtime AOP)

// FACADE — simplified interface to complex subsystem
public class OrderFacade
{
    private readonly IInventoryService _inventory;
    private readonly IPaymentService _payment;
    private readonly IShippingService _shipping;
    private readonly INotificationService _notifications;

    // One simple method hides 4 service interactions:
    public async Task<OrderResult> PlaceOrderAsync(PlaceOrderRequest request)
    {
        // Complex orchestration hidden behind simple API
        var stockCheck = await _inventory.CheckAvailabilityAsync(request.Items);
        if (!stockCheck.AllAvailable) return OrderResult.OutOfStock(stockCheck.Missing);

        var payment = await _payment.ChargeAsync(request.PaymentMethod, request.Total);
        if (!payment.Success) return OrderResult.PaymentFailed(payment.Error);

        await _inventory.ReserveAsync(request.Items);
        var shipment = await _shipping.CreateShipmentAsync(request.Address, request.Items);
        await _notifications.SendOrderConfirmationAsync(request.Email, shipment.TrackingId);

        return OrderResult.Success(shipment.TrackingId);
    }
}
// Client only knows about OrderFacade — not the 4 internal services`,
            language: 'csharp'
        },
        {
            title: 'When to Use Which Structural Pattern',
            content: `<p>A quick decision guide for choosing the right structural pattern:</p>`,
            mermaid: `flowchart TD
    A[Need to wrap an object?] --> B{What is the intent?}
    B -->|"Make incompatible interface work"| C[Adapter]
    B -->|"Add behavior dynamically"| D[Decorator]
    B -->|"Control access"| E[Proxy]
    B -->|"Simplify a subsystem"| F[Facade]
    B -->|"Separate abstraction from impl"| G[Bridge]
    B -->|"Tree structure"| H[Composite]
    B -->|"Save memory with shared state"| I[Flyweight]`
        },
        {
            title: 'Best Practices',
            content: `<ul>
<li><strong>Adapter:</strong> Keep thin — only translate interface, never add business logic</li>
<li><strong>Decorator:</strong> Each decorator does one thing. Stack them for composition. Order matters (outermost runs first).</li>
<li><strong>Proxy:</strong> Same interface as the real subject. Client should not know it is talking to a proxy.</li>
<li><strong>Facade:</strong> Simplify, do not expose internals. A facade should reduce cognitive load, not add a layer.</li>
<li><strong>Bridge:</strong> Use when both abstraction and implementation need to vary independently (rare but powerful).</li>
<li><strong>Composite:</strong> Uniform treatment of individual objects and compositions. Nodes and leaves share an interface.</li>
<li><strong>Flyweight:</strong> Only use after profiling confirms memory is the bottleneck. Separate intrinsic (shared) from extrinsic (per-instance) state.</li>
<li><strong>In .NET:</strong> Middleware = Decorator, HttpMessageHandler = Decorator, DispatchProxy = Proxy, Anti-Corruption Layer = Adapter, ICompositeService = Composite.</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>Confusing Adapter/Decorator/Proxy</strong> — All wrap objects, but intents differ: Adapter = compatibility, Decorator = enhance, Proxy = control access</li>
<li><strong>Fat Facades</strong> — A facade that exposes every method of the subsystem is not simplifying anything</li>
<li><strong>Deep Decorator chains</strong> — More than 3-4 stacked decorators become impossible to debug. Consider Pipeline pattern instead.</li>
<li><strong>Flyweight without measurement</strong> — Premature optimization that adds complexity for unmeasured memory savings</li>
<li><strong>Proxy that changes behavior</strong> — A proxy should not alter the core behavior; it controls access (auth, caching, lazy loading)</li>
<li><strong>Bridge overuse</strong> — Adding a Bridge for a single implementation. Only valuable when both axes of variation are real.</li>
<li><strong>Composite with mixed responsibilities</strong> — Leaf and composite nodes should share a genuinely uniform interface</li>
</ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>Intent distinction</strong> — Can you explain WHY Adapter/Decorator/Proxy look similar but solve different problems?</li>
<li><strong>.NET examples</strong> — Cite framework patterns: Stream decorators, DelegatingHandler, DispatchProxy, IComposite</li>
<li><strong>Real usage</strong> — "We used Adapter to integrate a legacy SOAP service into our REST architecture"</li>
<li><strong>Trade-off awareness</strong> — Decorators add indirection; when is the flexibility worth the debugging cost?</li>
<li><strong>Modern alternatives</strong> — Source generators, extension methods, and middleware patterns reduce need for classic structural patterns</li>
</ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li>Structural patterns compose objects/classes to form larger structures while keeping them flexible</li>
<li>Adapter = interface translation; Decorator = behavior enhancement; Proxy = access control; Facade = simplification</li>
<li>In .NET, middleware IS the Decorator pattern, DelegatingHandler IS Decorator, DispatchProxy IS Proxy</li>
<li>Flyweight is a memory optimization — only apply after profiling proves the need</li>
<li>Bridge separates abstraction from implementation when both need to vary independently</li>
<li>Composite enables uniform treatment of trees (file systems, UI hierarchies, org charts)</li>
<li>The distinguishing factor between similar patterns is always INTENT, not structure</li>
</ul>`
        }
    ],
    questions: [
        {"question":"What is the Adapter pattern, and how does it differ from the Facade pattern?","difficulty":"medium","answer":"<p>The <strong>Adapter</strong> pattern converts one interface into another that a client expects, letting incompatible interfaces work together — it wraps a single existing class to match a target interface (e.g., adapting a third-party logger to your ILogger). The <strong>Facade</strong> pattern provides a single simplified interface over a <em>complex subsystem</em> of many classes, hiding its complexity.</p><p>Difference: Adapter changes an interface to match an expectation (usually 1:1, no new behavior); Facade simplifies access to many components (1:many, reducing complexity). Adapter is about compatibility; Facade is about simplification.</p>","explanation":"An Adapter is a travel plug converter — same device, different socket shape. A Facade is a hotel concierge — one friendly desk that shields you from dealing with housekeeping, the kitchen, and maintenance separately.","bestPractices":["Adapter to integrate an incompatible/third-party interface","Facade to simplify a complex subsystem behind one entry point","Keep adapters thin (translation only)"],"commonMistakes":["Confusing Adapter (compatibility) with Facade (simplification)","Adapters that add business logic","Facades that leak subsystem details"],"interviewTip":"Compatibility (Adapter, 1:1) vs simplification (Facade, 1:many) is the clean distinction; give the plug-converter and concierge analogies.","followUp":["How does Adapter relate to an anti-corruption layer?","When does a Facade become a god object?","What is the Decorator pattern by contrast?"]},
        {"question":"What is the Decorator pattern, and why prefer it over subclassing for adding behavior?","difficulty":"medium","answer":"<p>The <strong>Decorator</strong> pattern attaches responsibilities to an object dynamically by wrapping it in objects that share the same interface, each adding behavior before/after delegating to the wrapped instance. You can stack decorators (e.g., a stream wrapped by buffering, then compression, then encryption).</p><p>It beats subclassing because behavior is composed at <strong>runtime</strong> and combinations do not cause a class explosion: with N optional features, subclassing needs a class per combination, while decorators mix and match freely. It follows Open/Closed — add features without modifying the base class.</p>","explanation":"Decorators are like adding layers to a coffee: start with espresso, wrap it with milk, then wrap that with caramel. Each layer adds something without redefining coffee, and you can combine layers freely.","bestPractices":["Compose optional behaviors as stackable decorators","Keep each decorator single-purpose","Program to the shared interface"],"commonMistakes":["Subclass explosion for feature combinations","Decorators that change the interface","Order-dependent decorators without documenting the order"],"interviewTip":"Key win: runtime composition avoids the combinatorial class explosion of subclassing; cite the Stream (buffer/compress/encrypt) example.","followUp":["Where does .NET use decorators (Streams)?","How does middleware relate to Decorator?","How does DI support decorators?"]},
        {
            question: 'Explain the Decorator pattern. How is it used in ASP.NET Core?',
            difficulty: 'medium',
            answer: `<p>The <strong>Decorator</strong> wraps an object with the same interface, adding behavior before/after delegating to the wrapped object. It enables adding responsibilities (logging, caching, validation, retry) without modifying existing classes. In ASP.NET Core, middleware, DelegatingHandlers, and Polly policies are all decorator implementations.</p>`,
            code: `// Decorator structure:
// IService → LoggingDecorator → CachingDecorator → RealService
// Each implements IService and wraps the next

// ASP.NET Core examples of Decorator pattern:

// 1. Middleware (request pipeline):
app.UseExceptionHandler();  // Wraps everything below
app.UseAuthentication();    // Wraps everything below
app.UseAuthorization();     // Wraps everything below
app.MapControllers();       // Innermost — actual handler
// Each middleware decorates the next RequestDelegate

// 2. HttpClient DelegatingHandler:
services.AddHttpClient("Api")
    .AddHttpMessageHandler<AuthTokenHandler>()    // Adds auth header
    .AddHttpMessageHandler<LoggingHandler>()      // Logs requests
    .AddHttpMessageHandler<RetryHandler>();       // Retries on failure
// Each handler wraps the next, decorating the HTTP pipeline

// 3. MediatR Pipeline Behaviors:
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
// Each behavior wraps the next handler, adding cross-cutting logic

// Benefits over inheritance:
// - Combine behaviors at runtime (Logging + Caching + Retry)
// - Each decorator has single responsibility
// - Add/remove behaviors via DI configuration, not code changes
// - Open/Closed principle: extend without modifying existing code`,
            language: 'csharp',
            bestPractices: [
                'Use Scrutor library for easy decorator registration in DI',
                'Keep each decorator focused on one concern (SRP)',
                'Maintain the same interface contract (Liskov Substitution)',
                'Order decorators intentionally (logging outside caching, not inside)'
            ],
            commonMistakes: [
                'Creating deep decorator chains that are hard to debug',
                'Not preserving the interface contract (adding extra behavior that changes semantics)',
                'Using inheritance instead of composition for adding behavior',
                'Forgetting that decorator order matters (outermost runs first/last)'
            ],
            interviewTip: 'Connect Decorator to real .NET examples everyone knows: middleware IS decorators (each wraps next), DelegatingHandler IS a decorator, Polly policies ARE decorators. This shows you see patterns in existing frameworks, not just theory.',
            followUp: ['How does Decorator differ from Proxy?', 'How do you register decorators with DI?', 'What is the MediatR pipeline behavior pattern?'],
            seniorPerspective: 'I use decorators via Scrutor for cross-cutting concerns: services.Decorate<IRepo, CachingRepo>(). It\'s cleaner than AOP frameworks and fully transparent in the DI container. The debugging experience is clear — you can see the chain in the constructor.',
            architectPerspective: 'Decorators are the implementation pattern for the Aspect-Oriented Programming concept without the magic. In large systems, I define standard decorator categories: observability (logging, metrics), resilience (retry, circuit breaker), and security (auth, audit) — applied consistently via DI conventions.'
        },
        {
            question: 'What is the difference between Adapter, Decorator, and Proxy? They all wrap objects.',
            difficulty: 'advanced',
            answer: `<p>All three wrap another object, but their <strong>intent</strong> differs:</p>
            <ul>
                <li><strong>Adapter</strong> — changes interface (makes incompatible things work together)</li>
                <li><strong>Decorator</strong> — adds behavior (same interface, enhanced functionality)</li>
                <li><strong>Proxy</strong> — controls access (same interface, guards or intercepts)</li>
            </ul>`,
            code: `// ADAPTER — different interface in, same interface out
// "I speak English, they speak French, adapter translates"
public interface IOurPayment { Task<OurResult> PayAsync(decimal amount); }
public class StripeAdapter : IOurPayment  // Adapts Stripe's different API
{
    private readonly StripeSDK _stripe;
    public async Task<OurResult> PayAsync(decimal amount)
    {
        var stripeResult = await _stripe.CreateCharge(new { amount_cents = (int)(amount * 100) });
        return new OurResult(stripeResult.id, stripeResult.paid);  // TRANSLATES
    }
}

// DECORATOR — same interface, extra behavior layered on
// "Same door, but now it logs who enters"
public interface IUserService { Task<User> GetAsync(int id); }
public class CachingUserService : IUserService  // SAME interface
{
    private readonly IUserService _inner;        // Wraps real service
    public async Task<User> GetAsync(int id)
    {
        if (_cache.TryGet(id, out var u)) return u;
        var user = await _inner.GetAsync(id);   // DELEGATES to inner
        _cache.Set(id, user);                   // ADDS caching behavior
        return user;
    }
}

// PROXY — same interface, controls access
// "Same door, but with a security guard"
public class AuthorizedUserService : IUserService  // SAME interface
{
    private readonly IUserService _real;
    public async Task<User> GetAsync(int id)
    {
        if (!_currentUser.CanViewUser(id))       // CONTROLS access
            throw new ForbiddenException();
        return await _real.GetAsync(id);         // DELEGATES if allowed
    }
}

// Summary:
// Adapter:   wraps X, exposes Y    (interface TRANSLATION)
// Decorator:  wraps X, exposes X+  (interface ENHANCEMENT)
// Proxy:      wraps X, exposes X   (interface PROTECTION/CONTROL)

// Quick test: "Does it change the interface?"
// Yes → Adapter. No → "Does it add behavior or control access?"
// Adds behavior → Decorator. Controls access → Proxy.`,
            language: 'csharp',
            bestPractices: [
                'Choose based on INTENT, not structure (all wrap, different purposes)',
                'Adapter: when integrating external/legacy code with different interface',
                'Decorator: when adding cross-cutting concerns (logging, caching, retry)',
                'Proxy: when controlling access (auth, lazy loading, remote calls)'
            ],
            commonMistakes: [
                'Calling everything a "wrapper" without distinguishing the intent',
                'Using inheritance when Decorator composition would be more flexible',
                'Creating an Adapter when you could define the interface to match in the first place',
                'Conflating Proxy with Decorator (proxy controls access, decorator adds behavior)'
            ],
            interviewTip: 'The distinguishing factor is INTENT, not structure. All three wrap an object. Adapter = translate interface, Decorator = enhance behavior, Proxy = control access. Give one concrete .NET example for each to prove understanding.',
            followUp: ['Can a class be both Adapter and Decorator?', 'How does Bridge differ from Adapter?', 'What is the DispatchProxy in .NET?'],
            seniorPerspective: 'In practice, these blend: an HTTP client wrapper might adapt the API (Adapter), add retry (Decorator), and check auth (Proxy) in one class. Understanding the conceptual distinction helps you name things clearly and explain design decisions to the team.',
            architectPerspective: 'At the system level: API gateways are Facades, anti-corruption layers are Adapters, sidecar proxies (Envoy) are Proxies, and middleware pipelines are Decorator chains. Recognizing patterns in infrastructure helps communicate architecture to developers using a shared vocabulary.'
        },
        {
            question: 'What is the Facade pattern and how is it used in .NET applications?',
            difficulty: 'easy',
            answer: `<p>The <strong>Facade</strong> provides a simplified, unified interface to a complex subsystem. Clients interact with one class instead of many. In .NET: <code>HttpClient</code> is a facade over HTTP connection management, <code>IHost</code> facades DI + config + logging, and application services are facades over domain operations.</p>`,
            mermaid: `flowchart TB
    Client["Controller / Client Code"]
    Facade["OrderFacade<br/>(simple API)"]
    
    subgraph Subsystem["Complex Subsystem (hidden)"]
        Inv["Inventory Service"]
        Pay["Payment Service"]
        Ship["Shipping Service"]
        Notif["Notification Service"]
        Tax["Tax Calculator"]
    end
    
    Client -->|"PlaceOrder(request)"| Facade
    Facade --> Inv
    Facade --> Pay
    Facade --> Ship
    Facade --> Notif
    Facade --> Tax
    
    style Facade fill:#4f46e5,color:#fff
    style Subsystem fill:#f1f5f9,color:#1e293b`,
            code: `// Facade — simplifies complex multi-service orchestration
public class OrderFacade
{
    private readonly IInventoryService _inventory;
    private readonly IPaymentService _payment;
    private readonly IShippingService _shipping;
    private readonly INotificationService _notifications;
    private readonly ITaxService _tax;

    // Client calls ONE method instead of orchestrating 5 services
    public async Task<OrderResult> PlaceOrderAsync(PlaceOrderRequest request)
    {
        // Complex workflow hidden behind simple API:
        var stock = await _inventory.CheckAsync(request.Items);
        if (!stock.Available) return OrderResult.OutOfStock();

        var tax = await _tax.CalculateAsync(request.Items, request.Address);
        var total = request.Subtotal + tax;

        var payment = await _payment.ChargeAsync(request.PaymentMethod, total);
        if (!payment.Success) return OrderResult.PaymentFailed();

        await _inventory.ReserveAsync(request.Items);
        var shipment = await _shipping.CreateAsync(request.Address, request.Items);
        await _notifications.SendConfirmationAsync(request.Email);

        return OrderResult.Success(shipment.TrackingId);
    }
}

// .NET Framework examples of Facade:
// HttpClient — facades DNS, TCP connections, TLS, pooling, retries
// IHost — facades DI, configuration, logging, hosted services
// DbContext — facades connection, command, transaction management`,
            language: 'csharp',
            bestPractices: [
                'Use Facade to simplify complex orchestration workflows',
                'Keep the Facade thin — delegate to specialized services, don\'t add business logic',
                'Facade is a good place for transaction boundaries (all succeed or all fail)',
                'Consider whether Facade methods should be idempotent (retry-safe)'
            ],
            commonMistakes: [
                'Making Facade a god class with business logic (should only orchestrate)',
                'Hiding too much — sometimes clients need access to subsystem details',
                'Not considering failure modes (what if step 3 of 5 fails? Compensate?)',
                'Creating a Facade per entity instead of per use case (too granular)'
            ],
            interviewTip: 'Facade is the simplest GoF pattern but appears everywhere. Show you recognize it in frameworks: HttpClient, IHost, DbContext are all facades. Then explain when YOU create facades: to encapsulate multi-service orchestration behind a clean API for controllers.',
            followUp: ['How does Facade differ from Service Layer?', 'When should a Facade be decomposed into smaller classes?', 'How do you handle errors in a multi-step Facade method?'],
            seniorPerspective: 'I create Application Service classes that are essentially Facades — they orchestrate domain operations and infrastructure calls behind a simple command/query interface. Controllers call the facade; the facade coordinates the complexity.',
            architectPerspective: 'At the system level, API Gateways are facades: they hide the microservice topology from clients. BFF (Backend for Frontend) is a specialized facade per client type. The pattern scales from class-level to system-level — same intent, different scope.'
        },
        {
            question: 'What is the Bridge pattern and how is it different from the Adapter pattern?',
            difficulty: 'hard',
            answer: `<p>The <strong>Bridge</strong> pattern decouples an abstraction from its implementation so the two can vary independently. You split one inheritance hierarchy into two: the <em>abstraction</em> (what the client uses) and the <em>implementation</em> (how it is done), connected by composition.</p>
            <p><strong>Key difference from Adapter:</strong> Adapter is applied <em>after</em> the fact to make incompatible interfaces work together (reactive). Bridge is designed <em>up front</em> to prevent a combinatorial class explosion (proactive). Adapter changes an interface; Bridge separates two dimensions of variation.</p>`,
            explanation: 'Bridge is like a TV remote and the TV. Remotes (abstraction) and TV brands (implementation) vary independently — any remote design can work with any TV via a shared signal contract. Without the bridge you would need a unique remote model for every TV brand: a class explosion.',
            code: `// Without Bridge: explosion — Shape x Renderer combinations
// CircleVector, CircleRaster, SquareVector, SquareRaster... (N x M classes)

// Implementation hierarchy (the "how")
public interface IRenderer
{
    void RenderCircle(float radius);
}
public class VectorRenderer : IRenderer
{
    public void RenderCircle(float radius) => Console.WriteLine($"Vector circle r={radius}");
}
public class RasterRenderer : IRenderer
{
    public void RenderCircle(float radius) => Console.WriteLine($"Pixels for circle r={radius}");
}

// Abstraction hierarchy (the "what") — holds a reference to implementation
public abstract class Shape
{
    protected readonly IRenderer Renderer; // the BRIDGE
    protected Shape(IRenderer renderer) => Renderer = renderer;
    public abstract void Draw();
}

public class Circle : Shape
{
    private readonly float _radius;
    public Circle(IRenderer renderer, float radius) : base(renderer) => _radius = radius;
    public override void Draw() => Renderer.RenderCircle(_radius);
}

// Shapes and renderers now vary independently — add either side freely:
new Circle(new VectorRenderer(), 5).Draw();
new Circle(new RasterRenderer(), 5).Draw();
// N shapes + M renderers = N + M classes, not N x M.`,
            language: 'csharp',
            bestPractices: [
                'Use Bridge when you have two independent dimensions of variation',
                'Favor composition over a multiplying inheritance hierarchy',
                'Design the bridge early when you foresee a class explosion',
                'Keep the abstraction interface focused on client needs'
            ],
            commonMistakes: [
                'Confusing Bridge (designed up front) with Adapter (applied after the fact)',
                'Letting the abstraction depend on a concrete implementation class',
                'Using Bridge when there is only one dimension of variation (overkill)',
                'Merging the two hierarchies back together under pressure, recreating the explosion'
            ],
            interviewTip: 'The crisp contrast: Adapter makes existing incompatible things work together (reactive); Bridge prevents a class explosion across two dimensions by design (proactive). Use the Shape x Renderer example to make it concrete.',
            followUp: ['When does Bridge become Strategy?', 'How does Bridge relate to Dependency Inversion?', 'Can Bridge and Abstract Factory be combined?'],
            seniorPerspective: 'In practice Bridge often looks like good dependency injection: the abstraction holds an injected implementation interface. The mental model that helps is "two things that change for different reasons should live in different hierarchies and be wired by composition."',
            architectPerspective: 'Bridge is the structural expression of separating policy from mechanism. At scale it shows up as pluggable backends — the same domain abstraction running over different storage, rendering, or transport implementations selected by configuration.'
        },
        {
            question: 'Explain the Composite pattern. Where does it show up in real .NET code?',
            difficulty: 'medium',
            answer: `<p>The <strong>Composite</strong> pattern lets you treat individual objects (leaves) and compositions of objects (branches) uniformly through a common interface. It models part-whole hierarchies as trees, so client code can operate on a single item or a whole subtree without caring which it is.</p>`,
            explanation: 'Composite is like folders and files. A folder can contain files or other folders, yet you can ask any of them for their total size and get a sensible answer — the folder just sums its children recursively. The client treats one file and a deep folder tree the same way.',
            code: `// Common component interface — leaves and composites both implement it
public interface IFileSystemItem
{
    string Name { get; }
    long GetSize();
}

// Leaf
public class FileItem : IFileSystemItem
{
    public FileItem(string name, long size) { Name = name; _size = size; }
    private readonly long _size;
    public string Name { get; }
    public long GetSize() => _size;
}

// Composite — contains children, delegates recursively
public class FolderItem : IFileSystemItem
{
    private readonly List<IFileSystemItem> _children = new();
    public FolderItem(string name) => Name = name;
    public string Name { get; }
    public void Add(IFileSystemItem item) => _children.Add(item);
    public long GetSize() => _children.Sum(c => c.GetSize()); // uniform call
}

// Client treats leaf and composite identically:
var root = new FolderItem("root");
root.Add(new FileItem("a.txt", 100));
var sub = new FolderItem("docs");
sub.Add(new FileItem("b.txt", 250));
root.Add(sub);
Console.WriteLine(root.GetSize()); // 350 — recursion handled by the tree

// Real .NET examples of Composite:
// - WPF/WinForms control trees (a Panel contains controls or panels)
// - Razor/Blazor render trees
// - Expression trees and the visitor-friendly composite nodes
// - Logical XML/JSON document node hierarchies`,
            language: 'csharp',
            bestPractices: [
                'Define one component interface that both leaves and composites implement',
                'Push child-management methods (Add/Remove) to the composite, not the leaf, when leaves cannot have children',
                'Use recursion in composite operations to traverse the tree',
                'Combine with Visitor when you need many operations over the tree'
            ],
            commonMistakes: [
                'Putting Add/Remove on the shared interface, forcing leaves to implement no-ops or throw',
                'Building cyclic graphs instead of trees (breaks recursive traversal)',
                'Deep recursion causing stack overflow on very deep trees',
                'Type-checking for leaf vs composite in client code (defeats the pattern)'
            ],
            interviewTip: 'Anchor it to something everyone knows: file systems, or UI control trees. The selling point is uniform treatment of one item vs a whole subtree — no client-side type checks.',
            followUp: ['How does Composite pair with the Visitor pattern?', 'Where should Add/Remove live — interface or composite only?', 'How do you avoid stack overflow on deep trees?'],
            seniorPerspective: 'The judgment call is whether child-management belongs on the shared interface. I keep leaves clean by only exposing Add/Remove on composites; client code that needs to add children is already dealing with a container, so it can depend on the composite type.',
            architectPerspective: 'Composite underlies most tree-shaped domain models — org charts, bill-of-materials, nested categories, permission trees. Recognizing it lets you provide one recursive API (sum, search, validate) instead of special-casing every level of the hierarchy.'
        },
        {
            question: 'What is the Flyweight pattern, and when is it worth the added complexity?',
            difficulty: 'advanced',
            answer: `<p>The <strong>Flyweight</strong> pattern minimizes memory use by sharing common, immutable state (the <em>intrinsic</em> state) across many objects, while keeping the per-object, context-dependent state (the <em>extrinsic</em> state) outside the shared instance.</p>
            <p>It is worth the complexity only when you have a <strong>very large number</strong> of objects that share a small set of repeated values, and memory or allocation pressure is a measured problem. Otherwise it is premature optimization.</p>`,
            explanation: 'Flyweight is like a text editor storing each character. Rather than giving every one of a million letter "a"s its own font, glyph, and metrics, all share one immutable "a" definition; only the position (extrinsic) differs per occurrence.',
            code: `// Intrinsic (shared, immutable) state — the flyweight
public sealed class TreeType
{
    public TreeType(string name, string texture) { Name = name; Texture = texture; }
    public string Name { get; }
    public string Texture { get; }
    public void Draw(int x, int y) // extrinsic state passed in
        => Console.WriteLine($"{Name} at ({x},{y})");
}

// Factory caches and shares flyweights
public class TreeTypeFactory
{
    private readonly Dictionary<string, TreeType> _cache = new();
    public TreeType GetType(string name, string texture)
    {
        var key = name + ":" + texture;
        if (!_cache.TryGetValue(key, out var type))
        {
            type = new TreeType(name, texture);
            _cache[key] = type; // reused for every tree of this kind
        }
        return type;
    }
}

// Context objects hold only extrinsic state + a shared flyweight ref
public readonly record struct Tree(int X, int Y, TreeType Type);

// 1,000,000 trees, but only a handful of TreeType instances exist:
var factory = new TreeTypeFactory();
var forest = new List<Tree>();
for (int i = 0; i < 1_000_000; i++)
    forest.Add(new Tree(i % 1000, i / 1000, factory.GetType("Oak", "oak.png")));

// .NET already does this: string interning, char caches, small-int boxing caches.`,
            language: 'csharp',
            bestPractices: [
                'Separate intrinsic (shared) from extrinsic (per-instance) state carefully',
                'Make the shared flyweight immutable so sharing is safe across threads',
                'Use a factory to cache and reuse flyweights',
                'Apply only after profiling proves a memory/allocation problem'
            ],
            commonMistakes: [
                'Sharing mutable state, causing one context to corrupt others',
                'Applying Flyweight prematurely without a measured memory issue',
                'Mixing extrinsic state into the shared object (defeats the savings)',
                'Ignoring that the indirection can hurt cache locality and readability'
            ],
            interviewTip: 'Define intrinsic vs extrinsic state precisely — that distinction is the core of the pattern. Mention real platform examples like string interning to show it is not just textbook theory.',
            followUp: ['How does string interning relate to Flyweight?', 'How do you keep flyweights thread-safe?', 'What is the trade-off with cache locality?'],
            seniorPerspective: 'I treat Flyweight as a performance tool of last resort, reached for only when a profiler shows millions of near-identical objects dominating memory. The readability cost is real, so the win has to be measured, not assumed.',
            architectPerspective: 'Flyweight is the in-memory cousin of deduplication and interning strategies used in data-intensive systems. The same intrinsic/extrinsic split appears in columnar stores and dictionary encoding, where repeated values are stored once and referenced many times.'
        }
    ]
});
