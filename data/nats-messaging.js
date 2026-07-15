'use strict';

PageData.register('nats-messaging', {
    title: 'NATS & JetStream',
    description: 'NATS core messaging, JetStream persistence, subject hierarchy, queue groups, request-reply, key-value store, and comparison with Kafka/RabbitMQ for cloud-native applications.',
    sections: [
        {
            title: 'Introduction',
            content: `<p><strong>NATS</strong> is a high-performance, cloud-native messaging system designed for simplicity, speed, and resilience. It is the messaging backbone for many cloud-native platforms (Kubernetes, Synadia Cloud, Minio).</p>
            <p><strong>Core NATS</strong> provides at-most-once pub/sub with no persistence — ultra-low latency, fire-and-forget. <strong>JetStream</strong> adds persistence, exactly-once delivery, and stream processing on top of the same infrastructure.</p>
            <p>NATS is increasingly popular for microservices communication where Kafka is overkill (low-volume, low-latency needs) and RabbitMQ is too complex (no infrastructure management desired).</p>`
        },
        {
            title: 'Architecture & Subject Hierarchy',
            mermaid: `graph TB
    subgraph NATSCluster["NATS Cluster (3 nodes)"]
        N1["NATS Server 1"]
        N2["NATS Server 2"]
        N3["NATS Server 3"]
    end
    subgraph Subjects["Subject Hierarchy"]
        S1["orders.placed"]
        S2["orders.shipped"]
        S3["orders.cancelled"]
        S4["payments.processed"]
        S5["payments.failed"]
    end
    subgraph Subscribers
        SUB1["orders.* subscriber<br/>(all order events)"]
        SUB2["orders.placed subscriber<br/>(specific event)"]
        SUB3["> subscriber<br/>(all events - monitoring)"]
    end
    N1 --- N2 --- N3
    S1 & S2 & S3 --> SUB1
    S1 --> SUB2
    S1 & S2 & S3 & S4 & S5 --> SUB3`,
            content: `<h4>Subject-Based Addressing</h4>
            <p>NATS uses dot-separated subjects for message routing. Wildcards enable flexible subscriptions:</p>
            <ul>
                <li><code>orders.placed</code> — specific subject</li>
                <li><code>orders.*</code> — matches one token: orders.placed, orders.shipped (not orders.us.placed)</li>
                <li><code>orders.></code> — matches one or more tokens: orders.placed, orders.us.placed, orders.eu.cancelled</li>
            </ul>
            <h4>Core NATS Characteristics</h4>
            <ul>
                <li><strong>At-most-once</strong> — no persistence, no replay. If subscriber is offline, message is lost.</li>
                <li><strong>Ultra-low latency</strong> — typically sub-millisecond for pub/sub.</li>
                <li><strong>No broker storage</strong> — messages exist only in transit (pure pass-through).</li>
                <li><strong>Auto-discovery</strong> — clients discover cluster topology; reconnect automatically on failure.</li>
            </ul>`
        },
        {
            title: 'JetStream — Persistence Layer',
            content: `<p><strong>JetStream</strong> adds persistence to NATS: messages are stored in streams, consumers track their position, and delivery guarantees are configurable.</p>
            <h4>Key Concepts</h4>
            <ul>
                <li><strong>Stream</strong> — persistent, ordered, replayable storage of messages matching a subject filter.</li>
                <li><strong>Consumer</strong> — tracks position (like Kafka consumer group). Push or pull delivery.</li>
                <li><strong>Ack Policy</strong> — explicit ack, all (ack all up to this message), none (at-most-once).</li>
                <li><strong>Retention</strong> — limits (max messages, max bytes, max age) or work-queue (delete on ack).</li>
                <li><strong>Replay Policy</strong> — all (replay from start), last (latest per subject), new (only new messages).</li>
            </ul>
            <h4>JetStream vs Kafka</h4>
            <table><thead><tr><th>Aspect</th><th>JetStream</th><th>Kafka</th></tr></thead><tbody>
                <tr><td>Deployment</td><td>Single binary, embeddable</td><td>Multi-component (brokers + ZK/KRaft)</td></tr>
                <tr><td>Latency</td><td>Sub-ms (core NATS), low-ms (JetStream)</td><td>Low-ms to tens-ms</td></tr>
                <tr><td>Throughput</td><td>Millions msg/s (core), moderate with persistence</td><td>Millions msg/s sustained</td></tr>
                <tr><td>Ordering</td><td>Per-stream or per-subject within stream</td><td>Per-partition</td></tr>
                <tr><td>Consumer model</td><td>Push or Pull, per-message ack</td><td>Pull only, offset-based</td></tr>
                <tr><td>Operations</td><td>Very simple (single binary)</td><td>Complex (multi-broker, ZK/KRaft)</td></tr>
                <tr><td>Best for</td><td>Cloud-native microservices, low-latency</td><td>High-throughput event streaming, analytics</td></tr>
            </tbody></table>`
        },
        {
            title: 'Queue Groups & Request-Reply',
            content: `<h4>Queue Groups (Load Balancing)</h4>
            <p>Multiple subscribers with the same queue group name form a competing consumer group. Each message is delivered to exactly ONE member of the group — no configuration needed beyond the group name.</p>
            <h4>Request-Reply Pattern</h4>
            <p>NATS natively supports synchronous request-reply over messaging — the client publishes a request and waits for a response on an auto-generated inbox subject.</p>`,
            code: `// .NET NATS Client — Core pub/sub, queue groups, request-reply
using NATS.Client.Core;
using NATS.Client.JetStream;

// Connect to NATS cluster
await using var nats = new NatsConnection(new NatsOpts
{
    Url = "nats://localhost:4222",
    Name = "order-service"
});

// --- Core Pub/Sub (at-most-once) ---
// Publisher
await nats.PublishAsync("orders.placed", new OrderPlaced
{
    OrderId = "ORD-123",
    CustomerId = "CUST-456",
    Total = 99.99m
});

// Subscriber (receives all orders.* events)
await foreach (var msg in nats.SubscribeAsync<OrderEvent>("orders.*"))
{
    Console.WriteLine($"Received: {msg.Subject} -> {msg.Data}");
}

// --- Queue Group (load balancing) ---
// Multiple instances with same queue group = competing consumers
await foreach (var msg in nats.SubscribeAsync<OrderPlaced>(
    "orders.placed", queueGroup: "order-processors"))
{
    await ProcessOrder(msg.Data);
    // Only ONE instance in the group receives each message
}

// --- Request-Reply (synchronous RPC) ---
// Requester
var reply = await nats.RequestAsync<GetPriceRequest, PriceResponse>(
    "pricing.get", new GetPriceRequest { Sku = "SKU-001" },
    cancellationToken: cts.Token);
Console.WriteLine($"Price: {reply.Data.Amount}");

// Responder (service that handles pricing requests)
await foreach (var msg in nats.SubscribeAsync<GetPriceRequest>("pricing.get"))
{
    var price = await _pricingService.GetPrice(msg.Data.Sku);
    await msg.ReplyAsync(new PriceResponse { Amount = price });
}`,
            language: 'csharp'
        },
        {
            title: 'JetStream Key-Value & Object Store',
            content: `<p>JetStream provides higher-level abstractions built on top of streams:</p>
            <h4>Key-Value Store</h4>
            <ul>
                <li>Distributed key-value store backed by a JetStream stream</li>
                <li>Operations: get, put, delete, watch (real-time change notifications)</li>
                <li>History: configurable number of revisions per key</li>
                <li>Use cases: feature flags, configuration distribution, service discovery, leader election</li>
            </ul>
            <h4>Object Store</h4>
            <ul>
                <li>Large object/file storage chunked across stream messages</li>
                <li>Supports files larger than the max message size</li>
                <li>Use cases: binary distribution, configuration bundles, shared artifacts</li>
            </ul>`,
            code: `// JetStream Key-Value Store
var js = new NatsJSContext(nats);
var kv = await js.CreateKeyValueStoreAsync(new NatsKVConfig("config")
{
    History = 5,  // Keep last 5 revisions per key
    MaxBytes = 1024 * 1024 * 10  // 10MB max store size
});

// Put/Get
await kv.PutAsync("feature.dark-mode", "enabled");
var entry = await kv.GetEntryAsync<string>("feature.dark-mode");
Console.WriteLine($"Value: {entry.Value}, Revision: {entry.Revision}");

// Watch for changes (real-time)
await foreach (var change in kv.WatchAsync<string>("feature.*"))
{
    Console.WriteLine($"Key {change.Key} changed to {change.Value}");
    // Triggers on any key matching feature.*
    await ApplyFeatureFlag(change.Key, change.Value);
}

// Delete (creates a tombstone)
await kv.DeleteAsync("feature.dark-mode");`,
            language: 'csharp'
        },
        {
            title: 'Leaf Nodes & Multi-Cloud',
            mermaid: `graph TB
    subgraph Cloud1["AWS Region (Main Cluster)"]
        HUB1["NATS Hub 1"]
        HUB2["NATS Hub 2"]
        HUB3["NATS Hub 3"]
    end
    subgraph Cloud2["Azure Region (Leaf)"]
        LEAF1["Leaf Node 1"]
        LEAF2["Leaf Node 2"]
        SVC1["Services (Azure)"]
    end
    subgraph Edge["Edge / On-Prem (Leaf)"]
        LEAF3["Leaf Node"]
        IOT["IoT Devices"]
    end
    HUB1 --- HUB2 --- HUB3
    LEAF1 & LEAF2 -->|"Leaf Connection<br/>(filtered subjects)"| HUB1
    LEAF3 -->|"Leaf Connection"| HUB2
    SVC1 --> LEAF1 & LEAF2
    IOT --> LEAF3`,
            content: `<p><strong>Leaf Nodes</strong> extend NATS clusters across networks, clouds, and edge locations:</p>
            <ul>
                <li>Connect to hub cluster over a single TCP connection (firewall-friendly)</li>
                <li>Filter which subjects flow between hub and leaf (security + bandwidth)</li>
                <li>Local subscribers see only relevant messages (subject-based isolation)</li>
                <li>Enable multi-cloud and hybrid architectures with unified messaging</li>
            </ul>
            <p><strong>Use cases:</strong> multi-region deployments, edge computing (IoT devices), connecting on-premises to cloud, security isolation between environments.</p>`
        },
        {
            title: 'NATS vs Kafka vs RabbitMQ',
            content: `<table><thead><tr><th>Dimension</th><th>NATS + JetStream</th><th>Kafka</th><th>RabbitMQ</th></tr></thead><tbody>
                <tr><td>Model</td><td>Subject-based pub/sub + persistent streams</td><td>Distributed commit log</td><td>Message broker (exchanges/queues)</td></tr>
                <tr><td>Latency</td><td>Sub-ms (core), low-ms (JetStream)</td><td>Low-ms</td><td>Low-ms</td></tr>
                <tr><td>Throughput</td><td>Millions/s (core), moderate with persistence</td><td>Millions/s sustained</td><td>Tens of thousands/s</td></tr>
                <tr><td>Persistence</td><td>Optional (JetStream)</td><td>Always (distributed log)</td><td>Optional (durable queues)</td></tr>
                <tr><td>Operations</td><td>Single binary, minimal config</td><td>Complex (multi-component)</td><td>Moderate (Erlang, clustering)</td></tr>
                <tr><td>Request-Reply</td><td>Built-in (native)</td><td>Not native (awkward)</td><td>Supported (RPC pattern)</td></tr>
                <tr><td>KV Store</td><td>Built-in (JetStream KV)</td><td>No (use KTable/state store)</td><td>No</td></tr>
                <tr><td>Multi-tenancy</td><td>Accounts + subject isolation</td><td>ACLs, quotas</td><td>Virtual hosts</td></tr>
                <tr><td>Best for</td><td>Cloud-native microservices, low-latency, edge</td><td>Event streaming, analytics, high-volume</td><td>Enterprise messaging, complex routing</td></tr>
            </tbody></table>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Using core NATS for critical messages</strong> — core NATS is at-most-once. Use JetStream if you cannot afford message loss.</li>
                <li><strong>Not using queue groups</strong> — without a queue group, every subscriber gets every message (fan-out). For work distribution, always specify a queue group.</li>
                <li><strong>Ignoring slow consumers</strong> — NATS disconnects slow consumers to protect the cluster. Handle slow consumer events and implement backpressure.</li>
                <li><strong>Treating NATS like Kafka</strong> — NATS is simpler but different. Subjects ≠ topics; no concept of partitions; ordering is per-stream, not per-partition.</li>
                <li><strong>No reconnection handling</strong> — NATS auto-reconnects but subscribers must re-subscribe. Handle disconnection events.</li>
                <li><strong>Overly broad wildcards</strong> — subscribing to ">" on a busy cluster floods the consumer with irrelevant messages.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li>Understanding when NATS is appropriate vs Kafka/RabbitMQ (scale, latency, persistence needs)</li>
                    <li>Subject hierarchy design for microservices (team.service.event pattern)</li>
                    <li>Queue groups as zero-config load balancing (vs Kafka partition assignment complexity)</li>
                    <li>JetStream for persistence vs core NATS for fire-and-forget</li>
                    <li>Request-reply as native RPC (vs building request-reply over Kafka which is awkward)</li>
                    <li>Operational simplicity: single binary, no ZooKeeper, minimal configuration</li>
                    <li>Leaf nodes for multi-cloud / edge connectivity</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Core NATS: ultra-fast, at-most-once pub/sub. JetStream: adds persistence, replay, and delivery guarantees.</li>
                <li>Subject hierarchy (dot-separated + wildcards) provides flexible, zero-config message routing.</li>
                <li>Queue groups give competing consumer load balancing with no configuration — just name the group.</li>
                <li>Request-reply is native to NATS — built-in synchronous RPC over messaging with timeouts.</li>
                <li>JetStream KV store eliminates the need for a separate distributed config store (etcd, Consul).</li>
                <li>Leaf nodes enable multi-cloud/edge architectures over a single messaging fabric.</li>
                <li>Choose NATS when: cloud-native, low-latency, operational simplicity, request-reply needed.</li>
                <li>Choose Kafka when: high-throughput event streaming, replay/audit requirements, complex stream processing.</li>
            </ul>`
        }
    ],
    questions: [
        {
            question: 'What is NATS and how does it differ from Kafka and RabbitMQ?',
            difficulty: 'medium',
            answer: `<p><strong>NATS</strong> is a lightweight, high-performance messaging system with subject-based routing. Key differences:</p>
            <ul>
                <li><strong>vs Kafka:</strong> NATS is simpler to operate (single binary), has built-in request-reply, and supports both at-most-once (core) and persistent messaging (JetStream). Kafka has higher sustained throughput and native stream processing (Kafka Streams).</li>
                <li><strong>vs RabbitMQ:</strong> NATS has no complex exchange/binding configuration — just publish to a subject and subscribe. Queue groups replace competing consumers with zero config. NATS is faster but RabbitMQ has more routing features.</li>
            </ul>
            <p><strong>Choose NATS for:</strong> microservices communication, request-reply RPC, low-latency pub/sub, operational simplicity, edge/IoT.</p>
            <p><strong>Choose Kafka for:</strong> high-volume event streaming, event sourcing, complex stream processing, long-retention replay.</p>`,
            interviewTip: 'Position NATS as the "cloud-native default" for service-to-service messaging — simple, fast, and operationally lightweight. Kafka is for when you need a distributed log with replay and processing guarantees.',
            followUp: ['When would you use both NATS and Kafka together?', 'How does JetStream compare to Kafka for persistence?'],
            seniorPerspective: 'I reach for NATS when building a new microservices system from scratch. The operational simplicity (single binary, no ZooKeeper) and built-in request-reply save weeks of infrastructure work compared to Kafka.',
            architectPerspective: 'NATS fills the "lightweight messaging" niche perfectly. Many systems use NATS for synchronous inter-service communication (request-reply) and Kafka for async event streaming (audit, analytics, cross-domain events).'
        },
        {
            question: 'Explain NATS subject hierarchy and wildcards. How would you design subjects for a microservices architecture?',
            difficulty: 'medium',
            answer: `<p>NATS subjects are dot-separated strings with two wildcard types:</p>
            <ul>
                <li><code>*</code> — matches exactly one token: <code>orders.*</code> matches orders.placed, orders.shipped (not orders.us.placed)</li>
                <li><code>></code> — matches one or more tokens: <code>orders.></code> matches orders.placed, orders.us.placed, orders.eu.cancelled</li>
            </ul>
            <p><strong>Design pattern for microservices:</strong></p>
            <pre><code>{domain}.{entity}.{action}.{qualifier}

orders.order.placed
orders.order.shipped
payments.payment.processed
payments.payment.failed.insufficient-funds
inventory.stock.reserved
inventory.stock.released</code></pre>
            <p><strong>Subscription patterns:</strong></p>
            <ul>
                <li><code>orders.*.*</code> — all order events (order service team)</li>
                <li><code>*.*.placed</code> — all "placed" events across domains (analytics)</li>
                <li><code>></code> — everything (monitoring/debugging only)</li>
            </ul>`,
            interviewTip: 'Show you think about the hierarchy as a namespace that enables both specific and broad subscriptions. Good design means adding new event types requires no subscriber changes.',
            followUp: ['How do you handle subject naming conflicts between teams?', 'How does subject filtering work with leaf nodes?'],
            seniorPerspective: 'I establish a subject naming convention early: {team}.{entity}.{event}.{version}. Document it in an ADR. This prevents naming chaos as the system grows.',
            architectPerspective: 'Subject hierarchy IS your event catalog. Design it like an API — with governance, versioning (v1, v2 in the subject), and clear ownership per prefix.'
        },
        {
            question: 'What is the difference between Core NATS and JetStream? When do you need JetStream?',
            difficulty: 'easy',
            answer: `<p><strong>Core NATS:</strong> Pure pub/sub with no persistence. Messages exist only in transit. If no subscriber is listening, the message is gone. At-most-once delivery. Ultra-low latency (sub-millisecond).</p>
            <p><strong>JetStream:</strong> Persistence layer on top of NATS. Messages stored in streams. Consumers track position. Supports replay, at-least-once/exactly-once delivery, and acknowledgment.</p>
            <p><strong>You need JetStream when:</strong></p>
            <ul>
                <li>Messages cannot be lost (business-critical events)</li>
                <li>Consumers may be offline and need to catch up</li>
                <li>You need replay capability (new services reading historical events)</li>
                <li>You need delivery acknowledgment (at-least-once guarantee)</li>
                <li>You want key-value store or object store features</li>
            </ul>
            <p><strong>Core NATS is sufficient when:</strong> Real-time notifications, telemetry/metrics, request-reply RPC, any scenario where message loss is acceptable.</p>`,
            interviewTip: 'The simple rule: if losing a message would cause a business problem, use JetStream. If it would just mean a slightly delayed UI update, core NATS is fine.',
            followUp: ['Can you mix core NATS and JetStream in the same cluster?', 'What is the performance overhead of JetStream vs core NATS?'],
            seniorPerspective: 'I default to JetStream for all inter-service events (business events that trigger workflows) and core NATS for ephemeral communication (presence updates, typing indicators, real-time dashboard feeds).',
            architectPerspective: 'JetStream gives NATS the persistence story it was missing. Now a single NATS cluster can serve both real-time pub/sub AND durable event streaming, eliminating the need for two separate systems in many architectures.'
        },
        {
            question: 'How do NATS Queue Groups work? How do they compare to Kafka consumer groups?',
            difficulty: 'easy',
            answer: `<p><strong>NATS Queue Groups:</strong> Subscribers with the same queue group name automatically form a competing consumer group. NATS round-robins messages across group members. Zero configuration needed — just specify the group name when subscribing.</p>
            <p><strong>vs Kafka Consumer Groups:</strong></p>
            <ul>
                <li>NATS: per-message load balancing (any message to any member). No partitions.</li>
                <li>Kafka: per-partition assignment (one consumer owns specific partitions). Ordering per partition.</li>
                <li>NATS: instant rebalancing (no stop-the-world). Adding/removing a subscriber takes effect immediately.</li>
                <li>Kafka: rebalancing has a pause (especially eager protocol). Cooperative sticky reduces but doesn't eliminate it.</li>
                <li>NATS: no partition count ceiling on parallelism. Add unlimited subscribers.</li>
                <li>Kafka: max parallelism = partition count.</li>
            </ul>`,
            interviewTip: 'Queue groups are NATS secret weapon for simplicity. No partition planning, no rebalancing protocol, no max-consumer limits. Just subscribe with a group name. Highlight this simplicity vs Kafka complexity.',
            followUp: ['How does NATS handle a slow consumer in a queue group?', 'Can you have multiple queue groups on the same subject?'],
            seniorPerspective: 'Queue groups eliminate the Kafka partition-count-ceiling problem. I can scale consumers independently of any infrastructure configuration. Add an instance, it immediately shares the load.',
            architectPerspective: 'The trade-off: NATS queue groups sacrifice per-entity ordering (any consumer gets any message) for simplicity and unlimited scaling. If you need per-entity ordering, you must implement it at the application level or use JetStream with subject-per-entity.'
        },
        {
            question: 'How would you implement request-reply (RPC) over NATS? What are the advantages over HTTP?',
            difficulty: 'medium',
            answer: `<p>NATS request-reply is built into the protocol:</p>
            <ol>
                <li>Requester publishes to a subject with a unique reply inbox (auto-generated)</li>
                <li>Responder subscribes to the subject, processes the request, publishes the response to the reply inbox</li>
                <li>Requester receives the response with configurable timeout</li>
            </ol>
            <p><strong>Advantages over HTTP:</strong></p>
            <ul>
                <li><strong>Service discovery built-in</strong> — no need for DNS, load balancer, or service registry. Any subscriber on the subject can respond.</li>
                <li><strong>Load balancing built-in</strong> — combine with queue groups for automatic distribution.</li>
                <li><strong>Location transparency</strong> — requester doesn't know/care which instance responds.</li>
                <li><strong>Fan-out queries</strong> — scatter-gather: publish request, collect multiple responses (e.g., "which service has this item in stock?").</li>
                <li><strong>No connection management</strong> — single NATS connection serves all RPC calls (vs HTTP connection per service).</li>
            </ul>`,
            interviewTip: 'The killer feature is service discovery for free. With HTTP you need a load balancer, service registry, or DNS. With NATS request-reply, any instance subscribed to the subject can respond — zero infrastructure.',
            followUp: ['How do you handle timeouts in request-reply?', 'What is the scatter-gather pattern?', 'When is HTTP still better than NATS request-reply?'],
            seniorPerspective: 'I use NATS request-reply for internal service-to-service RPC and HTTP for external-facing APIs. The combination gives me zero-config service discovery internally while maintaining standard REST for public consumers.',
            architectPerspective: 'NATS request-reply eliminates the service mesh and discovery infrastructure for internal communication. In a Kubernetes environment, it can replace ClusterIP services + DNS for inter-service calls, simplifying the networking layer significantly.'
        },
        {
            question: 'What are NATS Leaf Nodes and how do they enable multi-cloud architectures?',
            difficulty: 'hard',
            answer: `<p><strong>Leaf Nodes</strong> connect separate NATS clusters (or single servers) to a hub cluster over a single TCP connection. They extend the messaging fabric across networks, clouds, and edge locations.</p>
            <p><strong>Key features:</strong></p>
            <ul>
                <li>Subject filtering — only specified subjects flow between hub and leaf (bandwidth + security)</li>
                <li>Account isolation — different security contexts for hub vs leaf</li>
                <li>Firewall-friendly — single outbound connection from leaf to hub (no inbound ports needed)</li>
                <li>Transparent to clients — publishers/subscribers don't know if they're on hub or leaf</li>
            </ul>
            <p><strong>Multi-cloud pattern:</strong></p>
            <ul>
                <li>Hub cluster in primary cloud (AWS)</li>
                <li>Leaf nodes in secondary cloud (Azure) — only relevant subjects bridged</li>
                <li>Leaf nodes at edge/on-prem — IoT data flows up, commands flow down</li>
                <li>Each leaf can be independently scaled and managed</li>
            </ul>`,
            interviewTip: 'Leaf nodes solve the multi-cloud messaging problem without complex VPN tunnels or cross-cloud networking. A single TCP connection per leaf node bridges entire messaging fabrics. This is unique to NATS.',
            followUp: ['How does subject filtering work on leaf nodes?', 'What happens if the leaf-to-hub connection drops?', 'How do you secure leaf node connections?'],
            seniorPerspective: 'I use leaf nodes to connect Kubernetes clusters across regions. Each regional cluster has its own NATS leaf that bridges only the subjects needed for cross-region communication. Local traffic stays local.',
            architectPerspective: 'Leaf nodes make NATS a natural fit for edge computing and multi-cloud. The hub-and-spoke messaging topology mirrors the organizational structure (central platform + distributed edge teams) and minimizes cross-network traffic.'
        },
        {
            question: 'How does NATS JetStream provide persistence and exactly-once delivery compared to core NATS?',
            difficulty: 'hard',
            answer: `<p><strong>Core NATS</strong> is fire-and-forget: messages exist only in transit. If no subscriber is listening, the message is lost. <strong>JetStream</strong> adds a persistence layer on top of core NATS, enabling durable streams, replay, and exactly-once semantics.</p>
            <h4>Key JetStream Capabilities:</h4>
            <ul>
                <li><strong>Streams</strong>: Persistent, append-only logs stored on the NATS server. Messages are retained by limits (time, count, size) or interest (until all consumers acknowledge).</li>
                <li><strong>Consumers</strong>: Named cursors over streams. Pull-based (consumer requests messages) or push-based (server pushes). Each consumer tracks its own position independently.</li>
                <li><strong>Acknowledgment</strong>: Messages require explicit Ack, Nak (retry), or InProgress (extend timeout). Double-ack window prevents redelivery of already-processed messages.</li>
                <li><strong>Exactly-once publishing</strong>: Using <code>Nats-Msg-Id</code> header for deduplication. JetStream detects and discards duplicate publishes within the dedup window.</li>
                <li><strong>Exactly-once consuming</strong>: Double-ack protocol — consumer acks with a sequence, server confirms the ack. Combined with idempotent processing, achieves end-to-end exactly-once.</li>
            </ul>
            <h4>Stream Replication:</h4>
            <p>JetStream streams replicate across cluster nodes (R=1, R=3, R=5). The Raft consensus protocol ensures consistency. With R=3, a stream tolerates one node failure without data loss.</p>`,
            bestPractices: ['Use JetStream for any workflow requiring guaranteed delivery or replay capability', 'Set appropriate retention policies (limits vs interest-based) per stream', 'Use pull consumers for batch processing (backpressure-friendly)', 'Enable message deduplication via Nats-Msg-Id for critical publishers'],
            commonMistakes: ['Using core NATS for critical messages that cannot be lost (no persistence)', 'Not acknowledging messages (causes redelivery storms and duplicate processing)', 'Setting dedup window too short (duplicates slip through under network partitions)', 'R=1 replication for production streams (single node failure loses data)'],
            interviewTip: 'Frame JetStream as "Kafka-lite built into NATS" — same concepts (persistent log, consumer offsets, replication) but with zero additional infrastructure. The key differentiator is operational simplicity: one binary, one protocol, embedded persistence.',
            followUp: ['How does JetStream compare to Kafka for event sourcing?', 'What is the difference between pull and push consumers?', 'How does the deduplication window work?'],
            seniorPerspective: 'JetStream solved the "we need persistence but Kafka is too heavy" problem for my microservices. I use core NATS for ephemeral request-reply and pub/sub, and JetStream streams for anything that needs replay or guaranteed processing — audit events, order workflows, state changes.',
            architectPerspective: 'JetStream turns NATS from "just pub/sub" into a complete messaging platform that competes with Kafka for many use cases. The architectural advantage is operational simplicity: one cluster handles both ephemeral and persistent messaging. For teams below 50 engineers, the operational cost savings of a single messaging platform often outweigh Kafka\u2019s richer ecosystem.'
        },
        {
            question: 'When would you choose NATS over Kafka, and vice versa?',
            difficulty: 'hard',
            answer: `<p>The choice depends on throughput needs, operational complexity tolerance, ecosystem requirements, and message semantics.</p>
            <h4>Choose NATS when:</h4>
            <ul>
                <li><strong>Operational simplicity matters</strong>: Single binary, zero dependencies, embedded persistence (JetStream). No ZooKeeper/KRaft separate process.</li>
                <li><strong>Request-reply is a primary pattern</strong>: NATS has native request-reply with timeouts. Kafka requires workarounds (reply topics, correlation IDs).</li>
                <li><strong>Low-latency pub/sub</strong>: Core NATS delivers sub-millisecond latency for ephemeral messaging.</li>
                <li><strong>Edge/IoT/multi-cloud</strong>: Leaf nodes, tiny footprint (~15MB binary), works behind NATs and firewalls.</li>
                <li><strong>Moderate throughput</strong>: Up to ~1M msgs/sec per node is comfortable. JetStream handles persistence.</li>
            </ul>
            <h4>Choose Kafka when:</h4>
            <ul>
                <li><strong>Extreme throughput</strong>: Kafka handles millions of messages/sec per cluster with linear scaling via partitions.</li>
                <li><strong>Long-term event storage</strong>: Kafka can retain events indefinitely (tiered storage) — acts as an event log/source of truth.</li>
                <li><strong>Rich ecosystem needed</strong>: Kafka Connect (100+ connectors), Kafka Streams, ksqlDB, Schema Registry, Confluent Cloud managed service.</li>
                <li><strong>Strict ordering per key</strong>: Kafka guarantees ordering within a partition with key-based routing.</li>
                <li><strong>Exactly-once across partitions</strong>: Kafka's transactional API handles complex consume-transform-produce atomically.</li>
            </ul>
            <h4>Grey Area (either works):</h4>
            <p>Event-driven microservices with moderate scale (10K-100K msgs/sec), where the deciding factor becomes team expertise and existing infrastructure.</p>`,
            bestPractices: ['Evaluate total cost of ownership including operational overhead (Kafka clusters need dedicated SREs)', 'Consider NATS for new greenfield projects with moderate scale', 'Use Kafka when you need its ecosystem (Connect, Streams, Schema Registry)', 'Prototype with both for your actual workload — synthetic benchmarks mislead'],
            commonMistakes: ['Choosing Kafka for 1000 msgs/sec (massive over-engineering, operational burden for no benefit)', 'Choosing NATS when you need Kafka Connect to integrate 20 data sources', 'Assuming NATS cannot do persistence (JetStream provides it)', 'Ignoring operational cost (Kafka needs monitoring, tuning, upgrades, Schema Registry)'],
            interviewTip: 'Show nuance by naming specific scenarios for each rather than declaring one "better." The senior signal is recognizing that the choice is primarily about operational complexity vs ecosystem richness, not raw performance. Both are fast enough for 95% of use cases.',
            followUp: ['How does RabbitMQ fit into this comparison?', 'Can you migrate from one to the other incrementally?', 'What about Pulsar as an alternative?'],
            seniorPerspective: 'I have run both in production. For a team of 5-15 engineers, NATS with JetStream gives you 90% of Kafka\u2019s capabilities with 20% of the operational overhead. Once you need Kafka Connect\u2019s ecosystem or process millions of events/sec with complex stream processing, Kafka earns its complexity.',
            architectPerspective: 'The strategic decision is: do you need a "data platform" (Kafka — central nervous system that stores all events and feeds multiple consumers/analytics) or a "communication layer" (NATS — fast, simple messaging between services)? If events are your system of record, Kafka. If events are transient coordination between services with some durability needs, NATS.'
        }
    ]
});
