'use strict';

PageData.register('api-governance', {
    title: 'API Governance',
    description: 'Strategies for versioning, deprecation, contract-first design, and governing APIs at scale across multiple teams.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>API governance is the discipline of managing APIs as first-class products throughout their lifecycle. As organizations scale beyond a handful of services, ungoverned APIs become a liability — inconsistent naming, undocumented breaking changes, and orphaned endpoints erode developer trust and slow integration.</p>
<p>Governance establishes the rules, processes, and tooling that ensure every API published within an organization meets quality, consistency, and compatibility standards. It covers versioning strategy, contract-first design, deprecation workflows, style enforcement, and cross-team review processes.</p>
<p>This topic is critical for senior engineers and architects who must balance developer autonomy with organizational coherence. Interview questions in this space test whether candidates can think systemically about API evolution, not just write endpoints.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>API governance rests on several foundational pillars:</p>
<ul>
<li><strong>Versioning</strong> — A strategy for evolving APIs without breaking existing consumers. Common schemes include URL path versioning (<code>/v1/orders</code>), query parameter versioning, custom header versioning (<code>X-API-Version: 2</code>), and media type versioning (<code>Accept: application/vnd.company.v2+json</code>).</li>
<li><strong>Contract-First Design</strong> — Writing the OpenAPI specification before any implementation code. This inverts the typical workflow and forces teams to think about the consumer experience upfront.</li>
<li><strong>Breaking vs Non-Breaking Changes</strong> — A breaking change removes or renames a field, changes a type, removes an endpoint, or tightens validation. A non-breaking change adds optional fields, adds new endpoints, or relaxes validation.</li>
<li><strong>Backward Compatibility</strong> — The guarantee that existing clients continue to function after an API update. This is the north star of governance.</li>
<li><strong>Deprecation Lifecycle</strong> — A structured process for signaling that an endpoint or version will be removed, giving consumers time to migrate.</li>
<li><strong>Consumer-Driven Contracts</strong> — Consumers define their expectations in executable tests (e.g., Pact), and providers verify they meet those contracts before deploying.</li>
<li><strong>API Style Guide</strong> — An organization-wide document defining naming conventions, error formats, pagination patterns, authentication schemes, and HTTP verb usage.</li>
</ul>`,
            table: {
                headers: ['Versioning Strategy', 'Pros', 'Cons', 'Best For'],
                rows: [
                    ['URL Path (/v1/)', 'Explicit, cacheable, easy routing', 'URL pollution, hard to sunset', 'Public APIs, large consumer base'],
                    ['Query Param (?v=2)', 'Optional, backward-compatible default', 'Easy to miss, caching issues', 'Internal APIs, gradual rollout'],
                    ['Custom Header', 'Clean URLs, flexible', 'Hidden, requires documentation', 'Internal microservices'],
                    ['Media Type (Accept)', 'RESTful, content negotiation', 'Complex, tooling gaps', 'Hypermedia APIs, advanced clients']
                ]
            }
        },
        {
            title: 'How It Works',
            content: `<p>The API lifecycle is a repeatable process that every endpoint traverses from inception to retirement:</p>
<ol>
<li><strong>Design</strong> — Define the contract using OpenAPI/Swagger. Conduct design reviews with consumers. Validate naming against the style guide. Run linting tools (Spectral, Redocly) against the spec.</li>
<li><strong>Build</strong> — Generate server stubs and client SDKs from the spec. Implement business logic. Write integration tests that validate the contract.</li>
<li><strong>Publish</strong> — Deploy the API behind a gateway. Register it in the API catalog. Generate documentation. Announce availability through developer portal.</li>
<li><strong>Monitor</strong> — Track usage metrics, error rates, latency percentiles. Identify which consumers use which endpoints.</li>
<li><strong>Evolve</strong> — Add new capabilities as non-breaking changes. When breaking changes are unavoidable, create a new version and begin deprecation of the old.</li>
<li><strong>Deprecate</strong> — Mark the old version with <code>Sunset</code> and <code>Deprecation</code> headers. Notify consumers. Set a migration deadline (typically 6-12 months for public APIs).</li>
<li><strong>Sunset</strong> — After the deadline passes and usage drops to zero (or an acceptable threshold), remove the old version. Return 410 Gone for any remaining callers.</li>
</ol>
<p>Each phase has governance checkpoints — automated linting in Design, contract tests in Build, catalog registration in Publish, usage thresholds in Deprecate.</p>`
        },
        {
            title: 'Visual Diagram',
            content: `<p>The API lifecycle as a governed pipeline with feedback loops:</p>`,
            mermaid: `graph LR
    A[Design] -->|Contract Review| B[Build]
    B -->|Contract Tests| C[Publish]
    C -->|Usage Monitoring| D[Monitor]
    D -->|Feature Requests| E[Evolve]
    E -->|Breaking Change?| F{Decision}
    F -->|No| C
    F -->|Yes| G[New Version]
    G --> C
    D -->|Low Usage| H[Deprecate]
    H -->|Migration Complete| I[Sunset]
    I -->|410 Gone| J[Removed]

    style A fill:#4CAF50,color:#fff
    style C fill:#2196F3,color:#fff
    style H fill:#FF9800,color:#fff
    style I fill:#f44336,color:#fff`
        },
        {
            title: 'Implementation',
            content: `<p>ASP.NET Core provides first-class support for API versioning through the <code>Asp.Versioning</code> packages. Below is a production-ready setup that supports URL path, header, and query parameter versioning simultaneously:</p>`,
            code: `// Program.cs — API Versioning Configuration
using Asp.Versioning;
using Asp.Versioning.ApiExplorer;

var builder = WebApplication.CreateBuilder(args);

// Configure API versioning with multiple readers
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true; // Adds api-supported-versions header
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new HeaderApiVersionReader("X-API-Version"),
        new QueryStringApiVersionReader("api-version")
    );
})
.AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// Configure Swagger to show all versions
builder.Services.AddSwaggerGen();
builder.Services.ConfigureOptions<ConfigureSwaggerOptions>();

var app = builder.Build();

// Middleware: Add deprecation headers for sunset versions
app.Use(async (context, next) =>
{
    await next();
    
    // Add Sunset header for deprecated versions
    if (context.GetEndpoint()?.Metadata
        .GetMetadata<ApiVersionMetadata>() is { } metadata)
    {
        var version = context.GetRequestedApiVersion();
        if (version?.MajorVersion == 1)
        {
            context.Response.Headers["Sunset"] = "Sat, 01 Mar 2025 00:00:00 GMT";
            context.Response.Headers["Deprecation"] = "true";
            context.Response.Headers["Link"] = 
                "</v2/orders>; rel=\\"successor-version\\"";
        }
    }
});

app.Run();`,
            language: 'csharp'
        },
        {
            title: 'Implementation — Versioned Controller',
            content: `<p>Controllers declare which versions they support using attributes. Here is a versioned Orders controller showing both v1 and v2 side-by-side:</p>`,
            code: `// Controllers/V1/OrdersController.cs
using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;

namespace MyApi.Controllers.V1;

[ApiController]
[ApiVersion("1.0", Deprecated = true)]  // Mark as deprecated
[Route("api/v{version:apiVersion}/[controller]")]
public class OrdersController : ControllerBase
{
    /// <summary>
    /// V1 returns flat order with no line items detail
    /// </summary>
    [HttpGet("{id}")]
    [MapToApiVersion("1.0")]
    public ActionResult<OrderV1Dto> GetOrder(int id)
    {
        return Ok(new OrderV1Dto
        {
            Id = id,
            Total = 99.99m,
            Status = "Shipped",
            CustomerName = "Jane Doe"  // Flat structure
        });
    }
}

// Controllers/V2/OrdersController.cs
namespace MyApi.Controllers.V2;

[ApiController]
[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class OrdersController : ControllerBase
{
    /// <summary>
    /// V2 returns nested structure with line items and metadata
    /// </summary>
    [HttpGet("{id}")]
    [MapToApiVersion("2.0")]
    public ActionResult<OrderV2Dto> GetOrder(int id)
    {
        return Ok(new OrderV2Dto
        {
            Id = id,
            Total = new MoneyDto { Amount = 99.99m, Currency = "USD" },
            Status = OrderStatus.Shipped,
            Customer = new CustomerRefDto { Id = 42, Name = "Jane Doe" },
            LineItems = new List<LineItemDto>
            {
                new() { Sku = "WIDGET-1", Quantity = 2, UnitPrice = 49.995m }
            },
            Metadata = new Dictionary<string, string>
            {
                ["created"] = "2024-01-15T10:30:00Z",
                ["warehouse"] = "US-EAST-1"
            }
        });
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Best Practices',
            content: `<p>Governance rules that high-performing API teams follow:</p>
<ul>
<li><strong>Contract-first, always.</strong> Write the OpenAPI spec before any implementation code. This forces consumer-centric thinking and enables parallel frontend/backend development.</li>
<li><strong>Automate style enforcement.</strong> Use Spectral or Redocly CLI in CI/CD to lint API specs against your style guide. Humans shouldn't catch naming violations — machines should.</li>
<li><strong>Version from day one.</strong> Even internal APIs benefit from versioning. The cost of adding it later (when you need a breaking change) is dramatically higher.</li>
<li><strong>Prefer additive evolution.</strong> Add new optional fields, new endpoints, new query parameters. Avoid removing, renaming, or retyping anything that exists.</li>
<li><strong>Use Sunset headers early.</strong> The moment you know a version will be retired, start emitting <code>Sunset</code> and <code>Deprecation</code> headers. This gives automated tooling time to alert consumers.</li>
<li><strong>Maintain an API catalog.</strong> Every API in the org should be discoverable in a central registry with ownership, SLA, version status, and consumer list.</li>
<li><strong>Require consumer-driven contract tests.</strong> For critical integration points, consumers publish Pact contracts and providers verify them before deployment.</li>
<li><strong>Set deprecation timelines by audience.</strong> Internal APIs: 3-6 months. Partner APIs: 6-12 months. Public APIs: 12-24 months minimum.</li>
<li><strong>Track adoption metrics.</strong> You cannot sunset what you cannot measure. Log which consumers call which versions and endpoints.</li>
<li><strong>API review board for breaking changes.</strong> Any change classified as breaking must go through a lightweight review process — not to block, but to ensure the migration plan exists.</li>
</ul>`,
            callout: {
                type: 'tip',
                title: 'The Robustness Principle',
                text: 'Be conservative in what you send, be liberal in what you accept (Postel\'s Law). APIs should accept unknown fields without error and only send documented fields. This single principle prevents more breaking changes than any other.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<p>Patterns that consistently cause API governance failures:</p>
<ul>
<li><strong>Versioning too aggressively.</strong> Creating v3, v4, v5 for every change signals poor design. If you need a new version every quarter, your initial contract wasn't thought through.</li>
<li><strong>Removing fields without deprecation.</strong> Deleting a response field because "nobody uses it" will break the one client you didn't know about. Always deprecate first, measure, then remove.</li>
<li><strong>Ignoring optional field semantics.</strong> Making a previously optional request field required is a breaking change, even though the field already existed. Tightening validation breaks clients.</li>
<li><strong>Governance as gatekeeping.</strong> If the API review process takes 3 weeks and requires a VP sign-off, teams will route around it. Governance should be lightweight, automated, and enabling — not blocking.</li>
<li><strong>No consumer tracking.</strong> Without knowing who calls what, you cannot deprecate safely. Require API keys or client certificates even for internal services.</li>
<li><strong>Coupling version to implementation.</strong> The API version is a contract version, not a code version. Your internal refactoring should not require a new API version.</li>
<li><strong>Forgetting error contract stability.</strong> Error response shapes are part of the contract. Changing error codes, formats, or messages can break client error handling.</li>
<li><strong>Style guide without enforcement.</strong> A 50-page PDF that nobody reads is not governance. Executable linting rules in CI are governance.</li>
</ul>`
        },
        {
            title: 'Real-World Applications',
            content: `<p>API governance in production at scale:</p>
<ul>
<li><strong>Stripe</strong> — Uses date-based versioning (2024-01-15). Every API call is pinned to the version the client was created with. Stripe maintains dozens of active versions simultaneously through an internal translation layer that converts between versions.</li>
<li><strong>Microsoft Graph</strong> — Uses URL path versioning (v1.0, beta) with a strict "no breaking changes in v1.0" policy. New capabilities land in beta first. The governance process requires breaking change review for any v1.0 modification.</li>
<li><strong>Twilio</strong> — Maintains a "Deprecation Playbook" with fixed timelines. When an API is deprecated, they reach out individually to high-usage consumers, provide migration guides, and track migration progress on a dashboard.</li>
<li><strong>Netflix</strong> — Internal API governance uses a federated GraphQL model. Each team owns their domain's schema, but a central schema registry validates that changes are backward-compatible before merge.</li>
<li><strong>AWS</strong> — Never removes public API functionality. Old APIs remain functional indefinitely, even if discouraged. This extreme backward-compatibility stance is expensive but builds customer trust.</li>
<li><strong>Banking/PSD2</strong> — Regulatory APIs (Open Banking) have governance mandated by law. Version changes require regulator approval, 6-month notice periods, and backward-compatible sandbox environments.</li>
</ul>`
        },
        {
            title: 'Versioning Decision Tree',
            content: `<p>Use this decision tree when evaluating whether a change requires a new API version:</p>`,
            mermaid: `graph TD
    A[Proposed Change] --> B{Removes or renames<br/>an existing field?}
    B -->|Yes| C[BREAKING - New Version Required]
    B -->|No| D{Changes field type<br/>or format?}
    D -->|Yes| C
    D -->|No| E{Makes optional field<br/>required?}
    E -->|Yes| C
    E -->|No| F{Removes an endpoint<br/>or HTTP method?}
    F -->|Yes| C
    F -->|No| G{Changes error codes<br/>or response status?}
    G -->|Yes| H{Only adding new<br/>error codes?}
    H -->|Yes| I[NON-BREAKING - Safe to Deploy]
    H -->|No| C
    G -->|No| J{Adds new optional<br/>field or endpoint?}
    J -->|Yes| I
    J -->|No| K{Changes behavior<br/>without contract change?}
    K -->|Yes| L[GRAY AREA - Review Required]
    K -->|No| I

    style C fill:#f44336,color:#fff
    style I fill:#4CAF50,color:#fff
    style L fill:#FF9800,color:#fff`
        },
        {
            title: 'Consumer-Driven Contracts',
            content: `<p>Consumer-Driven Contracts (CDC) flip the traditional testing model: instead of providers defining what they offer and hoping consumers adapt, consumers explicitly state what they need, and providers verify they can deliver it.</p>
<p><strong>How Pact works:</strong></p>
<ol>
<li><strong>Consumer writes a Pact test</strong> — Defines the request it will make and the minimum response it expects (only the fields it actually uses).</li>
<li><strong>Pact generates a contract file</strong> — A JSON document capturing the interaction expectations.</li>
<li><strong>Contract is shared</strong> — Uploaded to a Pact Broker (or committed to a shared repo).</li>
<li><strong>Provider verifies the contract</strong> — Replays the consumer's expected requests against the real provider and validates the responses match expectations.</li>
<li><strong>Deployment gating</strong> — The <code>can-i-deploy</code> check in CI prevents deploying a provider version that would break any consumer.</li>
</ol>
<p><strong>Why this matters for governance:</strong> CDC tests catch breaking changes before they reach production. If a provider team wants to remove a field, the Pact verification will fail for any consumer that depends on that field — creating an automatic enforcement mechanism for backward compatibility.</p>`,
            code: `// Consumer-side Pact test (xUnit + PactNet)
using PactNet;
using PactNet.Matchers;

public class OrderServiceConsumerTests
{
    private readonly IPactBuilderV4 _pactBuilder;

    public OrderServiceConsumerTests()
    {
        var pact = Pact.V4("OrderWebApp", "OrderService", new PactConfig
        {
            PactDir = "../../../pacts"
        });
        _pactBuilder = pact.WithHttpInteractions();
    }

    [Fact]
    public async Task GetOrder_ReturnsExpectedFields()
    {
        // Arrange — define what we expect from the provider
        _pactBuilder
            .UponReceiving("a request for order 42")
            .Given("order 42 exists")
            .WithRequest(HttpMethod.Get, "/api/v2/orders/42")
            .WithHeader("Accept", "application/json")
            .WillRespond()
            .WithStatus(HttpStatusCode.OK)
            .WithJsonBody(new
            {
                id = Match.Integer(42),
                total = new
                {
                    amount = Match.Decimal(99.99m),
                    currency = Match.Regex("USD", "^[A-Z]{3}$")
                },
                status = Match.Regex("Shipped", "^(Pending|Shipped|Delivered)$"),
                customer = new
                {
                    id = Match.Integer(),
                    name = Match.Type("Jane Doe")
                }
                // Note: we do NOT assert lineItems — we don't use them
                // Provider can freely change lineItems without breaking us
            });

        // Act & Assert — verify our client works with the mock
        await _pactBuilder.VerifyAsync(async ctx =>
        {
            var client = new OrderApiClient(ctx.MockServerUri);
            var order = await client.GetOrderAsync(42);

            Assert.Equal(42, order.Id);
            Assert.Equal("USD", order.Total.Currency);
        });
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>What interviewers assess when asking about API governance:</p>
<ul>
<li><strong>Systems thinking</strong> — Can you reason about the second-order effects of an API change across an ecosystem of consumers? Interviewers want to hear you think about blast radius, not just the endpoint in isolation.</li>
<li><strong>Trade-off articulation</strong> — There is no perfect versioning strategy. Interviewers want candidates who can explain WHY they chose URL path over header versioning for a specific context, not just recite options.</li>
<li><strong>Process design</strong> — For senior/architect roles, expect questions like "How would you set up API governance for 20 teams?" The answer should balance automation with human judgment.</li>
<li><strong>Backward compatibility instinct</strong> — When presented with a proposed change, can you immediately identify whether it's breaking? This is a muscle that experienced API developers have.</li>
<li><strong>Deprecation empathy</strong> — How do you handle the human side? Communicating to consumers, providing migration paths, offering support during transitions.</li>
</ul>`,
            callout: {
                type: 'tip',
                title: 'The "Show Your Scars" Technique',
                text: 'The best answers to governance questions come from experience. Describe a time you shipped a breaking change accidentally, how you detected it, and what process you built to prevent recurrence. Interviewers value battle scars over textbook answers.'
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li>API governance is about enabling safe, consistent API evolution — not bureaucratic gatekeeping.</li>
<li>The four versioning strategies (URL, query, header, media type) each suit different contexts. Public APIs favor explicit URL path versioning; internal microservices may prefer header-based.</li>
<li>A breaking change is anything that can cause an existing client to fail: removing fields, changing types, tightening validation, altering error formats.</li>
<li>Contract-first design (OpenAPI spec before code) prevents "API drift" where implementation diverges from documentation.</li>
<li>Consumer-driven contracts (Pact) provide automated breaking change detection at the integration boundary.</li>
<li>Deprecation is a lifecycle phase, not an event. It requires Sunset headers, migration guides, consumer tracking, and timeline communication.</li>
<li>Effective governance automates what can be automated (linting, contract tests, catalog registration) and applies human review only to genuinely ambiguous decisions.</li>
<li>The Robustness Principle (be liberal in what you accept, conservative in what you send) prevents more accidental breaks than any other single practice.</li>
<li>You cannot deprecate what you cannot measure. Consumer tracking is prerequisite to safe API evolution.</li>
</ul>`
        }
    ],
    questions: [
        {
            id: 'ag-q1',
            level: 'junior',
            title: 'What is API versioning and why is it needed?',
            answer: `<p>API versioning is the practice of maintaining multiple versions of an API simultaneously so that changes to the API don't break existing consumers. It's needed because APIs are contracts between providers and consumers — once a client is built against a specific response format, any change to that format can cause failures.</p>
<p>Without versioning, you face a dilemma: either never evolve your API (impractical) or break every client whenever you make changes (unacceptable). Versioning gives you an escape hatch: publish a new version with the changes while keeping the old version running for existing clients.</p>
<p>The four common approaches are:</p>
<ul>
<li><strong>URL path</strong>: <code>/api/v1/orders</code> vs <code>/api/v2/orders</code> — most explicit and widely used</li>
<li><strong>Query parameter</strong>: <code>/api/orders?version=2</code> — optional, can default to latest</li>
<li><strong>Custom header</strong>: <code>X-API-Version: 2</code> — keeps URLs clean but harder to discover</li>
<li><strong>Media type</strong>: <code>Accept: application/vnd.myapp.v2+json</code> — most RESTful but complex</li>
</ul>
<p>For public APIs, URL path versioning is the industry standard because it's visible, cacheable, and easy to document. For internal microservices, header-based versioning is often preferred because it keeps routing simpler.</p>`
        },
        {
            id: 'ag-q2',
            level: 'junior',
            title: 'What is the difference between a breaking and non-breaking API change?',
            answer: `<p>A <strong>breaking change</strong> is any modification that can cause an existing client to fail without updating their code. A <strong>non-breaking change</strong> is one that existing clients can safely ignore.</p>
<p><strong>Breaking changes include:</strong></p>
<ul>
<li>Removing a field from a response body</li>
<li>Renaming a field (e.g., <code>customerName</code> → <code>customer_name</code>)</li>
<li>Changing a field's data type (e.g., <code>id</code> from integer to string)</li>
<li>Making a previously optional request field required</li>
<li>Removing an endpoint or HTTP method</li>
<li>Changing the HTTP status code for a given scenario</li>
<li>Changing authentication requirements</li>
<li>Modifying pagination behavior</li>
</ul>
<p><strong>Non-breaking changes include:</strong></p>
<ul>
<li>Adding a new optional field to request or response</li>
<li>Adding a new endpoint</li>
<li>Adding a new optional query parameter</li>
<li>Relaxing validation (e.g., making a required field optional)</li>
<li>Adding new enum values (if clients handle unknown values gracefully)</li>
<li>Adding new HTTP methods to existing endpoints</li>
</ul>
<p>The key mental model: if a well-written client using the current version would continue working without modification after your change, it's non-breaking. If any client could fail, it's breaking.</p>`
        },
        {
            id: 'ag-q3',
            level: 'mid',
            title: 'How do you version a REST API without breaking existing clients?',
            answer: `<p>The goal is to evolve your API while maintaining backward compatibility. Here's a practical approach:</p>
<p><strong>1. Choose a versioning scheme and apply it from day one.</strong> URL path versioning (<code>/v1/</code>) is the safest default for most teams. It makes the version explicit in every request, simplifies routing, and works naturally with API gateways and documentation tools.</p>
<p><strong>2. Default to additive changes.</strong> Before creating a new version, ask: "Can I accomplish this by adding an optional field, a new endpoint, or a new query parameter?" Most features can be delivered without a version bump.</p>
<p><strong>3. When a breaking change is unavoidable, create a new version.</strong> Run both versions simultaneously. The old version stays on its existing route (<code>/v1/orders</code>) while the new version gets its own (<code>/v2/orders</code>). Internally, both versions can share business logic with a thin translation layer.</p>
<p><strong>4. Use response headers to signal version status.</strong> Add <code>API-Supported-Versions</code>, <code>API-Deprecated-Versions</code>, and <code>Sunset</code> headers so automated tooling can alert consumers before removal.</p>
<p><strong>5. In ASP.NET Core, use the Asp.Versioning packages</strong> which handle version routing, default version selection, and version reporting automatically. Configure multiple version readers so clients can specify versions via URL, header, or query parameter.</p>
<p><strong>6. Gate deployments with contract tests.</strong> Consumer-driven contracts (Pact) catch breaking changes in CI before they reach production. If a provider change fails a consumer's contract, the pipeline blocks deployment.</p>`,
            code: `// Version negotiation middleware example
public class ApiVersionNegotiationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly Dictionary<string, DateTimeOffset> _sunsetDates = new()
    {
        ["1.0"] = new DateTimeOffset(2025, 3, 1, 0, 0, 0, TimeSpan.Zero),
        ["1.1"] = new DateTimeOffset(2025, 6, 1, 0, 0, 0, TimeSpan.Zero)
    };

    public async Task InvokeAsync(HttpContext context)
    {
        await _next(context);
        
        var apiVersion = context.GetRequestedApiVersion()?.ToString();
        if (apiVersion != null && _sunsetDates.TryGetValue(apiVersion, out var sunset))
        {
            context.Response.Headers["Sunset"] = sunset.ToString("R");
            context.Response.Headers["Deprecation"] = "true";
            context.Response.Headers["Link"] = 
                $"</api/v2{context.Request.Path}>; rel=\\"successor-version\\"";
        }
    }
}`,
            language: 'csharp'
        },
        {
            id: 'ag-q4',
            level: 'mid',
            title: 'What is contract-first API design and what are its benefits?',
            answer: `<p>Contract-first API design means writing the API specification (typically OpenAPI/Swagger YAML or JSON) before writing any implementation code. The specification becomes the single source of truth that both provider and consumer teams work from.</p>
<p><strong>The workflow:</strong></p>
<ol>
<li>Design the API spec collaboratively (API designer + consumers)</li>
<li>Review the spec in a pull request (lint with Spectral, validate naming conventions)</li>
<li>Generate server stubs from the spec (e.g., NSwag, OpenAPI Generator)</li>
<li>Generate client SDKs from the spec for consumer teams</li>
<li>Implement business logic in the generated stubs</li>
<li>Run contract tests to ensure implementation matches the spec</li>
</ol>
<p><strong>Benefits:</strong></p>
<ul>
<li><strong>Parallel development</strong> — Frontend and backend teams work simultaneously against the spec. No waiting for endpoints to be "ready."</li>
<li><strong>Consumer-centric design</strong> — Writing the contract first forces you to think about the consumer's needs, not your internal data model.</li>
<li><strong>Automated validation</strong> — CI can verify that the implementation matches the spec, preventing documentation drift.</li>
<li><strong>Early feedback</strong> — Reviewing a spec is cheaper than reviewing an implementation. Breaking changes are caught at design time, not after 3 sprints of coding.</li>
<li><strong>Consistent naming</strong> — Linting tools enforce style guides automatically on the spec.</li>
</ul>
<p><strong>The alternative (code-first)</strong> generates the spec from code annotations. This is fine for rapid prototyping but leads to specs that mirror internal implementation details rather than consumer needs.</p>`
        },
        {
            id: 'ag-q5',
            level: 'mid',
            title: 'How do consumer-driven contracts (Pact) differ from traditional integration tests?',
            answer: `<p>Traditional integration tests and consumer-driven contracts solve different problems and operate at different stages of the development lifecycle.</p>
<p><strong>Traditional integration tests:</strong></p>
<ul>
<li>Written by the provider team (or a QA team)</li>
<li>Test the provider's behavior from the provider's perspective</li>
<li>Run against a deployed environment (staging/QA)</li>
<li>Require both services to be running simultaneously</li>
<li>Catch bugs but don't prevent breaking contract changes</li>
<li>Slow, flaky, and expensive to maintain</li>
</ul>
<p><strong>Consumer-driven contracts (Pact):</strong></p>
<ul>
<li>Written by consumer teams — they define what they actually need</li>
<li>Test the contract boundary, not business logic</li>
<li>Run in isolation (consumer tests against a mock, provider replays against its own unit)</li>
<li>No shared environment needed — each side runs independently</li>
<li>Explicitly prevent breaking changes by failing when contract expectations aren't met</li>
<li>Fast, deterministic, and cheap to run</li>
</ul>
<p><strong>Key insight:</strong> Integration tests ask "does the system work end-to-end?" CDC tests ask "can I deploy this provider version without breaking any consumer?" These are complementary questions. CDC tests run in CI on every commit (fast feedback), while integration tests run in staging (broader validation).</p>
<p><strong>When to use CDC:</strong> When multiple teams own separate services that communicate via APIs, and you need deployment independence. CDC lets team A deploy without coordinating with teams B, C, and D — as long as contracts pass.</p>`
        },
        {
            id: 'ag-q6',
            level: 'senior',
            title: 'How do you deprecate an API endpoint safely?',
            answer: `<p>Safe deprecation is a multi-phase process that balances provider velocity with consumer stability. Here's the production-tested playbook:</p>
<p><strong>Phase 1: Signal (Months -6 to -3)</strong></p>
<ul>
<li>Add <code>Deprecation: true</code> header to all responses from the endpoint</li>
<li>Add <code>Sunset: Sat, 01 Mar 2025 00:00:00 GMT</code> header with the planned removal date</li>
<li>Add <code>Link: &lt;/v2/orders&gt;; rel="successor-version"</code> pointing to the replacement</li>
<li>Mark as deprecated in OpenAPI spec (<code>deprecated: true</code>) and documentation</li>
<li>Emit deprecation warnings in API gateway logs for monitoring</li>
</ul>
<p><strong>Phase 2: Communicate (Month -3)</strong></p>
<ul>
<li>Email all known consumers (identified via API keys or client certificates)</li>
<li>Publish migration guide with before/after examples</li>
<li>Offer office hours or dedicated support for migration questions</li>
<li>Update changelog and developer portal with timeline</li>
</ul>
<p><strong>Phase 3: Monitor (Months -3 to 0)</strong></p>
<ul>
<li>Track traffic to deprecated endpoint daily — graph it on a dashboard</li>
<li>Reach out individually to high-traffic consumers who haven't migrated</li>
<li>Consider rate-limiting the deprecated endpoint to incentivize migration</li>
<li>Provide a sandbox/staging environment where the old endpoint is already gone</li>
</ul>
<p><strong>Phase 4: Remove (Day 0)</strong></p>
<ul>
<li>If traffic is at zero (or negligible), remove the endpoint</li>
<li>Return <code>410 Gone</code> with a response body pointing to the successor</li>
<li>Keep the 410 response for at least 6 months so late callers get a clear signal</li>
<li>Never return 404 — that suggests the endpoint never existed, which is confusing</li>
</ul>`,
            seniorPerspective: `<p>In practice, the hardest part is Phase 3. There's always "that one client" with an API key from 2019 that sends 50 req/day and whose team no longer exists. You need organizational escalation paths for these zombie consumers. The technical side of deprecation is straightforward — the political and organizational side is where it gets messy.</p>`
        },
        {
            id: 'ag-q7',
            level: 'senior',
            title: 'What makes a change "breaking" and how do you detect breaking changes in CI/CD?',
            answer: `<p>A breaking change is any modification to a published API contract that can cause existing, correctly-written clients to fail. The subtle word is "can" — even if no current client uses a removed field, it's still breaking because a client you don't know about might depend on it.</p>
<p><strong>Formal definition of breaking changes:</strong></p>
<ul>
<li><strong>Request contract tightening:</strong> requiring new fields, restricting accepted values, changing parameter location, removing accepted content types</li>
<li><strong>Response contract loosening in unexpected ways:</strong> removing fields, changing types, nullifying previously non-null values</li>
<li><strong>Behavioral changes:</strong> different status codes for same scenarios, changed error formats, altered pagination behavior, modified rate limits</li>
<li><strong>Infrastructure changes:</strong> URL restructuring, authentication scheme changes, TLS version requirements</li>
</ul>
<p><strong>Automated detection in CI/CD:</strong></p>
<ol>
<li><strong>OpenAPI diff tools</strong> (oasdiff, optic) — Compare the current spec against the last published spec. These tools classify each difference as breaking/non-breaking and can fail the pipeline on breaking changes.</li>
<li><strong>Consumer-driven contracts</strong> (Pact) — Provider verification runs in CI. If any consumer contract fails, the build is red.</li>
<li><strong>Schema evolution validators</strong> — For event-driven APIs, tools like Confluent Schema Registry enforce backward/forward compatibility rules on Avro/Protobuf schemas.</li>
<li><strong>Traffic replay</strong> — Record production traffic, replay against the new version, diff responses. Any difference in previously-stable fields indicates a potential break.</li>
</ol>`,
            code: `// CI/CD pipeline step: OpenAPI breaking change detection
// .gitlab-ci.yml example
// api-compatibility:
//   stage: validate
//   script:
//     - oasdiff breaking api/openapi-published.yaml api/openapi-current.yaml
//   allow_failure: false

// Programmatic breaking change detection in C#
public class BreakingChangeDetector
{
    public record SchemaChange(string Path, string Type, string Description);

    public List<SchemaChange> DetectBreakingChanges(
        OpenApiDocument published, OpenApiDocument proposed)
    {
        var breaks = new List<SchemaChange>();
        
        // Check for removed endpoints
        foreach (var path in published.Paths)
        {
            if (!proposed.Paths.ContainsKey(path.Key))
            {
                breaks.Add(new SchemaChange(
                    path.Key, "EndpointRemoved",
                    $"Endpoint {path.Key} was removed"));
            }
        }
        
        // Check for removed response fields
        foreach (var (path, item) in published.Paths)
        {
            if (!proposed.Paths.TryGetValue(path, out var proposedItem))
                continue;
                
            foreach (var (method, op) in item.Operations)
            {
                var proposedOp = proposedItem.Operations
                    .GetValueOrDefault(method);
                if (proposedOp == null)
                {
                    breaks.Add(new SchemaChange(
                        path, "MethodRemoved",
                        $"{method} removed from {path}"));
                }
            }
        }
        
        return breaks;
    }
}`,
            language: 'csharp'
        },
        {
            id: 'ag-q8',
            level: 'senior',
            title: 'How do you handle API versioning for GraphQL APIs vs REST APIs?',
            answer: `<p>GraphQL and REST take fundamentally different approaches to API evolution, and this affects versioning strategy significantly.</p>
<p><strong>REST versioning:</strong> Because REST endpoints return fixed response shapes, changes to those shapes require explicit versioning (v1/v2 side by side). Clients get everything the endpoint returns, whether they need it or not.</p>
<p><strong>GraphQL's built-in evolution:</strong> GraphQL avoids traditional versioning entirely through several mechanisms:</p>
<ul>
<li><strong>Additive by nature</strong> — New fields added to a type don't affect existing queries because clients explicitly select which fields they want. A client asking for <code>{ order { id total } }</code> isn't affected by a new <code>lineItems</code> field.</li>
<li><strong>@deprecated directive</strong> — Fields can be marked deprecated with a reason, and tooling (GraphiQL, IDE plugins) shows warnings. The field continues working but is visually flagged.</li>
<li><strong>Field-level usage tracking</strong> — Because every query explicitly names the fields it needs, you get per-field usage analytics. You know exactly which clients use which fields.</li>
<li><strong>Schema stitching/federation</strong> — Teams can evolve their subgraph independently without coordinating a version bump across the entire graph.</li>
</ul>
<p><strong>When GraphQL still needs versioning:</strong></p>
<ul>
<li>Renaming a field (must add new + deprecate old)</li>
<li>Changing a field's type (must create a new field with different name)</li>
<li>Removing an enum value that clients might match on</li>
<li>Changing nullability from non-null to nullable (breaks client type assertions)</li>
</ul>
<p><strong>The hybrid approach:</strong> Many organizations use REST for public APIs (explicit versioning, easier to cache and document) and GraphQL for internal APIs (flexible evolution, fine-grained field tracking). Governance rules differ for each.</p>`
        },
        {
            id: 'ag-q9',
            level: 'lead',
            title: 'How would you implement an API style guide and ensure compliance across an organization?',
            answer: `<p>An effective API style guide must be executable, not just a document. Here's the implementation approach:</p>
<p><strong>1. Define the style guide as machine-readable rules:</strong></p>
<ul>
<li>Use Spectral (open-source OpenAPI linter) custom rulesets written in YAML/JavaScript</li>
<li>Cover: naming conventions (camelCase vs snake_case), HTTP verb usage, error response format (RFC 7807 Problem Details), pagination style, authentication patterns, versioning format</li>
<li>Distribute the ruleset as an internal npm/NuGet package so all teams reference the same version</li>
</ul>
<p><strong>2. Enforce in CI/CD pipeline:</strong></p>
<ul>
<li>Run Spectral lint on every PR that modifies an OpenAPI spec</li>
<li>Block merge on violations (errors) while allowing warnings for soft recommendations</li>
<li>Generate inline PR comments pointing to the violated rule and its rationale</li>
</ul>
<p><strong>3. Provide positive developer experience:</strong></p>
<ul>
<li>IDE plugins that show violations in real-time (VS Code Spectral extension)</li>
<li>Starter templates that already comply with the style guide</li>
<li>An internal API catalog that showcases exemplary APIs as reference implementations</li>
<li>"Golden path" documentation: "If you're building a CRUD API, start here"</li>
</ul>
<p><strong>4. Evolve the guide through RFC process:</strong></p>
<ul>
<li>Any team can propose a change to the style guide via an RFC (Request for Comments)</li>
<li>Changes are reviewed by an API governance working group (rotating membership from different teams)</li>
<li>New rules get a grace period before enforcement (warn for 2 sprints, then error)</li>
</ul>
<p><strong>5. Measure compliance:</strong></p>
<ul>
<li>Dashboard showing compliance scores per team/API</li>
<li>Track trend over time (are we getting better or worse?)</li>
<li>Celebrate teams that achieve 100% compliance rather than shaming those who don't</li>
</ul>`,
            seniorPerspective: `<p>The political challenge is getting buy-in from 20+ teams who all have their own conventions already established. The key is framing governance as "we're standardizing to reduce cognitive load when consuming each other's APIs" rather than "you're doing it wrong." Grandfather existing APIs (don't force retroactive compliance) but require compliance for all new APIs and new versions.</p>`
        },
        {
            id: 'ag-q10',
            level: 'lead',
            title: 'How do you manage API dependencies in a microservices architecture to prevent cascading breaking changes?',
            answer: `<p>In a microservices architecture with 50+ services, a breaking change in one API can cascade through the dependency graph. Managing this requires both technical tooling and organizational practices:</p>
<p><strong>Technical strategies:</strong></p>
<ul>
<li><strong>Dependency graph visualization</strong> — Maintain a live map of which services consume which APIs. Tools like Backstage or custom service catalogs with dependency declarations make this visible.</li>
<li><strong>Consumer-driven contracts at scale</strong> — Each consumer publishes Pact contracts. The provider's CI verifies ALL consumer contracts before deployment. A single failure blocks the release.</li>
<li><strong>API gateway as version router</strong> — Route different consumers to different API versions transparently. Consumer A stays on v1 while Consumer B migrates to v2, without either knowing about the other.</li>
<li><strong>Tolerant Reader pattern</strong> — Build all consumers to ignore unknown fields and handle missing optional fields gracefully. This absorbs many changes that would otherwise be breaking.</li>
<li><strong>Expand-Contract migration</strong> — Instead of breaking changes, expand the API first (add new fields/endpoints alongside old), migrate consumers, then contract (remove old).</li>
</ul>
<p><strong>Organizational strategies:</strong></p>
<ul>
<li><strong>API ownership model</strong> — Every API has a named team owner. That team is responsible for deprecation communication and consumer support.</li>
<li><strong>Change advisory board</strong> — Breaking changes require a lightweight review: who's affected, what's the migration plan, what's the timeline. This isn't bureaucracy — it's risk management.</li>
<li><strong>Shared deprecation calendar</strong> — All upcoming breaking changes and sunset dates visible in one place so teams can plan their migration work into sprints.</li>
<li><strong>Inner source SDKs</strong> — Provider teams publish client libraries. When a breaking change ships, they also ship the updated SDK with a migration guide. Consumers update a package version rather than rewriting HTTP calls.</li>
</ul>`
        },
        {
            id: 'ag-q11',
            level: 'architect',
            title: 'Design an API governance process for an organization with 20+ teams building microservices.',
            answer: `<p>Designing governance for 20+ teams requires balancing consistency with autonomy. Over-govern and teams route around you; under-govern and your API landscape becomes an inconsistent mess. Here's the architecture:</p>
<p><strong>Layer 1: Automated Guardrails (Zero friction)</strong></p>
<ul>
<li>Spectral linting in every team's CI pipeline (shared ruleset distributed as a package)</li>
<li>OpenAPI diff tool that blocks PRs introducing breaking changes without a version bump</li>
<li>Pact broker that automatically verifies consumer contracts on every provider deploy</li>
<li>API catalog auto-registration on deployment (every deployed API appears in the catalog automatically)</li>
</ul>
<p><strong>Layer 2: Templates and Golden Paths (Low friction)</strong></p>
<ul>
<li>Scaffolding CLI: <code>api-init</code> generates a compliant project skeleton with versioning, error handling, health checks, and OpenAPI spec pre-configured</li>
<li>Reference implementations for common patterns (CRUD, event-driven, BFF)</li>
<li>Shared middleware packages for cross-cutting concerns (auth, rate limiting, correlation IDs, sunset headers)</li>
</ul>
<p><strong>Layer 3: Review Process (Medium friction, only for significant changes)</strong></p>
<ul>
<li>New public APIs require a design review before implementation (spec-only review, not code)</li>
<li>Breaking changes require a migration plan reviewed by the API governance working group</li>
<li>Working group is 5-7 people rotating quarterly from different teams (not a permanent bureaucracy)</li>
<li>SLA: 48-hour review turnaround. If the group doesn't respond, the change proceeds.</li>
</ul>
<p><strong>Layer 4: Metrics and Incentives (Background)</strong></p>
<ul>
<li>API health score per team: compliance %, documentation completeness, deprecation SLA adherence</li>
<li>Published monthly — not as punishment but as a "how are we doing" signal</li>
<li>Tech debt budget: teams get explicit time allocation to address governance debt</li>
</ul>`,
            architectPerspective: `<p>The meta-architecture decision is federated vs centralized governance. For 20+ teams, federated wins: each domain (payments, identity, inventory) has a domain API lead who adapts org-wide rules to their context. The central governance team maintains the rules, tooling, and catalog — but doesn't review individual API designs. Think of it like a programming language design: you provide the compiler (automated tools) and style guide (conventions), but you don't review every program written in the language.</p>
<p>The failure mode to watch for is "governance theater" — processes that exist on paper but that teams bypass because they're too slow or too disconnected from reality. The antidote is measuring bypass rate: if teams are shipping APIs that aren't in the catalog, your governance is failing regardless of how good your rules look on paper.</p>`
        },
        {
            id: 'ag-q12',
            level: 'architect',
            title: 'How would you design an API versioning strategy that works for a platform with 100+ consumers, some external, while minimizing the maintenance burden of multiple live versions?',
            answer: `<p>At scale (100+ consumers, mix of internal/external), maintaining multiple live API versions becomes an operational burden. The architecture must minimize the cost of version coexistence while giving consumers adequate migration time.</p>
<p><strong>The Version Translation Layer pattern:</strong></p>
<p>Instead of maintaining separate codebases for v1, v2, v3, implement a single canonical internal representation (the "latest" version) and build lightweight translation layers that convert between versions:</p>
<ul>
<li><strong>Inbound translation:</strong> Convert v1 requests into the canonical format before hitting business logic</li>
<li><strong>Outbound translation:</strong> Convert canonical responses back into the version the client expects</li>
<li><strong>Business logic:</strong> Only ever written against the canonical model. No version-specific branching in service code.</li>
</ul>
<p>Stripe uses this pattern to maintain 100+ API versions simultaneously. Each version is a set of request/response transforms — typically 5-20 lines of code per version per endpoint.</p>
<p><strong>Version lifecycle management:</strong></p>
<ul>
<li><strong>Internal consumers:</strong> Required to migrate within 3 months. Enforced via CI (contract tests against new version added, old version contracts removed after deadline).</li>
<li><strong>External partners:</strong> 12-month sunset window with proactive outreach at 9, 6, and 3 months remaining.</li>
<li><strong>Public consumers:</strong> 18-24 month window. For enterprise API products, consider permanent backward compatibility (AWS model) where old versions never die.</li>
</ul>
<p><strong>Reducing maintenance burden:</strong></p>
<ul>
<li><strong>Version pinning at client creation:</strong> New API keys default to the latest version. Existing keys stay on their pinned version. This means most consumers don't even notice new versions unless they opt in.</li>
<li><strong>Automated version compatibility matrix:</strong> CI runs test suites against all supported versions. If a change breaks v1 translation, you know immediately.</li>
<li><strong>Version usage dashboard:</strong> Real-time visibility into traffic per version. Versions with zero traffic for 30 days are candidates for removal (after communication).</li>
<li><strong>Changelogs as diffs:</strong> Auto-generated "what changed between v1 and v2" documentation from the translation layer definitions.</li>
</ul>`,
            architectPerspective: `<p>The fundamental trade-off is development velocity vs consumer stability. The version translation layer pattern resolves this by decoupling them: your internal code always moves forward (velocity), while translations maintain the old contracts (stability). The cost is translation layer complexity — each version adds a thin layer of transforms. This cost grows linearly, not exponentially, which makes it sustainable at scale.</p>
<p>For platform APIs where consumers pay for access, consider a commercial model: free versions get 12-month support, enterprise SLAs get 36-month support. This aligns business incentives with engineering constraints.</p>`
        },
        {
            id: 'ag-q13',
            level: 'junior',
            title: 'What is an OpenAPI specification and how is it used in API development?',
            answer: `<p>An OpenAPI specification (formerly known as Swagger) is a standardized, machine-readable document that describes a REST API's entire contract — its endpoints, request/response formats, authentication methods, and error responses — in YAML or JSON format.</p>
<p><strong>What it contains:</strong></p>
<ul>
<li>Available endpoints and their HTTP methods (GET /orders, POST /orders, etc.)</li>
<li>Request parameters (path, query, header, body) with their types and validation rules</li>
<li>Response schemas for each status code (200, 400, 404, 500)</li>
<li>Authentication schemes (API key, OAuth2, Bearer token)</li>
<li>Data model definitions (reusable schemas for Order, Customer, etc.)</li>
</ul>
<p><strong>How it's used:</strong></p>
<ul>
<li><strong>Documentation</strong> — Tools like Swagger UI and Redoc render the spec as interactive API documentation that developers can try directly in the browser.</li>
<li><strong>Code generation</strong> — Generate server stubs (ASP.NET controllers, Express routes) and client SDKs (C#, TypeScript, Python) automatically from the spec.</li>
<li><strong>Testing</strong> — Validate that your API implementation matches the spec using tools like Dredd or Schemathesis.</li>
<li><strong>Mocking</strong> — Generate mock servers from the spec so frontend teams can develop without waiting for the real backend.</li>
<li><strong>Governance</strong> — Lint the spec against organizational style rules using Spectral. Catch naming inconsistencies, missing descriptions, and non-standard patterns before code is written.</li>
</ul>
<p>In modern API development, the OpenAPI spec is treated as a first-class artifact — version-controlled alongside code, reviewed in PRs, and validated in CI/CD pipelines.</p>`
        },
        {
            id: 'ag-q14',
            level: 'mid',
            title: 'How do you handle enum evolution in an API without breaking clients?',
            answer: `<p>Enums are one of the trickiest areas of API compatibility because adding or removing values can break clients in subtle ways depending on how they're consumed.</p>
<p><strong>The problem:</strong> Consider a <code>status</code> field with values <code>["pending", "shipped", "delivered"]</code>. If you add <code>"cancelled"</code>, clients that do exhaustive matching (switch statements without a default case) will crash. If you remove <code>"pending"</code>, clients that expect it will fail validation.</p>
<p><strong>Rules for safe enum evolution:</strong></p>
<ul>
<li><strong>Adding values is usually non-breaking</strong> — BUT only if your documentation explicitly states that clients should handle unknown values gracefully. Include this in your style guide from day one.</li>
<li><strong>Removing values is always breaking</strong> — Clients may be filtering, routing, or displaying based on that value. Deprecate the value (keep returning it for existing entities) and add the replacement as a new value.</li>
<li><strong>Renaming values is always breaking</strong> — Treat it as remove + add. Keep the old value as an alias.</li>
</ul>
<p><strong>Defensive patterns:</strong></p>
<ul>
<li><strong>Open enums</strong> — In your OpenAPI spec, don't use a strict enum. Instead, use <code>type: string</code> with documented known values. This signals to code generators that unknown values should be accepted, not rejected.</li>
<li><strong>Unknown value handling contract</strong> — Your API documentation should explicitly state: "New values may be added at any time. Clients MUST handle unknown values gracefully (e.g., display as-is or use a fallback)."</li>
<li><strong>Versioned enums</strong> — For large enums that evolve frequently, consider returning the raw value plus a version-specific mapping. This decouples the data model from the display logic.</li>
</ul>
<p><strong>In C# with System.Text.Json:</strong></p>`,
            code: `// Safe enum deserialization that handles unknown values
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OrderStatus
{
    Pending,
    Shipped,
    Delivered,
    Cancelled,
    
    [JsonPropertyName("unknown")]
    Unknown  // Catch-all for any future values
}

// Custom converter that maps unknowns instead of throwing
public class TolerantEnumConverter<T> : JsonConverter<T> where T : struct, Enum
{
    public override T Read(ref Utf8JsonReader reader, Type type, JsonSerializerOptions opts)
    {
        var value = reader.GetString();
        if (Enum.TryParse<T>(value, ignoreCase: true, out var result))
            return result;
        
        // Return default/Unknown instead of throwing
        return Enum.TryParse<T>("Unknown", out var fallback) 
            ? fallback 
            : default;
    }

    public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions opts)
    {
        writer.WriteStringValue(value.ToString().ToLowerInvariant());
    }
}`,
            language: 'csharp'
        },
        {
            id: 'ag-q15',
            level: 'senior',
            title: 'Compare URL path versioning vs header-based versioning. When would you choose each?',
            answer: `<p>This question tests whether a candidate can reason about trade-offs in context rather than reciting a "correct" answer. Both strategies are valid — the right choice depends on your API's audience, infrastructure, and evolution cadence.</p>
<p><strong>URL Path Versioning (<code>/api/v1/orders</code>):</strong></p>
<ul>
<li><strong>Advantages:</strong> Visible and explicit — developers see the version in every URL. Works naturally with HTTP caching (different URL = different cache entry). Easy to route at load balancer/gateway level. Simple to document — each version is a separate set of pages. Easy to test with curl, browser, Postman without configuring headers.</li>
<li><strong>Disadvantages:</strong> Pollutes the URL space. Makes it tempting to create too many versions. Harder to implement "default to latest" behavior. Breaks HATEOAS (links in responses contain version, coupling the client to a specific version forever).</li>
<li><strong>Best for:</strong> Public APIs with large, diverse consumer bases. APIs where discoverability and simplicity matter more than REST purity. Organizations where consumers range from sophisticated developers to occasional integrators.</li>
</ul>
<p><strong>Header-Based Versioning (<code>X-API-Version: 2</code> or <code>Accept: application/vnd.company.v2+json</code>):</strong></p>
<ul>
<li><strong>Advantages:</strong> Clean URLs that don't change between versions. Natural fit for content negotiation (client declares what it can handle). Easier to implement "default to latest" (missing header = latest version). Better RESTful semantics — the resource is the same, the representation varies.</li>
<li><strong>Disadvantages:</strong> Hidden — developers don't see the version in the URL, leading to confusion. Harder to test casually (need to set headers explicitly). Caching requires Vary header configuration. API gateways may not support header-based routing natively.</li>
<li><strong>Best for:</strong> Internal microservices where all consumers are sophisticated services that set headers programmatically. APIs where you want to encourage consumers to always use the latest version. Scenarios where URL stability is important (HATEOAS, bookmarkable resources).</li>
</ul>
<p><strong>The pragmatic answer:</strong> Most organizations should use URL path versioning for external/public APIs (explicit, cacheable, easy to document) and header-based versioning for internal service-to-service communication (cleaner, more flexible, consumers are all code). A hybrid approach where the API gateway translates between them can work well — external clients use URL paths, the gateway strips the version and passes it as a header to internal services.</p>`
        },
        {
            id: 'ag-q16',
            level: 'architect',
            title: 'How would you design a backward-compatible API evolution strategy for an event-driven architecture using async APIs?',
            answer: `<p>Event-driven architectures present unique versioning challenges because events are published to many consumers asynchronously, there's no request-response negotiation, and events are often stored (event sourcing) meaning old versions persist indefinitely.</p>
<p><strong>Core differences from REST versioning:</strong></p>
<ul>
<li>No content negotiation — consumers can't request a specific event version</li>
<li>Events are immutable records — you can't "fix" past events</li>
<li>Fan-out pattern — one producer, N consumers with different version tolerances</li>
<li>No sunset possible for stored events — old formats exist in the event store forever</li>
</ul>
<p><strong>Strategy 1: Schema Evolution with Compatibility Rules</strong></p>
<ul>
<li>Use a schema registry (Confluent, Apicurio, or custom) that enforces compatibility checks on schema changes</li>
<li><strong>Backward compatible:</strong> New schema can read old events (achieved by adding optional fields with defaults)</li>
<li><strong>Forward compatible:</strong> Old schema can read new events (achieved by using Tolerant Reader — ignore unknown fields)</li>
<li><strong>Full compatible:</strong> Both directions work — this is the gold standard for event schemas</li>
</ul>
<p><strong>Strategy 2: Event Versioning with Upcasters</strong></p>
<ul>
<li>Events carry a version field: <code>{"type": "OrderPlaced", "version": 3, ...}</code></li>
<li>Consumers register upcasters that transform old event versions to the latest format on read</li>
<li>The event store keeps the original bytes — upcasting happens in the consumer's deserialization pipeline</li>
<li>This decouples storage format from processing format</li>
</ul>
<p><strong>Strategy 3: Parallel Event Streams</strong></p>
<ul>
<li>When a breaking change is unavoidable, publish to both the old and new topic/stream simultaneously during a transition period</li>
<li>Old consumers continue reading from <code>orders.v1</code></li>
<li>New consumers subscribe to <code>orders.v2</code></li>
<li>A bridge component transforms and publishes to both streams</li>
<li>After all consumers migrate, decommission the old stream</li>
</ul>
<p><strong>Governance for async APIs:</strong></p>
<ul>
<li>AsyncAPI specification (the OpenAPI equivalent for event-driven APIs) describes event schemas, channels, and protocols</li>
<li>Schema registry CI checks: every schema change validated for backward compatibility before merge</li>
<li>Consumer lag monitoring: if a consumer stops processing after a schema change, something broke</li>
<li>Dead letter queue analysis: sudden DLQ spikes after a publish indicate deserialization failures from incompatible changes</li>
</ul>`,
            architectPerspective: `<p>The fundamental architectural decision is whether to version at the schema level (evolution within a single stream) or the stream level (separate topics per version). Schema evolution is cheaper operationally but limits the kinds of changes you can make. Stream versioning is more flexible but requires bridge infrastructure and doubles storage during transitions. For most teams, schema evolution with strict compatibility rules is the right default, with stream versioning reserved for rare "clean break" redesigns.</p>`
        }
    ]
});
