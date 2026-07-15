/* ═══════════════════════════════════════════════════════════════════
   REFACTORING TECHNIQUES — Level 3: Engineering Principles
   Code smells, refactoring catalog, safe refactoring with tests,
   and the discipline of continuous improvement.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('refactoring-techniques', {

    title: 'Refactoring Techniques',
    level: 3,
    group: 'clean-code',
    description: 'Identifying code smells, applying the refactoring catalog (extract, rename, inline, replace conditional), refactoring safely with tests, and the Strangler Fig for large-scale change.',
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    prerequisites: ['clean-code-naming', 'arch-principles'],

    sections: [

        // ─── 1. INTRODUCTION ──────────────────────────────────────────
        {
            title: 'Introduction',
            content: `<p><strong>Refactoring</strong> is the disciplined process of restructuring existing code without
            changing its external behavior. The goal is to improve internal quality — readability,
            maintainability, structure — while keeping the code working exactly as before.</p>
            <p>The key constraint: <strong>behavior must not change</strong>. Refactoring is not rewriting,
            not adding features, and not fixing bugs. It is improving the design of code that already works,
            verified by tests at every step.</p>
            <p>In this module, you will learn:</p>
            <ul>
                <li>What code smells are and how to recognize them</li>
                <li>The core refactoring catalog (Fowler's named refactorings)</li>
                <li>How to refactor safely using tests as a safety net</li>
                <li>Small steps: the rhythm of refactoring</li>
                <li>When to refactor and when to leave code alone</li>
                <li>Large-scale refactoring with the Strangler Fig pattern</li>
            </ul>`
        },

        // ─── 2. CORE CONCEPTS ─────────────────────────────────────────
        {
            title: 'Core Concepts',
            content: `<p>The foundational ideas behind refactoring:</p>
            <h4>Code Smells</h4>
            <p>A code smell is a surface symptom that usually corresponds to a deeper problem. Smells don't
            always mean something is wrong, but they warrant investigation. Common smells:</p>
            <ul>
                <li><strong>Long Method:</strong> a function that does too much</li>
                <li><strong>Large Class:</strong> a class with too many responsibilities (God Object)</li>
                <li><strong>Duplicated Code:</strong> the same logic in multiple places</li>
                <li><strong>Long Parameter List:</strong> too many arguments</li>
                <li><strong>Feature Envy:</strong> a method more interested in another class's data than its own</li>
                <li><strong>Primitive Obsession:</strong> using primitives instead of small domain objects</li>
                <li><strong>Shotgun Surgery:</strong> one change requires edits in many places</li>
            </ul>
            <h4>Behavior Preservation</h4>
            <p>The defining rule: refactoring must not change what the code does, only how it is structured.
            Tests verify this. If tests pass before and after, behavior is preserved.</p>
            <h4>Small Steps</h4>
            <p>Refactor in tiny, reversible steps, running tests after each. This keeps the code always
            working and makes it easy to pinpoint any break. Never refactor in one giant edit.</p>
            <h4>The Two Hats</h4>
            <p>Kent Beck's metaphor: when programming, you wear either the "adding feature" hat or the
            "refactoring" hat — never both at once. Separate the activities to keep changes clear.</p>`,
            mermaid: `graph TB
    Smell[Detect Code Smell] --> Tests{Tests exist?}
    Tests -->|No| Write[Write characterization tests first]
    Write --> Refactor
    Tests -->|Yes| Refactor[Apply small refactoring]
    Refactor --> Run[Run tests]
    Run -->|Pass| Commit[Commit small step]
    Run -->|Fail| Revert[Revert / fix]
    Revert --> Refactor
    Commit --> More{More smells?}
    More -->|Yes| Refactor
    More -->|No| Done[Done — behavior preserved]`
        },

        // ─── 3. HOW IT WORKS ──────────────────────────────────────────
        {
            title: 'How It Works',
            content: `<p>The refactoring workflow, step by step:</p>
            <ol>
                <li><strong>Ensure test coverage:</strong> Before refactoring, make sure tests cover the code's
                current behavior. If none exist, write "characterization tests" that capture what the code
                currently does (even if it's buggy)</li>
                <li><strong>Identify the smell:</strong> Name the specific problem (long method, duplication, etc.)</li>
                <li><strong>Choose a refactoring:</strong> Pick the named technique that addresses it
                (Extract Method, Replace Conditional with Polymorphism, etc.)</li>
                <li><strong>Apply in small steps:</strong> Make one tiny change. Many IDEs automate refactorings
                (Extract Method, Rename) safely</li>
                <li><strong>Run tests:</strong> Verify behavior is unchanged after each step</li>
                <li><strong>Commit:</strong> Commit each successful step so you can always roll back</li>
                <li><strong>Repeat:</strong> Continue until the smell is resolved</li>
            </ol>`,
            code: `// Refactoring: Extract Method + Replace Temp with Query
// BEFORE — long method with inline calculation and a comment-marked section
public string GenerateInvoice(Order order)
{
    decimal total = 0;
    foreach (var item in order.Items)
        total += item.Price * item.Quantity;

    // apply discount
    if (total > 1000)
        total = total * 0.9m;

    // build output
    var sb = new StringBuilder();
    sb.AppendLine($"Invoice for {order.CustomerName}");
    sb.AppendLine($"Total: {total:C}");
    return sb.ToString();
}

// AFTER — extracted, named methods; each does one thing
public string GenerateInvoice(Order order)
{
    var total = CalculateDiscountedTotal(order);
    return FormatInvoice(order.CustomerName, total);
}

private decimal CalculateDiscountedTotal(Order order)
{
    var subtotal = order.Items.Sum(item => item.Price * item.Quantity);
    return subtotal > LargeOrderThreshold ? subtotal * LargeOrderDiscount : subtotal;
}

private string FormatInvoice(string customerName, decimal total)
{
    var sb = new StringBuilder();
    sb.AppendLine($"Invoice for {customerName}");
    sb.AppendLine($"Total: {total:C}");
    return sb.ToString();
}

private const decimal LargeOrderThreshold = 1000m;
private const decimal LargeOrderDiscount = 0.9m;`,
            language: 'csharp'
        },

        // ─── 4. VISUAL DIAGRAM ────────────────────────────────────────
        {
            title: 'Refactoring Catalog Map',
            content: `<p>The most common refactorings grouped by the problem they solve:</p>`,
            mermaid: `mindmap
  root((Refactoring Catalog))
    Composing Methods
      Extract Method
      Inline Method
      Replace Temp with Query
      Extract Variable
    Moving Features
      Move Method
      Move Field
      Extract Class
      Inline Class
    Organizing Data
      Replace Primitive with Object
      Replace Magic Number with Constant
      Encapsulate Field
    Simplifying Conditionals
      Decompose Conditional
      Replace Conditional with Polymorphism
      Introduce Guard Clauses
      Replace Nested Conditional
    Simplifying Calls
      Rename Method
      Introduce Parameter Object
      Remove Flag Argument
      Preserve Whole Object`
        },

        // ─── 5. IMPLEMENTATION ────────────────────────────────────────
        {
            title: 'Implementation',
            content: `<p>Concrete examples of high-value refactorings:</p>`,
            tabs: [
                {
                    label: 'Guard Clauses',
                    code: `// Replace nested conditionals with guard clauses (early returns)

// BEFORE — arrow code, hard to follow the happy path
public decimal CalculatePay(Employee employee)
{
    decimal result;
    if (employee != null)
    {
        if (employee.IsActive)
        {
            if (!employee.IsSuspended)
            {
                result = employee.BaseSalary + employee.Bonus;
            }
            else { result = 0; }
        }
        else { result = 0; }
    }
    else { result = 0; }
    return result;
}

// AFTER — guard clauses handle edge cases first, happy path is flat
public decimal CalculatePay(Employee employee)
{
    if (employee == null) return 0;
    if (!employee.IsActive) return 0;
    if (employee.IsSuspended) return 0;

    return employee.BaseSalary + employee.Bonus;
}`,
                    language: 'csharp'
                },
                {
                    label: 'Replace Conditional w/ Polymorphism',
                    code: `// BEFORE — switch on type, repeated everywhere this logic is needed
public decimal CalculateShipping(Parcel parcel)
{
    switch (parcel.Type)
    {
        case "Standard": return parcel.Weight * 1.0m;
        case "Express":  return parcel.Weight * 2.5m + 10m;
        case "Overnight":return parcel.Weight * 4.0m + 25m;
        default: throw new ArgumentException("Unknown type");
    }
}

// AFTER — polymorphism; each type owns its behavior, open for extension
public abstract class ShippingMethod
{
    public abstract decimal CalculateCost(decimal weight);
}

public class StandardShipping : ShippingMethod
{
    public override decimal CalculateCost(decimal weight) => weight * 1.0m;
}

public class ExpressShipping : ShippingMethod
{
    public override decimal CalculateCost(decimal weight) => weight * 2.5m + 10m;
}

public class OvernightShipping : ShippingMethod
{
    public override decimal CalculateCost(decimal weight) => weight * 4.0m + 25m;
}
// Adding a new shipping type = new class, no switch to modify (Open/Closed)`,
                    language: 'csharp'
                },
                {
                    label: 'Introduce Parameter Object',
                    code: `// BEFORE — long parameter list, easy to mix up argument order
public Reservation BookRoom(
    string guestName, string guestEmail, string guestPhone,
    DateTime checkIn, DateTime checkOut, int adults, int children,
    string roomType, bool breakfast, bool parking)
{
    // ...
}

// AFTER — group related parameters into cohesive objects
public record GuestDetails(string Name, string Email, string Phone);
public record StayDetails(DateTime CheckIn, DateTime CheckOut, int Adults, int Children);
public record RoomPreferences(string RoomType, bool Breakfast, bool Parking);

public Reservation BookRoom(
    GuestDetails guest, StayDetails stay, RoomPreferences preferences)
{
    // Clearer, harder to misorder, and the objects can carry validation
}`,
                    language: 'csharp'
                },
                {
                    label: 'Characterization Test',
                    code: `// When refactoring legacy code WITHOUT tests, first capture current behavior.
// A characterization test documents what the code DOES (not what it should do).

[Fact]
public void LegacyPricer_CharacterizesCurrentBehavior()
{
    var pricer = new LegacyPricer();

    // We don't know if these outputs are "correct" — we capture what IS.
    // This locks current behavior so refactoring can't silently change it.
    Assert.Equal(95.00m, pricer.Price(qty: 10, unit: 10m));   // observed output
    Assert.Equal(0m, pricer.Price(qty: 0, unit: 10m));        // observed edge
    Assert.Equal(450m, pricer.Price(qty: 50, unit: 10m));     // observed bulk

    // If a value looks like a bug, note it — but DON'T fix it during refactor.
    // First preserve behavior, refactor structure, THEN fix bugs separately.
}

// With this safety net, you can now safely Extract Method, rename, and
// restructure LegacyPricer, re-running this test after every step.`,
                    language: 'csharp'
                }
            ]
        },

        // ─── 6. BEST PRACTICES ────────────────────────────────────────
        {
            title: 'Best Practices',
            content: `<h4>Do: Refactor Under Green Tests</h4>
            <p>Only refactor when tests are passing. Tests are your proof that behavior is preserved.
            Run them after every small step.</p>
            <h4>Do: Take Small, Reversible Steps</h4>
            <p>Make one tiny change, run tests, commit. If something breaks, you lose seconds of work,
            not hours. Small steps also make code review easier.</p>
            <h4>Do: Use the Boy Scout Rule</h4>
            <p>Leave code a little cleaner than you found it. Small, continuous improvements during
            feature work prevent the need for big risky rewrites later.</p>
            <h4>Do: Separate Refactoring from Feature Commits</h4>
            <p>Keep refactoring commits separate from behavior-changing commits. A reviewer can verify
            "this commit only restructures, no behavior change" at a glance. Mixing them hides risk.</p>
            <h4>Do: Lean on Automated Refactorings</h4>
            <p>IDE refactorings (Rename, Extract Method, Change Signature) are mechanically safe and
            update all references. Prefer them over manual edits for common operations.</p>`,
            callout: {
                type: 'tip',
                title: 'Red-Green-Refactor',
                text: 'In TDD, refactoring is the third step: write a failing test (Red), make it pass simply (Green), then improve the design (Refactor) while keeping tests green. Refactoring is built into the rhythm, not deferred to a separate "cleanup phase" that never happens.'
            }
        },

        // ─── 7. COMMON MISTAKES ───────────────────────────────────────
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Refactoring Without Tests</h4>
            <p>Restructuring code with no test safety net is gambling. You cannot know if you changed
            behavior. Write characterization tests first if none exist.</p>
            <h4>Mistake: Mixing Refactoring with Feature Changes</h4>
            <p>Changing behavior and structure in the same commit makes it impossible to tell what
            caused a regression. Wear one hat at a time; keep the commits separate.</p>
            <h4>Mistake: The Big Rewrite</h4>
            <p>"This is too messy, let's rewrite it from scratch" is usually a trap. Rewrites lose hard-won
            edge-case knowledge embedded in the old code, take far longer than estimated, and ship with
            new bugs. Prefer incremental refactoring (Strangler Fig).</p>
            <h4>Mistake: Refactoring for Its Own Sake</h4>
            <p>Gold-plating code that rarely changes and works fine wastes time and adds risk. Refactor
            code you're about to change or that changes often — not stable code nobody touches.</p>
            <h4>Mistake: Giant Refactoring Steps</h4>
            <p>Refactoring everything in one massive edit, then finding tests fail with no idea which
            change broke them. Take small steps and run tests between each.</p>
            <h4>Mistake: Over-Abstracting</h4>
            <p>Introducing interfaces, factories, and layers "for flexibility" that never materializes.
            This is the opposite smell — needless complexity. Refactor toward simplicity, not abstraction
            for its own sake.</p>`,
            code: `// MISTAKE: refactoring + behavior change in one commit
// Reviewer can't tell: was the bug introduced by the rename, the
// extracted method, or the changed discount logic?
public decimal Total(Order o) {
    var sub = o.Items.Sum(i => i.Price * i.Qty);  // extracted (refactor)
    return sub > 1000 ? sub * 0.85m : sub;          // changed 0.9 → 0.85 (behavior!)
}

// CORRECT: two separate commits
// Commit 1 (refactor only): extract sum, NO behavior change (still 0.9m)
// Commit 2 (behavior change): adjust discount 0.9m → 0.85m, with test update
// Now a regression is traceable to exactly one commit.`,
            language: 'csharp'
        },

        // ─── 8. REAL-WORLD APPLICATIONS ───────────────────────────────
        {
            title: 'Real-World Applications',
            content: `<p>How refactoring plays out in production engineering:</p>
            <h4>Legacy System Modernization</h4>
            <p>Teams inheriting decades-old codebases use characterization tests + incremental refactoring
            to make the code safe to change before adding features. Michael Feathers' "Working Effectively
            with Legacy Code" is the canonical playbook.</p>
            <h4>Strangler Fig Migrations</h4>
            <p>Large rewrites (monolith → microservices, framework upgrades) succeed by gradually routing
            functionality to new code while the old system runs, until the old system is "strangled" and
            removed. Avoids the big-bang rewrite trap.</p>
            <h4>Continuous Refactoring in Agile</h4>
            <p>High-performing teams refactor continuously as part of every story (Boy Scout Rule), keeping
            technical debt low. This sustains velocity — debt-laden codebases slow to a crawl over time.</p>
            <h4>Pre-Feature Cleanup</h4>
            <p>Before adding a feature to messy code, engineers first refactor to make the change easy,
            then make the easy change. Kent Beck: "Make the change easy, then make the easy change."</p>
            <h4>Performance Refactoring</h4>
            <p>After profiling reveals a hotspot, refactoring the structure (caching, removing duplication,
            better algorithms) improves performance while tests guarantee correctness is preserved.</p>`
        },

        // ─── 9. COMPARISON ────────────────────────────────────────────
        {
            title: 'Comparison',
            content: `<p>Refactoring vs related activities it is often confused with:</p>`,
            table: {
                headers: ['Aspect', 'Refactoring', 'Rewriting', 'Bug Fixing', 'Feature Work'],
                rows: [
                    ['Changes behavior?', 'No', 'Yes (re-implements)', 'Yes (corrects)', 'Yes (adds)'],
                    ['Changes structure?', 'Yes', 'Yes', 'Sometimes', 'Sometimes'],
                    ['Risk level', 'Low (small steps)', 'High (big bang)', 'Medium', 'Medium'],
                    ['Test role', 'Safety net (must pass)', 'Re-written too', 'Add failing test first', 'Add new tests'],
                    ['Reversibility', 'High', 'Low', 'Medium', 'Medium'],
                    ['Commit hygiene', 'Separate commits', 'Separate branch', 'Separate commit', 'Separate commit'],
                    ['When to choose', 'Improve working code', 'Last resort', 'Defect reported', 'New requirement']
                ]
            }
        },

        // ─── 10. PERFORMANCE ──────────────────────────────────────────
        {
            title: 'Performance',
            content: `<p>Refactoring and performance interact in important ways:</p>
            <h4>Refactor First, Then Optimize</h4>
            <p>Clean, well-structured code is easier to profile and optimize. Trying to optimize tangled
            code often makes it worse. Refactor for clarity first, measure, then optimize the proven hotspots.</p>
            <h4>Refactoring Rarely Hurts Performance</h4>
            <p>Most refactorings (extract method, rename) have negligible runtime cost — modern compilers
            inline small methods. The clarity gained almost always outweighs micro-overhead.</p>
            <h4>When Refactoring Helps Performance</h4>
            <ul>
                <li>Removing duplicated expensive computations (Replace Temp with Query + caching)</li>
                <li>Replacing nested loops with better data structures revealed during cleanup</li>
                <li>Making code clear enough that real bottlenecks become visible</li>
            </ul>
            <h4>The Measurement Rule</h4>
            <p>Never assume a refactoring helped or hurt performance — measure with a profiler and
            benchmarks. Intuition about performance is frequently wrong.</p>`,
            callout: {
                type: 'warning',
                title: 'Don\'t Sacrifice Clarity Prematurely',
                text: 'Resist "optimizing" by writing cryptic, clever code before profiling proves a hotspot. Clear code that is 1% slower is almost always better than fast code nobody can safely change. Optimize only where measurement demands it.'
            }
        },

        // ─── 11. TESTING ──────────────────────────────────────────────
        {
            title: 'Testing',
            content: `<p>Tests are the foundation of safe refactoring — they prove behavior is preserved:</p>
            <h4>Tests as a Safety Net</h4>
            <p>A good test suite lets you refactor fearlessly. Make a change, run tests; green means
            behavior is intact. Without tests, every refactoring is a gamble.</p>
            <h4>Characterization Tests for Legacy Code</h4>
            <p>When code has no tests, write tests that capture its current behavior (even bugs) before
            refactoring. These "pin" the behavior so you'll notice if a refactoring changes it.</p>
            <h4>Test Behavior, Not Implementation</h4>
            <p>Tests should verify observable behavior (inputs → outputs), not internal structure.
            Tests coupled to implementation break during refactoring even when behavior is unchanged —
            defeating their purpose.</p>`,
            code: `// Tests that survive refactoring test BEHAVIOR, not internals

// FRAGILE — couples to internal method names; breaks on refactor
[Fact]
public void Fragile_VerifiesInternalCalls()
{
    var mock = Substitute.For<IInternalCalculator>();
    var service = new PricingService(mock);
    service.GetPrice(order);
    mock.Received().InternalStep1();  // breaks if we rename/restructure internals
    mock.Received().InternalStep2();
}

// ROBUST — verifies observable behavior; survives any internal refactor
[Theory]
[InlineData(10, 10.0, 100.0)]    // qty, unit, expected
[InlineData(50, 10.0, 450.0)]    // bulk discount applied
[InlineData(0, 10.0, 0.0)]       // edge: empty
public void GetPrice_ReturnsExpectedTotal(int qty, decimal unit, decimal expected)
{
    var service = new PricingService();
    var order = new Order(new[] { new Item(unit, qty) });

    var price = service.GetPrice(order);

    Assert.Equal(expected, price);
}
// We can Extract Method, rename, or replace conditionals with polymorphism —
// this test keeps passing because it only checks inputs → outputs.`,
            language: 'csharp'
        },

        // ─── 12. INTERVIEW TIPS ───────────────────────────────────────
        {
            title: 'Interview Tips',
            content: `<p>Refactoring appears in live coding, code review, and "improve this code" exercises:</p>
            <ul>
                <li><strong>Define it precisely:</strong> Refactoring = improving structure WITHOUT changing
                behavior. Many candidates conflate it with rewriting or bug fixing</li>
                <li><strong>Name the smell first:</strong> When asked to improve code, identify the specific
                smell ("this is a long method with duplicated logic") before refactoring</li>
                <li><strong>Mention tests:</strong> Always say you'd refactor under passing tests. This signals
                discipline</li>
                <li><strong>Use named refactorings:</strong> "I'd Extract Method here and Replace Conditional
                with Polymorphism there" shows you know the catalog</li>
                <li><strong>Show small steps:</strong> Describe the incremental approach, not a giant rewrite</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'The Strangler Fig Answer',
                text: 'For "how would you modernize a large legacy system?", the senior answer is the Strangler Fig pattern: incrementally route functionality to new code behind a facade while the old system runs, verifying parity at each step, until the old system can be removed. This beats the high-risk big-bang rewrite every time.'
            }
        },

        // ─── 13. FURTHER READING ──────────────────────────────────────
        {
            title: 'Further Reading',
            content: `<p>Essential refactoring resources:</p>
            <h4>Books</h4>
            <ul>
                <li><em>Refactoring</em> (2nd ed.) by Martin Fowler — the definitive catalog of named refactorings</li>
                <li><em>Working Effectively with Legacy Code</em> by Michael Feathers — refactoring untested code</li>
                <li><em>Clean Code</em> by Robert C. Martin — smells and heuristics</li>
                <li><em>Tidy First?</em> by Kent Beck — small structural improvements and when to do them</li>
            </ul>
            <h4>Online</h4>
            <ul>
                <li>refactoring.com — Fowler's online catalog with examples</li>
                <li>refactoring.guru — smells and refactorings with diagrams</li>
                <li>Martin Fowler: StranglerFigApplication article</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li><strong>IDE refactorings:</strong> Visual Studio, Rider, IntelliJ, VS Code automated refactorings</li>
                <li><strong>Static analysis:</strong> SonarQube, NDepend — detect smells and complexity</li>
                <li><strong>Coverage:</strong> Coverlet, dotCover — verify test coverage before refactoring</li>
            </ul>`
        },

        // ─── 14. KEY TAKEAWAYS ────────────────────────────────────────
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Core idea:</strong> Refactoring improves internal structure WITHOUT changing external behavior</li>
                <li><strong>Prerequisite:</strong> Passing tests (write characterization tests first for legacy code)</li>
                <li><strong>Method:</strong> Small reversible steps, run tests after each, commit frequently</li>
                <li><strong>Recognize smells:</strong> Long method, large class, duplication, long parameter list, feature envy</li>
                <li><strong>Know the catalog:</strong> Extract Method, Guard Clauses, Replace Conditional with Polymorphism, Introduce Parameter Object</li>
                <li><strong>Avoid:</strong> The big rewrite, mixing refactoring with feature changes, refactoring without tests</li>
                <li><strong>Large scale:</strong> Use the Strangler Fig pattern, not a big-bang rewrite</li>
                <li><strong>Interview signal:</strong> Naming smells, citing named refactorings, and insisting on test coverage shows discipline</li>
            </ul>`
        },

        // ─── 15. EXERCISE ─────────────────────────────────────────────
        {
            title: 'Exercise',
            content: `<h4>Challenge: Refactor a Smelly Order Processor</h4>
            <p>The method below has multiple smells. Refactor it step by step:</p>
            <ol>
                <li>Identify every code smell you can find (aim for at least 4)</li>
                <li>Write characterization tests capturing current behavior first</li>
                <li>Apply guard clauses to flatten the nesting</li>
                <li>Extract the discount logic and the tax logic into named methods</li>
                <li>Replace the status string switch with polymorphism or a strategy</li>
                <li>Replace magic numbers with named constants</li>
                <li>Run your tests after each step to confirm behavior is preserved</li>
            </ol>
            <h4>Starter Code (refactor this)</h4>`,
            code: `public decimal Process(Order o) {
    if (o != null) {
        if (o.Items != null && o.Items.Count > 0) {
            decimal t = 0;
            foreach (var i in o.Items) t += i.Price * i.Qty;
            if (t > 500) t = t * 0.95m;       // discount
            if (o.Country == "US") t = t * 1.07m;   // tax
            else if (o.Country == "UK") t = t * 1.20m;
            else if (o.Country == "DE") t = t * 1.19m;
            return t;
        }
        return 0;
    }
    return 0;
}

// TODO: List the smells, add characterization tests, then refactor:
// - Guard clauses for the null/empty checks
// - Extract CalculateSubtotal, ApplyDiscount, ApplyTax
// - Replace country tax switch with a lookup/strategy
// - Name constants: DiscountThreshold=500, DiscountRate=0.95, tax rates`,
            language: 'csharp'
        },

        // ─── 16. KNOWLEDGE CHECK ──────────────────────────────────────
        {
            title: 'Knowledge Check',
            content: `<p>Test your understanding of refactoring:</p>
            <ol>
                <li><strong>Q:</strong> What is the one rule that defines refactoring?<br/>
                    <em>A: Behavior must not change. Refactoring improves internal structure while keeping
                    external behavior identical, verified by tests passing before and after.</em></li>
                <li><strong>Q:</strong> How do you refactor code that has no tests?<br/>
                    <em>A: Write characterization tests first — tests that capture the code's current behavior
                    (even bugs). These pin the behavior so you'll detect if a refactoring changes it. Then
                    refactor in small steps under those green tests.</em></li>
                <li><strong>Q:</strong> Why should refactoring and feature changes be in separate commits?<br/>
                    <em>A: So a regression can be traced to exactly one change. If structure and behavior change
                    together, you can't tell whether a bug came from the restructuring or the new behavior.</em></li>
                <li><strong>Q:</strong> What is the Strangler Fig pattern and why prefer it over a rewrite?<br/>
                    <em>A: It incrementally routes functionality from the old system to new code behind a facade
                    until the old system can be removed. It avoids the big-bang rewrite's risks: lost edge-case
                    knowledge, long timelines, and shipping new bugs all at once.</em></li>
            </ol>`
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // INTERVIEW QUESTIONS
    // ═══════════════════════════════════════════════════════════════
    questions: [
        {
            question: 'What is the Mikado Method, and how does Branch by Abstraction enable large refactorings without long-lived branches?',
            difficulty: 'hard',
            answer: `<p>Both are techniques for <strong>large refactorings</strong> done incrementally on a working,
            shippable codebase \u2014 avoiding the risky big-bang refactor on a long-lived branch.</p>
            <h4>Mikado Method</h4>
            <p>You attempt the goal change; when it breaks something, you note the prerequisite, <em>revert</em>, and
            do the prerequisite first \u2014 recursively building a dependency graph (the "Mikado graph") of changes. You
            then implement leaf-first, keeping the build green at every step. It turns a scary refactor into a series
            of small, safe, committed steps.</p>
            <h4>Branch by Abstraction</h4>
            <p>To replace a component used in many places: (1) introduce an abstraction layer over the existing
            implementation, (2) migrate callers to the abstraction, (3) build the new implementation behind the same
            abstraction, (4) switch over (often via a flag), (5) remove the old one. The codebase stays working and
            mergeable to main throughout \u2014 no long-lived feature branch.</p>`,
            explanation: 'Mikado is like untangling a knot: each time pulling a thread tightens another, you note "must loosen that first," back off, and handle prerequisites in order. Branch by Abstraction is renovating a house room-by-room behind temporary walls while people keep living in it \u2014 versus moving everyone out for a year (a long-lived branch).',
            code: `// Branch by Abstraction (replace a payment gateway):
// 1. Introduce abstraction over the existing impl
public interface IPaymentGateway { Task<Result> ChargeAsync(...); }
public class LegacyGateway : IPaymentGateway { /* current code */ }

// 2. Migrate all callers to depend on IPaymentGateway (still LegacyGateway)
// 3. Build new impl behind the SAME interface
public class NewGateway : IPaymentGateway { /* new code */ }
// 4. Switch via flag/DI:  services.AddScoped<IPaymentGateway>(... flag ? new : legacy)
// 5. Once proven, delete LegacyGateway. Main stayed shippable the whole time.`,
            language: 'csharp',
            bestPractices: ['Keep main green and shippable at every step', 'Commit small, reversible steps (Mikado: revert on discovering prerequisites)', 'Use flags to switch implementations safely (Branch by Abstraction)'],
            commonMistakes: ['Big-bang refactor on a long-lived branch (merge hell, risk)', 'Migrating callers and swapping implementation in one giant step', 'Not keeping the build green between steps'],
            interviewTip: 'Contrast both with the doomed "long-lived refactor branch." Emphasize that they keep the system continuously working and mergeable \u2014 the core value over a big-bang rewrite.',
            followUp: ['How does Branch by Abstraction relate to the Strangler Fig pattern?', 'Why are long-lived refactoring branches dangerous?'],
            seniorPerspective: 'For any refactor too big to finish in a day, I default to Branch by Abstraction on main rather than a refactor branch, because long-lived branches accumulate merge conflicts and the refactor inevitably gets abandoned half-done. Introducing the seam (interface) first also delivers value immediately \u2014 it improves testability even before the new implementation exists \u2014 and the flag-controlled switchover gives me an instant rollback if the new code misbehaves.'
        },
        {
            question: 'What are the categories of code smells, and how do you prioritize which to fix?',
            difficulty: 'hard',
            answer: `<p>Fowler\u2019s smell categories help you recognize and name problems:</p>
            <ul>
                <li><strong>Bloaters:</strong> long method, large class, long parameter list, primitive obsession,
                data clumps \u2014 things that grew too big.</li>
                <li><strong>Object-orientation abusers:</strong> switch statements on type, refused bequest,
                temporary fields \u2014 misused OO.</li>
                <li><strong>Change preventers:</strong> divergent change (one class changed for many reasons),
                shotgun surgery (one change touches many classes) \u2014 these slow down every future change.</li>
                <li><strong>Dispensables:</strong> dead code, duplicate code, speculative generality, comments
                compensating for bad code.</li>
                <li><strong>Couplers:</strong> feature envy, inappropriate intimacy, message chains, middle man.</li>
            </ul>
            <p><strong>Prioritize</strong> by impact, not aesthetics: fix smells in code that <em>changes often</em>
            and where they cause real pain (change preventers and duplication in hot paths are highest value). Ignore
            ugly-but-stable code nobody touches \u2014 refactoring it adds risk with no return.</p>`,
            explanation: 'Smells are symptoms with a diagnosis vocabulary, like a doctor naming conditions. But you treat the patient, not the chart: a "change preventer" smell in code edited every sprint is urgent; the same smell in a frozen legacy module is harmless and not worth the risk of surgery.',
            bestPractices: ['Prioritize smells by change frequency \u00d7 pain, not by ugliness', 'Target change-preventers (shotgun surgery, divergent change) and hot-path duplication first', 'Fix smells opportunistically in code you\u2019re already touching (Boy Scout Rule)'],
            commonMistakes: ['Refactoring stable code that doesn\u2019t need it (risk without return)', 'Treating every smell as mandatory', 'Big speculative cleanups instead of incremental, evidence-driven ones'],
            interviewTip: 'Show judgment: name a few smell categories, then stress prioritizing by change frequency and business pain. "I fix smells where they cost us, not everywhere" is the senior answer.',
            followUp: ['What is the difference between divergent change and shotgun surgery?', 'How do you decide a smell is NOT worth fixing?']
        },
        {
            question: 'What is refactoring, and how is it different from rewriting or bug fixing?',
            difficulty: 'easy',
            answer: `<p><strong>Refactoring</strong> is restructuring existing code to improve its internal quality
            <strong>without changing its external behavior</strong>. The code does exactly the same thing
            before and after — only the structure improves.</p>
            <p>How it differs:</p>
            <ul>
                <li><strong>vs Rewriting:</strong> Rewriting re-implements from scratch (changes behavior, high risk).
                Refactoring transforms existing code in small safe steps.</li>
                <li><strong>vs Bug fixing:</strong> Bug fixing changes behavior to correct a defect. Refactoring
                preserves behavior — including any existing bugs (you fix those separately).</li>
                <li><strong>vs Feature work:</strong> Features add new behavior. Refactoring adds no behavior.</li>
            </ul>`,
            explanation: 'Refactoring is like reorganizing a kitchen — same ingredients, same meals you can cook, but everything is now where it should be so cooking is easier. You did not change the menu (behavior); you improved the workspace (structure).',
            bestPractices: [
                'Only refactor with passing tests as a safety net',
                'Keep refactoring commits separate from behavior changes',
                'Take small, reversible steps'
            ],
            commonMistakes: [
                'Calling a from-scratch rewrite "refactoring"',
                'Changing behavior while claiming to only refactor',
                'Refactoring without any tests'
            ],
            interviewTip: 'Nail the definition in one sentence: "Refactoring changes structure, not behavior." Then contrast it with rewriting and bug fixing to show you understand the boundaries.',
            followUp: [
                'How do you know behavior was actually preserved?',
                'When is a rewrite justified over refactoring?'
            ]
        },

        {
            question: 'Name several code smells and the refactoring you would apply to each.',
            difficulty: 'medium',
            answer: `<p>Code smells are surface symptoms of deeper design problems. Common ones and their fixes:</p>
            <ul>
                <li><strong>Long Method</strong> → Extract Method (break into smaller named functions)</li>
                <li><strong>Duplicated Code</strong> → Extract Method/Class, pull up shared logic</li>
                <li><strong>Long Parameter List</strong> → Introduce Parameter Object</li>
                <li><strong>Large Class (God Object)</strong> → Extract Class (split responsibilities)</li>
                <li><strong>Switch/type conditionals repeated</strong> → Replace Conditional with Polymorphism</li>
                <li><strong>Deeply Nested Conditionals</strong> → Introduce Guard Clauses (early returns)</li>
                <li><strong>Primitive Obsession</strong> → Replace Primitive with Object (e.g., Money, Email types)</li>
                <li><strong>Feature Envy</strong> → Move Method to the class whose data it uses</li>
                <li><strong>Magic Numbers</strong> → Replace with named constants</li>
                <li><strong>Flag Argument</strong> → split into separate methods or use an enum</li>
            </ul>`,
            code: `// Smell: Primitive Obsession — strings/decimals for domain concepts
public void Transfer(decimal amount, string currency, string fromAcct, string toAcct)
{
    if (amount <= 0) throw new ArgumentException();
    // currency validation scattered everywhere this is used...
}

// Refactor: Replace Primitive with Object — a Money value object
public record Money(decimal Amount, Currency Currency)
{
    public Money
    {
        if (Amount < 0) throw new ArgumentException("Amount cannot be negative");
    }
    public Money Add(Money other) => Currency == other.Currency
        ? this with { Amount = Amount + other.Amount }
        : throw new InvalidOperationException("Currency mismatch");
}

public void Transfer(Money amount, AccountId from, AccountId to) { /* ... */ }
// Validation lives in one place; misuse is now a compile error`,
            language: 'csharp',
            bestPractices: [
                'Learn to name smells precisely — it speeds up communication and review',
                'Match each smell to its standard refactoring from the catalog',
                'Address the highest-impact smells (duplication, god classes) first'
            ],
            commonMistakes: [
                'Treating every smell as a must-fix — context matters',
                'Fixing cosmetic smells while ignoring structural ones',
                'Introducing complexity (over-abstraction) while removing a smell'
            ],
            interviewTip: 'List 4-5 smells with their paired refactoring quickly — it demonstrates fluency with the catalog. Then pick one and show the before/after, like Primitive Obsession → value object, to prove you can apply it.',
            followUp: [
                'Which smell do you find most damaging in practice and why?',
                'How do you prioritize which smells to fix?'
            ],
            seniorPerspective: 'I prioritize smells by change-frequency and blast radius, not by how ugly they look. A god class in a module nobody touches is low priority; duplicated logic in the payment path that changes every sprint is urgent. The Boy Scout Rule handles the cosmetic ones organically — I clean what I touch — while I schedule deliberate refactoring for the structural smells that slow the team down.'
        },

        {
            question: 'How would you approach modernizing a large, poorly-structured legacy system?',
            difficulty: 'hard',
            answer: `<p>The disciplined approach avoids the big-bang rewrite trap and uses incremental, test-backed refactoring:</p>
            <h4>1. Establish a Safety Net</h4>
            <p>Add characterization tests around the areas you'll change. For untested legacy code, find
            "seams" (places to insert test points) per Michael Feathers' techniques.</p>
            <h4>2. Identify Change Hotspots</h4>
            <p>Use version-control history and profiling to find the code that changes most often or causes
            the most bugs. Focus refactoring effort there — not on stable code nobody touches.</p>
            <h4>3. Apply the Strangler Fig Pattern</h4>
            <p>Put a facade/router in front of the legacy system. Incrementally build new, well-structured
            implementations for slices of functionality and route traffic to them, verifying parity at each
            step. The old system shrinks until it can be removed.</p>
            <h4>4. Refactor Incrementally</h4>
            <p>Within each slice, refactor in small steps under tests. "Make the change easy, then make the
            easy change."</p>
            <h4>5. Prevent Regression</h4>
            <p>Run old and new paths in parallel (shadowing) and compare outputs before fully switching over.</p>`,
            mermaid: `flowchart LR
    Client[Clients] --> Facade[Facade / Router]
    Facade -->|migrated slices| New[New System<br/>well-structured]
    Facade -->|remaining| Legacy[Legacy System<br/>shrinking]
    New -.->|parity check| Legacy
    Legacy -.->|slice by slice| New

    style New fill:#d1fae5,color:#1e293b
    style Legacy fill:#fee2e2,color:#1e293b`,
            bestPractices: [
                'Never attempt a big-bang rewrite of a large working system',
                'Add characterization tests before changing untested code',
                'Use a facade to route between old and new during migration',
                'Verify behavioral parity (shadow/compare) before switching traffic',
                'Prioritize by change frequency and business risk'
            ],
            commonMistakes: [
                'The "we will just rewrite it" plan — usually fails or overruns badly',
                'Refactoring stable code that does not need it',
                'No parity verification, so the new system silently behaves differently',
                'Trying to migrate everything at once instead of slice by slice'
            ],
            interviewTip: 'Lead with "I would avoid a big-bang rewrite" and name the Strangler Fig pattern explicitly. Then walk through: safety net → hotspots → incremental strangling → parity verification. Citing Feathers (Working Effectively with Legacy Code) and Fowler signals depth.',
            followUp: [
                'How do you add tests to code that was not designed to be testable?',
                'How do you verify the new system behaves identically to the old one?',
                'How do you get business buy-in for refactoring work?'
            ],
            seniorPerspective: 'The hardest part of legacy modernization is rarely technical — it is sequencing and trust. I migrate the slices that deliver the most risk reduction or business value first, keep old and new running in parallel with output comparison so we catch divergence early, and report progress in business terms (this module is now fully on the new path, here is the defect-rate drop). Big-bang rewrites fail because they ask the business to wait months for zero new value while betting that we perfectly re-captured decades of embedded edge cases.',
            architectPerspective: 'Architecturally, the facade/anti-corruption layer is the key enabler — it decouples clients from the migration so they neither know nor care which system serves them. I also instrument both paths heavily: the parity comparison is itself a system that logs divergences for triage. The migration is "done" not when new code exists but when the legacy path has been dark (zero traffic) long enough to safely delete.'
        },

        {
            question: 'What is the Parallel Change (expand-contract) pattern, and how do you use it to refactor a widely-used interface without breaking callers?',
            difficulty: 'advanced',
            answer: `<p><strong>Parallel Change</strong> (also called <strong>expand-contract</strong>) is a technique for
            making a breaking change to an interface, schema, or API safely and incrementally, in three phases:</p>
            <ol>
                <li><strong>Expand</strong> — add the new form (new method/column/field) <em>alongside</em> the old
                one. Both work simultaneously. Nothing breaks.</li>
                <li><strong>Migrate</strong> — move callers/data over to the new form one at a time, each as a small
                verified step. The old form keeps working throughout.</li>
                <li><strong>Contract</strong> — once nothing uses the old form, remove it.</li>
            </ol>
            <p>This avoids the "change it everywhere in one commit" big-bang that is risky and unmergeable in a
            large codebase or a system with external/asynchronous consumers you cannot update atomically.</p>`,
            explanation: 'Parallel Change is like replacing a busy bridge. You build the new bridge next to the old one (expand), reroute traffic lane by lane while both carry cars (migrate), and only demolish the old bridge once it sits empty (contract). At no point is the river uncrossable.',
            code: `// Goal: rename/replace a method and change its signature safely.

// PHASE 1 — EXPAND: add the new API; keep the old one delegating to it.
public class PricingService
{
    // NEW preferred API
    public Money CalculateTotal(Order order, DiscountPolicy policy) { /* real logic */ }

    // OLD API kept temporarily — forwards to the new one, marked obsolete
    [Obsolete("Use CalculateTotal(order, policy). Removed in v3.")]
    public decimal CalculateTotal(Order order)
        => CalculateTotal(order, DiscountPolicy.Default).Amount;
}

// PHASE 2 — MIGRATE: move call sites to the new API one commit at a time.
// var total = pricing.CalculateTotal(order);                 // before
// var total = pricing.CalculateTotal(order, policy).Amount;  // after (per caller)
// Each migration is small, reviewable, and independently shippable.

// PHASE 3 — CONTRACT: once no caller uses the obsolete overload, delete it.
public class PricingServiceV3
{
    public Money CalculateTotal(Order order, DiscountPolicy policy) { /* real logic */ }
    // old overload removed
}

// For DATABASES the same shape applies:
// Expand:   add new nullable column, write to BOTH old and new
// Migrate:  backfill old rows; switch reads to new column
// Contract: stop writing old column, then drop it`,
            language: 'csharp',
            bestPractices: [
                'Add the new form before removing the old — never both in one step',
                'Mark the old form [Obsolete] so new usage is discouraged and visible',
                'Migrate callers/data in small, individually shippable increments',
                'Only contract (delete) after verifying zero remaining usage'
            ],
            commonMistakes: [
                'Doing expand and contract in the same release (defeats the safety)',
                'Forgetting to backfill existing data before switching reads to the new schema',
                'Removing the old form while async/external consumers still depend on it',
                'Skipping the obsolete marker, so new code keeps adopting the doomed API'
            ],
            interviewTip: 'Name the three phases explicitly — expand, migrate, contract — and show it applies equally to code APIs and database schemas. Mentioning [Obsolete] and data backfill demonstrates you have actually done it, not just read about it.',
            followUp: [
                'How does this map to backward-compatible database migrations?',
                'How do feature flags complement Parallel Change?',
                'How do you apply expand-contract to a public API with external consumers?'
            ],
            seniorPerspective: 'Parallel Change is how I make "scary" refactorings boring. Each step is independently shippable and reversible, so a rename touching 200 call sites becomes a series of safe small PRs instead of one unmergeable monster. The discipline is resisting the urge to delete the old path early — the cost of keeping it briefly is far less than the cost of a coordinated break.',
            architectPerspective: 'In distributed systems expand-contract is mandatory, not optional: you cannot atomically deploy producers and consumers, so every breaking change must pass through a backward-compatible intermediate state. The same pattern underlies zero-downtime schema migrations and versioned API evolution — additive first, remove last.'
        },

        {
            question: 'What are characterization tests, and why are they the essential first step before refactoring legacy code that has no test coverage?',
            difficulty: 'hard',
            answer: `<p>A <strong>characterization test</strong> (from Michael Feathers' "Working Effectively with Legacy Code") captures what the code <em>currently does</em> — not what it should do. You write a test, run it against the existing code, observe the actual output, and encode that output as the assertion. The test now "pins" the current behavior, whether correct or buggy, so that any refactoring that inadvertently changes behavior causes an immediate failure.</p>
            <p>They are essential because refactoring's defining rule is <strong>behavior preservation</strong>, and without tests you have no mechanism to detect when you accidentally violate it. Writing characterization tests first gives you the safety net to restructure code confidently. You deliberately do not fix bugs during this phase — bugs are behavior too, and you need to know the baseline before making structural changes. Bug fixes come as a separate, tracked step afterward.</p>
            <p>The technique also helps you <em>understand</em> the legacy code. By probing inputs and observing outputs you learn what the code actually does, which is often subtly different from what documentation claims. Each test is a verified fact about the system's behavior, building your mental model incrementally.</p>`,
            language: 'csharp',
            code: `// Characterization test: we do NOT know if 450 is "correct" — we know
// it is what the code CURRENTLY produces. That is our baseline.
[Theory]
[InlineData(10, 10.0, 100.0)]    // qty=10, unit=10 → observed: 100
[InlineData(50, 10.0, 450.0)]    // qty=50, unit=10 → observed: 450 (bulk discount)
[InlineData(0, 10.0, 0.0)]       // qty=0 → observed: 0
[InlineData(-1, 10.0, -10.0)]    // qty=-1 → observed: -10 (probably a bug, but pin it)
public void LegacyPricer_CharacterizesCurrentBehavior(int qty, decimal unit, decimal expected)
{
    var pricer = new LegacyPricer();
    Assert.Equal(expected, pricer.Price(qty, unit));
}

// Step 1: Write characterization tests (pin behavior)
// Step 2: Refactor structure (extract, rename, flatten) — tests stay green
// Step 3: Fix bugs as SEPARATE commits after structure is clean
//         (update the characterization test's expected value when you fix the bug)

// The -10 case above is likely a bug (negative quantity should probably throw)
// but we pin it NOW so we refactor safely, then fix it later with a deliberate test change.`,
            bestPractices: [
                'Write characterization tests BEFORE any structural change to legacy code',
                'Pin all observed behavior including suspected bugs — fix bugs separately later',
                'Use parameterized tests with edge cases to cover as much behavior as quickly as possible',
                'Run tests after every small refactoring step to catch unintended changes'
            ],
            commonMistakes: [
                'Fixing bugs during the characterization phase (muddies behavior change with refactoring)',
                'Skipping edge cases and null paths — the hidden behaviors are where refactoring surprises hide',
                'Deleting characterization tests after refactoring instead of keeping them as regression guards',
                'Assuming documentation describes what the code does (it often drifts — let the tests tell you)'
            ],
            interviewTip: 'Emphasize the discipline: characterization tests pin CURRENT behavior, even bugs, because refactoring must not change behavior. Bug fixes come as separate, tracked commits that deliberately update the assertions. This separation shows you understand the Two Hats principle.',
            followUp: [
                'How do you write characterization tests for code with external dependencies (database, network)?',
                'At what coverage level are you confident enough to start refactoring?'
            ]
        },

        {
            question: 'Explain the Replace Conditional with Polymorphism refactoring. When is it appropriate, and when does it over-engineer the solution?',
            difficulty: 'hard',
            answer: `<p><strong>Replace Conditional with Polymorphism</strong> removes a switch/if-else chain that selects behavior based on type or category, replacing it with a class hierarchy where each subclass overrides a method with its own behavior. The conditional dispatch is eliminated — the runtime's virtual dispatch handles selection, and adding a new variant means adding a new class rather than modifying every switch statement.</p>
            <p>It is appropriate when: the same conditional pattern (switching on type/status/category) <strong>recurs across multiple methods</strong> — each new variant forces changes in many places (Shotgun Surgery). It aligns with the Open/Closed Principle: you can add a new shipping method, discount rule, or notification channel by adding a class, without touching existing code.</p>
            <p>It is <strong>over-engineering</strong> when: the conditional appears in only one place and the type set is small and stable. A three-case switch that exists in one method and rarely changes is perfectly readable as-is. Introducing an abstract base, three subclasses, and a factory for a simple one-off conditional adds structural complexity without a real maintenance payoff. The refactoring pays for itself when the alternatives grow, when the conditional is duplicated, or when new variants arrive frequently.</p>`,
            language: 'csharp',
            code: `// BEFORE: switch repeated in multiple methods — adding a type means editing everywhere
public decimal CalculateShipping(Order order) => order.ShipMethod switch
{
    "Standard" => order.Weight * 1.0m,
    "Express"  => order.Weight * 2.5m + 10m,
    "Overnight"=> order.Weight * 4.0m + 25m,
    _ => throw new ArgumentException("Unknown shipping method")
};
public int EstimateDeliveryDays(Order order) => order.ShipMethod switch
{
    "Standard" => 7, "Express" => 3, "Overnight" => 1, _ => throw new ...
};
// Every new method like "SameDay" requires editing BOTH switches (Shotgun Surgery)

// AFTER: polymorphism — each variant owns ALL its behavior in one place
public abstract class ShippingMethod
{
    public abstract decimal CalculateCost(decimal weight);
    public abstract int EstimateDeliveryDays();
}

public class StandardShipping : ShippingMethod
{
    public override decimal CalculateCost(decimal weight) => weight * 1.0m;
    public override int EstimateDeliveryDays() => 7;
}
public class ExpressShipping : ShippingMethod
{
    public override decimal CalculateCost(decimal weight) => weight * 2.5m + 10m;
    public override int EstimateDeliveryDays() => 3;
}
// Adding "SameDay" = one new class. No existing code touched. Open/Closed satisfied.`,
            bestPractices: [
                'Apply when the same type-switch recurs across multiple methods (Shotgun Surgery smell)',
                'Combine with a factory or DI to construct the correct subclass',
                'Keep the interface focused — each method in the hierarchy should be cohesive',
                'Write characterization tests pinning current behavior before starting the refactoring'
            ],
            commonMistakes: [
                'Applying to a single one-off switch with 2-3 stable cases (over-engineering)',
                'Introducing polymorphism for data-only differences that a lookup table handles better',
                'Forgetting to provide a factory/resolver, leaving callers responsible for choosing the class',
                'Partially refactoring — some methods use polymorphism, others still switch (inconsistent)'
            ],
            interviewTip: 'Show both sides: explain when polymorphism eliminates Shotgun Surgery and satisfies Open/Closed, then acknowledge when a simple switch is perfectly fine (one location, stable variants). That balanced judgment is what separates senior from textbook answers.',
            followUp: [
                'How do you combine this with dependency injection to resolve the correct implementation?',
                'What is the alternative when the type set is data-driven and changes at runtime?'
            ]
        }
    ]
});
