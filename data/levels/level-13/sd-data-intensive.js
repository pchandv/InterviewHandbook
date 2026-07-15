/* ═══════════════════════════════════════════════════════════════════
   DATA-INTENSIVE APPLICATIONS — Level 13: System Design (Design Skills)
   Batch vs stream processing, ETL/ELT, data lakes/warehouses/lakehouse,
   pipelines, and the foundations from Kleppmann's DDIA.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('sd-data-intensive', {

    title: 'Data-Intensive Applications',
    level: 13,
    group: 'system-design-skills',
    description: 'Designing data-intensive systems: batch vs stream processing, ETL/ELT, data lakes/warehouses/lakehouse, pipeline reliability, and the reliability/scalability/maintainability foundations.',
    difficulty: 'advanced',
    estimatedMinutes: 45,
    prerequisites: ['sd-framework', 'event-driven-architecture'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Data-intensive applications</strong> are systems where the primary challenge is the
            volume, velocity, variety, and complexity of data rather than raw computation. Think analytics platforms,
            recommendation engines, fraud detection, and data pipelines feeding dashboards and ML.</p>
            <p>Designing them well rests on three foundations from Kleppmann's <em>Designing Data-Intensive
            Applications</em>: <strong>reliability</strong>, <strong>scalability</strong>, and
            <strong>maintainability</strong> — plus the right processing model (batch vs stream) and storage
            architecture (lake/warehouse/lakehouse).</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>The three pillars: reliability, scalability, maintainability</li>
                <li>Batch vs stream processing and when to use each</li>
                <li>ETL vs ELT and pipeline design</li>
                <li>Data lake vs warehouse vs lakehouse</li>
                <li>Delivery guarantees and idempotency in pipelines</li>
                <li>The Lambda and Kappa architectures</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>The Three Pillars (DDIA)</h4>
            <ul>
                <li><strong>Reliability:</strong> works correctly even with faults (hardware, software, human).</li>
                <li><strong>Scalability:</strong> handles growth in data/traffic/complexity.</li>
                <li><strong>Maintainability:</strong> easy to operate, evolve, and understand over time.</li>
            </ul>
            <h4>Batch vs Stream Processing</h4>
            <p><strong>Batch:</strong> process large bounded datasets on a schedule (high throughput, high latency —
            minutes to hours). <strong>Stream:</strong> process unbounded data continuously as it arrives
            (low latency — sub-second to seconds).</p>
            <h4>ETL vs ELT</h4>
            <p><strong>ETL:</strong> Extract, Transform, then Load — transform before storing (classic warehouse).
            <strong>ELT:</strong> Extract, Load, then Transform — load raw, transform in the warehouse/lake using its
            compute (modern cloud pattern).</p>
            <h4>Storage Architectures</h4>
            <ul>
                <li><strong>Data warehouse:</strong> structured, schema-on-write, optimized for SQL analytics
                (Snowflake, BigQuery, Redshift).</li>
                <li><strong>Data lake:</strong> raw, any format, schema-on-read, cheap object storage (S3/ADLS).</li>
                <li><strong>Lakehouse:</strong> combines both — lake storage with warehouse-like tables/ACID
                (Delta Lake, Iceberg).</li>
            </ul>
            <h4>Delivery Guarantees</h4>
            <p>At-most-once, at-least-once (+ idempotency), exactly-once — the same trade-offs as event-driven
            systems, critical for correct pipelines.</p>`,
            mermaid: `flowchart LR
    Sources[Sources: apps, logs, events, DBs] --> Ingest[Ingestion]
    Ingest --> Batch[Batch processing<br/>scheduled, high throughput]
    Ingest --> Stream[Stream processing<br/>continuous, low latency]
    Batch --> Store[(Lake / Warehouse / Lakehouse)]
    Stream --> Store
    Store --> Serve[Dashboards, ML, APIs]`
        },
        {
            title: 'How It Works',
            content: `<p>A modern data pipeline typically follows ingest -> process -> store -> serve:</p>
            <ol>
                <li><strong>Ingest:</strong> collect from sources (app events, change-data-capture from DBs, logs,
                third-party APIs) into a durable buffer (e.g., Kafka) or landing zone</li>
                <li><strong>Process:</strong> transform/clean/aggregate via batch (Spark) and/or stream (Flink, Kafka
                Streams) processing</li>
                <li><strong>Store:</strong> land raw data in a lake and/or curated tables in a warehouse/lakehouse
                (often a medallion bronze/silver/gold layering)</li>
                <li><strong>Serve:</strong> expose to BI dashboards, ML training/features, and data APIs</li>
            </ol>
            <p>Reliability comes from idempotent, replayable steps; scalability from partitioning and distributed
            processing; maintainability from schema management, lineage, and observability.</p>`,
            code: `// Conceptual streaming aggregation (e.g., Kafka Streams / Flink style)
// Continuously compute per-minute order totals from an event stream.
//
// stream(orders)
//   .filter(o => o.status == "completed")
//   .keyBy(o => o.region)
//   .window(TumblingWindow.of(1 minute))     // bounded windows over unbounded stream
//   .aggregate(sum(o => o.amount))
//   .to("region-revenue-per-minute")          // sink for dashboards
//
// Key concerns: event-time vs processing-time, late/out-of-order events
// (watermarks), windowing, and exactly-once via checkpointing + idempotent sinks.`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>The medallion architecture (bronze/silver/gold) for organizing a lakehouse:</p>`,
            mermaid: `flowchart LR
    Raw[Sources] --> Bronze[Bronze<br/>raw, immutable, as-ingested]
    Bronze --> Silver[Silver<br/>cleaned, conformed, deduped]
    Silver --> Gold[Gold<br/>aggregated, business-ready]
    Gold --> BI[BI / ML / APIs]
    style Bronze fill:#fed7aa,color:#1e293b
    style Silver fill:#e2e8f0,color:#1e293b
    style Gold fill:#fde68a,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Patterns for ingestion, idempotency, and choosing batch vs stream:</p>`,
            tabs: [
                {
                    label: 'Idempotent Pipeline Step',
                    code: `// Pipelines reprocess/replay data; steps must be idempotent so re-runs
// don't double-count. Use deterministic keys + upsert (merge), not append.
//
// BAD: append on each run -> duplicates on retry/replay
// INSERT INTO daily_revenue SELECT date, SUM(amount) FROM orders ...
//
// GOOD: idempotent MERGE keyed by the partition (date)
// MERGE INTO daily_revenue t
// USING (SELECT date, SUM(amount) AS rev FROM orders GROUP BY date) s
//   ON t.date = s.date
// WHEN MATCHED THEN UPDATE SET t.rev = s.rev
// WHEN NOT MATCHED THEN INSERT (date, rev) VALUES (s.date, s.rev);
// Re-running for the same date overwrites, never duplicates.`,
                    language: 'sql'
                },
                {
                    label: 'CDC Ingestion',
                    code: `// Change Data Capture: stream DB changes into the pipeline without
// hammering the source DB with queries.
//
// Debezium reads the database transaction log (WAL/binlog) and publishes
// row-level change events (insert/update/delete) to Kafka topics:
//
//   orders.public.orders -> { op: "u", before: {...}, after: {...}, ts }
//
// Downstream consumers build read models, sync the warehouse, or trigger
// stream processing - all from the authoritative change log, in order,
// with at-least-once delivery (so consumers must be idempotent).`,
                    language: 'csharp'
                },
                {
                    label: 'Batch vs Stream Choice',
                    code: `// Decision guide:
//
// Use BATCH when:
//   - results can tolerate minutes/hours latency (daily reports, ML training)
//   - you process large bounded datasets and want simplicity + high throughput
//   - reprocessing/backfill of historical data is common
//
// Use STREAM when:
//   - you need low-latency results (fraud detection, live dashboards, alerts)
//   - data is unbounded and continuous
//   - you can handle complexity: windowing, watermarks, out-of-order events
//
// Many systems use BOTH (Lambda) or a unified stream engine for both (Kappa).`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Make Pipeline Steps Idempotent and Replayable</h4>
            <p>Use deterministic keys and upserts/merges so reruns and replays (after failures or backfills) don't
            double-count. Pipelines fail and get re-run — design for it.</p>
            <h4>Do: Keep Raw Data (Immutable Bronze Layer)</h4>
            <p>Land raw, immutable source data first; derive cleaned/aggregated layers from it. You can always
            reprocess from raw when logic changes — you can't recover data you transformed away.</p>
            <h4>Do: Choose Batch vs Stream by Latency Need</h4>
            <p>Don't add streaming complexity if a nightly batch meets the requirement. Use streaming where low
            latency genuinely matters.</p>
            <h4>Do: Manage Schema Evolution</h4>
            <p>Use a schema registry and backward-compatible changes so producers and consumers evolve
            independently without breaking the pipeline.</p>
            <h4>Do: Build in Observability &amp; Data Quality</h4>
            <p>Monitor freshness, volume, schema, and quality (nulls, ranges); alert on anomalies. Track lineage so
            you know where data came from.</p>
            <h4>Do: Handle Late and Out-of-Order Data (Streaming)</h4>
            <p>Use event-time processing with watermarks and allowed lateness, not naive processing-time, or your
            windowed results will be wrong.</p>`,
            callout: {
                type: 'tip',
                title: 'Keep the Raw Layer',
                text: 'Always preserve raw, immutable source data (the bronze layer) before transforming. When your business logic changes or a bug is found, you can reprocess everything from raw. If you only kept the transformed result, that data and those decisions are lost forever.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Non-Idempotent Pipelines</h4>
            <p>Append-only steps double-count on retries/replays. Use idempotent upserts keyed deterministically.</p>
            <h4>Mistake: Streaming Everything</h4>
            <p>Streaming adds real complexity (windowing, watermarks, exactly-once). Using it where a daily batch
            would do is over-engineering.</p>
            <h4>Mistake: Processing-Time Windows for Event Data</h4>
            <p>Aggregating by when data <em>arrived</em> rather than when events <em>happened</em> produces wrong
            results with late/out-of-order data. Use event time + watermarks.</p>
            <h4>Mistake: No Raw Layer</h4>
            <p>Transforming on ingest and discarding raw data means you can't reprocess when logic changes or bugs
            surface. Always land raw first.</p>
            <h4>Mistake: Ignoring Schema Evolution</h4>
            <p>A producer adding/changing a field silently breaks consumers. Use a schema registry with
            compatibility rules.</p>
            <h4>Mistake: No Data Quality Monitoring</h4>
            <p>Silent data corruption (nulls, duplicates, drift) flows into dashboards and ML, producing wrong
            decisions nobody notices until much later.</p>`,
            code: `// Processing-time bug: counts events by arrival, not occurrence
// A network delay makes 2pm events arrive at 3pm -> counted in the wrong window.
//
// FIX: window by EVENT time with a watermark for lateness
// stream.assignTimestampsAndWatermarks(eventTime, allowedLateness: 5 minutes)
//       .window(TumblingWindow.of(1 hour))   // groups by when it HAPPENED
// Late events within allowed lateness still land in the correct window.`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Analytics &amp; BI</h4>
            <p>Companies pipe events and CDC into a warehouse/lakehouse, transforming via batch (dbt/Spark) into
            curated tables that power dashboards and reporting.</p>
            <h4>Real-Time Fraud &amp; Monitoring</h4>
            <p>Stream processing (Flink/Kafka Streams) scores transactions or telemetry in real time to flag fraud,
            anomalies, and trigger alerts within milliseconds.</p>
            <h4>Recommendations &amp; ML Features</h4>
            <p>Feature pipelines (batch for training, stream for online features) feed recommendation and ranking
            models; feature stores serve consistent features to training and inference.</p>
            <h4>IoT &amp; Telemetry</h4>
            <p>Millions of device events stream in for real-time aggregation and are also landed in a lake for
            historical/batch analysis — a classic batch+stream combination.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Batch vs stream, and lake vs warehouse vs lakehouse:</p>`,
            table: {
                headers: ['Dimension', 'Batch', 'Stream'],
                rows: [
                    ['Latency', 'Minutes to hours', 'Milliseconds to seconds'],
                    ['Data', 'Bounded (finite sets)', 'Unbounded (continuous)'],
                    ['Throughput', 'Very high', 'High'],
                    ['Complexity', 'Lower', 'Higher (windows, watermarks)'],
                    ['Reprocessing', 'Easy (re-run job)', 'Harder (replay from log)'],
                    ['Use case', 'Reports, ML training, ETL', 'Fraud, alerts, live dashboards'],
                    ['Tools', 'Spark, dbt, Hadoop', 'Flink, Kafka Streams, Spark Streaming']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Scaling data systems is about parallelism, locality, and avoiding skew:</p>
            <h4>Partitioning &amp; Parallelism</h4>
            <p>Distributed processing (Spark/Flink) partitions data across workers. Throughput scales with partitions
            — but a bad partition/shuffle strategy bottlenecks everything.</p>
            <h4>Data Skew</h4>
            <p>If one key (a hot customer, a null) holds disproportionate data, one worker does most of the work
            while others idle. Mitigate with salting, repartitioning, or skew-aware joins.</p>
            <h4>Shuffle Cost</h4>
            <p>Operations that move data across the network (joins, group-bys, repartitions) are the expensive part
            of distributed jobs. Minimize shuffles; broadcast small tables; pre-partition by join key.</p>
            <h4>Columnar Formats &amp; Pushdown</h4>
            <p>Columnar storage (Parquet/ORC) with predicate/column pushdown reads only needed columns/partitions —
            massive I/O savings for analytics. Partition data by common filter columns (e.g., date).</p>`,
            callout: {
                type: 'warning',
                title: 'Data Skew Kills Distributed Jobs',
                text: 'A job that should run in parallel can be dominated by a single hot key (one popular product, a null join key), so one worker processes most of the data while the rest finish early and idle. Detect skew in the job\u2019s stage metrics and mitigate with salting, repartitioning, or skew-aware joins.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Data pipelines need correctness, quality, and reliability testing.</p>
            <h4>Unit-Test Transformations</h4>
            <p>Test transformation logic on small fixed inputs with known expected outputs — pure functions over
            data are very testable.</p>
            <h4>Data Quality Tests (in pipeline)</h4>
            <p>Assert expectations on the data itself: not-null, uniqueness, ranges, row-count deltas, referential
            integrity (tools like Great Expectations, dbt tests). Fail or quarantine on violation.</p>
            <h4>Idempotency &amp; Replay Tests</h4>
            <p>Verify that re-running a step produces the same result (no duplicates) — essential given pipelines are
            re-run on failure.</p>`,
            code: `// dbt-style data quality tests (declarative assertions on the data)
# models/schema.yml
# models:
#   - name: daily_revenue
#     columns:
#       - name: date
#         tests: [unique, not_null]        # no duplicate dates, never null
#       - name: revenue
#         tests:
#           - not_null
#           - dbt_utils.accepted_range: { min_value: 0 }   # revenue >= 0
//
// Run on every pipeline run; a failing test blocks publishing bad data
// to the gold/business-ready layer.`,
            language: 'sql'
        },
        {
            title: 'Interview Tips',
            content: `<p>Data-intensive design appears in senior/data-focused system design rounds:</p>
            <ul>
                <li><strong>Frame with the three pillars</strong> — reliability, scalability, maintainability</li>
                <li><strong>Choose batch vs stream by latency need;</strong> don't stream by default</li>
                <li><strong>Stress idempotency and keeping raw data</strong> — pipelines fail and re-run</li>
                <li><strong>Know lake vs warehouse vs lakehouse</strong> and ETL vs ELT</li>
                <li><strong>Mention event-time/watermarks</strong> for streaming correctness</li>
                <li><strong>Know Lambda vs Kappa</strong> architectures</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Lambda vs Kappa',
                text: 'Lambda architecture runs a batch layer (accurate, high-latency) AND a speed/stream layer (fast, approximate), merging results \u2014 powerful but you maintain two codebases. Kappa simplifies by using a single stream-processing path for everything, reprocessing by replaying the log. Mentioning this trade-off signals depth.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Books</h4>
            <ul>
                <li><em>Designing Data-Intensive Applications</em> by Martin Kleppmann (essential)</li>
                <li><em>Fundamentals of Data Engineering</em> by Reis &amp; Housley</li>
                <li><em>Streaming Systems</em> by Akidau, Chernyak, Lax</li>
            </ul>
            <h4>Tools &amp; Concepts</h4>
            <ul>
                <li>Apache Spark, Flink, Kafka / Kafka Streams</li>
                <li>dbt, Airflow/Dagster (orchestration), Debezium (CDC)</li>
                <li>Delta Lake / Apache Iceberg (lakehouse table formats)</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Three pillars (DDIA):</strong> reliability, scalability, maintainability</li>
                <li><strong>Batch</strong> = high-throughput, high-latency, bounded; <strong>stream</strong> = low-latency, unbounded, more complex</li>
                <li><strong>Make pipeline steps idempotent and replayable;</strong> they fail and re-run</li>
                <li><strong>Keep raw immutable data (bronze)</strong> so you can always reprocess</li>
                <li><strong>Lake (raw, schema-on-read), warehouse (structured SQL), lakehouse (both);</strong> ETL vs ELT</li>
                <li><strong>Stream correctness</strong> needs event-time processing + watermarks for late data</li>
                <li><strong>Lambda (batch+stream) vs Kappa (single stream path)</strong> architectures</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Design a Real-Time Analytics Pipeline</h4>
            <p>Design a pipeline that ingests clickstream events and serves both real-time and historical analytics:</p>
            <ol>
                <li>Define ingestion (events -> durable buffer like Kafka) and expected volume</li>
                <li>Decide what needs streaming (live dashboards, alerts) vs batch (daily reports, ML training)</li>
                <li>Design storage layers (raw lake -> cleaned -> aggregated; or medallion bronze/silver/gold)</li>
                <li>Ensure idempotency so retries/replays don't double-count</li>
                <li>Handle late/out-of-order events with event-time windows + watermarks</li>
                <li>Add data quality checks and freshness monitoring; decide Lambda vs Kappa and justify</li>
            </ol>`,
            code: `// Sketch:
// Sources -> Kafka (durable buffer)
//   -> Stream (Flink): event-time windowed aggregates -> live dashboard
//   -> Sink raw to lake (bronze, immutable)
// Batch (Spark/dbt nightly): bronze -> silver (clean) -> gold (aggregates) -> warehouse
// Idempotent MERGE keyed by (date/window); schema registry for evolution
// Data quality tests gate the gold layer; monitor freshness/volume/skew
// Decide: Kappa (one stream path + replay) vs Lambda (batch+speed). Justify.`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> When would you choose stream processing over batch?<br/>
                    <em>A: When you need low-latency results on continuous, unbounded data \u2014 fraud detection, live
                    dashboards, real-time alerts. Batch suits high-throughput, latency-tolerant work like daily reports
                    and ML training.</em></li>
                <li><strong>Q:</strong> Why must data pipeline steps be idempotent?<br/>
                    <em>A: Pipelines fail and are re-run, and streams deliver at-least-once. Without idempotency
                    (deterministic keys + upsert/merge), retries and replays double-count data. Idempotent steps make
                    re-running safe.</em></li>
                <li><strong>Q:</strong> Why keep a raw, immutable data layer?<br/>
                    <em>A: So you can reprocess everything from source when business logic changes or a bug is found.
                    If you only kept transformed data, that information is lost permanently.</em></li>
                <li><strong>Q:</strong> What is the difference between Lambda and Kappa architectures?<br/>
                    <em>A: Lambda runs separate batch (accurate) and stream (fast) layers and merges them \u2014 two codebases.
                    Kappa uses a single stream-processing path for everything and reprocesses by replaying the log \u2014
                    simpler to maintain.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'What is the difference between batch and stream processing, and when do you use each?',
            difficulty: 'easy',
            answer: `<p><strong>Batch processing</strong> handles large, bounded datasets on a schedule — high throughput
            but high latency (minutes to hours). <strong>Stream processing</strong> handles unbounded data
            continuously as it arrives — low latency (sub-second to seconds) but more complex.</p>
            <p>Use <strong>batch</strong> when latency can be minutes/hours: daily reports, ML training, large ETL,
            and easy reprocessing. Use <strong>stream</strong> when you need results fast: fraud detection, live
            dashboards, real-time alerts. Many systems use both.</p>`,
            explanation: 'Batch is like doing all your laundry once a week (efficient, but you wait). Streaming is washing each item as it gets dirty (immediate, but more constant effort and coordination).',
            bestPractices: ['Default to batch unless low latency is required', 'Use streaming for real-time needs', 'Consider hybrid (Lambda/Kappa) when both are needed'],
            commonMistakes: ['Streaming everything (unneeded complexity)', 'Using batch where real-time is required'],
            interviewTip: 'Anchor the choice on the latency requirement and note streaming\u2019s added complexity (windows/watermarks) as the cost.',
            followUp: ['What makes streaming more complex?', 'What is the Lambda architecture?']
        },
        {
            question: 'Explain ETL vs ELT and the data lake / warehouse / lakehouse distinction.',
            difficulty: 'medium',
            answer: `<p><strong>ETL</strong> (Extract, Transform, Load) transforms data <em>before</em> loading it into the
            destination — classic for warehouses with limited compute. <strong>ELT</strong> (Extract, Load,
            Transform) loads raw data first and transforms it <em>inside</em> the destination using its scalable
            compute — the modern cloud pattern, enabling reprocessing from raw.</p>
            <p>Storage:</p>
            <ul>
                <li><strong>Data warehouse:</strong> structured, schema-on-write, SQL-optimized analytics (Snowflake,
                BigQuery, Redshift).</li>
                <li><strong>Data lake:</strong> raw, any format, schema-on-read, cheap object storage — flexible but
                can become a "data swamp" without governance.</li>
                <li><strong>Lakehouse:</strong> lake storage plus warehouse-like ACID tables and performance (Delta
                Lake, Iceberg) — the converging modern approach.</li>
            </ul>`,
            explanation: 'ETL is cooking ingredients before putting them in the fridge; ELT is storing raw ingredients and cooking when needed (so you can cook different dishes later). A warehouse is a tidy pantry of prepared meals; a lake is a giant walk-in of raw ingredients; a lakehouse is a walk-in with the organization and labeling of a pantry.',
            bestPractices: ['Prefer ELT in the cloud to keep raw data and leverage warehouse compute', 'Govern the lake to avoid a swamp', 'Use lakehouse table formats for ACID + performance on lake storage'],
            commonMistakes: ['Transforming away raw data (can\u2019t reprocess)', 'Ungoverned data lake -> swamp', 'Forcing structured-only tools onto semi/unstructured data'],
            interviewTip: 'Tie ELT to "keep raw data, transform with scalable compute" and position the lakehouse as the convergence of lake flexibility and warehouse reliability.',
            followUp: ['Why does ELT enable easier reprocessing?', 'What is a data swamp and how do you prevent it?']
        },
        {
            question: 'How do you design a data pipeline that is reliable and correct despite failures and late data?',
            difficulty: 'hard',
            answer: `<p>Reliability and correctness in pipelines come from a few deliberate design choices:</p>
            <ul>
                <li><strong>Idempotency:</strong> make every step safe to re-run using deterministic keys and
                upsert/merge (not append), so retries and replays never double-count.</li>
                <li><strong>Durable, replayable ingestion:</strong> buffer in a durable log (Kafka) so you can replay
                from an offset after a failure; keep an immutable raw (bronze) layer to reprocess from source.</li>
                <li><strong>Exactly-once effect:</strong> achieved via at-least-once delivery + idempotent sinks (or
                transactional/checkpointed processing in Flink), since true exactly-once across systems is hard.</li>
                <li><strong>Event-time processing + watermarks:</strong> window by when events <em>happened</em>, with
                allowed lateness, so out-of-order/late data lands in the correct window.</li>
                <li><strong>Schema management:</strong> a schema registry with backward-compatible evolution so a
                producer change doesn't break consumers.</li>
                <li><strong>Data quality + observability:</strong> automated quality checks (not-null, ranges,
                uniqueness), freshness/volume monitoring, lineage, and alerting; quarantine bad data rather than
                propagating it.</li>
                <li><strong>Dead-letter handling:</strong> route un-processable records aside for inspection instead
                of blocking the pipeline.</li>
            </ul>`,
            explanation: 'A reliable pipeline is like a factory line with checkpoints: parts arrive on a recorded conveyor you can rewind (durable log + replay), each station can safely redo its work without duplicating output (idempotency), late parts are slotted into the correct batch by their timestamp (event-time + watermarks), defective parts are pulled aside (dead-letter + quality checks), and inspectors continuously verify quality (monitoring).',
            bestPractices: ['Idempotent, deterministic, upsert-based steps', 'Durable replayable log + immutable raw layer', 'Event-time windows with watermarks for late data', 'Schema registry with compatibility rules', 'Data quality gates + freshness monitoring + lineage', 'Dead-letter queue for bad records'],
            commonMistakes: ['Append-based steps that double-count on replay', 'Processing-time windows (wrong results for late data)', 'No raw layer to reprocess from', 'No schema governance; silent consumer breakage', 'No data quality monitoring; silent corruption'],
            interviewTip: 'Lead with idempotency + replayability and event-time/watermarks \u2014 the two ideas that most distinguish someone who has run real pipelines. Mention exactly-once = at-least-once + idempotent sinks to show you know true exactly-once is hard.',
            followUp: ['How does Flink achieve exactly-once with checkpoints?', 'What is a watermark and how do you choose allowed lateness?', 'How do you backfill historical data safely?'],
            seniorPerspective: 'Two principles save the most pain in production pipelines: keep raw data immutable and make everything idempotent. The raw layer means a logic bug is recoverable \u2014 you fix the transform and reprocess \u2014 instead of being permanent data loss. Idempotency means I can fearlessly re-run a failed job or replay a stream without corrupting downstream counts, which is essential because at scale something is always failing and being retried. The subtle one that bites teams is event-time vs processing-time: if you window by arrival time, a brief delay silently misattributes data to the wrong window, and the dashboards are quietly wrong \u2014 so I always design windowing around event time with explicit watermarks and allowed lateness.'
        }
    ,
        {
            question: 'When would you choose batch processing vs stream processing, and how do Lambda and Kappa architectures relate?',
            difficulty: 'advanced',
            answer: `<p><strong>Batch</strong> processes bounded data on a schedule \u2014 high throughput, high latency, simple to reason about (nightly ETL, reports). <strong>Stream</strong> processes unbounded events continuously \u2014 low latency, more complex (real-time dashboards, fraud detection, alerts).</p>
            <ul>
                <li><strong>Lambda architecture</strong> \u2014 runs both: a batch layer for accurate, complete historical views plus a speed (streaming) layer for low-latency approximate results, merged at query time. Powerful but you maintain two codebases.</li>
                <li><strong>Kappa architecture</strong> \u2014 a single streaming pipeline; reprocessing history is done by replaying the event log through the same stream code. Simpler, favored when your stream engine can also handle reprocessing.</li>
            </ul>`,
            explanation: 'Batch is doing the laundry once a day in big loads; streaming is washing each item as it arrives. Lambda runs both machines and reconciles; Kappa says "just use one fast machine and re-run the pile when needed".',
            code: `// Decision guide
// latency tolerant, complete/accurate, periodic   -> BATCH (Spark, nightly ETL)
// low-latency, continuous, event-driven           -> STREAM (Kafka + Flink)
// need both accurate history + real-time           -> LAMBDA (batch + speed layers)
// one codebase, replay log to reprocess history    -> KAPPA (stream-only)`,
            language: 'javascript',
            bestPractices: ['Use batch for periodic, throughput-oriented, latency-tolerant work', 'Use streaming for low-latency, continuous, event-driven needs', 'Prefer Kappa (stream-only + replay) to avoid dual codebases when feasible', 'Keep transformations idempotent so reprocessing/replay is safe'],
            commonMistakes: ['Forcing streaming where a simple nightly batch suffices (needless complexity)', 'Maintaining Lambda\u2019s two codebases when Kappa would do', 'Non-idempotent transforms that corrupt data on replay/reprocess', 'Ignoring late-arriving/out-of-order events in streaming'],
            interviewTip: 'Define batch vs stream by data boundedness and latency, then position Lambda (two layers, accurate+fast) vs Kappa (one stream, replay to reprocess). Note Kappa\u2019s appeal is a single codebase.',
            followUp: ['How do you handle late-arriving events in a stream?', 'What makes reprocessing safe in Kappa?', 'When is Lambda still worth its complexity?'],
            seniorPerspective: 'I lean Kappa when the stream engine can replay the log to rebuild state, because maintaining Lambda\u2019s parallel batch and speed code paths is a perennial source of "the two layers disagree" bugs. Idempotent transforms make replay a non-event.',
            architectPerspective: 'The batch/stream choice is really about the latency the business needs versus the complexity you can sustain. Designing transforms to be idempotent and replayable decouples that decision, letting the same logic serve real-time and historical reprocessing.'
        },
        {
            question: 'Why is idempotency critical in data pipelines, and how do you achieve it?',
            difficulty: 'hard',
            answer: `<p>Distributed pipelines deliver <strong>at-least-once</strong> by default \u2014 retries, replays, and consumer restarts mean the same event is processed more than once. Without idempotency that causes double-counting, duplicate rows, and corrupted aggregates.</p>
            <p>Techniques:</p>
            <ul>
                <li><strong>Idempotency keys / dedup</strong> \u2014 track processed event ids and skip duplicates.</li>
                <li><strong>Upserts / deterministic keys</strong> \u2014 write by a natural/derived key so re-processing overwrites rather than appends.</li>
                <li><strong>Idempotent aggregations</strong> \u2014 design so reapplying an event is a no-op (e.g., set-to-value, or store per-event contributions).</li>
                <li><strong>Exactly-once frameworks</strong> \u2014 Flink/Kafka transactions provide exactly-once <em>effects</em> via checkpoints + transactional sinks.</li>
            </ul>`,
            explanation: 'It is like processing checks: if the same check gets handed to you twice, you must recognize its number and not deposit it twice. The check number is the idempotency key.',
            code: `// Idempotent upsert keyed by a deterministic event id (no double counting)
// INSERT INTO daily_totals (day, metric, value)
// VALUES (@day, @metric, @value)
// ON CONFLICT (day, metric) DO UPDATE SET value = EXCLUDED.value;
//
// Dedup consumer: skip already-seen event ids
// if (await store.SeenAsync(evt.Id)) return;
// await store.MarkSeenAsync(evt.Id);
// process(evt);`,
            language: 'sql',
            bestPractices: ['Assume at-least-once delivery and design every stage to be idempotent', 'Use deterministic keys + upserts so reprocessing overwrites, not appends', 'Dedup by event id where upsert is not possible', 'Lean on exactly-once frameworks (checkpoints + transactional sinks) when needed'],
            commonMistakes: ['Assuming exactly-once delivery and appending blindly', 'Aggregations that double-count on retry/replay', 'Random surrogate keys that make duplicates look distinct', 'Ignoring idempotency until a replay corrupts the warehouse'],
            interviewTip: 'State that pipelines are at-least-once, so processing must be idempotent, then give concrete techniques (dedup keys, upserts, idempotent aggregates). Distinguish exactly-once delivery (hard) from exactly-once effects (achievable).',
            followUp: ['What is the difference between exactly-once delivery and effects?', 'How do upserts make reprocessing safe?', 'How does Flink achieve exactly-once?'],
            seniorPerspective: 'I treat idempotency as the price of admission for any pipeline, because replays and retries are not edge cases \u2014 they are routine. Deterministic keys plus upserts make reprocessing the whole history a safe, boring operation instead of a data-corruption incident.',
            architectPerspective: 'Idempotency is what makes at-least-once delivery operationally safe and enables Kappa-style replay. It is a foundational property I design in from the start, because retrofitting it into a pipeline that already double-counts is painful and error-prone.'
        },
        {
            question: 'What are the trade-offs between a data lake, a data warehouse, and a lakehouse?',
            difficulty: 'advanced',
            answer: `<p>They differ in schema discipline, cost, and workload fit:</p>
            <ul>
                <li><strong>Data warehouse</strong> \u2014 structured, schema-on-write, optimized for fast SQL analytics/BI (Snowflake, BigQuery, Redshift). Great query performance and governance; less flexible for raw/unstructured data, higher storage cost.</li>
                <li><strong>Data lake</strong> \u2014 raw data of any type, schema-on-read, cheap object storage (S3/ADLS). Flexible and cheap for ML/exploration, but can become a "data swamp" without governance, and querying is slower.</li>
                <li><strong>Lakehouse</strong> \u2014 adds warehouse-like features (ACID transactions, schema enforcement, performance) on top of lake storage via table formats like Delta Lake / Iceberg / Hudi \u2014 aiming for one platform for BI + ML.</li>
            </ul>`,
            explanation: 'A warehouse is a meticulously organized library (everything cataloged, fast to find); a lake is a giant warehouse of unopened boxes (cheap, flexible, easy to lose things); a lakehouse adds a catalog and rules on top of the boxes so it behaves like the library.',
            code: `// Rough fit
// BI / dashboards / known schemas        -> WAREHOUSE (Snowflake/BigQuery)
// raw + unstructured + ML/exploration     -> LAKE (S3/ADLS + Parquet)
// one platform, ACID + BI + ML on lake     -> LAKEHOUSE (Delta/Iceberg/Hudi)`,
            language: 'javascript',
            bestPractices: ['Use a warehouse for governed, performant SQL/BI on structured data', 'Use a lake for cheap storage of raw/unstructured data and ML', 'Adopt a lakehouse (Delta/Iceberg) to unify BI + ML and get ACID on lake storage', 'Apply cataloging/governance to prevent a lake becoming a swamp'],
            commonMistakes: ['Dumping everything in a lake with no catalog/governance (data swamp)', 'Forcing unstructured/ML workloads into a rigid warehouse', 'Ignoring query-performance differences between lake and warehouse', 'Maintaining separate lake + warehouse copies when a lakehouse would unify them'],
            interviewTip: 'Contrast on schema-on-write vs schema-on-read, cost, and workload (BI vs ML). Positioning the lakehouse as "ACID + schema enforcement on cheap lake storage" shows current knowledge.',
            followUp: ['What problem do table formats like Iceberg/Delta solve?', 'How do you prevent a data swamp?', 'When is a separate warehouse still justified?'],
            seniorPerspective: 'I have watched ungoverned lakes rot into swamps where nobody trusts the data. The lakehouse pattern appealed precisely because it brings schema enforcement and ACID to lake storage, so we stop maintaining two copies and two governance models.',
            architectPerspective: 'The choice shapes the entire analytics platform: governance, cost, and which teams (BI vs ML) it serves. The industry trend toward lakehouse reflects a desire to unify those workloads on one governed, cost-efficient storage layer rather than syncing a lake and a warehouse.'
        },
        {
            question: 'How do you design a data pipeline that handles late-arriving events and out-of-order data?',
            difficulty: 'hard',
            answer: `<p>In distributed systems, events frequently arrive late or out of order due to network delays, buffering, producer retries, and timezone issues. A robust pipeline must handle this without losing data or producing incorrect results.</p>
            <h4>Core Concepts:</h4>
            <ul>
                <li><strong>Event time vs Processing time</strong>: Always process based on when the event <em>occurred</em> (event time), not when it <em>arrived</em> (processing time). Embed timestamps in events at the source.</li>
                <li><strong>Watermarks</strong>: A declaration of "I believe all events with timestamp ≤ W have arrived." Watermarks advance as the system gains confidence. Events arriving after the watermark are "late."</li>
                <li><strong>Allowed lateness</strong>: A grace period beyond the watermark during which late events are still accepted and trigger recomputation. After this window, events are dropped or sent to a dead-letter queue.</li>
                <li><strong>Windowing with triggers</strong>: Tumbling/sliding windows aggregate events. Early triggers emit partial results; late triggers update results when late events arrive.</li>
            </ul>
            <h4>Implementation Patterns:</h4>
            <ul>
                <li><strong>Idempotent processing</strong>: Late events may be duplicates. Use event IDs for deduplication.</li>
                <li><strong>Retractable results</strong>: When late data changes an aggregation, emit a correction (retraction + new value) downstream.</li>
                <li><strong>Dead-letter queue</strong>: Events arriving after allowed lateness go to a DLQ for manual review or batch reprocessing.</li>
                <li><strong>Reprocessing capability</strong>: Store raw events immutably so you can replay the pipeline from scratch if needed.</li>
            </ul>`,
            bestPractices: ['Always use event time, never processing time, for windowed aggregations', 'Set allowed lateness based on observed real-world delays (measure before configuring)', 'Store raw events immutably for reprocessing capability', 'Design downstream consumers to handle updated/corrected results'],
            commonMistakes: ['Using processing time for aggregations (late events distort the wrong window)', 'No allowed lateness (any late event is silently dropped, losing data)', 'Watermark too aggressive (drops legitimate late events) or too conservative (delays all output)', 'No reprocessing strategy (when logic changes, historical data is permanently wrong)'],
            interviewTip: 'Use the terms "event time," "watermark," and "allowed lateness" precisely. The senior signal is explaining that late-arriving data is not an edge case but the normal condition in distributed systems, and your pipeline must handle it by design.',
            followUp: ['What is a watermark and how does it advance?', 'How do you handle corrections to already-emitted results?', 'What is the difference between triggers and watermarks?'],
            seniorPerspective: 'Every real-world streaming pipeline I have built deals with late data — mobile devices with intermittent connectivity, partner APIs with batch delays, events buffered during outages. I design for it from day one: event-time windowing, generous allowed lateness, DLQ for outliers, and the ability to replay from the raw event log.',
            architectPerspective: 'Late-arriving data is the fundamental challenge of stream processing. The architectural response is a layered defense: watermarks for normal variance, allowed lateness for reasonable delays, DLQ for outliers, and immutable raw storage for "start from scratch" reprocessing. This design accepts that streaming results are eventually correct rather than immediately perfect — and communicates that to downstream consumers.'
        },
        {
            question: 'Compare Lambda and Kappa architectures. When would you choose each?',
            difficulty: 'hard',
            answer: `<p>Both architectures address the challenge of processing large-scale data in both real-time and batch modes, but they differ fundamentally in complexity and operational model.</p>
            <h4>Lambda Architecture (Nathan Marz):</h4>
            <ul>
                <li><strong>Three layers</strong>: Batch layer (complete, accurate — MapReduce/Spark on all historical data), Speed layer (approximate, real-time — stream processing on recent data), Serving layer (merges batch + speed results for queries).</li>
                <li><strong>Pros</strong>: Batch layer guarantees correctness (recomputes everything); speed layer provides low-latency approximations.</li>
                <li><strong>Cons</strong>: Two separate codebases for the same logic (batch + stream); complex merge in serving layer; high operational overhead maintaining two parallel systems.</li>
            </ul>
            <h4>Kappa Architecture (Jay Kreps):</h4>
            <ul>
                <li><strong>Single layer</strong>: Everything is a stream. "Batch" is simply replaying the stream from the beginning with a new version of the processing logic.</li>
                <li><strong>Implementation</strong>: Immutable event log (Kafka with infinite retention or tiered storage) + stream processor (Flink, Kafka Streams). To fix logic or recompute, deploy new consumer that replays from offset 0.</li>
                <li><strong>Pros</strong>: One codebase, one processing paradigm. Simpler operations. Eventual consistency with the complete dataset via replay.</li>
                <li><strong>Cons</strong>: Replay of massive logs can be slow; some batch computations (ML training, graph analysis) are inherently batch-oriented and awkward as streams.</li>
            </ul>
            <h4>When to Choose:</h4>
            <ul>
                <li><strong>Lambda</strong>: When you need guaranteed-correct batch results AND real-time approximations, and the logic is complex enough that stream-only replay is impractical (e.g., ML model training, complex graph algorithms).</li>
                <li><strong>Kappa</strong>: When stream processing handles all your logic, log retention is feasible, and you want operational simplicity. Most event-driven microservices and real-time analytics fit this model.</li>
            </ul>`,
            bestPractices: ['Default to Kappa unless you have a specific batch-only computation need', 'If using Lambda, generate batch and speed logic from the same source (avoid two codebases)', 'Use Kafka with tiered storage or infinite retention as the immutable log for Kappa', 'Design serving layer to handle eventual consistency during Kappa replay'],
            commonMistakes: ['Building Lambda architecture when Kappa suffices (unnecessary complexity)', 'Two completely separate codebases in Lambda (results diverge, maintenance nightmare)', 'Kappa without sufficient log retention (cannot replay far enough to recompute)', 'Assuming replay is instant (large logs take hours/days to reprocess)'],
            interviewTip: 'Show you understand the historical context: Lambda was necessary before stream processing was mature. Kappa became viable with Kafka + Flink. The trade-off is operational simplicity (Kappa) vs guaranteed batch correctness (Lambda). Most modern systems prefer Kappa.',
            followUp: ['How does event sourcing relate to Kappa architecture?', 'What is tiered storage in Kafka and why does it enable Kappa?', 'How do you handle reprocessing in Kappa without affecting live traffic?'],
            seniorPerspective: 'I have migrated two teams from Lambda to Kappa by replacing the batch layer with Kafka log replay + Flink. The operational relief was immediate — one codebase, one monitoring stack, one mental model. The only Lambda holdout was an ML training pipeline that genuinely needed batch Spark jobs on historical data.',
            architectPerspective: 'The industry has largely moved toward Kappa for event-driven systems because stream processing matured (exactly-once Flink, Kafka tiered storage). I still see Lambda in data platform teams that serve both real-time dashboards and heavy batch analytics (ML, BI). The architectural question is whether your batch needs can be reframed as stream replay — if yes, Kappa wins on simplicity.'
        }
    ]
});
