PageData.register('arch-observability-practice', {
    title: 'Production Observability',
    description: 'Golden Signals, SLO/SLI/SLA frameworks, error budgets, alert design, runbooks, on-call practices, and dashboard engineering for principal engineers',
    sections: [
        {
            title: 'Introduction',
            content: `<p><strong>Production Observability</strong> at the architect/principal level is not about "how to configure Prometheus." It is about designing an observability SYSTEM that scales to hundreds of services, empowers teams to self-serve, drives reliability decisions through data, and keeps on-call engineers sane.</p>
<p>This topic covers the strategic and operational aspects: Golden Signals as the universal language, SLO frameworks as the reliability contract, error budgets as the decision mechanism, alert design that avoids fatigue, runbooks that enable fast resolution, and dashboard engineering that provides insight rather than noise.</p>
<p>The audience is staff/principal engineers who must design observability for an entire platform, not just one service.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>Production observability operates at three levels:</p>`,
            table: {
                headers: ['Level', 'Focus', 'Owner', 'Key Artifacts'],
                rows: [
                    ['Service Level', 'Individual service health', 'Service team', 'Service dashboard, RED metrics, health checks'],
                    ['Platform Level', 'Cross-service reliability', 'Platform/SRE team', 'SLO framework, error budgets, dependency graphs'],
                    ['Business Level', 'Customer-facing outcomes', 'Product + Engineering', 'Conversion funnels, revenue metrics, user journey traces']
                ]
            }
        },
        {
            title: 'Golden Signals',
            content: `<p>The <strong>Four Golden Signals</strong> (from Google SRE book) are the minimum metrics every service must emit. They answer: "Is this service healthy right now?"</p>
<ul>
<li><strong>Latency</strong> — Duration of requests. Separate successful vs failed request latency (failed requests may be fast — a 500 returned immediately isn't "low latency success").</li>
<li><strong>Traffic</strong> — Demand on the system. HTTP requests/sec, messages consumed/sec, active WebSocket connections.</li>
<li><strong>Errors</strong> — Rate of failed requests. Include explicit errors (HTTP 5xx) AND implicit errors (HTTP 200 but wrong content, timeout retries that succeeded).</li>
<li><strong>Saturation</strong> — How "full" the service is. Thread pool utilization, queue depth, memory pressure, connection pool exhaustion. The signal that predicts FUTURE failures.</li>
</ul>
<p><strong>Why these four?</strong> They cover all failure modes: user-facing degradation (latency/errors), capacity issues (traffic/saturation), and they work for ANY service type (HTTP APIs, Kafka consumers, batch jobs, databases).</p>`,
            mermaid: `graph TB
    subgraph "Golden Signals Dashboard Layout"
        direction TB
        A["Row 1: Latency<br/>p50 | p95 | p99 | error latency"]
        B["Row 2: Traffic<br/>rps | active connections | throughput"]
        C["Row 3: Errors<br/>5xx rate | timeout rate | business errors"]
        D["Row 4: Saturation<br/>CPU | memory | connection pool | queue depth"]
    end
    A --> B --> C --> D

    subgraph "Alert Triggers"
        E["SLO Burn Rate > 14.4x"]
        F["Saturation > 80%"]
        G["Error Rate > 5%"]
    end

    C --> E
    D --> F
    C --> G`
        },
        {
            title: 'SLO Framework Design',
            content: `<p>An SLO framework turns observability from "nice dashboards" into a <strong>reliability decision engine</strong>:</p>`,
            code: `// SLO-as-Code: Define SLOs in YAML per service (checked into service repo)
// Platform tooling reads these and auto-provisions Prometheus rules + Grafana alerts

// order-service/slo.yaml
service: order-service
owner: checkout-team
slos:
  - name: "Order API Availability"
    description: "Non-5xx responses for order endpoints"
    sli:
      type: ratio
      good: 'http_requests_total{service="order-service",status!~"5.."}'
      total: 'http_requests_total{service="order-service"}'
    target: 0.999          # 99.9%
    window: 30d            # Rolling 30-day window
    alerts:
      burn_rate_1h: 14.4   # Page: budget exhausted in 2 hours
      burn_rate_6h: 6.0    # Ticket: budget exhausted in 5 days
      
  - name: "Order API Latency"
    description: "Requests completing within 500ms"
    sli:
      type: ratio
      good: 'http_request_duration_seconds_bucket{service="order-service",le="0.5"}'
      total: 'http_request_duration_seconds_count{service="order-service"}'
    target: 0.99           # 99%
    window: 30d
    alerts:
      burn_rate_1h: 14.4
      burn_rate_6h: 6.0

  - name: "Order Processing Freshness"
    description: "Orders processed within 60 seconds of creation"
    sli:
      type: freshness
      metric: 'order_processing_lag_seconds'
      threshold: 60
    target: 0.995          # 99.5%
    window: 7d`,
            language: 'yaml'
        },
        {
            title: 'Error Budget Policy',
            content: `<p>Error budgets are the bridge between development velocity and reliability. The policy defines what happens when budgets are consumed:</p>
<table>
<tr><th>Budget Remaining</th><th>State</th><th>Actions</th></tr>
<tr><td>&gt;50%</td><td>Green</td><td>Ship features freely. Experiment. Take calculated risks.</td></tr>
<tr><td>25-50%</td><td>Yellow</td><td>Proceed with caution. Ensure rollback plans. Feature flags mandatory.</td></tr>
<tr><td>5-25%</td><td>Orange</td><td>Freeze risky changes. Focus on reliability improvements. Review recent incidents.</td></tr>
<tr><td>0-5%</td><td>Red</td><td>Feature freeze. All engineering effort on reliability. Only emergency fixes deployed.</td></tr>
<tr><td>Exhausted</td><td>SLO Breach</td><td>Postmortem required. Leadership review. Remediation plan before resuming features.</td></tr>
</table>
<p><strong>Key principle:</strong> Error budgets give teams PERMISSION to take risks when they have budget, and CLEAR boundaries when they don't. It removes the "move fast vs reliability" debate — the budget decides.</p>
<p><strong>Calculating remaining budget:</strong></p>`,
            code: `// Error budget calculation
// SLO: 99.9% availability over 30 days
// Total budget: 0.1% of requests can fail

double sloTarget = 0.999;
int windowDays = 30;
double totalMinutes = windowDays * 24 * 60; // 43,200 minutes

double budgetMinutes = totalMinutes * (1 - sloTarget); // 43.2 minutes
double consumedMinutes = GetDowntimeMinutesInWindow(); // e.g., 12 minutes

double budgetRemaining = (budgetMinutes - consumedMinutes) / budgetMinutes;
// budgetRemaining = (43.2 - 12) / 43.2 = 72.2% remaining → Green state

// Burn rate = how fast we're consuming budget
double burnRate = GetCurrentErrorRate() / (1 - sloTarget);
// If error rate is 0.5% and budget rate is 0.1%, burn rate = 5x
// At 5x burn rate, budget exhausts in 30 days / 5 = 6 days → Alert!`,
            language: 'csharp'
        },
        {
            title: 'Alert Design',
            content: `<p>Good alerts have these properties: <strong>actionable, relevant, timely, and infrequent enough to be trusted.</strong></p>
<h4>Alert Anti-Patterns (what kills on-call engineers):</h4>
<ul>
<li><strong>Symptom-based alerts</strong> — "CPU > 80%" fires constantly but requires no action. Alert on CUSTOMER IMPACT, not resource usage.</li>
<li><strong>No runbook</strong> — Alert fires at 3 AM, engineer has no idea what to do. Every alert must link to a runbook.</li>
<li><strong>Too many alerts</strong> — 50 alerts fire simultaneously during an incident. Use aggregation and correlation.</li>
<li><strong>Flapping alerts</strong> — Alert fires/resolves/fires every 2 minutes. Add hysteresis (must be bad for 5+ minutes to fire).</li>
</ul>
<h4>Alert Design Checklist:</h4>
<table>
<tr><th>Property</th><th>Question</th><th>Bad Example</th><th>Good Example</th></tr>
<tr><td>Actionable</td><td>Does someone need to DO something?</td><td>"Disk at 50%"</td><td>"Disk at 90% — will be full in 4 hours"</td></tr>
<tr><td>Relevant</td><td>Does it affect customers?</td><td>"GC pause 200ms"</td><td>"p99 latency SLO burn rate 10x"</td></tr>
<tr><td>Runbook</td><td>Is there a step-by-step guide?</td><td>No link</td><td>Link to wiki/runbook with diagnosis steps</td></tr>
<tr><td>Severity</td><td>Page vs ticket vs informational?</td><td>Everything is P1</td><td>P1=page, P2=ticket, P3=dashboard only</td></tr>
<tr><td>Owner</td><td>Who gets paged?</td><td>Generic "ops" team</td><td>Specific team that owns the service</td></tr>
</table>`
        },
        {
            title: 'Runbook Engineering',
            content: `<p>A runbook is a step-by-step guide for diagnosing and resolving a specific alert. It transforms tribal knowledge into executable procedures.</p>
<h4>Runbook Template:</h4>`,
            code: `# Runbook: Order Service — High Error Rate
# Alert: order-service-error-budget-burn-rate-high
# Severity: P1 (pages on-call)
# Owner: Checkout Team
# Last updated: 2024-03-15

## What This Means
The order service is returning errors faster than our SLO allows.
At current burn rate, we will breach our 99.9% SLO within 2 hours.

## Impact
- Customers cannot complete checkout
- Revenue impact: ~$X per minute of outage

## Diagnosis Steps

### Step 1: Check recent deployments
- Grafana: [Order Service Deploys](link)
- If a deploy happened in the last 30 minutes → likely cause → rollback

### Step 2: Check dependency health
- Dashboard: [Service Dependency Map](link)
- Check: Payment Service, Inventory Service, Database
- If a dependency is down → the error is upstream → escalate to that team

### Step 3: Check error logs
- Loki query: {service="order-service"} |= "error" | json | level="error"
- Look for: stack traces, timeout messages, connection refused

### Step 4: Check resource saturation
- Dashboard: [Order Service Resources](link)
- CPU > 90%? → Scale up pods (kubectl scale deployment order-service --replicas=6)
- Connection pool exhausted? → Check database connection count

## Common Fixes
1. Bad deploy → Rollback: kubectl rollout undo deployment/order-service
2. Database overload → Kill long-running queries + scale read replicas
3. Upstream timeout → Increase circuit breaker threshold temporarily
4. Memory leak → Restart pods: kubectl rollout restart deployment/order-service

## Escalation
- If not resolved in 15 minutes → page Engineering Manager
- If customer-facing impact confirmed → notify Support team in #incidents`,
            language: 'markdown'
        },
        {
            title: 'Dashboard Engineering',
            content: `<p>Dashboards are the UI of observability. Bad dashboards create confusion. Good dashboards enable 5-minute incident diagnosis.</p>
<h4>Dashboard Hierarchy (from broad to deep):</h4>
<ol>
<li><strong>Platform Overview</strong> — All services at a glance. Red/yellow/green per service. Entry point for incidents.</li>
<li><strong>Service Dashboard</strong> — Golden Signals for one service. Deployment markers. Top errors. Dependency health.</li>
<li><strong>Deep-Dive Dashboard</strong> — Specific subsystem: database queries, Kafka consumers, cache hit rates.</li>
<li><strong>Incident Dashboard</strong> — Created ad-hoc during incidents. Shows the specific metrics/traces relevant to THIS issue.</li>
</ol>
<h4>Dashboard Design Principles:</h4>
<ul>
<li><strong>Progressive disclosure</strong> — Overview → service → component. Don't put everything on one screen.</li>
<li><strong>Consistent layout</strong> — Every service dashboard has the same panel arrangement. Muscle memory during incidents.</li>
<li><strong>Time range awareness</strong> — Show last 1 hour by default. Include "last deploy" annotation for quick correlation.</li>
<li><strong>Actionable panels only</strong> — If a panel doesn't help you decide what to do next, remove it.</li>
<li><strong>Dashboard-as-code</strong> — Store Grafana JSON in git. Auto-provision via Terraform. No manual dashboard creation in production.</li>
</ul>`,
            mermaid: `graph TD
    A["Platform Overview Dashboard<br/>All services health matrix"] --> B["Order Service Dashboard<br/>Golden Signals + Dependencies"]
    A --> C["Payment Service Dashboard<br/>Golden Signals + Dependencies"]
    A --> D["Inventory Service Dashboard<br/>Golden Signals + Dependencies"]
    B --> E["Order DB Deep-Dive<br/>Query latency, connections, locks"]
    B --> F["Order Kafka Deep-Dive<br/>Consumer lag, partition balance"]
    C --> G["Payment Gateway Deep-Dive<br/>Provider latency, decline rates"]

    style A fill:#2196F3,color:#fff
    style B fill:#4CAF50,color:#fff
    style C fill:#4CAF50,color:#fff
    style D fill:#4CAF50,color:#fff
    style E fill:#FF9800,color:#fff
    style F fill:#FF9800,color:#fff
    style G fill:#FF9800,color:#fff`
        },
        {
            title: 'On-Call Practices',
            content: `<p>On-call is where observability meets human operations. Poor on-call burns out engineers. Good on-call is manageable and even educational.</p>
<h4>Healthy On-Call Indicators:</h4>
<ul>
<li><strong>Alert volume:</strong> &lt;2 pages per on-call shift (1 week). More = alert quality problem.</li>
<li><strong>MTTR:</strong> Most incidents resolved in &lt;30 minutes using runbooks.</li>
<li><strong>Sleep interruptions:</strong> &lt;1 per week. If more, fix the service or fix the alerts.</li>
<li><strong>Toil ratio:</strong> &lt;50% of on-call time is reactive. Rest is proactive reliability work.</li>
</ul>
<h4>On-Call Rotation Design:</h4>
<ul>
<li><strong>Primary + Secondary:</strong> Primary is paged first. Secondary is escalation (15-min no-ack).</li>
<li><strong>Rotation length:</strong> 1 week. Shorter = too much context switching. Longer = burnout.</li>
<li><strong>Handoff ritual:</strong> End-of-rotation handoff document: active incidents, things to watch, recent changes.</li>
<li><strong>Compensation:</strong> On-call pay + comp time for after-hours pages. Non-negotiable for retention.</li>
<li><strong>Blameless postmortems:</strong> Every P1 incident gets a postmortem. Focus on systemic fixes, not individual blame.</li>
</ul>`
        },
        {
            title: 'Interview Tips',
            content: `<p>Production observability questions are how companies identify truly senior engineers vs those who have only worked in lower environments:</p>`,
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For at Staff+ Level',
                text: `<ul>
<li><strong>Systems thinking</strong> — You don't just monitor one service; you think about observability as a PLATFORM that serves 50+ teams.</li>
<li><strong>SLO fluency</strong> — You can design SLOs, explain error budgets, and describe how they drive deployment decisions.</li>
<li><strong>Alert philosophy</strong> — You have opinions on alert design. You've eliminated alert fatigue. You know burn-rate alerting.</li>
<li><strong>Incident command experience</strong> — You've been the incident commander. You know the communication patterns, escalation paths, and postmortem process.</li>
<li><strong>Cost awareness</strong> — You've made trade-offs between observability coverage and cost. You know sampling strategies.</li>
<li><strong>Organizational influence</strong> — You've driven observability adoption across multiple teams. You know how to make the right thing the easy thing.</li>
</ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li>Golden Signals (Latency, Traffic, Errors, Saturation) are the universal language for service health</li>
<li>SLOs convert vague "reliability" goals into measurable, actionable targets with error budgets</li>
<li>Error budgets are a decision mechanism: budget remaining determines whether to ship features or fix reliability</li>
<li>Alert on customer impact (SLO burn rate), not symptoms (CPU/memory thresholds)</li>
<li>Every alert needs: severity, owner, runbook link, and clear action. No alert should be "just informational"</li>
<li>Dashboards should follow progressive disclosure: overview → service → deep-dive</li>
<li>On-call should be sustainable: &lt;2 pages per shift, runbooks for every alert, blameless postmortems</li>
<li>Observability at scale is a platform product: shared libraries, dashboard templates, SLO-as-code</li>
<li>The highest-leverage observability investment is organizational (adoption, standards) not technical (tools)</li>
</ul>`
        }
    ],
    questions: [
        {
            id: 'arch-obs-q1',
            level: 'senior',
            title: 'Explain the Four Golden Signals. Why are they considered the minimum for any production service?',
            answer: `<p><strong>The Four Golden Signals</strong> (from Google's SRE book) are:</p>
<ul>
<li><strong>Latency:</strong> How long requests take. Must separate successful vs failed request latency — a fast 500 error isn't "good latency."</li>
<li><strong>Traffic:</strong> How much demand the service handles. Requests/sec for APIs, messages/sec for consumers, connections for WebSocket services.</li>
<li><strong>Errors:</strong> Rate of failed requests. Include both explicit (5xx) and implicit (wrong response, successful retry after failure) errors.</li>
<li><strong>Saturation:</strong> How close to capacity. Thread pool usage, queue depth, memory pressure, connection pool fill. Predicts FUTURE failures before they happen.</li>
</ul>
<p><strong>Why they're the minimum:</strong></p>
<ul>
<li>Together they cover ALL failure modes: user-visible degradation (latency + errors) and capacity exhaustion (traffic + saturation)</li>
<li>They're universal — work for HTTP APIs, message consumers, batch jobs, databases</li>
<li>They enable meaningful alerting — "latency p99 > threshold AND error rate rising AND saturation > 80%" gives high-confidence alerts</li>
<li>They form the foundation for SLO definition (SLIs are typically derived from Golden Signals)</li>
</ul>
<p>Any service without these four signals is effectively invisible in production — you won't know it's failing until customers complain.</p>`
        },
        {
            id: 'arch-obs-q2',
            level: 'senior',
            title: 'What is an error budget and how does it drive engineering decisions?',
            answer: `<p>An <strong>error budget</strong> is the amount of unreliability your SLO allows. It's calculated as <code>1 - SLO target</code>.</p>
<p><strong>Example:</strong> SLO = 99.9% availability → Error budget = 0.1% = 43.2 minutes of downtime per 30-day window.</p>
<p><strong>How it drives decisions:</strong></p>
<ul>
<li><strong>Budget available (>25%):</strong> Ship features, experiment, deploy frequently. You have room for failures.</li>
<li><strong>Budget low (5-25%):</strong> Be cautious. Require feature flags, canary deploys, rollback plans for every change.</li>
<li><strong>Budget near-zero (<5%):</strong> Feature freeze. All engineering effort goes to reliability: fixing flaky tests, adding retries, improving degradation paths.</li>
<li><strong>Budget exhausted:</strong> SLO is breached. Mandatory postmortem. Remediation plan required before leadership approves resuming feature work.</li>
</ul>
<p><strong>The genius of error budgets:</strong> They end the "developers want speed vs SRE wants stability" conflict. Both sides agree on the SLO. The budget objectively tells you whether to prioritize features or reliability — no argument needed.</p>
<p><strong>Burn rate:</strong> How fast you're consuming budget. Burn rate of 1x = consuming at exactly the expected pace. Burn rate of 10x = you'll exhaust the budget 10x faster than planned → alert and intervene.</p>`
        },
        {
            id: 'arch-obs-q3',
            level: 'senior',
            title: 'How do you design alerts that avoid alert fatigue while still catching real incidents?',
            answer: `<p><strong>Alert fatigue</strong> is when too many low-quality alerts cause engineers to ignore ALL alerts, including real ones. It's the #1 operational risk in on-call teams.</p>
<p><strong>Design principles for effective alerts:</strong></p>
<ol>
<li><strong>Alert on SLO burn rate, not symptoms</strong>
<ul><li>Bad: "CPU > 80%" (fires constantly, often no customer impact)</li>
<li>Good: "Error budget burn rate > 14.4x over 1-hour window" (fires only when customers ARE impacted)</li></ul></li>
<li><strong>Multi-window burn-rate alerts</strong>
<ul><li>Short window (5 min) AND long window (1 hour) must both breach to fire</li>
<li>Prevents alerting on transient spikes while still catching sustained issues</li></ul></li>
<li><strong>Severity tiers with different channels</strong>
<ul><li>P1: Page immediately (SLO breach imminent)</li>
<li>P2: Slack + ticket (degradation, investigate within 4 hours)</li>
<li>P3: Dashboard annotation only (informational, review in next standup)</li></ul></li>
<li><strong>Every alert must be actionable</strong>
<ul><li>If the correct response to an alert is "do nothing," delete the alert</li>
<li>If it fires more than 5x/month with no action, it's noise — rework or remove</li></ul></li>
<li><strong>Monthly alert quality review</strong>
<ul><li>Review all alerts that fired: Was action taken? Was it useful?</li>
<li>Delete/rework alerts with low signal-to-noise ratio</li></ul></li>
</ol>`
        },
        {
            id: 'arch-obs-q4',
            level: 'lead',
            title: 'You are setting up SLOs for a new platform with 30 services. Walk through your approach from scratch.',
            answer: `<p><strong>Phased approach — start simple, iterate:</strong></p>
<p><strong>Phase 1: Identify critical user journeys (Week 1)</strong></p>
<ul>
<li>Map the top 5 user journeys (e.g., login, search, checkout, payment, account)</li>
<li>Identify which services are on the critical path for each journey</li>
<li>These 8-10 "critical path" services get SLOs first</li>
</ul>
<p><strong>Phase 2: Define SLIs (Week 2)</strong></p>
<ul>
<li>For each critical service, define 2-3 SLIs: availability (non-5xx ratio), latency (p99 < threshold), freshness (for async services)</li>
<li>SLIs must be measurable from EXISTING metrics. If you can't measure it today, add instrumentation first.</li>
<li>Start with server-side SLIs. Eventually add client-side SLIs (what the user actually experiences).</li>
</ul>
<p><strong>Phase 3: Set initial targets (Week 3)</strong></p>
<ul>
<li>Look at historical performance: if the service has been 99.95% available for 6 months, set SLO at 99.9% (slightly below actual — gives you budget to work with)</li>
<li>Never set SLO higher than you can maintain. 99.99% sounds good but gives only 4.3 minutes of budget per month — you'll always be in "red" state.</li>
<li>Align with business requirements: if the contract says 99.5%, internal SLO should be 99.9% (margin).</li>
</ul>
<p><strong>Phase 4: Implement alerting (Week 4)</strong></p>
<ul>
<li>Configure multi-window burn-rate alerts for each SLO</li>
<li>P1 (page): 14.4x burn rate over 1-hour window</li>
<li>P2 (ticket): 6x burn rate over 6-hour window</li>
<li>Build SLO status dashboard showing budget remaining per service</li>
</ul>
<p><strong>Phase 5: Operationalize (Month 2+)</strong></p>
<ul>
<li>Monthly SLO review: are targets appropriate? Too tight (always breaching) or too loose (never consuming budget)?</li>
<li>Tie error budgets to deployment policy</li>
<li>Expand to remaining 20 services over next quarter</li>
</ul>`
        },
        {
            id: 'arch-obs-q5',
            level: 'lead',
            title: 'What makes a good runbook? How do you ensure runbooks stay up-to-date as systems evolve?',
            answer: `<p><strong>A good runbook has these properties:</strong></p>
<ol>
<li><strong>Linked to a specific alert</strong> — Not a general "how to operate service X" doc. Each alert has its own focused runbook.</li>
<li><strong>Starts with impact and context</strong> — "This means customers cannot checkout. Revenue impact: ~$X/min." Urgency is immediately clear.</li>
<li><strong>Step-by-step diagnosis</strong> — Numbered steps with specific dashboard links, log queries, and kubectl commands. An engineer at 3 AM should follow these mechanically.</li>
<li><strong>Decision tree, not essay</strong> — "If X → do A. If Y → do B. If neither → escalate to Z." Not paragraphs of prose.</li>
<li><strong>Common fixes with exact commands</strong> — "To rollback: <code>kubectl rollout undo deployment/order-service</code>" Copy-paste ready.</li>
<li><strong>Escalation path</strong> — Who to call if you can't fix it in 15 minutes. Phone numbers, not just team names.</li>
</ol>
<p><strong>Keeping runbooks current:</strong></p>
<ul>
<li><strong>Post-incident update requirement:</strong> Every postmortem includes "Was the runbook helpful? What was missing?" and a task to update it.</li>
<li><strong>Quarterly runbook review:</strong> Each team reviews their runbooks. Any runbook not updated in 6 months gets flagged.</li>
<li><strong>Runbook-as-code:</strong> Store runbooks in the service repo (next to the code). PRs that change alerting rules must also update the runbook (enforced by PR template).</li>
<li><strong>Runbook testing:</strong> During game days / chaos engineering exercises, use the runbook. If it doesn't work, fix it immediately.</li>
<li><strong>Automation target:</strong> Every runbook step that can be automated SHOULD be. The ideal runbook says "Click this button to auto-remediate" not "SSH into the box and run these 12 commands."</li>
</ul>`
        },
        {
            id: 'arch-obs-q6',
            level: 'lead',
            title: 'How do you implement dashboard-as-code and why is it important at scale?',
            answer: `<p><strong>Dashboard-as-code</strong> means defining Grafana/Datadog dashboards in version-controlled configuration files (JSON, Terraform, Jsonnet) rather than clicking through a UI.</p>
<p><strong>Why it matters at scale:</strong></p>
<ul>
<li><strong>Consistency:</strong> Every service gets the same dashboard layout. New team member sees the same Golden Signals arrangement for any service.</li>
<li><strong>Reproducibility:</strong> Dashboards can be auto-provisioned for new services. Create a service → dashboard appears automatically.</li>
<li><strong>Review process:</strong> Dashboard changes go through PR review. No accidental deletion of production dashboards.</li>
<li><strong>Disaster recovery:</strong> If Grafana dies, all dashboards can be re-provisioned from git in minutes.</li>
<li><strong>Template reuse:</strong> One "service health" template with variables (service name, namespace). Instantiate for each service.</li>
</ul>
<p><strong>Implementation approaches:</strong></p>
<ul>
<li><strong>Terraform + Grafana provider:</strong> Declare dashboards as Terraform resources. <code>terraform apply</code> provisions them.</li>
<li><strong>Jsonnet/Grafonnet:</strong> Programmatic dashboard generation. Use loops to create panels for each endpoint.</li>
<li><strong>Grafana provisioning:</strong> Drop JSON files into a ConfigMap. Grafana sidecar auto-loads them.</li>
<li><strong>Custom tooling:</strong> Service registry triggers dashboard provisioning when a new service is registered.</li>
</ul>
<p><strong>Anti-pattern:</strong> A team manually creates a beautiful dashboard for their service. 6 months later, the panel queries are wrong because metrics were renamed. Nobody noticed because there was no validation pipeline. Dashboard-as-code enables automated drift detection.</p>`
        },
        {
            id: 'arch-obs-q7',
            level: 'architect',
            title: 'Design an SLO framework that works across 100+ services owned by 20 different teams. How do you ensure adoption and governance?',
            answer: `<p><strong>An SLO framework at this scale is a product, not a project.</strong></p>
<p><strong>Architecture:</strong></p>
<ol>
<li><strong>SLO Registry (source of truth):</strong> YAML files in each service repo defining SLOs. Central tool reads all repos and builds the global SLO catalog.</li>
<li><strong>SLO Calculator:</strong> Continuously queries Prometheus/metrics backend, computes actual SLI values and remaining budget per SLO.</li>
<li><strong>SLO Dashboard:</strong> Global view: all 100 services, current SLO status (green/yellow/red), budget remaining percentage.</li>
<li><strong>Alert Provisioner:</strong> Reads SLO definitions, auto-generates Prometheus alert rules (burn-rate alerts) without teams writing PromQL.</li>
<li><strong>Budget Policy Engine:</strong> When budget drops below thresholds, automatically: updates deployment pipeline gates, notifies team leads, blocks risky deployments.</li>
</ol>
<p><strong>Governance:</strong></p>
<ul>
<li><strong>Mandatory for production:</strong> No service goes to production without at least 2 SLOs defined (availability + latency). Enforced by deployment pipeline.</li>
<li><strong>Quarterly SLO Review:</strong> Platform team reviews all SLOs. Are targets appropriate? Are teams gaming budgets (setting targets too low)?</li>
<li><strong>Executive visibility:</strong> Monthly reliability report: SLO breaches, error budget trends, MTTR improvements. Ties reliability to business outcomes.</li>
<li><strong>SLO Champions:</strong> One engineer per team trained as "SLO champion." They help their team define/maintain SLOs and interpret budget data.</li>
</ul>
<p><strong>Adoption strategy:</strong></p>
<ul>
<li>Phase 1: Platform team defines SLOs for the top 10 critical services (prove the value)</li>
<li>Phase 2: Provide self-service tooling + documentation for teams to define their own</li>
<li>Phase 3: Make SLO definition a launch requirement (no SLOs = no production deploy)</li>
<li>Phase 4: Tie SLO performance to team metrics (not individual blame, team-level reliability scores)</li>
</ul>`
        },
        {
            id: 'arch-obs-q8',
            level: 'architect',
            title: 'How would you build an observability platform that is itself observable and highly available? What happens when the monitoring system goes down?',
            answer: `<p><strong>The meta-problem: who watches the watchers?</strong></p>
<p><strong>Design principles for resilient observability:</strong></p>
<ol>
<li><strong>Separate failure domains:</strong> Observability infrastructure must NOT share infrastructure with the services it monitors. Different cluster, different cloud account, different region ideally.</li>
<li><strong>Multi-layer monitoring:</strong>
<ul>
<li>Layer 1: Application-level monitoring (OTel → Grafana stack) — the primary system</li>
<li>Layer 2: Infrastructure monitoring (CloudWatch/Azure Monitor) — catches issues Layer 1 misses</li>
<li>Layer 3: External synthetic monitoring (Pingdom/Uptime Robot) — HTTP probes from outside your infra. Still works when everything else is down.</li>
</ul>
</li>
<li><strong>Self-monitoring:</strong> The observability platform monitors itself:
<ul>
<li>Prometheus scraping itself (meta-metrics: scrape_duration, target_count, storage_size)</li>
<li>Dead man's switch (Watchdog alert): an alert that ALWAYS fires. If it stops firing, the alerting system is broken.</li>
<li>OTel Collector health metrics: queue depth, export failures, dropped spans</li>
</ul>
</li>
<li><strong>Graceful degradation:</strong>
<ul>
<li>If the trace backend is down, apps continue working (OTel SDK buffers then drops — no backpressure to the app)</li>
<li>If the metrics backend is down, Prometheus retains data locally for 2 hours, then resumes shipping</li>
<li>If Grafana is down, alerts still fire (alert evaluation happens in Prometheus/Mimir, not Grafana)</li>
</ul>
</li>
<li><strong>Incident during monitoring outage:</strong>
<ul>
<li>External synthetic monitors still work (independent infrastructure)</li>
<li>CloudWatch/Azure Monitor basic metrics still available (different system)</li>
<li>Fallback: kubectl logs, kubectl top — manual investigation while monitoring recovers</li>
<li>Postmortem always includes: "How did monitoring outage affect incident detection?"</li>
</ul>
</li>
</ol>
<p><strong>Architecture pattern:</strong> Primary monitoring in-cluster → replicated to cross-region monitoring account → external synthetics as last resort. Each layer catches what the previous layer misses.</p>`
        },
        {
            id: 'arch-obs-q9',
            level: 'architect',
            title: 'How do you measure and improve MTTR (Mean Time to Recovery)? What observability investments have the highest ROI for reducing MTTR?',
            answer: `<p><strong>MTTR breakdown:</strong> MTTR = Time to Detect + Time to Diagnose + Time to Fix + Time to Verify</p>
<p>Each phase has different observability investments:</p>
<p><strong>Reducing Time to Detect (TTD):</strong></p>
<ul>
<li>SLO-based alerts (detect customer impact within 1-5 minutes, not when customers complain)</li>
<li>Anomaly detection on Golden Signals (catch gradual degradation that threshold alerts miss)</li>
<li>External synthetic monitoring (detect outages even if internal monitoring is affected)</li>
<li><strong>Target:</strong> TTD < 5 minutes for P1 incidents</li>
</ul>
<p><strong>Reducing Time to Diagnose (TTDiag):</strong></p>
<ul>
<li>Service dependency graph (immediately see which edge is failing)</li>
<li>Correlated traces + logs (jump from alert → trace → root cause log in 3 clicks)</li>
<li>Deployment correlation (automated "did a deploy happen in the last 30 min?" check)</li>
<li>Runbooks with step-by-step diagnosis flows</li>
<li><strong>Target:</strong> TTDiag < 10 minutes for known failure modes</li>
</ul>
<p><strong>Reducing Time to Fix (TTF):</strong></p>
<ul>
<li>One-click rollback capability (automated rollback when SLO breach detected post-deploy)</li>
<li>Feature flags (kill a feature without redeploying)</li>
<li>Auto-scaling (if saturation-triggered, scale before human intervenes)</li>
<li>Self-healing (circuit breakers open, retry with backoff, pod restart)</li>
<li><strong>Target:</strong> TTF < 5 minutes for rollback scenarios</li>
</ul>
<p><strong>Reducing Time to Verify (TTV):</strong></p>
<ul>
<li>Real-time SLO dashboard (see error rate dropping within seconds of fix)</li>
<li>Synthetic monitors confirming user journey works end-to-end</li>
<li>Automated "all-clear" criteria (error rate below threshold for 10 min → auto-resolve incident)</li>
</ul>
<p><strong>Highest ROI investments (in order):</strong></p>
<ol>
<li>SLO-based alerting (TTD drops dramatically)</li>
<li>One-click rollback + deploy markers (TTF drops to minutes)</li>
<li>Trace-to-log correlation (TTDiag halved)</li>
<li>Runbooks (TTDiag for on-call engineers without service knowledge)</li>
</ol>`
        },
        {
            id: 'arch-obs-q10',
            level: 'mid',
            title: 'What is a "dead man\'s switch" alert (Watchdog) and why is it essential for reliable alerting?',
            answer: `<p>A <strong>dead man's switch alert</strong> (also called a Watchdog alert) is an alert that is ALWAYS firing. Its purpose is to verify that the alerting pipeline itself is working.</p>
<p><strong>How it works:</strong></p>
<ol>
<li>You create a Prometheus alert rule that always evaluates to true: <code>vector(1) > 0</code></li>
<li>This alert is always in "firing" state</li>
<li>It sends to a special route in AlertManager that forwards to a dead man's switch service (e.g., Healthchecks.io, PagerDuty heartbeat)</li>
<li>The external service expects to receive a signal every N minutes</li>
<li>If the signal STOPS arriving → the external service pages you: "Your alerting system is DOWN"</li>
</ol>
<p><strong>Why it's essential:</strong></p>
<ul>
<li><strong>Silent failures:</strong> If Prometheus crashes, AlertManager crashes, or the network between them breaks — no alerts fire for ANY issue. Without a watchdog, you wouldn't know your alerting is broken until a customer reports a P1 incident that nobody got paged for.</li>
<li><strong>The worst outage:</strong> A production incident WITH broken alerting = maximum damage (long TTD because nobody knows it's happening).</li>
</ul>
<p><strong>Requirements:</strong></p>
<ul>
<li>The dead man's switch service MUST be external to your monitoring infrastructure (different system, different failure domain)</li>
<li>It must alert via a different channel than your primary alerts (if PagerDuty is your primary, use SMS/phone fallback)</li>
</ul>`
        }
    ]
});
