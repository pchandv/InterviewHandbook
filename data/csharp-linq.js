/* ═══════════════════════════════════════════════════════════════════
   C# — LINQ (Language Integrated Query)
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('csharp-linq', {
    title: 'LINQ — Language Integrated Query',
    description: 'Mastering LINQ query and method syntax, deferred execution, performance implications, Expression trees, and real-world patterns for data transformation.',
    sections: [
        {
            title: 'Query Syntax vs Method Syntax',
            content: `<p>LINQ provides two equivalent syntaxes. <strong>Query syntax</strong> resembles SQL, while <strong>method syntax</strong> uses extension methods with lambda expressions. The compiler transforms query syntax into method calls — they produce identical IL.</p>`,
            code: `// Query syntax (SQL-like)
var seniors = from u in users
              where u.Age > 30
              orderby u.Name
              select new { u.Name, u.Department };

// Method syntax (fluent, more flexible)
var seniors = users
    .Where(u => u.Age > 30)
    .OrderBy(u => u.Name)
    .Select(u => new { u.Name, u.Department });

// Method syntax supports operations query syntax cannot:
var result = users
    .DistinctBy(u => u.Email)        // No query syntax equivalent
    .Chunk(100)                       // Batch processing
    .SelectMany(batch => Process(batch))
    .Take(50);

// Mixed — use query for complex joins, method for simple chains
var report = (from o in orders
              join c in customers on o.CustomerId equals c.Id
              where o.Total > 1000
              select new { c.Name, o.Total })
             .OrderByDescending(x => x.Total)
             .Take(10);`,
            language: 'csharp'
        },
        {
            title: 'Deferred vs Immediate Execution',
            content: `<p><strong>Deferred execution</strong> means the query is not evaluated until you iterate over it (foreach, ToList, Count, etc.). This enables composition and avoids unnecessary computation. <strong>Immediate execution</strong> forces evaluation immediately.</p>`,
            code: `// DEFERRED — query is just a plan, not executed yet
IEnumerable<User> query = users.Where(u => u.IsActive);
// No database call or iteration has happened!

// Execution happens HERE when we iterate:
foreach (var user in query) { } // NOW it executes
var list = query.ToList();       // NOW it executes
var count = query.Count();       // NOW it executes

// DANGER: Multiple enumeration
var filtered = users.Where(u => u.IsActive); // Deferred
var count = filtered.Count();    // Enumerates once
var first = filtered.First();    // Enumerates AGAIN!
// If 'users' is a DB query, this hits the database TWICE!

// FIX: Materialize once when needed multiple times
var materialized = users.Where(u => u.IsActive).ToList();
var count = materialized.Count;  // Just reads .Count property
var first = materialized[0];     // Just reads index

// Deferred operators: Where, Select, OrderBy, Skip, Take, SelectMany
// Immediate operators: ToList, ToArray, Count, First, Sum, ToDictionary

// Streaming vs Non-streaming deferred:
// Streaming (yields one at a time): Where, Select, Take
// Non-streaming (buffers all): OrderBy, GroupBy, Distinct
var ordered = users.OrderBy(u => u.Name); // Must read ALL to sort
// vs
var filtered = users.Where(u => u.IsActive); // Yields one at a time`,
            language: 'csharp',
            callout: { type: 'warning', title: 'Multiple Enumeration', text: 'Every time you iterate a deferred query, it re-executes from source. For EF Core queries, this means multiple database round-trips. ReSharper/Rider warns about this with "Possible multiple enumeration of IEnumerable". Fix: call .ToList() once.' }
        },
        {
            title: 'GroupBy, Join, and Aggregation',
            content: `<p>LINQ's power shines in data transformation — grouping, joining multiple sources, and aggregation — all with type safety and IntelliSense.</p>`,
            code: `// GroupBy — organize data into keyed groups
var byDepartment = employees
    .GroupBy(e => e.Department)
    .Select(g => new
    {
        Department = g.Key,
        Count = g.Count(),
        AvgSalary = g.Average(e => e.Salary),
        TopEarner = g.OrderByDescending(e => e.Salary).First().Name
    });

// Join — combine two sequences by key
var orderDetails = from o in orders
                   join c in customers on o.CustomerId equals c.Id
                   join p in products on o.ProductId equals p.Id
                   select new
                   {
                       Customer = c.Name,
                       Product = p.Name,
                       o.Quantity,
                       Total = o.Quantity * p.Price
                   };

// Left Join (GroupJoin + SelectMany)
var withOrders = from c in customers
                 join o in orders on c.Id equals o.CustomerId into customerOrders
                 from co in customerOrders.DefaultIfEmpty()
                 select new { c.Name, OrderId = co?.Id };

// Aggregation
var stats = new
{
    Total = orders.Sum(o => o.Amount),
    Average = orders.Average(o => o.Amount),
    Max = orders.Max(o => o.Amount),
    Count = orders.Count(o => o.Amount > 100)
};

// Aggregate (custom accumulator — fold)
var csv = names.Aggregate((current, next) => $"{current},{next}");
var runningTotal = transactions.Aggregate(0m, 
    (sum, t) => sum + t.Amount,
    total => $"Total: {total:C}");`,
            language: 'csharp'
        },
        {
            title: 'LINQ Performance Considerations',
            content: `<p>LINQ's elegance can hide performance issues. Understanding when LINQ is zero-cost and when it allocates heavily is critical for high-throughput code.</p>`,
            code: `// ALLOCATION COSTS:
// 1. Lambda captures — closures allocate
int threshold = 100;
var filtered = items.Where(x => x.Value > threshold); // Closure allocates!

// 2. Iterator state machines — each chained operator creates one
var result = items.Where(...).Select(...).OrderBy(...); // 3 allocations

// 3. ToList/ToArray — allocates new collection + copies

// HIGH-PERFORMANCE ALTERNATIVES:

// Instead of LINQ .Where + .ToList:
var result = new List<Item>(items.Count);
foreach (var item in items)
{
    if (item.Value > threshold) result.Add(item);
}

// Span-based LINQ (no allocations) — Community libraries
// Or manual Span iteration for hot paths:
ReadOnlySpan<int> span = data.AsSpan();
int sum = 0;
foreach (var n in span) { if (n > 0) sum += n; }

// EF Core LINQ-to-SQL considerations:
// GOOD: Pushes filter to database
var users = await dbContext.Users
    .Where(u => u.IsActive)
    .OrderBy(u => u.Name)
    .ToListAsync(); // Single SQL query

// BAD: Loads ALL users, then filters in memory!
var users = (await dbContext.Users.ToListAsync())
    .Where(u => u.IsActive); // Filtering in C# not SQL!

// Check with .ToQueryString() in development:
var sql = dbContext.Users.Where(u => u.IsActive).ToQueryString();
Console.WriteLine(sql); // See the actual SQL generated`,
            language: 'csharp',
            callout: { type: 'info', title: 'When to avoid LINQ', text: 'In hot paths processing millions of items per second (game loops, serialization, parsers), raw loops with Span<T> outperform LINQ by 10-100x. For business logic processing hundreds of items, LINQ is perfectly fine.' }
        }
    ],
    questions: [
        {"question":"What is deferred execution in LINQ, and what pitfalls does it cause?","difficulty":"medium","answer":"<p><strong>Deferred execution</strong> means a LINQ query is not run when defined, but when it is enumerated (foreach, <code>ToList</code>, <code>Count</code>, etc.). The query is a description that executes lazily on demand.</p><p>Pitfalls: <strong>multiple enumeration</strong> re-runs the query (and any DB/IO) each time; <strong>captured variables</strong> can change between definition and execution; and enumerating a query after its underlying data or connection has changed/closed can throw or return unexpected results. Materialize with <code>ToList()</code> when you need a stable snapshot or will iterate more than once.</p>","explanation":"A deferred query is a recipe, not a cooked meal. Reading the recipe (enumerating) cooks it fresh each time — so if the ingredients change between readings, you get a different dish.","bestPractices":["Materialize with ToList/ToArray when iterating multiple times","Be careful with captured variables in deferred queries","Avoid enumerating a query after its data source is disposed"],"commonMistakes":["Enumerating the same query repeatedly, re-hitting the database","Assuming Count() then foreach runs the query once (it runs twice)","Returning a deferred query whose source is disposed by the caller time"],"interviewTip":"Name the two big traps: multiple enumeration (repeats side effects/IO) and stale captured variables. Say when you would call ToList to force execution.","followUp":["Which LINQ operators force immediate execution?","How does deferred execution interact with EF Core?","What is streaming vs buffering in LINQ?"]},
        {"question":"What is the difference between IEnumerable and IQueryable in LINQ?","difficulty":"hard","answer":"<p><strong>IEnumerable&lt;T&gt;</strong> executes queries <em>in memory</em> using LINQ-to-Objects: the data is pulled into the app and filtering/sorting happens client-side with compiled delegates. <strong>IQueryable&lt;T&gt;</strong> builds an <em>expression tree</em> that a provider (EF Core) translates into the target query language (SQL), so filtering/paging happens <em>at the source</em>.</p><p>The critical bug: calling <code>.AsEnumerable()</code> or a client-only method too early forces the whole table into memory, then filters — pulling millions of rows instead of a WHERE clause. Keep queries as IQueryable until the final shape so the database does the work.</p>","explanation":"IQueryable is telling the warehouse \"send me only red boxes\" (they filter before shipping). IEnumerable-too-early is having the entire warehouse shipped to your office and sorting through it yourself.","bestPractices":["Keep DB queries as IQueryable until the final projection","Push filtering/paging to the database","Be deliberate about where the query switches to in-memory"],"commonMistakes":["Calling AsEnumerable/ToList before filtering (loads whole table)","Using client-only methods inside an EF query, forcing evaluation","Not realizing which operators are translatable to SQL"],"interviewTip":"The headline: IQueryable filters at the source (SQL) via expression trees; premature IEnumerable pulls everything into memory first. Give the \"whole table into memory\" failure.","followUp":["What is an expression tree?","How does EF Core translate IQueryable to SQL?","What happens when a method cannot be translated to SQL?"]},
        {
            question: 'What is deferred execution in LINQ and why does it matter?',
            difficulty: 'easy',
            answer: `<p><strong>Deferred execution</strong> means a LINQ query defines a plan but doesn't execute until results are consumed (via foreach, ToList, Count, etc.). This enables query composition without unnecessary computation and allows providers like EF Core to translate the entire chain into a single SQL query.</p>`,
            code: `// The query is NOT executed here — just a plan
var query = dbContext.Users
    .Where(u => u.IsActive)
    .OrderBy(u => u.Name);

// You can compose further without executing:
if (searchTerm != null)
    query = query.Where(u => u.Name.Contains(searchTerm));

if (departmentId.HasValue)
    query = query.Where(u => u.DepartmentId == departmentId);

// NOW it executes — one SQL query with all filters:
var results = await query.ToListAsync();

// Benefits:
// 1. Composability — build queries conditionally
// 2. Efficiency — only one DB call regardless of composition
// 3. Lazy — skips computation if results are never needed`,
            language: 'csharp',
            bestPractices: [
                'Compose queries fully before materializing (ToList/ToArray)',
                'Materialize once if you need to enumerate multiple times',
                'Use AsNoTracking() in EF Core for read-only queries',
                'Prefer FirstOrDefault over Where+First for single element retrieval'
            ],
            commonMistakes: [
                'Multiple enumeration of the same deferred query (multiple DB calls)',
                'Calling ToList() too early before all filters are applied',
                'Assuming the query runs at definition time',
                'Mixing deferred and immediate operations without understanding execution order'
            ],
            interviewTip: 'Demonstrate with a concrete example: show how adding a Where clause to a deferred query adds to the SQL WHERE clause without re-executing. This shows you understand LINQ providers.',
            followUp: ['What operators cause immediate execution?', 'How does EF Core translate LINQ to SQL?', 'What is the difference between streaming and non-streaming operators?'],
            seniorPerspective: 'I leverage deferred execution for dynamic query building — pagination, filtering, sorting all composed conditionally before a single ToListAsync(). It keeps repository code clean.',
            architectPerspective: 'Deferred execution is what makes IQueryable<T>-based specifications work in Clean Architecture. Domain specifications compose in the application layer and execute as optimized SQL in the infrastructure layer.'
        },
        {
            question: 'What is the difference between IEnumerable<T> and IQueryable<T>?',
            difficulty: 'medium',
            answer: `<p><code>IEnumerable&lt;T&gt;</code> processes data in memory using delegates. <code>IQueryable&lt;T&gt;</code> builds an expression tree that can be translated by a provider (like EF Core) into a different query language (SQL). The key difference: IQueryable pushes operations to the data source; IEnumerable pulls data into memory first.</p>`,
            code: `// IQueryable<T> — expression tree, translated to SQL
IQueryable<User> query = dbContext.Users
    .Where(u => u.Age > 30)       // Becomes: WHERE Age > 30
    .OrderBy(u => u.Name)          // Becomes: ORDER BY Name
    .Take(10);                     // Becomes: TOP 10
// Result: SELECT TOP 10 * FROM Users WHERE Age > 30 ORDER BY Name

// IEnumerable<T> — delegates, runs in memory
IEnumerable<User> allUsers = dbContext.Users.AsEnumerable(); // Loads ALL rows!
var filtered = allUsers
    .Where(u => u.Age > 30)   // Filters in C# memory
    .OrderBy(u => u.Name)     // Sorts in C# memory
    .Take(10);                // Takes first 10 in memory
// Result: SELECT * FROM Users (loads everything, filters in app!)

// DANGER: Accidental IEnumerable switch
var users = dbContext.Users
    .Where(u => u.IsActive)        // IQueryable — SQL filter
    .AsEnumerable()                 // SWITCHES to IEnumerable!
    .Where(u => CustomLogic(u))     // Now in-memory — cannot translate to SQL
    .ToList();

// When you NEED IEnumerable (client-side logic):
var users = await dbContext.Users
    .Where(u => u.IsActive)        // Push to SQL
    .ToListAsync();                 // Materialize
var processed = users              // IEnumerable (in-memory)
    .Where(u => ComplexRegex.IsMatch(u.Bio)) // Can't translate to SQL
    .ToList();`,
            language: 'csharp',
            bestPractices: [
                'Keep queries as IQueryable as long as possible (push filters to DB)',
                'Only switch to IEnumerable when you need client-side logic',
                'Use .AsNoTracking() for read-only IQueryable operations',
                'Check generated SQL with .ToQueryString() during development'
            ],
            commonMistakes: [
                'Accidentally switching to IEnumerable with .AsEnumerable() or ToList() too early',
                'Calling methods that cannot be translated to SQL on IQueryable (crashes at runtime)',
                'Returning IQueryable from repositories (leaks DB concerns to upper layers)',
                'Not understanding that IQueryable defers to the provider, not just defers execution'
            ],
            interviewTip: 'The key insight: IEnumerable uses Func<T, bool> (compiled delegate), IQueryable uses Expression<Func<T, bool>> (expression tree that providers can inspect and translate). This is WHY providers can convert LINQ to SQL.',
            followUp: ['What are Expression Trees?', 'Can you write custom IQueryable providers?', 'Why might a LINQ expression fail at runtime but compile fine?'],
            seniorPerspective: 'I enforce a rule: repositories return materialized collections or IAsyncEnumerable, never raw IQueryable. This prevents N+1 queries from leaking into services and controllers.',
            architectPerspective: 'The IQueryable abstraction is both powerful and dangerous. In Clean Architecture, I use Specification pattern objects that encapsulate query logic, keeping IQueryable inside the infrastructure layer.'
        },
        {
            question: 'How does SelectMany work and when would you use it?',
            difficulty: 'medium',
            answer: `<p><code>SelectMany</code> flattens nested collections — it projects each element to a sequence and then flattens all sequences into one. It is the LINQ equivalent of a nested foreach or a SQL CROSS APPLY / lateral join.</p>`,
            code: `// Problem: You have orders, each with multiple items
var orders = new[]
{
    new Order { Id = 1, Items = new[] { "Laptop", "Mouse" } },
    new Order { Id = 2, Items = new[] { "Keyboard", "Monitor", "Cable" } }
};

// Select gives: IEnumerable<string[]> (nested!)
var nested = orders.Select(o => o.Items); // [[Laptop,Mouse], [Keyboard,Monitor,Cable]]

// SelectMany gives: IEnumerable<string> (flattened!)
var flat = orders.SelectMany(o => o.Items); // [Laptop,Mouse,Keyboard,Monitor,Cable]

// With index and result selector:
var detailed = orders.SelectMany(
    (order, orderIndex) => order.Items,                    // Collection selector
    (order, item) => new { order.Id, Item = item }         // Result selector
);
// [{ Id=1, Item="Laptop" }, { Id=1, Item="Mouse" }, ...]

// Real-world: flatten nested API responses
var allPermissions = users
    .SelectMany(u => u.Roles)
    .SelectMany(r => r.Permissions)
    .Distinct();

// Real-world: Cartesian product
var combinations = sizes.SelectMany(
    size => colors,
    (size, color) => new { Size = size, Color = color }
);

// Query syntax equivalent (multiple from clauses):
var allItems = from order in orders
               from item in order.Items
               select new { order.Id, Item = item };`,
            language: 'csharp',
            bestPractices: [
                'Use SelectMany to flatten one-to-many relationships',
                'Use the result selector overload to combine parent and child data',
                'In EF Core, SelectMany translates to JOIN or CROSS APPLY',
                'Use for Cartesian products (all combinations of two sets)'
            ],
            commonMistakes: [
                'Using nested Select when SelectMany is needed (getting IEnumerable<IEnumerable<T>>)',
                'Not using the result selector overload and losing parent context',
                'Forgetting that SelectMany is the monadic bind (flatMap) operation'
            ],
            interviewTip: 'SelectMany is the "flatMap" from functional programming. If you can explain it as "for each element, produce zero-or-more results, then flatten all into one stream" — you demonstrate deep understanding.',
            followUp: ['How does SelectMany relate to monads?', 'How does EF Core translate SelectMany to SQL?', 'Can SelectMany handle null inner collections safely?'],
            seniorPerspective: 'SelectMany is my go-to for denormalizing nested domain models into flat DTOs. Combined with GroupBy it handles any hierarchical data transformation without manual loops.',
            architectPerspective: 'SelectMany is fundamentally the bind/flatMap operation of the IEnumerable monad. Understanding this connection helps when working with other monadic types (Task, Result, Option) in functional C#.'
        },
        {
            question: 'What are Expression Trees and how do they enable LINQ-to-SQL translation?',
            difficulty: 'advanced',
            answer: `<p>An <strong>Expression Tree</strong> (<code>Expression&lt;Func&lt;T, bool&gt;&gt;</code>) is a data structure representing code as a tree of nodes. Unlike compiled delegates, expression trees can be inspected, modified, and translated to other languages (SQL, REST queries, etc.) at runtime. This is how EF Core converts your C# LINQ lambdas into SQL.</p>`,
            code: `// Compiled delegate — opaque, just executable code
Func<User, bool> compiled = u => u.Age > 30;
// You can CALL it but cannot inspect what it does

// Expression tree — inspectable data structure
Expression<Func<User, bool>> expression = u => u.Age > 30;
// You can analyze: "Parameter 'u', Member 'Age', GreaterThan, Constant 30"

// Inspecting the tree:
var body = (BinaryExpression)expression.Body;
var left = (MemberExpression)body.Left;     // u.Age
var right = (ConstantExpression)body.Right;  // 30
var op = body.NodeType;                      // GreaterThan
// EF Core walks this tree and produces: WHERE [u].[Age] > 30

// Building expressions dynamically (specification pattern):
public static Expression<Func<T, bool>> And<T>(
    this Expression<Func<T, bool>> left,
    Expression<Func<T, bool>> right)
{
    var param = Expression.Parameter(typeof(T));
    var body = Expression.AndAlso(
        Expression.Invoke(left, param),
        Expression.Invoke(right, param));
    return Expression.Lambda<Func<T, bool>>(body, param);
}

// Usage: dynamic filter composition
Expression<Func<User, bool>> filter = u => u.IsActive;
if (minAge.HasValue)
    filter = filter.And(u => u.Age >= minAge.Value);
if (department != null)
    filter = filter.And(u => u.Department == department);

var results = await dbContext.Users.Where(filter).ToListAsync();`,
            language: 'csharp',
            bestPractices: [
                'Use Expression<Func<>> for IQueryable parameters (enables translation)',
                'Use Func<> for IEnumerable parameters (in-memory, no need for trees)',
                'Build dynamic expressions for specification/criteria patterns',
                'Cache compiled expressions when used repeatedly for performance'
            ],
            commonMistakes: [
                'Using Func<> with IQueryable (forces client-side evaluation, no SQL translation)',
                'Building expressions in tight loops without caching (compilation overhead)',
                'Forgetting that not all C# expressions can be translated to SQL',
                'Over-engineering — use expression trees only when dynamic composition is needed'
            ],
            interviewTip: 'Explain the compilation pipeline: C# lambda → Expression Tree → Provider visits tree → SQL string. This demonstrates understanding of how EF Core/LINQ providers actually work under the hood.',
            followUp: ['How do you compose expression trees dynamically?', 'What expressions cannot be translated to SQL?', 'What is the visitor pattern in expression trees?'],
            seniorPerspective: 'I use expression trees for dynamic sort/filter in generic repository methods. A single method handles any column sort by building the OrderBy expression from a string column name at runtime.',
            architectPerspective: 'Expression trees are the foundation of cross-cutting query concerns — audit filters, tenant isolation, soft-delete, all injected via IQueryable interceptors that modify the expression tree before SQL generation.'
        },
        {
            question: 'How do you write performant LINQ? What are common performance pitfalls?',
            difficulty: 'advanced',
            answer: `<p>LINQ performance depends on: (1) avoiding multiple enumeration, (2) pushing work to the database, (3) minimizing allocations in hot paths, and (4) choosing the right operator for the job. The biggest pitfall is invisible client-side evaluation when using EF Core.</p>`,
            code: `// PITFALL 1: N+1 queries (lazy loading)
// BAD — each order triggers a separate query for Customer
var orders = await dbContext.Orders.ToListAsync();
foreach (var o in orders)
    Console.WriteLine(o.Customer.Name); // N separate queries!

// FIX: Eager loading
var orders = await dbContext.Orders
    .Include(o => o.Customer)
    .ToListAsync(); // Single query with JOIN

// PITFALL 2: Loading entire table then filtering
// BAD:
var active = (await dbContext.Users.ToListAsync()).Where(u => u.IsActive);
// GOOD:
var active = await dbContext.Users.Where(u => u.IsActive).ToListAsync();

// PITFALL 3: Repeated materialization
// BAD:
var count = await query.CountAsync();     // DB call 1
var items = await query.ToListAsync();    // DB call 2
// GOOD:
var items = await query.ToListAsync();    // One DB call
var count = items.Count;                  // In-memory

// PITFALL 4: OrderBy before Where
// Less efficient (sorts more items):
items.OrderBy(x => x.Date).Where(x => x.IsActive).Take(10);
// More efficient (filters first, sorts fewer items):
items.Where(x => x.IsActive).OrderBy(x => x.Date).Take(10);

// PITFALL 5: Allocation in hot paths
// BAD: allocates closure + iterator for each call
bool HasPermission(User u, string perm) =>
    u.Roles.SelectMany(r => r.Permissions).Any(p => p == perm);

// GOOD: manual loop for hot path (zero allocation)
bool HasPermission(User u, string perm)
{
    foreach (var role in u.Roles)
        foreach (var p in role.Permissions)
            if (p == perm) return true;
    return false;
}`,
            language: 'csharp',
            bestPractices: [
                'Always filter (Where) before sorting (OrderBy) and projecting (Select)',
                'Use .Include() for eager loading to avoid N+1 queries',
                'Materialize once, read many — ToList() then work with the list',
                'Use AsSplitQuery() for complex includes to avoid cartesian explosion',
                'Profile with EF Core logging or .ToQueryString() to see generated SQL'
            ],
            commonMistakes: [
                'Calling ToList() before Where (loads entire table into memory)',
                'Multiple enumeration of IQueryable (multiple database round-trips)',
                'Not using projection (Select) — loading entire entity when only 2 columns needed',
                'Ignoring EF Core client-evaluation warnings in development'
            ],
            interviewTip: 'Show a concrete example of bad LINQ → SQL and good LINQ → SQL. Mention tools: EF Core logging, MiniProfiler, .ToQueryString(). Senior engineers profile their LINQ, not just write it.',
            followUp: ['What is the N+1 problem?', 'How does AsSplitQuery work?', 'When would you use raw SQL over LINQ?'],
            seniorPerspective: 'I add EF Core query logging to dev environments and review generated SQL during code review. 80% of production performance issues I\'ve seen trace back to unoptimized LINQ-to-SQL.',
            architectPerspective: 'At scale, LINQ performance is a system concern. We enforce maximum query complexity through custom IQueryable interceptors and use read replicas for heavy reporting queries that would otherwise impact OLTP workloads.'
        },
        {
            question: 'How do GroupBy and Join work in LINQ, and how do they translate differently for in-memory versus EF Core?',
            difficulty: 'hard',
            answer: `<p><code>GroupBy</code> organizes elements into <code>IGrouping&lt;TKey, TElement&gt;</code> buckets by key; <code>Join</code> performs an inner equijoin between two sequences on matching keys. <strong>In memory (LINQ-to-Objects)</strong> both build a <strong>hash lookup</strong> and are <strong>non-streaming</strong> (they buffer the inner/grouped data). <strong>In EF Core (LINQ-to-SQL)</strong> they translate to SQL <code>GROUP BY</code> and <code>JOIN</code>, executed by the database engine.</p>`,
            explanation: `GroupBy is sorting mail into labeled pigeonholes; you must see most of the mail before the holes are meaningful. Join is matching two stacks of cards by a shared number. In memory you do this by hand with a hash index; in EF Core you hand both stacks to the database and let it match.`,
            code: `// GroupBy in memory: buffers items into hash buckets (non-streaming)
var byDept = employees
    .GroupBy(e => e.Department)
    .Select(g => new { Dept = g.Key, Count = g.Count(), Avg = g.Average(e => e.Salary) });

// Join in memory: builds a hash lookup of the inner sequence, then probes
var rows = orders.Join(
    customers,
    o => o.CustomerId,   // outer key
    c => c.Id,           // inner key
    (o, c) => new { c.Name, o.Total });

// EF Core: SAME LINQ -> server-side SQL
var report = await db.Orders
    .GroupBy(o => o.CustomerId)
    .Select(g => new { CustomerId = g.Key, Total = g.Sum(o => o.Amount) })
    .ToListAsync();
// Translates to: SELECT CustomerId, SUM(Amount) FROM Orders GROUP BY CustomerId

// CAUTION: a GroupBy that selects whole groups can force client evaluation
// or N extra queries. Project to aggregates in the Select to keep it in SQL:
//   GOOD: .GroupBy(k).Select(g => new { g.Key, Sum = g.Sum(x => x.V) })
//   RISKY: .GroupBy(k).ToList() then iterate groups -> may pull all rows

// Left join in method syntax (GroupJoin + SelectMany + DefaultIfEmpty):
var withOrders = customers
    .GroupJoin(orders, c => c.Id, o => o.CustomerId, (c, os) => new { c, os })
    .SelectMany(x => x.os.DefaultIfEmpty(), (x, o) => new { x.c.Name, OrderId = o?.Id });`,
            language: 'csharp',
            bestPractices: [
                'Project GroupBy results to aggregates in Select so EF Core keeps it in SQL',
                'Verify generated SQL with ToQueryString to confirm server-side grouping',
                'Prefer Join over nested Where lookups for clarity and hash-based efficiency',
                'Use GroupJoin + DefaultIfEmpty for left outer joins'
            ],
            commonMistakes: [
                'Assuming GroupBy streams; it buffers and is non-deferred in execution effect',
                'Selecting whole groups in EF Core, triggering client evaluation or extra queries',
                'Forgetting that LINQ Join is an inner join (no unmatched rows)',
                'Grouping in memory after ToList when the database could have done it'
            ],
            interviewTip: 'Highlight the two execution models: in-memory GroupBy/Join build hash structures and buffer data, while EF Core pushes GROUP BY/JOIN to SQL. The senior nuance is keeping GroupBy projections aggregate-only so EF Core does not fall back to client evaluation.',
            followUp: ['Why is GroupBy non-streaming?', 'How does GroupJoin produce a left outer join?', 'When does EF Core GroupBy fall back to client evaluation?'],
            seniorPerspective: `When a GroupBy is slow in EF Core, I check ToQueryString first — often the projection pulled whole groups client-side. Reshaping the Select to return only aggregates pushes the work back to the database and fixes it.`,
            architectPerspective: `Grouping and joining belong on the database for large data sets — the engine has indexes and set-based operators. We reserve in-memory GroupBy/Join for small, already-materialized collections, keeping heavy aggregation in SQL or read replicas.`
        },
        {
            question: 'What are the most dangerous pitfalls of LINQ deferred execution, and how do you guard against them in production code?',
            difficulty: 'hard',
            answer: `<p>Deferred execution means a LINQ query is just a <em>description</em> — it executes every time you enumerate it. The most dangerous pitfalls are:</p>
            <ul>
                <li><strong>Multiple enumeration</strong> — iterating the same IEnumerable twice re-executes the source (two database queries, two HTTP calls, or re-computation). ReSharper/Rider warns about this.</li>
                <li><strong>Captured variable mutation</strong> — a Where clause closes over a variable that changes before enumeration, producing unexpected results.</li>
                <li><strong>Disposed resource</strong> — returning an IEnumerable from a method that owns a disposable (DbConnection, Stream). The resource is disposed before the caller enumerates.</li>
                <li><strong>Side-effect accumulation</strong> — chaining operations with side effects (logging, counters) in deferred queries that may or may not execute, or execute multiple times.</li>
            </ul>
            <p>The guard pattern is simple: <strong>materialize early</strong> (ToList/ToArray) when the query crosses a boundary (method return, async gap, shared variable), and keep deferred chains within a single, localized scope.</p>`,
            explanation: 'A deferred LINQ query is like writing a recipe card, not cooking the meal. If the fridge (data source) is empty when someone finally reads the card, or they read it twice ordering double ingredients, you get surprises.',
            code: `// PITFALL 1: Multiple enumeration (two DB queries!)
IEnumerable<Order> orders = db.Orders.Where(o => o.Status == "Pending");
var count = orders.Count();       // Query 1
var list = orders.ToList();       // Query 2 — data may differ!
// FIX: materialize once
var orders = db.Orders.Where(o => o.Status == "Pending").ToList();
var count = orders.Count; // just reads .Count property, no query

// PITFALL 2: Captured variable mutation
var status = "Active";
var query = users.Where(u => u.Status == status); // captures 'status'
status = "Inactive"; // mutation BEFORE enumeration
var results = query.ToList(); // filters by "Inactive", not "Active"!

// PITFALL 3: Disposed resource before enumeration
public IEnumerable<User> GetUsers() {
    using var conn = new SqlConnection(cs);
    conn.Open();
    return conn.Query<User>("SELECT * FROM Users"); // DEFERRED!
    // conn.Dispose() runs here — enumeration will fail
}
// FIX: materialize inside the using scope
public IReadOnlyList<User> GetUsers() {
    using var conn = new SqlConnection(cs);
    return conn.Query<User>("SELECT * FROM Users").ToList(); // immediate
}

// PITFALL 4: Side effects in deferred chains
var processed = items.Select(i => { Log(i); return Transform(i); });
// If nobody enumerates 'processed', nothing is logged!
// If enumerated twice, everything is logged/transformed TWICE!`,
            language: 'csharp',
            bestPractices: [
                'Materialize (ToList/ToArray) before returning IEnumerable from methods that own resources',
                'Use ReSharper/Rider "possible multiple enumeration" warnings as a guide',
                'Keep deferred chains localized — do not pass them across method/async boundaries',
                'Never put side effects inside Select/Where lambdas on deferred queries',
                'Use IReadOnlyList<T> as return type to signal materialization to callers'
            ],
            commonMistakes: [
                'Returning a deferred IEnumerable from a using block (disposed resource on enumeration)',
                'Enumerating the same IQueryable multiple times, causing multiple database round-trips',
                'Closing over a loop variable that changes before enumeration',
                'Assuming Count() is free on IEnumerable (it must enumerate everything unless ICollection)'
            ],
            interviewTip: 'Walk through the three classic traps (multiple enumeration, captured variable, disposed resource) with code. Show you materialize defensively at boundaries and understand that deferred is safe only within a controlled scope.',
            followUp: ['How does ReSharper detect multiple enumeration?', 'What is the difference between IQueryable deferred execution and IEnumerable deferred execution?', 'How does async/await interact with deferred LINQ queries?']
        },
        {
            question: 'When does LINQ underperform a plain foreach loop, and how do you decide which to use in performance-critical code?',
            difficulty: 'hard',
            answer: `<p>LINQ incurs overhead that a hand-written foreach avoids: <strong>delegate allocation</strong> (lambda closures), <strong>iterator state machines</strong> (each chained operator is a new IEnumerator), <strong>virtual dispatch</strong> (MoveNext/Current through interfaces), and <strong>inability to use Span/stackalloc</strong> (LINQ works on IEnumerable, not Span).</p>
            <p>For most business code the difference is negligible — readability wins. But in <strong>hot paths</strong> (tight loops called millions of times, real-time processing, game loops), LINQ can be 2-10x slower due to these overheads. The JIT cannot inline through delegate calls and enumerator interfaces as effectively as it can optimize a simple for loop with array bounds checking elimination.</p>
            <p>Decision framework: Use LINQ by default for clarity. Switch to foreach/for when a profiler shows the LINQ chain is a measurable bottleneck in allocation rate or CPU time. Never pre-optimize — always measure first.</p>`,
            explanation: 'LINQ is like giving assembly-line instructions through a translator (delegates + iterators). A foreach loop is doing the work directly with your own hands — faster when speed matters, but less descriptive.',
            code: `// BENCHMARK COMPARISON (BenchmarkDotNet results typical):
// LINQ version — clear, expressive, ~3-5x slower in hot path:
public int LinqSum(int[] data)
    => data.Where(x => x > 0).Select(x => x * 2).Sum();
// Allocates: Where enumerator + Select enumerator + closure (if captured)
// Virtual dispatch: MoveNext() through IEnumerator<int> interface

// Manual foreach — optimal for hot paths:
public int ManualSum(int[] data)
{
    int sum = 0;
    for (int i = 0; i < data.Length; i++) // bounds-check eliminated by JIT
    {
        if (data[i] > 0)
            sum += data[i] * 2;
    }
    return sum;
}
// Zero allocations, no virtual dispatch, JIT can vectorize (SIMD)

// SPAN + SIMD — ultimate performance:
public int SimdSum(ReadOnlySpan<int> data)
{
    var sum = Vector<int>.Zero;
    int i = 0;
    for (; i <= data.Length - Vector<int>.Count; i += Vector<int>.Count)
    {
        var vec = new Vector<int>(data.Slice(i, Vector<int>.Count));
        var mask = Vector.GreaterThan(vec, Vector<int>.Zero);
        sum += Vector.BitwiseAnd(vec * new Vector<int>(2), mask);
    }
    // Handle remainder...
    return Vector.Sum(sum);
}

// DECISION MATRIX:
// Business logic, low frequency → LINQ (readability wins)
// Hot path identified by profiler → foreach/for (measure first!)
// Extreme perf (parsers, codecs) → Span + SIMD
// Compromise: LinqGen or StructLinq for zero-alloc LINQ syntax`,
            language: 'csharp',
            bestPractices: [
                'Default to LINQ for readability — optimize only when profiler identifies a bottleneck',
                'Use BenchmarkDotNet with [MemoryDiagnoser] to compare LINQ vs manual loops',
                'In hot paths, prefer for over foreach for arrays (enables bounds-check elimination)',
                'Consider StructLinq or LinqGen for zero-allocation LINQ-like syntax in critical paths',
                'Profile allocation rate (Gen 0 collections/sec) as the primary LINQ overhead signal'
            ],
            commonMistakes: [
                'Pre-optimizing all LINQ to foreach without profiling (premature optimization)',
                'Assuming LINQ is always slow — for cold paths the overhead is immeasurable',
                'Chaining many LINQ operators in a hot loop without realizing each adds an enumerator allocation',
                'Not considering that EF Core LINQ translates to SQL — the overhead is the DB, not LINQ iteration'
            ],
            interviewTip: 'Show maturity: say LINQ is your default for clarity, but you know WHERE and WHY it costs (delegate alloc, enumerator overhead, virtual dispatch). Mention BenchmarkDotNet and that you only switch to manual loops with profiler evidence.',
            followUp: ['What is bounds-check elimination and why does for enable it over foreach?', 'How does StructLinq achieve zero-allocation LINQ?', 'What is the overhead of a lambda closure allocation?']
        },
        {
            question: 'What are the pitfalls of deferred execution with multiple enumeration — how do you detect it, what are the consequences with IQueryable, and what defensive materialization patterns should you use?',
            difficulty: 'hard',
            answer: `<p>Multiple enumeration occurs when an IEnumerable or IQueryable is iterated more than once — each enumeration re-executes the entire pipeline from scratch. For IQueryable (EF Core, Dapper), this means multiple database round-trips that may return different results if data changed between enumerations, creating subtle consistency bugs.</p>
            <p>Detection: ReSharper/Rider emit "Possible multiple enumeration of IEnumerable" warnings. BenchmarkDotNet with SQL logging reveals duplicate queries. The key signal is any code that calls .Count() and then .ToList() on the same IQueryable variable, or passes an IEnumerable to two different consumers.</p>
            <p>Defensive patterns: materialize at boundaries (ToList/ToArray before returning from repository methods), use IReadOnlyList<T> as return types to signal materialization, and scope deferred chains to a single method. For IQueryable specifically, call .ToListAsync() once and operate on the materialized list. Never return raw IQueryable from a service layer — it leaks persistence concerns and invites multiple enumeration.</p>`,
            explanation: 'Multiple enumeration is like re-running a recipe from scratch every time someone asks "what did you cook?" — you do all the work again and might get a different result if ingredients changed.',
            code: `// PROBLEM: Multiple enumeration of IQueryable
IQueryable<Order> pendingOrders = db.Orders.Where(o => o.Status == "Pending");
int count = pendingOrders.Count();     // SQL query #1
var list = pendingOrders.ToList();      // SQL query #2 (data may differ!)
var first = pendingOrders.FirstOrDefault(); // SQL query #3!

// FIX: Materialize once
var pendingOrders = await db.Orders
    .Where(o => o.Status == "Pending")
    .ToListAsync(); // Single query, results cached in memory
int count = pendingOrders.Count;       // Just reads List.Count property
var first = pendingOrders.FirstOrDefault(); // In-memory, no DB call

// PATTERN: Return IReadOnlyList to signal materialization
public async Task<IReadOnlyList<Order>> GetPendingOrdersAsync()
{
    return await _db.Orders
        .Where(o => o.Status == "Pending")
        .ToListAsync(); // Materialized — callers can enumerate freely
}

// PATTERN: Guard against multiple enumeration in utility methods
public static T[] Materialize<T>(this IEnumerable<T> source)
{
    if (source is ICollection<T> collection)
    {
        var array = new T[collection.Count];
        collection.CopyTo(array, 0);
        return array;
    }
    return source.ToArray(); // Only materializes if not already
}`,
            language: 'csharp',
            bestPractices: [
                'Always materialize IQueryable results before leaving the repository/data layer',
                'Use IReadOnlyList<T> as return types to communicate that the data is already materialized',
                'Enable ReSharper/Rider "multiple enumeration" inspection as an error, not warning',
                'Never pass raw IQueryable across layer boundaries (leaks persistence concerns)',
                'Materialize before branching logic that will consume the data multiple ways'
            ],
            commonMistakes: [
                'Calling .Count() then .ToList() on the same IQueryable (two database queries)',
                'Returning IEnumerable from a using block where the resource is disposed before enumeration',
                'Assuming IEnumerable is "cheap" to enumerate twice (it re-executes the full pipeline)',
                'Not materializing before passing to methods that enumerate internally (logging, serialization)'
            ],
            interviewTip: 'Walk through a concrete IQueryable example with EF Core showing TWO SQL queries hit the database for the same "logical" data. Then show the one-line fix (ToListAsync). Mention ReSharper detection and IReadOnlyList as the return-type signal.',
            followUp: ['How does AsNoTracking interact with materialization patterns?', 'What is the difference between IQueryable deferred execution and IEnumerable deferred execution?', 'How does async streaming (IAsyncEnumerable) change materialization decisions?']
        },
        {
            question: 'How do Expression trees differ from delegates at the IL level? When does EF Core require expressions instead of delegates, and how do you build dynamic queries with Expression<Func<T, bool>>?',
            difficulty: 'advanced',
            answer: `<p>A <strong>delegate</strong> (Func<T, bool>) is compiled IL code — an opaque pointer to executable instructions. An <strong>Expression tree</strong> (Expression<Func<T, bool>>) is a data structure (AST) that represents the code as inspectable, modifiable nodes. The compiler emits different IL: for a lambda assigned to Func, it emits native method code; for Expression, it emits calls to Expression.Lambda, Expression.Parameter, Expression.Property, etc., building a tree at runtime.</p>
            <p>EF Core requires Expression trees because it needs to INSPECT the query logic to translate it into SQL. If you pass a Func<T, bool> to .Where(), EF cannot see inside — it would have to load ALL rows into memory and filter client-side. With Expression<Func<T, bool>>, EF walks the AST, recognizes Property == Value nodes, and generates WHERE clauses in SQL.</p>
            <p>Dynamic query building: compose Expression trees programmatically using Expression.AndAlso/OrElse to combine predicates, or use libraries like LinqKit (PredicateBuilder) or the built-in ExpressionVisitor to rewrite trees. This enables search filters, dynamic sorting, and multi-tenant query decoration without string-based SQL.</p>`,
            explanation: 'A delegate is a sealed envelope containing instructions — you can execute them but cannot read them. An Expression tree is an open blueprint — you can read every step, translate it to another language (SQL), or modify it before execution.',
            code: `// Delegate — compiled IL, opaque:
Func<Order, bool> funcFilter = o => o.Total > 100;
// EF cannot translate this to SQL — evaluates client-side!

// Expression — inspectable AST:
Expression<Func<Order, bool>> exprFilter = o => o.Total > 100;
// EF reads the tree: MemberAccess(Total) > Constant(100) → "WHERE Total > 100"

// Building dynamic queries with Expression trees:
public static Expression<Func<T, bool>> BuildFilter<T>(
    string propertyName, object value)
{
    var param = Expression.Parameter(typeof(T), "x");
    var property = Expression.Property(param, propertyName);
    var constant = Expression.Constant(value);
    var equality = Expression.Equal(property, constant);
    return Expression.Lambda<Func<T, bool>>(equality, param);
}
// Usage: var filter = BuildFilter<Order>("Status", "Pending");
// db.Orders.Where(filter) → SELECT * FROM Orders WHERE Status = 'Pending'

// Combining expressions (PredicateBuilder pattern):
public static Expression<Func<T, bool>> And<T>(
    this Expression<Func<T, bool>> left,
    Expression<Func<T, bool>> right)
{
    var param = Expression.Parameter(typeof(T));
    var body = Expression.AndAlso(
        Expression.Invoke(left, param),
        Expression.Invoke(right, param));
    return Expression.Lambda<Func<T, bool>>(body, param);
}`,
            language: 'csharp',
            bestPractices: [
                'Always use Expression<Func<T,bool>> for EF Core/IQueryable predicates to ensure server-side execution',
                'Use PredicateBuilder (LinqKit) or custom combinators for dynamic multi-condition filters',
                'Cache compiled expressions (Compile()) if you need to reuse them as delegates in memory',
                'Use ExpressionVisitor to rewrite or decorate query trees (e.g., soft-delete, multi-tenancy)',
                'Test dynamic expressions by verifying the generated SQL (ToQueryString in EF Core)'
            ],
            commonMistakes: [
                'Passing Func<T,bool> to IQueryable.Where — causes silent client-side evaluation',
                'Building expressions with captured variables that prevent SQL translation',
                'Not parameterizing constants in dynamic expressions (prevents query plan caching)',
                'Over-engineering expression builders when simple .Where chaining suffices'
            ],
            interviewTip: 'The key insight is: delegates are executable code, expressions are DATA describing code. EF needs data it can translate. Show you understand both when EF silently falls back to client evaluation and how to build dynamic queries for real search/filter scenarios.',
            followUp: ['How does EF Core warn you about client-side evaluation?', 'What is an ExpressionVisitor and when would you write one?', 'How do you unit test Expression tree-based query builders?']
        }
    ]
});
