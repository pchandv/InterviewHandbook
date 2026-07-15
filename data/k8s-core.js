/* ═══════════════════════════════════════════════════════════════════
   Kubernetes — Pods, Deployments, Services, Scaling, ConfigMaps
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('k8s-core', {
    title: 'Kubernetes',
    description: 'Core Kubernetes concepts — Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, HPA, health probes, and production deployment patterns.',
    sections: [
        {
            title: 'Kubernetes Architecture',
            mermaid: `graph TB
    subgraph CP["Control Plane"]
        API["API Server"]
        ETCD["etcd (cluster state)"]
        SCHED["Scheduler"]
        CM["Controller Manager"]
    end
    subgraph N1["Worker Node 1"]
        KL1["kubelet"]
        P1["Pod A"]
        P2["Pod B"]
    end
    subgraph N2["Worker Node 2"]
        KL2["kubelet"]
        P3["Pod C"]
        P4["Pod D"]
    end
    API --> ETCD & SCHED & CM
    API --> KL1 & KL2
    KL1 --> P1 & P2
    KL2 --> P3 & P4`,
            content: `<p>Kubernetes separates the <strong>control plane</strong> (decision-making: API server, scheduler, controllers, etcd) from <strong>worker nodes</strong> (execution: kubelet manages pods). The API server is the single entry point for all operations.</p>`
        },
        {
            title: 'Core Resources',
            content: `<p>Kubernetes orchestrates containers across a cluster. Key resources form a hierarchy: Pods (smallest unit) → Deployments (manage pod replicas) → Services (stable networking) → Ingress (external access).</p>`,
            code: `# Deployment — manages pod replicas with rolling updates
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-api
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Create 1 extra pod during update
      maxUnavailable: 0  # Never have fewer than 3 running
  selector:
    matchLabels:
      app: my-api
  template:
    metadata:
      labels:
        app: my-api
        version: v2.1.0
    spec:
      containers:
        - name: api
          image: myregistry.azurecr.io/my-api:2.1.0
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 100m      # Minimum guaranteed
              memory: 256Mi
            limits:
              cpu: 500m      # Maximum allowed
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
          env:
            - name: ASPNETCORE_ENVIRONMENT
              value: Production
            - name: ConnectionStrings__Default
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: connection-string`,
            language: 'yaml'
        },
        {
            title: 'Services, Ingress & Auto-Scaling',
            content: `<p><strong>Services</strong> provide stable networking for pods. <strong>Ingress</strong> routes external HTTP traffic. <strong>HPA</strong> automatically scales based on metrics.</p>`,
            code: `# Service — stable network endpoint for pods
apiVersion: v1
kind: Service
metadata:
  name: my-api-svc
spec:
  selector:
    app: my-api
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP  # Internal only (Ingress handles external)

---
# Ingress — external HTTP routing with TLS
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-api-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts: [api.example.com]
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-api-svc
                port:
                  number: 80

---
# HorizontalPodAutoscaler — scale based on CPU/memory/custom metrics
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70  # Scale up when CPU > 70%
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80`,
            language: 'yaml'
        },
        {
            title: 'ConfigMaps, Secrets & Health Probes',
            content: `<p>Kubernetes separates configuration from code using <strong>ConfigMaps</strong> (non-sensitive) and <strong>Secrets</strong> (sensitive). Health probes ensure traffic only reaches healthy pods.</p>`,
            code: `# ConfigMap — non-sensitive configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  ASPNETCORE_ENVIRONMENT: "Production"
  Logging__LogLevel__Default: "Warning"
  Features__EnableNewDashboard: "true"

---
# Secret — sensitive data (base64 encoded, or use Sealed Secrets/External Secrets)
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  connection-string: U2VydmVyPWRiO0RhdGFiYXNlPU15QXBwOw==  # base64

# Health probes in ASP.NET Core:
# Program.cs
builder.Services.AddHealthChecks()
    .AddSqlServer(connectionString, name: "database")
    .AddRedis(redisConnection, name: "redis")
    .AddUrlGroup(new Uri("https://external-api.com/health"), name: "external-api");

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false  // Liveness: just "am I running?"
});
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = _ => true   // Readiness: are dependencies available?
});

# Probe types:
# livenessProbe  — is the container alive? (restart if fails)
# readinessProbe — can it handle traffic? (remove from service if fails)
# startupProbe   — is it done starting? (delay liveness/readiness checks)`,
            language: 'yaml'
        }
    ],
    questions: [
        {
            question: 'What is the difference between a Pod, Deployment, and Service in Kubernetes?',
            difficulty: 'easy',
            answer: `<p><strong>Pod</strong>: smallest deployable unit — one or more containers sharing network/storage. <strong>Deployment</strong>: manages pod replicas, handles rolling updates and rollbacks. <strong>Service</strong>: provides a stable network endpoint (DNS name + IP) for a set of pods, load-balancing traffic across them.</p>`,
            bestPractices: ['Never create bare Pods — always use Deployments for self-healing', 'Set resource requests AND limits on all containers', 'Use readiness probes so traffic only reaches ready pods', 'Use namespaces to isolate environments (dev, staging, prod)'],
            commonMistakes: ['Running without resource limits (pods can starve other workloads)', 'No health probes (traffic sent to crashing/starting containers)', 'Using NodePort or LoadBalancer per service instead of Ingress (expensive)', 'Storing secrets in ConfigMaps (not encrypted at rest)'],
            interviewTip: 'Draw the hierarchy: Deployment manages ReplicaSet which manages Pods. Service selects Pods via labels. Ingress routes external traffic to Services. This layered model enables zero-downtime deployments.',
            followUp: ['What is a rolling update?', 'How does Kubernetes self-heal?', 'What is a StatefulSet vs Deployment?'],
            seniorPerspective: 'I always start with: Deployment + Service + Ingress + HPA + health probes. This baseline covers 90% of stateless API workloads. For stateful services (databases), I prefer managed services (Azure SQL) over running them in K8s.',
            architectPerspective: 'Kubernetes is infrastructure complexity traded for operational consistency. Every team deploys the same way (YAML/Helm), scales the same way (HPA), and observes the same way (Prometheus). The upfront investment pays off at 10+ services when operational consistency matters more than simplicity.'
        },
        {
            question: 'How does Kubernetes handle self-healing and rolling updates?',
            difficulty: 'medium',
            answer: `<p><strong>Self-healing:</strong> K8s continuously compares desired state (Deployment spec) with actual state. If a pod crashes, the ReplicaSet controller creates a replacement. If a node dies, pods are rescheduled elsewhere. <strong>Rolling updates:</strong> Deployment controller creates new pods (v2) one by one, waits for readiness, then terminates old pods (v1) — maintaining minimum availability throughout.</p>`,
            code: `# Rolling update configuration:
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Create 1 extra pod during rollout
      maxUnavailable: 0  # Never have fewer than 3 running
  # Result: 3→4 (new v2 starts) → 4→3 (old v1 removed) → repeat

# Self-healing mechanisms:
# 1. Liveness probe fails → kubelet RESTARTS the container
# 2. Readiness probe fails → removed from Service endpoints (no traffic)
# 3. Pod deleted/crashed → ReplicaSet creates replacement
# 4. Node failure → pods rescheduled to healthy nodes
# 5. OOMKilled → container restarted (check resource limits!)

# Rollback on failure:
# kubectl rollout undo deployment/my-api        # Instant rollback to previous
# kubectl rollout status deployment/my-api      # Watch rollout progress
# kubectl rollout history deployment/my-api     # See revision history`,
            language: 'yaml',
            interviewTip: 'Explain the reconciliation loop: desired state (3 replicas) vs actual state (2 running). K8s controllers constantly work to make actual match desired. This is declarative infrastructure — you declare WHAT, K8s figures out HOW.',
            followUp: ['What is the difference between liveness and readiness probes?', 'How do you handle database migrations during rolling updates?', 'What is a PodDisruptionBudget?'],
            seniorPerspective: 'I set maxUnavailable: 0 for production APIs — this ensures zero downtime during deploys. Combined with readiness probes, traffic only shifts to new pods after they pass health checks.',
            architectPerspective: 'The reconciliation loop is K8s core philosophy: declare intent, controllers achieve it. This extends beyond pods: HPA reconciles desired CPU utilization, Ingress controllers reconcile routing rules, cert-manager reconciles TLS certificates. Everything is a control loop.'
        },
        {
            question: 'Explain the difference between liveness, readiness, and startup probes. What goes wrong if you misconfigure them?',
            difficulty: 'hard',
            answer: `<p>The three probes answer different questions:</p>
            <ul>
                <li><strong>livenessProbe</strong>: "Is the container alive?" If it fails, the kubelet <em>restarts</em> the container. Use it to recover from deadlocks/hung states.</li>
                <li><strong>readinessProbe</strong>: "Can it serve traffic right now?" If it fails, the pod is <em>removed from Service endpoints</em> (no restart). Use it for dependency checks and warm-up.</li>
                <li><strong>startupProbe</strong>: "Has it finished starting?" While it runs, liveness/readiness are suspended. Use it for slow-starting apps so liveness does not kill them mid-boot.</li>
            </ul>
            <p>Misconfiguration is dangerous: a liveness probe that checks a downstream dependency causes restart loops when that dependency is briefly down; a readiness probe that is too aggressive flaps pods in/out of rotation; missing a startup probe makes slow apps get killed before they boot.</p>`,
            explanation: 'Liveness is a pulse check — no pulse, restart the patient. Readiness is "ready to take visitors" — if not, hold visitors at the door but do not resuscitate. Startup is the recovery room timer that pauses the other checks until the patient is awake.',
            code: `containers:
  - name: api
    image: my-api:2.1.0
    startupProbe:                 # slow boot: up to 30 x 5s = 150s to start
      httpGet: { path: /health/started, port: 8080 }
      failureThreshold: 30
      periodSeconds: 5
    livenessProbe:                # ONLY self-state — no downstream checks!
      httpGet: { path: /health/live, port: 8080 }
      periodSeconds: 15
      failureThreshold: 3
    readinessProbe:               # may check dependencies (DB, cache)
      httpGet: { path: /health/ready, port: 8080 }
      periodSeconds: 5
      failureThreshold: 3`,
            language: 'yaml',
            bestPractices: ['Keep liveness checks about self-state only, never downstream dependencies', 'Put dependency checks in readiness so pods drop from rotation, not restart', 'Use a startupProbe for slow-starting apps instead of large initialDelaySeconds', 'Tune thresholds to avoid flapping (failureThreshold > 1)'],
            commonMistakes: ['Liveness probe checking the database (dependency blip → restart storm)', 'No startup probe on slow apps (killed before they finish booting)', 'Identical liveness and readiness endpoints (defeats the distinction)', 'Too-tight periods/thresholds causing pods to flap in and out of service'],
            interviewTip: 'The signal here is knowing liveness restarts while readiness only removes from the load balancer — and that a liveness probe checking a dependency causes cascading restart loops. That mistake is a classic production incident.',
            followUp: ['Why should a liveness probe not check the database?', 'How does a startupProbe interact with liveness?', 'What is the effect of a failing readiness probe during a rolling update?'],
            seniorPerspective: 'The most damaging probe mistake I see is a liveness check that hits a downstream dependency: when that dependency hiccups, every pod restarts simultaneously and turns a minor blip into a full outage. Liveness = am I healthy; readiness = can I serve; dependency checks belong only in readiness.',
            architectPerspective: 'Probes encode your service health model into the platform. I standardize separate /live, /ready, and /started endpoints with clear semantics so every service behaves predictably during deploys and partial outages. Getting this contract right is what makes rolling updates and self-healing trustworthy at fleet scale.'
        },
        {
            question: 'When should you use a ConfigMap versus a Secret, and how do you keep Kubernetes Secrets actually secure?',
            difficulty: 'medium',
            answer: `<p><strong>ConfigMap</strong>: non-sensitive configuration (log levels, feature toggles, environment names, URLs). <strong>Secret</strong>: sensitive data (connection strings, API keys, certificates, passwords).</p>
            <p>Critically, a default Kubernetes Secret is only <strong>base64-encoded, not encrypted</strong> — anyone with API/etcd access can read it. To make Secrets genuinely secure:</p>
            <ul>
                <li>Enable <strong>encryption at rest</strong> for etcd (EncryptionConfiguration / KMS provider).</li>
                <li>Lock down access with <strong>RBAC</strong> so only the workloads/people that need a secret can read it.</li>
                <li>Use <strong>external secret managers</strong> (External Secrets Operator, Sealed Secrets, Vault, cloud KMS) so plaintext never lives in git.</li>
                <li>Prefer mounting secrets as files or injecting at runtime over baking them into images.</li>
            </ul>`,
            explanation: 'Base64 is an envelope, not a lock — anyone can open it. Real security comes from encrypting the filing cabinet (etcd at rest), controlling who has keys to the room (RBAC), and storing the master copies in a proper safe (Vault/KMS) rather than the office bulletin board (git).',
            code: `# ConfigMap: non-sensitive
apiVersion: v1
kind: ConfigMap
metadata: { name: app-config }
data:
  Logging__LogLevel__Default: "Warning"
  Features__NewDashboard: "true"
---
# Secret is base64, NOT encrypted by default
apiVersion: v1
kind: Secret
metadata: { name: db-credentials }
type: Opaque
data:
  connection-string: U2VydmVyPWRiOw==   # echo -n decodes this trivially!
# Make it real: encrypt etcd at rest + RBAC + External Secrets Operator
# externalsecrets.io syncs from Vault/AWS Secrets Manager/Azure Key Vault.`,
            language: 'yaml',
            bestPractices: ['Use Secrets (not ConfigMaps) for any sensitive value', 'Enable etcd encryption at rest and restrict access via RBAC', 'Keep plaintext secrets out of git — use Sealed Secrets/External Secrets/Vault', 'Mount secrets as files or env at runtime, never bake into images'],
            commonMistakes: ['Assuming base64 Secrets are encrypted (they are only encoded)', 'Storing credentials in ConfigMaps', 'Committing raw Secret manifests to git', 'No RBAC limits, so any pod/user can read every secret'],
            interviewTip: 'The high-signal point: Kubernetes Secrets are base64, not encrypted by default. Saying that, then naming etcd encryption-at-rest, RBAC, and an external secrets operator, shows you understand the real security model.',
            followUp: ['Why is base64 not a security measure?', 'What does the External Secrets Operator do?', 'How does RBAC restrict secret access?'],
            seniorPerspective: 'I treat native Secrets as a delivery mechanism, not a vault. The source of truth lives in Vault or a cloud secret manager and is synced in via External Secrets, etcd is encrypted at rest, and RBAC scopes each secret to the workloads that need it. base64 fools no one.',
            architectPerspective: 'Secret management is a cross-cutting platform concern: I want a single auditable source of truth (cloud KMS/Vault), automatic rotation, and no plaintext in git or images. Building that pipeline once and enforcing it cluster-wide is far safer than trusting teams to handle raw Secret YAML correctly.'
        },
        {
            question: 'How do resource requests/limits and the HorizontalPodAutoscaler work together, and what happens at the limits?',
            difficulty: 'advanced',
            answer: `<p><strong>Requests</strong> are what a pod is guaranteed and what the scheduler uses to place it on a node. <strong>Limits</strong> are the hard ceiling. They behave differently per resource:</p>
            <ul>
                <li><strong>CPU</strong> is compressible: exceeding the limit causes <em>throttling</em> (slower), not death.</li>
                <li><strong>Memory</strong> is incompressible: exceeding the limit gets the container <em>OOMKilled</em> and restarted.</li>
            </ul>
            <p>The <strong>HPA</strong> scales replica count based on utilization <em>relative to requests</em>. If CPU request is 200m and target is 70%, HPA adds replicas when average usage exceeds ~140m. So requests are not just scheduling hints — they are the denominator for autoscaling. Bad requests break HPA: requests set too high make utilization look low (HPA never scales up); too low make it spike (HPA over-scales and pods get throttled/OOMKilled).</p>`,
            explanation: 'Requests are the seat you reserve; limits are the maximum you are allowed to consume. CPU over-limit is being told to slow down; memory over-limit is being thrown out (OOMKilled). The HPA hires more workers based on how busy each one is relative to their reserved seat — so the reservation size decides when more workers show up.',
            code: `# Requests drive both scheduling AND the HPA denominator
resources:
  requests: { cpu: 200m, memory: 256Mi }   # guaranteed + HPA basis
  limits:   { cpu: 500m, memory: 512Mi }   # CPU throttle / memory OOMKill
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: my-api-hpa }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: my-api }
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 70 }
  # 70% of the 200m REQUEST = ~140m triggers scale-out, not 70% of the limit.`,
            language: 'yaml',
            bestPractices: ['Always set requests — HPA and the scheduler depend on them', 'Set memory limit = request for predictable OOM behavior on critical pods', 'Right-size requests from real usage data (VPA/metrics) so HPA math is accurate', 'Leave CPU limits generous or unset to avoid needless throttling, but always set memory limits'],
            commonMistakes: ['No requests set (HPA cannot compute utilization, scheduler misplaces pods)', 'Setting requests too high (utilization looks low, HPA never scales up)', 'Confusing limits with requests as the HPA basis (it is requests)', 'Tight memory limits causing frequent OOMKills under normal bursts'],
            interviewTip: 'The differentiator: HPA utilization is measured against requests, not limits. Combine that with CPU-throttles-but-memory-OOMKills, and you can explain why mis-sized requests silently break autoscaling.',
            followUp: ['What is the difference between CPU throttling and OOMKilled?', 'What does the Vertical Pod Autoscaler do?', 'Why might an HPA never scale up despite high load?'],
            seniorPerspective: 'I drill into teams that requests are the HPA denominator, not limits. The subtle outage is requests set far above real usage: every pod looks idle, the HPA never scales out, and latency climbs under load while dashboards show low utilization. I size requests from observed p95 usage, not guesses.',
            architectPerspective: 'Requests and limits are the contract between workloads and the cluster economy — they govern bin-packing, fairness, autoscaling, and cost. I pair HPA with sane requests derived from real telemetry (and VPA for recommendations), because mis-sized requests simultaneously waste money and break elasticity across the whole platform.'
        },
        {
            question: 'Compare Service types (ClusterIP, NodePort, LoadBalancer) and explain when you use an Ingress instead.',
            difficulty: 'medium',
            answer: `<p>Service types control how a set of pods is exposed:</p>
            <ul>
                <li><strong>ClusterIP</strong> (default): reachable only inside the cluster. Used for internal service-to-service traffic.</li>
                <li><strong>NodePort</strong>: opens a static port on every node; external clients hit <code>nodeIP:nodePort</code>. Crude, used for dev or behind an external LB.</li>
                <li><strong>LoadBalancer</strong>: provisions a cloud load balancer with an external IP per service. Simple but one LB (and cost) per service.</li>
            </ul>
            <p><strong>Ingress</strong> is an L7 HTTP router sitting in front of ClusterIP Services. With one load balancer it does host/path-based routing, TLS termination, and name-based virtual hosting for many services — far cheaper and more flexible than a LoadBalancer per service.</p>`,
            explanation: 'LoadBalancer-per-service is giving every shop its own street entrance — expensive and sprawling. An Ingress is the shopping mall with one main entrance and a directory that routes visitors to the right store by name, and it handles security (TLS) at the door.',
            code: `# Internal Service (ClusterIP) — fronted by Ingress, not exposed directly
apiVersion: v1
kind: Service
metadata: { name: orders-svc }
spec:
  type: ClusterIP
  selector: { app: orders }
  ports: [{ port: 80, targetPort: 8080 }]
---
# One Ingress, one LB, routes many services by host/path + terminates TLS
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-ingress
  annotations: { cert-manager.io/cluster-issuer: letsencrypt-prod }
spec:
  tls: [{ hosts: [shop.example.com], secretName: shop-tls }]
  rules:
    - host: shop.example.com
      http:
        paths:
          - { path: /orders, pathType: Prefix, backend: { service: { name: orders-svc, port: { number: 80 } } } }
          - { path: /catalog, pathType: Prefix, backend: { service: { name: catalog-svc, port: { number: 80 } } } }`,
            language: 'yaml',
            bestPractices: ['Default services to ClusterIP and expose externally via Ingress', 'Use one Ingress + ingress controller instead of many LoadBalancer services', 'Terminate TLS at the Ingress (with cert-manager for automated certs)', 'Reserve LoadBalancer type for non-HTTP/L4 needs or the ingress controller itself'],
            commonMistakes: ['A LoadBalancer service per microservice (cost and IP sprawl)', 'Exposing databases via NodePort/LoadBalancer (security risk)', 'Forgetting an Ingress needs an ingress controller installed to work', 'Using NodePort directly in production instead of an Ingress'],
            interviewTip: 'Explain the cost/scaling angle: LoadBalancer-per-service does not scale (one cloud LB each). Ingress consolidates many services behind one L7 router with TLS and host/path routing — that is the senior reasoning interviewers want.',
            followUp: ['What component actually fulfills an Ingress resource?', 'How does TLS termination work at the Ingress?', 'When would you still use a LoadBalancer service?'],
            seniorPerspective: 'My default is ClusterIP everywhere, with a single Ingress controller (itself behind one LoadBalancer) handling external HTTP, TLS via cert-manager, and host/path routing. Spinning up a cloud LB per service is the pattern I most often have to unwind — it is costly and unmanageable as service count grows.',
            architectPerspective: 'The Ingress (or a service mesh gateway / Gateway API) is the cluster edge: a single, observable, secured entry point where I centralize TLS, routing, rate limiting, and auth. Concentrating cross-cutting concerns at the edge keeps individual services simple and gives one consistent place to enforce policy.'
        },
        {
            question: 'What is the difference between a Pod, Deployment, and Service in Kubernetes?',
            difficulty: 'easy',
            answer: `<p>These three resources form the core hierarchy of Kubernetes workload management:</p>
<ul>
<li><strong>Pod</strong>: The smallest deployable unit. One or more containers sharing the same network namespace (localhost), storage volumes, and lifecycle. Pods are ephemeral \u2014 they can be killed and rescheduled at any time.</li>
<li><strong>Deployment</strong>: Manages a set of identical Pod replicas. Provides declarative updates (rolling updates), self-healing (replaces failed pods), and rollback capabilities. You never create bare Pods \u2014 Deployments manage them.</li>
<li><strong>Service</strong>: Provides a stable network endpoint (DNS name + ClusterIP) for a set of Pods selected by labels. Pods come and go, but the Service IP/DNS remains constant. Load-balances traffic across healthy pods.</li>
</ul>
<p>The relationship: Deployment creates and manages Pods, Service provides stable networking to reach those Pods. External traffic enters via Ingress \u2192 Service \u2192 Pods.</p>`,
            interviewTip: 'Draw the hierarchy: Deployment \u2192 ReplicaSet \u2192 Pods, and Service selects Pods via labels (decoupled). The key insight is that Pods are ephemeral/disposable, so you need Deployments for reliability and Services for stable addressing.',
            followUp: ['Why should you never create bare Pods?', 'What is a ReplicaSet and how does it relate to a Deployment?', 'How does label-based selection decouple Services from Deployments?'],
            seniorPerspective: 'I think of it as three separate concerns: Deployment manages the lifecycle (how many, which version), Pods run the code (container runtime), and Service provides discovery (how to find them). Keeping these concerns separate is what makes K8s flexible \u2014 you can update one without touching the others.',
            architectPerspective: 'This resource hierarchy embodies the separation of concerns principle: compute (Pods), lifecycle management (Deployments), and networking (Services) are independently configurable. This composability is what makes Kubernetes work at scale \u2014 each concern evolves independently and can be managed by different teams or tools.'
        },
        {
            question: 'Explain how Kubernetes Services work (ClusterIP, NodePort, LoadBalancer). When to use each?',
            difficulty: 'medium',
            answer: `<p>Kubernetes Service types provide different levels of network exposure:</p>
<ul>
<li><strong>ClusterIP (default)</strong>: Assigns an internal-only virtual IP. Only reachable within the cluster. Use for internal service-to-service communication (APIs calling databases, microservices calling each other).</li>
<li><strong>NodePort</strong>: Opens a static port (30000-32767) on every cluster node. External clients reach the service via <code>nodeIP:nodePort</code>. Use for development/testing or when you manage your own external load balancer.</li>
<li><strong>LoadBalancer</strong>: Provisions a cloud provider load balancer (AWS ELB, Azure LB, GCP LB) with an external IP. One LB per service. Use for services that need direct external access without an Ingress (e.g., non-HTTP protocols, TCP/UDP services).</li>
</ul>
<p><strong>Best practice</strong>: Default everything to ClusterIP, expose HTTP services externally via Ingress (one LB for many services), and reserve LoadBalancer type for non-HTTP protocols or the Ingress controller itself.</p>`,
            interviewTip: 'Explain the progression: ClusterIP (internal) \u2192 NodePort (crude external) \u2192 LoadBalancer (cloud external) \u2192 Ingress (L7 routing, one LB for many services). The cost argument is key: LoadBalancer-per-service does not scale, Ingress consolidates.',
            followUp: ['What is the cost implication of LoadBalancer per service vs Ingress?', 'How does kube-proxy implement ClusterIP load balancing?', 'When would you use a headless Service?'],
            seniorPerspective: 'I default to ClusterIP + Ingress for HTTP services. The only time I use LoadBalancer directly is for the Ingress controller itself or non-HTTP protocols (gRPC streaming, raw TCP). NodePort I only use in bare-metal clusters without cloud LB integration.',
            architectPerspective: 'Service type selection is a cost and security decision at scale. With 50+ microservices, LoadBalancer-per-service means 50+ cloud LBs (expensive, IP sprawl, complex firewall rules). A single Ingress consolidates to one LB with host/path routing, centralized TLS, and one security boundary to audit.'
        },
        {
            question: 'What are Kubernetes liveness, readiness, and startup probes? What happens if you misconfigure them?',
            difficulty: 'medium',
            answer: `<p>Kubernetes uses three types of health probes to manage pod lifecycle:</p>
<ul>
<li><strong>Liveness Probe</strong>: "Is the container alive?" If it fails, kubelet <strong>restarts</strong> the container. Detects deadlocks, hung processes, unrecoverable states.</li>
<li><strong>Readiness Probe</strong>: "Can it handle traffic?" If it fails, the pod is <strong>removed from Service endpoints</strong> (no traffic routed to it). No restart. Useful during warm-up or when dependencies are temporarily unavailable.</li>
<li><strong>Startup Probe</strong>: "Has it finished starting?" While active, liveness and readiness probes are <strong>suspended</strong>. Protects slow-starting applications from being killed by liveness before they boot.</li>
</ul>
<p><strong>Misconfiguration disasters:</strong></p>
<ul>
<li>Liveness checking a dependency (DB, Redis): dependency hiccup \u2192 all pods restart simultaneously \u2192 cascading outage.</li>
<li>No startup probe on slow app: liveness kills pods before they finish booting \u2192 infinite restart loop.</li>
<li>Readiness too aggressive: pods flap in/out of rotation, causing intermittent errors.</li>
<li>Same endpoint for liveness and readiness: defeats the purpose of having separate probes.</li>
</ul>`,
            interviewTip: 'The critical rule: liveness checks ONLY self-state (am I healthy?), readiness checks dependencies (can I serve?). A liveness probe that checks the database turns a DB blip into a fleet-wide restart storm. This is the most common probe misconfiguration in production.',
            followUp: ['What should a liveness endpoint actually check?', 'How does a failing readiness probe affect rolling updates?', 'What is the difference between initialDelaySeconds and a startup probe?'],
            seniorPerspective: 'The probe misconfiguration I fix most often: liveness checking the database. When the DB has a brief connection hiccup, every pod restarts simultaneously, overwhelming the DB on reconnection and causing a cascading outage that is far worse than the original blip.',
            architectPerspective: 'I standardize probe semantics across the org: /health/live returns 200 if the process is running and not deadlocked (never checks dependencies), /health/ready returns 200 if the process can serve requests (checks critical dependencies), /health/startup returns 200 once initialization is complete. This contract makes platform behavior predictable across all services.'
        },
        {
            question: 'How does Horizontal Pod Autoscaler work? What metrics can you scale on?',
            difficulty: 'hard',
            answer: `<p>The <strong>HPA (Horizontal Pod Autoscaler)</strong> automatically adjusts the number of pod replicas based on observed metrics, running a control loop every 15 seconds (default):</p>
<ol>
<li>Collects current metric values from the Metrics API.</li>
<li>Calculates desired replicas: <code>desiredReplicas = ceil(currentReplicas \u00d7 (currentMetricValue / targetValue))</code>.</li>
<li>Scales the Deployment up or down toward the target, respecting minReplicas and maxReplicas.</li>
</ol>
<p><strong>Metric types you can scale on:</strong></p>
<ul>
<li><strong>Resource metrics</strong>: CPU utilization, memory utilization (built-in via metrics-server). Measured as percentage of <em>requests</em>, not limits.</li>
<li><strong>Custom metrics</strong>: Application-specific metrics from Prometheus (requests per second, queue depth, active connections). Via custom.metrics.k8s.io API.</li>
<li><strong>External metrics</strong>: Metrics from outside the cluster (cloud queue length, SaaS API queue depth). Via external.metrics.k8s.io API.</li>
</ul>
<p><strong>Key behaviors</strong>: scale-up is fast (reacts in seconds), scale-down is slow (default 5-minute stabilization window to prevent flapping). Multiple metrics use the highest recommended replica count.</p>`,
            interviewTip: 'The critical detail: HPA measures utilization against REQUESTS, not limits. If CPU request is 200m and target is 70%, scale-up triggers at 140m average usage. Mis-sized requests break autoscaling \u2014 requests too high means utilization looks low and HPA never scales out.',
            followUp: ['Why does HPA use requests as the denominator, not limits?', 'How do you scale on custom Prometheus metrics?', 'What is the difference between HPA and VPA?'],
            seniorPerspective: 'I always pair HPA with correctly-sized resource requests derived from real production metrics (not guesses). An HPA with inflated requests is useless \u2014 it sees 20% utilization during a traffic spike because the denominator is too large, and never scales out while latency climbs.',
            architectPerspective: 'HPA is reactive scaling \u2014 it responds to load that already arrived. For predictable patterns (daily traffic curves, scheduled events), I layer proactive scaling (CronJobs that pre-scale, or KEDA with cron triggers) on top of HPA so the capacity is ready before the traffic arrives. The combination handles both predictable and unpredictable load.'
        },
        {
            question: 'Explain Kubernetes ConfigMaps and Secrets. How do you handle configuration in a production cluster?',
            difficulty: 'hard',
            answer: `<p><strong>ConfigMaps</strong> store non-sensitive configuration as key-value pairs or files. <strong>Secrets</strong> store sensitive data (passwords, tokens, certificates) \u2014 base64-encoded by default (NOT encrypted without additional setup).</p>
<p><strong>Consumption methods:</strong></p>
<ul>
<li><strong>Environment variables</strong>: Simple, but require pod restart to pick up changes.</li>
<li><strong>Volume mounts</strong>: Mounted as files in the container. ConfigMap/Secret updates are reflected automatically (with a delay) \u2014 no pod restart needed if the app watches the file.</li>
</ul>
<p><strong>Production configuration strategy:</strong></p>
<ol>
<li><strong>External Secrets Operator</strong>: Syncs secrets from Vault/AWS Secrets Manager/Azure Key Vault into K8s Secrets automatically. Source of truth is the external vault.</li>
<li><strong>Sealed Secrets</strong>: Encrypt secrets client-side so they can be safely stored in git. Only the cluster controller can decrypt them.</li>
<li><strong>Immutable ConfigMaps/Secrets</strong>: Mark as immutable to prevent accidental changes and improve performance (kubelet skips watch).</li>
<li><strong>RBAC</strong>: Restrict secret access to only the namespaces/service accounts that need them.</li>
<li><strong>Encryption at rest</strong>: Enable etcd encryption via EncryptionConfiguration with a KMS provider.</li>
</ol>`,
            interviewTip: 'The gotcha interviewers probe: K8s Secrets are only base64-encoded, not encrypted. Real security requires etcd encryption at rest + RBAC + external secret management. Saying "Secrets are just base64" shows you understand the real security model.',
            followUp: ['How do volume-mounted ConfigMaps update without pod restart?', 'What is the External Secrets Operator?', 'How do you handle secret rotation in Kubernetes?'],
            seniorPerspective: 'I never store raw Secret manifests in git. My standard is External Secrets Operator pulling from Azure Key Vault, with RBAC scoping each secret to specific namespaces and service accounts. For development, I use Sealed Secrets so encrypted versions can live in the repo safely.',
            architectPerspective: 'Configuration management is a platform concern. I build a standardized secrets pipeline: external vault as source of truth, External Secrets Operator for sync, etcd encryption for defense-in-depth, RBAC for access control, and audit logging for compliance. Application teams consume secrets via a standard interface without touching the management plane.'
        },
        {
            question: 'Design a Kubernetes deployment strategy for zero-downtime updates. Include rolling update, blue-green, and canary approaches.',
            difficulty: 'advanced',
            answer: `<p>Zero-downtime deployment strategies in Kubernetes, from simplest to most sophisticated:</p>
<ul>
<li><strong>Rolling Update (built-in)</strong>: Gradually replaces old pods with new ones. Configure <code>maxSurge</code> (extra pods during update) and <code>maxUnavailable</code> (pods that can be down). With <code>maxUnavailable: 0</code>, capacity never drops. Relies on readiness probes to gate traffic to new pods. <em>Best for</em>: most stateless services, simple and built-in.</li>
<li><strong>Blue-Green</strong>: Run two complete environments (blue=current, green=new). Test green independently, then switch the Service selector from blue to green labels instantly. Instant rollback by switching back. <em>Best for</em>: when you need instant rollback and can afford double the resources temporarily.</li>
<li><strong>Canary</strong>: Route a small percentage of traffic (e.g., 5%) to the new version while the majority stays on the old. Monitor error rates and latency. If healthy, gradually increase traffic. If problematic, route 100% back to old. <em>Best for</em>: high-risk changes, gradual confidence building, implemented via Ingress weights or service mesh (Istio, Linkerd).</li>
</ul>
<p><strong>Essential prerequisites for all strategies</strong>: readiness probes, graceful shutdown handling (preStop hook + SIGTERM), connection draining, and backward-compatible database schema changes.</p>`,
            interviewTip: 'Explain the trade-offs: Rolling Update is simplest (built-in, no extra tools) but rollback is slower. Blue-Green gives instant rollback but costs double resources. Canary gives the most confidence but requires traffic management tooling. Then mention the prerequisites that make ANY strategy work: probes, graceful shutdown, schema compatibility.',
            followUp: ['How do you handle database migrations with zero-downtime deployments?', 'What is a preStop hook and why is it needed?', 'How does Istio implement canary traffic splitting?'],
            seniorPerspective: 'For most services I use rolling updates with maxUnavailable: 0, readiness probes, and a preStop hook (sleep 5) to allow in-flight requests to drain before SIGTERM. I only reach for canary when the change is high-risk \u2014 the operational complexity of traffic splitting is worth it only when the stakes justify it.',
            architectPerspective: 'Zero-downtime deployment is a system property, not just a K8s configuration. It requires: backward-compatible API changes (never remove fields, add new ones), expand-then-contract database migrations, graceful shutdown in application code, correct probe configuration, and connection draining at every layer. I treat these as non-negotiable platform standards that enable any deployment strategy to work safely.'
        }
    ],
    sections_mermaid: [
        {
            title: 'Kubernetes Architecture & Pod Lifecycle',
            content: `<p>Overview of the Kubernetes control plane, worker nodes, and pod lifecycle during a rolling update.</p>`,
            diagram: `graph TD
    subgraph "Control Plane"
        API[API Server]
        ETCD[etcd - State Store]
        SCHED[Scheduler]
        CM[Controller Manager]
        API --> ETCD
        CM --> API
        SCHED --> API
    end

    subgraph "Worker Node 1"
        KUB1[Kubelet]
        KP1[Kube-Proxy]
        POD1[Pod v2 - Ready]
        POD2[Pod v2 - Ready]
        KUB1 --> POD1
        KUB1 --> POD2
    end

    subgraph "Worker Node 2"
        KUB2[Kubelet]
        KP2[Kube-Proxy]
        POD3[Pod v2 - Ready]
        POD4[Pod v1 - Terminating]
        KUB2 --> POD3
        KUB2 --> POD4
    end

    API --> KUB1
    API --> KUB2

    SVC[Service - Load Balancer]
    SVC --> POD1
    SVC --> POD2
    SVC --> POD3
    SVC -.->|Removed| POD4

    ING[Ingress] --> SVC

    style POD1 fill:#4caf50
    style POD2 fill:#4caf50
    style POD3 fill:#4caf50
    style POD4 fill:#ff9800,stroke-dasharray: 5 5
    style API fill:#2196f3
    style ETCD fill:#9c27b0`,
            diagramType: 'mermaid'
        }
    ]
});
