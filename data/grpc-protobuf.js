'use strict';

PageData.register('grpc-protobuf', {
    title: 'gRPC & Protobuf',
    description: 'Protocol Buffers, streaming RPCs, interceptors, and when to choose gRPC over REST',
    sections: [
        {
            title: 'Protocol Buffers (proto3)',
            content: `<p>Protocol Buffers (protobuf) is a language-neutral binary serialization format. Proto3 is the current version used with gRPC.</p>
<ul>
<li><strong>Schema-first</strong> - Define message shapes in .proto files, generate code for any language.</li>
<li><strong>Binary encoding</strong> - 3-10x smaller than JSON, faster serialization/deserialization.</li>
<li><strong>Backward compatible</strong> - Field numbers enable schema evolution without breaking existing clients.</li>
<li><strong>Strong typing</strong> - Generated code provides compile-time type safety.</li>
</ul>
<p>Key rules: never reuse field numbers, use reserved keyword for removed fields, optional fields have default values (0, empty string, false).</p>`
        },
        {
            title: 'Proto3 Schema Example',
            code: `syntax = "proto3";

package ordering.v1;

import "google/protobuf/timestamp.proto";
import "google/protobuf/wrappers.proto";

// Service definition
service OrderService {
    // Unary RPC
    rpc GetOrder(GetOrderRequest) returns (GetOrderResponse);
    
    // Server streaming - server sends multiple responses
    rpc WatchOrderStatus(WatchOrderRequest) returns (stream OrderStatusUpdate);
    
    // Client streaming - client sends multiple requests
    rpc UploadOrderItems(stream OrderItem) returns (UploadSummary);
    
    // Bidirectional streaming
    rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}

message GetOrderRequest {
    string order_id = 1;
    bool include_items = 2;
}

message GetOrderResponse {
    Order order = 1;
}

message Order {
    string id = 1;
    string customer_id = 2;
    OrderStatus status = 3;
    repeated OrderItem items = 4;       // list
    google.protobuf.Timestamp created_at = 5;
    google.protobuf.StringValue notes = 6; // nullable string
    map<string, string> metadata = 7;    // dictionary
    
    oneof payment {                      // discriminated union
        CreditCard credit_card = 8;
        BankTransfer bank_transfer = 9;
    }
}

enum OrderStatus {
    ORDER_STATUS_UNSPECIFIED = 0;  // always have 0 as unspecified
    ORDER_STATUS_PENDING = 1;
    ORDER_STATUS_CONFIRMED = 2;
    ORDER_STATUS_SHIPPED = 3;
    ORDER_STATUS_DELIVERED = 4;
}

message OrderItem {
    string sku = 1;
    int32 quantity = 2;
    int64 price_cents = 3;  // use cents to avoid floating point
}`,
            language: 'protobuf'
        },
        {
            title: 'gRPC Communication Patterns',
            mermaid: `sequenceDiagram
    participant C as Client
    participant S as Server
    
    Note over C,S: Unary RPC
    C->>S: Request
    S->>C: Response
    
    Note over C,S: Server Streaming
    C->>S: Request
    S->>C: Response 1
    S->>C: Response 2
    S->>C: Response N
    S->>C: Complete
    
    Note over C,S: Client Streaming
    C->>S: Request 1
    C->>S: Request 2
    C->>S: Request N
    C->>S: Complete
    S->>C: Response
    
    Note over C,S: Bidirectional Streaming
    C->>S: Request 1
    S->>C: Response 1
    C->>S: Request 2
    S->>C: Response 2
    C->>S: Complete
    S->>C: Complete`,
            content: `<p>gRPC supports four communication patterns. Unary is like REST (one request, one response). Streaming enables real-time data flows, long-lived connections, and efficient bulk transfers.</p>`
        },
        {
            title: 'gRPC Server Implementation (.NET)',
            code: `// Server implementation in ASP.NET Core
public class OrderServiceImpl : OrderService.OrderServiceBase
{
    private readonly IOrderRepository _orders;
    
    public override async Task<GetOrderResponse> GetOrder(
        GetOrderRequest request, ServerCallContext context)
    {
        var order = await _orders.GetByIdAsync(request.OrderId);
        if (order == null)
        {
            throw new RpcException(new Status(
                StatusCode.NotFound, 
                $"Order {request.OrderId} not found"));
        }
        return new GetOrderResponse { Order = MapToProto(order) };
    }

    // Server streaming
    public override async Task WatchOrderStatus(
        WatchOrderRequest request,
        IServerStreamWriter<OrderStatusUpdate> responseStream,
        ServerCallContext context)
    {
        while (!context.CancellationToken.IsCancellationRequested)
        {
            var status = await _orders.GetStatusAsync(request.OrderId);
            await responseStream.WriteAsync(new OrderStatusUpdate
            {
                OrderId = request.OrderId,
                Status = status,
                UpdatedAt = Timestamp.FromDateTime(DateTime.UtcNow)
            });
            await Task.Delay(TimeSpan.FromSeconds(5), context.CancellationToken);
        }
    }

    // Client streaming
    public override async Task<UploadSummary> UploadOrderItems(
        IAsyncStreamReader<OrderItem> requestStream,
        ServerCallContext context)
    {
        var items = new List<OrderItem>();
        await foreach (var item in requestStream.ReadAllAsync())
        {
            items.Add(item);
        }
        return new UploadSummary { TotalItems = items.Count };
    }
}

// Registration in Program.cs
app.MapGrpcService<OrderServiceImpl>();`,
            language: 'csharp'
        },
        {
            title: 'Interceptors (Middleware)',
            code: `// Server interceptor - equivalent to HTTP middleware
public class LoggingInterceptor : Interceptor
{
    private readonly ILogger<LoggingInterceptor> _logger;

    public override async Task<TResponse> UnaryServerHandler<TRequest, TResponse>(
        TRequest request,
        ServerCallContext context,
        UnaryServerMethod<TRequest, TResponse> continuation)
    {
        var method = context.Method;
        var sw = Stopwatch.StartNew();
        
        try
        {
            var response = await continuation(request, context);
            _logger.LogInformation(
                "gRPC {Method} completed in {Duration}ms",
                method, sw.ElapsedMilliseconds);
            return response;
        }
        catch (RpcException ex)
        {
            _logger.LogError(ex, "gRPC {Method} failed: {Status}", 
                method, ex.StatusCode);
            throw;
        }
    }
}

// Client interceptor - add auth headers
public class AuthInterceptor : Interceptor
{
    public override AsyncUnaryCall<TResponse> AsyncUnaryCall<TRequest, TResponse>(
        TRequest request,
        ClientInterceptorContext<TRequest, TResponse> context,
        AsyncUnaryCallContinuation<TRequest, TResponse> continuation)
    {
        var headers = new Metadata
        {
            { "authorization", $"Bearer {GetToken()}" }
        };
        var newContext = new ClientInterceptorContext<TRequest, TResponse>(
            context.Method, context.Host, 
            context.Options.WithHeaders(headers));
        
        return continuation(request, newContext);
    }
}

// Registration
builder.Services.AddGrpc(options =>
{
    options.Interceptors.Add<LoggingInterceptor>();
});`,
            language: 'csharp'
        },
        {
            title: 'Deadlines, Cancellation, and Error Handling',
            code: `// Client - set deadline (absolute time)
var deadline = DateTime.UtcNow.AddSeconds(5);
var response = await client.GetOrderAsync(
    new GetOrderRequest { OrderId = "123" },
    deadline: deadline);

// Client - timeout (relative) via CallOptions
var options = new CallOptions(deadline: DateTime.UtcNow.AddSeconds(10));
var response2 = await client.GetOrderAsync(request, options);

// Server - check deadline
public override async Task<GetOrderResponse> GetOrder(
    GetOrderRequest request, ServerCallContext context)
{
    // Deadline propagates automatically in chained calls
    var remaining = context.Deadline - DateTime.UtcNow;
    if (remaining < TimeSpan.FromSeconds(1))
    {
        throw new RpcException(new Status(
            StatusCode.DeadlineExceeded, "Insufficient time remaining"));
    }
    // Use context.CancellationToken for cooperative cancellation
    var order = await _repo.GetAsync(request.OrderId, context.CancellationToken);
    return new GetOrderResponse { Order = order };
}

// Error handling - gRPC status codes
// OK, Cancelled, Unknown, InvalidArgument, DeadlineExceeded,
// NotFound, AlreadyExists, PermissionDenied, ResourceExhausted,
// FailedPrecondition, Aborted, OutOfRange, Unimplemented,
// Internal, Unavailable, DataLoss, Unauthenticated

// Rich error details
throw new RpcException(new Status(StatusCode.InvalidArgument, "Validation failed"),
    new Metadata
    {
        { "field", "email" },
        { "reason", "Invalid email format" }
    });`,
            language: 'csharp'
        },
        {
            title: 'gRPC vs REST Decision Framework',
            mermaid: `graph TD
    A[Need communication between services?] -->|Yes| B{Internal or External?}
    B -->|Internal microservices| C[Consider gRPC]
    B -->|Public API / Browser clients| D[Use REST/HTTP]
    
    C --> E{Need streaming?}
    E -->|Yes| F[gRPC - streaming built-in]
    E -->|No| G{Performance critical?}
    G -->|Yes| F
    G -->|No| H{Team familiar with Protobuf?}
    H -->|Yes| F
    H -->|No| I[REST may be simpler]
    
    D --> J{Need real-time in browser?}
    J -->|Yes| K[gRPC-Web or WebSocket]
    J -->|No| L[REST + JSON]
    
    M[gRPC Advantages] --> N[Binary - smaller payload]
    M --> O[HTTP/2 - multiplexing]
    M --> P[Schema + codegen]
    M --> Q[Streaming native]
    
    R[REST Advantages] --> S[Browser native]
    R --> T[Human readable]
    R --> U[Ecosystem tooling]
    R --> V[Simpler debugging]`,
            content: `<p>gRPC excels for internal service-to-service communication where performance, type safety, and streaming matter. REST excels for public APIs, browser clients, and when human readability and tooling ecosystem are priorities.</p>`
        },
        {
            title: 'gRPC-Web and Load Balancing',
            content: `<p><strong>gRPC-Web</strong> enables browser clients to call gRPC services. It works via a proxy (Envoy) or ASP.NET Core middleware that translates between HTTP/1.1 and HTTP/2.</p>
<ul>
<li>Supports unary and server-streaming only (no client/bidi streaming)</li>
<li>Uses HTTP/1.1 with special content-type headers</li>
<li>Requires either Envoy proxy or <code>app.UseGrpcWeb()</code> middleware</li>
</ul>
<p><strong>Load Balancing:</strong></p>
<ul>
<li><strong>L4 (TCP)</strong> - Single connection per client; all requests go to same backend. Not ideal for gRPC.</li>
<li><strong>L7 (HTTP/2-aware)</strong> - Envoy, NGINX with gRPC support. Routes individual RPCs across backends.</li>
<li><strong>Client-side LB</strong> - gRPC supports name resolution + pick-first/round-robin policies.</li>
<li><strong>xDS / Service Mesh</strong> - Istio, Linkerd for transparent load balancing.</li>
</ul>
<p>Key issue: HTTP/2 multiplexes all RPCs over one TCP connection. L4 load balancers see one connection and route all traffic to one backend. You need L7 awareness.</p>`
        }
    ],
    questions: [
        {
            question: 'What is Protocol Buffers and how does it compare to JSON for API communication?',
            difficulty: 'easy',
            answer: `<p><strong>Protocol Buffers (protobuf)</strong> is a binary serialization format with a schema definition language (.proto files).</p>
<p><strong>Comparison with JSON:</strong></p>
<table>
<tr><th>Aspect</th><th>Protobuf</th><th>JSON</th></tr>
<tr><td>Format</td><td>Binary</td><td>Text</td></tr>
<tr><td>Size</td><td>3-10x smaller</td><td>Larger (field names repeated)</td></tr>
<tr><td>Speed</td><td>5-100x faster serialization</td><td>Slower parsing</td></tr>
<tr><td>Schema</td><td>Required (.proto)</td><td>Optional (JSON Schema)</td></tr>
<tr><td>Readability</td><td>Not human-readable</td><td>Human-readable</td></tr>
<tr><td>Evolution</td><td>Field numbers enable safe changes</td><td>Fragile (string keys)</td></tr>
<tr><td>Tooling</td><td>Code generation required</td><td>Universal support</td></tr>
</table>
<p><strong>When to use Protobuf:</strong> High-throughput internal services, mobile (bandwidth-sensitive), strict schema contracts.</p>
<p><strong>When to use JSON:</strong> Public APIs, debugging ease, browser clients, rapid prototyping.</p>`,
            interviewTip: 'Quantify the differences - "3-10x smaller, 5-100x faster" shows you understand the magnitude of the performance gap.',
            followUp: ['How does protobuf achieve smaller size?', 'What happens when you remove a field from a proto schema?'],
            seniorPerspective: 'Protobuf is not always faster in practice. For small messages with simple structures, the code generation overhead may not justify the complexity. Profile before deciding.',
            architectPerspective: 'Schema-first design with protobuf enforces contract discipline between teams. The generated code becomes the integration contract, reducing integration bugs.'
        },
        {
            question: 'Explain the four RPC patterns in gRPC. When would you use each?',
            difficulty: 'medium',
            answer: `<p><strong>1. Unary</strong> - One request, one response. Like REST endpoint.</p>
<p>Use for: CRUD operations, queries, commands.</p>
<p><strong>2. Server Streaming</strong> - One request, multiple responses from server.</p>
<p>Use for: Real-time feeds, watch/subscribe patterns, large result sets streamed incrementally, live logs.</p>
<p><strong>3. Client Streaming</strong> - Multiple requests from client, one response from server.</p>
<p>Use for: File upload in chunks, aggregation (client sends data points, server returns summary), batch operations.</p>
<p><strong>4. Bidirectional Streaming</strong> - Both sides send messages independently.</p>
<p>Use for: Chat, collaborative editing, game state sync, interactive protocols where both sides push data.</p>
<pre><code>// Server streaming example: stock price feed
rpc WatchPrices(WatchRequest) returns (stream PriceUpdate);

// Client streaming example: upload file chunks
rpc UploadFile(stream FileChunk) returns (UploadResult);

// Bidi streaming: chat
rpc Chat(stream ChatMessage) returns (stream ChatMessage);</code></pre>`,
            interviewTip: 'Give a concrete use case for each pattern. Interviewers want to see you can match patterns to real problems.',
            followUp: ['How does backpressure work in streaming RPCs?', 'What happens if the stream is broken mid-way?'],
            seniorPerspective: 'Server streaming is the most commonly useful pattern after unary. It replaces polling with push-based updates. Client and bidi streaming are rarer in practice.',
            architectPerspective: 'Streaming RPCs over long-lived connections require careful load balancing (L7-aware), connection management, and graceful handling of reconnection scenarios.'
        },
        {
            question: 'How do deadlines and cancellation work in gRPC? Why are they important?',
            difficulty: 'medium',
            answer: `<p><strong>Deadlines</strong> propagate through the call chain - if Service A calls B calls C, and A's deadline expires, B and C are automatically cancelled.</p>
<p><strong>Why important:</strong></p>
<ul>
<li>Prevents resource waste on requests that will never be used (client already timed out)</li>
<li>Avoids cascading failures from piling up waiting requests</li>
<li>Enables predictable latency SLAs</li>
</ul>
<p><strong>Cancellation:</strong> gRPC propagates cancellation via CancellationToken (in .NET). When a client cancels or deadline expires, the server receives cancellation and should stop work immediately.</p>
<pre><code>// Client sets deadline
var deadline = DateTime.UtcNow.AddSeconds(5);
try 
{
    var response = await client.GetOrderAsync(request, deadline: deadline);
}
catch (RpcException ex) when (ex.StatusCode == StatusCode.DeadlineExceeded)
{
    // Handle timeout - retry, fallback, or fail
}

// Server respects cancellation
public override async Task&lt;Response&gt; Process(Request req, ServerCallContext ctx)
{
    // Pass token to all async operations
    var result = await _db.QueryAsync(query, ctx.CancellationToken);
    // If client cancelled, OperationCanceledException propagates
    return new Response { Data = result };
}</code></pre>
<p><strong>Best practice:</strong> Always set deadlines on client calls. Without a deadline, a failed server holds client resources indefinitely.</p>`,
            interviewTip: 'Emphasize that deadlines propagate automatically. This is gRPC killer feature over REST where timeout propagation requires manual implementation.',
            followUp: ['How do you choose appropriate deadline values?', 'What happens to in-flight streams when deadline expires?'],
            seniorPerspective: 'Set deadlines based on your SLA budget. If your API must respond in 500ms and you call 3 services, each gets less than 500ms. Budget deadlines across the call chain.',
            architectPerspective: 'Deadline propagation is foundational for preventing cascading failures. Without it, a slow downstream service causes thread/connection exhaustion in all upstream services.'
        },
        {
            question: 'What are gRPC interceptors and how do they compare to HTTP middleware?',
            difficulty: 'medium',
            answer: `<p><strong>Interceptors</strong> are the gRPC equivalent of HTTP middleware. They wrap RPC calls to add cross-cutting concerns.</p>
<p><strong>Types:</strong></p>
<ul>
<li><strong>Server interceptors</strong> - Run on the server for every incoming RPC (logging, auth, metrics, error handling)</li>
<li><strong>Client interceptors</strong> - Run on the client for every outgoing RPC (auth headers, retry logic, tracing)</li>
</ul>
<p><strong>Comparison with HTTP middleware:</strong></p>
<ul>
<li>Same concept (pipeline of handlers wrapping the core logic)</li>
<li>Interceptors handle all four RPC types (unary, streaming)</li>
<li>More strongly typed (access to request/response types)</li>
<li>Separate methods for unary vs streaming calls</li>
</ul>
<p><strong>Common interceptors:</strong> Authentication, logging, metrics/tracing, error mapping, retry, rate limiting, validation.</p>`,
            interviewTip: 'Show you understand the pipeline model. Mention that interceptors execute in registration order (like middleware) and can short-circuit the chain.',
            followUp: ['How do you handle errors in interceptors?', 'Can interceptors modify the request or response?'],
            seniorPerspective: 'Use interceptors for cross-cutting concerns only. Business logic belongs in the service implementation. Keep interceptors thin and composable.',
            architectPerspective: 'Interceptors enable consistent behavior across all gRPC services without modifying service code. Use them to enforce organizational standards (tracing, error format, authentication).'
        },
        {
            question: 'How do you handle schema evolution in Protocol Buffers without breaking existing clients?',
            difficulty: 'hard',
            answer: `<p>Protobuf schema evolution follows strict rules to maintain backward and forward compatibility:</p>
<p><strong>Safe changes:</strong></p>
<ul>
<li>Add new fields (use a new, unused field number)</li>
<li>Remove fields (mark as reserved; old clients ignore unknown fields)</li>
<li>Rename fields (wire format uses numbers, not names)</li>
<li>Change optional to repeated (single value becomes one-element list)</li>
</ul>
<p><strong>Breaking changes:</strong></p>
<ul>
<li>Changing a field number (breaks all existing data)</li>
<li>Changing a field type incompatibly (int32 to string)</li>
<li>Reusing a deleted field number (old data decoded incorrectly)</li>
</ul>
<pre><code>// Use reserved to prevent field number reuse
message Order {
    reserved 4, 7;  // field numbers that were removed
    reserved "old_field_name"; // prevent name reuse
    
    string id = 1;
    string customer_id = 2;
    OrderStatus status = 3;
    // field 4 was removed - DO NOT REUSE
    repeated OrderItem items = 5;
}

// Versioning via package name
package ordering.v1; // v1 API
package ordering.v2; // v2 API - can coexist</code></pre>
<p><strong>Best practice:</strong> Treat field numbers as immutable. Use buf (buf.build) for linting and breaking change detection in CI.</p>`,
            interviewTip: 'Mention the reserved keyword and explain WHY reusing field numbers is dangerous (old serialized data gets misinterpreted). This shows deep understanding.',
            followUp: ['What tools help detect breaking proto changes in CI?', 'How do you handle enum evolution?'],
            seniorPerspective: 'Use buf lint and buf breaking in CI to catch schema violations before merge. API versioning (v1, v2 packages) enables parallel support for old and new clients.',
            architectPerspective: 'Schema evolution strategy should be documented in API governance guidelines. Define what changes are allowed without version bump vs requiring a new API version.'
        },
        {
            question: 'When would you choose gRPC over REST? When is REST still the better choice?',
            difficulty: 'hard',
            answer: `<p><strong>Choose gRPC when:</strong></p>
<ul>
<li>Internal microservice-to-microservice communication</li>
<li>High throughput / low latency requirements (binary protocol, HTTP/2 multiplexing)</li>
<li>Streaming needed (real-time updates, large data transfer)</li>
<li>Strong contract enforcement across teams (schema-first with code generation)</li>
<li>Polyglot environment (generate clients for any language from one .proto)</li>
</ul>
<p><strong>Choose REST when:</strong></p>
<ul>
<li>Public-facing APIs (browser compatibility, universal tooling)</li>
<li>Simple CRUD where REST conventions map naturally</li>
<li>Team is small and does not want code generation complexity</li>
<li>Need human-readable requests for debugging (curl, Postman)</li>
<li>Caching important (HTTP caching works naturally with GET endpoints)</li>
<li>API gateway / CDN integration needed</li>
</ul>
<p><strong>Hybrid approach:</strong> Many systems use gRPC internally between services and expose REST via an API gateway (gRPC-gateway or manual translation layer) for external consumers.</p>`,
            interviewTip: 'Show balanced judgment. Never say one is universally better. The hybrid approach (gRPC internal, REST external) is the most common production pattern.',
            followUp: ['How does gRPC-gateway work?', 'Can you use gRPC for mobile apps?'],
            seniorPerspective: 'The decision often comes down to team experience and existing infrastructure. If your team knows REST well and your services communicate at low volume, gRPC adds complexity without proportional benefit.',
            architectPerspective: 'gRPC shines in the "service mesh" pattern where dozens of services communicate. The type-safe generated clients, deadline propagation, and streaming capabilities justify the learning curve at that scale.'
        },
        {
            question: 'How does gRPC handle errors? Compare to HTTP status codes.',
            difficulty: 'easy',
            answer: `<p>gRPC uses its own status code system, separate from HTTP status codes. The gRPC framework maps these internally to HTTP/2 status.</p>
<p><strong>Key gRPC status codes:</strong></p>
<ul>
<li><code>OK (0)</code> - Success</li>
<li><code>InvalidArgument (3)</code> - Client sent bad data (like HTTP 400)</li>
<li><code>NotFound (5)</code> - Resource does not exist (like HTTP 404)</li>
<li><code>AlreadyExists (6)</code> - Conflict on creation (like HTTP 409)</li>
<li><code>PermissionDenied (7)</code> - Authenticated but not authorized (like HTTP 403)</li>
<li><code>Unauthenticated (16)</code> - No valid credentials (like HTTP 401)</li>
<li><code>DeadlineExceeded (4)</code> - Timeout (like HTTP 408/504)</li>
<li><code>Unavailable (14)</code> - Service temporarily down (like HTTP 503)</li>
<li><code>Internal (13)</code> - Server bug (like HTTP 500)</li>
</ul>
<p><strong>Rich errors:</strong> gRPC supports trailing metadata for error details (field-level validation errors, retry-after hints, localized messages).</p>
<pre><code>// Throwing typed gRPC errors
throw new RpcException(new Status(StatusCode.NotFound, "Order not found"));

// With metadata for structured error details
var metadata = new Metadata { { "retry-after-ms", "5000" } };
throw new RpcException(new Status(StatusCode.Unavailable, "Rate limited"), metadata);</code></pre>`,
            interviewTip: 'Map gRPC codes to HTTP codes you know. This shows you understand both systems and can translate between them for teams using both.',
            followUp: ['How do you implement rich error models in gRPC?', 'What is the difference between Unavailable and Internal?'],
            seniorPerspective: 'Consistent error handling across all services is critical. Define a team-wide error model (using google.rpc.Status or custom) and enforce it via interceptors.',
            architectPerspective: 'The gRPC error model is richer than HTTP for machine-to-machine communication. Use the google.rpc.ErrorDetails types (BadRequest, RetryInfo, DebugInfo) for structured error information.'
        },
        {
            question: 'How would you implement health checking and load balancing for gRPC services?',
            difficulty: 'advanced',
            answer: `<p><strong>Health Checking:</strong></p>
<p>gRPC defines a standard health checking protocol (grpc.health.v1.Health service). Clients and load balancers call this to determine service readiness.</p>
<pre><code>// ASP.NET Core gRPC health checks
builder.Services.AddGrpcHealthChecks()
    .AddCheck("database", () => /* check DB */)
    .AddCheck("cache", () => /* check Redis */);

app.MapGrpcHealthChecksService(); // exposes grpc.health.v1.Health

// Health check response: SERVING, NOT_SERVING, UNKNOWN</code></pre>
<p><strong>Load Balancing options:</strong></p>
<ul>
<li><strong>Proxy-based (L7)</strong> - Envoy, NGINX. Understands HTTP/2 frames and routes individual RPCs. Best for most deployments.</li>
<li><strong>Client-side</strong> - Client discovers backends via DNS/service registry and picks one. Low latency (no proxy hop). Used in high-performance scenarios.</li>
<li><strong>Look-aside (xDS)</strong> - Control plane (like Istio pilot) tells clients which backends to use. Most sophisticated, used in service meshes.</li>
</ul>
<p><strong>Critical:</strong> Standard L4 (TCP) load balancers do NOT work well with gRPC because HTTP/2 multiplexes all RPCs over a single TCP connection. The LB sees one connection and sends everything to one backend.</p>`,
            interviewTip: 'The L4 vs L7 load balancing issue is the #1 gotcha with gRPC in production. Mention it proactively to show production experience.',
            followUp: ['How does Kubernetes handle gRPC load balancing?', 'What is the xDS protocol?'],
            seniorPerspective: 'In Kubernetes, use headless services + client-side LB or an L7 ingress (Envoy/Istio). The default Kubernetes service (ClusterIP) does L4 load balancing which creates hot spots with gRPC.',
            architectPerspective: 'Service mesh (Istio/Linkerd) solves gRPC load balancing transparently with sidecar proxies. Without a mesh, you need explicit client-side LB configuration or an L7-aware proxy.'
        },
        {
            question: 'Design a bidirectional streaming chat system using gRPC. What challenges do you face?',
            difficulty: 'expert',
            answer: `<p><strong>Design:</strong></p>
<pre><code>// Proto definition
service ChatService {
    rpc JoinRoom(stream ChatMessage) returns (stream ChatMessage);
}

message ChatMessage {
    string room_id = 1;
    string user_id = 2;
    string content = 3;
    google.protobuf.Timestamp sent_at = 4;
    MessageType type = 5;
}

enum MessageType {
    TEXT = 0;
    JOIN = 1;
    LEAVE = 2;
    TYPING = 3;
}

// Server implementation
public override async Task JoinRoom(
    IAsyncStreamReader&lt;ChatMessage&gt; requestStream,
    IServerStreamWriter&lt;ChatMessage&gt; responseStream,
    ServerCallContext context)
{
    var userId = GetUserId(context);
    var room = _rooms.GetOrCreate(roomId);
    room.AddClient(userId, responseStream);
    
    try
    {
        await foreach (var msg in requestStream.ReadAllAsync(context.CancellationToken))
        {
            // Broadcast to all other clients in room
            await room.BroadcastAsync(msg, excludeUser: userId);
        }
    }
    finally
    {
        room.RemoveClient(userId);
        await room.BroadcastAsync(new ChatMessage 
        { 
            Type = MessageType.LEAVE, UserId = userId 
        });
    }
}</code></pre>
<p><strong>Challenges:</strong></p>
<ul>
<li><strong>Connection management</strong> - Detect disconnects, handle reconnection with message replay</li>
<li><strong>Scaling</strong> - Single server holds connections; need pub/sub (Redis) for multi-server rooms</li>
<li><strong>Backpressure</strong> - Slow clients cannot block fast senders; buffer and drop if needed</li>
<li><strong>Ordering</strong> - Messages may arrive out of order across servers; use logical clocks</li>
<li><strong>State recovery</strong> - Client reconnects and needs missed messages; persist chat history</li>
</ul>`,
            interviewTip: 'This is a system design question. Cover the distributed challenges: scaling beyond one server, handling reconnection, message ordering across nodes.',
            followUp: ['How would you scale this to millions of concurrent connections?', 'How do you handle message ordering guarantees?'],
            seniorPerspective: 'For production chat, consider whether gRPC bidi streaming is the right tool vs SignalR/WebSocket with a proper message broker backend. gRPC streaming lacks built-in reconnection.',
            architectPerspective: 'Bidi streaming is powerful but complex. You need to solve: connection lifecycle management, multi-node fan-out (pub/sub), message persistence, exactly-once delivery, and client reconnection with replay.'
        }
    ]
});
