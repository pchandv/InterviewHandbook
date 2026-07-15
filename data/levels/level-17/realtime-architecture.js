'use strict';

PageData.register('realtime-architecture', {
  title: 'Real-Time Architecture',
  description: 'Design scalable real-time systems with WebSocket, SignalR, presence detection, fan-out patterns, and back-pressure handling for Staff/Principal engineers building live experiences.',
  sections: [
    {
      title: 'Introduction',
      content: `
        <p>Real-time architecture enables instant bidirectional communication between servers and clients. At scale, this means managing millions of persistent connections, handling fan-out to specific audiences, detecting presence, and degrading gracefully under load.</p>
        <p>At Staff+ level, you must understand the trade-offs between WebSocket, SSE, and Long Polling; design systems that scale horizontally with backplanes; implement back-pressure to protect servers from burst traffic; and architect presence systems that work across distributed server farms.</p>
        <p>This topic moves beyond "add SignalR to your project" into the architectural concerns: How do you scale to 100K+ concurrent connections? How do you route messages to specific users across multiple servers? How do you handle the thundering herd when a popular event broadcasts to millions?</p>
      `
    },
    {
      title: 'Core Concepts',
      content: `
        <p><strong>Persistent connections</strong>: Unlike HTTP request/response, real-time protocols maintain long-lived connections. Each connection consumes memory (connection state, buffers) and a file descriptor. Scaling means managing this resource carefully.</p>
        <p><strong>Fan-out patterns</strong>: Messages must reach the right audience. User-targeted (notifications), room/group (chat rooms, game lobbies), and global broadcast (system announcements) each have different scaling characteristics.</p>
        <p><strong>Presence</strong>: Tracking who's online requires heartbeats, TTLs, and distributed state. False positives (showing offline user as online) are annoying. False negatives (showing online user as offline) can be harmful.</p>
        <p><strong>Back-pressure</strong>: When message production exceeds consumer capacity, you need strategies: buffering (memory risk), dropping (data loss), or throttling (latency increase). The right choice depends on the use case.</p>
        <p><strong>Horizontal scaling</strong>: A single server can handle ~50K-100K WebSocket connections. Beyond that, you need multiple servers with a mechanism (backplane/bus) to route messages between them.</p>
      `
    },
    {
      title: 'WebSocket vs SSE vs Long Polling',
      mermaid: `sequenceDiagram
    participant C as Client
    participant S as Server
    
    Note over C,S: WebSocket (Full Duplex)
    C->>S: HTTP Upgrade Request
    S-->>C: 101 Switching Protocols
    C->>S: Frame: {"action":"subscribe"}
    S-->>C: Frame: {"event":"update","data":{}}
    C->>S: Frame: {"action":"ack"}
    S-->>C: Frame: {"event":"update","data":{}}
    
    Note over C,S: SSE (Server → Client only)
    C->>S: GET /events (Accept: text/event-stream)
    S-->>C: data: {"event":"update"}\n\n
    S-->>C: data: {"event":"update"}\n\n
    Note over C: Client sends via separate POST
    
    Note over C,S: Long Polling (Simulated push)
    C->>S: GET /poll (blocks)
    Note over S: Waits for data...
    S-->>C: 200 {"event":"update"}
    C->>S: GET /poll (immediately re-connects)`,
      content: `
        <p><strong>WebSocket</strong>: Full-duplex, binary or text frames, low overhead after handshake. Best for: chat, gaming, collaborative editing, any bidirectional real-time use case. Caveat: some corporate proxies/firewalls block WebSocket upgrades.</p>
        <p><strong>Server-Sent Events (SSE)</strong>: Server→Client only, built on HTTP (no special protocol). Automatic reconnection with Last-Event-ID. Best for: notifications, live feeds, dashboards — anywhere server pushes dominate. Advantage: works through HTTP proxies that block WebSocket.</p>
        <p><strong>Long Polling</strong>: Client makes request, server holds it until data is available (or timeout). Simple to implement, works everywhere. Best for: fallback when WebSocket/SSE unavailable, low-frequency updates. Disadvantage: high per-message overhead (new HTTP request per message).</p>
        <p><strong>Decision matrix</strong>:</p>
        <ul>
          <li>Need bidirectional + low latency → WebSocket</li>
          <li>Server push only + needs HTTP compatibility → SSE</li>
          <li>Must work through any proxy/firewall + infrequent updates → Long Polling</li>
          <li>SignalR handles this automatically: tries WebSocket → SSE → Long Polling as fallback</li>
        </ul>
      `
    },
    {
      title: 'SignalR Architecture in ASP.NET Core',
      content: `
        <p><strong>Hub</strong>: The server-side endpoint clients connect to. Contains methods clients can invoke (server-side) and defines methods the server can call on clients. Typed hubs provide compile-time safety.</p>
        <p><strong>Connection lifecycle</strong>: OnConnectedAsync → client is connected (gets ConnectionId). OnDisconnectedAsync → cleanup. Groups are managed via Groups.AddToGroupAsync.</p>
        <p><strong>Transport negotiation</strong>: Client connects to /hub/negotiate endpoint, receives available transports (WebSocket, SSE, LongPolling) and a connection token. Client selects the best available transport.</p>
        <p><strong>Protocols</strong>: JSON (default, human-readable) or MessagePack (binary, 30-50% smaller, faster serialization). Choose MessagePack for high-throughput scenarios.</p>
        <p><strong>Client targeting</strong>:</p>
        <ul>
          <li><code>Clients.All</code> — broadcast to all connections</li>
          <li><code>Clients.Client(connectionId)</code> — target one connection</li>
          <li><code>Clients.Group("room-1")</code> — target a group</li>
          <li><code>Clients.User("userId")</code> — target all connections of a user (multi-device)</li>
          <li><code>Clients.Others</code> — all except the caller</li>
        </ul>
      `,
      code: {
        language: 'csharp',
        content: `// Typed SignalR Hub with groups and user targeting
public interface IGameClient
{
    Task ReceiveScoreUpdate(ScoreUpdateDto update);
    Task PlayerJoined(string playerName);
    Task PlayerLeft(string playerName);
    Task GameStateChanged(GameStateDto state);
}

public class GameHub : Hub<IGameClient>
{
    private readonly IPresenceService _presence;
    private readonly ILogger<GameHub> _logger;

    public GameHub(IPresenceService presence, ILogger<GameHub> logger)
    {
        _presence = presence;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier; // from auth
        await _presence.SetOnlineAsync(userId, Context.ConnectionId);
        _logger.LogInformation("User {UserId} connected via {Transport}",
            userId, Context.Features.Get<IHttpTransportFeature>()?.TransportType);
    }

    public async Task JoinGame(string gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"game-{gameId}");
        await Clients.Group($"game-{gameId}")
            .PlayerJoined(Context.UserIdentifier!);
    }

    public async Task LeaveGame(string gameId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"game-{gameId}");
        await Clients.Group($"game-{gameId}")
            .PlayerLeft(Context.UserIdentifier!);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await _presence.SetOfflineAsync(
            Context.UserIdentifier!, Context.ConnectionId);
    }
}`
      }
    },
    {
      title: 'Scaling SignalR: Backplane Architecture',
      mermaid: `graph TD
    subgraph "Client Connections"
        C1[Client A] --> S1
        C2[Client B] --> S1
        C3[Client C] --> S2
        C4[Client D] --> S2
        C5[Client E] --> S3
    end
    subgraph "SignalR Servers"
        S1[Server 1<br/>~50K connections]
        S2[Server 2<br/>~50K connections]
        S3[Server 3<br/>~50K connections]
    end
    subgraph "Backplane"
        BP[Redis Pub/Sub<br/>or Azure SignalR Service]
    end
    S1 <-->|Pub/Sub| BP
    S2 <-->|Pub/Sub| BP
    S3 <-->|Pub/Sub| BP
    subgraph "Message Flow"
        MF[Server 1 sends to Group X<br/>→ Published to backplane<br/>→ All servers deliver to<br/>their local Group X members]
    end`,
      content: `
        <p><strong>The problem</strong>: Client A is on Server 1, Client B is on Server 2. When Client A sends a message to a group, Server 1 only knows about its local group members. It can't reach Client B directly.</p>
        <p><strong>Backplane solution</strong>: All servers subscribe to a shared pub/sub system (Redis, Azure Service Bus). When Server 1 sends to a group, it publishes to the backplane. All servers receive the message and deliver to their local group members.</p>
        <p><strong>Redis Backplane</strong>:</p>
        <ul>
          <li>Simple setup: <code>builder.Services.AddSignalR().AddStackExchangeRedis()</code></li>
          <li>Uses Redis Pub/Sub channels for message routing</li>
          <li>Limitation: Redis Pub/Sub is fire-and-forget — no persistence if a server misses a message (during restart)</li>
          <li>Best for: moderate scale (< 500K connections total)</li>
        </ul>
        <p><strong>Azure SignalR Service</strong>:</p>
        <ul>
          <li>Fully managed — offloads connection management entirely</li>
          <li>Supports 1M+ concurrent connections</li>
          <li>App server only handles business logic; Azure manages WebSocket connections</li>
          <li>Best for: large scale, reduced operational burden, serverless scenarios</li>
        </ul>
      `,
      code: {
        language: 'csharp',
        content: `// Program.cs - SignalR with Redis backplane
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.MaximumReceiveMessageSize = 64 * 1024; // 64KB max message
    options.StreamBufferCapacity = 20;
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
})
.AddMessagePackProtocol() // Binary protocol for performance
.AddStackExchangeRedis(builder.Configuration["Redis:ConnectionString"]!, options =>
{
    options.Configuration.ChannelPrefix =
        RedisChannel.Literal("MyApp_SignalR_");
});

// Alternative: Azure SignalR Service
// builder.Services.AddSignalR().AddAzureSignalR(options =>
// {
//     options.ConnectionString = builder.Configuration["Azure:SignalR"];
//     options.ServerStickyMode = ServerStickyMode.Required;
// });

var app = builder.Build();
app.MapHub<GameHub>("/hubs/game");
app.Run();`
      }
    },
    {
      title: 'Presence Systems: Online/Offline Detection',
      content: `
        <p><strong>Challenge</strong>: Detecting whether a user is truly online when they may have multiple devices, unstable connections, or the server they're connected to crashes.</p>
        <p><strong>Heartbeat + TTL approach</strong>:</p>
        <ol>
          <li>Client sends heartbeat every 15-30 seconds (SignalR KeepAlive does this automatically)</li>
          <li>Server stores presence in Redis with TTL: <code>SET user:{userId}:presence ONLINE EX 45</code></li>
          <li>Each heartbeat refreshes the TTL. If no heartbeat (client disconnects or crashes), key expires automatically → user is offline.</li>
        </ol>
        <p><strong>Multi-device presence</strong>: Store per-connection presence. User is "online" if ANY connection is alive:</p>
        <ul>
          <li><code>SADD user:{userId}:connections {connectionId}</code></li>
          <li>On disconnect: <code>SREM user:{userId}:connections {connectionId}</code></li>
          <li>User is online if set is non-empty: <code>SCARD user:{userId}:connections > 0</code></li>
        </ul>
        <p><strong>Presence fan-out</strong>: When user goes online/offline, notify their contacts. For a user with 500 friends, this is 500 targeted messages — expensive if done synchronously. Use batched broadcasting with small delays (500ms) to coalesce rapid connect/disconnect cycles.</p>
        <p><strong>Grace period</strong>: Don't immediately mark as offline on disconnect. Wait 5-10 seconds — handles page refreshes, brief network blips, and tab switches without triggering presence notifications.</p>
      `,
      code: {
        language: 'csharp',
        content: `// Presence service implementation with Redis
public class RedisPresenceService : IPresenceService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IHubContext<GameHub, IGameClient> _hubContext;
    private readonly TimeSpan _presenceTtl = TimeSpan.FromSeconds(45);
    private readonly TimeSpan _gracePeriod = TimeSpan.FromSeconds(8);

    public async Task SetOnlineAsync(string userId, string connectionId)
    {
        var db = _redis.GetDatabase();
        var key = $"presence:{userId}:connections";

        var wasOffline = await db.SetLengthAsync(key) == 0;
        await db.SetAddAsync(key, connectionId);
        await db.KeyExpireAsync(key, _presenceTtl);

        // Cancel any pending offline notification
        await db.KeyDeleteAsync($"presence:{userId}:going-offline");

        if (wasOffline)
        {
            // User just came online — notify friends
            await NotifyFriendsPresenceChanged(userId, isOnline: true);
        }
    }

    public async Task SetOfflineAsync(string userId, string connectionId)
    {
        var db = _redis.GetDatabase();
        var key = $"presence:{userId}:connections";

        await db.SetRemoveAsync(key, connectionId);
        var remaining = await db.SetLengthAsync(key);

        if (remaining == 0)
        {
            // Start grace period — user might reconnect
            await db.StringSetAsync(
                $"presence:{userId}:going-offline", "1",
                _gracePeriod);
            // Background job checks after grace period
            // and fires offline notification if still disconnected
        }
    }

    public async Task<bool> IsOnlineAsync(string userId)
    {
        var db = _redis.GetDatabase();
        return await db.SetLengthAsync($"presence:{userId}:connections") > 0;
    }

    public async Task<Dictionary<string, bool>> GetBulkPresenceAsync(
        IEnumerable<string> userIds)
    {
        var db = _redis.GetDatabase();
        var batch = db.CreateBatch();
        var tasks = userIds.ToDictionary(
            id => id,
            id => batch.SetLengthAsync($"presence:{id}:connections"));
        batch.Execute();

        var result = new Dictionary<string, bool>();
        foreach (var (userId, task) in tasks)
            result[userId] = await task > 0;
        return result;
    }
}`
      }
    },
    {
      title: 'Back-Pressure in Real-Time Systems',
      content: `
        <p><strong>The thundering herd problem</strong>: A sports score update needs to reach 500K connected users simultaneously. Generating 500K messages instantly overwhelms the server's send buffer and network capacity.</p>
        <p><strong>Strategies</strong>:</p>
        <p><strong>1. Buffering with bounded queues</strong>:</p>
        <ul>
          <li>Per-connection send queue with a max size (e.g., 100 messages)</li>
          <li>If queue fills, choose: drop oldest (dashboard updates) or drop newest (auction prices) or disconnect slow client</li>
          <li>SignalR's <code>StreamBufferCapacity</code> controls this</li>
        </ul>
        <p><strong>2. Throttling / Rate limiting</strong>:</p>
        <ul>
          <li>Limit updates per second per client (e.g., max 10 score updates/sec — aggregate changes)</li>
          <li>Conflate: if multiple updates are pending for the same entity, send only the latest</li>
        </ul>
        <p><strong>3. Tiered delivery</strong>:</p>
        <ul>
          <li>Priority clients (active tab, premium users) get immediate delivery</li>
          <li>Background clients (minimized tab) get batched delivery every 5 seconds</li>
          <li>Detect via Page Visibility API on client</li>
        </ul>
        <p><strong>4. Fan-out offloading</strong>:</p>
        <ul>
          <li>Don't fan out from the application server. Publish once to the backplane; let edge servers handle local fan-out.</li>
          <li>Or use a CDN-like push network (Azure SignalR, Pusher, Ably) that handles massive fan-out at the edge.</li>
        </ul>
      `
    },
    {
      title: 'Connection Management & Graceful Degradation',
      content: `
        <p><strong>Connection lifecycle management</strong>:</p>
        <ul>
          <li><strong>Heartbeats</strong>: Server sends ping every 15s (KeepAliveInterval). Client must respond within 30s (ClientTimeoutInterval). Detects dead connections without waiting for TCP timeout (which can be minutes).</li>
          <li><strong>Reconnection</strong>: SignalR client automatically reconnects with exponential backoff. Server can store messages during brief disconnections (for durable scenarios, use a message broker).</li>
          <li><strong>Connection draining</strong>: During deployment, stop accepting new connections, let existing ones finish or gracefully close after a timeout. Kubernetes readiness probe → remove from load balancer → drain → terminate.</li>
        </ul>
        <p><strong>Graceful degradation strategies</strong>:</p>
        <ul>
          <li><strong>Transport fallback</strong>: WebSocket → SSE → Long Polling (SignalR handles automatically)</li>
          <li><strong>Feature degradation</strong>: Under load, reduce real-time features: live updates → periodic polling, typing indicators → removed, presence → cached/stale</li>
          <li><strong>Circuit breaker</strong>: If the backplane (Redis) is down, degrade to local-only delivery with a banner "some updates may be delayed"</li>
          <li><strong>Client-side resilience</strong>: Reconnection with jitter (don't have 100K clients reconnect simultaneously after an outage)</li>
        </ul>
        <p><strong>Resource limits</strong>: Monitor file descriptors (each connection = 1 fd), memory per connection (~10-50KB depending on buffers), and CPU for serialization. Set hard limits and reject connections with 503 when at capacity.</p>
      `
    },
    {
      title: 'Common Mistakes',
      content: `
        <ul>
          <li><strong>No backplane in multi-server deployments</strong>: Without a backplane, groups only work within a single server. Users on different servers never receive each other's messages. This works in dev (single instance) but breaks in production (multiple instances behind a load balancer).</li>
          <li><strong>Storing state in the Hub</strong>: Hub instances are transient — created per invocation. Class-level fields are lost between calls. Store state in a injected singleton service or external store (Redis).</li>
          <li><strong>No reconnection handling</strong>: Clients will disconnect (network changes, sleep/wake, mobile backgrounding). Without reconnection logic, users see stale data with no indication. Always implement reconnection with state reconciliation.</li>
          <li><strong>Broadcasting without throttling</strong>: Sending every database change as a real-time update creates O(changes × connections) messages. Batch, conflate, or debounce updates — especially for frequently changing data.</li>
          <li><strong>Ignoring connection limits</strong>: A server running out of file descriptors or memory due to too many connections crashes silently. Set explicit MaxConnections and monitor against thresholds.</li>
          <li><strong>Sticky sessions without understanding why</strong>: Long polling requires sticky sessions (multiple HTTP requests = one logical connection). WebSocket doesn't (single TCP connection). Using sticky sessions with WebSocket adds unnecessary load balancer constraints.</li>
        </ul>
      `
    },
    {
      title: 'Interview Tips',
      callout: true,
      content: `
        <p><strong>Start with requirements</strong>: "How many concurrent connections? What's the acceptable latency? Is message ordering required? What happens if a message is lost?" These questions show you think about architecture, not just implementation.</p>
        <p><strong>Discuss the scaling inflection points</strong>: "Up to 50K connections, a single server with SignalR is fine. 50K-500K, we need multiple servers with a Redis backplane. 500K+, consider Azure SignalR Service or a purpose-built system."</p>
        <p><strong>Know the numbers</strong>: A typical server handles 50K-100K WebSocket connections. Each connection uses 10-50KB of memory. A Redis Pub/Sub message takes ~0.1ms to deliver to subscribers. These numbers help you estimate infrastructure needs.</p>
        <p><strong>Address failure modes</strong>: "What if the Redis backplane goes down? What if a server crashes mid-broadcast? What if a client is connected but not consuming messages?" Showing failure awareness demonstrates production experience.</p>
        <p><strong>Mention alternatives</strong>: For different scales and use cases: Socket.io (Node.js), Phoenix Channels (Elixir — great for massive concurrency), gRPC streaming, Kafka for event streaming. Show breadth of knowledge.</p>
      `
    },
    {
      title: 'Key Takeaways',
      content: `
        <ul>
          <li>WebSocket provides full-duplex communication with minimal overhead — the default choice for real-time. SSE for server-push-only scenarios with better proxy compatibility.</li>
          <li>SignalR abstracts transport selection and provides hub-based API, groups, user targeting, and automatic reconnection — the standard for .NET real-time</li>
          <li>Horizontal scaling requires a backplane (Redis Pub/Sub or Azure SignalR Service) to route messages between servers — critical for production deployments</li>
          <li>Presence detection uses heartbeat + TTL with grace periods to handle multi-device scenarios and avoid false offline notifications</li>
          <li>Back-pressure must be designed explicitly: bounded queues, conflation, tiered delivery, and client disconnection for slow consumers</li>
          <li>Connection management includes heartbeats, reconnection with backoff, connection draining during deploys, and resource limit monitoring</li>
          <li>Graceful degradation ensures the system remains usable when components fail — degrade features rather than crash entirely</li>
          <li>MessagePack protocol provides 30-50% smaller messages than JSON — significant at scale with millions of messages per second</li>
        </ul>
      `
    }
  ],
  advancedTopics: [
    {
      title: 'Fan-Out Patterns at Scale',
      content: `
        <p><strong>Fan-out on write (push model)</strong>: When an event occurs, immediately push to all interested connections. Low read latency (message already delivered). High write amplification (1 event → N deliveries). Best for: small audience per event (chat rooms, game lobbies), latency-critical scenarios.</p>
        <p><strong>Fan-out on read (pull model)</strong>: Store events in a per-source log. Clients poll their subscriptions. Low write cost (store once). Higher read latency (polling interval). Best for: large follower counts (celebrity social media), non-latency-critical feeds.</p>
        <p><strong>Hybrid approach</strong>: Push to online users (fan-out on write for connected clients). Store for offline users (they pull on reconnection). This is how most notification systems work — real-time for active users, catch-up for returning users.</p>
        <p><strong>Hot group problem</strong>: A group with 100K members getting frequent messages (breaking news channel, popular livestream chat). Single server can't iterate 100K connections fast enough. Solutions: shard the group across servers (each handles a subset), tiered delivery (immediate for first 10K, batched for rest), or use the backplane's built-in broadcast (Redis broadcasts to all servers simultaneously).</p>
        <p><strong>Multicast patterns</strong>: For very large broadcasts (system-wide announcements to 1M+ connections), use a tree topology: message → N backplane channels → N servers → M local connections per server. Total delivery: O(N + max(M)) rather than O(N*M).</p>
      `
    },
    {
      title: 'Real-Time Notifications Architecture',
      content: `
        <p><strong>Notification pipeline</strong>:</p>
        <ol>
          <li><strong>Event source</strong>: Business logic emits domain events (OrderShipped, PaymentFailed, FriendRequestReceived)</li>
          <li><strong>Notification service</strong>: Subscribes to domain events, applies routing rules (who gets notified, via which channels), creates notification records</li>
          <li><strong>Channel dispatcher</strong>: Routes to appropriate delivery channel:
            <ul>
              <li>In-app: SignalR push to connected clients</li>
              <li>Push notification: APNs/FCM for mobile</li>
              <li>Email: For non-urgent, permanent record needed</li>
              <li>SMS: For critical alerts (security, account access)</li>
            </ul>
          </li>
          <li><strong>Delivery tracking</strong>: Record delivery status per channel. Retry failed deliveries with exponential backoff. Escalate channel if primary fails (push failed → try email).</li>
        </ol>
        <p><strong>Notification preferences</strong>: Users configure which events trigger which channels. Store as a preference matrix: {eventType × channel → enabled/disabled}. Check before dispatching — don't send unwanted notifications.</p>
        <p><strong>Deduplication</strong>: Same event may trigger from multiple sources (race condition in distributed processing). Use idempotency key (eventId + userId) to prevent duplicate notifications.</p>
        <p><strong>Batching and digests</strong>: For high-frequency events (5 likes in 10 seconds), batch into a single notification: "5 people liked your post." Use a short delay window (30s) before sending, accumulating events. Reduces notification fatigue.</p>
      `
    },
    {
      title: 'gRPC Streaming vs SignalR',
      content: `
        <p><strong>gRPC server streaming</strong>: Server sends a stream of messages to the client over HTTP/2. Strong typing via protobuf. Built-in deadline/cancellation. No browser support (needs gRPC-Web proxy). Best for: service-to-service real-time communication, mobile clients with protobuf support.</p>
        <p><strong>gRPC bidirectional streaming</strong>: Both client and server send independent streams. Full-duplex over HTTP/2. Excellent for: inter-service communication where both sides produce data (coordination protocols, data synchronization).</p>
        <p><strong>SignalR advantages over gRPC streaming</strong>:</p>
        <ul>
          <li>Native browser support (WebSocket + fallbacks)</li>
          <li>Built-in group management and user targeting</li>
          <li>Automatic reconnection with server-side state management</li>
          <li>Hub pattern for multiple methods over one connection</li>
          <li>JavaScript/TypeScript client libraries</li>
        </ul>
        <p><strong>When to use gRPC streaming</strong>: Backend service-to-service real-time (microservice events), mobile apps that already use gRPC, scenarios where protobuf's schema evolution and strong typing are essential, or when you need HTTP/2's multiplexing for multiple independent streams over one connection.</p>
        <p><strong>Hybrid architecture</strong>: gRPC streaming between backend services (type-safe, efficient). SignalR between server and browser/mobile clients (convenient, feature-rich). Gateway service bridges gRPC streams to SignalR groups.</p>
      `
    }
  ],
  questions: [
    {
      question: "Compare WebSocket, SSE, and Long Polling. When would you choose each for a production system?",
      difficulty: "medium",
      answer: "<p><strong>WebSocket</strong>: Full-duplex binary/text frames over a single TCP connection. After the HTTP upgrade handshake, communication is bidirectional with minimal framing overhead (2-14 bytes per frame). Choose when: bidirectional communication needed (chat, gaming, collaborative editing), low latency required (< 50ms), or binary data transmission.</p><p><strong>SSE (Server-Sent Events)</strong>: Unidirectional server→client over standard HTTP. Built-in reconnection with Last-Event-ID for resumption. Text-only (UTF-8). Choose when: server push only (notifications, live feeds, dashboards), need to work through HTTP proxies/CDNs that don't support WebSocket, or want automatic reconnection with event ID tracking.</p><p><strong>Long Polling</strong>: Client sends HTTP request, server holds it until data is available or timeout. Client immediately re-requests after receiving response. Choose when: WebSocket/SSE unavailable (extreme corporate firewall), very low update frequency (< 1/minute), or as a universal fallback.</p><p><strong>Production considerations</strong>: WebSocket connections count against file descriptor limits. SSE connections count against HTTP/2 stream limits (max 100 per connection). Long Polling has highest per-message overhead but works everywhere. SignalR negotiates the best available automatically.</p>",
      interviewTip: "Draw the connection diagrams showing message flow for each. Mention that HTTP/2 makes SSE more efficient (multiplexed streams) but doesn't change the unidirectional limitation.",
      followUp: ["How does HTTP/2 affect the choice between WebSocket and SSE?", "What is the maximum number of SSE connections a browser allows per domain?"],
      seniorPerspective: "In practice, WebSocket dominates for interactive applications. SSE has a niche for push-only scenarios where HTTP infrastructure compatibility matters (CDN caching of event streams, proxy traversal). Long Polling is legacy — only needed for IE11 support.",
      architectPerspective: "The transport choice affects your infrastructure stack. WebSocket needs Layer 7 load balancers that understand the upgrade protocol. SSE works with any HTTP load balancer. This infrastructure constraint sometimes overrides the technical ideal."
    },
    {
      question: "Design a real-time notification system that scales to 500K concurrent connections. Describe the architecture.",
      difficulty: "expert",
      answer: "<p><strong>Architecture layers</strong>:</p><p><strong>1. Connection Layer</strong>: Multiple SignalR servers behind a load balancer. Each handles ~50K connections. Azure SignalR Service or self-hosted with Redis backplane. WebSocket transport with MessagePack protocol.</p><p><strong>2. Message Routing</strong>: Redis Pub/Sub backplane for cross-server message delivery. Channel-per-user for targeted notifications. Channel-per-group for broadcast. At 500K users, Redis handles the pub/sub load comfortably (single Redis can handle 1M+ pub/sub messages/sec).</p><p><strong>3. Message Production</strong>: Application servers publish notification events to a message broker (RabbitMQ/Kafka). A notification service consumes events and routes them via SignalR's IHubContext (injected in background services, not just Hubs).</p><p><strong>4. Persistence & Catch-up</strong>: Notifications stored in a database (for history/read status). On reconnection, client sends last-seen timestamp, server delivers missed notifications. Prevents data loss during brief disconnections.</p><p><strong>5. Fan-out optimization</strong>: For broadcast notifications (sent to all 500K users), use a single publish to the backplane — each server delivers locally. Don't iterate 500K users and send individually.</p><p><strong>Capacity planning</strong>: 500K connections × 50KB/connection = 25GB RAM for connections alone. Plan for 10 servers with 100GB+ total, plus Redis with 16GB+ for pub/sub state.</p>",
      interviewTip: "Break the architecture into numbered layers. Address both the 'normal case' (user receives notification) and 'edge cases' (user reconnects after 5 minutes, server crashes mid-delivery).",
      followUp: ["How do you handle the case where a user is offline and notifications accumulate?", "How would you implement notification priority (urgent vs low priority)?"],
      seniorPerspective: "At 500K connections, operational concerns dominate: monitoring per-server connection counts, alerting on connection saturation, graceful scaling (add servers without dropping connections), and Redis failover handling. The architecture is straightforward; the operations are complex.",
      architectPerspective: "At this scale, consider whether self-hosted SignalR is worth the operational burden. Azure SignalR Service at 500K connections costs ~$2000/month but eliminates connection management, backplane configuration, and scaling automation. Compare against 2-3 engineers spending 20% time on infrastructure."
    },
    {
      question: "How does SignalR handle scaling across multiple servers? Explain the Redis backplane mechanism.",
      difficulty: "hard",
      answer: "<p><strong>The problem</strong>: SignalR maintains an in-memory mapping of ConnectionId → connection, and GroupName → set of connections. This state is local to each server. When Server A wants to send to a group, it only knows about group members connected to Server A.</p><p><strong>Redis backplane solution</strong>:</p><ol><li><strong>On message send</strong>: Server A publishes the message to a Redis Pub/Sub channel (e.g., 'SignalR:Group:room-1' or 'SignalR:User:userId')</li><li><strong>All servers subscribe</strong>: Every SignalR server subscribes to relevant channels. When a message arrives, the server checks if it has local connections matching the target and delivers.</li><li><strong>Group management</strong>: Group membership is still local (each server knows its own members). The backplane doesn't store group state — it just broadcasts messages that all servers filter locally.</li></ol><p><strong>Message format</strong>: The backplane message includes: target (group/user/all), excluded connections, invocation details (method + arguments). Servers deserialize and deliver to matching local connections.</p><p><strong>Limitations</strong>:</p><ul><li>Redis Pub/Sub is fire-and-forget: if a server is temporarily disconnected from Redis, messages are lost</li><li>All messages go to all servers (no smart routing) — at very high scale, this creates unnecessary network traffic</li><li>Connection-level targeting (Clients.Client(id)) requires all servers to check if they own that connection</li></ul>",
      interviewTip: "Explain that the backplane is just a broadcast mechanism, not a router. Every server gets every message and filters locally. This is simple but inefficient at extreme scale — which is why Azure SignalR Service exists.",
      followUp: ["What happens when the Redis backplane goes down? How should the system degrade?", "How does Azure SignalR Service differ architecturally from a Redis backplane?"],
      seniorPerspective: "Monitor Redis pub/sub metrics: subscriber count, message throughput, channel count. A misconfigured backplane (too many channels, message too large) can saturate Redis and cause cascading delays across all real-time features.",
      architectPerspective: "The Redis backplane's broadcast-to-all pattern works up to ~20 servers. Beyond that, the N² message amplification (every server gets every message) wastes significant bandwidth. At that scale, implement topic-based routing or move to Azure SignalR Service's intelligent routing."
    },
    {
      question: "Design a presence system (online/offline status) for a platform with 1M registered users and 100K concurrent connections.",
      difficulty: "advanced",
      answer: "<p><strong>Data model in Redis</strong>:</p><ul><li><code>presence:{userId}</code> → Hash: {connectionId1: timestamp, connectionId2: timestamp}</li><li>User is online if hash has any entries. Offline if hash is empty or key doesn't exist.</li><li>Each entry has a TTL refreshed by heartbeats (managed by sorted set for bulk expiry).</li></ul><p><strong>State transitions</strong>:</p><ul><li><strong>Connect</strong>: HSET presence:{userId} {connId} {now}. If hash was empty before → publish 'user-online' event.</li><li><strong>Heartbeat</strong> (every 15s): HSET presence:{userId} {connId} {now}. Refreshes last-seen.</li><li><strong>Disconnect</strong>: HDEL presence:{userId} {connId}. If hash is now empty → start grace period (don't immediately notify).</li><li><strong>Grace period</strong> (5-10s): Schedule a check. If still offline after grace period → publish 'user-offline' event. Prevents flapping during page refreshes.</li></ul><p><strong>Querying presence</strong>: For a friend list of 200 friends, pipeline 200 EXISTS commands to Redis (~1ms total). Return online status as a batch. Cache results client-side with 30s TTL for non-critical UI.</p><p><strong>Scaling concern</strong>: Presence change fan-out. User with 500 friends goes offline → 500 targeted notifications. Rate-limit presence broadcasts: batch presence changes and deliver every 2-3 seconds to reduce message volume during mass connect/disconnect events (server restart).</p>",
      interviewTip: "Address the thundering herd: if a server with 50K connections crashes, 50K users go 'offline' simultaneously. Without batching/throttling, this generates millions of presence notifications. Explain your mitigation strategy.",
      followUp: ["How would you handle presence for users who are 'idle' vs 'active'?", "How do you prevent presence fan-out storms during server restarts?"],
      seniorPerspective: "In production, presence systems need a 'stale but available' mode. If Redis is down, serve cached presence (possibly stale) rather than marking everyone as offline. Users tolerate seeing a friend as 'online' when they're not, but mass 'offline' notifications during infrastructure issues confuse users.",
      architectPerspective: "Presence is one of the most challenging distributed systems problems at scale because it combines real-time delivery, distributed state, and high fan-out. Discord, Slack, and WhatsApp each take different approaches. Consider whether eventual consistency (30s delay) is acceptable — it dramatically simplifies the architecture."
    },
    {
      question: "How do you handle back-pressure when a client can't consume messages fast enough?",
      difficulty: "hard",
      answer: "<p><strong>The problem</strong>: A mobile client on a slow 3G connection receives messages slower than the server produces them. Without back-pressure, the server buffers unboundedly → memory exhaustion → server crash affecting all connections.</p><p><strong>SignalR's built-in mechanism</strong>: <code>HubOptions.StreamBufferCapacity</code> limits per-client send buffer. When full, the oldest messages are dropped (for streaming scenarios). For non-streaming sends, the server queues messages up to a transport-specific buffer limit.</p><p><strong>Application-level strategies</strong>:</p><p><strong>1. Conflation (merge)</strong>: For frequently updating data (stock prices, game positions), keep only the latest value. If 10 price updates queue while the client is slow, deliver only the most recent. Client always sees current state, never stale intermediate states.</p><p><strong>2. Priority queues</strong>: Critical messages (order confirmations) get priority over non-critical (typing indicators). Under pressure, drop low-priority messages first.</p><p><strong>3. Client-driven flow control</strong>: Client sends acknowledgments. Server only sends the next batch after ack. Slow clients naturally throttle the server. Downside: reduces throughput for fast clients if implemented naively.</p><p><strong>4. Disconnect slow clients</strong>: After a timeout (e.g., 30s of full buffer), forcefully disconnect. Client reconnects and receives current state (catch-up). Harsh but protects server resources. Configurable per client tier (premium vs free).</p><p><strong>5. Debounce at source</strong>: Limit how often events enter the real-time pipeline. Database changes at 1000/sec? Aggregate into batches of 10 published every 100ms. Fewer messages = less back-pressure pressure.</p>",
      interviewTip: "Name the specific failure mode you're preventing: unbounded buffer growth → OOM → process crash → all clients disconnected. Then present strategies in order from least to most aggressive.",
      followUp: ["How do you detect that a client is falling behind before the buffer fills?", "What is the difference between back-pressure in reactive streams vs WebSocket connections?"],
      seniorPerspective: "In production, monitor per-connection send queue depth. Alert at 80% buffer capacity. Track the ratio of dropped/conflated messages per client — high ratios suggest the client should reduce their subscription scope or increase polling interval.",
      architectPerspective: "Back-pressure is the difference between a demo and a production system. Every real-time architecture must answer: 'What happens when consumption rate < production rate?' The answer affects your message contract (do clients expect all messages or just latest state?) and your SLA."
    },
    {
      question: "Explain SignalR connection management during deployment. How do you achieve zero-downtime updates?",
      difficulty: "hard",
      answer: "<p><strong>The challenge</strong>: During deployment, old server instances are terminated. Each has active WebSocket connections that will be forcefully closed — clients experience disconnection and must reconnect to new instances.</p><p><strong>Connection draining strategy</strong>:</p><ol><li><strong>Remove from load balancer</strong>: Kubernetes readiness probe fails → new connections routed elsewhere. Existing connections unaffected.</li><li><strong>Stop accepting new connections</strong>: Hub rejects new connections (return error, let client connect to another server).</li><li><strong>Graceful close notification</strong>: Send a 'server shutting down' message to clients. Clients can initiate reconnection to a new server proactively.</li><li><strong>Drain period</strong> (30-60s): Wait for clients to reconnect elsewhere. Monitor active connection count decreasing.</li><li><strong>Force close remaining</strong>: After drain timeout, close remaining connections. Clients auto-reconnect with SignalR's built-in reconnection.</li></ol><p><strong>Client-side handling</strong>:</p><ul><li>SignalR client has <code>withAutomaticReconnect([0, 2000, 5000, 10000])</code> — exponential backoff</li><li>On reconnection: client re-subscribes to groups and requests missed messages (if applicable)</li><li>Add jitter to prevent thundering herd: <code>delay + random(0, delay * 0.3)</code></li></ul><p><strong>Azure SignalR Service advantage</strong>: Connections are to the Azure service, not your app server. App server restarts don't disconnect clients — the Azure service buffers messages during the brief app unavailability.</p>",
      interviewTip: "Mention the thundering herd problem explicitly: if a server with 50K connections dies, 50K clients reconnecting simultaneously can overload remaining servers. Jitter in reconnection delay is critical.",
      followUp: ["How do you handle state reconciliation when a client reconnects to a different server?", "What is the difference between connection draining and pod disruption budgets in Kubernetes?"],
      seniorPerspective: "In practice, set Kubernetes terminationGracePeriodSeconds to match your drain timeout (60s typical). Configure preStop hooks to trigger the drain. Monitor connection migration time during deploys — it should decrease as you optimize the process.",
      architectPerspective: "Zero-downtime deployment for stateful connections is fundamentally harder than for stateless HTTP. Consider whether your architecture can tolerate brief disconnections (5s) with client-side buffering, or whether you truly need zero-downtime (which requires Azure SignalR Service or similar connection offloading)."
    },
    {
      question: "Design a real-time sports score update system that handles 200K concurrent viewers during a major event.",
      difficulty: "expert",
      answer: "<p><strong>Architecture</strong>:</p><p><strong>Data ingestion</strong>: Score updates arrive from a data provider (feed) at variable rates — 0-50 updates/second during live play. Feed consumer validates, enriches, and publishes to an internal event bus (Redis Streams or Kafka).</p><p><strong>Fan-out layer</strong>: A SignalR hub service subscribes to the event bus. On score update, determines affected audiences (game subscribers, league subscribers, all-sports subscribers) and publishes via appropriate groups.</p><p><strong>Connection management</strong>: 200K viewers across 4-5 SignalR servers (50K each) with Redis backplane. Viewers join groups by game (game-{id}), league (league-{id}), or sport (sport-{id}). A score update publishes to the game group — only interested viewers receive it.</p><p><strong>Conflation</strong>: During rapid play (basketball fast break — 5 score changes in 10s), conflate updates: buffer for 500ms, send the latest state. Viewers see current score, not every intermediate change. Reduces message count by 3-5x during bursts.</p><p><strong>Scalability measures</strong>:</p><ul><li>MessagePack protocol: 40% smaller than JSON for score DTOs</li><li>Delta updates: Send only changed fields, not full game state</li><li>Subscription tiers: Active tab gets instant updates, background tab gets 5s batches (Page Visibility API)</li><li>Read-through cache: On reconnection, serve current scores from Redis cache (don't query DB)</li></ul>",
      interviewTip: "Quantify the load: 200K connections × 1 update/second per game × 10 simultaneous games = 2M messages/second total fan-out. Show you can estimate infrastructure requirements from these numbers.",
      followUp: ["How would you handle a system where 100K viewers are all watching the same game (hot group)?", "How do you ensure message ordering for score updates?"],
      seniorPerspective: "The critical path is data provider → event bus → SignalR → client. Monitor end-to-end latency (target < 1 second). Add distributed tracing to track message propagation time. Alert if latency exceeds 3 seconds — users comparing against TV broadcast will notice.",
      architectPerspective: "For truly massive events (World Cup final, 10M+ viewers), the architecture shifts from server-side fan-out to CDN-based push (Cloudflare Workers with WebSocket, or server-sent events through CDN). At that scale, your servers can't handle the connection count regardless of horizontal scaling."
    },
    {
      question: "How would you implement real-time notifications that guarantee delivery even if the user is temporarily offline?",
      difficulty: "advanced",
      answer: "<p><strong>The problem</strong>: WebSocket/SignalR are fire-and-forget for delivery. If the client is disconnected when a notification is sent, it's lost. Real-time push ≠ guaranteed delivery.</p><p><strong>Guaranteed delivery architecture</strong>:</p><p><strong>1. Persistent storage</strong>: Every notification is stored in a database (NotificationId, UserId, Type, Payload, CreatedAt, ReadAt, DeliveredAt). This is the source of truth — real-time push is just an optimization.</p><p><strong>2. Real-time attempt</strong>: After storing, attempt real-time delivery via SignalR. If client is connected, they receive it instantly. Mark DeliveredAt on ack from client.</p><p><strong>3. Catch-up on reconnection</strong>: When client connects, it sends its last-seen NotificationId (or timestamp). Server queries for all notifications after that point and delivers them. Client is now caught up.</p><p><strong>4. Client acknowledgment</strong>: Client acks received notifications (batch ack every 5s). Server tracks delivery status. Unacked notifications are re-delivered on next connection.</p><p><strong>5. Push notification fallback</strong>: If user hasn't been online for X minutes and has a mobile device, send a push notification (APNs/FCM) as a secondary channel. Push notification = 'you have updates, open the app' → app connects → catch-up delivers full content.</p><p><strong>Ordering guarantee</strong>: Assign monotonically increasing sequence numbers per user. Client detects gaps and requests missing notifications explicitly. Prevents out-of-order delivery causing confusion.</p>",
      interviewTip: "Emphasize the dual-write pattern: always persist to DB first (guaranteed durable), then attempt real-time push (best-effort speed). Never rely solely on real-time push for notifications that must not be lost.",
      followUp: ["How do you handle the case where a notification becomes irrelevant by the time the user comes online?", "How would you implement notification batching to avoid notification fatigue?"],
      seniorPerspective: "Monitor delivery latency distribution: what percentage of notifications are delivered in < 1s (real-time), < 10s (reconnection catch-up), < 1h (push notification), and never (user churned). This tells you whether your real-time investment is worthwhile.",
      architectPerspective: "This pattern — persist + attempt real-time + catch-up — is the standard for any system that needs both low latency and guaranteed delivery. It applies to chat (WhatsApp, Slack), notifications, and collaborative editing. The trade-off is storage cost and catch-up query complexity."
    },
    {
      question: "What are the security considerations for WebSocket/SignalR connections?",
      difficulty: "medium",
      answer: "<p><strong>Authentication</strong>:</p><ul><li>WebSocket doesn't support custom headers after the upgrade. Pass JWT token as query parameter during connection: <code>new HubConnectionBuilder().WithUrl('/hub?access_token=xxx')</code></li><li>SignalR extracts the token via a custom IUserIdProvider or access token factory. Validate on every connection, not just the initial handshake.</li><li>Token expiration: WebSocket connections are long-lived but tokens expire. Implement token refresh — client gets new token via HTTP, server validates on next message.</li></ul><p><strong>Authorization</strong>:</p><ul><li>Hub method authorization: <code>[Authorize(Policy = \"AdminOnly\")]</code> on hub methods</li><li>Group membership validation: Don't let clients join arbitrary groups. Validate permission before AddToGroupAsync.</li><li>User-targeted messages: Ensure UserId claim matches authenticated identity. Never let clients specify another user's ID.</li></ul><p><strong>DoS protection</strong>:</p><ul><li>Connection limit per user (max 5 concurrent connections per userId)</li><li>Message rate limiting (max 30 messages/second per connection)</li><li>Message size limit (MaximumReceiveMessageSize = 32KB default)</li><li>Connection throttling: Rate limit new connections from the same IP</li></ul><p><strong>Cross-origin</strong>: Configure CORS for SignalR endpoints explicitly. WebSocket doesn't enforce same-origin policy — your server must validate the Origin header.</p>",
      interviewTip: "The token-in-query-string concern is real: it appears in server logs and URL history. Mention that in production, use short-lived tokens (5 min) specifically for WebSocket connection establishment, not the user's main JWT.",
      followUp: ["How do you handle token refresh for long-lived WebSocket connections?", "What is the WebSocket Origin header and how does it differ from CORS?"],
      seniorPerspective: "Common production issue: JWT in query string gets logged in access logs, proxy logs, and APM tools. Use a short-lived connection-specific token exchanged via HTTP first, then the WebSocket URL only contains this opaque token. Rotate every 5 minutes.",
      architectPerspective: "WebSocket security is often an afterthought. In a threat model, consider: Can an authenticated user escalate access by joining unauthorized groups? Can a compromised client flood the backplane affecting all users? Can connection state be manipulated to impersonate another user? Address each in the security review."
    },
    {
      question: "Explain the difference between SignalR groups and user-targeted messages. When would you use each?",
      difficulty: "medium",
      answer: "<p><strong>Groups</strong>: Named collections of connections. A connection can be in multiple groups. Groups are server-local (with backplane broadcasting). Use for: chat rooms, game lobbies, topic subscriptions, geographic regions.</p><p><strong>User targeting (Clients.User(userId))</strong>: Delivers to ALL connections of a specific user (across devices/tabs). Requires configuring IUserIdProvider (default uses ClaimTypes.NameIdentifier). Use for: personal notifications, account alerts, session management.</p><p><strong>Key differences</strong>:</p><ul><li><strong>Granularity</strong>: Groups target connections (you choose which connection joins which group). User targets all connections for an identity (automatic).</li><li><strong>Persistence</strong>: Group membership is lost on disconnect (client must rejoin on reconnect). User targeting works as long as any connection for that user exists.</li><li><strong>Management</strong>: Groups require explicit add/remove. User targeting requires proper authentication (no management needed).</li></ul><p><strong>Practical patterns</strong>:</p><ul><li><strong>Notifications</strong>: User-targeted. Reach user on all devices.</li><li><strong>Chat room</strong>: Group per room. Connections join/leave groups.</li><li><strong>Live dashboard</strong>: Group per dashboard/data source. Multiple users see same data.</li><li><strong>Admin broadcast</strong>: Clients.All or a 'system-announcements' group.</li></ul><p><strong>Combining both</strong>: A user in a chat room has user-targeted notifications AND group membership for the room. Different message types use different targeting.</p>",
      interviewTip: "Mention that Groups.AddToGroupAsync must be called again after reconnection — group membership doesn't persist. This is a common source of bugs where clients stop receiving messages after reconnecting.",
      followUp: ["How do you persist group membership across reconnections?", "Can you send to multiple groups in a single call?"],
      seniorPerspective: "Design group naming conventions carefully: 'game-{gameId}', 'league-{leagueId}', 'user-{userId}-devices'. Consistent naming makes debugging easier when tracing why a message didn't reach a client.",
      architectPerspective: "Groups are the abstraction that makes real-time systems scalable. Without groups, every message would be broadcast to all connections (O(N) where N = total connections). Groups reduce fan-out to O(M) where M = group members. Design your subscription model around group granularity."
    }
  ]
});
