/* Level 13 - Cloud-Native: GitOps */
'use strict';
PageData.register('gitops', {
    "title": "GitOps",
    "description": "GitOps principles, ArgoCD, Flux, declarative deployments, drift detection, reconciliation",
    "level": 13,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>GitOps uses Git as the single source of truth for infrastructure and application config. Changes via pull requests, automated sync to clusters, drift detection and self-healing.</p>"
        },
        {
            "title": "GitOps Principles",
            "content": "<p>(1) Declarative: entire system described in Git. (2) Versioned: Git history = audit trail. (3) Automated: approved changes auto-applied. (4) Self-healing: drift detected and corrected.</p>",
            "mermaid": "graph LR\n Dev[Developer] --> PR[Pull Request]\n PR --> Git[Git Repo]\n Git --> Agent[GitOps Agent]\n Agent --> Cluster[K8s Cluster]\n Cluster --> Agent\n Note over Agent: Reconciliation Loop"
        },
        {
            "title": "ArgoCD",
            "content": "<p>Declarative GitOps for Kubernetes. Application CRD points to Git repo + path. Auto-sync or manual. Health status tracking. Multi-cluster support. Web UI for visualization.</p>",
            "code": "apiVersion: argoproj.io/v1alpha1\nkind: Application\nmetadata:\n name: my-app\nspec:\n project: default\n source:\n repoURL: https://github.com/org/k8s-manifests\n path: apps/my-app/production\n targetRevision: main\n destination:\n server: https://kubernetes.default.svc\n namespace: production\n syncPolicy:\n automated:\n prune: true\n selfHeal: true",
            "language": "yaml"
        },
        {
            "title": "Flux",
            "content": "<p>CNCF GitOps toolkit. Source controllers (Git, Helm, OCI), Kustomization controller, notification controller. Lightweight, composable, multi-tenancy native.</p>"
        },
        {
            "title": "Drift Detection",
            "content": "<p>GitOps agents continuously compare desired state (Git) with actual state (cluster). Any manual change (kubectl apply, console edit) is detected and reverted or flagged.</p>"
        },
        {
            "title": "Best Practices",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "GitOps Patterns",
                "text": "<ul><li>Separate app code repo from config repo</li><li>Environment promotion via PR</li><li>Sealed Secrets for sensitive data</li><li>Progressive delivery with Flagger</li><li>Multi-cluster with ApplicationSets</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>Push vs pull-based deployment</li><li>Drift handling strategies</li><li>Secret management in GitOps</li><li>Multi-env promotion flow</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "What is GitOps?",
            "answer": "<p>Using Git as single source of truth for infrastructure. Changes via PRs, automated sync to clusters, drift auto-corrected.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "Push vs pull-based CD?",
            "answer": "<p>Push: CI pipeline deploys to cluster (kubectl apply). Pull: GitOps agent in cluster pulls from Git. Pull is more secure (no cluster credentials in CI).</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "How does ArgoCD detect drift?",
            "answer": "<p>Continuous reconciliation loop compares desired (Git) vs actual (cluster). Differences shown in UI/API. Auto-sync reverts drift if enabled.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Secrets in GitOps?",
            "answer": "<p>Sealed Secrets (encrypted in Git), external-secrets-operator (sync from vault), SOPS (encrypted YAML). Never plain secrets in Git repo.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "Multi-environment promotion?",
            "answer": "<p>PR-based: change dev values, promote to staging via PR, promote to prod via PR. Each env = directory or branch. Automated testing gates.</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "GitOps for multi-cluster platform?",
            "answer": "<p>ArgoCD ApplicationSets: template Applications across clusters. Cluster generators for dynamic registration. Hub-spoke with management cluster.</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "GitOps vs traditional CI/CD tradeoffs?",
            "answer": "<p>GitOps: better audit trail, drift correction, declarative. Tradeoffs: secret management complexity, learning curve, harder for imperative tasks (DB migrations, one-off scripts).</p>"
        }
    ]
});
