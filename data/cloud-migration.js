/* ═══════════════════════════════════════════════════════════════════
   Cloud Migration Strategies: 6Rs, Assessment, Wave Planning
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('cloud-migration', {
    title: 'Cloud Migration Strategies',
    description: 'The 6Rs migration framework, application assessment and discovery, wave planning, lift-and-shift patterns, replatforming, refactoring to cloud-native, hybrid connectivity, multi-cloud strategy, and migration testing with rollback planning.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>Cloud migration is a strategic initiative that moves workloads from on-premises data centers to cloud platforms. It is rarely a purely technical exercise — it involves business case analysis, organizational change, risk management, and phased execution.</p>
            <p>Interview questions focus on <strong>decision-making</strong>: which strategy for which application, how to sequence migrations safely, and how to validate success. Senior candidates demonstrate awareness of both technical patterns and the business context driving migration decisions.</p>`
        },
        {
            title: 'The 6Rs Migration Framework',
            content: `<p>The <strong>6Rs</strong> categorize applications by the appropriate migration strategy:</p>
            <table><thead><tr><th>Strategy</th><th>Description</th><th>Effort</th><th>When to Use</th></tr></thead><tbody>
                <tr><td><strong>Rehost</strong> (Lift & Shift)</td><td>Move as-is to cloud VMs</td><td>Low</td><td>Quick win, minimal risk, large portfolio migration</td></tr>
                <tr><td><strong>Replatform</strong> (Lift & Reshape)</td><td>Minor optimizations (managed DB, containers)</td><td>Medium</td><td>Quick cloud benefits without full re-architecture</td></tr>
                <tr><td><strong>Refactor</strong> (Re-architect)</td><td>Redesign for cloud-native (microservices, serverless)</td><td>High</td><td>Strategic applications that need cloud scalability</td></tr>
                <tr><td><strong>Repurchase</strong></td><td>Replace with SaaS (Exchange → O365, custom CRM → Salesforce)</td><td>Medium</td><td>Commodity workloads available as managed SaaS</td></tr>
                <tr><td><strong>Retire</strong></td><td>Decommission — no longer needed</td><td>None</td><td>Unused, redundant, or end-of-life applications</td></tr>
                <tr><td><strong>Retain</strong></td><td>Keep on-premises (for now)</td><td>None</td><td>Compliance, latency, or mainframe dependencies</td></tr>
            </tbody></table>
            <p><strong>Distribution in typical enterprise:</strong> ~40% Rehost, ~25% Replatform, ~15% Refactor, ~10% Repurchase, ~5% Retire, ~5% Retain.</p>`
        },
        {
            title: 'Migration Decision Tree',
            mermaid: `graph TD
    START["Application Assessment"] --> Q1{"Still needed?"}
    Q1 -->|No| RETIRE["RETIRE<br/>Decommission"]
    Q1 -->|Yes| Q2{"Available as SaaS?"}
    Q2 -->|Yes, and fits| REPURCHASE["REPURCHASE<br/>Move to SaaS"]
    Q2 -->|No or doesn't fit| Q3{"Must stay on-prem?"}
    Q3 -->|Yes| RETAIN["RETAIN<br/>Keep on-premises"]
    Q3 -->|No| Q4{"Strategic / needs<br/>cloud-native benefits?"}
    Q4 -->|Yes - full redesign| REFACTOR["REFACTOR<br/>Re-architect for cloud"]
    Q4 -->|Moderate optimization| REPLATFORM["REPLATFORM<br/>Managed services, containers"]
    Q4 -->|No - just move it| REHOST["REHOST<br/>Lift & Shift to VMs"]

    style RETIRE fill:#f99,stroke:#333
    style REPURCHASE fill:#9cf,stroke:#333
    style RETAIN fill:#ccc,stroke:#333
    style REFACTOR fill:#9f9,stroke:#333
    style REPLATFORM fill:#ff9,stroke:#333
    style REHOST fill:#fc9,stroke:#333`,
            content: `<p>This decision tree guides the strategy selection for each application. The process starts with portfolio rationalization (do we even need this?) before considering the migration approach. Each decision point represents a trade-off between speed, cost, and long-term benefit.</p>`
        },
        {
            title: 'Assessment and Discovery',
            content: `<p>Before migrating, you must understand what you have and how it is connected:</p>
            <ul>
                <li><strong>Application Dependency Mapping</strong> — tools like AWS Application Discovery Service, Azure Migrate, or Cloudamize scan networks to discover servers, dependencies, and traffic patterns. Produces a map of "App A talks to DB B on port 5432."</li>
                <li><strong>TCO (Total Cost of Ownership) Analysis</strong> — compare on-prem costs (hardware, power, cooling, staff, licenses) to cloud costs (compute, storage, egress, managed services). Include: depreciation, opportunity cost of staff doing undifferentiated work.</li>
                <li><strong>Technical Assessment</strong> — OS versions, database engines, framework versions, licensing constraints (Oracle per-core, Windows Server), 32-bit vs 64-bit, custom hardware dependencies.</li>
                <li><strong>Risk Assessment</strong> — data sovereignty requirements, compliance constraints (PCI, HIPAA, SOX), performance SLAs, DR requirements.</li>
                <li><strong>Business Criticality</strong> — classify apps as mission-critical, business-important, or non-essential. This drives migration sequence and risk tolerance.</li>
            </ul>`,
            code: `// C# — Assessment data model for migration planning
public record ApplicationAssessment
{
    public string Name { get; init; }
    public string Owner { get; init; }
    public BusinessCriticality Criticality { get; init; }
    public MigrationStrategy RecommendedStrategy { get; init; }
    public int MigrationWave { get; init; }

    // Technical details
    public string OperatingSystem { get; init; }
    public string DatabaseEngine { get; init; }
    public List<string> Dependencies { get; init; } = [];
    public List<string> ComplianceRequirements { get; init; } = [];

    // Cost analysis
    public decimal CurrentMonthlyCost { get; init; }
    public decimal ProjectedCloudCost { get; init; }
    public decimal MigrationEffortDays { get; init; }

    // Risk factors
    public int RiskScore { get; init; }  // 1-10
    public string RiskJustification { get; init; }
}

public enum MigrationStrategy
{
    Rehost, Replatform, Refactor, Repurchase, Retire, Retain
}

public enum BusinessCriticality
{
    MissionCritical, BusinessImportant, NonEssential
}`,
            language: 'csharp'
        },
        {
            title: 'Wave Planning and Execution',
            mermaid: `graph LR
    subgraph Wave1["Wave 1: Low Risk"]
        W1A["Dev/Test Environments"]
        W1B["Static Websites"]
        W1C["Non-critical internal tools"]
    end

    subgraph Wave2["Wave 2: Medium Risk"]
        W2A["Stateless web apps"]
        W2B["Queue workers"]
        W2C["Reporting services"]
    end

    subgraph Wave3["Wave 3: Higher Risk"]
        W3A["Customer-facing APIs"]
        W3B["Core business apps"]
        W3C["Shared databases"]
    end

    subgraph Wave4["Wave 4: Critical"]
        W4A["Payment processing"]
        W4B["Core platform"]
        W4C["Mainframe integration"]
    end

    Wave1 -->|"Lessons learned"| Wave2
    Wave2 -->|"Process refined"| Wave3
    Wave3 -->|"Team confident"| Wave4`,
            content: `<p><strong>Wave planning</strong> groups applications into migration batches ordered by risk and dependency:</p>
            <ul>
                <li><strong>Wave 1:</strong> Low-risk, low-dependency apps (dev environments, static sites). Builds team skills and proves the process.</li>
                <li><strong>Wave 2:</strong> Medium-risk stateless applications. Tests the migration pipeline with real workloads.</li>
                <li><strong>Wave 3:</strong> Business-critical applications with dependencies. Requires thorough testing and rollback plans.</li>
                <li><strong>Wave 4:</strong> Core platform and highest-risk workloads. Team is experienced, processes are proven.</li>
            </ul>
            <p><strong>Grouping criteria:</strong> Applications that share databases or have synchronous dependencies should migrate together (avoid split-brain scenarios). Independent applications can move in any order.</p>`
        },
        {
            title: 'Replatform and Refactor Patterns',
            content: `<p><strong>Replatform examples</strong> (moderate effort, significant benefits):</p>
            <ul>
                <li><strong>SQL Server → Azure SQL / RDS</strong> — same engine, managed (patching, backups, HA handled by cloud).</li>
                <li><strong>IIS on VMs → Azure App Service / ECS</strong> — same app, managed hosting (auto-scaling, TLS, deployment slots).</li>
                <li><strong>VMs → Containers (Docker)</strong> — same app containerized, deployed to ECS/EKS/AKS. Gains portability and density.</li>
                <li><strong>File shares → S3/Blob Storage</strong> — object storage with built-in redundancy, lifecycle policies, CDN integration.</li>
                <li><strong>SMTP server → SES/SendGrid</strong> — managed email without maintaining mail infrastructure.</li>
            </ul>
            <p><strong>Refactor examples</strong> (high effort, transformational benefits):</p>
            <ul>
                <li><strong>Monolith → Microservices</strong> — decompose by business domain using Strangler Fig pattern.</li>
                <li><strong>Synchronous → Event-driven</strong> — replace direct calls with message queues (SQS, EventBridge).</li>
                <li><strong>Custom scheduling → Serverless</strong> — replace Windows Services with Lambda/Functions + event triggers.</li>
                <li><strong>Session state → Distributed cache</strong> — move from in-memory/sticky sessions to Redis/ElastiCache.</li>
            </ul>`,
            code: `// C# — Strangler Fig migration pattern
// Old monolith endpoint (still running):
// GET /api/orders/{id} → Monolith handles everything

// New microservice (gradually takes over):
// Phase 1: Proxy pattern - API Gateway routes to new service for reads
app.MapGet("/api/orders/{id}", async (int id, IOrderReadService svc) =>
{
    // New service handles reads (eventually consistent from event store)
    var order = await svc.GetByIdAsync(id);
    return order is not null ? Results.Ok(order) : Results.NotFound();
});

// Phase 2: Feature flag controls which service handles writes
app.MapPost("/api/orders", async (CreateOrderRequest req,
    IFeatureManager features, IOrderService newSvc, ILegacyProxy legacy) =>
{
    if (await features.IsEnabledAsync("UseNewOrderService"))
    {
        // New microservice handles the write
        var order = await newSvc.CreateAsync(req);
        return Results.Created($"/api/orders/{order.Id}", order);
    }
    // Fallback to legacy monolith during migration
    return await legacy.ForwardAsync("POST", "/api/orders", req);
});

// Phase 3: Data migration — replicate data from monolith DB
// Use Change Data Capture (CDC) to stream changes to new service's DB
// Both systems have consistent data during transition

// Phase 4: Full cutover — retire monolith endpoint
// Remove feature flag, decommission legacy route`,
            language: 'csharp'
        },
        {
            title: 'Hybrid Connectivity and Data Sync',
            content: `<p>During migration, applications run in both on-prem and cloud. Hybrid patterns manage this transition:</p>
            <ul>
                <li><strong>VPN / Direct Connect</strong> — private connectivity between data center and cloud VPC. Start with VPN (quick), add Direct Connect for production traffic.</li>
                <li><strong>Database replication</strong> — AWS DMS, Azure Database Migration Service for continuous data sync during cutover window.</li>
                <li><strong>DNS-based traffic shifting</strong> — weighted routing (Route 53, Traffic Manager) to gradually shift traffic from on-prem to cloud.</li>
                <li><strong>API Gateway as facade</strong> — single entry point that routes requests to either on-prem or cloud based on path/feature flag.</li>
                <li><strong>Event bridge</strong> — publish events from on-prem to cloud message bus for eventual consistency during transition.</li>
            </ul>
            <p><strong>Data gravity:</strong> Applications tend to move toward their data. Migrating the database first (with replication back to on-prem for rollback) often simplifies application migration.</p>`
        },
        {
            title: 'Migration Testing and Rollback',
            content: `<p>Every migration must have a validated rollback plan. Testing strategy by phase:</p>
            <ul>
                <li><strong>Pre-migration testing:</strong> Deploy application in cloud without traffic. Run full regression, performance baseline, integration tests against cloud versions of dependencies.</li>
                <li><strong>Shadow testing:</strong> Mirror production traffic to cloud deployment, compare responses (status codes, payloads, latency). Identify behavioral differences before cutover.</li>
                <li><strong>Canary cutover:</strong> Route 1-5% of production traffic to cloud via DNS weighted routing. Monitor error rate, latency, business metrics. Expand only when metrics confirm parity.</li>
                <li><strong>Full cutover:</strong> Shift 100% of traffic. Keep on-premises environment warm for 2-4 weeks as rollback target.</li>
                <li><strong>Rollback triggers:</strong> Define explicit criteria — error rate > X%, latency > Yms, business metric drops > Z%. Automated or manual revert to on-prem DNS.</li>
            </ul>
            <p><strong>Data rollback challenge:</strong> Once writes go to the cloud database, rolling back requires reverse data sync. Maintain bidirectional replication during the bake period.</p>`
        },
        {
            title: 'Multi-Cloud Strategy',
            content: `<p><strong>When multi-cloud makes sense:</strong></p>
            <ul>
                <li>Regulatory requirements mandate avoiding single-vendor lock-in.</li>
                <li>M&A activity combines organizations on different clouds.</li>
                <li>Best-of-breed services (GCP for ML, AWS for breadth, Azure for Microsoft stack).</li>
                <li>Disaster recovery across cloud providers (rare, expensive to do well).</li>
            </ul>
            <p><strong>Challenges:</strong></p>
            <ul>
                <li><strong>Lowest common denominator</strong> — abstracting away cloud-specific features reduces the value proposition.</li>
                <li><strong>Operational complexity</strong> — team must know 2-3 clouds deeply. Training, tooling, and monitoring multiply.</li>
                <li><strong>Data egress costs</strong> — moving data between clouds is expensive.</li>
                <li><strong>Networking complexity</strong> — cross-cloud connectivity, DNS, security policies across providers.</li>
                <li><strong>Abstraction layers</strong> — Kubernetes (portable compute), Terraform (portable IaC), Pulumi, Crossplane for multi-cloud management.</li>
            </ul>
            <p><strong>Pragmatic approach:</strong> Use one primary cloud fully (leverage managed services), with a secondary cloud only for specific workloads that justify it. Avoid "write once, run anywhere" abstractions unless the business case is proven.</p>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Lift-and-shift everything</strong> — moving VMs as-is misses cloud benefits (scaling, managed services) and can cost MORE than on-prem.</li>
                <li><strong>No assessment</strong> — migrating without understanding dependencies leads to split applications with cross-network latency.</li>
                <li><strong>Big bang migration</strong> — moving everything at once instead of waves. One problem affects everything.</li>
                <li><strong>Underestimating data transfer time</strong> — terabytes of data take time. Plan for multi-day/week data sync windows.</li>
                <li><strong>No rollback plan</strong> — cutting over without the ability to fall back to on-prem if issues arise.</li>
                <li><strong>Ignoring licensing</strong> — Oracle, SQL Server, Windows Server licensing can be drastically different in cloud (per-core vs per-vCPU).</li>
                <li><strong>Premature refactor</strong> — rewriting a stable monolith to microservices during migration adds risk on top of risk.</li>
                <li><strong>Multi-cloud without justification</strong> — complexity and cost with unclear benefits. Most orgs are better served going deep on one cloud.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li><strong>Strategic thinking</strong> — not every app should be refactored; explain the trade-off between speed and long-term benefit for each R</li>
                    <li><strong>Risk management</strong> — wave planning, rollback plans, parallel running, and progressive cutover show production awareness</li>
                    <li><strong>Business context</strong> — TCO analysis, data center lease expiry deadlines, and organizational readiness drive migration priorities</li>
                    <li><strong>Dependency awareness</strong> — know that tightly coupled apps must migrate together and that databases create data gravity</li>
                    <li><strong>Honest about multi-cloud</strong> — acknowledge complexity and cost; recommend single-cloud-primary unless there is a specific justification</li>
                    <li><strong>Testing discipline</strong> — parallel running, smoke tests, load tests in cloud before cutover, and rollback validation</li>
                    <li><strong>Experience stories</strong> — share a migration you participated in: what went well, what surprised you, what you would do differently</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>The 6Rs provide a framework for categorizing applications — most enterprises end up with a mix of strategies.</li>
                <li>Assessment before migration prevents split-brain applications and surprise licensing costs.</li>
                <li>Wave planning starts with low-risk apps to build confidence and refine processes before touching critical systems.</li>
                <li>Replatform gives 80% of cloud benefits with 20% of refactoring effort — it is often the sweet spot.</li>
                <li>The Strangler Fig pattern enables incremental refactoring without big-bang rewrites.</li>
                <li>Hybrid connectivity (VPN/Direct Connect) is essential during transition — plan for months of parallel operation.</li>
                <li>Multi-cloud is a strategy, not a default — go deep on one cloud unless a specific business requirement demands otherwise.</li>
                <li>Always have a rollback plan — parallel running with DNS-based traffic shifting is the safest cutover pattern.</li>
            </ul>`
        }
    ],
    questions: [
        {
            question: 'Explain the 6Rs of cloud migration. How do you decide which strategy applies to a given application?',
            difficulty: 'easy',
            answer: `<p>The <strong>6Rs</strong> categorize migration strategies by effort and transformation level:</p>
            <ul>
                <li><strong>Rehost</strong> — lift and shift to VMs. Fastest, lowest risk, no code changes. Good for: deadline-driven migrations, stable apps without cloud optimization needs.</li>
                <li><strong>Replatform</strong> — minor modifications to leverage managed services (e.g., swap self-managed PostgreSQL for RDS). Moderate effort, significant operational benefits.</li>
                <li><strong>Refactor</strong> — re-architect for cloud-native (microservices, serverless). High effort, highest long-term value. Reserved for strategic apps needing cloud scalability.</li>
                <li><strong>Repurchase</strong> — replace with SaaS. Good for commodity workloads (email, CRM, HR systems).</li>
                <li><strong>Retire</strong> — decommission. Saves migration effort entirely.</li>
                <li><strong>Retain</strong> — keep on-prem. For apps with compliance, latency, or mainframe dependencies that prevent migration.</li>
            </ul>
            <p><strong>Decision factors:</strong> business criticality, strategic importance, technical debt level, dependency complexity, available timeline, and team skills.</p>`,
            interviewTip: 'Don\'t just list the 6Rs — explain the decision criteria. "For this type of app I would choose Replatform because..." demonstrates analytical thinking. Mention that 70%+ of apps are typically rehosted or replatformed (the majority are not worth refactoring).',
            followUp: ['What percentage of apps typically fall into each R?', 'When is Rehost more expensive than Replatform?', 'How does data center lease expiry affect the 6R decision?'],
            seniorPerspective: 'I start by identifying the 10-20% of apps worth refactoring (revenue-generating, scaling challenges), replatform another 25% for quick cloud benefits (managed DB, containers), and rehost the rest for speed. The fastest migration wins are usually finding apps to retire.',
            architectPerspective: 'The 6R decision is fundamentally a cost-benefit-risk analysis per application. The strategy should be portfolio-driven: migrate the whole portfolio on a timeline that balances business urgency with risk tolerance. Trying to refactor everything extends the timeline and increases risk.'
        },
        {
            question: 'How do you plan migration waves? What criteria determine which applications move first?',
            difficulty: 'medium',
            answer: `<p><strong>Wave planning criteria:</strong></p>
            <ul>
                <li><strong>Risk level</strong> — start with low-risk, non-critical apps (dev environments, internal tools) to build confidence.</li>
                <li><strong>Dependencies</strong> — apps that share a database or have synchronous dependencies must be in the same wave or adjacent waves.</li>
                <li><strong>Business criticality</strong> — mission-critical apps go later (after the team is experienced and processes are proven).</li>
                <li><strong>Technical readiness</strong> — apps with modern stacks (containers, .NET Core) are easier to migrate than legacy (Windows Server 2008, .NET Framework 3.5).</li>
                <li><strong>Quick wins</strong> — stateless web apps, static sites, and standalone services that demonstrate value early.</li>
            </ul>
            <p><strong>Typical wave structure:</strong> Wave 1 (dev/test, static sites), Wave 2 (stateless apps, workers), Wave 3 (customer-facing, shared DBs), Wave 4 (core platform, payment, compliance-heavy).</p>`,
            interviewTip: 'Emphasize the learning objective: early waves are as much about proving the process (network connectivity, CI/CD, monitoring) as about moving workloads. What you learn in Wave 1 informs and de-risks Wave 4.',
            followUp: ['How do you handle apps that depend on a mainframe that cannot migrate?', 'What is the typical duration per wave?', 'How do you communicate wave schedules to stakeholders?'],
            seniorPerspective: 'I always include a "pilot" wave of 2-3 apps that exercises the full stack: network path, CI/CD pipeline, monitoring, and operational runbook. This pilot reveals gaps (DNS resolution, firewall rules, certificate management) before they affect critical apps.',
            architectPerspective: 'Wave planning is risk management. The goal is to learn cheaply (early waves) and apply those lessons to expensive situations (later waves). Dependency mapping is the technical foundation — but organizational readiness (team skills, runbook maturity, monitoring coverage) determines whether waves succeed or fail.'
        },
        {
            question: 'Describe the Strangler Fig pattern for migrating a monolith to microservices. How do you execute it safely?',
            difficulty: 'hard',
            answer: `<p>The <strong>Strangler Fig</strong> pattern incrementally migrates a monolith by routing specific functionality to new services while the old system continues handling everything else. Over time, the new services "strangle" the monolith until it can be decommissioned.</p>
            <p><strong>Execution steps:</strong></p>
            <ol>
                <li><strong>Place a facade</strong> — API Gateway or reverse proxy in front of the monolith. All traffic flows through it.</li>
                <li><strong>Extract one bounded context</strong> — build a new microservice for one domain (e.g., Orders). Deploy alongside the monolith.</li>
                <li><strong>Route selectively</strong> — configure the facade to route /api/orders to the new service, everything else to the monolith.</li>
                <li><strong>Manage data</strong> — either share the database initially (anti-pattern but pragmatic) or replicate data via CDC/events.</li>
                <li><strong>Validate</strong> — shadow traffic, parallel running, compare responses between old and new.</li>
                <li><strong>Repeat</strong> — extract the next bounded context. Each extraction reduces the monolith.</li>
                <li><strong>Decommission</strong> — once all functionality is migrated, retire the monolith.</li>
            </ol>`,
            interviewTip: 'The critical safety mechanism is the ability to roll back routing at the facade level. If the new service has issues, the proxy reverts to the monolith in seconds. Mention feature flags for gradual traffic shifting (1% → 10% → 50% → 100%).',
            followUp: ['How do you handle the shared database during strangler fig migration?', 'What is the anti-corruption layer pattern?', 'How long does a typical strangler fig migration take?'],
            seniorPerspective: 'I extract one bounded context at a time, running both implementations in parallel with response comparison. The facade gives me instant rollback. I resist the temptation to extract multiple services simultaneously — serial extraction is slower but dramatically safer.',
            architectPerspective: 'The Strangler Fig is not just a technical pattern but an organizational one. Each extracted service can be owned by a team, enabling the Conway\'s Law alignment that makes microservices sustainable. Without organizational restructuring, you just get a distributed monolith.'
        },
        {
            question: 'How do you validate a cloud migration was successful? Describe your testing and cutover process.',
            difficulty: 'hard',
            answer: `<p><strong>Pre-cutover validation:</strong></p>
            <ul>
                <li><strong>Functional testing</strong> — full regression suite against the cloud deployment. Same tests that pass on-prem must pass in cloud.</li>
                <li><strong>Performance testing</strong> — load test in cloud to verify latency, throughput, and resource consumption match or exceed on-prem baseline.</li>
                <li><strong>Integration testing</strong> — verify all upstream/downstream connections work through the cloud network path.</li>
                <li><strong>Disaster recovery testing</strong> — verify backup/restore, failover, and recovery procedures work in the new environment.</li>
            </ul>
            <p><strong>Cutover process:</strong></p>
            <ol>
                <li><strong>Parallel running</strong> — both environments active, mirroring traffic. Compare outputs.</li>
                <li><strong>DNS-based traffic shifting</strong> — weighted routing sends 5% → 25% → 50% → 100% to cloud over days.</li>
                <li><strong>Monitoring gates</strong> — each traffic increment requires error rate, latency, and business metrics to be within thresholds.</li>
                <li><strong>Rollback plan</strong> — DNS revert (low TTL set in advance), data sync back to on-prem if needed.</li>
                <li><strong>Bake time</strong> — run at 100% for a full business cycle (weekly/monthly patterns) before decommissioning on-prem.</li>
            </ol>`,
            interviewTip: 'The key phrase is "progressive traffic shifting with automated rollback gates." This shows you understand that migration is not binary (old vs new) but graduated with validation at each step. Mention low DNS TTLs set days before cutover.',
            followUp: ['How do you handle database consistency during parallel running?', 'What metrics define a successful cutover?', 'How long should bake time be before decommissioning on-prem?'],
            seniorPerspective: 'I always set DNS TTL to 60 seconds a week before migration (giving the old TTL time to expire). During cutover, I monitor four things: error rate, p99 latency, throughput, and business metric (orders per minute, etc.). Any regression triggers automatic DNS rollback.',
            architectPerspective: 'Migration validation is a risk management exercise. The goal is to make the migration reversible for as long as possible. Data replication (cloud → on-prem) enables rollback even after cutover. Only decommission the old environment after a full business cycle confirms success — never before.'
        },
        {
            question: 'When would you recommend multi-cloud vs single-cloud? What are the real-world trade-offs?',
            difficulty: 'hard',
            answer: `<p><strong>Single-cloud (recommended default):</strong> Go deep on one provider, leverage all managed services, simpler operations, one team skill set, one security model, better pricing (committed use discounts).</p>
            <p><strong>Multi-cloud justified when:</strong></p>
            <ul>
                <li>Regulatory requirement for vendor diversity (financial services, government).</li>
                <li>M&A combined organizations on different clouds (practical necessity).</li>
                <li>Best-of-breed needs: GCP BigQuery for analytics, AWS for breadth, Azure for Microsoft workloads.</li>
                <li>Geographic coverage: one provider lacks presence in a required region.</li>
            </ul>
            <p><strong>Real trade-offs of multi-cloud:</strong> 2-3x operational complexity, team must master multiple platforms, abstraction layers limit innovation, data egress between clouds is expensive, security/compliance across providers is harder, and tooling must work across clouds (Terraform, Kubernetes become the common layer).</p>`,
            interviewTip: 'The honest answer is: multi-cloud rarely makes sense for technical reasons. It is usually driven by business/regulatory requirements or accidental complexity (M&A). Show you can push back diplomatically when asked "shouldn\'t we be multi-cloud?" — explain the real costs.',
            followUp: ['How does Kubernetes enable multi-cloud portability?', 'What is the cost of multi-cloud data synchronization?', 'How do you handle identity and access across clouds?'],
            seniorPerspective: 'In my experience, most "multi-cloud" strategies are actually "multi-cloud by accident" from acquisitions. For intentional multi-cloud, I have seen it work only when each cloud runs independently (no cross-cloud data sync) — e.g., ML on GCP, web services on AWS, Office workloads on Azure.',
            architectPerspective: 'Multi-cloud is an architectural decision with profound operational implications. The abstraction tax (lowest common denominator services, multi-cloud tooling, cross-cloud networking) must be weighed against the business value. For most organizations, the value is negative — go deep on one cloud and invest the saved complexity budget elsewhere.'
        },
        {
            question: 'How do you migrate a database with minimal downtime? Compare different approaches.',
            difficulty: 'hard',
            answer: `<p>Database migration strategies vary by acceptable downtime:</p>
            <table><thead><tr><th>Approach</th><th>Downtime</th><th>Complexity</th><th>Use Case</th></tr></thead><tbody>
                <tr><td>Backup/Restore</td><td>Hours (depends on size)</td><td>Low</td><td>Dev/test, small DBs, acceptable window</td></tr>
                <tr><td>Snapshot + Continuous Replication (DMS/CDC)</td><td>Minutes (cutover only)</td><td>Medium</td><td>Production DBs, near-zero downtime needed</td></tr>
                <tr><td>Logical Replication</td><td>Seconds (slot switch)</td><td>Medium-High</td><td>Same engine, version upgrade + migration</td></tr>
                <tr><td>Dual-write + Backfill</td><td>Zero</td><td>High</td><td>Schema changes, engine changes (e.g., SQL → DynamoDB)</td></tr>
            </tbody></table>
            <p><strong>AWS DMS (Database Migration Service) workflow:</strong></p>
            <ol>
                <li>Create target database in cloud (RDS/Aurora).</li>
                <li>Configure DMS replication instance between source and target.</li>
                <li>Full load: initial bulk data copy.</li>
                <li>CDC (Change Data Capture): ongoing replication of changes.</li>
                <li>Validate data consistency between source and target.</li>
                <li>Cutover: point application to new database (seconds of downtime).</li>
                <li>Keep reverse replication active for rollback capability.</li>
            </ol>`,
            interviewTip: 'Emphasize that the database is often the hardest part of any migration. The application can usually roll back instantly (DNS), but data is harder to roll back if writes go to the new database. Mention reverse replication as the safety net.',
            followUp: ['How do you handle schema differences during migration?', 'What is the role of DMS CDC in near-zero downtime?', 'How do you validate data consistency between source and target?'],
            seniorPerspective: 'I always set up bidirectional replication during database migration — source-to-target for migration, target-to-source for rollback. This gives me days of rollback capability even after cutover. The extra complexity is always worth the safety.',
            architectPerspective: 'Database migration is the critical path of most cloud migrations. The data is the asset; compute is replaceable. Plan for the database migration to take 3x longer than estimated, and never cut the rollback path until you are absolutely certain the new environment is stable.'
        },
        {
            question: 'What is a TCO analysis for cloud migration, and what costs do people commonly miss?',
            difficulty: 'medium',
            answer: `<p><strong>TCO (Total Cost of Ownership)</strong> compares the full cost of on-premises infrastructure against cloud, including hidden costs on both sides:</p>
            <p><strong>On-premises costs (often underestimated):</strong></p>
            <ul>
                <li>Hardware purchase/lease + refresh cycles (3-5 years)</li>
                <li>Data center costs: power, cooling, physical security, space</li>
                <li>Staff: sysadmins, network engineers, security team for infrastructure</li>
                <li>Software licenses: OS, hypervisor, backup, monitoring</li>
                <li>Opportunity cost: staff maintaining infra instead of building features</li>
            </ul>
            <p><strong>Cloud costs (often underestimated):</strong></p>
            <ul>
                <li>Data egress charges (significant at scale)</li>
                <li>NAT Gateway / load balancer per-hour costs</li>
                <li>Cross-AZ and cross-region data transfer</li>
                <li>Premium support plans</li>
                <li>Migration project costs (tools, consulting, staff time)</li>
                <li>Training and upskilling costs</li>
                <li>Over-provisioning (not right-sizing instances)</li>
            </ul>`,
            interviewTip: 'Mention that the cloud ROI is rarely just "cheaper VMs." The value includes: faster time to market (managed services), reduced operational burden, elastic scaling (pay for what you use), and access to innovation (ML, serverless) that would be impractical on-prem.',
            followUp: ['How do Reserved Instances / Savings Plans affect the TCO comparison?', 'What is the typical payback period for a migration investment?', 'How do you justify migration when cloud is more expensive per-VM?'],
            seniorPerspective: 'I have seen TCO analyses go both ways. A 1:1 VM migration is often MORE expensive in cloud. The savings come from: managed services (eliminate DBA/sysadmin time), elastic scaling (turn off dev environments at night), and modernization (serverless for batch workloads).',
            architectPerspective: 'TCO is the business case, but it is rarely the real driver. Most migrations are driven by: data center lease expiry, need for agility (deploy in minutes not months), talent availability (everyone wants cloud experience), and risk reduction (DR, security). Present TCO as one factor in a multi-factor decision.'
        },
        {
            question: 'How do you handle application dependencies during migration? What happens when App A in cloud needs to talk to App B still on-premises?',
            difficulty: 'medium',
            answer: `<p>Cross-environment communication during migration requires careful network and latency planning:</p>
            <ul>
                <li><strong>Network connectivity</strong> — VPN or Direct Connect provides the pipe. Ensure bandwidth is sufficient for the combined traffic.</li>
                <li><strong>Latency awareness</strong> — on-prem ↔ cloud adds 5-50ms per hop. Chatty protocols (many small calls) suffer badly. Batch or cache where possible.</li>
                <li><strong>DNS resolution</strong> — split-horizon DNS resolves service names to the correct location. Cloud apps resolve on-prem services via DNS forwarding.</li>
                <li><strong>Security</strong> — traffic encryption in transit (TLS), firewall rules allowing cross-environment flows, mutual authentication.</li>
                <li><strong>Dependency grouping</strong> — tightly coupled apps (< 5ms latency requirement) MUST migrate together. Loosely coupled apps (queue-based, async) can tolerate split.</li>
            </ul>
            <p><strong>Patterns:</strong></p>
            <ul>
                <li><strong>API Gateway as bridge</strong> — routes to on-prem or cloud based on service location. Single entry point regardless of where the service runs.</li>
                <li><strong>Message queue as buffer</strong> — async communication tolerates latency and transient connectivity issues.</li>
                <li><strong>Caching layer</strong> — cache frequently accessed on-prem data in cloud to reduce cross-network calls.</li>
            </ul>`,
            interviewTip: 'The critical insight is that synchronous dependencies create a "migration unit" — they must move together or the latency penalty breaks SLAs. Identifying these units during assessment prevents mid-migration surprises. Async dependencies are forgiving; sync ones are not.',
            followUp: ['How do you identify synchronous vs asynchronous dependencies?', 'What happens if Direct Connect goes down during migration?', 'How does data residency affect cross-environment communication?'],
            seniorPerspective: 'I map all synchronous call chains and draw the "migration boundary" around tightly coupled groups. If App A calls App B with a 50ms SLA and they are 20ms apart via VPN, that leaves only 30ms for actual processing. Either migrate together or add a local cache.',
            architectPerspective: 'Dependencies are the hidden complexity of migration. Technical assessment focuses on servers; the real challenge is the invisible web of RPC calls, shared databases, file shares, and scheduled jobs that connect them. Discovery tools and traffic analysis are essential to make this visible before planning waves.'
        },
        {
            question: 'You are tasked with migrating a legacy .NET Framework 4.7 application running on Windows Server 2016 with a SQL Server 2017 database. Walk through your approach.',
            difficulty: 'advanced',
            answer: `<p><strong>Assessment phase:</strong></p>
            <ul>
                <li>Identify dependencies: IIS config, Windows services, scheduled tasks, file shares, external integrations.</li>
                <li>Check .NET Framework compatibility: can it run on .NET 8? Or must it stay on Framework (Windows-only)?</li>
                <li>Database: size, features used (CLR, SSIS, linked servers), licensing (Enterprise vs Standard).</li>
                <li>Performance baseline: capture current CPU, memory, IOPS, and network metrics for right-sizing.</li>
            </ul>
            <p><strong>Strategy recommendation (graduated):</strong></p>
            <ol>
                <li><strong>Phase 1 — Rehost:</strong> Move VM as-is to AWS EC2 Windows or Azure VM. SQL Server to EC2/VM with same version. Minimal risk, proves connectivity.</li>
                <li><strong>Phase 2 — Replatform:</strong> Move SQL Server to Azure SQL Managed Instance or RDS for SQL Server (managed, same engine). Move IIS app to Azure App Service (if compatible) or containerize with Windows containers.</li>
                <li><strong>Phase 3 — Refactor (if justified):</strong> Port to .NET 8 (cross-platform), containerize with Linux containers, deploy to Kubernetes. Adopt managed services (Redis, message queues).</li>
            </ol>
            <p>Each phase is a stopping point — you only proceed to the next if the business value justifies the additional effort.</p>`,
            interviewTip: 'Show you think in phases, not all-or-nothing. The graduated approach (rehost → replatform → refactor) lets you deliver value at each step and stop when the ROI diminishes. Mention specific compatibility concerns: .NET Framework → .NET 8 migration is non-trivial for large apps.',
            followUp: ['What are the biggest .NET Framework → .NET 8 migration challenges?', 'How does SQL MI differ from Azure SQL Database?', 'What about Windows services — how do you migrate those?'],
            seniorPerspective: 'For legacy .NET Framework apps, I recommend replatforming to Azure SQL MI (99% compatible, no refactoring needed) and Azure App Service for Windows (IIS compatible). This gives managed benefits without a .NET version migration. Port to .NET 8 only if the app is actively developed.',
            architectPerspective: 'The migration strategy for legacy applications should be driven by the application lifecycle stage. If it is in maintenance mode (stable, few changes), replatform and stop — the refactoring investment will never pay back. If it is actively evolving and the framework limitations are causing pain, refactoring is justified by ongoing velocity improvements.'
        },
        {
            question: 'What is the difference between replatforming and refactoring? Give specific examples of each.',
            difficulty: 'medium',
            answer: `<p><strong>Replatforming</strong> makes targeted optimizations during migration without fundamentally changing the application architecture:</p>
            <ul>
                <li>Self-managed PostgreSQL on VM → Amazon RDS for PostgreSQL (same engine, managed).</li>
                <li>IIS on Windows Server → Azure App Service (same ASP.NET app, managed hosting).</li>
                <li>Application on VMs → Docker containers on ECS/Fargate (same app, containerized).</li>
                <li>Local file storage → S3/Blob Storage (swap storage layer, keep application logic).</li>
            </ul>
            <p><strong>Refactoring</strong> fundamentally redesigns the application to be cloud-native:</p>
            <ul>
                <li>Monolithic API → microservices decomposed by business domain.</li>
                <li>Synchronous processing → event-driven architecture with SQS/EventBridge.</li>
                <li>Stateful sessions → stateless services with distributed cache.</li>
                <li>Scheduled batch jobs → serverless event-driven processing (Lambda + S3 triggers).</li>
                <li>Vertical scaling → horizontal auto-scaling with load balancing.</li>
            </ul>
            <p>The key distinction: replatforming preserves the architecture and changes the platform; refactoring changes the architecture to leverage cloud capabilities.</p>`,
            interviewTip: 'Use concrete examples, not abstract definitions. Saying "SQL on VM to RDS" is replatforming while "monolith to microservices" is refactoring makes the distinction immediately clear. Then discuss the effort/risk/benefit trade-off for each.',
            followUp: ['When does replatforming become refactoring?', 'What is the Strangler Fig approach to refactoring?', 'How do you justify the cost of refactoring to stakeholders?'],
            seniorPerspective: 'Replatforming is my default recommendation for most applications. Moving to managed databases alone eliminates patching, backup management, and HA setup — that is a significant operational win without touching application code. I reserve refactoring for apps that need elastic scaling or have scaling bottlenecks.',
            architectPerspective: 'The replatform/refactor decision maps to the application value curve. High-value, actively-evolving applications justify refactoring because the investment pays back in development velocity. Stable, low-change applications should be replatformed at most — the refactoring investment cannot be recovered.'
        }
    ]
});
