/* Level 13 - Cloud-Native: Kubernetes Production Operations */
'use strict';
PageData.register('k8s-production', {
    "title": "Kubernetes Production Operations",
    "description": "Rolling updates, rollbacks, health checks, probes, ConfigMaps, Secrets",
    "level": 13,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Production K8s requires deployment strategies for zero-downtime, health checks for traffic management, and externalized configuration. Master these patterns to run reliable workloads at scale.</p>"
        },
        {
            "title": "Rolling Updates",
            "content": "<p>Default strategy. maxSurge controls extra pods, maxUnavailable controls pods allowed down. With maxUnavailable=0, guarantees zero-downtime. Rollbacks via kubectl rollout undo use stored ReplicaSet revisions.</p>",
            "code": "apiVersion: apps/v1\nkind: Deployment\nspec:\n strategy:\n type: RollingUpdate\n rollingUpdate:\n maxSurge: 1\n maxUnavailable: 0",
            "language": "yaml",
            "mermaid": "sequenceDiagram\n participant K8s\n participant Old as v1\n participant New as v2\n K8s->>New: Create pod\n New->>K8s: Ready\n K8s->>Old: Terminate\n Note over K8s: Repeat"
        },
        {
            "title": "Health Probes",
            "content": "<p>Startup (wait for slow apps), Liveness (restart deadlocks), Readiness (gate traffic). Never share endpoints between liveness and readiness - dependency failure causes restart cascade instead of traffic pause.</p>",
            "code": "containers:\n- name: app\n startupProbe:\n httpGet: {path: /health/startup, port: 8080}\n failureThreshold: 30\n livenessProbe:\n httpGet: {path: /health/live, port: 8080}\n failureThreshold: 3\n readinessProbe:\n httpGet: {path: /health/ready, port: 8080}",
            "language": "yaml",
            "table": {
                "headers": [
                    "Probe",
                    "On Failure",
                    "Use"
                ],
                "rows": [
                    [
                        "Startup",
                        "Retry",
                        "Slow starts"
                    ],
                    [
                        "Liveness",
                        "Restart",
                        "Deadlocks"
                    ],
                    [
                        "Readiness",
                        "Remove from LB",
                        "Dependencies"
                    ]
                ]
            }
        },
        {
            "title": "ConfigMaps and Secrets",
            "content": "<p>ConfigMaps for non-sensitive config, Secrets for credentials (base64, not encrypted by default). Mount as env vars or volumes. Use external-secrets-operator for production vault integration.</p>"
        },
        {
            "title": "Deployment Strategies",
            "content": "<p>Rolling (zero-downtime, slow rollback), Blue-Green (instant rollback, 2x cost), Canary (progressive, lowest risk).</p>",
            "mermaid": "graph LR\n A[Rolling] --> B[Zero downtime]\n C[Blue-Green] --> D[Instant rollback]\n E[Canary] --> F[Progressive shift]"
        },
        {
            "title": "Pod Disruption Budgets",
            "content": "<p>Protect availability during voluntary disruptions. minAvailable or maxUnavailable constraints. Does NOT protect against involuntary failures.</p>"
        },
        {
            "title": "Graceful Shutdown",
            "content": "<p>Sequence: remove from endpoints, preStop hook, SIGTERM, grace period, SIGKILL. Add preStop sleep for endpoint propagation race.</p>"
        },
        {
            "title": "Common Mistakes",
            "content": "",
            "callout": {
                "type": "warning",
                "title": "Pitfalls",
                "text": "<ul><li>No readiness probe = 502 during deploys</li><li>Same liveness/readiness endpoint = restart cascade</li><li>No PDB = all drained at once</li><li>Secrets in Git</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Key Areas",
                "text": "<ul><li>Probes with real failure scenarios</li><li>Zero-downtime DB migrations</li><li>Pod termination lifecycle</li><li>Canary vs blue-green</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "Liveness vs readiness probes?",
            "answer": "<p>Liveness restarts dead containers. Readiness removes from traffic without restart.</p>"
        },
        {
            "id": "q2",
            "level": "junior",
            "title": "How to rollback?",
            "answer": "<p>kubectl rollout undo deployment/name. --to-revision=N for specific.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "maxSurge and maxUnavailable?",
            "answer": "<p>maxSurge=extra pods above desired. maxUnavailable=allowed down. maxUnavailable=0 ensures zero downtime.</p>"
        },
        {
            "id": "q4",
            "level": "mid",
            "title": "Why separate probe endpoints?",
            "answer": "<p>Shared endpoint with dependency check: DB down causes liveness failure and restart cascade instead of just removing from traffic.</p>"
        },
        {
            "id": "q5",
            "level": "mid",
            "title": "In-flight requests on termination?",
            "answer": "<p>Removed from endpoints, preStop runs, SIGTERM sent. App must finish requests within grace period.</p>"
        },
        {
            "id": "q6",
            "level": "senior",
            "title": "Zero-downtime DB migrations?",
            "answer": "<p>Expand-Contract: additive schema change, deploy compatible app, cleanup migration after rollout.</p>"
        },
        {
            "id": "q7",
            "level": "senior",
            "title": "PDB limitations?",
            "answer": "<p>Only voluntary disruptions. Not crashes, OOM, evictions. Need anti-affinity + replicas for HA.</p>"
        },
        {
            "id": "q8",
            "level": "senior",
            "title": "Production secrets management?",
            "answer": "<p>Encryption at rest, external-secrets-operator, Sealed Secrets, strict RBAC, audit logging.</p>"
        },
        {
            "id": "q9",
            "level": "lead",
            "title": "Canary pipeline for 99.9% SLO?",
            "answer": "<p>Flagger+Istio: 5% canary, automated metrics analysis, progressive shift with gates, auto-rollback.</p>"
        },
        {
            "id": "q10",
            "level": "architect",
            "title": "Multi-cluster failover design?",
            "answer": "<p>Active-Active regions, Global LB, GitOps ApplicationSets, DNS failover, cross-region DB replication.</p>"
        }
    ]
});
