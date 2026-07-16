/* ═══════════════════════════════════════════════════════════════════
   Production Debugging Academy — Real Incident Patterns
   CPU spikes, memory leaks, deadlocks, socket exhaustion, GC pressure,
   DNS failures, Kafka lag, and more with symptoms/investigation/fix.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('production-debugging-academy', {
    title: 'Production Debugging Academy',
    description: 'Real-world production incident patterns with symptoms, investigation steps, tools, root causes, fixes, and prevention strategies. The skills that separate senior engineers from everyone else.',
    difficulty: 'expert',
    estimatedMinutes: 55,
    prerequisites: ['production-debugging', 'incident-management'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Production debugging is the #1 differentiator for senior engineers. This section covers <strong>12 real incident patterns</strong> you will encounter (and be asked about in interviews). Each follows the same structure: Symptoms, Investigation, Tools, Root Cause, Fix, Prevention.</p>
            <p>The ability to tell a story about diagnosing a complex production issue is often what gets candidates hired at the senior/staff level.</p>`
        },
        {
            title: 'Incident 1: CPU at 100%',
            content: `<p><strong>Symptoms:</strong> All CPU cores pinned at 100%, response times spike, health checks start failing, auto-scaler spinning up instances.</p>
            <p><strong>Investigation:</strong></p>
            <ol>
                <li>Identify the process: <code>top</code> / Task Manager / <code>dotnet-counters</code></li>
                <li>Capture CPU profile: <code>dotnet-trace collect -p PID --duration 30</code></li>
                <li>Generate flame graph from trace (Speedscope, PerfView)</li>
                <li>Look for: tight loops, regex backtracking, serialization hot paths, infinite recursion</li>
            </ol>
            <p><strong>Common Root Causes:</strong></p>
            <ul>
                <li>Catastrophic regex backtracking (evil regex with nested quantifiers)</li>
                <li>Infinite loop (race condition causes retry without exit)</li>
                <li>Busy-wait / spin-lock (polling without delay)</li>
                <li>JSON serialization of massive object graphs (circular references)</li>
                <li>GC thrashing (allocating faster than collecting)</li>
            </ul>
            <p><strong>Fix:</strong> Depends on root cause. Regex → use timeout + rewrite. Loop → add break condition. Serialization → limit depth, use source generators.</p>
            <p><strong>Prevention:</strong> CPU alerts at 70%, regex timeout policy, load testing with profiling, code review for unbounded loops.</p>`
        },
        {
            title: 'Incident 2: Memory Leak',
            content: `<p><strong>Symptoms:</strong> Memory grows steadily over hours/days, never returns to baseline after GC. Eventually OOM kill or extreme GC pauses.</p>
            <p><strong>Investigation:</strong></p>
            <ol>
                <li>Confirm leak: <code>dotnet-counters monitor -p PID --counters System.Runtime</code> (watch GC Heap Size)</li>
                <li>Take heap dumps at intervals: <code>dotnet-dump collect -p PID</code></li>
                <li>Analyze: <code>dotnet-dump analyze dump.dmp</code> → <code>dumpheap -stat</code></li>
                <li>Find retention path: <code>gcroot &lt;address&gt;</code></li>
            </ol>
            <p><strong>Common Root Causes:</strong></p>
            <ul>
                <li>Event handlers not unsubscribed (publisher holds reference to subscriber)</li>
                <li>Static collections growing unbounded (cache without eviction)</li>
                <li>HttpClient created per-request (socket/DNS cache leak)</li>
                <li>Timers not disposed (Timer prevents GC of callback target)</li>
                <li>Captured closures in long-lived delegates</li>
                <li>Large Object Heap fragmentation (objects > 85KB)</li>
            </ul>`,
            code: `// Classic .NET memory leak: event handler
public class Leaky
{
    public void Subscribe(EventSource source)
    {
        // BUG: Lambda captures 'this', source holds reference forever
        source.DataReceived += (s, e) => ProcessData(e.Data);
    }
    // Fix: Use weak event pattern or explicit unsubscribe in Dispose
}

// Classic .NET leak: HttpClient per-request
public async Task<string> GetData(string url)
{
    // BUG: Creates new HttpClient (and socket) per call
    using var client = new HttpClient();
    return await client.GetStringAsync(url);
}
// Fix: Use IHttpClientFactory or static HttpClient

// Investigation commands:
// dotnet-counters monitor -p 1234 --counters System.Runtime
// dotnet-dump collect -p 1234
// dotnet-dump analyze dump.dmp
//   > dumpheap -stat          (top types by count/size)
//   > dumpheap -type MyClass  (find instances)
//   > gcroot 0x7f...          (find what holds reference)`,
            language: 'csharp'
        },
        {
            title: 'Incident 3: Deadlock',
            content: `<p><strong>Symptoms:</strong> Requests hang indefinitely (no timeout, no error). Thread pool exhaustion. Health checks pass (different thread) but user requests stuck.</p>
            <p><strong>Investigation:</strong></p>
            <ol>
                <li>Thread dump: <code>dotnet-dump collect</code> → <code>threads</code> → <code>clrstack -all</code></li>
                <li>Look for: all threads waiting on same lock, or async-over-sync (.Result/.Wait())</li>
                <li>Check for: <code>Monitor.Enter</code> in multiple orders, or <code>Task.Result</code> in ASP.NET</li>
            </ol>
            <p><strong>Common Root Causes:</strong></p>
            <ul>
                <li><strong>Async deadlock:</strong> Calling <code>.Result</code> or <code>.Wait()</code> on async code in a sync context</li>
                <li><strong>Lock ordering:</strong> Thread A holds Lock1 waiting for Lock2, Thread B holds Lock2 waiting for Lock1</li>
                <li><strong>Database deadlock:</strong> Two transactions updating same rows in different order</li>
            </ul>
            <p><strong>Fix:</strong> Async deadlock → use <code>async/await</code> all the way down. Lock ordering → establish global lock order. DB → retry with exponential backoff.</p>
            <p><strong>Prevention:</strong> Ban <code>.Result/.Wait()</code> via analyzer, use <code>SemaphoreSlim</code> instead of <code>lock</code> for async, set query timeouts.</p>`
        },
        {
            title: 'Incident 4: Socket Exhaustion',
            content: `<p><strong>Symptoms:</strong> <code>SocketException: Address already in use</code> or <code>Cannot assign requested address</code>. DNS resolution fails. Outbound HTTP calls fail intermittently.</p>
            <p><strong>Investigation:</strong></p>
            <ol>
                <li>Check socket count: <code>netstat -an | grep TIME_WAIT | wc -l</code> (thousands = leak)</li>
                <li>In .NET: <code>dotnet-counters</code> → watch <code>System.Net.Http[http11-connections-current-total]</code></li>
                <li>Look for <code>new HttpClient()</code> patterns in code</li>
            </ol>
            <p><strong>Root Cause:</strong> Creating <code>HttpClient</code> per request. Each instance creates a new TCP connection. Disposed connections enter TIME_WAIT (2 min). At high traffic, you exhaust ephemeral ports (65K limit).</p>
            <p><strong>Fix:</strong> Use <code>IHttpClientFactory</code> (manages connection pool + DNS rotation). Or use a static <code>HttpClient</code> instance.</p>
            <p><strong>Prevention:</strong> Ban <code>new HttpClient()</code> via Roslyn analyzer. Monitor socket count. Set <code>SocketsHttpHandler.PooledConnectionLifetime</code> for DNS changes.</p>`
        },
        {
            title: 'Incident 5: Thread Pool Starvation',
            content: `<p><strong>Symptoms:</strong> Requests queue up, latency increases linearly with load, CPU is LOW (threads are blocked, not working). Thread count climbs to 100s-1000s.</p>
            <p><strong>Investigation:</strong></p>
            <ol>
                <li><code>dotnet-counters</code>: ThreadPool Thread Count climbing, ThreadPool Queue Length > 0</li>
                <li>Thread dump shows most threads blocked on synchronous I/O or locks</li>
                <li>Look for: sync-over-async, blocking database calls, Thread.Sleep in request path</li>
            </ol>
            <p><strong>Root Cause:</strong> Blocking calls consume thread pool threads. .NET injects new threads slowly (1-2/sec). Under load, queue grows faster than thread injection.</p>
            <p><strong>Fix:</strong> Convert blocking calls to async. Remove <code>Thread.Sleep</code> (use <code>Task.Delay</code>). Use <code>async</code> database drivers.</p>
            <p><strong>Prevention:</strong> Alert on thread pool queue length > 0 sustained. Ban synchronous I/O in hot paths. Use <code>ThreadPoolStarvationDetector</code> in ASP.NET Core 8+.</p>`
        },
        {
            title: 'Incident 6: GC Pressure / Pauses',
            content: `<p><strong>Symptoms:</strong> Periodic latency spikes (50-500ms) every few seconds. High allocation rate. Gen2 collections frequent. P99 latency 10x higher than P50.</p>
            <p><strong>Investigation:</strong></p>
            <ol>
                <li><code>dotnet-counters</code>: Gen 0/1/2 Collection Count, Allocation Rate, GC Pause Time</li>
                <li>If Gen2 collections > 1/min AND pause > 100ms = GC pressure</li>
                <li>Profile allocations: <code>dotnet-trace</code> with GC events, or VS Diagnostic Tools</li>
                <li>Find hot allocation paths (LOH allocations, unnecessary boxing, string concatenation)</li>
            </ol>
            <p><strong>Common Root Causes:</strong></p>
            <ul>
                <li>Allocating large arrays per request (> 85KB → Large Object Heap)</li>
                <li>String concatenation in loops (use StringBuilder or string.Join)</li>
                <li>LINQ allocations in hot paths (.ToList() everywhere)</li>
                <li>Boxing value types (storing int in object/interface collections)</li>
            </ul>
            <p><strong>Fix:</strong> Use ArrayPool/ObjectPool, Span-based APIs, stackalloc for small buffers, reduce allocations in hot paths.</p>`
        },
        {
            title: 'Incident 7: DNS Failure',
            content: `<p><strong>Symptoms:</strong> Outbound HTTP calls fail with <code>NameResolutionFailure</code>. Intermittent — some hosts work, others do not. Internal service discovery breaks.</p>
            <p><strong>Investigation:</strong></p>
            <ol>
                <li>Test DNS resolution: <code>nslookup servicename</code> from the failing pod/container</li>
                <li>Check DNS server health (CoreDNS pods in K8s)</li>
                <li>Check <code>/etc/resolv.conf</code> (ndots setting in K8s causes excessive DNS queries)</li>
                <li>Look for DNS cache staleness (HttpClient caches DNS forever by default)</li>
            </ol>
            <p><strong>Root Causes:</strong> CoreDNS pod crash, DNS cache poisoning, ndots:5 causing 5 failed lookups before success, HttpClient DNS caching (never re-resolves after initial lookup).</p>
            <p><strong>Fix:</strong> Set <code>SocketsHttpHandler.PooledConnectionLifetime = TimeSpan.FromMinutes(2)</code> for DNS rotation. Scale CoreDNS. Use FQDN (trailing dot) to skip ndots search.</p>`
        },
        {
            title: 'Incident 8: Kafka Consumer Lag',
            content: `<p><strong>Symptoms:</strong> Consumer lag growing (messages queuing), processing latency increasing, downstream systems showing stale data.</p>
            <p><strong>Investigation:</strong></p>
            <ol>
                <li>Check lag: <code>kafka-consumer-groups --describe --group mygroup</code></li>
                <li>Identify which partition(s) are lagging</li>
                <li>Check consumer throughput vs producer throughput</li>
                <li>Look for: slow processing (DB calls), rebalances, poison messages</li>
            </ol>
            <p><strong>Root Causes:</strong></p>
            <ul>
                <li>Consumer processing too slow (blocking DB call per message)</li>
                <li>Frequent rebalances (consumer crashing/restarting)</li>
                <li>Poison message (deserialization failure causes infinite retry)</li>
                <li>Partition skew (one partition has 10x messages)</li>
                <li>Consumer scaled down but partition count unchanged</li>
            </ul>
            <p><strong>Fix:</strong> Add consumers (max = partition count), batch processing, async I/O, dead-letter poison messages, fix partition key distribution.</p>`
        },
        {
            title: 'Incident 9: Kubernetes CrashLoopBackOff',
            content: `<p><strong>Symptoms:</strong> Pod continuously restarting, status shows CrashLoopBackOff, exponential backoff delay grows (10s → 20s → 40s → 5min).</p>
            <p><strong>Investigation:</strong></p>
            <ol>
                <li><code>kubectl describe pod &lt;name&gt;</code> — check Events, Last State (Exit Code)</li>
                <li><code>kubectl logs &lt;name&gt; --previous</code> — logs from crashed container</li>
                <li>Exit code 137 = OOMKilled, 1 = app error, 143 = SIGTERM</li>
                <li>Check liveness probe (too aggressive probe kills healthy pods during startup)</li>
            </ol>
            <p><strong>Common Root Causes:</strong></p>
            <ul>
                <li>OOMKilled (memory limit too low for the app)</li>
                <li>App crashes on startup (missing config, bad connection string)</li>
                <li>Liveness probe fails during initialization (startup probe not configured)</li>
                <li>Dependency not ready (DB not accepting connections yet)</li>
            </ul>
            <p><strong>Fix:</strong> OOM → increase memory limit or fix leak. Startup → add startup probe with longer initialDelaySeconds. Dependency → add init container or retry logic.</p>`
        },
        {
            title: 'Incident 10: Connection Pool Exhaustion',
            content: `<p><strong>Symptoms:</strong> <code>Timeout expired. The timeout period elapsed prior to obtaining a connection from the pool.</code> Database calls fail under load.</p>
            <p><strong>Investigation:</strong></p>
            <ol>
                <li>Check active connections: SQL Server <code>sys.dm_exec_connections</code></li>
                <li>Check connection pool counters: <code>dotnet-counters</code> → <code>Microsoft.Data.SqlClient</code></li>
                <li>Look for: connections not being returned (missing using/dispose), long-running queries blocking pool</li>
            </ol>
            <p><strong>Root Causes:</strong></p>
            <ul>
                <li>Connections not disposed (missing <code>using</code> statement)</li>
                <li>Long-running queries holding connections (report queries in OLTP pool)</li>
                <li>Pool too small for burst traffic (default max = 100)</li>
                <li>Transaction scope holding connection open (distributed transaction)</li>
            </ul>
            <p><strong>Fix:</strong> Ensure all connections are in <code>using</code> blocks. Add query timeouts. Increase pool size for burst. Separate read replicas for reports.</p>`
        },
        {
            title: 'Incident 11: SSL/TLS Certificate Expiry',
            content: `<p><strong>Symptoms:</strong> All HTTPS traffic fails. Browsers show NET::ERR_CERT_DATE_INVALID. Internal services reject mutual TLS connections.</p>
            <p><strong>Investigation:</strong> Check certificate expiry: <code>openssl s_client -connect host:443 | openssl x509 -noout -dates</code></p>
            <p><strong>Root Cause:</strong> Certificate expired and auto-renewal failed (or was never configured). Let's Encrypt certs expire every 90 days.</p>
            <p><strong>Fix:</strong> Immediately: install new cert manually. Long-term: automate renewal (certbot, Azure Key Vault auto-rotation, cert-manager in K8s).</p>
            <p><strong>Prevention:</strong> Monitor cert expiry (alert 30 days before). Use cert-manager with auto-renewal. Never use certs with > 1 year validity. Track all certs in inventory.</p>`
        },
        {
            title: 'Incident 12: API Timeout Cascade',
            content: `<p><strong>Symptoms:</strong> Service A times out calling Service B. Service B times out calling Service C. All services degrade simultaneously. Classic cascading failure.</p>
            <p><strong>Investigation:</strong></p>
            <ol>
                <li>Distributed trace: find the slowest downstream service (the root cause)</li>
                <li>Check: is one service genuinely slow, or is it the network/DNS?</li>
                <li>Look for: missing timeouts (infinite wait), no circuit breaker, retry storms</li>
            </ol>
            <p><strong>Root Cause:</strong> Service C has a slow database query (table scan). Service B waits 30s (default HTTP timeout). Service A waits 30s for B. All thread pools fill up waiting.</p>
            <p><strong>Fix:</strong> Add aggressive timeouts at each hop (A→B: 5s, B→C: 3s). Add circuit breaker (Polly). Add fallback/cached response. Fix the slow query in C.</p>
            <p><strong>Prevention:</strong> Timeout budgets (each hop gets a fraction of total). Circuit breakers on all external calls. Bulkhead isolation. Graceful degradation.</p>`,
            mermaid: `sequenceDiagram
    participant A as Service A
    participant B as Service B
    participant C as Service C
    participant DB as Database

    A->>B: GET /orders (timeout: 5s)
    B->>C: GET /inventory (timeout: 3s)
    C->>DB: SELECT... (slow: table scan)
    Note over DB: 30 seconds...
    C--xB: Timeout after 3s
    B--xA: Timeout after 5s
    Note over A: Circuit breaker OPENS
    A->>A: Return cached/fallback response`
        },
        {
            title: 'Debugging Toolkit',
            content: `<p>Essential tools every senior .NET engineer should know:</p>`,
            table: {
                headers: ['Tool', 'Purpose', 'When to Use'],
                rows: [
                    ['dotnet-counters', 'Live metrics (CPU, GC, threads, allocations)', 'First response — quick health check'],
                    ['dotnet-trace', 'CPU profiling, generate trace files', 'CPU spikes, hot path identification'],
                    ['dotnet-dump', 'Heap dumps, memory analysis', 'Memory leaks, object retention analysis'],
                    ['dotnet-gcdump', 'GC-specific heap snapshot', 'GC pressure, generation analysis'],
                    ['PerfView', 'Windows trace analysis (ETW events)', 'Deep .NET performance analysis'],
                    ['Speedscope', 'Flame graph visualization (web-based)', 'Visualize CPU traces'],
                    ['Application Insights', 'Distributed tracing, metrics, logs', 'Production monitoring (Azure)'],
                    ['kubectl logs/describe', 'K8s pod diagnostics', 'Container crashes, OOM, probes'],
                    ['tcpdump / Wireshark', 'Network packet capture', 'TLS issues, DNS, connectivity'],
                    ['SQL Server Profiler / XEvents', 'Query tracing', 'Slow queries, deadlocks, blocking']
                ]
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Every incident follows: Detect → Investigate → Identify Root Cause → Fix → Prevent</li>
                <li>Tooling mastery (dotnet-counters/trace/dump) separates seniors from everyone else</li>
                <li>Most production issues are: resource exhaustion, cascading failures, or configuration errors</li>
                <li>Prevention is 10x cheaper than detection: alerts, timeouts, circuit breakers, pool limits</li>
                <li>Always tell the STORY in interviews: situation, what you tried, how you found it, what you learned</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'debug-academy-q1',
            level: 'senior',
            title: 'Walk me through how you would diagnose a memory leak in a .NET production service.',
            answer: `<p><strong>Step-by-step approach:</strong></p><ol><li><strong>Confirm the leak:</strong> <code>dotnet-counters monitor</code> — watch GC Heap Size trending upward over time without returning to baseline after Gen2 collections.</li><li><strong>Take heap dumps:</strong> Two dumps 10 minutes apart: <code>dotnet-dump collect -p PID</code></li><li><strong>Compare dumps:</strong> <code>dumpheap -stat</code> on both — find types growing in count/size between snapshots.</li><li><strong>Find retention:</strong> <code>gcroot &lt;address&gt;</code> on a suspected leaked object — shows what holds the reference.</li><li><strong>Common culprits:</strong> Event handlers not unsubscribed, static collections, HttpClient per-request, timers not disposed.</li></ol>`,
            interviewTip: 'Name specific tools (dotnet-dump, not just "profiler"). Mention taking TWO dumps and comparing — this shows real experience vs textbook knowledge.'
        },
        {
            id: 'debug-academy-q2',
            level: 'senior',
            title: 'Your API response times suddenly doubled. CPU and memory look normal. What do you investigate?',
            answer: `<p><strong>If CPU/memory are normal but latency is high, the issue is WAITING, not computing:</strong></p><ol><li><strong>Check external dependencies:</strong> Database response times, downstream API latency (distributed tracing)</li><li><strong>Thread pool:</strong> Are threads blocked? Queue length growing? (thread starvation)</li><li><strong>Connection pools:</strong> Are we waiting for DB connections? (pool exhaustion)</li><li><strong>Network:</strong> DNS resolution time, TLS handshake time, TCP connection time</li><li><strong>GC pauses:</strong> Even if heap size is stable, frequent Gen2 collections cause latency spikes</li><li><strong>Lock contention:</strong> Threads waiting on shared locks (thread dump will show)</li></ol><p><strong>Key insight:</strong> Low CPU + high latency = threads are blocked waiting. High CPU + high latency = compute-bound (different problem).</p>`
        },
        {
            id: 'debug-academy-q3',
            level: 'mid',
            title: 'What causes socket exhaustion in .NET and how do you prevent it?',
            answer: `<p><strong>Cause:</strong> Creating <code>new HttpClient()</code> per request. Each instance opens a TCP connection. When disposed, the connection enters TIME_WAIT state for 2 minutes. Under load, you exhaust the ~65K available ephemeral ports.</p><p><strong>Prevention:</strong></p><ul><li>Use <code>IHttpClientFactory</code> (manages connection pooling and DNS rotation)</li><li>Or use a static/singleton <code>HttpClient</code> with <code>PooledConnectionLifetime</code></li><li>Monitor: <code>netstat -an | grep TIME_WAIT | wc -l</code></li><li>Ban <code>new HttpClient()</code> via Roslyn analyzer in CI</li></ul>`
        },
        {
            id: 'debug-academy-q4',
            level: 'architect',
            title: 'Describe a cascading failure you have experienced and how you would design systems to prevent them.',
            answer: `<p><strong>Example cascading failure:</strong> Service C database locks up → Service C response time goes from 50ms to 30s → Service B thread pool fills waiting for C → Service B stops responding → Service A thread pool fills waiting for B → Entire platform down.</p><p><strong>Prevention architecture:</strong></p><ul><li><strong>Timeouts:</strong> Every external call has an aggressive timeout (3-5s, not 30s default)</li><li><strong>Circuit breakers:</strong> After N failures, stop calling failing service (Polly)</li><li><strong>Bulkheads:</strong> Isolate thread pools per dependency (one failing dependency cannot exhaust all threads)</li><li><strong>Fallbacks:</strong> Return cached/degraded response when dependency is down</li><li><strong>Backpressure:</strong> Reject new requests when at capacity (429) rather than queuing infinitely</li></ul>`,
            followUp: ['How do you set timeout values?', 'How do you test cascading failure scenarios?', 'What is the difference between a timeout and a deadline?']
        },
        {
            id: 'debug-academy-q5',
            level: 'mid',
            title: 'A Kubernetes pod is in CrashLoopBackOff. How do you diagnose it?',
            answer: `<p><strong>Steps:</strong></p><ol><li><code>kubectl describe pod &lt;name&gt;</code> — check Events section for error messages, check Last State for exit code</li><li><code>kubectl logs &lt;name&gt; --previous</code> — get logs from the crashed container</li><li><strong>Interpret exit codes:</strong> 137 = OOMKilled (memory limit too low), 1 = application error, 143 = SIGTERM</li><li>If OOM: increase memory limit or investigate memory leak</li><li>If app error: check for missing config (environment variables, secrets not mounted)</li><li>If liveness probe: check if probe is too aggressive (app slow to start) — add startupProbe</li></ol>`
        },
        {
            id: 'debug-academy-q6',
            level: 'lead',
            title: 'How do you build a production debugging culture in your team?',
            answer: `<p><strong>Building debugging capability:</strong></p><ul><li><strong>Observability-first:</strong> Ship with structured logging, distributed tracing, and metrics from day one</li><li><strong>Runbooks:</strong> Document investigation steps for every alert (not just "page someone")</li><li><strong>Game Days:</strong> Practice incident response monthly (inject failures intentionally)</li><li><strong>Blameless postmortems:</strong> After every incident, focus on systems not people. Publish learnings.</li><li><strong>Shadowing:</strong> Junior engineers shadow on-call rotations before going solo</li><li><strong>Tooling training:</strong> Quarterly workshops on dotnet-dump, profiling, distributed tracing</li><li><strong>Incident database:</strong> Searchable history of past incidents with root causes and fixes</li></ul>`
        },
        {
            id: 'debug-academy-q7',
            level: 'senior',
            title: 'How would you investigate a production database deadlock?',
            answer: `<p><strong>Investigation:</strong></p><ol><li>Check SQL Server deadlock graph: Extended Events or system_health session → <code>xml_deadlock_report</code></li><li>Identify the two (or more) transactions involved and which resources they locked</li><li>Determine the lock acquisition ORDER for each transaction</li><li>Find the application code that generates these queries</li></ol><p><strong>Common causes:</strong> Two stored procedures updating same tables in different order, missing indexes causing table scans (escalation to table locks), long-running transactions holding locks.</p><p><strong>Fixes:</strong> Consistent lock ordering (always access tables in same order), add missing indexes (row locks instead of table), use SNAPSHOT isolation, add <code>READCOMMITTED SNAPSHOT</code>, retry with exponential backoff in application.</p>`
        },
        {
            id: 'debug-academy-q8',
            level: 'architect',
            title: 'Design an observability strategy that enables fast production debugging.',
            answer: `<p><strong>Three pillars + correlation:</strong></p><ul><li><strong>Structured Logging:</strong> JSON logs with correlation ID, user ID, operation name, duration. Ship to ELK/Loki.</li><li><strong>Distributed Tracing:</strong> OpenTelemetry spans for every HTTP call, DB query, message publish. Export to Jaeger/Tempo.</li><li><strong>Metrics:</strong> RED method (Rate, Errors, Duration) per endpoint. USE method (Utilization, Saturation, Errors) per resource. Prometheus + Grafana.</li><li><strong>Correlation:</strong> Single trace ID flows through all services (W3C TraceContext). Click from alert → trace → logs.</li></ul><p><strong>The 5-minute rule:</strong> From alert to root cause should take less than 5 minutes with good observability. If it takes longer, your observability has gaps.</p>`,
            bestPractices: ['Every log line must have a correlation/trace ID', 'Dashboards for every service showing RED metrics', 'Alert on symptoms (latency, errors) not causes (CPU)', 'Record span events for key business decisions (not just HTTP calls)']
        }
    ]
});
