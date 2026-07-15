/* ═══════════════════════════════════════════════════════════════════
   MICROSERVICES — Bottlenecks & Performance
   Common distributed bottlenecks, how to diagnose them from traces,
   and how to fix and scale.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('microservices-bottlenecks', {

    title: 'Microservices: Bottlenecks & Performance',
    level: 5,
    group: 'microservices',
    description: 'Where microservices performance goes wrong and how to fix it: chatty/N+1 calls, synchronous chains, cross-service joins, broker lag, hot services, serialization, connection-pool exhaustion, saga latency, and cold starts — plus a trace-first diagnosis workflow and scaling strategies.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['microservices', 'microservices-observability'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Most microservices performance problems do not live in business logic — they emerge from the
            <strong>distribution itself</strong>: network hops, serialization, queues, and shared pools. The good
            news is they are recognizable: a handful of bottleneck shapes recur, each with a telltale symptom, a
            metric that confirms it, and a known fix.</p>
            <p>This lesson catalogs those bottlenecks, gives a trace-first diagnosis workflow (build on
            <a href="#microservices-observability">Observability</a>), and covers scaling strategies. Many fixes
            reference <a href="#microservices-data">Data Management</a> (read models) and
            <a href="#microservices-communication">Communication</a> (async, gRPC).</p>`
        },
        {
            title: 'Bottleneck Catalog',
            content: `<p>Pair each bottleneck with the symptom you observe, the metric that confirms it, and the fix:</p>`,
            table: {
                headers: ['Bottleneck', 'Symptom', 'Metric to watch', 'Fix'],
                rows: [
                    ['Chatty / N+1 calls', 'One request fans into dozens of downstream calls', 'Span count per trace, request latency', 'Batch calls, API composition, denormalized read model'],
                    ['Synchronous chains', 'Latency compounds; one slow hop stalls all', 'p99 latency, per-dependency latency', 'Async events; add timeouts + circuit breaker'],
                    ['Cross-service joins', 'A query needs data from many services', 'Aggregation time, query latency', 'CQRS read model / materialized view'],
                    ['Message broker backpressure', 'Growing consumer lag; delayed processing', 'Consumer lag, queue depth', 'Scale consumers, partition topics, batch consume'],
                    ['Hot service', 'One service saturates while others idle', 'CPU/memory per service, request rate', 'Horizontal scale (HPA) + caching'],
                    ['Serialization overhead', 'High CPU on JSON encode/decode on hot paths', 'CPU time, allocations/sec', 'gRPC/Protobuf internally; smaller payloads'],
                    ['Connection pool exhaustion', 'Timeouts under load though CPU is low', 'Pool wait time, active connections', 'Right-size pools, reuse HttpClient, pool DB conns'],
                    ['Saga / workflow latency', 'End-to-end flow slow across many steps', 'Saga duration, per-step timing', 'Parallelize independent steps; reduce hops'],
                    ['Cold starts (serverless)', 'First request after idle is slow', 'Cold-start count, init duration', 'Provisioned concurrency, keep-warm, smaller images']
                ]
            }
        },
        {
            title: 'The #1 Culprit: Chatty Communication & N+1',
            content: `<p>The most common real-world bottleneck is not slow code — it is a <strong>chatty call
            graph</strong>. A single page quietly fans out into dozens of downstream calls, and the network overhead
            dwarfs the actual work.</p>
            <p>The classic form is the distributed <strong>N+1</strong>: fetch a list of N orders, then make one
            call per order to enrich it (customer name, status), turning one request into N+1 remote calls. Fixes:
            <strong>batch</strong> the enrichment into a single call (<code>GET /customers?ids=1,2,3</code>),
            <strong>compose</strong> at an aggregator, or <strong>denormalize</strong> the needed data into a
            read model so no fan-out is required.</p>`,
            code: `// BAD: distributed N+1 — one remote call per order (N+1 network hops)
var orders = await _orders.GetRecentAsync(userId);           // 1 call
foreach (var o in orders)
    o.CustomerName = await _customers.GetNameAsync(o.CustomerId); // N calls!

// GOOD: batch the enrichment into a single call
var orders = await _orders.GetRecentAsync(userId);           // 1 call
var ids = orders.Select(o => o.CustomerId).Distinct().ToArray();
var names = await _customers.GetNamesAsync(ids);             // 1 batched call
foreach (var o in orders)
    o.CustomerName = names[o.CustomerId];

// BEST (hot path): serve from a denormalized read model built from events — no fan-out at all.`,
            language: 'csharp'
        },
        {
            title: 'Trace-First Diagnosis Workflow',
            content: `<p>Diagnose top-down from evidence, not intuition. Guessing wastes hours; a trace answers in
            seconds.</p>
            <ol>
                <li><strong>Confirm the symptom with metrics</strong> — which endpoint, which percentile (p99 vs
                median), and when it started.</li>
                <li><strong>Localize with a distributed trace</strong> — open a slow trace; the waterfall shows the
                dominant span (slow DB, chatty fan-out, queued consumer, saturated dependency).</li>
                <li><strong>Classify the bottleneck</strong> using the catalog above.</li>
                <li><strong>Apply the matching fix</strong> and <strong>re-measure</strong> — confirm the metric
                actually moved.</li>
                <li><strong>Load-test</strong> the fix to verify it holds under realistic load.</li>
            </ol>`,
            mermaid: `flowchart TB
    M["Metrics: which endpoint / percentile / when"] --> Tr["Open a slow trace"]
    Tr --> Dom["Find the dominant span"]
    Dom --> Cls["Classify bottleneck"]
    Cls --> Fix["Apply matching fix"]
    Fix --> Re["Re-measure + load test"]
    Re --> M`,
            callout: {
                type: 'info',
                title: 'Percentiles, not averages',
                text: 'Always investigate p95/p99, not the mean. An average of 40ms can hide a p99 of 3s that a fraction of users hit every request — the tail is what people feel and what pages you at 3am.'
            }
        },
        {
            title: 'Scaling Strategies',
            content: `<p>Once you know the bottleneck, scale the right thing rather than everything:</p>
            <ul>
                <li><strong>Horizontal scaling</strong> — add instances of the hot service (Kubernetes HPA on
                CPU/memory/custom metrics). Requires the service to be stateless.</li>
                <li><strong>Caching</strong> — Redis/in-memory for frequently-read, rarely-changing data; the single
                biggest lever for read-heavy hot paths.</li>
                <li><strong>Async / queue-based load leveling</strong> — absorb bursts in a queue and process at a
                steady rate instead of overwhelming the service.</li>
                <li><strong>Connection pooling &amp; reuse</strong> — reuse HttpClient (avoid socket exhaustion) and
                right-size DB pools.</li>
                <li><strong>Data partitioning / sharding</strong> — split hot data stores by key to spread load.</li>
                <li><strong>gRPC / smaller payloads</strong> — cut serialization and bandwidth cost on hot internal
                paths.</li>
            </ul>`
        },
        {
            title: 'Benchmark Guidance',
            content: `<p>Rough latency budgets to reason about hot paths (order-of-magnitude, same cluster):</p>
            <ul>
                <li>Intra-cluster HTTP call: ~2-5ms</li>
                <li>gRPC call: ~1-3ms (binary, HTTP/2)</li>
                <li>Message publish + consume: ~5-50ms (broker/config dependent)</li>
                <li>Cross-region call: ~50-200ms (data locality matters)</li>
            </ul>
            <p>The lesson: a request touching five services sequentially spends ~25ms in pure network overhead
            <em>before</em> any business logic. Minimizing synchronous hops on hot paths is usually a bigger win
            than micro-optimizing code.</p>`,
            callout: {
                type: 'warning',
                title: 'Latency compounds on sync chains',
                text: 'Five sequential services at 5ms each add 25ms of network overhead before logic runs, and their availabilities multiply. Collapse hot-path chains: cache, denormalize, parallelize, or go async.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Optimizing code when the cost is fan-out</h4>
            <p>Teams profile CPU for hours when a trace would show 40 downstream calls. Check the call graph first.</p>
            <h4>Scaling everything</h4>
            <p>Throwing hardware at all services wastes money and hides the real hot spot. Scale the specific
            bottleneck.</p>
            <h4>Adding retries during a slowdown</h4>
            <p>Retries amplify load exactly when a service is struggling. Fix the bottleneck; do not pile on load.</p>
            <h4>Ignoring percentiles</h4>
            <p>Averages hide the p99 tail users actually experience.</p>
            <h4>Not load-testing the fix</h4>
            <p>A fix that works at 10 rps may collapse at 1000. Validate under realistic load.</p>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Most bottlenecks come from <strong>distribution</strong> (hops, queues, pools), not business logic</li>
                <li>The <strong>#1 culprit is chatty/N+1</strong> calls — batch, compose, or denormalize</li>
                <li>Diagnose <strong>trace-first</strong>: metrics localize, the trace pinpoints the dominant span</li>
                <li>Watch <strong>p95/p99</strong>, scale the <strong>specific hot service</strong>, and cache read-heavy paths</li>
                <li>Minimize synchronous hops on hot paths; <strong>re-measure and load-test</strong> every fix</li>
            </ul>`
        },
        {
            title: 'Continue the Series',
            content: `<p>Previous: <a href="#microservices-testing">← Testing</a> ·
            Back to <a href="#microservices">Overview</a> ·
            Next: <a href="#microservices-challenges">Challenges &amp; Anti-Patterns →</a></p>`
        }
    ],

    questions: [
        {
            question: 'How do you diagnose a performance bottleneck in a microservices system?',
            difficulty: 'hard',
            answer: `<p>Top-down from evidence: (1) confirm the symptom with <strong>metrics</strong> — which
            endpoint, which percentile (p99 vs median), when it started; (2) localize with a <strong>distributed
            trace</strong> — the waterfall shows the dominant span; (3) <strong>classify</strong> the bottleneck
            (chatty fan-out, slow DB, broker lag, pool exhaustion, hot service); (4) apply the matching fix and
            <strong>re-measure</strong>; (5) <strong>load-test</strong> to confirm it holds.</p>
            <p>The key discipline is starting from a trace, not intuition — it turns a day of guessing into minutes.</p>`,
            explanation: 'Like diagnosing a traffic jam: check which road is jammed (metrics), drive the route to see where cars stop (trace), then apply the right fix — more lanes, a bypass, or fewer stoplights — and confirm traffic actually improved.',
            bestPractices: ['Measure a baseline before changing anything', 'Watch p95/p99, not averages', 'Fix the dominant span, re-measure, repeat', 'Load-test the fix'],
            commonMistakes: ['Optimizing code when the cost is network fan-out', 'Scaling everything instead of the hot spot', 'Adding retries that amplify load'],
            interviewTip: 'Present a repeatable method (metrics → trace → classify → fix → verify) and name specific bottleneck-to-fix mappings — that structure is what scores.',
            followUp: ['Why percentiles over averages?', 'How does a trace localize a bottleneck?', 'How do you load-test one service?'],
            seniorPerspective: 'The most common real cause I find is a chatty call graph — a page quietly fanning into 40 downstream calls — not slow code. A trace shows it in seconds, whereas staring at CPU graphs can burn a day. My first lever is always "reduce the number of synchronous hops," before reaching for more hardware.'
        },
        {
            question: 'What is the distributed N+1 problem and how do you fix it?',
            difficulty: 'medium',
            answer: `<p>The distributed <strong>N+1</strong> is fetching a list of N items with one call, then making
            one <em>remote</em> call per item to enrich it — turning one request into N+1 network round trips. Unlike
            an in-process N+1 (a DB query), each extra call crosses the network, so the latency and failure cost is
            far higher.</p>
            <p>Fix by <strong>batching</strong> the enrichment into a single call
            (<code>GET /customers?ids=1,2,3</code>), <strong>composing</strong> at an aggregator, or best for hot
            paths, serving from a <strong>denormalized read model</strong> so no fan-out is needed.</p>`,
            explanation: 'It is like getting a guest list and then phoning each guest individually to ask their meal choice, instead of sending one message to everyone at once.',
            bestPractices: ['Batch enrichment into one call', 'Compose at an aggregator when appropriate', 'Denormalize into a read model for hot paths'],
            commonMistakes: ['One remote call per item in a loop', 'Ignoring the network cost of fan-out', 'No batch endpoint on the provider'],
            interviewTip: 'Stress that each N is a network hop (not a cheap in-memory call), which is why it dominates latency — then give the batch/read-model fix.',
            followUp: ['How do you design a batch endpoint?', 'When is a read model better than batching?', 'How does a trace reveal N+1?']
        },
        {
            question: 'What causes message broker backpressure (consumer lag) and how do you address it?',
            difficulty: 'hard',
            answer: `<p><strong>Consumer lag</strong> grows when messages are produced faster than consumers process
            them — a slow consumer, a spike in production, or too few consumer instances/partitions. The symptom is
            rising queue depth / lag and increasingly delayed processing.</p>
            <p>Address it by: <strong>scaling consumers</strong> (more instances), <strong>partitioning</strong> the
            topic so more consumers can work in parallel (Kafka partitions cap parallelism), <strong>batch
            consuming</strong> to raise throughput, and optimizing the slow handler. Watch <strong>consumer lag and
            queue depth</strong> as the primary metrics; alert before the backlog becomes unrecoverable.</p>`,
            explanation: 'It is a supermarket checkout: if customers (messages) arrive faster than cashiers (consumers) can serve them, the queue grows. You open more tills (scale/partition) or make each till faster (batch/optimize).',
            bestPractices: ['Monitor consumer lag and queue depth', 'Scale consumers and partition topics', 'Batch-consume to raise throughput', 'Optimize the slow handler'],
            commonMistakes: ['No lag monitoring until the backlog is huge', 'More consumers than partitions (no added parallelism)', 'Slow per-message handlers'],
            interviewTip: 'Name the metric (consumer lag) and the partition constraint — "consumers cannot exceed partitions in Kafka" is a strong detail.',
            followUp: ['Why do partitions cap consumer parallelism?', 'What is a dead-letter queue?', 'How do you recover a large backlog?']
        },
        {
            question: 'What is connection pool exhaustion and how do you prevent it?',
            difficulty: 'hard',
            answer: `<p><strong>Connection pool exhaustion</strong> is when all connections in a pool (HTTP or DB) are
            in use, so new requests wait or time out — even though CPU is low. A classic cause is creating a new
            HttpClient per request (socket exhaustion) or an undersized DB pool under load.</p>
            <p>Prevent it by <strong>reusing HttpClient</strong> via IHttpClientFactory (pooled handlers),
            <strong>right-sizing</strong> DB connection pools to the workload, keeping transactions/queries short so
            connections return quickly, and monitoring <strong>pool wait time / active connections</strong>. The
            tell-tale sign is timeouts with low CPU.</p>`,
            explanation: 'It is like a tool library with 10 tools: if everyone borrows and holds one too long, new borrowers queue at an empty shelf even though the staff are idle. Return tools fast and stock the right number.',
            bestPractices: ['Reuse HttpClient (IHttpClientFactory), never new per request', 'Right-size DB pools; keep queries/transactions short', 'Monitor pool wait time and active connections'],
            commonMistakes: ['New HttpClient per request (socket exhaustion)', 'Undersized pools under load', 'Long-held connections/transactions'],
            interviewTip: 'The diagnostic signature "timeouts with low CPU" points at pool exhaustion — naming that pattern shows real debugging experience.',
            followUp: ['Why does new HttpClient per request cause socket exhaustion?', 'How do you size a DB pool?', 'How does this relate to bulkheads?']
        },
        {
            question: 'Why prefer percentiles (p95/p99) over averages when analyzing latency?',
            difficulty: 'medium',
            answer: `<p>Averages hide the <strong>tail</strong>. A mean latency of 40ms can coexist with a p99 of 3
            seconds — meaning 1% of requests are terrible. In a system where one user request fans out to many
            services, the slowest hop dominates, so tail latency compounds and users hit slow responses far more
            often than the average suggests.</p>
            <p>Track p95/p99 (and p99.9 for critical paths) to see what users actually experience and to set
            meaningful SLOs and alerts.</p>`,
            explanation: 'If nine people wait 1 minute and one waits an hour, the "average" of ~7 minutes describes nobody. The person waiting an hour (the p99) is the one who complains.',
            bestPractices: ['Track p95/p99 (p99.9 for critical paths)', 'Set SLOs on percentiles', 'Alert on tail latency, not the mean'],
            commonMistakes: ['Reporting only averages', 'Ignoring the tail that users feel', 'SLOs based on mean latency'],
            interviewTip: 'Use the "average describes nobody" framing and connect it to fan-out (slowest hop dominates) — that ties it to microservices specifically.',
            followUp: ['How does fan-out amplify tail latency?', 'What is tail-latency amplification?', 'How do percentiles feed SLOs?']
        },
        {
            question: 'How do you decide what to scale when one part of the system is slow?',
            difficulty: 'medium',
            answer: `<p>Identify the actual bottleneck first (trace-first diagnosis), then scale <em>that</em>, not
            everything. For a <strong>hot service</strong> saturating CPU/memory, scale horizontally (Kubernetes HPA)
            if it is stateless. For <strong>read-heavy</strong> hot paths, add caching (often a bigger win than more
            instances). For <strong>burst</strong> load, use queue-based load leveling. For a <strong>hot data
            store</strong>, partition/shard or add read replicas.</p>
            <p>Scaling everything wastes money and masks the real hot spot; targeted scaling is both cheaper and
            more effective.</p>`,
            explanation: 'If one checkout lane is jammed, you open more of that lane — you do not hire more bakers and stockers who were already idle.',
            bestPractices: ['Diagnose the bottleneck before scaling', 'Horizontally scale the specific hot service', 'Cache read-heavy paths; queue bursty load'],
            commonMistakes: ['Scaling all services uniformly', 'Adding instances to a stateful service that cannot scale out', 'Ignoring caching as a cheaper first lever'],
            interviewTip: 'Say "scale the bottleneck, not everything" and mention caching as often the cheapest, highest-leverage fix.',
            followUp: ['What makes a service safely horizontally scalable?', 'When is caching the right first move?', 'What is queue-based load leveling?']
        },
        {
            question: 'Why does serialization become a bottleneck, and when do you switch from JSON to gRPC?',
            difficulty: 'medium',
            answer: `<p>On high-throughput internal paths, <strong>JSON serialization/deserialization</strong> burns
            CPU and allocates memory on every call, and JSON payloads are larger (more bandwidth). At scale this
            shows up as high CPU and GC pressure attributable to encode/decode rather than business logic.</p>
            <p>Switch to <strong>gRPC/Protocol Buffers</strong> for hot internal service-to-service calls: binary
            encoding is ~5-10x faster and payloads are smaller. Keep REST/JSON for external APIs and low-frequency
            calls where human-readability and debuggability matter more than raw speed.</p>`,
            explanation: 'JSON is sending a fully spelled-out letter every time; Protobuf is a compact pre-agreed code. For millions of messages, the compact code saves enormous time and paper.',
            bestPractices: ['gRPC/Protobuf on hot internal paths', 'Reduce payload size; avoid over-fetching', 'Keep REST/JSON at the edge'],
            commonMistakes: ['JSON on ultra-hot internal paths where CPU is the limit', 'Huge payloads with unused fields', 'Switching everything to gRPC prematurely'],
            interviewTip: 'Quantify (~5-10x) and scope it to hot internal paths — indiscriminate gRPC everywhere is not the answer.',
            followUp: ['How does Protobuf reduce size and CPU?', 'When does JSON remain the better choice?', 'How do you measure serialization cost?']
        },
        {
            question: 'A saga-based workflow is too slow end to end. How do you speed it up?',
            difficulty: 'hard',
            answer: `<p>First trace the saga to get per-step timings and find the dominant steps. Then reduce
            end-to-end latency by <strong>parallelizing independent steps</strong> (steps with no data dependency
            can run concurrently instead of sequentially), <strong>reducing the number of hops/steps</strong>,
            moving non-critical work <strong>out of the critical path</strong> (do it asynchronously after the user
            gets a response), and caching/denormalizing data a step needs.</p>
            <p>Also reconsider whether every step must complete before responding — often the user can get an
            immediate "Pending" acknowledgment while the saga completes in the background (accept eventual
            consistency).</p>`,
            explanation: 'If a five-stop errand takes all day, you do the independent stops at the same time (send two people), drop unnecessary stops, and mail the non-urgent one later instead of waiting in line for it now.',
            bestPractices: ['Trace per-step timings first', 'Parallelize independent steps', 'Move non-critical steps off the critical path', 'Return early with a Pending status where acceptable'],
            commonMistakes: ['Sequential steps that could be parallel', 'Blocking the response on non-critical steps', 'Too many fine-grained hops'],
            interviewTip: 'Lead with "trace the steps, parallelize the independent ones, and return early with Pending" — that shows you optimize the workflow, not just each service.',
            followUp: ['How do you identify independent saga steps?', 'When can you return before the saga completes?', 'How does this interact with compensations?']
        }
    ]
});
