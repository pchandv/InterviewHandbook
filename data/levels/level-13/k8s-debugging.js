/* Level 13 - Cloud-Native: Kubernetes Debugging */
'use strict';
PageData.register('k8s-debugging', {
    "title": "Kubernetes Debugging",
    "description": "CrashLoopBackOff, ImagePullBackOff, Pending pods, OOMKilled, DNS failures, diagnostic commands",
    "level": 13,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Debugging K8s requires systematic diagnosis of pod states, events, logs, and resource conditions. This topic covers the most common failure modes and the diagnostic commands to resolve them.</p>"
        },
        {
            "title": "CrashLoopBackOff",
            "content": "<p>Container starts then crashes repeatedly. K8s backs off restart interval exponentially. Causes: app crash on startup, missing config/secrets, wrong command, port conflicts, dependency unavailable.</p>",
            "code": "# Diagnose CrashLoopBackOff\nkubectl describe pod <name>\nkubectl logs <pod> --previous\nkubectl get events --sort-by=.lastTimestamp\n\n# Common fixes:\n# - Check logs for startup errors\n# - Verify ConfigMaps/Secrets exist\n# - Check resource limits (OOMKilled)\n# - Validate container command/args",
            "language": "bash"
        },
        {
            "title": "ImagePullBackOff",
            "content": "<p>Cannot pull container image. Causes: wrong image name/tag, private registry without imagePullSecret, network issues, rate limiting (Docker Hub).</p>",
            "code": "# Diagnose\nkubectl describe pod <name> | grep -A5 Events\n\n# Fixes:\n# - Verify image exists: docker pull <image>\n# - Add imagePullSecrets to pod/SA\n# - Check registry credentials\n# - Use specific tags not :latest",
            "language": "bash"
        },
        {
            "title": "Pending Pods",
            "content": "<p>Pod cannot be scheduled. Causes: insufficient resources, node affinity/taint mismatch, PVC not bound, no nodes available.</p>",
            "code": "# Diagnose Pending\nkubectl describe pod <name> # Check Events section\nkubectl get nodes -o wide\nkubectl describe nodes | grep -A5 Allocatable\nkubectl get pvc # Check Bound status",
            "language": "bash"
        },
        {
            "title": "OOMKilled",
            "content": "<p>Container exceeded memory limit. Exit code 137. Fix: increase limits, fix memory leaks, tune JVM heap, profile memory usage.</p>",
            "code": "# Diagnose OOMKilled\nkubectl describe pod <name> | grep -i oom\nkubectl top pod <name>\n\n# Fix: increase memory limit\nresources:\n requests:\n memory: 512Mi\n limits:\n memory: 1Gi",
            "language": "yaml"
        },
        {
            "title": "DNS Failures",
            "content": "<p>Service discovery broken. Pod cannot resolve service names. Check CoreDNS pods, DNS policy, /etc/resolv.conf inside pod.</p>",
            "code": "# Test DNS from inside pod\nkubectl exec -it <pod> -- nslookup kubernetes\nkubectl exec -it <pod> -- cat /etc/resolv.conf\n\n# Check CoreDNS\nkubectl get pods -n kube-system -l k8s-app=kube-dns\nkubectl logs -n kube-system -l k8s-app=kube-dns",
            "language": "bash",
            "mermaid": "graph TD\n Pod[Pod DNS Query] --> CoreDNS\n CoreDNS --> SvcRecord[service.namespace.svc.cluster.local]\n CoreDNS --> Upstream[Upstream DNS]\n SvcRecord --> ClusterIP[Service ClusterIP]"
        },
        {
            "title": "Diagnostic Commands Cheatsheet",
            "content": "<p>Essential kubectl commands for debugging any K8s issue.</p>",
            "code": "# Pod diagnostics\nkubectl get pods -o wide\nkubectl describe pod <name>\nkubectl logs <pod> -c <container> --previous\nkubectl exec -it <pod> -- /bin/sh\n\n# Cluster state\nkubectl get events --sort-by=.lastTimestamp\nkubectl top nodes\nkubectl top pods\nkubectl get componentstatuses\n\n# Network debugging\nkubectl run debug --image=busybox -it --rm -- sh\nkubectl port-forward svc/<name> 8080:80",
            "language": "bash",
            "mermaid": "graph TD\n A[Pod Issue] --> B{What state?}\n B -->|Pending| C[Check scheduling]\n B -->|CrashLoop| D[Check logs]\n B -->|ImagePull| E[Check registry]\n B -->|Running but errors| F[Check readiness]\n C --> C1[Resources? Affinity? PVC?]\n D --> D1[App error? Config? OOM?]\n E --> E1[Image name? Secret? Network?]"
        },
        {
            "title": "Common Mistakes",
            "content": "",
            "callout": {
                "type": "warning",
                "title": "Debugging Anti-Patterns",
                "text": "<ul><li>Deleting and recreating instead of diagnosing</li><li>Not checking events (kubectl describe)</li><li>Ignoring resource limits</li><li>Not using --previous for crash logs</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "What They Ask",
                "text": "<ul><li>Walk through debugging a CrashLoopBackOff</li><li>Pod stuck Pending - what do you check?</li><li>Service not reachable - diagnosis steps</li><li>OOMKilled prevention strategies</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "What is CrashLoopBackOff?",
            "answer": "<p>Container crashes repeatedly. K8s restarts with exponential backoff. Check logs --previous for crash reason.</p>"
        },
        {
            "id": "q2",
            "level": "junior",
            "title": "How to view pod logs?",
            "answer": "<p>kubectl logs pod-name. Add -c container for multi-container. Add --previous for crashed container logs.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "Pod stuck Pending - diagnosis?",
            "answer": "<p>kubectl describe pod: check Events. Common: insufficient CPU/memory, unbound PVC, node affinity mismatch, taints without tolerations.</p>"
        },
        {
            "id": "q4",
            "level": "mid",
            "title": "Exit code 137 meaning?",
            "answer": "<p>OOMKilled - container exceeded memory limit. Fix: increase limits, fix leaks, tune GC/heap, profile usage with kubectl top.</p>"
        },
        {
            "id": "q5",
            "level": "mid",
            "title": "Debug DNS resolution failure?",
            "answer": "<p>kubectl exec into pod, run nslookup. Check CoreDNS pods running, check /etc/resolv.conf, verify service exists in correct namespace.</p>"
        },
        {
            "id": "q6",
            "level": "senior",
            "title": "Service reachable internally but not externally?",
            "answer": "<p>Check: Service type (ClusterIP vs NodePort/LB), Ingress rules and controller, NetworkPolicies blocking, target port matching container port, endpoints populated.</p>"
        },
        {
            "id": "q7",
            "level": "senior",
            "title": "Intermittent 503 errors - systematic approach?",
            "answer": "<p>Check pod restarts (liveness killing), readiness probe failures, resource exhaustion (CPU throttle), HPA scaling lag, connection pool exhaustion.</p>"
        },
        {
            "id": "q8",
            "level": "lead",
            "title": "Design observability for debugging at scale?",
            "answer": "<p>Structured logging (JSON), distributed tracing (Jaeger/Tempo), metrics (Prometheus), dashboards (Grafana), alerting, log aggregation (Loki/ELK). Correlate via request-id.</p>"
        },
        {
            "id": "q9",
            "level": "architect",
            "title": "Post-mortem process for K8s incidents?",
            "answer": "<p>Timeline reconstruction via events+logs, identify blast radius, root cause (5-whys), action items (prevent recurrence), update runbooks, chaos test the fix.</p>"
        }
    ]
});
