/* ═══════════════════════════════════════════════════════════════════
   Networking & Infrastructure — CDN, Service Mesh & Production
   Reverse proxy, CDN, service mesh, Kubernetes networking,
   VPC/VNet, and real production networking scenarios.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('networking-production', {
    title: 'CDN, Service Mesh & Production Scenarios',
    description: 'Production networking: reverse proxies (Nginx, YARP), CDN (Cloudflare, Front Door), service mesh (Istio, Linkerd), Kubernetes networking (Ingress, Services, Network Policies), cloud VPC/VNet design, and real production debugging scenarios.',
    difficulty: 'advanced',
    estimatedMinutes: 45,
    prerequisites: ['networking-fundamentals'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Production networking goes beyond fundamentals into infrastructure that keeps systems reliable at scale. This section covers the components between your users and your code: reverse proxies, CDNs, service meshes, and Kubernetes networking &mdash; plus real production scenarios you will encounter and be asked about in interviews.</p>`
        },
        {
            title: 'Reverse Proxy',
            content: `<p>A <strong>reverse proxy</strong> sits in front of your backend servers, handling concerns your application should not:</p>
            <ul>
                <li><strong>SSL termination</strong> &mdash; Decrypt TLS, forward plain HTTP to backends</li>
                <li><strong>Load balancing</strong> &mdash; Distribute across multiple backend instances</li>
                <li><strong>Caching</strong> &mdash; Cache static/semi-static responses at the edge</li>
                <li><strong>Compression</strong> &mdash; Gzip/Brotli responses before sending to client</li>
                <li><strong>Rate limiting</strong> &mdash; Protect backends from traffic spikes</li>
                <li><strong>Request routing</strong> &mdash; Path-based routing to different backends</li>
            </ul>`,
            table: {
                headers: ['Proxy', 'Strengths', 'Best For'],
                rows: [
                    ['Nginx', 'Battle-tested, high performance, huge ecosystem', 'General purpose, static files, Linux environments'],
                    ['YARP (.NET)', 'Native .NET, programmable, middleware integration', '.NET apps needing custom routing logic'],
                    ['HAProxy', 'Extreme performance, L4+L7, detailed metrics', 'High-throughput TCP/HTTP, database proxying'],
                    ['Azure Application Gateway', 'Managed, WAF built-in, Azure-native', 'Azure workloads needing WAF + L7 routing'],
                    ['Envoy', 'Cloud-native, service mesh data plane, gRPC-native', 'Kubernetes service mesh (Istio data plane)'],
                    ['Traefik', 'Auto-discovery, Docker/K8s native, Let-s Encrypt', 'Container environments, auto-TLS']
                ]
            }
        },
        {
            title: 'CDN (Content Delivery Network)',
            content: `<p>CDNs cache content at edge locations (PoPs) close to users, reducing latency and offloading your origin servers.</p>
            <ul>
                <li><strong>Static content:</strong> JS, CSS, images, fonts &mdash; cache for hours/days (immutable with hash filenames)</li>
                <li><strong>Dynamic content:</strong> API responses &mdash; cache for seconds/minutes with cache-control headers</li>
                <li><strong>Edge compute:</strong> Run code at CDN edge (Cloudflare Workers, Azure Front Door Rules)</li>
            </ul>`,
            table: {
                headers: ['CDN', 'Key Feature', 'Best For'],
                rows: [
                    ['Cloudflare', 'Global anycast, DDoS protection, Workers (edge compute)', 'Most web applications, security-first'],
                    ['Azure Front Door', 'Azure-native, WAF, global routing, caching', 'Azure workloads, multi-region'],
                    ['AWS CloudFront', 'Lambda@Edge, S3 origin integration', 'AWS workloads, serverless at edge'],
                    ['Akamai', 'Largest network, enterprise, media streaming', 'Large enterprises, video delivery'],
                    ['Fastly', 'Instant purge, VCL/Compute@Edge, real-time logs', 'Dynamic content, instant invalidation needs']
                ]
            },
            callout: { type: 'tip', title: 'Interview Pattern', text: 'When discussing CDN in system design: mention cache invalidation strategy (TTL vs purge vs versioned URLs), handling of authenticated content (vary by auth header or bypass cache), and edge compute for personalization.' }
        },
        {
            title: 'Service Mesh',
            content: `<p>A <strong>service mesh</strong> handles service-to-service communication concerns (mTLS, retries, observability) transparently via sidecar proxies, removing this logic from application code.</p>
            <ul>
                <li><strong>Data plane</strong> &mdash; Sidecar proxies (Envoy) intercept all traffic to/from each pod</li>
                <li><strong>Control plane</strong> &mdash; Configures proxies (Istio/Linkerd control plane)</li>
                <li><strong>Features:</strong> mTLS (automatic encryption), traffic splitting (canary), retries, circuit breakers, observability (traces/metrics without code changes)</li>
            </ul>`,
            table: {
                headers: ['Mesh', 'Data Plane', 'Complexity', 'Best For'],
                rows: [
                    ['Istio', 'Envoy', 'High (many CRDs, learning curve)', 'Large clusters, advanced traffic management'],
                    ['Linkerd', 'linkerd2-proxy (Rust)', 'Low (simple install, minimal config)', 'Teams wanting mesh benefits with less complexity'],
                    ['Consul Connect', 'Envoy or built-in', 'Medium', 'Multi-platform (VMs + K8s), HashiCorp ecosystem'],
                    ['None (app-level)', 'N/A', 'Low infra, high app code', 'Small clusters (< 10 services), team owns retry/TLS logic']
                ]
            },
            mermaid: `graph TD
    subgraph Pod A
        A[App Container] --> PA[Envoy Sidecar]
    end
    subgraph Pod B
        PB[Envoy Sidecar] --> B[App Container]
    end

    PA -->|"mTLS encrypted"| PB
    CP[Control Plane<br/>Istio/Linkerd] -.->|config| PA
    CP -.->|config| PB

    style PA fill:#f59e0b,color:#fff
    style PB fill:#f59e0b,color:#fff
    style CP fill:#3b82f6,color:#fff`,
            callout: { type: 'warning', title: 'When NOT to Use', text: 'Service mesh adds latency (extra proxy hop), memory (sidecar per pod), and operational complexity. Do NOT add it for < 10 services or if your team cannot maintain it. Start with application-level retries/timeouts (Polly), add mesh when you need mTLS at scale or traffic splitting without code changes.' }
        },
        {
            title: 'Kubernetes Networking',
            content: `<p>K8s networking has multiple layers. Understanding each helps debug connectivity issues:</p>`,
            table: {
                headers: ['Concept', 'Purpose', 'Access Scope'],
                rows: [
                    ['ClusterIP', 'Internal service discovery (virtual IP)', 'Within cluster only'],
                    ['NodePort', 'Expose service on each node IP:port', 'External (node IP required)'],
                    ['LoadBalancer', 'Provision cloud LB pointing to service', 'External (cloud LB IP)'],
                    ['Ingress', 'L7 HTTP routing (host/path-based) via controller', 'External (single LB, many services)'],
                    ['Network Policy', 'Firewall rules between pods (allow/deny)', 'Security (least privilege)'],
                    ['Service Mesh', 'mTLS, observability, traffic management', 'Pod-to-pod encrypted communication'],
                    ['DNS (CoreDNS)', 'Resolve service names to ClusterIPs', 'service.namespace.svc.cluster.local'],
                    ['CNI Plugin', 'Pod networking implementation (Calico, Cilium, Azure CNI)', 'Cluster infrastructure']
                ]
            }
        },
        {
            title: 'Cloud VPC/VNet Design',
            content: `<p>Virtual networks are the foundation of cloud security &mdash; segment and isolate workloads:</p>
            <ul>
                <li><strong>VPC/VNet</strong> &mdash; Isolated network (your private address space in the cloud)</li>
                <li><strong>Subnets</strong> &mdash; Public (internet-facing LB, bastion) vs Private (app servers, databases)</li>
                <li><strong>NSG/Security Groups</strong> &mdash; Firewall rules per subnet or NIC (allow port 443 from LB only)</li>
                <li><strong>NAT Gateway</strong> &mdash; Private subnets access internet (outbound only) without public IPs</li>
                <li><strong>Private Endpoints</strong> &mdash; Access PaaS services (Azure SQL, S3) over private network (no internet)</li>
                <li><strong>Peering</strong> &mdash; Connect two VPCs/VNets for cross-environment communication</li>
            </ul>`,
            mermaid: `graph TD
    subgraph VNet/VPC
        subgraph Public Subnet
            LB[Load Balancer]
            BAS[Bastion Host]
        end
        subgraph Private Subnet - App
            APP1[App Server 1]
            APP2[App Server 2]
        end
        subgraph Private Subnet - Data
            DB[(Database)]
            CACHE[(Redis)]
        end
    end

    INET[Internet] --> LB
    INET --> BAS
    LB --> APP1
    LB --> APP2
    APP1 --> DB
    APP1 --> CACHE
    NAT[NAT Gateway] --> INET
    APP1 -.->|outbound only| NAT

    style LB fill:#3b82f6,color:#fff
    style DB fill:#10b981,color:#fff`
        },
        {
            title: 'Real Production Scenarios',
            content: `<p>These are actual scenarios you will encounter and be asked about in interviews. For each: <strong>symptom, likely cause, investigation, fix.</strong></p>`,
            table: {
                headers: ['Scenario', 'Likely Cause', 'Investigation', 'Fix'],
                rows: [
                    ['Website slow only for European users', 'No CDN/edge in Europe; all traffic routes to US', 'Check latency by region (synthetic monitoring)', 'Add CDN PoPs in Europe or deploy to EU region'],
                    ['LB sends traffic to unhealthy server', 'Health check misconfigured (checks wrong endpoint or too infrequent)', 'Check LB health check config and logs', 'Fix health endpoint; reduce check interval to 5s'],
                    ['DNS propagation takes hours', 'TTL was set high (3600s) before change', 'Check old TTL value; wait for expiry', 'Lower TTL to 60s BEFORE making DNS changes, then change'],
                    ['Sticky sessions cause memory issues', 'Session data grows unbounded; one server gets all heavy users', 'Check session store size; LB distribution', 'Move sessions to Redis (shared); remove sticky sessions'],
                    ['K8s Ingress returns 502', 'Backend pods not ready (slow startup) or resource limits too low', 'kubectl describe ingress; check pod readiness', 'Add readiness probe; increase memory/CPU limits; add startup probe'],
                    ['Reverse proxy timeout', 'Backend takes longer than proxy timeout (default 60s)', 'Check proxy timeout config vs backend response time', 'Increase proxy timeout OR fix slow backend; add async processing'],
                    ['CDN serving stale data', 'Cache-Control headers too aggressive; no purge on deploy', 'Check response headers; CDN cache status', 'Use versioned URLs (hash in filename) or purge on deploy'],
                    ['API Gateway becomes bottleneck', 'Single gateway instance; no auto-scaling; too much logic in gateway', 'Check gateway CPU/memory; request queue depth', 'Scale horizontally; move business logic to services; cache at gateway'],
                    ['Redis cache misses spike', 'Key expiry thundering herd; or cache was flushed', 'Check hit/miss ratio timeline; correlate with events', 'Stagger TTLs (jitter); use cache-aside with lock; warm cache on deploy'],
                    ['SSL certificate expired', 'Auto-renewal failed silently (or was never configured)', 'openssl s_client check; cert expiry date', 'Install new cert immediately; automate renewal (cert-manager)']
                ]
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Reverse proxies handle cross-cutting concerns (TLS, caching, rate limiting) so your app does not have to</li>
                <li>CDNs reduce latency globally; use versioned URLs for cache invalidation</li>
                <li>Service mesh adds mTLS and observability transparently but has real operational cost</li>
                <li>K8s networking: ClusterIP for internal, Ingress for external L7, Network Policies for security</li>
                <li>VPC design: public subnets for LBs, private for apps/data, NAT for outbound, Private Endpoints for PaaS</li>
                <li>Production scenarios test debugging intuition; practice "symptom &rarr; likely cause &rarr; investigation" thinking</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'net-prod-q1',
            level: 'senior',
            title: 'When would you introduce a service mesh vs handling retries/mTLS in application code?',
            answer: `<p><strong>Service mesh when:</strong></p><ul><li>20+ services and you need uniform mTLS without changing each app</li><li>You want observability (distributed tracing, metrics) without instrumenting each service</li><li>You need traffic splitting for canary deployments at the infrastructure level</li><li>Security team requires mutual TLS everywhere and you cannot modify every service</li></ul><p><strong>Application-level (Polly, HttpClientFactory) when:</strong></p><ul><li>Fewer than 10 services (mesh overhead not justified)</li><li>Team cannot maintain mesh infrastructure</li><li>You need custom retry logic per endpoint (mesh retries are generic)</li><li>Latency budget is very tight (sidecar proxy adds 1-3ms per hop)</li></ul>`
        },
        {
            id: 'net-prod-q2',
            level: 'architect',
            title: 'Design the network architecture for a multi-region application on Azure.',
            answer: `<p><strong>Architecture:</strong></p><ul><li><strong>Global layer:</strong> Azure Front Door (CDN + global L7 LB + WAF) &rarr; routes to nearest healthy region</li><li><strong>Per-region:</strong> VNet with public subnet (App Gateway), private subnets (AKS cluster, databases)</li><li><strong>Cross-region:</strong> VNet peering or Azure Virtual WAN for shared services</li><li><strong>Database:</strong> Cosmos DB with multi-region writes, or Azure SQL with geo-replication (active-passive)</li><li><strong>DNS:</strong> Azure DNS with Traffic Manager profiles for failover</li><li><strong>Security:</strong> NSGs on all subnets, Private Endpoints for PaaS, no public IPs on app servers</li></ul>`,
            followUp: ['How do you handle data consistency across regions?', 'What is your failover strategy?', 'How do you test regional failure?']
        },
        {
            id: 'net-prod-q3',
            level: 'mid',
            title: 'Explain the difference between Ingress and LoadBalancer service type in Kubernetes.',
            answer: `<p><strong>LoadBalancer service:</strong> Creates one cloud load balancer per service. Each service gets its own external IP. Expensive at scale (10 services = 10 cloud LBs).</p><p><strong>Ingress:</strong> Single load balancer (Ingress Controller) routes to many services based on host/path rules. Cost-efficient (1 LB serves all services). Supports TLS termination, path-based routing, rate limiting.</p><p><strong>Decision:</strong> Use Ingress for HTTP services (99% of cases). Use LoadBalancer type for non-HTTP (TCP/UDP) services or when you need dedicated IP per service.</p>`
        },
        {
            id: 'net-prod-q4',
            level: 'senior',
            title: 'Your CDN is serving stale API responses after a deployment. How do you fix it?',
            answer: `<p><strong>Immediate fix:</strong> Purge CDN cache for affected paths (API call or CLI).</p><p><strong>Long-term prevention:</strong></p><ul><li><strong>Static assets:</strong> Use content-hashed filenames (main.a3f4b2.js) &mdash; new deploy = new URL = no stale cache</li><li><strong>API responses:</strong> Set appropriate Cache-Control headers: <code>public, max-age=60, s-maxage=300</code> (60s browser, 5min CDN)</li><li><strong>Deploy hook:</strong> Automatically purge CDN cache as part of deployment pipeline</li><li><strong>Vary header:</strong> If response varies by auth/user, add <code>Vary: Authorization</code> to prevent sharing cached authenticated responses</li></ul>`
        },
        {
            id: 'net-prod-q5',
            level: 'lead',
            title: 'How do you implement zero-trust networking for microservices?',
            answer: `<p><strong>Zero-trust principles applied:</strong></p><ul><li><strong>mTLS everywhere:</strong> Every service-to-service call encrypted + authenticated (service mesh or app-level certs)</li><li><strong>Identity-based access:</strong> Services authenticate with identity (SPIFFE/SPIRE), not network location</li><li><strong>Network policies:</strong> Default-deny all pod-to-pod traffic; explicitly allow only required paths</li><li><strong>No implicit trust:</strong> Being "inside the VPC" does not grant access to anything</li><li><strong>Least privilege:</strong> Each service can only reach the specific services it needs</li><li><strong>Continuous verification:</strong> Re-authenticate on every request (short-lived tokens, not long-lived API keys)</li></ul>`
        },
        {
            id: 'net-prod-q6',
            level: 'mid',
            title: 'What is a NAT Gateway and why do private subnets need one?',
            answer: `<p><strong>NAT Gateway</strong> allows resources in private subnets to make outbound internet connections (download packages, call external APIs) without having public IP addresses.</p><p><strong>How it works:</strong> Private instance sends traffic to NAT Gateway (in public subnet). NAT translates the private IP to its own public IP, forwards to internet. Response comes back through NAT to the private instance.</p><p><strong>Why needed:</strong> Private subnets have no internet route by default (that is the point &mdash; isolation). But apps still need outbound access (NuGet packages, external APIs, telemetry). NAT provides outbound-only connectivity (nothing inbound from internet).</p>`
        },
        {
            id: 'net-prod-q7',
            level: 'architect',
            title: 'A Kubernetes pod cannot reach an external API. How do you debug network connectivity?',
            answer: `<p><strong>Debugging steps:</strong></p><ol><li><strong>DNS:</strong> <code>kubectl exec pod -- nslookup api.external.com</code> (does DNS resolve?)</li><li><strong>Connectivity:</strong> <code>kubectl exec pod -- curl -v https://api.external.com</code> (can we connect?)</li><li><strong>Network Policy:</strong> Check if a NetworkPolicy blocks egress from this pod/namespace</li><li><strong>NAT/Egress:</strong> Verify NAT Gateway exists and route table has 0.0.0.0/0 &rarr; NAT</li><li><strong>Firewall/NSG:</strong> Check if cloud firewall (NSG, Security Group) allows outbound on port 443</li><li><strong>Proxy:</strong> Check if cluster requires HTTP_PROXY for outbound (corporate environments)</li><li><strong>Service mesh:</strong> If Istio installed, check if egress is blocked by default (needs ServiceEntry)</li></ol>`,
            interviewTip: 'Walk through this systematically in interviews: DNS first, then connectivity, then firewall rules. Shows methodical debugging rather than random guessing.'
        },
        {
            id: 'net-prod-q8',
            level: 'senior',
            title: 'Compare Azure Front Door, Application Gateway, and Azure Load Balancer.',
            answer: `<p><strong>Three different scopes:</strong></p><ul><li><strong>Azure Load Balancer (L4):</strong> Regional, TCP/UDP level, fast, no HTTP inspection. Use for: internal service LB, non-HTTP protocols, database HA.</li><li><strong>Application Gateway (L7):</strong> Regional, HTTP-aware, WAF, path routing, SSL termination. Use for: regional web apps needing WAF + L7 routing.</li><li><strong>Azure Front Door (Global L7):</strong> Global anycast, CDN + LB + WAF, multi-region routing, caching. Use for: global applications needing edge caching + multi-region failover.</li></ul><p><strong>Common pattern:</strong> Front Door (global) &rarr; Application Gateway (regional WAF) &rarr; AKS Ingress (service routing). Or simplified: Front Door directly to AKS (skip App Gateway if WAF at Front Door suffices).</p>`
        }
    ]
});
