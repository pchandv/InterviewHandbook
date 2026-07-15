/* ═══════════════════════════════════════════════════════════════════
   AWS — Compute & Serverless: EC2, Lambda, ECS, EKS, Fargate
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('aws-compute', {
    title: 'AWS Compute & Serverless',
    description: 'EC2 instances, Lambda functions, ECS/EKS container orchestration, Fargate serverless containers, and choosing the right compute service for your workload.',
    sections: [
        {
            title: 'AWS Compute Options',
            content: `<p>AWS provides compute at every abstraction level — from raw VMs to fully managed serverless. The choice depends on control needs, scaling patterns, and operational capacity.</p>`,
            table: {
                headers: ['Service', 'What It Is', 'Scaling', 'Best For'],
                rows: [
                    ['EC2', 'Virtual machines (full OS control)', 'Auto Scaling Groups', 'Legacy apps, custom OS/network, GPU workloads'],
                    ['Lambda', 'Serverless functions (event-driven)', '0 to thousands concurrently', 'Event handlers, APIs, glue code, short tasks (<15 min)'],
                    ['ECS', 'Container orchestration (AWS-native)', 'Service auto-scaling', 'Docker workloads without K8s complexity'],
                    ['EKS', 'Managed Kubernetes', 'HPA + Cluster Autoscaler', 'Teams with K8s expertise, multi-cloud portability'],
                    ['Fargate', 'Serverless containers (no EC2 management)', 'Per-task scaling', 'Containers without managing infrastructure'],
                    ['App Runner', 'Fully managed container hosting', 'Auto (based on traffic)', 'Simple web apps/APIs, minimal config']
                ]
            }
        },
        {
            title: 'AWS Lambda & Serverless Patterns',
            content: `<p>Lambda executes code in response to events without provisioning servers. Combined with API Gateway, SQS, S3, and DynamoDB, it enables fully serverless architectures.</p>`,
            code: `// Lambda function (.NET 8 minimal API style)
// Uses AWS Lambda Annotations for cleaner syntax
[LambdaFunction]
[HttpApi(LambdaHttpMethod.Get, "/api/users/{id}")]
public async Task<IHttpResult> GetUser(int id, IUserService service)
{
    var user = await service.GetByIdAsync(id);
    return user is not null ? HttpResults.Ok(user) : HttpResults.NotFound();
}

// Lambda triggered by SQS message:
[LambdaFunction]
[SQSEvent]
public async Task ProcessOrder(SQSEvent sqsEvent)
{
    foreach (var record in sqsEvent.Records)
    {
        var order = JsonSerializer.Deserialize<Order>(record.Body);
        await _orderService.ProcessAsync(order);
    }
}

// Lambda triggered by S3 upload:
[LambdaFunction]
public async Task ProcessUpload(S3Event s3Event)
{
    foreach (var record in s3Event.Records)
    {
        var bucket = record.S3.Bucket.Name;
        var key = record.S3.Object.Key;
        await _imageService.ResizeAsync(bucket, key);
    }
}

// Serverless architecture patterns:
// API Gateway → Lambda → DynamoDB (REST API)
// S3 Upload → Lambda → Rekognition → DynamoDB (image processing)
// SQS → Lambda → RDS (async processing with DB)
// EventBridge → Lambda → SNS (scheduled notifications)
// Step Functions → Lambda chain (workflow orchestration)

// Cold start mitigation:
// - Provisioned concurrency (keep N instances warm)
// - Smaller deployment package (trim dependencies)
// - .NET 8 Native AOT (200ms → 50ms cold start)
// - SnapStart (Java-specific, snapshot-based)`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'When would you choose Lambda vs ECS/Fargate vs EKS?',
            difficulty: 'medium',
            answer: `<p>Choose <strong>Lambda</strong> for event-driven, short-lived tasks (< 15 min) with sporadic traffic. Choose <strong>ECS/Fargate</strong> for containerized services needing more control (longer running, larger memory, consistent traffic) without K8s complexity. Choose <strong>EKS</strong> when your team has Kubernetes expertise and needs portability or advanced orchestration features.</p>`,
            bestPractices: ['Use Lambda for glue code, event processing, and APIs with sporadic traffic', 'Use Fargate for containers when you do not want to manage EC2 instances', 'Use EKS only if you need K8s features (service mesh, custom operators, multi-cloud)', 'Consider cold start latency for user-facing Lambda functions (use provisioned concurrency)'],
            commonMistakes: ['Using Lambda for long-running processes (15-min hard timeout)', 'Choosing EKS without K8s operational expertise (steep learning curve)', 'Running ECS on EC2 when Fargate would be simpler (unnecessary infra management)', 'Not considering cost: Lambda is cheap for sporadic, expensive for constant high traffic'],
            interviewTip: 'Frame as a control vs convenience spectrum: EC2 (full control) → EKS (K8s control) → ECS/Fargate (container convenience) → Lambda (zero infra). Each step trades control for reduced operational burden.',
            followUp: ['What is Lambda cold start and how do you mitigate it?', 'How does Fargate pricing compare to EC2?', 'What are Step Functions?'],
            seniorPerspective: 'My default: Lambda for event handlers and simple APIs, Fargate for containerized services. I only reach for EKS when the team already has K8s skills or we need features like service mesh, custom controllers, or multi-cloud portability.',
            architectPerspective: 'The compute choice reflects organizational maturity. Startups benefit from Lambda (zero ops). Scale-ups move to Fargate/ECS (need more control, predictable costs). Enterprises use EKS (platform team manages K8s, product teams deploy via Helm). Match compute abstraction to team operational capability.'
        }
    ,
        {
            question: 'What is a Lambda cold start, and how do you mitigate it?',
            difficulty: 'medium',
            answer: `<p>A <strong>cold start</strong> happens when AWS must initialize a new execution environment for a Lambda invocation: it downloads your code, starts the runtime, and runs initialization code before handling the request. This adds latency (tens of milliseconds to several seconds depending on runtime and package size). <strong>Warm</strong> invocations reuse an existing environment and skip this cost.</p>
            <p>Mitigations: <strong>Provisioned Concurrency</strong> keeps N environments initialized and ready; trim the deployment package and dependencies; move heavy work out of the init path; use <strong>.NET Native AOT</strong> or <strong>SnapStart</strong> (Java) to cut initialization time; and keep functions small and single-purpose.</p>`,
            bestPractices: ['Use Provisioned Concurrency for latency-sensitive, user-facing functions', 'Initialize SDK clients and connections once outside the handler so warm invocations reuse them', 'Keep deployment packages small \u2014 trim unused dependencies and tree-shake', 'Prefer faster-starting runtimes/options (Node, Python, .NET Native AOT) for latency-critical paths'],
            commonMistakes: ['Creating database/SDK clients inside the handler on every invocation', 'Ignoring cold starts for synchronous, user-facing APIs', 'Over-provisioning concurrency and paying for idle capacity', 'Packaging the entire SDK instead of only the modules used'],
            interviewTip: 'Separate the two phases clearly \u2014 init (billed differently, where cold start lives) vs invoke. Mention that connection setup belongs in init so warm calls reuse it.',
            followUp: ['How is Provisioned Concurrency priced vs on-demand?', 'Where should you create a database connection in a Lambda function?', 'How does VPC attachment affect cold starts?'],
            seniorPerspective: 'For a checkout API I keep a small Provisioned Concurrency floor sized to p50 traffic and let on-demand absorb spikes. The bigger win is usually moving connection pooling and config loading into the init phase so warm invocations are sub-10ms.',
            architectPerspective: 'Cold start tolerance often decides whether Lambda fits at all. Event-driven and async workloads tolerate it; tight-SLA synchronous APIs may justify Fargate with always-on tasks. The decision is an SLA and cost question, not just a runtime preference.'
        },
        {
            question: 'How does EC2 Auto Scaling work, and how do target-tracking, step, and scheduled policies differ?',
            difficulty: 'medium',
            answer: `<p>An <strong>Auto Scaling Group (ASG)</strong> maintains a desired number of EC2 instances between a min and max, launching from a launch template and replacing unhealthy instances. Scaling policies decide when to change capacity.</p>
            <ul>
                <li><strong>Target tracking</strong> \u2014 keep a metric at a target (e.g., average CPU at 50%); AWS computes the adjustment. Simplest and most common.</li>
                <li><strong>Step scaling</strong> \u2014 add/remove capacity in defined steps based on alarm breach size (e.g., +1 at 60% CPU, +3 at 80%).</li>
                <li><strong>Scheduled scaling</strong> \u2014 change capacity at known times (e.g., scale up before business hours).</li>
            </ul>`,
            bestPractices: ['Start with target tracking \u2014 it self-tunes and covers most cases', 'Combine scheduled scaling with dynamic policies for predictable daily peaks', 'Spread instances across multiple Availability Zones for resilience', 'Use health checks + connection draining so scale-in does not drop in-flight requests'],
            commonMistakes: ['Scaling on CPU when the real bottleneck is queue depth or latency', 'Setting cooldowns too short, causing thrashing (rapid scale up/down)', 'No headroom \u2014 scaling only after saturation, so users feel the lag', 'Single-AZ deployments that lose capacity when an AZ degrades'],
            interviewTip: 'Pick the scaling metric that reflects user pain (latency, queue length) rather than a proxy like CPU when they diverge. Mention warm-up time so new instances are not counted before they are ready.',
            followUp: ['What metric would you scale a queue-worker fleet on?', 'How do predictive scaling and warm pools help?', 'How does scale-in protection work?'],
            seniorPerspective: 'I scale worker fleets on SQS backlog-per-instance rather than CPU \u2014 it maps directly to how far behind we are. For web tiers, target tracking on request latency or RPS-per-instance beats CPU when work is I/O bound.',
            architectPerspective: 'Auto Scaling is the elasticity contract of the system. The hard part is choosing a metric that is a true demand signal and giving instances enough warm-up lead time that capacity arrives before saturation, not after.'
        },
        {
            question: 'Explain Lambda pricing and when serverless becomes more expensive than always-on compute.',
            difficulty: 'hard',
            answer: `<p>Lambda bills per <strong>request</strong> plus <strong>GB-seconds</strong> (memory allocated \u00d7 execution duration), with CPU scaling proportionally to memory. There are no charges when idle. This is extremely cheap for sporadic or spiky workloads.</p>
            <p>It becomes more expensive than always-on EC2/Fargate when traffic is <strong>high and sustained</strong>: a function running near-continuously pays GB-seconds the whole time, often exceeding the cost of a right-sized reserved instance. The crossover depends on utilization \u2014 below it, serverless wins on cost and ops; above it, provisioned compute is cheaper per unit of work.</p>`,
            bestPractices: ['Tune memory \u2014 more memory means more CPU, so a higher tier can finish faster and cost less overall', 'Model cost at expected peak sustained RPS, not just average', 'Use Lambda for spiky/sporadic traffic; move steady high-throughput paths to Fargate/EC2', 'Watch for hidden costs: data transfer, NAT gateways, and downstream service calls'],
            commonMistakes: ['Assuming serverless is always cheaper \u2014 it is not for constant high load', 'Setting memory too low, increasing duration and total GB-seconds', 'Ignoring per-request cost for very high-volume, tiny invocations', 'Forgetting Provisioned Concurrency adds an always-on charge'],
            interviewTip: 'Frame it as utilization-driven: serverless trades a higher per-unit cost for zero idle cost. Show you would actually model the crossover with real numbers rather than assert a rule of thumb.',
            followUp: ['How does increasing memory sometimes lower total cost?', 'How would you estimate the EC2-vs-Lambda crossover point?', 'What non-cost factors might keep you on Lambda past the crossover?'],
            seniorPerspective: 'I have migrated steady high-volume Lambda workloads to Fargate once they ran near-continuously \u2014 the GB-seconds bill dwarfed a reserved fleet. Conversely I keep bursty endpoints on Lambda even slightly past breakeven because the operational savings are worth it.',
            architectPerspective: 'Cost architecture mirrors traffic shape. Serverless optimizes for variance and operational simplicity; provisioned compute optimizes for steady, predictable throughput. Mature platforms often run both and route workloads by their utilization profile.'
        },
        {
            question: 'Compare ECS and EKS, and explain the Fargate versus EC2 launch type trade-off.',
            difficulty: 'hard',
            answer: `<p><strong>ECS</strong> is AWS-native container orchestration: simpler, tightly integrated with IAM/ALB/CloudWatch, no control plane to learn or pay for. <strong>EKS</strong> is managed Kubernetes: portable manifests, a huge ecosystem (Helm, operators, service mesh), and multi-cloud skills \u2014 but it carries Kubernetes complexity and a per-cluster control-plane charge.</p>
            <p>Both can run on two <strong>launch types</strong>. <strong>Fargate</strong> is serverless: you specify CPU/memory per task and AWS runs it \u2014 no node patching or capacity planning, billed per task, ideal for variable or bursty workloads. <strong>EC2</strong> launch type means you manage the node fleet: more control (GPUs, specific instance types, DaemonSets, bin-packing for density), Spot for big savings, and lower per-unit cost at steady high utilization \u2014 at the price of patching and scaling the nodes.</p>`,
            bestPractices: ['Choose ECS for AWS-only shops wanting simplicity; EKS when you need K8s portability/ecosystem', 'Default to Fargate to avoid node ops; move to EC2 launch type when cost, GPUs, or bin-packing demand it', 'Use EC2 Spot (via capacity providers) for fault-tolerant, interruptible workloads to cut cost', 'Right-size Fargate task CPU/memory \u2014 you pay for the requested size whether used or not'],
            commonMistakes: ['Adopting EKS without Kubernetes expertise and drowning in operational overhead', 'Running everything on EC2 launch type and re-inventing the node management Fargate removes', 'Using Fargate for large steady fleets where EC2 + Spot/Reserved would be far cheaper', 'Ignoring the EKS control-plane cost per cluster when running many small clusters'],
            interviewTip: 'Separate two axes: orchestrator (ECS vs EKS = simplicity vs portability) and launch type (Fargate vs EC2 = no-ops vs control/cost). Interviewers want to see you do not conflate them \u2014 you can run Fargate on either ECS or EKS.',
            followUp: ['When does the EKS control-plane cost justify itself?', 'How do capacity providers mix Fargate and EC2/Spot?', 'What workloads force the EC2 launch type?'],
            seniorPerspective: 'I default to ECS on Fargate for most services \u2014 it removes node patching entirely. I move to the EC2 launch type only for cost-sensitive steady fleets (Spot bin-packing) or GPU/DaemonSet needs, and to EKS when the org has standardized on Kubernetes tooling.',
            architectPerspective: 'The orchestrator choice is about ecosystem and team skills; the launch type is about who owns capacity. Picking Fargate by default keeps teams shipping containers without running infrastructure, while EC2 stays available as a deliberate cost/control optimization, not the starting point.'
        },
        {
            question: 'Explain the EC2 purchasing options (On-Demand, Reserved, Savings Plans, Spot) and when to use each.',
            difficulty: 'medium',
            answer: `<p>EC2 offers several pricing models that trade flexibility for cost:</p>
            <ul>
                <li><strong>On-Demand</strong> \u2014 pay per second, no commitment. Most flexible, most expensive. Use for unpredictable, short-lived, or dev/test workloads.</li>
                <li><strong>Reserved Instances</strong> \u2014 1- or 3-year commitment to a specific instance family/region for up to ~72% off. Use for steady, well-known baseline capacity.</li>
                <li><strong>Savings Plans</strong> \u2014 commit to a dollars-per-hour spend (Compute Savings Plans span instance families, regions, and even Fargate/Lambda) for similar discounts with more flexibility than RIs.</li>
                <li><strong>Spot</strong> \u2014 spare capacity at up to ~90% off, but AWS can reclaim it with a 2-minute warning. Use for fault-tolerant, interruptible, stateless work (batch, CI, big-data, flexible web tiers).</li>
            </ul>
            <p>The common strategy: cover steady baseline with Savings Plans/RIs, absorb spikes with On-Demand, and run interruptible workloads on Spot.</p>`,
            bestPractices: ['Cover predictable baseline load with Savings Plans or Reserved Instances', 'Prefer Compute Savings Plans for flexibility across families/regions and Fargate/Lambda', 'Use Spot for stateless, retry-safe, interruptible workloads and handle the 2-minute notice', 'Keep On-Demand for unpredictable bursts and short-lived experiments'],
            commonMistakes: ['Running 24/7 baseline on On-Demand and overpaying massively', 'Putting stateful or non-interruptible workloads on Spot and losing work on reclaim', 'Buying rigid standard RIs when Savings Plans would have given needed flexibility', 'Over-committing to RIs/Savings Plans beyond actual sustained usage'],
            interviewTip: 'Anchor each option to commitment vs flexibility vs interruptibility, then describe the layered strategy (Savings Plans for baseline + On-Demand for burst + Spot for interruptible). Mention the 2-minute Spot interruption notice as the key constraint.',
            followUp: ['How do Savings Plans differ from Reserved Instances in flexibility?', 'How do you architect a workload to survive Spot interruptions?', 'How do Spot capacity pools affect reliability?'],
            seniorPerspective: 'I model the always-on baseline and cover it with Compute Savings Plans, let On-Demand handle the unpredictable top, and push CI, batch, and stateless web capacity onto Spot with graceful drain on the interruption notice. That layering routinely cuts compute spend in half.',
            architectPerspective: 'Purchasing strategy is an architectural concern, not just finance. Designing workloads to be interruption-tolerant unlocks Spot economics, and committing only to the proven steady baseline keeps the discount without locking the platform into capacity it may outgrow.'
        }
    ,
        {
            question: 'Explain AWS IAM roles, policies, and STS/assume-role. How do you grant least-privilege access to a service?',
            difficulty: 'hard',
            answer: `<p><strong>IAM policies</strong> are JSON documents granting/denying actions on resources (with conditions). They attach to <strong>identities</strong> (users, groups, roles). A <strong>role</strong> is an identity with policies but <em>no long-term credentials</em> \u2014 it is <em>assumed</em> to get temporary credentials via <strong>STS</strong> (<code>AssumeRole</code>), which is the foundation of secure AWS access.</p>
            <ul>
                <li><strong>Service access</strong> \u2014 attach a role to the compute (EC2 instance profile, ECS task role, Lambda execution role); the SDK fetches temporary creds automatically. No stored keys.</li>
                <li><strong>Cross-account</strong> \u2014 a role in account B trusts account A; A assumes it for temporary, scoped access.</li>
                <li><strong>Least privilege</strong> \u2014 grant only the specific actions/resources needed, use conditions, and prefer roles over IAM users with access keys.</li>
            </ul>`,
            explanation: 'A role is a uniform hanging on the wall, not a person. A service "puts on" the uniform (assume-role) and gets a temporary badge (STS credentials) that expires \u2014 far safer than carrying a permanent key that could be copied.',
            code: `// Lambda execution role policy: least privilege \u2014 only what it needs
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["dynamodb:GetItem", "dynamodb:PutItem"],
    "Resource": "arn:aws:dynamodb:us-east-1:111:table/Orders"
  }]
}
// The function assumes this role automatically \u2014 no access keys in code.
// Cross-account: role trust policy allows account A's principal to sts:AssumeRole.`,
            language: 'json',
            bestPractices: ['Use roles + STS temporary credentials, never long-lived IAM user access keys in apps', 'Attach roles to compute (instance profile / task role / Lambda role)', 'Scope policies to specific actions and resource ARNs with conditions', 'Use cross-account roles instead of sharing credentials between accounts'],
            commonMistakes: ['Embedding IAM user access keys in code/config instead of using roles', 'Over-broad policies (Action:* / Resource:*) "to make it work"', 'Not using conditions to constrain access (source IP, MFA, tags)', 'Confusing identity-based policies with resource-based policies (e.g., S3 bucket policy)'],
            interviewTip: 'Center the answer on roles + STS temporary credentials = the secure pattern (no stored keys), then least privilege via scoped actions/resources. The role-vs-user distinction is the key signal.',
            followUp: ['What is the difference between an identity-based and a resource-based policy?', 'How does cross-account assume-role work?', 'How is this analogous to Azure Managed Identity?'],
            seniorPerspective: 'I treat any long-lived IAM access key in an application as an incident waiting to happen \u2014 roles with STS temporary credentials remove the secret entirely, the same philosophy as Azure Managed Identity. Least privilege then comes from scoping actions and resource ARNs, not blanket grants.',
            architectPerspective: 'IAM is the authorization backbone of AWS; getting roles, trust relationships, and least privilege right is foundational zero-trust. I design account/role boundaries early because retrofitting least privilege onto an over-permissioned estate is painful and risky.'
        },
        {
            question: 'Explain AWS VPC fundamentals: subnets, route tables, security groups vs NACLs, and how traffic reaches the internet.',
            difficulty: 'hard',
            answer: `<p>A <strong>VPC</strong> is an isolated virtual network. Within it:</p>
            <ul>
                <li><strong>Subnets</strong> \u2014 segments tied to one Availability Zone; <em>public</em> (route to an Internet Gateway) vs <em>private</em> (no direct internet route).</li>
                <li><strong>Route tables</strong> \u2014 decide where subnet traffic goes (IGW for public; NAT Gateway for private outbound).</li>
                <li><strong>Internet Gateway / NAT Gateway</strong> \u2014 IGW gives public subnets inbound+outbound internet; NAT lets private subnets reach the internet outbound only (e.g., to pull updates) without being publicly reachable.</li>
                <li><strong>Security Groups</strong> \u2014 stateful, instance-level allow rules (return traffic auto-allowed).</li>
                <li><strong>NACLs</strong> \u2014 stateless, subnet-level allow/deny rules (must allow both directions explicitly).</li>
            </ul>`,
            explanation: 'The VPC is a private campus. Public subnets have a gate to the street (IGW); private subnets can send mail out through a PO box (NAT) but have no street entrance. Security groups are stateful door guards per building; NACLs are stateless checkpoints at the campus-section perimeter.',
            code: `// Typical 3-tier VPC layout
// Public subnet:   ALB / NAT Gateway        (route 0.0.0.0/0 -> IGW)
// Private subnet:  app servers / ECS tasks  (route 0.0.0.0/0 -> NAT)
// Private subnet:  RDS / ElastiCache        (no internet route)
// Security Group (stateful): allow app SG -> db SG on 5432; return traffic auto-allowed
// NACL (stateless): coarse subnet allow/deny; must allow ephemeral return ports`,
            language: 'javascript',
            bestPractices: ['Put databases/app tiers in private subnets; expose only load balancers publicly', 'Use security groups as the primary control (stateful, instance-level)', 'Use NAT Gateways for private-subnet outbound; avoid giving them public IPs', 'Spread subnets across AZs for resilience; keep NACLs simple/coarse'],
            commonMistakes: ['Putting databases in public subnets', 'Confusing stateful security groups with stateless NACLs (forgetting return ports on NACLs)', 'Over-relying on NACLs for fine-grained control instead of security groups', 'Single-AZ subnets, losing resilience when an AZ degrades'],
            interviewTip: 'The crisp differentiators: public vs private subnet = route to IGW vs not; security group = stateful/instance, NACL = stateless/subnet; NAT = private outbound only. Stateful vs stateless is the most-asked distinction.',
            followUp: ['Why must NACLs allow ephemeral return ports but security groups do not?', 'When would you use a VPC endpoint instead of a NAT Gateway?', 'How does this compare to Azure VNet/NSG?'],
            seniorPerspective: 'I design the public/private subnet split and security-group chains first, and reach for VPC endpoints to keep traffic to AWS services (S3, DynamoDB) off the public internet entirely. NACLs I keep deliberately coarse \u2014 fine-grained rules belong in stateful security groups.',
            architectPerspective: 'The VPC topology is the network security foundation: least-exposure subnetting, stateful security groups, and private connectivity (endpoints) realize zero trust at the network layer. Getting it right early avoids painful re-architecture, since CIDR and subnet decisions are sticky.'
        },
        {
            question: 'What are AWS Step Functions, and when would you use them over orchestrating in Lambda code?',
            difficulty: 'advanced',
            answer: `<p><strong>Step Functions</strong> is a managed workflow/state-machine service: you define states (Task, Choice, Parallel, Map, Wait, Retry/Catch) in JSON/ASL, and AWS executes and tracks them durably. It orchestrates multi-step workflows \u2014 chaining Lambdas, calling AWS services directly, branching, parallelizing, and handling retries/error paths \u2014 without you writing orchestration glue.</p>
            <p>Use it over hand-rolled Lambda orchestration when workflows are <strong>multi-step, long-running, or need built-in retry/error handling, visibility, and state</strong>. A single Lambda calling others sequentially has no durable state, poor visibility, the 15-min limit, and bespoke retry logic. Step Functions gives durable execution history, visual flow, and built-in resilience.</p>`,
            explanation: 'Orchestrating in one Lambda is like one worker holding the whole recipe in their head and redoing it from scratch if interrupted. Step Functions is a written, tracked checklist a manager runs \u2014 it knows exactly which step is done, retries the failed one, and survives interruptions.',
            code: `// Amazon States Language (excerpt): retry + catch + branch
{
  "StartAt": "ValidateOrder",
  "States": {
    "ValidateOrder": { "Type": "Task", "Resource": "arn:...:ValidateFn",
      "Retry": [{ "ErrorEquals": ["States.TaskFailed"], "MaxAttempts": 3, "BackoffRate": 2 }],
      "Catch": [{ "ErrorEquals": ["States.ALL"], "Next": "NotifyFailure" }],
      "Next": "ChargePayment" },
    "ChargePayment": { "Type": "Task", "Resource": "arn:...:ChargeFn", "End": true },
    "NotifyFailure": { "Type": "Task", "Resource": "arn:...:NotifyFn", "End": true }
  }
}`,
            language: 'json',
            bestPractices: ['Use Step Functions for multi-step, long-running, or error-prone workflows', 'Lean on built-in Retry/Catch instead of hand-coding resilience in Lambdas', 'Use Express workflows for high-volume short flows, Standard for long/durable ones', 'Call AWS services directly from the state machine to avoid trivial glue Lambdas'],
            commonMistakes: ['Hand-orchestrating long workflows in one Lambda (15-min limit, no durable state)', 'Re-implementing retry/backoff logic that Step Functions provides natively', 'Using Standard workflows for ultra-high-volume short tasks (cost) or Express where durability is needed', 'No idempotency in tasks, so retries double-process'],
            interviewTip: 'Contrast durable, observable, retry-built-in orchestration (Step Functions) with brittle in-Lambda glue (no state, 15-min cap, custom retries). Mention Standard vs Express workflows to show depth.',
            followUp: ['What is the difference between Standard and Express workflows?', 'How does Step Functions handle retries and compensation (saga)?', 'How does this compare to Azure Durable Functions?'],
            seniorPerspective: 'When a workflow grows past two or three steps with branching and retries, I move it out of Lambda glue into Step Functions \u2014 the durable execution history alone pays for itself the first time you need to debug a stuck order. Tasks still must be idempotent because retries are automatic.',
            architectPerspective: 'Step Functions externalizes orchestration as declarative, observable state, which is the same value Durable Functions provides on Azure: workflow management without operating a workflow engine. It turns scattered, implicit coordination into an explicit, auditable state machine \u2014 ideal for sagas and long-running business processes.'
        }
    ],
    // Additional structured content
    additionalSections: [
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Monolithic Lambda</strong>: Cramming all logic into one Lambda (hard to debug, exceeds 15-min timeout for workflows). Split into single-purpose functions.</li>
                <li><strong>Not setting concurrency limits</strong>: Unbounded Lambda concurrency can overwhelm downstream databases. Use reserved concurrency.</li>
                <li><strong>Cold starts ignored</strong>: Latency-sensitive APIs on Lambda without provisioned concurrency suffer 1-5s cold starts.</li>
                <li><strong>Direct integration gaps</strong>: Using Lambda as glue between two AWS services when API Gateway/Step Functions can call the service directly.</li>
                <li><strong>ECS without auto-scaling</strong>: Fixed task count wastes money at low load and fails at peak. Use target tracking + step scaling.</li>
                <li><strong>EKS for simple workloads</strong>: Kubernetes overhead for 3 services is rarely justified. Consider ECS/Fargate or Lambda first.</li>
                <li><strong>No dead-letter queue</strong>: Failed async Lambda invocations silently discarded without DLQ/destination configuration.</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Lambda: event-driven, stateless, auto-scale to zero. Best for glue, APIs, event processing.</li>
                <li>Fargate: serverless containers — no EC2 management, per-second billing, right for steady workloads</li>
                <li>ECS on EC2: full control, GPU support, cost-effective for predictable high load with reserved instances</li>
                <li>EKS: Kubernetes when you need portability or complex orchestration. High operational overhead.</li>
                <li>Step Functions: durable workflow orchestration with built-in retry, timeout, and compensation (saga)</li>
                <li>Cold starts: mitigated by provisioned concurrency (Lambda), min tasks (Fargate), or always-on instances</li>
                <li>Decision framework: stateless + bursty → Lambda; steady + containerized → Fargate; complex orchestration → EKS</li>
            </ul>`
        }
    ]
});
