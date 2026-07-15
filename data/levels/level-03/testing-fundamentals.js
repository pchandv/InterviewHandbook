/* ═══════════════════════════════════════════════════════════════════
   TESTING FUNDAMENTALS — Level 3: Engineering Principles
   Test pyramid, TDD, AAA, test doubles, coverage, and writing
   tests that give confidence without becoming a maintenance burden.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('testing-fundamentals', {

    title: 'Testing Fundamentals',
    level: 3,
    group: 'clean-code',
    description: 'The test pyramid, unit vs integration vs E2E, TDD, Arrange-Act-Assert, test doubles (mock/stub/fake), coverage realities, and writing maintainable tests.',
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    prerequisites: ['clean-code-naming'],

    sections: [

        // ─── 1. INTRODUCTION ──────────────────────────────────────────
        {
            title: 'Introduction',
            content: `<p><strong>Testing</strong> is how we gain confidence that code works correctly and stays correct
            as it changes. Automated tests catch regressions, document expected behavior, and enable
            fearless refactoring. They are the safety net that lets teams move fast without breaking things.</p>
            <p>But not all tests are equal. Good tests are fast, reliable, and focused on behavior. Bad tests
            are slow, flaky, and coupled to implementation — they cost more than they're worth. This module
            teaches you to write tests that pay off.</p>
            <p>In this module, you will learn:</p>
            <ul>
                <li>The test pyramid: unit, integration, and end-to-end tests</li>
                <li>Test-Driven Development (TDD) and the Red-Green-Refactor cycle</li>
                <li>The Arrange-Act-Assert (AAA) structure</li>
                <li>Test doubles: mocks, stubs, fakes, spies, dummies</li>
                <li>What code coverage tells you — and what it doesn't</li>
                <li>How to write maintainable tests that test behavior, not implementation</li>
            </ul>`
        },

        // ─── 2. CORE CONCEPTS ─────────────────────────────────────────
        {
            title: 'Core Concepts',
            content: `<p>The foundational concepts of automated testing:</p>
            <h4>The Test Pyramid</h4>
            <p>A guideline for test distribution. Many fast unit tests at the base, fewer integration
            tests in the middle, very few slow end-to-end tests at the top:</p>
            <ul>
                <li><strong>Unit tests:</strong> Test one unit (class/function) in isolation. Fast (ms),
                numerous, no external dependencies. The foundation.</li>
                <li><strong>Integration tests:</strong> Test components working together (with a real database,
                API, etc.). Slower, fewer.</li>
                <li><strong>End-to-end (E2E) tests:</strong> Test the whole system through its UI/API as a user
                would. Slowest, flakiest, fewest. Use sparingly for critical paths.</li>
            </ul>
            <h4>The Three A's (Arrange-Act-Assert)</h4>
            <p>The structure of a good test: <strong>Arrange</strong> the inputs and dependencies,
            <strong>Act</strong> by invoking the behavior under test, <strong>Assert</strong> the expected
            outcome. One logical assertion per test.</p>
            <h4>Test Doubles</h4>
            <p>Stand-ins for real dependencies, so a unit can be tested in isolation:</p>
            <ul>
                <li><strong>Dummy:</strong> passed but never used (fills a parameter)</li>
                <li><strong>Stub:</strong> returns canned answers to calls</li>
                <li><strong>Fake:</strong> a working but simplified implementation (in-memory database)</li>
                <li><strong>Mock:</strong> verifies that specific interactions occurred</li>
                <li><strong>Spy:</strong> records how it was called for later inspection</li>
            </ul>
            <h4>FIRST Principles</h4>
            <p>Good unit tests are <strong>F</strong>ast, <strong>I</strong>ndependent, <strong>R</strong>epeatable,
            <strong>S</strong>elf-validating, and <strong>T</strong>imely.</p>`,
            mermaid: `graph TB
    E2E["End-to-End Tests<br/>Few · Slow · High confidence"] 
    INT["Integration Tests<br/>Some · Medium speed"]
    UNIT["Unit Tests<br/>Many · Fast · Isolated"]
    E2E --- INT --- UNIT
    style E2E fill:#fecaca,color:#1e293b
    style INT fill:#fde68a,color:#1e293b
    style UNIT fill:#bbf7d0,color:#1e293b`
        },

        // ─── 3. HOW IT WORKS ──────────────────────────────────────────
        {
            title: 'How It Works',
            content: `<p>Test-Driven Development (TDD) follows a tight three-step cycle:</p>
            <ol>
                <li><strong>Red:</strong> Write a failing test that describes the behavior you want.
                It fails because the behavior doesn't exist yet. This proves the test can fail.</li>
                <li><strong>Green:</strong> Write the simplest code that makes the test pass — even if it's
                ugly. The goal is green, not elegant.</li>
                <li><strong>Refactor:</strong> Now improve the design (rename, extract, simplify) while
                keeping the test green. Tests give you the safety to clean up.</li>
            </ol>
            <p>Repeat this cycle in small increments. Each cycle adds one small piece of verified behavior.
            TDD produces a comprehensive test suite as a byproduct and tends to produce more testable,
            decoupled designs because you write the test (the caller) first.</p>`,
            code: `// TDD cycle for a password strength validator

// STEP 1 — RED: write the failing test first
[Fact]
public void IsStrong_PasswordUnder8Chars_ReturnsFalse()
{
    var validator = new PasswordValidator();
    Assert.False(validator.IsStrong("Ab1!"));   // fails — class doesn't exist yet
}

// STEP 2 — GREEN: simplest code to pass
public class PasswordValidator
{
    public bool IsStrong(string password) => password.Length >= 8;
}

// STEP 3 — add next failing test (RED), drive out more behavior
[Fact]
public void IsStrong_NoDigit_ReturnsFalse()
{
    var validator = new PasswordValidator();
    Assert.False(validator.IsStrong("Abcdefgh!"));   // 8+ chars but no digit
}

// GREEN: extend implementation
public bool IsStrong(string password) =>
    password.Length >= 8 &&
    password.Any(char.IsDigit);

// Continue: add tests for uppercase, special char... each Red→Green→Refactor.
// Final implementation emerges fully tested, driven by behavior.`,
            language: 'csharp'
        },

        // ─── 4. VISUAL DIAGRAM ────────────────────────────────────────
        {
            title: 'TDD Cycle',
            content: `<p>The Red-Green-Refactor loop that drives Test-Driven Development:</p>`,
            mermaid: `stateDiagram-v2
    [*] --> Red
    Red: RED — write a failing test
    Green: GREEN — make it pass simply
    Refactor: REFACTOR — improve design
    Red --> Green: test fails as expected
    Green --> Refactor: test passes
    Refactor --> Red: next behavior
    Refactor --> [*]: feature complete
    note right of Red
        Proves the test can fail
        Describes desired behavior
    end note
    note right of Refactor
        Tests stay green
        Safe to clean up
    end note`
        },

        // ─── 5. IMPLEMENTATION ────────────────────────────────────────
        {
            title: 'Implementation',
            content: `<p>Practical test patterns: AAA structure, test doubles, parameterized tests, and integration tests:</p>`,
            tabs: [
                {
                    label: 'AAA + Test Doubles (C#)',
                    code: `// xUnit + NSubstitute — Arrange, Act, Assert with a stub and a mock
public class OrderServiceTests
{
    [Fact]
    public async Task PlaceOrder_ValidOrder_SavesAndReturnsId()
    {
        // Arrange
        var repository = Substitute.For<IOrderRepository>();   // mock (verify interaction)
        var pricing = Substitute.For<IPricingService>();       // stub (canned answer)
        pricing.CalculateTotal(Arg.Any<Order>()).Returns(150m);
        var service = new OrderService(repository, pricing);
        var request = new OrderRequest("cust-1", new[] { new Item("p1", 2) });

        // Act
        var orderId = await service.PlaceOrder(request);

        // Assert
        Assert.NotEqual(Guid.Empty, orderId);
        await repository.Received(1).AddAsync(
            Arg.Is<Order>(o => o.Total == 150m));   // verify the interaction
    }

    [Fact]
    public async Task PlaceOrder_EmptyItems_ThrowsValidationException()
    {
        // Arrange
        var service = new OrderService(
            Substitute.For<IOrderRepository>(),
            Substitute.For<IPricingService>());
        var request = new OrderRequest("cust-1", Array.Empty<Item>());

        // Act + Assert
        await Assert.ThrowsAsync<ValidationException>(
            () => service.PlaceOrder(request));
    }
}`,
                    language: 'csharp'
                },
                {
                    label: 'Parameterized Tests',
                    code: `// Data-driven tests — one test method, many cases (xUnit Theory)
public class PasswordValidatorTests
{
    [Theory]
    [InlineData("Ab1!xyzQ", true)]    // valid: 8 chars, upper, digit, special
    [InlineData("short1!", false)]    // too short
    [InlineData("alllower1!", false)] // no uppercase
    [InlineData("NODIGITS!", false)]  // no digit
    [InlineData("NoSpecial1", false)] // no special char
    public void IsStrong_VariousInputs_ReturnsExpected(string password, bool expected)
    {
        var validator = new PasswordValidator();
        Assert.Equal(expected, validator.IsStrong(password));
    }

    // MemberData for complex objects
    public static IEnumerable<object[]> DiscountCases => new[]
    {
        new object[] { 100m, 0,    100m },   // no discount
        new object[] { 1000m, 1,   900m },   // 10% loyalty tier 1
        new object[] { 1000m, 2,   800m },   // 20% loyalty tier 2
    };

    [Theory]
    [MemberData(nameof(DiscountCases))]
    public void ApplyDiscount_ByTier_ReturnsExpected(decimal amount, int tier, decimal expected)
        => Assert.Equal(expected, new Pricing().ApplyDiscount(amount, tier));
}`,
                    language: 'csharp'
                },
                {
                    label: 'Integration Test',
                    code: `// Integration test with a real (containerized) database via Testcontainers
public class OrderRepositoryIntegrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _db = new PostgreSqlBuilder()
        .WithImage("postgres:16")
        .Build();

    public async Task InitializeAsync()
    {
        await _db.StartAsync();
        await RunMigrations(_db.GetConnectionString());
    }

    public Task DisposeAsync() => _db.DisposeAsync().AsTask();

    [Fact]
    public async Task AddAndRetrieve_RoundTripsOrder()
    {
        // Arrange — real repository against real (test) DB
        var repo = new OrderRepository(_db.GetConnectionString());
        var order = Order.Create("cust-1", new[] { new Item("p1", 2) });

        // Act
        await repo.AddAsync(order);
        var retrieved = await repo.GetByIdAsync(order.Id);

        // Assert — verifies real SQL mapping, constraints, serialization
        Assert.NotNull(retrieved);
        Assert.Equal("cust-1", retrieved.CustomerId);
        Assert.Single(retrieved.Items);
    }
}`,
                    language: 'csharp'
                },
                {
                    label: 'Frontend (Jest/TS)',
                    code: `// Jest unit test for a pure function + a component behavior test
import { calculateCartTotal } from './cart';

describe('calculateCartTotal', () => {
    it('sums item prices times quantities', () => {
        const items = [
            { price: 10, quantity: 2 },
            { price: 5, quantity: 3 },
        ];
        expect(calculateCartTotal(items)).toBe(35);
    });

    it('applies free shipping over threshold', () => {
        const items = [{ price: 100, quantity: 1 }];
        expect(calculateCartTotal(items, { freeShippingOver: 50 })).toBe(100);
    });

    it('returns 0 for an empty cart', () => {
        expect(calculateCartTotal([])).toBe(0);
    });
});

// Component test (Testing Library) — test behavior, not implementation
import { render, screen, fireEvent } from '@testing-library/react';

it('shows error when submitting empty form', async () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
});`,
                    language: 'typescript'
                }
            ]
        },

        // ─── 6. BEST PRACTICES ────────────────────────────────────────
        {
            title: 'Best Practices',
            content: `<h4>Do: Test Behavior, Not Implementation</h4>
            <p>Assert on observable outcomes (return values, state changes, outputs), not internal method
            calls. Tests coupled to implementation break during refactoring even when behavior is correct.</p>
            <h4>Do: Follow the Test Pyramid</h4>
            <p>Lots of fast unit tests, some integration tests, few E2E tests. An inverted pyramid (mostly
            slow E2E tests) gives slow, flaky feedback that teams learn to ignore.</p>
            <h4>Do: Write Descriptive Test Names</h4>
            <p>A test name should describe scenario and expected result so a failure tells you what broke
            without reading the body: <code>Withdraw_InsufficientFunds_ThrowsException</code>.</p>
            <h4>Do: Keep Tests Independent</h4>
            <p>Each test must run in isolation, in any order, with no shared mutable state. Order-dependent
            tests are a source of mysterious flakiness.</p>
            <h4>Do: One Logical Assertion per Test</h4>
            <p>Each test should verify one behavior. Multiple unrelated assertions make failures ambiguous.
            Multiple assertions checking one logical outcome are fine.</p>
            <h4>Do: Make Tests Fast and Deterministic</h4>
            <p>Unit tests should run in milliseconds. Avoid sleeps, real network/clock/random. Inject
            time and randomness so tests are repeatable.</p>`,
            callout: {
                type: 'tip',
                title: 'Test Behavior Through the Public API',
                text: 'Write tests against the public interface of a unit, treating internals as a black box. This lets you freely refactor the internals without rewriting tests. If you find yourself wanting to test a private method, it often signals that method should be its own class with its own public API.'
            }
        },

        // ─── 7. COMMON MISTAKES ───────────────────────────────────────
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Testing Implementation Details</h4>
            <p>Over-mocking and asserting on internal calls ("was method X called?") couples tests to
            structure. These tests break on every refactor and provide false confidence.</p>
            <h4>Mistake: The Inverted Test Pyramid (Ice Cream Cone)</h4>
            <p>Relying mostly on slow, flaky E2E tests with few unit tests. Feedback is slow, failures are
            hard to diagnose, and the suite becomes so unreliable that teams ignore it.</p>
            <h4>Mistake: Chasing 100% Coverage</h4>
            <p>Coverage measures lines executed, not behavior verified. You can have 100% coverage with
            assertion-free tests. High coverage of meaningless tests is worse than focused tests of
            important behavior.</p>
            <h4>Mistake: Flaky Tests</h4>
            <p>Tests that pass and fail randomly (timing, ordering, shared state, real network) destroy
            trust. A flaky suite gets ignored, defeating its purpose. Fix or quarantine flaky tests immediately.</p>
            <h4>Mistake: Overusing Mocks</h4>
            <p>Mocking everything creates tests that verify your mocks, not your code. Prefer real objects
            or fakes where practical; mock only true external boundaries (network, time, randomness).</p>
            <h4>Mistake: Tests with No Assertions</h4>
            <p>A test that calls code but asserts nothing passes as long as no exception is thrown — giving
            false confidence and inflating coverage. Every test must verify an outcome.</p>`,
            code: `// BAD: tests implementation details, breaks on refactor, over-mocked
[Fact]
public void Fragile()
{
    var step1 = Substitute.For<IStep1>();
    var step2 = Substitute.For<IStep2>();
    var sut = new Processor(step1, step2);
    sut.Run(input);
    step1.Received().DoFirst();    // verifies internal orchestration
    step2.Received().DoSecond();   // breaks if we restructure internals
}

// GOOD: tests observable behavior, survives refactoring
[Fact]
public void Run_ValidInput_ProducesExpectedResult()
{
    var sut = new Processor();          // real object, no mocks
    var result = sut.Run(input);
    Assert.Equal(expectedOutput, result);   // checks WHAT, not HOW
}`,
            language: 'csharp'
        },

        // ─── 8. REAL-WORLD APPLICATIONS ───────────────────────────────
        {
            title: 'Real-World Applications',
            content: `<p>How testing practices show up in production engineering:</p>
            <h4>CI/CD Gates</h4>
            <p>Tests run automatically on every pull request and block merges if they fail. Fast unit
            tests give developers feedback in seconds; the test suite is the quality gate that lets teams
            deploy many times per day with confidence.</p>
            <h4>Regression Prevention</h4>
            <p>When a bug is found, teams write a failing test that reproduces it, then fix the code.
            The test stays forever, preventing that bug from ever returning. The suite accumulates
            institutional knowledge.</p>
            <h4>Enabling Refactoring</h4>
            <p>A strong test suite is what makes continuous refactoring safe. Teams with good tests
            improve their code constantly; teams without them are afraid to touch anything.</p>
            <h4>Living Documentation</h4>
            <p>Well-named tests document how the system is supposed to behave — and unlike comments, they
            can't go stale because they run. New engineers read tests to understand expected behavior.</p>
            <h4>Financial & Safety-Critical Systems</h4>
            <p>Banking, medical, and aerospace software relies on extensive testing (often with mandated
            coverage and formal verification) because failures are catastrophic. Property-based and
            mutation testing are common in these domains.</p>`
        },

        // ─── 9. COMPARISON ────────────────────────────────────────────
        {
            title: 'Comparison',
            content: `<p>Comparing the three test levels and their trade-offs:</p>`,
            table: {
                headers: ['Aspect', 'Unit Tests', 'Integration Tests', 'End-to-End Tests'],
                rows: [
                    ['Scope', 'One class/function', 'Several components', 'Whole system'],
                    ['Speed', 'Milliseconds', 'Seconds', 'Seconds to minutes'],
                    ['Dependencies', 'Mocked/none', 'Some real (DB, API)', 'All real'],
                    ['Reliability', 'Very high', 'Medium', 'Lower (flaky)'],
                    ['Failure diagnosis', 'Pinpoints exact unit', 'Narrows to area', 'Broad — hard to locate'],
                    ['Confidence per test', 'Low (narrow)', 'Medium', 'High (realistic)'],
                    ['Quantity', 'Many (hundreds+)', 'Some (dozens)', 'Few (handful)'],
                    ['Maintenance cost', 'Low', 'Medium', 'High'],
                    ['Best for', 'Logic, edge cases', 'Wiring, data access', 'Critical user journeys']
                ]
            }
        },

        // ─── 10. PERFORMANCE ──────────────────────────────────────────
        {
            title: 'Performance',
            content: `<p>Test suite performance directly affects developer productivity:</p>
            <h4>Fast Feedback Loops</h4>
            <p>Unit tests should complete in seconds for the whole suite. Slow tests get run less often,
            delaying feedback and letting bugs slip further down the pipeline where they cost more to fix.</p>
            <h4>Keeping the Suite Fast</h4>
            <ul>
                <li>Keep unit tests free of I/O (no real DB, network, filesystem)</li>
                <li>Run integration/E2E tests in parallel where possible</li>
                <li>Use in-memory fakes or Testcontainers efficiently (share containers per test class)</li>
                <li>Split test tiers: run unit tests on every save, integration/E2E on CI</li>
            </ul>
            <h4>Parallelization</h4>
            <p>Independent tests can run in parallel across cores/agents, cutting wall-clock time dramatically.
            This requires tests to have no shared mutable state — another reason for test independence.</p>
            <h4>Test Selection</h4>
            <p>Large codebases use test impact analysis to run only tests affected by a change, providing
            fast local feedback while CI runs the full suite.</p>`,
            callout: {
                type: 'warning',
                title: 'Slow Tests Get Ignored',
                text: 'A test suite that takes 30 minutes to run will not be run before every commit — developers route around it, and its value collapses. Guard suite speed aggressively. A fast, trusted suite that runs constantly catches far more than a comprehensive suite that runs rarely.'
            }
        },

        // ─── 11. TESTING ──────────────────────────────────────────────
        {
            title: 'Testing the Tests (Quality)',
            content: `<p>How do you know your tests are actually good? Several techniques assess test quality:</p>
            <h4>Mutation Testing</h4>
            <p>Tools (Stryker, PIT) deliberately introduce small bugs ("mutations") into your code and check
            if your tests catch them. If a mutation survives (tests still pass), your tests have a gap.
            Mutation score is a far better quality signal than line coverage.</p>
            <h4>Coverage as a Floor, Not a Goal</h4>
            <p>Coverage tells you what code was executed, not what was verified. Use it to find untested
            code (a useful floor), but don't treat a coverage percentage as the goal — focus on covering
            important behavior and edge cases.</p>
            <h4>Property-Based Testing</h4>
            <p>Instead of hand-picked examples, generate many random inputs and assert properties that
            should always hold (e.g., "encoding then decoding returns the original"). Tools: FsCheck,
            QuickCheck, fast-check. Discovers edge cases you'd never think to write.</p>
            <h4>Review Tests Like Production Code</h4>
            <p>Tests are code too. Review them for clarity, independence, and whether they test behavior.
            A confusing test is a liability.</p>`,
            code: `// Property-based test (FsCheck) — assert an invariant over many random inputs
[Property]
public bool Reversing_A_List_Twice_Yields_Original(List<int> input)
{
    var result = Reverse(Reverse(input));
    return result.SequenceEqual(input);   // must hold for ANY input
}

// Property: a sorted list is ordered and same length/contents
[Property]
public bool Sort_Produces_Ordered_Permutation(int[] input)
{
    var sorted = MySort(input);
    var isOrdered = sorted.Zip(sorted.Skip(1), (a, b) => a <= b).All(x => x);
    var samaMultiset = sorted.OrderBy(x => x).SequenceEqual(input.OrderBy(x => x));
    return isOrdered && samaMultiset;
}
// FsCheck runs these with 100s of generated inputs, shrinking failures
// to the minimal reproducing case — surfacing edge cases example tests miss.`,
            language: 'csharp'
        },

        // ─── 12. INTERVIEW TIPS ───────────────────────────────────────
        {
            title: 'Interview Tips',
            content: `<p>Testing comes up in nearly every engineering interview:</p>
            <ul>
                <li><strong>Know the pyramid:</strong> Be able to explain unit vs integration vs E2E and why
                the distribution matters</li>
                <li><strong>Distinguish test doubles:</strong> Mock vs stub is a classic question. Stub provides
                canned data; mock verifies interactions</li>
                <li><strong>Explain TDD honestly:</strong> Know Red-Green-Refactor; have a balanced view on when
                TDD helps and when it doesn't</li>
                <li><strong>Critique coverage:</strong> Show you understand coverage ≠ quality. Mention mutation
                testing for a senior signal</li>
                <li><strong>Test behavior, not implementation:</strong> This principle separates engineers who
                write maintainable tests from those who write brittle ones</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Mock vs Stub — The Classic Question',
                text: 'A stub provides canned answers to calls (state verification: "given this input, assert this output"). A mock additionally verifies that expected interactions occurred (behavior verification: "assert method X was called once with Y"). Overusing mocks couples tests to implementation; prefer stubs/fakes and reserve mocks for true boundaries.'
            }
        },

        // ─── 13. FURTHER READING ──────────────────────────────────────
        {
            title: 'Further Reading',
            content: `<p>Essential testing resources:</p>
            <h4>Books</h4>
            <ul>
                <li><em>Test-Driven Development by Example</em> by Kent Beck — the foundational TDD text</li>
                <li><em>Unit Testing Principles, Practices, and Patterns</em> by Vladimir Khorikov — modern, pragmatic</li>
                <li><em>Growing Object-Oriented Software, Guided by Tests</em> by Freeman & Pryce — TDD at scale</li>
                <li><em>xUnit Test Patterns</em> by Gerard Meszaros — the test double taxonomy</li>
            </ul>
            <h4>Articles</h4>
            <ul>
                <li>Martin Fowler: "Mocks Aren't Stubs", "TestPyramid", "UnitTest"</li>
                <li>Google Testing Blog — practical testing at scale</li>
                <li>Kent C. Dodds: "Testing Trophy" (a frontend-oriented alternative to the pyramid)</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li><strong>.NET:</strong> xUnit, NUnit, NSubstitute/Moq, FluentAssertions, Testcontainers, Stryker.NET</li>
                <li><strong>JS/TS:</strong> Jest, Vitest, Testing Library, Playwright, fast-check</li>
                <li><strong>Coverage:</strong> Coverlet, Istanbul; <strong>Mutation:</strong> Stryker, PIT</li>
            </ul>`
        },

        // ─── 14. KEY TAKEAWAYS ────────────────────────────────────────
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Core idea:</strong> Automated tests give confidence code works and stays correct, enabling fearless change</li>
                <li><strong>Test pyramid:</strong> Many fast unit tests, some integration, few E2E — not the inverted "ice cream cone"</li>
                <li><strong>Structure:</strong> Arrange-Act-Assert; one logical assertion; descriptive names; FIRST principles</li>
                <li><strong>TDD:</strong> Red (failing test) → Green (make it pass) → Refactor (improve design)</li>
                <li><strong>Test doubles:</strong> Stub returns data; mock verifies interactions; fake is a working simplification</li>
                <li><strong>Golden rule:</strong> Test behavior through the public API, not implementation details</li>
                <li><strong>Coverage:</strong> A floor for finding untested code, not a quality goal — mutation testing measures real quality</li>
                <li><strong>Interview signal:</strong> Mock vs stub, coverage ≠ quality, and "test behavior not implementation" show depth</li>
            </ul>`
        },

        // ─── 15. EXERCISE ─────────────────────────────────────────────
        {
            title: 'Exercise',
            content: `<h4>Challenge: TDD a Shopping Cart with Discounts</h4>
            <p>Build a shopping cart using Test-Driven Development. Drive the implementation entirely from tests:</p>
            <ol>
                <li>Start with a failing test: empty cart total is 0 (Red → Green)</li>
                <li>Add tests one at a time, implementing the minimum to pass each:
                    <ul>
                        <li>Adding an item increases the total by price × quantity</li>
                        <li>A 10% discount applies when subtotal exceeds 100</li>
                        <li>A coupon code "SAVE20" subtracts a flat 20 (but never below 0)</li>
                        <li>Removing an item updates the total</li>
                    </ul>
                </li>
                <li>Use parameterized tests for the discount tiers</li>
                <li>Refactor after each green test — keep the suite passing</li>
                <li>Use a test double for any external dependency (e.g., a coupon-validation service)</li>
            </ol>
            <h4>Starter (write the first test, then the code)</h4>`,
            code: `// Begin with the simplest failing test — let it drive the API into existence.

public class ShoppingCartTests
{
    [Fact]
    public void Total_EmptyCart_IsZero()
    {
        var cart = new ShoppingCart();
        Assert.Equal(0m, cart.Total);
    }

    // TODO next tests (write ONE, make it pass, refactor, repeat):
    // [Fact] AddItem_IncreasesTotalByPriceTimesQuantity
    // [Theory] Discount applies over threshold (parameterize subtotal → expected)
    // [Fact] Coupon_SAVE20_SubtractsTwenty_NeverBelowZero
    // [Fact] RemoveItem_UpdatesTotal
}

// Implement ShoppingCart incrementally — only enough to pass each test.
public class ShoppingCart
{
    public decimal Total => 0m;   // start here; tests will force you to grow it
}`,
            language: 'csharp'
        },

        // ─── 16. KNOWLEDGE CHECK ──────────────────────────────────────
        {
            title: 'Knowledge Check',
            content: `<p>Test your understanding of testing fundamentals:</p>
            <ol>
                <li><strong>Q:</strong> Why should the test pyramid have many unit tests and few E2E tests?<br/>
                    <em>A: Unit tests are fast, reliable, and pinpoint failures, giving quick feedback. E2E tests
                    are slow, flaky, and hard to diagnose. A base of unit tests with a thin layer of E2E for
                    critical paths balances confidence with speed and reliability.</em></li>
                <li><strong>Q:</strong> What is the difference between a mock and a stub?<br/>
                    <em>A: A stub provides canned return values (state verification — assert outputs). A mock
                    additionally verifies that specific interactions happened (behavior verification — assert a
                    method was called). Overusing mocks couples tests to implementation.</em></li>
                <li><strong>Q:</strong> Why is 100% code coverage not a guarantee of good tests?<br/>
                    <em>A: Coverage measures which lines executed, not whether behavior was verified. You can
                    execute every line with tests that assert nothing. Coverage is useful for finding untested
                    code but is a poor measure of test quality — mutation testing is better.</em></li>
                <li><strong>Q:</strong> What does "test behavior, not implementation" mean and why does it matter?<br/>
                    <em>A: Assert on observable outcomes (return values, state, outputs) rather than internal calls
                    or structure. Tests coupled to implementation break during refactoring even when behavior is
                    correct, making them a maintenance burden and discouraging refactoring.</em></li>
            </ol>`
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // INTERVIEW QUESTIONS
    // ═══════════════════════════════════════════════════════════════
    questions: [
        {
            question: 'Explain the London (mockist) vs Chicago (classicist) schools of TDD. When would you use each?',
            difficulty: 'hard',
            answer: `<p>Two styles of test-driven development differing in how they isolate the unit under test:</p>
            <ul>
                <li><strong>Chicago / Classicist (state-based):</strong> test using real collaborators where practical,
                mock only true external boundaries (DB, network). Verify the <em>result/state</em>. Tests are more
                like small integration tests and survive refactoring well, but a failure can be harder to localize.</li>
                <li><strong>London / Mockist (interaction-based):</strong> isolate the unit by mocking all its
                collaborators, and verify the <em>interactions</em> (which methods were called). Pinpoints failures
                precisely and enables outside-in design, but couples tests to implementation \u2014 they break on harmless
                refactors and can verify mocks rather than real behavior.</li>
            </ul>
            <p><strong>When:</strong> Classicist is a good default for most domain/logic code (robust, behavior-focused).
            Mockist suits true boundaries and outside-in design of collaborator protocols \u2014 but over-mocking is a
            known fragility trap.</p>`,
            explanation: 'Classicist testing checks "did the right cake come out?" using real ingredients where it can. Mockist testing checks "did the baker call the oven, then the mixer, in order?" \u2014 precise about steps but brittle if you reorganize the kitchen without changing the cake.',
            code: `// Classicist (state-based): real collaborators, assert the result
var sut = new OrderService(new InMemoryRepository());  // real fake
var id = sut.Place(order);
Assert.Equal(OrderStatus.Placed, sut.Get(id).Status);  // verify STATE

// Mockist (interaction-based): mock collaborators, assert calls
var repo = Substitute.For<IOrderRepository>();
var sut2 = new OrderService(repo);
sut2.Place(order);
repo.Received(1).Add(Arg.Any<Order>());                // verify INTERACTION`,
            language: 'csharp',
            bestPractices: ['Default to state-based tests for robustness against refactoring', 'Reserve interaction verification for true boundaries (did we send the email?)', 'Prefer in-memory fakes over mocks where practical'],
            commonMistakes: ['Over-mocking until tests verify mocks, not behavior', 'Asserting internal call order that isn\u2019t part of the contract', 'Brittle tests that break on every refactor'],
            interviewTip: 'Frame it as state vs interaction verification and tie it back to the refactor-proof principle: heavy mocking couples tests to implementation. Knowing both schools by name signals depth.',
            followUp: ['When is verifying an interaction the right choice?', 'How does mockist TDD enable outside-in design?'],
            seniorPerspective: 'I lean classicist for the bulk of tests because they survive refactoring \u2014 which is the entire point of having a safety net. I use mocks deliberately at the edges where the <em>interaction</em> IS the behavior I care about (we genuinely must call the payment gateway / publish the event). Treating "test behavior, not implementation" as the north star naturally pushes you toward classicist by default and mockist only at boundaries.'
        },
        {
            question: 'What causes flaky tests, and how do you systematically eliminate them?',
            difficulty: 'hard',
            answer: `<p>A <strong>flaky test</strong> passes and fails non-deterministically without code changes.
            Flakiness is corrosive: it erodes trust until the whole suite is ignored. Common causes and fixes:</p>
            <ul>
                <li><strong>Timing/async:</strong> fixed <code>sleep</code>s or racing on async completion. Fix with
                deterministic waits (poll-until-condition with timeout), controllable clocks, and proper awaiting.</li>
                <li><strong>Shared mutable state / test order dependence:</strong> tests leak state between each other.
                Fix with isolation \u2014 fresh state per test, no statics, parallel-safe.</li>
                <li><strong>Real external dependencies:</strong> network/DB/time/randomness. Fix by injecting clock and
                RNG, and using fakes/Testcontainers instead of live services.</li>
                <li><strong>Concurrency/ordering assumptions:</strong> asserting on unordered results. Fix by asserting
                on sets/sorted output.</li>
                <li><strong>Resource leaks / ports:</strong> shared ports or unclosed resources. Fix with dynamic
                ports and proper teardown.</li>
            </ul>
            <p><strong>Process:</strong> quarantine the flaky test immediately (so it stops blocking CI), track it as a
            bug, reproduce by running it many times / under load, fix the root cause (don\u2019t just add a retry), then
            re-enable. Treat flakiness as a defect, not background noise.</p>`,
            explanation: 'A flaky test is a fire alarm that goes off randomly: soon everyone ignores it, including when there\u2019s a real fire. The fixes almost always come down to removing nondeterminism \u2014 control time, randomness, ordering, and shared state so the test gives the same answer every run.',
            code: `// FLAKY: fixed sleep races with async work
await Task.Delay(200);
Assert.True(_done);                 // sometimes not done yet

// ROBUST: poll until a condition with a timeout (deterministic outcome)
await WaitUntil(() => _done, timeout: TimeSpan.FromSeconds(5));
Assert.True(_done);

// Inject time/randomness instead of using DateTime.Now / new Random()
public ReportService(IClock clock) { _clock = clock; }   // controllable in tests`,
            language: 'csharp',
            bestPractices: ['Inject clock and RNG; never use real time/randomness in tests', 'Replace sleeps with poll-until-condition waits', 'Isolate state per test; make tests parallel-safe', 'Quarantine + track flaky tests as bugs; fix root cause'],
            commonMistakes: ['"Fixing" flakiness by adding test retries (hides the bug)', 'Shared static state causing order dependence', 'Asserting on unordered collections', 'Hitting real network/DB/time'],
            interviewTip: 'Stress that flakiness is a defect that destroys suite trust, and that the fix is removing nondeterminism (time, randomness, ordering, shared state) \u2014 not adding retries. That distinction is the senior signal.',
            followUp: ['Why is auto-retrying flaky tests dangerous?', 'How do you make async tests deterministic?'],
            seniorPerspective: 'I treat a flaky test as a P2 bug, not noise, because a suite with even a few flaky tests trains the team to ignore red builds \u2014 which is how real regressions ship. The cardinal sin is "fixing" flakiness with automatic retries: that masks a genuine race or nondeterminism that may also bite in production. The durable fix is always making the test deterministic \u2014 inject the clock and RNG, poll instead of sleep, isolate state \u2014 so it gives the same verdict every single run.'
        },
        {
            question: 'Explain the test pyramid. Why does the shape matter?',
            difficulty: 'easy',
            answer: `<p>The <strong>test pyramid</strong> is a guideline for how to distribute automated tests across
            three levels:</p>
            <ul>
                <li><strong>Base — Unit tests (many):</strong> fast, isolated, test one unit. Run in milliseconds.</li>
                <li><strong>Middle — Integration tests (some):</strong> test components together with some real
                dependencies. Slower.</li>
                <li><strong>Top — E2E tests (few):</strong> test the whole system as a user would. Slowest, flakiest.</li>
            </ul>
            <p>The shape matters because each level trades speed/reliability for realism. Many fast unit
            tests give quick, precise feedback; a few E2E tests confirm the whole thing works end to end.
            An inverted pyramid (mostly E2E) produces slow, flaky, hard-to-diagnose suites that teams
            stop trusting.</p>`,
            explanation: 'Think of it like checking a car. Unit tests are like testing each part on a bench (fast, isolated). Integration tests check that the engine and transmission work together. E2E is a full test drive — most realistic but slow and you can only do a few. You want lots of cheap bench tests and a few test drives, not the reverse.',
            bestPractices: [
                'Push test logic down to the fastest level that can verify it',
                'Reserve E2E tests for critical user journeys',
                'Keep unit tests free of I/O so they stay fast'
            ],
            commonMistakes: [
                'The "ice cream cone" — mostly slow E2E tests, few unit tests',
                'Duplicating the same checks at every level',
                'Writing E2E tests for logic that a unit test could cover'
            ],
            interviewTip: 'Draw the pyramid and name the trade-off in one line: lower = faster and more precise, higher = more realistic but slower and flakier. Mention the inverted "ice cream cone" anti-pattern to show you know what goes wrong.',
            followUp: [
                'Where do you draw the line between a unit and an integration test?',
                'What is the "testing trophy" and how does it differ?'
            ]
        },

        {
            question: 'What is Test-Driven Development? What are its benefits and limitations?',
            difficulty: 'medium',
            answer: `<p><strong>TDD</strong> is a practice where you write a failing test <em>before</em> writing the
            production code, following the Red-Green-Refactor cycle:</p>
            <ol>
                <li><strong>Red:</strong> write a failing test describing the desired behavior</li>
                <li><strong>Green:</strong> write the simplest code to pass it</li>
                <li><strong>Refactor:</strong> improve the design while keeping tests green</li>
            </ol>
            <h4>Benefits</h4>
            <ul>
                <li>Produces a comprehensive test suite as a byproduct</li>
                <li>Forces testable, decoupled design (you write the caller first)</li>
                <li>Provides fast feedback and a refactoring safety net</li>
                <li>Clarifies requirements before coding</li>
            </ul>
            <h4>Limitations</h4>
            <ul>
                <li>Steep learning curve; feels slow at first</li>
                <li>Hard to apply to exploratory/spike work where the design is unknown</li>
                <li>Can lead to over-testing trivial code if applied dogmatically</li>
                <li>Doesn't replace integration/E2E testing or exploratory testing</li>
            </ul>`,
            explanation: 'TDD is like writing the answer key before the exam. By stating exactly what "correct" looks like first (the failing test), you stay focused on building only what is needed to satisfy it, and you end up with the answer key (test suite) for free.',
            bestPractices: [
                'Take small steps — one behavior per cycle',
                'Write the simplest code to pass; resist over-building',
                'Refactor every cycle while tests are green',
                'Use TDD where requirements are clear; relax it for spikes'
            ],
            commonMistakes: [
                'Writing too much code per cycle (big steps)',
                'Skipping the refactor step',
                'Applying TDD dogmatically to throwaway/exploratory code',
                'Testing implementation details, making tests brittle'
            ],
            interviewTip: 'Show a balanced, experienced view: explain Red-Green-Refactor clearly, then acknowledge TDD is not universal — it shines when requirements are clear and design benefits from being driven by tests, but exploratory work may need a spike first, then tests. Dogmatism is a red flag to interviewers.',
            followUp: [
                'When would you NOT use TDD?',
                'How does TDD influence software design?'
            ],
            seniorPerspective: 'I use TDD selectively. For well-understood logic with clear inputs and outputs — pricing rules, parsers, state machines — it is excellent and I reach for it naturally. For exploratory UI work or integrating an unfamiliar API, I spike first to learn the shape, then either keep the spike and back-fill tests or throw it away and TDD the real implementation. The dogma of "always TDD everything" causes more friction than value; the discipline of "always have good tests before merge" is what actually matters.'
        },

        {
            question: 'How do you write tests that do not break when you refactor? What makes tests maintainable?',
            difficulty: 'hard',
            answer: `<p>The key is to <strong>test behavior, not implementation</strong>. Tests should verify what
            the code does (observable outcomes) through its public interface, treating internals as a black box.</p>
            <h4>Practices for Maintainable, Refactor-Proof Tests</h4>
            <ul>
                <li><strong>Assert on outcomes, not interactions:</strong> check return values and state changes,
                not "was internal method X called". Reserve interaction verification for true boundaries.</li>
                <li><strong>Test through the public API:</strong> don't test private methods directly; if logic
                deserves its own tests, extract it into its own class with a public API.</li>
                <li><strong>Minimize mocking:</strong> over-mocking couples tests to structure. Use real objects
                or fakes; mock only external boundaries (network, time, randomness, third-party services).</li>
                <li><strong>Avoid asserting on incidental details:</strong> exact log messages, call counts, or
                internal ordering that aren't part of the contract.</li>
                <li><strong>Keep tests independent and clearly named:</strong> AAA structure, descriptive names,
                no shared mutable state.</li>
            </ul>
            <p>When tests verify behavior, you can freely restructure internals — extract methods, replace
            conditionals with polymorphism, rename — and the tests keep passing, proving behavior is preserved.</p>`,
            code: `// BRITTLE — coupled to implementation; breaks on harmless refactor
[Fact]
public void Brittle_ChecksInternalOrchestration()
{
    var validator = Substitute.For<IValidator>();
    var calculator = Substitute.For<ICalculator>();
    var repo = Substitute.For<IRepository>();
    var sut = new OrderService(validator, calculator, repo);

    sut.Process(order);

    Received.InOrder(() => {        // asserts internal call order!
        validator.Validate(order);
        calculator.Compute(order);
        repo.Save(order);
    });
    // Reordering or inlining any internal step breaks this test
    // even though the order is still processed correctly.
}

// MAINTAINABLE — verifies the observable outcome
[Fact]
public void Process_ValidOrder_PersistsWithComputedTotal()
{
    var repo = new InMemoryRepository();   // a fake, not a mock
    var sut = new OrderService(repo);

    sut.Process(new Order("c1", new[] { new Item(10m, 2) }));

    var saved = repo.GetByCustomer("c1");
    Assert.Equal(20m, saved.Total);        // checks WHAT happened, not HOW
}
// Internals can be refactored freely — this test only cares about the result.`,
            language: 'csharp',
            bestPractices: [
                'Verify observable behavior through the public API',
                'Use fakes (e.g., in-memory repo) over mocks where practical',
                'Mock only true external boundaries',
                'Avoid asserting on internal call order or counts unless that IS the contract'
            ],
            commonMistakes: [
                'Verifying internal method calls and ordering (Received.InOrder everywhere)',
                'Mocking every collaborator, ending up testing the mocks',
                'Testing private methods directly via reflection',
                'Asserting on incidental details like exact log text'
            ],
            interviewTip: 'State the principle crisply — "test behavior, not implementation" — then make it concrete with the mock-everything anti-pattern vs an in-memory fake. Explaining that this is what makes refactoring safe ties testing back to overall code health and signals senior judgment.',
            followUp: [
                'When IS it appropriate to verify interactions (use a mock)?',
                'How do you test code that depends on the current time or randomness?',
                'What is the relationship between good tests and good design?'
            ],
            seniorPerspective: 'The tests that survive years are the ones written against stable contracts — public APIs and observable behavior. I treat heavy mocking as a design smell: if a class needs five mocks to test, it usually has too many responsibilities or leaks its collaborators. I lean on in-memory fakes for repositories and gateways, inject the clock and random source so time-dependent logic is deterministic, and reserve true mocks for verifying that I genuinely called an external boundary (sent the email, published the event). This keeps the suite green through aggressive refactoring, which is the whole point of having it.'
        },

        {
            question: 'What is consumer-driven contract testing, and what problem does it solve that unit and end-to-end tests do not?',
            difficulty: 'advanced',
            answer: `<p><strong>Contract testing</strong> verifies that two services that communicate (a consumer and a provider)
            agree on the shape and semantics of their interaction — without spinning up both services together.
            In the <strong>consumer-driven</strong> variant, the consumer defines its expectations as a contract
            (e.g., "when I GET /orders/1 I expect this JSON shape"), and the provider runs tests that prove it
            still satisfies every consumer contract.</p>
            <h4>The gap it fills</h4>
            <ul>
                <li><strong>Unit tests with mocks</strong> verify each side against its <em>own assumptions</em> — but
                if the provider changes its response and the consumer's mock does not, both suites stay green
                while production breaks. Contract tests catch this drift.</li>
                <li><strong>End-to-end tests</strong> catch integration breaks but are slow, flaky, require a full
                environment, and combinatorially explode as services multiply.</li>
            </ul>
            <p>Contract testing gives integration-level confidence at unit-test speed, and pinpoints exactly which
            consumer a provider change would break — <em>before</em> deployment.</p>`,
            explanation: 'Mocks are like two people rehearsing a phone call alone, each imagining what the other will say. Both rehearsals go perfectly, yet the real call fails because their assumptions never matched. A contract is the agreed script both rehearse against, so a change to one side that breaks the script is caught immediately.',
            code: `// CONSUMER side (Pact-style): declare expectations, generate a contract file.
// The consumer test runs against a mock provider built from these expectations.
pact.AddInteraction(new
{
    state = "order 1 exists",
    uponReceiving = "a request for order 1",
    withRequest = new { method = "GET", path = "/orders/1" },
    willRespondWith = new
    {
        status = 200,
        body = new { id = 1, total = 42.50m, status = "Pending" } // expected shape
    }
});
// Passing this test publishes a contract describing exactly what the consumer needs.

// PROVIDER side: verify the REAL provider honors every published consumer contract.
[Fact]
public async Task Provider_Honors_All_Consumer_Contracts()
{
    // Pact replays each recorded request against the real provider and
    // asserts the actual response matches the agreed contract.
    var verifier = new PactVerifier();
    verifier
        .ServiceProvider("OrderService", providerBaseUri)
        .WithPactBrokerSource(brokerUri)        // pulls all consumer contracts
        .WithProviderStateUrl("/provider-states") // sets up "order 1 exists"
        .Verify();
    // If the provider drops a field or renames "total", THIS test fails,
    // naming the exact consumer that would break — before any deploy.
}`,
            language: 'csharp',
            bestPractices: [
                'Let consumers own the contract — providers verify against real consumer expectations',
                'Share contracts via a broker so providers test against all current consumers',
                'Gate provider deployment on verifying every active consumer contract (can-i-deploy checks)',
                'Use contract tests for service-to-service shape/semantics; keep a few E2E tests for critical journeys'
            ],
            commonMistakes: [
                'Relying on hand-written mocks of other services that silently drift from reality',
                'Testing implementation details instead of the observable request/response contract',
                'Letting contracts go stale by not re-verifying providers in CI',
                'Trying to replace all integration confidence with slow, flaky full E2E suites'
            ],
            interviewTip: 'The killer insight: mutually-mocked unit tests can both pass while integration is broken, because each side mocks its own assumptions. Contract testing closes that gap at unit-test speed and identifies exactly which consumer a change breaks. Mention Pact and can-i-deploy gates for a senior signal.',
            followUp: [
                'How does a contract broker enable safe independent deployments?',
                'How does contract testing fit alongside the test pyramid?',
                'What is the difference between consumer-driven and provider-driven contracts?'
            ],
            seniorPerspective: 'In a microservices estate I treat contract tests as the primary defense against integration regressions, with E2E reserved for a handful of revenue-critical journeys. The breakthrough is the can-i-deploy gate: a provider cannot ship a change until it has verified it still satisfies every consumer currently in production, which turns "did we break someone?" from a post-incident question into a pre-merge check.',
            architectPerspective: 'Contract testing operationalizes the API contract as an executable, versioned artifact shared between teams, enabling independent deployability — the core promise of microservices. Without it, teams either couple their release cycles (defeating the architecture) or discover breakages in production. The contract broker becomes the source of truth for who depends on what.'
        },

        {
            question: 'Compare mocks, stubs, fakes, and spies. When is each appropriate, and what are the risks of over-mocking?',
            difficulty: 'hard',
            answer: `<p>Each test double serves a different purpose: a <strong>stub</strong> provides canned return values so the system under test has predictable inputs — you use it for state-based verification ("given this data, assert this output"). A <strong>mock</strong> additionally records and verifies that specific interactions occurred — you use it for behavior-based verification ("assert this email was sent"). A <strong>fake</strong> is a working lightweight implementation (an in-memory repository, a local SMTP trap) that behaves realistically without the cost of the real dependency. A <strong>spy</strong> wraps a real or fake object and records calls for later inspection without changing behavior.</p>
            <p>The risk of over-mocking is that your tests verify your mocks rather than your code. When every collaborator is mocked and you assert call sequences, the tests become mirrors of the implementation: refactoring internals breaks them even when behavior is correct, giving false negatives and eroding trust in the suite. Over-mocked tests also give false confidence — if the mock's canned answers diverge from reality, you silently test against a fantasy world that passes locally but fails in production.</p>
            <p>A healthy strategy: prefer fakes for repositories and gateways (they catch real mapping/logic bugs), use stubs for simple data injection, reserve mocks strictly for verifying calls to true external boundaries (sending an email, publishing an event), and use spies when you need to assert details about a call without dictating behavior.</p>`,
            language: 'csharp',
            code: `// STUB — canned answer, no verification of how it was called
var pricing = Substitute.For<IPricingService>();
pricing.GetRate("USD").Returns(1.0m);   // just returns a value

// FAKE — lightweight working implementation
var repo = new InMemoryOrderRepository();  // Add/Get work for real, in memory
repo.Add(new Order("o1", 100m));
var found = repo.GetById("o1");            // exercises real logic, no DB needed

// MOCK — verifies interaction (use sparingly, at true boundaries)
var emailSender = Substitute.For<IEmailSender>();
service.PlaceOrder(order);
emailSender.Received(1).SendAsync(Arg.Is<Email>(e => e.To == order.Email));

// SPY — records without dictating behavior
var spy = new SpyLogger();   // captures log entries for inspection
service.Process(input);
Assert.Contains(spy.Entries, e => e.Level == "Warning");`,
            bestPractices: [
                'Default to fakes for repositories/gateways — they catch real bugs',
                'Use stubs for simple input injection (pricing rates, config values)',
                'Reserve mocks for true external side-effects you must verify happened (email, event publish)',
                'Keep mock assertions focused on the WHAT (was it called?), not internal ordering'
            ],
            commonMistakes: [
                'Mocking every collaborator, turning tests into implementation mirrors',
                'Verifying call sequences between internal components (breaks on refactor)',
                'Canned mock answers that silently diverge from the real dependency behavior',
                'Treating high mock count as normal instead of a design smell (too many dependencies)'
            ],
            interviewTip: 'Give a one-sentence definition of each double, then pivot to the key insight: over-mocking couples tests to structure rather than behavior, so you test refactoring stability rather than correctness. Name the boundary rule — mock only where the system meets the outside world.',
            followUp: [
                'If a class needs five mocks to test, what does that tell you about its design?',
                'How do fakes differ from in-memory database providers like EF InMemory?'
            ]
        },

        {
            question: 'What is mutation testing, and why does it provide a better signal about test quality than code coverage?',
            difficulty: 'hard',
            answer: `<p><strong>Mutation testing</strong> systematically introduces small faults ("mutants") into your production code — flipping operators, changing constants, removing statements, negating conditionals — and then runs your test suite against each mutant. If the tests fail (detect the mutant), it is "killed"; if they still pass, the mutant "survived," revealing a gap where your tests are not actually verifying the behavior that code provides. The mutation score (percentage killed) measures how thoroughly your tests actually <em>verify</em> correctness, not merely <em>execute</em> lines.</p>
            <p>Code coverage only tells you which lines were executed during tests — a test with zero assertions achieves coverage but verifies nothing. 100% line coverage is trivially achievable without detecting a single bug. Mutation testing exposes this: a surviving mutant means "I changed something meaningful and your tests did not care," directly identifying weak or assertion-free tests.</p>
            <p>In practice, mutation testing is computationally expensive (running the full suite per mutant), so teams apply it selectively — on critical domain logic, after major refactoring, or in CI on changed files only (incremental mutation). Tools like Stryker (.NET, JS) and PIT (Java) make it practical. A mutation score above 80% on core domain logic gives far more confidence than 100% line coverage.</p>`,
            language: 'csharp',
            code: `// Original code
public decimal ApplyDiscount(decimal total, bool isVip)
    => isVip ? total * 0.8m : total;

// MUTANT 1: change operator (0.8 → 0.9)
public decimal ApplyDiscount(decimal total, bool isVip)
    => isVip ? total * 0.9m : total;  // Does any test catch this?

// MUTANT 2: negate condition (isVip → !isVip)
public decimal ApplyDiscount(decimal total, bool isVip)
    => !isVip ? total * 0.8m : total; // Does any test catch this?

// If your test only checks the non-VIP path, MUTANT 1 survives (gap found!)
// If your test asserts exact values for both VIP and non-VIP, both die (good!)

// Stryker.NET output:
// Mutant survived: replaced 0.8m with 0.9m in ApplyDiscount
// → You need a test asserting the exact VIP discount amount

// A test with 100% coverage but NO assertions:
[Fact] public void Covered_But_Useless() {
    _ = service.ApplyDiscount(100m, true); // executes but verifies nothing
}
// Coverage: 100%. Mutation score: 0%. The metric that matters is mutation score.`,
            bestPractices: [
                'Run mutation testing on core domain logic where correctness matters most',
                'Use incremental mutation in CI (only mutate changed files) to keep builds fast',
                'Treat surviving mutants as concrete test improvement tasks, not abstract warnings',
                'Aim for high mutation score on critical paths; accept lower scores on glue code'
            ],
            commonMistakes: [
                'Chasing 100% line coverage and assuming tests are therefore strong',
                'Writing assertion-free tests that inflate coverage without verifying behavior',
                'Running full mutation on the entire codebase every build (too slow)',
                'Ignoring equivalent mutants (mutations that produce logically identical behavior)'
            ],
            interviewTip: 'The killer line: "Coverage tells you what was executed; mutation testing tells you what was actually verified." Give a concrete example of a survived mutant exposing a weak test. Mentioning Stryker or PIT shows you have used it, not just read about it.',
            followUp: [
                'What are equivalent mutants and why do they cause false negatives in mutation score?',
                'How do you make mutation testing practical in a large CI pipeline?'
            ]
        }
    ]
});
