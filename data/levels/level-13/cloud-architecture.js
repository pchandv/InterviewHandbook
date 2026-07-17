/* Level 13 - Cloud-Native: Cloud Architecture Patterns */
'use strict';
PageData.register('cloud-architecture', {
    "title": "Cloud Architecture Patterns",
    "description": "Blue-green, canary, rolling updates, feature flags, zero-downtime, DR, multi-region",
    "level": 13,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Cloud architecture patterns enable reliable, scalable, and resilient systems. From deployment strategies to disaster recovery, these patterns form the playbook for production cloud operations.</p>"
        },
        {
            "title": "Deployment Patterns",
            "content": "<p>Blue-Green: two identical environments, instant cutover. Canary: gradual traffic shift with monitoring. Rolling: incremental pod replacement. Feature Flags: decouple deployment from release.</p>",
            "mermaid": "graph TD\n subgraph Blue-Green\n BG1[Blue LIVE] --> BG2[Green STANDBY]\n BG2 --> BG3[Switch]\n end\n subgraph Canary\n C1[5 pct new] --> C2[50 pct new] --> C3[100 pct new]\n end"
        },
        {
            "title": "Zero-Downtime Patterns",
            "content": "<p>Database expand-contract migrations. Backward-compatible API changes. Health-check-based traffic routing. Connection draining. Graceful shutdown handling.</p>"
        },
        {
            "title": "Disaster Recovery",
            "content": "<p>RPO (Recovery Point Objective): max data loss tolerated. RTO (Recovery Time Objective): max downtime. Strategies: backup/restore (hours), pilot light (minutes), warm standby (seconds), active-active (zero).</p>",
            "table": {
                "headers": [
                    "Strategy",
                    "RTO",
                    "RPO",
                    "Cost"
                ],
                "rows": [
                    [
                        "Backup/Restore",
                        "Hours",
                        "Hours",
                        "Low"
                    ],
                    [
                        "Pilot Light",
                        "Minutes",
                        "Seconds",
                        "Medium"
                    ],
                    [
                        "Warm Standby",
                        "Seconds",
                        "Seconds",
                        "High"
                    ],
                    [
                        "Active-Active",
                        "Zero",
                        "Zero",
                        "Very High"
                    ]
                ]
            }
        },
        {
            "title": "Multi-Region",
            "content": "<p>Global load balancing, data replication strategies (sync vs async), consistency tradeoffs (CAP theorem), latency-based routing, failover automation.</p>",
            "mermaid": "graph LR\n GLB[Global LB] --> R1[Region 1]\n GLB --> R2[Region 2]\n R1 <-->|Replication| R2\n Users1[Users US] --> GLB\n Users2[Users EU] --> GLB"
        },
        {
            "title": "Feature Flags",
            "content": "<p>Decouple deployment from release. Progressive rollout to user segments. Kill switch for instant rollback. A/B testing. Trunk-based development enabler.</p>"
        },
        {
            "title": "Resilience Patterns",
            "content": "<p>Circuit breaker, bulkhead, retry with backoff, timeout, fallback, rate limiting. Defense against cascade failures in distributed systems.</p>"
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Architecture Topics",
                "text": "<ul><li>DR strategy for given RPO/RTO</li><li>Multi-region data consistency</li><li>Feature flags vs branches</li><li>Circuit breaker implementation</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "Blue-green vs canary?",
            "answer": "<p>Blue-green: full switch between two environments. Canary: gradual traffic shift (5% then more). Canary lower risk, blue-green faster rollback.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "RPO vs RTO?",
            "answer": "<p>RPO: max acceptable data loss (point in time). RTO: max acceptable downtime (time to recover). Together define DR requirements.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "Feature flags benefits?",
            "answer": "<p>Deploy without releasing. Progressive rollout. Instant kill switch. A/B testing. Enables trunk-based dev. Separates deploy risk from release risk.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Circuit breaker pattern?",
            "answer": "<p>Three states: Closed (normal), Open (failing, fast-fail), Half-Open (testing recovery). Prevents cascade failures. Gives downstream time to recover.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "Multi-region consistency?",
            "answer": "<p>CAP theorem: choose between consistency and availability during partition. Strategies: strong consistency (sync replication, higher latency) vs eventual (async, lower latency, stale reads possible).</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "DR plan for financial platform?",
            "answer": "<p>Active-active with sync replication for transactions. RPO=0, RTO under 30s. Global LB with health checks. Automated failover. Regular DR drills. Compliance audit trail.</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "Design globally distributed system?",
            "answer": "<p>CDN for static, regional compute, data sovereignty compliance, async replication with conflict resolution, latency-based routing, partial availability design.</p>"
        }
    ]
});
