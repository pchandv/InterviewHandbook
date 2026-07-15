/* ═══════════════════════════════════════════════════════════════════
   System Design — Design Netflix (Video Streaming Platform)
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('sd-netflix', {
    title: 'Design Netflix',
    description: 'System design for a video streaming platform — content delivery, recommendation engine, adaptive bitrate streaming, and global distribution at scale.',
    sections: [
        {
            title: 'Requirements & Scale',
            content: `<p>Design a video streaming platform serving 200M+ users globally with personalized content, adaptive streaming, and 99.99% availability.</p>
            <h4>Functional Requirements</h4>
            <ul>
                <li>Browse catalog, search, stream video</li>
                <li>Personalized recommendations (per-user, per-row, per-thumbnail)</li>
                <li>User profiles, watch history, continue watching</li>
                <li>Offline download for mobile</li>
                <li>Multi-device with concurrent stream limits (4 screens)</li>
            </ul>
            <h4>Non-Functional Requirements</h4>
            <ul>
                <li>Latency: Video start &lt;2 seconds (time to first byte)</li>
                <li>Adaptive bitrate: seamless quality switching</li>
                <li>Availability: 99.99% for streaming, graceful degradation for recs</li>
                <li>Scale: 200M users, 100M DAU, 1B+ hours streamed/week</li>
                <li>Global: Low-latency delivery in every country</li>
            </ul>
            <h4>Capacity Estimation</h4>
            <ul>
                <li>Storage: 15K titles × ~100 rendition files × 5GB avg = ~7.5PB catalog</li>
                <li>Peak concurrent streams: ~10M simultaneous at peak hours</li>
                <li>Bandwidth: 10M streams × 5 Mbps avg = ~50 Tbps peak egress</li>
                <li>Metadata API: ~100K requests/second for browse/search/recs</li>
            </ul>`
        },
        {
            title: 'High-Level Architecture',
            mermaid: `graph TB
    subgraph Clients[Client Devices]
        TV[Smart TV]
        PHONE[Mobile App]
        WEB[Web Browser]
    end
    subgraph ControlPlane[Control Plane - AWS]
        APIGW[API Gateway / Zuul]
        USER[User Service]
        CATALOG[Catalog Service]
        SEARCH_SVC[Search Service<br/>Elasticsearch]
        REC[Recommendation<br/>Engine]
        AUTH[Auth / Profile<br/>Service]
        PLAY[Playback Service<br/>Manifest + DRM]
    end
    subgraph DataPlane[Data Plane - Open Connect CDN]
        EDGE[Edge PoPs<br/>ISP-embedded]
        REGIONAL[Regional Caches]
        ORIGIN[Origin Storage<br/>S3]
    end
    subgraph Pipeline[Content Pipeline]
        INGEST[Ingest & Transcode]
        QC[Quality Control]
        ENCODE[Multi-Resolution<br/>Encoding]
    end
    subgraph DataStores
        CASS[(Cassandra<br/>User/History)]
        ES[(Elasticsearch<br/>Search)]
        EVCACHE[(EVCache<br/>Redis-like)]
        KAFKA[(Kafka<br/>Events)]
    end
    TV & PHONE & WEB --> APIGW
    APIGW --> USER & CATALOG & SEARCH_SVC & REC & AUTH & PLAY
    TV & PHONE & WEB -->|Video bytes| EDGE --> REGIONAL --> ORIGIN
    PIPELINE --> ENCODE --> ORIGIN
    USER --> CASS
    SEARCH_SVC --> ES
    REC --> EVCACHE & KAFKA`,
            content: `<p>The critical insight: <strong>control plane</strong> (metadata, auth, recommendations — runs on AWS) is separated from <strong>data plane</strong> (video bytes — served by Open Connect CDN embedded in ISPs). Video bytes never flow through application servers.</p>`
        },
        {
            title: 'Technology Choices & Key Components',
            code: `// Key components:
// 1. VIDEO INGESTION PIPELINE
//    Upload → Transcode (multiple resolutions/codecs) → Store in Object Storage
//    Formats: H.264, H.265/HEVC, AV1 (newer, 30% smaller)
//    Resolutions: 240p, 360p, 480p, 720p, 1080p, 4K
//    Each title = 100+ files (resolution × codec × audio track × subtitle)

// 2. CONTENT DELIVERY (CDN)
//    - Open Connect Appliances (Netflix's own CDN embedded in ISPs)
//    - Pre-position popular content at edge (predictive caching)
//    - Adaptive Bitrate Streaming (ABR): client switches quality based on bandwidth
//    - Protocol: DASH/HLS with chunked transfer (2-10 second segments)

// 3. RECOMMENDATION ENGINE
//    - Collaborative filtering (users who watched X also watched Y)
//    - Content-based filtering (genre, actors, director similarity)
//    - Deep learning models trained offline, served via feature store
//    - A/B testing framework (every UI element is an experiment)

// 4. SEARCH & CATALOG
//    - Elasticsearch for full-text search + filters
//    - Personalized ranking (same search, different order per user)
//    - Catalog metadata in Cassandra (high write throughput, global replication)

// 5. USER SERVICE
//    - Profiles, preferences, watch history
//    - Session management, device limits (4 concurrent streams)
//    - Payment/subscription in separate bounded context`,
            language: 'csharp'
        },
        {
            title: 'Open Connect CDN — Content Delivery',
            content: `<p>Netflix serves 95%+ of video bytes from its own CDN (Open Connect) — appliances placed <strong>inside ISP networks</strong>.</p>
            <h4>How Open Connect Works</h4>
            <ol>
                <li><strong>Predictive pre-positioning</strong>: ML models predict what will be popular tomorrow per region. During off-peak hours, content is pushed to edge appliances proactively.</li>
                <li><strong>ISP-embedded caches</strong>: Physical servers installed at ISP data centers. Viewers stream from a box a few miles away.</li>
                <li><strong>Tiered caching</strong>: Popular content (top 20%) cached at all edges. Long-tail fetched from regional/origin on demand.</li>
                <li><strong>Adaptive routing</strong>: Playback service selects the optimal edge based on health, load, and proximity.</li>
            </ol>
            <h4>Why This Matters</h4>
            <ul>
                <li>Reduces transit costs (ISPs provide hosting for free — it saves them bandwidth)</li>
                <li>Sub-100ms latency for first segment (viewer is physically close)</li>
                <li>Predictive caching achieves 95%+ cache hit ratio for popular content</li>
            </ul>`
        },
        {
            title: 'Recommendation Engine',
            content: `<p>Recommendations drive 80% of what users watch. The system is not one model — it's dozens of models combined.</p>
            <h4>Multi-Model Architecture</h4>
            <table>
                <thead><tr><th>Model</th><th>What It Decides</th><th>Input Signals</th></tr></thead>
                <tbody>
                    <tr><td>Row Selection</td><td>Which categories to show (Action, Trending, etc.)</td><td>User history, time of day, device</td></tr>
                    <tr><td>Row Ordering</td><td>Which row appears first</td><td>Engagement probability per row</td></tr>
                    <tr><td>Item Ranking</td><td>Order of titles within a row</td><td>Collaborative + content-based filtering</td></tr>
                    <tr><td>Artwork Selection</td><td>Which thumbnail to show per title</td><td>User preferences, A/B test results</td></tr>
                </tbody>
            </table>
            <h4>Offline + Online Serving</h4>
            <ul>
                <li><strong>Offline</strong>: Models trained on Spark/GPU clusters. Pre-computed recommendations stored in feature store.</li>
                <li><strong>Online</strong>: Real-time re-ranking based on latest signals (just watched X → boost related). Lightweight model adjusts pre-computed results.</li>
                <li><strong>A/B Testing</strong>: Every change is an experiment. Member allocation by hash ensures consistent experience.</li>
            </ul>`
        },
        {
            title: 'Resilience & Chaos Engineering',
            content: `<p>With 1000+ microservices, partial failure is the normal state. Resilience is designed in, not hoped for.</p>
            <ul>
                <li><strong>Circuit breakers</strong>: Isolate failing services (Resilience4j). If recommendations are slow → open circuit → show popular titles instead.</li>
                <li><strong>Bulkhead isolation</strong>: Separate thread pools per dependency. Search failure cannot exhaust threads used for playback.</li>
                <li><strong>Graceful degradation</strong>: Every feature has a fallback. No recs? Show trending. No personalized artwork? Show default.</li>
                <li><strong>Multi-region active-active</strong>: Traffic fails over to nearest healthy region automatically.</li>
                <li><strong>Chaos Monkey</strong>: Randomly kills instances in production to verify systems self-heal.</li>
            </ul>`,
            mermaid: `graph LR
    subgraph Normal[Normal Operation]
        REQ[Request] --> REC_SVC[Recommendation Service]
        REC_SVC --> RESULT[Personalized Results]
    end
    subgraph Degraded[Graceful Degradation]
        REQ2[Request] --> CB[Circuit Breaker<br/>OPEN]
        CB --> FALLBACK[Fallback: Popular Titles]
    end
    subgraph Chaos[Chaos Engineering]
        MONKEY[Chaos Monkey] -->|Kill instance| REC_SVC
        NOTE[Verify: system self-heals<br/>and degrades gracefully]
    end`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Routing video through app servers</strong>: Bytes must flow from CDN directly to client. App servers only provide manifest URLs + DRM tokens.</li>
                <li><strong>Single CDN strategy</strong>: Treating all content equally. Need head (popular, cached everywhere) vs tail (rare, origin-served) differentiation.</li>
                <li><strong>Tight coupling of recs to playback</strong>: If recommendation service is down, users can't browse? Must degrade gracefully.</li>
                <li><strong>Single-model recommendations</strong>: Netflix uses dozens of models for different decisions. One model can't optimize row selection AND item ranking.</li>
                <li><strong>Ignoring cold-start</strong>: New users with no history need explicit preference capture or popular-based defaults.</li>
                <li><strong>No A/B framework</strong>: Without experiments, you can't prove improvements. Netflix A/B tests everything including thumbnail images.</li>
                <li><strong>Assuming availability = no failures</strong>: At 1000+ services, something is always failing. Design for partial failure as normal.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li>"Netflix is a CDN company" — 95% of bytes from edge, not origin</li>
                    <li>Control plane vs data plane separation</li>
                    <li>Predictive pre-positioning and cache hit rate optimization</li>
                    <li>Adaptive bitrate streaming (manifest + segments + client-side quality switching)</li>
                    <li>Multi-model recommendation architecture (row selection, ranking, artwork)</li>
                    <li>Resilience: circuit breakers + graceful degradation + chaos engineering</li>
                    <li>Back-of-envelope: storage (PBs), bandwidth (Tbps), why CDN is forced by physics</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Separate control plane (metadata/APIs on AWS) from data plane (video bytes on CDN)</li>
                <li>Open Connect CDN embeds in ISPs — 95%+ cache hit rate for popular content</li>
                <li>Predictive pre-positioning uses ML to push tomorrow's popular content to edge today</li>
                <li>ABR streaming: manifest + segments + client-side quality adaptation</li>
                <li>Recommendations: multiple ML models for different decisions, trained offline, served online</li>
                <li>Resilience: circuit breakers, bulkheads, graceful degradation, multi-region active-active</li>
                <li>Chaos engineering validates resilience by breaking things in production intentionally</li>
                <li>A/B testing framework — every feature, thumbnail, and ranking change is an experiment</li>
            </ul>`
        }
    ],
    questions: [
        {
            question: 'How would you design a video streaming service like Netflix?',
            difficulty: 'architect',
            answer: `<p>Key components: (1) Video ingestion pipeline (transcode to multiple resolutions), (2) CDN for delivery (edge caching, adaptive bitrate), (3) Catalog/Search service (Elasticsearch), (4) Recommendation engine (collaborative + content-based ML), (5) User service (profiles, history). The critical insight: separate control plane (metadata APIs) from data plane (video bytes via CDN).</p>`,
            interviewTip: 'Start with requirements clarification and back-of-envelope math (storage: 15K titles × 100 files × 5GB = 7.5PB). Then draw the high-level architecture separating video delivery from metadata. Deep-dive into CDN/ABR or recommendation engine based on interviewer interest.',
            followUp: ['How does adaptive bitrate streaming work?', 'How would you design the recommendation engine?', 'How do you handle 200M concurrent users?'],
            seniorPerspective: 'The key insight: Netflix is NOT a streaming company running through your servers — it is a CDN management company. 95%+ of bytes are served from edge caches. Your backend handles metadata, recommendations, and billing.',
            architectPerspective: 'Netflix architecture embodies microservices at scale: 1000+ services, each independently deployed, with sophisticated traffic management (Zuul), service mesh (Eureka), and resilience patterns (Hystrix/Resilience4j). The organizational structure mirrors the architecture (Conway Law).'
        },
        {
            question: 'How would you design the recommendation engine for Netflix?',
            difficulty: 'expert',
            answer: `<p>Netflix recommendations combine: (1) <strong>Collaborative filtering</strong> — users who watched X also watched Y, (2) <strong>Content-based filtering</strong> — match genre, actors, director, mood tags, (3) <strong>Deep learning</strong> — neural networks trained on viewing history, (4) <strong>Contextual signals</strong> — time of day, device, recently watched. Models trained offline on Spark, served real-time via a feature store. Everything is A/B tested — even thumbnail images are personalized per user.</p>`,
            interviewTip: 'Don\'t try to explain the full ML pipeline. Focus on the SYSTEM design: offline training (batch, daily), online serving (feature store, real-time), and the A/B testing framework that validates improvements. Mention that Netflix tests everything — row ordering, thumbnails, descriptions are all experiments.',
            followUp: ['How do you handle the cold-start problem for new users?', 'What is a feature store?', 'How does A/B testing work at scale?'],
            seniorPerspective: 'The recommendation system is not one model — it is dozens of models combined. Row selection (which categories to show), row ordering (which row first), item ranking (order within row), and artwork selection (which thumbnail) are all separate ML systems.',
            architectPerspective: 'The key insight: separate offline training (compute-intensive, batch) from online serving (low-latency, high-QPS). Pre-computed recommendations stored in a serving layer (Redis/feature store), updated periodically. Real-time signals (just watched X) adjust rankings with a lightweight online model.'
        }
    ,
        {
            question: 'How does adaptive bitrate streaming (ABR) work?',
            difficulty: 'medium',
            answer: `<p>Each video is encoded into multiple quality levels and split into short <strong>segments</strong> (a few seconds each). A <strong>manifest</strong> (DASH MPD or HLS playlist) lists the available bitrates and segment URLs. The client continuously estimates available bandwidth and buffer health and requests the next segment at the best sustainable quality, switching up or down between segments without re-buffering.</p>
            <p>This shifts the quality decision to the client, so the same content serves a phone on cellular and a TV on fiber smoothly.</p>`,
            bestPractices: ['Encode multiple renditions and segment them for switchable delivery', 'Use buffer-based + throughput-based switching to avoid stalls', 'Serve segments from the CDN edge for low latency', 'Cap start-up quality low, then ramp to minimize initial buffering'],
            commonMistakes: ['Single bitrate, causing buffering on weak connections', 'Switching too aggressively, causing visible quality flapping', 'Segments too long, making adaptation sluggish', 'Serving segments from origin instead of the edge'],
            interviewTip: 'Key idea: the client, not the server, picks quality per segment based on bandwidth/buffer. Mention manifest + segments + buffer-based switching (DASH/HLS).',
            followUp: ['How does the client decide when to switch quality?', 'How do segment length and start-up quality affect experience?', 'How does ABR interact with CDN caching?'],
            seniorPerspective: 'I tune for fast start and stall avoidance: begin at modest quality, ramp using buffer occupancy, and keep segments short enough to adapt quickly without overloading the CDN with tiny requests.',
            architectPerspective: 'ABR pushes the hard decision to the edge of the system \u2014 the client \u2014 keeping the backend a simple segment+manifest server fronted by a CDN. That is what lets streaming scale to hundreds of millions of heterogeneous devices.'
        },
        {
            question: 'How would you do back-of-envelope capacity estimation for a Netflix-scale service?',
            difficulty: 'medium',
            answer: `<p>Estimate the dimensions that drive cost: <strong>storage</strong> for the encoded catalog, <strong>egress bandwidth</strong> at peak concurrency, and <strong>request rate</strong> for metadata APIs. For example, ~15K titles \u00d7 multiple renditions \u00d7 several GB \u2248 petabytes of storage; peak streaming of tens of millions of concurrent streams \u00d7 a few Mbps each \u2248 tens of Tbps of egress \u2014 which is exactly why a CDN, not origin, serves the bytes.</p>
            <p>The point is not precision but identifying the dominant cost (egress) and the architectural consequence (edge delivery, head/tail caching).</p>`,
            bestPractices: ['Estimate storage, peak egress, and QPS separately', 'Use round numbers and state assumptions explicitly', 'Translate numbers into design choices (egress \u2192 CDN, QPS \u2192 caching)', 'Compute peak, not average, for capacity-bound resources'],
            commonMistakes: ['Sizing for average load instead of peak concurrency', 'Skipping assumptions, making the estimate unverifiable', 'Producing numbers without drawing a design conclusion', 'Forgetting that multiple renditions multiply storage'],
            interviewTip: 'Show the method, not memorized figures: state assumptions, multiply, then say what the dominant number implies (here, egress forces CDN-first design).',
            followUp: ['Which dimension dominates cost and why?', 'How does multi-rendition encoding change storage math?', 'How would caching change your egress estimate?'],
            seniorPerspective: 'I anchor the estimate on peak egress because it dictates the whole delivery architecture. Once you see tens of Tbps at peak, CDN-first and head/tail caching stop being options and become requirements.',
            architectPerspective: 'Back-of-envelope math exists to surface the constraint that shapes the architecture. For streaming, egress at peak is that constraint, which is why Netflix is effectively a CDN-management problem.'
        }
    ,
        {
            question: 'How does Netflix deliver video at global scale, and why is its CDN strategy (Open Connect) central to the design?',
            difficulty: 'architect',
            answer: `<p>Netflix is fundamentally a <strong>content-delivery</strong> problem: 95%+ of bytes are served from edge caches, not origin. Their <strong>Open Connect</strong> appliances are placed inside ISP networks, so popular titles stream from a box a few miles from the viewer.</p>
            <ul>
                <li><strong>Predictive pre-positioning</strong> \u2014 during off-peak hours, ML predicts tomorrow's popular content per region and pushes it to edge appliances proactively.</li>
                <li><strong>Adaptive bitrate</strong> \u2014 the client switches quality per segment based on bandwidth, so delivery degrades gracefully.</li>
                <li><strong>Control vs data plane split</strong> \u2014 AWS runs metadata, auth, and recommendations (control plane); video bytes never traverse application servers (data plane).</li>
            </ul>`,
            explanation: 'Instead of shipping every package from one central warehouse, Netflix stocks the popular items in a corner store on your street. By the time you want to watch, the movie is already next door.',
            bestPractices: ['Separate control plane (metadata/APIs) from data plane (bytes via CDN)', 'Pre-position popular content to the edge; serve the long tail from origin with caching', 'Use adaptive bitrate so playback survives variable bandwidth', 'Place caches inside ISPs to cut transit cost and latency'],
            commonMistakes: ['Streaming video through application servers instead of a CDN', 'Treating all content equally instead of head/tail caching by popularity', 'Single bitrate encoding that buffers on weak connections', 'Ignoring per-region popularity differences when pre-positioning'],
            interviewTip: 'Open with "Netflix is a CDN company" \u2014 95% edge hit rate. Predictive pre-positioning and the control/data-plane split are the two ideas that show you understand the real architecture.',
            followUp: ['How does predictive pre-positioning decide what to cache?', 'How does ABR choose the next segment quality?', 'Why put appliances inside ISP networks?'],
            seniorPerspective: 'The expensive resource is egress bandwidth at peak, so I anchor the whole design on maximizing edge hit ratio. Once you accept that, pre-positioning and ISP-embedded caches stop being optimizations and become the core architecture.',
            architectPerspective: 'Splitting control from data plane is the decision that makes it scale: the backend stays a modest metadata/recommendation system while a purpose-built CDN absorbs petabytes. Most "design a streaming service" answers fail by routing bytes through the app tier.'
        },
        {
            question: 'How does Netflix achieve resilience, and what role does chaos engineering play?',
            difficulty: 'advanced',
            answer: `<p>With 1000+ microservices, partial failure is constant, so resilience is designed in rather than hoped for:</p>
            <ul>
                <li><strong>Circuit breakers &amp; bulkheads</strong> (Hystrix/Resilience4j heritage) isolate failing dependencies so one slow service cannot exhaust threads everywhere.</li>
                <li><strong>Graceful degradation</strong> \u2014 if recommendations are down, show popular/unpersonalized rows rather than erroring.</li>
                <li><strong>Multi-region active-active</strong> \u2014 traffic can fail over to a healthy region.</li>
                <li><strong>Chaos engineering</strong> \u2014 tools like Chaos Monkey deliberately kill instances in production to prove the system tolerates failure, validated against a steady-state hypothesis with a bounded blast radius.</li>
            </ul>`,
            explanation: 'Chaos engineering is a fire drill you run in the real building, on purpose, during business hours \u2014 because the only way to trust your fire escapes is to actually use them before there is a real fire.',
            bestPractices: ['Isolate dependencies with circuit breakers and bulkheads', 'Design every feature to degrade gracefully when a dependency fails', 'Run chaos experiments with a hypothesis and a limited blast radius', 'Automate failover and practice it regularly (game days)'],
            commonMistakes: ['Letting one slow dependency cascade into a system-wide outage', 'Hard failures where graceful degradation was possible', 'Running chaos experiments with no steady-state hypothesis or kill switch', 'Assuming multi-region works without ever testing failover'],
            interviewTip: 'Pair the resilience patterns (circuit breaker, bulkhead, fallback) with the verification method (chaos engineering). Mention degrade-don\u2019t-fail (popular rows when recs are down) as a concrete example.',
            followUp: ['What is the difference between a circuit breaker and a bulkhead?', 'How do you bound the blast radius of a chaos experiment?', 'How does graceful degradation differ from failover?'],
            seniorPerspective: 'I bake graceful degradation into each feature\u2019s spec: every dependency call has a defined fallback. Chaos testing then proves those fallbacks actually fire, because untested fallbacks are just comments.',
            architectPerspective: 'At microservice scale, reliability is statistical \u2014 something is always failing. The architecture must assume partial failure as the normal case, which is why isolation patterns plus continuous chaos validation are foundational, not optional.'
        },
        {
            question: 'How does Netflix deliver video content globally with sub-second start times? Explain the CDN architecture.',
            difficulty: 'hard',
            answer: `<p>Netflix uses its own CDN called <strong>Open Connect</strong> — a network of purpose-built appliances deployed directly inside ISPs and Internet Exchange Points (IXPs) worldwide.</p>
<h4>Architecture:</h4>
<ul>
<li><strong>Open Connect Appliances (OCAs):</strong> Custom hardware (large SSD/HDD arrays) placed inside 1000+ ISP networks globally. Each stores the most popular content for that region.</li>
<li><strong>Content popularity steering:</strong> Netflix pre-positions content onto OCAs during off-peak hours based on predicted popularity (new releases cached everywhere, niche content only in regions where it is popular).</li>
<li><strong>Client-side selection:</strong> When a user hits "play," the Netflix API returns a ranked list of OCAs sorted by proximity and health. The client picks the best one.</li>
<li><strong>Fallback tiers:</strong> If local OCA is down → regional OCA → cloud origin (S3). Most traffic (95%+) is served from within the user's ISP network.</li>
</ul>
<h4>Why this achieves sub-second starts:</h4>
<ul>
<li>Content is physically inside the user's ISP — single network hop, low latency</li>
<li>Adaptive bitrate starts with a low-quality segment immediately (fast start) then upgrades</li>
<li>Pre-fetching: client downloads the first few segments of likely-next content during idle time</li>
</ul>
<p><strong>Scale:</strong> Netflix serves 100+ Tbps of traffic during peak hours, with 95% served from OCAs without touching the public internet.</p>`,
            bestPractices: ['Cache content at the edge, inside ISP networks for minimum latency', 'Pre-position content based on predicted popularity', 'Give clients a ranked list of servers and let them fail over locally', 'Start with lowest quality segment for instant playback, then upgrade'],
            commonMistakes: ['Serving all video from centralized cloud — too much latency and bandwidth cost', 'Static CDN placement without popularity-based content steering', 'Not pre-positioning new releases — causing cache misses and origin overload on launch day'],
            interviewTip: 'Mention Open Connect by name and explain WHY Netflix built their own CDN (cost at scale, ISP partnerships, content pre-positioning). The key insight is content lives inside the user ISP.',
            followUp: ['How does Netflix decide which content to place on which OCA?', 'What happens during a major new release when everyone tries to watch the same title?']
        },
        {
            question: 'How does Netflix implement adaptive bitrate streaming, and why is it essential for user experience?',
            difficulty: 'hard',
            answer: `<p><strong>Adaptive Bitrate Streaming (ABR)</strong> dynamically adjusts video quality based on the viewer's current network conditions, preventing buffering while maximizing quality.</p>
<h4>How it works:</h4>
<ol>
<li><strong>Encoding:</strong> Each title is encoded into multiple quality levels (bitrate ladders): e.g., 235 kbps (240p) up to 16 Mbps (4K HDR). Each quality has the video split into small chunks (2-10 second segments).</li>
<li><strong>Manifest:</strong> Client receives a manifest listing all available quality levels and segment URLs.</li>
<li><strong>Client ABR algorithm:</strong> For each segment, the client measures: available bandwidth, buffer level, and device capability, then selects the highest quality that won't cause rebuffering.</li>
<li><strong>Seamless switching:</strong> Quality can change at any segment boundary — the viewer sees quality improve/degrade smoothly without interruption.</li>
</ol>
<h4>Netflix-specific optimizations:</h4>
<ul>
<li><strong>Per-shot encoding:</strong> Rather than one bitrate ladder for all content, Netflix analyzes each scene's complexity. Action scenes need more bitrate; dialogue scenes look good at lower bitrate. This saves 20%+ bandwidth.</li>
<li><strong>Device-specific profiles:</strong> Mobile gets different encoding than 4K TV (no point sending 4K to a phone).</li>
<li><strong>Buffer-based ABR:</strong> Netflix's algorithm (used to be throughput-based) now primarily uses buffer fullness to decide quality — more stable, fewer quality oscillations.</li>
</ul>
<p><strong>Why essential:</strong> Without ABR, users on variable connections (mobile, congested WiFi) would experience constant buffering → abandonment. ABR trades quality for continuity, which users prefer.</p>`,
            bestPractices: ['Encode multiple quality levels per title with per-scene optimization', 'Use buffer-based ABR over throughput-based for smoother quality transitions', 'Start playback at low quality for instant start, then ramp up', 'Segment-aligned switching for seamless quality transitions'],
            commonMistakes: ['Single quality level — either buffers on slow connections or wastes bandwidth on fast', 'Throughput-only ABR that oscillates quality rapidly (annoying to viewers)', 'Large segments (30s+) that make quality adaptation too slow', 'Not encoding device-specific profiles — sending 4K to mobile wastes bandwidth'],
            interviewTip: 'Explain the encode-once-stream-many model, mention per-shot encoding as a Netflix innovation, and describe the client-side ABR decision loop. This shows depth beyond the basic "CDN serves video" answer.'
        }
    ]
});
