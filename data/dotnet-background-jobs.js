'use strict';

PageData.register('dotnet-background-jobs', {
    title: 'Background Jobs & Workers',
    description: 'IHostedService, BackgroundService, Hangfire, Quartz.NET, and reliability patterns for .NET background processing',
    sections: [
        {
            title: 'IHostedService and BackgroundService',
            content: `<p>.NET provides built-in abstractions for background work that integrate with the host lifecycle.</p>
<ul>
<li><strong>IHostedService</strong> - Interface with StartAsync/StopAsync. Full control over lifecycle.</li>
<li><strong>BackgroundService</strong> - Abstract class implementing IHostedService. Override ExecuteAsync for long-running work.</li>
<li><strong>Worker Service</strong> - Project template for headless services (no HTTP). Uses BackgroundService pattern.</li>
</ul>
<p>Hosted services are registered with <code>builder.Services.AddHostedService&lt;T&gt;()</code> and managed by the host. They start after the app starts and stop gracefully on shutdown.</p>`
        },
        {
            title: 'BackgroundService Lifecycle',
            mermaid: `graph TD
    A[Host Starting] --> B[StartAsync called]
    B --> C[ExecuteAsync begins]
    C --> D{CancellationToken signaled?}
    D -->|No| E[Do Work]
    E --> F[await Task.Delay or await next item]
    F --> D
    D -->|Yes| G[Exit ExecuteAsync]
    G --> H[StopAsync called]
    H --> I[Dispose]
    I --> J[Host Stopped]
    
    K[Unhandled Exception in ExecuteAsync] --> L[Service Stops]
    L --> M[Host continues - other services unaffected]
    M --> N[.NET 8+: BackgroundServiceExceptionBehavior.StopHost]`,
            content: `<p>Important: In .NET 6+, an unhandled exception in ExecuteAsync stops only that service by default. Set <code>BackgroundServiceExceptionBehavior.StopHost</code> if the service is critical and should bring down the host on failure.</p>`
        },
        {
            title: 'BackgroundService Implementation',
            code: `// Basic polling worker
public class OrderProcessorWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrderProcessorWorker> _logger;

    public OrderProcessorWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<OrderProcessorWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Order processor starting");
        
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Create scope for scoped services (DbContext, etc.)
                using var scope = _scopeFactory.CreateScope();
                var orderService = scope.ServiceProvider
                    .GetRequiredService<IOrderService>();
                
                await orderService.ProcessPendingOrdersAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error processing orders");
            }
            
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}

// Registration
builder.Services.AddHostedService<OrderProcessorWorker>();

// Configure exception behavior (.NET 8+)
builder.Services.Configure<HostOptions>(options =>
{
    options.BackgroundServiceExceptionBehavior = 
        BackgroundServiceExceptionBehavior.StopHost;
});`,
            language: 'csharp'
        },
        {
            title: 'Channel<T> Producer/Consumer Pattern',
            code: `// Channel-based producer/consumer with backpressure
public class EventProcessingService : BackgroundService
{
    private readonly Channel<DomainEvent> _channel;
    
    public EventProcessingService()
    {
        // Bounded channel provides backpressure
        _channel = Channel.CreateBounded<DomainEvent>(
            new BoundedChannelOptions(1000)
            {
                FullMode = BoundedChannelFullMode.Wait,
                SingleReader = false,
                SingleWriter = false
            });
    }

    // Producer - called from controllers/services
    public async ValueTask PublishAsync(DomainEvent evt, CancellationToken ct)
    {
        await _channel.Writer.WriteAsync(evt, ct);
    }

    // Consumer - runs in background
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Multiple consumers for parallelism
        var consumers = Enumerable.Range(0, Environment.ProcessorCount)
            .Select(_ => ConsumeAsync(stoppingToken));
        
        await Task.WhenAll(consumers);
    }

    private async Task ConsumeAsync(CancellationToken ct)
    {
        await foreach (var evt in _channel.Reader.ReadAllAsync(ct))
        {
            await ProcessEventAsync(evt);
        }
    }

    // Graceful shutdown: complete writer, drain remaining items
    public override async Task StopAsync(CancellationToken ct)
    {
        _channel.Writer.Complete();
        await base.StopAsync(ct);
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Producer/Consumer Data Flow',
            mermaid: `graph LR
    A[HTTP Request 1] -->|WriteAsync| B[Channel - Bounded Buffer]
    C[HTTP Request 2] -->|WriteAsync| B
    D[Message Handler] -->|WriteAsync| B
    B -->|ReadAllAsync| E[Consumer 1]
    B -->|ReadAllAsync| F[Consumer 2]
    B -->|ReadAllAsync| G[Consumer 3]
    E --> H[Process Event]
    F --> H
    G --> H
    H --> I[Database / External API]
    
    J[Backpressure] -.->|Channel Full| A
    K[Graceful Shutdown] -.->|Writer.Complete| B`,
            content: `<p>Channel&lt;T&gt; is the preferred in-process queue for .NET. It supports bounded/unbounded modes, single/multi reader-writer, and integrates with async/await. Use bounded channels for backpressure - producers wait when the buffer is full, preventing memory exhaustion.</p>`
        },
        {
            title: 'Hangfire',
            code: `// Hangfire - persistent background job processing
// Stores jobs in SQL Server, Redis, or other storage

// Fire-and-forget - execute once as soon as possible
BackgroundJob.Enqueue(() => emailService.SendWelcomeEmail(userId));

// Delayed - execute after a time span
BackgroundJob.Schedule(
    () => orderService.SendReminder(orderId),
    TimeSpan.FromHours(24));

// Recurring - cron-based scheduling
RecurringJob.AddOrUpdate(
    "daily-report",
    () => reportService.GenerateDailyReport(),
    Cron.Daily(hour: 6, minute: 0));

// Continuations - chain jobs
var parentId = BackgroundJob.Enqueue(() => ProcessOrder(orderId));
BackgroundJob.ContinueWith(parentId, () => SendConfirmation(orderId));

// Batches (Hangfire Pro)
BatchJob.StartNew(batch =>
{
    foreach (var userId in userIds)
    {
        batch.Enqueue(() => MigrateUser(userId));
    }
});

// Configuration
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(connectionString));

builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = Environment.ProcessorCount * 2;
    options.Queues = new[] { "critical", "default", "low" };
});`,
            language: 'csharp'
        },
        {
            title: 'Quartz.NET',
            code: `// Quartz.NET - enterprise job scheduling
// More control over scheduling than Hangfire

// Define a job
public class InvoiceGenerationJob : IJob
{
    private readonly IInvoiceService _invoiceService;
    
    public InvoiceGenerationJob(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        var data = context.MergedJobDataMap;
        var tenantId = data.GetString("tenantId");
        
        await _invoiceService.GenerateMonthlyInvoices(tenantId);
    }
}

// Configure with DI
builder.Services.AddQuartz(q =>
{
    q.UseMicrosoftDependencyInjectionJobFactory();
    
    var jobKey = new JobKey("invoice-generation");
    q.AddJob<InvoiceGenerationJob>(opts => opts.WithIdentity(jobKey));
    
    q.AddTrigger(opts => opts
        .ForJob(jobKey)
        .WithIdentity("invoice-trigger")
        .WithCronSchedule("0 0 1 1 * ?") // 1st of every month at midnight
        .UsingJobData("tenantId", "default"));
    
    // Misfire handling
    q.AddTrigger(opts => opts
        .ForJob(jobKey)
        .WithSimpleSchedule(x => x
            .WithIntervalInHours(1)
            .RepeatForever()
            .WithMisfireHandlingInstructionFireNow()));
});

builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);`,
            language: 'csharp'
        },
        {
            title: 'Reliability Patterns',
            content: `<p>Background jobs must handle failures gracefully since they run without user interaction.</p>
<ul>
<li><strong>At-least-once delivery</strong> - Jobs may execute multiple times on failure/restart. Default for Hangfire, most queue systems.</li>
<li><strong>Idempotency</strong> - Make jobs safe to re-execute. Use idempotency keys, upserts, or check-before-act patterns.</li>
<li><strong>Retry with backoff</strong> - Exponential backoff with jitter prevents thundering herd on transient failures.</li>
<li><strong>Dead letter queue</strong> - After max retries, move to DLQ for manual investigation.</li>
<li><strong>Poisoned message handling</strong> - Detect and isolate messages that always fail to prevent queue blocking.</li>
</ul>`
        },
        {
            title: 'Graceful Shutdown Pattern',
            code: `public class GracefulWorker : BackgroundService
{
    private readonly ILogger<GracefulWorker> _logger;
    private readonly TimeSpan _shutdownTimeout = TimeSpan.FromSeconds(30);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var batch = await FetchBatchAsync(stoppingToken);
            
            foreach (var item in batch)
            {
                // Check cancellation between items (cooperative shutdown)
                if (stoppingToken.IsCancellationRequested)
                {
                    _logger.LogWarning(
                        "Shutdown requested. {Remaining} items not processed",
                        batch.Count - batch.IndexOf(item));
                    break;
                }
                
                await ProcessItemAsync(item, stoppingToken);
            }
            
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Graceful shutdown initiated");
        
        // Create a linked token with timeout
        using var cts = CancellationTokenSource
            .CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(_shutdownTimeout);
        
        await base.StopAsync(cts.Token);
        _logger.LogInformation("Worker stopped gracefully");
    }
}

// Host configuration for shutdown timeout
builder.Host.ConfigureHostOptions(opts =>
{
    opts.ShutdownTimeout = TimeSpan.FromSeconds(60);
});`,
            language: 'csharp'
        },
        {
            title: 'Health Monitoring',
            code: `// Health check for background workers
public class WorkerHealthCheck : IHealthCheck
{
    private readonly WorkerMetrics _metrics;
    
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken ct)
    {
        var lastHeartbeat = _metrics.LastHeartbeat;
        var timeSinceLastBeat = DateTime.UtcNow - lastHeartbeat;
        
        if (timeSinceLastBeat > TimeSpan.FromMinutes(5))
            return Task.FromResult(HealthCheckResult.Unhealthy(
                $"No heartbeat for {timeSinceLastBeat.TotalMinutes:F1} minutes"));
        
        if (_metrics.ConsecutiveErrors > 10)
            return Task.FromResult(HealthCheckResult.Degraded(
                $"High error rate: {_metrics.ConsecutiveErrors} consecutive failures"));
        
        return Task.FromResult(HealthCheckResult.Healthy(
            $"Last processed: {lastHeartbeat:u}, Queue depth: {_metrics.QueueDepth}"));
    }
}

// Registration
builder.Services.AddHealthChecks()
    .AddCheck<WorkerHealthCheck>("background-worker",
        failureStatus: HealthStatus.Unhealthy,
        tags: new[] { "worker", "ready" });`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'What is the difference between IHostedService and BackgroundService? When would you implement IHostedService directly?',
            difficulty: 'easy',
            answer: `<p><strong>BackgroundService</strong> is an abstract class that implements IHostedService. It provides a simpler programming model - just override ExecuteAsync.</p>
<p><strong>Implement IHostedService directly when:</strong></p>
<ul>
<li>You need custom StartAsync/StopAsync logic (e.g., opening connections, initializing caches)</li>
<li>Your service does not loop continuously (one-time initialization, event subscription)</li>
<li>You need to control the Task returned from StartAsync (BackgroundService always returns immediately)</li>
</ul>
<pre><code>// IHostedService for initialization work
public class CacheWarmer : IHostedService
{
    public async Task StartAsync(CancellationToken ct)
    {
        await _cache.WarmUpAsync(ct); // blocks app startup until complete
    }
    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}</code></pre>
<p><strong>Key difference:</strong> BackgroundService.ExecuteAsync runs asynchronously and does not block startup. IHostedService.StartAsync blocks the host from starting until it completes (unless you fire-and-forget).</p>`,
            interviewTip: 'The key insight is StartAsync blocking behavior. BackgroundService hides this by immediately returning from StartAsync and running ExecuteAsync in the background.',
            followUp: ['What happens if StartAsync throws an exception?', 'How do hosted services interact with dependency injection scopes?'],
            seniorPerspective: 'Use BackgroundService for 95% of cases. IHostedService is for when you need to guarantee initialization completes before the app accepts traffic (cache warming, schema migration).',
            architectPerspective: 'IHostedService ordering matters - services start in registration order and stop in reverse. Design startup dependencies carefully and use health checks to signal readiness.'
        },
        {
            question: 'How do you handle scoped services (like DbContext) inside a BackgroundService?',
            difficulty: 'medium',
            answer: `<p>BackgroundService is registered as a Singleton. Scoped services (DbContext, repositories) cannot be injected directly into singletons.</p>
<p><strong>Solution:</strong> Inject <code>IServiceScopeFactory</code> and create a scope per unit of work.</p>
<pre><code>protected override async Task ExecuteAsync(CancellationToken ct)
{
    while (!ct.IsCancellationRequested)
    {
        using (var scope = _scopeFactory.CreateScope())
        {
            var dbContext = scope.ServiceProvider
                .GetRequiredService&lt;AppDbContext&gt;();
            
            var orders = await dbContext.Orders
                .Where(o => o.Status == OrderStatus.Pending)
                .ToListAsync(ct);
            
            foreach (var order in orders)
            {
                order.Status = OrderStatus.Processing;
            }
            await dbContext.SaveChangesAsync(ct);
        } // scope disposed - DbContext disposed
        
        await Task.Delay(TimeSpan.FromSeconds(10), ct);
    }
}</code></pre>
<p><strong>Key points:</strong></p>
<ul>
<li>Create a new scope for each logical unit of work</li>
<li>Dispose the scope when done (using statement)</li>
<li>Never hold a scope reference across iterations</li>
<li>Each scope gets its own DbContext instance with change tracking reset</li>
</ul>`,
            interviewTip: 'This is one of the most common mistakes in .NET background services. Explain WHY it fails (captive dependency) and the correct pattern.',
            followUp: ['What is the captive dependency problem?', 'How does this change with .NET 8 keyed services?'],
            seniorPerspective: 'Consider extracting the scoped work into a separate class that receives its dependencies normally. The BackgroundService becomes a thin orchestrator that creates scopes and delegates.',
            architectPerspective: 'The scope-per-iteration pattern mirrors scope-per-request in web apps. Each iteration should be treated as an independent unit of work with its own transaction boundary.'
        },
        {
            question: 'Compare Hangfire vs Quartz.NET. When would you choose each?',
            difficulty: 'medium',
            answer: `<p><strong>Hangfire:</strong></p>
<ul>
<li>Persistent job storage (SQL Server, Redis, PostgreSQL)</li>
<li>Built-in dashboard for monitoring</li>
<li>Automatic retries with configurable policy</li>
<li>Job continuations and batches (Pro)</li>
<li>Best for: fire-and-forget tasks, delayed jobs, simple recurring jobs</li>
</ul>
<p><strong>Quartz.NET:</strong></p>
<ul>
<li>Port of Java Quartz - enterprise-grade scheduler</li>
<li>Complex trigger types (calendar-based, cron, intervals)</li>
<li>Job clustering for HA (multiple nodes, one executes)</li>
<li>Misfire handling policies</li>
<li>Best for: complex schedules, calendar-aware jobs, clustered environments</li>
</ul>
<p><strong>Choose Hangfire when:</strong> You need simple enqueue-and-forget with a nice dashboard, and persistence/retry are important.</p>
<p><strong>Choose Quartz.NET when:</strong> You need complex scheduling (business calendars, exclusion dates), job clustering across nodes, or fine-grained trigger control.</p>
<p><strong>Choose neither (just BackgroundService) when:</strong> Simple in-process work without persistence requirements (cache refresh, health pings).</p>`,
            interviewTip: 'Show you understand the tradeoffs. Hangfire is simpler to set up. Quartz.NET is more powerful for scheduling. Both are overkill for simple timers.',
            followUp: ['How does Hangfire handle job failures?', 'What is a misfire in Quartz.NET?'],
            seniorPerspective: 'The choice often comes down to existing infrastructure. If you already have SQL Server, Hangfire is trivial to add. If you need clustering and complex schedules, invest in Quartz.NET.',
            architectPerspective: 'Consider whether you need a job scheduler at all. For distributed systems, a message broker (RabbitMQ, Kafka) with delayed messages may be more appropriate than an in-process scheduler.'
        },
        {
            question: 'What is idempotency and how do you make background jobs idempotent?',
            difficulty: 'hard',
            answer: `<p><strong>Idempotent</strong> means executing the same operation multiple times produces the same result as executing it once. Essential for at-least-once delivery systems.</p>
<p><strong>Techniques:</strong></p>
<pre><code>// 1. Idempotency key in database
public async Task ProcessPayment(string idempotencyKey, PaymentRequest request)
{
    // Check if already processed
    var existing = await _db.ProcessedPayments
        .FirstOrDefaultAsync(p => p.IdempotencyKey == idempotencyKey);
    if (existing != null) return; // already done
    
    // Process and record
    await _paymentGateway.ChargeAsync(request);
    _db.ProcessedPayments.Add(new ProcessedPayment 
    { 
        IdempotencyKey = idempotencyKey,
        ProcessedAt = DateTime.UtcNow 
    });
    await _db.SaveChangesAsync();
}

// 2. Natural idempotency with upserts
await _db.Database.ExecuteSqlRawAsync(
    @"MERGE INTO Inventory AS target
      USING (SELECT @sku, @qty) AS source (Sku, Quantity)
      ON target.Sku = source.Sku
      WHEN MATCHED THEN UPDATE SET Quantity = source.Quantity
      WHEN NOT MATCHED THEN INSERT (Sku, Quantity) VALUES (source.Sku, source.Quantity);",
    parameters);

// 3. Version/sequence checking
public async Task ApplyEvent(DomainEvent evt)
{
    var current = await _db.Aggregates.FindAsync(evt.AggregateId);
    if (current.Version >= evt.Version) return; // already applied
    // Apply event...
}</code></pre>`,
            interviewTip: 'Give concrete examples of each technique. The idempotency key pattern is the most universally applicable.',
            followUp: ['How do you generate idempotency keys?', 'What about idempotency for email sending?'],
            seniorPerspective: 'Idempotency is a cross-cutting concern. Consider an IIdempotencyGuard abstraction that wraps job execution and checks/records completion atomically.',
            architectPerspective: 'In distributed systems, at-least-once delivery is far easier to achieve than exactly-once. Design all handlers to be idempotent and you get reliable processing without the complexity of exactly-once guarantees.'
        },
        {
            question: 'How does Channel<T> work for producer/consumer patterns? When would you use it over a message broker?',
            difficulty: 'hard',
            answer: `<p><strong>Channel&lt;T&gt;</strong> is a high-performance in-process async queue built into .NET. It provides bounded/unbounded buffers with backpressure support.</p>
<p><strong>Key features:</strong></p>
<ul>
<li><strong>Bounded channels</strong> - Fixed capacity with configurable full behavior (wait, drop newest, drop oldest)</li>
<li><strong>Backpressure</strong> - WriteAsync awaits when channel is full, preventing memory exhaustion</li>
<li><strong>Multiple consumers</strong> - ReadAllAsync works safely with concurrent readers</li>
<li><strong>Graceful completion</strong> - Writer.Complete() signals no more items; readers drain remaining</li>
</ul>
<p><strong>Use Channel&lt;T&gt; when:</strong> In-process communication, same-process producer/consumer, buffering between pipeline stages, fan-out processing.</p>
<p><strong>Use a message broker when:</strong> Cross-process/cross-service communication, persistence needed (survive restarts), distributed consumers, retry/DLQ infrastructure required.</p>
<p><strong>Key limitation:</strong> Channel&lt;T&gt; is in-memory only. If the process crashes, queued items are lost. Use it for work that can be re-derived or where loss is acceptable.</p>`,
            interviewTip: 'Emphasize the backpressure mechanism - this is what makes Channel safer than a simple ConcurrentQueue. Also mention it is allocation-free for the hot path.',
            followUp: ['What is the difference between bounded and unbounded channels?', 'How does Channel compare to BlockingCollection?'],
            seniorPerspective: 'Channel<T> replaced BlockingCollection as the go-to in-process queue. It is async-native, supports ValueTask, and has better performance characteristics for high-throughput scenarios.',
            architectPerspective: 'Channel<T> is perfect for decoupling within a service (e.g., HTTP handler enqueues work, background consumer processes it). For cross-service communication, it should be backed by a persistent queue.'
        },
        {
            question: 'How do you implement graceful shutdown for a background worker processing a batch?',
            difficulty: 'medium',
            answer: `<p>Graceful shutdown means finishing current work (or reaching a safe checkpoint) before stopping, rather than abruptly terminating mid-operation.</p>
<p><strong>Pattern:</strong></p>
<pre><code>protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        var batch = await _queue.DequeueAsync(batchSize: 100, stoppingToken);
        
        foreach (var item in batch)
        {
            // Check between items - cooperative cancellation
            if (stoppingToken.IsCancellationRequested)
            {
                // Option 1: Return unprocessed items to queue
                await _queue.RequeueAsync(batch.Skip(currentIndex));
                break;
            }
            await ProcessAsync(item);
        }
        
        // Checkpoint: commit processed offset
        await _checkpoint.SaveAsync(lastProcessedId);
    }
}

// Configure host shutdown timeout (default is 30s in .NET 8+)
builder.Host.ConfigureHostOptions(o => o.ShutdownTimeout = TimeSpan.FromSeconds(60));</code></pre>
<p><strong>Key principles:</strong></p>
<ul>
<li>Check CancellationToken between units of work (not in the middle of one)</li>
<li>Set appropriate shutdown timeout (long enough to finish current batch)</li>
<li>Requeue or checkpoint to avoid data loss</li>
<li>Log shutdown progress for observability</li>
</ul>`,
            interviewTip: 'Mention the shutdown timeout configuration. Many developers forget that the host has a default timeout and their graceful shutdown gets cut off.',
            followUp: ['What happens if graceful shutdown exceeds the timeout?', 'How do you handle shutdown in Kubernetes with preStop hooks?'],
            seniorPerspective: 'Graceful shutdown is critical for zero-downtime deployments. Kubernetes sends SIGTERM, then waits terminationGracePeriodSeconds before SIGKILL. Your shutdown must complete within that window.',
            architectPerspective: 'Design workers around the concept of checkpoints. Each unit of work either completes fully or can be safely retried. This makes shutdown, crashes, and scaling (adding/removing workers) all safe.'
        },
        {
            question: 'How would you implement retry logic with exponential backoff for a background job?',
            difficulty: 'medium',
            answer: `<p>Retry with exponential backoff prevents overwhelming a failing dependency while still recovering from transient failures.</p>
<pre><code>// Using Polly for retry policy
public class ResilientWorker : BackgroundService
{
    private readonly AsyncRetryPolicy _retryPolicy;
    
    public ResilientWorker()
    {
        _retryPolicy = Policy
            .Handle&lt;HttpRequestException&gt;()
            .Or&lt;TimeoutException&gt;()
            .WaitAndRetryAsync(
                retryCount: 5,
                sleepDurationProvider: attempt =>
                    TimeSpan.FromSeconds(Math.Pow(2, attempt)) // 2, 4, 8, 16, 32s
                    + TimeSpan.FromMilliseconds(Random.Shared.Next(0, 1000)), // jitter
                onRetry: (exception, delay, attempt, ctx) =>
                {
                    _logger.LogWarning(exception,
                        "Retry {Attempt} after {Delay}s", attempt, delay.TotalSeconds);
                });
    }
    
    private async Task ProcessWithRetry(WorkItem item, CancellationToken ct)
    {
        await _retryPolicy.ExecuteAsync(async (ctx) =>
        {
            await _externalService.SubmitAsync(item, ct);
        }, ct);
    }
}

// Hangfire built-in retry
[AutomaticRetry(Attempts = 5, DelaysInSeconds = new[] { 60, 300, 900, 3600, 7200 })]
public async Task ProcessOrder(int orderId) { /* ... */ }</code></pre>
<p><strong>Jitter</strong> is critical - without it, all retrying clients hit the dependency simultaneously (thundering herd).</p>`,
            interviewTip: 'Always mention jitter. It shows you understand distributed systems failure patterns. Also mention circuit breaker for when retries are not enough.',
            followUp: ['What is the thundering herd problem?', 'When should you use a circuit breaker instead of retries?'],
            seniorPerspective: 'Combine retry with circuit breaker (Polly PolicyWrap). Retries handle transient blips. Circuit breaker protects against sustained failures. Together they handle the full spectrum.',
            architectPerspective: 'Retry policies should be configured per-dependency, not globally. A database timeout needs different retry behavior than an HTTP 429 from a rate-limited API.'
        },
        {
            question: 'How do you monitor and observe background workers in production?',
            difficulty: 'advanced',
            answer: `<p>Background workers lack HTTP request context, making observability harder. You need explicit instrumentation.</p>
<p><strong>Monitoring layers:</strong></p>
<ul>
<li><strong>Health checks</strong> - IHealthCheck reporting worker liveness (last heartbeat, error rate, queue depth)</li>
<li><strong>Metrics</strong> - Prometheus/OpenTelemetry counters for items processed, duration histograms, error rates</li>
<li><strong>Structured logging</strong> - Correlation IDs, job metadata, processing duration</li>
<li><strong>Distributed tracing</strong> - ActivitySource/OpenTelemetry spans for each job execution</li>
<li><strong>Alerting</strong> - Queue depth growing, processing latency increasing, error rate spike</li>
</ul>
<pre><code>// OpenTelemetry instrumentation
private static readonly ActivitySource Source = new("BackgroundWorker");
private static readonly Counter&lt;long&gt; ItemsProcessed = 
    Meter.CreateCounter&lt;long&gt;("worker.items.processed");
private static readonly Histogram&lt;double&gt; ProcessingDuration =
    Meter.CreateHistogram&lt;double&gt;("worker.processing.duration.ms");

private async Task ProcessItem(WorkItem item)
{
    using var activity = Source.StartActivity("ProcessItem");
    activity?.SetTag("item.type", item.Type);
    var sw = Stopwatch.StartNew();
    
    try
    {
        await DoWork(item);
        ItemsProcessed.Add(1, new("status", "success"));
    }
    catch (Exception ex)
    {
        ItemsProcessed.Add(1, new("status", "error"));
        activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
        throw;
    }
    finally
    {
        ProcessingDuration.Record(sw.ElapsedMilliseconds);
    }
}</code></pre>`,
            interviewTip: 'Show you think about production operations, not just code. Mention the key metrics: throughput, latency, error rate, queue depth.',
            followUp: ['How do you correlate logs across producer and consumer?', 'What alerts would you set up for a critical background worker?'],
            seniorPerspective: 'The four golden signals (latency, traffic, errors, saturation) apply to workers too. Queue depth is your saturation signal. Processing latency and error rate are your SLI foundations.',
            architectPerspective: 'Background workers should participate in the same observability stack as your APIs. Use OpenTelemetry to create spans for each job, linking them to the originating request via trace context propagation.'
        },
        {
            question: 'Design a reliable job processing system that survives process crashes and handles poison messages.',
            difficulty: 'expert',
            answer: `<p><strong>Architecture for crash-safe job processing:</strong></p>
<ol>
<li><strong>Persistent queue</strong> - Jobs stored in SQL/Redis before processing begins</li>
<li><strong>Lease-based processing</strong> - Worker acquires a lease (timed lock) on a job; lease expires if worker dies</li>
<li><strong>Atomic state transitions</strong> - Job status changes within transactions</li>
<li><strong>Poison message detection</strong> - Track attempt count; move to DLQ after threshold</li>
</ol>
<pre><code>public class ReliableJobProcessor
{
    public async Task ProcessNext(CancellationToken ct)
    {
        // 1. Acquire job with lease (atomic: status -> Processing, set LeaseExpiry)
        var job = await _db.ExecuteAsync(@"
            UPDATE TOP(1) Jobs SET 
                Status = 'Processing',
                LeaseExpiry = DATEADD(MINUTE, 5, GETUTCDATE()),
                AttemptCount = AttemptCount + 1,
                WorkerId = @workerId
            OUTPUT INSERTED.*
            WHERE Status = 'Pending' 
              AND (LeaseExpiry IS NULL OR LeaseExpiry < GETUTCDATE())
              AND AttemptCount < @maxAttempts", new { workerId, maxAttempts = 5 });
        
        if (job == null) return; // no work
        
        try
        {
            await ExecuteJob(job, ct);
            await MarkCompleted(job.Id);
        }
        catch (Exception ex)
        {
            if (job.AttemptCount >= 5)
                await MoveToDLQ(job, ex); // poison message
            else
                await MarkFailed(job.Id, ex); // will be retried (lease expires)
        }
    }
}

// Lease renewal for long-running jobs
private async Task RenewLease(Guid jobId, CancellationToken ct)
{
    using var timer = new PeriodicTimer(TimeSpan.FromMinutes(2));
    while (await timer.WaitForNextTickAsync(ct))
    {
        await _db.ExecuteAsync(
            "UPDATE Jobs SET LeaseExpiry = DATEADD(MINUTE, 5, GETUTCDATE()) WHERE Id = @id",
            new { id = jobId });
    }
}</code></pre>
<p><strong>Poison message handling:</strong> After N failures, move to a dead-letter table with the error details. Provide tooling for operators to inspect, fix, and replay failed jobs.</p>`,
            interviewTip: 'This is a system design question. Cover the failure modes: crash during processing (lease expiry handles it), repeated failure (DLQ), slow processing (lease renewal).',
            followUp: ['How do you prevent duplicate processing with lease-based systems?', 'How would you add priority queues to this design?'],
            seniorPerspective: 'This pattern is essentially what Hangfire implements internally. Understanding it helps you debug Hangfire issues and know when to build custom infrastructure.',
            architectPerspective: 'For most teams, use Hangfire or a message broker rather than building this from scratch. Build custom only when you have specific requirements (multi-tenant isolation, custom routing, regulatory constraints) that off-the-shelf solutions cannot meet.'
        }
    ]
});
