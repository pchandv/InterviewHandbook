/* ═══════════════════════════════════════════════════════════════════
   CLEAN CODE: NAMING & READABILITY — Level 3: Engineering Principles
   Naming conventions, self-documenting code, function design, and
   the practices that make code readable and maintainable.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('clean-code-naming', {

    title: 'Naming & Readability',
    level: 3,
    group: 'clean-code',
    description: 'How to name variables, functions, and classes for clarity; write self-documenting code; design small focused functions; and use comments correctly.',
    difficulty: 'beginner',
    estimatedMinutes: 35,
    prerequisites: ['arch-principles'],

    sections: [

        // ─── 1. INTRODUCTION ──────────────────────────────────────────
        {
            title: 'Introduction',
            content: `<p><strong>Clean code</strong> is code that is easy to read, understand, and change. Among all clean
            code practices, <strong>naming</strong> is the most impactful and most frequently neglected.
            Code is read far more often than it is written — studies suggest a 10:1 read-to-write ratio.</p>
            <p>Good names eliminate the need for comments, reduce cognitive load, and make bugs easier to spot.
            A well-named codebase reads like prose; a poorly-named one requires constant mental translation.</p>
            <p>In this module, you will learn:</p>
            <ul>
                <li>Naming principles: intention-revealing, pronounceable, searchable</li>
                <li>Conventions for variables, functions, classes, and constants</li>
                <li>How to write self-documenting code that needs few comments</li>
                <li>When comments add value and when they signal a problem</li>
                <li>Function design: small, single-purpose, few arguments</li>
                <li>How readability affects maintainability and team velocity</li>
            </ul>`
        },

        // ─── 2. CORE CONCEPTS ─────────────────────────────────────────
        {
            title: 'Core Concepts',
            content: `<p>The foundational principles of naming and readable code:</p>
            <h4>Intention-Revealing Names</h4>
            <p>A name should answer: why it exists, what it does, and how it is used. If a name needs a
            comment to explain it, the name has failed. <code>int d;</code> (elapsed days) should be
            <code>int elapsedTimeInDays;</code>.</p>
            <h4>Avoid Disinformation</h4>
            <p>Don't use names that imply something false. <code>accountList</code> should actually be a List —
            if it's a Dictionary, call it <code>accounts</code>. Avoid abbreviations that have multiple meanings.</p>
            <h4>Meaningful Distinctions</h4>
            <p>Don't add noise words to satisfy the compiler. <code>getActiveAccount()</code>,
            <code>getActiveAccountInfo()</code>, <code>getActiveAccountData()</code> — what's the difference?
            Make distinctions meaningful.</p>
            <h4>Pronounceable and Searchable</h4>
            <p>If you can't pronounce it, you can't discuss it. <code>genymdhms</code> (generation date,
            year, month, day, hour, minute, second) is unpronounceable. Single-letter names and magic
            numbers are unsearchable — use named constants.</p>
            <h4>One Word per Concept</h4>
            <p>Pick one word for an abstract concept and stick with it. Don't mix <code>fetch</code>,
            <code>retrieve</code>, and <code>get</code> across the codebase for the same operation.</p>`,
            mermaid: `graph TB
    A[Bad Name: int d] --> B{Needs a comment?}
    B -->|Yes| C[Name has failed]
    C --> D[Rename: elapsedTimeInDays]
    D --> E{Self-explanatory?}
    E -->|Yes| F[Good Name]
    B -->|No| F`
        },

        // ─── 3. HOW IT WORKS ──────────────────────────────────────────
        {
            title: 'How It Works',
            content: `<p>Applying naming conventions consistently across code constructs:</p>
            <ol>
                <li><strong>Variables & fields:</strong> Nouns describing the data. Booleans read as predicates
                (<code>isActive</code>, <code>hasPermission</code>, <code>canEdit</code>)</li>
                <li><strong>Functions & methods:</strong> Verbs or verb phrases describing the action
                (<code>calculateTotal</code>, <code>sendEmail</code>, <code>validateInput</code>)</li>
                <li><strong>Classes & types:</strong> Nouns describing the concept
                (<code>OrderProcessor</code>, <code>CustomerRepository</code>) — never verbs</li>
                <li><strong>Constants:</strong> Named, not magic numbers
                (<code>MAX_RETRY_ATTEMPTS = 3</code> instead of bare <code>3</code>)</li>
                <li><strong>Collections:</strong> Plural nouns (<code>customers</code>, <code>orderItems</code>)</li>
            </ol>
            <p>The transformation below shows how naming alone makes code self-explanatory:</p>`,
            code: `// BEFORE: cryptic, requires mental translation
public List<int[]> getThem(List<int[]> list1) {
    List<int[]> list2 = new();
    foreach (int[] x in list1)
        if (x[0] == 4)
            list2.Add(x);
    return list2;
}

// AFTER: intention-revealing names — no comments needed
public List<Cell> GetFlaggedCells(List<Cell> gameBoard) {
    List<Cell> flaggedCells = new();
    foreach (Cell cell in gameBoard)
        if (cell.IsFlagged)
            flaggedCells.Add(cell);
    return flaggedCells;
}

// Even better with LINQ once names are clear
public List<Cell> GetFlaggedCells(List<Cell> gameBoard) =>
    gameBoard.Where(cell => cell.IsFlagged).ToList();`,
            language: 'csharp'
        },

        // ─── 4. VISUAL DIAGRAM ────────────────────────────────────────
        {
            title: 'Naming Decision Flow',
            content: `<p>A practical decision flow for choosing a name:</p>`,
            mermaid: `flowchart TD
    Start[Need to name something] --> Type{What is it?}
    Type -->|Data/Variable| Noun[Use a noun]
    Type -->|Action/Function| Verb[Use a verb phrase]
    Type -->|Boolean| Pred[Use is/has/can prefix]
    Type -->|Class/Type| ClassNoun[Use a concept noun]
    Type -->|Constant| Const[UPPER_SNAKE, no magic numbers]

    Noun --> Check{Reveals intent<br/>without a comment?}
    Verb --> Check
    Pred --> Check
    ClassNoun --> Check
    Const --> Check

    Check -->|No| Rename[Rename — be specific]
    Rename --> Check
    Check -->|Yes| Search{Searchable &<br/>pronounceable?}
    Search -->|No| Rename
    Search -->|Yes| Done[Good name]`
        },

        // ─── 5. IMPLEMENTATION ────────────────────────────────────────
        {
            title: 'Implementation',
            content: `<p>Naming and readability patterns across languages — same principles, idiomatic conventions:</p>`,
            tabs: [
                {
                    label: 'C#',
                    code: `// C# conventions: PascalCase for public members, camelCase for locals/params

// BAD
public class Mgr {
    private int n;                    // What is n?
    public bool Chk(int x) => x > n;  // Check what? Against what?
    public decimal Calc(decimal a, decimal b, bool f) =>  // Cryptic
        f ? a * b * 0.9m : a * b;
}

// GOOD
public class InventoryManager {
    private const int LowStockThreshold = 10;

    public bool IsLowStock(int currentQuantity) =>
        currentQuantity < LowStockThreshold;

    public decimal CalculateLineTotal(
        decimal unitPrice, int quantity, bool applyBulkDiscount)
    {
        const decimal BulkDiscountRate = 0.9m;
        var subtotal = unitPrice * quantity;
        return applyBulkDiscount ? subtotal * BulkDiscountRate : subtotal;
    }
}`,
                    language: 'csharp'
                },
                {
                    label: 'TypeScript',
                    code: `// TypeScript conventions: camelCase members, PascalCase types

// BAD
function proc(d: any[], t: number): any[] {
    const r = [];
    for (const i of d) if (i.v > t) r.push(i);
    return r;
}

// GOOD
interface Transaction {
    amount: number;
    description: string;
}

function findLargeTransactions(
    transactions: Transaction[],
    minimumAmount: number
): Transaction[] {
    return transactions.filter(
        transaction => transaction.amount > minimumAmount
    );
}

// Boolean naming reads as a predicate
const isEligibleForRefund = (order: Order): boolean =>
    order.status === 'delivered' && daysSince(order.deliveredAt) <= 30;`,
                    language: 'typescript'
                },
                {
                    label: 'Python',
                    code: `# Python conventions: snake_case for functions/variables, PascalCase for classes

# BAD
def calc(l, r):
    tot = 0
    for x in l:
        if x[1] == 'a':
            tot += x[0] * r
    return tot

# GOOD
def calculate_active_subscription_revenue(
    subscriptions: list[Subscription],
    monthly_rate: Decimal
) -> Decimal:
    total_revenue = Decimal(0)
    for subscription in subscriptions:
        if subscription.status == 'active':
            total_revenue += subscription.seats * monthly_rate
    return total_revenue

# Booleans read as predicates
def is_subscription_expired(subscription: Subscription) -> bool:
    return subscription.expires_at < datetime.now()`,
                    language: 'python'
                }
            ]
        },

        // ─── 6. BEST PRACTICES ────────────────────────────────────────
        {
            title: 'Best Practices',
            content: `<h4>Do: Use Intention-Revealing Names</h4>
            <p>The name should explain why something exists and what it does. If you need a comment to
            explain a variable, rename the variable instead.</p>
            <h4>Do: Keep Functions Small and Single-Purpose</h4>
            <p>A function should do one thing and do it well. If you can extract a meaningful sub-function
            with a good name, the original function was doing too much. Aim for functions that fit on
            one screen.</p>
            <h4>Do: Limit Function Arguments</h4>
            <p>Zero arguments is ideal, one or two is fine, three needs justification, four or more
            usually means you should group them into an object. Many arguments make functions hard
            to call correctly and test.</p>
            <h4>Do: Use Named Constants Instead of Magic Numbers</h4>
            <p><code>if (age >= 18)</code> hides intent. <code>if (age >= LegalAdultAge)</code> reveals it
            and makes the value searchable and changeable in one place.</p>
            <h4>Do: Write Comments That Explain "Why", Not "What"</h4>
            <p>Good code shows what it does. Comments should explain why a non-obvious decision was made,
            warn of consequences, or clarify intent that code cannot express.</p>`,
            callout: {
                type: 'tip',
                title: 'The Newspaper Metaphor',
                text: 'Read code top-to-bottom like a newspaper: the highest-level concepts at the top, details below. A reader should grasp the gist from the top and dig deeper only as needed. Order functions so callers appear above callees.'
            }
        },

        // ─── 7. COMMON MISTAKES ───────────────────────────────────────
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Redundant Comments That Restate Code</h4>
            <p><code>i++; // increment i</code> adds noise, not value. Comments that restate the code
            become stale and lie when the code changes. Delete them.</p>
            <h4>Mistake: Encodings and Hungarian Notation</h4>
            <p>Prefixing types into names (<code>strName</code>, <code>iCount</code>, <code>m_field</code>)
            is obsolete. Modern IDEs show types. These encodings add noise and become wrong after refactoring.</p>
            <h4>Mistake: Mental-Mapping Single Letters</h4>
            <p>Using <code>a</code>, <code>b</code>, <code>tmp</code> forces readers to remember what each
            represents. The exception is short loop counters (<code>i</code>, <code>j</code>) in tiny scopes.</p>
            <h4>Mistake: Functions That Do Too Much</h4>
            <p>A function named <code>processOrderAndSendEmailAndUpdateInventory</code> — the "And" is a
            smell. It violates single responsibility. Split it.</p>
            <h4>Mistake: Boolean Flag Arguments</h4>
            <p><code>render(true)</code> — what does true mean? Flag arguments mean a function does two
            things. Split into <code>renderForPrint()</code> and <code>renderForScreen()</code>, or use an enum.</p>
            <h4>Mistake: Commented-Out Code</h4>
            <p>Dead code in comments rots. Nobody dares delete it ("might be needed"). Version control
            remembers everything — delete it and trust git.</p>`,
            code: `// BAD: comment restates code, flag argument, magic number
public void Process(Order o, bool b) {
    // check if order total is greater than 1000
    if (o.Total > 1000) {  // magic number
        if (b)              // what is b?
            ApplyDiscount(o);
    }
}

// GOOD: self-documenting, no flag, named constant
private const decimal LargeOrderThreshold = 1000m;

public void ApplyLargeOrderDiscount(Order order) {
    if (order.Total > LargeOrderThreshold)
        ApplyDiscount(order);
}
// Caller intent is now explicit at the call site`,
            language: 'csharp'
        },

        // ─── 8. REAL-WORLD APPLICATIONS ───────────────────────────────
        {
            title: 'Real-World Applications',
            content: `<p>Why naming and readability matter in production:</p>
            <h4>Onboarding Speed</h4>
            <p>New engineers ramp up dramatically faster on a well-named codebase. Self-documenting code
            means they read the code instead of hunting for the original author or outdated docs.</p>
            <h4>Code Review Efficiency</h4>
            <p>Reviewers can evaluate intent quickly when names reveal purpose. Reviews on cryptic code
            devolve into "what does this do?" rather than "is this correct?".</p>
            <h4>Bug Reduction</h4>
            <p>Many bugs hide behind misleading names. A variable named <code>customerCount</code> that
            actually holds order count is a bug waiting to happen. Accurate names surface mismatches.</p>
            <h4>Open-Source Standards</h4>
            <p>Successful open-source projects (the .NET runtime, React, Kubernetes) enforce strict naming
            conventions because thousands of contributors must understand each other's code. Their style
            guides are worth studying.</p>
            <h4>Long-Lived Systems</h4>
            <p>Code outlives its authors. Banking, insurance, and government systems run for decades.
            The names you choose today are read by engineers who have never met you, long after you've moved on.</p>`
        },

        // ─── 9. COMPARISON ────────────────────────────────────────────
        {
            title: 'Comparison',
            content: `<p>Comparing naming approaches and their impact:</p>`,
            table: {
                headers: ['Aspect', 'Cryptic / Abbreviated', 'Hungarian / Encoded', 'Intention-Revealing'],
                rows: [
                    ['Example', 'int d, calc(a,b)', 'strName, iCount, m_val', 'elapsedDays, calculateTotal'],
                    ['Needs Comments', 'Almost always', 'Often', 'Rarely'],
                    ['Searchability', 'Poor', 'Medium', 'Excellent'],
                    ['Survives Refactor', 'N/A', 'Becomes wrong', 'Stays accurate'],
                    ['Onboarding Cost', 'High', 'Medium', 'Low'],
                    ['Review Speed', 'Slow', 'Medium', 'Fast'],
                    ['IDE Support Needed', 'Constant', 'Redundant', 'Minimal'],
                    ['Modern Best Practice', 'Avoid', 'Obsolete', 'Recommended']
                ]
            }
        },

        // ─── 10. PERFORMANCE ──────────────────────────────────────────
        {
            title: 'Performance',
            content: `<p>Naming has no runtime performance cost — identifiers are compiled away. But there are
            real <em>human</em> performance considerations:</p>
            <h4>Developer Velocity</h4>
            <p>Readable code is the single biggest lever on team velocity over a project's life. Time
            spent understanding code dwarfs time spent writing it. Clear names reduce the understanding tax.</p>
            <h4>Cognitive Load</h4>
            <p>Working memory holds ~4-7 items. Every cryptic name, magic number, or overlong function
            consumes a slot. Good names free working memory to reason about the actual problem.</p>
            <h4>Compile-Time Note</h4>
            <p>Long descriptive names have zero runtime cost in compiled languages (C#, Java, Go) and
            negligible cost in interpreted ones. Minification handles name length for shipped JS/TS.
            Never sacrifice clarity for shorter names to "save bytes" in source.</p>
            <h4>Searchability as Productivity</h4>
            <p>A searchable name (<code>MaxRetryAttempts</code>) can be found instantly across a codebase.
            A magic number (<code>3</code>) requires reading context to find every usage — a real
            productivity drain during changes.</p>`,
            callout: {
                type: 'info',
                title: 'The Real Cost',
                text: 'The cost of poor naming is not CPU cycles — it is human hours. Over a system\'s lifetime, the hours lost to deciphering bad code vastly exceed any keystrokes saved by short names. Optimize for the reader.'
            }
        },

        // ─── 11. TESTING ──────────────────────────────────────────────
        {
            title: 'Testing',
            content: `<p>Naming principles apply to tests too — arguably more, since tests document behavior:</p>
            <h4>Descriptive Test Names</h4>
            <p>A test name should describe the scenario and expected outcome. When it fails, the name
            alone should tell you what broke without reading the body.</p>
            <h4>Given-When-Then or Method_Scenario_Result</h4>
            <p>Two popular conventions. Both make the test's intent explicit. The test name is documentation
            that never goes stale because it runs.</p>
            <h4>Arrange-Act-Assert Structure</h4>
            <p>Structure test bodies in three clear sections. Name test variables to reveal the scenario
            (<code>expiredSubscription</code>, not <code>sub1</code>).</p>`,
            code: `// BAD test names — tell you nothing on failure
[Fact] public void Test1() { ... }
[Fact] public void TestDiscount() { ... }

// GOOD: Method_Scenario_ExpectedResult
[Fact]
public void CalculateLineTotal_WithBulkDiscount_Applies10PercentReduction()
{
    // Arrange — names reveal the scenario
    var manager = new InventoryManager();
    decimal unitPrice = 100m;
    int bulkQuantity = 50;

    // Act
    var total = manager.CalculateLineTotal(unitPrice, bulkQuantity, applyBulkDiscount: true);

    // Assert
    Assert.Equal(4500m, total); // 100 * 50 * 0.9
}

[Fact]
public void IsLowStock_WhenQuantityBelowThreshold_ReturnsTrue()
{
    var manager = new InventoryManager();
    Assert.True(manager.IsLowStock(currentQuantity: 5));
}

// Named argument (applyBulkDiscount:) makes the call self-documenting —
// no need to guess what 'true' means at the call site`,
            language: 'csharp'
        },

        // ─── 12. INTERVIEW TIPS ───────────────────────────────────────
        {
            title: 'Interview Tips',
            content: `<p>Clean code shows up in code-review exercises and pair-programming interviews:</p>
            <ul>
                <li><strong>Name as you code:</strong> In a live coding interview, choose clear names from the
                start. Interviewers notice <code>customerOrders</code> vs <code>x</code></li>
                <li><strong>Refactor cryptic code when asked to review:</strong> Spotting and fixing poor names
                demonstrates code sense</li>
                <li><strong>Explain the "why" of comments:</strong> Know that comments should explain rationale,
                not restate code</li>
                <li><strong>Discuss function size:</strong> Be ready to explain single-responsibility at the
                function level and why small functions are easier to test</li>
                <li><strong>Mention the reader:</strong> Framing decisions around "the next person to read this"
                signals professional maturity</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Code Review Signal',
                text: 'When reviewing code in an interview, lead with readability observations before diving into logic. "This variable name does not reveal intent" and "this function does three things" are senior-level observations that show you think about maintainability, not just correctness.'
            }
        },

        // ─── 13. FURTHER READING ──────────────────────────────────────
        {
            title: 'Further Reading',
            content: `<p>Essential resources on clean code and naming:</p>
            <h4>Books</h4>
            <ul>
                <li><em>Clean Code</em> by Robert C. Martin — Chapters 2 (Naming) and 3 (Functions) are essential</li>
                <li><em>The Art of Readable Code</em> by Boswell & Foucher — practical, concise, language-agnostic</li>
                <li><em>Code Complete</em> by Steve McConnell — Chapter 11 on naming is comprehensive</li>
                <li><em>A Philosophy of Software Design</em> by John Ousterhout — deep on naming and abstraction</li>
            </ul>
            <h4>Style Guides</h4>
            <ul>
                <li>Microsoft .NET naming guidelines (framework design guidelines)</li>
                <li>Google Style Guides (multiple languages): <code>google.github.io/styleguide</code></li>
                <li>Airbnb JavaScript Style Guide</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li><strong>Linters:</strong> ESLint, StyleCop, SonarLint — enforce naming conventions</li>
                <li><strong>Analyzers:</strong> Roslyn analyzers for C# naming rules</li>
                <li><strong>Editors:</strong> Rename refactoring (F2) makes renaming safe and cheap</li>
            </ul>`
        },

        // ─── 14. KEY TAKEAWAYS ────────────────────────────────────────
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Core idea:</strong> Code is read far more than written — optimize names and structure for the reader</li>
                <li><strong>Golden rule:</strong> If a name needs a comment to explain it, the name has failed — rename it</li>
                <li><strong>Functions:</strong> Small, single-purpose, verb-named, few arguments (avoid boolean flags)</li>
                <li><strong>Constants:</strong> Name them — never leave magic numbers in code</li>
                <li><strong>Comments:</strong> Explain "why", not "what"; delete commented-out code and redundant comments</li>
                <li><strong>Avoid:</strong> Cryptic abbreviations, Hungarian notation, disinformation, noise words</li>
                <li><strong>Interview signal:</strong> Naming code clearly under pressure and reviewing for readability shows maturity</li>
            </ul>`
        },

        // ─── 15. EXERCISE ─────────────────────────────────────────────
        {
            title: 'Exercise',
            content: `<h4>Challenge: Refactor This for Readability</h4>
            <p>The function below works but is hard to read. Refactor it applying everything in this module:</p>
            <ol>
                <li>Rename the function, parameters, and variables to reveal intent</li>
                <li>Replace magic numbers with named constants</li>
                <li>Eliminate the boolean flag argument</li>
                <li>Extract any sub-logic into well-named helper functions</li>
                <li>Remove comments that merely restate code; keep/add any that explain "why"</li>
            </ol>
            <h4>Starter Code (refactor this)</h4>`,
            code: `// Refactor this — it calculates a shipping cost
public decimal Calc(decimal w, string c, bool e) {
    decimal r = 0;
    // base rate
    if (w <= 1) r = 5;
    else if (w <= 5) r = 10;
    else r = 10 + (w - 5) * 2;
    // country
    if (c != "US") r = r * 1.5m;  // international
    // express
    if (e) r = r + 15;
    return r;
}

// TODO: Your refactored version with:
// - Intention-revealing names (function, params, locals)
// - Named constants for 1, 5, 5m, 10m, 2m, 1.5m, 15m
// - No boolean flag — consider an enum ShippingSpeed { Standard, Express }
// - Extracted helpers like CalculateBaseRate(weight) if it improves clarity`,
            language: 'csharp'
        },

        // ─── 16. KNOWLEDGE CHECK ──────────────────────────────────────
        {
            title: 'Knowledge Check',
            content: `<p>Test your understanding of naming and readability:</p>
            <ol>
                <li><strong>Q:</strong> What is the test for whether a name is good enough?<br/>
                    <em>A: It reveals intent without needing a comment, is pronounceable and searchable, and
                    does not mislead. If you must add a comment to explain a name, rename it instead.</em></li>
                <li><strong>Q:</strong> Why are boolean flag arguments a code smell?<br/>
                    <em>A: A flag argument means the function does two different things depending on the flag,
                    violating single responsibility. The call site (render(true)) is also unreadable. Split into
                    two functions or use a descriptive enum.</em></li>
                <li><strong>Q:</strong> What should comments explain?<br/>
                    <em>A: The "why" — rationale for non-obvious decisions, warnings about consequences, or intent
                    code cannot express. Comments that restate what the code does (the "what") are noise and go
                    stale.</em></li>
                <li><strong>Q:</strong> Why replace magic numbers with named constants?<br/>
                    <em>A: Named constants reveal intent (LegalAdultAge vs 18), are searchable, and centralize the
                    value so it can be changed in one place. Magic numbers hide meaning and scatter the value.</em></li>
            </ol>`
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // INTERVIEW QUESTIONS
    // ═══════════════════════════════════════════════════════════════
    questions: [
        {
            question: 'What is Command-Query Separation (CQS) and how does it improve readability and reasoning about code?',
            difficulty: 'hard',
            answer: `<p><strong>Command-Query Separation</strong> (Bertrand Meyer) states that every method should be
            either a <strong>command</strong> (changes state, returns nothing) or a <strong>query</strong> (returns a
            value, no side effects) \u2014 never both. Asking a question should not change the answer.</p>
            <p>It improves readability because callers can reason about code safely: queries can be called freely, in
            any order, multiple times, without surprises; commands are the only things that mutate. It also makes code
            easier to test (queries are pure) and to cache/optimize.</p>
            <p>The classic violation is a method like <code>pop()</code> that both returns the top element and removes
            it \u2014 calling it twice gives different results and accidental double-calls cause bugs.</p>`,
            explanation: 'CQS is like the rule "looking at the speedometer shouldn\u2019t change your speed." A query just reports; a command just acts. Mixing them means reading a value secretly changes the system, which makes code surprising and hard to reason about.',
            code: `// VIOLATION: query that also mutates (surprising)
public int GetNextId() { return _id++; }   // returns AND mutates

// CQS-respecting:
public int CurrentId => _id;                // query (no side effect)
public void AdvanceId() { _id++; }          // command (no return)

// Pragmatic exceptions exist (e.g., Stack.Pop, ConcurrentDictionary.GetOrAdd)
// where atomicity requires combining them - but be deliberate about it.`,
            language: 'csharp',
            bestPractices: ['Make queries side-effect free so they\u2019re safe to call anywhere', 'Name commands as verbs, queries as nouns/questions', 'When you must combine (atomic pop), make it obvious in the name'],
            commonMistakes: ['Getters that lazily mutate/cache in non-thread-safe ways', 'Methods that both return data and trigger side effects (logging aside)', 'Dogmatically applying CQS where atomicity legitimately needs both'],
            interviewTip: 'State the principle crisply ("asking a question shouldn\u2019t change the answer") and acknowledge pragmatic exceptions (Stack.Pop) \u2014 showing you apply principles with judgment, not dogma.',
            followUp: ['How does CQS relate to CQRS at the architecture level?', 'When is violating CQS justified?']
        },
        {
            question: 'Explain cyclomatic vs cognitive complexity and how they guide refactoring for readability.',
            difficulty: 'hard',
            answer: `<p><strong>Cyclomatic complexity</strong> counts the number of independent paths through code
            (roughly, decision points + 1: each <code>if</code>, <code>case</code>, <code>&amp;&amp;</code>, loop adds
            one). It correlates with the number of test cases needed for full path coverage.</p>
            <p><strong>Cognitive complexity</strong> (SonarSource) measures how <em>hard code is for a human to
            understand</em>. Crucially, it penalizes <strong>nesting</strong> heavily (a nested condition is harder
            than a flat one) and ignores constructs that don\u2019t hurt readability (like a flat switch), whereas
            cyclomatic treats them equally.</p>
            <p>They guide refactoring: high cyclomatic complexity suggests breaking a method up and signals more tests
            needed; high cognitive complexity flags deeply nested, hard-to-follow code \u2014 fix with guard clauses,
            early returns, extracted methods, and flattening nesting.</p>`,
            explanation: 'Cyclomatic complexity counts the routes through a maze (how many tests to cover them all). Cognitive complexity measures how dizzy a person gets walking it \u2014 deeply nested twists are far more disorienting than the same number of straight forks, which is why nesting is penalized.',
            code: `// High cognitive complexity (deep nesting):
if (user != null) {
    if (user.IsActive) {
        if (user.HasPermission) {
            return DoWork();
        }
    }
}
return Denied();

// Lower cognitive complexity (guard clauses flatten it):
if (user == null || !user.IsActive || !user.HasPermission) return Denied();
return DoWork();`,
            language: 'csharp',
            bestPractices: ['Flatten nesting with guard clauses / early returns', 'Extract complex conditions and sub-logic into well-named methods', 'Set complexity thresholds in linters (SonarQube) as a refactoring trigger'],
            commonMistakes: ['Optimizing the metric instead of actual readability', 'Treating a flat switch as "complex" (cyclomatic) when it reads fine (cognitive)', 'Ignoring nesting depth, the biggest human-comprehension cost'],
            interviewTip: 'The key differentiator to state: cognitive complexity penalizes nesting and aligns with human understanding, while cyclomatic counts paths (test cases). Use both as refactoring signals, not goals.',
            followUp: ['How does cyclomatic complexity relate to test coverage?', 'Why is deep nesting worse than many flat conditions?'],
            seniorPerspective: 'I use these metrics as smoke detectors, not targets. A spike in cognitive complexity on a method I\u2019m about to change tells me to flatten nesting and extract helpers before adding to it ("make the change easy, then make the easy change"). But I never let a team game the score \u2014 the goal is code a tired engineer can read at 2am during an incident, and the metric is just a proxy for that.'
        },
        {
            question: 'What makes a good variable or function name?',
            difficulty: 'easy',
            answer: `<p>A good name is <strong>intention-revealing</strong> — it explains why something exists, what
            it does, and how it is used, without requiring a comment.</p>
            <p>Specific qualities:</p>
            <ul>
                <li><strong>Reveals intent:</strong> <code>elapsedDays</code> not <code>d</code></li>
                <li><strong>Pronounceable:</strong> you can say it in a conversation</li>
                <li><strong>Searchable:</strong> can be found across the codebase (not a single letter or magic number)</li>
                <li><strong>No disinformation:</strong> doesn't imply something false (don't call a Dictionary a "list")</li>
                <li><strong>Right part of speech:</strong> nouns for variables/classes, verbs for functions, predicates for booleans</li>
            </ul>`,
            explanation: 'A good name is like a good sign on a door. "Exit" tells you exactly what is behind it. "Door 3" makes you open it to find out. Names should let readers know what is inside without opening (reading the implementation).',
            bestPractices: [
                'Name booleans as predicates: isActive, hasItems, canEdit',
                'Name functions as verbs: calculateTotal, validateInput',
                'Use named constants instead of magic numbers',
                'Pick one word per concept and use it consistently'
            ],
            commonMistakes: [
                'Single-letter names outside tiny loop scopes',
                'Abbreviations with ambiguous meaning',
                'Names that need a comment to be understood'
            ],
            interviewTip: 'Give the "no comment needed" test as your one-line answer: a name is good when it reveals intent without a comment. Then back it with the noun/verb/predicate rule.',
            followUp: [
                'When are single-letter names acceptable?',
                'What is the problem with Hungarian notation?'
            ]
        },

        {
            question: 'When should you write a comment, and when does a comment indicate a problem?',
            difficulty: 'medium',
            answer: `<p>Comments should explain what the code <strong>cannot</strong> express on its own — primarily the
            <strong>"why"</strong>, not the "what".</p>
            <h4>Good Comments</h4>
            <ul>
                <li>Explaining rationale for a non-obvious decision ("using a lookup table here because the
                regex was too slow for our 1M-row case")</li>
                <li>Warning of consequences ("changing this order breaks the legacy import")</li>
                <li>Clarifying intent that the language can't capture (regulatory requirement references)</li>
                <li>TODO/FIXME markers for known future work</li>
                <li>Public API documentation (XML docs, JSDoc)</li>
            </ul>
            <h4>Comments That Signal a Problem</h4>
            <ul>
                <li>Restating what the code obviously does (<code>i++; // increment i</code>)</li>
                <li>Explaining a confusing name (rename instead)</li>
                <li>Explaining a long, complex function (extract well-named functions instead)</li>
                <li>Commented-out code (delete it — git remembers)</li>
            </ul>`,
            explanation: 'A comment is an apology — for code that could not explain itself. Sometimes the apology is necessary (a regulatory quirk, a performance hack). But often it is a signal: instead of commenting confusing code, make the code clear so the comment becomes unnecessary.',
            bestPractices: [
                'Prefer self-documenting code over explanatory comments',
                'When you write a comment, ask: can I rename or restructure to make it unnecessary?',
                'Keep "why" comments — they capture knowledge code cannot',
                'Delete commented-out code; rely on version control'
            ],
            commonMistakes: [
                'Redundant comments that restate code and then go stale',
                'Using comments to explain bad names instead of fixing them',
                'Leaving large blocks of commented-out code'
            ],
            interviewTip: 'The crisp framing that impresses: "Comments should explain why, not what. If I am tempted to comment what the code does, that is usually a signal to rename or extract instead." Then acknowledge the legitimate exceptions (rationale, warnings, public API docs).',
            followUp: [
                'How do you handle a genuinely complex algorithm that needs explanation?',
                'What is your view on commented-out code?'
            ],
            seniorPerspective: 'In code review I treat most explanatory comments as a prompt to ask "can the code say this itself?" Often a rename or an extracted, well-named method removes the comment entirely. The comments I fight to keep are the ones that capture knowledge the code structurally cannot — why we chose an unusual approach, a link to the bug or regulation that forced it, or a warning about a sharp edge.'
        },

        {
            question: 'How small should a function be, and how do you decide when to split one?',
            difficulty: 'medium',
            answer: `<p>A function should do <strong>one thing</strong> and do it at a single level of abstraction.
            The practical heuristics:</p>
            <ul>
                <li><strong>Fits on a screen:</strong> if you scroll to read it, it is likely too long</li>
                <li><strong>One level of abstraction:</strong> don't mix high-level orchestration with
                low-level string parsing in the same function</li>
                <li><strong>The "And" test:</strong> if you describe what it does using "and", it is doing
                more than one thing (processOrder AND sendEmail AND updateInventory)</li>
                <li><strong>Extractable with a name:</strong> if you can pull out a block and give it a
                meaningful name, that block was a separate responsibility</li>
            </ul>
            <p>Splitting reduces cognitive load, improves testability (test each piece in isolation),
            and creates reusable units. The extracted functions also serve as documentation — their
            names describe the steps.</p>`,
            code: `// BEFORE: one function doing several things
public async Task PlaceOrder(OrderRequest request)
{
    // validate
    if (request.Items == null || !request.Items.Any())
        throw new ValidationException("No items");
    foreach (var item in request.Items)
        if (item.Quantity <= 0)
            throw new ValidationException("Invalid quantity");

    // calculate total with discount
    decimal total = 0;
    foreach (var item in request.Items)
        total += item.Price * item.Quantity;
    if (total > 1000) total *= 0.9m;

    // persist + notify
    var order = new Order(request.CustomerId, request.Items, total);
    await _repository.AddAsync(order);
    await _emailService.SendConfirmationAsync(order);
}

// AFTER: orchestration at one level; details extracted + named
public async Task PlaceOrder(OrderRequest request)
{
    ValidateOrderRequest(request);
    var total = CalculateTotalWithDiscount(request.Items);
    var order = new Order(request.CustomerId, request.Items, total);
    await _repository.AddAsync(order);
    await _emailService.SendConfirmationAsync(order);
}
// ValidateOrderRequest, CalculateTotalWithDiscount are small, testable, named`,
            language: 'csharp',
            bestPractices: [
                'Keep functions at a single level of abstraction',
                'Extract blocks that can be given a meaningful name',
                'Aim for functions that fit on one screen',
                'Each extracted function should be independently testable'
            ],
            commonMistakes: [
                'Functions with "And" in their natural description (multiple responsibilities)',
                'Mixing high-level flow with low-level details in one function',
                'Over-extracting into so many tiny functions that flow becomes hard to follow'
            ],
            interviewTip: 'Use the "And test" — it is memorable and shows clear thinking: "If I describe the function and have to say AND, it is doing more than one thing." Balance it by acknowledging over-extraction is also a smell; the goal is one level of abstraction, not the smallest possible functions.',
            followUp: [
                'Can functions be too small? When does extraction hurt readability?',
                'How does function size relate to testability?'
            ]
        },

        {
            question: 'What is connascence, and how does it give you a more precise vocabulary than "coupling" for reasoning about readability and change?',
            difficulty: 'advanced',
            answer: `<p><strong>Connascence</strong> (Meilir Page-Jones) is a refined taxonomy of coupling: two pieces of
            code are connascent if changing one requires changing the other to keep the program correct. It
            replaces the vague word "coupling" with named, comparable forms you can weigh and reduce.</p>
            <h4>Static connascence (visible in the source text)</h4>
            <ul>
                <li><strong>Name</strong> — agreement on a name (rename one, rename all). Weakest, easiest.</li>
                <li><strong>Type</strong> — agreement on a type.</li>
                <li><strong>Meaning</strong> — agreement on the meaning of values (magic numbers: 1 means "active").</li>
                <li><strong>Position</strong> — agreement on order (positional arguments).</li>
                <li><strong>Algorithm</strong> — agreement on an algorithm (both sides must hash the same way).</li>
            </ul>
            <h4>Dynamic connascence (only observable at runtime — stronger, worse)</h4>
            <ul>
                <li><strong>Execution order</strong>, <strong>Timing</strong>, <strong>Value</strong> (related values must change together), <strong>Identity</strong> (must reference the same instance).</li>
            </ul>
            <p>Two guiding rules: prefer <strong>weaker</strong> connascence (name/type over meaning/position),
            and increase connascence strength only when it stays <strong>local</strong> (same function/class).
            Strong connascence spread across modules is the readability and maintenance killer.</p>`,
            explanation: 'Coupling is like saying "these two things are connected." Connascence is the doctor giving the connection a specific diagnosis and severity — a sprain (connascence of name) versus a fracture (connascence of timing). Naming the exact form tells you how urgent and how risky the change is.',
            code: `// CONNASCENCE OF MEANING — caller must "know" that 1 = active, 2 = suspended
public void SetStatus(int status) { /* ... */ }
SetStatus(1);   // 1 means... what? knowledge duplicated across call sites

// WEAKER: connascence of NAME/TYPE via an enum — rename/refactor is mechanical
public enum AccountStatus { Active, Suspended, Closed }
public void SetStatus(AccountStatus status) { /* ... */ }
SetStatus(AccountStatus.Active);   // self-documenting; compiler-checked

// CONNASCENCE OF POSITION — easy to swap arguments by mistake
CreateUser("Ada", "Lovelace");          // first/last? or last/first?
// WEAKER: connascence of NAME via named arguments or a parameter object
CreateUser(firstName: "Ada", lastName: "Lovelace");

// LOCALITY RULE: strong connascence is tolerable when it stays close together
public decimal Price(decimal unit, int qty) => unit * qty; // order matters,
// but it is contained in one tiny function — low risk. The danger is the SAME
// implicit ordering/meaning agreement duplicated across many distant modules.`,
            language: 'csharp',
            bestPractices: [
                'Prefer weaker forms: replace meaning/position with name/type (enums, named args, parameter objects)',
                'Keep any strong connascence local — within one function or class, not spread across modules',
                'Use the vocabulary in reviews to make "this is too coupled" precise and actionable',
                'Eliminate connascence of meaning by naming magic values'
            ],
            commonMistakes: [
                'Leaving magic numbers/strings that create connascence of meaning across the codebase',
                'Long positional argument lists (connascence of position) instead of objects or named args',
                'Distant code that must change in lockstep (connascence of value) with no test or type to catch drift',
                'Treating all coupling as equally bad instead of ranking by strength and locality'
            ],
            interviewTip: 'Show you can rank coupling: name/type are weak and fine; meaning/position are worth refactoring; dynamic forms (timing, execution order) are the most dangerous. Then give the locality rule — strength is acceptable when it is local. That nuance reads as senior.',
            followUp: [
                'How does connascence of meaning relate to magic numbers?',
                'Why is dynamic connascence worse than static connascence?',
                'How would you use connascence to justify a refactoring in code review?'
            ],
            seniorPerspective: 'Connascence gives my code reviews a precise language. Instead of "this feels coupled," I can say "this is connascence of meaning duplicated across three modules — let us promote it to a named type so the compiler enforces the agreement." Concrete, rankable, and actionable beats vague intuition every time.',
            architectPerspective: 'At module and service boundaries the goal is to permit only the weakest connascence — name and type, expressed as an explicit contract. Any dynamic connascence (shared execution order, shared identity, values that must change together) crossing a service boundary is a design alarm, because nothing local can catch the drift and deployments are independent.'
        },

        {
            question: 'When do comments add value versus when do they signal that the code itself should be improved? How do you decide?',
            difficulty: 'hard',
            answer: `<p>Comments add genuine value in a narrow set of situations: explaining <strong>why</strong> a non-obvious design decision was made (regulatory requirements, deliberate trade-offs, performance hacks with benchmarks), documenting unavoidable complexity that the language cannot express (concurrency invariants, algorithm references), and <strong>warning</strong> of consequences ("removing this cache invalidation causes settlement drift"). In these cases the comment conveys information the code structurally cannot.</p>
            <p>Comments <em>signal a problem</em> when they explain <strong>what</strong> the code does — that means the code is not self-explanatory and should be refactored instead: extract a well-named method, rename a variable, replace a magic number with a constant, or introduce a domain type. The comment is treating the symptom rather than the cause. A redundant comment also rots — it becomes a lie when the code changes and nobody updates it, making things worse than having no comment at all.</p>
            <p>The decision heuristic: try to express the information in the code itself (a better name, smaller function, explicit type). If the information truly cannot be encoded in code — intent, rationale, external constraints — write a comment. If deleting the comment would lose information, it adds value; if deleting it loses nothing because the code already says the same thing, it is noise.</p>`,
            language: 'csharp',
            code: `// BAD: comment restates the code — refactor instead
// Calculate the discounted total for the order
var total = order.Items.Sum(i => i.Price * i.Qty) * 0.9m;

// GOOD: self-documenting code replaces the comment
var subtotal = order.Items.Sum(item => item.Price * item.Quantity);
var discountedTotal = subtotal * LargeOrderDiscountRate;

// GOOD: comment explains WHY — information code cannot express
// FIX-2024-03: Round half-even per PCI-DSS settlement spec §4.2.1.
// Standard MidpointRounding.ToEven satisfies auditor requirement.
var settled = Math.Round(amount, 2, MidpointRounding.ToEven);

// GOOD: warning of consequences
// Do NOT remove this lock — the hardware device driver is not thread-safe
// and concurrent calls corrupt the firmware state (incident INC-4481).
lock (_deviceLock) { _device.Send(command); }`,
            bestPractices: [
                'Express what and how in code; reserve comments for why and consequences',
                'Delete comments that merely restate code — they rot faster than the code does',
                'Treat a desire to comment as a refactoring prompt: can a rename or extraction eliminate it?',
                'Keep surviving comments close to the code they describe and maintain them like code'
            ],
            commonMistakes: [
                'Commenting every line (noise, violates DRY between code and comment)',
                'Using comments to excuse unclear code instead of improving the code',
                'Leaving stale comments that contradict current behavior (lies are worse than silence)',
                'Removing all comments dogmatically — some rationale genuinely cannot be encoded in names'
            ],
            interviewTip: 'State the principle — "comments should explain why, not what" — then immediately give the exception cases (regulatory rationale, consequence warnings, algorithm citations). Acknowledging both sides shows judgment, not dogma.',
            followUp: [
                'How do XML doc comments / JSDoc differ from inline comments in value?',
                'Is a TODO comment acceptable in production code?'
            ]
        },

        {
            question: 'How do function length and cognitive complexity interact, and what metrics guide you when deciding to split a function?',
            difficulty: 'hard',
            answer: `<p><strong>Function length</strong> is a crude proxy; what really matters is <strong>cognitive complexity</strong> — the mental effort a reader must exert to understand the function. A 30-line function with flat, linear logic may be perfectly readable, while a 15-line function with nested conditionals, early exits, loops with breaks, and mutable state demands intense concentration. Cognitive complexity (as defined by SonarSource) penalizes nesting, breaks in linear flow, and interleaving of concerns — not just the number of paths.</p>
            <p>The decision to split is guided by three signals: (1) the function operates at <strong>mixed levels of abstraction</strong> — it orchestrates high-level flow but also dips into low-level detail; (2) you can name a coherent <strong>sub-action</strong> — if the extracted function gets a clear, intention-revealing name, extraction improves readability; (3) the cyclomatic or cognitive complexity score exceeds a team threshold (commonly 10–15 for cyclomatic, 15–25 for cognitive). If you cannot give the extracted piece a meaningful name, or the extraction just scatters related logic across files, it hurts rather than helps.</p>
            <p>The balance is that overly granular extraction (dozens of 2-line functions) forces readers to chase call chains and reconstruct the flow. The goal is each function at <strong>one level of abstraction</strong> doing <strong>one thing</strong> — readable top-to-bottom without mental jumps, testable independently, and nameable by intent.</p>`,
            language: 'csharp',
            code: `// HIGH cognitive complexity — nested conditions, mixed levels, hard to follow
public decimal Process(Order order)
{
    if (order != null)
    {
        if (order.Items.Any())
        {
            decimal total = 0;
            foreach (var item in order.Items)
            {
                if (item.IsActive)
                {
                    if (item.Quantity > 0)
                        total += item.Price * item.Quantity;
                }
            }
            if (total > 1000) total *= 0.9m;
            return total;
        }
    }
    return 0;
}

// LOW cognitive complexity — flat, one level of abstraction, self-documenting
public decimal CalculateOrderTotal(Order order)
{
    if (order?.Items is not { Count: > 0 }) return 0;

    var subtotal = SumActiveItems(order.Items);
    return ApplyBulkDiscount(subtotal);
}

private decimal SumActiveItems(IEnumerable<Item> items) =>
    items.Where(i => i.IsActive && i.Quantity > 0)
         .Sum(i => i.Price * i.Quantity);

private decimal ApplyBulkDiscount(decimal subtotal) =>
    subtotal > BulkThreshold ? subtotal * BulkDiscountRate : subtotal;`,
            bestPractices: [
                'Use cognitive complexity (not just line count) as the primary metric for when to split',
                'Extract when you can give the sub-function a clear, intention-revealing name',
                'Keep each function at a single level of abstraction',
                'Use guard clauses to flatten nesting and reduce cognitive complexity cheaply'
            ],
            commonMistakes: [
                'Splitting only by line count, producing dozens of trivial functions that scatter logic',
                'Extracting code that cannot be meaningfully named — signals it is not a coherent concept',
                'Ignoring nesting depth, which is the biggest driver of cognitive load',
                'Refusing to split because "it is only 20 lines" while cognitive complexity is over 25'
            ],
            interviewTip: 'Distinguish cyclomatic (number of paths, affects testing) from cognitive (reader effort, affects readability). Explain that the split trigger is mixed abstraction levels or a nameable sub-concept, not an arbitrary line-count rule. That nuance is a senior signal.',
            followUp: [
                'What is the difference between cyclomatic and cognitive complexity?',
                'When does extraction hurt readability instead of helping?'
            ]
        }
    ]
});
