/* ═══════════════════════════════════════════════════════════════════
   Azure — Compute Services: App Service, Functions, AKS, Container Apps
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('azure-compute', {
    title: 'Azure Compute Services',
    description: 'Choosing between App Service, Azure Functions, AKS, and Container Apps — pricing models, scaling behavior, and decision criteria for different workload types.',
    sections: [
        {
            title: 'Compute Service Comparison',
            content: `<p>Azure offers multiple compute options. The right choice depends on workload characteristics: request pattern, scaling needs, cost model, and operational complexity.</p>`,
            table: {
                headers: ['Service', 'Best For', 'Scaling', 'Pricing Model'],
                rows: [
                    ['App Service', 'Web APIs, web apps, steady traffic', 'Manual or auto (1-30 instances)', 'Per-plan (always-on VMs)'],
                    ['Azure Functions', 'Event-driven, sporadic, short tasks', 'Auto (0 to hundreds, serverless)', 'Per-execution (Consumption) or premium'],
                    ['AKS', 'Complex microservices, full K8s control', 'HPA + cluster autoscaler', 'Per-VM node (control plane free)'],
                    ['Container Apps', 'Containers without K8s complexity', 'KEDA-based (0 to many)', 'Per-vCPU/memory second (serverless)'],
                    ['Logic Apps', 'Workflow orchestration, integrations', 'Auto per workflow', 'Per-action execution']
                ]
            }
        },
        {
            title: 'Azure Functions (Serverless)',
            content: `<p>Azure Functions execute code in response to events (HTTP, queue messages, timers, blob changes) without managing infrastructure. They scale from zero and charge per execution.</p>`,
            code: `// HTTP Trigger (Isolated Worker model — .NET 8+)
public class OrderFunctions
{
    private readonly IOrderService _orderService;
    
    public OrderFunctions(IOrderService orderService) => _orderService = orderService;

    [Function("CreateOrder")]
    public async Task<HttpResponseData> CreateOrder(
        [HttpTrigger(AuthorizationLevel.Function, "post", Route = "orders")] 
        HttpRequestData req)
    {
        var request = await req.ReadFromJsonAsync<CreateOrderRequest>();
        var order = await _orderService.CreateAsync(request!);
        
        var response = req.CreateResponse(HttpStatusCode.Created);
        await response.WriteAsJsonAsync(order);
        return response;
    }

    // Queue Trigger — process messages from Azure Storage Queue
    [Function("ProcessPayment")]
    public async Task ProcessPayment(
        [QueueTrigger("payment-queue")] PaymentMessage message)
    {
        await _orderService.ProcessPaymentAsync(message.OrderId, message.Amount);
    }

    // Timer Trigger — scheduled execution (CRON)
    [Function("DailyCleanup")]
    public async Task DailyCleanup(
        [TimerTrigger("0 0 2 * * *")] TimerInfo timer) // 2 AM daily
    {
        await _orderService.CleanupExpiredOrdersAsync();
    }

    // Blob Trigger — react to file uploads
    [Function("ProcessUpload")]
    public async Task ProcessUpload(
        [BlobTrigger("uploads/{name}")] Stream blob, string name)
    {
        await _orderService.ProcessFileAsync(blob, name);
    }
}

// Hosting plans:
// Consumption: scale 0→200, 5 min timeout, pay per execution (cheapest for sporadic)
// Premium: pre-warmed, VNET, no cold start, 60 min timeout
// Dedicated: runs on App Service plan (predictable cost)`,
            language: 'csharp'
        },
        {
            title: 'Decision Framework',
            content: `<p>Choosing the right compute service is a key architectural decision. Use this framework based on workload characteristics.</p>`,
            code: `// Decision tree:
// 1. Do you need full Kubernetes control? → AKS
// 2. Is it event-driven with sporadic traffic? → Azure Functions
// 3. Is it a container workload without K8s expertise? → Container Apps
// 4. Is it a traditional web app/API with steady traffic? → App Service
// 5. Is it workflow orchestration? → Logic Apps / Durable Functions

// Azure Functions vs Container Apps:
// Functions: code-first, event bindings, short execution, auto-scale from 0
// Container Apps: container-first, long-running, Dapr integration, KEDA scaling

// App Service vs Container Apps:
// App Service: platform-managed, deployment slots, built-in auth, easy CI/CD
// Container Apps: any container image, microservice sidecars, scale to zero

// Cost optimization patterns:
// - Dev/Test: use Consumption/Free tiers
// - Predictable load: App Service (reserved instances save 40-60%)
// - Spiky load: Functions Consumption (pay only when running)
// - Always-on with burst: Container Apps (baseline + auto-scale)`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'When would you choose Azure Functions vs App Service vs Container Apps?',
            difficulty: 'medium',
            answer: `<p>Choose based on workload pattern: <strong>Functions</strong> for event-driven, sporadic, short tasks (< 5 min). <strong>App Service</strong> for traditional web APIs with steady traffic and simple deployment. <strong>Container Apps</strong> for containerized microservices needing scale-to-zero without Kubernetes complexity.</p>`,
            bestPractices: ['Use Functions for glue code, event handlers, and scheduled tasks', 'Use App Service for primary API workloads with predictable traffic', 'Use Container Apps when you need containers but not full K8s operational burden', 'Consider cold start latency for Functions (use Premium plan if latency matters)'],
            commonMistakes: ['Using Functions for long-running processes (5 min timeout on Consumption)', 'Over-engineering with AKS when Container Apps would suffice', 'Not considering cold start impact on user-facing APIs', 'Running dev/test on production-tier plans (cost waste)'],
            interviewTip: 'Show decision criteria: execution duration, scaling pattern, cost model, and operational complexity. Don\'t just pick one — explain WHY based on specific workload characteristics.',
            followUp: ['What are Durable Functions?', 'How does KEDA scaling work in Container Apps?', 'What is the cold start problem?'],
            seniorPerspective: 'I use a mix: App Service for primary APIs, Functions for background processing (queue triggers, timers), Container Apps for microservices that need sidecars (Dapr). Each service chosen for its sweet spot.',
            architectPerspective: 'The compute choice cascades: Functions encourage event-driven architecture, AKS enables service mesh patterns, App Service fits traditional N-tier. Choose the compute that aligns with your desired architectural style, not just technical requirements.'
        },
        {
            question: 'What are Durable Functions and when would you use them instead of regular Azure Functions?',
            difficulty: 'advanced',
            answer: `<p><strong>Durable Functions</strong> extend Azure Functions with stateful orchestration — managing long-running workflows, parallel fan-out/fan-in, human interaction (approval workflows), and reliable timers. Regular Functions are stateless and short-lived (5-10 min timeout). Durable Functions can run for days/weeks by persisting state to Azure Storage between executions.</p>`,
            code: `// Durable Function orchestration example:
[Function("OrderProcessingOrchestrator")]
public static async Task<OrderResult> RunOrchestrator(
    [OrchestrationTrigger] TaskOrchestrationContext context)
{
    var order = context.GetInput<Order>();
    
    // Sequential steps (each is a separate Function execution):
    await context.CallActivityAsync("ValidateOrder", order);
    var payment = await context.CallActivityAsync<PaymentResult>("ChargePayment", order);
    await context.CallActivityAsync("ReserveInventory", order);
    
    // Fan-out/fan-in (parallel execution):
    var notifications = new[]
    {
        context.CallActivityAsync("SendEmail", order),
        context.CallActivityAsync("SendSMS", order),
        context.CallActivityAsync("UpdateAnalytics", order)
    };
    await Task.WhenAll(notifications);
    
    // Human interaction (wait for approval with timeout):
    using var cts = new CancellationTokenSource();
    var approval = context.WaitForExternalEvent<bool>("ManagerApproval");
    var timeout = context.CreateTimer(TimeSpan.FromHours(24), cts.Token);
    var winner = await Task.WhenAny(approval, timeout);
    if (winner == timeout) throw new TimeoutException("Approval not received");
    
    return new OrderResult(payment.TransactionId);
}`,
            language: 'csharp',
            interviewTip: 'Show the three key patterns: (1) function chaining (sequential steps), (2) fan-out/fan-in (parallel processing), (3) human interaction (wait for external event with timeout). Emphasize that state is durably persisted — if the Function host crashes, it resumes from the last completed step.',
            followUp: ['How does Durable Functions persist state?', 'What are the replay semantics?', 'How does this compare to Azure Logic Apps?'],
            seniorPerspective: 'I use Durable Functions for multi-step workflows that span minutes to days: order processing with payment + fulfillment, document approval chains, and data pipeline orchestration with retry/error handling at each step.',
            architectPerspective: 'Durable Functions solve the stateful orchestration problem in serverless: you get workflow management (state machines, retries, timeouts) without managing infrastructure (no Temporal/Airflow cluster to operate). The trade-off: vendor lock-in to Azure Storage for state persistence.'
        },
        {
            question: 'When does AKS make sense over Azure Container Apps, and what operational cost does it add?',
            difficulty: 'hard',
            answer: `<p><strong>Container Apps</strong> is a serverless container platform built on top of AKS, KEDA, Dapr, and Envoy that hides the cluster: no nodes, control plane, or upgrades to manage, with scale-to-zero and built-in revisions. Choose it for most microservice and event-driven container workloads.</p>
            <p>Choose <strong>AKS</strong> when you genuinely need raw Kubernetes: custom operators/CRDs, a specific service mesh (Istio/Linkerd), GPU or specialized node pools, DaemonSets, fine-grained networking (CNI policies), or multi-cloud portability of K8s manifests. The cost is real operational burden: node patching, cluster/API upgrades, capacity planning, and platform expertise on the team.</p>`,
            bestPractices: ['Default to Container Apps unless a concrete K8s feature is required', 'Adopt AKS only with a platform team that can own upgrades and security patching', 'Use AKS node pools (system vs user, spot, GPU) to isolate and optimize workloads', 'Treat the AKS control plane as free but the operational overhead as the real cost'],
            commonMistakes: ['Standing up AKS for a handful of simple services that Container Apps would run', 'Underestimating ongoing node patching and Kubernetes version upgrade churn', 'No node pool strategy, mixing system and bursty workloads on the same nodes', 'Reinventing scale-to-zero and revisions that Container Apps already provides'],
            interviewTip: 'Frame Container Apps as "AKS with the operations removed". Then justify AKS only by naming a specific capability you cannot get otherwise (CRDs, mesh, GPU, DaemonSets). That shows you do not reach for Kubernetes by default.',
            followUp: ['What does Dapr provide inside Container Apps?', 'How do AKS node pools differ from a single node set?', 'How do Container Apps revisions enable blue/green?'],
            seniorPerspective: 'I push teams toward Container Apps unless they can point to a hard K8s requirement. Most "we need Kubernetes" requests are really "we need containers that scale", which Container Apps does without the upgrade treadmill.',
            architectPerspective: 'The decision is about who owns the platform. AKS gives maximum control and portability at the price of running a Kubernetes platform; Container Apps trades that control for letting Microsoft operate the substrate. Pick based on team capability, not resume-driven design.'
        },
        {
            question: 'How does scaling work in Azure Container Apps, and how does KEDA enable scale-to-zero?',
            difficulty: 'medium',
            answer: `<p>Container Apps scales horizontally using <strong>KEDA</strong> (Kubernetes Event-Driven Autoscaling) scale rules. Beyond CPU/memory, you scale on event sources: HTTP concurrency, queue length (Service Bus, Storage Queue), Event Hub lag, Kafka, or custom metrics. You define min and max replicas, and KEDA adjusts replica count based on the metric.</p>
            <p><strong>Scale-to-zero</strong> happens when minReplicas is 0: with no traffic or pending messages, the app drops to zero replicas and you pay nothing for compute. The first request or message triggers activation (incurring a cold start). HTTP apps scale on concurrent requests per replica; background workers typically scale on queue depth.</p>`,
            code: `# Container App with KEDA queue-based scaling (Bicep snippet)
scale: {
  minReplicas: 0          # scale to zero when idle
  maxReplicas: 30
  rules: [
    {
      name: 'queue-rule'
      custom: {
        type: 'azure-servicebus'
        metadata: {
          queueName: 'orders'
          messageCount: '20'   # ~1 replica per 20 pending messages
        }
        auth: [ { secretRef: 'sb-connection', triggerParameter: 'connection' } ]
      }
    }
  ]
}`,
            language: 'yaml',
            bestPractices: ['Set minReplicas to 0 for spiky or event-driven workloads to cut idle cost', 'Keep minReplicas at 1+ for latency-sensitive HTTP apps to avoid cold starts', 'Scale background workers on queue depth, not CPU, so backlog drives capacity', 'Tune the per-replica message/concurrency target to control replica count'],
            commonMistakes: ['Using scale-to-zero on a latency-critical API and surprising users with cold starts', 'Scaling workers on CPU when the real signal is queue backlog', 'Setting maxReplicas too low and silently capping throughput under load', 'Forgetting that activation from zero adds startup latency to the first request'],
            interviewTip: 'Mention that Container Apps scaling IS KEDA under the hood. Contrast HTTP concurrency scaling (user-facing) with queue-depth scaling (workers), and call out the cold-start trade-off of minReplicas=0.',
            followUp: ['What event sources can KEDA scale on?', 'How would you avoid cold starts while keeping costs low?', 'How does HTTP concurrency scaling pick replica count?'],
            seniorPerspective: 'For workers I scale on backlog-per-replica so capacity tracks how far behind we are, and I let them scale to zero overnight. For user-facing APIs I keep at least one warm replica because a cold start on the critical path is not worth the few cents saved.',
            architectPerspective: 'Event-driven autoscaling lets the same platform host both always-on APIs and bursty workers under one billing and deployment model. Choosing the scale signal per workload is what makes the cost/latency trade-off explicit rather than accidental.'
        },
        {
            question: 'Compare the Consumption, Premium, and Dedicated hosting plans for Azure Functions.',
            difficulty: 'advanced',
            answer: `<p><strong>Consumption</strong> is true serverless: scale from 0 to 200 instances, pay per execution and GB-seconds, ~5 minute default timeout (configurable to 10), and cold starts because idle instances are reclaimed. Best for sporadic, cost-sensitive workloads.</p>
            <p><strong>Premium (Elastic Premium)</strong> keeps pre-warmed instances to eliminate cold starts, supports VNet integration and longer/unbounded execution, and scales elastically \u2014 but you pay for a minimum number of always-ready instances. Best for latency-sensitive or VNet-bound functions with meaningful traffic.</p>
            <p><strong>Dedicated (App Service plan)</strong> runs Functions on VMs you already pay for, giving predictable fixed cost and letting you reuse spare capacity, but without elastic scale-to-zero. Best when you already run an App Service plan or need fully predictable billing.</p>`,
            bestPractices: ['Use Consumption for spiky, low-volume workloads where cold starts are acceptable', 'Use Premium when you need no cold starts, VNet access, or long-running executions', 'Use Dedicated to soak up spare capacity on an existing App Service plan', 'Model cost at sustained throughput \u2014 Consumption can exceed Premium under constant load'],
            commonMistakes: ['Running latency-critical APIs on Consumption and shipping cold-start latency to users', 'Choosing Premium and ignoring the always-on minimum-instance charge', 'Needing VNet integration but staying on Consumption (limited/unsupported)', 'Assuming Consumption is always cheapest regardless of traffic volume'],
            interviewTip: 'Anchor each plan to its defining trade-off: Consumption = cheapest + cold starts, Premium = no cold starts + VNet + min-instance cost, Dedicated = predictable fixed cost, no scale-to-zero. Mentioning timeout limits and VNet support shows depth.',
            followUp: ['How does Premium eliminate cold starts?', 'Why might Consumption cost more than Premium at scale?', 'Which plan supports VNet integration and why does that matter?'],
            seniorPerspective: 'I start new functions on Consumption and only move to Premium when cold starts hurt a user-facing path or we need private networking. The Premium minimum-instance cost is easy to forget and shows up on the bill.',
            architectPerspective: 'The plan choice encodes the latency/cost/networking trade-off. Serverless is not free of decisions: VNet requirements and cold-start sensitivity often force Premium, which changes the economics from pay-per-use to a baseline-plus-burst model.'
        },
        {
            question: 'When would you use Logic Apps versus Durable Functions for workflow orchestration?',
            difficulty: 'medium',
            answer: `<p><strong>Logic Apps</strong> is a low-code, designer-driven workflow engine with 1000+ managed connectors (SaaS, SAP, Office 365, FTP, databases). It shines for integration and B2B/EAI scenarios where you wire together external systems with minimal code and want operations/business analysts to read the flow.</p>
            <p><strong>Durable Functions</strong> is code-first orchestration in C#/JavaScript/Python: you express workflows as code (chaining, fan-out/fan-in, human interaction, eternal orchestrations) with full testability, source control, and complex branching. Choose it when logic is complex, developer-owned, and benefits from being expressed in code rather than a designer.</p>`,
            bestPractices: ['Use Logic Apps for connector-heavy integration and system-to-system glue', 'Use Durable Functions for complex, code-owned business workflows', 'Let Logic Apps call Functions for custom compute the connectors cannot do', 'Keep workflow logic in source control \u2014 favor Durable Functions when testability matters'],
            commonMistakes: ['Hand-coding dozens of API integrations that prebuilt Logic Apps connectors already provide', 'Forcing complex branching/loops into the Logic Apps designer where code would be clearer', 'Ignoring per-action billing on Logic Apps for very chatty workflows', 'Treating them as mutually exclusive instead of composing them'],
            interviewTip: 'Split on who owns and reads the workflow: Logic Apps = low-code + connectors for integration; Durable Functions = code-first for complex developer-owned logic. Note that they compose \u2014 Logic Apps frequently call Functions.',
            followUp: ['How does Logic Apps connector model reduce integration code?', 'What Durable Functions patterns have no clean Logic Apps equivalent?', 'How is each billed?'],
            seniorPerspective: 'I reach for Logic Apps when the value is in the connectors (pulling from SaaS, FTP, mailboxes) and for Durable Functions when the value is in the logic. Mixing them \u2014 Logic App orchestrating, Functions doing the heavy lifting \u2014 is common and pragmatic.',
            architectPerspective: 'This is a build-vs-configure decision. Logic Apps trades code control for integration speed and business readability; Durable Functions trades designer simplicity for testable, version-controlled complexity. Mature platforms use both, routing each workflow to the model that fits its owner and complexity.'
        }
    ,
        {
            question: 'How do App Service deployment slots enable zero-downtime releases, and what are the pitfalls?',
            difficulty: 'medium',
            answer: `<p><strong>Deployment slots</strong> are live instances of an App Service with their own hostname (e.g., a <code>staging</code> slot). You deploy to staging, warm it up and smoke-test, then <strong>swap</strong> \u2014 Azure swaps the routing (and, after a warm-up phase, the running instances) so production traffic moves to the already-warm new version with no cold start. If something is wrong, you swap back instantly (the old version is now in staging).</p>
            <p>Pitfalls: <strong>slot settings</strong> \u2014 some app settings/connection strings should be marked "deployment slot setting" (sticky to the slot) so they do not swap; otherwise staging config follows the swap into production. Also, in-flight/background work and shared resources (same database, caches) still need backward compatibility.</p>`,
            explanation: 'It is like rehearsing a play on a duplicate stage, then rotating the stage so the audience instantly sees the ready cast \u2014 and you can rotate it straight back if a prop falls.',
            bestPractices: ['Warm up and smoke-test the staging slot before swapping', 'Mark environment-specific config as slot (sticky) settings so it does not swap', 'Keep the database/schema backward compatible across both versions during a swap', 'Use swap-with-preview to validate prod config before completing the swap'],
            commonMistakes: ['Forgetting sticky slot settings, so staging config lands in production', 'Swapping without warm-up, reintroducing cold-start latency', 'Assuming slots isolate shared resources (same DB/cache still shared)', 'Treating swap as a substitute for backward-compatible changes'],
            interviewTip: 'Explain swap = routing change to an already-warm instance (instant rollback by swapping back), then raise sticky slot settings \u2014 the classic config-follows-the-swap bug.',
            followUp: ['What is swap-with-preview?', 'How do slot settings differ from normal app settings?', 'How does this compare to blue-green on Kubernetes?'],
            seniorPerspective: 'Slots give cheap blue-green on App Service, but the config-stickiness footgun bites every team once: a connection string swaps into prod and points it at staging\u2019s database. I audit slot settings as part of release setup.',
            architectPerspective: 'Slots deliver zero-downtime deploys only if the app is backward compatible with shared state during the swap window. The deployment mechanism is easy; the discipline of compatible schema and config is what actually makes releases safe.'
        },
        {
            question: 'How do you design an Azure workload for resilience across availability zones and regions?',
            difficulty: 'advanced',
            answer: `<p>Resilience is layered by failure domain:</p>
            <ul>
                <li><strong>Availability Zones</strong> \u2014 physically separate datacenters within a region. Deploy zone-redundant services (zone-redundant App Service/AKS node pools, zone-redundant storage, zonal VM spread) to survive a datacenter failure with low latency.</li>
                <li><strong>Regions / paired regions</strong> \u2014 for region-wide outages, replicate to a second region (active-active or active-passive). Azure <em>paired regions</em> get sequential updates and geo-replication features.</li>
                <li><strong>Global routing</strong> \u2014 Azure Front Door (HTTP) or Traffic Manager (DNS) routes users to the healthy region and fails over automatically.</li>
                <li><strong>Data</strong> \u2014 choose replication (GZRS storage, SQL geo-replication/failover groups, Cosmos multi-region) matching your RPO/RTO.</li>
            </ul>`,
            explanation: 'Availability Zones are like having backup generators in separate buildings on the same campus; multi-region is a second campus in another city. You pick how far apart your backups need to be based on how catastrophic an outage you must survive.',
            bestPractices: ['Use zone-redundant deployments for in-region datacenter resilience', 'Add multi-region (with Front Door/Traffic Manager) for region-outage and DR', 'Match data replication (GZRS, SQL failover groups, Cosmos multi-region) to RPO/RTO', 'Test failover regularly \u2014 untested DR is not DR'],
            commonMistakes: ['Single-zone deployment assuming the region "won\u2019t fail"', 'Multi-region compute with a single-region database (the data is the SPOF)', 'Never testing regional failover, so it fails when needed', 'Choosing active-active without handling data conflict/consistency'],
            interviewTip: 'Separate the failure domains explicitly: zones (datacenter) vs regions (geography), then map each to the right redundancy and a routing layer (Front Door/Traffic Manager). Tie data replication to RPO/RTO.',
            followUp: ['What is the difference between Front Door and Traffic Manager for failover?', 'How do SQL failover groups work?', 'What are paired regions and why do they matter?'],
            seniorPerspective: 'The mistake I see most is multi-region compute in front of a single-region database \u2014 you have paid for redundancy that the data layer quietly negates. I design the data replication and failover story first, because that is the hard part.',
            architectPerspective: 'Resilience is a cost/complexity dial set by RPO/RTO requirements, not a checkbox. Zone-redundancy is cheap insurance most workloads should take; full active-active multi-region is expensive and only justified when a region outage is genuinely unacceptable.'
        }
    ]
});
