/* ═══════════════════════════════════════════════════════════════════
   RELIABILITY PATTERNS — Level 14: Production Engineering (SRE)
   Circuit breaker, retry, timeout, bulkhead, fallback, rate limiting,
   graceful degradation, and redundancy for resilient systems.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('reliability-patterns', {

    title: 'Reliability Patterns',
    level: 14,
    group: 'sre',
    description: 'Patterns for resilient systems: timeout, retry with backoff, circuit breaker, bulkhead, fallback, rate limiting, graceful degradation, redundancy, and health checks.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['arch-distributed'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Reliability patterns</strong> are proven techniques for building systems that stay available
            and degrade gracefully despite the inevitable failures of dependencies, networks, and hardware. In a
            distributed system, something is always failing — the goal is to contain failures so they don't cascade
            into a full outage.</p>
            <p>These patterns operationalize "design for failure": assume every remote call can be slow, fail, or
            return garbage, and build defenses accordingly.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>Timeouts and retries with backoff and jitter</li>
                <li>Circuit breakers and bulkheads</li>
                <li>Fallbacks and graceful degradation</li>
                <li>Rate limiting and load shedding</li>
                <li>Redundancy, failover, and health checks</li>
                <li>How these patterns compose</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Timeout</h4>
            <p>Never wait indefinitely. Bound every remote call so a hung dependency can't tie up threads/resources
            forever.</p>
            <h4>Retry (with Backoff + Jitter)</h4>
            <p>Retry transient failures, but with exponential backoff (increasing delays) and jitter (randomization)
            to avoid hammering a struggling service or creating a synchronized "thundering herd."</p>
            <h4>Circuit Breaker</h4>
            <p>Stop calling a failing dependency after a threshold of failures (open the circuit), failing fast for a
            cool-down period, then testing recovery (half-open). Prevents wasting resources on calls that will fail
            and gives the dependency time to recover.</p>
            <h4>Bulkhead</h4>
            <p>Isolate resources (thread pools, connection pools) per dependency so one slow/failing dependency can't
            consume all resources and sink the whole service — like watertight compartments in a ship.</p>
            <h4>Fallback &amp; Graceful Degradation</h4>
            <p>When a dependency is unavailable, return a sensible default, cached data, or reduced functionality
            instead of failing the whole request.</p>
            <h4>Rate Limiting / Load Shedding</h4>
            <p>Cap incoming load (rate limit) and reject excess cleanly (load shed) to protect the system from being
            overwhelmed.</p>`,
            mermaid: `graph TB
    Call[Outbound call] --> BH[Bulkhead: isolated pool]
    BH --> CB{Circuit breaker}
    CB -->|open| FB[Fallback / cached / default]
    CB -->|closed| RT[Retry w/ backoff+jitter]
    RT --> TO[Timeout-bounded call]
    TO -->|fail| FB
    TO -->|ok| Resp[Response]`
        },
        {
            title: 'How It Works',
            content: `<p>These patterns compose into a resilience pipeline around each risky call. A common, correct
            ordering (outermost to innermost):</p>
            <ol>
                <li><strong>Bulkhead</strong> — limit concurrency to this dependency so it can't starve others</li>
                <li><strong>Circuit breaker</strong> — fail fast if the dependency is already known-broken</li>
                <li><strong>Retry</strong> — retry transient failures with backoff + jitter</li>
                <li><strong>Timeout</strong> — bound each individual attempt</li>
                <li><strong>Fallback</strong> — if all else fails, return a graceful degraded response</li>
            </ol>
            <p>The circuit breaker's state machine: <strong>Closed</strong> (calls flow, failures counted) →
            <strong>Open</strong> (fail fast, no calls) after threshold → <strong>Half-Open</strong> (allow a test
            call) → Closed if it succeeds, back to Open if it fails.</p>`,
            code: `// Composed resilience (Polly v8, .NET) around a downstream call
var pipeline = new ResiliencePipelineBuilder<HttpResponseMessage>()
    .AddConcurrencyLimiter(permitLimit: 25, queueLimit: 50)   // 1. Bulkhead
    .AddCircuitBreaker(new()                                   // 2. Circuit breaker
    {
        FailureRatio = 0.5, MinimumThroughput = 10,
        SamplingDuration = TimeSpan.FromSeconds(10),
        BreakDuration = TimeSpan.FromSeconds(30)
    })
    .AddRetry(new()                                            // 3. Retry
    {
        MaxRetryAttempts = 3,
        BackoffType = DelayBackoffType.Exponential,
        UseJitter = true                                       // avoid thundering herd
    })
    .AddTimeout(TimeSpan.FromSeconds(2))                       // 4. Timeout per attempt
    .Build();

// 5. Fallback handled by caller when the pipeline ultimately fails:
try { return await pipeline.ExecuteAsync(_ => CallDependency()); }
catch { return CachedOrDefaultResponse(); }                   // graceful degradation`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Circuit breaker state machine:</p>`,
            mermaid: `stateDiagram-v2
    [*] --> Closed
    Closed --> Open: failure threshold exceeded
    Open --> HalfOpen: cool-down timer elapses
    HalfOpen --> Closed: test call succeeds
    HalfOpen --> Open: test call fails
    note right of Open
        Fail fast - no calls to the
        broken dependency; gives it
        time to recover
    end note`
        },
        {
            title: 'Implementation',
            content: `<p>Individual patterns and graceful degradation:</p>`,
            tabs: [
                {
                    label: 'Retry + Backoff + Jitter',
                    code: `// Retry ONLY idempotent/transient operations; backoff + jitter are essential.
// Without backoff: you hammer a struggling service.
// Without jitter: all clients retry at the same instant (thundering herd).
//
// delays: ~100ms, ~200ms, ~400ms (exponential) +/- random jitter
.AddRetry(new RetryStrategyOptions
{
    MaxRetryAttempts = 3,
    Delay = TimeSpan.FromMilliseconds(100),
    BackoffType = DelayBackoffType.Exponential,
    UseJitter = true,
    ShouldHandle = new PredicateBuilder()
        .Handle<HttpRequestException>()
        .HandleResult(r => r.StatusCode == HttpStatusCode.ServiceUnavailable)
    // DO NOT retry 4xx client errors or non-idempotent writes without an
    // idempotency key - retries could duplicate the operation.
});`,
                    language: 'csharp'
                },
                {
                    label: 'Graceful Degradation',
                    code: `// Degrade rather than fail the whole request when a dependency is down.
public async Task<ProductPage> GetProductPage(int id)
{
    var product = await _catalog.GetAsync(id);   // core - must succeed

    // Non-critical enrichments degrade gracefully if they fail/circuit-open:
    var recommendations = await TryAsync(() => _recs.GetAsync(id),
                                         fallback: Array.Empty<Product>());
    var reviews = await TryAsync(() => _reviews.GetAsync(id),
                                 fallback: CachedReviews(id));

    // Page still renders with core content even if recs/reviews are unavailable.
    return new ProductPage(product, recommendations, reviews);
}`,
                    language: 'csharp'
                },
                {
                    label: 'Health Checks',
                    code: `// Health checks let orchestrators route traffic away from unhealthy instances
// Liveness:  is the process alive? (restart if not)
// Readiness: can it serve traffic right now? (remove from LB if not)
app.MapHealthChecks("/health/live",  new() { Predicate = _ => false }); // process up
app.MapHealthChecks("/health/ready", new()                              // deps ok?
{
    Predicate = check => check.Tags.Contains("ready")
});
builder.Services.AddHealthChecks()
    .AddSqlServer(connString, tags: new[] { "ready" })
    .AddRedis(redisConn, tags: new[] { "ready" });
// If the DB is down, readiness fails -> LB/K8s stops sending traffic to this pod.`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Always Set Timeouts</h4>
            <p>Every network call needs a timeout. A single hung dependency without a timeout can exhaust your thread
            pool and take down the whole service.</p>
            <h4>Do: Retry Only Transient, Idempotent Operations</h4>
            <p>Use exponential backoff + jitter. Never blindly retry non-idempotent writes (you'll duplicate) or 4xx
            client errors (they won't succeed).</p>
            <h4>Do: Use Circuit Breakers for Unstable Dependencies</h4>
            <p>Fail fast when a dependency is down to conserve resources and let it recover, with a sensible fallback.</p>
            <h4>Do: Isolate with Bulkheads</h4>
            <p>Give each dependency its own resource pool so one failure is contained.</p>
            <h4>Do: Degrade Gracefully</h4>
            <p>Identify core vs non-core functionality; let non-core features fail softly (defaults/cache) rather than
            failing the whole request.</p>
            <h4>Do: Implement Health Checks</h4>
            <p>Separate liveness (restart) from readiness (route traffic) so orchestrators handle unhealthy instances
            correctly.</p>`,
            callout: {
                type: 'tip',
                title: 'Patterns Compose',
                text: 'These patterns work together: bulkhead isolates, circuit breaker fails fast, retry handles transient blips, timeout bounds each attempt, and fallback degrades gracefully. Order matters \u2014 e.g., the timeout should apply per attempt, inside the retry, so each try is bounded.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: No Timeouts</h4>
            <p>The most dangerous omission. A hung downstream call with no timeout blocks a thread; enough of them
            exhaust the pool and the whole service stops responding — a cascading failure.</p>
            <h4>Mistake: Retrying Without Backoff/Jitter</h4>
            <p>Immediate, synchronized retries from many clients ("thundering herd" / "retry storm") can DDoS a
            recovering service and prevent it from recovering.</p>
            <h4>Mistake: Retrying Non-Idempotent Operations</h4>
            <p>Retrying a payment or order creation without an idempotency key causes duplicate charges/records.</p>
            <h4>Mistake: No Circuit Breaker on a Flaky Dependency</h4>
            <p>Continuing to call a dead dependency wastes resources and ties up threads, spreading the failure.</p>
            <h4>Mistake: Treating All Features as Critical</h4>
            <p>Failing the entire page because a recommendations widget is down. Identify non-core features and
            degrade them.</p>
            <h4>Mistake: Retries Amplifying Load</h4>
            <p>Retries at multiple layers multiply (3 x 3 x 3 = 27 calls). Cap total attempts and avoid retrying at
            every layer.</p>`,
            code: `// CASCADING FAILURE: no timeout + synchronized retries
var result = await httpClient.GetAsync(url);   // no timeout -> can hang forever
// 1000 requests hang on a dead dependency -> thread pool exhausted ->
// the WHOLE service stops responding, even for unrelated requests.

// FIX: timeout + circuit breaker + bounded retry with jitter + fallback
// (see Implementation). Bound the blast radius of the failing dependency.`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Netflix &amp; Microservices</h4>
            <p>Netflix popularized these patterns (Hystrix circuit breaker) to keep streaming working even when
            individual backend services fail — degrading features rather than going dark.</p>
            <h4>Payment &amp; Financial Systems</h4>
            <p>Timeouts, idempotent retries, and circuit breakers around payment gateways prevent both lost
            transactions and duplicate charges.</p>
            <h4>Service Meshes</h4>
            <p>Istio/Linkerd implement timeouts, retries, and circuit breaking at the infrastructure layer, applying
            them uniformly across all services.</p>
            <h4>High-Traffic APIs</h4>
            <p>Rate limiting and load shedding protect APIs from abuse and traffic spikes, returning 429s cleanly
            rather than collapsing.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>What each pattern protects against:</p>`,
            table: {
                headers: ['Pattern', 'Protects against', 'Mechanism', 'Watch out for'],
                rows: [
                    ['Timeout', 'Hung calls', 'Bound wait time', 'Too short -> false failures'],
                    ['Retry', 'Transient failures', 'Re-attempt w/ backoff', 'Non-idempotent ops; retry storms'],
                    ['Circuit breaker', 'Calling dead deps', 'Fail fast when broken', 'Threshold tuning'],
                    ['Bulkhead', 'Resource exhaustion', 'Isolated pools', 'Sizing pools'],
                    ['Fallback', 'Hard failures', 'Default/cached response', 'Stale/incorrect fallback'],
                    ['Rate limit', 'Overload/abuse', 'Cap request rate', 'Limiting legitimate traffic'],
                    ['Redundancy', 'Instance/zone failure', 'Replicas + failover', 'Cost; split-brain']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Reliability patterns trade a little overhead/complexity for huge stability gains:</p>
            <h4>Fail Fast Saves Resources</h4>
            <p>A circuit breaker that fails instantly (instead of waiting for a timeout on every call) frees threads
            and keeps latency bounded when a dependency is down.</p>
            <h4>Timeouts Protect Latency</h4>
            <p>Bounding each call caps tail latency and prevents one slow dependency from dragging down your p99.</p>
            <h4>Bulkheads Contain Saturation</h4>
            <p>Per-dependency pools mean a saturated dependency only exhausts its own pool, leaving capacity for
            healthy paths.</p>
            <h4>Retry Cost Awareness</h4>
            <p>Retries add load. Under widespread failure, aggressive retries amplify the problem. Cap attempts, use
            jitter, and consider retry budgets to bound amplification.</p>`,
            callout: {
                type: 'warning',
                title: 'Retries Can Cause the Outage',
                text: 'During a partial failure, naive retries multiply traffic to the struggling dependency (a "retry storm"), often turning a minor blip into a full outage and preventing recovery. Always use backoff + jitter, cap total attempts, and consider a retry budget that limits the fraction of traffic that is retries.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Resilience must be tested by injecting failure, not assumed.</p>
            <h4>Fault Injection</h4>
            <p>Simulate dependency failures, latency, and errors in tests to verify timeouts trip, the circuit breaker
            opens, and fallbacks engage as designed.</p>
            <h4>Unit-Test the Policies</h4>
            <p>Verify retry counts, backoff behavior, circuit-open thresholds, and that non-idempotent ops are not
            retried.</p>
            <h4>Chaos Testing</h4>
            <p>In staging/production (carefully), inject real faults (kill instances, add latency) to validate the
            whole system degrades gracefully — covered in chaos engineering.</p>`,
            code: `// Verify the circuit breaker opens and the fallback engages
[Fact]
public async Task Dependency_Failing_OpensCircuit_AndUsesFallback()
{
    var failing = Substitute.For<IDependency>();
    failing.CallAsync().Returns<Task<string>>(_ => throw new HttpRequestException());
    var sut = new ResilientService(failing);   // wraps with breaker + fallback

    // Drive enough failures to trip the breaker
    for (int i = 0; i < 10; i++)
        await sut.GetAsync();   // returns fallback, not exception

    // Now the circuit is OPEN -> calls fail fast and return fallback
    var result = await sut.GetAsync();
    Assert.Equal("cached-default", result);     // graceful degradation
    failing.Received().CallAsync();             // but not called every time (fast-fail)
}`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Reliability patterns are core to distributed-systems and SRE interviews:</p>
            <ul>
                <li><strong>Always mention timeouts</strong> — the most commonly forgotten, most dangerous omission</li>
                <li><strong>Explain the circuit breaker state machine</strong> (closed/open/half-open)</li>
                <li><strong>Stress backoff + jitter</strong> and the thundering-herd/retry-storm risk</li>
                <li><strong>Know bulkhead</strong> for resource isolation and the ship analogy</li>
                <li><strong>Discuss graceful degradation</strong> — core vs non-core functionality</li>
                <li><strong>Note these are often in the service mesh</strong> at the platform layer</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Cascading Failure Is the Boss Question',
                text: 'A frequent senior question: "how do you prevent a cascading failure?" Strong answer: bound everything (timeouts), fail fast (circuit breakers), isolate (bulkheads), avoid retry storms (backoff + jitter + budgets), and degrade gracefully (fallbacks) \u2014 so one failing dependency can\u2019t take down the whole system.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Books</h4>
            <ul>
                <li><em>Release It!</em> by Michael Nygard (the canonical stability-patterns book)</li>
                <li><em>Site Reliability Engineering</em> (Google) — handling overload, cascading failures</li>
                <li>Microsoft Cloud Design Patterns (reliability section)</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li>Polly (.NET), Resilience4j (Java), Hystrix (legacy)</li>
                <li>Service meshes: Istio, Linkerd (infra-level resilience)</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Always set timeouts</strong> — unbounded waits cause cascading failures via thread exhaustion</li>
                <li><strong>Retry only transient/idempotent</strong> ops with exponential backoff + jitter</li>
                <li><strong>Circuit breaker</strong> fails fast on broken deps (closed -> open -> half-open)</li>
                <li><strong>Bulkhead</strong> isolates resources so one failure can't sink the whole service</li>
                <li><strong>Fallback / graceful degradation:</strong> non-core features fail soft, not the whole request</li>
                <li><strong>Patterns compose;</strong> beware retry storms (use budgets + jitter)</li>
                <li><strong>Health checks</strong> (liveness vs readiness) let orchestrators route around failures</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Make a Fragile Service Resilient</h4>
            <p>Given a service that calls a payment gateway and a recommendations API with no protection:</p>
            <ol>
                <li>Add timeouts to both calls</li>
                <li>Add idempotent retry with backoff + jitter to the recommendations call (read); make the payment
                call idempotent (idempotency key) before any retry</li>
                <li>Add a circuit breaker + fallback (cached recs) to the recommendations call</li>
                <li>Use a bulkhead so the payment and recs calls have isolated pools</li>
                <li>Make recommendations non-core: degrade gracefully if it fails; payment is core</li>
                <li>Add liveness/readiness health checks; write a fault-injection test for the breaker</li>
            </ol>`,
            code: `// Payment (core, non-idempotent): idempotency key + timeout + careful retry
// Recs (non-core, idempotent read): timeout + retry(backoff+jitter) + breaker + fallback
// Bulkhead: separate concurrency limiters per dependency
// Degradation: page renders without recs if recs circuit is open
// Health: /health/live (process) + /health/ready (payment gateway reachable)
// TODO: implement with Polly + write fault-injection tests`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> Why is a missing timeout so dangerous?<br/>
                    <em>A: A hung call with no timeout holds a thread indefinitely. Enough hung calls exhaust the thread
                    pool, so the whole service stops responding \u2014 a cascading failure triggered by one slow dependency.</em></li>
                <li><strong>Q:</strong> What are the three states of a circuit breaker?<br/>
                    <em>A: Closed (calls flow, failures counted), Open (fail fast, no calls, during cool-down), and
                    Half-Open (allow a test call; close on success, reopen on failure).</em></li>
                <li><strong>Q:</strong> Why add jitter to retry backoff?<br/>
                    <em>A: Without jitter, many clients retry at the same instant after a failure (a synchronized
                    "thundering herd"/retry storm) that can overwhelm a recovering service. Jitter spreads retries out.</em></li>
                <li><strong>Q:</strong> What is the bulkhead pattern?<br/>
                    <em>A: Isolating resources (e.g., separate thread/connection pools) per dependency so a slow or
                    failing dependency only exhausts its own pool and can't starve the rest of the service.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'Why should every remote call have a timeout?',
            difficulty: 'easy',
            answer: `<p>Because a call without a timeout can hang <em>indefinitely</em> if the dependency is slow or
            unresponsive, holding a thread (and connection) the entire time. Under load, enough hung calls exhaust the
            thread pool, and the service can no longer handle <em>any</em> requests — a single slow dependency
            cascades into a total outage.</p>
            <p>A timeout bounds the wait, frees the resource, and lets you fail fast or fall back.</p>`,
            explanation: 'It is like a phone call you can never hang up: if every line stays open waiting for someone who never answers, eventually all your phone lines are tied up and no one else can get through.',
            bestPractices: ['Set timeouts on every network call', 'Tune timeouts to realistic latency (not too short)', 'Combine with retry/circuit breaker/fallback'],
            commonMistakes: ['Relying on default (often infinite) timeouts', 'Timeouts so short they cause false failures'],
            interviewTip: 'Connect the missing timeout directly to thread-pool exhaustion and cascading failure — that causal chain is the high-signal answer.',
            followUp: ['How do you choose a good timeout value?', 'How does this interact with retries?']
        },
        {
            question: 'Explain the circuit breaker pattern and its states.',
            difficulty: 'medium',
            answer: `<p>A <strong>circuit breaker</strong> prevents a service from repeatedly calling a dependency that is
            failing. It has three states:</p>
            <ul>
                <li><strong>Closed:</strong> normal — calls pass through and failures are counted.</li>
                <li><strong>Open:</strong> after failures exceed a threshold, the breaker "trips" — all calls fail
                fast immediately (no network call) for a cool-down period, conserving resources and giving the
                dependency time to recover.</li>
                <li><strong>Half-Open:</strong> after the cool-down, it allows a limited test call. If it succeeds, the
                breaker closes (back to normal); if it fails, it reopens for another cool-down.</li>
            </ul>
            <p>It is usually paired with a fallback so callers get a graceful degraded response while the circuit is
            open.</p>`,
            explanation: 'Like an electrical breaker: when there is a fault, it trips to cut the circuit (preventing a fire), stays off for a bit, then you flip it to test if the problem is gone. It protects the whole house from one bad appliance.',
            code: `// Polly circuit breaker
.AddCircuitBreaker(new()
{
    FailureRatio = 0.5,                       // open at 50% failure
    MinimumThroughput = 10,                   // need 10+ calls to evaluate
    SamplingDuration = TimeSpan.FromSeconds(10),
    BreakDuration = TimeSpan.FromSeconds(30)  // cool-down before half-open
});`,
            language: 'csharp',
            bestPractices: ['Pair with a fallback for graceful degradation', 'Tune thresholds to the dependency\u2019s real behavior', 'Monitor/alert when circuits open'],
            commonMistakes: ['Thresholds too sensitive (flapping) or too lax', 'No fallback when open', 'Not alerting on open circuits'],
            interviewTip: 'Draw or recite the three-state machine and explain the WHY of each (conserve resources, give recovery time). Pair it with fallback.',
            followUp: ['How do you choose the failure threshold?', 'What happens to requests while the circuit is open?']
        },
        {
            question: 'How do you prevent a single failing dependency from causing a cascading, system-wide outage?',
            difficulty: 'hard',
            answer: `<p>Bound, isolate, and degrade — compose multiple patterns so failure can't spread:</p>
            <ul>
                <li><strong>Timeouts</strong> on every call so a hung dependency can't hold threads indefinitely
                (the #1 cause of cascading failure).</li>
                <li><strong>Bulkheads</strong> — isolated resource pools per dependency, so a saturated dependency
                only exhausts its own pool, leaving capacity for healthy paths.</li>
                <li><strong>Circuit breakers</strong> — fail fast on a known-broken dependency to conserve resources
                and let it recover, instead of piling on calls.</li>
                <li><strong>Retry with backoff + jitter + budgets</strong> — handle transient blips without creating a
                retry storm that amplifies load and prevents recovery.</li>
                <li><strong>Graceful degradation / fallbacks</strong> — non-core features fail soft (cached/default)
                so the core request still succeeds.</li>
                <li><strong>Load shedding / rate limiting</strong> — reject excess load cleanly rather than collapsing
                under it.</li>
            </ul>
            <p>Together these contain the blast radius: one dependency's failure stays local instead of consuming all
            resources and taking down unrelated functionality.</p>`,
            explanation: 'A ship survives a hull breach because of watertight compartments (bulkheads): water floods one section but cannot sink the whole vessel. Reliability patterns are those compartments plus automatic doors (circuit breakers), pumps (fallbacks), and bounded waiting (timeouts) that keep one failure from drowning the system.',
            bestPractices: ['Timeouts everywhere; bulkheads to isolate; circuit breakers to fail fast', 'Backoff + jitter + retry budgets to avoid storms', 'Graceful degradation for non-core features', 'Load shedding under overload', 'Implement at service-mesh level for consistency'],
            commonMistakes: ['No timeouts -> thread exhaustion', 'Retry storms amplifying the failure', 'Treating all features as critical', 'Shared pools so one dep starves all', 'No fallback / hard failure'],
            interviewTip: 'Frame it as "bound, isolate, degrade" and walk through the composed patterns. Explicitly calling out retry storms and the ship/bulkhead analogy signals deep, practical understanding.',
            followUp: ['What is a retry budget?', 'How does a bulkhead differ from a circuit breaker?', 'How would a service mesh implement these?'],
            seniorPerspective: 'The cascading failures I have seen in production almost always trace back to two things: a missing or too-generous timeout, and retries amplifying load during a partial outage. So my first questions in any reliability review are "is every outbound call bounded by a timeout?" and "what happens to our retry traffic when this dependency is at 50% errors?" Bulkheads and circuit breakers matter, but unbounded waits and retry storms are what actually turn a degraded dependency into a full outage. I also push these into the service mesh where possible so they are applied uniformly rather than depending on every team remembering to wrap every client.'
        },
        {
            question: 'How do you design a safe retry strategy, and when should you NOT retry?',
            difficulty: 'hard',
            answer: `<p>A safe retry strategy has three non-negotiable ingredients and several guardrails.</p>
            <h4>Ingredients</h4>
            <ul>
                <li><strong>Exponential backoff:</strong> increasing delays (e.g., 100ms, 200ms, 400ms) so you do not
                hammer a struggling dependency.</li>
                <li><strong>Jitter:</strong> randomize the delay so many clients do not retry at the same instant \u2014
                otherwise you create a synchronized "thundering herd" / retry storm.</li>
                <li><strong>A cap on attempts</strong> and ideally a <strong>retry budget</strong> that limits retries to a
                small fraction of total traffic, bounding amplification under widespread failure.</li>
            </ul>
            <h4>When NOT to retry</h4>
            <ul>
                <li><strong>Non-idempotent operations without an idempotency key</strong> (payments, order creation) \u2014
                a retry can duplicate the side effect. Make the operation idempotent first, then retrying is safe.</li>
                <li><strong>4xx client errors</strong> (400, 401, 403, 404, 422) \u2014 the request is wrong; retrying will
                never succeed and just wastes resources.</li>
                <li><strong>At every layer:</strong> retries nested across layers multiply (3 x 3 x 3 = 27 calls). Retry at
                one well-chosen layer, not all of them.</li>
            </ul>
            <p>Retry only <strong>transient</strong>, retryable failures (timeouts, 503/429 with backoff honoring
            <code>Retry-After</code>, connection resets). The deeper danger is that naive retries do not just fail to help
            \u2014 during a partial outage they amplify load and can convert a minor blip into a full outage that prevents the
            dependency from recovering.</p>`,
            explanation: 'Retrying without backoff is like everyone redialing a busy phone line at the exact same second \u2014 you guarantee it stays busy. Backoff plus jitter spreads the redials out so the line can actually clear; the retry budget is the rule that you stop redialing endlessly.',
            code: `// Polly v8: retry ONLY transient/idempotent failures, with backoff + jitter
.AddRetry(new RetryStrategyOptions<HttpResponseMessage>
{
    MaxRetryAttempts = 3,
    Delay = TimeSpan.FromMilliseconds(100),
    BackoffType = DelayBackoffType.Exponential,
    UseJitter = true,                       // spread retries -> no thundering herd
    ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
        .Handle<HttpRequestException>()                                  // transient
        .Handle<TimeoutRejectedException>()
        .HandleResult(r => r.StatusCode == HttpStatusCode.ServiceUnavailable   // 503
                        || r.StatusCode == HttpStatusCode.TooManyRequests)     // 429
    // DO NOT retry: 4xx client errors, and non-idempotent writes without an
    // idempotency key (a retried POST /payments could charge the card twice).
});

// For writes, make them safe to retry by sending an idempotency key:
//   POST /payments  Idempotency-Key: 7f3c-...   -> server dedupes duplicates`,
            language: 'csharp',
            bestPractices: ['Always combine backoff + jitter + an attempt cap', 'Retry only transient, idempotent operations; use idempotency keys for writes', 'Retry at one layer, not every layer (avoid multiplication)', 'Honor Retry-After on 429/503; consider a retry budget'],
            commonMistakes: ['Immediate, synchronized retries (thundering herd)', 'Retrying non-idempotent writes -> duplicate charges/records', 'Retrying 4xx errors that can never succeed', 'Nested retries across layers multiplying load'],
            interviewTip: 'Lead with backoff + jitter + cap, then immediately cover when NOT to retry (non-idempotent, 4xx) and the retry-storm amplification risk. Mentioning idempotency keys and retry budgets is the senior signal.',
            followUp: ['What is a retry budget and how does it bound amplification?', 'How do you make a payment endpoint safe to retry?'],
            seniorPerspective: 'Retries are the pattern I trust engineers with least, because the default instinct \u2014 "it failed, try again immediately, a few times" \u2014 is exactly the behavior that turns a 30-second dependency blip into a 30-minute outage. The two questions I always ask in review are "is this operation idempotent?" and "what does our retry volume look like when the dependency is at 50% errors?" If the answer to the second is "it triples," the retry policy is a liability, not a safety net.',
            architectPerspective: 'At system scale I treat retry amplification as a capacity-planning problem, not just a client setting. I favor retry budgets (cap retries at, say, 10% of request volume) and deadline propagation \u2014 passing a remaining-time budget down the call chain so inner layers do not retry against a deadline that has already expired upstream. Pushing retry policy into the service mesh also lets me reason about and bound the total retry traffic the platform can generate, rather than discovering it during an incident.'
        },
        {
            question: 'What is the bulkhead pattern, and how does it differ from a circuit breaker?',
            difficulty: 'advanced',
            answer: `<p>The <strong>bulkhead pattern</strong> isolates resources \u2014 separate thread pools, connection
            pools, or concurrency limits \u2014 <strong>per dependency</strong>, so that a slow or failing dependency can only
            exhaust its <em>own</em> pool and cannot starve the rest of the service. The name comes from a ship\u2019s
            watertight compartments: a breach floods one section but the vessel stays afloat.</p>
            <h4>Bulkhead vs circuit breaker</h4>
            <ul>
                <li><strong>Bulkhead = isolation (spatial):</strong> contains how much of your resources a single
                dependency can ever consume. It works even while the dependency is "merely" slow (not failing) \u2014 the
                classic killer, because slow calls hold threads without erroring.</li>
                <li><strong>Circuit breaker = fast-fail (temporal):</strong> after enough failures it <em>stops calling</em>
                a known-broken dependency for a cool-down, conserving resources and letting it recover.</li>
            </ul>
            <p>They are complementary, not alternatives. A bulkhead caps the blast radius of a saturated-but-not-failing
            dependency (which a circuit breaker may not trip on, since slow is not the same as failed); the circuit breaker
            avoids wasting effort on a dependency that is outright broken. Together: the bulkhead guarantees a slow
            dependency cannot consume all your threads, and the circuit breaker makes the calls that would fail return
            instantly.</p>`,
            explanation: 'A ship survives a hull breach because of watertight compartments (bulkheads): water floods one section but cannot sink the whole vessel. The circuit breaker is the automatic door that seals a compartment once it detects flooding \u2014 different mechanisms solving different halves of the same problem.',
            code: `// Bulkhead via per-dependency concurrency limits (Polly v8)
// Each dependency gets its OWN isolated pool, so a slow one can't starve others.
var paymentsPipeline = new ResiliencePipelineBuilder<HttpResponseMessage>()
    .AddConcurrencyLimiter(permitLimit: 20, queueLimit: 10)   // payments' own pool
    .Build();

var recommendationsPipeline = new ResiliencePipelineBuilder<HttpResponseMessage>()
    .AddConcurrencyLimiter(permitLimit: 10, queueLimit: 0)    // recs' own (smaller) pool
    .AddCircuitBreaker(new())                                 // + fast-fail when broken
    .Build();

// If recommendations goes slow and saturates its 10 permits, payments still has
// its full 20 permits available -> the core flow keeps working. WITHOUT bulkheads,
// a single shared thread pool means slow recs would consume every thread and the
// WHOLE service (including payments) would grind to a halt.`,
            language: 'csharp',
            bestPractices: ['Give critical and non-critical dependencies separate, sized pools', 'Pair bulkheads with circuit breakers and timeouts', 'Size pools from real concurrency/latency data, not guesses', 'Protect the core flow with its own isolated capacity'],
            commonMistakes: ['One shared pool so a slow dependency starves everything', 'Relying only on a circuit breaker (which may not trip on merely-slow calls)', 'Pools sized arbitrarily', 'Forgetting timeouts, so bulkhead permits stay held by hung calls'],
            interviewTip: 'Define bulkhead as resource isolation and contrast it explicitly: bulkhead = isolate (spatial), circuit breaker = fail fast (temporal). Stress that bulkheads protect against the slow-but-not-failing case.',
            followUp: ['Why can a slow (not failing) dependency be more dangerous than a failing one?', 'How do you size a bulkhead pool?'],
            seniorPerspective: 'Engineers reach for the circuit breaker first and forget the bulkhead, but in my experience the worst outages come from a dependency that is slow rather than down \u2014 it never trips the breaker, it just quietly holds every thread until the service is dead. A bulkhead is the only thing that reliably contains that. The other lesson is that a bulkhead without a timeout is half a pattern: hung calls just hold the isolated permits forever, so you still bleed out, just more slowly.',
            architectPerspective: 'I think of bulkheads as deciding, up front, how much of the system any one dependency is allowed to take down. That is an architectural risk-allocation decision: the payment path gets guaranteed, isolated capacity; a best-effort recommendations widget gets a small pool it can saturate harmlessly. In a service mesh I express this as per-destination connection pools and outlier detection, which gives consistent isolation across every service without each team re-implementing it \u2014 and makes the blast radius of any single dependency an explicit, reviewable property of the platform.'
        },
        {
            question: 'How do rate limiting and load shedding protect a service under overload, and how do they differ?',
            difficulty: 'expert',
            answer: `<p>Both are about <strong>admission control</strong> \u2014 deliberately rejecting some work so the
            service stays healthy for the rest \u2014 but they answer different questions.</p>
            <ul>
                <li><strong>Rate limiting</strong> caps how much a given client/tenant/route may send over a time window
                (e.g., 100 req/s per API key). It is mostly about <strong>fairness and abuse prevention</strong>: it stops
                one noisy client from consuming everyone\u2019s capacity, and returns <code>429 Too Many Requests</code> with a
                <code>Retry-After</code> hint. The decision is based on the <em>requester</em>.</li>
                <li><strong>Load shedding</strong> rejects work based on the <strong>server\u2019s current health</strong> \u2014
                queue depth, CPU, latency, or concurrency \u2014 regardless of who is asking. When the system is past its
                safe capacity it sheds the excess (often lowest-priority first) so it does not collapse. The decision is
                based on the <em>server\u2019s state</em>.</li>
            </ul>
            <p>The core insight is the same for both: a system pushed past capacity without admission control does not just
            slow down \u2014 it can enter <strong>congestion collapse</strong>, where queues grow, latency explodes, timeouts
            and retries pile on more load, and throughput drops toward zero. Cleanly rejecting excess (fail fast with 429/503)
            keeps the accepted work fast and the system alive. Rejecting a request in 1ms is far better than accepting it,
            holding it in a growing queue, and timing out 30 seconds later having done no useful work.</p>`,
            explanation: 'A nightclub at capacity does two things: a bouncer enforces a per-group limit so no single party floods the room (rate limiting), and once the fire-code occupancy is hit, the door simply stops admitting anyone until people leave (load shedding). Letting everyone cram in does not serve more guests \u2014 it creates a crush where nobody can move and the whole venue becomes unusable.',
            code: `// ASP.NET Core: per-client rate limiting (fairness) + concurrency-based shedding
builder.Services.AddRateLimiter(options =>
{
    // Rate limiting: cap each API key's throughput (returns 429)
    options.AddPolicy("per-client", httpContext =>
        RateLimitPartition.GetTokenBucketLimiter(
            partitionKey: httpContext.Request.Headers["X-Api-Key"].ToString(),
            factory: _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 100, TokensPerPeriod = 100,
                ReplenishmentPeriod = TimeSpan.FromSeconds(1),
                QueueLimit = 0                       // reject immediately, do not queue
            }));

    // Load shedding: cap total in-flight work; excess is rejected fast (503)
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(_ =>
        RateLimitPartition.GetConcurrencyLimiter("global",
            _ => new ConcurrencyLimiterOptions { PermitLimit = 500, QueueLimit = 0 }));

    options.OnRejected = (ctx, _) =>
    {
        ctx.HttpContext.Response.StatusCode = 429;          // or 503 for global shed
        ctx.HttpContext.Response.Headers.RetryAfter = "1";  // tell clients to back off
        return ValueTask.CompletedTask;
    };
});`,
            language: 'csharp',
            bestPractices: ['Rate limit per client/tenant for fairness and abuse prevention', 'Shed load based on server health (concurrency/queue/latency) under overload', 'Reject fast with 429/503 + Retry-After rather than queueing indefinitely', 'Shed lowest-priority traffic first; protect critical paths'],
            commonMistakes: ['Unbounded queues that grow until the system collapses (congestion collapse)', 'No admission control, so one client or a spike takes everyone down', 'Rejecting without Retry-After, triggering tight client retry loops', 'Treating rate limiting and load shedding as the same control'],
            interviewTip: 'Distinguish the decision basis: rate limiting keys on the requester (fairness/abuse), load shedding keys on server health (survival). Then name congestion collapse as the failure mode both prevent.',
            followUp: ['What is congestion collapse and how does shedding prevent it?', 'How would you prioritize which requests to shed first?'],
            seniorPerspective: 'The hardest thing to convince teams of is that under overload, accepting a request can be worse than rejecting it. An accepted request that sits in a queue and times out consumed resources and delivered nothing \u2014 and the client probably retried, making it worse. I would much rather return a fast 429 with a Retry-After than offer a 30-second timeout. Bounded queues and fast rejection are how you keep a system that is over capacity from becoming a system that is at zero capacity.',
            architectPerspective: 'I design admission control as a layered concern: per-client rate limits at the edge/gateway for fairness and abuse, and health-based load shedding closer to each service for survival, ideally with request prioritization so the system sheds best-effort traffic before critical transactions. Adaptive shedding driven by real signals (latency, queue depth, CPU) outperforms static thresholds because it tracks actual capacity as it changes. The architectural goal is graceful degradation under overload \u2014 a service that does less but stays up \u2014 rather than a cliff where it tries to do everything and does nothing.'
        },
        {
            question: 'How do you calculate and propagate timeout budgets across a chain of microservices?',
            difficulty: 'expert',
            answer: `<p>A <strong>timeout budget</strong> (or deadline propagation) ensures that inner services don't waste work on requests that have already expired upstream.</p>
<p><strong>The problem:</strong> If Service A sets a 5s timeout calling B, and B calls C with a 5s timeout, the total worst-case is 10s — but A already gave up at 5s. C is doing work nobody will ever use.</p>
<p><strong>The solution — deadline propagation:</strong></p>
<ol>
<li>The edge (API gateway) sets an absolute deadline: <code>X-Deadline: now + 3000ms</code></li>
<li>Each downstream service reads the deadline header and calculates remaining budget: <code>remaining = deadline - now</code></li>
<li>If remaining is already ≤ 0, reject immediately (no point starting work)</li>
<li>Set local timeouts to <code>min(remaining - safety_margin, local_default)</code></li>
<li>Pass the SAME absolute deadline to further downstream calls</li>
</ol>
<p><strong>Implementation:</strong></p>
<ul>
<li>gRPC has built-in deadline propagation via the <code>grpc-timeout</code> header</li>
<li>For HTTP, use a custom header (X-Request-Deadline) and middleware that enforces it</li>
<li>The safety margin (e.g., 50ms) accounts for network latency and local processing</li>
</ul>
<p><strong>Benefits:</strong> No wasted work on expired requests, predictable end-to-end latency, and inner services can make informed decisions about whether to start expensive operations.</p>`,
            bestPractices: ['Propagate an absolute deadline, not relative timeouts, to prevent budget expansion', 'Reserve a safety margin for local processing and network hop', 'Reject immediately if remaining budget is zero or negative', 'Use gRPC built-in deadlines where possible; custom header for HTTP'],
            commonMistakes: ['Each service independently setting generous timeouts that exceed the caller deadline', 'Not subtracting elapsed time, so inner services work on already-expired requests', 'Setting timeouts so tight that normal variance causes false failures'],
            interviewTip: 'This question separates seniors from architects. Mentioning deadline propagation (vs per-hop timeouts) and gRPC native support shows you have designed real call chains.',
            followUp: ['How does gRPC implement deadline propagation natively?', 'What happens when a service receives a request with 10ms remaining budget?']
        },
        {
            question: 'Describe graceful degradation in practice. How do you decide what to degrade?',
            difficulty: 'hard',
            answer: `<p><strong>Graceful degradation</strong> means a system continues serving its core function at reduced quality when some components fail, rather than failing entirely.</p>
<h4>Decision framework: Core vs Non-Core</h4>
<ul>
<li><strong>Core functionality:</strong> The reason the user is here. For e-commerce: browsing products, adding to cart, completing checkout. These MUST work.</li>
<li><strong>Non-core functionality:</strong> Value-adds that enhance but aren't essential. Recommendations, reviews, personalization, analytics tracking. These CAN fail gracefully.</li>
</ul>
<h4>Degradation strategies by component:</h4>
<table>
<tr><th>Component</th><th>Normal</th><th>Degraded</th></tr>
<tr><td>Recommendations</td><td>Personalized ML results</td><td>Popular items (cached), or hide section entirely</td></tr>
<tr><td>Search</td><td>Full-text with filters</td><td>Simple prefix match from cache</td></tr>
<tr><td>Reviews</td><td>Live reviews + ratings</td><td>Cached ratings summary, hide individual reviews</td></tr>
<tr><td>Inventory count</td><td>Real-time stock</td><td>"In Stock" boolean from cache (may be stale)</td></tr>
<tr><td>Analytics</td><td>Real-time event tracking</td><td>Drop events silently (fire-and-forget)</td></tr>
</table>
<h4>Implementation pattern:</h4>
<ol>
<li>Wrap non-core calls with circuit breaker + fallback</li>
<li>Fallback returns cached/default/empty response</li>
<li>UI handles missing data gracefully (hide section, show placeholder)</li>
<li>Monitor degradation state (alert that recs are in fallback mode)</li>
</ol>
<p><strong>The key insight:</strong> Users prefer a slightly degraded experience that works over a perfect experience that is down. A checkout page without personalized recommendations is fine. A checkout page that returns 500 because the recommendations service is down is unacceptable.</p>`,
            bestPractices: ['Classify every dependency as core or non-core before incidents happen', 'Pre-build fallback responses (cached data, defaults, empty arrays)', 'Make the UI resilient to missing non-core data (conditional rendering)', 'Monitor and alert on degradation state so you know when features are running in fallback'],
            commonMistakes: ['Treating all dependencies as equally critical (so any failure = total failure)', 'No pre-built fallbacks — scrambling to decide what to degrade during an incident', 'Fallbacks that are themselves complex and can fail', 'Not testing degraded mode — it has never been exercised so it is broken when needed'],
            interviewTip: 'Give a concrete example with core vs non-core classification. Showing you have pre-classified dependencies and pre-built fallbacks signals production maturity.',
            followUp: ['How do you test graceful degradation before production?', 'What if a "non-core" dependency becomes slow rather than failing — how does that affect degradation decisions?']
        },
        {
            question: 'How do you size a bulkhead (concurrency limiter) for a specific dependency? What data do you need?',
            difficulty: 'expert',
            answer: `<p><strong>Bulkhead sizing</strong> is a capacity-planning exercise. The goal: allocate enough permits that the dependency can handle normal traffic, but cap it so a slow dependency can never consume all available resources.</p>
<h4>Data you need:</h4>
<ul>
<li><strong>Normal concurrency:</strong> How many in-flight requests to this dependency at steady state? (Observe via metrics: <code>active_requests{target="payments"}</code>)</li>
<li><strong>Dependency latency:</strong> p99 latency under normal conditions (e.g., 200ms). This determines how long each permit is held.</li>
<li><strong>Traffic rate:</strong> Requests per second to this dependency (e.g., 100 rps).</li>
<li><strong>Total service capacity:</strong> Your thread pool / connection pool size (e.g., 200 threads total).</li>
</ul>
<h4>Sizing formula:</h4>
<p><code>permits = rps × p99_latency_seconds × safety_multiplier</code></p>
<p>Example: 100 rps × 0.2s × 1.5 (headroom) = 30 permits</p>
<h4>Constraints:</h4>
<ul>
<li>Sum of all bulkhead permits must be LESS than total thread pool (leave capacity for local processing)</li>
<li>Critical dependencies get more permits than non-critical ones</li>
<li>Queue limit: typically 0 for non-critical (reject immediately) or small for critical (brief buffer)</li>
</ul>
<h4>Iterative tuning:</h4>
<ol>
<li>Start with calculated values from the formula above</li>
<li>Monitor rejection rate — if permits are frequently exhausted under normal load, the pool is too small</li>
<li>Monitor queue wait time — if requests queue for too long, either increase permits or decrease timeout</li>
<li>Load test to verify: inject latency into the dependency and confirm the bulkhead contains it</li>
</ol>
<p><strong>Critical insight:</strong> A bulkhead without a timeout is incomplete. If a dependency hangs indefinitely, permits are never released and the pool is exhausted anyway. Timeout ensures permits are reclaimed.</p>`,
            bestPractices: ['Size from observed metrics (rps, latency), not guesses', 'Leave total headroom: sum of all bulkheads < total thread capacity', 'Pair with timeouts so permits are always eventually released', 'Use zero queue for non-critical paths (reject fast) and small queue for critical'],
            commonMistakes: ['Sizing too small (rejects normal traffic) or too large (provides no isolation)', 'No timeout alongside the bulkhead — hung calls hold permits forever', 'Not monitoring rejection rates to detect misconfigurations', 'Forgetting that bulkhead sizing must be revisited as traffic grows'],
            interviewTip: 'Showing the formula (rps × latency × multiplier) and the constraint (sum < total capacity) demonstrates quantitative thinking. Mentioning the timeout coupling is the senior signal.',
            followUp: ['What happens if the dependency latency increases 10x?', 'How would you auto-tune bulkhead sizes?']
        }
    ]
});
