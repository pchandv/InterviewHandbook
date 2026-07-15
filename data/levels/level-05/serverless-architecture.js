/* ═══════════════════════════════════════════════════════════════════
   SERVERLESS ARCHITECTURE — Level 5: Architecture
   FaaS, BaaS, event-driven serverless, cold starts, and when
   serverless is the right architectural choice.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('serverless-architecture', {

    title: 'Serverless Architecture',
    level: 5,
    group: 'architecture-styles',
    description: 'Deep dive into serverless: FaaS vs BaaS, event-driven functions, cold starts, statelessness, cost models, orchestration, and when serverless fits (and when it does not).',
    difficulty: 'advanced',
    estimatedMinutes: 50,
    prerequisites: ['arch-styles', 'microservices'],

    sections: [

        // ─── 1. INTRODUCTION ──────────────────────────────────────────
        {
            title: 'Introduction',
            content: `<p><strong>Serverless Architecture</strong> is a model where the cloud provider dynamically manages
            the allocation and provisioning of servers. You write code as functions; the provider runs them
            on demand, scales automatically, and bills only for actual execution time.</p>
            <p>"Serverless" doesn't mean there are no servers — it means YOU don't manage them. There are no
            servers to provision, patch, or scale. You focus on code; the infrastructure is abstracted away.</p>
            <p>In this module, you will learn:</p>
            <ul>
                <li>FaaS (Functions as a Service) vs BaaS (Backend as a Service)</li>
                <li>Event-driven function triggers (HTTP, queue, timer, storage)</li>
                <li>The cold start problem and mitigation strategies</li>
                <li>Statelessness and external state management</li>
                <li>Consumption-based cost models</li>
                <li>Function orchestration (Durable Functions, Step Functions)</li>
                <li>When serverless is the right choice — and its limits</li>
            </ul>`
        },

        // ─── 2. CORE CONCEPTS ─────────────────────────────────────────
        {
            title: 'Core Concepts',
            content: `<p>Foundational concepts of serverless computing:</p>
            <h4>FaaS (Functions as a Service)</h4>
            <p>Run individual functions in response to events. The unit of deployment is a single function.
            Examples: AWS Lambda, Azure Functions, Google Cloud Functions. You write the handler;
            the platform manages everything else.</p>
            <h4>BaaS (Backend as a Service)</h4>
            <p>Use fully-managed backend services instead of building them. Examples: Firebase (auth, DB),
            Auth0 (identity), managed databases (DynamoDB, Cosmos DB), object storage (S3). You consume
            APIs rather than running servers.</p>
            <h4>Event-Driven Triggers</h4>
            <p>Functions are invoked by events: HTTP requests, queue messages, file uploads, database
            changes, scheduled timers, or events from other services. The function runs, processes the
            event, and terminates.</p>
            <h4>Statelessness</h4>
            <p>Functions are stateless — they don't retain data between invocations. Any state must
            live in external stores (databases, caches, queues). This enables horizontal scaling:
            the platform spins up new instances freely.</p>
            <h4>Auto-Scaling & Scale-to-Zero</h4>
            <p>The platform scales function instances from zero to thousands based on load. When there's
            no traffic, it scales to zero — you pay nothing. This is the key economic difference from
            always-on servers.</p>
            <h4>Consumption Billing</h4>
            <p>You pay per invocation and per GB-second of execution (memory × time). No charge when
            idle. This favors spiky, unpredictable, or low-volume workloads.</p>`,
            mermaid: `graph TB
    subgraph Triggers["Event Triggers"]
        HTTP["HTTP Request"]
        Queue["Queue Message"]
        Timer["Scheduled Timer"]
        Blob["File Upload"]
        DB["DB Change"]
    end
    subgraph Platform["Serverless Platform"]
        F1["Function Instance 1"]
        F2["Function Instance 2"]
        Fn["Function Instance N<br/>(auto-scaled)"]
    end
    subgraph State["External State"]
        Database[("Database")]
        Cache[("Cache")]
        Storage[("Object Storage")]
    end
    HTTP & Queue & Timer & Blob & DB --> Platform
    F1 & F2 & Fn --> Database & Cache & Storage`
        },

        // ─── 3. HOW IT WORKS ──────────────────────────────────────────
        {
            title: 'How It Works',
            content: `<p>The lifecycle of a serverless function invocation:</p>
            <ol>
                <li><strong>Event Occurs:</strong> A trigger fires — HTTP request, queue message, timer, etc.</li>
                <li><strong>Instance Provisioning:</strong> The platform checks for a warm (already-running)
                instance. If none exists, it provisions a new one (this is the "cold start")</li>
                <li><strong>Runtime Initialization:</strong> For a cold start, the platform downloads your code,
                starts the runtime (e.g., .NET, Node.js), and runs initialization code</li>
                <li><strong>Function Execution:</strong> Your handler runs with the event payload as input</li>
                <li><strong>Response & Teardown:</strong> The function returns a result. The platform may keep
                the instance "warm" for a few minutes to serve subsequent requests, then tears it down</li>
            </ol>
            <p>The critical insight: minimize cold start impact by keeping functions small, dependencies
            light, and initialization fast. Move heavy setup outside the handler so it's reused across
            invocations on a warm instance.</p>`,
            code: `// Azure Function — HTTP-triggered (isolated worker model, .NET 8)
public class OrderFunction
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrderFunction> _logger;

    // Constructor runs ONCE per instance (reused across invocations on warm instance)
    // Heavy initialization here is amortized — DI container, connections, etc.
    public OrderFunction(IOrderService orderService, ILogger<OrderFunction> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }

    [Function("CreateOrder")]
    public async Task<HttpResponseData> CreateOrder(
        [HttpTrigger(AuthorizationLevel.Function, "post", Route = "orders")]
        HttpRequestData req,
        CancellationToken ct)
    {
        var request = await req.ReadFromJsonAsync<CreateOrderRequest>(ct);
        var orderId = await _orderService.CreateAsync(request, ct);

        var response = req.CreateResponse(HttpStatusCode.Created);
        await response.WriteAsJsonAsync(new { orderId }, ct);
        return response;
    }

    // Queue-triggered function — processes messages asynchronously
    [Function("ProcessOrderQueue")]
    public async Task ProcessOrder(
        [QueueTrigger("orders-to-process")] OrderMessage message,
        CancellationToken ct)
    {
        _logger.LogInformation("Processing order {OrderId}", message.OrderId);
        await _orderService.FulfillAsync(message.OrderId, ct);
    }

    // Timer-triggered function — scheduled cleanup (every day at 2am)
    [Function("DailyCleanup")]
    public async Task Cleanup(
        [TimerTrigger("0 0 2 * * *")] TimerInfo timer,
        CancellationToken ct)
    {
        await _orderService.ArchiveOldOrdersAsync(ct);
    }
}`,
            language: 'csharp'
        },

        // ─── 4. VISUAL DIAGRAM ────────────────────────────────────────
        {
            title: 'Serverless Application Architecture',
            content: `<p>A complete serverless application combines FaaS, BaaS, and managed event services.
            The diagram shows a typical serverless web application:</p>`,
            mermaid: `flowchart TB
    subgraph Client["Client"]
        SPA["SPA / Mobile"]
    end
    subgraph Edge["Edge / API"]
        CDN["CDN<br/>(static assets)"]
        APIGW["API Gateway"]
    end
    subgraph Functions["Functions (FaaS)"]
        Auth["Auth Function"]
        OrderFn["Order Function"]
        ProcessFn["Process Function"]
        NotifyFn["Notify Function"]
    end
    subgraph Managed["Managed Services (BaaS)"]
        Identity["Identity Provider"]
        NoSQL[("NoSQL DB")]
        Q["Message Queue"]
        ObjStore["Object Storage"]
    end

    SPA --> CDN
    SPA --> APIGW
    APIGW --> Auth --> Identity
    APIGW --> OrderFn
    OrderFn --> NoSQL
    OrderFn -->|enqueue| Q
    Q -->|trigger| ProcessFn
    ProcessFn --> NoSQL
    ProcessFn -->|enqueue| Q
    Q -->|trigger| NotifyFn
    OrderFn --> ObjStore

    style Functions fill:#dbeafe,color:#1e293b
    style Managed fill:#d1fae5,color:#1e293b`
        },

        // ─── 5. IMPLEMENTATION ────────────────────────────────────────
        {
            title: 'Implementation',
            content: `<p>Implementation patterns for serverless functions and orchestration:</p>`,
            tabs: [
                {
                    label: 'AWS Lambda (Node.js)',
                    code: `// AWS Lambda handler — Node.js with API Gateway proxy integration
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize OUTSIDE the handler — reused across warm invocations
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);

        // Validate
        if (!body.customerId || !body.items?.length) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'customerId and items are required' })
            };
        }

        const order = {
            orderId: crypto.randomUUID(),
            customerId: body.customerId,
            items: body.items,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
            TableName: process.env.ORDERS_TABLE,
            Item: order
        }));

        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        };
    } catch (error) {
        console.error('Error creating order:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
    }
};`,
                    language: 'javascript'
                },
                {
                    label: 'Durable Functions (C#)',
                    code: `// Azure Durable Functions — orchestrating a multi-step workflow
// Solves serverless statelessness for long-running, stateful processes

public class OrderOrchestration
{
    // Orchestrator — coordinates the workflow (durable, survives restarts)
    [Function(nameof(OrderOrchestrator))]
    public async Task<OrderResult> OrderOrchestrator(
        [OrchestrationTrigger] TaskOrchestrationContext context)
    {
        var order = context.GetInput<OrderRequest>();

        // Step 1: Reserve inventory (with automatic retry)
        var retryOptions = new TaskOptions(new RetryPolicy(
            maxNumberOfAttempts: 3,
            firstRetryInterval: TimeSpan.FromSeconds(5)));

        var reserved = await context.CallActivityAsync<bool>(
            nameof(ReserveInventory), order, retryOptions);
        if (!reserved)
            return new OrderResult(false, "Inventory unavailable");

        // Step 2: Process payment
        var paymentResult = await context.CallActivityAsync<PaymentResult>(
            nameof(ProcessPayment), order, retryOptions);

        if (!paymentResult.Success)
        {
            // Compensate — release the reserved inventory
            await context.CallActivityAsync(nameof(ReleaseInventory), order);
            return new OrderResult(false, "Payment failed");
        }

        // Step 3: Fulfill and notify (run in parallel)
        var fulfillTask = context.CallActivityAsync(nameof(FulfillOrder), order);
        var notifyTask = context.CallActivityAsync(nameof(NotifyCustomer), order);
        await Task.WhenAll(fulfillTask, notifyTask);

        return new OrderResult(true, "Order completed");
    }

    // Activity functions — the actual work units (stateless)
    [Function(nameof(ReserveInventory))]
    public async Task<bool> ReserveInventory([ActivityTrigger] OrderRequest order)
        => await _inventory.ReserveAsync(order.Items);

    [Function(nameof(ProcessPayment))]
    public async Task<PaymentResult> ProcessPayment([ActivityTrigger] OrderRequest order)
        => await _payments.ChargeAsync(order.CustomerId, order.Total);

    // Client function — starts the orchestration
    [Function("StartOrder")]
    public async Task<HttpResponseData> StartOrder(
        [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequestData req,
        [DurableClient] DurableTaskClient client)
    {
        var order = await req.ReadFromJsonAsync<OrderRequest>();
        var instanceId = await client.ScheduleNewOrchestrationInstanceAsync(
            nameof(OrderOrchestrator), order);
        return client.CreateCheckStatusResponse(req, instanceId);
    }
}`,
                    language: 'csharp'
                },
                {
                    label: 'Infrastructure (Terraform)',
                    code: `# Terraform — AWS Lambda + API Gateway + DynamoDB
resource "aws_lambda_function" "create_order" {
  function_name = "create-order"
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  filename      = "function.zip"
  memory_size   = 256          # More memory = more CPU = faster cold start
  timeout       = 30

  environment {
    variables = {
      ORDERS_TABLE = aws_dynamodb_table.orders.name
    }
  }

  # Provisioned concurrency — keeps N instances warm (mitigates cold start)
  # Costs more but eliminates cold start latency for critical paths
}

resource "aws_lambda_provisioned_concurrency_config" "create_order" {
  function_name                     = aws_lambda_function.create_order.function_name
  provisioned_concurrent_executions = 5  # 5 always-warm instances
  qualifier                         = aws_lambda_function.create_order.version
}

resource "aws_dynamodb_table" "orders" {
  name         = "orders"
  billing_mode = "PAY_PER_REQUEST"   # Serverless DB — scales automatically
  hash_key     = "orderId"

  attribute {
    name = "orderId"
    type = "S"
  }
}

# API Gateway HTTP API (cheaper than REST API)
resource "aws_apigatewayv2_api" "orders_api" {
  name          = "orders-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "create_order" {
  api_id           = aws_apigatewayv2_api.orders_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.create_order.invoke_arn
}`,
                    language: 'hcl'
                }
            ]
        },

        // ─── 6. BEST PRACTICES ────────────────────────────────────────
        {
            title: 'Best Practices',
            content: `<h4>Do: Keep Functions Small and Single-Purpose</h4>
            <p>Each function should do one thing. Small functions cold-start faster, are easier to test,
            and scale independently. Follow the single-responsibility principle at the function level.</p>
            <h4>Do: Initialize Outside the Handler</h4>
            <p>Database clients, HTTP clients, and configuration should be initialized once (in the
            constructor or module scope), not inside the handler. This reuses connections across
            warm invocations and reduces per-request overhead.</p>
            <h4>Do: Externalize All State</h4>
            <p>Never rely on in-memory state persisting between invocations. Use databases, caches,
            or queues for any state. Treat every invocation as potentially running on a fresh instance.</p>
            <h4>Do: Design for Idempotency</h4>
            <p>Event sources often deliver at-least-once. A queue message may trigger your function
            twice. Make handlers idempotent so duplicate processing is safe.</p>
            <h4>Do: Mitigate Cold Starts for Critical Paths</h4>
            <p>Use provisioned concurrency (AWS) or premium/always-ready instances (Azure) for
            latency-sensitive functions. Keep deployment packages small and dependencies minimal.</p>
            <h4>Do: Set Appropriate Timeouts and Memory</h4>
            <p>More memory often means more CPU (and faster execution). Tune memory to balance cost
            and performance. Set timeouts to fail fast rather than running up costs on stuck functions.</p>`,
            callout: {
                type: 'tip',
                title: 'Cold Start Mitigation',
                text: 'Cold starts hurt most with large dependencies and heavy runtimes. Strategies: keep packages small, use lighter runtimes, initialize lazily, enable provisioned/pre-warmed concurrency for critical functions, and consider compiled languages (Go, Rust) or AOT compilation (.NET Native AOT) for the fastest starts.'
            }
        },

        // ─── 7. COMMON MISTAKES ───────────────────────────────────────
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Relying on In-Memory State</h4>
            <p>Storing session data, counters, or caches in function memory. The next invocation may
            run on a different instance with empty memory. All state must be external.</p>
            <h4>Mistake: The Distributed Monolith of Functions</h4>
            <p>Splitting one cohesive operation into dozens of tiny functions that call each other
            synchronously. This creates latency chains, debugging nightmares, and tight coupling —
            the same problems as a distributed monolith.</p>
            <h4>Mistake: Ignoring Cold Starts in Latency-Sensitive Apps</h4>
            <p>Using serverless for a user-facing API with strict latency SLAs without addressing
            cold starts. A 2-3 second cold start on a login endpoint is a poor user experience.</p>
            <h4>Mistake: Long-Running Functions</h4>
            <p>Functions have execution time limits (e.g., 15 min on Lambda, varies by plan on Azure).
            Long-running processes (large file processing, big batch jobs) hit these limits.
            Use orchestration (Durable Functions, Step Functions) or a different compute model.</p>
            <h4>Mistake: Underestimating Cost at Scale</h4>
            <p>Serverless is cheap for spiky/low traffic but can become expensive at sustained high
            volume. A function running constantly at high throughput may cost more than a reserved VM.
            Model your costs based on expected traffic patterns.</p>
            <h4>Mistake: Database Connection Exhaustion</h4>
            <p>Each function instance opens DB connections. Under high scale, thousands of instances
            can exhaust the database connection pool. Use connection proxies (RDS Proxy) or
            serverless-friendly databases (DynamoDB, Cosmos DB).</p>`,
            code: `// BAD: In-memory state that won't persist
let requestCount = 0; // ❌ Resets on every cold start, differs per instance

exports.handler = async (event) => {
    requestCount++; // Meaningless — not shared across instances
    return { count: requestCount };
};

// BAD: Heavy initialization inside the handler
exports.handler = async (event) => {
    const db = new DatabaseClient(); // ❌ New connection every invocation
    await db.connect();
    // ...
};

// GOOD: External state + initialization outside handler
const db = new DatabaseClient(); // ✅ Reused across warm invocations
const redis = new RedisClient();

exports.handler = async (event) => {
    // Counter lives in external store
    const count = await redis.incr('request:count'); // ✅ Shared, persistent
    return { count };
};`,
            language: 'javascript'
        },

        // ─── 8. REAL-WORLD APPLICATIONS ───────────────────────────────
        {
            title: 'Real-World Applications',
            content: `<p>Where serverless excels in production:</p>
            <h4>Event Processing Pipelines</h4>
            <p>File uploads triggering image resizing, video transcoding, or document processing.
            Upload to storage → trigger function → process → store result. Netflix, Coca-Cola,
            and many media companies use serverless for media pipelines.</p>
            <h4>APIs with Variable Traffic</h4>
            <p>Startups and applications with unpredictable or spiky traffic. Pay nothing during quiet
            periods, scale automatically during spikes. Ideal for MVPs and seasonal businesses.</p>
            <h4>Scheduled Tasks & Automation</h4>
            <p>Cron-like jobs: nightly reports, data cleanup, sending reminder emails, health checks.
            Timer-triggered functions replace dedicated cron servers.</p>
            <h4>Webhooks & Integrations</h4>
            <p>Receiving webhooks from third-party services (Stripe payments, GitHub events, Slack
            commands). A function handles each webhook without a always-on server.</p>
            <h4>IoT Backends</h4>
            <p>Processing device telemetry. Millions of devices send events; functions process them
            on demand, scaling with the device fleet.</p>
            <h4>Real-Time Stream Processing</h4>
            <p>Functions triggered by streaming data (Kinesis, Event Hubs) for real-time analytics,
            fraud detection, and alerting.</p>`
        },

        // ─── 9. COMPARISON ────────────────────────────────────────────
        {
            title: 'Comparison',
            content: `<p>Comparing serverless with containers and traditional VMs:</p>`,
            table: {
                headers: ['Aspect', 'Serverless (FaaS)', 'Containers (K8s)', 'Virtual Machines'],
                rows: [
                    ['Server Management', 'None (fully managed)', 'Orchestration required', 'Full management'],
                    ['Scaling', 'Automatic, instant, to zero', 'Configured (HPA)', 'Manual or scripted'],
                    ['Billing', 'Per execution (GB-sec)', 'Per running container', 'Per VM hour (always on)'],
                    ['Cold Start', 'Yes (ms to seconds)', 'Minimal (warm pods)', 'None (always running)'],
                    ['Execution Limit', 'Yes (5-15 min typical)', 'Unlimited', 'Unlimited'],
                    ['State', 'Stateless only', 'Stateful possible', 'Fully stateful'],
                    ['Control', 'Low (platform-managed)', 'High', 'Full'],
                    ['Best For', 'Spiky, event-driven, low-volume', 'Steady microservices', 'Legacy, full control needs'],
                    ['Cost at High Sustained Load', 'Can be expensive', 'Efficient', 'Efficient (reserved)'],
                    ['Cost at Low/Spiky Load', 'Very cheap (scale to zero)', 'Pay for idle pods', 'Pay for idle VMs'],
                    ['Vendor Lock-In', 'High', 'Low (portable)', 'Low']
                ]
            }
        },

        // ─── 10. PERFORMANCE ──────────────────────────────────────────
        {
            title: 'Performance',
            content: `<p>Performance characteristics and the cold start challenge:</p>
            <h4>Cold Start Anatomy</h4>
            <p>A cold start has several phases:</p>
            <ul>
                <li><strong>Code download:</strong> Fetch the deployment package (larger = slower)</li>
                <li><strong>Runtime init:</strong> Start the language runtime (Node fast, JVM/.NET slower)</li>
                <li><strong>App init:</strong> Your initialization code (DI setup, connections)</li>
            </ul>
            <p>Typical cold start times: Node.js/Python ~100-400ms, .NET/Java ~500ms-2s,
            with large dependencies pushing higher. Warm invocations: single-digit milliseconds.</p>
            <h4>Mitigation Strategies</h4>
            <ul>
                <li><strong>Provisioned concurrency:</strong> Pre-warm N instances (AWS Lambda, Azure Premium)</li>
                <li><strong>Smaller packages:</strong> Tree-shake, bundle, remove unused dependencies</li>
                <li><strong>AOT compilation:</strong> .NET Native AOT, GraalVM for near-instant starts</li>
                <li><strong>Lighter runtimes:</strong> Go and Rust have minimal cold starts</li>
                <li><strong>Keep-warm pings:</strong> Periodic timer to keep instances alive (hacky but works)</li>
            </ul>
            <h4>Memory and CPU</h4>
            <p>On most platforms, CPU scales with allocated memory. A function may run FASTER (and
            sometimes cheaper) with more memory because it completes quicker. Always benchmark
            different memory settings to find the cost/performance sweet spot.</p>`,
            callout: {
                type: 'warning',
                title: 'The Cold Start Tax',
                text: 'Cold starts are the #1 serverless gotcha for user-facing APIs. For a checkout or login endpoint where latency matters, use provisioned concurrency or reconsider serverless. For background processing where a few seconds of startup is acceptable, cold starts are a non-issue.'
            }
        },

        // ─── 11. TESTING ──────────────────────────────────────────────
        {
            title: 'Testing',
            content: `<p>Testing serverless functions requires separating business logic from the function host:</p>
            <h4>Unit Testing (Logic Separation)</h4>
            <p>Keep business logic in plain, testable classes injected into the function. Test the logic
            directly without the function runtime. The function handler should be a thin adapter.</p>
            <h4>Integration Testing with Emulators</h4>
            <p>Use local emulators: AWS SAM Local, LocalStack, Azure Functions Core Tools, Azurite
            (storage emulator). Run functions locally against emulated cloud services.</p>
            <h4>End-to-End Testing</h4>
            <p>Deploy to a test environment and invoke through real triggers. Verify the full path:
            trigger → function → downstream services. Keep these minimal — they're slow and costly.</p>`,
            code: `// Separate logic from the function host for testability

// Business logic — plain class, fully testable
public class OrderProcessor
{
    private readonly IOrderRepository _orders;
    public OrderProcessor(IOrderRepository orders) => _orders = orders;

    public async Task<OrderResult> ProcessAsync(OrderRequest request, CancellationToken ct)
    {
        if (request.Items.Count == 0)
            return OrderResult.Invalid("Order must contain items");

        var order = Order.Create(request.CustomerId, request.Items);
        await _orders.AddAsync(order, ct);
        return OrderResult.Success(order.Id);
    }
}

// Function — thin adapter that delegates to the logic
public class OrderFunction
{
    private readonly OrderProcessor _processor;
    public OrderFunction(OrderProcessor processor) => _processor = processor;

    [Function("CreateOrder")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger("post")] HttpRequestData req, CancellationToken ct)
    {
        var request = await req.ReadFromJsonAsync<OrderRequest>(ct);
        var result = await _processor.ProcessAsync(request, ct);
        var response = req.CreateResponse(
            result.IsSuccess ? HttpStatusCode.Created : HttpStatusCode.BadRequest);
        await response.WriteAsJsonAsync(result, ct);
        return response;
    }
}

// Test — targets the logic, NOT the function host
public class OrderProcessorTests
{
    [Fact]
    public async Task ProcessAsync_EmptyItems_ReturnsInvalid()
    {
        var processor = new OrderProcessor(Substitute.For<IOrderRepository>());
        var request = new OrderRequest("cust-1", new List<OrderItemDto>());

        var result = await processor.ProcessAsync(request, CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal("Order must contain items", result.Error);
    }

    [Fact]
    public async Task ProcessAsync_ValidOrder_PersistsAndReturnsSuccess()
    {
        var orders = Substitute.For<IOrderRepository>();
        var processor = new OrderProcessor(orders);
        var request = new OrderRequest("cust-1", new List<OrderItemDto>
        {
            new("prod-1", 2, 50m)
        });

        var result = await processor.ProcessAsync(request, CancellationToken.None);

        Assert.True(result.IsSuccess);
        await orders.Received(1).AddAsync(Arg.Any<Order>(), Arg.Any<CancellationToken>());
    }
}`,
            language: 'csharp'
        },

        // ─── 12. INTERVIEW TIPS ───────────────────────────────────────
        {
            title: 'Interview Tips',
            content: `<p>Serverless questions test cloud and architecture judgment:</p>
            <ul>
                <li><strong>Define it correctly:</strong> "Serverless" = no server management, auto-scaling,
                pay-per-use. Not "no servers"</li>
                <li><strong>Address cold starts proactively:</strong> Interviewers want to know you understand
                this trade-off and how to mitigate it</li>
                <li><strong>Discuss statelessness:</strong> Explain how state is externalized and why this
                enables scaling</li>
                <li><strong>Know the cost model:</strong> Serverless is cheap for spiky/low traffic, potentially
                expensive at sustained high volume. Show you can reason about this</li>
                <li><strong>Recognize the limits:</strong> Execution time limits, vendor lock-in, cold starts,
                and connection management are real constraints</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Architect-Level Signal',
                text: 'At the architect level, discuss the FaaS vs containers decision in business terms: serverless trades control and potential cost-at-scale for zero operational overhead and instant scaling. The right choice depends on traffic patterns, team size, latency requirements, and acceptable vendor lock-in.'
            }
        },

        // ─── 13. FURTHER READING ──────────────────────────────────────
        {
            title: 'Further Reading',
            content: `<p>Resources for serverless mastery:</p>
            <h4>Books</h4>
            <ul>
                <li><em>Serverless Architectures on AWS</em> by Peter Sbarski — comprehensive AWS serverless</li>
                <li><em>Programming AWS Lambda</em> by Chapin & Roberts — Lambda in depth</li>
                <li><em>Learning Serverless</em> by Jason Katzer — patterns and practices</li>
            </ul>
            <h4>Articles & Docs</h4>
            <ul>
                <li>Martin Fowler: <code>martinfowler.com/articles/serverless.html</code></li>
                <li>AWS Lambda docs: <code>docs.aws.amazon.com/lambda</code></li>
                <li>Azure Functions docs: <code>learn.microsoft.com/azure/azure-functions</code></li>
                <li>Serverless Framework: <code>serverless.com</code></li>
            </ul>
            <h4>Tools & Frameworks</h4>
            <ul>
                <li><strong>Deployment:</strong> Serverless Framework, AWS SAM, Azure Functions Core Tools</li>
                <li><strong>Local dev:</strong> LocalStack, AWS SAM Local, Azurite</li>
                <li><strong>Orchestration:</strong> AWS Step Functions, Azure Durable Functions</li>
                <li><strong>Observability:</strong> AWS X-Ray, Application Insights, Lumigo, Thundra</li>
            </ul>`
        },

        // ─── 14. KEY TAKEAWAYS ────────────────────────────────────────
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Core idea:</strong> Run code as event-triggered functions without managing servers; the platform scales automatically and bills per execution</li>
                <li><strong>When to use:</strong> Spiky/unpredictable traffic, event processing, scheduled tasks, webhooks, MVPs, low-to-moderate volume workloads</li>
                <li><strong>When NOT to use:</strong> Latency-critical paths (cold starts), long-running jobs (time limits), sustained high-volume (cost), when you need full control or portability</li>
                <li><strong>Key benefit:</strong> Zero server management, automatic scaling to zero, pay-only-for-use economics</li>
                <li><strong>Main risks:</strong> Cold starts, execution time limits, vendor lock-in, connection management at scale, cost at sustained high load</li>
                <li><strong>Critical rule:</strong> Functions must be stateless — externalize all state to databases, caches, or queues</li>
                <li><strong>Interview signal:</strong> Proactively discussing cold starts and the cost-at-scale trade-off shows real serverless experience</li>
            </ul>`
        },

        // ─── 15. EXERCISE ─────────────────────────────────────────────
        {
            title: 'Exercise',
            content: `<h4>Challenge: Design a Serverless Image Processing Pipeline</h4>
            <p>Design a serverless system that processes user-uploaded images:</p>
            <ol>
                <li>User uploads an image to object storage (S3/Blob)</li>
                <li>Upload triggers a function that generates 3 thumbnails (small, medium, large)</li>
                <li>A second function extracts metadata (dimensions, EXIF) and stores it in a NoSQL DB</li>
                <li>A third function runs content moderation; if flagged, it quarantines the image</li>
                <li>On completion, notify the user (via queue → notification function)</li>
                <li>Address: cold starts, idempotency (duplicate upload events), and failure handling</li>
            </ol>
            <h4>Design Questions to Answer</h4>`,
            code: `// Sketch the architecture and answer these design questions:

// 1. TRIGGERS: What triggers each function?
//    - Thumbnail function: ??? (storage event)
//    - Metadata function: ???
//    - Moderation function: ???
//    - Notification function: ???

// 2. PARALLELISM: Should thumbnail, metadata, and moderation run in 
//    parallel or sequentially? Why?

// 3. IDEMPOTENCY: The storage event may fire twice for one upload.
//    How do you prevent generating duplicate thumbnails?
//    Hint: deterministic output keys, check-before-process

// 4. FAILURE: If moderation flags an image AFTER thumbnails are generated,
//    how do you clean up? (compensation)

// 5. COLD START: The thumbnail function uses a heavy image library.
//    How do you minimize cold start impact?

// 6. ORCHESTRATION: Would you use Durable Functions / Step Functions
//    to coordinate these steps? What are the trade-offs vs pure
//    event-chaining?

// TODO: Draw the architecture diagram and write the trigger 
//       configuration for each function`,
            language: 'javascript'
        },

        // ─── 16. KNOWLEDGE CHECK ──────────────────────────────────────
        {
            title: 'Knowledge Check',
            content: `<p>Test your serverless knowledge:</p>
            <ol>
                <li><strong>Q:</strong> What is a cold start and why does it happen?<br/>
                    <em>A: A cold start is the latency incurred when the platform must provision a new function
                    instance (download code, start runtime, run initialization) because no warm instance is
                    available. It happens on the first request, after idle periods, or during scale-out.</em></li>
                <li><strong>Q:</strong> Why must serverless functions be stateless?<br/>
                    <em>A: The platform freely creates and destroys instances to scale. Any request may run on a
                    fresh instance with no memory of previous requests. State must live in external stores so it
                    persists and is shared across all instances.</em></li>
                <li><strong>Q:</strong> When is serverless more expensive than a traditional VM?<br/>
                    <em>A: At sustained high volume. Pay-per-execution is cheap for spiky/low traffic (especially
                    with scale-to-zero), but a function running constantly at high throughput can cost more than
                    a reserved always-on VM or container.</em></li>
                <li><strong>Q:</strong> What is the difference between FaaS and BaaS?<br/>
                    <em>A: FaaS (Functions as a Service) runs your custom code as event-triggered functions
                    (Lambda, Azure Functions). BaaS (Backend as a Service) provides fully-managed backend
                    capabilities you consume via APIs (Firebase, Auth0, managed databases) instead of building them.</em></li>
            </ol>`
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // INTERVIEW QUESTIONS
    // ═══════════════════════════════════════════════════════════════
    questions: [
        {"question":"What is a cold start in serverless, and how do you mitigate it?","difficulty":"medium","answer":"<p>A <strong>cold start</strong> is the latency incurred when a serverless function is invoked after being idle (or scaling out): the platform must provision a runtime, load your code, and initialize dependencies before handling the request. Warm instances skip this, so cold starts show up as slow first/burst requests.</p><p>Mitigations: <strong>provisioned concurrency</strong> / keep-warm to pre-initialize instances; smaller deployment packages and fewer heavy dependencies; faster-starting runtimes; lazy-loading non-critical initialization; and keeping functions warm with scheduled pings. For latency-critical, always-on workloads, serverless may be the wrong fit.</p>","explanation":"A cold start is like a shop that closes when there are no customers: the first customer after a quiet spell must wait for the staff to unlock, turn on lights, and boot the registers before being served.","bestPractices":["Use provisioned concurrency for latency-sensitive functions","Minimize package size and heavy init","Lazy-load non-critical dependencies"],"commonMistakes":["Huge functions with heavy startup dependencies","Using serverless for consistently low-latency, always-on paths","Ignoring cold starts in performance budgets"],"interviewTip":"Define cold start (provision + init on idle/scale) and list concrete mitigations (provisioned concurrency, small packages) — plus when serverless is simply the wrong tool.","followUp":["How does provisioned concurrency work?","Which runtimes have worse cold starts?","When is serverless a poor fit?"]},
        {"question":"When is serverless (FaaS) a good fit, and when should you avoid it?","difficulty":"medium","answer":"<p><strong>Good fit:</strong> event-driven and spiky/unpredictable workloads, glue/integration tasks, scheduled jobs, and anything where you want to pay-per-use and avoid managing servers — it scales to zero and scales out automatically. <strong>Avoid</strong> when: you need consistently low latency (cold starts), long-running or compute-heavy jobs (execution time/resource limits), high sustained throughput (pay-per-invocation gets expensive vs always-on), or you need fine control over the runtime/state.</p><p>Also watch for hidden complexity: statelessness forces external state, vendor lock-in, local testing/debugging friction, and distributed-tracing needs. Serverless is a tool for the right workload shape, not a default.</p>","explanation":"Serverless is like renting a taxi per trip — perfect for occasional or unpredictable journeys, but if you commute daily for hours, owning a car (always-on service) is cheaper and more comfortable.","bestPractices":["Use for event-driven, spiky, or scheduled workloads","Externalize state; design stateless functions","Model cost at expected sustained volume before committing"],"commonMistakes":["Serverless for steady high-throughput (costly)","Long/compute-heavy jobs hitting limits","Ignoring cold starts and vendor lock-in"],"interviewTip":"Frame it by workload shape: spiky/event-driven/pay-per-use = good; steady-high-throughput/low-latency/long-running = avoid. Mention cost crossover vs always-on.","followUp":["How does pay-per-use compare to always-on cost at scale?","How do you manage state in serverless?","What are FaaS execution limits?"]},
        {
            question: 'What is serverless computing? Does it mean there are no servers?',
            difficulty: 'easy',
            answer: `<p><strong>Serverless computing</strong> is a cloud execution model where the provider manages
            the servers, and you only write and deploy code (functions). It does NOT mean there are no
            servers — there absolutely are. It means YOU don't provision, manage, patch, or scale them.</p>
            <p>Key characteristics:</p>
            <ul>
                <li><strong>No server management:</strong> The provider handles all infrastructure</li>
                <li><strong>Auto-scaling:</strong> Scales from zero to thousands of instances automatically</li>
                <li><strong>Pay-per-use:</strong> You pay only for actual execution (compute time × memory)</li>
                <li><strong>Event-driven:</strong> Functions run in response to triggers</li>
            </ul>`,
            explanation: 'Serverless is like ride-sharing vs owning a car. You don\'t own, maintain, fuel, or park the car (server). You request a ride (invoke a function), pay for the trip (execution time), and the service handles everything else. The cars (servers) still exist — you just don\'t manage them.',
            bestPractices: [
                'Use for event-driven, spiky, or unpredictable workloads',
                'Keep functions small, stateless, and single-purpose',
                'Externalize all state to managed services'
            ],
            commonMistakes: [
                'Thinking serverless means literally no servers',
                'Using it for everything without considering cold starts and cost at scale'
            ],
            interviewTip: 'Lead with the clarification: "Serverless does not mean no servers — it means no server management for the developer." Then list the four characteristics. This precise framing signals you understand it properly.',
            followUp: [
                'What is the difference between FaaS and BaaS?',
                'What workloads are NOT a good fit for serverless?'
            ]
        },

        {
            question: 'Explain the cold start problem and strategies to mitigate it.',
            difficulty: 'medium',
            answer: `<p>A <strong>cold start</strong> is the latency added when the platform must initialize a new
            function instance before it can handle a request. This happens on the first invocation,
            after a period of inactivity, or when scaling out to handle more load.</p>
            <h4>Cold Start Phases</h4>
            <ol>
                <li>Download the deployment package</li>
                <li>Start the language runtime (.NET, Node, JVM)</li>
                <li>Run your initialization code (DI, connections, config)</li>
            </ol>
            <h4>Mitigation Strategies</h4>
            <ul>
                <li><strong>Provisioned/pre-warmed concurrency:</strong> Keep N instances always warm</li>
                <li><strong>Smaller packages:</strong> Bundle and tree-shake to reduce download time</li>
                <li><strong>Lighter runtimes:</strong> Go, Rust, Node start faster than JVM/.NET</li>
                <li><strong>AOT compilation:</strong> .NET Native AOT, GraalVM for near-instant starts</li>
                <li><strong>Lazy initialization:</strong> Defer heavy setup until actually needed</li>
                <li><strong>Keep-warm pings:</strong> Periodic invocations to prevent idle teardown</li>
            </ul>`,
            bestPractices: [
                'Initialize clients and connections outside the handler so warm instances reuse them',
                'Use provisioned concurrency for latency-critical, user-facing functions',
                'Choose lighter runtimes or AOT for cold-start-sensitive workloads',
                'Benchmark cold vs warm latency and right-size memory'
            ],
            commonMistakes: [
                'Ignoring cold starts on user-facing APIs with strict latency SLAs',
                'Heavy initialization inside the handler (runs every invocation)',
                'Large deployment packages with unused dependencies'
            ],
            interviewTip: 'Show you understand the trade-off, not just the term: "Cold starts matter for latency-sensitive user-facing functions but are usually a non-issue for background processing. For a login endpoint, I would use provisioned concurrency; for a nightly batch job, I would not bother."',
            followUp: [
                'How does memory allocation affect cold start and execution speed?',
                'When would provisioned concurrency NOT be worth the cost?'
            ],
            seniorPerspective: 'In production, I measure cold start frequency before optimizing. If only 0.5% of requests hit cold starts and the use case tolerates it, I leave it alone. For a payment API where every cold start is a visible user delay, I use provisioned concurrency despite the added cost, and I considered moving that specific hot path to a container instead.'
        },

        {
            question: 'When would you choose serverless over containers, and when would you avoid it?',
            difficulty: 'hard',
            answer: `<p>The choice depends on workload characteristics, latency needs, cost, and operational maturity.</p>
            <h4>Choose Serverless When</h4>
            <ul>
                <li>Traffic is spiky, unpredictable, or low-volume (scale-to-zero saves money)</li>
                <li>Workload is event-driven (file uploads, webhooks, queue processing, scheduled tasks)</li>
                <li>You want zero operational overhead and fast time-to-market</li>
                <li>Functions are short-lived and stateless</li>
                <li>Small team without dedicated ops/platform engineering</li>
            </ul>
            <h4>Choose Containers When</h4>
            <ul>
                <li>Traffic is steady and high-volume (containers are more cost-efficient)</li>
                <li>You need long-running processes or no execution time limits</li>
                <li>Latency is critical and cold starts are unacceptable</li>
                <li>You need portability (avoid vendor lock-in) or full runtime control</li>
                <li>You have stateful workloads or need persistent connections</li>
            </ul>
            <h4>The Decision Framework</h4>
            <p>Map your workload: traffic pattern (spiky → serverless, steady → containers), latency
            sensitivity (strict → containers, tolerant → serverless), execution duration (short → serverless,
            long → containers), and team capacity (small → serverless, has platform team → either).</p>`,
            bestPractices: [
                'Use a hybrid approach — serverless for event-driven edges, containers for steady core services',
                'Model cost at expected scale before committing — serverless economics flip at high volume',
                'Consider container-based serverless (AWS Fargate, Azure Container Apps, Knative) as a middle ground',
                'Factor in vendor lock-in cost for long-term strategic systems'
            ],
            commonMistakes: [
                'Choosing serverless for a steady high-throughput service (expensive)',
                'Choosing containers for rare event-driven tasks (paying for idle)',
                'Ignoring the operational overhead of Kubernetes for a small team',
                'Not considering container-based serverless as a middle ground'
            ],
            interviewTip: 'Avoid dogma. Show you decide based on workload characteristics: "It is not serverless vs containers as a religion — I match the compute model to the workload. Spiky event-driven work goes serverless; steady high-throughput core services go to containers. Many real systems use both."',
            followUp: [
                'What is container-based serverless (Fargate, Container Apps, Knative)?',
                'How does vendor lock-in factor into the decision?',
                'How would you migrate a function to a container if it outgrows serverless?'
            ],
            seniorPerspective: 'I have built systems that started serverless for speed-to-market, then migrated the hottest, highest-volume functions to containers once traffic became steady and predictable — at which point the per-execution cost exceeded a reserved container. The lesson: serverless is excellent for the unknown early phase and for spiky edges, while steady core load eventually justifies containers.',
            architectPerspective: 'The serverless vs container decision is increasingly a spectrum rather than binary, thanks to container-based serverless (Fargate, Azure Container Apps, Knative, Cloud Run). These offer scale-to-zero and per-use billing while running standard containers — reducing vendor lock-in and avoiding cold-start-heavy FaaS runtimes. For new architectures, I often recommend this middle ground: container portability with serverless economics.'
        },

        {
            question: 'What is the difference between FaaS and BaaS, and how do they combine in a serverless application?',
            difficulty: 'medium',
            answer: `<p>Both are pillars of serverless, but they cover different responsibilities:</p>
            <ul>
                <li><strong>FaaS (Functions as a Service)</strong> — you supply <strong>custom code</strong> that the platform runs on demand in response to events. The unit is a single function. Examples: AWS Lambda, Azure Functions, Google Cloud Functions. You own the logic; the platform owns the runtime and scaling.</li>
                <li><strong>BaaS (Backend as a Service)</strong> — you consume <strong>fully managed backend capabilities</strong> via APIs instead of building and running them. Examples: managed auth (Auth0, Cognito), managed databases (DynamoDB, Cosmos DB, Firestore), object storage (S3), and managed messaging. You write little or no server code for these concerns.</li>
            </ul>
            <p>They combine naturally: a typical serverless app uses <strong>BaaS for the commodity plumbing</strong> (auth, storage, database, queues) and <strong>FaaS for the custom business logic</strong> that glues them together and enforces domain rules. The rule of thumb: do not build with FaaS what a managed BaaS service already does well — reserve your function code for logic that is genuinely specific to your domain.</p>`,
            explanation: 'BaaS is buying pre-built appliances for your kitchen — a fridge, an oven, a dishwasher — fully working out of the box. FaaS is the recipes you write to combine those appliances into a meal. You would not build your own refrigerator (BaaS) just to cook dinner (FaaS).',
            code: `// FaaS function (custom business logic) leaning on BaaS for the heavy lifting
public class CheckoutFunction
{
    private readonly TableServiceClient _orders;   // BaaS: managed NoSQL store
    private readonly QueueServiceClient _queues;    // BaaS: managed messaging

    public CheckoutFunction(TableServiceClient orders, QueueServiceClient queues)
    {
        _orders = orders;
        _queues = queues;
    }

    [Function("Checkout")]
    public async Task<HttpResponseData> Run(
        // Auth (BaaS identity provider) already validated the token at the gateway
        [HttpTrigger(AuthorizationLevel.Function, "post", Route = "checkout")] HttpRequestData req,
        CancellationToken ct)
    {
        var cart = await req.ReadFromJsonAsync<Cart>(ct);

        // CUSTOM logic — this is why the function exists (domain rules)
        if (cart.Total <= 0) return req.CreateResponse(HttpStatusCode.BadRequest);

        // Delegate persistence and messaging to BaaS — no servers to run
        var table = _orders.GetTableClient("orders");
        await table.AddEntityAsync(cart.ToEntity(), ct);
        await _queues.GetQueueClient("fulfillment").SendMessageAsync(cart.Id, ct);

        return req.CreateResponse(HttpStatusCode.Accepted);
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Use BaaS for commodity concerns (auth, storage, database, messaging)',
                'Reserve FaaS for logic that is genuinely specific to your domain',
                'Let BaaS services handle scaling and durability rather than re-implementing them',
                'Keep functions thin glue layers between managed services'
            ],
            commonMistakes: [
                'Rebuilding in FaaS what a managed BaaS service already provides (auth, queues)',
                'Treating FaaS and BaaS as alternatives rather than complementary layers',
                'Hand-rolling identity/session management instead of using a managed provider',
                'Putting state inside functions instead of in a BaaS data store'
            ],
            interviewTip: 'Define both crisply with one example each, then state the combining principle: BaaS for plumbing, FaaS for your custom business logic. That shows you know how real serverless apps are actually assembled.',
            followUp: [
                'What are the lock-in implications of leaning heavily on BaaS?',
                'When would you build a capability yourself rather than use BaaS?',
                'How does BaaS affect your testing strategy?'
            ],
            seniorPerspective: 'I treat BaaS as the default and only write a function when there is real domain logic to express. Teams that reflexively build auth, queuing, or storage on top of bare functions end up maintaining undifferentiated infrastructure — the whole point of serverless is to delegate that to managed services.',
            architectPerspective: 'The FaaS/BaaS split is a buy-vs-build decision applied at the capability level. Heavy BaaS adoption accelerates delivery dramatically but deepens vendor lock-in, so I weigh that against portability needs. For most products the velocity wins; for systems that must stay cloud-agnostic, I isolate BaaS behind ports so the lock-in is contained at the edges.'
        },

        {
            question: 'Why must serverless functions be stateless, and how do you handle workflows that genuinely need state?',
            difficulty: 'hard',
            answer: `<p>Functions must be <strong>stateless</strong> because the platform can spin up, tear down, and load-balance instances freely. Any given invocation may land on a <strong>brand-new instance</strong> with empty memory, or a different instance than the previous request. In-memory state (counters, session data, caches) is therefore unreliable — it is not shared across instances and is lost on teardown. Statelessness is precisely what enables effortless horizontal scaling and scale-to-zero.</p>
            <p>For state that must persist, you <strong>externalize it</strong> to managed stores: databases (DynamoDB, Cosmos DB), distributed caches (Redis), object storage (S3), or queues. Each invocation reads and writes the external store rather than relying on local memory.</p>
            <p>For genuinely <strong>stateful, long-running workflows</strong> (multi-step orchestration, human-in-the-loop, fan-out/fan-in), use a <strong>durable orchestration</strong> framework — Azure <strong>Durable Functions</strong> or AWS <strong>Step Functions</strong>. These persist workflow state and progress to a managed store automatically, so the orchestration survives instance restarts, can wait days for an external event, and resumes exactly where it left off — all while the underlying activity functions stay stateless.</p>`,
            explanation: 'Treat each function instance like a hotel room you check into for one task: never leave anything important in it, because next time you may get a different room and housekeeping has cleared the last one. Anything you must keep goes in the safe at the front desk (external store). For a multi-day itinerary, the concierge (Durable Functions) tracks where you are in the plan so any room works.',
            code: `// BAD: in-memory state — resets per cold start, differs per instance
public class Counter
{
    private static int _count;       // NOT shared, NOT durable
    [Function("Bad")] public int Run([HttpTrigger] HttpRequestData _) => ++_count; // meaningless
}

// GOOD: externalized state in a managed store (shared + durable)
public class CounterFunction
{
    private readonly IDatabase _redis;
    public CounterFunction(IConnectionMultiplexer mux) => _redis = mux.GetDatabase();

    [Function("Count")]
    public async Task<long> Run([HttpTrigger("post")] HttpRequestData _)
        => await _redis.StringIncrementAsync("requests:count"); // atomic, shared across instances
}

// STATEFUL workflow: Durable Functions persists progress automatically.
// The orchestrator can pause for days and survive restarts; activities stay stateless.
[Function(nameof(ApprovalOrchestrator))]
public async Task<string> ApprovalOrchestrator(
    [OrchestrationTrigger] TaskOrchestrationContext context)
{
    var request = context.GetInput<ExpenseRequest>();
    await context.CallActivityAsync(nameof(NotifyApprover), request);

    // Durably WAIT for an external event — state is persisted, no instance held in memory
    var approved = await context.WaitForExternalEvent<bool>("ApprovalDecision");

    return approved
        ? await context.CallActivityAsync<string>(nameof(Reimburse), request)
        : "Rejected";
}`,
            language: 'csharp',
            bestPractices: [
                'Externalize all durable state to managed databases, caches, or storage',
                'Use atomic operations in the external store (e.g. Redis INCR) for shared counters',
                'Use Durable Functions or Step Functions for long-running, stateful orchestration',
                'Design every invocation to be safe to run on a fresh, empty instance'
            ],
            commonMistakes: [
                'Storing session data, counters, or caches in function memory',
                'Assuming a warm instance will always serve the next request',
                'Building long-running workflows with chained functions and no durable state',
                'Holding an instance in memory waiting on a slow external event instead of using durable wait'
            ],
            interviewTip: 'Explain the why first — instances are ephemeral and load-balanced, so local memory is unreliable. Then split the answer: simple state goes to an external store; complex long-running workflows go to Durable Functions / Step Functions. Naming those frameworks signals real experience.',
            followUp: [
                'How do Durable Functions persist and replay orchestration state?',
                'How do you avoid database connection exhaustion under massive fan-out?',
                'When would a stateful workflow be better served by a long-running container?'
            ],
            seniorPerspective: 'The subtle production failure is database connection exhaustion: thousands of concurrent function instances each opening connections can overwhelm a relational database. I route through connection proxies (RDS Proxy) or prefer serverless-native stores (DynamoDB, Cosmos DB) that scale with the function fleet rather than fighting it.',
            architectPerspective: 'Statelessness is the constraint that buys serverless its elasticity, so I design the architecture to honor it: ephemeral compute, durable state in purpose-built managed stores, and orchestration frameworks for any workflow that must remember where it is. When a workflow needs to hold rich in-memory state for long periods, that is a signal the work belongs in a stateful container or actor model instead of FaaS.'
        },

        {
            question: 'Explain the serverless cost model. At what point does serverless become more expensive than always-on compute?',
            difficulty: 'advanced',
            answer: `<p>Serverless FaaS billing has two main components: <strong>number of invocations</strong> and <strong>compute charged as GB-seconds</strong> (allocated memory multiplied by execution time). Crucially, you pay <strong>nothing while idle</strong> because the platform scales to zero. This makes the cost model fundamentally <strong>usage-proportional</strong> rather than capacity-proportional.</p>
            <p>That economic profile is a perfect fit for <strong>spiky, unpredictable, or low-volume</strong> workloads: a webhook handler that fires a few thousand times a day costs cents, where an always-on VM would bill 24/7 for mostly idle capacity.</p>
            <p>The crossover happens with <strong>steady, high-throughput</strong> traffic. When a function runs essentially all the time at high concurrency, you are effectively paying premium per-execution rates for capacity you could rent far more cheaply as a reserved VM or a continuously running container. At that point a right-sized container/VM — especially with reserved or spot pricing — is typically cheaper, and you also escape cold starts. Additional cost factors people forget: <strong>data transfer/egress</strong>, the per-request charges of fronting services (API Gateway), and the cost of <strong>provisioned concurrency</strong> (which removes scale-to-zero savings to fix cold starts).</p>`,
            explanation: 'Serverless pricing is a metered taxi: cheap for occasional trips, and you pay nothing when parked. But if you need a car moving all day every day, the meter adds up fast and leasing your own (a reserved container/VM) becomes cheaper. The break-even is roughly when utilization stops being spiky and becomes near-constant.',
            code: `// Rough cost intuition (illustrative — check current provider pricing)
//
// FaaS charge ~= invocations * per-invocation fee
//             +  (memoryGB * durationSeconds * invocations) * per-GB-second fee
//
// Spiky workload: 100k invocations/day, 200ms each, 256MB
//   GB-seconds/day = 0.25 GB * 0.2 s * 100,000 = 5,000 GB-s   -> a few cents/day
//   Idle the rest of the day -> $0. Serverless wins decisively.
//
// Steady workload: ~10 invocations/sec sustained, 200ms each, 512MB, all day
//   ~864,000 invocations/day, GB-seconds/day = 0.5 * 0.2 * 864,000 = 86,400 GB-s
//   At this constant load you are paying premium per-execution rates 24/7
//   -> a small reserved container/VM running continuously is usually cheaper
//      AND avoids cold starts.
//
// Hidden costs to model BEFORE committing:
//   - API Gateway / front-door per-request fees
//   - Data egress / cross-AZ transfer
//   - Provisioned concurrency (pre-warmed instances) = you pay for idle, losing
//     the scale-to-zero advantage to buy lower latency`,
            language: 'csharp',
            bestPractices: [
                'Model expected cost at realistic peak and sustained load before committing',
                'Right-size memory — more memory often means faster execution and sometimes lower total cost',
                'Account for hidden costs: API Gateway per-request fees, data egress, provisioned concurrency',
                'Re-evaluate compute model when a workload shifts from spiky to steady high volume'
            ],
            commonMistakes: [
                'Assuming serverless is always cheaper and skipping cost modeling',
                'Running a steady high-throughput service on FaaS at premium per-execution rates',
                'Forgetting that provisioned concurrency removes the scale-to-zero cost benefit',
                'Ignoring data transfer and gateway fees that can dwarf the compute charge'
            ],
            interviewTip: 'Name the two billing dimensions (invocations + GB-seconds) and the scale-to-zero benefit, then give the crossover answer: steady high-throughput load is where always-on containers/VMs win. Mentioning hidden costs like egress and provisioned concurrency shows real-world depth.',
            followUp: [
                'How does allocated memory affect both performance and cost?',
                'How does provisioned concurrency change the cost equation?',
                'How would you decide the break-even point for migrating a hot function to a container?'
            ],
            seniorPerspective: 'I have watched a "cheap" serverless bill balloon once a feature went from bursty to constantly busy — the scale-to-zero advantage simply evaporates under steady load. My rule is to revisit the compute choice whenever a function trends toward near-constant utilization, because that is exactly where a reserved container becomes both cheaper and lower-latency.',
            architectPerspective: 'Serverless economics reward variance and punish steady saturation, so I map cost to traffic shape per workload rather than picking one model for the whole system. The healthiest architectures are hybrids: FaaS on the spiky, event-driven edges where idle savings dominate, and containers for the steady core where reserved capacity is cheaper and cold starts are unacceptable.'
        }
    ]
});
