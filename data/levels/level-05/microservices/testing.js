/* ═══════════════════════════════════════════════════════════════════
   MICROSERVICES — Testing
   Testing pyramid for microservices, integration (Testcontainers),
   consumer-driven contract tests (Pact), component, e2e, and chaos.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('microservices-testing', {

    title: 'Microservices: Testing',
    level: 5,
    group: 'microservices',
    description: 'A testing strategy for microservices: the testing pyramid adapted for services, integration tests with Testcontainers, consumer-driven contract testing with Pact, component tests, sparing end-to-end tests, and chaos/fault-injection testing.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['microservices', 'testing-fundamentals'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Testing microservices adds a challenge the monolith never had: <strong>the boundaries
            between services</strong>. Each service can be perfectly tested in isolation, yet the system still
            breaks because two services disagree on a contract. The strategy layers cheap, fast, isolated tests with
            a small number of expensive cross-service checks.</p>
            <p>This lesson adapts the testing pyramid to services and covers integration tests with Testcontainers,
            consumer-driven contract tests (the key pattern for independent deployability), component tests, e2e
            (used sparingly), and chaos testing. For test fundamentals see
            <a href="#testing-fundamentals">Testing Fundamentals</a>.</p>`
        },
        {
            title: 'The Testing Pyramid for Microservices',
            content: `<p>The pyramid still holds — many fast unit tests at the base, fewer slow integrated tests at
            the top — but microservices add a crucial layer: <strong>contract tests</strong> between the unit and
            integration levels, and they push you to minimize expensive end-to-end tests.</p>
            <ul>
                <li><strong>Unit</strong> (most) — business logic in isolation, dependencies mocked. Fast,
                deterministic.</li>
                <li><strong>Integration</strong> — the service against its real database/broker (via
                Testcontainers), external services stubbed.</li>
                <li><strong>Contract</strong> — verify the API/event contract between a consumer and provider without
                a full integrated environment.</li>
                <li><strong>Component</strong> — one whole service in isolation with real internal deps, external
                services stubbed.</li>
                <li><strong>End-to-end</strong> (fewest) — critical flows across multiple real services. Slow,
                flaky, expensive — smoke tests only.</li>
            </ul>`,
            mermaid: `flowchart TB
    E2E["End-to-End (few, critical flows)"] --> Comp["Component (whole service isolated)"]
    Comp --> Contract["Contract (consumer/provider)"]
    Contract --> Integ["Integration (real DB/broker)"]
    Integ --> Unit["Unit (many, fast, isolated)"]`
        },
        {
            title: 'Unit & Integration Tests',
            content: `<p><strong>Unit tests</strong> cover business logic with dependencies mocked — the fast,
            deterministic base of the pyramid, run on every commit.</p>
            <p><strong>Integration tests</strong> verify the service talks correctly to its <em>real</em>
            infrastructure — database queries, event publishing, migrations — with external services stubbed.
            <strong>Testcontainers</strong> is the key enabler: it spins up a real database/broker in a Docker
            container for the test and tears it down after, so you test against the actual engine (PostgreSQL,
            RabbitMQ) instead of a mock or an in-memory fake that behaves differently.</p>`,
            code: `// Integration test against a REAL PostgreSQL via Testcontainers
public class OrderRepositoryTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _db = new PostgreSqlBuilder()
        .WithImage("postgres:16")
        .Build();

    public async Task InitializeAsync()
    {
        await _db.StartAsync();
        await MigrateAsync(_db.GetConnectionString()); // run real migrations
    }

    [Fact]
    public async Task AddOrder_PersistsAndReadsBack()
    {
        var repo = new OrderRepository(_db.GetConnectionString());
        var order = Order.Create("cust-1", new[] { new OrderItem("SKU-1", 2) });

        await repo.AddAsync(order);
        var loaded = await repo.GetByIdAsync(order.Id);

        Assert.NotNull(loaded);
        Assert.Equal("cust-1", loaded!.CustomerId);
    }

    public Task DisposeAsync() => _db.DisposeAsync().AsTask();
}`,
            language: 'csharp'
        },
        {
            title: 'Consumer-Driven Contract Testing',
            content: `<p>This is the pattern that makes <strong>independent deployability real</strong>. Services
            evolve and deploy independently, so how do you know a provider change will not break its consumers —
            without a slow, flaky integrated environment?</p>
            <p><strong>Consumer-driven contracts (Pact)</strong>: the <em>consumer</em> declares the interactions it
            needs (given this request, expect this response). This produces a contract that the <em>provider's</em>
            CI verifies it still satisfies before deploying. If a provider change would break a consumer, the
            provider's pipeline fails — <strong>before</strong> release, not in production.</p>
            <p>The consumer tests against a Pact mock server; the provider replays the contract against its real
            implementation. Neither needs the other running.</p>`,
            code: `// Consumer side (Order Service) declares what it needs from Inventory.
[Fact]
public async Task GetStock_ReturnsAvailableQuantity()
{
    _pact
        .UponReceiving("a request for product stock")
        .Given("product SKU-123 has 50 units")
        .WithRequest(HttpMethod.Get, "/api/stock/SKU-123")
        .WillRespond()
        .WithStatus(HttpStatusCode.OK)
        .WithJsonBody(new { sku = "SKU-123", available = 50 });

    await _pact.VerifyAsync(async ctx =>
    {
        var client = new InventoryClient(ctx.MockServerUri);
        var stock = await client.GetStockAsync("SKU-123");
        Assert.Equal(50, stock.Available);
    });
    // The generated pact file is published; the PROVIDER's CI verifies it
    // against the real Inventory service before that service can deploy.
}`,
            language: 'csharp',
            callout: {
                type: 'tip',
                title: 'Contracts replace most cross-service E2E',
                text: 'Contract tests catch integration breaks in each pipeline, fast and reliably, so you need only a handful of true end-to-end tests for critical smoke flows. This is how teams deploy independently with confidence.'
            }
        },
        {
            title: 'Component & End-to-End Tests',
            content: `<p><strong>Component tests</strong> exercise a single whole service end-to-end in isolation:
            real internal dependencies (its database, cache via Testcontainers) but external services stubbed. They
            validate the full request/response cycle of one service — routing, serialization, validation,
            persistence — without the flakiness of a multi-service environment.</p>
            <p><strong>End-to-end tests</strong> exercise critical business flows across multiple <em>real</em>
            services. They are the most realistic but also the slowest, flakiest, and most expensive to maintain.
            Keep them to a minimum — a handful of critical-path smoke tests (e.g., "place an order end to end") —
            and rely on contract + component tests for the rest.</p>`
        },
        {
            title: 'Chaos & Fault-Injection Testing',
            content: `<p>Resilience patterns (see <a href="#microservices-resilience">Resilience</a>) are only real
            if you test them. <strong>Chaos engineering</strong> deliberately injects failure — kill instances, add
            latency, drop network, exhaust resources — to verify the system degrades gracefully instead of
            collapsing.</p>
            <p>Netflix's Chaos Monkey (randomly terminating production instances) is the origin. Start small:
            inject faults in a staging environment (a dependency returns 500s, a call takes 5s), confirm circuit
            breakers open, fallbacks trigger, and no cascade occurs. Graduate to controlled production experiments
            with a clear blast-radius limit and an abort switch. See also
            <a href="#chaos-engineering">Chaos Engineering</a>.</p>`
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Over-relying on end-to-end tests</h4>
            <p>A big E2E suite is slow, flaky, and a maintenance sink. Push testing down to contract and component
            levels; keep E2E minimal.</p>
            <h4>No contract tests</h4>
            <p>Without them, "independent deployability" is a gamble — you discover breaking changes in production.</p>
            <h4>Mocking the database instead of using a real one</h4>
            <p>In-memory fakes behave differently from the real engine (SQL dialect, transactions). Use
            Testcontainers for integration tests.</p>
            <h4>Testing resilience only on paper</h4>
            <p>Circuit breakers and fallbacks configured but never exercised often fail when needed. Inject faults.</p>
            <h4>Shared, stateful test environments</h4>
            <p>Tests that share a long-lived environment interfere and flake. Prefer ephemeral, isolated
            infrastructure per test run.</p>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Adapt the pyramid: many <strong>unit</strong> tests, real-infra <strong>integration</strong> tests, <strong>contract</strong> tests between services, minimal <strong>E2E</strong></li>
                <li><strong>Testcontainers</strong> tests against real databases/brokers, not misleading in-memory fakes</li>
                <li><strong>Consumer-driven contracts (Pact)</strong> make independent deployment safe by catching breaks in CI</li>
                <li>Keep <strong>end-to-end</strong> tests to critical smoke flows only</li>
                <li><strong>Chaos/fault injection</strong> proves resilience patterns actually work</li>
            </ul>`
        },
        {
            title: 'Continue the Series',
            content: `<p>Previous: <a href="#microservices-patterns">← Patterns Catalog</a> ·
            Back to <a href="#microservices">Overview</a> ·
            Next: <a href="#microservices-bottlenecks">Bottlenecks &amp; Performance →</a></p>`
        }
    ],

    questions: [
        {
            question: 'How does the testing pyramid change for microservices?',
            difficulty: 'medium',
            answer: `<p>The pyramid shape holds — many fast unit tests, fewer slow integrated tests — but
            microservices add a <strong>contract test</strong> layer between unit and integration, and they push you
            to <strong>minimize end-to-end tests</strong>. The levels: unit (most), integration (real DB/broker via
            Testcontainers), contract (consumer/provider compatibility), component (one whole service isolated), and
            e2e (fewest, critical flows only).</p>
            <p>The shift is driven by service boundaries: cross-service E2E is slow and flaky, so you catch
            integration breaks with cheap, reliable contract tests instead.</p>`,
            explanation: 'Instead of test-driving the whole convoy together every time (E2E), you certify each vehicle thoroughly and check that their tow-hitches match (contracts) — far faster and less flaky.',
            bestPractices: ['Most tests at unit level', 'Add contract tests between services', 'Keep E2E to critical smoke flows', 'Use real infra for integration tests'],
            commonMistakes: ['Inverting the pyramid with heavy E2E', 'Skipping contract tests', 'Mocking the DB in integration tests'],
            interviewTip: 'Name the extra layer (contract tests) and explain why: it replaces most cross-service E2E for independent deployability.',
            followUp: ['What is a contract test?', 'Why is E2E flaky?', 'What is a component test?']
        },
        {
            question: 'What is consumer-driven contract testing and why is it central to microservices?',
            difficulty: 'hard',
            answer: `<p><strong>Consumer-driven contract testing (Pact)</strong>: the consumer declares the
            interactions it needs from a provider (given this request, expect this response), producing a contract.
            The provider's CI verifies it still satisfies that contract before deploying.</p>
            <p>It is central because services deploy independently and old/new versions coexist — you must know a
            provider change will not break consumers <em>without</em> a slow integrated environment. Contract tests
            catch breaks in each pipeline, fast and reliably, turning "I think this is compatible" into a CI gate.
            Without them, independent deployability is a gamble discovered in production.</p>`,
            explanation: 'The consumer writes down "I order a medium coffee and expect it in a medium cup." The provider is not allowed to ship a change until it proves it still fulfills every consumer\'s written order — checked automatically before opening.',
            bestPractices: ['Consumer declares needs; provider verifies in CI', 'Consumer tests against a Pact mock; provider replays against real impl', 'Gate provider deploys on contract verification'],
            commonMistakes: ['No contract tests (breaks found in prod)', 'Provider-driven contracts that ignore real consumer needs', 'Skipping the provider verification step'],
            interviewTip: 'Stress the direction (consumer-driven) and the CI gate — "the provider cannot deploy until it satisfies its consumers\' contracts" is the key line.',
            followUp: ['How does a provider verify a pact?', 'How do contracts relate to schema evolution?', 'Consumer-driven vs provider-driven contracts?'],
            seniorPerspective: 'Contract tests are what turn "independent deployment" from a slogan into reality. Without them, every provider change is a bet on what consumers actually rely on. With them, a breaking change fails the provider pipeline in seconds, so I treat contract verification as a mandatory deploy gate, not an optional nicety.'
        },
        {
            question: 'What is Testcontainers and why prefer it over in-memory or mocked databases for integration tests?',
            difficulty: 'medium',
            answer: `<p><strong>Testcontainers</strong> spins up a real dependency (PostgreSQL, RabbitMQ, Redis) in a
            Docker container for the duration of a test, then disposes it. Your integration tests run against the
            <em>actual</em> engine.</p>
            <p>Prefer it because in-memory fakes and mocks behave differently from the real thing — SQL dialect
            quirks, transaction/isolation semantics, real migrations, actual broker behavior. Tests that pass
            against a fake can still fail in production. Testcontainers gives realistic, isolated, ephemeral infra
            per run.</p>`,
            explanation: 'Testing against an in-memory fake is like practicing a landing in a simplified simulator that ignores wind; Testcontainers is the full-motion simulator using the real aircraft model.',
            bestPractices: ['Run integration tests against real engines via containers', 'Run real migrations in the test', 'Keep containers ephemeral and isolated per run'],
            commonMistakes: ['Mocking the DB and missing dialect/transaction bugs', 'Using an in-memory provider that diverges from prod', 'Sharing a long-lived DB across tests'],
            interviewTip: 'The core point: "in-memory fakes lie" — real engine behavior (SQL dialect, transactions) is exactly what integration tests must exercise.',
            followUp: ['What bugs do in-memory DBs hide?', 'How do you keep container tests fast?', 'How does this fit CI?']
        },
        {
            question: 'What is a component test and how does it differ from integration and E2E tests?',
            difficulty: 'medium',
            answer: `<p>A <strong>component test</strong> exercises a single whole service end-to-end in isolation:
            real internal dependencies (its own DB/cache via Testcontainers) but external services stubbed. It
            validates the full request/response cycle of one service — routing, serialization, validation,
            persistence.</p>
            <p><strong>Integration tests</strong> are narrower (a service talking to one real dependency, e.g., the
            repository against the DB). <strong>E2E tests</strong> are broader (multiple real services together).
            Component tests hit the sweet spot: realistic for one service, without the flakiness of a multi-service
            environment.</p>`,
            explanation: 'Integration = testing one appliance plugs into the socket. Component = testing the whole kitchen works on its own. E2E = testing the entire house with plumbing, wiring, and neighbors connected.',
            bestPractices: ['Test one whole service with real internal deps, external stubbed', 'Use Testcontainers for the internal DB/cache', 'Prefer component over broad E2E where possible'],
            commonMistakes: ['Confusing component with full E2E', 'Using live external services in component tests', 'Skipping component tests and over-using E2E'],
            interviewTip: 'Position component tests as "one whole service isolated" — the reliable middle ground that reduces reliance on flaky E2E.',
            followUp: ['How do you stub external services?', 'When is E2E still necessary?', 'How does this relate to contract tests?']
        },
        {
            question: 'Why should end-to-end tests be minimized in a microservices system?',
            difficulty: 'hard',
            answer: `<p>Cross-service <strong>E2E tests</strong> require many real services running together, so they
            are slow, <strong>flaky</strong> (any service or network hiccup fails the test for unrelated reasons),
            expensive to maintain, and hard to debug (a failure could originate in any service). A large E2E suite
            becomes a bottleneck that erodes trust in the pipeline.</p>
            <p>Push testing down the pyramid: unit + integration + <strong>contract</strong> tests catch most issues
            cheaply and reliably. Keep E2E to a handful of critical-path smoke flows (e.g., place-an-order) as a
            final confidence check, not the primary safety net.</p>`,
            explanation: 'Rehearsing the entire orchestra together for every tiny change is expensive and chaotic; instead each musician practices alone and section pairs check they are in tune (contracts), with just one full rehearsal before the concert.',
            bestPractices: ['Minimal critical-path E2E only', 'Rely on contract + component tests', 'Make E2E environments as reproducible as possible'],
            commonMistakes: ['A large, brittle E2E suite as the main safety net', 'Debugging flaky E2E instead of fixing the pyramid', 'No contract tests to compensate'],
            interviewTip: 'List the three E2E problems (slow/flaky/hard-to-debug) and pivot to "push it down to contract tests" — that trade-off is the expected answer.',
            followUp: ['How do contract tests reduce E2E need?', 'How do you stabilize necessary E2E tests?', 'What flows justify an E2E test?']
        },
        {
            question: 'What is chaos engineering and how do you introduce it safely?',
            difficulty: 'hard',
            answer: `<p><strong>Chaos engineering</strong> deliberately injects failure — killing instances, adding
            latency, dropping network, exhausting resources — to verify the system degrades gracefully rather than
            cascading. It proves that resilience patterns (timeouts, circuit breakers, fallbacks) actually work.</p>
            <p>Introduce it safely by starting in <strong>staging</strong>: inject a fault (a dependency returns
            500s or hangs) and confirm the circuit breaker opens, the fallback triggers, and no cascade occurs. Then
            graduate to controlled <strong>production</strong> experiments with a defined hypothesis, a limited
            blast radius, monitoring, and an <strong>abort switch</strong>. Never run blind chaos in production.</p>`,
            explanation: 'It is a fire drill for software: you start a controlled, contained fire to check the alarms and exits actually work — before a real fire tests them for you.',
            bestPractices: ['Start in staging with small injected faults', 'Define a hypothesis and limit blast radius', 'Have monitoring and an abort switch', 'Verify breakers/fallbacks engage'],
            commonMistakes: ['Running uncontrolled chaos in production', 'No blast-radius limit or abort switch', 'Never testing configured resilience at all'],
            interviewTip: 'Stress "controlled, hypothesis-driven, limited blast radius, abort switch" — safety framing distinguishes real practice from recklessness.',
            followUp: ['What is Chaos Monkey?', 'What is a steady-state hypothesis?', 'How do you limit blast radius?']
        },
        {
            question: 'How does contract testing relate to safe API and event schema evolution?',
            difficulty: 'hard',
            answer: `<p>Because services deploy independently, old and new versions of a provider and its consumers
            coexist, so changes must be <strong>backward compatible</strong> (additive fields, tolerant readers).
            Contract tests are the enforcement mechanism: the provider's CI verifies it still satisfies every
            consumer's contract before deploying, so a breaking change (removed/renamed field, changed type) fails
            the pipeline instead of production.</p>
            <p>Together with a schema registry for events, contracts turn "we think this change is compatible" into
            an automated gate, enabling the expand-contract approach to schema changes.</p>`,
            explanation: 'The contract is a signed agreement about the shape of messages. Before a provider changes anything, an automatic check confirms it still honors every agreement it made with its consumers.',
            bestPractices: ['Additive, backward-compatible changes; tolerant readers', 'Contract verification as a deploy gate', 'Schema registry for event compatibility', 'Expand-contract for breaking changes'],
            commonMistakes: ['Removing/renaming fields consumers rely on', 'No contract gate, so breaks reach production', 'Big-bang version cutovers'],
            interviewTip: 'Link "versions coexist → must be backward compatible → contract tests enforce it" — that chain shows real distributed-systems understanding.',
            followUp: ['What is the expand-contract migration pattern?', 'What is a tolerant reader?', 'How does a schema registry enforce compatibility?']
        },
        {
            question: 'A provider team wants to change a response field. How do you ensure they do not break consumers?',
            difficulty: 'medium',
            answer: `<p>Prefer an <strong>additive, backward-compatible</strong> change (add a new field; do not
            remove, rename, or retype an existing one) so existing consumers with tolerant readers are unaffected.
            Verify with <strong>consumer-driven contract tests</strong>: the provider's CI checks it still satisfies
            all published consumer contracts before it can deploy — a breaking change fails the pipeline.</p>
            <p>If a breaking change is truly necessary, use <strong>expand-contract</strong>: add the new field
            alongside the old, migrate consumers, then remove the old field once no contract depends on it —
            coordinated via the contract tests, not a big-bang cutover.</p>`,
            explanation: 'You can add a new box to a form freely, but you cannot remove a box people still fill in without first giving everyone a clearly-labeled new form and time to switch — and a checker confirms nobody still needs the old box.',
            bestPractices: ['Additive changes with tolerant readers', 'Gate provider deploy on consumer contracts', 'Expand-contract for unavoidable breaking changes'],
            commonMistakes: ['Removing/renaming/retyping a field in place', 'Deploying without contract verification', 'Big-bang breaking change'],
            interviewTip: 'Default to additive + contract gate; only invoke expand-contract for genuine breaks — that ordering shows disciplined evolution.',
            followUp: ['What is a tolerant reader?', 'How does expand-contract work step by step?', 'How do contract tests catch the break?']
        }
    ]
});
