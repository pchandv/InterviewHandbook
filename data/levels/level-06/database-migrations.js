PageData.register('database-migrations', {
    title: 'Database Migration Strategies',
    description: 'Zero-downtime schema changes, expand-contract pattern, EF Core migrations, rollback strategies, and production-safe database evolution techniques.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>Database migrations are the disciplined practice of evolving your database schema and data over time in a controlled, versioned, and repeatable way. In production systems serving millions of requests, you cannot simply drop a column or rename a table without causing downtime or data loss.</p>
<p>Modern deployment practices demand <strong>zero-downtime migrations</strong> — the ability to change your database schema while the application continues serving traffic. This requires careful planning, backward-compatible changes, and patterns like <strong>expand-contract</strong> that decouple schema changes from application deployments.</p>
<p>Whether you use EF Core Migrations, DbUp, Flyway, or raw SQL scripts, the principles remain the same: version your schema, make changes additive, never break running code, and always have a rollback plan.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>Understanding database migrations requires familiarity with several foundational concepts:</p>
<ul>
<li><strong>Schema Migration</strong> — Structural changes to tables, columns, indexes, constraints, and relationships. These alter the shape of the database without necessarily touching existing data.</li>
<li><strong>Data Migration</strong> — Transforming, moving, or backfilling data within existing or new structures. Often paired with schema migrations but carries higher risk due to potential data loss.</li>
<li><strong>Expand-Contract Pattern</strong> — A two-phase (or three-phase) approach where you first expand the schema (add new structures), migrate data, then contract (remove old structures). This ensures backward compatibility throughout.</li>
<li><strong>Backward-Compatible Changes</strong> — Changes that allow both the old and new versions of the application to function correctly against the same database state. Essential for rolling deployments.</li>
<li><strong>Idempotent Migrations</strong> — Migrations that can be run multiple times without producing errors or unintended side effects. Critical for retry scenarios and CI/CD pipelines.</li>
<li><strong>Migration Versioning</strong> — Each migration has a unique, ordered identifier (timestamp or sequence number) that determines execution order and tracks which migrations have been applied.</li>
<li><strong>Rollback Strategy</strong> — A pre-planned reversal path for every migration. Some changes (like dropping data) are irreversible, requiring compensating migrations instead.</li>
<li><strong>Blue-Green Database Deployments</strong> — Running two database versions simultaneously during cutover, allowing instant rollback by switching traffic back to the original.</li>
</ul>`
        },
        {
            title: 'How It Works',
            content: `<p>The migration lifecycle follows a predictable flow from development through production deployment. Each migration is authored, tested locally, reviewed, and then applied to progressively higher environments.</p>
<p><strong>Step 1: Author the Migration</strong> — A developer creates a migration file describing the forward (Up) and backward (Down) changes. In EF Core, this is generated from model changes. In script-based tools, it is hand-written SQL.</p>
<p><strong>Step 2: Local Validation</strong> — The migration runs against a local database to verify correctness. Integration tests confirm the application works with both the old and new schema.</p>
<p><strong>Step 3: Code Review</strong> — Migration scripts are reviewed for backward compatibility, performance impact (table locks, index builds), and rollback safety.</p>
<p><strong>Step 4: Staging Deployment</strong> — The migration runs in a staging environment with production-like data volumes to catch performance issues invisible with small datasets.</p>
<p><strong>Step 5: Production Deployment</strong> — The migration executes during deployment. For zero-downtime, this happens before the new application code deploys (expand phase).</p>
<p><strong>Step 6: Cleanup</strong> — After all application instances run the new code, a follow-up migration removes deprecated columns/tables (contract phase).</p>`,
            mermaid: `graph TD
    A[Developer Changes Model] --> B[Generate Migration Script]
    B --> C[Review Migration for Safety]
    C --> D{Backward Compatible?}
    D -->|Yes| E[Apply to Staging]
    D -->|No| F[Refactor into Expand + Contract]
    F --> E
    E --> G[Run Integration Tests]
    G --> H{Tests Pass?}
    H -->|Yes| I[Deploy Migration to Production]
    H -->|No| J[Fix and Regenerate]
    J --> C
    I --> K[Deploy New Application Code]
    K --> L[Monitor for Issues]
    L --> M{Issues Found?}
    M -->|Yes| N[Execute Rollback Plan]
    M -->|No| O[Schedule Contract Migration]
    O --> P[Remove Deprecated Schema]`
        },
        {
            title: 'Visual Diagram',
            content: `<p>The expand-contract pattern is the cornerstone of zero-downtime migrations. It separates a breaking change into multiple non-breaking steps, each deployed independently.</p>
<p>Consider renaming a column from <code>UserName</code> to <code>DisplayName</code>. A direct rename breaks all running code instantly. The expand-contract approach adds the new column, syncs data, switches code, then removes the old column across multiple releases.</p>`,
            mermaid: `graph LR
    subgraph Phase1[Phase 1: Expand]
        A1[Add DisplayName column] --> A2[Deploy dual-write code]
        A2 --> A3[Backfill DisplayName from UserName]
    end
    subgraph Phase2[Phase 2: Migrate]
        B1[Verify data consistency] --> B2[Switch reads to DisplayName]
        B2 --> B3[Deploy code reading new column]
    end
    subgraph Phase3[Phase 3: Contract]
        C1[Stop writing to UserName] --> C2[Deploy code without UserName refs]
        C2 --> C3[Drop UserName column]
    end
    Phase1 --> Phase2
    Phase2 --> Phase3`
        },
        {
            title: 'Implementation',
            content: `<p>Here is a complete EF Core migration workflow demonstrating the expand-contract pattern for renaming a column safely in production.</p>
<p><strong>Phase 1: Expand Migration</strong> — Add the new column alongside the old one:</p>`,
            code: `// Phase 1: Expand — Add new column (EF Core Migration)
// Generated via: dotnet ef migrations add AddDisplayNameColumn

using Microsoft.EntityFrameworkCore.Migrations;

public partial class AddDisplayNameColumn : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Add new column (nullable initially for backward compat)
        migrationBuilder.AddColumn<string>(
            name: "DisplayName",
            table: "Users",
            type: "nvarchar(256)",
            maxLength: 256,
            nullable: true);

        // Backfill data from old column
        migrationBuilder.Sql(
            @"UPDATE Users SET DisplayName = UserName WHERE DisplayName IS NULL");

        // Add index on new column (ONLINE to avoid locks)
        migrationBuilder.CreateIndex(
            name: "IX_Users_DisplayName",
            table: "Users",
            column: "DisplayName");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Users_DisplayName",
            table: "Users");

        migrationBuilder.DropColumn(
            name: "DisplayName",
            table: "Users");
    }
}

// Phase 2: Application code writes to BOTH columns (dual-write)
public class UserRepository
{
    public async Task UpdateUserName(int userId, string newName)
    {
        // Dual-write ensures both columns stay in sync
        await _db.ExecuteAsync(
            @"UPDATE Users
              SET UserName = @Name, DisplayName = @Name
              WHERE Id = @Id",
            new { Id = userId, Name = newName });
    }
}

// Phase 3: Contract Migration — Remove old column
// Generated via: dotnet ef migrations add RemoveUserNameColumn

public partial class RemoveUserNameColumn : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Make new column NOT NULL now that all data is migrated
        migrationBuilder.AlterColumn<string>(
            name: "DisplayName",
            table: "Users",
            type: "nvarchar(256)",
            maxLength: 256,
            nullable: false,
            defaultValue: "");

        // Drop the old column
        migrationBuilder.DropColumn(
            name: "UserName",
            table: "Users");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "UserName",
            table: "Users",
            type: "nvarchar(256)",
            maxLength: 256,
            nullable: false,
            defaultValue: "");

        migrationBuilder.Sql(
            @"UPDATE Users SET UserName = DisplayName");
    }
}`,
            language: 'csharp',
            tabs: [
                {
                    label: 'SQL (Manual Migration)',
                    language: 'sql',
                    code: `-- Phase 1: Expand (deploy BEFORE new app code)
BEGIN TRANSACTION;

-- Add new column
ALTER TABLE Users ADD DisplayName NVARCHAR(256) NULL;

-- Backfill (batched for large tables)
DECLARE @BatchSize INT = 10000;
DECLARE @RowsAffected INT = 1;

WHILE @RowsAffected > 0
BEGIN
    UPDATE TOP (@BatchSize) Users
    SET DisplayName = UserName
    WHERE DisplayName IS NULL;

    SET @RowsAffected = @@ROWCOUNT;
END

-- Create index online (Enterprise Edition)
CREATE NONCLUSTERED INDEX IX_Users_DisplayName
ON Users (DisplayName)
WITH (ONLINE = ON);

COMMIT;

-- Phase 2: Add trigger for sync during transition
CREATE TRIGGER TR_Users_SyncDisplayName
ON Users
AFTER INSERT, UPDATE
AS
BEGIN
    UPDATE u
    SET u.DisplayName = i.UserName
    FROM Users u
    INNER JOIN inserted i ON u.Id = i.Id
    WHERE i.DisplayName IS NULL;
END;

-- Phase 3: Contract (deploy AFTER all app instances use new column)
DROP TRIGGER TR_Users_SyncDisplayName;
ALTER TABLE Users DROP COLUMN UserName;
ALTER TABLE Users ALTER COLUMN DisplayName NVARCHAR(256) NOT NULL;`
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<ul>
<li><strong>Always make migrations backward-compatible</strong> — The old application code must work with the new schema. Add columns as nullable, never rename or drop columns in a single step.</li>
<li><strong>Version control all migrations</strong> — Migration scripts belong in source control alongside the application code. They should be reviewable, auditable, and reproducible.</li>
<li><strong>Test with production-scale data</strong> — A migration that runs in 2 seconds on 1,000 rows may lock a table for 30 minutes on 50 million rows. Always test against realistic volumes.</li>
<li><strong>Batch large data migrations</strong> — Never run unbounded UPDATE or DELETE statements. Process in batches of 5,000-50,000 rows to avoid transaction log bloat and lock escalation.</li>
<li><strong>Use online index operations</strong> — On SQL Server Enterprise, use <code>WITH (ONLINE = ON)</code> for index creation. On PostgreSQL, use <code>CREATE INDEX CONCURRENTLY</code>.</li>
<li><strong>Separate schema and data migrations</strong> — Schema changes (DDL) and data transformations (DML) should be in separate migration steps. This simplifies rollback and retry logic.</li>
<li><strong>Include a rollback script for every migration</strong> — Even if rollback means a compensating migration rather than a true reverse, document the recovery path.</li>
<li><strong>Never modify a migration that has been applied</strong> — Once a migration reaches any shared environment, treat it as immutable. Create a new migration to correct issues.</li>
<li><strong>Use feature flags for phased rollouts</strong> — Combine database migrations with feature flags to control which code path (old column vs new column) is active without redeployment.</li>
<li><strong>Monitor migration execution time</strong> — Set alerting on migration duration. If a migration exceeds expected time, have a kill-and-rollback procedure ready.</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>Renaming columns in a single migration</strong> — This breaks all running application instances immediately. Use expand-contract instead, spanning at least two releases.</li>
<li><strong>Adding NOT NULL columns without defaults</strong> — Fails on tables with existing data. Always add as nullable first or provide a DEFAULT constraint.</li>
<li><strong>Running migrations inside application startup</strong> — If the migration fails or takes too long, all instances crash-loop. Run migrations in a separate deployment step.</li>
<li><strong>Ignoring lock escalation on large tables</strong> — An ALTER TABLE on a billion-row table can acquire a schema modification lock, blocking all queries for minutes or hours.</li>
<li><strong>No rollback plan</strong> — Assuming migrations always succeed. In production, anything can fail: disk full, timeout, deadlock, unexpected data patterns.</li>
<li><strong>Editing applied migrations</strong> — Modifying a migration after it has run in staging or production creates drift between environments. The migration history becomes unreliable.</li>
<li><strong>Coupling schema and code deployment</strong> — Deploying a migration that requires new code simultaneously with that code. If the code rollback happens, the schema is incompatible.</li>
<li><strong>Unbounded data backfills</strong> — Running <code>UPDATE Users SET NewCol = OldCol</code> on a 100M row table in a single transaction. This fills the transaction log and may cause an outage.</li>
<li><strong>Forgetting to update stored procedures and views</strong> — Dropping a column that is referenced by views or procedures causes runtime errors that unit tests may not catch.</li>
<li><strong>Testing only the Up migration</strong> — Never testing the Down/rollback path until you need it in production at 2 AM. Always verify rollbacks in staging.</li>
</ul>`
        },
        {
            title: 'Comparison',
            content: `<p>Choosing the right migration tool depends on your ecosystem, team size, and operational requirements. Here is a comparison of the most popular options:</p>`,
            table: {
                headers: ['Feature', 'EF Core Migrations', 'DbUp', 'Flyway', 'Manual SQL Scripts'],
                rows: [
                    ['Language', 'C# (code-first)', 'C# + SQL scripts', 'SQL scripts', 'Raw SQL'],
                    ['Schema Diffing', 'Automatic from model', 'None (script-based)', 'None (script-based)', 'None'],
                    ['Rollback Support', 'Down() method generated', 'Manual scripts', 'Undo migrations (paid)', 'Manual scripts'],
                    ['CI/CD Integration', 'dotnet ef CLI', 'NuGet library + runner', 'CLI + Docker image', 'Custom scripting'],
                    ['Idempotency', 'Built-in tracking table', 'Journal table', 'Schema history table', 'Must implement manually'],
                    ['Multi-Database', 'SQL Server, PostgreSQL, MySQL, SQLite', 'Any ADO.NET provider', 'Most relational DBs', 'DB-specific syntax'],
                    ['Team Workflow', 'Merge conflicts in snapshots', 'Simple numbered scripts', 'Versioned filenames', 'Varies by team'],
                    ['Production Safety', 'Medium (needs discipline)', 'High (explicit scripts)', 'High (explicit scripts)', 'Low (error-prone)'],
                    ['Learning Curve', 'Medium (EF knowledge required)', 'Low', 'Low', 'Varies'],
                    ['Best For', 'Teams already using EF Core', 'Simple .NET projects', 'Polyglot/Java teams', 'DBA-managed environments']
                ]
            }
        },
        {
            title: 'Interview Tips',
            content: `<p>Database migration questions test your understanding of production operations, not just development workflows. Interviewers want to see that you can safely evolve schemas under real-world constraints.</p>`,
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>Zero-downtime awareness</strong> — Can you explain why a direct column rename is dangerous and how expand-contract solves it?</li>
<li><strong>Rollback thinking</strong> — Do you proactively plan for failure? Mention rollback strategies before being asked.</li>
<li><strong>Scale awareness</strong> — Discuss batch sizes, lock implications, and testing with production-scale data. This separates senior from junior candidates.</li>
<li><strong>Deployment coupling</strong> — Explain why schema changes should deploy independently from application code.</li>
<li><strong>Real war stories</strong> — Share a migration that went wrong and what you learned. Authenticity and humility score highly.</li>
<li><strong>Tool knowledge</strong> — Know at least one tool deeply (EF Core, Flyway, etc.) and understand the tradeoffs of code-first vs script-first approaches.</li>
</ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li>Database migrations are versioned, repeatable transformations of schema and data that enable controlled evolution of your database.</li>
<li>The <strong>expand-contract pattern</strong> is essential for zero-downtime: add new structures, migrate data, remove old structures across multiple releases.</li>
<li>Every migration must be <strong>backward-compatible</strong> with currently running application code to support rolling deployments and instant rollbacks.</li>
<li>Schema changes should deploy <strong>independently</strong> from application code — typically before the code that depends on them.</li>
<li>Large data migrations must be <strong>batched</strong> to avoid lock escalation, transaction log bloat, and blocking queries.</li>
<li><strong>Never modify</strong> a migration that has been applied to any shared environment. Create compensating migrations instead.</li>
<li>Always test the <strong>rollback path</strong> in staging before deploying to production. The Down migration is as important as the Up.</li>
<li>Choose your tool based on team expertise and ecosystem: EF Core for .NET code-first, Flyway/DbUp for script-first control.</li>
<li>Blue-green database deployments provide the safest rollback path but require infrastructure investment (replication, dual-write capability).</li>
<li>Monitor migration execution and have a <strong>kill switch</strong> — a predefined procedure to abort and roll back if a migration exceeds time limits.</li>
</ul>`
        }
    ],
    questions: [
        {
            id: 'db-mig-q1',
            level: 'junior',
            title: 'What is a database migration, and why do we use them instead of manually running SQL scripts?',
            answer: `<p>A database migration is a versioned, repeatable script that describes a change to the database schema or data. Migrations are stored in source control alongside application code, giving you a complete history of how the database evolved.</p>
<p>We use migrations instead of manual scripts because:</p>
<ul>
<li><strong>Repeatability</strong> — The same migration runs identically across dev, staging, and production environments.</li>
<li><strong>Version tracking</strong> — A history table records which migrations have been applied, preventing double-execution.</li>
<li><strong>Team coordination</strong> — Multiple developers can create migrations independently, and the framework resolves ordering.</li>
<li><strong>Rollback capability</strong> — Each migration includes a reverse operation, enabling controlled rollback.</li>
<li><strong>Auditability</strong> — Code review catches dangerous changes before they reach production.</li>
</ul>
<p>Manual scripts are error-prone: someone forgets to run one, runs them out of order, or applies the same script twice. Migration frameworks eliminate these human errors.</p>`
        },
        {
            id: 'db-mig-q2',
            level: 'junior',
            title: 'What is the difference between a schema migration and a data migration?',
            answer: `<p>A <strong>schema migration</strong> changes the structure of the database — creating tables, adding columns, modifying constraints, creating indexes, or altering relationships. It uses DDL (Data Definition Language) statements like CREATE, ALTER, and DROP.</p>
<p>A <strong>data migration</strong> transforms, moves, or backfills data within existing or new structures. It uses DML (Data Manipulation Language) statements like INSERT, UPDATE, and DELETE.</p>
<p><strong>Key differences:</strong></p>
<ul>
<li>Schema migrations are generally <strong>safe to retry</strong> (adding a column is idempotent with IF NOT EXISTS checks). Data migrations may not be safely repeatable without guards.</li>
<li>Schema migrations are <strong>fast on empty tables</strong> but can be slow on large tables. Data migrations are always proportional to data volume.</li>
<li>Schema migrations <strong>rarely lose data</strong> (except DROP operations). Data migrations carry inherent risk of data corruption if logic is wrong.</li>
<li>They should be in <strong>separate migration files</strong> for clarity and independent rollback capability.</li>
</ul>
<p>Example: Adding a <code>FullName</code> column is a schema migration. Populating it by concatenating <code>FirstName + LastName</code> is a data migration.</p>`
        },
        {
            id: 'db-mig-q3',
            level: 'mid',
            title: 'Explain the expand-contract pattern. When would you use it, and what are the deployment steps?',
            answer: `<p>The <strong>expand-contract pattern</strong> (also called parallel change) splits a breaking database change into multiple non-breaking steps deployed across separate releases. It ensures zero downtime by maintaining backward compatibility at every intermediate state.</p>
<p><strong>When to use it:</strong></p>
<ul>
<li>Renaming a column or table</li>
<li>Changing a column's data type</li>
<li>Splitting a table into multiple tables</li>
<li>Merging columns or restructuring relationships</li>
<li>Any change that would break currently running code</li>
</ul>
<p><strong>The three deployment phases:</strong></p>
<ol>
<li><strong>Expand (Release N)</strong> — Add the new structure alongside the old. Deploy application code that writes to both (dual-write). Backfill existing data into the new structure.</li>
<li><strong>Migrate (Release N+1)</strong> — Switch reads to the new structure. Verify data consistency. All application instances now use the new column/table for reads.</li>
<li><strong>Contract (Release N+2)</strong> — Remove the old structure. Drop deprecated columns, tables, or triggers. Clean up dual-write code.</li>
</ol>
<p><strong>Critical rule:</strong> At every phase, both the current and previous application version must work correctly against the database state. This allows instant rollback of any release without database changes.</p>`
        },
        {
            id: 'db-mig-q4',
            level: 'mid',
            title: 'How do you handle a migration that needs to update millions of rows without causing downtime?',
            answer: `<p>Large data migrations require <strong>batched processing</strong> to avoid lock escalation, transaction log bloat, and blocking production queries. Here is the approach:</p>
<p><strong>1. Batch the updates:</strong></p>
<pre><code>DECLARE @BatchSize INT = 10000;
DECLARE @RowsAffected INT = 1;

WHILE @RowsAffected &gt; 0
BEGIN
    UPDATE TOP (@BatchSize) Users
    SET NewColumn = OldColumn
    WHERE NewColumn IS NULL;

    SET @RowsAffected = @@ROWCOUNT;

    -- Optional: throttle to reduce load
    WAITFOR DELAY '00:00:00.100';
END</code></pre>
<p><strong>2. Use appropriate isolation:</strong> Run batches with <code>READ COMMITTED</code> to avoid holding locks across batches. Each batch commits independently.</p>
<p><strong>3. Make it resumable:</strong> Use a WHERE clause that identifies unprocessed rows (e.g., <code>WHERE NewColumn IS NULL</code>). If the migration is interrupted, it resumes from where it stopped.</p>
<p><strong>4. Run during low-traffic windows:</strong> Even with batching, large migrations consume I/O. Schedule for off-peak hours when possible.</p>
<p><strong>5. Monitor progress:</strong> Log batch counts and estimated completion time. Set alerts if throughput drops below expected rate.</p>
<p><strong>6. Consider background workers:</strong> For very large tables (billions of rows), run the data migration as an async background job rather than a synchronous deployment step.</p>`
        },
        {
            id: 'db-mig-q5',
            level: 'mid',
            title: 'What are the risks of running EF Core migrations during application startup, and what is the alternative?',
            answer: `<p>Running migrations at startup (via <code>context.Database.Migrate()</code> in Program.cs) is convenient for development but <strong>dangerous in production</strong> for several reasons:</p>
<ul>
<li><strong>Startup failure cascade</strong> — If the migration fails (timeout, lock contention, bad data), the application cannot start. With multiple replicas, all instances crash-loop simultaneously.</li>
<li><strong>Race conditions</strong> — Multiple instances starting simultaneously may attempt the same migration concurrently, causing conflicts or deadlocks.</li>
<li><strong>Unpredictable timing</strong> — Migrations run whenever the app restarts (deploys, autoscaling, crash recovery). You lose control over when schema changes execute.</li>
<li><strong>No human oversight</strong> — There is no opportunity to verify the migration succeeded before traffic hits the new code.</li>
<li><strong>Extended startup time</strong> — A slow migration holds up health checks, causing load balancers to mark instances as unhealthy.</li>
</ul>
<p><strong>The alternative: Separate migration step in CI/CD pipeline:</strong></p>
<ol>
<li>Run <code>dotnet ef database update</code> as a dedicated pipeline stage before application deployment.</li>
<li>Gate the application deployment on migration success.</li>
<li>Use a single-execution job (not per-instance) to avoid race conditions.</li>
<li>Include a timeout and automatic rollback trigger.</li>
</ol>
<p>This gives you control, observability, and the ability to abort deployment if migration fails.</p>`
        },
        {
            id: 'db-mig-q6',
            level: 'senior',
            title: 'Design a zero-downtime migration strategy for splitting a monolithic Users table into separate Profile and Credentials tables.',
            answer: `<p>This is a complex structural migration that requires careful phasing over 4-5 releases to maintain zero downtime:</p>
<p><strong>Release 1 — Expand (Create new tables):</strong></p>
<ul>
<li>Create <code>UserProfile</code> table with profile columns (DisplayName, Avatar, Bio, etc.)</li>
<li>Create <code>UserCredentials</code> table with auth columns (PasswordHash, Email, MFA settings)</li>
<li>Both tables use the same primary key as Users (or FK to Users.Id)</li>
<li>Deploy a trigger or application dual-write that populates new tables on any Users write</li>
</ul>
<p><strong>Release 2 — Backfill and verify:</strong></p>
<ul>
<li>Run batched data migration to copy all existing Users data into the two new tables</li>
<li>Deploy verification job that compares data between old and new tables, reports discrepancies</li>
<li>Fix any sync issues before proceeding</li>
</ul>
<p><strong>Release 3 — Switch reads:</strong></p>
<ul>
<li>Update read queries to pull from new tables (behind feature flag)</li>
<li>Monitor query performance and correctness</li>
<li>Gradually roll out to 100% of traffic</li>
</ul>
<p><strong>Release 4 — Stop writing to Users:</strong></p>
<ul>
<li>Remove dual-write code; all writes go to new tables only</li>
<li>Create a view named <code>Users</code> that joins the two tables (for any legacy queries)</li>
<li>Monitor for any remaining references to the old table</li>
</ul>
<p><strong>Release 5 — Contract:</strong></p>
<ul>
<li>Drop the original Users table (after confirming no remaining references)</li>
<li>Remove the compatibility view if no longer needed</li>
<li>Update ORM mappings to reflect final schema</li>
</ul>
<p><strong>Key safeguards:</strong> Feature flags at each phase, automated consistency checks, ability to revert to the original table at any point before Release 5.</p>`
        },
        {
            id: 'db-mig-q7',
            level: 'senior',
            title: 'How would you implement a rollback strategy for a migration that involves data loss (e.g., dropping a column with data)?',
            answer: `<p>True rollback is impossible for destructive operations — you cannot un-drop data. Instead, you implement <strong>compensating strategies</strong> that preserve the ability to recover:</p>
<p><strong>Strategy 1: Soft Delete with Retention Period</strong></p>
<ul>
<li>Never drop columns immediately. Instead, rename with a <code>_deprecated_YYYYMMDD</code> suffix.</li>
<li>Set a retention policy (e.g., 30 days) before final deletion.</li>
<li>If rollback is needed within the retention window, rename the column back.</li>
</ul>
<p><strong>Strategy 2: Archive Before Drop</strong></p>
<ul>
<li>Before dropping, copy the data to an archive table: <code>CREATE TABLE Users_Archive_UserName AS SELECT Id, UserName FROM Users</code></li>
<li>The archive table serves as a backup for the retention period.</li>
<li>Rollback restores from archive: <code>ALTER TABLE Users ADD UserName ...; UPDATE Users SET UserName = a.UserName FROM Users_Archive_UserName a WHERE Users.Id = a.Id</code></li>
</ul>
<p><strong>Strategy 3: Point-in-Time Recovery (PITR)</strong></p>
<ul>
<li>Ensure database backups support point-in-time recovery before the migration.</li>
<li>Document the exact timestamp of the migration for potential restore.</li>
<li>Note: PITR restores the entire database, not individual tables. Use selectively.</li>
</ul>
<p><strong>Strategy 4: Event Sourcing / CDC</strong></p>
<ul>
<li>If using Change Data Capture or event sourcing, the dropped data exists in the event log.</li>
<li>Replay events to reconstruct the column if needed.</li>
</ul>
<p><strong>Best practice:</strong> Combine Strategy 1 (soft delete with retention) and Strategy 2 (archive) for critical data. Document the recovery procedure in the migration's code comments.</p>`
        },
        {
            id: 'db-mig-q8',
            level: 'senior',
            title: 'Explain how you would handle database migrations in a microservices architecture where multiple services share a database.',
            answer: `<p>Shared databases in microservices create tight coupling — but they exist in practice, especially during monolith decomposition. Migration strategy must account for multiple consumers:</p>
<p><strong>1. Establish Schema Ownership</strong></p>
<ul>
<li>Each table (or schema/namespace) has exactly one owning service responsible for its migrations.</li>
<li>Other services access shared tables through views or read-only access, never direct writes.</li>
<li>Document ownership in a schema registry or ADR (Architecture Decision Record).</li>
</ul>
<p><strong>2. Versioned Database Contracts</strong></p>
<ul>
<li>Treat the database schema like an API contract. Breaking changes require the same expand-contract discipline.</li>
<li>Consumer services register their dependencies on specific columns/tables.</li>
<li>Before dropping anything, verify no registered consumers still depend on it.</li>
</ul>
<p><strong>3. Migration Coordination</strong></p>
<ul>
<li>The owning service deploys the expand migration first.</li>
<li>Notify dependent services to migrate their code to use new structures.</li>
<li>Once all consumers have migrated (verified via feature flags or traffic metrics), deploy the contract migration.</li>
<li>This may span weeks across team boundaries.</li>
</ul>
<p><strong>4. Compatibility Views</strong></p>
<ul>
<li>When restructuring, create views that present the old shape while the underlying tables change.</li>
<li>Consumer services query views, insulating them from structural changes.</li>
<li>Deprecate views with a timeline once consumers migrate.</li>
</ul>
<p><strong>5. Long-term Goal: Database per Service</strong></p>
<ul>
<li>Use migrations as an opportunity to split shared tables into service-owned databases.</li>
<li>Replicate necessary data via events/CDC rather than shared tables.</li>
</ul>`
        },
        {
            id: 'db-mig-q9',
            level: 'architect',
            title: 'Design a blue-green database deployment strategy for a high-traffic system. What infrastructure is required, and what are the limitations?',
            answer: `<p>Blue-green database deployment maintains two complete database environments (blue and green) and switches traffic between them atomically. This provides the safest rollback path but requires significant infrastructure investment.</p>
<p><strong>Architecture:</strong></p>
<ul>
<li><strong>Two database instances</strong> — Blue (current production) and Green (migration target), with bidirectional replication.</li>
<li><strong>Connection router</strong> — A proxy layer (e.g., ProxySQL, PgBouncer, or DNS-based switching) that directs traffic to the active instance.</li>
<li><strong>Replication pipeline</strong> — Logical replication or CDC (Debezium) to keep both instances synchronized during the transition window.</li>
</ul>
<p><strong>Deployment flow:</strong></p>
<ol>
<li>Green instance receives the migration while Blue continues serving traffic.</li>
<li>Verify migration success and data integrity on Green.</li>
<li>Enable bidirectional replication (writes to Blue replicate to Green and vice versa).</li>
<li>Switch read traffic to Green (canary percentage first, then 100%).</li>
<li>Switch write traffic to Green (atomic cutover via proxy).</li>
<li>Monitor for issues. If problems arise, switch back to Blue instantly.</li>
<li>After confidence period, decommission Blue or repurpose as next Green.</li>
</ol>
<p><strong>Infrastructure required:</strong></p>
<ul>
<li>Double the database compute and storage (or use read replicas promoted to primary).</li>
<li>Logical replication with conflict resolution for the bidirectional phase.</li>
<li>Connection proxy with health checking and instant failover.</li>
<li>Monitoring for replication lag, data drift, and write conflicts.</li>
</ul>
<p><strong>Limitations:</strong></p>
<ul>
<li><strong>Cost</strong> — Running two production databases doubles infrastructure spend during transitions.</li>
<li><strong>Schema divergence</strong> — Once Green has new columns, replication to Blue may fail for new data. Requires careful handling of schema-incompatible changes.</li>
<li><strong>Bidirectional conflicts</strong> — Simultaneous writes to both during cutover need conflict resolution (last-write-wins, or application-level routing).</li>
<li><strong>Sequence/identity gaps</strong> — Auto-increment values may diverge between instances.</li>
<li><strong>Not suitable for all changes</strong> — Works best for additive schema changes. Destructive changes still need expand-contract within the green instance.</li>
</ul>`
        },
        {
            id: 'db-mig-q10',
            level: 'architect',
            title: 'How would you design a migration framework for a globally distributed database (multi-region, multi-master) that must maintain consistency across regions?',
            answer: `<p>Globally distributed multi-master databases (CockroachDB, Spanner, Cosmos DB, Aurora Global) require migration strategies that account for replication lag, region-specific constraints, and the impossibility of global locks.</p>
<p><strong>Core Design Principles:</strong></p>
<ul>
<li><strong>Region-aware migration orchestration</strong> — A central migration coordinator tracks which migrations have been applied in each region. Migrations propagate region-by-region, not simultaneously.</li>
<li><strong>Schema-level compatibility windows</strong> — Define a compatibility window (e.g., 2 versions) where both old and new schema must coexist. This accounts for replication propagation time.</li>
<li><strong>DDL replication handling</strong> — Some distributed databases replicate DDL automatically (CockroachDB, Spanner). Others require manual application per region. Design for both.</li>
</ul>
<p><strong>Framework Architecture:</strong></p>
<ol>
<li><strong>Migration Registry Service</strong> — Central service tracking migration state per region: pending, in-progress, applied, verified.</li>
<li><strong>Region Orchestrator</strong> — Applies migrations to one region at a time, verifies success, then proceeds to the next. Canary region goes first.</li>
<li><strong>Compatibility Checker</strong> — Automated tool that validates both application versions (N and N-1) work against the migrated schema.</li>
<li><strong>Conflict Resolution Layer</strong> — For data migrations, handles conflicts when the same row is modified in multiple regions during the migration window.</li>
</ol>
<p><strong>Migration Execution Strategy:</strong></p>
<ul>
<li><strong>Phase 1</strong> — Apply schema migration to canary region. Route a percentage of traffic to verify.</li>
<li><strong>Phase 2</strong> — Propagate to remaining regions sequentially (not parallel, to limit blast radius).</li>
<li><strong>Phase 3</strong> — Run data migration in each region locally (avoid cross-region data movement).</li>
<li><strong>Phase 4</strong> — Global verification: consistency check across all regions.</li>
<li><strong>Phase 5</strong> — Contract phase only after all regions are verified and all app instances are on new code.</li>
</ul>
<p><strong>Key Challenges:</strong></p>
<ul>
<li><strong>Clock skew</strong> — Migration ordering must use logical clocks, not wall clocks, across regions.</li>
<li><strong>Partial failure</strong> — If migration succeeds in 3 of 5 regions, you need region-specific rollback without affecting successful regions.</li>
<li><strong>Replication lag during transition</strong> — New columns may be NULL in lagging regions. Application code must tolerate this.</li>
<li><strong>Global consensus for DDL</strong> — Some operations (adding constraints) require global coordination. These must be scheduled during low-traffic windows across all regions.</li>
</ul>`
        }
    ]
});
