'use strict';

PageData.register('arch-data-modeling', {
  title: 'Data Modeling & Schema Design',
  description: 'Advanced data modeling patterns including normalization, strategic denormalization, NoSQL design, schema evolution, and polyglot persistence in distributed systems.',
  sections: [
    {
      title: 'Introduction',
      content: `
        <p>Data modeling is the foundation of every system. A well-designed schema enables fast queries,
        maintains integrity, and evolves gracefully. A poorly designed schema becomes a permanent tax on
        every feature built on top of it.</p>
        <p>This topic covers relational normalization, strategic denormalization for performance, NoSQL
        modeling patterns (document stores, single-table DynamoDB), schema evolution strategies, and how
        to choose storage technologies based on access patterns rather than hype.</p>
      `
    },
    {
      title: 'Core Concepts',
      content: `
        <h3>Normalization (1NF through BCNF)</h3>
        <ul>
          <li><strong>1NF:</strong> Atomic values, no repeating groups. Each cell contains one value.</li>
          <li><strong>2NF:</strong> 1NF + no partial dependencies. Non-key attributes depend on the full primary key.</li>
          <li><strong>3NF:</strong> 2NF + no transitive dependencies. Non-key attributes depend only on the key.</li>
          <li><strong>BCNF:</strong> Every determinant is a candidate key. Handles edge cases 3NF misses.</li>
        </ul>
        <p>Normalize for correctness first. Denormalize for performance second, with measurements.</p>

        <h3>Strategic Denormalization</h3>
        <p>Intentionally duplicating data to avoid expensive JOINs at read time. Valid when:</p>
        <ul>
          <li>Read frequency vastly exceeds write frequency (100:1 or more)</li>
          <li>The duplicated data changes infrequently (user name, product category)</li>
          <li>Query latency requirements cannot be met with normalized schema</li>
        </ul>
        <p>Always document WHY data is denormalized and HOW consistency is maintained.</p>

        <h3>NoSQL Modeling Patterns</h3>
        <ul>
          <li><strong>Single-Table Design (DynamoDB):</strong> All entities in one table with composite keys.
          Access patterns drive key design. Enables single-request fetches for complex aggregates.</li>
          <li><strong>Document Embedding vs Referencing (MongoDB):</strong> Embed when data is accessed
          together and has 1:few relationships. Reference when data is shared, large, or has unbounded growth.</li>
        </ul>

        <h3>Schema Evolution</h3>
        <ul>
          <li><strong>Additive changes:</strong> New columns with defaults, new tables. Always safe.</li>
          <li><strong>Expand-contract:</strong> Add new structure, migrate data, remove old. Zero downtime.</li>
          <li><strong>Versioned schemas:</strong> Schema version field in documents. Application handles all versions.</li>
        </ul>

        <h3>Polyglot Persistence</h3>
        <p>Using different storage technologies for different access patterns within one system:</p>
        <ul>
          <li>PostgreSQL for transactional data (orders, payments)</li>
          <li>Redis for caching and session data</li>
          <li>Elasticsearch for full-text search</li>
          <li>S3/Blob storage for files and media</li>
          <li>Time-series DB (InfluxDB, TimescaleDB) for metrics</li>
        </ul>

        <h3>Event Sourcing as Data Model</h3>
        <p>Instead of storing current state, store the sequence of events that led to the current state.
        The current state is derived by replaying events. Provides complete audit trail, temporal queries,
        and the ability to rebuild read models from scratch.</p>
      `
    },
    {
      title: 'Data Storage Decision Model',
      content: `
        <p>Choosing the right storage technology based on access patterns:</p>
        <div class="mermaid-diagram">
          <pre class="mermaid">
graph TB
    START[Data Access Pattern?] --> Q1{Transactional<br/>ACID needed?}
    Q1 -->|Yes| RDBMS[Relational DB<br/>PostgreSQL / SQL Server]
    Q1 -->|No| Q2{Access pattern?}

    Q2 -->|Key-Value lookups| KV[Redis / DynamoDB]
    Q2 -->|Full-text search| SEARCH[Elasticsearch / Typesense]
    Q2 -->|Time-series| TS[TimescaleDB / InfluxDB]
    Q2 -->|Graph traversal| GRAPH[Neo4j / Neptune]
    Q2 -->|Document with nesting| DOC[MongoDB / CosmosDB]
    Q2 -->|Event log| EVT[Kafka / EventStoreDB]
    Q2 -->|Binary / Files| BLOB[S3 / Azure Blob]

    RDBMS --> SCALE{Scale requirement?}
    SCALE -->|Read-heavy| REPLICA[Add Read Replicas]
    SCALE -->|Write-heavy| SHARD[Shard by tenant/region]
    SCALE -->|Both| CQRS_DB[CQRS: Separate stores]
          </pre>
        </div>
      `
    },
    {
      title: 'Event Sourcing Data Flow',
      content: `
        <p>How event sourcing maintains state through event streams and projections:</p>
        <div class="mermaid-diagram">
          <pre class="mermaid">
sequenceDiagram
    participant Cmd as Command Handler
    participant ES as Event Store
    participant Proj as Projection Engine
    participant Read as Read Model DB

    Cmd->>ES: Load events for aggregate
    ES->>Cmd: [OrderCreated, ItemAdded, ItemAdded]
    Note over Cmd: Rebuild current state<br/>from event history

    Cmd->>Cmd: Validate command<br/>against current state
    Cmd->>ES: Append new event:<br/>OrderConfirmed

    ES->>Proj: New event notification
    Proj->>Proj: Apply event to<br/>read model projection
    Proj->>Read: UPDATE order_view<br/>SET status = 'confirmed'

    Note over ES,Read: Event store is source of truth<br/>Read model is disposable cache
          </pre>
        </div>
      `
    },
    {
      title: 'Implementation',
      content: `
        <h3>Single-Table DynamoDB Design (TypeScript)</h3>
        <pre><code class="language-typescript">// Single-table design: all entities use same table with composite keys
// Access patterns drive key design

interface DynamoItem {
  PK: string;  // Partition key
  SK: string;  // Sort key
  GSI1PK?: string;  // Global Secondary Index 1
  GSI1SK?: string;
  type: string;
  // ... entity-specific attributes
}

// Entity key patterns
const keyPatterns = {
  // Customer: PK=CUST#123, SK=PROFILE
  customerProfile: (id: string) => ({ PK: \`CUST#\${id}\`, SK: 'PROFILE' }),

  // Order: PK=CUST#123, SK=ORDER#2024-01-15#ORD-456
  customerOrder: (custId: string, date: string, orderId: string) =>
    ({ PK: \`CUST#\${custId}\`, SK: \`ORDER#\${date}#\${orderId}\` }),

  // Order items: PK=ORDER#456, SK=ITEM#1
  orderItem: (orderId: string, itemNum: number) =>
    ({ PK: \`ORDER#\${orderId}\`, SK: \`ITEM#\${itemNum}\` }),
};

class OrderRepository {
  // Single query: get customer with recent orders
  async getCustomerWithOrders(customerId: string): Promise&lt;CustomerView&gt; {
    const result = await this.dynamo.query({
      TableName: 'AppTable',
      KeyConditionExpression: 'PK = :pk AND SK BETWEEN :start AND :end',
      ExpressionAttributeValues: {
        ':pk': \`CUST#\${customerId}\`,
        ':start': 'ORDER#',
        ':end': 'ORDER#~',  // ~ sorts after all dates
      },
    });

    // One query returns customer + all orders (no JOINs needed)
    const profile = result.Items.find(i => i.SK === 'PROFILE');
    const orders = result.Items.filter(i => i.SK.startsWith('ORDER#'));
    return { ...profile, orders };
  }

  // GSI for cross-customer queries: "all orders by status"
  async getOrdersByStatus(status: string): Promise&lt;Order[]&gt; {
    const result = await this.dynamo.query({
      TableName: 'AppTable',
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :status',
      ExpressionAttributeValues: { ':status': \`STATUS#\${status}\` },
    });
    return result.Items as Order[];
  }
}</code></pre>

        <h3>Event Sourcing Implementation (C#)</h3>
        <pre><code class="language-csharp">// Aggregate that rebuilds state from events
public class OrderAggregate
{
    public Guid Id { get; private set; }
    public OrderStatus Status { get; private set; }
    public List&lt;OrderItem&gt; Items { get; private set; } = new();
    public decimal TotalAmount { get; private set; }
    public int Version { get; private set; }

    private readonly List&lt;IDomainEvent&gt; _uncommittedEvents = new();

    // Rebuild from event history
    public static OrderAggregate FromHistory(IEnumerable&lt;IDomainEvent&gt; events)
    {
        var aggregate = new OrderAggregate();
        foreach (var evt in events)
            aggregate.Apply(evt);
        return aggregate;
    }

    // Command: business logic + validation
    public void AddItem(string productId, int quantity, decimal price)
    {
        if (Status != OrderStatus.Draft)
            throw new DomainException("Cannot add items to confirmed order");

        if (quantity <= 0)
            throw new DomainException("Quantity must be positive");

        // Emit event (not direct state mutation)
        RaiseEvent(new OrderItemAdded
        {
            OrderId = Id,
            ProductId = productId,
            Quantity = quantity,
            UnitPrice = price,
        });
    }

    // Event application: pure state mutation
    private void Apply(IDomainEvent evt)
    {
        switch (evt)
        {
            case OrderCreated e:
                Id = e.OrderId;
                Status = OrderStatus.Draft;
                break;
            case OrderItemAdded e:
                Items.Add(new OrderItem(e.ProductId, e.Quantity, e.UnitPrice));
                TotalAmount = Items.Sum(i => i.Quantity * i.UnitPrice);
                break;
            case OrderConfirmed _:
                Status = OrderStatus.Confirmed;
                break;
        }
        Version++;
    }

    private void RaiseEvent(IDomainEvent evt)
    {
        Apply(evt);
        _uncommittedEvents.Add(evt);
    }
}

// Event store persistence
public class EventStoreRepository
{
    private readonly IEventStore _store;

    public async Task&lt;OrderAggregate&gt; GetAsync(Guid orderId)
    {
        var events = await _store.ReadStreamAsync($"order-{orderId}");
        return OrderAggregate.FromHistory(events);
    }

    public async Task SaveAsync(OrderAggregate aggregate)
    {
        var events = aggregate.GetUncommittedEvents();
        await _store.AppendToStreamAsync(
            $"order-{aggregate.Id}",
            aggregate.Version,  // Optimistic concurrency
            events);
    }
}</code></pre>

        <h3>Schema Evolution with Versioning (C#)</h3>
        <pre><code class="language-csharp">// Document schema evolution with version-based migration
public class SchemaEvolutionService
{
    private readonly Dictionary&lt;int, ISchemaUpgrader&gt; _upgraders = new()
    {
        [1] = new V1ToV2Upgrader(),  // Add email field
        [2] = new V2ToV3Upgrader(),  // Split name into first/last
        [3] = new V3ToV4Upgrader(),  // Add address object
    };

    private const int CurrentVersion = 4;

    public T Deserialize&lt;T&gt;(string json) where T : IVersionedDocument
    {
        var raw = JsonDocument.Parse(json);
        var version = raw.RootElement.GetProperty("schemaVersion").GetInt32();

        // Upgrade through each version incrementally
        var document = raw;
        while (version < CurrentVersion)
        {
            document = _upgraders[version].Upgrade(document);
            version++;
        }

        return JsonSerializer.Deserialize&lt;T&gt;(document);
    }
}

// Upgrader example: split "name" into "firstName" + "lastName"
public class V2ToV3Upgrader : ISchemaUpgrader
{
    public JsonDocument Upgrade(JsonDocument doc)
    {
        var root = doc.RootElement;
        var name = root.GetProperty("name").GetString();
        var parts = name.Split(' ', 2);

        // Build new document with transformed structure
        return JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            schemaVersion = 3,
            firstName = parts[0],
            lastName = parts.Length > 1 ? parts[1] : "",
            // ... carry forward other fields
        }));
    }
}</code></pre>
      `
    },
    {
      title: 'Common Mistakes',
      content: `
        <ul>
          <li><strong>Denormalizing prematurely:</strong> Optimizing for read performance before measuring
          whether the normalized schema is actually slow. Always benchmark first.</li>
          <li><strong>NoSQL without access patterns:</strong> Choosing MongoDB or DynamoDB without defining
          query patterns first leads to inefficient scans and secondary indexes everywhere.</li>
          <li><strong>Unbounded document growth:</strong> Embedding arrays that grow forever (comments, logs)
          in documents. Eventually hits document size limits or degrades write performance.</li>
          <li><strong>Event sourcing everywhere:</strong> Applying event sourcing to simple CRUD entities
          that don't need audit trails or temporal queries. The overhead is not justified.</li>
          <li><strong>Schema changes without migration plan:</strong> Adding NOT NULL columns without defaults
          or removing columns still referenced by old code versions. Always use expand-contract.</li>
          <li><strong>Polyglot persistence without ops maturity:</strong> Running 5 different databases
          requires 5x the operational expertise: backups, monitoring, scaling, security patching.</li>
          <li><strong>Ignoring data ownership in microservices:</strong> Multiple services writing to the
          same table creates coupling and consistency nightmares. Each service owns its data.</li>
        </ul>
      `
    },
    {
      title: 'Interview Tips',
      type: 'callout',
      content: `
        <div class="callout callout-tip">
          <h4>Interview Tips</h4>
          <ul>
            <li>Always start with <strong>access patterns</strong>: "What queries will this data serve?"
            before choosing a data model or storage technology.</li>
            <li>Show you understand trade-offs: normalization = write consistency vs denormalization = read
            performance. Neither is universally correct.</li>
            <li>For DynamoDB questions, demonstrate single-table design thinking: partition key, sort key,
            GSI design based on query patterns.</li>
            <li>Mention <strong>data ownership</strong> in microservices: each service owns its data, exposes
            it via APIs, never shares databases.</li>
            <li>For event sourcing questions, discuss both benefits (audit, temporal queries, replay) AND
            costs (eventual consistency, complexity, storage growth).</li>
            <li>Know when to use each: RDBMS for transactions, document store for flexible schemas, key-value
            for caching, graph for relationships, time-series for metrics.</li>
          </ul>
        </div>
      `
    },
    {
      title: 'Key Takeaways',
      content: `
        <ul>
          <li>Normalize first for correctness; denormalize second for measured performance needs.</li>
          <li>NoSQL schema design is driven entirely by access patterns — define queries before designing keys.</li>
          <li>Single-table DynamoDB design uses composite keys to enable single-request access to related entities.</li>
          <li>Schema evolution must be backward-compatible at every step (expand-contract pattern).</li>
          <li>Event sourcing provides audit trails and temporal queries but adds complexity — use selectively.</li>
          <li>Polyglot persistence matches storage technology to access patterns but multiplies operational burden.</li>
          <li>In microservices, each service owns its data. Cross-service data access goes through APIs or events.</li>
        </ul>
      `
    }
  ],

  questions: [
    {
      id: 'arch-dm-q1',
      level: 'junior',
      title: 'What is database normalization and why is it important?',
      answer: `
        <p><strong>Normalization</strong> is the process of organizing database tables to minimize data
        redundancy and prevent update anomalies. Each level (normal form) eliminates a specific type of
        dependency problem:</p>
        <ul>
          <li><strong>1NF:</strong> Each column has atomic (single) values. No arrays or nested structures.</li>
          <li><strong>2NF:</strong> No partial dependencies — every non-key column depends on the entire
          primary key, not just part of it.</li>
          <li><strong>3NF:</strong> No transitive dependencies — non-key columns don't depend on other
          non-key columns.</li>
        </ul>
        <p><strong>Why it matters:</strong></p>
        <ul>
          <li>Prevents <strong>update anomalies</strong>: changing a customer name in one place updates it everywhere</li>
          <li>Prevents <strong>insertion anomalies</strong>: can add a new customer without creating a fake order</li>
          <li>Prevents <strong>deletion anomalies</strong>: deleting an order doesn't lose customer data</li>
          <li>Reduces storage by eliminating redundant data</li>
        </ul>
        <p>In practice, most systems target 3NF for transactional data, then strategically denormalize
        specific read-heavy paths.</p>
      `
    },
    {
      id: 'arch-dm-q2',
      level: 'mid',
      title: 'When would you embed vs reference documents in MongoDB?',
      answer: `
        <p><strong>Embed</strong> (subdocuments within parent) when:</p>
        <ul>
          <li>Data is always accessed together (order + its line items)</li>
          <li>The relationship is 1:few (a user has 3-5 addresses)</li>
          <li>The child data doesn't make sense without the parent</li>
          <li>Updates to child data are infrequent</li>
        </ul>
        <p><strong>Reference</strong> (store ID, fetch separately) when:</p>
        <ul>
          <li>Data is shared across multiple parents (a product referenced by many orders)</li>
          <li>The child collection is unbounded (comments on a post — could be millions)</li>
          <li>The child is frequently accessed independently of the parent</li>
          <li>The child data changes frequently and you want to avoid updating many parent documents</li>
        </ul>
        <p><strong>Hybrid:</strong> Embed a summary (product name + price at time of order) for display
        while referencing the full product document for detailed views. This denormalizes for common
        reads while maintaining a reference for accuracy.</p>
      `
    },
    {
      id: 'arch-dm-q3',
      level: 'mid',
      title: 'Explain the expand-contract pattern for schema migrations.',
      answer: `
        <p><strong>Expand-Contract</strong> enables schema changes with zero downtime by ensuring backward
        compatibility at every step:</p>
        <ol>
          <li><strong>Expand:</strong> Add the new schema element (column, table, index) alongside the old.
          Both old and new application versions work correctly.</li>
          <li><strong>Migrate:</strong> Backfill data from old structure to new. Deploy application code
          that writes to both (dual-write).</li>
          <li><strong>Verify:</strong> Confirm all data is consistent. Run validation queries.</li>
          <li><strong>Switch:</strong> Update application to read from new structure. Old structure is
          now unused but still present.</li>
          <li><strong>Contract:</strong> After a grace period (ensuring no rollback is needed), remove the
          old structure.</li>
        </ol>
        <p>Example: renaming a column from "user_name" to "display_name":</p>
        <ul>
          <li>Expand: ADD COLUMN display_name</li>
          <li>Migrate: Copy data, dual-write in app</li>
          <li>Switch: Read from display_name</li>
          <li>Contract: DROP COLUMN user_name (2 sprints later)</li>
        </ul>
        <p>The key insight: each step is independently deployable and rollback-safe. If any step fails,
        the system continues working with the previous step's state.</p>
      `
    },
    {
      id: 'arch-dm-q4',
      level: 'senior',
      title: 'Design a single-table DynamoDB schema for an e-commerce order system.',
      answer: `
        <p>Single-table design requires defining access patterns first:</p>
        <ol>
          <li>Get customer profile by ID</li>
          <li>Get all orders for a customer (sorted by date)</li>
          <li>Get order details with all items</li>
          <li>Get all orders by status (for admin dashboard)</li>
          <li>Get all items for a specific product (for analytics)</li>
        </ol>
        <p><strong>Key design:</strong></p>
        <pre><code class="language-typescript">// Main table keys
PK: "CUST#123"     SK: "PROFILE"           -> Customer profile
PK: "CUST#123"     SK: "ORDER#2024-01-15#ORD-789" -> Order header
PK: "ORDER#789"    SK: "ITEM#1"            -> Order line item
PK: "ORDER#789"    SK: "ITEM#2"            -> Order line item
PK: "ORDER#789"    SK: "METADATA"          -> Order metadata

// GSI1: Orders by status
GSI1PK: "STATUS#pending"   GSI1SK: "2024-01-15#ORD-789"
GSI1PK: "STATUS#shipped"   GSI1SK: "2024-01-14#ORD-456"

// GSI2: Items by product
GSI2PK: "PROD#SKU-001"     GSI2SK: "2024-01-15#ORDER-789"</code></pre>
        <p>Access pattern 1: Query PK=CUST#123, SK=PROFILE (single item).
        Pattern 2: Query PK=CUST#123, SK begins_with ORDER# (all customer orders).
        Pattern 3: Query PK=ORDER#789 (order + all items in one query).
        Pattern 4: Query GSI1 PK=STATUS#pending.
        Pattern 5: Query GSI2 PK=PROD#SKU-001.</p>
        <p>Trade-off: no ad-hoc queries. Every access pattern must be designed upfront.</p>
      `
    },
    {
      id: 'arch-dm-q5',
      level: 'senior',
      title: 'When is event sourcing the right data model, and when is it overkill?',
      answer: `
        <p><strong>Event sourcing is right when:</strong></p>
        <ul>
          <li><strong>Audit requirements:</strong> Regulatory needs require complete history of all changes
          (financial systems, healthcare, compliance).</li>
          <li><strong>Temporal queries:</strong> "What was the account balance on March 15?" requires
          replaying events to a point in time.</li>
          <li><strong>Complex domain events:</strong> The business cares about what happened, not just
          current state (order placed, item added, payment attempted, payment failed, payment retried).</li>
          <li><strong>Multiple read models:</strong> Different views of the same data (dashboard view,
          report view, API view) that need different denormalizations.</li>
          <li><strong>Event-driven architecture:</strong> Other services need to react to domain events
          anyway — storing events is natural.</li>
        </ul>
        <p><strong>Event sourcing is overkill when:</strong></p>
        <ul>
          <li>Simple CRUD with no audit needs (user preferences, feature flags)</li>
          <li>The team lacks event sourcing experience (steep learning curve)</li>
          <li>Strong consistency is required everywhere (event sourcing is inherently eventually consistent)</li>
          <li>The domain is simple and well-understood (no complex state transitions)</li>
        </ul>
        <p>Middle ground: use event sourcing for core domain aggregates (orders, accounts) and traditional
        CRUD for supporting contexts (user profiles, settings).</p>
      `
    },
    {
      id: 'arch-dm-q6',
      level: 'architect',
      title: 'How do you handle data ownership and consistency across microservices?',
      answer: `
        <p>Each microservice <strong>owns its data exclusively</strong>. No shared databases. Other services
        access data only through the owning service's API or by consuming its events.</p>
        <p><strong>Patterns for cross-service data:</strong></p>
        <ol>
          <li><strong>API composition:</strong> A gateway or BFF aggregates data from multiple services
          per request. Simple but adds latency and coupling.</li>
          <li><strong>Event-carried state transfer:</strong> Services publish events containing data that
          other services cache locally. Each service has a local read-only copy of data it needs.
          Eventually consistent but highly autonomous.</li>
          <li><strong>Saga pattern:</strong> For multi-service transactions (place order → reserve inventory
          → charge payment), use orchestrated or choreographed sagas with compensating actions on failure.</li>
        </ol>
        <pre><code class="language-csharp">// Event-carried state transfer: Order service caches product names
public class ProductEventHandler : IEventHandler&lt;ProductUpdatedEvent&gt;
{
    private readonly ILocalProductCache _cache;

    public async Task HandleAsync(ProductUpdatedEvent evt)
    {
        // Maintain local read-only copy of product data
        await _cache.UpsertAsync(new LocalProduct
        {
            ProductId = evt.ProductId,
            Name = evt.Name,
            Price = evt.Price,
            LastUpdated = evt.Timestamp,
        });
    }
}

// Order service uses local cache - no runtime dependency on Product service
public class OrderService
{
    private readonly ILocalProductCache _productCache;

    public async Task&lt;OrderView&gt; GetOrderView(Guid orderId)
    {
        var order = await _orderRepo.GetAsync(orderId);
        var products = await _productCache.GetManyAsync(
            order.Items.Select(i => i.ProductId));

        // Join locally - no cross-service call needed
        return MapToView(order, products);
    }
}</code></pre>
        <p>Trade-off: eventual consistency means services may briefly disagree on shared data. Design
        UIs and business processes to tolerate this (show "updating..." states, use compensation).</p>
      `
    },
    {
      id: 'arch-dm-q7',
      level: 'architect',
      title: 'Design the data architecture for a system that needs both OLTP and OLAP workloads.',
      answer: `
        <p>OLTP (transactions) and OLAP (analytics) have fundamentally different access patterns and
        should never share the same database instance:</p>
        <ol>
          <li><strong>OLTP layer:</strong> Normalized PostgreSQL/SQL Server. Optimized for single-row
          reads/writes, high concurrency, low latency. Row-oriented storage.</li>
          <li><strong>Change Data Capture:</strong> Stream changes from OLTP to analytics pipeline using
          Debezium/CDC. No impact on transactional performance.</li>
          <li><strong>Data lake/warehouse:</strong> Columnar storage (Snowflake, BigQuery, Redshift) for
          analytical queries. Denormalized star/snowflake schema optimized for aggregations.</li>
          <li><strong>Real-time analytics:</strong> For dashboards needing sub-second freshness, use
          materialized views (ClickHouse) or stream processing (Kafka + Flink).</li>
        </ol>
        <pre><code class="language-typescript">// Architecture layers
interface DataArchitecture {
  oltp: {
    engine: 'PostgreSQL';
    schema: 'Normalized 3NF';
    latency: '< 10ms';
    purpose: 'User-facing transactions';
  };
  streaming: {
    engine: 'Kafka + Debezium CDC';
    purpose: 'Real-time change propagation';
    latency: '< 1s end-to-end';
  };
  warehouse: {
    engine: 'Snowflake';
    schema: 'Star schema (denormalized)';
    freshness: '< 15 minutes';
    purpose: 'Business reporting, ad-hoc queries';
  };
  realtime: {
    engine: 'ClickHouse materialized views';
    freshness: '< 5 seconds';
    purpose: 'Operational dashboards, live metrics';
  };
}</code></pre>
        <p>Key principle: <strong>never run analytical queries on the OLTP database</strong>. A single
        poorly-optimized report query can lock tables and degrade user-facing performance. CDC decouples
        the two worlds completely.</p>
      `
    },
    {
      id: 'arch-dm-q8',
      level: 'senior',
      title: 'How would you handle schema versioning in a document database with millions of existing documents?',
      answer: `
        <p>With millions of documents, bulk migration is expensive and risky. Use <strong>lazy migration</strong>
        combined with <strong>version-aware deserialization</strong>:</p>
        <ol>
          <li><strong>Add version field:</strong> Every document gets a schemaVersion field. Existing
          documents default to version 1.</li>
          <li><strong>Version-aware reader:</strong> The application deserializes any version and upgrades
          in memory to the current version. No database change needed for reads.</li>
          <li><strong>Write-back on access:</strong> When a document is read and modified, write it back
          in the latest version. Documents migrate lazily as they are accessed.</li>
          <li><strong>Background migration:</strong> For documents that are rarely accessed, run a slow
          background job that migrates them in batches during off-peak hours.</li>
        </ol>
        <p><strong>Benefits:</strong> No downtime, no bulk migration risk, documents are always readable
        regardless of version. Cost: application code must handle all schema versions simultaneously.</p>
        <p><strong>Sunset strategy:</strong> After 6 months of lazy migration, check remaining V1 documents.
        If < 0.1%, run a final batch migration and remove V1 handling code. This simplifies the codebase
        while respecting the gradual migration principle.</p>
      `
    }
  ]
});
