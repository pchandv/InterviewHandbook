PageData.register('kibana-elk', {
    title: 'Kibana & ELK Stack',
    description: 'Elasticsearch, Logstash, Kibana, and Beats — the complete observability stack for log aggregation, search, visualization, and APM.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>The ELK Stack (Elasticsearch, Logstash, Kibana) — now often called the Elastic Stack with Beats added — is the most widely deployed open-source observability platform. It ingests, stores, searches, and visualizes logs, metrics, and traces from distributed systems.</p>
<p>In interviews, ELK questions test whether you can operate production observability infrastructure, write effective queries, build actionable dashboards, and troubleshoot performance issues in the stack itself.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>The Elastic Stack has four main components:</p>
<ul>
<li><strong>Elasticsearch</strong> — Distributed search and analytics engine built on Apache Lucene. Stores data as JSON documents in indices with inverted indexes for full-text search.</li>
<li><strong>Logstash</strong> — Server-side data processing pipeline. Ingests from multiple sources, transforms (filter/mutate/grok), outputs to Elasticsearch or other destinations.</li>
<li><strong>Kibana</strong> — Web UI for visualizing Elasticsearch data. Dashboards, Discover, Lens, Maps, and alerting.</li>
<li><strong>Beats</strong> — Lightweight data shippers installed on servers. Filebeat (logs), Metricbeat (metrics), Packetbeat (network), Heartbeat (uptime).</li>
</ul>
<p>Key Elasticsearch concepts:</p>
<ul>
<li><strong>Index</strong> — Collection of documents (like a database table). Often time-based: logs-2024.01.15</li>
<li><strong>Shard</strong> — Horizontal partition of an index. Primary shards for writes; replica shards for reads + HA.</li>
<li><strong>Document</strong> — JSON record stored in an index</li>
<li><strong>Mapping</strong> — Schema definition (field types, analyzers)</li>
<li><strong>ILM (Index Lifecycle Management)</strong> — Automated hot/warm/cold/delete phases for data retention</li>
</ul>`
        },
        {
            title: 'How It Works',
            content: `<p>Data flows through the stack in a pipeline:</p>
<ol>
<li><strong>Collection</strong> — Beats agents on each server ship logs/metrics to Logstash or directly to Elasticsearch</li>
<li><strong>Processing</strong> — Logstash parses unstructured logs (grok patterns), enriches with geo-IP/DNS, transforms fields</li>
<li><strong>Indexing</strong> — Elasticsearch indexes documents into shards, builds inverted indexes for search</li>
<li><strong>Querying</strong> — KQL (Kibana Query Language) or full Elasticsearch DSL for complex queries</li>
<li><strong>Visualization</strong> — Kibana dashboards render aggregations as charts, tables, maps</li>
<li><strong>Alerting</strong> — Watcher or Kibana Alerting triggers notifications when conditions match</li>
</ol>`,
            mermaid: `flowchart LR
    subgraph Sources
        A[App Logs]
        B[Metrics]
        C[Network]
        D[APM Agents]
    end
    subgraph Shippers
        E[Filebeat]
        F[Metricbeat]
        G[Packetbeat]
        H[APM Server]
    end
    subgraph Processing
        I[Logstash]
    end
    subgraph Storage
        J[Elasticsearch Cluster]
    end
    subgraph Visualization
        K[Kibana]
    end
    A --> E
    B --> F
    C --> G
    D --> H
    E --> I
    F --> J
    G --> J
    H --> J
    I --> J
    J --> K`
        },
        {
            title: 'Visual Diagram',
            content: `<p>Elasticsearch cluster architecture with sharding and replication:</p>`,
            mermaid: `flowchart TD
    subgraph Cluster
        subgraph Node1["Node 1 (Master)"]
            P0["Primary Shard 0"]
            R1["Replica Shard 1"]
        end
        subgraph Node2["Node 2 (Data)"]
            P1["Primary Shard 1"]
            R0["Replica Shard 0"]
        end
        subgraph Node3["Node 3 (Data)"]
            P2["Primary Shard 2"]
            R2["Replica Shard 2"]
        end
    end
    Client[Client Request] --> LB[Load Balancer]
    LB --> Node1
    LB --> Node2
    LB --> Node3`
        },
        {
            title: 'Implementation',
            content: `<p>Common configuration patterns for production ELK deployments:</p>`,
            code: `# Filebeat configuration (filebeat.yml)
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/app/*.json
    json.keys_under_root: true
    json.add_error_key: true
    fields:
      environment: production
      service: payment-api
    fields_under_root: true

# Ship directly to Elasticsearch (skip Logstash for structured logs)
output.elasticsearch:
  hosts: ["https://es-node1:9200", "https://es-node2:9200"]
  index: "logs-payment-%{+yyyy.MM.dd}"
  ssl.certificate_authorities: ["/etc/pki/ca.crt"]

# ILM policy for automatic rollover
setup.ilm.enabled: true
setup.ilm.rollover_alias: "logs-payment"
setup.ilm.policy_name: "logs-30d-retention"

---
# Logstash pipeline for unstructured logs (logstash.conf)
input {
  beats { port => 5044 }
}

filter {
  # Parse Apache/Nginx access logs
  grok {
    match => { "message" => "%{COMBINEDAPACHELOG}" }
  }
  # Geo-IP enrichment
  geoip {
    source => "clientip"
    target => "geo"
  }
  # Parse timestamp
  date {
    match => ["timestamp", "dd/MMM/yyyy:HH:mm:ss Z"]
    target => "@timestamp"
  }
  # Remove raw message after parsing
  mutate { remove_field => ["message"] }
}

output {
  elasticsearch {
    hosts => ["https://es-cluster:9200"]
    index => "access-logs-%{+yyyy.MM.dd}"
    user => "logstash_writer"
    password => "\${LOGSTASH_ES_PASSWORD}"
  }
}`,
            language: 'yaml'
        },
        {
            title: 'Best Practices',
            content: `<ul>
<li><strong>Use ILM (Index Lifecycle Management)</strong> — automate hot/warm/cold/delete phases; never manually manage old indices</li>
<li><strong>Right-size shards</strong> — target 20-50GB per shard; too many small shards kills cluster performance</li>
<li><strong>Use data streams</strong> — for time-series data (logs/metrics), use data streams over manual index naming</li>
<li><strong>Ship structured JSON logs</strong> — avoid Logstash grok parsing when possible; log JSON from your app</li>
<li><strong>Separate hot/warm/cold nodes</strong> — SSD for hot (recent), HDD for warm/cold (historical)</li>
<li><strong>Set explicit mappings</strong> — disable dynamic mapping in production to prevent mapping explosions</li>
<li><strong>Use aliases for queries</strong> — decouple queries from physical index names for easy rollover</li>
<li><strong>Monitor the cluster itself</strong> — Elasticsearch cluster health, JVM heap, disk watermarks, pending tasks</li>
<li><strong>Kibana Spaces</strong> — separate dashboards by team/environment for discoverability</li>
<li><strong>Alert on absence</strong> — if logs STOP arriving, that is more dangerous than error spikes</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>Mapping explosion</strong> — dynamic mapping creates thousands of fields from nested JSON; cluster OOMs</li>
<li><strong>One giant index</strong> — storing all logs in one index instead of time-based indices; impossible to manage retention</li>
<li><strong>No ILM</strong> — disk fills up, cluster goes red, production observability dies</li>
<li><strong>Logging sensitive data</strong> — PII, tokens, passwords end up in Elasticsearch; not encrypted at rest by default</li>
<li><strong>Too many shards</strong> — 1 shard per index × 1000 daily indices = cluster overhead explosion</li>
<li><strong>Querying without time filter</strong> — scanning all historical data for a simple dashboard; crushes performance</li>
<li><strong>No curator/ILM</strong> — old indices never deleted; storage costs balloon</li>
<li><strong>Using Elasticsearch as primary database</strong> — it is a search engine, not an ACID database</li>
</ul>`
        },
        {
            title: 'KQL & Query DSL',
            content: `<p>Kibana Query Language (KQL) is the primary search language in Kibana Discover and dashboards:</p>`,
            code: `// KQL Examples (used in Kibana search bar)

// Simple field match
status: 500

// Wildcard
service.name: payment*

// Boolean
status: 500 AND service.name: "payment-api"

// Range
response_time > 2000

// Nested field
http.response.status_code: 503

// NOT
NOT environment: development

// Exists
url.path: *

---
// Elasticsearch Query DSL (for complex queries via API)
{
  "query": {
    "bool": {
      "must": [
        { "match": { "service.name": "payment-api" } },
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ],
      "filter": [
        { "term": { "log.level": "ERROR" } }
      ],
      "must_not": [
        { "match": { "message": "health check" } }
      ]
    }
  },
  "aggs": {
    "errors_per_minute": {
      "date_histogram": {
        "field": "@timestamp",
        "fixed_interval": "1m"
      }
    }
  },
  "size": 100,
  "sort": [{ "@timestamp": "desc" }]
}`,
            language: 'javascript'
        },
        {
            title: 'Real-World Applications',
            content: `<p>Production use cases for the Elastic Stack:</p>
<table>
<tr><th>Use Case</th><th>Components</th><th>Example</th></tr>
<tr><td>Application Logging</td><td>Filebeat + Elasticsearch + Kibana</td><td>Centralized logs from 200 microservices, searchable in seconds</td></tr>
<tr><td>APM (Application Performance)</td><td>Elastic APM agents + APM Server</td><td>Distributed tracing, transaction waterfall, service map</td></tr>
<tr><td>Security (SIEM)</td><td>Elastic Security + Beats</td><td>Threat detection, MITRE ATT&CK mapping, incident response</td></tr>
<tr><td>Infrastructure Monitoring</td><td>Metricbeat + Kibana Metrics</td><td>CPU/memory/disk dashboards per server and container</td></tr>
<tr><td>Business Analytics</td><td>Custom indices + Kibana Lens</td><td>Real-time order volume, revenue dashboards, A/B test results</td></tr>
<tr><td>Uptime Monitoring</td><td>Heartbeat + Kibana Uptime</td><td>Endpoint availability checks every 30s with alerting</td></tr>
</table>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>Operational experience</strong> — Have you actually managed an ELK cluster? Dealt with red cluster status?</li>
<li><strong>Query fluency</strong> — Can you write KQL or DSL queries quickly to investigate an incident?</li>
<li><strong>Architecture decisions</strong> — Why did you choose ELK over Datadog/Splunk/CloudWatch? Cost/scale trade-offs.</li>
<li><strong>Data lifecycle</strong> — How do you handle retention? What is your ILM policy?</li>
<li><strong>Scale awareness</strong> — How many GB/day? How many shards? When does ELK stop scaling linearly?</li>
<li><strong>Alternatives knowledge</strong> — OpenSearch, Grafana Loki, Datadog, Splunk — when would you pick each?</li>
</ul>`
            }
        }
    ],
    questions: [
        {
            id: 'elk-q1',
            level: 'junior',
            title: 'What are the four components of the Elastic Stack and what does each do?',
            answer: `<p><strong>Elasticsearch</strong> — Distributed search and analytics engine. Stores JSON documents in indices, provides full-text search via inverted indexes, and runs aggregations for analytics.</p>
<p><strong>Logstash</strong> — Data processing pipeline. Ingests data from multiple sources (files, databases, message queues), transforms it (parse, filter, enrich), and outputs to Elasticsearch or other destinations.</p>
<p><strong>Kibana</strong> — Web-based visualization layer. Provides Discover (log exploration), Dashboards (visualizations), Lens (drag-and-drop charting), Maps, and Alerting.</p>
<p><strong>Beats</strong> — Lightweight data shippers installed on source servers. Filebeat (log files), Metricbeat (system metrics), Packetbeat (network data), Heartbeat (uptime checks).</p>`
        },
        {
            id: 'elk-q2',
            level: 'junior',
            title: 'What is the difference between an Elasticsearch index and a shard?',
            answer: `<p>An <strong>index</strong> is a logical collection of documents (similar to a database table). It has a mapping (schema) that defines field types.</p>
<p>A <strong>shard</strong> is a physical partition of an index. Each index is split into one or more primary shards, and each primary can have replica shards:</p>
<ul>
<li><strong>Primary shards</strong> — handle write operations; number is set at index creation and cannot be changed (without reindexing)</li>
<li><strong>Replica shards</strong> — copies of primaries; serve read requests and provide high availability</li>
</ul>
<p>Example: An index with 3 primary shards and 1 replica = 6 total shards (3 primary + 3 replica) distributed across cluster nodes.</p>`
        },
        {
            id: 'elk-q3',
            level: 'mid',
            title: 'How would you handle log retention in a production ELK cluster ingesting 500GB/day?',
            answer: `<p>At 500GB/day, manual management is impossible. Use <strong>Index Lifecycle Management (ILM)</strong>:</p>
<ol>
<li><strong>Hot phase</strong> — Current day logs on SSD nodes. Rollover when index hits 50GB or 1 day old.</li>
<li><strong>Warm phase</strong> — After 2 days, move to warm nodes (cheaper HDD). Shrink shards, force-merge segments for read performance.</li>
<li><strong>Cold phase</strong> — After 14 days, move to cold storage. Freeze index (reduces memory). Searchable but slow.</li>
<li><strong>Delete phase</strong> — After 30 days (or per compliance), delete automatically.</li>
</ol>
<p>Additional strategies:</p>
<ul>
<li><strong>Data streams</strong> — use data streams instead of manual index naming for automatic rollover</li>
<li><strong>Snapshot to S3</strong> — before delete phase, snapshot to cheap object storage for compliance/audit</li>
<li><strong>Separate retention by severity</strong> — ERROR logs keep 90 days, DEBUG logs keep 7 days</li>
<li><strong>Searchable snapshots</strong> — mount S3 snapshots as read-only indices without restoring (Elastic 7.12+)</li>
</ul>
<p>Cost math: 500GB/day × 30 days = 15TB hot storage. With warm/cold tiers, maybe 3TB SSD + 12TB HDD.</p>`
        },
        {
            id: 'elk-q4',
            level: 'mid',
            title: 'What is a mapping explosion and how do you prevent it?',
            answer: `<p>A <strong>mapping explosion</strong> occurs when Elasticsearch dynamically creates mappings for every unique field name it encounters. If your logs contain arbitrary nested JSON (e.g., user-generated metadata, request headers with dynamic keys), the mapping can grow to thousands of fields.</p>
<p>Consequences:</p>
<ul>
<li>Cluster memory usage spikes (mappings are held in memory on every node)</li>
<li>Indexing slows dramatically</li>
<li>Eventually, the cluster goes out of memory (OOM)</li>
</ul>
<p>Prevention:</p>
<ul>
<li><strong>Disable dynamic mapping</strong> — set "dynamic": "strict" or "false" in index template</li>
<li><strong>Explicit mappings</strong> — define only the fields you need to search/aggregate on</li>
<li><strong>Flattened field type</strong> — stores arbitrary JSON as a single field (searchable but not individually aggregatable)</li>
<li><strong>index.mapping.total_fields.limit</strong> — set a hard cap (default 1000, raise carefully)</li>
<li><strong>Flatten at source</strong> — normalize dynamic keys in Logstash before indexing</li>
</ul>`
        },
        {
            id: 'elk-q5',
            level: 'senior',
            title: 'How would you design an ELK deployment for a 50-microservice architecture?',
            answer: `<p>Design considerations for a production multi-service ELK deployment:</p>
<p><strong>Architecture:</strong></p>
<ul>
<li>Dedicated master nodes (3, odd number for quorum) — no data, only cluster state</li>
<li>Hot data nodes (SSD, high CPU) — current indices, heavy indexing</li>
<li>Warm/cold data nodes (HDD, high disk) — older data, read-optimized</li>
<li>Coordinating nodes — route queries, reduce results (optional at this scale)</li>
<li>Kibana (2+ for HA) behind load balancer</li>
</ul>
<p><strong>Ingestion:</strong></p>
<ul>
<li>Filebeat on every pod/server (sidecar in K8s)</li>
<li>Ship structured JSON (avoid Logstash grok parsing)</li>
<li>Use Kafka as buffer between Beats and Elasticsearch for back-pressure handling</li>
<li>Separate indices per service: logs-{service-name}-{date}</li>
</ul>
<p><strong>Operations:</strong></p>
<ul>
<li>ILM with hot/warm/cold/delete; different retention per service criticality</li>
<li>Index templates with explicit mappings per service team</li>
<li>Kibana Spaces per team (payments, identity, orders, infra)</li>
<li>Alerting: Watcher rules for error rate spikes, log absence, cluster health</li>
<li>Cross-cluster search for multi-region (or single cluster with zone awareness)</li>
</ul>`
        },
        {
            id: 'elk-q6',
            level: 'senior',
            title: 'When would you choose ELK over alternatives like Datadog, Splunk, or Grafana Loki?',
            answer: `<p>Decision framework:</p>
<table>
<tr><th>Factor</th><th>ELK</th><th>Datadog/Splunk</th><th>Grafana Loki</th></tr>
<tr><td>Cost at scale</td><td>Lower (self-hosted, open source)</td><td>Very expensive at high volume</td><td>Lowest (only indexes labels)</td></tr>
<tr><td>Operational burden</td><td>High (you manage the cluster)</td><td>Zero (fully managed SaaS)</td><td>Medium</td></tr>
<tr><td>Search power</td><td>Best (full-text, aggregations)</td><td>Excellent</td><td>Limited (grep-like, no full-text)</td></tr>
<tr><td>Team size to operate</td><td>Needs 1-2 dedicated people</td><td>None</td><td>Part-time</td></tr>
<tr><td>Compliance</td><td>Data stays on-prem</td><td>Cloud only (data leaves)</td><td>Self-hosted option</td></tr>
</table>
<p><strong>Choose ELK when:</strong> High volume (>100GB/day) where SaaS costs are prohibitive, need full-text search, data sovereignty requirements, or already have platform engineering team.</p>
<p><strong>Choose SaaS (Datadog/Splunk) when:</strong> Small team, low ops appetite, moderate volume, need quick setup.</p>
<p><strong>Choose Loki when:</strong> Already using Grafana, volume is extreme, full-text search not critical, want to minimize storage costs.</p>`
        },
        {
            id: 'elk-q7',
            level: 'mid',
            title: 'How do you troubleshoot a "red" cluster status in Elasticsearch?',
            answer: `<p>A red cluster means one or more primary shards are unassigned — data loss risk. Diagnostic steps:</p>
<ol>
<li><strong>Check cluster health</strong>: <code>GET _cluster/health</code> — see unassigned shard count</li>
<li><strong>Find unassigned shards</strong>: <code>GET _cat/shards?v&amp;h=index,shard,prirep,state,unassigned.reason</code></li>
<li><strong>Explain allocation failure</strong>: <code>GET _cluster/allocation/explain</code> — tells you WHY it cannot allocate</li>
<li><strong>Common causes:</strong>
<ul>
<li>Disk watermark exceeded (>85% disk used) — free disk or adjust watermarks</li>
<li>Node left cluster — restart the node, wait for recovery</li>
<li>Shard allocation disabled — re-enable: <code>PUT _cluster/settings {"persistent":{"cluster.routing.allocation.enable":"all"}}</code></li>
<li>Corrupt shard — may need to allocate empty primary (data loss for that shard)</li>
</ul></li>
<li><strong>Recovery</strong>: If node returns, shards auto-recover from replicas. If not, restore from snapshot.</li>
</ol>`
        },
        {
            id: 'elk-q8',
            level: 'senior',
            title: 'How does Elasticsearch achieve near-real-time search and what are the trade-offs?',
            answer: `<p>Elasticsearch uses a <strong>refresh</strong> mechanism that makes documents searchable ~1 second after indexing (configurable via <code>index.refresh_interval</code>):</p>
<ol>
<li><strong>Index buffer</strong> — documents first go to an in-memory buffer</li>
<li><strong>Refresh</strong> — every 1s, buffer is written to a new Lucene segment (file-system cache). Now searchable, but NOT durable.</li>
<li><strong>Flush (fsync)</strong> — periodically, segments are fsync-ed to disk + translog is cleared. Now durable.</li>
<li><strong>Merge</strong> — background process merges small segments into larger ones for query efficiency</li>
</ol>
<p><strong>Trade-offs:</strong></p>
<ul>
<li>1s refresh means you cannot see a document immediately after POST (not real-time, near-real-time)</li>
<li>Frequent refreshes = more segments = more file handles and merge overhead</li>
<li>For bulk indexing, set refresh_interval to 30s or -1, then refresh after bulk completes</li>
<li>Durability depends on translog + replica acknowledgment, not refresh</li>
</ul>`
        },
        {
            id: 'elk-q9',
            level: 'architect',
            title: 'How would you design a multi-region ELK deployment for a global application?',
            answer: `<p>Options and trade-offs for global ELK:</p>
<p><strong>Option 1: Cross-Cluster Replication (CCR)</strong></p>
<ul>
<li>Each region has its own cluster; leader indices replicate to follower clusters</li>
<li>Pros: Data locality, low query latency, survives region failure</li>
<li>Cons: Expensive (full copy per region), eventual consistency for followers</li>
<li>Use when: Compliance requires data in-region + need fast local dashboards</li>
</ul>
<p><strong>Option 2: Cross-Cluster Search (CCS)</strong></p>
<ul>
<li>Each region has its own cluster; Kibana queries across all via CCS</li>
<li>Pros: No data duplication, each team owns their cluster</li>
<li>Cons: Cross-region query latency, single-point Kibana can be slow</li>
<li>Use when: Federated teams, moderate query frequency across regions</li>
</ul>
<p><strong>Option 3: Single cluster with zone awareness</strong></p>
<ul>
<li>One cluster spanning multiple AZs within a region</li>
<li>Pros: Simple, automatic shard distribution across zones</li>
<li>Cons: Not multi-region (single region failure = down)</li>
<li>Use when: High availability within one geographic area</li>
</ul>
<p><strong>Recommendation for global app:</strong> CCS for most teams (query locally, search globally when needed) + CCR for critical dashboards that must be fast everywhere.</p>`
        },
        {
            id: 'elk-q10',
            level: 'architect',
            title: 'What are the scaling limits of Elasticsearch and when should you consider alternatives?',
            answer: `<p><strong>Practical limits:</strong></p>
<ul>
<li><strong>Cluster size</strong> — Elastic recommends max ~200 data nodes per cluster (coordination overhead)</li>
<li><strong>Shards per node</strong> — Rule of thumb: max 20 shards per GB of heap. A 32GB heap node should have &lt;640 shards.</li>
<li><strong>Shard size</strong> — Optimal 20-50GB each. Larger = slow recovery; smaller = too much overhead.</li>
<li><strong>Indexing throughput</strong> — Single shard: ~40K docs/s. Scale by adding shards/nodes.</li>
<li><strong>Query latency</strong> — Depends on query complexity. Simple term queries: &lt;10ms. Full-text with aggregations across TBs: seconds.</li>
<li><strong>Mapping fields</strong> — Default limit 1000 per index; going higher hurts performance exponentially.</li>
</ul>
<p><strong>When to consider alternatives:</strong></p>
<ul>
<li><strong>Volume > 10TB/day</strong> — consider Kafka + ClickHouse or Loki for cost efficiency</li>
<li><strong>No full-text search needed</strong> — Loki (label-based) is 10x cheaper on storage</li>
<li><strong>Team cannot operate the cluster</strong> — move to managed (Elastic Cloud, OpenSearch Service) or SaaS</li>
<li><strong>Compliance/multi-tenancy</strong> — OpenSearch (AWS fork) may be cheaper in AWS-heavy orgs</li>
<li><strong>Real-time analytics on structured data</strong> — ClickHouse or Druid may outperform ES on aggregations</li>
</ul>`
        }
    ]
});
