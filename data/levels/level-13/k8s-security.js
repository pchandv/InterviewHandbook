/* Level 13 - Cloud-Native: Kubernetes Security */
'use strict';
PageData.register('k8s-security', {
    "title": "Kubernetes Security",
    "description": "RBAC, namespaces, service accounts, pod security, network policies",
    "level": 13,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>K8s security follows the 4C model: Cloud, Cluster, Container, Code. Master RBAC, namespaces, NetworkPolicies, Pod Security Standards, and admission controllers for defense in depth.</p>"
        },
        {
            "title": "RBAC",
            "content": "<p>Role (namespace permissions), ClusterRole (cluster-wide), RoleBinding, ClusterRoleBinding. Subjects: Users, Groups, ServiceAccounts. Always follow least privilege.</p>",
            "code": "apiVersion: rbac.authorization.k8s.io/v1\nkind: Role\nmetadata:\n namespace: prod\n name: pod-reader\nrules:\n- apiGroups: [api-core]\n resources: [pods]\n verbs: [get, list, watch]",
            "language": "yaml"
        },
        {
            "title": "Namespaces",
            "content": "<p>Logical isolation, RBAC boundaries, ResourceQuota enforcement. Separate by team and environment. Apply LimitRanges for default container resources.</p>"
        },
        {
            "title": "Service Accounts",
            "content": "<p>Pod identity. Never use default SA. Disable auto-mount when not needed. Use projected tokens (short-lived, audience-bound). Minimum RBAC per SA.</p>"
        },
        {
            "title": "Pod Security Standards",
            "content": "<p>Three levels replacing PodSecurityPolicies: Privileged (unrestricted), Baseline (prevent known escalations), Restricted (hardened). Enforce via Pod Security Admission labels on namespaces.</p>",
            "mermaid": "graph TD\n A[Pod Security Standards] --> B[Privileged]\n A --> C[Baseline]\n A --> D[Restricted]\n D --> D1[Non-root]\n D --> D2[Read-only FS]\n D --> D3[Drop ALL caps]"
        },
        {
            "title": "Network Policies",
            "content": "<p>Control pod-to-pod traffic. Default: all allowed. Once policy selects a pod, only matching traffic passes (whitelist). Requires compatible CNI (Calico, Cilium).</p>",
            "code": "apiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n name: api-policy\nspec:\n podSelector:\n matchLabels: {app: api}\n policyTypes: [Ingress, Egress]\n ingress:\n - from:\n - podSelector:\n matchLabels: {app: frontend}\n ports: [{protocol: TCP, port: 8080}]",
            "language": "yaml",
            "mermaid": "graph LR\n FE[Frontend] -->|8080 allowed| API[API]\n API -->|5432 allowed| DB[Database]\n EXT[External] -.->|DENIED| API"
        },
        {
            "title": "Admission Controllers",
            "content": "<p>Intercept API requests after auth. Validating (accept/reject) and Mutating (modify). Tools: OPA Gatekeeper, Kyverno for policy enforcement.</p>"
        },
        {
            "title": "Common Mistakes",
            "content": "",
            "callout": {
                "type": "warning",
                "title": "Security Anti-Patterns",
                "text": "<ul><li>Running as root</li><li>Default ServiceAccount</li><li>No NetworkPolicies</li><li>Secrets in env vars</li><li>Wildcard RBAC verbs</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Key Areas",
                "text": "<ul><li>Design RBAC for multi-team cluster</li><li>Prevent lateral movement</li><li>Least privilege in K8s</li><li>Secure secrets beyond base64</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "What is RBAC?",
            "answer": "<p>Role-Based Access Control. Roles define permissions, Bindings grant them to subjects (users, groups, service accounts).</p>"
        },
        {
            "id": "q2",
            "level": "junior",
            "title": "What are namespaces for?",
            "answer": "<p>Logical isolation, RBAC scope, resource quotas, network policy boundaries.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "How do NetworkPolicies work?",
            "answer": "<p>Default all-allowed. Policy selects pods and defines whitelist rules. Requires compatible CNI.</p>"
        },
        {
            "id": "q4",
            "level": "mid",
            "title": "Pod Security Standards levels?",
            "answer": "<p>Privileged (no restrictions), Baseline (prevent escalations), Restricted (hardened, non-root, read-only).</p>"
        },
        {
            "id": "q5",
            "level": "mid",
            "title": "Why avoid default ServiceAccount?",
            "answer": "<p>May have broad permissions. Create dedicated SAs with minimum RBAC, disable auto-mount when not needed.</p>"
        },
        {
            "id": "q6",
            "level": "senior",
            "title": "Design RBAC for multi-team platform.",
            "answer": "<p>Per-team namespaces, team-specific Roles, read-only ClusterRole, CI/CD SA with deploy-only. Platform team gets cluster-admin.</p>"
        },
        {
            "id": "q7",
            "level": "senior",
            "title": "Zero-trust networking in K8s?",
            "answer": "<p>Default-deny policies, explicit allow per path, mTLS via service mesh, egress restrictions, DNS policies.</p>"
        },
        {
            "id": "q8",
            "level": "lead",
            "title": "Security for regulated platform?",
            "answer": "<p>Restricted PSS, private registry with scanning, network segmentation, external vault, RBAC audit, runtime security (Falco), CIS benchmarks.</p>"
        },
        {
            "id": "q9",
            "level": "architect",
            "title": "Secure the control plane?",
            "answer": "<p>Private API endpoint, etcd encryption+mTLS, audit logging, OIDC for humans, admission webhooks, network isolation, credential rotation.</p>"
        }
    ]
});
