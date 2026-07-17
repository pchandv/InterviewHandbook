/* Level 13 - Cloud-Native: Helm Charts */
'use strict';
PageData.register('helm', {
    "title": "Helm Charts",
    "description": "Charts, templates, values, dependencies, releases, upgrades, rollbacks",
    "level": 13,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Helm is the package manager for Kubernetes. Charts bundle K8s manifests with templating, making deployments repeatable, versioned, and configurable per environment.</p>"
        },
        {
            "title": "Chart Structure",
            "content": "<p>Chart.yaml (metadata), values.yaml (defaults), templates/ (K8s manifests with Go templates), charts/ (dependencies). Repositories host packaged charts.</p>",
            "code": "my-chart/\n Chart.yaml\n values.yaml\n templates/\n deployment.yaml\n service.yaml\n ingress.yaml\n _helpers.tpl\n charts/ # dependencies",
            "language": "text"
        },
        {
            "title": "Templates and Values",
            "content": "<p>Go template syntax with Helm functions. Values override defaults per environment. Built-in objects: .Release, .Values, .Chart, .Capabilities.</p>",
            "code": "# templates/deployment.yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n name: {{ .Release.Name }}\nspec:\n replicas: {{ .Values.replicas }}\n template:\n spec:\n containers:\n - name: app\n image: {{ .Values.image.repo }}:{{ .Values.image.tag }}",
            "language": "yaml"
        },
        {
            "title": "Release Management",
            "content": "<p>helm install (create release), helm upgrade (update), helm rollback (revert), helm uninstall (delete). Release history enables instant rollbacks.</p>",
            "mermaid": "graph LR\n A[helm install] --> B[Release v1]\n C[helm upgrade] --> D[Release v2]\n E[helm rollback 1] --> F[Release v3 = v1 config]"
        },
        {
            "title": "Dependencies",
            "content": "<p>Chart.yaml dependencies section. helm dependency update pulls sub-charts. Condition/tags for optional dependencies per environment.</p>"
        },
        {
            "title": "Best Practices",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Helm Patterns",
                "text": "<ul><li>Pin chart versions in CD</li><li>Use values files per env</li><li>Lint: helm lint</li><li>Test: helm test</li><li>Keep templates simple</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>Chart vs raw manifests tradeoffs</li><li>Values override hierarchy</li><li>Rollback mechanics</li><li>Chart testing strategies</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "What is Helm?",
            "answer": "<p>Package manager for K8s. Charts bundle templated manifests. Install, upgrade, rollback releases.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "Values override order?",
            "answer": "<p>Chart defaults < parent chart values < -f values file < --set flags. Later overrides earlier.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "How does rollback work?",
            "answer": "<p>helm rollback release revision. Creates new revision with old config. Release history tracked. Underlying K8s resources updated.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Helm vs Kustomize?",
            "answer": "<p>Helm: templating, packaging, release management, dependencies. Kustomize: patch-based overlays, no templating, built into kubectl. Often used together.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "Chart testing strategy?",
            "answer": "<p>helm lint (syntax), helm template (render locally), helm test (in-cluster tests), ct (chart-testing tool for CI), kubeval (validate against schema).</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "Internal chart library design?",
            "answer": "<p>Library charts for shared templates, application chart template for teams, automated versioning in CI, chart museum or OCI registry, documentation and examples.</p>"
        }
    ]
});
