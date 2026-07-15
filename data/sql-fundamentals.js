/* ═══════════════════════════════════════════════════════════════════
   SQL Server — Indexes, Execution Plans, Query Optimization
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('sql-fundamentals', {
    title: 'SQL Indexes & Optimization',
    description: 'Clustered and non-clustered indexes, covering indexes, execution plan analysis, statistics, index fragmentation, and query performance tuning in SQL Server.',
    quickRecall: [
        'Clustered index: one per table, leaf IS the data, determines physical order',
        'Non-clustered: separate B-tree with pointers; up to 999 per table',
        'Covering index: INCLUDE all needed columns — eliminates key lookup',
        'Execution plan: read right-to-left; look for scans, sorts, key lookups',
        'Statistics: histograms that help optimizer estimate row counts',
        'Fragmentation >30% = rebuild index; 5-30% = reorganize'
    ],
    sections: [
        {
            title: 'Clustered vs Non-Clustered Indexes',
            content: `<p>Indexes are B-tree structures that speed up data retrieval. Understanding their types and mechanics is essential for query performance.</p>
            <ul>
                <li><strong>Clustered Index</strong> — determines physical row order on disk. Only ONE per table. The leaf level IS the data. Usually on the primary key.</li>
                <li><strong>Non-Clustered Index</strong> — separate structure with pointers back to data rows. Up to 999 per table. Leaf contains key + row locator (RID or clustered key).</li>
                <li><strong>Covering Index</strong> — a non-clustered index that contains ALL columns needed by a query (via INCLUDE). Eliminates lookup to base table.</li>
            </ul>`,
            code: `-- Clustered Index (physical data order, one per table)
CREATE CLUSTERED INDEX IX_Orders_OrderDate ON Orders(OrderDate);
-- The table IS now sorted by OrderDate on disk
-- Range scans (WHERE OrderDate BETWEEN ...) are extremely fast

-- Non-Clustered Index (separate B-tree with pointers to rows)
CREATE NONCLUSTERED INDEX IX_Orders_CustomerId ON Orders(CustomerId);
-- Leaf nodes contain: CustomerId + pointer to actual row (clustered key or RID)
-- Lookup: Find CustomerId in index → follow pointer → get full row

-- Covering Index (includes all needed columns — no lookup!)
CREATE NONCLUSTERED INDEX IX_Orders_Covering
ON Orders(CustomerId, OrderDate)
INCLUDE (TotalAmount, Status);
-- For: SELECT TotalAmount, Status FROM Orders WHERE CustomerId = 5 AND OrderDate > '2024-01-01'
-- Query answered entirely from index — no table access needed!

-- Filtered Index (partial index — less space, faster)
CREATE NONCLUSTERED INDEX IX_Orders_Active
ON Orders(CustomerId, OrderDate)
WHERE Status = 'Active';
-- Only indexes active orders — much smaller, faster for common queries

-- Composite Index (multi-column — order matters!)
CREATE INDEX IX_Users_LastFirst ON Users(LastName, FirstName);
-- Useful for: WHERE LastName = 'Smith'
-- Useful for: WHERE LastName = 'Smith' AND FirstName = 'John'
-- NOT useful for: WHERE FirstName = 'John' (leftmost prefix rule!)

-- Index key guidelines:
-- Clustered: narrow, ever-increasing, unique (IDENTITY, GUID sequential)
-- Non-clustered: columns in WHERE, JOIN, ORDER BY
-- INCLUDE: columns in SELECT that aren't in WHERE/JOIN`,
            language: 'sql'
        },
        {
            title: 'Reading Execution Plans',
            content: `<p>Execution plans show HOW SQL Server executes a query — which indexes it uses, join algorithms, sort operations, and estimated costs. They are the primary tool for query optimization.</p>`,
            code: `-- Get execution plan:
SET STATISTICS IO ON;    -- Shows logical/physical reads
SET STATISTICS TIME ON;  -- Shows CPU/elapsed time

-- View estimated plan (doesn't execute):
-- Ctrl+L in SSMS, or:
SET SHOWPLAN_XML ON;

-- View actual plan (executes query):
-- Ctrl+M in SSMS, or:
SET STATISTICS PROFILE ON;

-- Key operators to understand:
-- Table Scan        → No useful index, reads entire table (BAD for large tables)
-- Index Scan        → Reads entire index (OK for small result sets of total)
-- Index Seek        → B-tree navigation to specific rows (GOOD — O(log n))
-- Key Lookup        → Non-clustered index found row, but needs more columns from table
-- Nested Loop Join  → For each row in outer, seek in inner (good for small outer)
-- Hash Match Join   → Builds hash table from smaller set (good for large unsorted)
-- Merge Join        → Both inputs sorted, merge (good for large sorted sets)
-- Sort              → Explicit sort operation (expensive if large)
-- Parallelism       → Query split across multiple threads

-- Red flags in execution plans:
-- 1. Table/Index SCAN on large table (missing index?)
-- 2. Key Lookup with high cost (make covering index)
-- 3. Sort operator (can index provide order instead?)
-- 4. Thick arrows (large number of rows flowing between operators)
-- 5. Warnings (missing statistics, implicit conversions, spills to tempdb)

-- Example: Diagnosing a slow query
-- Before (Table Scan — reads all 10M rows):
SELECT * FROM Orders WHERE CustomerId = 12345;
-- Plan: Table Scan (Cost: 100%), Logical Reads: 50000

-- After (Index Seek — reads ~20 rows):
CREATE INDEX IX_Orders_CustomerId ON Orders(CustomerId);
SELECT * FROM Orders WHERE CustomerId = 12345;
-- Plan: Index Seek + Key Lookup, Logical Reads: 5

-- Even better (Covering Index — no Key Lookup):
CREATE INDEX IX_Orders_Cover ON Orders(CustomerId) INCLUDE (OrderDate, Total);
-- Plan: Index Seek only, Logical Reads: 3`,
            language: 'sql'
        },
        {
            title: 'Statistics & Index Maintenance',
            content: `<p><strong>Statistics</strong> help the query optimizer estimate row counts and choose execution plans. <strong>Index maintenance</strong> (rebuild/reorganize) addresses fragmentation that degrades performance over time.</p>`,
            code: `-- Statistics — histograms the optimizer uses for estimates
-- Auto-created on indexed columns and first query on non-indexed columns
-- Auto-updated after ~20% of rows change (threshold varies by version)

-- View statistics:
DBCC SHOW_STATISTICS('Orders', 'IX_Orders_CustomerId');
-- Shows: header (last updated, rows sampled), density vector, histogram

-- Force statistics update:
UPDATE STATISTICS Orders IX_Orders_CustomerId WITH FULLSCAN;
-- Or all statistics on a table:
UPDATE STATISTICS Orders WITH FULLSCAN;

-- When stats are stale, optimizer makes bad choices:
-- Estimates 10 rows, actually 100K → Nested Loop instead of Hash Join → slow!

-- Index fragmentation:
-- Logical fragmentation: pages out of order (affects sequential reads)
-- Internal fragmentation: pages partially full (wastes space)

SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent,
    ips.page_count,
    ips.avg_page_space_used_in_percent
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 10
ORDER BY ips.avg_fragmentation_in_percent DESC;

-- Maintenance thresholds:
-- 5-30% fragmentation  → ALTER INDEX REORGANIZE (online, lightweight)
-- > 30% fragmentation  → ALTER INDEX REBUILD (heavier, can be online with Enterprise)

ALTER INDEX IX_Orders_CustomerId ON Orders REORGANIZE;  -- Light, always online
ALTER INDEX IX_Orders_CustomerId ON Orders REBUILD 
    WITH (ONLINE = ON, FILLFACTOR = 80);  -- Heavier but thorough

-- Fill factor: leave space in pages for future inserts
-- 80% = 20% free space per page → fewer page splits on insert-heavy tables
-- 100% (default) = pages fully packed → best for read-only tables`,
            language: 'sql'
        },
        {
            title: 'Query Optimization Techniques',
            content: `<p>Beyond indexing, several techniques improve query performance: SARGability, avoiding implicit conversions, proper join strategies, and parameterization.</p>`,
            code: `-- SARGable (Search ARGument ABLE) — can use index seek
-- GOOD (SARGable):
WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01'
WHERE LastName LIKE 'Smith%'  -- Prefix wildcard OK
WHERE CustomerId = 5

-- BAD (Non-SARGable — forces index scan):
WHERE YEAR(OrderDate) = 2024        -- Function on column!
WHERE LastName LIKE '%Smith%'       -- Leading wildcard
WHERE CAST(Amount AS INT) > 100     -- Cast on column
WHERE Price * Quantity > 1000       -- Expression on column

-- FIX: Move computation to the other side
WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01'  -- Instead of YEAR()
WHERE Amount > 100  -- Instead of CAST()

-- Implicit conversions (silent performance killers):
-- Column is VARCHAR, parameter is NVARCHAR → scans entire index!
WHERE VarcharColumn = N'value'  -- BAD: implicit conversion, no seek
WHERE VarcharColumn = 'value'   -- GOOD: matching types, seeks

-- Efficient pagination:
-- BAD (slow on page 1000):
SELECT * FROM Orders ORDER BY Id OFFSET 10000 ROWS FETCH NEXT 20 ROWS ONLY;
-- Scans 10020 rows, discards 10000!

-- GOOD (keyset pagination):
SELECT TOP 20 * FROM Orders WHERE Id > @lastSeenId ORDER BY Id;
-- Seeks directly to the right position — constant time regardless of page!

-- Avoid SELECT * in production:
SELECT * FROM Users;  -- Reads all columns, can't use covering indexes
SELECT Id, Name, Email FROM Users;  -- Only needed columns, covering index possible

-- Parameter sniffing mitigation:
-- When first execution uses atypical value, plan is cached for that value
OPTION (RECOMPILE)  -- Forces fresh plan each time (CPU cost)
OPTION (OPTIMIZE FOR (@param = 'typical_value'))  -- Hint for optimizer
OPTION (OPTIMIZE FOR UNKNOWN)  -- Use average statistics`,
            language: 'sql'
        }
    ],
    questions: [
        {"question":"What is the difference between INNER, LEFT, RIGHT, and FULL OUTER JOIN?","difficulty":"easy","answer":"<p>All joins combine rows from two tables on a condition, differing in which unmatched rows they keep. <strong>INNER JOIN</strong> returns only rows with a match in both tables. <strong>LEFT (OUTER) JOIN</strong> returns all rows from the left table plus matches from the right (NULLs where no match). <strong>RIGHT JOIN</strong> is the mirror — all right rows plus matching left. <strong>FULL OUTER JOIN</strong> returns all rows from both, matched where possible and NULL-filled otherwise.</p><p>Choose by which side must be preserved: INNER when both must match, LEFT when you need all of the primary table regardless of matches (e.g., all customers with-or-without orders).</p>","explanation":"Think of two guest lists. INNER keeps only people on both lists; LEFT keeps everyone on the first list (blank where they are missing from the second); FULL keeps everyone from both, blanks where either is missing.","bestPractices":["Pick the join by which side must be fully preserved","Use LEFT JOIN + IS NULL to find rows lacking a match","Index the join keys for performance"],"commonMistakes":["Using INNER JOIN and silently dropping unmatched rows","Filtering the right table in WHERE, turning a LEFT JOIN into an INNER","Forgetting NULLs from outer joins in later conditions"],"interviewTip":"Explain each by \"which unmatched rows survive,\" and mention the classic bug: a WHERE on the right table collapses a LEFT JOIN back to INNER.","followUp":["Why can a WHERE clause turn a LEFT JOIN into an INNER JOIN?","How do you find rows with no match?","What is a CROSS JOIN?"]},
        {"question":"What is the difference between WHERE and HAVING, and how does GROUP BY relate to them?","difficulty":"medium","answer":"<p><strong>WHERE</strong> filters individual rows <em>before</em> grouping/aggregation; <strong>GROUP BY</strong> then collapses rows into groups; <strong>HAVING</strong> filters those <em>groups</em> after aggregation. So WHERE cannot reference aggregate functions (they do not exist yet), while HAVING can (<code>HAVING COUNT(*) &gt; 5</code>).</p><p>Logical order: FROM/JOIN -&gt; WHERE -&gt; GROUP BY -&gt; HAVING -&gt; SELECT -&gt; ORDER BY. For performance, filter as much as possible in WHERE (fewer rows to group) and reserve HAVING for conditions on aggregates.</p>","explanation":"WHERE is bouncing individuals at the door before they form teams; HAVING is disqualifying whole teams after they have formed and been scored.","bestPractices":["Filter rows in WHERE, groups in HAVING","Push filters into WHERE to reduce grouped data","Remember the logical processing order"],"commonMistakes":["Putting aggregate conditions in WHERE (error)","Using HAVING for row filters that belong in WHERE (slower)","Assuming SELECT runs before WHERE/GROUP BY"],"interviewTip":"State \"WHERE = before grouping (rows), HAVING = after grouping (aggregates)\" and recite the logical order — that clarity is what is tested.","followUp":["What is the logical query processing order?","Why cannot you use a SELECT alias in WHERE?","When is HAVING without GROUP BY valid?"]},
        {
            question: 'What is the difference between a clustered and non-clustered index? When would you use each?',
            difficulty: 'easy',
            answer: `<p>A <strong>clustered index</strong> defines the physical storage order of rows — the table IS the index (leaf nodes contain actual data rows). Only one per table. A <strong>non-clustered index</strong> is a separate B-tree structure with pointers (bookmarks) back to the data rows. Up to 999 per table.</p>`,
            code: `-- CLUSTERED INDEX:
-- • Physical order of data on disk
-- • Only ONE per table (usually the primary key)
-- • Leaf level = actual data rows
-- • Best for: range scans, sequential access, primary key lookups
CREATE CLUSTERED INDEX IX_Orders_PK ON Orders(OrderId);

-- Query that benefits from clustered:
SELECT * FROM Orders WHERE OrderId BETWEEN 1000 AND 2000;
-- Physical pages are sequential → minimal I/O

-- NON-CLUSTERED INDEX:
-- • Separate B-tree, leaf contains: key columns + row locator
-- • Row locator = clustered key (if clustered exists) or RID (heap)
-- • Many per table (but each has write cost)
-- • Best for: specific column lookups, foreign key joins
CREATE NONCLUSTERED INDEX IX_Orders_Customer ON Orders(CustomerId);

-- When to use each:
-- Clustered: Primary key (IDENTITY), date ranges (OrderDate), sequential access
-- Non-clustered: Foreign keys, WHERE/JOIN columns, filtered queries

-- COVERING INDEX (non-clustered that eliminates Key Lookup):
CREATE NONCLUSTERED INDEX IX_Orders_Cover
ON Orders(CustomerId)
INCLUDE (OrderDate, TotalAmount);
-- Query answered entirely from index — no trip to base table!

-- The Key Lookup problem:
-- Non-clustered finds row → must go back to clustered index for other columns
-- If query returns many rows: thousands of Key Lookups = slow!
-- Fix: INCLUDE the needed columns in the index`,
            language: 'sql',
            bestPractices: [
                'Choose clustered index key carefully: narrow, unique, ever-increasing (IDENTITY)',
                'Create non-clustered indexes for frequently filtered/joined columns',
                'Use INCLUDE to create covering indexes and eliminate Key Lookups',
                'Consider filtered indexes for queries targeting a subset of rows'
            ],
            commonMistakes: [
                'Using GUID as clustered key (random inserts cause page splits and fragmentation)',
                'Creating too many non-clustered indexes (slows writes proportionally)',
                'Not considering column order in composite indexes (leftmost prefix rule)',
                'Ignoring Key Lookups in execution plans (major performance issue at scale)'
            ],
            interviewTip: 'Draw the B-tree structure: clustered leaf = data pages; non-clustered leaf = key + pointer. Explain why covering indexes are powerful: the query never touches the actual table. Mention the trade-off: each index doubles write cost for its columns.',
            followUp: ['What is a covering index?', 'Why is GUID bad as a clustered key?', 'What is the leftmost prefix rule?', 'How many indexes is too many?'],
            seniorPerspective: 'I start index design by analyzing the top 20 slowest queries (Query Store or DMVs). For each, I check the execution plan for Table Scans and Key Lookups, then create targeted covering indexes. I never add indexes speculatively.',
            architectPerspective: 'Index strategy is a system-level decision: read-heavy OLTP benefits from many indexes, write-heavy systems suffer. I separate concerns: OLTP database (few targeted indexes) + read replica (additional indexes for reporting) to optimize both patterns independently.'
        },
        {
            question: 'What is a SARGable query and why does it matter for index usage?',
            difficulty: 'medium',
            answer: `<p><strong>SARGable</strong> (Search ARGument ABLE) means a WHERE clause condition can use an index seek. Non-SARGable conditions force index scans or table scans because the optimizer cannot navigate the B-tree efficiently when the indexed column is wrapped in a function or expression.</p>`,
            code: `-- SARGable — optimizer can SEEK the index:
WHERE OrderDate >= '2024-01-01'          -- Direct comparison ✓
WHERE CustomerId = 5                      -- Equality ✓
WHERE LastName LIKE 'Sm%'                 -- Prefix wildcard ✓
WHERE Amount BETWEEN 100 AND 500          -- Range ✓

-- Non-SARGable — forces SCAN (reads entire index):
WHERE YEAR(OrderDate) = 2024              -- Function on column ✗
WHERE DATEADD(day, 30, CreatedDate) > GETDATE()  -- Function ✗
WHERE LEFT(LastName, 2) = 'Sm'           -- Function on column ✗
WHERE LastName LIKE '%mith'              -- Leading wildcard ✗
WHERE Price + Tax > 100                   -- Expression on column ✗
WHERE ISNULL(MiddleName, '') = ''        -- Function ✗
WHERE CAST(ZipCode AS INT) > 90000       -- Cast on column ✗

-- FIX patterns:
-- Instead of YEAR(OrderDate) = 2024:
WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01'

-- Instead of DATEADD(day, -30, GETDATE()) < CreatedDate:
WHERE CreatedDate > DATEADD(day, -30, GETDATE())  -- Function on constant, not column!

-- Instead of ISNULL(Status, '') = 'Active':
WHERE Status = 'Active'  -- Simpler and SARGable

-- Performance impact:
-- Table: 10 million rows, index on OrderDate
-- SARGable:     Index Seek → reads ~1000 rows → 3ms
-- Non-SARGable: Index Scan → reads 10,000,000 rows → 8 seconds

-- Implicit conversion (hidden non-SARGable!):
-- Column: VARCHAR(50), Parameter: NVARCHAR
WHERE VarcharColumn = N'value'  -- SQL Server converts EVERY row → scan!
-- Fix: match types: WHERE VarcharColumn = 'value'`,
            language: 'sql',
            bestPractices: [
                'Never apply functions to indexed columns in WHERE clauses',
                'Move expressions to the parameter side: column > DATEADD(..., GETDATE())',
                'Use computed columns with indexes for complex expressions that must be filtered',
                'Match parameter types to column types to avoid implicit conversions'
            ],
            commonMistakes: [
                'Using YEAR(), MONTH(), DAY() on date columns (use date range instead)',
                'LIKE with leading wildcard (forces scan — use full-text search instead)',
                'ISNULL/COALESCE in WHERE clauses (non-SARGable)',
                'Not noticing implicit conversions in execution plan warnings'
            ],
            interviewTip: 'The rule is simple: if you transform the COLUMN, the optimizer can\'t use the index. If you transform the VALUE, it can. Think of the B-tree: the optimizer needs to navigate by the stored value, not a derived one.',
            followUp: ['How do computed columns help with SARGability?', 'What are implicit conversions and how do you detect them?', 'Can full-text indexes handle leading wildcard searches?'],
            seniorPerspective: 'I review every WHERE clause for SARGability during code reviews. The most common offenders: ISNULL(), date functions, and type mismatches. I also check execution plan warnings for implicit conversions — they\'re silent performance killers.',
            architectPerspective: 'SARGability is a database design concern: if business logic requires WHERE UPPER(Email) = \'USER@EXAMPLE.COM\', design the schema with a computed persisted column and index that. Don\'t push the optimization burden to every query author.'
        },
        {
            question: 'What is a covering index, and how does it eliminate Key Lookups?',
            difficulty: 'medium',
            answer: `<p>A <strong>covering index</strong> is a non-clustered index that contains every column a query needs — both in its key and via the <code>INCLUDE</code> clause — so the query can be satisfied entirely from the index without touching the base table.</p>
            <p>Without a covering index, a non-clustered seek finds the matching rows but must perform a <strong>Key Lookup</strong> (or RID Lookup on a heap) back into the clustered index to fetch the remaining columns. One lookup per row is cheap; thousands of lookups for a large result set is a major cost and often flips the optimizer to a full scan instead.</p>
            <ul>
                <li><strong>Key columns</strong> — used for seeking/filtering and ordering (the WHERE/JOIN/ORDER BY columns).</li>
                <li><strong>INCLUDE columns</strong> — stored only at the leaf level, not the B-tree key; they satisfy the SELECT list without bloating the navigation structure.</li>
            </ul>`,
            explanation: 'A covering index is like a library index card that already prints the book summary on the card itself. You never have to walk to the shelf (the table) to get what you need — everything is right there on the card.',
            code: `-- Query that triggers a Key Lookup:
-- IX seeks on CustomerId, but Status/TotalAmount live in the base table
CREATE NONCLUSTERED INDEX IX_Orders_Customer ON Orders(CustomerId);

SELECT CustomerId, Status, TotalAmount
FROM Orders
WHERE CustomerId = 42;
-- Plan: Index Seek + Key Lookup (one lookup per matching row)

-- Covering index removes the lookup entirely:
CREATE NONCLUSTERED INDEX IX_Orders_Customer_Cover
ON Orders(CustomerId)            -- key: the seek predicate
INCLUDE (Status, TotalAmount);   -- leaf-only: satisfies the SELECT

SELECT CustomerId, Status, TotalAmount
FROM Orders
WHERE CustomerId = 42;
-- Plan: Index Seek only -- no Key Lookup, far fewer logical reads

-- Rule of thumb for the index:
-- Key      = columns in WHERE / JOIN / ORDER BY
-- INCLUDE  = columns that appear only in the SELECT list`,
            language: 'sql',
            bestPractices: [
                'Put seek/filter/sort columns in the key and pure output columns in INCLUDE',
                'Use covering indexes to remove Key Lookups flagged as high-cost in execution plans',
                'Keep INCLUDE columns lean — wide INCLUDE lists inflate index size and write cost',
                'Consider a filtered covering index when the query targets a small, well-known subset'
            ],
            commonMistakes: [
                'Adding every column to the key instead of using INCLUDE (bloats the B-tree)',
                'INCLUDE-ing large columns (e.g., NVARCHAR(MAX)) and doubling storage unnecessarily',
                'Creating covering indexes for rarely-run queries (write cost outweighs the benefit)',
                'Ignoring the missing-index DMV suggestions that already point to needed INCLUDE columns'
            ],
            interviewTip: 'Explain the trip back to the table: a non-clustered seek only knows the key + row locator, so any extra column forces a Key Lookup. INCLUDE puts those extra columns at the leaf so the table is never touched. Mention that many small lookups can make the optimizer pick a scan instead.',
            followUp: ['What is the difference between a Key Lookup and a RID Lookup?', 'When does the optimizer abandon a seek+lookup for a scan?', 'How do missing-index DMVs suggest INCLUDE columns?'],
            seniorPerspective: 'When a query is hot, I check the plan for a Key Lookup and read its column list — those columns go straight into INCLUDE. I resist the urge to make one giant covering index per table; I tailor a small covering index to the two or three queries that actually matter.',
            architectPerspective: 'Covering indexes trade write throughput and storage for read speed. On write-heavy OLTP I keep them minimal; for reporting workloads I push covering and filtered indexes onto a read replica so the primary stays lean and the analytical queries still get index-only scans.'
        },
        {
            question: 'How do you read a SQL Server execution plan? Which operators signal trouble?',
            difficulty: 'hard',
            answer: `<p>An execution plan is the optimizer\'s chosen strategy: which indexes it uses, the join algorithms, sorts, and the estimated vs actual row counts. Read it right-to-left, top-to-bottom, following the data flow, and pay attention to operator cost percentages and arrow thickness (rows flowing between operators).</p>
            <p><strong>Access operators:</strong></p>
            <ul>
                <li><strong>Index Seek</strong> — B-tree navigation to specific rows, O(log n). The goal for selective predicates.</li>
                <li><strong>Index/Table Scan</strong> — reads the whole structure. Fine for small tables or when most rows qualify; a red flag on a large table with a selective filter.</li>
                <li><strong>Key/RID Lookup</strong> — fetching extra columns from the base table; expensive in bulk (fix with a covering index).</li>
            </ul>
            <p><strong>Join operators:</strong> Nested Loops (small outer input), Hash Match (large unsorted inputs), Merge Join (both inputs sorted).</p>`,
            explanation: 'Reading a plan is like reading a recipe backwards from the finished dish: you trace each ingredient (data flow) to see where the expensive prep happened. The fattest arrows and the highest-cost steps are where the kitchen is slowing down.',
            code: `-- Capture the cost signals:
SET STATISTICS IO ON;    -- logical reads per table
SET STATISTICS TIME ON;  -- CPU + elapsed time

-- Slow version: function on the column -> Index Scan
SELECT OrderId, CustomerId, TotalAmount
FROM Orders
WHERE YEAR(OrderDate) = 2024;
-- Plan: Clustered Index Scan, Logical reads: ~50000

-- Faster: SARGable range -> Index Seek
CREATE NONCLUSTERED INDEX IX_Orders_OrderDate
ON Orders(OrderDate) INCLUDE (CustomerId, TotalAmount);

SELECT OrderId, CustomerId, TotalAmount
FROM Orders
WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01';
-- Plan: Index Seek, Logical reads: ~120

-- Red flags to hunt for in a plan:
-- 1. Scan on a large table where the filter is selective (missing/unused index)
-- 2. Key Lookup with high cost percentage (make a covering index)
-- 3. Sort operator that an index could satisfy via ORDER BY
-- 4. Big gap between Estimated and Actual row counts (stale statistics)
-- 5. Hash Match / Sort spilling to tempdb (memory grant warning)
-- 6. Implicit conversion warning on a join/filter column (type mismatch)`,
            language: 'sql',
            bestPractices: [
                'Compare Estimated vs Actual rows — large gaps mean stale stats or bad cardinality estimates',
                'Use the actual plan (with runtime stats) for diagnosis, the estimated plan for quick what-ifs',
                'Target the highest-cost operator and the thickest arrows first',
                'Treat warning triangles (spills, implicit conversions, missing stats) as priority fixes'
            ],
            commonMistakes: [
                'Trusting operator cost percentages as absolute truth (they are estimates, not measurements)',
                'Optimizing a low-cost operator while ignoring the dominant one',
                'Reading the plan left-to-right and misjudging data flow',
                'Ignoring the estimated-vs-actual row discrepancy that explains a bad join choice'
            ],
            interviewTip: 'Name the trio Seek/Scan/Lookup and explain when each is acceptable. Then show you reason about cardinality: a Nested Loops over a huge outer input is wrong because it should have been a Hash Match — usually caused by a bad row estimate from stale statistics.',
            followUp: ['When is a Table Scan actually the right choice?', 'What causes a Hash Match to spill to tempdb?', 'How does a large estimated-vs-actual gap mislead the optimizer?'],
            seniorPerspective: 'I lean on Query Store to find regressed plans and compare them over time rather than eyeballing a single plan. The first thing I check is estimated vs actual rows — most "mysterious" slow plans trace back to a cardinality misestimate, not a missing index.',
            architectPerspective: 'Plan stability is an architectural concern at scale. I standardize on Query Store for plan regression tracking, control parameter sniffing with OPTIMIZE FOR or RECOMPILE where it matters, and treat consistent plan shape as part of the performance SLA rather than a per-query firefight.'
        },
        {
            question: 'What are statistics in SQL Server, and how do stale statistics degrade query performance?',
            difficulty: 'advanced',
            answer: `<p><strong>Statistics</strong> are histograms and density information that describe the distribution of values in a column or index. The query optimizer uses them to estimate how many rows a predicate will return (cardinality), which drives every downstream decision: seek vs scan, join algorithm, memory grant, and parallelism.</p>
            <p>When statistics are <strong>stale</strong> — many rows changed since the last update — estimates diverge from reality. The optimizer might estimate 10 rows when 1,000,000 qualify, choose a Nested Loops join or a tiny memory grant, and produce a plan that is catastrophically slow. SQL Server auto-updates stats after roughly 20% of rows change (a lower, dynamic threshold on large tables in modern versions), but bulk loads and skewed data can still leave them outdated.</p>`,
            explanation: 'Statistics are like a store\'s inventory estimate used to staff the checkout lanes. If the estimate says "10 customers today" but 10,000 show up, you open one lane and chaos follows. Updating the estimate (stats) lets you plan the right number of lanes (the right execution plan).',
            code: `-- Inspect what the optimizer sees:
DBCC SHOW_STATISTICS('Orders', 'IX_Orders_CustomerId');
-- Header: last updated date, rows, rows sampled
-- Density vector + histogram: the value distribution

-- Detect potentially stale stats (rows modified since last update):
SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    s.name AS StatName,
    sp.last_updated,
    sp.rows,
    sp.modification_counter
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(s.object_id, s.stats_id) sp
WHERE sp.modification_counter > 0
ORDER BY sp.modification_counter DESC;

-- Refresh statistics:
UPDATE STATISTICS Orders IX_Orders_CustomerId WITH FULLSCAN;  -- one index
UPDATE STATISTICS Orders WITH FULLSCAN;                       -- whole table

-- Symptom of stale stats in a plan:
-- Estimated Number of Rows = 12, Actual Number of Rows = 480000
-- -> optimizer picked Nested Loops + a tiny memory grant -> tempdb spill

-- Mitigations:
-- 1. Keep AUTO_UPDATE_STATISTICS ON (default)
-- 2. Schedule manual UPDATE STATISTICS after large bulk loads
-- 3. Use FULLSCAN for skewed columns where sampling misleads`,
            language: 'sql',
            bestPractices: [
                'Leave AUTO_CREATE_STATISTICS and AUTO_UPDATE_STATISTICS enabled',
                'Manually update stats after bulk loads or large deletes (auto-update may not trigger in time)',
                'Use WITH FULLSCAN on skewed columns where the default sample misrepresents the distribution',
                'Watch estimated-vs-actual row counts as the primary stale-stats signal'
            ],
            commonMistakes: [
                'Assuming index REBUILD always refreshes all relevant stats (it updates index stats with fullscan, but not column stats)',
                'Disabling auto-update to "stabilize" plans and then forgetting to update manually',
                'Relying on sampled stats for highly skewed data',
                'Blaming missing indexes when the real cause is a cardinality misestimate from stale stats'
            ],
            interviewTip: 'Connect stats directly to plan choice: the optimizer is only as good as its row estimates. Use the estimated-vs-actual gap as your diagnostic. Note the nuance that index REBUILD refreshes index statistics but not auto-created column statistics.',
            followUp: ['Does ALTER INDEX REBUILD update column statistics?', 'What is the auto-update threshold on large tables?', 'How does the cardinality estimator differ across compatibility levels?'],
            seniorPerspective: 'After any large ETL load I explicitly UPDATE STATISTICS rather than waiting for the auto threshold, because a 50-million-row table can change plenty without crossing it. When a plan suddenly regresses, stale stats are my first suspect, checked via dm_db_stats_properties.',
            architectPerspective: 'I treat statistics maintenance as a first-class part of the data platform, not an afterthought — scheduled jobs, post-load refreshes, and compatibility-level decisions that pin or update the cardinality estimator. Getting estimates right system-wide prevents the periodic plan-regression fire drills that plague teams who leave it all to defaults.'
        },
        {
            question: 'What is index fragmentation, and when do you REORGANIZE vs REBUILD an index?',
            difficulty: 'expert',
            answer: `<p><strong>Fragmentation</strong> measures how out-of-order and how full index pages are. <strong>Logical (external) fragmentation</strong> means the physical page order no longer matches the logical key order, hurting read-ahead during range scans. <strong>Internal fragmentation</strong> means pages are partially empty, wasting space and I/O. Both grow over time from inserts, updates, and especially page splits on tables with random key inserts (e.g., random GUIDs).</p>
            <p>The classic thresholds:</p>
            <ul>
                <li><strong>5%–30%</strong> fragmentation → <code>ALTER INDEX ... REORGANIZE</code>: lightweight, always online, defragments leaf pages in place and compacts based on fill factor.</li>
                <li><strong>&gt; 30%</strong> fragmentation → <code>ALTER INDEX ... REBUILD</code>: drops and recreates the index, removing all fragmentation and refreshing index statistics with a full scan. Can run ONLINE on Enterprise edition.</li>
                <li><strong>&lt; 5%</strong> → leave it alone; maintenance costs more than the benefit.</li>
            </ul>
            <p><strong>Fill factor</strong> reserves free space per page so future inserts split less often.</p>`,
            explanation: 'Think of a bookshelf. Reorganize is tidying the books back into order on the existing shelves — quick and you can keep browsing. Rebuild is emptying the shelves and re-shelving everything perfectly — slower and ideally done when the library is closed (or with the online option), but it leaves things pristine.',
            code: `-- Measure fragmentation:
SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent,
    ips.page_count
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
JOIN sys.indexes i 
    ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 5
  AND ips.page_count > 1000           -- ignore tiny indexes; noise below ~1000 pages
ORDER BY ips.avg_fragmentation_in_percent DESC;

-- 5%-30%: REORGANIZE (light, always online)
ALTER INDEX IX_Orders_CustomerId ON Orders REORGANIZE;

-- > 30%: REBUILD (thorough; refreshes stats with fullscan)
ALTER INDEX IX_Orders_CustomerId ON Orders 
REBUILD WITH (ONLINE = ON, FILLFACTOR = 90);

-- Rebuild all indexes on a table:
ALTER INDEX ALL ON Orders REBUILD WITH (ONLINE = ON);

-- Fill factor guidance:
-- 100% (default) -> packed pages, best for read-mostly / static tables
-- 80-90%         -> reserve space on insert/update-heavy tables to reduce splits`,
            language: 'sql',
            bestPractices: [
                'Skip maintenance on small indexes (under ~1000 pages) — fragmentation there is noise',
                'Use REORGANIZE for moderate fragmentation, REBUILD for heavy fragmentation',
                'Set fill factor based on write pattern (lower for insert-heavy, 100% for read-only)',
                'Prefer ONLINE = ON rebuilds (Enterprise) to avoid blocking, and schedule in low-traffic windows'
            ],
            commonMistakes: [
                'Rebuilding every index nightly regardless of fragmentation (wastes I/O and log space)',
                'Setting a low fill factor everywhere (wastes space and increases reads on stable tables)',
                'Forgetting that REORGANIZE does NOT update statistics (REBUILD does, with fullscan)',
                'Using a random GUID clustered key and then fighting constant page splits with maintenance'
            ],
            interviewTip: 'Quote the 5/30 thresholds and the page_count filter — naming the small-index exception signals real operational experience. Stress the key difference: REBUILD refreshes statistics with a full scan, REORGANIZE does not, so a rebuild can fix both fragmentation and stale stats at once.',
            followUp: ['Why does a random GUID clustered key cause page splits?', 'How does fill factor influence page split frequency?', 'Does ONLINE rebuild fully eliminate blocking?'],
            seniorPerspective: 'I do not run blanket nightly rebuilds; I use a threshold-based maintenance job (Ola Hallengren-style) that reorganizes in the 5–30% band and rebuilds above it, skipping tiny indexes. On modern SSD storage, logical fragmentation matters far less than it did on spinning disks, so I weight page density and stats freshness more heavily.',
            architectPerspective: 'Maintenance strategy depends on storage and edition. On SSD/Azure SQL, I focus on stats and page density over chasing low fragmentation numbers, and I design clustered keys to be ever-increasing so fragmentation barely accrues. The architectural fix for chronic fragmentation is the right key choice up front, not heavier maintenance jobs downstream.'
        }
    ]
});
