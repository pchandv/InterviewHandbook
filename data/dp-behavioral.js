/* ═══════════════════════════════════════════════════════════════════
   Design Patterns — Behavioral: Strategy, Observer, Mediator, Command
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('dp-behavioral', {
    title: 'Behavioral Design Patterns',
    description: 'Patterns that define communication between objects — Strategy, Observer, Mediator, Command, Chain of Responsibility, State, and Template Method — with modern C# implementations.',
    sections: [
        {
            title: 'Strategy Pattern',
            content: `<p>The <strong>Strategy</strong> pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable. In modern C#, this is often implemented via DI injection of interface implementations or Func delegates.</p>`,
            mermaid: `classDiagram
    class PricingEngine {
        -IEnumerable~IDiscountStrategy~ strategies
        +CalculateFinalPrice(order) decimal
    }
    class IDiscountStrategy {
        <<interface>>
        +Calculate(order) decimal
        +AppliesTo(order) bool
    }
    class VolumeDiscount {
        +Calculate(order) decimal
        +AppliesTo(order) bool
    }
    class LoyaltyDiscount {
        +Calculate(order) decimal
        +AppliesTo(order) bool
    }
    class SeasonalDiscount {
        +Calculate(order) decimal
        +AppliesTo(order) bool
    }
    PricingEngine o-- IDiscountStrategy : uses many
    IDiscountStrategy <|.. VolumeDiscount
    IDiscountStrategy <|.. LoyaltyDiscount
    IDiscountStrategy <|.. SeasonalDiscount
    note for PricingEngine "Open/Closed: add new strategy\nclass + DI registration.\nNo existing code changes."`,
            code: `// Strategy via interface + DI
public interface IDiscountStrategy
{
    decimal Calculate(Order order);
    bool AppliesTo(Order order);
}

public class VolumeDiscount : IDiscountStrategy
{
    public bool AppliesTo(Order order) => order.Items.Count >= 10;
    public decimal Calculate(Order order) => order.Subtotal * 0.15m;
}

public class LoyaltyDiscount : IDiscountStrategy
{
    public bool AppliesTo(Order order) => order.Customer.YearsActive >= 3;
    public decimal Calculate(Order order) => order.Subtotal * 0.10m;
}

public class SeasonalDiscount : IDiscountStrategy
{
    public bool AppliesTo(Order order) => DateTime.Now.Month == 12;
    public decimal Calculate(Order order) => order.Subtotal * 0.20m;
}

// Context: uses strategies via DI
public class PricingEngine
{
    private readonly IEnumerable<IDiscountStrategy> _strategies;

    public PricingEngine(IEnumerable<IDiscountStrategy> strategies)
        => _strategies = strategies;

    public decimal CalculateFinalPrice(Order order)
    {
        var bestDiscount = _strategies
            .Where(s => s.AppliesTo(order))
            .Select(s => s.Calculate(order))
            .DefaultIfEmpty(0m)
            .Max();
        return order.Subtotal - bestDiscount;
    }
}

// Registration — add new strategies without modifying PricingEngine:
services.AddScoped<IDiscountStrategy, VolumeDiscount>();
services.AddScoped<IDiscountStrategy, LoyaltyDiscount>();
services.AddScoped<IDiscountStrategy, SeasonalDiscount>();
// Open/Closed: add new discount = add class + register. No existing code changes.

// Modern alternative: Strategy via Func<> (lightweight)
public class NotificationService
{
    private readonly Dictionary<string, Func<string, Task>> _senders;
    
    public NotificationService()
    {
        _senders = new()
        {
            ["email"] = msg => SendEmailAsync(msg),
            ["sms"] = msg => SendSmsAsync(msg),
            ["push"] = msg => SendPushAsync(msg)
        };
    }

    public Task NotifyAsync(string channel, string message)
        => _senders[channel](message);
}`,
            language: 'csharp'
        },
        {
            title: 'Mediator Pattern (MediatR)',
            content: `<p>The <strong>Mediator</strong> reduces coupling by ensuring objects communicate through a central mediator instead of directly referencing each other. In .NET, <code>MediatR</code> is the standard implementation — decoupling request senders from handlers.</p>`,
            mermaid: `sequenceDiagram
    participant C as Controller
    participant M as IMediator
    participant V as ValidationBehavior
    participant L as LoggingBehavior
    participant H as CreateOrderHandler
    participant DB as Database
    
    C->>M: Send(CreateOrderCommand)
    M->>V: InvokeAsync(command, next)
    V->>V: Validate (FluentValidation)
    V->>L: next() → LoggingBehavior
    L->>L: Log "Processing CreateOrder"
    L->>H: next() → Handler
    H->>DB: SaveOrderAsync()
    DB-->>H: OrderId
    H-->>L: OrderDto result
    L->>L: Log "Completed in 45ms"
    L-->>V: result
    V-->>M: result
    M-->>C: OrderDto`,
            code: `// Without Mediator — controller depends on many services directly:
public class OrderController
{
    private readonly IOrderService _orders;
    private readonly IInventoryService _inventory;
    private readonly IPaymentService _payments;
    private readonly INotificationService _notifications;
    // Constructor with 4+ dependencies = too coupled!
}

// With Mediator — controller sends a request, someone handles it:
public class OrderController : ControllerBase
{
    private readonly IMediator _mediator; // ONE dependency

    [HttpPost]
    public async Task<IActionResult> Create(CreateOrderRequest req)
    {
        var result = await _mediator.Send(new CreateOrderCommand(req));
        return Created(result.Id);
    }
}

// Command + Handler (decoupled from controller):
public record CreateOrderCommand(CreateOrderRequest Request) : IRequest<OrderDto>;

public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, OrderDto>
{
    private readonly IOrderRepository _repo;
    private readonly IPaymentGateway _payment;

    public async Task<OrderDto> Handle(CreateOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.Request);
        await _payment.AuthorizeAsync(order.Total);
        await _repo.SaveAsync(order, ct);
        return order.ToDto();
    }
}

// Notifications (publish to multiple handlers):
public record OrderCreatedNotification(OrderId Id, decimal Total) : INotification;

public class SendEmailHandler : INotificationHandler<OrderCreatedNotification>
{
    public Task Handle(OrderCreatedNotification evt, CancellationToken ct)
        => _email.SendOrderConfirmationAsync(evt.Id);
}

public class UpdateAnalyticsHandler : INotificationHandler<OrderCreatedNotification>
{
    public Task Handle(OrderCreatedNotification evt, CancellationToken ct)
        => _analytics.TrackOrderAsync(evt.Total);
}

// Pipeline Behaviors — cross-cutting concerns (like middleware for commands):
public class ValidationBehavior<TReq, TRes> : IPipelineBehavior<TReq, TRes>
{
    private readonly IEnumerable<IValidator<TReq>> _validators;

    public async Task<TRes> Handle(TReq request, RequestHandlerDelegate<TRes> next, CancellationToken ct)
    {
        var failures = _validators.SelectMany(v => v.Validate(request).Errors);
        if (failures.Any()) throw new ValidationException(failures);
        return await next(); // Continue to actual handler
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Chain of Responsibility & Command',
            content: `<p><strong>Chain of Responsibility</strong> passes a request along a chain of handlers — each decides whether to process it or pass it along. <strong>Command</strong> encapsulates a request as an object, enabling undo/redo, queuing, and logging of operations.</p>`,
            mermaid: `flowchart LR
    Request["Purchase Request<br/>($5,000)"]
    M["Manager<br/>(≤ $1,000)"]
    D["Director<br/>(≤ $10,000)"]
    VP["VP<br/>(≤ $50,000)"]
    CFO["CFO<br/>(≤ $500,000)"]
    
    Request --> M
    M -->|"$5K > $1K<br/>pass along"| D
    D -->|"$5K ≤ $10K<br/>✓ APPROVED"| Approved["✓ Approved<br/>by Director"]
    
    style Approved fill:#dcfce7,color:#166534
    style D fill:#4f46e5,color:#fff`,
            code: `// CHAIN OF RESPONSIBILITY — ASP.NET middleware IS this pattern
// Each handler either processes or passes to next:
public abstract class ApprovalHandler
{
    private ApprovalHandler? _next;
    
    public ApprovalHandler SetNext(ApprovalHandler next)
    {
        _next = next;
        return next;
    }

    public virtual async Task<ApprovalResult> HandleAsync(PurchaseRequest request)
    {
        if (_next is not null) return await _next.HandleAsync(request);
        return ApprovalResult.Rejected("No handler could process this request");
    }
}

public class ManagerApproval : ApprovalHandler
{
    public override async Task<ApprovalResult> HandleAsync(PurchaseRequest request)
    {
        if (request.Amount <= 1000)
            return ApprovalResult.Approved("Manager approved");
        return await base.HandleAsync(request); // Pass to next
    }
}

public class DirectorApproval : ApprovalHandler
{
    public override async Task<ApprovalResult> HandleAsync(PurchaseRequest request)
    {
        if (request.Amount <= 10000)
            return ApprovalResult.Approved("Director approved");
        return await base.HandleAsync(request);
    }
}

// Chain setup:
var chain = new ManagerApproval();
chain.SetNext(new DirectorApproval())
     .SetNext(new VPApproval())
     .SetNext(new CFOApproval());
var result = await chain.HandleAsync(new PurchaseRequest(5000));

// COMMAND pattern — encapsulate action as object
public interface ICommand
{
    Task ExecuteAsync();
    Task UndoAsync();  // Enable undo!
}

public class AddToCartCommand : ICommand
{
    private readonly ICart _cart;
    private readonly Product _product;

    public async Task ExecuteAsync() => await _cart.AddAsync(_product);
    public async Task UndoAsync() => await _cart.RemoveAsync(_product);
}

// Command Queue — execute, undo, replay:
public class CommandHistory
{
    private readonly Stack<ICommand> _history = new();
    
    public async Task ExecuteAsync(ICommand cmd)
    {
        await cmd.ExecuteAsync();
        _history.Push(cmd);
    }
    
    public async Task UndoAsync()
    {
        if (_history.TryPop(out var cmd))
            await cmd.UndoAsync();
    }
}`,
            language: 'csharp'
        },
        {
            title: 'When to Use Which Behavioral Pattern',
            content: `<p>Quick decision guide:</p>`,
            mermaid: `flowchart TD
    A[Need to decouple behavior?] --> B{What kind?}
    B -->|"Swap algorithms at runtime"| C[Strategy]
    B -->|"React to state changes"| D[Observer]
    B -->|"Coordinate communication"| E[Mediator]
    B -->|"Encapsulate action as object"| F[Command]
    B -->|"Object changes behavior by state"| G[State]
    B -->|"Pass request along a chain"| H[Chain of Responsibility]
    B -->|"Add operations to fixed types"| I[Visitor]
    B -->|"Define algorithm skeleton"| J[Template Method]`
        },
        {
            title: 'Best Practices',
            content: `<ul>
<li><strong>Strategy:</strong> Keep strategies stateless. Register all via DI; inject IEnumerable&lt;IStrategy&gt; for dynamic selection.</li>
<li><strong>Observer:</strong> Use weak references or explicit unsubscribe to prevent memory leaks. In .NET prefer events or Rx over manual observer lists.</li>
<li><strong>Mediator:</strong> Keep the mediator thin — it routes, not implements. MediatR Pipeline Behaviors handle cross-cutting concerns.</li>
<li><strong>Command:</strong> Include undo capability. Make commands serializable for queue-based architectures (CQRS).</li>
<li><strong>State:</strong> Each state class handles only its own transitions. The context delegates to the current state object.</li>
<li><strong>Chain of Responsibility:</strong> Each handler decides to process OR pass to next. ASP.NET middleware IS this pattern.</li>
<li><strong>Template Method:</strong> Define the algorithm skeleton in a base class; let subclasses override specific steps.</li>
<li><strong>In .NET:</strong> Middleware = Chain of Responsibility, MediatR = Mediator, IObservable = Observer, Polly = Strategy, State Machine libraries = State.</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>God Mediator:</strong> A mediator that contains business logic instead of just routing — becomes the new God class</li>
<li><strong>Observer memory leaks:</strong> Event handlers that are never unsubscribed keep objects alive in memory (common in WPF/WinForms)</li>
<li><strong>Strategy overkill:</strong> Creating a strategy interface for a single algorithm that will never change</li>
<li><strong>Command without undo:</strong> Implementing Command for CQRS but not thinking about compensating actions</li>
<li><strong>State explosion:</strong> Too many states with complex transitions — consider a state machine library instead of hand-rolling</li>
<li><strong>Chain without termination:</strong> A chain of responsibility that never handles the request (falls off the end silently)</li>
<li><strong>Template Method with too many hooks:</strong> Base class with 10+ abstract methods becomes fragile base class</li>
<li><strong>Mixing patterns unnecessarily:</strong> Using Observer + Mediator + Command together when a simple event would do</li>
</ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>Real .NET mapping:</strong> "Middleware IS Chain of Responsibility, MediatR IS Mediator, IObservable IS Observer"</li>
<li><strong>Strategy + OCP connection:</strong> Adding new behavior = adding a new class, not editing existing ones</li>
<li><strong>Command + CQRS:</strong> Show you understand Commands as first-class objects for audit, undo, and queuing</li>
<li><strong>State vs Strategy:</strong> State changes internally (object transitions); Strategy is injected externally</li>
<li><strong>When NOT to use:</strong> Simple problems don't need patterns. A switch statement is fine for 3 cases.</li>
<li><strong>Practical experience:</strong> "We used Chain of Responsibility for our validation pipeline because..."</li>
</ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li>Behavioral patterns manage algorithms, responsibilities, and communication between objects</li>
<li>Strategy = interchangeable algorithms; Observer = pub/sub notification; Mediator = centralized coordination</li>
<li>Command = encapsulated action (undo, queue, log); State = object behavior changes with internal state</li>
<li>Chain of Responsibility = pass request until handled (middleware); Template Method = skeleton + hooks</li>
<li>Most behavioral patterns are already baked into .NET frameworks (middleware, MediatR, Rx, events)</li>
<li>The key senior insight: recognize patterns in existing code, don't force them onto simple problems</li>
<li>Strategy + DI is the most commonly used behavioral pattern in modern .NET — master it thoroughly</li>
</ul>`
        }
    ],
    questions: [
        {
            question: 'What is the Strategy pattern? How does it relate to DI and the Open/Closed Principle?',
            difficulty: 'medium',
            answer: `<p>The <strong>Strategy</strong> pattern encapsulates a family of interchangeable algorithms behind a common interface. Combined with DI, you inject different strategies at runtime without modifying the consuming class. This directly implements the Open/Closed Principle: the system is open for extension (add new strategies) and closed for modification (existing code unchanged).</p>`,
            code: `// Strategy + DI + Open/Closed in action:

// 1. Define strategy interface
public interface IShippingCalculator
{
    string CarrierName { get; }
    decimal CalculateCost(Package package, Address destination);
}

// 2. Implement strategies (each is independent, testable)
public class FedExCalculator : IShippingCalculator { /* ... */ }
public class UpsCalculator : IShippingCalculator { /* ... */ }
public class DhlCalculator : IShippingCalculator { /* ... */ }

// 3. Context uses strategies — doesn't know concrete types
public class ShippingService
{
    private readonly IEnumerable<IShippingCalculator> _calculators;

    public ShippingQuote GetBestRate(Package pkg, Address dest)
    {
        return _calculators
            .Select(c => new ShippingQuote(c.CarrierName, c.CalculateCost(pkg, dest)))
            .OrderBy(q => q.Cost)
            .First();
    }
}

// 4. Adding a new carrier = ONE new class + ONE DI registration
// services.AddScoped<IShippingCalculator, NewCarrierCalculator>();
// ZERO changes to ShippingService or existing calculators!

// Open/Closed connection:
// OPEN for extension: add new IShippingCalculator implementations
// CLOSED for modification: ShippingService never changes

// Strategy vs if/else:
// BAD: if (carrier == "fedex") ... else if (carrier == "ups") ...
// GOOD: strategies resolve dynamically — no conditionals needed`,
            language: 'csharp',
            bestPractices: [
                'Register all strategies in DI and inject IEnumerable<T> for multi-strategy scenarios',
                'Use keyed services (.NET 8) when you need to select a specific strategy by name',
                'Keep strategies stateless and focused on one algorithm',
                'Define a clear interface that all strategies can implement cleanly'
            ],
            commonMistakes: [
                'Using if/else chains instead of strategies (violates Open/Closed)',
                'Making the context class aware of concrete strategy types',
                'Over-engineering: using Strategy for a single algorithm that will never change',
                'Not leveraging DI for strategy injection (creating strategies manually with new)'
            ],
            interviewTip: 'Connect Strategy to Open/Closed explicitly: "Adding a new algorithm means adding a new class and registering it — zero changes to existing code." Then show the concrete .NET pattern: IEnumerable<IStrategy> injection.',
            followUp: ['How does Strategy differ from Template Method?', 'When would you use a dictionary of Func<> instead?', 'How do keyed services help with strategy selection?'],
            seniorPerspective: 'Strategy + IEnumerable<T> injection is my default pattern for any "there will be multiple ways to do this" scenario: payment processors, notification channels, export formats, validation rules. It scales from 2 to 20 implementations cleanly.',
            architectPerspective: 'At the system level, Strategy pattern enables plugin architectures. Each tenant or customer can have different pricing, shipping, or notification strategies configured via feature flags — runtime behavior changes without deployment.'
        },
        {
            question: 'What is the Mediator pattern and how does MediatR implement it in .NET?',
            difficulty: 'medium',
            answer: `<p>The <strong>Mediator</strong> pattern reduces direct dependencies between objects by routing all communication through a central coordinator. <code>MediatR</code> implements this in .NET: controllers send commands/queries to the mediator, which routes them to the appropriate handler — fully decoupled.</p>`,
            code: `// Without Mediator: Controller → 5 services (high coupling)
// With Mediator: Controller → IMediator → Handler → services

// MediatR patterns:
// 1. Request/Response (one handler returns a result)
public record GetUserQuery(int Id) : IRequest<UserDto>;
// Exactly ONE handler processes this

// 2. Notification (multiple handlers, fire-and-forget)
public record UserRegisteredEvent(int UserId, string Email) : INotification;
// ALL registered handlers process this (email, analytics, audit)

// 3. Pipeline Behaviors (cross-cutting concerns)
// Validation → Logging → Caching → Handler → Logging → back
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(CachingBehavior<,>));

// Benefits:
// 1. Controllers have ONE dependency (IMediator)
// 2. Handlers are independently testable
// 3. Cross-cutting concerns via Pipeline Behaviors (like middleware)
// 4. Each handler follows SRP — one command = one handler
// 5. Easy to add new features (add handler, done)

// Trade-offs:
// - Indirection (harder to "find the code" via F12 navigation)
// - Can be over-applied (simple CRUD doesn't need MediatR)
// - Notification ordering is not guaranteed

// When MediatR adds value:
// - Complex commands with validation + authorization + business logic
// - CQRS (separate command handlers from query handlers)
// - Cross-cutting behaviors needed consistently (logging, validation)

// When MediatR is overkill:
// - Simple CRUD controller that just calls a repository
// - 3-line handlers that just forward to a service (extra indirection)`,
            language: 'csharp',
            bestPractices: [
                'Use Pipeline Behaviors for cross-cutting concerns (validation, logging, caching)',
                'Keep handlers focused — one handler per command/query',
                'Use Notifications for domain events that trigger multiple side effects',
                'Don\'t over-apply: simple operations can call services directly'
            ],
            commonMistakes: [
                'Using MediatR for trivial operations (adds indirection without value)',
                'Fat handlers that do everything (extract domain logic to domain services)',
                'Not using Pipeline Behaviors (manually adding validation in every handler)',
                'Expecting notification handler ordering (it is not guaranteed)'
            ],
            interviewTip: 'Show the pipeline: Controller → IMediator.Send() → ValidationBehavior → LoggingBehavior → Handler → Response. This demonstrates you understand both the pattern AND its practical .NET implementation with cross-cutting concerns.',
            followUp: ['What are Pipeline Behaviors?', 'How do you test MediatR handlers?', 'When is MediatR overkill?'],
            seniorPerspective: 'I use MediatR as the backbone of Clean Architecture applications: commands/queries in the Application layer, handlers orchestrate domain logic. Pipeline Behaviors provide consistent validation and logging without repetitive code in every handler.',
            architectPerspective: 'MediatR provides a seam for architectural enforcement: all business operations flow through Send/Publish, making it trivial to add auditing, rate limiting, or authorization at the pipeline level. It also makes it easy to identify and extract bounded contexts — each group of handlers is a candidate module.'
        },
        {
            question: 'What is the Observer pattern? How do C# events and Reactive Extensions relate to it?',
            difficulty: 'medium',
            answer: `<p>The <strong>Observer</strong> pattern defines a one-to-many dependency: when one object (subject) changes state, all dependents (observers) are notified automatically. In C#, this is implemented via: (1) <code>event</code> keyword (classic), (2) <code>IObservable&lt;T&gt;/IObserver&lt;T&gt;</code> (Reactive Extensions), (3) Domain Events via MediatR notifications.</p>`,
            mermaid: `sequenceDiagram
    participant S as OrderService (Subject)
    participant E as EmailObserver
    participant A as AnalyticsObserver
    participant I as InventoryObserver
    
    S->>S: PlaceOrder()
    S->>E: OnOrderPlaced(event)
    S->>A: OnOrderPlaced(event)
    S->>I: OnOrderPlaced(event)
    E->>E: Send confirmation email
    A->>A: Track conversion
    I->>I: Reserve stock`,
            code: `// Implementation options in C#:

// 1. C# events (classic Observer):
public class OrderService
{
    public event EventHandler<OrderEventArgs>? OrderPlaced;
    
    public void PlaceOrder(Order order)
    {
        // business logic...
        OrderPlaced?.Invoke(this, new OrderEventArgs(order));
    }
}
// Subscribers: orderService.OrderPlaced += OnOrderPlaced;

// 2. MediatR Notifications (modern, DI-friendly):
public record OrderPlacedEvent(Order Order) : INotification;
// Multiple handlers registered in DI — all execute on publish
await _mediator.Publish(new OrderPlacedEvent(order));

// 3. IObservable<T> / Reactive Extensions:
var priceStream = Observable.Interval(TimeSpan.FromSeconds(1))
    .Select(_ => GetCurrentPrice());
priceStream.Subscribe(price => UpdateUI(price));

// When to use which:
// C# events:     simple pub/sub within one class/assembly
// MediatR:       decoupled domain events across application layers
// Rx/Observable: streaming data, complex event processing, UI binding`,
            language: 'csharp',
            bestPractices: [
                'Prefer MediatR notifications over C# events for domain events (DI-friendly, testable)',
                'Use C# events for UI component communication (WPF, WinForms)',
                'Use Reactive Extensions for streaming data and complex event composition',
                'Always handle unsubscription to prevent memory leaks'
            ],
            commonMistakes: [
                'Not unsubscribing from events (memory leak — publisher holds reference to subscriber)',
                'Tight coupling between subject and observer (use interfaces/events for decoupling)',
                'Assuming observer notification order (not guaranteed in most implementations)',
                'Using Observer when a simple callback (Func/Action) would suffice'
            ],
            interviewTip: 'Show all three C# flavors (events, MediatR, Rx) and explain when each fits. The pattern is the same — only the mechanism differs. Modern .NET code uses MediatR notifications for domain events and Rx for streaming data.',
            followUp: ['How do events cause memory leaks?', 'What is the difference between IObservable and IEnumerable?', 'How does MediatR publish differ from event raising?'],
            seniorPerspective: 'I use MediatR INotification for domain events (OrderPlaced, UserRegistered) — it gives me decoupled handlers, each independently testable, without the memory leak risk of C# events. Rx is reserved for genuinely streaming scenarios (real-time pricing, sensor data).',
            architectPerspective: 'Observer pattern at the system level becomes event-driven architecture. Same concept, different scale: instead of in-process notifications, events flow via message brokers (Service Bus, Kafka) to independent services. The decoupling benefit compounds as the system grows.'
        },
        {
            question: 'Compare Chain of Responsibility with Middleware in ASP.NET Core. Are they the same pattern?',
            difficulty: 'advanced',
            answer: `<p>Yes — ASP.NET Core middleware IS the Chain of Responsibility pattern. Each middleware receives a request, decides whether to handle it or pass to <code>next()</code>, and can modify the response on the way back. The key differences from classic GoF: middleware always calls next (pipeline), whereas classic CoR may short-circuit.</p>`,
            code: `// ASP.NET Core Middleware = Chain of Responsibility:
// Each middleware: receives request → does work → calls next → does more work

app.UseExceptionHandler();  // Link 1: catches exceptions from ALL below
app.UseAuthentication();    // Link 2: identifies who the user is  
app.UseAuthorization();     // Link 3: checks if user can proceed
app.UseRateLimiter();       // Link 4: throttles if too many requests
app.MapControllers();       // Link 5: actual endpoint (terminal)

// Custom middleware as Chain of Responsibility:
public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next; // The NEXT link in chain

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        
        await _next(context); // Pass to next middleware (or short-circuit!)
        
        sw.Stop();
        context.Response.Headers.Append("X-Response-Time", sw.ElapsedMilliseconds + "ms");
    }
}

// Short-circuiting (stopping the chain):
public class MaintenanceModeMiddleware
{
    private readonly RequestDelegate _next;
    
    public async Task InvokeAsync(HttpContext context)
    {
        if (IsMaintenanceMode())
        {
            context.Response.StatusCode = 503;
            await context.Response.WriteAsync("Service under maintenance");
            return; // SHORT-CIRCUIT — never calls _next, chain stops here!
        }
        await _next(context);
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Middleware ORDER matters — security checks must come before endpoint execution',
                'Use short-circuiting for early returns (404, 503, rate limiting)',
                'Keep each middleware focused on one concern (SRP)',
                'Log request/response at the outermost middleware for complete capture'
            ],
            commonMistakes: [
                'Wrong middleware ordering (authorization before authentication = broken)',
                'Forgetting to call next() — silently stops the entire pipeline',
                'Heavy computation in middleware that runs on EVERY request',
                'Modifying response body after it has started streaming (InvalidOperationException)'
            ],
            interviewTip: 'Draw the Russian-doll nesting: request flows IN through each middleware, then response flows OUT in reverse order. This is exactly Chain of Responsibility with a symmetric response phase. Mention that Exception Handler works because it wraps everything below it.',
            followUp: ['How does middleware ordering affect security?', 'Can you branch the middleware pipeline?', 'What is the difference between Map, Use, and Run?'],
            seniorPerspective: 'I think of the middleware pipeline as security layers: outer layers protect inner layers. Exception handling outside everything (catches all), then auth (identity), then authz (permission), then business logic innermost. Each layer has one job.',
            architectPerspective: 'The middleware pattern extends beyond HTTP: message processing pipelines, CQRS pipeline behaviors, and even cloud functions (triggers → filters → handler) follow the same Chain of Responsibility structure. It is the universal pattern for intercepting and processing any request flow.'
        },
        {
            question: 'What is the State pattern, and how does it differ from the Strategy pattern?',
            difficulty: 'hard',
            answer: `<p>The <strong>State</strong> pattern lets an object change its behavior when its internal state changes, so it appears to change class. Each state is a separate object encapsulating the behavior valid in that state, including the rules for transitioning to other states.</p>
            <p><strong>State vs Strategy:</strong> structurally they look identical (an object delegates to a swappable implementation), but the intent differs:</p>
            <ul>
                <li><strong>Strategy</strong> — the client picks an interchangeable algorithm; strategies are independent and unaware of each other.</li>
                <li><strong>State</strong> — the object transitions between states internally; states often know about and trigger transitions to other states.</li>
            </ul>`,
            explanation: 'Strategy is choosing how to travel (car, train, bike) — you pick one and it does not decide to become another. State is a traffic light: green knows it must become yellow, yellow knows it must become red. The transitions are part of each state, not chosen by an outside client.',
            code: `// State pattern — an order that behaves differently per state and
// controls its own transitions.
public interface IOrderState
{
    IOrderState Pay();
    IOrderState Ship();
    string Name { get; }
}

public class NewOrder : IOrderState
{
    public string Name => "New";
    public IOrderState Pay() => new PaidOrder();          // valid transition
    public IOrderState Ship() =>
        throw new InvalidOperationException("Cannot ship unpaid order");
}

public class PaidOrder : IOrderState
{
    public string Name => "Paid";
    public IOrderState Pay() =>
        throw new InvalidOperationException("Already paid");
    public IOrderState Ship() => new ShippedOrder();       // valid transition
}

public class ShippedOrder : IOrderState
{
    public string Name => "Shipped";
    public IOrderState Pay() => throw new InvalidOperationException("Already paid");
    public IOrderState Ship() => throw new InvalidOperationException("Already shipped");
}

// Context delegates to the current state; transitions live in the states.
public class Order
{
    private IOrderState _state = new NewOrder();
    public string Status => _state.Name;
    public void Pay() => _state = _state.Pay();
    public void Ship() => _state = _state.Ship();
}

var order = new Order();   // New
order.Pay();               // Paid
order.Ship();              // Shipped
// order.Ship() again -> InvalidOperationException (illegal transition)`,
            language: 'csharp',
            bestPractices: [
                'Encapsulate each state and its legal transitions in its own type',
                'Keep the context thin — it just delegates to the current state',
                'Make illegal transitions explicit (throw or return a result) rather than silent no-ops',
                'Consider a state machine library when transition rules get complex'
            ],
            commonMistakes: [
                'Implementing states as a giant switch on an enum (the smell State replaces)',
                'Scattering transition rules across the context instead of inside states',
                'Confusing State with Strategy because the structure looks the same',
                'Allowing states to share mutable context in unsafe ways'
            ],
            interviewTip: 'Nail the intent difference: Strategy is client-selected and stateless about transitions; State manages its own transitions internally. The traffic-light/order-lifecycle example makes it click.',
            followUp: ['When would you use a dedicated state machine library instead?', 'How do you persist the current state?', 'How does State help eliminate enum-switch code?'],
            seniorPerspective: 'I reach for State when an entity has a real lifecycle with rules about what is allowed when — orders, payments, subscriptions. Encoding transitions in state objects turns a sprawling switch into small, individually testable units and makes illegal transitions impossible to reach by accident.',
            architectPerspective: 'For workflow-heavy domains I often graduate from the hand-rolled State pattern to an explicit state machine (or a durable workflow engine). The pattern is the gateway concept; at scale you want the transition table to be declarative, auditable, and persistable.'
        },
        {
            question: 'Explain the Command pattern. How does it enable undo/redo, queuing, and auditing?',
            difficulty: 'advanced',
            answer: `<p>The <strong>Command</strong> pattern encapsulates a request as an object, decoupling the invoker (what triggers the action) from the receiver (what performs it). Because the action and its parameters are now a first-class object, you can store, queue, log, schedule, and reverse it.</p>
            <ul>
                <li><strong>Undo/redo</strong> — each command knows how to execute and how to reverse itself; a history stack drives undo/redo.</li>
                <li><strong>Queuing</strong> — commands can be enqueued and executed later or on another thread.</li>
                <li><strong>Auditing</strong> — a serialized command log is a record of every operation performed.</li>
            </ul>`,
            explanation: 'A command is like a written work order rather than a verbal instruction. Because it is a physical document, you can stack work orders in a queue, file them for audit, and each carries instructions for how to undo the job if it must be reversed.',
            code: `public interface ICommand
{
    void Execute();
    void Undo();
}

// Receiver: the thing that actually changes
public class Document
{
    public string Text { get; private set; } = "";
    public void Append(string s) => Text += s;
    public void RemoveLast(int count) => Text = Text[..^count];
}

// Concrete command — knows how to do AND undo
public class AppendTextCommand : ICommand
{
    private readonly Document _doc;
    private readonly string _text;
    public AppendTextCommand(Document doc, string text) { _doc = doc; _text = text; }
    public void Execute() => _doc.Append(_text);
    public void Undo() => _doc.RemoveLast(_text.Length);
}

// Invoker with undo/redo history
public class CommandManager
{
    private readonly Stack<ICommand> _undo = new();
    private readonly Stack<ICommand> _redo = new();

    public void Run(ICommand cmd)
    {
        cmd.Execute();
        _undo.Push(cmd);
        _redo.Clear();           // new action invalidates redo
    }
    public void Undo()
    {
        if (_undo.TryPop(out var cmd)) { cmd.Undo(); _redo.Push(cmd); }
    }
    public void Redo()
    {
        if (_redo.TryPop(out var cmd)) { cmd.Execute(); _undo.Push(cmd); }
    }
}

var doc = new Document();
var mgr = new CommandManager();
mgr.Run(new AppendTextCommand(doc, "Hello"));
mgr.Run(new AppendTextCommand(doc, " World"));
mgr.Undo();   // Text == "Hello"
mgr.Redo();   // Text == "Hello World"`,
            language: 'csharp',
            bestPractices: [
                'Capture everything needed to Undo inside the command at execution time',
                'Keep commands immutable once created so a queued/logged command is reliable',
                'Use a history stack for undo and a separate stack for redo',
                'For distributed systems, make commands serializable for queue/audit durability'
            ],
            commonMistakes: [
                'Undo logic that recomputes rather than restoring captured prior state (drifts)',
                'Commands holding references to mutable state that changes before execution',
                'Forgetting to clear the redo stack when a new command runs',
                'Putting business logic in the invoker instead of the command/receiver'
            ],
            interviewTip: 'Tie the structure to the benefits: because the request is an object, it can be queued, logged, and reversed. The undo/redo two-stack mechanism is a great concrete detail to show.',
            followUp: ['How does Command relate to CQRS commands and MediatR?', 'How do you make undo robust against intervening changes?', 'How would you persist a command queue across restarts?'],
            seniorPerspective: 'The discipline that makes Command pay off is capturing the inverse operation (or the prior state) at execute time, not deriving it later. I have debugged plenty of broken undo features whose root cause was recomputing the reverse against state that had already moved on.',
            architectPerspective: 'Command generalizes to message-driven and event-sourced systems: a durable, serialized command log is both a work queue and an audit trail, and replaying commands reconstructs state. CQRS command handlers are the same idea formalized at the application boundary.'
        }
    ,
        {
            question: 'What is the Template Method pattern, and how does it differ from Strategy?',
            difficulty: 'medium',
            answer: `<p><strong>Template Method</strong> defines the skeleton of an algorithm in a base class, deferring specific steps to subclasses via abstract/virtual methods. The overall sequence is fixed; subclasses customize individual steps. It uses <strong>inheritance</strong> and the Hollywood Principle ("don\u2019t call us, we\u2019ll call you").</p>
            <p>The key difference from <strong>Strategy</strong>: Template Method varies <em>steps within a fixed algorithm via subclassing</em> (compile-time, inheritance); Strategy varies the <em>entire algorithm via composition</em> (runtime, swap the object). Strategy is generally preferred for flexibility (composition over inheritance), but Template Method is clean when there is a genuinely fixed sequence with a few pluggable steps.</p>`,
            explanation: 'Template Method is a recipe with fixed steps where you choose the filling; the recipe controls the order and calls your "add filling" step. Strategy is swapping the entire recipe. One customizes steps by subclassing; the other replaces the whole approach by composition.',
            code: `abstract class ReportGenerator           // Template Method
{
    public string Generate()              // fixed skeleton
    {
        var data = FetchData();           // step (overridable)
        var body = Format(data);          // step (overridable)
        return AddHeaderFooter(body);     // shared step
    }
    protected abstract IEnumerable<Row> FetchData();
    protected abstract string Format(IEnumerable<Row> data);
    private string AddHeaderFooter(string b) => $"=== {b} ===";
}
class CsvReport : ReportGenerator { /* override FetchData, Format */ }`,
            language: 'csharp',
            bestPractices: ['Use Template Method when the algorithm sequence is fixed but a few steps vary', 'Keep the template method itself non-overridable (the invariant skeleton)', 'Prefer Strategy (composition) when the whole algorithm varies or you need runtime swapping', 'Limit the number of abstract hooks to keep subclasses manageable'],
            commonMistakes: ['Using inheritance (Template Method) where composition (Strategy) is more flexible', 'Making the template method itself virtual, letting subclasses break the invariant', 'Too many abstract hook methods, making subclasses fragile', 'Deep inheritance hierarchies that are hard to follow'],
            interviewTip: 'The crisp contrast: Template Method = vary steps by inheritance within a fixed algorithm; Strategy = vary the whole algorithm by composition at runtime. Mention "composition over inheritance" favors Strategy in most modern code.',
            followUp: ['Why is Strategy often preferred over Template Method today?', 'What is the Hollywood Principle?', 'How do you avoid fragile base classes?'],
            seniorPerspective: 'I reach for Template Method only when there is a truly fixed sequence with a couple of varying steps \u2014 otherwise Strategy via DI is more testable and flexible. In modern C#, injecting a strategy beats a deep inheritance tree almost every time.',
            architectPerspective: 'Template Method bakes the algorithm structure into a class hierarchy, which couples customization to inheritance. Strategy keeps it composable and DI-friendly, which scales better across teams \u2014 so I treat Template Method as a localized convenience, not a structural backbone.'
        },
        {
            question: 'What is the Visitor pattern, what problem does it solve, and what is its main drawback?',
            difficulty: 'hard',
            answer: `<p><strong>Visitor</strong> lets you add new <em>operations</em> to a fixed object structure without modifying the element classes. You define a visitor interface with a <code>Visit</code> method per element type; elements implement <code>Accept(visitor)</code> and call back the right overload (<strong>double dispatch</strong>). New operations = new visitor classes, no changes to elements.</p>
            <p>It shines when you have a stable set of types (e.g., AST nodes, shapes) and many operations over them (evaluate, print, type-check). The drawback: it inverts the extensibility axis \u2014 adding a new <em>element type</em> forces changes to <em>every</em> visitor. So Visitor is great when types are stable but operations grow, and bad when types change often.</p>`,
            explanation: 'Visitor is like a tax auditor who visits each kind of business and knows how to handle each type. Adding a new audit (operation) is easy \u2014 send a new auditor. But inventing a brand-new kind of business (element type) means retraining every auditor.',
            code: `interface IShapeVisitor { void Visit(Circle c); void Visit(Square s); }
interface IShape { void Accept(IShapeVisitor v); }
class Circle : IShape { public double R; public void Accept(IShapeVisitor v) => v.Visit(this); }
class Square : IShape { public double Side; public void Accept(IShapeVisitor v) => v.Visit(this); }

class AreaVisitor : IShapeVisitor      // new operation, no element changes
{
    public double Area;
    public void Visit(Circle c) => Area = Math.PI * c.R * c.R;
    public void Visit(Square s) => Area = s.Side * s.Side;
}`,
            language: 'csharp',
            bestPractices: ['Use Visitor when the element types are stable but operations keep growing', 'Leverage double dispatch (Accept + overloaded Visit) for type-specific behavior', 'Keep related operations grouped in one visitor for cohesion', 'Consider pattern matching (switch on type) as a lighter modern alternative in C#'],
            commonMistakes: ['Using Visitor when element types change frequently (every visitor must update)', 'Confusing it with a simple switch \u2014 missing the double-dispatch point', 'Overusing it where C# pattern matching would be simpler and clearer', 'Leaking element internals to visitors, breaking encapsulation'],
            interviewTip: 'State the trade-off explicitly: Visitor makes adding operations easy but adding element types hard (the opposite of the usual OO default). Mentioning double dispatch and that C# pattern matching is a modern alternative shows depth.',
            followUp: ['What is double dispatch?', 'When would C# pattern matching replace Visitor?', 'How does Visitor relate to the Expression Problem?'],
            seniorPerspective: 'In C# I often replace classic Visitor with pattern matching (switch on type) for readability, and reserve true Visitor for stable type hierarchies like ASTs where many operations accumulate. The decisive question is always "what changes more often \u2014 the types or the operations?"',
            architectPerspective: 'Visitor is a direct answer to the Expression Problem: it optimizes for adding operations at the cost of adding types. Choosing it is an architectural bet on which axis of change dominates, so I only commit to it when the type set is genuinely closed and stable.'
        },
        {
            question: 'Explain the Iterator and Memento patterns and where they show up in .NET.',
            difficulty: 'medium',
            answer: `<p><strong>Iterator</strong> provides sequential access to elements of a collection without exposing its internal structure. In .NET this is <code>IEnumerable&lt;T&gt;</code>/<code>IEnumerator&lt;T&gt;</code>, and <code>yield return</code> generates iterators for you \u2014 enabling <code>foreach</code> and lazy LINQ pipelines. The pattern decouples traversal from the collection\u2019s representation.</p>
            <p><strong>Memento</strong> captures an object\u2019s internal state so it can be restored later, without exposing its internals \u2014 the basis for undo/redo and snapshots. A <em>caretaker</em> holds mementos it cannot inspect; the <em>originator</em> creates and restores them. .NET examples: undo stacks, transaction rollback snapshots, and serialization-based state capture.</p>`,
            explanation: 'Iterator is a TV remote\u2019s next/previous \u2014 you step through channels without knowing how the tuner works inside. Memento is a save-game file: it records your state so you can reload it later, without exposing how the game stores it.',
            code: `// Iterator via yield \u2014 lazy, no exposed internals
IEnumerable<int> Evens(int max)
{
    for (int i = 0; i <= max; i += 2) yield return i;  // produces an iterator
}
foreach (var n in Evens(10)) { /* 0,2,4,6,8,10 */ }

// Memento \u2014 capture/restore state for undo
record EditorMemento(string Text);                 // opaque to the caretaker
class Editor {
    public string Text = "";
    public EditorMemento Save() => new(Text);
    public void Restore(EditorMemento m) => Text = m.Text;
}`,
            language: 'csharp',
            bestPractices: ['Use IEnumerable<T>/yield for custom iteration instead of exposing internal lists', 'Keep iterators lazy where possible to compose with LINQ and avoid materializing', 'Use Memento to encapsulate undo/redo state without exposing object internals', 'Keep mementos opaque to the caretaker (only the originator interprets them)'],
            commonMistakes: ['Exposing the backing collection instead of returning IEnumerable<T>', 'Multiple enumeration of an expensive lazy iterator (re-running the work)', 'Mementos that expose/allow mutation of internal state (breaks encapsulation)', 'Storing huge mementos for every change without limiting history'],
            interviewTip: 'Map both to concrete .NET: Iterator = IEnumerable/yield/LINQ; Memento = undo stacks/snapshots. Noting that yield generates the iterator state machine for you shows you connect pattern to language feature.',
            followUp: ['How does yield return implement the iterator state machine?', 'What are the risks of multiple enumeration?', 'How would you bound memento history for undo?'],
            seniorPerspective: 'Most engineers use Iterator daily without naming it \u2014 every yield/LINQ pipeline is the pattern. For Memento I keep the snapshot opaque and bound the history; naive "save everything" undo stacks become memory problems on large documents.',
            architectPerspective: 'Iterator is so fundamental it is baked into the language and LINQ, which is why lazy, composable data pipelines are idiomatic in .NET. Memento underpins undo and snapshotting; deciding what constitutes restorable state (and how much history to keep) is the real design work, not the pattern mechanics.'
        }
    ]
});
