/* ═══════════════════════════════════════════════════════════════════
   ASP.NET Core — SignalR (Real-time Communication)
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('aspnet-signalr', {
    title: 'SignalR — Real-time Communication',
    description: 'Building real-time web applications with SignalR — hubs, groups, streaming, scaling with Redis backplane, authentication, and production deployment patterns.',
    sections: [
        {
            title: 'SignalR Fundamentals',
            content: `<p><strong>SignalR</strong> provides server-to-client and client-to-server real-time communication. It abstracts transport negotiation — automatically choosing the best available: WebSockets → Server-Sent Events → Long Polling.</p>
            <ul>
                <li><strong>Hubs</strong> — server-side classes that define callable methods</li>
                <li><strong>Connections</strong> — each client has a unique ConnectionId</li>
                <li><strong>Groups</strong> — logical groupings of connections (chat rooms, topics)</li>
                <li><strong>Streaming</strong> — server-to-client or client-to-server data streams</li>
            </ul>`,
            code: `// Server: Hub definition
public class ChatHub : Hub
{
    // Client calls this method
    public async Task SendMessage(string user, string message)
    {
        // Broadcast to ALL connected clients
        await Clients.All.SendAsync("ReceiveMessage", user, message);
    }

    // Send to specific group
    public async Task SendToRoom(string room, string user, string message)
    {
        await Clients.Group(room).SendAsync("ReceiveMessage", user, message);
    }

    // Join/leave groups
    public async Task JoinRoom(string room)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, room);
        await Clients.Group(room).SendAsync("UserJoined", Context.User?.Identity?.Name);
    }

    // Connection lifecycle
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.GetUserId();
        await Clients.Others.SendAsync("UserOnline", userId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.GetUserId();
        await Clients.Others.SendAsync("UserOffline", userId);
        await base.OnDisconnectedAsync(exception);
    }
}

// Registration
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

app.MapHub<ChatHub>("/hubs/chat");`,
            language: 'csharp'
        },
        {
            title: 'Strongly-Typed Hubs & Sending from Outside',
            content: `<p>Strongly-typed hubs provide compile-time safety for client method calls. <code>IHubContext&lt;T&gt;</code> enables sending messages from services, controllers, or background workers — not just from within the hub.</p>`,
            code: `// Define client interface (compile-time safety)
public interface IChatClient
{
    Task ReceiveMessage(string user, string message);
    Task UserJoined(string userName);
    Task UserOffline(string userName);
    Task ReceiveNotification(NotificationDto notification);
}

// Strongly-typed hub
public class ChatHub : Hub<IChatClient>
{
    public async Task SendMessage(string user, string message)
    {
        // Compile-time checked! No magic strings
        await Clients.All.ReceiveMessage(user, message);
        // await Clients.All.NonExistentMethod(); // COMPILE ERROR!
    }
}

// Sending from OUTSIDE the hub (services, background workers):
public class OrderService
{
    private readonly IHubContext<NotificationHub, INotificationClient> _hub;

    public OrderService(IHubContext<NotificationHub, INotificationClient> hub)
    {
        _hub = hub;
    }

    public async Task PlaceOrderAsync(Order order)
    {
        await _repository.SaveAsync(order);
        
        // Notify specific user
        await _hub.Clients.User(order.CustomerId.ToString())
            .ReceiveNotification(new NotificationDto
            {
                Title = "Order Confirmed",
                Body = $"Order #{order.Id} is being processed"
            });
        
        // Notify admin group
        await _hub.Clients.Group("admins")
            .ReceiveNotification(new NotificationDto
            {
                Title = "New Order",
                Body = $"Order #{order.Id} — {order.Total:F2}"
            });
    }
}

// Background service sending real-time updates:
public class StockPriceService : BackgroundService
{
    private readonly IHubContext<StockHub, IStockClient> _hub;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var prices = await FetchLatestPrices();
            await _hub.Clients.All.PriceUpdate(prices);
            await Task.Delay(TimeSpan.FromSeconds(1), ct);
        }
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Scaling SignalR — Redis Backplane',
            content: `<p>By default, SignalR state is in-memory — it only knows about connections to the current server. For load-balanced deployments, a <strong>backplane</strong> (Redis, Azure SignalR Service) distributes messages across all servers.</p>`,
            code: `// Problem: Load balancer sends User A to Server 1, User B to Server 2
// Server 1 calls Clients.All → only reaches clients on Server 1!

// Solution: Redis backplane
builder.Services.AddSignalR()
    .AddStackExchangeRedis("localhost:6379", options =>
    {
        options.Configuration.ChannelPrefix = RedisChannel.Literal("myapp:");
    });

// How it works:
// 1. Server 1 sends message via hub
// 2. Message published to Redis channel
// 3. ALL servers subscribed to channel receive message
// 4. Each server delivers to its local connections

// Azure SignalR Service (managed, scales to millions):
builder.Services.AddSignalR()
    .AddAzureSignalR(options =>
    {
        options.ConnectionString = config["Azure:SignalR:ConnectionString"];
        options.ServerStickyMode = ServerStickyMode.Required; // For stateful hubs
    });

// Sticky sessions (when needed):
// WebSocket connections are long-lived — if load balancer routes
// reconnection to different server, state is lost
// Solutions:
// 1. Redis backplane (share state)
// 2. Azure SignalR Service (managed)
// 3. Sticky sessions via cookie/IP (not recommended for scale)

// Connection management at scale:
builder.Services.AddSignalR(options =>
{
    options.MaximumReceiveMessageSize = 64 * 1024; // 64KB max message
    options.StreamBufferCapacity = 20;
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.HandshakeTimeout = TimeSpan.FromSeconds(5);
});`,
            language: 'csharp',
            callout: { type: 'warning', title: 'Scaling Considerations', text: 'Without a backplane, SignalR only works correctly on a single server. Any multi-instance deployment MUST use Redis backplane or Azure SignalR Service. Also ensure your load balancer supports WebSocket upgrades (Layer 7 with WebSocket pass-through).' }
        },
        {
            title: 'Streaming & Authentication',
            content: `<p>SignalR supports <strong>server-to-client streaming</strong> (pushing data over time) and <strong>client-to-server streaming</strong> (uploading in chunks). Authentication uses the same JWT/cookie mechanisms as regular HTTP with special handling for WebSocket transport.</p>`,
            code: `// Server-to-client streaming (IAsyncEnumerable)
public class DashboardHub : Hub
{
    public async IAsyncEnumerable<StockPrice> StreamPrices(
        string[] symbols,
        [EnumeratorCancellation] CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            foreach (var symbol in symbols)
            {
                yield return await GetPrice(symbol);
            }
            await Task.Delay(1000, ct);
        }
    }
}

// Client-to-server streaming (upload):
public async Task UploadData(IAsyncEnumerable<DataChunk> stream)
{
    await foreach (var chunk in stream)
    {
        await ProcessChunk(chunk);
    }
}

// Authentication — JWT with SignalR:
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Events = new JwtBearerEvents
        {
            // WebSocket can't send headers — token in query string
            OnMessageReceived = context =>
            {
                var token = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                
                if (!string.IsNullOrEmpty(token) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = token; // Use query string token
                }
                return Task.CompletedTask;
            }
        };
    });

// Authorize hub or methods:
[Authorize]
public class SecureHub : Hub
{
    [Authorize(Policy = "AdminOnly")]
    public async Task AdminAction() { /* ... */ }
    
    // Access user info:
    public string GetCurrentUser() => Context.User?.Identity?.Name ?? "Anonymous";
    public string GetUserId() => Context.UserIdentifier!; // Maps to ClaimTypes.NameIdentifier
}`,
            language: 'csharp'
        }
    ],
    questions: [
        {"question":"What is SignalR, what transports does it use, and how does it choose one?","difficulty":"medium","answer":"<p><strong>SignalR</strong> is an ASP.NET Core library for real-time server-to-client (and client-to-server) messaging over persistent connections, exposing a <em>Hub</em> abstraction with RPC-style method calls. It supports three transports: <strong>WebSockets</strong> (preferred — full-duplex, lowest overhead), <strong>Server-Sent Events</strong>, and <strong>Long Polling</strong> (fallbacks).</p><p>SignalR <strong>negotiates</strong> the best transport both client and server support, automatically falling back from WebSockets to SSE to long polling if needed. It abstracts transport details so you code against the Hub, not the wire protocol.</p>","explanation":"SignalR is a phone line that stays open so the server can call you the instant something happens, instead of you redialing to ask \"anything new?\" It uses the best available line and falls back to older ones if needed.","bestPractices":["Prefer WebSockets; let SignalR negotiate fallbacks","Use strongly-typed hubs for compile-time safety","Send targeted messages (groups/users), not always broadcast"],"commonMistakes":["Assuming WebSockets always available (proxies may block)","Broadcasting to all when a group/user would do","Putting heavy work in hub methods, blocking the connection"],"interviewTip":"Name the three transports and the negotiation/fallback order (WebSockets -> SSE -> long polling); mention the Hub abstraction.","followUp":["How do groups and users work in SignalR?","How do you scale SignalR across servers?","What is a strongly-typed hub?"]},
        {"question":"How do you scale SignalR across multiple server instances?","difficulty":"hard","answer":"<p>With multiple instances behind a load balancer, a client is connected to only <em>one</em> server, so a message sent from another server would not reach it. You need a <strong>backplane</strong> to distribute messages across all servers: the <strong>Redis backplane</strong> (or <strong>Azure SignalR Service</strong>, which offloads connection management entirely).</p><p>Also require <strong>sticky sessions</strong> (or Azure SignalR) so a client's negotiate and connection reach the same server, and design hub state to be external (not in-process). Azure SignalR Service is the common production choice because it handles scale, connections, and backplane for you.</p>","explanation":"If fans are split across several stadiums (servers), an announcement in one stadium is not heard in the others. A backplane is the shared PA system that relays every announcement to all stadiums at once.","bestPractices":["Use a Redis backplane or Azure SignalR Service","Enable sticky sessions when self-hosting","Keep hub/connection state external, not in-process"],"commonMistakes":["Scaling out with no backplane (messages lost across servers)","No sticky sessions causing negotiate/connection mismatch","Storing per-connection state in server memory"],"interviewTip":"The core insight: a client is on one server, so cross-server delivery needs a backplane (Redis) or Azure SignalR; add sticky sessions. That answer shows you understand the scale-out problem.","followUp":["Why are sticky sessions needed?","What does Azure SignalR Service handle for you?","How does the Redis backplane distribute messages?"]},
        {
            question: 'What is SignalR and how does it handle transport negotiation? When would you use it?',
            difficulty: 'easy',
            answer: `<p>SignalR is a library for adding real-time server-to-client communication to ASP.NET Core apps. It automatically negotiates the best transport: WebSockets (bidirectional, persistent) → Server-Sent Events (server push only) → Long Polling (fallback). Use it for live dashboards, chat, notifications, collaborative editing, or any scenario requiring push updates.</p>`,
            code: `// Transport negotiation flow:
// 1. Client sends POST /hub/negotiate
// 2. Server returns available transports + connection token
// 3. Client picks best available:
//    - WebSocket (best: bidirectional, low latency, persistent)
//    - Server-Sent Events (good: server→client only, HTTP/2 compatible)
//    - Long Polling (fallback: high latency, works everywhere)
// 4. Connection established on chosen transport

// Use cases for SignalR:
// - Live notifications (order status, alerts)
// - Chat / messaging applications
// - Real-time dashboards (stock prices, sports scores)
// - Collaborative editing (Google Docs-style)
// - Gaming (multiplayer state sync)
// - IoT device monitoring

// When NOT to use SignalR:
// - Simple request/response APIs (use HTTP)
// - Fire-and-forget messages (use message queues)
// - Batch data processing (use background jobs)
// - Client doesn't need immediate updates (use polling)

// Client connection (JavaScript):
// const connection = new signalR.HubConnectionBuilder()
//     .withUrl("/hubs/chat", { accessTokenFactory: () => getToken() })
//     .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
//     .build();
// await connection.start();
// connection.on("ReceiveMessage", (user, msg) => display(user, msg));`,
            language: 'csharp',
            bestPractices: [
                'Use strongly-typed hubs (Hub<IClient>) for compile-time safety',
                'Implement automatic reconnection on the client side',
                'Use groups for targeted messaging (rooms, topics, user-specific)',
                'Always add a Redis backplane for multi-instance deployments'
            ],
            commonMistakes: [
                'Not configuring a backplane for load-balanced environments',
                'Storing connection state in the hub (hubs are transient — state is lost between calls)',
                'Not handling disconnection/reconnection on the client',
                'Sending large payloads via SignalR (use HTTP for file uploads, SignalR for notifications)'
            ],
            interviewTip: 'Explain the transport fallback chain and WHY: WebSocket requires server + proxy support, SSE is HTTP/2 friendly but unidirectional, Long Polling works everywhere but is inefficient. Show you understand when real-time is appropriate vs over-engineering.',
            followUp: ['How does SignalR differ from raw WebSockets?', 'How do you scale SignalR horizontally?', 'What is the Azure SignalR Service?'],
            seniorPerspective: 'I use SignalR for push notifications and live dashboards, but I\'m careful about scope: if the client only needs updates every 30 seconds, polling or SSE is simpler and cheaper. SignalR adds connection management complexity.',
            architectPerspective: 'At scale (100K+ connections), Azure SignalR Service is the pragmatic choice — it handles connection management, scaling, and availability. For on-prem, Redis backplane + sticky sessions + health monitoring is the minimum viable setup.'
        },
        {
            question: 'How do you scale SignalR across multiple server instances?',
            difficulty: 'advanced',
            answer: `<p>SignalR connections are bound to a specific server. Without a backplane, messages sent on Server A don't reach clients connected to Server B. Scaling requires a <strong>backplane</strong> (Redis pub/sub, Azure SignalR Service) that broadcasts messages across all servers, ensuring every client receives the message regardless of which server it's connected to.</p>`,
            code: `// The problem:
// Server 1: has clients A, B, C connected
// Server 2: has clients D, E, F connected
// Hub on Server 1 calls Clients.All.SendAsync(...)
// Only A, B, C receive the message! D, E, F miss it!

// Solution: Redis backplane
builder.Services.AddSignalR()
    .AddStackExchangeRedis(connectionString, options =>
    {
        options.Configuration.ChannelPrefix = RedisChannel.Literal("app:signalr:");
    });

// How it works:
// 1. Server 1 hub calls Clients.All.SendAsync("msg", data)
// 2. Message published to Redis pub/sub channel
// 3. Server 2 receives message from Redis subscription
// 4. Server 2 delivers to its local clients (D, E, F)
// Result: ALL clients receive the message

// Azure SignalR Service (fully managed):
builder.Services.AddSignalR()
    .AddAzureSignalR(); // Reads ConnectionString from config
// Benefits:
// - No connection management on your servers
// - Auto-scales to millions of connections
// - Built-in metrics and diagnostics
// - Your server only handles hub logic, not WebSocket management

// Additional scaling considerations:
// 1. Load balancer must support WebSocket upgrade
// 2. Sticky sessions help avoid reconnection storms
// 3. Configure appropriate timeouts:
builder.Services.AddSignalR(options =>
{
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.MaximumParallelInvocationsPerClient = 1; // Prevent client flooding
});

// 4. Monitor connection counts and message throughput
// 5. Use groups efficiently (avoid broadcasting to all when targeting subset)
// 6. Consider message size — large payloads amplified across all connections`,
            language: 'csharp',
            bestPractices: [
                'Always use Redis backplane or Azure SignalR Service for multi-instance',
                'Configure load balancer for WebSocket pass-through',
                'Use groups instead of broadcasting to all (reduces amplification)',
                'Monitor connection counts, message rates, and backplane latency'
            ],
            commonMistakes: [
                'Deploying without a backplane behind a load balancer (messages lost)',
                'Storing state in hub fields (hubs are transient, recreated per invocation)',
                'Broadcasting to All when Groups would be more targeted',
                'Not handling reconnection client-side (users silently lose connection)'
            ],
            interviewTip: 'Draw the architecture: Client → Load Balancer → Server 1/2/3 → Redis backplane connecting them all. Explain that without the backplane, each server is an island. Then mention Azure SignalR Service as the managed alternative that eliminates the problem entirely.',
            followUp: ['What is the difference between Redis backplane and Azure SignalR Service?', 'How do you handle user presence (online/offline) at scale?', 'What happens during a server restart — do clients reconnect?'],
            seniorPerspective: 'For production, I use Azure SignalR Service in "Default" mode (connections managed by Azure) for anything over 1000 concurrent connections. Below that threshold, Redis backplane is simpler and cheaper.',
            architectPerspective: 'Real-time at scale requires thinking about fan-out: a message to 100K users multiplied by message size = significant bandwidth. I design around groups (topics) with bounded membership, and use tiered delivery: urgent via SignalR, batch via push notifications.'
        },
        {
            question: 'How do SignalR groups work and how do you manage connection-to-user mapping at scale?',
            difficulty: 'medium',
            answer: `<p><strong>Groups</strong> are dynamic, named collections of connections used for targeted broadcasting (chat rooms, topics, tenants). Key facts:</p>
            <ul>
                <li>Group membership is keyed by <code>ConnectionId</code>, not user — a single user with multiple tabs/devices has multiple connections</li>
                <li>Groups are not persisted: on reconnect the client gets a new <code>ConnectionId</code> and must rejoin</li>
                <li>For user-targeted messages, use <code>Clients.User(userId)</code> which maps to the <code>UserIdentifier</code> (NameIdentifier claim) and reaches all of that user's connections automatically</li>
                <li>With a backplane, group membership and <code>Clients.User</code> routing work across all servers</li>
            </ul>`,
            explanation: 'A group is like a mailing list keyed by individual phone lines (connections), not people. One person with three phones is on the list three times, and the list is wiped if they get a new number.',
            code: `public class ChatHub : Hub
{
    private readonly IConnectionTracker _tracker;
    public ChatHub(IConnectionTracker tracker) => _tracker = tracker;

    public async Task JoinRoom(string room)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, room);
        await Clients.Group(room).SendAsync("UserJoined", Context.UserIdentifier);
    }

    public override async Task OnConnectedAsync()
    {
        // Track presence: one user can have many connections
        await _tracker.AddAsync(Context.UserIdentifier!, Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? ex)
    {
        await _tracker.RemoveAsync(Context.UserIdentifier!, Context.ConnectionId);
        // Groups auto-clean on disconnect; presence store must be updated manually
        await base.OnDisconnectedAsync(ex);
    }
}

// Reaching all connections for a user (across tabs AND servers via backplane):
await _hub.Clients.User(userId).SendAsync("ReceiveNotification", payload);`,
            language: 'csharp',
            bestPractices: [
                'Use Clients.User(id) for user-targeted messages instead of tracking ConnectionIds yourself',
                'Re-add connections to groups inside OnConnectedAsync since membership is lost on reconnect',
                'Store presence (user -> connections) in Redis when running multiple instances',
                'Keep group names bounded and meaningful (room IDs, tenant IDs) to limit fan-out'
            ],
            commonMistakes: [
                'Assuming group membership survives a reconnect (it does not)',
                'Mapping one ConnectionId per user (breaks with multiple tabs/devices)',
                'Tracking presence in an in-memory dictionary in a load-balanced deployment',
                'Forgetting to clean up presence state in OnDisconnectedAsync'
            ],
            interviewTip: 'Stress the connection-vs-user distinction. Interviewers want to hear that groups are keyed by ConnectionId, reconnects require rejoining, and Clients.User handles multi-device fan-out for you.',
            followUp: ['How does SignalR map a user to UserIdentifier?', 'How do you build accurate presence (online/offline) at scale?', 'What happens to groups when a server restarts?'],
            seniorPerspective: 'I never hand-roll user-to-connection tracking for messaging — Clients.User plus a backplane does it correctly. I only maintain a presence store when the product genuinely needs online/offline indicators, and I back it with Redis with TTLs to self-heal from missed disconnect events.',
            architectPerspective: 'Presence is deceptively hard: disconnect events can be missed on hard network drops. I design presence as eventually-consistent with heartbeat-based TTL keys in Redis rather than relying solely on OnDisconnectedAsync, which silently fails on power loss or killed processes.'
        },
        {
            question: 'How do you secure a SignalR hub with JWT authentication given WebSocket limitations?',
            difficulty: 'hard',
            answer: `<p>WebSocket handshakes from browsers cannot set custom <code>Authorization</code> headers, so the standard bearer-header flow does not apply. SignalR's JS client sends the token as an <code>access_token</code> query-string parameter. You wire this up via the <code>OnMessageReceived</code> JWT event, reading the query token only for hub paths. Authorization then uses the same <code>[Authorize]</code> attributes and policies as the rest of the app.</p>`,
            explanation: 'A browser WebSocket cannot carry an ID badge in its pocket (header), so it tapes the badge to the envelope (query string). The doorman is told to check the envelope only for the hub door.',
            code: `builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://auth.example.com";
        options.Audience = "my-api";
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

[Authorize]
public class SecureHub : Hub
{
    [Authorize(Policy = "AdminOnly")]
    public Task AdminBroadcast(string msg) =>
        Clients.All.SendAsync("Admin", msg);
}

// JS client supplies the token:
// new signalR.HubConnectionBuilder()
//   .withUrl("/hubs/secure", { accessTokenFactory: () => getToken() })
//   .build();`,
            language: 'csharp',
            bestPractices: [
                'Only read the query-string token for hub paths to avoid leaking it elsewhere',
                'Always serve hubs over HTTPS/WSS so the query-string token is encrypted in transit',
                'Use short-lived access tokens and rely on accessTokenFactory to supply fresh tokens on reconnect',
                'Apply [Authorize] policies at hub and method level just like controllers'
            ],
            commonMistakes: [
                'Expecting the Authorization header to work for browser WebSocket connections',
                'Logging full request URLs (query-string token leaks into logs)',
                'Using long-lived tokens because the client cannot refresh mid-connection',
                'Forgetting that an expired token is only re-checked on reconnect, not mid-stream'
            ],
            interviewTip: 'Lead with the root cause: browser WebSockets cannot set headers. Then show the OnMessageReceived query-string handler scoped to hub paths. Mention token expiry only being re-evaluated on (re)connection.',
            followUp: ['When is the token re-validated during a long-lived connection?', 'How does accessTokenFactory help with reconnection?', 'Why scope the query-string token to /hubs paths only?'],
            seniorPerspective: 'I keep access tokens short (5-15 min) and lean on automatic reconnection plus accessTokenFactory so each reconnect carries a fresh token. Long-lived connections do not re-validate tokens mid-stream, so I disconnect-and-reconnect to enforce token rotation.',
            architectPerspective: 'For very long-lived real-time sessions I sometimes terminate WebSocket auth at a gateway or use Azure SignalR Service, which handles token negotiation and connection lifecycle, keeping my hub code focused on authorization logic rather than transport edge cases.'
        },
        {
            question: 'How do you make SignalR clients resilient to disconnections and server restarts?',
            difficulty: 'advanced',
            answer: `<p>Resilience is a shared responsibility across client and server:</p>
            <ul>
                <li><strong>Automatic reconnection</strong> — <code>withAutomaticReconnect</code> retries with a backoff schedule; handle <code>onreconnecting</code>/<code>onreconnected</code> to update UI and resync</li>
                <li><strong>State recovery</strong> — every reconnect yields a new <code>ConnectionId</code>, so re-join groups and re-fetch missed data in <code>OnConnectedAsync</code></li>
                <li><strong>Keep-alive & timeouts</strong> — tune <code>KeepAliveInterval</code> and <code>ClientTimeoutInterval</code> so dead connections are detected promptly</li>
                <li><strong>Message loss</strong> — SignalR does not guarantee delivery across reconnects; design an idempotent resync (sequence numbers, "fetch since" calls) rather than assuming every message arrived</li>
            </ul>`,
            explanation: 'Treat the connection like a flaky phone call: expect drops, redial automatically, and after reconnecting ask "what did I miss?" rather than assuming you heard everything.',
            code: `// Client (JavaScript) resilience:
// const connection = new signalR.HubConnectionBuilder()
//   .withUrl("/hubs/chat", { accessTokenFactory: () => getToken() })
//   .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
//   .build();
// connection.onreconnecting(err => showBanner("Reconnecting..."));
// connection.onreconnected(id => { showBanner("Connected"); resyncMissedMessages(); });
// connection.onclose(err => scheduleManualRestart());

// Server: rejoin groups + resync on (re)connect
public class ChatHub : Hub
{
    private readonly IMessageStore _store;
    public ChatHub(IMessageStore store) => _store = store;

    public override async Task OnConnectedAsync()
    {
        var rooms = await _store.GetRoomsForUserAsync(Context.UserIdentifier!);
        foreach (var room in rooms)
            await Groups.AddToGroupAsync(Context.ConnectionId, room);
        await base.OnConnectedAsync();
    }

    // Idempotent catch-up: client asks for anything after its last seen id
    public Task<IReadOnlyList<ChatMessage>> GetMessagesSince(string room, long lastSeenId)
        => _store.GetSinceAsync(room, lastSeenId);
}

builder.Services.AddSignalR(o =>
{
    o.KeepAliveInterval = TimeSpan.FromSeconds(15);
    o.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});`,
            language: 'csharp',
            bestPractices: [
                'Enable withAutomaticReconnect and surface connection state in the UI',
                'Re-join groups and resync state inside OnConnectedAsync on every reconnect',
                'Design an idempotent "fetch since last seen" resync instead of assuming reliable delivery',
                'Tune KeepAliveInterval/ClientTimeoutInterval together (keep-alive < timeout)'
            ],
            commonMistakes: [
                'Assuming the ConnectionId survives a reconnect (it does not)',
                'Relying on SignalR for guaranteed, ordered message delivery',
                'Not re-joining groups after reconnect (user silently stops receiving room messages)',
                'Setting ClientTimeoutInterval lower than KeepAliveInterval (false disconnects)'
            ],
            interviewTip: 'Show you treat real-time as best-effort: automatic reconnect handles transport, but YOU handle state resync. The "fetch since last seen id" pattern is the senior-level detail interviewers look for.',
            followUp: ['Why does ClientTimeoutInterval need to be larger than KeepAliveInterval?', 'How do you guarantee no missed messages across a reconnect?', 'What is the default automatic reconnect schedule?'],
            seniorPerspective: 'I never assume message delivery across reconnects. Every real-time stream is paired with a pull-based catch-up endpoint keyed by a monotonic sequence or timestamp, so a reconnected client converges to correct state regardless of what it missed.',
            architectPerspective: 'For mission-critical updates I combine SignalR (low-latency push) with a durable log (DB or event stream) as the source of truth. SignalR is an optimization for latency, not the system of record — the client can always rebuild state from the log after any outage.'
        },
        {
            question: 'How does server-to-client streaming with IAsyncEnumerable differ from regular hub method calls, and when is it appropriate?',
            difficulty: 'hard',
            answer: `<p>A regular hub method returns once with a single result (or void) and pushes discrete messages. <strong>Streaming</strong> returns an <code>IAsyncEnumerable&lt;T&gt;</code> (or <code>ChannelReader&lt;T&gt;</code>) that yields many items over time on a single logical invocation, with built-in backpressure via <code>StreamBufferCapacity</code> and cooperative cancellation through a <code>CancellationToken</code> that fires when the client stops enumerating or disconnects.</p>
            <ul>
                <li>Use streaming for continuous, ordered, per-caller data (progress feeds, live metrics for one client, large result sets delivered incrementally)</li>
                <li>Use broadcasts (<code>Clients.All/Group</code>) for fan-out to many clients</li>
                <li>Streaming gives natural flow control and cancellation; broadcasts do not</li>
            </ul>`,
            explanation: 'A normal call is handing someone a finished report. Streaming is a ticker tape that keeps printing until the reader walks away — and it slows down if the reader cannot keep up.',
            code: `public class MetricsHub : Hub
{
    public async IAsyncEnumerable<MetricSample> StreamMetrics(
        string deviceId,
        [EnumeratorCancellation] CancellationToken ct)
    {
        // ct is signaled when the client cancels the stream or disconnects
        while (!ct.IsCancellationRequested)
        {
            yield return await ReadSampleAsync(deviceId, ct);
            await Task.Delay(TimeSpan.FromSeconds(1), ct);
        }
    }
}

builder.Services.AddSignalR(o =>
{
    o.StreamBufferCapacity = 10;          // backpressure: buffered items per stream
    o.MaximumReceiveMessageSize = 64 * 1024;
});

// JS client:
// const stream = connection.stream("StreamMetrics", deviceId);
// stream.subscribe({ next: s => render(s), complete: () => {}, error: e => {} });
// To stop: subscription.dispose(); // triggers the CancellationToken server-side`,
            language: 'csharp',
            bestPractices: [
                'Always honor the [EnumeratorCancellation] token so streams stop when clients leave',
                'Use streaming for per-caller continuous data; use broadcasts for one-to-many fan-out',
                'Tune StreamBufferCapacity to balance memory against backpressure',
                'Pass the token into downstream awaits (Task.Delay, IO) for prompt cancellation'
            ],
            commonMistakes: [
                'Using streaming when a simple broadcast to a group is what is needed',
                'Ignoring the cancellation token (server keeps producing after the client disconnects)',
                'Producing items faster than the client consumes without considering buffer limits',
                'Doing one giant blocking query instead of yielding incrementally'
            ],
            interviewTip: 'Contrast lifetime and cardinality: a method call is one-shot; a stream is long-lived and per-caller with cancellation and backpressure. Mention that disposing the client subscription cancels the server token.',
            followUp: ['What is the difference between IAsyncEnumerable and ChannelReader for streaming?', 'How does StreamBufferCapacity provide backpressure?', 'How do you stream FROM the client TO the server?'],
            seniorPerspective: 'I reach for streaming when a single client needs a continuous, ordered feed (export progress, a live tail). For broadcasting the same data to many clients I never stream per-connection — I push to a group, which is far cheaper.',
            architectPerspective: 'Streaming binds a long-lived server resource to a connection, so I cap concurrent streams and enforce idle timeouts. For high-cardinality fan-out I prefer publishing to a group from a single background producer rather than opening one stream per client, which would multiply server-side work linearly with audience size.'
        },
        {
            question: 'How do you scale SignalR across multiple server instances using a Redis backplane, and what are the trade-offs?',
            difficulty: 'hard',
            answer: `<p>SignalR stores connection-to-group mappings <strong>in memory per server instance</strong>. Without a backplane, a message sent from Server A only reaches clients connected to Server A. A <strong>Redis backplane</strong> solves this by publishing all SignalR messages to Redis Pub/Sub channels, so every instance receives every message and can deliver it to its local connections.</p>
            <p>Trade-offs:</p>
            <ul>
                <li><strong>Latency</strong> \u2014 every message takes a round-trip through Redis (~1-2ms LAN), adding latency compared to in-process delivery</li>
                <li><strong>Bandwidth</strong> \u2014 every server receives every message (fan-out), even if none of its local clients are in the target group. High-traffic groups multiply network usage by server count.</li>
                <li><strong>Redis becomes a SPOF</strong> \u2014 if Redis goes down, cross-instance messaging fails. Requires Redis Sentinel or Cluster for HA.</li>
                <li><strong>Message ordering</strong> \u2014 Redis Pub/Sub is fire-and-forget; messages can be lost if a subscriber disconnects momentarily</li>
                <li><strong>Cost</strong> \u2014 at very high scale, the backplane can become a bottleneck; Azure SignalR Service offloads this entirely</li>
            </ul>`,
            explanation: 'Without a backplane, each server is a separate megaphone at a stadium \u2014 only people near that megaphone hear it. Redis is a central PA system that rebroadcasts every megaphone to every speaker. It works but the PA system becomes a bottleneck if too many announcements happen.',
            code: `// Configure Redis backplane:
builder.Services.AddSignalR()
    .AddStackExchangeRedis("localhost:6379", options =>
    {
        options.Configuration.ChannelPrefix = "MyApp"; // isolate in shared Redis
    });

// How it works internally:
// 1. Client on Server A calls hub method
// 2. Hub calls Clients.Group("room1").SendAsync("msg", data)
// 3. SignalR serializes and publishes to Redis channel: "MyApp:room1"
// 4. ALL server instances subscribe to "MyApp:room1"
// 5. Each instance delivers to its local connections in "room1"

// For high scale, consider Azure SignalR Service (managed backplane):
builder.Services.AddSignalR()
    .AddAzureSignalR("Endpoint=https://myapp.service.signalr.net;...");
// Benefits: no Redis to manage, handles millions of connections,
// messages route directly to the correct instance (no fan-out waste)

// Sticky sessions (alternative to backplane for some transports):
// Long-polling and SSE require the client always hits the same instance.
// WebSockets maintain a persistent connection so load-balancer affinity
// is only needed during the initial handshake/negotiate.
// Configure ARR affinity or cookie-based sticky sessions on the LB.

// Monitoring backplane health:
builder.Services.AddSignalR()
    .AddStackExchangeRedis(redisConn, options =>
    {
        options.Configuration.AbortOnConnectFail = false; // resilient startup
    });
// Monitor Redis Pub/Sub lag with redis-cli PUBSUB NUMSUB`,
            language: 'csharp',
            bestPractices: [
                'Use Azure SignalR Service for production workloads above a few thousand connections',
                'Set a ChannelPrefix to isolate your app in shared Redis instances',
                'Enable Redis Sentinel or Cluster for backplane high availability',
                'Monitor Redis Pub/Sub subscriber counts and memory to detect backplane issues',
                'Use sticky sessions for long-polling/SSE transports behind a load balancer'
            ],
            commonMistakes: [
                'Deploying multiple instances without a backplane (messages only reach one server)',
                'Assuming Redis Pub/Sub guarantees delivery (it is fire-and-forget)',
                'Not setting AbortOnConnectFail=false (app crashes if Redis is briefly unavailable at startup)',
                'Using the backplane for very high-frequency updates without considering bandwidth multiplication'
            ],
            interviewTip: 'Explain WHY the backplane is needed (in-memory connection state is per-instance), how it works (Redis Pub/Sub fan-out), and its limits (every server gets every message). Then mention Azure SignalR Service as the managed alternative that eliminates these trade-offs.',
            followUp: ['How does Azure SignalR Service differ architecturally from a Redis backplane?', 'What happens to connected clients if Redis goes down momentarily?', 'How do sticky sessions interact with the negotiate endpoint?']
        },
        {
            question: 'How do you handle client reconnection and state recovery in SignalR when connections drop?',
            difficulty: 'hard',
            answer: `<p>SignalR has built-in <strong>automatic reconnection</strong> (client-side), but it does NOT replay missed messages. When a connection drops and reconnects, any messages sent during the disconnect window are <strong>lost</strong> unless you implement state recovery yourself.</p>
            <p>Recovery strategies:</p>
            <ul>
                <li><strong>Client-side reconnection with state sync</strong> \u2014 on reconnect, client requests the current state (or changes since a timestamp/sequence number) from the server</li>
                <li><strong>Server-side message buffer</strong> \u2014 buffer recent messages per group; on reconnect, replay buffered messages the client missed</li>
                <li><strong>Event sourcing / sequence numbers</strong> \u2014 each message has a sequence ID; client tracks last received ID and requests gap-fill on reconnect</li>
                <li><strong>Stateful reconnect (.NET 8+)</strong> \u2014 new feature that buffers messages during brief disconnects and replays them automatically</li>
            </ul>
            <p>The OnReconnected hub event fires after successful reconnection \u2014 use it to re-add the client to groups and trigger state synchronization.</p>`,
            explanation: 'SignalR reconnection is like your phone reconnecting to a conference call after dropping. You are back in the room, but you missed whatever was said while you were gone. State recovery is asking "what did I miss?" when you rejoin.',
            code: `// CLIENT-SIDE: Configure automatic reconnection with retry policy
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/gamehub")
    .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (context) => {
            // Exponential backoff: 0s, 2s, 4s, 8s, 16s, then stop
            if (context.previousRetryCount < 5)
                return Math.pow(2, context.previousRetryCount) * 1000;
            return null; // stop trying
        }
    })
    .build();

// On reconnect, request missed state:
connection.onreconnected(async (connectionId) => {
    console.log('Reconnected with id:', connectionId);
    // Request state since last known sequence number
    await connection.invoke("SyncState", lastSequenceNumber);
});

connection.onclose((error) => {
    // Permanent disconnect - show UI indicator, attempt full reconnect
    showReconnectingUI();
});

// SERVER-SIDE: Hub handles reconnection and state recovery
public class GameHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GetUserGroup());
        await base.OnConnectedAsync();
    }

    // Client calls this after reconnection to get missed updates
    public async Task SyncState(long lastSequenceNumber)
    {
        var missedEvents = await _eventStore
            .GetEventsSinceAsync(GetUserGroup(), lastSequenceNumber);
        foreach (var evt in missedEvents)
        {
            await Clients.Caller.SendAsync("GameEvent", evt);
        }
    }
}

// .NET 8 Stateful Reconnect (automatic message buffering):
builder.Services.AddSignalR(options =>
{
    options.StatefulReconnectBufferSize = 100_000; // bytes to buffer per connection
});
// Client opt-in:
// .withStatefulReconnect() in HubConnectionBuilder
// Automatically replays buffered messages on reconnect (brief disconnects only)`,
            language: 'csharp',
            bestPractices: [
                'Always configure withAutomaticReconnect with exponential backoff on clients',
                'Implement sequence numbers so clients can request exactly what they missed',
                'Use .NET 8 Stateful Reconnect for brief disconnects (automatic buffer replay)',
                'Re-add users to groups in OnConnectedAsync (groups are connection-scoped)',
                'Show a UI indicator during reconnection to set user expectations'
            ],
            commonMistakes: [
                'Assuming SignalR replays missed messages automatically (it does not, pre-.NET 8)',
                'Not re-adding users to groups after reconnection (groups are tied to connection ID)',
                'Using infinite retry without backoff (hammers the server during outages)',
                'Ignoring the onclose event (user sees a frozen UI with no indication of disconnect)'
            ],
            interviewTip: 'Distinguish between transport-level reconnection (automatic, handled by the client) and application-level state recovery (your responsibility). Mention .NET 8 Stateful Reconnect as the new middle ground for short disconnects.',
            followUp: ['What is the difference between onreconnecting, onreconnected, and onclose?', 'How does .NET 8 Stateful Reconnect buffer work internally?', 'How do you handle group membership after reconnection?']
        },
        {
            question: 'How do you scale SignalR with a Redis backplane? Explain why it is needed, how pub/sub fan-out works, the bandwidth multiplication trade-off, and when to use Azure SignalR Service instead.',
            difficulty: 'hard',
            answer: `<p>When SignalR runs on multiple server instances behind a load balancer, a client connected to Server A cannot receive messages sent from Server B â€” each server only knows about its own connections. A <strong>Redis backplane</strong> solves this by using Redis Pub/Sub as a message bus: when any server sends a message to a group or user, it publishes to Redis, and all servers subscribe to receive and forward to their local connections.</p>
            <p>The bandwidth multiplication trade-off: every message sent through the backplane is received by ALL servers, even those with zero interested clients. With N servers, a single message becomes N Redis deliveries + local fan-out. At high message rates, this creates O(messages x servers) Redis traffic. This is acceptable for moderate scale (10-50 servers) but becomes a bottleneck at hyperscale.</p>
            <p>Use <strong>Azure SignalR Service</strong> when: you need 100K+ concurrent connections (offloads connection management), you want zero infrastructure management, you need auto-scaling without sticky sessions, or when Redis backplane bandwidth becomes the bottleneck. Azure SignalR handles the fan-out at the service layer, eliminating per-server duplication.</p>`,
            explanation: 'A Redis backplane is like a conference call system â€” when someone in Room A talks, the system broadcasts to all rooms. Every room hears the message even if nobody in that room cares. Azure SignalR Service is like hiring a professional operator who routes calls only to interested rooms.',
            code: `// Adding Redis backplane:
builder.Services.AddSignalR()
    .AddStackExchangeRedis(redisConnectionString, options =>
    {
        options.Configuration.ChannelPrefix = 
            RedisChannel.Literal("MyApp"); // Namespace isolation
    });

// How it works internally:
// 1. Client calls hub method on Server A
// 2. Server A publishes message to Redis channel
// 3. ALL servers receive the Redis pub/sub message
// 4. Each server checks local connections and delivers
// 5. Servers with no interested clients discard the message

// The bandwidth multiplication problem:
// 10 servers, 1000 messages/sec = 10,000 Redis deliveries/sec
// Most are "wasted" on servers with no interested clients

// Azure SignalR Service alternative (managed, scalable):
builder.Services.AddSignalR()
    .AddAzureSignalR(connectionString);
// Benefits:
// - Connections managed by Azure (not your servers)
// - Only interested connections receive messages (no waste)
// - Auto-scales to millions of connections
// - Your servers only handle hub method logic, not connection state

// Hybrid: Azure SignalR for production, Redis for dev/staging
if (builder.Environment.IsProduction())
    builder.Services.AddSignalR().AddAzureSignalR(connectionString);
else
    builder.Services.AddSignalR().AddStackExchangeRedis(redisDevConnection);`,
            language: 'csharp',
            bestPractices: [
                'Use Redis backplane for moderate scale (2-50 servers, <100K connections)',
                'Set ChannelPrefix to isolate multiple apps sharing the same Redis instance',
                'Switch to Azure SignalR Service when connection count or bandwidth exceeds Redis limits',
                'Monitor Redis memory and network bandwidth as scaling signals',
                'Use MessagePack protocol to reduce serialization size on the backplane'
            ],
            commonMistakes: [
                'Assuming Redis backplane eliminates the need for sticky sessions (it does for groups, not connection state)',
                'Not accounting for bandwidth multiplication in capacity planning',
                'Using a single Redis instance for both caching and SignalR backplane (contention)',
                'Forgetting to configure ChannelPrefix when multiple apps share Redis'
            ],
            interviewTip: 'Explain the WHY (multi-server fan-out problem), the HOW (Redis pub/sub broadcasts to all subscribers), the COST (bandwidth multiplication), and the UPGRADE PATH (Azure SignalR for hyperscale). This shows end-to-end architectural thinking.',
            followUp: ['How does sticky sessions interact with the Redis backplane?', 'What is the difference between Redis Pub/Sub and Redis Streams for SignalR?', 'How do you monitor backplane health and latency?']
        },
        {
            question: 'How do you handle SignalR reconnection and state recovery? Explain withAutomaticReconnect, re-joining groups, sequence-number-based catch-up, and .NET 8 stateful reconnect.',
            difficulty: 'hard',
            answer: `<p><strong>withAutomaticReconnect</strong> configures the client to automatically attempt reconnection with configurable retry intervals (default: 0, 2, 10, 30 seconds). During reconnection, the client fires onreconnecting (UI should show indicator), then onreconnected (rejoin groups, refresh state) or onclose (permanent failure). The connection gets a NEW connection ID on reconnect.</p>
            <p><strong>Re-joining groups</strong>: SignalR groups are connection-scoped â€” when a connection drops, the server removes it from all groups. On reconnection (new connection ID), the client must explicitly re-join by calling a hub method. Implement this in the onreconnected handler or in OnConnectedAsync on the server side using user identity to restore group memberships.</p>
            <p><strong>Sequence-number catch-up</strong>: Since standard SignalR does NOT replay missed messages, implement application-level recovery: track the last received sequence number client-side, and on reconnection send it to the server. The server replays all messages with sequence > lastReceived from a durable store (database, event log). This guarantees exactly-once delivery at the application level.</p>
            <p><strong>.NET 8 Stateful Reconnect</strong>: A new feature that buffers recent messages on both client and server. During brief disconnects (<30 seconds by default), the same connection ID is preserved, groups are maintained, and buffered messages are automatically replayed. No application code needed for short outages.</p>`,
            explanation: 'Standard reconnection is like hanging up and calling back â€” you get a new phone number (connection ID) and must re-join all group chats. Stateful reconnect is like putting the call on hold â€” same line, same groups, conversation resumes where it left off.',
            code: `// Client-side: configure automatic reconnect with backoff
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/notifications")
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // ms
    .withStatefulReconnect() // .NET 8+ â€” buffer replay
    .build();

// Handle reconnection states:
connection.onreconnecting(error => {
    showBanner("Reconnecting...");  // UI indicator
});

connection.onreconnected(connectionId => {
    hideBanner();
    // Re-join groups and request missed messages:
    connection.invoke("RejoinGroups", currentGroups);
    connection.invoke("CatchUp", lastSequenceNumber);
});

connection.onclose(error => {
    showBanner("Disconnected. Please refresh.");
});

// Server-side: re-join groups on reconnection
public override async Task OnConnectedAsync()
{
    var userId = Context.UserIdentifier;
    var groups = await _groupStore.GetUserGroupsAsync(userId);
    foreach (var group in groups)
        await Groups.AddToGroupAsync(Context.ConnectionId, group);
    await base.OnConnectedAsync();
}

// Sequence-number catch-up pattern:
public async Task CatchUp(long lastSequenceNumber)
{
    var missed = await _eventStore
        .GetEventsAfterAsync(lastSequenceNumber);
    foreach (var evt in missed)
        await Clients.Caller.SendAsync("ReceiveMessage", evt);
}

// .NET 8 Stateful Reconnect server config:
builder.Services.AddSignalR(options =>
{
    options.StatefulReconnectBufferSize = 100_000; // bytes per connection
});`,
            language: 'csharp',
            bestPractices: [
                'Always configure withAutomaticReconnect with exponential backoff on clients',
                'Implement sequence numbers so clients can request exactly what they missed',
                'Use .NET 8 Stateful Reconnect for brief disconnects (automatic buffer replay)',
                'Re-add users to groups in OnConnectedAsync (groups are connection-scoped)',
                'Show a UI indicator during reconnection to set user expectations'
            ],
            commonMistakes: [
                'Assuming SignalR replays missed messages automatically (it does not, pre-.NET 8)',
                'Not re-adding users to groups after reconnection (groups are tied to connection ID)',
                'Using infinite retry without backoff (hammers the server during outages)',
                'Ignoring the onclose event (user sees a frozen UI with no indication of disconnect)'
            ],
            interviewTip: 'Distinguish transport-level reconnection (automatic, new connection ID) from application-level state recovery (your responsibility). Mention .NET 8 Stateful Reconnect as the new middle ground and explain that it only helps for BRIEF disconnects â€” long outages still need sequence-number catch-up.',
            followUp: ['What is the difference between onreconnecting, onreconnected, and onclose?', 'How does .NET 8 Stateful Reconnect buffer work internally?', 'How do you handle group membership after reconnection at scale?']
        }
    ]
});
