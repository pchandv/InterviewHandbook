/* ═══════════════════════════════════════════════════════════════════
   DevOps — Deployment Strategies: Blue-Green, Canary, Feature Flags
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('devops-strategies', {
    title: 'Deployment Strategies',
    description: 'Blue-green deployments, canary releases, rolling updates, feature flags, GitFlow vs trunk-based development, and safe production release practices.',
    sections: [
        {
            title: 'Deployment Strategies Compared',
            content: `<p>Each strategy trades off between deployment speed, risk, cost, and rollback capability.</p>`,
            code: `// BLUE-GREEN DEPLOYMENT:
// Two identical environments: Blue (current) and Green (new)
// 1. Deploy new version to Green (inactive)
// 2. Run smoke tests against Green
// 3. Switch load balancer from Blue → Green (instant cutover)
// 4. If problems: switch back to Blue (instant rollback)
// Pros: instant rollback, zero downtime, full testing before switch
// Cons: 2x infrastructure cost, database migration complexity

// CANARY DEPLOYMENT:
// Route small percentage of traffic to new version, gradually increase
// 1. Deploy new version alongside old (separate pod/instance)
// 2. Route 5% traffic to new version
// 3. Monitor error rates, latency, business metrics
// 4. If healthy: 25% → 50% → 100%
// 5. If problems: route 100% back to old version
// Pros: minimal blast radius, real production validation
// Cons: complex routing, must handle two versions simultaneously

// ROLLING UPDATE (Kubernetes default):
// Replace instances one-by-one with new version
// 1. Start new pod (v2)
// 2. Wait until healthy (readiness probe)
// 3. Remove one old pod (v1)
// 4. Repeat until all pods are v2
// Pros: simple, no extra infrastructure, zero downtime
// Cons: both versions run simultaneously briefly, slower rollback

// FEATURE FLAGS (deploy dark, enable separately):
// Deploy code to production but disabled by default
// Enable for specific users/percentages via configuration
// 1. Merge feature to main (behind flag)
// 2. Deploy to production (flag OFF — nobody sees it)
// 3. Enable for internal users → QA
// 4. Enable for 5% of users → monitor
// 5. Enable for 100% → feature is live
// 6. Remove flag code in next sprint (tech debt cleanup)
// Pros: decouple deploy from release, A/B testing, instant kill switch
// Cons: flag tech debt if not cleaned up, testing complexity

// Implementation with LaunchDarkly/.NET:
if (await featureFlags.IsEnabledAsync("new-checkout", user))
{
    return await NewCheckoutFlow(order);
}
return await LegacyCheckoutFlow(order);`,
            language: 'csharp'
        },
        {
            title: 'Branching Strategies',
            content: `<p>How you branch determines how often you can deploy and how much risk each deployment carries.</p>`,
            table: {
                headers: ['Strategy', 'Branch Lifetime', 'Deploy Frequency', 'Best For'],
                rows: [
                    ['Trunk-Based', 'Hours (short-lived)', 'Multiple times/day', 'Mature CI/CD, feature flags, small teams'],
                    ['GitHub Flow', '1-3 days (feature branches)', 'Daily to weekly', 'Most teams, PR-based review'],
                    ['GitFlow', 'Weeks (develop/release/hotfix)', 'Bi-weekly to monthly', 'Versioned releases, mobile apps, packaged software'],
                    ['Release Branches', 'Days (per release)', 'Weekly', 'Regulated environments needing approval gates']
                ]
            }
        }
    ],
    questions: [
        {
            question: 'What are feature flags and how do they decouple deployment from release?',
            difficulty: 'medium',
            answer: `<p><strong>Feature flags</strong> are runtime configuration that controls whether a feature is visible/active — without redeploying code. This decouples <em>deployment</em> (code in production) from <em>release</em> (feature available to users). You deploy continuously to main, but release features gradually via flag configuration.</p>`,
            bestPractices: ['Use feature flags for every significant new feature (deploy dark, release gradually)', 'Clean up flags after full rollout (remove dead code within 1-2 sprints)', 'Use percentage rollouts for canary-style releases (5% → 25% → 100%)', 'Include kill switch capability for instant disable without redeployment'],
            commonMistakes: ['Never cleaning up old flags (accumulates as tech debt and testing complexity)', 'Using flags for long-term configuration (use proper config/settings instead)', 'Not testing both flag states in CI/CD (regression when flag is toggled)', 'Complex nested flag dependencies (impossible to reason about behavior)'],
            interviewTip: 'Explain the key insight: with feature flags, "deploy" and "release" are separate operations. You can deploy 10 times a day (CI/CD), but release a feature once a week (controlled rollout). This eliminates the fear of deploying because deployment no longer equals user-visible change.',
            followUp: ['How do you test code behind feature flags?', 'What is a kill switch?', 'How do you handle database migrations with feature flags?'],
            seniorPerspective: 'I use feature flags for every user-facing change: deploy to production immediately after merge, enable for internal users first (dogfooding), then gradual rollout. If metrics degrade, disable the flag instantly. This gives us the confidence to deploy 5-10 times per day.',
            architectPerspective: 'Feature flags are the enabler of trunk-based development at scale. Without them, you need long-lived feature branches (merge hell). With them, incomplete features merge to main safely (flag OFF). The organizational impact is profound: teams stop batching releases and start shipping continuously.'
        },
        {
            question: 'What is blue-green deployment and when would you choose it over canary?',
            difficulty: 'medium',
            answer: `<p><strong>Blue-green:</strong> Two identical environments (blue=current, green=new). Deploy to green, test, switch traffic all-at-once. Instant rollback = switch back to blue. <strong>Canary:</strong> Route small % of traffic to new version, gradually increase. Choose blue-green for instant cutover with zero risk tolerance. Choose canary for gradual validation with real production traffic.</p>`,
            mermaid: `flowchart LR
    LB["Load Balancer"]
    subgraph Blue["Blue (current v1.0)"]
        B1["Pod 1"]
        B2["Pod 2"]
        B3["Pod 3"]
    end
    subgraph Green["Green (new v2.0)"]
        G1["Pod 1"]
        G2["Pod 2"]
        G3["Pod 3"]
    end
    LB -->|"100% traffic"| Blue
    LB -.->|"0% (standby)"| Green
    
    style Blue fill:#dbeafe,color:#1e293b
    style Green fill:#dcfce7,color:#1e293b`,
            bestPractices: ['Blue-green: run smoke tests on green before switching traffic', 'Canary: define clear success metrics (error rate, latency) and auto-rollback thresholds', 'Use feature flags for logical rollback (disable feature without infrastructure rollback)', 'Always have a rollback plan tested and documented before deploying'],
            commonMistakes: ['Blue-green without database migration strategy (both versions must work with current schema)', 'Canary without proper observability (cannot detect issues in 5% traffic)', 'Not testing the rollback procedure (first test is during an incident)', 'Mixing blue-green with stateful services (session affinity complications)'],
            interviewTip: 'Key trade-off: blue-green gives instant, complete rollback but requires 2x infrastructure. Canary gives production validation with real traffic but partial exposure to issues. Many teams combine both: canary first (detect issues), then blue-green switch (full cutover).',
            followUp: ['How do you handle database migrations in blue-green?', 'What is a dark launch?', 'How do you implement canary in Kubernetes?'],
            seniorPerspective: 'I prefer canary for API services (detect issues with 5% traffic before full rollout) and blue-green for critical infrastructure changes (database migrations, Kubernetes upgrades) where I want instant rollback capability.',
            architectPerspective: 'The deployment strategy choice reflects your risk tolerance and observability maturity. Canary requires real-time metrics and automated rollback — without observability, you cannot detect that the canary is failing. Start with blue-green (simpler), graduate to canary when your monitoring is mature.'
        },
        {
            question: 'How does a rolling update achieve zero-downtime, and what controls maxSurge/maxUnavailable give you?',
            difficulty: 'medium',
            answer: `<p>A <strong>rolling update</strong> replaces old instances with new ones incrementally rather than all at once. New instances must pass health checks before old ones are removed, so capacity never drops below the level needed to serve traffic.</p>
            <ul>
                <li><strong>maxSurge</strong>: how many extra instances can be created above the desired count during the rollout (controls speed and spare capacity).</li>
                <li><strong>maxUnavailable</strong>: how many instances may be unavailable at once (controls the minimum serving capacity).</li>
                <li><code>maxSurge: 1, maxUnavailable: 0</code> guarantees full capacity throughout — it adds a new instance first, then retires an old one.</li>
            </ul>
            <p>Rolling updates need <strong>backward compatibility</strong> because both versions run simultaneously during the transition.</p>`,
            explanation: 'It is like replacing the tires on a moving truck one at a time — you always keep enough wheels on the ground to keep rolling, instead of stopping to swap all four at once.',
            code: `# Kubernetes rolling update tuned for zero capacity loss
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # at most 5 pods briefly
      maxUnavailable: 0  # never fewer than 4 serving
  minReadySeconds: 10    # new pod must be stable before counting as ready
# kubectl rollout status deploy/my-api   # watch progress
# kubectl rollout undo deploy/my-api      # revert to previous ReplicaSet`,
            language: 'yaml',
            bestPractices: ['Set maxUnavailable: 0 for capacity-sensitive APIs', 'Require readiness probes so traffic only hits ready instances', 'Keep N and N+1 versions backward compatible during the window', 'Use minReadySeconds to avoid counting flapping pods as healthy'],
            commonMistakes: ['No readiness probe (traffic routed to still-starting instances)', 'Breaking schema/API compatibility (old and new run together)', 'maxUnavailable too high (capacity drops and users see errors)', 'Assuming rollback is instant (it is itself a rolling operation)'],
            interviewTip: 'Stress that both versions run at the same time during a rolling update, so the deployment is only safe if N and N+1 are backward compatible. Then explain the surge/unavailable knobs as the speed-vs-capacity trade-off.',
            followUp: ['Why is a rolling update slower to roll back than blue-green?', 'What is a PodDisruptionBudget?', 'How do readiness probes interact with rolling updates?'],
            seniorPerspective: 'For production APIs I default to maxUnavailable: 0 with a small maxSurge and solid readiness probes. The hidden requirement teams forget is backward compatibility: during the rollout, requests hit both versions, so the contract and database schema must satisfy both at once.',
            architectPerspective: 'Rolling updates are the cheapest zero-downtime strategy (no duplicate environment), but they trade away instant rollback and demand version compatibility discipline. I treat "both versions coexist" as a design constraint that shapes API and schema evolution across the whole platform, not just a deployment detail.'
        },
        {
            question: 'Compare GitFlow and trunk-based development. When is each appropriate?',
            difficulty: 'hard',
            answer: `<p><strong>GitFlow</strong> uses long-lived branches (develop, release, hotfix, feature) with explicit release cycles. <strong>Trunk-based development</strong> keeps everyone committing to a single main branch with very short-lived branches (hours), relying on CI and feature flags to keep main releasable.</p>
            <ul>
                <li><strong>GitFlow</strong>: good for versioned/packaged software, mobile apps, or products supporting multiple released versions where you need release and hotfix branches.</li>
                <li><strong>Trunk-based</strong>: best for web services with mature CI/CD and continuous deployment — it minimizes merge conflicts and enables multiple deploys per day.</li>
                <li>Trunk-based requires <strong>feature flags</strong> so incomplete work can live on main without being released.</li>
            </ul>`,
            explanation: 'GitFlow is like preparing distinct printed editions of a book with proofs and reprints; trunk-based is like a continuously updated web page where everyone edits one living document and toggles sections on when ready.',
            bestPractices: ['Use trunk-based + feature flags for continuously deployed web services', 'Reserve GitFlow for products that maintain multiple released versions', 'Keep branches short-lived to reduce merge conflicts regardless of model', 'Protect main with required CI checks and PR review'],
            commonMistakes: ['Using GitFlow with continuous deployment (release branches add needless overhead)', 'Trunk-based without feature flags (half-done features ship)', 'Long-lived feature branches (painful merges, "big bang" integration)', 'No automated tests gating main (broken trunk blocks everyone)'],
            interviewTip: 'Frame it as branch lifetime and release cadence, not religion. The senior point: trunk-based only works when CI is strong and feature flags decouple deploy from release; without those, teams genuinely need GitFlow.',
            followUp: ['How do feature flags enable trunk-based development?', 'How do you hotfix in trunk-based development?', 'What problems do long-lived branches cause?'],
            seniorPerspective: 'I push teams toward trunk-based development because long-lived branches are where integration pain hides. But I am honest that it is a package deal: you cannot do it safely without fast CI, strong test coverage, and feature flags to hide unfinished work on main.',
            architectPerspective: 'Branching strategy is really a statement about release cadence and integration risk. For SaaS I standardize on trunk-based to keep the integration cost continuous and small; for software shipped to customers in versions, GitFlow-style release and hotfix branches are a legitimate need, not legacy baggage.'
        },
        {
            question: 'Design a safe rollback strategy for a service deployment, including handling of in-flight database migrations.',
            difficulty: 'advanced',
            answer: `<p>Rollback safety depends on the deployment model and, critically, on database compatibility:</p>
            <ul>
                <li><strong>Code rollback</strong>: blue-green switches back instantly; canary routes traffic to the old version; rolling update rolls back to the previous ReplicaSet (not instant).</li>
                <li><strong>Feature flags</strong>: the fastest "logical rollback" — disable the feature without any redeploy.</li>
                <li><strong>Database</strong>: the hard part. Use the <strong>expand/contract (parallel change)</strong> pattern so schema changes are backward compatible, making code rollback safe.</li>
            </ul>
            <p>Expand/contract: (1) <em>expand</em> — add new columns/tables in a backward-compatible migration; (2) deploy code that writes both old and new; (3) backfill; (4) switch reads to new; (5) <em>contract</em> — remove the old schema only after the new code is proven and rollback is no longer needed. Never destroy data in the same release that introduces dependence on it.</p>`,
            explanation: 'Renovating a house while people live in it: you build the new staircase before tearing out the old one, let both work for a while, and only demolish the old stairs once everyone is confidently using the new ones.',
            code: `# Expand/contract migration timeline (no destructive change tied to a release)
# Release 1 (expand): additive only — safe to roll back
ALTER TABLE orders ADD COLUMN customer_ref varchar(64) NULL;

# Release 1 code: dual-write old + new; read old
# Backfill job: populate customer_ref for existing rows

# Release 2: read from customer_ref (old column still present → rollback safe)

# Release 3 (contract): only after Release 2 is proven and unrollback-able
ALTER TABLE orders DROP COLUMN legacy_customer_id;`,
            language: 'bash',
            bestPractices: ['Make every migration backward compatible (expand/contract)', 'Separate destructive schema changes into a later release', 'Prefer feature flags for instant logical rollback', 'Test the rollback path before deploying, not during an incident'],
            commonMistakes: ['Destructive migration in the same release that depends on it (rollback loses data)', 'Treating rollback as automatic when the schema already changed', 'No backfill plan, leaving new columns half-populated', 'First execution of the rollback procedure happening during a real outage'],
            interviewTip: 'The differentiator is recognizing that code is easy to roll back but databases are not. Lead with expand/contract and the rule: never ship a destructive schema change in the same release that starts depending on the new shape.',
            followUp: ['What is the parallel-change (expand/contract) pattern?', 'How do feature flags make rollback safer than redeploying?', 'How do you roll back a rolling update versus blue-green?'],
            seniorPerspective: 'My rule of thumb: deployments must be rollback-safe by construction, and the schema is what usually violates that. I split risky migrations into expand and contract releases so that at every point the previous code version still works against the current schema, which means a rollback never corrupts or loses data.',
            architectPerspective: 'I treat rollback as a first-class design requirement, not an afterthought. That forces backward-compatible schema evolution, decoupling deploy from release via flags, and rehearsed rollback procedures. The organizations that get burned are the ones who discover, mid-incident, that their last migration made rollback impossible.'
        },
        {
            question: 'How would you implement automated canary analysis so promotion and rollback happen without a human watching dashboards?',
            difficulty: 'expert',
            answer: `<p>Automated canary analysis (ACA) turns "watch the graphs" into a controlled, metric-driven gate. The pipeline:</p>
            <ul>
                <li><strong>Deploy canary</strong> alongside the stable version and route a small slice of traffic (e.g., 5%).</li>
                <li><strong>Compare against a baseline</strong> — ideally a freshly deployed copy of the <em>stable</em> version taking the same traffic share, so you compare like-with-like (same time window, same load) rather than canary-vs-old-prod.</li>
                <li><strong>Score key metrics</strong>: error rate, latency percentiles (p95/p99), saturation, and business KPIs. Tools like Argo Rollouts, Flagger, or Spinnaker/Kayenta compute a pass/fail score against thresholds.</li>
                <li><strong>Progress or abort automatically</strong>: if the score stays healthy, step traffic up (5 &rarr; 25 &rarr; 50 &rarr; 100); if any guardrail trips, automatically roll back to stable.</li>
            </ul>
            <p>This requires solid observability and clearly defined SLO-based thresholds — without them, ACA is just automation firing on noise.</p>`,
            explanation: 'It is like a self-driving car that promotes itself from the test track to the highway only while its own sensors stay green, and pulls over the instant a warning light appears — no human needed to stare at the dashboard, but only because the sensors and thresholds are trustworthy.',
            code: `# Argo Rollouts canary with automated analysis gating each step
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata: { name: my-api }
spec:
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: 5m }
        - analysis:                 # automated metric-based gate
            templates: [{ templateName: success-rate }]
        - setWeight: 25
        - pause: { duration: 5m }
        - setWeight: 50
        - setWeight: 100
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata: { name: success-rate }
spec:
  metrics:
    - name: success-rate
      interval: 1m
      successCondition: "result >= 0.99"   # abort + rollback if below
      failureLimit: 2
      provider:
        prometheus:
          address: http://prometheus:9090
          query: |
            sum(rate(http_requests_total{app="my-api",code!~"5.."}[2m]))
            / sum(rate(http_requests_total{app="my-api"}[2m]))`,
            language: 'yaml',
            bestPractices: ['Compare canary against a freshly deployed baseline, not stale production', 'Gate on SLO-aligned metrics: error rate, p95/p99 latency, key business KPIs', 'Automate both promotion and rollback so no human is in the hot path', 'Start with a tiny traffic weight and step up only on healthy scores'],
            commonMistakes: ['Comparing canary to long-running prod (different cache/JIT warmth skews results)', 'Gating on averages instead of percentiles (misses tail regressions)', 'Thresholds tuned to noise, causing flapping promote/rollback', 'Running ACA without mature observability (garbage metrics in, bad decisions out)'],
            interviewTip: 'The expert nuance is the baseline: compare the canary against a freshly deployed copy of stable taking equal traffic, not against warmed-up production. Then tie the pass/fail gate to SLO metrics and automatic rollback.',
            followUp: ['Why compare against a fresh baseline rather than current production?', 'What metrics make good canary guardrails?', 'How do Argo Rollouts/Flagger integrate with Prometheus for scoring?'],
            seniorPerspective: 'I push for automated canary analysis precisely because humans staring at dashboards at 2am make bad calls. The detail teams miss is the baseline: comparing a cold canary to warmed-up production produces false negatives from JIT and cache effects, so I deploy a fresh stable baseline to compare against under identical traffic.',
            architectPerspective: 'Automated canary analysis is the payoff of investing in observability and SLOs — it converts reliability targets into executable release gates. I treat the analysis thresholds as part of the service contract, version-controlled alongside the code, so promotion criteria evolve with the service rather than living in someone\u2019s head.'
        },
        {
            question: 'How does the separation between "deploy" and "release" change how teams think about risk?',
            difficulty: 'hard',
            answer: `<p><strong>Deploy vs Release separation</strong> means putting code in production (deploy) and exposing it to users (release) are independent actions. This fundamentally changes the risk model:</p>
<ul>
<li><strong>Deploy risk is minimized:</strong> Code ships behind a feature flag (OFF). It runs in production but is invisible. If it causes crashes, only internal code paths are affected.</li>
<li><strong>Release risk is controllable:</strong> Turning the flag ON gradually (1% → 10% → 100%) with monitoring at each stage. Instant rollback = flag OFF (no redeploy needed).</li>
<li><strong>Organizational impact:</strong> Teams stop batching deployments (fear of big releases), deploy daily to main, and decouple release timing from engineering cadence. Product can choose WHEN to release (marketing timing, regional rollout).</li>
</ul>
<p><strong>The mindset shift:</strong> Without separation, every deploy is a potential incident. With separation, deploys are routine non-events, and releases are deliberate, monitored, reversible decisions.</p>`,
            bestPractices: ['Default flags to OFF so deploys are silent by default', 'Use progressive rollout with metrics gates at each percentage step', 'Dark-launch: test in production with internal users before any external release', 'Treat flag cleanup as part of feature completion (prevent flag debt)'],
            commonMistakes: ['Treating every deploy as a release (no flags, instant user exposure)', 'Feature flags without monitoring (releasing blind)', 'Never cleaning up flags after full rollout (accumulating dead code paths)', 'Not testing the flag-OFF path (regression when flag is toggled back)'],
            interviewTip: 'Draw the timeline: merge → deploy (flag OFF) → dark launch → release (flag ON progressively) → full rollout → cleanup flag. This separation is what enables multiple deploys per day without risk.',
            followUp: ['How do you handle database migrations for flagged features?', 'What is a kill switch and when would you use it?']
        },
        {
            question: 'What is a progressive delivery pipeline and how does it combine deployment strategies with automated analysis?',
            difficulty: 'expert',
            answer: `<p><strong>Progressive delivery</strong> combines deployment strategies (canary, blue-green) with automated analysis to create a self-driving release pipeline that promotes or rolls back without human intervention.</p>
<h4>Pipeline stages:</h4>
<ol>
<li><strong>Deploy canary:</strong> Route 5% of traffic to new version</li>
<li><strong>Automated analysis (bake period):</strong> Compare canary metrics against baseline using statistical tests for 15-30 minutes</li>
<li><strong>Step function:</strong> If healthy, increase to 25% → 50% → 100% with analysis at each step</li>
<li><strong>Auto-rollback:</strong> If any step fails analysis, automatically route all traffic back to stable</li>
</ol>
<h4>Tools:</h4>
<ul>
<li><strong>Flagger (K8s):</strong> Progressive delivery operator with Prometheus/Datadog integration</li>
<li><strong>Argo Rollouts:</strong> Canary + blue-green with analysis templates</li>
<li><strong>Spinnaker + Kayenta:</strong> Statistical canary analysis as a service</li>
</ul>
<p><strong>Key insight:</strong> Progressive delivery removes the human from the promotion decision for routine deploys. The pipeline is a state machine: deploy → analyze → promote/rollback, driven entirely by metric health against SLO thresholds. Humans only intervene for novel failures.</p>`,
            bestPractices: ['Compare canary against a fresh baseline (not warm production) for accurate metrics', 'Gate on SLO-aligned metrics: error rate, latency percentiles, business KPIs', 'Set maximum analysis duration so uncertain canaries do not run indefinitely', 'Alert on auto-rollbacks so the team investigates root cause'],
            commonMistakes: ['Comparing canary to warmed-up production (JIT/cache differences cause false results)', 'Gating only on error rate (misses latency regressions that dont cause errors)', 'No automatic rollback (defeats the purpose of automation)', 'Too short bake period (insufficient data for statistical significance)'],
            interviewTip: 'Name specific tools (Flagger/Argo Rollouts) and explain the state machine: deploy → analyze (statistical comparison) → step up or rollback. The staff+ signal is mentioning the fresh-baseline comparison technique.',
            followUp: ['How do you handle progressive delivery for low-traffic services where statistical significance takes hours?', 'What is the relationship between progressive delivery and SLOs?']
        }
    ],
    // Expanded sections
    extraSections: [
        {
            title: 'Decision Matrix',
            content: `<table>
                <thead><tr><th>Strategy</th><th>Downtime</th><th>Rollback Speed</th><th>Risk</th><th>Cost</th><th>Best For</th></tr></thead>
                <tbody>
                    <tr><td>Rolling</td><td>Zero</td><td>Minutes</td><td>Medium</td><td>Low (no extra infra)</td><td>Stateless services, APIs</td></tr>
                    <tr><td>Blue-Green</td><td>Zero</td><td>Seconds (swap)</td><td>Low</td><td>High (double infra)</td><td>Critical services needing instant rollback</td></tr>
                    <tr><td>Canary</td><td>Zero</td><td>Seconds (route change)</td><td>Very Low</td><td>Medium</td><td>High-traffic services needing validation</td></tr>
                    <tr><td>Recreate</td><td>Brief outage</td><td>Minutes</td><td>High</td><td>Low</td><td>Dev/staging, DB migrations requiring downtime</td></tr>
                    <tr><td>Feature Flags</td><td>Zero</td><td>Instant (toggle)</td><td>Very Low</td><td>Low</td><td>Gradual rollout, A/B testing</td></tr>
                </tbody>
            </table>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>No rollback plan</strong>: Deploying without testing rollback procedure. When things break, you're improvising under pressure.</li>
                <li><strong>Big-bang deployments</strong>: Deploying all services simultaneously amplifies blast radius. Deploy one service at a time.</li>
                <li><strong>Canary without automated analysis</strong>: Manual monitoring of canary metrics doesn't scale and misses subtle regressions.</li>
                <li><strong>Blue-green without DB compatibility</strong>: If blue/green schemas differ, switching instantly breaks one version. Use expand-contract migration pattern.</li>
                <li><strong>Feature flags as permanent code</strong>: Flags left in code forever create technical debt. Have a process to clean up released flags.</li>
                <li><strong>Rolling deploy with breaking API changes</strong>: During rollout, old and new versions coexist. Breaking changes cause failures for mixed traffic.</li>
                <li><strong>No health checks in deployment</strong>: Deploying without readiness probes means traffic hits instances before they're ready.</li>
            </ul>`
        },
        {
            question: 'How do you implement automated canary analysis that decides whether to promote or rollback without human intervention?',
            difficulty: 'hard',
            answer: `<p><strong>Automated canary analysis</strong> compares metrics between the canary (new version) and the baseline (current version) to make a statistically-informed promote/rollback decision.</p>
<h4>Architecture:</h4>
<ol>
<li><strong>Deploy canary:</strong> Route 5-10% of traffic to new version alongside the existing version</li>
<li><strong>Collect metrics:</strong> For both canary and baseline over a bake period (15-60 minutes): error rate, latency percentiles, saturation, business metrics</li>
<li><strong>Statistical comparison:</strong> Compare canary vs baseline metrics using statistical tests (Mann-Whitney U test, Kolmogorov-Smirnov) — not just "is it lower/higher" but "is the difference statistically significant?"</li>
<li><strong>Decision:</strong>
<ul>
<li><strong>Pass:</strong> Canary metrics are equal or better → promote (increase traffic to 100%)</li>
<li><strong>Marginal:</strong> No significant difference → extend bake period for more data</li>
<li><strong>Fail:</strong> Canary is significantly worse → automatic rollback</li>
</ul></li>
</ol>
<h4>Tools:</h4>
<ul>
<li><strong>Flagger (Kubernetes):</strong> Progressive delivery with automated canary analysis using Prometheus metrics</li>
<li><strong>Argo Rollouts:</strong> Canary + analysis templates that query metrics backends</li>
<li><strong>Kayenta (Netflix/Spinnaker):</strong> Statistical canary analysis as a service</li>
</ul>
<p><strong>Key insight:</strong> Automated analysis removes human bias ("it looks fine to me") and catches subtle regressions (5% latency increase) that humans miss on dashboards.</p>`,
            bestPractices: ['Use statistical tests, not threshold-based comparisons (catches subtle regressions)', 'Compare canary against a parallel baseline, not against historical data (eliminates time-of-day effects)', 'Include multiple metric types: error rate AND latency AND business metrics', 'Set a maximum bake time — do not let canaries run indefinitely in an uncertain state'],
            commonMistakes: ['Comparing canary metrics against a static threshold instead of a live baseline', 'Too short bake period — insufficient data for statistical significance', 'Only checking error rate — missing latency regressions that do not cause errors', 'No automatic rollback trigger — requiring human decision defeats the purpose'],
            interviewTip: 'Mention statistical comparison (not just threshold) and name a tool (Flagger/Argo Rollouts/Kayenta). The key differentiator is "canary vs live baseline" not "canary vs hardcoded threshold."',
            followUp: ['How do you handle canary analysis for low-traffic services where statistical significance takes hours?', 'What metrics do you include in canary analysis beyond error rate?']
        },
        {
            question: 'How does the relationship between deployment strategies and feature flags create a "deploy vs release" separation?',
            difficulty: 'hard',
            answer: `<p><strong>Deploy vs Release separation</strong> is the principle that putting code into production (deploy) and exposing functionality to users (release) are independent actions.</p>
<h4>How it works:</h4>
<ul>
<li><strong>Deploy:</strong> Ship the code to production behind a feature flag (flag OFF). The binary is running in production but the new feature is invisible to users.</li>
<li><strong>Release:</strong> Turn the flag ON (progressively or all-at-once). Users now see the feature. This can happen minutes, hours, or weeks after deploy.</li>
<li><strong>Rollback:</strong> Turn the flag OFF. Instant "rollback" without redeploying — the code is still there but inactive.</li>
</ul>
<h4>Why this matters:</h4>
<ul>
<li><strong>Decouples risk:</strong> Deploy risk (does the binary start, does it break existing features?) is separated from feature risk (do users like it, does it work correctly?).</li>
<li><strong>Enables trunk-based development:</strong> Everyone merges to main daily. Incomplete features are behind flags. No long-lived branches.</li>
<li><strong>Business-controlled release:</strong> Product team can choose WHEN to release (marketing timing, regional rollout) independent of engineering deploy cadence.</li>
<li><strong>Dark launching:</strong> Deploy and test in production with internal users before any external user sees it.</li>
</ul>
<h4>Combined pattern:</h4>
<table>
<tr><th>Action</th><th>Mechanism</th><th>Risk</th><th>Speed</th></tr>
<tr><td>Deploy code</td><td>Rolling/canary deployment</td><td>Low (flag off, no user impact)</td><td>Minutes (CI/CD)</td></tr>
<tr><td>Release feature</td><td>Feature flag progressive rollout</td><td>Controlled (1% → 10% → 100%)</td><td>Configurable</td></tr>
<tr><td>Rollback feature</td><td>Flag OFF</td><td>Zero (no redeploy)</td><td>Seconds</td></tr>
<tr><td>Rollback deploy</td><td>Revert + redeploy</td><td>Low (if flag was off, no user saw it)</td><td>Minutes</td></tr>
</table>`,
            bestPractices: ['Default flags to OFF — deploy is silent until deliberate release', 'Use progressive rollout for release (1% → 10% → 50% → 100%) with monitoring at each stage', 'Treat flag-off as instant rollback — faster than redeployment', 'Clean up flags after full release to avoid flag debt'],
            commonMistakes: ['Conflating deploy with release — every deploy immediately exposes new features to all users', 'Feature flags without monitoring — releasing blind without knowing if it works', 'Long-lived flags that are never cleaned up (flag debt)', 'No dark-launch testing — first time the feature runs in production is at full release'],
            interviewTip: 'Draw the timeline: deploy (code ships, flag off) → dark launch (internal testing) → release (flag on progressively). This separation is what enables daily deploys without daily user-visible risk.',
            followUp: ['How do you handle database schema changes that are needed for a flagged feature?', 'What happens if a flag-off deploy still breaks existing functionality?']
        }
    ]
});
