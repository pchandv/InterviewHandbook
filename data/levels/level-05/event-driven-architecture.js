/* ═══════════════════════════════════════════════════════════════════
   EVENT-DRIVEN ARCHITECTURE — Level 5: Architecture
   Comprehensive guide to event-driven systems, messaging patterns,
   event sourcing, and reactive architectures.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('event-driven-architecture', {

    title: 'Event-Driven Architecture',
    level: 5,
    group: 'distributed-systems',
    description: 'Deep dive into event-driven architecture: event types, messaging patterns, event sourcing, CQRS, broker selection, and building reactive systems at scale.',
    difficulty: 'advanced',
    estimatedMinutes: 55,
    prerequisites: ['microservices', 'arch-distributed'],

    sections: [

        // ─── 1. INTRODUCTION ──────────────────────────────────────────
        {
            title: 'Introduction',
            content: `<p><strong>Event-Driven Architecture (EDA)</strong> is a design paradigm where the flow of the system
            is determined by events — significant changes in state that are produced, detected, consumed,
            and reacted to by decoupled components.</p>
            <p>Unlike request-driven architectures where components call each other directly, EDA components
            communicate indirectly through events. This creates loose coupling, temporal decoupling, and
            enables highly scalable, reactive systems.</p>
            <p>In this module, you will learn:</p>
            <ul>
                <li>Event types: domain events, integration events, event notifications</li>
                <li>Messaging patterns: pub/sub, point-to-point, event streaming</li>
                <li>Event Sourcing — storing state as a sequence of events</li>
                <li>CQRS — separating reads from writes for scalability</li>
                <li>Broker technologies: RabbitMQ vs Kafka vs Azure Service Bus</li>
                <li>Guarantees: at-least-once, at-most-once, exactly-once delivery</li>
                <li>Patterns: Outbox, Inbox, Idempotency, Dead Letter Queue</li>
            </ul>`
        },

        // ─── 2. CORE CONCEPTS ─────────────────────────────────────────
        {
            title: 'Core Concepts',
            content: `<p>Event-driven systems are built on several foundational concepts:</p>
            <h4>What is an Event?</h4>
            <p>An event is an immutable record of something that happened in the past. Events are facts —
            they cannot be undone, only compensated. Example: <code>OrderPlaced</code>, <code>PaymentReceived</code>,
            <code>InventoryReserved</code>.</p>
            <h4>Event Types</h4>
            <ul>
                <li><strong>Domain Events:</strong> Internal to a bounded context. Represent business-meaningful
                occurrences (e.g., <code>OrderSubmitted</code>). Used within a service for decoupling.</li>
                <li><strong>Integration Events:</strong> Cross service boundaries. Published to a message broker
                for other services to consume. Require versioning and schema management.</li>
                <li><strong>Event Notifications:</strong> Thin events that signal "something happened" without
                full payload. Consumers call back for details if needed.</li>
                <li><strong>Event-Carried State Transfer:</strong> Fat events that carry enough data for
                consumers to update their local state without callbacks.</li>
            </ul>
            <h4>Producers, Consumers, and Brokers</h4>
            <p>Producers publish events without knowing who consumes them. Consumers subscribe to
            event types they care about. The broker (middleware) handles routing, persistence,
            and delivery guarantees.</p>
            <h4>Eventual Consistency</h4>
            <p>In EDA, state across services becomes consistent eventually (milliseconds to seconds),
            not immediately. This is the fundamental trade-off for decoupling and scalability.</p>`,
            mermaid: `graph TB
    subgraph Producers
        P1["Order Service"]
        P2["Payment Service"]
        P3["Inventory Service"]
    end
    subgraph Broker["Message Broker"]
        T1["orders.placed"]
        T2["payments.completed"]
        T3["inventory.reserved"]
    end
    subgraph Consumers
        C1["Notification Service"]
        C2["Analytics Service"]
        C3["Shipping Service"]
        C4["Audit Service"]
    end
    P1 -->|publish| T1
    P2 -->|publish| T2
    P3 -->|publish| T3
    T1 -->|subscribe| C1 & C3 & C4
    T2 -->|subscribe| C1 & C2 & C4
    T3 -->|subscribe| C3 & C4`
        },

        // ─── 3. HOW IT WORKS ──────────────────────────────────────────
        {
            title: 'How It Works',
            content: `<p>An event-driven system operates through a cycle of produce → route → consume → react:</p>
            <ol>
                <li><strong>State Change:</strong> A service performs a business operation that changes state
                (e.g., user places an order)</li>
                <li><strong>Event Publication:</strong> The service persists the state change AND publishes an
                event atomically (using the Transactional Outbox pattern to avoid dual-write problems)</li>
                <li><strong>Broker Routing:</strong> The message broker receives the event and routes it to
                all subscribed consumers based on topic/routing key</li>
                <li><strong>Consumer Processing:</strong> Each consumer processes the event independently —
                one event can trigger multiple reactions (fan-out)</li>
                <li><strong>Acknowledgment:</strong> Consumer acknowledges successful processing. If processing
                fails, the broker redelivers (at-least-once) or sends to a dead letter queue</li>
            </ol>
            <p>The critical pattern is the <strong>Transactional Outbox</strong>: persist the event in an outbox
            table within the same database transaction as the state change, then a separate relay process
            publishes events to the broker. This guarantees consistency between state and published events.</p>`,
            code: `// Transactional Outbox Pattern — guarantees event publication
public class OrderService
{
    private readonly AppDbContext _db;
    private readonly ILogger<OrderService> _logger;

    public async Task<Order> PlaceOrder(PlaceOrderCommand command, CancellationToken ct)
    {
        // Begin transaction
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            // 1. Persist business state
            var order = Order.Create(command.CustomerId, command.Items);
            _db.Orders.Add(order);

            // 2. Persist event to outbox (SAME transaction)
            var outboxMessage = new OutboxMessage
            {
                Id = Guid.NewGuid(),
                Type = nameof(OrderPlacedEvent),
                Payload = JsonSerializer.Serialize(new OrderPlacedEvent
                {
                    OrderId = order.Id,
                    CustomerId = order.CustomerId,
                    Items = order.Items.Select(i => new OrderItemDto(i.ProductId, i.Qty)).ToList(),
                    Total = order.Total,
                    PlacedAt = DateTime.UtcNow
                }),
                CreatedAt = DateTime.UtcNow,
                ProcessedAt = null // Relay will set this
            };
            _db.OutboxMessages.Add(outboxMessage);

            // 3. Commit BOTH atomically
            await _db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            _logger.LogInformation("Order {OrderId} placed, outbox message created", order.Id);
            return order;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }
}

// Background relay: publishes outbox messages to the broker
public class OutboxRelay : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var messages = await _db.OutboxMessages
                .Where(m => m.ProcessedAt == null)
                .OrderBy(m => m.CreatedAt)
                .Take(100)
                .ToListAsync(ct);

            foreach (var msg in messages)
            {
                await _eventBus.PublishRawAsync(msg.Type, msg.Payload, ct);
                msg.ProcessedAt = DateTime.UtcNow;
            }
            await _db.SaveChangesAsync(ct);
            await Task.Delay(TimeSpan.FromSeconds(1), ct);
        }
    }
}`,
            language: 'csharp'
        },

        // ─── 4. VISUAL DIAGRAM ────────────────────────────────────────
        {
            title: 'Event Sourcing & CQRS',
            content: `<p><strong>Event Sourcing</strong> stores state as an append-only sequence of events rather than
            mutable records. The current state is derived by replaying events. This provides a complete
            audit trail, temporal queries, and the ability to rebuild state.</p>
            <p><strong>CQRS (Command Query Responsibility Segregation)</strong> separates the write model
            (optimized for commands) from the read model (optimized for queries). Events bridge the two:
            commands produce events, which are projected into read-optimized views.</p>`,
            mermaid: `flowchart LR
    subgraph WriteModel["Write Side (Commands)"]
        CMD["Command"] --> Handler["Command Handler"]
        Handler --> AGG["Aggregate"]
        AGG --> ES["Event Store<br/>(append-only)"]
    end

    subgraph EventBus["Event Bus"]
        EV["Domain Events"]
    end

    subgraph ReadModel["Read Side (Queries)"]
        PROJ["Projections"]
        RM1[("SQL Read DB<br/>Denormalized")]
        RM2[("Elasticsearch<br/>Full-text")]
        RM3[("Redis Cache<br/>Hot data")]
    end

    subgraph Query["Query Side"]
        QH["Query Handler"]
        API["Read API"]
    end

    ES -->|publish| EV
    EV -->|project| PROJ
    PROJ --> RM1 & RM2 & RM3
    RM1 & RM2 & RM3 --> QH --> API

    style WriteModel fill:#fef3c7,color:#1e293b
    style ReadModel fill:#dbeafe,color:#1e293b`
        },

        // ─── 5. IMPLEMENTATION ────────────────────────────────────────
        {
            title: 'Implementation',
            content: `<p>Implementation examples for event sourcing, CQRS projections, and idempotent consumers:</p>`,
            tabs: [
                {
                    label: 'Event Sourcing (C#)',
                    code: `// Event-sourced Aggregate — state rebuilt from events
public abstract class EventSourcedAggregate
{
    private readonly List<IDomainEvent> _uncommittedEvents = new();
    public IReadOnlyList<IDomainEvent> UncommittedEvents => _uncommittedEvents;
    public int Version { get; private set; } = -1;

    // Rebuild state by replaying stored events
    public void LoadFromHistory(IEnumerable<IDomainEvent> events)
    {
        foreach (var @event in events)
        {
            Apply(@event);
            Version++;
        }
    }

    // Apply new event (state change + record for persistence)
    protected void RaiseEvent(IDomainEvent @event)
    {
        Apply(@event);
        _uncommittedEvents.Add(@event);
    }

    protected abstract void Apply(IDomainEvent @event);
}

// Concrete aggregate: BankAccount
public class BankAccount : EventSourcedAggregate
{
    public Guid Id { get; private set; }
    public decimal Balance { get; private set; }
    public string Status { get; private set; } = "Active";

    public void Deposit(decimal amount)
    {
        if (amount <= 0) throw new DomainException("Amount must be positive");
        RaiseEvent(new MoneyDeposited(Id, amount, DateTime.UtcNow));
    }

    public void Withdraw(decimal amount)
    {
        if (amount > Balance) throw new DomainException("Insufficient funds");
        RaiseEvent(new MoneyWithdrawn(Id, amount, DateTime.UtcNow));
    }

    protected override void Apply(IDomainEvent @event)
    {
        switch (@event)
        {
            case AccountOpened e:
                Id = e.AccountId;
                Balance = e.InitialDeposit;
                break;
            case MoneyDeposited e:
                Balance += e.Amount;
                break;
            case MoneyWithdrawn e:
                Balance -= e.Amount;
                break;
            case AccountClosed e:
                Status = "Closed";
                break;
        }
    }
}

// Event Store repository
public class EventStoreRepository<T> where T : EventSourcedAggregate, new()
{
    private readonly IEventStoreConnection _store;

    public async Task<T> LoadAsync(Guid id)
    {
        var stream = $"{typeof(T).Name}-{id}";
        var events = await _store.ReadStreamForwardAsync(stream);
        var aggregate = new T();
        aggregate.LoadFromHistory(events.Select(Deserialize));
        return aggregate;
    }

    public async Task SaveAsync(T aggregate)
    {
        var stream = $"{typeof(T).Name}-{aggregate.Id}";
        var events = aggregate.UncommittedEvents.Select(Serialize);
        await _store.AppendToStreamAsync(stream, aggregate.Version, events);
    }
}`,
                    language: 'csharp'
                },
                {
                    label: 'CQRS Projection (C#)',
                    code: `// Read model projection — builds denormalized views from events
public class OrderDashboardProjection :
    IEventHandler<OrderPlacedEvent>,
    IEventHandler<PaymentCompletedEvent>,
    IEventHandler<OrderShippedEvent>,
    IEventHandler<OrderCancelledEvent>
{
    private readonly IOrderReadStore _readStore;

    public async Task Handle(OrderPlacedEvent e, CancellationToken ct)
    {
        await _readStore.UpsertAsync(new OrderDashboardView
        {
            OrderId = e.OrderId,
            CustomerName = e.CustomerName,
            Total = e.Total,
            Status = "Placed",
            ItemCount = e.Items.Count,
            PlacedAt = e.Timestamp,
            LastUpdated = e.Timestamp
        }, ct);
    }

    public async Task Handle(PaymentCompletedEvent e, CancellationToken ct)
    {
        await _readStore.UpdateAsync(e.OrderId, view =>
        {
            view.Status = "Paid";
            view.PaymentMethod = e.Method;
            view.LastUpdated = e.Timestamp;
        }, ct);
    }

    public async Task Handle(OrderShippedEvent e, CancellationToken ct)
    {
        await _readStore.UpdateAsync(e.OrderId, view =>
        {
            view.Status = "Shipped";
            view.TrackingNumber = e.TrackingNumber;
            view.EstimatedDelivery = e.EstimatedDelivery;
            view.LastUpdated = e.Timestamp;
        }, ct);
    }

    public async Task Handle(OrderCancelledEvent e, CancellationToken ct)
    {
        await _readStore.UpdateAsync(e.OrderId, view =>
        {
            view.Status = "Cancelled";
            view.CancellationReason = e.Reason;
            view.LastUpdated = e.Timestamp;
        }, ct);
    }
}

// Query handler — reads from optimized view
public class GetOrderDashboardHandler : IQueryHandler<GetOrderDashboard, PagedResult<OrderDashboardView>>
{
    private readonly IOrderReadStore _readStore;

    public async Task<PagedResult<OrderDashboardView>> Handle(
        GetOrderDashboard query, CancellationToken ct)
    {
        return await _readStore.QueryAsync(q => q
            .Where(o => o.Status == query.StatusFilter || query.StatusFilter == null)
            .OrderByDescending(o => o.PlacedAt)
            .Skip(query.Page * query.PageSize)
            .Take(query.PageSize), ct);
    }
}`,
                    language: 'csharp'
                },
                {
                    label: 'Idempotent Consumer',
                    code: `// Idempotent consumer — prevents duplicate processing
public class IdempotentConsumer<TEvent> : IConsumer<TEvent> where TEvent : class, IIntegrationEvent
{
    private readonly IConsumer<TEvent> _innerConsumer;
    private readonly IIdempotencyStore _idempotencyStore;
    private readonly ILogger _logger;

    public async Task Consume(ConsumeContext<TEvent> context)
    {
        var messageId = context.MessageId?.ToString()
            ?? context.Message.EventId.ToString();

        // Check if already processed
        if (await _idempotencyStore.HasBeenProcessedAsync(messageId))
        {
            _logger.LogWarning("Duplicate message {MessageId} skipped", messageId);
            return; // Already processed — skip
        }

        // Process the event
        await _innerConsumer.Consume(context);

        // Mark as processed (with TTL for cleanup)
        await _idempotencyStore.MarkAsProcessedAsync(messageId, TimeSpan.FromDays(7));
    }
}

// Idempotency store backed by Redis
public class RedisIdempotencyStore : IIdempotencyStore
{
    private readonly IDatabase _redis;

    public async Task<bool> HasBeenProcessedAsync(string messageId)
        => await _redis.KeyExistsAsync($"idempotent:{messageId}");

    public async Task MarkAsProcessedAsync(string messageId, TimeSpan ttl)
        => await _redis.StringSetAsync($"idempotent:{messageId}", "1", ttl);
}`,
                    language: 'csharp'
                },
                {
                    label: 'Kafka Producer (TypeScript)',
                    code: `import { Kafka, Partitioners } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'order-service',
    brokers: ['kafka-1:9092', 'kafka-2:9092', 'kafka-3:9092'],
});

const producer = kafka.producer({
    createPartitioner: Partitioners.DefaultPartitioner,
    idempotent: true,              // Exactly-once semantics
    maxInFlightRequests: 5,
    transactionalId: 'order-producer-1'
});

// Publish event with key (ensures ordering per entity)
async function publishOrderEvent(event: OrderEvent): Promise<void> {
    await producer.send({
        topic: 'orders.events',
        messages: [{
            key: event.orderId,    // Same key = same partition = ordered
            value: JSON.stringify(event),
            headers: {
                'event-type': event.type,
                'correlation-id': event.correlationId,
                'timestamp': Date.now().toString(),
                'schema-version': '2'
            }
        }]
    });
}

// Consumer group with manual offset management
const consumer = kafka.consumer({ groupId: 'shipping-service' });
await consumer.subscribe({ topic: 'orders.events', fromBeginning: false });

await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());
        const eventType = message.headers['event-type'].toString();

        try {
            switch (eventType) {
                case 'OrderPlaced':
                    await handleOrderPlaced(event);
                    break;
                case 'OrderCancelled':
                    await handleOrderCancelled(event);
                    break;
            }
        } catch (error) {
            // Send to dead letter topic for manual investigation
            await producer.send({
                topic: 'orders.events.dlq',
                messages: [{ key: message.key, value: message.value,
                    headers: { ...message.headers, 'error': error.message } }]
            });
        }
    }
});`,
                    language: 'typescript'
                }
            ]
        },

        // ─── 6. BEST PRACTICES ────────────────────────────────────────
        {
            title: 'Best Practices',
            content: `<h4>Do: Design Events as Immutable Facts</h4>
            <p>Events describe what happened (past tense): <code>OrderPlaced</code>, <code>PaymentReceived</code>.
            Never name events as commands (<code>PlaceOrder</code>) — that changes the semantics entirely.</p>
            <h4>Do: Use the Transactional Outbox Pattern</h4>
            <p>Never publish events directly to the broker from application code. Persist events
            in an outbox table within the same DB transaction as the state change, then relay them
            asynchronously. This prevents the "dual write problem" where the DB write succeeds but
            the event publish fails (or vice versa).</p>
            <h4>Do: Make Consumers Idempotent</h4>
            <p>Messages WILL be delivered more than once (broker retry, consumer restart, network issues).
            Every consumer must safely handle duplicate messages — use an idempotency key (message ID)
            and check-before-process.</p>
            <h4>Do: Version Your Event Schemas</h4>
            <p>Events are public contracts. Use semantic versioning. Support backward-compatible evolution
            (add fields, never remove). Use a schema registry (Avro, Protobuf) for strict contracts.</p>
            <h4>Do: Include Metadata in Events</h4>
            <p>Every event should carry: event ID, correlation ID, causation ID, timestamp, schema version,
            and source service. This enables distributed tracing and debugging.</p>
            <h4>Do: Use Dead Letter Queues</h4>
            <p>After N retry attempts, move failed messages to a DLQ for investigation rather than
            blocking the consumer or dropping the message silently.</p>`,
            callout: {
                type: 'tip',
                title: 'Event Design Rule',
                text: 'Events should be named in past tense (OrderPlaced, not PlaceOrder), carry only the data consumers need, and never reference internal implementation details of the producing service.'
            }
        },

        // ─── 7. COMMON MISTAKES ───────────────────────────────────────
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Dual Write Problem</h4>
            <p>Writing to the database AND publishing to the broker as two separate operations.
            If either fails, the system is in an inconsistent state. Always use Transactional Outbox.</p>
            <h4>Mistake: Event as Remote Procedure Call</h4>
            <p>Publishing an event and waiting for a response — this reintroduces temporal coupling.
            If you need a response, use a request/reply pattern explicitly, not events.</p>
            <h4>Mistake: Overly Fat Events</h4>
            <p>Including the entire entity state in every event. This creates coupling to the producer's
            internal model. Include only what consumers need — the delta or relevant subset.</p>
            <h4>Mistake: No Schema Evolution Strategy</h4>
            <p>Adding/removing fields without versioning breaks consumers. Treat events as public API
            contracts with the same rigor as REST endpoints.</p>
            <h4>Mistake: Assuming Ordering Guarantees</h4>
            <p>Most brokers guarantee ordering only within a partition/queue. If events for the same
            entity go to different partitions, they can arrive out of order. Use entity ID as
            the partition key to ensure per-entity ordering.</p>
            <h4>Mistake: Unbounded Retry</h4>
            <p>Retrying a failed message forever blocks the consumer. Use exponential backoff with
            a maximum retry count, then route to a dead letter queue.</p>`,
            code: `// BAD: Dual write — DB and broker are separate operations
public async Task PlaceOrder(OrderRequest request)
{
    var order = Order.Create(request);
    await _db.SaveChangesAsync();          // ✅ DB write succeeds

    // ❌ What if this fails? Order exists but no event published!
    await _eventBus.PublishAsync(new OrderPlaced(order));
}

// BAD: Event as RPC — defeats the purpose of async
await _eventBus.PublishAsync(new ReserveStock(orderId, items));
var response = await _eventBus.WaitForResponseAsync<StockReserved>(orderId);
// ^ This is synchronous coupling disguised as events

// GOOD: Transactional Outbox — atomic consistency
public async Task PlaceOrder(OrderRequest request)
{
    using var tx = await _db.Database.BeginTransactionAsync();
    var order = Order.Create(request);
    _db.Orders.Add(order);
    _db.OutboxMessages.Add(OutboxMessage.From(new OrderPlaced(order)));
    await _db.SaveChangesAsync();
    await tx.CommitAsync();
    // Relay process publishes to broker asynchronously
}`,
            language: 'csharp'
        },

        // ─── 8. REAL-WORLD APPLICATIONS ───────────────────────────────
        {
            title: 'Real-World Applications',
            content: `<p>Event-driven architecture powers many of the world's most demanding systems:</p>
            <h4>Financial Services & Trading</h4>
            <p>Stock exchanges process millions of trade events per second. Each trade is an event
            that triggers settlement, risk calculation, regulatory reporting, and account updates.
            Event sourcing provides the immutable audit trail required by regulators.</p>
            <h4>E-Commerce Order Processing</h4>
            <p>Amazon, Shopify, and similar platforms use EDA for order fulfillment: OrderPlaced →
            PaymentCaptured → InventoryReserved → Packed → Shipped → Delivered. Each step is
            an independent service reacting to events.</p>
            <h4>IoT & Telemetry</h4>
            <p>Smart devices emit millions of telemetry events per second (temperature readings,
            GPS locations, sensor data). Kafka/Event Hubs ingest these streams, with consumers
            performing real-time analytics, anomaly detection, and alerting.</p>
            <h4>Sports Betting & Live Odds</h4>
            <p>Live odds changes from data providers (Betradar) arrive as events processed at
            high throughput. Each odds change event triggers re-pricing, liability calculations,
            and real-time UI updates via SignalR. Event sourcing enables bet settlement by
            replaying the exact odds at the time of bet placement.</p>
            <h4>Social Media Feeds</h4>
            <p>When a user posts content, events fan out to followers' timelines, notification
            services, search indexing, content moderation, and analytics — all independently.</p>`
        },

        // ─── 9. COMPARISON ────────────────────────────────────────────
        {
            title: 'Comparison',
            content: `<p>Comparing message broker technologies and their suitability for different scenarios:</p>`,
            table: {
                headers: ['Feature', 'RabbitMQ', 'Apache Kafka', 'Azure Service Bus'],
                rows: [
                    ['Model', 'Message Queue (push)', 'Event Log (pull)', 'Message Queue (push)'],
                    ['Ordering', 'Per-queue FIFO', 'Per-partition ordering', 'Per-session FIFO'],
                    ['Retention', 'Until consumed', 'Configurable (days/forever)', 'Until consumed (+ DLQ)'],
                    ['Throughput', '10-50K msg/sec', '1M+ msg/sec', '10-100K msg/sec'],
                    ['Replay', 'No (consumed = gone)', 'Yes (seek to any offset)', 'No (peek + DLQ)'],
                    ['Consumer Groups', 'Competing consumers', 'Consumer groups + offsets', 'Sessions + subscriptions'],
                    ['Delivery', 'At-least-once', 'At-least-once (exactly-once with txn)', 'At-least-once'],
                    ['Best For', 'Task queues, RPC, simple pub/sub', 'Event streaming, log aggregation, high throughput', 'Enterprise messaging, Azure-native'],
                    ['Complexity', 'Low', 'High (ZooKeeper/KRaft, partitions)', 'Low (managed service)'],
                    ['Use Case', 'Microservice communication', 'Event sourcing, analytics, CDC', 'Cloud-native integration']
                ]
            }
        },

        // ─── 10. PERFORMANCE ──────────────────────────────────────────
        {
            title: 'Performance',
            content: `<p>Performance considerations for event-driven systems:</p>
            <h4>Throughput</h4>
            <ul>
                <li><strong>Kafka:</strong> Designed for throughput — batches writes to disk sequentially.
                Single cluster can handle millions of events/second with proper partitioning.</li>
                <li><strong>RabbitMQ:</strong> Optimized for low-latency delivery. 10-50K messages/sec typical.
                Enable publisher confirms and consumer prefetch for optimal throughput.</li>
                <li><strong>Partitioning:</strong> More partitions = more parallelism. But too many partitions
                increase rebalance time and memory overhead. Start with 2x consumer count.</li>
            </ul>
            <h4>Latency</h4>
            <ul>
                <li>Broker-to-consumer latency: 1-10ms (same datacenter), 50-200ms (cross-region)</li>
                <li>End-to-end event processing: typically 10-100ms for simple consumers</li>
                <li>Batching increases throughput but adds latency (trade-off: batch size vs responsiveness)</li>
            </ul>
            <h4>Event Store Performance</h4>
            <ul>
                <li>Appending events: O(1) — always writing to the end of the log</li>
                <li>Loading aggregate: O(n) where n = number of events for that entity</li>
                <li>Use <strong>snapshots</strong> every N events (e.g., every 100) to avoid replaying entire history</li>
                <li>Projection rebuild: can be parallelized but takes time for large event stores</li>
            </ul>
            <h4>Consumer Scaling</h4>
            <p>Add more consumer instances (within a consumer group) to parallelize processing.
            Maximum parallelism = number of partitions. If you have 12 partitions, max 12 consumers
            can process simultaneously.</p>`,
            callout: {
                type: 'warning',
                title: 'Snapshot Strategy',
                text: 'For event-sourced aggregates with 1000+ events, loading becomes slow. Create snapshots periodically: serialize the current state at event N, then replay only events after N. Balance snapshot frequency against storage cost.'
            }
        },

        // ─── 11. TESTING ──────────────────────────────────────────────
        {
            title: 'Testing',
            content: `<p>Testing event-driven systems requires specific strategies for producers, consumers, and flows:</p>
            <h4>Unit Testing Aggregates (Event Sourcing)</h4>
            <p>Given a set of past events, when a command is executed, then specific new events are raised.
            This "Given-When-Then" pattern makes event-sourced aggregates highly testable.</p>
            <h4>Consumer Testing</h4>
            <p>Test consumers in isolation by feeding them events directly without a real broker.
            Verify side effects (DB writes, API calls, events published).</p>
            <h4>Integration Testing with Testcontainers</h4>
            <p>Spin up real broker instances (RabbitMQ, Kafka) in containers for integration tests.
            Verify end-to-end message flow: publish → consume → side effect.</p>
            <h4>Testing Eventual Consistency</h4>
            <p>Use polling assertions (wait until condition is true within timeout) rather than
            fixed delays. Libraries like Awaitility (Java) or custom polling helpers work well.</p>`,
            code: `// Given-When-Then testing for event-sourced aggregate
public class BankAccountTests
{
    [Fact]
    public void Withdraw_SufficientFunds_RaisesMoneyWithdrawnEvent()
    {
        // Given: account with prior deposits
        var account = new BankAccount();
        account.LoadFromHistory(new IDomainEvent[]
        {
            new AccountOpened(Guid.NewGuid(), initialDeposit: 1000m),
            new MoneyDeposited(Guid.NewGuid(), amount: 500m, DateTime.UtcNow)
        });

        // When: withdraw
        account.Withdraw(200m);

        // Then: correct event raised, correct state
        var raised = account.UncommittedEvents.Single();
        Assert.IsType<MoneyWithdrawn>(raised);
        Assert.Equal(200m, ((MoneyWithdrawn)raised).Amount);
        Assert.Equal(1300m, account.Balance); // 1000 + 500 - 200
    }

    [Fact]
    public void Withdraw_InsufficientFunds_ThrowsDomainException()
    {
        var account = new BankAccount();
        account.LoadFromHistory(new[] { new AccountOpened(Guid.NewGuid(), 100m) });

        Assert.Throws<DomainException>(() => account.Withdraw(500m));
        Assert.Empty(account.UncommittedEvents); // No events raised
    }
}

// Integration test: verify event flow through broker
public class OrderEventFlowTests : IAsyncLifetime
{
    private RabbitMqContainer _rabbit = new RabbitMqBuilder().Build();

    [Fact]
    public async Task OrderPlaced_TriggersNotification()
    {
        // Arrange
        var notificationSent = new TaskCompletionSource<bool>();
        var consumer = CreateNotificationConsumer(onReceived: () =>
            notificationSent.SetResult(true));

        // Act: publish event
        await PublishEvent(new OrderPlacedEvent { OrderId = "123", CustomerEmail = "a@b.com" });

        // Assert: consumer reacted (with timeout)
        var result = await Task.WhenAny(notificationSent.Task, Task.Delay(5000));
        Assert.True(notificationSent.Task.IsCompletedSuccessfully);
    }
}`,
            language: 'csharp'
        },

        // ─── 12. INTERVIEW TIPS ───────────────────────────────────────
        {
            title: 'Interview Tips',
            content: `<p>Event-driven architecture questions test depth of distributed systems knowledge:</p>
            <ul>
                <li><strong>Distinguish event types:</strong> Know the difference between domain events, integration events,
                and commands. Events are past-tense facts; commands are imperative requests</li>
                <li><strong>Address delivery guarantees:</strong> Explain at-least-once vs at-most-once vs exactly-once
                and why at-least-once + idempotent consumers is the practical choice</li>
                <li><strong>Explain the Outbox pattern:</strong> This shows you understand the dual-write problem —
                a common production pitfall that junior engineers miss</li>
                <li><strong>Know when CQRS adds value:</strong> Not every service needs CQRS. It shines when
                read and write patterns differ significantly (complex queries, high read:write ratio)</li>
                <li><strong>Discuss schema evolution:</strong> How do you add fields? Rename events? Migrate consumers?
                This shows production experience</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Senior Differentiator',
                text: 'The interviewer signal for senior+ is discussing what happens when things go wrong: duplicate messages, out-of-order events, poison messages, consumer lag, and how you monitor and recover from these scenarios in production.'
            }
        },

        // ─── 13. FURTHER READING ──────────────────────────────────────
        {
            title: 'Further Reading',
            content: `<p>Essential resources for mastering event-driven architecture:</p>
            <h4>Books</h4>
            <ul>
                <li><em>Designing Data-Intensive Applications</em> by Martin Kleppmann — chapters on streams and replication</li>
                <li><em>Building Event-Driven Microservices</em> by Adam Bellemare — practical EDA patterns</li>
                <li><em>Implementing Domain-Driven Design</em> by Vaughn Vernon — domain events and event sourcing</li>
                <li><em>Enterprise Integration Patterns</em> by Hohpe & Woolf — messaging patterns catalog</li>
            </ul>
            <h4>Online Resources</h4>
            <ul>
                <li>Confluent Developer: <code>developer.confluent.io</code> — Kafka patterns and tutorials</li>
                <li>EventStoreDB docs: <code>eventstore.com/docs</code> — event sourcing reference</li>
                <li>MassTransit docs: <code>masstransit.io</code> — .NET messaging framework</li>
                <li>Martin Fowler: Event Sourcing, CQRS articles</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li><strong>.NET:</strong> MassTransit, NServiceBus, Wolverine, Marten (event sourcing)</li>
                <li><strong>Streaming:</strong> Apache Kafka, Apache Pulsar, Amazon Kinesis</li>
                <li><strong>Event Stores:</strong> EventStoreDB, Marten, Axon Framework</li>
                <li><strong>Schema:</strong> Confluent Schema Registry, AsyncAPI</li>
            </ul>`
        },

        // ─── 14. KEY TAKEAWAYS ────────────────────────────────────────
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Core idea:</strong> Systems communicate through immutable events (facts about what happened) rather than direct commands</li>
                <li><strong>When to use:</strong> Decoupled services, high fan-out scenarios, audit requirements, temporal decoupling, event replay needs</li>
                <li><strong>When NOT to use:</strong> Simple CRUD apps, strong consistency requirements that cannot tolerate eventual consistency, small systems with no fan-out</li>
                <li><strong>Key benefit:</strong> Loose coupling, independent scalability, natural audit trail, temporal decoupling</li>
                <li><strong>Main risk:</strong> Eventual consistency complexity, debugging difficulty, message ordering challenges</li>
                <li><strong>Critical patterns:</strong> Transactional Outbox, Idempotent Consumer, Dead Letter Queue, Schema Versioning</li>
                <li><strong>Interview signal:</strong> Explaining the dual-write problem and Outbox pattern signals production EDA experience</li>
            </ul>`
        },

        // ─── 15. EXERCISE ─────────────────────────────────────────────
        {
            title: 'Exercise',
            content: `<h4>Challenge: Build an Event-Sourced Shopping Cart</h4>
            <p>Implement a shopping cart using event sourcing. Your solution should:</p>
            <ol>
                <li>Define events: CartCreated, ItemAdded, ItemRemoved, QuantityChanged, CartCheckedOut</li>
                <li>Implement an event-sourced aggregate that rebuilds state from events</li>
                <li>Write a projection that builds a "CartSummary" read model (total items, total price)</li>
                <li>Handle idempotency: adding the same item twice should update quantity, not duplicate</li>
                <li>Write Given-When-Then tests for the aggregate</li>
            </ol>
            <h4>Starter Code</h4>`,
            code: `// Events
public record CartCreated(Guid CartId, string CustomerId, DateTime CreatedAt);
public record ItemAdded(Guid CartId, string ProductId, string Name, decimal Price, int Quantity);
public record ItemRemoved(Guid CartId, string ProductId);
public record QuantityChanged(Guid CartId, string ProductId, int NewQuantity);
public record CartCheckedOut(Guid CartId, DateTime CheckedOutAt);

// TODO: Implement the ShoppingCart aggregate
public class ShoppingCart : EventSourcedAggregate
{
    public Guid Id { get; private set; }
    public string CustomerId { get; private set; }
    public Dictionary<string, CartItem> Items { get; private set; } = new();
    public bool IsCheckedOut { get; private set; }

    public decimal Total => Items.Values.Sum(i => i.Price * i.Quantity);

    public void AddItem(string productId, string name, decimal price, int quantity)
    {
        if (IsCheckedOut) throw new DomainException("Cannot modify checked-out cart");
        // TODO: If item exists, raise QuantityChanged. If new, raise ItemAdded.
        throw new NotImplementedException();
    }

    public void Checkout()
    {
        if (!Items.Any()) throw new DomainException("Cart is empty");
        // TODO: Raise CartCheckedOut
        throw new NotImplementedException();
    }

    protected override void Apply(IDomainEvent @event)
    {
        // TODO: Update state based on each event type
        throw new NotImplementedException();
    }
}

// TODO: Write a CartSummaryProjection that subscribes to events
// and maintains a denormalized read model`,
            language: 'csharp'
        },

        // ─── 16. KNOWLEDGE CHECK ──────────────────────────────────────
        {
            title: 'Knowledge Check',
            content: `<p>Test your understanding of event-driven architecture:</p>
            <ol>
                <li><strong>Q:</strong> What is the dual-write problem and how does the Outbox pattern solve it?<br/>
                    <em>A: The dual-write problem occurs when a service needs to update its database AND publish
                    an event — if either fails independently, the system is inconsistent. The Outbox pattern solves
                    it by writing both the state change and the event to the database in a single transaction,
                    then a relay process publishes events from the outbox table.</em></li>
                <li><strong>Q:</strong> What is the difference between Event Sourcing and Event-Driven Architecture?<br/>
                    <em>A: EDA is a communication pattern where services publish/consume events. Event Sourcing is a
                    persistence pattern where state is stored as a sequence of events rather than mutable records.
                    You can have EDA without Event Sourcing (publish events but store state traditionally), and
                    Event Sourcing without EDA (single service with event store but no broker).</em></li>
                <li><strong>Q:</strong> Why must consumers be idempotent in event-driven systems?<br/>
                    <em>A: Message brokers deliver at-least-once — duplicates will occur due to retries, redelivery,
                    and consumer restarts. If a consumer is not idempotent, processing the same event twice
                    leads to double-charges, duplicate records, or inconsistent state.</em></li>
                <li><strong>Q:</strong> When would you choose Kafka over RabbitMQ?<br/>
                    <em>A: Choose Kafka when you need event replay (consumers can re-read history), high throughput
                    (millions of events/sec), log-based semantics (compacted topics), or event sourcing.
                    Choose RabbitMQ for simpler messaging, routing flexibility, lower operational overhead,
                    and when you don't need replay.</em></li>
            </ol>`
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // INTERVIEW QUESTIONS
    // ═══════════════════════════════════════════════════════════════
    questions: [
        {"question":"What is a dead-letter queue, and how should consumers handle poison messages?","difficulty":"hard","answer":"<p>A <strong>poison message</strong> is one a consumer repeatedly fails to process (bad data, a bug, a permanently-down dependency). Endlessly retrying it blocks the queue and wastes resources. A <strong>dead-letter queue (DLQ)</strong> is a separate queue where messages are moved after exceeding a retry limit, so the main flow continues while failures are quarantined for inspection.</p><p>Handling: retry transient failures a bounded number of times (with backoff), then dead-letter; alert/monitor DLQ depth; and provide a way to inspect, fix, and replay dead-lettered messages. Distinguish transient (retry) from permanent (dead-letter immediately) failures where possible.</p>","explanation":"A DLQ is the \"returns\" bin at a sorting facility: a package that keeps failing delivery is set aside so the rest of the mail keeps moving, and a human later inspects the problem package.","bestPractices":["Bounded retries with backoff, then dead-letter","Monitor and alert on DLQ depth","Support inspecting and replaying dead-lettered messages"],"commonMistakes":["Infinite retries blocking the queue","No DLQ monitoring (failures silently pile up)","No replay path after fixing the root cause"],"interviewTip":"Define poison message + DLQ and stress bounded-retry-then-dead-letter plus monitoring/replay — operational maturity is the signal.","followUp":["How do you distinguish transient vs permanent failures?","How do you replay a DLQ safely?","How does idempotency interact with retries?"]},
        {"question":"How do you guarantee ordering and handle duplicates in an event-driven system?","difficulty":"hard","answer":"<p><strong>Ordering:</strong> global ordering across a topic is expensive and usually unnecessary. Instead, guarantee ordering <em>per key</em> — e.g., Kafka preserves order within a partition, so route all events for one entity (by partition key like orderId) to the same partition. Avoid needing cross-entity ordering.</p><p><strong>Duplicates:</strong> delivery is <strong>at-least-once</strong>, so consumers must be <strong>idempotent</strong> — dedupe on an event id (inbox table / dedup store), or design naturally idempotent operations (set-state rather than increment). Combining per-key ordering with idempotent consumers gives correct results without a fragile global-order guarantee.</p>","explanation":"Order per key is like keeping each customer's tickets in order at their own counter, rather than trying to globally sequence every ticket in the whole building. Idempotency is checking a ticket has not already been served before serving it.","bestPractices":["Partition by entity key for per-key ordering","Make consumers idempotent (dedupe on event id)","Avoid designs needing global ordering"],"commonMistakes":["Assuming global ordering across a topic","Assuming exactly-once delivery","No dedup, so retries double-apply"],"interviewTip":"Two crisp points: order per partition key (not globally) and idempotent consumers for at-least-once delivery. That combination is the expected senior answer.","followUp":["How do Kafka partitions preserve order?","What is the inbox pattern?","Why is global ordering expensive?"]},
        {
            question: 'How do partitioning, ordering, and consumer groups work in Kafka, and what happens during a rebalance?',
            difficulty: 'hard',
            answer: `<p>Kafka topics are split into <strong>partitions</strong> \u2014 the unit of parallelism and ordering.</p>
            <ul>
                <li><strong>Ordering is per-partition only.</strong> Messages are ordered within a partition, not
                across the topic. To guarantee ordering for an entity (e.g., all events for one order), use a
                <strong>partition key</strong> (the entity id) so they all land in the same partition.</li>
                <li><strong>Consumer groups</strong> provide scaling: each partition is consumed by exactly one
                consumer in a group, so max parallelism = number of partitions. Adding consumers beyond the partition
                count leaves some idle.</li>
                <li><strong>Rebalance:</strong> when a consumer joins/leaves (deploy, crash, scale), Kafka reassigns
                partitions across the group. During a rebalance, consumption pauses ("stop-the-world" in older
                protocols), in-flight work may be reprocessed, and partition ownership moves \u2014 which is why consumers
                must be idempotent and commit offsets carefully.</li>
            </ul>`,
            explanation: 'Think of partitions as separate checkout lanes. Items in one lane stay in order, but across lanes there\u2019s no global order. A consumer group is the cashiers \u2014 one cashier per lane; more cashiers than lanes means some stand idle. A rebalance is reassigning cashiers to lanes when one clocks in or out, briefly pausing checkout.',
            code: `// Partition key guarantees per-entity ordering (all order-5 events same partition)
await producer.send({ topic: 'orders', messages: [{ key: orderId, value: json }] });

// Scaling: partitions=12 -> up to 12 consumers in the group process in parallel.
// Commit offsets only AFTER successful processing (at-least-once):
await consumer.run({ eachMessage: async ({ message }) => {
    await process(message);        // idempotent
    // offset committed after success; a crash before commit => reprocessing
}});`,
            language: 'typescript',
            bestPractices: ['Use the entity id as partition key to preserve per-entity ordering', 'Size partitions for target parallelism (consumers <= partitions)', 'Make consumers idempotent (rebalances/retries cause reprocessing)', 'Commit offsets after successful processing'],
            commonMistakes: ['Expecting global ordering across a topic', 'More consumers than partitions (idle consumers)', 'Committing offsets before processing (message loss)', 'Non-idempotent consumers that double-process after a rebalance'],
            interviewTip: 'State plainly: "ordering is per-partition, so partition by entity key." Then connect rebalances + at-least-once to the need for idempotent consumers \u2014 that chain of reasoning is the senior signal.',
            followUp: ['How do you increase partitions without breaking ordering?', 'What is the cost of too many partitions?'],
            seniorPerspective: 'The two Kafka facts that prevent most production incidents are "ordering is per-partition" and "consumers must be idempotent." Teams get burned assuming topic-wide ordering, or by scaling consumers past the partition count and wondering why throughput plateaus. I choose the partition key deliberately around the entity whose event order matters, and I size partitions up front because increasing them later reshuffles key-to-partition mapping and breaks ordering guarantees.'
        },
        {
            question: 'How do you handle eventual consistency in the UI and the "read-your-own-writes" problem in an event-driven system?',
            difficulty: 'hard',
            answer: `<p>In EDA/CQRS, a write updates the write model and publishes an event; the read model updates
            <em>asynchronously</em> (milliseconds to seconds later). So a user who just made a change may not see it
            yet when they re-read \u2014 the read-your-own-writes problem. Strategies:</p>
            <ul>
                <li><strong>Optimistic UI:</strong> update the client immediately with the expected result while the
                backend catches up \u2014 the most common UX fix. Reconcile if the server later disagrees.</li>
                <li><strong>Return the result from the command:</strong> the write endpoint returns the new state (or
                enough of it) so the client doesn\u2019t need to re-read a possibly-stale read model.</li>
                <li><strong>Read-your-writes routing:</strong> for the originating user, read from the write model
                (primary) or pin them to an up-to-date replica until the read model converges.</li>
                <li><strong>Versioning/polling:</strong> the client knows the expected version and waits/polls until
                the read model reflects it (or uses a subscription/websocket to be notified).</li>
                <li><strong>Set expectations in UX:</strong> "processing..." states for genuinely async operations.</li>
            </ul>`,
            explanation: 'It\u2019s like posting a letter and then checking the public bulletin board \u2014 your post hasn\u2019t been pinned up yet. The fixes: show the user their own post immediately from a local copy (optimistic UI), hand them a receipt with the content (return from command), or let them peek at the original outbox (read from primary) until the board catches up.',
            bestPractices: ['Use optimistic UI for snappy UX; reconcile on server confirmation', 'Return the created/updated resource from the command response', 'Route read-your-own-writes to the primary/write model when correctness matters', 'Design UX to communicate async "processing" states'],
            commonMistakes: ['Assuming the read model is instantly consistent after a write', 'Re-reading a stale read model immediately after a command and showing old data', 'Hiding eventual consistency from UX entirely (confusing users)'],
            interviewTip: 'Name the "read-your-own-writes" problem explicitly and give 2-3 concrete fixes (optimistic UI, return-from-command, read-from-primary). Acknowledging it as a UX problem as much as a data problem shows maturity.',
            followUp: ['When is eventual consistency unacceptable and you need strong consistency?', 'How does optimistic UI handle a server rejection?'],
            seniorPerspective: 'Eventual consistency is as much a product/UX decision as a technical one, so I bring product into it early. For most flows, optimistic UI plus returning the result from the command makes the lag invisible. I reserve read-from-primary for cases where showing stale data is genuinely harmful (e.g., account balance right after a transfer). The anti-pattern I watch for is a command followed immediately by a re-read of the async read model \u2014 that reliably shows users their old data and erodes trust.'
        },
        {
            question: 'What is Event-Driven Architecture and when would you use it over request-driven?',
            difficulty: 'easy',
            answer: `<p><strong>Event-Driven Architecture</strong> is a pattern where components communicate by producing
            and consuming events — immutable records of state changes. Components are decoupled: producers
            don't know who consumes their events.</p>
            <p>Use EDA over request-driven when:</p>
            <ul>
                <li>Multiple services need to react to the same trigger (fan-out)</li>
                <li>Services should not be temporally coupled (producer shouldn't wait)</li>
                <li>You need an audit trail of all state changes</li>
                <li>Workloads are bursty and need load leveling</li>
                <li>You want to add new consumers without modifying producers</li>
            </ul>`,
            explanation: 'Request-driven is like a phone call — direct, synchronous, both parties engaged. Event-driven is like a bulletin board — you post an announcement, anyone interested reads it on their own schedule.',
            bestPractices: [
                'Events describe facts (past tense): OrderPlaced, not PlaceOrder',
                'Design events as the public contract — version them carefully',
                'Use correlation IDs to trace event flows across services',
                'Make all consumers idempotent'
            ],
            commonMistakes: [
                'Using events when a simple API call would suffice (over-engineering)',
                'Treating events as commands (imperatives)',
                'Not planning for eventual consistency in the UI'
            ],
            interviewTip: 'Give a concrete scenario: "In our order system, when an order is placed, 5 things need to happen (payment, inventory, notification, analytics, shipping). With request-driven, the order service would call all 5. With EDA, it publishes one event and each service reacts independently."',
            followUp: [
                'How do you handle ordering guarantees?',
                'What is the CAP theorem implication for EDA?',
                'How do you debug issues in event-driven systems?'
            ]
        },

        {
            question: 'Explain Event Sourcing. How does it differ from traditional CRUD persistence?',
            difficulty: 'medium',
            answer: `<p><strong>Event Sourcing</strong> stores state as an append-only sequence of domain events rather than
            mutable rows. The current state of an entity is derived by replaying all its events from the beginning.</p>
            <h4>Traditional CRUD</h4>
            <ul>
                <li>Stores the current state only (latest values)</li>
                <li>History is lost unless you add separate audit tables</li>
                <li>Updates overwrite previous values</li>
            </ul>
            <h4>Event Sourcing</h4>
            <ul>
                <li>Stores every state change as an immutable event</li>
                <li>Complete history is preserved — can reconstruct state at any point in time</li>
                <li>Never update or delete — only append new events</li>
                <li>Current state = replay(allEvents)</li>
            </ul>
            <h4>Benefits</h4>
            <p>Complete audit trail, temporal queries, ability to rebuild projections, debugging
            by replaying events, natural fit for CQRS.</p>
            <h4>Trade-offs</h4>
            <p>More complex querying (need projections), performance degrades with many events
            per aggregate (use snapshots), eventual consistency for read models, steeper learning curve.</p>`,
            code: `// Traditional CRUD: only current state
UPDATE BankAccount SET Balance = 850 WHERE Id = 'acct-1';
-- What happened? No idea. Was it a withdrawal? Transfer? Fee?

// Event Sourcing: complete history
// Stream: BankAccount-acct-1
{ type: "AccountOpened", balance: 1000, date: "2024-01-01" }
{ type: "MoneyDeposited", amount: 500, date: "2024-01-15" }
{ type: "MoneyWithdrawn", amount: 200, date: "2024-02-01" }
{ type: "FeeCharged", amount: 50, date: "2024-02-15" }
{ type: "TransferSent", amount: 400, to: "acct-2", date: "2024-03-01" }
// Current balance: 1000 + 500 - 200 - 50 - 400 = 850
// Full audit trail preserved!`,
            language: 'javascript',
            bestPractices: [
                'Keep events small and focused on a single state change',
                'Use snapshots every N events for aggregates with long histories',
                'Never modify or delete events — they are immutable facts',
                'Version your event schemas for backward compatibility'
            ],
            commonMistakes: [
                'Storing too much data in events (entire entity state on every change)',
                'Not implementing snapshots — loading 100K events per request is slow',
                'Trying to query the event store directly instead of building projections',
                'Using event sourcing for simple CRUD entities (over-engineering)'
            ],
            interviewTip: 'Use a concrete example: "A bank account is perfect for event sourcing — every deposit, withdrawal, and fee is an event. I can reconstruct the balance at any point in time, generate statements, and have a complete audit trail for regulators."',
            followUp: [
                'How do you handle schema evolution in event sourcing?',
                'What are snapshots and when would you use them?',
                'Can you delete events for GDPR compliance?'
            ],
            seniorPerspective: 'In production, I use event sourcing selectively — not for every service. It shines for domains where audit trails matter (finance, compliance), where you need temporal queries, or where you want to rebuild projections with different shapes. For simple CRUD services, traditional persistence is simpler and sufficient.',
            architectPerspective: 'Event sourcing is an architectural enabler: it naturally supports CQRS (events feed projections), enables new consumers to replay history, and makes the system\'s behavior fully auditable. The key architectural decision is the event store technology — EventStoreDB for purpose-built, Kafka for streaming use cases, or a relational DB with an events table for simplicity.'
        },

        {
            question: 'What is the Transactional Outbox pattern and why is it necessary?',
            difficulty: 'medium',
            answer: `<p>The <strong>Transactional Outbox</strong> pattern solves the "dual write problem" — the challenge of
            atomically updating a database AND publishing an event to a message broker.</p>
            <h4>The Problem</h4>
            <p>If you save to the DB and then publish to the broker as separate operations:</p>
            <ul>
                <li>DB write succeeds, broker publish fails → state changed but no event (inconsistent)</li>
                <li>DB write fails, broker publish succeeded → event published but state not changed (ghost event)</li>
            </ul>
            <h4>The Solution</h4>
            <ol>
                <li>Write the business state AND the event message to an "outbox" table in the same DB transaction</li>
                <li>A separate background process (relay/dispatcher) reads unpublished messages from the outbox</li>
                <li>The relay publishes each message to the broker and marks it as processed</li>
                <li>If the relay crashes, it retries from the last unpublished message (at-least-once)</li>
            </ol>`,
            mermaid: `sequenceDiagram
    participant App as Application
    participant DB as Database
    participant Relay as Outbox Relay
    participant Broker as Message Broker
    participant Consumer as Consumer

    App->>DB: BEGIN TRANSACTION
    App->>DB: INSERT/UPDATE business data
    App->>DB: INSERT into Outbox table
    App->>DB: COMMIT
    Note over DB: Both writes are atomic

    loop Every N seconds
        Relay->>DB: SELECT unprocessed messages
        DB-->>Relay: Messages
        Relay->>Broker: Publish message
        Broker-->>Relay: ACK
        Relay->>DB: Mark as processed
    end

    Broker->>Consumer: Deliver message`,
            bestPractices: [
                'Use polling or Change Data Capture (CDC) for the relay — CDC (Debezium) avoids polling overhead',
                'Include idempotency keys in outbox messages for deduplication',
                'Clean up processed outbox messages periodically (retention policy)',
                'Monitor outbox lag — growing backlog indicates relay issues'
            ],
            commonMistakes: [
                'Publishing directly to broker without outbox — guaranteed data loss on failures',
                'Not making the relay idempotent — relay restart can republish already-sent messages',
                'Outbox table growing unbounded — implement cleanup/archival',
                'Using distributed transactions (2PC) instead — these don\'t scale and add latency'
            ],
            interviewTip: 'Draw the sequence diagram showing the dual-write problem, then explain how the outbox solves it with a single atomic transaction. Mention that CDC (Debezium + Kafka Connect) is the production-grade alternative to polling.',
            followUp: [
                'What is Change Data Capture and how does it relate to the Outbox pattern?',
                'How do you handle outbox message ordering?',
                'What is the Inbox pattern (consumer-side deduplication)?'
            ]
        },

        {
            question: 'Compare CQRS with and without Event Sourcing. When do you need both?',
            difficulty: 'hard',
            answer: `<p><strong>CQRS</strong> (Command Query Responsibility Segregation) separates the write model (commands)
            from the read model (queries). They can use different data stores, schemas, and scaling strategies.</p>
            <h4>CQRS WITHOUT Event Sourcing</h4>
            <ul>
                <li>Write side: traditional database (SQL) with normalized schema</li>
                <li>Read side: denormalized views/materialized views optimized for queries</li>
                <li>Sync mechanism: database triggers, CDC, or application-level events</li>
                <li>Simpler to implement, no event replay capability</li>
            </ul>
            <h4>CQRS WITH Event Sourcing</h4>
            <ul>
                <li>Write side: event store (append-only log of domain events)</li>
                <li>Read side: projections built by replaying events into query-optimized stores</li>
                <li>Can rebuild any read model from scratch by replaying history</li>
                <li>Full audit trail and temporal queries</li>
                <li>More complex but more powerful</li>
            </ul>
            <h4>When You Need Both</h4>
            <p>Use CQRS + Event Sourcing when: audit trail is mandatory, you need temporal queries
            ("what was the state at time X?"), multiple read model shapes are needed, or you want
            the ability to add new projections retroactively.</p>`,
            bestPractices: [
                'Start with CQRS alone (separate read/write models) — add Event Sourcing only when needed',
                'CQRS is valid even with a single database (separate query vs command handlers)',
                'Design projections for specific query patterns — one projection per screen/API',
                'Accept eventual consistency between write and read sides (typically ms-level lag)'
            ],
            commonMistakes: [
                'Using CQRS for simple CRUD — the overhead is not justified for basic apps',
                'Assuming CQRS requires Event Sourcing — they are independent patterns',
                'Building one "god" read model instead of purpose-specific projections',
                'Not communicating to the UI team that reads may be slightly stale'
            ],
            interviewTip: 'Make it clear you understand these are TWO separate patterns that complement each other. "CQRS separates reads from writes. Event Sourcing stores state as events. They combine naturally because events from the write side feed projections on the read side — but you can use either independently."',
            followUp: [
                'How do you handle the read model being stale?',
                'What consistency guarantees can you provide to the UI?',
                'How do you rebuild a corrupted projection?'
            ],
            seniorPerspective: 'In practice, I use "lite CQRS" far more than full event sourcing. Separate read/write models with a SQL database on both sides, synced via domain events. This gives 80% of the benefit (scalable reads, optimized query models) with 20% of the complexity. Full event sourcing is reserved for domains where the audit trail IS the product.',
            architectPerspective: 'CQRS enables polyglot read stores — the same events can feed SQL for transactional queries, Elasticsearch for full-text search, Redis for hot data, and a data lake for analytics. The architectural power is that adding a new read model is "free" — just deploy a new projection consumer without touching the write side.'
        },

        {
            question: 'How do you handle message ordering, deduplication, and exactly-once processing?',
            difficulty: 'hard',
            answer: `<p>These three challenges are fundamental to reliable event-driven systems:</p>
            <h4>Message Ordering</h4>
            <ul>
                <li>Most brokers guarantee ordering only within a partition/queue</li>
                <li>Use the entity ID as partition key — all events for one order go to one partition</li>
                <li>Global ordering across partitions is impossible without single-partition bottleneck</li>
                <li>Design consumers to handle out-of-order delivery (use event timestamps/sequence numbers)</li>
            </ul>
            <h4>Deduplication (Idempotent Processing)</h4>
            <ul>
                <li>At-least-once delivery means duplicates WILL occur</li>
                <li>Store processed message IDs (idempotency store) — skip if already seen</li>
                <li>Use natural idempotency where possible (SET balance = X is idempotent, INCREMENT is not)</li>
                <li>Redis with TTL or a DB table with unique constraint on message ID</li>
            </ul>
            <h4>Exactly-Once Processing</h4>
            <p>"Exactly-once" is effectively achieved through at-least-once delivery + idempotent processing.
            True exactly-once is possible within Kafka transactions (producer + consumer in same transaction)
            but not across heterogeneous systems.</p>`,
            code: `// Handling out-of-order events with version tracking
public class OrderProjection
{
    public async Task Handle(OrderEvent @event, CancellationToken ct)
    {
        var existing = await _readStore.GetAsync(@event.OrderId);

        // Skip if this event is older than what we've already processed
        if (existing != null && @event.SequenceNumber <= existing.LastProcessedSequence)
        {
            _logger.LogWarning("Out-of-order event {Seq} skipped (current: {Current})",
                @event.SequenceNumber, existing.LastProcessedSequence);
            return;
        }

        // Process and update sequence tracker
        await ApplyEvent(existing, @event);
        await _readStore.UpdateSequenceAsync(@event.OrderId, @event.SequenceNumber);
    }
}

// Kafka exactly-once: transactional producer + consumer
var producer = kafka.producer({ transactionalId: 'processor-1', idempotent: true });
await producer.connect();

await consumer.run({
    eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsetsIfNecessary }) => {
        const transaction = await producer.transaction();
        try {
            for (const message of batch.messages) {
                const result = await processMessage(message);
                // Produce output within same transaction
                await transaction.send({ topic: 'output', messages: [result] });
                resolveOffset(message.offset);
            }
            // Commit consumer offset + produced messages atomically
            await transaction.sendOffsets({
                consumerGroupId: 'processor-group',
                topics: [{ topic: batch.topic, partitions: [{ partition: batch.partition, offset: batch.lastOffset() }] }]
            });
            await transaction.commit();
        } catch (e) {
            await transaction.abort();
            throw e;
        }
    }
});`,
            language: 'typescript',
            bestPractices: [
                'Default to at-least-once + idempotent consumers — simplest reliable approach',
                'Use entity ID as partition key for per-entity ordering guarantees',
                'Store the last processed sequence number to detect and handle out-of-order events',
                'Set TTL on idempotency records — you don\'t need to remember forever'
            ],
            commonMistakes: [
                'Assuming messages arrive in order across partitions',
                'Not handling duplicates because "the broker guarantees exactly-once" (it doesn\'t across systems)',
                'Using auto-commit offsets — if processing fails after commit, message is lost',
                'Idempotency store without TTL — grows forever consuming memory/disk'
            ],
            interviewTip: 'Clearly state: "True exactly-once delivery across distributed systems is impossible. What we achieve in practice is effectively-once processing through at-least-once delivery combined with idempotent consumer logic." This shows deep understanding.',
            followUp: [
                'How does Kafka achieve exactly-once within its ecosystem?',
                'What is the Inbox pattern?',
                'How do you handle a poison message that always fails?'
            ]
        }
    ]
});
