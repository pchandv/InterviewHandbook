'use strict';

PageData.register('production-incident-architecture', {
    title: 'Production Incident Architecture',
    description: 'Designing systems that survive, contain, and recover from production incidents through structured degradation, blast radius isolation, and recovery-oriented computing.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>Production incidents are inevitable. The difference between a 5-minute blip and a 5-hour outage lies not in preventing all failures, but in how your architecture responds when things go wrong. Incident-proof architecture is about building systems that are <strong>easy to debug</strong>, <strong>contain failures gracefully</strong>, and <strong>recover quickly</strong> — minimizing Mean Time To Recovery (MTTR) rather than obsessing solely over Mean Time Between Failures (MTBF).</p>
<p>This topic covers the architectural patterns that separate resilient production systems from fragile ones: structured observability, blast radius containment, graceful degradation ladders, kill switches, automated rollback, and recovery-oriented computing. These aren't afterthoughts bolted onto existing systems — they're foundational design decisions that must be made early and maintained continuously.</p>
<p>The goal is simple: when (not if) something breaks, your system should make it obvious what's wrong, prevent the failure from spreading, degrade gracefully rather than collapsing entirely, and recover with minimal human intervention.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>Production incident architecture rests on four pillars:</p>
<ul>
<li><strong>Debuggability</strong> — The ability to understand system behavior in production without attaching debuggers. This includes structured logging, distributed tracing, correlation IDs, and metrics that tell a story. A debuggable system answers "what happened, to whom, and why" within minutes.</li>
<li><strong>Blast Radius Containment</strong> — Architectural boundaries that prevent a failure in one component from cascading to others. Bulkheads, cell-based architecture, zone isolation, and circuit breakers all serve to contain the damage.</li>
<li><strong>Graceful Degradation</strong> — A planned ladder of reduced functionality that maintains core value even as subsystems fail. Rather than binary up/down states, systems progressively shed non-critical features to preserve essential operations.</li>
<li><strong>Recovery-Oriented Computing</strong> — Designing for fast recovery rather than perfect uptime. This means automated rollback triggers, self-healing mechanisms, and reducing the cognitive load on on-call engineers during incidents.</li>
</ul>
<p>Supporting these pillars are operational practices: runbooks, game days, chaos engineering, and incident response playbooks that ensure teams can execute recovery procedures under pressure.</p>`,
            table: {
                headers: ['Concept', 'Goal', 'Key Metric', 'Example Pattern'],
                rows: [
                    ['Debuggability', 'Fast root cause identification', 'Time to diagnosis', 'Correlation IDs + structured logs'],
                    ['Blast Radius', 'Limit failure scope', '% users affected', 'Cell-based architecture'],
                    ['Degradation', 'Maintain partial service', 'Features available during incident', 'Degradation ladder'],
                    ['Recovery', 'Minimize downtime', 'MTTR', 'Automated rollback + canary analysis']
                ]
            }
        },
        {
            title: 'How It Works',
            content: `<p>Building incident-ready systems requires intentional design across multiple layers:</p>
<h4>1. Observability Foundation</h4>
<p>Every request entering your system gets a <strong>correlation ID</strong> that propagates through all downstream calls. Structured logs (JSON format) include this ID, enabling you to reconstruct the complete journey of any request across dozens of services. Metrics are emitted at every decision point — not just success/failure, but latency percentiles, queue depths, and resource utilization.</p>
<h4>2. Failure Boundaries</h4>
<p>Services are grouped into <strong>cells</strong> or <strong>zones</strong> that share no state. A failure in Cell A cannot propagate to Cell B because they have no shared dependencies. Within a cell, <strong>bulkheads</strong> isolate thread pools so a slow dependency can't exhaust resources needed by healthy paths.</p>
<h4>3. Degradation Planning</h4>
<p>Before an incident occurs, you define the degradation ladder: what features to disable first, what to disable next, and what constitutes your minimum viable service. Each level has automated triggers (error rates, latency thresholds) and manual kill switches for human override.</p>
<h4>4. Recovery Automation</h4>
<p>Deployments use canary analysis to detect problems within minutes. Automated rollback triggers fire when error rates exceed thresholds. Self-healing mechanisms restart failed processes, drain unhealthy instances, and reroute traffic — all without human intervention.</p>
<h4>5. Pre-Incident Preparation</h4>
<p>Runbooks document exact steps for known failure modes. Game days simulate real incidents to build muscle memory. Chaos engineering continuously verifies that failure boundaries work as designed.</p>`
        },
        {
            title: 'Visual Diagram — Degradation Ladder',
            content: `<p>The degradation ladder defines progressive service reduction. Each transition has specific triggers (automated) and kill switches (manual). The system never jumps from full service to complete shutdown — it degrades gracefully through well-defined stages.</p>`,
            mermaid: `graph TD
    A[Full Service] -->|"Error rate > 1%<br/>or manual kill switch"| B[Reduced Features]
    B -->|"Error rate > 5%<br/>or dependency timeout"| C[Core Only]
    C -->|"Error rate > 25%<br/>or data integrity risk"| D[Maintenance Mode]
    D -->|"Infrastructure failure<br/>or security breach"| E[Controlled Shutdown]
    
    A --- A1["All features active<br/>Full personalization<br/>Real-time updates"]
    B --- B1["Disable recommendations<br/>Disable analytics<br/>Cache-only reads"]
    C --- C1["Core transactions only<br/>No search/browse<br/>Static fallbacks"]
    D --- D1["Read-only status page<br/>Queue incoming requests<br/>Preserve data integrity"]
    E --- E1["Graceful connection drain<br/>Persist in-flight state<br/>Alert all stakeholders"]
    
    style A fill:#2d6a4f,color:#fff
    style B fill:#52796f,color:#fff
    style C fill:#f4a261,color:#000
    style D fill:#e76f51,color:#fff
    style E fill:#9b2226,color:#fff`
        },
        {
            title: 'Implementation',
            content: `<p>Here are production-grade implementations of key incident architecture patterns in C#:</p>
<h4>Kill Switch Service</h4>
<p>A centralized service that controls feature degradation levels. Kill switches can be toggled via API (for automation) or dashboard (for humans). Changes propagate immediately without deployments.</p>`,
            code: `public enum DegradationLevel
{
    FullService = 0,
    ReducedFeatures = 1,
    CoreOnly = 2,
    MaintenanceMode = 3,
    Shutdown = 4
}

public interface IKillSwitchService
{
    DegradationLevel CurrentLevel { get; }
    bool IsFeatureEnabled(string featureName);
    Task SetDegradationLevel(DegradationLevel level, string reason, string triggeredBy);
    Task DisableFeature(string featureName, string reason);
}

public class KillSwitchService : IKillSwitchService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<KillSwitchService> _logger;
    private readonly IMetricsCollector _metrics;
    private volatile DegradationLevel _currentLevel = DegradationLevel.FullService;
    private readonly ConcurrentDictionary<string, bool> _featureStates = new();

    public DegradationLevel CurrentLevel => _currentLevel;

    public KillSwitchService(
        IDistributedCache cache,
        ILogger<KillSwitchService> logger,
        IMetricsCollector metrics)
    {
        _cache = cache;
        _logger = logger;
        _metrics = metrics;
    }

    public bool IsFeatureEnabled(string featureName)
    {
        // Check explicit kill switch first
        if (_featureStates.TryGetValue(featureName, out var enabled) && !enabled)
            return false;

        // Check degradation level rules
        return _currentLevel switch
        {
            DegradationLevel.FullService => true,
            DegradationLevel.ReducedFeatures => !IsNonEssentialFeature(featureName),
            DegradationLevel.CoreOnly => IsCoreFeature(featureName),
            DegradationLevel.MaintenanceMode => false,
            DegradationLevel.Shutdown => false,
            _ => false
        };
    }

    public async Task SetDegradationLevel(
        DegradationLevel level, string reason, string triggeredBy)
    {
        var previousLevel = _currentLevel;
        _currentLevel = level;

        _logger.LogCritical(
            "Degradation level changed from {Previous} to {Current}. " +
            "Reason: {Reason}. Triggered by: {TriggeredBy}",
            previousLevel, level, reason, triggeredBy);

        _metrics.RecordGauge("system.degradation_level", (int)level);

        // Persist to distributed cache for multi-instance sync
        await _cache.SetStringAsync("degradation:level",
            level.ToString(),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24) });

        // Publish event for other services
        await PublishDegradationEvent(previousLevel, level, reason);
    }

    public async Task DisableFeature(string featureName, string reason)
    {
        _featureStates[featureName] = false;

        _logger.LogWarning(
            "Feature killed: {Feature}. Reason: {Reason}",
            featureName, reason);

        await _cache.SetStringAsync(
            $"killswitch:{featureName}", "disabled");
    }

    private bool IsNonEssentialFeature(string feature) =>
        feature.StartsWith("recommendations") ||
        feature.StartsWith("analytics") ||
        feature.StartsWith("personalization");

    private bool IsCoreFeature(string feature) =>
        feature.StartsWith("auth") ||
        feature.StartsWith("transactions") ||
        feature.StartsWith("account");

    private Task PublishDegradationEvent(
        DegradationLevel previous, DegradationLevel current, string reason) =>
        Task.CompletedTask; // Implement with your message bus
}`,
            language: 'csharp'
        },
        {
            title: 'Implementation — Automated Degradation Monitor',
            content: `<p>This background service monitors system health metrics and automatically triggers degradation levels when thresholds are breached. It acts as the automated brain of your incident response.</p>`,
            code: `public class DegradationMonitorService : BackgroundService
{
    private readonly IKillSwitchService _killSwitch;
    private readonly IMetricsReader _metrics;
    private readonly ILogger<DegradationMonitorService> _logger;
    private readonly DegradationThresholds _thresholds;

    public DegradationMonitorService(
        IKillSwitchService killSwitch,
        IMetricsReader metrics,
        ILogger<DegradationMonitorService> logger,
        IOptions<DegradationThresholds> thresholds)
    {
        _killSwitch = killSwitch;
        _metrics = metrics;
        _logger = logger;
        _thresholds = thresholds.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await EvaluateSystemHealth();
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Degradation monitor evaluation failed");
            }
        }
    }

    private async Task EvaluateSystemHealth()
    {
        var errorRate = await _metrics.GetErrorRatePercent(TimeSpan.FromMinutes(5));
        var p99Latency = await _metrics.GetLatencyP99(TimeSpan.FromMinutes(5));
        var dependencyHealth = await _metrics.GetDependencyHealthScore();

        var recommendedLevel = DetermineLevel(errorRate, p99Latency, dependencyHealth);

        if (recommendedLevel > _killSwitch.CurrentLevel)
        {
            // Only auto-escalate, never auto-recover (humans decide recovery)
            await _killSwitch.SetDegradationLevel(
                recommendedLevel,
                $"Auto-trigger: ErrorRate={errorRate:F1}%, P99={p99Latency}ms, " +
                $"DependencyHealth={dependencyHealth:F1}%",
                "DegradationMonitor");
        }
    }

    private DegradationLevel DetermineLevel(
        double errorRate, long p99Latency, double dependencyHealth)
    {
        if (errorRate > _thresholds.ShutdownErrorRate)
            return DegradationLevel.Shutdown;
        if (errorRate > _thresholds.MaintenanceErrorRate || dependencyHealth < 25)
            return DegradationLevel.MaintenanceMode;
        if (errorRate > _thresholds.CoreOnlyErrorRate || p99Latency > _thresholds.CoreOnlyLatencyMs)
            return DegradationLevel.CoreOnly;
        if (errorRate > _thresholds.ReducedErrorRate || p99Latency > _thresholds.ReducedLatencyMs)
            return DegradationLevel.ReducedFeatures;
        return DegradationLevel.FullService;
    }
}

public class DegradationThresholds
{
    public double ReducedErrorRate { get; set; } = 1.0;
    public double CoreOnlyErrorRate { get; set; } = 5.0;
    public double MaintenanceErrorRate { get; set; } = 25.0;
    public double ShutdownErrorRate { get; set; } = 50.0;
    public long ReducedLatencyMs { get; set; } = 2000;
    public long CoreOnlyLatencyMs { get; set; } = 5000;
}`,
            language: 'csharp'
        },
        {
            title: 'Blast Radius Containment',
            content: `<p>Blast radius containment is the practice of designing architectural boundaries so that a failure in one area cannot cascade and bring down the entire system. The key patterns are:</p>
<h4>Cell-Based Architecture</h4>
<p>Divide your system into independent cells, each serving a subset of users or traffic. Cells share nothing — no databases, no caches, no message queues. A catastrophic failure in Cell 1 affects only the users routed to that cell (typically 5-10% of total traffic), while all other cells continue operating normally.</p>
<h4>Bulkhead Pattern</h4>
<p>Within a single service, isolate resource pools so that a slow or failing dependency cannot exhaust resources needed by healthy code paths. Separate thread pools, connection pools, and memory allocations for different downstream dependencies.</p>
<h4>Zone Isolation</h4>
<p>Deploy across multiple availability zones with the assumption that an entire zone can fail. Each zone should be able to handle full traffic independently. Zone-level failures are contained by load balancer health checks and automatic failover.</p>`,
            mermaid: `graph LR
    LB[Load Balancer] --> Cell1
    LB --> Cell2
    LB --> Cell3

    subgraph Cell1["Cell 1 (Users A-F)"]
        direction TB
        S1[Service Layer] --> DB1[(Database)]
        S1 --> C1[(Cache)]
        S1 --> Q1[Message Queue]
    end

    subgraph Cell2["Cell 2 (Users G-M)"]
        direction TB
        S2[Service Layer] --> DB2[(Database)]
        S2 --> C2[(Cache)]
        S2 --> Q2[Message Queue]
    end

    subgraph Cell3["Cell 3 (Users N-Z)"]
        direction TB
        S3[Service Layer] --> DB3[(Database)]
        S3 --> C3[(Cache)]
        S3 --> Q3[Message Queue]
    end

    CB1{Circuit Breaker} -.->|"OPEN: Cell 1 isolated"| Cell1
    CB2{Circuit Breaker} -.->|"CLOSED: Healthy"| Cell2
    CB3{Circuit Breaker} -.->|"CLOSED: Healthy"| Cell3

    style Cell1 fill:#ffcdd2,stroke:#c62828
    style Cell2 fill:#c8e6c9,stroke:#2e7d32
    style Cell3 fill:#c8e6c9,stroke:#2e7d32
    style CB1 fill:#e76f51,color:#fff
    style CB2 fill:#2d6a4f,color:#fff
    style CB3 fill:#2d6a4f,color:#fff`,
            code: `public class BulkheadPolicy<T>
{
    private readonly SemaphoreSlim _semaphore;
    private readonly string _name;
    private readonly ILogger _logger;

    public BulkheadPolicy(string name, int maxConcurrency, ILogger logger)
    {
        _name = name;
        _semaphore = new SemaphoreSlim(maxConcurrency, maxConcurrency);
        _logger = logger;
    }

    public async Task<T> ExecuteAsync(
        Func<Task<T>> action,
        Func<Task<T>> fallback,
        CancellationToken ct = default)
    {
        if (!await _semaphore.WaitAsync(TimeSpan.FromMilliseconds(100), ct))
        {
            _logger.LogWarning(
                "Bulkhead {Name} rejected request. " +
                "Available slots: {Available}/{Total}",
                _name, _semaphore.CurrentCount, _semaphore.CurrentCount);

            // Bulkhead full — execute fallback instead of queuing
            return await fallback();
        }

        try
        {
            return await action();
        }
        finally
        {
            _semaphore.Release();
        }
    }
}

// Usage: Isolate payment processing from recommendation engine
public class OrderService
{
    private readonly BulkheadPolicy<OrderResult> _paymentBulkhead;
    private readonly BulkheadPolicy<RecommendationResult> _recoBulkhead;

    public OrderService(ILoggerFactory loggerFactory)
    {
        // Payment gets 50 concurrent slots — critical path
        _paymentBulkhead = new BulkheadPolicy<OrderResult>(
            "payments", maxConcurrency: 50,
            loggerFactory.CreateLogger("Bulkhead.Payments"));

        // Recommendations get 10 slots — non-critical, can degrade
        _recoBulkhead = new BulkheadPolicy<RecommendationResult>(
            "recommendations", maxConcurrency: 10,
            loggerFactory.CreateLogger("Bulkhead.Recommendations"));
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Best Practices',
            content: `<p>Pre-incident preparation is what separates teams that resolve incidents in minutes from those that take hours:</p>
<h4>Runbooks</h4>
<ul>
<li>Document exact steps for every known failure mode — not general guidance, but specific commands to run</li>
<li>Include decision trees: "If metric X > threshold, do Y. If that doesn't work, escalate to Z."</li>
<li>Test runbooks quarterly by having someone unfamiliar with the system follow them</li>
<li>Store runbooks where they're accessible during outages (not in the system that's down)</li>
</ul>
<h4>Game Days</h4>
<ul>
<li>Schedule regular failure injection exercises in production (with safeguards)</li>
<li>Start small: kill a single instance and verify recovery. Progress to zone failures.</li>
<li>Include the full incident response process: detection, triage, communication, resolution</li>
<li>Debrief every game day — the process failures are more valuable than the technical ones</li>
</ul>
<h4>Chaos Engineering Principles</h4>
<ul>
<li>Form a hypothesis about steady-state behavior before injecting failure</li>
<li>Vary real-world events: instance failure, network partition, clock skew, disk full</li>
<li>Run experiments in production with blast radius controls</li>
<li>Automate experiments as continuous verification (not one-off tests)</li>
</ul>
<h4>Observability Readiness</h4>
<ul>
<li>Every service must emit: request rate, error rate, duration (RED metrics)</li>
<li>Correlation IDs must propagate through every async boundary (queues, events, scheduled jobs)</li>
<li>Dashboards must load within 5 seconds during incidents (pre-build, don't query on demand)</li>
<li>Alerts must be actionable — every alert should link to a runbook</li>
</ul>`,
            callout: {
                type: 'tip',
                title: 'The Golden Rule of Incident Prep',
                text: 'If you haven\'t tested your recovery procedure in the last 30 days, assume it doesn\'t work. Systems drift, dependencies change, and runbooks rot. Continuous verification is the only reliable approach.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<p>These anti-patterns turn minor issues into major outages:</p>
<h4>1. Silent Failures</h4>
<p>Catching exceptions and swallowing them, or logging at DEBUG level in production. When the system finally manifests a visible problem, hours of silent corruption have occurred. <strong>Fix:</strong> Every caught exception must result in a metric increment, even if the code can handle it gracefully.</p>
<h4>2. Missing Correlation Context</h4>
<p>Logs exist but can't be correlated. You know an error occurred but can't trace it back to the originating request, user, or deployment. <strong>Fix:</strong> Propagate correlation IDs through every boundary — HTTP headers, queue message properties, background job metadata.</p>
<h4>3. No Degradation Plan</h4>
<p>The system is either fully up or fully down. When a non-critical dependency fails, the entire service becomes unavailable. <strong>Fix:</strong> Identify which features can be disabled without affecting core value. Implement kill switches before you need them.</p>
<h4>4. Monitoring the Wrong Things</h4>
<p>Teams monitor CPU and memory but miss business metrics. The database has plenty of headroom, but orders are silently failing because a third-party payment API is returning errors. <strong>Fix:</strong> Monitor business outcomes (orders placed, logins succeeded) alongside infrastructure metrics.</p>
<h4>5. Runbooks That Don't Exist</h4>
<p>The team relies on tribal knowledge. When the one person who knows the system is unavailable at 3 AM, MTTR explodes. <strong>Fix:</strong> Every alert must link to a runbook. If you can't write a runbook, you don't understand the failure mode well enough.</p>
<h4>6. Testing Recovery in Staging Only</h4>
<p>Staging environments don't have production traffic patterns, data volumes, or cross-service dependencies. Recovery procedures that work in staging fail in production. <strong>Fix:</strong> Chaos engineering in production with proper blast radius controls.</p>
<h4>7. Cascading Timeouts</h4>
<p>Service A calls B calls C, each with a 30-second timeout. A single slow response in C causes A to hold connections for 90+ seconds, exhausting thread pools. <strong>Fix:</strong> Timeout budgets should decrease as you go deeper. Use circuit breakers to fail fast.</p>`
        },
        {
            title: 'Real-World Applications',
            content: `<p>These patterns aren't theoretical — they're battle-tested by organizations operating at massive scale:</p>
<h4>Netflix — Chaos Engineering Pioneer</h4>
<p>Netflix created Chaos Monkey (random instance termination) and evolved it into the Simian Army — tools that simulate zone failures, network latency, and dependency outages in production. Their key insight: <em>the best time to find weaknesses is when you choose to look, not when failures find you.</em> Every Netflix service must handle instance failure gracefully because Chaos Monkey might kill it at any time.</p>
<h4>AWS — Cell-Based Architecture</h4>
<p>AWS Route 53, DynamoDB, and other services use cell-based architecture where each cell operates independently. When a cell fails, only a small percentage of customers are affected. Cells share no state, and routing is deterministic (hash-based), so a failed cell doesn't increase load on healthy cells.</p>
<h4>Google — Error Budgets</h4>
<p>Google's SRE model defines error budgets: if your service's SLO is 99.9%, you have a 0.1% error budget per month. When the budget is exhausted, development freezes and the team focuses on reliability. This creates natural alignment between development velocity and production stability.</p>
<h4>Stripe — Graceful Degradation</h4>
<p>Stripe's payment processing system degrades gracefully by feature: analytics and reporting can fail without affecting payment processing. Their API returns partial responses when non-critical data is unavailable, with clear indicators of which fields are degraded.</p>
<h4>Microsoft Azure — Deployment Rings</h4>
<p>Azure deploys changes through progressive rings: internal dogfood → canary (1% traffic) → early adopters (10%) → broad deployment (100%). Automated rollback triggers at each ring based on error rate deltas compared to the control group.</p>`
        },
        {
            title: 'Automated Rollback',
            content: `<p>Automated rollback is the safety net that catches bad deployments before they become incidents. The key insight is that <strong>rollback should be the default</strong> — a deployment must prove itself healthy to stay, not wait for humans to notice it's broken.</p>
<h4>Canary Analysis</h4>
<p>Route a small percentage of traffic (1-5%) to the new version while the old version handles the rest. Compare key metrics (error rate, latency, business KPIs) between canary and control. If the canary is statistically worse, automatically roll back.</p>
<h4>Trigger Mechanisms</h4>
<ul>
<li><strong>Error rate delta:</strong> If canary error rate exceeds control by >0.5%, roll back</li>
<li><strong>Latency regression:</strong> If P99 latency increases by >20%, roll back</li>
<li><strong>Business metric drop:</strong> If conversion rate drops by >2%, roll back</li>
<li><strong>Health check failure:</strong> If new instances fail readiness probes within 60 seconds, roll back</li>
<li><strong>Manual override:</strong> On-call engineer can trigger immediate rollback via kill switch</li>
</ul>`,
            code: `public class CanaryAnalysisService
{
    private readonly IMetricsReader _metrics;
    private readonly IDeploymentService _deployment;
    private readonly ILogger<CanaryAnalysisService> _logger;
    private readonly CanaryConfig _config;

    public async Task<CanaryVerdict> AnalyzeCanary(
        string deploymentId, CancellationToken ct)
    {
        var canaryMetrics = await _metrics.GetMetricsForGroup(
            "canary", _config.AnalysisWindow);
        var controlMetrics = await _metrics.GetMetricsForGroup(
            "control", _config.AnalysisWindow);

        var verdict = EvaluateMetrics(canaryMetrics, controlMetrics);

        if (verdict.ShouldRollback)
        {
            _logger.LogCritical(
                "Canary analysis FAILED for deployment {DeploymentId}. " +
                "Reason: {Reason}. Triggering automated rollback.",
                deploymentId, verdict.Reason);

            await _deployment.RollbackAsync(deploymentId, verdict.Reason);
        }
        else if (verdict.IsHealthy && verdict.ConfidenceLevel >= 0.95)
        {
            _logger.LogInformation(
                "Canary analysis PASSED for {DeploymentId}. " +
                "Promoting to full rollout.",
                deploymentId);

            await _deployment.PromoteCanaryAsync(deploymentId);
        }

        return verdict;
    }

    private CanaryVerdict EvaluateMetrics(
        MetricSnapshot canary, MetricSnapshot control)
    {
        // Error rate comparison
        var errorRateDelta = canary.ErrorRate - control.ErrorRate;
        if (errorRateDelta > _config.MaxErrorRateDelta)
        {
            return CanaryVerdict.Rollback(
                $"Error rate delta {errorRateDelta:F2}% exceeds " +
                $"threshold {_config.MaxErrorRateDelta}%");
        }

        // Latency comparison
        var latencyIncrease = (canary.P99Latency - control.P99Latency)
            / (double)control.P99Latency * 100;
        if (latencyIncrease > _config.MaxLatencyIncreasePercent)
        {
            return CanaryVerdict.Rollback(
                $"P99 latency increased by {latencyIncrease:F1}% " +
                $"(threshold: {_config.MaxLatencyIncreasePercent}%)");
        }

        // Business metric comparison
        var conversionDelta = canary.ConversionRate - control.ConversionRate;
        if (conversionDelta < -_config.MaxConversionDrop)
        {
            return CanaryVerdict.Rollback(
                $"Conversion rate dropped by {Math.Abs(conversionDelta):F2}%");
        }

        // Calculate confidence based on sample size
        var confidence = CalculateStatisticalConfidence(canary, control);
        return CanaryVerdict.Healthy(confidence);
    }

    private double CalculateStatisticalConfidence(
        MetricSnapshot canary, MetricSnapshot control)
    {
        // Chi-squared test or similar statistical significance
        var totalSamples = canary.RequestCount + control.RequestCount;
        return Math.Min(1.0, totalSamples / (double)_config.MinSamplesForConfidence);
    }
}

public class CanaryConfig
{
    public TimeSpan AnalysisWindow { get; set; } = TimeSpan.FromMinutes(10);
    public double MaxErrorRateDelta { get; set; } = 0.5;
    public double MaxLatencyIncreasePercent { get; set; } = 20.0;
    public double MaxConversionDrop { get; set; } = 2.0;
    public int MinSamplesForConfidence { get; set; } = 1000;
}`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Production incident architecture questions separate candidates who've operated systems at scale from those who've only built them:</p>
<ul>
<li><strong>Show battle scars:</strong> Interviewers want to hear about real incidents you've handled. Structure your answers as: "We had a situation where X happened. The blast radius was Y. We mitigated by Z. We prevented recurrence by implementing W."</li>
<li><strong>Think in layers:</strong> When asked about resilience, cover all layers: prevention (chaos engineering), detection (observability), containment (blast radius), mitigation (degradation), and recovery (automated rollback).</li>
<li><strong>Quantify everything:</strong> Don't say "we improved reliability." Say "we reduced MTTR from 45 minutes to 8 minutes by implementing automated canary rollback."</li>
<li><strong>Discuss tradeoffs:</strong> Cell-based architecture improves blast radius but increases infrastructure cost and operational complexity. Show that you understand the cost of resilience.</li>
<li><strong>Know the economics:</strong> Every nine of availability (99.9% vs 99.99%) costs roughly 10x more. Be prepared to discuss where your system sits on this curve and why.</li>
<li><strong>Distinguish patterns from products:</strong> Circuit breakers are a pattern. Polly/Resilience4j are implementations. Know the pattern deeply — implementations change, principles don't.</li>
</ul>`,
            callout: {
                type: 'tip',
                title: 'The Question Behind the Question',
                text: 'When an interviewer asks "How would you handle a production incident?", they\'re really asking: "Have you built systems that make incidents manageable, or do you just fight fires?" Lead with architecture, not heroics.'
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li><strong>Design for MTTR, not just MTBF:</strong> Failures will happen. The architecture should minimize recovery time, not just failure frequency.</li>
<li><strong>Blast radius is a design decision:</strong> Cell-based architecture, bulkheads, and circuit breakers are choices you make at design time, not patches you apply after an outage.</li>
<li><strong>Degradation must be planned:</strong> Define your degradation ladder before an incident. Under pressure is the worst time to decide what to disable.</li>
<li><strong>Kill switches enable speed:</strong> The ability to instantly disable a feature in production gives you confidence to ship faster. It's a safety net, not an admission of fragility.</li>
<li><strong>Automated rollback is the default:</strong> Deployments should prove themselves healthy. If they can't, they roll back automatically without human intervention.</li>
<li><strong>Observability is a prerequisite:</strong> You cannot debug what you cannot observe. Structured logging, correlation IDs, and distributed tracing are non-negotiable.</li>
<li><strong>Practice makes prepared:</strong> Game days and chaos engineering build the muscle memory needed to act quickly during real incidents. Untested recovery procedures are unreliable.</li>
<li><strong>Runbooks reduce cognitive load:</strong> During an incident, adrenaline impairs decision-making. Pre-written runbooks with specific steps bypass the need for complex reasoning under stress.</li>
<li><strong>Silent failures are the worst failures:</strong> A loud failure gets fixed. A silent failure corrupts data for hours before anyone notices. Always fail visibly.</li>
<li><strong>Recovery over prevention:</strong> Recovery-oriented computing accepts that prevention has limits. Invest proportionally: some in prevention, more in fast recovery.</li>
</ul>`
        }
    ],
    questions: [
        {
            id: 'pia-q1',
            level: 'mid',
            title: 'How do you design a system to be debuggable in production?',
            answer: `<p>A production-debuggable system relies on three pillars: <strong>structured logging</strong>, <strong>distributed tracing</strong>, and <strong>correlation IDs</strong>.</p>
<p><strong>Structured Logging:</strong> All logs are emitted as JSON with consistent fields — timestamp, service name, correlation ID, log level, and a structured payload. This enables machine parsing and efficient querying across millions of log entries. Never log unstructured strings in production.</p>
<p><strong>Correlation IDs:</strong> Every incoming request receives a unique ID (typically a GUID) that propagates through all downstream service calls via HTTP headers (e.g., X-Correlation-ID), message queue properties, and background job metadata. This lets you reconstruct the complete journey of any single request across dozens of services.</p>
<p><strong>Distributed Tracing:</strong> Beyond correlation, tracing captures the timing and hierarchy of operations. Each span records start time, duration, parent span, and custom attributes. Tools like OpenTelemetry standardize this across languages and frameworks.</p>
<p>Additional practices include: emitting metrics at every decision point (not just success/failure), using semantic log levels consistently (ERROR = requires action, WARN = unusual but handled), tagging logs with deployment version and instance ID, and pre-building dashboards that answer common incident questions within seconds of loading.</p>
<p>The test of debuggability: can a new team member identify why a specific user request failed within 5 minutes, using only the observability tooling?</p>`
        },
        {
            id: 'pia-q2',
            level: 'junior',
            title: 'What is a circuit breaker pattern and why is it important?',
            answer: `<p>A circuit breaker is a design pattern that prevents a service from repeatedly calling a failing dependency. It works like an electrical circuit breaker — when too many failures occur, it "opens" the circuit and immediately returns an error or fallback response without making the actual call.</p>
<p>The circuit breaker has three states:</p>
<ul>
<li><strong>Closed (normal):</strong> Requests flow through normally. Failures are counted.</li>
<li><strong>Open (tripped):</strong> All requests fail immediately without calling the dependency. A timer starts.</li>
<li><strong>Half-Open (testing):</strong> After the timer expires, a few test requests are allowed through. If they succeed, the circuit closes. If they fail, it opens again.</li>
</ul>
<p>Without circuit breakers, a slow or failing downstream service causes callers to pile up waiting, exhausting thread pools and memory. This creates a cascading failure where one bad service takes down everything. Circuit breakers fail fast, freeing resources and giving the failing service time to recover.</p>
<p>In C#, Polly is the standard library for implementing circuit breakers, retries, and bulkheads as composable policies.</p>`
        },
        {
            id: 'pia-q3',
            level: 'senior',
            title: 'What is a degradation ladder and how would you implement one?',
            answer: `<p>A degradation ladder is a pre-planned sequence of service reductions that maintain core functionality as system health deteriorates. Rather than binary up/down states, the system progressively sheds non-critical features to preserve essential operations.</p>
<p>A typical ladder has four to five levels:</p>
<ol>
<li><strong>Full Service:</strong> Everything works. Personalization, recommendations, real-time updates, analytics — all active.</li>
<li><strong>Reduced Features:</strong> Disable non-critical features: recommendations serve cached/generic results, analytics stop collecting, real-time updates fall back to polling.</li>
<li><strong>Core Only:</strong> Only essential business operations remain. An e-commerce site can still process checkouts but search, browsing, and user profiles show cached data.</li>
<li><strong>Maintenance Mode:</strong> System is read-only. Users see a status page. Incoming write requests are queued for later processing.</li>
<li><strong>Controlled Shutdown:</strong> Graceful drain of connections, persist in-flight state, alert stakeholders.</li>
</ol>
<p>Implementation requires: a kill switch service that tracks current level, middleware that checks feature availability before executing non-core paths, automated triggers that escalate levels based on error rates and latency, and manual override capability for on-call engineers. Critically, <strong>only auto-escalate, never auto-recover</strong> — humans should verify stability before restoring service levels.</p>`,
            seniorPerspective: `<p>The hardest part of degradation ladders isn't the technical implementation — it's getting product and business stakeholders to agree on the priority order before an incident. Which features can you sacrifice? That's a business decision wrapped in a technical package. Run tabletop exercises with product managers to define the ladder collaboratively.</p>`
        },
        {
            id: 'pia-q4',
            level: 'senior',
            title: 'How do you contain blast radius in a distributed system?',
            answer: `<p>Blast radius containment uses architectural boundaries to prevent failures from cascading. The primary patterns are:</p>
<p><strong>Cell-Based Architecture:</strong> Partition your system into independent cells, each serving a deterministic subset of users (hash-based routing). Cells share nothing — separate databases, caches, and queues. A catastrophic failure in one cell affects only 5-10% of users while others are completely unaffected. AWS uses this pattern for Route 53 and DynamoDB.</p>
<p><strong>Bulkheads:</strong> Within a single service, isolate resource pools for different dependencies. If your service calls both a payment API and a recommendation engine, use separate thread pools and connection pools for each. A slow recommendation API can't exhaust the threads needed for payment processing.</p>
<p><strong>Circuit Breakers:</strong> Detect failing dependencies and stop calling them before failures cascade. Open circuits redirect to fallback behavior (cached data, default responses, or graceful errors).</p>
<p><strong>Zone Isolation:</strong> Deploy across availability zones where each zone can independently handle full traffic. A zone failure triggers automatic failover via load balancer health checks.</p>
<p><strong>Shuffle Sharding:</strong> Assign each customer to a random combination of cells/resources, ensuring that even if a "noisy neighbor" causes issues, different customers are affected by different failures — no single failure pattern impacts all of any one customer's resources.</p>
<p>The key principle: failures should affect the minimum possible scope. Design your boundaries so the blast radius of any single failure is bounded and predictable.</p>`,
            seniorPerspective: `<p>Cell architecture has real costs: N cells means N times the infrastructure, N times the operational complexity, and cross-cell operations (global search, analytics aggregation) become distributed systems problems themselves. The decision of how many cells to use is driven by your availability targets and acceptable blast radius per incident. Most teams start with 3-5 cells and expand based on actual incident patterns.</p>`
        },
        {
            id: 'pia-q5',
            level: 'architect',
            title: 'Design an automated rollback system for a microservices platform serving millions of requests per minute.',
            answer: `<p>An automated rollback system for a high-traffic microservices platform needs these components:</p>
<p><strong>1. Progressive Deployment Pipeline:</strong></p>
<ul>
<li>Deploy to canary instances (1-2% of traffic) with deterministic routing</li>
<li>Hold at canary for a configurable analysis window (5-15 minutes)</li>
<li>Progressively expand: 1% → 5% → 25% → 50% → 100%</li>
<li>Each stage has independent rollback criteria</li>
</ul>
<p><strong>2. Metric Collection & Comparison:</strong></p>
<ul>
<li>Collect RED metrics (Rate, Errors, Duration) from both canary and control groups</li>
<li>Include business metrics: conversion rates, transaction success, user engagement</li>
<li>Use statistical significance testing (not just threshold comparison) to avoid false positives from low sample sizes</li>
</ul>
<p><strong>3. Rollback Decision Engine:</strong></p>
<ul>
<li>Hard triggers: any metric exceeding absolute thresholds triggers immediate rollback</li>
<li>Soft triggers: statistical degradation compared to control group triggers rollback after confirmation window</li>
<li>Time-based: if a deployment can't prove healthy within 30 minutes, roll back (assume-unhealthy-until-proven-otherwise)</li>
</ul>
<p><strong>4. Rollback Execution:</strong></p>
<ul>
<li>Kubernetes: update deployment to previous image tag, wait for rollout complete</li>
<li>Blue-green: switch load balancer back to previous environment</li>
<li>Feature flags: disable new code path without redeploying</li>
<li>Database migrations: must be backward-compatible (expand-contract pattern)</li>
</ul>
<p><strong>5. Post-Rollback:</strong></p>
<ul>
<li>Alert the deploying team with full metric comparison report</li>
<li>Lock the deployment pipeline until root cause is identified</li>
<li>Preserve canary logs and metrics for debugging</li>
</ul>`,
            architectPerspective: `<p>The most overlooked aspect of automated rollback is <strong>data compatibility</strong>. Code can roll back instantly, but if the new version wrote data in a format the old version can't read, you have a much bigger problem. This is why database migrations must always use the expand-contract pattern: add new columns/tables in one deploy, migrate data, then remove old structures in a later deploy. The rollback window must encompass only backward-compatible changes. For stateful services, consider event sourcing — you can always replay events with old logic.</p>`
        },
        {
            id: 'pia-q6',
            level: 'mid',
            title: 'What are correlation IDs and how do they help during incidents?',
            answer: `<p>A correlation ID is a unique identifier (typically a GUID/UUID) assigned to every incoming request at the system boundary and propagated through all downstream operations. It's the thread that connects distributed log entries into a coherent narrative.</p>
<p><strong>How it works:</strong> When a request hits your API gateway, it generates a correlation ID (or accepts one from the X-Correlation-ID header). This ID is included in every log entry, passed to downstream services via HTTP headers, attached to message queue messages, and stored with background job metadata. Every piece of work triggered by that original request carries the same ID.</p>
<p><strong>During an incident:</strong> A customer reports "my order failed at 2:15 PM." You search logs by their user ID, find the correlation ID for that request, then query all services for logs with that correlation ID. Within seconds, you can see the complete chain: API Gateway → Order Service → Inventory Check → Payment Processing → where it failed and why.</p>
<p><strong>Without correlation IDs:</strong> You'd need to manually correlate logs by timestamp and guess which entries in different services relate to the same request. At thousands of requests per second, this is essentially impossible.</p>
<p><strong>Implementation tip:</strong> Use middleware to extract/generate the correlation ID early and store it in an async-local context (AsyncLocal in C#) so all downstream code can access it without explicit parameter passing.</p>`
        },
        {
            id: 'pia-q7',
            level: 'junior',
            title: 'What is the difference between a health check and a readiness probe?',
            answer: `<p>Health checks and readiness probes serve different purposes in production systems:</p>
<p><strong>Health Check (Liveness Probe):</strong> Answers "Is this process alive and not stuck?" If a liveness probe fails, the orchestrator (Kubernetes, load balancer) kills and restarts the instance. It should check that the process can respond to requests at all — not whether dependencies are healthy. A basic liveness probe might just return HTTP 200 if the web server can handle requests.</p>
<p><strong>Readiness Probe:</strong> Answers "Is this instance ready to receive traffic?" If a readiness probe fails, the instance is removed from the load balancer rotation but NOT killed. It should check that the service has completed startup (loaded caches, established database connections, warmed up JIT). A failing readiness probe during deployment means the new version can't serve traffic yet.</p>
<p><strong>Key difference:</strong> A liveness failure means "something is fundamentally broken, restart me." A readiness failure means "I'm alive but temporarily can't serve traffic, stop sending requests but don't kill me."</p>
<p><strong>Common mistake:</strong> Including database connectivity in liveness probes. If the database goes down, all instances get killed and restarted — making the problem worse. Database checks belong in readiness probes (stop sending traffic) not liveness probes (don't restart me for something that isn't my fault).</p>`
        },
        {
            id: 'pia-q8',
            level: 'lead',
            title: 'How do you implement kill switches for incident response, and what governance model prevents misuse?',
            answer: `<p>Kill switches are runtime controls that instantly disable features or change system behavior without a deployment. They're your fastest incident response tool — seconds to activate versus minutes for a rollback.</p>
<p><strong>Implementation:</strong></p>
<ul>
<li>Centralized configuration store (Redis, Consul, or purpose-built feature flag service) that all instances poll or subscribe to</li>
<li>Change propagation within seconds (pub/sub) rather than minutes (polling)</li>
<li>SDK in each service that checks kill switch state before executing non-core paths</li>
<li>Fallback behavior defined for every kill switch: what happens when the feature is disabled</li>
</ul>
<p><strong>Governance Model:</strong></p>
<ul>
<li><strong>Emergency switches</strong> (disable a failing feature): Any on-call engineer can activate. No approval needed. Auto-expire after 4 hours if not renewed.</li>
<li><strong>Degradation level changes</strong> (reduce entire system capability): Requires on-call lead confirmation. Auto-notify VP of Engineering.</li>
<li><strong>Permanent disables</strong> (remove a feature entirely): Requires product owner approval and creates a tracking ticket.</li>
</ul>
<p><strong>Preventing misuse:</strong> Full audit trail (who, when, why), automatic expiration on emergency switches, alerting when switches are active for more than 24 hours, regular review of long-lived switches in incident retrospectives.</p>
<p><strong>Testing:</strong> Kill switches must be tested regularly. Include "toggle kill switch X" in your game day exercises. A kill switch that's never been activated in production might not work when you need it.</p>`
        },
        {
            id: 'pia-q9',
            level: 'mid',
            title: 'Explain the concept of error budgets and how they relate to incident management.',
            answer: `<p>An error budget is the maximum amount of unreliability your service is allowed over a given period, derived from your Service Level Objective (SLO). If your SLO is 99.9% availability, your error budget is 0.1% of total requests per month — roughly 43 minutes of downtime or ~43,000 failed requests out of 43 million.</p>
<p><strong>How it works:</strong></p>
<ul>
<li>Define SLOs based on user expectations and business requirements</li>
<li>Calculate the error budget: 100% minus SLO target</li>
<li>Track actual error rate continuously against the budget</li>
<li>When budget is consumed: freeze feature deployments, focus on reliability improvements</li>
<li>When budget is healthy: deploy freely, take calculated risks</li>
</ul>
<p><strong>Relation to incidents:</strong> Each production incident consumes error budget. A 30-minute outage affecting all users might consume 70% of your monthly budget in one event. This creates natural consequences: teams that cause incidents burn their deployment freedom. Teams that invest in reliability earn more room to ship features.</p>
<p><strong>Why it works:</strong> Error budgets align incentives. Without them, reliability teams say "stop deploying" and feature teams say "ship faster." The error budget provides an objective, data-driven answer: "You can ship as fast as you want, as long as the error budget has room."</p>
<p>This model also informs incident severity: an incident that burns 50% of remaining budget is more severe than one that burns 5%, regardless of whether it technically affected "production."</p>`
        },
        {
            id: 'pia-q10',
            level: 'architect',
            title: 'How would you design a chaos engineering program for an organization that has never done it before?',
            answer: `<p>Introducing chaos engineering requires a progressive approach that builds confidence and capability over time:</p>
<p><strong>Phase 1 — Foundation (Months 1-2):</strong></p>
<ul>
<li>Establish baseline observability: ensure you can detect failures before you inject them</li>
<li>Document steady-state hypotheses for critical paths: "If we process 1000 orders/minute normally, we expect the system to maintain >950/minute during any single-component failure"</li>
<li>Run tabletop exercises: walk through failure scenarios on paper before injecting anything</li>
<li>Get executive sponsorship: chaos engineering that causes an outage without leadership buy-in ends the program</li>
</ul>
<p><strong>Phase 2 — Non-Production (Months 2-4):</strong></p>
<ul>
<li>Inject failures in staging/pre-production environments</li>
<li>Start with instance termination (the simplest failure mode)</li>
<li>Verify circuit breakers, retries, and failover actually work</li>
<li>Build confidence and fix discovered weaknesses before moving to production</li>
</ul>
<p><strong>Phase 3 — Controlled Production (Months 4-8):</strong></p>
<ul>
<li>Begin with small blast radius: single instance in a single cell during business hours</li>
<li>Always have a "big red button" to stop experiments immediately</li>
<li>Run experiments during peak traffic (that's when failures actually happen)</li>
<li>Graduate to dependency injection: latency, partial failures, DNS failures</li>
</ul>
<p><strong>Phase 4 — Continuous Verification (Month 8+):</strong></p>
<ul>
<li>Automate experiments as scheduled CI/CD jobs</li>
<li>Random failure injection during off-peak hours (Chaos Monkey model)</li>
<li>Expand to multi-service and zone-level failures</li>
<li>Integrate chaos results into deployment gates: services that fail chaos tests can't promote to production</li>
</ul>`,
            architectPerspective: `<p>The biggest risk isn't a chaos experiment causing an outage — it's the program being shut down after the first incident. Structure your program so early experiments have minimal blast radius and maximum learning. Report every weakness found as "discovered before it hurt customers." Frame chaos engineering as an insurance investment: the cost of controlled experiments is far less than the cost of uncontrolled outages. Always pair chaos findings with specific remediation work — finding problems without fixing them erodes trust in the program.</p>`
        },
        {
            id: 'pia-q11',
            level: 'lead',
            title: 'How do you structure on-call rotations and incident response to minimize MTTR?',
            answer: `<p>Effective incident response minimizes MTTR through preparation, clear roles, and automation:</p>
<p><strong>On-Call Structure:</strong></p>
<ul>
<li><strong>Two-tier rotation:</strong> Primary responder (first 5 minutes) and secondary/escalation (if primary can't resolve in 15 minutes)</li>
<li><strong>Service ownership:</strong> Teams own their services end-to-end. The team that builds it, runs it.</li>
<li><strong>Follow-the-sun:</strong> For global teams, hand off on-call to the team in daytime hours. Nobody should be paged at 3 AM regularly.</li>
<li><strong>Balanced load:</strong> Maximum 1 week on-call in 4. More frequent rotations cause burnout and knowledge gaps.</li>
</ul>
<p><strong>Incident Response Framework:</strong></p>
<ul>
<li><strong>Detection (automated):</strong> Alerts fire with severity, affected service, and runbook link. Target: <2 minutes from failure to alert.</li>
<li><strong>Triage (first 5 minutes):</strong> Responder assesses severity, determines blast radius, decides whether to escalate.</li>
<li><strong>Mitigation (first 15 minutes):</strong> Apply the quickest fix — rollback, kill switch, traffic shift. Root cause analysis comes later.</li>
<li><strong>Communication:</strong> Status page updated within 5 minutes. Internal Slack channel for responders. Stakeholder updates every 15 minutes.</li>
<li><strong>Resolution:</strong> Verify metrics return to baseline. Keep kill switches active for 30 minutes after "resolved."</li>
</ul>
<p><strong>MTTR Reduction Tactics:</strong> Pre-built dashboards that answer "what changed?" within 10 seconds. One-click rollback buttons. Automated runbook execution for known failure modes. Post-incident reviews that produce specific action items (not just "be more careful").</p>`
        },
        {
            id: 'pia-q12',
            level: 'junior',
            title: 'What is structured logging and why is it better than plain text logs?',
            answer: `<p>Structured logging means emitting log entries as key-value pairs (typically JSON) rather than free-form text strings. Instead of:</p>
<pre>2024-01-15 10:23:45 ERROR: Failed to process order 12345 for user john@email.com - payment timeout</pre>
<p>You emit:</p>
<pre>{"timestamp":"2024-01-15T10:23:45Z","level":"error","service":"order-service","correlationId":"abc-123","userId":"usr_456","orderId":"ord_12345","error":"payment_timeout","message":"Failed to process order","durationMs":30000}</pre>
<p><strong>Why it's better:</strong></p>
<ul>
<li><strong>Queryable:</strong> You can search for all errors with orderId=12345, or all payment_timeout errors in the last hour, or all requests by a specific user. With plain text, you're limited to regex matching.</li>
<li><strong>Aggregatable:</strong> You can count error types, calculate average durations, and build dashboards automatically. Plain text requires custom parsers for each log format.</li>
<li><strong>Consistent:</strong> Every log entry has the same fields, making it easy for tools (Elasticsearch, Splunk, CloudWatch) to index and search efficiently.</li>
<li><strong>Machine-readable:</strong> Automated alerting systems can parse structured logs directly. Plain text requires fragile regex extraction.</li>
</ul>
<p>In C#, libraries like Serilog make structured logging natural: <code>Log.Error("Failed to process order {OrderId} for {UserId}", orderId, userId)</code> — the values become queryable fields, not just string interpolation.</p>`
        },
        {
            id: 'pia-q13',
            level: 'senior',
            title: 'How do you implement recovery-oriented computing principles in a modern distributed system?',
            answer: `<p>Recovery-oriented computing (ROC) inverts the traditional reliability approach: instead of trying to prevent all failures, design systems that recover quickly and safely from inevitable failures.</p>
<p><strong>Core Principles:</strong></p>
<ul>
<li><strong>Assume failure is normal:</strong> Every component will fail. Design interfaces and protocols around this assumption. Use timeouts, retries with backoff, and fallbacks as standard patterns — not exception handling.</li>
<li><strong>Minimize recovery scope:</strong> When something fails, restart only the affected component, not the entire system. Microservice architectures naturally support this — restart one service without touching others.</li>
<li><strong>Recursive restartability:</strong> Components should be safe to restart at any time. This means idempotent operations, stateless services, and externalized state. If you can restart any component safely, recovery becomes trivial.</li>
<li><strong>Undo support:</strong> Build operations that can be reversed. Saga patterns with compensating transactions. Event sourcing that allows replaying from any point. Soft deletes instead of hard deletes.</li>
</ul>
<p><strong>Practical Implementation:</strong></p>
<ul>
<li>All operations are idempotent (safe to retry)</li>
<li>All state is externalized (Redis, database) — no in-memory state that's lost on restart</li>
<li>Startup includes self-validation: verify dependencies, warm caches, check data integrity before accepting traffic</li>
<li>Graceful shutdown preserves in-flight operations: drain connections, complete pending work, persist queued items</li>
<li>Every write operation has a corresponding compensating action defined at design time</li>
</ul>
<p>The ROC litmus test: can you restart any component at any time without data loss, user-visible errors, or manual intervention?</p>`
        },
        {
            id: 'pia-q14',
            level: 'architect',
            title: 'How would you architect a system where a failure in any single component affects less than 1% of users?',
            answer: `<p>Achieving <1% blast radius per component failure requires a combination of cell isolation, redundancy, and intelligent routing:</p>
<p><strong>Architecture Overview:</strong></p>
<ul>
<li><strong>Cell topology:</strong> Minimum 10 cells, each serving ~10% of users. Hash-based routing ensures deterministic assignment. Each cell is a complete, independent deployment of all services with dedicated compute, storage, and networking.</li>
<li><strong>Sub-cell redundancy:</strong> Within each cell, run N+2 instances of every service. Loss of any single instance affects 0% of users because traffic redistributes to surviving instances immediately.</li>
<li><strong>Multi-zone deployment:</strong> Each cell spans 3 availability zones. A full zone failure loses 1/3 of a cell's capacity but the remaining 2/3 absorbs the load (hence N+2 sizing).</li>
</ul>
<p><strong>Routing and Isolation:</strong></p>
<ul>
<li>Global load balancer routes users to cells based on consistent hashing (user_id mod cell_count)</li>
<li>No cross-cell communication for user-facing requests. Each cell is fully self-contained.</li>
<li>Shared components (user directory, global config) are replicated into each cell as read-only caches</li>
<li>If a cell becomes unhealthy, its users are redistributed to remaining cells (which must be sized with headroom)</li>
</ul>
<p><strong>Component-Level Isolation:</strong></p>
<ul>
<li>Within a cell, bulkhead patterns isolate each service's resource usage</li>
<li>Circuit breakers prevent cascading between services within a cell</li>
<li>Service mesh (Envoy/Istio) provides transparent retry, timeout, and circuit breaking at the network level</li>
</ul>
<p><strong>Trade-offs:</strong> 10 cells means ~10x infrastructure cost (partially offset by smaller instance sizes). Operational complexity increases significantly — deployments must be coordinated across cells, and monitoring must track per-cell health. Cross-cell operations (global search, analytics) require separate infrastructure that aggregates from all cells.</p>`,
            architectPerspective: `<p>The economics of cell architecture favor it when downtime cost exceeds infrastructure cost. For a payments platform processing $1M/minute, 10 minutes of full outage costs $10M — far more than the extra infrastructure. But for a content site with $10K/hour revenue, the math may not work. Always model the total cost of downtime (lost revenue + customer trust + SLA penalties + engineering time) against the cost of additional infrastructure and operational complexity. Most companies find the sweet spot at 3-5 cells rather than 10+, accepting 20-30% blast radius as sufficient for their risk profile.</p>`
        },
        {
            id: 'pia-q15',
            level: 'mid',
            title: 'What is the difference between retries, circuit breakers, and bulkheads? When would you use each?',
            answer: `<p>These three patterns address different failure modes and work best in combination:</p>
<p><strong>Retries:</strong> Handle transient failures — network blips, momentary overloads, brief GC pauses. The assumption is that the same request will succeed if tried again shortly. Use exponential backoff with jitter to avoid thundering herds. <em>When to use:</em> Transient errors (HTTP 503, connection reset, timeout on a normally-fast operation). <em>When NOT to use:</em> Deterministic failures (HTTP 400, validation errors) or when the downstream is known to be down.</p>
<p><strong>Circuit Breakers:</strong> Handle sustained failures — a dependency that's down and won't recover quickly. Instead of burning resources on doomed retries, fail fast and use a fallback. <em>When to use:</em> Between services where a dependency can be unavailable for minutes or hours. Protects the caller from wasting resources. <em>When NOT to use:</em> For in-process calls or when you have no fallback behavior.</p>
<p><strong>Bulkheads:</strong> Handle resource exhaustion — prevent one slow dependency from consuming all available resources (threads, connections, memory) that healthy code paths need. <em>When to use:</em> When your service calls multiple downstream dependencies and a failure in one shouldn't affect others. Isolate each dependency's resource pool. <em>When NOT to use:</em> For services with a single dependency (no isolation needed).</p>
<p><strong>Composition:</strong> In practice, you combine all three: retry within a bulkhead (limited concurrent retries), with a circuit breaker that stops all attempts when the failure is sustained. Polly in C# makes this composition declarative.</p>`
        }
    ]
});
