/* ═══════════════════════════════════════════════════════════════════
   Networking & Infrastructure — Fundamentals & Load Balancing
   OSI/TCP-IP, HTTP lifecycle, DNS, Load Balancing algorithms,
   TLS handshake, caching layers, connection pooling.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('networking-fundamentals', {
    title: 'Networking & Load Balancing',
    description: 'Networking fundamentals every backend engineer must know: OSI/TCP-IP models, HTTP request lifecycle, DNS resolution, load balancing algorithms (Round Robin, Least Connections, Consistent Hashing), TLS handshake, caching layers, and connection pooling.',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    prerequisites: ['networking-basics'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Networking knowledge is heavily tested in senior/staff/architect interviews. You do not need to be a network engineer, but you must understand how your applications communicate, scale, and fail at the network level.</p>
            <p>This section covers the networking concepts that appear in system design interviews and production debugging.</p>`
        },
        {
            title: 'HTTP Request Lifecycle',
            content: `<p>What happens when a browser hits your API:</p>`,
            mermaid: `sequenceDiagram
    participant B as Browser
    participant DNS as DNS Resolver
    participant LB as Load Balancer
    participant S as Server

    B->>DNS: Resolve api.example.com
    DNS-->>B: 203.0.113.50

    B->>LB: TCP Handshake (SYN, SYN-ACK, ACK)
    B->>LB: TLS Handshake (ClientHello, certs, keys)
    B->>LB: HTTP Request (GET /api/orders)
    LB->>S: Forward to healthy backend
    S-->>LB: HTTP Response (200 OK + JSON)
    LB-->>B: Forward response
    Note over B,S: Connection kept alive for subsequent requests (HTTP Keep-Alive)`
        },
        {
            title: 'HTTP Versions',
            content: `<p>Understanding HTTP evolution helps answer performance and protocol questions:</p>`,
            table: {
                headers: ['Version', 'Year', 'Key Features', 'Limitation'],
                rows: [
                    ['HTTP/1.0', '1996', 'One request per connection', 'New TCP handshake per request (slow)'],
                    ['HTTP/1.1', '1997', 'Keep-alive, pipelining, chunked transfer', 'Head-of-line blocking, 6 connections per host'],
                    ['HTTP/2', '2015', 'Multiplexing, header compression (HPACK), server push', 'Single TCP connection = TCP HOL blocking'],
                    ['HTTP/3', '2022', 'QUIC (UDP-based), no TCP HOL blocking, 0-RTT', 'Limited adoption, UDP firewall issues']
                ]
            },
            callout: { type: 'tip', title: 'Interview', text: 'When asked "how would you improve API performance?" mentioning HTTP/2 multiplexing (multiple requests on one connection) shows infrastructure awareness beyond just code optimization.' }
        },
        {
            title: 'DNS Resolution',
            content: `<p><strong>DNS</strong> translates domain names to IP addresses. Understanding DNS is critical for debugging connectivity issues and designing global systems.</p>
            <ul>
                <li><strong>Recursive resolver</strong> &mdash; Your ISP/corporate DNS that caches and resolves on your behalf</li>
                <li><strong>Root servers</strong> &mdash; 13 root server clusters, direct to TLD servers</li>
                <li><strong>TLD servers</strong> &mdash; .com, .org, .io &mdash; direct to authoritative servers</li>
                <li><strong>Authoritative server</strong> &mdash; Holds the actual DNS records for a domain</li>
                <li><strong>TTL</strong> &mdash; Time-to-live: how long resolvers cache the answer</li>
            </ul>`,
            table: {
                headers: ['Record', 'Purpose', 'Example'],
                rows: [
                    ['A', 'Maps domain to IPv4 address', 'api.example.com &rarr; 203.0.113.50'],
                    ['AAAA', 'Maps domain to IPv6 address', 'api.example.com &rarr; 2001:db8::1'],
                    ['CNAME', 'Alias to another domain name', 'www.example.com &rarr; example.com'],
                    ['MX', 'Mail server for the domain', 'example.com &rarr; mail.example.com (priority 10)'],
                    ['TXT', 'Arbitrary text (SPF, DKIM, verification)', 'v=spf1 include:_spf.google.com ~all'],
                    ['NS', 'Authoritative name server for zone', 'example.com &rarr; ns1.cloudflare.com'],
                    ['SRV', 'Service discovery (host + port)', '_grpc._tcp.example.com &rarr; port 50051']
                ]
            }
        },
        {
            title: 'Load Balancing',
            content: `<p><strong>Load balancers</strong> distribute traffic across multiple backend servers. One of the most important infrastructure concepts for system design interviews.</p>
            <ul>
                <li><strong>Layer 4 (Transport)</strong> &mdash; Routes based on IP/port (TCP/UDP). Faster, less flexible.</li>
                <li><strong>Layer 7 (Application)</strong> &mdash; Routes based on HTTP headers, URL path, cookies. Slower, more intelligent.</li>
                <li><strong>Health checks</strong> &mdash; Periodically verify backends are healthy; remove unhealthy from rotation.</li>
                <li><strong>SSL termination</strong> &mdash; LB handles TLS decryption, backends receive plain HTTP (reduces backend CPU).</li>
            </ul>`,
            mermaid: `graph TD
    C[Clients] --> LB[Load Balancer<br/>Layer 7]
    LB -->|/api/orders| S1[Server 1]
    LB -->|/api/orders| S2[Server 2]
    LB -->|/api/orders| S3[Server 3]
    LB -.->|health check| S1
    LB -.->|health check| S2
    LB -.->|health check| S3
    S4[Server 4<br/>UNHEALTHY] -.->|removed| LB

    style LB fill:#3b82f6,color:#fff
    style S4 fill:#ef4444,color:#fff`
        },
        {
            title: 'Load Balancing Algorithms',
            content: `<p>The algorithm determines which backend receives the next request:</p>`,
            table: {
                headers: ['Algorithm', 'How It Works', 'Best For', 'Weakness'],
                rows: [
                    ['Round Robin', 'Cycle through servers sequentially', 'Homogeneous servers, stateless', 'Ignores server load'],
                    ['Weighted Round Robin', 'Round Robin with weights (powerful server gets more)', 'Mixed hardware', 'Static weights; does not adapt'],
                    ['Least Connections', 'Route to server with fewest active connections', 'Long-lived connections, varied request duration', 'Slow servers accumulate connections'],
                    ['Least Response Time', 'Route to server with fastest recent response', 'Latency-sensitive applications', 'Requires continuous measurement'],
                    ['IP Hash', 'Hash client IP to determine server', 'Session affinity without cookies', 'Uneven distribution if IPs clustered'],
                    ['Consistent Hashing', 'Hash ring; minimal redistribution when servers change', 'Caching layers, stateful services', 'Requires virtual nodes for balance'],
                    ['Random', 'Pick a random server', 'Large clusters where simplicity matters', 'Not deterministic; no affinity'],
                    ['Resource-Based', 'Route based on server CPU/memory metrics', 'Heterogeneous workloads', 'Requires agent on each server']
                ]
            },
            callout: { type: 'tip', title: 'System Design Answer', text: 'For most web APIs: start with Round Robin (simple, stateless). For caching: Consistent Hashing (minimal cache invalidation on server change). For WebSocket/long-lived connections: Least Connections. Always mention health checks regardless of algorithm.' }
        },
        {
            title: 'TLS Handshake',
            content: `<p>Every HTTPS connection starts with a TLS handshake. Understanding it helps debug certificate issues and optimize latency.</p>
            <ul>
                <li><strong>1. ClientHello</strong> &mdash; Client sends supported cipher suites, TLS version</li>
                <li><strong>2. ServerHello</strong> &mdash; Server picks cipher, sends certificate</li>
                <li><strong>3. Certificate Verify</strong> &mdash; Client validates cert chain against CA</li>
                <li><strong>4. Key Exchange</strong> &mdash; Both derive shared secret (ECDHE)</li>
                <li><strong>5. Finished</strong> &mdash; Encrypted communication begins</li>
            </ul>
            <p><strong>Performance:</strong> TLS 1.3 reduces handshake from 2-RTT to 1-RTT (and 0-RTT for resumption). HTTP/3 (QUIC) combines transport + TLS handshake in 1-RTT.</p>`,
            callout: { type: 'warning', title: 'Production Issue', text: 'Expired certificates cause instant outage. Mutual TLS (mTLS) adds client cert verification &mdash; used for service-to-service auth in zero-trust architectures. Certificate rotation must be automated (cert-manager, Key Vault).' }
        },
        {
            title: 'Caching Layers',
            content: `<p>Multiple caching layers reduce latency and load at every level:</p>`,
            table: {
                headers: ['Layer', 'Location', 'TTL', 'Example'],
                rows: [
                    ['Browser Cache', 'Client', 'Cache-Control header', 'Static assets (JS, CSS, images)'],
                    ['CDN Cache', 'Edge (global PoPs)', 'Minutes to hours', 'API responses, HTML pages'],
                    ['DNS Cache', 'Resolver + OS', 'TTL from DNS record', 'Domain resolution (avoid repeated lookups)'],
                    ['Reverse Proxy Cache', 'Nginx/Varnish at LB', 'Seconds to minutes', 'Frequently-requested API endpoints'],
                    ['Application Cache', 'In-process (IMemoryCache)', 'Seconds to minutes', 'Config, reference data, computed values'],
                    ['Distributed Cache', 'Redis/Memcached', 'Minutes to hours', 'Session, query results, computed aggregates'],
                    ['Database Cache', 'Query plan cache, buffer pool', 'Managed by DB engine', 'Hot data pages stay in memory']
                ]
            },
            callout: { type: 'tip', title: 'Interview Pattern', text: 'When asked "how would you reduce API latency?" walk through caching at each layer: CDN for static content, reverse proxy for common queries, Redis for computed data, in-memory for config. Each layer eliminates a round-trip.' }
        },
        {
            title: 'Connection Pooling',
            content: `<p><strong>Connection pooling</strong> reuses established connections (TCP, database, HTTP) instead of creating new ones per request. Creating connections is expensive: TCP handshake (1 RTT), TLS handshake (1-2 RTT), database authentication.</p>
            <ul>
                <li><strong>Database pool</strong> &mdash; ADO.NET pools connections automatically (default max: 100). Configure <code>Max Pool Size</code> in connection string.</li>
                <li><strong>HTTP pool</strong> &mdash; <code>HttpClient</code> reuses TCP connections. Use <code>IHttpClientFactory</code> for proper pooling + DNS rotation.</li>
                <li><strong>gRPC channels</strong> &mdash; Single channel multiplexes many calls over one HTTP/2 connection.</li>
            </ul>
            <p><strong>Pool exhaustion</strong> = all connections in use, new requests queue/timeout. Root cause: long-running queries, connections not returned (missing <code>using</code>), pool too small for burst traffic.</p>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>HTTP request lifecycle: DNS &rarr; TCP &rarr; TLS &rarr; Request &rarr; Response (each step can be optimized or can fail)</li>
                <li>HTTP/2 multiplexing eliminates per-request connection overhead; HTTP/3 removes TCP HOL blocking</li>
                <li>DNS is a common failure point; understand TTL, propagation, and caching behavior</li>
                <li>Load balancing: Round Robin for stateless, Consistent Hashing for caches, Least Connections for long-lived</li>
                <li>TLS 1.3 reduces handshake to 1-RTT; automate certificate rotation</li>
                <li>Caching works at every layer; each layer eliminates a network round-trip</li>
                <li>Connection pooling prevents resource exhaustion; always use IHttpClientFactory and proper DB pool config</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'net-fund-q1',
            level: 'mid',
            title: 'Walk through what happens when you type a URL into a browser.',
            answer: `<p><strong>Step by step:</strong></p><ol><li><strong>URL parsing:</strong> Extract protocol, host, port, path</li><li><strong>DNS resolution:</strong> Browser cache &rarr; OS cache &rarr; recursive resolver &rarr; root/TLD/authoritative</li><li><strong>TCP handshake:</strong> SYN, SYN-ACK, ACK (1 RTT)</li><li><strong>TLS handshake:</strong> ClientHello, ServerHello, certs, key exchange (1-2 RTT)</li><li><strong>HTTP request:</strong> GET / HTTP/2 with headers</li><li><strong>Server processing:</strong> LB &rarr; reverse proxy &rarr; app server &rarr; DB if needed</li><li><strong>HTTP response:</strong> Status code + headers + body</li><li><strong>Rendering:</strong> Parse HTML &rarr; fetch CSS/JS &rarr; render DOM &rarr; execute JS</li></ol>`
        },
        {
            id: 'net-fund-q2',
            level: 'senior',
            title: 'Explain the difference between Layer 4 and Layer 7 load balancing.',
            answer: `<p><strong>Layer 4 (Transport):</strong> Routes based on IP address and TCP/UDP port. Does not inspect request content. Faster (no parsing), works for any protocol (not just HTTP). Cannot route by URL path or header.</p><p><strong>Layer 7 (Application):</strong> Inspects HTTP request (URL, headers, cookies, body). Can route /api to backend-A and /static to backend-B. Can do content-based routing, A/B testing, canary deployments. Slightly slower due to parsing.</p><p><strong>When to use:</strong> L4 for raw TCP services (database, Redis proxy, gaming). L7 for web applications (path-based routing, SSL termination, header injection).</p>`
        },
        {
            id: 'net-fund-q3',
            level: 'architect',
            title: 'Design the load balancing strategy for a global e-commerce platform.',
            answer: `<p><strong>Multi-layer approach:</strong></p><ul><li><strong>Global:</strong> DNS-based geo-routing (Route53/Azure Traffic Manager) &rarr; nearest region</li><li><strong>Regional edge:</strong> CDN (CloudFront/Front Door) for static assets and API caching</li><li><strong>Regional LB:</strong> L7 Application Load Balancer with path-based routing (/api &rarr; backend, /ws &rarr; WebSocket servers)</li><li><strong>Service-level:</strong> Kubernetes Service (ClusterIP) with round-robin for internal service-to-service</li></ul><p><strong>Algorithm choices:</strong> Round Robin for stateless API pods, Consistent Hashing for cache layer (Redis proxy), Least Connections for WebSocket servers (long-lived connections).</p>`,
            followUp: ['How do you handle session affinity for shopping carts?', 'What happens if an entire region goes down?']
        },
        {
            id: 'net-fund-q4',
            level: 'mid',
            title: 'What is consistent hashing and why is it important for caching?',
            answer: `<p><strong>Consistent hashing</strong> maps keys to servers on a virtual ring. When a server is added/removed, only 1/N keys need to be remapped (vs ALL keys with modulo hashing).</p><p><strong>Why it matters for caching:</strong> With modulo hash (key % server_count), adding one server invalidates nearly ALL cached keys (massive cache miss storm). With consistent hashing, only keys on the affected arc are remapped &mdash; minimal cache disruption.</p><p><strong>Virtual nodes:</strong> Each physical server gets multiple points on the ring for better distribution (prevents hotspots).</p>`
        },
        {
            id: 'net-fund-q5',
            level: 'senior',
            title: 'Your API has high latency but CPU/memory are fine. DNS resolution is taking 500ms. How do you fix it?',
            answer: `<p><strong>DNS latency causes:</strong></p><ul><li>DNS server is far away or overloaded</li><li>HttpClient creates new connections per request (each needs DNS)</li><li>Kubernetes ndots:5 causes 5 failed lookups before succeeding</li><li>No local DNS cache in container</li></ul><p><strong>Fixes:</strong></p><ul><li>Use IHttpClientFactory (reuses connections, rotates DNS per PooledConnectionLifetime)</li><li>Add local DNS cache (dnsmasq, CoreDNS node-local cache in K8s)</li><li>Use FQDN with trailing dot in K8s (skips ndots search domains)</li><li>Reduce DNS TTL for faster failover, but not so low it causes excessive lookups</li></ul>`
        },
        {
            id: 'net-fund-q6',
            level: 'lead',
            title: 'How does HTTP/2 improve performance over HTTP/1.1?',
            answer: `<p><strong>HTTP/2 improvements:</strong></p><ul><li><strong>Multiplexing:</strong> Multiple requests/responses on single TCP connection (eliminates head-of-line blocking at HTTP level)</li><li><strong>Header compression (HPACK):</strong> Headers are compressed and deduplicated across requests</li><li><strong>Binary framing:</strong> More efficient parsing than text-based HTTP/1.1</li><li><strong>Server push:</strong> Server can proactively send resources it predicts client needs (rarely used in practice)</li><li><strong>Stream prioritization:</strong> Client can indicate which requests are most important</li></ul><p><strong>Limitation:</strong> Still uses TCP underneath &mdash; a single packet loss blocks ALL streams (TCP head-of-line blocking). HTTP/3 (QUIC/UDP) solves this.</p>`
        },
        {
            id: 'net-fund-q7',
            level: 'mid',
            title: 'What is SSL termination and why do load balancers do it?',
            answer: `<p><strong>SSL termination</strong> means the load balancer decrypts TLS traffic and forwards plain HTTP to backend servers.</p><p><strong>Benefits:</strong></p><ul><li>Backend servers avoid CPU-expensive TLS operations</li><li>Centralized certificate management (one place to rotate certs)</li><li>LB can inspect HTTP content for L7 routing decisions</li><li>Simpler backend configuration (no certs on app servers)</li></ul><p><strong>Security concern:</strong> Traffic between LB and backend is unencrypted. In zero-trust environments, use mTLS or re-encrypt (TLS between LB and backend too).</p>`
        },
        {
            id: 'net-fund-q8',
            level: 'architect',
            title: 'How do you prevent connection pool exhaustion in a high-traffic .NET service?',
            answer: `<p><strong>Prevention strategies:</strong></p><ul><li><strong>Right-size the pool:</strong> Max Pool Size should handle burst traffic (measure P99 concurrent connections)</li><li><strong>Return connections quickly:</strong> All DB calls in <code>using</code> blocks; set CommandTimeout (30s default may be too long)</li><li><strong>Separate read/write pools:</strong> Read replicas get their own pool (doubles effective capacity)</li><li><strong>Circuit breaker:</strong> If DB is slow, fail fast rather than queuing connections</li><li><strong>Monitor:</strong> Track active connections, queue time, pool utilization (dotnet-counters)</li><li><strong>For HTTP:</strong> Use IHttpClientFactory; set PooledConnectionLifetime; limit MaxConnectionsPerServer</li></ul>`
        }
    ]
});
