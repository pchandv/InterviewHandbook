PageData.register('production-debugging', {
    title: 'Production Debugging',
    description: 'How to diagnose live system issues at scale: flame graphs, heap dumps, thread dumps, memory leak detection, CPU profiling, distributed tracing, and the systematic approach to production investigation that no textbook teaches',
    sections: [
        {
            title: 'Introduction',
            content: `<p><strong>Production debugging</strong> is fundamentally different from development debugging. You cannot attach a debugger, reproduce the issue locally, or add console.log statements. The system is serving real traffic, and your investigation must not make things worse.</p>
<p>This topic covers the skills that separate engineers who can fix issues in staging from those who can diagnose and resolve production incidents under pressure — a skill set that is almost never taught in courses or covered by interview prep sites, yet is the #1 differentiator for senior+ hires.</p>
<p><strong>Why this matters for interviews:</strong> "Tell me about a time you debugged a production issue" is asked in nearly every senior interview. The quality of your answer — the systematic approach, the tools you name, the trade-offs you considered — reveals whether you have real production experience.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>Production debugging operates under constraints that development debugging does not:</p>`,
            table: {
                headers: ['Constraint', 'Why It Matters', 'Implication'],
                rows: [
                    ['Cannot attach debugger', 'Breaking on a line pauses the process for ALL users', 'Must use observability signals (logs, metrics, traces) and sampling tools'],
                    ['Cannot reproduce locally', 'Issue depends on scale, real data, network conditions, or race conditions', 'Must diagnose from production signals, not local repro'],
                    ['Must not make things worse', 'Adding logging/profiling adds overhead to an already-stressed system', 'Use sampling profilers, conditional logging, and non-invasive tools'],
                    ['Time pressure', 'Every minute is customer impact and revenue loss', 'Need systematic methodology, not random guessing'],
                    ['Incomplete information', 'You see symptoms, not causes. Multiple hypotheses may fit.', 'Hypothesis-driven investigation: form theory, find evidence, eliminate alternatives'],
                    ['Distributed causality', 'Root cause may be 5 services away from the symptom', 'Need distributed tracing and service dependency understanding']
                ]
            }
        },
        {
            title: 'The Systematic Approach',
            content: `<p>Production debugging follows a disciplined methodology — not random log-reading:</p>`,
            mermaid: `graph TD
    A[Symptom Detected] --> B[Triage: Severity + Scope]
    B --> C[Gather Signals: Metrics + Traces + Logs]
    C --> D[Form Hypothesis]
    D --> E{Evidence supports?}
    E -->|Yes| F[Identify Root Cause]
    E -->|No| G[Eliminate, form new hypothesis]
    G --> D
    F --> H[Implement Fix or Mitigation]
    H --> I[Verify: Symptom Resolved?]
    I -->|No| C
    I -->|Yes| J[Document + Prevent Recurrence]

    style A fill:#ef4444,color:#fff
    style F fill:#22c55e,color:#fff
    style J fill:#3b82f6,color:#fff`
        },
        {
            title: 'Flame Graphs & CPU Profiling',
            content: `<p><strong>Flame graphs</strong> are the single most powerful production debugging tool for CPU issues. They show WHERE your application is spending time, aggregated from thousands of stack samples.</p>
<h4>How they work:</h4>
<ol>
<li>A sampling profiler takes periodic snapshots of the call stack (e.g., 100 times/second)</li>
<li>Stacks are aggregated: identical stack traces are counted</li>
<li>Rendered as a flame graph: x-axis = proportion of time spent, y-axis = call depth</li>
<li>Wide bars = functions consuming the most CPU time (your optimization targets)</li>
</ol>
<h4>Production-safe profiling:</h4>
<ul>
<li><strong>.NET:</strong> <code>dotnet-trace collect</code> or <code>dotnet-counters</code> — low overhead, attach to running process</li>
<li><strong>Linux:</strong> <code>perf record</code> → <code>perf script</code> → FlameGraph tools</li>
<li><strong>Continuous profiling:</strong> Pyroscope, Datadog Profiler, Parca — always-on sampling at 1-5% overhead</li>
</ul>`,
            code: `# .NET: Capture a 30-second CPU profile from a running production process
# This is SAFE in production — sampling profiler, <2% overhead

# Option 1: dotnet-trace (attach to PID)
dotnet-trace collect --process-id 1234 --duration 00:00:30 --output cpu-profile.nettrace

# Option 2: dotnet-counters for real-time CPU/GC/threadpool metrics
dotnet-counters monitor --process-id 1234 --counters System.Runtime

# Convert to flame graph (SpeedScope or PerfView):
# Open cpu-profile.nettrace in https://www.speedscope.app/

# Linux perf (for containerized .NET apps):
perf record -g -p 1234 -- sleep 30
perf script | stackcollapse-perf.pl | flamegraph.pl > flame.svg

# Reading a flame graph:
# - Wide bars at the TOP = leaf functions consuming CPU (optimize these)
# - Wide bars in the MIDDLE = framework/GC overhead
# - Narrow towers = deep call stacks (may indicate recursion or over-abstraction)
# - Compare flame graphs BEFORE and AFTER a deploy to find regressions`,
            language: 'bash'
        },
        {
            title: 'Memory Leak Diagnosis',
            content: `<p>Memory leaks in production are insidious — they grow slowly over hours/days until the process OOMs and restarts. By then, the evidence is gone unless you captured it.</p>
<h4>Diagnosis methodology:</h4>
<ol>
<li><strong>Detect:</strong> Monitor process memory over time. Growing linearly without plateau = leak. GC gen2 collections increasing = objects surviving too long.</li>
<li><strong>Capture heap dump:</strong> Take a dump while the process is running (before it OOMs!)</li>
<li><strong>Analyze:</strong> Open in dotMemory, PerfView, or MAT (Java). Look for objects that dominate retained memory.</li>
<li><strong>Identify the retention path:</strong> WHY are these objects alive? What root reference prevents GC from collecting them?</li>
</ol>`,
            code: `# .NET: Capture heap dump from running production process
# CAUTION: Large heaps (>4GB) may cause a brief pause during dump

# Option 1: dotnet-dump (safe, recommended)
dotnet-dump collect --process-id 1234 --output heap.dmp

# Option 2: createdump (Linux container)
createdump --full 1234

# Analyze with dotnet-dump analyze:
dotnet-dump analyze heap.dmp
> dumpheap -stat                    # Show object counts by type
> dumpheap -type MyApp.OrderCache   # Find specific type instances
> gcroot 0x7f8a2c000100             # Find WHY an object is alive (root path)

# Common .NET memory leak patterns:
# 1. Event handler not unsubscribed (publisher holds reference to subscriber)
# 2. Static collection growing unbounded (cache without eviction/TTL)
# 3. Timer/callback preventing GC of the owning object
# 4. HttpClient created per-request (socket exhaustion + finalizer queue growth)
# 5. String interning or large StringBuilder in long-lived scope

# Prevention: monitor these counters continuously
# - GC Heap Size (gen0, gen1, gen2, LOH)
# - GC collection count per generation
# - % Time in GC (>10% sustained = pressure)
# - Finalization queue length (growing = leak of disposable objects)`,
            language: 'bash'
        },
        {
            title: 'Thread Dumps & Deadlock Detection',
            content: `<p>When an application becomes unresponsive but the process is alive, the problem is usually threads — they are blocked, deadlocked, or exhausted.</p>
<h4>Thread dump analysis:</h4>
<ul>
<li><strong>What it shows:</strong> The current state and stack trace of every thread at a point in time</li>
<li><strong>Deadlock pattern:</strong> Thread A holds Lock 1, waiting for Lock 2. Thread B holds Lock 2, waiting for Lock 1. Both are permanently stuck.</li>
<li><strong>Thread pool exhaustion:</strong> All 200 threadpool threads are blocked waiting on the same resource (DB connection pool full, semaphore at 0)</li>
<li><strong>Async deadlock (.NET):</strong> <code>.Result</code> or <code>.Wait()</code> on an async method blocks the thread that the continuation needs to resume on</li>
</ul>`,
            code: `// .NET: Capture thread dump (all thread stacks at this instant)
dotnet-dump collect --process-id 1234 --type Full
dotnet-dump analyze heap.dmp
> threads          # List all managed threads and their states
> clrstack -all    # Show stack traces for all threads
> syncblk          # Show lock ownership (who holds which lock)
> dso              # Dump stack objects for context

// Common patterns you'll see in a hung .NET app:
// Pattern 1: ThreadPool exhaustion (all threads blocked on sync-over-async)
//   200 threads all showing: System.Threading.Monitor.Wait() 
//     or SemaphoreSlim.Wait() or HttpClient.Send() (sync!)
//   FIX: make the call async (remove .Result/.Wait()/GetAwaiter().GetResult())

// Pattern 2: Connection pool exhaustion
//   All threads waiting on: SqlConnection.Open()
//     "timeout waiting for a connection from the pool"
//   FIX: connection leak — some code path opens connections without disposing
//     Find the code path NOT in a 'using' block

// Pattern 3: Classic deadlock
//   Thread 5: owns Lock A, waiting for Lock B
//   Thread 8: owns Lock B, waiting for Lock A
//   FIX: consistent lock ordering, or restructure to avoid holding two locks

// Pattern 4: Async deadlock (.NET classic)
//   Main thread waiting at: Task.Result (blocking)
//   Continuation waiting for: main thread's SynchronizationContext
//   FIX: use await all the way up (async/await, never .Result)`,
            language: 'csharp'
        },
        {
            title: 'Distributed Debugging',
            content: `<p>In microservices, the symptom is in Service A but the root cause is in Service D — 3 hops away. Distributed debugging connects the dots across service boundaries.</p>
<h4>Techniques:</h4>
<ul>
<li><strong>Distributed tracing:</strong> Follow the trace ID from the failing service back through the call chain. Find which span is slow/erroring.</li>
<li><strong>Service dependency graph:</strong> Which services does the failing service depend on? Check each dependency's health.</li>
<li><strong>Correlation ID log search:</strong> Search all service logs by correlation/trace ID to reconstruct the full request lifecycle.</li>
<li><strong>Comparative analysis:</strong> What changed recently? Compare the failing service's behavior before and after the regression started.</li>
</ul>`,
            mermaid: `sequenceDiagram
    participant User
    participant API as API Gateway
    participant Order as Order Service
    participant Inv as Inventory Service
    participant DB as Database

    User->>API: POST /checkout (slow!)
    API->>Order: Create order (trace_id=abc)
    Order->>Inv: Reserve stock
    Note over Inv: Slow query here!<br/>SELECT ... FROM inventory<br/>WHERE sku IN (...)<br/>Missing index on sku!
    Inv->>DB: Query (3.2 seconds!)
    DB-->>Inv: Results
    Inv-->>Order: Reserved
    Order-->>API: Created
    API-->>User: 201 (total: 4.1s)

    Note over User,DB: Trace shows: 78% of latency in Inv→DB span<br/>Root cause: missing index, 3 services away from symptom`
        },
        {
            title: 'Best Practices',
            content: `<ul>
<li><strong>Always start with metrics, not logs</strong> — Metrics tell you WHAT is wrong (latency spike, error rate up, saturation). Logs tell you WHY. Start broad, then narrow.</li>
<li><strong>Compare against baseline</strong> — "Is this metric abnormal?" requires knowing what normal looks like. Always compare current vs same-time-yesterday or vs the hour before the issue started.</li>
<li><strong>Check recent changes first</strong> — 80% of production issues correlate with a recent deploy, config change, or traffic pattern change. Always check "what changed?" before deep-diving.</li>
<li><strong>Use the scientific method</strong> — Hypothesize → predict what evidence would confirm/deny → look for that evidence. Do NOT just scroll through logs hoping to spot something.</li>
<li><strong>Non-invasive tools first</strong> — Sampling profilers, read-only queries, existing metrics/traces. Invasive tools (heap dump, tcpdump) only when necessary and with awareness of their impact.</li>
<li><strong>Document as you go</strong> — Keep a running timeline in the incident channel. You WILL forget the sequence of events. The postmortem needs this data.</li>
<li><strong>Know your tools BEFORE the incident</strong> — Learning to use dotnet-dump at 3 AM during a P1 is too late. Practice on non-production regularly.</li>
<li><strong>Mitigate first, investigate second</strong> — If you can rollback or scale to stop the bleeding, do that FIRST. Then investigate root cause without time pressure.</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>Jumping to logs without context</strong> — Reading 10,000 log lines without first using metrics to narrow the time window, service, and endpoint wastes critical incident time.</li>
<li><strong>Confirmation bias</strong> — Finding one piece of evidence that supports your first guess and declaring it the root cause without eliminating alternatives. The first hypothesis is often wrong.</li>
<li><strong>Adding verbose logging to production during an incident</strong> — This adds load to an already-stressed system and can make things worse. Use existing signals and sampling tools instead.</li>
<li><strong>Blaming the last deploy without evidence</strong> — "Something changed, must be the deploy" — maybe, but verify. Check deploy diff, canary metrics, and whether the timing actually correlates.</li>
<li><strong>Fixing the symptom, not the cause</strong> — Restarting a pod fixes the OOM temporarily but does not fix the memory leak. The issue will return.</li>
<li><strong>Not taking a heap/thread dump before restarting</strong> — The evidence disappears on restart. Always capture diagnostic data BEFORE mitigation if possible.</li>
<li><strong>Solo debugging for too long</strong> — If you cannot form a hypothesis in 10 minutes, escalate/swarm. Fresh eyes see things you have been staring past.</li>
</ul>`
        },
        {
            title: 'Interview Tips',
            content: `<p>Production debugging questions are THE question that reveals real senior engineering experience:</p>`,
            callout: {
                type: 'tip',
                title: 'What Interviewers Are Really Asking',
                text: `<ul>
<li><strong>"Tell me about a production issue you debugged"</strong> — They want to hear your METHODOLOGY, not just the answer. Walk through: symptom → triage → signals gathered → hypothesis → evidence → root cause → fix → prevention.</li>
<li><strong>Tool fluency</strong> — Name specific tools (flame graphs, dotnet-dump, distributed tracing, perf). Generic answers like "I looked at the logs" signal junior-level debugging.</li>
<li><strong>Prioritization under pressure</strong> — Did you mitigate first (stop the bleeding) then investigate? Or did you spend 2 hours debugging while customers suffered?</li>
<li><strong>What you DIDN'T do</strong> — Mentioning what you ruled out (and why) shows rigorous thinking vs lucky guessing.</li>
<li><strong>Prevention</strong> — Great answers end with "and here's what we did to prevent recurrence" (alert, test, architecture change).</li>
</ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li>Production debugging requires a systematic methodology: metrics → hypothesis → evidence → eliminate → root cause</li>
<li>Flame graphs are your best friend for CPU issues; heap dumps for memory issues; thread dumps for hangs</li>
<li>Always mitigate first (rollback, scale), then investigate without time pressure</li>
<li>80% of issues correlate with recent changes — always check "what changed?" early</li>
<li>In distributed systems, follow the trace: the symptom is often far from the cause</li>
<li>Capture diagnostic data (heap dump, thread dump) BEFORE restarting — evidence disappears</li>
<li>Practice your tools before you need them. 3 AM during a P1 is not the time to learn dotnet-dump</li>
<li>Document as you investigate — the postmortem (and your interview answer) needs the timeline</li>
</ul>`
        }
    ],
    questions: [
        {
            id: 'pd-q1',
            level: 'mid',
            title: 'You get paged for high latency on the checkout API. Walk through your first 5 minutes of investigation.',
            answer: `<p><strong>Systematic first 5 minutes:</strong></p>
<ol>
<li><strong>Minute 0-1: Triage scope and severity</strong>
<ul><li>Is it ALL checkout requests or a subset? (Check latency graph — p50 normal but p99 spiked = subset)</li>
<li>When did it start? (Correlate with deploy markers on the dashboard)</li>
<li>What is the customer impact? (Error rate up too, or just slow?)</li></ul></li>
<li><strong>Minute 1-2: Check recent changes</strong>
<ul><li>Was there a deploy in the last 30 minutes? (If yes → strong suspect → prepare rollback)</li>
<li>Any config changes, feature flag toggles, or infrastructure changes?</li></ul></li>
<li><strong>Minute 2-3: Check dependency health</strong>
<ul><li>Service dependency graph: is a downstream service (payments, inventory, DB) showing errors or latency?</li>
<li>Check each dependency's Golden Signals (RED metrics)</li></ul></li>
<li><strong>Minute 3-4: Narrow via distributed trace</strong>
<ul><li>Find a slow checkout trace → which span consumed the time?</li>
<li>"80% of the 4s latency is in the Inventory → DB span" → narrowed to one service + one query</li></ul></li>
<li><strong>Minute 4-5: Form hypothesis and decide action</strong>
<ul><li>If recent deploy + clear correlation → ROLLBACK now, investigate after</li>
<li>If dependency issue → escalate to that team + communicate status</li>
<li>If need more investigation → communicate "investigating, ETA 10 min" to stakeholders</li></ul></li>
</ol>
<p><strong>Key principle:</strong> Mitigate if you can (rollback), communicate regardless, then investigate. Never silently investigate for 30 minutes while customers suffer.</p>`
        },
        {
            id: 'pd-q2',
            level: 'mid',
            title: 'What is a flame graph and how do you read one to find performance bottlenecks?',
            answer: `<p>A <strong>flame graph</strong> is a visualization of profiled stack traces that shows where CPU time is being spent in a running application.</p>
<h4>How to read one:</h4>
<ul>
<li><strong>X-axis:</strong> Width represents the proportion of total samples (time) that function appeared in. WIDER = more CPU time consumed.</li>
<li><strong>Y-axis:</strong> Stack depth. Bottom = entry point (Main/Request handler), Top = leaf functions doing actual work.</li>
<li><strong>Color:</strong> Random or category-based (user code vs framework vs GC). Not meaningful for ordering.</li>
<li><strong>Finding bottlenecks:</strong> Look for WIDE bars near the TOP (leaf functions consuming disproportionate CPU). A function taking 40% of width is your optimization target.</li>
</ul>
<h4>Common patterns:</h4>
<ul>
<li><strong>Wide flat top:</strong> A single hot function (tight loop, expensive computation). Optimize or cache its result.</li>
<li><strong>Wide section in the middle:</strong> Framework overhead (serialization, GC, reflection). May indicate architectural issue.</li>
<li><strong>Many thin towers:</strong> Deep call stacks with no single bottleneck. Performance issue is death-by-a-thousand-cuts (reduce allocations, simplify abstractions).</li>
<li><strong>GC dominating:</strong> Large GC section = excessive allocations. Reduce object creation on hot paths.</li>
</ul>
<p><strong>Production-safe capture:</strong> Sampling profilers (dotnet-trace, perf, async-profiler) add &lt;5% overhead and can safely attach to production processes. They sample at intervals rather than instrumenting every call.</p>`
        },
        {
            id: 'pd-q3',
            level: 'senior',
            title: 'A .NET service is slowly consuming more memory over days until it OOMs. How do you diagnose the memory leak in production?',
            answer: `<p><strong>Memory leak diagnosis methodology:</strong></p>
<ol>
<li><strong>Confirm it is a leak (not just growth):</strong> Monitor GC heap size over hours/days. True leak = linear growth without plateau. Normal = grows then stabilizes after warmup.</li>
<li><strong>Identify WHEN it started:</strong> Correlate memory growth timeline with deploys. If it started with a specific version, diff that version for likely causes.</li>
<li><strong>Capture heap dump while running (before OOM!):</strong> <code>dotnet-dump collect --process-id PID</code>. Do NOT wait for the OOM — by then the process is dead and evidence is gone.</li>
<li><strong>Analyze the dump:</strong>
<ul><li><code>dumpheap -stat</code> — which object types dominate by count and size?</li>
<li>Look for unexpectedly large counts (1M EventHandler instances? 500K SqlConnection?)</li>
<li>Pick a suspicious object: <code>gcroot 0xADDRESS</code> — trace the root reference preventing GC</li></ul></li>
<li><strong>Common .NET leak patterns:</strong>
<ul><li>Event handlers not unsubscribed (publisher holds subscriber reference)</li>
<li>Static Dictionary/List growing unbounded (no TTL, no eviction)</li>
<li>Timer callbacks preventing owning object from being collected</li>
<li>IDisposable not disposed (SqlConnection, HttpClient) — finalizer queue growth</li>
<li>Closures capturing and holding references longer than intended</li></ul></li>
<li><strong>Fix and verify:</strong> Deploy fix, monitor memory for 24+ hours to confirm growth stops.</li>
</ol>
<p><strong>Pro tip:</strong> Take TWO heap dumps 10 minutes apart and diff them. Objects that grew between dumps are your leak candidates.</p>`
        },
        {
            id: 'pd-q4',
            level: 'senior',
            title: 'A service is intermittently returning 503s but the process is alive and CPU/memory look normal. How do you diagnose this?',
            answer: `<p><strong>Alive process + normal resources + 503 = thread/connection exhaustion or blocking.</strong> The threads are all stuck waiting on something.</p>
<h4>Diagnosis:</h4>
<ol>
<li><strong>Check threadpool metrics:</strong> <code>dotnet-counters</code> → ThreadPool Queue Length, ThreadPool Thread Count. If queue is growing = all threads are busy/blocked.</li>
<li><strong>Check connection pool metrics:</strong> Active connections at max? Timeout waiting for connection from pool?</li>
<li><strong>Take a thread dump:</strong> <code>dotnet-dump</code> → <code>threads</code> + <code>clrstack -all</code>. What are all threads doing?</li>
<li><strong>Pattern recognition from thread dump:</strong>
<ul><li>All threads blocked on <code>SqlConnection.Open()</code> → connection pool exhaustion (connection leak)</li>
<li>All threads blocked on <code>.Result</code> or <code>.Wait()</code> → sync-over-async blocking (classic .NET deadlock)</li>
<li>All threads blocked on <code>SemaphoreSlim.Wait()</code> → bottleneck at a rate limiter or shared resource</li>
<li>All threads blocked on <code>HttpClient.Send()</code> (sync!) → downstream service is slow + no timeout</li></ul></li>
<li><strong>Root cause:</strong> Most commonly: sync-over-async (<code>.Result</code> on hot path), connection leak (missing <code>using</code> statement), or missing timeout on an outbound HTTP call.</li>
</ol>
<p><strong>Why CPU/memory look normal:</strong> Blocked threads consume no CPU (they are waiting, not computing). Memory may be normal because the objects involved are small. The symptom is purely about THREAD availability — all threads are held hostage by blocking operations.</p>`
        },
        {
            id: 'pd-q5',
            level: 'senior',
            title: 'How do you debug a performance regression that only appears under production load (not reproducible in staging)?',
            answer: `<p><strong>Load-dependent issues</strong> are caused by concurrency, resource contention, or data volume that only manifests at production scale.</p>
<h4>Approach:</h4>
<ol>
<li><strong>Characterize the difference:</strong> What is different about production vs staging? Likely: traffic volume (10x), data size (100x), concurrent connections, or specific user patterns.</li>
<li><strong>Identify the specific conditions:</strong> Does the regression correlate with RPS threshold? Time of day? Specific endpoints? Data subset? This narrows the search.</li>
<li><strong>Use production-safe profiling:</strong>
<ul><li>Continuous profiler (Pyroscope/Datadog APM) — compare flame graphs between periods of good vs bad performance</li>
<li>Distributed traces — compare fast requests vs slow requests. What differs in the slow ones?</li>
<li>Database slow query log — queries that are fast with 1K rows but slow with 1M rows (missing index on growing table)</li></ul></li>
<li><strong>Common load-dependent root causes:</strong>
<ul><li>Lock contention: works fine with 10 threads, deadlocks or serializes at 200 threads</li>
<li>Connection pool exhaustion: 5 concurrent DB calls fine, 500 exceeds pool size</li>
<li>Missing index on large table: query plan changes at certain data sizes (statistics threshold)</li>
<li>GC pressure: 10 rps = manageable allocations, 1000 rps = constant gen2 GC pauses</li>
<li>Noisy neighbor: shared infrastructure (DB, cache) that is fine at low load but saturated at peak</li></ul></li>
<li><strong>If you cannot profile in production:</strong> Replay production traffic against staging at production scale using tools like GoReplay, Toxiproxy, or k6 with recorded traffic patterns.</li>
</ol>`
        },
        {
            id: 'pd-q6',
            level: 'lead',
            title: 'How do you build a culture of production debugging competence in a team where most engineers only know how to debug locally?',
            answer: `<p><strong>Production debugging is a learned skill that requires deliberate practice:</strong></p>
<h4>Skill-building program:</h4>
<ol>
<li><strong>Tool workshops (monthly):</strong> Hands-on sessions where the team uses production debugging tools on intentionally broken systems:
<ul><li>Session 1: Flame graphs — inject a CPU bottleneck, profile, find it</li>
<li>Session 2: Heap dumps — inject a memory leak, dump, trace the gcroot</li>
<li>Session 3: Distributed tracing — trace a slow request across 5 services</li>
<li>Session 4: Thread dumps — inject a deadlock, identify the cycle</li></ul></li>
<li><strong>Shadow on-call:</strong> New engineers shadow experienced debuggers during real incidents (observe methodology, not just tools).</li>
<li><strong>Incident read-throughs:</strong> Review past postmortems as a team. Walk through the investigation step-by-step: what signals were checked, what was the hypothesis, how was it confirmed?</li>
<li><strong>Game days with debugging focus:</strong> Inject a real fault and give the team 30 minutes to diagnose it. Facilitator observes methodology and provides feedback.</li>
<li><strong>Runbook-driven escalation:</strong> For common issues, write debugging runbooks that guide engineers through the investigation. They learn the methodology by following the steps.</li>
</ol>
<h4>Environment enablement:</h4>
<ul>
<li>Ensure production debugging tools are INSTALLED and ACCESSIBLE (dotnet-dump, profilers, trace access)</li>
<li>Create practice environments with realistic data/load where engineers can safely experiment</li>
<li>Pair junior engineers with senior on real incidents (co-pilot model, not just escalation)</li>
</ul>
<p><strong>Key insight:</strong> You cannot learn production debugging from books — only from practice on real (or realistic) systems under stress. Create safe opportunities to practice BEFORE the 3 AM incident.</p>`
        },
        {
            id: 'pd-q7',
            level: 'architect',
            title: 'How do you design systems to be debuggable in production? What architectural choices support production investigation?',
            answer: `<p><strong>Debuggability is an architectural quality attribute</strong> that must be designed in, not bolted on after the first incident.</p>
<h4>Design choices that enable production debugging:</h4>
<ol>
<li><strong>Structured, correlated logging:</strong> Every log has trace_id, service, user_id, request_id. You can reconstruct any request's journey across all services.</li>
<li><strong>Request-level tracing:</strong> OpenTelemetry spans on every service boundary AND every significant internal operation (DB queries, cache lookups, business logic). Without this, distributed debugging is impossible.</li>
<li><strong>Health and diagnostic endpoints:</strong>
<ul><li>/health/live, /health/ready (Kubernetes probes)</li>
<li>/debug/metrics (Prometheus scrape)</li>
<li>/debug/threads (thread dump on demand)</li>
<li>/debug/config (current runtime configuration, sanitized)</li></ul></li>
<li><strong>Feature flags for debugging:</strong> Ability to enable verbose logging for a specific user/request/percentage without redeploying. "Debug mode for user X only."</li>
<li><strong>Immutable deployments + deploy markers:</strong> Know exactly what code is running (commit SHA in /version endpoint) and mark deploys on dashboards for correlation.</li>
<li><strong>Replay-friendly architecture:</strong> If requests are logged (or events are in Kafka), you can replay traffic against a debug instance to reproduce production conditions.</li>
<li><strong>Separated concerns:</strong> When Service A's logic is cleanly separated from Service B's, you can reason about failure in isolation. Monolithic entanglement makes every investigation touch everything.</li>
</ol>
<p><strong>Anti-patterns that make debugging hard:</strong></p>
<ul>
<li>Unstructured log messages (grep-only, no correlation)</li>
<li>No distributed tracing (request enters, you lose visibility at the first service boundary)</li>
<li>Mutable deployments (you are not sure what code is actually running)</li>
<li>Shared mutable state (impossible to reason about which request caused which state change)</li>
</ul>`
        },
        {
            id: 'pd-q8',
            level: 'junior',
            title: 'What is the difference between debugging in development and debugging in production? Why can you not just attach a debugger?',
            answer: `<p><strong>Development debugging:</strong> You control the environment. You can set breakpoints, step through code line by line, inspect variables, modify state, and reproduce the issue at will. The only user affected is you.</p>
<p><strong>Production debugging:</strong> The system is serving real users. You CANNOT:</p>
<ul>
<li><strong>Attach a breakpoint:</strong> Pausing execution stops the process for ALL users, not just you. A breakpoint on a 1000-rps service causes 1000 requests to time out per second.</li>
<li><strong>Add console.log and redeploy:</strong> Redeploying takes minutes and adds risk. The issue might be intermittent and disappear on restart.</li>
<li><strong>Reproduce locally:</strong> The bug may depend on production data (1M rows vs your 10 test rows), production load (1000 concurrent users), network conditions, or race conditions that only occur under concurrency.</li>
</ul>
<p><strong>Instead, you use:</strong></p>
<ul>
<li><strong>Observability signals:</strong> Logs, metrics, and distributed traces that were already being collected</li>
<li><strong>Sampling profilers:</strong> Tools that peek at the call stack periodically without pausing execution (flame graphs)</li>
<li><strong>Heap/thread dumps:</strong> Snapshots of memory or thread state at a point in time (brief pause, not a breakpoint)</li>
<li><strong>Hypothesis-driven investigation:</strong> Form a theory, predict what evidence would confirm it, check the existing signals</li>
</ul>
<p><strong>Key mindset shift:</strong> In development, you CONTROL the system. In production, you OBSERVE the system. The quality of your observation infrastructure determines how fast you can diagnose issues.</p>`
        }
    ]
});
