/* ═══════════════════════════════════════════════════════════════════
   ZERO TRUST ARCHITECTURE — Level 10: Security (Advanced Security)
   Never trust always verify, identity-centric security, least
   privilege, microsegmentation, and the shift from perimeter security.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('zero-trust', {

    title: 'Zero Trust Architecture',
    level: 10,
    group: 'security-advanced',
    description: 'Zero Trust: never trust always verify, identity-centric security, least privilege, microsegmentation, continuous verification, and the move beyond perimeter-based security.',
    difficulty: 'advanced',
    estimatedMinutes: 35,
    prerequisites: ['security-auth'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Zero Trust</strong> is a security model built on one principle: <em>never trust, always
            verify</em>. It rejects the traditional "castle and moat" approach where anything inside the network
            perimeter is trusted. Instead, every request — regardless of origin — must be authenticated, authorized,
            and continuously validated.</p>
            <p>The shift is driven by reality: perimeters dissolved with cloud, remote work, mobile, and SaaS. The
            network is no longer a meaningful trust boundary, and breaches increasingly come from inside compromised
            "trusted" zones.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>The core Zero Trust principles</li>
                <li>Why perimeter security failed</li>
                <li>Identity as the new perimeter</li>
                <li>Microsegmentation and least privilege</li>
                <li>Continuous verification and policy enforcement</li>
                <li>How to apply Zero Trust pragmatically</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Never Trust, Always Verify</h4>
            <p>No implicit trust based on network location. Every access request is verified using identity, device
            posture, and context — every time, not once at login.</p>
            <h4>Identity as the Perimeter</h4>
            <p>Strong identity (with MFA) becomes the primary control plane. Access decisions hinge on "who/what is
            asking and are they authorized for this specific resource right now," not "are they on the corporate
            network."</p>
            <h4>Least Privilege &amp; Just-in-Time Access</h4>
            <p>Grant the minimum access needed, for the shortest time. Standing broad access is replaced by scoped,
            time-bound, and often just-in-time elevation.</p>
            <h4>Microsegmentation</h4>
            <p>Divide the network/workloads into small isolated zones so a breach in one cannot move laterally to
            others. Each segment enforces its own policy.</p>
            <h4>Continuous Verification</h4>
            <p>Trust is re-evaluated continuously based on signals (device health, location, behavior anomalies), not
            granted permanently after a single authentication.</p>
            <h4>Assume Breach</h4>
            <p>Design as if attackers are already inside: encrypt everything, log everything, limit blast radius, and
            detect lateral movement.</p>`,
            mermaid: `graph TB
    Req[Any request: user/service/device] --> PEP[Policy Enforcement Point]
    PEP --> PDP{Policy Decision Point}
    Identity[Verified identity + MFA] --> PDP
    Device[Device posture] --> PDP
    Context[Context: location, behavior, risk] --> PDP
    PDP -->|allow least-privilege, time-bound| Resource[Specific resource]
    PDP -->|deny / step-up auth| Block[Deny or challenge]`
        },
        {
            title: 'How It Works',
            content: `<p>In Zero Trust, every access flows through a policy engine that decides based on identity,
            device, and context — not network location:</p>
            <ol>
                <li><strong>Request:</strong> a user or service requests a specific resource</li>
                <li><strong>Authenticate:</strong> verify identity strongly (MFA, certificates, workload identity)</li>
                <li><strong>Evaluate context:</strong> the Policy Decision Point checks device posture, location,
                risk signals, and the requested resource's policy</li>
                <li><strong>Authorize least privilege:</strong> grant only the specific, minimal, time-bound access</li>
                <li><strong>Enforce &amp; monitor:</strong> the Policy Enforcement Point applies the decision; activity
                is logged and trust is continuously re-evaluated</li>
            </ol>
            <p>A request from inside the corporate network gets no free pass — it is verified exactly like one from
            the public internet.</p>`,
            code: `// Service-to-service call in a Zero Trust model:
// 1. Caller presents a verifiable workload identity (mTLS cert / signed token),
//    NOT just "I'm on the internal network".
// 2. The service mesh / gateway verifies identity + policy on every call.

// Conceptual policy (e.g., OPA / service mesh authz):
//   ALLOW order-service -> payment-service
//     IF caller.identity == "order-service"
//     AND caller.mtls_verified == true
//     AND request.path == "/charge"
//     AND time within business rules
//   DENY everything else (default deny)

// Default-deny + explicit allow is the heart of Zero Trust authorization.`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Perimeter model vs Zero Trust:</p>`,
            mermaid: `flowchart TB
    subgraph Perimeter["Traditional: Castle & Moat"]
        FW[Firewall] --> Trusted[Everything inside = TRUSTED]
        Trusted --> S1[Server] & S2[Server] & S3[Server]
    end
    subgraph ZT["Zero Trust"]
        direction TB
        R[Every request verified] --> P{Policy: identity+device+context}
        P --> Z1[Segment A] 
        P --> Z2[Segment B]
        P --> Z3[Segment C]
    end
    style Perimeter fill:#fee2e2,color:#1e293b
    style ZT fill:#d1fae5,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Practical building blocks of a Zero Trust implementation:</p>`,
            tabs: [
                {
                    label: 'Identity + Conditional Access',
                    code: `// Identity-centric access with conditional policies (Entra ID style)
// Policy: access to the finance app requires:
//   - Verified user identity + MFA
//   - Compliant, managed device
//   - Acceptable sign-in risk (no impossible travel / anomaly)
//   - Otherwise: block or require step-up auth
//
// Tokens are short-lived and scoped; no long-lived "trusted" sessions.
// Access is re-evaluated as risk signals change (continuous access evaluation).`,
                    language: 'csharp'
                },
                {
                    label: 'mTLS Service Identity',
                    code: `# Service mesh (e.g., Istio) enforces mutual TLS - each workload has an identity
# AuthorizationPolicy: default deny, explicit allow
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: payment-allow-order
spec:
  selector:
    matchLabels: { app: payment-service }
  action: ALLOW
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/prod/sa/order-service"]  # verified identity
      to:
        - operation:
            methods: ["POST"]
            paths: ["/charge"]
# Anything not explicitly allowed is denied - even from inside the cluster.`,
                    language: 'yaml'
                },
                {
                    label: 'Least Privilege IAM',
                    code: `# Just-in-time, scoped, time-bound access instead of standing admin rights
# - No permanent broad roles; request elevation when needed, auto-expire
# - Each role grants only specific actions on specific resources

# Example principle (cloud IAM):
#   DENY by default
#   ALLOW order-service-role:
#     - dynamodb:GetItem, PutItem  ON  Orders table ONLY
#   (no wildcard "*" actions or resources)

# Privileged access uses JIT elevation with approval + audit + auto-expiry.`,
                    language: 'bash'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Make Identity the Control Plane</h4>
            <p>Strong authentication (MFA, phishing-resistant where possible) and identity-based authorization for
            every user and workload — not network location.</p>
            <h4>Do: Default Deny</h4>
            <p>Deny all access by default; explicitly allow only what is needed. This is the inverse of the
            perimeter model's implicit internal trust.</p>
            <h4>Do: Microsegment</h4>
            <p>Isolate workloads/networks into small zones with their own policies so a breach can't move laterally.</p>
            <h4>Do: Enforce Least Privilege and JIT Access</h4>
            <p>Scope and time-box permissions; replace standing admin rights with just-in-time, audited elevation.</p>
            <h4>Do: Verify Continuously and Assume Breach</h4>
            <p>Re-evaluate trust on changing signals; encrypt everywhere; log comprehensively; monitor for lateral
            movement and anomalies.</p>`,
            callout: {
                type: 'tip',
                title: 'Zero Trust Is a Journey, Not a Product',
                text: 'No single tool "gives you Zero Trust." It is an architecture and mindset implemented incrementally \u2014 strengthen identity/MFA, segment networks, adopt least privilege, add continuous verification. Beware vendors selling "Zero Trust in a box."'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Trusting the Internal Network</h4>
            <p>The core anti-pattern. Assuming traffic inside the firewall is safe enables lateral movement once an
            attacker gets a foothold (phishing, supply chain).</p>
            <h4>Mistake: Treating Zero Trust as a Product</h4>
            <p>Buying a "Zero Trust" appliance and declaring victory. It is an architecture spanning identity,
            network, devices, and data — implemented over time.</p>
            <h4>Mistake: All-or-Nothing Rollout</h4>
            <p>Attempting to convert everything at once causes outages and resistance. Adopt incrementally, starting
            with identity/MFA and the most sensitive assets.</p>
            <h4>Mistake: Standing Privileged Access</h4>
            <p>Permanent admin rights are a prime target. Use just-in-time, time-bound, audited elevation instead.</p>
            <h4>Mistake: Ignoring Usability</h4>
            <p>Excessive friction (constant re-auth) drives users to workarounds. Use risk-based, adaptive
            verification so low-risk actions stay smooth and high-risk ones get challenged.</p>`,
            code: `// Anti-pattern: implicit trust by network location
if (request.IsFromInternalNetwork)
    return Allow();   // DANGER - a compromised internal host now has free rein

// Zero Trust: verify identity + policy regardless of origin
if (await _policy.IsAuthorizedAsync(request.Identity, request.Resource, request.Context))
    return Allow();
return Deny();   // default deny`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Google BeyondCorp</h4>
            <p>Google pioneered enterprise Zero Trust: employees access internal apps over the public internet with
            no VPN, access decided by user + device trust rather than network. A landmark real-world implementation.</p>
            <h4>Cloud &amp; SaaS Access</h4>
            <p>Conditional access policies (Entra ID, Okta) gate SaaS apps on identity, MFA, device compliance, and
            sign-in risk — Zero Trust for the modern, perimeter-less workplace.</p>
            <h4>Service Mesh / Microservices</h4>
            <p>mTLS and default-deny authorization policies (Istio, Linkerd) enforce verified workload identity on
            every service-to-service call inside the cluster.</p>
            <h4>Government Mandates</h4>
            <p>US Executive Order 14028 and NIST SP 800-207 drive Zero Trust adoption across federal agencies and
            their suppliers.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Perimeter security vs Zero Trust:</p>`,
            table: {
                headers: ['Aspect', 'Perimeter (Castle & Moat)', 'Zero Trust'],
                rows: [
                    ['Trust basis', 'Network location', 'Identity + device + context'],
                    ['Default posture', 'Trust inside, block outside', 'Default deny everywhere'],
                    ['Verification', 'Once at the perimeter', 'Continuous, every request'],
                    ['Lateral movement', 'Easy once inside', 'Blocked by microsegmentation'],
                    ['Remote/cloud fit', 'Poor (VPN bottleneck)', 'Native'],
                    ['Blast radius of breach', 'Large', 'Contained'],
                    ['Access model', 'Broad standing access', 'Least privilege, JIT'],
                    ['Assumption', 'Inside is safe', 'Assume breach']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Zero Trust adds verification on every request; design so it doesn't become a bottleneck:</p>
            <h4>Verification Overhead</h4>
            <p>Per-request authz checks and mTLS add latency. Mitigate with token caching, efficient policy engines
            (OPA with compiled policies), and sidecar/mesh offload of mTLS.</p>
            <h4>Avoid a Central Choke Point</h4>
            <p>A single policy decision service can become a bottleneck/SPOF. Distribute enforcement (sidecars,
            edge), cache decisions briefly, and make the policy engine highly available.</p>
            <h4>Adaptive (Risk-Based) Verification</h4>
            <p>Don't re-challenge every action. Use risk signals to apply heavier verification only when risk is
            elevated, keeping the common path fast.</p>
            <h4>mTLS Cost</h4>
            <p>Mutual TLS adds handshake cost; connection reuse and session resumption amortize it. Service meshes
            handle this efficiently in the data plane.</p>`,
            callout: {
                type: 'warning',
                title: 'Balance Security and Friction',
                text: 'Re-authenticating users for every click destroys productivity and breeds workarounds. Use adaptive, risk-based verification: low-risk actions flow smoothly, high-risk or anomalous ones trigger step-up auth. Security that is too painful gets bypassed.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Validate that Zero Trust controls actually deny what they should.</p>
            <h4>Policy Tests</h4>
            <p>Test authorization policies as code (e.g., OPA policy unit tests): assert allowed requests pass and
            unauthorized ones (wrong identity, wrong path, expired token) are denied by default.</p>
            <h4>Lateral Movement / Segmentation Tests</h4>
            <p>Verify that a compromised segment cannot reach others — purple-team exercises and network policy tests
            confirm microsegmentation holds.</p>`,
            code: `// OPA-style policy unit test (Rego) - default deny, explicit allow
# package authz
# test_order_can_charge_payment {
#   allow with input as {
#     "source": "order-service", "mtls": true,
#     "method": "POST", "path": "/charge"
#   }
# }
# test_unknown_service_denied {
#   not allow with input as {
#     "source": "random-service", "mtls": true,
#     "method": "POST", "path": "/charge"
#   }
# }
// Run policy tests in CI so authorization rules can't silently regress.`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Zero Trust is increasingly common in security/architecture interviews:</p>
            <ul>
                <li><strong>State the principle:</strong> never trust, always verify; default deny</li>
                <li><strong>Explain why perimeter security failed</strong> (cloud, remote, lateral movement)</li>
                <li><strong>Identity is the new perimeter</strong> — access by identity/device/context, not location</li>
                <li><strong>Microsegmentation + least privilege + JIT</strong> limit blast radius</li>
                <li><strong>It's a journey, not a product</strong> — adopt incrementally; cite BeyondCorp/NIST 800-207</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Senior Signal',
                text: 'Framing Zero Trust as "assume breach + contain blast radius + verify continuously" and acknowledging the usability trade-off (adaptive/risk-based verification) shows you understand it as a pragmatic architecture, not a buzzword.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Foundational</h4>
            <ul>
                <li>NIST SP 800-207: Zero Trust Architecture (the canonical reference)</li>
                <li>Google BeyondCorp papers (research.google/pubs)</li>
                <li>CISA Zero Trust Maturity Model</li>
            </ul>
            <h4>Practical</h4>
            <ul>
                <li><em>Zero Trust Networks</em> by Gilman &amp; Barth</li>
                <li>Microsoft and Cloudflare Zero Trust guidance</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Never trust, always verify</strong> — no implicit trust from network location; default deny</li>
                <li><strong>Identity is the new perimeter:</strong> decisions based on identity + device + context</li>
                <li><strong>Perimeter security failed</strong> with cloud/remote/SaaS and enables lateral movement</li>
                <li><strong>Microsegmentation + least privilege + JIT access</strong> contain blast radius</li>
                <li><strong>Continuous verification + assume breach</strong> — re-evaluate trust, encrypt, log, monitor</li>
                <li><strong>It's an architecture/journey,</strong> not a product — adopt incrementally</li>
                <li><strong>Balance with usability</strong> via adaptive, risk-based verification</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Design a Zero Trust Access Model</h4>
            <ol>
                <li>Take an app with a web frontend, API, and database currently "trusted because internal"</li>
                <li>Define identity-based access: MFA for users, workload identity (mTLS) for services</li>
                <li>Write default-deny authorization policies (who can call what)</li>
                <li>Microsegment: which segments may talk to which, and block all else</li>
                <li>Apply least privilege to the DB account and any cloud IAM roles; add JIT for admin</li>
                <li>Define continuous-verification signals and an adaptive step-up rule for risky actions</li>
            </ol>`,
            code: `// Design deliverables:
// 1. Identity: users -> Entra/Okta + MFA ; services -> mesh mTLS identities
// 2. AuthZ policies: default deny; explicit allow (frontend->API->DB only)
// 3. Segmentation: API can reach DB; frontend cannot reach DB directly
// 4. Least privilege: DB role = CRUD on app tables only; JIT admin elevation
// 5. Continuous verification: device posture + sign-in risk -> step-up auth
// TODO: write the policy rules and segmentation diagram`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What is the core principle of Zero Trust?<br/>
                    <em>A: "Never trust, always verify" \u2014 no implicit trust based on network location; every request is
                    authenticated, authorized, and continuously validated, with default deny.</em></li>
                <li><strong>Q:</strong> Why did the traditional perimeter ("castle and moat") model fail?<br/>
                    <em>A: Cloud, remote work, mobile, and SaaS dissolved the perimeter, and once an attacker breaches the
                    perimeter, implicit internal trust lets them move laterally freely. The network is no longer a valid
                    trust boundary.</em></li>
                <li><strong>Q:</strong> What is microsegmentation and why does it matter?<br/>
                    <em>A: Dividing the network/workloads into small isolated zones with their own policies, so a breach in
                    one segment cannot move laterally to others \u2014 it contains blast radius.</em></li>
                <li><strong>Q:</strong> Is Zero Trust a product you can buy?<br/>
                    <em>A: No. It is an architecture and mindset implemented incrementally across identity, network,
                    devices, and data. No single tool delivers it; beware "Zero Trust in a box" marketing.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'What is Zero Trust and how does it differ from traditional perimeter security?',
            difficulty: 'easy',
            answer: `<p><strong>Zero Trust</strong> is a security model based on "never trust, always verify." It grants no
            implicit trust based on network location — every request is authenticated, authorized, and continuously
            validated using identity, device posture, and context, with a default-deny stance.</p>
            <p>Traditional <strong>perimeter security</strong> ("castle and moat") trusts anything inside the network
            and focuses defenses on the boundary. Its flaw: once an attacker gets inside (phishing, VPN compromise),
            they can move laterally with little resistance. Zero Trust removes that implicit internal trust.</p>`,
            explanation: 'Perimeter security is a building where, once past the front-desk guard, you can enter any room. Zero Trust requires your badge to be checked at every single door, every time, based on who you are and whether you are allowed in that specific room right now.',
            bestPractices: ['Default deny; verify every request', 'Base access on identity + device + context', 'Assume breach and contain blast radius'],
            commonMistakes: ['Trusting internal network traffic', 'Treating Zero Trust as a single product'],
            interviewTip: 'Lead with "never trust, always verify" and contrast it with implicit internal trust — that contrast is the heart of the answer.',
            followUp: ['Why did perimeter security stop working?', 'What does "identity is the new perimeter" mean?']
        },
        {
            question: 'How do least privilege and microsegmentation work together to limit blast radius in Zero Trust?',
            difficulty: 'medium',
            answer: `<p>Both aim to contain damage when (not if) something is compromised.</p>
            <p><strong>Least privilege</strong> ensures each identity (user, service, token) has only the minimal
            permissions needed, ideally time-bound (just-in-time). A compromised credential can do little.</p>
            <p><strong>Microsegmentation</strong> divides networks/workloads into small isolated zones, each with its
            own default-deny policy. A breach in one segment cannot move laterally into others.</p>
            <p>Together: even if an attacker compromises a component, least privilege limits what that component can
            do, and microsegmentation limits where it can reach — shrinking blast radius from "the whole environment"
            to "one small, low-privilege segment."</p>`,
            explanation: 'Least privilege is giving each worker keys to only the rooms they need; microsegmentation is putting fire doors between every section of the building. A fire (breach) in one room is small (least privilege) and cannot spread (segmentation).',
            bestPractices: ['Scope and time-box every permission (JIT)', 'Default-deny segment policies', 'No wildcard IAM; no standing admin', 'Monitor for lateral-movement attempts'],
            commonMistakes: ['Broad standing permissions', 'Flat networks with no segmentation', 'Allowing free east-west traffic inside a zone'],
            interviewTip: 'Use the phrase "contain blast radius" and explain the two controls as complementary (what they can do vs where they can reach).',
            followUp: ['What is just-in-time access?', 'How does a service mesh enforce segmentation?']
        },
        {
            question: 'How would you migrate a legacy perimeter-based enterprise to Zero Trust without breaking everything?',
            difficulty: 'hard',
            answer: `<p>Incrementally, prioritizing high-value assets and identity first — never big-bang:</p>
            <ol>
                <li><strong>Inventory:</strong> map users, devices, applications, data, and flows. You can't protect
                what you can't see.</li>
                <li><strong>Strengthen identity first:</strong> roll out MFA everywhere and centralize identity (SSO).
                This is the highest-leverage, foundational step.</li>
                <li><strong>Protect the crown jewels:</strong> apply Zero Trust controls to the most sensitive
                apps/data first, where the risk reduction is greatest.</li>
                <li><strong>Add device posture &amp; conditional access:</strong> gate access on compliant devices and
                sign-in risk.</li>
                <li><strong>Microsegment incrementally:</strong> start with coarse segments around critical assets,
                then refine; monitor flows before enforcing to avoid outages.</li>
                <li><strong>Replace VPN with identity-aware access</strong> for internal apps (BeyondCorp-style) as
                segments mature.</li>
                <li><strong>Least privilege &amp; JIT:</strong> prune standing access, introduce time-bound elevation.</li>
                <li><strong>Continuous verification &amp; monitoring:</strong> add risk-based re-evaluation and
                lateral-movement detection.</li>
            </ol>
            <p>Throughout: run policies in monitor/log mode before enforce, communicate with users, and measure to
            balance security gains against friction.</p>`,
            explanation: 'You renovate an occupied building one wing at a time: first install a reliable ID system at the entrances (identity/MFA), then secure the vault (crown jewels), add fire doors gradually (segmentation), and only remove the old single guard (VPN/perimeter) once the new room-by-room checks are proven \u2014 all while keeping the building open for business.',
            bestPractices: ['Start with identity/MFA and SSO', 'Protect highest-value assets first', 'Run policies in monitor mode before enforcing', 'Microsegment incrementally; replace VPN gradually', 'Measure friction and risk reduction'],
            commonMistakes: ['Big-bang rollout causing outages', 'Segmenting before understanding traffic flows', 'Neglecting user communication (workarounds)', 'Buying a product and declaring done'],
            interviewTip: 'Emphasize "incremental, identity-first, monitor-before-enforce, protect crown jewels first." Mentioning BeyondCorp and NIST 800-207 adds credibility.',
            followUp: ['Why is identity/MFA the right first step?', 'How do you avoid outages when enforcing new policies?', 'How do you measure progress toward Zero Trust?'],
            seniorPerspective: 'The migrations I have seen succeed treat it as a multi-year program, not a project, and they always start with identity because everything else depends on it. The single most important operational practice is "monitor before enforce" \u2014 deploy every new authorization or segmentation policy in log-only mode, watch what it WOULD have blocked for a couple of weeks, fix the legitimate flows it would break, and only then flip to enforce. That discipline is what prevents the self-inflicted outage that makes leadership lose faith in the whole initiative.'
        },
        {
            question: 'What does "continuous verification" mean in Zero Trust, and how does continuous access evaluation differ from token expiry alone?',
            difficulty: 'medium',
            answer: `<p><strong>Continuous verification</strong> means trust is never permanent: instead of authenticating once and trusting for the whole session, the system re-evaluates trust on an ongoing basis using changing signals — device posture, location, sign-in risk, and behavioral anomalies.</p>
            <p>Plain token expiry is coarse: a 1-hour access token remains valid for up to an hour <em>even if the user's account is disabled, the device falls out of compliance, or impossible travel is detected</em>. <strong>Continuous Access Evaluation (CAE)</strong> closes that gap by letting the identity provider push revocation/critical events so resource servers can reject a still-unexpired token near-real-time when conditions change.</p>
            <p>In practice you combine both: short-lived tokens limit the default window, and CAE plus risk-based step-up auth react immediately to high-risk changes (e.g., force re-auth on a risky sign-in) without re-challenging every low-risk action.</p>`,
            explanation: 'A normal token is a day pass that works until it expires no matter what. Continuous verification is a security guard who keeps glancing at your badge and behavior, and can pull your access the instant something looks wrong, rather than waiting for the pass to time out.',
            bestPractices: ['Use short-lived access tokens as the baseline window', 'Adopt CAE so revocation/critical events take effect near-real-time', 'Re-evaluate on signal changes (device compliance, sign-in risk, location)', 'Apply risk-based step-up auth only when risk is elevated'],
            commonMistakes: ['Relying solely on token expiry for revocation', 'Long-lived tokens that keep access after an account is disabled', 'Re-challenging every action and destroying usability', 'Ignoring device-posture/behavioral signals in access decisions'],
            interviewTip: 'Contrast "valid until it expires" with "re-evaluated on changing signals," and name CAE as the mechanism that revokes a still-unexpired token when conditions change.',
            followUp: ['Why are short-lived tokens not enough on their own?', 'What signals would trigger a step-up auth challenge?'],
            seniorPerspective: 'The gap people miss is the window between "we disabled the account" and "the token actually stops working." Without continuous access evaluation that window is the full token lifetime, which for a fired employee or a compromised session is unacceptable. I pair short tokens with CAE so critical events — account disable, password reset, detected risk — propagate as near-real-time rejections, and I tune the risk engine so the common, low-risk path stays frictionless while only anomalies trigger re-auth.'
        },
        {
            question: 'How does mutual TLS provide workload identity, and why is it central to Zero Trust for service-to-service traffic?',
            difficulty: 'hard',
            answer: `<p>In Zero Trust, a service is not trusted just because it is "inside the cluster" — every call must prove <em>who</em> is calling. <strong>Mutual TLS (mTLS)</strong> achieves this: both client and server present X.509 certificates, so each call is cryptographically bound to a verifiable <strong>workload identity</strong> (e.g., a SPIFFE ID / service account), not just a network address that can be spoofed.</p>
            <p>This is central because:</p>
            <ul>
                <li><strong>Identity-based authorization:</strong> policies can say "order-service may call payment-service POST /charge" by verified identity, enabling default-deny.</li>
                <li><strong>Encryption in transit</strong> for all east-west traffic, supporting "assume breach."</li>
                <li><strong>No implicit network trust:</strong> a compromised host without a valid workload cert cannot call protected services, blocking lateral movement.</li>
            </ul>
            <p>A <strong>service mesh</strong> (Istio, Linkerd) typically automates this — issuing, rotating, and validating short-lived certs via sidecars — so developers get mTLS and identity without hand-rolling certificate management.</p>`,
            explanation: 'Network-location trust is letting anyone wearing a company lanyard into any room. mTLS is requiring a cryptographic ID badge that the door verifies on both sides every time — and the badges expire and reissue constantly, so a stolen one is useless fast.',
            code: `# Istio: enforce strict mTLS + identity-based, default-deny authorization
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata: { name: default, namespace: prod }
spec:
  mtls: { mode: STRICT }          # all in-mesh traffic must use mTLS
---
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata: { name: payment-allow-order, namespace: prod }
spec:
  selector: { matchLabels: { app: payment-service } }
  action: ALLOW
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/prod/sa/order-service"]  # verified workload identity
      to:
        - operation: { methods: ["POST"], paths: ["/charge"] }
# Anything without a valid identity / not explicitly allowed is denied.`,
            language: 'yaml',
            bestPractices: ['Bind authorization to verified workload identity, not IP/hostname', 'Use a service mesh to automate cert issuance and rotation', 'Enforce STRICT mTLS so non-mesh/unidentified traffic is rejected', 'Keep workload certs short-lived and auto-rotated'],
            commonMistakes: ['Authorizing by network location instead of identity', 'Permissive mTLS mode that silently allows plaintext', 'Manually managing long-lived service certs (rotation failures)', 'Encrypting traffic but skipping identity-based authz (default allow)'],
            interviewTip: 'Stress that mTLS gives cryptographic workload identity for default-deny authz, and that a mesh automates the otherwise painful certificate lifecycle.',
            followUp: ['What is SPIFFE/SPIRE?', 'How does permissive vs strict mTLS mode affect a migration?'],
            seniorPerspective: 'The reason mTLS matters in Zero Trust is that it replaces "trust the network" with "trust a verifiable identity," and that single shift is what actually stops lateral movement inside a cluster. I always roll it out via a mesh in permissive mode first so existing plaintext traffic keeps working while I observe what would break, then flip to strict — the same monitor-before-enforce discipline that prevents self-inflicted outages. Hand-rolled service certificates are a trap because the rotation eventually fails at 3am; let the mesh own the certificate lifecycle.'
        },
        {
            question: 'What does "assume breach" mean as a design principle, and how does it change architecture and operations?',
            difficulty: 'advanced',
            answer: `<p><strong>Assume breach</strong> is the mindset that an attacker is already inside — a credential is compromised, a host is owned, a dependency is malicious — so you design to <em>limit and detect</em> damage rather than only to keep attackers out. It is the operational core of Zero Trust.</p>
            <p>It changes architecture and operations concretely:</p>
            <ul>
                <li><strong>Minimize blast radius:</strong> least privilege, microsegmentation, and short-lived, scoped credentials so a single compromise reaches little.</li>
                <li><strong>Encrypt everywhere:</strong> data in transit (mTLS) and at rest, so a breached segment yields little usable data.</li>
                <li><strong>Comprehensive logging + detection:</strong> log every access decision and watch for lateral movement and anomalies — you must be able to <em>see</em> the breach.</li>
                <li><strong>No standing privilege:</strong> just-in-time, audited elevation instead of permanent admin to attack.</li>
                <li><strong>Rehearse response:</strong> incident runbooks, blast-radius drills, and the ability to revoke fast (CAE, key rotation).</li>
            </ul>
            <p>The shift is from a binary "are they in or out?" to "when they get in, how little can they do and how fast do we know?"</p>`,
            explanation: 'Perimeter thinking is a bank that only invests in a strong front door. Assume-breach is a bank that also builds internal vaults, compartmentalizes the cash, films every room, and drills for robbery — accepting that someone will eventually get past the door and ensuring that getting in is not the same as getting the money.',
            bestPractices: ['Design for least privilege and microsegmentation to bound blast radius', 'Encrypt in transit and at rest by default', 'Log every access decision and alert on lateral-movement signals', 'Replace standing admin with just-in-time, audited elevation', 'Rehearse incident response and fast revocation'],
            commonMistakes: ['Investing only in perimeter defense ("keep them out")', 'Flat trust internally so one compromise reaches everything', 'Insufficient logging — breaches go undetected for months', 'Standing privileged accounts that become the prime target'],
            interviewTip: 'Define it as "design as if the attacker is already inside," then list the concrete controls (least privilege, segmentation, encryption, logging) that shrink blast radius and improve detection.',
            followUp: ['How does assume breach change your logging strategy?', 'How does it relate to limiting blast radius?'],
            seniorPerspective: 'Assume breach is what separates teams that recover gracefully from teams that make headlines. The practical test I apply is: "if this one service account leaks tonight, what can the attacker actually reach, and how long until an alert fires?" If the honest answer is "most of the environment" or "we probably would not notice," the architecture has failed regardless of how strong the perimeter is. So I push hardest on least privilege, segmentation, and detection coverage, because those are the controls that convert a catastrophic breach into a contained, observable incident.',
            architectPerspective: 'Architecturally, assume breach reframes every trust boundary as a containment boundary. I design each service, segment, and credential to be independently revocable with the smallest possible reach, and I treat audit logging of access decisions as a first-class, non-optional subsystem rather than an add-on. The goal is that the security posture degrades gracefully: a compromise anywhere becomes a bounded, detectable, recoverable event instead of a single point of total failure.'
        },
        {
            question: 'How does mTLS (mutual TLS) implement Zero Trust for service-to-service communication?',
            difficulty: 'hard',
            answer: `<p><strong>Mutual TLS (mTLS)</strong> requires BOTH sides of a connection to present and verify cryptographic certificates, not just the server (as in standard TLS). In a Zero Trust service mesh, this ensures every service-to-service call is authenticated by cryptographic identity, not by network location.</p>
<h4>How it works:</h4>
<ol>
<li><strong>Certificate issuance:</strong> Each service/workload gets a short-lived X.509 certificate from an internal CA (e.g., SPIFFE/SPIRE, Istio Citadel). The certificate encodes the service identity.</li>
<li><strong>Connection establishment:</strong> When Service A calls Service B, both present their certificates. A verifies B is who it claims, AND B verifies A is who it claims.</li>
<li><strong>Policy enforcement:</strong> After identity is established, an authorization policy decides if A is allowed to call B on this specific path/method. Identity + policy replaces "is it from inside the cluster?"</li>
<li><strong>Short-lived certs:</strong> Certificates rotate automatically (every few hours), so a stolen cert expires quickly without requiring manual revocation.</li>
</ol>
<h4>Zero Trust implications:</h4>
<ul>
<li><strong>No implicit trust:</strong> Even pods on the same node/namespace must prove identity</li>
<li><strong>Lateral movement blocked:</strong> A compromised pod cannot impersonate another service — it only has ITS certificate</li>
<li><strong>Default deny:</strong> Without a matching authorization policy, the connection is rejected even if mTLS succeeds (identity verified but not authorized)</li>
</ul>
<p><strong>Service mesh implementation:</strong> In Istio/Linkerd, sidecar proxies handle mTLS transparently — application code makes plain HTTP calls, the sidecar encrypts and verifies. Teams get Zero Trust without changing application code.</p>`,
            bestPractices: ['Short-lived auto-rotated certificates (hours, not years)', 'mTLS for identity + separate authorization policy for access control', 'Service mesh for transparent enforcement (no app code changes)', 'Default deny: even verified identity must pass an authorization policy'],
            commonMistakes: ['Long-lived certificates that are never rotated (a stolen cert is valid forever)', 'mTLS only (authentication without authorization — any verified service can call anything)', 'Disabling mTLS for "internal" services because "they are trusted" (defeats Zero Trust)', 'Not handling certificate rotation failures (service goes down when cert expires)'],
            interviewTip: 'Distinguish mTLS (identity/authentication) from authorization policy (access control). Both are needed — mTLS alone proves WHO, not whether they SHOULD. Mentioning SPIFFE/SPIRE and short-lived certs shows depth.',
            followUp: ['How do you handle mTLS for services that cannot run a sidecar?', 'What is SPIFFE and how does it standardize workload identity?']
        },
        {
            question: 'What is microsegmentation and how do you implement it in a Kubernetes environment?',
            difficulty: 'hard',
            answer: `<p><strong>Microsegmentation</strong> divides the network into small, isolated zones with per-zone access policies, so a breach in one zone cannot spread laterally to others. In Kubernetes, this is implemented via Network Policies and/or service mesh authorization.</p>
<h4>Kubernetes Network Policies:</h4>
<pre><code># Default deny all ingress in a namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: payments
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
  # No ingress/egress rules = deny everything by default

---
# Allow only order-service to reach payment-service on port 8080
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-order-to-payment
  namespace: payments
spec:
  podSelector:
    matchLabels: { app: payment-service }
  ingress:
    - from:
        - namespaceSelector:
            matchLabels: { name: orders }
          podSelector:
            matchLabels: { app: order-service }
      ports:
        - port: 8080</code></pre>
<h4>Layers of segmentation:</h4>
<ul>
<li><strong>Namespace isolation:</strong> Each team/domain gets a namespace with default-deny</li>
<li><strong>Network Policies:</strong> L3/L4 rules (pod-to-pod, port-level)</li>
<li><strong>Service Mesh AuthZ:</strong> L7 rules (identity + path + method) on top of network policies</li>
</ul>
<h4>Implementation approach:</h4>
<ol>
<li><strong>Observe:</strong> Deploy in monitor/log mode first — discover actual traffic patterns</li>
<li><strong>Baseline:</strong> Create policies matching observed legitimate traffic</li>
<li><strong>Enforce:</strong> Enable deny-by-default after confirming policies cover all legitimate flows</li>
<li><strong>Iterate:</strong> New services require explicit policy additions (forces teams to think about dependencies)</li>
</ol>
<p><strong>Key principle:</strong> Start with default-deny per namespace. Legitimate communication requires an explicit allow policy — this flips the mental model from "everything can talk" to "nothing can talk unless explicitly permitted."</p>`,
            bestPractices: ['Default-deny in every namespace as the baseline', 'Observe traffic patterns BEFORE enforcing (avoid self-inflicted outages)', 'Layer Network Policies (L3/L4) with service mesh AuthZ (L7) for defense in depth', 'Require explicit allow policies for new services (forces dependency documentation)'],
            commonMistakes: ['No Network Policies at all (flat network, any pod can reach any pod)', 'Enforcing deny-all before understanding traffic patterns (breaks legitimate flows)', 'Only namespace-level isolation without pod-level policies (too coarse)', 'Not testing that policies actually block unauthorized traffic (purple team exercises)'],
            interviewTip: 'Show the YAML for default-deny + explicit allow. The key insight is "observe → baseline → enforce" to avoid breaking things. Mentioning L3/L4 (Network Policy) + L7 (mesh AuthZ) layering shows comprehensive understanding.',
            followUp: ['How do you handle traffic that needs to cross namespace boundaries?', 'What is the difference between Network Policy and Istio AuthorizationPolicy?']
        }
    ]
});
