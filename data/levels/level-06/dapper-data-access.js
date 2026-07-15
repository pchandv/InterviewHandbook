/* ═══════════════════════════════════════════════════════════════════
   DAPPER & MICRO-ORMs — Level 6: SQL Server (Data Access)
   Dapper Query/Execute, parameterization, multi-mapping, when to
   choose a micro-ORM, and performance vs full ORMs.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('dapper-data-access', {

    title: 'Dapper & Micro-ORMs',
    level: 6,
    group: 'data-access',
    description: 'Dapper fundamentals: Query/Execute, parameterized queries, multi-mapping, multiple result sets, choosing a micro-ORM vs full ORM, performance vs EF Core, and SQL injection prevention.',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    prerequisites: ['sql-fundamentals', 'ef-core'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Dapper</strong> is a lightweight "micro-ORM" for .NET built by the Stack Overflow team. It maps
            the results of SQL queries to objects with minimal overhead, while leaving you in full control of the
            SQL. It is one of the fastest data access options short of raw ADO.NET.</p>
            <p>Unlike EF Core, Dapper has no change tracking, no migrations, and no LINQ-to-SQL translation — you
            write the SQL, Dapper handles the tedious parameter binding and object mapping. This makes it ideal for
            hot read paths and complex queries.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>Dapper's core methods: Query, QueryFirst, Execute, QueryMultiple</li>
                <li>Parameterized queries and why they prevent SQL injection</li>
                <li>Multi-mapping (joining related tables into object graphs)</li>
                <li>Multiple result sets in one round trip</li>
                <li>When a micro-ORM beats a full ORM — and when it doesn't</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Micro-ORM</h4>
            <p>A thin layer that maps query results to objects but leaves SQL authoring to you. No change tracking,
            no migrations, no query generation — just fast mapping. Dapper extends <code>IDbConnection</code> with
            extension methods.</p>
            <h4>Query&lt;T&gt;</h4>
            <p>Executes SQL and maps each row to an instance of T. Variants: <code>QueryFirst</code>,
            <code>QueryFirstOrDefault</code>, <code>QuerySingle</code> for single-row results.</p>
            <h4>Execute</h4>
            <p>Runs INSERT/UPDATE/DELETE or stored procedures, returning the affected row count.</p>
            <h4>Parameters</h4>
            <p>You pass an anonymous object; Dapper creates real SQL parameters (<code>@id</code>), which prevents
            SQL injection and enables plan caching.</p>
            <h4>Multi-Mapping</h4>
            <p>Splits a joined row across multiple objects (e.g., Order + Customer) using a splitOn column.</p>
            <h4>QueryMultiple</h4>
            <p>Executes a batch returning several result sets, read sequentially — one round trip for related data.</p>`,
            mermaid: `graph LR
    Code[Your C# code] -->|SQL + params| Dapper
    Dapper -->|parameterized command| Conn[IDbConnection]
    Conn --> DB[(SQL Server)]
    DB -->|rows| Mapper[Dapper row→object mapper]
    Mapper -->|POCOs| Code`
        },
        {
            title: 'How It Works',
            content: `<p>Dapper is a set of extension methods on <code>IDbConnection</code>. When you call
            <code>Query&lt;T&gt;</code>:</p>
            <ol>
                <li>Dapper builds a parameterized <code>DbCommand</code> from your SQL and parameter object</li>
                <li>It executes the command and reads the data reader</li>
                <li>It generates (and caches) an efficient IL mapper that sets each property from the matching column</li>
                <li>It returns strongly-typed objects</li>
            </ol>
            <p>The cached IL emitter is why Dapper is nearly as fast as hand-written ADO.NET — the per-row mapping
            cost is minimal after the first execution.</p>`,
            code: `using var conn = new SqlConnection(connectionString);

// Query: map rows to a POCO. Parameters are bound safely.
var customers = await conn.QueryAsync<Customer>(
    "SELECT Id, Name, Email FROM Customers WHERE City = @city",
    new { city = "London" });

// Single row
var customer = await conn.QueryFirstOrDefaultAsync<Customer>(
    "SELECT * FROM Customers WHERE Id = @id", new { id });

// Execute: returns affected rows
int rows = await conn.ExecuteAsync(
    "UPDATE Customers SET Email = @email WHERE Id = @id",
    new { email, id });`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Where Dapper sits relative to EF Core and ADO.NET:</p>`,
            mermaid: `graph TB
    App[Application code] --> EF[EF Core: full ORM<br/>tracking, migrations, LINQ]
    App --> Dapper[Dapper: micro-ORM<br/>you write SQL, it maps]
    App --> ADO[ADO.NET: raw<br/>manual command + reader]
    EF --> Provider[ADO.NET provider]
    Dapper --> Provider
    ADO --> Provider
    Provider --> DB[(Database)]
    style Dapper fill:#d1fae5,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Common Dapper patterns — multi-mapping, multiple result sets, and stored procedures:</p>`,
            tabs: [
                {
                    label: 'Multi-Mapping',
                    code: `// Map a JOINed row into Order + nested Customer
var sql = @"SELECT o.Id, o.Total, c.Id, c.Name
            FROM Orders o
            JOIN Customers c ON c.Id = o.CustomerId
            WHERE o.Id = @id";

var order = (await conn.QueryAsync<Order, Customer, Order>(
    sql,
    (o, c) => { o.Customer = c; return o; },
    new { id },
    splitOn: "Id"        // column where the Customer columns begin
)).FirstOrDefault();`,
                    language: 'csharp'
                },
                {
                    label: 'Multiple Result Sets',
                    code: `// One round trip, several result sets (avoids N queries)
var sql = @"SELECT * FROM Orders WHERE Id = @id;
            SELECT * FROM OrderLines WHERE OrderId = @id;
            SELECT * FROM Payments WHERE OrderId = @id;";

using var multi = await conn.QueryMultipleAsync(sql, new { id });
var order   = await multi.ReadFirstAsync<Order>();
var lines   = (await multi.ReadAsync<OrderLine>()).ToList();
var payments= (await multi.ReadAsync<Payment>()).ToList();
order.Lines = lines;
order.Payments = payments;`,
                    language: 'csharp'
                },
                {
                    label: 'Stored Procedure',
                    code: `// Call a stored procedure with parameters and an output param
var p = new DynamicParameters();
p.Add("@CustomerId", customerId);
p.Add("@NewOrderId", dbType: DbType.Int32, direction: ParameterDirection.Output);

await conn.ExecuteAsync("usp_CreateOrder", p,
    commandType: CommandType.StoredProcedure);

int newId = p.Get<int>("@NewOrderId");`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Always Parameterize</h4>
            <p>Pass values as parameters (<code>@id</code> + anonymous object). Never concatenate user input into SQL
            — that is the SQL injection door.</p>
            <h4>Do: Use Async Methods</h4>
            <p><code>QueryAsync</code>, <code>ExecuteAsync</code> free the thread during I/O for scalable apps.</p>
            <h4>Do: Let the Connection Pool Work</h4>
            <p>Open a connection per operation inside a <code>using</code>; ADO.NET pools the underlying connections.
            Don't cache open connections.</p>
            <h4>Do: Use QueryMultiple to Batch</h4>
            <p>Fetch a parent and its children in one round trip instead of multiple calls.</p>
            <h4>Do: Map to DTOs/Records</h4>
            <p>Project query results into simple POCOs/records that match your read model.</p>`,
            callout: {
                type: 'tip',
                title: 'Parameters Are Not Optional',
                text: 'Parameterized queries do two jobs: they make SQL injection impossible (values are never parsed as SQL) and they let the database cache and reuse execution plans. String concatenation loses both \u2014 never do it.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: String-Concatenating SQL</h4>
            <p><code>"... WHERE Name = '" + name + "'"</code> is a SQL injection vulnerability and breaks plan
            caching. Always use parameters.</p>
            <h4>Mistake: Wrong splitOn in Multi-Mapping</h4>
            <p>If <code>splitOn</code> doesn't match where the next object's columns begin, mapping silently
            misaligns. Order columns deliberately and set splitOn correctly.</p>
            <h4>Mistake: SELECT * Then Mapping Mismatch</h4>
            <p>Relying on <code>SELECT *</code> couples mapping to column order/names. Select explicit columns that
            match your POCO.</p>
            <h4>Mistake: Treating Dapper Like an ORM</h4>
            <p>Dapper won't track changes or save object graphs for you. You write each INSERT/UPDATE explicitly.
            Expecting EF-style behavior leads to bugs.</p>
            <h4>Mistake: Not Disposing Connections/Readers</h4>
            <p>Leaking connections exhausts the pool. Use <code>using</code> on connections and QueryMultiple
            readers.</p>`,
            code: `// VULNERABLE: SQL injection + no plan caching
var bad = await conn.QueryAsync<User>(
    "SELECT * FROM Users WHERE Name = '" + name + "'");   // NEVER do this

// SAFE: parameterized
var good = await conn.QueryAsync<User>(
    "SELECT Id, Name, Email FROM Users WHERE Name = @name",
    new { name });`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>High-Throughput Read APIs</h4>
            <p>Stack Overflow itself uses Dapper to serve enormous read traffic with minimal overhead. It is the
            go-to for read-heavy endpoints where EF's machinery is unnecessary.</p>
            <h4>Reporting &amp; Analytics</h4>
            <p>Complex SQL (window functions, CTEs, pivots) that doesn't map cleanly to LINQ is natural in Dapper —
            you write the exact query and map the rows.</p>
            <h4>CQRS Read Side</h4>
            <p>In CQRS, the query side often uses Dapper for fast, denormalized reads while the command side uses
            EF Core for domain writes.</p>
            <h4>Legacy Database Integration</h4>
            <p>When working with existing stored procedures or schemas that don't fit an ORM model, Dapper maps
            their output without forcing an entity model.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Dapper vs EF Core vs raw ADO.NET:</p>`,
            table: {
                headers: ['Aspect', 'Dapper', 'EF Core', 'ADO.NET'],
                rows: [
                    ['Type', 'Micro-ORM', 'Full ORM', 'Raw data access'],
                    ['SQL authoring', 'You write it', 'Generated (overridable)', 'You write it'],
                    ['Object mapping', 'Automatic', 'Automatic', 'Manual'],
                    ['Change tracking', 'No', 'Yes', 'No'],
                    ['Migrations', 'No', 'Yes', 'No'],
                    ['Performance', 'Near-raw', 'Good', 'Fastest'],
                    ['Boilerplate', 'Low', 'Lowest (CRUD)', 'High'],
                    ['Best for', 'Hot reads, complex SQL', 'Domain CRUD', 'Full control / drivers']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Dapper is prized for speed — close to hand-written ADO.NET:</p>
            <h4>Why It's Fast</h4>
            <ul>
                <li>No change tracker, no LINQ translation overhead</li>
                <li>Cached IL-emitted mappers convert rows to objects with minimal per-row cost</li>
                <li>You control the exact SQL, indexes, and shape of the result</li>
            </ul>
            <h4>Performance Tips</h4>
            <ul>
                <li>Select only needed columns (avoid SELECT *)</li>
                <li>Use <code>buffered: false</code> for very large result sets to stream rows</li>
                <li>Batch related reads with QueryMultiple to cut round trips</li>
                <li>Ensure proper indexes — Dapper won't save you from a bad query plan</li>
            </ul>
            <h4>Reality Check</h4>
            <p>For most apps, EF Core is fast enough; Dapper's edge matters on genuinely hot paths. Profile to
            confirm a query is a bottleneck before switching.</p>`,
            callout: {
                type: 'info',
                title: 'Dapper Won\u2019t Fix Bad SQL',
                text: 'Dapper makes mapping fast, but the database does the real work. A missing index or a poorly-written query will be slow regardless of the ORM. Optimize the SQL and indexes first; the micro-ORM only removes mapping overhead.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Because you write raw SQL, integration tests against a real database are especially valuable.</p>
            <h4>Integration Tests with Testcontainers</h4>
            <p>Spin up a real SQL Server/PostgreSQL container, run your schema, and execute your Dapper queries —
            verifying the SQL is correct and the mapping aligns with columns.</p>
            <h4>Abstract Behind an Interface</h4>
            <p>Wrap Dapper calls in a repository interface so consuming code can be unit-tested with a fake, while
            the repository itself is integration-tested.</p>`,
            code: `public interface IOrderQueries
{
    Task<OrderDto?> GetByIdAsync(int id);
}

public class DapperOrderQueries : IOrderQueries
{
    private readonly string _cs;
    public DapperOrderQueries(string cs) => _cs = cs;

    public async Task<OrderDto?> GetByIdAsync(int id)
    {
        using var conn = new SqlConnection(_cs);
        return await conn.QueryFirstOrDefaultAsync<OrderDto>(
            "SELECT Id, Total, Status FROM Orders WHERE Id = @id", new { id });
    }
}

// Integration test runs DapperOrderQueries against a Testcontainers DB;
// consuming services are unit-tested with a fake IOrderQueries.`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Dapper questions probe your understanding of the ORM trade-off spectrum:</p>
            <ul>
                <li><strong>Explain micro-ORM vs full ORM</strong> — Dapper maps; EF Core also tracks and migrates</li>
                <li><strong>Stress parameterization</strong> — the SQL injection answer interviewers want to hear</li>
                <li><strong>Know when to choose Dapper</strong> — hot reads, complex SQL, CQRS read side</li>
                <li><strong>Acknowledge the trade-off</strong> — you give up productivity features for speed/control</li>
                <li><strong>Mention combining both</strong> — EF for writes, Dapper for hot reads is a mature pattern</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Pragmatic Answer',
                text: 'The strongest interview answer is not "Dapper is faster so use it" \u2014 it is "I default to EF Core for productivity and use Dapper for the specific hot read paths a profiler identifies, often in the same codebase." That shows judgment over dogma.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Docs &amp; Source</h4>
            <ul>
                <li>Dapper GitHub: github.com/DapperLib/Dapper</li>
                <li>Dapper tutorial: dappertutorial.net</li>
            </ul>
            <h4>Articles</h4>
            <ul>
                <li>Stack Overflow architecture posts (how they use Dapper at scale)</li>
                <li>Microsoft data access guidance comparing EF Core and Dapper</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Dapper is a micro-ORM:</strong> you write SQL, it maps rows to objects fast</li>
                <li><strong>No change tracking or migrations</strong> — you control every INSERT/UPDATE</li>
                <li><strong>Always parameterize</strong> — prevents SQL injection and enables plan caching</li>
                <li><strong>Multi-mapping + QueryMultiple</strong> efficiently load related data in fewer round trips</li>
                <li><strong>Performance is near-raw ADO.NET</strong> thanks to cached IL mappers</li>
                <li><strong>Choose Dapper for hot reads/complex SQL;</strong> EF Core for domain CRUD</li>
                <li><strong>Combine both</strong> — a common, pragmatic production pattern</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Build a Dapper Query Repository</h4>
            <ol>
                <li>Create an IProductQueries interface with GetById, Search(filter, page), and GetWithCategory</li>
                <li>Implement it with Dapper, using parameterized queries throughout</li>
                <li>Implement GetWithCategory using multi-mapping (Product + Category)</li>
                <li>Add a GetProductWithReviews using QueryMultiple (product + its reviews in one round trip)</li>
                <li>Write one integration test (Testcontainers) verifying the multi-mapping aligns correctly</li>
                <li>Deliberately try a string-concatenated query, then fix it — note the injection risk</li>
            </ol>`,
            code: `public interface IProductQueries
{
    Task<ProductDto?> GetByIdAsync(int id);
    Task<IReadOnlyList<ProductDto>> SearchAsync(string term, int page, int size);
    Task<ProductDto?> GetWithCategoryAsync(int id);     // multi-mapping
    Task<ProductDto?> GetWithReviewsAsync(int id);      // QueryMultiple
}

// TODO: implement with parameterized Dapper queries + an integration test`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What is a micro-ORM and how does Dapper differ from EF Core?<br/>
                    <em>A: A micro-ORM maps query results to objects but leaves SQL authoring to you. Dapper has no change
                    tracking, migrations, or LINQ translation; EF Core provides all three. Dapper trades features for
                    speed and control.</em></li>
                <li><strong>Q:</strong> Why must you use parameterized queries?<br/>
                    <em>A: To prevent SQL injection (values are sent as parameters, never parsed as SQL) and to enable the
                    database to cache and reuse execution plans.</em></li>
                <li><strong>Q:</strong> What does QueryMultiple let you do?<br/>
                    <em>A: Execute several SELECTs in one command/round trip and read each result set sequentially \u2014 e.g.,
                    fetch an order plus its lines and payments together.</em></li>
                <li><strong>Q:</strong> When would you use Dapper instead of EF Core?<br/>
                    <em>A: For hot read paths needing minimal overhead, complex SQL hard to express in LINQ, or the read
                    side of CQRS \u2014 while often still using EF Core for writes/migrations.</em></li>
            </ol>`
        }
    ],
    questions: [
        {"question":"What is Dapper, and when would you choose it over a full ORM like EF Core?","difficulty":"medium","answer":"<p><strong>Dapper</strong> is a lightweight micro-ORM: it maps the results of raw SQL queries to objects with minimal overhead, but you write the SQL yourself and it does not do change tracking, migrations, or LINQ-to-SQL translation.</p><p>Choose Dapper for <strong>read-heavy, performance-critical</strong> paths, complex hand-tuned queries, and reporting where you want full control and near-raw-ADO.NET speed. Choose <strong>EF Core</strong> for rich domain models, CRUD with change tracking, migrations, and developer productivity. Many systems use both: EF for writes/domain, Dapper for hot read queries.</p>","explanation":"Dapper is a manual transmission car — you shift the gears (write SQL) for maximum control and speed. EF Core is an automatic — more convenient for everyday driving, with features that handle the shifting for you.","bestPractices":["Use Dapper for hot read paths and hand-tuned queries","Use EF Core for domain CRUD, tracking, migrations","Combine both where each fits"],"commonMistakes":["Using Dapper but concatenating SQL (injection risk)","Expecting change tracking/migrations from Dapper","Forcing EF for a perf-critical query it cannot optimize"],"interviewTip":"Frame it as control/speed (Dapper) vs productivity/features (EF), and note the common hybrid approach.","followUp":["How does Dapper compare to raw ADO.NET?","How do you map multiple result sets in Dapper?","How do you avoid SQL injection in Dapper?"]},
        {"question":"How do you prevent SQL injection when writing queries with Dapper?","difficulty":"medium","answer":"<p>Because Dapper uses raw SQL, injection prevention is on you — but Dapper makes the safe path easy: always use <strong>parameterized queries</strong>, passing user input as parameters (an anonymous object), never string-concatenating input into the SQL. Dapper sends the values as bound DB parameters, so they are treated as data, not executable SQL.</p><p>Additional measures: validate/whitelist anything that cannot be parameterized (like a dynamic column or table name — never interpolate raw user input there), and use least-privilege DB accounts. The one rule: user input goes in parameters, never into the SQL string.</p>","code":"// SAFE: value is a bound parameter, not part of the SQL text\nvar user = conn.QuerySingleOrDefault<User>(\n    \"SELECT * FROM Users WHERE Email = @Email\", new { Email = input });\n\n// UNSAFE (never do this): string concatenation of user input\n// conn.Query($\"SELECT * FROM Users WHERE Email = '{input}'\");","language":"csharp","explanation":"Parameterization is handing the database your input in a sealed labeled envelope (\"this is a value\") instead of writing it directly into the instructions, where a clever input could rewrite the command.","bestPractices":["Always pass user input as parameters","Whitelist dynamic identifiers (columns/tables) — never interpolate them","Use least-privilege database accounts"],"commonMistakes":["String-concatenating/interpolating user input into SQL","Parameterizing values but interpolating a user-supplied column name","Over-privileged DB credentials amplifying an injection"],"interviewTip":"One rule to state clearly: values go in parameters, never in the SQL string; whitelist the rare dynamic identifier cases. Give the safe vs unsafe snippet.","followUp":["How do you safely handle a dynamic ORDER BY column?","Why does parameterization stop injection?","How does least privilege limit blast radius?"]},
        {
            question: 'What is Dapper and how does it differ from a full ORM like EF Core?',
            difficulty: 'easy',
            answer: `<p><strong>Dapper</strong> is a micro-ORM: a thin library that executes the SQL you write and maps the
            resulting rows to C# objects with very little overhead. It does <em>not</em> track changes, generate SQL
            from LINQ, or manage migrations — those are EF Core's jobs.</p>
            <p>The trade-off: Dapper gives you speed and full SQL control at the cost of the productivity features
            (change tracking, migrations, query generation) that EF Core provides.</p>`,
            explanation: 'EF Core is a full-service kitchen that plans the menu, cooks, and cleans up. Dapper is a sharp knife — extremely fast and precise, but you do the cooking (write the SQL) yourself.',
            bestPractices: ['Use Dapper for hot reads and complex SQL', 'Always parameterize queries', 'Map to simple POCOs/records'],
            commonMistakes: ['Expecting Dapper to track or save object graphs', 'Concatenating SQL strings'],
            interviewTip: 'Define "micro-ORM" explicitly and name the three things Dapper does NOT do (tracking, migrations, LINQ-to-SQL).',
            followUp: ['When would you prefer EF Core?', 'How does Dapper achieve its performance?']
        },
        {
            question: 'How does Dapper protect against SQL injection, and what mistake breaks that protection?',
            difficulty: 'medium',
            answer: `<p>Dapper protects against SQL injection through <strong>parameterized queries</strong>. When you
            write <code>WHERE Id = @id</code> and pass <code>new { id }</code>, Dapper creates a real SQL parameter.
            The value is sent separately from the SQL text and is never parsed as code, so malicious input cannot
            alter the query structure.</p>
            <p>The mistake that breaks this is <strong>string concatenation</strong> — building SQL by gluing user
            input into the query text (<code>"... = '" + input + "'"</code>). That input becomes part of the SQL and
            can inject arbitrary commands. It also defeats execution-plan caching.</p>`,
            explanation: 'Parameters are like filling in a form with labeled boxes — the database knows "this is a value" and never treats it as an instruction. Concatenation is like letting someone write directly into the instructions, where they can sneak in commands.',
            code: `// VULNERABLE
conn.Query<User>("SELECT * FROM Users WHERE Name='" + name + "'");
// If name = "x'; DROP TABLE Users;--" -> disaster

// SAFE
conn.Query<User>("SELECT * FROM Users WHERE Name=@name", new { name });`,
            language: 'csharp',
            bestPractices: ['Parameterize every value, always', 'Never interpolate or concatenate user input into SQL', 'Validate/whitelist when dynamic SQL (e.g., column names) is unavoidable'],
            commonMistakes: ['String concatenation/interpolation of inputs', 'Assuming client-side validation makes injection impossible'],
            interviewTip: 'Show a concrete injection payload (the DROP TABLE example) — it demonstrates you understand the actual exploit, not just the rule.',
            followUp: ['How do you safely build dynamic column/table names?', 'How do parameters help execution plan reuse?']
        },
        {
            question: 'You profile an EF Core endpoint and find a read query is a hot bottleneck. Walk through how you would decide whether to move it to Dapper.',
            difficulty: 'hard',
            answer: `<p>I would not switch reflexively. My decision process:</p>
            <ol>
                <li><strong>Confirm the bottleneck:</strong> verify with profiling that this query (not something else)
                is the cost, and capture the actual generated SQL via EF logging.</li>
                <li><strong>Optimize within EF first:</strong> add AsNoTracking, project to a DTO with Select, fix N+1
                with Include/projection, add AsSplitQuery, ensure proper indexes. Often this closes the gap.</li>
                <li><strong>Check if SQL is the issue:</strong> if EF generates poor SQL or the query needs features
                LINQ handles badly (window functions, hints, CTEs), that favors Dapper or a raw SQL query.</li>
                <li><strong>Measure Dapper vs optimized EF:</strong> only adopt Dapper if it gives a meaningful,
                measured improvement that matters for the SLA.</li>
                <li><strong>Integrate cleanly:</strong> keep writes/domain on EF Core and add a Dapper query for this
                read, sharing the connection. Wrap it behind a query interface for testability.</li>
            </ol>`,
            explanation: 'It is like deciding whether to buy a race car for your commute. First confirm traffic (profiling) is really the problem, try tuning your current car (optimize EF), and only buy the race car (Dapper) if measurements prove it is worth the added complexity for that specific route.',
            bestPractices: ['Profile and read the generated SQL before changing anything', 'Exhaust EF optimizations (AsNoTracking, projection, indexes) first', 'Measure before/after; adopt Dapper only for proven wins', 'Keep EF for writes; isolate the Dapper read behind an interface'],
            commonMistakes: ['Rewriting in Dapper on a hunch without measuring', 'Ignoring missing indexes (the real culprit is often the DB, not the ORM)', 'Scattering raw SQL without abstraction, hurting testability'],
            interviewTip: 'Lead with "I would not switch reflexively" and show a measurement-driven process. Interviewers want disciplined engineering, not tool worship.',
            followUp: ['What EF Core optimizations would you try first?', 'How do you share a transaction between EF Core and Dapper?', 'How do you keep the Dapper query testable?'],
            seniorPerspective: 'Nine times out of ten the "EF is slow" complaint is actually a missing index, an N+1, or loading full entity graphs where a projection would do. I always read the generated SQL first. When I do reach for Dapper it is for a specific, profiled hot query \u2014 typically a reporting read with window functions \u2014 and I keep it behind a query interface so the rest of the app neither knows nor cares which tool served the data.'
        },
        {
            question: 'How does Dapper multi-mapping work, and what is the role of splitOn?',
            difficulty: 'medium',
            answer: `<p><strong>Multi-mapping</strong> lets Dapper split a single joined row across several objects and assemble them into a graph. You supply generic type arguments for each object plus a mapping function that wires them together (e.g., attach the <code>Customer</code> to the <code>Order</code>).</p>
            <p><strong>splitOn</strong> tells Dapper <em>where</em> in the column list one object ends and the next begins. Dapper reads columns left to right; when it hits the splitOn column name it starts populating the next type. The default splitOn is <code>"Id"</code>, so if your second table\'s key column is also named <code>Id</code>, mapping just works — but if columns are named differently or appear in an unexpected order, you must set splitOn explicitly or the mapping silently misaligns.</p>`,
            explanation: 'Multi-mapping is like receiving one long printed receipt that actually contains two sub-receipts taped together. splitOn is the dotted "cut here" line that tells you where the order details end and the customer details begin, so you can separate them into two clean records.',
            code: `// One JOINed row -> Order with a nested Customer
var sql = @"SELECT o.Id, o.Total, o.CustomerId,
                   c.Id, c.Name, c.Email
            FROM Orders o
            JOIN Customers c ON c.Id = o.CustomerId
            WHERE o.Id = @id";

var order = (await conn.QueryAsync<Order, Customer, Order>(
    sql,
    (o, c) => { o.Customer = c; return o; },
    new { id },
    splitOn: "Id"     // Customer columns begin at the SECOND 'Id'
)).FirstOrDefault();

// De-duplicating a one-to-many (Order with many Lines):
var lookup = new Dictionary<int, Order>();
await conn.QueryAsync<Order, OrderLine, Order>(
    @"SELECT o.Id, o.Total, l.Id, l.ProductId, l.Qty
      FROM Orders o JOIN OrderLines l ON l.OrderId = o.Id
      WHERE o.Id = @id",
    (o, line) =>
    {
        if (!lookup.TryGetValue(o.Id, out var current))
        { current = o; current.Lines = new(); lookup.Add(o.Id, current); }
        current.Lines.Add(line);
        return current;
    },
    new { id }, splitOn: "Id");
var result = lookup.Values.First();`,
            language: 'csharp',
            bestPractices: [
                'List columns in a deliberate order so each object\'s key marks a clean split point',
                'Set splitOn explicitly whenever the boundary column is not named Id',
                'De-duplicate one-to-many results with a dictionary keyed by the parent id',
                'Select explicit columns (not SELECT *) so the column order driving splitOn is stable'
            ],
            commonMistakes: [
                'Relying on the default splitOn = "Id" when the second key has a different name',
                'Column ordering that puts the split column in the wrong place, silently misaligning fields',
                'Forgetting that one-to-many multi-mapping returns duplicate parent rows to collapse',
                'Using SELECT * so a schema change reorders columns and breaks the mapping'
            ],
            interviewTip: 'Explain that Dapper reads columns left-to-right and splitOn marks where the next object starts. The classic gotcha: two tables both have an Id, default splitOn works; rename one and mapping breaks. Mention the dictionary pattern for collapsing one-to-many duplicates.',
            followUp: ['How do you handle a one-to-many in multi-mapping?', 'What happens if splitOn does not match a column?', 'Can you map more than two types in one query?'],
            seniorPerspective: 'I always order the SELECT so each entity\'s primary key sits right at its boundary and set splitOn explicitly even when the default would work — it documents intent and survives refactors. For one-to-many I collapse duplicates with a dictionary; if the graph gets deep, that is my signal to consider QueryMultiple instead.',
            architectPerspective: 'Multi-mapping is fine for small, well-defined graphs, but I keep the SQL and mapping behind a query interface so the shape is testable and the rest of the app depends on DTOs, not on Dapper mechanics. When graphs grow, I favor QueryMultiple or purpose-built read models over increasingly fragile splitOn chains.'
        },
        {
            question: 'When and how do you use QueryMultiple, and how does it handle parameters and stored procedures?',
            difficulty: 'hard',
            answer: `<p><strong>QueryMultiple</strong> executes a batch containing several SELECT statements (or a stored procedure returning multiple result sets) in <strong>one round trip</strong>, then lets you read each result set sequentially with <code>Read</code>/<code>ReadAsync</code>. It is the idiomatic way to fetch a parent and its related children together without N separate queries.</p>
            <p>Parameters are shared across all statements in the batch — pass them once. For stored procedures, set <code>commandType: CommandType.StoredProcedure</code> and use <code>DynamicParameters</code> for input, output, and return-value parameters.</p>
            <p>Read the grids strictly in the order the SELECTs appear, and dispose the <code>GridReader</code> with <code>using</code> to release the reader and connection promptly.</p>`,
            explanation: 'QueryMultiple is like asking a warehouse for everything about one order in a single request and getting back a stack of labeled trays — order header, line items, payments — that you unpack one tray at a time. One trip to the warehouse instead of three.',
            code: `// Parent + children in a single round trip
var sql = @"SELECT * FROM Orders     WHERE Id = @id;
            SELECT * FROM OrderLines WHERE OrderId = @id;
            SELECT * FROM Payments   WHERE OrderId = @id;";

using var grid = await conn.QueryMultipleAsync(sql, new { id });
var order    = await grid.ReadFirstAsync<Order>();
var lines    = (await grid.ReadAsync<OrderLine>()).ToList();
var payments = (await grid.ReadAsync<Payment>()).ToList();
order.Lines = lines;
order.Payments = payments;
// Read grids in the SAME ORDER as the SELECTs

// Stored procedure with output + return value via DynamicParameters
var p = new DynamicParameters();
p.Add("@CustomerId", customerId);
p.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);
p.Add("ret", dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);

using var grid2 = await conn.QueryMultipleAsync(
    "usp_GetCustomerDashboard", p,
    commandType: CommandType.StoredProcedure);

var recentOrders = (await grid2.ReadAsync<Order>()).ToList();
var topProducts  = (await grid2.ReadAsync<Product>()).ToList();
int totalCount   = p.Get<int>("@TotalCount");
int returnCode   = p.Get<int>("ret");`,
            language: 'csharp',
            bestPractices: [
                'Use QueryMultiple to batch a parent and its children into one round trip',
                'Read result grids in the exact order the SELECT statements appear',
                'Wrap the GridReader in using to release the reader and connection promptly',
                'Use DynamicParameters for output and return-value parameters with stored procedures'
            ],
            commonMistakes: [
                'Reading result sets out of order (each Read advances to the next grid)',
                'Reading output parameters before consuming all result sets (values populate after grids are read)',
                'Forgetting to dispose the GridReader, leaking the connection',
                'Issuing separate queries for related data when one QueryMultiple batch would suffice'
            ],
            interviewTip: 'Emphasize the single round trip and the strict read order. The subtle gotcha worth mentioning: output/return parameters are only populated after all result sets have been read, because the reader must finish before the parameters flush.',
            followUp: ['Why must output parameters be read after consuming all grids?', 'How does QueryMultiple compare to EF Core split queries?', 'What is the cost of not disposing the GridReader?'],
            seniorPerspective: 'For dashboard and detail screens I lean on QueryMultiple constantly — one round trip for the header plus several related collections beats a chain of awaits and keeps latency low. I always wrap the grid in using and read in declaration order; the output-parameter-after-grids rule has tripped up more than one teammate, so I call it out in reviews.',
            architectPerspective: 'QueryMultiple is the backbone of an efficient CQRS read side: a single stored procedure or batch returns a fully-shaped screen model in one trip, minimizing chattiness against the database. I standardize these as read-model queries behind interfaces so the command side (EF Core) and query side (Dapper batches) evolve independently.'
        },
        {
            question: 'What is the difference between buffered and unbuffered queries in Dapper, and when does it matter?',
            difficulty: 'advanced',
            answer: `<p>By default Dapper runs <strong>buffered</strong> queries: it reads the entire result set, materializes every row into a fully-populated <code>List&lt;T&gt;</code>, and closes the reader before returning. This is simple and safe — the connection is free immediately and you can enumerate the list repeatedly.</p>
            <p>With <code>buffered: false</code> the query is <strong>unbuffered</strong>: Dapper returns an <code>IEnumerable&lt;T&gt;</code> that <strong>streams</strong> rows from the open reader as you iterate. Only one row is in memory at a time, which is essential for very large result sets that would otherwise blow up memory — but the connection stays open and in use for the entire enumeration, and you can iterate only once.</p>
            <p>Use buffered (default) for ordinary result sets; use unbuffered for huge exports/streaming where memory is the constraint and you can consume the sequence immediately.</p>`,
            explanation: 'Buffered is having the whole pizza delivered to your table before you eat — convenient, but it all has to fit on the table (memory). Unbuffered is eating slice by slice straight off the conveyor belt: barely any table space needed, but the kitchen line (the connection) stays tied up until you finish, and you cannot go back for a slice you already passed.',
            code: `// Buffered (default): whole result set materialized into a List
var all = await conn.QueryAsync<Order>(
    "SELECT * FROM Orders WHERE Status = @s", new { s = "Open" });
// Connection is already free here; 'all' can be enumerated repeatedly

// Unbuffered: stream rows, one at a time, connection stays open
// NOTE: keep the connection open for the whole enumeration
using var conn2 = new SqlConnection(cs);
await conn2.OpenAsync();
var stream = conn2.Query<ExportRow>(
    new CommandDefinition(
        "SELECT * FROM HugeAuditTable",
        flags: CommandFlags.None,
        buffered: false));          // do NOT buffer 10M+ rows into memory

foreach (var row in stream)         // rows pulled from the reader lazily
{
    await writer.WriteLineAsync(row.ToCsv());
}
// Iterate only ONCE; connection is in use until the loop ends

// Rule of thumb:
// Normal/small-to-medium results -> buffered (default), simplest + safest
// Very large / streaming export   -> buffered:false to cap memory usage`,
            language: 'csharp',
            bestPractices: [
                'Keep the default buffered behavior for typical result sets',
                'Use buffered:false only for very large result sets where memory is the constraint',
                'Keep the connection open for the entire enumeration of an unbuffered query',
                'Consume an unbuffered sequence exactly once and stream it straight to the output'
            ],
            commonMistakes: [
                'Buffering millions of rows into a List and exhausting memory',
                'Using unbuffered queries but disposing/closing the connection before enumerating',
                'Trying to enumerate an unbuffered IEnumerable more than once',
                'Holding the connection open far longer than needed with unbuffered streaming under high concurrency'
            ],
            interviewTip: 'State the default (buffered) and the trade-off crisply: buffered frees the connection fast and allows re-enumeration but holds all rows in memory; unbuffered streams with minimal memory but pins the connection and is single-pass. Tie unbuffered to large-export scenarios.',
            followUp: ['Why must the connection stay open for an unbuffered query?', 'How does unbuffered streaming interact with connection pooling under load?', 'When would buffering actually improve throughput?'],
            seniorPerspective: 'I default to buffered everywhere because it releases the connection immediately and avoids subtle lifetime bugs. The only time I flip to buffered:false is a genuine large export streamed straight to a file or HTTP response, and then I am careful that the connection lives exactly as long as the enumeration and no longer.',
            architectPerspective: 'Buffering choice is a resource-contention decision at scale: unbuffered queries pin a pooled connection for the duration of consumption, so a few slow consumers can starve the pool. For high-volume exports I prefer streaming endpoints with bounded concurrency, or push large extracts to a dedicated reporting path so the OLTP connection pool is never held hostage.'
        }
    ]
});
