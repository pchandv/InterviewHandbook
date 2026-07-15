/* ═══════════════════════════════════════════════════════════════════
   System Design — Design WhatsApp
   Real-time messaging, E2E encryption, presence, group chat,
   media sharing, offline delivery, and scale.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('sd-whatsapp', {
    title: 'Design WhatsApp',
    description: 'System design for a real-time messaging platform — 1:1 chat, group messaging, end-to-end encryption, presence/typing indicators, media sharing, offline delivery, and read receipts at 2B+ user scale.',
    sections: [
        {
            title: 'Requirements & Scale',
            content: `<h4>Functional Requirements</h4>
            <ul>
                <li>1:1 messaging with real-time delivery</li>
                <li>Group chat (up to 1024 members)</li>
                <li>End-to-end encryption (E2E) — server cannot read messages</li>
                <li>Presence indicators (online/last seen) and typing status</li>
                <li>Read receipts (sent ✓, delivered ✓✓, read ✓✓ blue)</li>
                <li>Media sharing (images, videos, documents, voice messages)</li>
                <li>Offline message delivery (store-and-forward)</li>
                <li>Message history sync across devices</li>
            </ul>
            <h4>Non-Functional Requirements</h4>
            <ul>
                <li>Scale: 2B users, 100B messages/day</li>
                <li>Latency: &lt;100ms for message delivery between online users</li>
                <li>Availability: 99.99% — messaging is critical infrastructure</li>
                <li>Durability: Messages must never be lost (at-least-once delivery)</li>
                <li>Privacy: E2E encryption — server is a blind relay</li>
            </ul>
            <h4>Capacity Estimation</h4>
            <ul>
                <li>100B messages/day = 1.15M messages/second average</li>
                <li>Peak: 5x average = ~6M messages/second</li>
                <li>Average message size: 100 bytes text, 200KB media</li>
                <li>Storage: Text = 10TB/day, Media = 500PB/day (with CDN offload)</li>
                <li>Concurrent connections: 500M+ persistent WebSocket connections</li>
            </ul>`
        },
        {
            title: 'High-Level Architecture',
            mermaid: `graph TB
    subgraph Clients
        C1[Phone A]
        C2[Phone B]
        C3[Web Client]
    end
    subgraph EdgeLayer[Edge / Gateway]
        LB[Load Balancer]
        GW1[Chat Gateway 1]
        GW2[Chat Gateway 2]
        GW3[Chat Gateway N]
    end
    subgraph CoreServices[Core Services]
        MSG[Message Service]
        GRP[Group Service]
        PRES[Presence Service]
        AUTH[Auth Service]
        MEDIA[Media Service]
        SYNC[Sync Service]
        PUSH[Push Notification]
    end
    subgraph Storage
        MSGQ[(Message Queue<br/>Kafka)]
        MSGDB[(Message Store<br/>Cassandra/HBase)]
        SESS[(Session Store<br/>Redis Cluster)]
        BLOB[(Media Store<br/>S3 + CDN)]
        USERDB[(User DB<br/>MySQL/Vitess)]
    end
    C1 & C2 & C3 --> LB --> GW1 & GW2 & GW3
    GW1 & GW2 & GW3 --> MSG & GRP & PRES & MEDIA
    MSG --> MSGQ --> MSGDB
    MSG --> SESS
    MEDIA --> BLOB
    PRES --> SESS
    MSG --> PUSH`,
            content: `<p>The architecture follows a <strong>gateway-per-connection</strong> model where each client maintains a persistent connection to a chat gateway. The gateway routes messages to core services, which handle persistence and fan-out.</p>`
        },
        {
            title: 'Message Flow — 1:1 Chat',
            mermaid: `sequenceDiagram
    participant A as User A (Sender)
    participant GW_A as Gateway A
    participant MSG as Message Service
    participant STORE as Message Store
    participant SESS as Session Registry
    participant GW_B as Gateway B
    participant B as User B (Receiver)
    participant PUSH as Push Service

    A->>GW_A: Send message (encrypted)
    GW_A->>MSG: Route message
    MSG->>STORE: Persist (write-ahead)
    MSG-->>GW_A: ACK (✓ sent)
    GW_A-->>A: ✓ Sent
    MSG->>SESS: Lookup User B connection
    alt User B is online
        SESS-->>MSG: Gateway B, conn-xyz
        MSG->>GW_B: Deliver message
        GW_B->>B: Push to WebSocket
        B-->>GW_B: ACK received
        GW_B-->>MSG: Delivery confirmed
        MSG-->>GW_A: ✓✓ Delivered
        GW_A-->>A: ✓✓ Delivered
    else User B is offline
        MSG->>PUSH: Send push notification
        Note over MSG: Message stays in store<br/>until B reconnects
    end`,
            content: `<p>Key design decisions in the message flow:</p>
            <ul>
                <li><strong>Write-ahead persistence</strong>: Message is persisted BEFORE delivery attempt — ensures durability</li>
                <li><strong>ACK-based delivery</strong>: Sender gets ✓ on server persist, ✓✓ on recipient ACK</li>
                <li><strong>Session registry</strong>: Redis maps userId → gateway + connectionId for O(1) routing</li>
                <li><strong>Store-and-forward</strong>: Offline users get messages delivered on reconnection</li>
            </ul>`
        },
        {
            title: 'Group Messaging',
            content: `<p>Group messages require fan-out: one send → N deliveries. Two approaches:</p>
            <h4>Fan-out on Write (WhatsApp's approach for small groups)</h4>
            <p>When sender posts to group, message service writes a copy to each member's message queue. Simple, fast reads, but expensive for large groups.</p>
            <h4>Fan-out on Read (for large groups/channels)</h4>
            <p>Store one copy; each member reads from a shared group timeline. Cheaper writes but slower reads and complex cursor management.</p>
            <table>
                <thead><tr><th>Approach</th><th>Write Cost</th><th>Read Cost</th><th>Best For</th></tr></thead>
                <tbody>
                    <tr><td>Fan-out on Write</td><td>O(N) per message</td><td>O(1) per user</td><td>Small groups (&lt;256 members)</td></tr>
                    <tr><td>Fan-out on Read</td><td>O(1) per message</td><td>O(1) + seek</td><td>Large channels (1000+ members)</td></tr>
                    <tr><td>Hybrid</td><td>O(active_N)</td><td>O(1) for active</td><td>Mixed — fan-out only to online members</td></tr>
                </tbody>
            </table>`,
            code: `// Group message fan-out (fan-out on write)
public class GroupMessageService
{
    private readonly IGroupStore _groups;
    private readonly ISessionRegistry _sessions;
    private readonly IMessageStore _messageStore;
    private readonly IPushService _push;

    public async Task SendGroupMessageAsync(GroupMessage msg, CancellationToken ct)
    {
        var members = await _groups.GetMembersAsync(msg.GroupId, ct);
        var sender = msg.SenderId;
        
        // Persist the canonical message once
        var messageId = await _messageStore.PersistAsync(msg, ct);
        
        // Fan-out to each member's inbox
        var tasks = members
            .Where(m => m.UserId != sender)
            .Select(async member =>
            {
                // Write to member's inbox queue
                await _messageStore.EnqueueToInboxAsync(member.UserId, messageId, ct);
                
                // Attempt real-time delivery
                var session = await _sessions.GetAsync(member.UserId);
                if (session is not null)
                {
                    await DeliverToGatewayAsync(session, msg, ct);
                }
                else
                {
                    await _push.SendAsync(member.UserId, msg.Preview, ct);
                }
            });
        
        // Parallel fan-out with bounded concurrency
        await Parallel.ForEachAsync(tasks, 
            new ParallelOptions { MaxDegreeOfParallelism = 64 }, 
            async (t, _) => await t);
    }
}`,
            language: 'csharp'
        },
        {
            title: 'End-to-End Encryption',
            content: `<p>WhatsApp uses the <strong>Signal Protocol</strong> (Double Ratchet). The server is a blind relay — it cannot decrypt message content.</p>
            <h4>Key Concepts</h4>
            <ul>
                <li><strong>Identity Key Pair</strong>: Long-term key per device, registered on server</li>
                <li><strong>Pre-Keys</strong>: One-time keys uploaded in bulk; used to establish sessions without both parties online</li>
                <li><strong>Session Key</strong>: Derived via X3DH (Extended Triple Diffie-Hellman) key agreement</li>
                <li><strong>Double Ratchet</strong>: Every message uses a new symmetric key derived from the ratchet — forward secrecy</li>
            </ul>
            <h4>Key Exchange Flow</h4>
            <ol>
                <li>User A fetches User B's pre-key bundle from server</li>
                <li>A performs X3DH to derive shared secret</li>
                <li>A encrypts first message with derived key</li>
                <li>B decrypts using corresponding private keys</li>
                <li>Both sides now ratchet forward with each message</li>
            </ol>
            <h4>Group Encryption</h4>
            <p>Each group member has a <strong>Sender Key</strong>. When sending, encrypt once with sender key → all members can decrypt. New member joins → sender key rotated and re-distributed.</p>`,
            mermaid: `sequenceDiagram
    participant A as User A
    participant Server as Key Server
    participant B as User B

    Note over B,Server: B uploads pre-key bundle
    B->>Server: Identity Key + Signed Pre-Key + One-Time Pre-Keys
    
    Note over A: A wants to message B
    A->>Server: Request B's pre-key bundle
    Server-->>A: B's public keys
    A->>A: X3DH key agreement → shared secret
    A->>A: Encrypt message with derived key
    A->>Server: Encrypted message (server cannot read)
    Server->>B: Forward encrypted blob
    B->>B: Derive same shared secret via X3DH
    B->>B: Decrypt message
    Note over A,B: Double Ratchet advances with each message`
        },
        {
            title: 'Presence & Typing Indicators',
            content: `<p>Presence (online/offline/last seen) and typing indicators are ephemeral — they don't need persistence or strong consistency.</p>
            <h4>Presence System</h4>
            <ul>
                <li><strong>Heartbeat-based</strong>: Client sends heartbeat every 30s. If missed for 60s → mark offline.</li>
                <li><strong>Storage</strong>: Redis hash — <code>userId → {status, lastSeen, gatewayId}</code></li>
                <li><strong>Fan-out</strong>: When status changes, notify contacts who have subscribed (mutual contacts only for privacy)</li>
                <li><strong>Privacy</strong>: "Last seen" visibility controlled by user preference (everyone/contacts/nobody)</li>
            </ul>
            <h4>Typing Indicator</h4>
            <ul>
                <li>Client sends "typing" event to server when user starts typing</li>
                <li>Server forwards to recipient's gateway (no persistence)</li>
                <li>Auto-expires after 5s if no follow-up "still typing" event</li>
                <li>Extremely latency-sensitive — fire-and-forget, no ACK needed</li>
            </ul>`,
            code: `// Presence service with heartbeat
public class PresenceService
{
    private readonly IDatabase _redis;
    private readonly TimeSpan _heartbeatInterval = TimeSpan.FromSeconds(30);
    private readonly TimeSpan _offlineThreshold = TimeSpan.FromSeconds(60);

    public async Task HeartbeatAsync(string userId, string gatewayId)
    {
        var key = $"presence:{userId}";
        await _redis.HashSetAsync(key, new HashEntry[]
        {
            new("status", "online"),
            new("lastSeen", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()),
            new("gateway", gatewayId)
        });
        await _redis.KeyExpireAsync(key, _offlineThreshold);
        // TTL acts as auto-offline: if heartbeat stops, key expires → offline
    }

    public async Task<PresenceInfo> GetPresenceAsync(string userId)
    {
        var key = $"presence:{userId}";
        var exists = await _redis.KeyExistsAsync(key);
        
        if (!exists)
        {
            // Key expired → user is offline, fetch last seen from persistent store
            var lastSeen = await _persistentStore.GetLastSeenAsync(userId);
            return new PresenceInfo("offline", lastSeen);
        }
        
        var hash = await _redis.HashGetAllAsync(key);
        return new PresenceInfo(
            hash.First(h => h.Name == "status").Value,
            DateTimeOffset.FromUnixTimeSeconds(long.Parse(hash.First(h => h.Name == "lastSeen").Value))
        );
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Media Sharing & Storage',
            content: `<p>Media (images, videos, voice notes, documents) follows a different path than text messages for efficiency.</p>
            <h4>Media Upload Flow</h4>
            <ol>
                <li>Client encrypts media locally (E2E — same session key)</li>
                <li>Client uploads encrypted blob to media server (HTTP, not WebSocket)</li>
                <li>Server returns a media URL/ID (content-addressed hash)</li>
                <li>Client sends text message containing the media URL + decryption key</li>
                <li>Recipient downloads encrypted blob from CDN, decrypts locally</li>
            </ol>
            <h4>Storage Architecture</h4>
            <ul>
                <li><strong>Hot storage</strong>: Recent media (30 days) on fast SSD-backed object store</li>
                <li><strong>Warm storage</strong>: Older media migrated to cheaper tier (S3 Standard-IA)</li>
                <li><strong>CDN</strong>: Popular/recent media cached at edge for fast download</li>
                <li><strong>Deduplication</strong>: Content-addressed storage — same image shared by 10 groups stored once</li>
                <li><strong>Thumbnails</strong>: Generated server-side (even though encrypted) via client-provided low-res preview</li>
            </ul>
            <table>
                <thead><tr><th>Media Type</th><th>Max Size</th><th>Compression</th><th>Storage Tier</th></tr></thead>
                <tbody>
                    <tr><td>Image</td><td>16MB</td><td>Client-side (quality reduction)</td><td>CDN + S3</td></tr>
                    <tr><td>Video</td><td>100MB</td><td>Client-side transcoding</td><td>CDN + S3</td></tr>
                    <tr><td>Voice Note</td><td>16MB</td><td>Opus codec</td><td>S3 only</td></tr>
                    <tr><td>Document</td><td>100MB</td><td>None</td><td>S3 only</td></tr>
                </tbody>
            </table>`
        },
        {
            title: 'Offline Delivery & Message Sync',
            content: `<p>Users go offline frequently (subway, poor signal, sleep). The system must guarantee message delivery when they return.</p>
            <h4>Store-and-Forward</h4>
            <ul>
                <li>Messages persisted to user's <strong>inbox queue</strong> (Cassandra, partitioned by userId)</li>
                <li>When user reconnects, gateway pulls undelivered messages from inbox and pushes them in order</li>
                <li>After successful delivery ACK, messages are deleted from inbox queue</li>
                <li>Push notification sent as a "wake-up" signal to prompt the app to connect</li>
            </ul>
            <h4>Multi-Device Sync</h4>
            <ul>
                <li>Each device maintains a <strong>sync cursor</strong> (last message ID received)</li>
                <li>On reconnect, device requests messages after its cursor</li>
                <li>Linked devices (web, desktop) get messages via a separate sync channel</li>
                <li>Primary device is the source of truth for E2E keys</li>
            </ul>
            <h4>Message Ordering</h4>
            <p>Messages within a conversation are ordered by sender's local timestamp + server receive timestamp for conflict resolution. Cassandra's clustering key provides efficient range queries per conversation.</p>`
        },
        {
            title: 'Scaling to 2B Users',
            content: `<h4>Connection Tier</h4>
            <ul>
                <li>500M concurrent WebSocket connections across thousands of gateway servers</li>
                <li>Each gateway handles ~200K connections (Erlang/BEAM historically; now custom C++ servers)</li>
                <li>Consistent hashing of userId to gateway for even distribution</li>
            </ul>
            <h4>Message Storage</h4>
            <ul>
                <li>Cassandra cluster: Wide-column store optimized for write-heavy, time-series-like message data</li>
                <li>Partition key: conversationId; Clustering key: messageTimestamp</li>
                <li>Short TTL for delivered messages (30-day inbox retention)</li>
            </ul>
            <h4>Geo-Distribution</h4>
            <ul>
                <li>Data centers in each major region (US, EU, Asia, LatAm)</li>
                <li>Messages routed to nearest DC; cross-region delivery via backbone</li>
                <li>User data pinned to home region for GDPR compliance</li>
            </ul>
            <h4>Hot/Cold Architecture</h4>
            <ul>
                <li>Active conversations in hot cache (Redis)</li>
                <li>Delivered messages drained to cold store after 30 days</li>
                <li>Message search indexes built async from event stream</li>
            </ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>HTTP polling instead of persistent connections</strong>: Kills latency and battery. WebSocket/MQTT is required for real-time chat.</li>
                <li><strong>Storing messages in a relational DB</strong>: SQL doesn't scale for 100B messages/day write throughput. Use Cassandra/HBase.</li>
                <li><strong>Centralized message routing</strong>: Single message router becomes bottleneck. Distribute routing via session registry.</li>
                <li><strong>No offline delivery strategy</strong>: If you only push to live connections, offline users lose messages forever.</li>
                <li><strong>E2E encryption as afterthought</strong>: Must be designed in from day 1 — retrofitting is nearly impossible without breaking compatibility.</li>
                <li><strong>Synchronous group fan-out</strong>: Blocking on all N deliveries before ACKing sender. Fan-out should be async after persistence.</li>
                <li><strong>No message ordering guarantee</strong>: Must use conversation-scoped ordering (partition key = conversation).</li>
                <li><strong>Presence fan-out to all contacts</strong>: A user with 500 contacts going online shouldn't trigger 500 pushes. Use subscription-based presence.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li>Clear message delivery flow with ACK semantics (sent ✓ vs delivered ✓✓ vs read)</li>
                    <li>Store-and-forward for offline users — messages must never be lost</li>
                    <li>WebSocket/persistent connection choice with session registry for routing</li>
                    <li>E2E encryption awareness — server as blind relay, key exchange basics</li>
                    <li>Group chat fan-out strategy and its cost trade-offs</li>
                    <li>Scale estimation: connections, messages/sec, storage/day</li>
                    <li>Presence system design (heartbeat + TTL, not polling)</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Persistent connections (WebSocket) + session registry = real-time message routing</li>
                <li>Write-ahead persistence ensures messages survive crashes</li>
                <li>Store-and-forward + push notification handles offline delivery</li>
                <li>E2E encryption means the server is a blind relay — design around this constraint</li>
                <li>Group fan-out on write works for small groups; fan-out on read for large channels</li>
                <li>Presence uses heartbeat + Redis TTL for automatic offline detection</li>
                <li>Media goes through separate upload path (HTTP) with content-addressed dedup</li>
                <li>Cassandra (partition=conversation, cluster=timestamp) for write-heavy message storage</li>
            </ul>`
        }
    ],
    questions: [
        {
            id: 'sd-wa-q1',
            level: 'senior',
            title: 'How would you design the message delivery pipeline for a chat app handling 1M messages/second?',
            answer: `<p>Architecture:</p>
            <ol>
                <li><strong>Persistent connections</strong>: Clients maintain WebSocket to a gateway tier (each gateway holds ~200K connections)</li>
                <li><strong>Session registry</strong>: Redis cluster maps userId → gatewayId + connectionId for O(1) routing</li>
                <li><strong>Message flow</strong>: Client → Gateway → Message Service → Persist to Cassandra → Lookup recipient's gateway → Deliver</li>
                <li><strong>ACK semantics</strong>: Sender gets ✓ after server persist (guaranteed durability). Gets ✓✓ after recipient ACK.</li>
                <li><strong>Offline path</strong>: If recipient has no active connection, message stays in their inbox queue + push notification sent</li>
                <li><strong>Ordering</strong>: Messages partitioned by conversationId in Cassandra. Within a conversation, clustered by timestamp.</li>
            </ol>
            <p>At 1M msg/s: ~5000 gateway servers (200K conn each), Cassandra cluster with 100+ nodes, Redis cluster for session registry with 50+ shards.</p>`
        },
        {
            id: 'sd-wa-q2',
            level: 'mid',
            title: 'How do read receipts (✓ sent, ✓✓ delivered, blue ✓✓ read) work?',
            answer: `<p>Three-stage acknowledgment system:</p>
            <ul>
                <li><strong>✓ Sent</strong>: Server ACKs to sender after persisting the message. This means "server has it, won't be lost."</li>
                <li><strong>✓✓ Delivered</strong>: Recipient's device ACKs receipt to server. Server forwards delivery receipt to sender.</li>
                <li><strong>Blue ✓✓ Read</strong>: Recipient opens the conversation (client sends "read" event). Server forwards read receipt to sender.</li>
            </ul>
            <p>Each receipt is a lightweight message flowing backward through the same WebSocket connection. Receipts are best-effort — if sender is offline when receipt arrives, it's delivered on their next connect.</p>`
        },
        {
            id: 'sd-wa-q3',
            level: 'senior',
            title: 'How does end-to-end encryption work in a messaging system?',
            answer: `<p>Based on the Signal Protocol:</p>
            <ol>
                <li><strong>Key registration</strong>: Each device generates an Identity Key pair + Signed Pre-Key + batch of One-Time Pre-Keys, uploads public parts to server</li>
                <li><strong>Session establishment</strong>: Sender fetches recipient's pre-key bundle, performs X3DH (Extended Triple Diffie-Hellman) to derive shared secret</li>
                <li><strong>Message encryption</strong>: Each message encrypted with a unique key derived from Double Ratchet algorithm — provides forward secrecy</li>
                <li><strong>Server role</strong>: Blind relay — stores/forwards encrypted blobs it cannot decrypt. Only stores public key bundles.</li>
                <li><strong>Group E2E</strong>: Sender Key protocol — each member distributes a sender key. Message encrypted once, all members decrypt with that key.</li>
            </ol>
            <p>Key property: compromising one message key doesn't compromise past or future messages (forward secrecy + backward secrecy via ratcheting).</p>`
        },
        {
            id: 'sd-wa-q4',
            level: 'architect',
            title: 'How would you handle group messaging for groups with 1000+ members?',
            answer: `<p>For large groups, fan-out on write (copying to each member's inbox) is too expensive. Use a <strong>hybrid approach</strong>:</p>
            <ul>
                <li><strong>Canonical store</strong>: One copy of the message stored in the group's timeline (partitioned by groupId)</li>
                <li><strong>Online fan-out</strong>: Only push real-time delivery to currently connected members (check session registry)</li>
                <li><strong>Offline members</strong>: When they reconnect, pull from group timeline using their sync cursor (last read messageId)</li>
                <li><strong>Push notification</strong>: Send one aggregated push to offline members: "5 new messages in Group X"</li>
                <li><strong>Read optimization</strong>: Client maintains per-group cursor; on open, fetch messages after cursor from group timeline</li>
            </ul>
            <p>This reduces write amplification from O(N) per message to O(online_N) for real-time + O(1) for persistence.</p>`
        },
        {
            id: 'sd-wa-q5',
            level: 'mid',
            title: 'How do you handle message delivery when the recipient is offline?',
            answer: `<p>Store-and-forward pattern:</p>
            <ol>
                <li>Message is persisted to recipient's <strong>inbox queue</strong> in Cassandra (partition key = userId)</li>
                <li>A push notification is sent via FCM/APNS to wake the app</li>
                <li>When recipient reconnects via WebSocket, gateway queries inbox for undelivered messages</li>
                <li>Messages delivered in order; each delivery ACK'd by client</li>
                <li>ACK'd messages removed from inbox (or marked delivered)</li>
            </ol>
            <p>The inbox acts as a per-user message buffer. TTL ensures very old undelivered messages eventually expire (e.g., 30 days).</p>`
        },
        {
            id: 'sd-wa-q6',
            level: 'junior',
            title: 'Why do chat apps use WebSocket instead of HTTP for messaging?',
            answer: `<p>HTTP is request-response: client must ask the server for new messages (polling). WebSocket provides a <strong>persistent, bidirectional</strong> connection:</p>
            <table>
                <thead><tr><th>Aspect</th><th>HTTP Polling</th><th>WebSocket</th></tr></thead>
                <tbody>
                    <tr><td>Latency</td><td>Polling interval (1-30s delay)</td><td>Instant push (&lt;100ms)</td></tr>
                    <tr><td>Battery</td><td>Constant wake-ups drain battery</td><td>Idle connection, efficient</td></tr>
                    <tr><td>Bandwidth</td><td>Repeated HTTP headers per poll</td><td>Minimal framing overhead</td></tr>
                    <tr><td>Direction</td><td>Client → Server only</td><td>Bidirectional</td></tr>
                    <tr><td>Server push</td><td>Not possible</td><td>Server pushes anytime</td></tr>
                </tbody>
            </table>
            <p>For real-time chat, WebSocket (or MQTT on mobile) is essential for sub-second delivery and battery efficiency.</p>`
        },
        {
            id: 'sd-wa-q7',
            level: 'senior',
            title: 'How would you design the presence (online/offline) system?',
            answer: `<p>Heartbeat-based presence with Redis TTL:</p>
            <ul>
                <li>Client sends heartbeat every 30 seconds via WebSocket</li>
                <li>Server writes to Redis: <code>presence:{userId} → {status: online, lastSeen: ts, gateway: gw3}</code> with 60s TTL</li>
                <li>If heartbeat stops (disconnect/crash), key expires automatically → user is offline</li>
                <li>On disconnect event, immediately delete key (don't wait for TTL)</li>
                <li><strong>Fan-out</strong>: Presence changes published to a pub/sub channel. Only mutual contacts subscribe to each other's presence.</li>
                <li><strong>Privacy</strong>: User controls "last seen" visibility (everyone/contacts/nobody)</li>
            </ul>
            <p>Avoid polling-based presence — it doesn't scale. Heartbeat + TTL + event-driven fan-out is the standard pattern.</p>`
        },
        {
            id: 'sd-wa-q8',
            level: 'architect',
            title: 'How do you choose the database for message storage at WhatsApp scale?',
            answer: `<p>Requirements: 100B writes/day, time-range queries per conversation, high availability, geographic distribution.</p>
            <p><strong>Cassandra/HBase</strong> is the standard choice:</p>
            <ul>
                <li><strong>Write-optimized</strong>: LSM-tree architecture handles massive write throughput</li>
                <li><strong>Partition key</strong>: conversationId — all messages in a chat co-located</li>
                <li><strong>Clustering key</strong>: message timestamp — efficient range scans for "load older messages"</li>
                <li><strong>TTL</strong>: Delivered messages can have TTL (server doesn't need to keep forever with E2E)</li>
                <li><strong>Replication</strong>: RF=3 across availability zones for durability</li>
                <li><strong>Geo-distribution</strong>: Multi-DC replication with local quorum reads/writes</li>
            </ul>
            <p>Why NOT relational: Sharding conversations across MySQL instances is complex; Cassandra's partition model handles it natively. Why NOT Redis: persistence and storage cost for 100B messages/day.</p>`
        },
        {
            id: 'sd-wa-q9',
            level: 'lead',
            title: 'How would you handle multi-device message sync (phone + web + desktop)?',
            answer: `<p>Multi-device sync requires every device to get every message in every conversation:</p>
            <ul>
                <li><strong>Primary device</strong>: Phone is source of truth for E2E keys. Linked devices derive keys from primary.</li>
                <li><strong>Sync protocol</strong>: Each device maintains a cursor (last messageId seen). On reconnect, pulls messages after cursor.</li>
                <li><strong>Real-time</strong>: Messages delivered to ALL active connections for a userId simultaneously (session registry stores multiple connections per user).</li>
                <li><strong>Encryption challenge</strong>: Message must be encrypted separately for each device's session key (or use a shared device-group key).</li>
                <li><strong>Conflict resolution</strong>: If user sends from phone and web simultaneously, server assigns ordering by receive timestamp.</li>
            </ul>
            <p>WhatsApp's approach: Web/Desktop are companion devices that proxy through phone. Signal's approach: Each device is independent with separate E2E sessions.</p>`
        },
        {
            id: 'sd-wa-q10',
            level: 'mid',
            title: 'How do you handle media sharing efficiently in a messaging system?',
            answer: `<p>Media follows a separate path from text messages:</p>
            <ol>
                <li><strong>Client encrypts</strong> media locally with the session's E2E key</li>
                <li><strong>Upload</strong> encrypted blob via HTTP to media server (not WebSocket — too large)</li>
                <li><strong>Server returns</strong> a URL/hash reference for the uploaded blob</li>
                <li><strong>Send message</strong> containing: media URL + encryption key + thumbnail</li>
                <li><strong>Recipient downloads</strong> blob from CDN, decrypts locally</li>
            </ol>
            <p>Key optimizations: content-addressed storage (dedup identical files), thumbnail preview in message payload (no download needed to show preview), CDN caching for popular media, tiered storage (hot → warm → cold).</p>`
        }
    ]
});
