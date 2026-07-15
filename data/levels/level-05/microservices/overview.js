/* ═══════════════════════════════════════════════════════════════════
   MICROSERVICES — Overview (Hub)
   Level 5: Architecture. This is the curriculum hub: what microservices
   are, why/when to use them, and an index into the deep sub-topics.
   Deep coverage of each concern lives in its own sub-topic page.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('microservices', {

    title: 'Microservices: Overview',
    level: 5,
    group: 'microservices',
    description: 'The microservices curriculum hub — what they are, the principles, monolith vs modular monolith vs microservices, when NOT to use them, and an index into the deep sub-topics (decomposition, communication, data, resilience, observability, deployment, patterns, testing, bottlenecks, challenges, case studies).',
    difficulty: 'advanced',
    estimatedMinutes: 25,
    prerequisites: ['arch-styles', 'arch-ddd'],

    sections: [

        // ─── 1. INTRODUCTION ──────────────────────────────────────────
        {
            title: 'Introduction',
            content: `<p><strong>Microservices Architecture</strong> builds a system as a suite of small,
            independently deployable services, each running in its own process and communicating over
            lightweight protocols (HTTP/REST, gRPC, or asynchronous messaging).</p>
            <p>Each service is organized around a business capability, owned by a small team, and can be
            developed, deployed, and scaled independently — in contrast to a monolith where all functionality
            ships as one unit.</p>
            <p>This page is the <strong>overview and index</strong>. It covers the big picture and points you to
            a dedicated deep-dive for every concern. Use the <a href="#curriculum">Curriculum</a> section below
            to jump straight to the lesson you need.</p>`
        },

        // ─── 2. CORE PRINCIPLES ───────────────────────────────────────
        {
            title: 'Core Principles',
            content: `<p>Microservices are defined by a handful of principles that every sub-topic builds on:</p>
            <h4>Single Responsibility per Service</h4>
            <p>Each service owns one business capability (Orders, Payments, Inventory). Team structure mirrors
            the architecture (Conway's Law).</p>
            <h4>Bounded Context</h4>
            <p>Each service draws a clear boundary around its domain model; the same word can mean different
            things in different services, and that is intentional. See
            <a href="#microservices-decomposition">Decomposition &amp; Boundaries</a>.</p>
            <h4>Decentralized Data</h4>
            <p>Each service owns its data store (database-per-service) — no shared database. See
            <a href="#microservices-data">Data Management</a>.</p>
            <h4>Smart Endpoints, Dumb Pipes</h4>
            <p>Logic lives in services, not in the communication infrastructure. See
            <a href="#microservices-communication">Communication</a>.</p>
            <h4>Design for Failure</h4>
            <p>Services will fail; design with timeouts, retries, circuit breakers, and bulkheads. See
            <a href="#microservices-resilience">Resilience</a>.</p>
            <h4>Infrastructure Automation</h4>
            <p>CI/CD, containers, orchestration, and observability are prerequisites, not extras. See
            <a href="#microservices-deployment">Deployment</a> and
            <a href="#microservices-observability">Observability</a>.</p>`,
            mermaid: `graph TB
    A["Business Capability"] --> B["Bounded Context"]
    B --> C["Own Data Store"]
    B --> D["Own Deployment"]
    B --> E["Own Team"]
    C --> F["Polyglot Persistence"]
    D --> G["Independent Scaling"]
    E --> H["Autonomous Decisions"]`
        },

        // ─── 3. CURRICULUM INDEX ──────────────────────────────────────
        {
            title: 'Curriculum',
            content: `<p>This overview links to a focused, deep-dive lesson for each concern. Follow them in
            order, or jump to what you need:</p>`,
            table: {
                headers: ['#', 'Lesson', 'What it covers'],
                rows: [
                    ['1', '<a href="#microservices-decomposition">Decomposition &amp; Boundaries</a>', 'Bounded contexts, business-capability vs subdomain, service sizing, Conway\'s Law, migration seams'],
                    ['2', '<a href="#microservices-communication">Communication</a>', 'Sync REST/gRPC, async messaging, API gateway, BFF, service discovery, sync-vs-async decisions'],
                    ['3', '<a href="#microservices-data">Data Management</a>', 'Database-per-service, eventual consistency, saga, transactional outbox, CQRS, event sourcing'],
                    ['4', '<a href="#microservices-resilience">Resilience</a>', 'Timeout, retry+backoff, circuit breaker, bulkhead, fallback, preventing cascading failures'],
                    ['5', '<a href="#microservices-observability">Observability</a>', 'Structured logging, distributed tracing, metrics (RED/USE), health checks, correlation ids'],
                    ['6', '<a href="#microservices-deployment">Deployment &amp; Operations</a>', 'Containers, Kubernetes, CI/CD per service, blue-green/canary, service mesh, config &amp; secrets'],
                    ['7', '<a href="#microservices-patterns">Patterns Catalog</a>', 'Gateway, aggregator, ACL, strangler fig, sidecar, saga, outbox, CQRS, event sourcing'],
                    ['8', '<a href="#microservices-testing">Testing</a>', 'Testing pyramid, integration (Testcontainers), consumer-driven contracts (Pact), component, e2e'],
                    ['9', '<a href="#microservices-bottlenecks">Bottlenecks &amp; Performance</a>', 'Chatty/N+1 calls, broker lag, hot services, serialization, diagnosis via traces'],
                    ['10', '<a href="#microservices-challenges">Challenges &amp; Anti-Patterns</a>', 'Consistency, debugging, security, config sprawl, versioning, distributed-monolith anti-pattern'],
                    ['11', '<a href="#microservices-case-studies">Case Studies</a>', 'Netflix, Amazon, Uber (DOMA), Monzo, Spotify, betting platform — drivers, patterns, lessons']
                ]
            },
            callout: {
                type: 'tip',
                title: 'How to use this curriculum',
                text: 'If you are new, read in order 1 to 11. If you are preparing for a specific interview area, jump straight to the sub-topic — each is self-contained with its own examples and question bank.'
            }
        },

        // ─── 4. WHEN TO USE / WHEN NOT ────────────────────────────────
        {
            title: 'When to Use (and When Not To)',
            content: `<p>Microservices are a trade-off, not a default. Adopt them for the right reasons:</p>
            <h4>Good reasons to adopt</h4>
            <ul>
                <li>Large org with many teams that need to deploy independently</li>
                <li>Mature domain with stable, well-understood bounded contexts</li>
                <li>Parts of the system need to scale independently</li>
                <li>High change frequency concentrated in specific areas</li>
            </ul>
            <h4>Reasons NOT to (yet)</h4>
            <ul>
                <li>Small team (&lt; ~10-20 devs) — a modular monolith is faster to build and operate</li>
                <li>Unclear or rapidly-changing domain boundaries — you will get the splits wrong</li>
                <li>Limited operational maturity — no CI/CD, orchestration, or observability</li>
                <li>Strong cross-context ACID consistency requirements</li>
            </ul>
            <p>Rule of thumb: <strong>start with a well-structured monolith</strong> and extract services when a
            concrete pain point (scaling, team autonomy, deploy frequency) justifies the operational cost.</p>`,
            callout: {
                type: 'tip',
                title: 'The Two-Pizza Rule',
                text: 'A service should be owned by a team small enough to be fed with two pizzas (5-8 people). If a service needs coordination across multiple teams, it is too large.'
            }
        },

        // ─── 5. COMPARISON ────────────────────────────────────────────
        {
            title: 'Monolith vs Modular Monolith vs Microservices',
            content: `<p>The honest comparison — most systems are best served by one of the first two until scale
            forces the third:</p>`,
            table: {
                headers: ['Criteria', 'Monolith', 'Modular Monolith', 'Microservices'],
                rows: [
                    ['Deployment', 'Single unit', 'Single unit, modular internals', 'Independent per service'],
                    ['Scaling', 'Scale whole app', 'Scale whole app', 'Scale individual services'],
                    ['Data', 'Shared database', 'Shared DB, separate schemas', 'Database per service'],
                    ['Consistency', 'ACID', 'ACID within, events between modules', 'Eventual (sagas)'],
                    ['Team autonomy', 'Low', 'Medium', 'High'],
                    ['Operational overhead', 'Low', 'Low', 'Very high'],
                    ['Failure isolation', 'Weak', 'Partial', 'Strong'],
                    ['Best for', 'Small teams, early stage', 'Growing teams/products', 'Large teams, mature domains']
                ]
            }
        },

        // ─── 6. INTERVIEW TIPS ────────────────────────────────────────
        {
            title: 'Interview Tips',
            content: `<p>Microservices questions appear at every senior+ interview. Signal maturity by:</p>
            <ul>
                <li><strong>Leading with trade-offs</strong> — never advocate microservices unconditionally</li>
                <li><strong>Discussing decomposition</strong> — how you find service boundaries</li>
                <li><strong>Addressing data consistency</strong> — eventual consistency, sagas, compensations</li>
                <li><strong>Naming operational concerns</strong> — observability, CI/CD, service mesh</li>
                <li><strong>Knowing when NOT to</strong> — a modular monolith is often the better answer</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Architect-Level Signal',
                text: 'At the architect level, frame the decision organizationally (Conway\'s Law), discuss migration strategy (Strangler Fig), and put technical choices in business/cost context.'
            }
        },

        // ─── 7. KEY TAKEAWAYS ─────────────────────────────────────────
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Core idea:</strong> small, independently deployable services aligned with business capabilities</li>
                <li><strong>When:</strong> large teams, mature domains, independent scaling/deploy needs</li>
                <li><strong>When not:</strong> small teams, unclear boundaries, low operational maturity</li>
                <li><strong>Key benefit:</strong> independent deployability, team autonomy, fault isolation</li>
                <li><strong>Main cost:</strong> distributed-systems complexity — consistency, debugging, operations</li>
                <li><strong>Study path:</strong> follow the <a href="#curriculum">Curriculum</a> sub-topics for depth</li>
            </ul>`
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // INTERVIEW QUESTIONS (overview level)
    // ═══════════════════════════════════════════════════════════════
    questions: [
        {
            question: 'What are microservices and how do they differ from a monolithic architecture?',
            difficulty: 'easy',
            answer: `<p><strong>Microservices</strong> compose an application from small, independently deployable
            services, each in its own process, owning its own data, communicating via lightweight protocols.</p>
            <p>Differences from a monolith: independent deployment (vs one big deploy), database-per-service (vs
            one shared DB), per-service scaling (vs scaling the whole app), small autonomous teams (vs one large
            team), and polyglot tech (vs a single stack).</p>`,
            explanation: 'A monolith is one restaurant with a single kitchen doing everything. Microservices are a food court: each stall specializes, has its own kitchen and staff, and if the pizza stall gets busy only it needs more people.',
            bestPractices: ['Map each service to one business capability', 'Communicate via APIs or events, never a shared DB', 'Design for failure', 'Invest in CI/CD and observability before splitting'],
            commonMistakes: ['Treating microservices as merely "small code"', 'Splitting before understanding the domain', 'Building a distributed monolith with a shared DB'],
            interviewTip: 'Define it, give one example, then immediately name the trade-off (operational complexity). Balanced thinking scores higher than enthusiasm.',
            followUp: ['When would you choose a monolith instead?', 'What is a modular monolith?', 'How do microservices relate to Conway\'s Law?']
        },
        {
            question: 'When would you NOT use microservices?',
            difficulty: 'medium',
            answer: `<p>Avoid microservices when the cost outweighs the benefit:</p>
            <ul>
                <li><strong>Small team</strong> (&lt; ~10-20 devs) — a modular monolith is faster to build/operate.</li>
                <li><strong>Unclear domain boundaries</strong> — you will draw the wrong seams, and cross-service
                refactoring is far harder than in-monolith refactoring.</li>
                <li><strong>Low operational maturity</strong> — no CI/CD, orchestration, or observability.</li>
                <li><strong>Strong cross-context consistency needs</strong> — eventual consistency adds risk.</li>
            </ul>
            <p>Prefer a <strong>modular monolith</strong> first; extract services when a proven pain point justifies it.</p>`,
            explanation: 'Microservices are franchise overhead: great when you run 500 locations, pure burden for a single cafe. A small team with a simple product does not need the infrastructure tax.',
            bestPractices: ['Start monolithic (MonolithFirst)', 'Extract with the Strangler Fig pattern', 'Budget for platform engineering before scaling out'],
            commonMistakes: ['Adopting microservices "because Netflix does"', 'Splitting an MVP into services on day one', 'Assuming services fix organizational problems'],
            interviewTip: 'Framing "here is when I would NOT use them" is the strongest senior signal — it shows judgment over hype.',
            followUp: ['How do you migrate a monolith incrementally?', 'What is the Strangler Fig pattern?', 'How do you measure if microservices add value?'],
            seniorPerspective: 'My rule of thumb: under ~20 developers and fewer than a couple of deploys a week, a modular monolith with clean module boundaries serves better. Extract services only against proven bottlenecks — premature splitting spends 80% of the team\'s time on infrastructure instead of features.'
        },
        {
            question: 'What is a distributed monolith and how do you avoid it?',
            difficulty: 'hard',
            answer: `<p>A <strong>distributed monolith</strong> has the operational cost of microservices with none of
            the independence: services must be deployed together, share a database, or depend on long synchronous
            call chains. Changing one service forces changes in others.</p>
            <p>Avoid it by: giving each service its own data, preferring asynchronous events over synchronous
            chains, ensuring every service deploys independently, and testing services in isolation with
            contract tests.</p>`,
            explanation: 'It is like moving housemates into separate apartments but keeping one shared fridge, one shared key, and a rule that nobody leaves until everybody leaves — all the overhead of living apart, none of the freedom.',
            bestPractices: ['Database-per-service — no shared tables', 'Async events for workflows; sync only for real-time reads', 'Independent deploy pipelines', 'Consumer-driven contract tests'],
            commonMistakes: ['Shared database across services', 'Synchronous A→B→C→D chains', 'Lock-step releases across services'],
            interviewTip: 'Define the symptom (deploy-together / shared DB / sync chains) then the cure. Mentioning "if changing one service forces changing three others" is a crisp diagnostic.',
            followUp: ['How does the database-per-service pattern help?', 'Why are synchronous chains dangerous?', 'How do contract tests enable independence?']
        },
        {
            question: 'How do you decide where to draw service boundaries?',
            difficulty: 'medium',
            answer: `<p>Align boundaries with the business domain, not technical layers. Two primary strategies:
            <strong>decompose by business capability</strong> (Orders, Payments, Inventory) and
            <strong>decompose by DDD subdomain / bounded context</strong>.</p>
            <p>Supporting heuristics: things that change together belong together; one team should own one service
            (Conway\'s Law); features that share data likely belong together; and features whose failure should not
            affect each other should be separate.</p>
            <p>This is covered in depth in <a href="#microservices-decomposition">Decomposition &amp; Boundaries</a>.</p>`,
            explanation: 'Draw the lines the way a business is organized into departments, not the way code is layered into UI/logic/data. Departments (capabilities) have clear owners and clear responsibilities.',
            bestPractices: ['Decompose by capability/subdomain, not layer', 'One team owns one service', 'Group by change frequency and data ownership'],
            commonMistakes: ['Splitting by technical layer (API/logic/data services)', 'Ignoring team topology', 'Making services so small that every request fans out everywhere'],
            interviewTip: 'Say "by business capability / bounded context, not by technical layer" — that one sentence signals you understand decomposition.',
            followUp: ['What is a bounded context?', 'How small is too small for a service?', 'How does event storming help find boundaries?']
        },
        {
            question: 'How do microservices communicate, and when do you use synchronous vs asynchronous?',
            difficulty: 'medium',
            answer: `<p>Two styles: <strong>synchronous</strong> (HTTP/REST or gRPC — caller waits for a response)
            and <strong>asynchronous</strong> (messaging/events via Kafka, RabbitMQ, Service Bus — fire and
            continue).</p>
            <p>Use <strong>sync</strong> for real-time reads where the caller needs an immediate answer and the
            call chain is short. Use <strong>async</strong> for workflows spanning services, fan-out to many
            consumers, and to keep services loosely coupled. Details in
            <a href="#microservices-communication">Communication</a>.</p>`,
            explanation: 'Synchronous is a phone call — you wait on the line for the answer. Asynchronous is texting — you send it and get on with your day while the other side responds when ready.',
            bestPractices: ['Async events for multi-service workflows', 'Sync (gRPC) for hot internal real-time reads', 'Add timeouts + circuit breakers to every sync call'],
            commonMistakes: ['Long synchronous chains that compound latency and failure', 'Using sync calls for fire-and-forget work', 'No timeout on remote calls'],
            interviewTip: 'Tie the choice to a property: "does the caller need an answer now?" Sync if yes and the chain is short; async otherwise.',
            followUp: ['What does an API gateway do?', 'Why is gRPC faster than REST/JSON internally?', 'How does async enable eventual consistency?']
        },
        {
            question: 'Why does each microservice own its own database (database-per-service)?',
            difficulty: 'medium',
            answer: `<p>A private data store keeps services <strong>loosely coupled</strong>: each can evolve its
            schema independently, pick the best storage engine (polyglot persistence), and scale its data on its
            own. A shared database creates tight coupling — one schema change can break several services.</p>
            <p>The trade-off is that cross-service queries become harder; you solve that with API composition or
            CQRS read models. See <a href="#microservices-data">Data Management</a>.</p>`,
            explanation: 'Each department keeping its own filing cabinet means one department can reorganize its files without breaking everyone else. One shared cabinet means every reorganization is a company-wide negotiation.',
            bestPractices: ['No shared tables between services', 'Synchronize state via events', 'Use CQRS read models for cross-service queries'],
            commonMistakes: ['Sharing a database "just for this one join"', 'Assuming distributed 2PC transactions will scale', 'Ignoring the cross-service query cost'],
            interviewTip: 'State the benefit (loose coupling, independent evolution) and the cost (harder cross-service queries) in the same breath.',
            followUp: ['How do you query data across services?', 'What is eventual consistency?', 'What is the saga pattern?']
        },
        {
            question: 'What operational capabilities are prerequisites before adopting microservices?',
            difficulty: 'hard',
            answer: `<p>Microservices shift complexity from code into operations, so the platform must exist first:</p>
            <ul>
                <li><strong>Automated CI/CD</strong> per service (build, test, deploy in minutes)</li>
                <li><strong>Container orchestration</strong> (Kubernetes or equivalent)</li>
                <li><strong>Observability</strong> — centralized logging, distributed tracing, metrics, alerting</li>
                <li><strong>Service discovery &amp; config/secrets management</strong></li>
                <li><strong>A DevOps culture</strong> where teams own their services in production</li>
            </ul>
            <p>Without these, the operational overhead of many services becomes unsustainable. See
            <a href="#microservices-deployment">Deployment</a> and
            <a href="#microservices-observability">Observability</a>.</p>`,
            explanation: 'Running microservices without a platform is like opening 20 restaurant branches with no supply chain, no training, and no POS system — each branch might work alone, but the whole operation collapses under coordination cost.',
            bestPractices: ['Build a "golden path" service template', 'Standardize the platform, allow polyglot code', 'Automate rollbacks and scaling'],
            commonMistakes: ['Splitting into services before CI/CD exists', 'No budget for platform engineering', 'Manual deployments across many services'],
            interviewTip: 'List the platform prerequisites — it shows you understand microservices are an operational commitment, not just a code structure.',
            followUp: ['What is platform engineering / a golden path?', 'What belongs in a service mesh vs a library?', 'How does observability change with microservices?'],
            architectPerspective: 'The adoption decision is organizational before it is technical: Conway\'s Law is the strongest predictor of success. I start the conversation with "how many autonomous teams do we have and can we fund a platform team?" rather than "how many services should we build?"'
        },
        {
            question: 'How would you migrate an existing monolith to microservices?',
            difficulty: 'hard',
            answer: `<p>Incrementally, never big-bang. Use the <strong>Strangler Fig</strong> pattern: put a routing
            facade/gateway in front of the monolith, extract one capability at a time into a new service (with its
            own data), route just that traffic to the new service, and repeat until the monolith can be retired.</p>
            <p>Pick the first slice by value/risk — often the most volatile or independently-scalable part — and
            keep the monolith as a fallback during transition.</p>`,
            explanation: 'Instead of demolishing a house while living in it, you build one new room at a time, move daily life into it, and only tear down the old structure once every room is replaced.',
            bestPractices: ['Front the monolith with a routing facade first', 'Extract by bounded context, not by layer', 'Migrate the highest-value/volatile slice first', 'Use an anti-corruption layer to avoid leaking the legacy model'],
            commonMistakes: ['Attempting a big-bang rewrite', 'Extracting a service that still shares the monolith DB', 'Choosing a trivial first slice that proves nothing'],
            interviewTip: 'Contrast explicitly with a big-bang rewrite and stress "one capability at a time behind a facade." Mention the shared-DB trap and the anti-corruption layer.',
            followUp: ['What is an anti-corruption layer?', 'How do you handle data both systems need during migration?', 'How do you decide the extraction order?'],
            seniorPerspective: 'I treat the routing facade and the first extracted slice as a proof of the whole approach: if we cannot cleanly separate one capability and its data, we are not ready to split further. That first slice de-risks the entire program.'
        }
    ]
});
