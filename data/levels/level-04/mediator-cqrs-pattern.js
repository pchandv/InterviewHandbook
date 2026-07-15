/* ═══════════════════════════════════════════════════════════════════
   MEDIATOR & CQRS — Level 4: Design Patterns (Enterprise Patterns)
   The Mediator pattern, MediatR in .NET, and CQRS for separating
   commands from queries.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('mediator-cqrs-pattern', {

    title: 'Mediator & CQRS',
    level: 4,
    group: 'enterprise-patterns',
    description: 'The Mediator pattern for decoupling components, MediatR in .NET, and CQRS for separating reads from writes — with pipeline behaviors, validation, and handler patterns.',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    prerequisites: ['dp-behavioral', 'csharp-di'],

    sections: [

        // ─── 1. INTRODUCTION ──────────────────────────────────────────
        {
            title: 'Introduction',
            content: `<p>The <strong>Mediator pattern</strong> reduces coupling between components by introducing a
            mediator object that handles communication between them. Instead of components referencing
            each other directly, they communicate through the mediator.</p>
            <p><strong>CQRS (Command Query Responsibility Segregation)</strong> separates operations that
            change state (commands) from operations that read state (queries). These two patterns
            combine powerfully — the Mediator routes commands and queries to their handlers.</p>
            <p>In .NET, the <strong>MediatR</strong> library popularized this combination, becoming a
            cornerstone of Clean Architecture and Vertical Slice Architecture implementations.</p>
            <p>In this module, you will learn:</p>
            <ul>
                <li>The Mediator design pattern and its intent</li>
                <li>How MediatR implements mediator + CQRS in .NET</li>
                <li>Commands, queries, and their handlers</li>
                <li>Pipeline behaviors for cross-cutting concerns (validation, logging, transactions)</li>
                <li>Notifications for one-to-many event handling</li>
                <li>When CQRS adds value and when it is over-engineering</li>
            </ul>`
        },

        // ─── 2. CORE CONCEPTS ─────────────────────────────────────────
        {
            title: 'Core Concepts',
            content: `<p>Key concepts behind Mediator and CQRS:</p>
            <h4>Mediator Pattern Intent</h4>
            <p>Define an object that encapsulates how a set of objects interact. Mediator promotes loose
            coupling by keeping objects from referring to each other explicitly, letting you vary their
            interaction independently.</p>
            <h4>Command vs Query</h4>
            <ul>
                <li><strong>Command:</strong> Changes state, returns void or minimal data (the ID created).
                Named imperatively: <code>CreateOrderCommand</code>, <code>CancelBookingCommand</code>.</li>
                <li><strong>Query:</strong> Reads state, returns data, has no side effects.
                Named as questions: <code>GetOrderByIdQuery</code>, <code>ListActiveUsersQuery</code>.</li>
            </ul>
            <h4>Handlers</h4>
            <p>Each command/query has exactly one handler containing the logic to process it.
            The mediator routes the request to its handler based on type. This creates a clear
            one-request-one-handler structure.</p>
            <h4>Pipeline Behaviors</h4>
            <p>Middleware-like components that wrap handler execution. Cross-cutting concerns
            (validation, logging, caching, transactions, performance monitoring) live in behaviors
            rather than being scattered across handlers.</p>
            <h4>Notifications</h4>
            <p>Unlike commands (one handler), notifications support multiple handlers — a publish/subscribe
            mechanism within the application. Used for domain events.</p>`,
            mermaid: `graph TB
    Controller["Controller / Endpoint"] -->|send| Mediator["IMediator"]
    Mediator -->|route command| CH["Command Handler"]
    Mediator -->|route query| QH["Query Handler"]
    Mediator -->|publish notification| N1["Notification Handler 1"]
    Mediator -->|publish notification| N2["Notification Handler 2"]
    CH --> Write[("Write Model")]
    QH --> Read[("Read Model")]
    subgraph Pipeline["Pipeline Behaviors"]
        V["Validation"]
        L["Logging"]
        T["Transaction"]
    end
    Mediator -.-> Pipeline
    Pipeline -.-> CH`
        },

        // ─── 3. HOW IT WORKS ──────────────────────────────────────────
        {
            title: 'How It Works',
            content: `<p>The request flow through a mediator-based CQRS system:</p>
            <ol>
                <li><strong>Request Creation:</strong> A controller receives an HTTP request and creates a
                command or query object (a simple message/DTO)</li>
                <li><strong>Dispatch:</strong> The controller calls <code>mediator.Send(request)</code> —
                it does NOT know which handler will process it</li>
                <li><strong>Pipeline:</strong> The request passes through registered pipeline behaviors
                in order (e.g., validation → logging → handler → transaction commit)</li>
                <li><strong>Handler Resolution:</strong> The mediator resolves the single handler registered
                for that request type via dependency injection</li>
                <li><strong>Handler Execution:</strong> The handler executes the business logic and returns a result</li>
                <li><strong>Response:</strong> The result flows back through the pipeline to the controller</li>
            </ol>
            <p>The key benefit: controllers become thin. They only translate HTTP to a request object
            and dispatch it. All business logic lives in handlers, testable in isolation.</p>`,
            code: `// Controller — thin, just dispatches
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;
    public OrdersController(IMediator mediator) => _mediator = mediator;

    [HttpPost]
    public async Task<ActionResult<Guid>> Create(CreateOrderCommand command)
    {
        var orderId = await _mediator.Send(command); // Routes to handler
        return CreatedAtAction(nameof(GetById), new { id = orderId }, orderId);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetById(Guid id)
    {
        var order = await _mediator.Send(new GetOrderByIdQuery(id));
        return order is null ? NotFound() : Ok(order);
    }
}

// Command — a simple message describing intent
public record CreateOrderCommand(string CustomerId, List<OrderItemDto> Items)
    : IRequest<Guid>;

// Command Handler — the business logic
public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IOrderRepository _orders;
    private readonly IUnitOfWork _uow;

    public CreateOrderHandler(IOrderRepository orders, IUnitOfWork uow)
    {
        _orders = orders;
        _uow = uow;
    }

    public async Task<Guid> Handle(CreateOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Items);
        await _orders.AddAsync(order, ct);
        await _uow.SaveChangesAsync(ct);
        return order.Id;
    }
}

// Query and its handler
public record GetOrderByIdQuery(Guid OrderId) : IRequest<OrderDto?>;

public class GetOrderByIdHandler : IRequestHandler<GetOrderByIdQuery, OrderDto?>
{
    private readonly IReadDbContext _db;
    public GetOrderByIdHandler(IReadDbContext db) => _db = db;

    public async Task<OrderDto?> Handle(GetOrderByIdQuery query, CancellationToken ct) =>
        await _db.Orders
            .Where(o => o.Id == query.OrderId)
            .Select(o => new OrderDto(o.Id, o.CustomerId, o.Total, o.Status))
            .FirstOrDefaultAsync(ct);
}`,
            language: 'csharp'
        },

        // ─── 4. VISUAL DIAGRAM ────────────────────────────────────────
        {
            title: 'Request Pipeline',
            content: `<p>The diagram shows how a request flows through pipeline behaviors before and after
            reaching its handler — similar to ASP.NET middleware but at the application layer:</p>`,
            mermaid: `sequenceDiagram
    participant C as Controller
    participant M as Mediator
    participant V as ValidationBehavior
    participant L as LoggingBehavior
    participant TX as TransactionBehavior
    participant H as Handler
    participant DB as Database

    C->>M: Send(CreateOrderCommand)
    M->>V: Handle (next)
    V->>V: Validate command
    alt Validation fails
        V-->>C: throw ValidationException
    else Validation passes
        V->>L: Handle (next)
        L->>L: Log request start
        L->>TX: Handle (next)
        TX->>TX: Begin transaction
        TX->>H: Handle (next)
        H->>DB: Persist order
        DB-->>H: OK
        H-->>TX: Return orderId
        TX->>TX: Commit transaction
        TX-->>L: orderId
        L->>L: Log request complete
        L-->>V: orderId
        V-->>M: orderId
        M-->>C: orderId
    end`
        },

        // ─── 5. IMPLEMENTATION ────────────────────────────────────────
        {
            title: 'Implementation',
            content: `<p>Implementation patterns: pipeline behaviors, notifications, and a hand-rolled mediator
            for those avoiding the library:</p>`,
            tabs: [
                {
                    label: 'Validation Behavior',
                    code: `// Pipeline behavior — runs validation before every command handler
public class ValidationBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
        => _validators = validators;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken ct)
    {
        if (_validators.Any())
        {
            var context = new ValidationContext<TRequest>(request);
            var results = await Task.WhenAll(
                _validators.Select(v => v.ValidateAsync(context, ct)));

            var failures = results
                .SelectMany(r => r.Errors)
                .Where(f => f != null)
                .ToList();

            if (failures.Count != 0)
                throw new ValidationException(failures);
        }

        return await next(); // Proceed to next behavior / handler
    }
}

// FluentValidation validator — discovered automatically
public class CreateOrderValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty().WithMessage("Order must have at least one item");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.Quantity).GreaterThan(0);
            item.RuleFor(i => i.ProductId).NotEmpty();
        });
    }
}

// Registration
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));`,
                    language: 'csharp'
                },
                {
                    label: 'Notifications',
                    code: `// Notification — supports MULTIPLE handlers (one-to-many)
public record OrderPlacedNotification(Guid OrderId, string CustomerId, decimal Total)
    : INotification;

// Handler 1: Send confirmation email
public class SendOrderConfirmationHandler : INotificationHandler<OrderPlacedNotification>
{
    private readonly IEmailService _email;
    public SendOrderConfirmationHandler(IEmailService email) => _email = email;

    public async Task Handle(OrderPlacedNotification n, CancellationToken ct)
        => await _email.SendOrderConfirmationAsync(n.CustomerId, n.OrderId, ct);
}

// Handler 2: Update analytics
public class UpdateAnalyticsHandler : INotificationHandler<OrderPlacedNotification>
{
    private readonly IAnalyticsService _analytics;
    public UpdateAnalyticsHandler(IAnalyticsService analytics) => _analytics = analytics;

    public async Task Handle(OrderPlacedNotification n, CancellationToken ct)
        => await _analytics.TrackPurchaseAsync(n.CustomerId, n.Total, ct);
}

// Handler 3: Reserve inventory
public class ReserveInventoryHandler : INotificationHandler<OrderPlacedNotification>
{
    private readonly IInventoryService _inventory;
    public ReserveInventoryHandler(IInventoryService inventory) => _inventory = inventory;

    public async Task Handle(OrderPlacedNotification n, CancellationToken ct)
        => await _inventory.ReserveForOrderAsync(n.OrderId, ct);
}

// Publishing — all 3 handlers run (sequentially by default)
public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IMediator _mediator;
    // ... other deps

    public async Task<Guid> Handle(CreateOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Items);
        await _orders.AddAsync(order, ct);
        await _uow.SaveChangesAsync(ct);

        // Fan-out to all notification handlers
        await _mediator.Publish(
            new OrderPlacedNotification(order.Id, order.CustomerId, order.Total), ct);

        return order.Id;
    }
}`,
                    language: 'csharp'
                },
                {
                    label: 'Hand-Rolled Mediator',
                    code: `// Minimal mediator without a library — understand what MediatR does
public interface IRequest<TResponse> { }

public interface IRequestHandler<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    Task<TResponse> Handle(TRequest request, CancellationToken ct);
}

public interface IMediator
{
    Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken ct = default);
}

public class Mediator : IMediator
{
    private readonly IServiceProvider _provider;
    public Mediator(IServiceProvider provider) => _provider = provider;

    public async Task<TResponse> Send<TResponse>(
        IRequest<TResponse> request, CancellationToken ct = default)
    {
        // Resolve the handler type dynamically
        var handlerType = typeof(IRequestHandler<,>)
            .MakeGenericType(request.GetType(), typeof(TResponse));

        dynamic handler = _provider.GetRequiredService(handlerType);
        return await handler.Handle((dynamic)request, ct);
    }
}

// Registration: scan assembly and register all handlers
public static IServiceCollection AddSimpleMediator(
    this IServiceCollection services, Assembly assembly)
{
    services.AddScoped<IMediator, Mediator>();

    var handlerTypes = assembly.GetTypes()
        .Where(t => t.GetInterfaces().Any(i => i.IsGenericType &&
            i.GetGenericTypeDefinition() == typeof(IRequestHandler<,>)));

    foreach (var handlerType in handlerTypes)
    {
        var interfaceType = handlerType.GetInterfaces()
            .First(i => i.GetGenericTypeDefinition() == typeof(IRequestHandler<,>));
        services.AddScoped(interfaceType, handlerType);
    }
    return services;
}`,
                    language: 'csharp'
                }
            ]
        },

        // ─── 6. BEST PRACTICES ────────────────────────────────────────
        {
            title: 'Best Practices',
            content: `<h4>Do: Keep Handlers Focused (One Per Request)</h4>
            <p>Each command/query gets exactly one handler containing all its logic. This creates a clear
            "vertical slice" — everything about a feature is in one place, easy to find and test.</p>
            <h4>Do: Use Pipeline Behaviors for Cross-Cutting Concerns</h4>
            <p>Validation, logging, caching, transactions, and performance monitoring belong in behaviors,
            not duplicated across handlers. This keeps handlers clean and focused on business logic.</p>
            <h4>Do: Name Commands and Queries Clearly</h4>
            <p>Commands are imperative (<code>CancelOrderCommand</code>), queries are questions
            (<code>GetOrderStatusQuery</code>). The name reveals intent and whether state changes.</p>
            <h4>Do: Separate Read and Write Models When Beneficial</h4>
            <p>Commands operate on rich domain models (write side). Queries can bypass the domain
            and project directly to DTOs (read side) for performance. They don't need to share models.</p>
            <h4>Do: Return Results, Not Exceptions, for Expected Failures</h4>
            <p>Use a Result type (<code>Result&lt;T&gt;</code>) for business failures (validation, not found)
            rather than throwing exceptions. Reserve exceptions for truly exceptional cases.</p>`,
            callout: {
                type: 'tip',
                title: 'Vertical Slice Architecture',
                text: 'CQRS with MediatR enables Vertical Slice Architecture — organize code by feature (Orders/CreateOrder.cs containing command, handler, validator, and DTO together) rather than by technical layer. This keeps related code together and makes features easy to find.'
            }
        },

        // ─── 7. COMMON MISTAKES ───────────────────────────────────────
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Anemic Commands That Just Call Services</h4>
            <p>If every handler just delegates to a service method, you've added a layer of indirection
            without value. Put the logic IN the handler, or don't use the pattern.</p>
            <h4>Mistake: Sharing Logic Between Handlers via Inheritance</h4>
            <p>Handlers should be independent. If two handlers share logic, extract it into a domain
            method or a shared service — not a base handler class with template methods.</p>
            <h4>Mistake: Over-Using CQRS for Simple CRUD</h4>
            <p>A basic CRUD app with simple read/write patterns doesn't need separate read/write models.
            CQRS adds value when read and write concerns genuinely differ. Don't apply it reflexively.</p>
            <h4>Mistake: Putting Business Logic in Controllers</h4>
            <p>The whole point is thin controllers. If controllers contain logic beyond
            "create request → send → return response", the pattern isn't being used correctly.</p>
            <h4>Mistake: Commands Returning Full Entities</h4>
            <p>Commands should return minimal data (the new ID, or nothing). Returning the full
            entity blurs the command/query separation. Use a follow-up query to fetch the result.</p>`,
            code: `// BAD: Anemic handler that adds no value
public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IOrderService _service;
    public async Task<Guid> Handle(CreateOrderCommand cmd, CancellationToken ct)
        => await _service.CreateOrder(cmd); // Just forwarding — why have a handler?
}

// GOOD: Handler contains the orchestration logic
public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    public async Task<Guid> Handle(CreateOrderCommand cmd, CancellationToken ct)
    {
        // Actual logic lives here — this IS the use case
        var customer = await _customers.GetByIdAsync(cmd.CustomerId, ct)
            ?? throw new NotFoundException("Customer not found");

        var order = Order.Create(customer, cmd.Items);
        if (order.Total > customer.CreditLimit)
            throw new BusinessRuleException("Order exceeds credit limit");

        await _orders.AddAsync(order, ct);
        await _uow.SaveChangesAsync(ct);
        return order.Id;
    }
}`,
            language: 'csharp'
        },

        // ─── 8. REAL-WORLD APPLICATIONS ───────────────────────────────
        {
            title: 'Real-World Applications',
            content: `<p>Where Mediator and CQRS appear in production systems:</p>
            <h4>Clean Architecture Applications</h4>
            <p>MediatR is the de facto standard for the Application layer in .NET Clean Architecture.
            Each use case becomes a command/query handler, keeping the dependency rule intact
            (handlers depend on abstractions, not infrastructure).</p>
            <h4>Enterprise Line-of-Business Apps</h4>
            <p>Large business applications use CQRS to manage complexity. Commands enforce business
            rules through rich domain models; queries use optimized projections for reporting dashboards
            without loading entire aggregates.</p>
            <h4>High-Read Systems</h4>
            <p>E-commerce product catalogs, content platforms, and dashboards separate the write model
            (normalized, transactional) from read models (denormalized, cached, search-optimized).
            CQRS makes this separation explicit.</p>
            <h4>Event-Sourced Systems</h4>
            <p>CQRS is a natural fit for event sourcing: commands produce events stored in the event
            store; queries read from projections built by replaying those events. The two sides
            scale independently.</p>
            <h4>UI Component Mediation</h4>
            <p>Beyond backend, the Mediator pattern coordinates UI components — a chat dialog's
            send button, text field, and message list communicate through a mediator rather than
            referencing each other directly.</p>`
        },

        // ─── 9. COMPARISON ────────────────────────────────────────────
        {
            title: 'Comparison',
            content: `<p>Comparing the traditional service-layer approach with the Mediator/CQRS approach:</p>`,
            table: {
                headers: ['Aspect', 'Service Layer', 'Mediator + CQRS', 'Direct Controller Logic'],
                rows: [
                    ['Coupling', 'Controller → Service (direct)', 'Controller → Mediator (indirect)', 'None (all in controller)'],
                    ['Controller Size', 'Thin', 'Very thin', 'Fat'],
                    ['Cross-Cutting Concerns', 'Repeated or via base class', 'Centralized in behaviors', 'Scattered everywhere'],
                    ['Testability', 'Good (mock service)', 'Excellent (test handler alone)', 'Poor (HTTP-coupled)'],
                    ['Feature Cohesion', 'Spread across service methods', 'One handler per feature', 'Mixed in controller'],
                    ['Read/Write Separation', 'Usually shared models', 'Explicit separation', 'None'],
                    ['Learning Curve', 'Low', 'Medium', 'Very low'],
                    ['Boilerplate', 'Low', 'Higher (request + handler per op)', 'Lowest'],
                    ['Best For', 'Small-medium apps', 'Medium-large apps, Clean Arch', 'Prototypes, tiny apps']
                ]
            }
        },

        // ─── 10. PERFORMANCE ──────────────────────────────────────────
        {
            title: 'Performance',
            content: `<p>Performance considerations for the Mediator/CQRS approach:</p>
            <h4>Mediator Overhead</h4>
            <p>The mediator adds reflection-based handler resolution and pipeline traversal. For MediatR,
            this is typically &lt;1μs per request — negligible compared to DB or network calls.
            Handler resolution is cached after first use.</p>
            <h4>Read-Side Optimization</h4>
            <p>The biggest performance win from CQRS is on the read side. Query handlers can:</p>
            <ul>
                <li>Bypass the domain model and project directly to DTOs (no entity hydration)</li>
                <li>Use raw SQL or Dapper for complex reports instead of EF Core change tracking</li>
                <li>Read from denormalized views or read replicas</li>
                <li>Apply caching behaviors transparently via the pipeline</li>
            </ul>
            <h4>Write-Side Considerations</h4>
            <p>Command handlers use the full domain model with change tracking. This is appropriate
            for writes where correctness matters more than raw speed. Keep aggregates small to
            minimize the data loaded per command.</p>
            <h4>Caching Behavior Example</h4>
            <p>A caching pipeline behavior can transparently cache query results — the handler doesn't
            even know caching exists. Cache key derived from the query type and parameters.</p>`,
            callout: {
                type: 'info',
                title: 'Query Performance Tip',
                text: 'For read-heavy queries, mark them with a marker interface (ICacheableQuery) and use a caching pipeline behavior. The behavior checks the cache before invoking the handler, dramatically reducing database load for frequently-requested data.'
            }
        },

        // ─── 11. TESTING ──────────────────────────────────────────────
        {
            title: 'Testing',
            content: `<p>One of the biggest benefits of Mediator/CQRS is testability. Handlers are
            plain classes with injected dependencies — easy to unit test in isolation.</p>
            <h4>Handler Unit Tests</h4>
            <p>Test a handler directly by constructing it with mocked dependencies and calling
            <code>Handle</code>. No HTTP, no mediator infrastructure needed.</p>
            <h4>Validator Tests</h4>
            <p>FluentValidation validators are testable in isolation — assert that specific inputs
            produce specific validation errors.</p>
            <h4>Pipeline Behavior Tests</h4>
            <p>Test behaviors by providing a mock <code>next</code> delegate and verifying the behavior
            does its job (validates, logs, caches) and calls next appropriately.</p>`,
            code: `// Handler unit test — no mediator, no HTTP, just the handler
public class CreateOrderHandlerTests
{
    [Fact]
    public async Task Handle_ValidCommand_CreatesOrderAndReturnsId()
    {
        // Arrange
        var customer = new Customer("cust-1", creditLimit: 1000m);
        var customers = Substitute.For<ICustomerRepository>();
        customers.GetByIdAsync("cust-1", Arg.Any<CancellationToken>())
            .Returns(customer);
        var orders = Substitute.For<IOrderRepository>();
        var uow = Substitute.For<IUnitOfWork>();

        var handler = new CreateOrderHandler(customers, orders, uow);
        var command = new CreateOrderCommand("cust-1", new List<OrderItemDto>
        {
            new("prod-1", Quantity: 2, Price: 100m)
        });

        // Act
        var orderId = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotEqual(Guid.Empty, orderId);
        await orders.Received(1).AddAsync(Arg.Any<Order>(), Arg.Any<CancellationToken>());
        await uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_OrderExceedsCreditLimit_ThrowsBusinessRuleException()
    {
        var customer = new Customer("cust-1", creditLimit: 50m);
        var customers = Substitute.For<ICustomerRepository>();
        customers.GetByIdAsync("cust-1", Arg.Any<CancellationToken>()).Returns(customer);
        var handler = new CreateOrderHandler(customers,
            Substitute.For<IOrderRepository>(), Substitute.For<IUnitOfWork>());

        var command = new CreateOrderCommand("cust-1", new List<OrderItemDto>
        {
            new("prod-1", Quantity: 10, Price: 100m) // Total 1000 > limit 50
        });

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            handler.Handle(command, CancellationToken.None));
    }
}

// Validator test
public class CreateOrderValidatorTests
{
    private readonly CreateOrderValidator _validator = new();

    [Fact]
    public void Validate_EmptyItems_HasValidationError()
    {
        var command = new CreateOrderCommand("cust-1", new List<OrderItemDto>());
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(c => c.Items);
    }
}`,
            language: 'csharp'
        },

        // ─── 12. INTERVIEW TIPS ───────────────────────────────────────
        {
            title: 'Interview Tips',
            content: `<p>Mediator and CQRS come up in .NET architecture and design pattern interviews:</p>
            <ul>
                <li><strong>Distinguish the pattern from the library:</strong> Mediator is a GoF pattern; MediatR is
                a .NET library that implements it. Don't conflate them</li>
                <li><strong>Explain the "why":</strong> Decoupling, thin controllers, centralized cross-cutting
                concerns, and testability — not just "because it's clean"</li>
                <li><strong>Know when NOT to use it:</strong> Simple CRUD apps don't benefit. Show judgment</li>
                <li><strong>Mention pipeline behaviors:</strong> This is where the real power is — validation,
                logging, transactions without polluting handlers</li>
                <li><strong>Clarify CQRS scope:</strong> CQRS can be as simple as separate command/query handlers
                with one database, or as complex as separate read/write databases with event sourcing</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Common Interview Trap',
                text: 'Interviewers often ask "Does CQRS require two databases?" The answer is NO. CQRS is about separating read and write MODELS/responsibilities — it can run on a single database. Separate databases (with replication or event sourcing) is an optional advanced form.'
            }
        },

        // ─── 13. FURTHER READING ──────────────────────────────────────
        {
            title: 'Further Reading',
            content: `<p>Resources to deepen your understanding:</p>
            <h4>Books</h4>
            <ul>
                <li><em>Design Patterns</em> by GoF — the original Mediator pattern definition</li>
                <li><em>Clean Architecture</em> by Robert C. Martin — where CQRS handlers fit</li>
                <li><em>Patterns, Principles, and Practices of DDD</em> by Scott Millett — CQRS in context</li>
            </ul>
            <h4>Articles & Docs</h4>
            <ul>
                <li>MediatR GitHub: <code>github.com/jbogard/MediatR</code> — wiki and samples</li>
                <li>Martin Fowler: <code>martinfowler.com/bliki/CQRS.html</code></li>
                <li>Jimmy Bogard's blog — Vertical Slice Architecture articles</li>
                <li>Microsoft eShopOnContainers — reference CQRS/MediatR implementation</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li><strong>MediatR:</strong> The .NET mediator library</li>
                <li><strong>FluentValidation:</strong> Validation in pipeline behaviors</li>
                <li><strong>Wolverine:</strong> Alternative with built-in mediator + messaging</li>
            </ul>`
        },

        // ─── 14. KEY TAKEAWAYS ────────────────────────────────────────
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Core idea:</strong> Mediator decouples senders from handlers; CQRS separates commands (writes) from queries (reads)</li>
                <li><strong>When to use:</strong> Medium-large apps, Clean Architecture, when you want thin controllers and centralized cross-cutting concerns</li>
                <li><strong>When NOT to use:</strong> Simple CRUD apps, prototypes, or when the indirection adds no value</li>
                <li><strong>Key benefit:</strong> Testable handlers, thin controllers, cross-cutting concerns in pipeline behaviors, clear feature cohesion</li>
                <li><strong>CQRS clarification:</strong> Does NOT require two databases — it is about separating read/write responsibilities</li>
                <li><strong>Main risk:</strong> Over-engineering simple apps and creating anemic handlers that just forward to services</li>
                <li><strong>Interview signal:</strong> Distinguishing the Mediator pattern from MediatR library and knowing when NOT to use CQRS shows mature judgment</li>
            </ul>`
        },

        // ─── 15. EXERCISE ─────────────────────────────────────────────
        {
            title: 'Exercise',
            content: `<h4>Challenge: Build a CQRS Slice for a Library System</h4>
            <p>Implement a complete vertical slice for "borrow a book" using Mediator/CQRS:</p>
            <ol>
                <li>Create a <code>BorrowBookCommand</code> (memberId, bookId) returning a loan ID</li>
                <li>Implement the handler with business rules: book must be available, member must
                not exceed their borrow limit (max 5 books)</li>
                <li>Add a validator for the command (non-empty IDs)</li>
                <li>Create a <code>GetMemberLoansQuery</code> returning the member's active loans</li>
                <li>Publish a <code>BookBorrowedNotification</code> with two handlers: one updates
                availability, one sends a due-date reminder email</li>
                <li>Write a unit test for the handler covering the "exceeds borrow limit" rule</li>
            </ol>
            <h4>Starter Code</h4>`,
            code: `// Command
public record BorrowBookCommand(string MemberId, string BookId) : IRequest<Guid>;

// TODO: Implement the handler
public class BorrowBookHandler : IRequestHandler<BorrowBookCommand, Guid>
{
    // Inject: IBookRepository, IMemberRepository, ILoanRepository, IMediator, IUnitOfWork

    public async Task<Guid> Handle(BorrowBookCommand cmd, CancellationToken ct)
    {
        // 1. Load book — must exist and be available
        // 2. Load member — check active loan count < 5
        // 3. Create loan, mark book unavailable
        // 4. Save changes
        // 5. Publish BookBorrowedNotification
        // 6. Return loan ID
        throw new NotImplementedException();
    }
}

// TODO: BorrowBookValidator (IDs non-empty)
// TODO: GetMemberLoansQuery + handler
// TODO: BookBorrowedNotification + 2 notification handlers
// TODO: Unit test for the borrow-limit rule`,
            language: 'csharp'
        },

        // ─── 16. KNOWLEDGE CHECK ──────────────────────────────────────
        {
            title: 'Knowledge Check',
            content: `<p>Test your understanding of Mediator and CQRS:</p>
            <ol>
                <li><strong>Q:</strong> What problem does the Mediator pattern solve?<br/>
                    <em>A: It reduces coupling between components by having them communicate through a central
                    mediator instead of referencing each other directly. This makes interactions easier to
                    change and components easier to test independently.</em></li>
                <li><strong>Q:</strong> What is the difference between a command and a query in CQRS?<br/>
                    <em>A: A command changes state and returns minimal data (or void); it is named imperatively.
                    A query reads state, has no side effects, and returns data; it is named as a question.</em></li>
                <li><strong>Q:</strong> Does CQRS require two separate databases?<br/>
                    <em>A: No. CQRS separates read and write models/responsibilities. It can run on a single
                    database. Separate read/write databases (with replication or event sourcing) is an optional
                    advanced form for scaling reads independently.</em></li>
                <li><strong>Q:</strong> What are pipeline behaviors and why are they useful?<br/>
                    <em>A: Pipeline behaviors are middleware-like components that wrap handler execution.
                    They centralize cross-cutting concerns (validation, logging, transactions, caching) so
                    these don't have to be duplicated across handlers.</em></li>
            </ol>`
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // INTERVIEW QUESTIONS
    // ═══════════════════════════════════════════════════════════════
    questions: [
        {"question":"What is CQRS, and what are its benefits and costs?","difficulty":"hard","answer":"<p><strong>CQRS</strong> (Command Query Responsibility Segregation) separates the model that <strong>writes</strong> (commands that change state) from the model that <strong>reads</strong> (queries that return data). At its simplest they are just separate code paths; at its fullest they use separate stores, with read models projected from write-side events.</p><p><strong>Benefits:</strong> each side is optimized and scaled independently (e.g., denormalized read models for fast queries), clearer code, and it pairs naturally with event sourcing. <strong>Costs:</strong> more complexity and moving parts, and (with separate stores) <strong>eventual consistency</strong> between write and read. Use it where read and write needs genuinely diverge, not everywhere.</p>","explanation":"CQRS is separating the kitchen (writing/cooking orders) from the menu display (reading). Each is optimized for its job, but the menu might briefly lag what the kitchen just changed.","bestPractices":["Start with simple command/query separation before separate stores","Use denormalized read models for hot queries","Apply where read/write needs diverge"],"commonMistakes":["Full CQRS + separate stores everywhere by default","Ignoring eventual consistency between write and read","Adding CQRS complexity with no real read/write divergence"],"interviewTip":"Distinguish lightweight (separate code paths) from full (separate stores + eventual consistency) CQRS, and state when it is worth the cost.","followUp":["How does CQRS relate to event sourcing?","How do you keep read models updated?","When is CQRS overkill?"]},
        {"question":"What is the Mediator pattern (e.g., MediatR), and what problems does it solve in an application layer?","difficulty":"medium","answer":"<p>The <strong>Mediator</strong> pattern routes requests to handlers through a central mediator instead of callers referencing handlers directly, decoupling senders from receivers. In .NET, MediatR sends a <em>command/query</em> to its single handler and can publish <em>notifications</em> to many handlers.</p><p>It solves: thin controllers (dispatch a request, no orchestration logic), one-handler-per-use-case organization (each command/query is a self-contained slice), and cross-cutting concerns via <strong>pipeline behaviors</strong> (validation, logging, transactions) applied uniformly around every handler. The cost is indirection — for tiny apps a direct service call is simpler.</p>","explanation":"A mediator is an air-traffic controller: pilots (callers) do not talk to each other directly; they talk to the tower, which routes each request to the right runway (handler) and enforces standard procedures (behaviors).","bestPractices":["One handler per command/query (vertical slice)","Use pipeline behaviors for validation/logging/transactions","Keep controllers thin — just send the request"],"commonMistakes":["Using MediatR for trivial apps (needless indirection)","Fat handlers doing many responsibilities","Hiding too much control flow behind the mediator"],"interviewTip":"Highlight pipeline behaviors (uniform cross-cutting concerns) and thin controllers as the real wins; acknowledge the indirection cost.","followUp":["What are pipeline behaviors used for?","How does Mediator enable CQRS?","When is direct service injection simpler?"]},
        {
            question: 'How do you handle cross-cutting concerns like transactions, validation, and caching with MediatR pipeline behaviors, and in what order?',
            difficulty: 'hard',
            answer: `<p>Pipeline behaviors wrap handler execution (like middleware). The <strong>order of registration
            matters</strong> because they nest \u2014 the first registered is outermost. A correct ordering:</p>
            <ol>
                <li><strong>Logging / correlation</strong> (outermost) \u2014 capture everything, including failures below.</li>
                <li><strong>Exception handling</strong> \u2014 translate exceptions to results consistently.</li>
                <li><strong>Validation</strong> \u2014 reject invalid requests <em>before</em> opening a transaction or
                running the handler (fail fast; don\u2019t start a DB transaction for a request that\u2019s invalid).</li>
                <li><strong>Caching</strong> (for queries) \u2014 return cached results without touching the handler.</li>
                <li><strong>Transaction / Unit of Work</strong> (innermost, around the handler) \u2014 begin, run handler,
                commit on success / rollback on exception.</li>
            </ol>
            <p>Getting order wrong causes real bugs: validation <em>inside</em> the transaction means invalid requests
            open and roll back transactions needlessly; caching outside validation could serve results for malformed
            input.</p>`,
            explanation: 'Behaviors are like nested gift wrapping around the handler. You want the cheap, protective layers (logging, validation) on the outside so a bad request is rejected before you pay for the expensive inner layers (opening a database transaction).',
            code: `// Registration order = nesting order (first = outermost)
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));      // 1 outer
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));   // 2 fail fast
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(CachingBehavior<,>));      // 3 queries
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(TransactionBehavior<,>));  // 4 inner

// TransactionBehavior wraps ONLY the handler, after validation has passed:
public async Task<TResponse> Handle(TRequest req, RequestHandlerDelegate<TResponse> next, CancellationToken ct) {
    using var tx = await _db.BeginTransactionAsync(ct);
    var response = await next();          // the handler
    await tx.CommitAsync(ct);
    return response;
}`,
            language: 'csharp',
            bestPractices: ['Validate before opening a transaction (fail fast)', 'Use marker interfaces (ITransactionalRequest, ICacheableQuery) to apply behaviors selectively', 'Keep logging/correlation outermost so failures are captured'],
            commonMistakes: ['Wrong order: transaction wrapping validation (invalid requests open transactions)', 'Caching commands (only queries should be cached)', 'Applying a transaction behavior to read-only queries'],
            interviewTip: 'Lead with "order matters because behaviors nest" and give the canonical order (logging -> validation -> caching -> transaction). Explaining the bug from wrong order (validation inside transaction) is the senior signal.',
            followUp: ['How do you apply a behavior to only some requests?', 'Where does the Outbox pattern fit relative to the transaction behavior?'],
            seniorPerspective: 'The pipeline is one of MediatR\u2019s biggest wins because it eliminates the copy-pasted try/catch/validate/transaction boilerplate from every handler \u2014 but the ordering is a real footgun. I use marker interfaces so behaviors apply selectively (only ITransactionalRequest gets a transaction, only ICacheableQuery gets cached), and I put the transaction as close to the handler as possible so validation and authorization have already passed before any DB work begins.'
        },
        {
            question: 'How do you publish domain events reliably when a command handler commits a transaction (dual-write problem)?',
            difficulty: 'hard',
            answer: `<p>A command handler often needs to both persist state <em>and</em> notify other parts of the system
            (domain/integration events). Doing the DB commit and the message publish as two separate operations is the
            <strong>dual-write problem</strong>: if the commit succeeds but the publish fails (or vice versa), the
            system is inconsistent.</p>
            <p>Reliable approaches:</p>
            <ul>
                <li><strong>In-process domain events:</strong> for same-process side effects, dispatch MediatR
                notifications <em>within</em> the same transaction (e.g., right before SaveChanges, or via EF Core
                SaveChanges interception) so they\u2019re part of the same atomic unit. But these are not durable across
                a crash.</li>
                <li><strong>Transactional Outbox (for cross-service/durable):</strong> within the same DB transaction
                as the state change, write the event to an outbox table. A separate relay publishes from the outbox to
                the broker (at-least-once). This guarantees the event is published iff the state was committed.</li>
            </ul>
            <p>Key point: MediatR\u2019s <code>Publish</code> is in-process and not durable \u2014 for cross-service events that
            must not be lost, use the Outbox, not raw notifications.</p>`,
            explanation: 'You can\u2019t safely "save to the database" and "send a message" as two separate steps \u2014 a crash between them loses one. The Outbox makes them one atomic database write (state + event row), then a background worker delivers the event, so they can never disagree.',
            code: `// Outbox: state change + event in ONE transaction
public async Task<Guid> Handle(PlaceOrderCommand cmd, CancellationToken ct) {
    var order = Order.Create(cmd.CustomerId, cmd.Items);
    _db.Orders.Add(order);
    _db.OutboxMessages.Add(OutboxMessage.From(new OrderPlaced(order.Id)));  // same tx
    await _db.SaveChangesAsync(ct);     // atomic: both or neither
    return order.Id;
}
// A relay process publishes unprocessed outbox rows to the broker (at-least-once).
// MediatR Publish is fine for IN-PROCESS handlers, but is NOT durable across crashes.`,
            language: 'csharp',
            bestPractices: ['Dispatch in-process domain events within the same transaction', 'Use the Transactional Outbox for durable, cross-service events', 'Make event consumers idempotent (at-least-once delivery)'],
            commonMistakes: ['Publishing to a broker directly after SaveChanges (dual-write race)', 'Treating MediatR Publish as durable cross-service messaging', 'No idempotency on consumers'],
            interviewTip: 'Distinguish in-process MediatR notifications (not durable) from durable cross-service events (Outbox). Naming the dual-write problem explicitly is exactly what interviewers listen for.',
            followUp: ['How does the Outbox relay achieve at-least-once delivery?', 'When are in-process domain events sufficient?'],
            seniorPerspective: 'I see teams reach for MediatR notifications to fire "integration events" and then lose them on a crash or a broker hiccup. The rule I enforce: if an event crossing a process/service boundary must not be lost, it goes through the Outbox so its publication is atomic with the state change. MediatR notifications are excellent for in-process decoupling (update a read model, send a welcome email best-effort), not for guaranteed delivery.'
        },
        {
            question: 'What is the Mediator pattern and what problem does it solve?',
            difficulty: 'easy',
            answer: `<p>The <strong>Mediator pattern</strong> defines an object that encapsulates how a set of objects
            interact. Instead of components referencing each other directly (creating a tangled web of
            dependencies), they communicate through a central mediator.</p>
            <p>It solves the problem of <strong>tight coupling between collaborating objects</strong>.
            Without a mediator, adding or changing one component often requires changing all the
            components it talks to. With a mediator, components only know about the mediator.</p>`,
            explanation: 'Think of an air traffic control tower. Planes don\'t coordinate landing directly with each other (chaos!). They all communicate with the control tower (mediator), which coordinates everything. Adding a new plane doesn\'t require it to know about every other plane.',
            bestPractices: [
                'Use when you have many components with complex, tangled interactions',
                'Keep the mediator focused — it can become a "god object" if it absorbs too much logic',
                'In .NET, MediatR implements this pattern for request/handler routing'
            ],
            commonMistakes: [
                'Letting the mediator become a god object with all the business logic',
                'Using it where simple direct calls would be clearer (over-engineering)'
            ],
            interviewTip: 'Give the air traffic control or chat room analogy, then connect it to MediatR in .NET. Mention that it is one of the GoF behavioral patterns.',
            followUp: [
                'How does MediatR implement this pattern?',
                'What is the difference between Mediator and Observer patterns?'
            ]
        },

        {
            question: 'Explain CQRS. When does it add value and when is it over-engineering?',
            difficulty: 'medium',
            answer: `<p><strong>CQRS (Command Query Responsibility Segregation)</strong> separates operations that
            change state (commands) from operations that read state (queries), often using different models
            for each.</p>
            <h4>When CQRS Adds Value</h4>
            <ul>
                <li>Read and write workloads differ significantly (high read:write ratio)</li>
                <li>Complex domain logic on writes, but simple flat data needs on reads</li>
                <li>You need to scale reads independently (read replicas, caching)</li>
                <li>Reporting/dashboard queries that don't fit the transactional model</li>
                <li>Event-sourced systems (commands produce events, queries read projections)</li>
            </ul>
            <h4>When It's Over-Engineering</h4>
            <ul>
                <li>Simple CRUD apps where read and write models are identical</li>
                <li>Small applications where the added structure provides no benefit</li>
                <li>Teams unfamiliar with the pattern building simple features</li>
            </ul>`,
            explanation: 'CQRS is like having separate "in" and "out" counters at a busy store. For a tiny shop, one counter handles both (CRUD). For a huge store with very different inbound (receiving, complex) and outbound (checkout, fast) needs, separate counters optimized for each flow makes sense.',
            bestPractices: [
                'Start with "lite CQRS" — separate command/query handlers on one database',
                'Only introduce separate read/write databases when you have proven scaling needs',
                'Design read models around specific query needs, not generic reuse',
                'Keep commands focused on a single business operation'
            ],
            commonMistakes: [
                'Assuming CQRS requires event sourcing or two databases (it does not)',
                'Applying CQRS to every entity reflexively, even simple lookup tables',
                'Building one giant read model instead of purpose-specific projections'
            ],
            interviewTip: 'Emphasize the spectrum: "CQRS ranges from simply separating command and query handlers on one database, all the way to separate read/write databases with event sourcing. I choose the level of separation based on actual needs, starting simple."',
            followUp: [
                'How does CQRS relate to event sourcing?',
                'How do you handle the read model being stale?',
                'Can you do CQRS without MediatR?'
            ],
            seniorPerspective: 'In practice I use "lite CQRS" on most projects — command and query handlers sharing one database, with queries projecting directly to DTOs via Dapper for performance and commands using the full EF Core domain model. Full CQRS with separate databases is reserved for genuinely high-scale read scenarios where the operational complexity is justified.',
            architectPerspective: 'CQRS is an enabler for independent scaling and polyglot persistence. At the architecture level, the decision point is: do read and write have fundamentally different scaling, consistency, or modeling needs? If yes, CQRS lets each side evolve independently. If no, it is accidental complexity. The cost is eventual consistency between sides and the cognitive overhead of two models.'
        },

        {
            question: 'How do pipeline behaviors work in MediatR and what would you use them for?',
            difficulty: 'medium',
            answer: `<p><strong>Pipeline behaviors</strong> are components that wrap the execution of a request handler,
            similar to ASP.NET middleware but at the application layer. Each behavior can run logic before
            and after the handler, and decides whether to call the next behavior/handler.</p>
            <h4>How They Work</h4>
            <p>Behaviors form a chain. When a request is sent, it passes through each registered behavior
            in order, eventually reaching the handler, then the responses flow back through the chain
            in reverse. Each behavior receives a <code>next</code> delegate to invoke the rest of the pipeline.</p>
            <h4>Common Uses</h4>
            <ul>
                <li><strong>Validation:</strong> Validate the request before the handler runs (fail fast)</li>
                <li><strong>Logging:</strong> Log request/response and timing for every operation</li>
                <li><strong>Transactions:</strong> Begin a transaction, run the handler, commit on success</li>
                <li><strong>Caching:</strong> Return cached results for cacheable queries</li>
                <li><strong>Performance monitoring:</strong> Warn on slow requests</li>
                <li><strong>Authorization:</strong> Check permissions before the handler executes</li>
            </ul>`,
            code: `// Performance monitoring behavior
public class PerformanceBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse> where TRequest : notnull
{
    private readonly ILogger _logger;
    private readonly Stopwatch _timer = new();

    public async Task<TResponse> Handle(TRequest request,
        RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        _timer.Start();
        var response = await next(); // Invoke rest of pipeline + handler
        _timer.Stop();

        if (_timer.ElapsedMilliseconds > 500)
            _logger.LogWarning("Slow request {Name} took {Ms}ms",
                typeof(TRequest).Name, _timer.ElapsedMilliseconds);

        return response;
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Register behaviors in the correct order — validation before transaction before handler',
                'Keep each behavior focused on a single concern',
                'Use marker interfaces (ITransactional, ICacheable) to apply behaviors selectively',
                'Make behaviors generic so they apply to all requests automatically'
            ],
            commonMistakes: [
                'Wrong behavior order (e.g., transaction wrapping validation, so invalid requests open transactions)',
                'Putting business logic in behaviors instead of handlers',
                'Applying expensive behaviors to all requests instead of selectively'
            ],
            interviewTip: 'Compare them explicitly to ASP.NET middleware: "Pipeline behaviors are to MediatR what middleware is to the HTTP pipeline — they wrap execution to handle cross-cutting concerns. The key advantage is they apply to every command/query without polluting handler code."',
            followUp: [
                'In what order would you register validation, logging, and transaction behaviors?',
                'How do you apply a behavior to only some requests?'
            ]
        },

        {
            question: 'What is the difference between sending a command and publishing a notification in MediatR?',
            difficulty: 'hard',
            answer: `<p>This distinction is fundamental to using MediatR correctly:</p>
            <h4>Send (Request/Response)</h4>
            <ul>
                <li>Used for commands and queries</li>
                <li>Exactly ONE handler processes the request</li>
                <li>Returns a response to the caller</li>
                <li>If no handler or multiple handlers are registered, it throws</li>
                <li>Method: <code>mediator.Send(request)</code></li>
            </ul>
            <h4>Publish (Notification)</h4>
            <ul>
                <li>Used for events/notifications (something happened)</li>
                <li>ZERO to MANY handlers can process it (fan-out)</li>
                <li>Returns void (no response to caller)</li>
                <li>By default, handlers run sequentially; you can customize for parallel</li>
                <li>Method: <code>mediator.Publish(notification)</code></li>
            </ul>
            <h4>When to Use Each</h4>
            <p>Use <strong>Send</strong> when you need exactly one thing to happen and possibly a result
            (create an order, get a customer). Use <strong>Publish</strong> when an event occurred and
            multiple independent reactions should happen (order placed → email + analytics + inventory).</p>`,
            code: `// SEND — one handler, returns result
public record CreateOrderCommand(...) : IRequest<Guid>;  // IRequest<T>
var orderId = await _mediator.Send(new CreateOrderCommand(...));

// PUBLISH — many handlers, no result
public record OrderPlacedNotification(...) : INotification; // INotification
await _mediator.Publish(new OrderPlacedNotification(...));
// → SendEmailHandler, UpdateAnalyticsHandler, ReserveInventoryHandler all run

// Custom publish strategy for parallel execution
public class ParallelPublisher : INotificationPublisher
{
    public async Task Publish(IEnumerable<NotificationHandlerExecutor> handlers,
        INotification notification, CancellationToken ct)
    {
        await Task.WhenAll(handlers.Select(h =>
            h.HandlerCallback(notification, ct)));
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Use Send for commands/queries (one handler, possibly returns data)',
                'Use Publish for domain events (multiple independent reactions)',
                'Consider error handling — one failing notification handler can stop others (sequential)',
                'For critical fan-out, consider a message broker instead of in-process notifications'
            ],
            commonMistakes: [
                'Using Publish when you need a guaranteed single handler and a result',
                'Assuming notification handlers run in parallel (default is sequential)',
                'Not handling the case where one notification handler throws (stops the rest)',
                'Using in-process notifications for cross-service events (use a broker instead)'
            ],
            interviewTip: 'Crisp summary: "Send = one handler, returns a result, for commands and queries. Publish = many handlers, no result, for notifications and domain events." Then mention the gotcha: notification handlers run sequentially by default, so one failure can prevent others from running.',
            followUp: [
                'What happens if one notification handler throws an exception?',
                'When would you use a message broker instead of in-process notifications?',
                'How do you make notification handlers run in parallel?'
            ],
            seniorPerspective: 'A subtle production issue: in-process notifications are NOT durable. If the process crashes after publishing but before a handler completes, that work is lost. For critical side effects (sending payment confirmations), I use the Outbox pattern with a real message broker rather than MediatR notifications. MediatR notifications are great for in-process decoupling, not for guaranteed delivery.'
        }
    ]
});
