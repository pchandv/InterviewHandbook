/* ═══════════════════════════════════════════════════════════════════
   System Design — Design Uber
   Ride matching, geolocation, real-time tracking, pricing,
   ETA computation, surge pricing, and dispatch at scale.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('sd-uber', {
    title: 'Design Uber',
    description: 'System design for a ride-hailing platform — rider-driver matching, real-time location tracking, ETA computation, dynamic pricing, trip lifecycle management, and geospatial indexing at scale.',
    sections: [
        {
            title: 'Requirements & Scale',
            content: `<h4>Functional Requirements</h4>
            <ul>
                <li>Riders request rides specifying pickup and destination</li>
                <li>System matches rider with nearest available driver</li>
                <li>Real-time location tracking during trip (driver → rider → server)</li>
                <li>ETA computation for pickup and trip duration</li>
                <li>Dynamic/surge pricing based on supply-demand</li>
                <li>Trip lifecycle: request → match → pickup → in-progress → complete → payment</li>
                <li>Driver availability management (online/offline/on-trip)</li>
                <li>Trip history and receipts</li>
            </ul>
            <h4>Non-Functional Requirements</h4>
            <ul>
                <li>Scale: 20M rides/day, 5M concurrent drivers, 100M registered users</li>
                <li>Latency: Match within 10 seconds, location updates every 3-5 seconds</li>
                <li>Availability: 99.99% — downtime loses revenue and trust</li>
                <li>Consistency: Trip state must be strongly consistent (no double-dispatch)</li>
            </ul>
            <h4>Capacity Estimation</h4>
            <ul>
                <li>20M rides/day = ~230 rides/second average, 1000/sec peak</li>
                <li>5M active drivers sending location every 4s = 1.25M location updates/second</li>
                <li>Each update: ~100 bytes (lat, lng, timestamp, driverId, heading, speed)</li>
                <li>Location ingestion bandwidth: ~125 MB/second</li>
            </ul>`
        },
        {
            title: 'High-Level Architecture',
            mermaid: `graph TB
    subgraph Clients
        RIDER[Rider App]
        DRIVER[Driver App]
    end
    subgraph Gateway[API Gateway]
        LB[Load Balancer]
        API[API Servers]
    end
    subgraph CoreServices[Core Services]
        MATCH[Matching Service]
        TRIP[Trip Service]
        LOCATE[Location Service]
        PRICE[Pricing Service]
        ETA_SVC[ETA Service]
        PAY[Payment Service]
        NOTIFY[Notification Service]
    end
    subgraph DataStores
        GEO[(Geospatial Index<br/>Redis/H3)]
        TRIPDB[(Trip Store<br/>PostgreSQL)]
        LOCDB[(Location Stream<br/>Kafka + Cassandra)]
        CACHE[(Cache<br/>Redis)]
        MAP[(Map/Routing<br/>OSRM/Valhalla)]
    end
    RIDER --> LB --> API
    DRIVER --> LB
    API --> MATCH & TRIP & PRICE & ETA_SVC
    DRIVER -->|Location stream| LOCATE
    LOCATE --> GEO & LOCDB
    MATCH --> GEO & ETA_SVC
    TRIP --> TRIPDB & PAY & NOTIFY
    ETA_SVC --> MAP & LOCDB
    PRICE --> CACHE`,
            content: `<p>The architecture centers on three hot paths: <strong>location ingestion</strong> (1.25M updates/sec), <strong>matching</strong> (finding nearest drivers), and <strong>trip state management</strong> (strongly consistent lifecycle).</p>`
        },
        {
            title: 'Geospatial Indexing — Finding Nearby Drivers',
            content: `<p>The core challenge: given a rider's location, find the K nearest available drivers within a radius, updated in real-time.</p>
            <h4>Approaches</h4>
            <table>
                <thead><tr><th>Approach</th><th>How It Works</th><th>Pros</th><th>Cons</th></tr></thead>
                <tbody>
                    <tr><td><strong>Geohash + Redis</strong></td><td>Encode lat/lng to geohash prefix. Store drivers in Redis sorted sets by geohash.</td><td>Simple, fast, Redis GEORADIUS command</td><td>Edge cases at geohash boundaries</td></tr>
                    <tr><td><strong>H3 (Uber's choice)</strong></td><td>Hexagonal hierarchical grid. Each hex cell has an ID. Drivers indexed by cell.</td><td>Uniform cell size, no boundary issues, multi-resolution</td><td>Custom implementation needed</td></tr>
                    <tr><td><strong>QuadTree</strong></td><td>Recursive spatial partitioning. Dense areas subdivide further.</td><td>Adapts to density, efficient range queries</td><td>Rebalancing under high churn</td></tr>
                    <tr><td><strong>R-Tree</strong></td><td>Bounding-box tree for spatial objects</td><td>Efficient nearest-neighbor</td><td>Complex, not great for point-only data</td></tr>
                </tbody>
            </table>
            <h4>Uber's H3 System</h4>
            <p>H3 divides the Earth into hexagonal cells at multiple resolutions (0-15). Resolution 7 cells are ~5km² — good for matching. Drivers update their cell index on each location ping. Matching searches the rider's cell + neighboring ring of cells.</p>`,
            code: `// Geospatial index using H3 hexagonal grid
public class DriverLocationIndex
{
    private readonly IDatabase _redis;
    private const int H3_RESOLUTION = 7; // ~5km² cells

    public async Task UpdateDriverLocationAsync(string driverId, double lat, double lng)
    {
        var h3Index = H3.GeoToH3(lat, lng, H3_RESOLUTION);
        var previousCell = await _redis.HashGetAsync("driver:cell", driverId);
        
        // Remove from old cell, add to new cell
        if (previousCell.HasValue && previousCell != h3Index.ToString())
        {
            await _redis.SetRemoveAsync($"cell:{previousCell}", driverId);
        }
        
        await _redis.SetAddAsync($"cell:{h3Index}", driverId);
        await _redis.HashSetAsync("driver:cell", driverId, h3Index.ToString());
        
        // Store precise location for distance calculation
        await _redis.GeoAddAsync("driver:locations", lng, lat, driverId);
    }

    public async Task<List<NearbyDriver>> FindNearbyDriversAsync(
        double lat, double lng, int maxResults = 10, double radiusKm = 5)
    {
        var centerCell = H3.GeoToH3(lat, lng, H3_RESOLUTION);
        var ringCells = H3.KRing(centerCell, 1); // Center + 6 neighbors
        
        var candidateIds = new List<string>();
        foreach (var cell in ringCells)
        {
            var drivers = await _redis.SetMembersAsync($"cell:{cell}");
            candidateIds.AddRange(drivers.Select(d => d.ToString()));
        }
        
        // Filter to available drivers and sort by actual distance
        var results = new List<NearbyDriver>();
        foreach (var id in candidateIds)
        {
            var status = await _redis.HashGetAsync("driver:status", id);
            if (status != "available") continue;
            
            var dist = await _redis.GeoDistAsync("driver:locations", id, 
                new GeoCoord(lng, lat), GeoUnit.Kilometers);
            if (dist <= radiusKm)
                results.Add(new NearbyDriver(id, dist.Value));
        }
        
        return results.OrderBy(d => d.DistanceKm).Take(maxResults).ToList();
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Ride Matching Algorithm',
            content: `<p>Matching connects a rider with the best available driver. "Best" balances distance, ETA, driver rating, and supply/demand.</p>
            <h4>Matching Flow</h4>
            <ol>
                <li>Rider requests ride → Matching service triggered</li>
                <li>Query geospatial index for nearby available drivers (expanding radius if too few)</li>
                <li>For each candidate, compute ETA (routing engine) and score</li>
                <li>Select highest-scoring driver → send ride offer</li>
                <li>Driver has 15 seconds to accept. If declined/timeout → offer next driver</li>
                <li>Accepted → Trip created, rider notified, driver navigates to pickup</li>
            </ol>
            <h4>Scoring Function</h4>
            <p><code>score = w1 * (1/ETA) + w2 * driverRating + w3 * acceptanceRate - w4 * detourPenalty</code></p>
            <h4>Edge Cases</h4>
            <ul>
                <li><strong>No drivers nearby</strong>: Expand search radius progressively (2km → 5km → 10km)</li>
                <li><strong>All drivers decline</strong>: Re-enter matching queue, notify rider of delay</li>
                <li><strong>Simultaneous requests</strong>: Lock driver during offer window to prevent double-dispatch</li>
                <li><strong>Driver moving away</strong>: Re-compute ETA at accept time; cancel if significantly longer</li>
            </ul>`,
            mermaid: `stateDiagram-v2
    [*] --> Requesting: Rider requests ride
    Requesting --> Matching: Find nearby drivers
    Matching --> OfferSent: Best driver selected
    OfferSent --> Accepted: Driver accepts (15s timeout)
    OfferSent --> Matching: Driver declines/timeout
    Accepted --> EnRoute: Driver heading to pickup
    EnRoute --> Arrived: Driver at pickup location
    Arrived --> InTrip: Rider picked up
    InTrip --> Completed: Arrived at destination
    Completed --> Payment: Calculate fare
    Payment --> [*]
    Matching --> NoDrivers: No available drivers
    NoDrivers --> Requesting: Retry with expanded radius`
        },
        {
            title: 'Dynamic (Surge) Pricing',
            content: `<p>Surge pricing balances supply (available drivers) and demand (ride requests) in real-time per geographic zone.</p>
            <h4>How It Works</h4>
            <ol>
                <li>Divide city into pricing zones (H3 cells at resolution 6-7)</li>
                <li>Every 1-2 minutes, compute: <code>demand_ratio = requests / available_drivers</code> per zone</li>
                <li>If demand_ratio > threshold → apply multiplier (1.2x, 1.5x, 2.0x, etc.)</li>
                <li>Multiplier shown to rider before confirming ride request</li>
                <li>Higher prices incentivize more drivers to move to that zone</li>
            </ol>
            <h4>Surge Computation</h4>
            <table>
                <thead><tr><th>Demand/Supply Ratio</th><th>Multiplier</th><th>Effect</th></tr></thead>
                <tbody>
                    <tr><td>&lt; 1.0</td><td>1.0x (no surge)</td><td>More drivers than requests</td></tr>
                    <tr><td>1.0 - 1.5</td><td>1.2x - 1.5x</td><td>Mild imbalance</td></tr>
                    <tr><td>1.5 - 3.0</td><td>1.5x - 2.5x</td><td>Significant shortage</td></tr>
                    <tr><td>&gt; 3.0</td><td>2.5x - 5.0x</td><td>Extreme demand (events, weather)</td></tr>
                </tbody>
            </table>
            <h4>Design Considerations</h4>
            <ul>
                <li><strong>Smoothing</strong>: Avoid rapid oscillation — use moving average over 2-5 minute window</li>
                <li><strong>Caps</strong>: Regulatory maximum multiplier in some jurisdictions</li>
                <li><strong>Transparency</strong>: Show rider estimated fare range and surge multiplier before confirmation</li>
                <li><strong>Heat maps</strong>: Show drivers where demand is high to redistribute supply organically</li>
            </ul>`
        },
        {
            title: 'ETA Computation',
            content: `<p>ETA (Estimated Time of Arrival) is critical for rider experience and matching decisions.</p>
            <h4>Components</h4>
            <ul>
                <li><strong>Routing engine</strong>: OSRM or Valhalla (open-source) or Google Maps API for road-network shortest path</li>
                <li><strong>Real-time traffic</strong>: Historical + live speed data per road segment (from driver GPS streams)</li>
                <li><strong>ML models</strong>: Learned ETA that accounts for traffic patterns, time-of-day, weather, events</li>
            </ul>
            <h4>ETA Types</h4>
            <table>
                <thead><tr><th>ETA Type</th><th>When Used</th><th>Accuracy Target</th></tr></thead>
                <tbody>
                    <tr><td>Pickup ETA</td><td>Matching (driver → rider)</td><td>± 2 minutes</td></tr>
                    <tr><td>Trip ETA</td><td>Shown to rider during trip</td><td>± 3 minutes</td></tr>
                    <tr><td>Fare estimate ETA</td><td>Before ride request (pricing)</td><td>± 5 minutes</td></tr>
                </tbody>
            </table>
            <h4>Real-Time Traffic from Driver Fleet</h4>
            <p>With 5M active drivers streaming GPS, Uber has real-time speed data for every road segment. This is aggregated into a live traffic graph that the routing engine consults for ETA computation.</p>`
        },
        {
            title: 'Location Ingestion Pipeline',
            content: `<p>5M drivers sending location updates every 4 seconds = 1.25M events/second. This is the highest-throughput pipeline in the system.</p>
            <h4>Pipeline Design</h4>
            <ol>
                <li><strong>Driver app</strong> sends GPS (lat, lng, heading, speed, timestamp) via lightweight protocol (WebSocket or MQTT)</li>
                <li><strong>Location gateway</strong> validates and publishes to Kafka (partitioned by driverId)</li>
                <li><strong>Consumers</strong>: Geospatial index updater, trip tracking, traffic aggregator, analytics</li>
            </ol>
            <h4>Storage Tiers</h4>
            <ul>
                <li><strong>Hot (Redis)</strong>: Latest location per driver — used for matching and rider ETA display</li>
                <li><strong>Warm (Kafka)</strong>: Recent stream — used for trip tracking replay and traffic aggregation</li>
                <li><strong>Cold (Cassandra/S3)</strong>: Historical trip traces — used for analytics, billing disputes, ML training</li>
            </ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Using SQL for geospatial queries at scale</strong>: ST_Distance on 5M rows is too slow. Use purpose-built geospatial indexes (H3, geohash, Redis GEO).</li>
                <li><strong>Polling for driver locations</strong>: Must use streaming (WebSocket/MQTT) — polling at 4s intervals from 5M drivers is not feasible via HTTP.</li>
                <li><strong>No driver locking during matching</strong>: Without optimistic locking, two riders can be matched to the same driver simultaneously.</li>
                <li><strong>Static pricing</strong>: Flat rates fail during demand spikes (no drivers available). Dynamic pricing is essential for market equilibrium.</li>
                <li><strong>Single ETA source</strong>: Simple distance/speed doesn't account for traffic, turns, one-way streets. Need routing engine + real-time traffic.</li>
                <li><strong>Synchronous matching</strong>: Blocking rider's request while computing ETAs for 20 drivers. Match should be async with status updates.</li>
                <li><strong>No trip state machine</strong>: Without explicit states + transitions, edge cases (rider cancels during pickup, driver goes offline mid-trip) are impossible to handle correctly.</li>
                <li><strong>Storing all location history in one table</strong>: 1.25M writes/sec needs append-optimized storage (Kafka + Cassandra), not a single PostgreSQL table.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li>Geospatial indexing strategy (H3, geohash, QuadTree) and trade-offs</li>
                    <li>Matching algorithm with scoring, timeouts, and lock mechanism</li>
                    <li>Location ingestion at scale (1M+ updates/sec) with streaming pipeline</li>
                    <li>Trip state machine with clear lifecycle and edge case handling</li>
                    <li>Dynamic pricing logic (supply/demand ratio per zone)</li>
                    <li>ETA computation using routing engine + real-time traffic data</li>
                    <li>Scale estimation: drivers × update frequency = ingestion rate</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>H3 hexagonal grid is Uber's solution for uniform geospatial indexing</li>
                <li>Location ingestion is a streaming problem: WebSocket → Kafka → multiple consumers</li>
                <li>Matching requires driver locking to prevent double-dispatch race conditions</li>
                <li>Dynamic pricing uses supply/demand ratio per zone with smoothing to prevent oscillation</li>
                <li>ETA combines routing engine + live traffic data from the driver fleet itself</li>
                <li>Trip lifecycle is a state machine: request → match → pickup → trip → complete → payment</li>
                <li>Hot/warm/cold storage tiers handle the 1.25M location updates/second</li>
                <li>The driver fleet doubles as a real-time traffic sensor network</li>
            </ul>`
        }
    ],
    questions: [
        {
            id: 'sd-uber-q1',
            level: 'senior',
            title: 'How would you design the ride matching system for Uber?',
            answer: `<p>Matching flow:</p>
            <ol>
                <li><strong>Trigger</strong>: Rider requests ride → matching service receives (pickup_lat, pickup_lng, destination)</li>
                <li><strong>Candidate discovery</strong>: Query geospatial index (H3 grid) for available drivers in rider's cell + ring-1 neighbors</li>
                <li><strong>Scoring</strong>: For top candidates, compute ETA via routing engine. Score = f(ETA, rating, acceptance_rate)</li>
                <li><strong>Offer</strong>: Lock best driver (optimistic lock in Redis), send ride offer with 15s timeout</li>
                <li><strong>Accept/Decline</strong>: If accepted → create trip, notify rider. If declined → release lock, offer next driver.</li>
                <li><strong>Expansion</strong>: If no candidates in initial radius, expand search (2km → 5km → 10km)</li>
            </ol>
            <p>Critical: the driver lock prevents double-dispatch. Use Redis SETNX with TTL as a lightweight distributed lock during the offer window.</p>`
        },
        {
            id: 'sd-uber-q2',
            level: 'senior',
            title: 'How do you handle 1.25 million driver location updates per second?',
            answer: `<p>A streaming pipeline, not request/response:</p>
            <ul>
                <li><strong>Protocol</strong>: Drivers push location via persistent connection (WebSocket or MQTT — less overhead than HTTP)</li>
                <li><strong>Location gateway</strong>: Stateless servers that validate, enrich (add timestamp), and publish to Kafka</li>
                <li><strong>Kafka topics</strong>: Partitioned by driverId (ordering guarantee per driver). Retention: 24h for replay.</li>
                <li><strong>Consumers</strong> (independent, parallel):</li>
            </ul>
            <ol>
                <li>Geospatial index updater → updates Redis/H3 cell membership</li>
                <li>Trip tracker → pushes live location to rider's connection during active trip</li>
                <li>Traffic aggregator → computes average speed per road segment for ETA</li>
                <li>Cold storage writer → writes to Cassandra/S3 for trip history and ML</li>
            </ol>
            <p>Each consumer scales independently based on its throughput needs.</p>`
        },
        {
            id: 'sd-uber-q3',
            level: 'mid',
            title: 'What geospatial indexing strategies can you use to find nearby drivers?',
            answer: `<p>Four main approaches:</p>
            <ul>
                <li><strong>Geohash + Redis GEORADIUS</strong>: Encode lat/lng as string prefix. Redis has built-in GEORADIUS command. Simple but has boundary issues (nearby points can have very different geohashes at cell edges).</li>
                <li><strong>H3 Hexagonal Grid</strong>: Uber's choice. Uniform hexagonal cells at multiple resolutions. No boundary distortion. K-ring query finds all neighbors efficiently.</li>
                <li><strong>QuadTree</strong>: Recursive spatial subdivision. Adapts well to uneven density (more subdivisions in cities). But complex rebalancing under high churn.</li>
                <li><strong>PostGIS / Spatial DB</strong>: Good for moderate scale but won't handle 1M+ updates/second. Fine for trip history queries, not live matching.</li>
            </ul>
            <p>For Uber-scale real-time matching, H3 + Redis (or custom in-memory index) is the proven approach.</p>`
        },
        {
            id: 'sd-uber-q4',
            level: 'architect',
            title: 'How does Uber implement surge/dynamic pricing?',
            answer: `<p>Surge pricing is a real-time market mechanism:</p>
            <ol>
                <li><strong>Zone division</strong>: City divided into hexagonal zones (H3 resolution 6-7, ~5km²)</li>
                <li><strong>Demand signal</strong>: Count ride requests per zone in last 2-minute window</li>
                <li><strong>Supply signal</strong>: Count available (not on-trip) drivers per zone</li>
                <li><strong>Ratio</strong>: <code>surge = demand / supply</code> with smoothing (exponential moving average)</li>
                <li><strong>Multiplier mapping</strong>: Ratio → price multiplier via a calibrated curve (not linear)</li>
                <li><strong>Display</strong>: Show multiplier + estimated fare to rider for consent before requesting</li>
                <li><strong>Effect</strong>: Higher prices reduce demand (some riders wait) and increase supply (drivers move toward surge zones)</li>
            </ol>
            <p>Anti-oscillation: smoothing window + minimum duration for surge (don't remove surge the instant supply catches up — wait for stabilization).</p>`
        },
        {
            id: 'sd-uber-q5',
            level: 'mid',
            title: 'How does ETA computation work for ride-hailing?',
            answer: `<p>ETA combines three components:</p>
            <ul>
                <li><strong>Road network routing</strong>: Graph-based shortest path (Dijkstra/A*) on road network data (OpenStreetMap). Tools: OSRM, Valhalla, Google Directions API.</li>
                <li><strong>Real-time traffic</strong>: Live speed per road segment computed from driver GPS streams. Updates the edge weights in the routing graph.</li>
                <li><strong>ML correction</strong>: Learned model that adjusts routing-engine ETA based on patterns (time of day, day of week, weather, special events).</li>
            </ul>
            <p>Pickup ETA = route from driver's current location to rider's pickup point, using live traffic weights. Trip ETA = route from pickup to destination.</p>`
        },
        {
            id: 'sd-uber-q6',
            level: 'junior',
            title: 'What is the trip lifecycle in a ride-hailing system?',
            answer: `<p>A trip goes through these states:</p>
            <ol>
                <li><strong>Requested</strong>: Rider submits ride request (pickup, destination, ride type)</li>
                <li><strong>Matching</strong>: System searching for a driver</li>
                <li><strong>Driver Assigned</strong>: A driver accepted the request</li>
                <li><strong>En Route to Pickup</strong>: Driver driving to rider's location</li>
                <li><strong>Arrived at Pickup</strong>: Driver waiting for rider (timer starts for no-show fee)</li>
                <li><strong>In Progress</strong>: Rider in car, driving to destination</li>
                <li><strong>Completed</strong>: Arrived at destination, fare calculated</li>
                <li><strong>Payment</strong>: Charge processed, receipt generated</li>
            </ol>
            <p>At any point, either party can cancel (with potential cancellation fee depending on state). The state machine enforces valid transitions and handles edge cases.</p>`
        },
        {
            id: 'sd-uber-q7',
            level: 'senior',
            title: 'How do you prevent double-dispatch (same driver matched to two riders)?',
            answer: `<p>Distributed locking during the matching offer window:</p>
            <ul>
                <li>When matching selects a driver, acquire a lock: <code>SETNX driver_lock:{driverId} {rideRequestId} EX 20</code></li>
                <li>If lock acquired → send offer to driver (15s timeout + 5s buffer)</li>
                <li>If driver accepts → mark as on-trip, release lock</li>
                <li>If driver declines/timeout → release lock, move to next candidate</li>
                <li>If another matching request tries the same driver → SETNX fails → skip to next candidate</li>
            </ul>
            <p>The lock TTL (20s) ensures locks don't leak if the matching service crashes. Additional safeguard: the Trip Service validates driver status on trip creation (optimistic concurrency check).</p>`
        },
        {
            id: 'sd-uber-q8',
            level: 'architect',
            title: 'How would you design the real-time trip tracking shown to riders?',
            answer: `<p>During an active trip, the rider sees the driver's car moving on a map in real-time:</p>
            <ul>
                <li><strong>Driver side</strong>: App sends GPS every 3-4 seconds via persistent connection to location gateway</li>
                <li><strong>Location gateway</strong>: Publishes to Kafka topic (partitioned by tripId during active trip)</li>
                <li><strong>Trip tracking consumer</strong>: Subscribes to active trip locations. For each update, pushes to rider's WebSocket connection via the notification gateway.</li>
                <li><strong>Rider side</strong>: Receives location updates via WebSocket, renders car movement on map with client-side interpolation (smooth animation between GPS points)</li>
            </ul>
            <p>Optimization: During an active trip, route driver's location stream directly to the rider's connection (bypasses full matching/geospatial pipeline). Rider is subscribed to their trip's location channel only.</p>`
        },
        {
            id: 'sd-uber-q9',
            level: 'lead',
            title: 'How do you handle the case where a rider cancels after driver is already en route?',
            answer: `<p>Trip state machine handles cancellation at each state differently:</p>
            <ul>
                <li><strong>During matching</strong>: Free cancellation — no penalty, release resources</li>
                <li><strong>Driver assigned but not moving yet (&lt;30s)</strong>: Free cancellation, re-queue driver for matching</li>
                <li><strong>Driver en route (30s+)</strong>: Cancellation fee charged to rider (compensates driver's time/fuel). Amount based on distance already traveled.</li>
                <li><strong>Driver arrived, waiting</strong>: Higher cancellation fee (driver committed significant time)</li>
            </ul>
            <p>Implementation: Trip service checks current state + timestamps. Applies fee rules from a config-driven cancellation policy. Notifies driver immediately (stop navigation), returns driver to available pool.</p>`
        },
        {
            id: 'sd-uber-q10',
            level: 'mid',
            title: 'How would you estimate the fare before the rider confirms the trip?',
            answer: `<p>Fare estimation before trip starts:</p>
            <ol>
                <li>Compute ETA (routing engine) for the trip route (pickup → destination)</li>
                <li>Calculate distance from route geometry</li>
                <li>Apply pricing formula: <code>fare = base_fare + (price_per_km × distance) + (price_per_min × duration)</code></li>
                <li>Apply surge multiplier for the pickup zone: <code>final = fare × surge_multiplier</code></li>
                <li>Apply min/max bounds (minimum fare floor, maximum fare cap if applicable)</li>
                <li>Show rider a range: estimated_fare ± 15% (accounts for traffic variability)</li>
            </ol>
            <p>Actual fare at trip end uses real distance + real duration (metered). If actual differs significantly from estimate (e.g., wrong route), fare review process kicks in.</p>`
        }
    ]
});
