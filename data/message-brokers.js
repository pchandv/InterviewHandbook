'use strict';

PageData.register('message-brokers', {
    title: 'Message Brokers Deep Dive',
    description: 'RabbitMQ, Kafka, Azure Service Bus - architecture patterns, delivery guarantees, and when to use which',
    sections: [
        {
            title: 'Message Broker Fundamentals',
            content: `<p>Message brokers decouple producers from consumers, enabling asynchronous communication between services.</p>
<ul>
<li><strong>Queue</strong> - Point-to-point. One consumer processes each message. Work distribution.</li>
<li><strong>Topic/Exchange</strong> - Publish-subscribe. Multiple consumers receive copies. Event broadcasting.</li>
<li><strong>Delivery guarantees</strong> - At-most-once, at-least-once, exactly-once (each with different tradeoffs).</li>
<li><strong>Ordering</strong> - Some systems guarantee order within a partition/queue, others do not.</li>
</ul>
<p>Key decision: Do you need a <strong>message queue</strong> (work distribution, task processing) or an <strong>event log</strong> (event sourcing, replay, multiple consumers reading same events)?</p>`
        },
        {
            title: 'Broker Architecture Comparison',
            mermaid: `graph TD
    subgraph RabbitMQ
        P1[Producer] --> E[Exchange]
        E -->|routing key| Q1[Queue 1]
        E -->|routing key| Q2[Queue 2]
        Q1 --> C1[Consumer A]
        Q2 --> C2[Consumer B]
        Q2 --> C3[Consumer C - competing]
    end
    
    subgraph Kafka
        P2[Producer] --> T[Topic]
        T --> PA[Partition 0]
        T --> PB[Partition 1]
        T --> PC[Partition 2]
        PA --> CG1[Consumer Group 1 - Member A]
        PB --> CG1B[Consumer Group 1 - Member B]
        PC --> CG1C[Consumer Group 1 - Member C]
        PA --> CG2[Consumer Group 2 - All partitions]
    end`,
            content: `<p><strong>RabbitMQ</strong> is a traditional message broker - messages are consumed and removed. <strong>Kafka</strong> is a distributed log - messages persist and multiple consumer groups read independently at their own pace.</p>`
        },
        {
            title: 'RabbitMQ - Exchanges, Queues, Bindings',
            code: `// RabbitMQ with MassTransit in .NET
// Exchange types: direct, fanout, topic, headers

// Producer - publish an event
public class OrderPlacedEvent
{
    public Guid OrderId { get; set; }
    public decimal Total { get; set; }
    public DateTime PlacedAt { get; set; }
}

// Publishing
await _publishEndpoint.Publish(new OrderPlacedEvent
{
    OrderId = Guid.NewGuid(),
    Total = 99.99m,
    PlacedAt = DateTime.UtcNow
});

// Consumer
public class OrderPlacedConsumer : IConsumer<OrderPlacedEvent>
{
    public async Task Consume(ConsumeContext<OrderPlacedEvent> context)
    {
        var order = context.Message;
        await _emailService.SendConfirmation(order.OrderId);
        
        // Manual ack happens automatically on success
        // Exception = nack + retry/dead-letter
    }
}

// Configuration with MassTransit
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<OrderPlacedConsumer>();
    
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host("rabbitmq://localhost");
        
        cfg.ReceiveEndpoint("order-notifications", e =>
        {
            e.ConfigureConsumer<OrderPlacedConsumer>(context);
            e.UseMessageRetry(r => r.Intervals(
                TimeSpan.FromSeconds(1),
                TimeSpan.FromSeconds(5),
                TimeSpan.FromSeconds(30)));
            
            // Dead letter after retries exhausted
            e.UseDelayedRedelivery(r => r.Intervals(
                TimeSpan.FromMinutes(5),
                TimeSpan.FromMinutes(30),
                TimeSpan.FromHours(1)));
        });
    });
});`,
            language: 'csharp'
        },
        {
            title: 'Kafka - Topics, Partitions, Consumer Groups',
            code: `// Kafka concepts:
// Topic = logical channel, Partition = ordered log segment
// Consumer Group = set of consumers sharing work
// Offset = position in partition (consumer tracks progress)

// Producer - with Confluent .NET client
using var producer = new ProducerBuilder<string, string>(config).Build();

var result = await producer.ProduceAsync("orders-topic", new Message<string, string>
{
    Key = orderId,      // determines partition (same key = same partition = ordering)
    Value = JsonSerializer.Serialize(orderEvent),
    Headers = new Headers
    {
        { "event-type", Encoding.UTF8.GetBytes("OrderPlaced") },
        { "correlation-id", Encoding.UTF8.GetBytes(correlationId) }
    }
});

// Consumer - with consumer group
var config = new ConsumerConfig
{
    BootstrapServers = "kafka:9092",
    GroupId = "order-processing-service",
    AutoOffsetReset = AutoOffsetReset.Earliest,
    EnableAutoCommit = false,  // manual commit for at-least-once
    MaxPollIntervalMs = 300000
};

using var consumer = new ConsumerBuilder<string, string>(config).Build();
consumer.Subscribe("orders-topic");

while (!ct.IsCancellationRequested)
{
    var result = consumer.Consume(ct);
    
    try
    {
        await ProcessMessage(result.Message);
        // Commit offset only after successful processing
        consumer.Commit(result);
    }
    catch (Exception ex)
    {
        // Don't commit - message will be redelivered
        _logger.LogError(ex, "Failed to process offset {Offset}", result.Offset);
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Azure Service Bus',
            code: `// Azure Service Bus - enterprise messaging with sessions and scheduling

// Send message to queue
var client = new ServiceBusClient(connectionString);
var sender = client.CreateSender("order-queue");

var message = new ServiceBusMessage(JsonSerializer.Serialize(orderEvent))
{
    MessageId = Guid.NewGuid().ToString(),
    ContentType = "application/json",
    Subject = "OrderPlaced",
    CorrelationId = correlationId,
    SessionId = customerId,  // enables ordered processing per customer
    ScheduledEnqueueTime = DateTimeOffset.UtcNow.AddMinutes(30), // delayed delivery
    TimeToLive = TimeSpan.FromHours(24),
    ApplicationProperties = { ["priority"] = "high" }
};

await sender.SendMessageAsync(message);

// Receive with processor (recommended pattern)
var processor = client.CreateProcessor("order-queue", new ServiceBusProcessorOptions
{
    MaxConcurrentCalls = 10,
    AutoCompleteMessages = false,
    PrefetchCount = 20
});

processor.ProcessMessageAsync += async args =>
{
    var body = args.Message.Body.ToString();
    var order = JsonSerializer.Deserialize<OrderEvent>(body);
    
    await ProcessOrder(order);
    await args.CompleteMessageAsync(args.Message); // ack
};

processor.ProcessErrorAsync += async args =>
{
    _logger.LogError(args.Exception, "Message processing failed");
    // Message auto-returns to queue (peek-lock expires)
};

await processor.StartProcessingAsync();

// Sessions - ordered processing per session ID
var sessionProcessor = client.CreateSessionProcessor("order-queue");
// Messages with same SessionId processed sequentially by same consumer`,
            language: 'csharp'
        },
        {
            title: 'Delivery Guarantees',
            content: `<p>Message delivery semantics define how many times a message is processed:</p>
<ul>
<li><strong>At-most-once</strong> - Fire and forget. Message may be lost. Fast but unreliable. Use for metrics, logs where loss is acceptable.</li>
<li><strong>At-least-once</strong> - Message is guaranteed to be delivered but may be processed multiple times. Consumer must be idempotent. Most common in practice.</li>
<li><strong>Exactly-once</strong> - Each message processed exactly once. Extremely hard to achieve in distributed systems. Kafka supports it within its ecosystem via transactions.</li>
</ul>
<p><strong>Implementation patterns:</strong></p>
<ul>
<li>At-most-once: auto-ack before processing (RabbitMQ), auto-commit offset (Kafka)</li>
<li>At-least-once: ack after processing, manual offset commit. On failure, message redelivered.</li>
<li>Exactly-once: Kafka transactions (produce + commit offset atomically), or application-level idempotency (outbox pattern)</li>
</ul>`
        },
        {
            title: 'Message Flow Patterns',
            mermaid: `graph TD
    subgraph "Outbox Pattern - Exactly-Once Publishing"
        A[Service] -->|1. Write business data + outbox msg in same TX| B[(Database)]
        C[Outbox Processor] -->|2. Poll outbox table| B
        C -->|3. Publish to broker| D[Message Broker]
        C -->|4. Mark as published| B
    end
    
    subgraph "Dead Letter Flow"
        E[Producer] --> F[Main Queue]
        F -->|Process attempt 1| G{Success?}
        G -->|Yes| H[Complete]
        G -->|No - retry| F
        F -->|Max retries exceeded| I[Dead Letter Queue]
        I --> J[Manual Investigation]
        J -->|Fix and replay| F
    end`,
            content: `<p>The <strong>Outbox Pattern</strong> ensures that business operations and message publishing are atomic - either both happen or neither does. This solves the dual-write problem (writing to DB and broker is not atomic without coordination).</p>`
        },
        {
            title: 'Comparison Table - When to Use Which',
            content: `<p><strong>RabbitMQ vs Kafka vs Azure Service Bus:</strong></p>
<table>
<tr><th>Feature</th><th>RabbitMQ</th><th>Kafka</th><th>Azure Service Bus</th></tr>
<tr><td>Model</td><td>Message broker (queue)</td><td>Distributed log</td><td>Enterprise message broker</td></tr>
<tr><td>Ordering</td><td>Per-queue FIFO</td><td>Per-partition</td><td>Per-session or FIFO queue</td></tr>
<tr><td>Retention</td><td>Until consumed</td><td>Time-based (days/weeks)</td><td>Until consumed or TTL</td></tr>
<tr><td>Replay</td><td>No (consumed = gone)</td><td>Yes (seek to any offset)</td><td>No (peek-lock or receive-delete)</td></tr>
<tr><td>Throughput</td><td>~50K msg/s</td><td>~1M msg/s</td><td>~5K msg/s (standard tier)</td></tr>
<tr><td>Best for</td><td>Task distribution, RPC</td><td>Event streaming, logging</td><td>Enterprise workflows, sessions</td></tr>
<tr><td>Complexity</td><td>Medium</td><td>High</td><td>Low (managed)</td></tr>
</table>
<p><strong>Decision guide:</strong> Use Kafka for high-throughput event streaming with replay needs. Use RabbitMQ for traditional work queues with complex routing. Use Azure Service Bus for enterprise messaging with sessions, scheduling, and Azure-native integration.</p>`
        },
        {
            title: 'Ordering and Backpressure',
            content: `<p><strong>Ordering guarantees:</strong></p>
<ul>
<li><strong>RabbitMQ</strong> - FIFO within a single queue. Multiple consumers break ordering (use single consumer or exclusive queue for strict order).</li>
<li><strong>Kafka</strong> - Ordered within a partition. Use same key for messages that must be ordered (e.g., all events for one customer go to same partition).</li>
<li><strong>Azure Service Bus</strong> - Sessions provide ordered processing per session ID. FIFO queues available (limited throughput).</li>
</ul>
<p><strong>Backpressure patterns:</strong></p>
<ul>
<li><strong>Prefetch tuning</strong> - Limit how many messages are buffered at the consumer (RabbitMQ QoS, Kafka max.poll.records).</li>
<li><strong>Consumer scaling</strong> - Add consumers to a group (Kafka), competing consumers (RabbitMQ).</li>
<li><strong>Rate limiting</strong> - Consumer controls its processing rate; unacked messages stay in queue.</li>
<li><strong>Bounded queues</strong> - Reject or dead-letter when queue reaches capacity (prevents memory exhaustion).</li>
</ul>`
        }
    ],
    questions: [
        {
            question: 'Compare RabbitMQ and Kafka. When would you choose one over the other?',
            difficulty: 'medium',
            answer: `<p><strong>RabbitMQ</strong> is a traditional message broker optimized for message routing and delivery confirmation.</p>
<p><strong>Kafka</strong> is a distributed commit log optimized for high-throughput event streaming.</p>
<p><strong>Choose RabbitMQ when:</strong></p>
<ul>
<li>Complex routing logic needed (topic exchanges, headers-based routing)</li>
<li>Request-reply (RPC) pattern over messaging</li>
<li>Messages should disappear after consumption (task queues)</li>
<li>Low-latency delivery per message matters more than throughput</li>
<li>Priority queues needed</li>
</ul>
<p><strong>Choose Kafka when:</strong></p>
<ul>
<li>High throughput (millions of events/second)</li>
<li>Event replay needed (new consumers read from beginning)</li>
<li>Multiple independent consumers need the same events</li>
<li>Event sourcing or CQRS architecture</li>
<li>Log aggregation, metrics pipelines, streaming analytics</li>
<li>Ordering within a key is required across millions of events</li>
</ul>`,
            interviewTip: 'Frame the answer around use cases, not features. "I would use RabbitMQ for our email notification queue because messages should be processed once and deleted. I would use Kafka for our audit log because we need replay and multiple consumers."',
            followUp: ['Can RabbitMQ handle high throughput?', 'Can Kafka do request-reply?'],
            seniorPerspective: 'The choice often comes down to: do you need a queue (work distribution, messages consumed and gone) or a log (event history, replay, multiple readers)? This fundamental model difference drives the decision.',
            architectPerspective: 'Many systems use both: Kafka for event streaming between bounded contexts, RabbitMQ for internal work distribution within a service. The Outbox pattern bridges the two worlds.'
        },
        {
            question: 'What are dead letter queues and how do you handle poison messages?',
            difficulty: 'medium',
            answer: `<p>A <strong>dead letter queue (DLQ)</strong> is a holding area for messages that cannot be processed after maximum retry attempts. A <strong>poison message</strong> is one that will never succeed (bad format, missing reference data, logic error).</p>
<p><strong>Flow:</strong></p>
<ol>
<li>Message arrives in main queue</li>
<li>Consumer attempts processing - fails</li>
<li>Message is retried with backoff (1s, 5s, 30s, 5m)</li>
<li>After max retries, message moves to DLQ with error metadata</li>
<li>Operators investigate DLQ messages</li>
<li>Fix underlying issue, replay messages back to main queue</li>
</ol>
<p><strong>Implementation:</strong></p>
<pre><code>// RabbitMQ - dead letter exchange
// Queue declares x-dead-letter-exchange and x-dead-letter-routing-key

// MassTransit automatic DLQ
cfg.ReceiveEndpoint("orders", e =>
{
    e.ConfigureConsumer&lt;OrderConsumer&gt;(context);
    // After retries exhausted -> moves to orders_error queue
    e.UseMessageRetry(r => r.Immediate(3));
});

// Monitoring DLQ depth
// Alert when DLQ messages > 0 (something is broken)</code></pre>
<p><strong>Handling strategy:</strong> Automated replay for transient issues (after fix deployed). Manual review for data issues. Discard for permanently invalid messages (with audit log).</p>`,
            interviewTip: 'Emphasize the operational aspect: monitoring DLQ depth, replay tooling, and distinguishing transient failures from permanent ones.',
            followUp: ['How do you replay DLQ messages safely?', 'How do you distinguish transient from permanent failures?'],
            seniorPerspective: 'Every message broker setup needs DLQ monitoring from day one. A growing DLQ is a leading indicator of production issues. Set alerts at DLQ depth > 0.',
            architectPerspective: 'Design DLQ handling as a first-class operational workflow: inspection UI, selective replay, bulk discard with audit. This is not an afterthought - it is core infrastructure.'
        },
        {
            question: 'Explain Kafka consumer groups and partition assignment. How does scaling work?',
            difficulty: 'hard',
            answer: `<p>A <strong>consumer group</strong> is a set of consumers that cooperatively consume a topic. Each partition is assigned to exactly one consumer in the group.</p>
<p><strong>Partition assignment rules:</strong></p>
<ul>
<li>Each partition assigned to exactly one consumer in the group</li>
<li>One consumer can handle multiple partitions</li>
<li>More consumers than partitions = idle consumers</li>
<li>Rebalancing occurs when consumers join/leave the group</li>
</ul>
<p><strong>Scaling:</strong></p>
<ul>
<li>Add partitions to increase parallelism potential</li>
<li>Add consumers (up to partition count) to distribute load</li>
<li>Max parallelism = number of partitions</li>
</ul>
<p><strong>Example:</strong> Topic with 6 partitions:</p>
<ul>
<li>1 consumer → handles all 6 partitions</li>
<li>3 consumers → each handles 2 partitions</li>
<li>6 consumers → each handles 1 partition (optimal)</li>
<li>8 consumers → 6 active, 2 idle (wasted)</li>
</ul>
<p><strong>Multiple consumer groups:</strong> Each group independently reads ALL messages. Group A (analytics) and Group B (notifications) both get every event. This is how Kafka enables multiple downstream systems from one event stream.</p>`,
            interviewTip: 'Draw the partition-to-consumer mapping. Explain why partition count is a scaling decision made upfront. Mention rebalancing and its impact (brief processing pause).',
            followUp: ['What happens during a consumer group rebalance?', 'How do you choose the right partition count?'],
            seniorPerspective: 'Partition count cannot be decreased without recreation. Over-partition initially (but not excessively - each partition has overhead). 3x expected consumer count is a reasonable starting point.',
            architectPerspective: 'Partition key design is critical. If you partition by customer_id, you get per-customer ordering. If by random, you get even distribution but lose ordering. This is an architectural decision that is hard to change later.'
        },
        {
            question: 'What is the Outbox Pattern and when do you need it?',
            difficulty: 'hard',
            answer: `<p>The <strong>Outbox Pattern</strong> solves the dual-write problem: when you need to both update a database AND publish a message atomically.</p>
<p><strong>The problem:</strong></p>
<pre><code>// BROKEN - not atomic
await _db.SaveChangesAsync();    // succeeds
await _broker.PublishAsync(event); // fails! DB is updated but event is lost

// OR
await _broker.PublishAsync(event); // succeeds
await _db.SaveChangesAsync();      // fails! Event published but DB not updated</code></pre>
<p><strong>The solution:</strong></p>
<ol>
<li>Write business data AND outbox message in the same database transaction</li>
<li>A background processor polls the outbox table and publishes messages</li>
<li>After successful publish, mark outbox entry as sent</li>
</ol>
<pre><code>// Step 1: Atomic write
using var tx = await _db.Database.BeginTransactionAsync();
order.Status = OrderStatus.Confirmed;
_db.OutboxMessages.Add(new OutboxMessage
{
    Id = Guid.NewGuid(),
    Type = nameof(OrderConfirmedEvent),
    Payload = JsonSerializer.Serialize(evt),
    CreatedAt = DateTime.UtcNow
});
await _db.SaveChangesAsync();
await tx.CommitAsync();

// Step 2: Background publisher reads outbox and publishes
// Step 3: Mark as published (or delete) after successful send</code></pre>
<p><strong>Alternatives:</strong> Change Data Capture (CDC) using Debezium reads the database transaction log directly, avoiding the outbox table entirely.</p>`,
            interviewTip: 'Start by explaining the dual-write problem clearly. Then present the outbox as the solution. Mention CDC/Debezium as the more advanced alternative.',
            followUp: ['How does Debezium/CDC differ from the outbox pattern?', 'How do you ensure the outbox processor is idempotent?'],
            seniorPerspective: 'The outbox pattern is the standard answer to "how do I reliably publish events from my service." Libraries like MassTransit and NServiceBus have built-in outbox support.',
            architectPerspective: 'The outbox pattern is foundational for event-driven architectures. Without it, you cannot guarantee that state changes and events are consistent. CDC is operationally simpler but requires database-level tooling.'
        },
        {
            question: 'How do you guarantee message ordering in a distributed system?',
            difficulty: 'hard',
            answer: `<p>Ordering is only guaranteed within a single ordered channel (queue, partition, session). Across channels, ordering requires additional coordination.</p>
<p><strong>Strategies by broker:</strong></p>
<ul>
<li><strong>Kafka</strong> - Same partition key → same partition → ordered. Use entity ID as partition key (e.g., customer_id ensures all customer events are ordered).</li>
<li><strong>RabbitMQ</strong> - Single queue + single consumer = ordered. Multiple consumers break ordering. Use consistent hashing exchange for partitioned ordering.</li>
<li><strong>Azure Service Bus</strong> - Sessions: messages with same SessionId processed sequentially by one consumer.</li>
</ul>
<p><strong>When ordering matters:</strong></p>
<ul>
<li>State machine transitions (OrderPlaced → OrderConfirmed → OrderShipped)</li>
<li>Event sourcing (events must be applied in order)</li>
<li>Financial transactions (debit before credit)</li>
</ul>
<p><strong>When ordering does NOT matter:</strong></p>
<ul>
<li>Independent notifications (email to different users)</li>
<li>Idempotent operations (cache invalidation)</li>
<li>Analytics events (out-of-order is fine, processed in batch)</li>
</ul>
<p><strong>Trade-off:</strong> Strict ordering limits parallelism. If all messages for one entity go to one partition, that partition cannot be split across consumers.</p>`,
            interviewTip: 'Distinguish between needing global ordering (rarely) vs per-entity ordering (common) vs no ordering (ideal for throughput). Most systems only need per-entity.',
            followUp: ['What if you need ordering across multiple entities?', 'How does the Saga pattern handle ordering?'],
            seniorPerspective: 'Question the requirement. True global ordering across all messages is extremely expensive. Usually per-entity ordering is sufficient. If someone says they need global ordering, dig into why.',
            architectPerspective: 'Per-entity ordering via partition keys is the scalable approach. If you truly need cross-entity ordering, consider event versioning with conflict detection (like CRDTs) rather than serializing everything.'
        },
        {
            question: 'What are the delivery guarantee levels? How does exactly-once delivery actually work?',
            difficulty: 'advanced',
            answer: `<p><strong>At-most-once:</strong> Send and forget. May lose messages. Fastest.</p>
<p><strong>At-least-once:</strong> Retry until acknowledged. May duplicate. Most common.</p>
<p><strong>Exactly-once:</strong> Each message processed exactly once. Hardest to achieve.</p>
<p><strong>How Kafka achieves exactly-once (within its ecosystem):</strong></p>
<ol>
<li><strong>Idempotent producer</strong> - Broker deduplicates retried produces (sequence numbers per partition)</li>
<li><strong>Transactions</strong> - Atomically produce to multiple partitions AND commit consumer offsets</li>
<li>Consumer reads only committed messages (<code>isolation.level=read_committed</code>)</li>
</ol>
<p><strong>Important nuance:</strong> "Exactly-once" in Kafka means exactly-once within Kafka. Once you leave Kafka (write to a database, call an API), you are back to at-least-once. The consumer must be idempotent for end-to-end exactly-once semantics.</p>
<p><strong>Application-level exactly-once:</strong></p>
<ul>
<li>Idempotency keys (deduplicate at consumer)</li>
<li>Outbox pattern (database + broker atomically)</li>
<li>Transactional inbox (consume + process + ack in one DB transaction)</li>
</ul>`,
            interviewTip: 'The key insight is that true end-to-end exactly-once is almost always achieved via idempotent consumers, not broker magic. Kafka exactly-once is limited to its own ecosystem.',
            followUp: ['What is the performance cost of Kafka transactions?', 'How do you implement idempotent consumers?'],
            seniorPerspective: 'In practice, build for at-least-once with idempotent consumers. The engineering cost of true exactly-once (across systems) rarely justifies the effort vs simply handling duplicates.',
            architectPerspective: 'Exactly-once is a spectrum. Within a single system (Kafka transactions), it is achievable. Across system boundaries, it requires distributed transactions or compensation. Most architectures accept at-least-once and design consumers accordingly.'
        },
        {
            question: 'How do you handle message versioning and schema evolution in an event-driven system?',
            difficulty: 'advanced',
            answer: `<p>As systems evolve, message schemas change. You need to handle old and new message formats without breaking consumers.</p>
<p><strong>Strategies:</strong></p>
<ul>
<li><strong>Weak schema (JSON + tolerant reader)</strong> - Consumers ignore unknown fields, provide defaults for missing fields. Simple but error-prone.</li>
<li><strong>Schema registry (Avro/Protobuf)</strong> - Central registry validates compatibility before allowing schema changes. Confluent Schema Registry for Kafka.</li>
<li><strong>Versioned events</strong> - Include version in message. Route to version-specific handlers.</li>
<li><strong>Upcasting</strong> - Transform old events to current format at read time.</li>
</ul>
<pre><code>// Versioned event approach
public interface IVersionedEvent
{
    int Version { get; }
    string EventType { get; }
}

// Upcaster transforms old versions to current
public class OrderPlacedUpcaster : IEventUpcaster
{
    public object Upcast(JObject oldEvent, int fromVersion)
    {
        if (fromVersion == 1)
        {
            // V1 had "amount", V2 has "total" and "currency"
            oldEvent["total"] = oldEvent["amount"];
            oldEvent["currency"] = "USD"; // default
            oldEvent.Remove("amount");
        }
        return oldEvent.ToObject&lt;OrderPlacedV2&gt;();
    }
}</code></pre>
<p><strong>Best practice:</strong> Additive changes only (add fields, never remove or rename). This maintains backward and forward compatibility.</p>`,
            interviewTip: 'Mention schema registry as the enterprise solution. Explain the tolerant reader pattern as the pragmatic first step. Show you know the tradeoffs.',
            followUp: ['What is backward vs forward compatibility?', 'How does Confluent Schema Registry work?'],
            seniorPerspective: 'Schema evolution is one of the hardest problems in event-driven systems. Invest in a schema registry early. The cost of incompatible changes in production is severe (silent data corruption, consumer crashes).',
            architectPerspective: 'Treat event schemas as public contracts. Changes must be backward-compatible (new consumers read old events) and forward-compatible (old consumers tolerate new events). Use compatibility checks in CI.'
        },
        {
            question: 'How do Azure Service Bus sessions work and when would you use them?',
            difficulty: 'medium',
            answer: `<p><strong>Sessions</strong> in Azure Service Bus provide ordered, exclusive processing for messages sharing a SessionId.</p>
<p><strong>How it works:</strong></p>
<ul>
<li>Producer sets <code>SessionId</code> on each message (e.g., customer ID, order ID)</li>
<li>Broker groups messages by SessionId</li>
<li>One consumer gets exclusive lock on a session</li>
<li>Messages within that session are delivered in FIFO order</li>
<li>Consumer can store session state (checkpointing)</li>
</ul>
<p><strong>Use cases:</strong></p>
<ul>
<li><strong>Ordered processing per entity</strong> - All order events for order-123 processed in sequence</li>
<li><strong>Workflow steps</strong> - Steps must execute in order per workflow instance</li>
<li><strong>Multiplexed FIFO</strong> - Many independent ordered streams in one queue</li>
<li><strong>Stateful processing</strong> - Consumer maintains state between messages of same session</li>
</ul>
<pre><code>// Session-aware processor
var processor = client.CreateSessionProcessor("workflow-queue", 
    new ServiceBusSessionProcessorOptions
    {
        MaxConcurrentSessions = 8,
        SessionIdleTimeout = TimeSpan.FromMinutes(1)
    });

processor.ProcessMessageAsync += async args =>
{
    // args.SessionId - which session this belongs to
    // Get session state (persisted between messages)
    var stateBytes = await args.GetSessionStateAsync();
    var state = Deserialize(stateBytes) ?? new WorkflowState();
    
    // Process message and update state
    state = ProcessStep(args.Message, state);
    await args.SetSessionStateAsync(Serialize(state));
    await args.CompleteMessageAsync(args.Message);
};</code></pre>`,
            interviewTip: 'Sessions solve the "ordered processing per entity" problem elegantly. Compare with Kafka partitions - similar concept but with dynamic session creation.',
            followUp: ['How do sessions compare to Kafka partition keys?', 'What is the MaxConcurrentSessions limit?'],
            seniorPerspective: 'Sessions add cost and complexity. Use them only when ordering per entity is genuinely required. For independent messages (notifications, emails), standard queues are simpler and faster.',
            architectPerspective: 'Sessions are Azure Service Bus equivalent of Kafka partition keys but with dynamic creation. Good for workflows where you cannot predict the number of unique entity IDs upfront.'
        },
        {
            question: 'Design a resilient event-driven architecture for an e-commerce order system.',
            difficulty: 'expert',
            answer: `<p><strong>Architecture:</strong></p>
<pre><code>// Order Service publishes domain events via outbox pattern
OrderPlaced → triggers: Inventory Reserve, Payment Capture, Notification

// Event flow
OrderService --[OrderPlaced]--> Kafka Topic: orders.events
    ├── InventoryService (consumer group: inventory)
    │   └── Reserve stock, publish InventoryReserved/InventoryFailed
    ├── PaymentService (consumer group: payments)  
    │   └── Capture payment, publish PaymentCaptured/PaymentFailed
    └── NotificationService (consumer group: notifications)
        └── Send confirmation email (independent, can lag)

// Saga orchestration for compensating actions
if InventoryReserved AND PaymentCaptured → confirm order
if InventoryFailed → cancel order, refund payment
if PaymentFailed → release inventory reservation</code></pre>
<p><strong>Reliability measures:</strong></p>
<ul>
<li><strong>Outbox pattern</strong> - Atomic DB write + event publish</li>
<li><strong>Idempotent consumers</strong> - Deduplication by event ID</li>
<li><strong>DLQ monitoring</strong> - Alert on failed messages, automated replay after fix</li>
<li><strong>Saga/compensation</strong> - Eventual consistency with rollback on failure</li>
<li><strong>Schema registry</strong> - Prevent breaking schema changes from reaching production</li>
<li><strong>Consumer lag monitoring</strong> - Alert when consumers fall behind</li>
</ul>
<p><strong>Ordering:</strong> Partition by order_id. All events for one order processed sequentially within each consumer group.</p>`,
            interviewTip: 'This is a system design answer. Cover the happy path, failure modes, and observability. Mention the Saga pattern for distributed transactions.',
            followUp: ['How do you handle the case where payment succeeds but inventory reservation fails?', 'How do you monitor consumer lag and detect stuck consumers?'],
            seniorPerspective: 'Start simple: synchronous calls with retries. Move to async events only when you need the decoupling, scalability, or resilience. Event-driven adds significant operational complexity.',
            architectPerspective: 'Event-driven architecture is not free. It trades immediate consistency for eventual consistency, adds debugging complexity (distributed tracing is essential), and requires robust operational tooling (DLQ management, replay, schema governance).'
        }
    ]
});
