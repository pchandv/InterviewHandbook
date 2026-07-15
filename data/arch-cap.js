/* ═══════════════════════════════════════════════════════════════════
   Architecture — CAP Theorem, BASE, ACID, Eventual Consistency
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('arch-cap', {
    title: 'CAP, BASE & Theorems',
    description: 'CAP theorem, ACID vs BASE, PACELC, consistency models, and making practical trade-off decisions for distributed data systems.',
    sections: [
        {
            title: 'CAP Theorem',
            content: `<p>The <strong>CAP theorem</strong> states that a distributed system can guarantee at most <strong>two of three</strong> properties during a network partition: Consistency, Availability, and Partition Tolerance. Since network partitions are inevitable, the real choice is between consistency and availability DURING a partition.</p>
            <ul>
                <li><strong>Consistency (C)</strong> — every read receives the most recent write (all nodes see same data)</li>
                <li><strong>Availability (A)</strong> — every request receives a response (no timeouts/errors)</li>
                <li><strong>Partition Tolerance (P)</strong> — system continues operating despite network splits between nodes</li>
            </ul>`,
            code: `// CAP in practice — you always need P (networks fail), so the choice is:
// CP (Consistency + Partition Tolerance): reject requests during partition
//   Examples: ZooKeeper, etcd, HBase, MongoDB (default), Azure SQL
//   Use for: financial transactions, inventory counts, leader election
//   Behavior during partition: returns error rather than stale data

// AP (Availability + Partition Tolerance): serve requests with possibly stale data
//   Examples: Cassandra, DynamoDB, CouchDB, DNS
//   Use for: shopping carts, user preferences, social feeds, caching
//   Behavior during partition: returns data (possibly outdated)

// ACID vs BASE:
// ACID (traditional relational):
//   Atomicity, Consistency, Isolation, Durability
//   Strong guarantees, single node or distributed transactions
//   Use: financial systems, inventory, billing

// BASE (distributed NoSQL):
//   Basically Available, Soft state, Eventually consistent
//   Trade consistency for availability and partition tolerance
//   Use: social feeds, analytics, caching, user activity

// CONSISTENCY MODELS (strongest to weakest):
// 1. Linearizability — appears as single copy, real-time ordering
// 2. Sequential consistency — all see same order (may not be real-time)
// 3. Causal consistency — causally related ops seen in order
// 4. Eventual consistency — all replicas converge given enough time

// PACELC Theorem (extends CAP):
// If Partition: choose Availability or Consistency (same as CAP)
// Else (normal operation): choose Latency or Consistency
// Example: DynamoDB is PA/EL (available during partition, low latency normally)
// Example: Azure SQL is PC/EC (consistent always, higher latency for global reads)

// Practical decisions:
// User profile updates: eventual consistency (AP) — OK if stale for seconds
// Account balance: strong consistency (CP) — cannot show wrong amount
// Product catalog: eventual consistency (AP) — stale price for seconds is acceptable
// Inventory count: strong consistency (CP) — overselling is costly`,
            language: 'csharp'
        }
    ],
    questions: [
        {"question":"Explain the CAP theorem and what the \"choice\" between CP and AP really means.","difficulty":"hard","answer":"<p>The <strong>CAP theorem</strong> states a distributed data store cannot simultaneously guarantee all three of <strong>C</strong>onsistency (every read sees the latest write), <strong>A</strong>vailability (every request gets a non-error response), and <strong>P</strong>artition tolerance (the system keeps working despite network partitions).</p><p>Since network partitions are unavoidable in distributed systems, P is not optional — so the real choice during a partition is <strong>C vs A</strong>. A <strong>CP</strong> system rejects/blocks requests to preserve consistency (e.g., a bank ledger); an <strong>AP</strong> system stays available and returns possibly-stale data, reconciling later (e.g., a shopping cart, DNS). Outside partitions you can have both.</p>","explanation":"When the phone line between two shops goes down (partition), each shop must choose: refuse to sell until they reconnect (CP, consistent) or keep selling and reconcile stock later (AP, available). You cannot do both while the line is down.","bestPractices":["Assume partitions happen; design the C-vs-A response deliberately","Choose CP for money/critical invariants, AP for availability-first data","Remember the trade-off only binds during a partition"],"commonMistakes":["Treating P as optional","Believing you must permanently sacrifice C or A even without partitions","Applying one choice to the whole system instead of per-dataset"],"interviewTip":"Stress \"P is mandatory, so the choice is C vs A during a partition\" and give a CP and an AP example — that reframing is what interviewers want.","followUp":["How does PACELC extend CAP?","What is eventual consistency?","Can different parts of a system make different CAP choices?"]},
        {"question":"What does PACELC add over CAP, and how do ACID and BASE differ?","difficulty":"hard","answer":"<p><strong>PACELC</strong> extends CAP: if there is a <strong>P</strong>artition, choose <strong>A</strong>vailability or <strong>C</strong>onsistency (the CAP part); <strong>E</strong>lse (normal operation), choose <strong>L</strong>atency or <strong>C</strong>onsistency. It captures that even without partitions there is a latency/consistency trade-off (e.g., waiting for replica acks).</p><p><strong>ACID</strong> (Atomicity, Consistency, Isolation, Durability) is the strong-consistency transactional model of relational databases. <strong>BASE</strong> (Basically Available, Soft state, Eventual consistency) is the relaxed model many distributed/NoSQL systems adopt — favoring availability and accepting temporary inconsistency that converges. They are opposite ends of the consistency spectrum, chosen per use case.</p>","explanation":"PACELC admits that even on a good day you trade speed for accuracy (wait for all replicas = slower but consistent). ACID is a strict accountant; BASE is a relaxed one who lets the books briefly disagree, knowing they will balance soon.","bestPractices":["Use PACELC to reason about the normal-operation latency/consistency trade","ACID for money/critical invariants; BASE for scale/availability","Match the model to each dataset, not the whole system"],"commonMistakes":["Ignoring the else-branch latency/consistency trade","Forcing ACID everywhere at massive scale","Using BASE for data that needs strong guarantees"],"interviewTip":"Explain PACELC as \"CAP plus the else-case latency/consistency trade\" and place ACID vs BASE on a spectrum chosen per dataset.","followUp":["Give a PACELC classification of a real database.","When is eventual consistency acceptable?","How do quorum reads/writes tune this?"]},
        {
            question: 'Explain the CAP theorem. How do you decide between consistency and availability?',
            difficulty: 'advanced',
            answer: `<p>CAP states you can have at most 2 of 3: Consistency, Availability, Partition Tolerance. Since partitions are inevitable in distributed systems, the real trade-off is C vs A during a partition. Choose <strong>CP</strong> (consistency) for financial data, inventory, critical state. Choose <strong>AP</strong> (availability) for social feeds, caches, user preferences — where temporary staleness is acceptable.</p>`,
            bestPractices: ['Choose per-data-type, not per-system (orders=CP, recommendations=AP)', 'Use eventual consistency with conflict resolution for AP systems', 'Design for the partition case even if it rarely happens', 'Consider PACELC: even without partitions, latency vs consistency matters'],
            commonMistakes: ['Thinking CAP means you pick exactly 2 always (it is about behavior DURING partition)', 'Applying one consistency model to entire system (different data has different needs)', 'Ignoring that "eventual" might mean milliseconds or hours depending on design', 'Not considering what happens to in-flight operations during a partition'],
            interviewTip: 'Don\'t just recite the theorem — show practical application. "For our order service (financial), we chose CP: during a partition, we return errors rather than risk double-charging. For our recommendation service, we chose AP: stale recommendations are better than no recommendations."',
            followUp: ['What is eventual consistency and how long is "eventual"?', 'What is the PACELC theorem?', 'How does Cosmos DB implement tunable consistency?'],
            seniorPerspective: 'I never apply one consistency model globally. Within the same application: payment processing is strongly consistent (CP), user session data is eventually consistent (AP), and the search index is eventually consistent with a 5-second SLA on convergence.',
            architectPerspective: 'CAP is a starting framework, but real systems are more nuanced. Cosmos DB offers 5 consistency levels because "CP vs AP" is too coarse. I design systems with per-operation consistency requirements: strong for writes that must be atomic, session for user-facing reads (see your own writes), eventual for analytics and caches.'
        },
        {
            question: 'What does the PACELC theorem add that CAP does not, and why does it matter in practice?',
            difficulty: 'advanced',
            answer: `<p><strong>PACELC</strong> extends CAP by describing system behavior in the <em>normal</em> case, not just during partitions. It reads: <strong>if Partition (P)</strong>, trade Availability (A) vs Consistency (C) — exactly CAP; <strong>Else (E)</strong>, when the system is healthy, trade Latency (L) vs Consistency (C).</p>
            <p>This matters because partitions are rare but the latency-vs-consistency trade-off is paid on <strong>every request</strong>. CAP alone implies "just be consistent when the network is fine," but strong consistency in a distributed/geo-replicated system requires coordination (quorums, synchronous replication) that adds latency. PACELC makes that everyday cost explicit.</p>
            <ul>
                <li><strong>PA/EL</strong> — available under partition, low latency otherwise: DynamoDB, Cassandra (default).</li>
                <li><strong>PC/EC</strong> — consistent always, accepting higher latency: traditional RDBMS, Spanner (via TrueTime), HBase.</li>
                <li><strong>PA/EC</strong> / <strong>PC/EL</strong> — tunable systems like Cosmos DB sit across these depending on the chosen consistency level.</li>
            </ul>`,
            explanation: 'CAP only asks "what do you do when the road is blocked?" PACELC also asks "and even when traffic is flowing, do you take the fast route or the route that guarantees everyone arrives in the same order?" — a choice you make on every trip.',
            code: `// Cosmos DB exposes the PACELC trade-off directly as consistency levels:
// Strong        -> PC/EC : linearizable, highest latency, single-region-like reads
// Bounded Staleness -> PC/EC-ish : consistent within K versions / T seconds
// Session       -> PA/EL (per-session) : read-your-own-writes, low latency  <-- default
// Consistent Prefix -> PA/EL : reads never see out-of-order writes
// Eventual      -> PA/EL : lowest latency, may read stale

var client = new CosmosClient(conn, new CosmosClientOptions
{
    ConsistencyLevel = ConsistencyLevel.Session // tune L vs C per workload
});
// Weaker level  -> lower latency + higher availability, weaker guarantees
// Stronger level-> more cross-replica coordination -> higher write latency`,
            language: 'csharp',
            bestPractices: ['Reason about the Else branch — latency vs consistency is paid continuously, partitions are rare', 'Choose consistency level per workload, not per database', 'For geo-distributed reads, prefer session or bounded staleness before defaulting to strong', 'Measure the actual latency cost of stronger consistency under your real topology'],
            commonMistakes: ['Treating CAP as the whole story and ignoring the everyday latency cost of strong consistency', 'Assuming "no partition = free strong consistency" — coordination still costs latency', 'Picking strong consistency globally out of caution, then suffering write latency at scale', 'Confusing bounded staleness with eventual — bounded gives explicit version/time limits'],
            interviewTip: 'The crisp framing wins points: "CAP is about partitions; PACELC adds that even without partitions you trade latency for consistency on every request." Then give DynamoDB (PA/EL) vs Spanner (PC/EC) as anchors.',
            followUp: ['How does Google Spanner achieve PC/EC with low latency?', 'What is bounded staleness and when would you use it?', 'How does quorum size (R + W > N) relate to this trade-off?'],
            seniorPerspective: 'PACELC changed how I default: I start from the weakest consistency that still satisfies the business rule, because in a multi-region deployment the latency tax of strong consistency on the write path is real and user-visible. I reserve strong/bounded levels for the handful of operations (money movement, inventory decrement) that truly cannot tolerate staleness.',
            architectPerspective: 'I use PACELC as a design lens per data flow: classify each operation by whether it sits on a latency-critical path and whether stale reads are tolerable, then assign a consistency level accordingly. This often means one logical system spanning multiple PACELC profiles — strong on the transactional core, PA/EL on read-heavy projections fed by async replication.'
        },
        {
            question: 'Explain ACID vs BASE. How do you decide which model fits a given workload?',
            difficulty: 'medium',
            answer: `<p><strong>ACID</strong> (Atomicity, Consistency, Isolation, Durability) prioritizes correctness: a transaction either fully commits or fully rolls back, concurrent transactions are isolated, and committed data survives crashes. It is the model of relational databases and is the right choice when invariants must hold at all times — money, inventory, ledgers.</p>
            <p><strong>BASE</strong> (Basically Available, Soft state, Eventually consistent) trades immediate consistency for availability and scale. The system stays available and converges to a consistent state "eventually." It fits high-volume, partition-tolerant NoSQL workloads where short-lived staleness is acceptable — feeds, recommendations, activity counters, caches.</p>
            <p>The decision is per-workload, driven by the cost of being wrong: if a stale or temporarily inconsistent read can cause financial loss or break an invariant, choose ACID; if staleness is merely a cosmetic delay, BASE buys you availability, horizontal scale, and lower latency.</p>`,
            explanation: 'ACID is a bank teller who locks the drawer, counts twice, and only then confirms — slow but never wrong. BASE is a busy coffee shop tip jar — the count catches up later, and nobody panics if it is off for a minute.',
            code: `-- ACID: a debit and credit must both succeed or neither does (invariant: money conserved)
BEGIN TRANSACTION;
    UPDATE Accounts SET Balance = Balance - 100 WHERE Id = @from;
    IF (SELECT Balance FROM Accounts WHERE Id = @from) < 0
        ROLLBACK; -- atomicity: never leave a partial transfer
    UPDATE Accounts SET Balance = Balance + 100 WHERE Id = @to;
COMMIT;

-- BASE: increment a "like" counter on a NoSQL store
-- Write returns immediately; replicas converge; a brief stale count is fine.
-- No cross-document transaction, no global lock -> scales horizontally.`,
            language: 'sql',
            bestPractices: ['Pick the model per data type, not per company — orders are ACID, activity feeds are BASE', 'Use ACID where an invariant must never be violated (balances, stock, bookings)', 'Use BASE for high-write, scale-out, staleness-tolerant data', 'When mixing models, define explicit convergence SLAs for the BASE parts'],
            commonMistakes: ['Forcing everything into ACID and hitting a scaling wall on write-heavy data', 'Using BASE for money or inventory and suffering oversells/double-spends', 'Assuming "eventually consistent" is fast — convergence time must be designed and measured', 'Believing NoSQL cannot do ACID (many now offer per-document or even multi-document transactions)'],
            interviewTip: 'Drive the answer with the "cost of being wrong" heuristic and give one ACID example (transfer) and one BASE example (like counter). That shows judgment, not just definitions.',
            followUp: ['How do distributed transactions (2PC/Saga) relate to ACID across services?', 'How long is "eventually" and how do you bound it?', 'Can a NoSQL database provide ACID guarantees?'],
            seniorPerspective: 'I avoid distributed ACID transactions across service boundaries because two-phase commit is a availability and latency liability; instead I keep ACID inside a single service’s database and use sagas with compensating actions for cross-service workflows, accepting BASE-style eventual consistency between services with explicit compensation paths.',
            architectPerspective: 'ACID vs BASE maps onto bounded-context boundaries: strong consistency within a context where one team owns the schema, eventual consistency between contexts coordinated by events. The architectural skill is choosing those boundaries so that the invariants needing atomicity live together, minimizing the surface where you must reason about eventual consistency.'
        },
        {
            question: 'A user updates their profile and immediately reloads the page but sees the old value on an eventually consistent store. How do you fix this without abandoning eventual consistency?',
            difficulty: 'hard',
            answer: `<p>This is the classic <strong>read-your-own-writes</strong> problem caused by reading from a replica that has not yet received the write. You do not need full strong consistency — you need <strong>session (monotonic) consistency</strong> scoped to that user. Options, roughly in order of preference:</p>
            <ul>
                <li><strong>Session consistency</strong> — the datastore guarantees a client sees its own writes (Cosmos DB Session level, MongoDB causally-consistent sessions with a session token). Cheapest correct fix when supported.</li>
                <li><strong>Read-after-write routing</strong> — for a short window after a write, route that user’s reads to the primary/leader instead of a replica.</li>
                <li><strong>Write-through cache / client echo</strong> — update the local cache (or return the new value in the write response) so the UI reflects the change immediately while replicas catch up.</li>
                <li><strong>Version/causal token</strong> — the write returns a version; reads pass it and the store waits until a replica is at least that current (bounded staleness / causal consistency).</li>
            </ul>
            <p>All of these preserve global eventual consistency while giving the writer a consistent view of their own data.</p>`,
            explanation: 'You mailed a change-of-address form, then call and the agent reads an old record from a not-yet-updated branch. The fix is not to make every branch instant — it is to make sure when YOU call, you are routed to the desk that already has your update.',
            code: `// Cosmos DB: session consistency + session token gives read-your-own-writes
var write = await container.UpsertItemAsync(profile,
    new PartitionKey(userId));
var sessionToken = write.Headers.Session; // capture after the write

// Subsequent read passes the token -> guaranteed to see >= that write
var read = await container.ReadItemAsync<Profile>(
    userId, new PartitionKey(userId),
    new ItemRequestOptions { SessionToken = sessionToken });

// Alternative: read-after-write routing window
// if (Date.now() - lastWrite[userId] < 5000) readFromPrimary();
// else readFromReplica();`,
            language: 'csharp',
            bestPractices: ['Prefer session/causal consistency over global strong consistency — far cheaper for this case', 'Capture and propagate the session/causal token through the user’s request flow', 'Optimistically reflect the write in the UI/cache so perceived latency is zero', 'Scope the consistency guarantee to the writing user, not the whole system'],
            commonMistakes: ['Escalating the entire store to strong consistency to fix one user-visible glitch', 'Reading from a random replica right after a write with no routing or token', 'Returning 200 from the write but not echoing the new value the UI needs', 'Ignoring causal links (a comment appears before the post it belongs to)'],
            interviewTip: 'Name it precisely — "read-your-own-writes / session consistency" — and emphasize you fix it locally for the writer rather than making the whole system strongly consistent. That precision signals real experience.',
            followUp: ['What is the difference between session, causal, and monotonic-read consistency?', 'How do session tokens work and what happens if one is lost?', 'How would you handle this across two different services reading the same data?'],
            seniorPerspective: 'My first move is almost always session consistency plus an optimistic UI update, because it removes the perceived latency entirely while letting the backend stay eventually consistent and cheap to scale. I reserve read-from-primary routing for cases where the client cannot carry a token, and I keep the routing window small to avoid concentrating load on the leader.',
            architectPerspective: 'I treat consistency as a per-interaction guarantee rather than a global setting. Read-your-own-writes is a UX-level requirement that should be satisfied at the lowest-cost layer — session token, sticky read, or client cache — leaving the system’s global model as eventual. The architectural trap is letting one visible anomaly drive a blanket move to strong consistency, paying global latency to solve a single-user problem.'
        },
        {
            question: 'How do quorum reads and writes (the R + W > N rule) provide tunable consistency in systems like Cassandra or DynamoDB?',
            difficulty: 'expert',
            answer: `<p>In a replicated store with <strong>N</strong> replicas per key, you choose how many replicas must acknowledge a <strong>write (W)</strong> and how many must respond to a <strong>read (R)</strong>. The key relationship is <strong>R + W &gt; N</strong>: it guarantees the read and write replica sets <strong>overlap by at least one node</strong>, so any read is guaranteed to see the most recent acknowledged write (strong consistency for that operation).</p>
            <ul>
                <li><strong>W = N, R = 1</strong> — fast reads, slow/fragile writes (all replicas must ack); good for read-heavy data.</li>
                <li><strong>W = 1, R = N</strong> — fast writes, expensive reads; risk if a replica is down on write.</li>
                <li><strong>W = R = quorum</strong> (e.g. ⌈(N+1)/2⌉) — balanced; with N=3, W=2/R=2 tolerates one node down and still satisfies R+W&gt;N.</li>
                <li><strong>R + W ≤ N</strong> — eventual consistency: reads may miss the latest write, but you gain availability and lower latency.</li>
            </ul>
            <p>This is the practical, knob-level expression of CAP/PACELC: per request you slide between availability/latency and consistency by tuning R and W against N. Caveats: it gives single-key consistency only (not multi-key transactions), and concurrent writes still need conflict resolution (last-write-wins timestamps or version vectors).</p>`,
            explanation: 'Three copies of a document live in three offices (N=3). If every change is filed in at least two offices (W=2) and you always check at least two before answering (R=2), the offices you check must overlap with the offices that have the change — so you can never miss the latest version.',
            code: `// Cassandra: consistency level is chosen per statement (N set by replication factor)
// N = 3, QUORUM = 2, so QUORUM read + QUORUM write => R + W = 4 > 3 => strong-for-key

var write = new SimpleStatement(
    "UPDATE profiles SET email=? WHERE id=?", email, id)
    .SetConsistencyLevel(ConsistencyLevel.Quorum);  // W = 2
await session.ExecuteAsync(write);

var read = new SimpleStatement(
    "SELECT email FROM profiles WHERE id=?", id)
    .SetConsistencyLevel(ConsistencyLevel.Quorum);   // R = 2  (R + W > N)
await session.ExecuteAsync(read);

// Need lower latency / higher availability? Drop to ONE (R=1) -> eventual,
// may read stale until hinted handoff / read-repair converges replicas.`,
            language: 'csharp',
            bestPractices: ['Use QUORUM/QUORUM (R+W>N) for keys that need strong per-key consistency', 'Tune R and W independently to match read-heavy vs write-heavy workloads', 'Remember R+W>N is per-key only — it is not a substitute for multi-key transactions', 'Pair quorums with conflict resolution (timestamps/version vectors) for concurrent writes'],
            commonMistakes: ['Assuming R+W>N gives ACID multi-row transactions (it only covers a single key)', 'Setting W=1/R=1 and expecting consistency — that is eventual', 'Ignoring that a node being down can fail a QUORUM write at N=3 if two are unavailable', 'Forgetting last-write-wins can silently drop a concurrent update without version vectors'],
            interviewTip: 'Write the overlap argument on the whiteboard: R + W > N forces the read and write replica sets to intersect, so the read sees the latest write. Then mention it is single-key only — that caveat separates experts from memorizers.',
            followUp: ['What is read repair and hinted handoff?', 'How do version vectors resolve concurrent writes vs last-write-wins?', 'How does this differ from Raft/Paxos-based consensus?'],
            seniorPerspective: 'I tune quorums per table to the workload: QUORUM/QUORUM for the few keys that must be correct, and LOCAL_QUORUM in multi-DC setups so I get consistency within a region without paying cross-region latency on every request. I always confirm whether the app can tolerate a failed write when a node is down, because at N=3 a QUORUM write needs two healthy replicas.',
            architectPerspective: 'Quorum tuning is CAP/PACELC turned into operational knobs, and the deepest trap is treating it as a global transaction system — it is per-key and last-write-wins by default, so I design data models to avoid concurrent conflicting writes to the same key (e.g. append-only events, per-user partitions) rather than relying on quorums to reconcile them. Where true multi-key invariants are required, I move that data to a system built on consensus, not quorum replication.'
        },
        {
            question: 'In an eventually consistent, multi-master system, two replicas accept conflicting writes to the same key. How do you resolve the conflict, and what are the trade-offs of each approach?',
            difficulty: 'hard',
            answer: `<p>When writes can happen on multiple replicas concurrently, divergence is inevitable and you must pick a <strong>conflict resolution</strong> strategy. The main options, from simplest to most powerful:</p>
            <ul>
                <li><strong>Last-Write-Wins (LWW):</strong> attach a timestamp/version to each write; the highest wins. Trivial and the Cassandra/DynamoDB default, but it <strong>silently discards</strong> the losing write and depends on clock accuracy — clock skew can drop the write that actually happened later.</li>
                <li><strong>Version vectors / vector clocks:</strong> track causality so the system can tell whether one write <em>happened-before</em> another or they are truly <strong>concurrent</strong>. Causal updates merge automatically; genuine conflicts are <strong>detected and surfaced</strong> (Dynamo returns sibling versions) for the application or user to resolve. No data is silently lost, but it adds metadata and pushes resolution logic up.</li>
                <li><strong>CRDTs (Conflict-free Replicated Data Types):</strong> data structures (counters, sets, maps) with mathematically <strong>commutative, associative, idempotent</strong> merge functions, so replicas <strong>always converge automatically</strong> regardless of order. Powerful for collaborative apps and counters, but you must model your data as a supported CRDT type.</li>
                <li><strong>Application-/domain-specific merge:</strong> custom logic (e.g. union two shopping carts, take the max stock decrement). Most correct for the domain, but you own the complexity.</li>
            </ul>
            <p>The fundamental trade-off: LWW is simplest but loses data; vector clocks preserve everything but defer resolution; CRDTs guarantee convergence but constrain your data model.</p>`,
            explanation: 'Two editors revise the same document offline. LWW keeps only whichever they saved last and throws the other away — fast but you lose edits. Vector clocks are like tracked changes: the system knows which edits built on which, merges the compatible ones, and flags the genuine clashes for a human. A CRDT is a shared doc designed so that any order of edits always merges to the same sensible result, like an always-mergeable counter of word changes.',
            code: `// LWW: highest timestamp wins — simple, but the losing write is gone (and clock-dependent)
record Versioned<T>(T Value, long TimestampUtcTicks);
Versioned<string> ResolveLww(Versioned<string> a, Versioned<string> b)
    => a.TimestampUtcTicks >= b.TimestampUtcTicks ? a : b; // silently discards the other

// Vector clock: detect concurrency vs causality instead of guessing
// clock = { replicaId -> counter }
static bool HappenedBefore(Dictionary<string,int> x, Dictionary<string,int> y) =>
    x.All(kv => kv.Value <= y.GetValueOrDefault(kv.Key)) &&
    x.Any(kv => kv.Value <  y.GetValueOrDefault(kv.Key));
// if neither happened-before the other -> CONCURRENT -> surface both as siblings to resolve

// CRDT: a grow-only set always converges because merge = union (order-independent)
class GSet<T>
{
    private readonly HashSet<T> _items = new();
    public void Add(T item) => _items.Add(item);
    public void Merge(GSet<T> other) => _items.UnionWith(other._items); // commutative+idempotent
    // Any replicas, merged in any order, reach the identical final set.
}`,
            language: 'csharp',
            bestPractices: [
                'Use LWW only when losing a concurrent write is genuinely acceptable',
                'Use version vectors when no write may be silently lost and the app can resolve siblings',
                'Reach for CRDTs for counters, sets, and collaborative state that must auto-converge',
                'Prefer data models that avoid concurrent writes to the same key (append-only, per-user keys)'
            ],
            commonMistakes: [
                'Relying on LWW without realizing it silently drops data under clock skew',
                'Trusting wall-clock timestamps for ordering across nodes (clocks drift)',
                'Treating concurrent writes as sequential and overwriting instead of merging',
                'Forcing all state into a CRDT when the domain needs custom merge semantics'
            ],
            interviewTip: 'Show the spectrum and its cost: LWW (simple, lossy) to vector clocks (lossless, defers resolution) to CRDTs (auto-converging, constrains the model). The standout point is that LWW silently loses data and depends on synchronized clocks — naming that trade-off signals depth.',
            followUp: [
                'How do vector clocks detect concurrent vs causally-ordered writes?',
                'What properties must a merge function have to make a valid CRDT?',
                'How does Dynamo expose conflicts (sibling versions) to the application?'
            ],
            seniorPerspective: 'My first move is usually to design the conflict away: model the data as append-only events or partition by a single owner (per-user key) so concurrent writes to the same key barely happen. When real concurrency is unavoidable — shopping carts, collaborative editing — I reach for CRDTs or domain-specific merges rather than LWW, because silently losing a customer cart item is a real, hard-to-debug data-loss bug.',
            architectPerspective: 'Conflict resolution is a direct consequence of choosing availability under partition (AP): if you accept writes on both sides of a split, you must reconcile them later. I treat the resolution strategy as a first-class design decision per data type, not a database default — LWW for disposable telemetry, CRDTs/version vectors for anything where losing a user intention is unacceptable. Getting this wrong shows up as silent, intermittent data loss that is extremely hard to trace after the fact.'
        }
    ]
});
