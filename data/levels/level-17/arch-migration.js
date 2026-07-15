'use strict';

PageData.register('arch-migration', {
  title: 'Legacy Migration & Tech Debt',
  description: 'Strategies for migrating legacy systems to modern architectures, managing technical debt, and making rewrite vs refactor decisions.',
  sections: [
    {
      title: 'Introduction',
      content: `
        <p>Every successful system eventually becomes a legacy system. The challenge is not whether to 
        modernize, but <strong>how to do it safely</strong> — without halting feature delivery, without 
        a "big bang" rewrite that fails 18 months in, and without losing the institutional knowledge 
        encoded in the existing codebase.</p>
        <p>This topic covers battle-tested patterns for incremental migration: Strangler Fig, 
        Anti-Corruption Layers, parallel running, and the decision frameworks that help teams choose 
        between rewriting, refactoring, or wrapping legacy systems.</p>
      `
    },
    {
      title: 'Core Concepts',
      content: `
        <h3>Strangler Fig Pattern</h3>
        <p>Named after tropical strangler figs that grow around a host tree until the host dies. 
        New functionality is built alongside the legacy system. Traffic is gradually routed to the 
        new system feature by feature, until the legacy system can be decommissioned.</p>
        <p>Key principle: the legacy system remains operational throughout. No "flag day" cutover.</p>

        <h3>Anti-Corruption Layer (ACL)</h3>
        <p>A translation layer between the legacy system and new code. It protects the new system from 
        being polluted by legacy data models, naming conventions, or business rule quirks. The ACL 
        translates between old and new domain models.</p>

        <h3>Tech Debt Quadrants (Martin Fowler)</h3>
        <table>
          <tr><th></th><th>Deliberate</th><th>Inadvertent</th></tr>
          <tr><td><strong>Reckless</strong></td><td>"We don't have time for design"</td><td>"What's layering?"</td></tr>
          <tr><td><strong>Prudent</strong></td><td>"Ship now, refactor later"</td><td>"Now we know how we should have done it"</td></tr>
        </table>
        <p>Only <strong>prudent deliberate</strong> debt is acceptable — knowingly taking a shortcut with a 
        plan to pay it back. All other forms should be addressed immediately or scheduled.</p>

        <h3>Rewrite vs Refactor Decision Framework</h3>
        <ul>
          <li><strong>Rewrite when:</strong> The tech stack is truly dead (no developers, no security patches), 
          the system is small enough to rebuild in 3-6 months, or the domain has fundamentally changed.</li>
          <li><strong>Refactor when:</strong> The core logic is sound but poorly structured, the team knows 
          the domain well, or you need to maintain feature delivery during the transition.</li>
          <li><strong>Wrap when:</strong> The system works but cannot be modified safely — put an API layer 
          in front and build new features around it.</li>
        </ul>

        <h3>Database Migration Patterns</h3>
        <ul>
          <li><strong>Expand-Contract:</strong> Add new columns/tables (expand), migrate data, update 
          consumers, then remove old structures (contract). No breaking changes at any step.</li>
          <li><strong>Dual-write:</strong> Write to both old and new stores during transition. Verify 
          consistency before cutting over reads.</li>
          <li><strong>CDC (Change Data Capture):</strong> Stream changes from legacy database to new 
          store in real-time. Decouples migration from application changes.</li>
        </ul>

        <h3>Parallel Running / Shadow Mode</h3>
        <p>Run both old and new systems simultaneously. Route production traffic to both, compare results, 
        but only return the legacy response to users. When the new system matches consistently, cut over. 
        GitHub's Scientist library popularized this pattern.</p>
      `
    },
    {
      title: 'Strangler Fig Migration Flow',
      content: `
        <p>Progressive migration from legacy to modern system using the Strangler Fig pattern:</p>
        <div class="mermaid-diagram">
          <pre class="mermaid">
graph TB
    subgraph Phase1["Phase 1: Intercept"]
        U1[Users] --> PROXY1[API Gateway<br/>Route all to legacy]
        PROXY1 --> LEGACY1[Legacy System<br/>100% traffic]
        PROXY1 -.->|new features only| NEW1[New System<br/>0% legacy traffic]
    end

    subgraph Phase2["Phase 2: Migrate"]
        U2[Users] --> PROXY2[API Gateway<br/>Feature-based routing]
        PROXY2 -->|orders, payments| LEGACY2[Legacy System<br/>60% traffic]
        PROXY2 -->|users, catalog| NEW2[New System<br/>40% traffic]
        NEW2 -->|ACL| LEGACY2
    end

    subgraph Phase3["Phase 3: Complete"]
        U3[Users] --> PROXY3[API Gateway<br/>Route all to new]
        PROXY3 --> NEW3[New System<br/>100% traffic]
        PROXY3 -.->|deprecated| LEGACY3[Legacy System<br/>Decommission]
    end

    Phase1 --> Phase2
    Phase2 --> Phase3
          </pre>
        </div>
      `
    },
    {
      title: 'Expand-Contract Database Migration',
      content: `
        <p>Safe schema evolution without downtime using expand-contract:</p>
        <div class="mermaid-diagram">
          <pre class="mermaid">
sequenceDiagram
    participant App as Application
    participant DB as Database

    Note over App,DB: Phase 1: EXPAND - Add new structure
    App->>DB: ALTER TABLE ADD COLUMN email_normalized VARCHAR(255)
    App->>DB: CREATE INDEX idx_email_normalized

    Note over App,DB: Phase 2: MIGRATE - Backfill data
    App->>DB: UPDATE users SET email_normalized = LOWER(email)<br/>WHERE email_normalized IS NULL<br/>BATCH 1000 rows
    App->>DB: Deploy code: write to BOTH columns

    Note over App,DB: Phase 3: VERIFY - Confirm consistency
    App->>DB: SELECT COUNT(*) WHERE email_normalized IS NULL
    App->>DB: Run integration tests against new column

    Note over App,DB: Phase 4: CUTOVER - Switch reads
    App->>DB: Deploy code: read from new column

    Note over App,DB: Phase 5: CONTRACT - Remove old structure
    App->>DB: Deploy code: stop writing old column
    App->>DB: ALTER TABLE DROP COLUMN email (after grace period)
          </pre>
        </div>
      `
    },
    {
      title: 'Implementation',
      content: `
        <h3>Anti-Corruption Layer (C#)</h3>
        <pre><code class="language-csharp">// The ACL translates between legacy and modern domain models
public class OrderAntiCorruptionLayer : IOrderService
{
    private readonly ILegacyOrderApi _legacyApi;
    private readonly ILogger&lt;OrderAntiCorruptionLayer&gt; _logger;

    // New system calls this clean interface
    public async Task&lt;Order&gt; GetOrderAsync(Guid orderId)
    {
        // Legacy uses integer IDs and XML responses
        var legacyId = await _idMappingStore.GetLegacyId(orderId);
        var legacyResponse = await _legacyApi.GetOrderXml(legacyId);

        // Translate legacy model to modern domain
        return TranslateToModernOrder(legacyResponse);
    }

    private Order TranslateToModernOrder(LegacyOrderXml legacy)
    {
        return new Order
        {
            Id = _idMappingStore.GetModernId(legacy.OrderNumber),
            CustomerId = _idMappingStore.GetModernId(legacy.CustCode),
            Status = MapLegacyStatus(legacy.StatCode),
            Items = legacy.Lines.Select(line => new OrderItem
            {
                ProductId = line.ItemCode,
                Quantity = line.Qty,
                // Legacy stores price in cents as integer
                UnitPrice = line.PriceCents / 100m,
            }).ToList(),
            // Legacy has separate date and time fields
            PlacedAt = CombineDateTime(legacy.OrdDate, legacy.OrdTime),
        };
    }

    private OrderStatus MapLegacyStatus(string statCode)
    {
        return statCode switch
        {
            "N" => OrderStatus.Placed,
            "P" => OrderStatus.Processing,
            "S" => OrderStatus.Shipped,
            "D" => OrderStatus.Delivered,
            "X" => OrderStatus.Cancelled,
            // Legacy has undocumented statuses
            _ => HandleUnknownStatus(statCode),
        };
    }

    private OrderStatus HandleUnknownStatus(string code)
    {
        _logger.LogWarning("Unknown legacy status code: {Code}", code);
        // Safe default - don't lose orders
        return OrderStatus.RequiresReview;
    }
}</code></pre>

        <h3>Feature Parity Tracking (TypeScript)</h3>
        <pre><code class="language-typescript">// Track migration progress and feature parity
interface MigrationFeature {
  id: string;
  name: string;
  legacyModule: string;
  status: 'not-started' | 'in-progress' | 'shadow-mode' | 'migrated' | 'decommissioned';
  trafficPercent: number;  // % routed to new system
  parityScore: number;     // 0-100 based on behavior match
  blockers: string[];
  owner: string;
}

class MigrationTracker {
  private features: Map&lt;string, MigrationFeature&gt; = new Map();

  getProgress(): MigrationReport {
    const all = Array.from(this.features.values());
    return {
      total: all.length,
      migrated: all.filter(f => f.status === 'migrated').length,
      inProgress: all.filter(f => f.status === 'in-progress').length,
      blocked: all.filter(f => f.blockers.length > 0).length,
      overallParity: this.calculateOverallParity(all),
      estimatedCompletion: this.projectCompletion(all),
      riskAreas: this.identifyRisks(all),
    };
  }

  // Shadow mode comparison
  async compareResults(featureId: string,
    legacyResult: unknown, newResult: unknown): Promise&lt;ComparisonResult&gt; {

    const diff = deepDiff(legacyResult, newResult);
    const feature = this.features.get(featureId);

    if (diff.length === 0) {
      feature.parityScore = Math.min(100,
        feature.parityScore + 1); // Increase confidence
    } else {
      feature.parityScore = Math.max(0,
        feature.parityScore - 5); // Decrease on mismatch
      await this.logMismatch(featureId, diff);
    }

    return { matches: diff.length === 0, differences: diff };
  }
}</code></pre>

        <h3>Parallel Running with Scientist Pattern (C#)</h3>
        <pre><code class="language-csharp">// Run legacy and new code in parallel, compare results
public class OrderServiceExperiment
{
    private readonly ILegacyOrderService _legacy;
    private readonly INewOrderService _modern;
    private readonly IMetrics _metrics;
    private readonly ILogger _logger;

    public async Task&lt;OrderTotal&gt; CalculateTotal(Guid orderId)
    {
        // Always use legacy result (safe)
        var legacyTask = _legacy.CalculateTotal(orderId);

        // Run modern in parallel (experiment)
        var modernTask = Task.Run(async () =>
        {
            try { return await _modern.CalculateTotal(orderId); }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Modern path failed for {OrderId}", orderId);
                return null;
            }
        });

        var legacyResult = await legacyTask;
        var modernResult = await modernTask;

        // Compare and record
        if (modernResult != null)
        {
            var matches = CompareResults(legacyResult, modernResult);
            _metrics.RecordExperiment("order-total", matches);

            if (!matches)
            {
                _logger.LogWarning(
                    "Mismatch: Legacy={Legacy}, Modern={Modern}, OrderId={OrderId}",
                    legacyResult.Amount, modernResult.Amount, orderId);
            }
        }

        // Always return legacy result until confidence is high
        return legacyResult;
    }

    private bool CompareResults(OrderTotal legacy, OrderTotal modern)
    {
        // Allow small floating-point differences
        return Math.Abs(legacy.Amount - modern.Amount) < 0.01m
            && legacy.Currency == modern.Currency
            && legacy.TaxAmount == modern.TaxAmount;
    }
}</code></pre>
      `
    },
    {
      title: 'Common Mistakes',
      content: `
        <ul>
          <li><strong>Big bang rewrites:</strong> Attempting to rewrite the entire system before releasing 
          anything. These projects typically fail after 12-24 months because requirements drift, team morale 
          drops, and the legacy system continues evolving.</li>
          <li><strong>No Anti-Corruption Layer:</strong> Letting legacy data models and conventions leak into 
          new code creates a new legacy system that carries all the old problems.</li>
          <li><strong>Migrating without metrics:</strong> If you cannot measure feature parity and compare 
          behavior between old and new systems, you cannot know when migration is safe to complete.</li>
          <li><strong>Underestimating undocumented behavior:</strong> Legacy systems accumulate years of 
          implicit business rules, edge case handling, and integration quirks that are not in any spec. 
          Shadow mode reveals these.</li>
          <li><strong>Tech debt without business context:</strong> Proposing refactoring without connecting 
          it to business outcomes (velocity, reliability, hiring) fails to get executive buy-in.</li>
          <li><strong>Database migration as an afterthought:</strong> Schema changes are the hardest part of 
          most migrations. Plan the data migration first — everything else follows.</li>
          <li><strong>Stopping halfway:</strong> Partially migrated systems are worse than either old or new. 
          Two systems to maintain, inconsistent patterns, confused developers. Commit to completion.</li>
        </ul>
      `
    },
    {
      title: 'Interview Tips',
      type: 'callout',
      content: `
        <div class="callout callout-tip">
          <h4>Interview Tips</h4>
          <ul>
            <li>Every system has tech debt. Frame the discussion around <strong>prioritization</strong> — 
            which debt is costing the most in developer velocity or customer impact?</li>
            <li>Always mention the <strong>Strangler Fig</strong> by name — it is the industry-standard 
            answer for "how do you migrate a legacy system?"</li>
            <li>Demonstrate empathy for the legacy system: "It made money for 10 years. The decisions that 
            look wrong now were often right at the time with the constraints that existed."</li>
            <li>Discuss <strong>incremental value delivery</strong>: each migration step should deliver 
            measurable improvement (latency, feature velocity, operational cost).</li>
            <li>For architect roles, discuss organizational challenges: how do you staff a migration? 
            How do you prevent the new system from becoming legacy before migration completes?</li>
            <li>Know the failure modes of rewrites: second-system effect, moving target, team burnout, 
            loss of institutional knowledge.</li>
          </ul>
        </div>
      `
    },
    {
      title: 'Key Takeaways',
      content: `
        <ul>
          <li>The Strangler Fig pattern enables incremental migration without a risky "big bang" cutover.</li>
          <li>Anti-Corruption Layers protect new code from legacy data models and conventions.</li>
          <li>Parallel running (shadow mode) builds confidence by comparing legacy and modern behavior on 
          real production traffic.</li>
          <li>Expand-Contract is the only safe pattern for live database schema changes — never break consumers.</li>
          <li>Tech debt is only worth addressing when it connects to measurable business impact: velocity, 
          reliability, or cost.</li>
          <li>Feature parity tracking with quantified metrics (parity score, mismatch rate) makes migration 
          progress visible to stakeholders.</li>
          <li>Rewrites are appropriate only for small, well-understood systems with dead technology stacks. 
          Refactoring is almost always safer for large systems.</li>
        </ul>
      `
    }
  ],

  questions: [
    {
      id: 'arch-mig-q1',
      level: 'junior',
      title: 'What is technical debt and why does it matter?',
      answer: `
        <p><strong>Technical debt</strong> is the implied cost of additional rework caused by choosing an 
        easier solution now instead of a better approach that would take longer. Like financial debt, it 
        accumulates interest — the longer you leave it, the harder and more expensive it becomes to fix.</p>
        <p>Examples: copy-pasted code instead of abstractions, missing tests, hardcoded configuration, 
        outdated dependencies, tightly coupled components.</p>
        <p><strong>Why it matters:</strong></p>
        <ul>
          <li>Slows feature delivery: changes take 3x longer in debt-heavy code</li>
          <li>Increases defect rate: fragile code breaks in unexpected ways</li>
          <li>Harms developer morale: nobody wants to work in messy code</li>
          <li>Creates security risk: unpatched dependencies accumulate vulnerabilities</li>
        </ul>
        <p>Not all debt is bad — <strong>prudent deliberate debt</strong> (conscious trade-offs with a payback plan) 
        is a valid business strategy. The problem is <em>unmanaged</em> debt that grows unchecked.</p>
      `
    },
    {
      id: 'arch-mig-q2',
      level: 'mid',
      title: 'Explain the Strangler Fig pattern and how you would implement it.',
      answer: `
        <p>The <strong>Strangler Fig</strong> pattern incrementally replaces a legacy system by building 
        new functionality around it, gradually routing traffic away until the legacy system can be removed.</p>
        <p><strong>Implementation steps:</strong></p>
        <ol>
          <li><strong>Add a proxy:</strong> Place an API gateway or reverse proxy in front of the legacy 
          system. Initially, 100% of traffic passes through to legacy unchanged.</li>
          <li><strong>Identify migration candidates:</strong> Choose features that are well-bounded, 
          high-value, and low-risk. Start with read-heavy features.</li>
          <li><strong>Build + route:</strong> Implement the feature in the new system. Route traffic for 
          that specific endpoint/feature to the new system.</li>
          <li><strong>Repeat:</strong> Migrate feature by feature. The legacy system "shrinks" over time.</li>
          <li><strong>Decommission:</strong> When no traffic reaches the legacy system, shut it down.</li>
        </ol>
        <p>Critical success factors: feature flags for routing control, monitoring at the proxy layer 
        to detect issues immediately, and an Anti-Corruption Layer to prevent legacy concepts from 
        leaking into new code.</p>
      `
    },
    {
      id: 'arch-mig-q3',
      level: 'mid',
      title: 'When would you choose to rewrite a system vs refactor it incrementally?',
      answer: `
        <p><strong>Rewrite when:</strong></p>
        <ul>
          <li>The technology stack is truly dead (COBOL on mainframe with no maintainers available)</li>
          <li>The system is small enough to rebuild in 3-6 months (not years)</li>
          <li>The domain has fundamentally changed — the old model cannot accommodate new requirements</li>
          <li>Security constraints require a clean-room implementation</li>
        </ul>
        <p><strong>Refactor when:</strong></p>
        <ul>
          <li>The core business logic is correct but poorly organized</li>
          <li>The team needs to continue delivering features during transition</li>
          <li>The system is large (> 100K lines) — rewrites of large systems almost always fail</li>
          <li>Domain knowledge is embedded in code that nobody fully understands</li>
        </ul>
        <p>The key question: <strong>"Can we deliver incremental value?"</strong> If each step of the 
        migration improves something measurable (performance, developer experience, reliability), 
        refactor. If the only value comes at the very end after a complete rewrite, the project is 
        high-risk and likely to be cancelled before delivering value.</p>
      `
    },
    {
      id: 'arch-mig-q4',
      level: 'senior',
      title: 'How do you safely migrate a database schema with zero downtime?',
      answer: `
        <p>The <strong>Expand-Contract</strong> pattern ensures no breaking changes at any step:</p>
        <ol>
          <li><strong>Expand:</strong> Add new columns/tables without removing old ones. The new schema 
          must be backward-compatible — old code continues working.</li>
          <li><strong>Migrate:</strong> Backfill data in batches (not one massive UPDATE). Update application 
          code to write to both old and new structures (dual-write).</li>
          <li><strong>Verify:</strong> Confirm data consistency between old and new. Run tests against new 
          schema. Monitor for issues.</li>
          <li><strong>Cutover:</strong> Switch reads to the new schema. Old columns become unused.</li>
          <li><strong>Contract:</strong> After a grace period (1-2 sprints), remove old columns/tables.</li>
        </ol>
        <p><strong>For column renames</strong> (e.g., "name" → "full_name"):</p>
        <pre><code class="language-csharp">// Step 1: Add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);

// Step 2: Backfill
UPDATE users SET full_name = name WHERE full_name IS NULL;
-- Run in batches of 1000

// Step 3: Dual-write in application
user.Name = value;
user.FullName = value;  // Write to both

// Step 4: Switch reads to FullName
// Step 5: Stop writing to Name
// Step 6: DROP COLUMN name (after grace period)</code></pre>
        <p>Critical: each step is independently deployable and rollback-safe. If step 3 fails, 
        old code still works because the old column is still populated.</p>
      `
    },
    {
      id: 'arch-mig-q5',
      level: 'senior',
      title: 'How would you use shadow mode / parallel running to validate a migration?',
      answer: `
        <p>Shadow mode runs both legacy and modern systems on production traffic, comparing outputs 
        without affecting users:</p>
        <ol>
          <li><strong>Setup:</strong> Fork production traffic at the gateway level. Primary response comes 
          from legacy; shadow response goes to comparison service.</li>
          <li><strong>Compare:</strong> Asynchronously compare responses field-by-field. Log mismatches 
          with full context (request, both responses, diff).</li>
          <li><strong>Analyze:</strong> Categorize mismatches — some are expected (timestamps, IDs) vs 
          genuine bugs in the new system.</li>
          <li><strong>Fix:</strong> Address genuine mismatches. Increase parity score over time.</li>
          <li><strong>Cutover:</strong> When parity score exceeds threshold (e.g., 99.9% match) for 
          sustained period (e.g., 2 weeks), switch primary to new system.</li>
        </ol>
        <p><strong>Key considerations:</strong></p>
        <ul>
          <li>Shadow write operations carefully — don't double-charge customers or send duplicate emails</li>
          <li>Filter deterministic comparisons only (ignore timestamps, random IDs)</li>
          <li>Sample traffic rather than shadow 100% to control costs</li>
          <li>Set up dashboards showing match rate over time per endpoint</li>
        </ul>
      `
    },
    {
      id: 'arch-mig-q6',
      level: 'architect',
      title: 'You inherit a monolithic system with 2M lines of code and 50 developers. Design the migration strategy.',
      answer: `
        <p>A migration of this scale is a <strong>multi-year organizational transformation</strong>, 
        not just a technical project:</p>
        <ol>
          <li><strong>Phase 0 — Discovery (2-4 weeks):</strong> Map the monolith's bounded contexts. 
          Identify the highest-pain areas (most bugs, slowest to change, most coupling). Interview 
          teams about their biggest frustrations.</li>
          <li><strong>Phase 1 — Foundation (2-3 months):</strong> Establish the new platform: CI/CD 
          pipeline, service template, observability stack, API gateway. Build ONE small service 
          (authentication or notifications) end-to-end to prove the platform.</li>
          <li><strong>Phase 2 — Extract (ongoing):</strong> Use Strangler Fig to extract services 
          along bounded context lines. Priority: high-change-velocity areas first (extracting stable 
          code has low ROI). Target: 3-4 services extracted per quarter.</li>
          <li><strong>Phase 3 — Accelerate:</strong> As teams gain experience, extraction velocity 
          increases. Multiple teams extract in parallel. The monolith shrinks.</li>
          <li><strong>Phase 4 — Deprecate:</strong> The remaining monolith handles only legacy features 
          in maintenance mode. Eventually decommission.</li>
        </ol>
        <p><strong>Organizational design:</strong></p>
        <ul>
          <li>Dedicated platform team (4-6 people) maintains shared infrastructure</li>
          <li>Each product team owns extraction of their domain</li>
          <li>"Guild" model for sharing migration patterns and lessons learned</li>
          <li>Migration progress tracked at leadership level (quarterly OKRs)</li>
        </ul>
        <p>Critical metric: <strong>deployment frequency</strong>. If teams can deploy more often after 
        extraction, the migration is working. If not, reassess the approach.</p>
      `
    },
    {
      id: 'arch-mig-q7',
      level: 'architect',
      title: 'How do you make a business case for addressing technical debt to non-technical stakeholders?',
      answer: `
        <p>Translate technical concerns into business metrics:</p>
        <ol>
          <li><strong>Developer velocity:</strong> "Features that should take 1 week take 3 weeks because 
          of X. Addressing this saves Y developer-weeks per quarter." Use actual sprint data.</li>
          <li><strong>Incident cost:</strong> "We had Z production incidents last quarter caused by this 
          debt. Each incident costs $N in customer impact, engineering time, and reputation."</li>
          <li><strong>Hiring/retention:</strong> "We lost 2 engineers who cited codebase quality in exit 
          interviews. Replacing an engineer costs 6 months of salary."</li>
          <li><strong>Opportunity cost:</strong> "While we maintain this legacy system, competitors ship 
          features 3x faster because they don't have this burden."</li>
          <li><strong>Risk:</strong> "This dependency has a known security vulnerability. We cannot patch 
          it without migration. Each day increases exposure."</li>
        </ol>
        <p><strong>Framing that works:</strong></p>
        <ul>
          <li>Not "we need to refactor" → "We can deliver Feature X 40% faster after this investment"</li>
          <li>Not "the code is bad" → "Our deployment frequency is 1/week vs industry standard of 1/day"</li>
          <li>Not "tech debt" → "engineering efficiency investment with measurable ROI"</li>
        </ul>
        <p>Propose a <strong>20% allocation</strong>: 80% feature work, 20% debt reduction. Track the 
        impact on velocity over 2-3 quarters to build evidence for continued investment.</p>
      `
    },
    {
      id: 'am-q8',
      level: 'architect',
      title: 'How do you estimate the effort and risk of migrating a legacy system vs rewriting it?',
      answer: `
        <p>The "migrate vs rewrite" decision is one of the most consequential in software engineering. Rewrites 
        are seductive but historically fail more often than they succeed (second-system effect). Migration is 
        incremental but may never complete. The estimation framework must be honest about both.</p>
        <h4>Estimation Framework:</h4>
        <ul>
          <li><strong>Feature audit:</strong> Catalog every behavior the legacy system provides. Include the 
          "dark features" nobody remembers building — they still have users. A rewrite that misses 20% of 
          features is a regression, not an improvement.</li>
          <li><strong>Complexity mapping:</strong> Identify the hard parts: integrations with external systems, 
          complex business rules embedded in code, regulatory/compliance logic, edge cases accumulated over years. 
          These take 80% of the effort regardless of approach.</li>
          <li><strong>Dependency analysis:</strong> What depends on this system? Other services, reports, data 
          exports, manual processes, trained user behavior. Each dependency is a migration risk.</li>
        </ul>
        <h4>Rewrite Risks:</h4>
        <ul>
          <li><strong>Second-system effect:</strong> Teams over-engineer the rewrite with features the old system 
          never needed</li>
          <li><strong>Feature parity takes 2-3x longer than estimated</strong> (always)</li>
          <li><strong>Big-bang cutover:</strong> If you cannot run old and new in parallel, the risk concentrates 
          at switchover day</li>
          <li><strong>Organizational patience:</strong> Rewrites deliver zero value until complete. Business 
          stakeholders lose faith after 6 months of "building the new system"</li>
        </ul>
        <h4>Migration Advantages:</h4>
        <ul>
          <li><strong>Incremental value:</strong> Each migrated piece delivers improvement immediately</li>
          <li><strong>Reversible:</strong> If a migrated component fails, fall back to the legacy path</li>
          <li><strong>Parallel running:</strong> Old and new coexist via strangler fig, feature flags, or routing</li>
          <li><strong>Knowledge transfer:</strong> Team learns the domain progressively rather than all at once</li>
        </ul>
        <p><strong>Rule of thumb:</strong> Prefer migration (strangler fig) unless the legacy system is truly 
        unmaintainable (no source code, no documentation, no one who understands it) AND the domain is small 
        enough to rewrite in 3-6 months.</p>
      `
    }
  ]
});
