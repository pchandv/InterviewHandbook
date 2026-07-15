PageData.register('tech-debt-management', {
    title: 'Technical Debt Management',
    description: 'Quantifying, prioritizing, and systematically reducing technical debt to maintain sustainable development velocity',
    sections: [
        {
            title: 'Introduction',
            content: `<p>Technical debt is the implied cost of future rework caused by choosing expedient solutions over better approaches that would take longer. Like financial debt, it accrues interest — making future changes progressively more expensive and risky.</p>
<p>Effective tech debt management isn't about eliminating all debt (that's neither possible nor desirable), but about making conscious decisions about when to incur debt, tracking it explicitly, and paying it down strategically before it cripples velocity.</p>
<p>Organizations that ignore tech debt eventually hit a "debt wall" where most engineering effort goes toward working around accumulated problems rather than delivering value. Leaders who manage debt well maintain a sustainable pace indefinitely.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>Martin Fowler's Technical Debt Quadrant classifies debt along two axes: <strong>Reckless vs. Prudent</strong> and <strong>Deliberate vs. Inadvertent</strong>. Understanding where debt falls helps determine the appropriate response.</p>
<ul>
<li><strong>Reckless + Deliberate</strong>: "We don't have time for design" — worst kind, usually from schedule pressure with no plan to repay</li>
<li><strong>Reckless + Inadvertent</strong>: "What's layering?" — team didn't know better, discovered after the fact</li>
<li><strong>Prudent + Deliberate</strong>: "We must ship now and deal with consequences" — conscious trade-off with a repayment plan</li>
<li><strong>Prudent + Inadvertent</strong>: "Now we know how we should have done it" — natural learning, unavoidable in complex systems</li>
</ul>
<h4>Types of Technical Debt</h4>
<ul>
<li><strong>Code Debt</strong>: Duplicated code, poor naming, missing abstractions, excessive complexity</li>
<li><strong>Architecture Debt</strong>: Monolithic coupling, missing boundaries, wrong patterns for scale</li>
<li><strong>Test Debt</strong>: Missing tests, brittle tests, poor coverage of critical paths</li>
<li><strong>Documentation Debt</strong>: Outdated docs, missing ADRs, tribal knowledge</li>
<li><strong>Dependency Debt</strong>: Outdated libraries, unsupported frameworks, security vulnerabilities</li>
<li><strong>Infrastructure Debt</strong>: Manual deployments, missing monitoring, configuration drift</li>
</ul>`,
            table: {
                headers: ['Quadrant', 'Example', 'Detection', 'Response'],
                rows: [
                    ['Reckless + Deliberate', 'Skip all testing to hit deadline', 'High defect rate post-release', 'Immediate remediation sprint'],
                    ['Reckless + Inadvertent', 'Junior team uses wrong patterns', 'Code review reveals anti-patterns', 'Training + gradual refactoring'],
                    ['Prudent + Deliberate', 'Ship MVP with known shortcuts', 'Tracked in debt backlog', 'Scheduled paydown per plan'],
                    ['Prudent + Inadvertent', 'Better approach discovered later', 'Retrospectives, new knowledge', 'Prioritize when touched next']
                ]
            }
        },
        {
            title: 'How It Works',
            content: `<p>Technical debt management follows a lifecycle: <strong>Identify → Quantify → Prioritize → Remediate → Prevent</strong>. Each phase requires different tools and stakeholder engagement.</p>
<p>The key insight is treating debt like a product backlog item — visible, estimated, prioritized, and scheduled. Invisible debt is the most dangerous because it compounds without anyone making a conscious decision to accept the cost.</p>`,
            mermaid: `graph TD
    A[Identify Debt] --> B[Quantify Impact]
    B --> C[Prioritize by ROI]
    C --> D{Remediation Strategy}
    D -->|Quick Win| E[Boy Scout Rule]
    D -->|Medium Effort| F[Dedicated Stories]
    D -->|Large Effort| G[Debt Sprint]
    D -->|Strategic| H[Rewrite/Replace]
    E --> I[Track Metrics]
    F --> I
    G --> I
    H --> I
    I --> J{Debt Reduced?}
    J -->|Yes| K[Update Baseline]
    J -->|No| C
    K --> L[Prevention Controls]
    L --> A

    style A fill:#e1f5fe
    style C fill:#fff3e0
    style I fill:#e8f5e9
    style L fill:#fce4ec`
        },
        {
            title: 'Visual Diagram',
            content: `<p>The Technical Debt Quadrant helps teams classify debt and determine the appropriate management strategy for each type.</p>`,
            mermaid: `quadrantChart
    title Technical Debt Quadrant (Martin Fowler)
    x-axis Inadvertent --> Deliberate
    y-axis Reckless --> Prudent
    quadrant-1 Prudent + Deliberate
    quadrant-2 Prudent + Inadvertent
    quadrant-3 Reckless + Inadvertent
    quadrant-4 Reckless + Deliberate
    Ship MVP with shortcuts: [0.8, 0.8]
    Better design discovered later: [0.2, 0.75]
    Skip tests for deadline: [0.85, 0.2]
    Junior mistakes: [0.15, 0.25]
    Conscious architecture tradeoff: [0.7, 0.9]
    Copy-paste coding: [0.6, 0.15]`
        },
        {
            title: 'Implementation',
            content: `<p>Measuring and tracking technical debt requires integrating static analysis tools, defining quality gates, and building dashboards that make debt visible to all stakeholders.</p>
<p>Below is a C# implementation showing how to build a debt tracking system that integrates with SonarQube metrics and provides prioritization scoring.</p>`,
            code: `// Technical Debt Tracking and Prioritization System
using System;
using System.Collections.Generic;
using System.Linq;

namespace TechDebt.Management
{
    // Debt item classification following Fowler's quadrant
    public enum DebtQuadrant
    {
        RecklessDeliberate,    // "We don't have time for design"
        RecklessInadvertent,   // "What's layering?"
        PrudentDeliberate,     // "Ship now, fix later (with plan)"
        PrudentInadvertent     // "Now we know how we should have done it"
    }

    public enum DebtCategory
    {
        Code, Architecture, Testing, Documentation, Dependencies, Infrastructure
    }

    public record DebtItem
    {
        public string Id { get; init; }
        public string Title { get; init; }
        public string Description { get; init; }
        public DebtQuadrant Quadrant { get; init; }
        public DebtCategory Category { get; init; }
        public DateTime IdentifiedDate { get; init; }
        public string AffectedArea { get; init; }  // module/service path

        // Quantification
        public int EstimatedHoursToFix { get; init; }
        public int InterestPerSprintHours { get; init; }  // ongoing cost
        public int RiskScore { get; init; }  // 1-10, likelihood of causing incident

        // Prioritization score (higher = fix sooner)
        public double PriorityScore => CalculatePriority();

        private double CalculatePriority()
        {
            // WSJF-inspired: Cost of Delay / Duration
            double costOfDelay = (InterestPerSprintHours * 2.0) + (RiskScore * 3.0);
            double duration = Math.Max(EstimatedHoursToFix, 1);
            double ageFactor = (DateTime.UtcNow - IdentifiedDate).Days / 30.0 * 0.5;
            return (costOfDelay / duration) + ageFactor;
        }
    }

    // Integration with SonarQube-style metrics
    public class DebtMetricsCollector
    {
        public CodeHealthMetrics CollectMetrics(string projectPath)
        {
            // In production, this calls SonarQube API or runs analyzers
            return new CodeHealthMetrics
            {
                TechnicalDebtMinutes = GetSonarQubeDebt(projectPath),
                CodeSmells = CountCodeSmells(projectPath),
                DuplicationPercent = CalculateDuplication(projectPath),
                CyclomaticComplexity = AverageCyclomaticComplexity(projectPath),
                TestCoverage = GetTestCoverage(projectPath),
                DependencyVulnerabilities = ScanDependencies(projectPath)
            };
        }

        // Debt Ratio = tech debt time / development time
        // SonarQube rates: A (<=5%), B (6-10%), C (11-20%), D (21-50%), E (>50%)
        public char CalculateDebtRating(int debtMinutes, int devMinutes)
        {
            double ratio = (double)debtMinutes / Math.Max(devMinutes, 1);
            return ratio switch
            {
                <= 0.05 => 'A',
                <= 0.10 => 'B',
                <= 0.20 => 'C',
                <= 0.50 => 'D',
                _ => 'E'
            };
        }

        private int GetSonarQubeDebt(string path) => 0; // API call
        private int CountCodeSmells(string path) => 0;
        private double CalculateDuplication(string path) => 0;
        private double AverageCyclomaticComplexity(string path) => 0;
        private double GetTestCoverage(string path) => 0;
        private int ScanDependencies(string path) => 0;
    }

    public record CodeHealthMetrics
    {
        public int TechnicalDebtMinutes { get; init; }
        public int CodeSmells { get; init; }
        public double DuplicationPercent { get; init; }
        public double CyclomaticComplexity { get; init; }
        public double TestCoverage { get; init; }
        public int DependencyVulnerabilities { get; init; }

        // Convert to developer-days for stakeholder communication
        public double DebtInDeveloperDays => TechnicalDebtMinutes / 480.0;
    }

    // Prioritization engine using multiple factors
    public class DebtPrioritizer
    {
        private readonly List<DebtItem> _backlog = new();

        public void AddDebt(DebtItem item) => _backlog.Add(item);

        // Get prioritized list for sprint planning
        public IReadOnlyList<DebtItem> GetPrioritizedBacklog()
        {
            return _backlog
                .OrderByDescending(d => d.PriorityScore)
                .ToList();
        }

        // Recommend debt budget: 15-20% of sprint capacity
        public SprintDebtBudget PlanDebtSprint(int sprintCapacityHours)
        {
            int debtBudget = (int)(sprintCapacityHours * 0.20); // 20% rule
            var prioritized = GetPrioritizedBacklog();
            var scheduled = new List<DebtItem>();
            int allocated = 0;

            foreach (var item in prioritized)
            {
                if (allocated + item.EstimatedHoursToFix <= debtBudget)
                {
                    scheduled.Add(item);
                    allocated += item.EstimatedHoursToFix;
                }
            }

            return new SprintDebtBudget
            {
                TotalBudgetHours = debtBudget,
                AllocatedHours = allocated,
                ScheduledItems = scheduled,
                InterestSavedPerSprint = scheduled.Sum(s => s.InterestPerSprintHours)
            };
        }
    }

    public record SprintDebtBudget
    {
        public int TotalBudgetHours { get; init; }
        public int AllocatedHours { get; init; }
        public IReadOnlyList<DebtItem> ScheduledItems { get; init; }
        public int InterestSavedPerSprint { get; init; }  // ROI metric
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Best Practices',
            content: `<h4>Making Debt Visible</h4>
<ul>
<li><strong>Debt Backlog</strong>: Maintain a dedicated, visible backlog of debt items alongside feature work</li>
<li><strong>Debt Tags</strong>: Use TODO/HACK/FIXME with ticket references — never naked comments without tracking</li>
<li><strong>Quality Dashboards</strong>: Display SonarQube metrics, test coverage trends, and dependency age on team dashboards</li>
<li><strong>Architecture Decision Records</strong>: Document WHY shortcuts were taken and WHEN they should be revisited</li>
</ul>
<h4>Paying Down Debt</h4>
<ul>
<li><strong>20% Rule</strong>: Allocate 15-20% of each sprint to debt reduction — non-negotiable capacity</li>
<li><strong>Boy Scout Rule</strong>: Leave code better than you found it — small improvements with every PR</li>
<li><strong>Debt Sprints</strong>: Periodically dedicate an entire sprint to debt paydown (quarterly works well)</li>
<li><strong>Opportunistic Refactoring</strong>: When touching code for a feature, refactor the surrounding area</li>
<li><strong>Strangler Fig Pattern</strong>: For large architectural debt, incrementally replace rather than big-bang rewrite</li>
</ul>
<h4>Preventing New Debt</h4>
<ul>
<li><strong>Quality Gates</strong>: CI/CD pipelines that block merges exceeding complexity thresholds</li>
<li><strong>Definition of Done</strong>: Include "no new debt introduced" or "debt documented if incurred"</li>
<li><strong>Architecture Guardrails</strong>: ArchUnit/NetArchTest rules that prevent structural violations</li>
<li><strong>Dependency Policies</strong>: Automated alerts for outdated/vulnerable dependencies (Dependabot, Renovate)</li>
</ul>
<h4>Stakeholder Communication</h4>
<ul>
<li><strong>Speak in Business Terms</strong>: "This debt costs us 2 developer-days per sprint" not "the code is messy"</li>
<li><strong>Show Interest Accrual</strong>: Demonstrate how debt slows feature delivery over time with velocity charts</li>
<li><strong>Quantify Risk</strong>: "This outdated dependency has 3 known CVEs — one incident costs us $X"</li>
<li><strong>ROI Framing</strong>: "Investing 2 sprints now saves 1 developer-day every sprint for 2 years"</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>Invisible Debt</strong>: Not tracking debt items explicitly — if it's not in a backlog, it doesn't get fixed. Use a dedicated label/tag for debt items in your tracker.</li>
<li><strong>All-or-Nothing Thinking</strong>: Waiting for a "big refactoring project" instead of steady incremental paydown. Large rewrites are risky; prefer continuous small improvements.</li>
<li><strong>Gold-Plating Prevention</strong>: Over-engineering "just in case" creates its own form of debt — unnecessary complexity. YAGNI still applies.</li>
<li><strong>No Prioritization</strong>: Treating all debt equally. A dead-code smell in a rarely-touched module matters less than a coupling issue in your hot path.</li>
<li><strong>Confusing Messiness with Debt</strong>: Not all ugly code is debt. Debt specifically has an ongoing cost (interest). Stable ugly code that nobody touches has near-zero interest.</li>
<li><strong>Debt Denial</strong>: "It works, so it's fine" — ignoring that change velocity is dropping because every feature now requires working around accumulated problems.</li>
<li><strong>Blaming Without Measuring</strong>: Saying "we have too much tech debt" without quantifying it gives leadership nothing actionable. Measure, then propose solutions.</li>
<li><strong>Forgetting to Celebrate</strong>: Never showing progress on debt reduction demoralizes teams. Track and celebrate metrics improvements.</li>
<li><strong>Boy Scout Scope Creep</strong>: Refactoring too much in a feature PR — keep improvements small and focused, or split into separate PRs.</li>
<li><strong>Ignoring Process Debt</strong>: Manual deployments, missing CI/CD, no automated testing — these are debt too, often with the highest interest rates.</li>
</ul>`
        },
        {
            title: 'Real-World Applications',
            content: `<p>Technical debt management manifests differently across organization sizes and system maturity levels. Here are common scenarios where structured debt management delivers measurable impact.</p>`,
            table: {
                headers: ['Scenario', 'Debt Type', 'Strategy', 'Outcome'],
                rows: [
                    ['Legacy monolith migration', 'Architecture', 'Strangler Fig over 18 months', 'Deployment frequency 1/month → 10/day'],
                    ['Startup post-Series A', 'Code + Test', '20% sprint allocation + quality gates', 'Defect rate dropped 60% in 6 months'],
                    ['Security vulnerability backlog', 'Dependencies', 'Automated Renovate + SLA policy', 'Mean time to patch: 45 days → 3 days'],
                    ['Flaky test suite', 'Testing', 'Quarantine + fix sprint + coverage gates', 'CI reliability 70% → 99%, developer trust restored'],
                    ['Manual deployment process', 'Infrastructure', 'Incremental CI/CD pipeline build', 'Deploy time 4 hours → 15 minutes, errors eliminated'],
                    ['Tribal knowledge risk', 'Documentation', 'ADRs + onboarding docs sprint', 'New dev ramp-up 3 months → 3 weeks'],
                    ['Performance degradation', 'Code + Architecture', 'Profile-guided optimization sprint', 'P95 latency 2s → 200ms, infra costs -40%'],
                    ['Compliance audit failure', 'Process + Code', 'Automated SAST/DAST + policy-as-code', 'Audit prep 6 weeks → 2 days']
                ]
            }
        },
        {
            title: 'Interview Tips',
            content: `<p>Technical debt questions test your maturity as an engineering leader. Interviewers want to see that you can balance pragmatism with quality, communicate with non-technical stakeholders, and drive systematic improvement.</p>`,
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>Nuance over dogma</strong>: Show you understand that some debt is acceptable and even strategic — not all debt is bad</li>
<li><strong>Quantification ability</strong>: Can you put numbers on debt? Hours wasted, incidents caused, velocity impact?</li>
<li><strong>Stakeholder communication</strong>: How do you explain debt to a non-technical VP who wants features shipped faster?</li>
<li><strong>Systematic approach</strong>: Do you have a framework for identifying, measuring, prioritizing, and reducing debt?</li>
<li><strong>Prevention mindset</strong>: Beyond fixing existing debt, how do you prevent new debt accumulation?</li>
<li><strong>Real examples</strong>: Concrete stories where you identified debt, made a business case, and delivered measurable improvement</li>
<li><strong>Trade-off reasoning</strong>: When IS it right to take on debt? Can you articulate the conditions and safeguards?</li>
</ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li><strong>Debt is inevitable</strong> — the goal is conscious, managed debt with a repayment plan, not zero debt</li>
<li><strong>Use the Fowler Quadrant</strong> to classify debt and determine appropriate response strategies</li>
<li><strong>Make debt visible</strong> with explicit backlog items, metrics dashboards, and quality gates</li>
<li><strong>Allocate 15-20%</strong> of sprint capacity to debt reduction — treat it as non-negotiable capacity</li>
<li><strong>Prioritize by ROI</strong>: fix high-interest debt first (WSJF: Cost of Delay / Duration)</li>
<li><strong>Communicate in business language</strong>: developer-days saved, incidents prevented, velocity gained</li>
<li><strong>Prevention is cheaper than cure</strong>: quality gates, architectural guardrails, and the Boy Scout Rule</li>
<li><strong>Measure trends, not absolutes</strong>: is debt going up or down? Is velocity improving?</li>
<li><strong>Small steady paydown beats big-bang rewrites</strong> in both risk and outcomes</li>
<li><strong>Celebrate progress</strong>: show the team and stakeholders measurable improvements from debt work</li>
</ul>`
        }
    ],
    questions: [
        {
            id: 'td-junior-1',
            level: 'junior',
            title: 'What is technical debt and why does it matter?',
            answer: `<p><strong>Technical debt</strong> is the implied cost of future rework caused by choosing a quick or easy solution now instead of a better approach that would take longer.</p>
<p>The metaphor comes from financial debt:</p>
<ul>
<li><strong>Principal</strong>: The effort needed to fix the shortcut</li>
<li><strong>Interest</strong>: The ongoing extra effort required every time you work with the affected code</li>
</ul>
<p>It matters because:</p>
<ul>
<li>It slows down future development — every new feature takes longer because developers work around accumulated problems</li>
<li>It increases defect rates — fragile code breaks more easily when changed</li>
<li>It reduces team morale — developers hate fighting brittle, confusing code daily</li>
<li>It compounds over time — small debts accumulate into large systemic issues that become expensive to fix</li>
</ul>
<p>Not all debt is bad — sometimes shipping quickly is the right business decision. The key is making it a <em>conscious</em> decision and having a plan to pay it back.</p>`
        },
        {
            id: 'td-junior-2',
            level: 'junior',
            title: 'What is the Boy Scout Rule and how does it help manage tech debt?',
            answer: `<p>The <strong>Boy Scout Rule</strong> states: "Always leave the code better than you found it." It's named after the scouting principle of leaving a campsite cleaner than you found it.</p>
<p>In practice, this means:</p>
<ul>
<li>When you touch a file to add a feature or fix a bug, make small improvements to the surrounding code</li>
<li>Rename a confusing variable, extract a method, add a missing test, fix a typo in documentation</li>
<li>Keep improvements small and focused — don't turn a bug fix into a major refactoring PR</li>
</ul>
<p>How it helps with tech debt:</p>
<ul>
<li><strong>Continuous improvement</strong>: Code quality improves steadily without dedicated "cleanup sprints"</li>
<li><strong>Prevents accumulation</strong>: Small daily improvements outpace small daily degradation</li>
<li><strong>Low risk</strong>: Tiny changes are easy to review and unlikely to introduce bugs</li>
<li><strong>Cultural habit</strong>: Builds a team culture where quality is everyone's responsibility</li>
</ul>
<p>The limitation: the Boy Scout Rule handles small, localized debt but cannot address large architectural debt that requires coordinated effort across many files or services.</p>`
        },
        {
            id: 'td-mid-1',
            level: 'mid',
            title: 'Explain Martin Fowler\'s Technical Debt Quadrant and give an example of each type.',
            answer: `<p>Fowler's quadrant classifies debt on two axes: <strong>Reckless vs. Prudent</strong> (quality of the decision) and <strong>Deliberate vs. Inadvertent</strong> (awareness when incurring it).</p>
<h4>1. Reckless + Deliberate</h4>
<p>"We don't have time for design." The team knowingly cuts corners with no plan to fix it. Example: Skipping all input validation because "we'll add it later" — but there's no ticket, no plan, and the debt is invisible.</p>
<h4>2. Reckless + Inadvertent</h4>
<p>"What's layering?" The team doesn't know enough to realize they're creating debt. Example: A junior team builds a tightly coupled monolith because they've never seen clean architecture — they discover the problem when changes start causing cascading failures.</p>
<h4>3. Prudent + Deliberate</h4>
<p>"We must ship now and deal with consequences." A conscious trade-off with an explicit repayment plan. Example: "We're hardcoding the tax calculation for US-only launch. Ticket DEBT-142 tracks internationalization for Q3." This is often acceptable.</p>
<h4>4. Prudent + Inadvertent</h4>
<p>"Now we know how we should have done it." Natural learning — you couldn't have known a better approach until you gained experience with the domain. Example: After a year of operating a microservices system, you realize event sourcing would have been better than request/response for your use case.</p>
<p><strong>Management implication</strong>: Reckless debt should be minimized through process controls. Prudent deliberate debt should be tracked and scheduled. Inadvertent debt is managed through retrospectives and continuous learning.</p>`
        },
        {
            id: 'td-mid-2',
            level: 'mid',
            title: 'How would you measure technical debt in a codebase? What metrics would you track?',
            answer: `<p>Effective debt measurement combines automated metrics with human assessment:</p>
<h4>Automated Metrics (Tools: SonarQube, CodeClimate, NDepend)</h4>
<ul>
<li><strong>Technical Debt Ratio</strong>: Remediation cost / development cost — SonarQube's primary metric, rated A-E</li>
<li><strong>Code Smells</strong>: Count of maintainability issues (long methods, deep nesting, duplicated blocks)</li>
<li><strong>Cyclomatic Complexity</strong>: Average and maximum per method — high values indicate hard-to-test code</li>
<li><strong>Duplication Percentage</strong>: Duplicated lines / total lines — above 5% is concerning</li>
<li><strong>Test Coverage</strong>: Line and branch coverage, especially on critical paths</li>
<li><strong>Dependency Age</strong>: How many dependencies are outdated, how far behind latest version</li>
<li><strong>Known Vulnerabilities</strong>: CVE count from dependency scanning (Snyk, OWASP)</li>
</ul>
<h4>Velocity-Based Metrics</h4>
<ul>
<li><strong>Lead Time Trend</strong>: If lead time for similar-sized stories is increasing, debt is accumulating</li>
<li><strong>Bug Escape Rate</strong>: Increasing production bugs often correlates with test and code debt</li>
<li><strong>Hotspot Analysis</strong>: Files that are frequently changed AND have high complexity — these are high-interest debt</li>
</ul>
<h4>Human Assessment</h4>
<ul>
<li><strong>Developer Surveys</strong>: "On a scale of 1-10, how confident are you making changes in module X?"</li>
<li><strong>Time Accounting</strong>: Track time spent on workarounds, debugging mysterious failures, onboarding confusion</li>
</ul>
<p>The most powerful signal is <strong>hotspot × complexity</strong>: a high-complexity file that changes frequently has the highest "interest rate" and should be prioritized for paydown.</p>`
        },
        {
            id: 'td-mid-3',
            level: 'mid',
            title: 'How do you convince non-technical stakeholders to invest in tech debt reduction?',
            answer: `<p>The key is translating technical concepts into business impact using language stakeholders care about: speed, cost, and risk.</p>
<h4>Frame as Business Impact, Not Technical Problems</h4>
<ul>
<li><strong>Instead of</strong>: "Our code is tightly coupled and has 15% duplication"</li>
<li><strong>Say</strong>: "Features that used to take 1 sprint now take 3 sprints because developers spend 60% of their time working around existing problems"</li>
</ul>
<h4>Quantify with Numbers</h4>
<ul>
<li>"This debt costs us 2 developer-days per sprint in extra work. That's $80K/year across the team."</li>
<li>"Our last 3 production incidents were caused by code in areas flagged as high-debt. Each incident cost us X hours of downtime."</li>
<li>"New developer onboarding takes 3 months instead of 3 weeks because of undocumented complexity."</li>
</ul>
<h4>Show the Compound Interest</h4>
<p>Use velocity charts showing declining throughput over time, and project forward: "At current rate of accumulation, in 6 months we'll deliver 40% fewer features per sprint."</p>
<h4>Propose Specific ROI</h4>
<p>"If we invest 2 sprints (about $40K of engineering time), we'll save 1 developer-day every sprint for the next 2 years — that's a 12:1 return on investment."</p>
<h4>Start Small and Demonstrate</h4>
<p>Don't ask for a 3-month refactoring project upfront. Ask for 20% of one sprint, deliver measurable improvement, then use that evidence to justify continued investment.</p>`
        },
        {
            id: 'td-senior-1',
            level: 'senior',
            title: 'How would you design a tech debt prioritization framework for a large engineering organization?',
            answer: `<p>A scalable prioritization framework needs to balance quantitative metrics with qualitative assessment and align with business priorities.</p>
<h4>Step 1: Standardized Debt Classification</h4>
<p>Create a taxonomy that all teams use: category (code/architecture/test/infra/dependency/doc), severity (critical/high/medium/low), and quadrant (per Fowler). This enables cross-team comparison and portfolio-level decisions.</p>
<h4>Step 2: Scoring Model (WSJF-Inspired)</h4>
<p>Score each debt item on three factors:</p>
<ul>
<li><strong>Interest Rate (1-10)</strong>: How much ongoing cost does this debt generate per sprint?</li>
<li><strong>Risk (1-10)</strong>: What's the probability and severity of an incident caused by this debt?</li>
<li><strong>Business Alignment (1-10)</strong>: Does fixing this unblock upcoming features or strategic initiatives?</li>
</ul>
<p>Priority Score = (Interest × 2 + Risk × 3 + Alignment × 1.5) / Estimated Effort</p>
<h4>Step 3: Portfolio View</h4>
<p>Aggregate debt across teams into a central dashboard showing: total debt by category, trend direction (improving/worsening), top-10 highest-priority items, and each team's debt allocation vs. capacity.</p>
<h4>Step 4: Budget Allocation Policy</h4>
<ul>
<li><strong>Baseline</strong>: Every team allocates 15-20% of capacity to debt reduction</li>
<li><strong>Escalation</strong>: Teams whose debt ratio exceeds threshold get 30% allocation until below threshold</li>
<li><strong>Strategic</strong>: Quarterly, leadership approves 1-2 large cross-team debt initiatives based on portfolio priorities</li>
</ul>
<h4>Step 5: Governance</h4>
<p>Monthly debt review with engineering leadership: track metrics trends, celebrate wins, escalate blocked items, adjust priorities based on changing business context.</p>`
        },
        {
            id: 'td-senior-2',
            level: 'senior',
            title: 'Describe a situation where you inherited a high-debt codebase. How did you approach systematic paydown?',
            answer: `<p>A strong answer follows this structure: <strong>Assess → Quantify → Prioritize → Execute → Measure</strong>.</p>
<h4>Assessment Phase (Weeks 1-2)</h4>
<ul>
<li>Run static analysis tools (SonarQube, NDepend) to get baseline metrics</li>
<li>Identify hotspots: files with high complexity + high change frequency (use git log analysis)</li>
<li>Interview team members: "What slows you down most? What areas do you dread changing?"</li>
<li>Review incident history: which debt caused production issues?</li>
</ul>
<h4>Quantification Phase (Week 3)</h4>
<ul>
<li>Categorize all identified debt into a backlog with estimates</li>
<li>Calculate interest: "This costs us X hours/sprint in extra work"</li>
<li>Identify quick wins: high impact, low effort items</li>
<li>Build a debt dashboard visible to the team and stakeholders</li>
</ul>
<h4>Execution Strategy</h4>
<ul>
<li><strong>Immediate</strong>: Add quality gates to CI/CD to stop NEW debt (prevent the bleeding)</li>
<li><strong>Sprint-by-sprint</strong>: 20% capacity dedicated to highest-ROI debt items</li>
<li><strong>Quarterly</strong>: One dedicated debt sprint for larger architectural improvements</li>
<li><strong>Opportunistic</strong>: Boy Scout Rule enforced in all PRs touching affected areas</li>
</ul>
<h4>Key Success Factors</h4>
<p>Stakeholder buy-in through business-language communication, visible progress tracking (before/after metrics), team empowerment (let developers propose solutions), and celebrating wins publicly.</p>`
        },
        {
            id: 'td-senior-3',
            level: 'senior',
            title: 'When is it appropriate to intentionally take on technical debt? What safeguards do you put in place?',
            answer: `<p>Intentional (prudent deliberate) debt is appropriate when the benefit of shipping early outweighs the cost of the shortcut — but ONLY with explicit safeguards.</p>
<h4>Appropriate Situations</h4>
<ul>
<li><strong>Market window</strong>: A competitor is about to launch, and being first matters more than code quality</li>
<li><strong>Validation</strong>: Building an MVP to test a hypothesis — if it fails, the code is thrown away anyway</li>
<li><strong>Short-term constraint</strong>: Key team member on leave, can't do it properly until they return</li>
<li><strong>Bounded scope</strong>: The shortcut affects only a small, isolated area that's easy to refactor later</li>
<li><strong>Expiring context</strong>: Regulatory deadline, contractual obligation, or event-driven launch date</li>
</ul>
<h4>Required Safeguards</h4>
<ol>
<li><strong>Explicit documentation</strong>: Write an ADR explaining what was done, why, and what "proper" looks like</li>
<li><strong>Tracking ticket</strong>: Create a debt item in the backlog immediately — not "someday," but with a target sprint</li>
<li><strong>Scope boundary</strong>: Ensure the shortcut is contained (behind an interface, in a module) so it doesn't infect other code</li>
<li><strong>Acceptance criteria for paydown</strong>: Define what "fixed" looks like before you ship the shortcut</li>
<li><strong>Team agreement</strong>: The whole team understands and agrees to the trade-off — no unilateral decisions</li>
<li><strong>Review trigger</strong>: Set a calendar reminder or automated alert if the debt ticket isn't resolved by target date</li>
</ol>
<h4>Red Flags (Don't Take On Debt)</h4>
<ul>
<li>No plan to repay — "we'll fix it later" without a ticket is reckless, not prudent</li>
<li>Security-related shortcuts — never acceptable due to risk profile</li>
<li>The same area already has high debt — compounding makes paydown exponentially harder</li>
<li>The shortcut requires other teams to work around it — now the interest is multiplied across teams</li>
</ul>`
        },
        {
            id: 'td-architect-1',
            level: 'architect',
            title: 'How do you prevent architectural debt from accumulating in a rapidly scaling microservices system?',
            answer: `<p>Architectural debt in microservices is particularly dangerous because it's distributed, harder to detect, and more expensive to fix than monolithic code debt.</p>
<h4>Prevention Strategy: Multiple Layers of Defense</h4>
<h4>1. Architectural Guardrails (Automated)</h4>
<ul>
<li><strong>Service mesh policies</strong>: Enforce communication patterns (no direct DB access across service boundaries)</li>
<li><strong>Schema registries</strong>: Prevent breaking API contract changes with compatibility checks in CI</li>
<li><strong>Dependency scanning</strong>: Detect circular dependencies between services, alert on coupling violations</li>
<li><strong>Architecture fitness functions</strong>: Automated tests that verify architectural properties (latency budgets, dependency direction, data ownership)</li>
</ul>
<h4>2. Governance (Human)</h4>
<ul>
<li><strong>Architecture Decision Records</strong>: Every cross-service design decision documented with context, decision, and consequences</li>
<li><strong>Domain ownership model</strong>: Clear bounded contexts — each service has one owning team, no shared ownership</li>
<li><strong>Architecture Review Board</strong>: Lightweight review for new services or significant changes to service contracts</li>
<li><strong>Tech Radar</strong>: Standardize technology choices to prevent fragmentation (adopt/trial/assess/hold)</li>
</ul>
<h4>3. Evolutionary Architecture Practices</h4>
<ul>
<li><strong>Sacrificial architecture</strong>: Build v1 knowing it will be replaced — design for replaceability, not perfection</li>
<li><strong>Strangler Fig by default</strong>: All large changes use incremental migration, never big-bang</li>
<li><strong>Platform team</strong>: Provide golden paths (templates, libraries) so teams don't reinvent infrastructure</li>
<li><strong>Cell-based architecture</strong>: Limit blast radius — if one area accumulates debt, it doesn't affect others</li>
</ul>
<h4>4. Detection and Response</h4>
<ul>
<li><strong>Service dependency graphs</strong>: Visualize and monitor for unhealthy patterns (god services, circular calls)</li>
<li><strong>Distributed tracing analysis</strong>: Identify services with disproportionate latency contribution</li>
<li><strong>Team cognitive load assessment</strong>: If a team can't hold their services in their heads, the architecture has debt</li>
</ul>
<p>The key principle: <strong>make the right thing easy and the wrong thing hard</strong>. Good architecture is maintained by making compliant patterns easier than non-compliant ones.</p>`
        },
        {
            id: 'td-architect-2',
            level: 'architect',
            title: 'How would you build an organization-wide technical debt strategy that balances feature velocity with long-term sustainability?',
            answer: `<p>An organization-wide strategy must align engineering culture, processes, tooling, and incentives around sustainable development.</p>
<h4>Foundational Principles</h4>
<ol>
<li><strong>Debt is a first-class product concern</strong>: It appears on roadmaps alongside features, not hidden in "engineering time"</li>
<li><strong>Prevention over cure</strong>: Every process change should make debt harder to create and easier to find</li>
<li><strong>Local autonomy, global visibility</strong>: Teams decide HOW to manage their debt; leadership sees the portfolio view</li>
<li><strong>Incentive alignment</strong>: Reward sustainable velocity, not just output</li>
</ol>
<h4>Strategy Components</h4>
<h4>1. Measurement Infrastructure</h4>
<ul>
<li>Standardized tooling across all teams (SonarQube, Snyk, code complexity analyzers)</li>
<li>Organization-wide dashboard: total debt by team, trend direction, debt ratio vs. industry benchmarks</li>
<li>Automated alerts when metrics cross thresholds (debt ratio > 20%, coverage drops below floor)</li>
</ul>
<h4>2. Process Integration</h4>
<ul>
<li><strong>Sprint planning</strong>: Mandatory 15-20% debt allocation built into velocity calculations</li>
<li><strong>Quarterly planning</strong>: Debt reduction themes alongside feature themes</li>
<li><strong>Annual strategy</strong>: 1-2 "platform health" OKRs alongside business OKRs</li>
<li><strong>Definition of Done</strong>: Includes "no new critical/high debt introduced or existing debt documented"</li>
</ul>
<h4>3. Engineering Culture</h4>
<ul>
<li><strong>Blameless debt discovery</strong>: Finding and reporting debt is celebrated, not punished</li>
<li><strong>Shared ownership</strong>: "I didn't write this" is never an excuse to ignore debt in your area</li>
<li><strong>Learning from debt</strong>: Retrospectives include "what debt did we discover or create?" as a standard topic</li>
<li><strong>Internal tech talks</strong>: Teams share successful debt paydown stories — what worked, what didn't</li>
</ul>
<h4>4. Executive Communication</h4>
<ul>
<li>Monthly "platform health" report to CTO/VP Eng with 3 metrics: debt trend, velocity trend, incident correlation</li>
<li>Quarterly board-level summary: engineering efficiency ratio and investment in sustainability</li>
<li>Annual comparison: peer companies' engineering efficiency benchmarks (DORA metrics)</li>
</ul>
<h4>5. Continuous Calibration</h4>
<p>No strategy survives first contact unchanged. Review quarterly: Are teams actually allocating 20%? Is the debt trend improving? Are quality gates too strict (blocking velocity) or too lenient (allowing accumulation)? Adjust based on data.</p>`
        }
    ]
});
