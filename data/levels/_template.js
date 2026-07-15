/* ═══════════════════════════════════════════════════════════════════
   TOPIC TEMPLATE — Software Engineering Academy
   ═══════════════════════════════════════════════════════════════════

   USAGE:
   1. Copy this file to the appropriate level folder:
      data/levels/level-XX/your-topic-id.js

   2. Replace 'topic-id-here' with your actual topic ID (kebab-case)

   3. Fill in all metadata fields and content sections

   4. Add interview questions relevant to the topic

   NOTE: This file is a REFERENCE only — it is NOT loaded by the app.
   The app loads individual topic files on demand via LazyLoader.

   SECTION TYPES (all 16 are listed below):
   1.  Introduction       — Overview and why this topic matters
   2.  Core Concepts      — Theory, definitions, key terminology
   3.  How It Works       — Step-by-step mechanics and flow
   4.  Visual Diagram     — Architecture/flow diagrams (mermaid)
   5.  Implementation     — Code examples with multi-language tabs
   6.  Best Practices     — Do's and recommended approaches
   7.  Common Mistakes    — Don'ts and anti-patterns to avoid
   8.  Real-World Applications — Where/how this is used in production
   9.  Comparison         — How this compares to alternatives (table)
   10. Performance        — Performance considerations and benchmarks
   11. Testing            — How to test this concept
   12. Interview Tips     — What interviewers look for (callout)
   13. Further Reading    — Links, books, resources
   14. Key Takeaways      — Summary bullet points
   15. Exercise           — Hands-on coding exercise
   16. Knowledge Check    — Quiz-style self-assessment questions

   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('topic-id-here', {

    // ═══════════════════════════════════════════════════════════════
    // METADATA
    // ═══════════════════════════════════════════════════════════════
    // These fields describe the topic and control how it appears
    // in navigation, search results, and progress tracking.

    title: 'Topic Title Here',

    level: 0,
    // Level number (0–16). Determines which level folder this belongs to.
    // 0 = Foundations, 16 = Technical Leadership

    group: 'group-id-here',
    // The group within the level (e.g., 'programming-basics', 'design-patterns').
    // Must match a group ID defined in sitemap.js for this level.

    description: 'A one-line summary explaining what this topic covers and why it matters.',
    // Shown in search results, navigation tooltips, and the topic header.

    difficulty: 'beginner',
    // One of: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    // Indicates the complexity of the material.

    estimatedMinutes: 30,
    // Approximate reading/study time in minutes.
    // Include time for exercises if applicable.

    prerequisites: ['prerequisite-topic-id'],
    // Array of topic IDs that should be completed before this one.
    // Used for suggested reading order and dependency tracking.
    // Use an empty array [] if there are no prerequisites.

    // ═══════════════════════════════════════════════════════════════
    // CONTENT SECTIONS
    // ═══════════════════════════════════════════════════════════════
    // Each section is an object with at minimum a `title` field.
    // Optional fields per section:
    //   content  — HTML string with paragraph content
    //   code     — Code snippet (single block)
    //   language — Language for syntax highlighting ('csharp', 'typescript', 'sql', etc.)
    //   mermaid  — Mermaid diagram definition string
    //   table    — Object with { headers: [...], rows: [[...], ...] }
    //   tabs     — Array of { label, code, language } for multi-language examples
    //   callout  — Object with { type, title, text } for highlighted notes
    //              type: 'info' | 'warning' | 'tip' | 'danger'

    sections: [

        // ─────────────────────────────────────────────────────────
        // 1. INTRODUCTION
        // Purpose: Hook the reader — what is this topic and why
        //          should they care? Set context and motivation.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Introduction',
            content: `<p><strong>Topic Title</strong> is a fundamental concept in software engineering
            that addresses [problem domain]. Understanding this topic is essential because it
            directly impacts [code quality / performance / maintainability / scalability].</p>
            <p>In this module, you will learn:</p>
            <ul>
                <li>What [concept] is and why it exists</li>
                <li>How to apply it in real-world scenarios</li>
                <li>Common pitfalls and how to avoid them</li>
                <li>How it appears in technical interviews</li>
            </ul>`
        },

        // ─────────────────────────────────────────────────────────
        // 2. CORE CONCEPTS
        // Purpose: Define key terminology and foundational theory.
        //          This is the "textbook" section — precise definitions.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Core Concepts',
            content: `<p>The following concepts form the foundation of this topic:</p>
            <h4>Concept A — Definition</h4>
            <p>Explain the first core concept clearly. Use analogies where helpful.</p>
            <h4>Concept B — Definition</h4>
            <p>Explain the second core concept. Relate it back to Concept A.</p>
            <h4>Concept C — Definition</h4>
            <p>Explain the third core concept. Show how all concepts connect.</p>`,
            mermaid: `graph LR
    A[Concept A] --> B[Concept B]
    B --> C[Concept C]
    A --> C
    C --> D[Applied Result]`
        },

        // ─────────────────────────────────────────────────────────
        // 3. HOW IT WORKS
        // Purpose: Step-by-step mechanics. Walk through the
        //          process/algorithm/flow in detail with code.
        // ─────────────────────────────────────────────────────────
        {
            title: 'How It Works',
            content: `<p>Here is how [concept] works under the hood, step by step:</p>
            <ol>
                <li><strong>Step 1:</strong> The system initializes by [action]</li>
                <li><strong>Step 2:</strong> When [trigger] occurs, [process] begins</li>
                <li><strong>Step 3:</strong> The result is [outcome], which enables [benefit]</li>
            </ol>
            <p>The following code demonstrates this flow:</p>`,
            code: `// Step 1: Initialize the component
const instance = new ExampleClass({
    option: 'value',
    timeout: 3000
});

// Step 2: Trigger the process
const result = await instance.execute(inputData);

// Step 3: Handle the outcome
if (result.success) {
    console.log('Completed:', result.data);
} else {
    console.error('Failed:', result.error);
}`,
            language: 'typescript'
        },

        // ─────────────────────────────────────────────────────────
        // 4. VISUAL DIAGRAM
        // Purpose: Architecture or flow diagram using Mermaid.
        //          Helps visual learners grasp the big picture.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Visual Diagram',
            content: `<p>The diagram below illustrates the architecture and data flow
            of [concept] in a typical production system:</p>`,
            mermaid: `flowchart TD
    Client[Client Application] -->|HTTP Request| API[API Gateway]
    API --> Auth{Authentication}
    Auth -->|Valid| Service[Business Service]
    Auth -->|Invalid| Error[401 Unauthorized]
    Service --> Cache{Cache Hit?}
    Cache -->|Yes| Response[Return Cached]
    Cache -->|No| DB[(Database)]
    DB --> Service
    Service --> Response[Return Response]`
        },

        // ─────────────────────────────────────────────────────────
        // 5. IMPLEMENTATION
        // Purpose: Concrete code examples. Use `tabs` for
        //          multi-language support where applicable.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Implementation',
            content: `<p>Below are implementation examples in multiple languages.
            Each demonstrates the same concept with idiomatic patterns:</p>`,
            tabs: [
                {
                    label: 'C#',
                    code: `public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(int id);
}

public class UserRepository : IRepository<User>
{
    private readonly DbContext _context;

    public UserRepository(DbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(int id) =>
        await _context.Users.FindAsync(id);

    public async Task<IEnumerable<User>> GetAllAsync() =>
        await _context.Users.ToListAsync();
}`,
                    language: 'csharp'
                },
                {
                    label: 'TypeScript',
                    code: `interface Repository<T> {
    getById(id: number): Promise<T | null>;
    getAll(): Promise<T[]>;
    add(entity: T): Promise<T>;
    update(entity: T): Promise<void>;
    delete(id: number): Promise<void>;
}

class UserRepository implements Repository<User> {
    constructor(private readonly db: Database) {}

    async getById(id: number): Promise<User | null> {
        return this.db.users.findUnique({ where: { id } });
    }

    async getAll(): Promise<User[]> {
        return this.db.users.findMany();
    }
}`,
                    language: 'typescript'
                }
            ]
        },

        // ─────────────────────────────────────────────────────────
        // 6. BEST PRACTICES
        // Purpose: Actionable "do" recommendations.
        //          What experienced engineers recommend.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Best Practices',
            content: `<h4>Do: Follow the Single Responsibility Principle</h4>
            <p>Each component should have one reason to change. This makes code
            easier to test, maintain, and reason about.</p>
            <h4>Do: Favor Composition Over Inheritance</h4>
            <p>Build complex behavior by combining simple, focused objects rather
            than deep inheritance hierarchies.</p>
            <h4>Do: Write Self-Documenting Code</h4>
            <p>Use descriptive names, extract methods, and keep functions short.
            Comments should explain <em>why</em>, not <em>what</em>.</p>
            <h4>Do: Design for Testability</h4>
            <p>Inject dependencies, use interfaces, and avoid static state.
            If it is hard to test, the design likely needs improvement.</p>`,
            callout: {
                type: 'tip',
                title: 'Golden Rule',
                text: 'If you find yourself writing a comment to explain complex code, consider refactoring the code to be self-explanatory instead.'
            }
        },

        // ─────────────────────────────────────────────────────────
        // 7. COMMON MISTAKES
        // Purpose: Anti-patterns and pitfalls to avoid.
        //          Learn from others' errors.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Premature Optimization</h4>
            <p>Optimizing before measuring leads to complex code that solves
            problems that do not exist. Always profile first.</p>
            <h4>Mistake: Ignoring Error Handling</h4>
            <p>Swallowing exceptions or using empty catch blocks hides bugs.
            Always handle errors explicitly or let them propagate.</p>
            <h4>Mistake: Over-Engineering</h4>
            <p>Adding abstraction layers "just in case" increases complexity
            without delivering value. Follow YAGNI — You Aren't Gonna Need It.</p>`,
            code: `// BAD: Over-engineered for a simple use case
public interface IStringFormatterFactory {
    IStringFormatter Create(FormatterType type);
}

// GOOD: Simple and direct
public static string FormatName(string first, string last)
    => $"{last}, {first}";`,
            language: 'csharp'
        },

        // ─────────────────────────────────────────────────────────
        // 8. REAL-WORLD APPLICATIONS
        // Purpose: Show where this concept is used in production
        //          systems. Ground theory in practice.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Real-World Applications',
            content: `<p>This concept is widely used across the industry:</p>
            <h4>E-Commerce Platforms</h4>
            <p>Services like Amazon and Shopify use [concept] to handle
            [specific scenario] at scale, processing millions of transactions daily.</p>
            <h4>Financial Systems</h4>
            <p>Banks and trading platforms apply [concept] to ensure
            [data consistency / low latency / fault tolerance] in critical paths.</p>
            <h4>Social Media</h4>
            <p>Platforms like Twitter and Instagram leverage [concept] for
            [feed generation / notification delivery / content distribution].</p>
            <h4>Healthcare</h4>
            <p>Medical record systems use [concept] to maintain
            [audit trails / data integrity / regulatory compliance].</p>`
        },

        // ─────────────────────────────────────────────────────────
        // 9. COMPARISON
        // Purpose: Compare this approach with alternatives.
        //          Use a table for clear side-by-side view.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Comparison',
            content: `<p>How does this approach compare to alternatives?
            The table below highlights key trade-offs:</p>`,
            table: {
                headers: ['Criteria', 'This Approach', 'Alternative A', 'Alternative B'],
                rows: [
                    ['Complexity', 'Medium', 'Low', 'High'],
                    ['Performance', 'High', 'Medium', 'Very High'],
                    ['Maintainability', 'High', 'High', 'Low'],
                    ['Learning Curve', 'Moderate', 'Easy', 'Steep'],
                    ['Scalability', 'Excellent', 'Limited', 'Excellent'],
                    ['Testing Ease', 'Easy', 'Easy', 'Difficult'],
                    ['Use Case Fit', 'General purpose', 'Simple apps', 'High-perf systems']
                ]
            }
        },

        // ─────────────────────────────────────────────────────────
        // 10. PERFORMANCE
        // Purpose: Performance implications, benchmarks, and
        //          optimization guidance for this concept.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Performance',
            content: `<p>Performance considerations when applying this concept:</p>
            <h4>Time Complexity</h4>
            <p>The typical operation runs in <strong>O(log n)</strong> time,
            making it suitable for large datasets. However, worst-case
            scenarios can degrade to O(n) without proper safeguards.</p>
            <h4>Memory Overhead</h4>
            <p>Each instance requires approximately 48 bytes of overhead
            beyond the data payload. For memory-sensitive applications,
            consider pooling or struct-based alternatives.</p>
            <h4>Benchmark Results</h4>
            <p>In our benchmarks with 1M records:</p>
            <ul>
                <li>Lookup: ~0.3ms average (vs 45ms for linear scan)</li>
                <li>Insert: ~0.5ms average (amortized)</li>
                <li>Memory: ~64MB for 1M entries</li>
            </ul>`,
            callout: {
                type: 'warning',
                title: 'Profile Before Optimizing',
                text: 'Always measure with real workloads before applying optimizations. Premature optimization based on assumptions often makes code worse.'
            }
        },

        // ─────────────────────────────────────────────────────────
        // 11. TESTING
        // Purpose: How to write tests for this concept.
        //          Include example test code.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Testing',
            content: `<p>Effective testing strategies for this concept:</p>
            <h4>Unit Tests</h4>
            <p>Test each behavior in isolation. Mock external dependencies
            to keep tests fast and deterministic.</p>
            <h4>Integration Tests</h4>
            <p>Verify the component works correctly with real dependencies
            (databases, APIs) in a controlled environment.</p>
            <h4>Property-Based Tests</h4>
            <p>Generate random inputs to discover edge cases that manual
            test cases might miss.</p>`,
            code: `[Fact]
public async Task GetById_ExistingUser_ReturnsUser()
{
    // Arrange
    var expected = new User { Id = 1, Name = "Alice" };
    var repository = new UserRepository(CreateTestDb(expected));

    // Act
    var result = await repository.GetByIdAsync(1);

    // Assert
    Assert.NotNull(result);
    Assert.Equal("Alice", result.Name);
}

[Fact]
public async Task GetById_NonExistentId_ReturnsNull()
{
    // Arrange
    var repository = new UserRepository(CreateEmptyTestDb());

    // Act
    var result = await repository.GetByIdAsync(999);

    // Assert
    Assert.Null(result);
}`,
            language: 'csharp'
        },

        // ─────────────────────────────────────────────────────────
        // 12. INTERVIEW TIPS
        // Purpose: What interviewers look for when asking about
        //          this topic. Uses callout for visual emphasis.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Interview Tips',
            content: `<p>When discussing this topic in interviews:</p>
            <ul>
                <li><strong>Start with the "why"</strong> — explain the problem this concept solves before diving into mechanics</li>
                <li><strong>Use concrete examples</strong> — relate to real systems (e.g., "at Netflix, this handles...")</li>
                <li><strong>Discuss trade-offs</strong> — no solution is perfect; show you understand the costs</li>
                <li><strong>Mention testing</strong> — explain how you would verify correctness</li>
                <li><strong>Scale your answer</strong> — junior answers differ from senior answers in depth</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Senior-Level Signal',
                text: 'Senior engineers demonstrate depth by discussing production failure modes, monitoring strategies, and how they have applied the concept to solve real problems at scale.'
            }
        },

        // ─────────────────────────────────────────────────────────
        // 13. FURTHER READING
        // Purpose: Curated resources for deeper learning.
        //          Books, articles, official docs, videos.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Further Reading',
            content: `<p>Expand your understanding with these resources:</p>
            <h4>Books</h4>
            <ul>
                <li><em>Clean Code</em> by Robert C. Martin — foundational coding practices</li>
                <li><em>Designing Data-Intensive Applications</em> by Martin Kleppmann — distributed systems</li>
                <li><em>Domain-Driven Design</em> by Eric Evans — strategic design patterns</li>
            </ul>
            <h4>Articles & Documentation</h4>
            <ul>
                <li>Official documentation: <code>[link to relevant docs]</code></li>
                <li>Microsoft Learn: <code>[relevant module URL]</code></li>
                <li>Martin Fowler's blog: <code>[relevant article]</code></li>
            </ul>
            <h4>Videos</h4>
            <ul>
                <li>Conference talk: "[Title]" by [Speaker] (30 min)</li>
                <li>Tutorial series: "[Title]" on YouTube (playlist)</li>
            </ul>`
        },

        // ─────────────────────────────────────────────────────────
        // 14. KEY TAKEAWAYS
        // Purpose: Concise summary of the most important points.
        //          The "TL;DR" for quick review and revision.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Core idea:</strong> [One sentence summarizing the concept]</li>
                <li><strong>When to use:</strong> [Situations where this applies]</li>
                <li><strong>When NOT to use:</strong> [Situations where alternatives are better]</li>
                <li><strong>Key benefit:</strong> [Primary advantage over alternatives]</li>
                <li><strong>Main risk:</strong> [Biggest pitfall if applied incorrectly]</li>
                <li><strong>Interview signal:</strong> [What mentioning this correctly signals to interviewers]</li>
            </ul>`
        },

        // ─────────────────────────────────────────────────────────
        // 15. EXERCISE
        // Purpose: Hands-on coding exercise for the reader.
        //          Includes a problem statement and starter code.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Exercise',
            content: `<h4>Challenge: Implement a [Component Name]</h4>
            <p>Build a working implementation that demonstrates [concept].
            Your solution should:</p>
            <ol>
                <li>Accept [input type] as input</li>
                <li>Process it using [the technique from this topic]</li>
                <li>Return [expected output] with proper error handling</li>
                <li>Include at least 3 unit tests covering happy path and edge cases</li>
            </ol>
            <h4>Starter Code</h4>`,
            code: `// TODO: Implement the following interface
interface DataProcessor<T> {
    process(input: T): Promise<Result<T>>;
    validate(input: T): ValidationResult;
}

// Your implementation here:
class ConcreteProcessor implements DataProcessor<UserInput> {
    process(input: UserInput): Promise<Result<UserInput>> {
        // Step 1: Validate input
        // Step 2: Apply transformation
        // Step 3: Return result
        throw new Error('Not implemented');
    }

    validate(input: UserInput): ValidationResult {
        // Implement validation logic
        throw new Error('Not implemented');
    }
}

// Bonus: Write tests for your implementation`,
            language: 'typescript'
        },

        // ─────────────────────────────────────────────────────────
        // 16. KNOWLEDGE CHECK
        // Purpose: Quick self-assessment quiz questions.
        //          Helps readers verify their understanding.
        // ─────────────────────────────────────────────────────────
        {
            title: 'Knowledge Check',
            content: `<p>Test your understanding with these questions:</p>
            <ol>
                <li><strong>Q:</strong> What is the primary purpose of [concept]?<br/>
                    <em>A: [concise answer]</em></li>
                <li><strong>Q:</strong> Name three scenarios where [concept] is preferable to [alternative].<br/>
                    <em>A: [scenario 1], [scenario 2], [scenario 3]</em></li>
                <li><strong>Q:</strong> What is the time complexity of [operation] in [concept]?<br/>
                    <em>A: O(log n) average, O(n) worst case</em></li>
                <li><strong>Q:</strong> What is the biggest risk of misapplying [concept]?<br/>
                    <em>A: [risk description with concrete example]</em></li>
            </ol>`
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // INTERVIEW QUESTIONS
    // ═══════════════════════════════════════════════════════════════
    // Array of question objects. Each question tests understanding
    // of the topic at a specific difficulty level.
    //
    // Required fields:
    //   question      — The interview question text
    //   difficulty    — 'easy' | 'medium' | 'hard'
    //   answer        — HTML string with the model answer
    //
    // Optional fields (all recommended for complete coverage):
    //   explanation   — Plain-text analogy or simplified explanation
    //   code          — Code example demonstrating the answer
    //   language      — Language of the code block
    //   bestPractices — Array of strings: recommended approaches
    //   commonMistakes — Array of strings: pitfalls to avoid
    //   interviewTip  — String: coaching for the candidate
    //   followUp      — Array of strings: likely follow-up questions
    //   seniorPerspective   — String: how a senior engineer would elaborate
    //   architectPerspective — String: system-level / architectural view
    //   mermaid       — Optional mermaid diagram for visual answers

    questions: [
        {
            question: 'Explain [concept] and when you would use it in production.',

            difficulty: 'medium',
            // 'easy' = factual recall, 'medium' = application, 'hard' = design/trade-offs

            answer: `<p><strong>[Concept]</strong> is [precise definition]. It is used when
            [specific conditions apply], particularly in systems that require
            [key quality attribute].</p>
            <p>Key characteristics:</p>
            <ul>
                <li>[Characteristic 1 with explanation]</li>
                <li>[Characteristic 2 with explanation]</li>
                <li>[Characteristic 3 with explanation]</li>
            </ul>`,

            explanation: 'Think of [concept] like [real-world analogy]. Just as [analogy explains mechanism], [concept] works by [simplified technical explanation].',

            code: `// Demonstrate the concept with a clear, production-quality example
public class ExampleService
{
    private readonly ILogger<ExampleService> _logger;
    private readonly IRepository<Order> _orders;

    public ExampleService(ILogger<ExampleService> logger, IRepository<Order> orders)
    {
        _logger = logger;
        _orders = orders;
    }

    public async Task<Result<Order>> ProcessOrder(OrderRequest request)
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(request.CustomerId))
            return Result<Order>.Failure("Customer ID is required");

        // Apply the concept
        var order = Order.Create(request);
        await _orders.AddAsync(order);

        _logger.LogInformation("Order {OrderId} created for {CustomerId}",
            order.Id, request.CustomerId);

        return Result<Order>.Success(order);
    }
}`,

            language: 'csharp',

            bestPractices: [
                'Always validate inputs before applying the pattern',
                'Use dependency injection to keep components testable',
                'Log meaningful context at appropriate severity levels',
                'Return result types instead of throwing exceptions for expected failures',
                'Keep implementations focused — one responsibility per class'
            ],

            commonMistakes: [
                'Applying the pattern where a simpler solution would suffice',
                'Forgetting to handle edge cases (null, empty, concurrent access)',
                'Tight coupling to concrete implementations instead of interfaces',
                'Missing error handling that causes silent failures in production',
                'Not considering thread safety in multi-threaded environments'
            ],

            interviewTip: 'Start by explaining the problem the concept solves, then describe the mechanism, and finish with trade-offs. Mentioning production experience with specific scale numbers elevates your answer.',

            followUp: [
                'How would this change in a distributed system?',
                'What are the performance implications at scale?',
                'How would you test this in isolation?',
                'What monitoring would you add around this in production?'
            ],

            seniorPerspective: 'In production systems handling 10K+ RPS, I have applied [concept] to solve [specific problem]. The key insight is that [nuanced technical point]. The most common failure mode is [specific failure], which we mitigate with [strategy].',

            architectPerspective: 'At the system level, [concept] influences how we partition responsibilities across services. When designing for [scale], this pattern enables [architectural benefit] but requires careful attention to [cross-cutting concern like observability, consistency, or fault tolerance].',

            mermaid: `sequenceDiagram
    participant C as Client
    participant S as Service
    participant R as Repository
    participant D as Database
    C->>S: ProcessOrder(request)
    S->>S: Validate input
    S->>R: AddAsync(order)
    R->>D: INSERT INTO Orders
    D-->>R: Success
    R-->>S: Order created
    S-->>C: Result.Success(order)`
        }
    ]
});
