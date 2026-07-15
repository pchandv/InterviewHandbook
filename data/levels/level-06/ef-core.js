/* ═══════════════════════════════════════════════════════════════════
   ENTITY FRAMEWORK CORE — Level 6: SQL Server (Data Access)
   DbContext, change tracking, migrations, LINQ-to-Entities, loading
   strategies, the N+1 problem, and performance.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('ef-core', {

    title: 'Entity Framework Core',
    level: 6,
    group: 'data-access',
    description: 'EF Core deep dive: DbContext and change tracking, migrations, LINQ-to-Entities, eager/lazy/explicit loading, the N+1 problem, AsNoTracking, concurrency tokens, and performance pitfalls.',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    prerequisites: ['sql-fundamentals', 'csharp-linq'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Entity Framework Core</strong> is Microsoft's modern object-relational mapper (ORM) for .NET.
            It lets you work with a database using C# objects and LINQ instead of hand-written SQL, while
            handling change tracking, migrations, and SQL generation for you.</p>
            <p>EF Core boosts productivity dramatically, but the abstraction hides costs. Knowing what EF Core
            does under the hood — when it tracks entities, how it loads relationships, and what SQL it emits —
            is the difference between fast, correct data access and subtle performance disasters.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>DbContext, DbSet, and the change tracker</li>
                <li>Migrations and schema evolution</li>
                <li>Loading strategies: eager, lazy, explicit, and split queries</li>
                <li>The N+1 problem and how to avoid it</li>
                <li>AsNoTracking and read vs write performance</li>
                <li>Optimistic concurrency with concurrency tokens</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>DbContext</h4>
            <p>The central class representing a session with the database. It exposes <code>DbSet&lt;T&gt;</code>
            properties (one per entity table), tracks changes, and translates LINQ to SQL. It is a Unit of Work
            plus a set of Repositories.</p>
            <h4>Change Tracking</h4>
            <p>When you query entities (with tracking), the context records their original values. On
            <code>SaveChanges()</code>, it computes which entities were added/modified/deleted and generates the
            appropriate INSERT/UPDATE/DELETE statements.</p>
            <h4>Migrations</h4>
            <p>Code-first migrations capture incremental schema changes as versioned C# files, letting you evolve
            the database in sync with your model and apply changes across environments reproducibly.</p>
            <h4>Loading Related Data</h4>
            <ul>
                <li><strong>Eager:</strong> <code>Include()</code> loads related data in the same query</li>
                <li><strong>Lazy:</strong> related data loads automatically on first access (risky — N+1)</li>
                <li><strong>Explicit:</strong> you load related data on demand via <code>Entry().Collection().Load()</code></li>
            </ul>
            <h4>Tracking vs No-Tracking</h4>
            <p>Tracked queries enable updates but cost memory/CPU. <code>AsNoTracking()</code> returns
            read-only entities faster — ideal for queries you won't modify.</p>`,
            mermaid: `graph TB
    App[Your Code: LINQ query] --> Ctx[DbContext]
    Ctx --> Tracker[Change Tracker]
    Ctx --> Translator[LINQ → SQL]
    Translator --> DB[(SQL Server)]
    Tracker -->|SaveChanges| DB
    DB --> Materialize[Materialize entities] --> Tracker`
        },
        {
            title: 'How It Works',
            content: `<p>A typical read-modify-write flow with EF Core:</p>
            <ol>
                <li><strong>Query:</strong> a LINQ expression is translated to SQL and executed; results are
                materialized into entity objects and tracked.</li>
                <li><strong>Modify:</strong> you change properties on the tracked entities — no SQL yet.</li>
                <li><strong>SaveChanges:</strong> the change tracker diffs current vs original values, generates
                UPDATE/INSERT/DELETE, and runs them in a transaction.</li>
            </ol>
            <p>Deferred execution means a LINQ query doesn't hit the database until you enumerate it
            (ToList, First, foreach). Composing queries before execution lets EF build one efficient SQL statement.</p>`,
            code: `// 1. Query (tracked) — translated to SELECT, entities tracked
var order = await db.Orders
    .Include(o => o.Lines)              // eager-load related lines in one query
    .FirstOrDefaultAsync(o => o.Id == id);

// 2. Modify — no SQL yet, just in-memory change to tracked entity
order.Status = OrderStatus.Shipped;
order.Lines.Add(new OrderLine(productId, qty));

// 3. SaveChanges — change tracker emits UPDATE + INSERT in a transaction
await db.SaveChangesAsync();`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Entity lifecycle in the change tracker:</p>`,
            mermaid: `stateDiagram-v2
    [*] --> Detached: new object (untracked)
    Detached --> Added: db.Add()
    Detached --> Unchanged: query with tracking
    Unchanged --> Modified: property changed
    Unchanged --> Deleted: db.Remove()
    Added --> Unchanged: SaveChanges (INSERT)
    Modified --> Unchanged: SaveChanges (UPDATE)
    Deleted --> [*]: SaveChanges (DELETE)`
        },
        {
            title: 'Implementation',
            content: `<p>Common EF Core patterns — configuration, querying, and projections:</p>`,
            tabs: [
                {
                    label: 'DbContext + Config',
                    code: `public class AppDbContext : DbContext
{
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Customer> Customers => Set<Customer>();

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Order>(e =>
        {
            e.HasKey(o => o.Id);
            e.Property(o => o.Total).HasPrecision(18, 2);
            e.HasMany(o => o.Lines).WithOne().OnDelete(DeleteBehavior.Cascade);
            e.Property(o => o.RowVersion).IsRowVersion();   // concurrency token
            e.HasIndex(o => o.CustomerId);                   // index for lookups
        });
    }
}

// Registration (Program.cs)
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlServer(connectionString));`,
                    language: 'csharp'
                },
                {
                    label: 'Projection (fast reads)',
                    code: `// Project directly to a DTO — selects only needed columns, no tracking,
// no full-entity materialization. Ideal for read-heavy queries.
var summaries = await db.Orders
    .AsNoTracking()
    .Where(o => o.Status == OrderStatus.Shipped)
    .Select(o => new OrderSummaryDto
    {
        Id = o.Id,
        Customer = o.Customer.Name,      // EF generates an efficient JOIN
        Total = o.Total,
        LineCount = o.Lines.Count        // translated to a subquery/COUNT
    })
    .ToListAsync();

// Generated SQL selects only Id, Name, Total, and a count -
// far cheaper than loading entire Order + Customer + Lines graphs.`,
                    language: 'csharp'
                },
                {
                    label: 'Migrations (CLI)',
                    code: `# Create a migration capturing model changes
dotnet ef migrations add AddOrderStatusColumn

# Apply pending migrations to the database
dotnet ef database update

# Generate an idempotent SQL script for production deployment
dotnet ef migrations script --idempotent -o migrate.sql

# Roll back to a previous migration
dotnet ef database update PreviousMigrationName`,
                    language: 'bash'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Use AsNoTracking for Read-Only Queries</h4>
            <p>If you won't modify the results, <code>AsNoTracking()</code> skips change-tracking overhead — faster
            and lower memory.</p>
            <h4>Do: Project to DTOs for Reads</h4>
            <p>Use <code>Select()</code> to fetch only the columns you need instead of loading whole entity graphs.
            This is the single biggest EF Core performance lever.</p>
            <h4>Do: Eager-Load with Include to Avoid N+1</h4>
            <p>When you need related data, <code>Include()</code> it in one query rather than triggering a separate
            query per parent row.</p>
            <h4>Do: Keep DbContext Short-Lived</h4>
            <p>A DbContext is a unit of work. Use one per request/operation (scoped lifetime). Long-lived contexts
            accumulate tracked entities and leak memory.</p>
            <h4>Do: Use Async Methods</h4>
            <p><code>ToListAsync</code>, <code>SaveChangesAsync</code>, etc., free the thread during I/O — essential
            for scalable web apps.</p>`,
            callout: {
                type: 'tip',
                title: 'Project, Don\u2019t Load',
                text: 'The fastest EF Core read fetches exactly the columns the screen needs via .Select(...) into a DTO with AsNoTracking. Loading full tracked entity graphs "just in case" is the most common cause of slow EF Core queries.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: The N+1 Query Problem</h4>
            <p>Iterating parents and accessing a navigation property per item issues one query per parent (1 + N
            queries). Use <code>Include()</code> or projection to fetch in one round trip.</p>
            <h4>Mistake: Lazy Loading in Loops</h4>
            <p>Lazy loading silently triggers N+1 — each property access hits the database. Disable lazy loading or
            be very deliberate with it.</p>
            <h4>Mistake: Loading Entire Tables</h4>
            <p><code>db.Orders.ToList()</code> then filtering in memory pulls every row. Filter in the query
            (<code>Where</code>) so SQL does the work.</p>
            <h4>Mistake: Client-Side Evaluation</h4>
            <p>Calling a C# method EF can't translate forces it to fetch all rows and filter in memory. Keep query
            expressions translatable.</p>
            <h4>Mistake: Tracking Read-Only Data</h4>
            <p>Forgetting AsNoTracking on large read queries wastes memory and CPU building the change tracker.</p>`,
            code: `// N+1 PROBLEM: 1 query for orders + 1 per order for customer = 1+N queries
var orders = await db.Orders.ToListAsync();
foreach (var o in orders)
    Console.WriteLine(o.Customer.Name);   // lazy load fires a query EACH iteration

// FIX: eager-load in a single query
var orders2 = await db.Orders
    .Include(o => o.Customer)
    .ToListAsync();                        // 1 query with a JOIN

// EVEN BETTER for read-only: project just what you need
var names = await db.Orders
    .Select(o => new { o.Id, Customer = o.Customer.Name })
    .ToListAsync();`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Line-of-Business Apps</h4>
            <p>EF Core is the default data layer for most .NET business applications — CRUD, reporting, and complex
            domain persistence — thanks to its productivity and migration tooling.</p>
            <h4>Clean Architecture</h4>
            <p>EF Core implements repository interfaces in the infrastructure layer, keeping the domain free of
            persistence concerns while the DbContext acts as the unit of work.</p>
            <h4>Multi-Tenant SaaS</h4>
            <p>Global query filters automatically scope queries by tenant, and migrations manage schema across
            tenant databases.</p>
            <h4>High-Read Dashboards</h4>
            <p>Teams use AsNoTracking + projections (or compiled queries) for fast read models, often alongside
            Dapper for the hottest queries.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>EF Core vs Dapper vs raw ADO.NET:</p>`,
            table: {
                headers: ['Aspect', 'EF Core', 'Dapper', 'ADO.NET'],
                rows: [
                    ['Abstraction', 'Full ORM', 'Micro-ORM', 'None (raw)'],
                    ['Productivity', 'Highest', 'Medium', 'Lowest'],
                    ['Raw performance', 'Good', 'Excellent', 'Excellent'],
                    ['Change tracking', 'Yes', 'No', 'No'],
                    ['Migrations', 'Built-in', 'Manual', 'Manual'],
                    ['SQL control', 'Generated (overridable)', 'You write SQL', 'You write SQL'],
                    ['Learning curve', 'Higher', 'Low', 'Low'],
                    ['Best for', 'CRUD, domain models', 'Hot read paths, complex SQL', 'Full control / legacy']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>EF Core performance is mostly about controlling what data and how much you load:</p>
            <h4>Top Levers</h4>
            <ul>
                <li><strong>Project with Select:</strong> fetch only needed columns</li>
                <li><strong>AsNoTracking:</strong> skip change tracking on reads</li>
                <li><strong>Avoid N+1:</strong> Include or project related data</li>
                <li><strong>Split queries:</strong> AsSplitQuery() avoids cartesian explosion when including
                multiple collections</li>
                <li><strong>Compiled queries:</strong> EF.CompileAsyncQuery for hot, repeated queries</li>
                <li><strong>Pagination:</strong> never load unbounded result sets</li>
            </ul>
            <h4>Bulk Operations</h4>
            <p>EF Core 7+ supports <code>ExecuteUpdate</code>/<code>ExecuteDelete</code> for set-based updates
            without loading entities — far faster than load-modify-save loops.</p>
            <h4>Watch the SQL</h4>
            <p>Enable logging to see generated SQL. Cartesian explosions from multiple Includes and accidental
            client-side evaluation are common and visible in the logs.</p>`,
            callout: {
                type: 'warning',
                title: 'Cartesian Explosion',
                text: 'Including multiple one-to-many collections in a single query multiplies rows (orders \u00d7 lines \u00d7 payments), bloating the result set. Use AsSplitQuery() to issue separate queries per collection, or project to a shaped DTO.'
            }
        },
        {
            title: 'Testing',
            content: `<p>EF Core code should be tested against a real or realistic database where possible.</p>
            <h4>Testcontainers (preferred)</h4>
            <p>Run a real SQL Server/PostgreSQL in a container for integration tests — catches real SQL translation,
            constraints, and concurrency behavior the in-memory provider misses.</p>
            <h4>In-Memory / SQLite In-Memory</h4>
            <p>Faster but less faithful. The EF in-memory provider doesn't enforce relational constraints or
            translate real SQL — use SQLite in-memory for closer fidelity, or Testcontainers for accuracy.</p>`,
            code: `// Integration test with a real DB via Testcontainers
public class OrderRepoTests : IAsyncLifetime
{
    private readonly MsSqlContainer _sql = new MsSqlBuilder().Build();
    private AppDbContext _db = null!;

    public async Task InitializeAsync()
    {
        await _sql.StartAsync();
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(_sql.GetConnectionString()).Options;
        _db = new AppDbContext(opts);
        await _db.Database.MigrateAsync();
    }

    [Fact]
    public async Task SaveAndQuery_RoundTripsOrder()
    {
        _db.Orders.Add(new Order("cust-1"));
        await _db.SaveChangesAsync();

        var found = await _db.Orders.AsNoTracking()
            .FirstAsync(o => o.CustomerId == "cust-1");
        Assert.NotNull(found);
    }

    public Task DisposeAsync() => _sql.DisposeAsync().AsTask();
}`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>EF Core is a staple of .NET backend interviews:</p>
            <ul>
                <li><strong>Explain the N+1 problem</strong> and how Include/projection fixes it — the #1 EF question</li>
                <li><strong>Know tracking vs AsNoTracking</strong> and when each applies</li>
                <li><strong>Describe deferred execution</strong> and how queries compose before hitting the DB</li>
                <li><strong>Discuss when NOT to use EF</strong> (hot paths, bulk ops) and pairing with Dapper</li>
                <li><strong>Mention migrations</strong> and how schema evolves with the model</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Senior Signal',
                text: 'Saying "I always check the generated SQL with logging" signals production experience. Many EF performance problems (N+1, cartesian explosion, client-side evaluation) are invisible until you look at the actual SQL EF emits.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Docs &amp; Books</h4>
            <ul>
                <li>Official EF Core docs: learn.microsoft.com/ef/core</li>
                <li><em>Entity Framework Core in Action</em> by Jon P. Smith</li>
                <li><em>Pro EF Core</em> by Adam Freeman</li>
            </ul>
            <h4>Online</h4>
            <ul>
                <li>EF Core performance docs (learn.microsoft.com/ef/core/performance)</li>
                <li>Jon Smith's blog on EF Core performance patterns</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>DbContext</strong> = unit of work + change tracker + LINQ-to-SQL translator</li>
                <li><strong>N+1 problem:</strong> the most common EF pitfall — fix with Include or projection</li>
                <li><strong>AsNoTracking + Select DTO</strong> is the fast path for read-only queries</li>
                <li><strong>Deferred execution:</strong> queries run only when enumerated; compose before executing</li>
                <li><strong>Migrations</strong> evolve the schema in lockstep with the model</li>
                <li><strong>Watch the generated SQL</strong> — most performance issues are visible there</li>
                <li><strong>Pair with Dapper</strong> for the hottest read paths; use ExecuteUpdate/Delete for bulk</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Diagnose and Fix an N+1</h4>
            <ol>
                <li>Model Blog (1) - Posts (many) - Comments (many)</li>
                <li>Write a query that lists blogs with their posts and comment counts, naively (triggering N+1)</li>
                <li>Enable SQL logging and observe the number of queries</li>
                <li>Fix it with Include / ThenInclude, then measure again</li>
                <li>Rewrite as a projection (Select to a DTO with counts) and compare the SQL</li>
                <li>Add AsSplitQuery and explain when it helps vs hurts</li>
            </ol>`,
            code: `// 1-2. Naive (N+1):
var blogs = await db.Blogs.ToListAsync();
foreach (var b in blogs)
    Console.WriteLine($"{b.Name}: {b.Posts.Count} posts");  // query per blog

// TODO 4. Include fix; 5. projection fix; 6. AsSplitQuery
// Enable logging: optionsBuilder.LogTo(Console.WriteLine) to see the SQL.`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What is the N+1 problem and how do you fix it?<br/>
                    <em>A: Loading a list (1 query) then accessing a navigation property per item (N queries). Fix by
                    eager-loading with Include(), or by projecting related data in a single query.</em></li>
                <li><strong>Q:</strong> When should you use AsNoTracking()?<br/>
                    <em>A: For read-only queries where you won't update the results. It skips change-tracking overhead,
                    reducing memory and CPU.</em></li>
                <li><strong>Q:</strong> What is deferred execution in EF Core LINQ?<br/>
                    <em>A: A query isn't sent to the database until it is enumerated (ToList, First, foreach). This lets
                    you compose query operators into one efficient SQL statement.</em></li>
                <li><strong>Q:</strong> How does optimistic concurrency work in EF Core?<br/>
                    <em>A: A concurrency token (e.g., a rowversion column) is checked in the UPDATE WHERE clause. If the
                    row changed since you read it, zero rows update and EF throws DbUpdateConcurrencyException.</em></li>
            </ol>`
        }
    ],
    questions: [
        {"question":"What is the N+1 query problem in EF Core, and how do you fix it?","difficulty":"hard","answer":"<p>The <strong>N+1 problem</strong>: you load N parent entities with one query, then accessing a navigation property per parent triggers one additional query each — 1 + N queries instead of 1. With lazy loading it happens silently in a loop; it also occurs when you forget to eager-load.</p><p>Fix by <strong>eager loading</strong> with <code>Include</code>/<code>ThenInclude</code> to fetch related data in one (or few) queries, or by <strong>projecting</strong> only what you need with <code>Select</code> so EF generates an efficient join. Detect it by logging generated SQL. Beware \"cartesian explosion\" from multiple Includes — use <code>AsSplitQuery()</code> when needed.</p>","code":"// BAD: 1 + N queries (a query per order to load its customer)\nvar orders = db.Orders.ToList();\nforeach (var o in orders) Console.WriteLine(o.Customer.Name);\n\n// GOOD: one query with a join\nvar orders = db.Orders.Include(o => o.Customer).ToList();\n// Or project exactly what you need:\nvar rows = db.Orders.Select(o => new { o.Id, Customer = o.Customer.Name }).ToList();","language":"csharp","explanation":"N+1 is asking the warehouse for a list of 100 boxes, then phoning back 100 times to ask what is in each. Eager loading asks for the boxes and their contents in one request.","bestPractices":["Eager-load with Include/ThenInclude or project with Select","Log generated SQL to detect N+1","Use AsSplitQuery to avoid cartesian explosion with multiple Includes"],"commonMistakes":["Relying on lazy loading inside loops","Forgetting Include and hitting the DB per item","Over-Including causing a giant cartesian result"],"interviewTip":"Define 1+N precisely, then give both fixes (Include vs projection) and mention detecting it via SQL logging — practical depth.","followUp":["When is AsSplitQuery better than a single query?","How does projection reduce data transfer?","Why can lazy loading be dangerous?"]},
        {"question":"What is the difference between IQueryable and IEnumerable in EF Core, and why does AsNoTracking matter?","difficulty":"hard","answer":"<p>An EF <strong>IQueryable</strong> builds an expression tree translated to SQL and executed at the database — filtering/paging happen server-side. Switching to <strong>IEnumerable</strong> too early (e.g., <code>AsEnumerable()</code>/<code>ToList()</code> before filtering, or a client-only method) pulls rows into memory and filters client-side, potentially loading a whole table.</p><p><strong>AsNoTracking</strong> tells EF not to set up change tracking for the returned entities — faster and less memory for <em>read-only</em> queries, since EF skips creating tracking snapshots. Use tracking only when you intend to update the entities; use AsNoTracking for read-only reads and reporting.</p>","explanation":"IQueryable filters at the warehouse (send only what I asked for); premature IEnumerable ships the whole warehouse to sort at home. AsNoTracking is telling EF \"I am just reading, do not bother bookmarking every item for edits.\"","bestPractices":["Keep queries IQueryable until the final shape","Use AsNoTracking for read-only queries","Push filtering/paging to the database"],"commonMistakes":["ToList/AsEnumerable before filtering (loads whole table)","Tracking entities you never modify (wasted memory/CPU)","Client-only methods forcing in-memory evaluation"],"interviewTip":"Two wins: keep filtering in SQL (IQueryable) and skip change tracking for reads (AsNoTracking). Mention the whole-table-into-memory failure.","followUp":["How does change tracking work?","When must you keep tracking on?","What triggers client-side evaluation?"]},
        {
            question: 'What is the N+1 query problem in EF Core and how do you avoid it?',
            difficulty: 'easy',
            answer: `<p>The <strong>N+1 problem</strong> happens when you load a collection of N parent entities with one
            query, then access a related navigation property on each, triggering one additional query per
            parent — N+1 queries total. This is slow because of the round-trip overhead.</p>
            <p>Avoid it by loading related data up front: use <code>Include()</code>/<code>ThenInclude()</code> to
            eager-load in a single JOIN query, or project the needed data with <code>Select()</code>. Disabling lazy
            loading prevents accidental N+1.</p>`,
            explanation: 'It is like fetching a list of 100 customers, then making a separate phone call for each one to get their address — 101 calls. Instead, ask for customers and addresses together in one call.',
            code: `// N+1: 1 + N queries
var blogs = db.Blogs.ToList();
foreach (var b in blogs) _ = b.Posts.Count;   // query per blog

// Fixed: 1 query
var blogs2 = db.Blogs.Include(b => b.Posts).ToList();`,
            language: 'csharp',
            bestPractices: ['Use Include for needed relationships', 'Prefer projections for read-only views', 'Disable lazy loading to avoid accidental N+1'],
            commonMistakes: ['Relying on lazy loading in loops', 'Not inspecting generated SQL'],
            interviewTip: 'Define it crisply (1 + N queries), then give both fixes: Include for full entities, Select for read-only projections.',
            followUp: ['How does lazy loading cause N+1 silently?', 'When can Include itself cause a performance problem?']
        },
        {
            question: 'Explain tracking vs no-tracking queries and their performance implications.',
            difficulty: 'medium',
            answer: `<p>By default, EF Core <strong>tracks</strong> queried entities: it stores their original values in the
            change tracker so it can detect modifications and generate UPDATEs on SaveChanges. Tracking costs memory
            and CPU proportional to the number and size of entities.</p>
            <p><strong>AsNoTracking()</strong> returns entities without tracking them — faster and lighter, but they
            can't be updated through SaveChanges (EF won't detect changes). Use no-tracking for read-only queries
            (reports, lists, API GET endpoints) and tracking only when you intend to modify and save.</p>`,
            explanation: 'Tracking is like a librarian noting every book you take out so they know what changed. If you are just reading in the library and putting books back, that bookkeeping is wasted effort — no-tracking skips it.',
            code: `// Read-only: faster, no change tracking
var report = await db.Orders.AsNoTracking()
    .Where(o => o.CreatedAt > since).ToListAsync();

// Read-modify-write: needs tracking (default)
var order = await db.Orders.FirstAsync(o => o.Id == id);
order.Status = OrderStatus.Cancelled;
await db.SaveChangesAsync();`,
            language: 'csharp',
            bestPractices: ['Default to AsNoTracking for queries you will not save', 'Use tracking only for the read-modify-write pattern', 'Consider AsNoTrackingWithIdentityResolution when deduping references in read graphs'],
            commonMistakes: ['Tracking large read-only result sets', 'Expecting SaveChanges to persist changes on no-tracking entities'],
            interviewTip: 'Tie the choice to intent: tracking = you will modify and save; no-tracking = pure read. That framing is what interviewers want.',
            followUp: ['What is identity resolution and when do you need it?', 'How does tracking interact with DbContext lifetime?']
        },
        {
            question: 'When would you choose Dapper or raw SQL over EF Core, and how do you combine them?',
            difficulty: 'hard',
            answer: `<p>EF Core maximizes productivity for CRUD and domain persistence, but its abstraction has costs.
            Reach for Dapper or raw SQL when:</p>
            <ul>
                <li><strong>Hot read paths</strong> where every millisecond counts and the entity machinery is overhead</li>
                <li><strong>Complex queries</strong> (advanced window functions, hints, CTEs) that are awkward or
                untranslatable in LINQ</li>
                <li><strong>Bulk operations</strong> better expressed as set-based SQL (though EF 7+ ExecuteUpdate/Delete
                helps)</li>
                <li><strong>Reporting</strong> with shapes that don't map cleanly to entities</li>
            </ul>
            <p>They combine well: use EF Core for writes and domain logic (change tracking, transactions, migrations)
            and Dapper for the hottest read queries — often sharing the same connection/transaction. This "best tool
            per job" approach is common in mature codebases.</p>`,
            explanation: 'EF Core is a powerful automatic transmission — great for everyday driving. Dapper is a manual transmission you grab for the racetrack (hot paths) where you want precise control and minimal overhead. Many teams keep both.',
            code: `// EF Core for the write side (tracking, transaction, migrations)
order.MarkShipped();
await db.SaveChangesAsync();

// Dapper for a hot, complex read — share EF's underlying connection
var conn = db.Database.GetDbConnection();
var rows = await conn.QueryAsync<OrderReportRow>(
    @"SELECT o.Id, c.Name,
             SUM(l.Price * l.Qty) OVER (PARTITION BY o.CustomerId) AS CustomerTotal
      FROM Orders o JOIN Customers c ON c.Id = o.CustomerId
      JOIN OrderLines l ON l.OrderId = o.Id
      WHERE o.CreatedAt > @since", new { since });`,
            language: 'csharp',
            bestPractices: ['Use EF for writes/domain, Dapper for hot reads', 'Share connection/transaction when mixing', 'Always parameterize Dapper SQL to prevent injection'],
            commonMistakes: ['Forcing complex reporting SQL through LINQ', 'String-concatenating SQL in Dapper (injection risk)', 'Rewriting everything in Dapper prematurely'],
            interviewTip: 'Show pragmatism: EF for productivity and writes, Dapper for proven hot read paths. Mention you would profile before optimizing — not rewrite on a hunch.',
            followUp: ['How do you share a transaction between EF Core and Dapper?', 'What are EF Core compiled queries and when do they help?'],
            seniorPerspective: 'My default is EF Core everywhere for consistency and migrations, then I selectively introduce Dapper for the handful of read queries a profiler flags as hot or that need SQL features LINQ handles poorly. I keep them on the same connection and transaction so the two coexist cleanly. The mistake I have seen teams make is going all-Dapper for "performance" and then hand-maintaining tedious mapping and migrations that EF would have handled for free.'
        },
        {
            question: 'Explain EF Core loading strategies (eager, lazy, explicit, split) and when each applies.',
            difficulty: 'medium',
            answer: `<p>EF Core offers four ways to load related data:</p>
            <ul>
                <li><strong>Eager loading</strong> — <code>Include()</code>/<code>ThenInclude()</code> pulls related entities in the same round trip (a JOIN). Best when you know up front you need the related data.</li>
                <li><strong>Lazy loading</strong> — navigation properties load automatically on first access (requires proxies + virtual navigations). Convenient but a frequent source of the silent N+1 problem.</li>
                <li><strong>Explicit loading</strong> — you load on demand via <code>Entry(e).Collection(...).LoadAsync()</code> or <code>Reference(...).LoadAsync()</code>. Useful for conditional loading.</li>
                <li><strong>Split queries</strong> — <code>AsSplitQuery()</code> issues one SQL query per included collection instead of a single JOIN, avoiding the cartesian explosion that multiple one-to-many includes cause.</li>
            </ul>`,
            explanation: 'Eager loading is ordering a combo meal — everything arrives together. Lazy loading is asking for each side dish only when you reach for it (lots of trips to the counter = N+1). Explicit loading is deciding mid-meal to go get dessert. Split queries are sending separate waiters for the burgers and the fries so they do not get tangled into one giant overloaded tray.',
            code: `// Eager: one query with JOINs
var order = await db.Orders
    .Include(o => o.Customer)
    .Include(o => o.Lines).ThenInclude(l => l.Product)
    .FirstAsync(o => o.Id == id);

// Lazy (needs UseLazyLoadingProxies + virtual navs) -> risk of N+1
// foreach (var o in db.Orders.ToList()) _ = o.Customer.Name; // query per order!

// Explicit: load on demand, optionally filtered
var o2 = await db.Orders.FirstAsync(o => o.Id == id);
await db.Entry(o2).Collection(x => x.Lines)
        .Query().Where(l => l.Qty > 0).LoadAsync();

// Split: avoid cartesian explosion from multiple collections
var orders = await db.Orders
    .Include(o => o.Lines)
    .Include(o => o.Payments)
    .AsSplitQuery()          // separate query per collection
    .ToListAsync();
// Single-query JOIN would multiply: orders x lines x payments rows`,
            language: 'csharp',
            bestPractices: [
                'Default to eager loading with Include when you know the related data is needed',
                'Use AsSplitQuery when including two or more collection navigations to avoid row multiplication',
                'Prefer explicit loading for conditional or filtered related data',
                'Disable lazy loading proxies in most apps to prevent accidental N+1'
            ],
            commonMistakes: [
                'Relying on lazy loading in loops and triggering N+1 queries silently',
                'Including multiple collections in a single query and causing cartesian explosion',
                'Using AsSplitQuery everywhere (extra round trips and possible cross-query inconsistency)',
                'Over-including entire object graphs when a projection would fetch far less'
            ],
            interviewTip: 'Name all four strategies, then connect Include + multiple collections to the cartesian explosion problem that AsSplitQuery solves. Mentioning the consistency trade-off of split queries (separate transactions per query unless wrapped) is a senior detail.',
            followUp: ['What is cartesian explosion and how does AsSplitQuery fix it?', 'What are the consistency trade-offs of split queries?', 'How do you enable lazy loading and why is it risky?'],
            seniorPerspective: 'I disable lazy loading by default — the convenience is not worth the invisible N+1s it spawns. I use eager Include for known graphs and reach for AsSplitQuery the moment a query includes more than one collection, because the cartesian blow-up is easy to miss until the result set balloons in production.',
            architectPerspective: 'Loading strategy is part of read-model design. For complex aggregates I prefer projecting to purpose-built DTOs over loading full graphs, and I reserve split queries for genuine multi-collection cases. Standardizing these choices across the team keeps EF query behavior predictable and the generated SQL reviewable.'
        },
        {
            question: 'How does optimistic concurrency work in EF Core with concurrency tokens?',
            difficulty: 'hard',
            answer: `<p>EF Core implements <strong>optimistic concurrency</strong> using a <strong>concurrency token</strong>: a property whose original value is included in the <code>WHERE</code> clause of generated UPDATE/DELETE statements. If another transaction changed the row since you read it, the token no longer matches, zero rows are affected, and EF throws <code>DbUpdateConcurrencyException</code>.</p>
            <p>On SQL Server the idiomatic token is a <strong>rowversion</strong> (the <code>[Timestamp]</code> attribute or <code>.IsRowVersion()</code>) — an 8-byte value the database auto-increments on every update. Alternatively, any property marked <code>.IsConcurrencyToken()</code> (e.g., a <code>LastModified</code> timestamp) can serve the same role.</p>
            <p>When the exception fires, you resolve it: reload database values and retry (store-wins), overwrite (client-wins), or merge field-by-field and surface a conflict to the user.</p>`,
            explanation: 'A concurrency token is like writing down the version number on a shared document before you edit it. When you submit your change you say "update it, but only if it is still version 5." If someone already bumped it to version 6, your update touches nothing and you are told to refresh and try again — preventing you from silently clobbering their work.',
            code: `public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }

    [Timestamp]                  // SQL Server rowversion concurrency token
    public byte[] RowVersion { get; set; } = default!;
}

// EF generates: UPDATE Products SET Price=@p WHERE Id=@id AND RowVersion=@original
try
{
    product.Price = newPrice;
    await db.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException ex)
{
    var entry = ex.Entries.Single();
    var dbValues = await entry.GetDatabaseValuesAsync();
    if (dbValues is null) { /* row was deleted by someone else */ }
    else
    {
        // Store-wins: refresh originals, let user re-decide
        entry.OriginalValues.SetValues(dbValues);
        // or Client-wins: keep current values, retry SaveChanges
    }
}

// Alternative token without rowversion:
// modelBuilder.Entity<Product>().Property(p => p.LastModified).IsConcurrencyToken();`,
            language: 'csharp',
            bestPractices: [
                'Use a SQL Server rowversion ([Timestamp]) as the concurrency token for whole-row checks',
                'Always catch DbUpdateConcurrencyException and define an explicit resolution policy',
                'Reload database values with GetDatabaseValuesAsync before retrying',
                'Use property-level IsConcurrencyToken when you only care about specific columns'
            ],
            commonMistakes: [
                'Ignoring DbUpdateConcurrencyException and letting last-write-win silently lose data',
                'Forgetting to map the rowversion property, so no token is added to the WHERE clause',
                'Holding a long pessimistic transaction instead of using optimistic tokens for user edits',
                'Not handling the null-database-values case (row deleted by another user)'
            ],
            interviewTip: 'Explain the mechanism concretely: the original token value goes into the UPDATE WHERE clause; a mismatch yields zero affected rows and DbUpdateConcurrencyException. Then walk through the three resolution strategies (store-wins, client-wins, merge) — having a policy is the senior signal.',
            followUp: ['What is the difference between [Timestamp] and IsConcurrencyToken?', 'How do you implement client-wins vs store-wins?', 'How does this compare to pessimistic locking with UPDLOCK?'],
            seniorPerspective: 'I put a rowversion on every entity that users can edit through long-lived forms. The think-time between read and save is exactly where conflicts happen, and optimistic tokens catch them without holding any lock. The discipline is having a defined resolution UX — usually reload and show the user what changed — rather than blindly retrying.',
            architectPerspective: 'Optimistic concurrency is the same pattern as HTTP ETags and If-Match at the API layer. I align them: the rowversion becomes the ETag exposed to clients, so conflict detection is consistent from the database through the REST contract, and the UI gets a deterministic 412/conflict signal to drive its merge experience.'
        },
        {
            question: 'What are the main EF Core performance levers for read-heavy and bulk workloads?',
            difficulty: 'advanced',
            answer: `<p>EF Core performance is mostly about controlling how much data is materialized and how often plans are built:</p>
            <ul>
                <li><strong>Project with Select</strong> — fetch only the columns the screen needs into a DTO; the single biggest lever for reads.</li>
                <li><strong>AsNoTracking</strong> — skip change-tracker bookkeeping for read-only queries (less memory/CPU).</li>
                <li><strong>Compiled queries</strong> — <code>EF.CompileAsyncQuery</code> caches the LINQ-to-SQL translation for hot, repeated queries, removing per-call expression-tree compilation.</li>
                <li><strong>Bulk set-based operations</strong> — EF Core 7+ <code>ExecuteUpdateAsync</code>/<code>ExecuteDeleteAsync</code> run a single UPDATE/DELETE without loading entities, replacing slow load-modify-save loops.</li>
                <li><strong>Avoid N+1 and cartesian explosion</strong> — Include/project deliberately and use AsSplitQuery for multiple collections.</li>
                <li><strong>Pagination</strong> — never materialize unbounded result sets.</li>
            </ul>`,
            explanation: 'Tuning EF Core is like packing for a trip: take only what you need (Select a DTO), do not carry a logbook for items you will not change (AsNoTracking), reuse a pre-planned packing list for trips you take constantly (compiled queries), and when you need to relabel a thousand boxes, do it with one bulk instruction (ExecuteUpdate) rather than opening and repacking each box (load-modify-save).',
            code: `// Projection + no tracking: the fast read path
var rows = await db.Orders
    .AsNoTracking()
    .Where(o => o.Status == OrderStatus.Shipped)
    .Select(o => new OrderListDto(o.Id, o.Customer.Name, o.Total))
    .ToListAsync();

// Compiled query: cache translation for a hot, repeated query
private static readonly Func<AppDbContext, int, Task<Order?>> GetOrderById =
    EF.CompileAsyncQuery((AppDbContext db, int id) =>
        db.Orders.FirstOrDefault(o => o.Id == id));
var order = await GetOrderById(db, id);

// Bulk update without loading entities (EF Core 7+)
await db.Orders
    .Where(o => o.Status == OrderStatus.Pending && o.CreatedAt < cutoff)
    .ExecuteUpdateAsync(s => s
        .SetProperty(o => o.Status, OrderStatus.Expired)
        .SetProperty(o => o.UpdatedAt, DateTime.UtcNow));

// Bulk delete in one SQL statement
await db.AuditLogs.Where(a => a.CreatedAt < retentionCutoff)
    .ExecuteDeleteAsync();`,
            language: 'csharp',
            bestPractices: [
                'Project to DTOs with Select and AsNoTracking for read-only queries',
                'Use ExecuteUpdate/ExecuteDelete for set-based modifications instead of load-modify-save loops',
                'Compile hot, frequently-executed queries with EF.CompileAsyncQuery',
                'Always paginate and inspect the generated SQL via logging'
            ],
            commonMistakes: [
                'Loading full tracked entity graphs "just in case" when a projection would do',
                'Looping load-modify-SaveChanges for bulk updates (thousands of round trips)',
                'Forgetting that ExecuteUpdate/ExecuteDelete bypass the change tracker (no SaveChanges, no interceptors firing the same way)',
                'Not enabling SQL logging, leaving N+1 and cartesian explosions invisible'
            ],
            interviewTip: 'Rank the levers: projection + AsNoTracking first (covers most cases), then compiled queries for hot paths, then ExecuteUpdate/Delete for bulk. Mentioning that ExecuteUpdate skips the change tracker (so it does not run SaveChanges-based logic) shows depth.',
            followUp: ['When does ExecuteUpdate bypass important domain logic?', 'How much do compiled queries actually save?', 'How do you detect cartesian explosion in the generated SQL?'],
            seniorPerspective: 'My first move on a slow EF endpoint is always to read the generated SQL, then convert full-entity loads to projections with AsNoTracking — that alone fixes most cases. I save compiled queries for genuinely hot lookups and use ExecuteUpdate/Delete for retention and batch jobs, mindful that they skip the change tracker and any SaveChanges-side effects.',
            architectPerspective: 'I treat read and write models differently: writes go through tracked entities and domain logic; reads use lean projections (sometimes Dapper) optimized per screen. Bulk lifecycle operations (archival, expiry) are designed as set-based ExecuteUpdate/Delete jobs from the start, so the system never falls into row-by-row processing at scale.'
        }
    ]
});
