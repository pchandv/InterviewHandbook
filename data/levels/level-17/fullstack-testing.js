'use strict';

PageData.register('fullstack-testing', {
  title: 'Testing Strategy (End-to-End)',
  description: 'Modern testing approaches for full-stack applications including contract testing, integration testing with containers, E2E automation, and CI/CD pipeline design.',
  sections: [
    {
      title: 'Introduction',
      content: `
        <p>The traditional testing pyramid (many unit tests, fewer integration tests, minimal E2E tests) is 
        being challenged by modern architectures. Microservices, SPAs with complex state, and distributed systems 
        require a <strong>testing diamond</strong> — emphasizing integration tests that verify component 
        interactions over isolated unit tests that mock everything.</p>
        <p>This topic covers how to design a testing strategy that maximizes confidence while minimizing 
        maintenance cost, including contract testing across service boundaries, container-based integration 
        testing, and intelligent E2E test selection.</p>
      `
    },
    {
      title: 'Core Concepts',
      content: `
        <h3>Testing Diamond vs Testing Pyramid</h3>
        <p>The <strong>pyramid</strong> (unit > integration > E2E) assumes unit tests are cheap and fast. 
        But in microservices, a unit test that mocks all dependencies proves very little. The 
        <strong>diamond</strong> model prioritizes integration tests that exercise real component interactions:</p>
        <ul>
          <li><strong>Top (few):</strong> E2E smoke tests — critical user journeys only</li>
          <li><strong>Middle (many):</strong> Integration tests with real dependencies (DB, queues, caches)</li>
          <li><strong>Bottom (moderate):</strong> Unit tests for complex business logic and algorithms</li>
        </ul>

        <h3>Contract Testing (Pact)</h3>
        <p>Consumer-driven contract testing verifies that service interfaces remain compatible without running 
        all services together. The <strong>consumer</strong> defines expectations (contracts), and the 
        <strong>provider</strong> verifies it can satisfy them. This decouples service deployment schedules.</p>

        <h3>Integration Tests with Testcontainers</h3>
        <p>Testcontainers spins up real Docker containers (PostgreSQL, Redis, Kafka, Elasticsearch) for 
        integration tests. Tests run against real infrastructure, not mocks, catching issues like SQL 
        dialect differences, serialization bugs, and connection pool behavior.</p>

        <h3>E2E with Playwright</h3>
        <p>Playwright provides cross-browser automation with auto-waiting, network interception, and 
        parallel execution. Key principle: E2E tests should cover <em>critical paths only</em> — login, 
        checkout, core workflows — not replicate unit test coverage at the UI level.</p>

        <h3>Test Data Management</h3>
        <ul>
          <li><strong>Factories:</strong> Programmatic test data creation with sensible defaults (Factory pattern)</li>
          <li><strong>Seeding:</strong> Known baseline data loaded before test suites</li>
          <li><strong>Isolation:</strong> Each test gets its own transaction (rolled back) or schema</li>
          <li><strong>Synthetic data:</strong> Generated data that mimics production distributions</li>
        </ul>

        <h3>Chaos Testing</h3>
        <p>Deliberately injecting failures (network latency, service crashes, disk full, clock skew) to 
        verify system resilience. Principles from Netflix's Chaos Monkey — run chaos experiments in 
        staging with monitoring to detect cascading failures before production.</p>
      `
    },
    {
      title: 'Testing Strategy Layers',
      content: `
        <p>This diagram shows how different testing layers interact in a CI/CD pipeline:</p>
        <div class="mermaid-diagram">
          <pre class="mermaid">
graph LR
    subgraph Dev["Developer Machine"]
        UT[Unit Tests<br/>Fast feedback]
        CT[Component Tests<br/>Single service + deps]
    end

    subgraph CI["CI Pipeline"]
        LINT[Lint + Static Analysis]
        UNIT[Unit Tests]
        INT[Integration Tests<br/>Testcontainers]
        CONTRACT[Contract Tests<br/>Pact Broker]
        E2E_SMOKE[E2E Smoke<br/>Critical paths]
    end

    subgraph Staging["Staging Environment"]
        E2E_FULL[Full E2E Suite]
        PERF[Performance Tests]
        CHAOS[Chaos Tests]
    end

    subgraph Prod["Production"]
        CANARY[Canary Monitoring]
        SYNTH[Synthetic Monitoring]
    end

    Dev -->|push| CI
    LINT --> UNIT --> INT --> CONTRACT --> E2E_SMOKE
    E2E_SMOKE -->|deploy| Staging
    E2E_FULL --> PERF --> CHAOS
    CHAOS -->|promote| Prod
          </pre>
        </div>
      `
    },
    {
      title: 'Contract Testing Flow',
      content: `
        <p>Consumer-driven contract testing workflow between services:</p>
        <div class="mermaid-diagram">
          <pre class="mermaid">
sequenceDiagram
    participant Consumer as Order Service<br/>(Consumer)
    participant Broker as Pact Broker
    participant Provider as Inventory Service<br/>(Provider)

    Consumer->>Consumer: Write consumer test<br/>Define expected interactions
    Consumer->>Broker: Publish contract (pact file)
    Note over Broker: Stores versioned contracts

    Provider->>Broker: Fetch contracts to verify
    Broker->>Provider: Return consumer expectations
    Provider->>Provider: Run provider verification<br/>Against real implementation
    Provider->>Broker: Publish verification result

    Note over Consumer,Provider: Both services can deploy<br/>independently if contracts pass
          </pre>
        </div>
      `
    },
    {
      title: 'Implementation',
      content: `
        <h3>Testcontainers Integration Test (C#)</h3>
        <pre><code class="language-csharp">using Testcontainers.PostgreSql;
using Xunit;

public class OrderRepositoryTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("orders_test")
        .WithUsername("test")
        .WithPassword("test")
        .Build();

    private OrderRepository _repository;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        var connectionString = _postgres.GetConnectionString();
        var dbContext = new OrderDbContext(
            new DbContextOptionsBuilder&lt;OrderDbContext&gt;()
                .UseNpgsql(connectionString)
                .Options);

        await dbContext.Database.MigrateAsync();
        _repository = new OrderRepository(dbContext);
    }

    public async Task DisposeAsync() => await _postgres.DisposeAsync();

    [Fact]
    public async Task CreateOrder_WithValidItems_PersistsCorrectly()
    {
        // Arrange
        var order = new Order
        {
            CustomerId = Guid.NewGuid(),
            Items = new List&lt;OrderItem&gt;
            {
                new() { ProductId = "SKU-001", Quantity = 2, UnitPrice = 29.99m },
                new() { ProductId = "SKU-002", Quantity = 1, UnitPrice = 49.99m }
            }
        };

        // Act
        var created = await _repository.CreateAsync(order);
        var retrieved = await _repository.GetByIdAsync(created.Id);

        // Assert
        Assert.NotNull(retrieved);
        Assert.Equal(2, retrieved.Items.Count);
        Assert.Equal(109.97m, retrieved.TotalAmount);
    }

    [Fact]
    public async Task GetOrdersByCustomer_WithPagination_ReturnsCorrectPage()
    {
        // Arrange - seed 25 orders
        var customerId = Guid.NewGuid();
        for (int i = 0; i < 25; i++)
            await _repository.CreateAsync(CreateOrder(customerId));

        // Act
        var page = await _repository.GetByCustomerAsync(
            customerId, pageNumber: 2, pageSize: 10);

        // Assert
        Assert.Equal(10, page.Items.Count);
        Assert.Equal(25, page.TotalCount);
        Assert.True(page.HasNextPage);
    }
}</code></pre>

        <h3>Playwright E2E Test (TypeScript)</h3>
        <pre><code class="language-typescript">import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Seed test data via API
    await page.request.post('/api/test/seed', {
      data: { scenario: 'checkout-ready', userId: 'test-user-1' }
    });
    await page.goto('/cart');
  });

  test('complete purchase with valid payment', async ({ page }) => {
    // Cart page
    await expect(page.getByTestId('cart-total')).toContainText('$109.97');
    await page.getByRole('button', { name: 'Proceed to Checkout' }).click();

    // Shipping
    await page.getByLabel('Address').fill('123 Test St');
    await page.getByLabel('City').fill('Portland');
    await page.getByRole('button', { name: 'Continue to Payment' }).click();

    // Payment - intercept Stripe iframe
    const stripeFrame = page.frameLocator('iframe[name*="stripe"]');
    await stripeFrame.getByPlaceholder('Card number').fill('4242424242424242');
    await stripeFrame.getByPlaceholder('MM / YY').fill('12/30');
    await stripeFrame.getByPlaceholder('CVC').fill('123');

    await page.getByRole('button', { name: 'Place Order' }).click();

    // Confirmation
    await expect(page.getByTestId('order-confirmation')).toBeVisible();
    await expect(page.getByTestId('order-number')).toHaveText(/ORD-\d+/);
  });

  test('handles payment decline gracefully', async ({ page }) => {
    await page.getByRole('button', { name: 'Proceed to Checkout' }).click();

    // Use Stripe's test decline card
    const stripeFrame = page.frameLocator('iframe[name*="stripe"]');
    await stripeFrame.getByPlaceholder('Card number').fill('4000000000000002');
    await stripeFrame.getByPlaceholder('MM / YY').fill('12/30');
    await stripeFrame.getByPlaceholder('CVC').fill('123');

    await page.getByRole('button', { name: 'Place Order' }).click();

    await expect(page.getByRole('alert')).toContainText('Payment declined');
    await expect(page.getByTestId('cart-total')).toBeVisible(); // Cart preserved
  });
});</code></pre>

        <h3>Pact Consumer Contract Test (TypeScript)</h3>
        <pre><code class="language-typescript">import { PactV3, MatchersV3 } from '@pact-foundation/pact';

const { like, eachLike, string, integer } = MatchersV3;

const provider = new PactV3({
  consumer: 'OrderService',
  provider: 'InventoryService',
});

describe('Inventory Service Contract', () => {
  it('returns stock availability for products', async () => {
    // Define expected interaction
    provider
      .given('products SKU-001 and SKU-002 exist')
      .uponReceiving('a request for stock levels')
      .withRequest({
        method: 'POST',
        path: '/api/inventory/check',
        headers: { 'Content-Type': 'application/json' },
        body: { productIds: ['SKU-001', 'SKU-002'] },
      })
      .willRespondWith({
        status: 200,
        body: eachLike({
          productId: string('SKU-001'),
          available: integer(50),
          reserved: integer(3),
        }),
      });

    await provider.executeTest(async (mockServer) => {
      const client = new InventoryClient(mockServer.url);
      const result = await client.checkStock(['SKU-001', 'SKU-002']);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('available');
      expect(result[0]).toHaveProperty('reserved');
    });
  });
});</code></pre>
      `
    },
    {
      title: 'Common Mistakes',
      content: `
        <ul>
          <li><strong>Testing implementation, not behavior:</strong> Tests that assert internal method calls 
          or state structure break on every refactor. Test observable behavior and outcomes instead.</li>
          <li><strong>E2E tests for edge cases:</strong> Using slow, flaky E2E tests to cover scenarios that 
          could be caught by a unit or integration test. Reserve E2E for critical user journeys.</li>
          <li><strong>Shared mutable test data:</strong> Tests depending on data created by other tests causes 
          ordering dependencies and flakiness. Each test should set up its own data.</li>
          <li><strong>Snapshot testing overuse:</strong> Large snapshots become "approve and forget" — nobody 
          reviews the diff. Use snapshots only for small, intentional outputs (serialized DTOs, error messages).</li>
          <li><strong>No test for the unhappy path:</strong> Only testing success scenarios misses the most 
          common production bugs: timeouts, malformed data, permission errors, concurrent modifications.</li>
          <li><strong>Mocking the thing you are testing:</strong> Over-mocking leads to tests that pass even 
          when the real system is broken. Mock at boundaries only (external APIs, file system, clock).</li>
          <li><strong>Ignoring test execution time:</strong> A test suite that takes 45 minutes discourages 
          developers from running tests. Parallelize, use faster strategies, and separate fast/slow suites.</li>
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
            <li>Frame your testing strategy around <strong>confidence per dollar</strong> — what test gives 
            the most confidence for the lowest maintenance cost?</li>
            <li>Mention the <strong>testing trophy</strong> (Kent C. Dodds) as an alternative to the pyramid: 
            static analysis > integration > unit > E2E.</li>
            <li>For microservices, always mention contract testing — it shows you understand the deployment 
            independence problem.</li>
            <li>Discuss <strong>test isolation strategies</strong>: database transactions, Docker containers, 
            schema-per-test, time freezing.</li>
            <li>Know the trade-offs of each approach: Testcontainers adds 10-30s startup but catches real 
            bugs; mocks are instant but can drift from reality.</li>
            <li>For architect roles, discuss test infrastructure: shared Pact Broker, test environment 
            provisioning, test data management across teams.</li>
          </ul>
        </div>
      `
    },
    {
      title: 'Key Takeaways',
      content: `
        <ul>
          <li>The testing diamond (emphasizing integration tests) is more effective than the pyramid for 
          microservices architectures.</li>
          <li>Contract testing (Pact) enables independent service deployment by verifying API compatibility 
          without running all services together.</li>
          <li>Testcontainers provides real infrastructure in tests, catching bugs that mocks would miss.</li>
          <li>E2E tests should cover critical user journeys only — keep them under 20 for most applications.</li>
          <li>Test data management (factories, seeding, isolation) is a first-class architectural concern.</li>
          <li>CI pipeline stages should be ordered by speed: lint → unit → integration → contract → E2E.</li>
          <li>Chaos testing validates resilience assumptions that cannot be verified by functional tests alone.</li>
        </ul>
      `
    }
  ],

  questions: [
    {
      id: 'fs-test-q1',
      level: 'junior',
      title: 'What is the difference between unit tests, integration tests, and E2E tests?',
      answer: `
        <p><strong>Unit tests</strong> verify a single function or class in isolation. Dependencies are mocked. 
        They run in milliseconds and catch logic errors in algorithms and business rules.</p>
        <p><strong>Integration tests</strong> verify that multiple components work together correctly — a service 
        talking to a real database, or two services communicating over HTTP. They catch serialization bugs, 
        query errors, and configuration issues.</p>
        <p><strong>E2E tests</strong> simulate real user behavior through the full stack — browser automation 
        clicking buttons, filling forms, and asserting on visible outcomes. They catch deployment issues, 
        broken wiring, and UX regressions.</p>
        <p>Each level trades speed for confidence: unit tests are fast but prove little about system behavior; 
        E2E tests are slow but prove the system works from the user's perspective.</p>
      `
    },
    {
      id: 'fs-test-q2',
      level: 'mid',
      title: 'How does consumer-driven contract testing work, and when would you use it?',
      answer: `
        <p>Consumer-driven contract testing flips the traditional approach: instead of the provider defining 
        its API and consumers adapting, <strong>consumers define their expectations</strong> and providers 
        verify they can satisfy them.</p>
        <p>Workflow:</p>
        <ol>
          <li>Consumer writes a test describing the requests it sends and responses it expects</li>
          <li>This generates a "pact file" (contract) published to a Pact Broker</li>
          <li>Provider fetches contracts and runs verification against its real implementation</li>
          <li>If verification passes, both services can deploy independently</li>
        </ol>
        <p><strong>When to use:</strong> Microservices owned by different teams with independent deployment 
        schedules. Without contracts, you need expensive integration environments where all services run together.</p>
        <p><strong>When NOT to use:</strong> Monoliths, services owned by the same team (just write integration 
        tests), or public APIs with many unknown consumers (use OpenAPI spec + provider tests instead).</p>
      `
    },
    {
      id: 'fs-test-q3',
      level: 'mid',
      title: 'What are the trade-offs of snapshot testing?',
      answer: `
        <p><strong>Pros:</strong></p>
        <ul>
          <li>Easy to create — no manual assertions needed</li>
          <li>Catches unintended changes to output (serialization, rendering)</li>
          <li>Useful for testing serialized DTOs, error messages, and small component renders</li>
        </ul>
        <p><strong>Cons:</strong></p>
        <ul>
          <li>Large snapshots become "noise" — developers blindly approve updates without reviewing</li>
          <li>Brittle: any change (even safe refactors) triggers snapshot failures</li>
          <li>Unclear intent: a snapshot doesn't communicate <em>what</em> is important about the output</li>
          <li>Merge conflicts in snapshot files slow down parallel development</li>
        </ul>
        <p><strong>Best practices:</strong> Keep snapshots small and focused. Use inline snapshots for small 
        outputs. Prefer explicit assertions for business-critical properties. Use snapshots as a <em>safety 
        net</em>, not as the primary assertion strategy.</p>
      `
    },
    {
      id: 'fs-test-q4',
      level: 'senior',
      title: 'Design a test data management strategy for a microservices system with 15 services.',
      answer: `
        <p>With 15 services, test data management is an architectural concern requiring standardized tooling:</p>
        <ol>
          <li><strong>Factory libraries per service:</strong> Each service owns a test factory that creates 
          valid domain entities. Factories are versioned and published as internal packages.</li>
          <li><strong>Scenario seeding API:</strong> A dedicated test endpoint (disabled in production) that 
          sets up named scenarios. E.g., POST /test/scenarios/checkout-ready creates a user, cart, and 
          valid payment method.</li>
          <li><strong>Database isolation:</strong> Integration tests use per-test transactions (rolled back) 
          or per-test schemas. Never share state between tests.</li>
          <li><strong>Cross-service scenarios:</strong> For E2E tests that span services, use a test 
          orchestrator that calls each service's seeding API to build the full scenario.</li>
        </ol>
        <pre><code class="language-csharp">// Scenario seeding endpoint (test environments only)
[ApiController]
[Route("api/test/scenarios")]
[ServiceFilter(typeof(TestEnvironmentOnlyFilter))]
public class TestScenariosController : ControllerBase
{
    [HttpPost("checkout-ready")]
    public async Task&lt;IActionResult&gt; SeedCheckoutReady(
        [FromBody] CheckoutScenarioRequest request)
    {
        var user = await _userFactory.CreateVerifiedUser();
        var cart = await _cartFactory.CreateWithItems(user.Id, request.ItemCount);
        var payment = await _paymentFactory.CreateValidMethod(user.Id);

        return Ok(new {
            userId = user.Id,
            cartId = cart.Id,
            paymentMethodId = payment.Id
        });
    }
}</code></pre>
        <p>Key principles: test data should be deterministic, isolated, and fast to create. Avoid shared 
        test databases — they are the #1 source of flaky tests.</p>
      `
    },
    {
      id: 'fs-test-q5',
      level: 'senior',
      title: 'How would you structure CI pipeline testing stages for fast feedback?',
      answer: `
        <p>The goal is <strong>fail fast</strong> — catch the cheapest errors first:</p>
        <ol>
          <li><strong>Stage 1 (30s):</strong> Lint, type-check, format check. Catches syntax and style issues.</li>
          <li><strong>Stage 2 (2min):</strong> Unit tests in parallel. Catches logic errors.</li>
          <li><strong>Stage 3 (5min):</strong> Integration tests with Testcontainers. Catches wiring bugs.</li>
          <li><strong>Stage 4 (3min):</strong> Contract verification against Pact Broker. Catches API drift.</li>
          <li><strong>Stage 5 (10min):</strong> E2E smoke tests — top 5 critical paths only.</li>
          <li><strong>Stage 6 (post-merge):</strong> Full E2E suite, performance tests, security scans.</li>
        </ol>
        <p>Optimization techniques:</p>
        <ul>
          <li><strong>Affected-only testing:</strong> Run only tests affected by changed files (Nx, Jest --changedSince)</li>
          <li><strong>Parallelization:</strong> Split test suites across CI workers (Playwright sharding)</li>
          <li><strong>Docker layer caching:</strong> Pre-built Testcontainers images for common dependencies</li>
          <li><strong>Test result caching:</strong> Skip tests for unchanged code paths</li>
        </ul>
        <p>Target: PR pipeline under 15 minutes. Full pipeline under 30 minutes. Alert if any stage trends upward.</p>
      `
    },
    {
      id: 'fs-test-q6',
      level: 'architect',
      title: 'How would you introduce chaos testing into an existing production system?',
      answer: `
        <p>Chaos testing must be introduced <strong>incrementally</strong> with strong safety controls:</p>
        <ol>
          <li><strong>Phase 1 — Game days:</strong> Manual fault injection in staging. Kill one service instance, 
          add 2s latency to database calls, expire all cache keys. Document observed behavior.</li>
          <li><strong>Phase 2 — Automated chaos in staging:</strong> Scheduled chaos experiments using tools like 
          Litmus, Gremlin, or AWS Fault Injection Simulator. Run during business hours with team watching.</li>
          <li><strong>Phase 3 — Production chaos:</strong> Only after observability is mature. Start with 
          single-instance failures in non-critical services. Require blast radius limits and automatic abort.</li>
        </ol>
        <pre><code class="language-typescript">// Chaos experiment definition
interface ChaosExperiment {
  name: string;
  hypothesis: string;           // "Order service handles inventory timeout gracefully"
  steadyState: MetricAssertion; // "Error rate < 0.1%, p99 latency < 500ms"
  injection: FaultInjection;    // { type: 'latency', target: 'inventory-service', duration: '5s', delay: '3000ms' }
  blastRadius: BlastRadius;     // { maxAffectedUsers: '1%', regions: ['us-east-1'] }
  abort: AbortCondition;        // { errorRate: '> 5%', duration: '30s' }
  rollback: RollbackAction;     // Automatic remediation if abort triggers
}</code></pre>
        <p>Prerequisites before chaos testing: comprehensive observability (distributed tracing, error rate 
        alerting, SLO monitoring), runbooks for common failures, and team buy-in. Chaos without observability 
        is just breaking things.</p>
      `
    },
    {
      id: 'fs-test-q7',
      level: 'architect',
      title: 'How do you test microservices independently while ensuring they work together?',
      answer: `
        <p>Independent microservice testing requires a <strong>layered verification strategy</strong>:</p>
        <ol>
          <li><strong>In-process testing:</strong> Each service has integration tests using Testcontainers for 
          its own dependencies (database, cache, queue). Tests the service in isolation.</li>
          <li><strong>Contract testing:</strong> Pact contracts verify API compatibility between services. 
          Consumer tests define expectations; provider tests verify fulfillment. No network calls needed.</li>
          <li><strong>Component testing:</strong> Deploy a single service with its real dependencies but stub 
          upstream services. Verifies the service handles real traffic patterns.</li>
          <li><strong>Synthetic integration:</strong> In staging, run automated scenarios that exercise 
          cross-service workflows. These are the final safety net before production.</li>
        </ol>
        <p>The key insight: if contracts are well-defined and verified, services can deploy independently 
        with confidence. The "works together" guarantee comes from contract compatibility, not from running 
        all services in one test environment.</p>
        <p>For teams transitioning from monolith: start with integration tests at the current service boundary, 
        add contracts as services split, and reduce E2E reliance as contract coverage increases.</p>
      `
    },
    {
      id: 'fs-test-q8',
      level: 'senior',
      title: 'How do you design a contract testing strategy between frontend and backend teams?',
      answer: `
        <p><strong>Contract testing</strong> verifies that API producers and consumers agree on the interface shape 
        without requiring them to be deployed together. It replaces fragile E2E tests for API compatibility.</p>
        <h4>Consumer-Driven Contract Testing (Pact):</h4>
        <ol>
          <li><strong>Consumer writes a contract:</strong> The frontend team defines what requests they make and 
          what responses they expect (status, structure, key fields). This generates a contract file (Pact JSON).</li>
          <li><strong>Contract is shared:</strong> Published to a Pact Broker or stored in a shared repository.</li>
          <li><strong>Provider verifies:</strong> The backend CI runs the contract against its real API. If the 
          response matches the consumer's expectations, verification passes.</li>
          <li><strong>Deploy safely:</strong> Both teams can deploy independently — if contracts pass, they are compatible.</li>
        </ol>
        <h4>What to Contract:</h4>
        <ul>
          <li><strong>Do contract:</strong> Response structure (field names, types, required vs optional), status codes, 
          error response format, authentication requirements.</li>
          <li><strong>Don't contract:</strong> Exact field values (too brittle), internal business logic, performance 
          characteristics, exact error messages (use patterns/codes instead).</li>
        </ul>
        <h4>Organizational Integration:</h4>
        <ul>
          <li>Frontend teams own consumer contracts (they define what they need)</li>
          <li>Backend teams own provider verification (they prove they deliver)</li>
          <li>Pact Broker provides a "can I deploy?" check that gates releases</li>
          <li>Breaking contract changes require coordination: backend publishes new version, 
          frontend migrates, old contract is retired</li>
        </ul>
        <p><strong>Key insight:</strong> Contract tests are cheaper, faster, and more reliable than E2E tests 
        for validating API compatibility. They run in milliseconds, don't require environment setup, and pinpoint 
        exactly which field or status code broke compatibility.</p>
      `
    }
  ]
});
