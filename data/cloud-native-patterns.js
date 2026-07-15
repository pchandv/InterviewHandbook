/* ═══════════════════════════════════════════════════════════════════
   Cloud-Native Patterns: 12-Factor, Sidecar, Health Probes, Graceful Shutdown
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('cloud-native-patterns', {
    title: 'Cloud-Native Patterns',
    description: '12-Factor App methodology, sidecar and ambassador patterns, init containers, immutable infrastructure, config externalization, health probes, graceful shutdown, and circuit breaker patterns for Kubernetes and cloud deployments.',
    sections: [
        {
            title: 'Introduction to Cloud-Native',
            content: `<p><strong>Cloud-native</strong> applications are designed from the ground up to exploit cloud advantages: elasticity, resilience, observability, and automation. They are not simply "apps deployed to the cloud" — they embrace patterns that make them inherently scalable and operationally simple.</p>
            <p>Key principles: treat servers as disposable, externalize configuration, design for failure, automate everything, and observe everything. These patterns apply whether you run on Kubernetes, serverless, or managed PaaS.</p>`
        },
        {
            title: '12-Factor App Methodology',
            content: `<p>The <strong>12-Factor App</strong> defines best practices for building cloud-native applications that are portable, scalable, and maintainable:</p>
            <table><thead><tr><th>#</th><th>Factor</th><th>Principle</th><th>Practical Example</th></tr></thead><tbody>
                <tr><td>1</td><td>Codebase</td><td>One codebase tracked in version control, many deploys</td><td>Single Git repo, deploy to dev/staging/prod</td></tr>
                <tr><td>2</td><td>Dependencies</td><td>Explicitly declare and isolate dependencies</td><td>package.json, *.csproj, Dockerfile with specific versions</td></tr>
                <tr><td>3</td><td>Config</td><td>Store config in the environment</td><td>Environment variables, ConfigMaps, Key Vault</td></tr>
                <tr><td>4</td><td>Backing Services</td><td>Treat backing services as attached resources</td><td>Connection string in env var — swap DB without code change</td></tr>
                <tr><td>5</td><td>Build/Release/Run</td><td>Strictly separate build, release, and run stages</td><td>CI builds image → Release tags with config → K8s runs it</td></tr>
                <tr><td>6</td><td>Processes</td><td>Execute app as stateless processes</td><td>No local file state — use Redis/S3 for shared state</td></tr>
                <tr><td>7</td><td>Port Binding</td><td>Export services via port binding</td><td>App listens on $PORT — no app server dependency</td></tr>
                <tr><td>8</td><td>Concurrency</td><td>Scale out via the process model</td><td>Horizontal pod autoscaling, multiple instances</td></tr>
                <tr><td>9</td><td>Disposability</td><td>Maximize robustness with fast startup and graceful shutdown</td><td>SIGTERM handling, drain connections, deregister</td></tr>
                <tr><td>10</td><td>Dev/Prod Parity</td><td>Keep dev, staging, and prod as similar as possible</td><td>Same Docker image, same infra (Terraform), differ only in config</td></tr>
                <tr><td>11</td><td>Logs</td><td>Treat logs as event streams</td><td>Write to stdout — let the platform collect and aggregate</td></tr>
                <tr><td>12</td><td>Admin Processes</td><td>Run admin/management tasks as one-off processes</td><td>K8s Jobs for migrations, not baked into startup</td></tr>
            </tbody></table>`
        },
        {
            title: 'Sidecar Pattern in Kubernetes',
            mermaid: `graph LR
    subgraph Pod["Kubernetes Pod"]
        direction TB
        MAIN["Main Container<br/>(App: .NET API)"]
        SC1["Sidecar: Envoy Proxy<br/>(mTLS, traffic management)"]
        SC2["Sidecar: Fluentd<br/>(Log collection)"]
        SC3["Sidecar: Vault Agent<br/>(Secret injection)"]
        VOL["Shared Volume<br/>(logs, config)"]
    end

    MAIN -->|"stdout/files"| VOL
    SC2 -->|"reads"| VOL
    SC3 -->|"writes secrets"| VOL
    MAIN -->|"reads secrets"| VOL
    SC1 -->|"intercepts traffic"| MAIN

    CLIENT["External Traffic"] --> SC1
    SC2 --> ELASTIC["Elasticsearch"]
    SC3 --> VAULT["HashiCorp Vault"]`,
            content: `<p>The <strong>Sidecar Pattern</strong> deploys helper containers alongside the main application container within the same Pod. They share the network namespace (localhost) and can share volumes. This extends functionality without modifying application code.</p>
            <p><strong>Common sidecars:</strong></p>
            <ul>
                <li><strong>Service mesh proxy (Envoy/Istio)</strong> — handles mTLS, retries, circuit breaking, and traffic routing transparently.</li>
                <li><strong>Log collector (Fluentd/Fluent Bit)</strong> — ships logs from shared volumes to centralized logging.</li>
                <li><strong>Secret agent (Vault Agent)</strong> — fetches and refreshes secrets, writes them to a shared volume.</li>
                <li><strong>Config reloader</strong> — watches for ConfigMap changes and signals the main container to reload.</li>
            </ul>`,
            code: `# Kubernetes Pod with sidecar containers
apiVersion: v1
kind: Pod
metadata:
  name: order-api
  labels:
    app: order-api
spec:
  containers:
    # Main application container
    - name: order-api
      image: myregistry/order-api:v2.1.0
      ports:
        - containerPort: 8080
      volumeMounts:
        - name: logs
          mountPath: /var/log/app
        - name: secrets
          mountPath: /etc/secrets
          readOnly: true
      env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"

    # Sidecar: Log shipping
    - name: log-shipper
      image: fluent/fluent-bit:2.1
      volumeMounts:
        - name: logs
          mountPath: /var/log/app
          readOnly: true

    # Sidecar: Secret management
    - name: vault-agent
      image: hashicorp/vault:1.15
      args: ["agent", "-config=/etc/vault/agent.hcl"]
      volumeMounts:
        - name: secrets
          mountPath: /etc/secrets

  volumes:
    - name: logs
      emptyDir: {}
    - name: secrets
      emptyDir:
        medium: Memory  # tmpfs - secrets never hit disk`,
            language: 'yaml'
        },
        {
            title: 'Ambassador and Init Container Patterns',
            content: `<p><strong>Ambassador Pattern:</strong> A sidecar that acts as a proxy between the main container and external services. It handles connection pooling, protocol translation, authentication, and service discovery — acting as an "ambassador" to the outside world.</p>
            <p>Example: An ambassador container that handles Redis Cluster topology, presenting a simple localhost:6379 interface to the main container regardless of cluster changes.</p>
            <p><strong>Init Container Pattern:</strong> Containers that run and complete before the main containers start. They perform initialization: database migrations, config fetching, dependency checks, or permission setup.</p>`,
            code: `# Init Container + Ambassador pattern example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  template:
    spec:
      # Init containers run sequentially before main containers
      initContainers:
        # Wait for database to be ready
        - name: wait-for-db
          image: busybox:1.36
          command: ['sh', '-c',
            'until nc -z postgres-svc 5432; do echo waiting; sleep 2; done']

        # Run database migrations
        - name: run-migrations
          image: myregistry/payment-migrations:v2.1.0
          env:
            - name: CONNECTION_STRING
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: connection-string

        # Download config from remote source
        - name: fetch-config
          image: curlimages/curl:8.4.0
          command: ['sh', '-c',
            'curl -o /config/app.json $CONFIG_URL']
          volumeMounts:
            - name: config-vol
              mountPath: /config

      containers:
        # Main application
        - name: payment-api
          image: myregistry/payment-api:v2.1.0
          volumeMounts:
            - name: config-vol
              mountPath: /app/config
              readOnly: true

        # Ambassador: Redis connection pooler
        - name: redis-ambassador
          image: myregistry/redis-proxy:latest
          ports:
            - containerPort: 6379
          env:
            - name: REDIS_CLUSTER_NODES
              value: "redis-0:6379,redis-1:6379,redis-2:6379"

      volumes:
        - name: config-vol
          emptyDir: {}`,
            language: 'yaml'
        },
        {
            title: 'Immutable Infrastructure and Config Externalization',
            content: `<p><strong>Immutable Infrastructure</strong> means servers are never modified after deployment. Instead of patching a running server, you build a new image (AMI, Docker image) and replace the old one. Servers are "cattle, not pets."</p>
            <ul>
                <li><strong>Golden Image / AMI</strong> — a baked, tested, versioned machine image deployed identically everywhere.</li>
                <li><strong>Docker images</strong> — the container equivalent; built once in CI, promoted through environments.</li>
                <li><strong>Benefits:</strong> reproducibility, no configuration drift, easy rollback (just deploy previous image), simplified security patching.</li>
            </ul>
            <p><strong>Config Externalization</strong> separates configuration from the deployable artifact:</p>
            <ul>
                <li><strong>Environment variables</strong> — simplest form, injected at runtime.</li>
                <li><strong>Kubernetes ConfigMaps/Secrets</strong> — mounted as files or injected as env vars, can be updated without redeployment.</li>
                <li><strong>Azure Key Vault / AWS Secrets Manager</strong> — centralized secret storage with access control, rotation, and audit.</li>
                <li><strong>Feature flags (LaunchDarkly, Azure App Configuration)</strong> — runtime behavior changes without deploy.</li>
            </ul>`,
            code: `// C# — Config externalization pattern in ASP.NET Core
var builder = WebApplication.CreateBuilder(args);

// Layer 1: appsettings.json (defaults, baked into image)
// Layer 2: appsettings.{Environment}.json (environment-specific)
// Layer 3: Environment variables (override anything)
// Layer 4: Azure Key Vault (secrets, auto-refreshed)
builder.Configuration
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
    .AddEnvironmentVariables()
    .AddAzureKeyVault(
        new Uri(builder.Configuration["KeyVault:Url"]!),
        new DefaultAzureCredential());

// Bind to strongly-typed options (12-Factor: config in environment)
builder.Services.Configure<DatabaseOptions>(
    builder.Configuration.GetSection("Database"));
builder.Services.Configure<FeatureFlags>(
    builder.Configuration.GetSection("Features"));

// Hot-reload support for feature flags
builder.Services.AddAzureAppConfiguration();
builder.Configuration.AddAzureAppConfiguration(options =>
    options.Connect(connectionString)
           .Select("App:*")
           .ConfigureRefresh(r => r.Register("App:Sentinel").SetCacheExpiration(TimeSpan.FromSeconds(30))));`,
            language: 'csharp'
        },
        {
            title: 'Health Endpoints and Graceful Shutdown',
            content: `<p>Kubernetes uses <strong>probes</strong> to manage container lifecycle:</p>
            <table><thead><tr><th>Probe</th><th>Purpose</th><th>Failure Action</th><th>Example Check</th></tr></thead><tbody>
                <tr><td>Startup</td><td>Has the app finished initializing?</td><td>Restart container</td><td>Can connect to DB and cache</td></tr>
                <tr><td>Readiness</td><td>Can the app serve traffic right now?</td><td>Remove from Service endpoints (no traffic)</td><td>Dependencies healthy, not overloaded</td></tr>
                <tr><td>Liveness</td><td>Is the app still alive (not deadlocked)?</td><td>Restart container</td><td>Simple heartbeat or deadlock detection</td></tr>
            </tbody></table>
            <p><strong>Graceful Shutdown</strong> handles SIGTERM properly:</p>
            <ol>
                <li>Kubernetes sends SIGTERM to the container.</li>
                <li>Simultaneously removes the pod from Service endpoints (no new traffic).</li>
                <li>App stops accepting new requests.</li>
                <li>App drains in-flight requests (complete existing work).</li>
                <li>App closes database connections, flushes buffers.</li>
                <li>App deregisters from service discovery.</li>
                <li>Process exits cleanly. If not exited within terminationGracePeriodSeconds, SIGKILL is sent.</li>
            </ol>`,
            code: `// C# — Graceful shutdown with IHostApplicationLifetime
public class OrderProcessorService : BackgroundService
{
    private readonly IHostApplicationLifetime _lifetime;
    private readonly ILogger<OrderProcessorService> _logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Register shutdown handler
        _lifetime.ApplicationStopping.Register(OnShutdown);

        while (!stoppingToken.IsCancellationRequested)
        {
            var order = await _queue.DequeueAsync(stoppingToken);
            await ProcessOrderAsync(order, stoppingToken);
        }
    }

    private void OnShutdown()
    {
        _logger.LogInformation("Graceful shutdown initiated - draining...");
        // Complete in-flight work, flush buffers, close connections
    }
}

// ASP.NET health check implementation
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database", tags: new[] { "ready" })
    .AddCheck<RedisHealthCheck>("redis", tags: new[] { "ready" })
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: new[] { "live" });

app.MapHealthChecks("/health/live", new() {
    Predicate = check => check.Tags.Contains("live")
});
app.MapHealthChecks("/health/ready", new() {
    Predicate = check => check.Tags.Contains("ready")
});`,
            language: 'csharp'
        },
        {
            title: 'Circuit Breaker and Retry in Cloud-Native Context',
            mermaid: `stateDiagram-v2
    [*] --> Closed
    Closed --> Open : Failure threshold exceeded
    Open --> HalfOpen : Timeout expires
    HalfOpen --> Closed : Probe request succeeds
    HalfOpen --> Open : Probe request fails

    state Closed {
        [*] --> Counting
        Counting : Requests pass through
        Counting : Failures counted
    }

    state Open {
        [*] --> Rejecting
        Rejecting : Requests immediately fail
        Rejecting : No load on downstream
    }

    state HalfOpen {
        [*] --> Probing
        Probing : Limited requests pass through
        Probing : Testing if downstream recovered
    }`,
            content: `<p>In distributed cloud-native systems, downstream services will fail. <strong>Circuit breakers</strong> prevent cascading failures by short-circuiting calls to unhealthy services.</p>
            <p><strong>Retry with backoff</strong> handles transient failures (network blips, brief overloads). <strong>Circuit breaker</strong> handles sustained failures (service down, overloaded). Used together: retry for transient issues, circuit breaker to stop retrying when the downstream is clearly broken.</p>`,
            code: `// C# — Polly v8 resilience pipeline (circuit breaker + retry)
builder.Services.AddHttpClient<IPaymentGateway, PaymentGatewayClient>()
    .AddResilienceHandler("payment-pipeline", pipeline =>
    {
        // Retry: handle transient failures with exponential backoff
        pipeline.AddRetry(new RetryStrategyOptions<HttpResponseMessage>
        {
            MaxRetryAttempts = 3,
            Delay = TimeSpan.FromMilliseconds(200),
            BackoffType = DelayBackoffType.Exponential,
            UseJitter = true,  // Prevent thundering herd
            ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                .Handle<HttpRequestException>()
                .HandleResult(r => r.StatusCode >= HttpStatusCode.InternalServerError)
        });

        // Circuit Breaker: stop calling when downstream is clearly broken
        pipeline.AddCircuitBreaker(new CircuitBreakerStrategyOptions<HttpResponseMessage>
        {
            FailureRatio = 0.5,          // 50% failure rate
            SamplingDuration = TimeSpan.FromSeconds(30),
            MinimumThroughput = 10,       // Need 10+ calls to evaluate
            BreakDuration = TimeSpan.FromSeconds(30),
            ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                .Handle<HttpRequestException>()
                .HandleResult(r => r.StatusCode >= HttpStatusCode.InternalServerError)
        });

        // Timeout: don't wait forever
        pipeline.AddTimeout(TimeSpan.FromSeconds(5));
    });`,
            language: 'csharp'
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Treating cloud VMs like pets</strong> — SSH in to fix issues instead of rebuilding from the image. Destroys reproducibility and creates snowflake servers.</li>
                <li><strong>Storing state locally</strong> — writing to local disk or in-memory without replication. Pod reschedule = data loss.</li>
                <li><strong>No graceful shutdown</strong> — ignoring SIGTERM causes dropped requests during deployments and scaling events.</li>
                <li><strong>Liveness probe too aggressive</strong> — checking dependencies in liveness (not readiness) causes restart loops when a DB blip affects all pods.</li>
                <li><strong>Retrying without backoff</strong> — immediate retries amplify load on an already struggling service (retry storm).</li>
                <li><strong>Config baked into images</strong> — rebuilding and redeploying to change a feature flag or connection string. Violates factor 3 (config in environment).</li>
                <li><strong>No circuit breaker</strong> — one slow downstream cascades timeouts through the entire call chain, exhausting thread pools everywhere.</li>
                <li><strong>Startup probe missing</strong> — slow-starting apps get killed by liveness before they finish initializing.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li><strong>12-Factor fluency</strong> — don't just list them; explain which ones you've violated and what pain it caused</li>
                    <li><strong>Pattern trade-offs</strong> — sidecars add latency and resource overhead; explain when NOT to use them</li>
                    <li><strong>Probe design</strong> — know the difference between liveness (is it alive?) and readiness (can it serve?) and what breaks if you confuse them</li>
                    <li><strong>Graceful shutdown specifics</strong> — mention SIGTERM, drain period, terminationGracePeriodSeconds, and the race condition with endpoint removal</li>
                    <li><strong>Real failure stories</strong> — "We had a retry storm that DDoS'd our own payment service" is more convincing than textbook answers</li>
                    <li><strong>Immutability conviction</strong> — strong opinions about never SSHing into production, never patching in place</li>
                    <li><strong>Config hierarchy</strong> — show you understand layered config (defaults → environment → secrets) and when to use each</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>12-Factor App provides the foundation — stateless processes, config in environment, logs as streams, disposable instances.</li>
                <li>Sidecars extend functionality without modifying application code — but add resource overhead and operational complexity.</li>
                <li>Init containers handle initialization (migrations, config fetching) that must complete before the app starts.</li>
                <li>Immutable infrastructure eliminates drift — build a new image, don't patch the running one.</li>
                <li>Health probes: Liveness = "restart me if I'm dead," Readiness = "don't send traffic until I'm ready," Startup = "give me time to initialize."</li>
                <li>Graceful shutdown prevents dropped requests — handle SIGTERM, drain connections, exit cleanly within the grace period.</li>
                <li>Circuit breakers prevent cascading failures; retries with jittered backoff handle transient issues without amplifying load.</li>
                <li>Externalize all configuration — the same image should run in dev, staging, and production with only config differences.</li>
            </ul>`
        }
    ],
    questions: [
        {
            question: 'Explain the 12-Factor App methodology. Which factors are most commonly violated, and what are the consequences?',
            difficulty: 'medium',
            answer: `<p>The 12-Factor App defines principles for building portable, scalable cloud-native applications. The most commonly violated factors:</p>
            <ul>
                <li><strong>Factor 3 (Config)</strong> — hardcoding connection strings or secrets in code. Consequence: different builds per environment, secrets in source control, requires rebuild for config changes.</li>
                <li><strong>Factor 6 (Processes/Stateless)</strong> — storing session state in local memory. Consequence: sticky sessions required, can't scale horizontally, pod reschedule loses state.</li>
                <li><strong>Factor 9 (Disposability)</strong> — no graceful shutdown. Consequence: dropped requests during deployments, data corruption if writes are interrupted.</li>
                <li><strong>Factor 11 (Logs)</strong> — writing to local files instead of stdout. Consequence: logs lost when container dies, can't aggregate across instances.</li>
            </ul>`,
            interviewTip: 'Don\'t just recite all 12 — pick 3-4 you have personally violated or seen violated, explain the pain it caused, and how you fixed it. Real experience is more convincing than memorization.',
            followUp: ['How does Factor 4 (Backing Services) apply to database migration?', 'What is the relationship between Factor 10 (Dev/Prod Parity) and Docker?', 'How do you handle Factor 6 with WebSocket connections?'],
            seniorPerspective: 'The factors I enforce most strictly: Config (3) via environment variables + Key Vault, Stateless (6) via Redis for distributed state, and Disposability (9) via proper SIGTERM handling. These three eliminate 80% of deployment issues.',
            architectPerspective: 'The 12 Factors are not rules to memorize but principles that emerge from operating at scale. Violating them works fine at small scale; the pain appears when you need to scale horizontally, deploy frequently, or run in multiple regions. They are the "why" behind cloud-native tooling.'
        },
        {
            question: 'What is the Sidecar pattern? Give three real-world examples and explain the trade-offs.',
            difficulty: 'medium',
            answer: `<p>The <strong>Sidecar pattern</strong> deploys a helper container alongside the main application container in the same Kubernetes pod. They share the network namespace (communicate via localhost) and can share volumes. The sidecar extends or enhances the main container without modifying its code.</p>
            <p><strong>Real-world examples:</strong></p>
            <ol>
                <li><strong>Envoy proxy (Istio mesh)</strong> — intercepts all traffic for mTLS, routing, retries, and observability. Main app talks to localhost; Envoy handles the network complexity.</li>
                <li><strong>Vault Agent</strong> — authenticates with HashiCorp Vault, fetches secrets, writes them to a shared volume or injects as env vars. Main app reads secrets without knowing about Vault.</li>
                <li><strong>Fluent Bit log shipper</strong> — tails log files from a shared volume and ships them to Elasticsearch/CloudWatch. Main app just writes to a file.</li>
            </ol>
            <p><strong>Trade-offs:</strong> Adds resource overhead (CPU/memory per sidecar per pod), increases pod startup time, creates operational complexity (sidecar version management), and adds network latency for proxying sidecars.</p>`,
            interviewTip: 'Mention that sidecars are being partially replaced by newer approaches: eBPF-based service meshes (Cilium) that avoid the proxy overhead, and Kubernetes native sidecar containers (1.28+) that have proper lifecycle ordering.',
            followUp: ['How do Kubernetes 1.28 native sidecars differ from the traditional pattern?', 'When would you NOT use a sidecar?', 'How does resource accounting work for sidecars?'],
            seniorPerspective: 'I use sidecars judiciously — Envoy for service mesh is table stakes in large deployments, but I avoid adding sidecars for things the app can do itself efficiently (basic HTTP calls, simple config). Each sidecar adds ~50-100MB memory per pod at scale.',
            architectPerspective: 'The sidecar pattern is about separation of concerns at the infrastructure level. The application team owns business logic; the platform team owns the mesh proxy, secret injection, and log shipping. This organizational boundary is the real reason for sidecars, not just technical convenience.'
        },
        {
            question: 'Explain Kubernetes liveness, readiness, and startup probes. What happens if you misconfigure them?',
            difficulty: 'medium',
            answer: `<p><strong>Liveness probe</strong> — "Is the container still running correctly?" Failure → Kubernetes restarts the container. Should check for unrecoverable states (deadlocks, hung processes), NOT downstream dependencies.</p>
            <p><strong>Readiness probe</strong> — "Can this container serve traffic right now?" Failure → pod removed from Service endpoints (no traffic sent). Should check downstream dependencies (DB, cache). Pod stays running but doesn't receive requests.</p>
            <p><strong>Startup probe</strong> — "Has the container finished initializing?" Failure → restart container. Suspends liveness/readiness probes until it passes. Use for slow-starting apps to avoid premature liveness kills.</p>
            <p><strong>Misconfiguration consequences:</strong></p>
            <ul>
                <li>Liveness checks DB → DB blip restarts ALL pods → cascading failure and complete outage.</li>
                <li>No startup probe on slow app → liveness kills container before it initializes → crash loop.</li>
                <li>Readiness always passes → traffic sent to unready pod → user errors.</li>
            </ul>`,
            interviewTip: 'The key insight: liveness should NEVER check external dependencies. If your DB goes down and liveness checks the DB, Kubernetes will restart all your pods simultaneously — turning a DB issue into a complete service outage. Keep liveness simple (can the process respond at all?).',
            followUp: ['What should a liveness endpoint actually check?', 'How do initialDelaySeconds and failureThreshold interact?', 'How do probes interact with rolling deployments?'],
            seniorPerspective: 'My standard pattern: liveness is a trivial "return 200" (proving the process is not deadlocked), readiness checks DB + cache + critical dependencies, and startup probe has generous timeout for cold starts. This prevents the most common probe-related outages.',
            architectPerspective: 'Probe design is a reliability engineering concern. The probe contract defines what "healthy" means at each level. Get it wrong and your orchestrator becomes your adversary — restarting healthy pods or routing to unhealthy ones.'
        },
        {
            question: 'How do you implement graceful shutdown in a Kubernetes environment? Describe the SIGTERM handling sequence.',
            difficulty: 'hard',
            answer: `<p>When Kubernetes terminates a pod (scaling down, rolling update, node drain), the sequence is:</p>
            <ol>
                <li><strong>Pod marked for termination</strong> — kubelet receives the delete signal.</li>
                <li><strong>Simultaneous actions:</strong> (a) SIGTERM sent to containers, (b) pod removed from Service endpoints.</li>
                <li><strong>Race condition:</strong> Some in-flight requests may still arrive briefly (endpoint removal propagation delay). Add a small sleep (3-5s) before stopping the listener.</li>
                <li><strong>Application handles SIGTERM:</strong> stops accepting new connections, completes in-flight requests, closes DB connections, flushes metrics/logs.</li>
                <li><strong>Clean exit</strong> — process exits with code 0 within terminationGracePeriodSeconds (default 30s).</li>
                <li><strong>SIGKILL</strong> — if process hasn't exited by the grace period, it's forcefully killed.</li>
            </ol>
            <p>The preStop hook can add a deliberate delay to handle the endpoint propagation race condition.</p>`,
            interviewTip: 'The race condition between SIGTERM and endpoint removal is the advanced insight interviewers look for. Mention the preStop sleep hack and explain why it exists (kube-proxy/ingress controller may still route traffic briefly after SIGTERM).',
            followUp: ['What is terminationGracePeriodSeconds and how do you size it?', 'How does a preStop hook help with the race condition?', 'What happens to database transactions during shutdown?'],
            seniorPerspective: 'I always add a preStop hook with a 5-second sleep to handle the endpoint propagation race, set terminationGracePeriodSeconds to at least 60s for services with long-running requests, and ensure the app drains its connection pool and flushes any buffered writes before exiting.',
            architectPerspective: 'Graceful shutdown is what separates "works in demo" from "works in production." Every rolling deployment, every scale-down event, and every node maintenance triggers it. If your app drops requests during these events, you do not have zero-downtime deployments regardless of what your strategy says.'
        },
        {
            question: 'What is immutable infrastructure? How does it differ from traditional server management?',
            difficulty: 'easy',
            answer: `<p><strong>Immutable infrastructure</strong> means servers/containers are never modified after deployment. If a change is needed (patch, config update, new code), you build a completely new image and replace the old instance. The running instance is treated as disposable ("cattle, not pets").</p>
            <p><strong>Traditional (mutable):</strong> SSH into a server, install patches, edit config files, restart services. Each server becomes unique over time ("snowflake servers") with undocumented changes.</p>
            <p><strong>Benefits of immutable:</strong> No configuration drift (every instance is identical), easy rollback (deploy previous image), reproducible environments, simplified security (replace instead of patch in place), and confidence that what you tested is what runs in production.</p>`,
            interviewTip: 'Use the "cattle vs pets" metaphor — pets have names, get nursed back to health; cattle have numbers and get replaced. Mention that Docker images and golden AMIs are the implementation of this principle.',
            followUp: ['How do you handle urgent security patches with immutable infrastructure?', 'What role does a CI/CD pipeline play in immutability?', 'How do you debug issues if you cannot SSH into production?'],
            seniorPerspective: 'I enforce immutability by removing SSH access from production entirely (use kubectl exec or SSM Session Manager for emergency debugging). The pipeline is the only path to production. This eliminates "works on my machine" and the fear of undocumented manual changes.',
            architectPerspective: 'Immutability is a prerequisite for reliable automation. If humans can modify production servers, you cannot trust that your declared state matches reality. GitOps and infrastructure-as-code only work if the running state matches the committed state — which requires immutability.'
        },
        {
            question: 'Explain the circuit breaker pattern. How does it differ from retries, and how do they work together?',
            difficulty: 'hard',
            answer: `<p><strong>Retries</strong> handle transient failures — brief network blips or temporary unavailability. They assume the issue will resolve quickly and try again with exponential backoff.</p>
            <p><strong>Circuit breaker</strong> handles sustained failures — when a downstream service is clearly broken. It tracks failure rate and "opens" the circuit (fast-fails all requests) when a threshold is exceeded. After a timeout, it enters "half-open" state and lets one request through to test recovery.</p>
            <p><strong>Together:</strong> Retries handle the first few failures (transient). If failures persist past the circuit breaker threshold, the circuit opens and stops all requests immediately — preventing retry storms from overwhelming the downstream and exhausting caller resources (threads, connections).</p>
            <p><strong>States:</strong> Closed (normal) → Open (fast-fail) → Half-Open (testing recovery) → Closed (recovered).</p>`,
            interviewTip: 'Show you understand the failure amplification problem: without a circuit breaker, N callers each retrying 3 times create 3N requests to an already struggling service, making it worse. The circuit breaker stops this cascade. Mention jitter on retries to prevent thundering herd.',
            followUp: ['What metrics do you monitor to tune circuit breaker thresholds?', 'How does the bulkhead pattern complement circuit breakers?', 'What fallback strategies do you use when the circuit is open?'],
            seniorPerspective: 'I configure circuit breakers on every external HTTP dependency with Polly in .NET. The key tuning: failure ratio threshold (usually 50%), sampling window (30s), and break duration (30s). I always add a fallback — cached response, degraded response, or clear error message.',
            architectPerspective: 'Resilience patterns form a hierarchy: timeouts prevent indefinite waiting, retries handle transient issues, circuit breakers prevent cascade, and bulkheads isolate failures to one dependency. A well-designed system uses all four layers, each addressing a different failure mode.'
        },
        {
            question: 'How do you externalize configuration in a Kubernetes/cloud environment? Describe the layers and precedence.',
            difficulty: 'medium',
            answer: `<p>Configuration externalization follows a layered approach with increasing specificity and sensitivity:</p>
            <ol>
                <li><strong>Defaults in code</strong> — sensible defaults baked into appsettings.json (lowest precedence).</li>
                <li><strong>Environment-specific files</strong> — appsettings.Production.json for non-sensitive environment config.</li>
                <li><strong>ConfigMaps</strong> — Kubernetes-native config injected as env vars or mounted files. Version-controlled, environment-specific.</li>
                <li><strong>Environment variables</strong> — override any file-based config. Set in deployment manifests or from ConfigMaps.</li>
                <li><strong>Secrets (K8s Secrets, Key Vault, AWS Secrets Manager)</strong> — highest precedence, encrypted at rest, access-controlled, audited.</li>
            </ol>
            <p>The principle: the same container image runs everywhere. Only the externalized config differs between dev, staging, and production.</p>`,
            interviewTip: 'Emphasize the separation: non-sensitive config in ConfigMaps (version-controlled, visible), sensitive config in Secrets/Key Vault (encrypted, access-controlled). Never put secrets in ConfigMaps or environment variables visible in pod specs.',
            followUp: ['How do you handle config changes without pod restart?', 'How does sealed-secrets or external-secrets-operator work?', 'What is the reloader pattern for ConfigMap changes?'],
            seniorPerspective: 'I use ConfigMaps for feature flags and non-sensitive config (can be hot-reloaded with Reloader), and Azure Key Vault with CSI driver for secrets. The app reads secrets from a mounted volume — no environment variable exposure in pod specs.',
            architectPerspective: 'Config management is a supply chain security concern. The blast radius of a compromised secret depends on how it is stored and accessed. Centralized secret stores with rotation, least-privilege access, and audit logging are non-negotiable for production systems.'
        },
        {
            question: 'Design a cloud-native deployment that handles zero-downtime updates. What patterns would you use?',
            difficulty: 'advanced',
            answer: `<p>Zero-downtime deployment requires multiple patterns working together:</p>
            <ul>
                <li><strong>Rolling update strategy</strong> — maxSurge: 25%, maxUnavailable: 0% (always have full capacity during rollout).</li>
                <li><strong>Readiness probes</strong> — new pods only receive traffic after they're confirmed healthy. Prevents routing to initializing instances.</li>
                <li><strong>Graceful shutdown</strong> — old pods drain connections before terminating. preStop hook adds delay for endpoint propagation.</li>
                <li><strong>PodDisruptionBudget</strong> — guarantees minimum available replicas even during node drains.</li>
                <li><strong>Backward-compatible changes</strong> — new code must handle old data formats and vice versa (during rollout, both versions run simultaneously).</li>
                <li><strong>Database migrations</strong> — expand/contract pattern: add new columns first (expand), deploy code that uses them, then remove old columns later (contract).</li>
            </ul>`,
            interviewTip: 'The key insight: during a rolling update, BOTH old and new versions serve traffic simultaneously. This means API contracts, database schemas, and message formats must be backward compatible. This is where most zero-downtime deployments actually break.',
            followUp: ['How does blue-green deployment differ from rolling update?', 'What is the expand/contract pattern for database migrations?', 'How do you handle breaking API changes with zero downtime?'],
            seniorPerspective: 'The most common zero-downtime failure I see: database schema changes that break the old version still running during rollout. I enforce the expand/contract pattern and run both versions in staging to verify compatibility before production.',
            architectPerspective: 'Zero-downtime is a system-level property, not a deployment-level one. It requires backward-compatible APIs, additive-only schema changes during rollout, proper draining, and tested rollback. The deployment strategy is just the last piece of a larger compatibility discipline.'
        },
        {
            question: 'What are Init Containers and when would you use them instead of startup logic in the main container?',
            difficulty: 'medium',
            answer: `<p><strong>Init Containers</strong> run sequentially before any main containers start. They must complete successfully (exit 0) for the pod to proceed. If an init container fails, Kubernetes restarts the pod (applying the restart policy).</p>
            <p><strong>Use init containers when:</strong></p>
            <ul>
                <li>Waiting for a dependency to be available (DB ready, config service up).</li>
                <li>Running database migrations before the app starts.</li>
                <li>Fetching remote config or secrets to a shared volume.</li>
                <li>Setting up file permissions or directory structures.</li>
                <li>Using tools/utilities not needed (and not wanted) in the main image.</li>
            </ul>
            <p><strong>Advantages over startup logic:</strong> Can use different images (specialized tools), don't bloat the main container, run with different security contexts, and provide clear lifecycle separation (init failure is distinct from app failure).</p>`,
            interviewTip: 'Emphasize the security angle: init containers can run as root to set up volumes/permissions, then the main container runs as non-root. They can also contain migration tools without increasing the attack surface of the production image.',
            followUp: ['How do init containers interact with pod restart policies?', 'Can init containers share data with main containers?', 'What happens if an init container has a bug and always fails?'],
            seniorPerspective: 'I use init containers for two primary things: waiting for dependencies (avoids putting retry logic in the app) and running migrations (keeps migration tooling out of the production image). The clear lifecycle boundary makes debugging straightforward.',
            architectPerspective: 'Init containers embody the single-responsibility principle at the container level. Each initialization concern gets its own container with its own image, security context, and failure mode. This composability is a key advantage of the container model over monolithic processes.'
        },
        {
            question: 'Compare the Ambassador pattern with an API Gateway. When would you choose each?',
            difficulty: 'hard',
            answer: `<p><strong>Ambassador (sidecar)</strong> runs as a container alongside each service instance in the pod. It handles per-service concerns: connection pooling to a specific backing service, protocol translation, or client-side load balancing. It is decentralized — each pod has its own.</p>
            <p><strong>API Gateway</strong> is a centralized, shared infrastructure component at the system edge. It handles cross-cutting concerns: authentication, rate limiting, request routing, API versioning, and aggregation across multiple backend services.</p>
            <p><strong>Choose Ambassador:</strong> When a specific service needs a local proxy for a complex backing service (Redis Cluster, legacy protocol translation), and the concern is specific to that service.</p>
            <p><strong>Choose API Gateway:</strong> For cross-cutting concerns that apply to all services (auth, rate limiting, request logging) and external traffic management.</p>`,
            interviewTip: 'The distinction is scope: ambassador is per-service and decentralized; API gateway is system-wide and centralized. In practice, many architectures use both: API Gateway at the edge for external traffic, and ambassador/sidecar proxies for internal service-to-service communication.',
            followUp: ['How does a service mesh relate to the ambassador pattern?', 'What are the downsides of a centralized API Gateway?', 'Can you give an example of protocol translation with an ambassador?'],
            seniorPerspective: 'I use an API Gateway (Kong, Azure API Management) for the external boundary and Istio sidecars for internal mesh communication. The gateway handles external concerns (API keys, throttling, versioning) while the mesh handles internal concerns (mTLS, retries, observability).',
            architectPerspective: 'The ambassador pattern is the building block; the service mesh is the pattern at scale. When every service has an ambassador proxy managed by a control plane, you have a service mesh. The architectural question is whether that level of infrastructure investment is justified by your service count and team structure.'
        }
    ]
});
