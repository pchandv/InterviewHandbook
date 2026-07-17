/* Level 13 - Cloud-Native: CI/CD Pipelines */
'use strict';
PageData.register('cicd-pipelines', {
    "title": "CI/CD Pipelines",
    "description": "GitHub Actions, Azure DevOps, GitLab CI, build and release pipelines, secrets, artifacts",
    "level": 13,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>CI/CD automates the path from code commit to production deployment. CI (Continuous Integration) builds and tests every change. CD (Continuous Delivery/Deployment) automates release to environments.</p>"
        },
        {
            "title": "Pipeline Concepts",
            "content": "<p><strong>Triggers</strong>: push, PR, schedule, manual. <strong>Stages</strong>: build, test, deploy. <strong>Jobs</strong>: units of work in a stage. <strong>Artifacts</strong>: outputs passed between stages. <strong>Environments</strong>: deployment targets with approvals.</p>",
            "mermaid": "graph LR\n A[Commit] --> B[Build]\n B --> C[Unit Tests]\n C --> D[Integration Tests]\n D --> E[Artifact]\n E --> F[Deploy Staging]\n F --> G[Approval]\n G --> H[Deploy Prod]"
        },
        {
            "title": "GitHub Actions",
            "content": "<p>Workflow YAML in .github/workflows/. Jobs run on runners (hosted or self-hosted). Matrix builds for multi-version testing. Reusable workflows and composite actions.</p>",
            "code": "name: CI\non: [push, pull_request]\njobs:\n build:\n runs-on: ubuntu-latest\n steps:\n - uses: actions/checkout@v4\n - uses: actions/setup-dotnet@v4\n with:\n dotnet-version: 8.0.x\n - run: dotnet build\n - run: dotnet test",
            "language": "yaml"
        },
        {
            "title": "Azure DevOps Pipelines",
            "content": "<p>YAML pipelines with stages, jobs, tasks. Variable groups for secrets. Environments with approval gates. Service connections for deployment targets.</p>"
        },
        {
            "title": "GitLab CI",
            "content": "<p>.gitlab-ci.yml with stages, jobs, rules. Built-in container registry. Environment tracking. Review apps for PRs.</p>"
        },
        {
            "title": "Secrets Management",
            "content": "<p>Never hardcode secrets in pipelines. Use: GitHub Secrets, Azure Key Vault, GitLab CI Variables (masked/protected). Rotate regularly. Audit access.</p>"
        },
        {
            "title": "Best Practices",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Pipeline Design",
                "text": "<ul><li>Fast feedback (fail early)</li><li>Parallel jobs where possible</li><li>Cache dependencies</li><li>Immutable artifacts</li><li>Environment-specific configs via variables</li><li>Approval gates for production</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>CI vs CD vs CD</li><li>Pipeline security</li><li>Rollback strategies</li><li>Monorepo vs polyrepo pipelines</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "CI vs CD?",
            "answer": "<p>CI: automated build+test on every commit. CD (Delivery): automated release to staging with manual prod gate. CD (Deployment): fully automated to production.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "How to handle secrets in pipelines?",
            "answer": "<p>Platform secret stores (GitHub Secrets, Azure Key Vault). Never in code/logs. Masked variables. Scoped to environments. Regular rotation.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "Pipeline caching strategies?",
            "answer": "<p>Cache dependencies (node_modules, NuGet packages) by lockfile hash. Docker layer caching. Artifact reuse between stages.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Design pipeline for monorepo?",
            "answer": "<p>Path-based triggers (only build changed services). Shared pipeline templates. Dependency graph for build order. Parallel independent services.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "Deployment rollback in CD?",
            "answer": "<p>Blue-green: switch back. Canary: shift traffic to old. K8s: rollout undo. DB: forward-fix preferred over rollback migrations.</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "Pipeline security hardening?",
            "answer": "<p>Least-privilege service connections, branch protection, required reviews, signed commits, SAST/DAST in pipeline, dependency scanning, no self-hosted runners for untrusted code.</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "Enterprise CI/CD platform design?",
            "answer": "<p>Shared templates/libraries, self-service onboarding, policy enforcement, cost allocation, multi-cloud deployment, compliance gates, audit trail.</p>"
        }
    ]
});
