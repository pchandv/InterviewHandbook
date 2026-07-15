/* ═══════════════════════════════════════════════════════════════════
   System Design — Notification System
   Full coverage: architecture, channels, priority, throttling,
   templates, delivery tracking, diagrams, and interview questions.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('sd-notification', {
    title: 'Design a Notification System',
    description: 'System design for a multi-channel notification platform — push, email, SMS, in-app with priority queues, rate limiting, user preferences, template engine, delivery tracking, and analytics.',
    sections: [
        {
            title: 'Requirements & Scope',
            content: `<p>A notification system delivers messages across multiple channels while respecting user preferences and operational constraints.</p>
            <h4>Functional Requirements</h4>
            <ul>
                <li>Multi-channel delivery: Push (FCM/APNS), Email (SMTP), SMS (Twilio), In-App (WebSocket)</li>
                <li>User preference management (per channel, per category, quiet hours)</li>
                <li>Priority levels: Critical (2FA), High (orders), Normal (social), Low (marketing)</li>
                <li>Template engine with personalization, localization, A/B variants</li>
                <li>Delivery tracking: queued → sent → delivered → opened → clicked</li>
                <li>Deduplication and idempotency</li>
            </ul>
            <h4>Non-Functional Requirements</h4>
            <ul>
                <li>Scale: 100M+ users, billions of notifications/day</li>
                <li>Latency: Critical notifications &lt;1s, normal &lt;30s</li>
                <li>Availability: 99.99% for critical channel</li>
                <li>At-least-once delivery with dedup</li>
            </ul>`
        },
        {
            title: 'High-Level Architecture',
            mermaid: `graph TB
    subgraph Producers
        SVC1[Order Service]
        SVC2[Auth Service]
        SVC3[Social Service]
        SVC4[Marketing Service]
    end
    subgraph NotificationPlatform[Notification Platform]
        INGEST[Event Ingestion]
        DEDUP[Dedup Engine]
        PREF[Preference Engine]
        TMPL[Template Engine]
        RATE[Rate Limiter]
        ROUTER[Channel Router]
        PQ_CRIT[P0 Critical Queue]
        PQ_HIGH[P1 High Queue]
        PQ_NORM[P2 Normal Queue]
        PQ_LOW[P3 Low Queue]
    end
    subgraph Dispatchers
        PUSH[Push Dispatcher]
        EMAIL[Email Dispatcher]
        SMS[SMS Dispatcher]
        INAPP[In-App Dispatcher]
    end
    subgraph Providers
        FCM[FCM / APNS]
        SMTP[SendGrid / SES]
        TWILIO[Twilio]
        WS[WebSocket Gateway]
    end
    SVC1 & SVC2 & SVC3 & SVC4 --> INGEST
    INGEST --> DEDUP --> PREF --> TMPL --> RATE --> ROUTER
    ROUTER --> PQ_CRIT & PQ_HIGH & PQ_NORM & PQ_LOW
    PQ_CRIT & PQ_HIGH --> PUSH & EMAIL & SMS & INAPP
    PQ_NORM & PQ_LOW --> PUSH & EMAIL & INAPP
    PUSH --> FCM
    EMAIL --> SMTP
    SMS --> TWILIO
    INAPP --> WS`,
            content: `<p>The architecture separates <strong>decision logic</strong> (what to send, to whom, via which channel) from <strong>delivery mechanics</strong> (actually sending via providers). This separation enables independent scaling and provider swaps.</p>`
        },
        {
            title: 'Core Components Deep Dive',
            content: `<h4>1. Event Ingestion</h4>
            <p>Services publish domain events (OrderShipped, LoginAttempt) to a message bus. The notification service subscribes and translates events into notification intents.</p>
            <h4>2. Deduplication Engine</h4>
            <p>Each event carries a deterministic <strong>idempotency key</strong> (e.g., <code>order_123_shipped</code>). A Redis-backed dedup store with TTL prevents duplicate notifications from retries or fan-out duplication.</p>
            <h4>3. Preference Engine</h4>
            <p>Checks user settings: channel opt-in/out, category preferences, quiet hours (timezone-aware), and frequency caps. Critical notifications bypass preferences except hard opt-outs.</p>
            <h4>4. Template Engine</h4>
            <p>Renders content at send-time (not queue-time) for freshest data. Supports personalization tokens, i18n localization, and A/B test variants. Templates are versioned and managed via admin portal.</p>
            <h4>5. Rate Limiter</h4>
            <p>Token bucket per user per channel. Default caps: 10 push/hour, 5 email/day, 3 SMS/day. Critical (P0) bypasses rate limits. Exceeding caps → batch into digest or defer.</p>
            <h4>6. Channel Router</h4>
            <p>Based on preference resolution, routes notification to one or more channel queues. Applies fan-out (one event → multiple channels) or consolidation (multiple events → one digest).</p>`,
            code: `// Rate limiter using sliding window (Redis)
public class NotificationRateLimiter
{
    private readonly IDatabase _redis;
    
    public async Task<bool> IsAllowedAsync(string userId, string channel, Priority priority)
    {
        // Critical notifications always pass
        if (priority == Priority.Critical) return true;
        
        var key = $"ratelimit:{userId}:{channel}";
        var window = TimeSpan.FromHours(1);
        var limit = GetLimit(channel); // push=10, email=5, sms=3
        
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var windowStart = now - (long)window.TotalMilliseconds;
        
        // Remove expired entries, count current, add new
        var transaction = _redis.CreateTransaction();
        transaction.SortedSetRemoveRangeByScoreAsync(key, 0, windowStart);
        transaction.SortedSetAddAsync(key, now.ToString(), now);
        transaction.KeyExpireAsync(key, window + TimeSpan.FromMinutes(1));
        await transaction.ExecuteAsync();
        
        var count = await _redis.SortedSetLengthAsync(key);
        return count <= limit;
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Priority Queue Design',
            content: `<p>Not all notifications are equal. A 2FA code must arrive in under 1 second; a marketing digest can wait hours.</p>
            <table>
                <thead><tr><th>Priority</th><th>Examples</th><th>SLA</th><th>Rate Limit</th><th>Retry</th></tr></thead>
                <tbody>
                    <tr><td><strong>P0 Critical</strong></td><td>2FA codes, security alerts, password reset</td><td>&lt;1s</td><td>Bypass</td><td>Aggressive (3x in 30s)</td></tr>
                    <tr><td><strong>P1 High</strong></td><td>Order confirmations, payment receipts, delivery updates</td><td>&lt;5s</td><td>Relaxed</td><td>3x exponential</td></tr>
                    <tr><td><strong>P2 Normal</strong></td><td>Social notifications, comments, likes</td><td>&lt;30s</td><td>Standard</td><td>3x with backoff</td></tr>
                    <tr><td><strong>P3 Low</strong></td><td>Marketing, newsletters, recommendations</td><td>&lt;1h</td><td>Strict</td><td>1x only</td></tr>
                </tbody>
            </table>`,
            mermaid: `graph LR
    subgraph PriorityQueues[Priority Queues]
        P0[P0 Critical<br/>Dedicated workers<br/>No rate limit]
        P1[P1 High<br/>Fast workers<br/>Relaxed limits]
        P2[P2 Normal<br/>Standard workers<br/>Rate limited]
        P3[P3 Low<br/>Batch workers<br/>Digest eligible]
    end
    ROUTER[Channel Router] --> P0 & P1 & P2 & P3
    P0 -->|immediate| DISPATCH[Dispatch]
    P1 -->|fast| DISPATCH
    P2 -->|throttled| DISPATCH
    P3 -->|batched| DIGEST[Digest Engine] --> DISPATCH`
        },
        {
            title: 'Delivery Tracking & Analytics',
            content: `<p>Each notification is tracked through a full lifecycle. Status updates flow back asynchronously from providers via webhooks.</p>
            <h4>Lifecycle States</h4>
            <p><code>created → queued → sent → delivered → opened → clicked</code> (or <code>failed</code> / <code>bounced</code> at any stage)</p>
            <h4>Provider Feedback</h4>
            <ul>
                <li><strong>Push</strong>: FCM/APNS delivery receipts, invalid token callbacks</li>
                <li><strong>Email</strong>: SendGrid webhooks (delivered, opened, clicked, bounced, spam)</li>
                <li><strong>SMS</strong>: Twilio status callbacks (sent, delivered, failed, undelivered)</li>
                <li><strong>In-App</strong>: Client ACK via WebSocket</li>
            </ul>
            <h4>Analytics Pipeline</h4>
            <p>Status events stream to Kafka → aggregated in ClickHouse/BigQuery → dashboards showing delivery rate, open rate, CTR per template/segment. Bounce feedback loops back to prune invalid tokens.</p>`,
            code: `// Delivery status tracking
public class DeliveryTracker
{
    private readonly IEventBus _bus;
    private readonly IDeliveryStore _store;

    public async Task UpdateStatusAsync(DeliveryStatusEvent evt)
    {
        // Idempotent update - only advance forward in lifecycle
        var current = await _store.GetStatusAsync(evt.NotificationId, evt.Channel);
        
        if (!IsValidTransition(current, evt.NewStatus))
        {
            _logger.LogWarning("Invalid transition {Current} -> {New}", current, evt.NewStatus);
            return;
        }
        
        await _store.UpdateAsync(evt.NotificationId, evt.Channel, evt.NewStatus, evt.Timestamp);
        
        // Emit for analytics pipeline
        await _bus.PublishAsync(new NotificationStatusChanged
        {
            NotificationId = evt.NotificationId,
            Channel = evt.Channel,
            Status = evt.NewStatus,
            Timestamp = evt.Timestamp,
            TemplateId = evt.TemplateId,
            UserId = evt.UserId
        });
        
        // Handle permanent failures
        if (evt.NewStatus == DeliveryStatus.PermanentFailure)
        {
            await HandlePermanentFailure(evt);
        }
    }
    
    private async Task HandlePermanentFailure(DeliveryStatusEvent evt)
    {
        // Prune invalid tokens (e.g., uninstalled app)
        if (evt.FailureReason == "InvalidRegistration")
        {
            await _tokenStore.RemoveAsync(evt.UserId, evt.DeviceToken);
        }
        // Move to DLQ for inspection
        await _dlq.EnqueueAsync(evt);
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Real-Time In-App Notifications',
            content: `<p>For users currently online, deliver notifications instantly via a persistent WebSocket connection.</p>
            <ul>
                <li><strong>Gateway Tier</strong>: Holds WebSocket connections, maps userId → connectionId in Redis</li>
                <li><strong>Fan-out</strong>: Notification service publishes to a pub/sub topic; gateways subscribe and push to connected clients</li>
                <li><strong>Offline Fallback</strong>: If user has no live connection, persist notification and deliver on reconnect (+ fallback to push/email)</li>
                <li><strong>Multi-device</strong>: User connected on phone + laptop → deliver to all active connections</li>
            </ul>`,
            mermaid: `sequenceDiagram
    participant Svc as Order Service
    participant NP as Notification Platform
    participant Redis as Connection Registry
    participant GW as WebSocket Gateway
    participant Client as User Browser

    Svc->>NP: OrderShipped event
    NP->>NP: Resolve preferences, render template
    NP->>Redis: Lookup user connections
    Redis-->>NP: gateway-3, conn-abc
    NP->>GW: Push notification to conn-abc
    GW->>Client: WebSocket message
    Client-->>GW: ACK received
    GW->>NP: Delivery confirmed`
        },
        {
            title: 'Failure Handling & Resilience',
            content: `<p>Third-party providers (FCM, SendGrid, Twilio) are unreliable. The system must handle failures gracefully.</p>
            <table>
                <thead><tr><th>Pattern</th><th>Purpose</th><th>Implementation</th></tr></thead>
                <tbody>
                    <tr><td>Retry + Backoff</td><td>Transient failures</td><td>Exponential backoff with jitter, max 3 attempts</td></tr>
                    <tr><td>Circuit Breaker</td><td>Provider outage</td><td>Per-provider breaker; trips after 50% failure rate in 30s window</td></tr>
                    <tr><td>Bulkhead</td><td>Isolation</td><td>Separate thread pools per channel so SMS outage doesn't block push</td></tr>
                    <tr><td>Dead Letter Queue</td><td>Permanent failures</td><td>Messages that exhaust retries go to DLQ for manual inspection</td></tr>
                    <tr><td>Fallback Channel</td><td>Critical delivery</td><td>If push fails for P0, escalate to SMS</td></tr>
                </tbody>
            </table>`,
            code: `// Circuit breaker per provider
public class ChannelDispatcher
{
    private readonly ICircuitBreaker _breaker;
    private readonly IRetryPolicy _retry;
    private readonly IFallbackRouter _fallback;
    private readonly IDlqPublisher _dlq;

    public async Task<DeliveryResult> DispatchAsync(Notification notification, CancellationToken ct)
    {
        try
        {
            return await _breaker.ExecuteAsync(async () =>
            {
                return await _retry.ExecuteAsync(async () =>
                {
                    return await SendToProviderAsync(notification, ct);
                });
            });
        }
        catch (BrokenCircuitException)
        {
            _metrics.IncrementCircuitOpen(notification.Channel);
            
            // Fallback for critical notifications
            if (notification.Priority == Priority.Critical)
            {
                return await _fallback.RouteToAlternateChannel(notification, ct);
            }
            
            // Re-queue for later retry
            await RequeueWithDelay(notification, TimeSpan.FromMinutes(5));
            return DeliveryResult.Deferred;
        }
        catch (MaxRetriesExceededException ex)
        {
            await _dlq.PublishAsync(notification, ex.Message);
            return DeliveryResult.PermanentFailure;
        }
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Scaling & Performance',
            content: `<h4>Horizontal Scaling</h4>
            <ul>
                <li><strong>Ingestion</strong>: Kafka partitioned by userId for ordering guarantees per user</li>
                <li><strong>Workers</strong>: Stateless dispatchers auto-scale based on queue depth</li>
                <li><strong>WebSocket Gateways</strong>: Consistent hashing of userId to gateway; each gateway handles 100K connections</li>
                <li><strong>Preference Cache</strong>: Redis cluster with CDC from preference DB for sub-ms lookups</li>
            </ul>
            <h4>Performance Optimizations</h4>
            <ul>
                <li>Batch API calls to providers (FCM supports 500 messages per batch)</li>
                <li>Template pre-compilation and caching</li>
                <li>Connection pooling for SMTP/HTTP providers</li>
                <li>Async I/O throughout — no blocking threads</li>
            </ul>
            <h4>Capacity Estimation</h4>
            <p>100M users, avg 5 notifications/day = 500M notifications/day = ~6K notifications/second sustained, 60K peak. With 4 channels average per notification = 24K dispatch operations/second peak.</p>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>No priority separation</strong>: 2FA codes stuck behind marketing bulk sends</li>
                <li><strong>Synchronous delivery</strong>: API call blocks until email is sent → timeouts</li>
                <li><strong>Render at queue-time</strong>: Stale data if message sits in queue for minutes</li>
                <li><strong>No dedup</strong>: Event bus retries cause duplicate notifications</li>
                <li><strong>Treating "sent" as "delivered"</strong>: Sent to provider ≠ received by user</li>
                <li><strong>Global rate limit</strong>: Should be per-user per-channel, not global</li>
                <li><strong>Ignoring timezone</strong>: Quiet hours calculated in server timezone, not user's</li>
                <li><strong>No bounce handling</strong>: Keeps sending to invalid tokens, hurts sender reputation</li>
                <li><strong>Single provider dependency</strong>: One provider down = all notifications fail</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li>Separation of decision logic (preferences, dedup, rate limiting) from delivery (channel dispatchers)</li>
                    <li>Priority queues — explain why 2FA cannot wait behind marketing</li>
                    <li>Rate limiting to prevent notification fatigue (per-user, not global)</li>
                    <li>Resilience patterns: retry, circuit breaker, DLQ, fallback channels</li>
                    <li>Delivery tracking lifecycle and feedback loops (bounce → token pruning)</li>
                    <li>Scale estimation: users × notifications/day × channels = dispatch rate</li>
                    <li>Real-time in-app via WebSocket with offline fallback</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Separate decision (what/who/which channel) from delivery (how)</li>
                <li>Priority queues ensure critical messages are never delayed by bulk</li>
                <li>Rate limiting + quiet hours + digests prevent notification fatigue</li>
                <li>Idempotency keys at ingestion prevent duplicate notifications</li>
                <li>Circuit breakers per provider isolate third-party failures</li>
                <li>Delivery tracking is a streaming analytics problem, not synchronous DB writes</li>
                <li>Bounce/unsubscribe feedback loops maintain deliverability health</li>
                <li>Template rendering at send-time ensures fresh data</li>
            </ul>`
        }
    ],
    questions: [
        {
            id: 'sd-notif-q1',
            level: 'senior',
            title: 'How would you design a scalable notification system that handles 500M notifications/day?',
            answer: `<p>Key architecture decisions:</p>
            <ol>
                <li><strong>Event-driven ingestion</strong>: Services publish domain events to Kafka; notification service subscribes and translates to notification intents</li>
                <li><strong>Preference resolution</strong>: Redis-cached user preferences determine channels, categories, quiet hours</li>
                <li><strong>Priority queues</strong>: Separate queues per priority level with dedicated worker pools</li>
                <li><strong>Rate limiting</strong>: Sliding window per user/channel in Redis; P0 bypasses limits</li>
                <li><strong>Template rendering</strong>: At send-time for freshest data, with pre-compiled templates cached</li>
                <li><strong>Channel dispatchers</strong>: Stateless workers behind circuit breakers, one per provider</li>
                <li><strong>Delivery tracking</strong>: Async status events to Kafka → analytics aggregation</li>
            </ol>
            <p>Scale: 500M/day ≈ 6K/s sustained, 60K/s peak. Kafka partitioned by userId, stateless workers auto-scale on queue depth.</p>`
        },
        {
            id: 'sd-notif-q2',
            level: 'mid',
            title: 'How do you prevent a user from receiving duplicate notifications for the same event?',
            answer: `<p>Deduplication happens at two layers:</p>
            <ol>
                <li><strong>Event ingestion</strong>: Each event carries a deterministic idempotency key (e.g., <code>order_123_shipped</code>). A Redis SET with TTL stores processed keys — if key exists, skip.</li>
                <li><strong>Channel delivery</strong>: Use provider-specific collapse keys (FCM collapse_key, APNS thread-id) so the device deduplicates if our dedup misses.</li>
            </ol>
            <p>TTL is sized to the upstream retry window (typically 1-24 hours depending on the event bus SLA).</p>`
        },
        {
            id: 'sd-notif-q3',
            level: 'mid',
            title: 'How do you handle notification fatigue?',
            answer: `<p>Multiple complementary strategies:</p>
            <ul>
                <li><strong>Frequency caps</strong>: Max N notifications per channel per time window (e.g., 10 push/hour)</li>
                <li><strong>Quiet hours</strong>: No non-critical notifications during user-configured sleep hours (timezone-aware)</li>
                <li><strong>Digests</strong>: Batch low-priority notifications into periodic summaries (e.g., "5 new comments" instead of 5 separate pushes)</li>
                <li><strong>Granular preferences</strong>: Per-category, per-channel opt-in/out</li>
                <li><strong>Smart throttling</strong>: ML-based send-time optimization for engagement</li>
            </ul>
            <p>Monitor unsubscribe/mute rates as health metrics — rising rates indicate fatigue.</p>`
        },
        {
            id: 'sd-notif-q4',
            level: 'senior',
            title: 'How do you handle third-party provider failures (FCM, SendGrid, Twilio outages)?',
            answer: `<p>Resilience patterns per channel dispatcher:</p>
            <ul>
                <li><strong>Retry with exponential backoff + jitter</strong>: For transient HTTP 5xx/timeout errors (max 3 attempts)</li>
                <li><strong>Circuit breaker</strong>: Per-provider; trips after 50% failure rate in 30s window. When open, fast-fails to avoid queue buildup</li>
                <li><strong>Bulkhead isolation</strong>: Separate thread pools/queues per channel so SMS outage cannot block push delivery</li>
                <li><strong>Dead letter queue</strong>: Messages exhausting retries go to DLQ for manual investigation</li>
                <li><strong>Fallback channel</strong>: For P0 critical — if push fails, escalate to SMS; if SMS fails, escalate to voice call</li>
            </ul>
            <p>Key: distinguish transient errors (retry) from permanent errors (invalid token → prune, don't retry).</p>`
        },
        {
            id: 'sd-notif-q5',
            level: 'architect',
            title: 'How would you design real-time in-app notifications for 10M concurrent users?',
            answer: `<p>Architecture:</p>
            <ul>
                <li><strong>WebSocket gateway tier</strong>: Stateless servers each holding ~100K connections. User → gateway mapping stored in Redis cluster.</li>
                <li><strong>Connection registry</strong>: Redis hash maps userId → [gatewayId, connectionId, device]. Supports multi-device (phone + laptop).</li>
                <li><strong>Pub/sub fan-out</strong>: Notification service publishes to Redis pub/sub channel per gateway. Gateway subscribes and pushes to connected clients.</li>
                <li><strong>Offline fallback</strong>: If no active connection, persist to notification inbox (Cassandra) + trigger push notification. On reconnect, client fetches unread from inbox.</li>
                <li><strong>Scale</strong>: 10M concurrent / 100K per gateway = 100 gateway instances. Consistent hashing for even distribution.</li>
            </ul>
            <p>The inbox store is the source of truth; WebSocket is just fast-path delivery for online users.</p>`
        },
        {
            id: 'sd-notif-q6',
            level: 'junior',
            title: 'What is the difference between push notifications and in-app notifications?',
            answer: `<p><strong>Push notifications</strong> are delivered by the OS (iOS/Android) via FCM/APNS even when the app is closed. They appear in the device notification tray.</p>
            <p><strong>In-app notifications</strong> are delivered while the user has the app open, typically via WebSocket. They appear within the app UI (notification bell, toast messages).</p>
            <table>
                <thead><tr><th>Aspect</th><th>Push</th><th>In-App</th></tr></thead>
                <tbody>
                    <tr><td>User state</td><td>App closed or backgrounded</td><td>App open and active</td></tr>
                    <tr><td>Delivery</td><td>FCM/APNS (third-party)</td><td>WebSocket (own infra)</td></tr>
                    <tr><td>Persistence</td><td>OS manages</td><td>App stores in inbox</td></tr>
                    <tr><td>Rich content</td><td>Limited (title + body)</td><td>Full HTML/components</td></tr>
                </tbody>
            </table>`
        },
        {
            id: 'sd-notif-q7',
            level: 'mid',
            title: 'How would you implement delivery tracking and analytics?',
            answer: `<p>Track each notification through: <code>created → queued → sent → delivered → opened → clicked</code> (or failed/bounced).</p>
            <ul>
                <li><strong>Status events</strong>: Each state change emits an event to Kafka (not synchronous DB update)</li>
                <li><strong>Provider webhooks</strong>: Ingest delivery/bounce/open callbacks from SendGrid, FCM, Twilio</li>
                <li><strong>Open tracking</strong>: 1x1 pixel in emails; client SDK event for push/in-app</li>
                <li><strong>Click tracking</strong>: Redirect links through tracking service before final URL</li>
                <li><strong>Aggregation</strong>: Stream processing into ClickHouse for per-template delivery rate, open rate, CTR</li>
                <li><strong>Feedback loop</strong>: Hard bounces → remove invalid tokens. Spam complaints → suppress user.</li>
            </ul>`
        },
        {
            id: 'sd-notif-q8',
            level: 'senior',
            title: 'How do you design the template engine for a notification system?',
            answer: `<p>Requirements: personalization, localization (i18n), A/B testing, versioning, multi-channel rendering.</p>
            <ul>
                <li><strong>Template storage</strong>: Versioned documents in DB (template_id + version + locale + channel)</li>
                <li><strong>Rendering</strong>: At send-time (not queue-time) for freshest data. Use Handlebars/Liquid syntax for tokens.</li>
                <li><strong>Personalization</strong>: Inject user data (name, order details) from context passed with the event</li>
                <li><strong>Localization</strong>: Select template variant by user.locale (en-US, es-MX, fr-FR)</li>
                <li><strong>A/B variants</strong>: Template has variants A/B; system assigns user to variant deterministically (hash of userId)</li>
                <li><strong>Channel adaptation</strong>: Same notification rendered differently for email (HTML), push (title+body), SMS (plain text)</li>
                <li><strong>Admin portal</strong>: Product teams create/edit templates without engineering deploys</li>
            </ul>`
        },
        {
            id: 'sd-notif-q9',
            level: 'architect',
            title: 'How would you migrate from a monolithic notification module to a platform?',
            answer: `<p>Phased approach using Strangler Fig pattern:</p>
            <ol>
                <li><strong>Phase 1 — Extract</strong>: Build the new notification platform alongside the monolith. New services publish to both old and new systems (dual-write with feature flag).</li>
                <li><strong>Phase 2 — Shadow mode</strong>: New platform processes all events but doesn't deliver. Compare output with monolith to verify parity.</li>
                <li><strong>Phase 3 — Migrate channels</strong>: Route one channel at a time (start with in-app, lowest risk). Monitor delivery rates.</li>
                <li><strong>Phase 4 — Cut over</strong>: Remaining channels migrated. Monolith notification code deprecated.</li>
                <li><strong>Phase 5 — Decommission</strong>: Remove old code after 30-day bake period.</li>
            </ol>
            <p>Key risk: preference data migration. Run both preference engines in parallel and reconcile diffs before full cutover.</p>`
        },
        {
            id: 'sd-notif-q10',
            level: 'lead',
            title: 'How do you handle notification delivery across multiple timezones for quiet hours?',
            answer: `<p>Store each user's timezone in their preference profile. When a non-critical notification is about to be dispatched:</p>
            <ol>
                <li>Convert current UTC time to user's local time</li>
                <li>Check if it falls within their quiet hours window (default: 10pm-8am)</li>
                <li>If in quiet hours: defer to a scheduled queue that fires at quiet-hours-end in their timezone</li>
                <li>P0 Critical notifications bypass quiet hours entirely</li>
            </ol>
            <p>Implementation: Use a delay queue (Redis sorted set with score = delivery time) or scheduled message feature of the broker (e.g., SQS delay, RabbitMQ TTL).</p>`
        }
    ]
});
