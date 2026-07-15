/* ═══════════════════════════════════════════════════════════════════
   INCIDENT MANAGEMENT — Level 14: Production Engineering (SRE)
   On-call, severity, incident command, runbooks, communication,
   MTTR, and blameless postmortems.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('incident-management', {

    title: 'Incident Management',
    level: 14,
    group: 'sre',
    description: 'Handling production incidents: severity levels, on-call, the incident commander role, runbooks, communication, MTTR/MTTD, and blameless postmortems.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['observability'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Incident management</strong> is the discipline of responding to production failures in a
            structured, calm, and fast way — minimizing impact, restoring service, and learning so it doesn't recur.
            Outages are inevitable; how an organization responds is what separates reliable teams from chaotic ones.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>Severity levels and how to triage</li>
                <li>On-call practices and escalation</li>
                <li>The Incident Commander role and incident roles</li>
                <li>Runbooks and effective communication during incidents</li>
                <li>Key metrics: MTTD, MTTR, MTBF</li>
                <li>Blameless postmortems and continuous learning</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Severity Levels</h4>
            <p>Classify incidents by impact (e.g., SEV1 = critical/total outage, SEV2 = major degradation, SEV3 =
            minor). Severity drives response urgency, who is paged, and communication cadence.</p>
            <h4>On-Call &amp; Escalation</h4>
            <p>A rotation ensures someone is always responsible. Clear escalation paths route to specialists or
            management when the first responder can't resolve it in time.</p>
            <h4>Incident Commander (IC)</h4>
            <p>For significant incidents, one person <em>coordinates</em> (not necessarily fixes) — making decisions,
            delegating, and owning communication. Separates coordination from hands-on debugging.</p>
            <h4>Runbooks</h4>
            <p>Documented, step-by-step procedures for known scenarios (restart X, fail over Y) so responders act
            fast under pressure instead of improvising.</p>
            <h4>Key Metrics</h4>
            <ul>
                <li><strong>MTTD</strong> (Mean Time To Detect) — how fast you notice</li>
                <li><strong>MTTR</strong> (Mean Time To Recovery/Resolve) — how fast you restore service</li>
                <li><strong>MTBF</strong> (Mean Time Between Failures) — reliability over time</li>
            </ul>
            <h4>Blameless Postmortem</h4>
            <p>A retrospective focused on systemic causes and fixes, not individual blame — so people share the truth
            and the system improves.</p>`,
            mermaid: `flowchart TB
    Detect[Detect: alert/report] --> Triage[Triage: assign severity]
    Triage --> Respond[Respond: IC + responders]
    Respond --> Mitigate[Mitigate: restore service first]
    Mitigate --> Resolve[Resolve: root fix]
    Resolve --> Postmortem[Blameless postmortem]
    Postmortem --> Improve[Action items → prevent recurrence]`
        },
        {
            title: 'How It Works',
            content: `<p>A typical incident lifecycle:</p>
            <ol>
                <li><strong>Detect:</strong> an alert fires (SLO breach, error spike) or a user reports an issue</li>
                <li><strong>Triage:</strong> assess impact, assign a severity, and page the right people</li>
                <li><strong>Coordinate:</strong> an Incident Commander takes charge for significant incidents,
                assigning roles (ops lead, comms lead, scribe)</li>
                <li><strong>Mitigate:</strong> restore service first (roll back, fail over, feature-flag off) — stop
                the bleeding before finding root cause</li>
                <li><strong>Communicate:</strong> regular updates to stakeholders/status page at a cadence set by
                severity</li>
                <li><strong>Resolve &amp; close:</strong> confirm recovery, then schedule a blameless postmortem</li>
                <li><strong>Learn:</strong> postmortem produces concrete, tracked action items</li>
            </ol>`,
            code: `// Mitigate BEFORE you fully diagnose - restore service first.
// Order of operations during a live incident:
//
// 1. Is there a recent deploy? -> ROLL BACK first, investigate after.
// 2. Can we fail over to a healthy region/replica? -> do it.
// 3. Can we disable the broken feature via a flag? -> turn it off.
// 4. Can we shed load / scale out to relieve pressure? -> do it.
//
// Only after service is restored do you dig into root cause.
// "Stop the bleeding, then perform surgery."`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Incident roles keep a major incident organized:</p>`,
            mermaid: `graph TB
    IC[Incident Commander<br/>coordinates, decides, owns] --> Ops[Ops/Tech Lead<br/>hands-on mitigation]
    IC --> Comms[Comms Lead<br/>stakeholders + status page]
    IC --> Scribe[Scribe<br/>timeline + decisions log]
    Ops --> Responders[Responders / SMEs]
    style IC fill:#fde68a,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Practical artifacts that make incident response work:</p>`,
            tabs: [
                {
                    label: 'Severity Matrix',
                    code: `// Define severity by impact so response is consistent (not gut feel)
//
// SEV1 (Critical): total outage / data loss / security breach
//   -> page immediately, IC assigned, all-hands, exec comms, 24/7
// SEV2 (Major): significant degradation, major feature down, many users
//   -> page on-call, IC for coordination, frequent updates
// SEV3 (Minor): limited impact, workaround exists, single feature
//   -> handle in business hours, ticket, periodic updates
// SEV4 (Low): cosmetic / negligible impact
//   -> backlog, no paging
//
// Severity drives: who is paged, comms cadence, and when to escalate.`,
                    language: 'csharp'
                },
                {
                    label: 'Runbook',
                    code: `# Runbook: High API Error Rate (5xx spike)
# Trigger: error-rate alert > 5% for 5 min
#
# 1. CONFIRM: check dashboard (error rate, latency, by endpoint/region)
# 2. RECENT CHANGE? check deploy log -> if deploy in last 30 min, ROLL BACK
# 3. DEPENDENCY? check downstream health (DB, cache, third-party) + circuit breakers
# 4. SATURATION? check CPU/mem/connections -> scale out if saturated
# 5. MITIGATE: rollback / failover / feature-flag-off / load-shed
# 6. ESCALATE: if not mitigated in 15 min, page <team> + assign IC
# 7. COMMUNICATE: update status page + stakeholders every 30 min
# 8. AFTER: schedule blameless postmortem within 48h
# Links: dashboards, rollback procedure, escalation contacts`,
                    language: 'bash'
                },
                {
                    label: 'Postmortem Template',
                    code: `# Postmortem: <Incident Title> (SEV2) - <date>
#
# Summary: one paragraph - what happened, impact, duration.
# Impact: users affected, revenue, SLO/error-budget burned.
# Timeline: detection -> mitigation -> resolution (with timestamps).
# Root cause: the systemic cause(s) - the "why", using 5 Whys.
# What went well / what went poorly / where we got lucky.
# Action items: concrete, owned, dated, tracked (prevent recurrence).
#
# BLAMELESS: focus on systems and processes, never individuals.
# "An operator ran X" is context, not blame - ask why the system ALLOWED it.`,
                    language: 'bash'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Mitigate Before Diagnosing</h4>
            <p>Restore service first (rollback, failover, flag-off), then find root cause. Users care about recovery,
            not your investigation.</p>
            <h4>Do: Assign an Incident Commander for Big Incidents</h4>
            <p>One person coordinates and communicates so responders can focus on fixing. Separate coordination from
            debugging.</p>
            <h4>Do: Communicate Proactively</h4>
            <p>Regular, honest updates to stakeholders and a status page at a severity-appropriate cadence — silence
            breeds panic and duplicate escalations.</p>
            <h4>Do: Keep Runbooks Current</h4>
            <p>Document known failure responses so on-call acts fast under stress. Update them after every incident.</p>
            <h4>Do: Run Blameless Postmortems</h4>
            <p>Focus on systemic causes and tracked action items, not individuals. Psychological safety is what makes
            people surface the real story.</p>
            <h4>Do: Track MTTD/MTTR and Trends</h4>
            <p>Measure detection and recovery time to find where to invest (better alerting vs faster rollback).</p>`,
            callout: {
                type: 'tip',
                title: 'Stop the Bleeding First',
                text: 'The first goal of incident response is to restore service, NOT to find the root cause. Roll back the deploy, fail over, or disable the feature flag to mitigate impact immediately. Root-cause analysis happens calmly afterward in the postmortem \u2014 not while users are down.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Debugging Instead of Mitigating</h4>
            <p>Spending 40 minutes finding root cause while users are down, when a 2-minute rollback would have
            restored service. Mitigate first.</p>
            <h4>Mistake: No Clear Owner</h4>
            <p>Everyone debugging in parallel with no coordination causes conflicting actions and chaos. Assign an IC.</p>
            <h4>Mistake: Communication Blackout</h4>
            <p>Going quiet during an incident causes stakeholders to panic, escalate, and interrupt responders. Give
            regular updates.</p>
            <h4>Mistake: Blameful Postmortems</h4>
            <p>Blaming individuals makes people hide mistakes and defend themselves instead of fixing the system.
            Failures are almost always systemic.</p>
            <h4>Mistake: Postmortems Without Follow-Through</h4>
            <p>Writing action items that are never done means the same incident recurs. Track them like any other
            work.</p>
            <h4>Mistake: Alert Fatigue</h4>
            <p>Too many noisy alerts desensitize on-call, so the real one gets missed. Alert only on actionable,
            symptom-level conditions.</p>`,
            code: `// Anti-pattern timeline:
// 02:00 alert fires
// 02:05 engineer starts reading code to find the bug   <- WRONG
// 02:45 finally finds it; users down for 45 minutes
//
// Better:
// 02:00 alert fires
// 02:02 notice deploy at 01:58 -> ROLL BACK
// 02:06 service restored (MTTR 6 min); root-cause later in postmortem`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>SRE / On-Call Rotations</h4>
            <p>Google SRE pioneered structured incident response: ICS-style roles, error budgets gating releases, and
            mandatory blameless postmortems — now industry standard.</p>
            <h4>Status Pages &amp; Comms</h4>
            <p>Public status pages (Statuspage, etc.) and clear customer communication during incidents preserve
            trust; transparency beats silence.</p>
            <h4>Major Outage Retrospectives</h4>
            <p>High-profile outages (cloud provider incidents) publish detailed public postmortems — exemplars of
            blameless, systemic analysis the whole industry learns from.</p>
            <h4>Regulated Industries</h4>
            <p>Finance/healthcare require documented incident response and timelines for compliance and audits;
            structured process is mandatory, not optional.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Mature vs immature incident response:</p>`,
            table: {
                headers: ['Aspect', 'Immature', 'Mature'],
                rows: [
                    ['First action', 'Debug root cause', 'Mitigate (rollback/failover)'],
                    ['Coordination', 'Everyone freelances', 'Incident Commander leads'],
                    ['Severity', 'Ad hoc / by panic', 'Defined matrix drives response'],
                    ['Communication', 'Silence / rumor', 'Regular updates + status page'],
                    ['Known failures', 'Improvise each time', 'Runbooks'],
                    ['After-action', 'Blame / move on', 'Blameless postmortem + tracked actions'],
                    ['Metrics', 'None', 'MTTD/MTTR tracked and improved']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Incident "performance" is measured by detection and recovery speed and by reducing recurrence:</p>
            <h4>Reduce MTTD (Detection)</h4>
            <p>Good SLO-based alerting and observability shrink the time to notice. You can't fix what you don't know
            is broken.</p>
            <h4>Reduce MTTR (Recovery)</h4>
            <p>Fast mitigation levers (one-click rollback, automated failover, feature flags) and clear runbooks cut
            recovery time dramatically. Practice (game days) builds muscle memory.</p>
            <h4>Increase MTBF (Prevent Recurrence)</h4>
            <p>Postmortem action items, reliability patterns, and chaos engineering reduce how often incidents happen
            in the first place.</p>
            <h4>The Error Budget Link</h4>
            <p>Incidents burn the error budget. Frequent SLO-threatening incidents should trigger a shift from
            features to reliability work.</p>`,
            callout: {
                type: 'info',
                title: 'Optimize MTTR Over MTBF (to a point)',
                text: 'You can\u2019t prevent every failure, so investing in fast recovery (one-click rollback, automated failover, flags) often yields more reliability per dollar than chasing zero failures. A system that fails occasionally but recovers in 2 minutes can be more reliable in practice than one that fails rarely but takes hours to recover.'
            }
        },
        {
            title: 'Testing',
            content: `<p>You test incident response by practicing it before real incidents.</p>
            <h4>Game Days / Fire Drills</h4>
            <p>Simulate incidents (or inject real faults via chaos engineering) to exercise alerting, runbooks, roles,
            and communication. Find gaps when stakes are low.</p>
            <h4>Runbook Validation</h4>
            <p>Periodically execute runbooks to confirm steps still work (links, commands, procedures) as the system
            evolves. A stale runbook is worse than none under pressure.</p>
            <h4>On-Call Onboarding</h4>
            <p>New on-call engineers shadow and run drills so their first real page isn't their first experience.</p>`,
            code: `// Game day exercise plan (low-stakes practice for high-stakes events)
// Scenario: "Primary database becomes unavailable in region A"
//
// 1. Inject the fault (or simulate) in a staging/controlled env
// 2. Start the clock - did the alert fire? (measure MTTD)
// 3. Did on-call follow the runbook? failover to region B?
// 4. Were comms sent? was an IC assigned for the SEV?
// 5. Measure MTTR; capture gaps (missing alert, stale runbook step)
// 6. Fix the gaps - that's the real value of the exercise`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Incident management shows up in SRE/senior and behavioral interviews:</p>
            <ul>
                <li><strong>"Mitigate before diagnose"</strong> is the headline principle interviewers want</li>
                <li><strong>Explain the Incident Commander role</strong> — coordination separate from fixing</li>
                <li><strong>Define MTTD/MTTR</strong> and how to improve each</li>
                <li><strong>Champion blameless postmortems</strong> and why blame is counterproductive</li>
                <li><strong>Have a real STAR story</strong> of an incident you handled (for behavioral rounds)</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Behavioral Story Tip',
                text: 'For "tell me about a production incident," use STAR and emphasize: how you mitigated quickly (rollback/failover), how you communicated, and crucially what you changed afterward (the action items) so it never recurred. Showing the learning loop is what interviewers reward.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Resources</h4>
            <ul>
                <li>Google SRE Book &amp; SRE Workbook (free online) — incident management chapters</li>
                <li>PagerDuty Incident Response docs (response.pagerduty.com)</li>
                <li><em>The Site Reliability Workbook</em> — postmortem culture</li>
                <li>Atlassian Incident Management Handbook</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Mitigate first</strong> (rollback/failover/flag-off), diagnose later</li>
                <li><strong>Assign an Incident Commander</strong> for significant incidents — coordination vs fixing</li>
                <li><strong>Severity levels</strong> drive paging, comms cadence, and escalation</li>
                <li><strong>Runbooks</strong> let on-call act fast under pressure</li>
                <li><strong>Communicate proactively</strong> via updates and a status page</li>
                <li><strong>Blameless postmortems</strong> with tracked action items prevent recurrence</li>
                <li><strong>Track MTTD/MTTR;</strong> fast recovery often beats chasing zero failures</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Build an Incident Response Plan</h4>
            <ol>
                <li>Define a severity matrix (SEV1-4) with paging and comms rules for each</li>
                <li>Write a runbook for one realistic failure (e.g., elevated 5xx error rate)</li>
                <li>Define incident roles (IC, ops lead, comms, scribe) and when they apply</li>
                <li>Create a communication plan: what/when/who for stakeholders + status page</li>
                <li>Write a blameless postmortem template with required sections + action tracking</li>
                <li>Plan a game day to test the whole thing and capture gaps</li>
            </ol>`,
            code: `// Deliverables:
// 1. Severity matrix (impact -> paging/comms/escalation)
// 2. Runbook: confirm -> recent change? rollback -> dependency? -> scale -> escalate
// 3. Roles + activation thresholds (IC for SEV1/2)
// 4. Comms cadence by severity + status page updates
// 5. Postmortem template (timeline, root cause via 5 Whys, owned action items)
// 6. Game day scenario + success metrics (MTTD/MTTR targets)`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What should you do first in a production incident?<br/>
                    <em>A: Mitigate to restore service (roll back, fail over, disable the feature flag) \u2014 "stop the
                    bleeding" \u2014 before spending time on root-cause diagnosis.</em></li>
                <li><strong>Q:</strong> What is the Incident Commander's job?<br/>
                    <em>A: To coordinate the response \u2014 make decisions, delegate, and own communication \u2014 not necessarily
                    to fix the problem. It separates coordination from hands-on debugging.</em></li>
                <li><strong>Q:</strong> What does "blameless" mean and why does it matter?<br/>
                    <em>A: Postmortems focus on systemic causes and fixes, not blaming individuals. It matters because
                    blame makes people hide the truth; blamelessness gets the real story so the system can improve.</em></li>
                <li><strong>Q:</strong> What are MTTD and MTTR?<br/>
                    <em>A: Mean Time To Detect (how fast you notice an incident) and Mean Time To Recovery/Resolve (how
                    fast you restore service). Both are key reliability metrics to track and reduce.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'What is the first priority when a production incident occurs, and why?',
            difficulty: 'easy',
            answer: `<p>The first priority is to <strong>mitigate and restore service</strong> — "stop the bleeding" —
            not to find the root cause. Roll back a recent deploy, fail over to a healthy region/replica, or disable
            the broken feature via a flag.</p>
            <p>Why: users care about the service working again, not about your investigation. Root-cause analysis is
            important but happens calmly afterward in the postmortem. Diagnosing first while users are down prolongs
            the outage unnecessarily.</p>`,
            explanation: 'If a pipe bursts and floods your house, you shut off the water main first (mitigate). You investigate why the pipe failed later \u2014 not while the house fills with water.',
            bestPractices: ['Roll back recent deploys first', 'Fail over or flag-off to restore service', 'Diagnose root cause after recovery'],
            commonMistakes: ['Debugging while users are down', 'Trying to fix forward instead of rolling back'],
            interviewTip: '"Mitigate before diagnose / stop the bleeding" is the exact phrase interviewers listen for.',
            followUp: ['What mitigation levers do you reach for first?', 'When is fixing forward better than rolling back?']
        },
        {
            question: 'What is a blameless postmortem and why is it important?',
            difficulty: 'medium',
            answer: `<p>A <strong>blameless postmortem</strong> is a retrospective after an incident that focuses on the
            systemic causes and process/technical fixes, deliberately avoiding blame of individuals. It documents the
            timeline, impact, root cause (e.g., via 5 Whys), what went well/poorly, and concrete, owned, tracked
            action items.</p>
            <p>It is important because <strong>blame destroys learning</strong>: if people fear punishment, they hide
            mistakes, omit details, and become defensive — so you never learn the real cause. Failures are almost
            always systemic (a system <em>allowed</em> a human to make a mistake). Blamelessness creates the
            psychological safety needed for honest analysis and real improvement.</p>`,
            explanation: 'Aviation safety transformed when it adopted blameless investigation: pilots report near-misses freely because they are not punished, so the whole industry learns and gets safer. Blaming the pilot would just make everyone stop reporting.',
            bestPractices: ['Focus on systems/process, not individuals', 'Use 5 Whys to reach systemic root cause', 'Produce owned, dated, tracked action items', 'Treat human error as a system that allowed it'],
            commonMistakes: ['Naming/shaming individuals', 'Stopping at "human error" as the root cause', 'Action items that are never tracked or done'],
            interviewTip: 'Emphasize the WHY: blame makes people hide the truth, so blamelessness is what enables honest, systemic learning. The aviation analogy lands well.',
            followUp: ['How do you reach a systemic root cause from "human error"?', 'How do you ensure action items actually get done?']
        },
        {
            question: 'How do you structure the response to a major (SEV1) incident with multiple people involved?',
            difficulty: 'hard',
            answer: `<p>Use defined roles and a clear process so a crowd becomes a coordinated team:</p>
            <ol>
                <li><strong>Assign an Incident Commander (IC):</strong> one person owns coordination and
                decision-making — not the fix. They prevent conflicting actions and keep focus.</li>
                <li><strong>Assign supporting roles:</strong> an Ops/Tech Lead (hands-on mitigation), a Comms Lead
                (stakeholder + status-page updates), and a Scribe (timeline and decisions log).</li>
                <li><strong>Mitigate first:</strong> the IC drives toward restoring service (rollback/failover/flag)
                before deep diagnosis.</li>
                <li><strong>Single source of truth:</strong> one incident channel/bridge; the scribe records the
                timeline so handoffs and the postmortem are accurate.</li>
                <li><strong>Communicate on a cadence:</strong> the Comms Lead posts regular updates so stakeholders
                don't interrupt responders.</li>
                <li><strong>Control the responders:</strong> the IC limits who is actively changing things to avoid
                people stepping on each other; others stand by or investigate read-only.</li>
                <li><strong>After recovery:</strong> hand off to a blameless postmortem with tracked action items.</li>
            </ol>`,
            explanation: 'It is like an emergency room: one attending physician (IC) directs and makes calls while specialists treat (ops lead), a nurse updates the family (comms), and someone charts everything (scribe). Without that structure, ten doctors shouting over one patient causes harm, not healing.',
            bestPractices: ['One IC coordinating, not fixing', 'Defined roles: ops, comms, scribe', 'Single incident channel + recorded timeline', 'Limit who makes changes to avoid conflicts', 'Regular stakeholder comms; blameless postmortem after'],
            commonMistakes: ['No clear owner -> chaos and conflicting fixes', 'Everyone changing things simultaneously', 'Comms blackout causing escalations', 'No timeline recorded -> weak postmortem'],
            interviewTip: 'Center the answer on the Incident Commander role and the separation of coordination from hands-on fixing. Naming the supporting roles (comms, scribe) and "single source of truth" shows you have run real major incidents.',
            followUp: ['Why should the IC not also be the one debugging?', 'How do you prevent two responders from making conflicting changes?', 'What goes in the comms updates and how often?'],
            seniorPerspective: 'The counterintuitive lesson for engineers is that in a big incident, the most valuable person is often not writing or reading any code \u2014 they are the IC keeping the response coherent. Early in my career I would dive straight into debugging on a SEV1; now I make sure someone is explicitly commanding, because two or three engineers independently "fixing" production simultaneously cause more outages than they resolve. I also insist on a scribe from minute one, because an accurate timeline is what turns a stressful night into a postmortem that actually prevents the next one \u2014 memory after a 3am incident is unreliable.'
        },
        {
            question: 'How do you design a severity (SEV) classification scheme, and why does it matter operationally?',
            difficulty: 'medium',
            answer: `<p>A severity scheme maps <strong>customer/business impact</strong> (not technical novelty) onto a small
            set of levels that mechanically drive the response. A workable scheme:</p>
            <ul>
                <li><strong>SEV1 \u2014 Critical:</strong> total outage, data loss, or security breach. Page immediately,
                assign an IC, all-hands, executive comms, 24/7 response.</li>
                <li><strong>SEV2 \u2014 Major:</strong> significant degradation or a major feature down for many users.
                Page on-call, IC for coordination, frequent stakeholder updates.</li>
                <li><strong>SEV3 \u2014 Minor:</strong> limited impact with a workaround. Handle in business hours via a
                ticket, periodic updates.</li>
                <li><strong>SEV4 \u2014 Low:</strong> cosmetic/negligible. Backlog, no paging.</li>
            </ul>
            <p>It matters because severity is the single input that removes judgment-under-stress: it decides <strong>who is
            paged, how often you communicate, when to escalate, and who is woken up</strong>. Defining it by impact
            (users affected, revenue, SLO/error-budget burn) keeps classification objective rather than driven by panic
            or by how interesting the bug is.</p>`,
            explanation: 'It is hospital triage: a clear, agreed scale (resuscitation vs urgent vs minor) means an exhausted team at 3am routes the patient correctly without debating, because the criteria were decided calmly in advance.',
            bestPractices: ['Define severity by customer/business impact, not technical difficulty', 'Make each level mechanically drive paging, comms cadence, and escalation', 'Keep the scale small (4-5 levels) so it is memorable under stress'],
            commonMistakes: ['Classifying by how hard the bug is rather than its impact', 'Too many levels, so triage becomes a debate', 'Severity inflation/deflation because criteria are vague'],
            interviewTip: 'Stress that severity is defined by impact and that its whole purpose is to drive a deterministic response (paging, comms, escalation) without judgment calls during the incident.',
            followUp: ['How do you handle disagreement about a severity at the start of an incident?', 'Should severity be allowed to change mid-incident?'],
            seniorPerspective: 'The mistake I see most is engineers grading severity by how technically gnarly the problem is. A one-line config typo that takes down checkout is a SEV1; a fascinating race condition affecting one internal dashboard is a SEV4. I also bias toward declaring high and downgrading later \u2014 under-calling severity to avoid waking people is how a manageable SEV2 becomes a multi-hour SEV1 nobody coordinated.',
            architectPerspective: 'At an organizational level the severity matrix is the contract between engineering and the rest of the business: it pre-negotiates, while everyone is calm, what level of disruption justifies waking executives, posting publicly, or pulling people off feature work. I wire it directly into tooling \u2014 declaring a SEV automatically spins up the incident channel, pages the right rotation, and starts the comms cadence \u2014 so the classification is not just documentation but the trigger for the whole response machine.'
        },
        {
            question: 'How do you keep an on-call rotation healthy and avoid alert fatigue?',
            difficulty: 'hard',
            answer: `<p>On-call health is both a <strong>human sustainability</strong> problem and a <strong>signal-quality</strong>
            problem; they reinforce each other.</p>
            <h4>Protect the humans</h4>
            <ul>
                <li><strong>Reasonable rotation size:</strong> enough engineers that any one person is on-call
                infrequently (commonly no more than ~1 week in 4-6).</li>
                <li><strong>Clear escalation paths:</strong> a defined secondary and a path to SMEs/management so a
                responder is never stuck alone.</li>
                <li><strong>Follow-the-sun</strong> where possible so nobody is routinely paged overnight, and
                compensate/time-off-in-lieu for disruptive nights.</li>
                <li><strong>Onboarding:</strong> new on-call shadow and run drills first so their first page is not their
                first experience.</li>
            </ul>
            <h4>Fix the signal (the root of fatigue)</h4>
            <ul>
                <li><strong>Alert only on actionable, symptom-level conditions</strong> (SLO breaches, user-facing
                symptoms) \u2014 not on every cause metric (CPU at 80%) that may be harmless.</li>
                <li><strong>Every page must be actionable</strong> and link a runbook; if there is nothing to do, it is
                not a page.</li>
                <li><strong>Track alert volume and noise</strong> as a first-class metric; review and delete/tune noisy
                alerts regularly (treat alert noise like a bug).</li>
                <li><strong>Auto-remediate</strong> what is safe to automate so humans are not paged for self-healing
                conditions.</li>
            </ul>
            <p>The danger of fatigue is concrete: when most pages are noise, responders become desensitized and
            <em>miss the one real page</em>. Signal quality is a reliability control, not a comfort issue.</p>`,
            explanation: 'It is the boy who cried wolf, mechanized: if the alarm shrieks for every gust of wind, people stop reacting, and the night the wolf actually comes the alarm is ignored. Fewer, truer alarms keep everyone responsive.',
            code: `# A good alert: symptom-level, actionable, runbook attached (Prometheus + Alertmanager)
groups:
  - name: slo-alerts
    rules:
      - alert: HighApiErrorRate
        # symptom (user-facing), not a raw cause metric like CPU
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
            / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m                      # avoid flapping on brief blips
        labels:
          severity: page             # only actionable conditions page
        annotations:
          summary: "API 5xx error rate above 5% for 5m"
          runbook_url: "https://runbooks/internal/high-5xx"   # always link a runbook
      - alert: DiskFillingButHealthy
        expr: node_filesystem_avail_percent < 20
        for: 10m
        labels:
          severity: ticket           # NOT a page - ticket it, auto-remediate if safe`,
            language: 'yaml',
            bestPractices: ['Page only on actionable, symptom-level conditions with a linked runbook', 'Size rotations so on-call is infrequent; provide a secondary + escalation', 'Track alert volume as a metric and ruthlessly tune/delete noisy alerts', 'Onboard via shadowing and drills before live on-call'],
            commonMistakes: ['Paging on cause metrics (CPU/memory) that are not user-impacting', 'Alerts with no runbook and no clear action', 'Rotations so small people burn out', 'Never reviewing or deleting noisy alerts'],
            interviewTip: 'Tie alert fatigue directly to a reliability risk: noise desensitizes responders so the real page gets missed. Distinguish symptom-level alerting from cause-metric alerting.',
            followUp: ['What is the difference between symptom-based and cause-based alerting?', 'How do you decide whether something should page versus just create a ticket?'],
            seniorPerspective: 'My rule is blunt: if a page does not require a human to do something right now, it is not allowed to page. I have walked into teams getting 200 pages a week where the on-call had learned to swipe them away \u2014 and that is exactly when a genuine outage slips through. Cutting noise is not a nicety; it is restoring the team\u2019s ability to detect real failures, and I treat a noisy alert as a sev-worthy bug in the observability system.',
            architectPerspective: 'I design alerting top-down from SLOs: the things that page are the things that burn the error budget, period. Everything else is a dashboard or a ticket. That discipline keeps the paging surface small and meaningful as the system grows, and it makes on-call a sustainable, rotating responsibility rather than a reason senior engineers quit. I also invest in auto-remediation for the well-understood failure modes so the rotation only sees novel problems worth human attention.'
        },
        {
            question: 'How do you use MTTD, MTTR, and error budgets to decide where to invest in reliability?',
            difficulty: 'advanced',
            answer: `<p>These metrics turn reliability from a feeling into a budgeting decision.</p>
            <ul>
                <li><strong>MTTD (Mean Time To Detect):</strong> how long from failure to noticing. High MTTD points
                investment at <strong>observability and alerting</strong> \u2014 better SLO-based alerts, tracing, and
                synthetic monitoring. You cannot fix what you do not know is broken.</li>
                <li><strong>MTTR (Mean Time To Recovery):</strong> how long from detection to restored service. High MTTR
                points investment at <strong>fast mitigation levers</strong> \u2014 one-click rollback, automated failover,
                feature-flag kill switches, current runbooks, and on-call practice (game days).</li>
                <li><strong>Error budget:</strong> the allowed unreliability implied by your SLO (e.g., 99.9% available =
                ~43 min/month of budget). Incidents burn it; the burn rate tells you whether to keep shipping features or
                <strong>pause and invest in reliability</strong>.</li>
            </ul>
            <p>The decision logic: break MTTR down (detect \u2192 diagnose \u2192 mitigate \u2192 verify) and attack the
            biggest segment. If you are slow to <em>notice</em>, fix detection; if you notice fast but recover slowly, fix
            mitigation tooling. And rather than chasing zero failures, often the highest reliability-per-dollar is
            <strong>investing in fast recovery</strong>: a system that fails occasionally but recovers in two minutes can
            be more reliable in practice than one that fails rarely but takes hours.</p>
            <p>The error budget is the governance link: when frequent incidents threaten the SLO, the budget policy should
            automatically shift the team from feature work to reliability work \u2014 making the trade-off explicit and
            data-driven instead of political.</p>`,
            explanation: 'It is like running an emergency room by the numbers: if patients wait too long to be seen (MTTD), you add triage staff; if treatment itself is slow (MTTR), you streamline the procedures and stock the crash carts. The error budget is the policy that says when the ER is overwhelmed you stop taking elective cases until it stabilizes.',
            bestPractices: ['Decompose MTTR (detect/diagnose/mitigate/verify) and target the largest segment', 'Invest in fast recovery (rollback/failover/flags), not only failure prevention', 'Use the error budget burn rate to gate features vs reliability work', 'Track trends over time, not single-incident numbers'],
            commonMistakes: ['Chasing zero failures (MTBF) while ignoring slow recovery', 'Tracking MTTR without breaking down where the time goes', 'No SLO/error budget, so reliability-vs-features is decided by politics', 'Comparing raw averages across very different incident types'],
            interviewTip: 'Show the causal chain: MTTD drives observability investment, MTTR drives mitigation tooling, and the error budget governs the features-vs-reliability trade-off. Add "optimize recovery over prevention, to a point".',
            followUp: ['Why might optimizing MTTR beat optimizing MTBF?', 'What should happen when the error budget is exhausted?'],
            seniorPerspective: 'I push teams to stop treating MTTR as one number. The breakdown is where the insight lives: I have seen "slow incidents" that were actually fast to fix but took 40 minutes to even detect \u2014 so the right investment was alerting, not rollback tooling. And I lean hard on the recovery-over-prevention idea: a reliable-feeling system is usually one that fails small and recovers instantly, not one that promises it will never fail.',
            architectPerspective: 'Error budgets are the architectural mechanism I use to make reliability a negotiated, quantitative concern rather than an argument. The SLO sets the budget, incidents debit it, and a written policy dictates what happens when it runs low \u2014 typically a freeze on risky launches until reliability work restores headroom. That converts MTTD/MTTR data into an automatic prioritization signal that the whole organization, including product, has pre-agreed to honor.'
        },
        {
            question: 'What is the role of an Incident Commander, and how does the incident command structure work in software?',
            difficulty: 'hard',
            answer: `<p>The <strong>Incident Commander (IC)</strong> is the single decision-maker during an active incident. They coordinate the response but do NOT debug the system themselves.</p>
<h4>IC Responsibilities:</h4>
<ul>
<li><strong>Own the timeline:</strong> declare incident start, severity, and resolution</li>
<li><strong>Assign roles:</strong> delegate investigation, communication, and remediation to specific people</li>
<li><strong>Make decisions:</strong> "Roll back now" or "keep investigating for 5 more minutes"</li>
<li><strong>Maintain situational awareness:</strong> aggregate findings from investigators, maintain a shared understanding</li>
<li><strong>Manage escalation:</strong> pull in additional experts or escalate severity if needed</li>
<li><strong>NOT debug:</strong> IC coordinates; others investigate. If IC is heads-down in logs, nobody is coordinating.</li>
</ul>
<h4>Incident Command Structure (adapted from ICS):</h4>
<table>
<tr><th>Role</th><th>Responsibility</th></tr>
<tr><td>Incident Commander</td><td>Coordination, decisions, timeline</td></tr>
<tr><td>Tech Lead / Investigator(s)</td><td>Diagnose root cause, implement fix</td></tr>
<tr><td>Communications Lead</td><td>Update status page, notify stakeholders, internal updates</td></tr>
<tr><td>Scribe</td><td>Document timeline, decisions, actions taken (for postmortem)</td></tr>
</table>
<p><strong>Rotation:</strong> IC role should rotate across senior engineers so everyone builds the skill. It is a learned competency, not an innate talent.</p>
<p><strong>Why it matters:</strong> Without clear command, incidents devolve into chaos — multiple people making conflicting decisions, nobody communicating externally, and the investigation going in circles. MTTR increases dramatically.</p>`,
            bestPractices: ['IC coordinates, does NOT debug — delegation is the core skill', 'Assign roles explicitly at incident start ("You are comms, you investigate service X")', 'Maintain a shared channel/war room with periodic status updates', 'Rotate IC duty to build the skill across the team'],
            commonMistakes: ['IC gets pulled into debugging and nobody is coordinating', 'No designated communicator — customers and stakeholders are left in the dark', 'Multiple people making conflicting remediation decisions', 'No scribe — the postmortem has no timeline data to work with'],
            interviewTip: 'Describe the role separation clearly: IC = coordinate + decide, Tech = investigate + fix, Comms = update stakeholders. Showing you understand WHY IC should not debug is the senior signal.',
            followUp: ['How do you train new Incident Commanders?', 'What happens when the IC is wrong about severity?']
        },
        {
            question: 'How do you write an effective blameless postmortem? What are the key sections?',
            difficulty: 'hard',
            answer: `<p>A <strong>blameless postmortem</strong> is a structured document that captures what happened, why, and what systemic changes will prevent recurrence — without assigning blame to individuals.</p>
<h4>Key Sections:</h4>
<ol>
<li><strong>Summary:</strong> One paragraph. What failed, impact, duration, severity.</li>
<li><strong>Timeline:</strong> Minute-by-minute log of events from first signal to full recovery. Include detection, escalation, attempts, and resolution.</li>
<li><strong>Impact:</strong> Quantified: X users affected, Y minutes of downtime, Z revenue lost, N SLO budget consumed.</li>
<li><strong>Root Cause(s):</strong> The systemic issue(s). Use "5 Whys" to dig past the surface. Not "engineer X made a mistake" but "the deployment pipeline has no canary analysis, so bad changes reach 100% of traffic."</li>
<li><strong>Contributing Factors:</strong> Things that made the incident worse (e.g., outdated runbook, missing alert, slow detection).</li>
<li><strong>What Went Well:</strong> What worked as designed (rollback succeeded, alerting caught it quickly).</li>
<li><strong>Action Items:</strong> Specific, assigned, prioritized tasks with deadlines. Each must be: P1 (do this week), P2 (do this sprint), P3 (backlog). Owner assigned.</li>
<li><strong>Lessons Learned:</strong> Generalizable insights for other teams.</li>
</ol>
<h4>Blameless principles:</h4>
<ul>
<li>Focus on SYSTEMS, not individuals ("the review process did not catch the config error" vs "Bob made a typo")</li>
<li>Assume everyone acted with best intentions given the information they had at the time</li>
<li>The goal is to make the system safer for the NEXT person who is in that situation</li>
<li>If someone feels blamed, the postmortem has failed — people will hide information in future incidents</li>
</ul>
<p><strong>Critical:</strong> A postmortem without followed-through action items is just documentation of failure. Track action item completion rate — if items stagnate, the process is broken.</p>`,
            bestPractices: ['Write within 48 hours while memory is fresh; hold review meeting within a week', 'Use "5 Whys" to find systemic root causes, not surface triggers', 'Every action item has an owner, priority, and deadline', 'Track action item completion rate — unfinished items = broken process', 'Share postmortems broadly (internal blog, all-hands) to spread learning'],
            commonMistakes: ['Blaming individuals ("Bob should have been more careful") — kills psychological safety', 'Stopping at the trigger ("bad deploy") without asking why the system allowed it', 'Action items with no owner or deadline — they never get done', 'Writing the postmortem but never following up on actions', 'Only writing postmortems for SEV-1 — missing patterns from smaller incidents'],
            interviewTip: 'Walk through the sections, emphasize blamelessness (systemic focus), and stress that action item follow-through is what actually prevents recurrence — the doc alone changes nothing.',
            followUp: ['How do you decide which incidents deserve a postmortem?', 'What do you do if the same root cause appears in multiple postmortems?']
        }
    ]
});
