/* ═══════════════════════════════════════════════════════════════════
   MICROSERVICES — Decomposition & Boundaries
   How to find service boundaries: bounded contexts, business capability
   vs subdomain, service sizing, Conway's Law, and extraction seams.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('microservices-decomposition', {

    title: 'Microservices: Decomposition & Boundaries',
    level: 5,
    group: 'microservices',
    description: 'Finding the right service boundaries — decompose by business capability and DDD bounded context, size services correctly, respect Conway\'s Law, and identify extraction seams when splitting a monolith.',
    difficulty: 'advanced',
    estimatedMinutes: 35,
    prerequisites: ['microservices', 'arch-ddd'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>The single most consequential decision in microservices is <strong>where to draw the
            boundaries</strong>. Get it wrong and you build a distributed monolith — services that must change and
            deploy together. Get it right and teams move independently.</p>
            <p>Boundaries should follow the <strong>business domain</strong>, not technical layers. This lesson
            covers the two primary decomposition strategies, how to size a service, the organizational force
            (Conway's Law) that shapes your architecture, and how to find safe seams when extracting from a
            monolith.</p>
            <p>This is the applied companion to <a href="#arch-ddd">Domain-Driven Design</a> — read that for the
            tactical DDD building blocks (aggregates, entities, value objects).</p>`
        },
        {
            title: 'Decompose by Business Capability',
            content: `<p>A <strong>business capability</strong> is something the business does, independent of how
            it is implemented — Order Management, Payment Processing, Inventory, Shipping, Pricing. Each capability
            becomes a candidate service.</p>
            <p>Capabilities are stable: a retailer will always "manage orders" and "take payments" even as the
            technology changes underneath. Because they map to how the business is organized, capability-aligned
            services also map cleanly to team ownership.</p>
            <p>Contrast this with decomposing by <strong>technical layer</strong> (a UI service, a business-logic
            service, a data service) — the classic anti-pattern. Layer-based services force every feature change
            to touch all three, recreating the coupling you were trying to escape.</p>`,
            mermaid: `graph TB
    subgraph Good["By Business Capability (good)"]
        O["Order Service"]
        P["Payment Service"]
        I["Inventory Service"]
    end
    subgraph Bad["By Technical Layer (anti-pattern)"]
        UI["UI Service"]
        BL["Business Logic Service"]
        DA["Data Service"]
    end
    O -.->|self-contained| O
    UI -->|every change touches all| BL
    BL --> DA`
        },
        {
            title: 'Decompose by Subdomain (DDD Bounded Contexts)',
            content: `<p>Domain-Driven Design gives a rigorous lens: identify <strong>subdomains</strong> and their
            <strong>bounded contexts</strong>. A bounded context is a boundary within which a domain model and its
            <em>ubiquitous language</em> are consistent.</p>
            <p>The key insight: the same word means different things in different contexts, and that is correct. An
            "Order" in the <em>Sales</em> context (cart, pricing, discounts) is a different model from an "Order"
            in the <em>Fulfilment</em> context (pick, pack, ship) or the <em>Billing</em> context (invoice, tax).
            Each context owns its own model rather than forcing one shared, bloated "Order" everywhere.</p>
            <h4>Types of subdomain</h4>
            <ul>
                <li><strong>Core domain</strong> — your competitive advantage; invest the most here.</li>
                <li><strong>Supporting subdomain</strong> — necessary but not differentiating.</li>
                <li><strong>Generic subdomain</strong> — solved problems (auth, notifications); buy or use
                off-the-shelf rather than build.</li>
            </ul>
            <p><strong>Event Storming</strong> is the workshop technique to discover these boundaries: map domain
            events on a wall, cluster them, and the clusters reveal candidate bounded contexts.</p>`
        },
        {
            title: 'How to Size a Service',
            content: `<p>"Micro" is misleading — a service should be as small as it can be while still being
            <strong>cohesive and independently deployable</strong>, and no smaller. Signals you have the size right:</p>
            <ul>
                <li>One team can own it end to end (build, run, on-call).</li>
                <li>It has a single, clear responsibility you can describe in one sentence.</li>
                <li>It owns its data and can be deployed without coordinating with other services.</li>
                <li>Most changes to its capability happen entirely inside it.</li>
            </ul>
            <h4>Too big</h4>
            <p>Multiple teams contend over it; changes touch unrelated features; it owns several unrelated data
            stores. Split along the internal seam.</p>
            <h4>Too small (nano-services)</h4>
            <p>Every user request fans out across many tiny services; latency and failure compound; the
            operational overhead dwarfs the logic. Merge related nano-services back together. When in doubt,
            <strong>err on the larger side</strong> — merging later is harder than it sounds, but splitting a
            cohesive service is easier than untangling an over-split one.</p>`,
            callout: {
                type: 'tip',
                title: 'Heuristic: things that change together belong together',
                text: 'If two pieces of functionality consistently change in the same pull request, they probably belong in the same service. High-frequency cross-service change is the clearest sign a boundary is wrong.'
            }
        },
        {
            title: "Conway's Law",
            content: `<p><strong>Conway's Law:</strong> organizations design systems that mirror their own
            communication structure. If you have four teams building a compiler, you will get a four-pass compiler.</p>
            <p>The practical consequence: your service boundaries will drift toward your team boundaries whether you
            plan it or not. So design them together. The <strong>Inverse Conway Maneuver</strong> deliberately
            shapes teams to match the desired architecture — organize teams around business capabilities and the
            services will follow.</p>
            <p>This is why microservices are an organizational decision first: if your team topology does not match
            your intended service topology, the architecture will fight you.</p>`,
            table: {
                headers: ['Team structure', 'Architecture it tends to produce'],
                rows: [
                    ['Functional silos (frontend, backend, DBA)', 'Layer-based services (the anti-pattern)'],
                    ['Cross-functional capability teams', 'Capability-aligned services (desired)'],
                    ['One large team', 'A monolith (which may be the right call)'],
                    ['Many small autonomous teams', 'Many independently-deployable services']
                ]
            }
        },
        {
            title: 'Finding Seams When Extracting from a Monolith',
            content: `<p>You rarely design microservices on a blank page — you extract them from a monolith. The
            skill is finding <strong>seams</strong>: natural cleavage lines where a capability can be separated
            with minimal coupling.</p>
            <ol>
                <li><strong>Map bounded contexts</strong> in the existing code and data.</li>
                <li><strong>Find the data seam</strong> — which tables belong exclusively to the candidate
                capability? Foreign keys crossing the seam are the hard part.</li>
                <li><strong>Break the database dependency first</strong> — often the biggest task. Duplicate or
                synchronize data via events before moving code.</li>
                <li><strong>Extract behind a facade</strong> — route calls through an interface so callers do not
                know whether the capability lives in the monolith or the new service (Strangler Fig).</li>
                <li><strong>Pick the first seam by value and risk</strong> — the most volatile or most
                independently-scalable capability makes the best proof of concept.</li>
            </ol>
            <p>See <a href="#microservices-patterns">Patterns Catalog</a> for the Strangler Fig and Anti-Corruption
            Layer patterns that make extraction safe.</p>`,
            code: `// A seam expressed as an interface inside the monolith FIRST.
// Callers depend on the abstraction, not the implementation, so the
// implementation can later move behind an HTTP client with no caller change.

public interface IPricingService
{
    Task<Money> CalculatePriceAsync(BasketId basketId, CancellationToken ct);
}

// Step 1: in-process implementation (still inside the monolith)
public sealed class InProcessPricingService : IPricingService
{
    public Task<Money> CalculatePriceAsync(BasketId id, CancellationToken ct) =>
        Task.FromResult(_engine.Price(id)); // local call
}

// Step 2 (later): swap for a remote client — callers are unchanged
public sealed class RemotePricingClient : IPricingService
{
    private readonly HttpClient _http;
    public RemotePricingClient(HttpClient http) => _http = http;

    public async Task<Money> CalculatePriceAsync(BasketId id, CancellationToken ct)
    {
        var res = await _http.GetFromJsonAsync<PriceDto>($"/price/{id}", ct);
        return new Money(res!.Amount, res.Currency);
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Decomposing by technical layer</h4>
            <p>UI / logic / data services force every change to cross all three. Decompose by capability instead.</p>
            <h4>Entity services</h4>
            <p>Creating a service per database table ("Customer service", "Address service") produces nano-services
            with no business meaning and endless chatter. Model capabilities, not tables.</p>
            <h4>Splitting before the domain is understood</h4>
            <p>Early-stage products pivot; boundaries drawn too early are wrong. Start with a modular monolith and
            extract when boundaries stabilize.</p>
            <h4>Ignoring the data seam</h4>
            <p>Moving code but leaving a shared database creates a distributed monolith. The data must be separated
            too.</p>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Decompose by <strong>business capability</strong> and <strong>bounded context</strong>, never by technical layer</li>
                <li>Size services for <strong>single-team ownership</strong> and independent deployment; err larger, not smaller</li>
                <li><strong>Conway's Law</strong> means team topology and service topology must be designed together</li>
                <li>When extracting from a monolith, <strong>break the data dependency first</strong> and hide the move behind a facade</li>
                <li>"Things that change together belong together" is your sharpest boundary heuristic</li>
            </ul>`
        },
        {
            title: 'Continue the Series',
            content: `<p>Back to <a href="#microservices">Microservices: Overview</a> ·
            Next: <a href="#microservices-communication">Communication →</a></p>`
        }
    ],

    questions: [
        {
            question: 'What is a bounded context and why is it the basis for service boundaries?',
            difficulty: 'medium',
            answer: `<p>A <strong>bounded context</strong> is a boundary within which a single domain model and its
            ubiquitous language are internally consistent. The same term ("Order", "Customer") can have a different
            model in another context, and that separation is intentional.</p>
            <p>It is the basis for service boundaries because a context is, by definition, the largest chunk of the
            domain that is internally cohesive and externally decoupled — exactly the property you want in a service.
            Aligning one service to one bounded context means most changes stay inside the service.</p>`,
            explanation: "It is like the word 'book' meaning different things to a library (a catalog record), a printer (a physical object), and an accountant (a ledger entry). Forcing one shared definition on all three would satisfy none of them; each context keeps its own.",
            bestPractices: ['One service per bounded context as the default', 'Use event storming to discover contexts', 'Let each context own its own model and language'],
            commonMistakes: ['Forcing one shared canonical model across contexts', 'Splitting a single context across multiple services', 'Confusing a bounded context with a database table'],
            interviewTip: 'Give the "same word, different model" example — it instantly demonstrates you understand bounded contexts rather than reciting the definition.',
            followUp: ['What is a context map?', 'How does event storming reveal boundaries?', 'What is the ubiquitous language?']
        },
        {
            question: 'Contrast decomposing by business capability with decomposing by technical layer.',
            difficulty: 'medium',
            answer: `<p><strong>By business capability</strong> each service owns a complete slice of what the
            business does (Orders, Payments) — UI-to-data for that capability. Changes to a capability stay in one
            service, and it maps to a team.</p>
            <p><strong>By technical layer</strong> you split into a UI service, a business-logic service, and a data
            service. This is an anti-pattern: every feature spans all three, so a single change requires coordinated
            edits and deploys across services — a distributed monolith.</p>`,
            explanation: 'Capability slices are like departments (each handles one business function end to end). Layer slices are like separating a company into "people who talk", "people who think", and "people who file paperwork" — nothing gets done without all three.',
            bestPractices: ['Slice vertically by capability, not horizontally by layer', 'Keep UI-to-data ownership within one service', 'Map each capability to one team'],
            commonMistakes: ['Building UI/logic/data services', 'Treating "microservices" as tiers', 'Sharing a data layer across capability services'],
            interviewTip: 'Name the failure mode of layer-slicing explicitly: "every change touches all layers, so you deploy them together" — that is the distributed monolith.',
            followUp: ['What is a distributed monolith?', 'Why does vertical slicing improve autonomy?', 'How do capabilities map to teams?']
        },
        {
            question: 'How do you decide if a service is the right size?',
            difficulty: 'hard',
            answer: `<p>Size for <strong>cohesion and independent deployability</strong>, not for smallness. Right
            size signals: one team can own it end to end, it has one describable responsibility, it owns its data,
            and most changes to its capability stay inside it.</p>
            <p><strong>Too big:</strong> multiple teams contend, changes touch unrelated features. <strong>Too
            small:</strong> requests fan out across many nano-services, compounding latency and failure. When in
            doubt, err on the larger side — over-splitting is harder to undo than merging.</p>`,
            explanation: 'A service should be a well-run department, not a single employee. Too many one-person departments and nothing happens without a dozen hand-offs; too few and the department is a chaotic monolith.',
            bestPractices: ['One team, one clear responsibility, own data', 'Measure cross-service change frequency', 'Prefer larger cohesive services over many nano-services'],
            commonMistakes: ['Creating a service per table (entity services)', 'Chasing "micro" as a goal in itself', 'Ignoring the fan-out cost of tiny services'],
            interviewTip: 'Say "as small as possible while staying cohesive and independently deployable, and no smaller" — and mention that over-splitting is the more expensive mistake.',
            followUp: ['What are nano-services and why are they bad?', 'How does fan-out affect latency?', 'When would you merge two services?']
        },
        {
            question: "What is Conway's Law and how does it affect microservice design?",
            difficulty: 'hard',
            answer: `<p><strong>Conway's Law</strong> states that a system's structure mirrors the communication
            structure of the organization that builds it. Your service boundaries will drift toward your team
            boundaries regardless of intent.</p>
            <p>So design them together. The <strong>Inverse Conway Maneuver</strong> deliberately organizes teams
            around business capabilities so the desired service architecture emerges naturally. Functional silos
            (frontend/backend/DBA) tend to produce layer-based services; cross-functional capability teams produce
            capability-aligned services.</p>`,
            explanation: 'If three teams build a system, you tend to get three subsystems joined where the teams talk. So if you want a certain architecture, first arrange the teams to match it.',
            bestPractices: ['Design team topology and service topology together', 'Use cross-functional capability teams', 'Apply the Inverse Conway Maneuver intentionally'],
            commonMistakes: ['Designing services while ignoring team structure', 'Keeping functional silos but expecting capability services', 'Treating org design as out of scope for architecture'],
            interviewTip: 'Framing microservices as "an organizational decision first" via Conway\'s Law is a strong architect-level signal.',
            followUp: ['What is the Inverse Conway Maneuver?', 'What is a team topology?', 'Why do functional silos produce layered services?'],
            architectPerspective: 'I open the microservices conversation with "how many autonomous teams do we have, and how are they organized?" before any box-drawing. If we cannot align teams to the capabilities we want to split, the split will fail no matter how clean the diagram looks.'
        },
        {
            question: 'How do you find safe seams to extract a service from a monolith?',
            difficulty: 'hard',
            answer: `<p>Find the <strong>data seam</strong> first. Map bounded contexts, identify which tables belong
            exclusively to the candidate capability, and untangle foreign keys crossing the boundary. Break the
            database dependency (duplicate or event-sync the data) before moving code.</p>
            <p>Then extract behind a <strong>facade/interface</strong> so callers do not know where the capability
            lives (Strangler Fig), and choose the first seam by value and risk — the most volatile or
            independently-scalable capability makes the best proof of concept.</p>`,
            explanation: 'Extracting a service is like splitting off a room from an open-plan house: the walls (code) are easy; the shared plumbing and wiring (the database) are the real work.',
            bestPractices: ['Break the data dependency before moving code', 'Extract behind an interface (Strangler Fig)', 'Pick the first seam by value/risk as a proof', 'Use an anti-corruption layer to avoid leaking the legacy model'],
            commonMistakes: ['Moving code but keeping a shared database', 'Extracting a low-value slice that proves nothing', 'Ignoring cross-seam foreign keys'],
            interviewTip: 'Lead with "the data seam is the hard part, not the code" — that reveals real extraction experience.',
            followUp: ['What is the Strangler Fig pattern?', 'How do you split a shared database?', 'What is an anti-corruption layer?']
        },
        {
            question: 'What are "entity services" and why are they an anti-pattern?',
            difficulty: 'medium',
            answer: `<p><strong>Entity services</strong> create one service per data entity/table — a Customer service,
            an Address service, a Product service — exposing little more than CRUD. They are an anti-pattern because
            they carry no business capability, so real features must orchestrate many of them, producing heavy
            chatter, tight coupling, and latency with none of the autonomy benefit.</p>
            <p>Model <strong>capabilities</strong> (which naturally contain several entities) instead of mirroring
            your data model into services.</p>`,
            explanation: 'It is like giving every noun its own department: a "Name Department", an "Address Department". Doing anything useful now requires a meeting between ten departments.',
            bestPractices: ['Model business capabilities, not tables', 'Let a capability own multiple related entities', 'Avoid CRUD-only services'],
            commonMistakes: ['One service per table', 'CRUD services with no behavior', 'Deriving service boundaries from the ER diagram'],
            interviewTip: 'Call out that "a service per table" recreates the fan-out and coupling problems while adding network cost — a clear anti-pattern.',
            followUp: ['How is a capability different from an entity?', 'Why does CRUD-per-service cause chatter?', 'How do aggregates relate to service boundaries?']
        },
        {
            question: 'What is the difference between core, supporting, and generic subdomains, and why does it matter?',
            difficulty: 'medium',
            answer: `<p><strong>Core</strong> subdomains are your competitive advantage (e.g., a betting platform's
            odds engine). <strong>Supporting</strong> subdomains are necessary but not differentiating.
            <strong>Generic</strong> subdomains are solved problems (auth, email, payments plumbing).</p>
            <p>It matters for investment: build and staff your best engineers on the core; buy or use off-the-shelf
            for generic subdomains; keep supporting ones simple. It also guides which services are worth the effort
            to extract and optimize first.</p>`,
            explanation: 'Spend your cooking effort on the signature dish (core), use a decent store-bought sauce for the sides (generic), and keep the garnish simple (supporting).',
            bestPractices: ['Invest most in the core domain', 'Buy/adopt off-the-shelf for generic subdomains', 'Do not gold-plate supporting subdomains'],
            commonMistakes: ['Building bespoke auth/notifications instead of buying', 'Under-investing in the actual differentiator', 'Treating all subdomains as equally important'],
            interviewTip: 'Tie subdomain classification to investment decisions — it shows you connect architecture to business value.',
            followUp: ['How do you identify the core domain?', 'When is building a generic subdomain justified?', 'How does this influence extraction order?']
        },
        {
            question: 'Your teams keep needing cross-service changes for single features. What went wrong and how do you fix it?',
            difficulty: 'hard',
            answer: `<p>The boundaries are wrong — functionality that changes together was split across services,
            producing a distributed monolith. High cross-service change frequency is the diagnostic symptom.</p>
            <p>Fix it by re-drawing boundaries around what actually changes together: measure which services appear
            together in the same change/PR, merge the ones that are consistently coupled, and re-align to bounded
            contexts. Sometimes the right answer is to <strong>merge services back</strong> into a cohesive one, or
            move a misplaced capability to the service that owns its data.</p>`,
            explanation: 'If two "independent" departments always have to hold a joint meeting to approve anything, they are really one department wearing two badges — merge them.',
            bestPractices: ['Measure cross-service co-change frequency', 'Merge services that always change together', 'Re-align boundaries to bounded contexts', 'Move capabilities to the service that owns their data'],
            commonMistakes: ['Adding more integration glue instead of fixing the boundary', 'Refusing to merge services back ("we already split them")', 'Blaming process instead of the boundary'],
            interviewTip: 'Name the metric — "co-change frequency across services" — and be willing to say "merge them back." Reversing a bad split is senior judgment, not failure.',
            followUp: ['How do you measure service coupling?', 'When is merging services the right call?', 'How do you migrate a capability to another service safely?'],
            seniorPerspective: 'I watch how often two services show up in the same pull request. If a "split" consistently forces coordinated changes, it was never a real boundary — and I would rather merge two services back into one cohesive service than keep paying the distributed-monolith tax indefinitely.'
        }
    ]
});
