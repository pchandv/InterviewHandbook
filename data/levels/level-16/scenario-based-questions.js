PageData.register('scenario-based-questions', {
    title: 'Scenario-Based Interview Questions',
    description: 'Production-focused scenario questions that test architecture, debugging, scalability, and real-world engineering experience across .NET, Angular, SQL, and cloud systems.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>Scenario-based interview questions simulate real production challenges that engineers face daily. Unlike trivia questions that test memorization, scenarios evaluate how you <strong>think through problems</strong>, communicate trade-offs, and apply experience under pressure.</p>
<p>Interviewers use these questions because they reveal:</p>
<ul>
<li><strong>Diagnostic reasoning</strong> — Can you break a vague problem into concrete investigation steps?</li>
<li><strong>Depth vs breadth</strong> — Do you know when to go deep on a root cause vs when to apply a known pattern?</li>
<li><strong>Production awareness</strong> — Do you consider monitoring, rollback, and user impact in your solutions?</li>
<li><strong>Communication</strong> — Can you explain technical decisions clearly to mixed audiences?</li>
</ul>
<p>The best answers demonstrate a structured approach, acknowledge trade-offs, and show awareness of the full system lifecycle — not just the happy path.</p>`
        },
        {
            title: 'How to Structure Your Answer',
            content: `<p>The classic STAR method (Situation, Task, Action, Result) works for behavioral questions, but technical scenarios need a more diagnostic framework. Use this adapted structure:</p>
<ol>
<li><strong>Clarify</strong> — Ask clarifying questions to narrow the problem scope. What changed? When did it start? What is the blast radius?</li>
<li><strong>Diagnose</strong> — Walk through your investigation steps systematically. Start broad (metrics, logs) then narrow to a root cause.</li>
<li><strong>Solution</strong> — Propose a fix with implementation details. Show you can write the code, not just describe it abstractly.</li>
<li><strong>Trade-offs</strong> — Acknowledge what you are giving up. Every solution has cost, complexity, or latency implications.</li>
<li><strong>Monitoring</strong> — Explain how you would verify the fix works and prevent recurrence. Alerts, dashboards, tests.</li>
</ol>
<p>This framework shows maturity because it mirrors how senior engineers actually resolve incidents in production. Interviewers want to see the full lifecycle, not just a textbook answer.</p>`,
            code: `// Example structured answer skeleton:
// 1. CLARIFY: "When did this start? Was there a recent deployment?"
// 2. DIAGNOSE: Check APM traces → identify slow endpoint → profile DB calls
// 3. SOLUTION: Add missing index, implement caching layer
// 4. TRADE-OFFS: Index adds write overhead, cache adds staleness risk
// 5. MONITORING: Add latency alerts, dashboard for p95/p99 response times`,
            language: 'javascript'
        },
        {
            title: 'Visual Diagram',
            content: `<p>The following diagram illustrates the structured answer framework for scenario-based questions. Each stage builds on the previous one, creating a complete narrative from problem identification to long-term prevention.</p>`,
            mermaid: `graph TD
    A[Problem Statement] --> B[1. Clarify]
    B --> B1[What changed recently?]
    B --> B2[What is the impact radius?]
    B --> B3[When did it start?]
    B1 --> C[2. Diagnose]
    B2 --> C
    B3 --> C
    C --> C1[Check Metrics & Logs]
    C --> C2[Reproduce if Possible]
    C --> C3[Narrow to Root Cause]
    C1 --> D[3. Solution]
    C2 --> D
    C3 --> D
    D --> D1[Immediate Fix / Hotfix]
    D --> D2[Long-term Refactor]
    D1 --> E[4. Trade-offs]
    D2 --> E
    E --> E1[Performance vs Complexity]
    E --> E2[Speed vs Correctness]
    E --> E3[Cost vs Reliability]
    E1 --> F[5. Monitoring]
    E2 --> F
    E3 --> F
    F --> F1[Alerts on Key Metrics]
    F --> F2[Dashboards for Visibility]
    F --> F3[Post-mortem & Prevention]`
        },
        {
            title: 'Categories',
            content: `<p>Scenario questions typically fall into five categories. Understanding which category a question targets helps you structure your answer with the right emphasis.</p>`,
            table: {
                headers: ['Category', 'Focus Area', 'Example Question', 'Key Skills Tested'],
                rows: [
                    ['Performance', 'Speed, latency, throughput', 'API response time degraded after deployment', 'Profiling, caching, async patterns, database optimization'],
                    ['Security', 'Auth, data protection, compliance', 'How would you secure inter-service communication?', 'OAuth2, mTLS, encryption, threat modeling'],
                    ['Architecture', 'System design, scalability, patterns', 'Design a multi-tenant SaaS application', 'SOLID, microservices, event-driven, CAP theorem'],
                    ['Debugging', 'Root cause analysis, observability', 'Production bug cannot be reproduced locally', 'Distributed tracing, structured logging, feature flags'],
                    ['DevOps', 'CI/CD, deployment, reliability', 'Production deployment fails — how do you roll back?', 'Blue-green, canary, IaC, health checks, SRE practices']
                ]
            }
        },
        {
            title: 'Interview Tips',
            content: `<p>Scenario questions are where experienced engineers shine. Here is what separates great answers from average ones.</p>`,
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For in Scenario Answers',
                text: `<ul>
<li><strong>Structured thinking</strong> — Don't jump to a solution. Show your diagnostic process step by step.</li>
<li><strong>Ask clarifying questions</strong> — Even in interviews, asking "what changed?" or "what is the scale?" shows maturity.</li>
<li><strong>Show depth AND breadth</strong> — Mention multiple options, then go deep on the one you would choose and explain why.</li>
<li><strong>Acknowledge trade-offs</strong> — Every solution has a cost. Saying "the downside is..." shows real-world awareness.</li>
<li><strong>Include monitoring</strong> — Always close with how you would verify the fix and prevent recurrence.</li>
<li><strong>Use real numbers</strong> — "We reduced p95 latency from 3s to 200ms" is more credible than "we made it faster."</li>
<li><strong>Mention the team</strong> — Production incidents involve collaboration. Show you can coordinate, not just code.</li>
<li><strong>Know your tools</strong> — Reference specific tools (Application Insights, Seq, MiniProfiler, dotTrace) to show hands-on experience.</li>
</ul>`
            }
        }
    ],
    questions: [
        {
            id: 'scenario-q1',
            level: 'senior',
            title: 'Your Web API suddenly becomes slow after deployment. How would you investigate and fix it?',
            answer: `<p>A systematic approach to post-deployment performance regression:</p>
<p><strong>1. Immediate Triage (first 5 minutes):</strong></p>
<ul>
<li>Check APM dashboard (Application Insights, Datadog) for latency spike timing — does it correlate exactly with deployment?</li>
<li>Compare p50/p95/p99 latency before and after deployment</li>
<li>Check if ALL endpoints are slow or specific ones (narrows the scope)</li>
<li>Check error rates — slow might mean retries or exceptions being swallowed</li>
</ul>
<p><strong>2. Common Culprits After Deployment:</strong></p>
<ul>
<li><strong>N+1 queries</strong> — New EF Core navigation property loaded without Include()</li>
<li><strong>Missing indexes</strong> — EF migration added a column queried without index</li>
<li><strong>Thread pool starvation</strong> — Sync-over-async (.Result or .Wait()) blocking threads</li>
<li><strong>Memory leak</strong> — Large object heap pressure causing GC pauses</li>
<li><strong>External dependency</strong> — New HTTP call without timeout/circuit breaker</li>
</ul>
<p><strong>3. Diagnostic Tools:</strong></p>`,
            code: `// Diagnostic middleware to identify slow requests
public class SlowRequestMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SlowRequestMiddleware> _logger;

    public SlowRequestMiddleware(RequestDelegate next, ILogger<SlowRequestMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        await _next(context);
        sw.Stop();

        if (sw.ElapsedMilliseconds > 1000)
        {
            _logger.LogWarning(
                "Slow request: {Method} {Path} took {Elapsed}ms",
                context.Request.Method,
                context.Request.Path,
                sw.ElapsedMilliseconds);
        }
    }
}

// Check for thread pool starvation
ThreadPool.GetAvailableThreads(out int workerThreads, out int completionPortThreads);
ThreadPool.GetMaxThreads(out int maxWorker, out int maxCompletion);
var threadPoolUtilization = 1.0 - ((double)workerThreads / maxWorker);
// If utilization > 0.8, you likely have sync-over-async blocking`
        },
        {
            id: 'scenario-q2',
            level: 'mid',
            title: 'Multiple users update the same record simultaneously. How would you handle concurrency in EF Core?',
            answer: `<p><strong>Optimistic Concurrency</strong> is the standard approach for web applications where conflicts are rare but must be handled gracefully.</p>
<p><strong>How it works:</strong></p>
<ol>
<li>Add a <code>RowVersion</code> column (SQL Server timestamp/rowversion type)</li>
<li>EF Core includes the version in the WHERE clause of UPDATE statements</li>
<li>If another user modified the row, the WHERE matches zero rows → DbUpdateConcurrencyException</li>
<li>Catch the exception and decide: retry, merge, or notify the user</li>
</ol>
<p><strong>When to use Optimistic vs Pessimistic:</strong></p>
<ul>
<li><strong>Optimistic</strong> — Web apps, low contention, user can retry (most cases)</li>
<li><strong>Pessimistic</strong> — Financial transactions, inventory decrements, high contention on specific rows</li>
</ul>`,
            code: `// Entity with concurrency token
public class Order
{
    public int Id { get; set; }
    public string Status { get; set; }
    public decimal Total { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; }
}

// DbContext configuration
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Order>()
        .Property(o => o.RowVersion)
        .IsRowVersion();
}

// Handling the concurrency conflict
public async Task<Result> UpdateOrderAsync(int orderId, UpdateOrderDto dto)
{
    const int maxRetries = 3;
    for (int attempt = 0; attempt < maxRetries; attempt++)
    {
        try
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null) return Result.NotFound();

            order.Status = dto.Status;
            order.Total = dto.Total;

            await _context.SaveChangesAsync();
            return Result.Success();
        }
        catch (DbUpdateConcurrencyException ex)
        {
            var entry = ex.Entries.Single();
            await entry.ReloadAsync(); // Get fresh values from DB

            if (attempt == maxRetries - 1)
                return Result.Conflict("Record was modified by another user.");
        }
    }
    return Result.Failure("Max retries exceeded.");
}`
        },
        {
            id: 'scenario-q3',
            level: 'senior',
            title: 'Your application starts receiving thousands of requests per minute. How would you improve scalability?',
            answer: `<p>Scalability is a multi-layered concern. Address it at each tier:</p>
<p><strong>1. Application Layer:</strong></p>
<ul>
<li><strong>Horizontal scaling</strong> — Stateless services behind a load balancer (round-robin or least-connections)</li>
<li><strong>Async processing</strong> — Offload heavy work to background queues (RabbitMQ, Azure Service Bus)</li>
<li><strong>Response caching</strong> — Cache API responses for GET endpoints with appropriate TTL</li>
<li><strong>Rate limiting</strong> — Protect backend from abuse with token bucket or sliding window</li>
</ul>
<p><strong>2. Data Layer:</strong></p>
<ul>
<li><strong>Read replicas</strong> — Route read queries to replicas, writes to primary</li>
<li><strong>Connection pooling</strong> — Use PgBouncer or built-in pool sizing to avoid exhaustion</li>
<li><strong>Caching layer</strong> — Redis for hot data (user sessions, config, frequently-read entities)</li>
<li><strong>Database sharding</strong> — Partition by tenant/region for very high scale</li>
</ul>
<p><strong>3. Infrastructure:</strong></p>
<ul>
<li><strong>CDN</strong> — Static assets and cacheable API responses at the edge</li>
<li><strong>Auto-scaling</strong> — Scale pods/instances based on CPU, memory, or custom metrics</li>
<li><strong>Circuit breakers</strong> — Prevent cascade failures with Polly policies</li>
</ul>
<p><strong>4. Architecture Patterns:</strong></p>
<ul>
<li><strong>CQRS</strong> — Separate read and write models for independent scaling</li>
<li><strong>Event-driven</strong> — Decouple services with events for eventual consistency</li>
<li><strong>Backpressure</strong> — Use bounded channels to control ingestion rate</li>
</ul>`
        },
        {
            id: 'scenario-q4',
            level: 'senior',
            title: 'An API endpoint consistently takes over 10 seconds to respond. How would you identify the bottleneck?',
            answer: `<p><strong>Systematic bottleneck identification:</strong></p>
<p><strong>Step 1: Measure, don't guess</strong></p>
<ul>
<li>Add distributed tracing (OpenTelemetry) to see time spent in each span</li>
<li>Use MiniProfiler in development to see SQL queries inline</li>
<li>Check Application Insights dependency tracking for external call durations</li>
</ul>
<p><strong>Step 2: Common 10-second culprits:</strong></p>
<ul>
<li><strong>N+1 queries</strong> — 1 query to load parent + N queries for children (profile shows hundreds of small queries)</li>
<li><strong>Missing index</strong> — Table scan on millions of rows (execution plan shows Clustered Index Scan)</li>
<li><strong>External HTTP call</strong> — Timeout set to 10s on a downstream service that is not responding</li>
<li><strong>Sync-over-async</strong> — .Result blocking the thread pool, causing queuing</li>
<li><strong>Large payload serialization</strong> — Returning entire entity graphs instead of projections</li>
</ul>
<p><strong>Step 3: Fix by category:</strong></p>
<ul>
<li>N+1 → Add .Include() or use projection with .Select()</li>
<li>Missing index → Analyze execution plan, add covering index</li>
<li>External call → Add timeout, circuit breaker, and caching</li>
<li>Large payload → Use DTOs, pagination, or GraphQL-style field selection</li>
</ul>`,
            code: `// MiniProfiler integration for identifying slow queries
public void ConfigureServices(IServiceCollection services)
{
    services.AddMiniProfiler(options =>
    {
        options.RouteBasePath = "/profiler";
        options.SqlFormatter = new StackExchange.Profiling.SqlFormatters.InlineFormatter();
        options.TrackConnectionOpenClose = true;
    }).AddEntityFramework();
}

// OpenTelemetry span for custom timing
using var activity = ActivitySource.StartActivity("ProcessOrder");
activity?.SetTag("order.id", orderId);

var dbResult = await _repository.GetOrderAsync(orderId); // Span: db query
activity?.AddEvent(new ActivityEvent("db_query_complete"));

var enriched = await _enrichmentService.EnrichAsync(dbResult); // Span: external call
activity?.AddEvent(new ActivityEvent("enrichment_complete"));`
        },
        {
            id: 'scenario-q5',
            level: 'mid',
            title: 'A SQL query performs poorly on a table with millions of rows. How would you optimize it?',
            answer: `<p><strong>Systematic SQL optimization approach:</strong></p>
<p><strong>1. Get the execution plan</strong> — Always start here. Look for:</p>
<ul>
<li>Table/Clustered Index Scans (reading entire table)</li>
<li>Key Lookups (index found the row but needs to go back to clustered index for extra columns)</li>
<li>Hash Match joins on large datasets (might need index on join key)</li>
<li>Sort operations without supporting index</li>
</ul>
<p><strong>2. Indexing strategy:</strong></p>
<ul>
<li>Add indexes on WHERE clause columns, JOIN keys, and ORDER BY columns</li>
<li>Use covering indexes (INCLUDE) to eliminate key lookups</li>
<li>Consider filtered indexes for common query patterns on subsets</li>
<li>Don't over-index — each index adds write overhead</li>
</ul>
<p><strong>3. Query rewriting:</strong></p>
<ul>
<li>Replace SELECT * with specific columns</li>
<li>Use EXISTS instead of IN for subqueries</li>
<li>Avoid functions on indexed columns in WHERE (breaks index usage)</li>
<li>Use pagination (OFFSET/FETCH or keyset pagination for large sets)</li>
</ul>
<p><strong>4. Advanced techniques:</strong></p>
<ul>
<li><strong>Parameter sniffing</strong> — Use OPTIMIZE FOR or RECOMPILE hints when query plan is cached for atypical parameters</li>
<li><strong>Partitioning</strong> — Partition by date range for time-series data</li>
<li><strong>Statistics</strong> — UPDATE STATISTICS if auto-update hasn't caught up with data changes</li>
<li><strong>Columnstore indexes</strong> — For analytical/reporting queries on large fact tables</li>
</ul>`,
            code: `-- Before: Full table scan (3.2 seconds on 5M rows)
SELECT o.Id, o.Total, c.Name
FROM Orders o
JOIN Customers c ON c.Id = o.CustomerId
WHERE o.Status = 'Pending' AND o.CreatedDate > '2024-01-01'
ORDER BY o.CreatedDate DESC;

-- Fix 1: Covering index for the query pattern
CREATE NONCLUSTERED INDEX IX_Orders_Status_Date
ON Orders (Status, CreatedDate DESC)
INCLUDE (Total, CustomerId);

-- Fix 2: Filtered index if 'Pending' is a small subset
CREATE NONCLUSTERED INDEX IX_Orders_Pending
ON Orders (CreatedDate DESC)
INCLUDE (Total, CustomerId)
WHERE Status = 'Pending';

-- Fix 3: Keyset pagination instead of OFFSET (for large page numbers)
-- Instead of: OFFSET 10000 ROWS FETCH NEXT 20 ROWS ONLY
SELECT TOP 20 o.Id, o.Total, c.Name
FROM Orders o
JOIN Customers c ON c.Id = o.CustomerId
WHERE o.Status = 'Pending'
  AND o.CreatedDate < @lastSeenDate  -- cursor from previous page
ORDER BY o.CreatedDate DESC;`
        },
        {
            id: 'scenario-q6',
            level: 'mid',
            title: 'For an Angular + ASP.NET Core application, would you choose JWT or Cookies for authentication? Why?',
            answer: `<p>The answer depends on your architecture. Here is a decision framework:</p>
<p><strong>Cookie-based (Session) Authentication:</strong></p>
<ul>
<li>Best for: Same-domain SPAs, server-rendered pages, BFF (Backend-for-Frontend) pattern</li>
<li>Pros: HttpOnly + Secure + SameSite flags prevent XSS token theft, automatic CSRF protection with anti-forgery tokens, no client-side token management</li>
<li>Cons: Requires same domain (or subdomain), harder with microservices, sticky sessions or distributed cache needed</li>
</ul>
<p><strong>JWT Bearer Token Authentication:</strong></p>
<ul>
<li>Best for: Mobile apps, multi-domain APIs, microservices, third-party integrations</li>
<li>Pros: Stateless (no server session), works across domains, self-contained claims, scales horizontally</li>
<li>Cons: Token storage in browser is vulnerable to XSS, larger payload per request, revocation is complex</li>
</ul>
<p><strong>Recommended Pattern — BFF with Cookies:</strong></p>
<p>For an Angular SPA + ASP.NET Core API on the same domain, use the BFF pattern: Angular talks to a thin backend (cookie auth), which proxies to APIs (JWT internally). This gives you the security of cookies on the client and the flexibility of JWT between services.</p>`,
            code: `// ASP.NET Core Cookie Authentication setup (BFF pattern)
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = 401; // SPA needs 401, not redirect
            return Task.CompletedTask;
        };
    });

// Anti-forgery for SPA (Angular reads XSRF-TOKEN cookie automatically)
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";
    options.Cookie.Name = "XSRF-TOKEN";
    options.Cookie.HttpOnly = false; // Angular needs to read this
});`
        },
        {
            id: 'scenario-q7',
            level: 'senior',
            title: 'A user JWT expires while they are actively using the app. How would you implement refresh tokens securely?',
            answer: `<p><strong>Secure Refresh Token Architecture:</strong></p>
<p><strong>The problem:</strong> Access tokens (JWTs) should be short-lived (5-15 min) for security, but users should not be forced to re-login frequently.</p>
<p><strong>Solution: Refresh Token Rotation</strong></p>
<ol>
<li>On login, issue an access token (short TTL) + refresh token (long TTL, stored server-side)</li>
<li>Store refresh token in HttpOnly, Secure, SameSite=Strict cookie (NOT in localStorage)</li>
<li>When access token expires, client sends refresh token to /auth/refresh</li>
<li>Server validates refresh token, issues NEW access token + NEW refresh token (rotation)</li>
<li>Old refresh token is invalidated immediately (one-time use)</li>
</ol>
<p><strong>Security measures:</strong></p>
<ul>
<li><strong>Token family tracking</strong> — Group all refresh tokens from one login session. If a revoked token is reused, revoke the entire family (detects token theft).</li>
<li><strong>Absolute expiry</strong> — Refresh tokens expire after 7-30 days regardless of rotation</li>
<li><strong>Device binding</strong> — Associate refresh token with device fingerprint</li>
<li><strong>Revocation list</strong> — Maintain a blocklist (Redis) for compromised tokens</li>
</ul>`,
            code: `// Refresh token service implementation
public class RefreshTokenService
{
    private readonly IDistributedCache _cache;
    private readonly ITokenGenerator _tokenGenerator;

    public async Task<TokenPair> RefreshAsync(string refreshToken, string deviceId)
    {
        var storedToken = await _cache.GetAsync<StoredRefreshToken>(
            $"refresh:{refreshToken}");

        if (storedToken == null)
            throw new SecurityTokenException("Invalid refresh token.");

        if (storedToken.IsRevoked)
        {
            // Token reuse detected — revoke entire family
            await RevokeTokenFamilyAsync(storedToken.FamilyId);
            throw new SecurityTokenException("Token reuse detected. All sessions revoked.");
        }

        if (storedToken.DeviceId != deviceId)
            throw new SecurityTokenException("Device mismatch.");

        // Revoke old token
        storedToken.IsRevoked = true;
        await _cache.SetAsync($"refresh:{refreshToken}", storedToken);

        // Issue new pair
        var newAccessToken = _tokenGenerator.GenerateAccessToken(storedToken.UserId);
        var newRefreshToken = _tokenGenerator.GenerateRefreshToken();

        await _cache.SetAsync($"refresh:{newRefreshToken}", new StoredRefreshToken
        {
            UserId = storedToken.UserId,
            FamilyId = storedToken.FamilyId,
            DeviceId = deviceId,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        }, new DistributedCacheEntryOptions
        {
            AbsoluteExpiration = DateTime.UtcNow.AddDays(7)
        });

        return new TokenPair(newAccessToken, newRefreshToken);
    }
}`
        },
        {
            id: 'scenario-q8',
            level: 'mid',
            title: 'How would you protect a REST API against SQL Injection, XSS, and CSRF?',
            answer: `<p><strong>Defense in depth — multiple layers of protection:</strong></p>
<p><strong>SQL Injection Prevention:</strong></p>
<ul>
<li>Always use parameterized queries or ORM (EF Core does this by default)</li>
<li>Never concatenate user input into SQL strings</li>
<li>Use stored procedures with typed parameters for raw SQL needs</li>
<li>Principle of least privilege — DB user should only have needed permissions</li>
</ul>
<p><strong>XSS Prevention:</strong></p>
<ul>
<li>Output encoding (HTML-encode user content before rendering)</li>
<li>Content Security Policy (CSP) headers to restrict script sources</li>
<li>Angular auto-escapes by default — never use innerHTML with untrusted content</li>
<li>Sanitize HTML input if rich text is required (use a whitelist library)</li>
</ul>
<p><strong>CSRF Prevention:</strong></p>
<ul>
<li>SameSite=Strict on auth cookies (blocks cross-site requests)</li>
<li>Anti-forgery tokens for cookie-based auth (Angular XSRF-TOKEN pattern)</li>
<li>For JWT Bearer auth, CSRF is not applicable (no automatic credential sending)</li>
<li>Verify Origin/Referer headers as additional defense</li>
</ul>`,
            code: `// SAFE: Parameterized query with Dapper
var user = await connection.QuerySingleOrDefaultAsync<User>(
    "SELECT * FROM Users WHERE Email = @Email AND TenantId = @TenantId",
    new { Email = userInput, TenantId = tenantId });

// DANGEROUS: String concatenation (NEVER do this)
// var sql = $"SELECT * FROM Users WHERE Email = '{userInput}'";

// CSP Header middleware
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});

// Input validation with FluentValidation
public class CreateUserValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100)
            .Matches(@"^[a-zA-Z\\s\\-']+$").WithMessage("Name contains invalid characters.");
    }
}`
        },
        {
            id: 'scenario-q9',
            level: 'mid',
            title: 'Users occasionally upload corrupted files. How would you investigate the issue?',
            answer: `<p><strong>File upload integrity investigation:</strong></p>
<p><strong>1. Identify where corruption happens:</strong></p>
<ul>
<li>Is the file corrupted before upload (client-side issue)?</li>
<li>During transfer (network/encoding issue)?</li>
<li>During server processing (buffer/stream issue)?</li>
<li>During storage (disk/cloud write issue)?</li>
</ul>
<p><strong>2. Diagnostic steps:</strong></p>
<ul>
<li>Add checksum verification — client computes SHA256 before upload, server verifies after receipt</li>
<li>Check Content-Type vs actual file magic bytes (first few bytes identify real file type)</li>
<li>Verify multipart encoding — ensure no charset conversion is mangling binary data</li>
<li>Check file size limits — partial uploads due to timeout or size cap</li>
</ul>
<p><strong>3. Common causes:</strong></p>
<ul>
<li><strong>Base64 encoding overhead</strong> — Using JSON with base64 instead of multipart/form-data doubles memory</li>
<li><strong>Stream not flushed</strong> — Writing to disk without await/flush loses final buffer</li>
<li><strong>Antivirus scanning</strong> — File locked mid-write by server AV software</li>
<li><strong>Proxy buffering</strong> — Reverse proxy (nginx) has body size limit, truncates silently</li>
</ul>`,
            code: `// Robust file upload with validation
[HttpPost("upload")]
[RequestSizeLimit(50_000_000)] // 50MB limit
public async Task<IActionResult> Upload(IFormFile file, [FromHeader] string? checksum)
{
    // 1. Validate file is not empty
    if (file == null || file.Length == 0)
        return BadRequest("No file provided.");

    // 2. Validate magic bytes (file signature)
    using var stream = file.OpenReadStream();
    var header = new byte[8];
    await stream.ReadAsync(header, 0, 8);
    stream.Position = 0;

    if (!IsValidFileSignature(file.ContentType, header))
        return BadRequest("File type does not match content.");

    // 3. Compute checksum and verify against client-provided hash
    using var sha256 = SHA256.Create();
    var hashBytes = await sha256.ComputeHashAsync(stream);
    var serverChecksum = Convert.ToHexString(hashBytes).ToLowerInvariant();
    stream.Position = 0;

    if (checksum != null && checksum != serverChecksum)
        return BadRequest("Checksum mismatch — file may be corrupted in transit.");

    // 4. Stream directly to storage (don't buffer entire file in memory)
    var blobClient = _container.GetBlobClient($"{Guid.NewGuid()}/{file.FileName}");
    await blobClient.UploadAsync(stream, overwrite: true);

    return Ok(new { checksum = serverChecksum, size = file.Length });
}`
        },
        {
            id: 'scenario-q10',
            level: 'senior',
            title: 'Your application must send thousands of emails without slowing down user requests. What architecture would you choose?',
            answer: `<p><strong>Asynchronous email architecture with guaranteed delivery:</strong></p>
<p><strong>The problem:</strong> Sending emails synchronously blocks the HTTP request (SMTP takes 1-5 seconds). At scale, this exhausts thread pool and causes timeouts.</p>
<p><strong>Architecture: Transactional Outbox + Background Worker</strong></p>
<ol>
<li><strong>Request handler</strong> — Saves email to an outbox table in the same DB transaction as the business operation</li>
<li><strong>Background worker</strong> — Polls the outbox (or uses Change Data Capture) and publishes to a message queue</li>
<li><strong>Email consumer</strong> — Reads from queue, sends via SMTP/SendGrid, marks as sent</li>
<li><strong>Dead letter queue</strong> — Failed emails after max retries go here for manual review</li>
</ol>
<p><strong>Why this pattern?</strong></p>
<ul>
<li><strong>Guaranteed delivery</strong> — Email is persisted before acknowledgment; no lost emails if process crashes</li>
<li><strong>Retry with backoff</strong> — Transient SMTP failures auto-retry without user awareness</li>
<li><strong>Scalability</strong> — Add more consumer instances to handle volume spikes</li>
<li><strong>Observability</strong> — Outbox table provides audit trail of all emails sent/pending/failed</li>
</ul>`,
            code: `// 1. Outbox entity
public class EmailOutbox
{
    public long Id { get; set; }
    public string To { get; set; }
    public string Subject { get; set; }
    public string Body { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public int RetryCount { get; set; }
    public string? Error { get; set; }
    public EmailStatus Status { get; set; } // Pending, Sent, Failed
}

// 2. Service method — save email in same transaction as business logic
public async Task PlaceOrderAsync(OrderDto dto)
{
    await using var transaction = await _context.Database.BeginTransactionAsync();

    var order = new Order { /* ... */ };
    _context.Orders.Add(order);

    _context.EmailOutbox.Add(new EmailOutbox
    {
        To = dto.CustomerEmail,
        Subject = $"Order #{order.Id} Confirmed",
        Body = _templateService.RenderOrderConfirmation(order),
        CreatedAt = DateTime.UtcNow,
        Status = EmailStatus.Pending
    });

    await _context.SaveChangesAsync();
    await transaction.CommitAsync();
    // HTTP response returns immediately — email sent async
}

// 3. Background worker (Hosted Service)
public class EmailOutboxWorker : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var pending = await _context.EmailOutbox
                .Where(e => e.Status == EmailStatus.Pending && e.RetryCount < 5)
                .OrderBy(e => e.CreatedAt)
                .Take(50)
                .ToListAsync(ct);

            foreach (var email in pending)
            {
                try
                {
                    await _smtpClient.SendAsync(email.To, email.Subject, email.Body);
                    email.Status = EmailStatus.Sent;
                    email.SentAt = DateTime.UtcNow;
                }
                catch (Exception ex)
                {
                    email.RetryCount++;
                    email.Error = ex.Message;
                    if (email.RetryCount >= 5)
                        email.Status = EmailStatus.Failed;
                }
            }
            await _context.SaveChangesAsync(ct);
            await Task.Delay(TimeSpan.FromSeconds(5), ct);
        }
    }
}`
        },
        {
            id: 'scenario-q11',
            level: 'mid',
            title: 'How would you reduce database load using caching?',
            answer: `<p><strong>Cache-Aside Pattern with Redis:</strong></p>
<p><strong>Strategy:</strong> Application checks cache first. On miss, reads from DB, writes to cache, returns data. On subsequent requests, cache serves directly.</p>
<p><strong>Key decisions:</strong></p>
<ul>
<li><strong>What to cache:</strong> Frequently read, rarely changed data (config, product catalogs, user profiles)</li>
<li><strong>TTL design:</strong> Short (30s-5min) for volatile data, longer (1hr+) for stable data</li>
<li><strong>Invalidation strategy:</strong> Time-based expiry, event-based invalidation, or write-through</li>
</ul>
<p><strong>Cache stampede prevention:</strong></p>
<ul>
<li><strong>Lock pattern</strong> — Only one request refreshes cache; others wait for the result</li>
<li><strong>Stale-while-revalidate</strong> — Serve stale data immediately while refreshing in background</li>
<li><strong>Probabilistic early expiry</strong> — Refresh slightly before TTL expires</li>
</ul>
<p><strong>Distributed vs In-Memory:</strong></p>
<ul>
<li><strong>In-memory (IMemoryCache)</strong> — Single server, fastest, but duplicated across instances and lost on restart</li>
<li><strong>Distributed (Redis)</strong> — Shared across instances, survives restarts, slightly slower (network hop)</li>
<li><strong>Hybrid (L1/L2)</strong> — In-memory as L1 with Redis as L2 fallback</li>
</ul>`,
            code: `// Cache-aside with stampede prevention using SemaphoreSlim
public class CachedProductService
{
    private readonly IDistributedCache _cache;
    private readonly IProductRepository _repository;
    private static readonly SemaphoreSlim _lock = new(1, 1);

    public async Task<Product?> GetProductAsync(int id)
    {
        var cacheKey = $"product:{id}";

        // 1. Try cache
        var cached = await _cache.GetStringAsync(cacheKey);
        if (cached != null)
            return JsonSerializer.Deserialize<Product>(cached);

        // 2. Cache miss — acquire lock to prevent stampede
        await _lock.WaitAsync();
        try
        {
            // Double-check after acquiring lock
            cached = await _cache.GetStringAsync(cacheKey);
            if (cached != null)
                return JsonSerializer.Deserialize<Product>(cached);

            // 3. Load from DB
            var product = await _repository.GetByIdAsync(id);
            if (product == null) return null;

            // 4. Write to cache with TTL
            await _cache.SetStringAsync(cacheKey,
                JsonSerializer.Serialize(product),
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
                });

            return product;
        }
        finally
        {
            _lock.Release();
        }
    }

    // Invalidate on write
    public async Task UpdateProductAsync(Product product)
    {
        await _repository.UpdateAsync(product);
        await _cache.RemoveAsync($"product:{product.Id}");
    }
}`
        },
        {
            id: 'scenario-q12',
            level: 'senior',
            title: 'A production bug cannot be reproduced locally. What is your debugging strategy?',
            answer: `<p><strong>Debugging non-reproducible production issues:</strong></p>
<p><strong>Why it doesn't reproduce locally:</strong></p>
<ul>
<li>Different data volume/distribution (query plan differs)</li>
<li>Race conditions under load (single-user testing misses concurrency bugs)</li>
<li>Environment differences (config, feature flags, certificates, DNS)</li>
<li>State accumulation (memory leak manifests after hours, not minutes)</li>
<li>External dependency behavior (third-party API flakiness)</li>
</ul>
<p><strong>Investigation strategy:</strong></p>
<ol>
<li><strong>Structured logging analysis</strong> — Correlate by request ID, look for patterns in failed requests (specific user? time of day? data size?)</li>
<li><strong>Distributed tracing</strong> — OpenTelemetry traces show the exact path and timing of the failing request</li>
<li><strong>Feature flag isolation</strong> — Toggle features off one by one in production to identify the culprit</li>
<li><strong>Traffic replay</strong> — Capture production request payloads, replay against staging with production data snapshot</li>
<li><strong>Canary analysis</strong> — Deploy instrumented build to a small percentage of traffic, compare error rates</li>
<li><strong>Snapshot debugging</strong> — Azure App Service snapshot debugger captures call stack at exception time without stopping the process</li>
</ol>
<p><strong>Prevention for next time:</strong></p>
<ul>
<li>Add chaos engineering (Polly fault injection in staging)</li>
<li>Load test with production-like data volumes</li>
<li>Implement health checks that detect the specific condition</li>
</ul>`
        },
        {
            id: 'scenario-q13',
            level: 'architect',
            title: 'How would you design a multi-tenant application using a shared database?',
            answer: `<p><strong>Multi-tenancy with shared database — Row-Level Security approach:</strong></p>
<p><strong>Three isolation strategies:</strong></p>
<ul>
<li><strong>Database per tenant</strong> — Maximum isolation, highest cost, complex management</li>
<li><strong>Schema per tenant</strong> — Good isolation, moderate cost, migration complexity</li>
<li><strong>Shared schema (row-level)</strong> — Lowest cost, requires careful implementation</li>
</ul>
<p><strong>Shared schema implementation:</strong></p>
<ol>
<li>Every table has a TenantId column (non-nullable, indexed)</li>
<li>EF Core global query filter automatically adds WHERE TenantId = @current</li>
<li>Tenant resolved from JWT claim, subdomain, or header</li>
<li>SQL Server Row-Level Security as a second defense layer</li>
</ol>
<p><strong>Critical safeguards:</strong></p>
<ul>
<li><strong>Never trust client-provided TenantId</strong> — Always derive from authenticated token</li>
<li><strong>Unique constraints include TenantId</strong> — (TenantId, Email) not just (Email)</li>
<li><strong>Test with multiple tenants</strong> — Integration tests verify cross-tenant data isolation</li>
<li><strong>Audit trail</strong> — Log any query that touches data outside the resolved tenant</li>
</ul>`,
            code: `// 1. Tenant resolution middleware
public class TenantMiddleware
{
    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
    {
        var tenantId = context.User.FindFirstValue("tenant_id");
        if (string.IsNullOrEmpty(tenantId))
        {
            context.Response.StatusCode = 403;
            return;
        }
        tenantContext.TenantId = Guid.Parse(tenantId);
        await _next(context);
    }
}

// 2. EF Core global query filter
public class AppDbContext : DbContext
{
    private readonly ITenantContext _tenant;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Automatically filter ALL queries by tenant
        modelBuilder.Entity<Order>()
            .HasQueryFilter(o => o.TenantId == _tenant.TenantId);
        modelBuilder.Entity<Customer>()
            .HasQueryFilter(c => c.TenantId == _tenant.TenantId);
        modelBuilder.Entity<Product>()
            .HasQueryFilter(p => p.TenantId == _tenant.TenantId);
    }

    // Override SaveChanges to auto-set TenantId on new entities
    public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        foreach (var entry in ChangeTracker.Entries<ITenantEntity>()
            .Where(e => e.State == EntityState.Added))
        {
            entry.Entity.TenantId = _tenant.TenantId;
        }
        return await base.SaveChangesAsync(ct);
    }
}

// 3. SQL Server Row-Level Security (defense in depth)
// CREATE SECURITY POLICY TenantFilter
// ADD FILTER PREDICATE dbo.fn_TenantPredicate(TenantId) ON dbo.Orders,
// ADD FILTER PREDICATE dbo.fn_TenantPredicate(TenantId) ON dbo.Customers;`
        },
        {
            id: 'scenario-q14',
            level: 'mid',
            title: 'How would you implement Role-Based Access Control (RBAC) in ASP.NET Core?',
            answer: `<p><strong>Claims-based RBAC with policy authorization:</strong></p>
<p><strong>Three layers of authorization in ASP.NET Core:</strong></p>
<ol>
<li><strong>Role-based</strong> — Simple [Authorize(Roles = "Admin")] attribute</li>
<li><strong>Policy-based</strong> — Custom requirements with handlers (recommended for complex rules)</li>
<li><strong>Resource-based</strong> — Authorization depends on the specific resource being accessed</li>
</ol>
<p><strong>Recommended approach: Policy + Claims</strong></p>
<ul>
<li>Store permissions as claims in JWT (or load from DB on auth)</li>
<li>Define policies that check for specific permissions</li>
<li>Use IAuthorizationHandler for complex logic (time-based, resource-based, hierarchical)</li>
</ul>
<p><strong>Database model:</strong></p>
<ul>
<li>Users → UserRoles → Roles → RolePermissions → Permissions</li>
<li>Permissions are granular: "orders.read", "orders.write", "orders.delete"</li>
<li>Roles group permissions: "OrderManager" = orders.read + orders.write</li>
</ul>`,
            code: `// 1. Define policies in Program.cs
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanManageOrders", policy =>
        policy.RequireClaim("permission", "orders.write"));

    options.AddPolicy("CanDeleteOrders", policy =>
        policy.Requirements.Add(new PermissionRequirement("orders.delete")));

    options.AddPolicy("CanAccessResource", policy =>
        policy.Requirements.Add(new ResourceOwnerRequirement()));
});

// 2. Custom authorization handler
public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly IPermissionService _permissions;

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var hasPermission = await _permissions.UserHasPermissionAsync(
            userId, requirement.Permission);

        if (hasPermission)
            context.Succeed(requirement);
    }
}

// 3. Resource-based authorization in controller
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteOrder(int id)
{
    var order = await _orderService.GetByIdAsync(id);
    if (order == null) return NotFound();

    var authResult = await _authorizationService.AuthorizeAsync(
        User, order, "CanDeleteOwnOrders");

    if (!authResult.Succeeded) return Forbid();

    await _orderService.DeleteAsync(id);
    return NoContent();
}`
        },
        {
            id: 'scenario-q15',
            level: 'mid',
            title: 'How would you secure connection strings, secrets, and API keys in Azure?',
            answer: `<p><strong>Secret management hierarchy (most to least secure):</strong></p>
<ol>
<li><strong>Azure Key Vault + Managed Identity</strong> — No secrets in code, config, or environment variables at all</li>
<li><strong>Azure App Configuration</strong> — Centralized config with Key Vault references</li>
<li><strong>Environment variables (deployment pipeline)</strong> — Secrets injected at deploy time, not stored in repo</li>
<li><strong>User Secrets (dev only)</strong> — Local development, never committed to source control</li>
</ol>
<p><strong>Key principles:</strong></p>
<ul>
<li><strong>No secrets in source control</strong> — Use .gitignore for appsettings.Development.json, scan commits with git-secrets</li>
<li><strong>No secrets in appsettings.json</strong> — Production config should reference Key Vault, not contain values</li>
<li><strong>Managed Identity</strong> — Eliminates credentials entirely; Azure services authenticate via Azure AD without client secrets</li>
<li><strong>Secret rotation</strong> — Automate rotation with Key Vault rotation policies + Event Grid notifications</li>
<li><strong>Least privilege</strong> — Each service gets its own Managed Identity with minimal Key Vault access policies</li>
</ul>`,
            code: `// Program.cs — Azure Key Vault integration with Managed Identity
var builder = WebApplication.CreateBuilder(args);

// Add Key Vault configuration provider
if (!builder.Environment.IsDevelopment())
{
    var keyVaultUrl = builder.Configuration["KeyVault:Url"];
    builder.Configuration.AddAzureKeyVault(
        new Uri(keyVaultUrl),
        new DefaultAzureCredential()); // Uses Managed Identity in Azure
}

// Access secrets just like normal configuration
var connectionString = builder.Configuration["DatabaseConnectionString"];
// Key Vault secret named "DatabaseConnectionString" is automatically resolved

// For local development, use User Secrets
// dotnet user-secrets set "DatabaseConnectionString" "Server=..."

// DefaultAzureCredential chain:
// 1. Environment variables (CI/CD)
// 2. Managed Identity (Azure hosting)
// 3. Visual Studio credential (dev machine)
// 4. Azure CLI credential (dev machine)
// 5. Interactive browser (fallback)

// Key Vault reference in Azure App Configuration
// @Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/DbConn)
// This lets App Configuration resolve the secret at runtime without app code changes`
        },
        {
            id: 'scenario-q16',
            level: 'mid',
            title: 'Your Angular application becomes noticeably slower as it grows. How would you optimize it?',
            answer: `<p><strong>Angular performance optimization checklist:</strong></p>
<p><strong>1. Change Detection:</strong></p>
<ul>
<li>Switch to <code>OnPush</code> change detection strategy on all components</li>
<li>Use immutable data patterns (spread operator, signals) to trigger OnPush correctly</li>
<li>Avoid calling functions in templates — use pipes or computed signals instead</li>
</ul>
<p><strong>2. Bundle Size:</strong></p>
<ul>
<li>Lazy load routes with <code>loadComponent</code> or <code>loadChildren</code></li>
<li>Use <code>@defer</code> blocks for below-the-fold content</li>
<li>Analyze bundle with <code>ng build --stats-json</code> + webpack-bundle-analyzer</li>
<li>Tree-shake unused imports (avoid barrel file re-exports of entire libraries)</li>
</ul>
<p><strong>3. Rendering Performance:</strong></p>
<ul>
<li>Virtual scrolling (<code>@angular/cdk/scrolling</code>) for long lists</li>
<li><code>trackBy</code> function on all *ngFor / @for loops</li>
<li>Debounce rapid user input (search boxes, resize events)</li>
<li>Use <code>loading="lazy"</code> on images below the fold</li>
</ul>
<p><strong>4. Network:</strong></p>
<ul>
<li>HTTP interceptor for caching GET requests</li>
<li>Prefetch critical data with route resolvers</li>
<li>Use pagination/infinite scroll instead of loading all records</li>
</ul>`,
            code: `// OnPush with signals (Angular 17+)
@Component({
  selector: 'app-product-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @defer (on viewport) {
      <div class="products">
        @for (product of filteredProducts(); track product.id) {
          <app-product-card [product]="product" />
        }
      </div>
    } @placeholder {
      <app-skeleton-loader />
    }
  \`
})
export class ProductListComponent {
  private products = signal<Product[]>([]);
  private searchTerm = signal('');

  // Computed signal — only recalculates when dependencies change
  filteredProducts = computed(() =>
    this.products().filter(p =>
      p.name.toLowerCase().includes(this.searchTerm().toLowerCase())
    )
  );
}

// Virtual scrolling for large lists
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  template: \`
    <cdk-virtual-scroll-viewport itemSize="48" class="list-viewport">
      <div *cdkVirtualFor="let item of items; trackBy: trackById" class="list-item">
        {{ item.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  \`
})
export class LargeListComponent {
  trackById = (_: number, item: Item) => item.id;
}`
        },
        {
            id: 'scenario-q17',
            level: 'junior',
            title: 'How would you implement lazy loading in Angular?',
            answer: `<p><strong>Lazy loading reduces initial bundle size by loading code only when needed.</strong></p>
<p><strong>Three approaches in modern Angular:</strong></p>
<p><strong>1. Route-based lazy loading (most common):</strong></p>
<ul>
<li>Use <code>loadComponent</code> or <code>loadChildren</code> in route definitions</li>
<li>Each lazy route becomes a separate chunk (JS file) loaded on navigation</li>
<li>User only downloads code for pages they actually visit</li>
</ul>
<p><strong>2. Template-based deferral (@defer):</strong></p>
<ul>
<li>Angular 17+ <code>@defer</code> blocks load components when a trigger fires (viewport, interaction, timer)</li>
<li>Great for below-the-fold content, modals, and heavy widgets</li>
</ul>
<p><strong>3. Preloading strategies:</strong></p>
<ul>
<li><code>PreloadAllModules</code> — Lazy load initially, then preload everything in background</li>
<li>Custom strategy — Preload based on user role or predicted navigation</li>
</ul>`,
            code: `// Route-based lazy loading (standalone components)
export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes')
      .then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard]
  }
];

// Preloading strategy
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules))
  ]
};

// @defer block (Angular 17+)
@Component({
  template: \`
    <h1>Product Page</h1>
    <app-product-info [product]="product" />

    @defer (on viewport) {
      <app-reviews [productId]="product.id" />
    } @loading (minimum 200ms) {
      <app-spinner />
    } @placeholder {
      <div class="reviews-placeholder">Scroll to see reviews</div>
    }

    @defer (on interaction) {
      <app-heavy-chart [data]="chartData" />
    } @placeholder {
      <button>Load Chart</button>
    }
  \`
})
export class ProductPageComponent { }`
        },
        {
            id: 'scenario-q18',
            level: 'mid',
            title: 'What is your preferred approach for state management across Angular components?',
            answer: `<p><strong>State management decision framework — match complexity to solution:</strong></p>
<p><strong>Level 1: Component-local state (Signals)</strong></p>
<ul>
<li>Use for: Form state, UI toggles, component-specific data</li>
<li>Tool: Angular Signals (<code>signal()</code>, <code>computed()</code>, <code>effect()</code>)</li>
<li>When: State is owned by one component and its children</li>
</ul>
<p><strong>Level 2: Shared state (Injectable Service + Signals)</strong></p>
<ul>
<li>Use for: State shared between siblings/unrelated components</li>
<li>Tool: Service with signals, provided at appropriate injector level</li>
<li>When: 2-5 components need the same data, no time-travel debugging needed</li>
</ul>
<p><strong>Level 3: Complex application state (NgRx SignalStore or ComponentStore)</strong></p>
<ul>
<li>Use for: Global state, complex async flows, audit/undo requirements</li>
<li>Tool: NgRx SignalStore (modern) or NgRx Store (classic Redux pattern)</li>
<li>When: Many producers/consumers, need devtools, team requires structure</li>
</ul>
<p><strong>Anti-patterns to avoid:</strong></p>
<ul>
<li>Don't use NgRx for everything — over-engineering simple state adds boilerplate</li>
<li>Don't pass state through 5+ levels of @Input — use a service or signal store</li>
<li>Don't mix patterns randomly — be consistent within a feature module</li>
</ul>`,
            code: `// Level 1: Component-local (signals)
@Component({ /* ... */ })
export class SearchComponent {
  query = signal('');
  results = computed(() => this.allItems().filter(i =>
    i.name.includes(this.query())
  ));
}

// Level 2: Shared service with signals
@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>([]);

  readonly cartItems = this.items.asReadonly();
  readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.qty, 0)
  );
  readonly count = computed(() => this.items().length);

  addItem(product: Product) {
    this.items.update(items => [...items, { ...product, qty: 1 }]);
  }

  removeItem(id: string) {
    this.items.update(items => items.filter(i => i.id !== id));
  }
}

// Level 3: NgRx SignalStore (complex state)
export const OrderStore = signalStore(
  { providedIn: 'root' },
  withState<OrderState>({ orders: [], loading: false, error: null }),
  withComputed((store) => ({
    pendingOrders: computed(() => store.orders().filter(o => o.status === 'pending')),
    orderCount: computed(() => store.orders().length),
  })),
  withMethods((store, orderService = inject(OrderService)) => ({
    async loadOrders() {
      patchState(store, { loading: true });
      try {
        const orders = await firstValueFrom(orderService.getAll());
        patchState(store, { orders, loading: false });
      } catch (error) {
        patchState(store, { error: 'Failed to load', loading: false });
      }
    }
  }))
);`
        },
        {
            id: 'scenario-q19',
            level: 'senior',
            title: 'How would you prevent duplicate requests when users accidentally submit a form multiple times?',
            answer: `<p><strong>Multi-layer duplicate prevention:</strong></p>
<p><strong>Client-side (immediate UX fix):</strong></p>
<ul>
<li>Disable submit button after first click (re-enable on error)</li>
<li>Show loading spinner/overlay to prevent interaction</li>
<li>Debounce rapid clicks (RxJS debounceTime or signal-based throttle)</li>
</ul>
<p><strong>Server-side (guaranteed correctness):</strong></p>
<ul>
<li><strong>Idempotency key</strong> — Client generates a unique key per submission (UUID). Server checks if that key was already processed.</li>
<li><strong>Database unique constraint</strong> — Natural business key prevents duplicate records (e.g., one order per cart session)</li>
<li><strong>Distributed lock</strong> — Redis lock with the idempotency key, TTL of 30 seconds</li>
</ul>
<p><strong>Why both layers matter:</strong></p>
<ul>
<li>Client-side alone fails if the user refreshes or has multiple tabs</li>
<li>Server-side alone gives poor UX (user sees error on second click)</li>
<li>Together: smooth UX + guaranteed data integrity</li>
</ul>`,
            code: `// Server-side idempotency filter (ASP.NET Core)
public class IdempotencyFilter : IAsyncActionFilter
{
    private readonly IDistributedCache _cache;

    public async Task OnActionExecutionAsync(
        ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var idempotencyKey = context.HttpContext.Request
            .Headers["X-Idempotency-Key"].FirstOrDefault();

        if (string.IsNullOrEmpty(idempotencyKey))
        {
            await next(); // No key provided, proceed normally
            return;
        }

        var cacheKey = $"idempotency:{idempotencyKey}";
        var cached = await _cache.GetStringAsync(cacheKey);

        if (cached != null)
        {
            // Already processed — return cached response
            var cachedResponse = JsonSerializer.Deserialize<CachedResponse>(cached);
            context.Result = new ObjectResult(cachedResponse.Body)
            {
                StatusCode = cachedResponse.StatusCode
            };
            return;
        }

        // Process the request
        var result = await next();

        // Cache the response for 24 hours
        if (result.Result is ObjectResult objectResult)
        {
            await _cache.SetStringAsync(cacheKey,
                JsonSerializer.Serialize(new CachedResponse
                {
                    StatusCode = objectResult.StatusCode ?? 200,
                    Body = objectResult.Value
                }),
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
                });
        }
    }
}

// Client-side: Angular service with idempotency
@Injectable({ providedIn: 'root' })
export class OrderService {
  submitOrder(order: Order): Observable<OrderResult> {
    const idempotencyKey = crypto.randomUUID();
    return this.http.post<OrderResult>('/api/orders', order, {
      headers: { 'X-Idempotency-Key': idempotencyKey }
    });
  }
}`
        },
        {
            id: 'scenario-q20',
            level: 'mid',
            title: 'Your application requires real-time notifications. Which technology would you use, and why?',
            answer: `<p><strong>Real-time technology comparison:</strong></p>
<table>
<tr><th>Technology</th><th>Best For</th><th>Limitations</th></tr>
<tr><td><strong>SignalR</strong></td><td>.NET apps, auto fallback, groups/hubs</td><td>Heavier server resources, .NET ecosystem</td></tr>
<tr><td><strong>WebSocket</strong></td><td>Low-latency bidirectional (gaming, chat)</td><td>No auto-reconnect, manual protocol design</td></tr>
<tr><td><strong>Server-Sent Events (SSE)</strong></td><td>One-way server→client (feeds, dashboards)</td><td>Unidirectional only, limited browser connections</td></tr>
</table>
<p><strong>SignalR is recommended for most .NET + Angular applications because:</strong></p>
<ul>
<li>Auto transport negotiation (WebSocket → SSE → Long Polling fallback)</li>
<li>Built-in reconnection with state recovery</li>
<li>Hub abstraction for grouping connections (by user, by room, by tenant)</li>
<li>Scales with Redis backplane or Azure SignalR Service</li>
</ul>
<p><strong>Scaling considerations:</strong></p>
<ul>
<li><strong>Single server</strong> — In-memory works fine up to ~10K connections</li>
<li><strong>Multi-server</strong> — Need Redis backplane (all servers share connection info)</li>
<li><strong>Large scale (100K+)</strong> — Use Azure SignalR Service (managed, serverless option)</li>
</ul>`,
            code: `// ASP.NET Core SignalR Hub
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
        await base.OnConnectedAsync();
    }

    public async Task JoinRoom(string roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"room:{roomId}");
    }
}

// Sending notifications from a service
public class NotificationService
{
    private readonly IHubContext<NotificationHub> _hub;

    public async Task NotifyUserAsync(string userId, Notification notification)
    {
        await _hub.Clients.Group($"user:{userId}")
            .SendAsync("ReceiveNotification", notification);
    }

    public async Task BroadcastToRoomAsync(string roomId, string message)
    {
        await _hub.Clients.Group($"room:{roomId}")
            .SendAsync("ReceiveMessage", message);
    }
}

// Angular client
import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';

export class SignalRService {
  private connection = new HubConnectionBuilder()
    .withUrl('/hubs/notifications', { accessTokenFactory: () => this.authToken })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .build();

  notifications = signal<Notification[]>([]);

  async start() {
    this.connection.on('ReceiveNotification', (notification: Notification) => {
      this.notifications.update(list => [notification, ...list]);
    });
    await this.connection.start();
  }
}`
        },
        {
            id: 'scenario-q21',
            level: 'senior',
            title: 'How would you design logging, monitoring, and alerting for a production system?',
            answer: `<p><strong>The Three Pillars of Observability:</strong></p>
<p><strong>1. Logs (What happened)</strong></p>
<ul>
<li>Structured logging (JSON) with correlation IDs across services</li>
<li>Levels: Debug (dev only), Info (business events), Warning (recoverable), Error (action needed)</li>
<li>Tools: Serilog → Seq/Elasticsearch, or Application Insights</li>
<li>Key: Include context (userId, orderId, tenantId) in every log entry</li>
</ul>
<p><strong>2. Metrics (How much / how fast)</strong></p>
<ul>
<li>RED method: Rate (requests/sec), Errors (error rate), Duration (latency percentiles)</li>
<li>USE method: Utilization, Saturation, Errors (for infrastructure)</li>
<li>Custom business metrics: orders/minute, conversion rate, queue depth</li>
<li>Tools: Prometheus + Grafana, or Azure Monitor</li>
</ul>
<p><strong>3. Traces (Where time is spent)</strong></p>
<ul>
<li>Distributed tracing with OpenTelemetry — follows a request across services</li>
<li>Each span shows: service, operation, duration, status, attributes</li>
<li>Tools: Jaeger, Zipkin, or Application Insights (Application Map)</li>
</ul>
<p><strong>Alerting philosophy:</strong></p>
<ul>
<li><strong>Alert on symptoms, not causes</strong> — Alert on "error rate > 5%" not "CPU > 80%"</li>
<li><strong>SLO-based alerting</strong> — Define Service Level Objectives, alert when error budget is burning too fast</li>
<li><strong>Actionable alerts only</strong> — Every alert should have a runbook. If no action needed, it is a dashboard metric, not an alert.</li>
</ul>`,
            code: `// Structured logging with Serilog
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "OrderService")
    .Enrich.WithProperty("Environment", Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"))
    .WriteTo.Console(new JsonFormatter())
    .WriteTo.Seq("http://seq:5341")
    .CreateLogger();

// Usage in a service
public async Task<Order> PlaceOrderAsync(OrderDto dto)
{
    using var _ = LogContext.PushProperty("OrderId", dto.Id);
    using var __ = LogContext.PushProperty("CustomerId", dto.CustomerId);

    _logger.LogInformation("Order placement started. Total: {Total}", dto.Total);

    try
    {
        var result = await _repository.CreateAsync(dto);
        _logger.LogInformation("Order placed successfully. OrderId: {OrderId}", result.Id);
        return result;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Order placement failed. Reason: {Reason}", ex.Message);
        throw;
    }
}

// OpenTelemetry setup in Program.cs
builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddSqlClientInstrumentation(o => o.SetDbStatementForText = true)
        .AddOtlpExporter())
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddRuntimeInstrumentation()
        .AddPrometheusExporter());`
        },
        {
            id: 'scenario-q22',
            level: 'mid',
            title: 'How would you build a CI/CD pipeline using Azure DevOps or GitHub Actions?',
            answer: `<p><strong>Modern CI/CD pipeline structure:</strong></p>
<p><strong>Stages:</strong></p>
<ol>
<li><strong>Build</strong> — Compile, restore dependencies, generate artifacts</li>
<li><strong>Test</strong> — Unit tests, integration tests, code coverage threshold</li>
<li><strong>Security Scan</strong> — SAST (static analysis), dependency vulnerability check</li>
<li><strong>Package</strong> — Docker build, NuGet pack, npm publish</li>
<li><strong>Deploy to Staging</strong> — Automated deployment to test environment</li>
<li><strong>Integration/E2E Tests</strong> — Run against staging environment</li>
<li><strong>Deploy to Production</strong> — Manual approval gate, then automated deploy</li>
</ol>
<p><strong>Key practices:</strong></p>
<ul>
<li><strong>Branch strategy</strong> — PR triggers build+test, merge to main triggers deploy</li>
<li><strong>Environment gates</strong> — Require approval for production, auto-approve for dev/staging</li>
<li><strong>Artifact immutability</strong> — Build once, deploy the same artifact to all environments</li>
<li><strong>Rollback trigger</strong> — Auto-rollback if health check fails within 5 minutes of deploy</li>
<li><strong>Secret management</strong> — Pipeline variables (masked) or Key Vault integration</li>
</ul>`,
            code: `# GitHub Actions workflow (.github/workflows/deploy.yml)
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'

      - name: Restore
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore --configuration Release

      - name: Test
        run: dotnet test --no-build --configuration Release --collect:"XPlat Code Coverage" --results-directory ./coverage

      - name: Check Coverage Threshold
        run: |
          COVERAGE=$(cat coverage/**/coverage.cobertura.xml | grep -oP 'line-rate="\\K[0-9.]+')
          if (( $(echo "$COVERAGE < 0.80" | bc -l) )); then
            echo "Coverage $COVERAGE is below 80% threshold"
            exit 1
          fi

      - name: Publish
        run: dotnet publish -c Release -o ./publish

      - uses: actions/upload-artifact@v4
        with:
          name: app-artifact
          path: ./publish

  deploy-staging:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: app-artifact
      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: myapp-staging
          publish-profile: \${{ secrets.AZURE_PUBLISH_PROFILE_STAGING }}

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production  # Requires manual approval
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: app-artifact
      - name: Deploy to Production
        uses: azure/webapps-deploy@v3
        with:
          app-name: myapp-production
          publish-profile: \${{ secrets.AZURE_PUBLISH_PROFILE_PROD }}`
        },
        {
            id: 'scenario-q23',
            level: 'senior',
            title: 'A production deployment fails. How would you roll back with minimal downtime?',
            answer: `<p><strong>Deployment rollback strategies (from fastest to most complex):</strong></p>
<p><strong>1. Instant Rollback — Blue-Green Deployment:</strong></p>
<ul>
<li>Two identical environments (Blue = current, Green = new version)</li>
<li>Load balancer switches traffic to Green after health checks pass</li>
<li>Rollback = switch load balancer back to Blue (seconds)</li>
<li>Requirement: Both versions must be compatible with current DB schema</li>
</ul>
<p><strong>2. Progressive Rollback — Canary Deployment:</strong></p>
<ul>
<li>Route 5% of traffic to new version, monitor error rates</li>
<li>If errors spike → route 100% back to old version</li>
<li>If healthy → progressively increase (5% → 25% → 50% → 100%)</li>
<li>Automated rollback trigger: error rate > 2x baseline OR p95 latency > 3x baseline</li>
</ul>
<p><strong>3. Surgical Rollback — Feature Flags:</strong></p>
<ul>
<li>New code is deployed but behind a feature flag (disabled by default)</li>
<li>Enable flag for internal users → canary users → all users</li>
<li>If problem found → disable flag instantly (no redeployment needed)</li>
<li>Best for: risky features in an otherwise stable release</li>
</ul>
<p><strong>Critical requirement — Database backward compatibility:</strong></p>
<ul>
<li>Never deploy breaking DB changes with the app in one step</li>
<li>Use expand-contract pattern: (1) add new column, (2) deploy app using new column, (3) remove old column later</li>
<li>Migrations must be forward-only and backward-compatible</li>
</ul>`
        },
        {
            id: 'scenario-q24',
            level: 'architect',
            title: 'How would you design secure communication between microservices?',
            answer: `<p><strong>Zero-trust inter-service communication:</strong></p>
<p><strong>The problem:</strong> In a microservices architecture, services communicate over the network. Without security, any compromised service can impersonate others or intercept data.</p>
<p><strong>Layer 1: Transport Security (mTLS)</strong></p>
<ul>
<li>Mutual TLS — both client and server present certificates</li>
<li>Encrypted in transit + identity verification in one step</li>
<li>Service mesh (Istio, Linkerd) automates certificate rotation and mTLS enforcement</li>
<li>No application code changes needed when using a sidecar proxy</li>
</ul>
<p><strong>Layer 2: Authentication (Service Identity)</strong></p>
<ul>
<li>OAuth2 Client Credentials flow — each service has its own client_id/secret</li>
<li>JWT tokens scoped to specific permissions (service A can call service B read endpoint, not write)</li>
<li>Short-lived tokens (5 min) with automatic renewal</li>
</ul>
<p><strong>Layer 3: Authorization (API Gateway + Policies)</strong></p>
<ul>
<li>API Gateway validates tokens and enforces rate limits at the edge</li>
<li>Each service validates the JWT audience claim matches itself</li>
<li>Fine-grained: Service A can call GET /orders but not DELETE /orders</li>
</ul>
<p><strong>Layer 4: Network Policies</strong></p>
<ul>
<li>Kubernetes NetworkPolicy restricts which pods can communicate</li>
<li>Private subnets — services not exposed to public internet</li>
<li>Egress filtering — services can only call known endpoints</li>
</ul>`,
            code: `// Service-to-service authentication with Client Credentials
// In OrderService calling InventoryService:

public class InventoryClient
{
    private readonly HttpClient _httpClient;
    private readonly ITokenService _tokenService;

    public async Task<StockLevel> CheckStockAsync(string productId)
    {
        // Get machine-to-machine token
        var token = await _tokenService.GetClientCredentialsTokenAsync(
            scope: "inventory.read");

        var request = new HttpRequestMessage(HttpMethod.Get,
            $"/api/inventory/{productId}");
        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<StockLevel>();
    }
}

// Token service with caching (avoid requesting new token every call)
public class TokenService : ITokenService
{
    private readonly IMemoryCache _cache;
    private readonly HttpClient _identityClient;

    public async Task<string> GetClientCredentialsTokenAsync(string scope)
    {
        var cacheKey = $"token:{scope}";
        if (_cache.TryGetValue(cacheKey, out string cachedToken))
            return cachedToken;

        var response = await _identityClient.PostAsync("/connect/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials",
                ["client_id"] = _config["ServiceAuth:ClientId"],
                ["client_secret"] = _config["ServiceAuth:ClientSecret"],
                ["scope"] = scope
            }));

        var tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponse>();

        // Cache until 60 seconds before expiry
        _cache.Set(cacheKey, tokenResponse.AccessToken,
            TimeSpan.FromSeconds(tokenResponse.ExpiresIn - 60));

        return tokenResponse.AccessToken;
    }
}

// Kubernetes NetworkPolicy (restrict inventory service access)
// apiVersion: networking.k8s.io/v1
// kind: NetworkPolicy
// metadata:
//   name: inventory-allow-orders-only
// spec:
//   podSelector:
//     matchLabels:
//       app: inventory-service
//   ingress:
//     - from:
//         - podSelector:
//             matchLabels:
//               app: order-service
//       ports:
//         - port: 8080`
        },
        {
            id: 'scenario-q25',
            level: 'architect',
            title: 'Tell us about the most challenging production issue you have solved. How did you investigate and resolve it?',
            answer: `<p><strong>Framework for answering "tell me about a challenging production issue":</strong></p>
<p>This is the ultimate scenario question. It tests your real-world experience, communication skills, and engineering maturity. Use this structure:</p>
<p><strong>1. Context (30 seconds)</strong></p>
<ul>
<li>What system? What scale? What was the business impact?</li>
<li>"Our order processing system serving 50K orders/day started silently dropping orders during peak hours."</li>
</ul>
<p><strong>2. Detection (30 seconds)</strong></p>
<ul>
<li>How was it discovered? Alert? Customer complaint? Audit?</li>
<li>What metrics showed the problem? (order count discrepancy, error rate spike, queue depth growing)</li>
</ul>
<p><strong>3. Investigation (2-3 minutes)</strong></p>
<ul>
<li>What hypotheses did you form? How did you narrow down?</li>
<li>What tools did you use? (logs, traces, profiler, DB queries)</li>
<li>What dead ends did you hit? (shows you are being honest)</li>
<li>What was the root cause?</li>
</ul>
<p><strong>4. Resolution (1-2 minutes)</strong></p>
<ul>
<li>What was the immediate fix? (hotfix, config change, rollback)</li>
<li>What was the long-term fix? (architecture change, new pattern, automation)</li>
<li>How did you verify the fix worked?</li>
</ul>
<p><strong>5. Prevention (30 seconds)</strong></p>
<ul>
<li>What did you add to prevent recurrence? (monitoring, tests, runbook)</li>
<li>What process changes resulted? (post-mortem culture, pre-deploy checklist)</li>
</ul>
<p><strong>What makes a GREAT answer:</strong></p>
<ul>
<li><strong>Honesty about mistakes</strong> — "I initially suspected X which was wrong, because..."</li>
<li><strong>Quantified impact</strong> — "Affected 2,300 orders over 4 hours, $180K in delayed revenue"</li>
<li><strong>Team acknowledgment</strong> — "I coordinated with the DBA and the on-call SRE to..."</li>
<li><strong>Learning outcome</strong> — "We now have chaos testing for this exact failure mode"</li>
<li><strong>Technical depth</strong> — Show you understand WHY the bug happened at a systems level</li>
</ul>`
        }
    ]
});
