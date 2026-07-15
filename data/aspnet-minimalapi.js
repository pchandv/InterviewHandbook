/* ═══════════════════════════════════════════════════════════════════
   ASP.NET Core — Minimal APIs
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('aspnet-minimal-api', {
    title: 'ASP.NET Core Minimal APIs',
    description: 'Building lightweight HTTP APIs without controllers — endpoint routing, filters, route groups, TypedResults, validation, and when to choose Minimal APIs over MVC.',
    sections: [
        {
            title: 'Minimal API Fundamentals',
            content: `<p><strong>Minimal APIs</strong> (introduced in .NET 6) provide a lightweight way to build HTTP endpoints without the ceremony of controllers, action filters, and model binding conventions. They use top-level statements and lambda-based routing.</p>`,
            code: `var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<IUserService, UserService>();

var app = builder.Build();

// Simple endpoints
app.MapGet("/", () => "Hello World!");

app.MapGet("/users/{id:int}", async (int id, IUserService service) =>
{
    var user = await service.GetByIdAsync(id);
    return user is not null ? Results.Ok(user) : Results.NotFound();
});

app.MapPost("/users", async (CreateUserRequest req, IUserService service) =>
{
    var user = await service.CreateAsync(req);
    return Results.Created($"/users/{user.Id}", user);
});

app.MapPut("/users/{id:int}", async (int id, UpdateUserRequest req, IUserService service) =>
{
    var updated = await service.UpdateAsync(id, req);
    return updated ? Results.NoContent() : Results.NotFound();
});

app.MapDelete("/users/{id:int}", async (int id, IUserService service) =>
{
    await service.DeleteAsync(id);
    return Results.NoContent();
});

app.Run();`,
            language: 'csharp'
        },
        {
            title: 'Route Groups & Organization',
            content: `<p><strong>Route Groups</strong> (.NET 7+) organize endpoints by prefix and share filters, metadata, and conventions — solving the "all in Program.cs" problem.</p>`,
            code: `// Route Groups — organize endpoints by resource
var app = builder.Build();

// Group with shared prefix, filters, and metadata
var users = app.MapGroup("/api/users")
    .WithTags("Users")
    .RequireAuthorization()
    .AddEndpointFilter<ValidationFilter>();

users.MapGet("/", GetAllUsers);
users.MapGet("/{id:int}", GetUserById);
users.MapPost("/", CreateUser);
users.MapPut("/{id:int}", UpdateUser);
users.MapDelete("/{id:int}", DeleteUser);

// Nested groups
var admin = app.MapGroup("/api/admin")
    .RequireAuthorization("AdminPolicy");

var adminUsers = admin.MapGroup("/users");
adminUsers.MapGet("/", GetAllUsersAdmin);
adminUsers.MapPost("/bulk-delete", BulkDeleteUsers);

// Extension method pattern for clean organization:
public static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/users")
            .WithTags("Users")
            .RequireAuthorization();

        group.MapGet("/", GetAll);
        group.MapGet("/{id:int}", GetById).WithName("GetUserById");
        group.MapPost("/", Create).AllowAnonymous();
        
        return group;
    }

    private static async Task<IResult> GetAll(IUserService service, int page = 1, int size = 20)
    {
        var users = await service.GetPagedAsync(page, size);
        return TypedResults.Ok(users);
    }

    private static async Task<IResult> GetById(int id, IUserService service)
    {
        var user = await service.GetByIdAsync(id);
        return user is not null ? TypedResults.Ok(user) : TypedResults.NotFound();
    }
}

// In Program.cs — one line per resource:
app.MapUserEndpoints();
app.MapOrderEndpoints();
app.MapProductEndpoints();`,
            language: 'csharp'
        },
        {
            title: 'Endpoint Filters & TypedResults',
            content: `<p><strong>Endpoint Filters</strong> (.NET 7+) are the Minimal API equivalent of action filters — they intercept requests before/after the handler. <strong>TypedResults</strong> provide compile-time verified response types for OpenAPI documentation.</p>`,
            code: `// Endpoint Filter — validation, logging, auth
public class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context, 
        EndpointFilterDelegate next)
    {
        var model = context.Arguments.OfType<T>().FirstOrDefault();
        if (model is null)
            return TypedResults.BadRequest("Request body required");

        var validator = context.HttpContext.RequestServices
            .GetService<IValidator<T>>();
        
        if (validator is not null)
        {
            var result = await validator.ValidateAsync(model);
            if (!result.IsValid)
                return TypedResults.ValidationProblem(result.ToDictionary());
        }

        return await next(context);
    }
}

// Apply filter to endpoint or group:
app.MapPost("/users", CreateUser)
    .AddEndpointFilter<ValidationFilter<CreateUserRequest>>();

// TypedResults — compile-time response type documentation
app.MapGet("/users/{id:int}", async Task<Results<Ok<UserDto>, NotFound>> 
    (int id, IUserService service) =>
{
    var user = await service.GetByIdAsync(id);
    return user is not null
        ? TypedResults.Ok(user.ToDto())
        : TypedResults.NotFound();
});
// OpenAPI auto-documents: 200 OK (UserDto) | 404 Not Found

// Rate limiting on specific endpoints
app.MapGet("/api/search", SearchHandler)
    .RequireRateLimiting("search-policy");

// Output caching
app.MapGet("/api/products", GetProducts)
    .CacheOutput(p => p.Expire(TimeSpan.FromMinutes(5)).Tag("products"));`,
            language: 'csharp',
            callout: { type: 'info', title: 'TypedResults vs Results', text: 'Use TypedResults (static class) for compile-time return type documentation. The Results<T1, T2, ...> union type tells OpenAPI exactly which responses are possible. Use Results (instance) when you don\'t need strict typing.' }
        },
        {
            title: 'Minimal APIs vs Controllers',
            content: `<p>Choosing between Minimal APIs and MVC controllers depends on project complexity, team preferences, and feature requirements.</p>`,
            table: {
                headers: ['Aspect', 'Minimal APIs', 'Controllers (MVC)'],
                rows: [
                    ['Ceremony', 'Low — lambdas + routing', 'High — class + attributes + conventions'],
                    ['Organization', 'Route groups + extension methods', 'Controller classes + areas'],
                    ['Filters', 'Endpoint filters (simpler)', 'Action filters, result filters, exception filters (rich)'],
                    ['Model binding', 'Explicit parameters', 'Convention-based [FromBody], [FromQuery]'],
                    ['OpenAPI', 'TypedResults + ProducesResponseType', 'Attributes + conventions'],
                    ['Performance', 'Slightly faster (less middleware)', 'Slightly more overhead'],
                    ['Testing', 'Function-based (easy unit test)', 'Class-based (constructor DI mocking)'],
                    ['Best for', 'Microservices, simple APIs, prototypes', 'Complex APIs, large teams, enterprise'],
                    ['Content negotiation', 'Manual', 'Built-in (JSON, XML, etc.)'],
                    ['Model validation', 'Manual or filter-based', 'Automatic via [ApiController]']
                ]
            }
        }
    ],
    questions: [
        {"question":"What are Minimal APIs in ASP.NET Core, and when would you choose them over controllers?","difficulty":"medium","answer":"<p><strong>Minimal APIs</strong> define endpoints directly with lambda handlers (<code>app.MapGet(\"/x\", () =&gt; ...)</code>) instead of controller classes, with less ceremony and lower per-request overhead. They support DI, model binding, filters, and route groups.</p><p>Choose them for small services, microservices, and focused APIs where the controller machinery is overkill. Prefer <strong>controllers</strong> for large APIs that benefit from convention, attribute-based organization, action filters, and familiarity across a big team. Both can coexist.</p>","explanation":"Minimal APIs are a food truck — quick to set up, perfect for a focused menu. Controllers are a full restaurant kitchen — more structure, better when the menu (API surface) is large.","bestPractices":["Use minimal APIs for small/microservice endpoints","Group related routes with MapGroup and shared filters","Move handler logic into services, not fat lambdas"],"commonMistakes":["Cramming business logic into endpoint lambdas","Using minimal APIs for a very large API where controllers organize better","Skipping validation/filters that controllers gave for free"],"interviewTip":"Frame it as ceremony vs structure: minimal for small/focused, controllers for large/convention-heavy; note they interoperate.","followUp":["How do route groups and endpoint filters work?","How does model binding differ in minimal APIs?","How do you return typed results (TypedResults)?"]},
        {"question":"How do you handle validation and structured error responses in Minimal APIs?","difficulty":"medium","answer":"<p>Minimal APIs do not run MVC model validation automatically, so validate explicitly — via endpoint filters (<code>AddEndpointFilter</code>) that check the model, a validation library (FluentValidation), or manual checks — and return <code>Results.ValidationProblem(...)</code>. For errors, return RFC 7807 <strong>Problem Details</strong> via <code>Results.Problem</code>/<code>TypedResults.Problem</code>, and register <code>AddProblemDetails()</code> plus exception handling middleware for consistent error shapes.</p><p>Using <code>TypedResults</code> also makes handlers testable and improves OpenAPI metadata.</p>","explanation":"Controllers had a built-in bouncer (automatic validation); with minimal APIs you place the bouncer yourself (a filter) and hand rejected guests a standard, well-formatted rejection slip (Problem Details).","bestPractices":["Validate via endpoint filters or FluentValidation","Return RFC 7807 Problem Details for errors","Use TypedResults for testability and OpenAPI"],"commonMistakes":["Assuming automatic model validation like MVC","Returning ad-hoc error shapes instead of Problem Details","Throwing raw exceptions without a handler"],"interviewTip":"Call out that minimal APIs lack MVC auto-validation, then name endpoint filters + Problem Details as the fix.","followUp":["What is RFC 7807 Problem Details?","How do endpoint filters work?","How does this compare to [ApiController] auto-validation?"]},
        {
            question: 'What are Minimal APIs and when would you choose them over controllers?',
            difficulty: 'easy',
            answer: `<p>Minimal APIs are a lightweight approach to building HTTP endpoints in ASP.NET Core using lambda expressions and top-level routing, without the ceremony of controller classes, attributes, and conventions. Choose them for microservices, simple APIs, and when you want explicit, function-based endpoint definitions.</p>`,
            code: `// Minimal API — explicit, lightweight
app.MapGet("/api/users/{id}", async (int id, IUserService svc) =>
    await svc.GetByIdAsync(id) is { } user
        ? Results.Ok(user)
        : Results.NotFound());

// Controller equivalent — more ceremony
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _svc;
    public UsersController(IUserService svc) => _svc = svc;

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var user = await _svc.GetByIdAsync(id);
        return user is not null ? Ok(user) : NotFound();
    }
}

// Choose Minimal APIs when:
// - Building microservices with few endpoints
// - Team prefers explicit over convention
// - Performance is critical (slightly less overhead)
// - Prototyping or rapid development

// Choose Controllers when:
// - Large API with many resources and complex logic
// - Need rich filter pipeline (multiple filter types)
// - Need automatic model validation ([ApiController])
// - Team is familiar with MVC patterns
// - Content negotiation needed`,
            language: 'csharp',
            bestPractices: [
                'Use Route Groups and extension methods to organize Minimal APIs at scale',
                'Use TypedResults for proper OpenAPI documentation',
                'Apply endpoint filters for cross-cutting concerns (validation, logging)',
                'Extract handler logic to static methods or services — don\'t put business logic in lambdas'
            ],
            commonMistakes: [
                'Putting all endpoints in Program.cs without organization (use MapGroup + extension methods)',
                'Not using TypedResults (OpenAPI docs missing response types)',
                'Skipping validation (no automatic [ApiController] validation in Minimal APIs)',
                'Returning Results instead of TypedResults (loses compile-time type info)'
            ],
            interviewTip: 'Show you understand the trade-offs, not just syntax. Minimal APIs are not "better" than controllers — they serve different needs. Mention that Microsoft uses both internally and recommends choosing based on project complexity.',
            followUp: ['How do you organize Minimal APIs in a large project?', 'What is the performance difference?', 'How do endpoint filters compare to action filters?'],
            seniorPerspective: 'I use Minimal APIs for microservices with under 20 endpoints and controllers for larger APIs. The key is consistent organization: each resource gets a static extension method class, regardless of which style you choose.',
            architectPerspective: 'In a microservices architecture, Minimal APIs shine — each service is small enough that the reduced ceremony and faster startup are meaningful. For monolithic APIs with 100+ endpoints, controllers provide better discoverability and convention-based organization.'
        },
        {
            question: 'How do endpoint filters work in Minimal APIs? How do they compare to MVC action filters?',
            difficulty: 'medium',
            answer: `<p><strong>Endpoint filters</strong> intercept the request pipeline before and after the endpoint handler executes. They follow a pipeline pattern (like middleware) where each filter calls <code>next()</code> to continue or short-circuits by returning a result directly. They are simpler than MVC filters but cover most common scenarios.</p>`,
            code: `// Endpoint filter as class (reusable)
public class LoggingFilter : IEndpointFilter
{
    private readonly ILogger<LoggingFilter> _logger;
    public LoggingFilter(ILogger<LoggingFilter> logger) => _logger = logger;

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext ctx,
        EndpointFilterDelegate next)
    {
        var path = ctx.HttpContext.Request.Path;
        _logger.LogInformation("Before: {Path}", path);
        
        var sw = Stopwatch.StartNew();
        var result = await next(ctx); // Call next filter or handler
        sw.Stop();
        
        _logger.LogInformation("After: {Path} ({Elapsed}ms)", path, sw.ElapsedMilliseconds);
        return result;
    }
}

// Inline filter (quick, one-off)
app.MapPost("/orders", CreateOrder)
    .AddEndpointFilter(async (ctx, next) =>
    {
        var request = ctx.GetArgument<CreateOrderRequest>(0);
        if (request.Items.Count == 0)
            return TypedResults.BadRequest("Order must have items");
        return await next(ctx);
    });

// Multiple filters — execute in registration order:
app.MapPost("/users", CreateUser)
    .AddEndpointFilter<LoggingFilter>()      // 1st: logs
    .AddEndpointFilter<ValidationFilter>()    // 2nd: validates
    .AddEndpointFilter<AuthorizationFilter>(); // 3rd: authorizes

// Comparison with MVC Filters:
// MVC has 5 filter types: Authorization, Resource, Action, Exception, Result
// Minimal APIs have ONE filter type that covers most use cases
// MVC filters have richer lifecycle (OnActionExecuting/Executed, OnResultExecuting/Executed)
// Endpoint filters are simpler: just before/after with next() delegation`,
            language: 'csharp',
            bestPractices: [
                'Use class-based filters for reusable logic (validation, logging, auth)',
                'Use inline filters for endpoint-specific one-off checks',
                'Apply filters to Route Groups to avoid repetition',
                'Keep filters focused on one concern (SRP)'
            ],
            commonMistakes: [
                'Not calling next(ctx) — short-circuits without executing the handler',
                'Modifying arguments incorrectly (use ctx.Arguments to access typed params)',
                'Applying filters individually instead of using Route Groups',
                'Heavy logic in inline lambdas (extract to named filters for readability)'
            ],
            interviewTip: 'Explain the pipeline: Filter 1 → Filter 2 → Handler → Filter 2 (after) → Filter 1 (after). This is the same Russian-doll nesting as middleware. Short-circuiting at any point skips remaining filters and the handler.',
            followUp: ['Can endpoint filters access DI services?', 'How do you handle exceptions in Minimal APIs?', 'Can you apply filters globally?'],
            seniorPerspective: 'I use a generic ValidationFilter<T> that resolves FluentValidation validators from DI — one filter handles all validation automatically. Combined with Route Groups, validation is transparent across the entire API.',
            architectPerspective: 'Endpoint filters, when combined with source generators (Request Delegate Generator), produce zero-overhead request pipelines. The entire filter + handler chain is compiled at build time in .NET 8+ for maximum performance.'
        },
        {
            question: 'What are TypedResults and how do they improve API documentation?',
            difficulty: 'medium',
            answer: `<p><code>TypedResults</code> provide compile-time verified return types that automatically generate accurate OpenAPI (Swagger) documentation. By using <code>Results&lt;T1, T2&gt;</code> union return types, the compiler ensures all possible responses are documented and the API contract is explicit.</p>`,
            code: `// WITHOUT TypedResults — OpenAPI doesn't know response types:
app.MapGet("/users/{id}", async (int id, IUserService svc) =>
{
    var user = await svc.GetByIdAsync(id);
    return user is not null ? Results.Ok(user) : Results.NotFound();
});
// OpenAPI: 200 OK (no schema!), no 404 documented

// WITH TypedResults — full OpenAPI documentation:
app.MapGet("/users/{id}", async Task<Results<Ok<UserDto>, NotFound>> 
    (int id, IUserService svc) =>
{
    var user = await svc.GetByIdAsync(id);
    return user is not null
        ? TypedResults.Ok(user.ToDto())
        : TypedResults.NotFound();
});
// OpenAPI: 200 OK (UserDto schema) | 404 Not Found — auto-documented!

// Complex response types:
app.MapPost("/users", async Task<Results<Created<UserDto>, ValidationProblem, Conflict>>
    (CreateUserRequest req, IUserService svc) =>
{
    if (!IsValid(req, out var errors))
        return TypedResults.ValidationProblem(errors);
    
    if (await svc.ExistsAsync(req.Email))
        return TypedResults.Conflict();
    
    var user = await svc.CreateAsync(req);
    return TypedResults.Created($"/users/{user.Id}", user.ToDto());
});
// OpenAPI: 201 Created (UserDto) | 400 ValidationProblem | 409 Conflict

// Available TypedResults:
// TypedResults.Ok(value)           → 200 with body
// TypedResults.Created(uri, value) → 201 with Location header
// TypedResults.NoContent()         → 204
// TypedResults.BadRequest(value)   → 400
// TypedResults.NotFound()          → 404
// TypedResults.Unauthorized()      → 401
// TypedResults.Forbid()            → 403
// TypedResults.Conflict()          → 409
// TypedResults.ValidationProblem() → 400 (RFC 7807)
// TypedResults.Problem()           → 500 (RFC 7807)`,
            language: 'csharp',
            bestPractices: [
                'Always use TypedResults with Results<> union return types for public APIs',
                'Define response DTOs separate from domain models',
                'Use ValidationProblem for input validation errors (RFC 7807 standard)',
                'Document all possible status codes in the return type'
            ],
            commonMistakes: [
                'Using Results (non-typed) which produces incomplete OpenAPI docs',
                'Not specifying the return type signature (loses type information)',
                'Returning domain entities directly (expose too much, breaks when model changes)',
                'Forgetting that TypedResults requires explicit Task<Results<...>> return type'
            ],
            interviewTip: 'TypedResults demonstrate API-first thinking. You define the contract (what responses are possible) in the type system, and the OpenAPI docs are generated automatically. This makes contract-first and code-first equivalent.',
            followUp: ['How does this integrate with Swagger/NSwag?', 'What is RFC 7807 Problem Details?', 'How do you version Minimal APIs?'],
            seniorPerspective: 'I enforce TypedResults via code review policy. It eliminates "surprise" response codes that clients don\'t handle — if the return type says Results<Ok<T>, NotFound>, those are the ONLY possible responses.',
            architectPerspective: 'TypedResults enable contract-driven development at the code level. Combined with NSwag client generation, API consumers get strongly-typed clients that match the server contract exactly — breaking changes are caught at compile time on both sides.'
        },
        {
            question: 'How do route groups help organize Minimal APIs, and how do shared filters and metadata propagate to nested groups?',
            difficulty: 'medium',
            answer: `<p><code>MapGroup</code> (.NET 7+) returns a <code>RouteGroupBuilder</code> that shares a route prefix plus any conventions applied to it — filters, authorization, tags, metadata. Crucially these are <strong>inherited</strong> by endpoints and by nested groups, and they compose in order: a parent group's filters wrap a child group's filters, which wrap the endpoint.</p>
            <ul>
                <li>Prefixes concatenate: parent <code>/api/v1</code> + child <code>/products</code> = <code>/api/v1/products</code></li>
                <li>Filters added to a parent run for every descendant endpoint</li>
                <li><code>RequireAuthorization</code>, <code>WithTags</code>, <code>AddEndpointFilter</code> all flow downward</li>
                <li>Combine with extension methods (one per resource) to keep <code>Program.cs</code> to one line per feature</li>
            </ul>`,
            explanation: 'Route groups are like nested folders with inherited permissions: set a rule on the parent folder and every file and subfolder inherits it, while still allowing per-file overrides.',
            code: `var v1 = app.MapGroup("/api/v1")
    .AddEndpointFilter<CorrelationIdFilter>()   // runs for ALL descendants
    .WithTags("v1");

var products = v1.MapGroup("/products")          // -> /api/v1/products
    .RequireAuthorization()                       // inherited by every product endpoint
    .AddEndpointFilter<ValidationFilter>();       // composes AFTER the parent filter

products.MapGet("/", GetAll);                     // GET /api/v1/products  [auth + both filters]
products.MapGet("/{id:int}", GetById);            // GET /api/v1/products/{id}
products.MapPost("/", Create).AllowAnonymous();   // override: opt out of auth

// Filter execution order for POST /api/v1/products:
// CorrelationIdFilter -> ValidationFilter -> handler -> Validation(after) -> Correlation(after)

// Organize per resource via extension methods:
public static class ProductEndpoints
{
    public static RouteGroupBuilder MapProducts(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/products").WithTags("Products");
        g.MapGet("/", GetAll);
        g.MapGet("/{id:int}", GetById);
        return g;
    }
}
// Program.cs: v1.MapProducts();`,
            language: 'csharp',
            bestPractices: [
                'Apply cross-cutting concerns (auth, validation, correlation) at the group level, not per endpoint',
                'Use one extension method per resource so Program.cs stays a table of contents',
                'Nest groups for versioning (/api/v1) and resource scoping (/products)',
                'Use AllowAnonymous on specific endpoints to override an inherited RequireAuthorization'
            ],
            commonMistakes: [
                'Repeating RequireAuthorization/filters on every endpoint instead of on the group',
                'Assuming child filters run before parent filters (parent wraps child)',
                'Hardcoding the full path on each endpoint instead of composing prefixes via groups',
                'Putting all endpoints inline in Program.cs with no grouping'
            ],
            interviewTip: 'Emphasize inheritance and composition order: parent conventions wrap child conventions which wrap the handler. That ordering detail separates a memorized answer from real understanding.',
            followUp: ['How do you override an inherited authorization requirement on one endpoint?', 'In what order do nested group filters execute?', 'How do route groups support API versioning?'],
            seniorPerspective: 'I treat each resource as a self-contained MapXxx extension and push every shared concern up to the group. Program.cs becomes a readable index of the API surface, and adding a new cross-cutting filter is a one-line change at the group level.',
            architectPerspective: 'Route groups give Minimal APIs the structural discipline controllers had, without the ceremony. For versioned platforms I anchor groups at the version boundary so v1 and v2 can carry different filters and auth while sharing handler code where appropriate.'
        },
        {
            question: 'How does parameter binding work in Minimal APIs, and how does the framework decide where each parameter comes from?',
            difficulty: 'hard',
            answer: `<p>Minimal APIs bind handler parameters by inferring the source from the parameter's type and the route, in a fixed precedence order:</p>
            <ul>
                <li>Route values for names matching a route template token</li>
                <li>Query string for simple types (<code>int</code>, <code>string</code>, <code>Guid</code>, etc.) not in the route</li>
                <li>Body (JSON) for complex types — only <strong>one</strong> body parameter is allowed</li>
                <li>DI container for registered services; well-known types like <code>HttpContext</code>, <code>HttpRequest</code>, <code>ClaimsPrincipal</code>, <code>CancellationToken</code> bind automatically</li>
                <li>A type with a static <code>BindAsync</code> or <code>TryParse</code> binds itself (custom binding)</li>
            </ul>
            <p>Explicit attributes (<code>[FromRoute]</code>, <code>[FromQuery]</code>, <code>[FromBody]</code>, <code>[FromHeader]</code>, <code>[FromServices]</code>, <code>[AsParameters]</code>) override inference. <code>[AsParameters]</code> binds many sources into a single struct/record.</p>`,
            explanation: 'Binding is the framework playing detective: it looks at each parameter and asks "is your name in the route? are you a simple value (query)? a complex object (body)? a known service (DI)?" Attributes are you telling the detective the answer directly.',
            code: `// Inference in action — no attributes needed:
app.MapGet("/orders/{id:int}", (
    int id,                 // route (name matches template)
    bool detailed,          // query (simple type, not in route)
    IOrderService svc,      // DI (registered service)
    CancellationToken ct) => svc.GetAsync(id, detailed, ct));

app.MapPost("/orders", (
    CreateOrderRequest body,  // body (complex type) — only ONE allowed
    ClaimsPrincipal user,     // well-known: current principal
    IOrderService svc) => svc.CreateAsync(body, user));

// Explicit overrides:
app.MapGet("/search", (
    [FromQuery] string term,
    [FromHeader(Name = "X-Tenant")] string tenant,
    [FromServices] ISearchService search) => search.Run(term, tenant));

// [AsParameters] groups many query/route values into one type:
public record ProductFilter(string? Category, int Page = 1, int Size = 20);
app.MapGet("/products", ([AsParameters] ProductFilter f, IProductRepo repo)
    => repo.Query(f.Category, f.Page, f.Size));

// Custom binding: a type that parses itself from a route/query string
public readonly record struct Slug(string Value)
{
    public static bool TryParse(string? s, out Slug result)
    { result = new Slug(s ?? ""); return !string.IsNullOrWhiteSpace(s); }
}
app.MapGet("/posts/{slug}", (Slug slug) => $"Post: {slug.Value}");`,
            language: 'csharp',
            bestPractices: [
                'Lean on inference for clarity; add attributes only to override or disambiguate',
                'Use [AsParameters] to keep handlers tidy when many query/route values are involved',
                'Implement TryParse/BindAsync on custom types for clean self-binding',
                'Keep to a single body parameter — split complex inputs into one DTO'
            ],
            commonMistakes: [
                'Declaring two complex parameters expecting both from the body (only one body bind is allowed)',
                'Assuming a complex type binds from the query string (it defaults to body)',
                'Forgetting CancellationToken/HttpContext bind automatically and adding plumbing for them',
                'Relying on inference where it is ambiguous instead of being explicit with attributes'
            ],
            interviewTip: 'State the precedence order out loud: route -> query (simple) -> body (complex, one only) -> DI/special types. Then mention TryParse/BindAsync and [AsParameters] as the advanced escape hatches.',
            followUp: ['How do you bind a custom type from a route segment?', 'Why can you have only one body parameter?', 'What does [AsParameters] solve?'],
            seniorPerspective: 'I prefer [AsParameters] with a record for anything beyond two or three inputs — it documents the contract, plays well with OpenAPI, and keeps the handler signature legible. Custom TryParse on value objects (Slug, EmailAddress) pushes validation to the boundary.',
            architectPerspective: 'Explicit, inspectable binding is part of why Minimal APIs AOT-compile well: the Request Delegate Generator can emit binding code at build time when sources are unambiguous. Designing handlers with clear binding intent pays off directly in startup performance and trimming.'
        },
        {
            question: 'Why do Minimal APIs have better Native AOT and startup characteristics than controllers, and what role does the Request Delegate Generator play?',
            difficulty: 'advanced',
            answer: `<p>MVC controllers rely heavily on runtime reflection: discovering controllers/actions, building model binders, and invoking methods dynamically. That reflection is incompatible with trimming and slows cold start. Minimal APIs are explicit — each endpoint is a delegate with known parameter sources — so the <strong>Request Delegate Generator (RDG)</strong>, a source generator enabled with AOT/<code>PublishAot</code> or <code>EnableRequestDelegateGenerator</code>, can emit the binding and invocation code at <strong>compile time</strong>.</p>
            <ul>
                <li>No reflection at runtime for request handling means the linker can trim aggressively</li>
                <li>Compile-time delegates reduce JIT work and startup allocations, cutting cold start dramatically</li>
                <li>This makes Minimal APIs ideal for serverless (Lambda, Azure Functions) and scale-to-zero containers</li>
                <li>Controllers can run AOT in newer versions but historically Minimal APIs are the first-class AOT path</li>
            </ul>`,
            explanation: 'Reflection-based frameworks figure out how to call your code while the plane is taxiing (startup). The source generator does that paperwork on the ground at build time, so the plane takes off the instant it reaches the runway.',
            code: `// Program.cs for a trimmable, AOT-friendly Minimal API:
var builder = WebApplication.CreateSlimBuilder(args); // slim builder = fewer defaults, smaller

// Use the JSON source generator (no reflection-based serialization):
builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonContext.Default));

var app = builder.Build();

app.MapGet("/products/{id:int}", (int id, IProductRepo repo) => repo.Get(id));

app.Run();

// Source-generated JSON context — replaces runtime reflection:
[JsonSerializable(typeof(Product))]
[JsonSerializable(typeof(Product[]))]
internal partial class AppJsonContext : JsonSerializerContext { }

// Publish:  dotnet publish -c Release -r linux-x64 -p:PublishAot=true
// RDG + JSON source gen + trimming => small, fast-starting, reflection-free binary`,
            language: 'csharp',
            bestPractices: [
                'Use CreateSlimBuilder and a JsonSerializerContext source generator for AOT apps',
                'Keep handler binding unambiguous so the Request Delegate Generator can emit code',
                'Reserve AOT for cold-start-sensitive workloads (serverless, scale-to-zero)',
                'Measure published binary size and startup before and after enabling AOT'
            ],
            commonMistakes: [
                'Expecting AOT benefits while still using reflection-based JSON serialization',
                'Using dynamic/reflection-heavy patterns that defeat trimming and break at runtime',
                'Enabling AOT without testing trimmed output (trimming can remove needed code)',
                'Assuming controllers and Minimal APIs have identical AOT support across all versions'
            ],
            interviewTip: 'Connect the dots: explicit delegates -> source-generated binding (RDG) -> no runtime reflection -> trimmable + fast cold start. Mention the JSON source generator, since serialization is the other big reflection consumer.',
            followUp: ['What is the JSON source generator and why is it needed for AOT?', 'What does CreateSlimBuilder change versus CreateBuilder?', 'How do you diagnose trimming warnings?'],
            seniorPerspective: 'For serverless I default to Minimal APIs + AOT + the JSON source generator; cold starts drop from seconds to tens of milliseconds. The constraint is discipline: every reflection-based library you pull in risks trimming warnings, so I vet dependencies for AOT compatibility up front.',
            architectPerspective: 'AOT changes the deployment economics of scale-to-zero: fast cold starts mean you can run lean and let infrastructure idle to zero without punishing the first user. I treat AOT-readiness as an architectural property of a service, validated in CI, not a last-minute publish flag.'
        },
        {
            question: 'What are the key trade-offs between Minimal APIs and MVC Controllers? When would you choose one over the other in a production system?',
            difficulty: 'hard',
            answer: `<p><strong>Minimal APIs</strong> excel at: microservices with few endpoints, high-performance/low-latency services, serverless (AOT-friendly), rapid prototyping, and simple CRUD APIs. <strong>Controllers</strong> excel at: large APIs with many endpoints needing organization, teams familiar with MVC conventions, APIs requiring complex model binding/validation, and scenarios needing filters (action/resource/exception filters).</p>
            <p>Key trade-offs:</p>
            <ul>
                <li><strong>Organization</strong> — Controllers group related endpoints by class with shared attributes/DI. Minimal APIs require manual grouping via MapGroup or extension methods.</li>
                <li><strong>Filters</strong> — Controllers have a rich filter pipeline (authorization, resource, action, exception, result). Minimal APIs have endpoint filters (.NET 7+), but fewer lifecycle hooks.</li>
                <li><strong>Model validation</strong> — Controllers auto-validate via [ApiController] + DataAnnotations. Minimal APIs require manual validation or a library like FluentValidation.</li>
                <li><strong>Performance</strong> — Minimal APIs have less overhead (no controller activation, no action descriptor resolution). Meaningful only at very high throughput.</li>
                <li><strong>Testability</strong> — Both are testable, but Minimal API endpoint delegates are simpler to invoke directly.</li>
            </ul>`,
            explanation: 'Controllers are a filing cabinet with labeled drawers for a large office. Minimal APIs are sticky notes on a wall — fast and visible for a small team, chaotic once you have hundreds.',
            code: `// MINIMAL API — great for focused microservices:
var app = WebApplication.Create(args);
var group = app.MapGroup("/api/products")
    .WithTags("Products")
    .RequireAuthorization();

group.MapGet("/", (IProductService svc) => svc.GetAll());
group.MapGet("/{id:int}", (int id, IProductService svc) => svc.GetById(id));
group.MapPost("/", (CreateProductDto dto, IProductService svc) => svc.Create(dto));

// CONTROLLER — great for large, feature-rich APIs:
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    // Auto model validation, action filters, consistent error responses
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        // [ApiController] already validated dto via DataAnnotations
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
}

// HYBRID APPROACH — use both in the same project:
// Controllers for complex, heavily-filtered endpoints
// Minimal APIs for simple health checks, webhooks, internal endpoints
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
app.MapControllers(); // coexist peacefully`,
            language: 'csharp',
            bestPractices: [
                'Use Minimal APIs for microservices with under 15-20 endpoints',
                'Use Controllers when you need extensive filter pipelines or auto-validation',
                'Use MapGroup to organize Minimal APIs into logical units with shared middleware',
                'Consider a hybrid approach: Controllers for complex areas, Minimal APIs for simple ones',
                'Choose based on team familiarity — consistency matters more than micro-optimization'
            ],
            commonMistakes: [
                'Choosing Minimal APIs for a 50+ endpoint API and ending up with an unorganized Program.cs',
                'Choosing Controllers for a 3-endpoint microservice (unnecessary ceremony)',
                'Assuming Minimal APIs cannot handle production workloads (they absolutely can)',
                'Not using MapGroup, resulting in repeated configuration per endpoint'
            ],
            interviewTip: 'Show balanced judgment: name specific scenarios for each. The senior answer is not "one is better" but "it depends on team size, API complexity, and deployment model." Mention the hybrid approach.',
            followUp: ['Can you use action filters with Minimal APIs?', 'How do you handle model validation in Minimal APIs?', 'What is the performance difference in practice?']
        },
        {
            question: 'How do endpoint filters work in Minimal APIs (.NET 7+), and how do they compare to MVC action filters?',
            difficulty: 'hard',
            answer: `<p>Endpoint filters in Minimal APIs are the equivalent of MVC action filters — they run code before and after the endpoint handler. They implement <code>IEndpointFilter</code> or use the <code>AddEndpointFilter</code> delegate syntax. Filters execute in registration order (first registered = outermost) and can short-circuit by returning a result without calling <code>next()</code>.</p>
            <p>Key differences from MVC filters:</p>
            <ul>
                <li>Endpoint filters have a single pipeline (before/after), whereas MVC has 5 filter stages (Authorization, Resource, Action, Exception, Result)</li>
                <li>Endpoint filters receive <code>EndpointFilterInvocationContext</code> with access to arguments by index, not by name</li>
                <li>Endpoint filters can modify arguments before they reach the handler</li>
                <li>They compose naturally with the endpoint delegate model — no controller activation overhead</li>
            </ul>`,
            explanation: 'Endpoint filters are like TSA checkpoints specific to one gate. MVC action filters are a multi-layer security system with dedicated stations for ID check, bag scan, pat-down, and exit inspection.',
            code: `// DELEGATE-BASED FILTER (inline):
app.MapPost("/api/orders", (CreateOrderDto dto, IOrderService svc) => svc.Create(dto))
    .AddEndpointFilter(async (context, next) =>
    {
        var dto = context.GetArgument<CreateOrderDto>(0);
        if (dto.Amount <= 0)
            return Results.BadRequest(new { error = "Amount must be positive" });
        return await next(context); // continue to handler
    });

// CLASS-BASED FILTER (reusable):
public class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dto = context.GetArgument<T>(0);
        var validator = context.HttpContext.RequestServices
            .GetService<IValidator<T>>();
        if (validator is not null)
        {
            var result = await validator.ValidateAsync(dto);
            if (!result.IsValid)
                return Results.ValidationProblem(result.ToDictionary());
        }
        return await next(context);
    }
}

// Applied to a group:
var group = app.MapGroup("/api/products")
    .AddEndpointFilter<ValidationFilter<CreateProductDto>>();

// FILTER CHAINING (order matters — first registered is outermost):
app.MapGet("/api/data", GetData)
    .AddEndpointFilter<LoggingFilter>()     // runs first (outermost)
    .AddEndpointFilter<AuthorizationFilter>() // runs second
    .AddEndpointFilter<CachingFilter>();      // runs third (innermost)

// SHORT-CIRCUITING: return a result without calling next()
// This skips all inner filters AND the handler`,
            language: 'csharp',
            bestPractices: [
                'Use class-based filters (IEndpointFilter) for reusable cross-cutting concerns',
                'Apply filters to MapGroup for consistent behavior across related endpoints',
                'Keep filter logic focused — one concern per filter (validation, logging, caching)',
                'Use GetArgument<T>(index) for type-safe argument access in filters',
                'Register filters in the correct order (outermost concern first)'
            ],
            commonMistakes: [
                'Accessing arguments by wrong index (positional, not named like MVC)',
                'Forgetting to call next() — silently short-circuits without a response',
                'Registering filters in wrong order expecting inner-to-outer execution',
                'Using endpoint filters for global concerns better handled by middleware'
            ],
            interviewTip: 'Compare to MVC: "MVC has 5 filter stages, Minimal APIs have one filter pipeline that can do before/after/short-circuit." Show a validation filter example and explain argument access is positional.',
            followUp: ['When would you use middleware vs endpoint filters?', 'How do you access DI services inside an endpoint filter?', 'Can endpoint filters modify the response after the handler runs?']
        },
        {
            question: 'How do endpoint filters work in Minimal APIs compared to MVC action filters? Explain the IEndpointFilter interface and how filters compose with route groups.',
            difficulty: 'hard',
            answer: `<p>Endpoint filters in Minimal APIs provide a single-stage before/after pipeline (unlike MVC's 5 filter stages: Authorization, Resource, Action, Exception, Result). They implement <code>IEndpointFilter</code> with one method: <code>InvokeAsync(EndpointFilterInvocationContext, EndpointFilterDelegate)</code>. You access handler arguments positionally via <code>context.GetArgument&lt;T&gt;(index)</code> rather than by name.</p>
            <p>Filters compose with route groups by calling <code>.AddEndpointFilter&lt;T&gt;()</code> on either individual endpoints or on a MapGroup â€” all endpoints in the group inherit the filter. Multiple filters execute in registration order (outermost first), forming a pipeline similar to middleware but scoped to specific endpoints rather than the entire app.</p>
            <p>Key differences from MVC: no model binding metadata (arguments are positional), no OnActionExecuted/OnActionExecuting split (single async method with before/after around next()), and no filter ordering attributes â€” order is purely registration-based. Short-circuiting works by returning a result without calling next().</p>`,
            explanation: 'MVC filters are like a multi-room security process (different checks at different stages). Endpoint filters are a single checkpoint that can inspect your bag before and after you pass through â€” simpler but equally powerful for most needs.',
            code: `// IEndpointFilter implementation:
public class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        // BEFORE: validate the first argument
        var arg = context.GetArgument<T>(0);
        var validator = context.HttpContext.RequestServices
            .GetRequiredService<IValidator<T>>();
        var result = await validator.ValidateAsync(arg);
        
        if (!result.IsValid)
            return Results.ValidationProblem(result.ToDictionary());
        
        // Call next filter/handler
        return await next(context);
        // AFTER: could inspect/modify response here
    }
}

// Applying to route groups:
var api = app.MapGroup("/api/v1")
    .AddEndpointFilter<LoggingFilter>()      // All endpoints get logging
    .AddEndpointFilter<AuthTenantFilter>();   // All endpoints get tenant check

var orders = api.MapGroup("/orders")
    .AddEndpointFilter<ValidationFilter<CreateOrderRequest>>();

orders.MapPost("/", (CreateOrderRequest req) => { /* handler */ });
orders.MapGet("/{id}", (int id) => { /* handler */ });

// Inline filter (lambda syntax for simple cases):
app.MapGet("/items", () => Results.Ok())
    .AddEndpointFilter(async (context, next) =>
    {
        var sw = Stopwatch.StartNew();
        var result = await next(context);
        sw.Stop();
        // Log timing after handler completes
        return result;
    });`,
            language: 'csharp',
            bestPractices: [
                'Use class-based filters (IEndpointFilter) for reusable cross-cutting concerns',
                'Apply filters to MapGroup for consistent behavior across related endpoints',
                'Keep filter logic focused â€” one concern per filter (validation, logging, caching)',
                'Use GetArgument<T>(index) for type-safe argument access in filters',
                'Register filters in the correct order (outermost concern first)'
            ],
            commonMistakes: [
                'Accessing arguments by wrong index (positional, not named like MVC model binding)',
                'Forgetting to call next() â€” silently short-circuits without producing a response',
                'Registering filters in wrong order expecting inner-to-outer execution',
                'Using endpoint filters for global concerns better handled by middleware'
            ],
            interviewTip: 'Compare to MVC: "MVC has 5 filter stages with ordering attributes, Minimal APIs have one pipeline that can do before/after/short-circuit." Show a validation filter example and explain that argument access is positional, not named.',
            followUp: ['When would you use middleware vs endpoint filters?', 'How do you access DI services inside an endpoint filter?', 'Can endpoint filters modify the response after the handler runs?']
        },
        {
            question: 'How do you organize a large Minimal API application using route groups with prefix inheritance, shared filters, and nested groups?',
            difficulty: 'hard',
            answer: `<p>Route groups (<code>MapGroup</code>) provide hierarchical organization: each group defines a prefix, and nested groups inherit parent prefixes. Filters, metadata, and conventions applied to a group propagate to all endpoints within it. This enables a clean separation-of-concerns structure where cross-cutting behavior (auth, validation, rate limiting) is declared once at the group level.</p>
            <p>The recommended structure for large APIs: a top-level group per API version ("/api/v1"), feature groups beneath it ("/api/v1/orders", "/api/v1/products"), and endpoint registration methods in static classes per feature. Shared filters (authentication, tenant resolution) go on the version group; feature-specific filters (validation) go on the feature group.</p>
            <p>This achieves the organizational clarity of MVC controllers without the ceremony of controller classes. Each feature becomes a static class with an extension method that registers its routes on a group, making the code testable, discoverable, and independently deployable in modular monolith architectures.</p>`,
            explanation: 'Route groups are like folders in a file system â€” "/api/v1/orders/create" inherits the path from each parent folder, and permissions (filters) set on a parent folder apply to everything inside it.',
            code: `// Program.cs â€” top-level structure
var app = builder.Build();

var api = app.MapGroup("/api/v1")
    .AddEndpointFilter<ApiKeyFilter>()
    .RequireAuthorization();

// Feature modules register their own routes:
api.MapOrderEndpoints();      // /api/v1/orders/...
api.MapProductEndpoints();    // /api/v1/products/...
api.MapCustomerEndpoints();   // /api/v1/customers/...

// OrderEndpoints.cs â€” feature module
public static class OrderEndpoints
{
    public static RouteGroupBuilder MapOrderEndpoints(
        this RouteGroupBuilder group)
    {
        var orders = group.MapGroup("/orders")
            .WithTags("Orders");  // Swagger grouping

        orders.MapGet("/", GetAllOrders);
        orders.MapGet("/{id:int}", GetOrderById);
        orders.MapPost("/", CreateOrder)
            .AddEndpointFilter<ValidationFilter<CreateOrderRequest>>();
        
        // Nested group for admin-only operations:
        var admin = orders.MapGroup("/admin")
            .RequireAuthorization("AdminPolicy");
        admin.MapDelete("/{id:int}", DeleteOrder);
        admin.MapPost("/bulk-cancel", BulkCancelOrders);

        return orders;
    }

    private static async Task<IResult> GetAllOrders(
        IOrderService service, [AsParameters] PaginationParams p)
        => Results.Ok(await service.GetAllAsync(p.Page, p.PageSize));

    private static async Task<IResult> CreateOrder(
        CreateOrderRequest req, IOrderService service)
        => Results.Created($"/orders/{order.Id}", 
            await service.CreateAsync(req));
}`,
            language: 'csharp',
            bestPractices: [
                'Use one static class per feature/resource for endpoint registration',
                'Apply shared filters (auth, logging) at the highest applicable group level',
                'Use WithTags for Swagger/OpenAPI grouping that mirrors your route structure',
                'Keep endpoint handlers as thin delegates â€” delegate to service layer',
                'Use [AsParameters] for complex query parameter binding in GET endpoints'
            ],
            commonMistakes: [
                'Putting all endpoints in Program.cs (becomes unmanageable at scale)',
                'Duplicating filters on individual endpoints when they belong on the group',
                'Creating too many nesting levels (2-3 is ideal, more becomes confusing)',
                'Not using WithTags â€” Swagger UI shows a flat list without grouping'
            ],
            interviewTip: 'Show the extension method pattern (MapXxxEndpoints on RouteGroupBuilder) as the organizational equivalent of MVC controllers. Mention prefix inheritance, filter propagation, and how this enables feature-sliced architecture without the controller class ceremony.',
            followUp: ['How does this compare to Carter library for Minimal API organization?', 'Can route groups have different authentication schemes?', 'How do you handle API versioning with route groups?']
        }
    ]
});
