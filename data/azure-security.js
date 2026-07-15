/* ═══════════════════════════════════════════════════════════════════
   Azure — Security & Identity: Key Vault, Managed Identity, Entra ID
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('azure-security', {
    title: 'Azure Security & Identity',
    description: 'Azure Key Vault, Managed Identity, Entra ID (Azure AD), RBAC, Private Endpoints, and zero-trust security patterns for cloud-native applications.',
    sections: [
        {
            title: 'Key Vault & Managed Identity',
            content: `<p><strong>Key Vault</strong> stores secrets, certificates, and encryption keys securely. <strong>Managed Identity</strong> eliminates credentials entirely — Azure services authenticate to each other without any secrets in code or config.</p>`,
            code: `// Managed Identity — NO credentials anywhere!
// Azure assigns an identity to your App Service/VM/Function
// That identity authenticates to other Azure services via Azure AD tokens

// Access Key Vault with Managed Identity (zero secrets in config):
builder.Configuration.AddAzureKeyVault(
    new Uri("https://myvault.vault.azure.net/"),
    new DefaultAzureCredential() // Auto-uses Managed Identity in Azure, dev credentials locally
);

// Access SQL Database with Managed Identity (no connection string password!):
// Connection string: "Server=myserver.database.windows.net;Database=mydb;Authentication=Active Directory Managed Identity"
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString)); // No password needed!

// Access Blob Storage with Managed Identity:
var blobClient = new BlobServiceClient(
    new Uri("https://mystorage.blob.core.windows.net"),
    new DefaultAzureCredential());

// DefaultAzureCredential tries (in order):
// 1. Environment variables (CI/CD)
// 2. Workload Identity (AKS)
// 3. Managed Identity (App Service, VM, Functions)
// 4. Visual Studio / Azure CLI credentials (local dev)
// Result: same code works everywhere without changes!

// RBAC (Role-Based Access Control):
// Grant minimum permissions via Azure roles:
// App Service → "Key Vault Secrets User" (read secrets only)
// App Service → "Storage Blob Data Reader" (read blobs only)
// Never use access keys or connection strings with credentials in production`,
            language: 'csharp'
        },
        {
            title: 'Network Security & Zero Trust',
            content: `<p>Azure network security follows <strong>zero trust</strong>: never trust, always verify. Private Endpoints, NSGs, and service firewalls ensure services are not exposed to the public internet.</p>`,
            code: `// PRIVATE ENDPOINTS — Azure services accessible only via private IP
// SQL Database: accessible only from your VNET (no public IP)
// Key Vault: accessible only from your VNET
// Storage: accessible only from your VNET
// Result: even if credentials leak, service is unreachable from internet

// Architecture: 
// App Service (VNET integrated) → Private Endpoint → SQL Database
//                                → Private Endpoint → Key Vault
//                                → Private Endpoint → Storage
// All traffic stays on Microsoft backbone — never touches public internet

// Network Security Groups (NSG) — firewall rules on subnets:
// Allow: App subnet → DB subnet on port 1433
// Deny: Everything else
// Principle: default-deny, explicit-allow

// Service-level firewalls:
// SQL Database: "Allow Azure services" + specific IPs
// Key Vault: "Allow only VNET X" 
// Storage: "Allow only from Private Endpoints"

// Zero Trust checklist for Azure:
// 1. Managed Identity everywhere (no credentials)
// 2. Private Endpoints for all data services
// 3. RBAC with least privilege (no Owner/Contributor for apps)
// 4. Network segmentation (VNETs, NSGs, subnets)
// 5. Encryption: at rest (default), in transit (TLS 1.3)
// 6. Audit logging (Azure Monitor, Defender for Cloud)
// 7. Conditional Access policies (location, device, risk-based)`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'What is Managed Identity and why should you use it instead of connection strings with credentials?',
            difficulty: 'medium',
            answer: `<p><strong>Managed Identity</strong> is an Azure-assigned identity for your service that authenticates to other Azure services via Azure AD tokens — with zero credentials in code, config, or environment variables. It eliminates the #1 cause of breaches: leaked/hardcoded credentials.</p>`,
            bestPractices: ['Use Managed Identity for ALL Azure-to-Azure authentication', 'Use DefaultAzureCredential for code that works in local dev AND production', 'Grant least-privilege RBAC roles (not access keys or connection string passwords)', 'Use Private Endpoints to restrict network access even if identity is compromised'],
            commonMistakes: ['Storing secrets in appsettings.json or environment variables in production', 'Using access keys instead of RBAC + Managed Identity', 'Granting Owner/Contributor role to applications (over-privileged)', 'Not using Private Endpoints (Managed Identity protects auth, not network exposure)'],
            interviewTip: 'Explain the security principle: credentials that do not exist cannot be leaked. Managed Identity means there IS no secret to steal. Combined with Private Endpoints (network isolation) and RBAC (least privilege), you have defense in depth.',
            followUp: ['How does DefaultAzureCredential work?', 'What is the difference between system-assigned and user-assigned Managed Identity?', 'How do you handle non-Azure services that need credentials?'],
            seniorPerspective: 'I enforce a zero-secrets policy: no connection string passwords, no API keys in config. Everything uses Managed Identity + Key Vault. For non-Azure services (Stripe, SendGrid), credentials go in Key Vault and are accessed via Managed Identity.',
            architectPerspective: 'Managed Identity + Private Endpoints + RBAC is the security trifecta for Azure. I design all new services with this from day one. Retrofitting security is 10x harder than building it in. For compliance (SOC2, HIPAA), this pattern satisfies auditors immediately.'
        }
    ,
        {
            question: 'What is the difference between system-assigned and user-assigned Managed Identity?',
            difficulty: 'medium',
            answer: `<p>A <strong>system-assigned</strong> identity is created and tied to a single resource (App Service, VM, Function); its lifecycle matches the resource \u2014 delete the resource and the identity is gone. It is simple and ideal when exactly one resource needs an identity.</p>
            <p>A <strong>user-assigned</strong> identity is a standalone Azure resource you create once and attach to many resources. It is reusable, survives independently, and lets multiple services share the same identity and RBAC assignments \u2014 useful for fleets and for pre-provisioning permissions before deployment.</p>`,
            bestPractices: ['Use system-assigned for single, self-contained resources', 'Use user-assigned when many resources need the same identity/permissions', 'Pre-create user-assigned identities so RBAC is ready before deployment (avoids race conditions)', 'Keep least-privilege RBAC regardless of identity type'],
            commonMistakes: ['Creating many system-assigned identities then duplicating RBAC for each', 'Using one user-assigned identity for everything, breaking least privilege', 'Forgetting that deleting a resource destroys its system-assigned identity and its role assignments', 'Not granting the identity any RBAC role and wondering why auth fails'],
            interviewTip: 'Lifecycle is the crux: system-assigned = 1:1 and dies with the resource; user-assigned = standalone and reusable across many resources. Tie the choice to operational scale.',
            followUp: ['How do you rotate or audit these identities?', 'Can a resource have both types at once?', 'How does this work in AKS with Workload Identity?'],
            seniorPerspective: 'For a fleet of functions sharing the same downstream permissions I use one user-assigned identity \u2014 it makes RBAC and rotation a single point of control. Isolated apps get system-assigned to keep blast radius small.',
            architectPerspective: 'The choice encodes an ownership model: system-assigned for tightly-coupled resource identity, user-assigned for shared platform identities managed centrally. At scale, user-assigned identities reduce RBAC sprawl and simplify governance.'
        },
        {
            question: 'How does DefaultAzureCredential resolve credentials across local dev and production?',
            difficulty: 'medium',
            answer: `<p><code>DefaultAzureCredential</code> tries an ordered chain of credential sources and uses the first that succeeds, so the <em>same code</em> works everywhere. The chain runs roughly: environment variables \u2192 Workload Identity (AKS) \u2192 Managed Identity (App Service/VM/Functions) \u2192 developer tools (Visual Studio, Azure CLI, Azure PowerShell).</p>
            <p>In production it lands on Managed Identity (no secrets); on a developer machine it falls through to your <code>az login</code> / IDE credentials. This removes environment-specific auth branches from code.</p>`,
            bestPractices: ['Rely on the chain instead of conditional auth code per environment', 'Ensure the prod resource has a Managed Identity with the right RBAC roles', 'Use az login / VS sign-in locally so the chain resolves cleanly', 'Pin to a specific credential type in production if startup latency or ambiguity matters'],
            commonMistakes: ['Leaving stale environment variables that hijack the chain unexpectedly', 'No RBAC role on the Managed Identity, so prod auth silently fails', 'Assuming local behavior equals prod behavior without testing the deployed path', 'Using DefaultAzureCredential in hot paths without caching the token/credential'],
            interviewTip: 'Emphasize the value: identical code in dev and prod, zero secrets. Then name a couple of links in the chain (env vars, Managed Identity, CLI) to show you understand the fallthrough.',
            followUp: ['How would you debug which credential in the chain was used?', 'Why might you prefer ManagedIdentityCredential explicitly in prod?', 'How are tokens cached and refreshed?'],
            seniorPerspective: 'I sometimes pin to ManagedIdentityCredential in production to avoid the chain probing developer tools and to make failures explicit, while keeping DefaultAzureCredential for local convenience behind a config switch.',
            architectPerspective: 'The credential chain is what makes a zero-secrets posture practical for developers \u2014 security that is easy to adopt gets adopted. It standardizes auth across the whole platform without per-service custom code.'
        },
        {
            question: 'What is a Private Endpoint, and how does it differ from a Service Endpoint?',
            difficulty: 'medium',
            answer: `<p>A <strong>Private Endpoint</strong> projects an Azure PaaS service (SQL, Key Vault, Storage) into your VNET as a <em>private IP</em>; traffic never traverses the public internet and the service can be made unreachable publicly. It works across VNETs, regions, and even on-prem via ExpressRoute/VPN.</p>
            <p>A <strong>Service Endpoint</strong> instead optimizes the route from a subnet to the public endpoint of an Azure service and lets the service firewall trust that subnet \u2014 but the service still has a public IP and the traffic uses the service\u2019s public endpoint over the Azure backbone. Private Endpoint provides stronger isolation; Service Endpoint is simpler but less isolated.</p>`,
            bestPractices: ['Use Private Endpoints for data services in production (full network isolation)', 'Disable public network access on the PaaS resource once Private Endpoint is in place', 'Plan private DNS zones so names resolve to the private IP', 'Use Service Endpoints only when private IP isolation is not required'],
            commonMistakes: ['Assuming Managed Identity alone protects a service (it secures auth, not network exposure)', 'Forgetting private DNS, so clients still resolve the public IP', 'Leaving public access enabled alongside the Private Endpoint', 'Confusing Service Endpoint (still public IP) with true private connectivity'],
            interviewTip: 'The one-liner: Private Endpoint gives the service a private IP in your VNET; Service Endpoint just secures/optimizes access to its public endpoint. Mention private DNS as the common gotcha.',
            followUp: ['Why is private DNS required with Private Endpoints?', 'How do Private Endpoints work cross-region or to on-prem?', 'What are the cost differences between the two?'],
            seniorPerspective: 'I standardize on Private Endpoints plus disabled public access for all data services, and I treat private DNS zones as part of the landing-zone setup so teams do not trip over name resolution.',
            architectPerspective: 'Private Endpoints are the backbone of a zero-trust network in Azure: combined with Managed Identity (auth) and RBAC (authorization), they ensure that even leaked credentials cannot reach a service from the internet \u2014 defense in depth.'
        },
        {
            question: 'What does Azure Key Vault store, and how do soft-delete, purge protection, and rotation protect you?',
            difficulty: 'advanced',
            answer: `<p>Key Vault holds three object types: <strong>secrets</strong> (connection strings, API keys), <strong>keys</strong> (asymmetric/symmetric keys for encryption/signing, optionally HSM-backed), and <strong>certificates</strong> (TLS certs with lifecycle and auto-renewal via integrated CAs).</p>
            <p><strong>Soft-delete</strong> keeps deleted objects (and the vault) recoverable for a retention period, preventing accidental or malicious permanent loss. <strong>Purge protection</strong> goes further: during retention nobody \u2014 not even an admin \u2014 can hard-delete, defeating a "delete then purge" attack. <strong>Rotation</strong> (automatic for supported secrets/keys, or event-driven via Event Grid) limits the blast radius of a leaked credential by expiring it on a schedule.</p>`,
            code: `# Enable soft-delete + purge protection, then set a rotation policy (Azure CLI)
az keyvault update --name myvault --enable-purge-protection true

az keyvault key rotation-policy update --vault-name myvault --name mykey \
  --value '{"lifetimeActions":[{"trigger":{"timeAfterCreate":"P60D"},
            "action":{"type":"Rotate"}}],
            "attributes":{"expiryTime":"P90D"}}'`,
            language: 'bash',
            bestPractices: ['Enable soft-delete and purge protection on production vaults (often org policy)', 'Reference secrets from Key Vault at runtime via Managed Identity, never copy them into config', 'Automate certificate renewal and key/secret rotation rather than rotating manually', 'Separate vaults (or RBAC scopes) per environment to limit blast radius'],
            commonMistakes: ['Disabling purge protection, leaving a delete-then-purge attack path open', 'Caching secrets at startup and never refreshing after rotation, causing auth failures', 'Storing secrets in app config "just for now" and bypassing the vault entirely', 'Granting broad vault access instead of scoped, least-privilege roles'],
            interviewTip: 'Cover all three object types (secrets/keys/certificates), then explain soft-delete vs purge protection as two distinct safeguards: recoverability vs tamper-resistance. Tie rotation to limiting the lifetime of a leaked credential.',
            followUp: ['How do you refresh a cached secret after rotation without downtime?', 'When would you use an HSM-backed (Premium) key?', 'How does Key Vault integrate certificate auto-renewal?'],
            seniorPerspective: 'The subtle production bug is rotation breaking apps that cached a secret at startup. I wire secret refresh (or short-lived reloads) so rotation is a non-event, and I always turn on purge protection because recovering from an accidental purge is not possible.',
            architectPerspective: 'Key Vault centralizes secret material so access is audited, rotated, and revocable in one place. Combined with Managed Identity to fetch secrets without bootstrapping a credential, it closes the "secret zero" problem and makes rotation an operational routine rather than a risky event.'
        },
        {
            question: 'How does Azure RBAC enforce least privilege, and how does it differ from Key Vault access policies?',
            difficulty: 'hard',
            answer: `<p><strong>Azure RBAC</strong> grants access by assigning a <em>role</em> (a set of allowed actions) to a <em>principal</em> (user, group, service principal, or managed identity) at a <em>scope</em> (management group, subscription, resource group, or single resource). Permissions inherit downward, so least privilege means granting the narrowest role at the smallest scope that still works \u2014 e.g., "Key Vault Secrets User" on one vault, not Contributor on the subscription.</p>
            <p>Key Vault historically used its own <strong>access policies</strong>: a vault-level list granting principals coarse permission groups (get/list/set secrets) for the <em>whole</em> vault, with no inheritance and no per-secret scoping. The modern recommendation is the <strong>RBAC permission model</strong> for Key Vault, which unifies vault access with Azure RBAC, supports per-secret scope, and integrates with PIM/conditional access \u2014 at the cost of slightly coarser-grained built-in roles.</p>`,
            bestPractices: ['Assign the most specific built-in role at the smallest scope; avoid Owner/Contributor for apps', 'Prefer the Key Vault RBAC model over legacy access policies for consistency and per-secret scope', 'Assign roles to Entra groups or managed identities, not individual users, for manageable governance', 'Use PIM for just-in-time elevation of privileged roles instead of standing access'],
            commonMistakes: ['Granting Contributor "to make it work" \u2014 massive over-privilege', 'Mixing RBAC and access policies on one vault and getting confused about effective access', 'Assigning roles at subscription scope when a resource-group or resource scope suffices', 'Giving apps management-plane roles when they only need data-plane access'],
            interviewTip: 'Nail the RBAC triple: role + principal + scope, with inheritance. Then contrast with Key Vault access policies (vault-wide, flat, no inheritance) and state that the RBAC model is now preferred. Mentioning PIM/JIT signals security maturity.',
            followUp: ['What is the difference between control-plane and data-plane RBAC for Key Vault?', 'How does PIM reduce standing privilege?', 'Why assign roles to groups instead of users?'],
            seniorPerspective: 'I standardize new vaults on the RBAC model so access lives in one system, assign data-plane roles to managed identities at the vault scope, and reserve any standing admin access behind PIM. Mixing legacy access policies with RBAC is where teams accidentally over-grant.',
            architectPerspective: 'RBAC is the authorization half of zero trust (Managed Identity authenticates, RBAC authorizes, Private Endpoints isolate the network). Designing role assignments by scope and using groups/PIM keeps least privilege maintainable as the estate grows, instead of decaying into broad, unaudited grants.'
        }
    ,
        {
            question: 'Explain Entra ID (Azure AD) app registrations, OAuth flows, and Conditional Access at a high level.',
            difficulty: 'advanced',
            answer: `<p><strong>Microsoft Entra ID</strong> is the identity provider. An <strong>app registration</strong> defines an application identity: its client ID, redirect URIs, secrets/certificates, exposed scopes/roles, and API permissions. Apps obtain tokens via OAuth 2.0 / OIDC flows:</p>
            <ul>
                <li><strong>Authorization Code + PKCE</strong> \u2014 interactive user sign-in for web/SPA/mobile.</li>
                <li><strong>Client Credentials</strong> \u2014 service-to-service (daemon) with no user, app authenticates as itself.</li>
                <li><strong>On-Behalf-Of</strong> \u2014 an API calls a downstream API preserving the user\u2019s identity.</li>
            </ul>
            <p><strong>Conditional Access</strong> evaluates signals (user, device compliance, location, sign-in risk) at authentication time and enforces controls \u2014 require MFA, compliant device, or block \u2014 implementing risk-based, zero-trust access without app code changes.</p>`,
            explanation: 'The app registration is the application\u2019s ID badge and the list of doors it may request. OAuth flows are the different ways to get a day-pass (user present vs machine alone). Conditional Access is the security desk that, based on who/where/what device, may demand extra proof (MFA) or refuse entry.',
            bestPractices: ['Use Authorization Code + PKCE for user apps, Client Credentials for daemons', 'Prefer certificates or managed identity over client secrets where possible', 'Grant least-privilege API permissions/scopes and use app roles for authorization', 'Enforce MFA and device compliance via Conditional Access, not app code'],
            commonMistakes: ['Using Client Credentials where a user context (On-Behalf-Of) is required', 'Long-lived client secrets in config instead of certs/managed identity', 'Over-broad API permissions / admin consent for everything', 'Implementing access rules in code that Conditional Access should enforce centrally'],
            interviewTip: 'Map each OAuth flow to a scenario (user sign-in \u2192 code+PKCE, daemon \u2192 client credentials, API\u2192API with user \u2192 OBO). Mentioning Conditional Access as policy-driven, code-free enforcement signals real Entra experience.',
            followUp: ['When do you use On-Behalf-Of vs client credentials?', 'How does managed identity remove the secret entirely?', 'What signals can Conditional Access evaluate?'],
            seniorPerspective: 'I push every service-to-service call toward managed identity so there is no secret to leak, and I keep authorization in app roles + Conditional Access rather than scattered code checks. The OBO flow is the one teams most often get wrong, defaulting to client credentials and losing the user context.',
            architectPerspective: 'Centralizing identity in Entra with Conditional Access makes access a policy decision evaluated consistently across every app, which is the backbone of zero trust. App code should consume tokens and check roles, not reimplement authentication or risk evaluation.'
        },
        {
            question: 'What is Microsoft Defender for Cloud, and how does it support a zero-trust security posture in Azure?',
            difficulty: 'medium',
            answer: `<p><strong>Defender for Cloud</strong> is Azure\u2019s cloud security posture management (CSPM) + workload protection (CWPP) service. It continuously assesses your resources against security benchmarks, produces a <strong>Secure Score</strong>, surfaces misconfigurations with remediation steps, and (with Defender plans enabled) provides threat detection for VMs, databases, storage, containers, Key Vault, etc.</p>
            <p>It supports zero trust by making posture <em>measurable and continuous</em>: flagging public exposure, missing encryption, over-privileged access, and unpatched resources; integrating with Microsoft Sentinel (SIEM) for detection/response; and aligning resources to regulatory standards. Combined with Managed Identity (auth), RBAC (least privilege), and Private Endpoints (network isolation), it provides the monitoring/verification layer of "never trust, always verify."</p>`,
            explanation: 'Defender for Cloud is the continuous security inspector for your cloud estate: it walks the building daily, scores how locked-down you are, points at the propped-open doors with instructions to fix them, and raises an alarm when it sees a break-in attempt.',
            bestPractices: ['Track and drive up Secure Score; treat recommendations as a prioritized backlog', 'Enable Defender plans for high-value workloads (SQL, storage, containers, Key Vault)', 'Integrate with Sentinel for centralized detection and response', 'Use it to enforce regulatory/benchmark compliance continuously, not as a one-off audit'],
            commonMistakes: ['Treating Secure Score as vanity rather than acting on recommendations', 'Leaving Defender plans off for sensitive workloads (no threat detection)', 'Ignoring alerts due to no triage process (alert fatigue)', 'Assuming posture management replaces design-time controls (identity, network, RBAC)'],
            interviewTip: 'Distinguish CSPM (posture/Secure Score/misconfig) from CWPP (threat detection), and position Defender as the continuous verification layer of zero trust alongside identity, RBAC, and network isolation.',
            followUp: ['What is the difference between CSPM and CWPP?', 'How does Defender integrate with Sentinel?', 'How does Secure Score prioritize remediation?'],
            seniorPerspective: 'I use Secure Score as a living backlog, not a trophy \u2014 the recommendations map directly to real exposure (public storage, missing encryption, over-broad RBAC). The value is continuous detection of drift, since secure-at-deploy quietly decays as people make changes.',
            architectPerspective: 'Defender provides the "always verify" telemetry of zero trust: design-time controls (identity, least-privilege RBAC, Private Endpoints) set the posture, and continuous CSPM/CWPP detects when reality drifts from intent. Both halves are needed \u2014 strong design plus continuous verification.'
        }
    ],
    extraSections: [
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Shared keys instead of Managed Identity</strong>: Connection strings with keys in config files get leaked. Managed Identity eliminates secrets entirely.</li>
                <li><strong>Over-broad RBAC assignments</strong>: Granting Contributor at subscription level. Use least privilege — specific role at specific resource scope.</li>
                <li><strong>Key Vault access for everyone</strong>: Access policies too permissive. Use RBAC on Key Vault and audit access logs.</li>
                <li><strong>No network isolation</strong>: PaaS resources with public endpoints when only internal services need access. Use Private Endpoints.</li>
                <li><strong>Secrets in code/config</strong>: Connection strings, API keys hardcoded. Use Key Vault references in App Service/Functions configuration.</li>
                <li><strong>No conditional access</strong>: Users can access resources from any device/location. Apply conditional access policies (MFA, compliant device, location).</li>
                <li><strong>Ignoring Secure Score</strong>: Azure Defender recommendations accumulate without action. Treat Secure Score as a living backlog.</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Managed Identity: eliminate secrets. Workloads authenticate to Azure services via system/user-assigned identity — no keys to rotate.</li>
                <li>Key Vault: centralized secret/key/certificate management. Never store secrets in code. Use Key Vault references.</li>
                <li>Entra ID (Azure AD): identity provider for users, apps, and service principals. Foundation of all Azure auth.</li>
                <li>RBAC: role-based access control at management, subscription, resource group, or resource scope. Least privilege always.</li>
                <li>Private Endpoints: access PaaS services over private IP inside your VNet. No public internet exposure.</li>
                <li>Defender for Cloud: CSPM (posture) + CWPP (workload protection). Continuous assessment, not point-in-time.</li>
                <li>Zero Trust in Azure: identity-first, verify explicitly, least privilege, assume breach. Design + continuous verification.</li>
            </ul>`
        }
    ]
});
