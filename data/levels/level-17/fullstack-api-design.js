/* ═══════════════════════════════════════════════════════════════════
   API Design Mastery — Full-Stack & Architect
   REST maturity, versioning, error handling, pagination,
   idempotency, rate limiting, GraphQL vs REST.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('fullstack-api-design', {
    title: 'API Design Mastery',
    description: 'Production-grade API design — REST maturity model, versioning strategies, error handling standards, pagination patterns, idempotency, rate limiting, and GraphQL vs REST trade-offs.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>API design is the contract between frontend and backend — and between your team and every consumer of your service. A well-designed API is intuitive, consistent, evolvable, and hard to misuse. This topic covers the patterns that separate junior "it works" APIs from production-grade, maintainable ones.</p>`
        },
        {
            title: 'REST Maturity Model (Richardson)',
            content: `<p>Leonard Richardson defined four maturity levels for REST APIs:</p>
            <table>
                <thead><tr><th>Level</th><th>Description</th><th>Example</th><th>Most APIs</th></tr></thead>
                <tbody>
                    <tr><td><strong>Level 0</strong></td><td>Single URI, single verb (RPC over HTTP)</td><td>POST /api with action in body</td><td>SOAP, some legacy</td></tr>
                    <tr><td><strong>Level 1</strong></td><td>Multiple resources, single verb</td><td>POST /orders, POST /users</td><td>Early REST</td></tr>
                    <tr><td><strong>Level 2</strong></td><td>Resources + HTTP verbs + status codes</td><td>GET /orders/123, DELETE /orders/123</td><td>Most modern APIs</td></tr>
                    <tr><td><strong>Level 3</strong></td><td>HATEOAS — hypermedia controls in responses</td><td>Response includes links to related actions</td><td>Rare in practice</td></tr>
                </tbody>
            </table>
            <p>Most production APIs target Level 2. Level 3 (HATEOAS) adds discoverability but increases complexity for typical SPA consumers.</p>`
        },
        {
            title: 'API Versioning Strategies',
            content: `<p>APIs evolve. Breaking changes are inevitable. Versioning strategies:</p>
            <table>
                <thead><tr><th>Strategy</th><th>Example</th><th>Pros</th><th>Cons</th></tr></thead>
                <tbody>
                    <tr><td><strong>URL Path</strong></td><td>/api/v1/orders</td><td>Simple, visible, cacheable</td><td>URL pollution, hard to deprecate</td></tr>
                    <tr><td><strong>Header</strong></td><td>Accept: application/vnd.api+json;version=2</td><td>Clean URLs, content negotiation</td><td>Hidden, harder to test in browser</td></tr>
                    <tr><td><strong>Query Param</strong></td><td>/api/orders?version=2</td><td>Easy to switch</td><td>Not RESTful, cache issues</td></tr>
                    <tr><td><strong>No versioning (additive)</strong></td><td>Only add fields, never remove</td><td>No version management</td><td>API bloats over time, hard to clean up</td></tr>
                </tbody>
            </table>`,
            callout: {
                type: 'tip',
                title: 'Practical Recommendation',
                text: 'URL path versioning (/v1/, /v2/) is the most widely adopted and easiest for consumers to understand. Reserve header versioning for internal APIs where clients are controlled. Always support N-1 versions concurrently during migration periods.'
            }
        },
        {
            title: 'Error Handling — RFC 7807 Problem Details',
            content: `<p>Consistent error responses are critical. RFC 7807 (Problem Details for HTTP APIs) defines a standard format:</p>`,
            code: `// RFC 7807 Problem Details response
{
    "type": "https://api.example.com/errors/insufficient-funds",
    "title": "Insufficient Funds",
    "status": 402,
    "detail": "Account balance ($12.50) is less than withdrawal amount ($50.00).",
    "instance": "/transfers/abc123",
    "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
    "extensions": {
        "balance": 12.50,
        "required": 50.00,
        "currency": "USD"
    }
}

// ASP.NET Core implementation
app.MapPost("/api/transfers", (TransferRequest req) =>
{
    if (req.Amount > account.Balance)
    {
        return Results.Problem(
            title: "Insufficient Funds",
            detail: $"Balance ({account.Balance:C}) < withdrawal ({req.Amount:C})",
            statusCode: 402,
            type: "https://api.example.com/errors/insufficient-funds",
            extensions: new Dictionary<string, object?>
            {
                ["balance"] = account.Balance,
                ["required"] = req.Amount
            });
    }
    // ... process transfer
});`,
            language: 'csharp'
        },
        {
            title: 'Pagination Patterns',
            content: `<table>
                <thead><tr><th>Pattern</th><th>How It Works</th><th>Pros</th><th>Cons</th><th>Use When</th></tr></thead>
                <tbody>
                    <tr><td><strong>Offset/Limit</strong></td><td>?offset=20&limit=10</td><td>Simple, random access</td><td>Skips are expensive on large datasets, inconsistent under writes</td><td>Small datasets, admin UIs</td></tr>
                    <tr><td><strong>Cursor-based</strong></td><td>?cursor=eyJpZCI6MTIzfQ&limit=10</td><td>Consistent, performant at scale</td><td>No random page access, complex cursors</td><td>Feeds, timelines, large datasets</td></tr>
                    <tr><td><strong>Keyset</strong></td><td>?after_id=123&limit=10</td><td>Simple cursor, index-friendly</td><td>Requires stable sort key</td><td>When sort is by ID or timestamp</td></tr>
                </tbody>
            </table>`,
            code: `// Cursor-based pagination response
{
    "data": [...],
    "pagination": {
        "hasNext": true,
        "hasPrevious": true,
        "nextCursor": "eyJpZCI6NDU2LCJjcmVhdGVkIjoiMjAyNC0wMS0xNSJ9",
        "previousCursor": "eyJpZCI6MTIzLCJjcmVhdGVkIjoiMjAyNC0wMS0xMCJ9",
        "totalCount": 1523  // Optional — expensive to compute
    }
}

// Backend implementation (keyset pagination)
public async Task<PagedResult<Order>> GetOrdersAsync(string? cursor, int limit = 20)
{
    var query = _db.Orders.OrderByDescending(o => o.CreatedAt).ThenBy(o => o.Id);
    
    if (cursor != null)
    {
        var (lastDate, lastId) = DecodeCursor(cursor);
        query = query.Where(o => o.CreatedAt < lastDate || 
                                 (o.CreatedAt == lastDate && o.Id > lastId));
    }
    
    var items = await query.Take(limit + 1).ToListAsync(); // Fetch one extra
    var hasNext = items.Count > limit;
    if (hasNext) items.RemoveAt(items.Count - 1);
    
    return new PagedResult<Order>
    {
        Data = items,
        NextCursor = hasNext ? EncodeCursor(items.Last()) : null,
        HasNext = hasNext
    };
}`,
            language: 'csharp'
        },
        {
            title: 'Idempotency',
            content: `<p>Idempotency ensures that repeating a request produces the same result — critical for payment, order creation, and any non-safe operation that might be retried by network middleware or client retry logic.</p>
            <h4>Implementation Pattern</h4>
            <ol>
                <li>Client generates a unique <code>Idempotency-Key</code> header (UUID)</li>
                <li>Server checks if this key was already processed (Redis/DB lookup)</li>
                <li>If yes → return the cached response (no re-processing)</li>
                <li>If no → process the request, store result keyed by idempotency key with TTL</li>
            </ol>`,
            code: `// Idempotency middleware
public class IdempotencyMiddleware
{
    private readonly IDistributedCache _cache;
    
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        if (context.Request.Method is not ("POST" or "PUT" or "PATCH")) 
        {
            await next(context); return;
        }
        
        var key = context.Request.Headers["Idempotency-Key"].FirstOrDefault();
        if (string.IsNullOrEmpty(key)) { await next(context); return; }
        
        var cacheKey = $"idempotency:{key}";
        var cached = await _cache.GetStringAsync(cacheKey);
        
        if (cached != null)
        {
            // Return cached response — no re-processing
            var cachedResponse = JsonSerializer.Deserialize<CachedResponse>(cached);
            context.Response.StatusCode = cachedResponse.StatusCode;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(cachedResponse.Body);
            return;
        }
        
        // Capture response for caching
        var originalBody = context.Response.Body;
        using var memStream = new MemoryStream();
        context.Response.Body = memStream;
        
        await next(context);
        
        // Cache the response with 24h TTL
        memStream.Position = 0;
        var responseBody = await new StreamReader(memStream).ReadToEndAsync();
        var toCache = new CachedResponse(context.Response.StatusCode, responseBody);
        await _cache.SetStringAsync(cacheKey, 
            JsonSerializer.Serialize(toCache),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24) });
        
        memStream.Position = 0;
        await memStream.CopyToAsync(originalBody);
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Rate Limiting',
            content: `<h4>Algorithms</h4>
            <table>
                <thead><tr><th>Algorithm</th><th>How It Works</th><th>Best For</th></tr></thead>
                <tbody>
                    <tr><td><strong>Fixed Window</strong></td><td>Count requests in time windows (e.g., 100/minute)</td><td>Simple, low-memory</td></tr>
                    <tr><td><strong>Sliding Window</strong></td><td>Weighted average of current + previous window</td><td>Smoother than fixed window</td></tr>
                    <tr><td><strong>Token Bucket</strong></td><td>Tokens added at steady rate, consumed per request</td><td>Allows bursts up to bucket capacity</td></tr>
                    <tr><td><strong>Leaky Bucket</strong></td><td>Requests queue and drain at fixed rate</td><td>Smooth output rate, no bursts</td></tr>
                </tbody>
            </table>
            <h4>Response Headers</h4>
            <p>Always communicate limits to clients via headers:</p>`,
            code: `// Standard rate limit response headers
X-RateLimit-Limit: 100        // Max requests per window
X-RateLimit-Remaining: 23     // Requests left in current window
X-RateLimit-Reset: 1640995200 // Unix timestamp when window resets
Retry-After: 30               // Seconds to wait (on 429 response)

// ASP.NET Core 7+ built-in rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddTokenBucketLimiter("api", limiter =>
    {
        limiter.TokenLimit = 100;
        limiter.ReplenishmentPeriod = TimeSpan.FromMinutes(1);
        limiter.TokensPerPeriod = 100;
        limiter.QueueLimit = 10;
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });
    
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            type = "https://api.example.com/errors/rate-limited",
            title = "Too Many Requests",
            status = 429,
            detail = "Rate limit exceeded. Please retry after the Retry-After period."
        });
    };
});`,
            language: 'csharp'
        },
        {
            title: 'GraphQL vs REST — When to Use Which',
            content: `<table>
                <thead><tr><th>Dimension</th><th>REST</th><th>GraphQL</th></tr></thead>
                <tbody>
                    <tr><td>Data fetching</td><td>Multiple endpoints, fixed response shape</td><td>Single endpoint, client specifies shape</td></tr>
                    <tr><td>Over/under-fetching</td><td>Common (fixed responses)</td><td>Solved (client asks for exactly what it needs)</td></tr>
                    <tr><td>Caching</td><td>HTTP caching built-in (ETags, CDN)</td><td>Complex (POST requests, custom caching)</td></tr>
                    <tr><td>Versioning</td><td>URL/header versioning</td><td>Schema evolution (deprecate fields)</td></tr>
                    <tr><td>Tooling</td><td>Swagger/OpenAPI, mature ecosystem</td><td>GraphiQL, code-gen, strong typing</td></tr>
                    <tr><td>Learning curve</td><td>Low</td><td>Higher (schema, resolvers, N+1 problem)</td></tr>
                    <tr><td>File upload</td><td>Straightforward (multipart)</td><td>Awkward (separate upload endpoint)</td></tr>
                    <tr><td>Real-time</td><td>WebSocket/SSE (separate)</td><td>Subscriptions (built-in)</td></tr>
                </tbody>
            </table>`,
            callout: {
                type: 'info',
                title: 'Decision Framework',
                text: 'Use REST when: you have a simple CRUD API, need HTTP caching, have many diverse consumers, or want simplicity. Use GraphQL when: you have a complex domain with many relationships, mobile clients that need minimal payloads, or a rapidly evolving frontend that needs flexibility without backend changes.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Verbs in URLs</strong>: POST /createOrder instead of POST /orders. Use nouns for resources, HTTP verbs for actions.</li>
                <li><strong>Ignoring HTTP status codes</strong>: Returning 200 with {"error": "not found"}. Use 404, 422, 409 appropriately.</li>
                <li><strong>No pagination</strong>: GET /users returns 100K records. Always paginate collections.</li>
                <li><strong>Breaking changes without versioning</strong>: Removing or renaming fields breaks existing consumers silently.</li>
                <li><strong>Inconsistent naming</strong>: Mixing camelCase, snake_case, PascalCase across endpoints. Pick one, be consistent.</li>
                <li><strong>No idempotency for POST</strong>: Payment retries create duplicate orders. Add Idempotency-Key support.</li>
                <li><strong>Exposing database schema</strong>: API response mirrors DB columns including internal IDs, timestamps, and join tables.</li>
                <li><strong>No rate limiting</strong>: A single misbehaving client can DoS your API.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li>Resource-oriented design (nouns not verbs, proper HTTP methods/status codes)</li>
                    <li>Versioning strategy with migration plan</li>
                    <li>Error handling standard (RFC 7807) with actionable error messages</li>
                    <li>Pagination approach (cursor vs offset) with rationale</li>
                    <li>Idempotency pattern for non-safe operations</li>
                    <li>Rate limiting with proper response headers</li>
                    <li>GraphQL vs REST trade-off analysis (not "GraphQL is better")</li>
                    <li>API evolution strategy — how to add features without breaking consumers</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Design APIs for consumers, not for your database schema</li>
                <li>Use HTTP semantics correctly: verbs, status codes, headers, caching</li>
                <li>Cursor-based pagination for large/mutable datasets; offset for small/static ones</li>
                <li>Idempotency-Key header for any operation that creates resources or charges money</li>
                <li>RFC 7807 Problem Details for consistent, machine-readable error responses</li>
                <li>Rate limit all endpoints; communicate limits via headers; return 429 with Retry-After</li>
                <li>Version via URL path for public APIs; additive-only for internal APIs</li>
                <li>GraphQL excels for complex frontends; REST excels for simple, cacheable, widely-consumed APIs</li>
            </ul>`
        }
    ],
    questions: [
        {
            id: 'api-q1',
            level: 'senior',
            title: 'How do you design a REST API that handles breaking changes without disrupting existing consumers?',
            answer: `<p>Multi-pronged strategy:</p>
            <ol>
                <li><strong>Additive changes only</strong> (within a version): Add new fields (optional), new endpoints, new query params. Never remove or rename.</li>
                <li><strong>Version when breaking</strong>: When a change IS breaking (removing field, changing type), introduce a new version (v2).</li>
                <li><strong>Sunset headers</strong>: Add <code>Sunset: Sat, 01 Jan 2025 00:00:00 GMT</code> and <code>Deprecation: true</code> headers to old versions.</li>
                <li><strong>Parallel running</strong>: Support both v1 and v2 concurrently. Route at the API gateway level.</li>
                <li><strong>Migration support</strong>: Provide migration guides, track adoption metrics per version, and set a hard deprecation date.</li>
            </ol>
            <p>Key insight: most "breaking changes" can be avoided with careful additive design. Reserve versioning for genuinely incompatible changes.</p>`
        },
        {
            id: 'api-q2',
            level: 'architect',
            title: 'When would you choose GraphQL over REST for a new project?',
            answer: `<p>Choose GraphQL when:</p>
            <ul>
                <li><strong>Complex domain with many relationships</strong>: User → Orders → Products → Reviews. REST requires N endpoints or N+1 requests; GraphQL fetches the exact graph in one call.</li>
                <li><strong>Mobile-first with bandwidth constraints</strong>: Clients need minimal payloads. GraphQL lets each client request only needed fields.</li>
                <li><strong>Rapid frontend iteration</strong>: Frontend teams need new data combinations without waiting for backend changes.</li>
                <li><strong>Multiple consumer types</strong>: Dashboard needs summary, mobile needs details, admin needs everything — one schema serves all.</li>
            </ul>
            <p>Stick with REST when: API is simple CRUD, HTTP caching is critical, consumers are diverse/external (OpenAPI is universal), or team lacks GraphQL expertise.</p>`
        },
        {
            id: 'api-q3',
            level: 'mid',
            title: 'What is idempotency and why is it critical for payment APIs?',
            answer: `<p><strong>Idempotency</strong> means executing the same request multiple times produces the same result as executing it once. Critical for payments because:</p>
            <ul>
                <li>Network timeouts cause client retries — without idempotency, the customer gets charged twice</li>
                <li>Load balancers/proxies may retry failed requests automatically</li>
                <li>Mobile apps retry on network switch (WiFi → cellular)</li>
            </ul>
            <p>Implementation: client sends <code>Idempotency-Key: uuid</code> header. Server checks if key was processed before. If yes → return cached result. If no → process and cache result. Key expires after 24-48h.</p>`
        },
        {
            id: 'api-q4',
            level: 'mid',
            title: 'What are the trade-offs between offset and cursor-based pagination?',
            answer: `<p><strong>Offset pagination</strong> (<code>?page=5&size=20</code>):</p>
            <ul>
                <li>Pro: Random page access, simple to implement, familiar UX</li>
                <li>Con: OFFSET N is O(N) in SQL (scans and discards), inconsistent under concurrent writes (items shift between pages)</li>
            </ul>
            <p><strong>Cursor pagination</strong> (<code>?cursor=abc&limit=20</code>):</p>
            <ul>
                <li>Pro: O(1) seek using index, consistent results regardless of writes, performant at any depth</li>
                <li>Con: No random page access (forward/back only), more complex to implement</li>
            </ul>
            <p>Rule of thumb: Use cursor for user-facing feeds/timelines (large, mutable). Use offset for admin dashboards (small datasets, random access needed).</p>`
        },
        {
            id: 'api-q5',
            level: 'junior',
            title: 'What HTTP status codes should a well-designed API use?',
            answer: `<table>
                <thead><tr><th>Code</th><th>Meaning</th><th>When to Use</th></tr></thead>
                <tbody>
                    <tr><td>200</td><td>OK</td><td>Successful GET, PUT, PATCH</td></tr>
                    <tr><td>201</td><td>Created</td><td>Successful POST that created a resource</td></tr>
                    <tr><td>204</td><td>No Content</td><td>Successful DELETE (no body returned)</td></tr>
                    <tr><td>400</td><td>Bad Request</td><td>Invalid request body/parameters (validation failure)</td></tr>
                    <tr><td>401</td><td>Unauthorized</td><td>Missing or invalid authentication</td></tr>
                    <tr><td>403</td><td>Forbidden</td><td>Authenticated but not authorized for this action</td></tr>
                    <tr><td>404</td><td>Not Found</td><td>Resource doesn't exist</td></tr>
                    <tr><td>409</td><td>Conflict</td><td>Conflicting state (duplicate, concurrency conflict)</td></tr>
                    <tr><td>422</td><td>Unprocessable Entity</td><td>Valid JSON but business logic rejection</td></tr>
                    <tr><td>429</td><td>Too Many Requests</td><td>Rate limit exceeded</td></tr>
                    <tr><td>500</td><td>Internal Server Error</td><td>Unhandled server exception</td></tr>
                    <tr><td>503</td><td>Service Unavailable</td><td>Server overloaded or in maintenance</td></tr>
                </tbody>
            </table>`
        },
        {
            id: 'api-q6',
            level: 'senior',
            title: 'How would you implement rate limiting in a distributed API (multiple instances behind a load balancer)?',
            answer: `<p>Challenge: with multiple API instances, each can't track limits independently (user splits requests across instances). Solution: centralized rate limit store.</p>
            <ul>
                <li><strong>Redis-based</strong>: Use Redis as shared counter store. Lua script for atomic increment + TTL. Low latency (sub-ms).</li>
                <li><strong>Algorithm</strong>: Token bucket or sliding window in Redis sorted sets.</li>
                <li><strong>Key structure</strong>: <code>ratelimit:{clientId}:{endpoint}:{window}</code></li>
                <li><strong>Fallback</strong>: If Redis is down, allow requests (fail-open) or use local approximate limits (fail-safe).</li>
            </ul>
            <p>Alternative: API Gateway-level rate limiting (AWS API Gateway, Azure APIM, Kong) — offloads this from your application entirely.</p>`
        },
        {
            id: 'api-q7',
            level: 'architect',
            title: 'How do you evolve an API from a monolith to microservices without breaking consumers?',
            answer: `<p>The Strangler Fig approach applied to APIs:</p>
            <ol>
                <li><strong>API Gateway as facade</strong>: Place a gateway in front of the monolith. All clients talk to the gateway.</li>
                <li><strong>Route-by-route migration</strong>: New microservice handles /v1/orders. Gateway routes /orders to new service, everything else to monolith.</li>
                <li><strong>Same contract</strong>: New service implements the EXACT same request/response shape. Consumer sees no change.</li>
                <li><strong>Shadow testing</strong>: Route traffic to both old and new, compare responses. Fix discrepancies before cutover.</li>
                <li><strong>Gradual cutover</strong>: Canary 1% → 10% → 50% → 100% to new service.</li>
            </ol>
            <p>The consumer-facing API contract never changes — only the implementation behind the gateway.</p>`
        },
        {
            id: 'api-q8',
            level: 'mid',
            title: 'How should an API handle validation errors vs business logic errors?',
            answer: `<p>Distinguish two types of client errors:</p>
            <ul>
                <li><strong>400 Bad Request (validation)</strong>: Malformed input — wrong type, missing required field, invalid format. The request is syntactically wrong. Include field-level error details.</li>
                <li><strong>422 Unprocessable Entity (business logic)</strong>: Valid input but violates business rules — insufficient balance, expired promotion code, item out of stock. The request is valid but can't be fulfilled.</li>
            </ul>
            <p>Both should use RFC 7807 format with machine-readable <code>type</code> URIs so clients can programmatically handle specific errors without parsing human-readable messages.</p>`
        }
    ]
});
