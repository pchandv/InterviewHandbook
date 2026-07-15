/* ═══════════════════════════════════════════════════════════════════
   MICROSERVICES — Challenges & Anti-Patterns
   The hard problems of microservices and their solutions, plus the
   anti-patterns (distributed monolith and friends) to avoid.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('microservices-challenges', {

    title: 'Microservices: Challenges & Anti-Patterns',
    level: 5,
    group: 'microservices',
    description: 'The distributed-systems challenges microservices introduce — data consistency, debugging, security, config sprawl, versioning, organizational cost — mapped to their solutions, plus the anti-patterns (distributed monolith, shared database, nano-services) to avoid.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['microservices', 'microservices-data'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Microservices buy independent deployability and team autonomy, but they <strong>pay for it in
            distributed-systems complexity</strong>. Every benefit has a matching challenge. Senior candidates are
            expected to name each challenge <em>and</em> the pattern/tooling that addresses it — and to recognize
            the anti-patterns that give you the costs without the benefits.</p>
            <p>This lesson maps the hard problems to their solutions and catalogs the anti-patterns to avoid. Each
            solution links to the sub-topic that covers it in depth.</p>`
        },
        {
            title: 'Challenges & Solutions',
            content: `<p>The canonical hard problems and how you address each:</p>`,
            table: {
                headers: ['Challenge', 'Why it is hard', 'Solution / pattern', 'Tools'],
                rows: [
                    ['Distributed data consistency', 'No cross-service ACID transactions', 'Saga + compensations; eventual consistency', 'MassTransit, NServiceBus'],
                    ['Dual-write to DB and broker', 'DB commit and publish are not atomic', 'Transactional outbox / CDC', 'Debezium, outbox relay'],
                    ['Debugging distributed failures', 'A request spans many services and logs', 'Distributed tracing + correlation ids', 'OpenTelemetry, Jaeger'],
                    ['Testing across boundaries', 'Full E2E is slow and flaky', 'Consumer-driven contract tests', 'Pact, Testcontainers'],
                    ['Deployment coordination', 'Old and new versions coexist', 'Backward-compatible APIs, versioning', 'Semantic versioning, schema registry'],
                    ['Service-to-service security', 'Internal traffic can be spoofed', 'mTLS + identity-based authz (zero trust)', 'Istio, Linkerd, SPIFFE'],
                    ['Configuration sprawl', 'Many services, many environments', 'Centralized config + secrets', 'Vault, Key Vault, ConfigMaps'],
                    ['Cascading failures', 'One failure ripples across the mesh', 'Circuit breaker, bulkhead, timeout, retry', 'Polly, Resilience4j, mesh'],
                    ['Cross-service queries', 'Each service owns its data', 'CQRS read models from events', 'Kafka Streams, materialized views'],
                    ['Observability gaps', 'Metrics/logs scattered per service', 'Unified telemetry pipeline', 'Prometheus, Grafana, Loki, OTel'],
                    ['Organizational cost', 'Many services need many capable teams', 'Platform engineering, golden paths', 'Backstage, internal platforms']
                ]
            }
        },
        {
            title: 'Data Consistency & Debugging',
            content: `<p>The two challenges that trip up most candidates:</p>
            <h4>Distributed data consistency</h4>
            <p>You cannot wrap a change across services in one ACID transaction. Accept <strong>eventual
            consistency</strong> and use <strong>sagas</strong> with compensating transactions, plus the
            <strong>transactional outbox</strong> for reliable event publishing. Keep strong consistency inside the
            single service that owns money/compliance data. (See <a href="#microservices-data">Data Management</a>.)</p>
            <h4>Debugging distributed failures</h4>
            <p>A failing request may touch eight services across many machines — no single log or stack trace has the
            whole story. <strong>Distributed tracing</strong> with a propagated <strong>correlation id</strong>
            stitches the request together; structured logs and metrics complete the picture. (See
            <a href="#microservices-observability">Observability</a>.) Without this, debugging is guesswork.</p>`
        },
        {
            title: 'Security: Zero Trust & mTLS',
            content: `<p>In a monolith, internal calls are in-process and implicitly trusted. In microservices, calls
            cross the network, so internal traffic can be intercepted or spoofed. The answer is <strong>zero
            trust</strong>: never trust the network; authenticate and authorize <em>every</em> service-to-service
            call.</p>
            <ul>
                <li><strong>mTLS</strong> (mutual TLS) — both caller and callee present certificates, so each service
                proves its identity and traffic is encrypted in transit.</li>
                <li><strong>Identity-based authorization</strong> — policies decide which service may call which
                (e.g., only the Order service may call Payment).</li>
                <li><strong>Token propagation</strong> — carry the end-user's identity (JWT) through the call chain
                for user-level authorization, validated at the edge and downstream.</li>
                <li><strong>Secrets management</strong> — credentials in a manager (Vault/Key Vault), rotated, never
                in code.</li>
            </ul>
            <p>A <strong>service mesh</strong> (Istio, Linkerd) or SPIFFE can provide mTLS and identity uniformly
            without per-service code (see <a href="#microservices-deployment">Deployment</a>). See also
            <a href="#zero-trust">Zero Trust</a>.</p>`
        },
        {
            title: 'Versioning & Deployment Coordination',
            content: `<p>Because services deploy independently, old and new versions of a producer and its consumers
            <strong>coexist</strong>. Changes must therefore be <strong>backward and forward compatible</strong>:</p>
            <ul>
                <li><strong>Additive, non-breaking changes</strong> — add optional fields; never remove, rename, or
                retype existing ones.</li>
                <li><strong>Tolerant reader</strong> — consumers ignore unknown fields and tolerate missing optional
                ones.</li>
                <li><strong>Versioning</strong> — for unavoidable breaking changes, run versions in parallel (/v1,
                /v2 or a new event type) and migrate consumers before retiring the old (expand-contract).</li>
                <li><strong>Contract tests + schema registry</strong> — enforce compatibility in CI before deploy.</li>
            </ul>
            <p>Treat it exactly like a zero-downtime database migration: assume the old version is still running and
            must keep working.</p>`
        },
        {
            title: 'The Anti-Patterns',
            content: `<p>These give you the costs of microservices without the benefits — recognize and avoid them:</p>
            <h4>Distributed Monolith</h4>
            <p>Services that deploy together, share a database, or depend on long synchronous chains. You pay
            distributed complexity but cannot deploy or scale independently. Symptom: changing one service forces
            changing several others. Fix: own data per service, prefer async events, restore independent deploys.</p>
            <h4>Shared Database</h4>
            <p>Multiple services reading/writing the same tables — the fastest route to a distributed monolith. A
            schema change breaks several services. Fix: exclusive data ownership, synchronize via events.</p>
            <h4>Nano-Services</h4>
            <p>Services so small (often one per entity) that every request fans out across many, compounding latency
            and operational overhead with no cohesion. Fix: model business capabilities, merge over-split services.</p>
            <h4>Chatty Services</h4>
            <p>Fine-grained interfaces requiring many round trips per operation. Fix: coarser APIs, batching, read
            models (see <a href="#microservices-bottlenecks">Bottlenecks</a>).</p>
            <h4>God Gateway</h4>
            <p>An API gateway stuffed with business logic, coupling all services to it. Fix: keep the gateway to edge
            concerns only.</p>`,
            callout: {
                type: 'warning',
                title: 'The distributed monolith is the cardinal sin',
                text: 'It is worse than a monolith: you carry all the network complexity, partial-failure modes, and operational overhead of microservices, but still cannot deploy or scale services independently. If changing one service routinely forces changing others, you have one.'
            }
        },
        {
            title: 'Organizational & Cost Challenges',
            content: `<p>Not all challenges are technical. Microservices demand:</p>
            <ul>
                <li><strong>Enough capable teams</strong> — many services need many teams that can own them in
                production (Conway's Law). A small team drowns in operational overhead.</li>
                <li><strong>Platform engineering</strong> — someone must build and maintain the shared platform
                (CI/CD, observability, service templates). A "golden path" lets teams ship a new service in hours,
                not weeks.</li>
                <li><strong>Cost visibility</strong> — infrastructure, cognitive load, and time-to-deploy all rise.
                Track whether the split is actually delivering value.</li>
            </ul>
            <p>This is why the honest default is often a modular monolith until scale and team size justify the
            operational investment (see <a href="#microservices">Overview</a>).</p>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Every microservices benefit has a matching <strong>challenge</strong> — know each challenge and its solution/tooling</li>
                <li><strong>Consistency</strong> → sagas + outbox; <strong>debugging</strong> → tracing + correlation ids</li>
                <li><strong>Security</strong> → zero trust + mTLS; <strong>versioning</strong> → backward-compatible + contract tests</li>
                <li>Avoid the <strong>distributed monolith</strong> (and shared DB, nano-services, chatty services, god gateway)</li>
                <li>The hardest challenges are often <strong>organizational</strong> — teams, platform engineering, cost</li>
            </ul>`
        },
        {
            title: 'Continue the Series',
            content: `<p>Previous: <a href="#microservices-bottlenecks">← Bottlenecks &amp; Performance</a> ·
            Back to <a href="#microservices">Overview</a> ·
            Next: <a href="#microservices-case-studies">Case Studies →</a></p>`
        }
    ],

    questions: [
        {
            question: 'What is a distributed monolith, why is it the worst outcome, and how do you avoid it?',
            difficulty: 'hard',
            answer: `<p>A <strong>distributed monolith</strong> has services that must deploy together, share a
            database, or depend on long synchronous chains. It is the worst outcome because you pay the full cost of
            distribution — network failures, partial failures, operational overhead — while getting none of the
            benefit: you still cannot deploy or scale services independently.</p>
            <p>Symptom: changing one service routinely forces changing several others. Avoid it by giving each
            service its own data, preferring asynchronous events over synchronous chains, ensuring every service
            deploys independently, and using contract tests so services can evolve without lock-step releases.</p>`,
            explanation: 'It is a house divided into separate apartments that still share one fridge, one key, and a rule that nobody leaves until everyone leaves — all the hassle of living apart, none of the freedom.',
            bestPractices: ['Own data per service; no shared tables', 'Async events over sync chains', 'Independent deploy pipelines', 'Contract tests for independent evolution'],
            commonMistakes: ['Shared database', 'Synchronous A→B→C→D chains', 'Lock-step releases across services'],
            interviewTip: 'Define the symptom (change one, change many) and stress it is worse than a monolith — that framing is the senior signal.',
            followUp: ['How does a shared database create it?', 'Why are sync chains part of it?', 'How do contract tests prevent it?']
        },
        {
            question: 'How do independently-deployed services evolve APIs and event schemas without breaking each other?',
            difficulty: 'hard',
            answer: `<p>Because old and new versions coexist, changes must be <strong>backward and forward
            compatible</strong>. Make <strong>additive</strong> changes (add optional fields; never remove, rename,
            or retype existing ones). Build <strong>tolerant readers</strong> (ignore unknown fields, tolerate
            missing optional ones). For unavoidable breaking changes, run versions in parallel and migrate consumers
            first (<strong>expand-contract</strong>). Enforce compatibility with <strong>consumer-driven contract
            tests</strong> in CI and a <strong>schema registry</strong> for events.</p>
            <p>The mental model is a zero-downtime DB migration: assume the old version is still running and must keep
            working.</p>`,
            explanation: 'Updating a shared form: you can add new optional boxes and readers should ignore boxes they do not recognize, but you cannot remove a box people still fill in without issuing a clearly-labeled new version and giving everyone time to switch.',
            bestPractices: ['Additive changes; treat removals/renames/type-changes as breaking', 'Tolerant readers', 'Consumer-driven contract tests in CI', 'Schema registry for events; expand-contract for breaks'],
            commonMistakes: ['Removing/renaming a field consumers use', 'Changing a field type in place', 'Big-bang version cutover', 'No contract tests'],
            interviewTip: 'Center on "old and new coexist, so backward/forward compatible" and name tolerant reader + expand-contract — real distributed-systems vocabulary.',
            followUp: ['What is expand-contract?', 'What is a tolerant reader?', 'How does a schema registry enforce compatibility?']
        },
        {
            question: 'How do you secure service-to-service communication (zero trust)?',
            difficulty: 'hard',
            answer: `<p>Adopt <strong>zero trust</strong>: never trust the network; authenticate and authorize every
            call. Use <strong>mTLS</strong> (both sides present certificates) so each service proves its identity and
            traffic is encrypted; <strong>identity-based authorization</strong> policies for which service may call
            which; <strong>token propagation</strong> (JWT) to carry end-user identity through the chain for
            user-level authz; and a <strong>secrets manager</strong> with rotation for credentials.</p>
            <p>A service mesh (Istio, Linkerd) or SPIFFE can provide mTLS and identity uniformly without per-service
            code. See <a href="#zero-trust">Zero Trust</a>.</p>`,
            explanation: 'Zero trust is a building where every door needs a badge — not just the front entrance. Even staff moving between internal rooms must prove who they are every time, and conversations are sealed (encrypted).',
            bestPractices: ['mTLS for identity + encryption in transit', 'Identity-based service-to-service authz', 'Propagate user identity via signed tokens', 'Secrets in a manager, rotated'],
            commonMistakes: ['Trusting internal traffic implicitly', 'Long-lived static credentials in code', 'No service-to-service authorization'],
            interviewTip: 'Lead with "never trust the network" and name mTLS + identity authz; mention a mesh can provide it uniformly.',
            followUp: ['How does mTLS differ from TLS?', 'What is SPIFFE?', 'How do you propagate user identity across services?']
        },
        {
            question: 'How do you tackle configuration sprawl across many services and environments?',
            difficulty: 'medium',
            answer: `<p>Keep config <strong>outside the image</strong> (12-Factor) and <strong>centralize</strong> it so
            settings are consistent and manageable across services and environments — via a config service or
            environment-injected ConfigMaps, with shared defaults. Manage <strong>secrets</strong> separately in a
            secrets manager (Vault, Key Vault) with rotation and least-privilege access — never in images or git.</p>
            <p>Standardize configuration shape with a service template ("golden path") so each new service follows
            the same conventions instead of inventing its own, preventing drift.</p>`,
            explanation: 'Instead of every room having its own thermostat wired differently, you centralize the settings and give each new room the same standard control panel — consistent and easy to manage.',
            bestPractices: ['Config outside the image, centralized', 'Secrets in a manager with rotation', 'Standardize via a service template'],
            commonMistakes: ['Per-service ad-hoc config that drifts', 'Secrets in git/images', 'No shared conventions'],
            interviewTip: 'Cite 12-Factor and "golden path template" — standardization is the real fix for sprawl, not just a config store.',
            followUp: ['What is a golden path / service template?', 'How does secret rotation work?', 'How do you detect config drift?']
        },
        {
            question: 'Why can the biggest microservices challenges be organizational rather than technical?',
            difficulty: 'hard',
            answer: `<p>Microservices mirror the organization (Conway's Law), so success depends on having enough
            <strong>capable, autonomous teams</strong> to own services in production and a <strong>platform
            engineering</strong> capability to build/maintain the shared plumbing (CI/CD, observability, templates).
            A small team splitting into many services drowns in operational overhead; without a platform, every team
            reinvents infrastructure.</p>
            <p>There is also real <strong>cost</strong> — infrastructure, cognitive load, slower cross-service
            changes. If the org cannot support this, a modular monolith delivers more value. The technology is often
            the easy part; aligning teams and funding the platform is the hard part.</p>`,
            explanation: 'Giving every chef their own kitchen only helps if you have enough skilled chefs and a central supply chain. One cook running twenty kitchens just spends all day running between them.',
            bestPractices: ['Align team topology with service topology', 'Fund a platform team + golden paths', 'Track the true cost of the split', 'Prefer a modular monolith until scale justifies services'],
            commonMistakes: ['Splitting with too few teams', 'No platform engineering investment', 'Ignoring cognitive load and cost'],
            interviewTip: 'Framing microservices as "an organizational decision first (Conway)" and naming platform engineering is a strong architect-level signal.',
            followUp: ['What is platform engineering?', "How does Conway's Law apply?", 'When is a modular monolith the better call?'],
            architectPerspective: 'I have watched teams adopt microservices and then spend most of their time on infrastructure instead of features. My rule: under ~20 developers and fewer than a couple of deploys a week, a modular monolith wins. Microservices are an organizational and financial commitment as much as a technical one, and pretending otherwise is how programs stall.'
        },
        {
            question: 'What are nano-services and chatty services, and why are they anti-patterns?',
            difficulty: 'medium',
            answer: `<p><strong>Nano-services</strong> are services split too finely — often one per entity/table — with
            no real business cohesion, so any useful feature must orchestrate many of them. <strong>Chatty
            services</strong> expose fine-grained interfaces that require many round trips per operation.</p>
            <p>Both are anti-patterns because they multiply network hops (latency + failure), add operational
            overhead per service, and increase coupling — the opposite of the autonomy microservices promise. Fix by
            modeling <strong>business capabilities</strong> (which contain several entities), providing
            <strong>coarser</strong> operations/batch endpoints, and merging over-split services.</p>`,
            explanation: 'Nano-services are giving every noun its own department; chatty services are making ten phone calls to complete one errand. Either way, coordination cost swamps the actual work.',
            bestPractices: ['Model capabilities, not entities/tables', 'Coarse-grained operations and batch endpoints', 'Merge over-split services'],
            commonMistakes: ['One service per table', 'Fine-grained chatty interfaces', 'Ignoring the network cost of fan-out'],
            interviewTip: 'Tie both to the network-cost/coupling penalty and the fix (capabilities + coarser APIs) — shows you optimize for cohesion, not smallness.',
            followUp: ['How does this relate to service sizing?', 'What is a coarse-grained API?', 'How do read models reduce chattiness?']
        },
        {
            question: 'How do you debug a failure that spans multiple services?',
            difficulty: 'medium',
            answer: `<p>Use the observability stack, correlated by a shared id. Start with <strong>metrics</strong> to
            see which endpoint/percentile degraded and when. Open a <strong>distributed trace</strong> to see the
            request as a waterfall across services and find the failing/slow span. Then read the <strong>structured
            logs</strong> for that span, filtered by the <strong>correlation id</strong>, to get the exact error.</p>
            <p>The correlation id (propagated across services and async boundaries) is what makes this possible —
            without it, the request's logs are scattered and unjoinable. See
            <a href="#microservices-observability">Observability</a>.</p>`,
            explanation: 'It is following a parcel with one tracking number across every depot: the number ties together all the scans so you can see exactly where and why it got stuck.',
            bestPractices: ['Correlate metrics, traces, logs by one id', 'Trace-first to localize the failing span', 'Propagate correlation id across async boundaries'],
            commonMistakes: ['No correlation id to join logs', 'Reading per-service logs in isolation', 'Losing trace context at queues'],
            interviewTip: 'Describe the metrics → trace → logs workflow and stress the correlation id as the thread that ties it together.',
            followUp: ['How does trace context propagate through a queue?', 'What is a correlation id?', 'How do the three pillars connect?']
        },
        {
            question: 'Given all these challenges, how do you decide microservices are worth it?',
            difficulty: 'hard',
            answer: `<p>Weigh the benefits (independent deploy/scale, team autonomy, fault isolation, tech
            flexibility) against the costs (distributed complexity, eventual consistency, operational overhead, org
            demands). Microservices are worth it when you have <strong>many teams needing to deploy
            independently</strong>, a <strong>mature domain</strong> with stable boundaries, genuine
            <strong>independent scaling</strong> needs, and the <strong>operational maturity</strong> (CI/CD,
            observability, platform) to support them.</p>
            <p>If those are absent — small team, unclear domain, low ops maturity — a <strong>modular monolith</strong>
            delivers most of the structure with far less cost. Extract services later against proven pain points
            (Strangler Fig). The mature answer is always "it depends on team, domain, and operational capability."</p>`,
            explanation: 'Microservices are like opening multiple franchise locations: worth it when demand and infrastructure justify it, wasteful when one well-run shop would serve your customers better.',
            bestPractices: ['Adopt for many teams + mature domain + scaling needs + ops maturity', 'Otherwise prefer a modular monolith', 'Extract later against proven pain points', 'Continuously assess if the split delivers value'],
            commonMistakes: ['Adopting for hype/resume-driven reasons', 'Splitting an MVP prematurely', 'Ignoring operational and org readiness'],
            interviewTip: 'Lead with the trade-off and the conditions; explicitly offering the modular-monolith alternative is what separates senior from mid-level answers.',
            followUp: ['What is a modular monolith?', 'How do you measure if microservices add value?', 'How do you migrate later with Strangler Fig?']
        }
    ]
});
