/* ═══════════════════════════════════════════════════════════════════
   LOAD TESTING & SLOs — Level 11: Performance (Advanced Performance)
   Load/stress/soak/spike testing, k6/JMeter, SLI/SLO/SLA, error
   budgets, and capacity planning.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('load-testing', {

    title: 'Load Testing & SLOs',
    level: 11,
    group: 'performance-advanced',
    description: 'Performance testing types (load, stress, soak, spike), tools (k6, JMeter, Gatling), defining SLIs/SLOs/SLAs and error budgets, and capacity planning from results.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['observability'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Load testing</strong> validates how a system behaves under expected and extreme traffic
            <em>before</em> real users hit it. It answers questions you can't answer by guessing: How many requests
            per second can we handle? Where does latency degrade? What breaks first under stress?</p>
            <p>Paired with <strong>SLOs</strong> (Service Level Objectives), load testing turns performance from a
            vague hope into measurable, defensible targets and capacity plans.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>Types of performance tests: load, stress, soak, spike</li>
                <li>Key metrics: throughput, latency percentiles, error rate</li>
                <li>Tools: k6, JMeter, Gatling, Locust</li>
                <li>Defining SLIs, SLOs, SLAs and error budgets</li>
                <li>Capacity planning from test results</li>
                <li>Avoiding common load-testing pitfalls</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Types of Performance Tests</h4>
            <ul>
                <li><strong>Load test:</strong> expected/peak traffic — does it meet SLOs?</li>
                <li><strong>Stress test:</strong> push beyond capacity to find the breaking point and failure mode</li>
                <li><strong>Soak (endurance) test:</strong> sustained load over hours/days to find leaks and degradation</li>
                <li><strong>Spike test:</strong> sudden traffic surge to test elasticity and recovery</li>
            </ul>
            <h4>Key Metrics</h4>
            <ul>
                <li><strong>Throughput:</strong> requests/sec the system sustains</li>
                <li><strong>Latency percentiles:</strong> p50/p95/p99 (averages hide the tail)</li>
                <li><strong>Error rate:</strong> % failed requests under load</li>
                <li><strong>Saturation:</strong> resource utilization (CPU, memory, connections) at load</li>
            </ul>
            <h4>SLI / SLO / SLA</h4>
            <p>SLI = measured indicator (e.g., % requests &lt; 300ms). SLO = internal target for the SLI. SLA =
            external contractual promise. <strong>Error budget</strong> = allowed failure (100% - SLO), guiding the
            risk/feature trade-off.</p>
            <h4>Open vs Closed Models</h4>
            <p>Closed model: fixed number of virtual users looping (think time bounded). Open model: arrival rate of
            new requests (models real traffic better under overload).</p>`,
            mermaid: `graph TB
    Load[Load test: expected peak] --> Q1{Meets SLO?}
    Stress[Stress test: beyond capacity] --> BP[Find breaking point + failure mode]
    Soak[Soak: hours/days] --> Leak[Find memory leaks / degradation]
    Spike[Spike: sudden surge] --> Elastic[Test autoscaling + recovery]
    Q1 --> Capacity[Capacity plan + SLOs]
    BP --> Capacity`
        },
        {
            title: 'How It Works',
            content: `<p>A disciplined load-testing process:</p>
            <ol>
                <li><strong>Define objectives &amp; SLOs:</strong> what RPS, what p99 latency, what error rate is
                acceptable?</li>
                <li><strong>Model realistic scenarios:</strong> mirror real user journeys, traffic mix, think time,
                and data variety (not one hot endpoint)</li>
                <li><strong>Use a production-like environment &amp; data:</strong> results from a tiny test DB are
                meaningless</li>
                <li><strong>Ramp up:</strong> gradually increase load while watching latency percentiles, errors, and
                resource saturation</li>
                <li><strong>Find the knee:</strong> the point where latency/errors spike — your effective capacity</li>
                <li><strong>Analyze &amp; plan:</strong> compare against SLOs, identify bottlenecks, plan capacity with
                headroom</li>
            </ol>`,
            code: `// k6 load test: ramp virtual users and assert SLO thresholds
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // ramp up to 100 VUs
    { duration: '5m', target: 100 },   // hold (steady load)
    { duration: '2m', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<300'],  // SLO: p99 latency under 300ms
    http_req_failed:   ['rate<0.01'],  // SLO: error rate under 1%
  },
};

export default function () {
  const res = http.get('https://test.example.com/api/orders');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);   // think time between requests
}
// k6 fails the run if thresholds (SLOs) are violated -> CI gate.`,
            language: 'typescript'
        },
        {
            title: 'Visual Diagram',
            content: `<p>The performance "knee": latency stays flat until the system saturates, then spikes:</p>`,
            mermaid: `graph LR
    L1[Low load<br/>flat latency] --> L2[Rising load<br/>slowly increasing]
    L2 --> Knee[The Knee<br/>capacity limit]
    Knee --> Sat[Saturation<br/>latency + errors spike]
    style Knee fill:#fde68a,color:#1e293b
    style Sat fill:#fecaca,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Test scenarios and SLO definitions:</p>`,
            tabs: [
                {
                    label: 'Spike Test (k6)',
                    code: `// Spike test: sudden surge to test autoscaling + recovery
export const options = {
  stages: [
    { duration: '1m',  target: 50 },    // normal load
    { duration: '30s', target: 1000 },  // sudden spike
    { duration: '3m',  target: 1000 },  // sustained spike
    { duration: '30s', target: 50 },    // back to normal
    { duration: '2m',  target: 50 },    // recovery observation
  ],
};
// Watch: does autoscaling kick in fast enough? Do errors recover after the spike?`,
                    language: 'typescript'
                },
                {
                    label: 'SLO Definition',
                    code: `// Define SLIs/SLOs explicitly (as config/docs, enforced by alerts + load tests)
//
// SLI: availability  = successful requests / total requests
// SLO: 99.9% availability over 28 days
//   -> Error budget = 0.1% = ~40 minutes of downtime per 28 days
//
// SLI: latency       = % of requests served < 300ms
// SLO: 99% of requests < 300ms over 28 days
//
// SLA (external):     99.5% availability, with service credits if breached
//   (deliberately looser than the 99.9% internal SLO for safety margin)
//
// Error-budget policy: if budget is exhausted, freeze feature releases
//   and focus on reliability until it recovers.`,
                    language: 'typescript'
                },
                {
                    label: 'Capacity Calc',
                    code: `// From load-test results, plan capacity with headroom
// Suppose one instance sustains 200 RPS within SLO (p99 < 300ms) at the knee.
//
// Expected peak traffic         = 1,500 RPS
// Instances needed at the knee  = 1500 / 200 = 7.5 -> 8 instances
// Add headroom for spikes/failures (e.g., 40%): 8 * 1.4 ~= 12 instances
// Plus N+1 redundancy so losing one node does not breach SLO.
//
// Re-validate with a load test at the planned capacity, not just math.`,
                    language: 'typescript'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Define SLOs Before Testing</h4>
            <p>Know your targets (RPS, p99 latency, error rate) up front so the test has clear pass/fail thresholds.</p>
            <h4>Do: Test in a Production-Like Environment</h4>
            <p>Use representative hardware, data volumes, and network. Results from a tiny staging box with empty
            tables are misleading.</p>
            <h4>Do: Model Realistic Traffic</h4>
            <p>Replicate real user journeys, traffic mix, think time, and data variety — not a single endpoint hit in
            a tight loop.</p>
            <h4>Do: Measure Percentiles and Saturation</h4>
            <p>Track p95/p99 latency, error rate, and resource saturation, not just averages and throughput.</p>
            <h4>Do: Find the Knee, Then Plan Headroom</h4>
            <p>Identify where the system saturates and provision capacity below it with headroom for spikes and node
            failures.</p>
            <h4>Do: Automate in CI/CD</h4>
            <p>Run threshold-gated load tests (k6 thresholds) to catch performance regressions before release.</p>`,
            callout: {
                type: 'tip',
                title: 'Error Budgets Make Reliability a Decision',
                text: 'An error budget (100% minus your SLO) quantifies acceptable failure. If you are within budget you can ship features and take risks; if you have burned it, you pause features and invest in reliability. It turns "how reliable should we be?" into a shared, data-driven decision instead of an argument.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Testing the Wrong Environment</h4>
            <p>Load-testing a scaled-down staging environment with tiny data gives numbers that don't transfer to
            production. Test production-like or production-shadow setups.</p>
            <h4>Mistake: Unrealistic Scenarios</h4>
            <p>Hammering one endpoint with no think time and identical data hits caches unrealistically and misses
            real bottlenecks. Model real journeys and data variety.</p>
            <h4>Mistake: Watching Averages Only</h4>
            <p>Average latency can look fine while p99 is terrible. Always evaluate against percentile-based SLOs.</p>
            <h4>Mistake: Ignoring the Client/Test Rig Limits</h4>
            <p>If the load generator itself saturates (CPU, network, single machine), you measure the test rig, not
            the system. Distribute load generation.</p>
            <h4>Mistake: 100% Availability SLO</h4>
            <p>Targeting 100% is impossible and infinitely expensive; it leaves no error budget for change. Choose a
            realistic SLO (e.g., 99.9%).</p>
            <h4>Mistake: One-Time Testing</h4>
            <p>Performance regresses as code changes. Make load testing continuous, not a pre-launch ritual.</p>`,
            code: `// MISTAKE: judging by average only
// avg latency = 120ms  (looks fine!)  but:
//   p50 = 80ms, p95 = 250ms, p99 = 4200ms  <- 1% of users wait 4+ seconds
//
// Always assert on percentiles in thresholds:
thresholds: {
  http_req_duration: ['p(95)<300', 'p(99)<800'],   // not 'avg<300'
}`,
            language: 'typescript'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Pre-Launch &amp; Peak Events</h4>
            <p>Retailers load-test before Black Friday; ticketing and streaming services spike-test before major
            on-sales/events to ensure autoscaling and capacity hold.</p>
            <h4>SRE &amp; Reliability</h4>
            <p>SRE teams define SLOs and error budgets, using load tests to validate capacity and alerting before
            committing to reliability targets.</p>
            <h4>CI/CD Performance Gates</h4>
            <p>Threshold-gated load tests in pipelines catch regressions (a new query, a heavier payload) before they
            reach production.</p>
            <h4>Capacity &amp; Cost Planning</h4>
            <p>Test results drive right-sizing — enough instances to meet SLOs with headroom, without overspending on
            idle capacity.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Performance test types compared:</p>`,
            table: {
                headers: ['Test Type', 'Load Pattern', 'Answers', 'Duration'],
                rows: [
                    ['Load', 'Expected/peak, steady', 'Do we meet SLOs at peak?', 'Minutes-hours'],
                    ['Stress', 'Beyond capacity', 'Where/how does it break?', 'Until failure'],
                    ['Soak', 'Moderate, sustained', 'Leaks/degradation over time?', 'Hours-days'],
                    ['Spike', 'Sudden surge', 'Elasticity & recovery?', 'Short bursts'],
                    ['Smoke (perf)', 'Minimal', 'Does the test/script work?', 'Seconds-minutes'],
                    ['Breakpoint', 'Gradually increasing', 'Exact capacity (the knee)?', 'Ramp to failure']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Interpreting results and planning capacity correctly:</p>
            <h4>Find the Knee, Not Just the Max</h4>
            <p>The useful capacity is where latency/errors stay within SLO — usually <em>below</em> the absolute max
            throughput, because near max, latency explodes.</p>
            <h4>Provision with Headroom</h4>
            <p>Plan for peak + spikes + node failures (N+1). Running at 95% capacity leaves no room for surges or a
            lost instance.</p>
            <h4>Little's Law</h4>
            <p>Concurrency ≈ throughput × latency. If you know two, you can estimate the third — useful for sizing
            connection pools and thread counts.</p>
            <h4>Bottleneck Shifts</h4>
            <p>Fixing one bottleneck (e.g., CPU) reveals the next (e.g., DB connections). Re-test after each fix; the
            limiting resource moves.</p>`,
            callout: {
                type: 'warning',
                title: 'Max Throughput Is Not Usable Capacity',
                text: 'A system might "handle" 10,000 RPS but only meet its latency SLO up to 6,000 RPS \u2014 beyond that, p99 latency and errors spike. Plan capacity around the knee (where SLOs still hold), not the absolute maximum the system can technically push.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Load tests are themselves automated tests that must be maintained and gated.</p>
            <h4>Threshold-Gated CI</h4>
            <p>Encode SLOs as thresholds (k6 thresholds, Gatling assertions) so the test fails the pipeline when a
            regression breaches them.</p>
            <h4>Baseline &amp; Trend</h4>
            <p>Track results over time to spot gradual regressions (a query that got 20% slower across releases) and
            to validate optimizations.</p>`,
            code: `// k6 thresholds double as automated pass/fail (SLO) gates in CI
export const options = {
  scenarios: {
    steady: { executor: 'constant-arrival-rate', rate: 500, timeUnit: '1s',
              duration: '5m', preAllocatedVUs: 200 },   // open model: 500 req/s
  },
  thresholds: {
    http_req_duration: ['p(99)<300'],   // fail build if p99 >= 300ms
    http_req_failed:   ['rate<0.005'],  // fail build if error rate >= 0.5%
  },
};
// Pipeline step: 'k6 run loadtest.js' returns non-zero on threshold breach.`,
            language: 'typescript'
        },
        {
            title: 'Interview Tips',
            content: `<p>Load testing and SLOs are core SRE/performance interview topics:</p>
            <ul>
                <li><strong>Distinguish the test types</strong> (load/stress/soak/spike) and what each finds</li>
                <li><strong>Define SLI/SLO/SLA and error budgets</strong> precisely</li>
                <li><strong>Insist on percentiles</strong> over averages</li>
                <li><strong>Explain "the knee"</strong> and capacity planning with headroom</li>
                <li><strong>Stress production-like environments and realistic scenarios</strong></li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Senior Signal',
                text: 'Explaining that usable capacity is the "knee" (where SLOs still hold), not max throughput, and that you provision peak + headroom + N+1 redundancy, shows you can turn test results into a real, defensible capacity plan.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Books</h4>
            <ul>
                <li><em>Site Reliability Engineering</em> and the SRE Workbook (Google, free online) — SLOs/error budgets</li>
                <li><em>Systems Performance</em> by Brendan Gregg</li>
                <li><em>The Art of Capacity Planning</em> by John Allspaw</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li>k6 (k6.io), JMeter, Gatling, Locust</li>
                <li>Grafana + Prometheus for result visualization</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Test types:</strong> load (peak), stress (breaking point), soak (leaks), spike (elasticity)</li>
                <li><strong>Measure percentiles</strong> (p95/p99), error rate, and saturation — not just averages/throughput</li>
                <li><strong>Define SLIs/SLOs/SLAs and error budgets</strong> before testing; gate CI on them</li>
                <li><strong>Test production-like environments</strong> with realistic scenarios and data</li>
                <li><strong>Usable capacity = the knee</strong> (where SLOs hold), not max throughput</li>
                <li><strong>Provision peak + headroom + N+1;</strong> re-test as bottlenecks shift</li>
                <li><strong>Make it continuous</strong> to catch regressions, not a one-time pre-launch event</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Load Test and Capacity-Plan an API</h4>
            <ol>
                <li>Define SLOs: e.g., p99 &lt; 300ms and error rate &lt; 1% at expected peak</li>
                <li>Write a k6 script modeling a realistic journey (login, list, detail) with think time</li>
                <li>Run a breakpoint test (ramp until SLO breaks) to find the knee / per-instance capacity</li>
                <li>Run a soak test for 1+ hour to check for memory leaks/degradation</li>
                <li>Calculate instances needed for 3x expected peak with headroom + N+1 redundancy</li>
                <li>Add the load test with thresholds as a CI gate</li>
            </ol>`,
            code: `// 1. SLO: p99<300ms, error<1% at peak RPS
// 2. k6 scenario: realistic multi-step journey + sleep() think time
// 3. ramping-arrival-rate to find the knee (per-instance RPS within SLO)
// 4. constant load for 1h (watch memory/latency drift = leak)
// 5. instances = peak / per-instance-knee, * headroom, + 1 (N+1)
// 6. k6 thresholds -> non-zero exit fails the pipeline`,
            language: 'typescript'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What is the difference between a load test and a stress test?<br/>
                    <em>A: A load test verifies the system meets SLOs under expected/peak traffic. A stress test pushes
                    beyond capacity to find the breaking point and observe the failure mode.</em></li>
                <li><strong>Q:</strong> Why measure latency percentiles instead of averages?<br/>
                    <em>A: Averages hide the tail. A good average can coexist with a terrible p99, meaning a meaningful
                    fraction of users have a bad experience. Percentiles (p95/p99) reflect real user pain.</em></li>
                <li><strong>Q:</strong> What is an error budget and how is it used?<br/>
                    <em>A: The allowed amount of failure, equal to 100% minus the SLO. Within budget you can ship features
                    and take risks; once exhausted, you pause features and focus on reliability.</em></li>
                <li><strong>Q:</strong> Why is "max throughput" not the right capacity number?<br/>
                    <em>A: Near maximum throughput, latency and errors spike beyond SLO. Usable capacity is the "knee" \u2014
                    the highest load at which SLOs still hold \u2014 and you provision below it with headroom.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'What are the main types of performance tests and what does each reveal?',
            difficulty: 'easy',
            answer: `<p>Four common types:</p>
            <ul>
                <li><strong>Load test:</strong> expected/peak traffic — confirms the system meets SLOs under normal
                conditions.</li>
                <li><strong>Stress test:</strong> beyond capacity — finds the breaking point and how the system fails
                (graceful vs catastrophic).</li>
                <li><strong>Soak (endurance) test:</strong> sustained load over a long period — surfaces memory leaks
                and slow degradation.</li>
                <li><strong>Spike test:</strong> sudden surge — validates autoscaling and recovery.</li>
            </ul>`,
            explanation: 'Like testing a bridge: drive expected traffic across (load), keep adding trucks until it strains (stress), leave traffic on it for days (soak), and send a sudden convoy (spike) to see how it copes.',
            bestPractices: ['Pick the test type that matches your question', 'Always test against SLOs', 'Run soak tests to catch leaks'],
            commonMistakes: ['Only doing a single load test before launch', 'Never stress-testing to learn the failure mode'],
            interviewTip: 'List all four with the one thing each reveals — breadth plus precision is the high-signal answer.',
            followUp: ['Why is a soak test important?', 'What is a breakpoint test?']
        },
        {
            question: 'Explain SLI, SLO, SLA and error budgets, and how they connect to load testing.',
            difficulty: 'medium',
            answer: `<p><strong>SLI</strong> = a measured indicator (e.g., % of requests served under 300ms).
            <strong>SLO</strong> = the internal target for an SLI (e.g., 99% under 300ms over 28 days).
            <strong>SLA</strong> = an external contractual promise (usually looser than the SLO, with consequences).
            <strong>Error budget</strong> = 100% minus the SLO — the allowed amount of failure.</p>
            <p>Load testing connects to these by validating that the system actually meets its SLOs under expected
            load before you commit to them, and by encoding SLOs as pass/fail thresholds in the test (e.g., fail if
            p99 ≥ 300ms or error rate ≥ 1%). The error budget then governs whether you can keep shipping features or
            must focus on reliability.</p>`,
            explanation: 'The SLO is your goal time for a race, the SLA is the public cutoff you promised with a penalty, the error budget is how many bad performances you can afford, and the load test is the practice run that proves you can actually hit the goal under race conditions.',
            bestPractices: ['Define SLOs before testing', 'Encode SLOs as test thresholds', 'Set SLA looser than SLO', 'Use error budget to balance features vs reliability'],
            commonMistakes: ['Targeting 100% (no budget for change)', 'SLA equal to SLO (no safety margin)', 'SLOs not tied to user experience'],
            interviewTip: 'Define all four crisply, then tie them together via the error budget AND link to load testing (thresholds). That connection is what elevates the answer.',
            followUp: ['Why not target 100% availability?', 'How would you encode an SLO as a k6 threshold?']
        },
        {
            question: 'You ran a load test and need to plan production capacity from it. Walk through your approach.',
            difficulty: 'hard',
            answer: `<p>I turn test results into a defensible capacity plan:</p>
            <ol>
                <li><strong>Validate the test:</strong> confirm it ran against a production-like environment/data,
                modeled realistic journeys, and that the load generator itself wasn't the bottleneck.</li>
                <li><strong>Find the knee:</strong> identify the per-instance throughput at which SLOs still hold
                (p99 latency and error rate within target) — not the absolute max throughput.</li>
                <li><strong>Compute base capacity:</strong> instances = expected peak RPS / per-instance knee RPS.</li>
                <li><strong>Add headroom:</strong> for traffic spikes and growth (e.g., +40%), plus N+1 redundancy so
                losing a node doesn't breach SLO.</li>
                <li><strong>Account for dependencies:</strong> ensure downstream (DB, caches, third parties) also scale;
                the app tier capacity is moot if the database saturates first.</li>
                <li><strong>Validate the plan:</strong> re-run a load test at the planned capacity and a spike test to
                confirm autoscaling/recovery. Re-test as bottlenecks shift after each fix.</li>
            </ol>`,
            explanation: 'It is like planning staffing for a restaurant from a trial dinner service: find how many tables one waiter can serve while keeping service quality (the knee), multiply by expected guests, add extra staff for busy nights and sick days (headroom + N+1), make sure the kitchen can keep up too (dependencies), and then do another trial night to confirm.',
            bestPractices: ['Plan around the knee, not max throughput', 'Add spike headroom + N+1 redundancy', 'Verify downstream dependencies scale too', 'Re-test at planned capacity; re-measure as bottlenecks move'],
            commonMistakes: ['Sizing to max throughput (no SLO margin)', 'Running at ~95% capacity (no room for spikes/failures)', 'Forgetting the DB/dependencies become the bottleneck', 'Trusting math without a validating re-test'],
            interviewTip: 'Lead with "the knee, not the max" and explicitly include headroom + N+1 + downstream dependencies. That holistic, validated approach is the senior differentiator.',
            followUp: ['How does Little\u2019s Law help size pools/threads?', 'What happens when the DB becomes the bottleneck before the app tier?', 'How do you plan for autoscaling lag during spikes?'],
            seniorPerspective: 'The two mistakes I most often correct are sizing to maximum throughput (where latency has already blown past SLO) and forgetting the dependencies. App servers are cheap to scale horizontally, but they just push the bottleneck to the database, a cache, or a rate-limited third-party API \u2014 so my capacity plan always validates the whole dependency chain at the target load, not just the service under test. And I never trust the spreadsheet math alone: I re-run the load test at the planned fleet size and a spike test to confirm autoscaling reacts fast enough, because autoscaling lag during a sudden surge is a classic way to breach SLO even with "enough" steady-state capacity.'
        },
        {
            question: 'Why are tail latency percentiles (p95/p99/p99.9) so important, and what is coordinated omission?',
            difficulty: 'medium',
            answer: `<p>Averages hide the tail. A service can have a 90ms mean while 1% of requests take 5 seconds — and at scale that 1% is millions of users and often your most valuable, highest-activity ones (more requests = higher chance of hitting a slow one). <strong>Tail percentiles</strong> (p95, p99, p99.9) measure the experience of the unlucky requests, which is what users actually feel and what cascades through dependent services.</p>
            <p><strong>Coordinated omission</strong> is a measurement bug where a load tester, after issuing a slow request, waits for the response before sending the next — so during a stall it <em>fails to send</em> the requests that would have piled up, omitting exactly the worst-affected samples and dramatically under-reporting tail latency.</p>
            <p>Avoid it by using an <strong>open model</strong> (constant arrival rate, requests sent on schedule regardless of in-flight responses) or a tool that corrects for it, so the measured p99 reflects reality rather than a flattering artifact.</p>`,
            explanation: 'Measuring only the average is like saying a commute is "fine on average" while ignoring the days the train breaks down for an hour. Coordinated omission is worse: it is as if you stopped counting commuters the moment the train stalled, so your stats never even record the people stuck on the platform.',
            code: `// Open model avoids coordinated omission: send at a fixed rate regardless of latency
export const options = {
  scenarios: {
    fixed_rate: {
      executor: 'constant-arrival-rate',
      rate: 1000, timeUnit: '1s',   // 1000 req/s issued on schedule
      duration: '5m',
      preAllocatedVUs: 500, maxVUs: 2000,
    },
  },
  thresholds: { http_req_duration: ['p(99)<300', 'p(99.9)<800'] },
};
// A closed model (fixed VUs looping) would stop sending during a stall,
// hiding the very tail you care about.`,
            language: 'typescript',
            bestPractices: ['Report p95/p99/p99.9, not averages', 'Use an open (arrival-rate) model to avoid coordinated omission', 'Track the tail of dependencies too — they compound', 'Set SLOs on percentiles, not means'],
            commonMistakes: ['Judging performance by average latency', 'Closed-model tests that hide tail latency (coordinated omission)', 'Ignoring p99.9 for high-fan-out requests', 'Assuming a good mean means a good user experience'],
            interviewTip: 'Mentioning coordinated omission unprompted is a strong senior signal — explain that closed-loop testers stop sending during stalls and thus under-report the tail.',
            followUp: ['Why does tail latency get worse with request fan-out?', 'How does an open model differ from a closed model?'],
            seniorPerspective: 'I have seen dashboards show a healthy average while users screamed, because the load tool was closed-loop and silently stopped issuing requests every time the system stalled — classic coordinated omission flattering the p99. Switching to an arrival-rate model surfaced a p99 several times worse, which matched reality. For any service behind a fan-out (one user request spawning many backend calls), I care about p99.9 of the backend, because a single slow dependency call sets the latency of the whole user request.'
        },
        {
            question: 'How do you choose a load testing tool (k6, JMeter, Gatling, Locust), and what makes a test trustworthy regardless of tool?',
            difficulty: 'hard',
            answer: `<p>Match the tool to the team and workflow rather than chasing features:</p>
            <ul>
                <li><strong>k6:</strong> scripts in JavaScript, CLI-first, excellent CI integration and thresholds-as-code, efficient (Go engine). Great for developer-owned, version-controlled performance tests.</li>
                <li><strong>JMeter:</strong> mature, GUI-driven, huge protocol/plugin ecosystem; heavier (thread-per-VU, JVM) and XML test plans. Strong for complex enterprise protocols and non-coders.</li>
                <li><strong>Gatling:</strong> Scala/Java DSL, efficient async engine, excellent HTML reports; good for code-centric teams on the JVM.</li>
                <li><strong>Locust:</strong> Python scripting, easy distributed mode; good where teams know Python and want flexible custom logic.</li>
            </ul>
            <p>What makes a test <em>trustworthy</em> is largely tool-independent: a <strong>production-like environment and data volume</strong>, <strong>realistic scenarios</strong> (real journeys, traffic mix, think time, data variety), an <strong>open/arrival-rate model</strong> to avoid coordinated omission, a <strong>load generator that is not itself saturated</strong> (distribute it), and <strong>SLO-based pass/fail thresholds</strong> with results tracked over time. A perfect tool pointed at a tiny staging box with one hot endpoint produces confident, meaningless numbers.</p>`,
            explanation: 'Picking a load tool is like picking a camera: the expensive body does not matter if the lighting and subject are wrong. Production-like environment, realistic scenarios, and an honest measurement model are the lighting — get those right and almost any decent tool gives a true picture.',
            bestPractices: ['Pick the tool that fits the team\u2019s language and CI workflow', 'Prefer scripts-as-code for versioning and CI gating', 'Ensure the load generator itself is not the bottleneck (distribute)', 'Make trustworthiness (env, data, scenarios, model) tool-independent'],
            commonMistakes: ['Choosing a tool for features while testing an unrealistic environment', 'Single-machine load generation that saturates before the SUT', 'Recording one endpoint instead of realistic journeys', 'GUI-only tests that cannot be versioned or run in CI'],
            interviewTip: 'Give a crisp k6-vs-JMeter contrast (code/CI/efficient vs GUI/ecosystem/heavier), then pivot to the point that environment, scenarios, and an honest model matter more than the tool.',
            followUp: ['Why can the load generator become the bottleneck?', 'When would you still pick JMeter over k6?'],
            seniorPerspective: 'My default is k6 because scripts-as-code drop straight into CI with thresholds acting as SLO gates, which is what actually catches regressions over time. But I am tool-agnostic in interviews and in practice, because the failure mode is almost never the tool — it is testing a scaled-down environment with empty tables and one looping endpoint, then being shocked when production behaves differently. I spend more review effort on whether the test data and scenarios resemble production than on which tool drew the graph.'
        },
        {
            question: 'Explain Little\u2019s Law and the difference between open and closed workload models. How do they affect capacity sizing?',
            difficulty: 'advanced',
            answer: `<p><strong>Little\u2019s Law</strong>: in a stable system, the average number of concurrent requests in the system <code>L = \u03bb \u00d7 W</code>, where <code>\u03bb</code> is arrival rate (throughput) and <code>W</code> is average time in system (latency). Knowing any two gives the third — invaluable for sizing thread pools, connection pools, and concurrency limits.</p>
            <p><strong>Closed model:</strong> a fixed number of virtual users each send a request, wait for the response, think, then repeat. Concurrency is capped, so as the system slows, the <em>arrival rate naturally drops</em> — this can mask overload and cause coordinated omission. It models a fixed user population with feedback (e.g., internal tools).</p>
            <p><strong>Open model:</strong> new requests arrive at a defined rate independent of how fast prior ones complete. Under overload, work <em>piles up</em> — which is exactly how real internet traffic and queues behave, and why open models expose saturation and true tail latency.</p>
            <p>For sizing: use Little\u2019s Law to translate target throughput and latency into required concurrency (e.g., 1000 req/s \u00d7 0.05s = 50 concurrent \u2192 pool/thread sizing), and prefer the open model to find the knee, since the closed model\u2019s self-throttling can hide the point where the system actually falls over.</p>`,
            explanation: 'Little\u2019s Law is the checkout-line rule: if 2 customers arrive per minute and each spends 5 minutes in the store, there are about 10 customers inside on average. A closed model is a fixed group of shoppers who slow down when the store is crowded (self-limiting); an open model is the street door letting people in at a fixed rate whether or not it is already packed — which is when you discover the store cannot cope.',
            code: `// Little's Law for sizing a connection/thread pool
// Target throughput: 2000 req/s ; measured service time: 20ms (0.02s)
// Required concurrency L = lambda * W = 2000 * 0.02 = 40 in-flight requests
//   => size the pool ~40 (+ headroom) to sustain target without queueing

// Open vs closed in k6:
//   closed: 'constant-vus'           -> fixed VUs loop (arrival rate falls as latency rises)
//   open:   'constant-arrival-rate'  -> fixed req/s regardless of in-flight (work piles up)
// Use the open model to find the true saturation point (the knee).`,
            language: 'typescript',
            bestPractices: ['Use Little\u2019s Law to size pools/threads from throughput \u00d7 latency', 'Prefer the open (arrival-rate) model to reveal saturation', 'Pick the model that matches reality (open for internet traffic)', 'Validate sizing with a test, not just the formula'],
            commonMistakes: ['Using a closed model and missing overload (self-throttling)', 'Sizing concurrency by guesswork instead of Little\u2019s Law', 'Ignoring that closed-model results hide tail latency', 'Forgetting headroom on top of the computed concurrency'],
            interviewTip: 'State Little\u2019s Law as L = \u03bb \u00d7 W with a concrete sizing example, then explain that the open model exposes overload that a closed model self-throttles away.',
            followUp: ['How does the closed model relate to coordinated omission?', 'How would you size a DB connection pool with Little\u2019s Law?'],
            seniorPerspective: 'Little\u2019s Law is the back-of-envelope tool I reach for constantly — it turns "how big should this connection pool be?" from a guess into throughput times latency plus headroom. The open-vs-closed distinction matters because a closed-model test quietly throttles itself: as the system slows, the fixed VUs send fewer requests, so the test never applies the overload that production traffic would. For anything facing the open internet I insist on an arrival-rate model, because that is the only way to honestly find where the system tips over.',
            architectPerspective: 'Choosing the workload model is really choosing which reality you are validating against. Internal request/response systems with bounded user counts genuinely behave like closed systems, but anything fronting unbounded internet traffic or an async queue is open, and modeling it closed gives a dangerously optimistic capacity plan. I make this an explicit design decision and pair it with Little\u2019s Law so concurrency limits, pool sizes, and queue depths are derived from target SLOs rather than copied from defaults.'
        },
        {
            question: 'How do you design a load test that accurately simulates real-world traffic patterns?',
            difficulty: 'hard',
            answer: `<p>Realistic load tests go far beyond "send N requests per second to one endpoint." Real-world traffic has <strong>patterns, correlations, and behaviors</strong> that synthetic tests often miss.</p>
            <h4>Key Design Principles:</h4>
            <ul>
                <li><strong>Traffic shape</strong>: Real traffic has peaks (morning login surge), gradual ramps, and spikes (flash sales). Design tests with realistic arrival patterns, not flat load.</li>
                <li><strong>User journeys</strong>: Model complete workflows (browse → search → add-to-cart → checkout), not isolated endpoints. Include think time between actions (3-15 seconds).</li>
                <li><strong>Data distribution</strong>: Use realistic data — Zipf distribution for popular items (80/20 rule), varied payload sizes, diverse user profiles.</li>
                <li><strong>Stateful sessions</strong>: Maintain cookies, tokens, and session state across requests. Stateless bombardment misses connection pool exhaustion and session store pressure.</li>
                <li><strong>Mixed workload ratio</strong>: Match production read/write ratio (e.g., 95% reads, 5% writes). Write-heavy tests may miss caching benefits; read-only tests miss write contention.</li>
            </ul>
            <h4>Practical Approach:</h4>
            <ol>
                <li>Analyze production access logs for endpoint distribution and timing patterns</li>
                <li>Identify the top 10 user journeys by frequency</li>
                <li>Create test scenarios that weight journeys by actual production ratio</li>
                <li>Add think time, parameterize data, and include error/retry paths</li>
                <li>Validate that test generates the same backend patterns (query mix, cache hit ratio) as production</li>
            </ol>`,
            bestPractices: ['Mine production logs/APM for realistic endpoint distribution and think times', 'Include background load (monitoring, health checks, cron jobs) that competes for resources', 'Test from geographic locations matching real users (network latency matters)', 'Warm up caches before measuring (unless testing cold-start behavior)'],
            commonMistakes: ['Flat load instead of realistic patterns (misses spike behavior)', 'No think time (unrealistic concurrency per user, inflates throughput numbers)', 'Testing one endpoint in isolation (misses resource contention between APIs)', 'Using sequential IDs for data (hits the same DB page repeatedly, unrealistic cache behavior)'],
            interviewTip: 'The senior signal is recognizing that a load test is a model of reality — and like all models, it can lie. Discuss how you validate that your test produces the same backend behavior (cache hit ratios, query patterns) as production.',
            followUp: ['How do you handle authentication tokens in load tests?', 'What is pacing vs think time?', 'How do you test cache warming behavior?'],
            seniorPerspective: 'The load tests that find real problems model complete user journeys with realistic data distributions and think times. I validate my tests by comparing their backend telemetry (cache hit ratio, DB query mix, connection pool utilization) against production — if these differ, the test is measuring something other than reality.',
            architectPerspective: 'I treat load test design as a modeling exercise: the test must produce the same emergent behaviors (hotspots, contention patterns, cascade failures) as real traffic. I pair traffic replay from production logs with synthetic spike injection to cover both steady-state and stress scenarios.'
        },
        {
            question: 'How do you use error budgets and SLOs to set performance acceptance criteria for load tests?',
            difficulty: 'hard',
            answer: `<p><strong>SLO-driven load testing</strong> ties performance acceptance directly to the service's reliability contract, making pass/fail objective and business-aligned rather than arbitrary.</p>
            <h4>The Framework:</h4>
            <ul>
                <li><strong>SLI (Service Level Indicator)</strong>: The metric you measure — e.g., "proportion of requests completing in &lt; 200ms" or "error rate &lt; 0.1%".</li>
                <li><strong>SLO (Service Level Objective)</strong>: The target — e.g., "99.9% of requests complete in &lt; 200ms over 30 days."</li>
                <li><strong>Error budget</strong>: The allowed failure — 100% - SLO. A 99.9% SLO gives a 0.1% error budget (43 minutes/month of violations).</li>
            </ul>
            <h4>Applying to Load Tests:</h4>
            <ol>
                <li><strong>Define pass criteria from SLOs</strong>: "At 2x expected peak load, p99 latency must stay below 500ms and error rate below 0.1%."</li>
                <li><strong>Test at headroom multiples</strong>: If the SLO must hold at peak (10K RPS), test at 1.5x and 2x peak to find the margin.</li>
                <li><strong>Measure budget consumption rate</strong>: During load, track how fast the error budget would deplete. If a 10-minute test at peak burns 50% of the monthly budget, the system is too fragile.</li>
                <li><strong>Gate deployments</strong>: Integrate load tests into CI/CD — a release that violates SLOs at expected load cannot deploy.</li>
            </ol>
            <p><strong>Key insight:</strong> Error budgets make the trade-off explicit. Teams can choose to "spend" budget on velocity (ship faster, accept some risk) or "save" it for reliability. Load tests tell you how much budget each change costs.</p>`,
            bestPractices: ['Define SLOs before writing load tests (tests validate the contract, not arbitrary thresholds)', 'Test at multiples of expected peak to find the safety margin', 'Automate SLO-based pass/fail in CI/CD pipelines', 'Track error budget burn rate over time to detect gradual degradation'],
            commonMistakes: ['Arbitrary performance thresholds disconnected from business needs ("p99 < 100ms" when users tolerate 500ms)', 'Only testing at average load (SLOs must hold at peak, not average)', 'Not accounting for degradation under cascading failures (test failure modes too)', 'Setting SLOs too tight (leaves no error budget for experimentation and deployments)'],
            interviewTip: 'Connect the dots: SLOs are the business contract, error budgets are the spending policy, and load tests are the validation that the contract holds. This shows you think about performance as a business concern, not just a technical metric.',
            followUp: ['How do you handle SLO violations discovered in production vs load tests?', 'What is the relationship between SLOs and autoscaling?', 'How do you set SLOs for a new service with no historical data?'],
            seniorPerspective: 'I insist that load test pass/fail criteria come from SLOs, not from "it feels fast enough." This turns performance into a contract: if the load test shows we burn 30% of our monthly error budget in a 10-minute spike, we know exactly how much risk this release carries and can make an informed ship/no-ship decision.',
            architectPerspective: 'SLO-driven load testing is part of a broader reliability engineering culture. I wire SLOs into deployment gates (load test at 2x peak must pass), dashboards (real-time error budget remaining), and incident management (budget exhausted = feature freeze). Load tests validate the contract; production monitoring enforces it.'
        }
    ]
});
