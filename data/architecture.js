/* ═══════════════════════════════════════════════════════════════════
   Architecture — SOLID, Clean Architecture, DDD, Distributed
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('arch-principles', {
    title: 'Architecture Principles & SOLID',
    description: 'Foundation principles every senior engineer must articulate: SOLID, DRY, KISS, YAGNI, and their practical application in real systems.',
    quickRecall: [
        'S — Single Responsibility: one class, one reason to change',
        'O — Open/Closed: extend behavior without modifying existing code',
        'L — Liskov Substitution: subtypes must be drop-in replaceable',
        'I — Interface Segregation: many small interfaces beat one large one',
        'D — Dependency Inversion: depend on abstractions, not concretions',
        'DRY vs WET: eliminate duplication but not at the cost of coupling',
        'KISS: simplest solution that works; Law of Demeter: talk only to friends'
    ],
    sections: [
        {
            title: 'SOLID Principles',
            content: `<p>SOLID is a mnemonic for five design principles that lead to maintainable, testable, and flexible object-oriented systems.</p>
            <table>
                <thead><tr><th>Principle</th><th>Meaning</th><th>Violation Signal</th></tr></thead>
                <tbody>
                    <tr><td><strong>S</strong>ingle Responsibility</td><td>A class should have only one reason to change</td><td>Class does logging AND validation AND data access</td></tr>
                    <tr><td><strong>O</strong>pen/Closed</td><td>Open for extension, closed for modification</td><td>Adding features requires editing existing code</td></tr>
                    <tr><td><strong>L</strong>iskov Substitution</td><td>Subtypes must be substitutable for their base types</td><td>Override throws NotImplementedException</td></tr>
                    <tr><td><strong>I</strong>nterface Segregation</td><td>Clients shouldn't depend on methods they don't use</td><td>Interface with 15+ methods, most unused by implementors</td></tr>
                    <tr><td><strong>D</strong>ependency Inversion</td><td>Depend on abstractions, not concretions</td><td>new SqlConnection() inside business logic</td></tr>
                </tbody>
            </table>`,
            code: `// SINGLE RESPONSIBILITY — Before (violating)
public class OrderService
{
    public void PlaceOrder(Order order)
    {
        // Validation (reason 1)
        if (order.Items.Count == 0) throw new Exception("No items");
        
        // Persistence (reason 2)
        using var conn = new SqlConnection(_connStr);
        conn.Execute("INSERT INTO Orders...", order);
        
        // Notification (reason 3)
        _emailClient.Send(order.Customer.Email, "Order placed!");
        
        // Logging (reason 4)
        _logger.LogInformation("Order {Id} placed", order.Id);
    }
}

// SINGLE RESPONSIBILITY — After (clean separation)
public class OrderService
{
    private readonly IOrderValidator _validator;
    private readonly IOrderRepository _repository;
    private readonly INotificationService _notifications;

    public OrderService(IOrderValidator validator, IOrderRepository repo, INotificationService notifications)
    {
        _validator = validator;
        _repository = repo;
        _notifications = notifications;
    }

    public async Task<Result<Order>> PlaceOrderAsync(Order order, CancellationToken ct)
    {
        var validation = _validator.Validate(order);
        if (!validation.IsValid) return Result.Failure<Order>(validation.Errors);

        await _repository.SaveAsync(order, ct);
        await _notifications.OrderPlacedAsync(order, ct);

        return Result.Success(order);
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Open/Closed Principle in Practice',
            content: `<p>The key to OCP is using <strong>polymorphism and composition</strong> rather than conditionals. When you add a new feature, you should add NEW code (new class), not EDIT existing code.</p>`,
            code: `// VIOLATING OCP — Adding a new discount requires editing this method
public decimal CalculateDiscount(Order order)
{
    switch (order.CustomerType)
    {
        case "Regular": return order.Total * 0.05m;
        case "Premium": return order.Total * 0.10m;
        case "VIP": return order.Total * 0.15m;
        // Every new type = edit this class!
        default: return 0;
    }
}

// FOLLOWING OCP — Strategy pattern + DI
public interface IDiscountStrategy
{
    bool AppliesTo(Order order);
    decimal Calculate(Order order);
}

public class PremiumDiscount : IDiscountStrategy
{
    public bool AppliesTo(Order order) => order.CustomerType == "Premium";
    public decimal Calculate(Order order) => order.Total * 0.10m;
}

// Add new discounts by creating NEW classes, no edits needed:
public class HolidayDiscount : IDiscountStrategy
{
    public bool AppliesTo(Order order) => IsHolidaySeason();
    public decimal Calculate(Order order) => order.Total * 0.20m;
}

// Orchestrator — closed for modification, open for extension
public class DiscountCalculator
{
    private readonly IEnumerable<IDiscountStrategy> _strategies;
    
    public DiscountCalculator(IEnumerable<IDiscountStrategy> strategies)
        => _strategies = strategies;

    public decimal GetBestDiscount(Order order)
        => _strategies
            .Where(s => s.AppliesTo(order))
            .Select(s => s.Calculate(order))
            .DefaultIfEmpty(0)
            .Max();
}`,
            language: 'csharp'
        },
        {
            title: 'Liskov Substitution & Interface Segregation',
            content: `<p><strong>Liskov Substitution (LSP):</strong> Subtypes must be usable wherever the base type is expected — no surprises, no thrown exceptions, no broken invariants.</p>
<p><strong>Interface Segregation (ISP):</strong> Clients should not depend on methods they do not use. Prefer many small, role-specific interfaces over one large "god interface."</p>
<p>These two principles are closely related: ISP prevents fat interfaces that force implementors to violate LSP (by throwing NotImplementedException).</p>`,
            code: `// LSP VIOLATION — Square breaks Rectangle contract
public class Rectangle
{
    public virtual int Width { get; set; }
    public virtual int Height { get; set; }
    public int Area => Width * Height;
}

public class Square : Rectangle
{
    public override int Width { set { base.Width = base.Height = value; } }
    public override int Height { set { base.Width = base.Height = value; } }
}
// Code that sets r.Width=5, r.Height=3, expects Area=15 gets Area=9!
// FIX: Use composition, not inheritance. Square IS NOT a Rectangle.

// ISP VIOLATION — fat interface forces empty implementations
public interface IWorker
{
    void Work();
    void Eat();     // Robots don't eat!
    void Sleep();   // Robots don't sleep!
}

// ISP FIX — role-specific interfaces
public interface IWorkable { void Work(); }
public interface IFeedable { void Eat(); }
public interface ISleepable { void Sleep(); }

public class Human : IWorkable, IFeedable, ISleepable { /* all apply */ }
public class Robot : IWorkable { /* only what it actually does */ }`,
            language: 'csharp'
        },
        {
            title: 'Dependency Inversion Principle',
            content: `<p><strong>DIP:</strong> High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details; details should depend on abstractions.</p>
<p>DIP is the principle. <strong>Dependency Injection (DI)</strong> is the technique to achieve it. <strong>IoC Containers</strong> are tools that automate DI.</p>`,
            mermaid: `flowchart TD
    subgraph Without DIP
        A[OrderService] -->|depends on| B[SqlRepository]
        A -->|depends on| C[SmtpEmailSender]
    end
    subgraph With DIP
        D[OrderService] -->|depends on| E[IOrderRepository]
        D -->|depends on| F[INotifier]
        G[SqlRepository] -.->|implements| E
        H[EmailNotifier] -.->|implements| F
    end`
        },
        {
            title: 'DRY, KISS, YAGNI — The Pragmatic Trio',
            content: `<p>These three principles guide day-to-day coding decisions and frequently tension against each other:</p>
<ul>
<li><strong>DRY (Don't Repeat Yourself)</strong> — Every piece of knowledge should have a single, authoritative representation. DRY is about <em>knowledge</em>, not <em>code text</em>. Two identical-looking code blocks that change for different reasons should stay separate.</li>
<li><strong>KISS (Keep It Simple, Stupid)</strong> — The simplest solution that meets requirements is the best. Complexity is a cost — it slows comprehension, increases bugs, and makes onboarding harder.</li>
<li><strong>YAGNI (You Aren't Gonna Need It)</strong> — Don't build features or abstractions for speculative future requirements. Build for today's needs; refactor when tomorrow's needs actually arrive.</li>
</ul>`,
            code: `// ═══ DRY applied correctly (shared KNOWLEDGE) ═══
// Tax rate is one piece of knowledge — define once:
public static class TaxConfig
{
    public const decimal StandardRate = 0.20m; // One source of truth
}

// ═══ DRY applied INCORRECTLY (coupling unrelated code) ═══
// These LOOK the same but change for different reasons:
public decimal CalculateTax(decimal amount) => amount * 0.20m;    // Changes when tax law changes
public decimal ApplyDiscount(decimal amount) => amount * 0.20m;   // Changes when marketing decides
// DO NOT merge these into a shared method — they have different change vectors!

// ═══ KISS example ═══
// Over-engineered:
public interface IGreetingStrategy { string Greet(string name); }
public class FormalGreeting : IGreetingStrategy { ... }
public class CasualGreeting : IGreetingStrategy { ... }
public class GreetingFactory { ... }

// KISS version (when there is only ONE greeting):
public string Greet(string name) => $"Hello, {name}!";

// ═══ YAGNI example ═══
// DON'T build a plugin system for one current use case:
// public interface IPlugin { void Execute(); }
// public class PluginLoader { /* registry, ordering, versioning... */ }

// DO build the simplest thing that works TODAY:
public void ProcessOrder(Order order)
{
    ValidateOrder(order);   // When you need a second processor,
    SaveOrder(order);       // THEN extract the abstraction.
}`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram — SOLID Relationships',
            content: `<p>The SOLID principles work together as a cohesive system. Each principle reinforces the others:</p>`,
            mermaid: `flowchart TD
    SRP[Single Responsibility] -->|enables| OCP[Open/Closed]
    OCP -->|requires| DIP[Dependency Inversion]
    DIP -->|uses| ISP[Interface Segregation]
    ISP -->|supports| LSP[Liskov Substitution]
    LSP -->|validates| OCP
    
    SRP -.->|"Small classes"| ISP
    DIP -.->|"Abstractions"| LSP
    
    style SRP fill:#e3f2fd
    style OCP fill:#e8f5e9
    style LSP fill:#fff3e0
    style ISP fill:#fce4ec
    style DIP fill:#f3e5f5`
        },
        {
            title: 'Law of Demeter & Other Principles',
            content: `<p>Beyond SOLID, several other principles guide clean architecture:</p>
<ul>
<li><strong>Law of Demeter (LoD)</strong> — "Talk only to your immediate friends." A method should only call methods on: itself, its parameters, objects it creates, and its direct fields. Never chain through: <code>order.Customer.Address.City</code></li>
<li><strong>Tell, Don't Ask</strong> — Tell objects what to do; don't ask for their data and compute externally. Moves logic to where the data lives.</li>
<li><strong>Composition over Inheritance</strong> — Favor composing behavior from small pieces rather than deep class hierarchies. Inheritance creates tight coupling.</li>
<li><strong>Separation of Concerns</strong> — Each module/layer addresses a distinct concern (UI, business logic, data access). Changes in one concern should not ripple to others.</li>
<li><strong>Principle of Least Astonishment</strong> — Code should behave as the reader expects. No hidden side effects, no surprising return values.</li>
<li><strong>CUPID</strong> — Composable, Unix-philosophy, Predictable, Idiomatic, Domain-based — a modern alternative framing of good code properties.</li>
</ul>`,
            code: `// Law of Demeter VIOLATION — reaching through objects
public string GetCustomerCity(Order order)
{
    return order.Customer.Address.City; // ❌ Train wreck — knows too much about structure
}

// Law of Demeter FIX — ask the order for what you need
public string GetCustomerCity(Order order)
{
    return order.GetShippingCity(); // ✅ Order encapsulates the navigation
}

// Tell, Don't Ask VIOLATION — pulling data out to compute externally
if (account.Balance > withdrawal.Amount)
{
    account.Balance -= withdrawal.Amount; // ❌ Business logic outside the entity
}

// Tell, Don't Ask FIX — tell the object to do it
var result = account.Withdraw(withdrawal.Amount); // ✅ Logic lives with the data
if (!result.IsSuccess) return result.Error;

// Composition over Inheritance
// ❌ Deep hierarchy: Animal → Pet → Dog → GuideDog
// ✅ Compose behaviors: Dog has ITrainable, IGuideBehavior, IFeedable`,
            language: 'csharp'
        },
        {
            title: 'Best Practices',
            content: `<ul>
<li><strong>Apply principles when you feel pain</strong> — Don't refactor proactively "because SOLID." Refactor when you encounter rigidity, fragility, or duplication.</li>
<li><strong>Rule of Three</strong> — Don't abstract until you have three real instances. Two similar things might be coincidence; three is a pattern.</li>
<li><strong>Favor readability</strong> — A slightly "impure" design that reads clearly beats an academically correct design requiring 10 file hops to understand.</li>
<li><strong>Test as design feedback</strong> — If a class is hard to unit test, it likely violates SRP or DIP. Tests reveal design problems.</li>
<li><strong>Keep inheritance shallow</strong> — 1-2 levels max. Prefer interfaces and composition for flexibility.</li>
<li><strong>Name things by role, not implementation</strong> — <code>IOrderRepository</code> not <code>ISqlOrderStore</code>. The interface belongs to the consumer.</li>
<li><strong>Single level of abstraction per method</strong> — Mix of high-level orchestration and low-level details in one method is hard to read.</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>SOLID dogmatism</strong> — Creating an interface for every class, even those with one implementation and no test seam need</li>
<li><strong>God classes</strong> — A single service class with 30+ methods doing everything for a domain entity</li>
<li><strong>Anemic domain models</strong> — Entities with only getters/setters and all logic in service classes (violates Tell Don't Ask)</li>
<li><strong>Premature generalization</strong> — Building abstract factories and strategy patterns for exactly one case</li>
<li><strong>Ignoring principles until crisis</strong> — Not applying any design thinking, then doing a massive rewrite when code becomes unmaintainable</li>
<li><strong>Interface per class reflexively</strong> — IFoo for every Foo, even when there will never be a second implementation</li>
<li><strong>Deep inheritance hierarchies</strong> — 5+ levels of class inheritance creating fragile base class problems</li>
<li><strong>Cargo cult patterns</strong> — Using Repository/UnitOfWork/CQRS "because everyone does" without understanding the problem they solve</li>
</ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>Don't just recite</strong> — Anyone can list S-O-L-I-D. Show you understand the WHY and can apply them to real code.</li>
<li><strong>Show judgment</strong> — When do you NOT apply a principle? Over-application awareness is a senior signal.</li>
<li><strong>Give real examples</strong> — "In our payment system, we violated OCP by..." is 10x better than textbook definitions.</li>
<li><strong>Connect to outcomes</strong> — "SRP reduced our deploy failures by 40% because changes were isolated."</li>
<li><strong>Know the tensions</strong> — DRY vs KISS, OCP vs YAGNI, SRP vs too-many-classes. Show you navigate trade-offs.</li>
<li><strong>Code on the spot</strong> — Be ready to refactor a violation live. Interviewers often give a messy class and ask you to improve it.</li>
</ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li>SOLID principles reduce coupling, increase cohesion, and make code testable and extensible</li>
<li>SRP = one reason to change; OCP = extend without modifying; LSP = subtypes are drop-in; ISP = small interfaces; DIP = depend on abstractions</li>
<li>DRY is about knowledge, not text — don't merge code that looks alike but changes for different reasons</li>
<li>KISS and YAGNI are the guardrails against over-engineering</li>
<li>Rule of Three: don't abstract until the third real instance</li>
<li>Principles are guidelines, not laws — pragmatic application beats dogmatic adherence</li>
<li>Test difficulty is a design smell — hard to test usually means SRP or DIP violation</li>
<li>Composition over inheritance for flexibility and looser coupling</li>
</ul>`
        }
    ],
    questions: [
        {"question":"What are the SOLID principles, and why do they matter for maintainable architecture?","difficulty":"medium","answer":"<p><strong>SOLID</strong> is five design principles: <strong>S</strong>ingle Responsibility (a class has one reason to change), <strong>O</strong>pen/Closed (open for extension, closed for modification), <strong>L</strong>iskov Substitution (subtypes must be usable wherever the base is), <strong>I</strong>nterface Segregation (many small focused interfaces over one fat one), and <strong>D</strong>ependency Inversion (depend on abstractions, not concretions).</p><p>They matter because they reduce coupling and increase cohesion, so changes stay localized, code is testable (via abstractions/DI), and features extend without rewriting existing code — the foundation of a codebase that survives change.</p>","explanation":"SOLID is like good building design: each room has one purpose, you can add an extension without demolishing walls, and rooms connect through standard doorways (interfaces) rather than being fused together.","bestPractices":["Aim for high cohesion, low coupling","Depend on abstractions (DI) for testability","Prefer small focused interfaces"],"commonMistakes":["God classes doing everything (violates SRP)","Fat interfaces forcing empty implementations","Depending on concrete types, blocking substitution/testing"],"interviewTip":"Do not just recite the acronym — tie each letter to the outcome (localized change, testability, extensibility). Give one concrete violation and its fix.","followUp":["Give an example of a Liskov violation.","How does Dependency Inversion enable testing?","Can SOLID be over-applied?"]},
        {"question":"What is the difference between coupling and cohesion, and why favor low coupling with high cohesion?","difficulty":"medium","answer":"<p><strong>Cohesion</strong> measures how closely the responsibilities within a module belong together; <strong>coupling</strong> measures how dependent modules are on each other. The goal is <strong>high cohesion</strong> (each module does one thing well) and <strong>low coupling</strong> (modules interact through minimal, stable interfaces).</p><p>Why: low coupling means a change in one module rarely forces changes in others (localized change, safer refactoring, independent testing); high cohesion makes modules easier to understand and reuse. Together they are the core measure of a maintainable design and directly enable microservice/module boundaries.</p>","explanation":"High cohesion is a well-organized toolbox where each drawer holds one kind of tool. Low coupling means you can reorganize one drawer without disturbing the others.","bestPractices":["Group related behavior; separate unrelated concerns","Interact via narrow, stable interfaces","Watch for ripple-effect changes as a coupling smell"],"commonMistakes":["Modules that must change together (high coupling)","Grab-bag utility classes (low cohesion)","Leaking internals across boundaries"],"interviewTip":"Define both crisply and connect to the payoff: low coupling localizes change, high cohesion aids understanding/reuse — the twin measures of good design.","followUp":["What are types of coupling (content, common, data)?","How do you detect high coupling?","How does this inform service boundaries?"]},
        {
            question: 'Explain the Dependency Inversion Principle. How is it different from Dependency Injection?',
            difficulty: 'medium',
            answer: `<p><strong>Dependency Inversion Principle (DIP)</strong> is a design principle: high-level modules should not depend on low-level modules; both should depend on abstractions. <strong>Dependency Injection (DI)</strong> is a technique/pattern to achieve DIP by injecting dependencies from outside rather than creating them internally.</p>
            <p>DIP = the WHY (principle). DI = the HOW (mechanism).</p>`,
            explanation: 'DIP says "don\'t hardwire your phone charger into the wall — use a standard plug." DI is the act of plugging in the correct charger from outside.',
            code: `// VIOLATING DIP — High-level depends on low-level concrete
public class OrderProcessor
{
    private readonly SqlOrderRepository _repo = new(); // ❌ Depends on concrete SQL
    private readonly SmtpEmailSender _email = new();   // ❌ Depends on concrete SMTP
    
    public void Process(Order order)
    {
        _repo.Save(order);
        _email.Send(order.Customer.Email, "Done!");
    }
}

// FOLLOWING DIP — Both depend on abstractions
public interface IOrderRepository
{
    Task SaveAsync(Order order, CancellationToken ct);
}

public interface INotifier
{
    Task NotifyAsync(string recipient, string message, CancellationToken ct);
}

// High-level module depends on abstractions (DIP)
// Dependencies provided externally (DI)
public class OrderProcessor
{
    private readonly IOrderRepository _repo;
    private readonly INotifier _notifier;

    public OrderProcessor(IOrderRepository repo, INotifier notifier) // DI
    {
        _repo = repo;
        _notifier = notifier;
    }

    public async Task ProcessAsync(Order order, CancellationToken ct)
    {
        await _repo.SaveAsync(order, ct);
        await _notifier.NotifyAsync(order.Customer.Email, "Done!", ct);
    }
}

// Registration — the composition root (Program.cs)
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();
builder.Services.AddScoped<INotifier, EmailNotifier>();
builder.Services.AddScoped<OrderProcessor>();`,
            language: 'csharp',
            bestPractices: [
                'Define abstractions (interfaces) at the same level as the consumer, not the implementation',
                'The interface belongs to the domain/application layer, not the infrastructure layer',
                'Use constructor injection for required dependencies',
                'Keep interfaces focused (Interface Segregation) — no god interfaces',
                'Composition root (Program.cs) is the only place that knows concrete types'
            ],
            commonMistakes: [
                'Confusing DIP (principle) with DI (technique) or IoC container (tool)',
                'Creating interfaces that mirror a single concrete class 1:1 (no abstraction value)',
                'Putting interface definitions in the infrastructure project (inverts the dependency wrong)',
                'Using service locator pattern instead of constructor injection'
            ],
            interviewTip: 'Draw a dependency diagram showing how DIP inverts the compile-time dependency arrow while preserving the runtime flow. The domain layer OWNS the interfaces.',
            followUp: ['Where should interface definitions live in Clean Architecture?', 'What is the Service Locator anti-pattern?', 'How does DI affect testability?'],
            seniorPerspective: 'The most common mistake I see is teams creating interfaces for every class reflexively. An interface only provides value if there are multiple implementations OR you need the seam for testing.',
            architectPerspective: 'DIP is the principle that enables plugin architectures, hexagonal architecture, and true infrastructure independence. The domain never references EF Core, HTTP clients, or cloud SDKs directly.'
        },
        {
            question: 'When does SOLID go too far? Give examples of over-engineering.',
            difficulty: 'architect',
            answer: `<p>SOLID becomes over-engineering when: abstractions add indirection without flexibility, single-responsibility creates explosion of tiny classes, or premature extension points add complexity for features that never materialize.</p>`,
            code: `// OVER-ENGINEERED — Abstraction for its own sake
public interface IStringFormatter { string Format(string s); }
public interface IStringFormatterFactory { IStringFormatter Create(); }
public class UpperCaseFormatter : IStringFormatter
{
    public string Format(string s) => s.ToUpper();
}
// Just use: string.ToUpper() !

// OVER-ENGINEERED — SRP taken to extreme
public class OrderIdGenerator { }
public class OrderDateAssigner { }
public class OrderStatusSetter { }
public class OrderTotalCalculator { }
public class OrderValidator { }
public class OrderPersister { }
// Reading the code requires jumping through 15 files for one workflow

// PRAGMATIC BALANCE — Cohesive, testable, not over-split
public class OrderService
{
    public async Task<Result<Order>> CreateAsync(CreateOrderRequest request, CancellationToken ct)
    {
        // Validation is inline when simple
        if (request.Items.Count == 0) 
            return Result.Failure<Order>("Order must have items");
        
        var order = Order.Create(request); // Domain logic in entity
        await _repository.SaveAsync(order, ct);
        await _events.PublishAsync(new OrderCreated(order.Id), ct);
        
        return Result.Success(order);
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Apply SOLID when you see actual pain (duplication, rigidity, fragility)',
                'Don\'t create interfaces until you have 2+ implementations or need test seams',
                'YAGNI trumps OCP — don\'t add extension points for hypothetical futures',
                'Readability > Architecture — if understanding requires 15 file jumps, simplify',
                'DRY applies to knowledge, not code — two similar code blocks with different reasons to change should stay separate'
            ],
            commonMistakes: [
                'Creating IRepository, IUnitOfWork, IService for every entity (generic abstraction explosion)',
                'Applying patterns "because it\'s best practice" without actual need',
                'Splitting a cohesive 50-line class into 5 classes of 10 lines each',
                'Adding extension points for features that may never be built (YAGNI violation)'
            ],
            interviewTip: 'Showing awareness of OVER-application demonstrates senior judgment. Anyone can apply patterns — knowing when NOT to is what separates senior from mid-level.',
            followUp: ['How do you decide when to add an abstraction?', 'What\'s the cost of premature abstraction?', 'How do you balance SOLID with KISS?'],
            seniorPerspective: 'My rule: the first implementation is concrete. I extract an interface only when I have a second consumer or need a test double. 80% of interfaces in most codebases serve no purpose.',
            architectPerspective: 'Architecture should serve the team\'s velocity, not the other way around. If junior developers can\'t follow the code path, you\'ve optimized for the wrong thing. Simple > Clever.'
        },
        {
            question: 'Explain the Single Responsibility Principle (SRP). How do you identify violations?',
            difficulty: 'easy',
            answer: `<p><strong>SRP:</strong> A class should have only one reason to change. This doesn't mean "one method" — it means one axis of change, one stakeholder whose requirements drive modifications to this class. Violations manifest as: a class that changes for multiple unrelated reasons, or a class name requiring "and" to describe.</p>`,
            code: `// VIOLATION — this class changes for 4 different reasons:
public class OrderService
{
    public void PlaceOrder(Order o)
    {
        // Reason 1: Business rules change (validation logic)
        if (o.Items.Count == 0) throw new Exception("Empty");
        
        // Reason 2: Database technology changes (persistence)
        using var conn = new SqlConnection(_connStr);
        conn.Execute("INSERT INTO Orders...", o);
        
        // Reason 3: Email provider changes (notifications)
        _smtp.Send(o.Customer.Email, "Order placed!");
        
        // Reason 4: Logging format/destination changes
        _logger.Info($"Order {o.Id} placed");
    }
}

// FIX — each class has ONE reason to change:
public class OrderService(IOrderValidator validator, IOrderRepository repo, IEventBus events)
{
    public async Task PlaceOrder(Order o)
    {
        validator.Validate(o);        // Reason: validation rules change
        await repo.SaveAsync(o);      // Reason: persistence technology changes
        await events.PublishAsync(new OrderPlacedEvent(o)); // Others react independently
    }
}
// Validators change when business rules change
// Repository changes when DB technology changes  
// Event handlers change when notification requirements change
// OrderService only changes when the WORKFLOW changes`,
            language: 'csharp',
            bestPractices: ['Ask "who would request a change to this class?" — if multiple stakeholders, split it', 'Use the "and" test: if class description needs "and", it has multiple responsibilities', 'Separate business logic from infrastructure concerns (persistence, notifications)', 'Keep methods in a class cohesive (they should all relate to the same concern)'],
            commonMistakes: ['Interpreting SRP as "one method per class" (too granular)', 'God classes that do everything (OrderService with 30 methods)', 'Not applying SRP to methods (a method doing 5 unrelated things)', 'Splitting too eagerly (creating dozens of single-method classes)'],
            interviewTip: 'Give a real violation example and walk through the refactoring. The "one reason to change" framing is more practical than "one thing" — show you understand SRP as about change vectors, not method count.',
            followUp: ['How do you balance SRP with too many small classes?', 'How does SRP relate to cohesion?', 'Can a class with multiple methods still follow SRP?'],
            seniorPerspective: 'I apply SRP at the class and service level using the "actor" lens: who requests changes? Business analyst → domain rules. DBA → persistence. DevOps → logging/monitoring. Each actor should affect different code.',
            architectPerspective: 'SRP at the architecture level becomes bounded contexts: each module/service changes for one business domain. If a change to pricing requires touching order, inventory, AND billing code — your boundaries are wrong.'
        },
        {
            question: 'Explain the Liskov Substitution Principle (LSP). What are the most common ways code violates it?',
            difficulty: 'hard',
            answer: `<p><strong>Liskov Substitution Principle:</strong> subtypes must be substitutable for their base types without altering the correctness of the program. Any code that works with a base type must keep working when given a derived type — no surprises.</p>
            <p>The most common violations:</p>
            <ul>
                <li><strong>Throwing on inherited members</strong> — a subclass overrides a method to throw <code>NotSupportedException</code></li>
                <li><strong>Strengthening preconditions</strong> — the subtype demands more than the base (rejects inputs the base accepted)</li>
                <li><strong>Weakening postconditions</strong> — the subtype returns less than the base promised (e.g., returns null where the base never did)</li>
                <li><strong>Changing invariants</strong> — the classic Square-extends-Rectangle problem where setting Width unexpectedly changes Height</li>
            </ul>`,
            explanation: 'LSP is the promise on a power adapter: if the label says it accepts any plug of a given shape, every plug of that shape must work. A plug that physically fits but secretly fries the device violates the contract even though it looks compatible.',
            code: `// VIOLATION — subtype throws on an inherited operation
public class ReadOnlyCollection<T> : List<T>
{
    public new void Add(T item) =>
        throw new NotSupportedException("Read-only"); // breaks substitutability
}
// Code that accepts List<T> and calls Add() now blows up at runtime.

// VIOLATION — Square breaks Rectangle's invariant
public class Rectangle
{
    public virtual int Width { get; set; }
    public virtual int Height { get; set; }
}
public class Square : Rectangle
{
    public override int Width { set { base.Width = base.Height = value; } }
    public override int Height { set { base.Width = base.Height = value; } }
}
// A method that sets Width=5, Height=4 and expects Area==20
// gets Area==16 for a Square. Substitution changed behavior.

// FIX — model the shared contract honestly, don't force inheritance
public interface IShape { int Area { get; } }

public sealed class Rectangle2 : IShape
{
    public Rectangle2(int width, int height) { Width = width; Height = height; }
    public int Width { get; }
    public int Height { get; }
    public int Area => Width * Height;
}

public sealed class Square2 : IShape
{
    public Square2(int side) => Side = side;
    public int Side { get; }
    public int Area => Side * Side;
}
// No false is-a relationship; each type honors its own invariants.`,
            language: 'csharp',
            bestPractices: [
                'Prefer composition or shared interfaces over inheritance when behavior differs',
                'Subtypes should accept at least what the base accepts (no stronger preconditions)',
                'Subtypes should guarantee at least what the base guarantees (no weaker postconditions)',
                'Make immutable value types when invariants would otherwise be hard to preserve'
            ],
            commonMistakes: [
                'Modeling Square as a subtype of Rectangle (different invariants)',
                'Overriding methods to throw NotSupportedException instead of redesigning the hierarchy',
                'Returning null or empty from an override when the base contract promised data',
                'Adding type checks (if obj is DerivedType) in client code — a symptom of broken substitution'
            ],
            interviewTip: 'Lead with the Square/Rectangle example because it is famous, then generalize to the precondition/postcondition rules. Mentioning that "if client code needs to check the concrete type, LSP is probably broken" signals depth.',
            followUp: ['How does LSP relate to design-by-contract?', 'How would you refactor a hierarchy that violates LSP?', 'Why is inheritance often the wrong default?'],
            seniorPerspective: 'Most LSP violations I see start as innocent inheritance for code reuse. The moment a subclass needs to disable or contradict a base member, that is the signal to switch to composition. Inheritance should model genuine behavioral substitutability, not save a few lines.',
            architectPerspective: 'At the API and plugin boundary, LSP is what makes polymorphic extension safe. If a third-party implementation of your interface can break callers by violating the implied contract, the contract was under-specified. I document pre/postconditions explicitly for any extensibility seam.'
        },
        {
            question: 'What is the Interface Segregation Principle (ISP), and how do you spot and fix a fat interface?',
            difficulty: 'medium',
            answer: `<p><strong>Interface Segregation Principle:</strong> clients should not be forced to depend on methods they do not use. Prefer many small, role-specific interfaces over one large general-purpose one.</p>
            <p><strong>Signals of a fat interface:</strong> implementors that throw <code>NotImplementedException</code> for several members, interfaces with 10+ unrelated methods, or a change to one method forcing recompilation of unrelated consumers.</p>`,
            explanation: 'ISP is like a restaurant menu split into sections. A vegan diner should not have to read the steak section to order. Role-specific interfaces let each client see only what is relevant to it.',
            code: `// VIOLATION — fat interface; not every device can do everything
public interface IMultiFunctionDevice
{
    void Print(Document d);
    void Scan(Document d);
    void Fax(Document d);
    void Staple(Document d);
}

public class BasicPrinter : IMultiFunctionDevice
{
    public void Print(Document d) { /* ok */ }
    public void Scan(Document d) => throw new NotImplementedException(); // smell
    public void Fax(Document d) => throw new NotImplementedException();  // smell
    public void Staple(Document d) => throw new NotImplementedException();
}

// FIX — segregate into role interfaces; compose as needed
public interface IPrinter { void Print(Document d); }
public interface IScanner { void Scan(Document d); }
public interface IFax { void Fax(Document d); }

public class BasicPrinter2 : IPrinter
{
    public void Print(Document d) { /* only what it supports */ }
}

public class OfficeMfp : IPrinter, IScanner, IFax
{
    public void Print(Document d) { }
    public void Scan(Document d) { }
    public void Fax(Document d) { }
}
// Clients depend only on the capability they need (IPrinter, IScanner...).`,
            language: 'csharp',
            bestPractices: [
                'Design interfaces around client roles, not around the implementing class',
                'Keep interfaces small and cohesive — ideally one responsibility',
                'Compose multiple small interfaces on a class when it genuinely has multiple roles',
                'Let consumers depend on the narrowest interface that meets their need'
            ],
            commonMistakes: [
                'Creating one big interface that mirrors a class 1:1',
                'Implementing members with NotImplementedException to satisfy a fat contract',
                'Forcing all implementors to change when one capability is added',
                'Confusing ISP (split by role) with simply having fewer methods'
            ],
            interviewTip: 'The NotImplementedException smell is the fastest way to demonstrate a violation. Then show the split into capability interfaces and note that a class can implement several of them.',
            followUp: ['How does ISP relate to the Single Responsibility Principle?', 'Can too many tiny interfaces be a problem?', 'How does ISP improve testability?'],
            seniorPerspective: 'I design interfaces from the consumer inward: I ask what the caller actually needs, name that role, and that becomes the interface. The implementation can satisfy several roles, but no caller is dragged along for capabilities it never touches.',
            architectPerspective: 'ISP keeps module boundaries crisp. When services share a bloated contract, an unrelated capability change ripples across teams. Role interfaces localize change and let independent teams evolve their slice without coordination.'
        },
        {
            question: 'Compare DRY, KISS, and YAGNI. When do they conflict, and how do you resolve the tension?',
            difficulty: 'advanced',
            answer: `<p><strong>DRY</strong> (Don\'t Repeat Yourself) targets duplicated <em>knowledge</em>. <strong>KISS</strong> (Keep It Simple) favors the simplest solution that works. <strong>YAGNI</strong> (You Aren\'t Gonna Need It) says don\'t build for speculative futures.</p>
            <p>They conflict because aggressive DRY can produce complex, over-coupled abstractions that violate KISS, and building flexible reuse points often violates YAGNI. The resolution: DRY applies to knowledge, not to coincidentally similar code. Two snippets that look alike but change for different reasons should stay separate (that is the WET/decoupling trade-off).</p>`,
            explanation: 'It is like organizing a kitchen. DRY says keep one salt shaker, not ten. But KISS and YAGNI warn against building an automated salt-dispensing robot for a shaker you use twice a year. Consolidate real duplication; do not over-engineer rare cases.',
            code: `// OVER-DRY — two rules that merely look alike get fused
public decimal Calculate(string kind, decimal amount) => kind switch
{
    "tax"      => amount * 0.2m,
    "discount" => amount * 0.2m, // same number TODAY, different reason to change
    _ => amount
};
// When tax law changes but discounts don't, this shared method becomes a trap.

// BETTER — separate knowledge that changes for different reasons (KISS + DRY)
public decimal ApplyTax(decimal amount) => amount * TaxRate;
public decimal ApplyDiscount(decimal amount) => amount * DiscountRate;

// YAGNI — don't build a plugin pipeline for one current rule
// Premature:
public interface IPricingRule { decimal Apply(decimal amount); }
public class RuleEngine { /* registry, ordering, config... */ }
// If there is exactly ONE rule today, a method is enough.
// Introduce the abstraction when the SECOND real rule arrives.`,
            language: 'csharp',
            bestPractices: [
                'Apply DRY to knowledge/business rules, not to superficially similar code',
                'Default to the simplest design (KISS); add structure when pain is real',
                'Defer abstractions until a concrete second use case exists (YAGNI)',
                'Use the "rule of three" — extract shared code after the third genuine repetition'
            ],
            commonMistakes: [
                'Fusing code that looks identical but changes for different reasons',
                'Building extensibility frameworks for a single current requirement',
                'Treating any duplication as a defect to eliminate immediately',
                'Choosing a clever abstraction over a readable, obvious solution'
            ],
            interviewTip: 'The killer line is "DRY is about knowledge, not text." Pair it with the rule of three and a YAGNI example to show you balance reuse against simplicity rather than applying principles reflexively.',
            followUp: ['What is the rule of three?', 'How does premature abstraction increase cost?', 'When is duplication preferable to coupling?'],
            seniorPerspective: 'The most expensive abstractions I have maintained were premature DRY — a shared base class or helper that fused unrelated cases, then sprouted flags and branches as the cases diverged. I now let duplication live until the shared concept is obvious, because de-coupling a bad abstraction is harder than DRYing duplication.',
            architectPerspective: 'At system scale, over-applied DRY produces shared libraries that couple independent services and turn every change into a coordinated release. I treat cross-service code sharing with suspicion: duplicating a small model is often cheaper than a shared dependency that forces lockstep deployment.'
        }
    ]
});
