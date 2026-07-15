/* ═══════════════════════════════════════════════════════════════════
   ZERO-DOWNTIME DEPLOYMENTS — Level 14: Production Engineering
   Rolling/blue-green/canary deploys, backward-compatible changes,
   expand-contract DB migrations, and safe schema evolution.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('zero-downtime', {

    title: 'Zero-Downtime Deployments',
    level: 14,
    group: 'production-practices',
    description: 'Deploying without downtime: rolling/blue-green/canary strategies, backward-compatible changes, the expand-contract (parallel change) pattern for database migrations, and safe schema evolution.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['devops-strategies', 'feature-flags'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Zero-downtime deployment</strong> means shipping new versions without any user-visible
            interruption. Modern services are expected to be always-on, so "we'll deploy at 2am during a maintenance
            window" is increasingly unacceptable. Achieving zero downtime requires deployment strategies <em>and</em>
            backward-compatible change discipline — especially for databases.</p>
            <p>The hardest part isn't the deploy strategy (rolling/blue-green/canary are well understood) — it's
            evolving the <strong>database schema</strong> without breaking the running old and new code that briefly
            coexist.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>Rolling, blue-green, and canary deployment strategies</li>
                <li>Why old and new versions coexist during deploys</li>
                <li>Backward- and forward-compatible changes</li>
                <li>The expand-contract (parallel change) pattern for DB migrations</li>
                <li>Safe schema evolution (adding/removing/renaming columns)</li>
                <li>Health checks and graceful shutdown</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Deployment Strategies</h4>
            <ul>
                <li><strong>Rolling:</strong> replace instances gradually (a few at a time) so the service stays up
                throughout. Old and new versions run simultaneously during the roll.</li>
                <li><strong>Blue-green:</strong> run two identical environments; deploy to the idle one (green), test,
                then switch all traffic. Instant cutover and rollback.</li>
                <li><strong>Canary:</strong> route a small traffic slice to the new version, monitor, then expand.</li>
            </ul>
            <h4>Version Coexistence</h4>
            <p>During any non-instant deploy, old and new code run at the same time and hit the <em>same database</em>.
            Every change must work with both versions simultaneously — this is the crux of zero-downtime.</p>
            <h4>Backward / Forward Compatibility</h4>
            <p><strong>Backward-compatible:</strong> new code works with old data/schema. <strong>Forward-compatible:</strong>
            old code works with new schema. Zero-downtime DB changes require both during the transition.</p>
            <h4>Expand-Contract (Parallel Change)</h4>
            <p>The pattern for breaking schema changes: <strong>Expand</strong> (add new alongside old, both work),
            migrate, then <strong>Contract</strong> (remove old) — across multiple deploys.</p>
            <h4>Graceful Shutdown</h4>
            <p>On shutdown, stop accepting new requests, finish in-flight ones (drain), then exit — so rolling
            instances don't drop requests.</p>`,
            mermaid: `flowchart TB
    subgraph Expand-Contract DB Migration
        E[Expand: add new column/table<br/>both old+new code work] --> M[Migrate: backfill + dual-write]
        M --> Sw[Switch: new code reads new]
        Sw --> C[Contract: remove old column<br/>after old code is gone]
    end
    style E fill:#bbf7d0,color:#1e293b
    style C fill:#fde68a,color:#1e293b`
        },
        {
            title: 'How It Works',
            content: `<p>Zero-downtime deployment combines a safe rollout strategy with compatible changes:</p>
            <ol>
                <li><strong>Make changes backward-compatible:</strong> new code must work with the current schema, and
                the current (old) code must keep working after your change — because they run together.</li>
                <li><strong>Roll out gradually:</strong> use rolling/blue-green/canary so there's always capacity
                serving traffic; instances drain gracefully before stopping.</li>
                <li><strong>Use health checks:</strong> only route traffic to instances that pass readiness; replace
                instances only when the new ones are healthy.</li>
                <li><strong>Evolve schema in steps (expand-contract):</strong> never make a single breaking schema
                change; split it across deploys so old and new code coexist safely.</li>
                <li><strong>Monitor &amp; be ready to roll back:</strong> watch metrics during/after; blue-green and
                flags make rollback fast.</li>
            </ol>`,
            code: `// The danger: old and new code run AT THE SAME TIME against ONE database.
//
// BREAKING (causes downtime): rename column "name" -> "full_name" in one step
//   - New code reads full_name; OLD code still reading "name" -> errors
//   - Old code writes "name"; new code expects full_name -> data gaps
//
// SAFE (expand-contract, across deploys):
//   Deploy 1 (EXPAND):  add "full_name" column (nullable); code dual-writes
//                       name + full_name; reads prefer full_name, fallback name
//   (backfill):         copy name -> full_name for existing rows
//   Deploy 2 (SWITCH):  code reads/writes only full_name (old "name" untouched)
//   Deploy 3 (CONTRACT):after all old code is gone, drop the "name" column
// At every step, both currently-running versions work.`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Blue-green deployment: deploy to idle environment, then switch traffic:</p>`,
            mermaid: `flowchart LR
    LB[Load Balancer] -->|100% traffic| Blue[Blue env: v1 - LIVE]
    LB -. 0% .-> Green[Green env: v2 - deploy + test]
    Green --> Verify{Healthy?}
    Verify -->|yes| Switch[Switch LB to Green]
    Verify -->|no| Keep[Keep Blue; fix Green]
    Switch -->|now 100%| Green
    Switch -.->|instant rollback| Blue
    style Blue fill:#bfdbfe,color:#1e293b
    style Green fill:#bbf7d0,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Expand-contract migration, graceful shutdown, and rollout config:</p>`,
            tabs: [
                {
                    label: 'Add Column (safe)',
                    code: `-- Adding a column is safe IF it's nullable or has a default and old code
-- ignores it. Old code keeps working; new code uses it.

-- SAFE: nullable new column (old code unaffected)
ALTER TABLE Orders ADD full_name NVARCHAR(200) NULL;

-- RISKY at scale: NOT NULL without default can lock/rewrite the table on
-- some engines, and old code that INSERTs without it will fail.
-- Instead: add nullable -> backfill -> add NOT NULL constraint later
-- once all code populates it.`,
                    language: 'sql'
                },
                {
                    label: 'Rename via Expand-Contract',
                    code: `// Renaming "name" -> "full_name" with zero downtime (multi-deploy):

// DEPLOY 1 - EXPAND: app dual-writes, reads with fallback
order.Name = value;        // keep writing old
order.FullName = value;    // also write new
var display = order.FullName ?? order.Name;   // read new, fallback old

// BACKFILL (online): UPDATE Orders SET full_name = name WHERE full_name IS NULL;

// DEPLOY 2 - SWITCH: app uses only full_name
order.FullName = value;
var display = order.FullName;

// DEPLOY 3 - CONTRACT: once no running code references "name":
// ALTER TABLE Orders DROP COLUMN name;
// Each deploy is independently safe with version coexistence.`,
                    language: 'csharp'
                },
                {
                    label: 'Graceful Shutdown + Probes',
                    code: `// Graceful shutdown: stop taking new work, drain in-flight, then exit
// so rolling deploys don't drop requests.
var app = builder.Build();
app.Lifetime.ApplicationStopping.Register(() =>
{
    // 1. Fail readiness probe -> LB/K8s stops sending new requests
    // 2. Finish in-flight requests (drain) within a grace period
    // 3. Close connections cleanly
});

// Kubernetes deployment: zero-downtime rolling update
// strategy:
//   type: RollingUpdate
//   rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }  // never drop capacity
// readinessProbe gates traffic; preStop hook + terminationGracePeriodSeconds
// allow draining before the pod is killed.`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Make Every Change Backward-Compatible</h4>
            <p>Because old and new versions coexist during deploys, each change must work with both. This is the
            single most important rule of zero-downtime.</p>
            <h4>Do: Use Expand-Contract for Schema Changes</h4>
            <p>Never make a breaking schema change in one step. Expand (add new, dual-write), migrate/backfill, then
            contract (remove old) across separate deploys.</p>
            <h4>Do: Decouple Schema Migrations from Code Deploys</h4>
            <p>Run additive migrations before the code that needs them; run destructive migrations only after the old
            code is fully gone. Migrations and deploys are separate, ordered steps.</p>
            <h4>Do: Use Health Checks and Graceful Shutdown</h4>
            <p>Readiness probes gate traffic; graceful shutdown drains in-flight requests so rolling instances don't
            drop them.</p>
            <h4>Do: Roll Out Gradually with Fast Rollback</h4>
            <p>Rolling/canary keep capacity up; blue-green and feature flags give near-instant rollback.</p>
            <h4>Do: Backfill Online, in Batches</h4>
            <p>Backfill large tables in small batches to avoid locking/long transactions that hurt live traffic.</p>`,
            callout: {
                type: 'tip',
                title: 'The Golden Rule: Version Coexistence',
                text: 'During any rolling/canary deploy, the old and new versions of your code run simultaneously against the same database. Every code and schema change must be safe for BOTH versions at once. Internalize this and most zero-downtime mistakes disappear.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Breaking Schema Change in One Step</h4>
            <p>Renaming/dropping a column or making it NOT NULL in a single deploy breaks the old code still running.
            Use expand-contract.</p>
            <h4>Mistake: Forgetting Version Coexistence</h4>
            <p>Designing as if only the new version exists. During the roll, old code is live too and must keep
            working with your change.</p>
            <h4>Mistake: Long-Locking Migrations</h4>
            <p>A migration that locks a large table (adding a NOT NULL column with a rewrite, a big UPDATE) blocks
            live queries — effectively downtime. Use additive steps + batched backfill.</p>
            <h4>Mistake: No Graceful Shutdown</h4>
            <p>Killing instances mid-request drops user requests during every rolling deploy. Drain first.</p>
            <h4>Mistake: Coupling Deploy and Destructive Migration</h4>
            <p>Dropping the old column in the same deploy as the code switch leaves no safe rollback and can break
            instances still on the old version.</p>
            <h4>Mistake: Irreversible Migrations Without a Plan</h4>
            <p>Destructive changes with no rollback path. Keep the old structure until the new one is proven, then
            contract.</p>`,
            code: `// DOWNTIME-CAUSING migration: drop + rename in one deploy with the code change
ALTER TABLE Users DROP COLUMN email;          -- old code still reads email -> 500s
EXEC sp_rename 'Users.mail', 'email';         -- breaks anything mid-flight
//
// Plus: a single NOT NULL add on a huge table can lock/rewrite it -> stalls.
// SAFE alternative: expand (add nullable) -> backfill in batches -> switch
// code -> add constraint -> contract (drop old) - each step non-breaking.`,
            language: 'sql'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Continuous Deployment</h4>
            <p>Teams deploying many times a day rely on zero-downtime techniques + feature flags so every deploy is a
            non-event for users.</p>
            <h4>Large-Scale Schema Migrations</h4>
            <p>Companies like GitHub and Stripe migrate huge production tables online using expand-contract and
            tools (gh-ost, pt-online-schema-change) that avoid table locks.</p>
            <h4>Kubernetes Rolling Updates</h4>
            <p>K8s defaults to rolling updates with readiness probes and surge/unavailable controls — zero-downtime
            deploys as a platform primitive.</p>
            <h4>Always-On SaaS</h4>
            <p>SaaS products with global users have no acceptable maintenance window, making zero-downtime
            deployment and migration a hard requirement, not a nicety.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Deployment strategies compared:</p>`,
            table: {
                headers: ['Strategy', 'Downtime', 'Rollback speed', 'Resource cost', 'Version coexistence'],
                rows: [
                    ['Recreate (stop-start)', 'Yes (outage)', 'Slow (redeploy)', 'Low', 'No'],
                    ['Rolling', 'None', 'Medium (roll back)', 'Low', 'Yes (during roll)'],
                    ['Blue-green', 'None', 'Instant (switch back)', 'High (2x env)', 'Brief at switch'],
                    ['Canary', 'None', 'Fast (reroute)', 'Medium', 'Yes (during canary)'],
                    ['Rolling + flags', 'None', 'Instant (flag off)', 'Low', 'Yes']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Zero-downtime techniques must not degrade live performance during deploys/migrations:</p>
            <h4>Maintain Capacity During Rollout</h4>
            <p>Use maxUnavailable: 0 (add new before removing old) so you never drop below needed capacity mid-deploy
            and cause latency spikes.</p>
            <h4>Online, Batched Migrations</h4>
            <p>Backfill and schema changes must avoid long locks and big transactions. Batch updates (e.g., 1k-10k
            rows) with pauses so live queries aren't blocked.</p>
            <h4>Avoid Lock-Heavy DDL</h4>
            <p>Some DDL (adding NOT NULL with rewrite, certain index builds) locks tables. Prefer online/concurrent
            variants (CREATE INDEX CONCURRENTLY) or tools (gh-ost) that copy-and-swap.</p>
            <h4>Warm Up New Instances</h4>
            <p>New instances may have cold caches/JIT; readiness gating + gradual traffic prevents a latency spike as
            they take load.</p>`,
            callout: {
                type: 'warning',
                title: 'Migrations Can Cause Hidden Downtime',
                text: 'A schema migration that takes a table lock or runs a massive single-transaction UPDATE blocks live queries \u2014 that IS downtime, even if your app deploy was "zero-downtime." Always make migrations online: additive, lock-light, and backfilled in small batches (or use online-schema-change tools).'
            }
        },
        {
            title: 'Testing',
            content: `<p>Test that old and new versions coexist and that migrations are safe.</p>
            <h4>Compatibility Testing</h4>
            <p>Verify the new code works with the current (pre-migration) schema, and that the old code still works
            after the expand step — simulating version coexistence.</p>
            <h4>Migration Testing on Production-Scale Data</h4>
            <p>Test migrations against production-sized data to catch lock/duration problems that don't appear on tiny
            test tables.</p>
            <h4>Rollout/Drain Testing</h4>
            <p>Validate graceful shutdown (no dropped requests during a rolling restart) and that readiness probes
            gate traffic correctly.</p>`,
            code: `// Compatibility test: new code must work with the CURRENT schema (pre-migrate)
[Fact]
public async Task NewCode_WorksWithOldSchema_BeforeMigration()
{
    // Arrange: DB still has only the old "name" column (expand not yet run)
    using var db = CreateDbWithOldSchema();
    var sut = new OrderService(db);   // new code with dual-write/fallback logic

    // Act + Assert: must not error reading/writing against old schema
    var order = await sut.CreateAsync(new("cust-1"));
    Assert.NotNull(await sut.GetAsync(order.Id));   // fallback to name works
}
// Also test OLD code against the post-expand schema (extra nullable column).`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Zero-downtime deployment is a senior/DevOps interview favorite:</p>
            <ul>
                <li><strong>Lead with version coexistence</strong> — old and new run together against one DB</li>
                <li><strong>Explain expand-contract</strong> for schema changes (the key insight)</li>
                <li><strong>Compare rolling/blue-green/canary</strong> and their rollback/cost trade-offs</li>
                <li><strong>Decouple migrations from deploys</strong> — additive before, destructive after</li>
                <li><strong>Mention graceful shutdown + readiness probes</strong> and online/batched migrations</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'The Column-Rename Question',
                text: 'A classic: "How do you rename a database column with zero downtime?" The answer is expand-contract across multiple deploys: add the new column, dual-write and read-with-fallback, backfill online, switch reads/writes to the new column, then drop the old one only after no running code references it. Reciting this confidently is a strong senior signal.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Resources</h4>
            <ul>
                <li>Martin Fowler: "ParallelChange" (expand-contract) and "BlueGreenDeployment"</li>
                <li><em>Database Reliability Engineering</em> by Campbell &amp; Majors</li>
                <li><em>Refactoring Databases</em> by Ambler &amp; Sadalage</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li>gh-ost, pt-online-schema-change (online MySQL migrations)</li>
                <li>Flyway, Liquibase, EF Core Migrations (versioned migrations)</li>
                <li>Kubernetes rolling updates; Argo Rollouts (canary/blue-green)</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Version coexistence is the golden rule:</strong> old + new code run together against one DB</li>
                <li><strong>Every change must be backward-compatible</strong> with the currently-running version</li>
                <li><strong>Expand-contract</strong> makes breaking schema changes safe across multiple deploys</li>
                <li><strong>Decouple migrations from deploys:</strong> additive before, destructive after old code is gone</li>
                <li><strong>Rolling/canary keep capacity up; blue-green + flags give instant rollback</strong></li>
                <li><strong>Migrations must be online:</strong> lock-light, batched backfill, no giant transactions</li>
                <li><strong>Graceful shutdown + readiness probes</strong> prevent dropped requests during rollout</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Zero-Downtime Column Split</h4>
            <p>You must split a single <code>fullName</code> column into <code>firstName</code> and
            <code>lastName</code> on a 50M-row table, with continuous deployment and no downtime:</p>
            <ol>
                <li>Plan the expand step: which columns to add and how (nullable)</li>
                <li>Update code to dual-write (write all three) and read with fallback</li>
                <li>Plan an online, batched backfill of existing rows</li>
                <li>Plan the switch deploy (read/write the new columns)</li>
                <li>Plan the contract step (drop fullName) and its precondition</li>
                <li>Identify the rollback plan at each stage and how you avoid table locks</li>
            </ol>`,
            code: `// Expand:   ADD firstName NULL, lastName NULL  (no lock-heavy NOT NULL yet)
// Code v1:  write fullName + firstName + lastName; read first/last w/ fallback
// Backfill: UPDATE ... SET first/last = split(fullName) WHERE first IS NULL
//           in batches of ~5k rows with pauses (no giant transaction)
// Code v2:  read/write only first/last
// Contract: after v2 fully rolled out (no code reads fullName) -> DROP fullName
// Rollback: each step is independently revertible; old column kept until safe
// TODO: write the migration steps + dual-write code + batched backfill`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> Why must changes be backward-compatible for zero-downtime deploys?<br/>
                    <em>A: During a rolling/canary deploy, old and new versions of the code run simultaneously against the
                    same database. A change that breaks the old (still-running) version causes errors \u2014 so every change
                    must work for both versions at once.</em></li>
                <li><strong>Q:</strong> What is the expand-contract (parallel change) pattern?<br/>
                    <em>A: A way to make breaking schema changes safely across multiple deploys: EXPAND (add the new
                    structure alongside the old, dual-write), migrate/backfill, switch reads to new, then CONTRACT
                    (remove the old) only after no running code uses it.</em></li>
                <li><strong>Q:</strong> How do you rename a column with zero downtime?<br/>
                    <em>A: Add the new column, dual-write and read-with-fallback, backfill existing rows online, switch
                    code to the new column, then drop the old column once no running code references it \u2014 expand-contract
                    across deploys.</em></li>
                <li><strong>Q:</strong> How can a migration cause downtime even with a zero-downtime deploy?<br/>
                    <em>A: If it takes a table lock or runs a massive single-transaction UPDATE, it blocks live queries.
                    Migrations must be online: additive, lock-light, and backfilled in small batches.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'What are the main zero-downtime deployment strategies and how do they differ?',
            difficulty: 'easy',
            answer: `<p>Three common strategies:</p>
            <ul>
                <li><strong>Rolling:</strong> replace instances a few at a time so the service stays up; low cost, but
                old and new versions coexist during the roll and rollback is a re-roll.</li>
                <li><strong>Blue-green:</strong> run two full environments; deploy/test the idle one, then switch all
                traffic instantly. Instant rollback (switch back), but ~2x infrastructure cost.</li>
                <li><strong>Canary:</strong> send a small traffic slice to the new version, monitor, then expand.
                Catches problems at small scale; needs traffic-routing control.</li>
            </ul>`,
            explanation: 'Rolling is repainting a fence one plank at a time (always usable). Blue-green is building a whole second fence and swapping which one people see. Canary is letting a few people use the new fence first to check it before everyone switches.',
            bestPractices: ['Use rolling/canary to keep capacity up', 'Blue-green for instant rollback when budget allows', 'Combine with feature flags for fine control'],
            commonMistakes: ['Recreate (stop-start) deploys causing outages', 'Ignoring version coexistence during rolling/canary'],
            interviewTip: 'Pair each strategy with its rollback speed and cost trade-off — that comparison is what interviewers probe.',
            followUp: ['Which gives the fastest rollback?', 'How do feature flags complement these?']
        },
        {
            question: 'How do you make a breaking database schema change with zero downtime?',
            difficulty: 'medium',
            answer: `<p>Use the <strong>expand-contract (parallel change)</strong> pattern, split across multiple
            deploys so the old and new code versions both keep working:</p>
            <ol>
                <li><strong>Expand:</strong> add the new structure (column/table) alongside the old, without removing
                anything. Make it nullable/defaulted so old code is unaffected.</li>
                <li><strong>Migrate:</strong> deploy code that dual-writes (old + new) and reads with fallback;
                backfill existing rows online in batches.</li>
                <li><strong>Switch:</strong> deploy code that reads/writes only the new structure.</li>
                <li><strong>Contract:</strong> once no running code references the old structure, remove it.</li>
            </ol>
            <p>Each step is independently safe because both currently-running versions work with the schema at that
            point. Never make the breaking change in a single deploy.</p>`,
            explanation: 'It is like changing a bridge while traffic flows: you build the new lanes beside the old (expand), gradually route cars onto them while both are open (migrate/switch), and only demolish the old lanes once no car uses them (contract). You never close the bridge.',
            code: `// Expand: ADD full_name NULL
// Migrate: dual-write name+full_name; read full_name ?? name; backfill in batches
// Switch: read/write only full_name
// Contract: DROP COLUMN name  (after old code is gone)`,
            language: 'sql',
            bestPractices: ['Split across multiple deploys', 'Additive (nullable) first; destructive last', 'Dual-write + read-with-fallback during transition', 'Backfill online in batches'],
            commonMistakes: ['Rename/drop in one deploy (breaks old code)', 'NOT NULL add that locks/rewrites a big table', 'Dropping old structure before old code is gone'],
            interviewTip: 'Name "expand-contract / parallel change" explicitly and walk the four steps. Stress that each step keeps both versions working.',
            followUp: ['How do you backfill a 50M-row table without locking?', 'When exactly is it safe to run the contract step?']
        },
        {
            question: 'Why is "version coexistence" the central challenge of zero-downtime deployment, and how does it shape your approach?',
            difficulty: 'hard',
            answer: `<p>During any non-instant deployment (rolling, canary), instances running the <em>old</em> version
            and the <em>new</em> version are live at the same time, serving traffic and hitting the <strong>same
            database</strong>. This <strong>version coexistence</strong> is the central challenge because any change
            that the old version can't handle will cause errors for the portion of traffic still on old instances —
            even though your new code is "correct."</p>
            <p>It shapes the entire approach:</p>
            <ul>
                <li><strong>Every change must be backward-compatible</strong> with the currently-running version —
                additive, not breaking.</li>
                <li><strong>Schema changes use expand-contract</strong> so both versions work at each step.</li>
                <li><strong>Migrations are decoupled from and ordered around deploys:</strong> additive migrations run
                <em>before</em> the code that needs them; destructive ones run <em>after</em> the old code is gone.</li>
                <li><strong>APIs/contracts evolve compatibly:</strong> add optional fields, never remove/repurpose
                fields that the old version (or other services) still send/expect.</li>
                <li><strong>Dual-write + read-with-fallback</strong> bridges the transition window.</li>
            </ul>
            <p>Once you internalize "both versions run together," the rules (additive changes, expand-contract,
            migration ordering) follow naturally — and most zero-downtime bugs are prevented by design.</p>`,
            explanation: 'Imagine swapping the menu in a busy restaurant where some waiters have the new menu and some still have the old, all taking orders from the same kitchen. If you remove a dish the old-menu waiters still offer, those orders fail. So you only ADD dishes both menus can handle, and remove old ones only after every waiter has the new menu. That coexistence constraint dictates how you change anything.',
            bestPractices: ['Assume old + new run together against one DB', 'Make all changes additive/backward-compatible', 'Expand-contract for schema; ordered migrations', 'Evolve APIs by adding optional fields, not removing', 'Dual-write + read-fallback during transitions'],
            commonMistakes: ['Designing as if only the new version exists', 'Breaking schema/API changes in one step', 'Running destructive migration before old code is gone', 'Removing/repurposing fields other versions still use'],
            interviewTip: 'Make version coexistence the thesis of your answer and derive every rule from it (additive changes, expand-contract, migration ordering, compatible APIs). That framing demonstrates you understand the WHY, not just memorized steps.',
            followUp: ['How does this apply to evolving a shared API/event schema?', 'How do you handle a change that truly cannot be made backward-compatible?', 'How do feature flags help during coexistence?'],
            seniorPerspective: 'I drill "both versions are running right now" into every team doing continuous deployment, because almost every zero-downtime incident I have seen comes from someone reasoning only about the new code. The mental model fixes it: before any change I ask "does the version currently in production still work after this?" \u2014 if not, it must be split into compatible steps. The same logic extends beyond the database to API and event-schema evolution across services: you add optional fields and tolerate unknown ones, and you only remove a field once you have proven nothing still emits or depends on it. Expand-contract is just this principle applied to schemas, and migration ordering (additive before deploy, destructive after) is it applied to time.'
        }
    ,
        {
            question: 'How do you perform a zero-downtime database schema change using expand-contract?',
            difficulty: 'hard',
            answer: `<p>The <strong>expand-contract</strong> (parallel change) pattern keeps the schema compatible with both old and new code throughout a rolling deploy, so there is never a moment where running code meets an incompatible schema.</p>
            <ol>
                <li><strong>Expand</strong> \u2014 add the new structure (nullable column / new table) without removing the old. Old code is unaffected.</li>
                <li><strong>Migrate code</strong> \u2014 deploy code that writes to both old and new (dual-write) and can read either.</li>
                <li><strong>Backfill</strong> \u2014 copy historical data into the new structure in batches.</li>
                <li><strong>Switch</strong> \u2014 deploy code that reads/writes only the new structure.</li>
                <li><strong>Contract</strong> \u2014 in a later release, drop the old column/table.</li>
            </ol>
            <p>A column rename becomes: add new \u2192 dual-write \u2192 backfill \u2192 read new \u2192 drop old \u2014 never a single breaking <code>RENAME</code>.</p>`,
            explanation: 'It is like replacing a bridge while traffic keeps flowing: you build the new bridge alongside the old, route cars onto it gradually, and only demolish the old one once nobody is using it.',
            code: `-- 1. EXPAND: add new column, nullable (non-breaking)
ALTER TABLE users ADD COLUMN full_name varchar(200) NULL;
-- 2. App deploy: dual-write old (first_name/last_name) AND full_name
-- 3. BACKFILL in batches
UPDATE users SET full_name = concat(first_name,' ',last_name)
WHERE full_name IS NULL LIMIT 10000;  -- repeat
-- 4. App deploy: read/write full_name only
-- 5. CONTRACT (later release): drop old columns
ALTER TABLE users DROP COLUMN first_name, DROP COLUMN last_name;`,
            language: 'sql',
            bestPractices: ['Never make a breaking schema change in the same release as the code', 'Add columns nullable/with default; dual-write during transition', 'Backfill large tables in bounded batches to avoid long locks', 'Drop old structures only after all instances use the new one'],
            commonMistakes: ['Renaming/dropping a column in one step (breaks in-flight old code)', 'Backfilling in one giant UPDATE that locks the table', 'Skipping the dual-write phase, causing data gaps during rollout', 'Contracting too early, before the old code is fully gone'],
            interviewTip: 'Spell out all five steps and emphasize that schema and code stay mutually compatible for at least one version window. A "rename" reframed as expand-contract is the canonical example.',
            followUp: ['How do you add a NOT NULL column with zero downtime?', 'Why backfill in batches?', 'How does this interact with rollback?'],
            seniorPerspective: 'Every breaking schema change is at least two deploys for me. The discipline is resisting the one-line rename \u2014 splitting it into expand and contract guarantees a rollback never lands code on a schema it cannot use.',
            architectPerspective: 'Expand-contract encodes the rule that code and schema must be independently deployable and backward-compatible across a version window. That property is the foundation of continuous delivery on a live database without maintenance windows.'
        },
        {
            question: 'Compare rolling, blue-green, and canary deployments. When would you use each?',
            difficulty: 'medium',
            answer: `<p>All three avoid big-bang downtime but differ in risk, cost, and rollback speed:</p>
            <ul>
                <li><strong>Rolling</strong> \u2014 replace instances gradually (old \u2192 new). No extra environment cost; rollback means rolling back, which is slower. K8s default. Old and new run together, so versions must be compatible.</li>
                <li><strong>Blue-green</strong> \u2014 stand up a full new environment (green), switch traffic at once, keep blue as instant rollback. Fast, safe rollback; costs double infrastructure during the switch.</li>
                <li><strong>Canary</strong> \u2014 route a small % of traffic to the new version, watch metrics, then ramp. Best for validating with real traffic at minimal blast radius; needs good monitoring and traffic-shaping.</li>
            </ul>`,
            explanation: 'Rolling is swapping tires one at a time while driving; blue-green is having a second identical car ready and stepping across; canary is sending one passenger in the new car first to make sure it\u2019s safe before everyone boards.',
            code: `// Choose by risk/cost/rollback
// rolling    -> default, cheap, stateless apps; slower rollback
// blue-green -> instant rollback needed; can afford 2x infra briefly
// canary     -> validate in prod with real traffic; needs metrics + auto-rollback`,
            language: 'javascript',
            bestPractices: ['Use rolling as the low-cost default for stateless services', 'Use blue-green when you need instant, low-risk rollback', 'Use canary to validate risky changes on real traffic with auto-rollback', 'Ensure version compatibility (rolling/canary run old+new simultaneously)'],
            commonMistakes: ['Canary without metrics/auto-rollback (you cannot tell it is failing)', 'Rolling/canary with backward-incompatible changes (old+new coexist)', 'Ignoring blue-green\u2019s double-infra cost and stateful/data concerns', 'Treating any of them as a substitute for backward-compatible changes'],
            interviewTip: 'Compare on three axes \u2014 risk, cost, rollback speed \u2014 and stress that rolling and canary run old and new together, so changes must be backward compatible. Canary requires good observability to be meaningful.',
            followUp: ['How does canary decide to promote or roll back?', 'What are blue-green\u2019s challenges with databases?', 'How do feature flags complement these?'],
            seniorPerspective: 'I pair canary with automated metric analysis and auto-rollback \u2014 a canary nobody is watching is just a slow full deploy. And I separate deploy from release with feature flags so I can ship code dark and turn it on independently.',
            architectPerspective: 'These strategies all assume backward compatibility between versions \u2014 the real enabler of zero-downtime. The deployment mechanism is secondary; the discipline of forward/backward-compatible changes plus observability and fast rollback is what actually delivers continuous, safe releases.'
        },
        {
            question: 'How do you handle graceful shutdown and in-flight requests during a deployment?',
            difficulty: 'hard',
            answer: `<p>Without graceful shutdown, replacing an instance kills in-flight requests and drops messages. The sequence:</p>
            <ul>
                <li><strong>Stop accepting new work</strong> \u2014 fail readiness probe / deregister from the load balancer so no new requests route in (connection draining).</li>
                <li><strong>Finish in-flight</strong> \u2014 let active requests complete within a grace period before exiting.</li>
                <li><strong>Handle SIGTERM</strong> \u2014 the orchestrator sends SIGTERM, then SIGKILL after a timeout; your app must catch SIGTERM and drain, not exit immediately.</li>
                <li><strong>Workers</strong> \u2014 stop pulling new messages, finish/ack current ones, and rely on at-least-once redelivery for anything unfinished.</li>
                <li><strong>Tune timeouts</strong> \u2014 the termination grace period must exceed your longest normal request.</li>
            </ul>`,
            explanation: 'It is like closing a shop: you lock the front door to new customers (stop readiness) but let the people already inside finish checking out (drain) before turning off the lights (exit) \u2014 rather than shoving everyone out mid-purchase.',
            code: `// .NET: graceful shutdown on SIGTERM with connection draining
var app = builder.Build();
var lifetime = app.Lifetime;
lifetime.ApplicationStopping.Register(() =>
{
    // readiness now reports unhealthy -> LB stops sending new requests
    healthState.MarkNotReady();
});
// Host honors ShutdownTimeout to let in-flight requests finish
builder.Services.Configure<HostOptions>(o =>
    o.ShutdownTimeout = TimeSpan.FromSeconds(30));  // > longest normal request
// Kubernetes: set terminationGracePeriodSeconds >= ShutdownTimeout`,
            language: 'csharp',
            bestPractices: ['Fail readiness first so the LB drains connections before shutdown', 'Catch SIGTERM and finish in-flight work within a grace period', 'Set termination grace period longer than your slowest normal request', 'For workers, stop consuming, finish/ack current messages, rely on redelivery'],
            commonMistakes: ['Exiting immediately on SIGTERM, dropping in-flight requests', 'Grace period shorter than request duration (forced SIGKILL mid-request)', 'Not deregistering from the LB, so traffic routes to a dying instance', 'Workers that drop unacked messages instead of letting them redeliver'],
            interviewTip: 'Walk the order: fail readiness \u2192 drain \u2192 SIGTERM handler finishes in-flight \u2192 exit before SIGKILL. The classic bug is a grace period shorter than the longest request.',
            followUp: ['What happens between SIGTERM and SIGKILL in Kubernetes?', 'How does readiness vs liveness matter during shutdown?', 'How do you drain a queue consumer safely?'],
            seniorPerspective: 'The detail teams miss is ordering: you must fail readiness and let the load balancer drain before the process starts shutting down, otherwise requests keep arriving at a server that is closing. And the grace period has to exceed the slowest request or you just moved the dropped-request problem.',
            architectPerspective: 'Graceful shutdown is what makes rolling/blue-green/canary actually zero-downtime \u2014 the deployment strategy is moot if each instance swap drops live traffic. Combined with at-least-once redelivery for async work, it ensures instance churn is invisible to users.'
        },
        {
            question: 'How do you perform a zero-downtime database column rename? Walk through the expand-contract steps.',
            difficulty: 'hard',
            answer: `<p>A column rename is actually one of the most dangerous zero-downtime operations because it is NOT backward-compatible — old code expects the old name, new code expects the new name.</p>
<h4>Expand-Contract Approach (minimum 3 deploys):</h4>
<p><strong>Step 1 — Expand (Migration 1):</strong></p>
<ol>
<li>Add the new column (e.g., <code>full_name</code>) alongside the old one (<code>name</code>)</li>
<li>Backfill: copy all existing data from old column to new column</li>
<li>Add a trigger or application-level dual-write so both columns stay in sync</li>
</ol>
<p><strong>Step 2 — Migrate Code (Deploy 2):</strong></p>
<ol>
<li>Update ALL application code to read from and write to the NEW column</li>
<li>Keep writing to both columns (in case you need to rollback)</li>
<li>Verify: new column has correct data, old column is still being written</li>
</ol>
<p><strong>Step 3 — Contract (Migration 3):</strong></p>
<ol>
<li>Stop writing to the old column</li>
<li>Drop the trigger/dual-write logic</li>
<li>Drop the old column (after a safe period to ensure no rollback needed)</li>
</ol>
<p><strong>Why 3 steps?</strong> At every point, rollback is safe: old code can still use the old column, new code uses the new column, and data is consistent in both.</p>
<p><strong>Critical constraint:</strong> Between Step 1 and Step 3, BOTH old and new versions of the code must work against the same database. This is the backward-compatibility window that makes zero-downtime possible.</p>`,
            bestPractices: ['Never rename in place — always expand then contract', 'Maintain dual-write during the transition so rollback is always safe', 'Wait at least one full deploy cycle before dropping the old column', 'Use feature flags to control which column is the "source of truth" during migration'],
            commonMistakes: ['Renaming the column in one migration — instantly breaks old code still running', 'Forgetting to backfill existing rows (new column is NULL for old records)', 'Dropping the old column before confirming all code uses the new one', 'Not testing rollback — deploying step 2 and discovering you cannot roll back to step 1'],
            interviewTip: 'Walk through all 3 steps explicitly and explain WHY each is needed (backward compatibility window). The key insight is that old and new code versions coexist during rolling deploys.',
            followUp: ['How long should you keep the old column before dropping it?', 'What if the table has billions of rows — how do you handle the backfill?']
        },
        {
            question: 'How do you handle a zero-downtime migration of a high-traffic table with billions of rows?',
            difficulty: 'expert',
            answer: `<p>Large table migrations (adding/modifying columns, restructuring data) on live production tables require special techniques because a naive <code>ALTER TABLE</code> or backfill can lock the table and cause downtime.</p>
<h4>Strategies:</h4>
<p><strong>1. Online Schema Migration Tools:</strong></p>
<ul>
<li><strong>pt-online-schema-change (Percona, MySQL):</strong> Creates a shadow table with the new schema, copies data in chunks using triggers to capture live changes, then atomically swaps.</li>
<li><strong>gh-ost (GitHub, MySQL):</strong> Similar but uses binary log streaming instead of triggers (less overhead on the source table).</li>
<li><strong>SQL Server Online Index Rebuild:</strong> <code>ALTER INDEX ... REBUILD WITH (ONLINE = ON)</code></li>
</ul>
<p><strong>2. Chunked Backfill (for data migration):</strong></p>
<ul>
<li>Process rows in batches (e.g., 10,000 at a time) with pauses between batches</li>
<li>Use a cursor/bookmark column (e.g., ID > last_processed_id) for resumability</li>
<li>Rate-limit to avoid saturating the database (monitor replication lag and pause if too high)</li>
<li>Idempotent: safe to restart from any point</li>
</ul>
<p><strong>3. Dual-Write + Lazy Migration:</strong></p>
<ul>
<li>New code writes to both old and new schema</li>
<li>Background job slowly backfills old data to new schema</li>
<li>Reads check new schema first, fall back to old if not migrated yet</li>
<li>Once backfill is complete, switch reads entirely to new schema and drop old</li>
</ul>
<p><strong>Key principles:</strong> Never hold table locks for extended periods. Always be resumable (crash-safe). Monitor replication lag and database load. Have a kill switch to pause the migration instantly if it causes problems.</p>`,
            bestPractices: ['Use online schema change tools (pt-osc, gh-ost) that avoid long-held locks', 'Chunk backfills into small batches with monitoring and rate-limiting', 'Make migrations idempotent and resumable (can crash and restart safely)', 'Monitor replication lag and pause if replicas fall behind'],
            commonMistakes: ['Running ALTER TABLE on a billion-row table and locking it for 30 minutes', 'Backfilling all rows in one transaction (exhausts undo log, causes long lock)', 'Not monitoring database load during migration — saturating IOPS, killing production queries', 'No kill switch — migration causes problems but you cannot stop it safely'],
            interviewTip: 'Name specific tools (pt-osc, gh-ost) and the chunked-backfill pattern. Showing you understand WHY naive ALTER is dangerous (locks) signals production experience with large tables.',
            followUp: ['How does gh-ost differ from pt-online-schema-change?', 'What do you do if the migration fails halfway through on a 2-billion-row table?']
        }
    ]
});
