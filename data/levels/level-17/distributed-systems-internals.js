'use strict';

PageData.register('distributed-systems-internals', {
  title: 'Distributed Systems Internals',
  description: 'Deep dive into consensus algorithms, CRDTs, consistency models, and fault tolerance patterns that define modern distributed systems at Staff+ level.',
  sections: [
    {
      title: 'Introduction',
      content: `
        <p>Distributed systems engineering is the domain where theoretical computer science meets real-world infrastructure. At Staff/Principal level, you must reason about impossibility results, consistency trade-offs, and failure modes that most engineers never encounter in single-node systems.</p>
        <p>This topic covers the internals: how consensus is achieved, how time is tracked without synchronized clocks, how data structures resolve conflicts without coordination, and how systems detect and tolerate failures at scale.</p>
        <p>Understanding these internals separates architects who can design globally distributed systems from those who merely consume managed services without understanding the guarantees underneath.</p>
        <p><strong>Why this matters at Staff+ level</strong>: When your Kafka consumer group rebalances and drops messages, when your Redis cluster enters split-brain, when your DynamoDB table throttles despite provisioned capacity — understanding the internals tells you <em>why</em> it happened and <em>what trade-off</em> you need to adjust. Without this knowledge, you're debugging symptoms instead of root causes.</p>
        <p>The concepts here form the vocabulary for discussing system design at the highest level: CAP trade-offs during architecture reviews, consistency requirements during product discussions, and failure budgets during SLA negotiations.</p>
      `
    },
    {
      title: 'Core Concepts',
      content: `
        <p><strong>Consensus</strong> is the fundamental problem: getting N nodes to agree on a value despite failures. Raft simplifies this with leader election and log replication. Paxos is equivalent but harder to implement.</p>
        <p><strong>Time and Ordering</strong>: Without synchronized clocks, we use logical clocks. Lamport timestamps give total order but lose causality information. Vector clocks preserve causal relationships but grow with the number of nodes.</p>
        <p><strong>Conflict Resolution</strong>: CRDTs (Conflict-free Replicated Data Types) are data structures that mathematically guarantee convergence without coordination. They exploit commutativity, associativity, and idempotency.</p>
        <p><strong>Data Placement</strong>: Consistent hashing distributes data across nodes while minimizing redistribution when nodes join or leave. Virtual nodes improve balance.</p>
        <p><strong>Failure Detection</strong>: Gossip protocols disseminate membership information and detect failures through probabilistic means, avoiding single points of failure in monitoring.</p>
        <p><strong>The spectrum of guarantees</strong>:</p>
        <ul>
          <li><strong>Safety</strong>: Nothing bad ever happens (e.g., no two leaders in same Raft term)</li>
          <li><strong>Liveness</strong>: Something good eventually happens (e.g., a leader is eventually elected)</li>
          <li>The FLP impossibility proves you can't have both safety AND liveness AND fault tolerance in an asynchronous system — practical algorithms sacrifice liveness (may temporarily stall) to maintain safety</li>
        </ul>
        <p><strong>Replication strategies</strong>: Single-leader (Raft — simple, linearizable, single throughput bottleneck), multi-leader (conflict resolution needed, higher availability), leaderless (quorum-based, DynamoDB — highest availability, most complex).</p>
      `
    },
    {
      title: 'Raft Consensus: Leader Election & Log Replication',
      mermaid: `sequenceDiagram
    participant F1 as Follower 1
    participant C as Candidate
    participant F2 as Follower 2
    Note over F1,F2: Election timeout expires on C
    C->>F1: RequestVote(term=2, lastLogIndex=5)
    C->>F2: RequestVote(term=2, lastLogIndex=5)
    F1-->>C: VoteGranted(term=2)
    F2-->>C: VoteGranted(term=2)
    Note over C: Becomes Leader (majority votes)
    C->>F1: AppendEntries(term=2, entries=[...])
    C->>F2: AppendEntries(term=2, entries=[...])
    F1-->>C: Success(matchIndex=6)
    F2-->>C: Success(matchIndex=6)
    Note over C: Commits entry (replicated to majority)`,
      content: `
        <p><strong>Leader Election</strong>: Followers become candidates after an election timeout (randomized 150-300ms). A candidate requests votes from all nodes. A node votes for at most one candidate per term. The candidate with majority votes becomes leader.</p>
        <p><strong>Log Replication</strong>: The leader appends entries to its log and replicates via AppendEntries RPCs. An entry is committed once replicated to a majority. The leader's log is the source of truth — followers never diverge.</p>
        <p><strong>Safety</strong>: Raft's election restriction ensures that a candidate must have all committed entries to win an election. This guarantees the State Machine Safety property without complex rollback.</p>
        <p><strong>Key insight</strong>: Raft decomposes consensus into leader election, log replication, and safety — each independently understandable, unlike Paxos which interleaves these concerns.</p>
        <p><strong>Membership changes</strong>: Raft handles cluster membership changes (adding/removing nodes) via joint consensus. The old and new configurations overlap during transition. This prevents split-brain during reconfiguration — a notoriously tricky problem.</p>
        <p><strong>Log compaction</strong>: Logs grow unboundedly. Raft uses snapshots: periodically take a snapshot of the state machine, discard all log entries before the snapshot. New nodes receive the snapshot + recent log entries rather than the entire history.</p>
        <p><strong>Performance optimizations in production Raft</strong>:</p>
        <ul>
          <li><strong>Batching</strong>: Leader batches multiple client requests into single AppendEntries RPC</li>
          <li><strong>Pipelining</strong>: Send next AppendEntries before receiving ack for previous (increases throughput at cost of more retransmissions on failure)</li>
          <li><strong>Parallel replication</strong>: Replicate to multiple followers concurrently (commit when majority responds)</li>
          <li><strong>Leader lease</strong>: Leader serves reads locally during its lease period without contacting followers (reduces read latency, may serve slightly stale data on leader failure)</li>
          <li><strong>ReadIndex</strong>: Leader confirms it's still leader by getting acks from majority before serving read (linearizable reads without log entry per read)</li>
        </ul>
      `
    },
    {
      title: 'Consistency Models & CAP/PACELC',
      mermaid: `graph TD
    subgraph "Consistency Spectrum"
        L[Linearizability] --> SC[Sequential Consistency]
        SC --> CI[Causal Consistency]
        CI --> EC[Eventual Consistency]
    end
    subgraph "CAP Theorem"
        CP[CP Systems<br/>HBase, Zookeeper] 
        AP[AP Systems<br/>Cassandra, DynamoDB]
        CA[CA Systems<br/>Single-node RDBMS]
    end
    subgraph "PACELC Extension"
        PAC[Partition: Availability vs Consistency]
        ELC[Else: Latency vs Consistency]
    end
    CP --> PAC
    AP --> PAC
    PAC --> ELC`,
      content: `
        <p><strong>Linearizability</strong>: Every operation appears to take effect atomically at some point between invocation and response. The strongest single-object guarantee — as if there's one copy.</p>
        <p><strong>Sequential Consistency</strong>: Operations appear in some total order consistent with each process's program order, but not necessarily real-time. Weaker than linearizability but still useful.</p>
        <p><strong>Eventual Consistency</strong>: If no new updates, all replicas converge to the same value. No ordering guarantees during convergence. DynamoDB, Cassandra default mode.</p>
        <p><strong>CAP Nuance</strong>: CAP is about behavior during network partitions only. PACELC extends: during Partition choose A or C, Else (no partition) choose Latency or Consistency. This explains why DynamoDB (PA/EL) differs from Cosmos DB (PA/EC with tunable consistency).</p>
        <p><strong>Quorum Systems</strong>: With N replicas, read quorum R, write quorum W: if R+W > N, reads see latest writes. Typical: N=3, R=2, W=2. Tunable per operation for read-heavy vs write-heavy workloads.</p>
        <p><strong>Session guarantees</strong> (weaker than linearizability, stronger than eventual): Read-your-writes, monotonic reads, monotonic writes, writes-follow-reads. These per-client guarantees are often sufficient for user-facing applications without requiring full linearizability.</p>
        <p><strong>Causal Consistency</strong>: Operations that are causally related appear in causal order to all nodes. Concurrent operations (no causal relationship) may appear in different orders. Stronger than eventual, weaker than linearizability. Achievable without coordination (using vector clocks or their equivalents). MongoDB offers causal consistency sessions.</p>
      `
    },
    {
      title: 'CRDTs: Conflict-Free Replicated Data Types',
      content: `
        <p>CRDTs guarantee convergence without coordination by leveraging mathematical properties of their merge operations:</p>
        <p><strong>G-Counter (Grow-only Counter)</strong>: Each node maintains its own counter. The value is the sum of all counters. Merge = element-wise max. Monotonically increasing — can only increment.</p>
        <p><strong>PN-Counter</strong>: Two G-Counters — one for increments, one for decrements. Value = sum(increments) - sum(decrements).</p>
        <p><strong>LWW-Register (Last-Writer-Wins)</strong>: Each update carries a timestamp. Merge picks the value with the highest timestamp. Simple but requires loosely synchronized clocks and can lose concurrent updates.</p>
        <p><strong>OR-Set (Observed-Remove Set)</strong>: Each add tags the element with a unique ID. Remove removes only observed tags. Concurrent add+remove = element present (add wins). Used in shopping carts, collaborative editors.</p>
        <p><strong>RGA (Replicated Growable Array)</strong>: A sequence CRDT for collaborative text editing. Each character gets a unique ID based on insertion position. Concurrent insertions are ordered deterministically by timestamp + site ID.</p>
        <p><strong>Key insight</strong>: CRDTs trade expressiveness for availability. Not every data structure has a CRDT equivalent, but where they fit, they eliminate coordination overhead entirely.</p>
        <p><strong>Mathematical foundations</strong>: CRDTs are either state-based (CvRDT — send full state, merge = join operation in a lattice) or operation-based (CmRDT — send operations, require at-least-once delivery + commutativity). State-based are simpler to implement; operation-based have smaller message sizes. Most modern systems use delta-state CRDTs, which send only the delta (changed portion of state), combining the best of both approaches.</p>
      `,
      code: {
        language: 'csharp',
        content: `// G-Counter CRDT implementation
public class GCounter
{
    private readonly Dictionary<string, long> _counters = new();
    private readonly string _nodeId;

    public GCounter(string nodeId) => _nodeId = nodeId;

    public long Value => _counters.Values.Sum();

    public void Increment(long amount = 1)
    {
        if (amount < 0) throw new ArgumentException("G-Counter only grows");
        _counters[_nodeId] = _counters.GetValueOrDefault(_nodeId) + amount;
    }

    public GCounter Merge(GCounter other)
    {
        var merged = new GCounter(_nodeId);
        var allKeys = _counters.Keys.Union(other._counters.Keys);
        foreach (var key in allKeys)
        {
            merged._counters[key] = Math.Max(
                _counters.GetValueOrDefault(key),
                other._counters.GetValueOrDefault(key));
        }
        return merged;
    }
}`
      }
    },
    {
      title: 'Consistent Hashing with Virtual Nodes',
      content: `
        <p>Consistent hashing maps both keys and nodes onto a circular hash space (ring). A key is assigned to the first node clockwise from its position. When nodes join/leave, only K/N keys (on average) need redistribution.</p>
        <p><strong>Virtual Nodes</strong>: Each physical node maps to multiple positions on the ring. This improves load balance (especially with heterogeneous hardware) and ensures smooth redistribution.</p>
        <p><strong>Replication</strong>: To replicate, walk clockwise and place copies on the next N distinct physical nodes (skipping virtual nodes of the same physical node).</p>
        <p><strong>Ring maintenance</strong>: When a new node joins with V virtual nodes, it takes ownership of V arcs from existing nodes. Each existing node loses a small fraction of its keys — the redistribution is spread across many nodes, preventing hotspots during rebalancing.</p>
        <p><strong>Token assignment strategies</strong>:</p>
        <ul>
          <li><strong>Random placement</strong>: Hash(nodeId-vnodeIndex). Simple but can create imbalance with few nodes. Used by early Cassandra.</li>
          <li><strong>Equal-spaced placement</strong>: Divide ring into equal arcs for new nodes. Better balance but requires global coordination on join.</li>
          <li><strong>Adaptive placement</strong>: Assign more virtual nodes to underloaded physical nodes. Requires monitoring and periodic rebalancing.</li>
        </ul>
        <p><strong>Jump Consistent Hashing</strong>: An alternative that doesn't use a ring at all. Maps key → bucket using a deterministic algorithm that only changes O(1/N) mappings when N changes. Zero memory overhead (no ring structure stored). Limitation: only supports sequential bucket IDs (0..N-1), not arbitrary node identifiers.</p>
      `,
      code: {
        language: 'csharp',
        content: `// Consistent Hashing Ring with Virtual Nodes
public class ConsistentHashRing<T>
{
    private readonly SortedDictionary<uint, T> _ring = new();
    private readonly int _virtualNodes;
    private readonly Func<string, uint> _hash;

    public ConsistentHashRing(int virtualNodes = 150, Func<string, uint>? hash = null)
    {
        _virtualNodes = virtualNodes;
        _hash = hash ?? DefaultHash;
    }

    public void AddNode(T node)
    {
        for (int i = 0; i < _virtualNodes; i++)
        {
            uint hash = _hash($"{node}-vnode-{i}");
            _ring[hash] = node;
        }
    }

    public void RemoveNode(T node)
    {
        for (int i = 0; i < _virtualNodes; i++)
        {
            uint hash = _hash($"{node}-vnode-{i}");
            _ring.Remove(hash);
        }
    }

    public T GetNode(string key)
    {
        if (_ring.Count == 0) throw new InvalidOperationException("Ring is empty");
        uint hash = _hash(key);
        // Find first node clockwise from key position
        foreach (var kvp in _ring)
            if (kvp.Key >= hash) return kvp.Value;
        // Wrap around to first node
        return _ring.First().Value;
    }

    private static uint DefaultHash(string key)
    {
        using var md5 = System.Security.Cryptography.MD5.Create();
        byte[] bytes = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(key));
        return BitConverter.ToUInt32(bytes, 0);
    }
}`
      }
    },
    {
      title: 'Gossip Protocols & Failure Detection',
      content: `
        <p><strong>Gossip (Epidemic) Protocols</strong> spread information through random peer-to-peer exchanges. Each round, a node selects random peers and exchanges state. Information reaches all N nodes in O(log N) rounds with high probability.</p>
        <p><strong>SWIM Protocol</strong> (Scalable Weakly-consistent Infection-style Membership): Combines failure detection with dissemination. Nodes ping random peers; if no ack, delegate pings through intermediaries before declaring failure.</p>
        <p><strong>Failure Detection Properties</strong>:</p>
        <ul>
          <li><strong>Completeness</strong>: Every failed node is eventually detected</li>
          <li><strong>Accuracy</strong>: No healthy node is incorrectly suspected</li>
          <li>Perfect failure detection is impossible in asynchronous systems (FLP result)</li>
        </ul>
        <p><strong>Phi Accrual Detector</strong>: Instead of binary alive/dead, outputs a suspicion level (phi). Application decides threshold. Used in Cassandra and Akka Cluster. Adapts to network conditions automatically.</p>
        <p><strong>Crux</strong>: Gossip gives you decentralized, partition-tolerant dissemination at the cost of eventual (not immediate) consistency of membership views.</p>
        <p><strong>Dissemination modes</strong>:</p>
        <ul>
          <li><strong>Push</strong>: Node sends its state to random peers. Simple, but redundant messages increase as information spreads.</li>
          <li><strong>Pull</strong>: Node asks random peers for their state. More efficient in later rounds (already-informed nodes don't waste bandwidth).</li>
          <li><strong>Push-Pull</strong>: Both directions simultaneously. Converges fastest. Used by Cassandra.</li>
        </ul>
        <p><strong>Infection rate</strong>: With push gossip and fanout=3 (each round, contact 3 peers), a 1000-node cluster converges in ~12 rounds (log₃(1000) ≈ 6.3, but accounting for probability → ~12 for 99.9% coverage). At 1-second rounds, full propagation in 12 seconds.</p>
      `
    },
    {
      title: 'Two Generals, Byzantine Faults & FLP',
      content: `
        <p><strong>Two Generals Problem</strong>: Two armies on opposite sides of a valley must agree to attack simultaneously. Messages (sent through the valley) may be lost. Proof: the last sender can never confirm their message was received. Implication: <em>guaranteed agreement over unreliable channels is impossible</em> with any finite protocol.</p>
        <p><strong>FLP Impossibility</strong> (Fischer, Lynch, Paterson 1985): In an asynchronous system (no bound on message delay), no deterministic consensus algorithm can guarantee termination if even one process may crash. Practical systems circumvent this via:</p>
        <ul>
          <li><strong>Randomization</strong>: Algorithms like Ben-Or's introduce random coin flips to break symmetry (terminates with probability 1, not certainty)</li>
          <li><strong>Partial synchrony</strong>: Assume the system is asynchronous but eventually becomes synchronous (Raft's election timeout relies on this)</li>
          <li><strong>Failure detectors</strong>: Oracle that eventually correctly identifies failed nodes (phi accrual detector)</li>
        </ul>
        <p><strong>Byzantine Fault Tolerance (BFT)</strong>: Nodes may behave arbitrarily (send conflicting messages, collude). Requires 3f+1 nodes to tolerate f Byzantine faults (vs 2f+1 for crash faults). PBFT (Practical BFT) achieves consensus in 3 communication rounds. Used in blockchain (Tendermint) and some financial systems.</p>
        <p><strong>Why 3f+1?</strong> With f Byzantine nodes, you need f+1 correct nodes in every quorum (to outvote the faulty ones). Quorums must overlap by at least f+1 correct nodes. This arithmetic requires N ≥ 3f+1.</p>
      `
    },
    {
      title: 'Bloom Filters & Probabilistic Data Structures',
      content: `
        <p><strong>Bloom Filter</strong>: A space-efficient probabilistic set membership test. Uses k hash functions mapping to a bit array of m bits. Can have false positives (say "yes" when element isn't present) but never false negatives.</p>
        <p><strong>False positive rate</strong>: (1 - e^(-kn/m))^k where n = elements inserted. Optimal k = (m/n) * ln(2). At 10 bits per element with 7 hash functions, you get approximately 0.8% false positive rate.</p>
        <p><strong>Use cases in distributed systems</strong>:</p>
        <ul>
          <li>Cassandra uses Bloom filters to avoid unnecessary disk reads for SSTables — if the filter says "not present," skip that SSTable entirely</li>
          <li>Bitcoin uses them for SPV (Simplified Payment Verification) nodes to filter relevant transactions without downloading the full blockchain</li>
          <li>CDNs use them to avoid caching one-hit-wonder content ("first miss" caching)</li>
          <li>Distributed deduplication (check if message already processed across multiple consumers)</li>
          <li>Network routers use them for packet classification and route lookup acceleration</li>
        </ul>
        <p><strong>Counting Bloom Filter</strong>: Replaces bits with counters, allowing deletion at the cost of more space (4 bits per counter typical). Supports remove() operation. Risk: counter overflow on heavily-inserted items.</p>
        <p><strong>Cuckoo Filter</strong>: Supports deletion, better space efficiency for low false-positive rates, and faster lookups via cache-friendly operations. Uses cuckoo hashing — two possible positions per element, relocating on collision. Preferred over counting Bloom filters for most modern use cases.</p>
        <p><strong>Scalable Bloom Filters</strong>: For unbounded sets, chain multiple Bloom filters with decreasing FP rates (first filter: 1%, second: 0.5%, third: 0.25%). Overall FP rate converges. Used when you can't predict the final set size at creation time.</p>
        <p><strong>Space comparison</strong>: 1 billion elements at 1% FP rate: Bloom filter ≈ 1.2 GB, HashSet ≈ 32+ GB, Cuckoo filter ≈ 1 GB. The 25x space savings is why probabilistic data structures dominate at scale.</p>
      `
    },
    {
      title: 'Common Mistakes',
      content: `
        <ul>
          <li><strong>Confusing consensus with leader election</strong>: Leader election is one use of consensus. Consensus is about agreeing on arbitrary values — state machine replication, configuration changes, etc.</li>
          <li><strong>Treating CAP as a permanent choice</strong>: Systems can switch behavior during partitions. Many "AP" systems offer tunable consistency per operation.</li>
          <li><strong>Assuming vector clocks solve all ordering</strong>: Vector clocks only track causality. Concurrent events (neither happened-before the other) require application-level conflict resolution.</li>
          <li><strong>Using CRDTs everywhere</strong>: CRDTs have semantic limitations. A CRDT counter can't enforce "balance >= 0" — that requires coordination.</li>
          <li><strong>Ignoring the FLP impossibility</strong>: No deterministic algorithm can guarantee consensus in an asynchronous system with even one crash failure. Practical systems use randomization or partial synchrony assumptions.</li>
          <li><strong>Confusing consistency (CAP) with consistency (ACID)</strong>: CAP consistency = linearizability. ACID consistency = invariant preservation. Entirely different concepts sharing a word.</li>
          <li><strong>Assuming network partitions are rare</strong>: In cloud environments, partial partitions (one node can reach A but not B) are common due to switch failures, network congestion, and misconfigured security groups. Design for partitions as a normal operating condition.</li>
          <li><strong>Ignoring gray failures</strong>: A node that's "alive" but extremely slow (GC pause, disk thrashing, network congestion) is harder to handle than a clean crash. Timeout-based detection + circuit breakers help, but gray failures test every assumption in your failure model.</li>
        </ul>
      `
    },
    {
      title: 'Interview Tips',
      callout: true,
      content: `
        <p><strong>Draw diagrams</strong>: Distributed systems questions benefit enormously from visual communication. Draw the ring for consistent hashing, the timeline for vector clocks, the state machine for Raft.</p>
        <p><strong>State trade-offs explicitly</strong>: "We gain availability but lose linearizability" or "We reduce coordination but accept conflict resolution complexity." Interviewers want to see you reason about trade-offs, not memorize facts.</p>
        <p><strong>Connect theory to real systems</strong>: Mention that DynamoDB uses consistent hashing, Cassandra uses gossip + phi accrual, CockroachDB uses Raft, Redis Cluster uses gossip for slot migration.</p>
        <p><strong>Discuss failure modes</strong>: What happens during a network partition? What about a slow node (gray failure)? How does the system recover? This demonstrates operational maturity.</p>
        <p><strong>Know the impossibility results</strong>: FLP (no consensus in async systems), Two Generals (no guaranteed agreement over unreliable channels), Byzantine agreement requires 3f+1 nodes for f Byzantine failures.</p>
        <p><strong>Quantify where possible</strong>: "Raft election timeout is typically 150-300ms randomized", "Gossip converges in O(log N) rounds — ~12 seconds for 1000 nodes with 1s intervals", "Bloom filter with 1% FP rate needs 10 bits per element". Numbers show depth.</p>
        <p><strong>Acknowledge what you don't know</strong>: If asked about Paxos details and you primarily know Raft, say so. "I'm more familiar with Raft's implementation, which is equivalent to Multi-Paxos in a different formulation. The key difference is..." Honesty about boundaries shows intellectual integrity.</p>
      `
    },
    {
      title: 'Key Takeaways',
      content: `
        <ul>
          <li>Consensus (Raft/Paxos) is the foundation for strong consistency in distributed systems — understand the leader election and log replication phases</li>
          <li>Vector clocks preserve causality where Lamport timestamps only give total order — choose based on whether you need to detect concurrent operations</li>
          <li>CRDTs provide convergence without coordination using mathematical properties — ideal for high-availability systems where conflicts are semantically resolvable</li>
          <li>Consistent hashing with virtual nodes provides balanced, stable data placement — the standard for distributed caches and databases</li>
          <li>PACELC extends CAP to explain behavior when there's no partition — most real systems trade latency for consistency (or vice versa) even during normal operation</li>
          <li>Gossip protocols provide decentralized, fault-tolerant information dissemination in O(log N) rounds — critical for large clusters</li>
          <li>Bloom filters trade a bounded false-positive rate for dramatic space and time savings — ubiquitous in storage engines and network systems</li>
          <li>The FLP impossibility, Two Generals Problem, and Byzantine fault bounds are not just academic — they define hard limits on what your system can guarantee</li>
          <li>Every distributed system sits somewhere on the consistency-availability-latency spectrum — understand where your system is and why</li>
          <li>Real production systems combine multiple techniques: Cassandra uses gossip + consistent hashing + quorums + Bloom filters together. Understanding individual primitives lets you reason about the whole.</li>
        </ul>
      `
    }
  ],
  advancedTopics: [
    {
      title: 'Vector Clocks: Tracking Causality',
      content: `
        <p><strong>Lamport Timestamps</strong>: A single integer counter. Rules: (1) Before sending, increment. (2) On receive, set local = max(local, received) + 1. Gives total order but cannot distinguish causal from concurrent events.</p>
        <p><strong>Vector Clocks</strong>: Array of N counters (one per node). Node i increments VC[i] before each event. On receive, merge = element-wise max, then increment own counter. Two events are concurrent iff neither VC dominates the other.</p>
        <p><strong>Example</strong>: Node A has VC=[3,0,0], Node B has VC=[0,2,0]. Neither dominates → concurrent. If A sends to B, B becomes [3,3,0] — causally after both.</p>
        <p><strong>Practical limitation</strong>: Vector clocks grow with number of nodes. For a 1000-node cluster, each operation carries a 1000-element vector. Solutions: dotted version vectors, interval tree clocks, or hybrid logical clocks (HLC) which combine physical + logical timestamps.</p>
        <p><strong>Dynamo's approach</strong>: Amazon's Dynamo used vector clocks for conflict detection. On read, if versions are concurrent, return all versions to the client for resolution. This became the foundation for DynamoDB's conflict resolution model.</p>
      `,
      code: {
        language: 'csharp',
        content: `// Vector Clock implementation for conflict detection
public class VectorClock
{
    private readonly Dictionary<string, long> _clock = new();
    private readonly string _nodeId;

    public VectorClock(string nodeId) => _nodeId = nodeId;

    // Increment before any local event or send
    public void Increment()
    {
        _clock[_nodeId] = _clock.GetValueOrDefault(_nodeId) + 1;
    }

    // Merge on message receive: element-wise max
    public void Merge(VectorClock other)
    {
        foreach (var (node, time) in other._clock)
            _clock[node] = Math.Max(_clock.GetValueOrDefault(node), time);
        Increment(); // Local event: receiving the message
    }

    // Compare: determine causal relationship
    public CausalRelation CompareTo(VectorClock other)
    {
        bool thisGreater = false, otherGreater = false;
        var allKeys = _clock.Keys.Union(other._clock.Keys);

        foreach (var key in allKeys)
        {
            long thisVal = _clock.GetValueOrDefault(key);
            long otherVal = other._clock.GetValueOrDefault(key);
            if (thisVal > otherVal) thisGreater = true;
            if (otherVal > thisVal) otherGreater = true;
        }

        if (thisGreater && !otherGreater) return CausalRelation.After;
        if (otherGreater && !thisGreater) return CausalRelation.Before;
        if (!thisGreater && !otherGreater) return CausalRelation.Equal;
        return CausalRelation.Concurrent; // Both have advances
    }
}

public enum CausalRelation { Before, After, Equal, Concurrent }`
      }
    },
    {
      title: 'Quorum Systems: Deep Dive',
      content: `
        <p><strong>Strict Quorum</strong>: R + W > N guarantees overlap. Every read sees at least one replica with the latest write. But which value is "latest"? Use version numbers or timestamps to determine recency.</p>
        <p><strong>Read Repair</strong>: When a read returns stale values from some replicas, the coordinator sends the latest value back to stale replicas. Passive repair — happens on the read path.</p>
        <p><strong>Anti-Entropy</strong>: Background process that compares Merkle trees of data between replicas. When differences are found, transfers the missing/newer data. Active repair — happens continuously regardless of reads.</p>
        <p><strong>Sloppy Quorum with Hinted Handoff</strong>: During a partition, writes go to any available W nodes (even if not the "home" replicas). These nodes store a "hint" to forward the data when the home replica recovers. Provides availability during partitions at the cost of temporary inconsistency.</p>
        <p><strong>Tuning patterns</strong>:</p>
        <ul>
          <li>N=3, R=1, W=1: Maximum availability, eventual consistency (DynamoDB default)</li>
          <li>N=3, R=2, W=2: Strong consistency with single-node fault tolerance</li>
          <li>N=5, R=3, W=3: Strong consistency surviving 2 simultaneous failures</li>
          <li>N=3, R=3, W=1: Fast writes, slow but always-consistent reads</li>
          <li>N=3, R=1, W=3: Slow writes (wait for all replicas), fast reads (any replica suffices)</li>
        </ul>
      `
    },
    {
      title: 'Practical System Mapping',
      content: `
        <p>Understanding how real systems apply these concepts solidifies theoretical knowledge:</p>
        <ul>
          <li><strong>Apache Cassandra</strong>: Consistent hashing (virtual nodes), gossip protocol (SWIM variant), phi accrual failure detector, tunable quorum per query, Bloom filters per SSTable, anti-entropy via Merkle trees</li>
          <li><strong>CockroachDB</strong>: Multi-Raft (one Raft group per range), hybrid logical clocks, serializable transactions via MVCC, consistent hashing for range placement</li>
          <li><strong>Amazon DynamoDB</strong>: Consistent hashing with partition splitting, vector clocks (deprecated for LWW in some modes), sloppy quorum + hinted handoff, Paxos for leader election of storage nodes</li>
          <li><strong>etcd</strong>: Single Raft group, linearizable reads (read from leader or read-index protocol), watch mechanism built on MVCC revision numbering</li>
          <li><strong>Redis Cluster</strong>: Hash slots (16384 slots), gossip for cluster topology, no consensus for writes (single-master per slot), manual failover via CLUSTER FAILOVER</li>
          <li><strong>Apache Kafka</strong>: ISR (In-Sync Replicas) for replication (not quorum-based), ZooKeeper/KRaft for metadata consensus, log-based storage with offset tracking</li>
        </ul>
        <p>Each system makes different trade-offs along the CAP/PACELC spectrum. No single system is "best" — the choice depends on your consistency, availability, and latency requirements.</p>
        <p><strong>Key architectural patterns across these systems</strong>:</p>
        <ul>
          <li><strong>Write-ahead log (WAL)</strong>: Nearly all durable systems write to an append-only log before updating state. This provides crash recovery and replication (Raft = replicated WAL). Kafka IS a replicated WAL.</li>
          <li><strong>MVCC (Multi-Version Concurrency Control)</strong>: Keep old versions of data alongside new. Readers see a consistent snapshot without blocking writers. Used by CockroachDB, PostgreSQL, etcd, and Spanner.</li>
          <li><strong>LSM Trees (Log-Structured Merge)</strong>: Write to memory (memtable), flush to sorted files (SSTables) on disk, compact periodically. Write-optimized. Used by Cassandra, RocksDB (LevelDB descendant), and CockroachDB's storage engine.</li>
          <li><strong>B-Trees</strong>: Read-optimized balanced trees. Traditional databases (PostgreSQL, MySQL). Updates are in-place, not append-only. Better read amplification, worse write amplification than LSM.</li>
        </ul>
      `
    }
  ],
  questions: [
    {
      question: "Explain how Raft leader election ensures safety. What prevents split-brain scenarios?",
      difficulty: "hard",
      answer: "<p>Raft prevents split-brain through <strong>term numbers</strong> and <strong>majority voting</strong>. Each term has at most one leader because a candidate needs votes from a majority (⌊N/2⌋+1) of nodes, and each node votes for at most one candidate per term. Since two majorities must overlap, two leaders in the same term is impossible.</p><p>If a network partition occurs, only the partition with a majority can elect a leader. The minority partition's old leader cannot commit new entries (can't reach majority) and will step down upon seeing a higher term number when the partition heals.</p><p>The <strong>election restriction</strong> adds safety: a candidate's log must be at least as up-to-date as the voter's log. This ensures the new leader has all committed entries, preventing data loss without complex rollback mechanisms.</p>",
      interviewTip: "Walk through the term increment, vote request, and majority requirement step by step. Mention that randomized election timeouts prevent live-lock.",
      followUp: ["How does Raft handle log divergence after a leader change?", "What is the difference between committed and applied in Raft?"],
      seniorPerspective: "In production Raft implementations (etcd, CockroachDB), the election timeout tuning is critical — too short causes unnecessary elections, too long means slow failover. Pre-vote extensions reduce disruption from partitioned nodes.",
      architectPerspective: "Raft's single-leader design creates a throughput bottleneck. Multi-Raft (CockroachDB's approach with one Raft group per range) parallelizes consensus across data ranges while maintaining per-range linearizability."
    },
    {
      question: "Compare vector clocks and Lamport timestamps. When would you choose each?",
      difficulty: "medium",
      answer: "<p><strong>Lamport Timestamps</strong> provide a total ordering of events (if a→b then L(a) < L(b)), but the converse isn't true — L(a) < L(b) doesn't mean a happened before b. They're a single integer incremented on send/receive.</p><p><strong>Vector Clocks</strong> are arrays of N counters (one per node). They capture causal relationships: VC(a) < VC(b) iff a causally precedes b. If neither VC(a) < VC(b) nor VC(b) < VC(a), the events are concurrent — exactly what you need to detect conflicts.</p><p><strong>Choose Lamport timestamps</strong> when you just need a consistent total order (log ordering, unique IDs with Snowflake-style generation). <strong>Choose vector clocks</strong> when you must detect concurrent updates for conflict resolution (DynamoDB-style multi-master replication).</p><p>Vector clocks grow O(N) with nodes — for large clusters, use dotted version vectors or interval tree clocks to bound size.</p>",
      interviewTip: "Draw a timeline with three nodes showing messages and demonstrate how vector clocks detect concurrency while Lamport timestamps cannot.",
      followUp: ["How do dotted version vectors improve on classic vector clocks?", "What is the relationship between vector clocks and version vectors in Amazon's Dynamo paper?"],
      seniorPerspective: "In practice, most systems use hybrid logical clocks (HLC) which combine physical timestamps with logical counters. CockroachDB uses HLCs for serializable transactions without requiring perfectly synchronized clocks.",
      architectPerspective: "The choice between vector clocks and HLCs reflects a fundamental architecture decision: do you want conflict detection (AP system) or conflict prevention (CP system)? This cascades into your entire data model and API design."
    },
    {
      question: "Design a system using CRDTs for a collaborative shopping cart. How do you handle add, remove, and quantity changes?",
      difficulty: "advanced",
      answer: "<p>Use an <strong>OR-Set (Observed-Remove Set)</strong> for cart items and <strong>PN-Counters</strong> for quantities:</p><p><strong>Add item</strong>: Insert (itemId, uniqueTag) into the OR-Set. The tag (UUID or node+counter) ensures that concurrent adds are both preserved.</p><p><strong>Remove item</strong>: Remove all currently observed tags for that item. Concurrent add+remove resolves to item present (add wins) — this is the OR-Set semantic.</p><p><strong>Change quantity</strong>: Use a PN-Counter per item. Increment(+3) and decrement(-1) from different replicas merge correctly. To set an absolute value, use a <strong>LWW-Register</strong> for quantity instead (requires loosely synchronized clocks).</p><p><strong>Practical concern</strong>: Negative quantities. A PN-Counter can go negative. Add application-level validation at read time: display max(0, quantity). Or use a bounded counter CRDT that pre-allocates decrements — but this reintroduces coordination.</p>",
      interviewTip: "Mention the trade-off: OR-Sets are complex (metadata grows) but semantically correct. In practice, many systems (Riak) offer both OR-Set and LWW-Set, letting developers choose per use case.",
      followUp: ["How would you handle 'set quantity to exactly 5' in a CRDT?", "What happens to CRDT metadata over time and how do you garbage collect it?"],
      seniorPerspective: "Real CRDT implementations need garbage collection of tombstones and causal metadata. This often requires periodic coordination (anti-entropy sessions), partially defeating the coordination-free promise.",
      architectPerspective: "CRDTs shine for edge/offline-first architectures (mobile apps, IoT). For server-side systems with reliable networks, operational transforms or event sourcing with conflict resolution may be simpler to reason about."
    },
    {
      question: "Explain the PACELC theorem and provide examples of real systems in each category.",
      difficulty: "hard",
      answer: "<p>PACELC extends CAP: during a <strong>P</strong>artition, choose <strong>A</strong>vailability or <strong>C</strong>onsistency. <strong>E</strong>lse (normal operation), choose <strong>L</strong>atency or <strong>C</strong>onsistency.</p><p><strong>PA/EL</strong> (DynamoDB default): During partitions, stays available. During normal operation, favors low latency over strong consistency. Eventually consistent reads are default.</p><p><strong>PA/EC</strong> (Cosmos DB with bounded staleness): Available during partitions, but during normal operation pays latency cost for consistency guarantees within a bounded window.</p><p><strong>PC/EL</strong> (rare): Gives up availability during partitions but also doesn't sacrifice latency normally. Some caching systems behave this way.</p><p><strong>PC/EC</strong> (Spanner, CockroachDB): Sacrifices availability during partitions AND pays latency cost for strong consistency always. Uses synchronized clocks (TrueTime) or commit-wait to achieve external consistency.</p><p>The insight: CAP only describes partition behavior. PACELC explains why Cassandra (PA/EL) feels different from Spanner (PC/EC) even though both are distributed databases.</p>",
      interviewTip: "Draw a 2x2 matrix with P-choice and E-choice as axes. Map real systems onto it. This shows you understand the nuance beyond 'CP vs AP'.",
      followUp: ["How does Google Spanner achieve external consistency with TrueTime?", "Can a system dynamically switch PACELC categories per operation?"],
      seniorPerspective: "In practice, most systems let you tune per-operation. DynamoDB offers strongly consistent reads (paying latency). Cassandra lets you set per-query consistency levels. The 'category' is the default behavior.",
      architectPerspective: "Choosing a PACELC position is an architectural decision that should match your business requirements. Financial transactions need PC/EC. Social media feeds can use PA/EL. The cost difference between these positions is 10-100x in latency."
    },
    {
      question: "How does consistent hashing handle hot spots and node heterogeneity? Describe the virtual node approach.",
      difficulty: "medium",
      answer: "<p><strong>Problem</strong>: With basic consistent hashing (one point per node on the ring), nodes get uneven load because hash functions don't guarantee equal arc lengths. Adding/removing nodes causes uneven redistribution.</p><p><strong>Virtual Nodes Solution</strong>: Each physical node maps to V positions (virtual nodes) on the ring. Typical V = 100-256. Benefits:</p><ul><li><strong>Load balance</strong>: Statistical averaging across V points smooths out uneven arc lengths</li><li><strong>Heterogeneous hardware</strong>: Assign more virtual nodes to more powerful machines (proportional to capacity)</li><li><strong>Smooth redistribution</strong>: When a node leaves, its V arcs distribute to V different successor nodes instead of overloading one neighbor</li></ul><p><strong>Hot spots</strong>: Consistent hashing doesn't solve hot keys (one key receiving disproportionate traffic). Solutions: key splitting (key-0, key-1, ..., key-N with client-side scatter), caching layer, or read replicas for hot partitions.</p>",
      interviewTip: "Mention that DynamoDB uses consistent hashing with partition splitting for hot partitions, and that Cassandra uses virtual nodes (vnodes) with token assignment.",
      followUp: ["How does jump consistent hashing improve over ring-based consistent hashing?", "What happens during rebalancing when a new node joins with virtual nodes?"],
      seniorPerspective: "Virtual node count is a tuning parameter: too few = poor balance, too many = excessive metadata and slower lookup. 150-256 is typical. Some systems use power-of-two-choices load balancing as an alternative.",
      architectPerspective: "Consistent hashing is the foundation of data placement, but production systems layer replication, rack awareness, and zone awareness on top. The hash ring determines the primary; placement policies determine replica locations."
    },
    {
      question: "Describe the Two Generals Problem and the Byzantine Generals Problem. What are their practical implications?",
      difficulty: "hard",
      answer: "<p><strong>Two Generals Problem</strong>: Two armies must agree on an attack time, communicating only through an unreliable channel (messengers may be captured). It's provably impossible to guarantee agreement — no finite number of message exchanges suffices because the last sender can never be sure their message arrived.</p><p><strong>Practical implication</strong>: You cannot guarantee exactly-once delivery over an unreliable network. TCP provides reliable delivery (with retries and acks) but cannot guarantee the final ack was received. This is why distributed commits use three-phase or Paxos-based protocols.</p><p><strong>Byzantine Generals Problem</strong>: N generals must agree, but up to f may be traitors sending conflicting messages. Requires 3f+1 generals to tolerate f Byzantine faults (or 2f+1 with digital signatures).</p><p><strong>Practical implication</strong>: Most internal distributed systems assume crash failures (node stops responding) not Byzantine faults (node lies). Byzantine fault tolerance (BFT) is needed for: blockchain/cryptocurrency, systems with untrusted participants, or detecting hardware corruption (bit flips).</p>",
      interviewTip: "Distinguish between crash-fault-tolerant (CFT) systems like Raft (needs 2f+1 nodes for f failures) and BFT systems like PBFT (needs 3f+1). Most interview discussions about 'distributed consensus' assume CFT.",
      followUp: ["Why does BFT require 3f+1 nodes while CFT only needs 2f+1?", "How do practical systems achieve exactly-once semantics despite the Two Generals impossibility?"],
      seniorPerspective: "Exactly-once semantics in practice means at-least-once delivery + idempotent processing. Kafka achieves this with producer IDs and sequence numbers. The impossibility is about agreement guarantees, not practical engineering.",
      architectPerspective: "Understanding impossibility results prevents over-promising guarantees. When an architect says 'we guarantee exactly-once processing,' they mean the idempotency pattern, not that they've solved the Two Generals Problem."
    },
    {
      question: "How would you implement quorum reads and writes? What happens when R+W ≤ N?",
      difficulty: "advanced",
      answer: "<p><strong>Quorum system</strong>: With N replicas, a write quorum W and read quorum R, if R+W > N then every read overlaps with the latest write — guaranteeing the read sees the most recent value (with version comparison).</p><p><strong>Implementation</strong>: Write to W replicas, attach a version/timestamp. Read from R replicas, return the value with the highest version. If replicas disagree, perform read-repair (push latest value to stale replicas).</p><p><strong>When R+W ≤ N</strong>: Reads may miss the latest write (stale reads possible). This is acceptable for eventual consistency. Example: N=3, W=1, R=1 gives maximum availability and performance but allows stale reads.</p><p><strong>Sloppy quorums</strong>: During partitions, writes go to any W available nodes (not necessarily the designated replicas). Hinted handoff returns data to correct nodes when they recover. This provides availability at the cost of durability guarantees.</p><p><strong>Tuning trade-offs</strong>: High W (W=N) = durable writes, slow writes. High R (R=N) = always fresh reads, slow reads. W=1, R=N = fast writes, read-heavy. W=N, R=1 = write-heavy, fast reads.</p>",
      interviewTip: "Give concrete numbers: 'For a read-heavy system, I'd use N=3, W=2, R=2 for strong consistency, or N=3, W=1, R=1 for speed with eventual consistency.'",
      followUp: ["How does read-repair work in a quorum system?", "What is a sloppy quorum and when would you use it?"],
      seniorPerspective: "Quorum configuration should match your SLA. For payment processing: W=majority, R=majority. For social media timelines: W=1 (async replication), R=1 (accept staleness). Different data in the same system may need different quorum configs.",
      architectPerspective: "Quorum systems are the mechanism behind tunable consistency in Cassandra and DynamoDB. Understanding them lets you reason about per-table, per-query consistency without treating the database as a black box."
    },
    {
      question: "Explain how gossip protocols achieve failure detection in a large cluster. What is the phi accrual failure detector?",
      difficulty: "hard",
      answer: "<p><strong>Gossip-based failure detection (SWIM)</strong>: Each node periodically pings a random peer. If no ack within timeout, it asks K random nodes to ping the suspect (indirect probing). If indirect probes also fail, the node is marked suspicious, then dead after a configurable interval.</p><p><strong>Why not heartbeat to a central monitor?</strong> Central monitors are single points of failure and create O(N) connections. Gossip distributes the load: each node sends O(1) messages per period, total network load is O(N).</p><p><strong>Phi Accrual Failure Detector</strong>: Instead of binary alive/dead decisions, it computes a continuous suspicion level (phi = -log10(probability that node is alive given time since last heartbeat)). The distribution of inter-arrival times is maintained per node using a sliding window.</p><p>Application sets threshold: phi=1 means 10% chance of mistake, phi=8 means 0.000001% chance. Higher thresholds reduce false positives at the cost of slower detection. Used by Cassandra (default phi=8) and Akka Cluster.</p><p><strong>Advantage</strong>: Self-adapting. If network latency increases (different datacenter), the detector adjusts its distribution rather than making false accusations.</p>",
      interviewTip: "Contrast with fixed-timeout detectors: a 5-second timeout works for LAN but causes constant false positives across WAN. Phi accrual adapts to actual network conditions per-peer.",
      followUp: ["How does SWIM piggyback membership updates on ping messages?", "What is the difference between suspicion and confirmation in failure detection?"],
      seniorPerspective: "In production, tune the gossip interval (default 1s in Cassandra), the indirect probe count (K=3 typical), and the phi threshold. Monitor false-positive rates — network congestion can trigger cascading false detections.",
      architectPerspective: "Failure detection feeds into everything: rebalancing, leader election, client routing. False positives cause unnecessary data migration (expensive). False negatives leave requests going to dead nodes. The phi threshold is a business decision about acceptable downtime vs unnecessary churn."
    },
    {
      question: "When would you use a Bloom filter vs a hash set for membership testing in a distributed system?",
      difficulty: "medium",
      answer: "<p><strong>Use Bloom filter when</strong>:</p><ul><li>Memory is constrained: a Bloom filter uses ~10 bits per element (at 1% FP rate) vs 32-64+ bytes per element for a hash set</li><li>False positives are acceptable: 'might be in set' is OK for a first-pass filter before expensive disk/network lookup</li><li>The set is large and mostly queried for non-members: Bloom filters excel when most queries return 'not present' (true negatives are certain)</li></ul><p><strong>Use hash set when</strong>:</p><ul><li>You need exact membership (no false positives allowed)</li><li>You need to enumerate elements or delete them</li><li>Memory is not a constraint</li></ul><p><strong>Distributed system uses</strong>: Cassandra checks Bloom filters before reading SSTables — if the filter says 'no,' the key is definitely not in that file, saving a disk read. With 10 SSTables, this avoids 9 unnecessary reads per lookup on average.</p><p>A Bloom filter with 1% FP rate for 1 billion elements needs only ~1.2 GB of memory, while a hash set would need 32+ GB.</p>",
      interviewTip: "Quantify the space savings. Mention that Bloom filters are also used in distributed caches (avoid caching single-access items) and network routing (content-based routing in CDNs).",
      followUp: ["How would you choose the optimal number of hash functions for a Bloom filter?", "What are counting Bloom filters and when would you need them?"],
      seniorPerspective: "In production, Bloom filter false-positive rate should be tuned per SSTable size. Leveled compaction in Cassandra benefits more from Bloom filters than size-tiered compaction because it creates more SSTables.",
      architectPerspective: "Bloom filters are part of a broader pattern: probabilistic data structures trade accuracy for space/time. HyperLogLog (cardinality estimation), Count-Min Sketch (frequency estimation), and MinHash (similarity) follow the same philosophy."
    },
    {
      question: "Design a distributed lock service. What consistency guarantees do you need and how do you handle lock holder failure?",
      difficulty: "expert",
      answer: "<p><strong>Requirements</strong>: Mutual exclusion (at most one holder), deadlock freedom (lock eventually released), fault tolerance (works despite node failures).</p><p><strong>Implementation with Raft/consensus</strong>: The lock is a state in a replicated state machine. Acquire = propose 'lock(clientId, fenceToken)' to Raft. Release = propose 'unlock'. The linearizable log ensures at most one holder.</p><p><strong>Handling holder failure</strong>: Use <strong>leases with TTL</strong>. The lock auto-expires after T seconds. Holder must renew before expiry. If holder crashes, lock releases after TTL.</p><p><strong>Fencing tokens</strong>: Each lock acquisition gets a monotonically increasing token. The protected resource rejects operations with stale tokens. This prevents the 'zombie leader' problem (old holder's in-flight operations after lock expires).</p><p><strong>The Martin Kleppmann critique</strong>: GC pauses can cause a client to hold a lock past its TTL without knowing. Without fencing tokens, the resource has no way to reject stale operations. Redlock (Redis-based) doesn't provide fencing tokens — use ZooKeeper or etcd for safety-critical locks.</p>",
      interviewTip: "Reference the Kleppmann vs. Antirez debate about Redlock. The key insight: distributed locks need BOTH a lock service (coordination) AND fencing tokens (resource-side validation).",
      followUp: ["Explain the difference between Redlock and ZooKeeper-based locks in terms of safety guarantees.", "How do Google's Chubby lock service and etcd differ in their approach to distributed locking?"],
      seniorPerspective: "In practice, distinguish between efficiency locks (prevent duplicate work, Redlock is fine) and correctness locks (prevent data corruption, use consensus-based locks with fencing). Most teams over-engineer locks for the efficiency case.",
      architectPerspective: "Distributed locks are often a code smell indicating your architecture is fighting against distribution. Consider whether CRDTs, idempotent operations, or optimistic concurrency control could eliminate the need for coordination entirely."
    }
  ]
});
