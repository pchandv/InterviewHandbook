/* ═══════════════════════════════════════════════════════════════════
   Technology Comparison Center
   Redis vs Memcached, Angular vs React, Azure vs AWS, Cosmos vs
   MongoDB, SignalR vs WebSockets, Docker Compose vs K8s, and more.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('technology-comparisons', {
    title: 'Technology Comparison Center',
    description: 'Side-by-side technology comparisons that senior engineers face daily: Redis vs Memcached, Angular vs React, Azure vs AWS, Cosmos DB vs MongoDB, SignalR vs WebSockets, Docker Compose vs Kubernetes. Each comparison includes when to choose, hidden trade-offs, and interview talking points.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['arch-styles'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Engineers constantly compare technologies. Interviewers use comparison questions to test depth: "Why did you choose X over Y?" The best answers show context-awareness, trade-off thinking, and practical experience.</p>
            <p><strong>Formula for answering:</strong> "In our context [describe constraints], we chose X because [specific reason]. We considered Y but [trade-off was unacceptable because...]. If [context changed], we would reconsider."</p>`
        },
        {
            title: 'Redis vs Memcached',
            content: `<p>Both are in-memory stores, but Redis is far more capable.</p>`,
            table: {
                headers: ['Aspect', 'Redis', 'Memcached'],
                rows: [
                    ['Data structures', 'Strings, Lists, Sets, Sorted Sets, Hashes, Streams, HyperLogLog', 'Strings only (key-value)'],
                    ['Persistence', 'RDB snapshots + AOF log', 'None (volatile only)'],
                    ['Pub/Sub', 'Yes (+ Streams for durable pub/sub)', 'No'],
                    ['Clustering', 'Redis Cluster (automatic sharding)', 'Client-side sharding only'],
                    ['Lua scripting', 'Yes (atomic server-side scripts)', 'No'],
                    ['Memory efficiency', 'Higher overhead per key', 'Lower overhead (slab allocator)'],
                    ['Multi-threading', 'Single-threaded (I/O threads in 6.0+)', 'Multi-threaded'],
                    ['Use cases', 'Cache, session, queues, leaderboards, rate limiting, locks', 'Simple caching only'],
                    ['Max value size', '512 MB', '1 MB']
                ]
            },
            callout: { type: 'tip', title: 'When to Choose', text: 'Choose Redis in almost all cases (richer features, persistence, pub/sub). Choose Memcached only if: you need multi-threaded performance for simple key-value caching at extreme scale, OR you have existing Memcached infrastructure and only need simple caching.' }
        },
        {
            title: 'Angular vs React',
            content: `<p>Framework vs library &mdash; different philosophies.</p>`,
            table: {
                headers: ['Aspect', 'Angular', 'React'],
                rows: [
                    ['Type', 'Full framework (opinionated)', 'Library + ecosystem (flexible)'],
                    ['Language', 'TypeScript (mandatory)', 'JavaScript/TypeScript (optional)'],
                    ['Architecture', 'Modules, services, DI built-in', 'Components + hooks (bring your own architecture)'],
                    ['State management', 'Services + RxJS (built-in), NgRx optional', 'useState/useReducer, Redux/Zustand/Jotai external'],
                    ['Change detection', 'Zone.js / Signals (Angular 16+)', 'Virtual DOM diffing'],
                    ['Learning curve', 'Steeper (DI, RxJS, modules, decorators)', 'Gentler start, complexity comes later'],
                    ['Bundle size', 'Larger baseline', 'Smaller (tree-shakeable)'],
                    ['Enterprise', 'Strong (consistent patterns across teams)', 'Variable (each team picks different libs)'],
                    ['Testing', 'TestBed built-in', 'React Testing Library + Jest (assemble yourself)'],
                    ['Best for', 'Large enterprise apps, strong consistency', 'Startups, flexibility, ecosystem variety']
                ]
            },
            callout: { type: 'tip', title: 'Interview Answer', text: 'Angular excels when you have large teams that need consistency (everyone uses the same patterns). React excels when you need flexibility and faster initial development. Neither is "better" &mdash; context determines the right choice.' }
        },
        {
            title: 'Azure vs AWS',
            content: `<p>The two dominant clouds &mdash; both are excellent, with different strengths.</p>`,
            table: {
                headers: ['Aspect', 'Azure', 'AWS'],
                rows: [
                    ['Strength', 'Enterprise, .NET, hybrid (Azure Arc)', 'Breadth of services, market share, serverless'],
                    ['Identity', 'Entra ID (AAD) &mdash; excellent enterprise SSO', 'IAM &mdash; more granular but complex'],
                    ['Compute', 'App Service, Functions, AKS, Container Apps', 'EC2, Lambda, ECS, EKS, App Runner'],
                    ['Database', 'Azure SQL, Cosmos DB', 'RDS, Aurora, DynamoDB'],
                    ['Messaging', 'Service Bus, Event Grid, Event Hub', 'SQS, SNS, EventBridge, Kinesis'],
                    ['DevOps', 'Azure DevOps (integrated)', 'CodePipeline (weaker), GitHub Actions'],
                    ['AI/ML', 'Azure OpenAI, AI Studio, Cognitive Services', 'Bedrock, SageMaker'],
                    ['Pricing model', 'Often discounted for Enterprise Agreement', 'Pay-as-you-go, Savings Plans'],
                    ['Learning curve', 'Easier for .NET developers', 'Steeper but more documentation/community'],
                    ['Market share', '~23% (growing)', '~31% (dominant)']
                ]
            },
            callout: { type: 'tip', title: 'Decision Rule', text: 'If your company is a .NET/Microsoft shop with Enterprise Agreement: Azure. If you need widest service selection or are startup/Python-heavy: AWS. If you need the best Kubernetes experience: both are comparable (AKS vs EKS). Multi-cloud is expensive &mdash; avoid unless regulatory requirement.' }
        },
        {
            title: 'Cosmos DB vs MongoDB',
            content: `<p>Managed multi-model (Cosmos) vs document-native (MongoDB Atlas).</p>`,
            table: {
                headers: ['Aspect', 'Azure Cosmos DB', 'MongoDB (Atlas)'],
                rows: [
                    ['APIs', 'Multi-API: NoSQL, MongoDB, Cassandra, Gremlin, Table', 'MongoDB query language only'],
                    ['Global distribution', 'Built-in multi-region active-active', 'Atlas supports multi-region'],
                    ['Consistency', '5 levels (strong to eventual)', '2 levels (strong, eventual)'],
                    ['Pricing', 'RU-based (complex, can be expensive)', 'More predictable (instance-based)'],
                    ['Scaling', 'Automatic partitioning by partition key', 'Sharding (manual or auto)'],
                    ['Ecosystem', 'Azure-native, good .NET SDK', 'Huge community, great tooling (Compass, Atlas)'],
                    ['Vendor lock-in', 'High (proprietary RU model)', 'Lower (self-host possible, standard drivers)'],
                    ['Best for', 'Azure-native, multi-region, guaranteed SLA', 'Document DB with rich query, flexible hosting']
                ]
            }
        },
        {
            title: 'SignalR vs Raw WebSockets',
            content: `<p>Real-time communication: high-level abstraction vs low-level control.</p>`,
            table: {
                headers: ['Aspect', 'SignalR', 'Raw WebSockets'],
                rows: [
                    ['Level', 'High-level framework (.NET)', 'Low-level protocol'],
                    ['Transport', 'Auto-negotiates: WebSocket, SSE, Long Polling', 'WebSocket only'],
                    ['Reconnection', 'Automatic (built-in)', 'Manual implementation required'],
                    ['Groups/Rooms', 'Built-in (Groups.AddToGroupAsync)', 'Manual implementation'],
                    ['Scaling', 'Redis/Azure SignalR backplane', 'Custom pub/sub needed'],
                    ['Protocol', 'JSON or MessagePack (hub protocol)', 'Raw bytes (define your own format)'],
                    ['Client SDKs', '.NET, JS, Java, Swift (official)', 'Browser WebSocket API only'],
                    ['Fallback', 'Yes (SSE, Long Polling when WS unavailable)', 'None (WS or nothing)'],
                    ['Best for', '.NET apps needing real-time with minimal effort', 'Custom protocols, gaming, IoT with specific needs']
                ]
            },
            callout: { type: 'tip', title: 'Decision', text: 'Use SignalR for .NET applications (99% of cases). Use raw WebSockets only when: you need a custom binary protocol, you are building a game server, or you are not on .NET and need maximum control.' }
        },
        {
            title: 'Docker Compose vs Kubernetes',
            content: `<p>Local development/small deployments vs production orchestration at scale.</p>`,
            table: {
                headers: ['Aspect', 'Docker Compose', 'Kubernetes'],
                rows: [
                    ['Purpose', 'Multi-container dev environments', 'Production container orchestration'],
                    ['Scale', 'Single host', 'Multi-node cluster'],
                    ['Self-healing', 'Restart policy only', 'Full (reschedule, health checks, rolling updates)'],
                    ['Networking', 'Simple (bridge network)', 'Complex (CNI, services, ingress, network policies)'],
                    ['Config', 'docker-compose.yml (simple)', 'Multiple YAML files (deployment, service, ingress, configmap...)'],
                    ['Learning curve', 'Minutes', 'Weeks to months'],
                    ['Load balancing', 'None built-in', 'Service load balancing, Ingress'],
                    ['Secrets', 'Environment variables / .env', 'Kubernetes Secrets, external vaults'],
                    ['Best for', 'Local dev, CI testing, tiny deployments', 'Production at scale, many services']
                ]
            }
        },
        {
            title: 'Quick Reference Matrix',
            content: `<p>At-a-glance decision guide for common comparisons:</p>`,
            table: {
                headers: ['Decision', 'Choose A When', 'Choose B When'],
                rows: [
                    ['EF Core vs Dapper', 'Complex domain, relationships, migrations needed', 'Performance-critical, full SQL control, simple queries'],
                    ['Azure Service Bus vs RabbitMQ', 'Azure-native, enterprise features (sessions, dead-letter)', 'Multi-cloud, self-hosted, simpler routing'],
                    ['Blazor vs Angular', 'C#-only team, simple interactive pages, .NET ecosystem', 'Large SPA, mature ecosystem, hiring pool'],
                    ['PostgreSQL vs SQL Server', 'Open-source, Linux-native, JSON support, cost-sensitive', 'Enterprise licensing, SSMS tooling, .NET integration'],
                    ['GitHub Actions vs Azure Pipelines', 'Open-source, GitHub-native, marketplace', 'Azure DevOps ecosystem, complex release gates'],
                    ['Terraform vs Bicep', 'Multi-cloud, established team, state management', 'Azure-only, simpler syntax, no state file']
                ]
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>No technology is universally "better" &mdash; context determines the right choice</li>
                <li>Default to the simpler/more familiar option unless you have proven need otherwise</li>
                <li>Consider: team expertise, operational cost, vendor lock-in, hiring pool</li>
                <li>In interviews, always explain WHY for your context, not just WHAT you chose</li>
                <li>The best engineers know WHEN to switch, not just what to use initially</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'tech-cmp-q1',
            level: 'mid',
            title: 'When would you choose Memcached over Redis?',
            answer: `<p><strong>Memcached over Redis when:</strong></p><ul><li>You ONLY need simple key-value caching (no data structures, pub/sub, or persistence)</li><li>You need multi-threaded performance at extreme scale (Memcached handles concurrent reads better)</li><li>Memory efficiency matters (Memcached slab allocator has less per-key overhead)</li><li>You have existing Memcached infrastructure and migration cost is not justified</li></ul><p><strong>In practice:</strong> Redis wins 95% of the time because the feature set (data structures, pub/sub, persistence, Lua scripting, streams) is worth the slight overhead.</p>`
        },
        {
            id: 'tech-cmp-q2',
            level: 'senior',
            title: 'You are building a new SPA for an enterprise. Angular or React? Justify.',
            answer: `<p><strong>For enterprise with 20+ developers:</strong> Angular.</p><p><strong>Reasons:</strong></p><ul><li>Opinionated framework = consistency across teams (DI, routing, HTTP client, forms all built-in)</li><li>TypeScript mandatory = fewer runtime errors at scale</li><li>Angular CLI generates consistent project structure</li><li>Strong testing story (TestBed, HttpTestingController built-in)</li></ul><p><strong>When React instead:</strong> Startup with 3-5 devs wanting speed, team already experienced in React, or building micro-frontends where each team picks their own stack.</p>`,
            interviewTip: 'Show you consider team dynamics, not just technology features. "Angular because our 25-person team needs consistency" is better than "Angular because it has DI."'
        },
        {
            id: 'tech-cmp-q3',
            level: 'architect',
            title: 'A startup asks: Azure or AWS? What do you recommend?',
            answer: `<p><strong>Decision factors:</strong></p><ul><li><strong>Team expertise:</strong> If team knows AWS, stay on AWS (migration cost is real)</li><li><strong>Tech stack:</strong> .NET shop &rarr; Azure has better DX (App Service, Azure Functions, Entra ID). Python/Node &rarr; AWS has broader community support.</li><li><strong>AI features:</strong> Azure OpenAI gives direct GPT-4 access; AWS Bedrock offers multi-model choice</li><li><strong>Cost:</strong> Startups get credits from both. AWS has more granular pricing. Azure has better enterprise discounts.</li></ul><p><strong>Default recommendation:</strong> Go with what the team knows. Cloud migration later is painful but possible. Do NOT go multi-cloud at startup stage.</p>`
        },
        {
            id: 'tech-cmp-q4',
            level: 'mid',
            title: 'SignalR or raw WebSockets for a real-time dashboard?',
            answer: `<p><strong>SignalR for dashboard:</strong></p><ul><li>Automatic reconnection (dashboards run for hours/days)</li><li>Fallback transport (if WebSocket blocked by corporate proxy, SSE kicks in)</li><li>Groups (send updates to specific dashboard viewers)</li><li>Scales with Azure SignalR Service or Redis backplane</li><li>.NET server + JS client = minimal code</li></ul><p><strong>Raw WebSocket only if:</strong> You need custom binary protocol (e.g., streaming financial tick data at microsecond level) or are not on .NET.</p>`
        },
        {
            id: 'tech-cmp-q5',
            level: 'senior',
            title: 'EF Core or Dapper for a high-performance API?',
            answer: `<p><strong>Use both strategically:</strong></p><ul><li><strong>EF Core for:</strong> CRUD operations, complex domain logic, migrations, relationships, where developer productivity matters more than raw speed</li><li><strong>Dapper for:</strong> Read-heavy endpoints where performance is critical, complex reporting queries, bulk operations, when you want full SQL control</li></ul><p><strong>Pattern:</strong> EF Core for write side (change tracking, validation), Dapper for read side (optimized queries). This is essentially CQRS at the data access layer.</p><p><strong>Performance reality:</strong> EF Core with AsNoTracking + compiled queries is 80-90% as fast as Dapper for simple queries. The gap only matters at high scale.</p>`
        },
        {
            id: 'tech-cmp-q6',
            level: 'lead',
            title: 'How do you evaluate a new technology for your team?',
            answer: `<p><strong>Evaluation framework:</strong></p><ol><li><strong>Problem fit:</strong> Does it solve a real problem we have today? (Not "sounds cool")</li><li><strong>Team capacity:</strong> Can we learn and operate it? (Hidden operational cost)</li><li><strong>Maturity:</strong> Production-proven? Active community? Breaking changes stable?</li><li><strong>Hiring:</strong> Can we hire engineers who know this? (Niche tech = hiring bottleneck)</li><li><strong>Exit cost:</strong> How hard is it to migrate away if it does not work out?</li><li><strong>Spike:</strong> Time-boxed POC (2-3 days) to validate assumptions before committing</li></ol><p><strong>Red flags:</strong> Choosing tech because of conference hype, no production users in your scale range, only one person on team understands it.</p>`
        },
        {
            id: 'tech-cmp-q7',
            level: 'architect',
            title: 'Cosmos DB or MongoDB Atlas for a global e-commerce platform?',
            answer: `<p><strong>For global e-commerce on Azure:</strong> Cosmos DB.</p><p><strong>Reasons:</strong></p><ul><li>Built-in multi-region active-active replication (single API call to add regions)</li><li>5 consistency levels let you tune per-operation (strong for inventory, eventual for product catalog)</li><li>99.999% SLA with multi-region writes</li><li>Azure-native auth, networking, monitoring integration</li></ul><p><strong>Choose MongoDB Atlas instead if:</strong></p><ul><li>Multi-cloud requirement (Atlas runs on AWS/Azure/GCP)</li><li>Team has deep MongoDB expertise</li><li>Cost sensitivity (Cosmos RU pricing can surprise you at scale)</li><li>Want to avoid vendor lock-in (MongoDB is portable)</li></ul>`
        },
        {
            id: 'tech-cmp-q8',
            level: 'mid',
            title: 'Docker Compose or Kubernetes for a team of 5 building 3 microservices?',
            answer: `<p><strong>Docker Compose</strong> (or Azure Container Apps / AWS App Runner for production).</p><p><strong>Reasoning:</strong></p><ul><li>5 developers cannot justify Kubernetes operational overhead (upgrades, networking, RBAC, monitoring)</li><li>3 services do not need sophisticated orchestration</li><li>Docker Compose for local dev, Container Apps for production (scale to zero, managed TLS, auto-scaling)</li><li>Kubernetes becomes worth it at 15-20+ services with a dedicated platform team</li></ul><p><strong>Key insight:</strong> Kubernetes is an organizational investment, not just a technical choice. You need 2-3 people to maintain it well.</p>`
        }
    ]
});
