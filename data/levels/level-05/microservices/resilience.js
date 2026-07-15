/* ═══════════════════════════════════════════════════════════════════
   MICROSERVICES — Resilience
   Timeouts, retries with backoff+jitter, circuit breaker, bulkhead,
   fallback, rate limiting/load shedding, and preventing cascading
   failures. Includes Polly examples.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('microservices-resilience', {

    title: 'Microservices: Resilience',
    level: 5,
    group: 'microservices',
    description: 'Stability patterns that stop one failing service from taking down the system: timeouts, retries with exponential backoff and jitter, circuit breaker, bulkhead, fallback, rate limiting and load shedding, and cascading-failure prevention — with Polly examples.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['microservices', 'microservices-communication'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>In a distributed system, <strong>failure is normal</strong>: networks drop, dependencies slow
            down, instances crash. The question is not whether a service will fail but whether its failure stays
            contained. Resilience patterns turn "one dependency is slow" into "one feature degrades" instead of
            "the whole system is down."</p>
            <p>This lesson covers the core stability patterns and how they combine. They apply to every synchronous
            call (see <a href="#microservices-communication">Communication</a>); asynchronous messaging is
            naturally more resilient because the broker buffers work.</p>`
        },
        {
            title: 'Timeouts',
            content: `<p>The most fundamental pattern: <strong>never wait indefinitely</strong>. A call with no
            timeout means a slow dependency holds your thread/connection forever, and under load those pile up until
            the caller itself falls over. A slow dependency is a failure — treat it as one.</p>
            <p>Set timeouts based on the dependency's expected latency plus headroom (e.g., p99 + margin), not an
            arbitrary large number. Timeouts are the foundation every other pattern builds on: a circuit breaker
            cannot trip on "slow" if calls never time out.</p>`,
            callout: {
                type: 'warning',
                title: 'A missing timeout is the root of most cascades',
                text: 'Without timeouts, one slow downstream service silently consumes all upstream threads/connections. The upstream then fails its own callers, and the failure climbs the call graph. Every remote call must have a timeout.'
            }
        },
        {
            title: 'Retries with Backoff and Jitter',
            content: `<p>Transient failures (a brief network blip, a momentary 503) often succeed on a second try.
            <strong>Retries</strong> recover from these — but done naively they amplify outages.</p>
            <ul>
                <li><strong>Retry only transient, idempotent operations.</strong> Retrying a non-idempotent action
                (e.g., a charge without an idempotency key) can double-apply it.</li>
                <li><strong>Exponential backoff</strong> — wait longer between attempts (100ms, 200ms, 400ms) so you
                do not hammer a struggling dependency.</li>
                <li><strong>Jitter</strong> — add randomness to the delay so many clients do not retry in lockstep
                and create a synchronized thundering herd.</li>
                <li><strong>Cap attempts</strong> — a small finite number (e.g., 3), never unbounded.</li>
            </ul>`,
            callout: {
                type: 'warning',
                title: 'Retry storms and double-retries',
                text: 'Unbounded retries during an outage multiply load and prevent recovery. And if both a service mesh AND the application retry, attempts multiply (3 x 3 = 9). Retry in exactly one layer, with a cap and jitter.'
            }
        },
        {
            title: 'Circuit Breaker',
            content: `<p>A <strong>circuit breaker</strong> stops calling a dependency that is clearly failing, so you
            fail fast instead of piling requests onto a struggling service — and you give it room to recover. It has
            three states:</p>
            <ul>
                <li><strong>Closed</strong> — calls flow normally; failures are counted.</li>
                <li><strong>Open</strong> — after a failure threshold, calls are rejected immediately (fail fast)
                for a cooldown period. No traffic reaches the dependency.</li>
                <li><strong>Half-open</strong> — after the cooldown, a few trial calls are allowed. If they succeed
                the breaker closes; if they fail it re-opens.</li>
            </ul>
            <p>The breaker converts slow, cascading failures into fast, contained ones and gives the downstream a
            chance to heal.</p>`,
            mermaid: `stateDiagram-v2
    [*] --> Closed
    Closed --> Open: failures exceed threshold
    Open --> HalfOpen: cooldown elapsed
    HalfOpen --> Closed: trial calls succeed
    HalfOpen --> Open: trial calls fail`
        },
        {
            title: 'Bulkhead',
            content: `<p>Named after a ship's watertight compartments: if one floods, the others keep the ship
            afloat. A <strong>bulkhead</strong> isolates resources (thread pools, connection pools, semaphores)
            per dependency so a failure in one cannot consume all resources and sink everything.</p>
            <p>Example: give calls to the (flaky) recommendations service their own small pool of 10 connections. If
            recommendations hangs, at most those 10 are stuck — the critical checkout path, using a different pool,
            keeps working. Without a bulkhead, a single slow dependency exhausts the shared pool and takes down
            unrelated features.</p>`
        },
        {
            title: 'Fallback & Graceful Degradation',
            content: `<p>When a non-critical dependency is unavailable, a <strong>fallback</strong> returns a
            sensible default instead of failing the whole request. If the recommendations service is down, show a
            generic "popular items" list rather than an error page. If live odds are momentarily unavailable, show
            the last known value marked as stale.</p>
            <p>This is <strong>graceful degradation</strong>: the system loses a feature, not its availability.
            Reserve hard failures for genuinely critical dependencies (you cannot fake taking a payment); degrade
            everything else.</p>`
        },
        {
            title: 'Rate Limiting & Load Shedding',
            content: `<p>To protect a service from being overwhelmed, reject excess work early rather than collapsing
            under it:</p>
            <ul>
                <li><strong>Rate limiting</strong> — cap requests per client/time window (e.g., 100/min) to enforce
                fair use and block abuse. Usually applied at the API gateway.</li>
                <li><strong>Load shedding</strong> — when the service is near capacity, proactively drop or reject
                lower-priority requests to keep the core functioning for everyone else. Better to serve 90% of
                traffic well than 100% badly.</li>
            </ul>
            <p>Both are forms of <em>back pressure</em>: signaling upstream to slow down instead of failing silently
            under overload.</p>`
        },
        {
            title: 'Combining the Patterns (Polly)',
            content: `<p>These patterns work as a <strong>layered stack</strong>, not in isolation. A typical HTTP
            client combines timeout + retry(backoff+jitter) + circuit breaker. In .NET, Polly composes them:</p>`,
            code: `// Polly resilience pipeline: timeout -> retry(backoff+jitter) -> circuit breaker
services.AddHttpClient<IInventoryClient, InventoryClient>(c =>
{
    c.BaseAddress = new Uri("http://inventory-service");
})
.AddResilienceHandler("inventory", builder =>
{
    builder.AddTimeout(TimeSpan.FromSeconds(2)); // fail slow calls fast

    builder.AddRetry(new HttpRetryStrategyOptions
    {
        MaxRetryAttempts = 3,
        BackoffType = DelayBackoffType.Exponential,
        UseJitter = true,                         // avoid synchronized retries
        ShouldHandle = args => ValueTask.FromResult(
            args.Outcome.Result is { StatusCode: >= System.Net.HttpStatusCode.InternalServerError })
    });

    builder.AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
    {
        FailureRatio = 0.5,                       // open at 50% failures
        MinimumThroughput = 10,
        BreakDuration = TimeSpan.FromSeconds(30)  // cooldown before half-open
    });
});`,
            language: 'csharp',
            callout: {
                type: 'tip',
                title: 'Order matters',
                text: 'Put the timeout innermost (per attempt) so each try is bounded, retry around it, and the circuit breaker outermost so it observes the final outcome. A bulkhead (pool isolation) sits around the whole client.'
            }
        },
        {
            title: 'Preventing Cascading Failures',
            content: `<p>A <strong>cascading failure</strong> is the domino effect: one slow dependency exhausts a
            caller's threads, that caller fails its callers, and the failure climbs the call graph until the system
            is down. The patterns above are precisely the defenses:</p>
            <ul>
                <li><strong>Timeout</strong> — stops a slow dependency from holding resources.</li>
                <li><strong>Circuit breaker</strong> — stops sending traffic to a failing dependency.</li>
                <li><strong>Bulkhead</strong> — contains the damage to one resource pool.</li>
                <li><strong>Fallback</strong> — keeps the request succeeding in degraded form.</li>
                <li><strong>Load shedding</strong> — sheds excess load before it topples the service.</li>
            </ul>
            <p>Test them deliberately with fault injection / chaos engineering (see
            <a href="#microservices-testing">Testing</a>) — resilience you have not tested is a hope, not a
            guarantee.</p>`
        },
        {
            title: 'Common Mistakes',
            content: `<h4>No timeout</h4>
            <p>The single most common cause of cascades. Every remote call needs one.</p>
            <h4>Unbounded or double retries</h4>
            <p>Infinite retries amplify outages; retrying in both mesh and app multiplies load. Cap attempts, add
            jitter, retry in one layer only.</p>
            <h4>Retrying non-idempotent operations</h4>
            <p>Can double-charge or double-ship. Only retry idempotent calls (use idempotency keys).</p>
            <h4>Shared resource pools</h4>
            <p>Without bulkheads, one slow dependency exhausts the pool and takes down unrelated features.</p>
            <h4>Untested resilience</h4>
            <p>Patterns configured but never exercised often fail when it counts. Inject faults regularly.</p>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Timeouts</strong> are the foundation — a slow dependency is a failure</li>
                <li><strong>Retries</strong> only for transient, idempotent calls; capped, with exponential backoff + jitter</li>
                <li><strong>Circuit breaker</strong> fails fast and lets a failing dependency recover</li>
                <li><strong>Bulkhead</strong> isolates resource pools; <strong>fallback</strong> degrades gracefully</li>
                <li>Combine them as a layered stack and <strong>test with fault injection</strong></li>
            </ul>`
        },
        {
            title: 'Continue the Series',
            content: `<p>Previous: <a href="#microservices-data">← Data Management</a> ·
            Back to <a href="#microservices">Overview</a> ·
            Next: <a href="#microservices-observability">Observability →</a></p>`
        }
    ],

    questions: [
        {
            question: 'How do you prevent one failing service from taking down the whole system?',
            difficulty: 'hard',
            answer: `<p>Layer stability patterns so a failure stays contained: <strong>timeouts</strong> (never wait
            forever), <strong>circuit breaker</strong> (fail fast when a dependency is down and let it recover),
            <strong>retry with backoff + jitter</strong> (transient errors only), <strong>bulkhead</strong> (isolate
            resource pools so one saturated dependency cannot consume all threads), <strong>fallback</strong>
            (degrade gracefully with cached/default data), and <strong>load shedding / rate limiting</strong>
            (reject excess load early).</p>
            <p>For workflows, prefer asynchronous messaging so a down consumer does not fail the caller — the broker
            buffers until it recovers.</p>`,
            explanation: 'It is building safety: fuses trip on a bad appliance (circuit breaker), separate circuits stop one short from blacking out every room (bulkhead), and surge limits prevent overload (rate limiting).',
            bestPractices: ['Combine timeout + retry + circuit breaker + bulkhead', 'Retry only idempotent transient failures', 'Add jitter to backoff', 'Define fallbacks for non-critical dependencies'],
            commonMistakes: ['Unbounded retries amplifying load', 'Retrying non-idempotent operations', 'Double retries (mesh + app)', 'No timeout, so a slow dependency ties up threads'],
            interviewTip: 'Present the patterns as a combined defense and call out the retry-storm / double-retry trap — many candidates add retries that worsen outages.',
            followUp: ['How do circuit breaker states transition?', 'What is retry jitter?', 'How do you avoid double retries with a mesh?'],
            seniorPerspective: 'My hard rule is every remote call has a timeout and a bounded, jittered retry policy — an unbounded retry during an incident is how a small outage becomes total. Per-dependency bulkheads are the pattern teams skip most, and they are exactly what stops one slow callee from freezing an entire service.'
        },
        {
            question: 'Explain the three states of a circuit breaker.',
            difficulty: 'medium',
            answer: `<p><strong>Closed:</strong> calls flow normally and failures are counted. <strong>Open:</strong>
            once failures cross a threshold, calls are rejected immediately (fail fast) for a cooldown, sending no
            traffic to the dependency so it can recover. <strong>Half-open:</strong> after the cooldown, a few
            trial calls are permitted — if they succeed the breaker closes (normal), if they fail it re-opens.</p>
            <p>The breaker converts slow cascading failures into fast contained ones and prevents hammering a
            struggling dependency.</p>`,
            explanation: 'Like an electrical breaker: normally closed and current flows; it trips open on a fault so nothing gets fried; after a while you cautiously flip it back (half-open) to test if the fault is gone.',
            bestPractices: ['Tune threshold and cooldown to the dependency', 'Combine with timeouts (so "slow" counts as failure)', 'Emit metrics on state changes'],
            commonMistakes: ['Thresholds so sensitive the breaker flaps', 'No timeout, so slowness never trips it', 'Ignoring half-open probe results'],
            interviewTip: 'Name all three states and stress the point: fail fast + give the dependency room to recover.',
            followUp: ['How do you tune the failure threshold?', 'Why does a circuit breaker need timeouts?', 'What metrics do you emit for a breaker?']
        },
        {
            question: 'What is the bulkhead pattern and what problem does it solve?',
            difficulty: 'medium',
            answer: `<p>A <strong>bulkhead</strong> isolates resources (thread pools, connection pools, semaphores)
            per dependency, so a failure in one cannot consume all resources and take down everything — like a
            ship's watertight compartments.</p>
            <p>It solves resource exhaustion: without it, a single slow dependency ties up the shared pool and
            unrelated features starve. With a dedicated small pool per dependency, a hang is contained to that pool
            while critical paths keep working.</p>`,
            explanation: 'Watertight compartments in a ship: puncture one and it floods alone; the sealed compartments keep the ship afloat. Separate pools keep one drowning dependency from sinking the rest.',
            bestPractices: ['Dedicated pools per dependency', 'Size the critical-path pool generously', 'Combine with timeouts and circuit breakers'],
            commonMistakes: ['One shared thread/connection pool for everything', 'Sizing pools without measuring', 'Assuming a circuit breaker alone prevents exhaustion'],
            interviewTip: 'Use the ship metaphor and pair it with the concrete failure it prevents: shared-pool exhaustion from one slow dependency.',
            followUp: ['How do you size a bulkhead pool?', 'Bulkhead vs circuit breaker — how do they differ?', 'How does this apply to async consumers?']
        },
        {
            question: 'When should you retry a failed call, and when should you NOT?',
            difficulty: 'hard',
            answer: `<p><strong>Retry</strong> transient failures (network blips, timeouts, 503s) on
            <strong>idempotent</strong> operations, with a capped number of attempts, exponential backoff, and
            jitter. <strong>Do not retry</strong> non-idempotent operations without an idempotency key (you may
            double-apply), permanent errors (400/404 — retrying will not help), or when a circuit breaker is open.</p>
            <p>Also avoid retrying in multiple layers: if the mesh and the app both retry, attempts multiply into a
            storm during partial failures.</p>`,
            explanation: 'Retry is like redialing a dropped call — fine for a bad connection, but you would not re-send a payment three times just because you did not hear a confirmation, unless each attempt is safely deduplicated.',
            bestPractices: ['Retry idempotent + transient only, capped, with backoff + jitter', 'Use idempotency keys to make retries safe', 'Retry in exactly one layer'],
            commonMistakes: ['Retrying non-idempotent writes without a key', 'Retrying permanent 4xx errors', 'Double retries (mesh + app)', 'Unbounded retries'],
            interviewTip: 'Tie "safe to retry" to idempotency and transience; mention the double-retry storm as the subtle trap.',
            followUp: ['What is an idempotency key?', 'Why add jitter to backoff?', 'How do retries interact with a circuit breaker?']
        },
        {
            question: 'What is a retry storm (thundering herd), and how do you prevent it?',
            difficulty: 'hard',
            answer: `<p>A <strong>retry storm</strong> happens when many clients retry a struggling dependency at the
            same time, multiplying load exactly when the dependency can least handle it — often preventing recovery
            and turning a blip into an outage. A synchronized <strong>thundering herd</strong> occurs when all
            clients retry on the same schedule.</p>
            <p>Prevent it with: <strong>jitter</strong> (randomize backoff so retries spread out), <strong>capped
            attempts</strong>, a <strong>circuit breaker</strong> (stop retrying a dead dependency entirely), and
            retrying in only one layer. Load shedding at the dependency also protects it.</p>`,
            explanation: 'If everyone redials a busy hotline at exactly the same second, the line stays jammed forever. Randomizing when each person redials (jitter) lets calls actually get through.',
            bestPractices: ['Always add jitter to backoff', 'Cap retry attempts', 'Let a circuit breaker halt retries to a dead dependency', 'Retry in one layer only'],
            commonMistakes: ['Fixed-interval retries (synchronized herd)', 'Unbounded retries', 'Retrying through an open circuit'],
            interviewTip: 'Explicitly connect "no jitter + many clients" to synchronized retries; jitter is the cheap fix interviewers want to hear.',
            followUp: ['How does jitter spread load mathematically?', 'How does a circuit breaker stop a storm?', 'What is load shedding?']
        },
        {
            question: 'What is graceful degradation and how do fallbacks enable it?',
            difficulty: 'medium',
            answer: `<p><strong>Graceful degradation</strong> means the system loses a feature, not its availability,
            when a dependency fails. A <strong>fallback</strong> returns a sensible default instead of erroring:
            show generic "popular items" when recommendations is down, or the last-known odds marked stale when the
            live feed drops.</p>
            <p>Reserve hard failures for genuinely critical dependencies (you cannot fake taking a payment) and
            degrade everything non-critical. This keeps the core experience working through partial outages.</p>`,
            explanation: 'When the espresso machine breaks, a good cafe still serves drip coffee rather than closing. You lose a feature, not the whole service.',
            bestPractices: ['Fallback for non-critical dependencies', 'Serve cached/stale data marked as such', 'Fail hard only for critical invariants'],
            commonMistakes: ['Failing the whole request when one optional widget is down', 'Serving stale data without indicating it', 'Faking critical operations like payments'],
            interviewTip: 'Distinguish critical vs non-critical dependencies — degrade the latter, never fake the former.',
            followUp: ['How do you mark data as stale to the user?', 'Which dependencies justify hard failure?', 'How does caching support fallbacks?']
        },
        {
            question: 'Why are timeouts the foundation of resilience, and how do you choose timeout values?',
            difficulty: 'medium',
            answer: `<p>Without timeouts, a slow dependency holds threads and connections indefinitely; under load
            those exhaust and the caller collapses, cascading upward. A slow dependency is effectively a failure —
            timeouts are what let you treat it as one, and they are the precondition for circuit breakers to detect
            "slow."</p>
            <p>Choose values from the dependency's observed latency: something like p99 plus headroom, not an
            arbitrary large constant. Too tight causes false failures; too loose defeats the purpose. Tune per
            dependency and revisit as latencies change.</p>`,
            explanation: 'A timeout is a stopping distance: without it you rear-end the slow car ahead and cause a pile-up behind you. You set it based on how fast traffic actually moves, not a random guess.',
            bestPractices: ['Timeout every remote call', 'Base values on measured p99 + margin', 'Revisit as dependency latency changes'],
            commonMistakes: ['No timeout at all', 'One arbitrary global timeout for all calls', 'Timeouts so tight they cause false failures'],
            interviewTip: 'Say "a slow dependency is a failure" and that timeouts enable the circuit breaker — that links the patterns together.',
            followUp: ['How does a timeout interact with retries (total budget)?', 'What is a request deadline/budget?', 'Why can a too-tight timeout hurt?']
        },
        {
            question: 'How do rate limiting and load shedding differ, and when do you use each?',
            difficulty: 'medium',
            answer: `<p><strong>Rate limiting</strong> caps requests per client over a time window (e.g., 100/min) to
            enforce fair use and block abusive clients — usually applied at the API gateway, and largely independent
            of current load. <strong>Load shedding</strong> is reactive to <em>current capacity</em>: when the
            service nears saturation, it proactively drops or rejects lower-priority requests to keep the core
            functioning.</p>
            <p>Use rate limiting for fairness/abuse control at the edge; use load shedding to protect a service from
            collapsing under a spike. Both are back-pressure mechanisms — reject early rather than fail under
            overload.</p>`,
            explanation: 'Rate limiting is a per-customer purchase limit ("max 5 each") applied always. Load shedding is the shop closing its doors when it is dangerously full, letting in only priority customers until it clears.',
            bestPractices: ['Rate limit at the gateway for fairness/abuse', 'Load shed near capacity to protect the core', 'Prioritize critical traffic when shedding'],
            commonMistakes: ['Only rate limiting, no load shedding under spikes', 'Shedding critical traffic indiscriminately', 'No back pressure, so overload causes collapse'],
            interviewTip: 'Frame the difference as "fairness/abuse (rate limit) vs current-capacity protection (load shed)" and note both are back pressure.',
            followUp: ['What algorithms implement rate limiting (token bucket)?', 'How do you prioritize traffic when shedding?', 'Where is each applied in the stack?']
        }
    ]
});
