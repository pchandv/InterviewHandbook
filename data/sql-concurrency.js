/* ═══════════════════════════════════════════════════════════════════
   SQL Server — Transactions, Isolation Levels, Deadlocks, Concurrency
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('sql-concurrency', {
    title: 'Transactions & Concurrency',
    description: 'ACID properties, isolation levels, deadlock detection and resolution, optimistic vs pessimistic concurrency, and designing for concurrent access in high-throughput systems.',
    sections: [
        {
            title: 'ACID Properties & Transaction Basics',
            content: `<p>A <strong>transaction</strong> is a unit of work that is either fully completed or fully rolled back. ACID guarantees ensure data integrity even during failures and concurrent access.</p>
            <ul>
                <li><strong>Atomicity</strong> — all or nothing (entire transaction succeeds or rolls back)</li>
                <li><strong>Consistency</strong> — database moves from one valid state to another</li>
                <li><strong>Isolation</strong> — concurrent transactions don't interfere with each other</li>
                <li><strong>Durability</strong> — committed data survives system crashes (written to disk/log)</li>
            </ul>`,
            code: `-- Explicit transaction with error handling:
BEGIN TRY
    BEGIN TRANSACTION;
    
    -- Debit source account
    UPDATE Accounts SET Balance = Balance - @Amount
    WHERE AccountId = @SourceId AND Balance >= @Amount;
    
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Insufficient funds or account not found', 16, 1);
    END
    
    -- Credit destination account
    UPDATE Accounts SET Balance = Balance + @Amount
    WHERE AccountId = @DestId;
    
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Destination account not found', 16, 1);
    END
    
    -- Record transfer
    INSERT INTO Transfers (SourceId, DestId, Amount, TransferDate)
    VALUES (@SourceId, @DestId, @Amount, GETUTCDATE());
    
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    
    -- Re-throw or log error
    THROW;
END CATCH;

-- Transaction in EF Core:
using var transaction = await _dbContext.Database.BeginTransactionAsync();
try
{
    await _dbContext.Orders.AddAsync(order);
    await _dbContext.SaveChangesAsync();
    
    await _paymentService.ChargeAsync(order.Total); // External call
    
    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}`,
            language: 'sql'
        },
        {
            title: 'Isolation Levels',
            content: `<p><strong>Isolation levels</strong> control how much transactions can "see" each other's uncommitted changes. Higher isolation = more consistency but less concurrency (more blocking). Lower isolation = better performance but risk of anomalies.</p>`,
            code: `-- Isolation levels (least to most restrictive):

-- READ UNCOMMITTED — can read uncommitted data ("dirty reads")
-- Use: reporting queries where approximate data is OK
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
-- Same as adding WITH (NOLOCK) to every table
SELECT * FROM Orders WITH (NOLOCK); -- Fast but potentially inaccurate

-- READ COMMITTED (DEFAULT in SQL Server) — only reads committed data
-- Prevents: dirty reads
-- Allows: non-repeatable reads, phantom reads
-- Behavior: shared locks released immediately after read
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- REPEATABLE READ — holds shared locks until transaction ends
-- Prevents: dirty reads, non-repeatable reads
-- Allows: phantom reads (new rows inserted by others)
-- Use: when you read-then-update and need stability
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- SERIALIZABLE — most restrictive, prevents all anomalies
-- Prevents: dirty reads, non-repeatable reads, phantom reads
-- Method: range locks prevent new rows in query range
-- Use: financial calculations requiring absolute consistency
-- WARNING: highest blocking, lowest concurrency!
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- SNAPSHOT ISOLATION — optimistic, row-versioning (no locks for reads!)
-- Prevents: dirty reads, non-repeatable reads, phantom reads
-- Method: readers see a point-in-time snapshot (versioned rows)
-- No blocking between readers and writers!
ALTER DATABASE MyDb SET ALLOW_SNAPSHOT_ISOLATION ON;
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;
-- Trade-off: uses tempdb for row versions, update conflicts possible

-- READ COMMITTED SNAPSHOT (RCSI) — snapshot behavior at read committed level
ALTER DATABASE MyDb SET READ_COMMITTED_SNAPSHOT ON;
-- All READ COMMITTED queries now use row versioning (no shared locks!)
-- Best of both worlds for most OLTP applications
-- Trade-off: increased tempdb usage, slight write overhead`,
            language: 'sql',
            callout: { type: 'info', title: 'RCSI is Usually Best', text: 'READ_COMMITTED_SNAPSHOT ON is the recommended default for most applications. Readers never block writers, writers never block readers. Azure SQL Database enables this by default. Only use higher isolation for specific operations that need it.' }
        },
        {
            title: 'Deadlocks & Optimistic Concurrency',
            content: `<p><strong>Deadlocks</strong> occur when two transactions each hold a lock the other needs. SQL Server detects and kills the cheaper transaction. <strong>Optimistic concurrency</strong> avoids locks entirely — it detects conflicts at save time using a version/timestamp column.</p>`,
            code: `-- DEADLOCK example:
-- Transaction 1: UPDATE Orders WHERE Id=1  (locks Orders row)
--                UPDATE Products WHERE Id=5 (waits for Products lock)
-- Transaction 2: UPDATE Products WHERE Id=5 (locks Products row)
--                UPDATE Orders WHERE Id=1   (waits for Orders lock)
-- DEADLOCK! SQL Server kills one transaction.

-- Deadlock prevention strategies:
-- 1. Consistent lock ordering (always lock tables in same order)
-- 2. Keep transactions short (less time holding locks)
-- 3. Use RCSI (readers don't take shared locks)
-- 4. Index properly (range locks are narrower with good indexes)
-- 5. Use NOLOCK for read-only reporting queries

-- Detecting deadlocks:
-- Extended Events (modern):
CREATE EVENT SESSION [DeadlockCapture] ON SERVER
ADD EVENT sqlserver.xml_deadlock_report;
-- Or: System health session captures them automatically

-- OPTIMISTIC CONCURRENCY — no locks, detect conflicts at save time
-- Add a version column:
ALTER TABLE Products ADD RowVersion ROWVERSION; -- Auto-incremented on update

-- Read product (note the version):
SELECT Id, Name, Price, RowVersion FROM Products WHERE Id = @Id;
-- User edits... time passes...

-- Update with version check:
UPDATE Products 
SET Name = @NewName, Price = @NewPrice
WHERE Id = @Id AND RowVersion = @OriginalRowVersion;

IF @@ROWCOUNT = 0
    -- Someone else modified it! Handle conflict:
    RAISERROR('Concurrency conflict: record modified by another user', 16, 1);

-- EF Core optimistic concurrency:
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    
    [Timestamp] // SQL Server ROWVERSION
    public byte[] RowVersion { get; set; }
}

// EF Core automatically adds WHERE RowVersion = @original to UPDATE
// Throws DbUpdateConcurrencyException on conflict
try
{
    product.Price = newPrice;
    await _db.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException)
{
    // Reload and retry, or show conflict to user
    var entry = ex.Entries.Single();
    var dbValues = await entry.GetDatabaseValuesAsync();
    // Merge or overwrite...
}`,
            language: 'sql'
        }
    ],
    questions: [
        {"question":"What are the SQL transaction isolation levels, and which anomalies does each prevent?","difficulty":"hard","answer":"<p>The four standard isolation levels, weakest to strongest: <strong>Read Uncommitted</strong> (allows dirty reads), <strong>Read Committed</strong> (prevents dirty reads; allows non-repeatable reads and phantoms), <strong>Repeatable Read</strong> (also prevents non-repeatable reads; may allow phantoms), and <strong>Serializable</strong> (prevents all — dirty, non-repeatable, and phantom reads, as if transactions ran one at a time).</p><p>Higher isolation means more correctness but more locking/contention and lower concurrency. The three anomalies: <em>dirty read</em> (reading uncommitted data), <em>non-repeatable read</em> (a row changes between reads), <em>phantom read</em> (new rows appear matching a prior query). Choose the lowest level that preserves your invariants; snapshot isolation (MVCC) offers consistency with less blocking.</p>","explanation":"It is like how strictly a shared document is locked: at one extreme everyone edits freely and sees half-finished changes (fast, messy); at the other, only one person edits at a time (correct, slow). You pick the strictness your task actually needs.","bestPractices":["Use the lowest isolation that protects your invariants","Consider snapshot isolation (MVCC) for consistency without heavy locking","Keep transactions short to reduce contention"],"commonMistakes":["Defaulting to Serializable everywhere (contention/deadlocks)","Read Uncommitted for correctness-sensitive reads","Long transactions holding locks"],"interviewTip":"Map each level to the anomaly it stops (dirty / non-repeatable / phantom) and note the concurrency trade-off; mention snapshot isolation as a modern middle ground.","followUp":["What is snapshot isolation / MVCC?","What is a phantom read exactly?","How do isolation levels cause deadlocks?"]},
        {"question":"What is the difference between optimistic and pessimistic concurrency control?","difficulty":"hard","answer":"<p><strong>Pessimistic</strong> concurrency locks a record when read/edited so others must wait, assuming conflicts are likely — it prevents conflicts but reduces concurrency and risks deadlocks and lock contention. <strong>Optimistic</strong> concurrency assumes conflicts are rare: it does not lock; instead it checks at write time whether the row changed since it was read (via a version/rowversion or timestamp column) and rejects the update if so, forcing a retry.</p><p>Use optimistic for low-contention, read-heavy workloads (web apps, EF Core's <code>[ConcurrencyCheck]</code>/rowversion) — better scalability. Use pessimistic when conflicts are frequent or the cost of losing work is high (e.g., inventory decrement under heavy contention).</p>","explanation":"Pessimistic is checking out a library book so nobody else can touch it. Optimistic is everyone photocopying it freely, then checking at return time whether someone else already changed the master — and redoing your edits if so.","bestPractices":["Optimistic (version/rowversion) for low-contention web workloads","Pessimistic for high-contention critical updates","Handle the optimistic conflict by retrying with fresh data"],"commonMistakes":["Pessimistic locking everywhere, killing concurrency","Optimistic without a version column (lost updates)","No retry/merge strategy on optimistic conflict"],"interviewTip":"Contrast \"lock upfront (pessimistic)\" vs \"detect at write via version (optimistic)\" and tie the choice to contention level; mention rowversion/EF concurrency tokens.","followUp":["How does a rowversion/concurrency token work?","How do you resolve an optimistic conflict?","When does pessimistic locking cause deadlocks?"]},
        {
            question: 'What are SQL Server isolation levels? When would you use each?',
            difficulty: 'medium',
            answer: `<p>Isolation levels control visibility between concurrent transactions — trading off consistency for concurrency. SQL Server offers five levels from least to most restrictive: Read Uncommitted, Read Committed (default), Repeatable Read, Serializable, and Snapshot.</p>`,
            code: `// Concurrency anomalies each level prevents:
//                         Dirty Read  Non-Repeatable  Phantom
// READ UNCOMMITTED          No           No            No
// READ COMMITTED            Yes          No            No
// REPEATABLE READ           Yes          Yes           No
// SERIALIZABLE              Yes          Yes           Yes
// SNAPSHOT                  Yes          Yes           Yes (via versioning)

// Practical guidance:
// READ COMMITTED + RCSI ON (recommended default):
// - Readers never block writers, writers never block readers
// - Uses row versioning in tempdb (small overhead)
// - Azure SQL default — Microsoft's recommendation
ALTER DATABASE MyApp SET READ_COMMITTED_SNAPSHOT ON;

// READ UNCOMMITTED / NOLOCK:
// - Use ONLY for approximate reporting on large tables
// - Never for transactional operations (can read half-written data!)
SELECT COUNT(*) FROM Orders WITH (NOLOCK); -- Approximate count, no blocking

// SERIALIZABLE:
// - Only for critical financial calculations
// - Example: checking balance then deducting (must be atomic)
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRANSACTION;
    SELECT @Balance = Balance FROM Accounts WHERE Id = @Id;
    IF @Balance >= @Amount
        UPDATE Accounts SET Balance = Balance - @Amount WHERE Id = @Id;
COMMIT;

// SNAPSHOT:
// - Long-running reads that need consistency without blocking
// - Reporting queries that must see a consistent point-in-time
// - Trade-off: update conflicts require application handling`,
            language: 'sql',
            bestPractices: [
                'Enable READ_COMMITTED_SNAPSHOT as your database default (RCSI)',
                'Use SNAPSHOT isolation for long-running analytical queries',
                'Reserve SERIALIZABLE for critical operations (checking then acting atomically)',
                'Never use NOLOCK for transactional operations — only approximate reporting'
            ],
            commonMistakes: [
                'Using NOLOCK everywhere "for performance" (reads corrupt/partial data)',
                'Not knowing the default is READ COMMITTED (which blocks readers on writes without RCSI)',
                'Using SERIALIZABLE broadly (causes severe blocking and deadlocks)',
                'Assuming SNAPSHOT prevents all conflicts (update conflicts still possible)'
            ],
            interviewTip: 'Draw the anomaly matrix (which level prevents what). Then recommend RCSI as the practical default — it eliminates reader/writer blocking with minimal overhead. Mention that Azure SQL uses it by default.',
            followUp: ['What is a dirty read vs phantom read?', 'How does RCSI use tempdb?', 'What is an update conflict in SNAPSHOT isolation?'],
            seniorPerspective: 'I enable RCSI on every new SQL Server database. It eliminates 90% of blocking issues without application changes. For the remaining 10% (financial atomicity), I use explicit SERIALIZABLE on specific operations.',
            architectPerspective: 'Isolation level choice is a system-wide performance decision. RCSI transforms blocking-heavy OLTP systems overnight — I\'ve seen 3x throughput improvement simply by enabling it. The tempdb overhead is negligible compared to eliminating reader/writer contention.'
        },
        {
            question: 'Explain optimistic vs pessimistic concurrency. When would you use each?',
            difficulty: 'advanced',
            answer: `<p><strong>Pessimistic concurrency</strong> locks data when reading it — preventing others from modifying it until the lock is released. <strong>Optimistic concurrency</strong> allows concurrent reads without locks but detects conflicts at write time using a version check. Choose based on conflict probability and tolerance for retries.</p>`,
            code: `// PESSIMISTIC — lock the row, nobody else can change it
BEGIN TRANSACTION;
SELECT * FROM Inventory WITH (UPDLOCK, ROWLOCK) -- Exclusive lock!
WHERE ProductId = @Id;
-- ... calculate new quantity ...
UPDATE Inventory SET Quantity = @NewQty WHERE ProductId = @Id;
COMMIT;
-- Other transactions WAIT until this commits/rolls back

// When to use pessimistic:
// - High contention (many users editing same row frequently)
// - Short operations (lock held briefly)
// - Cannot afford retry logic (financial debits)
// - Inventory count-down (race condition must be prevented)

// OPTIMISTIC — no locks, detect conflicts at save time
// Read (no lock):
SELECT Id, Name, Price, RowVersion FROM Products WHERE Id = @Id;
// ... user edits for 5 minutes ...
// Write (check version hasn't changed):
UPDATE Products SET Price = @NewPrice
WHERE Id = @Id AND RowVersion = @OriginalVersion;
IF @@ROWCOUNT = 0 THEN -- conflict! Someone else modified it

// When to use optimistic:
// - Low contention (rare for two users to edit same row)
// - Long think-time (user stares at form for minutes)
// - Read-heavy workload (most operations are reads)
// - Scalability (no locks held during user think-time)

// EF Core implementation:
[Timestamp]
public byte[] RowVersion { get; set; }
// On SaveChanges: WHERE Id=@Id AND RowVersion=@Original
// Throws DbUpdateConcurrencyException on conflict

// Conflict resolution strategies:
// 1. Last-write-wins (ignore conflict, overwrite)
// 2. First-write-wins (reject second save, show error)
// 3. Merge (combine changes if non-conflicting fields)
// 4. Ask user (show both versions, let them choose)

// Decision matrix:
// High contention + short operation → Pessimistic (locks)
// Low contention + long operation  → Optimistic (versions)
// Financial/inventory operations   → Pessimistic (can't afford conflict)
// User edit forms                  → Optimistic (long think-time)`,
            language: 'sql',
            bestPractices: [
                'Default to optimistic concurrency for web applications (low contention, long think-time)',
                'Use pessimistic locking for inventory/financial operations with high contention',
                'Always handle DbUpdateConcurrencyException in EF Core (don\'t ignore it)',
                'Keep pessimistic lock duration as short as possible (avoid in user-facing transactions)'
            ],
            commonMistakes: [
                'Using pessimistic locks with user think-time (locks held for minutes = blocking/deadlocks)',
                'Not implementing any concurrency control (last-write-wins silently loses data)',
                'Forgetting to check @@ROWCOUNT after optimistic update (conflict goes undetected)',
                'Holding database transactions open during external API calls (locks held too long)'
            ],
            interviewTip: 'The decision is about PROBABILITY of conflict: high probability = pessimistic (prevent conflict), low probability = optimistic (detect and handle conflict). Show you understand the scalability trade-off: pessimistic limits throughput, optimistic scales but needs retry logic.',
            followUp: ['How does EF Core handle concurrency conflicts?', 'What is a lost update problem?', 'How does ROWVERSION work internally?'],
            seniorPerspective: 'I use optimistic concurrency (EF Core [Timestamp]) for 95% of entities. For the 5% that need it (stock levels, account balances), I use SELECT...WITH(UPDLOCK) in a short transaction. The key: never hold pessimistic locks across user interactions or external calls.',
            architectPerspective: 'In distributed systems, optimistic concurrency extends beyond databases: ETags in REST APIs, vector clocks in distributed stores, CAS (Compare-And-Swap) in cache updates. The same principle applies at every layer: detect conflicts cheaply, resolve them explicitly.'
        },
        {
            question: 'What causes a deadlock in SQL Server, and how do you prevent and diagnose one?',
            difficulty: 'hard',
            answer: `<p>A <strong>deadlock</strong> occurs when two (or more) sessions each hold a lock the other needs, forming a cycle that can never resolve on its own. SQL Server\'s deadlock monitor detects the cycle and kills the cheapest transaction to roll back (the <strong>deadlock victim</strong>, error 1205), letting the other proceed.</p>
            <p><strong>Prevention</strong> centers on reducing lock contention and breaking cycles:</p>
            <ul>
                <li><strong>Consistent lock ordering</strong> — always access tables/rows in the same order across the codebase, so a cycle cannot form.</li>
                <li><strong>Short transactions</strong> — acquire locks late, release early; never wait on user input or external calls inside a transaction.</li>
                <li><strong>RCSI</strong> — readers using row versioning do not take shared locks, eliminating a huge class of reader/writer deadlocks.</li>
                <li><strong>Good indexes</strong> — seeks lock fewer rows than scans, narrowing the contention surface.</li>
            </ul>
            <p><strong>Diagnosis</strong> uses the deadlock graph captured by the system_health Extended Events session.</p>`,
            explanation: 'A deadlock is two people in a narrow hallway who each step aside in the same direction repeatedly, each waiting for the other to move. SQL Server is the referee who taps one on the shoulder and sends them back to the start (rollback) so the other can pass.',
            code: `-- Classic deadlock: two sessions lock in opposite order
-- Session A:                          Session B:
BEGIN TRAN;                            BEGIN TRAN;
UPDATE Orders   SET ... WHERE Id=1;    UPDATE Products SET ... WHERE Id=5;
-- (holds Orders #1)                   -- (holds Products #5)
UPDATE Products SET ... WHERE Id=5;    UPDATE Orders   SET ... WHERE Id=1;
-- waits for B's Products lock         -- waits for A's Orders lock
-- DEADLOCK -> SQL Server kills the cheaper one (error 1205)

-- Prevention 1: consistent ordering (both touch Orders THEN Products)
-- Prevention 2: keep the transaction tiny; no waits inside it
-- Prevention 3: enable RCSI so reads do not block writes
ALTER DATABASE MyApp SET READ_COMMITTED_SNAPSHOT ON;

-- Read the most recent deadlock graphs from system_health:
SELECT 
    xed.value('@timestamp', 'datetime2') AS WhenUtc,
    xed.query('.') AS DeadlockGraph
FROM (
    SELECT CAST(target_data AS XML) AS tx
    FROM sys.dm_xe_session_targets st
    JOIN sys.dm_xe_sessions s ON s.address = st.event_session_address
    WHERE s.name = 'system_health' AND st.target_name = 'ring_buffer'
) AS r
CROSS APPLY tx.nodes('//event[@name=\"xml_deadlock_report\"]') AS q(xed);

-- Application side: retry the victim (1205) with backoff
-- catch (SqlException ex) when (ex.Number == 1205) { /* retry */ }`,
            language: 'sql',
            bestPractices: [
                'Acquire locks in a consistent order everywhere to make cycles impossible',
                'Keep transactions short and never wait on user input or external I/O inside them',
                'Enable RCSI to remove reader/writer deadlocks',
                'Implement retry logic for the deadlock victim (error 1205) with exponential backoff'
            ],
            commonMistakes: [
                'Assuming deadlocks are bugs to eliminate entirely rather than transient conditions to retry',
                'Holding transactions open across UI round trips or HTTP calls (locks held far too long)',
                'Inconsistent table access order between different code paths',
                'Throwing more isolation (SERIALIZABLE) at the problem, which usually increases deadlocks'
            ],
            interviewTip: 'Define the cycle precisely and name the victim/error 1205. Then give the prevention trio — consistent lock ordering, short transactions, RCSI — and finish with "and I make the app retry the victim." That combination of prevention plus graceful handling is the senior signal.',
            followUp: ['How does a deadlock differ from simple blocking?', 'How does the deadlock monitor choose the victim?', 'Why does RCSI reduce deadlocks?'],
            seniorPerspective: 'I treat occasional deadlocks as inevitable in concurrent systems, so every transactional operation has idempotent retry-on-1205 logic. Then I attack root causes: I read the deadlock graph from system_health, find the conflicting lock order, and standardize the access sequence. RCSI alone removes the majority of them.',
            architectPerspective: 'Deadlock resilience is a system property, not a query fix. I bake retry-with-backoff into the data-access layer so every command inherits it, enable RCSI as a platform default, and treat recurring deadlock graphs as design feedback about transaction boundaries and access ordering across services.'
        },
        {
            question: 'What is the difference between blocking and a deadlock, and how do you find the root blocker?',
            difficulty: 'medium',
            answer: `<p><strong>Blocking</strong> is normal and temporary: one session holds a lock and another waits for it. The moment the first commits or rolls back, the waiter proceeds. A <strong>deadlock</strong> is a permanent, circular wait that can never resolve on its own — which is why SQL Server must intervene and kill a victim.</p>
            <p>Put simply: <em>all deadlocks involve blocking, but most blocking is not a deadlock.</em> Blocking only becomes a problem when it lasts too long — usually because a transaction is held open, a query scans instead of seeks, or a long-running statement holds locks.</p>
            <p>To find the root cause you trace the <strong>blocking chain</strong> back to the head blocker — the session that is waiting on nothing but is blocking others — using <code>sys.dm_exec_requests</code> and <code>sys.dm_os_waiting_tasks</code>.</p>`,
            explanation: 'Blocking is a queue at one checkout lane — annoying but it clears as soon as the person ahead pays. A deadlock is two shoppers each blocking the only aisle the other needs to reach the register: nobody moves until a manager (SQL Server) removes one of them.',
            code: `-- Find who is blocking whom (the blocking chain):
SELECT 
    r.session_id           AS BlockedSession,
    r.blocking_session_id  AS BlockerSession,
    r.wait_type,
    r.wait_time            AS WaitMs,
    r.wait_resource,
    t.text                 AS BlockedSql
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id <> 0;

-- The head blocker: blocks others but is itself blocked by no one
SELECT blocking_session_id
FROM sys.dm_exec_requests
WHERE blocking_session_id <> 0
  AND blocking_session_id NOT IN (
      SELECT session_id FROM sys.dm_exec_requests WHERE blocking_session_id <> 0
  );

-- Inspect what the head blocker is doing:
DBCC INPUTBUFFER(<head_blocker_session_id>);

-- Common cures:
-- 1. Enable RCSI so readers stop blocking writers
ALTER DATABASE MyApp SET READ_COMMITTED_SNAPSHOT ON;
-- 2. Add an index so the blocker seeks instead of scans (locks fewer rows)
-- 3. Shorten the transaction; commit sooner
-- 4. Set a lock timeout so a blocked session fails fast instead of hanging
SET LOCK_TIMEOUT 5000;  -- milliseconds`,
            language: 'sql',
            bestPractices: [
                'Trace the blocking chain to the head blocker before changing anything',
                'Enable RCSI to remove the most common reader/writer blocking',
                'Keep transactions short and ensure selective queries seek rather than scan',
                'Use SET LOCK_TIMEOUT so a blocked operation fails fast instead of hanging indefinitely'
            ],
            commonMistakes: [
                'Confusing blocking with deadlocks and "fixing" transient blocking that would have cleared',
                'Killing random sessions instead of identifying the head blocker',
                'Leaving transactions open during application think-time, causing long blocks',
                'Reaching for NOLOCK to mask blocking instead of addressing the long-held lock'
            ],
            interviewTip: 'Lead with the one-liner: all deadlocks are blocking, but most blocking is not a deadlock. Then show you know how to find the head blocker via sys.dm_exec_requests. Emphasize that blocking is normal — only excessive duration is the problem.',
            followUp: ['What is a head blocker and how do you identify it?', 'How does LOCK_TIMEOUT change blocking behavior?', 'Why is NOLOCK a poor fix for blocking?'],
            seniorPerspective: 'When users report "the app is slow and freezing," my first move is the blocking-chain query to find the head blocker, then DBCC INPUTBUFFER to see what it is running. Nine times out of ten it is a long transaction or a scan holding locks — and RCSI plus an index resolves it without touching application code.',
            architectPerspective: 'I monitor blocking durations as a health metric (blocked process report threshold + alerts), because chronic blocking is an early warning of poor transaction boundaries or missing indexes. Designing short, well-bounded transactions and enabling RCSI platform-wide prevents blocking from ever escalating into user-visible stalls.'
        },
        {
            question: 'How does SNAPSHOT isolation and RCSI work internally, and what are the trade-offs?',
            difficulty: 'advanced',
            answer: `<p>Both rely on <strong>row versioning</strong>. When versioning is enabled, every time a row is modified SQL Server keeps the prior version in the <strong>version store</strong> (in tempdb, or in-memory with Accelerated Database Recovery). Readers follow a pointer chain to the version that was committed at the right point in time, so they never need shared locks — readers do not block writers and writers do not block readers.</p>
            <ul>
                <li><strong>RCSI (READ_COMMITTED_SNAPSHOT ON)</strong> — changes the behavior of the default READ COMMITTED level. Each <em>statement</em> sees a snapshot consistent as of the moment that statement started. It is a database-level switch requiring no query changes.</li>
                <li><strong>SNAPSHOT isolation</strong> — an explicit level where the snapshot is consistent as of the moment the <em>transaction</em> started, giving statement-to-statement consistency for the whole transaction. It can raise <strong>update conflict</strong> errors (3960) when two transactions modify the same row.</li>
            </ul>
            <p><strong>Trade-offs:</strong> increased tempdb usage and I/O for the version store, ~14 bytes of versioning overhead added per row, and (for SNAPSHOT) the need to handle update-conflict errors in application code.</p>`,
            explanation: 'Row versioning is like a document with full edit history. Readers open the version that existed when they started reading and are never interrupted by someone editing the live copy. RCSI snapshots per page-turn (statement); full SNAPSHOT snapshots when you first opened the book (transaction). The cost is storing all those historical versions in a back room (tempdb).',
            code: `-- RCSI: statement-level snapshot, no code changes needed
ALTER DATABASE MyApp SET READ_COMMITTED_SNAPSHOT ON;
-- Now every READ COMMITTED query reads versioned rows instead of taking S-locks

-- SNAPSHOT: transaction-level snapshot, opt-in per transaction
ALTER DATABASE MyApp SET ALLOW_SNAPSHOT_ISOLATION ON;

SET TRANSACTION ISOLATION LEVEL SNAPSHOT;
BEGIN TRAN;
    SELECT * FROM Orders WHERE Id = 1;   -- sees data as of TRAN start
    -- ... another session commits a change to Order 1 ...
    SELECT * FROM Orders WHERE Id = 1;   -- STILL sees the original (repeatable)
    UPDATE Orders SET Status = 'X' WHERE Id = 1;
    -- If another tran already updated Id=1 since our snapshot -> error 3960
COMMIT;

-- Monitor the version store footprint in tempdb:
SELECT SUM(version_store_reserved_page_count) * 8 / 1024 AS VersionStoreMB
FROM sys.dm_db_file_space_usage;

-- Watch long-running snapshot transactions -- they pin old versions
SELECT session_id, transaction_id, elapsed_time_seconds
FROM sys.dm_tran_active_snapshot_database_transactions
ORDER BY elapsed_time_seconds DESC;`,
            language: 'sql',
            bestPractices: [
                'Enable RCSI as the practical default — it removes reader/writer blocking with no code changes',
                'Size and monitor tempdb for the version store before enabling versioning broadly',
                'Handle update-conflict errors (3960) when using explicit SNAPSHOT isolation',
                'Keep snapshot transactions short — long ones pin old versions and bloat the version store'
            ],
            commonMistakes: [
                'Confusing RCSI (statement-level) with SNAPSHOT (transaction-level) consistency',
                'Enabling versioning without provisioning tempdb, causing tempdb pressure',
                'Not handling error 3960 update conflicts under SNAPSHOT isolation',
                'Leaving long-running snapshot transactions open and starving tempdb of space'
            ],
            interviewTip: 'Nail the distinction: RCSI snapshots per statement, SNAPSHOT per transaction, and the latter can throw update conflicts (3960). Then mention the cost — the version store lives in tempdb — which shows you understand the operational impact, not just the feature.',
            followUp: ['What is error 3960 and when does it occur?', 'How does RCSI differ from SNAPSHOT in consistency scope?', 'How does Accelerated Database Recovery change the version store?'],
            seniorPerspective: 'I enable RCSI on essentially every OLTP database — the blocking relief is dramatic and it needs no code changes. I reserve explicit SNAPSHOT for transactions that genuinely need a stable transaction-wide view (multi-statement reports), and I always pair it with 3960 retry handling and tempdb monitoring.',
            architectPerspective: 'Row versioning shifts contention cost into tempdb, so it becomes a capacity-planning decision: tempdb sizing, fast storage, and monitoring the version store are prerequisites. Done right, RCSI converts a lock-bound system into a far more scalable one — I have seen throughput multiply simply by flipping it on and provisioning tempdb accordingly.'
        },
        {
            question: 'What is lock escalation, why does it happen, and how do you control it?',
            difficulty: 'expert',
            answer: `<p><strong>Lock escalation</strong> is SQL Server\'s memory-management optimization: when a single statement acquires too many fine-grained locks (the threshold is roughly <strong>5,000 locks</strong> on one object, or under memory pressure), it converts them into a single coarse-grained <strong>table lock</strong> (or partition lock). This frees the memory consumed by thousands of individual row/page lock structures.</p>
            <p>The downside: a table-level lock drastically reduces concurrency — other sessions are blocked from the whole table even though the statement only logically touched some rows. This commonly shows up as sudden blocking during large UPDATE/DELETE operations.</p>
            <p>You control it by:</p>
            <ul>
                <li><strong>Batching</strong> large modifications so no single statement crosses the threshold.</li>
                <li><strong>ALTER TABLE ... SET (LOCK_ESCALATION = ...)</strong> — choose TABLE (default), AUTO (partition-level for partitioned tables), or DISABLE.</li>
                <li><strong>Better indexing</strong> so the statement touches and locks fewer rows.</li>
            </ul>`,
            explanation: 'Lock escalation is like a librarian who, instead of putting a "reserved" sticky note on 5,000 individual books (which fills a whole drawer with notes), just locks the entire room. It saves sticky notes (memory) but now nobody else can enter the room (the table) until you are done.',
            code: `-- Symptom: a big DELETE escalates to a table lock and blocks everyone
DELETE FROM Orders WHERE OrderDate < '2020-01-01';  -- millions of rows
-- ~5000 row locks -> escalates to a TABLE X-lock -> whole table blocked

-- Fix 1: batch the operation so no statement crosses the threshold
WHILE 1 = 1
BEGIN
    DELETE TOP (4000) FROM Orders WHERE OrderDate < '2020-01-01';
    IF @@ROWCOUNT = 0 BREAK;
    -- each batch stays under ~5000 locks; commit between batches
END;

-- Fix 2: control escalation behavior per table
ALTER TABLE Orders SET (LOCK_ESCALATION = AUTO);    -- partition-level if partitioned
ALTER TABLE Orders SET (LOCK_ESCALATION = DISABLE); -- prevent escalation (use carefully)
ALTER TABLE Orders SET (LOCK_ESCALATION = TABLE);   -- default

-- Observe escalation events (Extended Events: lock_escalation)
-- and current lock counts:
SELECT resource_type, request_mode, COUNT(*) AS LockCount
FROM sys.dm_tran_locks
WHERE request_session_id = @@SPID
GROUP BY resource_type, request_mode;`,
            language: 'sql',
            bestPractices: [
                'Batch large UPDATE/DELETE operations to stay under the ~5000-lock escalation threshold',
                'Use LOCK_ESCALATION = AUTO on partitioned tables to escalate to partition not table',
                'Add indexes so modifications lock fewer rows in the first place',
                'Run large maintenance during low-traffic windows and commit between batches'
            ],
            commonMistakes: [
                'Running a single massive DELETE/UPDATE and triggering a table lock that blocks all users',
                'Disabling lock escalation globally (risks memory exhaustion from millions of fine locks)',
                'Assuming escalation goes row -> page -> table (it goes directly row/page -> table or partition)',
                'Ignoring the transaction log growth from huge single-statement modifications'
            ],
            interviewTip: 'Cite the ~5000-lock threshold and that escalation jumps straight to a table (or partition) lock — it does not climb row→page→table. Then give the practical fix everyone wants to hear: batch the operation in chunks under the threshold, committing between batches.',
            followUp: ['Does escalation go row to page to table, or straight to table?', 'When is LOCK_ESCALATION = AUTO beneficial?', 'How does batching also help transaction log management?'],
            seniorPerspective: 'For any bulk modification on a live table I batch in chunks of a few thousand rows with a commit between batches — it stays under the escalation threshold, keeps the log from ballooning, and lets other workloads interleave. A single giant DELETE that table-locks a hot table is one of the most common self-inflicted outages I see.',
            architectPerspective: 'On large partitioned tables I set LOCK_ESCALATION = AUTO so maintenance on one partition does not lock the whole table, enabling concurrent operations on other partitions. Escalation behavior is part of the data-lifecycle design — purge/archival jobs are built as batched, partition-aware operations from the start rather than retrofitted after a production lock storm.'
        }
    ]
});
