/* ═══════════════════════════════════════════════════════════════════
   AWS — Data & Messaging: S3, RDS, DynamoDB, SQS, SNS
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('aws-data', {
    title: 'AWS Data & Messaging',
    description: 'S3 object storage, RDS/Aurora relational databases, DynamoDB NoSQL, SQS queues, SNS topics, and choosing the right data service for your workload.',
    sections: [
        {
            title: 'Storage & Database Services',
            content: `<p>AWS data services span object storage, relational, NoSQL, caching, and messaging — each optimized for specific access patterns.</p>`,
            table: {
                headers: ['Service', 'Type', 'Best For', 'Key Feature'],
                rows: [
                    ['S3', 'Object storage', 'Files, backups, data lake, static hosting', '11 nines durability, lifecycle policies'],
                    ['RDS/Aurora', 'Relational (managed)', 'OLTP, complex queries, ACID transactions', 'Multi-AZ, read replicas, auto-scaling (Aurora)'],
                    ['DynamoDB', 'NoSQL (key-value/document)', 'High throughput, single-digit ms latency, serverless', 'Auto-scaling, global tables, DAX cache'],
                    ['ElastiCache', 'In-memory (Redis/Memcached)', 'Caching, sessions, leaderboards, pub/sub', 'Sub-ms latency, cluster mode'],
                    ['SQS', 'Message queue', 'Decoupling services, async processing', 'At-least-once, FIFO option, dead-letter queue'],
                    ['SNS', 'Pub/Sub topics', 'Fan-out notifications, event broadcast', 'Multi-subscriber, push to SQS/Lambda/HTTP'],
                    ['Kinesis', 'Event streaming', 'Real-time analytics, log aggregation, IoT', 'Ordered, replayable, multiple consumers']
                ]
            }
        },
        {
            title: 'DynamoDB & Messaging Patterns',
            content: `<p>DynamoDB is AWS's flagship NoSQL service — single-digit millisecond performance at any scale. SQS + SNS provide the messaging backbone for decoupled architectures.</p>`,
            code: `// DynamoDB single-table design (access pattern driven):
// Partition Key (PK) + Sort Key (SK) enable multiple entity types in one table
// PK: USER#123       SK: PROFILE           → User profile
// PK: USER#123       SK: ORDER#2024-001    → User's order
// PK: ORDER#2024-001 SK: ITEM#1            → Order line item
// PK: ORDER#2024-001 SK: METADATA          → Order metadata

// Access patterns:
// Get user profile: Query PK=USER#123, SK=PROFILE
// Get user orders: Query PK=USER#123, SK begins_with ORDER#
// Get order details: Query PK=ORDER#2024-001

// SQS + SNS fan-out pattern:
// Order Service publishes to SNS Topic "order-events"
// SNS fans out to multiple SQS queues:
//   → Payment Queue (PaymentService processes)
//   → Inventory Queue (InventoryService processes)
//   → Notification Queue (NotificationService processes)
//   → Analytics Queue (AnalyticsService processes)
// Each service processes independently at its own pace

// Dead Letter Queue (DLQ) pattern:
// Main Queue → Consumer (retries 3x) → fails → Dead Letter Queue
// DLQ monitored via CloudWatch alarm
// Operations team investigates/replays failed messages

// Choosing SQS vs SNS vs Kinesis:
// SQS: point-to-point, at-least-once, decoupling (1 consumer)
// SNS: fan-out, push-based (many subscribers)
// Kinesis: ordered stream, replay, multiple independent consumers
// Common: SNS → SQS (fan-out to independent queues per consumer)`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'When would you choose DynamoDB vs RDS/Aurora?',
            difficulty: 'medium',
            answer: `<p>Choose <strong>DynamoDB</strong> for: high throughput with predictable access patterns, single-digit ms latency at any scale, serverless/pay-per-request, and key-value/document workloads. Choose <strong>RDS/Aurora</strong> for: complex queries with JOINs, ACID transactions across multiple tables, relational data with many access patterns, and when SQL expertise is strong on the team.</p>`,
            bestPractices: ['Design DynamoDB tables around access patterns (not entity relationships)', 'Use Aurora for complex OLTP with read replicas for scaling reads', 'Use DynamoDB single-table design for microservices (one table per service)', 'Consider DynamoDB Streams + Lambda for event-driven reactions to data changes'],
            commonMistakes: ['Using DynamoDB for ad-hoc queries (it requires known access patterns upfront)', 'Not understanding DynamoDB partition key design (hot partitions kill performance)', 'Choosing RDS when traffic is highly variable (DynamoDB auto-scales better)', 'Putting relational data in DynamoDB (forcing JOINs in application code)'],
            interviewTip: 'The key distinction: DynamoDB requires you to know your access patterns at design time — it cannot do arbitrary JOINs or ad-hoc queries efficiently. RDS/Aurora handles flexible queries but requires capacity planning. If your access patterns are predictable and you need massive scale, DynamoDB wins.',
            followUp: ['What is DynamoDB single-table design?', 'How do Global Secondary Indexes work?', 'What is Aurora Serverless?'],
            seniorPerspective: 'I use DynamoDB for microservice-owned data with well-defined access patterns (user profiles, session data, simple lookups). RDS/Aurora for domains with complex querying needs (orders with reporting, inventory with aggregations). Often both in the same system.',
            architectPerspective: 'DynamoDB excels in serverless architectures (Lambda + DynamoDB = fully managed, auto-scaling, pay-per-use). Aurora excels in traditional architectures needing relational power. The trend: start with DynamoDB for new microservices, use Aurora for migration of existing relational workloads that need complex queries.'
        }
    ,
        {
            question: 'How do you design a DynamoDB table using single-table design driven by access patterns?',
            difficulty: 'hard',
            answer: `<p>DynamoDB is queried efficiently only by partition key (and optional sort key), so you <strong>start from the access patterns</strong>, not the entities. In single-table design you store multiple entity types in one table and overload the PK/SK to satisfy each query with a single <code>Query</code> or <code>GetItem</code>.</p>
            <p>For example <code>PK=USER#123, SK=PROFILE</code> for the profile and <code>PK=USER#123, SK=ORDER#2024-001</code> for orders lets you fetch a user and all their orders with one query (<code>SK begins_with ORDER#</code>). Secondary access patterns are served by <strong>Global Secondary Indexes</strong> that re-key the same items.</p>`,
            bestPractices: ['List every access pattern before designing keys \u2014 the schema is derived from queries', 'Choose a partition key with high cardinality and even traffic to avoid hot partitions', 'Use composite sort keys (e.g., ORDER#<date>) to support range and begins_with queries', 'Add GSIs for alternate access patterns rather than scanning the table'],
            commonMistakes: ['Modeling DynamoDB like a relational schema and joining in application code', 'Low-cardinality partition keys (e.g., status) that create hot partitions', 'Relying on Scan for queries \u2014 it reads the whole table and is slow/expensive', 'Adding access patterns later that the key design cannot serve without a migration'],
            interviewTip: 'Say it plainly: in DynamoDB you cannot do ad-hoc queries, so you must know access patterns up front. Walk through one PK/SK example and one GSI to show you understand key overloading.',
            followUp: ['How do Global vs Local Secondary Indexes differ?', 'What causes a hot partition and how do you fix it?', 'When would you split into multiple tables instead?'],
            seniorPerspective: 'I write the access-pattern list as the design doc, then derive keys. The discipline is admitting that a new, unplanned query usually means a new GSI or a backfill \u2014 there is no free ad-hoc query like in SQL.',
            architectPerspective: 'Single-table design trades modeling flexibility for predictable single-digit-ms performance at any scale. It fits service-owned data with a stable, well-understood query set; it is a poor fit for exploratory or reporting workloads, which belong in a relational store or a data lake.'
        },
        {
            question: 'Compare SQS, SNS, and Kinesis. When would you use the SNS-to-SQS fan-out pattern?',
            difficulty: 'medium',
            answer: `<p><strong>SQS</strong> is a point-to-point queue \u2014 one logical consumer group pulls and deletes messages (at-least-once, optional FIFO). <strong>SNS</strong> is push-based pub/sub that fans a message out to many subscribers. <strong>Kinesis</strong> is an ordered, replayable stream where multiple independent consumers read at their own offset and history is retained.</p>
            <p><strong>SNS\u2192SQS fan-out</strong> publishes one event to an SNS topic that delivers a copy into a dedicated SQS queue per consuming service. Each service then processes durably and independently, with its own retries and dead-letter queue \u2014 combining broadcast with buffered, reliable consumption.</p>`,
            bestPractices: ['Use SNS\u2192SQS so each consumer has its own buffer, retry, and DLQ', 'Use Kinesis when you need ordering, replay, or multiple consumers over the same history', 'Use FIFO SQS/SNS only when strict ordering and dedup are truly required (lower throughput)', 'Make consumers idempotent \u2014 SQS/SNS deliver at-least-once'],
            commonMistakes: ['Subscribing services directly to SNS (no buffering, lost messages if the consumer is down)', 'Using Kinesis for simple decoupling where SQS would be simpler and cheaper', 'Assuming exactly-once delivery on standard SQS/SNS', 'Ignoring shard/throughput limits when picking Kinesis'],
            interviewTip: 'Anchor on the shape: SQS = one consumer pulls, SNS = many get pushed, Kinesis = ordered replayable log. Then explain fan-out as "broadcast (SNS) + durable per-consumer buffer (SQS)".',
            followUp: ['How does a Kinesis consumer group differ from an SQS queue?', 'How do you guarantee ordering with SQS?', 'What is message visibility timeout?'],
            seniorPerspective: 'My default event backbone is SNS\u2192SQS: publishers stay ignorant of consumers, and each consumer gets isolation. I reach for Kinesis specifically when replay or strict per-key ordering matters, like rebuilding a read model.',
            architectPerspective: 'These map to integration styles: SQS for work distribution, SNS for event broadcast, Kinesis for event streaming/sourcing. Choosing wrong shows up later as coupling, lost events, or throughput ceilings, so it is an early architectural decision.'
        },
        {
            question: 'What is a dead-letter queue, and how do you handle poison messages?',
            difficulty: 'medium',
            answer: `<p>A <strong>dead-letter queue (DLQ)</strong> is a separate queue where messages land after exceeding a maximum receive/retry count. A <strong>poison message</strong> is one that repeatedly fails processing (bad payload, a downstream bug, or an un-handleable state); without a DLQ it would be retried forever, blocking the queue and burning resources.</p>
            <p>The pattern: configure a redrive policy (e.g., maxReceiveCount=3) so failures move to the DLQ, alarm on DLQ depth via CloudWatch, then have operators inspect, fix, and optionally redrive messages back to the main queue once the cause is resolved.</p>`,
            bestPractices: ['Set a sensible maxReceiveCount so transient errors retry but real failures move on', 'Alarm on DLQ depth \u2014 a non-empty DLQ is an incident signal', 'Preserve original message + failure metadata for diagnosis', 'Provide a controlled redrive path after fixing the root cause'],
            commonMistakes: ['No DLQ \u2014 poison messages retry forever and stall the queue', 'maxReceiveCount=1, sending transient failures straight to the DLQ', 'Silently discarding DLQ messages instead of investigating', 'Re-driving without fixing the cause, creating an infinite loop'],
            interviewTip: 'Distinguish transient failures (retry) from poison messages (route to DLQ). Mention alerting on DLQ depth \u2014 interviewers want to see you treat it as an operational signal, not a dumping ground.',
            followUp: ['How do you decide the retry count before DLQ?', 'How would you safely redrive DLQ messages?', 'How does visibility timeout interact with retries?'],
            seniorPerspective: 'I treat any message in a DLQ as a page-worthy signal in critical paths. The redrive tooling matters: a one-click, audited replay after a fix turns a scary incident into a routine recovery.',
            architectPerspective: 'DLQs make at-least-once delivery operationally safe by bounding the blast radius of bad messages. Combined with idempotent consumers and alerting, they are a core reliability primitive in any queue-based architecture.'
        },
        {
            question: 'What are the main S3 storage classes, and how do lifecycle policies optimize cost?',
            difficulty: 'medium',
            answer: `<p>S3 offers classes tuned to access frequency and resilience, all with high durability (11 nines):</p>
            <ul>
                <li><strong>S3 Standard</strong> \u2014 frequent access, multi-AZ, lowest latency.</li>
                <li><strong>S3 Intelligent-Tiering</strong> \u2014 auto-moves objects between access tiers based on usage; ideal when access patterns are unknown or changing.</li>
                <li><strong>Standard-IA / One Zone-IA</strong> \u2014 infrequent access at lower storage cost plus a retrieval fee; One Zone-IA stores in a single AZ (cheaper, less resilient).</li>
                <li><strong>Glacier Instant / Flexible / Deep Archive</strong> \u2014 archival, from millisecond retrieval (Instant) to hours (Deep Archive) at the lowest storage cost.</li>
            </ul>
            <p><strong>Lifecycle policies</strong> automate transitions (e.g., Standard to Standard-IA after 30 days, to Glacier after 90, expire after 365) and clean up old versions/incomplete multipart uploads. S3 also provides strong read-after-write consistency for new objects and overwrites.</p>`,
            code: `// S3 lifecycle rule: tier down over time, then expire (JSON)
{
  "Rules": [{
    "ID": "archive-and-expire",
    "Status": "Enabled",
    "Filter": { "Prefix": "logs/" },
    "Transitions": [
      { "Days": 30,  "StorageClass": "STANDARD_IA" },
      { "Days": 90,  "StorageClass": "GLACIER" }
    ],
    "Expiration": { "Days": 365 },
    "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
  }]
}`,
            language: 'json',
            bestPractices: ['Use Intelligent-Tiering when access patterns are unpredictable to avoid guessing', 'Automate transitions and expiration with lifecycle policies instead of manual cleanup', 'Match the class to retrieval needs \u2014 Deep Archive only when hours-long retrieval is acceptable', 'Expire old versions and abort incomplete multipart uploads to stop silent cost growth'],
            commonMistakes: ['Leaving everything in Standard and overpaying for cold data', 'Using One Zone-IA for critical data and losing the multi-AZ resilience', 'Choosing Glacier Deep Archive for data that occasionally needs fast access', 'Enabling versioning without lifecycle rules, accumulating costly old versions'],
            interviewTip: 'Map classes along an access-frequency axis (Standard to Deep Archive) and stress that all share 11 nines durability except One Zone-IA, which sacrifices AZ redundancy. Mention lifecycle automation and strong read-after-write consistency.',
            followUp: ['When is Intelligent-Tiering better than manual lifecycle rules?', 'What changed when S3 became strongly consistent?', 'How do retrieval times differ across the Glacier tiers?'],
            seniorPerspective: 'For unpredictable access I let Intelligent-Tiering handle it rather than guessing; for known patterns like logs I write explicit lifecycle rules. The cost leak I always check for is versioning enabled with no expiration on old versions.',
            architectPerspective: 'S3 cost optimization is about matching the durability/latency/retrieval profile to the data lifecycle and automating the transitions. Designing tiering up front turns storage from a linearly growing bill into a managed curve that follows how data actually ages.'
        },
        {
            question: 'How does Aurora differ architecturally from standard RDS, and what do read replicas, Aurora Serverless v2, and Global Database add?',
            difficulty: 'hard',
            answer: `<p>Standard <strong>RDS</strong> runs a conventional engine (e.g., MySQL/PostgreSQL) on an instance with attached EBS storage; replicas are full copies kept in sync, and storage scales per instance. <strong>Aurora</strong> re-architects this with a distributed, shared <strong>storage layer</strong> that auto-grows and replicates data 6 ways across 3 AZs. Compute instances are stateless front-ends over that shared volume.</p>
            <p>This unlocks: up to 15 <strong>read replicas</strong> that share the same storage (so replication lag is minimal and adding a replica is fast); <strong>Aurora Serverless v2</strong>, which scales capacity (ACUs) up and down in fine increments for variable load; and <strong>Aurora Global Database</strong>, which replicates to other regions with ~1s lag for low-latency global reads and cross-region disaster recovery. Failover promotes a replica in seconds because no data copy is needed.</p>`,
            bestPractices: ['Prefer Aurora over RDS when you need fast failover, many read replicas, or large auto-growing storage', 'Use Aurora Serverless v2 for spiky or unpredictable workloads to avoid over-provisioning', 'Use Aurora Global Database for cross-region DR and low-latency regional reads', 'Route read traffic to the reader endpoint to offload the writer'],
            commonMistakes: ['Treating read replicas as write scale-out \u2014 there is still a single writer', 'Assuming Aurora Serverless removes all capacity planning (set sensible min/max ACUs)', 'Expecting zero replication lag for Global Database cross-region reads', 'Choosing Aurora for tiny workloads where standard RDS is cheaper and sufficient'],
            interviewTip: 'Lead with the architectural difference: Aurora separates compute from a shared, 6-way-replicated storage layer. That single fact explains fast failover, cheap replicas, and storage auto-scaling. Then layer Serverless v2 (elastic compute) and Global Database (cross-region) on top.',
            followUp: ['Why is Aurora failover faster than standard RDS Multi-AZ?', 'How does Aurora Serverless v2 scaling differ from v1?', 'How would you use Global Database for disaster recovery?'],
            seniorPerspective: 'I lean on Aurora for the operational wins: replicas that spin up fast and share storage make read scaling and failover much less painful than classic RDS. For bursty internal services Serverless v2 saves real money by scaling compute down between peaks.',
            architectPerspective: 'Decoupling compute from a distributed storage layer is what lets Aurora scale reads, fail over quickly, and span regions without copying data per instance. It is still single-writer, so the architecture decision is recognizing when you need that resilience and read elasticity versus when plain RDS is the simpler, cheaper fit.'
        }
    ,
        {
            question: 'What is Amazon EventBridge, and how does it differ from SNS and SQS?',
            difficulty: 'advanced',
            answer: `<p><strong>EventBridge</strong> is a serverless <em>event bus</em> for event-driven architectures. Producers publish events; <strong>rules</strong> match on event <em>content</em> (not just topic) and route to many targets (Lambda, Step Functions, SQS, etc.). It adds a <strong>schema registry</strong>, <strong>archive/replay</strong>, and built-in <strong>SaaS/partner</strong> event sources.</p>
            <ul>
                <li><strong>vs SNS</strong> \u2014 SNS is high-throughput pub/sub fan-out with simple topic/subscription filtering; EventBridge does richer content-based routing, schema management, and replay, at lower throughput/higher latency.</li>
                <li><strong>vs SQS</strong> \u2014 SQS is a point-to-point queue (durable buffer, one consumer group pulls); EventBridge is routing/fan-out, often delivering <em>to</em> SQS for buffering.</li>
            </ul>`,
            explanation: 'SQS is a mailbox one team empties; SNS is a megaphone broadcasting to subscribers; EventBridge is a smart mailroom that reads each envelope\u2019s contents and routes it to the right departments \u2014 and keeps a copy it can re-deliver later.',
            bestPractices: ['Use EventBridge for content-based routing, partner events, and replay/archive needs', 'Use SNS for simple, high-throughput fan-out to many subscribers', 'Use SQS as the durable buffer consumers pull from (often as an EventBridge/SNS target)', 'Make consumers idempotent \u2014 delivery is at-least-once'],
            commonMistakes: ['Using EventBridge for ultra-high-throughput fan-out where SNS fits better', 'Treating EventBridge as a queue (it routes; SQS buffers)', 'Ignoring content-based routing and recreating it in consumer code', 'Assuming exactly-once delivery'],
            interviewTip: 'Differentiate by capability: SQS = queue/buffer, SNS = simple fan-out, EventBridge = content-based routing + schema registry + replay. Mention EventBridge often delivers into SQS to combine routing with buffering.',
            followUp: ['When would you choose SNS over EventBridge for fan-out?', 'How does EventBridge archive/replay help recovery?', 'How do schema registry and discovery work?'],
            seniorPerspective: 'I use EventBridge as the central event router when events come from many sources (including SaaS) and routing depends on content, then fan into SQS queues per consumer for durable, independent processing. SNS remains my pick when I just need cheap, high-volume broadcast.',
            architectPerspective: 'EventBridge is the backbone for content-routed, loosely-coupled event-driven systems; archive/replay turns it into a recovery and reprocessing tool. Choosing it vs SNS/SQS is an early integration-style decision \u2014 routing intelligence vs raw fan-out vs buffering \u2014 that is costly to reverse later.'
        },
        {
            question: 'How do DynamoDB Streams and Global Tables work, and what consistency trade-offs do Global Tables introduce?',
            difficulty: 'hard',
            answer: `<p><strong>DynamoDB Streams</strong> capture an ordered, time-windowed change log (insert/modify/remove) per table. Consumers (usually Lambda) react to changes \u2014 enabling event-driven patterns: materialized views, cross-service notifications, search-index updates, and the basis for replication.</p>
            <p><strong>Global Tables</strong> use Streams under the hood to replicate a table across regions as <strong>multi-region, active-active</strong> (writes accepted in any region, replicated asynchronously). The trade-off is <strong>eventual consistency</strong> across regions and <strong>last-writer-wins</strong> conflict resolution (by timestamp): concurrent writes to the same item in different regions can silently overwrite each other. Within a region you still get strong/eventual reads as configured.</p>`,
            explanation: 'Streams are the table\u2019s change journal you can subscribe to. Global Tables keep copies in several cities that sync after the fact \u2014 fast local writes everywhere, but if two cities edit the same record at once, the later timestamp wins and the other edit is lost.',
            bestPractices: ['Use Streams + Lambda for materialized views, search sync, and change notifications', 'Use Global Tables for low-latency local reads/writes and regional resilience', 'Design to avoid concurrent multi-region writes to the same item (partition by region/user)', 'Make stream consumers idempotent and handle the at-least-once, ordered-per-key delivery'],
            commonMistakes: ['Assuming Global Tables are strongly consistent across regions (they are eventual)', 'Ignoring last-writer-wins, leading to silent lost updates on cross-region conflicts', 'Non-idempotent stream consumers double-processing on retries', 'Treating Streams as infinite history (24-hour retention window)'],
            interviewTip: 'Lead with Streams = change log enabling event-driven patterns, then Global Tables = active-active replication built on Streams with eventual consistency + last-writer-wins. The conflict/lost-update trade-off is the senior point.',
            followUp: ['How would you avoid cross-region write conflicts?', 'What is the Streams retention window and why does it matter?', 'How does this compare to Cosmos DB multi-region writes?'],
            seniorPerspective: 'Global Tables are fantastic for local-latency and regional failover, but I design the data model so the same item is normally written from one region (e.g., partition by user home region) \u2014 because last-writer-wins quietly eats conflicting concurrent writes, and that data loss is hard to detect after the fact.',
            architectPerspective: 'Streams turn DynamoDB into an event source, and Global Tables extend it to active-active geo-distribution \u2014 powerful, but they push eventual consistency and conflict resolution into the application\u2019s design. Whether last-writer-wins is acceptable is an architectural decision that must be made deliberately, not discovered in production.'
        }
    ],
    additionalSections: [
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>S3 as a database</strong>: S3 is object storage, not a database. No partial updates, no queries, high latency for random access patterns.</li>
                <li><strong>DynamoDB hot partition</strong>: Poor partition key choice (e.g., date) concentrates traffic. Use high-cardinality keys (userId, orderId).</li>
                <li><strong>RDS without read replicas</strong>: Single-instance RDS under read-heavy load. Add read replicas + connection pooling (RDS Proxy).</li>
                <li><strong>SQS FIFO for everything</strong>: FIFO queues are limited to 3000 msg/s per group. Use Standard queues when ordering isn't required.</li>
                <li><strong>Ignoring DynamoDB capacity modes</strong>: Provisioned for unpredictable workloads (throttled), or On-Demand for steady workloads (expensive). Match the mode to your pattern.</li>
                <li><strong>SNS without DLQ</strong>: Failed subscriptions silently drop messages. Always configure DLQ for SQS subscriptions.</li>
                <li><strong>Aurora serverless for steady load</strong>: Cold starts + scaling latency hurt predictable workloads. Use provisioned Aurora instead.</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>S3: unlimited object storage. Use for files, backups, data lake, static hosting. Not a database.</li>
                <li>DynamoDB: single-digit ms latency at any scale. Design around partition key + sort key access patterns.</li>
                <li>RDS/Aurora: managed relational DB. Aurora = MySQL/PostgreSQL compatible with 5x throughput + auto-scaling replicas.</li>
                <li>ElastiCache (Redis): sub-ms reads for caching, sessions, leaderboards. Not durable by default.</li>
                <li>SQS: fully managed message queue. Standard (at-least-once, best-effort order) vs FIFO (exactly-once, ordered).</li>
                <li>SNS: pub/sub fan-out. One message → many subscribers (SQS, Lambda, HTTP, email).</li>
                <li>EventBridge: serverless event bus with content-based routing rules. For event-driven architectures.</li>
                <li>Kinesis: real-time streaming for high-volume ordered data (logs, clicks, IoT). Ordered per shard.</li>
            </ul>`
        }
    ]
});
