/* ═══════════════════════════════════════════════════════════════════
   Enterprise Software Delivery — Release, QA, Incidents & Metrics
   Release management, QA terminology, incident management,
   DORA metrics, SPACE framework, governance & compliance.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('enterprise-delivery', {
    title: 'Release, QA, Incidents & Metrics',
    description: 'Release management practices, QA terminology and testing types, incident management severity levels, DORA and SPACE engineering metrics, enterprise governance, and compliance frameworks.',
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    prerequisites: ['enterprise-sdlc'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Delivering software in an enterprise goes far beyond writing code. Senior engineers must understand release processes, testing practices, how incidents are managed, and how engineering effectiveness is measured.</p>
            <p>These topics appear in interviews as behavioral questions ("Tell me about a production incident you managed") and process discussions ("How do you measure engineering productivity?").</p>`
        },
        {
            title: 'Release Management',
            content: `<p>How software moves from development to production:</p>`,
            table: {
                headers: ['Term', 'Definition'],
                rows: [
                    ['Release Train', 'Fixed-cadence releases (e.g., every 2 weeks) regardless of feature completeness'],
                    ['Hotfix', 'Emergency fix deployed outside normal release cycle'],
                    ['Patch', 'Small fix bundled into next scheduled release'],
                    ['Major Release', 'Significant new features, possible breaking changes (v2.0)'],
                    ['Minor Release', 'New features, backward compatible (v1.5)'],
                    ['Rollback', 'Revert to previous version after failed deployment'],
                    ['Roll Forward', 'Fix the issue with a new deploy rather than reverting'],
                    ['Change Freeze', 'No deployments allowed (holiday periods, critical events)'],
                    ['Feature Flag', 'Deploy code but control activation separately from deployment'],
                    ['Progressive Rollout', 'Deploy to 1% → 10% → 50% → 100% of users gradually']
                ]
            },
            mermaid: `graph LR
    DEV[Dev Branch] -->|"merge"| INT[Integration]
    INT -->|"automated tests"| STG[Staging/UAT]
    STG -->|"manual QA + UAT sign-off"| PRD[Production]
    PRD -->|"monitor 30min"| MON{Healthy?}
    MON -->|Yes| DONE[Done]
    MON -->|No| RB[Rollback]

    HF[Hotfix] -->|"cherry-pick"| PRD

    style PRD fill:#ef4444,color:#fff
    style STG fill:#f59e0b,color:#fff
    style DEV fill:#10b981,color:#fff`
        },
        {
            title: 'QA Terminology',
            content: `<p>Every enterprise has layered testing. Know what each type means:</p>`,
            table: {
                headers: ['Test Type', 'Purpose', 'When', 'Who'],
                rows: [
                    ['Smoke Testing', 'Verify critical paths work after deployment', 'After every deploy', 'Automated'],
                    ['Sanity Testing', 'Quick check that a specific fix works', 'After hotfix', 'QA/Dev'],
                    ['Regression Testing', 'Ensure existing features still work after changes', 'Before release', 'Automated + QA'],
                    ['Integration Testing', 'Verify components work together', 'CI pipeline', 'Automated'],
                    ['SIT (System Integration)', 'Test full system with external dependencies', 'Pre-UAT', 'QA team'],
                    ['UAT (User Acceptance)', 'Business users validate against requirements', 'Pre-release', 'Business users'],
                    ['Performance Testing', 'Verify system handles expected load', 'Before major release', 'Performance team'],
                    ['Load Testing', 'Find maximum throughput before degradation', 'Quarterly', 'SRE/Perf team'],
                    ['Stress Testing', 'Find breaking point (beyond expected load)', 'Before launch', 'SRE/Perf team'],
                    ['Security Testing', 'Find vulnerabilities (SAST, DAST, pen test)', 'CI + quarterly', 'Security team']
                ]
            }
        },
        {
            title: 'Incident Management',
            content: `<p>When production breaks, structured incident management prevents chaos:</p>
            <ul>
                <li><strong>Severity Levels:</strong></li>
            </ul>`,
            table: {
                headers: ['Severity', 'Impact', 'Response Time', 'Example'],
                rows: [
                    ['Sev1 / P0', 'Complete outage, revenue loss, data breach', 'Immediate (all-hands)', 'Payment system down'],
                    ['Sev2 / P1', 'Major feature broken, significant user impact', '30 minutes', 'Login failing for 50% of users'],
                    ['Sev3 / P2', 'Degraded performance, workaround exists', '4 hours', 'Search slow but functional'],
                    ['Sev4 / P3', 'Minor issue, cosmetic, low impact', 'Next business day', 'Typo on settings page']
                ]
            }
        },
        {
            title: 'Incident Response Process',
            content: `<ul>
                <li><strong>Detection</strong> — Alert fires (automated monitoring) or user reports</li>
                <li><strong>Triage</strong> — Assign severity, notify on-call, open war room if Sev1</li>
                <li><strong>Incident Commander (IC)</strong> — One person coordinates response (not necessarily fixing)</li>
                <li><strong>Communication</strong> — Status page update, stakeholder notification, regular updates</li>
                <li><strong>Resolution</strong> — Fix/rollback/mitigate</li>
                <li><strong>Postmortem/PIR</strong> — Blameless review within 48 hours: timeline, root cause, action items</li>
            </ul>`,
            callout: { type: 'warning', title: 'Blameless Culture', text: 'Blameless postmortems focus on system failures, not human mistakes. "The deploy process allowed an untested change" not "John deployed broken code." This enables honest reporting and systemic improvement.' }
        },
        {
            title: 'DORA Metrics',
            content: `<p><strong>DORA</strong> (DevOps Research and Assessment) defines four key metrics that predict software delivery performance:</p>`,
            table: {
                headers: ['Metric', 'Definition', 'Elite', 'High', 'Medium', 'Low'],
                rows: [
                    ['Deployment Frequency', 'How often code deploys to production', 'On-demand (multiple/day)', 'Weekly to monthly', 'Monthly to 6-monthly', 'Less than once per 6 months'],
                    ['Lead Time for Changes', 'Commit to production time', 'Less than 1 hour', '1 day to 1 week', '1 week to 1 month', 'More than 6 months'],
                    ['Change Failure Rate', '% of deployments causing incidents', '0-15%', '16-30%', '16-30%', '46-60%'],
                    ['Mean Time to Restore', 'Time from incident to resolution', 'Less than 1 hour', 'Less than 1 day', '1 day to 1 week', 'More than 6 months']
                ]
            }
        },
        {
            title: 'SPACE Framework',
            content: `<p><strong>SPACE</strong> (Microsoft/GitHub, 2021) provides a more holistic view of developer productivity than DORA alone:</p>
            <ul>
                <li><strong>S — Satisfaction & Wellbeing</strong> — Developer happiness, burnout risk</li>
                <li><strong>P — Performance</strong> — Outcomes of the system (reliability, customer impact)</li>
                <li><strong>A — Activity</strong> — Observable actions (commits, PRs, deploys — use carefully!)</li>
                <li><strong>C — Communication & Collaboration</strong> — Knowledge sharing, PR review quality</li>
                <li><strong>E — Efficiency & Flow</strong> — Lack of interrupts, unblocked time, handoff minimization</li>
            </ul>
            <p><strong>Key insight:</strong> Never use a single dimension. Measuring only "activity" (lines of code, commits) incentivizes wrong behavior. Use at least 3 dimensions together.</p>`
        },
        {
            title: 'Governance & Compliance',
            content: `<p>Enterprise software operates under governance frameworks:</p>`,
            table: {
                headers: ['Framework', 'Domain', 'Key Requirement'],
                rows: [
                    ['SOC 2', 'Cloud services', 'Security, availability, processing integrity controls'],
                    ['ISO 27001', 'Information security', 'ISMS (Information Security Management System)'],
                    ['PCI DSS', 'Payment processing', 'Cardholder data protection, network segmentation'],
                    ['GDPR', 'EU data privacy', 'Consent, right to erasure, data portability, breach notification'],
                    ['HIPAA', 'US healthcare', 'Protected health information (PHI) safeguards'],
                    ['TOGAF', 'Enterprise architecture', 'Architecture development method (ADM), capability-based planning'],
                    ['CAB', 'Change management', 'Change Advisory Board approves production changes']
                ]
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Release management: understand release trains, hotfixes, rollback vs roll-forward, feature flags</li>
                <li>QA: know the difference between smoke, sanity, regression, SIT, UAT, and performance testing</li>
                <li>Incidents: severity-based response, blameless postmortems, Incident Commander role</li>
                <li>DORA metrics: deployment frequency, lead time, change failure rate, MTTR — the gold standard</li>
                <li>SPACE: holistic productivity (satisfaction, performance, activity, collaboration, efficiency)</li>
                <li>Governance: SOC2, ISO 27001, PCI DSS, GDPR are the most common compliance frameworks</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'delivery-q1',
            level: 'mid',
            title: 'Explain the four DORA metrics and why they matter.',
            answer: `<p>DORA metrics measure software delivery performance:</p><ul><li><strong>Deployment Frequency:</strong> How often you deploy to production. Higher = smaller, safer changes.</li><li><strong>Lead Time for Changes:</strong> Time from commit to production. Shorter = faster feedback.</li><li><strong>Change Failure Rate:</strong> % of deployments causing incidents. Lower = better quality.</li><li><strong>MTTR:</strong> Mean time to restore after failure. Shorter = better resilience.</li></ul><p><strong>Why they matter:</strong> Research (Accelerate book) shows these four metrics correlate with business outcomes. Elite performers are 2x more likely to exceed business goals.</p>`
        },
        {
            id: 'delivery-q2',
            level: 'senior',
            title: 'Walk me through how you would handle a Sev1 production incident.',
            answer: `<p><strong>Step-by-step:</strong></p><ol><li><strong>Detect:</strong> Alert fires, on-call paged (PagerDuty/Opsgenie)</li><li><strong>Acknowledge:</strong> On-call responds within 5 minutes, joins war room</li><li><strong>Triage:</strong> Confirm severity (Sev1 = revenue impact), assign Incident Commander</li><li><strong>Communicate:</strong> Status page update, Slack channel for coordination, stakeholder notification</li><li><strong>Investigate:</strong> Check recent deploys, dashboards, logs. Correlate timeline.</li><li><strong>Mitigate:</strong> Rollback if recent deploy caused it. Disable feature flag. Scale up if capacity.</li><li><strong>Resolve:</strong> Confirm metrics recovered. Update status page.</li><li><strong>Postmortem:</strong> Within 48 hours — blameless timeline, root cause, 3-5 action items with owners and due dates.</li></ol>`,
            interviewTip: "This is a top behavioral question at Amazon, Google, and Netflix. Have a real story ready with specific details: what broke, what you did, what you learned."
        },
        {
            id: 'delivery-q3',
            level: 'senior',
            title: 'When would you choose to roll forward instead of rollback?',
            answer: `<p><strong>Roll forward when:</strong></p><ul><li>The fix is small and well-understood (1-line config change)</li><li>Rollback would cause data inconsistency (DB migration already ran)</li><li>Rollback is risky/complex (breaking changes already consumed by clients)</li><li>You can deploy a fix faster than reverting (< 10 minutes)</li></ul><p><strong>Rollback when:</strong></p><ul><li>Root cause is unclear (you need time to investigate)</li><li>Fix is complex or risky</li><li>Rollback is safe and instant (blue-green, container swap)</li><li>Customer impact is ongoing (stop the bleeding first)</li></ul>`
        },
        {
            id: 'delivery-q4',
            level: 'lead',
            title: 'How do you improve DORA metrics for a team that deploys once a month?',
            answer: `<p><strong>Root causes of low deployment frequency:</strong> manual testing gates, large batch sizes, fear of deployments, shared environment bottlenecks.</p><p><strong>Improvement plan:</strong></p><ol><li><strong>Automate testing</strong> — CI pipeline with unit, integration, contract tests (remove manual QA gate)</li><li><strong>Smaller PRs</strong> — Enforce max 200 lines. Trunk-based development.</li><li><strong>Feature flags</strong> — Decouple deploy from release. Deploy daily, release when ready.</li><li><strong>Blue-green/canary</strong> — Make deployments safe (instant rollback reduces fear)</li><li><strong>Measure and celebrate</strong> — Track deployment frequency weekly, celebrate improvements</li></ol><p><strong>Timeline:</strong> Typically takes 3-6 months to go from monthly to weekly deployment.</p>`
        },
        {
            id: 'delivery-q5',
            level: 'mid',
            title: 'What is the difference between smoke testing and regression testing?',
            answer: `<p><strong>Smoke testing:</strong> A small subset of critical-path tests run immediately after deployment to verify the build is not fundamentally broken. Fast (2-5 minutes). "Does the app start and can users log in?"</p><p><strong>Regression testing:</strong> A comprehensive test suite that verifies all existing functionality still works after changes. Slower (30-60+ minutes). "Does everything that worked before still work?"</p><p><strong>When to use each:</strong> Smoke = after every deployment (gate). Regression = before releases, nightly in CI. If smoke fails, do not proceed to regression.</p>`
        },
        {
            id: 'delivery-q6',
            level: 'architect',
            title: 'How do you balance governance requirements (CAB, change freeze) with continuous delivery?',
            answer: `<p><strong>The tension:</strong> Governance wants control and audit trails. CD wants speed and frequency. Both are valid.</p><p><strong>Resolution patterns:</strong></p><ul><li><strong>Pre-approved changes:</strong> If deployment is automated, tested, and follows standard process → pre-approved (no CAB review needed)</li><li><strong>Risk-based CAB:</strong> Only review high-risk changes (database migrations, security, new third-party integrations)</li><li><strong>Automated compliance:</strong> Policy-as-code (OPA, Azure Policy) enforces rules without human review</li><li><strong>Evidence-based:</strong> Automated test results, scan reports, and deployment logs satisfy auditors without slowing teams</li><li><strong>Change freeze exceptions:</strong> Hotfix process with expedited approval (one senior sign-off)</li></ul>`
        }
    ]
});
