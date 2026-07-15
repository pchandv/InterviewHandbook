/* ═══════════════════════════════════════════════════════════════════
   Architecture — Styles: Clean, Hexagonal, Microservices, Modular Monolith
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('arch-styles', {
    title: 'Architecture Styles',
    description: 'Comparing Clean Architecture, Hexagonal (Ports & Adapters), Onion, Layered, Microservices, and Modular Monolith — when to use each, trade-offs, and real-world application.',
    sections: [
        {
            title: 'Clean Architecture',
            content: `<p><strong>Clean Architecture</strong> (Robert C. Martin) organizes code in concentric circles with the dependency rule: dependencies always point inward. The domain/business logic sits at the center with zero external dependencies.</p>
            <ul>
                <li><strong>Entities</strong> (innermost) — enterprise business rules, domain models</li>
                <li><strong>Use Cases</strong> — application-specific business rules (orchestration)</li>
                <li><strong>Interface Adapters</strong> — controllers, presenters, gateways, mappers</li>
                <li><strong>Frameworks & Drivers</strong> (outermost) — DB, web framework, UI, external APIs</li>
            </ul>`,
            mermaid: `flowchart TB
    subgraph Frameworks["Frameworks & Drivers (outermost)"]
        direction TB
        ASP["ASP.NET Core"]
        EF["EF Core"]
        Redis["Redis"]
        ExtAPI["External APIs"]
    end
    subgraph Adapters["Interface Adapters"]
        direction TB
        Ctrl["Controllers"]
        Repos["Repository Impl"]
        Mappers["AutoMapper"]
        Gateways["API Gateways"]
    end
    subgraph Application["Application (Use Cases)"]
        direction TB
        Handlers["Command/Query Handlers"]
        Interfaces["IRepository, IGateway"]
        DTOs["DTOs & Validators"]
    end
    subgraph Domain["Domain (Entities - innermost)"]
        direction TB
        Entities["Entities & Aggregates"]
        VOs["Value Objects"]
        Events["Domain Events"]
        Rules["Business Rules"]
    end
    Frameworks --> Adapters
    Adapters --> Application
    Application --> Domain
    style Domain fill:#4f46e5,color:#fff
    style Application fill:#6366f1,color:#fff
    style Adapters fill:#a5b4fc,color:#1e293b
    style Frameworks fill:#e0e7ff,color:#1e293b`,
            code: `// Project structure:
// src/
//   Domain/           ← Entities, Value Objects, Domain Events (NO dependencies)
//   Application/      ← Use Cases, Interfaces, DTOs (depends on Domain only)
//   Infrastructure/   ← EF Core, Redis, HTTP clients (implements Application interfaces)
//   WebAPI/           ← Controllers, Middleware (composition root)

// Domain layer — pure business logic, no framework dependencies
namespace Domain.Entities;
public class Order
{
    public OrderId Id { get; private set; }
    public CustomerId CustomerId { get; private set; }
    private readonly List<OrderLine> _lines = new();
    public IReadOnlyList<OrderLine> Lines => _lines.AsReadOnly();
    public OrderStatus Status { get; private set; }

    public void AddLine(Product product, int quantity)
    {
        if (Status != OrderStatus.Draft)
            throw new DomainException("Cannot modify a submitted order");
        _lines.Add(new OrderLine(product, quantity));
    }

    public void Submit()
    {
        if (!_lines.Any()) throw new DomainException("Order must have items");
        Status = OrderStatus.Submitted;
        AddDomainEvent(new OrderSubmittedEvent(Id));
    }
}

// Application layer — orchestrates use cases
namespace Application.Orders;
public class SubmitOrderHandler : IRequestHandler<SubmitOrderCommand, OrderDto>
{
    private readonly IOrderRepository _orders; // Interface defined HERE
    private readonly IPaymentGateway _payments; // Interface defined HERE

    public async Task<OrderDto> Handle(SubmitOrderCommand cmd, CancellationToken ct)
    {
        var order = await _orders.GetByIdAsync(cmd.OrderId, ct);
        order.Submit();
        await _payments.AuthorizeAsync(order.Total, ct);
        await _orders.SaveAsync(order, ct);
        return order.ToDto();
    }
}

// Infrastructure — implements interfaces with specific technology
namespace Infrastructure.Persistence;
public class EfOrderRepository : IOrderRepository
{
    private readonly AppDbContext _db;
    public async Task<Order> GetByIdAsync(OrderId id, CancellationToken ct) =>
        await _db.Orders.Include(o => o.Lines).FirstAsync(o => o.Id == id, ct);
}`,
            language: 'csharp'
        },
        {
            title: 'Microservices vs Modular Monolith',
            content: `<p>Two major approaches to system decomposition — each with distinct trade-offs around complexity, deployment, and team autonomy.</p>`,
            mermaid: `flowchart TB
    subgraph Microservices["Microservices Architecture"]
        direction LR
        GW["API Gateway"]
        OS["Order Service<br/>+ Own DB"]
        PS["Payment Service<br/>+ Own DB"]
        IS["Inventory Service<br/>+ Own DB"]
        NS["Notification Service<br/>+ Own DB"]
        GW --> OS
        GW --> PS
        GW --> IS
        OS -.->|events| PS
        OS -.->|events| IS
        OS -.->|events| NS
    end
    subgraph ModularMonolith["Modular Monolith"]
        direction LR
        API["Single API Host"]
        OM["Orders Module<br/>(own schema)"]
        PM["Payments Module<br/>(own schema)"]
        IM["Inventory Module<br/>(own schema)"]
        NM["Notifications Module<br/>(own schema)"]
        API --> OM
        API --> PM
        API --> IM
        API --> NM
        OM -.->|in-process events| PM
        OM -.->|in-process events| IM
        OM -.->|in-process events| NM
    end
    style Microservices fill:#fef3c7,color:#1e293b
    style ModularMonolith fill:#dbeafe,color:#1e293b`,
            table: {
                headers: ['Aspect', 'Microservices', 'Modular Monolith'],
                rows: [
                    ['Deployment', 'Independent per service', 'Single deployable unit'],
                    ['Communication', 'Network (HTTP, gRPC, messaging)', 'In-process (method calls)'],
                    ['Data', 'Each service owns its DB', 'Shared DB, separate schemas/modules'],
                    ['Consistency', 'Eventual (distributed transactions hard)', 'Strong (single DB transaction)'],
                    ['Complexity', 'High (network, observability, service mesh)', 'Lower (no distributed concerns)'],
                    ['Team autonomy', 'High (independent repos, deploys)', 'Moderate (shared codebase, coordinated deploys)'],
                    ['Scaling', 'Independent per service', 'Scale entire monolith (or extract hot paths)'],
                    ['Best for', 'Large orgs, 50+ developers, independent teams', 'Small-medium teams, need modularity without distributed cost'],
                    ['Start with', 'After proving boundaries in modular monolith', 'Day 1 — evolve to microservices IF needed']
                ]
            },
            code: `// Modular Monolith structure:
// src/
//   Modules/
//     Orders/
//       Orders.Domain/
//       Orders.Application/
//       Orders.Infrastructure/
//       Orders.Api/            ← Module's endpoints
//     Payments/
//       Payments.Domain/
//       Payments.Application/
//       Payments.Infrastructure/
//     Inventory/
//       ...
//   Host/                     ← Composition root, shared middleware

// Module boundary rules:
// 1. Modules communicate via published interfaces (events, contracts)
// 2. No direct DB access across modules (each has own schema)
// 3. Shared kernel for common value objects only
// 4. Module internals are private (internal access modifier)

// Inter-module communication:
public interface IOrderModule  // Public contract
{
    Task<OrderSummary> GetOrderSummaryAsync(OrderId id);
}

// Inside Orders module:
internal class OrderModule : IOrderModule  // Implementation is internal
{
    public async Task<OrderSummary> GetOrderSummaryAsync(OrderId id) =>
        await _mediator.Send(new GetOrderSummaryQuery(id));
}

// Evolution path: Modular Monolith → Microservices
// 1. Start modular monolith with clean boundaries
// 2. When a module needs independent scaling/deployment
// 3. Extract it into a separate service
// 4. Replace in-process calls with HTTP/messaging
// Clean module boundaries make this extraction surgical, not surgical`,
            language: 'csharp',
            callout: { type: 'info', title: 'Start Monolith, Evolve to Microservices', text: 'Most successful microservice architectures started as well-structured monoliths. Premature decomposition into microservices adds distributed complexity before you understand domain boundaries. Build a modular monolith first, then extract services at proven seams.' }
        },
        {
            title: 'Hexagonal Architecture (Ports & Adapters)',
            content: `<p><strong>Hexagonal Architecture</strong> (Alistair Cockburn) separates business logic from external concerns through <strong>ports</strong> (interfaces the app defines) and <strong>adapters</strong> (implementations that connect to infrastructure). The application is at the center, agnostic to delivery mechanism or data source.</p>`,
            mermaid: `flowchart LR
    subgraph DrivingAdapters["Driving Adapters (left)"]
        HTTP["REST API Controller"]
        gRPC["gRPC Service"]
        CLI["CLI Command"]
        MQ["Message Consumer"]
    end
    subgraph Core["Application Core"]
        direction TB
        DP["Driving Ports<br/>(IOrderService)"]
        BL["Business Logic<br/>(Domain Model)"]
        DRP["Driven Ports<br/>(IOrderRepo, IPaymentGw)"]
    end
    subgraph DrivenAdapters["Driven Adapters (right)"]
        SQL["SQL Repository"]
        Redis2["Redis Cache"]
        Stripe["Stripe Adapter"]
        Email["SMTP Email"]
    end
    HTTP --> DP
    gRPC --> DP
    CLI --> DP
    MQ --> DP
    DP --> BL
    BL --> DRP
    DRP --> SQL
    DRP --> Redis2
    DRP --> Stripe
    DRP --> Email
    style Core fill:#4f46e5,color:#fff
    style DrivingAdapters fill:#dbeafe,color:#1e293b
    style DrivenAdapters fill:#dcfce7,color:#1e293b`,
            code: `// PORTS — interfaces defined by the application (inbound and outbound)

// Inbound/Driving Port: how the world calls us
public interface IOrderService  // Could be called via HTTP, CLI, test, message
{
    Task<OrderDto> PlaceOrderAsync(PlaceOrderCommand cmd);
    Task<OrderDto> GetOrderAsync(Guid orderId);
}

// Outbound/Driven Port: what we need from the world
public interface IOrderRepository  // Could be SQL, Mongo, in-memory
{
    Task<Order?> FindByIdAsync(Guid id);
    Task SaveAsync(Order order);
}

public interface IPaymentGateway  // Could be Stripe, PayPal, mock
{
    Task<PaymentResult> ChargeAsync(decimal amount, string token);
}

// ADAPTERS — concrete implementations of ports

// Inbound adapter (HTTP → application)
[ApiController]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _service; // Drives the port
    
    [HttpPost]
    public async Task<IActionResult> Create(PlaceOrderRequest req)
    {
        var result = await _service.PlaceOrderAsync(req.ToCommand());
        return Created(result.Id);
    }
}

// Outbound adapter (application → database)
public class SqlOrderRepository : IOrderRepository
{
    public async Task<Order?> FindByIdAsync(Guid id) => /* EF Core impl */;
}

// Outbound adapter (application → payment provider)  
public class StripePaymentGateway : IPaymentGateway
{
    public async Task<PaymentResult> ChargeAsync(decimal amount, string token) => /* Stripe API */;
}

// Key insight: The APPLICATION defines ports (interfaces).
// ADAPTERS implement them. Swap adapters without touching business logic.
// Test with in-memory adapters. Deploy with real adapters.`,
            language: 'csharp'
        },
        {
            title: 'Architecture Decision Guide — Interactive Comparison',
            content: `<p>Compare architecture styles side-by-side to understand when each is appropriate. Click each tab to see project structure, trade-offs, and team context.</p>`,
            tabs: [
                {
                    label: 'Clean Architecture',
                    content: `<p><strong>Best for:</strong> Complex business domains, DDD, long-lived enterprise apps.</p>
                    <ul>
                        <li><code>Domain/</code> — Entities, Value Objects, Domain Events (NO deps)</li>
                        <li><code>Application/</code> — Handlers, DTOs, Validators (depends on Domain only)</li>
                        <li><code>Infrastructure/</code> — EF Core, Redis, HTTP (implements Application interfaces)</li>
                        <li><code>WebAPI/</code> — Controllers, Middleware, DI composition root</li>
                    </ul>
                    <p><strong>Pro:</strong> Domain stays pure and testable, infra swaps are surgical.</p>
                    <p><strong>Con:</strong> More ceremony upfront, overkill for simple CRUD.</p>`
                },
                {
                    label: 'Vertical Slices',
                    content: `<p><strong>Best for:</strong> Feature-focused teams, rapid delivery, avoiding premature abstraction.</p>
                    <ul>
                        <li><code>Features/Orders/PlaceOrder/</code> — Command + Handler + Validator (all in one folder)</li>
                        <li><code>Features/Orders/GetOrder/</code> — Query + Handler + DTO</li>
                        <li><code>Features/Products/Search/</code> — Query + Handler + Result</li>
                        <li><code>Common/</code> — Shared pipeline behaviors, base classes</li>
                    </ul>
                    <p><strong>Pro:</strong> Each feature self-contained, easy to understand one feature in isolation.</p>
                    <p><strong>Con:</strong> May duplicate code across slices, harder to enforce consistency.</p>`
                },
                {
                    label: 'Modular Monolith',
                    content: `<p><strong>Best for:</strong> Medium teams (5-15 devs), clean boundaries without distributed cost.</p>
                    <ul>
                        <li><code>Modules/Orders/</code> — Domain, Application, Infrastructure, Api</li>
                        <li><code>Modules/Payments/</code> — Independent module, own DB schema</li>
                        <li><code>Host/</code> — Composition root, shared middleware, single deployable</li>
                    </ul>
                    <p><strong>Pro:</strong> Team autonomy within modules, easy to extract to microservices later.</p>
                    <p><strong>Con:</strong> Single deployment, shared process resources.</p>`
                },
                {
                    label: 'Microservices',
                    content: `<p><strong>Best for:</strong> Large orgs (50+ devs), independent scaling, tech diversity.</p>
                    <ul>
                        <li><code>order-service/</code> — Own repo, DB, CI/CD, team</li>
                        <li><code>payment-service/</code> — Can use different tech stack</li>
                        <li><code>shared-contracts/</code> — Event schemas (NuGet/npm packages)</li>
                    </ul>
                    <p><strong>Pro:</strong> Maximum autonomy, independent scaling and deployment.</p>
                    <p><strong>Con:</strong> Distributed complexity (networking, eventual consistency, observability).</p>`
                }
            ]
        }
    ],
    questions: [
        {
            question: 'What is Clean Architecture and what is the Dependency Rule?',
            difficulty: 'medium',
            answer: `<p><strong>Clean Architecture</strong> organizes code in concentric layers where dependencies always point inward (the Dependency Rule). Inner layers define interfaces; outer layers implement them. The domain/business logic has ZERO dependencies on frameworks, databases, or UI — making it testable, portable, and framework-independent.</p>`,
            code: `// The Dependency Rule:
// Outer layers depend on inner layers. NEVER the reverse.
//
//  [Frameworks/Drivers]  →  [Interface Adapters]  →  [Use Cases]  →  [Entities]
//      ASP.NET Core            Controllers              Handlers        Domain
//      EF Core                 Repositories             Services        Entities
//      Redis                   Mappers                  Interfaces      Value Objects

// Dependency Inversion in practice:
// Application layer DEFINES the interface:
namespace Application.Interfaces;
public interface IEmailService
{
    Task SendAsync(string to, string subject, string body);
}

// Infrastructure layer IMPLEMENTS it:
namespace Infrastructure.Email;
public class SendGridEmailService : IEmailService { /* ... */ }

// Composition root (Program.cs) wires them:
builder.Services.AddScoped<IEmailService, SendGridEmailService>();

// Benefits:
// 1. Domain logic testable without any infrastructure
// 2. Swap database (SQL → Mongo) without touching business logic
// 3. Framework upgrades don't affect core logic
// 4. Multiple UIs (API, CLI, gRPC) share the same use cases`,
            language: 'csharp',
            bestPractices: [
                'Domain layer has ZERO NuGet package dependencies',
                'Application layer defines interfaces that Infrastructure implements',
                'Use Cases (Application) orchestrate domain objects — don\'t put logic in controllers',
                'WebAPI/Infrastructure are the "dirty" outer layers — keep them thin'
            ],
            commonMistakes: [
                'Putting business logic in controllers (belongs in Application/Domain)',
                'Domain layer referencing EF Core or other frameworks (violates dependency rule)',
                'Over-engineering simple CRUD with full Clean Architecture layers',
                'Anemic domain model (all logic in services, entities are just data bags)'
            ],
            interviewTip: 'Draw the concentric circles with arrows pointing inward. Explain WHY: if the domain depends on nothing, it can be tested with zero mocking of infrastructure. The domain is the most stable, valuable code — protect it from change.',
            followUp: ['How does this differ from traditional N-tier/layered?', 'When is Clean Architecture overkill?', 'How do you handle cross-cutting concerns (logging)?'],
            seniorPerspective: 'I apply Clean Architecture selectively: complex domains with rich business rules benefit enormously. Simple CRUD services don\'t need it — a vertical slice or simple layered approach is more pragmatic for basic data access.',
            architectPerspective: 'Clean Architecture\'s real value emerges at year 3+ of a project\'s life. The initial investment in proper boundaries pays off when you need to swap infrastructure (on-prem SQL → cloud Cosmos), add delivery channels (API → event-driven), or distribute into microservices.'
        },
        {
            question: 'When would you choose microservices vs a modular monolith? What are the trade-offs?',
            difficulty: 'advanced',
            answer: `<p>Choose <strong>modular monolith</strong> as the default starting point — it gives clean boundaries without distributed complexity. Choose <strong>microservices</strong> when you need independent scaling, independent deployment by autonomous teams, or technology diversity. The key trade-off: microservices exchange code complexity for operational complexity.</p>`,
            code: `// Decision criteria for microservices:
// ✓ Multiple teams (>20 devs) needing independent release cycles
// ✓ Different scaling requirements (search 10x traffic vs billing)
// ✓ Different technology needs (ML service in Python, API in C#)
// ✓ Independent failure isolation (payment down shouldn't block browsing)
// ✓ Proven domain boundaries (you KNOW where to cut)

// Decision criteria for modular monolith:
// ✓ Small-medium team (2-15 devs)
// ✓ Strong consistency requirements (financial transactions)
// ✓ Rapid development velocity needed (one repo, one deploy)
// ✓ Unclear domain boundaries (still discovering the domain)
// ✓ Limited DevOps capacity (can't manage 20 services)

// The hidden costs of microservices:
// 1. Network latency (in-process call: <1μs, network: 1-100ms)
// 2. Distributed transactions (no simple DB transaction across services)
// 3. Observability (distributed tracing, log correlation, service mesh)
// 4. Data consistency (eventual consistency, saga patterns)
// 5. Deployment complexity (Kubernetes, CI/CD per service)
// 6. Testing difficulty (integration tests need all services running)
// 7. API versioning (breaking changes cascade across services)

// Evolution strategy:
// Year 1: Modular Monolith (fast iteration, learn domain)
// Year 2: Identify hot spots (what needs independent scaling?)
// Year 3: Extract 2-3 services at proven boundaries
// Ongoing: Only extract when the BENEFIT outweighs the COST

// Anti-pattern: "Distributed Monolith"
// Microservices that are tightly coupled:
// - Synchronous chains (A → B → C → D for every request)
// - Shared database across services
// - Must deploy together (no independent releases)
// Result: ALL the complexity of microservices + NONE of the benefits`,
            language: 'csharp',
            bestPractices: [
                'Start with a modular monolith — extract services only when proven necessary',
                'Define clear module boundaries before considering extraction',
                'Ensure each microservice owns its data (no shared databases)',
                'Use async messaging between services (not synchronous chains)'
            ],
            commonMistakes: [
                'Starting with microservices on day 1 (premature decomposition)',
                'Shared database across services (distributed monolith)',
                'Synchronous call chains (coupling disguised as microservices)',
                'Too-small services (nano-services with more infrastructure than code)'
            ],
            interviewTip: 'Show nuance: don\'t blindly advocate for either. Say "it depends on team size, domain maturity, and deployment needs." Mention the distributed monolith anti-pattern — this shows you\'ve seen microservices done badly.',
            followUp: ['What is a distributed monolith?', 'How do you identify service boundaries?', 'How do microservices handle distributed transactions?'],
            seniorPerspective: 'I\'ve seen more teams harmed by premature microservices than helped. My rule: if your team is under 15 people and you can deploy in under 10 minutes, a modular monolith gives 80% of the benefits at 20% of the operational cost.',
            architectPerspective: 'The right architecture maximizes team velocity. For a startup: monolith (speed). For a scale-up: modular monolith (maintainability). For an enterprise with 200+ developers: microservices (team autonomy). The architecture should evolve with the organization, not the other way around.'
        },
        {
            question: 'How does Hexagonal Architecture (Ports & Adapters) differ from Clean Architecture, and what concrete problem do ports solve?',
            difficulty: 'advanced',
            answer: `<p>Both put business logic at the center and push infrastructure to the edges, and both rely on the Dependency Inversion Principle. The difference is emphasis and vocabulary:</p>
            <ul>
                <li><strong>Hexagonal</strong> (Cockburn) focuses on the symmetry between <strong>driving</strong> adapters (who calls us: HTTP, CLI, tests, message consumers) and <strong>driven</strong> adapters (what we call: DB, payment gateway, email). The core defines <strong>ports</strong> (interfaces) and adapters plug into them. There is no prescribed number of internal layers.</li>
                <li><strong>Clean Architecture</strong> (Martin) is more prescriptive about <strong>concentric layers</strong> (Entities, Use Cases, Interface Adapters, Frameworks) and the inward-pointing dependency rule.</li>
            </ul>
            <p>The concrete problem ports solve: the application becomes <strong>agnostic to delivery mechanism and data source</strong>. The same use case can be invoked from a REST controller, a gRPC service, or a unit test, and can persist to SQL, Mongo, or an in-memory fake — without the core code changing. In practice most teams blend them: Clean Architecture layering with hexagonal ports for the outer boundary.</p>`,
            explanation: 'Think of the core app as a games console. Ports are the standardized sockets (HDMI, USB). Adapters are whatever you plug in — a TV, a monitor, a capture card. The console does not care what is on the other end of the socket, as long as it speaks the port contract.',
            code: `// PORT defined BY the application (driven/outbound)
public interface INotificationPort
{
    Task NotifyAsync(CustomerId customer, string message, CancellationToken ct);
}

// The core use case depends only on the PORT, never on an adapter
public class CancelOrderUseCase
{
    private readonly IOrderRepository _orders;     // driven port
    private readonly INotificationPort _notify;    // driven port

    public CancelOrderUseCase(IOrderRepository orders, INotificationPort notify)
    {
        _orders = orders;
        _notify = notify;
    }

    public async Task ExecuteAsync(OrderId id, CancellationToken ct)
    {
        var order = await _orders.GetByIdAsync(id, ct);
        order.Cancel("Customer requested cancellation");
        await _orders.SaveAsync(order, ct);
        await _notify.NotifyAsync(order.CustomerId, "Your order was cancelled", ct);
    }
}

// ADAPTERS implement the ports — swappable without touching the core
public class TwilioSmsAdapter : INotificationPort { /* real SMS */ }
public class SendGridEmailAdapter : INotificationPort { /* real email */ }
public class InMemoryNotificationAdapter : INotificationPort { /* used in tests */ }

// Composition root chooses the adapter:
builder.Services.AddScoped<INotificationPort, SendGridEmailAdapter>();`,
            language: 'csharp',
            bestPractices: [
                'Let the application define the port interface; never let the adapter dictate the core contract',
                'Separate driving ports (inbound use-case interfaces) from driven ports (outbound infrastructure interfaces)',
                'Test the core with in-memory adapters so business logic needs zero infrastructure to verify',
                'Keep adapters thin — translation only, no business rules'
            ],
            commonMistakes: [
                'Leaking infrastructure types (DbContext, HttpResponseMessage) into port signatures',
                'Putting business logic inside adapters instead of the core',
                'Creating a port for everything, including stable in-process code that never varies',
                'Treating Hexagonal and Clean as competing choices rather than complementary ideas'
            ],
            interviewTip: 'Stress the symmetry insight: Hexagonal treats the UI/controller and the database as the SAME kind of thing — both are just adapters plugged into ports. That mental model is what distinguishes it from a plain layered diagram.',
            followUp: ['How do you decide what deserves a port?', 'How does this enable contract testing?', 'How would you wire adapters differently for integration vs unit tests?'],
            seniorPerspective: 'I use ports for genuine variation points — anything I might swap, mock, or that crosses a process boundary (DB, external APIs, messaging). I deliberately do NOT create ports for stable in-process collaborators, because a port per class is just ceremony that obscures the design.',
            architectPerspective: 'Ports and adapters are the cleanest way to keep a system testable and portable across a decade of infrastructure churn. The architectural payoff arrives when you swap a whole category of adapter — on-prem SQL to cloud, SMTP to a transactional email API — and the core is provably untouched because the compiler enforces the port boundary.'
        },
        {
            question: 'Compare Onion Architecture, traditional Layered (N-tier), and Clean Architecture. When does the classic layered model actively hurt you?',
            difficulty: 'hard',
            answer: `<p>All three organize code into layers; the decisive difference is <strong>which way the dependencies point</strong>:</p>
            <ul>
                <li><strong>Traditional Layered (N-tier):</strong> Presentation depends on Business, Business depends on Data Access, Data Access depends on the database. Dependencies flow <strong>top-down toward the database</strong>. The domain ends up depending on persistence.</li>
                <li><strong>Onion Architecture (Palermo):</strong> Concentric rings with the <strong>domain model at the center</strong>. Outer rings depend inward; infrastructure sits on the outside and implements interfaces defined by inner rings. Dependencies point <strong>toward the domain</strong>.</li>
                <li><strong>Clean Architecture:</strong> Essentially a refined, renamed Onion (Entities + Use Cases at the core) with the same inward dependency rule, plus explicit Use Case and Interface Adapter rings.</li>
            </ul>
            <p>Classic layered hurts when the <strong>domain becomes a slave to the data layer</strong>: entities are shaped by EF/ORM concerns, business rules leak into stored procedures or service classes, and you cannot unit-test logic without a database. Onion/Clean invert that — the database becomes a plug-in detail, so the most valuable code (domain rules) has zero outward dependencies.</p>`,
            explanation: 'Traditional layering is a building where every floor rests on the one below, and the foundation is the database — change the foundation and everything shifts. Onion/Clean flip it: the business rules are the indestructible core, and the database is just outer insulation you can re-wrap anytime.',
            code: `// TRADITIONAL LAYERED — domain depends on data access (dependency points DOWN)
namespace Business;
public class OrderService
{
    private readonly OrderDataAccess _data; // concrete dependency on Data layer
    public OrderService(OrderDataAccess data) => _data = data;
    public void Submit(int orderId)
    {
        var dto = _data.LoadOrder(orderId); // domain logic mixed with DB shape
        if (dto.Lines.Count == 0) throw new Exception("empty");
        dto.Status = "Submitted";
        _data.Save(dto);
    }
}

// ONION / CLEAN — domain defines the interface, infrastructure implements it
namespace Domain; // innermost ring, NO outward dependencies
public interface IOrderRepository { Order GetById(OrderId id); void Save(Order o); }
public class Order { /* rich behavior, invariants enforced here */ }

namespace Application; // use cases depend on Domain only
public class SubmitOrderUseCase
{
    private readonly IOrderRepository _repo; // interface owned by inner ring
    public SubmitOrderUseCase(IOrderRepository repo) => _repo = repo;
    public void Execute(OrderId id)
    {
        var order = _repo.GetById(id);
        order.Submit();   // invariant lives in the domain entity
        _repo.Save(order);
    }
}

namespace Infrastructure; // outermost ring, implements inner interface
public class EfOrderRepository : IOrderRepository { /* EF Core details */ }`,
            language: 'csharp',
            bestPractices: [
                'Keep the domain model free of persistence attributes and ORM base classes',
                'Define repository and gateway interfaces in the inner rings, implement them on the outside',
                'Reserve full Onion/Clean for domains with real business rules, not thin CRUD',
                'Use the layered model only where the app is genuinely a thin wrapper over the database'
            ],
            commonMistakes: [
                'Annotating domain entities with EF/ORM mappings, coupling the core to persistence',
                'Letting business logic drift into the data-access layer or stored procedures',
                'Adopting Onion/Clean ceremony for a simple CRUD app that gains nothing from it',
                'Creating an anemic domain where layers exist but all logic lives in services'
            ],
            interviewTip: 'The one-sentence differentiator interviewers want: traditional layering points dependencies toward the database; Onion and Clean invert that so dependencies point toward the domain. Everything else is detail.',
            followUp: ['What is an anemic domain model and why is it an anti-pattern?', 'How do you map a persistence-ignorant domain to EF Core?', 'When is a simple two-layer design the right call?'],
            seniorPerspective: 'My tell-tale test: can I write a meaningful unit test for a business rule without spinning up a database? If not, the design is really N-tier wearing an Onion costume. Persistence ignorance in the domain is the property I protect most aggressively.',
            architectPerspective: 'Onion and Clean are the same idea with different labels; arguing about which is "correct" wastes time. What matters architecturally is the inward dependency rule — it keeps the highest-value, slowest-changing code (domain rules) insulated from the fastest-changing code (frameworks and data stores).'
        },
        {
            question: 'What is the Layered (N-tier) architecture style at its best, and how do you keep it from degrading into a Big Ball of Mud?',
            difficulty: 'medium',
            answer: `<p><strong>Layered architecture</strong> groups code by technical responsibility — typically Presentation, Application/Business, and Data Access — where each layer only talks to the one directly beneath it. Its strengths are <strong>familiarity, simplicity, and clear separation of technical concerns</strong>, which makes it an excellent default for straightforward line-of-business CRUD applications.</p>
            <p>It degrades into a <strong>Big Ball of Mud</strong> when discipline slips:</p>
            <ul>
                <li><strong>Layer-skipping</strong> — the UI calls the data layer directly, bypassing business rules.</li>
                <li><strong>Leaky abstractions</strong> — ORM entities or SQL types travel all the way up to the UI.</li>
                <li><strong>God services</strong> — a single business layer class accumulates thousands of lines.</li>
                <li><strong>No module boundaries</strong> — every feature reaches into every other, so a change anywhere risks breaking everything.</li>
            </ul>
            <p>Guardrails: enforce the layer-only-calls-below rule (architecture tests), map between layer-specific models (DTOs vs entities), and add <strong>vertical feature partitioning</strong> so the codebase is organized by capability as well as by layer.</p>`,
            explanation: 'A layered app is like a restaurant: customers talk to waiters (presentation), waiters talk to the kitchen (business), the kitchen talks to the pantry (data). It works beautifully until customers start wandering into the pantry themselves — then nobody can reason about what is happening.',
            code: `// Healthy layered flow: each layer talks only to the one below, mapping models at boundaries
// Presentation
[ApiController]
public class OrdersController : ControllerBase
{
    private readonly IOrderAppService _app; // talks to Application layer ONLY
    public OrdersController(IOrderAppService app) => _app = app;

    [HttpPost]
    public async Task<IActionResult> Create(CreateOrderRequest req)
    {
        var result = await _app.CreateAsync(req); // never touches the DB directly
        return CreatedAtAction(nameof(Create), new { id = result.Id }, result);
    }
}

// Application/Business
public class OrderAppService : IOrderAppService
{
    private readonly IOrderRepository _repo; // talks to Data layer ONLY
    public OrderAppService(IOrderRepository repo) => _repo = repo;

    public async Task<OrderDto> CreateAsync(CreateOrderRequest req)
    {
        if (req.Items.Count == 0) throw new BusinessException("Order needs items");
        var entity = new OrderEntity(req.CustomerId, req.Items);
        await _repo.AddAsync(entity);
        return new OrderDto(entity.Id, entity.Total); // map entity -> DTO at the boundary
    }
}

// Architecture test (NetArchTest) enforces the rule that prevents mud:
// Types in Presentation must NOT depend on the Data layer.
// var result = Types.InAssembly(typeof(OrdersController).Assembly)
//     .That().ResideInNamespace("Presentation")
//     .ShouldNot().HaveDependencyOn("Company.App.Data")
//     .GetResult();`,
            language: 'csharp',
            bestPractices: [
                'Enforce strict layering with automated architecture tests (NetArchTest, ArchUnit)',
                'Map between models at each boundary so persistence types never reach the UI',
                'Partition vertically by feature as the app grows, not only horizontally by layer',
                'Keep the data layer behind interfaces so business logic stays testable'
            ],
            commonMistakes: [
                'Allowing the presentation layer to call data access directly (layer-skipping)',
                'Passing ORM entities straight to the UI, coupling the view to the schema',
                'Letting a single service class become a multi-thousand-line god object',
                'Treating layered as a license to skip modularization until the codebase rots'
            ],
            interviewTip: 'Do not dismiss layered architecture as outdated. Position it as the correct, pragmatic default for CRUD-heavy apps, then show maturity by naming the specific failure modes (layer-skipping, leaky models) and the guardrails that prevent them.',
            followUp: ['How do you enforce layering automatically in CI?', 'When would you migrate from layered to vertical slices?', 'How does layered differ from a modular monolith?'],
            seniorPerspective: 'I am happy shipping a strict layered design for genuine CRUD — it is fast to build and easy for any developer to navigate. The discipline I never skip is automated architecture tests; without them, the layer rules are just comments and the mud creeps in within a year.',
            architectPerspective: 'Layered architecture fails not because the style is wrong but because nothing enforces the boundaries. I pair horizontal layers with vertical feature modules and CI-level dependency checks, so the codebase scales by capability and the layering remains a real constraint rather than an aspiration.'
        },
        {
            question: 'Is serverless an architecture style or a deployment model, and when would you choose it as a primary architectural approach?',
            difficulty: 'advanced',
            answer: `<p>It is both, depending on how far you take it. As a <strong>deployment/execution model</strong>, serverless (FaaS) just means the platform runs your code on demand, scales it automatically, and bills per execution. As an <strong>architecture style</strong>, "serverless-first" means composing the whole system from <strong>managed, event-driven, scale-to-zero building blocks</strong>: functions for compute, managed queues/topics for messaging, managed NoSQL/object stores for state, and a managed gateway for the edge.</p>
            <p>Choose it as the primary approach when:</p>
            <ul>
                <li><strong>Traffic is spiky or unpredictable</strong> — scale-to-zero means you pay nothing at idle, and the platform absorbs spikes automatically.</li>
                <li><strong>Workloads are event-driven</strong> — file processing, webhooks, scheduled jobs, stream processing map naturally to triggers.</li>
                <li><strong>You want minimal operational overhead</strong> — no servers to patch, scale, or capacity-plan.</li>
            </ul>
            <p>Avoid it as the backbone when you have <strong>steady high-throughput</strong> traffic (a reserved VM/container is cheaper), <strong>strict low-latency SLAs</strong> hurt by cold starts, or <strong>long-running</strong> jobs that exceed execution limits. The defining trade-off is operational simplicity and elastic cost versus cold-start latency and vendor lock-in.</p>`,
            explanation: 'Owning servers is like leasing a car you pay for whether you drive or not. Serverless is a taxi: it appears when you need it, you pay only for the trip, and you never think about maintenance — but there is a short wait for it to arrive (the cold start), and you are tied to that taxi company.',
            code: `// A serverless-first slice: HTTP trigger -> queue -> async processor
// (Azure Functions isolated worker, .NET 8)
public class CheckoutFunctions
{
    private readonly QueueServiceClient _queues;
    public CheckoutFunctions(QueueServiceClient queues) => _queues = queues;

    // Edge: accept the request, enqueue work, return fast (202)
    [Function("SubmitCheckout")]
    public async Task<HttpResponseData> Submit(
        [HttpTrigger(AuthorizationLevel.Function, "post", Route = "checkout")] HttpRequestData req,
        CancellationToken ct)
    {
        var order = await req.ReadFromJsonAsync<CheckoutRequest>(ct);
        var queue = _queues.GetQueueClient("checkout-jobs");
        await queue.SendMessageAsync(JsonSerializer.Serialize(order), ct);

        var resp = req.CreateResponse(HttpStatusCode.Accepted); // async, scale-to-zero friendly
        await resp.WriteAsJsonAsync(new { status = "queued" }, ct);
        return resp;
    }

    // Compute: triggered by the queue, scales out with backlog, idempotent handler
    [Function("ProcessCheckout")]
    public async Task Process(
        [QueueTrigger("checkout-jobs")] CheckoutRequest order,
        CancellationToken ct)
    {
        // External state only — functions are stateless between invocations
        await FulfillAsync(order, ct);
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Reserve serverless-first for spiky, event-driven, or low-volume workloads where scale-to-zero pays off',
                'Keep functions stateless and push all state to managed stores',
                'Mitigate cold starts on latency-critical paths with provisioned/pre-warmed concurrency',
                'Model expected cost at peak sustained load before committing the backbone to FaaS'
            ],
            commonMistakes: [
                'Using serverless for steady high-throughput traffic where it costs more than reserved compute',
                'Ignoring cold-start latency on user-facing, SLA-bound endpoints',
                'Building long-running jobs that hit execution time limits instead of using orchestration',
                'Underestimating vendor lock-in from deep coupling to provider-specific triggers and services'
            ],
            interviewTip: 'Open by refusing the false dichotomy: say it is a deployment model that becomes an architecture style when you compose the whole system from managed event-driven services. Then anchor the decision in traffic shape (spiky vs steady) and latency SLAs.',
            followUp: ['How do cold starts affect architectural choices?', 'How do you orchestrate long-running serverless workflows?', 'How do you limit vendor lock-in in a serverless-first design?'],
            seniorPerspective: 'I reach for serverless-first on greenfield products with unknown traffic and small teams — the operational savings are enormous and you pay nothing while finding product-market fit. The moment a workload becomes steady and high-volume, I re-evaluate, because the per-execution model can quietly cost more than a couple of right-sized containers.',
            architectPerspective: 'Serverless-first is a powerful default for event-driven and bursty systems, but I treat the choice as per-workload rather than system-wide. A mature platform usually mixes models: functions for spiky/event work, containers for steady services, and managed BaaS for state — chosen by traffic profile, latency budget, and the team operational appetite for each.'
        }
    ,
        {
            question: 'What is a service mesh, and what problems does it solve that application code otherwise has to?',
            difficulty: 'advanced',
            answer: `<p>A <strong>service mesh</strong> (Istio, Linkerd) moves cross-cutting service-to-service concerns out of application code into a <strong>sidecar proxy</strong> (data plane) deployed next to each service, controlled centrally (control plane). The app just makes normal calls; the proxy intercepts traffic.</p>
            <p>It provides, uniformly across all services and languages: <strong>mTLS</strong> (automatic encryption + service identity), <strong>traffic management</strong> (canary/weighted routing, retries, timeouts, circuit breaking), <strong>observability</strong> (golden-signal metrics, distributed tracing, per-call telemetry), and <strong>policy</strong> (authz between services, rate limits). Without a mesh, each service re-implements these in libraries, inconsistently and per-language.</p>`,
            explanation: 'Instead of every house installing its own locks, cameras, and traffic signs, the city installs a standard smart gate (sidecar) at each driveway, managed from one control room. Houses (services) just open the door; the gates handle security, routing, and monitoring uniformly.',
            bestPractices: ['Adopt a mesh when you have many services/languages needing uniform mTLS, retries, and telemetry', 'Let the mesh own retries/timeouts/circuit-breaking so apps stay thin', 'Use it for zero-trust service identity (mTLS) and per-service authz policy', 'Weigh the operational complexity \u2014 a mesh is itself infrastructure to run'],
            commonMistakes: ['Adding a mesh to a handful of services where a library would do (overkill)', 'Duplicating retries in both app code and the mesh (retry storms)', 'Ignoring the latency/resource overhead of sidecars', 'Treating the mesh as free \u2014 it is significant operational complexity'],
            interviewTip: 'Frame it as "cross-cutting networking concerns moved from libraries into sidecars, managed centrally" \u2014 mTLS, traffic management, observability, policy. The maturity note is that the mesh trades app simplicity for operational complexity.',
            followUp: ['What is the difference between the data plane and control plane?', 'When is a mesh overkill versus a shared library?', 'How does a mesh enable zero-trust between services?'],
            seniorPerspective: 'I only introduce a mesh when the number of services and languages makes per-app libraries inconsistent and painful \u2014 then uniform mTLS and traffic control are a big win. For a few services it is more operational burden than it is worth; I start with a resilience library and graduate to a mesh when the scale justifies it.',
            architectPerspective: 'A service mesh is the platform-level answer to cross-cutting concerns: it standardizes security, resilience, and observability for every service regardless of language, which is exactly what lets many teams move fast without each re-solving networking. The trade-off is a powerful but non-trivial piece of infrastructure to operate.'
        },
        {
            question: 'How do the Strangler Fig and Anti-Corruption Layer patterns help migrate a legacy monolith?',
            difficulty: 'advanced',
            answer: `<p>Both manage <em>incremental</em> migration so you never do a risky big-bang rewrite.</p>
            <ul>
                <li><strong>Strangler Fig</strong> \u2014 put a facade/proxy in front of the legacy system and incrementally route specific routes/capabilities to new services while the rest still hits the legacy. Over time the new system "strangles" the old one until it can be retired. Each step is small and reversible.</li>
                <li><strong>Anti-Corruption Layer (ACL)</strong> \u2014 a translation layer between the new (clean) model and the legacy (messy) model, so the legacy\u2019s data shapes, semantics, and quirks do not leak into and corrupt the new design. The new service talks its own language; the ACL adapts to the legacy.</li>
            </ul>
            <p>Together: the strangler routes traffic incrementally; the ACL keeps the new code clean while it must still integrate with the old.</p>`,
            explanation: 'The strangler fig grows around a tree and gradually replaces it \u2014 you reroute one feature at a time until the old system is empty and removable. The anti-corruption layer is a translator at the border so the old system\u2019s bad habits don\u2019t infect the new one\u2019s clean language.',
            bestPractices: ['Use a facade/proxy to route capabilities to new services one at a time', 'Migrate by business capability, keeping each step small and reversible', 'Use an ACL to translate legacy models so they do not pollute the new domain', 'Keep data in sync during the transition (events/CDC) and plan the cutover per capability'],
            commonMistakes: ['Big-bang rewrite instead of incremental strangling (high risk)', 'Letting legacy data models/semantics leak directly into the new system (no ACL)', 'No data-sync strategy during coexistence, causing divergence', 'Never actually retiring the legacy, ending with permanent dual systems'],
            interviewTip: 'Pair them: Strangler Fig = incremental routing/replacement behind a facade; ACL = translation boundary protecting the new model from legacy corruption. Stressing "small, reversible steps, migrate by capability" signals real migration experience.',
            followUp: ['How do you keep data consistent during the coexistence period?', 'Where does the routing facade live?', 'How do you decide migration order of capabilities?'],
            seniorPerspective: 'Every successful legacy migration I have done was a strangler, not a rewrite \u2014 route one capability at a time, prove it, repeat. The anti-corruption layer is what keeps the new system from inheriting the legacy\u2019s accidental complexity; without it, you rebuild the same mess with newer syntax.',
            architectPerspective: 'These patterns make migration a sequence of low-risk, value-delivering steps rather than a multi-year gamble. The ACL enforces a clean bounded-context boundary during coexistence, and the strangler facade gives you a controlled, reversible cutover \u2014 the combination is the standard playbook for evolving away from a monolith.'
        }
    ]
});
