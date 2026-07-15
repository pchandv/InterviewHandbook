/* ═══════════════════════════════════════════════════════════════════
   Architecture — Domain-Driven Design (DDD)
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('arch-ddd', {
    title: 'Domain-Driven Design',
    description: 'Strategic and tactical DDD — Bounded Contexts, Aggregates, Entities, Value Objects, Domain Events, Repositories, and applying DDD in modern .NET applications.',
    sections: [
        {
            title: 'Strategic DDD — Bounded Contexts & Ubiquitous Language',
            content: `<p><strong>Strategic DDD</strong> focuses on the big picture: how to decompose a large system into independently modeled domains. A <strong>Bounded Context</strong> is a boundary within which a specific domain model applies — the same real-world concept can have different meanings in different contexts.</p>
            <ul>
                <li><strong>Bounded Context</strong> — linguistic boundary where terms have precise, unambiguous meaning</li>
                <li><strong>Ubiquitous Language</strong> — shared vocabulary between developers and domain experts within a context</li>
                <li><strong>Context Map</strong> — relationships between bounded contexts (shared kernel, anti-corruption layer, etc.)</li>
            </ul>`,
            mermaid: `flowchart TB
    subgraph Sales["Sales Context"]
        SC["Customer<br/>(CreditScore, LTV)"]
        SO["Order<br/>(Lines, Discount)"]
    end
    subgraph Shipping["Shipping Context"]
        SR["Recipient<br/>(Address, Preferences)"]
        SP["Parcel<br/>(Weight, Dimensions)"]
    end
    subgraph Inventory["Inventory Context"]
        SI["StockItem<br/>(Qty, Location)"]
        SW["Warehouse<br/>(Capacity)"]
    end
    subgraph Billing["Billing Context"]
        BA["Account<br/>(Balance, Invoices)"]
        BP["Payment<br/>(Method, Status)"]
    end
    Sales -->|"Published Language<br/>(OrderPlaced event)"| Shipping
    Sales -->|"Published Language<br/>(OrderPlaced event)"| Inventory
    Sales -->|"Conformist"| Billing
    Shipping -.->|"Anti-Corruption Layer"| ExternalCarrier["External Carrier API"]
    
    style Sales fill:#4f46e5,color:#fff
    style Shipping fill:#059669,color:#fff
    style Inventory fill:#d97706,color:#fff
    style Billing fill:#dc2626,color:#fff`,
            code: `// Example: "Product" means different things in different contexts:

// Catalog Context — Product is browsable, has images, descriptions
namespace Catalog.Domain;
public class Product
{
    public ProductId Id { get; }
    public string Name { get; }
    public string Description { get; }
    public Money Price { get; }
    public List<Image> Images { get; }
    public Category Category { get; }
}

// Inventory Context — Product is a stock-keeping unit
namespace Inventory.Domain;
public class StockItem  // Same real product, different model!
{
    public Sku Sku { get; }
    public int QuantityOnHand { get; }
    public int ReorderPoint { get; }
    public WarehouseLocation Location { get; }
}

// Shipping Context — Product is a physical item to ship
namespace Shipping.Domain;
public class Parcel  // Same product again, different concern!
{
    public ParcelId Id { get; }
    public Weight Weight { get; }
    public Dimensions Dimensions { get; }
    public bool IsFragile { get; }
    public ShippingClass Class { get; }
}

// Context Map relationships:
// Catalog ←[Shared Kernel]→ Pricing  (share Money value object)
// Orders ←[Anti-Corruption Layer]→ ExternalPaymentProvider
// Inventory ←[Published Language]→ Warehouse (standard events)
// Shipping ←[Conformist]→ CarrierAPI (we adapt to their model)`,
            language: 'csharp'
        },
        {
            title: 'Tactical DDD — Aggregates, Entities, Value Objects',
            content: `<p><strong>Tactical DDD</strong> provides building blocks for implementing rich domain models within a bounded context.</p>
            <ul>
                <li><strong>Entity</strong> — has identity (Id), lifecycle, mutable state. Two entities with same properties but different IDs are different.</li>
                <li><strong>Value Object</strong> — defined by its attributes, immutable, no identity. Two VOs with same values ARE equal.</li>
                <li><strong>Aggregate</strong> — cluster of entities/VOs treated as a unit for consistency. Has a root entity that controls access.</li>
                <li><strong>Domain Event</strong> — something that happened in the domain, immutable record of fact.</li>
            </ul>`,
            code: `// VALUE OBJECT — immutable, equality by value
public record Money(decimal Amount, string Currency)
{
    public static Money Zero(string currency) => new(0, currency);
    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new DomainException("Cannot add different currencies");
        return this with { Amount = Amount + other.Amount };
    }
    public Money Multiply(int quantity) => this with { Amount = Amount * quantity };
}

public record Address(string Street, string City, string State, string ZipCode, string Country);

// ENTITY — has identity, lifecycle
public class Customer
{
    public CustomerId Id { get; private set; }
    public string Name { get; private set; }
    public Email Email { get; private set; }  // Email is a Value Object
    public Address ShippingAddress { get; private set; }

    public void UpdateEmail(Email newEmail)
    {
        if (newEmail == Email) return;
        Email = newEmail;
        AddDomainEvent(new CustomerEmailChangedEvent(Id, newEmail));
    }
}

// AGGREGATE — consistency boundary with root entity
public class Order : AggregateRoot  // Order is the Aggregate Root
{
    public OrderId Id { get; private set; }
    public CustomerId CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    private readonly List<OrderLine> _lines = new();  // Internal entity
    public IReadOnlyList<OrderLine> Lines => _lines.AsReadOnly();
    public Money Total => _lines.Aggregate(Money.Zero("USD"), 
        (sum, line) => sum.Add(line.Subtotal));

    // All mutations go through the aggregate root
    public void AddLine(ProductId productId, Money unitPrice, int quantity)
    {
        Guard.Against(Status != OrderStatus.Draft, "Cannot modify submitted order");
        Guard.Against(quantity <= 0, "Quantity must be positive");
        
        var existing = _lines.FirstOrDefault(l => l.ProductId == productId);
        if (existing is not null)
            existing.IncreaseQuantity(quantity);
        else
            _lines.Add(new OrderLine(productId, unitPrice, quantity));
    }

    public void Submit()
    {
        Guard.Against(!_lines.Any(), "Order must have at least one line");
        Status = OrderStatus.Submitted;
        AddDomainEvent(new OrderSubmittedEvent(Id, CustomerId, Total));
    }

    public void Cancel(string reason)
    {
        Guard.Against(Status == OrderStatus.Shipped, "Cannot cancel shipped order");
        Status = OrderStatus.Cancelled;
        AddDomainEvent(new OrderCancelledEvent(Id, reason));
    }
}

// DOMAIN EVENT — immutable record of something that happened
public record OrderSubmittedEvent(OrderId OrderId, CustomerId CustomerId, Money Total) 
    : IDomainEvent;`,
            language: 'csharp'
        },
        {
            title: 'Aggregate Design Rules',
            content: `<p>Proper aggregate design is critical for consistency, performance, and scalability. Aggregates define transactional boundaries — one transaction per aggregate.</p>`,
            code: `// AGGREGATE DESIGN RULES:

// Rule 1: Protect invariants within a single aggregate
// The aggregate root ensures all business rules are valid
public class Order
{
    public void AddLine(...)
    {
        // Invariant: max 50 lines per order
        if (_lines.Count >= 50)
            throw new DomainException("Order cannot exceed 50 lines");
    }
}

// Rule 2: Keep aggregates SMALL (prefer fewer entities inside)
// BAD: Order aggregate contains Customer, Products, Payments
// GOOD: Order references CustomerId, ProductId (just IDs to other aggregates)

// Rule 3: Reference other aggregates by ID only
public class Order
{
    public CustomerId CustomerId { get; }  // Reference by ID ✓
    // public Customer Customer { get; }   // Direct reference ✗ (crosses boundary)
}

// Rule 4: One transaction = one aggregate
// BAD: Update Order AND Inventory in same transaction
// GOOD: Order emits event → Inventory handler updates separately (eventual consistency)

// Rule 5: Use domain events for cross-aggregate communication
public class OrderSubmittedHandler : INotificationHandler<OrderSubmittedEvent>
{
    public async Task Handle(OrderSubmittedEvent evt, CancellationToken ct)
    {
        // Different aggregate, different transaction
        await _inventoryService.ReserveStockAsync(evt.OrderId, ct);
        await _emailService.SendConfirmationAsync(evt.CustomerId, ct);
    }
}

// REPOSITORY pattern — one per aggregate root (not per entity!)
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(OrderId id, CancellationToken ct);
    Task SaveAsync(Order order, CancellationToken ct);
    // No: GetOrderLineByIdAsync — lines accessed via Order root only
}

// Aggregate size heuristic:
// If you're loading 100+ entities into an aggregate → too big
// If you need to lock the aggregate for unrelated changes → split it
// If two parts change at different rates → separate aggregates`,
            language: 'csharp',
            callout: { type: 'warning', title: 'Aggregate Size', text: 'Large aggregates cause lock contention and performance issues. If Order contains 1000 OrderLines and you need to update one line, you load/lock the entire aggregate. Design aggregates around consistency requirements, not convenience.' }
        }
    ],
    questions: [
        {"question":"What is an aggregate in DDD, and what rules govern aggregate design?","difficulty":"hard","answer":"<p>An <strong>aggregate</strong> is a cluster of related entities and value objects treated as a single consistency boundary, with one <strong>aggregate root</strong> as the only entry point. All external references go through the root, and invariants within the aggregate are always kept consistent within a single transaction.</p><p>Design rules: keep aggregates <strong>small</strong> (ideally one aggregate = one transaction), reference other aggregates <strong>by id</strong> (not object references), enforce invariants only inside the boundary, and update one aggregate per transaction — cross-aggregate consistency is achieved with domain events / eventual consistency, not one big transaction.</p>","explanation":"An aggregate is a folder with a cover sheet (the root): you only touch the contents through the cover, and the folder is always internally consistent. Other folders are referenced by their label (id), not stapled together.","bestPractices":["Keep aggregates small (one aggregate per transaction)","Reference other aggregates by id","Enforce invariants inside the boundary; use events across boundaries"],"commonMistakes":["Huge aggregates causing contention and large transactions","Direct object references between aggregates","Trying to keep multiple aggregates strongly consistent in one transaction"],"interviewTip":"The rules that impress: small aggregates, reference-by-id, one aggregate per transaction, events for cross-aggregate consistency.","followUp":["Why reference other aggregates by id?","How do domain events achieve cross-aggregate consistency?","How do aggregates map to microservice boundaries?"]},
        {"question":"What is the difference between an entity and a value object in DDD?","difficulty":"medium","answer":"<p>An <strong>entity</strong> has a distinct <strong>identity</strong> that persists over time regardless of attribute changes (a Customer is the same customer even if their name changes) — equality is by id. A <strong>value object</strong> has <strong>no identity</strong>; it is defined entirely by its attributes (a Money of $10 USD equals any other $10 USD), is immutable, and is compared by value.</p><p>Modeling something as a value object when it has no meaningful identity simplifies the domain: value objects are immutable, freely shareable, and side-effect free — reducing bugs. Reserve entities for concepts with a lifecycle and identity.</p>","explanation":"An entity is a person (still the same person after a haircut or name change). A value object is a $10 note — one is interchangeable with any other $10, and you would not track its individual identity.","bestPractices":["Model identity-less concepts as immutable value objects","Compare entities by id, value objects by value","Push behavior/validation into value objects"],"commonMistakes":["Making everything an entity with an id","Mutable value objects causing aliasing bugs","Comparing entities by attributes instead of identity"],"interviewTip":"Identity vs attribute-equality is the crux: entity = identity over time, value object = defined by value and immutable.","followUp":["Why should value objects be immutable?","Can a value object contain entities?","How does this affect database mapping?"]},
        {
            question: 'What is a Bounded Context and why is it important in DDD?',
            difficulty: 'medium',
            answer: `<p>A <strong>Bounded Context</strong> is a linguistic and model boundary within which a specific domain model has precise, unambiguous meaning. The same real-world concept (e.g., "Customer") can have different attributes and behaviors in different contexts (Sales vs Shipping vs Billing). Bounded Contexts prevent model pollution and enable team autonomy.</p>`,
            code: `// "Customer" in different bounded contexts:

// Sales Context: Customer is someone who buys things
public class Customer {
    public string Name { get; }
    public CreditScore CreditScore { get; }
    public PurchaseHistory History { get; }
    public decimal LifetimeValue { get; }
}

// Support Context: Customer is someone who needs help
public class Customer {
    public string Name { get; }
    public List<Ticket> OpenTickets { get; }
    public SupportTier Tier { get; }
    public DateTime LastContactDate { get; }
}

// Shipping Context: Customer is a delivery destination
public class Recipient {  // Even the NAME differs!
    public string Name { get; }
    public Address DeliveryAddress { get; }
    public DeliveryPreferences Preferences { get; }
}

// Why this matters:
// 1. No "god object" — Customer doesn't have 200 properties
// 2. Each team owns their model independently
// 3. Changes in one context don't cascade to others
// 4. Models are optimized for their specific use case
// 5. Matches how domain experts actually think and talk

// Integration between contexts:
// Anti-Corruption Layer (ACL):
public class ExternalPaymentAdapter : IPaymentGateway
{
    private readonly ThirdPartyPaymentClient _client;
    
    public async Task<PaymentResult> ChargeAsync(Money amount)
    {
        // Translate OUR domain model to THEIR API model
        var request = new ExternalChargeRequest
        {
            AmountCents = (int)(amount.Amount * 100),
            CurrencyCode = amount.Currency
        };
        var response = await _client.CreateChargeAsync(request);
        // Translate THEIR response back to OUR domain model
        return new PaymentResult(response.Id, response.Status == "succeeded");
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Align bounded contexts with team boundaries (Conway\'s Law)',
                'Use ubiquitous language within each context (same words = same meaning)',
                'Keep contexts independent — communicate via events or ACLs',
                'Don\'t force a single model across the entire system'
            ],
            commonMistakes: [
                'One big shared model across the entire application (god objects)',
                'Treating bounded contexts as just code organization (it\'s about language/meaning)',
                'Sharing entity classes across contexts (tight coupling)',
                'Not involving domain experts in context boundary discovery'
            ],
            interviewTip: 'The key insight: Bounded Contexts are about LANGUAGE, not just code. When the word "Account" means something different to Sales vs Finance, that\'s a context boundary. Explain with a concrete example from your experience.',
            followUp: ['How do bounded contexts map to microservices?', 'What is a Context Map?', 'What is an Anti-Corruption Layer?'],
            seniorPerspective: 'I identify bounded contexts through event storming workshops with domain experts. When two experts argue about what a term means — that\'s a context boundary. Each context gets its own model, potentially its own database schema.',
            architectPerspective: 'Bounded contexts are the strategic tool that makes microservice decomposition rational. Each microservice should map to one bounded context. If you can\'t identify clear context boundaries, you\'re not ready for microservices — start with a modular monolith.'
        },
        {
            question: 'What is an Aggregate? Explain the aggregate design rules.',
            difficulty: 'advanced',
            answer: `<p>An <strong>Aggregate</strong> is a cluster of domain objects (entities + value objects) treated as a single unit for data changes. It has a <strong>root entity</strong> that controls all access to internal objects and enforces invariants. Aggregates define consistency/transactional boundaries — one transaction should modify at most one aggregate.</p>`,
            code: `// Aggregate design rules:
// 1. Only the root is accessible from outside
// 2. Aggregates reference each other by ID only
// 3. One transaction per aggregate
// 4. Keep aggregates small
// 5. Use eventual consistency between aggregates

// Example: Order Aggregate
public class Order : AggregateRoot<OrderId>
{
    // Internal entities — not directly accessible
    private readonly List<OrderLine> _lines = new();
    
    // Public read-only access
    public IReadOnlyList<OrderLine> Lines => _lines.AsReadOnly();
    public OrderStatus Status { get; private set; }
    public CustomerId CustomerId { get; private set; } // ID reference, not entity!
    
    // All mutations through root — enforces invariants
    public void AddLine(ProductId product, Money price, int qty)
    {
        // Invariant: cannot modify after submission
        if (Status != OrderStatus.Draft)
            throw new OrderDomainException("Cannot modify submitted order");
        
        // Invariant: max 50 lines
        if (_lines.Count >= 50)
            throw new OrderDomainException("Maximum 50 lines per order");
        
        _lines.Add(new OrderLine(product, price, qty));
    }
    
    public void Submit()
    {
        // Invariant: must have lines
        if (!_lines.Any())
            throw new OrderDomainException("Cannot submit empty order");
        
        Status = OrderStatus.Submitted;
        // Domain event for cross-aggregate communication
        AddDomainEvent(new OrderSubmittedEvent(Id, Total));
    }
}

// WRONG: Modifying two aggregates in one transaction
public async Task PlaceOrder(Order order)
{
    order.Submit();
    var customer = await _customers.GetAsync(order.CustomerId);
    customer.AddLoyaltyPoints(order.Total); // Different aggregate!
    await _unitOfWork.SaveChangesAsync(); // Both in same transaction — BAD!
}

// RIGHT: Domain event + eventual consistency
public async Task PlaceOrder(Order order)
{
    order.Submit(); // Raises OrderSubmittedEvent
    await _orders.SaveAsync(order); // Single aggregate transaction
}
// Separate handler (different transaction):
public class AddLoyaltyPointsHandler : INotificationHandler<OrderSubmittedEvent>
{
    public async Task Handle(OrderSubmittedEvent evt, CancellationToken ct)
    {
        var customer = await _customers.GetAsync(evt.CustomerId, ct);
        customer.AddLoyaltyPoints(evt.Total);
        await _customers.SaveAsync(customer, ct);
    }
}`,
            language: 'csharp',
            bestPractices: [
                'One aggregate per transaction — use domain events for cross-aggregate coordination',
                'Reference other aggregates by ID only (not direct object reference)',
                'Keep aggregates small — design around invariant boundaries, not data relationships',
                'The aggregate root is the only entry point for mutations'
            ],
            commonMistakes: [
                'Making aggregates too large (loading entire object graphs into memory)',
                'Modifying multiple aggregates in one transaction (breaks scalability)',
                'Exposing internal entities directly (bypasses root invariant protection)',
                'Anemic aggregates with no behavior (just getters/setters, logic in services)'
            ],
            interviewTip: 'The aggregate boundary question is "what MUST be consistent in a single transaction?" If OrderLine must be consistent with Order total — they are in the same aggregate. If Customer loyalty points can be eventually consistent with Order — separate aggregates.',
            followUp: ['How do you determine aggregate boundaries?', 'What is eventual consistency between aggregates?', 'How do domain events enable loose coupling?'],
            seniorPerspective: 'The hardest DDD decision is aggregate sizing. Too big = concurrency hell (entire Order locked to add one line). Too small = consistency spread across events. I start small and merge only when invariants demand it.',
            architectPerspective: 'Aggregate boundaries directly determine your scalability ceiling. Each aggregate is independently lockable/shardable. In event-sourced systems, aggregate = stream boundary = unit of consistency. This is why getting boundaries right is the most impactful architectural decision in DDD.'
        },
        {
            question: 'What distinguishes a Value Object from an Entity, and why do Value Objects make a domain model more robust?',
            difficulty: 'medium',
            answer: `<p>The distinction is <strong>identity</strong>:</p>
            <ul>
                <li>An <strong>Entity</strong> has a unique identity that persists through change. Two entities with identical attributes are still different things if their IDs differ (two customers both named "John Smith").</li>
                <li>A <strong>Value Object</strong> has <strong>no identity</strong> — it is defined entirely by its attributes. Two Value Objects with equal attributes ARE equal and interchangeable (two Money instances of 100 USD).</li>
            </ul>
            <p>Value Objects make the model more robust because they are <strong>immutable</strong>, <strong>self-validating</strong>, and <strong>behavior-rich</strong>. Instead of passing a raw <code>decimal</code> for money or a <code>string</code> for email, you pass a type that cannot exist in an invalid state and that carries its own operations. This eliminates whole classes of bugs (mixing currencies, invalid emails, primitive obsession) and makes the code read like the domain.</p>`,
            explanation: 'An Entity is like a person — they get a new haircut and new clothes but are still the same individual tracked by their passport number. A Value Object is like a banknote — one 10 dollar note is perfectly interchangeable with any other; you care about the value, not which specific note it is.',
            code: `// VALUE OBJECT — immutable, equality by value, self-validating, behavior-rich
public sealed record Email
{
    public string Value { get; }
    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || !value.Contains('@'))
            throw new DomainException("Invalid email address");
        Value = value.Trim().ToLowerInvariant(); // normalized — equality is reliable
    }
    public override string ToString() => Value;
}

public sealed record Money(decimal Amount, string Currency)
{
    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new DomainException("Cannot add different currencies"); // invariant
        return this with { Amount = Amount + other.Amount };
    }
}

// records give value equality for free:
var a = new Money(100, "USD");
var b = new Money(100, "USD");
bool equal = a == b; // true — same value, no identity

// ENTITY — equality by identity, mutable lifecycle
public class Customer
{
    public CustomerId Id { get; }          // identity defines equality
    public Email Email { get; private set; } // attribute is a Value Object
    public override bool Equals(object? o) => o is Customer c && c.Id == Id;
    public override int GetHashCode() => Id.GetHashCode();
}`,
            language: 'csharp',
            bestPractices: [
                'Make Value Objects immutable so they can be shared and reasoned about safely',
                'Validate invariants in the constructor so an invalid Value Object cannot exist',
                'Replace primitives (string, decimal, Guid) with Value Objects to defeat primitive obsession',
                'Use C# records or override Equals/GetHashCode to get reliable value equality'
            ],
            commonMistakes: [
                'Giving a Value Object a database identity and treating it like an entity',
                'Making Value Objects mutable, which breaks equality and enables shared-state bugs',
                'Skipping validation so invalid values (negative money, bad emails) slip into the domain',
                'Primitive obsession — passing raw strings and decimals everywhere instead of typed values'
            ],
            interviewTip: 'Lead with the identity test: "would two instances with the same fields be the same thing?" If yes, it is a Value Object; if no (it has a lifecycle and ID), it is an Entity. Then mention immutability and self-validation as the practical payoffs.',
            followUp: ['How do you persist Value Objects in EF Core (owned types)?', 'What is primitive obsession?', 'Can a Value Object contain other Value Objects?'],
            seniorPerspective: 'Aggressively converting primitives into Value Objects is one of the highest-leverage habits I have. A Money, Email, or DateRange type that validates itself removes defensive checks scattered across the codebase and turns a class of runtime bugs into impossible states.',
            architectPerspective: 'Value Objects are where the ubiquitous language gets encoded into the type system. When the domain vocabulary (Money, Quantity, Percentage) exists as first-class immutable types, the model resists corruption and new developers learn the domain by reading the types rather than chasing validation logic.'
        },
        {
            question: 'What are Domain Events, and how do they enable loose coupling between aggregates and bounded contexts?',
            difficulty: 'advanced',
            answer: `<p>A <strong>Domain Event</strong> is an immutable record that <strong>something meaningful happened in the domain</strong>, expressed in past tense and in the ubiquitous language — <code>OrderSubmitted</code>, <code>PaymentCaptured</code>, <code>CustomerDeactivated</code>. The aggregate that owns the change raises the event; other parts of the system react to it.</p>
            <p>They enable loose coupling at two levels:</p>
            <ul>
                <li><strong>Within a bounded context (in-process):</strong> instead of one aggregate directly calling another (violating the one-transaction-per-aggregate rule), it raises an event. A handler updates the other aggregate in a <strong>separate transaction</strong>, giving eventual consistency without a god-method that knows about everything.</li>
                <li><strong>Across bounded contexts (out-of-process):</strong> domain events are translated into <strong>integration events</strong> published to a broker. Downstream contexts subscribe without the publisher knowing they exist — the publisher depends on no consumer.</li>
            </ul>
            <p>The key discipline: domain events should be <strong>raised inside the aggregate</strong> as part of the state change, then <strong>dispatched after the transaction commits</strong> (or via a transactional outbox) so you never publish an event for a change that rolled back.</p>`,
            explanation: 'A domain event is like a company announcing "the order shipped." The shipping team does not phone every department individually. They post the announcement, and whoever cares — billing, the customer, analytics — reacts on their own. The announcer does not need to know who is listening.',
            mermaid: `sequenceDiagram
    participant UC as Submit Order Use Case
    participant Agg as Order Aggregate
    participant Disp as Event Dispatcher
    participant H1 as Inventory Handler
    participant H2 as Notification Handler

    UC->>Agg: order.Submit()
    Agg->>Agg: set Status = Submitted
    Agg-->>UC: raises OrderSubmitted (held internally)
    UC->>UC: SaveChanges() commits transaction
    UC->>Disp: dispatch domain events (after commit)
    Disp->>H1: OrderSubmitted
    Disp->>H2: OrderSubmitted
    Note over H1,H2: each handler runs in its own transaction (eventual consistency)`,
            code: `// Aggregate raises the event as part of the state change
public class Order : AggregateRoot
{
    public OrderStatus Status { get; private set; }
    public void Submit()
    {
        if (!Lines.Any()) throw new DomainException("Order must have items");
        Status = OrderStatus.Submitted;
        AddDomainEvent(new OrderSubmitted(Id, CustomerId, Total)); // past tense, immutable
    }
}

public record OrderSubmitted(OrderId OrderId, CustomerId CustomerId, Money Total) : IDomainEvent;

// Dispatch AFTER commit so a rolled-back change never publishes an event
public class UnitOfWork
{
    public async Task CommitAsync(CancellationToken ct)
    {
        var events = _changeTracker.CollectDomainEvents();
        await _db.SaveChangesAsync(ct);          // 1. persist the state change
        foreach (var e in events)
            await _mediator.Publish(e, ct);       // 2. then notify handlers
    }
}

// Handler reacts in its OWN transaction — different aggregate, eventual consistency
public class ReserveStockOnOrderSubmitted : INotificationHandler<OrderSubmitted>
{
    public async Task Handle(OrderSubmitted e, CancellationToken ct)
        => await _inventory.ReserveAsync(e.OrderId, ct);
}`,
            language: 'csharp',
            bestPractices: [
                'Name events in past tense using the ubiquitous language (OrderSubmitted, not SubmitOrder)',
                'Make events immutable and carry only the data consumers need',
                'Dispatch after the transaction commits, or use a transactional outbox for reliability',
                'Distinguish internal domain events from external integration events at the context boundary'
            ],
            commonMistakes: [
                'Publishing events before the transaction commits, leaking phantom events on rollback',
                'Modifying multiple aggregates in one transaction instead of coordinating via events',
                'Putting behavior/decisions inside the event itself rather than in handlers',
                'Leaking internal domain events across context boundaries as public contracts'
            ],
            interviewTip: 'Emphasize the timing rule: events are raised inside the aggregate but dispatched after commit. Then connect it to the aggregate rule — events are how you respect one-transaction-per-aggregate while still keeping the system in sync.',
            followUp: ['How does the transactional outbox guarantee reliable event publishing?', 'What is the difference between a domain event and an integration event?', 'How do you make event handlers idempotent?'],
            seniorPerspective: 'I keep domain events in-process and synchronous-after-commit within a context, and only promote them to integration events at the boundary. Conflating the two is a common mistake — internal events are an implementation detail you are free to change, while integration events are a published contract you must version.',
            architectPerspective: 'Domain events are the seam along which a modular monolith later splits into services. If the contexts already communicate through well-named events instead of direct calls, extraction becomes swapping the in-process dispatcher for a message broker — the business logic does not change. Designing those events early is an investment in future optionality.'
        },
        {
            question: 'What is Ubiquitous Language, and what concretely goes wrong when the team does not maintain one?',
            difficulty: 'medium',
            answer: `<p><strong>Ubiquitous Language</strong> is a shared, rigorous vocabulary — built jointly by developers and domain experts — that is used <strong>everywhere</strong>: in conversations, documentation, tests, and the code itself (class names, methods, events). Within a bounded context, each term has one precise meaning, and the code is expected to speak that language literally.</p>
            <p>When it is missing, you get <strong>translation friction and bugs born from ambiguity</strong>:</p>
            <ul>
                <li><strong>Mistranslation:</strong> experts say "policy lapses," developers code <code>status = 3</code>; the mapping lives only in someone head and drifts over time.</li>
                <li><strong>Ambiguous terms:</strong> "user," "account," and "customer" get used interchangeably until nobody knows which is which, and rules attach to the wrong concept.</li>
                <li><strong>Hidden context boundaries:</strong> when the same word means different things to two teams, that disagreement is actually a bounded-context boundary that goes unrecognized, producing a tangled shared model.</li>
                <li><strong>Slow onboarding and miscommunication:</strong> every requirements conversation needs re-translation between business and technical terms.</li>
            </ul>`,
            explanation: 'Ubiquitous Language is like a control tower and pilots using identical phraseology. If the tower says "hold short" and the pilot interprets it loosely, the precise shared vocabulary is the only thing preventing a collision. The code should speak the same words the domain experts use, with no private dialect.',
            code: `// WITHOUT ubiquitous language — code speaks its own dialect, experts cannot read it
public class Rec
{
    public int St { get; set; }   // status? what do the numbers mean?
    public void Proc()            // "process"... process what?
    {
        if (St == 3) St = 4;      // magic numbers encode rules nobody can see
    }
}

// WITH ubiquitous language — code reads like the domain expert speaks
public class InsurancePolicy
{
    public PolicyStatus Status { get; private set; }

    // Domain expert: "an active policy lapses when the grace period ends unpaid"
    public void Lapse()
    {
        if (Status != PolicyStatus.Active)
            throw new DomainException("Only an active policy can lapse");
        Status = PolicyStatus.Lapsed;
        AddDomainEvent(new PolicyLapsed(Id));
    }

    public void Reinstate(Money payment) { /* "reinstate a lapsed policy" */ }
}
// The method names (Lapse, Reinstate) ARE the business vocabulary.`,
            language: 'csharp',
            bestPractices: [
                'Build the language with domain experts and use the exact same terms in code',
                'Keep one precise meaning per term within a bounded context',
                'Treat a term that means two different things as a signal of a context boundary',
                'Refactor code names whenever the agreed language evolves'
            ],
            commonMistakes: [
                'Inventing developer-only jargon that domain experts would not recognize',
                'Encoding business rules as magic numbers or vague names (status = 3, Process())',
                'Forcing one global model and one meaning of a term across the whole company',
                'Letting the language drift in conversation while the code keeps stale terms'
            ],
            interviewTip: 'Give a concrete clash: the word "account" means a login to one team and a financial balance to another. Explain that this is not just naming pedantry — it reveals a bounded-context boundary and prevents real bugs.',
            followUp: ['How does ubiquitous language relate to bounded contexts?', 'What is event storming and how does it surface the language?', 'How do you keep the language and the code in sync over time?'],
            seniorPerspective: 'I treat a vocabulary disagreement between two stakeholders as a design signal, not noise. When "shipment" means different things to logistics and to billing, I stop trying to reconcile them into one model and instead draw a context boundary — that single decision prevents an enormous amount of downstream coupling.',
            architectPerspective: 'Ubiquitous Language is the connective tissue of strategic DDD. Bounded contexts are literally defined by where the language changes meaning, so a team that cannot articulate its language cannot draw rational service boundaries. I insist the language live in the code, because documentation drifts but a compiled domain model does not lie.'
        },
        {
            question: 'What is Event Storming, and how does it help you discover bounded contexts and aggregates?',
            difficulty: 'advanced',
            answer: `<p><strong>Event Storming</strong> (Alberto Brandolini) is a collaborative workshop where developers and domain experts model a business process together on a long wall using sticky notes. It is deliberately low-tech so non-technical experts participate as equals. The process explores the domain through the <strong>events</strong> that happen in it, building shared understanding fast.</p>
            <p>The notation is colour-coded and assembled on a timeline:</p>
            <ul>
                <li><strong>Domain Events (orange)</strong> — facts in past tense: <code>OrderPlaced</code>, <code>PaymentCaptured</code>. These come first and drive everything.</li>
                <li><strong>Commands (blue)</strong> — the action/intent that causes an event: <code>PlaceOrder</code>.</li>
                <li><strong>Actors (yellow)</strong> — who issues the command.</li>
                <li><strong>Aggregates (pale yellow)</strong> — the consistency boundary that receives commands and emits events.</li>
                <li><strong>Policies (lilac)</strong> — reactive rules: "whenever X happens, do Y".</li>
                <li><strong>External systems (pink)</strong> and <strong>read models (green)</strong>.</li>
                <li><strong>Hotspots (red)</strong> — disagreements, unknowns, or pain points.</li>
            </ul>
            <p>It helps discover <strong>bounded contexts</strong> because clusters of tightly related events — and, tellingly, places where the same term changes meaning or a <strong>red hotspot</strong> flares up — reveal natural seams. It helps discover <strong>aggregates</strong> because the commands and the events they produce cluster around the consistency boundary that owns them. The events also surface the <strong>ubiquitous language</strong> directly, since experts name them in their own words.</p>`,
            explanation: 'Event Storming is like laying out a crime-scene timeline on a wall with the whole team. You pin up everything that happened (events) in order, then ask who did what and why (commands, actors), where the suspects cluster (aggregates), and where everyone argues about the facts (hotspots). The clusters and arguments show you exactly where to draw the boundaries.',
            mermaid: `flowchart LR
    A["Actor:<br/>Customer (yellow)"] -->|issues| C["Command:<br/>PlaceOrder (blue)"]
    C --> AG["Aggregate:<br/>Order (pale yellow)"]
    AG -->|emits| E1["Event:<br/>OrderPlaced (orange)"]
    E1 --> P["Policy:<br/>whenever OrderPlaced,<br/>capture payment (lilac)"]
    P --> C2["Command:<br/>CapturePayment (blue)"]
    C2 --> AG2["Aggregate:<br/>Payment (pale yellow)"]
    AG2 -->|emits| E2["Event:<br/>PaymentCaptured (orange)"]
    E1 --> RM["Read Model:<br/>Order Summary (green)"]
    H["Hotspot:<br/>refund rules unclear? (red)"]
    style H fill:#fee2e2,color:#1e293b`,
            code: `// Event Storming output translates almost directly into the tactical model.
// Wall: [Customer] -PlaceOrder-> (Order) =OrderPlaced=> {policy} =CapturePayment=> (Payment) =PaymentCaptured=>

// Command (blue) — the intent captured on the wall
public record PlaceOrder(CustomerId CustomerId, IReadOnlyList<OrderLineDto> Lines);

// Aggregate (pale yellow) — receives the command, enforces invariants, emits the event (orange)
public class Order : AggregateRoot
{
    public static Order Place(PlaceOrder cmd)
    {
        if (cmd.Lines.Count == 0) throw new DomainException("Order must have items");
        var order = new Order(cmd.CustomerId, cmd.Lines);
        order.AddDomainEvent(new OrderPlaced(order.Id, cmd.CustomerId)); // the orange sticky
        return order;
    }
}

// Policy (lilac) — "whenever OrderPlaced, capture payment" becomes a handler
public class CapturePaymentPolicy : INotificationHandler<OrderPlaced>
{
    public Task Handle(OrderPlaced e, CancellationToken ct)
        => _mediator.Send(new CapturePayment(e.OrderId), ct);
}
// Each colour on the wall maps to a code construct — discovery to design with little translation loss.`,
            language: 'csharp',
            bestPractices: [
                'Start from domain events in past tense and build the timeline outward to commands and aggregates',
                'Get real domain experts in the room — the technique fails without them',
                'Mark disagreements as red hotspots instead of resolving them prematurely',
                'Let event clusters and meaning shifts suggest bounded-context boundaries'
            ],
            commonMistakes: [
                'Running it as a developers-only meeting, losing the domain-expert insight',
                'Jumping to database tables or class design instead of staying on business events',
                'Ignoring hotspots, which are exactly where the valuable boundary insights hide',
                'Treating the output as final architecture rather than an evolving shared model'
            ],
            interviewTip: 'Explain that it is event-first and collaborative, then connect it to outcomes interviewers care about: event clusters reveal bounded contexts, command/event clusters reveal aggregates, and the sticky notes capture the ubiquitous language. That links the workshop to concrete design artifacts.',
            followUp: ['How do hotspots help identify context boundaries?', 'What is the difference between big-picture and design-level Event Storming?', 'How do you turn the wall into actual code aggregates?'],
            seniorPerspective: 'I run a big-picture Event Storming session at the start of any non-trivial domain because it surfaces, in a couple of hours, the boundary disagreements that would otherwise take months of painful refactoring to discover. The red hotspots are the real gold — they mark exactly where the business itself is fuzzy, and that is where I focus design effort.',
            architectPerspective: 'Event Storming is my preferred bridge from strategic to tactical DDD: the wall directly yields candidate bounded contexts, aggregates, domain events, and the ubiquitous language, with minimal translation loss into code. Because it produces an event-centric model, it also aligns the team toward event-driven boundaries, which is precisely the seam structure that later enables clean extraction into services.'
        }
    ]
});
