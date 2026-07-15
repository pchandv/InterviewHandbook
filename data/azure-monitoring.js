/* ═══════════════════════════════════════════════════════════════════
   Azure — Monitoring & Networking: App Insights, Azure Monitor, Front Door
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('azure-monitoring', {
    title: 'Azure Monitoring & Networking',
    description: 'Application Insights, Azure Monitor, distributed tracing, alerting, Azure Front Door, Load Balancer, VNETs, and building observable, resilient cloud infrastructure.',
    sections: [
        {
            title: 'Application Insights & Observability',
            content: `<p><strong>Application Insights</strong> provides end-to-end observability: request tracing, dependency tracking, exceptions, performance metrics, and custom telemetry — with automatic distributed tracing across microservices.</p>`,
            code: `// Setup in ASP.NET Core:
builder.Services.AddApplicationInsightsTelemetry();

// Automatic instrumentation (zero-code) captures:
// - HTTP requests (duration, status, URL)
// - Dependencies (SQL queries, HTTP calls, Redis, Service Bus)
// - Exceptions (full stack trace, request context)
// - Performance counters (CPU, memory, GC)

// Custom telemetry:
public class OrderService
{
    private readonly TelemetryClient _telemetry;

    public async Task PlaceOrderAsync(Order order)
    {
        using var operation = _telemetry.StartOperation<RequestTelemetry>("PlaceOrder");
        
        _telemetry.TrackEvent("OrderPlaced", new Dictionary<string, string>
        {
            ["OrderId"] = order.Id.ToString(),
            ["Total"] = order.Total.ToString("F2")
        });

        _telemetry.GetMetric("OrderValue").TrackValue(order.Total);
        
        // Custom dependency tracking:
        using var dep = _telemetry.StartOperation<DependencyTelemetry>("PaymentGateway");
        await _payment.ChargeAsync(order);
    }
}

// Distributed tracing (automatic with W3C TraceContext):
// Request hits API Gateway → traces to Order Service → traces to Payment API
// All linked by the same Operation ID — visible in Application Map

// KQL queries for analysis:
// Slowest requests in last hour:
// requests | where timestamp > ago(1h) | top 10 by duration

// Failed dependencies:
// dependencies | where success == false | summarize count() by name, resultCode

// Alerting:
// Alert when: failure rate > 5% for 5 minutes
// Alert when: P95 response time > 2 seconds
// Alert when: exception rate spikes 3x above baseline`,
            language: 'csharp'
        },
        {
            title: 'Azure Front Door & Global Networking',
            content: `<p><strong>Azure Front Door</strong> provides global load balancing, SSL termination, WAF (Web Application Firewall), and CDN caching at the edge — routing users to the nearest healthy backend.</p>`,
            code: `// Azure Front Door architecture:
// User (Sydney) → Front Door PoP (Sydney) → Backend (Australia East)
// User (London) → Front Door PoP (London) → Backend (West Europe)
// Automatic failover if a region goes down

// Key capabilities:
// 1. Global HTTP load balancing (latency-based routing)
// 2. SSL termination at edge (reduce backend TLS overhead)
// 3. WAF (OWASP rule sets, custom rules, rate limiting)
// 4. Caching at edge (static content, API responses with cache rules)
// 5. Health probes (auto-remove unhealthy backends)
// 6. URL rewriting and redirect rules

// VNET architecture for production:
// Public: Front Door (global entry point)
// DMZ: API Management (in VNET, internal mode)
// App Subnet: App Services (VNET integrated)
// Data Subnet: SQL, Redis, Storage (Private Endpoints only)
// Management Subnet: Bastion, monitoring agents

// Key networking concepts:
// VNET: isolated private network in Azure
// Subnet: segment within VNET (app subnet, data subnet)
// NSG: firewall rules on subnet level
// Private Endpoint: private IP for Azure PaaS services
// Service Endpoint: optimized route to Azure services (less isolation than Private Endpoint)
// VNET Peering: connect VNETs (cross-region, cross-subscription)`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'How do you implement observability in a microservices architecture on Azure?',
            difficulty: 'advanced',
            answer: `<p>Observability requires three pillars: (1) <strong>Distributed tracing</strong> (Application Insights with W3C TraceContext — traces requests across services), (2) <strong>Metrics</strong> (Azure Monitor metrics, custom counters, dashboards), (3) <strong>Structured logging</strong> (correlated logs with operation IDs). Combined with alerting on SLOs and an Application Map showing service dependencies.</p>`,
            bestPractices: ['Use Application Insights for automatic distributed tracing (zero-code instrumentation)', 'Define SLOs and alert on them (not just raw metrics)', 'Correlate logs across services using Operation ID / Trace ID', 'Use Application Map to visualize service dependencies and failure points'],
            commonMistakes: ['Only monitoring infrastructure (CPU/memory) without application-level metrics', 'Not correlating logs across services (impossible to trace a request through the system)', 'Alert fatigue from too many low-value alerts (alert on symptoms, not causes)', 'Not tracking custom business metrics (only technical metrics miss business impact)'],
            interviewTip: 'Frame observability as answering: "Why is this user\'s request slow?" You need distributed tracing (which services were involved), metrics (what was the latency at each hop), and logs (what went wrong). Show how Application Insights provides all three with automatic correlation.',
            followUp: ['What is the difference between monitoring and observability?', 'How does distributed tracing work?', 'What are SLOs vs SLAs vs SLIs?'],
            seniorPerspective: 'I implement observability as a non-negotiable production requirement: every service gets Application Insights, structured logging with Serilog, health checks, and a dashboard showing the four golden signals (latency, traffic, errors, saturation). No service goes to production without this.',
            architectPerspective: 'Observability is the foundation of operational excellence. Without it, you are flying blind. I invest in: centralized logging (Log Analytics), distributed tracing (App Insights), custom dashboards (Grafana/Azure Dashboards), and automated alerting tied to SLOs. The cost of observability infrastructure is trivial compared to the cost of a production incident without visibility.'
        }
    ,
        {
            question: 'Define SLI, SLO, and SLA, and explain how they relate.',
            difficulty: 'medium',
            answer: `<p>An <strong>SLI</strong> (Service Level Indicator) is a measured signal of service health \u2014 e.g., the fraction of requests served under 300ms or with a 2xx status. An <strong>SLO</strong> (Service Level Objective) is the internal target for that SLI \u2014 e.g., 99.9% of requests succeed over 30 days. An <strong>SLA</strong> (Service Level Agreement) is a contractual promise to customers, usually looser than the SLO, with penalties if breached.</p>
            <p>They nest: you measure SLIs, set SLOs stricter than the SLA to leave a safety margin, and the gap between the SLO and 100% is your <strong>error budget</strong>, which governs how aggressively you can ship changes.</p>`,
            bestPractices: ['Pick SLIs that reflect user pain (latency, error rate, availability)', 'Set SLOs stricter than the SLA so you breach internally before contractually', 'Use the error budget to balance feature velocity against reliability', 'Alert on SLO burn rate, not on every raw metric blip'],
            commonMistakes: ['Treating SLA and SLO as the same thing', 'Choosing SLIs that look good but do not reflect user experience', 'Setting 100% targets \u2014 leaving no error budget and guaranteeing failure', 'Defining SLOs but never wiring them into alerting or release decisions'],
            interviewTip: 'Show the nesting: SLI (measure) \u2192 SLO (internal target) \u2192 SLA (external promise), with error budget = 100% \u2212 SLO. Mentioning error-budget-driven release policy signals SRE maturity.',
            followUp: ['What is an error budget and how do you use it?', 'How would you pick SLIs for a checkout API?', 'What is burn-rate alerting?'],
            seniorPerspective: 'I tie deployment freezes to error-budget burn: if we are spending the budget too fast, feature work pauses for reliability. That turns reliability from a vague goal into a concrete, data-driven decision.',
            architectPerspective: 'SLIs/SLOs are the contract between reliability and velocity. Designing them per critical user journey \u2014 not per server \u2014 keeps engineering focused on user-perceived health and gives leadership an objective lever for trade-offs.'
        },
        {
            question: 'What does Azure Front Door provide, and how does it differ from a regional Load Balancer or Application Gateway?',
            difficulty: 'medium',
            answer: `<p><strong>Azure Front Door</strong> is a <em>global</em>, layer-7 entry point: latency-based routing to the nearest healthy region, TLS termination at edge PoPs, WAF, CDN-style caching, and automatic regional failover. <strong>Application Gateway</strong> is a <em>regional</em> layer-7 load balancer (WAF, path/host routing, TLS) within one region. <strong>Azure Load Balancer</strong> is a <em>regional</em> layer-4 (TCP/UDP) distributor with no HTTP awareness.</p>
            <p>They compose: Front Door routes globally to a regional Application Gateway, which balances across backends, optionally fronting a layer-4 Load Balancer for VM pools.</p>`,
            bestPractices: ['Use Front Door for global, multi-region HTTP entry and failover', 'Use Application Gateway for regional L7 routing/WAF within a region', 'Use Load Balancer for L4 / non-HTTP traffic and internal VM pools', 'Terminate TLS at the edge and offload WAF to reduce backend load'],
            commonMistakes: ['Using a regional Load Balancer where global routing/failover is needed', 'Duplicating WAF at every layer instead of placing it where it adds value', 'Confusing L4 (Load Balancer) with L7 (App Gateway/Front Door) capabilities', 'No health probes, so traffic keeps hitting unhealthy backends'],
            interviewTip: 'Sort by scope and layer: Front Door = global L7, Application Gateway = regional L7, Load Balancer = regional L4. Then show how they stack in a real topology.',
            followUp: ['How does Front Door perform regional failover?', 'Where would you place the WAF in this stack?', 'When is Traffic Manager a better fit than Front Door?'],
            seniorPerspective: 'For multi-region apps I put Front Door at the edge for global routing/WAF/caching and an Application Gateway per region for internal L7 routing. That separation keeps global concerns and regional concerns cleanly layered.',
            architectPerspective: 'Choosing the right tier per layer determines latency, availability, and blast radius. Global vs regional and L4 vs L7 are the two axes; getting them right yields graceful regional failover and edge offload without over-building.'
        },
        {
            question: 'What are the four golden signals, and how would you alert on them?',
            difficulty: 'medium',
            answer: `<p>The <strong>four golden signals</strong> (from Google SRE) are: <strong>Latency</strong> (how long requests take, split success vs error), <strong>Traffic</strong> (demand, e.g., RPS), <strong>Errors</strong> (failed request rate), and <strong>Saturation</strong> (how full the system is \u2014 CPU, memory, queue depth, connection pools).</p>
            <p>Alert on user-facing symptoms: page on high error rate or p95/p99 latency breaching the SLO, and on saturation approaching limits (with lead time). Use traffic mainly for context and capacity planning rather than as a paging signal on its own.</p>`,
            bestPractices: ['Alert on symptoms (latency, errors) over causes (CPU) for user-facing pages', 'Track latency at percentiles (p95/p99), not averages', 'Alert on saturation before exhaustion so you have time to react', 'Tie thresholds to SLOs/burn rate to avoid arbitrary numbers'],
            commonMistakes: ['Only monitoring infrastructure metrics and missing user-facing errors', 'Averaging latency, which hides tail latency that users actually feel', 'Alert fatigue from paging on every metric instead of golden-signal symptoms', 'No saturation alerts, so capacity issues surface as outages'],
            interviewTip: 'Name all four (Latency, Traffic, Errors, Saturation) and stress percentile latency + symptom-based alerting. Connecting them to SLO burn rate shows depth.',
            followUp: ['Why percentiles instead of averages for latency?', 'How do golden signals map to a queue-based worker?', 'How do you reduce alert fatigue?'],
            seniorPerspective: 'I build every service dashboard around the four signals and page only on error rate and tail latency against the SLO. Saturation gets early-warning alerts; traffic is context. That keeps the on-call signal-to-noise high.',
            architectPerspective: 'The golden signals give a uniform observability contract across heterogeneous services. Standardizing on them makes dashboards, alerts, and incident response consistent and portable across the whole platform.'
        },
        {
            question: 'How does sampling work in Application Insights, and how do you keep telemetry costs down without losing diagnostic value?',
            difficulty: 'hard',
            answer: `<p>Application Insights bills largely on ingested data volume, so high-traffic apps must reduce telemetry without going blind. The main lever is <strong>sampling</strong>:</p>
            <ul>
                <li><strong>Adaptive sampling</strong> (default in the SDK) \u2014 automatically varies the sampled percentage to hit a target items/second, dialing down under load.</li>
                <li><strong>Fixed-rate sampling</strong> \u2014 a constant percentage, useful when you want predictable volume across services.</li>
                <li><strong>Ingestion sampling</strong> \u2014 applied service-side at ingestion when SDK sampling is not configured.</li>
            </ul>
            <p>Crucially, sampling is <strong>correlation-aware</strong>: it keeps or drops an entire operation (request + its dependencies + traces + exceptions) together, so a sampled trace is still complete end-to-end. <code>itemCount</code> lets metrics be statistically re-inflated so rates stay accurate. Preserve fidelity by excluding exceptions/failures from sampling and using KQL on the retained data.</p>`,
            code: `// Tune adaptive sampling and protect failures from being sampled out
builder.Services.Configure<TelemetryConfiguration>(config =>
{
    var processor = config.DefaultTelemetrySink.TelemetryProcessorChainBuilder;
    processor.UseAdaptiveSampling(
        maxTelemetryItemsPerSecond: 5,
        excludedTypes: "Exception;Event"); // never sample out exceptions
    processor.Build();
});

// KQL: failed dependencies in the last hour, accounting for sampling
// dependencies
// | where timestamp > ago(1h) and success == false
// | summarize failures = sum(itemCount) by name, resultCode
// | order by failures desc`,
            language: 'csharp',
            bestPractices: ['Exclude exceptions and key custom events from sampling so failures are never dropped', 'Use adaptive sampling for spiky traffic, fixed-rate when you need predictable volume', 'Rely on itemCount when aggregating in KQL so sampled metrics stay statistically correct', 'Set data caps/alerts on the Application Insights resource to avoid bill surprises'],
            commonMistakes: ['Disabling sampling on high-traffic apps and getting a huge ingestion bill', 'Sampling out exceptions, then being unable to diagnose the very failures you care about', 'Counting rows in KQL instead of summing itemCount, undercounting sampled events', 'Assuming sampling breaks traces \u2014 it actually keeps whole operations intact'],
            interviewTip: 'The key insight interviewers probe: sampling is correlation-aware (whole operations kept/dropped together) and itemCount restores metric accuracy. Mention excluding exceptions from sampling to show you balance cost against diagnosability.',
            followUp: ['Why is itemCount important when querying sampled data?', 'When would you choose fixed-rate over adaptive sampling?', 'How do you stop a cost runaway from a noisy service?'],
            seniorPerspective: 'I leave adaptive sampling on but exclude exceptions and critical business events, and I always aggregate with itemCount in KQL. The classic mistake is a team disabling sampling for "complete data", then getting a five-figure ingestion bill and still missing the failed traces.',
            architectPerspective: 'Observability has a cost curve, and sampling is how you stay on the useful part of it. Designing what is always-kept (failures, key events) versus statistically sampled (successful high-volume traffic) is a deliberate trade-off between diagnostic fidelity and spend at scale.'
        },
        {
            question: 'How would you structure VNets, subnets, NSGs, and peering for a production Azure workload?',
            difficulty: 'medium',
            answer: `<p>A <strong>VNet</strong> is an isolated private network; <strong>subnets</strong> segment it by tier (app, data, gateway, management). <strong>Network Security Groups (NSGs)</strong> are stateful allow/deny rules applied at subnet or NIC level \u2014 run default-deny and explicitly allow only required flows (e.g., app subnet to data subnet on 1433). <strong>VNet peering</strong> privately connects VNets (cross-region, cross-subscription) over the Microsoft backbone.</p>
            <p>The common production topology is <strong>hub-and-spoke</strong>: a hub VNet hosts shared services (firewall/Azure Firewall, VPN/ExpressRoute gateway, Bastion, DNS), and per-app/per-environment spoke VNets peer to the hub. This centralizes egress, inspection, and connectivity while isolating workloads. Pair it with Private Endpoints so PaaS data services are reachable only from inside the VNet.</p>`,
            bestPractices: ['Segment by tier and apply default-deny NSGs with explicit, minimal allow rules', 'Use a hub-and-spoke topology to centralize firewall, gateway, DNS, and Bastion', 'Reach PaaS data services via Private Endpoints, not public IPs', 'Plan non-overlapping address spaces up front so peering and on-prem links work cleanly'],
            commonMistakes: ['Flat VNets with permissive NSGs, giving lateral movement after any breach', 'Overlapping CIDR ranges that block peering or VPN/ExpressRoute connectivity', 'Exposing management (RDP/SSH) publicly instead of using Bastion', 'Forgetting that peering is non-transitive \u2014 spoke-to-spoke needs the hub or a route'],
            interviewTip: 'Walk the layers app-side to data-side: VNet -> subnets per tier -> NSGs (default-deny) -> peering -> hub-and-spoke. Calling out that peering is non-transitive and that management access goes through Bastion shows hands-on experience.',
            followUp: ['Why is VNet peering non-transitive and how do you route spoke-to-spoke?', 'Where does Azure Firewall sit in hub-and-spoke?', 'How do Private Endpoints change your DNS design?'],
            seniorPerspective: 'I treat the hub-and-spoke landing zone and non-overlapping address planning as day-one decisions \u2014 retrofitting CIDR ranges or transitive routing later is painful. Bastion plus default-deny NSGs kills the most common lateral-movement paths.',
            architectPerspective: 'Network topology is a security and connectivity contract. Hub-and-spoke centralizes inspection and egress while isolating blast radius per spoke, and combined with Private Endpoints and NSG segmentation it realizes zero-trust at the network layer rather than relying on identity alone.'
        }
    ,
        {
            question: 'Compare Azure Front Door, Application Gateway, and Traffic Manager. When do you use each (and together)?',
            difficulty: 'hard',
            answer: `<p>They operate at different layers and scopes:</p>
            <ul>
                <li><strong>Traffic Manager</strong> \u2014 <em>DNS-based</em> global routing (priority, weighted, geographic, performance). It resolves names to endpoints; it does not see HTTP and does not proxy traffic. Failover is bounded by DNS TTL.</li>
                <li><strong>Front Door</strong> \u2014 global <em>layer-7</em> reverse proxy at the edge: latency-based routing, TLS termination, WAF, caching, and fast health-probe failover. Best global HTTP entry point.</li>
                <li><strong>Application Gateway</strong> \u2014 <em>regional</em> layer-7 load balancer: path/host routing, WAF, TLS, session affinity within one region.</li>
            </ul>
            <p>They compose: Front Door (global edge + WAF) routes to a regional Application Gateway (internal L7 routing) in front of your backends; Traffic Manager is used when you need DNS-level routing across non-HTTP or multi-service endpoints.</p>`,
            explanation: 'Traffic Manager is the phone directory that tells you which office to call (DNS); Front Door is the global front desk that actually takes your request, screens it, and forwards it; Application Gateway is the local-floor receptionist routing you to the right room within one building.',
            bestPractices: ['Use Front Door for global HTTP entry with WAF, caching, and fast failover', 'Use Application Gateway for regional L7 routing/WAF inside a region', 'Use Traffic Manager for DNS-level routing (non-HTTP or coarse global routing)', 'Compose Front Door \u2192 regional App Gateway \u2192 backends for global apps'],
            commonMistakes: ['Expecting Traffic Manager to fail over instantly (it is bounded by DNS TTL)', 'Using a regional Application Gateway where global routing/failover is required', 'Duplicating WAF at every layer instead of placing it at the edge', 'Confusing DNS routing (Traffic Manager) with L7 proxying (Front Door)'],
            interviewTip: 'Anchor on layer + scope: Traffic Manager = DNS/global, Front Door = L7/global edge, App Gateway = L7/regional. The "DNS TTL bounds Traffic Manager failover" point is a strong differentiator.',
            followUp: ['Why is Front Door failover faster than Traffic Manager?', 'Where should the WAF live in this stack?', 'When is Traffic Manager still the right choice?'],
            seniorPerspective: 'I default to Front Door for global HTTP because DNS-based failover via Traffic Manager is at the mercy of resolver TTL caching \u2014 fine for coarse routing, too slow for tight failover SLAs. Traffic Manager earns its place for non-HTTP or multi-service DNS routing.',
            architectPerspective: 'Choosing the right tier per layer (global L7 edge, regional L7, DNS) determines latency, failover speed, and where security/caching live. Getting it wrong shows up as slow failover or a WAF in the wrong place; the composed Front Door + App Gateway topology is the standard global pattern.'
        },
        {
            question: 'What does Azure API Management provide, and when do you put it in front of your APIs?',
            difficulty: 'medium',
            answer: `<p><strong>Azure API Management (APIM)</strong> is a managed API gateway + developer portal that centralizes cross-cutting API concerns: <strong>request routing</strong>, <strong>authentication</strong> (validate JWT/keys/OAuth), <strong>rate limiting/quotas</strong>, <strong>caching</strong>, <strong>transformation</strong> (rewrite headers/bodies, version mapping), and <strong>observability</strong>. Behavior is configured via <em>policies</em> (inbound/outbound/backend pipeline) without changing backend code.</p>
            <p>Use it when you expose APIs to multiple consumers (partners, mobile, third parties), need consistent auth/throttling/analytics across many backends, want a published catalog/portal, or need to decouple public contracts from internal services and version them at the edge.</p>`,
            explanation: 'APIM is the front desk for all your APIs: it checks credentials, enforces how often each visitor can knock, logs who came in, and can reshape requests \u2014 so each backend team does not re-implement the same door security.',
            bestPractices: ['Centralize auth, rate limiting, and analytics in APIM policies rather than per-service', 'Use products/subscriptions to manage consumer access and quotas', 'Cache idempotent GETs at the gateway to offload backends', 'Use APIM to version and shape the public contract independently of internal services'],
            commonMistakes: ['Putting business logic in APIM policies (it is a gateway, not your app)', 'Exposing every internal service directly without a curated public contract', 'Ignoring APIM as a potential bottleneck/SPOF without scaling/redundancy', 'Duplicating auth in every backend instead of validating once at the gateway'],
            interviewTip: 'Frame APIM as the policy/edge layer for many APIs and consumers \u2014 auth, throttling, transformation, analytics via policies. Distinguish it from a load balancer (APIM is API-aware, with a portal and subscriptions).',
            followUp: ['How do APIM policies (inbound/outbound) work?', 'How does APIM relate to Front Door?', 'How do you prevent APIM from becoming a bottleneck?'],
            seniorPerspective: 'I reach for APIM when there are multiple consumers and multiple backends \u2014 it stops every team from re-solving auth, throttling, and analytics. For a single internal API it is usually overkill; a gateway in the app or Front Door suffices.',
            architectPerspective: 'APIM decouples the stable public API contract from volatile internal services, which is the same gateway/BFF principle applied as managed infrastructure. It centralizes governance (security, quotas, versioning) so the internal mesh can evolve without breaking external consumers.'
        }
    ],
    extraSections: [
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>No Application Insights instrumentation</strong>: Deploying without telemetry means you can't diagnose production issues. Always instrument from day 1.</li>
                <li><strong>Alert on every metric</strong>: Alert fatigue from noisy thresholds. Alert on symptoms (SLO breach), not causes (CPU spike).</li>
                <li><strong>Ignoring distributed tracing</strong>: Logs alone can't trace a request across microservices. Use correlation IDs and App Insights dependency tracking.</li>
                <li><strong>No custom metrics</strong>: Out-of-box metrics miss business signals (orders/sec, auth failures). Track what matters to the business.</li>
                <li><strong>Front Door without health probes</strong>: Traffic routed to unhealthy backends. Always configure health endpoints.</li>
                <li><strong>VNet without NSGs</strong>: Flat network where all resources can talk to each other. Apply network security groups for micro-segmentation.</li>
                <li><strong>Public endpoints on internal services</strong>: Use Private Endpoints + VNet integration. Don't expose internal APIs to the internet.</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Application Insights: APM with auto-instrumentation, dependency tracking, distributed tracing, and smart alerts</li>
                <li>Azure Monitor: Platform metrics, log analytics (KQL), alerting, dashboards, and workbooks</li>
                <li>Front Door: Global L7 load balancer + CDN + WAF + SSL offload. For multi-region apps with global users.</li>
                <li>Application Gateway: Regional L7 load balancer + WAF. For single-region apps needing URL-based routing.</li>
                <li>Azure Load Balancer: L4 (TCP/UDP) load balancing. No SSL, no URL routing — just fast TCP distribution.</li>
                <li>VNet + Private Endpoints: Keep services off the public internet. Access PaaS services over private IP.</li>
                <li>API Management: Centralized gateway for APIs — auth, throttling, transformation, developer portal.</li>
            </ul>`
        }
    ]
});
