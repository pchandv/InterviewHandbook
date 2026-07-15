/* ═══════════════════════════════════════════════════════════════════
   Security — OWASP Top 10, Web Security, Secure Coding
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('security-owasp', {
    title: 'OWASP & Web Security',
    description: 'OWASP Top 10 vulnerabilities, XSS, CSRF, SQL Injection, CORS, HTTPS, Content Security Policy, and secure coding practices in ASP.NET Core.',
    quickRecall: [
        'OWASP Top 10: Injection, Broken Auth, XSS, Broken Access, Misconfig, etc.',
        'XSS prevention: output encoding + Content-Security-Policy header',
        'SQL Injection: always use parameterized queries — never string concatenation',
        'CSRF: anti-forgery tokens + SameSite=Strict cookies block cross-origin POSTs',
        'CSP header: whitelist allowed script/style sources to block inline injection',
        'HTTPS everywhere + HSTS header forces encrypted transport'
    ],
    sections: [
        {
            title: 'OWASP Top 10 — Attack & Defense Model',
            mermaid: `graph LR
    subgraph Attacks["Common Attack Vectors"]
        A1["SQL Injection"]
        A2["XSS (Cross-Site Scripting)"]
        A3["CSRF (Cross-Site Request Forgery)"]
        A4["Broken Access Control"]
        A5["Sensitive Data Exposure"]
    end
    subgraph Defenses["Defense Layers"]
        D1["Input Validation + Parameterized Queries"]
        D2["Output Encoding + CSP"]
        D3["Anti-forgery Tokens + SameSite Cookies"]
        D4["Server-side Authorization + RBAC"]
        D5["Encryption (TLS + at rest) + Secrets Management"]
    end
    A1 -->|prevented by| D1
    A2 -->|prevented by| D2
    A3 -->|prevented by| D3
    A4 -->|prevented by| D4
    A5 -->|prevented by| D5`,
            content: `<p>Security is defense-in-depth: no single control is sufficient. Each attack vector requires specific mitigations at multiple layers.</p>`
        },
        {
            title: 'OWASP Top 10 (2021)',
            content: `<p>The <strong>OWASP Top 10</strong> is the industry-standard awareness document for web application security risks. Understanding and mitigating these is expected of every senior developer.</p>`,
            table: {
                headers: ['#', 'Category', 'Example', 'Mitigation'],
                rows: [
                    ['A01', 'Broken Access Control', 'IDOR: user accesses other users data', 'Authorization checks on every endpoint, deny by default'],
                    ['A02', 'Cryptographic Failures', 'Passwords stored as MD5, HTTP for sensitive data', 'Use bcrypt/Argon2, HTTPS everywhere, encrypt at rest'],
                    ['A03', 'Injection', 'SQL injection, command injection', 'Parameterized queries, ORMs, input validation'],
                    ['A04', 'Insecure Design', 'No rate limiting on login, no fraud detection', 'Threat modeling, security requirements, abuse cases'],
                    ['A05', 'Security Misconfiguration', 'Default passwords, verbose errors, open ports', 'Hardened configs, automated scanning, least privilege'],
                    ['A06', 'Vulnerable Components', 'Outdated NuGet packages with known CVEs', 'Dependency scanning, automated updates, SBOMs'],
                    ['A07', 'Auth Failures', 'Weak passwords, no MFA, session fixation', 'MFA, account lockout, secure session management'],
                    ['A08', 'Data Integrity Failures', 'Unsigned updates, CI/CD pipeline compromise', 'Signed artifacts, verified dependencies, integrity checks'],
                    ['A09', 'Logging & Monitoring Gaps', 'No alerts on brute force, no audit trail', 'Structured logging, alerting, audit trails, SIEM'],
                    ['A10', 'SSRF', 'Server fetches attacker-controlled URL', 'URL allowlists, disable redirects, network segmentation']
                ]
            }
        },
        {
            title: 'Common Vulnerabilities & Fixes in ASP.NET',
            content: `<p>Practical secure coding patterns for the most common web vulnerabilities.</p>`,
            code: `// SQL INJECTION — #1 most common vulnerability
// VULNERABLE:
var sql = $"SELECT * FROM Users WHERE Email = '{email}'";
// Attacker sends: ' OR '1'='1' --
// Result: SELECT * FROM Users WHERE Email = '' OR '1'='1' --'

// FIXED — parameterized queries (ALWAYS):
var user = await db.QueryAsync<User>(
    "SELECT * FROM Users WHERE Email = @Email", new { Email = email });
// Or EF Core (parameterized by default):
var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

// XSS (Cross-Site Scripting) — inject malicious scripts
// VULNERABLE (raw HTML rendering):
// <div>@Html.Raw(userInput)</div>  ← Attacker injects <script>steal(cookies)</script>

// FIXED — Razor auto-encodes by default:
// <div>@userInput</div>  ← HTML-encoded, safe
// For APIs: validate and sanitize input, use Content-Type: application/json

// CSRF (Cross-Site Request Forgery) — tricks user into unwanted action
// ASP.NET Core has built-in antiforgery:
builder.Services.AddAntiforgery();
// Razor Pages/MVC: @Html.AntiForgeryToken() + [ValidateAntiForgeryToken]
// APIs with JWT: not vulnerable (no cookies sent automatically)

// CORS — control which origins can call your API
builder.Services.AddCors(options =>
{
    options.AddPolicy("Production", policy =>
        policy.WithOrigins("https://myapp.com", "https://admin.myapp.com")
              .WithMethods("GET", "POST", "PUT", "DELETE")
              .WithHeaders("Authorization", "Content-Type")
              .SetPreflightMaxAge(TimeSpan.FromHours(1)));
});
// NEVER: policy.AllowAnyOrigin().AllowCredentials() — security hole!

// Content Security Policy — prevent XSS via HTTP header
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
    await next();
});`,
            language: 'csharp'
        },
        {
            title: 'Secure Configuration & Secrets',
            content: `<p>Secrets management and secure configuration prevent credential leakage — one of the most common causes of breaches.</p>`,
            code: `// NEVER commit secrets to source control!
// BAD: appsettings.json with connection strings containing passwords
// BAD: Environment variables in docker-compose checked into git

// GOOD: Azure Key Vault integration
builder.Configuration.AddAzureKeyVault(
    new Uri("https://myvault.vault.azure.net/"),
    new DefaultAzureCredential());
// Access like any other config:
var connStr = builder.Configuration["DatabaseConnectionString"];

// GOOD: User Secrets for development (never in repo)
// dotnet user-secrets set "Db:Password" "localdev123"
builder.Configuration.AddUserSecrets<Program>();

// GOOD: Managed Identity (no credentials at all!)
// App Service/AKS gets identity from Azure AD automatically
var credential = new DefaultAzureCredential();
var client = new SecretClient(vaultUri, credential);

// Security headers middleware:
app.UseHsts();                    // Strict-Transport-Security
app.UseHttpsRedirection();        // Force HTTPS
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    ctx.Response.Headers.Append("X-Frame-Options", "DENY");
    ctx.Response.Headers.Append("X-XSS-Protection", "0"); // Deprecated, use CSP
    ctx.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'What is SQL Injection and how do you prevent it in .NET?',
            difficulty: 'easy',
            answer: `<p><strong>SQL Injection</strong> occurs when user input is concatenated into SQL queries, allowing attackers to modify the query logic. Prevention: ALWAYS use parameterized queries (Dapper, EF Core, ADO.NET parameters). Never concatenate user input into SQL strings.</p>`,
            bestPractices: ['Use parameterized queries for ALL database access (EF Core does this by default)', 'Use stored procedures with parameters for complex queries', 'Validate and sanitize all input (whitelist acceptable characters)', 'Apply least-privilege database accounts (app user cannot DROP tables)'],
            commonMistakes: ['String concatenation in SQL queries (the root cause of injection)', 'Using dynamic SQL without sp_executesql and parameters', 'Trusting client-side validation (attacker bypasses JavaScript)', 'Not escaping input in raw SQL when parameterization is not possible'],
            interviewTip: 'Show the attack: input of " OR 1=1 -- " returns all rows. Then show the fix: parameterized queries treat the ENTIRE input as a literal value, never as SQL code. The database engine separates code from data.',
            followUp: ['Can EF Core have SQL injection vulnerabilities?', 'What about NoSQL injection?', 'How does parameterization work at the protocol level?'],
            seniorPerspective: 'EF Core and Dapper handle parameterization automatically for 99% of cases. The remaining 1% (dynamic ORDER BY, dynamic table names) needs careful whitelisting — never pass user input directly into those positions.',
            architectPerspective: 'SQL injection is a solved problem technically (parameterized queries), but it persists because of legacy code, raw SQL shortcuts, and developer education gaps. I enforce it via: Roslyn analyzers that flag string interpolation in SQL contexts, mandatory code review for any raw SQL, and regular DAST scanning.'
        },
        {
            question: 'Explain the OWASP Top 10. Which are most relevant for APIs?',
            difficulty: 'medium',
            answer: `<p>The OWASP Top 10 are the most critical web application security risks. For APIs specifically: <strong>A01 Broken Access Control</strong> (IDOR, missing authorization), <strong>A03 Injection</strong> (SQL/NoSQL), <strong>A07 Authentication Failures</strong> (weak tokens, no rate limiting), and <strong>A05 Security Misconfiguration</strong> (verbose errors, default configs) are the most common attack vectors.</p>`,
            bestPractices: ['Implement authorization on EVERY endpoint (deny by default)', 'Rate limit authentication endpoints (prevent brute force)', 'Return generic error messages to clients (log details server-side)', 'Scan dependencies for CVEs in CI/CD pipeline (Snyk, Dependabot)'],
            commonMistakes: ['Only checking authentication without authorization (logged in but no permission check)', 'Exposing stack traces and internal details in error responses', 'Not rate limiting login/password reset endpoints', 'Assuming internal APIs do not need security (lateral movement attacks)'],
            interviewTip: 'Don\'t just list them — pick 3-4 and explain how you\'ve mitigated them in real projects. Mention specific .NET features: [Authorize] policies, Data Protection API, antiforgery tokens, built-in model validation.',
            followUp: ['How do you implement rate limiting in ASP.NET Core?', 'What is IDOR and how do you prevent it?', 'How do you handle security in microservices?'],
            seniorPerspective: 'I integrate security into development workflow: threat modeling in design, SAST in CI (SonarQube), DAST in staging (OWASP ZAP), dependency scanning (Dependabot), and security-focused code review checklist. Security is not a phase — it is continuous.',
            architectPerspective: 'Security architecture for APIs: API gateway (rate limiting, WAF), OAuth 2.0/OIDC (authentication), policy-based authorization (fine-grained access), encrypted transit (TLS 1.3), encrypted at rest (Azure Storage encryption), and audit logging (every access recorded). Defense in depth — no single layer is sufficient.'
        },
        {
            question: 'Explain the three types of XSS (stored, reflected, DOM-based) and how you defend against each.',
            difficulty: 'hard',
            answer: `<p><strong>XSS (Cross-Site Scripting)</strong> injects attacker-controlled script that executes in a victim's browser in the context of the trusted site. There are three variants:</p>
            <ul>
                <li><strong>Stored (persistent):</strong> the payload is saved server-side (comment, profile field) and served to every viewer. Most dangerous — affects all users who load the page.</li>
                <li><strong>Reflected:</strong> the payload is echoed back immediately from the request (search term, error message) and requires luring the victim to a crafted URL.</li>
                <li><strong>DOM-based:</strong> entirely client-side — JavaScript reads untrusted input (location.hash, document.referrer) and writes it to the DOM via a sink like innerHTML, never touching the server.</li>
            </ul>
            <p>Defense is layered: <strong>context-aware output encoding</strong> (HTML, attribute, JS, URL), framework auto-escaping (Razor, React), avoiding dangerous sinks (innerHTML, Html.Raw), a strict <strong>Content-Security-Policy</strong> to block inline/foreign scripts, and HttpOnly cookies so stolen tokens are not readable from script.</p>`,
            explanation: 'XSS is like a forger slipping a fake note into a trusted company\'s outgoing mail. Stored XSS is poisoning the master template everyone receives; reflected XSS is tricking one person into mailing themselves the forged note; DOM XSS is the mailroom clerk (your JS) assembling the forged note locally without head office ever seeing it.',
            code: `// Stored/Reflected: encode on output (server). Razor auto-encodes:
// <div>@Model.Comment</div>           // safe - HTML-encoded
// <div>@Html.Raw(Model.Comment)</div> // DANGER - injects raw markup

// DOM-based XSS (client) - the bug and the fix:
// VULNERABLE:
element.innerHTML = location.hash.substring(1);   // attacker controls #...
// SAFE - treat as text, not markup:
element.textContent = decodeURIComponent(location.hash.substring(1));

// Defense-in-depth header (server middleware):
context.Response.Headers.Append("Content-Security-Policy",
    "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'");`,
            language: 'javascript',
            bestPractices: ['Encode output for its exact context (HTML body, attribute, JS, URL)', 'Rely on framework auto-escaping; avoid Html.Raw/innerHTML with untrusted data', 'Deploy a strict CSP and set cookies HttpOnly + Secure + SameSite', 'Sanitize rich-text input with a vetted library (e.g., HtmlSanitizer) when HTML must be allowed'],
            commonMistakes: ['Treating input validation as a substitute for output encoding', 'Encoding for the wrong context (HTML-encoding inside a JS block)', 'Forgetting DOM-based XSS because the server never sees the payload', 'Allowing user HTML and trying to blocklist <script> instead of allowlisting safe tags'],
            interviewTip: 'Name all three types AND map a defense to each — output encoding for stored/reflected, safe DOM sinks for DOM-based, and CSP as the backstop for all. Mentioning DOM-based XSS specifically signals depth, since many candidates forget it.',
            followUp: ['Why does input validation alone not stop XSS?', 'How does CSP nonce/hash-based scripting work?', 'How does React mostly prevent XSS, and where can it still happen (dangerouslySetInnerHTML)?'],
            seniorPerspective: 'I treat XSS as an output-encoding problem first and an input problem second — the same comment is dangerous in HTML but harmless in JSON, so the defense belongs at the point of rendering. For any feature that must accept HTML, I use a maintained sanitizer with an allowlist rather than hand-rolled filtering, which always loses to creative payloads.',
            architectPerspective: 'Architecturally I make XSS defense systemic, not per-developer: a strict CSP with nonces enforced at the edge, HttpOnly/SameSite cookies so a successful injection cannot trivially exfiltrate sessions, Trusted Types to lock down DOM sinks in the browser, and a CSP report-uri feeding monitoring so we detect injection attempts in production rather than discovering them after a breach.'
        },
        {
            question: 'What is CSRF, how does it relate to CORS and SameSite cookies, and when is an API not vulnerable?',
            difficulty: 'medium',
            answer: `<p><strong>CSRF (Cross-Site Request Forgery)</strong> tricks an authenticated user's browser into sending an unwanted state-changing request to a site where they are logged in. It exploits the browser's habit of <em>automatically attaching cookies</em> to requests, regardless of which site initiated them.</p>
            <ul>
                <li><strong>Antiforgery tokens:</strong> a per-session secret the attacker cannot read or guess must accompany state-changing requests.</li>
                <li><strong>SameSite cookies:</strong> <code>SameSite=Lax</code> or <code>Strict</code> tells the browser not to send the cookie on cross-site requests, neutralizing most CSRF.</li>
                <li><strong>CORS is not a defense:</strong> CORS governs whether script can <em>read</em> a cross-origin <em>response</em>; the forged request is still <em>sent</em> and the side effect still happens. A permissive CORS policy can, however, make other attacks worse.</li>
            </ul>
            <p>APIs that authenticate via a <strong>bearer token in the Authorization header</strong> (not cookies) are generally not CSRF-vulnerable, because the browser does not attach that header automatically — the attacker's page cannot add it.</p>`,
            explanation: 'CSRF is like someone mailing a withdrawal slip to your bank using your pre-stamped, pre-addressed envelope (your cookie) — the bank honors it because the envelope is yours. An antiforgery token is a secret codeword the bank also requires, which the forger has no way to know. SameSite is the bank refusing any envelope that did not originate from your own desk.',
            code: `// Cookie-based app: enable antiforgery + SameSite
builder.Services.AddAntiforgery(o => o.HeaderName = "X-CSRF-TOKEN");
// MVC/Razor form: [ValidateAntiForgeryToken] + @Html.AntiForgeryToken()

builder.Services.ConfigureApplicationCookie(o =>
{
    o.Cookie.SameSite = SameSiteMode.Strict;   // not sent on cross-site requests
    o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    o.Cookie.HttpOnly = true;
});

// Token-based API (JWT in header) - browser won't auto-attach it -> not CSRF-prone
// Authorization: Bearer eyJhbGci...`,
            language: 'csharp',
            bestPractices: ['Use antiforgery tokens for cookie-authenticated state-changing requests', 'Set session cookies SameSite=Lax/Strict, Secure, HttpOnly', 'Prefer bearer-token auth in headers for SPAs/APIs', 'Require POST/PUT/DELETE (never GET) for state changes so links cannot trigger them'],
            commonMistakes: ['Believing CORS prevents CSRF (it does not — the request is still sent)', 'Using GET requests for state-changing operations', 'Disabling antiforgery globally to make a form "just work"', 'Storing JWTs in cookies without then adding CSRF protection'],
            interviewTip: 'The killer distinction: CSRF abuses automatic credential attachment (cookies), so header-based bearer tokens sidestep it. Explicitly correct the common myth that CORS stops CSRF — it controls response reading, not request sending.',
            followUp: ['Why does storing a JWT in a cookie reintroduce CSRF risk?', 'How does SameSite=Lax differ from Strict in practice?', 'What is the double-submit cookie pattern?'],
            seniorPerspective: 'My first question on any CSRF discussion is "how does this endpoint authenticate?" Cookie-based flows need antiforgery tokens plus SameSite; header-bearer-token flows mostly do not, but teams that move a JWT into a cookie "for convenience" silently reopen the hole, so I flag that pattern in review.',
            architectPerspective: 'I standardize the auth model per channel so CSRF posture is predictable: browser-facing apps use cookies with SameSite=Strict and antiforgery middleware enabled by default, while service and SPA APIs use bearer tokens. Mixing the two on the same endpoint is where CSRF bugs hide, so the architecture forbids it.'
        },
        {
            question: 'What is SSRF, why is it especially dangerous in cloud environments, and how do you prevent it?',
            difficulty: 'advanced',
            answer: `<p><strong>SSRF (Server-Side Request Forgery, OWASP A10)</strong> occurs when an application fetches a URL supplied or influenced by the user, letting an attacker make the <em>server</em> issue requests on their behalf. Because the request originates from inside the trust boundary, it bypasses external firewalls.</p>
            <p>In the cloud it is acute because the server can reach the <strong>instance metadata service</strong> (e.g., 169.254.169.254) to steal IAM credentials, plus internal-only services, databases, and admin panels not exposed to the internet — enabling credential theft and lateral movement.</p>
            <p>Defenses (layered): validate and <strong>allowlist destinations</strong> (scheme + host), resolve the hostname and block private/link-local/loopback ranges, <strong>re-validate after DNS resolution</strong> to defeat DNS-rebinding, disable automatic redirect following, enforce <strong>egress firewall rules</strong>, and require IMDSv2 (token-bound metadata) to blunt credential theft.</p>`,
            explanation: 'SSRF is like handing a trusted office courier an address and having them fetch a package — except the attacker writes "go to the CEO\'s private safe and bring back what is inside." The courier (your server) has internal access the attacker never could, so the danger is the courier\'s privileges, not the attacker\'s.',
            code: `// VULNERABLE: server fetches whatever the user provides
var data = await _http.GetStringAsync(userSuppliedUrl);   // attacker -> http://169.254.169.254/...

// SAFER: allowlist + resolve-and-validate + no redirects
static async Task<bool> IsAllowedAsync(Uri uri)
{
    if (uri.Scheme != Uri.UriSchemeHttps) return false;
    if (!AllowedHosts.Contains(uri.Host)) return false;          // explicit allowlist
    var ips = await Dns.GetHostAddressesAsync(uri.Host);
    foreach (var ip in ips)
        if (IsPrivateOrLinkLocal(ip)) return false;              // block 10/8,172.16/12,192.168/16,169.254/16,127/8
    return true;
}
// HttpClient configured with AllowAutoRedirect = false; enforce egress rules at the network layer.`,
            language: 'csharp',
            bestPractices: ['Allowlist destination scheme and host instead of blocklisting', 'Resolve DNS and reject private/loopback/link-local addresses; re-check after resolution', 'Disable automatic redirect following on the HTTP client', 'Use IMDSv2 and tight egress firewall/network policies as backstops'],
            commonMistakes: ['Blocklisting "localhost"/"127.0.0.1" while missing 169.254.169.254, IPv6 ::1, or decimal/octal IP encodings', 'Validating the URL string but not the resolved IP (DNS rebinding)', 'Following redirects that bounce an allowlisted host to an internal target', 'Forgetting that the metadata endpoint exposes cloud IAM credentials'],
            interviewTip: 'Tie SSRF directly to cloud metadata credential theft — that is the modern high-impact scenario interviewers want. Then show you know that string validation is insufficient and you must validate the resolved IP and disable redirects (DNS rebinding awareness).',
            followUp: ['How does DNS rebinding defeat naive SSRF filters?', 'How does IMDSv2 mitigate metadata credential theft?', 'How would you sandbox a feature that must fetch arbitrary user URLs (e.g., link previews)?'],
            seniorPerspective: 'The trap with SSRF is that almost every naive fix is bypassable — blocklists miss alternate IP encodings and IPv6, and string checks miss DNS rebinding. I push for an allowlist of egress destinations enforced at the network layer, because that holds even when the application-level check has a gap.',
            architectPerspective: 'I treat any outbound fetch of user-influenced URLs as a privileged operation and isolate it: route it through a dedicated egress proxy with a strict destination allowlist, run it in a network segment that cannot reach the metadata service or internal admin planes, and mandate IMDSv2. That way an SSRF bug in code degrades to "fetched an external URL" rather than "stole our cloud credentials and pivoted internally."'
        },
        {
            question: 'What are the most dangerous CORS misconfigurations, and how do you configure CORS correctly?',
            difficulty: 'hard',
            answer: `<p><strong>CORS (Cross-Origin Resource Sharing)</strong> relaxes the browser\u2019s same-origin policy to let approved origins read responses from your API. The danger is that misconfiguration can hand attacker-controlled origins authenticated access to user data.</p>
            <p>The most dangerous mistakes:</p>
            <ul>
                <li><strong>Reflecting the Origin header + <code>Allow-Credentials: true</code>:</strong> echoing back whatever Origin the request carried while allowing credentials effectively trusts <em>every</em> site, so any malicious page can make authenticated cross-origin calls and read the response.</li>
                <li><strong><code>AllowAnyOrigin()</code> with credentials:</strong> the wildcard <code>*</code> is invalid with credentials, so frameworks that "fix" it by reflecting the origin recreate the problem above.</li>
                <li><strong>Over-broad allowlists:</strong> trusting <code>*.example.com</code> when subdomains can be taken over, or leaving in <code>localhost</code>/staging origins in production.</li>
            </ul>
            <p>Configure it correctly by allowlisting a small set of <em>exact</em> trusted origins, only enabling <code>AllowCredentials</code> when genuinely needed (and never with a wildcard or reflected origin), and restricting methods/headers. Remember CORS is a <em>browser</em> control, not server-side authorization \u2014 it does not protect non-browser clients, so your API must still authenticate and authorize every request.</p>`,
            explanation: 'CORS is the guest list a browser checks before letting a script read your API\u2019s reply. Reflecting the Origin header is like a bouncer who writes down whatever name each arriving guest claims and then waves them in \u2014 the list becomes meaningless and everyone gets in.',
            code: `// DANGEROUS: reflects any origin AND allows credentials -> trusts everyone
builder.Services.AddCors(o => o.AddPolicy("bad", p =>
    p.SetIsOriginAllowed(_ => true)   // reflects Origin header
     .AllowAnyHeader().AllowAnyMethod()
     .AllowCredentials()));           // + credentials = full cross-site exposure

// CORRECT: exact allowlist, scoped methods/headers, credentials only if required
builder.Services.AddCors(o => o.AddPolicy("Production", p =>
    p.WithOrigins("https://app.example.com", "https://admin.example.com")
     .WithMethods("GET", "POST", "PUT", "DELETE")
     .WithHeaders("Authorization", "Content-Type")
     .AllowCredentials()
     .SetPreflightMaxAge(TimeSpan.FromHours(1))));
// NEVER combine AllowAnyOrigin()/reflected origin with AllowCredentials().`,
            language: 'csharp',
            bestPractices: ['Allowlist exact origins; never reflect the Origin header with credentials', 'Enable AllowCredentials only when needed, never with a wildcard', 'Scope allowed methods and headers to the minimum required', 'Keep production allowlists free of localhost/staging origins'],
            commonMistakes: ['Reflecting Origin + AllowCredentials (trusts every site)', 'Treating CORS as authorization (it only governs browser reads)', 'Wildcard subdomain trust vulnerable to subdomain takeover', 'Leaving permissive dev CORS settings in production'],
            interviewTip: 'The killer insight: CORS is a browser-enforced read control, not server-side security \u2014 reflecting the origin with credentials is the canonical critical misconfiguration interviewers look for.',
            followUp: ['Why is wildcard * invalid together with credentials?', 'Does CORS protect a non-browser API client at all?', 'How does a preflight (OPTIONS) request work?'],
            seniorPerspective: 'The CORS bug I flag most in review is the "make it work" reflected-origin fix: a developer hits a CORS error, sets the policy to allow any origin, then needs credentials so the framework reflects the request origin \u2014 and now every website on the internet can make authenticated calls as the logged-in user. I also remind teams that CORS protects nothing for curl, mobile, or server-to-server callers, so it is never a substitute for real authorization on the endpoint.',
            architectPerspective: 'I centralize CORS policy at the API gateway with an explicit, version-controlled allowlist rather than letting each service hand-roll its own, because divergent per-service CORS settings are where the permissive mistakes hide. Architecturally CORS is a browser convenience layer on top of \u2014 never a replacement for \u2014 token-based authentication and policy-based authorization that apply uniformly to all client types.'
        },
        {
            question: 'What is OWASP Top 10? Name the top 5 most critical vulnerabilities and how to prevent each.',
            difficulty: 'medium',
            answer: `<p>The <strong>OWASP Top 10</strong> is a periodically-updated awareness document that ranks the most critical web application security risks based on incidence data from hundreds of organizations. The 2021 edition's top 5:</p>
<ol>
<li><strong>A01 Broken Access Control</strong>: Users can act outside intended permissions (IDOR, privilege escalation). <em>Prevent</em>: deny by default, enforce authorization on every endpoint, server-side access checks.</li>
<li><strong>A02 Cryptographic Failures</strong>: Sensitive data exposure through weak encryption, plaintext storage, HTTP. <em>Prevent</em>: encrypt at rest and in transit, use strong algorithms (AES-256, bcrypt), HTTPS everywhere.</li>
<li><strong>A03 Injection</strong>: Untrusted data sent as part of a command/query (SQL, OS, LDAP). <em>Prevent</em>: parameterized queries, ORMs, input validation, least-privilege DB accounts.</li>
<li><strong>A04 Insecure Design</strong>: Missing security controls at the design level (no rate limiting, no abuse cases). <em>Prevent</em>: threat modeling, secure design patterns, abuse-case analysis during design phase.</li>
<li><strong>A05 Security Misconfiguration</strong>: Default credentials, verbose errors, unnecessary features enabled. <em>Prevent</em>: hardened defaults, automated config scanning, least privilege, minimal attack surface.</li>
</ol>`,
            interviewTip: 'Don\'t just memorize the list \u2014 explain how each maps to a real attack scenario and a concrete prevention technique in your stack. Mention that A04 (Insecure Design) is new in 2021 and represents a shift toward security by design, not just by implementation.',
            followUp: ['How does A04 Insecure Design differ from A05 Security Misconfiguration?', 'Which OWASP Top 10 items are most relevant for APIs vs traditional web apps?', 'How do you integrate OWASP awareness into a development team workflow?'],
            seniorPerspective: 'I use the OWASP Top 10 as a checklist during code reviews and threat modeling, not as a one-time training. Each quarter I audit our codebase against the current list, focusing on access control (A01) since it is the hardest to get right consistently across all endpoints.',
            architectPerspective: 'The OWASP Top 10 informs my security architecture decisions: A01 drives policy-based authorization at the gateway, A03 drives ORM/parameterization standards, A04 drives mandatory threat modeling in design reviews, and A05 drives infrastructure-as-code with security scanning in CI. It is the baseline, not the ceiling.'
        },
        {
            question: 'How do you prevent SQL injection in a .NET application? Show parameterized queries vs ORM approaches.',
            difficulty: 'hard',
            answer: `<p>SQL injection is prevented by ensuring user input is <strong>never interpreted as SQL code</strong>. The two primary approaches in .NET:</p>
<ul>
<li><strong>Parameterized queries (Dapper/ADO.NET)</strong>: Pass values as parameters \u2014 the database engine treats them as literal data, not executable SQL. The protocol separates the query plan from the data.</li>
<li><strong>ORM (Entity Framework Core)</strong>: LINQ queries are compiled to parameterized SQL automatically. The LINQ expression tree is translated at compile-time, so user input flows only into parameter slots.</li>
</ul>
<p>Edge cases where injection can still occur: <code>FromSqlRaw</code> with string interpolation, dynamic ORDER BY clauses, and table/column names which cannot be parameterized \u2014 these require strict whitelisting.</p>`,
            interviewTip: 'Show the vulnerable code, the attack payload, and the fix side by side. Explain that parameterization works at the protocol level \u2014 the database receives the query structure and data separately, so the data can never alter the query structure.',
            followUp: ['Can EF Core still be vulnerable to SQL injection? When?', 'How do you safely handle dynamic ORDER BY or table names?', 'What is second-order SQL injection?'],
            seniorPerspective: 'In practice, EF Core eliminates 99% of SQL injection risk. The danger spots are FromSqlRaw/FromSqlInterpolated with user-controlled fragments and stored procedures with internal dynamic SQL. I flag these in code review with a Roslyn analyzer that detects string concatenation in SQL-executing methods.',
            architectPerspective: 'SQL injection is architecturally solved by standardizing on parameterized data access patterns and enforcing them via static analysis in CI. The remaining risk surface is dynamic query construction \u2014 for which I mandate whitelist validation and encapsulate it in a single query-builder utility that the team audits rather than scattering raw SQL across services.'
        },
        {
            question: 'Explain Cross-Site Scripting (XSS). What are the three types and how does each work?',
            difficulty: 'medium',
            answer: `<p><strong>XSS</strong> allows an attacker to inject malicious scripts into web pages viewed by other users. The three types differ in where the payload is stored and how it reaches the browser:</p>
<ul>
<li><strong>Stored (Persistent) XSS</strong>: The malicious script is stored server-side (database, comment, profile). Every user who views the page executes it. Most dangerous \u2014 wide blast radius.</li>
<li><strong>Reflected XSS</strong>: The payload is part of the request (URL parameter, form field) and reflected immediately in the response. Requires tricking a victim into clicking a crafted link.</li>
<li><strong>DOM-based XSS</strong>: Entirely client-side \u2014 JavaScript reads from an attacker-controlled source (location.hash, postMessage) and writes to a dangerous sink (innerHTML, eval). The server never sees the payload.</li>
</ul>
<p>Defense: context-aware output encoding (HTML, attribute, JS, URL contexts), framework auto-escaping, strict Content-Security-Policy headers, avoiding dangerous sinks (innerHTML, eval, Html.Raw), and HttpOnly cookies to limit damage.</p>`,
            interviewTip: 'Name all three types and map a specific defense to each. Stored/Reflected are server-output problems (output encoding). DOM-based is a client-code problem (safe sinks like textContent). CSP is the backstop for all three. Mentioning DOM-based specifically shows depth.',
            followUp: ['Why is input validation alone insufficient to prevent XSS?', 'How does Content-Security-Policy with nonces prevent inline script execution?', 'Where can React still be vulnerable to XSS?'],
            seniorPerspective: 'I treat XSS as an output-encoding problem, not an input problem \u2014 the same data may be safe in one context (JSON API) and dangerous in another (HTML page). For any feature that must render user HTML, I use a whitelist-based sanitizer library rather than hand-rolled regex filters.',
            architectPerspective: 'I make XSS prevention systemic: strict CSP with nonces at the edge, Trusted Types policy to lock down DOM sinks, HttpOnly/SameSite cookies so injection cannot trivially exfiltrate sessions, and CSP violation reporting so we detect injection attempts in production before they become breaches.'
        },
        {
            question: 'What is CSRF and how does the anti-forgery token pattern work in ASP.NET Core?',
            difficulty: 'hard',
            answer: `<p><strong>CSRF (Cross-Site Request Forgery)</strong> tricks a user's browser into making an unwanted authenticated request to a site where they are already logged in. It exploits the browser's automatic cookie attachment.</p>
<p>The <strong>anti-forgery token pattern</strong> in ASP.NET Core works by:</p>
<ol>
<li>Server generates a cryptographically random token pair: one stored in a cookie, one embedded in the form/header.</li>
<li>On submission, the server validates that both tokens are present and correlate \u2014 an attacker on a different origin cannot read the cookie or the page to extract the token.</li>
<li>In ASP.NET Core: <code>builder.Services.AddAntiforgery()</code>, <code>@Html.AntiForgeryToken()</code> in forms, and <code>[ValidateAntiForgeryToken]</code> on the action.</li>
</ol>
<p>APIs using <strong>bearer tokens in the Authorization header</strong> are generally immune because the browser does not automatically attach headers \u2014 only cookies. However, if you store a JWT in a cookie, you reintroduce CSRF risk and must add anti-forgery protection.</p>`,
            interviewTip: 'Explain WHY it works: the attacker can trigger a cross-origin request with cookies, but cannot read the anti-forgery token value from the response because of same-origin policy. The token proves the request originated from your own page, not a malicious third-party site.',
            followUp: ['What is the double-submit cookie pattern and how does it differ?', 'Why are APIs with bearer tokens not vulnerable to CSRF?', 'How does SameSite cookie attribute mitigate CSRF?'],
            seniorPerspective: 'The common mistake I see is developers disabling anti-forgery to make AJAX work rather than correctly sending the token in a header. I standardize on a pattern where the anti-forgery cookie is read by JavaScript and sent as an X-CSRF-TOKEN header for AJAX requests.',
            architectPerspective: 'I standardize the auth model by channel: browser flows use cookies with SameSite=Strict and anti-forgery middleware enabled globally, while SPA/API flows use bearer tokens. Mixing these on the same endpoint is where CSRF vulnerabilities hide, so the architecture explicitly separates them.'
        },
        {
            question: 'How do you implement Content Security Policy (CSP) headers? What attacks does it prevent?',
            difficulty: 'advanced',
            answer: `<p><strong>Content Security Policy (CSP)</strong> is an HTTP response header that instructs the browser which sources of content (scripts, styles, images, etc.) are permitted to load. It is the strongest defense-in-depth layer against XSS.</p>
<p>Implementation approaches:</p>
<ul>
<li><strong>Nonce-based</strong>: Server generates a unique nonce per response; only scripts with that nonce execute. Best for dynamic apps.</li>
<li><strong>Hash-based</strong>: Specify SHA hashes of allowed inline scripts. Best for static, known scripts.</li>
<li><strong>Allowlist-based</strong>: Specify allowed source domains. Weaker \u2014 subject to CDN bypasses.</li>
</ul>
<p>CSP prevents: XSS (blocks unauthorized scripts), clickjacking (frame-ancestors), data exfiltration (connect-src limits outbound calls), mixed content, and unwanted third-party loading.</p>
<p>Key directives: <code>default-src 'self'</code>, <code>script-src 'self' 'nonce-{random}'</code>, <code>style-src 'self'</code>, <code>img-src 'self' data:</code>, <code>frame-ancestors 'none'</code>, <code>base-uri 'self'</code>, <code>form-action 'self'</code>.</p>`,
            interviewTip: 'Explain that CSP is a defense-in-depth backstop: even if an XSS payload gets injected, CSP prevents it from executing. Lead with nonce-based CSP as the modern best practice, and mention report-uri/report-to for monitoring violations without breaking the site.',
            followUp: ['How does CSP report-only mode help during rollout?', 'What is a CSP nonce and how do you generate one per request?', 'What attacks can CSP NOT prevent?'],
            seniorPerspective: 'I roll out CSP in report-only mode first, monitor violations for a week to identify legitimate scripts that need nonces or hashes, then enforce. The biggest challenge is third-party scripts (analytics, ads) that inject inline code \u2014 each needs explicit nonce or hash allowance.',
            architectPerspective: 'CSP is the security header I prioritize most because it provides a hard boundary against XSS exploitation even when application code has bugs. I implement it at the reverse proxy/CDN level with per-request nonce injection, and pipe CSP violation reports into our SIEM so we detect injection attempts in real-time across the entire estate.'
        },
        {
            question: 'Design a security review process for a web application. What would you check and in what order?',
            difficulty: 'expert',
            answer: `<p>A comprehensive security review is layered, moving from architecture down to implementation:</p>
<ol>
<li><strong>Threat Modeling (Design Level)</strong>: Identify assets, trust boundaries, entry points, and potential threats using STRIDE. Prioritize by risk (likelihood \u00d7 impact).</li>
<li><strong>Authentication & Authorization</strong>: Verify auth flows, token handling, session management, privilege escalation paths, RBAC/ABAC enforcement on every endpoint.</li>
<li><strong>Input Handling & Injection</strong>: Check all user inputs for parameterization, validation, encoding. Review SQL, command, template, and header injection surfaces.</li>
<li><strong>Data Protection</strong>: Encryption at rest and in transit, secret management, PII handling, data retention, and backup security.</li>
<li><strong>Configuration & Infrastructure</strong>: Security headers, CORS, TLS config, default credentials, verbose errors, unnecessary ports/services.</li>
<li><strong>Dependencies & Supply Chain</strong>: CVE scanning, SBOM, dependency pinning, artifact signing.</li>
<li><strong>Logging, Monitoring & Incident Response</strong>: Audit trails, alerting on suspicious patterns, breach detection capability.</li>
<li><strong>Automated Tooling</strong>: SAST in CI, DAST in staging, dependency scanning, infrastructure scanning.</li>
</ol>
<p>The order matters: architecture-level flaws (missing auth, insecure design) are costlier to fix than code-level issues, so catch them first.</p>`,
            interviewTip: 'Show a systematic methodology, not a random checklist. Start with threat modeling (why), then work through layers (auth \u2192 input \u2192 data \u2192 config \u2192 dependencies \u2192 monitoring). Mention specific tools for each layer to demonstrate hands-on experience.',
            followUp: ['How do you integrate security reviews into an agile sprint cycle?', 'What is the difference between SAST, DAST, and IAST?', 'How do you prioritize findings when the list is long?'],
            seniorPerspective: 'I run security reviews as a structured process with a repeatable checklist per layer. The most impactful findings are almost always in auth/access control \u2014 a missing [Authorize] attribute or an IDOR is more exploitable than most code-level bugs. I prioritize review time accordingly.',
            architectPerspective: 'Security review is continuous, not a gate. I embed automated checks at every stage: threat models in design reviews, SAST/dependency scanning in CI, DAST in staging, runtime protection (WAF, RASP) in production, and periodic manual pen-testing for logic flaws automation misses. The process should catch 80% automatically and focus human review on the 20% that requires contextual reasoning.'
        }
    ],
    sections_mermaid: [
        {
            title: 'OWASP Top 10 Risk Categories',
            content: `<p>Visual overview of the OWASP Top 10 (2021) risk categories and their relationships.</p>`,
            diagram: `graph TD
    OWASP[OWASP Top 10 - 2021]
    OWASP --> A01[A01: Broken Access Control]
    OWASP --> A02[A02: Cryptographic Failures]
    OWASP --> A03[A03: Injection]
    OWASP --> A04[A04: Insecure Design]
    OWASP --> A05[A05: Security Misconfiguration]
    OWASP --> A06[A06: Vulnerable Components]
    OWASP --> A07[A07: Auth Failures]
    OWASP --> A08[A08: Data Integrity Failures]
    OWASP --> A09[A09: Logging Gaps]
    OWASP --> A10[A10: SSRF]

    A01 -->|Prevent| AC[Deny by default + RBAC]
    A03 -->|Prevent| PAR[Parameterized queries]
    A05 -->|Prevent| HARD[Hardened configs + scanning]
    A10 -->|Prevent| ALLOW[URL allowlists + egress rules]

    style A01 fill:#ff6b6b
    style A02 fill:#ff8c42
    style A03 fill:#ffd93d`,
            diagramType: 'mermaid'
        },
        {
            title: 'Security Testing Pipeline',
            content: `<p>A layered security testing approach integrated into the CI/CD pipeline.</p>`,
            diagram: `graph LR
    DEV[Developer] -->|Commit| SAST[SAST Scan]
    SAST -->|Pass| DEP[Dependency Scan]
    DEP -->|Pass| BUILD[Build + Unit Tests]
    BUILD -->|Pass| DAST[DAST Scan - Staging]
    DAST -->|Pass| PEN[Periodic Pen Test]
    PEN -->|Pass| PROD[Production]
    PROD -->|Monitor| WAF[WAF + RASP]
    WAF -->|Alerts| SIEM[SIEM / Incident Response]

    SAST -.->|Fail| DEV
    DEP -.->|CVE Found| DEV
    DAST -.->|Vuln Found| DEV

    style SAST fill:#4ecdc4
    style DEP fill:#45b7d1
    style DAST fill:#96ceb4
    style WAF fill:#ffeaa7`,
            diagramType: 'mermaid'
        }
    ]
});