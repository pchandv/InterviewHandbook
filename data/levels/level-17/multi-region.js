'use strict';

PageData.register('multi-region', {
    title: 'Multi-Region & Global Architecture',
    description: 'Designing systems that span multiple geographic regions for resilience, performance, and compliance',
    sections: [
        {
            title: 'Introduction',
            content: `<p>Multi-region architecture distributes application infrastructure across multiple geographic locations to achieve low latency for global users, high availability during regional outages, and compliance with data sovereignty regulations.</p>
<p>The fundamental challenge is the CAP theorem applied at scale: you cannot simultaneously guarantee consistency, availability, and partition tolerance across regions separated by hundreds of milliseconds of network latency. Every multi-region system makes explicit tradeoffs between these properties.</p>
<p>Key drivers for going multi-region include:</p>
<ul>
<li><strong>Latency reduction</strong> — Serving users from nearby regions (50ms vs 300ms round-trip)</li>
<li><strong>Disaster recovery</strong> — Surviving entire region failures without data loss</li>
<li><strong>Regulatory compliance</strong> — GDPR, data residency laws requiring data to stay in-country</li>
<li><strong>Business continuity</strong> — RPO/RTO targets that single-region cannot meet</li>
</ul>
<p>This topic covers the patterns, tradeoffs, and implementation strategies for building systems that operate reliably across geographic boundaries.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>Understanding multi-region architecture requires familiarity with several foundational concepts:</p>
<h4>Deployment Patterns</h4>
<ul>
<li><strong>Active-Active</strong> — All regions serve traffic simultaneously. Writes can occur in any region. Requires conflict resolution. Provides lowest latency and highest availability.</li>
<li><strong>Active-Passive</strong> — One primary region handles all writes; secondaries are read-only or on standby. Simpler consistency model but higher failover time.</li>
<li><strong>Active-Read (Follow-the-Sun)</strong> — Writes go to primary, reads served locally. A middle ground offering read latency benefits without write conflicts.</li>
</ul>
<h4>Replication Modes</h4>
<ul>
<li><strong>Synchronous</strong> — Write confirmed only after all replicas acknowledge. Strong consistency, but latency equals the slowest replica.</li>
<li><strong>Asynchronous</strong> — Write confirmed immediately at primary; replicas updated eventually. Low latency, but risk of data loss on primary failure.</li>
<li><strong>Semi-Synchronous</strong> — Write confirmed after at least one remote replica acknowledges. Balances durability with acceptable latency.</li>
</ul>
<h4>Consistency Models</h4>
<ul>
<li><strong>Strong consistency</strong> — All reads reflect the latest write (expensive across regions)</li>
<li><strong>Eventual consistency</strong> — Replicas converge over time (most practical for multi-region)</li>
<li><strong>Causal consistency</strong> — Operations that are causally related are seen in order</li>
<li><strong>Read-your-writes</strong> — A user always sees their own recent writes</li>
</ul>`
        },
        {
            title: 'How It Works',
            content: `<p>Setting up a multi-region architecture involves several coordinated steps:</p>
<h4>Step 1: Region Selection</h4>
<p>Choose regions based on user proximity, regulatory requirements, and cloud provider availability. Consider inter-region latency (typically 50-200ms between major cloud regions).</p>
<h4>Step 2: Data Tier Strategy</h4>
<p>Decide which data is global (replicated everywhere) vs. regional (stays in one region). User profile data might be global while session data stays local.</p>
<h4>Step 3: Traffic Routing</h4>
<p>Configure GeoDNS or global load balancers to route users to their nearest healthy region. Implement health checks that detect both infrastructure failures and application-level issues.</p>
<h4>Step 4: Replication Pipeline</h4>
<p>Set up data replication between regions. This includes choosing sync/async mode per data type, configuring conflict detection, and implementing reconciliation logic.</p>
<h4>Step 5: Failover Automation</h4>
<p>Define failover triggers (health check failures, latency thresholds, error rates), implement automated failover with manual override capability, and establish runbooks for split-brain recovery.</p>
<h4>Step 6: Observability</h4>
<p>Deploy cross-region monitoring that tracks replication lag, inter-region latency, conflict rates, and regional health independently. Alert on divergence between regions.</p>`
        },
        {
            title: 'Visual Diagram',
            content: `<p>The following diagram illustrates an active-active multi-region architecture with bidirectional replication, a global load balancer, and local databases in each region:</p>`,
            mermaid: `graph TB
    subgraph "Global Layer"
        GLB[Global Load Balancer<br/>GeoDNS + Anycast]
    end

    subgraph "Region A - US East"
        direction TB
        LBA[Regional LB]
        AppA1[App Server 1]
        AppA2[App Server 2]
        CacheA[Redis Cache]
        DBA[(Database<br/>Primary-Primary)]
        LBA --> AppA1
        LBA --> AppA2
        AppA1 --> CacheA
        AppA2 --> CacheA
        AppA1 --> DBA
        AppA2 --> DBA
    end

    subgraph "Region B - EU West"
        direction TB
        LBB[Regional LB]
        AppB1[App Server 1]
        AppB2[App Server 2]
        CacheB[Redis Cache]
        DBB[(Database<br/>Primary-Primary)]
        LBB --> AppB1
        LBB --> AppB2
        AppB1 --> CacheB
        AppB2 --> CacheB
        AppB1 --> DBB
        AppB2 --> DBB
    end

    GLB -->|US Users| LBA
    GLB -->|EU Users| LBB
    DBA <-->|Async Replication<br/>~100ms lag| DBB
    CacheA <-->|Cache Invalidation| CacheB`
        },
        {
            title: 'Implementation',
            content: `<p>Below are C# implementations demonstrating key multi-region patterns including region-aware routing, conflict resolution, and replication management.</p>
<h4>Region-Aware Service Router</h4>`,
            code: `// Region-aware request routing with failover
public class RegionRouter
{
    private readonly IReadOnlyList<RegionEndpoint> _regions;
    private readonly IHealthChecker _healthChecker;
    private readonly IGeoLocator _geoLocator;

    public RegionRouter(
        IReadOnlyList<RegionEndpoint> regions,
        IHealthChecker healthChecker,
        IGeoLocator geoLocator)
    {
        _regions = regions;
        _healthChecker = healthChecker;
        _geoLocator = geoLocator;
    }

    public async Task<RegionEndpoint> ResolveRegionAsync(
        string clientIp, CancellationToken ct)
    {
        var clientLocation = await _geoLocator.GetLocationAsync(clientIp, ct);

        // Sort regions by distance from client
        var sortedRegions = _regions
            .Select(r => new {
                Region = r,
                Distance = HaversineDistance(clientLocation, r.Location)
            })
            .OrderBy(x => x.Distance)
            .Select(x => x.Region)
            .ToList();

        // Return the nearest healthy region
        foreach (var region in sortedRegions)
        {
            var health = await _healthChecker.CheckAsync(region, ct);
            if (health.IsHealthy && health.Latency < region.LatencyBudgetMs)
            {
                return region;
            }
        }

        // All regions degraded — return nearest regardless
        return sortedRegions.First();
    }

    private double HaversineDistance(GeoCoord a, GeoCoord b)
    {
        const double R = 6371; // Earth radius in km
        var dLat = ToRad(b.Latitude - a.Latitude);
        var dLon = ToRad(b.Longitude - a.Longitude);
        var h = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRad(a.Latitude)) * Math.Cos(ToRad(b.Latitude)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(h), Math.Sqrt(1 - h));
    }

    private static double ToRad(double deg) => deg * Math.PI / 180;
}

public record RegionEndpoint(
    string Id,
    string Name,
    GeoCoord Location,
    string BaseUrl,
    int LatencyBudgetMs);

public record GeoCoord(double Latitude, double Longitude);`,
            language: 'csharp'
        },
        {
            title: 'Conflict Resolution',
            content: `<p>When multiple regions accept writes concurrently, conflicts are inevitable. The choice of resolution strategy depends on your data semantics.</p>
<h4>Strategy Comparison</h4>
<ul>
<li><strong>Last-Write-Wins (LWW)</strong> — Simplest. Uses timestamps to pick the latest write. Risk: clock skew can cause data loss. Good for: session data, caches, non-critical metadata.</li>
<li><strong>CRDTs (Conflict-free Replicated Data Types)</strong> — Mathematically guaranteed to converge without coordination. Good for: counters, sets, flags, collaborative editing.</li>
<li><strong>Vector Clocks</strong> — Track causal history of each write. Detect true conflicts (concurrent writes) vs. sequential updates. Good for: shopping carts, distributed state.</li>
<li><strong>Custom Merge Logic</strong> — Domain-specific resolution. Good for: financial data, inventory, anything requiring business rules.</li>
</ul>`,
            code: `// Conflict resolution framework with pluggable strategies
public interface IConflictResolver<T>
{
    T Resolve(ConflictingVersions<T> conflict);
}

public record ConflictingVersions<T>(
    VersionedValue<T> Local,
    VersionedValue<T> Remote,
    VersionedValue<T>? CommonAncestor);

public record VersionedValue<T>(
    T Value,
    VectorClock Clock,
    string OriginRegion,
    DateTimeOffset Timestamp);

// Last-Write-Wins resolver
public class LwwResolver<T> : IConflictResolver<T>
{
    public T Resolve(ConflictingVersions<T> conflict)
    {
        // Use timestamp with region ID as tiebreaker
        if (conflict.Local.Timestamp > conflict.Remote.Timestamp)
            return conflict.Local.Value;
        if (conflict.Remote.Timestamp > conflict.Local.Timestamp)
            return conflict.Remote.Value;

        // Timestamp tie — use deterministic region ordering
        return string.Compare(
            conflict.Local.OriginRegion,
            conflict.Remote.OriginRegion,
            StringComparison.Ordinal) > 0
                ? conflict.Local.Value
                : conflict.Remote.Value;
    }
}

// CRDT G-Counter (grow-only counter) for multi-region metrics
public class GCounter
{
    private readonly Dictionary<string, long> _counters = new();

    public void Increment(string regionId, long amount = 1)
    {
        if (!_counters.ContainsKey(regionId))
            _counters[regionId] = 0;
        _counters[regionId] += amount;
    }

    public long Value => _counters.Values.Sum();

    // Merge is commutative, associative, and idempotent
    public GCounter Merge(GCounter other)
    {
        var merged = new GCounter();
        var allKeys = _counters.Keys.Union(other._counters.Keys);
        foreach (var key in allKeys)
        {
            var local = _counters.GetValueOrDefault(key, 0);
            var remote = other._counters.GetValueOrDefault(key, 0);
            merged._counters[key] = Math.Max(local, remote);
        }
        return merged;
    }
}

// Custom merge for financial operations — never lose money
public class BalanceConflictResolver : IConflictResolver<AccountBalance>
{
    public AccountBalance Resolve(ConflictingVersions<AccountBalance> conflict)
    {
        var ancestor = conflict.CommonAncestor?.Value
            ?? new AccountBalance(0, Array.Empty<Transaction>());

        // Compute deltas from common ancestor
        var localDelta = conflict.Local.Value.Amount - ancestor.Amount;
        var remoteDelta = conflict.Remote.Value.Amount - ancestor.Amount;

        // Apply both deltas (additive merge)
        var mergedAmount = ancestor.Amount + localDelta + remoteDelta;

        // Merge transaction logs
        var mergedTransactions = conflict.Local.Value.Transactions
            .Union(conflict.Remote.Value.Transactions)
            .DistinctBy(t => t.Id)
            .OrderBy(t => t.Timestamp)
            .ToArray();

        return new AccountBalance(mergedAmount, mergedTransactions);
    }
}

public record AccountBalance(decimal Amount, Transaction[] Transactions);
public record Transaction(Guid Id, decimal Amount, DateTimeOffset Timestamp);`,
            language: 'csharp'
        },
        {
            title: 'Best Practices',
            content: `<p>Multi-region systems require disciplined engineering practices to maintain reliability across geographic boundaries.</p>
<h4>Latency Budgets</h4>
<ul>
<li><strong>Define per-operation budgets</strong> — User login: 200ms total. Product search: 100ms. Payment: 500ms. Break each budget into network, compute, and database allocations.</li>
<li><strong>Measure at the edge</strong> — Client-perceived latency, not server-side processing time. Include DNS, TLS handshake, and serialization overhead.</li>
<li><strong>Budget for the P99</strong> — Design for the 99th percentile latency, not the average. Tail latencies dominate user experience.</li>
</ul>
<h4>Data Locality</h4>
<ul>
<li><strong>Shard by region</strong> — Route user data to their home region. Cross-region reads are acceptable; cross-region writes should be rare.</li>
<li><strong>Cache aggressively at the edge</strong> — Use regional caches for read-heavy data. Invalidate via async events rather than synchronous purges.</li>
<li><strong>Accept eventual consistency where possible</strong> — Only require strong consistency for operations that truly need it (payments, inventory decrements).</li>
</ul>
<h4>Operational Excellence</h4>
<ul>
<li><strong>Test failovers regularly</strong> — Run chaos engineering exercises that simulate full region failures monthly.</li>
<li><strong>Deploy progressively</strong> — Roll out changes one region at a time with automated rollback on error rate spikes.</li>
<li><strong>Monitor replication lag</strong> — Alert when lag exceeds your RPO. Track lag as a business metric, not just infrastructure.</li>
<li><strong>Automate everything</strong> — Manual failover procedures become stale. Automated failover with human override is the gold standard.</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<p>Multi-region architectures have failure modes that are subtle and often only discovered during actual incidents.</p>
<h4>Split-Brain</h4>
<p>When regions lose connectivity and both believe they are the primary, accepting conflicting writes independently. Prevention requires quorum-based decisions and fencing tokens.</p>
<ul>
<li><strong>Fencing tokens</strong> — Monotonically increasing tokens that invalidate stale leaders. Any write with an old token is rejected.</li>
<li><strong>Quorum requirement</strong> — A region can only accept writes if it can reach a majority of the cluster. Prevents two minorities from both claiming leadership.</li>
</ul>
<h4>Replication Lag Assumptions</h4>
<p>Developers often assume replication is near-instant. In reality:</p>
<ul>
<li>Normal inter-region replication: 50-200ms</li>
<li>Under load or network degradation: 1-30 seconds</li>
<li>During failover events: potentially minutes of lag</li>
</ul>
<p>Design read paths to tolerate stale data or explicitly route to the write region when freshness is required.</p>
<h4>Clock Synchronization</h4>
<p>Using wall-clock timestamps for ordering in distributed systems is unreliable. NTP drift between regions can be 10-100ms. Use logical clocks (Lamport timestamps, vector clocks) or TrueTime-style bounded uncertainty intervals for ordering guarantees.</p>
<h4>Cascading Failures</h4>
<p>A regional failover doubles traffic to surviving regions. If those regions are already at 60% capacity, the failover causes them to overload and fail too. Always maintain enough headroom (recommend running at max 40% capacity in each region).</p>`
        },
        {
            title: 'Data Sovereignty',
            content: `<p>Global architectures must comply with data residency laws that restrict where personal data can be stored and processed.</p>
<h4>Key Regulations</h4>
<ul>
<li><strong>GDPR (EU)</strong> — Personal data of EU residents can only be transferred outside the EU with adequate protections (Standard Contractual Clauses, adequacy decisions).</li>
<li><strong>LGPD (Brazil)</strong> — Similar to GDPR with requirements for data to remain in Brazil for certain categories.</li>
<li><strong>PIPL (China)</strong> — Strict data localization for critical information infrastructure operators.</li>
<li><strong>State-level (US)</strong> — CCPA, state gambling regulations, healthcare (HIPAA) all impose locality constraints.</li>
</ul>
<h4>Architecture Patterns for Compliance</h4>`,
            code: `// Region-aware data routing that enforces sovereignty rules
public class SovereignDataRouter
{
    private readonly Dictionary<string, DataResidencyPolicy> _policies;

    public SovereignDataRouter(IOptions<SovereigntyConfig> config)
    {
        _policies = config.Value.Policies
            .ToDictionary(p => p.Jurisdiction);
    }

    public string ResolveStorageRegion(UserContext user, DataCategory category)
    {
        var jurisdiction = DetermineJurisdiction(user);
        var policy = _policies.GetValueOrDefault(jurisdiction)
            ?? _policies["default"];

        // Some data categories MUST stay in-jurisdiction
        if (policy.RestrictedCategories.Contains(category))
        {
            return policy.PrimaryRegion;
        }

        // Non-restricted data can be replicated globally
        return user.PreferredRegion ?? policy.PrimaryRegion;
    }

    public bool CanReplicateTo(
        string sourceRegion, string targetRegion, DataCategory category)
    {
        var sourcePolicy = _policies.Values
            .First(p => p.PrimaryRegion == sourceRegion);

        // Check if cross-border transfer is allowed
        if (sourcePolicy.RestrictedCategories.Contains(category))
        {
            return sourcePolicy.AllowedReplicationTargets.Contains(targetRegion);
        }

        return true; // Non-restricted data replicates freely
    }

    private string DetermineJurisdiction(UserContext user)
    {
        // Jurisdiction based on user's country of residence, not current location
        return user.CountryOfResidence switch
        {
            var c when EuCountries.Contains(c) => "EU",
            "BR" => "BRAZIL",
            "CN" => "CHINA",
            _ => "default"
        };
    }

    private static readonly HashSet<string> EuCountries = new()
    {
        "DE", "FR", "IT", "ES", "NL", "BE", "AT", "IE", "FI", "PT",
        "GR", "SE", "DK", "PL", "CZ", "RO", "HU", "SK", "BG", "HR"
        // ... all 27 EU member states
    };
}

public enum DataCategory
{
    PersonalIdentifiable,
    FinancialTransaction,
    HealthRecord,
    BehavioralAnalytics,
    AggregatedMetrics,    // Usually not restricted
    SystemLogs            // Usually not restricted
}`,
            language: 'csharp'
        },
        {
            title: 'Conflict Resolution Decision Tree',
            content: `<p>Use this decision tree to select the appropriate conflict resolution strategy based on your data characteristics and consistency requirements:</p>`,
            mermaid: `graph TD
    Start[Data written in multiple regions?] -->|Yes| Q1{Can you tolerate<br/>occasional data loss?}
    Start -->|No| Single[Use Active-Passive<br/>No conflict resolution needed]

    Q1 -->|Yes| Q2{Is data a counter<br/>or set operation?}
    Q1 -->|No| Q3{Is there a natural<br/>ordering to writes?}

    Q2 -->|Yes| CRDT[Use CRDTs<br/>G-Counter, OR-Set, LWW-Register]
    Q2 -->|No| LWW[Use Last-Write-Wins<br/>with hybrid logical clocks]

    Q3 -->|Yes| Q4{Can you identify<br/>a common ancestor?}
    Q3 -->|No| Custom[Use Custom Merge Logic<br/>Domain-specific rules]

    Q4 -->|Yes| ThreeWay[Three-Way Merge<br/>Git-style diff + patch]
    Q4 -->|No| Vector[Use Vector Clocks<br/>Detect true conflicts]

    Custom --> Validate{Merge result<br/>passes invariants?}
    Validate -->|Yes| Accept[Accept merged result]
    Validate -->|No| Escalate[Escalate to user<br/>or queue for review]

    style CRDT fill:#2d6a4f,color:#fff
    style LWW fill:#40916c,color:#fff
    style ThreeWay fill:#52b788,color:#fff
    style Vector fill:#74c69d,color:#000
    style Custom fill:#d4a373,color:#000
    style Escalate fill:#e63946,color:#fff`
        },
        {
            title: 'Interview Tips',
            content: `<p>Multi-region architecture is a favorite topic for senior and architect-level interviews because it tests systems thinking, tradeoff analysis, and real-world operational experience.</p>`,
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>Tradeoff articulation</strong> — Never present a solution without discussing what you give up. "We chose eventual consistency for read latency, accepting a 2-second window where users might see stale data."</li>
<li><strong>Failure mode thinking</strong> — Go beyond happy path. What happens during a network partition? During a region failover? When replication lag spikes?</li>
<li><strong>Numbers and budgets</strong> — Know typical latencies: same-region ~1ms, cross-region 50-200ms, cross-continent 100-300ms. Use these to justify your design decisions.</li>
<li><strong>Operational maturity</strong> — Discuss monitoring, alerting, runbooks, and chaos testing. Building it is 30% of the work; operating it is 70%.</li>
<li><strong>Progressive complexity</strong> — Start simple (active-passive) and explain when/why you'd move to active-active. Don't jump to the most complex solution first.</li>
<li><strong>Data classification</strong> — Not all data needs the same treatment. Show you can categorize data by consistency requirements and apply appropriate strategies.</li>
</ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li><strong>Start with active-passive</strong> — Only move to active-active when you have a proven need and the engineering maturity to handle conflicts.</li>
<li><strong>Latency budgets drive architecture</strong> — Define your latency budget first, then design the system to fit within it.</li>
<li><strong>Conflict resolution is a business decision</strong> — The right strategy depends on your domain semantics, not just technical preferences.</li>
<li><strong>CRDTs eliminate coordination</strong> — For counters, sets, and flags, CRDTs provide convergence without conflict resolution logic.</li>
<li><strong>Split-brain is the hardest problem</strong> — Use fencing tokens and quorum-based decisions. Never allow two regions to both act as primary.</li>
<li><strong>Data sovereignty is non-negotiable</strong> — Architect for regulatory compliance from day one. Retrofitting data locality is extremely expensive.</li>
<li><strong>Test your failover</strong> — An untested failover is not a failover, it is a hope. Run game days monthly.</li>
<li><strong>Plan for 3x capacity</strong> — If you have 3 regions, each should handle full load independently. You will lose a region eventually.</li>
<li><strong>Monitor replication lag as a business metric</strong> — Lag directly impacts user experience and data consistency guarantees.</li>
<li><strong>Eventual consistency is the default</strong> — Only pay the cost of strong consistency where business logic absolutely requires it.</li>
</ul>`
        }
    ],
    questions: [
        {
            id: 'mr-q1',
            level: 'junior',
            title: 'What is the difference between active-active and active-passive multi-region deployment?',
            answer: `<p><strong>Active-Passive</strong> means one region (the primary) handles all traffic while the other region(s) sit idle as standby. If the primary fails, traffic is redirected to the passive region. This is simpler because there are no write conflicts — only one region ever processes writes at a time. The downside is wasted resources (standby infrastructure) and longer failover times (seconds to minutes).</p>
<p><strong>Active-Active</strong> means all regions simultaneously serve traffic including writes. Users connect to their nearest region for lowest latency. The major challenge is conflict resolution — when two users modify the same data in different regions simultaneously, the system must decide which version wins or how to merge them.</p>
<p>Active-passive is appropriate when simplicity and strong consistency are priorities. Active-active is needed when you require sub-100ms latency globally and cannot tolerate any region being a single point of failure for writes.</p>`
        },
        {
            id: 'mr-q2',
            level: 'junior',
            title: 'What is replication lag and why does it matter?',
            answer: `<p>Replication lag is the time delay between when data is written to the primary database and when that write appears in replica databases in other regions. In a multi-region setup, this lag typically ranges from 50ms to several seconds depending on network conditions, write volume, and replication mode.</p>
<p>Replication lag matters because it creates a window where different regions have different views of the data. Consider an e-commerce scenario: a user in the US buys the last item in stock. If the EU replica has 200ms of lag, a user in Europe might still see the item as available and attempt to purchase it during that 200ms window.</p>
<p>Strategies to handle replication lag include:</p>
<ul>
<li>Read-your-writes consistency: route a user's reads to the region where they wrote</li>
<li>Displaying "eventual" indicators in the UI for data that might be slightly stale</li>
<li>Using synchronous replication for critical data (at the cost of higher write latency)</li>
<li>Implementing application-level checks that validate freshness before critical operations</li>
</ul>`
        },
        {
            id: 'mr-q3',
            level: 'mid',
            title: 'What is a latency budget and how do you design within one?',
            answer: `<p>A latency budget is the maximum acceptable end-to-end response time for a specific operation, broken down into allocations for each component in the request path. For example, a 200ms total budget for a product search might be allocated as:</p>
<ul>
<li>DNS resolution: 5ms</li>
<li>TLS handshake: 15ms (amortized with connection pooling)</li>
<li>Network transit to edge: 20ms</li>
<li>Load balancer: 2ms</li>
<li>Application processing: 30ms</li>
<li>Database query: 50ms</li>
<li>Network transit back: 20ms</li>
<li>Serialization/deserialization: 8ms</li>
<li>Buffer/headroom: 50ms</li>
</ul>
<p>To design within a latency budget, you first identify the operation's total acceptable latency (derived from UX research or SLA requirements). Then you subtract fixed costs like network transit and TLS. The remaining budget constrains your architecture: if your database is in another region (100ms round-trip), you cannot meet a 200ms budget with a synchronous cross-region read — you must use a local replica or cache.</p>
<p>Latency budgets force explicit tradeoff conversations: "We can have strong consistency OR meet our 100ms budget, but not both for this operation."</p>`
        },
        {
            id: 'mr-q4',
            level: 'mid',
            title: 'How does GeoDNS work for global traffic management?',
            answer: `<p>GeoDNS (Geographic DNS) returns different IP addresses based on the geographic location of the DNS resolver making the request. When a user in Germany queries your domain, GeoDNS returns the IP of your EU-West region. A user in California gets the IP of your US-West region.</p>
<p>The resolution process works as follows:</p>
<ol>
<li>User's device queries a recursive DNS resolver (usually their ISP's or a public resolver like 8.8.8.8)</li>
<li>The resolver queries your authoritative DNS server</li>
<li>Your GeoDNS server identifies the resolver's IP location using a GeoIP database</li>
<li>It returns the IP address of the nearest healthy region</li>
<li>The user connects directly to that regional endpoint</li>
</ol>
<p>Limitations of GeoDNS include: DNS caching means failover is limited by TTL values (typically 30-60 seconds minimum), the resolver's location may not match the user's location (corporate VPNs, public resolvers), and it cannot react to real-time load imbalances. For finer-grained control, combine GeoDNS with anycast routing or global load balancers that operate at L4/L7.</p>`
        },
        {
            id: 'mr-q5',
            level: 'mid',
            title: 'What are CRDTs and when would you use them in a multi-region system?',
            answer: `<p>CRDTs (Conflict-free Replicated Data Types) are data structures that can be replicated across multiple nodes and updated independently without coordination, with a mathematical guarantee that all replicas will converge to the same state. They achieve this by constraining operations to be commutative, associative, and idempotent.</p>
<p>Common CRDT types include:</p>
<ul>
<li><strong>G-Counter</strong> — Grow-only counter. Each node tracks its own count; total is the sum. Perfect for page views, API call counts.</li>
<li><strong>PN-Counter</strong> — Positive-negative counter. Two G-Counters (one for increments, one for decrements). Good for inventory quantities, like/dislike counts.</li>
<li><strong>OR-Set (Observed-Remove Set)</strong> — Add and remove elements without conflicts. Each element has a unique tag. Good for shopping carts, user permission sets.</li>
<li><strong>LWW-Register</strong> — Last-write-wins register using timestamps. Simple but relies on clock accuracy.</li>
</ul>
<p>Use CRDTs when: you need eventual consistency without custom merge logic, the data naturally fits a supported type (counters, sets, maps), and you can tolerate the space overhead (CRDTs track metadata for convergence). Avoid CRDTs for complex domain objects that require business-rule-based merging.</p>`
        },
        {
            id: 'mr-q6',
            level: 'senior',
            title: 'How do you handle conflicts in geo-replicated data?',
            answer: `<p>Handling conflicts in geo-replicated data requires a layered approach that matches resolution strategies to data semantics:</p>
<p><strong>1. Conflict Avoidance (preferred)</strong> — Partition data by region so each record has a "home region" that owns writes. Other regions have read replicas. This eliminates conflicts for region-affine data like user profiles.</p>
<p><strong>2. Automatic Resolution</strong> — For data that must accept writes in any region:</p>
<ul>
<li><strong>CRDTs</strong> for counters, sets, and flags — mathematically guaranteed convergence</li>
<li><strong>Last-Write-Wins</strong> with hybrid logical clocks for simple key-value data where losing a concurrent write is acceptable</li>
<li><strong>Three-way merge</strong> when you have a common ancestor — compare local diff and remote diff, auto-merge non-overlapping changes</li>
</ul>
<p><strong>3. Domain-Specific Merge</strong> — For critical business data (financial transactions, inventory), implement custom merge logic that understands business invariants. Example: for a bank balance, apply both deltas from the common ancestor rather than picking one version.</p>
<p><strong>4. Conflict Escalation</strong> — When automatic resolution cannot guarantee correctness, queue the conflict for manual review or user resolution. This is the last resort but necessary for scenarios like conflicting edits to legal documents.</p>
<p>Key implementation details: use vector clocks (not wall clocks) for causality tracking, store conflict metadata for audit trails, and always validate merged results against business invariants before committing.</p>`,
            seniorPerspective: `<p>In production, I've found that 90% of conflicts can be avoided through careful data partitioning and routing writes to home regions. The remaining 10% require explicit conflict resolution, and the strategy must be chosen per data type — not one strategy for the entire system. The most dangerous pattern is assuming LWW is "good enough" for everything; it works until you silently lose a financial transaction during a network partition.</p>`
        },
        {
            id: 'mr-q7',
            level: 'senior',
            title: 'How do you handle data sovereignty requirements in a multi-region architecture?',
            answer: `<p>Data sovereignty requires architectural controls that guarantee personal data remains within the jurisdictions mandated by law. This is not just a policy — it must be enforced technically:</p>
<p><strong>Data Classification</strong> — Categorize all data fields by sensitivity and applicable regulations. PII (name, email, address) typically has the strictest residency requirements. Aggregated metrics and system logs usually have no restrictions.</p>
<p><strong>Region-Affine Storage</strong> — Assign each user a "home region" based on their country of residence (not current location). All their PII is stored exclusively in that region's database. The user's home region is the single source of truth for their personal data.</p>
<p><strong>Selective Replication</strong> — Replicate only non-sensitive data globally. User preferences, anonymized analytics, and system state can be replicated freely. PII stays pinned to the home region.</p>
<p><strong>Cross-Border Access Patterns</strong> — When a service in Region B needs to access a user's PII stored in Region A, it makes a synchronous cross-region call rather than reading a local replica. This is slower but maintains compliance.</p>
<p><strong>Technical Enforcement</strong> — Implement data sovereignty at the infrastructure level: encryption keys managed per-region (a region's data cannot be decrypted by another region's keys), network policies preventing PII data from traversing regional boundaries, and automated compliance scanning that detects sovereignty violations.</p>
<p><strong>Right to Erasure</strong> — GDPR's "right to be forgotten" is simpler when data is concentrated in one region rather than scattered across global replicas.</p>`
        },
        {
            id: 'mr-q8',
            level: 'senior',
            title: 'How do you prevent split-brain in a multi-region active-active system?',
            answer: `<p>Split-brain occurs when a network partition causes multiple regions to independently believe they are the authoritative primary, accepting conflicting writes without coordination. Prevention requires a combination of techniques:</p>
<p><strong>Fencing Tokens</strong> — Every primary election generates a monotonically increasing fencing token. All writes include this token. Storage nodes reject writes with tokens older than the latest they have seen. Even if an old primary doesn't know it's been deposed, its writes are rejected because its token is stale.</p>
<p><strong>Quorum-Based Leadership</strong> — A region can only act as primary if it maintains connectivity to a majority of nodes (quorum). In a 3-region setup, a partition isolating one region means that region loses quorum and must stop accepting writes. The two connected regions maintain quorum and continue operating.</p>
<p><strong>External Witness</strong> — Deploy a lightweight witness node in a third location (e.g., a cloud function that participates in leader election but doesn't store data). This breaks ties in 2-region setups where neither has a majority alone.</p>
<p><strong>Lease-Based Leadership</strong> — The primary holds a time-limited lease that must be renewed periodically. If a partition prevents renewal, the lease expires and the region voluntarily stops accepting writes. The lease duration represents your maximum split-brain window.</p>
<p>In practice, combine these: quorum for leader election, fencing tokens for write validation, and leases as a safety net. Accept that during a true partition, availability in the minority partition must be sacrificed to prevent inconsistency.</p>`,
            seniorPerspective: `<p>The hardest part of split-brain prevention is not the algorithm — it's convincing product teams that reduced availability during partitions is the correct behavior. I always frame it as: "Would you rather have 30 seconds of read-only mode, or discover tomorrow that two customers were both charged for the same inventory item?" Frame split-brain as a business risk, not a technical curiosity.</p>`
        },
        {
            id: 'mr-q9',
            level: 'lead',
            title: 'How do you design a progressive rollout strategy for multi-region deployments?',
            answer: `<p>Progressive rollout in multi-region environments requires treating each region as a deployment stage with automated promotion and rollback gates:</p>
<p><strong>Stage 1: Canary Region</strong> — Deploy to a single low-traffic region (e.g., a staging region or your smallest production region). Monitor error rates, latency percentiles, and business metrics for 30-60 minutes. Automated rollback if error rate exceeds baseline by 0.1%.</p>
<p><strong>Stage 2: Regional Ring</strong> — Promote to 2-3 regions representing different geographies and traffic patterns. Run for 2-4 hours. This catches issues related to data distribution, regional user behavior differences, and cross-region interaction patterns.</p>
<p><strong>Stage 3: Full Deployment</strong> — Roll out to remaining regions one at a time with 15-minute gaps. Each region has its own health gate before proceeding to the next.</p>
<p><strong>Key Design Decisions:</strong></p>
<ul>
<li><strong>Feature flags over code deploys</strong> — Separate deployment (infrastructure change) from release (feature activation). Deploy code everywhere, then activate features progressively via flags.</li>
<li><strong>Database migrations must be backward-compatible</strong> — Old code and new code run simultaneously during rollout. Schema changes must work with both versions.</li>
<li><strong>Sticky sessions during rollout</strong> — A user who starts on the new version stays on the new version. Mixing versions mid-session causes subtle bugs.</li>
<li><strong>Automated rollback criteria</strong> — Define specific signals: P99 latency > 2x baseline, error rate > 0.5%, replication lag > 5s, or business metric decline > 2%.</li>
</ul>
<p>The goal is blast radius containment: a bad deploy affects at most one region for at most one hour before automated systems intervene.</p>`
        },
        {
            id: 'mr-q10',
            level: 'lead',
            title: 'How do you implement a global rate limiter that works across regions?',
            answer: `<p>Global rate limiting across regions is challenging because strict global state requires cross-region coordination that adds latency. The solution depends on your accuracy requirements:</p>
<p><strong>Approach 1: Local Rate Limiting with Global Quotas</strong> — Divide the global rate limit equally among regions. If the global limit is 10,000 req/s across 5 regions, each region enforces 2,000 req/s locally. Simple but inefficient when traffic distribution is uneven.</p>
<p><strong>Approach 2: Token Bucket with Async Sync</strong> — Each region maintains a local token bucket. Regions periodically sync their consumption to a global counter (every 1-5 seconds). This allows temporary over-limit (bounded by sync interval × per-region rate) but avoids cross-region latency on every request.</p>
<p><strong>Approach 3: CRDT-Based Counter</strong> — Use a PN-Counter CRDT to track consumption. Each region increments its local counter and merges periodically. The global count converges eventually. Allows temporary over-limit but provides good accuracy within seconds.</p>
<p><strong>Approach 4: Central Coordinator (for strict limits)</strong> — A single region owns the rate limit state. All other regions check in before allowing requests above their local quota. This adds cross-region latency but provides exact enforcement. Reserve for scenarios where over-limit has severe consequences (billing, compliance).</p>
<p>In practice, use a hybrid: strict central coordination for critical limits (API billing, abuse prevention) and relaxed local-first limiting for general traffic shaping. Accept that global rate limits will be approximate by the replication lag window.</p>`
        },
        {
            id: 'mr-q11',
            level: 'lead',
            title: 'What metrics and monitoring do you implement for a multi-region system?',
            answer: `<p>Multi-region monitoring must capture both per-region health and cross-region relationship health. Key metric categories:</p>
<p><strong>Replication Metrics</strong></p>
<ul>
<li>Replication lag (seconds behind primary) — alert at 80% of RPO</li>
<li>Replication throughput (bytes/second) — detect bottlenecks</li>
<li>Conflict rate (conflicts/second per region pair) — rising conflicts indicate design issues</li>
<li>Failed replications — any failure is critical, alert immediately</li>
</ul>
<p><strong>Regional Health</strong></p>
<ul>
<li>Per-region error rate (baseline comparison, not absolute threshold)</li>
<li>Per-region P50/P95/P99 latency (compare against region-specific baselines)</li>
<li>Regional capacity utilization (alert at 60% — must handle failover traffic)</li>
<li>Regional request routing ratio (detect GeoDNS misrouting)</li>
</ul>
<p><strong>Cross-Region Metrics</strong></p>
<ul>
<li>Inter-region latency (synthetic probes every 10 seconds)</li>
<li>Cross-region request volume (should be minimal in a well-partitioned system)</li>
<li>Failover readiness score (last successful failover test, data freshness in passive region)</li>
</ul>
<p><strong>Business Metrics Per Region</strong></p>
<ul>
<li>Conversion rate, transaction volume, user engagement — detect if a region is serving degraded experiences</li>
<li>Data freshness SLA compliance — what percentage of reads returned data within the freshness guarantee</li>
</ul>
<p>Critical: monitoring itself must be multi-region. If your monitoring is single-region, a regional outage blinds you. Deploy independent monitoring stacks per region with a global aggregation layer.</p>`
        },
        {
            id: 'mr-q12',
            level: 'architect',
            title: 'Design an active-active architecture for a payment system that processes transactions globally.',
            answer: `<p>Designing active-active payments is one of the hardest distributed systems problems because financial transactions have zero tolerance for data loss and strict consistency requirements. Here is a production-viable architecture:</p>
<p><strong>Architecture Overview</strong></p>
<p>Deploy in 3 regions (US, EU, APAC). Each region has full compute and storage. The key insight: partition transaction ownership by user home region, but allow any region to initiate transactions.</p>
<p><strong>Transaction Ownership Model</strong></p>
<p>Each user account has a designated "home region" based on their primary currency/jurisdiction. The home region is the source of truth for their balance. This is the critical design decision that avoids dual-spending.</p>
<p><strong>Write Path (Payment Processing)</strong></p>
<ol>
<li>User initiates payment in their nearest region (Region A)</li>
<li>If Region A is the user's home region: process locally with synchronous commit</li>
<li>If Region A is NOT the home region: forward the transaction to the home region (Region B) synchronously. Region A acts as a proxy.</li>
<li>Home region validates balance, applies the debit, writes to local DB with synchronous replication to at least one other region (semi-sync)</li>
<li>Return confirmation to the user via the originating region</li>
</ol>
<p><strong>Failover Handling</strong></p>
<p>If the home region is unreachable, transactions for users homed in that region are queued with a timeout. They are NOT processed in another region (this would create dual-spend risk). The user sees a "processing" state. When the home region recovers, the queue drains.</p>
<p>For time-critical payments (e.g., point-of-sale), implement a "pre-authorized reserve" pattern: pre-allocate a spending limit to each region. The non-home region can authorize up to the reserved amount without contacting home. Reconcile reserves periodically.</p>
<p><strong>Conflict Prevention</strong></p>
<p>This design avoids conflicts by construction: only one region ever modifies a given account balance. Cross-region traffic exists but is read-heavy (balance checks, transaction history) with writes always routed to the home region.</p>
<p><strong>Disaster Recovery</strong></p>
<p>If a home region fails permanently, initiate a controlled failover: promote a replica region to home for affected users, replay any pending transactions from the queue, and verify balances against the last consistent snapshot. This process takes minutes, not milliseconds — and that is acceptable for the safety guarantee it provides.</p>`,
            architectPerspective: `<p>The critical insight that makes active-active payments viable is that "active-active for reads, active-passive for writes per account" gives you the latency benefits of active-active without the consistency nightmares. Every architect I've seen struggle with this problem was trying to make writes truly active-active, which requires solving consensus for every transaction — possible with Spanner/CockroachDB but at enormous cost and complexity. The partitioned-ownership model achieves 95% of the benefit at 20% of the complexity. The remaining trade-off (cross-region write latency for users far from their home region) is typically 100-200ms — imperceptible for payment flows where users expect a brief processing moment.</p>`
        },
        {
            id: 'mr-q13',
            level: 'architect',
            title: 'How would you migrate a single-region system to multi-region without downtime?',
            answer: `<p>Migrating to multi-region without downtime requires a phased approach that never puts the system in an inconsistent state:</p>
<p><strong>Phase 1: Foundation (weeks 1-4)</strong></p>
<ul>
<li>Deploy infrastructure in the target region (compute, databases, caches)</li>
<li>Set up asynchronous replication from primary to new region</li>
<li>Validate data integrity with continuous comparison jobs</li>
<li>Deploy the application stack in the new region but do NOT route traffic to it</li>
</ul>
<p><strong>Phase 2: Read Traffic (weeks 5-8)</strong></p>
<ul>
<li>Route 5% of read traffic to the new region via weighted DNS</li>
<li>Compare response correctness against the primary (shadow validation)</li>
<li>Gradually increase to 50%, then 100% of regional read traffic</li>
<li>Monitor replication lag impact on read consistency</li>
</ul>
<p><strong>Phase 3: Write Preparation (weeks 9-12)</strong></p>
<ul>
<li>Implement region-aware routing in the application layer</li>
<li>Add data partitioning logic (assign users to home regions)</li>
<li>Deploy conflict detection and resolution infrastructure</li>
<li>Switch replication to semi-synchronous for the active partition</li>
</ul>
<p><strong>Phase 4: Write Migration (weeks 13-16)</strong></p>
<ul>
<li>Migrate 1% of users to have the new region as their home (low-risk users first)</li>
<li>Validate all writes in the new region against business invariants</li>
<li>Gradually increase user migration (10%, 25%, 50%, 100% of target users)</li>
<li>Each batch has a 48-hour bake period before proceeding</li>
</ul>
<p><strong>Phase 5: Cutover Completion (weeks 17-20)</strong></p>
<ul>
<li>Enable full active-active operation</li>
<li>Decommission the single-region-specific routing paths</li>
<li>Run chaos testing (simulate region failure) in production</li>
<li>Document runbooks and train operations team</li>
</ul>
<p>Key principle: at every phase, you can roll back to the previous phase within minutes. Never burn bridges — keep the old path working until the new path has been validated for weeks.</p>`,
            architectPerspective: `<p>The biggest mistake I see in single-to-multi-region migrations is trying to do it as a "big bang" project. The successful migrations I've led all followed the same pattern: make the system multi-region-ready while still running single-region, then activate regions one at a time. The application changes (region-aware routing, conflict resolution, data partitioning) should be deployed and running in production for weeks before you actually route traffic to a second region. This separates "code correctness" from "infrastructure correctness" — if something breaks, you know exactly which layer caused it.</p>`
        },
        {
            id: 'mr-q14',
            level: 'architect',
            title: 'How do you design a system that maintains causal consistency across regions?',
            answer: `<p>Causal consistency guarantees that operations which are causally related are seen in the same order by all regions, while allowing concurrent (unrelated) operations to be seen in different orders. This is stronger than eventual consistency but weaker (and cheaper) than strong consistency.</p>
<p><strong>Mechanism: Hybrid Logical Clocks (HLC)</strong></p>
<p>Combine physical timestamps with logical counters. Each event gets an HLC timestamp that captures both wall-clock time and causal ordering. When event B is caused by event A, B's HLC is guaranteed to be higher than A's regardless of clock skew between regions.</p>
<p><strong>Implementation Architecture:</strong></p>
<ol>
<li><strong>Client-side tracking</strong> — Each client maintains the highest HLC timestamp it has seen. It includes this in every request as a "causal dependency."</li>
<li><strong>Server-side validation</strong> — Before returning a read result, the server checks that its local state includes all events up to the client's dependency timestamp. If not, it either waits for replication to catch up or routes to a region that has the data.</li>
<li><strong>Replication ordering</strong> — Events are replicated with their HLC timestamps. The receiving region applies them in HLC order, ensuring causal chains are preserved.</li>
</ol>
<p><strong>Trade-offs:</strong></p>
<ul>
<li>Reads may block briefly waiting for replication (typically < 100ms)</li>
<li>Cross-region reads that depend on recent local writes must wait for propagation</li>
<li>Metadata overhead: each record carries a vector clock or HLC stamp</li>
<li>Garbage collection of causal metadata requires coordination</li>
</ul>
<p>Causal consistency is ideal for social feeds, collaborative editing, and messaging — where users expect to see their own actions and their consequences in order, but don't need global total ordering of unrelated events.</p>`,
            architectPerspective: `<p>Causal consistency is the sweet spot for most multi-region applications. It gives users the intuitive guarantee they expect (I see my own writes, and effects follow causes) without the latency cost of linearizability. The implementation complexity is moderate — hybrid logical clocks are well-understood and libraries exist for most languages. The hardest part is identifying causal boundaries: which operations are truly causally dependent vs. merely temporally close? Getting this wrong either under-constrains (users see confusing orderings) or over-constrains (unnecessary blocking waits on replication).</p>`
        }
    ]
});
