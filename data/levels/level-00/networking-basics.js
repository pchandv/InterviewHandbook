/* ═══════════════════════════════════════════════════════════════════
   NETWORKING FUNDAMENTALS — Level 0: Prerequisites (Computing Basics)
   OSI/TCP-IP model, TCP vs UDP, IP, DNS, HTTP/HTTPS, ports, routing.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('networking-basics', {

    title: 'Networking Fundamentals',
    level: 0,
    group: 'computing-basics',
    description: 'The OSI and TCP/IP models, TCP vs UDP, IP addressing, DNS resolution, HTTP/HTTPS, ports, and routing \u2014 how data travels between machines.',
    difficulty: 'beginner',
    estimatedMinutes: 35,
    prerequisites: ['os-fundamentals'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Networking</strong> is how computers communicate — from your browser fetching a web page to
            microservices calling each other across a data center. Every distributed system, API, and cloud
            application rests on these fundamentals.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>The layered network models (OSI and TCP/IP) and why layering matters</li>
                <li>TCP vs UDP and when to use each</li>
                <li>IP addressing and how packets are routed</li>
                <li>DNS — turning names into addresses</li>
                <li>HTTP/HTTPS and the request/response model</li>
                <li>Ports and how multiple services coexist on one machine</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Layered Models</h4>
            <p>Networking is organized in layers, each building on the one below. The <strong>TCP/IP model</strong>
            (4 layers) is practical; the <strong>OSI model</strong> (7 layers) is the teaching reference.</p>
            <ul>
                <li><strong>Link:</strong> physical transmission (Ethernet, Wi-Fi)</li>
                <li><strong>Internet:</strong> addressing and routing (IP)</li>
                <li><strong>Transport:</strong> end-to-end delivery (TCP, UDP)</li>
                <li><strong>Application:</strong> protocols apps use (HTTP, DNS, SMTP)</li>
            </ul>
            <h4>IP Address</h4>
            <p>A numeric identifier for a device (IPv4 like 192.168.1.10, or IPv6). Packets are routed across
            networks based on destination IP.</p>
            <h4>Port</h4>
            <p>A 16-bit number identifying a specific service on a host (HTTP=80, HTTPS=443, SSH=22). IP+port
            identifies an endpoint.</p>
            <h4>DNS</h4>
            <p>The Domain Name System translates human names (example.com) into IP addresses — the internet's
            phone book.</p>`,
            mermaid: `graph TB
    App[Application Layer: HTTP, DNS, SMTP] --> Trans[Transport: TCP / UDP]
    Trans --> Net[Internet: IP routing]
    Net --> Link[Link: Ethernet / Wi-Fi]
    Link --> Wire[Physical medium]`
        },
        {
            title: 'How It Works',
            content: `<p>When you visit <code>https://example.com</code>, a chain of steps occurs:</p>
            <ol>
                <li><strong>DNS lookup:</strong> resolve example.com to an IP address</li>
                <li><strong>TCP handshake:</strong> establish a connection (SYN, SYN-ACK, ACK)</li>
                <li><strong>TLS handshake:</strong> negotiate encryption for HTTPS</li>
                <li><strong>HTTP request:</strong> send GET / with headers</li>
                <li><strong>Routing:</strong> packets hop across routers using IP addresses to the server</li>
                <li><strong>HTTP response:</strong> server returns status, headers, and body</li>
                <li><strong>Render:</strong> browser parses and displays the content</li>
            </ol>`,
            code: `# Trace each step with command-line tools
$ nslookup example.com      # DNS: name -> IP
$ ping example.com          # basic reachability (ICMP)
$ traceroute example.com    # show the router hops (tracert on Windows)
$ curl -v https://example.com   # full HTTP(S) request/response with headers`,
            language: 'bash'
        },
        {
            title: 'Visual Diagram',
            content: `<p>The TCP three-way handshake that establishes a reliable connection:</p>`,
            mermaid: `sequenceDiagram
    participant C as Client
    participant S as Server
    C->>S: SYN (seq=x)
    S->>C: SYN-ACK (seq=y, ack=x+1)
    C->>S: ACK (ack=y+1)
    Note over C,S: Connection established \u2014 data transfer begins
    C->>S: HTTP GET /
    S->>C: HTTP 200 OK + body`
        },
        {
            title: 'Implementation',
            content: `<p>Networking from a developer's perspective — making and serving requests:</p>`,
            tabs: [
                {
                    label: 'HTTP Client (C#)',
                    code: `// HttpClient handles TCP, TLS, and HTTP for you
using var client = new HttpClient();
client.DefaultRequestHeaders.Add("Accept", "application/json");

HttpResponseMessage response = await client.GetAsync("https://api.example.com/users");
response.EnsureSuccessStatusCode();           // throws on 4xx/5xx
string json = await response.Content.ReadAsStringAsync();

// Status codes communicate outcome:
// 2xx success, 3xx redirect, 4xx client error, 5xx server error`,
                    language: 'csharp'
                },
                {
                    label: 'TCP vs UDP (C#)',
                    code: `// TCP: reliable, ordered, connection-based (most app traffic)
using var tcp = new TcpClient();
await tcp.ConnectAsync("example.com", 443);

// UDP: connectionless, no delivery guarantee, low overhead
// Used for DNS, video/voice streaming, gaming where speed > reliability
using var udp = new UdpClient();
var data = Encoding.UTF8.GetBytes("ping");
await udp.SendAsync(data, data.Length, "example.com", 12345);`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Always Use HTTPS</h4>
            <p>Encrypt traffic in transit. Plain HTTP exposes data to eavesdropping and tampering.</p>
            <h4>Do: Reuse Connections</h4>
            <p>Reuse a single HttpClient (or use connection pooling). Creating a new client per request exhausts
            sockets and defeats TLS session reuse.</p>
            <h4>Do: Set Timeouts and Retries</h4>
            <p>Networks fail. Always set sensible timeouts and retry transient failures with backoff.</p>
            <h4>Do: Choose the Right Transport</h4>
            <p>TCP for reliability (most APIs), UDP for low-latency, loss-tolerant streams (media, games, DNS).</p>
            <h4>Do: Understand DNS Caching</h4>
            <p>DNS responses are cached with a TTL. Know that changes propagate slowly and stale caches can cause
            confusing routing issues.</p>`,
            callout: {
                type: 'tip',
                title: 'IP + Port = Socket',
                text: 'A connection is uniquely identified by the 4-tuple: source IP, source port, destination IP, destination port. This is how one server on port 443 can handle thousands of simultaneous clients \u2014 each connection has a distinct source.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Creating a New HttpClient per Request</h4>
            <p>In .NET this causes socket exhaustion (sockets stuck in TIME_WAIT). Reuse a single instance or use
            IHttpClientFactory.</p>
            <h4>Mistake: Ignoring Timeouts</h4>
            <p>A hung request with no timeout can block a thread indefinitely. Always bound network waits.</p>
            <h4>Mistake: Using UDP When You Need Reliability</h4>
            <p>UDP doesn't guarantee delivery or order. Using it for data that must arrive intact (file transfer)
            is a mistake — use TCP.</p>
            <h4>Mistake: Confusing Latency and Bandwidth</h4>
            <p>Latency is delay per round trip; bandwidth is throughput. A high-bandwidth, high-latency link is
            still slow for chatty protocols.</p>
            <h4>Mistake: Hardcoding IPs</h4>
            <p>IPs change. Use DNS names so infrastructure can move without breaking clients.</p>`,
            code: `// BAD: new client every call -> socket exhaustion
public async Task<string> Get(string url)
{
    using var client = new HttpClient();   // anti-pattern in a loop
    return await client.GetStringAsync(url);
}

// GOOD: inject a reused client via IHttpClientFactory
public class ApiService
{
    private readonly HttpClient _client;
    public ApiService(HttpClient client) => _client = client;  // pooled
    public Task<string> Get(string url) => _client.GetStringAsync(url);
}`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Web &amp; APIs</h4>
            <p>Every REST/GraphQL/gRPC call rides on TCP and usually HTTP(S). Understanding status codes, headers,
            and connection reuse is daily work.</p>
            <h4>Microservices</h4>
            <p>Services discover each other via DNS, communicate over TCP, and use load balancers to distribute
            traffic — all networking fundamentals.</p>
            <h4>Real-Time Systems</h4>
            <p>Video calls, gaming, and live odds feeds use UDP or WebSockets to minimize latency, trading some
            reliability for speed.</p>
            <h4>CDNs &amp; DNS Routing</h4>
            <p>Content delivery networks use DNS to route users to the nearest edge server, cutting latency
            dramatically.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>TCP vs UDP — the fundamental transport choice:</p>`,
            table: {
                headers: ['Aspect', 'TCP', 'UDP'],
                rows: [
                    ['Connection', 'Connection-oriented (handshake)', 'Connectionless'],
                    ['Reliability', 'Guaranteed delivery + retransmit', 'Best-effort, no guarantee'],
                    ['Ordering', 'In-order', 'No ordering'],
                    ['Overhead', 'Higher (acks, state)', 'Lower (fire and forget)'],
                    ['Speed', 'Slower (reliability cost)', 'Faster (minimal overhead)'],
                    ['Use cases', 'Web, APIs, file transfer, email', 'DNS, streaming, VoIP, gaming'],
                    ['Congestion control', 'Yes', 'No (app must handle)']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Network performance is dominated by latency and round trips:</p>
            <h4>Latency vs Bandwidth</h4>
            <p>Latency (round-trip time) often matters more than bandwidth for interactive apps. Reducing the
            number of round trips speeds things up more than a fatter pipe.</p>
            <h4>Connection Reuse &amp; Keep-Alive</h4>
            <p>Establishing TCP+TLS costs multiple round trips. HTTP keep-alive and connection pooling amortize this
            across many requests. HTTP/2 multiplexes many requests over one connection.</p>
            <h4>Caching &amp; CDNs</h4>
            <p>Serving content from a nearby CDN edge or a local cache eliminates long-distance round trips
            entirely — often the biggest win.</p>
            <h4>Chattiness</h4>
            <p>Minimize back-and-forth: batch requests, use compound responses, and avoid N+1 network calls.</p>`,
            callout: {
                type: 'warning',
                title: 'Round Trips Dominate',
                text: 'A request to a server 100 ms away costs at least 100 ms per round trip regardless of bandwidth. Protocols that require many sequential round trips (handshakes, chatty APIs) feel slow. Reduce round trips before adding bandwidth.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Network code must be tested for both success and failure paths.</p>
            <h4>Mock the Transport</h4>
            <p>Use a fake HttpMessageHandler to simulate responses, timeouts, and errors without real network calls
            — fast and deterministic.</p>
            <h4>Test Failure Modes</h4>
            <p>Explicitly test timeouts, 4xx/5xx responses, and connection failures, since these are common in
            production and easy to forget.</p>`,
            code: `// Mock HttpClient with a stub handler to test without real network
public class StubHandler : HttpMessageHandler
{
    private readonly HttpStatusCode _code;
    private readonly string _body;
    public StubHandler(HttpStatusCode code, string body) { _code = code; _body = body; }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct) =>
        Task.FromResult(new HttpResponseMessage(_code)
        {
            Content = new StringContent(_body)
        });
}

[Fact]
public async Task Get_ServerError_ThrowsAndIsHandled()
{
    var client = new HttpClient(new StubHandler(HttpStatusCode.InternalServerError, "boom"));
    var sut = new ApiService(client);
    await Assert.ThrowsAsync<HttpRequestException>(() => sut.GetEnsured("/x"));
}`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Networking fundamentals appear in backend, systems, and "what happens when you type a URL" questions:</p>
            <ul>
                <li><strong>Walk through "what happens when you visit a URL"</strong> end to end — a classic question</li>
                <li><strong>Compare TCP and UDP</strong> and justify when to use each</li>
                <li><strong>Explain the TCP handshake</strong> (SYN, SYN-ACK, ACK)</li>
                <li><strong>Know HTTP status code categories</strong> (2xx/3xx/4xx/5xx)</li>
                <li><strong>Describe DNS resolution</strong> and caching/TTL</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'The Classic Question',
                text: '"What happens when you type a URL and press Enter?" is one of the most common interview questions. A strong answer touches DNS, TCP handshake, TLS, HTTP request/response, routing, and rendering \u2014 demonstrating breadth across the whole stack.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Books</h4>
            <ul>
                <li><em>Computer Networking: A Top-Down Approach</em> by Kurose &amp; Ross</li>
                <li><em>TCP/IP Illustrated</em> by W. Richard Stevens</li>
                <li><em>High Performance Browser Networking</em> by Ilya Grigorik (free online)</li>
            </ul>
            <h4>Online</h4>
            <ul>
                <li>Cloudflare Learning Center (cloudflare.com/learning)</li>
                <li>MDN Web Docs — HTTP section</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Layered models</strong> (TCP/IP 4-layer, OSI 7-layer) separate concerns from wire to app</li>
                <li><strong>TCP:</strong> reliable, ordered, connection-based; <strong>UDP:</strong> fast, best-effort</li>
                <li><strong>IP routes packets;</strong> ports identify services; IP+port = endpoint</li>
                <li><strong>DNS</strong> maps names to IPs and is cached by TTL</li>
                <li><strong>HTTP(S)</strong> is request/response; status codes signal outcome; always use TLS</li>
                <li><strong>Reuse connections</strong> (pooling/keep-alive) and minimize round trips for performance</li>
                <li><strong>Interview signal:</strong> the end-to-end "what happens when you visit a URL" walkthrough</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Trace a Request End-to-End</h4>
            <ol>
                <li>Use nslookup/dig to resolve a domain to its IP(s)</li>
                <li>Use traceroute to see the router hops between you and the server</li>
                <li>Use curl -v to capture the full HTTPS request/response, noting headers and status</li>
                <li>Identify the TCP handshake and TLS negotiation in the verbose output</li>
                <li>Write a one-paragraph explanation of each step from typing the URL to seeing the page</li>
            </ol>`,
            code: `$ dig example.com +short        # IP address(es)
$ traceroute example.com        # hop-by-hop path (tracert on Windows)
$ curl -v https://example.com   # observe DNS, connect, TLS, request, response
# Document: DNS -> TCP handshake -> TLS -> HTTP request -> routing -> response -> render`,
            language: 'bash'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> When would you choose UDP over TCP?<br/>
                    <em>A: When low latency matters more than guaranteed delivery and ordering \u2014 e.g., live video/voice,
                    online gaming, or DNS queries. The application tolerates or handles occasional loss.</em></li>
                <li><strong>Q:</strong> What does DNS do?<br/>
                    <em>A: Translates human-readable domain names (example.com) into IP addresses that computers use to
                    route traffic. Responses are cached based on a TTL.</em></li>
                <li><strong>Q:</strong> What are the three steps of the TCP handshake?<br/>
                    <em>A: SYN (client \u2192 server), SYN-ACK (server \u2192 client), ACK (client \u2192 server) \u2014 establishing a
                    reliable connection before data flows.</em></li>
                <li><strong>Q:</strong> What does an HTTP 4xx vs 5xx status indicate?<br/>
                    <em>A: 4xx = client error (bad request, unauthorized, not found); 5xx = server error (the server
                    failed to fulfill a valid request).</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'Walk through the TLS handshake and the key differences between TLS 1.2 and TLS 1.3.',
            difficulty: 'hard',
            answer: `<p>TLS provides confidentiality, integrity, and authentication for connections (the "S" in HTTPS).
            The handshake establishes an encrypted session:</p>
            <ol>
                <li><strong>ClientHello:</strong> client sends supported cipher suites, TLS versions, and a random.</li>
                <li><strong>ServerHello + Certificate:</strong> server picks a cipher, sends its certificate (public
                key), proving identity via the CA chain.</li>
                <li><strong>Key exchange:</strong> both derive a shared symmetric session key (modern TLS uses
                ephemeral Diffie-Hellman \u2014 ECDHE \u2014 for forward secrecy).</li>
                <li><strong>Finished:</strong> both switch to symmetric encryption for the actual data.</li>
            </ol>
            <p><strong>TLS 1.3 vs 1.2:</strong> 1.3 is faster (1 round-trip handshake, or 0-RTT for resumption, vs 2
            in 1.2), removed legacy/insecure ciphers (RSA key exchange, CBC, RC4), mandates forward secrecy (ECDHE),
            and encrypts more of the handshake. The result is both more secure and lower latency.</p>`,
            explanation: 'The handshake is two strangers agreeing on a secret code in public: they verify identity (certificate), jointly derive a shared key nobody eavesdropping can compute (Diffie-Hellman), then switch to fast symmetric encryption. TLS 1.3 does this in fewer back-and-forths and drops the old, weak code options.',
            bestPractices: ['Use TLS 1.3 (or 1.2 minimum); disable older protocols', 'Prefer ECDHE cipher suites for forward secrecy', 'Reuse connections / enable session resumption to amortize handshake cost'],
            commonMistakes: ['Allowing deprecated TLS/SSL versions or weak ciphers', 'Ignoring certificate validation (or disabling it "to make it work")', 'New TLS connection per request (handshake cost) instead of pooling'],
            interviewTip: 'Hit the three handshake purposes (authenticate, key-exchange, then symmetric encryption) and the headline TLS 1.3 wins: fewer round trips + mandatory forward secrecy. That demonstrates current knowledge.',
            followUp: ['What is forward secrecy and why does it matter?', 'What is the risk of TLS 1.3 0-RTT resumption?'],
            seniorPerspective: 'Two things I watch in practice: handshake cost and certificate management. TLS handshakes are why connection reuse (keep-alive, HTTP/2, pooled HttpClient) matters so much \u2014 a new TLS handshake per request adds round trips that dominate latency. And the most common real-world TLS outage isn\u2019t a protocol flaw, it\u2019s an expired certificate \u2014 so automated cert rotation (ACME/Let\u2019s Encrypt, managed certs) is non-negotiable.'
        },
        {
            question: 'Explain TCP congestion control and how HTTP/1.1, HTTP/2, and HTTP/3 (QUIC) differ.',
            difficulty: 'hard',
            answer: `<p><strong>TCP congestion control</strong> prevents senders from overwhelming the network. Key phases:
            <em>slow start</em> (exponentially grow the congestion window until a threshold or loss), <em>congestion
            avoidance</em> (linear growth), and <em>fast retransmit/recovery</em> on packet loss. TCP interprets loss
            as congestion and backs off.</p>
            <p><strong>HTTP evolution:</strong></p>
            <ul>
                <li><strong>HTTP/1.1:</strong> one request at a time per connection (head-of-line blocking); browsers
                open multiple connections to parallelize.</li>
                <li><strong>HTTP/2:</strong> multiplexes many streams over <em>one</em> TCP connection (binary framing,
                header compression). But a lost TCP packet still stalls all streams \u2014 TCP-level head-of-line blocking.</li>
                <li><strong>HTTP/3 (over QUIC):</strong> runs over UDP, implementing streams, congestion control, and
                TLS 1.3 itself. Independent streams mean a lost packet only stalls its own stream (no TCP HOL blocking),
                plus faster connection setup (0/1-RTT).</li>
            </ul>`,
            explanation: 'TCP is a polite driver who speeds up gradually and brakes hard when it sees congestion (loss). HTTP/2 put many conversations on one phone line but a dropped word freezes all of them; HTTP/3 (QUIC) gives each conversation its own line over UDP, so one dropped word only pauses that conversation.',
            bestPractices: ['Reuse connections and use HTTP/2+ to multiplex requests', 'Reduce round trips (latency dominates over bandwidth for many requests)', 'Consider HTTP/3 for lossy/mobile networks where HOL blocking hurts'],
            commonMistakes: ['Opening many parallel connections instead of multiplexing', 'Confusing bandwidth with latency when diagnosing slowness', 'Assuming HTTP/2 fully solves head-of-line blocking (TCP-level remains)'],
            interviewTip: 'Explain that HTTP/2 solved application-layer HOL blocking but TCP-layer HOL blocking remained \u2014 which is exactly what HTTP/3/QUIC addresses by moving to UDP. That precision is a strong signal.',
            followUp: ['Why does QUIC use UDP instead of TCP?', 'What is bufferbloat and how does it affect congestion control?'],
            seniorPerspective: 'When tuning real systems, I keep coming back to "round trips, not bandwidth." Congestion control and connection setup mean each new connection and each sequential round trip costs latency that a fat pipe doesn\u2019t fix. That\u2019s why connection reuse, multiplexing (HTTP/2+), CDNs, and reducing chatty request patterns deliver far more than upgrading bandwidth \u2014 and why HTTP/3 matters most on lossy mobile networks where TCP HOL blocking bites hardest.'
        },
        {
            question: 'What is the difference between TCP and UDP?',
            difficulty: 'easy',
            answer: `<p><strong>TCP</strong> is connection-oriented and reliable: it establishes a connection (handshake),
            guarantees delivery, retransmits lost packets, and keeps data in order. <strong>UDP</strong> is
            connectionless and best-effort: it just sends packets with no guarantee of delivery or order, but with
            minimal overhead and lower latency.</p>
            <ul>
                <li>TCP: web, APIs, file transfer, email — anything needing reliability</li>
                <li>UDP: streaming, VoIP, gaming, DNS — anything prioritizing speed</li>
            </ul>`,
            explanation: 'TCP is like registered mail with delivery confirmation and re-sends if lost. UDP is like dropping postcards in the mailbox — fast and cheap, but you do not know if each arrives.',
            bestPractices: ['Default to TCP for correctness-critical data', 'Use UDP only when latency matters and loss is acceptable'],
            commonMistakes: ['Using UDP for data that must arrive intact', 'Assuming UDP ordering'],
            interviewTip: 'Frame it as a reliability-vs-latency trade-off and give one concrete use case for each.',
            followUp: ['How does TCP guarantee delivery?', 'Why does DNS traditionally use UDP?']
        },
        {
            question: 'Walk me through what happens when you type a URL into a browser and press Enter.',
            difficulty: 'medium',
            answer: `<p>A sequence of layered steps occurs:</p>
            <ol>
                <li><strong>DNS resolution:</strong> the browser resolves the domain to an IP (checking caches, then
                DNS servers).</li>
                <li><strong>TCP handshake:</strong> a connection is established with the server (SYN/SYN-ACK/ACK).</li>
                <li><strong>TLS handshake:</strong> for HTTPS, encryption keys are negotiated.</li>
                <li><strong>HTTP request:</strong> the browser sends GET with headers (host, cookies, accept).</li>
                <li><strong>Routing:</strong> packets traverse routers across networks using IP, possibly via load
                balancers/CDN.</li>
                <li><strong>Server processing &amp; response:</strong> the server returns a status, headers, and body.</li>
                <li><strong>Rendering:</strong> the browser parses HTML, fetches sub-resources (CSS/JS/images), and
                paints the page.</li>
            </ol>`,
            explanation: 'It is like mailing a letter to a friend whose name you know but address you do not: look up the address (DNS), establish a reliable courier route (TCP/TLS), send the letter (HTTP request), it travels through sorting centers (routers), and you get a reply you then read (render).',
            bestPractices: ['Mention caching at multiple layers (DNS, browser, CDN)', 'Note HTTPS/TLS for security', 'Mention connection reuse (keep-alive, HTTP/2)'],
            commonMistakes: ['Skipping DNS or TLS', 'Forgetting that sub-resources trigger more requests'],
            interviewTip: 'Structure the answer as numbered steps and adjust depth to the interviewer\u2019s cues — they may want to drill into any one layer.',
            followUp: ['Where does caching happen in this flow?', 'How does HTTP/2 change the request phase?'],
            seniorPerspective: 'I use this question to demonstrate breadth and then depth: I give the seven-step skeleton, then offer to dive into whichever layer is relevant — DNS resolution and caching, the TLS handshake and certificate validation, TCP congestion control, or how a CDN and load balancer change the routing. Showing I can zoom in on any layer signals real full-stack understanding.'
        },
        {
            question: 'Why is reusing an HTTP client connection important, and what happens if you do not?',
            difficulty: 'medium',
            answer: `<p>Establishing a connection is expensive: a TCP handshake plus a TLS handshake costs multiple
            round trips before any data flows. <strong>Reusing connections</strong> (keep-alive, connection pooling,
            or HTTP/2 multiplexing) amortizes this cost across many requests.</p>
            <p>If you create a new client/connection per request — a classic .NET pitfall with <code>new
            HttpClient()</code> in a loop — you exhaust sockets (they linger in TIME_WAIT), add handshake latency to
            every call, and lose TLS session reuse. The fix is to reuse a single HttpClient or use
            IHttpClientFactory, which pools connections.</p>`,
            explanation: 'Opening a connection is like a phone call where you must dial, greet, and verify identity each time. Reusing the line lets you keep talking without re-dialing for every sentence.',
            code: `// Reuse via DI / IHttpClientFactory (pooled handlers)
services.AddHttpClient<ApiService>(c => c.BaseAddress = new Uri("https://api.example.com"));
// One pooled set of connections serves all requests, with handshake amortized.`,
            language: 'csharp',
            bestPractices: ['Use IHttpClientFactory or a long-lived HttpClient', 'Enable keep-alive; prefer HTTP/2 for multiplexing', 'Set timeouts and retry policies'],
            commonMistakes: ['new HttpClient() per request (socket exhaustion)', 'Disposing a shared client prematurely'],
            interviewTip: 'Name the specific failure (socket exhaustion / TIME_WAIT) — it shows you have hit this in real systems, not just read about it.',
            followUp: ['What is TIME_WAIT and why does it matter?', 'How does HTTP/2 multiplexing reduce connection overhead?']
        },
        {
            question: 'How does DNS resolution actually work, and what role does TTL and caching play?',
            difficulty: 'medium',
            answer: `<p><strong>DNS</strong> turns a name like <code>example.com</code> into an IP address through a
            hierarchical, mostly-cached lookup:</p>
            <ol>
                <li>The client checks local caches (browser, OS) first.</li>
                <li>On a miss, it asks a <strong>recursive resolver</strong> (often your ISP or a public resolver
                like 8.8.8.8).</li>
                <li>The resolver walks the hierarchy if needed: <strong>root</strong> servers point to the
                <strong>TLD</strong> server (.com), which points to the domain's <strong>authoritative</strong>
                name server, which returns the actual record.</li>
                <li>The answer is cached at each level and returned to the client.</li>
            </ol>
            <p>Each record carries a <strong>TTL</strong> (time to live) telling resolvers how long they may cache
            it. A high TTL means fewer lookups and faster responses but slower propagation of changes; a low TTL
            means quicker updates (useful before a migration) but more DNS traffic.</p>`,
            explanation: 'DNS is the internet\u2019s phone book with a chain of operators: you ask a local operator, who asks directory assistance, who narrows from "all .com numbers" down to the exact listing. Everyone jots the answer on a sticky note (cache) that they throw away after TTL seconds.',
            code: `# Inspect DNS records and their TTLs
$ dig example.com +noall +answer
# example.com.  3600  IN  A  93.184.216.34
#               ^^^^ TTL in seconds (resolvers may cache for 1 hour)

$ nslookup example.com      # quick name -> IP lookup`,
            language: 'bash',
            bestPractices: ['Lower TTLs ahead of a planned IP/migration change so it propagates quickly', 'Use higher TTLs for stable records to cut latency and DNS load', 'Do not hardcode IPs — rely on DNS so infrastructure can move'],
            commonMistakes: ['Expecting DNS changes to take effect instantly (caches honor the old TTL)', 'Setting very low TTLs everywhere, adding needless lookup latency and load', 'Forgetting that the OS/browser caches independently of the resolver'],
            interviewTip: 'Walk the hierarchy (cache -> recursive resolver -> root -> TLD -> authoritative) and then explain TTL as the latency-vs-propagation trade-off — that two-part answer covers both mechanics and operations.',
            followUp: ['What is the difference between a recursive and an authoritative DNS server?', 'How do A, AAAA, CNAME, and MX records differ?'],
            seniorPerspective: 'The TTL trade-off is something I plan around during migrations: I drop TTLs to a minute a day before cutting over a record, make the change, confirm propagation, then raise them back for normal operation. Teams that skip the pre-lower step get caught when the old IP keeps receiving traffic for an hour because resolvers are still honoring a long TTL.',
            architectPerspective: 'DNS is also a routing and resilience tool at the system level — GeoDNS and latency-based routing send users to the nearest region, weighted records enable gradual rollouts, and health-checked failover reroutes around dead endpoints. Treating DNS as part of the architecture (not just name lookup) unlocks global traffic management, but TTL behavior bounds how fast any of that can react.'
        },

        {
            question: 'Explain TCP congestion control algorithms (slow start, congestion avoidance, fast retransmit/recovery). How do modern algorithms like BBR differ from loss-based approaches?',

            difficulty: 'hard',

            answer: `<p>Classic TCP congestion control (Reno/NewReno/CUBIC) uses <strong>packet loss as a signal of congestion</strong>:</p>
            <ul>
                <li><strong>Slow Start:</strong> the sender doubles the congestion window (cwnd) each RTT until hitting a threshold (ssthresh) or experiencing loss — exponential growth to quickly find available bandwidth.</li>
                <li><strong>Congestion Avoidance:</strong> after reaching ssthresh, cwnd grows by ~1 segment per RTT (linear/additive increase) — probing cautiously for more capacity.</li>
                <li><strong>Fast Retransmit/Recovery:</strong> on receiving 3 duplicate ACKs, retransmit the lost segment immediately and halve cwnd (multiplicative decrease) without waiting for a timeout.</li>
            </ul>
            <p><strong>BBR (Bottleneck Bandwidth and RTT)</strong> takes a fundamentally different approach: it models the network by continuously measuring <strong>bottleneck bandwidth</strong> and <strong>minimum RTT</strong>, then paces sends to match the measured path capacity. This avoids bufferbloat (loss-based algorithms fill buffers before backing off) and achieves higher throughput on high-latency or lossy networks where packet loss is not a reliable congestion signal.</p>`,

            explanation: 'Loss-based TCP is like driving faster until you crash into traffic (loss), then slowing down. BBR reads the speed limit signs (bandwidth/RTT measurements) and drives at exactly the road capacity without crashing first.',

            code: `// You cannot change TCP congestion control from application code,
// but understanding it explains observed network behavior:

// WHY first page load on a new connection is slow:
// Slow start begins with cwnd ~10 segments (~14KB).
// A 200KB page needs multiple RTTs to ramp up.
// Fix: HTTP/2 connection reuse, preconnect hints, CDN edge proximity.

// WHY high-latency satellite links underperform despite bandwidth:
// In congestion avoidance, cwnd grows by 1 MSS per RTT.
// 600ms RTT = < 2 growth steps/sec. Massive BDP links stay underutilized.
// Fix: BBR on the server, or QUIC which implements its own CC.

// Monitoring: check retransmission rates
// netstat -s | grep retransmit  (Linux)
// High retransmits = congestion or lossy link`,

            language: 'bash',

            bestPractices: [
                'Reuse connections (HTTP/2, connection pooling) to avoid repeated slow-start penalties',
                'Use CDNs to minimize RTT — congestion window growth is per-RTT so lower RTT means faster ramp-up',
                'Enable BBR on Linux servers for improved throughput on high-BDP or lossy paths',
                'Monitor TCP retransmission rates as an early indicator of congestion'
            ],

            commonMistakes: [
                'Assuming bandwidth alone determines transfer speed (latency × cwnd is the real limit)',
                'Creating new TCP connections per request, paying slow-start cost every time',
                'Blaming the application for slowness caused by TCP congestion on high-latency links',
                'Confusing congestion loss with wireless/random loss (BBR handles the latter better)'
            ],

            interviewTip: 'Walk through the three phases (slow start, congestion avoidance, fast recovery) with their cwnd behavior: exponential, linear, halve. Then contrast with BBR: model-based, never intentionally fills buffers. That shows both classical knowledge and modern awareness.',

            followUp: [
                'What is bufferbloat and why do loss-based algorithms cause it?',
                'How does CUBIC (the Linux default) differ from classic Reno?',
                'Why does QUIC implement its own congestion control instead of relying on OS TCP?'
            ]
        },

        {
            question: 'Walk through the TLS 1.3 handshake step by step. What makes it faster and more secure than TLS 1.2?',

            difficulty: 'hard',

            answer: `<p>The <strong>TLS 1.3 handshake</strong> completes in <strong>1 round trip</strong> (1-RTT), compared to TLS 1.2's 2 round trips:</p>
            <ol>
                <li><strong>ClientHello:</strong> the client sends supported cipher suites, key shares (its ECDHE public key for one or more groups), and extensions — guessing which key exchange the server will accept.</li>
                <li><strong>ServerHello + EncryptedExtensions + Certificate + CertificateVerify + Finished:</strong> the server picks a cipher, sends its key share (completing the ECDHE exchange), its certificate, a handshake signature proving it owns the cert, and Finished — all in one flight, encrypted with handshake-derived keys.</li>
                <li><strong>Client Finished:</strong> the client verifies the certificate chain and signature, sends Finished, and application data flows immediately.</li>
            </ol>
            <p>Security improvements: (1) mandatory forward secrecy via ephemeral ECDHE (no static RSA key exchange), (2) encrypted certificate (eavesdroppers cannot see which site you connect to), (3) removed weak algorithms (RC4, SHA-1, CBC, static RSA), (4) simplified state machine reducing implementation vulnerabilities. <strong>0-RTT resumption</strong> allows sending data in the first message using a pre-shared key from a prior session — zero latency for returning clients, with replay-attack trade-offs.</p>`,

            explanation: 'TLS 1.2 is two phone calls to agree on a secret. TLS 1.3 is one: the client proactively offers its half of the secret in the very first message, so the server can respond with its half plus its ID card in one shot. Secure conversation starts after one exchange instead of two.',

            code: `// Configuring TLS 1.3 in ASP.NET Core (Kestrel):
builder.WebHost.ConfigureKestrel(options =>
{
    options.ConfigureHttpsDefaults(https =>
    {
        https.SslProtocols = System.Security.Authentication.SslProtocols.Tls13
                           | System.Security.Authentication.SslProtocols.Tls12;
    });
});

// HttpClient enforcing minimum TLS version:
var handler = new SocketsHttpHandler
{
    SslOptions = new System.Net.Security.SslClientAuthenticationOptions
    {
        EnabledSslProtocols = System.Security.Authentication.SslProtocols.Tls13
    }
};
var client = new HttpClient(handler);

// Verify: openssl s_client -connect example.com:443 -tls1_3
// Look for "Protocol: TLSv1.3" and "Server Temp Key: X25519"`,

            language: 'csharp',

            bestPractices: [
                'Configure servers to prefer TLS 1.3 with TLS 1.2 as minimum fallback',
                'Use ECDHE key exchange (mandatory in 1.3) for forward secrecy',
                'Be cautious with 0-RTT for non-idempotent requests (replay risk)',
                'Automate certificate renewal (ACME/Let\'s Encrypt) to prevent expiry outages'
            ],

            commonMistakes: [
                'Allowing TLS 1.0/1.1 which have known vulnerabilities',
                'Enabling 0-RTT for POST/PUT endpoints without replay protection',
                'Disabling certificate validation in dev and shipping it to production',
                'Not testing TLS configuration with ssllabs.com or testssl.sh'
            ],

            interviewTip: 'Hit three points: 1-RTT (performance), mandatory ECDHE (forward secrecy), removed weak ciphers (security). Then mention 0-RTT as the advanced feature with its replay trade-off — that shows you understand both benefits and risks.',

            followUp: [
                'What is forward secrecy and why does mandatory ECDHE provide it?',
                'What is the replay attack risk with 0-RTT and how is it mitigated?',
                'What is Encrypted Client Hello (ECH) and how does it extend TLS 1.3 privacy?'
            ]
        }
    ]
});
