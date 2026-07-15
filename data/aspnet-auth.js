/* ═══════════════════════════════════════════════════════════════════
   ASP.NET Core — Authentication & Authorization
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('aspnet-auth', {
    title: 'Authentication & Authorization',
    description: 'JWT bearer tokens, OAuth 2.0 / OpenID Connect, claims-based identity, policy-based authorization, role-based access, and securing APIs in production.',
    quickRecall: [
        'JWT = Base64(header) + Base64(payload) + signature — stateless auth',
        'OAuth 2.0: Authorization Code + PKCE flow for SPAs and mobile apps',
        'Refresh tokens: long-lived, stored securely, used to get new access tokens',
        'Claims-based auth: identity carries claims (role, email, permissions)',
        'Policy auth: [Authorize(Policy="X")] — flexible rules beyond simple roles',
        'Role auth: simple but limited — policies can combine roles + claims + custom logic'
    ],
    sections: [
        {
            title: 'OAuth 2.0 / OIDC Flow',
            mermaid: `sequenceDiagram
    participant User as User Browser
    participant App as SPA / API
    participant IDP as Identity Provider<br/>(Entra ID / Auth0)
    participant API as Protected API

    User->>App: Access protected resource
    App->>IDP: Redirect to /authorize<br/>(code_challenge, client_id, scope)
    IDP->>User: Login prompt
    User->>IDP: Credentials + MFA
    IDP->>App: Authorization code
    App->>IDP: Exchange code for tokens<br/>(code_verifier, client_secret)
    IDP-->>App: access_token + refresh_token + id_token
    App->>API: API call + Bearer access_token
    API->>API: Validate JWT (signature, exp, aud, iss)
    API-->>App: Protected data`,
            content: `<p>Authentication and authorization in ASP.NET Core follows OAuth 2.0 / OpenID Connect standards. Understanding the full flow is critical for senior .NET interviews.</p>`
        },
        {
            title: 'Authentication vs Authorization',
            content: `<p><strong>Authentication</strong> (AuthN) verifies identity — "Who are you?" <strong>Authorization</strong> (AuthZ) verifies permissions — "What can you do?" In ASP.NET Core, these are separate middleware components that work together.</p>
            <ul>
                <li><strong>Authentication</strong> — validates credentials (JWT, cookie, API key) and produces a <code>ClaimsPrincipal</code></li>
                <li><strong>Authorization</strong> — evaluates the principal's claims against policies/roles to grant or deny access</li>
            </ul>`,
            code: `var builder = WebApplication.CreateBuilder(args);

// 1. AUTHENTICATION — Configure how to validate identity
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://auth.example.com";
        options.Audience = "my-api";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromSeconds(30) // Default is 5 min!
        };
    });

// 2. AUTHORIZATION — Configure access policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => 
        policy.RequireRole("Admin"));
    
    options.AddPolicy("CanEditUsers", policy => 
        policy.RequireClaim("permission", "users:write"));
    
    options.AddPolicy("MinAge18", policy =>
        policy.Requirements.Add(new MinimumAgeRequirement(18)));
    
    // Fallback policy — require authentication by default
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

var app = builder.Build();

// Middleware ORDER matters!
app.UseAuthentication();  // Sets HttpContext.User
app.UseAuthorization();   // Evaluates policies against User

// Apply to endpoints:
app.MapGet("/public", () => "Anyone").AllowAnonymous();
app.MapGet("/private", () => "Authenticated users only"); // Fallback policy
app.MapGet("/admin", () => "Admins only").RequireAuthorization("AdminOnly");`,
            language: 'csharp'
        },
        {
            title: 'JWT (JSON Web Tokens)',
            content: `<p>JWTs are self-contained tokens with three parts: <strong>Header</strong> (algorithm), <strong>Payload</strong> (claims), and <strong>Signature</strong> (verification). They are stateless — the server doesn't need to store session state.</p>`,
            code: `// JWT structure: header.payload.signature (base64url encoded)
// Header:  {"alg":"RS256","typ":"JWT"}
// Payload: {"sub":"user123","name":"Alice","role":"Admin","exp":1700000000}
// Signature: RSASHA256(base64(header) + "." + base64(payload), privateKey)

// Generating a JWT token:
public class TokenService
{
    private readonly IConfiguration _config;
    
    public string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
        
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("permission", "users:read"),
            new Claim("permission", "orders:write"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15), // Short-lived!
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

// Refresh token pattern:
// 1. Access token (JWT): short-lived (15 min), sent in Authorization header
// 2. Refresh token: long-lived (7 days), stored securely, used to get new access token
// 3. On 401, client uses refresh token to get new access + refresh pair
// 4. Refresh token rotation: each use invalidates old refresh token (prevents replay)

app.MapPost("/auth/refresh", async (RefreshRequest req, ITokenService tokenSvc) =>
{
    var principal = tokenSvc.ValidateExpiredToken(req.AccessToken);
    var storedRefresh = await tokenSvc.GetRefreshTokenAsync(principal.GetUserId());
    
    if (storedRefresh != req.RefreshToken || storedRefresh.IsExpired)
        return Results.Unauthorized();
    
    var newAccess = tokenSvc.GenerateToken(principal);
    var newRefresh = tokenSvc.GenerateRefreshToken();
    await tokenSvc.SaveRefreshTokenAsync(principal.GetUserId(), newRefresh);
    
    return Results.Ok(new { AccessToken = newAccess, RefreshToken = newRefresh });
});`,
            language: 'csharp',
            callout: { type: 'warning', title: 'JWT Security', text: 'Never store sensitive data in JWT payload — it is only base64-encoded, not encrypted. Keep access tokens short-lived (5-15 min). Use HTTPS always. Store refresh tokens securely (HttpOnly cookie or encrypted DB, never localStorage).' }
        },
        {
            title: 'Policy-Based Authorization',
            content: `<p>Policy-based authorization is the recommended approach in ASP.NET Core. Policies combine requirements (rules) evaluated against the user's claims. They are more flexible than role-based checks and support complex business logic.</p>`,
            code: `// Define policies:
builder.Services.AddAuthorization(options =>
{
    // Simple claim-based
    options.AddPolicy("PremiumUser", policy =>
        policy.RequireClaim("subscription", "premium", "enterprise"));

    // Role-based
    options.AddPolicy("Management", policy =>
        policy.RequireRole("Admin", "Manager"));

    // Custom requirement
    options.AddPolicy("SameUserOrAdmin", policy =>
        policy.Requirements.Add(new SameUserOrAdminRequirement()));
    
    // Age-based
    options.AddPolicy("Over18", policy =>
        policy.Requirements.Add(new MinimumAgeRequirement(18)));
});

// Custom requirement + handler:
public class MinimumAgeRequirement : IAuthorizationRequirement
{
    public int MinimumAge { get; }
    public MinimumAgeRequirement(int age) => MinimumAge = age;
}

public class MinimumAgeHandler : AuthorizationHandler<MinimumAgeRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, 
        MinimumAgeRequirement requirement)
    {
        var dobClaim = context.User.FindFirst("date_of_birth");
        if (dobClaim is null) return Task.CompletedTask; // Fail silently

        var dob = DateTime.Parse(dobClaim.Value);
        var age = DateTime.Today.Year - dob.Year;
        
        if (age >= requirement.MinimumAge)
            context.Succeed(requirement);
        
        return Task.CompletedTask;
    }
}

// Resource-based authorization (checking ownership):
public class DocumentAuthorizationHandler 
    : AuthorizationHandler<OperationAuthorizationRequirement, Document>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        OperationAuthorizationRequirement requirement,
        Document resource)
    {
        var userId = context.User.GetUserId();
        
        if (requirement.Name == "Edit" && resource.OwnerId == userId)
            context.Succeed(requirement);
        
        if (context.User.IsInRole("Admin"))
            context.Succeed(requirement);
        
        return Task.CompletedTask;
    }
}

// Using resource-based auth in a handler:
app.MapPut("/documents/{id}", async (int id, IAuthorizationService authz, 
    ClaimsPrincipal user, IDocumentService docs) =>
{
    var doc = await docs.GetAsync(id);
    var result = await authz.AuthorizeAsync(user, doc, Operations.Edit);
    return result.Succeeded ? Results.Ok() : Results.Forbid();
});`,
            language: 'csharp'
        },
        {
            title: 'OAuth 2.0 & OpenID Connect',
            content: `<p><strong>OAuth 2.0</strong> is an authorization framework for delegated access. <strong>OpenID Connect</strong> (OIDC) adds an authentication layer on top. Together they enable "Sign in with Google/Microsoft/etc." and secure API-to-API communication.</p>`,
            code: `// OAuth 2.0 Flows:
// Authorization Code + PKCE — SPAs, mobile apps, server apps (RECOMMENDED)
// Client Credentials          — machine-to-machine (no user involved)
// Device Code                 — smart TVs, CLIs
// DEPRECATED: Implicit, Resource Owner Password

// OpenID Connect adds:
// - ID Token (user identity, JWT)
// - UserInfo endpoint
// - Standard scopes: openid, profile, email
// - Discovery document (/.well-known/openid-configuration)

// Configuring OIDC in ASP.NET Core:
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie()
.AddOpenIdConnect(options =>
{
    options.Authority = "https://login.microsoftonline.com/{tenant}/v2.0";
    options.ClientId = builder.Configuration["AzureAd:ClientId"];
    options.ClientSecret = builder.Configuration["AzureAd:ClientSecret"];
    options.ResponseType = "code"; // Authorization Code flow
    options.SaveTokens = true;
    options.Scope.Add("api://my-api/.default");
    options.MapInboundClaims = false; // Keep original claim names
});

// Client Credentials (machine-to-machine):
builder.Services.AddHttpClient("InternalApi", client =>
{
    client.BaseAddress = new Uri("https://internal-api.company.com");
})
.AddHttpMessageHandler<ClientCredentialsHandler>();

public class ClientCredentialsHandler : DelegatingHandler
{
    private readonly ITokenAcquisition _tokens;
    
    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        var token = await _tokens.GetAccessTokenForAppAsync("api://internal/.default");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await base.SendAsync(request, ct);
    }
}`,
            language: 'csharp'
        }
    ],
    questions: [
        {"question":"What is the difference between authentication and authorization in ASP.NET Core, and how are they configured?","difficulty":"medium","answer":"<p><strong>Authentication</strong> establishes <em>who</em> you are (validating credentials/tokens and building a <code>ClaimsPrincipal</code>); <strong>authorization</strong> decides <em>what</em> you may do (policies/roles). They are distinct middleware: <code>UseAuthentication</code> must run before <code>UseAuthorization</code>.</p><p>Configure authentication with a scheme (JWT bearer, cookies, OpenID Connect) via <code>AddAuthentication().AddJwtBearer(...)</code>; configure authorization with <code>AddAuthorization</code> and policies, applied via <code>[Authorize]</code>/<code>RequireAuthorization</code>. Getting the middleware order wrong (authz before authn) is a common bug.</p>","explanation":"Authentication is showing your passport at the airport (who you are); authorization is whether your ticket lets you into the business-class lounge (what you may access). You must show the passport first.","bestPractices":["UseAuthentication before UseAuthorization","Prefer policy-based authorization over scattered role checks","Validate token issuer, audience, lifetime, and signature"],"commonMistakes":["Registering authorization before authentication","Conflating the two concepts","Not validating all JWT parameters"],"interviewTip":"Nail the who-vs-what distinction and the middleware order; mention policy-based authz as the scalable approach.","followUp":["What are policy vs role-based authorization?","What claims must you validate in a JWT?","How do authentication schemes work?"]},
        {"question":"What are the security trade-offs between JWT (bearer token) and cookie authentication?","difficulty":"hard","answer":"<p><strong>Cookies</strong> are stateful-ish (often server-session-backed), sent automatically by the browser, and support server-side revocation — but are susceptible to <strong>CSRF</strong> (mitigated with anti-forgery tokens and SameSite). <strong>JWTs</strong> are stateless, self-contained, and ideal for APIs/SPAs/mobile and cross-service calls — but are hard to revoke before expiry and, if stored in <code>localStorage</code>, are exposed to <strong>XSS</strong> token theft.</p><p>Guidance: cookies (HttpOnly, Secure, SameSite) for server-rendered apps; short-lived JWTs + refresh tokens for APIs/SPAs, ideally storing tokens in memory or HttpOnly cookies to reduce XSS exposure. Keep JWT lifetimes short and pair with a revocation strategy (allow/deny list) where needed.</p>","explanation":"A cookie is a wristband the venue tracks and can cut off. A JWT is a signed pass anyone holding it can use until it expires — convenient, but you cannot easily cancel a lost one mid-day.","bestPractices":["Cookies: HttpOnly + Secure + SameSite; add anti-forgery tokens","JWT: short lifetimes + refresh tokens; validate all claims","Avoid storing JWTs in localStorage (XSS risk)"],"commonMistakes":["Storing JWTs in localStorage exposed to XSS","No CSRF protection on cookie auth","Long-lived JWTs with no revocation path"],"interviewTip":"Map each to its attack (cookies->CSRF, localStorage JWT->XSS) and its revocation story (cookies revocable, JWT hard to revoke) — that pairing is the senior signal.","followUp":["How do refresh tokens work?","How does SameSite mitigate CSRF?","How do you revoke a JWT before expiry?"]},
        {
            question: 'How does JWT authentication work in ASP.NET Core? What are access and refresh tokens?',
            difficulty: 'medium',
            answer: `<p>JWT authentication works by: (1) client sends credentials, (2) server validates and returns a signed JWT access token, (3) client includes token in Authorization header on subsequent requests, (4) server validates signature and claims without any server-side session. Refresh tokens provide a way to get new access tokens without re-authenticating.</p>`,
            code: `// Flow:
// 1. POST /auth/login { email, password }
// 2. Server validates → returns { accessToken (15min), refreshToken (7d) }
// 3. Client: Authorization: Bearer <accessToken>
// 4. Server: validates signature, checks expiry, reads claims
// 5. On 401: POST /auth/refresh { accessToken, refreshToken } → new pair

// Access Token: short-lived JWT (5-15 minutes)
// - Stateless — server doesn't store it
// - Contains user claims (id, roles, permissions)
// - Self-validating via signature
// - Cannot be revoked individually (until it expires)

// Refresh Token: long-lived opaque string (7-30 days)
// - Stored in database (server-side)
// - Used only to get new access tokens
// - Can be revoked (delete from DB)
// - Should use rotation (new refresh token each use)

// Security best practices:
// - Access token: short expiry, in memory (not localStorage)
// - Refresh token: HttpOnly cookie or secure storage
// - Refresh token rotation: prevents replay attacks
// - Revocation: delete refresh token on logout
// - Sliding expiration: extend refresh token on use`,
            language: 'csharp',
            bestPractices: [
                'Keep access tokens short-lived (5-15 minutes)',
                'Use refresh token rotation (issue new refresh token each time)',
                'Store refresh tokens server-side with user association',
                'Never store JWTs in localStorage (XSS vulnerable) — use HttpOnly cookies or memory'
            ],
            commonMistakes: [
                'Making access tokens long-lived (can\'t revoke if compromised)',
                'Storing JWTs in localStorage (vulnerable to XSS attacks)',
                'Not validating all token parameters (issuer, audience, expiry, signature)',
                'Setting ClockSkew too large (default 5 min is too generous — use 30 seconds)'
            ],
            interviewTip: 'Explain the stateless nature of JWTs — the server validates the SIGNATURE, not a session store. This is why access tokens must be short-lived: once issued, they cannot be individually revoked until expiry.',
            followUp: ['How do you revoke a JWT before it expires?', 'What is the difference between symmetric and asymmetric signing?', 'How do you handle token refresh in a SPA?'],
            seniorPerspective: 'I use asymmetric signing (RS256) in production — the auth server has the private key, API servers only need the public key. This decouples token issuance from validation and enables key rotation without downtime.',
            architectPerspective: 'In microservices, JWT validation is distributed: each service validates tokens independently using the identity provider\'s public keys (JWKS endpoint). This eliminates a central auth bottleneck but requires short token lifetimes and proper key rotation strategy.'
        },
        {
            question: 'Explain policy-based authorization. How does it differ from role-based authorization?',
            difficulty: 'advanced',
            answer: `<p><strong>Role-based</strong> authorization checks if a user belongs to a named role (Admin, Editor). <strong>Policy-based</strong> authorization evaluates complex rules (requirements) against the user's claims, request context, or external data. Policies are more flexible, composable, testable, and don't hard-code role names throughout the codebase.</p>`,
            code: `// ROLE-BASED — simple but brittle:
[Authorize(Roles = "Admin,Manager")] // Hard-coded role names everywhere
public IActionResult DeleteUser(int id) { }
// Problem: Adding a new role requires finding and updating all [Authorize] attributes

// POLICY-BASED — flexible, centralized:
// Define once:
options.AddPolicy("CanDeleteUsers", policy =>
    policy.RequireAssertion(ctx =>
        ctx.User.IsInRole("Admin") ||
        (ctx.User.IsInRole("Manager") && ctx.User.HasClaim("department", "HR"))));

// Apply anywhere:
[Authorize(Policy = "CanDeleteUsers")]
public IActionResult DeleteUser(int id) { }
// Adding a new condition = change ONE policy definition

// Policy advantages:
// 1. Centralized rule definitions (one place to update)
// 2. Composable requirements (combine multiple conditions)
// 3. Testable (unit test the handler independently)
// 4. Resource-based (check ownership: "can user X edit document Y?")
// 5. External data (call database or API during authorization)

// Custom handler with external data:
public class TenantAccessHandler : AuthorizationHandler<TenantAccessRequirement>
{
    private readonly ITenantService _tenants;
    
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context, TenantAccessRequirement req)
    {
        var userId = context.User.GetUserId();
        var tenantId = GetTenantFromRoute(context);
        
        // Check external data (DB call)
        if (await _tenants.UserBelongsToTenantAsync(userId, tenantId))
            context.Succeed(req);
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Use policies for all authorization logic (even simple role checks)',
                'Define policies in one place (AddAuthorization configuration)',
                'Use resource-based auth for ownership checks',
                'Register multiple handlers for the same requirement (any succeed = pass)'
            ],
            commonMistakes: [
                'Scattering [Authorize(Roles = "...")] throughout the codebase (hard to maintain)',
                'Not using resource-based authorization for entity-level access control',
                'Calling context.Fail() instead of just not calling Succeed (Fail blocks other handlers)',
                'Not registering AuthorizationHandler<T> in DI (handler never runs)'
            ],
            interviewTip: 'Show the evolution: Roles → Claims → Policies → Resource-based. Each level adds flexibility. Emphasize that policies are testable and centralized — changing "who can delete users" means editing ONE policy, not searching the entire codebase.',
            followUp: ['How do you test authorization handlers?', 'What is resource-based authorization?', 'How do policies work with Minimal APIs?'],
            seniorPerspective: 'I define a permissions-based system: users have permissions (not just roles), and policies check for specific permissions. This gives fine-grained control without the explosion of roles that large systems inevitably face.',
            architectPerspective: 'In multi-tenant SaaS, authorization is the most complex cross-cutting concern. I combine policy-based auth with a hierarchical permission model: Organization → Team → Resource, each level with its own authorization handlers checking the full context chain.'
        },
        {
            question: 'What is OAuth 2.0 and how does it differ from OpenID Connect?',
            difficulty: 'advanced',
            answer: `<p><strong>OAuth 2.0</strong> is an <em>authorization</em> framework — it grants applications limited access to resources on behalf of a user (delegated access). <strong>OpenID Connect (OIDC)</strong> is an <em>authentication</em> layer built on top of OAuth 2.0 — it adds identity verification (who the user IS). OAuth 2.0 alone does NOT tell you who the user is.</p>`,
            code: `// OAuth 2.0 = "App X can access my photos on Google" (AUTHORIZATION)
//   - Grants access tokens (opaque or JWT)
//   - Scopes define what access is granted
//   - Does NOT provide user identity
//   - Flows: Authorization Code, Client Credentials, Device Code

// OpenID Connect = "I am Alice and I work at Contoso" (AUTHENTICATION)
//   - Built on OAuth 2.0 (extends it)
//   - Adds ID Token (JWT with user identity claims)
//   - Standard claims: sub, name, email, picture
//   - UserInfo endpoint for additional profile data
//   - Discovery document for auto-configuration

// Key differences:
// OAuth 2.0:
//   Token: Access Token (for API calls)
//   Purpose: "What can this app do?"
//   Scopes: api.read, api.write, photos.upload

// OIDC:
//   Token: ID Token + Access Token
//   Purpose: "Who is this user?" + "What can they do?"
//   Scopes: openid, profile, email (standard identity scopes)

// Flow comparison:
// Authorization Code + PKCE (recommended for all clients):
// 1. App redirects user to auth server (/authorize)
// 2. User authenticates and consents
// 3. Auth server redirects back with authorization code
// 4. App exchanges code for tokens (/token) — server-side!
// 5. Returns: access_token + id_token + refresh_token

// Client Credentials (machine-to-machine, no user):
// 1. Service sends client_id + client_secret to /token
// 2. Returns: access_token (no id_token — no user!)
// Used for: background services, API-to-API communication

// PKCE (Proof Key for Code Exchange):
// Prevents authorization code interception attacks
// Client generates: code_verifier (random) → code_challenge (SHA256 hash)
// Sends challenge in /authorize, verifier in /token
// Server verifies: SHA256(verifier) == challenge`,
            language: 'csharp',
            bestPractices: [
                'Always use Authorization Code + PKCE (even for server-side apps)',
                'Use OIDC when you need user identity (not just API access)',
                'Use Client Credentials for service-to-service communication',
                'Validate ID tokens properly (issuer, audience, signature, expiry, nonce)'
            ],
            commonMistakes: [
                'Using Implicit flow (deprecated — use Auth Code + PKCE instead)',
                'Confusing OAuth 2.0 (authorization) with authentication (use OIDC for identity)',
                'Not validating the ID token thoroughly (trusting claims without verification)',
                'Using Resource Owner Password flow (exposes user credentials to client app)'
            ],
            interviewTip: 'The key analogy: OAuth 2.0 is like a hotel key card (grants access to specific rooms) — it doesn\'t say WHO you are. OIDC is like a passport (proves identity) PLUS a key card. Most apps need OIDC because they need to know who the user is.',
            followUp: ['What is PKCE and why is it required?', 'How do you handle token refresh in a SPA?', 'What is the difference between access tokens and ID tokens?'],
            seniorPerspective: 'I always use a managed identity provider (Auth0, Azure AD, Keycloak) rather than implementing OAuth/OIDC from scratch. The security surface area of auth is too large to maintain in-house for most teams.',
            architectPerspective: 'In microservices, we use OIDC for user-facing authentication (front channel) and Client Credentials for service-to-service (back channel). The identity provider becomes a critical infrastructure component — deploy it with the same rigor as your database.'
        },
        {
            question: 'Explain claims-based identity in ASP.NET Core. What is the relationship between ClaimsPrincipal, ClaimsIdentity, and Claim?',
            difficulty: 'medium',
            answer: `<p>ASP.NET Core represents the authenticated user as a <strong>claims-based identity</strong>:</p>
            <ul>
                <li><strong>Claim</strong> — a single name/value statement about the subject (e.g. <code>role=Admin</code>, <code>email=a@b.com</code>)</li>
                <li><strong>ClaimsIdentity</strong> — a set of claims from one authentication source, plus the <code>AuthenticationType</code> and which claim types represent name/role</li>
                <li><strong>ClaimsPrincipal</strong> — the user, which can hold <strong>multiple identities</strong> (e.g. cookie + external login). <code>HttpContext.User</code> is a <code>ClaimsPrincipal</code></li>
            </ul>
            <p>Authorization evaluates claims on the principal. <code>IsInRole</code> simply checks for claims of the role claim type. The model is provider-agnostic — JWT, cookies, and external logins all materialize into the same claims structure.</p>`,
            explanation: 'Think of a ClaimsPrincipal as a person, each ClaimsIdentity as one ID document they carry (passport, driver license), and each Claim as a single fact printed on that document (name, date of birth).',
            code: `// Building an identity from claims:
var claims = new List<Claim>
{
    new(ClaimTypes.NameIdentifier, user.Id.ToString()),
    new(ClaimTypes.Name, user.UserName),
    new(ClaimTypes.Email, user.Email),
    new(ClaimTypes.Role, "Admin"),
    new("permission", "orders:write")
};

var identity = new ClaimsIdentity(
    claims,
    authenticationType: "Cookies",   // makes IsAuthenticated == true
    nameType: ClaimTypes.Name,
    roleType: ClaimTypes.Role);

var principal = new ClaimsPrincipal(identity);

// Reading claims in an endpoint:
app.MapGet("/me", (ClaimsPrincipal user) => new
{
    Id    = user.FindFirstValue(ClaimTypes.NameIdentifier),
    Name  = user.Identity?.Name,
    IsAdmin = user.IsInRole("Admin"),                 // checks role-type claims
    CanWrite = user.HasClaim("permission", "orders:write"),
    LoggedIn = user.Identity?.IsAuthenticated ?? false
});`,
            language: 'csharp',
            bestPractices: [
                'Use standard claim type URIs (ClaimTypes.*) or consistent custom names across services',
                'Always pass a non-empty authenticationType so Identity.IsAuthenticated is true',
                'Model fine-grained access as permission claims rather than an explosion of roles',
                'Keep tokens/cookies small — put only claims you actually authorize on'
            ],
            commonMistakes: [
                'Creating a ClaimsIdentity without an authenticationType (IsAuthenticated stays false)',
                'Assuming one principal has exactly one identity (it can have several)',
                'Trusting client-supplied claims without server-side validation of the token',
                'Stuffing large or sensitive data into claims (bloats every request, leaks in JWTs)'
            ],
            interviewTip: 'Draw the containment: Principal -> one or more Identities -> many Claims. Mention that IsAuthenticated depends on a non-null AuthenticationType and that IsInRole is just a claim lookup.',
            followUp: ['Why might a ClaimsPrincipal have multiple identities?', 'How does IsInRole actually work under the hood?', 'How do you add claims after authentication via claims transformation?'],
            seniorPerspective: 'I standardize claim names in a shared constants library so every service reads identity the same way. For dynamic permissions I use IClaimsTransformation to enrich the principal from a store at request time rather than baking volatile data into long-lived tokens.',
            architectPerspective: 'Claims are a contract between the identity provider and every downstream service. I version and document that claim set deliberately, because adding or renaming a claim is effectively an API change that can silently break authorization across the estate.'
        },
        {
            question: 'How do custom authorization requirements and handlers work, including resource-based authorization and multiple handlers for one requirement?',
            difficulty: 'advanced',
            answer: `<p>A policy is built from <strong>requirements</strong> (marker classes implementing <code>IAuthorizationRequirement</code>) evaluated by <strong>handlers</strong> (<code>AuthorizationHandler&lt;TRequirement&gt;</code>). Key mechanics:</p>
            <ul>
                <li>A handler calls <code>context.Succeed(requirement)</code> to approve. It should usually do <strong>nothing</strong> on failure rather than call <code>context.Fail()</code></li>
                <li>You can register <strong>multiple handlers</strong> for the same requirement; if <em>any</em> succeeds, the requirement passes (OR semantics) — useful for "owner OR admin"</li>
                <li><code>context.Fail()</code> is a hard veto: it fails the requirement even if another handler succeeded — reserve it for explicit deny rules</li>
                <li><strong>Resource-based</strong> authorization passes the actual entity to <code>IAuthorizationService.AuthorizeAsync(user, resource, requirement)</code>, enabling ownership checks that attributes cannot express</li>
            </ul>`,
            explanation: 'Requirements are the rule ("must be 18"), handlers are inspectors who can stamp "approved." Several inspectors can vouch for you and any one stamp is enough — but a single inspector shouting "DENY" (Fail) overrides everyone.',
            code: `// Requirement (just data):
public class DocumentOwnerRequirement : IAuthorizationRequirement { }

// Handler 1: owner may edit
public class OwnerHandler : AuthorizationHandler<DocumentOwnerRequirement, Document>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext ctx, DocumentOwnerRequirement req, Document doc)
    {
        if (doc.OwnerId == ctx.User.FindFirstValue(ClaimTypes.NameIdentifier))
            ctx.Succeed(req);          // approve; do NOT Fail otherwise
        return Task.CompletedTask;
    }
}

// Handler 2: admins may edit anything (OR with handler 1)
public class AdminOverrideHandler : AuthorizationHandler<DocumentOwnerRequirement, Document>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext ctx, DocumentOwnerRequirement req, Document doc)
    {
        if (ctx.User.IsInRole("Admin")) ctx.Succeed(req);
        return Task.CompletedTask;
    }
}

builder.Services.AddScoped<IAuthorizationHandler, OwnerHandler>();
builder.Services.AddScoped<IAuthorizationHandler, AdminOverrideHandler>();
builder.Services.AddAuthorization(o => o.AddPolicy("EditDocument",
    p => p.Requirements.Add(new DocumentOwnerRequirement())));

// Resource-based check inside the handler (entity known only at runtime):
app.MapPut("/documents/{id:int}", async (
    int id, IDocumentService docs, IAuthorizationService authz, ClaimsPrincipal user) =>
{
    var doc = await docs.GetAsync(id);
    if (doc is null) return Results.NotFound();
    var result = await authz.AuthorizeAsync(user, doc, "EditDocument");
    return result.Succeeded ? Results.NoContent() : Results.Forbid();
});`,
            language: 'csharp',
            bestPractices: [
                'Approve with Succeed and stay silent on non-match; reserve Fail for explicit deny rules',
                'Register multiple handlers per requirement for OR semantics (owner OR admin)',
                'Use resource-based AuthorizeAsync for entity ownership that attributes cannot express',
                'Register handlers in DI with the correct lifetime (scoped if they use scoped services)'
            ],
            commonMistakes: [
                'Calling context.Fail() on non-match, which can veto an otherwise-passing requirement',
                'Forgetting to register the handler in DI (the requirement can never be satisfied)',
                'Trying to express ownership checks with [Authorize] attributes instead of resource-based auth',
                'Putting authorization business logic in controllers/endpoints instead of reusable handlers'
            ],
            interviewTip: 'The senior signal is the Succeed-vs-Fail nuance and OR semantics across multiple handlers. Explain that not-calling-Succeed is a soft fail while Fail is a hard veto that overrides other successes.',
            followUp: ['Why prefer not calling Succeed over calling Fail?', 'How do multiple handlers for one requirement combine?', 'How do you unit test an authorization handler?'],
            seniorPerspective: 'I split orthogonal rules into separate handlers (owner, admin, support-impersonation) so each is independently testable and composes via OR. Fail is rare in my code — I use it only for true deny scenarios like a suspended account.',
            architectPerspective: 'In multi-tenant systems authorization is the gnarliest cross-cutting concern. I model it as resource-based handlers walking an Org -> Team -> Resource hierarchy, so a single AuthorizeAsync call evaluates the full context chain consistently across every service.'
        },
        {
            question: 'What is the difference between symmetric and asymmetric JWT signing, and how do you revoke a JWT before it expires?',
            difficulty: 'hard',
            answer: `<p><strong>Symmetric (HS256)</strong> uses one shared secret to both sign and verify. Every party that can verify can also forge tokens, so it only suits a single trusted service. <strong>Asymmetric (RS256/ES256)</strong> uses a private key to sign and a public key to verify; the issuer holds the private key while any number of APIs verify with the freely distributable public key (via a JWKS endpoint). Asymmetric is the standard for distributed systems and enables key rotation without sharing secrets.</p>
            <p>JWTs are <strong>stateless</strong>, so a validly-signed, unexpired token cannot be "un-issued" by signature checks alone. Revocation requires reintroducing state:</p>
            <ul>
                <li>Keep access tokens <strong>short-lived</strong> (5-15 min) and revoke the long-lived refresh token (delete it server-side)</li>
                <li>Maintain a <strong>deny-list</strong> of revoked token IDs (<code>jti</code>) in a distributed cache until they expire</li>
                <li>Track a per-user <strong>security stamp / token version</strong> claim; bump it on logout/password change to invalidate all prior tokens</li>
            </ul>`,
            explanation: 'Symmetric signing is a shared house key — anyone who can open the door can also copy the key. Asymmetric signing is a wax seal: only the issuer has the signet ring (private key), but anyone can recognize the seal (public key). And because a sealed letter is already sent, "recall" needs a separate blocklist at the mailroom.',
            code: `// Asymmetric validation: APIs only need the issuer's PUBLIC key (via JWKS/Authority)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://auth.example.com"; // fetches JWKS public keys
        options.Audience = "my-api";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,   // RS256 verified with public key
            ClockSkew = TimeSpan.FromSeconds(30)
        };
        // Deny-list check for early revocation:
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async ctx =>
            {
                var jti = ctx.Principal?.FindFirstValue(JwtRegisteredClaimNames.Jti);
                var denyList = ctx.HttpContext.RequestServices
                    .GetRequiredService<IRevokedTokenStore>();
                if (jti is not null && await denyList.IsRevokedAsync(jti))
                    ctx.Fail("Token has been revoked");
            }
        };
    });`,
            language: 'csharp',
            bestPractices: [
                'Use asymmetric signing (RS256/ES256) for any multi-service or public-facing system',
                'Distribute verification keys via the issuer JWKS endpoint to enable rotation',
                'Keep access tokens short-lived so natural expiry limits the revocation window',
                'Implement refresh-token revocation plus a jti deny-list for immediate invalidation'
            ],
            commonMistakes: [
                'Using HS256 with the secret shared across many services (any can forge tokens)',
                'Treating JWTs as instantly revocable without any server-side state',
                'Making access tokens long-lived, widening the compromise window',
                'Setting a large ClockSkew (default 5 min) that extends effective token lifetime'
            ],
            interviewTip: 'Hit both halves: HS256 = shared secret (single service), RS256 = sign private/verify public (distributed, rotatable). Then be explicit that statelessness is the whole point of JWTs, so revocation always means adding state back (short expiry + refresh revocation + jti deny-list).',
            followUp: ['What is a JWKS endpoint and how does key rotation work?', 'How does a security-stamp claim invalidate all of a user\'s tokens?', 'Why does ClockSkew effectively extend token lifetime?'],
            seniorPerspective: 'I default to RS256 with keys published via JWKS so APIs need zero shared secrets and the issuer can rotate keys transparently. For revocation I rely on short access-token TTLs plus refresh-token rotation, adding a jti deny-list only where immediate kill-switch semantics are a hard requirement.',
            architectPerspective: 'Revocation is a deliberate trade between JWT statelessness and control. I make the access-token lifetime a first-class architectural knob: short enough that the deny-list stays small and cheap, long enough to avoid hammering the token endpoint — and I monitor refresh traffic as a signal of that balance.'
        },
        {
            question: 'How do you handle token refresh race conditions when multiple API calls fire simultaneously with an expired access token?',
            difficulty: 'hard',
            answer: `<p>When an access token expires, multiple concurrent requests may all detect the expiration simultaneously and attempt to refresh. Without coordination, this causes: (1) multiple refresh token exchanges hitting the auth server, (2) if refresh tokens are single-use (rotated), all but the first request get an invalid token error, (3) cascading 401s that log the user out.</p>
            <p>The solution is a <strong>token refresh lock/queue</strong>: the first request that detects expiration initiates the refresh while all other concurrent requests <strong>wait</strong> for that single refresh to complete, then retry with the new token.</p>
            <p>Implementation patterns:</p>
            <ul>
                <li><strong>Client-side (SPA/mobile)</strong> \u2014 use a SemaphoreSlim or async lock; queue pending requests until refresh completes</li>
                <li><strong>HttpClient DelegatingHandler</strong> \u2014 intercept 401 responses, acquire a lock, refresh once, replay all queued requests</li>
                <li><strong>Proactive refresh</strong> \u2014 refresh the token BEFORE it expires (e.g., at 75% of lifetime) to avoid the race entirely</li>
            </ul>`,
            explanation: 'It is like a group arriving at a locked door simultaneously. Instead of everyone trying their key at once (and breaking the lock), one person opens it while others wait, then everyone walks through together.',
            code: `// DelegatingHandler with SemaphoreSlim to prevent refresh races:
public class TokenRefreshHandler : DelegatingHandler
{
    private readonly ITokenStore _tokenStore;
    private readonly IAuthService _authService;
    private static readonly SemaphoreSlim _refreshLock = new(1, 1);

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        var token = await _tokenStore.GetAccessTokenAsync();
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await base.SendAsync(request, ct);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            // Try to refresh — but only one thread does the actual refresh
            await _refreshLock.WaitAsync(ct);
            try
            {
                // Double-check: another thread may have already refreshed
                var currentToken = await _tokenStore.GetAccessTokenAsync();
                if (currentToken == token) // Still the old token — WE refresh
                {
                    var newToken = await _authService.RefreshTokenAsync(ct);
                    await _tokenStore.SetAccessTokenAsync(newToken);
                }
                // Retry with the (now-fresh) token
                var retryToken = await _tokenStore.GetAccessTokenAsync();
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", retryToken);
                response = await base.SendAsync(request, ct);
            }
            finally
            {
                _refreshLock.Release();
            }
        }
        return response;
    }
}

// PROACTIVE REFRESH — avoid the race entirely:
public class ProactiveRefreshService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var expiry = await _tokenStore.GetExpiryAsync();
            var refreshAt = expiry - TimeSpan.FromMinutes(2); // refresh 2min early
            await Task.Delay(refreshAt - DateTime.UtcNow, ct);
            await _authService.RefreshTokenAsync(ct);
        }
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Use a SemaphoreSlim or async lock to ensure only one refresh executes at a time',
                'Double-check the token after acquiring the lock (another thread may have refreshed)',
                'Implement proactive refresh (before expiry) to eliminate the race window entirely',
                'Use refresh token rotation with a grace period to handle slight timing overlaps',
                'Log refresh events and failures for debugging token lifecycle issues'
            ],
            commonMistakes: [
                'Not coordinating concurrent refresh attempts (causes token rotation failures)',
                'Using a simple bool flag instead of a proper async lock (race condition on the flag itself)',
                'Retrying the refresh on every 401 without checking if another thread already refreshed',
                'Setting the proactive refresh too close to expiry (network latency can still cause races)'
            ],
            interviewTip: 'Walk through the race scenario: 5 requests see 401, all try refresh, only one should win. Show the SemaphoreSlim + double-check pattern. Mention proactive refresh as the superior approach that avoids the problem entirely.',
            followUp: ['What happens with single-use refresh tokens when multiple requests race?', 'How does proactive refresh work in a distributed system with multiple instances?', 'How do you handle refresh failure (e.g., refresh token also expired)?']
        },
        {
            question: 'Explain the OAuth 2.0 PKCE flow. Why did it replace the implicit flow for SPAs and mobile apps, and what security problems does it solve?',
            difficulty: 'hard',
            answer: `<p><strong>PKCE (Proof Key for Code Exchange)</strong> is an extension to the Authorization Code flow that protects against <strong>authorization code interception attacks</strong>. It replaces the implicit flow (which returned tokens directly in URL fragments) because:</p>
            <ul>
                <li><strong>Implicit flow exposes tokens in the URL</strong> \u2014 visible in browser history, referrer headers, and server logs</li>
                <li><strong>Implicit flow has no refresh tokens</strong> \u2014 forces silent iframe refreshes that break with third-party cookie restrictions</li>
                <li><strong>Authorization code + PKCE is secure for public clients</strong> \u2014 even without a client secret, the code verifier proves the same app that started the flow is completing it</li>
            </ul>
            <p>PKCE flow: (1) Client generates a random <code>code_verifier</code> and derives <code>code_challenge = SHA256(code_verifier)</code>. (2) Sends code_challenge with the auth request. (3) Receives auth code. (4) Sends auth code + original code_verifier to token endpoint. (5) Server verifies SHA256(code_verifier) == stored code_challenge before issuing tokens.</p>
            <p>An attacker who intercepts the auth code cannot exchange it without the code_verifier (which never left the client).</p>`,
            explanation: 'PKCE is like mailing a locked box to a friend. You send the lock (code_challenge) first, then get a package (auth code) back. To open it at the post office (token endpoint), you present your unique key (code_verifier). An interceptor has the package but not your key.',
            code: `// ASP.NET Core — configuring PKCE for an OAuth client:
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie()
.AddOpenIdConnect(options =>
{
    options.Authority = "https://auth.example.com";
    options.ClientId = "spa-client";
    // No ClientSecret for public clients!
    options.ResponseType = "code";       // Authorization Code flow
    options.UsePkce = true;              // Enable PKCE
    options.SaveTokens = true;
    options.Scope.Add("openid");
    options.Scope.Add("offline_access"); // Get refresh token
});

// What happens under the hood:
// 1. Client generates: code_verifier = random(43-128 chars)
// 2. Client computes:  code_challenge = Base64Url(SHA256(code_verifier))
// 3. Auth request includes: code_challenge + code_challenge_method=S256
// 4. After user authenticates, redirect back with: auth_code
// 5. Token request includes: auth_code + code_verifier
// 6. Server verifies: SHA256(code_verifier) == stored code_challenge
// 7. If match: issue access_token + refresh_token

// WHY implicit flow is deprecated:
// - Token in URL fragment: https://app.com/#access_token=xyz (visible!)
// - No refresh tokens (spec forbids it for implicit)
// - Third-party cookie blocking kills silent iframe refresh
// - Browser history stores the token URL`,
            language: 'csharp',
            bestPractices: [
                'Always use Authorization Code + PKCE for SPAs and mobile apps (never implicit)',
                'Use S256 method for code_challenge (plain is only for devices that cannot SHA256)',
                'Store code_verifier in memory only (never in localStorage or cookies)',
                'Combine PKCE with short-lived access tokens and refresh token rotation',
                'Validate that your identity provider enforces PKCE for public clients'
            ],
            commonMistakes: [
                'Still using implicit flow for new SPAs (deprecated by OAuth 2.1)',
                'Storing code_verifier in localStorage (vulnerable to XSS extraction)',
                'Using plain code_challenge_method instead of S256 (weaker protection)',
                'Assuming PKCE replaces the need for other security measures (it only protects code exchange)'
            ],
            interviewTip: 'Explain the attack PKCE prevents: intercepted auth code is useless without the code_verifier. Then contrast with implicit: token directly in URL is game over if intercepted. The key insight is PKCE makes the code flow safe for public clients without a secret.',
            followUp: ['What is the difference between S256 and plain PKCE methods?', 'How does PKCE interact with refresh token rotation?', 'What does OAuth 2.1 change regarding implicit flow?']
        }

    ]
});
