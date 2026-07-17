/* Level 13 - Cloud-Native: Service Mesh */
'use strict';
PageData.register('service-mesh', {
    "title": "Service Mesh",
    "description": "Istio, Linkerd, sidecars, traffic management, mTLS, observability",
    "level": 13,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>A service mesh provides infrastructure-layer networking for microservices: traffic management, security (mTLS), observability, and resilience - without changing application code. Implemented via sidecar proxies.</p>"
        },
        {
            "title": "Architecture",
            "content": "<p><strong>Data plane</strong>: sidecar proxies (Envoy) alongside each pod, intercepting all traffic. <strong>Control plane</strong>: manages proxy configuration, certificates, policies. All service-to-service traffic flows through proxies.</p>",
            "mermaid": "graph TD\n subgraph Control Plane\n CP[Istiod / Linkerd Control]\n end\n subgraph Data Plane\n A[Service A + Sidecar] <-->|mTLS| B[Service B + Sidecar]\n B <-->|mTLS| C[Service C + Sidecar]\n end\n CP --> A\n CP --> B\n CP --> C"
        },
        {
            "title": "Traffic Management",
            "content": "<p>Canary deployments, A/B testing, traffic splitting, circuit breaking, retries, timeouts, fault injection - all configured declaratively without code changes.</p>",
            "code": "# Istio traffic split\napiVersion: networking.istio.io/v1beta1\nkind: VirtualService\nmetadata:\n name: my-service\nspec:\n hosts: [my-service]\n http:\n - route:\n - destination:\n host: my-service\n subset: v1\n weight: 90\n - destination:\n host: my-service\n subset: v2\n weight: 10",
            "language": "yaml"
        },
        {
            "title": "mTLS and Security",
            "content": "<p>Automatic mutual TLS between all services. Zero-trust networking without code changes. Certificate rotation handled by control plane. Authorization policies for fine-grained access control.</p>"
        },
        {
            "title": "Observability",
            "content": "<p>Automatic metrics (latency, throughput, errors), distributed tracing (without code instrumentation), service topology visualization. Works with Prometheus, Grafana, Jaeger.</p>",
            "mermaid": "graph LR\n Mesh[Service Mesh] --> Metrics[Prometheus]\n Mesh --> Traces[Jaeger]\n Mesh --> Logs[Access Logs]\n Metrics --> Grafana[Dashboards]\n Traces --> Grafana"
        },
        {
            "title": "Istio vs Linkerd",
            "content": "<p>Istio: feature-rich, complex, Envoy-based. Linkerd: lightweight, simpler, Rust proxy. Both provide mTLS, observability, traffic management. Linkerd easier to operate; Istio more configurable.</p>",
            "table": {
                "headers": [
                    "Feature",
                    "Istio",
                    "Linkerd"
                ],
                "rows": [
                    [
                        "Proxy",
                        "Envoy (C++)",
                        "linkerd2-proxy (Rust)"
                    ],
                    [
                        "Complexity",
                        "High",
                        "Low"
                    ],
                    [
                        "Resource usage",
                        "Higher",
                        "Lower"
                    ],
                    [
                        "Features",
                        "Very rich",
                        "Essential"
                    ],
                    [
                        "Learning curve",
                        "Steep",
                        "Gentle"
                    ]
                ]
            }
        },
        {
            "title": "When to Use",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Decision Criteria",
                "text": "<ul><li>10+ microservices communicating</li><li>Need mTLS without code changes</li><li>Canary/traffic splitting requirements</li><li>Observability gaps between services</li><li>NOT for monoliths or few services (overhead not justified)</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>Sidecar pattern and tradeoffs</li><li>mTLS without code changes</li><li>When mesh is overkill</li><li>Performance overhead</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "What is a service mesh?",
            "answer": "<p>Infrastructure layer for service-to-service networking. Provides mTLS, observability, traffic management via sidecar proxies without code changes.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "How does the sidecar pattern work?",
            "answer": "<p>Proxy container injected alongside app container in same pod. Intercepts all inbound/outbound traffic. App unaware of mesh.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "mTLS in service mesh?",
            "answer": "<p>Automatic mutual TLS between all services. Control plane manages certificates and rotation. Zero-trust without application changes.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Istio vs Linkerd tradeoffs?",
            "answer": "<p>Istio: more features, Envoy proxy, complex. Linkerd: lightweight Rust proxy, simpler ops, lower resources. Choose based on feature needs vs operational simplicity.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "Service mesh performance overhead?",
            "answer": "<p>Added latency per hop (1-5ms typical), memory per sidecar (50-100MB). Mitigate: tune proxy resources, use protocol detection, consider eBPF-based (Cilium) for lower overhead.</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "When NOT to use service mesh?",
            "answer": "<p>Few services (under 5-10), monolith, simple request patterns, team cant absorb operational complexity, latency-critical paths where 1ms matters.</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "Mesh architecture for large platform?",
            "answer": "<p>Multi-cluster mesh, namespace-level policies, progressive rollout (mesh per namespace), performance budgets, dedicated mesh team, clear ownership model.</p>"
        }
    ]
});
