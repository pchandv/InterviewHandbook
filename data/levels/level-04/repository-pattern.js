/* ═══════════════════════════════════════════════════════════════════
   LEVEL 4 — Repository Pattern
   Enterprise Patterns: abstracting data access behind a clean interface
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('repository-pattern', {

    title: 'Repository Pattern',
    level: 4,
    group: 'enterprise-patterns',
    description: 'The Repository pattern abstracts data access behind a collection-like interface, decoupling business logic from persistence concerns.',
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    prerequisites: ['csharp-di'],

    sections: [

        // 1. Introduction
        {
            title: 'Introduction',
            content: `<p>The <strong>Repository pattern</strong> mediates between the domain/business logic layer
            and the data mapping layer, acting like an in-memory collection of domain objects.</p>
            <p>First described by Martin Fowler in <em>Patterns of Enterprise Application Architecture</em>,
            it remains one of the most debated patterns in modern .NET development.</p>
            <p>In this module, you will learn:</p>
            <ul>
                <li>What the Repository pattern is and the problem it solves</li>
                <li>How to implement it with Entity Framework Core and Dapper</li>
                <li>The Generic Repository vs Specific Repository debate</li>
                <li>When the pattern adds value vs when it is over-engineering</li>
                <li>How Unit of Work complements Repository</li>
                <li>Interview-ready arguments for and against the pattern</li>
            </ul>`
        },

        // 2. Core Concepts
        {
            title: 'Core Concepts',
            content: `<p>The Repository pattern has several key components:</p>
            <h4>Repository Interface</h4>
            <p>Defines the contract for data access operations (CRUD). Business logic depends on this
            interface, not on concrete database implementations.</p>
            <h4>Generic Repository</h4>
            <p>A base repository with common operations (GetById, Add, Update, Delete) shared across
            all entity types. Reduces boilerplate but can become a leaky abstraction.</p>
            <h4>Specific Repository</h4>
            <p>A repository tailored to a specific aggregate root (e.g., <code>IOrderRepository</code>)
            with domain-meaningful methods like <code>GetPendingOrders()</code>.</p>
            <h4>Unit of Work</h4>
            <p>Coordinates multiple repository operations within a single transaction.
            EF Core's <code>DbContext</code> already implements this pattern internally.</p>`,
            mermaid: `graph TD
    BL[Business Logic Layer] -->|depends on| IR[IRepository Interface]
    IR -->|implemented by| CR[Concrete Repository]
    CR -->|uses| ORM[EF Core / Dapper]
    ORM -->|queries| DB[(Database)]
    UOW[Unit of Work] -->|coordinates| CR
    BL -->|uses| UOW`
        },

        // 3. How It Works
        {
            title: 'How It Works',
            content: `<p>The Repository pattern works by inserting an abstraction layer between your
            business logic and data access:</p>
            <ol>
                <li><strong>Define an interface</strong> that describes what data operations your domain needs</li>
                <li><strong>Implement the interface</strong> using your chosen ORM or data access library</li>
                <li><strong>Inject the interface</strong> into services via dependency injection</li>
                <li><strong>Business logic</strong> calls repository methods without knowing the database technology</li>
            </ol>
            <p>This makes your business logic testable in isolation (mock the repository) and
            allows you to swap data access implementations without changing business code.</p>`,
            code: `// Step 1: Define the interface
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(int id);
    Task<IReadOnlyList<Order>> GetPendingOrdersAsync();
    Task AddAsync(Order order);
    Task UpdateAsync(Order order);
}

// Step 2: Implement with EF Core
public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _db;

    public OrderRepository(AppDbContext db) => _db = db;

    public async Task<Order?> GetByIdAsync(int id) =>
        await _db.Orders
            .Include(o => o.LineItems)
            .FirstOrDefaultAsync(o => o.Id == id);

    public async Task<IReadOnlyList<Order>> GetPendingOrdersAsync() =>
        await _db.Orders
            .Where(o => o.Status == OrderStatus.Pending)
            .OrderBy(o => o.CreatedAt)
            .ToListAsync();

    public async Task AddAsync(Order order) =>
        await _db.Orders.AddAsync(order);

    public async Task UpdateAsync(Order order) =>
        _db.Orders.Update(order);
}

// Step 3: Register in DI and inject
// In Program.cs:
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

// Step 4: Use in service
public class OrderService
{
    private readonly IOrderRepository _orders;
    public OrderService(IOrderRepository orders) => _orders = orders;

    public async Task<Order?> GetOrder(int id) =>
        await _orders.GetByIdAsync(id);
}`,
            language: 'csharp'
        },

        // 4. Visual Diagram
        {
            title: 'Visual Diagram',
            content: `<p>The class diagram below shows how Repository and Unit of Work relate
            in a typical enterprise application:</p>`,
            mermaid: `classDiagram
    class IRepository~T~ {
        <<interface>>
        +GetByIdAsync(id) Task~T~
        +GetAllAsync() Task~IReadOnlyList~
        +AddAsync(entity) Task
        +UpdateAsync(entity) Task
        +DeleteAsync(id) Task
    }
    class IOrderRepository {
        <<interface>>
        +GetPendingOrdersAsync() Task~IReadOnlyList~
        +GetByCustomerAsync(customerId) Task~IReadOnlyList~
    }
    class OrderRepository {
        -AppDbContext _db
        +GetByIdAsync(id) Task~Order~
        +GetPendingOrdersAsync() Task~IReadOnlyList~
    }
    class IUnitOfWork {
        <<interface>>
        +Orders IOrderRepository
        +Products IProductRepository
        +SaveChangesAsync() Task~int~
    }
    class UnitOfWork {
        -AppDbContext _db
        +Orders IOrderRepository
        +SaveChangesAsync() Task~int~
    }
    IRepository~T~ <|-- IOrderRepository
    IOrderRepository <|.. OrderRepository
    IUnitOfWork <|.. UnitOfWork
    UnitOfWork --> OrderRepository`
        },

        // 5. Implementation (Tabs)
        {
            title: 'Implementation',
            content: `<p>Here are implementations in C# (EF Core) and TypeScript (Prisma),
            showing how the pattern adapts to different ecosystems:</p>`,
            tabs: [
                {
                    label: 'C# (EF Core)',
                    code: `// Generic base repository
public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(int id) =>
        await _dbSet.FindAsync(id);

    public virtual async Task<IReadOnlyList<T>> GetAllAsync() =>
        await _dbSet.ToListAsync();

    public async Task AddAsync(T entity) =>
        await _dbSet.AddAsync(entity);

    public Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null) _dbSet.Remove(entity);
    }
}

// Specific repository extending generic
public class ProductRepository : Repository<Product>, IProductRepository
{
    public ProductRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Product>> GetByCategoryAsync(string category) =>
        await _dbSet
            .Where(p => p.Category == category && p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync();
}`,
                    language: 'csharp'
                },
                {
                    label: 'TypeScript (Prisma)',
                    code: `// Repository interface
interface IUserRepository {
    findById(id: number): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(data: CreateUserDto): Promise<User>;
    update(id: number, data: UpdateUserDto): Promise<User>;
    delete(id: number): Promise<void>;
}

// Prisma implementation
class PrismaUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findById(id: number): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
            include: { profile: true }
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email }
        });
    }

    async create(data: CreateUserDto): Promise<User> {
        return this.prisma.user.create({ data });
    }

    async update(id: number, data: UpdateUserDto): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data
        });
    }

    async delete(id: number): Promise<void> {
        await this.prisma.user.delete({ where: { id } });
    }
}`,
                    language: 'typescript'
                }
            ]
        },

        // 6. Comparison Table
        {
            title: 'Comparison',
            content: `<p>How does the Repository pattern compare to using DbContext directly
            or lightweight data access with Dapper?</p>`,
            table: {
                headers: ['Criteria', 'Repository Pattern', 'Direct DbContext', 'Dapper (No Repository)'],
                rows: [
                    ['Abstraction Level', 'High — hides ORM details', 'Low — ORM exposed to services', 'Low — SQL in services'],
                    ['Testability', 'Easy — mock the interface', 'Harder — need InMemory provider', 'Harder — mock IDbConnection'],
                    ['Flexibility', 'Can swap ORM later', 'Locked to EF Core', 'Already lightweight'],
                    ['Performance Control', 'May hide inefficient queries', 'Full LINQ control', 'Full SQL control'],
                    ['Boilerplate', 'High — interfaces + implementations', 'Low — inject DbContext directly', 'Medium — write SQL manually'],
                    ['Learning Curve', 'Moderate', 'Low (EF-familiar devs)', 'Low (SQL-familiar devs)'],
                    ['Best For', 'Large enterprise apps, DDD', 'Small-medium CRUD apps', 'Performance-critical queries']
                ]
            }
        },

        // 7. Best Practices
        {
            title: 'Best Practices',
            content: `<h4>Do: Use Specific Repositories Over Generic Ones</h4>
            <p>Generic repositories (<code>IRepository&lt;T&gt;</code>) often become leaky abstractions.
            Prefer domain-specific interfaces like <code>IOrderRepository</code> with meaningful methods
            that express business intent.</p>
            <h4>Do: Return Domain Objects, Not IQueryable</h4>
            <p>Exposing <code>IQueryable</code> from repositories leaks persistence concerns into business
            logic. Materialize queries inside the repository and return concrete collections.</p>
            <h4>Do: Keep Repositories Focused on Aggregate Roots</h4>
            <p>In DDD, create repositories only for aggregate roots, not for every entity.
            Child entities are accessed through their parent aggregate.</p>
            <h4>Do: Consider CQRS for Complex Domains</h4>
            <p>For read-heavy scenarios, consider separating read models (queries returning DTOs)
            from write models (repositories managing aggregates). This avoids forcing repositories
            to serve both purposes poorly.</p>`,
            callout: {
                type: 'tip',
                title: 'Pragmatic Rule',
                text: 'If your repository interface mirrors DbContext exactly (same methods, same signatures), you are adding a layer without adding value. The abstraction should express domain operations, not generic CRUD.'
            }
        },

        // 8. Common Mistakes
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Generic Repository as the Only Abstraction</h4>
            <p>A generic <code>IRepository&lt;T&gt;</code> with GetAll, GetById, Add, Update, Delete
            adds a layer without real value over DbContext. It hides none of the complexity and
            prevents you from using EF Core features like Include, projection, and batching.</p>
            <h4>Mistake: Exposing IQueryable</h4>
            <p>Returning <code>IQueryable&lt;T&gt;</code> from repositories allows callers to build
            arbitrary queries, defeating the purpose of the abstraction. It also makes unit testing
            extremely difficult since you cannot easily mock LINQ-to-SQL translation.</p>
            <h4>Mistake: Repository Per Entity</h4>
            <p>Creating a repository for every database table leads to an explosion of interfaces
            and classes. Only aggregate roots need repositories — child entities are managed through
            their parent.</p>
            <h4>Mistake: Ignoring Unit of Work</h4>
            <p>Calling SaveChanges inside individual repository methods means you cannot coordinate
            multi-entity transactions. Let the Unit of Work (or the calling service) control when
            changes are persisted.</p>`
        },

        // 9. Real-World Applications
        {
            title: 'Real-World Applications',
            content: `<p>The Repository pattern is widely used in enterprise systems:</p>
            <h4>E-Commerce (Order Management)</h4>
            <p>An <code>IOrderRepository</code> encapsulates complex queries like "get orders pending
            fulfillment with their line items, sorted by priority." This keeps the fulfillment
            service focused on business logic rather than query construction.</p>
            <h4>Banking (Account Aggregates)</h4>
            <p>Financial systems use repositories to enforce invariants on account aggregates.
            The repository loads the full aggregate (account + transactions) to ensure balance
            calculations are always consistent.</p>
            <h4>Multi-Tenant SaaS</h4>
            <p>Repositories can transparently apply tenant filters. The business layer does not
            need to remember to filter by TenantId — the repository handles it as a cross-cutting
            concern.</p>
            <h4>Event-Sourced Systems</h4>
            <p>In event sourcing, the repository reconstitutes aggregates from event streams rather
            than querying tables. The business layer remains unaware of the storage mechanism,
            which is the core value of the pattern.</p>`
        },

        // 10. Interview Tips
        {
            title: 'Interview Tips',
            content: `<p>Repository pattern questions are popular in .NET interviews. Key points:</p>
            <ul>
                <li><strong>Know both sides:</strong> Be ready to argue for AND against the pattern</li>
                <li><strong>Mention trade-offs:</strong> Testability vs complexity, abstraction vs performance</li>
                <li><strong>Reference DDD:</strong> Aggregate roots, bounded contexts, and how repositories fit</li>
                <li><strong>Discuss Unit of Work:</strong> Show you understand transaction coordination</li>
                <li><strong>Have an opinion:</strong> Interviewers want to see thoughtful judgment, not rote answers</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Senior-Level Signal',
                text: 'Senior engineers demonstrate maturity by acknowledging when the pattern is over-engineering. Saying "for this CRUD app, injecting DbContext directly is fine" shows pragmatism over dogma.'
            }
        },

        // 11. Key Takeaways
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Core idea:</strong> Abstract data access behind a domain-meaningful interface</li>
                <li><strong>When to use:</strong> Large enterprise apps, DDD, complex domains, multi-ORM support needed</li>
                <li><strong>When NOT to use:</strong> Simple CRUD apps, thin API layers, when DbContext is sufficient</li>
                <li><strong>Key benefit:</strong> Testability and separation of concerns</li>
                <li><strong>Main risk:</strong> Over-abstraction that adds boilerplate without real value</li>
                <li><strong>Unit of Work:</strong> Coordinates transactions across multiple repositories</li>
                <li><strong>Prefer specific over generic:</strong> Domain methods beat generic CRUD interfaces</li>
                <li><strong>Interview signal:</strong> Knowing when NOT to use a pattern shows senior-level judgment</li>
            </ul>`
        },

        // 12. Knowledge Check
        {
            title: 'Knowledge Check',
            content: `<p>Test your understanding:</p>
            <ol>
                <li><strong>Q:</strong> What is the primary purpose of the Repository pattern?<br/>
                    <em>A: To abstract data access behind a collection-like interface, decoupling business logic from persistence technology.</em></li>
                <li><strong>Q:</strong> When is a generic repository an anti-pattern?<br/>
                    <em>A: When it simply wraps DbContext without adding domain value — it adds a layer of indirection with no meaningful abstraction.</em></li>
                <li><strong>Q:</strong> What is the Unit of Work pattern and how does it relate to Repository?<br/>
                    <em>A: Unit of Work coordinates multiple repository operations in a single transaction. EF Core's DbContext implements it internally via SaveChanges.</em></li>
                <li><strong>Q:</strong> Why should repositories NOT expose IQueryable?<br/>
                    <em>A: It leaks persistence concerns, allows arbitrary queries outside the repository, and makes testing extremely difficult since LINQ-to-SQL translation cannot be easily mocked.</em></li>
            </ol>`
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // INTERVIEW QUESTIONS
    // ═══════════════════════════════════════════════════════════════
    questions: [
        {"question":"What is the Repository pattern, and what are the arguments for and against it over using an ORM directly?","difficulty":"hard","answer":"<p>The <strong>Repository</strong> pattern abstracts data access behind a collection-like interface (Add, Get, Remove, query methods), so domain/application code depends on an abstraction rather than the persistence technology.</p><p><strong>For:</strong> it centralizes query logic, decouples the domain from the ORM, and aids testability (mock the repository). <strong>Against:</strong> a full ORM like EF Core is already a repository + unit of work (DbSet/DbContext), so wrapping it can add a leaky, low-value layer that hides useful ORM features (change tracking, IQueryable composition). Many teams use repositories for aggregate roots in DDD but query directly with the ORM elsewhere.</p>","explanation":"A repository is a librarian: you ask for books by topic without knowing the shelving system. The debate is whether adding your own librarian on top of an already-helpful one (the ORM) is worth it.","bestPractices":["Use repositories for aggregate roots in a rich domain","Return domain objects, not IQueryable, from repositories","Avoid generic repositories that just proxy the ORM"],"commonMistakes":["Wrapping EF Core in a thin generic repository for no benefit","Leaking IQueryable and losing the abstraction","A repository per table instead of per aggregate"],"interviewTip":"Show both sides: repositories aid DDD/testing, but EF is already a repository+UoW, so a thin wrapper can be pure overhead. Nuance beats dogma.","followUp":["What is the Unit of Work pattern?","Why is a generic repository often an anti-pattern?","When does a repository add real value?"]},
        {"question":"What is the Unit of Work pattern and how does it relate to the Repository pattern?","difficulty":"hard","answer":"<p>The <strong>Unit of Work</strong> pattern tracks changes to objects during a business transaction and commits them together as a single atomic unit (one SaveChanges/commit), coordinating multiple repositories so they share one transaction and one change set.</p><p>Relationship: repositories handle per-aggregate reads/writes; the unit of work groups those operations into one transactional commit. In EF Core, the <code>DbContext</code> already implements both — it tracks changes (unit of work) and exposes <code>DbSet</code>s (repositories) — which is why an extra hand-rolled UoW over EF is often redundant.</p>","explanation":"A Unit of Work is a shopping cart: you add and remove items across the store (repositories) and pay once at checkout (commit), so either the whole purchase succeeds or none of it does.","bestPractices":["Commit related changes as one transaction","Let repositories share one unit of work per business operation","Recognize DbContext already provides UoW + repositories"],"commonMistakes":["Committing each repository separately (partial writes)","Re-implementing UoW over EF Core needlessly","Sharing a unit of work across unrelated operations"],"interviewTip":"Say \"UoW = one atomic commit across repositories\" and note EF Core's DbContext is already a UoW + repositories — that shows practical awareness.","followUp":["How does DbContext implement UoW?","How do you scope a unit of work per request?","What breaks if repositories each commit separately?"]},
        {
            question: 'What is the Repository pattern and what problem does it solve?',

            difficulty: 'easy',

            answer: `<p>The <strong>Repository pattern</strong> provides a collection-like interface
            for accessing domain objects, hiding the details of data access from the business
            logic layer.</p>
            <p>It solves several problems:</p>
            <ul>
                <li><strong>Decoupling:</strong> Business logic does not depend on EF Core, Dapper, or any specific ORM</li>
                <li><strong>Testability:</strong> Services can be unit tested by mocking the repository interface</li>
                <li><strong>Single Responsibility:</strong> Query logic is centralized in one place per aggregate</li>
                <li><strong>Consistency:</strong> All data access for an aggregate goes through one gateway</li>
            </ul>`,

            explanation: 'Think of a repository like a librarian. You ask for a book by title (domain language) and the librarian knows which shelf, which section, and which catalog system to use. You do not need to know the Dewey Decimal System yourself.',

            bestPractices: [
                'Define repository interfaces in the domain layer, implementations in infrastructure',
                'Create repositories only for aggregate roots',
                'Use dependency injection to resolve repositories',
                'Return materialized collections, not IQueryable'
            ],

            commonMistakes: [
                'Creating a repository for every single entity/table',
                'Putting business logic inside repositories',
                'Calling SaveChanges inside individual repository methods'
            ],

            interviewTip: 'Start with the problem it solves (testability, decoupling), then explain the mechanism. Finish by acknowledging trade-offs — this shows balanced thinking.',

            followUp: [
                'How does Repository relate to Unit of Work?',
                'When would you NOT use the Repository pattern?',
                'How would you implement specification pattern with repositories?'
            ],

            seniorPerspective: 'In my experience, the value of Repository depends heavily on team size and domain complexity. For a team of 2 building a CRUD API, it is overhead. For a team of 20 with complex business rules, it provides essential boundary enforcement.',

            architectPerspective: 'At the architecture level, Repository is a ports-and-adapters boundary. It defines the "port" (interface) in the domain hexagon, and the ORM implementation is the "adapter." This enables technology migration without domain disruption.'
        },

        {
            question: 'Compare Generic Repository vs Specific Repository. When would you choose each?',

            difficulty: 'medium',

            answer: `<p><strong>Generic Repository</strong> (<code>IRepository&lt;T&gt;</code>) provides standard
            CRUD operations for any entity type. <strong>Specific Repository</strong>
            (<code>IOrderRepository</code>) exposes domain-meaningful methods.</p>
            <p><strong>Generic Repository:</strong></p>
            <ul>
                <li>Reduces boilerplate — one implementation covers all entities</li>
                <li>Risk: becomes a thin wrapper over DbContext with no added value</li>
                <li>Risk: exposes operations that may not make sense (Delete on audit logs?)</li>
            </ul>
            <p><strong>Specific Repository:</strong></p>
            <ul>
                <li>Expresses domain intent: <code>GetOverdueInvoices()</code> vs <code>GetAll().Where(...)</code></li>
                <li>Can restrict operations (no Delete method if delete is not a valid domain operation)</li>
                <li>Easier to optimize specific queries without affecting other entities</li>
            </ul>
            <p><strong>Best approach:</strong> Use a generic base class for shared implementation,
            but expose only specific interfaces to consumers.</p>`,

            explanation: 'Generic Repository is like a universal remote — it works with everything but does nothing particularly well. A specific repository is like a custom-built control panel for your exact device.',

            code: `// Hybrid approach: generic base, specific interface
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(int id);
    Task<IReadOnlyList<Order>> GetPendingAsync();
    Task<IReadOnlyList<Order>> GetByCustomerAsync(int customerId);
    Task AddAsync(Order order);
    // Note: no Delete — orders are never deleted, only cancelled
}

// Internal generic base (not exposed to business layer)
internal class OrderRepository : Repository<Order>, IOrderRepository
{
    public OrderRepository(AppDbContext db) : base(db) { }

    public async Task<IReadOnlyList<Order>> GetPendingAsync() =>
        await _dbSet
            .Where(o => o.Status == OrderStatus.Pending)
            .Include(o => o.LineItems)
            .OrderBy(o => o.DueDate)
            .ToListAsync();

    public async Task<IReadOnlyList<Order>> GetByCustomerAsync(int customerId) =>
        await _dbSet
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
}`,

            language: 'csharp',

            bestPractices: [
                'Expose specific interfaces to consumers, use generic base for DRY implementation',
                'Method names should use domain language (GetPendingOrders, not GetByStatusPending)',
                'Restrict available operations per aggregate (not every entity needs Delete)',
                'Consider read/write separation — query methods vs command methods'
            ],

            commonMistakes: [
                'Exposing only the generic interface, forcing callers to build queries externally',
                'Making every method virtual "just in case" — design for your actual needs',
                'Adding too many query methods — consider Specification pattern for complex filtering'
            ],

            interviewTip: 'Frame your answer around the Dependency Inversion Principle: high-level modules should not depend on low-level modules. The specific interface IS the abstraction that the domain needs.',

            followUp: [
                'How would you handle complex filtering without creating dozens of methods?',
                'What role does the Specification pattern play alongside Repository?',
                'How do you test a specific repository implementation?'
            ],

            seniorPerspective: 'After years of maintaining enterprise systems, I have found that specific repositories age much better than generic ones. When performance issues arise, you can optimize GetPendingOrders() without risking regression elsewhere.',

            architectPerspective: 'In a microservices architecture, each service typically has 2-5 aggregate repositories. The specific interface ensures each service exposes only the data operations its bounded context needs, enforcing proper service boundaries.'
        },

        {
            question: 'When is the Repository pattern over-engineering? Argue against using it.',

            difficulty: 'hard',

            answer: `<p>The Repository pattern is <strong>over-engineering</strong> when:</p>
            <ul>
                <li><strong>Simple CRUD apps:</strong> If your service just passes data between API and database
                with minimal logic, Repository adds indirection without value</li>
                <li><strong>EF Core IS the repository:</strong> DbContext already implements Repository + Unit of Work.
                Wrapping it in another layer duplicates the abstraction</li>
                <li><strong>You will never swap ORMs:</strong> The "swap the database" argument rarely materializes.
                Most teams never migrate from EF Core to Dapper mid-project</li>
                <li><strong>IQueryable leaks anyway:</strong> If your repository exposes IQueryable or accepts
                Expression parameters, you have not actually abstracted anything</li>
                <li><strong>InMemory testing exists:</strong> EF Core's InMemory provider enables testing without
                mocking repositories</li>
            </ul>
            <p><strong>The alternative:</strong> Inject <code>DbContext</code> directly into services.
            Use integration tests with a real test database. This is simpler, more performant,
            and gives you full access to EF Core features.</p>`,

            explanation: 'It is like putting a translator between two people who speak the same language. If your business code and your ORM already understand each other well, the middleman just slows communication down.',

            code: `// Without Repository — clean and simple for CRUD scenarios
public class ProductService
{
    private readonly AppDbContext _db;
    public ProductService(AppDbContext db) => _db = db;

    public async Task<ProductDto?> GetProduct(int id) =>
        await _db.Products
            .Where(p => p.Id == id)
            .Select(p => new ProductDto(p.Id, p.Name, p.Price))
            .FirstOrDefaultAsync();

    public async Task<int> CreateProduct(CreateProductCommand cmd)
    {
        var product = new Product(cmd.Name, cmd.Price, cmd.Category);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return product.Id;
    }
}

// Test with real database (WebApplicationFactory)
public class ProductServiceTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task GetProduct_ReturnsDto()
    {
        // Uses actual EF Core with SQLite in-memory
        var factory = new WebApplicationFactory<Program>();
        var client = factory.CreateClient();
        var response = await client.GetFromJsonAsync<ProductDto>("/api/products/1");
        Assert.NotNull(response);
    }
}`,

            language: 'csharp',

            bestPractices: [
                'Choose architecture patterns based on actual complexity, not anticipated complexity',
                'For CRUD-dominant apps, direct DbContext injection is a valid architectural choice',
                'Use vertical slice architecture as an alternative — each feature owns its data access',
                'If you do use repositories, ensure they add real value beyond what DbContext provides'
            ],

            commonMistakes: [
                'Applying Repository "because clean architecture says so" without evaluating if it fits',
                'Creating a repository layer and then bypassing it for performance-critical queries',
                'Treating architectural patterns as religious dogma rather than tools with trade-offs'
            ],

            interviewTip: 'This question tests intellectual honesty. Interviewers want to see you argue AGAINST a popular pattern convincingly. Show you understand the costs, not just the benefits.',

            followUp: [
                'If not Repository, how do you achieve testability?',
                'How does vertical slice architecture avoid the need for repositories?',
                'At what complexity threshold would you introduce the Repository pattern?'
            ],

            seniorPerspective: 'I have seen teams spend weeks building elaborate repository layers for simple CRUD APIs. The maintenance cost of those extra interfaces and implementations exceeded any testability benefit. Start simple, add abstraction when pain appears.',

            architectPerspective: 'The decision should be driven by domain complexity, not dogma. If your bounded context has rich invariants, aggregates, and complex queries, repositories earn their keep. For simple data-in-data-out services, they are ceremony without substance.',

            mermaid: `flowchart TD
    Q{Does your domain have<br/>complex business rules?}
    Q -->|Yes| R[Repository adds value<br/>Encapsulates query logic<br/>Enforces aggregate boundaries]
    Q -->|No| S{Is it mostly CRUD?}
    S -->|Yes| T[Skip Repository<br/>Inject DbContext directly<br/>Use integration tests]
    S -->|No| U[Consider vertical slices<br/>Each feature owns data access]`
        },

        {
            question: 'What is the Unit of Work pattern, and how does it relate to Repository and EF Core?',

            difficulty: 'medium',

            answer: `<p>The <strong>Unit of Work</strong> pattern tracks all changes made during a business transaction
            and coordinates writing them out as a single atomic commit. It ensures that multiple repository
            operations either all succeed or all fail together.</p>
            <p>Its relationship to Repository and EF Core:</p>
            <ul>
                <li><strong>Repositories</strong> handle querying and staging changes for individual aggregates</li>
                <li><strong>Unit of Work</strong> owns the transaction boundary and calls SaveChanges once</li>
                <li><strong>EF Core's DbContext IS a Unit of Work</strong> — it tracks entity changes and
                <code>SaveChanges()</code> commits them in one transaction</li>
            </ul>
            <p>So when using EF Core, you often do not need a separate Unit of Work class — the DbContext
            already provides it. A custom Unit of Work adds value mainly when you want to hide DbContext or
            coordinate repositories that span multiple contexts.</p>`,

            explanation: 'Unit of Work is like a shopping cart at checkout. You add and remove items (repository operations) throughout your visit, but nothing is actually charged until you check out (SaveChanges). Either the whole purchase goes through, or none of it does.',

            code: `// Unit of Work interface coordinating multiple repositories
public interface IUnitOfWork : IAsyncDisposable
{
    IOrderRepository Orders { get; }
    IProductRepository Products { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _db;
    public UnitOfWork(AppDbContext db)
    {
        _db = db;
        Orders = new OrderRepository(_db);
        Products = new ProductRepository(_db);
    }

    public IOrderRepository Orders { get; }
    public IProductRepository Products { get; }

    // Single atomic commit across all repositories sharing the DbContext
    public Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);

    public ValueTask DisposeAsync() => _db.DisposeAsync();
}

// Usage — both changes commit together or not at all
public async Task TransferStock(int fromId, int toId, int qty, IUnitOfWork uow)
{
    var from = await uow.Products.GetByIdAsync(fromId);
    var to = await uow.Products.GetByIdAsync(toId);
    from!.Decrease(qty);
    to!.Increase(qty);
    await uow.SaveChangesAsync(); // one transaction
}`,

            language: 'csharp',

            bestPractices: [
                'Let the Unit of Work (or DbContext) own SaveChanges — never call it inside repositories',
                'Share a single DbContext instance across repositories within one Unit of Work',
                'Scope the Unit of Work per request/operation (DI scoped lifetime)',
                'Recognize DbContext already implements UoW before adding your own'
            ],

            commonMistakes: [
                'Calling SaveChanges inside each repository method (breaks atomic transactions)',
                'Wrapping DbContext in a custom UoW that adds no value over DbContext itself',
                'Giving each repository its own DbContext (changes no longer commit together)',
                'Holding a Unit of Work longer than a single business operation'
            ],

            interviewTip: 'The strongest answer states plainly that EF Core DbContext is already a Unit of Work, then explains when a custom one still helps (hiding DbContext, multi-context coordination). This shows you understand the pattern AND the framework.',

            followUp: [
                'When would you build a custom Unit of Work over EF Core?',
                'How does the Unit of Work lifetime map to a web request?',
                'How do you handle transactions spanning multiple DbContexts?'
            ],

            seniorPerspective: 'On most EF Core projects I do not introduce a separate Unit of Work class — the DbContext is one already, and wrapping it just adds ceremony. I add an explicit UoW abstraction only when I genuinely need to keep DbContext out of the application layer or coordinate work across more than one context.',

            architectPerspective: 'Unit of Work defines the transactional consistency boundary, which in DDD should align with a single aggregate per transaction. When a use case needs to mutate multiple aggregates atomically, that is a signal to reconsider aggregate boundaries or move to eventual consistency via domain events.'
        },

        {
            question: 'How does the Specification pattern complement repositories and prevent query-method explosion?',

            difficulty: 'advanced',

            answer: `<p>As repositories grow, query methods multiply: <code>GetActive()</code>, <code>GetActiveByCategory()</code>,
            <code>GetActiveByCategoryAndPriceRange()</code> — a combinatorial explosion. The <strong>Specification
            pattern</strong> solves this by encapsulating a query/business rule as a reusable, composable object
            that the repository can apply.</p>
            <p>A specification represents "what" you want (the predicate, includes, ordering, paging) as a
            first-class object. Repositories accept specifications instead of exposing dozens of bespoke methods
            or leaking <code>IQueryable</code>.</p>`,

            explanation: 'A specification is like a saved search filter. Instead of asking the librarian for a new custom report every time ("books that are fiction AND after 2020 AND under 300 pages"), you hand over a reusable filter card that describes exactly what you want, and you can combine cards with AND/OR.',

            code: `// Specification base — predicate + includes + ordering
public abstract class Specification<T>
{
    public abstract Expression<Func<T, bool>> ToExpression();
    public List<Expression<Func<T, object>>> Includes { get; } = new();

    public bool IsSatisfiedBy(T entity) => ToExpression().Compile()(entity);

    // Composition: AND
    public Specification<T> And(Specification<T> other) => new AndSpecification<T>(this, other);
}

public class AndSpecification<T> : Specification<T>
{
    private readonly Specification<T> _left, _right;
    public AndSpecification(Specification<T> left, Specification<T> right)
        { _left = left; _right = right; }

    public override Expression<Func<T, bool>> ToExpression()
    {
        var l = _left.ToExpression();
        var r = _right.ToExpression();
        var param = Expression.Parameter(typeof(T));
        var body = Expression.AndAlso(
            Expression.Invoke(l, param), Expression.Invoke(r, param));
        return Expression.Lambda<Func<T, bool>>(body, param);
    }
}

// Concrete specs express intent
public class ActiveProductsSpec : Specification<Product>
{
    public override Expression<Func<Product, bool>> ToExpression() => p => p.IsActive;
}
public class InCategorySpec : Specification<Product>
{
    private readonly string _category;
    public InCategorySpec(string category) => _category = category;
    public override Expression<Func<Product, bool>> ToExpression() => p => p.Category == _category;
}

// Repository exposes ONE method, not dozens
public interface IProductRepository
{
    Task<IReadOnlyList<Product>> ListAsync(Specification<Product> spec);
}

// Usage — compose instead of adding new repository methods
var spec = new ActiveProductsSpec().And(new InCategorySpec("Books"));
var books = await repo.ListAsync(spec);`,

            language: 'csharp',

            bestPractices: [
                'Use specifications to keep repository interfaces small and intention-revealing',
                'Make specifications composable (And/Or/Not) for reuse',
                'Encapsulate includes, ordering, and paging in the specification too',
                'Name specifications by business intent (OverdueInvoicesSpec), not by columns'
            ],

            commonMistakes: [
                'Exposing IQueryable from the repository instead of accepting a specification',
                'Building an over-engineered specification framework for a handful of simple queries',
                'Compiling expressions on hot paths (cache or pass expressions to the provider instead)',
                'Putting persistence concerns (SQL hints) into what should be a domain specification'
            ],

            interviewTip: 'Frame it as the cure for two opposite smells: a repository with 30 query methods, OR a repository that leaks IQueryable. The specification gives composability without exposing the ORM.',

            followUp: [
                'How do specifications avoid leaking IQueryable?',
                'What are the performance considerations of compiling expressions?',
                'How does this relate to libraries like Ardalis.Specification?'
            ],

            seniorPerspective: 'Specifications shine when the same filtering rules recur across read paths and validation. The trap is building a heavyweight generic framework before you have enough queries to justify it — I usually let methods accumulate until the duplication is obvious, then refactor to specifications.',

            architectPerspective: 'The Specification pattern keeps query intent in the domain layer while leaving translation to the infrastructure layer, preserving the dependency rule. It also creates a single place to encode reusable business predicates that both queries and domain validation can share.'
        },

        {
            question: 'How do leaky abstractions show up in the Repository pattern, and how do you prevent them?',

            difficulty: 'hard',

            answer: `<p>A <strong>leaky abstraction</strong> is one that fails to fully hide the underlying technology,
            forcing callers to know implementation details. The Repository pattern leaks in several classic ways:</p>
            <ul>
                <li><strong>Exposing <code>IQueryable&lt;T&gt;</code></strong> — callers build arbitrary EF queries,
                so the "abstraction" is really EF Core in disguise, and behavior depends on the provider's
                LINQ translation</li>
                <li><strong>Returning tracked entities</strong> — callers can mutate and accidentally persist
                changes, coupling them to EF's change tracker</li>
                <li><strong>Lazy-loading navigation properties</strong> — accessing a property silently triggers
                a database call (N+1), a behavior the interface never advertised</li>
                <li><strong>Provider-specific exceptions</strong> bubbling up (DbUpdateException) instead of
                domain errors</li>
            </ul>
            <p>Prevention: return materialized read-only collections or DTOs, use <code>AsNoTracking</code> for
            reads, make includes explicit, and translate persistence exceptions at the boundary.</p>`,

            explanation: 'A leaky repository is like a "universal" remote that still requires you to know the TV is a Sony to press the right secret button. The abstraction promised independence but quietly demands knowledge of the thing it was supposed to hide.',

            code: `// LEAKY — this is not really an abstraction over EF Core
public interface ILeakyRepo<T>
{
    IQueryable<T> Query();          // caller can do anything; EF leaks out
}
// Caller: repo.Query().Include(x => x.Orders).Where(...).ToList();
// The "domain" now depends on EF LINQ translation and tracking behavior.

// SEALED — the abstraction actually hides persistence
public interface IOrderRepository
{
    Task<OrderDto?> GetSummaryAsync(int id, CancellationToken ct);
    Task<IReadOnlyList<OrderDto>> GetPendingAsync(CancellationToken ct);
}

public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _db;
    public OrderRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<OrderDto>> GetPendingAsync(CancellationToken ct) =>
        await _db.Orders
            .AsNoTracking()                       // no tracking leak on reads
            .Where(o => o.Status == OrderStatus.Pending)
            .Select(o => new OrderDto(o.Id, o.Total)) // project — no entities escape
            .ToListAsync(ct);                     // materialize — no IQueryable leak

    public async Task<OrderDto?> GetSummaryAsync(int id, CancellationToken ct)
    {
        try
        {
            return await _db.Orders
                .AsNoTracking()
                .Where(o => o.Id == id)
                .Select(o => new OrderDto(o.Id, o.Total))
                .FirstOrDefaultAsync(ct);
        }
        catch (DbException ex)
        {
            // translate infrastructure error into a domain-meaningful one
            throw new DataAccessException("Failed to load order summary", ex);
        }
    }
}`,

            language: 'csharp',

            bestPractices: [
                'Return materialized IReadOnlyList or DTOs, never IQueryable',
                'Use AsNoTracking for read queries so entities cannot be accidentally persisted',
                'Make eager-loading explicit; avoid relying on lazy loading',
                'Translate provider exceptions into domain/application exceptions at the boundary'
            ],

            commonMistakes: [
                'Exposing IQueryable or Expression parameters and calling it an abstraction',
                'Returning tracked entities that callers mutate, causing surprise updates',
                'Letting lazy loading trigger hidden N+1 queries through navigation properties',
                'Allowing DbUpdateException/SqlException to leak into the domain layer'
            ],

            interviewTip: 'The sharpest point: if your repository exposes IQueryable, you have not abstracted anything — you have just renamed DbSet. Name the four common leaks and the concrete fix for each.',

            followUp: [
                'Is exposing IQueryable ever justified?',
                'How does returning DTOs vs entities affect the abstraction?',
                'How do you prevent N+1 queries behind a repository?'
            ],

            seniorPerspective: 'When I review a repository, the first thing I check is the return types. IQueryable or tracked entities crossing the boundary tells me the abstraction is cosmetic. The fix is almost always projecting to DTOs and using AsNoTracking, which also improves read performance.',

            architectPerspective: 'Leaky data abstractions undermine the dependency rule of Clean Architecture: the domain ends up coupled to EF semantics it should never know about. A truly sealed repository is what makes infrastructure swappable and keeps the domain testable without a database.'
        }
    ]
});
