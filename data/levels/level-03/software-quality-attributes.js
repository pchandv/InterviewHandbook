PageData.register('software-quality-attributes', {
    title: 'Software Quality Attributes',
    description: 'The complete "-ilities" taxonomy: reliability, availability, scalability, maintainability, testability, deployability, security, performance — based on ISO 25010 and real architecture trade-offs',
    sections: [
        {
            title: 'Introduction',
            content: `<p><strong>Quality attributes</strong> (also called non-functional requirements or "-ilities") define HOW a system performs its functions, not WHAT it does. They are the architectural drivers that determine technology choices, deployment topology, and design trade-offs.</p>
<p>Functional requirements tell you to "process payments." Quality attributes tell you to "process payments within 200ms, with 99.99% availability, handling 10,000 concurrent transactions, while being PCI-DSS compliant, deployable without downtime, and maintainable by a team of 5."</p>
<p>Quality attributes are where architecture lives. Two systems with identical features but different quality attributes will have radically different architectures. Understanding and prioritizing them is a core architect skill.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>The ISO 25010 standard defines 8 quality characteristics, each with sub-characteristics. Here is the practical taxonomy used in real systems:</p>`,
            table: {
                headers: ['Quality Attribute', 'Definition', 'Measured By', 'Trade-offs Against'],
                rows: [
                    ['Reliability', 'System performs correctly under stated conditions', 'MTBF, error rate, data integrity', 'Performance, cost, complexity'],
                    ['Availability', 'System is operational when needed', 'Uptime %, MTTR, SLA targets', 'Cost (redundancy), consistency (CAP)'],
                    ['Scalability', 'System handles growing load gracefully', 'Max throughput, latency at load', 'Simplicity, cost, consistency'],
                    ['Performance', 'System responds within acceptable time', 'Latency (p50/p95/p99), throughput', 'Maintainability, cost, security'],
                    ['Maintainability', 'System can be modified efficiently', 'Lead time for changes, defect rate', 'Performance (abstraction cost), delivery speed'],
                    ['Testability', 'System can be validated effectively', 'Coverage %, test execution time, defect escape rate', 'Simplicity (test infrastructure cost)'],
                    ['Deployability', 'System can be released safely and frequently', 'Deploy frequency, change failure rate, MTTR', 'Stability (more deploys = more risk surface)'],
                    ['Security', 'System protects data and resists attacks', 'Vulnerabilities found, compliance score', 'Usability, performance, development speed'],
                    ['Observability', 'System internal state is externally queryable', 'MTTD, mean time to diagnose', 'Cost (telemetry volume), performance (overhead)'],
                    ['Portability', 'System runs across environments/platforms', 'Migration effort, platform dependencies', 'Performance (abstraction layers)'],
                    ['Usability', 'System is easy for users to accomplish goals', 'Task completion rate, error rate, time-on-task', 'Feature richness, development time'],
                    ['Interoperability', 'System exchanges data with other systems', 'API compatibility, integration count', 'Autonomy, simplicity']
                ]
            }
        },
        {
            title: 'How It Works',
            content: `<p>Quality attributes drive architecture through a process of elicitation, prioritization, and trade-off analysis:</p>`,
            mermaid: `graph LR
    A[Business Requirements] --> B[Quality Attribute Scenarios]
    B --> C[Prioritize - MoSCoW / Weighted]
    C --> D[Identify Conflicts]
    D --> E[Trade-off Analysis]
    E --> F[Architecture Decisions - ADRs]
    F --> G[Tactics Selection]
    G --> H[Design / Implementation]
    H --> I[Fitness Functions - Verify]
    I -->|Feedback| B

    subgraph "Quality Attribute Scenario"
        J["Source: User / System"]
        K["Stimulus: Load spike / Attack / Change request"]
        L["Artifact: Component affected"]
        M["Environment: Normal / Degraded / Peak"]
        N["Response: What system does"]
        O["Measure: Quantified target"]
    end`
        },
        {
            title: 'Quality Attribute Scenarios',
            content: `<p>A <strong>Quality Attribute Scenario</strong> makes a vague requirement testable and concrete. It has 6 parts:</p>`,
            code: `// Example Quality Attribute Scenarios (architecture-level specifications)

// AVAILABILITY SCENARIO
// Source:     Internal service failure
// Stimulus:   Payment service becomes unresponsive
// Artifact:   Order processing pipeline
// Environment: Normal operation, peak hours
// Response:   System retries with backoff, uses circuit breaker, falls back to queuing
// Measure:    99.9% of orders eventually processed; user sees "processing" within 2s

// PERFORMANCE SCENARIO
// Source:     External user
// Stimulus:   1000 concurrent checkout requests
// Artifact:   Checkout API endpoint
// Environment: Peak load (Black Friday)
// Response:   All requests processed
// Measure:    p95 latency < 500ms, p99 < 2s, zero dropped requests

// SCALABILITY SCENARIO
// Source:     Marketing campaign
// Stimulus:   Traffic increases 10x within 5 minutes
// Artifact:   API gateway + backend services
// Environment: Auto-scaling enabled
// Response:   System scales horizontally without manual intervention
// Measure:    Latency stays within SLO during scale-out; scale completes in < 3 minutes

// SECURITY SCENARIO
// Source:     External attacker
// Stimulus:   SQL injection attempt on search endpoint
// Artifact:   API layer
// Environment: Production
// Response:   Input sanitized, attack logged, IP rate-limited
// Measure:    Zero data exfiltration, attacker identified within 5 minutes

// DEPLOYABILITY SCENARIO
// Source:     Development team
// Stimulus:   New feature ready for production
// Artifact:   CI/CD pipeline
// Environment: Normal
// Response:   Automated deploy with canary analysis
// Measure:    Deploy in < 15 min, auto-rollback if error rate > 1%, zero downtime`,
            language: 'javascript'
        },
        {
            title: 'Trade-off Analysis',
            content: `<p>Quality attributes CONFLICT with each other. Improving one often degrades another. Architecture is the art of making informed trade-offs.</p>
<h4>Common Trade-off Pairs:</h4>`,
            table: {
                headers: ['Improving...', 'Often Degrades...', 'Example'],
                rows: [
                    ['Performance', 'Maintainability', 'Inlining code, caching, denormalization reduces readability and adds complexity'],
                    ['Availability', 'Consistency', 'CAP theorem: distributed systems must choose between availability and strong consistency'],
                    ['Security', 'Usability', 'MFA, rate limiting, CAPTCHAs improve security but add friction for legitimate users'],
                    ['Scalability', 'Simplicity', 'Horizontal scaling requires statelessness, service discovery, distributed coordination'],
                    ['Performance', 'Security', 'Encryption, input validation, audit logging all add latency'],
                    ['Testability', 'Performance', 'Dependency injection, interfaces, and abstraction layers add indirection overhead'],
                    ['Deployability', 'Reliability', 'More frequent deploys = more potential failure points (mitigated by canary/rollback)'],
                    ['Portability', 'Performance', 'Abstraction layers for cross-platform support add overhead vs native implementations']
                ]
            }
        },
        {
            title: 'Architecture Tactics',
            content: `<p><strong>Tactics</strong> are proven design decisions that achieve specific quality attributes. They are the building blocks architects use:</p>
<h4>Availability Tactics:</h4>
<ul>
<li><strong>Detect:</strong> Heartbeat, ping/echo, health checks, watchdog timers</li>
<li><strong>Recover:</strong> Active-passive failover, retry, circuit breaker, checkpoint/rollback</li>
<li><strong>Prevent:</strong> Redundancy (N+1), removal from service, graceful degradation</li>
</ul>
<h4>Performance Tactics:</h4>
<ul>
<li><strong>Control demand:</strong> Rate limiting, load shedding, priority queues, throttling</li>
<li><strong>Manage resources:</strong> Caching, connection pooling, async processing, CDN</li>
<li><strong>Reduce computation:</strong> Pre-computation, denormalization, lazy loading</li>
</ul>
<h4>Scalability Tactics:</h4>
<ul>
<li><strong>Horizontal:</strong> Stateless services, sharding, partitioning, load balancing</li>
<li><strong>Vertical:</strong> Resource optimization, algorithm improvement, native code</li>
<li><strong>Elastic:</strong> Auto-scaling, serverless, queue-based load leveling</li>
</ul>
<h4>Security Tactics:</h4>
<ul>
<li><strong>Resist:</strong> Input validation, authentication, authorization, encryption</li>
<li><strong>Detect:</strong> Intrusion detection, audit trails, anomaly detection</li>
<li><strong>Recover:</strong> Revocation, key rotation, backup/restore</li>
</ul>
<h4>Testability Tactics:</h4>
<ul>
<li><strong>Control:</strong> Dependency injection, interfaces, feature flags, test doubles</li>
<li><strong>Observe:</strong> Logging, health endpoints, test hooks, assertions</li>
</ul>`,
            mermaid: `graph TD
    subgraph "Availability Tactics"
        A1[Redundancy N+1] --> AV[Availability]
        A2[Circuit Breaker] --> AV
        A3[Health Checks] --> AV
        A4[Graceful Degradation] --> AV
        A5[Auto-Failover] --> AV
    end

    subgraph "Performance Tactics"
        P1[Caching] --> PF[Performance]
        P2[Connection Pooling] --> PF
        P3[Async Processing] --> PF
        P4[CDN] --> PF
        P5[Load Shedding] --> PF
    end

    subgraph "Scalability Tactics"
        S1[Horizontal Scaling] --> SC[Scalability]
        S2[Sharding] --> SC
        S3[Auto-Scaling] --> SC
        S4[Queue-Based Leveling] --> SC
        S5[Statelessness] --> SC
    end`
        },
        {
            title: 'Best Practices',
            content: `<ul>
<li><strong>Make quality attributes explicit and measurable</strong> — "The system should be fast" is useless. "p99 latency < 500ms under 1000 concurrent users" is testable and measurable.</li>
<li><strong>Prioritize ruthlessly</strong> — You cannot maximize ALL quality attributes. Identify the top 3-4 that matter most for your context and accept trade-offs on the rest.</li>
<li><strong>Use quality attribute scenarios</strong> — Every significant quality requirement should be expressed as a 6-part scenario (source, stimulus, artifact, environment, response, measure).</li>
<li><strong>Verify with fitness functions</strong> — Automated tests that verify quality attributes: load tests for performance, chaos tests for reliability, architecture tests for maintainability.</li>
<li><strong>Document trade-offs in ADRs</strong> — When you choose availability over consistency (or vice versa), record WHY in an Architecture Decision Record. Future engineers need this context.</li>
<li><strong>Revisit periodically</strong> — Quality attribute priorities change as the business evolves. A startup optimizes for deployability and time-to-market. An established platform optimizes for reliability and security.</li>
<li><strong>Stakeholder language</strong> — Translate quality attributes into business terms: availability = revenue (downtime costs $X/min), performance = conversion (every 100ms added loses 1% revenue), security = compliance (fines + reputation).</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>Treating quality attributes as an afterthought</strong> — "We will handle performance later." Performance, scalability, and security must be designed in from the start. Retrofitting is 10x more expensive.</li>
<li><strong>Over-engineering for quality attributes you dont need</strong> — Building for 10M users when you have 1000. Designing for 99.999% availability when the business only needs 99.9%. This is waste.</li>
<li><strong>Not quantifying requirements</strong> — "High availability" means different things to different people. 99% (87 hours downtime/year) vs 99.99% (52 minutes/year) requires completely different architectures.</li>
<li><strong>Ignoring trade-offs</strong> — Adding caching improves performance but degrades consistency. Adding encryption improves security but degrades performance. Every tactic has a cost — acknowledge it.</li>
<li><strong>Gold-plating one attribute at the expense of all others</strong> — Over-optimizing performance with hand-tuned code that is impossible to maintain. The system is fast but nobody can change it.</li>
<li><strong>Confusing quality attributes with features</strong> — "Support 10,000 users" is a scalability REQUIREMENT, not a feature. It must be in the architecture, not the feature backlog.</li>
<li><strong>No ongoing measurement</strong> — You set availability targets at design time but never measure actual availability in production. Without measurement, you cannot know if you are meeting your targets.</li>
</ul>`
        },
        {
            title: 'Real-World Applications',
            content: `<ul>
<li><strong>E-commerce (Amazon/Shopify)</strong> — Priority: Availability > Performance > Scalability > Security. Even brief downtime = massive revenue loss. Architecture: multi-region, eventual consistency (CAP: AP), aggressive caching, auto-scaling.</li>
<li><strong>Banking/Fintech</strong> — Priority: Security > Reliability > Availability > Compliance. Data integrity is non-negotiable. Architecture: strong consistency (CP), encryption everywhere, audit trails, formal verification on critical paths.</li>
<li><strong>Streaming (Netflix/Spotify)</strong> — Priority: Performance > Scalability > Availability > Portability. Latency = buffering = user churn. Architecture: CDN edge caching, adaptive bitrate, chaos engineering for reliability.</li>
<li><strong>Healthcare (Epic/Cerner)</strong> — Priority: Reliability > Security > Availability > Interoperability. Wrong data = patient harm. Architecture: ACID transactions, HL7/FHIR compliance, audit logging, role-based access.</li>
<li><strong>Startup/MVP</strong> — Priority: Deployability > Maintainability > Performance. Ship fast, learn fast. Architecture: monolith, simple deploy, good test coverage. Scale concerns are premature.</li>
</ul>`
        },
        {
            title: 'Interview Tips',
            content: `<p>Quality attributes are a favorite topic in system design interviews and architecture discussions:</p>`,
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>Trade-off awareness</strong> — Senior engineers know you cant have everything. They articulate which qualities they would sacrifice and why.</li>
<li><strong>Quantification</strong> — Instead of "highly available," say "99.9% measured by successful request ratio over 30-day windows." Numbers show maturity.</li>
<li><strong>Tactics vocabulary</strong> — Can you name specific tactics for achieving each quality attribute? Circuit breaker for availability, sharding for scalability, rate limiting for security.</li>
<li><strong>Business alignment</strong> — Why did you choose these priorities? Because "downtime costs $10K/minute" or "we are pre-revenue and need to iterate fast." Connecting architecture to business context is a staff+ signal.</li>
<li><strong>Measurement thinking</strong> — How do you VERIFY you are meeting the attribute? Load tests, chaos experiments, SLOs, architecture fitness functions. Design without verification is hope, not engineering.</li>
</ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li>Quality attributes define HOW a system works, not WHAT it does — they are the true architecture drivers</li>
<li>The key "-ilities": reliability, availability, scalability, performance, maintainability, testability, deployability, security, observability</li>
<li>Quality attributes CONFLICT — you must prioritize and accept trade-offs</li>
<li>Every quality requirement must be measurable (use 6-part Quality Attribute Scenarios)</li>
<li>Architecture tactics are proven design decisions that achieve specific quality attributes</li>
<li>Fitness functions verify quality attributes automatically in CI/CD</li>
<li>Different domains prioritize differently: banking = security, e-commerce = availability, startup = deployability</li>
<li>ISO 25010 provides the formal taxonomy; real architecture uses a practical subset</li>
<li>The biggest mistake: treating quality attributes as an afterthought instead of a design driver</li>
</ul>`
        }
    ],
    questions: [
        {
            id: 'qa-q1',
            level: 'junior',
            title: 'What are non-functional requirements? Give 5 examples and explain why they matter.',
            answer: `<p><strong>Non-functional requirements (NFRs)</strong>, also called quality attributes, define HOW a system should behave rather than WHAT it should do. They constrain the design and architecture.</p>
<p><strong>5 examples:</strong></p>
<ol>
<li><strong>Performance:</strong> "The search API must return results within 200ms for 95% of requests." Matters because slow responses lose users — every 100ms of latency costs ~1% in conversions.</li>
<li><strong>Availability:</strong> "The system must be available 99.9% of the time (43 minutes downtime/month max)." Matters because downtime = lost revenue + damaged reputation.</li>
<li><strong>Security:</strong> "All data at rest must be encrypted with AES-256. All PII must be masked in logs." Matters because data breaches = legal liability + fines + customer trust destroyed.</li>
<li><strong>Scalability:</strong> "The system must handle 10x traffic growth without architecture changes." Matters because success kills systems that cant scale — you grow users but the system collapses.</li>
<li><strong>Maintainability:</strong> "A new developer should be productive within 2 weeks. Any bug fix should be deployable within 4 hours." Matters because software lives for years — most cost is in maintenance, not initial development.</li>
</ol>
<p><strong>Why they matter:</strong> Two systems with identical features but different NFRs have completely different architectures. A chat app for 100 users vs WhatsApp (2 billion users) have the same features but radically different scalability requirements → radically different designs.</p>`
        },
        {
            id: 'qa-q2',
            level: 'junior',
            title: 'What is the difference between reliability and availability?',
            answer: `<p>These are related but distinct quality attributes:</p>
<p><strong>Reliability</strong> = the system performs CORRECTLY when it operates. It produces the right results without data corruption, calculation errors, or inconsistent state.</p>
<p><strong>Availability</strong> = the system is OPERATIONAL when you need it. It is up and responding to requests.</p>
<p><strong>Key difference:</strong></p>
<ul>
<li>A system can be <strong>available but unreliable</strong>: it responds to every request (100% uptime) but occasionally returns wrong answers (data corruption, calculation errors).</li>
<li>A system can be <strong>reliable but unavailable</strong>: when it IS running, it always returns correct results — but it is down 10% of the time for maintenance.</li>
</ul>
<p><strong>Real-world example:</strong></p>
<ul>
<li>A banking system that is available 99.99% of the time but occasionally transfers the wrong amount is UNRELIABLE (and dangerous).</li>
<li>A banking system that is only available during business hours (8am-6pm) but NEVER makes a mistake when running is highly RELIABLE but has limited availability.</li>
</ul>
<p><strong>Both matter:</strong> Ideally you want high reliability AND high availability. But if you must choose, most systems prefer reliability (correct when running) over availability (always running but sometimes wrong) — especially for financial, medical, or safety-critical systems.</p>`
        },
        {
            id: 'qa-q3',
            level: 'mid',
            title: 'What is a Quality Attribute Scenario? Write one for scalability.',
            answer: `<p>A <strong>Quality Attribute Scenario</strong> is a structured way to make a vague quality requirement concrete and testable. It has 6 parts:</p>
<ol>
<li><strong>Source:</strong> Who or what generates the stimulus (user, attacker, system, time)</li>
<li><strong>Stimulus:</strong> The event or condition that triggers the scenario</li>
<li><strong>Artifact:</strong> The part of the system being affected</li>
<li><strong>Environment:</strong> The conditions under which this occurs (normal, peak, degraded)</li>
<li><strong>Response:</strong> What the system does in response</li>
<li><strong>Measure:</strong> Quantified success criteria</li>
</ol>
<p><strong>Scalability scenario example:</strong></p>
<table>
<tr><td><strong>Source:</strong></td><td>Marketing team launches TV campaign</td></tr>
<tr><td><strong>Stimulus:</strong></td><td>Traffic increases from 1,000 to 15,000 requests/second within 5 minutes</td></tr>
<tr><td><strong>Artifact:</strong></td><td>Product catalog service + checkout API</td></tr>
<tr><td><strong>Environment:</strong></td><td>Production, auto-scaling enabled, Kubernetes cluster</td></tr>
<tr><td><strong>Response:</strong></td><td>System auto-scales to 15 pods, no requests dropped, no manual intervention</td></tr>
<tr><td><strong>Measure:</strong></td><td>p95 latency stays below 800ms during scale-out; scale completes in under 3 minutes; zero 5xx errors during transition</td></tr>
</table>
<p><strong>Why this format works:</strong> It is specific enough to design tests for (load test at 15K rps, measure latency), specific enough to design architecture for (stateless services, auto-scaler config, pod resource limits), and specific enough to verify in production.</p>`
        },
        {
            id: 'qa-q4',
            level: 'mid',
            title: 'Explain how quality attributes trade off against each other. Give 3 concrete examples.',
            answer: `<p><strong>Quality attributes are in tension</strong> — improving one often degrades another. Architecture is about making informed trade-offs, not achieving perfection in all dimensions.</p>
<p><strong>Example 1: Performance vs Maintainability</strong></p>
<ul>
<li>To optimize performance, you might: inline methods, use raw SQL instead of ORM, pre-compute results, use memory-mapped files</li>
<li>Each of these makes code harder to understand, harder to change, and harder to test</li>
<li>The trade-off: optimize only the hot paths (measured by profiling). Keep 95% of code maintainable; optimize the 5% that actually matters.</li>
</ul>
<p><strong>Example 2: Availability vs Consistency (CAP Theorem)</strong></p>
<ul>
<li>In a distributed system with network partitions, you MUST choose: either stay available (serve potentially stale data) or stay consistent (refuse requests until partition heals)</li>
<li>Amazon chooses availability (shopping cart always works, might show stale inventory)</li>
<li>Banks choose consistency (better to reject a transaction than process it with wrong balance)</li>
</ul>
<p><strong>Example 3: Security vs Usability</strong></p>
<ul>
<li>Adding MFA, CAPTCHAs, session timeouts, and password complexity rules all improve security</li>
<li>Each one adds friction for legitimate users, potentially reducing engagement and conversion</li>
<li>The trade-off: risk-based security (MFA only for sensitive operations, not every page view)</li>
</ul>
<p><strong>Key insight:</strong> There is no "best" architecture — only the best architecture FOR YOUR CONTEXT with YOUR priorities. Document WHY you made each trade-off in ADRs.</p>`
        },
        {
            id: 'qa-q5',
            level: 'mid',
            title: 'What is testability as a quality attribute? How do you design for it?',
            answer: `<p><strong>Testability</strong> is the degree to which a system supports testing — how easy it is to write, execute, and maintain tests that verify correct behavior.</p>
<p><strong>High testability means:</strong></p>
<ul>
<li>You can test components in isolation (without needing the entire system running)</li>
<li>Tests are fast (seconds, not minutes)</li>
<li>Tests are deterministic (same result every run)</li>
<li>You can observe internal state when needed (for assertions)</li>
<li>You can control inputs precisely (inject test data, simulate failures)</li>
</ul>
<p><strong>Design tactics for testability:</strong></p>
<ul>
<li><strong>Dependency Injection:</strong> Pass dependencies via constructor → swap real implementations for mocks/stubs in tests</li>
<li><strong>Interface segregation:</strong> Depend on small interfaces, not large concrete classes → easy to mock</li>
<li><strong>Pure functions:</strong> Same input always produces same output, no side effects → trivial to test</li>
<li><strong>Separation of concerns:</strong> Business logic separate from I/O → test logic without databases/HTTP</li>
<li><strong>Feature flags:</strong> Test new behavior in isolation, toggle on/off without deployment</li>
<li><strong>Test hooks:</strong> Expose seams where tests can inject state or observe behavior (e.g., in-memory event bus for integration tests)</li>
</ul>
<p><strong>Anti-patterns that kill testability:</strong></p>
<ul>
<li>Static methods with side effects (untestable without reflection hacks)</li>
<li>Service locator pattern (hidden dependencies, cant substitute in tests)</li>
<li>Tight coupling to infrastructure (test requires real database, real queue, real HTTP service)</li>
<li>Global mutable state (tests interfere with each other, non-deterministic)</li>
</ul>`
        },
        {
            id: 'qa-q6',
            level: 'senior',
            title: 'How do you elicit and prioritize quality attributes for a new system? Walk through your process.',
            answer: `<p><strong>A structured approach to quality attribute elicitation:</strong></p>
<p><strong>Step 1: Stakeholder interviews (Week 1)</strong></p>
<ul>
<li>Interview different stakeholders: business (revenue, growth), operations (uptime, deployments), security (compliance, risk), development (velocity, maintainability)</li>
<li>Each stakeholder has different quality priorities. Collect them all.</li>
<li>Ask: "What would make this system a failure even if all features work?" → reveals implicit quality expectations</li>
</ul>
<p><strong>Step 2: Write Quality Attribute Scenarios (Week 1-2)</strong></p>
<ul>
<li>For each identified quality concern, write a 6-part scenario with measurable targets</li>
<li>Get stakeholder sign-off on the measures ("Is p99 < 500ms acceptable or do you need p99 < 200ms?")</li>
<li>Typically results in 15-30 scenarios across 6-8 quality attributes</li>
</ul>
<p><strong>Step 3: Prioritize using utility tree (Week 2)</strong></p>
<ul>
<li>Build a utility tree: top = system quality, branches = attributes, leaves = scenarios</li>
<li>Rate each scenario on: (H/M/L) Business Impact × (H/M/L) Technical Risk</li>
<li>(H,H) scenarios = architecture drivers. These MUST be addressed in the architecture.</li>
<li>(L,L) scenarios = nice-to-have. Address if easy, accept if not.</li>
</ul>
<p><strong>Step 4: Identify conflicts (Week 2)</strong></p>
<ul>
<li>Which prioritized scenarios conflict? (e.g., "encrypt everything" vs "respond in < 50ms")</li>
<li>For each conflict, determine which attribute wins and document why (ADR)</li>
</ul>
<p><strong>Step 5: Select tactics and validate (Week 3+)</strong></p>
<ul>
<li>For each high-priority scenario, select architecture tactics that achieve it</li>
<li>Prototype or spike to validate risky tactics</li>
<li>Define fitness functions that will continuously verify the quality attributes</li>
</ul>
<p><strong>Output:</strong> A prioritized list of quality attribute scenarios with associated architecture decisions. This IS the architecture — the rest is implementation.</p>`
        },
        {
            id: 'qa-q7',
            level: 'senior',
            title: 'What is deployability and why has it become a first-class quality attribute?',
            answer: `<p><strong>Deployability</strong> is the ease and safety with which a system can be released to production. It encompasses deploy frequency, lead time, change failure rate, and time to recover from a bad deploy.</p>
<p><strong>Why it is now first-class:</strong></p>
<ul>
<li><strong>DORA metrics proved it:</strong> Elite teams deploy multiple times per day with < 1% failure rate. This correlates with business success (revenue, market share, employee satisfaction).</li>
<li><strong>Continuous delivery:</strong> The industry shifted from quarterly releases to continuous deployment. Architecture must ENABLE this, not fight against it.</li>
<li><strong>Microservices requirement:</strong> If 20 services must deploy in lockstep, you have a distributed monolith. True microservices require independent deployability.</li>
<li><strong>Risk reduction:</strong> Small, frequent deploys are SAFER than large, infrequent ones. Each deploy changes less → easier to identify problems → faster rollback.</li>
</ul>
<p><strong>Tactics that enable deployability:</strong></p>
<ul>
<li><strong>Feature flags:</strong> Deploy code without activating it. Separate deploy from release.</li>
<li><strong>Backward-compatible changes:</strong> New version can coexist with old version during rolling deploy.</li>
<li><strong>Database migration strategy:</strong> Expand-contract pattern. Never break existing code with schema changes.</li>
<li><strong>Canary deployments:</strong> Route 5% of traffic to new version. Monitor. If SLO holds, proceed.</li>
<li><strong>Automated rollback:</strong> If error rate exceeds threshold within 5 minutes of deploy, automatically revert.</li>
<li><strong>Infrastructure as Code:</strong> Environments are reproducible. No "works on staging but not production."</li>
</ul>
<p><strong>Measuring deployability:</strong></p>
<ul>
<li>Deploy frequency: how often (target: daily or more)</li>
<li>Lead time for changes: commit → production (target: < 1 hour)</li>
<li>Change failure rate: % of deploys causing incidents (target: < 5%)</li>
<li>MTTR: time to recover from a bad deploy (target: < 15 minutes)</li>
</ul>`
        },
        {
            id: 'qa-q8',
            level: 'senior',
            title: 'How do architecture fitness functions help verify quality attributes? Give examples.',
            answer: `<p><strong>Architecture fitness functions</strong> are automated tests that verify architectural properties (quality attributes) remain satisfied as the system evolves. They catch degradation before it reaches production.</p>
<p><strong>Types of fitness functions:</strong></p>
<p><strong>1. Static (analyze code without running it):</strong></p>
<ul>
<li>Dependency rules: "Domain layer must not reference Infrastructure" (ArchUnit/NDepend)</li>
<li>Complexity gates: "No method exceeds cyclomatic complexity 15" (SonarQube)</li>
<li>Coupling limits: "No package has efferent coupling > 10" (NDepend)</li>
</ul>
<p><strong>2. Dynamic (run and observe the system):</strong></p>
<ul>
<li>Performance: "Load test: p99 < 500ms at 1000 rps" (k6 in CI pipeline)</li>
<li>Availability: "Chaos test: kill 1 of 3 pods, verify zero dropped requests" (LitmusChaos)</li>
<li>Security: "DAST scan: zero high-severity vulnerabilities" (OWASP ZAP in CI)</li>
</ul>
<p><strong>3. Temporal (measure over time):</strong></p>
<ul>
<li>Deployability: "Change failure rate < 5% over rolling 30 days" (DORA metrics dashboard)</li>
<li>Maintainability: "Average PR lead time < 24 hours" (Git analytics)</li>
<li>Reliability: "SLO budget > 25% remaining" (burn-rate monitoring)</li>
</ul>
<p><strong>Implementation pattern:</strong></p>
<pre><code>// In CI pipeline:
// Stage 1: Static fitness functions (seconds)
- run: dotnet test ArchTests.csproj        # Dependency rules
- run: sonar-scanner                        # Complexity gates

// Stage 2: Dynamic fitness functions (minutes)
- run: k6 run load-test.js                  # Performance
- run: playwright test e2e/                  # Functional

// Stage 3: Post-deploy fitness (continuous)
- monitor: SLO burn-rate alerts             # Reliability
- monitor: DORA metrics dashboard           # Deployability</code></pre>
<p><strong>Key insight:</strong> Without fitness functions, architectural decisions are ASPIRATIONAL. With them, they are ENFORCED. Architecture without enforcement erodes within months.</p>`
        },
        {
            id: 'qa-q9',
            level: 'lead',
            title: 'How do you communicate quality attribute trade-offs to non-technical stakeholders?',
            answer: `<p><strong>Non-technical stakeholders understand business outcomes, not technical jargon.</strong> Translate every quality attribute into money, time, or risk.</p>
<p><strong>Translation framework:</strong></p>
<table>
<tr><th>Quality Attribute</th><th>Technical Language (avoid)</th><th>Business Language (use)</th></tr>
<tr><td>Availability</td><td>"99.9% SLO with multi-region failover"</td><td>"Max 43 minutes downtime/month. Each minute of downtime costs $5K in lost orders."</td></tr>
<tr><td>Performance</td><td>"p99 latency under 500ms with CDN"</td><td>"Pages load in under 1 second. Amazon found every 100ms slower = 1% less revenue."</td></tr>
<tr><td>Scalability</td><td>"Horizontal auto-scaling with K8s HPA"</td><td>"System handles Black Friday automatically. No manual intervention. No crash."</td></tr>
<tr><td>Security</td><td>"Encryption at rest, mTLS, RBAC"</td><td>"Customer data is protected. We pass PCI audit. No breach = no $50M fine."</td></tr>
<tr><td>Maintainability</td><td>"Low coupling, high cohesion, CI/CD"</td><td>"New features ship in days, not months. Bugs get fixed same day."</td></tr>
</table>
<p><strong>The trade-off conversation:</strong></p>
<p>"We can build this in 3 months with 99.9% availability, OR 6 months with 99.99% availability. The difference:</p>
<ul>
<li>99.9% = 43 minutes downtime/month. Cost: ~$215K/year in potential lost revenue.</li>
<li>99.99% = 4.3 minutes downtime/month. Requires multi-region deployment, costs additional $150K/year in infrastructure.</li>
<li>The extra 3 months of development delays time-to-market, costing ~$500K in deferred revenue.</li>
</ul>
<p>Recommendation: Launch with 99.9%, iterate to 99.99% in Q3 when revenue justifies the investment."</p>
<p><strong>Key principle:</strong> Always present options with costs and business impact. Let stakeholders make informed decisions. Never make unilateral architecture decisions that have business consequences.</p>`
        },
        {
            id: 'qa-q10',
            level: 'architect',
            title: 'You are designing a system that needs high availability AND strong consistency. How do you approach this apparent impossibility (CAP)?',
            answer: `<p><strong>CAP says you cannot have all three (Consistency, Availability, Partition tolerance) simultaneously during a network partition.</strong> But real systems need strategies for when partitions occur AND when they do not.</p>
<p><strong>Key insight: CAP is about behavior DURING partitions.</strong> When the network is healthy (99.9% of the time), you CAN have both strong consistency and availability. You need a strategy for the 0.1% partition case.</p>
<p><strong>Approaches that approximate both:</strong></p>
<p><strong>1. Consensus protocols (Raft/Paxos):</strong></p>
<ul>
<li>3 or 5 node cluster. Writes require majority quorum (2/3 or 3/5).</li>
<li>Consistency: guaranteed (linearizable reads/writes)</li>
<li>Availability: high (tolerates 1 or 2 node failures) but NOT during majority partition</li>
<li>Trade-off: slightly higher write latency (consensus round-trip)</li>
<li>Example: etcd, CockroachDB, Spanner</li>
</ul>
<p><strong>2. Per-operation tunable consistency:</strong></p>
<ul>
<li>Critical operations (payment, balance): strong consistency (synchronous replication)</li>
<li>Non-critical operations (product browsing, recommendations): eventual consistency</li>
<li>This gives you strong consistency WHERE IT MATTERS and availability everywhere else</li>
<li>Example: Cassandra with configurable consistency levels per query</li>
</ul>
<p><strong>3. Saga + compensation:</strong></p>
<ul>
<li>Accept that distributed transactions across services cannot be strongly consistent</li>
<li>Use sagas with compensation: if any step fails, undo completed steps</li>
<li>The system is always available; consistency is eventually restored through compensating actions</li>
<li>Trade-off: complexity, temporary inconsistency windows</li>
</ul>
<p><strong>4. CRDTs (Conflict-Free Replicated Data Types):</strong></p>
<ul>
<li>Data structures that merge without conflicts (counters, sets, registers)</li>
<li>Both available AND eventually consistent — no coordination needed</li>
<li>Limited to specific data patterns (not general-purpose)</li>
</ul>
<p><strong>The architect answer:</strong> "There is no single solution. I would identify which data/operations truly need strong consistency (financial transactions, inventory decrements) and use consensus there. Everything else gets eventual consistency for availability. The system is partitioned by consistency requirement, not by a blanket choice."</p>`
        },
        {
            id: 'qa-q11',
            level: 'architect',
            title: 'How would you design a quality attributes governance framework for a large organization with 50+ teams?',
            answer: `<p><strong>At organizational scale, quality attributes need governance — consistent standards, measurement, and enforcement across all teams.</strong></p>
<p><strong>Framework components:</strong></p>
<p><strong>1. Quality Attribute Catalog (the standard):</strong></p>
<ul>
<li>Central document defining ALL quality attributes the organization cares about</li>
<li>For each attribute: definition, measurement method, minimum thresholds, recommended tactics</li>
<li>Tiered requirements: Tier 1 (payments) = 99.99% availability. Tier 2 (catalog) = 99.9%. Tier 3 (internal tools) = 99%.</li>
<li>Updated annually based on business evolution</li>
</ul>
<p><strong>2. Service Classification:</strong></p>
<ul>
<li>Every service is classified into a tier based on business criticality</li>
<li>Tier determines which quality requirements apply and how strictly they are enforced</li>
<li>Classification reviewed when services launch or their importance changes</li>
</ul>
<p><strong>3. Automated Verification (fitness functions at scale):</strong></p>
<ul>
<li>Central platform provides: load testing infrastructure, chaos testing framework, SLO monitoring</li>
<li>CI templates that include quality gates appropriate to each tier</li>
<li>Monthly automated reports: "Which services are meeting their quality targets?"</li>
</ul>
<p><strong>4. Architecture Review Board (lightweight):</strong></p>
<ul>
<li>New services / major changes submit a brief quality attribute assessment</li>
<li>Review board (rotating senior engineers) validates: appropriate tier, realistic targets, sound tactics</li>
<li>NOT a bottleneck: asynchronous review, 48-hour SLA, focus on high-risk changes only</li>
</ul>
<p><strong>5. Reporting & Incentives:</strong></p>
<ul>
<li>Quarterly "quality scorecard" per team: SLO adherence, deploy frequency, change failure rate, security scan results</li>
<li>Teams that maintain high quality get more autonomy (less review required)</li>
<li>Teams with quality issues get focused support (not punishment)</li>
</ul>
<p><strong>Key principle:</strong> Governance should ENABLE teams, not slow them down. The platform team provides tools, templates, and infrastructure. Teams own their quality decisions within the framework.</p>`
        }
    ]
});
