/* ═══════════════════════════════════════════════════════════════════
   Failure Case Studies — Engineering Lessons from Real Outages
   Knight Capital, Healthcare.gov, GitLab, CrowdStrike, AWS, Facebook
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('failure-case-studies', {
    title: 'Failure Case Studies',
    description: 'Real-world engineering failures analyzed for lessons: Knight Capital ($440M in 45 minutes), Healthcare.gov launch disaster, GitLab accidental database deletion, CrowdStrike 2024 global outage, AWS us-east-1, and Facebook 6-hour outage. Focus on root causes, response, and prevention.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['incident-management', 'reliability-patterns'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Studying failures teaches more than studying successes. These case studies are asked in senior/staff interviews as behavioral and system design questions: "Tell me about a major outage you studied. What would you have done differently?"</p>
            <p>Each case study covers: <strong>What happened, Root cause, Impact, Response, Engineering lessons, Prevention.</strong></p>`
        },
        {
            title: 'Knight Capital Group — $440M in 45 Minutes (2012)',
            content: `<p><strong>What happened:</strong> Knight Capital deployed new trading software. A technician forgot to deploy to one of eight servers. The old code on that server contained a dormant flag that, when activated by the new release, caused it to execute millions of unintended trades in 45 minutes.</p>
            <p><strong>Root cause:</strong></p>
            <ul>
                <li>Manual deployment process (no automation, no verification)</li>
                <li>Reused a feature flag from old dead code (flag name collision)</li>
                <li>No kill switch or circuit breaker on trade volume</li>
                <li>No automated deployment validation (1 of 8 servers missed)</li>
            </ul>
            <p><strong>Impact:</strong> $440 million loss in 45 minutes. Company nearly bankrupt. Acquired by competitors within months.</p>
            <p><strong>Engineering lessons:</strong></p>
            <ul>
                <li>Automate ALL deployments (no manual steps)</li>
                <li>Verify deployment consistency across all nodes</li>
                <li>Remove dead code and unused feature flags aggressively</li>
                <li>Implement circuit breakers for anomalous behavior (trade volume 100x normal = halt)</li>
                <li>Canary deployments: roll to 1 server, verify, then proceed</li>
            </ul>`,
            callout: { type: 'warning', title: 'Key Lesson', text: 'Dead code kills. If code is not in use, delete it. Feature flags that are "done" should be removed within 2 sprints. Knight Capital died because of code that should have been deleted years earlier.' }
        },
        {
            title: 'Healthcare.gov Launch (2013)',
            content: `<p><strong>What happened:</strong> The US healthcare exchange website crashed on launch day. Only 6 people successfully enrolled on day one (target: millions).</p>
            <p><strong>Root cause:</strong></p>
            <ul>
                <li>No load testing at scale (tested for 1,000 concurrent users; got 250,000)</li>
                <li>55 contractors with no single technical owner</li>
                <li>Waterfall process with big-bang launch (no progressive rollout)</li>
                <li>Monolithic architecture with single points of failure</li>
                <li>No feature flags or graceful degradation</li>
            </ul>
            <p><strong>Engineering lessons:</strong></p>
            <ul>
                <li>Load test at 3-5x expected peak BEFORE launch</li>
                <li>Progressive rollout (state by state, not all at once)</li>
                <li>Single accountable technical leader (not committee of 55 vendors)</li>
                <li>Design for graceful degradation (queue users, show wait times)</li>
                <li>Conway's Law: 55 contractors = 55-component mess</li>
            </ul>`
        },
        {
            title: 'GitLab Database Deletion (2017)',
            content: `<p><strong>What happened:</strong> A tired engineer ran <code>rm -rf</code> on the production database directory instead of staging during a late-night maintenance window. 300GB of production data deleted.</p>
            <p><strong>Root cause:</strong></p>
            <ul>
                <li>Engineer worked on wrong terminal (production vs staging looked identical)</li>
                <li>5 backup methods configured &mdash; none worked when tested</li>
                <li>No prompt/confirmation for destructive commands on production</li>
                <li>Fatigue (late-night maintenance window)</li>
            </ul>
            <p><strong>Impact:</strong> 6 hours of data lost. Public livestream of recovery (radical transparency). No customer data permanently lost (recovered from LVM snapshot taken 6 hours prior).</p>
            <p><strong>Engineering lessons:</strong></p>
            <ul>
                <li>Test backups regularly (backup that is never restored is not a backup)</li>
                <li>Production environments must look visually DIFFERENT from staging (color-coded prompts)</li>
                <li>Destructive operations require confirmation gates (not just sudo)</li>
                <li>No single person should be able to delete production data without a second approval</li>
                <li>Schedule maintenance during business hours when possible (tired people make mistakes)</li>
            </ul>`
        },
        {
            title: 'CrowdStrike Global Outage (2024)',
            content: `<p><strong>What happened:</strong> A faulty content update to CrowdStrike Falcon sensor caused 8.5 million Windows machines worldwide to blue-screen (BSOD) simultaneously. Airlines, hospitals, banks, and emergency services affected.</p>
            <p><strong>Root cause:</strong></p>
            <ul>
                <li>Kernel-level driver received a content update with an out-of-bounds memory read</li>
                <li>Update deployed globally to all customers simultaneously (no staged rollout)</li>
                <li>Content updates bypassed the normal software release testing pipeline</li>
                <li>Running in kernel space meant crash = BSOD (no graceful recovery)</li>
            </ul>
            <p><strong>Engineering lessons:</strong></p>
            <ul>
                <li><strong>Progressive rollout for EVERYTHING</strong> &mdash; even "content" updates that seem low-risk</li>
                <li>Canary deployments: 0.1% &rarr; 1% &rarr; 10% &rarr; 100% with monitoring between each stage</li>
                <li>Kernel-space code needs even MORE testing than user-space (no recovery from crash)</li>
                <li>Content updates must go through the same CI/CD rigor as code changes</li>
                <li>Implement automatic rollback on anomaly detection (error rate spike = halt rollout)</li>
            </ul>`,
            callout: { type: 'warning', title: 'Takeaway', text: 'The distinction between "code update" and "content update" is artificial from a risk perspective. Anything that changes runtime behavior needs staged rollout and automated rollback.' }
        },
        {
            title: 'AWS us-east-1 Outage (2021)',
            content: `<p><strong>What happened:</strong> AWS networking devices in us-east-1 became overloaded during routine automation scaling, causing cascading failures across DynamoDB, Lambda, CloudWatch, and the AWS console itself.</p>
            <p><strong>Root cause:</strong></p>
            <ul>
                <li>Internal network scaling automation triggered unusual traffic pattern</li>
                <li>Network devices hit capacity limits, causing packet drops</li>
                <li>Services dependent on the internal network cascaded (DynamoDB &rarr; Lambda &rarr; CloudWatch)</li>
                <li>CloudWatch itself was down, so teams could not even monitor the outage</li>
            </ul>
            <p><strong>Engineering lessons:</strong></p>
            <ul>
                <li><strong>Multi-region is not optional</strong> for critical workloads</li>
                <li>Monitoring system must be independent of the system it monitors</li>
                <li>Plan for "what if us-east-1 goes down?" (many companies discovered they had no plan)</li>
                <li>Avoid putting all eggs in one region even within a single cloud provider</li>
                <li>Design for graceful degradation: cache, queue, static fallback</li>
            </ul>`
        },
        {
            title: 'Facebook 6-Hour Outage (2021)',
            content: `<p><strong>What happened:</strong> Facebook, Instagram, WhatsApp, and internal tools went completely offline for 6 hours. Engineers could not even enter buildings (badge system used Facebook infra).</p>
            <p><strong>Root cause:</strong></p>
            <ul>
                <li>BGP route withdrawal during routine maintenance removed all Facebook IP routes from the internet</li>
                <li>DNS servers became unreachable (no routes to reach them)</li>
                <li>Internal tools (remote access, ticketing, communication) ran on the same infrastructure</li>
                <li>Physical access to data centers was restricted (badge system on same network)</li>
            </ul>
            <p><strong>Engineering lessons:</strong></p>
            <ul>
                <li><strong>Out-of-band management:</strong> Emergency access must not depend on the system being managed</li>
                <li>BGP changes need canary validation (announce to subset of peers first)</li>
                <li>Physical access should work without network (mechanical keys, separate badge system)</li>
                <li>Internal tools and external services should have independent failure domains</li>
                <li>DNS is a SPOF &mdash; multi-provider DNS or anycast with diverse infrastructure</li>
            </ul>`
        },
        {
            title: 'Common Themes Across All Failures',
            content: `<p>Every major outage shares these patterns:</p>`,
            table: {
                headers: ['Pattern', 'Appeared In', 'Prevention'],
                rows: [
                    ['No staged rollout', 'Knight, CrowdStrike, Healthcare.gov', 'Canary &rarr; progressive &rarr; full with monitoring gates'],
                    ['Untested recovery', 'GitLab (5 backup methods, none worked)', 'Monthly backup restore drills'],
                    ['Monitoring depends on monitored system', 'AWS, Facebook', 'Independent monitoring plane (separate provider/region)'],
                    ['Single points of failure', 'Healthcare.gov, Facebook (DNS)', 'Redundancy at every layer; chaos engineering to find SPOFs'],
                    ['Human error under fatigue', 'GitLab (late night), Knight (manual deploy)', 'Automate destructive ops; no manual production changes at 2am'],
                    ['Cascading failures', 'AWS (network &rarr; DynamoDB &rarr; Lambda)', 'Circuit breakers, bulkheads, timeouts at every boundary']
                ]
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Every failure is preventable in hindsight; the question is what systematic controls you add</li>
                <li>Progressive rollout prevents global-scale incidents (CrowdStrike, Knight)</li>
                <li>Test backups by actually restoring them (GitLab)</li>
                <li>Monitoring must survive the failure it is detecting (AWS, Facebook)</li>
                <li>Remove dead code and old feature flags (Knight Capital)</li>
                <li>Design for what happens WHEN (not if) things fail</li>
                <li>These stories make excellent interview answers for "tell me about an incident" questions</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'failure-q1',
            level: 'senior',
            title: 'What engineering controls would have prevented the Knight Capital disaster?',
            answer: `<p><strong>Controls:</strong></p><ul><li>Automated deployment with consistency verification across all nodes</li><li>Canary deployment: deploy to 1 server, verify behavior, then roll to remaining 7</li><li>Circuit breaker: halt trading if volume exceeds 10x normal within 5 minutes</li><li>Remove dead code: the dormant flag should have been deleted years earlier</li><li>Kill switch: manual emergency stop accessible within 30 seconds</li></ul>`,
            interviewTip: 'This question tests whether you think in terms of prevention systems, not just individual decisions.'
        },
        {
            id: 'failure-q2',
            level: 'senior',
            title: 'Your backup system has never been tested with a real restore. What risks does this create?',
            answer: `<p><strong>GitLab learned this the hard way:</strong> 5 backup methods configured, zero worked when needed.</p><p><strong>Risks:</strong></p><ul><li>Backup files may be corrupted (silent write failures)</li><li>Restore process may not match current schema (migrations since backup)</li><li>Restore time unknown (could be 1 hour or 24 hours)</li><li>Permissions/credentials may not be stored with backup</li></ul><p><strong>Fix:</strong> Monthly automated restore to separate environment. Measure restore time. Alert if backup age exceeds threshold.</p>`
        },
        {
            id: 'failure-q3',
            level: 'architect',
            title: 'How would you design a system to survive an AWS us-east-1 outage?',
            answer: `<p><strong>Multi-region architecture:</strong></p><ul><li>Active-active in 2+ regions (us-east-1 + us-west-2 minimum)</li><li>DNS failover with Route53 health checks (or external DNS provider as backup)</li><li>Data replication: DynamoDB Global Tables, Aurora Global Database, or async replication</li><li>Stateless services deployed in both regions behind global load balancer</li><li>Monitoring in separate region (or separate provider entirely)</li><li>Regular failover drills: actually route traffic to secondary monthly</li></ul>`,
            followUp: ['What is the cost trade-off of active-active vs active-passive?', 'How do you handle data conflicts in active-active?']
        },
        {
            id: 'failure-q4',
            level: 'lead',
            title: 'What lessons from the CrowdStrike incident apply to your deployment practices?',
            answer: `<p><strong>Key lessons:</strong></p><ul><li><strong>Everything needs staged rollout:</strong> Not just "code" but config, content, rules, ML models &mdash; anything that changes runtime behavior</li><li><strong>Automated rollback on anomaly:</strong> If error rate spikes within 5 minutes of deploy, auto-revert</li><li><strong>Blast radius control:</strong> Deploy to 0.1% of fleet first, monitor, then expand. Never 100% at once.</li><li><strong>Kernel/privileged code needs extra caution:</strong> Run in user-space when possible; sandbox when not</li></ul><p><strong>Action item for any team:</strong> Audit your "non-code" updates (config, feature flags, content). Do they get the same deployment rigor as code?</p>`
        },
        {
            id: 'failure-q5',
            level: 'mid',
            title: 'Why did the Facebook outage last 6 hours even with thousands of engineers?',
            answer: `<p><strong>Because recovery tools depended on the failed system:</strong></p><ul><li>Remote access (VPN) ran on Facebook infrastructure &rarr; could not SSH into servers</li><li>Internal communication (Workplace) was down &rarr; could not coordinate</li><li>Badge system for data centers used same network &rarr; could not physically access</li><li>DNS was unreachable &rarr; everything that resolved facebook.com failed</li></ul><p><strong>Lesson:</strong> Emergency recovery path must be completely independent. Satellite phones, out-of-band console access, physical keys &mdash; none should depend on the primary system.</p>`
        },
        {
            id: 'failure-q6',
            level: 'architect',
            title: 'Design a deployment pipeline that prevents Knight Capital-style incidents.',
            answer: `<p><strong>Pipeline design:</strong></p><ol><li><strong>Automated deployment only</strong> &mdash; no manual steps, no SSH to prod</li><li><strong>Deployment verification:</strong> After deploy, automated check confirms all nodes running same version</li><li><strong>Canary stage:</strong> Deploy to 1 node, run integration tests against it for 10 minutes</li><li><strong>Progressive rollout:</strong> 10% &rarr; 50% &rarr; 100% with automatic pause on error rate increase</li><li><strong>Behavioral monitors:</strong> Trading volume, order rate, error rate &mdash; automatic halt on anomaly</li><li><strong>Dead code scanner:</strong> CI check that flags unused code and old feature flags for removal</li><li><strong>Kill switch:</strong> One-click emergency stop accessible to on-call in under 30 seconds</li></ol>`
        },
        {
            id: 'failure-q7',
            level: 'senior',
            title: 'What is the most important lesson across all these failure case studies?',
            answer: `<p><strong>The universal lesson:</strong> Every one of these failures was preventable with existing, well-known engineering practices (staged rollout, tested backups, circuit breakers, independence of monitoring). The failures happened not from lack of knowledge but from lack of discipline in applying that knowledge.</p><p><strong>Second lesson:</strong> The blast radius of a failure is determined by the choices made BEFORE the failure. Progressive rollout limits blast radius. Multi-region limits blast radius. Kill switches limit duration. These are architectural decisions, not operational ones.</p>`
        },
        {
            id: 'failure-q8',
            level: 'lead',
            title: 'How do you use failure case studies to improve your own team?',
            answer: `<p><strong>Practical approaches:</strong></p><ul><li><strong>Monthly "failure study" sessions:</strong> Read a public postmortem together, discuss what applies to your systems</li><li><strong>Chaos engineering:</strong> Inject the same failures (network partition, DNS failure, dependency timeout) and verify your controls work</li><li><strong>Pre-mortem:</strong> Before launching a feature, ask "how could this fail catastrophically?" and address top risks</li><li><strong>Audit checklist:</strong> For each case study, ask "could this happen to us?" and create action items</li><li><strong>Blameless postmortems:</strong> After your own incidents, study root causes and systemic fixes with same rigor</li></ul>`
        }
    ]
});
