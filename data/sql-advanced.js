/* ═══════════════════════════════════════════════════════════════════
   SQL Server — CTEs, Window Functions, Stored Procedures, Dynamic SQL
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('sql-advanced', {
    title: 'Advanced SQL Queries',
    description: 'Common Table Expressions, window functions, partitioning, stored procedures, dynamic SQL, and advanced query patterns for reporting and data transformation.',
    sections: [
        {
            title: 'Common Table Expressions (CTEs)',
            content: `<p><strong>CTEs</strong> provide named, temporary result sets within a single query. They improve readability, enable recursion, and can be referenced multiple times. They are NOT materialized (executed inline like a subquery).</p>`,
            code: `-- Basic CTE — named subquery for readability
WITH ActiveUsers AS (
    SELECT Id, Name, Email, DepartmentId
    FROM Users
    WHERE IsActive = 1 AND LastLogin > DATEADD(day, -30, GETDATE())
),
DepartmentStats AS (
    SELECT DepartmentId, COUNT(*) AS UserCount, 
           AVG(DATEDIFF(day, HireDate, GETDATE())) AS AvgTenureDays
    FROM ActiveUsers
    GROUP BY DepartmentId
)
SELECT d.Name AS Department, ds.UserCount, ds.AvgTenureDays
FROM DepartmentStats ds
JOIN Departments d ON ds.DepartmentId = d.Id
ORDER BY ds.UserCount DESC;

-- Recursive CTE — hierarchical data (org chart, categories)
WITH OrgChart AS (
    -- Anchor: top-level managers (no manager)
    SELECT Id, Name, ManagerId, 0 AS Level, 
           CAST(Name AS VARCHAR(500)) AS Path
    FROM Employees
    WHERE ManagerId IS NULL
    
    UNION ALL
    
    -- Recursive: employees under each manager
    SELECT e.Id, e.Name, e.ManagerId, oc.Level + 1,
           CAST(oc.Path + ' > ' + e.Name AS VARCHAR(500))
    FROM Employees e
    JOIN OrgChart oc ON e.ManagerId = oc.Id
    WHERE oc.Level < 10  -- Safety: prevent infinite recursion
)
SELECT Level, Name, Path
FROM OrgChart
ORDER BY Path;
-- Output:
-- 0  CEO           CEO
-- 1  VP Eng        CEO > VP Eng
-- 2  Tech Lead     CEO > VP Eng > Tech Lead
-- 3  Developer     CEO > VP Eng > Tech Lead > Developer

-- CTE for pagination:
WITH OrderedResults AS (
    SELECT *, ROW_NUMBER() OVER (ORDER BY CreatedDate DESC) AS RowNum
    FROM Products
    WHERE CategoryId = @categoryId
)
SELECT * FROM OrderedResults
WHERE RowNum BETWEEN @offset + 1 AND @offset + @pageSize;`,
            language: 'sql'
        },
        {
            title: 'Window Functions',
            content: `<p><strong>Window functions</strong> perform calculations across a set of rows related to the current row — without collapsing them into groups (unlike GROUP BY). They enable running totals, rankings, moving averages, and lead/lag analysis in a single pass.</p>`,
            code: `-- ROW_NUMBER — unique sequential number per partition
SELECT 
    Name, Department, Salary,
    ROW_NUMBER() OVER (PARTITION BY Department ORDER BY Salary DESC) AS Rank
FROM Employees;
-- Top earner per department = WHERE Rank = 1

-- RANK vs DENSE_RANK vs ROW_NUMBER
-- Salaries: 100K, 90K, 90K, 80K
-- ROW_NUMBER: 1, 2, 3, 4  (always unique)
-- RANK:       1, 2, 2, 4  (ties get same rank, gaps after)
-- DENSE_RANK: 1, 2, 2, 3  (ties get same rank, no gaps)

-- Running total:
SELECT 
    OrderDate, Amount,
    SUM(Amount) OVER (ORDER BY OrderDate) AS RunningTotal,
    SUM(Amount) OVER (PARTITION BY CustomerId ORDER BY OrderDate) AS CustomerRunningTotal
FROM Orders;

-- Moving average (last 7 days):
SELECT 
    OrderDate, Amount,
    AVG(Amount) OVER (
        ORDER BY OrderDate 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS MovingAvg7Day
FROM DailySales;

-- LAG / LEAD — access previous/next row values
SELECT 
    OrderDate, Amount,
    LAG(Amount, 1) OVER (ORDER BY OrderDate) AS PreviousAmount,
    Amount - LAG(Amount, 1) OVER (ORDER BY OrderDate) AS DayOverDayChange,
    LEAD(Amount, 1) OVER (ORDER BY OrderDate) AS NextAmount
FROM DailySales;

-- FIRST_VALUE / LAST_VALUE:
SELECT 
    Name, Department, Salary,
    FIRST_VALUE(Name) OVER (PARTITION BY Department ORDER BY Salary DESC) AS TopEarner,
    Salary - FIRST_VALUE(Salary) OVER (PARTITION BY Department ORDER BY Salary DESC) AS GapFromTop
FROM Employees;

-- Percentile / distribution:
SELECT 
    Name, Salary,
    PERCENT_RANK() OVER (ORDER BY Salary) AS PercentRank,
    NTILE(4) OVER (ORDER BY Salary) AS Quartile
FROM Employees;`,
            language: 'sql'
        },
        {
            title: 'Stored Procedures & Dynamic SQL',
            content: `<p><strong>Stored procedures</strong> encapsulate SQL logic server-side — they are precompiled, parameterized, and provide a security boundary. <strong>Dynamic SQL</strong> builds queries at runtime for flexible filtering/sorting but requires careful handling to prevent SQL injection.</p>`,
            code: `-- Stored procedure with proper patterns:
CREATE OR ALTER PROCEDURE [dbo].[GetOrdersByFilter]
    @CustomerId INT = NULL,
    @StartDate DATE = NULL,
    @EndDate DATE = NULL,
    @Status VARCHAR(20) = NULL,
    @SortColumn VARCHAR(50) = 'OrderDate',
    @SortDirection VARCHAR(4) = 'DESC',
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    -- Dynamic SQL for flexible sorting (safe with whitelist)
    DECLARE @SQL NVARCHAR(MAX);
    DECLARE @ParamDef NVARCHAR(500);
    DECLARE @ValidSort VARCHAR(50);

    -- Whitelist sort columns (prevent injection)
    SET @ValidSort = CASE @SortColumn
        WHEN 'OrderDate' THEN 'o.OrderDate'
        WHEN 'Total' THEN 'o.TotalAmount'
        WHEN 'Customer' THEN 'c.Name'
        ELSE 'o.OrderDate'
    END;

    SET @SQL = N'
        SELECT o.Id, o.OrderDate, o.TotalAmount, o.Status, c.Name AS Customer
        FROM Orders o
        JOIN Customers c ON o.CustomerId = c.Id
        WHERE 1=1';

    -- Build WHERE dynamically (parameters prevent injection)
    IF @CustomerId IS NOT NULL
        SET @SQL += N' AND o.CustomerId = @pCustomerId';
    IF @StartDate IS NOT NULL
        SET @SQL += N' AND o.OrderDate >= @pStartDate';
    IF @EndDate IS NOT NULL
        SET @SQL += N' AND o.OrderDate <= @pEndDate';
    IF @Status IS NOT NULL
        SET @SQL += N' AND o.Status = @pStatus';

    -- Safe sort (whitelisted) + pagination
    SET @SQL += N' ORDER BY ' + @ValidSort + ' ' + 
        CASE WHEN @SortDirection = 'ASC' THEN 'ASC' ELSE 'DESC' END;
    SET @SQL += N' OFFSET @pOffset ROWS FETCH NEXT @pPageSize ROWS ONLY';

    SET @ParamDef = N'@pCustomerId INT, @pStartDate DATE, @pEndDate DATE, 
                      @pStatus VARCHAR(20), @pOffset INT, @pPageSize INT';

    EXEC sp_executesql @SQL, @ParamDef,
        @pCustomerId = @CustomerId,
        @pStartDate = @StartDate,
        @pEndDate = @EndDate,
        @pStatus = @Status,
        @pOffset = (@PageNumber - 1) * @PageSize,
        @pPageSize = @PageSize;
END;`,
            language: 'sql',
            callout: { type: 'warning', title: 'SQL Injection Prevention', text: 'NEVER concatenate user input into SQL strings. Always use sp_executesql with parameters for dynamic values. Only concatenate whitelisted, validated constants (column names, sort directions) that you control.' }
        },
        {
            title: 'PIVOT, UNPIVOT & Temporal Tables',
            content: `<p>Advanced data transformation and auditing patterns in SQL Server.</p>`,
            code: `-- PIVOT — rows to columns (cross-tab reports)
SELECT CustomerId, [2023], [2024], [2025]
FROM (
    SELECT CustomerId, YEAR(OrderDate) AS OrderYear, TotalAmount
    FROM Orders
) AS Source
PIVOT (
    SUM(TotalAmount) FOR OrderYear IN ([2023], [2024], [2025])
) AS PivotTable;

-- Dynamic PIVOT (when columns aren't known at compile time):
DECLARE @columns NVARCHAR(MAX), @sql NVARCHAR(MAX);
SELECT @columns = STRING_AGG(QUOTENAME(Year), ',')
FROM (SELECT DISTINCT YEAR(OrderDate) AS Year FROM Orders) y;

SET @sql = N'SELECT CustomerId, ' + @columns + '
FROM (SELECT CustomerId, YEAR(OrderDate) AS Year, TotalAmount FROM Orders) src
PIVOT (SUM(TotalAmount) FOR Year IN (' + @columns + ')) pvt';
EXEC sp_executesql @sql;

-- UNPIVOT — columns to rows (normalize denormalized data)
SELECT ProductId, Quarter, Revenue
FROM Products
UNPIVOT (Revenue FOR Quarter IN (Q1Revenue, Q2Revenue, Q3Revenue, Q4Revenue)) unpvt;

-- Temporal Tables (system-versioned) — automatic history tracking
CREATE TABLE Employees (
    Id INT PRIMARY KEY,
    Name VARCHAR(100),
    Salary DECIMAL(10,2),
    Department VARCHAR(50),
    ValidFrom DATETIME2 GENERATED ALWAYS AS ROW START,
    ValidTo DATETIME2 GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME (ValidFrom, ValidTo)
) WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.EmployeesHistory));

-- Query: What was Alice's salary on March 1, 2024?
SELECT * FROM Employees FOR SYSTEM_TIME AS OF '2024-03-01'
WHERE Name = 'Alice';

-- Query: All salary changes for Alice
SELECT * FROM Employees FOR SYSTEM_TIME ALL
WHERE Name = 'Alice'
ORDER BY ValidFrom;`,
            language: 'sql'
        }
    ],
    questions: [
        {"question":"What is a window function, and how does it differ from GROUP BY aggregation?","difficulty":"hard","answer":"<p>A <strong>window function</strong> (e.g., <code>ROW_NUMBER()</code>, <code>RANK()</code>, <code>SUM() OVER (...)</code>) computes a value across a set of rows related to the current row (the \"window\") <em>without collapsing them</em>. Unlike GROUP BY, which reduces many rows to one per group, a window function returns a value for <strong>every</strong> row while still seeing the group.</p><p>This lets you do running totals, rankings, and \"compare each row to its group aggregate\" in one pass. The <code>OVER</code> clause defines the window with <code>PARTITION BY</code> (grouping) and <code>ORDER BY</code> (ordering within the window).</p>","code":"SELECT name, department, salary,\n       RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rank_in_dept,\n       AVG(salary) OVER (PARTITION BY department) AS dept_avg\nFROM Employees;  -- every row kept, plus per-department rank and average","language":"sql","explanation":"GROUP BY is summarizing each class into one report card (losing individual students). A window function keeps every student visible while also showing their rank within the class.","bestPractices":["Use window functions for rankings/running totals without collapsing rows","Define the window with PARTITION BY / ORDER BY","Prefer them over self-joins for row-vs-group comparisons"],"commonMistakes":["Reaching for GROUP BY + join when a window function is cleaner","Misunderstanding PARTITION BY vs GROUP BY","Forgetting ORDER BY for ranking/running-total windows"],"interviewTip":"Key line: \"window functions keep every row while computing over a related set; GROUP BY collapses rows.\" Give a ranking or running-total example.","followUp":["ROW_NUMBER vs RANK vs DENSE_RANK?","How do you compute a running total?","What is a window frame (ROWS BETWEEN)?"]},
        {"question":"What is a CTE, and when would you use a recursive CTE?","difficulty":"medium","answer":"<p>A <strong>CTE</strong> (Common Table Expression, <code>WITH name AS (...)</code>) is a named, temporary result set that exists for one statement, improving readability by breaking a complex query into named steps and enabling self-reference. It is not automatically materialized (unlike a temp table) and is scoped to the following statement.</p><p>A <strong>recursive CTE</strong> references itself to traverse hierarchical/graph data — an anchor member plus a recursive member that repeats until no new rows are produced. Use it for org charts, category trees, bill-of-materials, and path traversal that a single flat query cannot express.</p>","code":"WITH RECURSIVE Subordinates AS (\n    SELECT id, name, manager_id FROM Employees WHERE id = @bossId   -- anchor\n    UNION ALL\n    SELECT e.id, e.name, e.manager_id\n    FROM Employees e JOIN Subordinates s ON e.manager_id = s.id     -- recurse\n)\nSELECT * FROM Subordinates;","language":"sql","explanation":"A CTE is naming a sub-step of a recipe so the main recipe reads cleanly. A recursive CTE is following a family tree branch by branch until you run out of descendants.","bestPractices":["Use CTEs to make complex queries readable","Use recursive CTEs for hierarchies/trees/graphs","Cap recursion depth to avoid runaway queries"],"commonMistakes":["Assuming a CTE is materialized/cached like a temp table","Infinite recursion from missing/incorrect termination","Using recursive CTEs where a set-based query is faster"],"interviewTip":"Define CTE (readability + self-reference, single statement) and recursive CTE (anchor + recursive member for hierarchies) with the org-chart example.","followUp":["How does a CTE differ from a temp table or view?","How do you prevent infinite recursion?","When is a temp table better than a CTE?"]},
        {
            question: 'Explain window functions. How do they differ from GROUP BY? Give practical examples.',
            difficulty: 'medium',
            answer: `<p><strong>Window functions</strong> compute values across a set of rows (the "window") related to the current row WITHOUT collapsing rows. <code>GROUP BY</code> reduces many rows into one per group; window functions keep all rows and add computed columns. This enables rankings, running totals, and row comparisons in a single query.</p>`,
            code: `-- GROUP BY collapses rows:
SELECT Department, AVG(Salary) AS AvgSalary
FROM Employees GROUP BY Department;
-- Result: 1 row per department (detail lost)

-- Window function preserves rows:
SELECT Name, Department, Salary,
    AVG(Salary) OVER (PARTITION BY Department) AS DeptAvg,
    Salary - AVG(Salary) OVER (PARTITION BY Department) AS DiffFromAvg
FROM Employees;
-- Result: every employee row + department averages alongside

-- Practical: Top 3 earners per department
WITH Ranked AS (
    SELECT *, ROW_NUMBER() OVER (
        PARTITION BY Department ORDER BY Salary DESC
    ) AS Rank
    FROM Employees
)
SELECT * FROM Ranked WHERE Rank <= 3;

-- Practical: Running total of daily revenue
SELECT OrderDate, DailyRevenue,
    SUM(DailyRevenue) OVER (ORDER BY OrderDate) AS CumulativeRevenue
FROM DailySales;

-- Practical: Month-over-month growth
SELECT Month, Revenue,
    LAG(Revenue) OVER (ORDER BY Month) AS PrevMonth,
    CAST((Revenue - LAG(Revenue) OVER (ORDER BY Month)) * 100.0 
         / NULLIF(LAG(Revenue) OVER (ORDER BY Month), 0) AS DECIMAL(5,1)) AS GrowthPct
FROM MonthlyRevenue;

-- Window frame specification:
-- ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW (default for SUM)
-- ROWS BETWEEN 6 PRECEDING AND CURRENT ROW (7-day moving average)
-- ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING (3-point smoothing)`,
            language: 'sql',
            bestPractices: [
                'Use ROW_NUMBER for pagination and top-N-per-group queries',
                'Use LAG/LEAD for period-over-period comparisons (no self-join needed)',
                'Specify explicit window frames for moving calculations (ROWS BETWEEN)',
                'Combine CTEs with window functions for readable multi-step analytics'
            ],
            commonMistakes: [
                'Confusing ROWS vs RANGE frame (RANGE includes ties, can give unexpected results)',
                'Not understanding that LAST_VALUE needs explicit frame (default excludes following rows)',
                'Using subqueries for running totals when window functions are cleaner and faster',
                'Applying window functions in WHERE clause (must use CTE or subquery instead)'
            ],
            interviewTip: 'Show a real problem solved both ways: self-join (complex, slow) vs window function (elegant, single pass). The canonical example: "find the difference from the previous row" — LAG makes it trivial, self-join makes it painful.',
            followUp: ['What is the difference between ROWS and RANGE?', 'Can you filter on a window function result?', 'How do window functions affect performance?'],
            seniorPerspective: 'Window functions replaced 80% of my self-joins and correlated subqueries. For reporting dashboards, I combine window functions with indexed views to pre-compute rankings and running totals that would otherwise be expensive.',
            architectPerspective: 'In data warehouse designs, window functions enable real-time analytics without pre-aggregation tables. Combined with columnstore indexes, queries like "running YTD revenue by region partitioned by product line" execute in milliseconds over billions of rows.'
        },
        {
            question: 'What is a recursive CTE and when would you use one?',
            difficulty: 'advanced',
            answer: `<p>A <strong>recursive CTE</strong> references itself to process hierarchical/graph data — org charts, category trees, bill of materials, route finding. It has an <strong>anchor</strong> (base case) and a <strong>recursive member</strong> that joins back to itself, expanding the result level by level until no new rows are produced.</p>`,
            code: `-- Structure:
WITH RecursiveCTE AS (
    -- Anchor member: starting rows (no self-reference)
    SELECT ...
    FROM Table
    WHERE [root condition]
    
    UNION ALL
    
    -- Recursive member: joins back to CTE itself
    SELECT ...
    FROM Table t
    JOIN RecursiveCTE r ON t.ParentId = r.Id
    WHERE [termination safety]
)
SELECT * FROM RecursiveCTE;

-- Example: Category tree (e-commerce)
WITH CategoryTree AS (
    SELECT Id, Name, ParentId, 0 AS Depth, 
           CAST(Name AS VARCHAR(500)) AS FullPath
    FROM Categories
    WHERE ParentId IS NULL  -- Root categories
    
    UNION ALL
    
    SELECT c.Id, c.Name, c.ParentId, ct.Depth + 1,
           CAST(ct.FullPath + ' > ' + c.Name AS VARCHAR(500))
    FROM Categories c
    JOIN CategoryTree ct ON c.ParentId = ct.Id
    WHERE ct.Depth < 10  -- Safety limit
)
SELECT * FROM CategoryTree ORDER BY FullPath;
-- Electronics > Phones > Smartphones > Android

-- Example: Find all subordinates of a manager
WITH Subordinates AS (
    SELECT Id, Name, ManagerId, 1 AS Level
    FROM Employees WHERE ManagerId = @managerId
    
    UNION ALL
    
    SELECT e.Id, e.Name, e.ManagerId, s.Level + 1
    FROM Employees e
    JOIN Subordinates s ON e.ManagerId = s.Id
    WHERE s.Level < 20
)
SELECT * FROM Subordinates;

-- Example: Generate date series (no table needed)
WITH DateSeries AS (
    SELECT CAST('2024-01-01' AS DATE) AS Date
    UNION ALL
    SELECT DATEADD(day, 1, Date) FROM DateSeries
    WHERE Date < '2024-12-31'
)
SELECT Date FROM DateSeries
OPTION (MAXRECURSION 400); -- Override default 100 limit

-- Performance note:
-- Recursive CTEs can be slow for deep hierarchies
-- Alternative: hierarchyid type, materialized path, nested sets`,
            language: 'sql',
            bestPractices: [
                'Always include a depth/level counter as termination safety',
                'Set MAXRECURSION option for known depth limits',
                'Consider materialized path or hierarchyid for frequently queried hierarchies',
                'Use anchor conditions that select a small starting set'
            ],
            commonMistakes: [
                'Forgetting termination condition (infinite recursion → error at MAXRECURSION limit)',
                'Not using OPTION (MAXRECURSION n) when default 100 is insufficient',
                'Using recursive CTEs for simple hierarchies where a self-join would suffice',
                'Poor performance on deep trees (consider indexed materialized path instead)'
            ],
            interviewTip: 'Walk through the execution: anchor executes first (level 0), then recursive member expands one level at a time until no new rows are returned. Draw the tree being built level by level. Mention MAXRECURSION default is 100.',
            followUp: ['What are alternatives to recursive CTEs for hierarchies?', 'How does hierarchyid work?', 'What is MAXRECURSION and when would you change it?'],
            seniorPerspective: 'I use recursive CTEs for ad-hoc hierarchy queries (org charts, permission inheritance). For hot-path queries on hierarchical data, I materialize the path as a column and use LIKE for ancestor queries — much faster at scale.',
            architectPerspective: 'Hierarchical data appears everywhere: permissions, org structures, category trees, folder systems. The modeling choice (adjacency list + recursive CTE vs. materialized path vs. nested sets vs. closure table) depends on read vs write ratio and query patterns. I choose closure table for complex relationship queries and materialized path for simple ancestry lookups.'
        },
        {
            question: 'Explain PIVOT and UNPIVOT. How do you handle columns that are not known until runtime?',
            difficulty: 'medium',
            answer: `<p><strong>PIVOT</strong> rotates rows into columns — turning distinct values of one column into column headers and aggregating the rest (classic cross-tab reports like revenue-by-year). <strong>UNPIVOT</strong> does the reverse: it normalizes wide, denormalized columns back into rows.</p>
            <p>Standard PIVOT requires you to list the target columns literally, which fails when the set of values (e.g., the list of years or product codes) is not known at compile time. The solution is <strong>dynamic PIVOT</strong>: query the distinct values, build a comma-separated column list with <code>STRING_AGG</code> + <code>QUOTENAME</code>, then assemble and run the statement with <code>sp_executesql</code>.</p>`,
            explanation: 'PIVOT is like turning a tall stack of receipts (one row per sale) into a spreadsheet grid where each column is a month and each cell is the total. UNPIVOT flattens that grid back into individual line items. Dynamic PIVOT is needed when you do not know the month columns ahead of time — you discover them first, then build the grid.',
            code: `-- Static PIVOT: years known at design time
SELECT CustomerId, [2023], [2024], [2025]
FROM (
    SELECT CustomerId, YEAR(OrderDate) AS OrderYear, TotalAmount
    FROM Orders
) AS src
PIVOT (
    SUM(TotalAmount) FOR OrderYear IN ([2023], [2024], [2025])
) AS pvt;

-- UNPIVOT: wide quarterly columns -> one row per quarter
SELECT ProductId, Quarter, Revenue
FROM Products
UNPIVOT (Revenue FOR Quarter IN (Q1Revenue, Q2Revenue, Q3Revenue, Q4Revenue)) AS u;

-- Dynamic PIVOT: years discovered at runtime
DECLARE @cols NVARCHAR(MAX), @sql NVARCHAR(MAX);

SELECT @cols = STRING_AGG(QUOTENAME(OrderYear), ',')
FROM (SELECT DISTINCT YEAR(OrderDate) AS OrderYear FROM Orders) y;

SET @sql = N'
SELECT CustomerId, ' + @cols + N'
FROM (SELECT CustomerId, YEAR(OrderDate) AS OrderYear, TotalAmount FROM Orders) src
PIVOT (SUM(TotalAmount) FOR OrderYear IN (' + @cols + N')) pvt;';

EXEC sp_executesql @sql;
-- QUOTENAME brackets each value so the column list cannot be injected`,
            language: 'sql',
            bestPractices: [
                'Use QUOTENAME when building dynamic column lists to neutralize injection and odd characters',
                'Prefer conditional aggregation (SUM(CASE WHEN ...)) for simple, fixed pivots — it is clearer',
                'Build dynamic PIVOT SQL with sp_executesql, not raw EXEC of concatenated user input',
                'UNPIVOT only the columns you need and alias the value/category columns explicitly'
            ],
            commonMistakes: [
                'Hardcoding pivot columns that change over time (next year breaks the report)',
                'Forgetting QUOTENAME and exposing dynamic PIVOT to injection or syntax errors',
                'Assuming UNPIVOT keeps NULLs — by default it removes rows with NULL values',
                'Pivoting in SQL when the presentation layer could format the cross-tab more flexibly'
            ],
            interviewTip: 'Mention that PIVOT is just syntactic sugar over SUM(CASE WHEN ...) aggregation, and that the real-world version is almost always dynamic. Showing the STRING_AGG + QUOTENAME + sp_executesql pattern signals you have built actual reports.',
            followUp: ['How would you write the same pivot using conditional aggregation?', 'Why does QUOTENAME matter in dynamic PIVOT?', 'How does UNPIVOT treat NULL values?'],
            seniorPerspective: 'I avoid pivoting in the database when the column set is volatile — it is often cleaner to return tall/narrow result sets and let the reporting tool or API pivot for display. When I must pivot in SQL, it is dynamic PIVOT with QUOTENAME, never string-glued user input.',
            architectPerspective: 'Cross-tab shaping is a presentation concern that frequently leaks into the data layer. I push fixed, performance-critical pivots into indexed views or the warehouse, and keep volatile, user-driven pivots out of SQL entirely so schema changes do not ripple through brittle dynamic statements.'
        },
        {
            question: 'What are the benefits of stored procedures, and how do they relate to parameter sniffing?',
            difficulty: 'hard',
            answer: `<p><strong>Stored procedures</strong> encapsulate SQL logic on the server. Their main benefits:</p>
            <ul>
                <li><strong>Plan reuse</strong> — the compiled execution plan is cached and reused across calls, saving recompilation cost.</li>
                <li><strong>Security boundary</strong> — you can grant EXECUTE on the proc without granting table-level permissions, and parameters resist injection.</li>
                <li><strong>Encapsulation / network efficiency</strong> — complex multi-statement logic runs in one round trip and can be versioned independently of application code.</li>
            </ul>
            <p><strong>Parameter sniffing</strong> is a double-edged consequence of plan caching: on first execution SQL Server "sniffs" the parameter values and builds a plan optimized for them. If those first values are atypical (e.g., a customer with millions of rows vs. one with three), the cached plan can be terrible for later, more typical calls. Fixes include <code>OPTION (RECOMPILE)</code>, <code>OPTIMIZE FOR</code>, <code>OPTIMIZE FOR UNKNOWN</code>, or splitting divergent workloads into separate procedures.</p>`,
            explanation: 'A stored procedure is like a saved route in a GPS: the first trip computes the best route and reuses it. Parameter sniffing is when that first route was planned for rush hour, so it keeps sending you the scenic way at 3am. Sometimes you need to recompute the route for the current conditions.',
            code: `CREATE OR ALTER PROCEDURE dbo.GetOrdersByCustomer
    @CustomerId INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Plan is cached on first call, optimized for the first @CustomerId seen
    SELECT OrderId, OrderDate, TotalAmount
    FROM Orders
    WHERE CustomerId = @CustomerId
    ORDER BY OrderDate DESC;
END;

-- Parameter sniffing problem:
-- First call: @CustomerId = 7 (3 orders)   -> plan uses a Nested Loops seek
-- Later call: @CustomerId = 99 (2M orders) -> same plan -> millions of lookups -> slow

-- Fix 1: recompile each execution (fresh plan, small CPU cost per call)
SELECT ... WHERE CustomerId = @CustomerId
OPTION (RECOMPILE);

-- Fix 2: optimize for a representative value
OPTION (OPTIMIZE FOR (@CustomerId = 99));

-- Fix 3: ignore the sniffed value, use average density
OPTION (OPTIMIZE FOR UNKNOWN);

-- Fix 4: copy parameter into a local variable (disables sniffing for that var)
DECLARE @LocalId INT = @CustomerId;  -- optimizer uses average estimate`,
            language: 'sql',
            bestPractices: [
                'Use OPTION (RECOMPILE) on procs whose ideal plan varies wildly by parameter',
                'Grant EXECUTE on procedures instead of direct table permissions for a tighter security surface',
                'Always SET NOCOUNT ON in procedures to suppress extra result metadata',
                'Split fundamentally different workloads into separate procedures rather than one catch-all'
            ],
            commonMistakes: [
                'Blaming "slow SQL" without realizing a sniffed plan is the cause',
                'Adding OPTION (RECOMPILE) everywhere (CPU cost on high-frequency procs)',
                'Using local-variable copies blindly (average estimate can be worse than a good sniff)',
                'Putting business transactions in procs without TRY/CATCH and proper rollback handling'
            ],
            interviewTip: 'Define parameter sniffing precisely: the plan is built for the FIRST parameter values and reused. Then list the toolbox (RECOMPILE, OPTIMIZE FOR, OPTIMIZE FOR UNKNOWN, local variables) and explain the trade-off of each — that breadth is what separates senior answers.',
            followUp: ['How does OPTION (RECOMPILE) differ from OPTIMIZE FOR UNKNOWN?', 'How can you clear a single bad cached plan?', 'When is plan caching actually undesirable?'],
            seniorPerspective: 'When a proc is "randomly" slow, parameter sniffing is my first hypothesis — I check whether the cached plan suits a typical parameter via sys.dm_exec_query_stats. For the rare proc with wildly skewed inputs I reach for RECOMPILE; for the rest I let the cache do its job.',
            architectPerspective: 'Procedures vs. inline/ORM SQL is an architectural debate. I use procedures where a hardened security boundary, server-side batching, or DBA-controlled tuning matters, and lean on parameterized application queries elsewhere. Either way, the cardinal rule is parameterization for plan reuse and injection safety.'
        },
        {
            question: 'How do you write dynamic SQL safely, and why is sp_executesql preferred over EXEC?',
            difficulty: 'advanced',
            answer: `<p><strong>Dynamic SQL</strong> builds a query string at runtime — useful for optional filters, runtime sort columns, or dynamic PIVOT. The danger is <strong>SQL injection</strong>: concatenating user input into the string lets an attacker alter the query.</p>
            <p>The safe pattern is <code>sp_executesql</code> with <strong>parameters</strong>. Values (the data the user supplies) flow through declared parameters and are never parsed as SQL. Only <strong>identifiers</strong> you cannot parameterize — column or table names, sort direction — should be injected, and only after validating them against a <strong>whitelist</strong> (or wrapping with <code>QUOTENAME</code>).</p>
            <p><code>sp_executesql</code> beats raw <code>EXEC(@sql)</code> because it supports typed parameters (preventing injection) and produces parameterized, reusable cached plans, whereas concatenated <code>EXEC</code> strings defeat plan caching and open the injection door.</p>`,
            explanation: 'Dynamic SQL with parameters is like a mail-merge template: the template (SQL) is fixed and trusted, and the merge fields (parameters) are slotted in as plain data that can never become part of the template instructions. Concatenation erases that boundary and lets the data rewrite the letter.',
            code: `CREATE OR ALTER PROCEDURE dbo.SearchOrders
    @CustomerId INT = NULL,
    @Status     VARCHAR(20) = NULL,
    @SortColumn VARCHAR(30) = 'OrderDate',
    @SortDir    VARCHAR(4)  = 'DESC'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @sql NVARCHAR(MAX) = N'
        SELECT OrderId, CustomerId, Status, OrderDate, TotalAmount
        FROM Orders WHERE 1 = 1';

    -- Values: bound as parameters (injection-proof)
    IF @CustomerId IS NOT NULL SET @sql += N' AND CustomerId = @pCustomerId';
    IF @Status     IS NOT NULL SET @sql += N' AND Status = @pStatus';

    -- Identifiers: whitelist, never concatenate raw input
    DECLARE @col SYSNAME = CASE @SortColumn
        WHEN 'OrderDate'   THEN 'OrderDate'
        WHEN 'TotalAmount' THEN 'TotalAmount'
        ELSE 'OrderDate' END;
    DECLARE @dir NVARCHAR(4) = CASE WHEN @SortDir = 'ASC' THEN N'ASC' ELSE N'DESC' END;

    SET @sql += N' ORDER BY ' + QUOTENAME(@col) + N' ' + @dir;

    EXEC sp_executesql @sql,
         N'@pCustomerId INT, @pStatus VARCHAR(20)',
         @pCustomerId = @CustomerId,
         @pStatus     = @Status;
END;

-- NEVER do this -- injectable and uncacheable:
-- SET @sql = 'SELECT * FROM Orders WHERE Status = ''' + @Status + '''';
-- EXEC(@sql);`,
            language: 'sql',
            bestPractices: [
                'Bind all user-supplied VALUES via sp_executesql parameters, never concatenation',
                'Whitelist identifiers (column/table/sort) and wrap with QUOTENAME',
                'Declare @sql as NVARCHAR(MAX) and build with N-prefixed Unicode literals',
                'Keep dynamic SQL minimal — only make dynamic what truly must vary'
            ],
            commonMistakes: [
                'Concatenating user input directly into the SQL string (injection + no plan reuse)',
                'Using EXEC(@sql) instead of sp_executesql, losing parameterization and plan caching',
                'Treating QUOTENAME as a cure-all for values (it is for identifiers, parameters are for values)',
                'Building unbounded numbers of distinct query strings, bloating the plan cache'
            ],
            interviewTip: 'Draw the value-vs-identifier distinction clearly: values go through parameters, identifiers go through a whitelist + QUOTENAME. Then state the two reasons sp_executesql wins over EXEC: injection safety and parameterized plan reuse.',
            followUp: ['What is the difference between sp_executesql and EXEC?', 'How does QUOTENAME prevent identifier injection?', 'How can excessive dynamic SQL bloat the plan cache?'],
            seniorPerspective: 'My rule on every code review: if user input touches a SQL string, it must be a parameter, full stop. The only thing I ever concatenate is a value drawn from a fixed whitelist of identifiers, and even then through QUOTENAME. This single discipline eliminates the most common and most dangerous database vulnerability.',
            architectPerspective: 'Dynamic SQL is powerful but corrosive when overused — it scatters injection risk and inflates the plan cache. I confine it to a few well-reviewed, parameterized procedures or push optional-filter scenarios to the application layer with parameterized commands, keeping the attack surface auditable in one place.'
        },
        {
            question: 'What does the MERGE statement do, and what are its well-known pitfalls?',
            difficulty: 'expert',
            answer: `<p><strong>MERGE</strong> performs an "upsert" plus delete in a single statement: it compares a source set against a target and runs <code>WHEN MATCHED</code> (update/delete), <code>WHEN NOT MATCHED BY TARGET</code> (insert), and <code>WHEN NOT MATCHED BY SOURCE</code> (delete) actions. It is concise and runs as one set-based operation, ideal for synchronizing a target table with incoming data.</p>
            <p>However, MERGE has a long history of subtle bugs and caveats:</p>
            <ul>
                <li>It is <strong>not atomic against concurrency</strong> the way people assume — without proper locking hints (<code>HOLDLOCK</code>/<code>SERIALIZABLE</code>) two concurrent MERGEs can both insert, causing duplicate-key races.</li>
                <li>It has had documented engine bugs and unexpected behavior with triggers, foreign keys, and indexed views.</li>
                <li>The statement must end with a semicolon, and the source must produce at most one row per target key (or it errors).</li>
            </ul>
            <p>Many practitioners prefer separate, explicit UPDATE + INSERT statements (or INSERT ... WHERE NOT EXISTS) for predictability.</p>`,
            explanation: 'MERGE is like a single machine that sorts incoming mail into "update existing file," "create new file," or "shred the obsolete file" in one pass. Convenient, but if two operators run it at the same time without a lock on the cabinet, they can both decide to create the same new file — hence the duplicate-key races people get bitten by.',
            code: `-- Upsert + delete to sync Target with Source:
MERGE dbo.Target AS t
USING dbo.Source AS s
    ON t.Id = s.Id
WHEN MATCHED AND (t.Value <> s.Value) THEN
    UPDATE SET t.Value = s.Value, t.UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Id, Value, UpdatedAt) VALUES (s.Id, s.Value, SYSUTCDATETIME())
WHEN NOT MATCHED BY SOURCE THEN
    DELETE
OUTPUT $action, inserted.Id, deleted.Id;   -- audit what happened

-- Concurrency-safe MERGE needs an explicit serializable lock hint:
MERGE dbo.Target WITH (HOLDLOCK) AS t   -- prevents insert/insert race
USING dbo.Source AS s ON t.Id = s.Id
WHEN NOT MATCHED THEN INSERT (Id, Value) VALUES (s.Id, s.Value);

-- Many teams prefer the explicit, predictable alternative:
UPDATE t SET t.Value = s.Value
FROM dbo.Target t JOIN dbo.Source s ON t.Id = s.Id
WHERE t.Value <> s.Value;

INSERT INTO dbo.Target (Id, Value)
SELECT s.Id, s.Value FROM dbo.Source s
WHERE NOT EXISTS (SELECT 1 FROM dbo.Target t WHERE t.Id = s.Id);`,
            language: 'sql',
            bestPractices: [
                'Add WITH (HOLDLOCK) to MERGE to avoid concurrent insert/insert duplicate-key races',
                'Use the OUTPUT clause with $action to audit which rows were inserted/updated/deleted',
                'Ensure the source yields at most one row per join key, or MERGE errors',
                'Prefer explicit UPDATE + INSERT (or INSERT ... WHERE NOT EXISTS) when predictability matters more than brevity'
            ],
            commonMistakes: [
                'Assuming MERGE is automatically concurrency-safe (it is not without HOLDLOCK)',
                'Hitting duplicate-key errors under load from missing locking hints',
                'Forgetting the mandatory terminating semicolon',
                'Using MERGE on tables with triggers/FKs/indexed views where known engine bugs have bitten others'
            ],
            interviewTip: 'Show awareness, not just syntax: MERGE looks elegant but senior engineers know its reputation for concurrency races and engine bugs. Mention the HOLDLOCK requirement and that many teams deliberately avoid it in favor of explicit UPDATE/INSERT for safety.',
            followUp: ['Why does MERGE need HOLDLOCK for safe concurrent upserts?', 'How does OUTPUT $action help auditing?', 'When would you choose INSERT ... WHERE NOT EXISTS over MERGE?'],
            seniorPerspective: 'I use MERGE for batch ETL syncs where it runs single-threaded, and I always add HOLDLOCK. For high-concurrency upsert hot paths I avoid MERGE entirely and use an explicit UPDATE-then-INSERT (or a unique constraint + catch the duplicate) because its concurrency semantics are easier to reason about and free of MERGE\'s historical edge cases.',
            architectPerspective: 'The MERGE question is really about engineering judgment: brevity versus predictability and a documented bug history. I treat MERGE as an ETL/batch tool, never as a casual upsert primitive in concurrent OLTP code, and I encode that as a team guideline so individual developers do not rediscover the duplicate-key races the hard way.'
        }
    ]
});
