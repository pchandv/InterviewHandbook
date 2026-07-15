/* ═══════════════════════════════════════════════════════════════════
   ASP.NET Core — Middleware, Minimal APIs, Authentication
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('aspnet-middleware', {
    title: 'ASP.NET Core Middleware Pipeline',
    description: 'Understanding the request/response pipeline, custom middleware, ordering, branching, and common patterns.',
    sections: [
        {
            title: 'How the Middleware Pipeline Works',
            content: `<p>ASP.NET Core processes every HTTP request through a <strong>pipeline of middleware components</strong>. Each middleware can:</p>
            <ul>
                <li>Handle the request and short-circuit (stop passing to next)</li>
                <li>Do work before passing to the next middleware</li>
                <li>Do work after the next middleware returns</li>
            </ul>
            <p>Order matters — middleware executes in the order registered, and the response flows back in reverse order.</p>`,
            diagram: `
    Request →  [Exception Handler] → [HTTPS Redirect] → [Static Files] → [Routing] → [Auth] → [Endpoint]
    Response ← [Exception Handler] ← [HTTPS Redirect] ← [Static Files] ← [Routing] ← [Auth] ← [Endpoint]`,
            code: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// ORDER MATTERS! Typical production pipeline:
app.UseExceptionHandler("/error");    // 1. Catch exceptions
app.UseHsts();                         // 2. Security headers
app.UseHttpsRedirection();             // 3. Force HTTPS
app.UseStaticFiles();                  // 4. Serve static files (short-circuits)
app.UseRouting();                      // 5. Match route
app.UseCors("policy");                 // 6. CORS
app.UseAuthentication();               // 7. Who are you?
app.UseAuthorization();                // 8. Can you do this?
app.UseRateLimiter();                  // 9. Throttle
app.UseResponseCaching();              // 10. Cache
app.MapControllers();                  // 11. Execute endpoint

app.Run();`,
            language: 'csharp'
        },
        {
            title: 'Custom Middleware',
            content: `<p>You can write middleware as a class (convention-based) or inline (for simple cases).</p>`,
            code: `// Convention-based middleware (recommended for production)
public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestTimingMiddleware> _logger;

    public RequestTimingMiddleware(RequestDelegate next, ILogger<RequestTimingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        
        // Add correlation ID
        var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault()
            ?? Guid.NewGuid().ToString();
        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers["X-Correlation-Id"] = correlationId;

        try
        {
            await _next(context); // Pass to next middleware
        }
        finally
        {
            sw.Stop();
            _logger.LogInformation(
                "HTTP {Method} {Path} responded {StatusCode} in {Duration}ms [CID: {CorrelationId}]",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                sw.ElapsedMilliseconds,
                correlationId);
        }
    }
}

// Extension method for clean registration
public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseRequestTiming(this IApplicationBuilder app)
        => app.UseMiddleware<RequestTimingMiddleware>();
}

// Inline middleware (good for simple cases)
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    await next();
});`,
            language: 'csharp'
        }
    ],
    questions: [
        {"question":"What is the ASP.NET Core middleware pipeline, and why does order matter?","difficulty":"medium","answer":"<p>The <strong>middleware pipeline</strong> is an ordered chain of components that each process an HTTP request and can pass it to the next via <code>next()</code>, then process the response on the way back out (an \"onion\"). Each middleware can short-circuit (not call next) to end the request early.</p><p>Order matters because middleware runs in the order registered: e.g., <code>UseRouting</code> before <code>UseAuthentication</code> before <code>UseAuthorization</code> before endpoints; exception handling and HTTPS redirection go early; response-compression before the content it compresses. Wrong order causes bugs like authorization running before authentication, or CORS not applying.</p>","explanation":"It is an assembly line where each station can inspect the package, act, or reject it, and also touch it again on the way back. Put the security checkpoint after the packing station and it guards nothing.","bestPractices":["Register in the correct order (routing, auth-n, auth-z, endpoints)","Put exception handling and HTTPS redirection early","Short-circuit early for rejects (auth failures, rate limits)"],"commonMistakes":["UseAuthorization before UseAuthentication","Adding CORS/compression in the wrong position","Forgetting to call next(), silently ending requests"],"interviewTip":"Describe the onion model (request in, response out) and give a concrete ordering (routing -> authn -> authz -> endpoints) — order bugs are the classic gotcha.","followUp":["What is the difference between Use, Run, and Map?","How do you write custom middleware?","Where does exception-handling middleware belong?"]},
        {"question":"What is the difference between Use, Run, and Map in the middleware pipeline?","difficulty":"medium","answer":"<p><code>Use</code> adds middleware that can call <code>next()</code> to continue the pipeline (or short-circuit). <code>Run</code> adds a <strong>terminal</strong> middleware that never calls next — it ends the pipeline. <code>Map</code> (and <code>MapWhen</code>) branches the pipeline based on request path or a predicate, running a separate sub-pipeline for matches.</p><p>So: <code>Use</code> for chainable steps, <code>Run</code> for the end of the line, <code>Map</code> to fork the pipeline for specific paths.</p>","explanation":"Use is a worker who does their bit and passes it along; Run is the last worker who boxes it up and stops the line; Map is a switch that sends certain packages down a different conveyor.","bestPractices":["Use Run only for terminal handlers","Use Map/MapWhen to isolate sub-pipelines (e.g., /admin)","Prefer endpoint routing over manual Map for most apps"],"commonMistakes":["Expecting middleware after a Run to execute","Overusing Map instead of endpoint routing","Branching logic that duplicates routing"],"interviewTip":"One-liners: Use=chainable, Run=terminal, Map=branch. Mention endpoint routing usually replaces manual Map.","followUp":["What is endpoint routing?","When would you branch with MapWhen?","How does short-circuiting work?"]},
        {
            question: 'Why does middleware order matter in ASP.NET Core? What happens if you put Authentication after the endpoint?',
            difficulty: 'medium',
            answer: `<p>Middleware executes in registration order. If Authentication runs after the endpoint, the endpoint executes without authentication — any [Authorize] attributes become ineffective because the identity hasn't been established yet.</p>
            <p>The pipeline is a <strong>Russian doll model</strong>: each middleware wraps the next. The request passes forward through each layer, and the response passes back. Security middleware MUST wrap endpoints to protect them.</p>`,
            explanation: 'It\'s like a building with security guards at the entrance. If you put the guard in the stairwell after the offices, anyone can walk into the offices first.',
            code: `// WRONG ORDER — Auth after endpoint mapping
app.MapControllers();       // Endpoint executes FIRST
app.UseAuthentication();    // Too late! Identity not set.
app.UseAuthorization();     // [Authorize] won't work!

// CORRECT ORDER
app.UseAuthentication();    // Sets HttpContext.User
app.UseAuthorization();     // Checks [Authorize] policies
app.MapControllers();       // Endpoint runs with auth context

// Common gotcha: StaticFiles before Auth
app.UseStaticFiles();       // ← Short-circuits: serves files WITHOUT auth!
app.UseAuthentication();    // Never reached for static files

// If you need auth on static files:
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();       // Now protected (but impacts performance)`,
            language: 'csharp',
            bestPractices: [
                'Follow the official recommended order: Exception → HSTS → HTTPS → Static → Routing → CORS → Auth → Auth → Endpoint',
                'Place exception handling first to catch errors from all middleware',
                'Place static files before auth if they don\'t need protection (performance)',
                'Use app.UseWhen() for conditional middleware (e.g., only on /api paths)'
            ],
            commonMistakes: [
                'Placing authentication after routing/endpoints',
                'Putting CORS after authorization (preflight fails)',
                'Not using exception handler middleware (unhandled exceptions leak stack traces)',
                'Adding heavy middleware that runs on every request (even health checks)'
            ],
            interviewTip: 'Draw the pipeline as nested layers. Show you understand that UseStaticFiles() short-circuits (doesn\'t call next()) for static file requests, so middleware after it never runs for those requests.',
            followUp: ['How does short-circuiting work?', 'What\'s the difference between Map, MapWhen, and UseWhen?', 'How would you conditionally apply middleware?'],
            seniorPerspective: 'In production, I always add request timing middleware first (after exception handler) to get accurate latency measurements. Missing this means you can\'t diagnose slow middleware.',
            architectPerspective: 'At scale, middleware order affects P99 latency. Rate limiting before authentication means unauthenticated flood attacks get caught early without wasting auth processing cycles.'
        },
        {
            question: 'How would you implement a custom middleware for API key validation?',
            difficulty: 'advanced',
            answer: `<p>API key middleware should validate the key early in the pipeline, short-circuit on failure, and integrate with ASP.NET Core's authentication system for clean [Authorize] support.</p>`,
            code: `public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private const string API_KEY_HEADER = "X-API-Key";

    public ApiKeyMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip endpoints that allow anonymous
        var endpoint = context.GetEndpoint();
        if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() != null)
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue(API_KEY_HEADER, out var key))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                error = "API key is required",
                header = API_KEY_HEADER
            });
            return; // Short-circuit!
        }

        // Validate against stored keys (use IApiKeyValidator service)
        var validator = context.RequestServices.GetRequiredService<IApiKeyValidator>();
        var validationResult = await validator.ValidateAsync(key!);

        if (!validationResult.IsValid)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new { error = "Invalid API key" });
            return;
        }

        // Set identity for downstream [Authorize] support
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, validationResult.ClientName),
            new Claim("ClientId", validationResult.ClientId),
            new Claim("Scope", string.Join(",", validationResult.Scopes))
        };
        context.User = new ClaimsPrincipal(
            new ClaimsIdentity(claims, "ApiKey"));

        await _next(context);
    }
}

// Service interface
public interface IApiKeyValidator
{
    Task<ApiKeyValidationResult> ValidateAsync(string apiKey);
}

// Registration
builder.Services.AddSingleton<IApiKeyValidator, DatabaseApiKeyValidator>();
app.UseMiddleware<ApiKeyMiddleware>();`,
            language: 'csharp',
            bestPractices: [
                'Use constant-time comparison for key validation (prevent timing attacks)',
                'Cache validated keys with short TTL to avoid DB hits on every request',
                'Log failed attempts for security monitoring',
                'Support multiple key locations: header, query string, or bearer token',
                'Set claims/identity so downstream [Authorize] policies work naturally'
            ],
            commonMistakes: [
                'Comparing keys with == (vulnerable to timing attacks)',
                'Not handling the [AllowAnonymous] case',
                'Hardcoding keys in middleware instead of using a validator service',
                'Returning 404 instead of 401/403 (information disclosure about routes)'
            ],
            interviewTip: 'A senior answer demonstrates: security considerations (timing attacks, rate limiting), integration with ASP.NET auth system (claims identity), and operational concerns (logging, monitoring).',
            followUp: ['How would you prevent timing attacks?', 'How do you rotate API keys without downtime?', 'How does this compare to using an AuthenticationHandler?'],
            seniorPerspective: 'For production, I implement this as an AuthenticationHandler (not raw middleware) for better integration with [Authorize] policies and Swagger authentication flow.',
            architectPerspective: 'At scale, API key validation should use a distributed cache (Redis) with short TTL rather than hitting the database per request. Consider an API gateway for centralized key management.'
        },
        {
            question: 'What is the difference between Map, MapWhen, and UseWhen for branching the middleware pipeline?',
            difficulty: 'medium',
            answer: `<p>All three create conditional branches, but they differ in how the branch rejoins the main pipeline:</p>
            <ul>
                <li><code>Map</code> — branches on a <strong>path prefix</strong>. The matched segment is stripped from <code>PathBase</code>/<code>Path</code> and the branch is <strong>terminal</strong> (it does not rejoin the main pipeline)</li>
                <li><code>MapWhen</code> — branches on an arbitrary <code>HttpContext</code> predicate (header, query, method). Also <strong>terminal</strong> — once taken, control does not return to the main pipeline</li>
                <li><code>UseWhen</code> — branches on a predicate, but if the branch does not short-circuit it <strong>rejoins</strong> the main pipeline and continues</li>
            </ul>
            <p>Use <code>UseWhen</code> to add middleware for some requests (e.g. only <code>/api</code>) while still flowing into shared endpoint routing; use <code>Map/MapWhen</code> for isolated sub-applications.</p>`,
            explanation: 'Map/MapWhen are exit ramps off a highway — once you take them you do not return. UseWhen is a temporary detour lane that merges back into the highway afterward.',
            code: `// Map: terminal branch on path prefix
app.Map("/admin", admin =>
{
    admin.UseMiddleware<AdminAuditMiddleware>();
    admin.Run(async ctx => await ctx.Response.WriteAsync("Admin area"));
}); // requests to /admin never reach the main pipeline below

// MapWhen: terminal branch on a predicate
app.MapWhen(ctx => ctx.Request.Query.ContainsKey("api-version"),
    branch => branch.Run(async ctx =>
        await ctx.Response.WriteAsync("Versioned branch")));

// UseWhen: conditional middleware that REJOINS the main pipeline
app.UseWhen(
    ctx => ctx.Request.Path.StartsWithSegments("/api"),
    api => api.UseMiddleware<RequestTimingMiddleware>()); // only /api gets timing

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers(); // UseWhen branch flows here; Map/MapWhen branches do not`,
            language: 'csharp',
            bestPractices: [
                'Use UseWhen when the branch should still reach shared routing/endpoints',
                'Use Map for self-contained sub-apps mounted under a path prefix',
                'Remember Map strips the matched prefix from the request path inside the branch',
                'Keep predicates cheap — they run on every request'
            ],
            commonMistakes: [
                'Expecting MapWhen/Map branches to rejoin the main pipeline (they are terminal)',
                'Using Map and being surprised that downstream Path no longer includes the prefix',
                'Putting expensive logic in the branch predicate',
                'Reaching for branching when a single middleware with an internal if-check is simpler'
            ],
            interviewTip: 'The crisp distinction interviewers want: Map/MapWhen are terminal, UseWhen rejoins. Add that Map also rewrites the path by stripping the matched prefix.',
            followUp: ['What happens to HttpContext.Request.Path inside a Map branch?', 'How would you run different middleware for /api vs MVC pages?', 'Is the UseWhen predicate evaluated once or per request?'],
            seniorPerspective: 'I use UseWhen to scope cross-cutting middleware (timing, API-specific error formatting) to just the /api surface, keeping the static-file and Razor paths lean. Map I reserve for genuinely separate sub-applications like an embedded health/diagnostics app.',
            architectPerspective: 'Branching is a code smell if overused — too many MapWhen predicates make the pipeline hard to reason about. I prefer endpoint metadata and routing to express variation, reserving pipeline branching for coarse, app-level separation.'
        },
        {
            question: 'How do you handle exceptions globally in ASP.NET Core, and how does the .NET 8 IExceptionHandler differ from UseExceptionHandler and the developer exception page?',
            difficulty: 'advanced',
            answer: `<p>There are three layers, used together:</p>
            <ul>
                <li><strong>Developer Exception Page</strong> (<code>UseDeveloperExceptionPage</code>, auto-added in Development) — shows stack traces; must <strong>never</strong> be enabled in production (information disclosure)</li>
                <li><strong>UseExceptionHandler</strong> — production-safe terminal handler middleware that catches unhandled exceptions, re-executes a handler path, and returns a sanitized response. Should be registered <strong>first</strong> so it wraps the whole pipeline</li>
                <li><strong>IExceptionHandler</strong> (.NET 8) — a registered service invoked by <code>UseExceptionHandler</code>. You can register multiple handlers; they run in order until one returns <code>true</code> (handled). This is the clean, DI-friendly way to map exception types to RFC 7807 <code>ProblemDetails</code> responses</li>
            </ul>`,
            explanation: 'The developer page is your private debug console — fine at home, dangerous in public. UseExceptionHandler is the public-facing receptionist that gives a polite, generic apology. IExceptionHandler is the rulebook the receptionist follows to decide which apology fits which problem.',
            code: `// .NET 8: typed exception handler via DI
public class ProblemDetailsExceptionHandler : IExceptionHandler
{
    private readonly ILogger<ProblemDetailsExceptionHandler> _logger;
    public ProblemDetailsExceptionHandler(ILogger<ProblemDetailsExceptionHandler> logger)
        => _logger = logger;

    public async ValueTask<bool> TryHandleAsync(
        HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, title) = ex switch
        {
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Resource not found"),
            ValidationException  => (StatusCodes.Status400BadRequest, "Validation failed"),
            _                    => (StatusCodes.Status500InternalServerError, "Server error")
        };
        _logger.LogError(ex, "Unhandled exception ({Status})", status);

        ctx.Response.StatusCode = status;
        await ctx.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status,
            Title = title,
            Instance = ctx.Request.Path
        }, ct);
        return true; // handled; stop the chain
    }
}

builder.Services.AddExceptionHandler<ProblemDetailsExceptionHandler>();
builder.Services.AddProblemDetails();

var app = builder.Build();
app.UseExceptionHandler(); // first — wraps the whole pipeline; invokes IExceptionHandler(s)
// Developer page is added automatically in Development only`,
            language: 'csharp',
            bestPractices: [
                'Register UseExceptionHandler first so it catches errors from all later middleware',
                'Return RFC 7807 ProblemDetails for consistent, machine-readable error bodies',
                'Map known exception types to specific status codes; default unknowns to 500',
                'Log the full exception server-side but never leak stack traces to clients in production'
            ],
            commonMistakes: [
                'Leaving the developer exception page enabled in production (leaks internals)',
                'Registering exception handling late so earlier middleware errors escape it',
                'Returning 500 for everything, losing 400/404 semantics clients rely on',
                'Swallowing exceptions without logging, making incidents undiagnosable'
            ],
            interviewTip: 'Show the layering: dev page (Development only) vs UseExceptionHandler (production) vs IExceptionHandler (the .NET 8 DI mechanism behind it). Mention that multiple IExceptionHandlers run in order until one returns true.',
            followUp: ['What is RFC 7807 ProblemDetails?', 'Why must UseExceptionHandler be registered early?', 'How do multiple IExceptionHandler implementations interact?'],
            seniorPerspective: 'I standardize on IExceptionHandler emitting ProblemDetails with a correlation id so support can tie a client-visible error to server logs. Known domain exceptions map to 4xx; everything else is a logged 500 with a generic message.',
            architectPerspective: 'A consistent error contract is part of the public API surface. I define the ProblemDetails shape once (including a traceId and error code) and enforce it across all services so clients and the API gateway can handle failures uniformly without parsing free-text messages.'
        },
        {
            question: 'What is the difference between convention-based middleware and factory-based middleware (IMiddleware), and when does the distinction matter for dependency injection?',
            difficulty: 'hard',
            answer: `<p>Convention-based middleware is a plain class with a constructor and an <code>InvokeAsync(HttpContext)</code> method. It is instantiated <strong>once</strong> (singleton) at startup, so constructor-injected dependencies are effectively singletons too. To use a scoped service you must inject it as a <em>method</em> parameter of <code>InvokeAsync</code>, which the framework resolves per request.</p>
            <p><strong>Factory-based middleware</strong> implements <code>IMiddleware</code> and is resolved from DI <strong>per request</strong> via <code>IMiddlewareFactory</code>. This means constructor injection of scoped services works naturally, and it is strongly typed and easier to unit test — but the middleware must be registered in the container.</p>`,
            explanation: 'Convention-based middleware is built once and reused forever, so you cannot hand it fresh per-request tools in the constructor — you pass them at the door (method injection). IMiddleware is rebuilt for every visitor, so it can hold per-request tools from birth.',
            code: `// Convention-based: created ONCE. Scoped deps must go on InvokeAsync, not the ctor.
public class ConventionMiddleware
{
    private readonly RequestDelegate _next; // singleton-lifetime field is fine
    public ConventionMiddleware(RequestDelegate next) => _next = next;

    // DbContext (scoped) injected per-request as a METHOD parameter:
    public async Task InvokeAsync(HttpContext ctx, AppDbContext db)
    {
        await db.AuditLog.AddAsync(new() { Path = ctx.Request.Path });
        await db.SaveChangesAsync();
        await _next(ctx);
    }
}
app.UseMiddleware<ConventionMiddleware>();

// Factory-based (IMiddleware): resolved per-request, ctor injection of scoped is safe.
public class FactoryMiddleware : IMiddleware
{
    private readonly AppDbContext _db; // scoped — safe because instance is per-request
    public FactoryMiddleware(AppDbContext db) => _db = db;

    public async Task InvokeAsync(HttpContext ctx, RequestDelegate next)
    {
        await _db.AuditLog.AddAsync(new() { Path = ctx.Request.Path });
        await _db.SaveChangesAsync();
        await next(ctx);
    }
}
builder.Services.AddScoped<FactoryMiddleware>(); // MUST register in DI
app.UseMiddleware<FactoryMiddleware>();`,
            language: 'csharp',
            bestPractices: [
                'For convention-based middleware, inject scoped services via InvokeAsync parameters, never the constructor',
                'Use IMiddleware when you want constructor injection of scoped services and easy testing',
                'Register IMiddleware implementations in DI (usually scoped)',
                'Keep singleton-captured dependencies thread-safe (convention middleware is shared)'
            ],
            commonMistakes: [
                'Constructor-injecting a scoped service (like DbContext) into convention-based middleware — captures it as a singleton and causes concurrency/stale-state bugs',
                'Forgetting to register IMiddleware types in the container (resolution fails at runtime)',
                'Storing per-request state in fields of convention-based middleware (shared across requests)',
                'Assuming a new middleware instance per request for convention-based middleware'
            ],
            interviewTip: 'The classic trap: injecting DbContext into a convention-based middleware constructor. Explain it is built once, so the scoped service becomes a captured singleton — the fix is method injection or IMiddleware.',
            followUp: ['Why is injecting DbContext into a convention middleware constructor dangerous?', 'How does IMiddlewareFactory resolve instances?', 'Where should per-request state live in middleware?'],
            seniorPerspective: 'My rule of thumb: if the middleware needs scoped services, prefer IMiddleware for clarity, or use method injection on InvokeAsync. I treat any constructor-injected scoped dependency in convention middleware as a bug waiting to surface under concurrency.',
            architectPerspective: 'Captured-dependency lifetime bugs are among the hardest to diagnose because they only manifest under load. I bake a DI lifetime validation step (ValidateScopes/ValidateOnBuild) into startup so these mismatches fail fast at boot rather than intermittently in production.'
        }
    ,
        {
            question: 'What is the difference between app.Use, app.Run, and app.Map in the middleware pipeline, and how does short-circuiting work?',
            difficulty: 'medium',
            answer: `<p>They are the three ways to add to the request pipeline:</p>
            <ul>
                <li><strong>app.Use(next)</strong> \u2014 adds middleware that can run code before and after the rest of the pipeline and chooses whether to call <code>next()</code>. Not calling <code>next()</code> <strong>short-circuits</strong> the pipeline (no later middleware runs), which is how things like auth or caching return early.</li>
                <li><strong>app.Run(handler)</strong> \u2014 a <em>terminal</em> middleware that never calls next; it ends the pipeline. Anything registered after it is unreachable.</li>
                <li><strong>app.Map(path, branch)</strong> / <strong>MapWhen</strong> \u2014 branches the pipeline based on path or a predicate, building a separate sub-pipeline for matching requests.</li>
            </ul>
            <p>Ordering is everything: middleware runs in registration order on the way in and reverse order on the way out (the classic onion model).</p>`,
            explanation: 'Use is a checkpoint that can wave you through or turn you back; Run is the final destination that always stops you; Map is a fork in the road sending some requests down a side route. Forgetting to call next() is like a checkpoint that silently swallows everyone.',
            code: `app.Use(async (ctx, next) =>
{
    if (!ctx.Request.Headers.ContainsKey("X-Api-Key"))
    {
        ctx.Response.StatusCode = 401;   // short-circuit: do NOT call next()
        return;
    }
    await next();                        // continue down the pipeline
    // code here runs on the way back out (reverse order)
});

app.Map("/admin", admin => admin.Run(async ctx =>
    await ctx.Response.WriteAsync("admin branch")));   // terminal in the branch`,
            language: 'csharp',
            bestPractices: ['Order middleware deliberately \u2014 the pipeline runs in registration order in, reverse out', 'Short-circuit early for auth/validation to avoid unnecessary downstream work', 'Use app.Run only as the terminal handler', 'Use Map/MapWhen to branch cleanly rather than littering Use with conditionals'],
            commonMistakes: ['Forgetting to call next(), silently swallowing requests', 'Registering middleware in the wrong order (e.g., auth after the endpoint)', 'Putting code after app.Run and expecting it to execute', 'Doing expensive work before a short-circuit check'],
            interviewTip: 'Explain the onion model (in-order on the way in, reverse on the way out) and that not calling next() short-circuits. Distinguishing Use (continue/short-circuit), Run (terminal), and Map (branch) is the crisp answer.',
            followUp: ['Why does middleware order matter for auth vs routing?', 'How does the response flow back through the pipeline?', 'When would you use MapWhen over Map?'],
            seniorPerspective: 'The bugs I see most are ordering mistakes \u2014 authentication after authorization, or exception handling registered too late to catch downstream errors. I treat pipeline order as a deliberate design decision, not an accident of registration.',
            architectPerspective: 'The middleware pipeline is the cross-cutting-concern backbone of the app \u2014 auth, logging, error handling, rate limiting all live here. Getting ordering and short-circuiting right centralizes those concerns cleanly instead of scattering them across endpoints.'
        },
        {
            question: 'How does middleware short-circuiting work in ASP.NET Core, and what are the most important scenarios where you would intentionally short-circuit?',
            difficulty: 'hard',
            answer: `<p>Short-circuiting means a middleware <strong>does not call <code>next()</code></strong>, preventing all downstream middleware from executing. The response flows back up through upstream middleware without ever reaching the endpoint.</p>
            <p>Key scenarios for intentional short-circuiting:</p>
            <ul>
                <li><strong>Authentication/Authorization failures</strong> — return 401/403 immediately</li>
                <li><strong>Rate limiting</strong> — return 429 before wasting compute</li>
                <li><strong>Request validation</strong> — reject malformed requests early</li>
                <li><strong>Cache hits</strong> — return cached response without executing the endpoint</li>
                <li><strong>CORS preflight</strong> — respond to OPTIONS without routing to a controller</li>
            </ul>
            <p>Critical rule: if you short-circuit, you own the response. Downstream middleware (including exception handling if registered after you) will NOT run.</p>`,
            explanation: 'Short-circuiting is a security guard turning someone away at the entrance. It saves resources, but the guard must provide a proper rejection — no one downstream will handle it.',
            code: `// Rate-limiting middleware that short-circuits:
public class RateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IRateLimiter _limiter;

    public RateLimitMiddleware(RequestDelegate next, IRateLimiter limiter)
    {
        _next = next;
        _limiter = limiter;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var clientId = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        if (!_limiter.TryAcquire(clientId))
        {
            context.Response.StatusCode = 429;
            context.Response.Headers["Retry-After"] = "60";
            await context.Response.WriteAsJsonAsync(new { error = "Rate limit exceeded" });
            return; // SHORT-CIRCUIT: pipeline stops here
        }
        await _next(context); // Allow through
    }
}

// CAUTION: Exception middleware MUST be registered BEFORE short-circuiting middleware
app.UseExceptionHandler("/error"); // First!
app.UseRateLimiting();             // May short-circuit
app.UseAuthentication();           // May short-circuit`,
            language: 'csharp',
            bestPractices: [
                'Register exception-handling middleware before any middleware that might short-circuit',
                'Always set a proper status code and response body when short-circuiting',
                'Short-circuit as early as possible to minimize wasted computation',
                'Log short-circuit events for observability (rate limiting, auth failures)',
                'Use short-circuiting for cross-cutting concerns, not business logic'
            ],
            commonMistakes: [
                'Short-circuiting without setting a response status code (returns 200 with empty body)',
                'Registering exception handler AFTER middleware that short-circuits on errors',
                'Forgetting that short-circuiting skips downstream logging/metrics middleware',
                'Accidentally not calling next() due to a missing else branch'
            ],
            interviewTip: 'Explain the onion model: short-circuiting means turn around here. Emphasize that YOU own the response when you short-circuit, and middleware order determines what runs before and after.',
            followUp: ['What happens to response headers set by upstream middleware when you short-circuit?', 'How does short-circuiting interact with response caching middleware?', 'Can you short-circuit after calling next()?']
        },
        {
            question: 'Why does the order of middleware registration matter in ASP.NET Core? Walk through the correct order and explain what breaks if you get it wrong.',
            difficulty: 'hard',
            answer: `<p>Middleware executes in <strong>registration order on the way in</strong> and <strong>reverse order on the way out</strong>. Each middleware position determines what context is available and what exceptions it can catch.</p>
            <p>The standard order and WHY:</p>
            <ul>
                <li><strong>ExceptionHandler</strong> first — catches all downstream exceptions</li>
                <li><strong>HTTPS redirect</strong> — before any content is served</li>
                <li><strong>Static files</strong> — before routing (no need to route /favicon.ico)</li>
                <li><strong>Routing</strong> — determines endpoint match</li>
                <li><strong>CORS</strong> — needs endpoint metadata from routing, must run before auth</li>
                <li><strong>Authentication</strong> — establishes WHO the user is</li>
                <li><strong>Authorization</strong> — checks IF the user can access (needs identity)</li>
            </ul>
            <p>Classic bug: UseAuthorization() before UseAuthentication() — authorization checks policies against null identity, rejecting all requests.</p>`,
            explanation: 'Middleware order is like airport checkpoints: ticket check, security scan, passport control, boarding. Put passport control before ticket check and unticketed people reach border officers.',
            code: `// CORRECT ORDER:
app.UseExceptionHandler("/error");   // 1. Catches everything
app.UseHsts();
app.UseHttpsRedirection();           // 2. Force HTTPS
app.UseStaticFiles();                // 3. Serve assets (skip routing)
app.UseRouting();                    // 4. Match endpoint
app.UseCors();                       // 5. Needs endpoint metadata
app.UseAuthentication();             // 6. WHO is the user?
app.UseAuthorization();              // 7. CAN they access this?
app.MapControllers();                // 8. Terminal

// BUG: Authorization before Authentication
// app.UseAuthorization();  // Identity is null!
// app.UseAuthentication(); // Too late

// BUG: CORS after Authorization
// app.UseAuthorization();
// app.UseCors();  // Preflight OPTIONS rejected by auth!`,
            language: 'csharp',
            bestPractices: [
                'Follow the documented order: Exception > HTTPS > Static > Routing > CORS > Auth > Authz',
                'Register exception handling first to catch all downstream errors',
                'Place authentication before authorization always',
                'Put static files before routing to avoid unnecessary route matching',
                'Add logging middleware early to capture the full request lifecycle'
            ],
            commonMistakes: [
                'Putting UseAuthorization before UseAuthentication (null identity)',
                'Registering UseExceptionHandler after other middleware (misses their errors)',
                'Adding CORS after authorization (preflight OPTIONS gets rejected)',
                'Placing custom middleware after MapControllers (never executes)'
            ],
            interviewTip: 'Recite the standard order and explain WHY each position matters. The auth/authz reversal is the classic interview trap — show the cause (null identity) and symptom (403 for valid users).',
            followUp: ['Why must CORS run after routing but before authorization?', 'How does UseRouting + UseEndpoints split affect middleware between them?', 'What happens to middleware registered after MapControllers?']
        },
        {
            question: 'How does middleware short-circuiting work in ASP.NET Core? Explain the onion model, why ordering matters, and show a custom middleware that demonstrates the request/response pipeline.',
            difficulty: 'hard',
            answer: `<p>ASP.NET Core middleware forms a bidirectional pipeline (the "onion model") where each middleware wraps the next. A request passes inward through each middleware's "before" logic, reaches the endpoint, then the response passes outward through each middleware's "after" logic in reverse order. Short-circuiting occurs when a middleware does NOT call next() â€” the request never reaches inner middleware, and the response starts flowing outward from that point.</p>
            <p>Ordering matters because each middleware only sees what outer middleware has prepared. Authentication must run before Authorization (otherwise there is no identity to authorize). Exception handling must be first (outermost) to catch exceptions from ALL inner middleware. Static files should precede routing to avoid unnecessary route matching overhead.</p>
            <p>Short-circuiting is used for: early responses (health checks, cached responses), request rejection (rate limiting, IP blocking), and error responses (authentication challenges). The key insight is that short-circuiting middleware still runs its own "after" logic â€” only INNER middleware is bypassed.</p>`,
            explanation: 'The onion model is like airport security layers: check-in (logging) then passport control (auth) then security scan (validation) then gate (endpoint). If passport control rejects you, you never reach the gate â€” but you still walk back OUT past check-in.',
            code: `// The onion model â€” each middleware wraps the next:
app.Use(async (context, next) =>
{
    // BEFORE: runs on the way IN (request phase)
    var stopwatch = Stopwatch.StartNew();
    
    await next(); // Pass to next middleware
    
    // AFTER: runs on the way OUT (response phase)
    stopwatch.Stop();
    context.Response.Headers["X-Response-Time"] = 
        $"{stopwatch.ElapsedMilliseconds}ms";
});

// SHORT-CIRCUITING â€” not calling next():
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/health")
    {
        context.Response.StatusCode = 200;
        await context.Response.WriteAsync("OK");
        return; // SHORT-CIRCUIT: inner middleware never executes
    }
    await next();
});

// CUSTOM MIDDLEWARE CLASS:
public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    public CorrelationIdMiddleware(RequestDelegate next) => _next = next;
    
    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers["X-Correlation-ID"]
            .FirstOrDefault() ?? Guid.NewGuid().ToString();
        context.Items["CorrelationId"] = correlationId;
        
        await _next(context);
        context.Response.Headers["X-Correlation-ID"] = correlationId;
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Place exception handling middleware first (outermost) to catch all downstream errors',
                'Use the class-based pattern for reusable middleware with DI support',
                'Short-circuit early for known responses (health checks) to avoid unnecessary work',
                'Set response headers in the after-phase to ensure they are not overwritten',
                'Log request AND response in a single middleware using the before/after pattern'
            ],
            commonMistakes: [
                'Putting UseAuthorization before UseAuthentication (null identity, 403 for valid users)',
                'Modifying response body after next() when response has already started',
                'Registering middleware after MapControllers (never executes for matched routes)',
                'Not understanding that short-circuit middleware still runs ITS OWN after-logic'
            ],
            interviewTip: 'Draw the onion diagram with numbered layers showing in/out flow. The classic trap is auth ordering â€” UseAuthentication SETS the identity, UseAuthorization READS it. Show a timing middleware with before/after to prove you understand bidirectional flow.',
            followUp: ['What is the difference between app.Use, app.Run, and app.Map?', 'How does endpoint routing affect which middleware runs?', 'Can middleware access DI services with different lifetimes safely?']
        },
        {
            question: 'How would you implement a custom middleware for cross-cutting concerns like correlation IDs, request timing, or tenant resolution? Explain proper lifetime management and DI scoping.',
            difficulty: 'hard',
            answer: `<p>Custom middleware should be a class with a constructor accepting RequestDelegate (and singleton services) and an InvokeAsync method accepting HttpContext (and scoped/transient services). The middleware class itself is a SINGLETON (instantiated once at startup), so it must not hold scoped or transient state in fields â€” inject scoped services as InvokeAsync parameters resolved per-request.</p>
            <p>For correlation IDs: extract from incoming X-Correlation-ID header or generate a new GUID, store in HttpContext.Items, push into structured logging context (Serilog LogContext), and add to the response header. For tenant resolution: read tenant from header/subdomain/path, resolve tenant configuration, and set on a scoped ITenantContext service.</p>
            <p>Lifetime pitfall: if your middleware captures a scoped service (like DbContext) in the constructor, it becomes a captive dependency â€” a singleton holding a scoped reference, causing data corruption across requests. Always inject scoped services via InvokeAsync parameters or resolve from context.RequestServices.</p>`,
            explanation: 'Middleware is like a receptionist at a building entrance â€” always there (singleton), but handles each visitor (request) independently. They look up visitor-specific info (scoped services) from the daily guest list, never keeping old lists in their pocket.',
            code: `// CORRECT: Proper DI lifetime management
public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantResolutionMiddleware> _logger;
    
    // Constructor: only singleton-lifetime services!
    public TenantResolutionMiddleware(
        RequestDelegate next, 
        ILogger<TenantResolutionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }
    
    // InvokeAsync: scoped services as parameters
    public async Task InvokeAsync(
        HttpContext context, 
        ITenantContext tenantContext) // SCOPED â€” safe here
    {
        var tenantId = ResolveTenant(context);
        tenantContext.SetTenant(tenantId);
        _logger.LogInformation("Tenant: {TenantId}", tenantId);
        await _next(context);
    }
    
    private string ResolveTenant(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue("X-Tenant-ID", out var h))
            return h.ToString();
        return context.Request.Host.Host.Split('.').FirstOrDefault() ?? "default";
    }
}

// WRONG: Captive dependency (scoped in singleton constructor)
public class BrokenMiddleware
{
    private readonly MyDbContext _db; // BUG: all requests share one DbContext!
    public BrokenMiddleware(RequestDelegate next, MyDbContext db) { _db = db; }
}

// Registration extension:
public static IApplicationBuilder UseTenantResolution(
    this IApplicationBuilder app) => app.UseMiddleware<TenantResolutionMiddleware>();`,
            language: 'csharp',
            bestPractices: [
                'Inject scoped services as InvokeAsync parameters, never in the constructor',
                'Use HttpContext.Items for request-scoped data that does not need DI',
                'Create extension methods (UseXxx) for clean middleware registration',
                'Keep middleware focused on one concern â€” compose multiple for multiple concerns',
                'Test middleware in isolation using TestServer or DefaultHttpContext'
            ],
            commonMistakes: [
                'Capturing scoped services in the constructor (captive dependency, shared state)',
                'Storing per-request state in middleware fields (singleton shared across requests)',
                'Not calling await next() in non-short-circuit paths (silently drops the response)',
                'Writing to response body after next() when downstream already started the response'
            ],
            interviewTip: 'The lifetime trap: middleware is singleton but InvokeAsync runs per-request. Show you know the captive dependency anti-pattern and the fix (inject in InvokeAsync). A tenant resolution example demonstrates real cross-cutting value beyond trivial logging.',
            followUp: ['How do you unit test middleware without the full pipeline?', 'What is the difference between middleware and endpoint filters?', 'How does IMiddlewareFactory enable non-singleton middleware?']
        }
    ]
});
