/* ═══════════════════════════════════════════════════════════════════
   System Design — Design YouTube
   Video upload, transcoding pipeline, adaptive streaming,
   CDN distribution, recommendations, and search.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('sd-youtube', {
    title: 'Design YouTube',
    description: 'System design for a video sharing platform — upload pipeline, transcoding, adaptive bitrate streaming, CDN distribution, recommendation engine, comments, and search at 1B+ daily video views.',
    sections: [
        {
            title: 'Requirements & Scale',
            content: `<h4>Functional Requirements</h4>
            <ul>
                <li>Video upload (up to 12 hours, multiple formats)</li>
                <li>Video transcoding to multiple resolutions (144p to 4K) and codecs (H.264, VP9, AV1)</li>
                <li>Adaptive bitrate streaming (auto-adjust quality based on bandwidth)</li>
                <li>Video search by title, description, tags</li>
                <li>Recommendations (home feed, related videos, trending)</li>
                <li>Comments, likes, subscriptions, playlists</li>
                <li>View count and analytics for creators</li>
                <li>Content moderation (copyright detection, inappropriate content)</li>
            </ul>
            <h4>Non-Functional Requirements</h4>
            <ul>
                <li>Scale: 500 hours of video uploaded per minute, 1B video views/day</li>
                <li>Latency: Video playback start &lt;2 seconds (time to first byte)</li>
                <li>Availability: 99.99% for video playback</li>
                <li>Storage: ~1 exabyte of video content</li>
                <li>Global: Serve viewers in every country with low latency</li>
            </ul>
            <h4>Capacity Estimation</h4>
            <ul>
                <li>500 hours/min uploaded = 720,000 hours/day of raw video</li>
                <li>Each hour transcoded to ~10 renditions = 7.2M hours of encoded video/day</li>
                <li>Average video: 5 min × 10 renditions × ~200MB avg = ~2GB storage per video</li>
                <li>1B views/day × 5 min average = 5B minutes streamed/day ≈ 58K concurrent streams at any instant</li>
                <li>CDN bandwidth: peak ~100 Tbps globally</li>
            </ul>`
        },
        {
            title: 'High-Level Architecture',
            mermaid: `graph TB
    subgraph Clients
        UPLOAD[Creator Upload Client]
        WATCH[Viewer Player]
    end
    subgraph UploadPipeline[Upload Pipeline]
        UAPI[Upload API]
        OSTORE[(Original Store<br/>Blob Storage)]
        TQUEUE[Transcoding Queue]
        TRANSCODE[Transcoding Workers]
        ESTORE[(Encoded Store<br/>Blob Storage)]
    end
    subgraph Metadata[Metadata Services]
        VMETA[Video Metadata Service]
        SEARCH_SVC[Search Service]
        REC[Recommendation Engine]
        COMMENT[Comment Service]
        ANALYTICS[Analytics Service]
    end
    subgraph Delivery[Content Delivery]
        CDN[CDN Edge Servers<br/>Global PoPs]
        ORIGIN[Origin Servers]
    end
    subgraph DataStores
        METADB[(Metadata DB<br/>MySQL/Vitess)]
        SEARCHIDX[(Search Index<br/>Elasticsearch)]
        VIEWCOUNT[(View Counter<br/>Redis + Kafka)]
        RECDB[(Rec Model Store<br/>Feature Store)]
    end
    UPLOAD --> UAPI --> OSTORE
    UAPI --> TQUEUE --> TRANSCODE --> ESTORE
    TRANSCODE --> VMETA
    VMETA --> METADB & SEARCHIDX
    WATCH --> CDN --> ORIGIN --> ESTORE
    WATCH --> VMETA & COMMENT & ANALYTICS
    VMETA --> REC --> RECDB
    ANALYTICS --> VIEWCOUNT`,
            content: `<p>The architecture splits into two major pipelines: <strong>upload/processing</strong> (async, latency-tolerant) and <strong>playback/delivery</strong> (real-time, latency-critical). The CDN handles 95%+ of video bytes.</p>`
        },
        {
            title: 'Video Upload & Transcoding Pipeline',
            content: `<p>The upload pipeline must handle large files reliably and process them asynchronously into streamable formats.</p>
            <h4>Upload Flow</h4>
            <ol>
                <li><strong>Resumable upload</strong>: Client uploads in chunks (e.g., 8MB). Server tracks progress. If connection drops, resume from last chunk.</li>
                <li><strong>Store original</strong>: Raw file stored in blob storage (S3/GCS). This is the archival master copy.</li>
                <li><strong>Queue transcoding</strong>: Publish job to transcoding queue (SQS/Pub-Sub) with video metadata.</li>
                <li><strong>Transcoding workers</strong>: Pull jobs, transcode to multiple resolutions and codecs in parallel.</li>
                <li><strong>Store encoded</strong>: Each rendition stored as segmented files (DASH/HLS) in blob storage.</li>
                <li><strong>Update metadata</strong>: Mark video as ready, update available resolutions, generate thumbnail.</li>
            </ol>
            <h4>Transcoding Matrix</h4>
            <table>
                <thead><tr><th>Resolution</th><th>Bitrate (H.264)</th><th>Bitrate (VP9)</th><th>Use Case</th></tr></thead>
                <tbody>
                    <tr><td>144p</td><td>100 kbps</td><td>80 kbps</td><td>Very slow connections</td></tr>
                    <tr><td>360p</td><td>700 kbps</td><td>500 kbps</td><td>Mobile data saving</td></tr>
                    <tr><td>720p</td><td>2.5 Mbps</td><td>1.8 Mbps</td><td>Default quality</td></tr>
                    <tr><td>1080p</td><td>5 Mbps</td><td>3.5 Mbps</td><td>HD desktop/TV</td></tr>
                    <tr><td>4K</td><td>20 Mbps</td><td>12 Mbps</td><td>Premium content</td></tr>
                </tbody>
            </table>`,
            mermaid: `sequenceDiagram
    participant Creator
    participant UploadAPI
    participant BlobStore
    participant Queue
    participant Transcoder
    participant EncodedStore
    participant MetadataDB

    Creator->>UploadAPI: Initiate resumable upload
    UploadAPI-->>Creator: Upload URL + session ID
    loop Chunked upload
        Creator->>BlobStore: Upload chunk (8MB)
        BlobStore-->>Creator: Chunk ACK
    end
    Creator->>UploadAPI: Upload complete
    UploadAPI->>Queue: Enqueue transcoding job
    UploadAPI-->>Creator: Processing... (video not yet playable)
    Queue->>Transcoder: Pull job
    par Parallel transcoding
        Transcoder->>Transcoder: Encode 360p
        Transcoder->>Transcoder: Encode 720p
        Transcoder->>Transcoder: Encode 1080p
    end
    Transcoder->>EncodedStore: Store HLS/DASH segments
    Transcoder->>MetadataDB: Mark video READY
    Note over Creator: Video now playable`
        },
        {
            title: 'Adaptive Bitrate Streaming',
            content: `<p>Videos are not streamed as single files. They are split into small segments (2-10 seconds) at multiple quality levels. The player dynamically switches quality based on available bandwidth.</p>
            <h4>How It Works (HLS/DASH)</h4>
            <ol>
                <li><strong>Manifest file</strong>: Player fetches a manifest (m3u8 for HLS, MPD for DASH) listing all available quality levels and segment URLs</li>
                <li><strong>Segment download</strong>: Player downloads segments sequentially. Each segment is self-contained (can decode independently).</li>
                <li><strong>Quality adaptation</strong>: Player measures download speed. If bandwidth drops → switch to lower quality segment next. If bandwidth increases → switch up.</li>
                <li><strong>Buffer management</strong>: Maintain 15-30 seconds of buffer. Start playback after 2-3 seconds buffered.</li>
            </ol>
            <h4>Segment Storage</h4>
            <p>A 5-minute 1080p video stored as HLS: <code>5 min ÷ 4s segments = 75 segments × 10 quality levels = 750 segment files</code> + manifest. Total storage per video across all renditions: ~2GB for a 5-minute video.</p>
            <h4>Why Segments?</h4>
            <ul>
                <li>CDN-cacheable: Each segment is a static file with a unique URL</li>
                <li>Seekable: Jump to any point → just fetch that segment</li>
                <li>Quality switching: Change quality at segment boundaries seamlessly</li>
                <li>Parallel CDN serving: Different segments can come from different edge servers</li>
            </ul>`
        },
        {
            title: 'CDN & Content Delivery',
            content: `<p>A single origin cannot serve 1B views/day. The CDN (Content Delivery Network) caches video segments at edge servers worldwide.</p>
            <h4>CDN Architecture</h4>
            <ul>
                <li><strong>Edge PoPs</strong>: 100+ points of presence globally. Serve cached segments directly to nearby viewers.</li>
                <li><strong>Mid-tier cache</strong>: Regional caches between edge and origin. Reduces origin load for less-popular content.</li>
                <li><strong>Origin</strong>: Blob storage (S3/GCS) as the authoritative source for all segments.</li>
            </ul>
            <h4>Cache Strategy</h4>
            <table>
                <thead><tr><th>Content Type</th><th>Cache Behavior</th><th>Hit Rate</th></tr></thead>
                <tbody>
                    <tr><td>Viral/trending videos</td><td>Cached at all edges</td><td>99%+</td></tr>
                    <tr><td>Popular content (top 20%)</td><td>Cached at regional + busy edges</td><td>95%</td></tr>
                    <tr><td>Long-tail content</td><td>Fetched from origin on demand, cached briefly</td><td>60-70%</td></tr>
                    <tr><td>Newly uploaded</td><td>Initially at origin, propagates as views grow</td><td>Low initially</td></tr>
                </tbody>
            </table>
            <h4>Video Start Time Optimization</h4>
            <ul>
                <li><strong>Predictive prefetch</strong>: Pre-cache first few segments of recommended videos at edge</li>
                <li><strong>DNS resolution</strong>: Route viewer to nearest edge via anycast/GeoDNS</li>
                <li><strong>TCP optimization</strong>: Persistent connections, TLS session resumption</li>
                <li><strong>Low-quality fast start</strong>: Start with 360p, then upgrade quality as buffer fills</li>
            </ul>`
        },
        {
            title: 'View Counting & Analytics',
            content: `<p>1B views/day = ~12K view events/second. Counting must be accurate (for ad revenue) but also fast (real-time display).</p>
            <h4>Challenge: Accurate Counting at Scale</h4>
            <ul>
                <li>Cannot increment a counter in a single DB row at 12K/sec (hot key problem)</li>
                <li>Must deduplicate bot views, repeated views from same user, embedded auto-plays</li>
                <li>Must be eventually consistent for display but exactly-once for monetization</li>
            </ul>
            <h4>Architecture</h4>
            <ol>
                <li><strong>Client sends view event</strong> → API server publishes to Kafka (view-events topic)</li>
                <li><strong>Stream processor</strong> (Flink/Spark Streaming): Deduplicates (userId + videoId window), filters bots, validates view duration (&gt;30s = valid view)</li>
                <li><strong>Aggregator</strong>: Maintains per-video counters in Redis (approximate, fast) AND writes validated views to analytics DB (exact, for revenue)</li>
                <li><strong>Display</strong>: Redis counter shown to users (updated every few seconds). Analytics DB used for creator dashboards and ad billing.</li>
            </ol>
            <h4>Anti-Fraud</h4>
            <p>Invalid views filtered by: view duration &lt;30s, known bot user-agents, abnormal view velocity per IP, repeated views from same userId within window, headless browser detection.</p>`
        },
        {
            title: 'Recommendation Engine',
            content: `<p>Recommendations drive 70%+ of watch time on YouTube. The system must personalize across billions of videos for billions of users.</p>
            <h4>Two-Stage Architecture</h4>
            <ol>
                <li><strong>Candidate generation</strong>: From ~100M videos, narrow to ~1000 candidates using fast, approximate models (collaborative filtering, content-based, co-watch signals)</li>
                <li><strong>Ranking</strong>: Score the 1000 candidates with a deep neural network that considers user history, video features, context (time of day, device), and engagement predictions</li>
            </ol>
            <h4>Signals Used</h4>
            <ul>
                <li>Watch history and completion rate</li>
                <li>Search queries and clicks</li>
                <li>Likes, shares, subscribes</li>
                <li>Co-watch patterns (users who watched X also watched Y)</li>
                <li>Video metadata (title, tags, category, freshness)</li>
                <li>User demographics and device</li>
            </ul>
            <h4>Serving</h4>
            <p>Recommendations pre-computed offline (batch) and cached per user. Re-ranked in real-time with latest signals when user opens app. Feature store provides user embeddings and video embeddings for online scoring.</p>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Streaming original files directly</strong>: Must transcode to multiple resolutions and segment for adaptive streaming. Original files are too large and in inconsistent formats.</li>
                <li><strong>Synchronous transcoding</strong>: Transcoding a 1-hour video takes 2-4 hours of CPU. Must be async (queue + workers), not blocking the upload request.</li>
                <li><strong>Single-file video serving</strong>: Serving a 2GB file over HTTP doesn't support seeking, quality switching, or CDN caching. Use segmented HLS/DASH.</li>
                <li><strong>Incrementing view counter in SQL</strong>: Hot key at 12K/sec. Use streaming pipeline with dedup and batch writes.</li>
                <li><strong>Storing all videos at origin</strong>: Without CDN, origin bandwidth would need 100+ Tbps. CDN is essential — serves 95%+ of bytes.</li>
                <li><strong>Ignoring the long tail</strong>: 80% of videos are rarely watched. Can't pre-cache everything at edge. Need tiered caching strategy.</li>
                <li><strong>Real-time recommendations only</strong>: Too slow to compute personalized recs for 1B users on every request. Pre-compute + online re-rank.</li>
                <li><strong>No resumable upload</strong>: Large file uploads over unreliable connections will fail constantly. Must support chunked resumable uploads.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li>Clear separation of upload pipeline (async) vs playback pipeline (real-time)</li>
                    <li>Understanding of video transcoding: why multiple resolutions, what HLS/DASH is</li>
                    <li>CDN architecture: edge → mid-tier → origin, cache hit rates by content popularity</li>
                    <li>Adaptive bitrate streaming mechanics (manifest + segments + quality switching)</li>
                    <li>View counting at scale: streaming pipeline, dedup, approximate vs exact counts</li>
                    <li>Recommendation system: two-stage (candidate gen + ranking), offline + online</li>
                    <li>Storage estimation: hours uploaded × renditions × segment size = daily storage growth</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Video upload is async: store original → queue → transcode → store segments → mark ready</li>
                <li>HLS/DASH segments enable adaptive streaming, CDN caching, seeking, and quality switching</li>
                <li>CDN serves 95%+ of video bytes; tiered caching by content popularity</li>
                <li>Transcoding is massively parallel: each resolution/codec is independent work</li>
                <li>View counting uses streaming pipeline with dedup — not a SQL counter</li>
                <li>Recommendations: pre-compute candidates offline, re-rank online with fresh signals</li>
                <li>Resumable chunked upload is essential for large video files over unreliable networks</li>
                <li>Content moderation (copyright, safety) runs as a parallel pipeline on uploaded content</li>
            </ul>`
        }
    ],
    questions: [
        {
            id: 'sd-yt-q1',
            level: 'senior',
            title: 'How would you design the video upload and processing pipeline?',
            answer: `<p>The pipeline handles large files asynchronously:</p>
            <ol>
                <li><strong>Resumable upload</strong>: Client uploads in 8MB chunks with a session ID. Server stores chunks in blob storage. If interrupted, client resumes from last ACK'd chunk.</li>
                <li><strong>Original storage</strong>: Complete file stored in blob storage (S3/GCS) as permanent archive.</li>
                <li><strong>Transcoding queue</strong>: Job published to message queue with video metadata (resolution, duration, codec requirements).</li>
                <li><strong>Transcoding workers</strong>: Stateless workers pull jobs. Each video is split into GOP-aligned chunks and transcoded in parallel across workers. Output: multiple resolutions × codecs.</li>
                <li><strong>Segmentation</strong>: Encoded output split into 4-second HLS/DASH segments. Manifest file generated listing all segments and quality levels.</li>
                <li><strong>Metadata update</strong>: Video status → READY. Available resolutions updated. Thumbnail extracted. Notification sent to creator.</li>
            </ol>
            <p>The entire pipeline is idempotent — if a worker crashes, the job is re-queued and reprocessed without duplication.</p>`
        },
        {
            id: 'sd-yt-q2',
            level: 'mid',
            title: 'What is adaptive bitrate streaming and why is it needed?',
            answer: `<p>Adaptive bitrate streaming (ABR) automatically adjusts video quality based on the viewer's available bandwidth:</p>
            <ul>
                <li>Video is encoded at multiple quality levels (144p to 4K)</li>
                <li>Each version is split into small segments (2-10 seconds)</li>
                <li>A manifest file (m3u8/MPD) lists all available qualities and segment URLs</li>
                <li>The player downloads segments sequentially. It measures download speed and switches quality at segment boundaries.</li>
                <li>If bandwidth drops (e.g., WiFi → cellular) → player switches to lower quality with no interruption</li>
                <li>If bandwidth increases → player switches up for better quality</li>
            </ul>
            <p>Without ABR, users on slow connections would experience constant buffering. With ABR, they get the best quality their connection can sustain, seamlessly.</p>`
        },
        {
            id: 'sd-yt-q3',
            level: 'senior',
            title: 'How would you design the CDN architecture for video delivery at YouTube scale?',
            answer: `<p>Three-tier CDN hierarchy:</p>
            <ul>
                <li><strong>Edge PoPs (L1)</strong>: 100+ locations globally. Each PoP has SSD-backed cache servers. Serves popular content directly to nearby viewers. Cache hit rate: 90%+ for popular videos.</li>
                <li><strong>Regional caches (L2)</strong>: Fewer, larger data centers. Catch cache misses from edge. Store wider catalog. Hit rate: additional 5-8%.</li>
                <li><strong>Origin (L3)</strong>: Blob storage with all content. Only serves cache misses from regional tier. Handles &lt;5% of total requests but stores everything.</li>
            </ul>
            <p>Routing: GeoDNS/Anycast routes viewer to nearest edge. If segment not cached → fetch from regional → origin. Cache filled on first request (pull-through). Popular videos proactively pushed to edges.</p>`
        },
        {
            id: 'sd-yt-q4',
            level: 'mid',
            title: 'How does YouTube handle view counting at scale without hot key issues?',
            answer: `<p>12K view events/second cannot increment a single DB row. The architecture uses a streaming pipeline:</p>
            <ol>
                <li>Client sends view event → API publishes to Kafka (view-events topic)</li>
                <li>Stream processor (Flink) deduplicates (userId + videoId window), filters bots, validates duration (&gt;30s)</li>
                <li>Aggregator writes validated counts to Redis (approximate, fast display) AND analytics DB (exact, for ad revenue)</li>
                <li>Redis counter displayed to users (best-effort, updated every few seconds)</li>
                <li>Analytics DB is source of truth for creator monetization</li>
            </ol>`
        },
        {
            id: 'sd-yt-q5',
            level: 'architect',
            title: 'How would you design the recommendation system for YouTube?',
            answer: `<p>Two-stage architecture:</p>
            <ul>
                <li><strong>Candidate generation</strong>: From 100M+ videos, narrow to ~1000 candidates using collaborative filtering, content similarity, and co-watch signals. This runs on user embeddings in a vector index.</li>
                <li><strong>Ranking</strong>: Deep neural network scores the 1000 candidates considering: watch history, engagement predictions, recency, diversity, and user context (device, time of day).</li>
                <li><strong>Serving</strong>: Pre-computed candidates cached per user. Re-ranked online with latest signals on each request.</li>
                <li><strong>Feedback loop</strong>: User engagement (watch time, clicks, skips) feeds back into training data for model improvement.</li>
            </ul>`
        },
        {
            id: 'sd-yt-q6',
            level: 'senior',
            title: 'How does the video transcoding pipeline work at YouTube scale (500+ hours uploaded per minute)?',
            answer: `<p>YouTube's transcoding pipeline must process 500+ hours of video per minute into dozens of formats:</p>
<h4>Pipeline stages:</h4>
<ol>
<li><strong>Upload ingestion:</strong> Video uploaded to blob storage (GCS), metadata written to queue. Chunked upload supports resumability for large files.</li>
<li><strong>Validation:</strong> Check format, codec, file integrity. Reject corrupted or unsupported formats.</li>
<li><strong>Transcoding DAG:</strong> Each video is encoded into 20-30 renditions (resolutions × codecs): 144p to 4K, H.264/VP9/AV1. Each rendition is an independent job — massively parallelizable.</li>
<li><strong>Segmentation:</strong> Each rendition split into 2-10 second segments for adaptive bitrate streaming (DASH/HLS manifests generated).</li>
<li><strong>Quality verification:</strong> Automated VMAF scoring to verify transcoded quality meets thresholds.</li>
<li><strong>CDN distribution:</strong> Completed segments pushed to edge caches.</li>
</ol>
<h4>Scale strategies:</h4>
<ul>
<li><strong>Priority queues:</strong> Popular creator uploads processed first; small channels processed in batch later.</li>
<li><strong>Spot/preemptible instances:</strong> Transcoding is batch workload — perfect for cheap spot instances with checkpointing.</li>
<li><strong>Incremental availability:</strong> Lower resolutions available first (240p, 360p, 720p) while higher resolutions still encoding — viewers can start watching immediately.</li>
<li><strong>Content-aware encoding:</strong> Simpler scenes get lower bitrate → 20-30% storage savings without quality loss.</li>
</ul>`
        },
        {
            id: 'sd-yt-q7',
            level: 'senior',
            title: 'How does YouTube serve video globally while managing 100+ Tbps of traffic?',
            answer: `<p>YouTube's CDN architecture is a multi-tier caching system designed to serve video from as close to the viewer as possible:</p>
<h4>CDN tiers:</h4>
<ol>
<li><strong>Edge caches (Google Global Cache / GGC):</strong> Deployed inside ISP networks worldwide. Store the most popular content for that ISP's user base. Serve 90%+ of traffic.</li>
<li><strong>Regional caches:</strong> Larger cache pools at Google PoPs. Serve cache misses from edge caches. Store the long tail of content for a geographic region.</li>
<li><strong>Origin (Google data centers):</strong> Full content library in cloud storage (GCS). Only serves cache misses from regional tier (a tiny fraction of total traffic).</li>
</ol>
<h4>Routing and selection:</h4>
<ul>
<li>Client requests manifest → YouTube API returns segment URLs pointing to the optimal cache server</li>
<li>Selection based on: geographic proximity, server health/load, cache hit probability</li>
<li>If a segment isn't cached at the selected server, it's fetched from the next tier (pull-through caching)</li>
</ul>
<h4>Content pre-positioning:</h4>
<ul>
<li>Viral/trending videos proactively pushed to edge caches before demand spikes</li>
<li>New uploads from popular creators fast-tracked to edges in anticipated viewer regions</li>
<li>Long-tail content (old, niche videos) only cached on demand — evicted when cold</li>
</ul>
<p><strong>Key insight:</strong> The CDN is the product at this scale. Without it, Google's backbone would need to carry 100+ Tbps — economically impossible. Pushing content to the ISP edge reduces backbone traffic by 90%+ and delivers sub-100ms latency to viewers.</p>`
        },
        {
            id: 'sd-yt-q8',
            level: 'architect',
            title: 'How would you design YouTube search to return relevant results from 800M+ videos in under 200ms?',
            answer: `<p>Search over 800M+ videos requires a multi-stage retrieval + ranking pipeline, not a single query:</p>
<h4>Architecture:</h4>
<ol>
<li><strong>Query understanding:</strong> Parse user query → spell correction, entity extraction, intent classification (is this a channel name? a song? a topic?). Expand query with synonyms and related terms.</li>
<li><strong>Retrieval (candidate generation):</strong> Two parallel retrieval paths:
<ul>
<li><strong>Inverted index (lexical):</strong> Traditional text matching on title, description, captions, tags. Returns top-N by BM25/TF-IDF.</li>
<li><strong>Vector search (semantic):</strong> Query embedding compared to video embeddings via ANN (approximate nearest neighbor). Catches semantic matches even without keyword overlap.</li>
</ul>
Both return ~1000 candidates in &lt;50ms.</li>
<li><strong>Ranking:</strong> ML model scores candidates using: relevance signals (text match, semantic similarity), quality signals (video quality, engagement rate, recency), personalization signals (user watch history, preferences).</li>
<li><strong>Filtering:</strong> Apply content policies, geographic restrictions, age-gating, freshness requirements.</li>
<li><strong>Blending:</strong> Mix organic results with ads, playlists, and channels for the final SERP.</li>
</ol>
<h4>Latency budget (~200ms total):</h4>
<ul>
<li>Query understanding: 10-20ms</li>
<li>Parallel retrieval (index + vector): 30-50ms</li>
<li>Ranking model inference: 50-80ms</li>
<li>Filtering + blending: 10-20ms</li>
<li>Network overhead: 20-40ms</li>
</ul>
<p><strong>Sharding:</strong> The index is sharded by video-ID across thousands of machines. Each query is scatter-gathered across shards in parallel, then results are merged.</p>`
        }
    ]
});
