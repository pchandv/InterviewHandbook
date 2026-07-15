/* ═══════════════════════════════════════════════════════════════════
   API DESIGN PATTERNS — Level 5: Architecture
   REST maturity, gRPC, GraphQL, versioning, idempotency, and
   API Gateway patterns for distributed systems.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('api-design-patterns', {

    title: 'API Design Patterns',
    level: 5,
    group: 'distributed-systems',
    description: 'Deep dive into API design: REST maturity model, gRPC for internal services, GraphQL, versioning strategies, idempotency, pagination, and API Gateway patterns.',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    prerequisites: ['aspnet-middleware', 'microservices'],

    sections: [

        // ─── 1. INTRODUCTION ──────────────────────────────────────────
        {
            title: 'Introduction',
            content: `<p><strong>API Design</strong> is the discipline of creating interfaces that services use to communicate.
            In distributed systems, APIs are the contracts between teams — a well-designed API enables
            independent evolution, while a poor API creates coupling and technical debt.</p>
            <p>This module covers:</p>
            <ul>
                <li>Richardson Maturity Model for REST APIs (Levels 0-3)</li>
                <li>gRPC for high-performance internal communication</li>
                <li>GraphQL for flexible client-driven queries</li>
                <li>Versioning strategies (URL, header, media type)</li>
                <li>Idempotency keys for safe retries</li>
                <li>Pagination patterns (offset, cursor, keyset)</li>
                <li>Error handling standards (RFC 7807 Problem Details)</li>
                <li>API Gateway and BFF patterns</li>
            </ul>`
        },

        // ─── 2. CORE CONCEPTS ─────────────────────────────────────────
        {
            title: 'Core Concepts',
            content: `<p>Foundational principles for API design:</p>
            <h4>Richardson Maturity Model</h4>
            <ul>
                <li><strong>Level 0:</strong> Single endpoint, RPC-style (SOAP, POST everything)</li>
                <li><strong>Level 1:</strong> Resources — different URIs for different entities (/orders, /customers)</li>
                <li><strong>Level 2:</strong> HTTP Verbs — proper use of GET, POST, PUT, DELETE, PATCH + status codes</li>
                <li><strong>Level 3:</strong> Hypermedia (HATEOAS) — responses include links to related actions</li>
            </ul>
            <h4>API-First Design</h4>
            <p>Design the API contract before writing implementation code. Use OpenAPI/Swagger to define
            the interface, share it with consumers for feedback, then implement.</p>
            <h4>Contract-First vs Code-First</h4>
            <ul>
                <li><strong>Contract-First:</strong> Write OpenAPI spec → generate server stubs and client SDKs</li>
                <li><strong>Code-First:</strong> Write controllers → generate OpenAPI spec from annotations</li>
            </ul>
            <h4>Key Design Principles</h4>
            <ul>
                <li><strong>Consistency:</strong> Uniform naming, response shapes, error formats across all endpoints</li>
                <li><strong>Discoverability:</strong> Self-documenting with clear resource naming and documentation</li>
                <li><strong>Backward Compatibility:</strong> New versions must not break existing consumers</li>
                <li><strong>Idempotency:</strong> Retrying the same request produces the same result (critical for reliability)</li>
            </ul>`,
            mermaid: `graph TB
    subgraph "Richardson Maturity Model"
        L0["Level 0: Swamp of POX<br/>Single URI, POST only"]
        L1["Level 1: Resources<br/>Multiple URIs"]
        L2["Level 2: HTTP Verbs<br/>GET, POST, PUT, DELETE"]
        L3["Level 3: Hypermedia<br/>HATEOAS links"]
    end
    L0 --> L1 --> L2 --> L3
    style L0 fill:#fee2e2,color:#1e293b
    style L1 fill:#fef3c7,color:#1e293b
    style L2 fill:#d1fae5,color:#1e293b
    style L3 fill:#dbeafe,color:#1e293b`
        },

        // ─── 3. HOW IT WORKS ──────────────────────────────────────────
        {
            title: 'How It Works',
            content: `<p>Different API styles serve different communication needs:</p>
            <h4>REST (Resource-Oriented)</h4>
            <p>Best for: external APIs, CRUD operations, browser consumption. Uses HTTP verbs on
            resource URIs. Stateless, cacheable, widely understood.</p>
            <h4>gRPC (Service-Oriented)</h4>
            <p>Best for: internal microservice communication. Uses Protocol Buffers (binary serialization),
            HTTP/2, bidirectional streaming. 5-10x faster than JSON/REST for internal calls.</p>
            <h4>GraphQL (Client-Driven)</h4>
            <p>Best for: mobile/web frontends that need flexible data fetching. Single endpoint,
            client specifies exactly what fields it needs. Eliminates over/under-fetching.</p>
            <h4>Choosing the Right Style</h4>
            <ol>
                <li><strong>External consumers / public API:</strong> REST (universally supported, cacheable)</li>
                <li><strong>Internal service-to-service:</strong> gRPC (performance, strong typing, streaming)</li>
                <li><strong>Frontend aggregation:</strong> GraphQL or BFF (flexible queries, reduce round trips)</li>
                <li><strong>Real-time updates:</strong> WebSocket or Server-Sent Events (SSE)</li>
            </ol>`,
            code: `// REST API — Resource-oriented design
// GET    /api/orders              → List orders (paginated)
// GET    /api/orders/{id}         → Get single order
// POST   /api/orders              → Create order
// PUT    /api/orders/{id}         → Full update
// PATCH  /api/orders/{id}         → Partial update
// DELETE /api/orders/{id}         → Delete order
// POST   /api/orders/{id}/cancel  → Action on resource (RPC-style verb)

// gRPC — Service-oriented design (Proto file)
syntax = "proto3";
package orders.v1;

service OrderService {
    rpc CreateOrder(CreateOrderRequest) returns (Order);
    rpc GetOrder(GetOrderRequest) returns (Order);
    rpc ListOrders(ListOrdersRequest) returns (ListOrdersResponse);
    rpc StreamOrderUpdates(StreamRequest) returns (stream OrderUpdate); // Server streaming
}

message CreateOrderRequest {
    string customer_id = 1;
    repeated OrderItem items = 2;
}

message Order {
    string id = 1;
    string customer_id = 2;
    repeated OrderItem items = 3;
    OrderStatus status = 4;
    google.protobuf.Timestamp created_at = 5;
}

// GraphQL — Client-driven queries
type Query {
    order(id: ID!): Order
    orders(filter: OrderFilter, page: PageInput): OrderConnection!
}

type Order {
    id: ID!
    customer: Customer!
    items: [OrderItem!]!
    status: OrderStatus!
    total: Money!
    createdAt: DateTime!
}`,
            language: 'csharp'
        },

        // ─── 4. VISUAL DIAGRAM ────────────────────────────────────────
        {
            title: 'Communication Patterns',
            content: `<p>How different API styles fit in a microservices ecosystem:</p>`,
            mermaid: `flowchart TB
    subgraph Clients["External Clients"]
        Web["Web App<br/>(React/Angular)"]
        Mobile["Mobile App"]
        Partner["Partner API<br/>Consumer"]
    end

    subgraph Edge["API Edge"]
        GW["API Gateway<br/>REST + Auth + Rate Limit"]
        GQL["GraphQL BFF<br/>(Client aggregation)"]
    end

    subgraph Internal["Internal Services (gRPC)"]
        OS["Order Service"]
        PS["Payment Service"]
        IS["Inventory Service"]
        US["User Service"]
    end

    subgraph Realtime["Real-Time"]
        WS["WebSocket Hub<br/>SignalR"]
    end

    Web -->|GraphQL| GQL
    Mobile -->|REST| GW
    Partner -->|REST v2| GW
    Web -->|WebSocket| WS

    GW -->|gRPC| OS & PS & IS & US
    GQL -->|gRPC| OS & IS & US

    OS <-->|gRPC| PS
    OS <-->|gRPC| IS

    style Edge fill:#fef3c7,color:#1e293b
    style Internal fill:#dbeafe,color:#1e293b
    style Realtime fill:#d1fae5,color:#1e293b`
        },

        // ─── 5. IMPLEMENTATION ────────────────────────────────────────
        {
            title: 'Implementation',
            content: `<p>Production patterns for API design — versioning, idempotency, pagination, and error handling:</p>`,
            tabs: [
                {
                    label: 'Idempotency Key',
                    code: `// Idempotency key middleware — safe retries for POST/PATCH/DELETE
[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    [HttpPost]
    [IdempotencyKey] // Custom attribute
    public async Task<ActionResult<PaymentResult>> ProcessPayment(
        [FromHeader(Name = "Idempotency-Key")] string idempotencyKey,
        [FromBody] PaymentRequest request,
        CancellationToken ct)
    {
        // Check if we've seen this key before
        var existing = await _idempotencyStore.GetAsync(idempotencyKey);
        if (existing != null)
            return StatusCode(existing.StatusCode, existing.Body); // Return cached response

        // Process the payment
        var result = await _paymentService.ProcessAsync(request, ct);

        // Cache the response for this idempotency key (24h TTL)
        await _idempotencyStore.StoreAsync(idempotencyKey, new IdempotencyRecord
        {
            StatusCode = 201,
            Body = result,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        });

        return Created($"/api/payments/{result.Id}", result);
    }
}

// Client usage: retry-safe payment
// POST /api/payments
// Headers: { "Idempotency-Key": "client-generated-uuid-abc123" }
// If network fails, client retries with SAME key → gets same response`,
                    language: 'csharp'
                },
                {
                    label: 'Pagination (Cursor)',
                    code: `// Cursor-based pagination — stable, performant, no offset drift
[HttpGet]
public async Task<ActionResult<PagedResponse<OrderDto>>> ListOrders(
    [FromQuery] string? cursor = null,
    [FromQuery] int pageSize = 20,
    CancellationToken ct = default)
{
    // Decode cursor (base64-encoded last seen ID + sort value)
    var decodedCursor = cursor != null ? DecodeCursor(cursor) : null;

    // Query with cursor (keyset pagination)
    var orders = await _db.Orders
        .Where(o => decodedCursor == null ||
            o.CreatedAt < decodedCursor.LastCreatedAt ||
            (o.CreatedAt == decodedCursor.LastCreatedAt && o.Id < decodedCursor.LastId))
        .OrderByDescending(o => o.CreatedAt)
        .ThenByDescending(o => o.Id)
        .Take(pageSize + 1) // Fetch one extra to check if there's a next page
        .Select(o => o.ToDto())
        .ToListAsync(ct);

    var hasNextPage = orders.Count > pageSize;
    var items = orders.Take(pageSize).ToList();
    var nextCursor = hasNextPage ? EncodeCursor(items.Last()) : null;

    return Ok(new PagedResponse<OrderDto>
    {
        Items = items,
        NextCursor = nextCursor,
        HasNextPage = hasNextPage
    });
}

// Response shape
{
    "items": [{ "id": "ord-1", "total": 99.99, "createdAt": "..." }, ...],
    "nextCursor": "eyJpZCI6Im9yZC0yMCIsImNyZWF0ZWRBdCI6IjIwMjQuLi4ifQ==",
    "hasNextPage": true
}`,
                    language: 'csharp'
                },
                {
                    label: 'Problem Details (RFC 7807)',
                    code: `// Standardized error responses — RFC 7807 Problem Details
public class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context, Exception exception, CancellationToken ct)
    {
        var problemDetails = exception switch
        {
            ValidationException ex => new ProblemDetails
            {
                Type = "https://api.company.com/errors/validation",
                Title = "Validation Error",
                Status = 400,
                Detail = "One or more validation errors occurred.",
                Extensions = { ["errors"] = ex.Errors }
            },
            NotFoundException ex => new ProblemDetails
            {
                Type = "https://api.company.com/errors/not-found",
                Title = "Resource Not Found",
                Status = 404,
                Detail = ex.Message,
                Instance = context.Request.Path
            },
            ConflictException ex => new ProblemDetails
            {
                Type = "https://api.company.com/errors/conflict",
                Title = "Conflict",
                Status = 409,
                Detail = ex.Message
            },
            _ => new ProblemDetails
            {
                Type = "https://api.company.com/errors/internal",
                Title = "Internal Server Error",
                Status = 500,
                Detail = "An unexpected error occurred."
                // Never expose internal details in production!
            }
        };

        context.Response.StatusCode = problemDetails.Status ?? 500;
        await context.Response.WriteAsJsonAsync(problemDetails, ct);
        return true;
    }
}

// Example error response:
// HTTP 400
// Content-Type: application/problem+json
// {
//   "type": "https://api.company.com/errors/validation",
//   "title": "Validation Error",
//   "status": 400,
//   "detail": "One or more validation errors occurred.",
//   "instance": "/api/orders",
//   "errors": {
//     "customerId": ["Customer ID is required"],
//     "items": ["At least one item is required"]
//   }
// }`,
                    language: 'csharp'
                },
                {
                    label: 'API Versioning',
                    code: `// API versioning strategies in ASP.NET Core

// 1. URL Path versioning (most common, explicit)
// GET /api/v1/orders
// GET /api/v2/orders

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true; // Response header: api-supported-versions
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),      // /api/v{version}/...
        new HeaderApiVersionReader("X-API-Version"), // Fallback: header
        new QueryStringApiVersionReader("api-version") // Fallback: ?api-version=2
    );
});

[ApiController]
[ApiVersion("1.0")]
[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/orders")]
public class OrdersController : ControllerBase
{
    [HttpGet("{id}")]
    [MapToApiVersion("1.0")]
    public ActionResult<OrderV1Dto> GetV1(string id) =>
        Ok(_mapper.Map<OrderV1Dto>(order)); // Original shape

    [HttpGet("{id}")]
    [MapToApiVersion("2.0")]
    public ActionResult<OrderV2Dto> GetV2(string id) =>
        Ok(_mapper.Map<OrderV2Dto>(order)); // New shape with breaking changes
}

// Versioning rules:
// - Adding fields: backward compatible (no version bump needed)
// - Removing/renaming fields: breaking change (new version required)
// - Changing field types: breaking change
// - Adding optional query params: backward compatible
// - Deprecation: set Sunset header, document migration path`,
                    language: 'csharp'
                }
            ]
        },

        // ─── 6. BEST PRACTICES ────────────────────────────────────────
        {
            title: 'Best Practices',
            content: `<h4>Do: Use Nouns for Resources, Not Verbs</h4>
            <p><code>GET /orders</code> not <code>GET /getOrders</code>. HTTP verbs already express the action.
            Exception: for actions that don't map to CRUD, use a verb sub-resource: <code>POST /orders/{id}/cancel</code>.</p>
            <h4>Do: Return Proper HTTP Status Codes</h4>
            <p>200 OK, 201 Created (with Location header), 204 No Content (DELETE), 400 Bad Request,
            401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 429 Too Many Requests.</p>
            <h4>Do: Support Idempotency Keys for Mutating Operations</h4>
            <p>Allow clients to send an idempotency key header. If the same key is seen again,
            return the original response without re-executing the operation. Critical for payment and order APIs.</p>
            <h4>Do: Use Cursor-Based Pagination for Large Datasets</h4>
            <p>Offset pagination breaks with concurrent writes. Cursor pagination (keyset) is stable,
            performant (no OFFSET scan), and handles real-time data correctly.</p>
            <h4>Do: Version from Day One</h4>
            <p>Even if you only have v1, include version in the URL or header. Adding versioning
            after launch requires migrating all existing consumers.</p>
            <h4>Do: Document with OpenAPI and Provide SDKs</h4>
            <p>Generate SDKs from OpenAPI specs. Consumers shouldn't hand-write HTTP calls.</p>`,
            callout: {
                type: 'tip',
                title: 'API Design Golden Rule',
                text: 'Design APIs from the consumer\'s perspective, not the database schema. The API represents a business domain, not your data model. Resource structures may differ significantly from table structures.'
            }
        },

        // ─── 7. COMMON MISTAKES ───────────────────────────────────────
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Exposing Internal Implementation</h4>
            <p>API responses mirroring database column names, internal IDs, or implementation details.
            The API should represent the business domain, hiding implementation behind a stable contract.</p>
            <h4>Mistake: Using GET for Mutations</h4>
            <p><code>GET /api/deleteUser?id=5</code> — GET must be safe (no side effects) and idempotent.
            Caches, crawlers, and prefetch mechanisms will trigger it unexpectedly.</p>
            <h4>Mistake: Inconsistent Error Formats</h4>
            <p>Some endpoints return <code>{"error": "..."}</code>, others return <code>{"message": "..."}</code>.
            Use a single error format (RFC 7807 Problem Details) across all endpoints.</p>
            <h4>Mistake: Breaking Changes Without Versioning</h4>
            <p>Removing fields, renaming fields, or changing types without a version bump breaks
            existing consumers silently. Always version breaking changes and provide migration docs.</p>
            <h4>Mistake: N+1 API Calls</h4>
            <p>Requiring clients to make N requests to fetch related data. Offer query expansion
            (<code>?include=customer,items</code>) or use GraphQL for flexible data fetching.</p>`,
            code: `// BAD: Exposing database schema as API
GET /api/tbl_usr?usr_id=5
{ "usr_id": 5, "usr_nm": "John", "fk_dept_id": 3, "is_del": false }

// GOOD: Business-oriented API with proper naming
GET /api/users/5
{
    "id": "usr_5",
    "name": "John Smith",
    "email": "john@company.com",
    "department": { "id": "dept_3", "name": "Engineering" },
    "links": {
        "self": "/api/users/5",
        "orders": "/api/users/5/orders",
        "department": "/api/departments/3"
    }
}`,
            language: 'javascript'
        },

        // ─── 8. REAL-WORLD APPLICATIONS ───────────────────────────────
        {
            title: 'Real-World Applications',
            content: `<p>API design patterns in production systems:</p>
            <h4>Stripe API (Gold Standard)</h4>
            <p>Stripe's payment API is widely regarded as best-in-class: idempotency keys for safe retries,
            cursor pagination, expandable resources (<code>?expand[]=customer</code>), consistent error formats,
            and excellent versioning with explicit changelog and migration guides.</p>
            <h4>GitHub API</h4>
            <p>Offers both REST (v3) and GraphQL (v4). REST for simple operations, GraphQL for
            complex queries spanning repos, issues, PRs. Demonstrates how both can coexist.</p>
            <h4>gRPC at Google</h4>
            <p>Google uses gRPC internally for all microservice communication. Protocol Buffers provide
            strong typing, backward-compatible evolution, and ~10x performance over JSON. Most Google
            Cloud APIs offer gRPC alongside REST.</p>
            <h4>Betting / Gaming APIs</h4>
            <p>Sports betting APIs require idempotency (duplicate bet placement protection), real-time
            streaming (live odds via WebSocket/SignalR), strict versioning (regulatory compliance),
            and high-throughput pagination for bet history queries.</p>`
        },

        // ─── 9. COMPARISON ────────────────────────────────────────────
        {
            title: 'Comparison',
            content: `<p>Comparing API styles for different use cases:</p>`,
            table: {
                headers: ['Criteria', 'REST', 'gRPC', 'GraphQL', 'WebSocket'],
                rows: [
                    ['Protocol', 'HTTP/1.1 or 2', 'HTTP/2', 'HTTP/1.1 or 2', 'TCP (upgraded from HTTP)'],
                    ['Data Format', 'JSON (text)', 'Protobuf (binary)', 'JSON', 'Any (typically JSON)'],
                    ['Contract', 'OpenAPI/Swagger', '.proto files', 'Schema (SDL)', 'None (custom)'],
                    ['Typing', 'Weak (optional)', 'Strong (code-gen)', 'Strong (schema)', 'None'],
                    ['Streaming', 'SSE only', 'Bidirectional', 'Subscriptions', 'Full bidirectional'],
                    ['Caching', 'HTTP caching built-in', 'Difficult', 'Client-side (Apollo)', 'N/A'],
                    ['Browser Support', 'Native', 'Via grpc-web proxy', 'Native', 'Native'],
                    ['Performance', 'Good', 'Excellent (5-10x faster)', 'Good', 'Excellent (real-time)'],
                    ['Best For', 'Public APIs, CRUD', 'Internal service-to-service', 'Frontend aggregation', 'Real-time updates'],
                    ['Complexity', 'Low', 'Medium', 'High (resolver logic)', 'Medium (connection mgmt)']
                ]
            }
        },

        // ─── 10. PERFORMANCE ──────────────────────────────────────────
        {
            title: 'Performance',
            content: `<p>API performance considerations:</p>
            <h4>Serialization</h4>
            <ul>
                <li><strong>JSON:</strong> Human-readable but verbose. ~100μs to serialize a medium payload</li>
                <li><strong>Protocol Buffers:</strong> Binary, 3-10x smaller than JSON, 5-10x faster serialization</li>
                <li><strong>MessagePack:</strong> Binary JSON — faster than JSON, simpler than Protobuf</li>
            </ul>
            <h4>HTTP/2 Multiplexing</h4>
            <p>gRPC leverages HTTP/2 multiplexing — multiple requests share a single TCP connection.
            Eliminates head-of-line blocking and connection overhead (no more connection pooling).</p>
            <h4>Pagination Performance</h4>
            <ul>
                <li><strong>OFFSET/LIMIT:</strong> O(offset) — database scans and discards rows. Slow for deep pages</li>
                <li><strong>Cursor/Keyset:</strong> O(log n) — seeks directly to the cursor position via index. Constant time regardless of page depth</li>
            </ul>
            <h4>Response Compression</h4>
            <p>Enable gzip/brotli compression for REST APIs. Typical 60-80% size reduction for JSON payloads.
            In .NET: <code>app.UseResponseCompression()</code>.</p>
            <h4>Caching Strategy</h4>
            <ul>
                <li><strong>HTTP caching:</strong> Cache-Control headers, ETags, conditional requests (304 Not Modified)</li>
                <li><strong>CDN:</strong> Cache GET responses at edge nodes for global distribution</li>
                <li><strong>Application cache:</strong> Redis for frequently-accessed query results</li>
            </ul>`,
            callout: {
                type: 'warning',
                title: 'N+1 Problem in APIs',
                text: 'Avoid forcing clients to make N+1 requests (1 for the list + N for details). Offer field expansion, compound documents, or GraphQL. Each round trip adds 5-50ms of latency.'
            }
        },

        // ─── 11. TESTING ──────────────────────────────────────────────
        {
            title: 'Testing',
            content: `<p>API testing strategies for reliability and backward compatibility:</p>
            <h4>Contract Testing</h4>
            <p>Verify API contracts between consumer and provider using Pact or similar tools.
            Consumers define expected interactions; providers verify they satisfy the contract.</p>
            <h4>Integration Testing</h4>
            <p>Use WebApplicationFactory (ASP.NET) or Supertest (Node.js) to test the full HTTP pipeline
            in-memory without network calls.</p>
            <h4>Schema Validation</h4>
            <p>Validate request/response bodies against OpenAPI schemas. Reject invalid requests with
            clear error messages.</p>
            <h4>Backward Compatibility Testing</h4>
            <p>Run the previous version's test suite against the new version to catch regressions.
            Use OpenAPI diff tools to detect breaking changes automatically.</p>`,
            code: `// Integration test with WebApplicationFactory (ASP.NET)
public class OrdersApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public OrdersApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace real DB with in-memory for testing
                services.AddDbContext<AppDbContext>(opts =>
                    opts.UseInMemoryDatabase("TestDb"));
            });
        }).CreateClient();
    }

    [Fact]
    public async Task CreateOrder_ValidRequest_Returns201WithLocation()
    {
        var request = new { customerId = "cust-1", items = new[] {
            new { productId = "prod-1", quantity = 2 }
        }};

        var response = await _client.PostAsJsonAsync("/api/v1/orders", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        var order = await response.Content.ReadFromJsonAsync<OrderDto>();
        Assert.Equal("cust-1", order.CustomerId);
    }

    [Fact]
    public async Task CreateOrder_MissingCustomerId_Returns400ProblemDetails()
    {
        var request = new { items = new[] { new { productId = "prod-1", quantity = 2 } } };

        var response = await _client.PostAsJsonAsync("/api/v1/orders", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal("Validation Error", problem.Title);
    }

    [Fact]
    public async Task CreateOrder_IdempotencyKey_ReturnsSameResponseOnRetry()
    {
        var idempotencyKey = Guid.NewGuid().ToString();
        var request = new { customerId = "cust-1", items = new[] {
            new { productId = "prod-1", quantity = 1 }
        }};

        _client.DefaultRequestHeaders.Add("Idempotency-Key", idempotencyKey);

        var response1 = await _client.PostAsJsonAsync("/api/v1/orders", request);
        var response2 = await _client.PostAsJsonAsync("/api/v1/orders", request);

        var order1 = await response1.Content.ReadFromJsonAsync<OrderDto>();
        var order2 = await response2.Content.ReadFromJsonAsync<OrderDto>();
        Assert.Equal(order1.Id, order2.Id); // Same response, not duplicate
    }
}`,
            language: 'csharp'
        },

        // ─── 12. INTERVIEW TIPS ───────────────────────────────────────
        {
            title: 'Interview Tips',
            content: `<p>API design questions are common in system design and backend interviews:</p>
            <ul>
                <li><strong>Know HTTP deeply:</strong> Status codes, headers (Cache-Control, ETag, Idempotency-Key),
                content negotiation, and conditional requests</li>
                <li><strong>Design from consumer perspective:</strong> When asked "design an API for X", start with
                the use cases and consumer needs, not the database schema</li>
                <li><strong>Discuss versioning upfront:</strong> Show you think about API evolution from day one</li>
                <li><strong>Mention idempotency:</strong> For any write operation, explain how retries are made safe</li>
                <li><strong>Address pagination early:</strong> Any list endpoint needs pagination — mention cursor-based</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'System Design Interview Pattern',
                text: 'When asked to "Design the API for X" in a system design interview: (1) List the resources and their relationships, (2) Define endpoints with HTTP verbs, (3) Show request/response shapes, (4) Address pagination, filtering, error handling, (5) Discuss versioning and idempotency.'
            }
        },

        // ─── 13. FURTHER READING ──────────────────────────────────────
        {
            title: 'Further Reading',
            content: `<p>Resources for mastering API design:</p>
            <h4>Books</h4>
            <ul>
                <li><em>Designing Web APIs</em> by Brenda Jin et al. — comprehensive API design guide</li>
                <li><em>API Design Patterns</em> by JJ Geewax — patterns from Google's API Design Guide</li>
                <li><em>RESTful Web APIs</em> by Leonard Richardson — REST design principles</li>
            </ul>
            <h4>Standards & Guides</h4>
            <ul>
                <li>Google API Design Guide: <code>cloud.google.com/apis/design</code></li>
                <li>Microsoft REST API Guidelines: <code>github.com/microsoft/api-guidelines</code></li>
                <li>Stripe API Reference — exemplary API design</li>
                <li>RFC 7807 — Problem Details for HTTP APIs</li>
                <li>OpenAPI Specification: <code>spec.openapis.org</code></li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li><strong>Design:</strong> Stoplight, SwaggerHub, Postman</li>
                <li><strong>Testing:</strong> Pact (contracts), Hurl, Bruno, REST Client</li>
                <li><strong>Gateways:</strong> Kong, YARP (.NET), Envoy, AWS API Gateway</li>
            </ul>`
        },

        // ─── 14. KEY TAKEAWAYS ────────────────────────────────────────
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Core idea:</strong> APIs are contracts between teams — design them from the consumer's perspective with consistency, versioning, and resilience</li>
                <li><strong>REST for:</strong> External APIs, browser consumers, simple CRUD (most common choice)</li>
                <li><strong>gRPC for:</strong> Internal service-to-service with strict typing and high performance</li>
                <li><strong>GraphQL for:</strong> Frontend aggregation where clients need flexible data fetching</li>
                <li><strong>Always include:</strong> Versioning, idempotency keys, cursor pagination, RFC 7807 errors</li>
                <li><strong>Main risk:</strong> Breaking changes that cascade across consumers without proper versioning</li>
                <li><strong>Interview signal:</strong> Discussing idempotency, versioning strategy, and pagination shows production API experience</li>
            </ul>`
        },

        // ─── 15. EXERCISE ─────────────────────────────────────────────
        {
            title: 'Exercise',
            content: `<h4>Challenge: Design a RESTful Booking API</h4>
            <p>Design a complete API for a hotel room booking system. Your design should include:</p>
            <ol>
                <li>Resource identification (rooms, bookings, guests, availability)</li>
                <li>Full endpoint list with HTTP verbs, request/response bodies</li>
                <li>Pagination for listing bookings (cursor-based)</li>
                <li>Idempotency for the booking creation endpoint</li>
                <li>Proper error responses using RFC 7807 Problem Details</li>
                <li>At least one action endpoint (e.g., cancel, check-in)</li>
                <li>Versioning strategy with one breaking change example</li>
            </ol>
            <h4>Starter Design</h4>`,
            code: `// Define your API resources and endpoints:

// Rooms
// GET    /api/v1/rooms?checkIn=2024-06-01&checkOut=2024-06-05&guests=2
// GET    /api/v1/rooms/{roomId}

// Bookings
// POST   /api/v1/bookings          (Idempotency-Key required)
// GET    /api/v1/bookings?cursor=...&pageSize=20
// GET    /api/v1/bookings/{bookingId}
// POST   /api/v1/bookings/{bookingId}/cancel
// POST   /api/v1/bookings/{bookingId}/check-in

// TODO: Define request/response shapes for each endpoint
// TODO: Define error responses for: room not available, invalid dates, 
//       booking already cancelled, guest not found
// TODO: Design the v2 breaking change (e.g., splitting "name" into 
//       "firstName" + "lastName")`,
            language: 'javascript'
        },

        // ─── 16. KNOWLEDGE CHECK ──────────────────────────────────────
        {
            title: 'Knowledge Check',
            content: `<p>Test your API design knowledge:</p>
            <ol>
                <li><strong>Q:</strong> Why is cursor-based pagination preferred over offset-based for large datasets?<br/>
                    <em>A: Offset pagination requires the DB to scan and skip N rows (O(offset)), degrading with deep
                    pages. It also breaks with concurrent inserts/deletes (items shift). Cursor pagination seeks
                    directly via index (O(log n)) and is stable regardless of concurrent changes.</em></li>
                <li><strong>Q:</strong> What is an idempotency key and when is it necessary?<br/>
                    <em>A: A client-generated unique identifier sent with mutating requests. If the client retries
                    (network timeout), the server recognizes the duplicate and returns the original response instead
                    of re-executing. Essential for payment, order creation, and any non-idempotent operation.</em></li>
                <li><strong>Q:</strong> When would you choose gRPC over REST for an API?<br/>
                    <em>A: When both producer and consumer are internal services you control, need high performance
                    (binary serialization), strong typing (code generation from .proto), or streaming capabilities.
                    Not for browser consumption (needs proxy), not for public APIs (less discoverable).</em></li>
                <li><strong>Q:</strong> What makes an API change "breaking"?<br/>
                    <em>A: Removing or renaming a field, changing a field's type, making an optional field required,
                    removing an endpoint, or changing response status codes. Adding optional fields or new
                    endpoints is backward-compatible (non-breaking).</em></li>
            </ol>`
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // INTERVIEW QUESTIONS
    // ═══════════════════════════════════════════════════════════════
    questions: [
        {"question":"How should you version a REST API, and what are the trade-offs of each approach?","difficulty":"hard","answer":"<p>Common approaches: <strong>URI versioning</strong> (<code>/v1/orders</code>) — simple, visible, cache-friendly, but pollutes URLs and implies resources differ by version; <strong>header/media-type versioning</strong> (<code>Accept: application/vnd.api.v2+json</code>) — keeps URLs clean and is REST-purist, but is less discoverable and harder to test in a browser; <strong>query-string versioning</strong> (<code>?api-version=2</code>) — easy but easy to omit.</p><p>Regardless of scheme, prefer <strong>additive, backward-compatible</strong> changes so most changes need no new version; version only for true breaking changes, run versions in parallel, and publish a deprecation policy. URI versioning is the most common pragmatic choice.</p>","explanation":"Versioning is like issuing a new edition of a form: you can add optional boxes freely, but if you must remove or redefine one, you print a clearly-labeled \"v2\" and let people keep using v1 until they switch.","bestPractices":["Prefer additive, backward-compatible changes","Version only for breaking changes; run versions in parallel","Publish and enforce a deprecation policy"],"commonMistakes":["Breaking changes without a version bump","No deprecation/sunset plan","Versioning for changes that could have been additive"],"interviewTip":"Lead with \"make changes additive so you rarely need a version,\" then compare URI vs header vs query with their trade-offs.","followUp":["What is the expand-contract pattern?","How do you deprecate an API version?","Which scheme is most cache-friendly?"]},
        {"question":"Why is idempotency important in API design, and how do you implement an idempotent POST?","difficulty":"hard","answer":"<p><strong>Idempotency</strong> means repeating the same request produces the same result without extra side effects. It matters because networks retry: a client that times out may resend a \"create payment\" request, and without idempotency you double-charge. GET/PUT/DELETE are naturally idempotent; <strong>POST</strong> is not by default.</p><p>Implement an idempotent POST with an <strong>idempotency key</strong>: the client sends a unique key (header); the server records the key with the result on first processing and, on any retry with the same key, returns the stored result instead of reprocessing — typically enforced with a unique constraint so concurrent duplicates cannot both succeed.</p>","code":"POST /payments\nIdempotency-Key: 9f1c...\n\n// Server: INSERT the key (unique). If it already exists,\n// return the previously stored response instead of charging again.","language":"http","explanation":"It is like a \"do not charge twice\" ticket number on a payment: if the same ticket comes back, the cashier hands over the original receipt instead of taking your money again.","bestPractices":["Require an idempotency key for unsafe create operations","Store key+result; return stored result on retry","Enforce uniqueness at the database to handle concurrent retries"],"commonMistakes":["Assuming POST is safe to retry","Checking the key without a unique constraint (race lets both through)","Not persisting the original response for replay"],"interviewTip":"Tie it to retries causing double side effects, then describe the idempotency-key + unique-constraint mechanism — that concrete answer scores.","followUp":["Which HTTP methods are idempotent by default?","How do you expire idempotency keys?","How does this relate to exactly-once processing?"]},
        {
            question: 'What is the Richardson Maturity Model? Describe each level with examples.',
            difficulty: 'easy',
            answer: `<p>The Richardson Maturity Model describes four levels of REST API maturity:</p>
            <ul>
                <li><strong>Level 0 — Swamp of POX:</strong> Single endpoint, single verb (POST). All operations
                go through one URI. Example: <code>POST /api</code> with action in the body. SOAP-style.</li>
                <li><strong>Level 1 — Resources:</strong> Different URIs for different things, but may still
                use only POST. Example: <code>POST /orders</code>, <code>POST /customers</code>.</li>
                <li><strong>Level 2 — HTTP Verbs:</strong> Proper use of GET, POST, PUT, DELETE with correct
                status codes. Example: <code>GET /orders/5</code> (200), <code>POST /orders</code> (201),
                <code>DELETE /orders/5</code> (204).</li>
                <li><strong>Level 3 — Hypermedia (HATEOAS):</strong> Responses include links to related actions
                and resources. The client discovers available operations from the response rather than
                hardcoding URLs.</li>
            </ul>`,
            explanation: 'Think of it like a restaurant: Level 0 is shouting all orders through one window. Level 1 is having separate counters for drinks, food, dessert. Level 2 is using proper language (request, order, return). Level 3 is the menu telling you what you CAN do next based on what you\'ve already ordered.',
            bestPractices: [
                'Most production APIs target Level 2 — proper verbs and status codes',
                'Level 3 (HATEOAS) is valuable for public APIs with many clients who benefit from discoverability',
                'Use standard link relations (self, next, prev) when implementing HATEOAS',
                'Document your API regardless of maturity level — discoverability via docs is often sufficient'
            ],
            commonMistakes: [
                'Claiming REST compliance while using POST for everything (Level 0 in disguise)',
                'Using GET for operations with side effects (violates safety principle)',
                'Returning 200 for everything — even errors (makes monitoring impossible)'
            ],
            interviewTip: 'Name all four levels with brief examples. Then offer your practical opinion: "Most production APIs I build target Level 2. HATEOAS (Level 3) adds discoverability value for public APIs but is often overkill for internal microservice communication."'
        },

        {
            question: 'How do you handle API versioning? What are the trade-offs of different strategies?',
            difficulty: 'medium',
            answer: `<p>API versioning strategies with their trade-offs:</p>
            <h4>1. URL Path Versioning</h4>
            <p><code>/api/v1/orders</code> — version in the URL. Most explicit and visible.</p>
            <ul>
                <li>Pros: Clear, simple, cacheable, easy to route</li>
                <li>Cons: Changes the resource URI (purists argue this violates REST)</li>
            </ul>
            <h4>2. Header Versioning</h4>
            <p><code>X-API-Version: 2</code> or <code>Accept: application/vnd.company.v2+json</code></p>
            <ul>
                <li>Pros: Clean URLs, keeps URI as resource identifier</li>
                <li>Cons: Less visible, harder to test in browser, caching complexity</li>
            </ul>
            <h4>3. Query String</h4>
            <p><code>/api/orders?api-version=2</code></p>
            <ul>
                <li>Pros: Simple to add, backward compatible</li>
                <li>Cons: Pollutes query params, can be forgotten</li>
            </ul>
            <h4>Recommendation</h4>
            <p>URL path versioning for external APIs (most discoverable). Header versioning for internal
            APIs (keeps URLs clean). Always default to latest stable version when version is omitted.</p>`,
            bestPractices: [
                'Pick ONE versioning strategy and use it consistently across all APIs',
                'Only bump major version for breaking changes — additive changes are backward-compatible',
                'Support N-1 versions minimum (deprecate with Sunset header and timeline)',
                'Document migration guides for each version transition'
            ],
            commonMistakes: [
                'Versioning every endpoint independently rather than the whole API surface',
                'Making a breaking change without bumping version (silent consumer breakage)',
                'Supporting too many old versions (maintenance burden) — set deprecation policy',
                'Not communicating deprecation timeline to consumers'
            ],
            interviewTip: 'State your preference with justification: "I prefer URL path versioning for external APIs because it is the most explicit and cacheable. For the rare breaking change, we create v2 while keeping v1 supported with a 6-month sunset timeline."',
            followUp: [
                'What constitutes a breaking vs non-breaking change?',
                'How do you communicate deprecation to API consumers?',
                'How would you handle versioning in a GraphQL API?'
            ]
        },

        {
            question: 'Explain the concept of API idempotency. How would you implement it for a payment endpoint?',
            difficulty: 'medium',
            answer: `<p><strong>Idempotency</strong> means that making the same request multiple times produces the same
            result as making it once. GET, PUT, and DELETE are naturally idempotent. POST is not —
            which is why we need idempotency keys for critical operations like payments.</p>
            <h4>Implementation</h4>
            <ol>
                <li>Client generates a unique idempotency key (UUID) before the first request</li>
                <li>Client sends: <code>POST /payments</code> with header <code>Idempotency-Key: abc-123</code></li>
                <li>Server checks if this key was seen before (lookup in Redis or DB)</li>
                <li>If new: process the payment, store the response keyed by idempotency key, return result</li>
                <li>If seen: return the stored response without re-processing</li>
                <li>If in-progress: return 409 Conflict (concurrent duplicate)</li>
            </ol>
            <h4>Why It Matters</h4>
            <p>Network timeouts happen. If a client doesn't receive the response, it retries. Without
            idempotency, the payment would be charged twice. With an idempotency key, the retry
            returns the original result safely.</p>`,
            code: `// Implementation flow
// Client: POST /api/payments { amount: 100 }
//         Header: Idempotency-Key: "pay_retry_abc123"

// Server pseudocode:
async function processPayment(key, request) {
    // 1. Check if already processed
    const cached = await redis.get(\`idempotent:\${key}\`);
    if (cached) return JSON.parse(cached); // Return stored response

    // 2. Acquire lock (prevent concurrent duplicates)
    const locked = await redis.set(\`lock:\${key}\`, '1', 'NX', 'EX', 30);
    if (!locked) throw new ConflictError('Request in progress');

    try {
        // 3. Process payment
        const result = await chargeCard(request);
        
        // 4. Store response (24h TTL)
        await redis.set(\`idempotent:\${key}\`, JSON.stringify(result), 'EX', 86400);
        return result;
    } finally {
        await redis.del(\`lock:\${key}\`);
    }
}`,
            language: 'javascript',
            bestPractices: [
                'Client generates the key (not server) — client controls retry behavior',
                'Use Redis with TTL for idempotency store — fast lookup, automatic cleanup',
                'Lock during processing to prevent concurrent duplicates',
                'Return the same HTTP status code on retry (not just same body)',
                'Set reasonable TTL (24-72h) — long enough for retries, short enough to not leak memory'
            ],
            commonMistakes: [
                'Server-generated idempotency keys — client can\'t retry safely',
                'Not locking during processing — two concurrent requests both process',
                'Too short TTL — key expires before client retries',
                'Only checking request body equality instead of using explicit keys'
            ],
            interviewTip: 'Use Stripe\'s payment API as your example: "Like Stripe, I would require an Idempotency-Key header on POST /payments. On retry, the server returns the cached response without charging the customer twice. This is critical for any financial operation."',
            followUp: [
                'How do you handle the case where the original request is still processing when the retry arrives?',
                'Should idempotency keys be scoped per-user or global?',
                'How does idempotency interact with concurrent requests from different clients?'
            ]
        },

        {
            question: 'When would you choose GraphQL over REST? What are the trade-offs?',
            difficulty: 'medium',
            answer: `<p>GraphQL and REST solve different problems. The choice depends on consumer needs:</p>
            <h4>Choose GraphQL When</h4>
            <ul>
                <li>Clients need different subsets of data (mobile vs web vs admin)</li>
                <li>Resources have deeply nested relationships (avoid N+1 REST calls)</li>
                <li>Frontend teams want to iterate on data requirements without backend changes</li>
                <li>You want a single endpoint for complex data aggregation</li>
            </ul>
            <h4>Choose REST When</h4>
            <ul>
                <li>API is simple CRUD with predictable access patterns</li>
                <li>HTTP caching is critical (CDN, browser cache)</li>
                <li>API is public-facing with many external consumers</li>
                <li>Team has more REST experience and simpler tooling needs</li>
            </ul>
            <h4>GraphQL Trade-offs</h4>
            <ul>
                <li><strong>Pro:</strong> No over-fetching/under-fetching — client gets exactly what it asks for</li>
                <li><strong>Pro:</strong> Single endpoint, self-documenting schema, strong typing</li>
                <li><strong>Con:</strong> Caching is harder (all POST to single endpoint)</li>
                <li><strong>Con:</strong> Complexity explosion with deep queries (N+1 at the resolver level)</li>
                <li><strong>Con:</strong> Rate limiting is harder (can't rate-limit by endpoint)</li>
                <li><strong>Con:</strong> File uploads, authentication require non-standard patterns</li>
            </ul>`,
            bestPractices: [
                'Use GraphQL as a BFF layer — aggregates data from multiple REST/gRPC backend services',
                'Implement DataLoader pattern to solve the N+1 resolver problem',
                'Set query depth and complexity limits to prevent malicious deep queries',
                'Use persisted queries in production — whitelist allowed query shapes'
            ],
            commonMistakes: [
                'Replacing every REST API with GraphQL — it is not universally better',
                'Not implementing query complexity limits — allowing clients to DDoS with deep queries',
                'Exposing GraphQL directly to the internet without query whitelisting',
                'Building GraphQL without DataLoader — causes N+1 database queries'
            ],
            interviewTip: 'Show nuanced thinking: "I would use GraphQL as a BFF for our mobile app because it needs different data shapes than the web app, and we want to reduce round trips. But our public API for partners would remain REST because it is cacheable, well-understood, and easier to rate-limit."',
            followUp: [
                'How do you handle N+1 problems in GraphQL resolvers?',
                'What are persisted queries and why are they important?',
                'How would you implement authorization in GraphQL?'
            ]
        },

        {
            question: 'Design a resilient API that handles failures gracefully. What patterns would you implement?',
            difficulty: 'hard',
            answer: `<p>A resilient API must handle failures at multiple levels:</p>
            <h4>Client-Facing Resilience</h4>
            <ul>
                <li><strong>Idempotency keys:</strong> Safe retries for mutating operations</li>
                <li><strong>Rate limiting:</strong> Protect from traffic spikes (429 with Retry-After header)</li>
                <li><strong>Request validation:</strong> Fail fast with clear error messages (400 + Problem Details)</li>
                <li><strong>Timeouts:</strong> Server-side request timeout prevents runaway requests</li>
            </ul>
            <h4>Backend Resilience</h4>
            <ul>
                <li><strong>Circuit breaker:</strong> Stop calling failing dependencies (fail fast)</li>
                <li><strong>Retry with backoff:</strong> Handle transient failures transparently</li>
                <li><strong>Bulkhead:</strong> Isolate dependencies so one failure doesn't consume all resources</li>
                <li><strong>Fallback:</strong> Return cached/default data when dependency is unavailable</li>
                <li><strong>Timeout:</strong> Never wait indefinitely for downstream responses</li>
            </ul>
            <h4>Operational Resilience</h4>
            <ul>
                <li><strong>Health checks:</strong> /health/live (process alive) and /health/ready (can serve traffic)</li>
                <li><strong>Graceful shutdown:</strong> Stop accepting new requests, finish in-flight, then exit</li>
                <li><strong>Load shedding:</strong> Reject excess traffic cleanly (503) rather than degrading all requests</li>
            </ul>`,
            bestPractices: [
                'Implement all resilience patterns at the HTTP client level (Polly, Resilience4j)',
                'Return Retry-After header with 429/503 so clients know when to retry',
                'Use health checks to let orchestrators route traffic away from unhealthy instances',
                'Design for partial degradation — serve what you can, clearly indicate what is unavailable'
            ],
            commonMistakes: [
                'No timeout on downstream calls — one slow dependency blocks all threads',
                'Retrying non-idempotent operations without idempotency keys',
                'Rate limiting without Retry-After header — clients retry immediately (making it worse)',
                'Health check that returns healthy when critical dependencies are down'
            ],
            interviewTip: 'Structure your answer in layers: "At the edge (client-facing), I implement rate limiting and idempotency. At the service level, circuit breakers and bulkheads. At the infrastructure level, health checks and graceful shutdown." Show the full picture.',
            seniorPerspective: 'In production, I configure different resilience policies per dependency based on criticality. The payment gateway gets aggressive circuit breaking (open after 3 failures, 60s break) with no retries (idempotency at the application level instead). The product catalog gets lenient retries with fallback to cached data because stale prices are acceptable for a few seconds.',
            architectPerspective: 'At the platform level, resilience is a cross-cutting concern. I push circuit breaking and retry into the service mesh (Istio) for consistent behavior across all services. Application code only handles business-specific fallbacks (what to show the user when a dependency is down). This separates infrastructure resilience from business resilience.'
        },

        {
            question: 'Compare offset-based and cursor-based (keyset) pagination. Why does offset pagination break down at scale?',
            difficulty: 'advanced',
            answer: `<p>The two dominant strategies make very different trade-offs:</p>
            <ul>
                <li><strong>Offset/limit pagination</strong> — <code>?page=500&pageSize=20</code> translates to <code>OFFSET 9980 LIMIT 20</code>. Simple, supports jumping to an arbitrary page, and shows total counts.</li>
                <li><strong>Cursor/keyset pagination</strong> — <code>?cursor=...&limit=20</code> uses the last seen sort value(s) as a bookmark: <code>WHERE (created_at, id) &lt; (@lastCreated, @lastId) ORDER BY created_at DESC, id DESC LIMIT 20</code>.</li>
            </ul>
            <p><strong>Why offset breaks down at scale (two distinct problems):</strong></p>
            <ul>
                <li><strong>Performance:</strong> <code>OFFSET N</code> forces the database to scan and discard N rows before returning the page, so cost grows linearly with depth — page 1 is instant, page 10,000 is slow. It cannot use an index to skip directly to the offset.</li>
                <li><strong>Correctness (offset drift):</strong> with concurrent inserts/deletes, rows shift between requests. Insert one row at the top and every subsequent page shifts by one, so a user paging through sees a duplicate or skips an item.</li>
            </ul>
            <p>Cursor pagination solves both: it seeks directly via the index on the sort key (constant time regardless of depth) and the bookmark is stable against inserts. The cost is no random page access and no easy total count. Rule of thumb: cursor for infinite scroll, feeds, and large or fast-changing datasets; offset only for small, stable datasets where page numbers and totals genuinely matter.</p>`,
            explanation: 'Offset pagination is counting pages from the start of a book every time — to reach page 500 you flip past 499 pages, and if someone inserts a chapter you lose your place. Cursor pagination is a bookmark: you reopen exactly where you stopped, instantly, no matter how thick the book or whether pages were added earlier.',
            code: `// OFFSET — simple but O(offset): scans and throws away rows, and drifts on inserts
// GET /orders?page=500&pageSize=20
SELECT * FROM orders ORDER BY created_at DESC OFFSET 9980 LIMIT 20; -- slow at depth

// CURSOR / KEYSET — O(log n) seek via index, stable against concurrent inserts
[HttpGet]
public async Task<ActionResult<PagedResponse<OrderDto>>> List(
    [FromQuery] string? cursor, [FromQuery] int limit = 20, CancellationToken ct = default)
{
    var c = cursor is null ? null : DecodeCursor(cursor); // (lastCreatedAt, lastId)

    var rows = await _db.Orders
        .Where(o => c == null
            || o.CreatedAt < c.CreatedAt
            || (o.CreatedAt == c.CreatedAt && o.Id < c.Id)) // tie-break keeps it deterministic
        .OrderByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id)
        .Take(limit + 1)                 // fetch one extra to detect "has next page"
        .Select(o => o.ToDto())
        .ToListAsync(ct);

    var hasNext = rows.Count > limit;
    var items = rows.Take(limit).ToList();
    return Ok(new PagedResponse<OrderDto>
    {
        Items = items,
        NextCursor = hasNext ? EncodeCursor(items[^1]) : null,
        HasNextPage = hasNext
    });
}`,
            language: 'csharp',
            bestPractices: [
                'Default to cursor pagination for large, fast-changing, or infinite-scroll datasets',
                'Always include a unique tie-breaker (e.g. id) in the sort to make the cursor deterministic',
                'Treat the cursor as opaque (base64) so clients do not depend on its internal shape',
                'Reserve offset pagination for small, stable datasets that truly need page numbers and totals'
            ],
            commonMistakes: [
                'Using offset pagination for deep pages on large tables (linear scan cost)',
                'Sorting only by a non-unique column, so cursor ties skip or duplicate rows',
                'Exposing raw column values in the cursor, coupling clients to the schema',
                'Promising exact total counts on huge tables where COUNT is itself expensive'
            ],
            interviewTip: 'Separate the two failure modes explicitly: offset is slow (scans N rows) AND incorrect under concurrent writes (drift). Many candidates mention only performance. Then give the decision rule: cursor for feeds/large data, offset for small stable lists needing page jumps.',
            followUp: [
                'How do you build a cursor for a multi-column sort order?',
                'How do you support both forward and backward pagination with cursors?',
                'How would you provide an approximate total count cheaply?'
            ],
            seniorPerspective: 'I default to cursor pagination for any list that can grow unbounded — order history, audit logs, activity feeds — because offset latency degrades silently until a customer hits page 800 and times out. When the product genuinely needs page numbers, I keep offset but cap the maximum reachable depth and back it with a covering index.',
            architectPerspective: 'Pagination is an API contract decision with long-term consequences: switching from offset to cursor later is a breaking change for every consumer. I standardize a cursor-based envelope (items + nextCursor + hasNextPage) across services from day one, so clients code against one stable shape and the backend keeps freedom to optimize the underlying query.'
        }
    ]
});
