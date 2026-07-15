/* ═══════════════════════════════════════════════════════════════════
   Full-Stack Authentication Flows (End-to-End)
   OAuth 2.0, JWT handling, refresh tokens, BFF pattern,
   token storage, session management, and PKCE.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('fullstack-auth', {
    title: 'Authentication Flows (End-to-End)',
    description: 'Complete full-stack authentication patterns — OAuth 2.0 flows, JWT lifecycle, refresh token rotation, BFF pattern, secure token storage, and session management for SPAs and APIs.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>Authentication in a full-stack application spans multiple layers: the SPA (Angular/React), the API (ASP.NET Core), the identity provider (Entra ID / Auth0 / Keycloak), and potentially a Backend-for-Frontend (BFF) proxy. Getting this right is one of the most common interview topics for senior full-stack and architect roles.</p>
            <p>This module covers the complete picture — from browser to database — including the security trade-offs at each layer.</p>`
        },
        {
            title: 'OAuth 2.0 Flows Overview',
            content: `<p>OAuth 2.0 defines several "grant types" (flows). The right one depends on your client type:</p>
            <table>
                <thead><tr><th>Flow</th><th>Client Type</th><th>Tokens Stored</th><th>Use When</th></tr></thead>
                <tbody>
                    <tr><td><strong>Authorization Code + PKCE</strong></td><td>SPA, Mobile, Server</td><td>Backend (preferred) or memory</td><td>Any public client. Standard for SPAs since 2021.</td></tr>
                    <tr><td><strong>Client Credentials</strong></td><td>Service-to-service</td><td>Server memory</td><td>Machine-to-machine (no user). API ↔ API calls.</td></tr>
                    <tr><td><strong>Device Code</strong></td><td>Input-constrained (TV, CLI)</td><td>Backend</td><td>Devices without a browser/keyboard.</td></tr>
                    <tr><td><strong>Implicit (DEPRECATED)</strong></td><td>SPA (legacy)</td><td>Fragment/memory</td><td>Never. Use Auth Code + PKCE instead.</td></tr>
                    <tr><td><strong>Resource Owner Password (DEPRECATED)</strong></td><td>Trusted first-party</td><td>Backend</td><td>Never in new code. Legacy migration only.</td></tr>
                </tbody>
            </table>`,
            callout: {
                type: 'warning',
                title: 'Implicit Flow is Dead',
                text: 'The implicit flow exposes tokens in URLs and has no refresh mechanism. All modern guidance (OAuth 2.1, IETF BCP) recommends Authorization Code + PKCE for SPAs.'
            }
        },
        {
            title: 'Authorization Code + PKCE (The Standard)',
            mermaid: `sequenceDiagram
    participant User as User Browser
    participant SPA as SPA (Angular)
    participant IDP as Identity Provider
    participant API as Backend API

    User->>SPA: Click "Login"
    SPA->>SPA: Generate code_verifier + code_challenge
    SPA->>IDP: /authorize?response_type=code&code_challenge=X&client_id=Y
    IDP->>User: Show login page
    User->>IDP: Enter credentials
    IDP->>SPA: Redirect with ?code=AUTH_CODE
    SPA->>IDP: POST /token { code, code_verifier, client_id }
    IDP-->>SPA: { access_token, refresh_token, id_token }
    SPA->>API: GET /api/data (Authorization: Bearer access_token)
    API->>API: Validate JWT signature + claims
    API-->>SPA: 200 OK + data`,
            content: `<h4>PKCE (Proof Key for Code Exchange)</h4>
            <p>PKCE prevents authorization code interception attacks. The flow:</p>
            <ol>
                <li>Client generates a random <code>code_verifier</code> (128 chars)</li>
                <li>Client computes <code>code_challenge = BASE64URL(SHA256(code_verifier))</code></li>
                <li>Client sends <code>code_challenge</code> in the /authorize request</li>
                <li>When exchanging the code for tokens, client sends the original <code>code_verifier</code></li>
                <li>IDP verifies: <code>SHA256(code_verifier) == code_challenge</code></li>
            </ol>
            <p>Even if an attacker intercepts the authorization code, they can't exchange it without the <code>code_verifier</code>.</p>`
        },
        {
            title: 'Token Storage — Where to Keep Tokens in the Browser',
            content: `<p>This is THE most debated topic in SPA security. Every option has trade-offs:</p>
            <table>
                <thead><tr><th>Storage</th><th>XSS Vulnerable?</th><th>CSRF Vulnerable?</th><th>Persists Refresh?</th><th>Recommendation</th></tr></thead>
                <tbody>
                    <tr><td><strong>In-Memory (JS variable)</strong></td><td>Yes (if XSS exists)</td><td>No</td><td>No (lost on refresh)</td><td>Good for access_token</td></tr>
                    <tr><td><strong>HttpOnly Cookie</strong></td><td>No (JS can't read)</td><td>Yes (mitigate with SameSite)</td><td>Yes</td><td>Best for refresh_token (via BFF)</td></tr>
                    <tr><td><strong>localStorage</strong></td><td>Yes (any XSS reads it)</td><td>No</td><td>Yes</td><td>Avoid for tokens</td></tr>
                    <tr><td><strong>sessionStorage</strong></td><td>Yes (same as localStorage)</td><td>No</td><td>Per-tab only</td><td>Slightly better than localStorage</td></tr>
                </tbody>
            </table>`,
            callout: {
                type: 'tip',
                title: 'Best Practice: BFF Pattern',
                text: 'The safest approach for SPAs: use a Backend-for-Frontend (BFF) that handles token exchange and stores tokens in HttpOnly, Secure, SameSite cookies. The SPA never touches tokens directly. This eliminates XSS-based token theft entirely.'
            }
        },
        {
            title: 'BFF (Backend-for-Frontend) Pattern',
            mermaid: `graph LR
    subgraph Browser
        SPA[SPA - Angular]
    end
    subgraph Server
        BFF[BFF Proxy<br/>HttpOnly Cookie Session]
        API[Backend API]
    end
    subgraph External
        IDP[Identity Provider]
    end
    SPA -->|Cookie-based session| BFF
    BFF -->|OAuth Code Exchange| IDP
    BFF -->|Bearer Token| API
    Note over BFF: Tokens stored server-side<br/>Never exposed to browser JS`,
            content: `<h4>How BFF Works</h4>
            <ol>
                <li>SPA redirects user to BFF's login endpoint</li>
                <li>BFF performs OAuth code exchange with IDP (server-side, with client_secret)</li>
                <li>BFF receives tokens, stores them in server-side session (or encrypted cookie)</li>
                <li>BFF sets an HttpOnly, Secure, SameSite=Strict session cookie to the browser</li>
                <li>SPA makes API calls through BFF (proxied), which attaches the access_token</li>
                <li>BFF handles token refresh transparently — SPA never sees tokens</li>
            </ol>
            <h4>When to Use BFF</h4>
            <ul>
                <li>High-security applications (banking, healthcare, enterprise)</li>
                <li>When you need to keep tokens completely out of the browser</li>
                <li>When using confidential clients (with client_secret) which SPAs can't have</li>
                <li>When you want to aggregate multiple API calls server-side</li>
            </ul>`,
            code: `// ASP.NET Core BFF endpoint (YARP or manual proxy)
app.MapGet("/bff/login", async (HttpContext ctx) =>
{
    // Initiate OAuth flow — redirect to IDP
    await ctx.ChallengeAsync("oidc", new AuthenticationProperties
    {
        RedirectUri = "/bff/callback"
    });
});

app.MapGet("/bff/callback", async (HttpContext ctx) =>
{
    // OAuth middleware handles code exchange automatically
    // Tokens stored in server-side session (cookie references session)
    await ctx.SignInAsync(ctx.User);
    ctx.Response.Redirect("/");
});

// Proxy API calls — attach access_token from session
app.MapForwarder("/api/{**path}", "https://backend-api.internal", httpClient =>
{
    httpClient.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", GetAccessTokenFromSession());
});`,
            language: 'csharp'
        },
        {
            title: 'JWT Lifecycle & Refresh Token Rotation',
            content: `<h4>Token Lifetimes</h4>
            <table>
                <thead><tr><th>Token</th><th>Typical Lifetime</th><th>Purpose</th><th>Storage</th></tr></thead>
                <tbody>
                    <tr><td>Access Token</td><td>5-15 minutes</td><td>Authorize API requests</td><td>Memory (SPA) or BFF session</td></tr>
                    <tr><td>Refresh Token</td><td>Hours to days</td><td>Get new access token silently</td><td>HttpOnly cookie or BFF session</td></tr>
                    <tr><td>ID Token</td><td>Same as access</td><td>User profile claims for UI</td><td>Memory</td></tr>
                </tbody>
            </table>
            <h4>Refresh Token Rotation</h4>
            <p>Each time a refresh token is used, the IDP issues a NEW refresh token and invalidates the old one. If an attacker steals and uses the old token, the IDP detects reuse and revokes the entire family.</p>
            <h4>Silent Refresh (iframe-based — legacy)</h4>
            <p>Before refresh tokens in SPAs were common, apps used hidden iframes to /authorize with <code>prompt=none</code>. This is fragile (breaks with third-party cookie restrictions) and deprecated in favor of refresh tokens with rotation.</p>`,
            code: `// Angular HTTP interceptor — auto-refresh expired tokens
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(this.addToken(req)).pipe(
      catchError(error => {
        if (error.status === 401 && !req.url.includes('/token')) {
          // Token expired — try refresh
          return this.auth.refreshToken$().pipe(
            switchMap(newToken => {
              return next.handle(this.addToken(req, newToken));
            }),
            catchError(refreshError => {
              // Refresh failed — force re-login
              this.auth.logout();
              return throwError(() => refreshError);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(req: HttpRequest<any>, token?: string): HttpRequest<any> {
    const accessToken = token || this.auth.getAccessToken();
    if (!accessToken) return req;
    return req.clone({
      setHeaders: { Authorization: \`Bearer \${accessToken}\` }
    });
  }
}`,
            language: 'typescript'
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Storing tokens in localStorage</strong>: Any XSS vulnerability can steal all tokens. Use in-memory or HttpOnly cookies.</li>
                <li><strong>Long-lived access tokens</strong>: If stolen, they're valid for hours/days. Keep access tokens short (5-15 min) + use refresh tokens.</li>
                <li><strong>No refresh token rotation</strong>: Without rotation, a stolen refresh token is valid forever. Always enable rotation + reuse detection.</li>
                <li><strong>Validating JWT only by signature</strong>: Must also check: expiration (exp), issuer (iss), audience (aud), not-before (nbf).</li>
                <li><strong>Implicit flow in new apps</strong>: Tokens in URL fragments are logged in browser history, proxy logs, and analytics. Use PKCE.</li>
                <li><strong>Client-side role checks only</strong>: SPA hides UI elements but API doesn't enforce. Authorization must be server-side.</li>
                <li><strong>Sharing tokens between tabs via localStorage</strong>: Use BroadcastChannel API or service worker for cross-tab token sync without localStorage exposure.</li>
                <li><strong>No token revocation strategy</strong>: JWTs can't be revoked (stateless). Use short lifetimes + refresh tokens that CAN be revoked.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li>Know the difference between authentication (who are you?) and authorization (what can you do?)</li>
                    <li>Explain OAuth 2.0 + PKCE flow end-to-end (client → IDP → token exchange → API)</li>
                    <li>Discuss token storage trade-offs (memory vs cookie vs localStorage) with XSS/CSRF awareness</li>
                    <li>Mention BFF pattern as the secure approach for high-security SPAs</li>
                    <li>Explain refresh token rotation and why access tokens should be short-lived</li>
                    <li>Distinguish client-side (UI) vs server-side (API) authorization enforcement</li>
                    <li>Know when to use which OAuth flow (Code+PKCE, Client Credentials, Device Code)</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Authorization Code + PKCE is the only recommended flow for SPAs (OAuth 2.1)</li>
                <li>BFF pattern: safest for SPAs — tokens never reach the browser JavaScript</li>
                <li>Access tokens: short-lived (5-15 min), stored in memory. Refresh tokens: longer, in HttpOnly cookies.</li>
                <li>Refresh token rotation: each use issues new token, invalidates old. Detects theft via reuse detection.</li>
                <li>Authorization is ALWAYS server-side. Client-side checks are UX, not security.</li>
                <li>JWTs are stateless — can't be revoked. Combine short lifetime + revocable refresh tokens.</li>
                <li>XSS is the primary threat to SPAs. HttpOnly cookies and CSP are your main defenses.</li>
                <li>Client Credentials flow for service-to-service (no user). Never expose client_secret to browsers.</li>
            </ul>`
        }
    ],
    questions: [
        {
            id: 'fsa-q1',
            level: 'senior',
            title: 'How would you implement authentication in a modern SPA + API architecture?',
            answer: `<p>The recommended approach for 2024+:</p>
            <ol>
                <li><strong>OAuth 2.0 Authorization Code + PKCE</strong> flow — SPA redirects to IDP, receives code, exchanges for tokens</li>
                <li><strong>Token storage</strong>: Access token in memory (JS closure/service), refresh token in HttpOnly cookie (or BFF session)</li>
                <li><strong>API calls</strong>: Attach access_token as Bearer header. HTTP interceptor handles 401 → silent refresh.</li>
                <li><strong>Token refresh</strong>: On 401 or proactive (before expiry), call token endpoint with refresh_token. Rotation enabled.</li>
                <li><strong>Logout</strong>: Clear tokens, call IDP's end_session endpoint, redirect to login.</li>
            </ol>
            <p>For high-security: use BFF pattern where the SPA never touches tokens at all — a server-side proxy handles OAuth and uses HttpOnly session cookies with the browser.</p>`
        },
        {
            id: 'fsa-q2',
            level: 'architect',
            title: 'When would you choose the BFF pattern over direct token handling in the SPA?',
            answer: `<p>Use BFF when:</p>
            <ul>
                <li>Security requirements are high (banking, healthcare, enterprise data)</li>
                <li>You need confidential client authentication (client_secret, which SPAs can't securely hold)</li>
                <li>Token lifetime policies require server-side session management</li>
                <li>You want to aggregate multiple downstream APIs (reduce browser requests)</li>
                <li>Regulatory compliance requires tokens never to be in browser memory</li>
            </ul>
            <p>Direct SPA token handling is fine for lower-risk applications where: shorter time-to-market is needed, the app is purely client-side (no server to host BFF), or security requirements are moderate. Even then, use PKCE + short access tokens + rotation.</p>`
        },
        {
            id: 'fsa-q3',
            level: 'mid',
            title: 'What is the difference between OAuth 2.0 and OpenID Connect?',
            answer: `<p><strong>OAuth 2.0</strong> is an authorization framework — it answers "what can this app access?" It issues access tokens for API authorization but says nothing about the user's identity.</p>
            <p><strong>OpenID Connect (OIDC)</strong> is an identity layer built ON TOP of OAuth 2.0. It adds:</p>
            <ul>
                <li><strong>ID Token</strong>: A JWT containing user identity claims (sub, name, email)</li>
                <li><strong>/userinfo endpoint</strong>: API to get additional user profile data</li>
                <li><strong>Standard scopes</strong>: openid, profile, email, address, phone</li>
                <li><strong>Discovery</strong>: .well-known/openid-configuration for auto-discovery</li>
            </ul>
            <p>In practice: if you need to know WHO the user is, you need OIDC. If you just need to authorize API access, OAuth 2.0 alone suffices.</p>`
        },
        {
            id: 'fsa-q4',
            level: 'senior',
            title: 'How do you handle token refresh in an Angular/React SPA without race conditions?',
            answer: `<p>The challenge: multiple concurrent API calls can all receive 401 simultaneously, triggering multiple refresh attempts. Solution: use a token refresh queue:</p>
            <ol>
                <li>First 401 triggers a refresh call. Set a flag: <code>isRefreshing = true</code>.</li>
                <li>Subsequent 401s while refreshing don't trigger new refresh calls. Instead, they subscribe to a shared observable/promise.</li>
                <li>When refresh completes, emit new token to all waiting requests. They retry with the new token.</li>
                <li>If refresh fails, redirect all waiters to login.</li>
            </ol>
            <p>Implementation: use RxJS <code>BehaviorSubject</code> (Angular) or a shared Promise (React). The interceptor checks <code>isRefreshing</code> and either initiates refresh or queues behind the existing one.</p>`
        },
        {
            id: 'fsa-q5',
            level: 'junior',
            title: 'What is a JWT and what are its three parts?',
            answer: `<p>A <strong>JSON Web Token (JWT)</strong> is a compact, URL-safe token format for transmitting claims between parties. It has three Base64URL-encoded parts separated by dots:</p>
            <ol>
                <li><strong>Header</strong>: Algorithm (RS256, HS256) and token type (JWT)</li>
                <li><strong>Payload</strong>: Claims — key-value pairs (sub, exp, iss, aud, custom claims like roles)</li>
                <li><strong>Signature</strong>: <code>HMAC(header.payload, secret)</code> or <code>RSA_SIGN(header.payload, privateKey)</code></li>
            </ol>
            <p>The signature ensures the token hasn't been tampered with. The API verifies the signature using the IDP's public key (asymmetric) or shared secret (symmetric). JWTs are stateless — the server doesn't need to store session data.</p>`
        },
        {
            id: 'fsa-q6',
            level: 'architect',
            title: 'How do you implement authorization across a microservices architecture?',
            answer: `<p>Authorization in microservices has two layers:</p>
            <ul>
                <li><strong>Edge authorization</strong> (API Gateway): Validate JWT signature, check token not expired, verify audience. Reject obviously invalid requests early.</li>
                <li><strong>Service-level authorization</strong>: Each service enforces its own business rules (e.g., "user can only edit their own orders"). This uses claims from the JWT + service-specific logic.</li>
            </ul>
            <h4>Patterns</h4>
            <ul>
                <li><strong>JWT propagation</strong>: Gateway validates, passes JWT downstream. Each service extracts claims and decides.</li>
                <li><strong>Token exchange</strong>: Gateway exchanges user token for a service-scoped token with narrowed permissions.</li>
                <li><strong>Policy engine</strong>: Centralized policy (OPA/Rego, Cedar) evaluated at each service. Policies versioned and deployed independently.</li>
            </ul>
            <p>Key principle: the gateway is a coarse filter (is this a valid authenticated request?), each service is the fine-grained enforcer (can THIS user do THIS action on THIS resource?).</p>`
        },
        {
            id: 'fsa-q7',
            level: 'senior',
            title: 'How do you handle CSRF protection in a SPA that uses cookies for authentication?',
            answer: `<p>If you use cookies for auth (BFF pattern), CSRF is a concern. Defenses:</p>
            <ul>
                <li><strong>SameSite=Strict/Lax cookies</strong>: Browser won't send cookie on cross-origin requests. This alone prevents most CSRF.</li>
                <li><strong>Double-submit cookie pattern</strong>: Server sets a CSRF token in a non-HttpOnly cookie. SPA reads it and sends as a header (X-XSRF-TOKEN). Server verifies header matches cookie.</li>
                <li><strong>Custom header requirement</strong>: API rejects requests without a custom header (e.g., X-Requested-With). Browsers don't add custom headers in cross-origin simple requests.</li>
                <li><strong>Origin/Referer validation</strong>: Server checks Origin header matches expected domain.</li>
            </ul>
            <p>With <code>SameSite=Strict</code> + HTTPS + custom header check, CSRF is effectively eliminated for modern browsers.</p>`
        },
        {
            id: 'fsa-q8',
            level: 'mid',
            title: 'What happens when an access token expires during a user session?',
            answer: `<p>The token refresh flow:</p>
            <ol>
                <li>SPA makes API call with expired access_token</li>
                <li>API returns 401 Unauthorized (or SPA proactively checks exp before calling)</li>
                <li>HTTP interceptor catches 401, calls the token endpoint with refresh_token</li>
                <li>IDP validates refresh token, issues new access_token (and rotated refresh_token)</li>
                <li>Interceptor retries the original request with the new access_token</li>
                <li>User experiences no interruption — completely transparent</li>
            </ol>
            <p>If the refresh token is also expired or revoked: redirect user to login page. Session is over.</p>`
        }
    ]
});
