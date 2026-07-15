/* ═══════════════════════════════════════════════════════════════════
   Architecture Decision Making
   ADRs, trade-off analysis, fitness functions, build vs buy,
   reversibility, boring technology, and RFCs.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('arch-decisions', {
    title: 'Architecture Decision Making',
    description: 'How architects make and document decisions — ADRs, trade-off analysis, architectural fitness functions, build vs buy frameworks, decision reversibility, and the boring technology principle.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>Architecture is the sum of decisions that are <strong>expensive to change</strong>. The difference between a senior engineer and an architect is not knowledge of patterns — it's the ability to <strong>make decisions under uncertainty</strong>, document them, and communicate trade-offs clearly.</p>
            <p>This module covers the frameworks and practices that make architectural decisions systematic, reversible where possible, and always traceable.</p>`
        },
        {
            title: 'Architecture Decision Records (ADRs)',
            content: `<p>An ADR documents a single architectural decision with its context, alternatives considered, and rationale. They are version-controlled alongside code.</p>
            <h4>ADR Template (Michael Nygard format)</h4>
            <ol>
                <li><strong>Title</strong>: Short, descriptive (e.g., "Use PostgreSQL for order service")</li>
                <li><strong>Status</strong>: Proposed → Accepted → Deprecated → Superseded</li>
                <li><strong>Context</strong>: What forces are at play? What problem are we solving?</li>
                <li><strong>Decision</strong>: What we decided and WHY</li>
                <li><strong>Consequences</strong>: Positive and negative results. What becomes easier/harder?</li>
            </ol>
            <h4>Why ADRs Matter</h4>
            <ul>
                <li>New team members understand WHY (not just what) was decided</li>
                <li>Prevents re-litigating settled decisions ("we considered X and rejected it because...")</li>
                <li>Makes it safe to revisit decisions when context changes</li>
                <li>Creates an audit trail of architectural evolution</li>
            </ul>`,
            code: `# ADR-007: Use Event Sourcing for Order Service

## Status
Accepted (2024-03-15)

## Context
- Order state is complex (created, paid, fulfilled, returned, partially refunded)
- Audit trail is a regulatory requirement
- We need to rebuild order state at any point in time for dispute resolution
- Current CRUD model loses history on every update

## Decision
Use event sourcing for the Order aggregate:
- Store domain events (OrderCreated, PaymentReceived, ItemShipped, etc.)
- Derive current state by replaying events
- Use CQRS with separate read projections for query performance

## Alternatives Considered
1. **Audit table + CRUD**: Simpler but doesn't support temporal queries or state rebuild
2. **CDC from DB**: Captures all changes but at DB level (no domain semantics)
3. **Soft deletes + history table**: Complex, error-prone, doesn't scale

## Consequences
### Positive
- Full audit trail (regulatory compliance)
- Can rebuild state at any timestamp (dispute resolution)
- Natural fit for event-driven architecture
### Negative
- Team needs to learn event sourcing patterns
- Read model projections add complexity
- Event schema evolution must be managed carefully
- Eventually consistent reads (acceptable for this domain)`,
            language: 'markdown'
        },
        {
            title: 'Trade-Off Analysis Framework',
            content: `<p>Every architectural decision is a trade-off. The ATAM (Architecture Tradeoff Analysis Method) provides structure:</p>
            <h4>Quality Attributes to Consider</h4>
            <table>
                <thead><tr><th>Attribute</th><th>Tension With</th><th>Example Trade-off</th></tr></thead>
                <tbody>
                    <tr><td>Performance</td><td>Maintainability</td><td>Denormalized cache vs clean domain model</td></tr>
                    <tr><td>Availability</td><td>Consistency</td><td>CAP theorem — eventual vs strong consistency</td></tr>
                    <tr><td>Security</td><td>Usability</td><td>MFA everywhere vs frictionless login</td></tr>
                    <tr><td>Scalability</td><td>Cost</td><td>Auto-scale everything vs right-size for expected load</td></tr>
                    <tr><td>Flexibility</td><td>Simplicity</td><td>Plugin architecture vs hardcoded implementation</td></tr>
                    <tr><td>Time-to-market</td><td>Quality</td><td>Ship MVP now vs build it right from start</td></tr>
                </tbody>
            </table>
            <h4>Decision Matrix Template</h4>
            <p>Score each option (1-5) against weighted quality attributes:</p>`,
            mermaid: `graph TD
    subgraph DecisionProcess[Decision Process]
        A[Identify Quality Attributes] --> B[Weight by Priority]
        B --> C[Score Each Option]
        C --> D[Identify Sensitivity Points]
        D --> E[Document Trade-offs]
        E --> F[Make Decision + ADR]
    end`
        },
        {
            title: 'Decision Reversibility',
            content: `<p>Jeff Bezos categorizes decisions as:</p>
            <table>
                <thead><tr><th>Type</th><th>Characteristics</th><th>Approach</th><th>Examples</th></tr></thead>
                <tbody>
                    <tr><td><strong>Type 1 (One-way door)</strong></td><td>Irreversible or very expensive to reverse</td><td>Invest time, get consensus, document thoroughly</td><td>Database choice, programming language, cloud provider, public API contract</td></tr>
                    <tr><td><strong>Type 2 (Two-way door)</strong></td><td>Easily reversible, low cost to change</td><td>Decide quickly, empower individuals, iterate</td><td>Library choice, internal API design, feature implementation approach</td></tr>
                </tbody>
            </table>
            <h4>Making Decisions Reversible by Design</h4>
            <ul>
                <li><strong>Ports and Adapters</strong>: Abstract external dependencies behind interfaces. Swap implementations without changing business logic.</li>
                <li><strong>Feature flags</strong>: Deploy new behavior behind a flag. If it fails, toggle off instantly.</li>
                <li><strong>Strangler Fig</strong>: Migrate incrementally. Old and new coexist. Rollback = route back to old.</li>
                <li><strong>Contract-first design</strong>: Define the interface/contract first. Implementation can change freely behind it.</li>
            </ul>`,
            callout: {
                type: 'warning',
                title: 'Common Mistake',
                text: 'Treating Type 2 decisions as Type 1 (analysis paralysis on reversible choices) is as harmful as treating Type 1 decisions as Type 2 (rushing irreversible choices). Calibrate your decision-making speed to the reversibility of the decision.'
            }
        },
        {
            title: 'Build vs Buy Framework',
            content: `<p>One of the most impactful architectural decisions. Framework for evaluating:</p>
            <table>
                <thead><tr><th>Factor</th><th>Build</th><th>Buy/SaaS</th></tr></thead>
                <tbody>
                    <tr><td>Core differentiator?</td><td>Yes — competitive advantage</td><td>No — commodity capability</td></tr>
                    <tr><td>Customization needs</td><td>Highly specific to your domain</td><td>Standard 80% solution is fine</td></tr>
                    <tr><td>Team expertise</td><td>You have deep expertise</td><td>New domain, learning curve is high</td></tr>
                    <tr><td>Time-to-market</td><td>Can wait (strategic investment)</td><td>Need it yesterday (tactical)</td></tr>
                    <tr><td>Total cost (5-year)</td><td>High upfront, low marginal</td><td>Low upfront, recurring cost scales with usage</td></tr>
                    <tr><td>Control & security</td><td>Full control, on-premise possible</td><td>Vendor dependency, data leaves your perimeter</td></tr>
                    <tr><td>Maintenance burden</td><td>You own all operational cost</td><td>Vendor handles updates, scaling, patches</td></tr>
                </tbody>
            </table>`,
            callout: {
                type: 'tip',
                title: 'The "Boring Technology" Principle',
                text: 'Dan McKinley\'s "Choose Boring Technology" argues: every team has a limited innovation budget. Spend it on things that differentiate your product, not on reinventing infrastructure. Use proven, well-understood technology for everything that isn\'t your core business. Novel tech should be reserved for novel problems.'
            }
        },
        {
            title: 'Architectural Fitness Functions',
            content: `<p>Fitness functions are automated checks that continuously verify your architecture's properties — like unit tests for architecture.</p>
            <h4>Examples</h4>
            <table>
                <thead><tr><th>Quality Attribute</th><th>Fitness Function</th><th>Implementation</th></tr></thead>
                <tbody>
                    <tr><td>Modularity</td><td>No circular dependencies between modules</td><td>ArchUnit / NetArchTest in CI</td></tr>
                    <tr><td>Performance</td><td>P99 latency < 200ms</td><td>Load test in pipeline, SLO alerts</td></tr>
                    <tr><td>Security</td><td>No high-severity CVEs in dependencies</td><td>Dependabot / Snyk in CI</td></tr>
                    <tr><td>Coupling</td><td>Service A doesn't depend on Service B's DB</td><td>Schema ownership enforcement</td></tr>
                    <tr><td>Deployability</td><td>Each service deployable independently</td><td>CI verifies no shared deployment artifacts</td></tr>
                    <tr><td>Data governance</td><td>PII never leaves region X</td><td>Static analysis + runtime monitoring</td></tr>
                </tbody>
            </table>`,
            code: `// NetArchTest — enforce layering rules in CI
[Fact]
public void Domain_Should_Not_Reference_Infrastructure()
{
    var result = Types.InAssembly(typeof(Order).Assembly)
        .ShouldNot()
        .HaveDependencyOn("Infrastructure")
        .GetResult();
    
    Assert.True(result.IsSuccessful, 
        $"Domain references Infrastructure: {string.Join(", ", result.FailingTypes)}");
}

[Fact]
public void Controllers_Should_Not_Reference_Repositories_Directly()
{
    var result = Types.InNamespace("Api.Controllers")
        .ShouldNot()
        .HaveDependencyOn("Data.Repositories")
        .GetResult();
    
    Assert.True(result.IsSuccessful);
}`,
            language: 'csharp'
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>No documentation of decisions</strong>: Six months later, nobody remembers WHY. Write ADRs for every significant decision.</li>
                <li><strong>Decision by committee</strong>: Seeking consensus from 10 people leads to lowest-common-denominator design. One person decides, others advise.</li>
                <li><strong>Premature optimization</strong>: Choosing complex tech for hypothetical future scale. Start simple, evolve when constraints change.</li>
                <li><strong>Resume-driven development</strong>: Choosing tech because it's trendy, not because it solves the problem. Boring technology is usually right.</li>
                <li><strong>Ignoring reversibility</strong>: Spending weeks deciding on a library choice (reversible) while rushing the database choice (irreversible).</li>
                <li><strong>Not revisiting decisions</strong>: Context changes. ADRs should be superseded when assumptions no longer hold.</li>
                <li><strong>All-or-nothing thinking</strong>: "We must use microservices everywhere" instead of choosing the right architecture per context.</li>
                <li><strong>No fitness functions</strong>: Architecture degrades silently over time. Automated checks catch drift before it accumulates.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li>Structured decision-making process (not "I just knew")</li>
                    <li>Trade-off awareness — every choice has consequences, name them</li>
                    <li>ADR practice — document decisions for future team members</li>
                    <li>Reversibility thinking — calibrate investment to decision permanence</li>
                    <li>Build vs buy judgment — know when custom is worth it</li>
                    <li>Fitness functions — how to keep architecture honest over time</li>
                    <li>Humility — "it depends" with specific criteria for when each option wins</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Document decisions in ADRs — context, alternatives, rationale, consequences</li>
                <li>Calibrate decision speed to reversibility (Type 1 = careful, Type 2 = fast)</li>
                <li>Make decisions reversible by design: interfaces, feature flags, strangler fig</li>
                <li>Build what differentiates you; buy/use boring tech for everything else</li>
                <li>Fitness functions automate architecture verification — like unit tests for design</li>
                <li>Trade-offs are explicit: name what you're gaining AND what you're giving up</li>
                <li>Revisit decisions when context changes — ADRs can be superseded</li>
                <li>One person decides, others advise. Consensus-driven architecture is mediocre architecture.</li>
            </ul>`
        }
    ],
    questions: [
        {
            id: 'ad-q1',
            level: 'architect',
            title: 'How do you make architecture decisions in an environment of uncertainty?',
            answer: `<p>Framework I use:</p>
            <ol>
                <li><strong>Classify reversibility</strong>: Is this a one-way or two-way door? Invest proportionally.</li>
                <li><strong>Identify constraints</strong>: What's non-negotiable? (regulatory, SLA, budget, team skills, timeline)</li>
                <li><strong>List options</strong>: Usually 2-4 realistic options. Don't boil the ocean.</li>
                <li><strong>Score against quality attributes</strong>: Performance, maintainability, cost, security — weighted by project priorities.</li>
                <li><strong>Spike if needed</strong>: For high-uncertainty Type 1 decisions, timebox a proof-of-concept (1-2 weeks).</li>
                <li><strong>Decide and document</strong>: Write ADR, communicate to stakeholders, move on.</li>
                <li><strong>Set a review trigger</strong>: "Revisit this when we hit 10K requests/sec" — not "maybe someday."</li>
            </ol>
            <p>The key insight: not deciding is itself a decision (to accept the status quo), and it's often the worst one.</p>`
        },
        {
            id: 'ad-q2',
            level: 'senior',
            title: 'When should you build custom vs buy/use an existing solution?',
            answer: `<p>Build when:</p>
            <ul>
                <li>It's your core differentiator (your competitive advantage depends on it)</li>
                <li>No existing solution fits even 70% of your needs</li>
                <li>You have deep domain expertise and capacity to maintain it</li>
                <li>Vendor lock-in risk is unacceptable for this component</li>
            </ul>
            <p>Buy when:</p>
            <ul>
                <li>It's a commodity capability (auth, email, payments, monitoring)</li>
                <li>Time-to-market matters more than perfect fit</li>
                <li>You lack expertise to build and operate it reliably</li>
                <li>Total cost of ownership over 5 years favors SaaS (include engineering time!)</li>
            </ul>
            <p>The common mistake: underestimating the ongoing maintenance cost of custom solutions. Building is 20% of the cost; maintaining is 80%.</p>`
        },
        {
            id: 'ad-q3',
            level: 'mid',
            title: 'What is an Architecture Decision Record (ADR) and why should teams use them?',
            answer: `<p>An ADR is a short document (1-2 pages) that captures one architectural decision: the context, the decision, the alternatives considered, and the consequences.</p>
            <p>Benefits:</p>
            <ul>
                <li><strong>Onboarding</strong>: New team members understand WHY things are the way they are</li>
                <li><strong>Avoids re-litigation</strong>: "We already considered that option and rejected it because X"</li>
                <li><strong>Safe to revisit</strong>: When context changes, you can clearly see if the original reasons still hold</li>
                <li><strong>Accountability</strong>: Decisions have an owner and a date — not "it was always like this"</li>
            </ul>
            <p>Format: Title, Status (Proposed/Accepted/Superseded), Context, Decision, Consequences. Stored in git alongside code (e.g., /docs/adr/).</p>`
        },
        {
            id: 'ad-q4',
            level: 'architect',
            title: 'How do you balance "boring technology" with innovation needs?',
            answer: `<p>Dan McKinley's framework: every team has a limited "innovation tokens" budget. Spend them only where they create competitive advantage.</p>
            <ul>
                <li><strong>Boring tech for infrastructure</strong>: PostgreSQL, Redis, Kafka, Docker — proven at scale, large community, predictable failure modes.</li>
                <li><strong>Innovation tokens for differentiators</strong>: If your business IS real-time ML scoring, then a novel ML framework is justified. If ML is incidental, use a managed service.</li>
                <li><strong>Budget rule</strong>: Max 1-2 novel technologies per project. Everything else should be boring.</li>
                <li><strong>Novel tech criteria</strong>: Does it solve a problem boring tech genuinely can't? Is the team willing to own the operational burden? Can we hire for it?</li>
            </ul>
            <p>The insight: boring doesn't mean bad. It means well-understood, debuggable, hireable, and predictable. That's usually what production systems need.</p>`
        },
        {
            id: 'ad-q5',
            level: 'senior',
            title: 'What are architectural fitness functions and how do you implement them?',
            answer: `<p>Fitness functions are automated tests that verify architectural properties remain intact as the system evolves. They catch architectural drift before it accumulates.</p>
            <ul>
                <li><strong>Static analysis</strong>: ArchUnit/NetArchTest enforces dependency rules (domain doesn't reference infrastructure)</li>
                <li><strong>Build-time checks</strong>: Dependency scanning (no high CVEs), license compliance, API contract validation</li>
                <li><strong>Runtime monitoring</strong>: SLO-based alerts (P99 &lt; 200ms), error rate budgets, resource utilization bounds</li>
                <li><strong>Deployment gates</strong>: Load test in CI must pass before deployment, security scan must clear</li>
            </ul>
            <p>They run in CI/CD (build-time) and production (runtime). When they fail, the pipeline stops or alerts fire — forcing the team to address architectural violations immediately rather than accumulating debt.</p>`
        },
        {
            id: 'ad-q6',
            level: 'senior',
            title: 'How do you write an effective ADR that actually gets read and referenced?',
            answer: `<p>Most ADRs fail not because of bad format but because they are too long, too vague, or stored where nobody looks. An effective ADR is <strong>concise, findable, and decision-focused</strong>.</p>
            <ul>
                <li><strong>Title as a decision statement</strong>: "Use PostgreSQL for the order service" not "Database selection." The title should tell you the decision without opening the document.</li>
                <li><strong>Context section under 200 words</strong>: State the problem, the constraints, and what triggered the decision. Not a research paper — just enough for a reader to understand WHY this matters.</li>
                <li><strong>Decision in one sentence</strong>: "We will use X because Y." Everything else is supporting evidence.</li>
                <li><strong>Consequences section</strong>: Explicit positive and negative consequences. What does this enable? What does it prevent? What new risks does it introduce?</li>
                <li><strong>Alternatives considered (brief)</strong>: 2-3 sentences per rejected alternative explaining why it was rejected. Prevents re-litigation.</li>
                <li><strong>Status and date</strong>: Proposed → Accepted → Superseded. With dates. Makes it clear whether this is current.</li>
            </ul>
            <h4>Making ADRs Findable:</h4>
            <ul>
                <li>Store in git alongside code (docs/adr/ or .architecture/decisions/)</li>
                <li>Number sequentially (ADR-001, ADR-002) for easy reference</li>
                <li>Link ADRs to each other (supersedes, relates-to)</li>
                <li>Reference ADR numbers in commit messages and PR descriptions</li>
            </ul>
            <p><strong>Key insight:</strong> An ADR that takes more than 10 minutes to write or more than 3 minutes to read is too long. Brevity is what makes them actually used.</p>`
        },
        {
            id: 'ad-q7',
            level: 'senior',
            title: 'What is a fitness function and how does it relate to architecture decisions?',
            answer: `<p>A <strong>fitness function</strong> (from "Building Evolutionary Architectures" by Neal Ford) is an automated, objective measure that validates whether an architectural property still holds as the system evolves. It operationalizes ADRs by turning decisions into enforceable constraints.</p>
            <h4>The ADR → Fitness Function Pipeline:</h4>
            <ul>
                <li><strong>ADR says</strong>: "Domain layer must not depend on infrastructure layer"</li>
                <li><strong>Fitness function enforces</strong>: ArchUnit/NetArchTest rule in CI that fails the build if domain references infrastructure packages</li>
                <li><strong>ADR says</strong>: "P99 latency must stay below 200ms"</li>
                <li><strong>Fitness function enforces</strong>: Production alert + deployment gate that blocks releases violating the SLO</li>
            </ul>
            <h4>Categories of Fitness Functions:</h4>
            <ul>
                <li><strong>Atomic</strong>: Tests one architectural property (e.g., no circular dependencies)</li>
                <li><strong>Holistic</strong>: Tests emergent behavior across components (e.g., end-to-end latency under load)</li>
                <li><strong>Triggered</strong>: Runs at specific points (build, deploy, merge)</li>
                <li><strong>Continuous</strong>: Monitors in production (SLO dashboards, error budget tracking)</li>
            </ul>
            <p><strong>Why they matter:</strong> Without fitness functions, ADRs are aspirational documentation. With them, architectural decisions are living constraints that alert the team the moment reality drifts from intent. They make architecture evolutionary because you can safely change things — the fitness functions tell you immediately if you broke an invariant.</p>`
        },
        {
            id: 'ad-q8',
            level: 'architect',
            title: 'How do you decide between "build vs buy" for a critical system component?',
            answer: `<p>The build-vs-buy decision is one of the highest-impact architectural choices, often involving millions of dollars and years of commitment. The framework must account for <strong>total cost of ownership</strong>, <strong>strategic alignment</strong>, and <strong>organizational capability</strong>.</p>
            <h4>Decision Framework:</h4>
            <ul>
                <li><strong>Core vs Context</strong> (Wardley): Is this your competitive differentiator (core) or a commodity capability (context)? Build core, buy context. Example: a fintech builds its risk engine (core) but buys email delivery (context).</li>
                <li><strong>Total Cost of Ownership (5-year)</strong>: Build cost includes ongoing maintenance, hiring, on-call, upgrades, security patches — not just initial development. Buy cost includes license fees, integration, customization, vendor lock-in exit cost, and feature gaps you must work around.</li>
                <li><strong>Time-to-market</strong>: If the capability is needed in 3 months and building takes 12, buying is the pragmatic choice even if building is strategically better long-term.</li>
                <li><strong>Fit percentage</strong>: If an existing solution covers 90%+ of needs, buy. If it covers &lt; 60%, the customization/workaround cost often exceeds building.</li>
                <li><strong>Team capability</strong>: Can your team build AND maintain this at production quality? Honest assessment of expertise, capacity, and willingness to own it for 5+ years.</li>
            </ul>
            <h4>Red Flags for Each Choice:</h4>
            <ul>
                <li><strong>Build red flags</strong>: "How hard can it be?" (underestimation), no domain expertise on team, the problem is well-solved commodity (auth, email, payments)</li>
                <li><strong>Buy red flags</strong>: Vendor covers only 40% of needs, heavy lock-in with no exit path, critical business logic lives in a system you do not control</li>
            </ul>
            <p><strong>The meta-decision:</strong> Build what makes you money, buy what keeps the lights on. Most companies massively over-build context capabilities and under-invest in their actual differentiators.</p>`
        }
    ]
});
