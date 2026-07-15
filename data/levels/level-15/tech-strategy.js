/* ═══════════════════════════════════════════════════════════════════
   TECHNICAL STRATEGY — Level 15: Leadership (Engineering Management)
   Technology radar, ADRs/RFCs, managing technical debt, build vs buy,
   roadmaps, and aligning technical decisions with business goals.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('tech-strategy', {

    title: 'Technical Strategy',
    level: 15,
    group: 'leadership-advanced',
    description: 'Setting technical direction: technology radar, ADRs and RFCs, managing technical debt, build vs buy, roadmaps, and aligning engineering decisions with business goals.',
    difficulty: 'expert',
    estimatedMinutes: 40,
    prerequisites: ['leadership-core'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Technical strategy</strong> is the set of decisions and principles that guide <em>how</em> an
            engineering organization builds software to achieve business goals. It connects high-level business
            objectives to concrete technology choices, and it is a core responsibility of senior/staff/principal
            engineers and engineering leaders.</p>
            <p>Good technical strategy is not about chasing the newest technology; it is about making deliberate,
            well-reasoned, well-communicated decisions that serve the business and the team over time.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>What technical strategy is and how it ties to business goals</li>
                <li>ADRs and RFCs for documenting and aligning on decisions</li>
                <li>Technology radar for managing the tech portfolio</li>
                <li>Managing technical debt deliberately</li>
                <li>Build vs buy decisions</li>
                <li>Roadmaps and balancing innovation with delivery</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Business-Aligned Technology Decisions</h4>
            <p>Technical choices should serve business goals (speed to market, cost, reliability, scale). The
            question is never "is this cool?" but "does this help us achieve X?"</p>
            <h4>ADR (Architecture Decision Record)</h4>
            <p>A short document capturing a significant decision: the context, the options considered, the decision,
            and the consequences. ADRs create a durable record of <em>why</em>, not just what.</p>
            <h4>RFC (Request for Comments)</h4>
            <p>A proposal circulated for feedback before a decision — enabling broad input and buy-in on
            significant changes.</p>
            <h4>Technology Radar</h4>
            <p>A way to classify technologies into Adopt / Trial / Assess / Hold — managing the organization's tech
            portfolio deliberately rather than ad hoc adoption.</p>
            <h4>Technical Debt</h4>
            <p>The implied cost of shortcuts taken for speed. Strategic leaders manage it deliberately — taking it on
            consciously and paying it down intentionally — rather than letting it accumulate unmanaged.</p>
            <h4>Build vs Buy</h4>
            <p>Whether to build a capability in-house or use a third-party/SaaS solution — a recurring strategic
            decision balancing control, cost, time, and core-competency focus.</p>`,
            mermaid: `flowchart TB
    Biz[Business goals] --> Strategy[Technical strategy]
    Strategy --> Decisions[Decisions: ADRs/RFCs]
    Strategy --> Radar[Tech radar: Adopt/Trial/Assess/Hold]
    Strategy --> Debt[Debt management]
    Strategy --> BvB[Build vs Buy]
    Decisions --> Outcomes[Outcomes serve the business]`
        },
        {
            title: 'How It Works',
            content: `<p>Setting and executing technical strategy in practice:</p>
            <ol>
                <li><strong>Understand the business context:</strong> goals, constraints, timelines, and what success
                looks like.</li>
                <li><strong>Identify key decisions:</strong> the high-leverage choices (architecture, platform, build
                vs buy) that will shape outcomes.</li>
                <li><strong>Evaluate options with trade-offs:</strong> weigh cost, time, risk, maintainability, and
                team capability — not novelty.</li>
                <li><strong>Document and align (ADR/RFC):</strong> write down the decision and rationale; circulate
                for input and buy-in.</li>
                <li><strong>Communicate and execute:</strong> ensure teams understand the why; sequence work via a
                roadmap balancing delivery and investment.</li>
                <li><strong>Revisit:</strong> strategy is not static — review decisions as context changes.</li>
            </ol>`,
            code: `// Architecture Decision Record (ADR) - lightweight, durable record of WHY
// docs/adr/0007-adopt-postgres-over-mongodb.md
//
// # ADR 0007: Use PostgreSQL as the primary datastore
// Status: Accepted (2026-06)
// Context: We need a primary store for transactional order data with
//   strong consistency, relational queries, and team SQL familiarity.
// Decision: Adopt PostgreSQL (managed) as the primary datastore.
// Options considered:
//   - PostgreSQL: ACID, relational, team knows it, managed offerings  [chosen]
//   - MongoDB: flexible schema, but we need transactions + joins
//   - DynamoDB: scales, but access patterns are not fixed yet
// Consequences: + strong consistency & queries; - must plan sharding if
//   we exceed a single node; team upskilling minimal.
//
// ADRs are immutable; superseded ones link to their replacement.`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>The technology radar quadrants/rings for portfolio management:</p>`,
            mermaid: `flowchart TB
    subgraph Radar[Technology Radar Rings]
        Adopt[ADOPT: proven, use freely]
        Trial[TRIAL: promising, use on real projects with care]
        Assess[ASSESS: explore, build a spike]
        Hold[HOLD: avoid for new work / phase out]
    end
    Adopt --> Trial --> Assess
    Hold -.-> Assess
    style Adopt fill:#bbf7d0,color:#1e293b
    style Hold fill:#fecaca,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Practical artifacts: RFC template, debt register, and a build-vs-buy scorecard:</p>`,
            tabs: [
                {
                    label: 'RFC Template',
                    code: `// RFC: <Title>  (circulated for feedback BEFORE deciding)
//
// Summary: what is being proposed, in 2-3 sentences.
// Motivation / problem: why now? what does it unblock?
// Proposal: the approach, with enough detail to evaluate.
// Alternatives considered: and why not them.
// Trade-offs / risks: cost, complexity, migration, team impact.
// Rollout / migration plan: how we get there safely.
// Open questions: where input is most needed.
//
// Process: author drafts -> reviewers comment (async) -> discuss ->
// decide -> the decision becomes an ADR. Inclusive input -> better
// decisions + buy-in (people support what they helped shape).`,
                    language: 'csharp'
                },
                {
                    label: 'Tech Debt Register',
                    code: `// Treat technical debt like a managed backlog, not invisible rot.
// Each item: what, impact, interest (cost of NOT fixing), effort, owner.
//
// | Item                        | Impact                  | "Interest"        | Effort |
// |-----------------------------|-------------------------|-------------------|--------|
// | No retries on payment API   | Lost txns on blips      | High (revenue)    | S      |
// | God-class OrderService      | Slows every order change| High (velocity)   | L      |
// | Legacy auth library (EOL)   | Security/CVE risk       | High (risk)       | M      |
//
// Prioritize by interest (ongoing cost) x change-frequency, not by ugliness.
// Reserve a fixed capacity (e.g., 20%) each iteration to pay it down.`,
                    language: 'csharp'
                },
                {
                    label: 'Build vs Buy Scorecard',
                    code: `// Score each option against weighted criteria for the decision.
//
// Criteria (weight)        Build         Buy (SaaS)
// ----------------------------------------------------------
// Core differentiator?     yes->build    no->buy
// Time to value            slow          fast
// Total cost (3-5 yr)      dev+maintain  subscription+lock-in
// Control/customization    full          limited
// Ongoing maintenance      you own it    vendor owns it
// Risk (security/compliance) you own     shared/vendor
//
// Rule of thumb: BUILD only your core differentiators; BUY commodity
// capabilities (auth, payments, email, observability). Do not build what
// is not your competitive advantage.`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Tie Every Decision to Business Value</h4>
            <p>Justify technical choices by the business outcome they serve (speed, cost, reliability, scale), not by
            novelty or personal preference.</p>
            <h4>Do: Document Decisions with ADRs</h4>
            <p>Capture context, options, decision, and consequences. Future engineers (and future you) need to know
            <em>why</em>, especially when reconsidering.</p>
            <h4>Do: Use RFCs for Buy-In</h4>
            <p>Circulate significant proposals for feedback. Inclusive decision-making produces better decisions and
            the buy-in needed to execute.</p>
            <h4>Do: Manage Tech Debt Deliberately</h4>
            <p>Make debt visible (a register), take it on consciously, and reserve capacity to pay it down. Prioritize
            by ongoing cost and change frequency.</p>
            <h4>Do: Build Only Your Differentiators</h4>
            <p>Buy commodity capabilities; build what is genuinely your competitive advantage. Don't reinvent auth or
            payments.</p>
            <h4>Do: Balance Innovation and Delivery</h4>
            <p>Reserve some capacity for exploration/modernization while consistently shipping. An all-features or
            all-rewrite strategy both fail.</p>`,
            callout: {
                type: 'tip',
                title: 'Boring Technology Is a Strategy',
                text: 'The "choose boring technology" principle: every novel technology you adopt spends a limited "innovation token." Proven, well-understood tools have known failure modes, hiring pools, and operational maturity. Reserve innovation for where it is a genuine competitive advantage \u2014 use boring, proven tech everywhere else.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Resume-Driven Development</h4>
            <p>Choosing technology because it's trendy or good for engineers' resumes rather than because it serves
            the business. Leads to a fragmented, hard-to-maintain stack.</p>
            <h4>Mistake: Ignoring Technical Debt Until Crisis</h4>
            <p>Letting debt accumulate invisibly until velocity grinds to a halt or an incident forces a costly
            emergency rewrite. Manage it continuously.</p>
            <h4>Mistake: Building Commodity Capabilities</h4>
            <p>Spending scarce engineering on auth, payments, or email infrastructure that mature vendors provide
            cheaply and reliably. Build only your differentiators.</p>
            <h4>Mistake: Big-Bang Rewrites</h4>
            <p>Betting the company on a from-scratch rewrite. They overrun, lose embedded knowledge, and ship new
            bugs. Prefer incremental modernization (Strangler Fig).</p>
            <h4>Mistake: Decisions Without Documentation or Buy-In</h4>
            <p>Top-down mandates with no rationale or input breed resistance and are forgotten/relitigated later. Use
            ADRs/RFCs.</p>
            <h4>Mistake: Strategy as a One-Time Document</h4>
            <p>Writing a strategy deck and never revisiting it. Context changes; strategy must be living.</p>`,
            code: `// Anti-pattern: "Let's rewrite the monolith in microservices with the
// newest framework because the team wants to learn it."
// - No clear business driver
// - High risk big-bang rewrite
// - Innovation tokens spent on non-differentiators
//
// Strategic alternative: "Our bottleneck is order-processing throughput,
// which is a business goal. Extract JUST that into a service (Strangler Fig)
// using our proven stack; document the decision in an ADR; measure the win."`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>ADR/RFC Culture</h4>
            <p>Many engineering orgs (Spotify, GitHub, Amazon's narrative culture) institutionalize written decision
            records and proposals to scale good decision-making across many teams.</p>
            <h4>Technology Radar</h4>
            <p>ThoughtWorks popularized the public Technology Radar; companies build internal radars to standardize
            and govern their tech portfolio.</p>
            <h4>Platform Engineering</h4>
            <p>A strategic decision to invest in internal platforms/golden paths that make the right thing the easy
            thing across many teams — improving consistency and velocity.</p>
            <h4>Build vs Buy at Scale</h4>
            <p>Companies continually decide what to build (their differentiators) vs buy (commodity SaaS for auth,
            observability, payments) — a defining strategic lever for focus and cost.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Build vs buy — the recurring strategic trade-off:</p>`,
            table: {
                headers: ['Factor', 'Build', 'Buy (SaaS/3rd-party)'],
                rows: [
                    ['Time to value', 'Slow', 'Fast'],
                    ['Control/customization', 'Full', 'Limited'],
                    ['Upfront cost', 'High (dev time)', 'Low'],
                    ['Ongoing cost', 'Maintenance forever', 'Subscription'],
                    ['Differentiation', 'Can be unique', 'Same as competitors'],
                    ['Maintenance burden', 'You own it', 'Vendor owns it'],
                    ['Best for', 'Core competitive advantage', 'Commodity capabilities'],
                    ['Risk', 'Execution + maintenance', 'Vendor lock-in / continuity']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>"Performance" of technical strategy is measured in organizational outcomes, not code metrics:</p>
            <h4>Velocity and Lead Time</h4>
            <p>Good strategy (clear platforms, managed debt, right tools) increases delivery speed. Track DORA metrics
            (deploy frequency, lead time, change-fail rate, MTTR) as strategic outcomes.</p>
            <h4>Cost of Decisions Over Time</h4>
            <p>Strategic decisions have long tails — a poor architecture or build-vs-buy choice compounds in cost for
            years. Optimize for total cost of ownership, not just upfront.</p>
            <h4>Debt as Interest</h4>
            <p>Unmanaged technical debt acts like compounding interest, slowing every future change. Paying it down
            is an investment that restores velocity.</p>
            <h4>Innovation Token Budget</h4>
            <p>Each unproven technology has an operational/learning cost. Spending innovation only where it
            differentiates keeps the rest of the system fast to operate and hire for.</p>`,
            callout: {
                type: 'info',
                title: 'Measure Strategy with DORA',
                text: 'DORA metrics (deployment frequency, lead time for changes, change failure rate, time to restore) are a strong, research-backed way to measure whether your technical strategy is actually improving delivery performance \u2014 turning "we have a strategy" into evidence it is working.'
            }
        },
        {
            title: 'Testing',
            content: `<p>You "test" strategy by validating assumptions cheaply before committing widely.</p>
            <h4>Spikes &amp; Proofs of Concept</h4>
            <p>Before adopting a technology org-wide (moving it to Adopt), trial it on a real but bounded project to
            validate assumptions about fit, operability, and team learning curve.</p>
            <h4>Reversible vs Irreversible Decisions</h4>
            <p>Move fast on reversible ("two-way door") decisions; gather more evidence for irreversible
            ("one-way door") ones. Match rigor to reversibility.</p>
            <h4>Measure Outcomes</h4>
            <p>After a strategic change, measure the intended outcome (velocity, cost, reliability via DORA/SLOs) to
            confirm it delivered — and be willing to reverse if not.</p>`,
            code: `// Bezos' two-way vs one-way doors - calibrate decision rigor to reversibility
//
// Two-way door (reversible): choosing a logging library, a feature-flag tool
//   -> decide fast, try it, reverse cheaply if wrong. Don't over-deliberate.
//
// One-way door (hard to reverse): primary datastore, public API contract,
//   core architecture, programming language
//   -> invest in RFC, spikes, evidence, broad input before committing.
//
// Misclassifying these is a common strategic error: slow on reversible
// decisions (analysis paralysis) and reckless on irreversible ones.`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Technical strategy appears in staff+/leadership and architecture interviews:</p>
            <ul>
                <li><strong>Tie technology to business value</strong> — never advocate tech for its own sake</li>
                <li><strong>Know ADRs/RFCs</strong> for documenting and aligning on decisions</li>
                <li><strong>Discuss managing tech debt deliberately</strong> (visible, prioritized, paid down)</li>
                <li><strong>Have a build-vs-buy framework</strong> — build differentiators, buy commodities</li>
                <li><strong>Cite "boring technology" and two-way/one-way doors</strong> for decision judgment</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Staff+ Signal',
                text: 'At staff/principal level, interviewers want to see business-aligned, evidence-based, well-communicated decision-making \u2014 not the latest tech. Framing choices around trade-offs, reversibility, total cost of ownership, and buy-in (ADRs/RFCs) is exactly the judgment they assess.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Resources</h4>
            <ul>
                <li>Michael Nygard: "Documenting Architecture Decisions" (the ADR origin)</li>
                <li>Dan McKinley: "Choose Boring Technology"</li>
                <li>ThoughtWorks Technology Radar (thoughtworks.com/radar)</li>
                <li><em>Accelerate</em> by Forsgren, Humble, Kim (DORA metrics)</li>
                <li><em>The Staff Engineer's Path</em> by Tanya Reilly</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Technical strategy aligns technology decisions with business goals</strong> — not novelty</li>
                <li><strong>ADRs</strong> record the why (context/options/decision/consequences); <strong>RFCs</strong> gather input and buy-in</li>
                <li><strong>Manage tech debt deliberately:</strong> make it visible, prioritize by ongoing cost, pay it down</li>
                <li><strong>Build your differentiators, buy commodities</strong></li>
                <li><strong>Choose boring technology;</strong> spend innovation tokens only where they give advantage</li>
                <li><strong>Match decision rigor to reversibility</strong> (two-way vs one-way doors)</li>
                <li><strong>Measure strategy with DORA metrics</strong> and revisit as context changes</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Draft a Technical Strategy Decision</h4>
            <ol>
                <li>Pick a real decision (e.g., adopt a message broker, build vs buy auth, modernize a monolith)</li>
                <li>Write an RFC: problem, proposal, alternatives, trade-offs, rollout, open questions</li>
                <li>Classify the decision as two-way or one-way door and justify your decision rigor</li>
                <li>Apply the build-vs-buy scorecard (is it a differentiator?)</li>
                <li>Convert the decision into an ADR (context/options/decision/consequences)</li>
                <li>Define the DORA/business metric you'd track to know if it worked</li>
            </ol>`,
            code: `// 1. Decision: e.g., "Adopt managed Kafka vs build on RabbitMQ vs SQS"
// 2. RFC with alternatives + trade-offs + rollout/migration
// 3. one-way door? (hard to reverse) -> more evidence/spike + broad input
// 4. build vs buy: messaging is commodity -> buy/managed unless differentiator
// 5. ADR capturing the chosen option and consequences
// 6. metric: lead time / throughput / operational cost before vs after`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What is an ADR and why use one?<br/>
                    <em>A: An Architecture Decision Record documents a significant decision \u2014 context, options considered,
                    the decision, and consequences. It preserves the WHY so future engineers understand the rationale and
                    can revisit it intelligently.</em></li>
                <li><strong>Q:</strong> When should you build vs buy?<br/>
                    <em>A: Build capabilities that are your core competitive differentiator; buy commodity capabilities
                    (auth, payments, email, observability) where mature vendors provide them cheaply and reliably. Don't
                    spend scarce engineering reinventing non-differentiators.</em></li>
                <li><strong>Q:</strong> What does "choose boring technology" mean?<br/>
                    <em>A: Prefer proven, well-understood technologies with known failure modes, operational maturity, and
                    hiring pools. Each novel technology spends a limited "innovation token" \u2014 reserve those for genuine
                    competitive advantages.</em></li>
                <li><strong>Q:</strong> How do two-way and one-way door decisions differ?<br/>
                    <em>A: Two-way (reversible) decisions should be made fast and cheaply reversed if wrong; one-way
                    (irreversible/costly to reverse) decisions warrant more evidence, spikes, and broad input. Match
                    decision rigor to reversibility.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'How do you decide whether to build a capability in-house or buy a third-party solution?',
            difficulty: 'medium',
            answer: `<p>The guiding principle: <strong>build your differentiators, buy commodities</strong>. If a
            capability is your core competitive advantage, building gives you control and uniqueness. If it is a
            commodity (auth, payments, email, observability, message brokers), buy/use a managed service — mature
            vendors do it better, cheaper, and you avoid the perpetual maintenance burden.</p>
            <p>Weigh: time to value (buy is faster), total cost over 3-5 years (build = dev + ongoing maintenance;
            buy = subscription + lock-in), control/customization (build wins), risk (security/compliance, vendor
            continuity), and team focus (every commodity you build is engineering not spent on your product).</p>`,
            explanation: 'A restaurant builds its signature dishes (differentiator) but buys its ovens, electricity, and accounting software (commodities). Forging your own oven would waste effort on something others provide better, distracting from the food that actually wins customers.',
            bestPractices: ['Build core differentiators; buy commodities', 'Compare total cost of ownership, not just upfront', 'Weigh maintenance burden and team focus', 'Consider vendor lock-in and continuity risk'],
            commonMistakes: ['Building commodity infra (auth/payments) to "save money"', 'Buying for a true differentiator and being unable to customize', 'Ignoring long-term maintenance cost of building'],
            interviewTip: 'Lead with "build differentiators, buy commodities" then list the trade-off factors. Naming maintenance burden and team focus (opportunity cost) shows strategic maturity.',
            followUp: ['How do you handle vendor lock-in risk?', 'When would you build something that is technically a commodity?']
        },
        {
            question: 'How do you manage technical debt strategically rather than letting it accumulate?',
            difficulty: 'medium',
            answer: `<p>Treat technical debt as a deliberately managed portfolio, not invisible rot:</p>
            <ul>
                <li><strong>Make it visible:</strong> maintain a debt register — each item with its impact,
                "interest" (ongoing cost of not fixing), effort, and owner.</li>
                <li><strong>Take it on consciously:</strong> sometimes shipping fast with known debt is the right
                business call — but record it and plan to pay it back.</li>
                <li><strong>Prioritize by interest x change frequency:</strong> fix debt in hot, frequently-changed
                areas first; ignore debt in stable code nobody touches.</li>
                <li><strong>Reserve capacity:</strong> allocate a fixed portion of each iteration (e.g., 20%) to
                paying it down so it doesn't compound.</li>
                <li><strong>Tie to business impact:</strong> frame debt paydown in terms of velocity, risk, or
                reliability so it competes fairly with features.</li>
            </ul>`,
            explanation: 'Technical debt is like a loan: a little, taken deliberately, can help you move fast and is fine if you pay it down. Ignored, the interest compounds until the payments (slow, buggy development) consume all your capacity. Strategic leaders track the balance and budget repayments.',
            bestPractices: ['Maintain a visible debt register', 'Prioritize by ongoing cost x change frequency', 'Reserve fixed capacity to pay down', 'Frame in business terms (velocity/risk)'],
            commonMistakes: ['Letting debt stay invisible until crisis', 'Fixing cosmetic debt in stable code', 'Big-bang "stop everything and refactor"', 'No deliberate paydown capacity'],
            interviewTip: 'Use the loan/interest metaphor and emphasize prioritizing by change frequency (hot code first). Framing paydown in business terms shows you can sell it to stakeholders.',
            followUp: ['How do you justify debt paydown to a product manager?', 'How do you decide which debt to fix first?'],
            seniorPerspective: 'I refuse to fight technical debt as a moral crusade ("the code is ugly") because that argument always loses to features. Instead I quantify it: which debt is in the code we change every sprint, what does it cost us in lead time and incidents, and what is the payback. Debt in a stable, rarely-touched module is usually fine to leave \u2014 paying it down is effort with no return. I reserve a standing ~20% capacity for paydown so it never compounds into the kind of crisis that tempts teams toward a doomed big-bang rewrite.'
        },
        {
            question: 'A team wants to rewrite a critical legacy system using a new tech stack. How do you evaluate this as a technical leader?',
            difficulty: 'hard',
            answer: `<p>I'd apply strategic scrutiny before endorsing a rewrite:</p>
            <ol>
                <li><strong>Clarify the business driver:</strong> what problem does this solve? Velocity? Scale?
                Reliability? Hiring? "We want to learn X" or "the code is ugly" are not sufficient business
                justifications.</li>
                <li><strong>Challenge big-bang rewrites:</strong> they routinely overrun, lose decades of embedded
                edge-case knowledge, and ship new bugs while delivering no new value for months. Default to
                incremental modernization (Strangler Fig) instead.</li>
                <li><strong>Assess the tech choice:</strong> is the new stack chosen for business reasons or
                resume-driven? Apply "choose boring technology" — is the innovation token worth spending here?</li>
                <li><strong>Evaluate reversibility:</strong> a rewrite is largely a one-way door — warranting an RFC,
                spikes to validate assumptions, and broad input before committing.</li>
                <li><strong>Propose incremental path + metrics:</strong> extract the highest-value/riskiest slice
                first behind a facade, validate with metrics (DORA, the target business outcome), and expand only if
                it pays off — preserving the option to stop.</li>
                <li><strong>Document the decision (ADR)</strong> so the rationale and trade-offs are recorded.</li>
            </ol>
            <p>The leadership move is to redirect the team's energy from a risky big-bang toward a business-justified,
            incremental, measurable approach — while respecting their motivation and keeping morale.</p>`,
            explanation: 'It is like a city wanting to demolish and rebuild a busy bridge versus replacing it lane by lane while traffic flows. The demolish-and-rebuild plan is exciting and "clean," but it closes the bridge for years and risks discovering too late that the old one had clever load-handling nobody documented. Incremental replacement delivers value continuously and lets you stop if it is not working.',
            bestPractices: ['Demand a clear business driver', 'Prefer incremental (Strangler Fig) over big-bang', 'Apply "choose boring technology"', 'Treat as a one-way door: RFC + spikes + evidence', 'Define success metrics; preserve the option to stop', 'Record the decision in an ADR'],
            commonMistakes: ['Approving a rewrite for resume/novelty reasons', 'Big-bang rewrite with no incremental fallback', 'No business justification or success metric', 'Underestimating embedded knowledge in legacy code'],
            interviewTip: 'Show you can say "no, but here is a better path" diplomatically: redirect to incremental modernization with a business driver and metrics. That balance of judgment and team leadership is the staff+ signal.',
            followUp: ['How do you keep team morale if you reject their rewrite?', 'What metric proves the modernization is working?', 'When IS a full rewrite actually justified?'],
            seniorPerspective: 'My starting position on any "let\u2019s rewrite it" proposal is skepticism, because I have watched multi-year big-bang rewrites consume teams and quietly fail to recreate edge cases the original encoded over a decade. But I never just say no \u2014 I redirect: what is the actual business pain, and what is the smallest slice we can carve out (Strangler Fig) to prove the new approach delivers it? I also separate two things engineers often conflate: modernizing for genuine business reasons (valid) versus rewriting because the current code is unpleasant or the new framework is exciting (not a business case). Naming that distinction respectfully, and giving the team a path to use new tech on a bounded, measurable slice, usually channels the energy productively.'
        }
    ,
        {
            question: 'How do you decide build vs buy for a capability?',
            difficulty: 'advanced',
            answer: `<p>Build only what is <strong>core differentiation</strong>; buy or adopt for everything that is undifferentiated heavy lifting.</p>
            <ul>
                <li><strong>Is it core to your value?</strong> \u2014 the thing customers pay you for, build it. Auth, payments, email infra \u2014 buy unless you are that business.</li>
                <li><strong>Total cost of ownership</strong> \u2014 building includes ongoing maintenance, security, on-call, and opportunity cost, not just the initial write.</li>
                <li><strong>Time to market</strong> \u2014 buying is usually far faster; speed can outweigh fit early on.</li>
                <li><strong>Lock-in &amp; exit</strong> \u2014 weigh switching cost and whether you can abstract the vendor behind an interface.</li>
            </ul>`,
            explanation: 'You build your secret recipe; you do not build the electricity grid to power your kitchen. Pour effort into what makes you different, and rent the commodities.',
            bestPractices: ['Build core differentiators; buy undifferentiated capabilities', 'Evaluate total cost of ownership, not just initial build effort', 'Abstract vendors behind an interface to limit lock-in', 'Bias to buy early for speed; revisit if scale/cost economics change'],
            commonMistakes: ['Building commodity infrastructure for ego or "we can do it better"', 'Ignoring maintenance/on-call cost of home-grown systems', 'Deep vendor coupling with no abstraction or exit plan', 'Buying something that touches your core differentiation'],
            interviewTip: 'Anchor on core-vs-context (differentiation) and total cost of ownership. Mentioning that you abstract vendors to manage lock-in shows pragmatic, reversible thinking.',
            followUp: ['How do you mitigate vendor lock-in?', 'When would you migrate from buy to build?', 'How does TCO change the naive build-is-cheaper assumption?'],
            seniorPerspective: 'My default is buy unless it is genuinely core, because every system we build is one we must staff, secure, and operate forever. Teams chronically underestimate that long tail and overestimate how special their commodity needs are.',
            architectPerspective: 'I frame it as where to spend the team\u2019s finite engineering capital. Building commodity infrastructure dilutes focus on the product\u2019s actual differentiation, so build/buy is really a strategy decision about where the organization creates unique value.'
        },
        {
            question: 'What are ADRs and a technology radar, and how do they support technical strategy?',
            difficulty: 'medium',
            answer: `<p><strong>ADRs (Architecture Decision Records)</strong> are short, versioned documents capturing a significant decision: the context, the options considered, the choice, and the consequences. They preserve the <em>why</em> so future engineers don't relitigate or accidentally undo decisions.</p>
            <p>A <strong>technology radar</strong> classifies technologies into rings \u2014 Adopt, Trial, Assess, Hold \u2014 giving teams a shared, deliberate view of what to use, experiment with, or avoid. Together they make strategy explicit and durable rather than tribal knowledge.</p>`,
            explanation: 'ADRs are the commit history for architecture decisions, and the tech radar is a shared map showing which roads are paved (adopt), under construction (trial), or closed (hold).',
            bestPractices: ['Write an ADR for any consequential, hard-to-reverse decision', 'Keep ADRs short, immutable, and stored with the code', 'Use the radar rings (Adopt/Trial/Assess/Hold) to guide tech choices', 'Revisit the radar periodically as the ecosystem and needs change'],
            commonMistakes: ['Making big decisions verbally with no record of the rationale', 'Writing ADRs nobody reads because they are bloated', 'A radar that becomes a rigid mandate instead of guidance', 'Never updating the radar, so it goes stale'],
            interviewTip: 'Define ADRs as capturing the "why" of decisions and the radar as Adopt/Trial/Assess/Hold guidance. The senior point: both make strategy explicit and prevent relitigating settled decisions.',
            followUp: ['What belongs in a good ADR?', 'How do you prevent the radar from becoming bureaucratic?', 'How do ADRs help onboarding?'],
            seniorPerspective: 'ADRs save me from the recurring "why on earth did we do it this way?" conversation \u2014 the answer, with its context, is written down. Six months later that record is often worth more than the decision itself.',
            architectPerspective: 'These are governance-as-lightweight-artifacts: they let many teams make autonomous decisions consistently without a central committee, by sharing rationale (ADRs) and direction (radar) rather than enforcing every choice top-down.'
        },
        {
            question: 'How do you manage technical debt strategically rather than reactively?',
            difficulty: 'advanced',
            answer: `<p>Treat tech debt like financial debt: some is a deliberate, productive loan; some is reckless. The goal is to manage interest, not achieve zero debt.</p>
            <ul>
                <li><strong>Make it visible</strong> \u2014 track debt in the backlog with its impact (slows X, risks Y), not as invisible grumbling.</li>
                <li><strong>Prioritize by interest</strong> \u2014 pay down debt in code you change often or that blocks roadmap items; ignore debt in stable, rarely-touched corners.</li>
                <li><strong>Continuous, not big-bang</strong> \u2014 allocate a steady fraction of capacity (or fix-as-you-touch) rather than mythical "refactor sprints".</li>
                <li><strong>Tie to business impact</strong> \u2014 justify paydown by velocity, reliability, or risk, the language leadership funds.</li>
            </ul>`,
            explanation: 'Tech debt is like a credit card: a small balance used wisely is fine, but only if you pay the interest. You pay down the cards with the highest interest (the code you touch daily), not the ones you never use.',
            bestPractices: ['Make debt visible and quantified in the backlog', 'Prioritize debt by how often the code changes and what it blocks', 'Pay down continuously (boy-scout rule / capacity allocation)', 'Justify paydown in business terms: velocity, risk, reliability'],
            commonMistakes: ['Treating all tech debt as equally urgent (or equally ignorable)', 'Refactoring stable code nobody touches for purity\u2019s sake', 'Waiting for a mythical "we\u2019ll fix it later" refactor sprint', 'Framing debt purely technically, so the business never funds it'],
            interviewTip: 'Use the debt/interest metaphor and stress prioritizing by change frequency. Saying you justify paydown in business terms (velocity/risk) shows you can actually get it funded.',
            followUp: ['How do you quantify the cost of a piece of tech debt?', 'How much capacity should go to debt?', 'How do you say no to new debt under deadline pressure?'],
            seniorPerspective: 'I deliberately incur debt sometimes to hit a deadline \u2014 but I record it and schedule the paydown, because undocumented debt is what compounds silently. The debt that actually hurts is always in the hot paths we edit constantly.',
            architectPerspective: 'I steer debt toward the edges of the system and away from core abstractions, because debt in a widely-depended-upon module has systemic interest. Strategic debt management is really about controlling where complexity is allowed to accumulate.'
        },
        {
            question: 'How do you build and maintain a technology radar for your organization?',
            difficulty: 'hard',
            answer: `<p>A technology radar gives teams a <strong>shared, deliberate map</strong> of what to adopt, experiment with, or avoid — replacing ad-hoc decisions with organizational learning.</p>
            <ul>
                <li><strong>Define the rings</strong> — Adopt (default, proven in production), Trial (use on a real project with guardrails), Assess (explore and evaluate, no production yet), Hold (stop new adoption, migrate away over time).</li>
                <li><strong>Define the quadrants</strong> — typically: Languages/Frameworks, Tools, Platforms, Techniques. Customize to your org.</li>
                <li><strong>Source nominations broadly</strong> — any engineer can propose a technology with a brief rationale. This makes it bottom-up, not ivory tower.</li>
                <li><strong>Review quarterly</strong> — a small tech council reviews nominations, discusses, and updates placements. Publish the result and the reasoning.</li>
                <li><strong>Tie to decision-making</strong> — Adopt items need no justification to use; Trial items need a learning plan; Assess items need a sponsor; Hold items require exception approval.</li>
                <li><strong>Evolve it</strong> — technologies move between rings as experience accumulates. A Trial success promotes to Adopt; a failed Trial moves to Hold.</li>
            </ul>`,
            explanation: 'A tech radar is like a restaurant menu for the engineering org: it tells everyone what is served (Adopt), what is the daily special to try (Trial), what the chef is testing in the back (Assess), and what has been retired (Hold). Without it, every team orders off-menu and the kitchen is chaos.',
            bestPractices: ['Let any engineer nominate technologies — make it bottom-up, not decree', 'Review and publish quarterly with brief reasoning for each placement', 'Tie ring placement to real decision rules (Adopt = default choice, Hold = needs exception)', 'Evolve placements over time as production experience accumulates', 'Keep it lightweight — a one-page visualization, not a 50-page policy document'],
            commonMistakes: ['Building the radar once and never updating it, so it goes stale', 'Making it top-down with no input from teams who use the tech daily', 'No teeth — the radar exists but nobody references it in design decisions', 'Too many items in "Assess" with no movement, creating analysis paralysis'],
            interviewTip: 'Define the four rings clearly and stress that the radar is a living document with a regular cadence. Connecting it to real decision-making authority (not just advisory) is the hard-level signal.',
            followUp: ['How do you handle a team that wants to use a Hold technology?', 'How do you prevent the radar from becoming bureaucratic?', 'Who decides ring placement?'],
            seniorPerspective: 'The radar is only useful if it has teeth — when a team proposes a Hold technology, they need to justify why their case is exceptional. Without that, it is just a pretty poster nobody looks at.',
            architectPerspective: 'I treat the radar as a governance tool that distributes decision rights: Adopt means teams choose freely, Trial means bounded experiments with reporting, and Hold means escalation. This lets hundreds of engineers make consistent technology decisions without a central bottleneck.'
        },
        {
            question: 'When should you choose "boring technology" over cutting-edge solutions?',
            difficulty: 'hard',
            answer: `<p>The default should be <strong>boring (proven, well-understood) technology</strong> unless cutting-edge provides a specific, justified advantage that boring cannot achieve within acceptable cost.</p>
            <ul>
                <li><strong>Boring is a feature</strong> — proven tech has known failure modes, mature tooling, available talent, community answers, and predictable behavior under load. You spend time building product, not fighting infrastructure.</li>
                <li><strong>Innovation tokens are finite</strong> — every team has limited capacity for novelty. Spend tokens where they differentiate (your core product), not on commodity infrastructure.</li>
                <li><strong>Choose cutting-edge only when</strong>: (a) boring genuinely cannot meet a requirement (scale, latency, capability), (b) the risk is bounded and reversible, and (c) the team has capacity to absorb the learning curve and operational immaturity.</li>
                <li><strong>Operational cost matters most</strong> — the exciting choice costs more to hire for, debug, and operate in production. Factor in the 3am on-call reality, not just the hackathon demo.</li>
                <li><strong>Decouple experiments</strong> — if you must try something new, isolate it behind an interface so it can be replaced if it fails without infecting the whole system.</li>
            </ul>`,
            explanation: 'Boring technology is like a Toyota Camry: it starts every morning, parts are cheap, and any mechanic can fix it. Cutting-edge is a concept car: thrilling on the track, but you cannot get it serviced anywhere and nobody knows its failure modes yet.',
            bestPractices: ['Default to proven technology; require an explicit justification to deviate', 'Spend innovation tokens on your core differentiator, not on commodity infrastructure', 'Evaluate the full operational cost: hiring, debugging, on-call, community support', 'Isolate any cutting-edge choice behind an interface so it can be swapped if it fails', 'Use the tech radar to formalize what is boring (Adopt) vs experimental (Trial/Assess)'],
            commonMistakes: ['Choosing cutting-edge for resume-driven development or team excitement', 'Ignoring operational immaturity (missing tooling, sparse docs, small community)', 'Spending innovation tokens on infrastructure instead of product differentiation', 'No fallback plan if the cutting-edge choice fails in production'],
            interviewTip: 'Use the "innovation tokens" framing and explain that boring tech maximizes time spent on the actual product. The mature signal is knowing when to override the default — and making it explicit and bounded.',
            followUp: ['How do you convince a team excited about new tech to use boring tech?', 'When is it worth spending an innovation token?', 'How do you evaluate if a new technology is ready for production?'],
            seniorPerspective: 'I ask one question: "what do we gain that boring tech genuinely cannot provide?" If the answer is "it\u2019s more fun" or "it\u2019s what Netflix uses", that is not a justification. If the answer is "we need 10x throughput that PostgreSQL cannot deliver at our scale", we have a real conversation.',
            architectPerspective: 'Boring technology at scale is the foundation that lets a few carefully chosen innovations thrive. My architecture strategy is to minimize the surface area of novelty so that when something does go wrong at 3am, the on-call engineer has mature docs, community answers, and battle-tested tooling to work with.'
        }
    ]
});
