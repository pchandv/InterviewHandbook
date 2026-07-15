/* ═══════════════════════════════════════════════════════════════════
   MICROSERVICES — Deployment & Operations
   Containers, Kubernetes, per-service CI/CD, blue-green/canary,
   service mesh, config & secrets, and GitOps.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('microservices-deployment', {

    title: 'Microservices: Deployment & Operations',
    level: 5,
    group: 'microservices',
    description: 'Running microservices in production: containers and Kubernetes, independent per-service CI/CD, zero-downtime release strategies (blue-green, canary, rolling), service mesh, config and secrets management, and GitOps.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['microservices', 'docker-core', 'k8s-core'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Microservices trade code complexity for <strong>operational</strong> complexity. Twenty
            services with their own release cadences only work if deployment, scaling, and configuration are
            automated. This lesson covers the operational platform: containers, orchestration, per-service delivery
            pipelines, safe release strategies, service mesh, and how config and secrets are managed.</p>
            <p>For the fundamentals of the underlying tools, see <a href="#docker-core">Docker</a> and
            <a href="#k8s-core">Kubernetes</a>; here we focus on how they apply to a microservices estate.</p>`
        },
        {
            title: 'Containers',
            content: `<p>A <strong>container</strong> packages a service with its exact runtime and dependencies into
            one portable, immutable image. This solves "works on my machine" and gives every service the same
            deployment unit regardless of language — the key enabler of polyglot microservices.</p>
            <h4>Image best practices</h4>
            <ul>
                <li><strong>Small base images</strong> (alpine, distroless) — faster pulls, smaller attack surface.</li>
                <li><strong>Multi-stage builds</strong> — build with the SDK, ship only the runtime + binaries.</li>
                <li><strong>Non-root user</strong> and read-only filesystem where possible.</li>
                <li><strong>Immutable, versioned tags</strong> — never rely on <code>:latest</code> in production.</li>
            </ul>`,
            code: `# Multi-stage Dockerfile: build with the SDK, ship a small runtime image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app .
USER app                       # run as non-root
EXPOSE 8080
ENTRYPOINT ["dotnet", "OrderService.dll"]`,
            language: 'dockerfile'
        },
        {
            title: 'Kubernetes Orchestration',
            content: `<p><strong>Kubernetes</strong> is the de-facto orchestrator: it schedules containers across a
            cluster, restarts failed ones, scales them, rolls out new versions, and provides service discovery and
            load balancing. Core objects you deploy per service:</p>
            <ul>
                <li><strong>Deployment</strong> — declares the desired replica count and pod template; handles
                rolling updates and self-healing.</li>
                <li><strong>Service</strong> — a stable virtual endpoint + DNS name load-balancing across healthy
                pods (server-side service discovery).</li>
                <li><strong>HorizontalPodAutoscaler (HPA)</strong> — scales replicas on CPU/memory/custom metrics.</li>
                <li><strong>ConfigMap / Secret</strong> — inject configuration and secrets.</li>
                <li><strong>Ingress</strong> — external HTTP routing into the cluster.</li>
            </ul>`,
            code: `# A service Deployment + Service with readiness gating and autoscaling
apiVersion: apps/v1
kind: Deployment
metadata: { name: order-service }
spec:
  replicas: 3
  selector: { matchLabels: { app: order-service } }
  template:
    metadata: { labels: { app: order-service } }
    spec:
      containers:
        - name: order-service
          image: registry/order-service:1.4.2   # immutable versioned tag
          ports: [{ containerPort: 8080 }]
          readinessProbe:
            httpGet: { path: /health/ready, port: 8080 }
            initialDelaySeconds: 5
          livenessProbe:
            httpGet: { path: /health/live, port: 8080 }
---
apiVersion: v1
kind: Service
metadata: { name: order-service }
spec:
  selector: { app: order-service }
  ports: [{ port: 80, targetPort: 8080 }]`,
            language: 'yaml'
        },
        {
            title: 'Independent CI/CD per Service',
            content: `<p>The core promise of microservices — deploy independently — is only real if each service has
            its <strong>own pipeline</strong>. A shared, all-or-nothing pipeline recreates the monolith's release
            coupling.</p>
            <p>Each service pipeline: build the image, run unit + integration + contract tests, scan for
            vulnerabilities, push a versioned image, and deploy to environments through progressive stages. Because
            services deploy independently and old/new versions coexist, <strong>backward-compatible API and event
            changes</strong> are mandatory (see <a href="#microservices-challenges">Challenges</a> on versioning).</p>`,
            mermaid: `flowchart LR
    Commit["Commit"] --> Build["Build image"]
    Build --> Test["Unit + Integration + Contract tests"]
    Test --> Scan["Security scan"]
    Scan --> Push["Push versioned image"]
    Push --> Staging["Deploy staging"]
    Staging --> Canary["Canary"]
    Canary --> Prod["Roll out to production"]`
        },
        {
            title: 'Zero-Downtime Release Strategies',
            content: `<p>Deploying a new version without downtime or risk uses one of these strategies:</p>`,
            table: {
                headers: ['Strategy', 'How it works', 'Pros', 'Cons'],
                rows: [
                    ['Rolling update', 'Replace instances a few at a time', 'Simple, no extra infra; K8s default', 'Both versions live briefly; slower rollback'],
                    ['Blue-green', 'Run new (green) alongside old (blue), switch traffic at once', 'Instant switch and rollback', 'Doubles infrastructure during release'],
                    ['Canary', 'Route a small % to the new version, ramp up if healthy', 'Limits blast radius; real-traffic validation', 'Needs traffic-splitting + good metrics'],
                    ['Feature flags', 'Deploy dark, enable at runtime per cohort', 'Decouples deploy from release; instant off', 'Flag management + cleanup overhead']
                ]
            },
            callout: {
                type: 'tip',
                title: 'Deploy is not release',
                text: 'Canary and feature flags separate deployment (code is running) from release (users see it). This lets you ship continuously and turn features on gradually, with an instant off-switch if something goes wrong.'
            }
        },
        {
            title: 'Service Mesh',
            content: `<p>A <strong>service mesh</strong> (Istio, Linkerd, Consul Connect) moves cross-cutting
            communication concerns out of application code and into <strong>sidecar proxies</strong> deployed next
            to each service (the data plane), configured centrally (the control plane).</p>
            <p>Without changing app code, a mesh provides: <strong>mTLS</strong> and identity-based authorization
            (zero-trust), <strong>traffic management</strong> (canary/weighted routing, retries, timeouts), and
            uniform <strong>observability</strong> for all traffic. The trade-off is real operational complexity and
            a small per-hop latency/resource cost from the sidecar.</p>
            <p><strong>When to adopt:</strong> generally past ~10-15 services, especially polyglot estates needing
            uniform mTLS and traffic policy. Below that, resilience libraries (Polly/Resilience4j) plus good
            conventions are simpler. Lightweight alternatives like <strong>Dapr</strong> offer mesh-like building
            blocks via a sidecar without a full mesh.</p>`
        },
        {
            title: 'Configuration & Secrets',
            content: `<p>Config must live <strong>outside</strong> the image so the same immutable artifact runs in
            every environment (12-Factor). Inject environment-specific values at runtime.</p>
            <ul>
                <li><strong>Non-secret config</strong> — environment variables, Kubernetes ConfigMaps, or a config
                service. Centralize so many services share consistent settings.</li>
                <li><strong>Secrets</strong> — never in images, env files in git, or plain ConfigMaps. Use a secrets
                manager (HashiCorp Vault, Azure Key Vault, AWS Secrets Manager) or Kubernetes Secrets backed by one,
                with rotation and least-privilege access.</li>
            </ul>
            <p>Config sprawl across many services is a real challenge — centralize and template it (see
            <a href="#microservices-challenges">Challenges</a>).</p>`
        },
        {
            title: 'GitOps',
            content: `<p><strong>GitOps</strong> makes a Git repository the single source of truth for desired
            infrastructure and deployment state. An operator (Argo CD, Flux) continuously reconciles the cluster to
            match the repo — you deploy by merging a pull request, not by running imperative commands.</p>
            <p>Benefits: every change is version-controlled, reviewed, and auditable; rollback is a git revert; and
            the cluster self-heals toward the declared state. It pairs naturally with immutable images and
            per-service pipelines across a large estate.</p>`
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Shared, all-or-nothing pipeline</h4>
            <p>Recreates monolith release coupling. Give each service its own pipeline.</p>
            <h4>Using :latest tags in production</h4>
            <p>Non-deterministic deploys and impossible rollbacks. Use immutable versioned tags.</p>
            <h4>Secrets in images or git</h4>
            <p>A major security hole. Use a secrets manager with rotation.</p>
            <h4>Big-bang releases with no canary/rollback</h4>
            <p>A bad deploy hits everyone at once. Use canary/blue-green and automate rollback.</p>
            <h4>Adopting a service mesh too early</h4>
            <p>For a handful of services the mesh is more operational burden than value; use libraries first.</p>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Containers</strong> give every service one portable, immutable deployment unit</li>
                <li><strong>Kubernetes</strong> schedules, scales, self-heals, and provides discovery/load-balancing</li>
                <li><strong>Independent per-service CI/CD</strong> is what makes independent deployment real</li>
                <li>Use <strong>canary/blue-green + feature flags</strong> for zero-downtime, low-risk releases</li>
                <li>Adopt a <strong>service mesh</strong> at scale; externalize config and use a <strong>secrets manager</strong>; <strong>GitOps</strong> for auditable, self-healing deploys</li>
            </ul>`
        },
        {
            title: 'Continue the Series',
            content: `<p>Previous: <a href="#microservices-observability">← Observability</a> ·
            Back to <a href="#microservices">Overview</a> ·
            Next: <a href="#microservices-patterns">Patterns Catalog →</a></p>`
        }
    ],

    questions: [
        {
            question: 'Why is independent per-service CI/CD essential to microservices?',
            difficulty: 'medium',
            answer: `<p>The central benefit of microservices is <strong>independent deployment</strong>. That is only
            real if each service has its own pipeline and can build, test, and release without coordinating with
            other services. A shared, all-or-nothing pipeline forces lock-step releases, recreating the monolith's
            release coupling — a distributed monolith.</p>
            <p>Each pipeline builds an image, runs unit/integration/contract tests, scans for vulnerabilities, and
            deploys progressively. Because versions coexist, backward-compatible API/event changes are required.</p>`,
            explanation: 'If every shop in a mall could only renovate when all shops renovate together, the "independent shops" are not independent at all. Each service needs its own key to its own door.',
            bestPractices: ['One pipeline per service', 'Contract tests in the pipeline', 'Progressive deployment (staging -> canary -> prod)', 'Backward-compatible changes since versions coexist'],
            commonMistakes: ['A shared monolithic pipeline', 'Deploying services in lock-step', 'Breaking API changes without versioning'],
            interviewTip: 'Tie it back to the whole point of microservices: "independent deploy is the benefit; a shared pipeline throws it away."',
            followUp: ['How do you handle coexisting versions?', 'What belongs in a service pipeline?', 'What is contract testing?']
        },
        {
            question: 'Compare rolling, blue-green, and canary deployment strategies.',
            difficulty: 'hard',
            answer: `<p><strong>Rolling update</strong> replaces instances a few at a time — simple, no extra infra
            (Kubernetes default), but both versions run briefly and rollback is slower. <strong>Blue-green</strong>
            runs the new version (green) alongside the old (blue) and switches traffic at once — instant switch and
            rollback, but doubles infrastructure during the release. <strong>Canary</strong> routes a small
            percentage to the new version and ramps up if healthy — limits blast radius and validates on real
            traffic, but needs traffic splitting and good metrics.</p>
            <p>Canary is the safest for risky changes; blue-green for instant cutover/rollback; rolling for routine
            low-risk updates.</p>`,
            explanation: 'Rolling = swap tires one at a time while driving slowly. Blue-green = keep a second identical car ready and jump into it. Canary = send one scout ahead and only move everyone if the scout is fine.',
            bestPractices: ['Canary for risky changes with metric-based promotion', 'Blue-green when instant rollback matters', 'Automate rollback on health regression'],
            commonMistakes: ['Big-bang deploy with no canary/rollback', 'Canary without good metrics to judge health', 'Blue-green without budgeting double infra'],
            interviewTip: 'Give the one-line trade-off for each and say which you would pick for a risky change (canary) — decisiveness plus reasoning scores well.',
            followUp: ['How do you decide when to promote a canary?', 'How do feature flags complement these?', 'What metrics gate a canary?']
        },
        {
            question: 'What is a service mesh, and when should you adopt one instead of resilience libraries?',
            difficulty: 'hard',
            answer: `<p>A <strong>service mesh</strong> (Istio, Linkerd) handles service-to-service communication via
            sidecar proxies (data plane) configured centrally (control plane). Without app-code changes it provides
            mTLS + identity-based authz (zero-trust), traffic management (canary, retries, timeouts), and uniform
            observability.</p>
            <p><strong>Libraries</strong> (Polly, Resilience4j) implement resilience per-service and per-language —
            you reimplement in every service. A mesh applies these uniformly and language-agnostically at the
            platform layer. Adopt a mesh past ~10-15 services, especially polyglot estates needing uniform mTLS and
            traffic policy; below that, libraries are simpler. The mesh costs operational complexity and per-hop
            sidecar latency.</p>`,
            explanation: 'A mesh is giving every building a standardized security desk and switchboard (sidecar) run by one central office, instead of each tenant installing their own locks and phone system in their own language.',
            bestPractices: ['Mesh at scale/polyglot for uniform mTLS + traffic policy', 'Keep business-specific fallbacks in the app', 'Account for sidecar latency/complexity'],
            commonMistakes: ['Adopting a mesh for a handful of services', 'Double retries in both mesh and app', 'Assuming a mesh replaces business fallbacks'],
            interviewTip: 'Contrast platform-level (mesh, uniform, language-agnostic) vs library-level (per-service, per-language) and give a scale threshold — that balance is the signal.',
            followUp: ['What is the data plane vs control plane?', 'How do you avoid double retries with a mesh?', 'What is Dapr?']
        },
        {
            question: 'How should configuration and secrets be managed across many services?',
            difficulty: 'medium',
            answer: `<p>Keep config <strong>outside the image</strong> (12-Factor) so one immutable artifact runs in
            every environment; inject environment values at runtime via environment variables, ConfigMaps, or a
            config service, centralized for consistency.</p>
            <p><strong>Secrets</strong> must never live in images, env files in git, or plain ConfigMaps. Use a
            secrets manager (Vault, Azure Key Vault, AWS Secrets Manager) with rotation and least-privilege access,
            or Kubernetes Secrets backed by one. Centralizing config also tackles config sprawl across many
            services.</p>`,
            explanation: 'The same appliance (image) should work in any house by plugging into that house\'s outlet (runtime config), and you keep the house keys in a locked safe (secrets manager), not taped to the appliance.',
            bestPractices: ['Config outside the image, injected at runtime', 'Centralize shared config', 'Secrets in a manager with rotation and least privilege'],
            commonMistakes: ['Baking config/secrets into images', 'Secrets in git or plain ConfigMaps', 'Per-service config with no consistency'],
            interviewTip: 'Cite 12-Factor "config in the environment" and be explicit that secrets need a dedicated manager with rotation — not env files.',
            followUp: ['How does secret rotation work?', 'What is the 12-Factor config principle?', 'How do you prevent config drift across services?']
        },
        {
            question: 'What is GitOps and what benefits does it bring to microservices operations?',
            difficulty: 'medium',
            answer: `<p><strong>GitOps</strong> treats a Git repo as the single source of truth for desired
            infrastructure/deployment state. An operator (Argo CD, Flux) continuously reconciles the cluster to
            match the repo, so you deploy by merging a pull request rather than running imperative commands.</p>
            <p>Benefits: every change is version-controlled, reviewed, and auditable; rollback is a git revert; and
            the cluster self-heals toward the declared state. This scales well across many services and pairs with
            immutable images and per-service pipelines.</p>`,
            explanation: 'The git repo is the master blueprint; a robot (the operator) constantly compares the building to the blueprint and fixes any difference. To change the building, you change the blueprint via a reviewed pull request.',
            bestPractices: ['Declarative desired state in git', 'Operator reconciles continuously', 'Roll back via git revert', 'Review changes as pull requests'],
            commonMistakes: ['Imperative kubectl changes that drift from git', 'No audit trail of who changed what', 'Manual rollback processes'],
            interviewTip: 'Emphasize "git as source of truth + continuous reconciliation" and that rollback becomes a revert — the auditability is the selling point.',
            followUp: ['How does reconciliation detect drift?', 'Argo CD vs Flux?', 'How does GitOps handle secrets?']
        },
        {
            question: 'Why should container images be immutable and versioned rather than using :latest?',
            difficulty: 'easy',
            answer: `<p>An <strong>immutable, versioned tag</strong> (e.g., <code>order-service:1.4.2</code>)
            guarantees that what you tested is exactly what runs, and that every environment runs the same artifact.
            <code>:latest</code> is a moving target: two pulls can yield different images, deploys become
            non-deterministic, and you cannot cleanly roll back because "latest" may have changed.</p>
            <p>Versioned tags make deploys reproducible, rollbacks trivial (redeploy the previous tag), and pair with
            GitOps where the tag in git defines the running version.</p>`,
            explanation: 'Using :latest is like a recipe that says "use the newest milk in the fridge" — you never know exactly what you cooked. A version number is a specific carton you can reorder or point back to.',
            bestPractices: ['Immutable, semantically versioned tags', 'Deploy by tag; roll back by previous tag', 'Never :latest in production'],
            commonMistakes: [':latest in production manifests', 'Rebuilding a tag with different content', 'No rollback path'],
            interviewTip: 'Frame it as reproducibility and rollback — "what I tested is what runs, and I can point back to any previous version."',
            followUp: ['How does this support rollback?', 'How do image digests improve on tags?', 'How does GitOps use image tags?']
        },
        {
            question: 'What advantages do multi-stage Docker builds and small base images provide?',
            difficulty: 'medium',
            answer: `<p><strong>Multi-stage builds</strong> compile with a full SDK image but ship only the runtime
            plus built artifacts, so the final image excludes build tools and source — much smaller and with a
            smaller attack surface. <strong>Small base images</strong> (alpine, distroless) reduce pull time,
            storage, cold-start, and vulnerability exposure.</p>
            <p>Together they yield lean, secure, fast-to-deploy images — important when you are pulling and scaling
            many services frequently.</p>`,
            explanation: 'It is like cooking in a big messy kitchen but delivering only the finished dish in a small clean box — the customer never receives the pots, knives, and raw ingredients.',
            bestPractices: ['Multi-stage: build with SDK, ship runtime only', 'Alpine/distroless base images', 'Run as non-root, read-only filesystem where possible'],
            commonMistakes: ['Shipping the full SDK in production images', 'Large base images with unused tools', 'Running containers as root'],
            interviewTip: 'Mention both size (speed/cost) and security (smaller attack surface) — the security angle is often what interviewers want.',
            followUp: ['What is a distroless image?', 'How do image layers affect caching?', 'Why run containers as non-root?']
        },
        {
            question: 'What does "deploy is not release" mean, and how do canary and feature flags enable it?',
            difficulty: 'hard',
            answer: `<p>It means the act of <strong>deploying</strong> code (running it in production) can be separated
            from <strong>releasing</strong> a feature (exposing it to users). <strong>Canary</strong> deploys the new
            version but routes only a small slice of traffic to it, ramping up as metrics stay healthy.
            <strong>Feature flags</strong> deploy code "dark" and enable it at runtime per cohort, with an instant
            off-switch.</p>
            <p>This decoupling enables continuous deployment with controlled, gradual, reversible releases — you can
            ship many times a day and turn features on/off without redeploying, dramatically reducing risk.</p>`,
            explanation: 'It is like installing a new ride at a theme park overnight (deploy) but keeping it roped off, then opening it to a few guests first and to everyone once it proves safe (release) — and being able to rope it off instantly.',
            bestPractices: ['Separate deploy from release with flags/canary', 'Promote canaries on healthy metrics', 'Keep an instant kill-switch; clean up stale flags'],
            commonMistakes: ['Coupling every deploy to a full release', 'Flags that never get cleaned up', 'Canary without metric-based promotion'],
            interviewTip: 'State the distinction crisply and note the instant off-switch — it shows you understand risk control, not just mechanics.',
            followUp: ['How do you clean up stale feature flags?', 'How do canary metrics drive promotion?', 'How do flags support A/B testing?'],
            seniorPerspective: 'Separating deploy from release is the single biggest lever for safe, frequent shipping. Once code can go to production dark and be enabled per cohort with an instant kill-switch, deployment stops being a scary event and becomes routine — which is exactly the operating model microservices need.'
        }
    ]
});
