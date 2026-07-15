/* ═══════════════════════════════════════════════════════════════════
   DATABASE PERFORMANCE — Level 11: Performance (Advanced Performance)
   Query optimization, indexing, connection pooling, read replicas,
   sharding, and caching for data layer performance.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('database-perf', {

    title: 'Database Performance',
    level: 11,
    group: 'performance-advanced',
    description: 'Optimizing data layer performance: query tuning and execution plans, indexing strategy, connection pooling, read replicas, partitioning and sharding, and caching.',
    difficulty: 'advanced',
    estimatedMinutes: 45,
    prerequisites: ['sql-fundamentals', 'perf-caching'],

    sections: [

        {
            title: 'Introduction',
            content: `<p>For most applications, the <strong>database is the bottleneck</strong>. The application server
            is usually fast; it spends its time waiting on queries. Database performance work — proper indexing,
            efficient queries, connection management, and scaling reads — yields the biggest wins in real systems.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>How to read execution plans and find slow queries</li>
                <li>Indexing strategy: clustered, covering, composite</li>
                <li>Connection pooling and why it matters</li>
                <li>Read replicas and read/write splitting</li>
                <li>Partitioning and sharding for scale</li>
                <li>Caching to take load off the database</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Execution Plan</h4>
            <p>The database's chosen strategy to run a query (scans, seeks, joins, sorts). Reading it reveals why a
            query is slow — typically a table scan where an index seek was possible.</p>
            <h4>Indexes</h4>
            <p>Data structures (usually B-trees) that let the database find rows without scanning the whole table.
            A <strong>clustered</strong> index defines physical row order; <strong>non-clustered</strong> indexes
            point to rows; a <strong>covering</strong> index includes all columns a query needs so no lookup is
            required.</p>
            <h4>Connection Pooling</h4>
            <p>Opening a DB connection is expensive. A pool reuses a set of established connections across requests,
            avoiding per-request connection setup.</p>
            <h4>Read Replicas</h4>
            <p>Read-only copies of the primary database. Routing reads to replicas scales read-heavy workloads and
            offloads the primary, at the cost of replication lag (eventual consistency).</p>
            <h4>Partitioning &amp; Sharding</h4>
            <p>Partitioning splits one table into segments (by date/range) within a database. Sharding splits data
            across multiple databases/servers by a shard key, scaling writes and storage horizontally.</p>
            <h4>N+1 &amp; Round Trips</h4>
            <p>Many small queries (N+1) are slower than one well-designed query due to round-trip latency.</p>`,
            mermaid: `graph TB
    Q[Slow query] --> Plan[Read execution plan]
    Plan --> Scan{Table scan?}
    Scan -->|Yes| Idx[Add/adjust index]
    Scan -->|No| Other[Check joins/sorts/stats]
    Idx --> Cover[Covering index avoids lookups]
    App[High read load] --> Replica[Route reads to replicas]
    App --> Cache[Cache hot reads]
    Big[Huge table] --> Part[Partition / shard]`
        },
        {
            title: 'How It Works',
            content: `<p>Diagnosing and fixing database performance follows a measure-first loop:</p>
            <ol>
                <li><strong>Find slow queries:</strong> use query stores / slow-query logs / APM to identify the worst
                offenders by total time (frequency x duration)</li>
                <li><strong>Read the plan:</strong> look for table/index scans, key lookups, expensive sorts, and bad
                cardinality estimates (stale statistics)</li>
                <li><strong>Fix:</strong> add/adjust indexes, rewrite the query, update statistics, reduce returned
                columns/rows</li>
                <li><strong>Scale out reads:</strong> add replicas/caching for read-heavy load</li>
                <li><strong>Scale writes/storage:</strong> partition or shard when a single node can't keep up</li>
                <li><strong>Re-measure:</strong> confirm the fix and watch for regressions</li>
            </ol>`,
            code: `-- Find the cause: inspect the plan (SQL Server)
SET STATISTICS IO, TIME ON;
SELECT o.Id, o.Total, c.Name
FROM Orders o JOIN Customers c ON c.Id = o.CustomerId
WHERE o.Status = 'Shipped' AND o.CreatedAt > '2026-01-01';
-- Plan shows a Clustered Index Scan on Orders -> add a supporting index:

CREATE NONCLUSTERED INDEX IX_Orders_Status_CreatedAt
ON Orders (Status, CreatedAt)         -- matches the WHERE predicate
INCLUDE (Total, CustomerId);          -- covering: avoids key lookups

-- Re-run: plan now shows an Index Seek; logical reads drop dramatically.`,
            language: 'sql'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Read/write splitting with replicas and caching:</p>`,
            mermaid: `flowchart TB
    App[Application] -->|writes| Primary[(Primary DB)]
    App -->|reads| Cache{Cache hit?}
    Cache -->|hit| App
    Cache -->|miss| Replicas[(Read Replicas)]
    Primary -.->|async replication| Replicas
    Replicas --> Cache
    style Primary fill:#fde68a,color:#1e293b
    style Cache fill:#d1fae5,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Indexing, pooling, and read/write splitting in practice:</p>`,
            tabs: [
                {
                    label: 'Indexing',
                    code: `-- Composite index column ORDER matters: most-selective / equality first,
-- range last. This index serves WHERE Status = ? AND CreatedAt > ?:
CREATE INDEX IX_Orders_Status_CreatedAt ON Orders (Status, CreatedAt);

-- Covering index: INCLUDE non-key columns the query selects, so the
-- engine answers entirely from the index (no key lookup to the base table):
CREATE INDEX IX_Orders_Covering ON Orders (Status, CreatedAt)
INCLUDE (Total, CustomerId);

-- Avoid over-indexing: each index speeds reads but slows writes
-- (every INSERT/UPDATE/DELETE maintains all indexes) and uses storage.`,
                    language: 'sql'
                },
                {
                    label: 'Connection Pooling',
                    code: `// Connection pooling is on by default in ADO.NET; the connection STRING
// identity determines the pool. Reuse the same string + open late, close early.
public async Task<Order?> GetOrder(int id)
{
    // 'using' returns the connection to the POOL (does not tear down TCP)
    using var conn = new SqlConnection(_connectionString);
    await conn.OpenAsync();                 // grabs a pooled connection
    return await conn.QueryFirstOrDefaultAsync<Order>(
        "SELECT * FROM Orders WHERE Id=@id", new { id });
}   // connection returned to pool here

// Tune Max Pool Size in the connection string for high concurrency.
// Serverless/Lambda: use a proxy (RDS Proxy) to avoid pool exhaustion.`,
                    language: 'csharp'
                },
                {
                    label: 'Read/Write Splitting',
                    code: `// Route reads to replicas, writes to primary
public class OrderService
{
    private readonly IDbConnectionFactory _primary;   // writes
    private readonly IDbConnectionFactory _replica;   // reads

    public Task CreateAsync(Order o)            // write -> primary
        => _primary.Execute("INSERT INTO Orders ...", o);

    public Task<Order?> GetAsync(int id)        // read -> replica
        => _replica.QueryFirstOrDefault("SELECT * FROM Orders WHERE Id=@id", new { id });
}
// CAUTION: replicas lag. For "read your own write" cases (just-created data),
// read from primary or wait for replication, or you may not see the new row.`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Index to Match Your Queries</h4>
            <p>Create indexes that support your actual WHERE/JOIN/ORDER BY patterns. Put equality columns first,
            range columns last; use covering indexes for hot queries.</p>
            <h4>Do: Read the Execution Plan</h4>
            <p>Don't guess. The plan tells you exactly where time goes — scans, lookups, sorts, bad estimates.</p>
            <h4>Do: Select Only What You Need</h4>
            <p>Avoid SELECT *; fetch only required columns and rows (paginate). Less data = less I/O, network, and
            memory.</p>
            <h4>Do: Use Connection Pooling Correctly</h4>
            <p>Open connections late, close (return to pool) early, and reuse the same connection string. Never cache
            an open connection across requests.</p>
            <h4>Do: Scale Reads Before Writes</h4>
            <p>Most workloads are read-heavy — add caching and read replicas first. Reserve sharding (complex) for
            genuine write/storage scaling needs.</p>
            <h4>Do: Keep Statistics Fresh</h4>
            <p>The optimizer relies on statistics for good plans. Stale stats cause bad cardinality estimates and slow
            plans.</p>`,
            callout: {
                type: 'tip',
                title: 'The Cheapest Win: One Good Index',
                text: 'Before adding caches, replicas, or shards, look at the execution plan. A single missing index turning a table scan into an index seek often improves a query by orders of magnitude \u2014 far cheaper than architectural changes.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Missing Indexes on Filtered/Joined Columns</h4>
            <p>Queries filtering or joining on un-indexed columns force full scans. The single most common cause of
            slow queries.</p>
            <h4>Mistake: Over-Indexing</h4>
            <p>Every index speeds reads but slows every write and consumes storage. Dozens of overlapping indexes
            hurt write-heavy tables.</p>
            <h4>Mistake: SELECT * and Unbounded Results</h4>
            <p>Fetching all columns and all rows wastes I/O and memory and prevents covering indexes. Select needed
            columns and paginate.</p>
            <h4>Mistake: N+1 Queries</h4>
            <p>Issuing one query per item instead of a set-based query multiplies round-trip latency. Batch or join.</p>
            <h4>Mistake: New Connection per Operation Without Pooling</h4>
            <p>Bypassing the pool (or exhausting it) adds connection setup cost and can starve the app under load.</p>
            <h4>Mistake: Ignoring Replication Lag</h4>
            <p>Reading just-written data from a lagging replica returns stale results. Route read-your-write cases to
            the primary.</p>`,
            code: `-- SLOW: non-SARGable predicate prevents index usage
SELECT * FROM Orders WHERE YEAR(CreatedAt) = 2026;   -- function on column -> scan

-- FAST: SARGable range lets the index seek
SELECT Id, Total FROM Orders
WHERE CreatedAt >= '2026-01-01' AND CreatedAt < '2027-01-01';
-- Wrapping a column in a function (YEAR, UPPER, CONVERT) usually disables index seeks.`,
            language: 'sql'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>High-Traffic Web Apps</h4>
            <p>E-commerce and content sites use caching + read replicas to serve massive read traffic while the
            primary handles writes, with carefully tuned indexes on hot queries.</p>
            <h4>Analytics &amp; Reporting</h4>
            <p>Reporting queries run against replicas or dedicated read models (CQRS) to avoid impacting
            transactional performance.</p>
            <h4>Large-Scale Systems</h4>
            <p>Systems like those at large social/SaaS companies shard by user/tenant to scale writes and storage
            beyond a single node.</p>
            <h4>Time-Series &amp; Logs</h4>
            <p>Partitioning by time enables fast queries on recent data and cheap archival/dropping of old
            partitions.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Scaling techniques compared:</p>`,
            table: {
                headers: ['Technique', 'Scales', 'Complexity', 'Consistency impact', 'Best for'],
                rows: [
                    ['Indexing', 'Read speed', 'Low', 'None', 'Almost always (first step)'],
                    ['Caching', 'Reads', 'Medium', 'Staleness risk', 'Hot, rarely-changing reads'],
                    ['Read replicas', 'Reads', 'Medium', 'Replication lag', 'Read-heavy workloads'],
                    ['Partitioning', 'Query/maintenance', 'Medium', 'None (same DB)', 'Large tables (e.g., by date)'],
                    ['Sharding', 'Writes + storage', 'High', 'Cross-shard queries hard', 'Massive write/storage scale'],
                    ['Vertical scaling', 'Everything (limited)', 'Low', 'None', 'Quick headroom, has a ceiling']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Key numbers and levers to internalize:</p>
            <h4>Order-of-Magnitude Costs</h4>
            <ul>
                <li>Index seek vs table scan: often 100-1000x fewer reads on large tables</li>
                <li>Cache hit (memory/Redis): ~sub-ms vs ~ms-tens-of-ms for a DB query</li>
                <li>Cross-region replica read adds latency; prefer same-region replicas</li>
            </ul>
            <h4>Reduce Work, Not Just Add Hardware</h4>
            <p>Fixing a query/index reduces load everywhere; throwing hardware at a bad query just delays the problem.</p>
            <h4>Batch and Paginate</h4>
            <p>Replace N+1 with set-based queries; never return unbounded result sets. Use keyset (cursor) pagination
            for deep pages.</p>
            <h4>Watch Locking &amp; Blocking</h4>
            <p>Long transactions and lock contention can be as damaging as slow queries. Keep transactions short and
            use appropriate isolation levels.</p>`,
            callout: {
                type: 'warning',
                title: 'Measure with Real Data Volumes',
                text: 'A query that is instant on 1,000 rows can be catastrophic on 10 million. Always test performance against production-like data volumes \u2014 plans and index choices change dramatically with scale, and the optimizer may switch from seek to scan.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Validate performance, not just correctness.</p>
            <h4>Plan &amp; Index Regression</h4>
            <p>Capture execution plans / logical reads for critical queries and assert they don't regress (e.g., no
            new scans) as the schema and queries evolve.</p>
            <h4>Load Test with Realistic Volumes</h4>
            <p>Seed production-scale data and run the query mix under concurrency to surface index, locking, and pool
            issues before production.</p>`,
            code: `-- Capture a baseline for a critical query and watch for regressions
SET STATISTICS IO ON;
-- run query; record "logical reads" count (e.g., 12 reads via index seek)
-- A later change causing "logical reads: 250,000" (scan) is a regression.

-- In CI, you can assert query cost stays bounded using a seeded test DB
-- (Testcontainers) and comparing logical reads / duration against a threshold.`,
            language: 'sql'
        },
        {
            title: 'Interview Tips',
            content: `<p>Database performance is a high-value backend/system-design topic:</p>
            <ul>
                <li><strong>Start with "read the execution plan"</strong> and indexing — the highest-leverage fixes</li>
                <li><strong>Explain index types</strong> (clustered, non-clustered, covering, composite) and column order</li>
                <li><strong>Know read replicas vs sharding</strong> — replicas scale reads, sharding scales writes</li>
                <li><strong>Mention connection pooling</strong> and replication lag (read-your-write)</li>
                <li><strong>Advocate measuring at scale</strong> — small data hides problems</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Senior Signal',
                text: 'Saying "I would profile to find the slow query, read its plan, and try indexing/rewriting before reaching for replicas or sharding" shows you optimize the cheap, high-impact way first rather than jumping to architecture.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Books</h4>
            <ul>
                <li><em>SQL Performance Explained</em> by Markus Winand (use-the-index-luke.com)</li>
                <li><em>Designing Data-Intensive Applications</em> by Martin Kleppmann</li>
                <li><em>High Performance MySQL</em> / SQL Server internals references</li>
            </ul>
            <h4>Online</h4>
            <ul>
                <li>use-the-index-luke.com (indexing for developers)</li>
                <li>Brent Ozar's SQL Server performance resources</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>The database is usually the bottleneck</strong> — optimize it for the biggest wins</li>
                <li><strong>Read the execution plan</strong> first; the cheapest fix is often one good index</li>
                <li><strong>Index column order matters;</strong> covering indexes avoid lookups; don't over-index (write cost)</li>
                <li><strong>Connection pooling</strong> avoids per-request connection setup</li>
                <li><strong>Read replicas scale reads</strong> (mind lag); <strong>sharding scales writes/storage</strong> (complex)</li>
                <li><strong>Avoid N+1, SELECT *, unbounded results, and non-SARGable predicates</strong></li>
                <li><strong>Measure at production-scale data</strong> — small datasets hide problems</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Tune a Slow Reporting Query</h4>
            <ol>
                <li>Seed an Orders table with ~1M rows and a related Customers table</li>
                <li>Write a report query filtering by status and date range, joining customers</li>
                <li>Capture its execution plan and logical reads (expect a scan)</li>
                <li>Design a supporting (ideally covering) index; verify the plan switches to a seek</li>
                <li>Rewrite any non-SARGable predicate (e.g., YEAR(CreatedAt)) to a range</li>
                <li>Add a read replica route for the report and a cache for repeated runs; measure improvement</li>
            </ol>`,
            code: `-- 1-2: seed data + report query (status + date range + join)
-- 3: SET STATISTICS IO, TIME ON; record logical reads
-- 4: CREATE INDEX ... INCLUDE (...) ; confirm Index Seek
-- 5: replace WHERE YEAR(CreatedAt)=2026 with a >= / < range
-- 6: route to replica + cache; compare before/after metrics`,
            language: 'sql'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What is a covering index?<br/>
                    <em>A: An index that includes all columns a query needs (key + INCLUDE columns), so the query is
                    answered entirely from the index without a lookup back to the base table.</em></li>
                <li><strong>Q:</strong> Why does wrapping a column in a function (e.g., YEAR(CreatedAt)) hurt performance?<br/>
                    <em>A: It makes the predicate non-SARGable — the engine can't use an index seek and must scan/compute
                    the function per row. Rewrite as a range (CreatedAt >= ... AND < ...) so the index is usable.</em></li>
                <li><strong>Q:</strong> When do you use read replicas vs sharding?<br/>
                    <em>A: Read replicas scale read-heavy workloads (with replication lag). Sharding splits data across
                    nodes to scale writes and storage horizontally, but adds significant complexity (cross-shard queries,
                    rebalancing).</em></li>
                <li><strong>Q:</strong> Why can over-indexing hurt?<br/>
                    <em>A: Every index must be maintained on each INSERT/UPDATE/DELETE and consumes storage, so too many
                    indexes slow writes and waste space \u2014 a trade-off against read speed.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'How do you approach diagnosing a slow database query?',
            difficulty: 'easy',
            answer: `<p>Measure first, then fix the proven cause:</p>
            <ol>
                <li><strong>Identify</strong> the slow query via slow-query logs, query store, or APM (by total impact =
                frequency x duration).</li>
                <li><strong>Read the execution plan</strong> to see what the engine does — look for table/index scans,
                key lookups, expensive sorts, and bad row estimates (stale statistics).</li>
                <li><strong>Fix:</strong> add/adjust an index to match the query, rewrite it (SARGable predicates, fewer
                columns/rows), or update statistics.</li>
                <li><strong>Re-measure</strong> to confirm and guard against regression.</li>
            </ol>`,
            explanation: 'It is like diagnosing a slow commute: first find which route is slow (identify the query), check the traffic map for the jam (execution plan), then take a better road or build a shortcut (index/rewrite) — and verify the new route is actually faster.',
            bestPractices: ['Always read the plan before changing anything', 'Index to match the query predicates', 'Select fewer columns/rows'],
            commonMistakes: ['Guessing instead of reading the plan', 'Adding random indexes hoping one helps'],
            interviewTip: 'Lead with "read the execution plan" — it is the single most important diagnostic step and signals real experience.',
            followUp: ['What do you look for in an execution plan?', 'What makes a predicate non-SARGable?']
        },
        {
            question: 'Explain indexing strategy: clustered vs non-clustered, covering, and composite indexes.',
            difficulty: 'medium',
            answer: `<p><strong>Clustered index:</strong> defines the physical order of rows in the table; there can be only
            one (often the primary key). Range scans on it are efficient.</p>
            <p><strong>Non-clustered index:</strong> a separate structure with keys pointing back to rows; you can have
            many. Used to support specific query predicates.</p>
            <p><strong>Composite index:</strong> spans multiple columns; column <em>order matters</em> — put equality
            predicates first and range predicates last so the index can seek.</p>
            <p><strong>Covering index:</strong> includes (via INCLUDE) all columns a query needs so it is answered
            entirely from the index, avoiding a lookup to the base table.</p>
            <p>The trade-off: indexes speed reads but slow writes and use storage, so index deliberately for your
            actual query patterns.</p>`,
            explanation: 'A clustered index is like a phone book sorted by last name (the data itself is ordered). A non-clustered index is a separate "by phone number" list pointing to the right page. A covering index is a mini-list that already contains everything you needed, so you never flip back to the main book.',
            code: `-- Composite + covering example
CREATE INDEX IX_Orders_Status_Date ON Orders (Status, CreatedAt)  -- equality, then range
INCLUDE (Total, CustomerId);   -- covering: query reads only this index`,
            language: 'sql',
            bestPractices: ['Equality columns first, range last in composite indexes', 'Use INCLUDE for covering hot queries', "Index for real query patterns, not speculatively"],
            commonMistakes: ['Wrong column order in composite indexes', 'Over-indexing write-heavy tables', 'Indexing low-selectivity columns alone'],
            interviewTip: 'Stress column ORDER in composite indexes and the read-vs-write trade-off — these distinguish a real answer from a textbook definition.',
            followUp: ['Why does composite index column order matter?', 'How many indexes is too many?']
        },
        {
            question: 'A read-heavy service is hitting database limits. Walk through how you would scale it.',
            difficulty: 'hard',
            answer: `<p>I would scale in order of cost/complexity, measuring at each step:</p>
            <ol>
                <li><strong>Optimize first:</strong> profile the worst queries, fix indexes and rewrites, eliminate
                N+1 and SELECT *. Often this alone restores headroom — cheapest and reduces load everywhere.</li>
                <li><strong>Cache hot reads:</strong> add a cache (Redis/in-memory) for frequently-read, rarely-changing
                data using cache-aside, with a sensible TTL/invalidation. This offloads the DB dramatically for
                read-heavy traffic.</li>
                <li><strong>Add read replicas:</strong> route reads to replicas and writes to the primary. Handle
                replication lag explicitly (route read-your-write cases to primary).</li>
                <li><strong>Vertical scale</strong> for quick headroom if needed (bigger instance) — simple but has a
                ceiling.</li>
                <li><strong>Partition / shard</strong> only if writes or storage (not just reads) exceed a single node.
                Sharding is powerful but adds major complexity (shard key choice, cross-shard queries, rebalancing), so
                it is a last resort.</li>
            </ol>
            <p>Throughout: measure with production-scale data, watch for lock contention and connection-pool limits,
            and ensure consistency requirements are met when introducing caching/replicas.</p>`,
            explanation: 'Like easing congestion on a busy road: first fix the obvious bottlenecks and re-time the lights (query/index tuning), then add express lanes and park-and-ride (caching), then build parallel roads for traffic that can use them (read replicas), and only as a last resort redesign the whole road network into separate districts (sharding), which is expensive and disruptive.',
            bestPractices: ['Optimize queries/indexes before adding infrastructure', 'Cache hot, stable reads with cache-aside + TTL', 'Read replicas for read scale; handle lag', 'Shard only for write/storage scale; choose shard key carefully', 'Measure at realistic data volumes'],
            commonMistakes: ['Jumping to sharding before tuning queries', 'Caching without an invalidation strategy', 'Ignoring replication lag (stale reads)', 'Connection-pool exhaustion under high concurrency'],
            interviewTip: 'Present an ordered ladder (tune -> cache -> replicas -> vertical -> shard) and justify why you exhaust cheap options first. Note read-replicas scale reads while sharding scales writes — a precise distinction interviewers probe.',
            followUp: ['How do you handle read-your-own-write with replicas?', 'How do you choose a shard key?', 'What invalidation strategy would you use for the cache?'],
            seniorPerspective: 'The instinct I coach against is reaching for replicas or sharding before profiling. In most "the database can\u2019t keep up" incidents I have handled, one or two missing indexes or an N+1 in a hot endpoint were the real cause, and fixing them restored far more headroom than another replica would have. Caching read-heavy, slowly-changing data is the next big lever. Sharding is genuinely a last resort \u2014 the operational complexity of cross-shard queries, rebalancing, and a poorly-chosen shard key has sunk more projects than it has saved, so I only go there when writes or storage truly exceed a single (vertically-scaled) primary.'
        },
        {
            question: 'What is connection pooling, why does it matter, and how does pool exhaustion happen?',
            difficulty: 'medium',
            answer: `<p><strong>Connection pooling</strong> reuses a set of already-established database connections instead of opening a new one per request. Opening a connection is expensive — TCP handshake, TLS negotiation, and database-side authentication can take tens of milliseconds. A pool keeps connections open and hands them out, so a request just borrows and returns one.</p>
            <p>In ADO.NET the pool is keyed by the exact connection string, so reusing the same string is essential. The pattern is open late, close early: <code>using</code> a connection returns it to the pool (it does not tear down the TCP connection).</p>
            <p><strong>Pool exhaustion</strong> happens when all connections are checked out and none are returned fast enough. New requests wait for a free connection and time out. Common causes:</p>
            <ul>
                <li><strong>Leaked connections:</strong> not disposing (no <code>using</code>), so connections never return to the pool.</li>
                <li><strong>Long-held connections:</strong> holding a connection open across slow work or an external call.</li>
                <li><strong>Too-small Max Pool Size</strong> under high concurrency.</li>
                <li><strong>Serverless functions</strong> each maintaining their own pool, overwhelming the database.</li>
            </ul>`,
            explanation: 'A connection pool is like a rack of pre-warmed rental cars at an airport: instead of manufacturing a car for every traveler (opening a connection), they grab one, drive, and return it. Exhaustion is everyone holding their cars in the parking lot — the next traveler waits with no car available.',
            code: `-- Pseudo-config: connection string controls pooling
-- "Server=...;Database=...;Max Pool Size=100;Min Pool Size=5;"
-- Same connection string  =  same pool (reuse it everywhere).

-- Symptom of exhaustion (timeout):
-- "Timeout expired. The timeout period elapsed prior to obtaining a
--  connection from the pool." -> connections leaked or held too long.

-- Fixes:
--  1) Always dispose (using var conn = ...) so it returns to the pool
--  2) Open late / close early; never hold across external/HTTP calls
--  3) Tune Max Pool Size for real concurrency
--  4) Serverless: front the DB with a proxy (e.g., RDS Proxy) to share pools`,
            language: 'sql',
            bestPractices: ['Reuse the same connection string so all callers share one pool', 'Open connections late and dispose them early (return to pool quickly)', 'Tune Max Pool Size to match real peak concurrency, validated by load test', 'In serverless, use a connection proxy to avoid each instance flooding the DB'],
            commonMistakes: ['Forgetting to dispose connections, leaking them out of the pool', 'Holding a connection open across a slow external/HTTP call', 'Caching a single open connection and sharing it across requests/threads', 'Setting Max Pool Size too low and hitting timeouts under load'],
            interviewTip: 'Explain the why (connection setup is expensive: TCP + TLS + auth) and then the failure mode (exhaustion = timeouts under load with idle CPU). Mention open-late/close-early and that the connection string keys the pool.',
            followUp: ['Why does holding a connection during an HTTP call cause exhaustion?', 'How does pooling interact with serverless/Lambda?', "How would you diagnose pool exhaustion in production?"],
            seniorPerspective: 'Pool exhaustion is one of the sneakiest production failures because it looks like the database is slow when really the app is hoarding connections. The classic root cause I find is a connection opened, then an await on a slow downstream call while still holding it. Under load the pool drains, requests queue, and timeouts cascade. The fix is almost always scoping the connection tightly around the query, not bumping the pool size.'
        },
        {
            question: 'Explain the difference between partitioning and sharding, and how you choose a shard key.',
            difficulty: 'hard',
            answer: `<p><strong>Partitioning</strong> splits one large table into segments <em>within a single database</em>, usually by range (e.g., by month) or list. The database treats it as one logical table but stores and queries segments separately. Benefits: faster queries via partition pruning (scan only relevant segments), and cheap maintenance (drop an old partition instead of a mass delete). It does <em>not</em> scale writes beyond one node.</p>
            <p><strong>Sharding</strong> splits data <em>across multiple databases/servers</em> by a shard key. Each shard holds a subset of rows and runs on its own node, so sharding scales writes, storage, and throughput horizontally — at the cost of major complexity: cross-shard queries and joins are hard, transactions across shards are painful, and rebalancing is operationally heavy.</p>
            <p><strong>Choosing a shard key</strong> is the most consequential decision:</p>
            <ul>
                <li><strong>High cardinality &amp; even distribution:</strong> spreads data and load evenly, avoiding hot shards.</li>
                <li><strong>Matches the common query pattern:</strong> queries should target a single shard (e.g., shard by tenant/customer if most queries are per-tenant), avoiding scatter-gather.</li>
                <li><strong>Stable:</strong> the key should not change (changing it means moving the row to another shard).</li>
            </ul>
            <p>Bad keys (e.g., sequential IDs or timestamps) create hot shards; keys that don't match queries force every query to hit all shards.</p>`,
            explanation: 'Partitioning is organizing one big filing cabinet into labeled drawers so you open only the right drawer. Sharding is splitting the files across many separate cabinets in different rooms — vastly more storage and many clerks working at once, but answering "find everything matching X" now means running between rooms.',
            code: `-- PARTITIONING (one DB): range partition Orders by month
-- Queries filtered by CreatedAt only scan the relevant partition(s).
CREATE PARTITION FUNCTION pf_OrdersByMonth (datetime2)
AS RANGE RIGHT FOR VALUES ('2026-01-01', '2026-02-01', '2026-03-01');
-- Dropping an old month = drop/switch a partition (instant vs mass DELETE).

-- SHARDING (many DBs): app routes by shard key (conceptual)
--   shard = hash(CustomerId) % shardCount
--   CustomerId chosen because: high cardinality, even spread,
--   and most queries are "give me this customer's orders" -> single shard.
-- Cross-customer reporting must scatter-gather across all shards (expensive).`,
            language: 'sql',
            bestPractices: ['Partition large tables by a natural range (date) for pruning and cheap archival', 'Shard only when writes/storage exceed a single node, not just for reads', 'Choose a high-cardinality, evenly-distributed shard key that matches query patterns', 'Keep the shard key immutable so rows never need to move between shards'],
            commonMistakes: ['Sharding to solve a read-scaling problem that replicas/caching would fix', 'Choosing a sequential ID or timestamp as shard key (creates hot shards)', 'Picking a key that does not match queries, forcing scatter-gather on every query', 'Underestimating cross-shard joins, transactions, and rebalancing complexity'],
            interviewTip: 'Draw the line clearly: partitioning is within one DB (scales queries/maintenance), sharding is across DBs (scales writes/storage). Then make the shard-key discussion the centerpiece — high cardinality, even distribution, and alignment to query patterns.',
            followUp: ['What is partition pruning?', 'How does sharding handle a query that spans many shards?', 'How do you rebalance shards when one becomes hot?'],
            seniorPerspective: 'I push teams hard to exhaust partitioning, caching, and read replicas before sharding, because sharding changes your data model and application forever. The shard key is effectively irreversible — re-sharding a live system is one of the riskiest operations there is. When I do shard, I shard by the entity that owns most queries (usually tenant or customer) so the overwhelming majority of requests hit exactly one shard, and I accept that cross-cutting analytics will run on a separate read model rather than against the shards directly.',
            architectPerspective: 'Architecturally I treat sharding as a commitment, not a tactic. It dictates API design (the shard key must be present on most requests), forces a strategy for cross-shard reporting (typically a separate analytics store or CQRS read model), and requires an operational plan for rebalancing and adding shards. Partitioning, by contrast, is a low-risk optimization I reach for routinely on large time-series tables for pruning and cheap retention management.'
        },
        {
            question: 'How does caching reduce database load, and how do you keep cached data from going stale?',
            difficulty: 'advanced',
            answer: `<p><strong>Caching</strong> stores the result of expensive reads in fast storage (in-memory or Redis) so repeated requests are served without hitting the database. For read-heavy, slowly-changing data, a high cache hit ratio can remove the majority of database load and cut read latency from milliseconds to sub-millisecond.</p>
            <p>The dominant pattern is <strong>cache-aside (lazy loading)</strong>: on read, check the cache; on a miss, load from the DB, populate the cache with a TTL, and return. Other patterns: <strong>read-through/write-through</strong> (cache sits inline and manages the DB), and <strong>write-behind</strong> (cache absorbs writes and flushes asynchronously).</p>
            <p>Keeping data fresh — the hard part — uses a combination of:</p>
            <ul>
                <li><strong>TTL expiry:</strong> bound staleness automatically; simple and robust.</li>
                <li><strong>Explicit invalidation:</strong> on write, delete or update the affected cache key so the next read reloads.</li>
                <li><strong>Versioned/keyed entries:</strong> include a version or last-modified in the key so updates produce new keys.</li>
            </ul>
            <p>The trade-off is consistency vs load: shorter TTL = fresher but more DB hits; longer TTL = less load but more staleness. Choose per data type based on how stale it can safely be.</p>`,
            explanation: 'A cache is like keeping the few reference books you use constantly on your desk instead of walking to the library each time. TTL is deciding to refresh them every morning; explicit invalidation is replacing a book the moment you learn a new edition shipped.',
            code: `-- Cache-aside flow (pseudo-code around the data layer):
--   value = cache.Get(key)
--   if value == null:
--       value = db.Query(...)            -- miss: hit the database
--       cache.Set(key, value, ttl: 5m)   -- populate with a TTL
--   return value
--
-- On write, invalidate so the next read reloads fresh data:
--   db.Update(order)
--   cache.Remove($"order:{order.Id}")    -- explicit invalidation
--
-- Staleness control:
--   reference/rarely-changing data -> long TTL (hours)
--   frequently-updated data        -> short TTL + invalidate on write
--   never cache data that must be exactly current (e.g., account balance for a payment)`,
            language: 'sql',
            bestPractices: ['Use cache-aside with a TTL as the default for read-heavy, tolerant data', 'Invalidate (or update) the cache key on every write to that data', 'Set TTL based on how stale each data type can safely be', 'Cache the expensive, high-traffic, slowly-changing reads first (biggest wins)'],
            commonMistakes: ['Caching without any invalidation strategy (serving stale data indefinitely)', 'Caching highly volatile or correctness-critical data (e.g., balances pre-payment)', 'Cache stampede: many concurrent misses all hitting the DB at once on expiry', 'Using too long a TTL for data that changes often, surfacing stale results'],
            interviewTip: 'Name cache-aside as the default pattern and immediately pair it with an invalidation story (TTL + invalidate-on-write). The senior signal is framing it as a consistency-vs-load trade-off chosen per data type, plus mentioning cache stampede.',
            followUp: ['What is a cache stampede and how do you prevent it?', 'When would you choose write-through over cache-aside?', 'How do you cache safely behind read replicas with lag?'],
            seniorPerspective: 'Caching is the highest-leverage way to take read load off a struggling database, but the failure mode is always staleness and the bugs are subtle. My rule is that nothing goes in a cache without an explicit answer to "how does this get invalidated, and how stale can it be?" For most reference data a short TTL plus invalidate-on-write is plenty. I refuse to cache anything that gates a money or correctness decision unless it is verified against the source at the moment of use.',
            architectPerspective: 'I design caching as an explicit tier with clear ownership of invalidation, not an ad-hoc sprinkling of Get/Set calls. At scale I plan for cache stampede (request coalescing or jittered TTLs), choose a distributed cache so all instances share state, and define per-domain staleness budgets. The architecture question is never "should we cache?" but "what is the consistency contract for each cached entity?" — answering that prevents the stale-data incidents that erode trust in the system.'
        },
        {
            question: 'How do you diagnose and fix a slow SQL query in production using execution plans?',
            difficulty: 'hard',
            answer: `<p>Diagnosing slow queries is a systematic process: <strong>identify</strong> the problematic query, <strong>analyze</strong> its execution plan, <strong>understand</strong> what the optimizer chose, and <strong>fix</strong> the root cause — which is usually missing indexes, bad statistics, or inefficient query structure.</p>
            <h4>Step-by-Step Diagnosis:</h4>
            <ol>
                <li><strong>Identify</strong>: Use slow query log, APM traces, or DMVs (sys.dm_exec_query_stats in SQL Server, pg_stat_statements in PostgreSQL) to find queries with high total execution time or high average latency.</li>
                <li><strong>Get the actual execution plan</strong>: Use SET STATISTICS PROFILE ON, EXPLAIN ANALYZE (Postgres), or actual execution plan in SSMS. Actual plans show <em>real</em> row counts vs estimated — discrepancies reveal stale statistics.</li>
                <li><strong>Look for red flags</strong>:
                    <ul>
                        <li><strong>Table/Index scan</strong> where a seek is expected (missing index)</li>
                        <li><strong>Estimated vs actual rows</strong> wildly different (stale statistics, parameter sniffing)</li>
                        <li><strong>Key lookups</strong> (index doesn't cover all needed columns — add INCLUDE columns)</li>
                        <li><strong>Sort/Hash operations spilling to tempdb</strong> (memory grant too low)</li>
                        <li><strong>Nested loop join on large tables</strong> (should be hash or merge join)</li>
                    </ul>
                </li>
                <li><strong>Fix</strong>: Add missing index, update statistics, rewrite query (avoid implicit conversions, sargable predicates), or add query hints as last resort.</li>
            </ol>
            <h4>Common Fixes:</h4>
            <ul>
                <li><strong>Missing index</strong>: Add covering index with INCLUDE columns for frequently accessed fields</li>
                <li><strong>Parameter sniffing</strong>: OPTION(RECOMPILE), OPTIMIZE FOR UNKNOWN, or plan guides</li>
                <li><strong>Implicit conversion</strong>: Ensure WHERE clause types match column types (varchar vs nvarchar causes scan)</li>
                <li><strong>N+1 at DB level</strong>: Replace correlated subqueries with JOINs or window functions</li>
            </ul>`,
            bestPractices: ['Always look at ACTUAL execution plan, not estimated (actuals show real row counts)', 'Check estimated vs actual row counts first — discrepancy is the #1 indicator of stale stats', 'Fix the root cause (index, statistics, query structure) rather than adding hints', 'Monitor query plan changes after index additions (new indexes can regress other queries)'],
            commonMistakes: ['Looking only at estimated plans (cannot detect statistics problems)', 'Adding indexes without considering write overhead (every index slows INSERT/UPDATE)', 'Using NOLOCK hint to "fix" slow reads (masks the real problem, introduces dirty reads)', 'Fixing one query without checking impact on others sharing the same tables'],
            interviewTip: 'Walk through a structured process: identify (DMVs/slow log), analyze (actual execution plan), diagnose (scans, row estimate mismatches, spills), fix (index, stats, rewrite). Mentioning parameter sniffing and covering indexes shows production depth.',
            followUp: ['What is parameter sniffing and how do you fix it?', 'How do you decide between adding an index vs rewriting a query?', 'What is an implicit conversion and why does it prevent index seeks?'],
            seniorPerspective: 'My production debugging routine: check pg_stat_statements for the top 5 queries by total time, get actual execution plans, and look for the mismatch between estimated and actual rows. That mismatch is the root cause 80% of the time — either statistics are stale or the query structure confuses the optimizer.',
            architectPerspective: 'Query performance is an ongoing operational concern, not a one-time optimization. I build observability into the data layer: automated slow query detection, plan regression alerts (when a query suddenly changes from seek to scan), and regular statistics maintenance schedules. The architectural discipline is treating the database as a system that needs monitoring and tuning, not a black box you throw queries at.'
        },
        {
            question: 'When and how should you denormalize a database for performance?',
            difficulty: 'hard',
            answer: `<p><strong>Denormalization</strong> intentionally adds redundancy to a database schema to reduce expensive JOINs and improve read performance. It trades write complexity and storage for read speed.</p>
            <h4>When to Denormalize:</h4>
            <ul>
                <li><strong>Read-heavy workloads</strong>: When read/write ratio exceeds 10:1 and critical read paths require 4+ table JOINs.</li>
                <li><strong>Reporting/analytics queries</strong>: Complex aggregations across many tables that cannot meet latency requirements with normalized schema.</li>
                <li><strong>After indexing and query optimization are exhausted</strong>: Denormalization is a last resort, not a first step.</li>
                <li><strong>Specific hot paths</strong>: A single API endpoint that accounts for 60% of DB load and requires data from multiple tables.</li>
            </ul>
            <h4>Denormalization Strategies:</h4>
            <ul>
                <li><strong>Materialized views</strong>: Pre-computed query results refreshed on schedule. Database manages the redundancy. Good for reporting.</li>
                <li><strong>Computed columns / summary tables</strong>: Store pre-aggregated values (total_order_amount on customer table). Update on write via triggers or application logic.</li>
                <li><strong>Embedding/flattening</strong>: Copy related data into the parent row (store customer_name on order table). Eliminates JOIN but requires updates when source changes.</li>
                <li><strong>CQRS pattern</strong>: Separate read model (denormalized, optimized for queries) from write model (normalized, optimized for consistency). Sync via events.</li>
            </ul>
            <h4>Maintaining Consistency:</h4>
            <p>Denormalized data must stay in sync with source. Options: database triggers (simple but hidden), application-level dual writes (explicit but error-prone), event-driven sync (scalable but eventually consistent), or scheduled refresh (simple but stale).</p>`,
            bestPractices: ['Denormalize specific read paths, not the entire schema', 'Document every denormalization: what it optimizes, how it is kept in sync, staleness tolerance', 'Prefer materialized views over manual duplication (database manages refresh)', 'Measure before and after: prove the denormalization actually improved the target metric'],
            commonMistakes: ['Denormalizing prematurely before trying indexes and query optimization', 'No strategy for keeping denormalized data consistent (data drifts silently)', 'Denormalizing everything (now every write is complex and slow)', 'Using triggers for complex sync (hidden logic, hard to debug, performance trap)'],
            interviewTip: 'Frame denormalization as a deliberate engineering trade-off with explicit costs, not a "performance hack." Mention that you only denormalize after exhausting indexing, query optimization, and caching — and that you document the consistency contract for each denormalized field.',
            followUp: ['How does CQRS relate to denormalization?', 'What is event-carried state transfer?', 'How do you decide between caching and denormalization?'],
            seniorPerspective: 'I denormalize surgically: identify the specific query that is unacceptably slow after optimization, add exactly the redundancy needed to eliminate its bottleneck JOIN, and document how that redundancy stays in sync. I have seen teams denormalize everything "for performance" and end up with a write nightmare that is harder to maintain than the original JOINs were to read.',
            architectPerspective: 'At the architecture level, I prefer CQRS over ad-hoc denormalization because it makes the trade-off explicit and systematic: the write model stays normalized (correctness, integrity), and a separate read model is denormalized and optimized per use case. Event-driven synchronization between them provides clear consistency boundaries. This scales better organizationally than sprinkling denormalized columns across a shared schema.'
        }
    ]
});
