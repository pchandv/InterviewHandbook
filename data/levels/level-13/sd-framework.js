/* ═══════════════════════════════════════════════════════════════════
   SYSTEM DESIGN FRAMEWORK — Level 13: System Design (Design Skills)
   A repeatable framework for system design interviews: requirements,
   estimation, high-level design, deep dives, and trade-offs.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('sd-framework', {

    title: 'System Design Framework',
    level: 13,
    group: 'system-design-skills',
    description: 'A repeatable framework for system design: clarify requirements, estimate scale, define APIs and data model, draw high-level design, deep-dive bottlenecks, and articulate trade-offs.',
    difficulty: 'advanced',
    estimatedMinutes: 45,
    prerequisites: ['arch-distributed', 'arch-cap'],

    sections: [

        {
            title: 'Introduction',
            content: `<p>The <strong>system design interview</strong> evaluates whether you can take a vague, open-ended
            prompt ("design Twitter") and drive it to a coherent, scalable architecture while reasoning aloud about
            trade-offs. It is less about the "right" answer and more about structured thinking, communication, and
            judgment.</p>
            <p>A <strong>repeatable framework</strong> prevents you from freezing or rambling. This module gives you
            one you can apply to any prompt.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>A step-by-step framework you can apply to any design prompt</li>
                <li>How to clarify requirements (functional + non-functional)</li>
                <li>Back-of-the-envelope capacity estimation</li>
                <li>Defining APIs and data models</li>
                <li>High-level design and component deep-dives</li>
                <li>Articulating and defending trade-offs</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>The Framework (RESHADED-style)</h4>
            <ol>
                <li><strong>Requirements:</strong> clarify functional (what it does) and non-functional (scale,
                latency, availability, consistency) needs. Define what's in/out of scope.</li>
                <li><strong>Estimation:</strong> back-of-the-envelope numbers — users, QPS, storage, bandwidth — to
                size the system.</li>
                <li><strong>API design:</strong> the key endpoints/operations clients use.</li>
                <li><strong>Data model:</strong> entities, relationships, and storage choices.</li>
                <li><strong>High-level design:</strong> the major components and how data flows.</li>
                <li><strong>Deep dive:</strong> drill into 1-2 critical/bottleneck components.</li>
                <li><strong>Trade-offs &amp; bottlenecks:</strong> discuss alternatives, failure modes, and scaling.</li>
            </ol>
            <h4>Functional vs Non-Functional Requirements</h4>
            <p>Functional = features (post a tweet, follow a user). Non-functional = qualities (handle 100M users,
            &lt; 200ms feed load, highly available). Non-functional requirements drive the architecture.</p>
            <h4>Drive the Conversation</h4>
            <p>The interviewer expects you to lead: state assumptions, make decisions, and check in — not wait to be
            told what to do.</p>`,
            mermaid: `flowchart TB
    R[1. Requirements<br/>functional + non-functional] --> E[2. Estimation<br/>QPS, storage, bandwidth]
    E --> A[3. API design]
    A --> D[4. Data model]
    D --> H[5. High-level design]
    H --> DD[6. Deep dive bottlenecks]
    DD --> T[7. Trade-offs & scaling]`
        },
        {
            title: 'How It Works',
            content: `<p>Applied to a prompt like "Design a URL shortener," the framework flows:</p>
            <ol>
                <li><strong>Requirements:</strong> shorten a URL, redirect; ~100M new URLs/day, read-heavy (100:1),
                low-latency redirect, highly available. Custom aliases? Expiry? (clarify scope)</li>
                <li><strong>Estimate:</strong> 100M writes/day ~= 1.2K writes/sec; 100x reads ~= 120K reads/sec;
                storage ~= 100M * 500 bytes/day ~= 50GB/day</li>
                <li><strong>API:</strong> POST /shorten {url} -> {shortUrl}; GET /{code} -> 301 redirect</li>
                <li><strong>Data model:</strong> code (PK) -> longUrl, createdAt, expiry; a key-value store fits</li>
                <li><strong>High-level:</strong> LB -> stateless app servers -> KV store; cache hot codes; CDN/edge
                for redirects</li>
                <li><strong>Deep dive:</strong> how to generate unique short codes (counter+base62 vs hash);
                cache strategy; read scaling</li>
                <li><strong>Trade-offs:</strong> counter (simple, sequential, predictable) vs hash (random, collision
                handling); SQL vs NoSQL; consistency of click counts</li>
            </ol>`,
            code: `// Back-of-the-envelope estimation (do this out loud)
// Assumptions:
//   Writes: 100,000,000 new URLs / day
//   Read:Write ratio: 100:1 (redirects dominate)
//
// Writes/sec  = 100,000,000 / 86,400  ~= 1,160 /s
// Reads/sec   = 1,160 * 100           ~= 116,000 /s   <- design for read scale
// Storage/day = 100M * ~500 bytes     ~= 50 GB/day
// Storage/5yr = 50 GB * 365 * 5       ~= ~91 TB
//
// Conclusion: read-heavy -> cache + replicas/CDN; modest write rate;
// large but manageable storage -> partition the key space.`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>A generic scalable web system — the "default" high-level design to adapt per prompt:</p>`,
            mermaid: `flowchart TB
    Client[Clients] --> CDN[CDN / Edge]
    CDN --> LB[Load Balancer]
    LB --> App1[App Server] & App2[App Server] & AppN[App Server]
    App1 --> Cache{Cache - Redis}
    Cache -->|miss| DB[(Primary DB)]
    DB -.->|replication| Replicas[(Read Replicas)]
    App1 -->|async| Queue[Message Queue]
    Queue --> Workers[Background Workers]
    App1 --> Blob[(Object Storage)]`
        },
        {
            title: 'Implementation',
            content: `<p>Templates you can reuse in the interview for estimation, APIs, and choices:</p>`,
            tabs: [
                {
                    label: 'Estimation Cheatsheet',
                    code: `// Numbers worth memorizing
// Seconds/day ~= 86,400 (~10^5). So X/day -> X/10^5 per second.
// 1 million writes/day  ~= 12 writes/sec
// 1 billion reads/day   ~= 12,000 reads/sec
//
// Latency ballpark (Jeff Dean numbers, rounded):
//   L1 cache: ~1 ns | Main memory: ~100 ns | SSD read: ~100 us
//   Same-DC round trip: ~0.5 ms | Cross-region RT: ~50-150 ms
//
// Storage sizing:
//   1 char ~= 1 byte; a tweet ~= 300 bytes; an image ~= 200KB-2MB
//   Always multiply by retention (days/years) and replication factor.`,
                    language: 'csharp'
                },
                {
                    label: 'API Sketch',
                    code: `// Keep APIs simple and resource-oriented; show request/response shape
// Example: a social feed service
// POST /posts            { text, mediaUrl? }        -> 201 { postId }
// GET  /feed?cursor=...   -> { items: [Post], nextCursor }   (paginated)
// POST /users/{id}/follow -> 204
// GET  /users/{id}        -> { profile, counts }
//
// Mention: pagination (cursor), idempotency for writes, auth (token),
// and which calls are read-heavy (feed) -> cache/fan-out strategy.`,
                    language: 'csharp'
                },
                {
                    label: 'Decision Template',
                    code: `// Frame every major choice as a trade-off, not a fact:
// "We could use SQL or NoSQL here.
//  - SQL gives us transactions + flexible queries, but is harder to shard.
//  - NoSQL (key-value/wide-column) scales writes/horizontal easily,
//    but pushes joins/consistency to the app.
//  Given this is read-heavy key lookups at 100K QPS with simple access
//  patterns, I'd choose a partitioned KV store + cache, accepting
//  eventual consistency for click counts."
//
// State the options -> the criteria -> the decision -> what you trade away.`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Clarify Before Designing</h4>
            <p>Spend the first few minutes nailing down requirements and scope. Designing the wrong thing fast is
            worse than designing the right thing deliberately.</p>
            <h4>Do: Estimate to Justify Decisions</h4>
            <p>Use rough numbers to decide whether you need caching, sharding, or just a single database. Estimation
            grounds the design in reality.</p>
            <h4>Do: Start Simple, Then Scale</h4>
            <p>Present a straightforward design first, then evolve it to handle the scale/bottlenecks. Don't open with
            a 30-box diagram.</p>
            <h4>Do: Think Out Loud and Drive</h4>
            <p>Narrate your reasoning and lead the conversation. The interviewer is assessing how you think, not just
            the final picture.</p>
            <h4>Do: Discuss Trade-offs Explicitly</h4>
            <p>For each major choice, name alternatives and what you gain/lose. "It depends, and here's on what" is a
            strong stance.</p>
            <h4>Do: Address Failures and Bottlenecks</h4>
            <p>Proactively discuss single points of failure, hot spots, and what happens under 10x load.</p>`,
            callout: {
                type: 'tip',
                title: 'Manage the Clock',
                text: 'A 45-minute design has a budget: ~5 min requirements, ~5 min estimation, ~10 min high-level design, ~15 min deep dive, ~5 min trade-offs/wrap-up. Don\u2019t spend 20 minutes on requirements or you\u2019ll never reach the interesting design and depth the interviewer wants to see.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Jumping Straight to Solutions</h4>
            <p>Drawing boxes before clarifying requirements leads to designing the wrong system. Clarify first.</p>
            <h4>Mistake: Over-Engineering from the Start</h4>
            <p>Opening with microservices, Kafka, and sharding for a problem that fits on one server signals poor
            judgment. Start simple; add complexity when scale demands it.</p>
            <h4>Mistake: Ignoring Non-Functional Requirements</h4>
            <p>Scale, latency, availability, and consistency drive the architecture. Skipping them produces a design
            that can't justify its choices.</p>
            <h4>Mistake: No Estimation</h4>
            <p>Without numbers you can't justify caching/sharding. "It depends" with no quantification is weak.</p>
            <h4>Mistake: Silent Designing</h4>
            <p>Working quietly denies the interviewer insight into your reasoning. Narrate continuously.</p>
            <h4>Mistake: Refusing to Commit</h4>
            <p>Endlessly listing options without choosing reads as indecision. State options, then make and defend a
            choice.</p>`,
            code: `// Anti-pattern: opening move
// "I'll use Kubernetes, Kafka, Cassandra, Elasticsearch, a service mesh,
//  and 12 microservices."  (for "design a URL shortener")
//
// Better opening:
// "Let me first confirm requirements and scale. ... Given ~1K writes/sec and
//  100K reads/sec, I'll start with stateless app servers behind a load
//  balancer, a key-value store for code->URL, and a cache for hot reads.
//  We can shard the key space and add a CDN if read scale grows."`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>The Interview Itself</h4>
            <p>This framework is the structure for FAANG/senior system design rounds — and the same structured
            thinking applies in real architecture discussions.</p>
            <h4>Real Architecture Reviews</h4>
            <p>Clarifying requirements, estimating load, choosing storage, and documenting trade-offs is exactly what
            an Architecture Decision Record (ADR) and design review do in practice.</p>
            <h4>Capacity Planning</h4>
            <p>Back-of-the-envelope estimation is a daily skill for sizing infrastructure and deciding when to add
            caching or scale out.</p>
            <h4>Cross-Team Communication</h4>
            <p>Driving a structured design conversation and articulating trade-offs is core to technical leadership
            and getting buy-in for designs.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Common design decisions framed as trade-offs you'll reuse:</p>`,
            table: {
                headers: ['Decision', 'Option A', 'Option B', 'Choose based on'],
                rows: [
                    ['Storage', 'SQL (ACID, queries)', 'NoSQL (scale, flexible)', 'Access patterns, scale, consistency'],
                    ['Consistency', 'Strong (CP)', 'Eventual (AP)', 'Tolerance for stale data vs availability'],
                    ['Communication', 'Sync (REST/gRPC)', 'Async (queue/events)', 'Real-time need vs decoupling'],
                    ['Feed generation', 'Fan-out on write', 'Fan-out on read', 'Read:write ratio, celebrity problem'],
                    ['Scaling', 'Vertical (bigger box)', 'Horizontal (more boxes)', 'Cost, ceiling, statelessness'],
                    ['Caching', 'Cache-aside', 'Write-through', 'Read/write mix, staleness tolerance']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Scaling reasoning to apply in any design:</p>
            <h4>Identify the Bottleneck</h4>
            <p>Most systems are read-heavy (cache + replicas + CDN) or write-heavy (sharding, queues, LSM-based
            stores). Determine which from your estimates and design accordingly.</p>
            <h4>Standard Scaling Levers</h4>
            <ul>
                <li><strong>Caching</strong> hot data (often the biggest, cheapest win)</li>
                <li><strong>Horizontal scaling</strong> of stateless app servers behind a load balancer</li>
                <li><strong>Read replicas / CDN</strong> for read scale</li>
                <li><strong>Sharding/partitioning</strong> for write/storage scale</li>
                <li><strong>Async processing</strong> (queues) to absorb spikes and decouple</li>
            </ul>
            <h4>Statelessness Enables Scale</h4>
            <p>Keep app servers stateless (state in DB/cache/session store) so you can add/remove instances freely
            behind a load balancer.</p>`,
            callout: {
                type: 'info',
                title: 'Read-Heavy vs Write-Heavy',
                text: 'Your estimation should reveal the dominant load. Read-heavy systems (social feeds, URL shorteners) lean on caching, replicas, and CDNs. Write-heavy systems (analytics ingestion, logging) lean on sharding, append-optimized stores, and queues. Designing the wrong way for the load is a common failure.'
            }
        },
        {
            title: 'Testing',
            content: `<p>"Testing" a design means stress-testing your reasoning, not unit tests.</p>
            <h4>Pressure-Test with "What If"</h4>
            <p>Ask yourself (before the interviewer does): What happens at 10x load? If this component dies? During a
            traffic spike? If the cache is cold? A strong candidate raises and answers these proactively.</p>
            <h4>Validate Estimates</h4>
            <p>Sanity-check your numbers (does 100K QPS on one DB make sense?) and let them drive whether you need
            caching/sharding — design decisions should follow from the math.</p>`,
            code: `// Self-interrogation checklist to "test" your design:
// 1. Single points of failure?      -> add redundancy / failover
// 2. What at 10x traffic?           -> which component breaks first?
// 3. Hot spots / celebrity problem? -> shard key, fan-out strategy
// 4. Cache cold / stampede?         -> request coalescing, TTL jitter
// 5. Data consistency needs?        -> strong vs eventual, where?
// 6. How do we monitor & alert?     -> metrics, SLOs
// Raise these proactively - it signals senior judgment.`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Meta-advice for the system design round itself:</p>
            <ul>
                <li><strong>Use a framework</strong> so you never freeze — requirements -> estimate -> design -> deep dive -> trade-offs</li>
                <li><strong>Clarify scope first;</strong> confirm what to optimize for</li>
                <li><strong>Quantify with estimates</strong> to justify every scaling decision</li>
                <li><strong>Lead and narrate;</strong> the interviewer assesses your thinking process</li>
                <li><strong>Commit to decisions</strong> and defend them with trade-offs</li>
                <li><strong>Manage time</strong> — reach the deep dive, don't over-invest in requirements</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'There Is No Single Right Answer',
                text: 'Interviewers evaluate structured thinking, communication, and trade-off judgment \u2014 not whether you reproduced a reference architecture. A simpler design you can justify and defend beats a complex one you can\u2019t reason about. Adapt to the interviewer\u2019s probes.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Books &amp; Courses</h4>
            <ul>
                <li><em>Designing Data-Intensive Applications</em> by Martin Kleppmann (the bible)</li>
                <li><em>System Design Interview</em> Vol 1 &amp; 2 by Alex Xu</li>
                <li>Grokking the System Design Interview (educative.io)</li>
            </ul>
            <h4>Online</h4>
            <ul>
                <li>ByteByteGo (Alex Xu) newsletter/videos</li>
                <li>High Scalability (highscalability.com) real architecture case studies</li>
                <li>Engineering blogs: Netflix, Uber, Discord, Stripe</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Use a repeatable framework:</strong> requirements -> estimation -> API -> data model -> high-level -> deep dive -> trade-offs</li>
                <li><strong>Clarify requirements first</strong> (functional + non-functional); non-functional drives architecture</li>
                <li><strong>Estimate</strong> (QPS, storage) to justify caching/replicas/sharding</li>
                <li><strong>Start simple, evolve to scale;</strong> don't over-engineer the opening</li>
                <li><strong>Think out loud and drive</strong> the conversation</li>
                <li><strong>Frame choices as trade-offs;</strong> commit and defend</li>
                <li><strong>Proactively address failures, bottlenecks, and 10x load</strong></li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Design a Pastebin in 45 Minutes</h4>
            <p>Apply the full framework to "design a Pastebin (text-sharing) service":</p>
            <ol>
                <li>Requirements: clarify functional (create/read paste, expiry, custom URL?) and non-functional
                (scale, latency, availability)</li>
                <li>Estimation: assume traffic; compute writes/sec, reads/sec, storage over 5 years</li>
                <li>API: define create and read endpoints with request/response shapes</li>
                <li>Data model + storage choice (and justify SQL vs NoSQL + object storage for large pastes)</li>
                <li>High-level design diagram (LB, app servers, store, cache, CDN)</li>
                <li>Deep dive: unique key generation and read scaling/caching</li>
                <li>Trade-offs: consistency of view counts, expiry handling, hot-paste mitigation</li>
            </ol>`,
            code: `// Time-box yourself like the real interview:
// 5m requirements -> 5m estimation -> 5m API -> 5m data model
// -> 10m high-level -> 10m deep dive -> 5m trade-offs/wrap
// Narrate every decision as a trade-off. Start simple, then scale.`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What is the first thing you should do in a system design interview?<br/>
                    <em>A: Clarify requirements \u2014 both functional (features) and non-functional (scale, latency,
                    availability, consistency) \u2014 and confirm scope, before drawing any architecture.</em></li>
                <li><strong>Q:</strong> Why do back-of-the-envelope estimation?<br/>
                    <em>A: To quantify load (QPS, storage, bandwidth) so design decisions \u2014 caching, replicas, sharding \u2014
                    are justified by real numbers rather than guesses.</em></li>
                <li><strong>Q:</strong> How should you present major design choices?<br/>
                    <em>A: As explicit trade-offs: state the options, the criteria that matter, the decision, and what you
                    give up. Then commit to and defend the choice.</em></li>
                <li><strong>Q:</strong> Why start with a simple design instead of a complex one?<br/>
                    <em>A: It shows good judgment (no over-engineering), keeps the conversation clear, and lets you evolve
                    the design to handle specific bottlenecks the estimates reveal.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'Walk me through your framework for approaching a system design interview.',
            difficulty: 'easy',
            answer: `<p>I use a repeatable structure so I never freeze:</p>
            <ol>
                <li><strong>Requirements:</strong> clarify functional features and non-functional needs (scale,
                latency, availability, consistency); confirm scope.</li>
                <li><strong>Estimation:</strong> back-of-the-envelope QPS, storage, bandwidth to size the system.</li>
                <li><strong>API design:</strong> the key client operations.</li>
                <li><strong>Data model:</strong> entities, relationships, and storage choice.</li>
                <li><strong>High-level design:</strong> major components and data flow.</li>
                <li><strong>Deep dive:</strong> drill into 1-2 bottleneck components.</li>
                <li><strong>Trade-offs &amp; scaling:</strong> alternatives, failure modes, and how it scales.</li>
            </ol>`,
            explanation: 'It is like an architect designing a building: first understand needs and constraints (requirements), estimate the size and load (estimation), sketch the floor plan (high-level), then detail the critical structural parts (deep dive) — always explaining choices.',
            bestPractices: ['Clarify before designing', 'Quantify with estimates', 'Start simple, then scale', 'Narrate and drive'],
            commonMistakes: ['Jumping to a solution', 'Skipping requirements/estimation', 'Designing silently'],
            interviewTip: 'Having a named, ordered framework you can recite signals preparation and prevents freezing — that itself impresses interviewers.',
            followUp: ['How do you time-box a 45-minute round?', 'What non-functional requirements do you always ask about?']
        },
        {
            question: 'How do you do capacity estimation, and why does it matter in a design?',
            difficulty: 'medium',
            answer: `<p><strong>Capacity estimation</strong> is rough, order-of-magnitude math to size the system: number
            of users, requests per second, storage, and bandwidth. The technique: state assumptions, convert daily
            totals to per-second (divide by ~86,400 ~= 10^5), apply read:write ratios, and multiply storage by
            retention and replication.</p>
            <p>It matters because the numbers <em>drive the design</em>: they tell you whether one database suffices
            or you need caching, replicas, or sharding; whether the system is read- or write-heavy; and where the
            bottleneck will be. Decisions justified by estimates are far stronger than "it depends."</p>`,
            explanation: 'Estimation is like checking how many guests are coming before deciding whether to cook at home or hire a catering hall. The headcount (numbers) determines the architecture, not the other way around.',
            code: `// 500M reads/day, 5M writes/day:
// reads/sec  = 500,000,000 / 86,400 ~= 5,800/s
// writes/sec = 5,000,000 / 86,400   ~= 58/s   (read:write ~ 100:1)
// -> strongly read-heavy: cache + replicas/CDN; single primary handles writes`,
            language: 'csharp',
            bestPractices: ['State assumptions explicitly', 'Use ~10^5 seconds/day shortcut', 'Apply read:write ratio', 'Multiply storage by retention + replication'],
            commonMistakes: ['Skipping estimation entirely', 'Over-precise math (it is order-of-magnitude)', 'Not tying numbers back to design decisions'],
            interviewTip: 'Do the math out loud and explicitly connect the result to a decision ("read-heavy -> we need caching"). The connection is the point, not the arithmetic.',
            followUp: ['How would the design change if it were write-heavy?', 'What latency numbers do you keep in mind?']
        },
        {
            question: 'How do you decide between fan-out-on-write and fan-out-on-read for a social feed, and what about the celebrity problem?',
            difficulty: 'hard',
            answer: `<p>This is the classic feed trade-off:</p>
            <ul>
                <li><strong>Fan-out on write (push):</strong> when a user posts, write it into every follower's
                precomputed feed. Reads are fast (feed is ready), but writes are expensive and amplify with follower
                count.</li>
                <li><strong>Fan-out on read (pull):</strong> store posts once; build each user's feed by querying the
                people they follow at read time. Writes are cheap, but reads are expensive and slower.</li>
            </ul>
            <p>Choose based on the read:write ratio and follower distribution. Most feeds are read-heavy, favoring
            push for fast reads. But the <strong>celebrity problem</strong> breaks pure push: a user with 100M
            followers triggers 100M writes per post. The standard solution is <strong>hybrid</strong>: push for
            normal users, but for celebrities (high follower counts) use pull — followers merge celebrity posts at
            read time. This bounds write amplification while keeping most reads fast.</p>`,
            explanation: 'Push is like printing and mailing a newsletter to every subscriber the moment you write it (great for readers, brutal if you have 100M subscribers). Pull is like everyone checking your bulletin board when they want news (cheap to post, slow to read). For mega-celebrities you switch to the bulletin board so you are not mailing 100M letters per post.',
            code: `// Hybrid feed strategy
// Normal user posts -> fan-out on WRITE into followers' feeds (fast reads)
// Celebrity posts    -> NOT fanned out; stored once
// Feed read = precomputed feed (push) MERGED with pulled celebrity posts
//
// Threshold example: if followerCount > 1,000,000 -> treat as celebrity (pull)
// Bounds write amplification while keeping typical reads fast.`,
            language: 'csharp',
            bestPractices: ['Pick based on read:write ratio and follower distribution', 'Use hybrid push/pull to handle celebrities', 'Cache hot feeds; paginate with cursors', 'Precompute for the common case, compute on read for outliers'],
            commonMistakes: ['Pure push (breaks on celebrities)', 'Pure pull (slow reads at scale)', 'Ignoring the follower-count distribution', 'No caching of generated feeds'],
            interviewTip: 'Name both strategies, tie the choice to read:write ratio, then proactively raise the celebrity problem and present the hybrid solution before the interviewer asks — that foresight is the senior signal.',
            followUp: ['What threshold defines a "celebrity" and why?', 'How do you keep precomputed feeds consistent?', 'How does ranking/relevance complicate this?'],
            seniorPerspective: 'The detail that separates strong candidates here is recognizing that the follower-count distribution is heavily skewed \u2014 a tiny number of accounts have enormous followings \u2014 so a single uniform strategy is wrong. I design for the common case with push (most users have few followers, reads must be fast) and special-case the long tail with pull, merging at read time. I also flag that this interacts with ranking: once feeds are algorithmically ranked rather than chronological, the precomputed feed becomes a candidate set that a ranking service reorders at read time, which shifts more work back toward read-time computation anyway.'
        }
    ,
        {
            question: 'How do you do back-of-the-envelope capacity estimation in a system design interview?',
            difficulty: 'hard',
            answer: `<p>Estimation translates requirements into the numbers that drive design decisions \u2014 QPS, storage, bandwidth \u2014 using round figures and stated assumptions.</p>
            <ul>
                <li><strong>Start from users/actions</strong> \u2014 e.g., 100M DAU \u00d7 10 actions/day \u2248 1B requests/day \u2248 ~12K average QPS; multiply by a peak factor (often 2\u20133x) for peak QPS.</li>
                <li><strong>Storage</strong> \u2014 items/day \u00d7 size \u00d7 retention. 1B writes/day \u00d7 1KB \u2248 1TB/day \u2248 365TB/year.</li>
                <li><strong>Bandwidth</strong> \u2014 QPS \u00d7 payload size for ingress/egress.</li>
                <li><strong>Read:write ratio</strong> \u2014 drives caching and replica decisions.</li>
            </ul>
            <p>The point is not precision but identifying the dominant constraint that shapes the architecture.</p>`,
            explanation: 'It is like estimating whether a party needs one pizza or fifty before planning the kitchen: you don\u2019t need the exact slice count, just the order of magnitude that decides everything downstream.',
            code: `// Worked estimate (state assumptions, use round numbers)
// 100M DAU x 10 writes/day = 1B writes/day
// 1B / 86,400s  ~= 11.6K writes/sec average
// peak factor 3x          ~= ~35K writes/sec peak
// 1B writes/day x 1KB     = 1 TB/day -> ~365 TB/year (before replication)
// read:write = 100:1      -> ~1.16M reads/sec average -> caching is mandatory`,
            language: 'javascript',
            bestPractices: ['State assumptions explicitly and use round numbers', 'Compute average then apply a peak multiplier', 'Translate each number into a design decision (cache, shard, replica)', 'Identify the dominant constraint rather than chasing precision'],
            commonMistakes: ['Skipping estimation, then making unjustified scaling choices', 'Sizing for average load instead of peak', 'Producing numbers with no design conclusion', 'Getting lost in precise arithmetic instead of orders of magnitude'],
            interviewTip: 'Narrate the math and immediately draw the conclusion ("1.16M reads/sec, so we need aggressive caching and read replicas"). Numbers without consequences score nothing.',
            followUp: ['How does read:write ratio change the design?', 'What peak factor do you assume and why?', 'How does estimation inform sharding?'],
            seniorPerspective: 'I anchor on the number that breaks the naive design \u2014 usually peak QPS or read volume \u2014 because that single figure dictates caching, sharding, and replication. The estimate exists to find that constraint, not to be exact.',
            architectPerspective: 'Capacity estimation is requirements-to-architecture translation: it surfaces the dominant non-functional constraint early so the design is grounded in scale reality rather than buzzwords. Getting it roughly right prevents both over- and under-engineering.'
        },
        {
            question: 'How do you approach API design and data modeling in a system design interview?',
            difficulty: 'medium',
            answer: `<p>After requirements and high-level design, define the <strong>contract and the data</strong>:</p>
            <ul>
                <li><strong>API</strong> \u2014 the core endpoints/operations with inputs, outputs, and key semantics (idempotency, pagination, auth). Choose a style (REST/gRPC/GraphQL) that fits the consumers.</li>
                <li><strong>Data model</strong> \u2014 entities, relationships, and access patterns; pick storage (relational vs NoSQL) based on those patterns and consistency needs.</li>
                <li><strong>Let access patterns drive choices</strong> \u2014 e.g., known key lookups at huge scale lean NoSQL; complex ad-hoc queries lean relational.</li>
                <li><strong>Define keys/indexes</strong> \u2014 partition/sort keys for NoSQL, primary keys and indexes for relational.</li>
            </ul>`,
            explanation: 'API design is agreeing on the menu (what callers can order); data modeling is designing the pantry and shelves (how it\u2019s stored) so the orders you actually get are fast to fulfill.',
            code: `// Core API sketch (semantics matter as much as shape)
// POST /v1/orders            (Idempotency-Key header)  -> 201 {orderId}
// GET  /v1/orders/{id}                                  -> 200 {order}
// GET  /v1/users/{id}/orders?cursor=&limit=20           -> cursor pagination

// Data model driven by access patterns (NoSQL single-table example):
// PK=USER#123  SK=PROFILE
// PK=USER#123  SK=ORDER#2024-001   (query: user's orders via begins_with ORDER#)`,
            language: 'javascript',
            bestPractices: ['Define API semantics (idempotency, pagination, auth), not just shape', 'Model data around real access patterns, not abstract entities', 'Choose storage from query/consistency needs (relational vs NoSQL)', 'Specify keys/indexes that serve the stated queries'],
            commonMistakes: ['Designing tables before knowing the access patterns', 'Ignoring idempotency/pagination on the API', 'Picking NoSQL for ad-hoc query needs (or relational at extreme key-value scale)', 'No indexes/keys defined for the queries you described'],
            interviewTip: 'Tie every storage and key choice back to an access pattern you stated. Mentioning idempotency keys and cursor pagination on the API signals production maturity.',
            followUp: ['When would you choose NoSQL over relational here?', 'Why cursor over offset pagination?', 'How do access patterns drive the partition key?'],
            seniorPerspective: 'I write the access patterns first and let them dictate the data model and storage \u2014 especially with NoSQL, where an unplanned query later means a new index or a migration. The API contract gets the same rigor: idempotency and pagination are not afterthoughts.',
            architectPerspective: 'The API and data model are the durable contracts of the system \u2014 hardest to change once clients and data exist. Grounding them in access patterns and explicit semantics up front is what prevents painful migrations and breaking changes later.'
        },
        {
            question: 'How do you identify and address bottlenecks when scaling a design?',
            difficulty: 'advanced',
            answer: `<p>Find the component that saturates first under projected load, then apply the matching scaling pattern:</p>
            <ul>
                <li><strong>Database read load</strong> \u2014 add caching (cache-aside) and read replicas; the single writer is the next ceiling.</li>
                <li><strong>Database write load</strong> \u2014 shard/partition by a high-cardinality key; consider async writes/queues to smooth spikes.</li>
                <li><strong>Hot keys/partitions</strong> \u2014 redistribute with better keys or add a cache layer in front.</li>
                <li><strong>Stateful app tier</strong> \u2014 make it stateless so it scales horizontally behind a load balancer.</li>
                <li><strong>Synchronous coupling</strong> \u2014 introduce queues/async to decouple and absorb bursts.</li>
            </ul>
            <p>Then re-check: fixing one bottleneck usually exposes the next.</p>`,
            explanation: 'Scaling is like widening a highway: there is always one stretch that jams first. You widen it, traffic flows \u2014 until the next interchange becomes the new chokepoint. You chase the moving bottleneck.',
            code: `// Bottleneck \u2192 pattern cheat-sheet
// read-heavy DB  -> cache (cache-aside) + read replicas
// write-heavy DB -> shard by high-cardinality key; async write queue
// hot partition  -> better key distribution / fronting cache
// stateful tier  -> make stateless, scale horizontally
// sync chains    -> queues/async to decouple and absorb bursts
// single LB/region -> multi-AZ/region + DNS/global LB`,
            language: 'javascript',
            bestPractices: ['Locate the first component to saturate under projected load', 'Apply the pattern that matches the specific bottleneck', 'Make the app tier stateless so it scales out trivially', 'Re-evaluate after each fix \u2014 the bottleneck moves'],
            commonMistakes: ['Adding random scaling tricks without identifying the actual bottleneck', 'Scaling the app tier when the database is the limit', 'Ignoring the single-writer ceiling after adding read replicas', 'Assuming one fix is final instead of chasing the moving bottleneck'],
            interviewTip: 'Name the specific bottleneck before proposing a fix, and acknowledge that solving it reveals the next one. That iterative, evidence-based reasoning is the senior signal.',
            followUp: ['What is the limit of read replicas?', 'How do you pick a shard key?', 'When does async/queueing help vs hurt?'],
            seniorPerspective: 'I resist scaling everything at once \u2014 I find the component that breaks first, fix exactly that, and re-measure. Most "scale it" answers waste effort optimizing parts that were never the constraint.',
            architectPerspective: 'Scalability is the discipline of moving bottlenecks deliberately: each tier has a ceiling, and architecture is choosing where to spend complexity to raise the one that matters. Statelessness and async decoupling are the highest-leverage moves because they unlock horizontal scale.'
        },
        {
            question: 'How do you handle capacity estimation in a system design interview? Walk through the math.',
            difficulty: 'hard',
            answer: `<p><strong>Capacity estimation</strong> is the back-of-envelope calculation that validates whether your design can handle the expected load. Interviewers use it to test your ability to reason about scale quantitatively.</p>
            <h4>Step-by-Step Framework:</h4>
            <ol>
                <li><strong>Clarify the numbers</strong>: DAU (Daily Active Users), peak multiplier (typically 2-5x average), read/write ratio.</li>
                <li><strong>Compute QPS</strong>: DAU × actions-per-user / 86,400 seconds = average QPS. Peak = average × peak multiplier.</li>
                <li><strong>Storage</strong>: Objects-per-day × size-per-object × retention-period. Include metadata overhead (indexes, replication).</li>
                <li><strong>Bandwidth</strong>: QPS × response-size = bytes/sec. Account for CDN offloading for static assets.</li>
                <li><strong>Memory/Cache</strong>: Working set = hot data that benefits from caching. Typically 20% of total data (80/20 rule). Size cache = hot objects × object size.</li>
            </ol>
            <h4>Example — URL Shortener:</h4>
            <ul>
                <li>100M new URLs/month → ~40 URLs/sec write, 400 URLs/sec read (10:1 ratio)</li>
                <li>Storage: 100M × 500 bytes × 60 months = 3TB over 5 years</li>
                <li>Cache: 20% hot URLs = 20M × 500 bytes = 10GB (fits in one Redis instance)</li>
                <li>Bandwidth: 400 reads/sec × 500 bytes = 200KB/sec (trivial)</li>
            </ul>
            <p><strong>Key insight:</strong> The goal is not exact numbers but reasonable orders of magnitude that inform architectural decisions (do I need sharding? how many servers? will this fit in memory?).</p>`,
            bestPractices: ['Round to powers of 10 — precision is not the goal, order-of-magnitude reasoning is', 'State assumptions explicitly ("assuming 10:1 read/write ratio")', 'Convert final numbers to hardware decisions (X servers, Y TB storage, Z GB cache)', 'Mention what changes if assumptions double (sensitivity analysis)'],
            commonMistakes: ['Spending too long on exact math (it is an estimate, not an accounting exercise)', 'Forgetting replication factor (3x storage for RF=3)', 'Not accounting for peak vs average (design for peak, not average)', 'Ignoring metadata/index overhead (often 2-3x raw data size for databases)'],
            interviewTip: 'Practice the common numbers: 86,400 sec/day ≈ 100K, 2.5M sec/month ≈ 2.5M, 1 server handles ~10K-50K QPS for simple reads. Show the interviewer you can translate DAU into infrastructure requirements in 2-3 minutes.',
            followUp: ['How do you estimate the number of servers needed?', 'What are common read/write ratios for different systems?', 'How does caching change your capacity plan?'],
            seniorPerspective: 'I keep a mental cheat sheet: 1 day = 100K seconds, 1 month = 2.5M seconds, 1 server = 10K-50K simple QPS. The point is not precision — it is quickly determining whether you need 3 servers or 300, because that fundamentally changes the architecture.',
            architectPerspective: 'Capacity estimation is the sanity check that prevents over-engineering and under-provisioning. I use it to justify or eliminate complexity: if the math shows 5K QPS at peak, you do not need distributed caching or sharding — a single well-configured database handles it. The estimation tells you which scaling patterns are necessary and which are premature.'
        },
        {
            question: 'What is the difference between a good and great system design interview answer?',
            difficulty: 'expert',
            answer: `<p>The difference lies in <strong>depth of trade-off reasoning</strong>, <strong>production awareness</strong>, and <strong>communication structure</strong> — not in naming more technologies.</p>
            <h4>Good Answer (passes):</h4>
            <ul>
                <li>Covers functional requirements and proposes a reasonable architecture</li>
                <li>Identifies the right components (load balancer, cache, database, queue)</li>
                <li>Discusses basic scalability (horizontal scaling, caching, read replicas)</li>
                <li>Addresses the main bottleneck</li>
            </ul>
            <h4>Great Answer (strong hire):</h4>
            <ul>
                <li><strong>Drives the conversation</strong>: Asks clarifying questions that reveal hidden requirements, prioritizes constraints explicitly.</li>
                <li><strong>Justifies every choice with trade-offs</strong>: "I chose Cassandra over PostgreSQL here because write throughput matters more than strong consistency for this use case."</li>
                <li><strong>Anticipates failure modes</strong>: "What happens when this cache goes down? The database gets a thundering herd — here's how I prevent that."</li>
                <li><strong>Evolves the design</strong>: Starts simple, adds complexity only where the numbers demand it. Shows the design at 10K QPS and how it changes at 1M QPS.</li>
                <li><strong>Considers operational concerns</strong>: Deployment strategy, monitoring/alerting, data migration, team ownership boundaries.</li>
                <li><strong>Demonstrates depth in key areas</strong>: When discussing caching, mentions cache invalidation strategies, consistency windows, and thundering herd prevention — not just "add Redis."</li>
            </ul>
            <p><strong>The meta-skill:</strong> A great candidate treats the interview as a collaborative design session, not a recitation. They adapt when the interviewer pushes on a constraint and show judgment about what to go deep on.</p>`,
            bestPractices: ['Structure: requirements → high-level design → deep dives → bottlenecks → evolution', 'Verbalize trade-offs explicitly ("I am choosing X over Y because...")', 'Adapt to interviewer signals (if they push on a topic, go deeper there)', 'Show the system at multiple scales (MVP → growth → massive scale)'],
            commonMistakes: ['Solution shopping (jumping to architecture without understanding requirements)', 'Breadth without depth (naming 15 components without explaining how any actually work)', 'Not engaging with the interviewer (monologuing instead of collaborating)', 'Over-engineering from the start (sharding at 1000 users, Kafka for 100 events/day)'],
            interviewTip: 'The strongest signal is showing WHY you chose something, not WHAT you chose. "I would use a message queue here" is mediocre. "I would use a message queue because the upstream service produces bursts that would overwhelm the downstream database, and I need to absorb spikes while guaranteeing eventual processing" is excellent.',
            followUp: ['How do you structure the first 5 minutes of a system design interview?', 'How do you decide what to go deep on?', 'How do you handle "design X at Google scale" questions?'],
            seniorPerspective: 'As someone who conducts these interviews, the difference is usually production experience showing through. The great candidates have clearly built and operated systems — they mention monitoring, failure modes, and operational cost because those are the things that burned them in production.',
            architectPerspective: 'I evaluate candidates on their ability to navigate ambiguity and make principled trade-offs under constraints. The architecture itself matters less than the reasoning process. A candidate who designs a simple system with clear justifications and awareness of failure modes vastly outperforms one who draws a complex diagram without explaining why each component exists.'
        }
    ]
});
