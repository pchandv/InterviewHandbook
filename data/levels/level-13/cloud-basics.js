/* ===================================================================
 CLOUD COMPUTING FUNDAMENTALS - Level 13: Cloud-Native Engineering
 IaaS/PaaS/SaaS/FaaS, service models, regions, HA, DR, scalability,
 CAPEX vs OPEX, shared responsibility, multi-cloud vs hybrid.
 =================================================================== */
'use strict';
PageData.register('cloud-basics', {
 title: 'Cloud Computing Fundamentals',
 level: 13,
 group: 'cloud-native',
 description: 'Master cloud service models, availability patterns, scalability strategies, and the economics that drive modern infrastructure decisions.',
 difficulty: 'intermediate',
 estimatedMinutes: 50,
 prerequisites: ['networking-fundamentals', 'arch-distributed'],
 sections: [
 {
 title: 'Introduction',
 content: '<p><strong>Cloud computing</strong> is the on-demand delivery of compute, storage, networking, and higher-level services over the internet with pay-as-you-go pricing. Rather than owning physical data centers, organizations rent capacity from providers like AWS, Azure, and GCP.</p><p>Understanding cloud fundamentals is non-negotiable for modern engineers. Whether you are designing a startup MVP or migrating an enterprise monolith, cloud fluency determines how quickly you can ship, scale, and recover from failure.</p><p>In this module you will learn:</p><ul><li>The four cloud service models (IaaS, PaaS, SaaS, FaaS) and when to use each</li><li>How regions and availability zones provide fault isolation</li><li>High availability vs disaster recovery and how to achieve both</li><li>Horizontal vs vertical scaling trade-offs</li><li>The economics of CAPEX vs OPEX and total cost of ownership</li><li>The shared responsibility model and its security implications</li><li>Multi-cloud and hybrid strategies with real-world rationale</li></ul>'
 },
 {
 title: 'Cloud Service Models (IaaS, PaaS, SaaS, FaaS)',
 content: '<p>Cloud providers offer services at different abstraction levels. Understanding where your responsibility ends and the provider\u2019s begins is crucial for architecture decisions.</p><h4>Infrastructure as a Service (IaaS)</h4><p>Raw compute, storage, and networking. You manage the OS, runtime, and application. Examples: AWS EC2, Azure VMs, GCP Compute Engine.</p><h4>Platform as a Service (PaaS)</h4><p>Managed runtime environment. You deploy code; the provider handles OS patches, scaling, and infrastructure. Examples: AWS Elastic Beanstalk, Azure App Service, Google App Engine.</p><h4>Software as a Service (SaaS)</h4><p>Fully managed applications accessed via browser or API. Examples: Salesforce, Google Workspace, Microsoft 365.</p><h4>Function as a Service (FaaS)</h4><p>Event-driven, ephemeral compute. You write individual functions that execute on triggers. Examples: AWS Lambda, Azure Functions, Google Cloud Functions.</p>',
 mermaid: 'graph TB; subgraph Abstraction Levels; SaaS[SaaS - Gmail, Salesforce]-->PaaS[PaaS - App Service, Beanstalk]; PaaS-->FaaS[FaaS - Lambda, Functions]; FaaS-->IaaS[IaaS - EC2, VMs]; IaaS-->OnPrem[On-Premises]; end; subgraph You Manage; SaaS-.->|Nothing|X1[Provider manages all]; PaaS-.->|Code + Data|X2[Provider manages infra]; FaaS-.->|Function code|X3[Provider manages runtime]; IaaS-.->|OS + Runtime + App|X4[Provider manages hardware]; end'
 },
 {
 title: 'Regions and Availability Zones',
 content: '<p>Cloud providers organize infrastructure into <strong>Regions</strong> (geographic locations like us-east-1, eu-west-2) and <strong>Availability Zones</strong> (isolated data centers within a region, connected by low-latency links).</p><p><strong>Key concepts:</strong></p><ul><li><strong>Region:</strong> Independent geographic area with 2-6 AZs. Data stays within a region unless you explicitly replicate it.</li><li><strong>Availability Zone:</strong> One or more discrete data centers with independent power, cooling, and networking. Failures in one AZ do not affect others.</li><li><strong>Edge Locations:</strong> CDN points of presence for caching content close to end users (CloudFront, Azure CDN).</li><li><strong>Local Zones:</strong> Extensions of a region placed in population centers for ultra-low latency use cases.</li></ul><p><strong>Selection criteria:</strong> Choose regions based on compliance requirements (data sovereignty), latency to users, available services, and cost (pricing varies by region).</p>',
 mermaid: 'graph TD; subgraph Region: us-east-1; AZ1[AZ-1a - DC1, DC2] --- AZ2[AZ-1b - DC3, DC4]; AZ2 --- AZ3[AZ-1c - DC5, DC6]; AZ1 --- AZ3; end; subgraph Region: eu-west-1; AZ4[AZ-1a] --- AZ5[AZ-1b]; AZ5 --- AZ6[AZ-1c]; AZ4 --- AZ6; end; Users[Global Users] --> Edge[Edge/CDN]; Edge --> AZ1; Edge --> AZ4'
 },
 {
 title: 'High Availability and Disaster Recovery',
 content: '<p><strong>High Availability (HA)</strong> means the system remains operational during component failures. It is measured as uptime percentage (99.9% = 8.76 hours downtime/year, 99.99% = 52 minutes/year).</p><p><strong>Disaster Recovery (DR)</strong> means restoring operations after a catastrophic event (region failure, data corruption). Key metrics:</p><ul><li><strong>RTO (Recovery Time Objective):</strong> Maximum acceptable downtime. How fast must you recover?</li><li><strong>RPO (Recovery Point Objective):</strong> Maximum acceptable data loss. How much data can you afford to lose?</li></ul><h4>HA Patterns</h4><ul><li>Multi-AZ deployments with load balancers</li><li>Auto-scaling groups across AZs</li><li>Database read replicas and multi-AZ failover</li><li>Health checks with automatic replacement</li></ul><h4>DR Strategies (cost vs speed)</h4><ul><li><strong>Backup and Restore:</strong> Cheapest, slowest (RTO: hours). Take backups, restore when needed.</li><li><strong>Pilot Light:</strong> Core systems running at minimum capacity. Scale up on disaster.</li><li><strong>Warm Standby:</strong> Scaled-down copy of production. Quick failover (RTO: minutes).</li><li><strong>Multi-Site Active-Active:</strong> Full production in multiple regions. Near-zero RTO/RPO. Most expensive.</li></ul>',
 table: {
 headers: ['Strategy', 'RTO', 'RPO', 'Cost', 'Complexity'],
 rows: [
 ['Backup/Restore', 'Hours', 'Hours', 'Low', 'Low'],
 ['Pilot Light', '10-30 min', 'Minutes', 'Medium', 'Medium'],
 ['Warm Standby', 'Minutes', 'Seconds', 'High', 'High'],
 ['Active-Active', 'Near-zero', 'Near-zero', 'Very High', 'Very High']
 ]
 }
 },
 {
 title: 'Scalability: Horizontal vs Vertical',
 content: '<p><strong>Vertical scaling (Scale Up)</strong> means adding more power to an existing machine (bigger CPU, more RAM). It has a ceiling and creates a single point of failure.</p><p><strong>Horizontal scaling (Scale Out)</strong> means adding more machines to distribute load. It is theoretically unlimited and provides fault tolerance through redundancy.</p><h4>When to use Vertical Scaling</h4><ul><li>Legacy monoliths that cannot be easily distributed</li><li>Databases with strong consistency requirements (single-writer pattern)</li><li>Quick fix for immediate capacity needs</li><li>Applications with shared in-memory state</li></ul><h4>When to use Horizontal Scaling</h4><ul><li>Stateless web/API servers behind a load balancer</li><li>Microservices architectures</li><li>Read-heavy workloads (add read replicas)</li><li>Event-driven systems (add more consumers)</li></ul><h4>Cloud Auto-Scaling</h4><p>Cloud platforms automate horizontal scaling based on metrics (CPU, memory, queue depth, custom metrics). Key components: scaling policies, cooldown periods, health checks, and min/max/desired capacity settings.</p>',
 code: `// AWS Auto Scaling Group - Terraform example
resource "aws_autoscaling_group" "web_tier" {
 min_size = 2
 max_size = 20
 desired_capacity = 4
 
 target_tracking_scaling_policy {
 predefined_metric_type = "ASGAverageCPUUtilization"
 target_value = 60.0 // Scale when CPU > 60%
 }
 
 health_check_type = "ELB"
 health_check_grace_period = 300
}`,
 language: 'hcl'
 },
 {
 title: 'CAPEX vs OPEX Economics',
 content: '<p><strong>CAPEX (Capital Expenditure)</strong> is the traditional model: buy servers upfront, depreciate over 3-5 years. You own the hardware but bear all risk of over/under-provisioning.</p><p><strong>OPEX (Operational Expenditure)</strong> is the cloud model: pay for what you use, when you use it. No upfront investment, but ongoing costs that scale with usage.</p><h4>Total Cost of Ownership (TCO)</h4><p>When comparing cloud vs on-premises, factor in:</p><ul><li>Hardware purchase and refresh cycles</li><li>Data center space, power, cooling</li><li>Network equipment and bandwidth</li><li>Staff for hardware management</li><li>Software licenses (OS, virtualization)</li><li>Opportunity cost of slow provisioning</li></ul><h4>Cloud Cost Optimization</h4><ul><li><strong>Reserved Instances:</strong> 1-3 year commitments for 30-72% savings on steady-state workloads</li><li><strong>Spot/Preemptible:</strong> 60-90% savings for fault-tolerant, interruptible workloads</li><li><strong>Right-sizing:</strong> Match instance types to actual utilization</li><li><strong>Auto-scaling:</strong> Scale down during off-peak hours</li><li><strong>Storage tiers:</strong> Move cold data to cheaper storage classes</li></ul>',
 callout: { type: 'tip', title: 'Interview Insight', text: 'Interviewers love hearing about cost-aware architecture. Show that you think about Reserved vs On-Demand vs Spot trade-offs, not just technical correctness.' }
 },
 {
 title: 'Shared Responsibility Model',
 content: '<p>The <strong>shared responsibility model</strong> defines the security boundary between you and the cloud provider. The provider secures the infrastructure <em>of</em> the cloud; you secure everything <em>in</em> the cloud.</p><h4>Provider Responsibility (Security OF the Cloud)</h4><ul><li>Physical data center security</li><li>Hardware and firmware maintenance</li><li>Network infrastructure</li><li>Hypervisor and host OS patching</li><li>Global infrastructure availability</li></ul><h4>Customer Responsibility (Security IN the Cloud)</h4><ul><li>Identity and Access Management (IAM policies)</li><li>Data encryption (at rest and in transit)</li><li>Network security (security groups, NACLs, WAF)</li><li>OS patching (for IaaS instances)</li><li>Application-level security</li><li>Data classification and compliance</li></ul><p>The exact split varies by service model: with IaaS you manage more; with SaaS the provider manages almost everything except user access and data.</p>'
 },
 {
 title: 'Multi-Cloud vs Hybrid Cloud',
 content: '<p><strong>Multi-cloud</strong> uses multiple public cloud providers (e.g., AWS + Azure). <strong>Hybrid cloud</strong> combines on-premises infrastructure with one or more public clouds.</p><h4>Multi-Cloud Motivations</h4><ul><li><strong>Avoid vendor lock-in:</strong> Portability between providers</li><li><strong>Best-of-breed:</strong> Use each provider for what they do best (GCP for ML, AWS for breadth)</li><li><strong>Regulatory:</strong> Some jurisdictions require data to stay with specific providers</li><li><strong>Negotiation leverage:</strong> Credible alternative reduces pricing pressure</li></ul><h4>Multi-Cloud Challenges</h4><ul><li>Increased operational complexity</li><li>Skills gap (teams must learn multiple platforms)</li><li>Networking between clouds (latency, cost)</li><li>Inconsistent security models and IAM</li><li>Lowest-common-denominator architecture</li></ul><h4>Hybrid Cloud Use Cases</h4><ul><li><strong>Regulated industries:</strong> Keep sensitive data on-premises, burst to cloud</li><li><strong>Migration:</strong> Incremental move from on-premises to cloud</li><li><strong>Edge computing:</strong> Process locally, aggregate in cloud</li><li><strong>Legacy integration:</strong> Mainframes that cannot move to cloud</li></ul>'
 },
 {
 title: 'Common Mistakes and Anti-Patterns',
 content: '<p>These cloud anti-patterns lead to outages, cost overruns, and security breaches:</p><ul><li><strong>Single-AZ deployment:</strong> One AZ failure takes down your entire service. Always deploy across at least 2 AZs.</li><li><strong>No auto-scaling:</strong> Fixed capacity means you either waste money (over-provisioned) or drop traffic (under-provisioned).</li><li><strong>Storing state in instances:</strong> Treat instances as cattle, not pets. Store state in managed services (S3, RDS, ElastiCache).</li><li><strong>Ignoring cost monitoring:</strong> Cloud bills grow silently. Set budgets and alerts from day one.</li><li><strong>Over-engineering for multi-cloud:</strong> Abstracting everything for portability adds complexity. Most teams never actually switch providers.</li><li><strong>Lifting and shifting without refactoring:</strong> Running the same monolith on EC2 instead of a VM gives you a cloud bill without cloud benefits.</li><li><strong>Ignoring the shared responsibility model:</strong> Assuming the provider handles all security leads to data breaches.</li><li><strong>No tagging strategy:</strong> Without tags, cost allocation and resource management become impossible at scale.</li></ul>'
 },
 {
 title: 'Hands-On Exercise: Design a Resilient Architecture',
 content: '<p><strong>Scenario:</strong> You are designing a web application that must achieve 99.95% availability (< 4.38 hours downtime per year) while keeping costs reasonable.</p><h4>Requirements</h4><ul><li>Serve users globally with < 200ms latency</li><li>Handle 10x traffic spikes during peak events</li><li>Survive a single AZ failure with zero data loss</li><li>Support deployment rollbacks within 5 minutes</li></ul><h4>Exercise Steps</h4><ol><li>Choose a region and justify your selection (latency, compliance, cost)</li><li>Design a multi-AZ architecture diagram using at least: load balancer, compute tier, database, cache, CDN</li><li>Define your auto-scaling policy (metric, threshold, cooldown)</li><li>Specify your DR strategy and calculate RTO/RPO</li><li>Estimate monthly cost using the AWS/Azure pricing calculator</li><li>Identify single points of failure and mitigate them</li></ol><h4>Expected Output</h4><p>A Mermaid architecture diagram, a table of components with their HA configuration, and a cost estimate breakdown.</p>',
 code: `# Architecture Decision Record Template
## Context
We need 99.95% availability for our customer-facing API.

## Decision
- Region: us-east-1 (lowest latency to 60% of our users)
- Compute: ECS Fargate across 3 AZs (min 2, max 20 tasks)
- Database: Aurora PostgreSQL Multi-AZ with 2 read replicas
- Cache: ElastiCache Redis cluster (3 nodes, multi-AZ)
- CDN: CloudFront with origins in us-east-1
- DR: Warm standby in us-west-2 with Aurora Global Database

## Consequences
- Monthly cost: ~,400 (vs ~ for single-AZ)
- RTO: < 5 minutes (automated Aurora failover)
- RPO: < 1 second (synchronous replication within region)`,
 language: 'markdown'
 },
 {
 title: 'Interview Tips',
 content: '<p>Cloud fundamentals questions appear at every level but the expected depth varies dramatically.</p>',
 callout: { type: 'tip', title: 'What Interviewers Look For', text: 'Junior: Can you explain IaaS vs PaaS? Mid: Can you design a multi-AZ deployment? Senior: Can you articulate trade-offs between DR strategies and their cost implications? Architect: Can you design a multi-region active-active system with conflict resolution?' }
 }
 ],
 questions: [
 {
 id: 'cloud-q1',
 level: 'junior',
 title: 'What is the difference between IaaS, PaaS, and SaaS? Give an example of each.',
 answer: '<p><strong>IaaS</strong> provides raw infrastructure (VMs, storage, networking) - you manage everything from the OS up. Example: AWS EC2, Azure VMs.</p><p><strong>PaaS</strong> provides a managed platform - you deploy code and the provider handles the runtime, OS, and infrastructure. Example: Heroku, Azure App Service.</p><p><strong>SaaS</strong> is a complete application delivered over the internet. Example: Gmail, Salesforce.</p><p>The key difference is the level of abstraction and what you are responsible for managing.</p>'
 },
 {
 id: 'cloud-q2',
 level: 'junior',
 title: 'What is an Availability Zone and why would you deploy across multiple AZs?',
 answer: '<p>An Availability Zone is an isolated data center (or group of data centers) within a cloud region. Each AZ has independent power, cooling, and networking.</p><p>Deploying across multiple AZs provides <strong>fault tolerance</strong> - if one AZ experiences an outage (power failure, network issue), your application continues serving from the other AZ(s). This is the foundation of high availability in the cloud.</p>'
 },
 {
 id: 'cloud-q3',
 level: 'mid',
 title: 'Explain horizontal vs vertical scaling. When would you choose one over the other?',
 answer: '<p><strong>Vertical scaling</strong> adds more resources to a single machine (bigger CPU, more RAM). <strong>Horizontal scaling</strong> adds more machines behind a load balancer.</p><p>Choose vertical when: the application has shared mutable state that is hard to distribute, you need a quick fix, or the workload is inherently single-threaded.</p><p>Choose horizontal when: the application is stateless (or state is externalized), you need fault tolerance, or you need to scale beyond the limits of a single machine. In cloud environments, horizontal scaling is generally preferred because it provides both scalability and redundancy.</p>'
 },
 {
 id: 'cloud-q4',
 level: 'mid',
 title: 'What is the shared responsibility model? Give an example of a security task that falls on the customer.',
 answer: '<p>The shared responsibility model defines the security boundary: the cloud provider secures the infrastructure <em>of</em> the cloud (physical security, hypervisor, network fabric), while the customer secures everything <em>in</em> the cloud (data, IAM, network configs, encryption).</p><p>Example customer responsibilities: configuring security groups correctly, enabling encryption at rest for S3 buckets, rotating access keys, patching the OS on EC2 instances (IaaS), and implementing application-level authentication.</p>'
 },
 {
 id: 'cloud-q5',
 level: 'mid',
 title: 'What are Reserved Instances vs Spot Instances? When would you use each?',
 answer: '<p><strong>Reserved Instances:</strong> 1-3 year commitment for 30-72% discount over on-demand pricing. Use for steady-state, predictable workloads (databases, base-load web servers).</p><p><strong>Spot Instances:</strong> Bid on spare capacity for 60-90% savings, but instances can be terminated with 2-minute notice. Use for fault-tolerant, interruptible workloads (batch processing, CI/CD, data analysis, rendering).</p><p>A cost-optimized architecture often combines all three: Reserved for baseline, On-Demand for predictable spikes, Spot for burst capacity.</p>'
 },
 {
 id: 'cloud-q6',
 level: 'senior',
 title: 'How would you design a system to achieve 99.99% availability? What are the key architectural decisions?',
 answer: '<p>99.99% availability allows only ~52 minutes of downtime per year. Key decisions:</p><ul><li><strong>Multi-AZ with automated failover:</strong> No single points of failure. Load balancers, auto-scaling, multi-AZ databases.</li><li><strong>Stateless compute:</strong> Store session state externally (Redis/DynamoDB) so any instance can serve any request.</li><li><strong>Health checks and self-healing:</strong> Automated detection and replacement of unhealthy instances within seconds.</li><li><strong>Zero-downtime deployments:</strong> Blue-green or canary deployments to avoid deployment-caused outages.</li><li><strong>Chaos engineering:</strong> Regularly test failure scenarios to validate resilience.</li><li><strong>Dependency isolation:</strong> Circuit breakers, bulkheads, and graceful degradation for external dependencies.</li><li><strong>Multi-region consideration:</strong> For true 99.99%, consider active-active across regions to survive region-level incidents.</li></ul>'
 },
 {
 id: 'cloud-q7',
 level: 'senior',
 title: 'Compare the DR strategies: Backup/Restore, Pilot Light, Warm Standby, and Active-Active. When is each appropriate?',
 answer: '<p><strong>Backup/Restore:</strong> Cheapest. RTO hours, RPO hours. For non-critical systems where extended downtime is acceptable.</p><p><strong>Pilot Light:</strong> Core infrastructure running idle, scale up on failover. RTO 10-30 min. For important systems with moderate budget.</p><p><strong>Warm Standby:</strong> Scaled-down production copy always running. RTO minutes. For business-critical systems.</p><p><strong>Active-Active:</strong> Full production in multiple regions. Near-zero RTO/RPO. For revenue-critical systems where any downtime has massive business impact (payment processing, trading platforms).</p><p>The choice depends on the cost of downtime vs the cost of the DR infrastructure. Calculate: if 1 hour of downtime costs the business , spending /month on Warm Standby is easily justified.</p>'
 },
 {
 id: 'cloud-q8',
 level: 'senior',
 title: 'What are the real-world challenges of multi-cloud strategy? When does it make sense vs when is it over-engineering?',
 answer: '<p><strong>Challenges:</strong> Increased operational complexity, skills gap across platforms, networking costs between clouds, inconsistent IAM/security models, and lowest-common-denominator architecture that cannot use provider-specific managed services.</p><p><strong>When it makes sense:</strong> Regulatory requirements (data sovereignty), M&A scenarios (acquired company uses different cloud), specific best-of-breed services (GCP BigQuery for analytics, AWS for general compute), genuine vendor risk mitigation for critical national infrastructure.</p><p><strong>When it is over-engineering:</strong> Most startups and mid-size companies. The operational overhead exceeds the vendor lock-in risk. Better to go deep on one provider, use portable patterns (containers, Kubernetes), and keep the option open without paying the multi-cloud tax daily.</p>'
 },
 {
 id: 'cloud-q9',
 level: 'lead',
 title: 'How would you build a cost governance framework for a team of 50 engineers using cloud resources?',
 answer: '<p>A cost governance framework needs both technical controls and organizational processes:</p><ul><li><strong>Tagging policy:</strong> Mandatory tags for team, project, environment, and cost center on every resource. Enforce via AWS Config rules or Azure Policy.</li><li><strong>Budgets and alerts:</strong> Per-team budgets with alerts at 50%, 80%, 100%. Auto-shutdown for non-production environments outside business hours.</li><li><strong>Right-sizing automation:</strong> Weekly reports comparing allocated vs utilized resources. Tools like AWS Compute Optimizer.</li><li><strong>Reserved Instance planning:</strong> Central FinOps team manages RI purchases based on usage patterns across teams.</li><li><strong>Guardrails:</strong> Service Control Policies preventing launch of expensive instance types without approval. Sandbox accounts with spending limits for experimentation.</li><li><strong>Showback/Chargeback:</strong> Monthly cost reports per team creating accountability without blocking innovation.</li><li><strong>Architecture reviews:</strong> Include cost as a non-functional requirement in design reviews.</li></ul>'
 },
 {
 id: 'cloud-q10',
 level: 'lead',
 title: 'You are migrating a monolithic on-premises application to the cloud. What migration strategy would you recommend and why?',
 answer: '<p>The 6 Rs of cloud migration provide a framework:</p><ul><li><strong>Rehost (Lift and Shift):</strong> Move as-is to IaaS. Quick but limited cloud benefits. Good first step.</li><li><strong>Replatform (Lift and Reshape):</strong> Minor optimizations during migration (e.g., move to managed database). Moderate effort, moderate benefit.</li><li><strong>Refactor/Re-architect:</strong> Redesign for cloud-native patterns. Highest effort but maximum cloud benefit. Break monolith into microservices.</li><li><strong>Repurchase:</strong> Replace with SaaS (e.g., replace custom CRM with Salesforce).</li><li><strong>Retire:</strong> Identify and decommission unused components.</li><li><strong>Retain:</strong> Keep on-premises where migration has no clear ROI.</li></ul><p>My recommendation: Start with Rehost for quick wins and cloud familiarity, then iteratively Refactor the highest-value components. This reduces risk while building team cloud expertise. Use the strangler fig pattern to gradually replace monolith components.</p>'
 },
 {
 id: 'cloud-q11',
 level: 'architect',
 title: 'Design a multi-region active-active architecture for a global e-commerce platform. How do you handle data consistency?',
 answer: '<p>Multi-region active-active requires solving data consistency across geographically distributed writes:</p><ul><li><strong>Architecture:</strong> Deploy full application stack in 3+ regions. Global load balancer (Route53/Traffic Manager) routes users to nearest region based on latency.</li><li><strong>Data layer options:</strong></li></ul><p>Option A: <strong>Global database</strong> (Aurora Global, CockroachDB, Spanner) that handles replication natively with configurable consistency.</p><p>Option B: <strong>Event sourcing + CQRS</strong> where writes go to the local region and are asynchronously replicated. Accept eventual consistency for most reads.</p><p>Option C: <strong>Conflict-free Replicated Data Types (CRDTs)</strong> for data that can be merged without conflicts (shopping carts, counters).</p><ul><li><strong>Conflict resolution:</strong> Last-writer-wins for most data. Business-rule-based resolution for critical data (inventory uses global locks or saga pattern).</li><li><strong>Cache strategy:</strong> Per-region caches with invalidation via cross-region messaging (SNS/EventBridge).</li><li><strong>Deployment:</strong> Progressive rollout region-by-region. Each region must be independently deployable.</li></ul>'
 },
 {
 id: 'cloud-q12',
 level: 'architect',
 title: 'How would you evaluate whether to use serverless (FaaS) vs containers (ECS/EKS) for a new microservice? What are the decision criteria?',
 answer: '<p>Decision criteria for serverless vs containers:</p><ul><li><strong>Traffic pattern:</strong> Serverless excels for sporadic/bursty traffic (scale-to-zero saves money). Containers are better for sustained high-throughput (avoid cold starts, predictable performance).</li><li><strong>Execution duration:</strong> Serverless has time limits (15 min for Lambda). Long-running processes need containers.</li><li><strong>Startup latency:</strong> Cold starts (100ms-10s) may be unacceptable for latency-sensitive paths. Containers have consistent sub-second startup.</li><li><strong>State:</strong> Serverless is inherently stateless. Stateful workloads need containers or external state stores.</li><li><strong>Cost at scale:</strong> At high, consistent load, containers are typically cheaper than per-invocation pricing.</li><li><strong>Operational overhead:</strong> Serverless requires zero infrastructure management. Containers need cluster management, capacity planning, and patching.</li><li><strong>Ecosystem/tooling:</strong> Container debugging is more mature. Serverless observability is improving but still challenging.</li></ul><p>Rule of thumb: Start serverless for new services. Move to containers when you hit cold-start issues, cost inflection points, or need long-running processes.</p>'
 }
 ]
});
