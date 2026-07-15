/* ═══════════════════════════════════════════════════════════════════
   MICROSERVICES — Case Studies
   How real organizations adopted microservices: drivers, patterns
   used, and the lessons each teaches.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('microservices-case-studies', {

    title: 'Microservices: Case Studies',
    level: 5,
    group: 'microservices',
    description: 'Real-world microservices adoption at Netflix, Amazon, Uber (DOMA), Monzo, Spotify, and a sports-betting platform — the driver behind each, the patterns they used, and the concrete lesson each case teaches.',
    difficulty: 'advanced',
    estimatedMinutes: 30,
    prerequisites: ['microservices'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Abstract principles land better with concrete examples. Each organization below adopted
            microservices for a <strong>specific reason</strong> and paid a <strong>specific price</strong>. The
            pattern across all of them: microservices solved a real, felt problem — and demanded heavy investment in
            automation, observability, and organization to work.</p>
            <p>In interviews, citing a case with its lesson ("Amazon's two-pizza teams show microservices are an
            organizational decision") is far stronger than reciting definitions.</p>`
        },
        {
            title: 'Netflix — Resilience at Global Scale',
            content: `<p><strong>Driver:</strong> after a database corruption caused a major outage, Netflix moved
            from a monolith to the cloud and to microservices to gain scalability and fault isolation for a service
            streaming to 200M+ subscribers.</p>
            <p><strong>Patterns used:</strong> hundreds of services; the <em>Hystrix</em> circuit breaker (later
            succeeded by Resilience4j-style libraries); <em>Eureka</em> for service discovery; <em>Zuul</em> as an
            edge gateway; and <strong>Chaos Monkey</strong> — deliberately killing production instances to prove the
            system degrades gracefully.</p>
            <p><strong>Lesson:</strong> at scale, <em>designing for failure</em> and continuously testing it (chaos
            engineering) matters more than any single service boundary. Netflix open-sourced much of the resilience
            toolkit the industry now uses.</p>`,
            callout: {
                type: 'info',
                title: 'Takeaway',
                text: 'Netflix proves resilience is a first-class design concern, not an afterthought — and that you must test failure deliberately, not hope it works.'
            }
        },
        {
            title: 'Amazon — Organizational Decomposition',
            content: `<p><strong>Driver:</strong> in the early 2000s, a monolithic retail platform slowed every team;
            releases were coupled and painful.</p>
            <p><strong>Patterns used:</strong> decomposition into services owned by <strong>two-pizza teams</strong>
            (small enough to be fed by two pizzas), with a famous mandate that all teams expose functionality
            <em>only</em> through service interfaces — no back-door integration. This service-oriented discipline
            later enabled internal capabilities (storage, queuing, compute) to be productized as <strong>AWS</strong>
            (S3, SQS, EC2).</p>
            <p><strong>Lesson:</strong> microservices are as much an <em>organizational</em> decision as a technical
            one (Conway's Law). Team autonomy and strict interface boundaries were the real unlock — and had
            outsized downstream value.</p>`
        },
        {
            title: 'Uber — From Monolith to DOMA',
            content: `<p><strong>Driver:</strong> hypergrowth outpaced Uber's monolith; they split aggressively and
            eventually hit the <em>opposite</em> problem — 2,000+ services with tangled dependencies that were hard
            to reason about.</p>
            <p><strong>Patterns used:</strong> massive event-driven processing (millions of events/sec through
            Kafka) for matching, pricing, and dispatch; then <strong>Domain-Oriented Microservice Architecture
            (DOMA)</strong> — grouping services into <em>domains</em> with clear gateways and layered dependencies
            to tame the sprawl.</p>
            <p><strong>Lesson:</strong> more services is not automatically better. Past a point, unstructured
            proliferation becomes its own problem, and you need higher-level <em>domain</em> structure over the
            services. Both under- and over-decomposition hurt.</p>`,
            callout: {
                type: 'warning',
                title: 'Takeaway',
                text: 'Uber shows the pendulum can swing too far. Thousands of fine-grained services created a coordination and dependency nightmare that needed a domain layer to fix — over-decomposition is real.'
            }
        },
        {
            title: 'Monzo — Microservices as a Startup Bet',
            content: `<p><strong>Driver:</strong> the UK challenger bank chose microservices from early on because
            banking demands strong isolation, independent scaling, and a clear audit boundary per capability.</p>
            <p><strong>Patterns used:</strong> 1,600+ services (mostly Go) on Kubernetes, a heavily asynchronous
            model, and Cassandra for storage — with substantial up-front <strong>platform engineering</strong> so
            teams could ship new services quickly and safely.</p>
            <p><strong>Lesson:</strong> microservices <em>can</em> work early — but only with serious platform
            investment from day one. Monzo is the exception that proves the "monolith-first" rule: they accepted a
            very high operational cost deliberately because their domain justified it.</p>`
        },
        {
            title: 'Spotify — Autonomy and Team Topology',
            content: `<p><strong>Driver:</strong> Spotify wanted many teams to experiment and ship features
            independently without stepping on each other.</p>
            <p><strong>Patterns used:</strong> services organized around <em>squads</em> (small autonomous teams),
            grouped into tribes/guilds — an explicit team topology mirrored by the service architecture. Features
            (playlists, recommendations, playback) evolve as independent services so squads can A/B test and release
            without central coordination.</p>
            <p><strong>Lesson:</strong> the "Spotify model" is really about <strong>team autonomy</strong>; the
            microservice architecture follows the team topology (Conway's Law applied deliberately). The
            organizational design is the point, not the service count.</p>`
        },
        {
            title: 'Sports Betting Platform — Consistency-Critical Services',
            content: `<p><strong>Driver:</strong> a live wagering platform has sharply different requirements per
            capability — high-throughput odds ingestion and broadcast, versus money movement that must be exact.</p>
            <p><strong>Patterns used:</strong> separate services for inventory/odds ingestion (from feeds like
            Betradar/BetGenius, wrapped behind an <strong>anti-corruption layer</strong>), odds broadcast
            (SignalR/WebSocket fan-out), bet placement, and settlement. Odds updates are <strong>asynchronous and
            eventually consistent</strong>; but bet placement and settlement are <strong>transactional and
            isolated</strong> with strict guarantees — money cannot be eventually consistent.</p>
            <p><strong>Lesson:</strong> apply eventual consistency where it is safe (odds display) and strong
            consistency where money or compliance is at stake (placement, settlement). The <em>boundary</em> between
            them is the key design decision — see <a href="#microservices-data">Data Management</a>.</p>`,
            callout: {
                type: 'tip',
                title: 'Takeaway',
                text: 'One system can and should mix consistency models: eventual where staleness is harmless, strong where money moves. Deciding that boundary per capability is the real architecture work.'
            }
        },
        {
            title: 'Cross-Case Lessons',
            content: `<p>Common threads across all the cases:</p>`,
            table: {
                headers: ['Organization', 'Primary driver', 'Signature lesson'],
                rows: [
                    ['Netflix', 'Scale + fault isolation', 'Design for failure; test it with chaos'],
                    ['Amazon', 'Team velocity', 'Microservices are an organizational decision (two-pizza teams)'],
                    ['Uber', 'Hypergrowth then sprawl', 'Over-decomposition is real; add a domain layer (DOMA)'],
                    ['Monzo', 'Banking isolation', 'Early microservices work only with heavy platform investment'],
                    ['Spotify', 'Team autonomy', 'Architecture follows team topology (Conway)'],
                    ['Betting platform', 'Mixed consistency needs', 'Eventual where safe, strong where money moves']
                ]
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Netflix:</strong> design for failure and test it (chaos engineering)</li>
                <li><strong>Amazon:</strong> microservices are an organizational decision — autonomous teams + strict interfaces</li>
                <li><strong>Uber:</strong> over-decomposition needs a domain layer (DOMA); more services is not automatically better</li>
                <li><strong>Monzo:</strong> early microservices demand heavy platform-engineering investment</li>
                <li><strong>Betting platform:</strong> mix consistency models deliberately — eventual vs strong per capability</li>
            </ul>`
        },
        {
            title: 'Continue the Series',
            content: `<p>Previous: <a href="#microservices-challenges">← Challenges &amp; Anti-Patterns</a> ·
            Back to <a href="#microservices">Microservices: Overview</a>. You have completed the microservices
            curriculum.</p>`
        }
    ],

    questions: [
        {
            question: 'What did Netflix pioneer in microservices, and what is the core lesson?',
            difficulty: 'medium',
            answer: `<p>Netflix moved from a monolith to cloud microservices after a major outage, scaling to 200M+
            subscribers. They pioneered much of the resilience toolkit: the <strong>Hystrix</strong> circuit
            breaker, <strong>Eureka</strong> service discovery, the <strong>Zuul</strong> edge gateway, and
            <strong>Chaos Monkey</strong> (deliberately terminating production instances to prove graceful
            degradation).</p>
            <p>The core lesson: at scale, <strong>designing for failure and continuously testing it</strong> matters
            more than any single service split. Resilience is a first-class design concern, not an afterthought.</p>`,
            explanation: 'Netflix runs fire drills in the live building (Chaos Monkey) so that when a real fire starts, the alarms and exits are already proven to work.',
            bestPractices: ['Treat resilience as first-class design', 'Test failure deliberately (chaos)', 'Provide reusable resilience libraries/platform'],
            commonMistakes: ['Assuming resilience without testing it', 'Copying Netflix scale patterns without Netflix scale', 'Ignoring graceful degradation'],
            interviewTip: 'Name the specific tools (Hystrix/Eureka/Zuul/Chaos Monkey) and the lesson (design for failure, test it) — specificity signals real knowledge.',
            followUp: ['What is Chaos Monkey?', 'Why did Hystrix give way to Resilience4j?', 'How does a circuit breaker work?']
        },
        {
            question: "What does Amazon's two-pizza team model teach about microservices?",
            difficulty: 'medium',
            answer: `<p>Amazon decomposed its monolithic retail platform into services owned by <strong>two-pizza
            teams</strong> (small enough to feed with two pizzas) and mandated that teams expose functionality
            <em>only</em> through service interfaces. This service discipline later enabled AWS (S3, SQS, EC2 began
            as internal services).</p>
            <p>The lesson: microservices are as much an <strong>organizational</strong> decision as a technical one
            (Conway's Law). Team autonomy plus strict interface boundaries were the real unlock — the architecture
            followed the team structure.</p>`,
            explanation: 'Amazon reorganized into small independent crews, each fully owning their stall and only interacting through a clear service window — which made the whole marketplace scale.',
            bestPractices: ['Small autonomous teams owning services', 'Strict interface-only integration', 'Align team topology with services'],
            commonMistakes: ['Large teams sharing services', 'Back-door integration bypassing interfaces', 'Ignoring the org dimension'],
            interviewTip: 'Tie it to Conway\'s Law and "organizational decision first" — that is the point interviewers want from this example.',
            followUp: ["How does Conway's Law apply?", 'Why does interface-only integration matter?', 'How did this enable AWS?']
        },
        {
            question: "What problem did Uber's DOMA solve, and what does it teach about decomposition?",
            difficulty: 'hard',
            answer: `<p>Uber split aggressively during hypergrowth and ended up with 2,000+ services with tangled
            dependencies — hard to reason about, own, and change. <strong>Domain-Oriented Microservice Architecture
            (DOMA)</strong> grouped services into <em>domains</em> with clear gateways and layered dependencies,
            adding higher-level structure over the sprawl.</p>
            <p>The lesson: <strong>over-decomposition is real</strong>. More services is not automatically better;
            past a point, unstructured proliferation creates a coordination and dependency nightmare that needs a
            domain layer to tame. Both too few and too many services cause pain.</p>`,
            explanation: 'Uber built thousands of tiny rooms and got lost in the maze; DOMA is adding labeled wings and corridors so people can find their way again.',
            bestPractices: ['Add domain-level structure over many services', 'Use domain gateways and layered dependencies', 'Avoid unbounded service proliferation'],
            commonMistakes: ['Assuming more services is always better', 'No higher-level domain grouping', 'Tangled cross-service dependencies'],
            interviewTip: 'Use Uber as the counterweight to "split everything" — over-decomposition and the DOMA domain layer show balanced judgment.',
            followUp: ['How does DOMA layer dependencies?', 'What is a domain gateway?', 'How do you detect over-decomposition?']
        },
        {
            question: 'Monzo runs 1,600+ services as a bank. Does that contradict "monolith first"?',
            difficulty: 'hard',
            answer: `<p>Not really — it is the exception that proves the rule. Monzo chose microservices early because
            banking genuinely demands strong isolation, independent scaling, and clear per-capability audit
            boundaries. Critically, they made a <strong>heavy up-front platform-engineering investment</strong>
            (Kubernetes, Go, async messaging, Cassandra, tooling) so teams could ship services safely.</p>
            <p>The lesson: early microservices <em>can</em> work, but only with serious platform investment and a
            domain that justifies the operational cost. For most teams without that investment or need, monolith-first
            remains the safer default.</p>`,
            explanation: 'Monzo built the full franchise supply chain before opening many branches. It works because they invested in the infrastructure first — most startups have not, so one shop is wiser.',
            bestPractices: ['Invest in platform engineering before scaling out', 'Justify early microservices with real domain needs', 'Standardize service creation (golden path)'],
            commonMistakes: ['Citing Monzo to justify premature microservices without their platform', 'Ignoring the up-front investment they made', 'Assuming banking-level needs apply to every product'],
            interviewTip: 'Acknowledge it works AND explain the precondition (massive platform investment) — nuance beats a dogmatic "always monolith first."',
            followUp: ['What platform investment does early microservices require?', 'When is monolith-first still right?', 'What is a golden path?']
        },
        {
            question: 'How does a sports-betting platform mix eventual and strong consistency across services?',
            difficulty: 'hard',
            answer: `<p>It splits by capability with different consistency needs. Odds ingestion (from feeds like
            Betradar, behind an anti-corruption layer) and odds broadcast (SignalR/WebSocket fan-out) are
            <strong>asynchronous and eventually consistent</strong> — a slightly stale odds display is acceptable.
            But <strong>bet placement and settlement</strong> are <strong>transactional and strongly consistent</strong>
            within their services — money movement cannot be eventually consistent or double-applied.</p>
            <p>The lesson: one system deliberately mixes consistency models, keeping strong consistency inside the
            services that own money/compliance and letting cross-service propagation be eventual. Placing that
            boundary correctly is the core design decision.</p>`,
            explanation: 'The scoreboard (odds) can lag a few seconds harmlessly, but the cash register (bets/settlement) must be exact to the cent every single time.',
            bestPractices: ['Eventual consistency where staleness is harmless', 'Strong consistency within money/compliance services', 'Wrap vendor feeds in an anti-corruption layer', 'Make the consistency boundary explicit'],
            commonMistakes: ['Making payments eventually consistent', 'Spreading a money invariant across services', 'Letting vendor models leak into the domain'],
            interviewTip: 'Use the scoreboard-vs-register metaphor and stress that the boundary between eventual and strong is the real design work.',
            followUp: ['How do you keep bet placement strongly consistent?', 'Why wrap the odds feed in an ACL?', 'How does CAP inform this?']
        },
        {
            question: 'What common threads run across Netflix, Amazon, Uber, Monzo, and Spotify?',
            difficulty: 'medium',
            answer: `<p>Several: (1) each adopted microservices to solve a <strong>real, specific problem</strong>
            (scale, team velocity, isolation), not for fashion; (2) <strong>team/organizational structure</strong>
            was central (Amazon two-pizza, Spotify squads — Conway's Law); (3) success required heavy investment in
            <strong>automation, platform, and observability</strong>; and (4) they learned the <strong>limits</strong>
            — Uber's over-decomposition, the recognition that resilience and platform work are prerequisites.</p>
            <p>The meta-lesson: microservices are a means to an end, effective only with the organizational and
            operational maturity to support them.</p>`,
            explanation: 'Every successful case is less a story about splitting code and more about organizing people and building the supply chain (platform) that makes many services manageable.',
            bestPractices: ['Adopt against a real problem', 'Align teams with services', 'Invest in platform + observability', 'Watch for over-decomposition'],
            commonMistakes: ['Copying big-tech architecture without their context', 'Ignoring the org/platform prerequisites', 'Treating service count as a goal'],
            interviewTip: 'Synthesize the cases into the meta-lesson (real problem + org alignment + platform investment) rather than listing them — synthesis signals seniority.',
            followUp: ['Why is team topology central?', 'What platform capabilities are prerequisites?', 'How do you avoid cargo-culting big-tech patterns?'],
            architectPerspective: 'What I take from these cases is that the architecture diagram is the easy part. The winners invested in team design and a paved platform first; the strugglers copied the service topology without the organizational and operational foundation, and inherited the complexity without the benefits.'
        },
        {
            question: 'How should you use case studies like these in a system-design interview?',
            difficulty: 'medium',
            answer: `<p>Use them as <strong>evidence for a trade-off</strong>, not name-dropping. Cite a case to
            justify a decision: "I would design for failure with circuit breakers and chaos testing, as Netflix
            does"; "I would align services to teams — Amazon's two-pizza model shows this is an organizational
            decision"; "I would avoid over-splitting — Uber needed DOMA to recover from 2,000+ services."</p>
            <p>Always pair the reference with the reasoning and the trade-off it illustrates. Referencing a case to
            support a specific, contextual choice signals real understanding; reciting "Netflix uses microservices"
            without context signals the opposite.</p>`,
            explanation: 'A case study is a witness you call to support your argument — you quote them for a reason, you do not just list famous names to sound credible.',
            bestPractices: ['Cite a case to justify a specific trade-off', 'Pair the reference with reasoning', 'Match the case to the context/scale'],
            commonMistakes: ['Name-dropping without relevance', 'Assuming your scale matches Netflix/Uber', 'Reciting cases without the lesson'],
            interviewTip: 'Attach every reference to a concrete design choice and its trade-off — context-appropriate citation is the signal, not the name itself.',
            followUp: ['When is a big-tech pattern inappropriate for your scale?', 'How do you frame a trade-off with a case?', 'Which case fits a team-autonomy argument?']
        },
        {
            question: 'What is the single biggest recurring reason microservices adoptions succeed or fail?',
            difficulty: 'hard',
            answer: `<p><strong>Organizational and operational readiness</strong>, above any technical choice. The
            successes (Amazon, Spotify, Monzo) aligned team topology to services (Conway's Law) and invested in a
            platform (CI/CD, observability, service templates). The struggles came from splitting without that
            foundation — too few teams, no platform, unclear domains — or from over-splitting (Uber) without
            higher-level structure.</p>
            <p>So the biggest lever is not the diagram; it is whether the organization has the teams, platform, and
            domain clarity to operate many services. Absent that, a modular monolith is the wiser choice.</p>`,
            explanation: 'Two teams can be handed the same blueprint; the one with skilled crews and a supply chain builds the city, the one without ends up with twenty half-built houses and no roads between them.',
            bestPractices: ['Ensure team + platform + domain readiness before splitting', 'Align organization to architecture', 'Prefer a modular monolith when readiness is absent'],
            commonMistakes: ['Focusing on the service diagram over org/platform readiness', 'Splitting with insufficient teams/platform', 'Ignoring domain clarity'],
            interviewTip: 'State plainly that success is organizational/operational before technical — and that the modular monolith is the fallback when readiness is missing.',
            followUp: ['What does operational readiness include?', 'How does Conway\'s Law predict success?', 'When should you not adopt microservices?'],
            seniorPerspective: 'Across every adoption I have seen or read about, the deciding factor was never the elegance of the service boundaries — it was whether the org had autonomous teams and a real platform. Get those right and imperfect boundaries can be corrected; get them wrong and the cleanest diagram still collapses under operational weight.'
        }
    ]
});
