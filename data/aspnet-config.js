/* ═══════════════════════════════════════════════════════════════════
   ASP.NET Core — Configuration, Logging, Health Checks
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('aspnet-config', {
    title: 'Configuration & Logging',
    description: 'IConfiguration, Options pattern, structured logging with Serilog, health checks, and configuration best practices for cloud-native .NET applications.',
    sections: [
        {
            title: 'Configuration & Options Pattern',
            content: `<p>ASP.NET Core configuration is layered — multiple sources merged with later sources overriding earlier ones. The Options pattern provides strongly-typed access with validation.</p>`,
            code: `// Configuration sources (in override order):
// 1. appsettings.json (base)
// 2. appsettings.{Environment}.json (per-environment override)
// 3. User Secrets (development only)
// 4. Environment variables (deployment override)
// 5. Command-line arguments (highest priority)
// 6. Azure Key Vault / App Configuration (cloud secrets)

// Strongly-typed options:
public class DatabaseOptions
{
    public string ConnectionString { get; set; } = "";
    public int MaxRetryCount { get; set; } = 3;
    public int CommandTimeoutSeconds { get; set; } = 30;
}

// Registration with validation:
builder.Services.AddOptions<DatabaseOptions>()
    .BindConfiguration("Database")
    .ValidateDataAnnotations()
    .ValidateOnStart(); // Fail at startup, not first request!

// Health checks — readiness probes for K8s/load balancers:
builder.Services.AddHealthChecks()
    .AddSqlServer(config["Database:ConnectionString"]!, name: "sql")
    .AddRedis(config["Redis:Connection"]!, name: "redis")
    .AddUrlGroup(new Uri("https://payment-api.com/health"), name: "payment-api");

app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready");`,
            language: 'csharp'
        },
        {
            title: 'Structured Logging with Serilog',
            content: `<p><strong>Structured logging</strong> captures log data as queryable key-value pairs rather than plain text. Combined with Serilog and a log aggregator (Seq, Elasticsearch, Application Insights), it enables powerful search and correlation.</p>`,
            code: `// Serilog setup:
builder.Host.UseSerilog((context, config) => config
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "OrderAPI")
    .Enrich.WithProperty("Environment", context.HostingEnvironment.EnvironmentName)
    .WriteTo.Console()
    .WriteTo.ApplicationInsights(TelemetryConverter.Traces));

// Structured logging (properties, not string interpolation!):
// BAD: _logger.LogInformation($"Order {orderId} placed by {userId} for {total}");
// GOOD:
_logger.LogInformation("Order {OrderId} placed by {UserId} for {Total}", 
    orderId, userId, total);
// Result in log store: { OrderId: 123, UserId: 456, Total: 99.99 }
// Searchable: WHERE OrderId = 123 AND Total > 50

// High-performance logging with source generators:
public static partial class Log
{
    [LoggerMessage(Level = LogLevel.Information, 
        Message = "Order {OrderId} placed by {UserId} for {Total:C}")]
    public static partial void OrderPlaced(ILogger logger, int orderId, int userId, decimal total);
}
// Zero-allocation, compiled at build time, 3x faster than string-based

// Correlation across services:
// Serilog.Enrichers.Span adds TraceId/SpanId automatically
// All logs for one request share the same TraceId — search by trace!`,
            language: 'csharp'
        }
    ],
    questions: [
        {"question":"How does configuration work in ASP.NET Core, and what is the provider precedence?","difficulty":"medium","answer":"<p>Configuration is layered from multiple <strong>providers</strong> merged into one key/value store: appsettings.json, appsettings.{Environment}.json, user secrets (Development), environment variables, and command-line args. Later providers <strong>override</strong> earlier ones, so environment variables and command-line args win over JSON files — enabling per-environment overrides without code changes.</p><p>Access it via <code>IConfiguration</code> or, preferably, strongly-typed <strong>options</strong> (<code>IOptions&lt;T&gt;</code>) bound with <code>services.Configure&lt;T&gt;()</code>. This follows 12-Factor \"config in the environment\".</p>","explanation":"Config is a stack of transparent sheets; the top sheet (env vars/CLI) shows through where it has values, overriding the sheets beneath (JSON files) — so the same app adapts per environment.","bestPractices":["Bind config to strongly-typed options classes","Keep secrets out of appsettings; use user secrets/Key Vault","Override per-environment via env vars, not code"],"commonMistakes":["Hardcoding environment-specific values","Putting secrets in appsettings.json committed to git","Reading raw strings everywhere instead of typed options"],"interviewTip":"State the precedence (later providers override; env/CLI beat JSON) and prefer IOptions<T> + secrets manager.","followUp":["What is the difference between IOptions, IOptionsSnapshot, IOptionsMonitor?","How do user secrets work?","How do you validate options at startup?"]},
        {"question":"What is the difference between IOptions, IOptionsSnapshot, and IOptionsMonitor?","difficulty":"hard","answer":"<p><strong>IOptions&lt;T&gt;</strong> is a singleton computed once — values are fixed for the app lifetime and do not reflect changes. <strong>IOptionsSnapshot&lt;T&gt;</strong> is scoped — recomputed per request, so it picks up config changes and supports named options (good for request-scoped services). <strong>IOptionsMonitor&lt;T&gt;</strong> is a singleton that supports live change notifications (<code>OnChange</code>) and current-value reads — ideal for singletons that must react to config reloads.</p><p>Rule: singletons needing fresh config use IOptionsMonitor; per-request consumers use IOptionsSnapshot; static config uses IOptions.</p>","explanation":"IOptions is a printed booklet handed out once. IOptionsSnapshot is a fresh printout each visit. IOptionsMonitor is a live dashboard that pings you when a value changes.","bestPractices":["IOptions for static config","IOptionsSnapshot for per-request/reloadable scoped consumers","IOptionsMonitor for singletons reacting to changes"],"commonMistakes":["Injecting IOptionsSnapshot into a singleton (lifetime mismatch)","Expecting IOptions to reflect config reloads","Not validating options, failing at runtime not startup"],"interviewTip":"Map each to lifetime/reload behavior: IOptions=fixed singleton, Snapshot=per-request, Monitor=singleton with change notifications.","followUp":["How do you validate options at startup (ValidateOnStart)?","What are named options?","Why can you not inject IOptionsSnapshot into a singleton?"]},
        {
            question: 'What is structured logging and why is it better than plain text logging?',
            difficulty: 'easy',
            answer: `<p><strong>Structured logging</strong> captures log events as queryable key-value properties rather than flat text strings. Instead of "Order 123 placed by user 456", you get structured data: {OrderId: 123, UserId: 456, Event: "OrderPlaced"}. This enables: filtering by property (show all logs for OrderId=123), aggregation (count errors by UserId), correlation (trace a request across services), and alerting on specific patterns.</p>`,
            bestPractices: ['Use message templates with named placeholders: Log("{OrderId} placed", orderId)', 'Enrich logs with context (service name, environment, trace ID)', 'Use LoggerMessage source generator for hot-path logging (zero allocation)', 'Send structured logs to a searchable store (Seq, Elasticsearch, App Insights)'],
            commonMistakes: ['String interpolation in log messages ($"Order {id}") — loses structure', 'Logging sensitive data (passwords, tokens, PII) — always redact', 'Excessive logging in hot paths (performance impact from serialization)', 'Not correlating logs with trace IDs (impossible to follow requests across services)'],
            interviewTip: 'Show the before/after: plain text log is unsearchable grep fodder. Structured log enables: "show me all orders > $100 that failed in the last hour grouped by error type." This is the difference between debugging and observability.',
            followUp: ['How does log correlation work across microservices?', 'What is the LoggerMessage source generator?', 'How do you handle log levels in production vs development?'],
            seniorPerspective: 'I configure Serilog with: structured JSON output, Application Insights sink, request logging middleware (one log per request with status/duration), and environment enrichment. Every service gets this template — observability is not optional.',
            architectPerspective: 'Structured logging is the foundation of observability. Without it, diagnosing production issues in distributed systems is guesswork. I enforce: consistent log schema across services, mandatory correlation IDs, automated alerting on error patterns, and log retention policies that balance cost with debugging needs.'
        },
        {
            question: 'Explain the difference between IOptions<T>, IOptionsSnapshot<T>, and IOptionsMonitor<T>. When would you use each?',
            difficulty: 'hard',
            answer: `<p>All three expose strongly-typed configuration, but they differ in <strong>lifetime</strong> and <strong>reload behavior</strong>:</p>
            <ul>
                <li><code>IOptions&lt;T&gt;</code> — singleton, computed once on first access and cached for the application lifetime. It does <strong>not</strong> reflect configuration changes after startup. Safe to inject anywhere, including singletons.</li>
                <li><code>IOptionsSnapshot&lt;T&gt;</code> — scoped, recomputed once per request (per scope). It picks up <code>reloadOnChange</code> updates between requests and supports named options. Cannot be injected into a singleton (lifetime mismatch).</li>
                <li><code>IOptionsMonitor&lt;T&gt;</code> — singleton that always returns the current value via <code>CurrentValue</code> and exposes <code>OnChange</code> notifications. This is the only option safe for live-reloading config inside singletons and background services.</li>
            </ul>
            <p>Use <code>IOptions</code> for static config bound at startup, <code>IOptionsSnapshot</code> for per-request config in controllers/scoped services, and <code>IOptionsMonitor</code> in singletons/hosted services that must react to changes at runtime.</p>`,
            explanation: 'Think of a printed menu (IOptions) fixed when the restaurant opens, a fresh menu printed for each table (IOptionsSnapshot), and a digital board that updates live for everyone (IOptionsMonitor).',
            code: `// Singleton background worker must use IOptionsMonitor to see live changes
public class QueueWorker : BackgroundService
{
    private readonly IOptionsMonitor<QueueOptions> _options;
    public QueueWorker(IOptionsMonitor<QueueOptions> options)
    {
        _options = options;
        _options.OnChange(o =>
            Console.WriteLine($"Config reloaded: batch size now {o.BatchSize}"));
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var batchSize = _options.CurrentValue.BatchSize; // always current
            await ProcessBatchAsync(batchSize, ct);
            await Task.Delay(_options.CurrentValue.PollInterval, ct);
        }
    }
}

// Controller picks up per-request values via IOptionsSnapshot
public class FeatureController(IOptionsSnapshot<FeatureOptions> opts) : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(opts.Value.EnableBeta);
}`,
            language: 'csharp',
            bestPractices: ['Inject IOptionsMonitor into singletons and IHostedService implementations', 'Use IOptionsSnapshot for scoped/per-request reads that should reflect reloads', 'Prefer IOptions<T>.Value for config that never changes after startup', 'Debounce or guard OnChange callbacks — the file watcher can fire multiple times for one save'],
            commonMistakes: ['Injecting IOptionsSnapshot into a singleton — throws or silently captures a stale scope', 'Assuming IOptions<T> reloads on appsettings change (it never does)', 'Capturing options.Value once in a singleton constructor, losing live updates', 'Forgetting OnChange can fire twice; not making the handler idempotent'],
            interviewTip: 'Anchor the answer on lifetime: the reason you cannot inject IOptionsSnapshot into a singleton is the classic captive-dependency problem — name that explicitly.',
            followUp: ['Why can a singleton not depend on a scoped service?', 'How does reloadOnChange detect file changes?', 'How do named options work with these interfaces?'],
            seniorPerspective: 'On a high-throughput service I default to IOptions for anything bound at startup because snapshot recomputation per request adds measurable allocation under load. I only reach for Snapshot/Monitor when a genuine runtime-reload requirement exists, and I document which config keys are hot-reloadable so ops knows what a config push will and will not affect.',
            architectPerspective: 'Live config reload is a double-edged sword: it removes a deploy but introduces a class of bugs where two instances run different config mid-request. For anything that changes behavior contracts I prefer immutable config with a controlled rollout (deploy/restart) over hot reload, reserving IOptionsMonitor for operational toggles like batch sizes, log levels, and feature flags.'
        },
        {
            question: 'How do you implement liveness vs readiness health checks in ASP.NET Core, and why does the distinction matter for Kubernetes?',
            difficulty: 'medium',
            answer: `<p>ASP.NET Core health checks are registered via <code>AddHealthChecks()</code> and exposed with <code>MapHealthChecks</code>. The key is tagging checks and using a <strong>predicate</strong> to expose different sets at different endpoints:</p>
            <ul>
                <li><strong>Liveness</strong> (<code>/health/live</code>) — answers "is the process alive and not deadlocked?" It must <strong>not</strong> check dependencies. If it fails, Kubernetes <strong>restarts</strong> the pod.</li>
                <li><strong>Readiness</strong> (<code>/health/ready</code>) — answers "can this instance serve traffic right now?" It checks downstream dependencies (DB, cache, queue). If it fails, Kubernetes <strong>removes the pod from the load balancer</strong> but does not restart it.</li>
            </ul>
            <p>Mixing them is dangerous: if liveness checks the database, a transient DB outage triggers a restart storm across every pod, turning a recoverable blip into an outage.</p>`,
            explanation: 'Liveness is a pulse check (restart if dead). Readiness is asking "are you ready for customers?" (hold the queue if not). You restart someone who fainted, you do not restart someone who is just busy.',
            code: `builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"])
    .AddSqlServer(cfg["Db:Conn"]!, name: "sql", tags: ["ready"])
    .AddRedis(cfg["Redis:Conn"]!, name: "redis", tags: ["ready"]);

// Liveness: only the "live" tag, no dependency checks
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("live")
});

// Readiness: dependency checks tagged "ready"
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});`,
            language: 'csharp',
            bestPractices: ['Keep liveness cheap and dependency-free so it never causes restart storms', 'Tag checks and filter by predicate rather than building separate registrations', 'Set sensible failureThreshold/period on the probes so transient blips do not flap', 'Add a startup probe for slow-booting apps so liveness does not kill them during warmup'],
            commonMistakes: ['Checking the database in the liveness probe (one DB hiccup restarts the whole fleet)', 'Returning 200 for everything, defeating the purpose of readiness gating', 'Forgetting to add a startup probe, so slow EF migrations trip liveness on boot', 'Heavy health checks that hammer dependencies on every probe interval'],
            interviewTip: 'The strongest signal is explaining the failure mode: a dependency in the liveness probe converts a transient outage into a cascading restart loop. Say that out loud.',
            followUp: ['What is a Kubernetes startup probe and when do you need it?', 'How do you avoid health checks overloading a shared database?', 'How would you cache health check results?'],
            seniorPerspective: 'I cache expensive readiness checks for a few seconds so that with dozens of pods probing every 5s we are not opening a connection storm against SQL. I also make readiness reflect circuit-breaker state — if the breaker to a critical dependency is open, the pod reports not-ready and drains gracefully instead of serving errors.',
            architectPerspective: 'Health endpoints are a contract with the orchestrator, and getting the semantics wrong is a top cause of self-inflicted outages. I standardize the live/ready split across every service template, wire readiness into deployment gates and load-balancer drain on shutdown, and treat the probe configuration (thresholds, timeouts) as part of the SLO design, not an afterthought.'
        },
        {
            question: 'How do you manage secrets and environment-specific configuration securely across local dev, CI, and production?',
            difficulty: 'advanced',
            answer: `<p>The principle is: <strong>secrets never live in source control or appsettings.json</strong>. You layer configuration providers so each environment supplies secrets through its own secure channel, while the binding code stays identical.</p>
            <ul>
                <li><strong>Local dev</strong> — User Secrets (<code>dotnet user-secrets</code>), stored outside the repo in the user profile, enabled only in Development.</li>
                <li><strong>CI/CD</strong> — pipeline secret stores (GitLab CI masked/protected variables, GitHub Actions secrets) injected as environment variables.</li>
                <li><strong>Production</strong> — a managed secret store: Azure Key Vault or AWS Secrets Manager, accessed via <strong>managed identity</strong> so there is no bootstrap secret to leak.</li>
            </ul>
            <p>Configuration precedence (later wins) lets environment variables and Key Vault override the JSON base files without code changes. Always combine this with <code>ValidateOnStart()</code> so a missing secret fails the deployment at boot rather than at first request.</p>`,
            explanation: 'Keep the recipe (appsettings) in the cookbook for everyone, but keep the safe combination (secrets) in a vault each location opens with its own key — never written in the recipe.',
            code: `var builder = WebApplication.CreateBuilder(args);

// Production: pull secrets from Key Vault using managed identity (no secret-zero)
if (builder.Environment.IsProduction())
{
    var vaultUri = new Uri(builder.Configuration["KeyVault:Uri"]!);
    builder.Configuration.AddAzureKeyVault(
        vaultUri, new DefaultAzureCredential());
}

// Fail fast if a required secret/config is missing or invalid
builder.Services.AddOptions<DatabaseOptions>()
    .BindConfiguration("Database")
    .ValidateDataAnnotations()
    .Validate(o => !string.IsNullOrWhiteSpace(o.ConnectionString),
        "Database:ConnectionString is required")
    .ValidateOnStart();

// Local dev only — user secrets are auto-added in Development by the host
// > dotnet user-secrets set "Database:ConnectionString" "Server=...;"`,
            language: 'csharp',
            bestPractices: ['Use managed identity / workload identity to access Key Vault — avoid storing a secret to read secrets', 'Mark CI variables as masked and protected so they are not printed in logs or exposed on feature branches', 'Call ValidateOnStart() so missing secrets break the deploy, not production traffic', 'Rotate secrets and reference them by name so rotation does not require a code change'],
            commonMistakes: ['Committing appsettings.Production.json with real connection strings', 'Logging the full IConfiguration or connection strings during startup diagnostics', 'Using a static client secret to authenticate to Key Vault (just moves the secret problem)', 'Relying on User Secrets in production — it is a Development-only convenience'],
            interviewTip: 'Mention the "secret zero" problem and how managed identity solves it — that shows you have actually wired Key Vault, not just read about it.',
            followUp: ['What is the secret-zero / bootstrap problem?', 'How do you handle secret rotation without downtime?', 'How does configuration precedence order resolve conflicts?'],
            seniorPerspective: 'I treat a missing or malformed secret as a startup failure with a clear message, because the alternative — a NullReferenceException three layers deep on the first customer request — is far harder to triage at 2am. I also scope Key Vault access policies per service identity so a compromised service cannot read another domain’s secrets.',
            architectPerspective: 'Secrets management is as much governance as code: I want a single auditable store, automated rotation, least-privilege access via identity, and zero secrets in Git enforced by pre-commit scanning. The application code should be environment-agnostic — the same binary runs everywhere and the platform decides which provider supplies the values.'
        },
        {
            question: 'How do you correlate logs across multiple microservices for a single user request?',
            difficulty: 'hard',
            answer: `<p>You propagate a <strong>trace context</strong> across service boundaries and enrich every log entry with it. In modern .NET this is built on <code>System.Diagnostics.Activity</code> and the W3C Trace Context standard (the <code>traceparent</code> header), which <code>HttpClient</code> and ASP.NET Core flow automatically.</p>
            <ul>
                <li>An inbound request either carries a <code>traceparent</code> or one is created; this becomes the <code>Activity.Current</code> with a <code>TraceId</code> and <code>SpanId</code>.</li>
                <li>Outbound <code>HttpClient</code> calls inject the same <code>traceparent</code>, so the downstream service joins the same trace.</li>
                <li>Serilog enrichment (e.g. <code>Enrich.WithSpan</code> or a custom enricher reading <code>Activity.Current.TraceId</code>) stamps every log line with the trace ID.</li>
            </ul>
            <p>With all services shipping to one store (Seq, Elasticsearch, Application Insights), you filter by <code>TraceId</code> and see the entire request flow end-to-end. For async hops over a message bus you must manually carry the trace context in message headers, since HTTP propagation does not apply.</p>`,
            explanation: 'Give every request a wristband number at the door. Every desk it visits writes that number on its notes, so later you can pull every note for one visitor across the whole building.',
            code: `// Custom Serilog enricher that stamps the current trace/span id on every log
public sealed class TraceEnricher : ILogEventEnricher
{
    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory factory)
    {
        var activity = Activity.Current;
        if (activity is null) return;
        logEvent.AddPropertyIfAbsent(
            factory.CreateProperty("TraceId", activity.TraceId.ToString()));
        logEvent.AddPropertyIfAbsent(
            factory.CreateProperty("SpanId", activity.SpanId.ToString()));
    }
}

// Registration
builder.Host.UseSerilog((ctx, cfg) => cfg
    .Enrich.With(new TraceEnricher())
    .WriteTo.Seq(ctx.Configuration["Seq:Url"]!));

// Carrying trace context across a message bus (no automatic HTTP propagation)
message.ApplicationProperties["traceparent"] = Activity.Current?.Id;
// Consumer side: start a new Activity with that parent id to continue the trace`,
            language: 'csharp',
            bestPractices: ['Adopt W3C Trace Context (traceparent) so propagation interoperates across stacks and vendors', 'Use OpenTelemetry for traces and let .NET auto-instrument HttpClient/ASP.NET Core', 'Manually propagate trace ids through message bus headers for async flows', 'Ship all services to one aggregator and standardize the TraceId property name'],
            commonMistakes: ['Inventing a custom correlation header instead of using the W3C standard, breaking cross-vendor tracing', 'Losing the trace across async/queue boundaries because context was not carried in the message', 'Logging the TraceId inconsistently (different property names per service)', 'Generating a new correlation id per service instead of propagating the inbound one'],
            interviewTip: 'Name Activity and the traceparent header explicitly, and call out the async-bus gap — interviewers want to see you know HTTP propagation is automatic but messaging is not.',
            followUp: ['How does OpenTelemetry relate to Activity in .NET?', 'What is the difference between a trace, a span, and a baggage item?', 'How do you sample traces to control cost at high volume?'],
            seniorPerspective: 'I lean on OpenTelemetry rather than hand-rolling correlation, exporting traces to a backend and logs to the same TraceId so a single click pivots from a slow trace to its logs. At scale I tune sampling — head-based for cost control plus tail-based to always keep error traces — because storing 100% of traces in a high-traffic system is prohibitively expensive.',
            architectPerspective: 'Correlation is one pillar of the three (logs, metrics, traces). I standardize on OpenTelemetry across the org so the instrumentation is vendor-neutral and we can switch backends without touching app code. The architectural rule is simple: every cross-service hop, sync or async, must propagate trace context — it is part of the service contract, enforced in shared middleware and messaging libraries.'
        }
    ,
        {
            question: 'How would you implement a custom configuration provider in ASP.NET Core, and what caveats apply?',
            difficulty: 'hard',
            answer: `<p>A custom provider lets configuration come from a non-default source (a database, a feature-flag service, a secrets API). You implement <code>IConfigurationSource</code> (a factory) and <code>ConfigurationProvider</code> (which populates the <code>Data</code> dictionary in <code>Load()</code>), then register it via <code>builder.Configuration.Add(...)</code>.</p>
            <ul>
                <li><strong>Ordering matters</strong> — later providers override earlier keys, so where you add it in the chain decides precedence.</li>
                <li><strong>Reload</strong> — to support change detection you implement a change token and call <code>OnReload()</code>; a DB-backed provider typically polls on an interval.</li>
                <li><strong>Startup cost/failure</strong> — <code>Load()</code> runs during host build, so a slow or failing source can block or crash startup; guard with timeouts and a fallback.</li>
            </ul>`,
            explanation: 'A configuration provider is like adding another stack of sticky notes to the desk: ASP.NET reads all the stacks and the top one wins for any duplicate key. A custom provider is just your own stack sourced from wherever you like.',
            code: `public sealed class DbConfigSource : IConfigurationSource
{
    public string ConnectionString { get; init; } = "";
    public IConfigurationProvider Build(IConfigurationBuilder builder)
        => new DbConfigProvider(ConnectionString);
}

public sealed class DbConfigProvider : ConfigurationProvider
{
    private readonly string _cs;
    public DbConfigProvider(string cs) => _cs = cs;

    public override void Load()
    {
        // Runs at host build time \u2014 keep it fast and resilient
        using var conn = new SqlConnection(_cs);
        var settings = conn.Query<(string Key, string Value)>("SELECT [Key],[Value] FROM AppConfig");
        Data = settings.ToDictionary(s => s.Key, s => (string?)s.Value, StringComparer.OrdinalIgnoreCase);
    }
}

// builder.Configuration.Add(new DbConfigSource { ConnectionString = cs });`,
            language: 'csharp',
            bestPractices: ['Add the provider at the right position in the chain so precedence is intentional', 'Keep Load() fast and resilient \u2014 it runs during startup', 'Support reload via change tokens only if the source actually changes at runtime', 'Bind to strongly-typed options with validation rather than reading raw keys'],
            commonMistakes: ['Blocking startup on a slow/unavailable source with no timeout or fallback', 'Putting secrets in a custom provider when Key Vault already solves it', 'Forgetting that later providers override your keys (wrong ordering)', 'Polling the source too aggressively, hammering the database'],
            interviewTip: 'Mention the two interfaces (IConfigurationSource + ConfigurationProvider) and that Load() runs at host build time \u2014 the startup-failure caveat is what separates a real answer from a textbook one.',
            followUp: ['How does reloadOnChange work under the hood?', 'Where would this sit relative to Key Vault and environment variables?', 'How do you bind a custom provider to IOptionsMonitor?'],
            seniorPerspective: 'I only build a custom provider when the data truly belongs in configuration (rarely-changing, app-wide). For frequently-changing values I prefer a real feature-flag service injected as a typed client, because abusing IConfiguration for dynamic data makes failures and reloads hard to reason about.',
            architectPerspective: 'Configuration providers are a clean extensibility seam, but they centralize a startup dependency. I treat any external-sourced provider as a startup-critical dependency with its own resilience budget, and prefer layering it under env vars so deploys can always override a misbehaving source.'
        },
        {
            question: 'Explain the differences between IOptions<T>, IOptionsSnapshot<T>, and IOptionsMonitor<T>. When would you use each?',
            difficulty: 'hard',
            answer: `<p>These three interfaces provide different lifetime and change-detection behaviors for strongly-typed configuration:</p>
            <ul>
                <li><strong>IOptions&lt;T&gt;</strong> \u2014 Singleton lifetime. Reads configuration ONCE at startup and never changes for the lifetime of the app. Cheapest to resolve. Use for: configuration that never changes at runtime.</li>
                <li><strong>IOptionsSnapshot&lt;T&gt;</strong> \u2014 Scoped lifetime. Creates a new snapshot per request (in web apps). Detects changes between requests but NOT within a request. Use for: per-request configuration freshness (e.g., feature flags that change via hot reload).</li>
                <li><strong>IOptionsMonitor&lt;T&gt;</strong> \u2014 Singleton lifetime with change notifications. Provides a .CurrentValue that updates live when the underlying source changes. Exposes OnChange() callback. Use for: long-lived services (singletons, background services) that need to react to config changes.</li>
            </ul>
            <p>Critical rule: you CANNOT inject IOptionsSnapshot into a singleton service (scoped into singleton = captive dependency error). Use IOptionsMonitor for singletons that need fresh config.</p>`,
            explanation: 'IOptions is a printed book \u2014 fixed at publication. IOptionsSnapshot is a daily newspaper \u2014 fresh each morning but fixed during the day. IOptionsMonitor is a live news feed \u2014 updates in real-time with notifications.',
            code: `// IOptions<T> \u2014 read once, never changes (singleton)
public class EmailService
{
    private readonly SmtpSettings _settings;
    public EmailService(IOptions<SmtpSettings> options)
    {
        _settings = options.Value; // read once, cached forever
    }
}

// IOptionsSnapshot<T> \u2014 fresh per request (scoped)
public class FeatureController : ControllerBase
{
    public IActionResult Get([FromServices] IOptionsSnapshot<FeatureFlags> snapshot)
    {
        // snapshot.Value is fresh for THIS request
        // next request may see different values if config changed
        if (snapshot.Value.EnableNewDashboard)
            return Ok(new { dashboard = "v2" });
        return Ok(new { dashboard = "v1" });
    }
}

// IOptionsMonitor<T> \u2014 live updates with notifications (singleton-safe)
public class BackgroundNotifier : BackgroundService
{
    private RateLimitSettings _settings;
    private readonly IDisposable? _onChange;

    public BackgroundNotifier(IOptionsMonitor<RateLimitSettings> monitor)
    {
        _settings = monitor.CurrentValue; // always latest
        _onChange = monitor.OnChange(newSettings =>
        {
            _settings = newSettings; // react to changes
            Log.Information("Rate limits updated: {Max}", newSettings.MaxRequests);
        });
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            // _settings is always current, no restart needed
            await ProcessWithLimit(_settings.MaxRequests, ct);
        }
    }
}

// COMMON MISTAKE \u2014 IOptionsSnapshot in a singleton (will throw or capture stale):
// builder.Services.AddSingleton<MySingleton>(); // singleton
// public MySingleton(IOptionsSnapshot<T> snap) // WRONG! Scoped in singleton!
// Fix: use IOptionsMonitor<T> instead`,
            language: 'csharp',
            bestPractices: [
                'Use IOptions<T> for configuration that never changes (connection strings, static settings)',
                'Use IOptionsSnapshot<T> in scoped/transient services for per-request freshness',
                'Use IOptionsMonitor<T> in singletons and background services for live updates',
                'Register OnChange callbacks to react to configuration changes proactively',
                'Enable ValidateOnStart to catch configuration errors at startup'
            ],
            commonMistakes: [
                'Injecting IOptionsSnapshot into a singleton (captive dependency, throws or stays stale)',
                'Using IOptions when the app needs to respond to runtime config changes (stays fixed forever)',
                'Not disposing OnChange subscriptions (memory leak in short-lived objects)',
                'Assuming IOptionsMonitor.CurrentValue is thread-safe to read during OnChange callback'
            ],
            interviewTip: 'State the lifetime of each clearly: IOptions=singleton (fixed), IOptionsSnapshot=scoped (per-request), IOptionsMonitor=singleton (live). Then explain the captive dependency trap with IOptionsSnapshot in singletons.',
            followUp: ['What happens if you inject IOptionsSnapshot into a singleton?', 'How does IOptionsMonitor detect changes internally?', 'Can you use named options with IOptionsMonitor?']
        },
        {
            question: 'How do you implement structured logging with correlation IDs to trace requests across multiple services?',
            difficulty: 'hard',
            answer: `<p>A <strong>correlation ID</strong> (or trace ID) is a unique identifier that follows a request across all services and log entries, enabling end-to-end tracing in distributed systems. In .NET, this is built on <code>System.Diagnostics.Activity</code> and the W3C Trace Context standard (<code>traceparent</code> header).</p>
            <p>Implementation layers:</p>
            <ul>
                <li><strong>ASP.NET Core automatically</strong> creates an Activity per request with a TraceId (from the incoming traceparent header or generated)</li>
                <li><strong>Structured logging</strong> includes the TraceId in every log entry via log scopes or enrichers</li>
                <li><strong>HttpClient propagation</strong> automatically forwards the traceparent header to downstream services</li>
                <li><strong>Message bus gap</strong> \u2014 you must manually propagate trace context through queue messages (headers/properties)</li>
            </ul>
            <p>The goal: given any log entry, you can find ALL related log entries across all services for that request by filtering on TraceId.</p>`,
            explanation: 'A correlation ID is like a case number at a hospital. Every department (radiology, lab, pharmacy) stamps the same case number on their records. When something goes wrong, you pull that one number and see the complete history across all departments.',
            code: `// 1. ASP.NET Core provides TraceId automatically via Activity:
app.Use(async (context, next) =>
{
    // Activity.Current?.TraceId is available automatically
    // Add it to the response header for client-side correlation:
    context.Response.OnStarting(() =>
    {
        context.Response.Headers["X-Trace-Id"] =
            Activity.Current?.TraceId.ToString() ?? context.TraceIdentifier;
        return Task.CompletedTask;
    });
    await next();
});

// 2. Serilog enricher for automatic TraceId in every log:
builder.Host.UseSerilog((context, config) =>
{
    config
        .Enrich.FromLogContext()
        .Enrich.WithProperty("ServiceName", "OrderService")
        .Enrich.With<ActivityEnricher>() // adds TraceId, SpanId
        .WriteTo.Console(new JsonFormatter());
});

// Custom enricher:
public class ActivityEnricher : ILogEventEnricher
{
    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory factory)
    {
        var activity = Activity.Current;
        if (activity is null) return;
        logEvent.AddPropertyIfAbsent(factory.CreateProperty("TraceId", activity.TraceId.ToString()));
        logEvent.AddPropertyIfAbsent(factory.CreateProperty("SpanId", activity.SpanId.ToString()));
        logEvent.AddPropertyIfAbsent(factory.CreateProperty("ParentSpanId", activity.ParentSpanId.ToString()));
    }
}

// 3. HttpClient auto-propagates traceparent (W3C standard):
builder.Services.AddHttpClient("downstream")
    .AddHeaderPropagation(); // or it happens automatically via Activity

// 4. Message bus: manually propagate context
public async Task PublishOrderCreated(Order order)
{
    var message = new OrderCreatedEvent { OrderId = order.Id };
    var properties = new Dictionary<string, string>
    {
        ["traceparent"] = Activity.Current?.Id ?? "" // W3C trace context
    };
    await _bus.PublishAsync(message, properties);
}

// Consumer restores context:
public async Task HandleOrderCreated(OrderCreatedEvent evt, IDictionary<string, string> headers)
{
    using var activity = _activitySource.StartActivity("HandleOrderCreated",
        ActivityKind.Consumer,
        headers.GetValueOrDefault("traceparent") ?? ""); // link to original trace
    // All logs within this scope automatically get the original TraceId
}`,
            language: 'csharp',
            bestPractices: [
                'Use W3C Trace Context (traceparent header) for cross-service correlation',
                'Enrich all structured logs with TraceId automatically via Serilog/OpenTelemetry',
                'Propagate trace context through message bus headers manually',
                'Include TraceId in HTTP response headers for client-side debugging',
                'Use OpenTelemetry for standardized tracing across the entire stack'
            ],
            commonMistakes: [
                'Generating a new correlation ID per service instead of propagating the incoming one',
                'Losing trace context across async message boundaries (not propagating in queue headers)',
                'Using a custom header name instead of the W3C standard traceparent',
                'Logging TraceId inconsistently (different property names in different services)'
            ],
            interviewTip: 'Name Activity and traceparent explicitly. Explain that HTTP propagation is automatic but messaging is NOT \u2014 that gap is where trace context gets lost in most systems. Show you know both the automatic and manual parts.',
            followUp: ['How does OpenTelemetry relate to System.Diagnostics.Activity?', 'What is the difference between TraceId and SpanId?', 'How do you sample traces at high volume without losing error traces?']
        },
        {
            question: 'How does the Options pattern validation work in ASP.NET Core? Explain ValidateOnStart, ValidateDataAnnotations, IValidateOptions<T>, and how to fail fast on misconfiguration.',
            difficulty: 'hard',
            answer: `<p>The Options pattern provides three levels of validation: <strong>ValidateDataAnnotations</strong> checks [Required], [Range], [Url] etc. attributes on the options class; <strong>IValidateOptions&lt;T&gt;</strong> enables custom validation logic (cross-property checks, external lookups); <strong>ValidateOnStart</strong> (.NET 6+) runs ALL validation at application startup rather than on first use, failing fast before the app accepts traffic.</p>
            <p>Without ValidateOnStart, invalid options are only detected when first resolved from DI â€” potentially minutes or hours after deployment, when a specific code path requests the options. ValidateOnStart ensures the app crashes immediately on startup with a clear error message, preventing deployment of misconfigured services to production.</p>
            <p>For complex validation (connection string reachability, inter-dependent settings, environment-specific rules), implement IValidateOptions&lt;T&gt; and register it. Multiple validators can be registered for the same options type â€” all must pass. This separates validation concerns: DataAnnotations for format rules, IValidateOptions for business rules.</p>`,
            explanation: 'ValidateOnStart is like pre-flight checks before takeoff â€” catch problems on the ground (startup) rather than mid-flight (production traffic). DataAnnotations are the basic checklist; IValidateOptions is the experienced pilot checking things the checklist misses.',
            code: `// Options class with DataAnnotations:
public class DatabaseOptions
{
    public const string SectionName = "Database";
    
    [Required(ErrorMessage = "Connection string is required")]
    public string ConnectionString { get; set; } = "";
    
    [Range(1, 100, ErrorMessage = "Pool size must be 1-100")]
    public int MaxPoolSize { get; set; } = 20;
    
    [Url(ErrorMessage = "HealthCheck must be a valid URL")]
    public string? HealthCheckEndpoint { get; set; }
}

// Registration with validation:
builder.Services.AddOptions<DatabaseOptions>()
    .Bind(builder.Configuration.GetSection(DatabaseOptions.SectionName))
    .ValidateDataAnnotations()                  // Check attributes
    .ValidateOnStart();                         // Fail fast at startup!

// Custom validator with IValidateOptions<T>:
public class DatabaseOptionsValidator : IValidateOptions<DatabaseOptions>
{
    public ValidateOptionsResult Validate(string? name, DatabaseOptions options)
    {
        var errors = new List<string>();
        
        if (options.ConnectionString.Contains("password=", 
            StringComparison.OrdinalIgnoreCase) && 
            !options.ConnectionString.Contains("Encrypt=true"))
        {
            errors.Add("Connection with password must use Encrypt=true");
        }
        
        if (options.MaxPoolSize < 5 && options.ConnectionString.Contains("MultipleActiveResultSets"))
        {
            errors.Add("MARS requires pool size >= 5");
        }
        
        return errors.Count > 0
            ? ValidateOptionsResult.Fail(errors)
            : ValidateOptionsResult.Success;
    }
}

// Register custom validator:
builder.Services.AddSingleton<IValidateOptions<DatabaseOptions>, 
    DatabaseOptionsValidator>();

// App crashes on startup if validation fails:
// Unhandled exception: OptionsValidationException: 
//   Connection string is required; Pool size must be 1-100`,
            language: 'csharp',
            bestPractices: [
                'Always use ValidateOnStart for production services to fail fast on misconfiguration',
                'Use DataAnnotations for simple format/range validation, IValidateOptions for cross-property logic',
                'Register multiple IValidateOptions<T> implementations for separation of validation concerns',
                'Include actionable error messages that tell operators exactly what to fix',
                'Test options validation in integration tests with invalid configuration'
            ],
            commonMistakes: [
                'Forgetting ValidateOnStart â€” invalid options only surface when first accessed at runtime',
                'Putting complex business logic in DataAnnotations (hard to test, limited expressiveness)',
                'Not validating named options separately (IValidateOptions receives the name parameter)',
                'Swallowing validation errors with try/catch around option resolution instead of fixing config'
            ],
            interviewTip: 'Show the progression: DataAnnotations (simple), IValidateOptions (complex), ValidateOnStart (fail-fast). The key insight is that without ValidateOnStart, your app boots successfully with broken config and only fails when that config is actually used â€” potentially in production under traffic.',
            followUp: ['How do you validate named options (different instances of the same type)?', 'Can you use FluentValidation with the Options pattern?', 'How do you handle options that need async validation (checking database connectivity)?']
        },
        {
            question: 'How do you implement structured logging with correlation IDs in ASP.NET Core? Explain W3C Trace Context, Activity/traceparent, Serilog enrichment, and propagating trace IDs through message buses.',
            difficulty: 'hard',
            answer: `<p><strong>W3C Trace Context</strong> is the standard for distributed tracing: the <code>traceparent</code> HTTP header carries a trace-id (shared across all services in a request chain) and a span-id (unique per operation). In .NET, <code>System.Diagnostics.Activity</code> represents the current span and automatically propagates traceparent on outgoing HTTP calls via HttpClient.</p>
            <p><strong>Serilog enrichment</strong>: Use <code>Enrich.FromLogContext()</code> combined with middleware that pushes TraceId/SpanId into the log context. Every log statement within that request automatically includes the correlation IDs without explicit passing. This enables filtering all logs for a single request across all services using the TraceId.</p>
            <p><strong>Message bus propagation</strong>: Unlike HTTP (where traceparent propagates automatically), message queues (RabbitMQ, Kafka, SQS) require MANUAL propagation. Serialize Activity.Current.Id into message headers on publish, then create a new Activity linked to the parent on consume. Without this, trace context is lost at queue boundaries â€” the most common gap in distributed tracing implementations.</p>`,
            explanation: 'Trace context is like a tracking number for a package shipped between warehouses (services). HTTP automatically stamps the number on each handoff. Message queues are like putting the package on a conveyor belt â€” you must manually attach the tracking label or it gets lost.',
            code: `// Automatic HTTP propagation (built-in):
// Outgoing HttpClient requests automatically include traceparent header
// Incoming requests automatically create Activity from traceparent

// Serilog enrichment middleware:
app.UseSerilogRequestLogging(options =>
{
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("TraceId", httpContext.TraceIdentifier);
        diagnosticContext.Set("UserId", 
            httpContext.User?.FindFirst("sub")?.Value ?? "anonymous");
    };
});

// Program.cs Serilog configuration:
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("ServiceName", "OrderService")
    .Enrich.With<ActivityEnricher>() // Custom: adds TraceId, SpanId
    .WriteTo.Console(new JsonFormatter())
    .CreateLogger();

// Custom ActivityEnricher:
public class ActivityEnricher : ILogEventEnricher
{
    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory factory)
    {
        var activity = Activity.Current;
        if (activity != null)
        {
            logEvent.AddPropertyIfAbsent(
                factory.CreateProperty("TraceId", activity.TraceId.ToString()));
            logEvent.AddPropertyIfAbsent(
                factory.CreateProperty("SpanId", activity.SpanId.ToString()));
        }
    }
}

// MESSAGE BUS PROPAGATION (manual â€” the gap most teams miss):
// Publisher:
public async Task PublishAsync<T>(T message)
{
    var properties = new BasicProperties();
    // Inject current trace context into message headers:
    if (Activity.Current != null)
    {
        properties.Headers ??= new Dictionary<string, object>();
        properties.Headers["traceparent"] = Activity.Current.Id;
    }
    await _channel.BasicPublishAsync(exchange, routingKey, properties, body);
}

// Consumer:
public async Task ConsumeAsync(BasicDeliverEventArgs args)
{
    // Extract and restore trace context:
    string? parentId = args.BasicProperties.Headers?
        .TryGetValue("traceparent", out var tp) == true 
        ? Encoding.UTF8.GetString((byte[])tp) : null;
    
    using var activity = _activitySource.StartActivity(
        "ProcessMessage", ActivityKind.Consumer, parentId);
    // All logs within this scope now share the original TraceId
}`,
            language: 'csharp',
            bestPractices: [
                'Use W3C Trace Context (traceparent) for cross-service correlation â€” it is the standard',
                'Enrich all structured logs with TraceId automatically via Serilog enrichers',
                'Manually propagate trace context through message bus headers (not automatic like HTTP)',
                'Include TraceId in error HTTP responses for client-side debugging',
                'Use OpenTelemetry for standardized instrumentation across the entire stack'
            ],
            commonMistakes: [
                'Generating a new correlation ID per service instead of propagating the incoming one',
                'Losing trace context at message queue boundaries (most common gap in distributed tracing)',
                'Using a custom header name instead of the W3C standard traceparent',
                'Not enriching logs with TraceId (makes cross-service debugging impossible)'
            ],
            interviewTip: 'Name Activity and traceparent explicitly. Explain that HTTP propagation is AUTOMATIC (HttpClient does it) but messaging is NOT â€” that gap is where trace context gets lost in most systems. Show you know both the automatic and manual parts of the distributed tracing story.',
            followUp: ['How does OpenTelemetry relate to System.Diagnostics.Activity?', 'What is the difference between TraceId and SpanId?', 'How do you sample traces at high volume without losing error traces?']
        }
    ]
});
