/* Level 13 - Cloud-Native: Cloud Observability */
'use strict';
PageData.register('cloud-observability', {
    "title": "Cloud Observability",
    "description": "Prometheus, Grafana, Loki, Jaeger, OpenTelemetry, distributed tracing, alerting",
    "level": 13,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Observability means understanding system state from external outputs: metrics, logs, traces. Essential for debugging distributed systems.</p>"
        },
        {
            "title": "Three Pillars",
            "content": "<p><strong>Metrics</strong>: numeric measurements over time (Prometheus). <strong>Logs</strong>: discrete events (Loki, ELK). <strong>Traces</strong>: request flow across services (Jaeger). Correlate all three for rapid root cause analysis.</p>",
            "mermaid": "graph TD\n App[Application] --> M[Metrics]\n App --> L[Logs]\n App --> T[Traces]\n M --> Prometheus\n L --> Loki\n T --> Jaeger\n Prometheus --> Grafana\n Loki --> Grafana\n Jaeger --> Grafana"
        },
        {
            "title": "Prometheus and PromQL",
            "content": "<p>Pull-based metrics. PromQL for querying. Service discovery. Recording rules. Alert rules trigger Alertmanager. Key metrics: rate, histogram_quantile, increase.</p>"
        },
        {
            "title": "OpenTelemetry",
            "content": "<p>Vendor-neutral instrumentation standard. SDKs for all languages. Collectors for processing and routing. Single standard replaces vendor-specific agents.</p>"
        },
        {
            "title": "Distributed Tracing",
            "content": "<p>Follow requests across services. Spans = operations. Trace = tree of spans. Context via W3C headers. Identifies latency bottlenecks.</p>",
            "mermaid": "graph LR\n A[Gateway 50ms] --> B[Auth 10ms]\n A --> C[Product 200ms]\n C --> D[DB 150ms]\n C --> E[Cache 5ms]"
        },
        {
            "title": "Alerting",
            "content": "<p>Alert on symptoms not causes. SLO-based: error budget burn rate. Runbooks per alert. Reduce noise: group, deduplicate, escalate by severity.</p>"
        },
        {
            "title": "Best Practices",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Patterns",
                "text": "<ul><li>Structured JSON logging</li><li>Correlation IDs</li><li>RED method (Rate, Errors, Duration)</li><li>USE method (Utilization, Saturation, Errors)</li><li>SLI/SLO dashboards</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>Metrics vs logs vs traces use cases</li><li>SLI/SLO/SLA</li><li>Alert fatigue</li><li>Tracing for debugging</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "Three pillars?",
            "answer": "<p>Metrics (numbers over time), Logs (events), Traces (request paths). Together = full observability.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "Pull vs push metrics?",
            "answer": "<p>Pull (Prometheus): scrapes targets. Push: apps send to collector. Pull simpler with service discovery.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "What is distributed tracing?",
            "answer": "<p>Following a request across services via spans. Shows per-service latency, identifies bottlenecks.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "SLO-based alerting?",
            "answer": "<p>Alert on budget burn rate. Fast burn = page. Slow burn = ticket. Focuses on user impact not internal errors.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "OpenTelemetry value?",
            "answer": "<p>Vendor-neutral standard. Switch backends without re-instrumenting. Single collector pipeline for all signals.</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "Platform design?",
            "answer": "<p>OTel SDKs, Collector, Prometheus metrics, Loki logs, Tempo traces, Grafana dashboards. Correlation via trace-id.</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "Scale challenges?",
            "answer": "<p>Cardinality explosion, storage costs, trace sampling, multi-tenant isolation, retention policies, cost per team.</p>"
        }
    ]
});
