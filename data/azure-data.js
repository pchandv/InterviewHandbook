/* ═══════════════════════════════════════════════════════════════════
   Azure — Data Services: Cosmos DB, Azure SQL, Redis, Service Bus
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('azure-data', {
    title: 'Azure Data Services',
    description: 'Cosmos DB (global NoSQL), Azure SQL, Azure Cache for Redis, Service Bus, Event Hub, and Storage — choosing the right data service for your workload.',
    sections: [
        {
            title: 'Azure SQL vs Cosmos DB',
            content: `<p>The two primary database options in Azure with fundamentally different models and strengths.</p>`,
            table: {
                headers: ['Aspect', 'Azure SQL', 'Cosmos DB'],
                rows: [
                    ['Model', 'Relational (tables, joins, SQL)', 'Multi-model (document, graph, key-value)'],
                    ['Schema', 'Fixed schema, migrations required', 'Schema-free (JSON documents)'],
                    ['Consistency', 'Strong (ACID transactions)', '5 levels: Strong → Eventual'],
                    ['Scaling', 'Vertical + read replicas', 'Horizontal (partitioning), global distribution'],
                    ['Latency', '5-20ms (single region)', '<10ms reads, <15ms writes (SLA-backed)'],
                    ['Best for', 'Complex queries, joins, transactions, reporting', 'High throughput, global apps, flexible schema, IoT'],
                    ['Pricing', 'DTU or vCore based', 'Request Units (RU/s) provisioned or serverless'],
                    ['Global', 'Geo-replication (async)', 'Multi-region writes (active-active)']
                ]
            }
        },
        {
            title: 'Messaging: Service Bus vs Event Hub vs Storage Queue',
            content: `<p>Azure provides multiple messaging services for different patterns — choosing the right one depends on throughput, ordering, and delivery guarantees.</p>`,
            code: `// AZURE SERVICE BUS — enterprise messaging (queues + topics)
// Use for: order processing, commands, exactly-once delivery
// Features: sessions (ordering), dead-letter, scheduled delivery, transactions
await using var client = new ServiceBusClient(connectionString);
var sender = client.CreateSender("orders-queue");
await sender.SendMessageAsync(new ServiceBusMessage(JsonSerializer.Serialize(order))
{
    MessageId = order.Id.ToString(),     // Deduplication
    SessionId = order.CustomerId,        // Ordered per customer
    ScheduledEnqueueTime = DateTimeOffset.UtcNow.AddMinutes(5) // Delayed
});

// Consumer:
var processor = client.CreateProcessor("orders-queue", new ServiceBusProcessorOptions
{
    MaxConcurrentCalls = 10,
    AutoCompleteMessages = false
});
processor.ProcessMessageAsync += async args =>
{
    var order = JsonSerializer.Deserialize<Order>(args.Message.Body);
    await ProcessOrderAsync(order);
    await args.CompleteMessageAsync(args.Message); // Acknowledge
};

// EVENT HUB — high-throughput event streaming (millions/sec)
// Use for: telemetry, logs, clickstream, IoT, event sourcing
// Features: partitions, consumer groups, capture to storage, Kafka compatible

// STORAGE QUEUE — simple, cheap, high volume
// Use for: simple task queues, decoupling, when Service Bus is overkill
// Features: 64KB messages, 7-day retention, visibility timeout, poison queue`,
            language: 'csharp'
        },
        {
            title: 'Azure Cache for Redis & Storage',
            content: `<p><strong>Redis</strong> provides sub-millisecond caching and pub/sub. <strong>Azure Storage</strong> (Blob, Table, Queue) provides durable, cheap storage for files, NoSQL data, and simple messaging.</p>`,
            code: `// Azure Cache for Redis — distributed cache + pub/sub
// Tiers: Basic (dev), Standard (replication), Premium (clustering, VNET)
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = config["Redis:ConnectionString"];
    options.InstanceName = "myapp:";
});

// Common Redis patterns in Azure:
// 1. Cache-aside (session, API responses)
// 2. Distributed locking (SortedSet with expiry)
// 3. Rate limiting (INCR with TTL)
// 4. Pub/Sub (real-time notifications, cache invalidation)
// 5. Leaderboards (Sorted Sets)

// Azure Blob Storage — file storage at scale
var blobClient = new BlobServiceClient(connectionString);
var container = blobClient.GetBlobContainerClient("documents");

// Upload with metadata
await container.GetBlobClient("reports/2024/q1.pdf")
    .UploadAsync(stream, new BlobHttpHeaders { ContentType = "application/pdf" });

// Generate SAS token for temporary access (no auth needed by client)
var sasUri = blobClient.GenerateAccountSasUri(
    AccountSasPermissions.Read, DateTimeOffset.UtcNow.AddHours(1), AccountSasResourceTypes.Object);`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'When would you choose Cosmos DB vs Azure SQL? What are the consistency trade-offs?',
            difficulty: 'advanced',
            answer: `<p>Choose <strong>Azure SQL</strong> for complex relational queries, ACID transactions, reporting, and when your data fits a fixed schema. Choose <strong>Cosmos DB</strong> for global distribution, massive scale, flexible schema, low latency, and when eventual consistency is acceptable. The key trade-off: Cosmos DB offers 5 consistency levels trading latency/availability for consistency.</p>`,
            bestPractices: ['Use Azure SQL for transactional business data (orders, accounts, inventory)', 'Use Cosmos DB for high-read, globally distributed data (product catalogs, user profiles, IoT)', 'Choose Cosmos DB consistency carefully: Session (default) is good for most apps', 'Design Cosmos DB partition keys for even distribution and query efficiency'],
            commonMistakes: ['Using Cosmos DB for heavy cross-partition queries (expensive, slow)', 'Choosing Strong consistency in Cosmos when Session would suffice (doubles cost)', 'Not understanding RU pricing — a bad query can consume 1000x expected RUs', 'Trying to do relational joins in Cosmos DB (it is not a relational database)'],
            interviewTip: 'Explain the 5 Cosmos consistency levels: Strong (global linearizability) → Bounded Staleness → Session (default, per-client) → Consistent Prefix → Eventual. Each step trades consistency for lower latency and cost.',
            followUp: ['What is a partition key in Cosmos DB?', 'How does RU pricing work?', 'What are Cosmos DB consistency levels?'],
            seniorPerspective: 'I use Azure SQL as the primary OLTP database and Cosmos DB for read-heavy, denormalized views (product catalogs, user activity feeds). The CQRS pattern fits perfectly: write to SQL, project to Cosmos for fast reads.',
            architectPerspective: 'In globally distributed systems, Cosmos DB multi-region writes with Session consistency enables active-active across continents with <10ms reads. No relational database matches this. But for transactional correctness (financial), Azure SQL with geo-replication is the right choice.'
        }
    ,
        {
            question: 'Explain the five Cosmos DB consistency levels and their trade-offs.',
            difficulty: 'hard',
            answer: `<p>Cosmos DB offers a tunable spectrum from strongest to weakest:</p>
            <ul>
                <li><strong>Strong</strong> \u2014 linearizable; reads always see the latest committed write. Highest latency, limited to single-region writes effectively.</li>
                <li><strong>Bounded Staleness</strong> \u2014 reads lag by at most K versions or T seconds; predictable staleness for global apps.</li>
                <li><strong>Session</strong> (default) \u2014 read-your-writes consistency within a client session. Best balance for most apps.</li>
                <li><strong>Consistent Prefix</strong> \u2014 reads never see writes out of order, but may lag.</li>
                <li><strong>Eventual</strong> \u2014 no ordering guarantee; lowest latency and cost, highest availability.</li>
            </ul>
            <p>Each weaker level trades consistency for lower latency, lower RU cost, and higher availability across regions.</p>`,
            bestPractices: ['Default to Session consistency \u2014 it covers most application needs cheaply', 'Use Bounded Staleness for globally distributed reads that need predictable freshness', 'Reserve Strong for narrow cases that truly require linearizability', 'Override consistency per request when only some operations need stronger guarantees'],
            commonMistakes: ['Choosing Strong globally \u201cto be safe\u201d \u2014 it doubles RU cost and hurts latency', 'Assuming Eventual is fine for read-your-writes scenarios (it is not)', 'Not realizing multi-region writes are incompatible with Strong', 'Ignoring that consistency level affects both cost and availability'],
            interviewTip: 'List them in order strongest\u2192weakest and tie each to a latency/cost/availability trade-off. Naming Session as the sensible default signals real-world experience.',
            followUp: ['Why is Strong consistency incompatible with multi-region writes?', 'What does Session consistency guarantee exactly?', 'How does consistency level affect RU charges?'],
            seniorPerspective: 'I almost always run Session consistency and only escalate specific operations. The mistake teams make is treating consistency as a global switch instead of a per-operation decision.',
            architectPerspective: 'Tunable consistency is what lets Cosmos DB offer active-active multi-region writes with sub-15ms SLAs. The architecture decision is matching each workload\u2019s correctness needs to the weakest acceptable level to maximize availability and minimize cost.'
        },
        {
            question: 'When would you choose Service Bus vs Event Hub vs Storage Queue?',
            difficulty: 'medium',
            answer: `<p><strong>Service Bus</strong> is enterprise messaging \u2014 queues and topics with sessions (ordering), dead-lettering, deduplication, scheduled delivery, and transactions. Use it for commands and business workflows needing reliability and ordering.</p>
            <p><strong>Event Hub</strong> is high-throughput event streaming (millions/sec) with partitions, consumer groups, replay, and Kafka compatibility. Use it for telemetry, logs, clickstream, IoT, and event sourcing.</p>
            <p><strong>Storage Queue</strong> is a simple, cheap queue (64KB messages, visibility timeout, poison handling). Use it for basic task decoupling when Service Bus features are overkill.</p>`,
            bestPractices: ['Use Service Bus for ordered, transactional, exactly-once-style command processing', 'Use Event Hub for telemetry/event streams needing replay and many consumers', 'Use Storage Queue for simple, high-volume, low-cost decoupling', 'Use Service Bus sessions when per-key ordering is required'],
            commonMistakes: ['Using Event Hub for command processing that needs per-message completion/DLQ', 'Using Service Bus for massive telemetry firehoses (cost/throughput mismatch)', 'Reaching for Storage Queue then needing topics/sessions later', 'Ignoring Event Hub partition count, which caps consumer parallelism'],
            interviewTip: 'Map by intent: Service Bus = reliable messaging/commands, Event Hub = streaming/telemetry, Storage Queue = simple cheap queue. Mention sessions and DLQ as Service Bus differentiators.',
            followUp: ['How do Event Hub consumer groups enable multiple readers?', 'How do Service Bus sessions provide ordering?', 'When would you put Event Hub in front of Service Bus?'],
            seniorPerspective: 'I use Service Bus for the transactional core (orders, payments) and Event Hub for the observability/event stream. Storage Queue shows up for internal background jobs where the extra Service Bus features are not needed.',
            architectPerspective: 'These cover three integration styles \u2014 reliable messaging, event streaming, and lightweight queuing. Picking by delivery guarantees and throughput up front avoids expensive re-platforming when volume or ordering needs change.'
        },
        {
            question: 'How does RU (Request Unit) pricing work in Cosmos DB, and how do you avoid hot partitions?',
            difficulty: 'hard',
            answer: `<p>Cosmos DB throughput is measured in <strong>Request Units</strong> \u2014 a normalized cost combining CPU, IO, and memory. A point read of a 1KB item is ~1 RU; queries, writes, and large items cost more. You provision RU/s (or use serverless), and throughput is distributed across <strong>physical partitions</strong> determined by your partition key.</p>
            <p>A <strong>hot partition</strong> occurs when one partition-key value receives a disproportionate share of traffic; it can exhaust that partition\u2019s slice of RU/s and cause throttling (429s) even though total provisioned RU looks sufficient. Fix it with a high-cardinality, evenly-distributed partition key (and synthetic/composite keys when needed).</p>`,
            bestPractices: ['Choose a partition key with high cardinality and even access distribution', 'Measure RU charge per operation (the response header reports it) and optimize hot queries', 'Use point reads over queries where possible \u2014 they are far cheaper', 'Consider serverless or autoscale RU for spiky, unpredictable workloads'],
            commonMistakes: ['Partitioning on a low-cardinality field (tenant=BIG_CUSTOMER) causing hot partitions', 'Provisioning total RU without accounting for per-partition limits', 'Cross-partition fan-out queries that multiply RU cost', 'Ignoring the RU charge header until the bill or throttling spikes'],
            interviewTip: 'Separate two ideas: RU = cost unit; partition key = how throughput is physically spread. Hot partitions are about uneven distribution, not total RU. That nuance is what interviewers probe.',
            followUp: ['How would you design a partition key for a multi-tenant app?', 'What is a synthetic partition key?', 'How do autoscale and serverless RU differ?'],
            seniorPerspective: 'I instrument the RU-charge header in telemetry early; one bad cross-partition query can quietly consume 1000x the expected RU. Partition-key design is the single highest-leverage Cosmos decision.',
            architectPerspective: 'RU + partitioning is the scalability contract of Cosmos DB. Getting the partition key right enables linear horizontal scale; getting it wrong caps a workload no matter how much RU you buy, and re-partitioning later is a costly migration.'
        },
        {
            question: 'How do you scale Azure SQL Database, and how do the DTU, vCore, and Hyperscale models differ?',
            difficulty: 'hard',
            answer: `<p>Azure SQL scales mainly <strong>vertically</strong> (more compute/storage) plus <strong>read replicas</strong>, since it is a relational engine, not a horizontally partitioned store.</p>
            <ul>
                <li><strong>DTU model</strong> \u2014 a bundled, simplified unit blending CPU, memory, and IO (Basic/Standard/Premium). Easy to reason about but coarse and harder to right-size.</li>
                <li><strong>vCore model</strong> \u2014 you choose CPU cores, memory, and storage independently, enabling Azure Hybrid Benefit and reserved-capacity discounts. Preferred for production.</li>
                <li><strong>Hyperscale</strong> \u2014 a vCore tier that decouples compute from storage, scaling to 100TB+ with fast backups and rapid read-replica add. Best for very large or growing databases.</li>
            </ul>
            <p>For multi-region resilience, use <strong>active geo-replication</strong> or <strong>failover groups</strong> (async replicas with automatic failover); for many small databases, <strong>elastic pools</strong> share capacity across them.</p>`,
            bestPractices: ['Prefer the vCore model in production for right-sizing and reserved/hybrid discounts', 'Use Hyperscale for large databases or when you need fast replica/backup operations', 'Use failover groups for automatic regional failover with a stable connection endpoint', 'Use elastic pools to share compute across many low-utilization databases'],
            commonMistakes: ['Expecting Azure SQL to shard horizontally like Cosmos DB or DynamoDB', 'Staying on DTU because it is simpler, then struggling to right-size cost/perf', 'Treating geo-replicas as scale-out writes \u2014 secondaries are read-only', 'Over-provisioning per-database instead of pooling many small databases'],
            interviewTip: 'Lead with "Azure SQL scales up, not out" and then map the three models to a single axis: DTU (bundled/simple) vs vCore (granular/production) vs Hyperscale (decoupled storage for huge DBs). Mention failover groups for HA.',
            followUp: ['Why are geo-replication secondaries read-only?', 'When would Hyperscale beat Business Critical?', 'How do elastic pools save cost for SaaS multi-tenant apps?'],
            seniorPerspective: 'I default to vCore for the cost levers (reserved capacity, Hybrid Benefit) and reach for Hyperscale once a database grows past a few hundred GB or backup/replica time becomes painful. Failover groups give apps one connection string that survives a regional flip.',
            architectPerspective: 'Azure SQL is the right tool when you need ACID and rich querying, but its scaling ceiling is vertical. Designing for that means offloading reads to replicas, pooling small tenants, and pushing extreme-scale, high-write workloads to a partitioned store like Cosmos DB instead.'
        },
        {
            question: 'When would you add Azure Cache for Redis, and which tier and patterns would you use?',
            difficulty: 'medium',
            answer: `<p>Add <strong>Azure Cache for Redis</strong> to cut latency and offload your database for hot, read-heavy, or expensive-to-compute data, and to share state across stateless instances. Common patterns: <strong>cache-aside</strong> (API responses, lookups), <strong>distributed session</strong> state, <strong>rate limiting</strong> (INCR with TTL), <strong>distributed locks</strong>, <strong>pub/sub</strong> for cache invalidation/notifications, and <strong>leaderboards</strong> (sorted sets).</p>
            <p>Tiers: <strong>Basic</strong> (single node, dev/test, no SLA), <strong>Standard</strong> (replicated primary/replica with SLA), <strong>Premium</strong> (clustering, persistence, VNet injection, larger sizes), and <strong>Enterprise/Enterprise Flash</strong> (Redis Enterprise modules, active geo-replication, NVMe for cost-efficient large caches).</p>`,
            bestPractices: ['Use cache-aside with sensible TTLs and treat the cache as disposable, never the source of truth', 'Use at least Standard in production for the replication SLA; Basic is dev/test only', 'Use Premium/Enterprise when you need clustering, persistence, VNet, or geo-replication', 'Design for invalidation up front \u2014 stale cache bugs are harder than cache misses'],
            commonMistakes: ['Using Basic tier in production and losing the cache (and its SLA) on a node failure', 'Caching without TTLs or an invalidation strategy, serving stale data indefinitely', 'Storing the only copy of critical data in Redis as if it were durable', 'Caching low-value or rarely-read data, adding complexity for little gain'],
            interviewTip: 'Justify the cache with a concrete win (latency, DB offload, shared session) rather than "add Redis for speed". Then match a tier to a requirement: replication = Standard, clustering/persistence/VNet = Premium, modules/geo = Enterprise.',
            followUp: ['How would you handle cache invalidation on data updates?', 'What does Premium clustering buy you over Standard?', 'How would you implement rate limiting in Redis?'],
            seniorPerspective: 'I start with cache-aside plus TTLs and only add pub/sub invalidation when staleness actually bites. The tier decision usually comes down to whether I need clustering/VNet (Premium) or just the replication SLA (Standard).',
            architectPerspective: 'Redis is a latency and load-shedding layer, not a database. The architectural discipline is keeping it as an optimization in front of a durable store, with explicit invalidation and TTLs, so a cache outage degrades performance rather than correctness.'
        }
    ,
        {
            question: 'Compare Azure Event Grid, Event Hubs, and Service Bus. How do you choose?',
            difficulty: 'hard',
            answer: `<p>Three messaging services for three different jobs:</p>
            <ul>
                <li><strong>Event Grid</strong> \u2014 lightweight, reactive <em>event distribution</em> (discrete events like "blob created", "resource changed"). Push-based, HTTP, massive fan-out, content filtering. For "something happened, react to it."</li>
                <li><strong>Event Hubs</strong> \u2014 high-throughput <em>event streaming/telemetry</em> ingestion (millions/sec), partitioned, replayable, consumer groups, Kafka-compatible. For logs, IoT, clickstream, big data pipelines.</li>
                <li><strong>Service Bus</strong> \u2014 enterprise <em>messaging</em>: queues/topics with ordering (sessions), transactions, dead-lettering, deduplication, scheduled delivery. For reliable commands and business workflows.</li>
            </ul>
            <p>Rule of thumb: Event Grid = react to discrete events, Event Hubs = ingest a stream, Service Bus = reliable command/transaction processing. They often combine (Event Grid triggering, Service Bus processing).</p>`,
            explanation: 'Event Grid is a doorbell (something happened, go look); Event Hubs is a firehose recorder (capture a massive continuous stream you can replay); Service Bus is registered mail with receipts, ordering, and a dead-letter office for reliable handling.',
            bestPractices: ['Use Event Grid for reactive, discrete event notifications and Azure resource events', 'Use Event Hubs for high-volume telemetry/streaming with replay and consumer groups', 'Use Service Bus for ordered, transactional, exactly-once-style command processing', 'Combine them \u2014 e.g., Event Grid triggers a function that enqueues Service Bus work'],
            commonMistakes: ['Using Service Bus for massive telemetry firehoses (throughput/cost mismatch)', 'Using Event Hubs for command processing needing per-message DLQ/ordering', 'Using Event Grid where you need durable buffering/replay (it is push notifications)', 'Picking one for all three jobs and fighting its model'],
            interviewTip: 'Map by intent: Event Grid = discrete event reaction, Event Hubs = streaming ingestion, Service Bus = reliable messaging. Naming sessions/DLQ (Service Bus) and partitions/consumer groups (Event Hubs) shows depth.',
            followUp: ['How does this map to AWS (EventBridge/Kinesis/SQS-SNS)?', 'When would you chain Event Grid into Service Bus?', 'How do Event Hubs consumer groups enable multiple readers?'],
            seniorPerspective: 'I keep the mental model "react / stream / reliably process": Event Grid to react to discrete events, Event Hubs to ingest a telemetry stream, Service Bus for the transactional core. Most real systems use two or three of them together rather than forcing one to do every job.',
            architectPerspective: 'These map almost one-to-one onto AWS EventBridge/Kinesis/SQS+SNS, and the selection encodes delivery guarantees, throughput, and ordering needs. Choosing correctly up front avoids expensive re-platforming when volume or reliability requirements surface later.'
        },
        {
            question: 'What is the Cosmos DB change feed, and how do you use it for materialized views and event-driven processing?',
            difficulty: 'advanced',
            answer: `<p>The <strong>change feed</strong> is a persistent, ordered (per partition key) log of creates and updates to a Cosmos container. Consumers read it to react to data changes \u2014 typically via the <strong>Azure Functions Cosmos DB trigger</strong> or the <strong>change feed processor</strong> library, which manages leases/checkpoints so multiple workers share partitions and resume after restart.</p>
            <p>Common uses: build <strong>materialized views</strong> / denormalized read models (CQRS), sync to a search index or cache, trigger downstream workflows, and replicate data. It delivers changes <strong>at-least-once</strong> and in order per partition, so consumers must be idempotent. Note: it currently surfaces inserts/updates (not deletes \u2014 use soft-deletes/TTL with a marker if you need them).</p>`,
            explanation: 'The change feed is the container\u2019s tail -f log. Instead of polling "what changed?", you subscribe to the stream of changes and update your read models, caches, or search index as edits flow by.',
            code: `// Azure Functions Cosmos DB trigger consuming the change feed
[Function("ProjectOrders")]
public async Task Run(
    [CosmosDBTrigger(databaseName: "shop", containerName: "orders",
        Connection = "Cosmos", LeaseContainerName = "leases",
        CreateLeaseContainerIfNotExists = true)] IReadOnlyList<Order> changes)
{
    foreach (var order in changes)        // ordered per partition, at-least-once
        await _readModel.UpsertAsync(order); // idempotent projection / materialized view
}`,
            language: 'csharp',
            bestPractices: ['Use the change feed processor / Functions trigger so leases & checkpoints are managed for you', 'Make projections idempotent \u2014 delivery is at-least-once', 'Use it to build CQRS read models, search-index sync, and cache invalidation', 'Handle deletes via soft-delete + TTL since the feed does not emit hard deletes'],
            commonMistakes: ['Assuming the change feed includes deletes (it does not by default)', 'Non-idempotent consumers double-applying changes on retry', 'Polling the container instead of using the change feed', 'Ignoring per-partition ordering semantics when designing projections'],
            interviewTip: 'Describe it as a durable, ordered-per-partition change log consumed via the Functions trigger / processor (managed leases), enabling CQRS materialized views. The "no deletes, at-least-once, be idempotent" caveats are the senior details.',
            followUp: ['How does the change feed processor distribute partitions across workers?', 'How do you handle deletes?', 'How does this compare to DynamoDB Streams?'],
            seniorPerspective: 'I lean on the change feed to keep denormalized read models and search indexes in sync without dual-writes \u2014 write to Cosmos, project from the feed. The two things I always design for are idempotent projections and a soft-delete strategy, since the feed will not tell me about hard deletes.',
            architectPerspective: 'The change feed is what makes Cosmos a first-class event source for CQRS and event-driven architectures \u2014 directly analogous to DynamoDB Streams. It lets the write model stay normalized while purpose-built read models are projected asynchronously, decoupling write and read concerns at the data layer.'
        }
    ],
    extraSections: [
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Bad partition key in Cosmos DB</strong>: Using a low-cardinality key (e.g., status, country) creates hot partitions. Use high-cardinality (userId, orderId).</li>
                <li><strong>Cross-partition queries as default</strong>: Queries without partition key filter fan out to all partitions — expensive and slow.</li>
                <li><strong>Redis as primary database</strong>: ElastiCache/Redis is volatile by default. Use as cache layer, not source of truth.</li>
                <li><strong>Ignoring Cosmos DB RU costs</strong>: Not estimating Request Unit consumption. Large documents + cross-partition queries burn RUs fast.</li>
                <li><strong>Storage account with public access</strong>: Blob containers publicly accessible by default in some configs. Always restrict access.</li>
                <li><strong>Service Bus without dead-letter</strong>: Failed messages disappear without DLQ configuration. Always enable dead-lettering.</li>
                <li><strong>Event Hub without consumer groups</strong>: All consumers sharing one group compete for partitions. Use separate consumer groups per service.</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Cosmos DB: globally distributed, multi-model, single-digit ms latency. Partition key is the most critical design decision.</li>
                <li>Azure SQL: managed SQL Server with auto-tuning, elastic pools, geo-replication. For relational workloads.</li>
                <li>Azure Cache for Redis: sub-ms caching, sessions, pub/sub. Tiers: Basic (dev) → Standard (prod) → Premium (clustering).</li>
                <li>Blob Storage: unlimited object storage. Tiers: Hot (frequent) → Cool (30+ days) → Archive (180+ days, hours to rehydrate).</li>
                <li>Event Hub: high-throughput event streaming (millions/sec). For IoT, telemetry, clickstream. Ordered per partition.</li>
                <li>Service Bus: enterprise messaging with queues (point-to-point) and topics (pub/sub). FIFO, sessions, transactions.</li>
                <li>Change Feed (Cosmos): ordered change stream for event-driven patterns — materialized views, CQRS projections, cross-service sync.</li>
            </ul>`
        }
    ]
});
