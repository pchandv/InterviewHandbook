/* ═══════════════════════════════════════════════════════════════════
   Leadership — Process, Estimation, Hiring, Incident Response
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('leadership-process', {
    title: 'Process & Estimation',
    description: 'Sprint planning, estimation techniques, hiring and interviewing, architecture reviews, production incident response, RCA (Root Cause Analysis), and engineering process maturity.',
    sections: [
        {
            title: 'Estimation & Planning',
            content: `<p>Estimation is about managing uncertainty and setting expectations — not predicting the future with precision. Good estimates communicate risk and enable informed decisions.</p>`,
            code: `// ESTIMATION TECHNIQUES:

// 1. T-SHIRT SIZING (relative, quick)
// XS: < 1 day, well-understood, no unknowns
// S:  1-2 days, mostly understood, minor unknowns
// M:  3-5 days, partially understood, some unknowns
// L:  1-2 weeks, significant unknowns, needs spike/research
// XL: 2+ weeks — SPLIT IT (too large to estimate accurately)

// 2. STORY POINTS (relative complexity, not time)
// Compare to reference stories the team has completed
// Fibonacci: 1, 2, 3, 5, 8, 13, 21
// If > 13 points: split into smaller stories
// Velocity: team averages X points/sprint (empirical, not guessed)

// 3. THREE-POINT ESTIMATE (for critical path items)
// Optimistic (O): everything goes perfectly
// Most Likely (M): normal conditions
// Pessimistic (P): significant obstacles
// Expected = (O + 4M + P) / 6
// Example: Feature X → O:3d, M:5d, P:12d → Expected: 5.8 days

// COMMUNICATION TO STAKEHOLDERS:
// BAD: "It will take 2 weeks"
// GOOD: "Most likely 2 weeks, could be 3 if we hit integration issues with the payment API.
//        I'll know more after the spike on Thursday."

// PLANNING PRINCIPLES:
// - Estimate in ranges, not points (communicate uncertainty)
// - Split large items (anything > 1 week should be broken down)
// - Include buffer for unknowns (20-30% for new technology/domain)
// - Track velocity empirically (don't guess capacity — measure it)
// - Re-estimate when you learn new information (estimates are living)`,
            language: 'csharp'
        },
        {
            title: 'Incident Response & RCA',
            content: `<p>Production incidents are inevitable. What separates mature teams is: speed of detection, structured response, and learning from failures to prevent recurrence.</p>`,
            code: `// INCIDENT RESPONSE PROCESS:

// 1. DETECT — automated alerting catches the issue
//    - Application Insights alerts on error rate spike
//    - Synthetic monitoring detects availability drop
//    - Customer report via support channel

// 2. TRIAGE — assess severity and assign
//    SEV1: System down, all users affected → all hands, page on-call
//    SEV2: Major feature broken, many users affected → team lead + on-call
//    SEV3: Minor issue, workaround exists → on-call handles during hours
//    SEV4: Cosmetic/minor, no user impact → normal sprint backlog

// 3. MITIGATE — restore service FIRST, investigate later
//    - Rollback deployment (if recent deploy)
//    - Scale up (if capacity issue)
//    - Disable feature flag (if new feature causing issue)
//    - Failover to healthy region
//    - GOAL: restore service, NOT find root cause yet

// 4. COMMUNICATE — keep stakeholders informed
//    - Internal: Slack/Teams channel with regular updates (every 30 min)
//    - External: Status page updated, customer comms if user-facing
//    - Template: "What happened, current impact, next update at HH:MM"

// 5. ROOT CAUSE ANALYSIS (post-incident, blameless)
//    - Timeline: what happened when (factual, from logs/metrics)
//    - Contributing factors: what conditions enabled this failure
//    - Root cause: the systemic issue (not "human error")
//    - Action items: concrete preventive measures with owners and deadlines
//    - Blameless: focus on systems/processes, not people

// RCA TEMPLATE:
// Title: Payment processing failure — 2024-03-15
// Duration: 45 minutes (14:22 - 15:07 UTC)
// Impact: 12% of payment attempts failed, ~$50K revenue impact
// Root Cause: Database connection pool exhausted due to slow query introduced in deploy
// Contributing Factors:
//   - No load test in staging for the new query
//   - Connection pool alert threshold too high (alerted at 95%, too late)
//   - No automatic rollback on error rate spike
// Action Items:
//   - [ ] Add load test for payment path to CI/CD (Owner: Alex, Due: Mar 22)
//   - [ ] Lower connection pool alert to 70% (Owner: Sam, Due: Mar 18)
//   - [ ] Implement auto-rollback on 5% error rate (Owner: Jordan, Due: Apr 1)`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'How do you handle a production incident? Walk through your process.',
            difficulty: 'medium',
            answer: `<p>Structured incident response: (1) <strong>Detect</strong> — automated alerting identifies the issue, (2) <strong>Triage</strong> — assess severity and mobilize appropriate response, (3) <strong>Mitigate</strong> — restore service first (rollback, failover, feature flag), (4) <strong>Communicate</strong> — regular updates to stakeholders, (5) <strong>RCA</strong> — blameless post-mortem to prevent recurrence with concrete action items.</p>`,
            bestPractices: ['Restore service FIRST, investigate root cause AFTER (mitigation before analysis)', 'Communicate proactively with regular updates (silence creates anxiety)', 'Blameless RCA — focus on systemic improvements, not individual blame', 'Every RCA produces concrete action items with owners and deadlines'],
            commonMistakes: ['Spending too long debugging while service is down (rollback first, investigate after)', 'Blaming individuals in RCA (creates fear, people hide mistakes instead of reporting)', 'Not following up on RCA action items (same incident repeats)', 'No runbooks for common scenarios (every incident becomes ad-hoc)'],
            interviewTip: 'Give a real example: "We had a SEV1 where payment processing failed for 45 minutes. I coordinated the response: identified it was the latest deploy, rolled back in 5 minutes, then ran RCA. Root cause was a slow query exhausting connection pool. We added load tests and auto-rollback as preventive measures."',
            followUp: ['What is a blameless post-mortem?', 'How do you prevent alert fatigue?', 'What are SLOs and error budgets?'],
            seniorPerspective: 'The best incident response is preventing incidents: comprehensive monitoring, canary deployments, auto-rollback on error spike. When incidents do happen, I focus on mean-time-to-recovery (MTTR) over mean-time-between-failures (MTBF). Fast recovery is more valuable than preventing all failures.',
            architectPerspective: 'I build incident response into the architecture: circuit breakers prevent cascading failures, feature flags enable instant disable, blue-green deployments enable instant rollback, and observability provides the data needed to diagnose. The system should be designed to fail safely and recover quickly, not to never fail.'
        },
        {
            question: 'A stakeholder asks "exactly how long will this feature take?" Two weeks in, the estimate is clearly wrong. How do you handle estimation and the conversation?',
            difficulty: 'hard',
            answer: `<p>Estimation manages uncertainty; it does not predict the future. Two principles drive the answer:</p>
<ul>
<li><strong>Estimate in ranges tied to confidence, not single dates.</strong> Use the source of uncertainty to justify the range — known work narrows it, unknowns widen it. A three-point estimate (Expected = (O + 4M + P) / 6) makes the risk explicit.</li>
<li><strong>Re-estimate the moment you learn something material.</strong> An estimate is a living forecast, not a contract. The professional failure is not being wrong — it is staying silent while reality diverges.</li>
</ul>
<p>When the estimate is clearly wrong two weeks in, you do not hide it. You communicate <strong>early and specifically</strong>: what changed, the new forecast with its driver, and the options. Frame it as a decision for the stakeholder: cut scope to hold the date, hold scope and move the date, or add focus/people (acknowledging ramp-up cost). Bring data — velocity, what was discovered, what is now de-risked — so it reads as a forecast update, not an excuse.</p>`,
            explanation: 'A weather forecast does not promise it will rain at 3:00pm. It says "70% chance this afternoon" and updates as new data comes in. Estimates work the same way — give a range, then update it the moment the radar changes, rather than insisting on yesterday\'s guess.',
            bestPractices: ['Communicate estimates as confidence-based ranges and name the specific unknowns that drive the spread', 'Re-forecast and surface slippage the instant you learn material new information, not at the deadline', 'Present slippage as a scope/date/focus decision for the stakeholder, backed by data', 'Use spikes to convert large unknowns into estimable work before committing to a date'],
            commonMistakes: ['Giving a single hard date to avoid an uncomfortable conversation, then missing it', 'Padding estimates secretly instead of communicating uncertainty transparently', 'Waiting until the deadline to reveal the slip ("watermelon" status: green outside, red inside)', 'Treating the estimate as fixed and death-marching the team to hit a number that is no longer real'],
            interviewTip: 'Show that you reframe "exactly how long" into a confidence range, and that your real skill is the early, data-backed re-forecast conversation — interviewers are testing maturity, not your ability to guess dates.',
            followUp: ['How do you estimate work involving unfamiliar technology?', 'How do you build trust with a stakeholder after a missed estimate?', 'What is the difference between story points and time estimates?'],
            seniorPerspective: 'I tell stakeholders the confidence level out loud: "high confidence on 2 weeks for the parts we understand, low confidence on the payment integration until we spike it Thursday." That single sentence resets expectations and earns trust, because when I do come back with a revised number, it was already flagged as the risky part rather than landing as a surprise.',
            architectPerspective: 'At an org level, chronic estimation pain is usually a systemic signal: too much unknown entering sprints, large unsplit work items, or architectural coupling that makes change unpredictable. I invest in reducing that uncertainty structurally — spikes, thinner vertical slices, decoupled modules, and tracking empirical velocity — so the organization plans on measured throughput instead of optimistic guesses.'
        },
        {
            question: 'How do you design a senior engineer hiring loop that reliably predicts on-the-job performance?',
            difficulty: 'advanced',
            answer: `<p>The goal is <strong>signal that generalizes to the actual job</strong>, while minimizing false negatives (rejecting strong candidates) and false positives (hiring poor fits). A strong senior loop is structured and multi-faceted:</p>
<ul>
<li><strong>Define the bar first.</strong> Agree on a rubric of competencies (technical depth, system design, collaboration, ownership, communication) <em>before</em> interviewing, so feedback is scored against criteria rather than vibes.</li>
<li><strong>Use realistic, job-relevant exercises.</strong> Prefer practical work — debugging real code, reviewing a PR, or a system-design discussion grounded in your domain — over abstract algorithm puzzles, which correlate poorly with senior performance.</li>
<li><strong>Cover distinct competencies per interviewer.</strong> Each session targets a different axis (design, coding/debugging, behavioral/leadership, values) to avoid redundant signal.</li>
<li><strong>Structured behavioral interviews</strong> using STAR, probing for ownership, conflict, and mentoring — the differentiators at senior level.</li>
<li><strong>Independent written feedback before debrief</strong> to avoid anchoring/groupthink, then a calibrated hiring decision.</li>
</ul>`,
            explanation: 'Hiring is like a medical test: you want to catch the real condition without false alarms. If your test only checks one symptom (a leetcode puzzle), you will both reject healthy people and admit sick ones. Multiple targeted checks, scored against a known baseline, give a far more reliable diagnosis.',
            bestPractices: ['Agree on a competency rubric and what "senior" means before the loop starts, and score against it', 'Use job-realistic exercises (debugging, design, PR review) over abstract puzzles for senior roles', 'Have each interviewer own a distinct competency to maximize independent signal', 'Collect written feedback independently before the debrief to prevent anchoring and groupthink'],
            commonMistakes: ['Unstructured "chat" interviews that measure likeability and similarity rather than ability', 'Over-indexing on algorithm puzzles that do not reflect senior day-to-day work', 'Letting the loudest voice anchor the debrief instead of independent pre-submitted scores', 'No clear bar, so "no hire" decisions hinge on vague gut feel and are inconsistent across candidates'],
            interviewTip: 'Emphasize structure and calibration (rubric + independent feedback) and the trade-off between false positives and false negatives — that framing signals you have actually run hiring loops, not just sat on panels.',
            followUp: ['How do you reduce bias in interviews?', 'How do you calibrate interviewers across the org?', 'How do you handle a split debrief decision?'],
            seniorPerspective: 'I weight signal toward "show me your work": I will walk through a system they actually built and ask why they made each trade-off, where it broke in production, and what they would change. Real senior judgment shows up in the post-mortem stories, not in whether they can invert a binary tree on a whiteboard.',
            architectPerspective: 'Hiring is the highest-leverage architectural decision an org makes, because the people you hire define the systems you can build and maintain. I treat the loop itself as a system to be measured — tracking offer-accept rates, ramp time, and retention against interview scores — and tune the process when the signal stops predicting outcomes, the same way I would tune any feedback loop.'
        },
        {
            question: 'You run a blameless post-mortem, but the same class of incident keeps recurring. What is actually broken and how do you fix the process?',
            difficulty: 'hard',
            answer: `<p>Recurrence after blameless post-mortems almost always means the process is producing <strong>analysis without durable change</strong>. Common root causes:</p>
<ul>
<li><strong>Shallow root cause.</strong> The RCA stops at the proximate trigger ("the query was slow") instead of the systemic cause ("we have no pre-merge load testing on critical paths"). The Five Whys is abandoned too early.</li>
<li><strong>Action items without ownership or teeth.</strong> Items are logged but have no owner, no deadline, no priority, and compete with feature work — so they never ship.</li>
<li><strong>No follow-through loop.</strong> Nobody tracks action-item completion or revisits whether the fix actually worked.</li>
<li><strong>Blameless drifted into blameless-and-consequenceless.</strong> Psychological safety is necessary, but it must coexist with accountability for <em>fixing the system</em>.</li>
</ul>
<p><strong>Fixes:</strong> drive RCAs to systemic causes; make every action item have an owner, due date, and explicit priority that can preempt feature work; track completion in a visible backlog and report on it; close the loop by checking recurrence rate over time; and look for <strong>patterns across incidents</strong> — repeated themes signal a deeper investment is needed (e.g., a testing gap, an observability gap, or unmanaged tech debt).</p>`,
            explanation: 'It is like a doctor who keeps treating the fever but never the infection. Each visit is documented kindly and blamelessly, but if nobody finishes the course of antibiotics — the assigned, owned fix — the patient keeps coming back with the same illness.',
            bestPractices: ['Drive RCA past the proximate trigger to the systemic cause using techniques like the Five Whys', 'Give every action item an owner, a due date, and a priority that can preempt feature work', 'Track action-item completion in a visible backlog and report on overdue items', 'Aggregate across incidents to spot recurring themes that justify a larger structural investment'],
            commonMistakes: ['Stopping at "human error" or the immediate trigger instead of the systemic enabler', 'Producing action items with no owner or deadline that quietly die in a doc', 'Never verifying whether the fix actually prevented recurrence', 'Confusing blamelessness with no accountability for completing the remediation'],
            interviewTip: 'Distinguish blameless (no blaming people) from accountable (the system must actually get fixed) — and point out that recurrence is an action-item-follow-through problem far more often than an analysis problem.',
            followUp: ['How do you prioritize reliability work against feature delivery?', 'What metrics tell you your incident process is improving?', 'How do you keep a post-mortem blameless when leadership wants someone held responsible?'],
            seniorPerspective: 'When I see a repeating incident class, I stop treating each one as a one-off and instead pull the last several post-mortems together to find the common thread. Usually it is a single underinvested area — say, no load testing on the payment path — and I make the business case for fixing that root cause as a funded initiative rather than yet another orphaned action item.',
            architectPerspective: 'Repeated incidents of the same class are an organizational signal, not just a technical one: they indicate that reliability work is structurally losing to feature work. I address it at the system level with error budgets — when the budget is spent, reliability work is automatically prioritized over features — which turns "we should fix this" into an enforced, org-wide policy rather than a hope.'
        },
        {
            question: 'How do you run an architecture review that catches real risk without becoming a bottleneck or a rubber stamp?',
            difficulty: 'advanced',
            answer: `<p>An architecture review must balance two failure modes: a heavyweight gate that slows every team (bottleneck), and a perfunctory sign-off that catches nothing (rubber stamp). The mechanism that threads this needle is a written, decision-focused process:</p>
<ul>
<li><strong>Right-size by blast radius.</strong> Reserve formal review for decisions that are <em>costly to reverse</em> or have <em>cross-team impact</em> (data model, public API contracts, security boundaries, new infrastructure). Let easily-reversible, local choices proceed without ceremony.</li>
<li><strong>Use a written proposal (RFC / ADR).</strong> The author states the problem, constraints, options considered, the recommendation, and explicit trade-offs. Writing forces clarity and lets reviewers engage asynchronously.</li>
<li><strong>Focus the review on the right questions</strong>: What are the failure modes? How does it scale? What are the security and data-integrity implications? What is the rollback/migration path? What did we explicitly decide <em>not</em> to do, and why?</li>
<li><strong>Decide and record.</strong> Capture the decision and its rationale in an ADR so future engineers understand why, not just what — preventing the same debate from recurring.</li>
<li><strong>Make it a dialogue, not a gate.</strong> Reviewers advise and surface risk; the owning team remains accountable for the decision. Senior engineers mentor through the review rather than dictate.</li>
</ul>`,
            explanation: 'It is like a building inspection. You do not re-inspect every time someone hangs a picture, but you absolutely review the foundation and load-bearing walls before they are poured — because those are the things you cannot cheaply change later. And you write down why each major choice was made so the next builder is not guessing.',
            bestPractices: ['Trigger formal review by reversibility and blast radius, not by team or seniority of the author', 'Require a written RFC/ADR stating options, trade-offs, and what was explicitly rejected', 'Probe failure modes, scaling, security, data integrity, and rollback/migration in every review', 'Record decisions and rationale in ADRs so the same debates do not recur'],
            commonMistakes: ['Reviewing everything, creating a bottleneck that teams route around or resent', 'Reviewing nothing meaningfully, so it becomes a rubber stamp that catches no real risk', 'Letting reviews devolve into style/preference debates instead of risk and trade-off analysis', 'Making decisions verbally and never recording the rationale, so the "why" is lost within months'],
            interviewTip: 'Lead with the two failure modes (bottleneck vs rubber stamp) and explain how triggering by reversibility and using written ADRs avoids both — that shows process judgment, not just process knowledge.',
            followUp: ['What belongs in an ADR?', 'How do you handle disagreement between a senior reviewer and the owning team?', 'How do you scale architecture governance across many teams?'],
            seniorPerspective: 'I run reviews as a conversation that ends in a recorded decision, and I am explicit that the owning team still owns the outcome — my job as reviewer is to surface the failure modes and migration risks they may not have seen, not to win an argument. The ADR is the real deliverable; six months later it is what stops us relitigating the same choice.',
            architectPerspective: 'At scale, architecture governance cannot route every decision through a central body without becoming the bottleneck. I favor a federated model: lightweight ADRs owned by teams, a shared set of guardrails and golden paths, and central review reserved for genuinely cross-cutting concerns. The goal is to make the right thing the easy thing so most decisions never need escalation.'
        }
    ,
        {
            question: 'How do you run effective sprint and capacity planning using empirical velocity?',
            difficulty: 'medium',
            answer: `<p>Plan against <strong>measured throughput</strong>, not optimistic guesses. Velocity is the average story points (or items) a team actually completes per sprint, observed over several sprints \u2014 not a target you set.</p>
            <ul>
                <li><strong>Capacity</strong> \u2014 adjust each sprint for real availability (PTO, holidays, on-call, meetings), don't assume 100% of headcount on feature work.</li>
                <li><strong>Commit to a range</strong> \u2014 pull work up to the lower end of recent velocity; treat the rest as stretch.</li>
                <li><strong>Split large items</strong> \u2014 anything bigger than a few days is broken down so estimates stay reliable.</li>
                <li><strong>Re-forecast</strong> \u2014 use the burndown to surface slippage early rather than discovering it at sprint end.</li>
            </ul>`,
            explanation: 'It is like packing a moving truck based on how much your crew actually moved on past jobs, minus the people who called in sick today \u2014 not based on how much you wish they could move.',
            bestPractices: ['Use rolling-average actual velocity, not an aspirational target', 'Adjust capacity for real availability (leave, on-call, meetings) each sprint', 'Split stories over a few days so estimates and flow stay predictable', 'Reserve buffer for support/unplanned work instead of committing 100%'],
            commonMistakes: ['Treating velocity as a productivity target to inflate (gaming the points)', 'Planning at full headcount and ignoring on-call/meetings/leave', 'Committing to the optimistic top of the range every sprint, then missing', 'Carrying giant unsplit stories that wreck predictability'],
            interviewTip: 'Stress that velocity is measured, not set, and that capacity must be adjusted for real availability. Mentioning that you commit to a range (not a single number) shows estimation maturity.',
            followUp: ['How do you handle a team whose velocity is highly variable?', 'How do you account for unplanned/support work?', 'Why is comparing velocity across teams an anti-pattern?'],
            seniorPerspective: 'I never let velocity become a performance metric \u2014 the moment it does, points inflate and it stops predicting anything. I use it purely as a forecasting tool and protect ~20% capacity for the unplanned work that always arrives.',
            architectPerspective: 'Predictable delivery is a systems property: small batch sizes, limited WIP, and empirical velocity compound into a planning signal leadership can trust. Chronic misses usually point to too much unknown entering sprints, which I fix with spikes and thinner vertical slices rather than pressure.'
        },
        {
            question: 'How do you estimate effort for a project with high uncertainty?',
            difficulty: 'hard',
            answer: `<p>High-uncertainty projects require <strong>progressive estimation</strong> — you reduce unknowns in stages rather than pretending you can size the whole thing upfront.</p>
            <ul>
                <li><strong>Spike first, estimate second</strong> — time-box a spike (1–3 days) to answer the biggest unknowns. Estimate after the spike when you have real data.</li>
                <li><strong>Estimate in phases</strong> — commit to a detailed estimate only for the next phase; later phases get progressively wider ranges.</li>
                <li><strong>Use confidence intervals</strong> — "50% confident in 3 weeks, 90% confident in 5 weeks" communicates risk honestly.</li>
                <li><strong>Identify and name the unknowns</strong> — list what you don't know and how each unknown affects the range. Stakeholders respond better to named risks than to padded numbers.</li>
                <li><strong>Plan re-estimation checkpoints</strong> — agree upfront that you will re-estimate after each phase as unknowns resolve.</li>
                <li><strong>Use reference class forecasting</strong> — compare to similar past projects (how long did the last integration take?) rather than estimating from scratch.</li>
            </ul>`,
            explanation: 'Estimating a high-uncertainty project in one shot is like quoting a renovation cost without opening the walls. You quote the inspection first, then give a real estimate once you know what is behind the drywall.',
            bestPractices: ['Time-box spikes to convert unknowns into estimable work before committing to a timeline', 'Communicate estimates as confidence ranges with named risk drivers', 'Plan explicit re-estimation checkpoints as unknowns resolve', 'Use reference-class forecasting from similar past work to anchor estimates'],
            commonMistakes: ['Giving a precise estimate for highly uncertain work (false confidence)', 'Padding secretly instead of communicating the uncertainty transparently', 'Skipping the spike and estimating from assumptions that turn out wrong', 'Not re-estimating when material new information emerges'],
            interviewTip: 'Show that you reframe the problem: "I don\u2019t estimate uncertain work — I reduce the uncertainty first, then estimate." Naming spikes, phased estimation, and confidence intervals signals mature planning.',
            followUp: ['How do you handle stakeholders who demand a single date despite uncertainty?', 'How do you decide when a spike is done?', 'How do you balance estimation accuracy against speed of commitment?'],
            seniorPerspective: 'My go-to move is to propose a funded spike with a clear question, a timebox, and an exit deliverable (the actual estimate). Stakeholders accept this because "give me 3 days and I will give you a real number" beats "maybe 4 weeks, maybe 12, who knows".',
            architectPerspective: 'Chronic estimation failure on uncertain work is usually a process problem: the org forces commitments before unknowns are resolved. I fix it structurally with discovery phases, thin vertical slices, and explicit decision gates — so teams commit to learn first, then commit to deliver.'
        },
        {
            question: 'How do you run an effective architecture review process that doesn\u2019t become a bottleneck?',
            difficulty: 'expert',
            answer: `<p>The goal is to <strong>catch high-risk decisions early</strong> without slowing every change. The key is right-sizing the process to the blast radius of the decision.</p>
            <ul>
                <li><strong>Triage by reversibility</strong> — only require formal review for hard-to-reverse, cross-team, or security-critical decisions. Local, reversible choices go through normal PR review.</li>
                <li><strong>Written proposals (RFC/design doc)</strong> — the author writes the problem, options, recommendation, and trade-offs. Async review lets reviewers engage on their schedule.</li>
                <li><strong>Time-box the review</strong> — set a deadline (e.g., 5 business days). No response = no objection. This prevents stalls.</li>
                <li><strong>Clear decision authority</strong> — the owning team decides; reviewers advise. This prevents design-by-committee paralysis.</li>
                <li><strong>Lightweight templates</strong> — a one-page template with Problem / Options / Recommendation / Trade-offs / Risks keeps proposals short and consistent.</li>
                <li><strong>Record the outcome</strong> — publish an ADR so the decision and its rationale are preserved and searchable.</li>
            </ul>`,
            explanation: 'An architecture review is like a building permit: you need it for structural changes that affect safety, not for painting a wall. Right-sizing the gate to the risk keeps things flowing while still catching the decisions that matter.',
            bestPractices: ['Right-size review to blast radius — heavy process only for irreversible, cross-team decisions', 'Use async written proposals to avoid scheduling bottlenecks', 'Time-box review with "silence = consent" to prevent indefinite stalls', 'Clearly separate advisory (reviewers) from decision authority (owning team)', 'Publish ADRs to prevent relitigating settled decisions'],
            commonMistakes: ['Requiring full architecture review for every change regardless of risk', 'No time-box, so proposals sit unreviewed for weeks', 'Reviewers have veto power with no accountability for the delay they cause', 'No written record, so the same decision gets debated again six months later', 'A single architect as bottleneck instead of distributed review'],
            interviewTip: 'Stress the triage principle (reversibility determines process weight) and the time-box to prevent stalls. The expert signal is balancing thoroughness with velocity — showing you\u2019ve run this at scale.',
            followUp: ['How do you handle a reviewer who blocks every proposal?', 'How do you scale architecture review across many teams?', 'When should you override the review process for speed?'],
            seniorPerspective: 'I learned the hard way that an architecture review with no deadline is an architecture block. Setting a 5-day SLA with "silence = no objection" was the single change that unblocked three teams that were waiting on review.',
            architectPerspective: 'I design the review process as a system: lightweight templates lower the cost to submit, async review removes scheduling friction, time-boxes prevent queuing, and ADRs provide the persistent output. The process itself must be architected for throughput, not just correctness.'
        }
    ],
    extraSections: [
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Padding estimates for safety</strong>: Inflated estimates erode trust. Better to be honest about uncertainty and use ranges.</li>
                <li><strong>Estimating in hours not story points</strong>: Hours create false precision. Relative sizing (story points) accounts for uncertainty better.</li>
                <li><strong>No backlog refinement</strong>: Trying to estimate and plan in the same meeting. Separate refinement (understand) from planning (commit).</li>
                <li><strong>100% capacity planning</strong>: No slack for bugs, production issues, or learning. Plan to 70-80% capacity.</li>
                <li><strong>Hiring for skills only</strong>: Ignoring culture fit and growth potential. A brilliant jerk damages more than they contribute.</li>
                <li><strong>Skipping architecture review</strong>: Significant decisions made in PRs with no upfront design review. ADRs and design docs catch issues early.</li>
                <li><strong>Blameful post-mortems</strong>: Focusing on WHO made the mistake instead of WHY the system allowed it. Blame prevents learning.</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Sprint planning: commit to what you can deliver. Say no to protect quality. Under-promise, over-deliver.</li>
                <li>Estimation: use relative sizing. Break large items into smaller ones. Track velocity empirically, don't guess.</li>
                <li>Hiring: optimize for growth potential + culture add, not just current skills. Hire people better than you.</li>
                <li>Architecture review: for significant changes, write design doc → review → decide → ADR. Catch issues before code.</li>
                <li>Production incidents: blameless post-mortem → action items with owners and deadlines. Focus on systemic fixes.</li>
                <li>Process improvement: measure lead time, deployment frequency, MTTR, change failure rate (DORA metrics).</li>
                <li>Technical debt: make it visible (track in backlog), allocate capacity (20% per sprint), and prioritize by risk/impact.</li>
            </ul>`
        }
    ]
});
