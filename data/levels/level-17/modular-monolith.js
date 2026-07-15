'use strict';

PageData.register('modular-monolith', {
  title: 'Modular Monolith & Vertical Slice',
  description: 'Architecture patterns that deliver modular boundaries without the operational complexity of microservices. Covers vertical slice design, module isolation, inter-module communication, and migration strategies.',
  sections: [
    {
      title: 'Introduction',
      content: `
        <p>The modular monolith is not a compromise — it's a deliberate architectural choice that provides module isolation and independent development while avoiding the distributed systems tax of microservices. For teams under 50 engineers, it's often the right default.</p>
        <p>Vertical Slice Architecture complements this by organizing code around features (use cases) rather than technical layers. Instead of Controllers/Services/Repositories folders containing 200 files each, you get feature folders with everything needed for a single operation.</p>
        <p>At Staff+ level, you must know when microservices are overkill, how to enforce module boundaries within a monolith, and how to design the system so that extracting a module into a separate service is straightforward when the time comes.</p>
      `
    },
    {
      title: 'Core Concepts',
      content: `
        <p><strong>Module = Bounded Context</strong>: Each module owns a cohesive set of business capabilities, its own data, and exposes only a public API (contracts). Internal implementation is hidden — no reaching into another module's database tables or internal classes.</p>
        <p><strong>Vertical Slice</strong>: Instead of horizontal layers (Controller → Service → Repository), organize by feature. Each slice is a self-contained handler: receives a request, does the work, returns a response. Slices are independent — changing one doesn't affect others.</p>
        <p><strong>Why not microservices?</strong> Microservices add network calls, distributed transactions, deployment complexity, observability overhead, and eventual consistency challenges. These costs are justified only when you need independent deployment, polyglot stacks, or team autonomy at scale (>50 engineers).</p>
        <p><strong>Module communication</strong>: Modules communicate through in-process events (MediatR notifications), well-defined interfaces, or an internal message bus. Never through direct database access or internal class references.</p>
      `
    },
    {
      title: 'Module Boundaries & Architecture',
      mermaid: `graph TD
    subgraph "Modular Monolith"
        subgraph "Orders Module"
            OC[Orders.Contracts<br/>Public interfaces & DTOs]
            OI[Orders.Internal<br/>Handlers, Entities, DB]
        end
        subgraph "Inventory Module"
            IC[Inventory.Contracts<br/>Public interfaces & DTOs]
            II[Inventory.Internal<br/>Handlers, Entities, DB]
        end
        subgraph "Payments Module"
            PC[Payments.Contracts<br/>Public interfaces & DTOs]
            PI[Payments.Internal<br/>Handlers, Entities, DB]
        end
        subgraph "Shared Kernel"
            SK[Common value objects<br/>Integration events<br/>Base classes]
        end
    end
    OI -->|references| OC
    OI -->|publishes events| IC
    II -->|references| IC
    OI -->|calls interface| PC
    PI -->|references| PC
    OI -.->|uses| SK
    II -.->|uses| SK
    PI -.->|uses| SK
    OI ---|"NEVER directly references"| II`,
      content: `
        <p><strong>Two-project-per-module pattern</strong>:</p>
        <ul>
          <li><strong>Module.Contracts</strong> (public): Interfaces, DTOs, integration events, command/query definitions. Other modules reference only this.</li>
          <li><strong>Module.Internal</strong> (private): Handlers, entities, repositories, database context. No other module can reference this project.</li>
        </ul>
        <p><strong>Enforcement mechanisms</strong>:</p>
        <ul>
          <li>Project references: Internal projects only reference their own Contracts + Shared Kernel</li>
          <li>Architecture tests (NetArchTest/ArchUnitNet): Automated rules that fail the build if boundaries are violated</li>
          <li>Access modifiers: Internal classes in Internal project are inaccessible from outside</li>
        </ul>
        <p><strong>Shared Kernel</strong>: Minimal shared code — value objects (Money, DateRange), base types (Entity, AggregateRoot), and integration event base classes. Keep it thin — shared kernel coupling affects all modules.</p>
      `
    },
    {
      title: 'Vertical Slice Architecture',
      mermaid: `graph LR
    subgraph "Traditional Layered"
        C1[OrdersController] --> S1[OrderService]
        S1 --> R1[OrderRepository]
        C2[ProductsController] --> S2[ProductService]
        S2 --> R2[ProductRepository]
    end
    subgraph "Vertical Slice"
        subgraph "CreateOrder Slice"
            H1[CreateOrder.Handler]
            H1 --> DB1[(Database)]
        end
        subgraph "GetProduct Slice"
            H2[GetProduct.Handler]
            H2 --> DB2[(Database)]
        end
        subgraph "CancelOrder Slice"
            H3[CancelOrder.Handler]
            H3 --> DB3[(Database)]
        end
    end`,
      content: `
        <p><strong>Feature folder structure</strong>:</p>
        <pre>
Features/
  CreateOrder/
    CreateOrderCommand.cs     (request DTO)
    CreateOrderHandler.cs     (business logic)
    CreateOrderValidator.cs   (FluentValidation)
    CreateOrderEndpoint.cs    (minimal API mapping)
  GetOrderById/
    GetOrderByIdQuery.cs
    GetOrderByIdHandler.cs
    GetOrderByIdEndpoint.cs
  CancelOrder/
    CancelOrderCommand.cs
    CancelOrderHandler.cs
    CancelOrderValidator.cs
    CancelOrderEndpoint.cs
        </pre>
        <p><strong>Benefits</strong>:</p>
        <ul>
          <li><strong>Locality</strong>: Everything for a feature is in one folder. No jumping between 5 layers to understand one operation.</li>
          <li><strong>Independence</strong>: Changing CreateOrder doesn't risk breaking GetOrder — they share nothing except the database schema.</li>
          <li><strong>Right abstraction per slice</strong>: Simple CRUD slices can use direct EF Core. Complex slices can use domain model + repository. No forced uniformity.</li>
          <li><strong>Easy to delete</strong>: Remove a feature by deleting one folder. In layered architecture, removing a feature means editing 5+ files across layers.</li>
        </ul>
      `
    },
    {
      title: 'Inter-Module Communication Patterns',
      content: `
        <p>Modules must communicate without coupling their internals. Three main patterns:</p>
        <p><strong>1. Synchronous via interfaces (contracts)</strong>:</p>
        <ul>
          <li>Module A defines <code>IInventoryChecker</code> in its Contracts project</li>
          <li>Inventory Module implements it in its Internal project</li>
          <li>DI container wires them together — the caller doesn't know the implementation</li>
          <li>Best for: queries where you need an immediate answer</li>
        </ul>
        <p><strong>2. In-process events (MediatR INotification)</strong>:</p>
        <ul>
          <li>Module A publishes <code>OrderPlacedEvent</code> via MediatR</li>
          <li>Inventory Module has a handler that listens and reserves stock</li>
          <li>Decoupled — publisher doesn't know who listens</li>
          <li>Best for: side effects that shouldn't block the main operation</li>
        </ul>
        <p><strong>3. Internal message bus (outbox pattern)</strong>:</p>
        <ul>
          <li>Events stored in an outbox table within the publisher's transaction</li>
          <li>Background processor dispatches to subscribers</li>
          <li>Provides at-least-once delivery guarantee even within the monolith</li>
          <li>Best for: eventual consistency between modules, preparation for future extraction</li>
        </ul>
      `,
      code: {
        language: 'csharp',
        content: `// Module communication via MediatR
// In Orders.Contracts project (public)
public record OrderPlacedEvent(Guid OrderId, List<OrderItem> Items) : INotification;

public interface IInventoryChecker
{
    Task<bool> IsInStockAsync(string sku, int quantity);
}

// In Orders.Internal project
public class PlaceOrderHandler : IRequestHandler<PlaceOrderCommand, OrderResult>
{
    private readonly IInventoryChecker _inventory;
    private readonly IMediator _mediator;
    private readonly OrdersDbContext _db;

    public PlaceOrderHandler(
        IInventoryChecker inventory, IMediator mediator, OrdersDbContext db)
    {
        _inventory = inventory;
        _mediator = mediator;
        _db = db;
    }

    public async Task<OrderResult> Handle(
        PlaceOrderCommand cmd, CancellationToken ct)
    {
        // Synchronous cross-module call
        if (!await _inventory.IsInStockAsync(cmd.Sku, cmd.Quantity))
            return OrderResult.OutOfStock();

        var order = Order.Create(cmd);
        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);

        // Async notification - fire and forget to other modules
        await _mediator.Publish(
            new OrderPlacedEvent(order.Id, order.Items), ct);

        return OrderResult.Success(order.Id);
    }
}

// In Inventory.Internal project (separate module)
public class ReserveStockOnOrderPlaced : INotificationHandler<OrderPlacedEvent>
{
    private readonly InventoryDbContext _db;

    public ReserveStockOnOrderPlaced(InventoryDbContext db) => _db = db;

    public async Task Handle(OrderPlacedEvent notification, CancellationToken ct)
    {
        foreach (var item in notification.Items)
            await ReserveStockAsync(item.Sku, item.Quantity, ct);
    }
}`
      }
    },
    {
      title: 'Module Database Isolation',
      content: `
        <p><strong>Schema-per-module</strong> (recommended): Each module owns a schema in the same database. Orders module uses <code>orders.*</code> tables, Inventory uses <code>inventory.*</code>. Enforced via DbContext configuration.</p>
        <p><strong>Advantages of shared database with schema isolation</strong>:</p>
        <ul>
          <li>Single connection string, single backup, single deployment</li>
          <li>Can still use cross-schema JOINs for reporting (read path) while enforcing write isolation</li>
          <li>Migrations per module (separate migration scripts per schema)</li>
          <li>Easy transition to separate databases later if needed</li>
        </ul>
        <p><strong>Rules</strong>:</p>
        <ul>
          <li>A module's DbContext only maps tables in its own schema</li>
          <li>No foreign keys across schemas (use IDs as references, resolve via APIs)</li>
          <li>Cross-module reads go through contracts/interfaces, not direct SQL</li>
          <li>If you need denormalized read models, use integration events to project into local tables</li>
        </ul>
        <p><strong>Alternative: Database-per-module</strong>: Full isolation but adds connection management complexity. Use when modules have radically different storage needs (SQL vs NoSQL) or when preparing for extraction.</p>
        <p><strong>DbContext configuration for schema isolation</strong>:</p>
      `,
      code: {
        language: 'csharp',
        content: `// Schema-per-module DbContext configuration
public class OrdersDbContext : DbContext
{
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        // All Orders module tables in 'orders' schema
        builder.HasDefaultSchema("orders");

        builder.Entity<Order>(e =>
        {
            e.ToTable("Orders"); // → orders.Orders
            e.HasKey(o => o.Id);
            e.Property(o => o.CustomerId)
                .IsRequired(); // Reference to Customers module by ID only
            // NO navigation property to Customer entity (different module)
        });
    }
}

public class InventoryDbContext : DbContext
{
    public DbSet<StockItem> StockItems => Set<StockItem>();
    public DbSet<Reservation> Reservations => Set<Reservation>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.HasDefaultSchema("inventory");

        builder.Entity<StockItem>(e =>
        {
            e.ToTable("StockItems"); // → inventory.StockItems
            e.HasKey(s => s.Sku);
        });
    }
}

// Module registration - each module registers its own DbContext
public static class OrdersModuleExtensions
{
    public static IServiceCollection AddOrdersModule(
        this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<OrdersDbContext>(options =>
            options.UseSqlServer(config.GetConnectionString("Default")));

        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(OrdersDbContext).Assembly));

        // Register module's public interface implementations
        services.AddScoped<IOrderQueryService, OrderQueryService>();
        return services;
    }
}`
      }
    },
    {
      title: 'Migration Path to Microservices',
      content: `
        <p>A well-designed modular monolith makes microservice extraction straightforward because the boundaries already exist:</p>
        <p><strong>Step 1: Identify extraction candidate</strong>: Module with independent scaling needs, different deployment cadence, or team ownership boundary.</p>
        <p><strong>Step 2: Replace in-process communication with HTTP/gRPC</strong>: The Contracts project becomes a shared client library. Handlers become API endpoints. Events become messages on a broker.</p>
        <p><strong>Step 3: Separate the database</strong>: If using schema-per-module, migrate the schema to its own database. Use change data capture or dual-writes during transition.</p>
        <p><strong>Step 4: Deploy independently</strong>: Extract the module's Internal project into its own service. The Contracts project becomes a NuGet package consumed by other services.</p>
        <p><strong>When to extract</strong>: Extract when the cost of extraction is less than the cost of not extracting. Common triggers: module needs independent scaling, team conflict on deploy cadence, technology mismatch (module needs different language/framework).</p>
        <p><strong>When NOT to extract</strong>: "It would be cleaner" is not a reason. If teams can coordinate releases, the monolith deploys fast, and no module has dramatically different scaling needs — keep it monolithic.</p>
      `
    },
    {
      title: 'Testing in Vertical Slices',
      content: `
        <p><strong>Integration tests per slice</strong>: Each slice gets its own integration test that exercises the full pipeline: HTTP request → handler → database → response. Use WebApplicationFactory for in-process testing.</p>
        <p><strong>Why integration tests dominate</strong>: In vertical slice architecture, there's less value in unit testing individual layers (no service classes with business logic to unit test in isolation). The handler IS the unit — test it end-to-end.</p>
        <p><strong>Testing strategy</strong>:</p>
        <ul>
          <li><strong>Per-slice integration tests</strong>: Cover the happy path and key error cases for each feature</li>
          <li><strong>Architecture tests</strong>: Verify module boundaries aren't violated (NetArchTest)</li>
          <li><strong>Contract tests</strong>: Verify that module interfaces are honored (especially before extracting to microservices)</li>
          <li><strong>Domain model unit tests</strong>: For complex business logic in domain entities/value objects</li>
        </ul>
        <p><strong>Test isolation</strong>: Each test creates its own database (TestContainers) or uses per-test transactions that rollback. Modules with separate schemas simplify test data setup — each test only provisions its module's schema.</p>
      `
    },
    {
      title: 'Common Mistakes',
      content: `
        <ul>
          <li><strong>Modules sharing database tables</strong>: If two modules read/write the same table, they're not independent. One module should own the table; the other gets data through events or APIs.</li>
          <li><strong>Treating modular monolith as temporary</strong>: "We'll extract to microservices eventually" leads to cutting corners on boundaries. Design it as if it will stay monolithic — that discipline creates clean extraction points if needed.</li>
          <li><strong>Too many modules</strong>: 20 modules for 5 developers creates coordination overhead. Start with 3-5 modules matching team structure. Split modules when they grow too large for one team to own.</li>
          <li><strong>Shared ORM context across modules</strong>: A single DbContext mapping all tables defeats module isolation. Each module must have its own DbContext mapping only its tables.</li>
          <li><strong>Over-engineering communication</strong>: Using a full message broker (RabbitMQ) for in-process module communication is unnecessary complexity. MediatR notifications are sufficient until you extract.</li>
          <li><strong>Vertical slices without cohesion</strong>: Having 200 independent slices with no grouping becomes chaos. Group slices into modules/features for discoverability.</li>
        </ul>
      `
    },
    {
      title: 'Interview Tips',
      callout: true,
      content: `
        <p><strong>Lead with "it depends"</strong>: When asked "monolith vs microservices?" — the answer is always context-dependent. Ask about team size, deployment frequency, scaling requirements, and organizational structure before recommending an architecture.</p>
        <p><strong>Reference Conway's Law</strong>: "Architecture mirrors communication structure." A 5-person team building 10 microservices creates more coordination overhead than value. Match architecture to team topology.</p>
        <p><strong>Show migration awareness</strong>: "We'd start as a modular monolith with clear module boundaries and schema isolation. This gives us the option to extract modules into services when we hit specific triggers: independent scaling needs, different deployment cadence, or team growth beyond what a single repo supports."</p>
        <p><strong>Name specific tools</strong>: MediatR/Wolverine for command handling, NetArchTest for boundary enforcement, TestContainers for integration testing, outbox pattern for reliable events. Tool familiarity signals practical experience.</p>
        <p><strong>Discuss trade-offs of vertical slices</strong>: "We lose the ability to enforce cross-cutting concerns in a single layer, but gain feature isolation and simpler reasoning about each operation."</p>
      `
    },
    {
      title: 'Key Takeaways',
      content: `
        <ul>
          <li>Modular monolith is the right default for most teams — it provides module isolation without distributed systems complexity</li>
          <li>Module = Bounded Context: each module owns its data, exposes only contracts, and communicates through well-defined interfaces or events</li>
          <li>Vertical Slice Architecture organizes by feature, not layer — each use case is a self-contained handler that can use the right level of abstraction</li>
          <li>Schema-per-module in a shared database gives data isolation with deployment simplicity — no cross-schema foreign keys, communicate through APIs</li>
          <li>MediatR notifications provide in-process event-driven communication between modules — no message broker needed until extraction</li>
          <li>Architecture tests (NetArchTest) automatically enforce boundaries — catches violations at build time before they become entangled dependencies</li>
          <li>Extract to microservices only when triggered by scaling needs, team growth, or deployment cadence conflicts — never for aesthetic reasons</li>
          <li>The two-project-per-module pattern (Contracts + Internal) makes extraction mechanical rather than archaeological</li>
        </ul>
      `
    }
  ],
  advancedTopics: [
    {
      title: 'Architecture Testing with NetArchTest',
      content: `
        <p>Architecture tests encode structural rules as executable specifications. They run in CI and fail the build if module boundaries are violated — catching architectural drift before it becomes technical debt.</p>
        <p><strong>Common rules to enforce</strong>:</p>
        <ul>
          <li>Internal projects must not reference other Internal projects (only Contracts)</li>
          <li>Domain entities must not reference infrastructure (EF Core, HTTP clients)</li>
          <li>Handlers must be internal (not publicly accessible outside their module)</li>
          <li>All commands/queries must be in the Contracts project (public API)</li>
          <li>No circular dependencies between modules</li>
        </ul>
        <p><strong>Example test patterns</strong>: Use NetArchTest's fluent API to express rules like: Types.InAssembly("Orders.Internal").Should().NotHaveDependencyOn("Inventory.Internal"). Also verify naming conventions: Types.That().ImplementInterface(typeof(IRequestHandler)).Should().HaveNameEndingWith("Handler").</p>
        <p><strong>Running architecture tests</strong>: They execute in milliseconds (static analysis, no runtime). Include in the unit test suite. Every PR runs them. Violations get immediate feedback without waiting for integration tests.</p>
      `,
      code: {
        language: 'csharp',
        content: `// Architecture enforcement tests with NetArchTest
[TestClass]
public class ModuleBoundaryTests
{
    private static readonly Assembly OrdersInternal =
        typeof(Orders.Internal.PlaceOrderHandler).Assembly;
    private static readonly Assembly InventoryInternal =
        typeof(Inventory.Internal.ReserveStockHandler).Assembly;
    private static readonly Assembly PaymentsInternal =
        typeof(Payments.Internal.ChargePaymentHandler).Assembly;

    [TestMethod]
    public void Orders_Should_Not_Reference_Inventory_Internals()
    {
        var result = Types.InAssembly(OrdersInternal)
            .Should()
            .NotHaveDependencyOn("Inventory.Internal")
            .GetResult();

        Assert.IsTrue(result.IsSuccessful,
            $"Orders references Inventory internals: " +
            $"{string.Join(", ", result.FailingTypes?.Select(t => t.Name) ?? Array.Empty<string>())}");
    }

    [TestMethod]
    public void Orders_Should_Not_Reference_Payments_Internals()
    {
        var result = Types.InAssembly(OrdersInternal)
            .Should()
            .NotHaveDependencyOn("Payments.Internal")
            .GetResult();

        Assert.IsTrue(result.IsSuccessful);
    }

    [TestMethod]
    public void All_Handlers_Should_Be_Internal()
    {
        var assemblies = new[] { OrdersInternal, InventoryInternal, PaymentsInternal };

        foreach (var assembly in assemblies)
        {
            var result = Types.InAssembly(assembly)
                .That().ImplementInterface(typeof(IRequestHandler<,>))
                .Should().NotBePublic()
                .GetResult();

            Assert.IsTrue(result.IsSuccessful,
                $"Public handlers found in {assembly.GetName().Name}");
        }
    }

    [TestMethod]
    public void No_Module_Should_Reference_Another_Modules_DbContext()
    {
        var result = Types.InAssembly(OrdersInternal)
            .Should()
            .NotHaveDependencyOnAny(
                "Inventory.Internal.InventoryDbContext",
                "Payments.Internal.PaymentsDbContext")
            .GetResult();

        Assert.IsTrue(result.IsSuccessful);
    }
}`
      }
    },
    {
      title: 'Feature Flags & Module Toggling',
      content: `
        <p>In a modular monolith, feature flags operate at both the feature slice level and the module level:</p>
        <p><strong>Slice-level flags</strong>: Toggle individual features (new checkout flow, redesigned search). Each vertical slice can be independently enabled/disabled. Implement via MediatR pipeline behavior that checks flag before executing handler.</p>
        <p><strong>Module-level flags</strong>: Enable/disable entire modules. Useful for gradual rollout of new business capabilities. Module registration in DI becomes conditional: <code>if (flags.IsEnabled("NotificationsV2")) services.AddNotificationsModule();</code></p>
        <p><strong>Progressive delivery</strong>: Canary new modules to a subset of users. Route requests to the new module for flagged users, old behavior for others. Same deployment artifact, different runtime behavior per user.</p>
        <p><strong>Module versioning</strong>: Run V1 and V2 of a module simultaneously. Route traffic progressively from V1 → V2. When V2 is stable, remove V1 code. This is the monolith equivalent of blue-green deployment at the module level.</p>
      `
    },
    {
      title: 'CQRS Within Modules',
      content: `
        <p><strong>Command side</strong>: Full domain model with validation, business rules, and aggregate boundaries. Uses write-optimized storage (normalized tables, strong consistency). Commands go through MediatR pipeline with validation + transaction behaviors.</p>
        <p><strong>Query side</strong>: Denormalized read models optimized for specific UI views. May use different storage (Dapper raw SQL, materialized views, or even a read-optimized document store). Queries bypass the domain model entirely — read directly from optimized projections.</p>
        <p><strong>Eventual consistency within a module</strong>: Write side publishes domain events. Projection handlers update read models asynchronously. For in-process monolith, "eventually" means milliseconds (same transaction or next event loop).</p>
        <p><strong>When CQRS in a modular monolith</strong>: When read and write models diverge significantly (dashboard views aggregating many entities vs normalized write model). When query performance matters and you need denormalized projections. NOT needed for simple CRUD modules — direct DbContext queries suffice.</p>
        <p><strong>Practical pattern</strong>: Command handlers use EF Core with rich domain model. Query handlers use Dapper with raw SQL against the same database. No separate read database needed — just different data access strategies per operation type.</p>
      `
    }
  ],
  questions: [
    {
      question: "When would you choose a modular monolith over microservices? What are the decision criteria?",
      difficulty: "hard",
      answer: "<p><strong>Choose modular monolith when</strong>:</p><ul><li><strong>Team size < 50 engineers</strong>: Microservices' coordination overhead exceeds their benefit for small teams. Conway's Law — architecture should match team structure.</li><li><strong>Domain boundaries are unclear</strong>: Getting service boundaries wrong in microservices is expensive (distributed monolith). A modular monolith lets you refactor boundaries cheaply (refactoring within a process is orders of magnitude easier than between services).</li><li><strong>Transactions span modules</strong>: If business operations naturally span what would be multiple services, the distributed transaction complexity (sagas, compensating actions) may not be justified.</li><li><strong>Operational maturity is low</strong>: Microservices require sophisticated observability, deployment pipelines, and incident response. If your team doesn't have these, microservices will slow you down.</li></ul><p><strong>Choose microservices when</strong>:</p><ul><li>Independent deployment is critical (100+ deploys/day per team)</li><li>Different modules need different technology stacks</li><li>Modules have dramatically different scaling profiles (one module is 100x more compute-intensive)</li><li>Organizational autonomy requires it (teams in different time zones, different management chains)</li></ul>",
      interviewTip: "Never answer this question as one-vs-the-other. Present it as a spectrum: monolith → modular monolith → microservices, with clear triggers for moving along the spectrum.",
      followUp: ["What is a distributed monolith and how do you avoid it?", "How does team topology influence architecture choice?"],
      seniorPerspective: "In practice, most successful companies started as monoliths and extracted services as they grew. Shopify, GitHub, and Basecamp are successful modular monoliths. The microservices-first approach has a high failure rate for startups.",
      architectPerspective: "The decision framework I use: What's the cost of getting boundaries wrong? In a monolith, it's a refactoring sprint. In microservices, it's a multi-quarter re-architecture. Start modular monolith, extract when you have evidence that extraction will pay for itself."
    },
    {
      question: "Explain Vertical Slice Architecture. How does it differ from Clean Architecture and what are its advantages?",
      difficulty: "medium",
      answer: "<p><strong>Clean Architecture</strong> organizes by technical concern: Controllers → Use Cases → Entities → Infrastructure. Code for a single feature is spread across 4+ layers. Changes to a feature touch multiple projects.</p><p><strong>Vertical Slice Architecture</strong> organizes by feature/use case: each operation (CreateOrder, GetProduct, CancelOrder) is a self-contained slice with its own handler, validation, and data access. Slices are independent of each other.</p><p><strong>Key differences</strong>:</p><ul><li><strong>Coupling direction</strong>: Clean Architecture couples vertically (features share horizontal layers). Vertical Slice couples within a feature (each slice is independent).</li><li><strong>Abstraction level</strong>: Clean Architecture enforces the same abstraction for all features (repository pattern everywhere). Vertical Slices let each feature choose its appropriate abstraction (simple CRUD? Direct DbContext. Complex domain logic? Full DDD aggregate).</li><li><strong>Change impact</strong>: Adding a field in Clean Architecture may touch Controller, DTO, Service, Repository, Entity (5 files). In Vertical Slice: Handler + Command (2 files in one folder).</li></ul><p><strong>Advantages of Vertical Slice</strong>: Feature locality, independent change, right-sized abstractions per feature, easy to delete features, reduced cognitive load (understand one folder, not five layers).</p>",
      interviewTip: "Acknowledge that both approaches have merit. Clean Architecture works well for small domains with uniform complexity. Vertical Slice shines when features vary in complexity and change independently.",
      followUp: ["How do you handle cross-cutting concerns (logging, validation, auth) in Vertical Slice Architecture?", "Can you combine Vertical Slice within a Clean Architecture outer structure?"],
      seniorPerspective: "The practical winner for web APIs is often a hybrid: Vertical Slices grouped into modules, with MediatR pipeline behaviors handling cross-cutting concerns (validation, logging, transaction management). This gives you feature independence with consistent infrastructure.",
      architectPerspective: "Vertical Slice Architecture reflects a maturity in understanding coupling. Clean Architecture reduces coupling between layers but increases coupling within layers (all services know about each other). Vertical Slices minimize coupling in both directions at the cost of potential duplication — which is usually the better trade-off."
    },
    {
      question: "How do you enforce module boundaries in a modular monolith? What prevents developers from bypassing them?",
      difficulty: "hard",
      answer: "<p><strong>Compile-time enforcement</strong>:</p><ul><li><strong>Project structure</strong>: Internal classes/DbContext in a separate project that other modules can't reference. Only the Contracts project (interfaces, DTOs) is referenced by other modules.</li><li><strong>Access modifiers</strong>: Use <code>internal</code> for everything in the Internal project. Only public types in Contracts.</li><li><strong>Architecture tests (NetArchTest)</strong>: Automated tests that verify dependency rules. Example: 'Orders.Internal must not reference Inventory.Internal'. Runs in CI — fails the build on violation.</li></ul><p><strong>Runtime enforcement</strong>:</p><ul><li><strong>Separate DbContext per module</strong>: EF Core context only maps its module's tables. Can't accidentally query another module's data.</li><li><strong>Schema isolation</strong>: Database user permissions can enforce schema boundaries (module A's connection can't write to module B's schema).</li></ul><p><strong>Process enforcement</strong>:</p><ul><li><strong>Code review</strong>: PRs adding cross-module references are rejected</li><li><strong>Module ownership</strong>: Each module has a team owner who reviews changes to its contracts</li><li><strong>ADRs</strong>: Architecture Decision Records document why boundaries exist</li></ul><p>The key insight: enforcement must be automated (tests, project structure) not just documented. Developers under pressure will take shortcuts unless the compiler/CI stops them.</p>",
      interviewTip: "Show the NetArchTest example code. Interviewers love seeing that you enforce architecture with tests, not just documentation and good intentions.",
      followUp: ["What is ArchUnitNet and how does it compare to NetArchTest?", "How do you handle the case where a new feature genuinely needs to cross module boundaries?"],
      seniorPerspective: "The biggest challenge isn't technical enforcement — it's organizational. New developers don't understand why boundaries exist and circumvent them. Invest in onboarding documentation and architecture ADRs that explain the 'why' behind each boundary.",
      architectPerspective: "Module boundaries should align with team boundaries (Conway's Law). If one team owns two modules, they'll naturally want to couple them for convenience. Either assign modules to separate teams or accept looser boundaries between same-team modules."
    },
    {
      question: "Describe the outbox pattern for reliable inter-module events. Why not just publish events directly?",
      difficulty: "advanced",
      answer: "<p><strong>The problem with direct publishing</strong>: If a handler saves to the database then publishes an event, two failure modes exist:</p><ol><li>DB commit succeeds, event publish fails → state changed but subscribers never know</li><li>Event published, DB commit fails → subscribers process an event for a change that didn't happen</li></ol><p>These create data inconsistency between modules that's extremely hard to debug.</p><p><strong>Outbox pattern solution</strong>:</p><ol><li>Handler writes business data AND the event to an <code>OutboxMessages</code> table in the same database transaction. Atomicity guaranteed.</li><li>A background processor polls OutboxMessages, publishes events, marks them as processed.</li><li>If publishing fails, the processor retries (at-least-once delivery).</li><li>Subscribers must be idempotent (handle duplicate events gracefully).</li></ol><p><strong>Implementation</strong>: The outbox table stores: Id, EventType, Payload (JSON), CreatedAt, ProcessedAt. A hosted service polls every 100ms-1s for unprocessed messages and dispatches them via MediatR or a message broker.</p><p><strong>Within a modular monolith</strong>: The outbox provides the same guarantees as a message broker but without external infrastructure. When you extract to microservices, replace the outbox polling with actual message broker publishing — the pattern is the same.</p>",
      interviewTip: "Draw the two failure scenarios without outbox, then show how the outbox eliminates them. This demonstrates you understand distributed systems concerns even within a monolith.",
      followUp: ["How do you handle outbox message ordering? Is it guaranteed?", "What is the inbox pattern and how does it complement the outbox?"],
      seniorPerspective: "In production, add monitoring: alert if OutboxMessages has unprocessed messages older than 30 seconds. This catches infrastructure issues before they cascade into data inconsistency between modules.",
      architectPerspective: "The outbox pattern is the bridge between modular monolith and microservices. It gives you eventually-consistent inter-module communication with reliability guarantees. When you extract a module, the outbox becomes a message broker producer — same semantics, different transport."
    },
    {
      question: "How would you structure a .NET solution for a modular monolith with 5 modules?",
      difficulty: "medium",
      answer: "<p><strong>Solution structure</strong>:</p><pre>Solution/\n├── src/\n│   ├── API/                        (Host - thin, just wires modules)\n│   │   └── Program.cs\n│   ├── Shared.Kernel/              (Base types, value objects)\n│   ├── Modules/\n│   │   ├── Orders/\n│   │   │   ├── Orders.Contracts/   (Public: DTOs, interfaces, events)\n│   │   │   └── Orders.Internal/    (Private: handlers, entities, DbContext)\n│   │   ├── Inventory/\n│   │   │   ├── Inventory.Contracts/\n│   │   │   └── Inventory.Internal/\n│   │   ├── Payments/\n│   │   │   ├── Payments.Contracts/\n│   │   │   └── Payments.Internal/\n│   │   ├── Shipping/\n│   │   │   ├── Shipping.Contracts/\n│   │   │   └── Shipping.Internal/\n│   │   └── Notifications/\n│   │       ├── Notifications.Contracts/\n│   │       └── Notifications.Internal/\n│   └── Infrastructure/             (Shared: EF migrations, email, etc.)\n├── tests/\n│   ├── Orders.IntegrationTests/\n│   ├── Inventory.IntegrationTests/\n│   └── Architecture.Tests/        (Boundary enforcement)\n└── Solution.sln</pre><p><strong>Key rules</strong>: API project references all *.Internal projects (for DI registration). Internal projects reference only their own Contracts + Shared.Kernel. Each Internal project has its own DbContext, migrations, and DI module registration.</p>",
      interviewTip: "Explain that each module registers itself via an IServiceCollection extension method (AddOrdersModule). The host just calls each module's registration. This keeps the host thin and modules self-contained.",
      followUp: ["How do you handle database migrations when each module has its own DbContext?", "How would you share authentication/authorization across modules?"],
      seniorPerspective: "In practice, each module also gets a ModuleInitializer class that registers its services, configures its DbContext, and sets up its MediatR handlers. The host Program.cs just calls builder.Services.AddOrdersModule(), AddInventoryModule(), etc.",
      architectPerspective: "This structure makes extraction mechanical: take the Internal project, wrap it in its own host (API), publish its Contracts as a NuGet package. The architecture test suite tells you exactly what integration points exist and need to become HTTP/gRPC calls."
    },
    {
      question: "What is the Wolverine/MediatR pipeline and how does it enable cross-cutting concerns in vertical slices?",
      difficulty: "medium",
      answer: "<p><strong>MediatR Pipeline Behaviors</strong> are middleware that wrap every handler invocation. They execute in order: outer behaviors run first, inner handler runs last. Equivalent to ASP.NET middleware but for command/query handling.</p><p><strong>Common pipeline behaviors</strong>:</p><ul><li><strong>Validation</strong>: FluentValidation before handler executes. Returns 400 without touching business logic.</li><li><strong>Logging</strong>: Log command/query entry, execution time, and result.</li><li><strong>Transaction</strong>: Wrap handler in a database transaction. Commit on success, rollback on exception.</li><li><strong>Caching</strong>: For queries, check cache before handler. Store result after handler.</li><li><strong>Authorization</strong>: Check permissions before handler executes.</li></ul><p><strong>Wolverine advantages over MediatR</strong>: Built-in outbox, saga support, scheduled messages, retry policies, and middleware (behaviors) are compile-time generated for performance. It's MediatR + MassTransit in one library, designed for modular monoliths that may grow into distributed systems.</p><p><strong>Key insight</strong>: Pipeline behaviors solve the 'cross-cutting concern' problem in vertical slices without requiring shared base classes or inheritance hierarchies. Each concern is composed orthogonally.</p>",
      interviewTip: "Compare to the decorator pattern: each pipeline behavior decorates the next. The handler doesn't know about validation, logging, or transactions — it just does business logic.",
      followUp: ["How do you order pipeline behaviors when multiple apply?", "What is the performance overhead of MediatR's pipeline vs direct method calls?"],
      seniorPerspective: "MediatR's reflection-based handler discovery has measurable overhead in high-throughput scenarios (~1μs per dispatch). For most web APIs this is irrelevant. For hot paths (10K+ dispatches/sec), consider Wolverine's source-generated approach or direct DI.",
      architectPerspective: "The pipeline pattern represents the inversion of control principle applied to feature infrastructure. Instead of features pulling in their infrastructure dependencies (logging, caching, auth), the infrastructure wraps features transparently. This is the key to keeping vertical slices clean."
    },
    {
      question: "How do you handle a business operation that spans multiple modules without distributed transactions?",
      difficulty: "expert",
      answer: "<p><strong>The problem</strong>: PlaceOrder requires: (1) Inventory check + reserve, (2) Payment charge, (3) Order creation. In microservices, this would be a saga. In a modular monolith, you have options:</p><p><strong>Option 1: Orchestration within a single transaction</strong> (simplest, if all modules share a database):</p><ul><li>The PlaceOrder handler uses a single DbContext transaction spanning all schemas</li><li>Calls inventory, payment, and order modules synchronously</li><li>If any step fails, everything rolls back atomically</li><li>Downside: tight coupling, long-running transaction, doesn't prepare for extraction</li></ul><p><strong>Option 2: Saga pattern within the monolith</strong> (prepares for extraction):</p><ul><li>PlaceOrder handler only creates the order in 'Pending' state</li><li>Publishes OrderPendingEvent → Inventory reserves stock</li><li>Inventory publishes StockReservedEvent → Payment charges</li><li>Payment publishes PaymentCompletedEvent → Order moves to 'Confirmed'</li><li>If any step fails, compensating events undo previous steps</li></ul><p><strong>Option 3: Process Manager</strong>:</p><ul><li>A dedicated ProcessManager handler orchestrates the steps</li><li>Maintains saga state (which steps completed, which pending)</li><li>Handles timeouts and compensation centrally</li><li>Best for complex multi-step operations with multiple failure scenarios</li></ul><p><strong>Recommendation</strong>: Use Option 1 if modules share a database and you're not planning extraction soon. Use Option 2/3 if modules have separate databases or you're preparing for microservice extraction.</p>",
      interviewTip: "Show that you understand the progression: start with the simplest option (single transaction), move to eventual consistency only when forced by infrastructure constraints or extraction needs.",
      followUp: ["How do you handle timeouts in a saga within a modular monolith?", "What is the difference between choreography and orchestration sagas?"],
      seniorPerspective: "The biggest mistake is implementing sagas in a modular monolith from day one 'because microservices do it.' If your modules share a database, use a transaction. You can always refactor to sagas when you actually extract. YAGNI applies to architectural patterns too.",
      architectPerspective: "This question reveals architectural maturity. Junior architects over-engineer with sagas everywhere. Staff+ engineers choose the simplest solution that meets current requirements while maintaining the option (not obligation) for future extraction."
    },
    {
      question: "When do microservices become overkill? Give specific examples.",
      difficulty: "hard",
      answer: "<p><strong>Microservices are overkill when</strong>:</p><p><strong>1. Small team (< 10 engineers)</strong>: A 5-person team managing 8 microservices spends more time on infrastructure (deployment pipelines, service mesh, distributed tracing) than building features. The overhead-to-value ratio is inverted.</p><p><strong>2. Startup with evolving domain</strong>: Service boundaries drawn at month 3 will be wrong by month 12. Refactoring across service boundaries requires coordinated deployments, API versioning, and data migration. In a monolith, it's a single PR.</p><p><strong>3. Uniform scaling requirements</strong>: If all parts of the system handle similar load, there's no benefit to independent scaling. You're just adding network hops and failure modes.</p><p><strong>4. Strong consistency requirements</strong>: If business logic requires ACID transactions across what would be multiple services, you'll implement distributed transactions (2PC or sagas) — vastly more complex than a single-database transaction.</p><p><strong>5. Low deployment frequency</strong>: If you deploy weekly, the independent deployment advantage of microservices is unused. You're paying the complexity cost without the velocity benefit.</p><p><strong>Real examples</strong>: Segment rewrote microservices back to a monolith (reduced maintenance burden by 80%). Shopify runs on a modular monolith (billions in GMV). Basecamp/Hey runs on a monolith (millions of users).</p>",
      interviewTip: "Name real companies that chose monoliths successfully. This shows you're not just repeating theory but have studied actual architectural decisions and their outcomes.",
      followUp: ["What is the 'distributed monolith' anti-pattern and how do teams accidentally create it?", "How does team topology influence the monolith vs microservices decision?"],
      seniorPerspective: "The honest answer for most teams: you'll know you need microservices when the pain of the monolith exceeds the pain of distribution. If you're asking 'should we use microservices?' — you probably shouldn't yet.",
      architectPerspective: "I use a checklist: Do you have > 50 engineers? Do modules need independent scaling (10x+ difference)? Do teams need autonomous deployment? Do you have the platform engineering team to support distributed systems? If less than 3 yes answers — modular monolith."
    },
    {
      question: "How do you test a modular monolith effectively? What's your testing strategy?",
      difficulty: "medium",
      answer: "<p><strong>Testing pyramid for modular monolith</strong>:</p><p><strong>1. Architecture tests (fast, many)</strong>:</p><ul><li>Verify module boundaries: 'Module A internals must not reference Module B internals'</li><li>Verify convention compliance: 'All handlers must be internal', 'All commands must end with Command'</li><li>Run in < 1 second, catch structural violations immediately</li></ul><p><strong>2. Integration tests per slice (medium speed, many)</strong>:</p><ul><li>Use WebApplicationFactory + real database (TestContainers)</li><li>Test full request→handler→database→response pipeline</li><li>One test class per feature slice: CreateOrder_Should_..., CancelOrder_Should_...</li><li>Isolated per test (transaction rollback or fresh database)</li></ul><p><strong>3. Module interaction tests (slower, fewer)</strong>:</p><ul><li>Test that events published by Module A are handled correctly by Module B</li><li>Test cross-module workflows (order placement involving inventory + payments)</li><li>Use in-memory message processing (no broker needed)</li></ul><p><strong>4. Contract tests (fast)</strong>:</p><ul><li>Verify that module interfaces haven't broken (serialization format, required fields)</li><li>Especially important when preparing for microservice extraction</li></ul><p><strong>What NOT to test</strong>: Don't unit test handlers in isolation with mocked DbContext — you're testing mock behavior, not real behavior. Integration tests with real databases catch more bugs with less maintenance.</p>",
      interviewTip: "Emphasize that modular monolith testing is simpler than microservices testing: no contract testing between services, no service mesh in tests, no eventual consistency to wait for. This is a selling point.",
      followUp: ["How do you achieve test isolation when modules share a database?", "What role do TestContainers play in modular monolith testing?"],
      seniorPerspective: "The best testing ROI in modular monoliths is architecture tests + integration tests. Architecture tests catch boundary violations in milliseconds. Integration tests catch business logic bugs with real infrastructure. Together they cover 90% of issues.",
      architectPerspective: "Testing strategy should evolve with extraction. Before extraction: integration tests dominate. During extraction: add contract tests between the module being extracted and its consumers. After extraction: full consumer-driven contract testing (Pact)."
    },
    {
      question: "Compare MediatR and Wolverine for command handling in a modular monolith. When would you choose each?",
      difficulty: "advanced",
      answer: "<p><strong>MediatR</strong>:</p><ul><li><strong>Focused scope</strong>: In-process mediator only. Send commands, publish notifications, pipeline behaviors.</li><li><strong>Simple mental model</strong>: IRequest → IRequestHandler. INotification → INotificationHandler. That's it.</li><li><strong>Wide ecosystem</strong>: Enormous community, extensive documentation, many pipeline behavior libraries.</li><li><strong>Limitations</strong>: No built-in retries, no outbox, no scheduling, no message broker integration. You add these yourself.</li></ul><p><strong>Wolverine</strong>:</p><ul><li><strong>Broader scope</strong>: In-process mediation + message broker integration + outbox + saga support + scheduling + dead letter handling.</li><li><strong>Source-generated</strong>: Compile-time handler discovery (no reflection), better performance than MediatR.</li><li><strong>Built-in outbox</strong>: Transactional outbox without additional libraries.</li><li><strong>Migration ready</strong>: Switch from in-process to RabbitMQ/Kafka by changing configuration, not code.</li><li><strong>Limitations</strong>: Smaller community, steeper learning curve, more opinionated.</li></ul><p><strong>Choose MediatR</strong>: Team familiar with it, simple CQRS needs, don't need message broker integration, prefer minimalism.</p><p><strong>Choose Wolverine</strong>: Need outbox pattern, planning microservice extraction, need scheduling/retry/saga support, want fewer libraries to integrate.</p>",
      interviewTip: "Position this as a 'today vs tomorrow' trade-off. MediatR is simpler today. Wolverine prepares you for tomorrow's distributed needs. Both are valid — the choice depends on your evolution trajectory.",
      followUp: ["What is the performance difference between MediatR and Wolverine for high-throughput scenarios?", "How does Wolverine's saga support compare to NServiceBus or MassTransit?"],
      seniorPerspective: "In practice, teams starting with MediatR who later need outbox/saga/broker support end up bolting on MassTransit or NServiceBus. Wolverine gives you this in one coherent package. But MediatR's simplicity is valuable for teams that won't need these features.",
      architectPerspective: "The library choice signals architectural intent. MediatR says 'we're building a monolith with good separation.' Wolverine says 'we're building a system that may evolve into a distributed architecture.' Both are valid signals — make the choice conscious and document it."
    }
  ]
});
