/* Level 13 - Cloud-Native: Production Troubleshooting */
'use strict';
PageData.register('production-troubleshooting', {
    "title": "Production Troubleshooting",
    "description": "Systematic diagnosis, common issues, root cause analysis, resolution patterns, prevention",
    "level": 13,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Production troubleshooting requires systematic diagnosis under pressure. This topic covers 12+ common production issues with symptoms, root causes, diagnostic commands, resolution steps, and prevention strategies.</p>"
        },
        {
            "title": "High CPU Usage",
            "content": "<p><strong>Symptoms</strong>: Slow responses, timeouts, pod throttling. <strong>Diagnosis</strong>: top, kubectl top, profiler. <strong>Causes</strong>: infinite loops, regex backtracking, missing caching, N+1 queries. <strong>Fix</strong>: profile, optimize hot paths, add caching, fix queries.</p>"
        },
        {
            "title": "Memory Leaks",
            "content": "<p><strong>Symptoms</strong>: Growing memory, OOMKilled, degrading performance. <strong>Diagnosis</strong>: heap dumps, memory profilers, kubectl top over time. <strong>Causes</strong>: unclosed connections, growing caches without eviction, event handler accumulation. <strong>Fix</strong>: fix leak, add memory limits, implement eviction.</p>"
        },
        {
            "title": "Connection Pool Exhaustion",
            "content": "<p><strong>Symptoms</strong>: Timeouts to DB/services, connection refused. <strong>Diagnosis</strong>: pool metrics, active connections count. <strong>Causes</strong>: leaked connections, pool too small, slow queries holding connections. <strong>Fix</strong>: proper dispose/using, tune pool size, fix slow queries, add circuit breaker.</p>"
        },
        {
            "title": "Cascading Failures",
            "content": "<p><strong>Symptoms</strong>: One service down brings others down. <strong>Diagnosis</strong>: dependency map, error propagation pattern. <strong>Causes</strong>: no timeouts, no circuit breakers, synchronous dependencies, retry storms. <strong>Fix</strong>: circuit breakers, bulkheads, async, graceful degradation.</p>",
            "mermaid": "graph TD\n A[Service A fails] --> B[Service B timeout]\n B --> C[Service C queues fill]\n C --> D[Service D OOM]\n D --> E[Cascade complete]\n style A fill:#f99\n style E fill:#f99"
        },
        {
            "title": "DNS Resolution Failures",
            "content": "<p><strong>Symptoms</strong>: Random connection failures, intermittent 503s. <strong>Diagnosis</strong>: nslookup, DNS cache TTL, CoreDNS logs. <strong>Causes</strong>: CoreDNS overload, ndots:5 causing excessive lookups, DNS cache poisoning. <strong>Fix</strong>: tune ndots, add dnsPolicy, scale CoreDNS.</p>"
        },
        {
            "title": "Certificate Expiry",
            "content": "<p><strong>Symptoms</strong>: TLS handshake failures, sudden 502/503. <strong>Diagnosis</strong>: openssl check, cert-manager events. <strong>Prevention</strong>: cert-manager with auto-renewal, monitoring cert expiry dates, alerts at 30/14/7 days.</p>"
        },
        {
            "title": "Database Connection Storms",
            "content": "<p><strong>Symptoms</strong>: DB overload after deployment or restart. <strong>Cause</strong>: all pods reconnect simultaneously. <strong>Fix</strong>: connection pooling, staggered startup (random delay), exponential backoff on connect retry.</p>"
        },
        {
            "title": "Disk Pressure",
            "content": "<p><strong>Symptoms</strong>: Pod evictions, node NotReady. <strong>Diagnosis</strong>: df -h, kubectl describe node. <strong>Causes</strong>: log accumulation, container image layers, emptyDir growth. <strong>Fix</strong>: log rotation, image pruning, volume limits.</p>"
        },
        {
            "title": "Incident Response Process",
            "content": "<p>Detect, Triage, Mitigate, Root Cause, Prevent. Assign Incident Commander. Communicate status. Write blameless post-mortem with action items.</p>",
            "mermaid": "graph LR\n A[Detect] --> B[Triage]\n B --> C[Mitigate]\n C --> D[Root Cause]\n D --> E[Prevent]\n E --> F[Post-mortem]"
        },
        {
            "title": "Common Mistakes",
            "content": "",
            "callout": {
                "type": "warning",
                "title": "Troubleshooting Anti-Patterns",
                "text": "<ul><li>Fixing symptoms not root cause</li><li>No runbooks prepared</li><li>Restarting without understanding why</li><li>Not preserving evidence (logs, dumps)</li><li>Blame culture preventing honest post-mortems</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Key Areas",
                "text": "<ul><li>Systematic debugging methodology</li><li>Real incident you resolved</li><li>How to prevent recurrence</li><li>Post-mortem process</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "First steps when service is down?",
            "answer": "<p>Check: is it actually down (health endpoint)? Pod status? Recent deployments? Events? Logs? Dont change anything before understanding.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "Diagnose high latency?",
            "answer": "<p>Check: CPU throttling (top/kubectl top), DB query performance, connection pool usage, network (DNS, service mesh), recent deployments, downstream dependencies.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "What is a cascading failure?",
            "answer": "<p>One service failure propagates through dependencies. No timeouts + retries = thundering herd. Fix: circuit breakers, bulkheads, graceful degradation.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Connection pool exhaustion diagnosis?",
            "answer": "<p>Metrics: active connections at max, wait queue growing. Causes: leaked connections (missing dispose), slow queries holding connections, pool undersized for concurrency.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "Prevent cascading failures?",
            "answer": "<p>Circuit breakers (Polly/Resilience4j), bulkheads (isolate failures), timeouts on all calls, async where possible, graceful degradation (serve cached/partial data).</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "Design incident response process?",
            "answer": "<p>On-call rotation, runbooks per service, incident commander role, status page updates, severity levels, escalation policies, blameless post-mortem template, action item tracking.</p>"
        },
        {
            "id": "q7",
            "level": "lead",
            "title": "Post-mortem best practices?",
            "answer": "<p>Blameless, timeline of events, root cause (5-whys), impact quantification, action items with owners and deadlines, share learnings broadly.</p>"
        },
        {
            "id": "q8",
            "level": "architect",
            "title": "Design for failure at scale?",
            "answer": "<p>Chaos engineering (regularly inject failures), circuit breakers everywhere, graceful degradation paths, multi-region failover, automated remediation, error budgets.</p>"
        }
    ]
});
