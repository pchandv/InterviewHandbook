PageData.register('maintainability', {
    title: 'Maintainability & Code Quality',
    description: 'Coupling, cohesion, cyclomatic complexity, technical debt management, code metrics, static analysis, and building systems that teams can sustain over years',
    sections: [
        {
            title: 'Introduction',
            content: `<p><strong>Maintainability</strong> is the ease with which a software system can be modified to fix bugs, add features, improve performance, or adapt to a changed environment. It is arguably the MOST important quality attribute because software spends 80%+ of its lifetime being maintained, not built.</p>
<p>A system that is easy to write but hard to change is a liability. A system that is easy to change remains an asset for years. The difference is measurable through code metrics, and achievable through deliberate design choices.</p>
<p>This topic covers the quantitative (metrics, static analysis) and qualitative (coupling, cohesion, ownership) aspects of maintainability — and the very real business concept of <strong>technical debt</strong>.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>Maintainability is built on several foundational concepts:</p>`,
            table: {
                headers: ['Concept', 'Definition', 'Why It Matters'],
                rows: [
                    ['Coupling', 'Degree of interdependence between modules', 'High coupling = change in A forces changes in B, C, D. Ripple effects.'],
                    ['Cohesion', 'Degree to which elements within a module belong together', 'High cohesion = module does ONE thing well. Easy to understand and test.'],
                    ['Cyclomatic Complexity', 'Number of independent paths through code (branches)', 'High complexity = more test cases needed, harder to understand, more bugs.'],
                    ['Technical Debt', 'Implied cost of rework caused by choosing quick solutions', 'Accumulates interest: gets harder to fix over time. Must be managed.'],
                    ['Maintainability Index', 'Composite metric (0-100) combining complexity, LOC, coupling', 'Quick health indicator. Below 20 = hard to maintain.'],
                    ['Cognitive Complexity', 'How difficult code is for humans to understand (SonarQube)', 'Better than cyclomatic for readability. Penalizes nesting more.'],
                    ['Code Churn', 'Frequency of changes to a file', 'High churn + high complexity = bug hotspot. Prioritize refactoring here.'],
                    ['Afferent/Efferent Coupling', 'Ca = who depends on me, Ce = who I depend on', 'High Ca = changing me is risky (many dependents). High Ce = I am fragile.']
                ]
            }
        },
        {
            title: 'How It Works',
            content: `<p>Maintainability is achieved through a combination of design decisions, metrics monitoring, and debt management:</p>`,
            mermaid: `graph TD
    A[Design Decisions] --> B[Low Coupling]
    A --> C[High Cohesion]
    A --> D[Simple Interfaces]
    
    E[Measurement] --> F[Static Analysis - SonarQube]
    E --> G[Code Metrics - Cyclomatic/Cognitive]
    E --> H[Dependency Analysis - NDepend]
    
    I[Management] --> J[Tech Debt Backlog]
    I --> K[Quality Gates in CI]
    I --> L[Code Review Standards]
    
    B --> M[Maintainable System]
    C --> M
    D --> M
    F --> M
    G --> M
    H --> M
    J --> M
    K --> M
    L --> M
    
    M --> N[Easy to Change]
    M --> O[Easy to Test]
    M --> P[Easy to Understand]
    M --> Q[Low Bug Rate]`
        },
        {
            title: 'Coupling & Cohesion',
            content: `<p>These are the two most important structural qualities. They are inversely related: good design has LOW coupling and HIGH cohesion.</p>
<h4>Types of Coupling (worst to best):</h4>
<ol>
<li><strong>Content coupling</strong> — Module directly accesses internals of another (breaks encapsulation)</li>
<li><strong>Common coupling</strong> — Modules share global/static mutable state</li>
<li><strong>Control coupling</strong> — Module passes a flag that controls the other's behavior</li>
<li><strong>Stamp coupling</strong> — Modules share a data structure but only use parts of it</li>
<li><strong>Data coupling</strong> — Modules communicate through parameters (best achievable coupling)</li>
<li><strong>Message coupling</strong> — Modules communicate through events/messages (loosest)</li>
</ol>
<h4>Types of Cohesion (worst to best):</h4>
<ol>
<li><strong>Coincidental</strong> — Elements grouped randomly (Utilities class)</li>
<li><strong>Logical</strong> — Elements grouped by category (all validators in one class)</li>
<li><strong>Temporal</strong> — Elements grouped by when they execute (startup code)</li>
<li><strong>Procedural</strong> — Elements grouped by execution order</li>
<li><strong>Communicational</strong> — Elements operate on the same data</li>
<li><strong>Sequential</strong> — Output of one element is input to the next</li>
<li><strong>Functional</strong> — All elements contribute to a SINGLE well-defined task (best)</li>
</ol>`,
            code: `// BAD: Low cohesion, high coupling — "God class" that does everything
public class OrderManager
{
    private readonly DbContext _db;           // Knows about DB
    private readonly SmtpClient _smtp;        // Knows about email
    private readonly IPaymentGateway _pay;    // Knows about payments
    private readonly IPdfGenerator _pdf;      // Knows about PDFs
    
    public Order CreateOrder(Cart cart)
    {
        var order = MapCartToOrder(cart);
        _db.Orders.Add(order);
        _db.SaveChanges();
        
        var charge = _pay.Charge(order.Total, cart.PaymentMethod);  // Payment logic
        
        var invoice = _pdf.Generate(order);   // PDF generation logic
        _smtp.Send(order.CustomerEmail, invoice);  // Email logic
        
        UpdateInventory(order);               // Inventory logic
        NotifyWarehouse(order);               // Shipping logic
        
        return order;
    }
    // This class changes for 6 different reasons — violates SRP
}

// GOOD: High cohesion, low coupling — each class has ONE responsibility
public class OrderService
{
    private readonly IOrderRepository _repo;
    private readonly IEventBus _events;

    public async Task<Order> CreateOrder(CreateOrderCommand cmd)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Items);
        await _repo.Save(order);
        
        // Publish event — other services handle payment, email, inventory
        await _events.Publish(new OrderCreated(order.Id, order.Items, order.Total));
        
        return order;
    }
    // This class changes ONLY when order creation logic changes
}`,
            language: 'csharp'
        },
        {
            title: 'Cyclomatic & Cognitive Complexity',
            content: `<p><strong>Cyclomatic Complexity</strong> counts the number of independent execution paths through a method. Each branch (if, else, case, &&, ||, catch, ternary) adds 1.</p>
<p><strong>Cognitive Complexity</strong> (SonarQube) measures how hard code is to UNDERSTAND. It penalizes nesting more heavily and doesn't count all structures equally.</p>`,
            code: `// Cyclomatic Complexity = 8 (high — hard to test, hard to understand)
// Cognitive Complexity = 12 (even worse — deeply nested)
public decimal CalculateDiscount(Order order)
{
    decimal discount = 0;
    
    if (order.Customer.IsPremium)                    // +1 cyclomatic, +1 cognitive
    {
        if (order.Total > 1000)                      // +1, +2 (nesting penalty)
        {
            discount = 0.15m;
            if (order.Items.Count > 10)              // +1, +3 (deeper nesting!)
            {
                discount = 0.20m;
            }
        }
        else if (order.Total > 500)                  // +1, +2
        {
            discount = 0.10m;
        }
        else                                         // +1, +2
        {
            discount = 0.05m;
        }
    }
    else if (order.Total > 2000)                     // +1, +1
    {
        discount = 0.08m;
    }
    
    if (order.HasCoupon && order.Coupon.IsValid())    // +1 (&&), +1
    {
        discount += order.Coupon.Value;
    }
    
    return Math.Min(discount, 0.30m);
}

// REFACTORED: Cyclomatic = 4, Cognitive = 4 (flat, readable, testable)
public decimal CalculateDiscount(Order order)
{
    var baseDiscount = GetBaseDiscount(order);
    var couponDiscount = GetCouponDiscount(order);
    
    return Math.Min(baseDiscount + couponDiscount, 0.30m);
}

private decimal GetBaseDiscount(Order order) => order switch
{
    { Customer.IsPremium: true, Total: > 1000, Items.Count: > 10 } => 0.20m,
    { Customer.IsPremium: true, Total: > 1000 } => 0.15m,
    { Customer.IsPremium: true, Total: > 500 } => 0.10m,
    { Customer.IsPremium: true } => 0.05m,
    { Total: > 2000 } => 0.08m,
    _ => 0m
};

private decimal GetCouponDiscount(Order order) =>
    order.HasCoupon && order.Coupon.IsValid() ? order.Coupon.Value : 0m;`,
            language: 'csharp'
        },
        {
            title: 'Technical Debt',
            content: `<p>Technical debt is the implied cost of future rework caused by choosing an expedient solution now instead of a better approach that would take longer.</p>
<h4>Technical Debt Quadrant (Martin Fowler):</h4>`,
            mermaid: `quadrantChart
    title Technical Debt Quadrant
    x-axis Reckless --> Prudent
    y-axis Inadvertent --> Deliberate
    quadrant-1 "Deliberate + Prudent: We know the trade-off, will fix later"
    quadrant-2 "Deliberate + Reckless: We dont have time for design"
    quadrant-3 "Inadvertent + Reckless: What is layering?"
    quadrant-4 "Inadvertent + Prudent: Now we know how we should have done it"`,
            callout: {
                type: 'warning',
                title: 'Technical Debt is NOT all code that could be better',
                text: '<p>Not all imperfect code is debt. Debt implies a DELIBERATE trade-off with an implied "interest payment" (future cost). Code that works, is tested, and is reasonably clear is NOT debt just because a newer pattern exists. Refactoring everything to the latest pattern is called "gold plating" — which is waste, not debt repayment.</p>'
            }
        },
        {
            title: 'Static Analysis & Code Metrics',
            content: `<p>Static analysis tools measure maintainability automatically and enforce quality gates in CI/CD:</p>`,
            table: {
                headers: ['Tool', 'What It Measures', 'Language Support', 'Key Feature'],
                rows: [
                    ['SonarQube/SonarCloud', 'Bugs, vulnerabilities, code smells, coverage, duplication', 'C#, Java, JS/TS, Python, 30+', 'Quality Gates (fail build if quality drops)'],
                    ['NDepend (.NET)', 'Dependencies, coupling, complexity, architecture rules', '.NET only', 'CQLinq queries over code structure'],
                    ['Roslyn Analyzers', 'Style, correctness, performance, security', 'C# / .NET', 'IDE real-time feedback + CI enforcement'],
                    ['ESLint/TSLint', 'Style, complexity, best practices', 'JavaScript/TypeScript', 'Pluggable rule sets, auto-fix'],
                    ['CodeClimate', 'Maintainability, duplication, complexity', 'Multi-language', 'Maintainability grade (A-F)'],
                    ['dotnet-format', 'Code style consistency', '.NET', 'Auto-format on save/CI']
                ]
            }
        },
        {
            title: 'Best Practices',
            content: `<ul>
<li><strong>Measure before you improve</strong> — Run static analysis on your codebase first. Focus refactoring on files with BOTH high complexity AND high churn (change frequency). These are your bug hotspots.</li>
<li><strong>Quality gates in CI</strong> — SonarQube quality gate: "No new code smells, coverage > 80% on new code, no new security vulnerabilities." Fail the build if violated.</li>
<li><strong>Boy Scout Rule</strong> — Leave code better than you found it. Small improvements on every PR accumulate into major quality gains over months.</li>
<li><strong>Manage tech debt explicitly</strong> — Track debt items in the backlog with estimated payoff. Allocate 15-20% of sprint capacity to debt reduction.</li>
<li><strong>Design for replaceability</strong> — Modules should be replaceable without rewriting their consumers. Depend on abstractions (interfaces), not implementations.</li>
<li><strong>Limit class size</strong> — If a class has >300 lines or >7 methods, it's likely doing too much. Extract responsibilities.</li>
<li><strong>Limit method complexity</strong> — Cyclomatic complexity > 10 = needs refactoring. Cognitive complexity > 15 = definitely needs refactoring.</li>
<li><strong>Code ownership matters</strong> — Code with clear ownership (one team) gets maintained. Code nobody owns ("shared kernel") rots. Assign ownership to every module.</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>Premature abstraction</strong> — Creating interfaces/factories/strategies for code that has ONE implementation. Abstraction has a cost (indirection). Wait until you have 2+ implementations before abstracting.</li>
<li><strong>Measuring coverage without measuring quality</strong> — 90% test coverage but tests only assert "no exception thrown." Coverage without meaningful assertions is false confidence.</li>
<li><strong>Big-bang refactoring</strong> — Stopping feature work for 3 months to "rewrite the module." This fails. Prefer incremental improvements behind feature flags.</li>
<li><strong>Treating all debt equally</strong> — Not all debt needs fixing. Debt in stable, rarely-changed code has low interest. Debt in frequently-changed code is expensive. Prioritize by impact.</li>
<li><strong>Utils/Helpers/Common classes</strong> — These are "junk drawer" classes with no cohesion. Every "Utils" class eventually becomes 2000 lines of unrelated methods. Split into focused modules.</li>
<li><strong>Ignoring dependency direction</strong> — Domain/business logic depending on infrastructure (database, HTTP). Inverts the dependency rule. Domain should depend on abstractions; infrastructure depends on domain.</li>
<li><strong>No architecture tests</strong> — You define architectural rules (layers, naming, dependencies) but never enforce them. Without ArchUnit/NDepend rules in CI, architecture erodes within months.</li>
</ul>`
        },
        {
            title: 'Real-World Applications',
            content: `<ul>
<li><strong>Legacy system modernization</strong> — Team uses NDepend to identify the 20 classes with highest coupling. These become the Strangler Fig extraction targets. Measuring coupling BEFORE refactoring prevents wasted effort on low-impact areas.</li>
<li><strong>Pull request quality gates</strong> — SonarQube runs on every PR. If new code introduces cognitive complexity > 15 or reduces coverage below 80%, PR is blocked. Teams learn quality standards through fast feedback.</li>
<li><strong>Tech debt sprint allocation</strong> — Team allocates 20% of each sprint to debt items from the "tech debt backlog." Items are prioritized by: (complexity of file) × (churn rate of file). Highest-value fixes first.</li>
<li><strong>Architecture fitness functions</strong> — NDepend rules in CI enforce: "Domain layer must not reference Infrastructure namespace." "No class exceeds 500 lines." "No circular dependencies between assemblies." Architecture stays clean automatically.</li>
<li><strong>Hotspot analysis</strong> — Git log analysis + complexity metrics identify the 5 files that change most often AND have highest complexity. These files get 80% of bugs. Refactoring them reduces bug rate for the whole system.</li>
</ul>`
        },
        {
            title: 'Interview Tips',
            content: `<p>Maintainability questions are universal — asked at every company, every level:</p>`,
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>Practical experience with metrics</strong> — Can you name specific metrics (cyclomatic complexity, coupling) and tools (SonarQube, NDepend)? Or do you just say "clean code"?</li>
<li><strong>Trade-off thinking</strong> — You know that NOT all debt needs fixing. You prioritize by business impact, not perfectionism.</li>
<li><strong>Coupling/cohesion fluency</strong> — Can you spot coupling in a code example? Can you explain WHY high coupling is bad in concrete terms (ripple effects, test difficulty)?</li>
<li><strong>Incremental improvement</strong> — You don't propose "rewrite everything." You describe Boy Scout Rule, incremental refactoring, and measurable progress.</li>
<li><strong>Team-level thinking</strong> — Maintainability is a TEAM property. You talk about code review standards, quality gates, architecture tests, and knowledge sharing.</li>
</ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li>Maintainability = low coupling + high cohesion + low complexity + managed tech debt</li>
<li>Cyclomatic complexity > 10 per method = needs refactoring. Cognitive complexity > 15 = urgent.</li>
<li>Technical debt is a business decision: take it deliberately, track it, and pay it back strategically</li>
<li>Static analysis in CI (SonarQube quality gates) prevents quality regression automatically</li>
<li>Focus refactoring on hotspots: high complexity × high churn = highest bug risk</li>
<li>Coupling types range from content (worst) to message (best) — aim for data or message coupling</li>
<li>Cohesion types range from coincidental (worst) to functional (best) — every class should have functional cohesion</li>
<li>Code ownership is essential: unowned code rots. Every module needs a responsible team.</li>
<li>Architecture fitness functions (automated tests of architectural rules) prevent erosion over time</li>
</ul>`
        }
    ],
    questions: [
        {
            id: 'maint-q1',
            level: 'junior',
            title: 'What is coupling and cohesion? Why do we want low coupling and high cohesion?',
            answer: `<p><strong>Coupling</strong> is how much one module depends on another. <strong>Cohesion</strong> is how well the elements within a module relate to each other.</p>
<p><strong>Low coupling</strong> means modules are independent — you can change one without breaking others. If class A directly uses 10 methods from class B, they are tightly coupled. Changing B's interface forces changes in A.</p>
<p><strong>High cohesion</strong> means a module does ONE thing well. All its methods and properties serve a single purpose. A "UserService" that handles authentication, email sending, and PDF generation has LOW cohesion — it does three unrelated things.</p>
<p><strong>Why it matters:</strong></p>
<ul>
<li><strong>Testability:</strong> Low coupling means you can test a class in isolation (mock its dependencies). High coupling means testing one class requires 10 others to be real.</li>
<li><strong>Change isolation:</strong> If I need to change the email provider, I should only change the email module — not the order module, the user module, and the payment module.</li>
<li><strong>Readability:</strong> High cohesion means when you open a file, you know what it does. It's not 2000 lines of unrelated methods.</li>
</ul>
<p><strong>Practical indicator:</strong> If you change one file and 15 tests break in other modules, coupling is too high.</p>`
        },
        {
            id: 'maint-q2',
            level: 'junior',
            title: 'What is cyclomatic complexity and what is a good target number?',
            answer: `<p><strong>Cyclomatic complexity</strong> measures the number of independent paths through a method. Each decision point (if, else, case, &&, ||, catch, for, while) adds 1 to the count.</p>
<p><strong>Targets:</strong></p>
<ul>
<li><strong>1-5:</strong> Simple, easy to test and understand. Ideal.</li>
<li><strong>6-10:</strong> Moderate. Acceptable for business logic. Consider refactoring if trending upward.</li>
<li><strong>11-20:</strong> Complex. Hard to test (many paths). Should be refactored.</li>
<li><strong>21+:</strong> Very high risk. Untestable, likely buggy. Must be refactored immediately.</li>
</ul>
<p><strong>Why it matters for testing:</strong> A method with cyclomatic complexity of 15 has 15 independent paths. To fully test it, you need at MINIMUM 15 test cases. In practice, combinations make it even more. Low complexity = fewer tests needed = higher confidence = fewer bugs.</p>
<p><strong>Modern alternative:</strong> Cognitive Complexity (used by SonarQube) is better because it also penalizes NESTING. A deeply nested if-else-if scores higher than a flat switch statement, even if they have the same cyclomatic complexity.</p>`
        },
        {
            id: 'maint-q3',
            level: 'mid',
            title: 'What is technical debt? How do you decide which debt to pay off and which to leave?',
            answer: `<p><strong>Technical debt</strong> is the implied cost of future rework caused by choosing a quick solution over a better but more time-consuming approach. Like financial debt, it accrues "interest" — the longer it exists, the more expensive it becomes to fix.</p>
<p><strong>Not all imperfect code is debt.</strong> Debt requires:</p>
<ul>
<li>A deliberate or discovered trade-off (you KNOW there's a better way)</li>
<li>An ongoing "interest payment" (it makes future changes harder/slower/riskier)</li>
</ul>
<p><strong>Prioritization framework:</strong></p>
<ol>
<li><strong>Impact:</strong> Does this debt slow down current work? (High churn area = high impact)</li>
<li><strong>Risk:</strong> Could this debt cause production incidents? (Missing error handling, race conditions)</li>
<li><strong>Cost to fix:</strong> How much effort to remediate? (1 hour vs 2 sprints)</li>
<li><strong>Interest rate:</strong> Is it getting worse over time? (Code other teams copy as a pattern)</li>
</ol>
<p><strong>Decision matrix:</strong></p>
<ul>
<li><strong>Fix immediately:</strong> High impact + low cost (missing null check in hot path)</li>
<li><strong>Schedule this sprint:</strong> High impact + moderate cost (extract shared logic from 3 copypaste locations)</li>
<li><strong>Backlog for next quarter:</strong> Low impact + high cost (migrate from old ORM to new one)</li>
<li><strong>Accept and move on:</strong> Low impact + low interest (slightly ugly code in a stable, rarely-changed module)</li>
</ul>
<p><strong>Rule of thumb:</strong> Allocate 15-20% of sprint capacity to debt reduction. Focus on items that unblock current feature work.</p>`
        },
        {
            id: 'maint-q4',
            level: 'mid',
            title: 'How would you set up static analysis quality gates in a CI/CD pipeline?',
            answer: `<p><strong>A quality gate is a set of conditions that new code must meet before it can be merged/deployed.</strong></p>
<p><strong>Implementation with SonarQube (most common):</strong></p>
<ol>
<li><strong>Configure SonarQube server</strong> (or use SonarCloud for SaaS)</li>
<li><strong>Add scanner to CI pipeline:</strong></li>
</ol>
<pre><code># In CI pipeline (GitLab CI example):
sonar-analysis:
  script:
    - dotnet sonarscanner begin /k:"my-project" /d:sonar.host.url="$SONAR_URL"
    - dotnet build
    - dotnet test --collect:"XPlat Code Coverage"
    - dotnet sonarscanner end
  allow_failure: false  # Blocks pipeline if quality gate fails</code></pre>
<ol start="3">
<li><strong>Define Quality Gate conditions:</strong>
<ul>
<li>No new bugs (severity: critical or blocker)</li>
<li>No new security vulnerabilities</li>
<li>Code coverage on new code > 80%</li>
<li>Duplication on new code < 3%</li>
<li>Cognitive complexity of new methods < 15</li>
</ul></li>
<li><strong>PR decoration:</strong> SonarQube comments on the PR with findings, making issues visible before review.</li>
</ol>
<p><strong>Key principle:</strong> Quality gate applies to NEW code only (not existing legacy code). This prevents "fix the world" situations and ensures quality improves incrementally with every PR.</p>
<p><strong>Complementary gates:</strong> Roslyn analyzers (compile-time, instant feedback), Architecture tests (NDepend/ArchUnitNET), test coverage reports (Coverlet/ReportGenerator).</p>`
        },
        {
            id: 'maint-q5',
            level: 'mid',
            title: 'Explain the difference between afferent coupling (Ca) and efferent coupling (Ce). What is instability?',
            answer: `<p><strong>Afferent Coupling (Ca):</strong> The number of OTHER modules that depend on THIS module. "Who depends on me?"</p>
<p><strong>Efferent Coupling (Ce):</strong> The number of modules THIS module depends on. "Who do I depend on?"</p>
<p><strong>Instability = Ce / (Ca + Ce)</strong> — ranges from 0 (maximally stable) to 1 (maximally unstable).</p>
<ul>
<li><strong>I = 0 (stable):</strong> Many dependents (high Ca), few dependencies (low Ce). Hard to change because changing it breaks many consumers. Domain model, shared interfaces → should be stable.</li>
<li><strong>I = 1 (unstable):</strong> Few dependents (low Ca), many dependencies (high Ce). Easy to change without breaking anything. Application layer, UI → can be unstable (changes often).</li>
</ul>
<p><strong>The Stable Dependencies Principle:</strong> Depend in the direction of stability. Unstable modules should depend on stable modules, not the other way around.</p>
<p><strong>Violation example:</strong> If your Domain layer (should be stable, I≈0) depends on your Infrastructure layer (should be unstable, I≈1), you've inverted the dependency. Changes to infrastructure force changes to domain — exactly wrong.</p>
<p><strong>Practical use:</strong> Tools like NDepend visualize instability. If a module has I=0.1 (very stable) but you keep needing to change it, something is wrong — either it needs to be split, or its dependents need to depend on an abstraction instead.</p>`
        },
        {
            id: 'maint-q6',
            level: 'senior',
            title: 'How do you identify and prioritize the most impactful refactoring targets in a large legacy codebase?',
            answer: `<p><strong>Use the "Hotspot Analysis" technique — combining code metrics with version control history:</strong></p>
<p><strong>Step 1: Identify complexity hotspots</strong></p>
<ul>
<li>Run static analysis (SonarQube/NDepend) to find files with highest cyclomatic/cognitive complexity</li>
<li>Export the top 50 most complex files</li>
</ul>
<p><strong>Step 2: Identify churn hotspots</strong></p>
<ul>
<li>Run git log analysis: <code>git log --format=format: --name-only | sort | uniq -c | sort -rn</code></li>
<li>Find the 50 files changed most frequently in the last 6 months</li>
</ul>
<p><strong>Step 3: Cross-reference (the magic)</strong></p>
<ul>
<li>Files that appear in BOTH lists — high complexity AND high churn — are your targets</li>
<li>These are the files where developers spend the most time, make the most mistakes, and where refactoring has the highest ROI</li>
</ul>
<p><strong>Step 4: Prioritize by business value</strong></p>
<ul>
<li>Of the hotspots, which ones are on critical business paths? (checkout, payments, authentication)</li>
<li>Which ones have the most bugs filed against them?</li>
<li>Which ones block feature work most often?</li>
</ul>
<p><strong>Step 5: Plan incremental refactoring</strong></p>
<ul>
<li>Don't rewrite. Extract one responsibility at a time.</li>
<li>Write characterization tests first (capture existing behavior)</li>
<li>Refactor behind feature flags if risky</li>
<li>Measure: complexity should drop, churn pattern should change (fewer bug-fix commits)</li>
</ul>
<p><strong>Tools:</strong> CodeScene (SaaS) does this automatically. Alternatively: NDepend + custom git scripts + SonarQube for the data, then manual analysis.</p>`
        },
        {
            id: 'maint-q7',
            level: 'senior',
            title: 'How do you prevent architecture erosion over time? What are architecture fitness functions?',
            answer: `<p><strong>Architecture erosion</strong> is the gradual degradation of architectural rules as developers take shortcuts. "Infrastructure should never reference Domain" gets violated once, then copied, then becomes the norm.</p>
<p><strong>Prevention: Architecture Fitness Functions</strong> — automated tests that verify architectural rules in CI:</p>
<pre><code>// Using ArchUnitNET (.NET architecture testing)
[Fact]
public void Domain_Should_Not_Depend_On_Infrastructure()
{
    var domain = Types().That().ResideInNamespace("MyApp.Domain");
    var infra = Types().That().ResideInNamespace("MyApp.Infrastructure");
    
    domain.Should().NotDependOnAny(infra)
          .Check(Architecture);
}

[Fact]
public void Controllers_Should_Not_Directly_Access_Repositories()
{
    var controllers = Types().That().HaveNameEndingWith("Controller");
    var repos = Types().That().ImplementInterface(typeof(IRepository<>));
    
    controllers.Should().NotDependOnAny(repos)
               .Check(Architecture);
}

[Fact]
public void No_Circular_Dependencies_Between_Modules()
{
    var slices = SlicesOf(Types())
        .MatchingNamespace("MyApp.(*)..");
    
    slices.Should().BeFreeOfCycles()
          .Check(Architecture);
}</code></pre>
<p><strong>Other erosion prevention techniques:</strong></p>
<ul>
<li><strong>NDepend CQLinq rules:</strong> Custom queries like "WARN if class has more than 7 dependencies" — runs in CI</li>
<li><strong>Module boundaries via access modifiers:</strong> Use <code>internal</code> aggressively. Only expose what's part of the module's public API.</li>
<li><strong>PR review checklist:</strong> "Does this change cross module boundaries? If yes, discuss in architecture review."</li>
<li><strong>ADRs (Architecture Decision Records):</strong> Document WHY rules exist. When someone wants to violate a rule, they must first understand and counter the reasoning.</li>
</ul>`
        },
        {
            id: 'maint-q8',
            level: 'senior',
            title: 'What is the Maintainability Index and what are its limitations?',
            answer: `<p><strong>Maintainability Index (MI)</strong> is a composite metric calculated from:</p>
<ul>
<li>Halstead Volume (code complexity based on operators/operands)</li>
<li>Cyclomatic Complexity</li>
<li>Lines of Code</li>
<li>Optionally: percentage of comment lines</li>
</ul>
<p><strong>Formula:</strong> MI = MAX(0, (171 - 5.2 * ln(HV) - 0.23 * CC - 16.2 * ln(LOC)) * 100 / 171)</p>
<p><strong>Interpretation:</strong></p>
<ul>
<li><strong>80-100:</strong> High maintainability (green)</li>
<li><strong>60-79:</strong> Moderate maintainability (yellow)</li>
<li><strong>0-59:</strong> Low maintainability (red) — urgent attention needed</li>
</ul>
<p><strong>Limitations:</strong></p>
<ul>
<li><strong>Doesn't measure coupling:</strong> A class can have MI=85 but be tightly coupled to 20 other classes. Changing it is still risky.</li>
<li><strong>Doesn't measure domain appropriateness:</strong> Well-structured code that solves the wrong problem has high MI but low value.</li>
<li><strong>Comments inflate the score:</strong> Some formulas include comment density — adding pointless comments raises MI without improving readability.</li>
<li><strong>Doesn't capture architectural issues:</strong> Circular dependencies, god objects, wrong abstractions — none visible in MI.</li>
<li><strong>Averaged over a module:</strong> One simple class and one horrible class average to "moderate" — hiding the problem.</li>
</ul>
<p><strong>Better approach:</strong> Use MI as a screening tool (flag modules below 60 for investigation), but combine with coupling metrics, cognitive complexity, and churn analysis for the full picture.</p>`
        },
        {
            id: 'maint-q9',
            level: 'lead',
            title: 'How do you build a culture of code quality in a team that currently has low standards?',
            answer: `<p><strong>Culture change requires both technical tools AND human approaches:</strong></p>
<p><strong>Phase 1: Establish baseline (Week 1-2)</strong></p>
<ul>
<li>Run SonarQube on the codebase. Share the results (non-judgmentally) with the team.</li>
<li>Show the metrics: "We have 2,400 code smells, 85% duplication in modules X and Y, average complexity of 18."</li>
<li>Frame it as "where we are" not "how bad you are." Historical context matters.</li>
</ul>
<p><strong>Phase 2: Set the new standard for NEW code only (Week 3-4)</strong></p>
<ul>
<li>Quality gate: new PRs must not introduce new smells, must have >80% coverage on new code</li>
<li>Roslyn analyzers enabled in the IDE — developers see issues instantly, before PR</li>
<li>"Don't make it worse" is an achievable first goal. "Fix everything" is not.</li>
</ul>
<p><strong>Phase 3: Lead by example (ongoing)</strong></p>
<ul>
<li>Senior devs refactor one hotspot per sprint (visible, celebrated improvements)</li>
<li>Code review feedback is educational, not punitive: "Here's WHY this pattern creates coupling problems..."</li>
<li>Pair programming on complex changes — knowledge transfer through collaboration</li>
</ul>
<p><strong>Phase 4: Make it visible and rewarding</strong></p>
<ul>
<li>SonarQube dashboard on team monitor: watch the numbers improve over weeks</li>
<li>Celebrate milestones: "We reduced critical smells from 200 to 50 this quarter!"</li>
<li>Track developer velocity: show that quality investment speeds up feature delivery (fewer bugs, less rework)</li>
</ul>
<p><strong>Key insight:</strong> Never blame individuals for existing debt. The debt was created by the SYSTEM (deadlines, missing tools, no standards). Fix the system.</p>`
        },
        {
            id: 'maint-q10',
            level: 'architect',
            title: 'How do you measure and communicate the business value of investing in maintainability to non-technical stakeholders?',
            answer: `<p><strong>The business case for maintainability must be in BUSINESS language:</strong></p>
<p><strong>Metrics that resonate with stakeholders:</strong></p>
<ul>
<li><strong>Lead time for changes:</strong> "It takes us 3 weeks to add a payment method because of coupling in the payment module. After refactoring, it will take 3 days." Translate to: time-to-market advantage.</li>
<li><strong>Bug escape rate:</strong> "Module X produces 40% of production bugs. It has the highest complexity. Investing 2 sprints in refactoring it will reduce our bug rate by ~30%." Translate to: customer satisfaction + support cost reduction.</li>
<li><strong>Developer productivity:</strong> "New developers take 3 months to become productive because the codebase is hard to understand. With better structure, onboarding drops to 3 weeks." Translate to: hiring ROI.</li>
<li><strong>Incident frequency:</strong> "80% of our P1 incidents originate in 5 legacy modules. Modernizing them reduces incident cost (MTTR × engineering cost × customer impact)."</li>
</ul>
<p><strong>Communication framework:</strong></p>
<ol>
<li><strong>Show the cost of inaction:</strong> "If we do nothing, every feature will take 20% longer next year due to accumulating complexity."</li>
<li><strong>Show the ROI of investment:</strong> "2 sprints of refactoring saves 1 sprint per quarter in reduced bug fixes and faster feature delivery."</li>
<li><strong>Make it concrete:</strong> Never say "improve code quality." Say "reduce checkout page bug rate from 4/month to 1/month by restructuring the order processing module."</li>
<li><strong>Show progress:</strong> Monthly report: "Lead time improved from 14 days to 9 days. Bug rate down 25%. Zero P1 incidents this month."</li>
</ol>
<p><strong>The formula that works:</strong> Cost of debt = (time lost per sprint) × (developer cost) × (number of sprints until addressed). This gives a dollar figure stakeholders understand.</p>`
        }
    ]
});
