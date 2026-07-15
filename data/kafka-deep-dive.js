'use strict';

PageData.register('kafka-deep-dive', {
    title: 'Apache Kafka',
    description: 'Kafka architecture internals, producer/consumer patterns, exactly-once semantics, Kafka Streams, Schema Registry, Connect, log compaction, and production operations.',
    sections: [
        {
            title: 'Introduction',
            content: `<p><strong>Apache Kafka</strong> is a distributed event streaming platform used for high-throughput, fault-tolerant, real-time data pipelines. Unlike traditional message brokers, Kafka is a <strong>distributed commit log</strong> — messages persist, multiple consumers read independently, and replay is possible.</p>
            <p>Kafka is asked about in nearly every senior/architect interview for distributed systems. The questions go deep: partition strategies, exactly-once semantics, consumer group rebalancing, and operational tuning.</p>`
        },
        {
            title: 'Architecture Overview',
            mermaid: `graph TB
    subgraph Cluster["Kafka Cluster (3 Brokers)"]
        B1["Broker 1<br/>Partition 0 (Leader)<br/>Partition 2 (Follower)"]
        B2["Broker 2<br/>Partition 1 (Leader)<br/>Partition 0 (Follower)"]
        B3["Broker 3<br/>Partition 2 (Leader)<br/>Partition 1 (Follower)"]
    end
    subgraph Producers
        P1["Producer A"]
        P2["Producer B"]
    end
    subgraph ConsumerGroup["Consumer Group: order-service"]
        C1["Consumer 1<br/>→ Partition 0"]
        C2["Consumer 2<br/>→ Partition 1"]
        C3["Consumer 3<br/>→ Partition 2"]
    end
    subgraph Coordination
        KR["KRaft Controller<br/>(replaces ZooKeeper)"]
    end
    P1 & P2 --> B1 & B2 & B3
    B1 & B2 & B3 --> C1 & C2 & C3
    KR --> B1 & B2 & B3`,
            content: `<p><strong>Core components:</strong></p>
            <ul>
                <li><strong>Broker</strong> — a Kafka server. Stores partitions, serves producers/consumers.</li>
                <li><strong>Topic</strong> — logical channel for events (e.g., "orders", "payments").</li>
                <li><strong>Partition</strong> — ordered, immutable log segment. Unit of parallelism.</li>
                <li><strong>Replication</strong> — each partition replicated to N brokers (replication factor). Leader handles reads/writes; followers replicate.</li>
                <li><strong>ISR (In-Sync Replicas)</strong> — followers that are up-to-date with the leader. Only ISR members can become the new leader.</li>
                <li><strong>KRaft</strong> — Kafka's new metadata consensus protocol replacing ZooKeeper (production-ready since Kafka 3.3).</li>
            </ul>`
        },
        {
            title: 'Producer Internals',
            content: `<p>Producers control durability vs throughput via the <code>acks</code> setting:</p>
            <table><thead><tr><th>acks</th><th>Behavior</th><th>Durability</th><th>Latency</th></tr></thead><tbody>
                <tr><td>0</td><td>Fire and forget — no acknowledgment</td><td>May lose messages</td><td>Lowest</td></tr>
                <tr><td>1</td><td>Leader acknowledges write</td><td>Lost if leader fails before replication</td><td>Low</td></tr>
                <tr><td>all (-1)</td><td>All ISR members acknowledge</td><td>No data loss (with min.insync.replicas=2)</td><td>Higher</td></tr>
            </tbody></table>
            <h4>Batching & Compression</h4>
            <ul>
                <li><code>batch.size</code> — max bytes per batch (default 16KB). Larger = better throughput.</li>
                <li><code>linger.ms</code> — wait time to fill batch (default 0). Set 5-20ms for better batching.</li>
                <li><code>compression.type</code> — lz4 (fast), zstd (best ratio), snappy (balanced).</li>
            </ul>
            <h4>Idempotent Producer</h4>
            <p><code>enable.idempotence=true</code> — broker deduplicates retried produces using sequence numbers per partition. Guarantees exactly-once within a single producer session.</p>`,
            code: `// .NET Confluent Kafka Producer
using Confluent.Kafka;

var config = new ProducerConfig
{
    BootstrapServers = "kafka:9092",
    Acks = Acks.All,                    // Strongest durability
    EnableIdempotence = true,           // Exactly-once per session
    LingerMs = 10,                      // Wait 10ms to batch
    CompressionType = CompressionType.Lz4,
    MaxInFlight = 5,                    // Allowed with idempotence
    MessageSendMaxRetries = int.MaxValue,
    RetryBackoffMs = 100
};

using var producer = new ProducerBuilder<string, string>(config)
    .SetErrorHandler((_, e) => logger.LogError("Producer error: {Error}", e.Reason))
    .Build();

// Produce with key (determines partition)
var result = await producer.ProduceAsync("orders-topic",
    new Message<string, string>
    {
        Key = orderId,          // Same key → same partition → ordering
        Value = JsonSerializer.Serialize(orderEvent),
        Headers = new Headers
        {
            { "event-type", Encoding.UTF8.GetBytes("OrderPlaced") },
            { "correlation-id", Encoding.UTF8.GetBytes(correlationId) }
        }
    });

logger.LogInformation("Produced to {Topic}[{Partition}]@{Offset}",
    result.Topic, result.Partition, result.Offset);`,
            language: 'csharp'
        },
        {
            title: 'Consumer Groups & Rebalancing',
            mermaid: `graph TD
    subgraph Topic["Topic: orders (6 partitions)"]
        P0[Partition 0]
        P1[Partition 1]
        P2[Partition 2]
        P3[Partition 3]
        P4[Partition 4]
        P5[Partition 5]
    end
    subgraph CG["Consumer Group: order-processor"]
        C1["Consumer 1"]
        C2["Consumer 2"]
        C3["Consumer 3"]
    end
    P0 & P1 --> C1
    P2 & P3 --> C2
    P4 & P5 --> C3
    Note["6 partitions / 3 consumers = 2 partitions each<br/>Max consumers = partition count<br/>Adding C4 would leave one idle"]`,
            content: `<p><strong>Consumer group rules:</strong></p>
            <ul>
                <li>Each partition assigned to exactly ONE consumer in the group</li>
                <li>One consumer can handle multiple partitions</li>
                <li>Max useful consumers = number of partitions (extras sit idle)</li>
                <li>Multiple consumer groups read the same topic independently</li>
            </ul>
            <h4>Rebalancing</h4>
            <p>When a consumer joins/leaves the group, partitions are reassigned. During rebalancing, processing pauses.</p>
            <ul>
                <li><strong>Eager rebalancing</strong> — revoke ALL partitions, reassign. Causes stop-the-world pause.</li>
                <li><strong>Cooperative Sticky</strong> — only revoke partitions that need to move. Minimizes downtime. Default since Kafka 3.0+.</li>
            </ul>
            <h4>Offset Management</h4>
            <ul>
                <li><code>enable.auto.commit=true</code> — offsets committed periodically (at-most-once risk if crash before processing)</li>
                <li><code>enable.auto.commit=false</code> — manual commit after processing (at-least-once guarantee)</li>
            </ul>`
        },
        {
            title: 'Exactly-Once Semantics',
            content: `<p>Kafka supports exactly-once processing within its ecosystem via transactions:</p>
            <ol>
                <li><strong>Idempotent producer</strong> — deduplicates retries per partition (sequence numbers)</li>
                <li><strong>Transactional producer</strong> — atomically write to multiple partitions AND commit consumer offsets</li>
                <li><strong>Consumer isolation</strong> — <code>isolation.level=read_committed</code> only reads committed messages</li>
            </ol>
            <p><strong>Pattern: read-process-write</strong></p>
            <ul>
                <li>Consumer reads from input topic</li>
                <li>Processes the message</li>
                <li>Writes result to output topic AND commits input offset — atomically within one transaction</li>
            </ul>
            <p><strong>Important limitation:</strong> Exactly-once applies within Kafka only. Once you write to an external system (database, API), you need application-level idempotency.</p>`,
            code: `// Transactional producer (exactly-once within Kafka)
var config = new ProducerConfig
{
    BootstrapServers = "kafka:9092",
    TransactionalId = "order-processor-1",  // Unique per instance
    EnableIdempotence = true,
    Acks = Acks.All
};

using var producer = new ProducerBuilder<string, string>(config).Build();
producer.InitTransactions(TimeSpan.FromSeconds(30));

// Read-Process-Write pattern
try
{
    producer.BeginTransaction();
    
    // Process input and produce output atomically
    producer.Produce("orders-enriched", new Message<string, string>
    {
        Key = orderId,
        Value = enrichedPayload
    });
    
    // Commit consumer offset as part of the transaction
    producer.SendOffsetsToTransaction(
        offsets,
        consumer.ConsumerGroupMetadata,
        TimeSpan.FromSeconds(10));
    
    producer.CommitTransaction();
}
catch (Exception)
{
    producer.AbortTransaction();
    throw;
}`,
            language: 'csharp'
        },
        {
            title: 'Schema Registry & Log Compaction',
            content: `<h4>Schema Registry</h4>
            <p>Confluent Schema Registry stores versioned schemas (Avro, Protobuf, JSON Schema) and validates producer messages against them.</p>
            <table><thead><tr><th>Compatibility Mode</th><th>Allowed Changes</th><th>Use Case</th></tr></thead><tbody>
                <tr><td>BACKWARD</td><td>Delete fields, add optional fields</td><td>New consumers read old data</td></tr>
                <tr><td>FORWARD</td><td>Add fields, delete optional fields</td><td>Old consumers read new data</td></tr>
                <tr><td>FULL</td><td>Add/delete optional fields only</td><td>Both directions (safest)</td></tr>
                <tr><td>NONE</td><td>Any change allowed</td><td>Development only</td></tr>
            </tbody></table>
            <h4>Log Compaction</h4>
            <p>Instead of deleting old messages by time/size, compaction keeps only the <strong>latest value per key</strong>. Use cases:</p>
            <ul>
                <li>Changelog topics (latest state per entity)</li>
                <li>KTable materialization (rebuild state from compacted topic)</li>
                <li>Configuration distribution (latest config per key)</li>
            </ul>
            <p>Tombstone: a message with null value deletes the key from the compacted log after a retention period.</p>`
        },
        {
            title: 'Kafka Streams & Connect',
            content: `<h4>Kafka Streams</h4>
            <p>A Java/Scala library for building stateful stream processing applications that read from and write to Kafka topics.</p>
            <ul>
                <li><strong>KStream</strong> — unbounded stream of events (each record is independent)</li>
                <li><strong>KTable</strong> — changelog stream representing latest value per key (like a materialized view)</li>
                <li><strong>Windowed aggregations</strong> — tumbling, hopping, sliding, session windows for time-based grouping</li>
                <li><strong>Interactive queries</strong> — query local state stores directly (no external DB needed)</li>
            </ul>
            <h4>Kafka Connect</h4>
            <p>Framework for streaming data between Kafka and external systems:</p>
            <ul>
                <li><strong>Source connectors</strong> — pull data INTO Kafka (Debezium CDC, JDBC, file)</li>
                <li><strong>Sink connectors</strong> — push data FROM Kafka (Elasticsearch, S3, database)</li>
                <li><strong>Transforms</strong> — modify messages in flight (rename fields, filter, route)</li>
                <li><strong>Exactly-once</strong> — Connect supports EOS for source connectors</li>
            </ul>`
        },
        {
            title: 'Production Operations',
            content: `<h4>Partition Count Selection</h4>
            <ul>
                <li>More partitions = more parallelism (max consumers = partition count)</li>
                <li>Rule of thumb: target throughput / per-partition throughput. E.g., 100K msg/s / 20K per partition = 5 partitions minimum</li>
                <li>Over-partition slightly (can't decrease later without recreation)</li>
                <li>Too many partitions: more memory, longer leader elections, more rebalancing time</li>
            </ul>
            <h4>Key Operational Metrics</h4>
            <table><thead><tr><th>Metric</th><th>Alert When</th><th>Meaning</th></tr></thead><tbody>
                <tr><td>Consumer lag</td><td>> 10K messages sustained</td><td>Consumers falling behind — scale out or investigate slowness</td></tr>
                <tr><td>Under-replicated partitions</td><td>> 0</td><td>Follower can't keep up — broker issue, disk I/O, network</td></tr>
                <tr><td>ISR shrink rate</td><td>Increasing</td><td>Brokers losing sync — may indicate impending data loss risk</td></tr>
                <tr><td>Request queue size</td><td>> 100</td><td>Broker overloaded — add brokers or reduce load</td></tr>
            </tbody></table>
            <h4>Configuration Essentials</h4>
            <ul>
                <li><code>replication.factor=3</code> — survive 1 broker failure</li>
                <li><code>min.insync.replicas=2</code> — with acks=all, ensures writes survive 1 failure</li>
                <li><code>unclean.leader.election.enable=false</code> — never elect an out-of-sync replica (prevents data loss)</li>
            </ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Too few partitions</strong> — limits consumer parallelism. Can't add consumers beyond partition count.</li>
                <li><strong>Auto-commit offsets</strong> — message processed after commit = lost on crash. Use manual commit after processing.</li>
                <li><strong>No consumer lag monitoring</strong> — consumers silently fall behind until processing is hours/days late.</li>
                <li><strong>Random partition keys</strong> — loses ordering guarantees. Messages for the same entity should share a key.</li>
                <li><strong>Unbounded consumer processing</strong> — slow processing blocks the poll loop, triggering rebalance (max.poll.interval.ms exceeded).</li>
                <li><strong>No schema evolution strategy</strong> — breaking schema changes crash all consumers. Use Schema Registry with compatibility modes.</li>
                <li><strong>Single partition for ordering</strong> — sacrifices all parallelism. Instead, partition by entity ID for per-entity ordering with parallelism.</li>
                <li><strong>No dead-letter topic</strong> — poison messages block the consumer forever. Route persistently failing messages to a DLT.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li>Understanding that Kafka is a distributed LOG, not a queue (messages persist, multiple consumers read independently)</li>
                    <li>Partition key design: same key = same partition = ordering. This is THE architectural decision in Kafka.</li>
                    <li>Consumer group mechanics: partition assignment, rebalancing, offset management</li>
                    <li>Exactly-once semantics: know the limitations (within Kafka only) and the implementation (transactions)</li>
                    <li>Production awareness: consumer lag, under-replicated partitions, min.insync.replicas</li>
                    <li>Schema evolution: backward/forward compatibility with Schema Registry</li>
                    <li>When NOT to use Kafka: low-throughput, simple pub/sub, request-reply (use RabbitMQ or NATS instead)</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Kafka is a distributed commit log — messages persist and are replayable. This is fundamentally different from queues.</li>
                <li>Partition key design determines ordering AND parallelism. Use entity ID (orderId, customerId) as the key.</li>
                <li>Consumer groups enable independent consumption: analytics, notifications, and search all read the same events.</li>
                <li>Exactly-once within Kafka: idempotent producer + transactions + read_committed isolation. Beyond Kafka: use application-level idempotency.</li>
                <li>Schema Registry prevents breaking changes from reaching production. Enforce BACKWARD or FULL compatibility.</li>
                <li>Log compaction keeps the latest value per key — perfect for state change topics and KTable materialization.</li>
                <li>Monitor: consumer lag (are consumers keeping up?), under-replicated partitions (is replication healthy?), ISR count (can we survive a failure?).</li>
                <li>Kafka excels at high-throughput event streaming with replay. Use RabbitMQ for work distribution, NATS for low-latency cloud-native messaging.</li>
            </ul>`
        }
    ],
    questions: [
        {
            question: 'How do Kafka consumer groups work? What happens during a rebalance?',
            difficulty: 'medium',
            answer: `<p>A <strong>consumer group</strong> distributes topic partitions among its members. Each partition is assigned to exactly one consumer. When a consumer joins or leaves, a <strong>rebalance</strong> redistributes partitions.</p>
            <p><strong>During rebalance (eager protocol):</strong> All consumers release all partitions → group coordinator reassigns → consumers resume. Processing pauses for all members during this window.</p>
            <p><strong>Cooperative sticky rebalancing (modern):</strong> Only affected partitions are revoked/reassigned. Other consumers continue processing uninterrupted. Significantly reduces downtime.</p>
            <p><strong>Triggers:</strong> Consumer joins/leaves, consumer crashes (missed heartbeat), new partitions added, session.timeout.ms exceeded.</p>`,
            interviewTip: 'Mention cooperative sticky as the modern default (Kafka 3.0+). It eliminates the stop-the-world pause. Also mention max.poll.interval.ms — if processing takes longer than this, the consumer is kicked from the group.',
            followUp: ['What is the difference between session.timeout.ms and max.poll.interval.ms?', 'How does the group coordinator work?', 'Can you have more consumers than partitions?'],
            seniorPerspective: 'I always configure cooperative sticky rebalancing and size max.poll.interval.ms based on my worst-case processing time plus buffer. The most common production issue: slow processing exceeds the poll interval, triggering unnecessary rebalances.',
            architectPerspective: 'Partition count is an architectural decision that determines maximum parallelism. I choose partition count based on target throughput / per-consumer throughput, with 2x headroom for growth. Reducing partitions requires topic recreation — oversize initially.'
        },
        {
            question: 'Explain Kafka exactly-once semantics. What are its limitations?',
            difficulty: 'hard',
            answer: `<p>Kafka EOS combines three mechanisms:</p>
            <ol>
                <li><strong>Idempotent producer</strong> — sequence numbers per partition prevent duplicate writes from retries</li>
                <li><strong>Transactions</strong> — atomic writes across partitions + consumer offset commit in one transaction</li>
                <li><strong>Consumer isolation</strong> — <code>read_committed</code> only sees committed transactional messages</li>
            </ol>
            <p><strong>Limitations:</strong></p>
            <ul>
                <li>Only works within the Kafka ecosystem (read from Kafka → write to Kafka)</li>
                <li>External writes (database, HTTP) are NOT covered — need application-level idempotency</li>
                <li>Performance overhead: transactions add latency (~50-100ms per transaction commit)</li>
                <li>Requires unique transactional.id per producer instance — complicates scaling</li>
            </ul>`,
            interviewTip: 'The key limitation to emphasize: EOS is end-to-end only within Kafka. The moment you write to a database or call an external API, you are back to at-least-once and must handle duplicates yourself.',
            followUp: ['How do transactions work internally?', 'What is the performance cost of EOS?', 'How do you achieve exactly-once when writing to a database from Kafka?'],
            seniorPerspective: 'In practice, I use Kafka transactions for stream processing (Kafka → transform → Kafka) and at-least-once + idempotent consumers for anything that writes externally. The transactional outbox pattern bridges the two worlds.',
            architectPerspective: 'True end-to-end exactly-once across systems requires the outbox pattern or CDC. Kafka transactions solve the Kafka-internal case cleanly; the Kafka → external boundary always needs application-level deduplication.'
        },
        {
            question: 'How do you choose the partition key for a Kafka topic? What are the trade-offs?',
            difficulty: 'medium',
            answer: `<p>The partition key determines which partition a message goes to (via hash). This is the single most important design decision in Kafka because it controls both <strong>ordering</strong> and <strong>parallelism</strong>.</p>
            <p><strong>Guidelines:</strong></p>
            <ul>
                <li>Use entity ID (orderId, customerId, accountId) — ensures all events for one entity are ordered</li>
                <li>High cardinality — the key must distribute evenly across partitions (avoid hot partitions)</li>
                <li>Stable — the key should not change for an entity's lifecycle</li>
            </ul>
            <p><strong>Trade-offs:</strong></p>
            <ul>
                <li>Too specific (orderId): maximum parallelism, but related entities (same customer's orders) may be processed out of order relative to each other</li>
                <li>Too broad (customerId): all customer events ordered, but one active customer can create a hot partition</li>
                <li>Null key: round-robin distribution (max throughput), no ordering guarantee at all</li>
            </ul>`,
            interviewTip: 'Frame it as a trade-off between ordering scope and parallelism. "Ordering is per-partition only, so your key defines your ordering boundary." Then discuss hot partition risk with skewed key distributions.',
            followUp: ['What happens if one key has 100x more messages than others?', 'Can you change the partition key after topic creation?', 'How does round-robin work without a key?'],
            seniorPerspective: 'I choose the key based on the consumer use case: if the consumer needs all events for an order in sequence, key by orderId. If it needs all events for a customer, key by customerId. Different topics can use different keys for the same events.',
            architectPerspective: 'Partition key design reflects your consistency boundary. It answers: "What is the unit of ordered processing?" This is an architectural decision that is very expensive to change — it requires topic recreation and consumer rewrite.'
        },
        {
            question: 'What is log compaction and when would you use it?',
            difficulty: 'medium',
            answer: `<p><strong>Log compaction</strong> retains only the latest message for each key, deleting older values. The topic becomes a <strong>changelog</strong> — a snapshot of the latest state per key.</p>
            <p><strong>Use cases:</strong></p>
            <ul>
                <li>User profile updates — only the latest profile matters</li>
                <li>KTable state stores — rebuild application state from compacted topic</li>
                <li>Configuration distribution — latest config per service</li>
                <li>Database CDC changelog — latest row state per primary key</li>
            </ul>
            <p><strong>How it works:</strong> Background thread scans the log, keeps only the latest value per key. A <strong>tombstone</strong> (null value) marks a key for deletion after <code>delete.retention.ms</code>.</p>
            <p><strong>vs Retention:</strong> Time-based retention deletes ALL messages after a period. Compaction selectively keeps the latest per key regardless of age.</p>`,
            interviewTip: 'Compare with event sourcing: compacted topics give you "latest state" while un-compacted topics give you "full history." Both have their place depending on whether consumers need the journey or just the destination.',
            followUp: ['How do tombstones work?', 'Can you combine compaction with time-based retention?', 'What is the performance impact of compaction?'],
            seniorPerspective: 'I use compacted topics as the state store backing for Kafka Streams KTables and for any scenario where a new consumer needs the current state without replaying the entire history.',
            architectPerspective: 'Log compaction enables the "log as database" pattern — consumers can materialize any read model from a compacted changelog topic. This is the foundation of CQRS with Kafka as the event store.'
        },
        {
            question: 'How do you monitor Kafka in production? What are the critical metrics?',
            difficulty: 'hard',
            answer: `<p><strong>Critical metrics:</strong></p>
            <ul>
                <li><strong>Consumer lag</strong> — messages produced but not yet consumed. Growing lag = consumer can't keep up. Alert at sustained lag > threshold.</li>
                <li><strong>Under-replicated partitions</strong> — followers behind the leader. Alert at > 0 (data loss risk if leader fails).</li>
                <li><strong>ISR shrink rate</strong> — replicas falling out of sync. Indicates broker health issues.</li>
                <li><strong>Produce/consume request latency</strong> — p99 latency for client operations.</li>
                <li><strong>Active controller count</strong> — must be exactly 1. Zero = no leader election possible.</li>
                <li><strong>Disk usage</strong> — per broker. Full disk = broker stops accepting writes.</li>
            </ul>
            <p><strong>Tools:</strong> Prometheus + JMX exporter for metrics, Burrow for consumer lag, Cruise Control for auto-rebalancing, Confluent Control Center for dashboards.</p>`,
            interviewTip: 'Consumer lag is THE metric that tells you if your system is healthy. If you can only monitor one thing, monitor lag. Under-replicated partitions is the durability signal — it tells you if you can survive a broker failure.',
            followUp: ['How do you debug increasing consumer lag?', 'What is Cruise Control?', 'How do you handle a full disk on a broker?'],
            seniorPerspective: 'My alerting hierarchy: page on under-replicated partitions > 0 (data loss risk), alert on consumer lag growth trend (capacity issue), and dashboard everything else. I run Cruise Control for automatic partition rebalancing after broker additions.',
            architectPerspective: 'Kafka monitoring is a reliability engineering concern. SLOs for Kafka: produce latency p99 < 100ms, consumer lag < 30 seconds for real-time topics, zero under-replicated partitions. These map to business SLAs for event freshness.'
        },
        {
            question: 'Compare Kafka Streams vs consuming with a standard consumer. When would you use each?',
            difficulty: 'advanced',
            answer: `<p><strong>Standard consumer:</strong> You write the processing logic, state management, error handling, and scaling yourself. Maximum control, maximum boilerplate.</p>
            <p><strong>Kafka Streams:</strong> A library that provides stateful stream processing (joins, aggregations, windows) with built-in state stores, fault tolerance, and exactly-once.</p>
            <p><strong>Choose standard consumer when:</strong></p>
            <ul>
                <li>Simple event processing (transform and forward, no state)</li>
                <li>Writing to external systems (database, API)</li>
                <li>Non-JVM languages (.NET, Python)</li>
                <li>Need full control over commit semantics</li>
            </ul>
            <p><strong>Choose Kafka Streams when:</strong></p>
            <ul>
                <li>Stateful processing (aggregations, joins, windowed computations)</li>
                <li>Need KTable materialization (latest state per key)</li>
                <li>Stream-stream or stream-table joins</li>
                <li>Want built-in exactly-once and state management</li>
            </ul>`,
            interviewTip: 'For .NET teams, mention that Kafka Streams is JVM-only. Alternatives for .NET: Confluent ksqlDB, custom stateful processing with consumer + local state (RocksDB or Redis), or Apache Flink.',
            followUp: ['What is ksqlDB and how does it compare?', 'How does Kafka Streams handle state recovery?', 'What about Apache Flink vs Kafka Streams?'],
            seniorPerspective: 'For .NET shops, I typically use a standard consumer with a Redis-backed state store for aggregations. It is more work than Kafka Streams but gives me control and avoids JVM dependency.',
            architectPerspective: 'Kafka Streams is excellent for JVM teams doing event-driven architectures. For polyglot environments, consider ksqlDB (SQL over streams) or Apache Flink (language-agnostic, more powerful windowing).'
        },
        {
            question: 'How do consumer groups and partition assignment work in Kafka? What happens during a rebalance?',
            difficulty: 'hard',
            answer: `<p>A <strong>consumer group</strong> is a set of consumers that cooperate to consume a topic. Each partition is assigned to exactly one consumer within the group, enabling parallel processing. Kafka's group coordinator (a broker) manages assignments.</p>
            <h4>Partition Assignment Strategies:</h4>
            <ul>
                <li><strong>Range</strong>: Assigns contiguous partitions to each consumer (can cause imbalance with few partitions).</li>
                <li><strong>RoundRobin</strong>: Distributes partitions evenly across consumers, regardless of topic.</li>
                <li><strong>Sticky</strong>: Like RoundRobin but minimizes partition movement during rebalances.</li>
                <li><strong>CooperativeSticky</strong>: Incremental rebalance — only moves partitions that must move, others keep processing.</li>
            </ul>
            <h4>Rebalance Process:</h4>
            <p>A rebalance triggers when consumers join/leave the group or subscriptions change. During an <strong>eager rebalance</strong>, ALL consumers stop processing, revoke all partitions, and reassign from scratch — causing a processing gap. <strong>Cooperative rebalancing</strong> (incremental) only revokes the partitions that need to move, so the majority keep processing uninterrupted.</p>
            <p><strong>Static group membership</strong> (group.instance.id) prevents rebalances from short-lived disconnects — the coordinator waits for session.timeout before declaring the consumer dead.</p>`,
            bestPractices: ['Use CooperativeSticky assignor to minimize stop-the-world rebalances', 'Set session.timeout.ms high enough to avoid false rebalances from GC pauses', 'Use static group membership for stable consumers (prevents unnecessary rebalances on restarts)', 'Monitor consumer lag per partition to detect assignment imbalance'],
            commonMistakes: ['Using eager rebalance in high-throughput systems (causes processing gaps on every scale event)', 'Too many consumers in a group (max useful = number of partitions)', 'Not handling partition revocation properly (uncommitted offsets lost)', 'Ignoring rebalance storms during rolling deployments (use static membership)'],
            interviewTip: 'Explain the key constraint: partitions are the unit of parallelism, so you can never have more active consumers than partitions. Then contrast eager vs cooperative rebalancing — the cooperative protocol is the modern answer to the "rebalance storm" problem.',
            followUp: ['What is consumer lag and how do you monitor it?', 'How does static group membership help during deployments?', 'What is the max parallelism for a consumer group?'],
            seniorPerspective: 'Rebalances are the single biggest source of Kafka consumer operational pain. I always configure CooperativeSticky + static group membership for production consumers, and I monitor rebalance frequency as a key health metric. Rolling deployments without static membership cause a cascade of rebalances that can take minutes to settle.',
            architectPerspective: 'Partition count is an architectural decision that caps parallelism. I size partitions based on target throughput per consumer and expected group size, with headroom for scaling. The rebalance protocol choice (cooperative vs eager) is equally architectural — it determines whether scaling events cause processing gaps or are seamless.'
        },
        {
            question: 'How do you implement exactly-once processing semantics with Kafka?',
            difficulty: 'expert',
            answer: `<p><strong>Exactly-once semantics (EOS)</strong> in Kafka means each message is processed exactly once end-to-end, even under failures. It combines three mechanisms:</p>
            <h4>1. Idempotent Producer (within a partition):</h4>
            <ul>
                <li>Setting <code>enable.idempotence=true</code> assigns a producer ID and sequence number to each message.</li>
                <li>Broker deduplicates retries — same PID + sequence = already written, silently discarded.</li>
                <li>Prevents duplicates from network retries but only within a single partition and producer session.</li>
            </ul>
            <h4>2. Transactional Producer (across partitions):</h4>
            <ul>
                <li>Setting <code>transactional.id</code> enables atomic writes across multiple partitions/topics.</li>
                <li>Producer calls <code>beginTransaction()</code>, sends messages, then <code>commitTransaction()</code> or <code>abortTransaction()</code>.</li>
                <li>Consumers with <code>isolation.level=read_committed</code> only see committed messages.</li>
            </ul>
            <h4>3. Consume-Transform-Produce Pattern:</h4>
            <ul>
                <li>Read from input topic, process, write to output topic, and commit consumer offsets — all in one atomic transaction.</li>
                <li><code>sendOffsetsToTransaction()</code> ties the offset commit to the same transaction as the output writes.</li>
            </ul>
            <p><strong>Trade-offs:</strong> EOS adds latency (~100ms for transaction commit), reduces throughput (batches wait for commit), and requires careful configuration of transaction timeouts and consumer isolation levels.</p>`,
            bestPractices: ['Use EOS for financial/critical data pipelines where duplicates cause business harm', 'Keep transaction scope narrow (single consume-transform-produce cycle)', 'Set transaction.timeout.ms shorter than consumer max.poll.interval.ms to avoid zombie transactions', 'Use read_committed isolation on downstream consumers to avoid reading uncommitted data'],
            commonMistakes: ['Enabling EOS for all topics regardless of need (unnecessary latency/throughput cost)', 'Long-running transactions that exceed timeout and get aborted by the coordinator', 'Mixing transactional and non-transactional producers writing to the same topic', 'Forgetting isolation.level on consumers (they see uncommitted messages, defeating the purpose)'],
            interviewTip: 'Structure as three layers: idempotent producer (partition-level dedup), transactional producer (cross-partition atomicity), and the consume-transform-produce pattern (end-to-end EOS). Mention the performance trade-off and when NOT to use it.',
            followUp: ['What is a zombie instance and how do transactions prevent it?', 'How does EOS interact with consumer group rebalancing?', 'When is at-least-once with idempotent consumers preferable to EOS?'],
            seniorPerspective: 'I reserve true EOS for pipelines where duplicates have financial or correctness consequences — payment processing, inventory updates, ledger entries. For analytics and metrics, at-least-once with idempotent consumers (dedup at the application layer) is cheaper and simpler.',
            architectPerspective: 'EOS is Kafka solving the "dual write" problem at the platform level. The architectural decision is where to put the exactly-once boundary: Kafka-native EOS for consume-transform-produce chains within Kafka, versus application-level idempotency for systems that span Kafka and external databases. I typically combine both: EOS within the Kafka pipeline and idempotent writes at the boundary where data leaves Kafka for a database.'
        }
    ]
});
