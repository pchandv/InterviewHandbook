/* ═══════════════════════════════════════════════════════════════════
   ASP.NET Core — Performance & Security Middleware
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('aspnet-performance', {
    title: 'Performance & Security',
    description: 'Rate limiting, response compression, CORS, HTTPS enforcement, Data Protection API, and performance-focused middleware patterns in ASP.NET Core.',
    sections: [
        {
            title: 'Rate Limiting (.NET 7+)',
            content: `<p>Built-in rate limiting protects APIs from abuse, ensures fair usage, and prevents resource exhaustion from excessive requests.</p>`,
            code: `// Built-in rate limiting (.NET 7+):
builder.Services.AddRateLimiter(options =>
{
    // Fixed window: X requests per time window
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 100;
        opt.QueueLimit = 10;
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });

    // Sliding window: smoother distribution
    options.AddSlidingWindowLimiter("sliding", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.SegmentsPerWindow = 6; // 10-second segments
        opt.PermitLimit = 100;
    });

    // Token bucket: burst-friendly
    options.AddTokenBucketLimiter("token", opt =>
    {
        opt.TokenLimit = 100;
        opt.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
        opt.TokensPerPeriod = 20;
        opt.AutoReplenishment = true;
    });

    // Per-user rate limiting (using authenticated identity):
    options.AddPolicy("per-user", context =>
    {
        var userId = context.User?.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
        return RateLimitPartition.GetFixedWindowLimiter(userId, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 50,
            Window = TimeSpan.FromMinutes(1)
        });
    });

    // Custom response when rate limited:
    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = "Too many requests. Please retry after the rate limit window.",
            retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retry) ? retry.TotalSeconds : 60
        }, ct);
    };
});

app.UseRateLimiter();

// Apply to specific endpoints:
app.MapPost("/api/login", Login).RequireRateLimiting("fixed");
app.MapGet("/api/search", Search).RequireRateLimiting("per-user");`,
            language: 'csharp'
        },
        {
            title: 'Response Compression & Security Headers',
            content: `<p>Compression reduces response sizes by 60-80%. Security headers protect against common web attacks. Both are essential for production APIs.</p>`,
            code: `// Response compression:
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true; // Safe for APIs (careful with CRIME/BREACH for HTML)
    options.Providers.Add<BrotliCompressionProvider>(); // Best compression
    options.Providers.Add<GzipCompressionProvider>();   // Widest compatibility
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "application/json",
        "application/xml"
    });
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
    options.Level = CompressionLevel.Optimal);

app.UseResponseCompression();

// Security headers middleware:
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'";
    await next();
});

// CORS configuration:
builder.Services.AddCors(options =>
{
    options.AddPolicy("Production", policy => policy
        .WithOrigins("https://myapp.com", "https://admin.myapp.com")
        .WithMethods("GET", "POST", "PUT", "DELETE")
        .WithHeaders("Authorization", "Content-Type")
        .SetPreflightMaxAge(TimeSpan.FromHours(1)));
});

// HTTPS redirection + HSTS:
app.UseHttpsRedirection();
app.UseHsts(); // Strict-Transport-Security header`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Performance and security middleware form a pipeline where each stage processes the request before passing it to the next. Understanding the order is critical — rate limiting rejects abusive requests early, compression reduces response size, and output caching avoids re-execution entirely.</p>`,
            mermaid: `graph LR
    A["Incoming Request"] --> B["Rate Limiter<br/>(reject excess)"]
    B --> C["Response Compression<br/>(Brotli/Gzip)"]
    C --> D["Output Cache<br/>(serve cached)"]
    D --> E["CORS / Security Headers"]
    E --> F["Endpoint<br/>(controller/handler)"]
    F --> G["Response"]
    
    D -.->|"Cache HIT"| G
    B -.->|"429 Too Many Requests"| G

    style A fill:#3498db,color:#fff
    style B fill:#e74c3c,color:#fff
    style C fill:#e67e22,color:#fff
    style D fill:#27ae60,color:#fff
    style E fill:#8e44ad,color:#fff
    style F fill:#2c3e50,color:#fff
    style G fill:#16a085,color:#fff`
        },
        {
            title: 'Best Practices',
            content: `<ul>
                <li><strong>Use Output Caching for GET endpoints</strong> — for read-heavy APIs, output caching avoids re-executing the entire pipeline. Tag cached entries by resource so invalidation is surgical. Much cheaper than re-querying the database on every request.</li>
                <li><strong>Enable Response Compression (Brotli preferred)</strong> — Brotli offers 15-25% better compression than Gzip for text/JSON. Use <code>CompressionLevel.Fastest</code> for high-throughput APIs where CPU is scarcer than bandwidth.</li>
                <li><strong>Rate limit per user, not just globally</strong> — global rate limits let one abusive client block everyone. Partition by authenticated user ID or IP so fair-use enforcement is granular. Use token bucket for burst-tolerant APIs.</li>
                <li><strong>HTTPS everywhere</strong> — enforce <code>UseHttpsRedirection()</code> + <code>UseHsts()</code> with <code>includeSubDomains</code>. Configure <code>ForwardedHeaders</code> behind load balancers to prevent redirect loops.</li>
                <li><strong>Use CORS restrictively</strong> — always use explicit <code>WithOrigins()</code> allow-lists from configuration. Never combine <code>AllowAnyOrigin()</code> with <code>AllowCredentials()</code> (the spec forbids it). Scope methods and headers to what the SPA actually needs.</li>
            </ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Compressing already-compressed content</strong> — images (JPEG, PNG), videos, and ZIP files are already compressed. Attempting to re-compress them wastes CPU for zero gain. Restrict MIME types to text-based formats (JSON, XML, HTML).</li>
                <li><strong>Rate limiting without Retry-After header</strong> — well-behaved clients need to know when they can retry. Always include a <code>Retry-After</code> header (in seconds) in your 429 response so clients back off correctly instead of hammering blindly.</li>
                <li><strong>CORS wildcard (*) in production</strong> — <code>AllowAnyOrigin()</code> in production means any website can read your API responses. Combined with credentials, it is an outright spec violation. Use explicit origin allow-lists sourced from environment config.</li>
                <li><strong>No HTTPS redirect</strong> — without <code>UseHttpsRedirection()</code> and HSTS, the first request over HTTP is vulnerable to MITM attacks. Behind a TLS-terminating proxy, configure <code>ForwardedHeaders</code> so the app knows the original scheme.</li>
                <li><strong>Compressing at both proxy and app level</strong> — if your CDN/NGINX already compresses responses, enabling compression in the app too wastes CPU with no additional benefit. Pick one layer.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            content: `<p>Performance and security middleware questions test whether you understand how the ASP.NET Core pipeline works and can reason about trade-offs.</p>`,
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: '<p><strong>Output Caching vs Response Caching</strong> — know the difference. Output caching is server-side (the server stores the response and skips re-execution). Response caching relies on HTTP cache headers and intermediate proxies/browsers. Output caching (.NET 7+) gives you control; response caching depends on client compliance.</p><p><strong>When to use Rate Limiting</strong> — protect authentication endpoints aggressively (5 attempts/min for brute-force prevention), use per-user partitioning for fair usage, and always return 429 with Retry-After. In distributed deployments, per-instance limits are insufficient — mention Redis-backed or gateway-level rate limiting.</p><p><strong>Pipeline order matters</strong> — rate limiting should reject early (save resources), compression wraps the response body (place before endpoints write), and CORS must be after routing but before auth.</p>'
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Performance and security middleware work together</strong> — rate limiting, compression, caching, CORS, and HTTPS enforcement are not isolated concerns. Their pipeline order determines effectiveness.</li>
                <li><strong>Rate limiting protects backends</strong> — it is the first line of defense against abuse, accidental DDoS from misbehaving clients, and brute-force attacks on auth endpoints. Partition per-user for fairness.</li>
                <li><strong>Compression reduces bandwidth, not latency</strong> — Brotli/Gzip shrink payloads 60-80% for text content. Prefer doing it at the edge (CDN/proxy) to save app CPU. Never re-compress already-compressed formats.</li>
                <li><strong>Output caching avoids re-execution</strong> — for GET endpoints with stable data, output caching is cheaper than response caching because the server controls it entirely without depending on client cache headers.</li>
                <li><strong>Security headers are defense-in-depth</strong> — HSTS, CSP, X-Content-Type-Options, and restrictive CORS together create multiple layers. No single header is sufficient alone.</li>
            </ul>`
        }
    ],
    questions: [
        {"question":"What are the most impactful ways to improve ASP.NET Core API performance?","difficulty":"hard","answer":"<p>In rough order of impact: (1) <strong>use async I/O end to end</strong> to free threads during DB/network waits and avoid thread-pool starvation; (2) <strong>cache</strong> expensive/repeated work (in-memory/distributed/output caching); (3) fix <strong>database</strong> issues — N+1 queries, missing indexes, pulling too many rows; (4) reuse <code>HttpClient</code> via IHttpClientFactory and pool connections; (5) reduce payload size and use <strong>response compression</strong>; (6) minimize allocations on hot paths (Span, pooling) and use gRPC for hot internal calls.</p><p>Always measure first with profiling/tracing — optimize the proven bottleneck, not guesses.</p>","explanation":"It is like speeding up a kitchen: stop chefs standing idle while the oven runs (async), keep popular dishes ready (cache), fix the slow supplier (database), and reuse pans instead of buying new ones each time (connections/allocations).","bestPractices":["Async all the way down for I/O","Cache hot/expensive results","Fix N+1 and add indexes; page large results","Profile before optimizing"],"commonMistakes":["Blocking on async (.Result) causing thread-pool starvation","New HttpClient per request (socket exhaustion)","Optimizing code when the DB is the bottleneck"],"interviewTip":"Lead with async I/O (frees threads) and \"measure first,\" then list caching and DB fixes — a prioritized, evidence-driven list beats a random grab-bag.","followUp":["What is thread-pool starvation?","How does response compression help?","When is gRPC worth it internally?"]},
        {"question":"What is thread-pool starvation in ASP.NET Core and how do you avoid it?","difficulty":"hard","answer":"<p><strong>Thread-pool starvation</strong> occurs when threads are blocked (waiting synchronously on I/O or locks) faster than the pool can supply new ones, so incoming requests queue and latency spikes even though CPU is low. The classic cause is <strong>blocking on async</strong> code (<code>.Result</code>, <code>.Wait()</code>, <code>GetAwaiter().GetResult()</code>) or synchronous I/O.</p><p>Avoid it by using <strong>async I/O all the way down</strong> (never block on async), avoiding <code>Task.Run</code> to fake async over sync I/O, keeping lock hold-times short, and offloading genuinely CPU-bound work appropriately. The tell-tale sign is high latency/queueing with low CPU.</p>","explanation":"It is a call center where every operator is stuck on hold waiting for another department (blocking). New callers pile up not because operators are busy working, but because they are all frozen waiting.","bestPractices":["Async all the way; never block on async","Use async DB/HTTP/file APIs, not sync","Keep locks short; do not Task.Run over sync I/O"],"commonMistakes":[".Result/.Wait() on async calls","Synchronous I/O in request handling","Masking blocking with Task.Run"],"interviewTip":"The signature \"high latency + low CPU + growing queue\" points to starvation from blocking on async — naming that pattern shows real diagnostic experience.","followUp":["Why does .Result cause starvation and deadlocks?","How do you detect starvation?","When is Task.Run appropriate?"]},
        {
            question: 'How do you implement rate limiting in ASP.NET Core? What algorithms are available?',
            difficulty: 'medium',
            answer: `<p>.NET 7+ provides built-in rate limiting with four algorithms: <strong>Fixed Window</strong> (X requests per window), <strong>Sliding Window</strong> (smoother distribution), <strong>Token Bucket</strong> (burst-friendly with steady replenishment), and <strong>Concurrency</strong> (max simultaneous requests). You can partition by user, IP, API key, or any custom key.</p>`,
            bestPractices: ['Rate limit authentication endpoints aggressively (prevent brute force)', 'Use per-user partitioning for fair usage (not just global limits)', 'Return 429 with Retry-After header (helps good clients auto-retry correctly)', 'Use token bucket for APIs that need burst tolerance (spiky but controlled)'],
            commonMistakes: ['Only rate limiting globally (one abusive user blocks everyone)', 'Not rate limiting internal APIs (lateral movement attack, resource exhaustion)', 'Setting limits too low (blocks legitimate high-volume users)', 'Not considering distributed rate limiting (per-instance limits in load-balanced setups)'],
            interviewTip: 'Explain the four algorithms with use cases: Fixed window for simple quotas, sliding window for smoother enforcement, token bucket for burst tolerance, concurrency for protecting CPU-bound endpoints. Show you understand partitioning: per-user, per-IP, per-API-key.',
            followUp: ['How does rate limiting work in distributed/load-balanced environments?', 'What is the difference between fixed window and sliding window?', 'How do you handle rate limiting for authenticated vs anonymous users?'],
            seniorPerspective: 'I apply different rate limits by tier: anonymous users get 30 req/min, authenticated get 100, premium get 500. Login endpoints get aggressive limits (5 attempts/min) to prevent brute force. All with clear 429 responses including Retry-After.',
            architectPerspective: 'In distributed systems, per-instance rate limiting is insufficient — use a shared store (Redis) for distributed rate limiting. Azure API Management or API gateways handle this at the edge before requests reach your services. Rate limiting is the first line of defense against both abuse and accidental DDoS from misbehaving clients.'
        },
        {
            question: 'What security headers should every production API set and why?',
            difficulty: 'easy',
            answer: `<p>Essential security headers prevent common attacks without any application code changes. They instruct browsers and intermediaries how to handle your responses securely.</p>`,
            code: `// Critical security headers for production:
// X-Content-Type-Options: nosniff     — prevents MIME-type sniffing attacks
// X-Frame-Options: DENY               — prevents clickjacking (embedding in iframe)
// Strict-Transport-Security: max-age=31536000 — forces HTTPS for 1 year
// Content-Security-Policy: default-src 'self' — prevents XSS (controls script sources)
// Referrer-Policy: strict-origin-when-cross-origin — limits referrer data leakage
// Permissions-Policy: camera=(), microphone=() — disables browser features you dont use

// In ASP.NET Core:
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=()");
    await next();
});
app.UseHsts(); // Adds Strict-Transport-Security
app.UseHttpsRedirection(); // Redirects HTTP → HTTPS`,
            language: 'csharp',
            bestPractices: ['Set all security headers in a single middleware at the top of the pipeline', 'Use HSTS with includeSubDomains and preload for maximum protection', 'Start with strict CSP and relax only as needed (whitelist approach)', 'Test headers with securityheaders.com or Mozilla Observatory'],
            commonMistakes: ['Not setting any security headers (relying on browser defaults)', 'Overly permissive CSP (unsafe-inline, unsafe-eval defeat the purpose)', 'Setting X-XSS-Protection: 1 (deprecated, can cause issues — use CSP instead)', 'Forgetting HSTS preload registration for public-facing sites'],
            interviewTip: 'Name the top 5 headers and what attack each prevents. Show you understand the defense-in-depth approach: each header blocks a specific attack vector, and together they create multiple layers of protection.',
            followUp: ['What is Content Security Policy and how do you configure it?', 'What is HSTS preloading?', 'How do security headers interact with CORS?'],
            seniorPerspective: 'I use a standardized security headers middleware across all services. Combined with automated scanning in CI/CD (OWASP ZAP, securityheaders.com check), we catch missing headers before deployment.',
            architectPerspective: 'Security headers should be enforced at the gateway level (API Management, CDN) so individual services cannot accidentally omit them. Defense in depth: apply at both gateway and service level — belt and suspenders.'
        },
        {
            question: 'How does response compression work in ASP.NET Core, and what are the security and performance trade-offs of EnableForHttps?',
            difficulty: 'medium',
            answer: `<p>Response compression middleware shrinks response bodies (commonly 60-80% for JSON/text) using a negotiated encoding from the client's <code>Accept-Encoding</code> header. ASP.NET Core ships Brotli and Gzip providers; Brotli gives better ratios, Gzip wider compatibility.</p>
            <ul>
                <li>It only compresses configured MIME types and bodies above a minimum size (tiny payloads are not worth it)</li>
                <li><code>EnableForHttps</code> is opt-in because compressing secret-bearing responses over TLS can expose them to <strong>BREACH/CRIME</strong>-style attacks when an attacker can influence part of the response</li>
                <li>For pure JSON APIs with no reflected secrets, enabling HTTPS compression is generally safe; for HTML pages mixing user input and secrets (anti-forgery tokens), be cautious</li>
                <li>If a reverse proxy/CDN (NGINX, IIS, CloudFront) already compresses, do it there instead to save app CPU</li>
            </ul>`,
            explanation: 'Compression is like vacuum-packing a parcel before shipping. But if the box also contains a secret note and an attacker can keep adding their own items and watching the box size, they can infer the secret — that is the BREACH risk over HTTPS.',
            code: `builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true; // safe for pure JSON APIs; risky for secret-bearing HTML
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes
        .Concat(new[] { "application/json", "application/xml" });
});
builder.Services.Configure<BrotliCompressionProviderOptions>(o =>
    o.Level = CompressionLevel.Fastest); // Optimal costs more CPU per request

var app = builder.Build();
app.UseResponseCompression(); // place early, before endpoints produce bodies`,
            language: 'csharp',
            bestPractices: [
                'Prefer compressing at the reverse proxy/CDN when one exists to offload app CPU',
                'Use CompressionLevel.Fastest for high-throughput APIs; Optimal only when bandwidth dominates',
                'Restrict MIME types to compressible text/JSON/XML (never re-compress images or video)',
                'Only set EnableForHttps after confirming responses do not mix secrets with attacker-influenced content'
            ],
            commonMistakes: [
                'Enabling compression for already-compressed content (images, zips) wasting CPU for no gain',
                'Blindly enabling HTTPS compression on HTML pages containing anti-forgery tokens (BREACH risk)',
                'Using CompressionLevel.Optimal under high load and saturating CPU',
                'Compressing in both the proxy and the app (double work)'
            ],
            interviewTip: 'Name the BREACH/CRIME reason EnableForHttps is opt-in, then qualify it: pure JSON APIs are typically fine, secret-bearing HTML is the risky case. Mention offloading to the proxy/CDN as the pragmatic default.',
            followUp: ['What is the difference between Brotli and Gzip?', 'Why might you compress at the CDN instead of the app?', 'What is the BREACH attack?'],
            seniorPerspective: 'In most deployments I let the edge (CDN or NGINX) handle compression and leave it off in the app to save CPU. I only enable in-app compression for services with no fronting proxy, and then I default to Fastest because CPU is usually scarcer than bandwidth.',
            architectPerspective: 'Compression is a CPU-for-bandwidth trade. At high RPS, Optimal-level Brotli can become a hidden bottleneck. I benchmark payload-size reduction against added CPU and tail latency, and standardize compression at the edge so service instances stay CPU-lean and horizontally scalable.'
        },
        {
            question: 'How do you configure CORS correctly in ASP.NET Core, and why is AllowAnyOrigin with AllowCredentials invalid?',
            difficulty: 'hard',
            answer: `<p>CORS is a browser-enforced mechanism that controls which origins may read responses from your API via cross-origin requests. In ASP.NET Core you define named policies, register the middleware via <code>UseCors</code> (after <code>UseRouting</code>, before auth/endpoints), and apply policies globally or per-endpoint.</p>
            <ul>
                <li>The browser sends a <strong>preflight</strong> <code>OPTIONS</code> request for non-simple requests; your policy's allowed methods/headers answer it</li>
                <li><code>AllowAnyOrigin()</code> emits <code>Access-Control-Allow-Origin: *</code>, which the spec forbids combining with <code>AllowCredentials()</code> — credentials (cookies, Authorization) require an explicit, echoed origin, not the wildcard</li>
                <li>For credentialed requests you must call <code>WithOrigins(...)</code> plus <code>AllowCredentials()</code></li>
                <li>CORS is not a server-side security control — it only governs what browsers allow JS to read; it does not protect non-browser clients</li>
            </ul>`,
            explanation: 'CORS is the bouncer telling the browser which guests (origins) are allowed to read what the kitchen sends out. A wildcard guest list cannot also hand out VIP wristbands (credentials) — the rule requires naming each VIP explicitly.',
            code: `builder.Services.AddCors(options =>
{
    options.AddPolicy("Spa", policy => policy
        .WithOrigins("https://app.example.com", "https://admin.example.com")
        .WithMethods("GET", "POST", "PUT", "DELETE")
        .WithHeaders("Authorization", "Content-Type")
        .AllowCredentials()                       // requires explicit origins, NOT AllowAnyOrigin
        .SetPreflightMaxAge(TimeSpan.FromHours(1)));
});

var app = builder.Build();
app.UseRouting();
app.UseCors("Spa");          // after routing, before auth + endpoints
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers().RequireCors("Spa");

// INVALID at runtime — throws because wildcard + credentials is not allowed:
// policy.AllowAnyOrigin().AllowCredentials();`,
            language: 'csharp',
            bestPractices: [
                'Use explicit WithOrigins allow-lists, ideally sourced from configuration per environment',
                'Place UseCors after UseRouting and before UseAuthentication/endpoints',
                'Set a sensible preflight max-age to cut repeated OPTIONS round-trips',
                'Treat CORS as a browser convenience, not a substitute for real authorization'
            ],
            commonMistakes: [
                'Combining AllowAnyOrigin with AllowCredentials (invalid; runtime error)',
                'Assuming CORS protects the API from non-browser clients (it does not)',
                'Registering UseCors in the wrong position so the policy never applies',
                'Using AllowAnyHeader/AllowAnyMethod broadly in production instead of scoping them'
            ],
            interviewTip: 'Explain WHY the wildcard+credentials combo is forbidden: the spec requires the server to echo a specific origin for credentialed requests so caches and browsers cannot leak responses across origins. Also stress CORS is browser-enforced, not server security.',
            followUp: ['What triggers a CORS preflight request?', 'Does CORS protect against CSRF?', 'How do you manage allowed origins across environments?'],
            seniorPerspective: 'I keep allowed origins in configuration and load them per environment, never hardcoded. I also remind teams that CORS and CSRF are different problems — CORS does not stop a malicious site from issuing requests, it only governs whether JS can read the response.',
            architectPerspective: 'In a microservices estate I centralize CORS at the API gateway so origin policy is consistent and auditable, rather than each service drifting. Services behind the gateway trust the edge, which keeps per-service config minimal and avoids inconsistent wildcard policies sneaking into production.'
        },
        {
            question: 'How do HTTPS redirection and HSTS work together in ASP.NET Core, and what are the production pitfalls?',
            difficulty: 'medium',
            answer: `<p><code>UseHttpsRedirection</code> issues a 307/308 redirect from HTTP to HTTPS for the first request. <code>UseHsts</code> adds the <code>Strict-Transport-Security</code> header so compliant browsers refuse plain HTTP entirely for the configured duration — eliminating the vulnerable first redirect on subsequent visits.</p>
            <ul>
                <li>HSTS is intentionally <strong>not</strong> enabled in Development (it would pin localhost to HTTPS in your browser and is hard to undo)</li>
                <li>Behind a TLS-terminating proxy/load balancer, the app sees HTTP; configure <code>ForwardedHeaders</code> so it honors <code>X-Forwarded-Proto</code> and does not redirect-loop</li>
                <li>Use <code>includeSubDomains</code> and a long <code>max-age</code> (e.g. 1 year) for production; only add <code>preload</code> when you are certain, since preload removal is slow</li>
            </ul>`,
            explanation: 'HTTPS redirection is a sign at the door saying "use the secure entrance." HSTS is the browser remembering that rule so it never even tries the insecure door again. But you do not want your dev machine to memorize that rule permanently.',
            code: `builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
    options.Preload = true; // only if you intend to submit to the preload list
});

// Honor proxy TLS termination so the app knows the original scheme:
builder.Services.Configure<ForwardedHeadersOptions>(o =>
    o.ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor);

var app = builder.Build();
app.UseForwardedHeaders();
if (!app.Environment.IsDevelopment())
{
    app.UseHsts(); // not in dev — avoids pinning localhost to HTTPS
}
app.UseHttpsRedirection();`,
            language: 'csharp',
            bestPractices: [
                'Enable UseHsts only outside Development to avoid pinning localhost',
                'Configure ForwardedHeaders behind load balancers so HTTPS detection works',
                'Use a long max-age with includeSubDomains in production',
                'Add preload only when committed — delisting from the preload list is slow'
            ],
            commonMistakes: [
                'Turning on HSTS in dev and then being unable to reach localhost over HTTP',
                'Redirect loops behind a TLS-terminating proxy because X-Forwarded-Proto is ignored',
                'Setting preload casually and then needing to undo it',
                'Relying on HTTPS redirection alone (the first HTTP hop is still attackable without HSTS)'
            ],
            interviewTip: 'Make the proxy point: in cloud deployments TLS usually terminates at the load balancer, so without ForwardedHeaders the app thinks every request is HTTP and redirect-loops. That detail signals real production experience.',
            followUp: ['Why is HSTS disabled in Development by default?', 'What does the preload directive do?', 'How does ForwardedHeaders middleware prevent redirect loops?'],
            seniorPerspective: 'The bug I see most is redirect loops behind an ALB or NGINX because ForwardedHeaders was not configured. I always wire UseForwardedHeaders first and verify the app sees the real scheme before enabling HTTPS redirection.',
            architectPerspective: 'I prefer to terminate TLS and enforce HTTPS/HSTS at the edge (load balancer or CDN) for consistency, while still configuring the app defensively. Preload is a one-way door at the org level, so it is an architectural decision with a long tail, not a per-service toggle.'
        },
        {
            question: 'What Kestrel and server-level settings would you tune for a high-throughput production API?',
            difficulty: 'advanced',
            answer: `<p>Kestrel's defaults are conservative for safety. For high-throughput services you tune limits to balance throughput, memory, and resistance to slow/abusive clients:</p>
            <ul>
                <li><code>Limits.MaxConcurrentConnections</code> / <code>MaxConcurrentUpgradedConnections</code> — cap connections to protect memory</li>
                <li><code>Limits.MaxRequestBodySize</code> — bound upload size (defends against memory exhaustion)</li>
                <li><code>Limits.MinRequestBodyDataRate</code> / <code>MinResponseDataRate</code> — drop slowloris-style slow clients</li>
                <li><code>Limits.KeepAliveTimeout</code> and <code>RequestHeadersTimeout</code> — reclaim idle/half-open connections</li>
                <li>HTTP/2 <code>MaxStreamsPerConnection</code> for multiplexing limits</li>
                <li>Outside Kestrel: raise OS file-descriptor/socket limits, configure thread pool minimums for burst cold-starts, and prefer async all the way down to avoid thread-pool starvation</li>
            </ul>`,
            explanation: 'Kestrel tuning is like setting capacity rules for a venue: how many people can enter (connections), how big a bag they can bring (body size), how slowly they may shuffle in before security removes them (data rate), and how long an empty seat is held (keep-alive).',
            code: `builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxConcurrentConnections = 20_000;
    options.Limits.MaxConcurrentUpgradedConnections = 5_000; // WebSockets
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024;    // 10 MB
    options.Limits.KeepAliveTimeout = TimeSpan.FromSeconds(120);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);

    // Defend against slowloris-style slow clients:
    options.Limits.MinRequestBodyDataRate =
        new MinDataRate(bytesPerSecond: 240, gracePeriod: TimeSpan.FromSeconds(5));
    options.Limits.MinResponseDataRate =
        new MinDataRate(bytesPerSecond: 240, gracePeriod: TimeSpan.FromSeconds(5));

    options.Limits.Http2.MaxStreamsPerConnection = 100;
});

// Avoid thread-pool starvation on bursty cold starts:
// ThreadPool.SetMinThreads(workerThreads: 200, completionPortThreads: 200);`,
            language: 'csharp',
            bestPractices: [
                'Bound MaxRequestBodySize and connection limits to protect memory',
                'Keep MinRequestBodyDataRate/MinResponseDataRate to evict slowloris clients',
                'Use async I/O end-to-end to avoid thread-pool starvation under load',
                'Load-test before and after tuning — defaults are fine until proven otherwise'
            ],
            commonMistakes: [
                'Removing MaxRequestBodySize entirely (opens memory-exhaustion DoS)',
                'Blocking on async calls (.Result/.Wait) causing thread-pool starvation',
                'Cranking connection limits without checking OS socket/file-descriptor limits',
                'Tuning blindly without load tests, then regressing throughput'
            ],
            interviewTip: 'Tie each limit to the threat it mitigates: body size -> memory DoS, data-rate -> slowloris, keep-alive -> idle connection reclamation. Mention thread-pool starvation from sync-over-async as the most common real-world throughput killer.',
            followUp: ['What is thread-pool starvation and how do you detect it?', 'How does MinRequestBodyDataRate stop slowloris attacks?', 'When would you put Kestrel behind a reverse proxy vs expose it directly?'],
            seniorPerspective: 'Most "Kestrel is slow" tickets I get are actually sync-over-async code starving the thread pool, not Kestrel limits. I profile first; I only touch Kestrel limits once I have evidence, and I always re-run load tests to confirm I improved tail latency rather than just averages.',
            architectPerspective: 'I decide deliberately whether Kestrel is edge-facing or behind a reverse proxy/load balancer, because that dictates which limits matter (the proxy may already enforce body size and timeouts). Capacity limits should align with pod memory budgets and the autoscaling policy so a single instance fails predictably rather than thrashing.'
        },
        {
            question: 'When should you use response compression at the application level versus relying on a CDN or reverse proxy? What are the trade-offs?',
            difficulty: 'hard',
            answer: `<p>Response compression can happen at three levels: the <strong>application</strong> (ASP.NET middleware), the <strong>reverse proxy</strong> (Nginx, YARP, IIS), or the <strong>CDN edge</strong> (Cloudflare, CloudFront). Each has different trade-offs:</p>
            <ul>
                <li><strong>CDN/Edge compression</strong> \u2014 Preferred for static assets and cacheable responses. Zero CPU cost on your server. Compressed once, served to many. Supports Brotli at edge. Does NOT help for dynamic, non-cacheable responses unique to each user.</li>
                <li><strong>Reverse proxy compression</strong> \u2014 Good for dynamic responses. Nginx/IIS handle it efficiently in native code. Offloads CPU from the .NET process. Recommended for most production setups.</li>
                <li><strong>Application-level compression</strong> \u2014 UseResponseCompression() in ASP.NET Core. Useful when you have no reverse proxy (Kestrel direct, containers). Adds CPU overhead in the .NET process. Disabled by default over HTTPS (CRIME/BREACH vulnerability).</li>
            </ul>
            <p>Key rule: <strong>do not double-compress</strong>. If your CDN or reverse proxy already compresses, disable it at the application level to avoid wasted CPU on an already-compressed response.</p>`,
            explanation: 'Application compression is packing your own suitcase. Reverse proxy compression is having the airport repack it more efficiently. CDN compression is having the delivery service pack it once at the warehouse and ship the compact version to everyone. Use the outermost layer that can do it.',
            code: `// Application-level compression (when no reverse proxy available):
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true; // careful: BREACH risk for sensitive data
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
        new[] { "application/json", "text/plain" });
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest; // balance CPU vs ratio
});
app.UseResponseCompression(); // BEFORE static files and endpoints

// WHEN TO SKIP application compression:
// 1. Behind Nginx with gzip on: already handled
// 2. Behind a CDN: edge handles it for cacheable content
// 3. HTTPS with sensitive cookie data: BREACH vulnerability
// 4. Already-compressed content (images, videos, zips)

// Nginx config (preferred for production):
// gzip on;
// gzip_types application/json text/plain text/css application/javascript;
// gzip_min_length 1024;
// brotli on; (with ngx_brotli module)

// CDN approach: set proper Cache-Control headers and let edge compress
[ResponseCache(Duration = 3600, VaryByHeader = "Accept-Encoding")]
[HttpGet("/api/catalog")]
public IActionResult GetCatalog() => Ok(catalog);
// CDN sees Cache-Control, caches the response, and serves compressed to clients

// Decision matrix:
// Static assets (JS, CSS, images) -> CDN (cache + compress at edge)
// Dynamic cacheable (product catalog) -> CDN or reverse proxy
// Dynamic per-user (dashboard) -> reverse proxy compression
// No infrastructure (container, serverless) -> application compression`,
            language: 'csharp',
            bestPractices: [
                'Prefer CDN compression for static and cacheable content (zero server CPU cost)',
                'Use reverse proxy (Nginx/IIS) compression for dynamic content in production',
                'Only use application-level compression when running Kestrel directly without a proxy',
                'Never double-compress (check if proxy/CDN already handles it)',
                'Use CompressionLevel.Fastest for real-time APIs; Optimal for pre-compressed static assets'
            ],
            commonMistakes: [
                'Enabling UseResponseCompression behind Nginx with gzip on (double compression attempt, CPU waste)',
                'Enabling compression over HTTPS without understanding BREACH vulnerability risks',
                'Compressing already-compressed content (JPEG, PNG, ZIP) wasting CPU for zero benefit',
                'Not setting Vary: Accept-Encoding header (caches serve wrong encoding to some clients)'
            ],
            interviewTip: 'Show awareness of the three layers (app, proxy, CDN) and when each is appropriate. The key insight is: compression belongs at the outermost caching/delivery layer, not necessarily in your app code.',
            followUp: ['What is the BREACH vulnerability and how does it relate to HTTP compression?', 'How does Brotli compare to gzip in compression ratio and CPU cost?', 'How do you handle Vary: Accept-Encoding with caching?']
        },
        {
            question: 'Compare token bucket and sliding window rate limiting algorithms. When would you choose each, and how does ASP.NET Core implement them?',
            difficulty: 'hard',
            answer: `<p>Both algorithms control request rates but with different characteristics:</p>
            <ul>
                <li><strong>Token Bucket</strong> \u2014 A bucket holds tokens (refilled at a steady rate). Each request consumes a token. If empty, request is rejected. <em>Allows bursts</em> up to bucket capacity, then enforces the steady refill rate. Good for APIs that should tolerate short bursts but maintain an average rate.</li>
                <li><strong>Sliding Window</strong> \u2014 Counts requests in a window that slides forward continuously. Smoother than fixed windows (no boundary burst problem). Does NOT allow bursts beyond the window limit at any point. Good for strict rate enforcement without burst tolerance.</li>
                <li><strong>Fixed Window</strong> \u2014 Counts requests in fixed time slots. Simple but has the boundary problem: a client can send 2x the limit at window boundaries (end of one + start of next).</li>
                <li><strong>Concurrency Limiter</strong> \u2014 Limits simultaneous in-flight requests, not rate. Good for protecting against slow-client resource exhaustion.</li>
            </ul>
            <p>ASP.NET Core (.NET 7+) provides all four via <code>Microsoft.AspNetCore.RateLimiting</code> with the <code>RateLimiterOptions</code> builder.</p>`,
            explanation: 'Token bucket is a water tank that fills steadily \u2014 you can drain a burst quickly but then must wait for it to refill. Sliding window is a bouncer counting people entering a club over the last hour \u2014 strictly no more than N in any 60-minute window, no bursts allowed.',
            code: `// ASP.NET Core Rate Limiting (.NET 7+):
builder.Services.AddRateLimiter(options =>
{
    // TOKEN BUCKET: allows bursts, then steady rate
    options.AddTokenBucketLimiter("api", opt =>
    {
        opt.TokenLimit = 100;          // bucket capacity (burst size)
        opt.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
        opt.TokensPerPeriod = 20;      // refill 20 tokens every 10s
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 10;           // queue 10 requests when empty
        opt.AutoReplenishment = true;
    });

    // SLIDING WINDOW: smooth, no bursts allowed
    options.AddSlidingWindowLimiter("strict", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.SegmentsPerWindow = 6;     // 10-second segments
        opt.PermitLimit = 60;          // max 60 requests per sliding minute
        opt.QueueLimit = 0;            // reject immediately, no queuing
    });

    // FIXED WINDOW: simple, boundary burst problem
    options.AddFixedWindowLimiter("basic", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 100;
    });

    // CONCURRENCY: limit simultaneous requests
    options.AddConcurrencyLimiter("concurrent", opt =>
    {
        opt.PermitLimit = 10;          // max 10 concurrent requests
        opt.QueueLimit = 25;
    });

    // Global rejection response:
    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        var retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var ra)
            ? ra.TotalSeconds : 60;
        context.HttpContext.Response.Headers["Retry-After"] = retryAfter.ToString();
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { error = "Rate limit exceeded", retryAfter }, ct);
    };
});
app.UseRateLimiter();

// Apply per-endpoint:
app.MapGet("/api/data", GetData).RequireRateLimiting("api");
app.MapPost("/api/orders", CreateOrder).RequireRateLimiting("strict");

// CHOOSING ALGORITHM:
// Token Bucket: public APIs with burst tolerance, mobile clients with batched requests
// Sliding Window: payment APIs, auth endpoints where strict enforcement matters
// Fixed Window: simple internal rate limits where boundary bursts are acceptable
// Concurrency: protecting against slow clients exhausting thread pool`,
            language: 'csharp',
            bestPractices: [
                'Use Token Bucket for public APIs that should tolerate legitimate bursts',
                'Use Sliding Window for security-critical endpoints (login, payment) requiring strict limits',
                'Set appropriate QueueLimit to smooth short bursts rather than rejecting immediately',
                'Include Retry-After header in 429 responses to help well-behaved clients',
                'Apply different rate limits per endpoint based on cost and sensitivity'
            ],
            commonMistakes: [
                'Using Fixed Window and ignoring the boundary burst problem (2x rate at window edges)',
                'Applying the same rate limit to all endpoints (expensive operations need stricter limits)',
                'Not considering distributed rate limiting (per-instance limits allow N*instances total)',
                'Setting QueueLimit too high, causing memory buildup under sustained overload'
            ],
            interviewTip: 'Name the key difference: token bucket allows bursts (good for UX), sliding window enforces strict rates (good for security). Show you can choose the right algorithm for different endpoints and explain the fixed window boundary problem.',
            followUp: ['How do you implement distributed rate limiting across multiple instances?', 'What is the fixed window boundary burst problem?', 'How do you rate-limit by authenticated user vs IP address?']
        }

    ]
});
