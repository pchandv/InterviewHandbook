PageData.register('observability', {
    title: 'Observability',
    description: 'The Three Pillars of Observability: Logs, Metrics, and Traces — plus OpenTelemetry, SLI/SLO/SLA, and production alerting strategies',
    sections: [
        {
            title: 'Introduction',
            content: `<p><strong>Observability</strong> is the ability to understand the internal state of a system by examining its external outputs. Unlike traditional monitoring (which answers "is it broken?"), observability answers "why is it broken?" and "what else is affected?"</p>
<p>In modern distributed systems, you cannot debug by attaching a debugger. You need structured signals — logs, metrics, and traces — correlated together so you can reconstruct what happened during an incident.</p>
<p>Observability is NOT optional in production. It's the difference between a 5-minute incident resolution and a 5-hour one.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>The <strong>Three Pillars</strong> of observability are complementary signal types:</p>
<ul>
<li><strong>Logs</strong> — Discrete events with context (structured JSON, not printf). Answer "what happened?"</li>
<li><strong>Metrics</strong> — Numeric measurements aggregated over time (counters, gauges, histograms). Answer "how much/how many?"</li>
<li><strong>Traces</strong> — End-to-end request paths across services with timing. Answer "where did time go?"</li>
</ul>
<p>Key terminology:</p>`,
            table: {
                headers: ['Term', 'Definition', 'Example'],
                rows: [
                    ['SLI', 'Service Level Indicator — a quantitative measure of service behavior', '99.2% of requests complete in <200ms'],
                    ['SLO', 'Service Level Objective — target value for an SLI', 'p99 latency < 500ms over 30-day window'],
                    ['SLA', 'Service Level Agreement — SLO + consequences (contract)', '99.9% uptime or credits issued'],
                    ['Error Budget', 'Allowed failures = 1 - SLO target', '0.1% budget = 43.2 min/month downtime'],
                    ['Correlation ID', 'Unique ID propagated across all services for one request', 'X-Correlation-Id: abc-123-def'],
                    ['Cardinality', 'Number of unique label combinations in metrics', 'user_id label = HIGH cardinality (avoid)'],
                    ['Golden Signals', 'Google SRE: Latency, Traffic, Errors, Saturation', 'The 4 signals every service must emit']
                ]
            }
        },
        {
            title: 'How It Works',
            content: `<p>Observability works through <strong>instrumentation</strong> — adding code that emits signals — and <strong>collection</strong> — aggregating those signals in backends for querying.</p>
<h4>Signal Flow</h4>
<ol>
<li><strong>Instrument</strong> — Application emits logs/metrics/traces via SDK (OpenTelemetry)</li>
<li><strong>Collect</strong> — OTel Collector receives, processes, and exports signals</li>
<li><strong>Store</strong> — Backend stores each signal type (Loki/Elasticsearch for logs, Prometheus/Mimir for metrics, Tempo/Jaeger for traces)</li>
<li><strong>Query</strong> — Engineers use Grafana/Kibana to correlate signals during incidents</li>
<li><strong>Alert</strong> — Rules fire when SLOs are at risk of being breached</li>
</ol>
<p>The key insight: signals must be <strong>correlated</strong>. A trace ID links a trace span to its logs and metrics, so you can jump from a slow endpoint → the specific trace → the log showing why.</p>`,
            mermaid: `graph LR
    A[Application Code] -->|OTel SDK| B[OTel Collector]
    B -->|Logs| C[Loki / Elasticsearch]
    B -->|Metrics| D[Prometheus / Mimir]
    B -->|Traces| E[Tempo / Jaeger]
    C --> F[Grafana Dashboard]
    D --> F
    E --> F
    F --> G[Alert Manager]
    G --> H[PagerDuty / Slack]`
        },
        {
            title: 'Visual Diagram',
            content: '<p>How a single request flows through an observable system, generating correlated signals:</p>',
            mermaid: `sequenceDiagram
    participant Client
    participant API Gateway
    participant OrderService
    participant PaymentService
    participant Database

    Client->>API Gateway: POST /orders (trace_id=abc)
    API Gateway->>OrderService: Forward (span: gateway)
    Note over OrderService: Log: "Order created" + trace_id
    Note over OrderService: Metric: orders_total++
    OrderService->>PaymentService: ChargeCard (span: payment)
    Note over PaymentService: Log: "Payment processed" + trace_id
    Note over PaymentService: Metric: payment_duration_ms
    PaymentService->>Database: INSERT transaction
    PaymentService-->>OrderService: 200 OK
    OrderService-->>API Gateway: 201 Created
    API Gateway-->>Client: 201 Created
    Note over Client,Database: All spans form ONE trace with trace_id=abc`
        },
        {
            title: 'Implementation',
            content: `<p>OpenTelemetry (OTel) is the CNCF standard for instrumentation. Here's how to set it up in .NET:</p>`,
            code: `// Program.cs — Full OpenTelemetry setup in ASP.NET Core
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

// Define service identity
var serviceName = "OrderService";
var serviceVersion = "1.0.0";

// Configure OpenTelemetry
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService(serviceName, serviceVersion: serviceVersion))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()       // Auto-instrument HTTP requests
        .AddHttpClientInstrumentation()        // Auto-instrument outgoing HTTP
        .AddSqlClientInstrumentation()         // Auto-instrument SQL queries
        .AddSource("OrderService.Activities")  // Custom ActivitySource
        .AddOtlpExporter(opts =>               // Export to OTel Collector
            opts.Endpoint = new Uri("http://otel-collector:4317")))
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddMeter("OrderService.Metrics")      // Custom metrics
        .AddOtlpExporter(opts =>
            opts.Endpoint = new Uri("http://otel-collector:4317")));

// Structured logging with OTel export
builder.Logging.AddOpenTelemetry(logging =>
{
    logging.IncludeScopes = true;
    logging.IncludeFormattedMessage = true;
    logging.AddOtlpExporter(opts =>
        opts.Endpoint = new Uri("http://otel-collector:4317"));
});

var app = builder.Build();`,
            language: 'csharp'
        },
        {
            title: 'Custom Instrumentation',
            content: '<p>Beyond auto-instrumentation, you need custom spans and metrics for business-critical operations:</p>',
            code: `using System.Diagnostics;
using System.Diagnostics.Metrics;

public class OrderService
{
    // Custom ActivitySource for tracing
    private static readonly ActivitySource ActivitySource = 
        new("OrderService.Activities", "1.0.0");

    // Custom metrics
    private static readonly Meter Meter = new("OrderService.Metrics", "1.0.0");
    private static readonly Counter<long> OrdersCreated = 
        Meter.CreateCounter<long>("orders.created", "orders", "Total orders created");
    private static readonly Histogram<double> OrderProcessingTime = 
        Meter.CreateHistogram<double>("orders.processing_duration_ms", "ms");

    private readonly ILogger<OrderService> _logger;

    public OrderService(ILogger<OrderService> logger) => _logger = logger;

    public async Task<Order> CreateOrder(CreateOrderRequest request)
    {
        // Start a custom span
        using var activity = ActivitySource.StartActivity("CreateOrder");
        activity?.SetTag("order.customer_id", request.CustomerId);
        activity?.SetTag("order.item_count", request.Items.Count);

        var sw = Stopwatch.StartNew();
        try
        {
            // Structured log with correlation context (trace_id auto-attached)
            _logger.LogInformation(
                "Creating order for customer {CustomerId} with {ItemCount} items",
                request.CustomerId, request.Items.Count);

            var order = await ProcessOrder(request);

            // Record success metric
            OrdersCreated.Add(1, 
                new KeyValuePair<string, object?>("status", "success"),
                new KeyValuePair<string, object?>("type", request.OrderType));

            activity?.SetTag("order.id", order.Id);
            activity?.SetStatus(ActivityStatusCode.Ok);
            return order;
        }
        catch (Exception ex)
        {
            // Record failure in trace AND metrics
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            activity?.RecordException(ex);
            OrdersCreated.Add(1, 
                new KeyValuePair<string, object?>("status", "failed"),
                new KeyValuePair<string, object?>("type", request.OrderType));

            _logger.LogError(ex, "Order creation failed for customer {CustomerId}", 
                request.CustomerId);
            throw;
        }
        finally
        {
            sw.Stop();
            OrderProcessingTime.Record(sw.Elapsed.TotalMilliseconds);
        }
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Best Practices',
            content: `<ul>
<li><strong>Use structured logging</strong> — JSON with consistent field names, not string concatenation. Every log must include trace_id, service name, and severity.</li>
<li><strong>Use LOW cardinality metric labels</strong> — Labels like "status_code" (5 values) are fine. Labels like "user_id" (millions) will explode your TSDB.</li>
<li><strong>Instrument the RED metrics for every service</strong> — Rate (requests/sec), Errors (error rate), Duration (latency histogram). Non-negotiable.</li>
<li><strong>Propagate context automatically</strong> — Use W3C Trace Context headers. Never manually pass trace IDs between services.</li>
<li><strong>Set meaningful span names</strong> — "POST /api/orders" not "HttpRequest". Include the operation, not the transport.</li>
<li><strong>Alert on SLOs, not symptoms</strong> — Alert on "error budget burn rate > 10x" not "CPU > 80%". Burn-rate alerts catch customer impact.</li>
<li><strong>Keep dashboards focused</strong> — One dashboard per service. Top row: Golden Signals. Second row: business KPIs. Third row: infrastructure.</li>
<li><strong>Use exemplars</strong> — Link metrics to traces. When you see a p99 spike, click to see the exact trace that caused it.</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>Logging everything at DEBUG in production</strong> — Costs explode, signal-to-noise ratio collapses. Use INFO for business events, ERROR for failures, DEBUG only in dev.</li>
<li><strong>Using high-cardinality metric labels</strong> — Adding user_id or request_id as a metric label creates millions of time series, crashes Prometheus.</li>
<li><strong>Alerting on raw metrics instead of SLOs</strong> — "CPU > 80%" triggers false positives. Alert on "5xx rate exceeds error budget burn rate."</li>
<li><strong>Not correlating signals</strong> — Logs without trace_id, metrics without exemplars. You see the problem but can't drill down to root cause.</li>
<li><strong>Sampling traces too aggressively</strong> — 1% sampling means you miss the rare but catastrophic errors. Use tail-based sampling (keep errors/slow requests).</li>
<li><strong>No runbooks linked to alerts</strong> — Alert fires at 3 AM, on-call engineer has no idea what to do. Every alert needs a runbook URL.</li>
<li><strong>Dashboard sprawl</strong> — 200 dashboards nobody uses. Maintain a small set of "golden" dashboards per service with clear ownership.</li>
<li><strong>Treating observability as an afterthought</strong> — Adding instrumentation after the first production incident. Instrument BEFORE you ship.</li>
</ul>`
        },
        {
            title: 'Real-World Applications',
            content: `<ul>
<li><strong>E-commerce checkout</strong> — Trace spans show payment gateway taking 4s (SLA breach). Metric shows 30% error rate on Stripe calls. Log reveals API key rotation failed.</li>
<li><strong>Microservices latency diagnosis</strong> — Distributed trace shows OrderService → InventoryService → database. 80% of latency is in a missing index on inventory_items table.</li>
<li><strong>SLO-based alerting at scale</strong> — Google's approach: multi-window burn-rate alerts. If error budget consumption rate suggests SLO breach within 1 hour, page immediately. If within 3 days, create a ticket.</li>
<li><strong>Feature rollout monitoring</strong> — Deploy new recommendation engine behind feature flag. Compare RED metrics between control (flag off) and treatment (flag on). Kill flag if p99 > 2x baseline.</li>
<li><strong>Cost optimization</strong> — Metrics show service handles 100 rps with 8 pods. Scale-down to 4 pods, SLO still met. Traces confirm no latency regression. Save 50% compute cost.</li>
</ul>`
        },
        {
            title: 'Comparison',
            content: '<p>Observability tools and approaches compared:</p>',
            table: {
                headers: ['Approach', 'Metrics', 'Logs', 'Traces', 'Correlation', 'Cost Model'],
                rows: [
                    ['Grafana Stack (Loki+Mimir+Tempo)', 'Prometheus-compatible', 'LogQL', 'Native trace support', 'Exemplars + TraceQL', 'Open source / Cloud tiers'],
                    ['ELK (Elasticsearch+Logstash+Kibana)', 'Weak (needs Metricbeat)', 'Excellent full-text search', 'APM add-on', 'Manual', 'License per node'],
                    ['Datadog', 'Strong + APM', 'Excellent', 'Full APM', 'Automatic', 'Per-host + per-GB ingestion'],
                    ['AWS CloudWatch', 'Native for AWS', 'CloudWatch Logs', 'X-Ray', 'Partial', 'Pay per metric/log/trace'],
                    ['Azure Monitor + App Insights', 'Native for Azure', 'Log Analytics (KQL)', 'End-to-end transaction', 'Automatic', 'Pay per GB ingested'],
                    ['OpenTelemetry (vendor-neutral)', 'OTLP export to any', 'OTLP export to any', 'OTLP export to any', 'Native W3C context', 'Free (you pay backend)']
                ]
            }
        },
        {
            title: 'SLI/SLO/SLA Framework',
            content: `<p>The SLI/SLO/SLA hierarchy is how mature organizations manage reliability:</p>`,
            code: `// Example: Defining SLOs programmatically for an API service
// This would typically live in a config file or Terraform resource

var sloDefinitions = new[]
{
    new SloDefinition
    {
        Name = "Order API Availability",
        SLI = "Ratio of non-5xx responses to total responses",
        Target = 0.999,         // 99.9%
        Window = TimeSpan.FromDays(30),
        ErrorBudget = 0.001,    // 0.1% = 43.2 minutes/month
        AlertBurnRate = 14.4,   // 1-hour window: alert if burning 14.4x
        Consequence = "Page on-call engineer"
    },
    new SloDefinition
    {
        Name = "Order API Latency",
        SLI = "Ratio of requests completing in <500ms to total requests",
        Target = 0.99,          // 99%
        Window = TimeSpan.FromDays(30),
        ErrorBudget = 0.01,     // 1% = 7.2 hours/month
        AlertBurnRate = 6.0,    // 6-hour window
        Consequence = "Create P2 ticket"
    }
};

// Burn-rate alert logic
// If (errors_in_window / total_in_window) > (budget * burn_rate_threshold)
//   => Fire alert
// Multi-window: check both short (5m) and long (1h) windows to reduce noise`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Observability is a favorite interview topic for senior+ roles because it reveals production experience:</p>`,
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>Three Pillars fluency</strong> — Can you explain when to use logs vs metrics vs traces? Most candidates confuse them.</li>
<li><strong>SLO thinking</strong> — Do you think in terms of error budgets and customer impact, or CPU/memory thresholds?</li>
<li><strong>Production war stories</strong> — "Tell me about an incident you debugged using observability tooling." Real stories reveal real experience.</li>
<li><strong>Trade-offs awareness</strong> — Sampling rates, cardinality, cost vs coverage. Showing you've made these decisions earns points.</li>
<li><strong>Proactive vs reactive</strong> — Did you add observability before the incident, or scramble after? Senior engineers instrument first.</li>
</ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li>Observability = Logs + Metrics + Traces, correlated by trace ID</li>
<li>OpenTelemetry is the vendor-neutral standard — learn it, use it</li>
<li>Alert on SLOs (error budget burn rate), not raw symptoms (CPU/memory)</li>
<li>RED metrics (Rate, Errors, Duration) are mandatory for every service</li>
<li>USE metrics (Utilization, Saturation, Errors) are for infrastructure</li>
<li>High cardinality labels in metrics = production outage of your monitoring</li>
<li>Tail-based sampling > head-based sampling (keep errors and slow traces)</li>
<li>Every alert must have a runbook. No runbook = useless alert.</li>
<li>Observability is a prerequisite for microservices — not an afterthought</li>
</ul>`
        }
    ],
    questions: [
        {
            id: 'obs-q1',
            level: 'junior',
            title: 'What are the Three Pillars of Observability and how do they differ?',
            answer: `<p><strong>The Three Pillars</strong> are complementary signal types that together give full visibility into system behavior:</p>
<ul>
<li><strong>Logs</strong> — Discrete timestamped events describing what happened. Best for debugging specific errors and audit trails. Example: <code>{"level":"error","msg":"Payment failed","customer_id":"123","trace_id":"abc"}</code></li>
<li><strong>Metrics</strong> — Numeric measurements aggregated over time windows. Best for dashboards, alerting, and trend analysis. Example: <code>http_requests_total{status="500"} 42</code></li>
<li><strong>Traces</strong> — End-to-end request paths showing timing across services. Best for latency analysis and understanding distributed call flows.</li>
</ul>
<p><strong>Key difference:</strong> Logs are per-event (high volume), metrics are aggregated (low volume, cheap to store), traces show causality across service boundaries.</p>
<p>They work together: a metric spike tells you something is wrong, a trace tells you where, and a log tells you why.</p>`
        },
        {
            id: 'obs-q2',
            level: 'mid',
            title: 'Explain the difference between SLI, SLO, and SLA. Give a concrete example for a REST API.',
            answer: `<p>These form a hierarchy from measurement to contract:</p>
<ul>
<li><strong>SLI (Service Level Indicator)</strong> — The raw measurement. "What are we measuring?" Example: <em>The proportion of HTTP requests that return a non-5xx status code.</em></li>
<li><strong>SLO (Service Level Objective)</strong> — The target. "What's good enough?" Example: <em>99.9% of requests succeed over a 30-day rolling window.</em></li>
<li><strong>SLA (Service Level Agreement)</strong> — The contract with consequences. "What happens if we miss it?" Example: <em>If availability drops below 99.9%, customer receives 10% service credit.</em></li>
</ul>
<p><strong>Concrete example for an Order API:</strong></p>
<ul>
<li>SLI: <code>successful_requests / total_requests</code> (measured per minute)</li>
<li>SLO: 99.9% availability (error budget = 43.2 min/month of downtime allowed)</li>
<li>SLA: "We guarantee 99.5% availability. Below that, we issue credits." (Note: SLA is always lower than internal SLO — you need margin.)</li>
</ul>
<p><strong>Error budget = 1 - SLO target.</strong> If your SLO is 99.9%, your error budget is 0.1%. Once exhausted, you should freeze deployments and focus on reliability.</p>`
        },
        {
            id: 'obs-q3',
            level: 'mid',
            title: 'What is OpenTelemetry and why has it become the industry standard?',
            answer: `<p><strong>OpenTelemetry (OTel)</strong> is a CNCF project that provides a single, vendor-neutral set of APIs, SDKs, and tools for generating and collecting telemetry data (logs, metrics, traces).</p>
<p><strong>Why it won:</strong></p>
<ul>
<li><strong>Vendor neutrality</strong> — Instrument once, export to any backend (Datadog, Grafana, AWS, Azure). No vendor lock-in.</li>
<li><strong>Merger of OpenTracing + OpenCensus</strong> — Combined the two competing standards into one.</li>
<li><strong>Auto-instrumentation</strong> — Libraries automatically instrument common frameworks (ASP.NET Core, HttpClient, EF Core, gRPC) with zero code changes.</li>
<li><strong>W3C Trace Context</strong> — Standard header propagation across all services regardless of language.</li>
<li><strong>Collector architecture</strong> — OTel Collector acts as a pipeline: receive → process (filter, sample, enrich) → export. Decouples apps from backends.</li>
</ul>
<p><strong>Components:</strong> API (interfaces) → SDK (implementation) → Exporters (OTLP, Prometheus, Jaeger) → Collector (standalone agent/gateway).</p>`
        },
        {
            id: 'obs-q4',
            level: 'senior',
            title: 'How would you implement distributed tracing across 10+ microservices? What challenges would you face?',
            answer: `<p><strong>Implementation strategy:</strong></p>
<ol>
<li><strong>Adopt OpenTelemetry SDK</strong> in every service (auto-instrumentation for HTTP/gRPC/DB, custom spans for business logic)</li>
<li><strong>Deploy OTel Collector</strong> as a sidecar (per-pod) or gateway (per-cluster) to receive, process, and export spans</li>
<li><strong>Use W3C Trace Context</strong> headers (<code>traceparent</code>, <code>tracestate</code>) for context propagation</li>
<li><strong>Configure tail-based sampling</strong> in the Collector: keep 100% of error/slow traces, sample 10% of healthy ones</li>
<li><strong>Store in Tempo/Jaeger</strong> with retention policy (7 days full, 30 days sampled)</li>
</ol>
<p><strong>Challenges at scale:</strong></p>
<ul>
<li><strong>Context propagation gaps</strong> — Message queues (Kafka/RabbitMQ) break automatic propagation. You must manually inject/extract context into message headers.</li>
<li><strong>Sampling decisions</strong> — Head-based sampling decides at the start (misses errors). Tail-based waits until the trace completes (requires buffering = memory cost).</li>
<li><strong>Clock skew</strong> — Services on different hosts have slightly different clocks. Spans may appear out of order. Use NTP sync and tolerate ±10ms skew.</li>
<li><strong>Fan-out traces</strong> — A single request fans out to 50 services. Traces become huge. Use span limits and summarize fan-out with batch spans.</li>
<li><strong>Polyglot services</strong> — Java, .NET, Node, Python all need OTel SDKs. Maturity varies (Java is most mature, .NET is close behind).</li>
<li><strong>Cost</strong> — Storing every span for 10+ services at 10K rps = billions of spans/day. Sampling + retention policies are critical.</li>
</ul>`
        },
        {
            id: 'obs-q5',
            level: 'senior',
            title: 'What is the difference between RED and USE methods? When would you use each?',
            answer: `<p>These are two complementary frameworks for choosing WHAT to measure:</p>
<p><strong>RED Method</strong> (Tom Wilkie, for request-driven services):</p>
<ul>
<li><strong>R</strong>ate — Requests per second</li>
<li><strong>E</strong>rrors — Failed requests per second (or error percentage)</li>
<li><strong>D</strong>uration — Latency distribution (p50, p95, p99)</li>
</ul>
<p><em>Use for:</em> APIs, web services, microservices — anything handling requests.</p>
<p><strong>USE Method</strong> (Brendan Gregg, for infrastructure resources):</p>
<ul>
<li><strong>U</strong>tilization — Percentage of resource busy (CPU %, disk I/O %)</li>
<li><strong>S</strong>aturation — Queue depth / backlog (are requests waiting?)</li>
<li><strong>E</strong>rrors — Error count on the resource (disk errors, network drops)</li>
</ul>
<p><em>Use for:</em> CPU, memory, disk, network, connection pools, thread pools — infrastructure resources.</p>
<p><strong>In practice, you need both:</strong> RED tells you the service is slow. USE tells you WHY (CPU saturated, connection pool exhausted, disk I/O at 100%).</p>`
        },
        {
            id: 'obs-q6',
            level: 'senior',
            title: 'How do you design alerts that don\'t cause alert fatigue? Explain burn-rate alerting.',
            answer: `<p><strong>Alert fatigue</strong> is when too many low-quality alerts cause engineers to ignore all alerts — including real incidents. The fix is SLO-based burn-rate alerting.</p>
<p><strong>Burn-rate alerting (Google SRE approach):</strong></p>
<ol>
<li>Define your SLO: 99.9% availability over 30 days (error budget = 43.2 min)</li>
<li>Calculate burn rate: <code>burn_rate = actual_error_rate / budget_error_rate</code></li>
<li>Set multi-window alerts:
<ul>
<li><strong>1x burn rate</strong> = consuming budget at exactly the expected rate (fine)</li>
<li><strong>14.4x burn rate over 1h</strong> = will exhaust budget in ~2 hours → PAGE immediately</li>
<li><strong>6x burn rate over 6h</strong> = will exhaust budget in ~5 days → Create P2 ticket</li>
<li><strong>1x burn rate over 3d</strong> = trending toward breach → Informational</li>
</ul>
</li>
</ol>
<p><strong>Why multi-window?</strong> Short window (5 min) catches sudden outages. Long window (1 hour) prevents firing on transient blips. Both must be breached to fire the alert.</p>
<p><strong>Other anti-fatigue practices:</strong></p>
<ul>
<li>Every alert must have: runbook URL, severity level, owning team</li>
<li>Review alert quality monthly: if an alert fires >5x with no action taken, delete it</li>
<li>Group related alerts into incidents (PagerDuty intelligent grouping)</li>
<li>Suppress alerts during planned maintenance windows</li>
</ul>`
        },
        {
            id: 'obs-q7',
            level: 'lead',
            title: 'You\'re building observability for a greenfield platform with 20 services. What\'s your strategy and technology choices?',
            answer: `<p><strong>Strategy — build in layers:</strong></p>
<p><strong>Week 1-2: Foundation</strong></p>
<ul>
<li>Choose OpenTelemetry as the instrumentation standard (vendor-neutral from day 1)</li>
<li>Deploy OTel Collector as a DaemonSet (one per node) in Kubernetes</li>
<li>Configure auto-instrumentation (ASP.NET Core, HttpClient, EF Core) in a shared NuGet package</li>
<li>Set up Grafana Cloud (or self-hosted Grafana + Loki + Mimir + Tempo) as the backend</li>
</ul>
<p><strong>Week 3-4: SLO Framework</strong></p>
<ul>
<li>Define 2-3 SLOs per service (availability + latency minimum)</li>
<li>Create burn-rate alert rules in Grafana/Prometheus</li>
<li>Build a "service health" dashboard template (RED metrics + dependencies + deployment markers)</li>
<li>Establish on-call rotation with PagerDuty/OpsGenie integration</li>
</ul>
<p><strong>Week 5-8: Maturity</strong></p>
<ul>
<li>Add business KPI dashboards (orders/min, revenue/hour, conversion rate)</li>
<li>Implement tail-based sampling (keep errors + slow + random 10%)</li>
<li>Add exemplars (link metrics → traces for drill-down)</li>
<li>Create runbooks for every alert. No runbook = no alert in production.</li>
</ul>
<p><strong>Technology choices:</strong></p>
<ul>
<li><strong>Instrumentation:</strong> OpenTelemetry .NET SDK</li>
<li><strong>Collection:</strong> OTel Collector (gateway mode for centralized sampling)</li>
<li><strong>Metrics:</strong> Prometheus/Mimir (PromQL is the industry standard)</li>
<li><strong>Logs:</strong> Loki (label-based, cost-effective) or Elasticsearch (if full-text search critical)</li>
<li><strong>Traces:</strong> Tempo (native OTel, scales with object storage)</li>
<li><strong>Visualization:</strong> Grafana (unified view of all three pillars)</li>
<li><strong>Alerting:</strong> Grafana Alerting → PagerDuty</li>
</ul>`
        },
        {
            id: 'obs-q8',
            level: 'lead',
            title: 'What is structured logging and why is it critical in distributed systems? Show the difference from unstructured.',
            answer: `<p><strong>Structured logging</strong> emits log events as machine-parseable key-value pairs (typically JSON) rather than human-readable strings.</p>
<p><strong>Unstructured (BAD):</strong></p>
<pre><code>2024-01-15 10:23:45 ERROR: Payment failed for customer 12345, amount $99.99, reason: card_declined</code></pre>
<p><strong>Structured (GOOD):</strong></p>
<pre><code>{"timestamp":"2024-01-15T10:23:45Z","level":"error","message":"Payment failed","customer_id":"12345","amount":99.99,"currency":"USD","reason":"card_declined","trace_id":"abc-123","service":"PaymentService","environment":"production"}</code></pre>
<p><strong>Why it matters in distributed systems:</strong></p>
<ul>
<li><strong>Queryable:</strong> "Show me all errors where amount > 1000 AND reason = 'card_declined'" — impossible with unstructured text.</li>
<li><strong>Correlated:</strong> trace_id field lets you find ALL logs across ALL services for one request.</li>
<li><strong>Alertable:</strong> You can create alerts on specific field values (e.g., error rate by reason code).</li>
<li><strong>Parseable:</strong> Log aggregators (Loki, Elasticsearch) can index fields for fast search without regex gymnastics.</li>
</ul>
<p><strong>Implementation with Serilog (.NET):</strong></p>
<pre><code>Log.Error("Payment failed for {CustomerId}, amount {Amount}, reason {Reason}", customerId, amount, reason);</code></pre>
<p>Serilog captures the named parameters as separate properties in the JSON output, while also rendering a human-readable message.</p>`
        },
        {
            id: 'obs-q9',
            level: 'architect',
            title: 'How would you handle observability cost at scale (10,000+ services, petabytes of telemetry)?',
            answer: `<p><strong>At hyperscale, observability infrastructure IS a distributed system itself.</strong> The primary challenge shifts from "how to collect" to "how to afford and manage."</p>
<p><strong>Cost control strategies:</strong></p>
<ol>
<li><strong>Tiered retention:</strong> Hot (7 days, fast query) → Warm (30 days, slower) → Cold (1 year, object storage). Most queries hit last 24 hours.</li>
<li><strong>Intelligent sampling:</strong> Tail-based sampling keeps 100% of errors/slow, 10% of healthy. Reduces trace volume by 80-90% while keeping all interesting data.</li>
<li><strong>Log level gating:</strong> In production, only INFO+ is exported. DEBUG stays local (or is sampled). Use dynamic log levels to temporarily enable DEBUG for specific services during incidents.</li>
<li><strong>Metric aggregation:</strong> Pre-aggregate metrics at the Collector level. Instead of sending per-pod metrics, send per-service aggregates. Reduces cardinality 10x.</li>
<li><strong>Topology-aware collection:</strong> OTel Collectors in gateway mode per region. Filter, sample, and compress BEFORE sending to central backend.</li>
<li><strong>Chargeback model:</strong> Each team pays for their telemetry volume. Creates natural incentive to reduce noise and fix chatty services.</li>
</ol>
<p><strong>Architecture at scale:</strong></p>
<ul>
<li><strong>Federated Prometheus:</strong> Per-cluster Prometheus instances with Thanos/Mimir for global query (keeps data local, queries globally).</li>
<li><strong>Object storage backend:</strong> Tempo/Loki/Mimir all use S3/GCS for long-term storage. Infinitely scalable, cheap per GB.</li>
<li><strong>Tenant isolation:</strong> Multi-tenant observability platform where each team has their own namespace, quotas, and dashboards.</li>
</ul>
<p><strong>Typical cost breakdown:</strong> Metrics (cheapest per data point), Traces (moderate — depends on sampling), Logs (most expensive — highest volume). Focus cost optimization on logs first.</p>`
        },
        {
            id: 'obs-q10',
            level: 'architect',
            title: 'Compare monitoring vs observability. When is traditional monitoring sufficient and when do you need full observability?',
            answer: `<p><strong>Monitoring</strong> = predefined questions with predefined answers. You set up dashboards and alerts for known failure modes. "Is the database up? Is CPU > 80%?"</p>
<p><strong>Observability</strong> = ability to ask arbitrary questions you didn't anticipate. "Why did checkout latency spike for users in EU between 2-3 PM, only for orders with 5+ items?"</p>
<table>
<tr><th>Aspect</th><th>Monitoring</th><th>Observability</th></tr>
<tr><td>Approach</td><td>Check known failure modes</td><td>Explore unknown unknowns</td></tr>
<tr><td>Questions</td><td>Predefined ("is it up?")</td><td>Ad-hoc ("why is it slow for subset X?")</td></tr>
<tr><td>Signal type</td><td>Metrics + uptime checks</td><td>Metrics + logs + traces (correlated)</td></tr>
<tr><td>Debugging</td><td>Dashboard → manual investigation</td><td>Dashboard → trace → log → root cause</td></tr>
<tr><td>Cost</td><td>Lower</td><td>Higher (more data, more tooling)</td></tr>
</table>
<p><strong>When monitoring is sufficient:</strong></p>
<ul>
<li>Monolith with simple architecture (one database, one app server)</li>
<li>Well-understood failure modes (you know exactly what can go wrong)</li>
<li>Low deployment frequency (changes are rare)</li>
</ul>
<p><strong>When you NEED observability:</strong></p>
<ul>
<li>Distributed microservices (requests cross 5+ service boundaries)</li>
<li>High deployment frequency (10+ deploys/day)</li>
<li>Novel/emergent failures (the system exhibits behaviors you didn't anticipate)</li>
<li>Multi-tenant platforms (need to isolate one tenant's experience)</li>
</ul>
<p>In practice, most production systems in 2024+ need observability. The question is how much to invest.</p>`
        }
    ]
});
