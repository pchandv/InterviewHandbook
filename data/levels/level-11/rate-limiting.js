PageData.register('rate-limiting', {
    title: 'Rate Limiting & Throttling',
    description: 'API rate limiting algorithms, distributed throttling strategies, and .NET 7 implementation patterns for protecting services from overload',
    sections: [
        {
            title: 'Introduction',
            content: `<p>Rate limiting is a critical defensive mechanism that controls how many requests a client can make to an API within a given time window. It protects backend services from being overwhelmed by excessive traffic — whether from legitimate bursts, misbehaving clients, or malicious denial-of-service attacks.</p>
<p>Without rate limiting, a single client can monopolize server resources, degrade performance for all users, and potentially bring down entire services. Modern distributed systems implement rate limiting at multiple layers: API gateways, load balancers, application middleware, and even database connections.</p>
<p>In this topic, we cover the fundamental algorithms (Token Bucket, Sliding Window, Fixed Window, Leaky Bucket), their tradeoffs, .NET 7's built-in rate limiting middleware, distributed implementations with Redis, and best practices for production deployments.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>Rate limiting revolves around several key concepts that every engineer must understand:</p>
<ul>
<li><strong>Rate</strong> — The number of allowed requests per time unit (e.g., 100 requests/minute)</li>
<li><strong>Window</strong> — The time period over which requests are counted (fixed or sliding)</li>
<li><strong>Burst</strong> — The maximum number of requests allowed in a short spike before throttling kicks in</li>
<li><strong>Throttling</strong> — Slowing down or queuing requests rather than outright rejecting them</li>
<li><strong>Quota</strong> — A longer-term limit (e.g., 10,000 requests/day) distinct from short-term rate limits</li>
<li><strong>Backpressure</strong> — Signaling upstream that the system is under load so callers can slow down</li>
</ul>
<p>Rate limits are typically applied per identity dimension:</p>
<ul>
<li><strong>Per-IP</strong> — Simplest, but problematic behind NAT/proxies where many users share one IP</li>
<li><strong>Per-API-Key</strong> — Identifies the application making calls; good for B2B APIs</li>
<li><strong>Per-User</strong> — Authenticated user identity; fairest for consumer-facing APIs</li>
<li><strong>Per-Endpoint</strong> — Different limits for different operations (reads vs writes)</li>
<li><strong>Global</strong> — Total system capacity protection regardless of caller identity</li>
</ul>
<p>The HTTP standard response for rate limiting is <code>429 Too Many Requests</code>, accompanied by headers that communicate the limit state to clients:</p>
<ul>
<li><code>X-RateLimit-Limit</code> — Maximum requests allowed in the window</li>
<li><code>X-RateLimit-Remaining</code> — Requests remaining in current window</li>
<li><code>X-RateLimit-Reset</code> — Unix timestamp when the window resets</li>
<li><code>Retry-After</code> — Seconds to wait before retrying (RFC 7231)</li>
</ul>`
        },
        {
            title: 'How It Works',
            content: `<p>When a request arrives, the rate limiter checks whether the caller has exceeded their allowed quota. The decision flow involves identifying the client, looking up their current usage counter, and either allowing the request through or rejecting it with a 429 response.</p>
<p>The specific mechanics depend on the algorithm chosen, but the general flow is consistent across implementations:</p>
<ol>
<li>Extract the client identity (IP, API key, user ID, or composite key)</li>
<li>Look up the current state for that identity in the rate limit store</li>
<li>Apply the algorithm logic to determine if the request is within limits</li>
<li>If allowed: update the counter/tokens, forward the request, set response headers</li>
<li>If denied: return 429 with Retry-After header, log the rejection</li>
</ol>`,
            mermaid: `sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant RL as Rate Limiter
    participant S as Store (Redis/Memory)
    participant API as Backend API

    C->>GW: HTTP Request + API Key
    GW->>RL: Check Rate Limit
    RL->>S: Get current counter for key
    S-->>RL: Counter = 95, Limit = 100
    RL-->>GW: ALLOWED (5 remaining)
    GW->>API: Forward Request
    API-->>GW: 200 OK + Response
    GW-->>C: 200 OK + X-RateLimit-Remaining: 4

    Note over C,API: After limit exceeded...

    C->>GW: HTTP Request + API Key
    GW->>RL: Check Rate Limit
    RL->>S: Get current counter for key
    S-->>RL: Counter = 100, Limit = 100
    RL-->>GW: DENIED
    GW-->>C: 429 Too Many Requests + Retry-After: 30`
        },
        {
            title: 'Visual Diagram',
            content: `<p>Each rate limiting algorithm has different characteristics for handling bursty traffic, memory usage, and accuracy. The diagram below compares how four major algorithms process requests over time:</p>
<ul>
<li><strong>Token Bucket</strong> — Tokens refill at a steady rate; requests consume tokens. Allows bursts up to bucket capacity.</li>
<li><strong>Leaky Bucket</strong> — Requests queue up and drain at a fixed rate, smoothing traffic spikes.</li>
<li><strong>Fixed Window</strong> — Simple counter per time window. Vulnerable to boundary bursts (2x limit at window edges).</li>
<li><strong>Sliding Window</strong> — Weighted combination of current and previous window, or exact log of timestamps. Most accurate but more memory/compute.</li>
</ul>`,
            mermaid: `graph TD
    subgraph TokenBucket["Token Bucket Algorithm"]
        TB1[Bucket Capacity: 10 tokens] --> TB2[Refill Rate: 2 tokens/sec]
        TB2 --> TB3{Request arrives}
        TB3 -->|Tokens > 0| TB4[Remove 1 token, ALLOW]
        TB3 -->|Tokens = 0| TB5[REJECT 429]
        TB4 --> TB6[Allows bursts up to capacity]
    end

    subgraph LeakyBucket["Leaky Bucket Algorithm"]
        LB1[Queue with fixed capacity] --> LB2[Drain Rate: constant]
        LB2 --> LB3{Request arrives}
        LB3 -->|Queue not full| LB4[Add to queue, process at drain rate]
        LB3 -->|Queue full| LB5[REJECT 429]
        LB4 --> LB6[Smooths output rate]
    end

    subgraph FixedWindow["Fixed Window Counter"]
        FW1[Window: 60 seconds] --> FW2[Counter resets each window]
        FW2 --> FW3{Request arrives}
        FW3 -->|Counter < Limit| FW4[Increment counter, ALLOW]
        FW3 -->|Counter >= Limit| FW5[REJECT 429]
        FW4 --> FW6[Boundary burst problem: 2x at edges]
    end

    subgraph SlidingWindow["Sliding Window Log/Counter"]
        SW1[Tracks exact timestamps or weighted count] --> SW2[Window slides with time]
        SW2 --> SW3{Request arrives}
        SW3 -->|Within limit| SW4[Record timestamp, ALLOW]
        SW3 -->|Exceeds limit| SW5[REJECT 429]
        SW4 --> SW6[Most accurate, higher memory cost]
    end`
        },
        {
            title: 'Implementation',
            content: `<p>.NET 7 introduced built-in rate limiting middleware in the <code>Microsoft.AspNetCore.RateLimiting</code> namespace. It supports four algorithms out of the box: Fixed Window, Sliding Window, Token Bucket, and Concurrency Limiter. Below is a comprehensive implementation showing all four configured together with per-user partitioning:</p>`,
            language: 'csharp',
            code: `// Program.cs - .NET 7 Rate Limiting Middleware Configuration
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add rate limiting services
builder.Services.AddRateLimiter(options =>
{
    // Global rejection status code
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Handle rejected requests with custom response
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.Headers["Retry-After"] = "30";
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = "rate_limit_exceeded",
            message = "Too many requests. Please retry after the Retry-After period.",
            retryAfter = 30
        }, cancellationToken);
    };

    // 1. Fixed Window Limiter - simple counter per time window
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.PermitLimit = 100;           // 100 requests
        opt.Window = TimeSpan.FromMinutes(1); // per 1 minute
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 10;             // Queue up to 10 excess requests
    });

    // 2. Sliding Window Limiter - smoother than fixed window
    options.AddSlidingWindowLimiter("sliding", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.SegmentsPerWindow = 6;       // 6 segments of 10 seconds each
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 5;
    });

    // 3. Token Bucket Limiter - allows bursts, steady refill
    options.AddTokenBucketLimiter("token", opt =>
    {
        opt.TokenLimit = 20;             // Bucket capacity (max burst)
        opt.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
        opt.TokensPerPeriod = 5;         // Refill 5 tokens every 10s
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 5;
        opt.AutoReplenishment = true;
    });

    // 4. Concurrency Limiter - limits simultaneous requests
    options.AddConcurrencyLimiter("concurrent", opt =>
    {
        opt.PermitLimit = 10;            // Max 10 concurrent requests
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 20;
    });

    // 5. Per-user partitioned policy
    options.AddPolicy("per-user", httpContext =>
    {
        var userId = httpContext.User?.Identity?.Name ?? "anonymous";
        return RateLimitPartition.GetTokenBucketLimiter(userId, _ =>
            new TokenBucketRateLimiterOptions
            {
                TokenLimit = 50,
                ReplenishmentPeriod = TimeSpan.FromMinutes(1),
                TokensPerPeriod = 10,
                AutoReplenishment = true
            });
    });

    // 6. Per-IP partitioned policy
    options.AddPolicy("per-ip", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ =>
            new FixedWindowRateLimiterOptions
            {
                PermitLimit = 60,
                Window = TimeSpan.FromMinutes(1)
            });
    });
});

var app = builder.Build();

// Add rate limiting middleware (order matters - before routing)
app.UseRateLimiter();

// Apply policies to endpoints
app.MapGet("/api/public", () => "Public data")
    .RequireRateLimiting("per-ip");

app.MapGet("/api/user/data", () => "User data")
    .RequireRateLimiting("per-user");

app.MapPost("/api/orders", () => "Order created")
    .RequireRateLimiting("token");

app.MapGet("/api/reports", () => "Heavy report")
    .RequireRateLimiting("concurrent");

app.Run();`
        }
    ],
    questions: [
        {
            id: 'rl-q1',
            level: 'junior',
            title: 'What is rate limiting and why is it needed in web APIs?',
            answer: `<p>Rate limiting is a technique that controls how many requests a client can make to an API within a specified time period. When the limit is exceeded, the server rejects additional requests — typically with an HTTP 429 status code — until the window resets or tokens replenish.</p>
<p><strong>Why it's needed:</strong></p>
<ul>
<li><strong>Prevents abuse</strong> — Stops a single client from overwhelming the server with excessive requests (intentional DDoS or accidental infinite loops)</li>
<li><strong>Ensures fairness</strong> — No single user can monopolize shared resources at the expense of others</li>
<li><strong>Protects availability</strong> — Keeps the service responsive under heavy load by shedding excess traffic early</li>
<li><strong>Controls costs</strong> — Limits downstream resource usage (database queries, third-party API calls, compute)</li>
<li><strong>Enforces SLAs</strong> — API providers can tier access (free tier: 100 req/min, paid tier: 10,000 req/min)</li>
</ul>
<p>Without rate limiting, a bug in a single client's retry logic could cascade into a full service outage affecting all users.</p>`
        },
        {
            id: 'rl-q2',
            level: 'junior',
            title: 'What is HTTP status code 429 and what headers typically accompany it?',
            answer: `<p><code>429 Too Many Requests</code> is the HTTP status code defined in RFC 6585 that indicates a client has sent too many requests in a given time period. It is the standard response when rate limiting is enforced.</p>
<p><strong>Key headers that accompany a 429 response:</strong></p>
<ul>
<li><code>Retry-After</code> — (RFC 7231) Tells the client how many seconds to wait before retrying. This is the only standardized header.</li>
<li><code>X-RateLimit-Limit</code> — The maximum number of requests allowed in the current window</li>
<li><code>X-RateLimit-Remaining</code> — How many requests the client has left in the current window</li>
<li><code>X-RateLimit-Reset</code> — Unix timestamp (or seconds) until the rate limit window resets</li>
</ul>
<p><strong>Client best practices when receiving a 429:</strong></p>
<ul>
<li>Respect the <code>Retry-After</code> header — don't retry immediately</li>
<li>Implement exponential backoff with jitter to avoid thundering herd</li>
<li>Monitor <code>X-RateLimit-Remaining</code> proactively to slow down before hitting the limit</li>
<li>Never retry indefinitely — set a max retry count</li>
</ul>`
        },
        {
            id: 'rl-q3',
            level: 'mid',
            title: 'Compare the Token Bucket and Sliding Window rate limiting algorithms. When would you choose one over the other?',
            answer: `<p>Both are popular rate limiting algorithms but they have fundamentally different approaches to controlling traffic:</p>
<table>
<tr><th>Aspect</th><th>Token Bucket</th><th>Sliding Window</th></tr>
<tr><td>Mechanism</td><td>Tokens refill at a steady rate; each request consumes one token</td><td>Counts requests within a continuously moving time window</td></tr>
<tr><td>Burst handling</td><td>Allows bursts up to bucket capacity, then rate-limits</td><td>No bursts beyond the configured limit at any point in time</td></tr>
<tr><td>Memory</td><td>O(1) — just stores token count and last refill time</td><td>O(n) for log-based, O(1) for counter-based approximation</td></tr>
<tr><td>Accuracy</td><td>May allow temporary over-limit during burst</td><td>More precise — no boundary-burst problem like fixed window</td></tr>
<tr><td>Implementation complexity</td><td>Simple — just math on token count</td><td>Moderate — needs segment tracking or timestamp log</td></tr>
</table>
<p><strong>Choose Token Bucket when:</strong></p>
<ul>
<li>You want to allow legitimate traffic bursts (e.g., page loads that fire multiple API calls)</li>
<li>You need simple, memory-efficient implementation</li>
<li>The use case is more about steady-state throughput with occasional spikes</li>
</ul>
<p><strong>Choose Sliding Window when:</strong></p>
<ul>
<li>You need strict, accurate enforcement with no boundary exploits</li>
<li>Fairness is critical — no user should get 2x the limit at window boundaries</li>
<li>You're building billing/quota systems where precise counting matters</li>
</ul>`
        },
        {
            id: 'rl-q4',
            level: 'mid',
            title: 'How do you implement rate limiting in .NET 7 using the built-in middleware? Walk through the configuration.',
            answer: `<p>.NET 7 introduced <code>Microsoft.AspNetCore.RateLimiting</code> with built-in support for four algorithms. Here's the implementation approach:</p>
<p><strong>1. Add the NuGet package</strong> (included in ASP.NET Core 7+):</p>
<pre><code>builder.Services.AddRateLimiter(options => { ... });</code></pre>
<p><strong>2. Configure a limiter policy:</strong></p>
<pre><code>options.AddTokenBucketLimiter("api-policy", opt =>
{
    opt.TokenLimit = 100;
    opt.ReplenishmentPeriod = TimeSpan.FromMinutes(1);
    opt.TokensPerPeriod = 100;
    opt.AutoReplenishment = true;
});</code></pre>
<p><strong>3. Add partitioned policies for per-user limits:</strong></p>
<pre><code>options.AddPolicy("per-user", context =>
    RateLimitPartition.GetTokenBucketLimiter(
        context.User.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString(),
        _ => new TokenBucketRateLimiterOptions { ... }));</code></pre>
<p><strong>4. Register middleware and apply to endpoints:</strong></p>
<pre><code>app.UseRateLimiter();
app.MapGet("/api/data", handler).RequireRateLimiting("per-user");</code></pre>
<p><strong>5. Handle rejections with custom response:</strong></p>
<pre><code>options.OnRejected = async (context, ct) =>
{
    context.HttpContext.Response.StatusCode = 429;
    context.HttpContext.Response.Headers["Retry-After"] = "60";
    await context.HttpContext.Response.WriteAsJsonAsync(
        new { error = "rate_limit_exceeded" }, ct);
};</code></pre>
<p><strong>Key considerations:</strong> The middleware must be added before routing. You can apply different policies to different endpoint groups. The built-in implementation is in-memory only — for distributed scenarios, you need Redis or a custom <code>IRateLimiterPolicy</code>.</p>`
        },
        {
            id: 'rl-q5',
            level: 'mid',
            title: 'What are rate limit response headers and why are they important for API consumers?',
            answer: `<p>Rate limit headers are metadata included in HTTP responses that communicate the current state of a client's rate limit quota. They allow clients to self-regulate their request patterns proactively rather than blindly hitting limits.</p>
<p><strong>Standard and common headers:</strong></p>
<ul>
<li><code>Retry-After: 30</code> — (RFC 7231, only standard one) Seconds to wait after a 429. Can also be an HTTP-date.</li>
<li><code>X-RateLimit-Limit: 1000</code> — Maximum requests allowed in the current window</li>
<li><code>X-RateLimit-Remaining: 742</code> — Requests remaining before throttling</li>
<li><code>X-RateLimit-Reset: 1672531200</code> — Unix epoch when the window resets</li>
<li><code>RateLimit-Policy: 1000;w=3600</code> — (IETF draft RFC 9110) Describes the policy in a structured format</li>
</ul>
<p><strong>Why they matter:</strong></p>
<ul>
<li><strong>Client-side throttling</strong> — Clients can slow down when <code>Remaining</code> is low, avoiding 429s entirely</li>
<li><strong>Retry logic</strong> — <code>Retry-After</code> prevents thundering herd by telling each client exactly when to retry</li>
<li><strong>Monitoring</strong> — Clients can alert when they're consistently near their limit, indicating they need a higher tier</li>
<li><strong>Debugging</strong> — When requests fail, headers explain WHY — is it per-user, per-IP, or global?</li>
</ul>
<p><strong>Best practice:</strong> Always include these headers on EVERY response (not just 429s) so clients can monitor their consumption in real time. Include them on 200 responses too.</p>`
        },
        {
            id: 'rl-q6',
            level: 'senior',
            title: 'How would you implement distributed rate limiting with Redis? What are the consistency challenges?',
            answer: `<p>Distributed rate limiting is necessary when your API runs on multiple servers behind a load balancer. In-memory counters per server would allow N × limit total requests across N servers. Redis provides a shared, atomic counter store.</p>
<p><strong>Redis implementation approaches:</strong></p>
<p><strong>1. Simple counter with EXPIRE (Fixed Window):</strong></p>
<pre><code>-- Lua script for atomic increment + TTL
local count = redis.call('INCR', KEYS[1])
if count == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count</code></pre>
<p><strong>2. Token Bucket with Redis:</strong></p>
<pre><code>-- Lua script: calculate tokens based on elapsed time
local bucket = redis.call('HMGET', KEYS[1], 'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or TOKEN_LIMIT
local last = tonumber(bucket[2]) or NOW
local elapsed = NOW - last
local refill = math.floor(elapsed * REFILL_RATE)
tokens = math.min(tokens + refill, TOKEN_LIMIT)
if tokens > 0 then
    redis.call('HMSET', KEYS[1], 'tokens', tokens - 1, 'last_refill', NOW)
    return 1  -- ALLOWED
end
return 0  -- DENIED</code></pre>
<p><strong>3. Sliding Window with sorted sets:</strong></p>
<pre><code>-- Remove expired entries, count remaining, add new
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, NOW - WINDOW)
local count = redis.call('ZCARD', KEYS[1])
if count < LIMIT then
    redis.call('ZADD', KEYS[1], NOW, REQUEST_ID)
    redis.call('EXPIRE', KEYS[1], WINDOW)
    return 1
end
return 0</code></pre>
<p><strong>Consistency challenges:</strong></p>
<ul>
<li><strong>Race conditions</strong> — Must use Lua scripts or MULTI/EXEC for atomicity; plain GET+SET has TOCTOU bugs</li>
<li><strong>Network latency</strong> — Redis round-trip adds 1-5ms per request; can become a bottleneck under extreme load</li>
<li><strong>Redis failures</strong> — Need a fallback strategy: fail-open (allow all) vs fail-closed (deny all) vs local in-memory fallback</li>
<li><strong>Clock drift</strong> — If app servers have clock skew, timestamp-based windows may be inaccurate. Use Redis server time (TIME command) instead of client time.</li>
<li><strong>Memory growth</strong> — Sliding window logs grow linearly with traffic; need TTL on all keys</li>
</ul>`
        },
        {
            id: 'rl-q7',
            level: 'senior',
            title: 'Compare per-user vs per-IP rate limiting strategies. What are the edge cases and when do you combine them?',
            answer: `<p>The choice of rate limit key directly impacts fairness, security, and user experience. Both per-user and per-IP have significant edge cases that make a combined strategy necessary in production.</p>
<p><strong>Per-IP Rate Limiting:</strong></p>
<ul>
<li><strong>Pros:</strong> Works without authentication, catches anonymous abuse, simple to implement</li>
<li><strong>Cons:</strong> NAT/corporate proxies — thousands of users may share one IP (10.x.x.x or a corporate egress). IPv6 makes IP-based limiting complex (/64 blocks vs individual addresses).</li>
<li><strong>Edge cases:</strong> Shared WiFi (airports, universities), mobile carrier-grade NAT, VPN exit nodes, Cloudflare/CDN masking real IPs (need X-Forwarded-For parsing)</li>
</ul>
<p><strong>Per-User Rate Limiting:</strong></p>
<ul>
<li><strong>Pros:</strong> Fairest — each authenticated identity gets their own quota regardless of IP</li>
<li><strong>Cons:</strong> Requires authentication (can't protect login/signup endpoints this way), account farming to bypass limits</li>
<li><strong>Edge cases:</strong> Service accounts with many callers, shared team API keys, bot accounts created in bulk</li>
</ul>
<p><strong>Combined strategy (recommended):</strong></p>
<pre><code>Layer 1: Global rate limit (protect infrastructure)
Layer 2: Per-IP limit on unauthenticated endpoints (login, signup, public APIs)
Layer 3: Per-User limit on authenticated endpoints (fairest)
Layer 4: Per-Endpoint limit on expensive operations (reports, exports)</code></pre>
<p><strong>Additional identity dimensions:</strong></p>
<ul>
<li>Per-API-Key — for B2B integrations where multiple services share credentials</li>
<li>Per-Organization — aggregate limit across all users in a tenant</li>
<li>Composite key (User + Endpoint) — different limits for reads vs writes per user</li>
</ul>`
        },
        {
            id: 'rl-q8',
            level: 'senior',
            title: 'How do you handle rate limit spikes gracefully without degrading user experience?',
            answer: `<p>Graceful handling of rate limit spikes means going beyond simple 429 rejections to provide a smooth experience during traffic bursts. The goal is to shed load intelligently while maintaining service quality for as many users as possible.</p>
<p><strong>1. Request queuing with backpressure:</strong></p>
<ul>
<li>Instead of immediate rejection, queue excess requests with a bounded queue</li>
<li>Process queued requests as capacity becomes available (leaky bucket pattern)</li>
<li>Set queue timeouts — don't hold requests forever (client already gave up after 30s)</li>
</ul>
<p><strong>2. Graceful degradation tiers:</strong></p>
<pre><code>0-80% capacity:  Full response, all features
80-90% capacity: Omit non-essential data (recommendations, analytics)
90-95% capacity: Serve cached/stale responses where acceptable
95-100% capacity: Queue with short timeout
100%+ capacity:  429 with accurate Retry-After</code></pre>
<p><strong>3. Priority-based shedding:</strong></p>
<ul>
<li>Classify requests by business priority (payment > browsing > analytics)</li>
<li>Under pressure, shed low-priority requests first while keeping high-priority flowing</li>
<li>Implement using weighted rate limiters or priority queues</li>
</ul>
<p><strong>4. Client-side cooperation:</strong></p>
<ul>
<li>Return <code>X-RateLimit-Remaining</code> on all responses so clients can self-throttle</li>
<li>Provide exponential backoff guidance in API documentation</li>
<li>Add jitter to Retry-After values to prevent thundering herd on recovery</li>
</ul>
<p><strong>5. Burst allowance with token bucket:</strong></p>
<ul>
<li>Set bucket capacity higher than steady-state rate to absorb legitimate bursts</li>
<li>Example: 100 req/min steady state but allow bursts of 20 in 1 second (bucket size 20)</li>
</ul>
<p><strong>6. Circuit breaker integration:</strong></p>
<ul>
<li>If downstream services are slow/failing, reduce rate limits dynamically</li>
<li>Adaptive rate limiting based on response times and error rates</li>
</ul>`
        },
        {
            id: 'rl-q9',
            level: 'architect',
            title: 'Design a multi-tier rate limiting architecture for a high-traffic API platform serving millions of requests per second.',
            answer: `<p>A production rate limiting architecture for a high-scale platform requires multiple enforcement layers, each optimized for different granularities and failure modes:</p>
<p><strong>Tier 1: Edge / CDN Layer (Cloudflare, AWS CloudFront)</strong></p>
<ul>
<li>DDoS protection — absorbs volumetric attacks before they reach your infrastructure</li>
<li>Per-IP rate limiting at massive scale (millions of IPs tracked)</li>
<li>Geographic throttling — block or limit by country/region</li>
<li>Bot detection and CAPTCHA challenges</li>
<li>Latency: &lt;1ms (in-memory at edge PoP)</li>
</ul>
<p><strong>Tier 2: API Gateway (Kong, NGINX, AWS API Gateway)</strong></p>
<ul>
<li>Per-API-Key and per-OAuth-client rate limiting</li>
<li>Plan-based quotas (free: 1K/day, pro: 100K/day, enterprise: custom)</li>
<li>Request validation and payload size limits</li>
<li>Shared Redis cluster for distributed state across gateway instances</li>
<li>Latency: 2-5ms (Redis lookup)</li>
</ul>
<p><strong>Tier 3: Application Middleware (per-service)</strong></p>
<ul>
<li>Per-user, per-endpoint fine-grained policies</li>
<li>Business logic-aware limits (e.g., max 3 password resets/hour, max 10 orders/minute)</li>
<li>Concurrency limiters for expensive operations (report generation, file exports)</li>
<li>In-process token bucket with Redis fallback for distributed coordination</li>
<li>Latency: &lt;1ms (in-memory) or 2-5ms (Redis)</li>
</ul>
<p><strong>Tier 4: Database / Resource Protection</strong></p>
<ul>
<li>Connection pool limits (max concurrent queries per tenant)</li>
<li>Query cost-based throttling (expensive queries consume more quota)</li>
<li>Bulkhead isolation — separate pools for different priority levels</li>
</ul>
<p><strong>Architecture diagram (conceptual):</strong></p>
<pre><code>Client → CDN/Edge (DDoS, IP) → API Gateway (API Key, Plan)
    → Load Balancer → App Tier (User, Endpoint, Business Rules)
        → Database (Connection limits, Query cost)</code></pre>
<p><strong>Cross-cutting concerns:</strong></p>
<ul>
<li><strong>Observability</strong> — Metrics on limit hits per tier, per policy, per identity dimension. Alert on anomalies.</li>
<li><strong>Configuration</strong> — Dynamic rate limit updates without deploys (config service or feature flags)</li>
<li><strong>Fail-open vs fail-closed</strong> — Edge/Gateway: fail-open (availability over protection). App tier: configurable per endpoint criticality.</li>
<li><strong>Synchronization</strong> — Redis Cluster with read replicas for gateway tier. Accept eventual consistency (slight over-admission is acceptable).</li>
<li><strong>Cost tracking</strong> — Different API operations have different costs. A search query that fans out to 10 microservices should consume more quota than a cache hit.</li>
</ul>`
        },
        {
            id: 'rl-q10',
            level: 'architect',
            title: 'What are the trade-offs of implementing rate limiting at the API Gateway layer vs the application layer? When would you choose each approach?',
            answer: `<p>This is a fundamental architectural decision that affects performance, flexibility, operational complexity, and failure modes. Most production systems need both, but the balance depends on the platform's maturity and requirements.</p>
<p><strong>API Gateway Rate Limiting:</strong></p>
<table>
<tr><th>Pros</th><th>Cons</th></tr>
<tr><td>Centralized enforcement — one place to manage all policies</td><td>Coarse-grained — no access to business context (user roles, subscription tier from DB)</td></tr>
<tr><td>Language/framework agnostic — works for any backend service</td><td>Added latency for distributed counter lookups (Redis round-trip)</td></tr>
<tr><td>Protects backends from even reaching application code</td><td>Single point of failure — gateway outage = all APIs affected</td></tr>
<tr><td>Easier to manage for platform teams — no per-service changes</td><td>Hard to implement operation-specific limits (can't differentiate GET /users from POST /users easily)</td></tr>
<tr><td>Handles pre-auth protection (login brute-force, DDoS)</td><td>Rate limit state is separated from application state — harder to correlate with business events</td></tr>
</table>
<p><strong>Application Layer Rate Limiting:</strong></p>
<table>
<tr><th>Pros</th><th>Cons</th></tr>
<tr><td>Fine-grained — access to authenticated user, roles, subscription data, request cost</td><td>Must be implemented per-service in a microservices architecture</td></tr>
<tr><td>Business-aware limits (e.g., 3 password resets/hour, 10 trades/second for basic tier)</td><td>Traffic still reaches your servers — compute is consumed before rejection</td></tr>
<tr><td>No extra infrastructure dependency (can use in-memory for single-instance)</td><td>Inconsistent implementation across services without shared libraries</td></tr>
<tr><td>Can implement cost-based limiting (expensive queries use more quota)</td><td>Each team must understand and correctly implement rate limiting</td></tr>
</table>
<p><strong>Decision framework:</strong></p>
<ul>
<li><strong>Use Gateway when:</strong> protecting against volumetric attacks, enforcing plan-based quotas across all APIs, you have a platform team managing cross-cutting concerns, you need pre-authentication protection</li>
<li><strong>Use Application when:</strong> you need business-logic-aware limits, different operations have different costs, you need per-user limits based on subscription tier stored in your DB, the limiting logic is tightly coupled with the domain</li>
<li><strong>Use Both when:</strong> high-scale production systems — Gateway as first defense (coarse), Application as second (fine-grained)</li>
</ul>
<p><strong>Hybrid pattern:</strong></p>
<pre><code>Gateway: Global IP limit (10K req/min) + API Key quota (plan-based)
App:     Per-user limit (from subscription DB) + Per-operation cost-based limit
Result:  Defense in depth — each layer catches what the previous layer couldn't</code></pre>
<p><strong>Operational considerations:</strong></p>
<ul>
<li>Gateway limits should be generous enough to not block legitimate traffic — they're a safety net</li>
<li>Application limits should be precise and business-aligned — they enforce product rules</li>
<li>Both layers must return consistent 429 responses with Retry-After headers</li>
<li>Monitoring must correlate rejections across layers to avoid confusion (rejected at gateway vs app looks the same to the client)</li>
</ul>`
        }
    ]
});