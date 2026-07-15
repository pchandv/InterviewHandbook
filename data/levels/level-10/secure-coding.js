/* ═══════════════════════════════════════════════════════════════════
   SECURE CODING PRACTICES — Level 10: Security (Advanced Security)
   Input validation, output encoding, parameterized queries, least
   privilege, secrets handling, and defense in depth.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('secure-coding', {

    title: 'Secure Coding Practices',
    level: 10,
    group: 'security-advanced',
    description: 'Writing secure code: input validation, output encoding, parameterized queries, least privilege, safe secrets handling, dependency hygiene, and defense in depth.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['security-owasp'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Secure coding</strong> is the practice of writing software that resists attack by default.
            Most vulnerabilities are not exotic — they stem from a handful of recurring mistakes: trusting input,
            failing to encode output, building queries by concatenation, over-privileging code, and mishandling
            secrets.</p>
            <p>Security is not a feature you add at the end; it is a property of how you write every line. This module
            covers the practices that prevent the majority of real-world breaches.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>Input validation and the "never trust input" principle</li>
                <li>Output encoding to prevent injection (XSS, SQLi)</li>
                <li>Parameterized queries and safe data access</li>
                <li>Least privilege and secure defaults</li>
                <li>Secrets management done right</li>
                <li>Defense in depth and dependency hygiene</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Never Trust Input</h4>
            <p>All external input — request bodies, query strings, headers, files, third-party APIs — is untrusted.
            Validate it against an allowlist of what is acceptable, and reject the rest.</p>
            <h4>Validation vs Encoding</h4>
            <p><strong>Validate</strong> on input (is this a valid email/age?). <strong>Encode</strong> on output
            (escape for the destination: HTML, SQL, shell, URL). Injection happens when data is interpreted as code
            in some context; encoding for that context neutralizes it.</p>
            <h4>Least Privilege</h4>
            <p>Code, accounts, and tokens should have the minimum permissions needed. A compromised component with
            limited rights causes limited damage.</p>
            <h4>Secure Defaults</h4>
            <p>Systems should be safe out of the box: deny by default, fail closed, encryption on, verbose errors off
            in production.</p>
            <h4>Defense in Depth</h4>
            <p>Layer controls so no single failure is catastrophic: validate input AND parameterize queries AND limit
            DB permissions AND monitor.</p>
            <h4>Fail Securely</h4>
            <p>On error, default to the secure state (deny access, hide details). Never leak stack traces or secrets
            in error responses.</p>`,
            mermaid: `graph TB
    Input[Untrusted input] --> V{Validate allowlist}
    V -->|reject| Deny[Reject / 400]
    V -->|accept| Logic[Business logic]
    Logic --> Q[Parameterized query]
    Logic --> Out{Encode for context}
    Out --> HTML[HTML-encode → browser]
    Out --> SQL[Parameterize → DB]
    Q --> DB[(Least-privilege DB account)]`
        },
        {
            title: 'How It Works',
            content: `<p>Secure code applies controls at each boundary where data crosses trust levels:</p>
            <ol>
                <li><strong>At input:</strong> validate type, length, format, range against an allowlist; reject or
                sanitize</li>
                <li><strong>In logic:</strong> enforce authorization on every operation; apply least privilege</li>
                <li><strong>At data access:</strong> use parameterized queries / ORMs; never concatenate SQL</li>
                <li><strong>At output:</strong> context-encode (HTML, attribute, JS, URL) to prevent injection like XSS</li>
                <li><strong>On error:</strong> fail closed, log securely (no secrets), return generic messages</li>
            </ol>`,
            code: `// Defense in depth on a single endpoint
[HttpPost("transfer")]
public async Task<IActionResult> Transfer([FromBody] TransferRequest req)
{
    // 1. Validate input (allowlist + range)
    if (req.Amount <= 0 || req.Amount > 1_000_000) return BadRequest();
    if (!IsValidAccount(req.ToAccount)) return BadRequest();

    // 2. Authorize: does THIS user own the source account?
    if (!await _authz.OwnsAccountAsync(User, req.FromAccount))
        return Forbid();                       // fail closed

    // 3. Parameterized data access (no string concat)
    await _repo.TransferAsync(req.FromAccount, req.ToAccount, req.Amount);

    // 4. Generic response; detailed context only in secure server logs
    return Ok(new { status = "completed" });
}`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Trust boundaries and where controls apply:</p>`,
            mermaid: `flowchart LR
    User[User / Internet<br/>UNTRUSTED] -->|validate + authn| API[API Layer]
    API -->|authorize + parameterize| Svc[Service Layer]
    Svc -->|least privilege| DB[(Database)]
    Svc -->|encode output| User
    API -.->|secrets from vault| Vault[(Secret Store)]
    style User fill:#fee2e2,color:#1e293b
    style Vault fill:#d1fae5,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Concrete secure-coding patterns:</p>`,
            tabs: [
                {
                    label: 'Validation + Encoding',
                    code: `// Input validation with an allowlist
public record CreateUserRequest(
    [Required, EmailAddress] string Email,
    [Required, StringLength(50, MinimumLength = 2)] string Name,
    [Range(13, 120)] int Age);

// Output encoding to prevent XSS (Razor auto-encodes; be explicit elsewhere)
var safe = System.Net.WebUtility.HtmlEncode(userProvidedName);
// In Razor, @Model.Name is HTML-encoded automatically.
// DANGER: @Html.Raw(userInput) bypasses encoding -> XSS. Avoid with untrusted data.`,
                    language: 'csharp'
                },
                {
                    label: 'Parameterized + Authz',
                    code: `// SQL: parameterized (safe) vs concatenated (vulnerable)
// VULNERABLE - SQL injection
var sql = "SELECT * FROM Users WHERE Email = '" + email + "'";   // NEVER

// SAFE - parameterized
const string query = "SELECT * FROM Users WHERE Email = @email";
var user = await conn.QueryFirstOrDefaultAsync<User>(query, new { email });

// Authorization on the resource, not just authentication
public async Task<IActionResult> GetDocument(int id)
{
    var doc = await _repo.GetAsync(id);
    if (doc is null) return NotFound();
    // IDOR protection: confirm the caller may access THIS document
    if (doc.OwnerId != _currentUser.Id && !_currentUser.IsAdmin)
        return Forbid();
    return Ok(doc);
}`,
                    language: 'csharp'
                },
                {
                    label: 'Secrets & Hashing',
                    code: `// Secrets: from a vault / config provider, never hardcoded
var connString = builder.Configuration.GetConnectionString("Db");
// backed by Azure Key Vault / AWS Secrets Manager / env vars, not source.

// Password hashing: use a slow, salted algorithm (never plain/MD5/SHA1)
// ASP.NET Core Identity uses PBKDF2 by default; or use BCrypt/Argon2.
var hash = new PasswordHasher<User>().HashPassword(user, password);
var result = new PasswordHasher<User>()
    .VerifyHashedPassword(user, user.PasswordHash, attempt);
if (result == PasswordVerificationResult.Failed) return Unauthorized();`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Validate Input with Allowlists</h4>
            <p>Define what is valid and reject everything else. Allowlists are far safer than denylists, which always
            miss something.</p>
            <h4>Do: Parameterize All Queries</h4>
            <p>Use parameters or ORMs for every database call. Never build SQL (or shell commands, or paths) by
            concatenating user input.</p>
            <h4>Do: Encode Output for Its Context</h4>
            <p>HTML-encode for HTML, attribute-encode for attributes, etc. Rely on framework auto-encoding and avoid
            raw-HTML escape hatches with untrusted data.</p>
            <h4>Do: Apply Least Privilege</h4>
            <p>Run with minimal DB permissions, scoped tokens, and narrow service accounts so a breach is contained.</p>
            <h4>Do: Manage Secrets Properly</h4>
            <p>Store secrets in a vault, inject via config, rotate regularly, and never commit them. Hash passwords
            with a slow salted algorithm (PBKDF2/BCrypt/Argon2).</p>`,
            callout: {
                type: 'tip',
                title: 'Validate Input, Encode Output',
                text: 'These two rules prevent most injection attacks. Validate input where it enters (is it a valid value?) and encode output where it leaves into another context (HTML, SQL, shell). Injection occurs when data is interpreted as code; context-appropriate encoding neutralizes it.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: String-Concatenated Queries</h4>
            <p>The classic SQL injection vector. Always parameterize. The same applies to shell commands (command
            injection) and file paths (path traversal).</p>
            <h4>Mistake: Trusting Client-Side Validation</h4>
            <p>JavaScript validation improves UX but is trivially bypassed. Always re-validate on the server — it is
            the only trust boundary that matters.</p>
            <h4>Mistake: Insecure Direct Object References (IDOR)</h4>
            <p>Returning a record by ID without checking the caller owns it lets users access others' data. Authorize
            the resource, not just the route.</p>
            <h4>Mistake: Leaking Secrets/Errors</h4>
            <p>Verbose error pages, stack traces, and secrets in logs or responses hand attackers a map. Fail with
            generic messages; log details securely.</p>
            <h4>Mistake: Rolling Your Own Crypto</h4>
            <p>Custom encryption/hashing is almost always broken. Use vetted libraries and standard algorithms.</p>
            <h4>Mistake: Storing Passwords Reversibly</h4>
            <p>Plaintext, encryption, or fast hashes (MD5/SHA1) for passwords are all wrong. Use a slow, salted
            password hash.</p>`,
            code: `// IDOR: missing ownership check
[HttpGet("invoices/{id}")]
public IActionResult Get(int id) => Ok(_repo.Get(id));   // ANY user can read ANY invoice!

// FIXED: authorize the resource
[HttpGet("invoices/{id}")]
public async Task<IActionResult> Get(int id)
{
    var inv = await _repo.GetAsync(id);
    if (inv is null) return NotFound();
    if (inv.OwnerId != _user.Id && !_user.IsAdmin) return Forbid();
    return Ok(inv);
}`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Web Applications</h4>
            <p>Every form, API, and query is an attack surface. Validation + parameterization + output encoding +
            authorization checks are daily, mandatory practices.</p>
            <h4>Financial &amp; Healthcare Systems</h4>
            <p>Regulated domains (PCI-DSS, HIPAA) require demonstrable secure coding: encryption, least privilege,
            audit logging, and secrets management.</p>
            <h4>Supply Chain Security</h4>
            <p>Dependency vulnerabilities (Log4Shell, event-stream) showed that your code is only as secure as its
            packages. Pin versions, scan dependencies, and watch for typosquatting.</p>
            <h4>Cloud &amp; DevOps</h4>
            <p>Secrets in vaults (not env files committed to git), least-privilege IAM roles, and secure defaults in
            infrastructure code prevent the most common cloud breaches.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Secure vs insecure approaches to common tasks:</p>`,
            table: {
                headers: ['Task', 'Insecure', 'Secure'],
                rows: [
                    ['DB query', 'String concatenation', 'Parameterized query / ORM'],
                    ['Input handling', 'Trust / denylist', 'Validate against allowlist'],
                    ['Output to HTML', 'Raw interpolation', 'Context-appropriate encoding'],
                    ['Passwords', 'Plaintext / MD5 / SHA1', 'PBKDF2 / BCrypt / Argon2 (salted)'],
                    ['Secrets', 'Hardcoded / in git', 'Vault + config injection + rotation'],
                    ['Authorization', 'Check authn only', 'Authorize each resource (no IDOR)'],
                    ['Errors', 'Verbose stack traces', 'Generic message + secure logging'],
                    ['Validation location', 'Client only', 'Server (plus client for UX)']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Security controls have modest cost — and that cost is almost always worth paying:</p>
            <h4>Validation &amp; Encoding</h4>
            <p>Negligible overhead relative to I/O. Never skip them for "performance."</p>
            <h4>Password Hashing Is Intentionally Slow</h4>
            <p>PBKDF2/BCrypt/Argon2 are deliberately expensive to resist brute force. Tune the work factor so login
            takes ~100-250ms — slow enough to deter attackers, fast enough for users.</p>
            <h4>TLS Overhead</h4>
            <p>Modern TLS adds little; connection reuse (keep-alive, HTTP/2) amortizes the handshake. Always use it.</p>
            <h4>Rate Limiting Protects Performance</h4>
            <p>Throttling and quotas are a security control that also preserves availability under abuse/DoS.</p>`,
            callout: {
                type: 'warning',
                title: 'Tune Password Hash Work Factor',
                text: 'A password hash that is too fast is brute-forceable; too slow harms UX and enables a DoS on login. Tune the iteration/work factor so a single hash takes roughly 100-250ms on your hardware, and revisit it as hardware improves.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Security must be tested, not assumed.</p>
            <h4>Negative &amp; Abuse Tests</h4>
            <p>Test that malicious input is rejected: injection payloads, oversized input, IDOR attempts
            (accessing another user's resource), and missing-authorization paths.</p>
            <h4>Automated Scanning in CI</h4>
            <p>SAST (static analysis), dependency scanning (Dependabot, Snyk, OWASP Dependency-Check), and secret
            scanning catch issues before merge.</p>
            <h4>Penetration Testing</h4>
            <p>Periodic manual/automated pen tests (and DAST) find what unit tests miss.</p>`,
            code: `// Abuse-case tests: verify the system REJECTS bad input
[Fact]
public async Task GetInvoice_OtherUsersInvoice_ReturnsForbidden()
{
    var client = CreateClientAs(userId: 2);
    var resp = await client.GetAsync("/invoices/100");  // invoice owned by user 1
    Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);   // IDOR blocked
}

[Theory]
[InlineData("' OR '1'='1")]
[InlineData("<script>alert(1)</script>")]
[InlineData("../../etc/passwd")]
public async Task CreateUser_MaliciousInput_IsRejectedOrNeutralized(string payload)
{
    var resp = await _client.PostAsJsonAsync("/users", new { name = payload });
    // Either rejected (400) or stored safely without executing -
    // assert no injection side effect occurred.
    Assert.True(resp.StatusCode == HttpStatusCode.BadRequest || await IsStoredSafely(payload));
}`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Secure coding questions test whether you build safety in by default:</p>
            <ul>
                <li><strong>"Validate input, encode output"</strong> — the one-line principle interviewers want</li>
                <li><strong>Explain parameterized queries</strong> and how they stop SQL injection</li>
                <li><strong>Know IDOR</strong> — authorize the resource, not just authentication</li>
                <li><strong>Password storage</strong> — salted slow hash (BCrypt/Argon2/PBKDF2), never plain/fast hash</li>
                <li><strong>Least privilege and defense in depth</strong> — layered controls, minimal permissions</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Defense in Depth',
                text: 'Strong answers never rely on a single control. For SQL injection: parameterize queries AND validate input AND run the DB account with least privilege AND monitor for anomalies. If one layer fails, the others still protect you.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Resources</h4>
            <ul>
                <li>OWASP Top 10 and OWASP Cheat Sheet Series (cheatsheetseries.owasp.org)</li>
                <li>OWASP ASVS (Application Security Verification Standard)</li>
                <li><em>The Tangled Web</em> by Michal Zalewski</li>
                <li><em>Writing Secure Code</em> by Howard &amp; LeBlanc</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li>SAST: SonarQube, CodeQL, Semgrep</li>
                <li>Dependency scanning: Snyk, Dependabot, OWASP Dependency-Check</li>
                <li>Secret scanning: gitleaks, trufflehog</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Never trust input</strong> — validate against an allowlist on the server</li>
                <li><strong>Validate input, encode output</strong> — neutralizes most injection (XSS, SQLi)</li>
                <li><strong>Parameterize every query;</strong> never concatenate user input into SQL/shell/paths</li>
                <li><strong>Authorize the resource (no IDOR),</strong> not just authentication</li>
                <li><strong>Least privilege + secure defaults + fail closed</strong></li>
                <li><strong>Secrets in vaults; passwords with salted slow hashes</strong> (BCrypt/Argon2/PBKDF2)</li>
                <li><strong>Defense in depth:</strong> layer controls so one failure isn't catastrophic</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Harden a Vulnerable Endpoint</h4>
            <p>Given an endpoint that fetches and returns an order by ID using string-concatenated SQL and no
            authorization, fix every issue:</p>
            <ol>
                <li>Replace concatenated SQL with a parameterized query</li>
                <li>Add server-side input validation (ID range/format)</li>
                <li>Add resource authorization (caller must own the order) to fix the IDOR</li>
                <li>Ensure errors return generic messages (no stack traces/SQL details)</li>
                <li>Confirm the DB account has read-only, least-privilege access</li>
                <li>Write abuse tests: injection payload, other-user IDOR attempt, invalid ID</li>
            </ol>`,
            code: `// Vulnerable starting point - fix all the issues:
[HttpGet("orders/{id}")]
public IActionResult Get(string id)
{
    var sql = "SELECT * FROM Orders WHERE Id = " + id;   // SQLi
    var order = _conn.QueryFirstOrDefault<Order>(sql);    // no authz (IDOR)
    return Ok(order);                                     // leaks any order
}
// TODO: parameterize, validate, authorize resource, generic errors, abuse tests`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What is the difference between validating input and encoding output?<br/>
                    <em>A: Validation checks input is acceptable at the entry point (allowlist of valid values). Encoding
                    escapes data for the context it is sent to (HTML, SQL, shell) so it is treated as data, not code.
                    Both are needed to prevent injection.</em></li>
                <li><strong>Q:</strong> Why is client-side validation insufficient?<br/>
                    <em>A: It is trivially bypassed (disable JS, call the API directly). The server is the only trust
                    boundary, so all security validation must happen server-side; client validation is for UX only.</em></li>
                <li><strong>Q:</strong> What is IDOR and how do you prevent it?<br/>
                    <em>A: Insecure Direct Object Reference \u2014 accessing another user's resource by guessing/altering an ID.
                    Prevent it by authorizing the specific resource (does this caller own/can access this object?), not
                    just checking authentication.</em></li>
                <li><strong>Q:</strong> How should passwords be stored?<br/>
                    <em>A: As salted hashes using a deliberately slow algorithm (PBKDF2, BCrypt, or Argon2). Never
                    plaintext, never reversible encryption, never fast hashes like MD5/SHA1.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'How do you prevent SQL injection, and why does parameterization work?',
            difficulty: 'easy',
            answer: `<p>Prevent SQL injection by using <strong>parameterized queries</strong> (or an ORM that does) — never
            build SQL by concatenating user input. With parameters, the SQL structure is fixed and the input is sent
            separately as data; the database never parses it as part of the command, so it cannot alter the query.</p>
            <p>As defense in depth, also validate input and run the database account with least privilege.</p>`,
            explanation: 'Parameterized queries are like a form with labeled fields: the database treats your input strictly as the value for "email", never as new instructions. Concatenation is like letting the user rewrite the query text itself.',
            code: `// Vulnerable
var sql = "SELECT * FROM Users WHERE Email = '" + email + "'";
// Safe
conn.QueryFirstOrDefault<User>("SELECT * FROM Users WHERE Email=@e", new { e = email });`,
            language: 'csharp',
            bestPractices: ['Always parameterize or use an ORM', 'Validate input as a second layer', 'Least-privilege DB account'],
            commonMistakes: ['Concatenating input into SQL', 'Relying only on input sanitization instead of parameters'],
            interviewTip: 'Explain WHY it works (structure vs data separation), not just "use parameters" — that depth is what interviewers want.',
            followUp: ['How does the same idea apply to command injection?', 'What other defenses layer on top?']
        },
        {
            question: 'What is the principle of least privilege and how do you apply it across a system?',
            difficulty: 'medium',
            answer: `<p><strong>Least privilege</strong> means every component, account, and credential should have only the
            minimum permissions required to do its job — nothing more. If something is compromised, the damage is
            bounded by its limited rights.</p>
            <p>Applying it across a system:</p>
            <ul>
                <li><strong>Database:</strong> the app's DB account has only the needed CRUD on needed tables, not DDL
                or admin</li>
                <li><strong>Cloud/IAM:</strong> scoped roles per service; no wildcard "*" permissions</li>
                <li><strong>Tokens:</strong> narrowly-scoped, short-lived access tokens</li>
                <li><strong>Processes/containers:</strong> run as non-root, drop capabilities, read-only filesystems</li>
                <li><strong>Code:</strong> internal APIs require the specific permission for each operation</li>
            </ul>`,
            explanation: 'Least privilege is like giving a hotel guest a key card that only opens their room and the gym \u2014 not every room, the safe, and the manager\u2019s office. If the card is stolen, the thief can do very little.',
            bestPractices: ['Default to deny; grant specific permissions', 'Scope and time-limit tokens', 'Run services as non-root with minimal capabilities', 'Audit and prune permissions regularly'],
            commonMistakes: ['Wildcard IAM permissions', 'App connecting to the DB as an admin/owner', 'Long-lived broad tokens', 'Containers running as root'],
            interviewTip: 'Give concrete examples across layers (DB account, IAM role, token scope, container user) — breadth shows you apply it everywhere, not just conceptually.',
            followUp: ['How does least privilege limit blast radius in a breach?', 'How do you discover over-privileged accounts?']
        },
        {
            question: 'Walk through how you would design secure handling of user passwords and secrets in an application.',
            difficulty: 'hard',
            answer: `<p>Two distinct concerns: <strong>user passwords</strong> (which you must never be able to recover)
            and <strong>application secrets</strong> (which the app needs at runtime).</p>
            <h4>User Passwords</h4>
            <ul>
                <li>Never store plaintext or reversible encryption. Store a <strong>salted hash</strong> using a slow,
                memory-hard algorithm (Argon2id preferred; BCrypt/PBKDF2 acceptable)</li>
                <li>Unique random salt per password (the libraries handle this); tune the work factor to ~100-250ms</li>
                <li>Enforce strong password policy, support MFA, and rate-limit/lockout login attempts</li>
                <li>On verify, compare hashes in constant time (the library does this)</li>
            </ul>
            <h4>Application Secrets</h4>
            <ul>
                <li>Store in a dedicated secret manager (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault), not
                in code or committed config</li>
                <li>Inject at runtime via config providers or mounted secrets; use managed identities so the app has
                no static credentials at all where possible</li>
                <li>Rotate regularly and on suspicion of compromise; scope each secret narrowly</li>
                <li>Encrypt in transit (TLS) and at rest; scan repos for accidentally committed secrets</li>
            </ul>`,
            explanation: 'Passwords are like fingerprints you verify but never keep a copy of \u2014 you store a one-way transformation (hash) so even you cannot reverse it. Application secrets are like keys to the building kept in a guarded, audited key cabinet (the vault), handed out at runtime and changed periodically, never taped under the doormat (in code).',
            code: `// User password: salted slow hash (ASP.NET Core Identity uses PBKDF2; Argon2/BCrypt also good)
var hasher = new PasswordHasher<User>();
user.PasswordHash = hasher.HashPassword(user, plaintextPassword);   // store this
// verify:
var ok = hasher.VerifyHashedPassword(user, user.PasswordHash, attempt)
         != PasswordVerificationResult.Failed;

// App secret: from vault via config, ideally with managed identity (no static creds)
var dbConn = config.GetConnectionString("Db");   // value sourced from Key Vault`,
            language: 'csharp',
            bestPractices: ['Argon2id/BCrypt/PBKDF2 with per-password salt and tuned work factor', 'MFA + login rate limiting/lockout', 'Secrets in a vault, injected at runtime, rotated, narrowly scoped', 'Prefer managed identities over static credentials', 'Secret scanning in CI'],
            commonMistakes: ['Encrypting (reversible) instead of hashing passwords', 'Fast hashes (MD5/SHA1) for passwords', 'Secrets hardcoded or in committed .env files', 'No rotation; long-lived broad credentials'],
            interviewTip: 'Separate the two concerns explicitly (passwords = irreversible hash; secrets = vault-managed). Mention managed identities to eliminate static credentials entirely — that is a senior-level detail.',
            followUp: ['Why hash passwords instead of encrypting them?', 'What is a managed identity and why is it better than a stored credential?', 'How do you handle secret rotation without downtime?'],
            seniorPerspective: 'My north star for secrets is "no static credentials in the app at all" \u2014 managed identities / workload identity federation mean the platform issues short-lived tokens and there is nothing to leak or rotate manually. For passwords I default to Argon2id with a tuned work factor, paired with MFA and login throttling, because the hash is only one layer \u2014 most account takeovers come from credential stuffing, which rate limiting and MFA defeat. I also add secret scanning to CI so an accidental commit fails the build rather than reaching history.'
        },
        {
            question: 'Why validate input with an allowlist rather than a denylist, and where should validation happen?',
            difficulty: 'medium',
            answer: `<p>An <strong>allowlist (positive validation)</strong> defines exactly what is acceptable — type, length, format, range — and rejects everything else. A <strong>denylist (negative validation)</strong> tries to enumerate bad input (e.g., block <code>&lt;script&gt;</code>, <code>' OR 1=1</code>), which always misses cases: encodings, alternate syntaxes, and attacks not yet known.</p>
            <p><strong>Where:</strong> validation must happen on the <strong>server</strong>, because that is the only trust boundary the attacker cannot bypass. Client-side validation is for UX feedback only — an attacker calls the API directly with curl/Postman, skipping the browser entirely.</p>
            <p>Validation is also distinct from encoding: validate at input (is this value acceptable?), encode at output (is it safe in this destination context?). Both are needed.</p>`,
            explanation: 'A denylist is a nightclub bouncer with a list of banned troublemakers — anyone not on the list walks in, including troublemakers he has never seen. An allowlist is a guest list: only named invitees enter, everyone else is turned away. The guest list cannot be defeated by a disguise.',
            code: `// Allowlist via data annotations (server-side, reject anything outside the spec)
public record CreateUserRequest(
    [Required, EmailAddress] string Email,
    [Required, StringLength(50, MinimumLength = 2), RegularExpression(@"^[\p{L} '-]+$")] string Name,
    [Range(13, 120)] int Age);

// Denylist anti-pattern - incomplete, easily bypassed:
if (input.Contains("<script>")) Reject();   // misses <SCRIPT>, <img onerror=>, encoded variants`,
            language: 'csharp',
            bestPractices: ['Define valid type/length/format/range and reject the rest (allowlist)', 'Always validate on the server; treat client validation as UX only', 'Validate input AND encode output — they solve different problems', 'Fail closed: reject ambiguous input rather than trying to clean it'],
            commonMistakes: ['Relying on denylists/blocklists that miss novel payloads', 'Trusting client-side (JavaScript) validation for security', 'Conflating sanitization with validation and silently mutating data', 'Validating only some fields (headers, query strings, file names get forgotten)'],
            interviewTip: 'Lead with "allowlist defines good, denylist chases bad and always loses," then stress that the server is the only trust boundary. Mentioning that attackers bypass the UI entirely (curl/Postman) shows you understand why client validation is not security.',
            followUp: ['How is validation different from output encoding?', 'When is sanitization appropriate instead of rejection?', 'How do you validate complex/structured input like JSON or uploaded files?'],
            seniorPerspective: 'I push validation to the model boundary (DTOs with annotations or a FluentValidation layer) so every endpoint validates consistently and developers cannot forget a field. Denylists are a smell — when I see one in review, it usually means someone is patching a specific reported payload instead of defining what the field should actually contain.',
            architectPerspective: 'Architecturally I treat input validation as a contract enforced at the edge: schema validation at the API gateway, strongly-typed request models in the service, and database constraints as the final backstop. Layering it means a gap at one level is caught at another, and the valid shape of data is documented in code rather than living in individual developers\' heads.'
        },
        {
            question: 'What is IDOR, and how do you systematically prevent broken access control in code?',
            difficulty: 'hard',
            answer: `<p><strong>IDOR (Insecure Direct Object Reference)</strong> is a form of broken access control where an endpoint exposes a resource by an identifier (e.g., <code>/invoices/100</code>) and returns it after checking only that the caller is <em>authenticated</em>, never that they are <em>authorized</em> for that specific object. An attacker simply increments or guesses IDs to read or modify other users' data.</p>
            <p>Systematic prevention:</p>
            <ul>
                <li><strong>Authorize the resource, not the route:</strong> on every fetch/update, verify the current principal owns or may access <em>this</em> object.</li>
                <li><strong>Default deny:</strong> centralize authorization (policy/resource handlers) so new endpoints are protected by default rather than relying on each developer remembering.</li>
                <li><strong>Scope queries to the caller:</strong> filter by owner in the data layer (<code>WHERE OwnerId = @me</code>) so a foreign ID simply returns nothing.</li>
                <li><strong>Avoid relying on unguessable IDs alone:</strong> opaque GUIDs raise the bar but are not an authorization control.</li>
            </ul>`,
            explanation: 'IDOR is like a hotel where your room key opens the door but the front desk hands out any room number on request without checking whose key it is — so guessing "room 101, 102, 103" lets you into everyone\'s room. Resource authorization is the lock actually checking that this key belongs to this room.',
            code: `// VULNERABLE: authenticated but not authorized for THIS resource
[HttpGet("invoices/{id}")]
public async Task<IActionResult> Get(int id) => Ok(await _repo.GetAsync(id));  // any user reads any invoice

// FIXED 1: explicit ownership check
[HttpGet("invoices/{id}")]
public async Task<IActionResult> Get(int id)
{
    var inv = await _repo.GetAsync(id);
    if (inv is null) return NotFound();
    if (inv.OwnerId != _user.Id && !_user.IsAdmin) return Forbid();
    return Ok(inv);
}

// FIXED 2 (preferred): scope the query so foreign IDs cannot be loaded at all
var inv = await _repo.GetForOwnerAsync(id, _user.Id);   // WHERE Id=@id AND OwnerId=@me
if (inv is null) return NotFound();                     // indistinguishable from "not yours"`,
            language: 'csharp',
            bestPractices: ['Check ownership/permission on the specific resource for every read and write', 'Centralize authorization (ASP.NET Core resource-based policies) for consistency', 'Scope data-access queries by the current principal', 'Return 404 (not 403) for resources the caller may not even know exist, to avoid leaking existence'],
            commonMistakes: ['Checking authentication but not per-resource authorization', 'Assuming GUIDs/opaque IDs are sufficient protection', 'Protecting GET but forgetting PUT/DELETE/PATCH on the same resource', 'Enforcing authorization only in the UI, not the API'],
            interviewTip: 'Say the phrase "authorize the resource, not just the route" and show the query-scoping fix — filtering by owner in the data layer is more robust than a post-fetch if-check because it cannot be forgotten per-endpoint.',
            followUp: ['When should you return 404 vs 403 for an unauthorized resource?', 'How do ASP.NET Core resource-based authorization handlers work?', 'How do you prevent IDOR in batch/bulk endpoints?'],
            seniorPerspective: 'IDOR is the most common serious bug I find in reviews because authentication "looks done" and the missing piece is invisible until someone tampers with an ID. My default fix is to scope the query by owner so a foreign ID returns nothing, rather than a separate if-check that a future refactor might drop. I also test it explicitly — an automated "user B cannot fetch user A\'s record" test per resource.',
            architectPerspective: 'I make authorization a first-class, centralized concern rather than scattered conditionals: resource-based policy handlers, a default-deny pipeline, and data-access methods that always require the principal. The goal is that the secure path is the easy path — a developer adding an endpoint inherits authorization automatically instead of having to remember to add it, because relying on memory across a large team guarantees eventual IDOR.'
        },
        {
            question: 'Explain contextual output encoding and how it combines with other layers as defense in depth against injection.',
            difficulty: 'advanced',
            answer: `<p><strong>Output encoding</strong> transforms data so the destination interpreter treats it as inert text, not executable code. The critical nuance is that encoding is <strong>context-specific</strong> — the same value needs different escaping depending on where it lands:</p>
            <ul>
                <li><strong>HTML body:</strong> HTML-encode (<code>&lt;</code> &rarr; <code>&amp;lt;</code>)</li>
                <li><strong>HTML attribute:</strong> attribute-encode and always quote the attribute</li>
                <li><strong>JavaScript context:</strong> JS string/Unicode-escape (HTML-encoding is wrong here)</li>
                <li><strong>URL/query:</strong> percent-encode</li>
                <li><strong>SQL:</strong> do not "encode" — use parameters; the driver separates code from data</li>
            </ul>
            <p>Encoding is one layer. <strong>Defense in depth</strong> means combining it with input validation (reject malformed values), parameterized queries (structural separation for SQL), a Content-Security-Policy (browser-side backstop for XSS), and least-privilege data access — so that if one control has a gap, another still prevents exploitation.</p>`,
            explanation: 'Output encoding is like translating a message into the exact dialect each room understands so it is read as words, never as commands — and the dialect differs per room (HTML, JS, URL, SQL). Defense in depth is having a translator AND a guard AND a locked door, so a slip by any one of them is not catastrophic.',
            code: `// Right encoding for the right context:
var html = HtmlEncoder.Default.Encode(name);          // HTML body
var url  = UrlEncoder.Default.Encode(redirect);       // URL/query
var js   = JavaScriptEncoder.Default.Encode(value);   // inside a <script> string

// WRONG: HTML-encoding a value placed into a JS context does not neutralize it
// <script>var u = '@Html.Encode(value)';</script>   // still breakable -> use JS encoder

// SQL is NOT an encoding problem - parameterize:
await conn.QueryAsync("SELECT * FROM U WHERE Name=@n", new { n = name });

// Defense in depth backstop for XSS, independent of encoding:
ctx.Response.Headers.Append("Content-Security-Policy", "default-src 'self'; script-src 'self'");`,
            language: 'csharp',
            bestPractices: ['Encode for the specific output context (HTML/attribute/JS/URL)', 'Use the framework encoders rather than hand-rolled replacements', 'Parameterize SQL instead of trying to escape it', 'Layer encoding with validation, CSP, and least privilege (defense in depth)'],
            commonMistakes: ['Applying one encoding everywhere (HTML-encoding inside JS or URL contexts)', 'Double-encoding, which corrupts legitimate data', 'Treating SQL injection as an encoding problem instead of using parameters', 'Assuming a single control (e.g., a WAF) makes the others unnecessary'],
            interviewTip: 'The standout point is that encoding is context-dependent — give the HTML-vs-JS example. Then frame encoding as one layer in defense in depth alongside parameterization and CSP, so no single failure is fatal.',
            followUp: ['Why is HTML-encoding insufficient inside a <script> block?', 'How does CSP back up output encoding?', 'What is the risk of double-encoding?'],
            seniorPerspective: 'I lean on framework auto-encoding (Razor, the encoder classes) and reserve manual handling for the few places that bypass it, because the most common encoding bug is choosing the wrong context, not forgetting to encode entirely. Defense in depth is the mindset I actually optimize for — I assume any single control will eventually be misapplied, so CSP, parameterization, and least privilege exist precisely to cover that gap.',
            architectPerspective: 'I design rendering and data layers so the safe default is automatic: templating that auto-encodes per context, a data layer that only exposes parameterized access, and a strict CSP enforced at the edge. Each is independent, so a mistake in one (a stray Html.Raw) is contained by the others. Security architecture is about ensuring no single human error becomes a breach.'
        },
        {
            question: 'How do you prevent IDOR (Insecure Direct Object Reference) vulnerabilities in a REST API?',
            difficulty: 'hard',
            answer: `<p><strong>IDOR</strong> occurs when an API exposes internal object identifiers (IDs) and does not verify that the authenticated user has permission to access that specific object.</p>
<h4>Example vulnerability:</h4>
<pre><code>GET /api/orders/12345  // User A requests their order
GET /api/orders/12346  // User A changes the ID and sees User B's order!</code></pre>
<h4>Prevention strategies:</h4>
<ol>
<li><strong>Authorization check on every request:</strong> After authentication, verify the current user OWNS or HAS PERMISSION to access the specific resource. Not just "is logged in" but "can access THIS object."</li>
<li><strong>Scoped queries:</strong> Always filter by the authenticated user's tenant/account at the data layer:
<pre><code>// SAFE: query scoped to current user
var order = await _db.Orders
    .Where(o => o.Id == orderId && o.UserId == currentUser.Id)
    .FirstOrDefaultAsync();
// Returns null if the order belongs to someone else</code></pre></li>
<li><strong>Indirect references:</strong> Use non-guessable identifiers (UUIDs instead of sequential integers) to make enumeration harder (defense in depth, not a primary control).</li>
<li><strong>Resource-based authorization policies:</strong> Use ASP.NET Core's resource-based authorization:
<pre><code>[Authorize]
public async Task<IActionResult> GetOrder(int id)
{
    var order = await _orderService.GetById(id);
    var authResult = await _authService
        .AuthorizeAsync(User, order, "OwnerPolicy");
    if (!authResult.Succeeded) return Forbid();
    return Ok(order);
}</code></pre></li>
</ol>
<p><strong>Key principle:</strong> Never trust that a user should access a resource just because they know its ID. Authorization must be checked at the OBJECT level, not just the endpoint level.</p>`,
            bestPractices: ['Check object-level authorization on every request, not just authentication', 'Scope data queries to the current user/tenant at the data layer', 'Use UUIDs as defense-in-depth (harder to enumerate) but not as primary control', 'Automated testing: have tests that attempt cross-user access and verify 403'],
            commonMistakes: ['Only checking authentication ("is logged in") without object-level authorization', 'Sequential integer IDs making enumeration trivial', 'Authorization logic only in the controller (bypassable if another endpoint exposes the same data)', 'No automated IDOR testing in the pipeline'],
            interviewTip: 'Show the specific code pattern (scoped query OR resource-based authorization). Explain that IDOR is consistently in OWASP Top 10 because it is so commonly missed.',
            followUp: ['How do you test for IDOR vulnerabilities automatically?', 'How do you handle IDOR in multi-tenant SaaS applications?']
        },
        {
            question: 'How do you implement secrets management in a production application? Compare approaches.',
            difficulty: 'hard',
            answer: `<p><strong>Secrets management</strong> ensures sensitive values (API keys, database passwords, certificates) are never stored in code, environment variables (at rest), or config files — but are available to applications securely at runtime.</p>
<h4>Approaches compared:</h4>
<table>
<tr><th>Approach</th><th>Security Level</th><th>Pros</th><th>Cons</th></tr>
<tr><td>Environment variables</td><td>Low</td><td>Simple, universal</td><td>Visible in process listing, leaked in crash dumps, no rotation</td></tr>
<tr><td>Encrypted config files</td><td>Medium</td><td>Auditable in git (encrypted)</td><td>Key management problem moves, harder rotation</td></tr>
<tr><td>Cloud secrets manager (Key Vault, Secrets Manager)</td><td>High</td><td>Centralized, audited, auto-rotation, access policies</td><td>Network dependency, cost</td></tr>
<tr><td>HashiCorp Vault</td><td>High</td><td>Dynamic secrets, short-lived credentials, universal</td><td>Operational complexity, self-hosted</td></tr>
</table>
<h4>Production best practices:</h4>
<ol>
<li><strong>Never commit secrets to source control</strong> — use git-secrets or pre-commit hooks to prevent</li>
<li><strong>Use managed identity / workload identity</strong> where possible — no secrets at all (Azure Managed Identity, AWS IAM Roles for Service Accounts)</li>
<li><strong>Short-lived credentials:</strong> Vault dynamic secrets generate DB credentials valid for 1 hour, auto-revoked. Limits blast radius of compromise.</li>
<li><strong>Rotation without downtime:</strong> Application reads secrets at runtime (not startup-only). When rotated, next read gets the new value.</li>
<li><strong>Audit trail:</strong> Every secret access is logged — who accessed what, when.</li>
<li><strong>Least privilege:</strong> Each service can only access the secrets it needs (Key Vault access policies, Vault policies).</li>
</ol>`,
            bestPractices: ['Prefer managed identity / workload identity (no secrets to manage)', 'Use cloud-native secrets managers with access policies and audit logging', 'Rotate secrets automatically; applications reload without restart', 'Pre-commit hooks to prevent secrets from entering source control'],
            commonMistakes: ['Secrets in appsettings.json committed to git', 'Environment variables as the primary mechanism (no rotation, no audit)', 'Long-lived credentials that are never rotated (blast radius = forever)', 'All services sharing one secret manager credential (no isolation)'],
            interviewTip: 'Start with "prefer no secrets at all (managed identity)" then describe the hierarchy. Mentioning dynamic secrets and automatic rotation signals production maturity.',
            followUp: ['How do you handle secret rotation for a database password without application downtime?', 'What happens if the secrets manager is unavailable — how does the application handle it?']
        }
    ]
});
