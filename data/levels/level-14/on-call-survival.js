PageData.register('on-call-survival', {
    title: 'On-Call Survival & Operational Excellence',
    description: 'How to design effective on-call rotations, reduce toil, write actionable runbooks, and maintain team health while keeping systems reliable.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>On-call is the bridge between building software and keeping it alive. Every senior+ interview asks how you handle production issues. The answer reveals whether you think holistically — not just writing code, but owning its behavior in production.</p><p>This topic covers rotation design, alert quality, runbook authoring, escalation protocols, toil reduction, handoff practices, burnout prevention, and operational reviews.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<ul><li><strong>Primary/Secondary</strong> — Primary handles alerts; secondary is backup</li><li><strong>Escalation</strong> — Time-bound: if not acknowledged in X minutes, escalate to next tier</li><li><strong>Toil</strong> — Repetitive, automatable operational work that provides no lasting value</li><li><strong>Error Budget</strong> — Acceptable unreliability (e.g., 0.1% downtime/month)</li><li><strong>Alert Fatigue</strong> — Too many low-value alerts desensitize responders</li><li><strong>MTTA/MTTD/MTTR</strong> — Mean Time to Acknowledge / Detect / Resolve</li><li><strong>Runbook</strong> — Step-by-step guide for diagnosing and resolving a known alert</li><li><strong>Operational Review</strong> — Regular team review of on-call burden, alert quality, and toil</li></ul>`
        },
        {
            title: 'How It Works',
            content: `<p>A well-designed on-call system follows this flow:</p><ol><li>Monitoring detects anomaly and fires alert</li><li>Alerting system routes to on-call person per schedule</li><li>On-call engineer acknowledges within SLA (usually 5 min)</li><li>Triage: assess severity, check runbook, determine blast radius</li><li>Mitigate: restore service first, root-cause later</li><li>Communicate: status page, stakeholder updates</li><li>Resolve: confirm metrics return to normal</li><li>Follow-up: write postmortem, create action items, update runbook</li></ol>`,
            mermaid: `sequenceDiagram
    participant M as Monitoring
    participant A as Alert System
    participant P as Primary On-Call
    participant S as Secondary
    participant R as Runbook
    M->>A: Threshold breached
    A->>P: Page via SMS + Push
    alt ACK within 5min
        P->>R: Check runbook
        R-->>P: Mitigation steps
        P->>M: Apply fix
        M-->>P: Metrics recover
    else No ACK
        A->>S: Escalate to secondary
    end
    P->>P: Write postmortem`
        },
        {
            title: 'Visual Diagram',
            content: `<p>On-call lifecycle from healthy system to resolution:</p>`,
            mermaid: `flowchart TD
    A[Healthy System] -->|Anomaly| B[Alert Fires]
    B --> C{Acknowledged?}
    C -->|Yes| D[Triage]
    C -->|Timeout| E[Escalate]
    E --> D
    D --> F{Runbook?}
    F -->|Yes| G[Follow Runbook]
    F -->|No| H[Investigate]
    G --> I[Mitigate]
    H --> I
    I --> J{Resolved?}
    J -->|Yes| K[Communicate]
    J -->|No| L[War Room]
    L --> I
    K --> M[Postmortem]
    M --> N[Update Runbooks]
    N --> A`
        },
        {
            title: 'Implementation',
            content: `<p>On-call tooling patterns in C#:</p>`,
            code: `// On-call rotation scheduler
public class OnCallScheduler
{
    private readonly List<Engineer> _pool;

    public OnCallScheduler(List<Engineer> pool)
    {
        if (pool.Count < 3)
            throw new InvalidOperationException("Need 3+ engineers for sustainable rotation");
        _pool = pool;
    }

    public OnCallAssignment GetCurrent(DateTime utcNow)
    {
        var weeksSinceEpoch = (int)(utcNow - DateTime.UnixEpoch).TotalDays / 7;
        var primaryIdx = weeksSinceEpoch % _pool.Count;
        var secondaryIdx = (primaryIdx + 1) % _pool.Count;
        return new OnCallAssignment(_pool[primaryIdx], _pool[secondaryIdx]);
    }
}

// Alert quality scoring
public class AlertQualityAnalyzer
{
    public double GetActionableRatio(List<AlertEvent> events, TimeSpan window)
    {
        var recent = events.Where(e => e.FiredAt > DateTime.UtcNow - window).ToList();
        if (recent.Count == 0) return 1.0;
        return recent.Count(e => e.RequiredAction) / (double)recent.Count;
    }

    public List<string> GetTopNoiseAlerts(List<AlertEvent> events, int top = 5)
    {
        return events
            .Where(e => !e.RequiredAction)
            .GroupBy(e => e.AlertName)
            .OrderByDescending(g => g.Count())
            .Take(top)
            .Select(g => g.Key)
            .ToList();
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Best Practices',
            content: `<ul><li><strong>Minimum 3 people in rotation</strong> — fewer means unsustainable burden</li><li><strong>Follow-the-sun</strong> — for global teams, hand off to the next timezone</li><li><strong>Every alert must have a runbook link</strong> — no orphan alerts</li><li><strong>Alert on symptoms, not causes</strong> — "Error rate > 5%" not "Pod restarted"</li><li><strong>Compensate on-call fairly</strong> — stipend, time-off-in-lieu, or both</li><li><strong>Shadow rotation for new members</strong> — 1-2 weeks before going primary</li><li><strong>Operational reviews weekly</strong> — review alert count, noise ratio, MTTA/MTTR</li><li><strong>Automate top-3 toil items quarterly</strong> — if you fix it manually 3+ times, automate it</li><li><strong>Escalation is not failure</strong> — make it culturally safe to escalate early</li><li><strong>Handoff protocol</strong> — document active incidents and recent changes at rotation boundary</li></ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul><li><strong>Hero culture</strong> — one person handles all incidents, becomes SPOF and burns out</li><li><strong>Alert spam</strong> — hundreds of alerts per shift, most non-actionable</li><li><strong>No runbooks</strong> — every alert requires investigation from scratch</li><li><strong>Punishing escalation</strong> — engineers fear looking incompetent, struggle alone for hours</li><li><strong>No postmortems</strong> — same incident recurs because nobody documented the fix</li><li><strong>Alerting on every metric</strong> — CPU at 70% is not an alert; user-facing error rate is</li><li><strong>Ignoring toil</strong> — manual restarts and cache clears that should be automated</li><li><strong>No shadowing</strong> — throwing new joiners into primary without preparation</li><li><strong>Uneven distribution</strong> — same people always get the bad weeks</li></ul>`
        },
        {
            title: 'Real-World Applications',
            content: `<p>How top companies run on-call:</p>`,
            table: {
                headers: ['Company', 'Approach', 'Key Innovation'],
                rows: [
                    ['Google SRE', '50% rule: max 50% time on toil', 'Error budgets — SRE can block releases'],
                    ['PagerDuty', 'You build it, you run it', 'Incident response automation'],
                    ['Stripe', 'On-call reviews every sprint', 'Alert quality score per service'],
                    ['Netflix', 'Chaos engineering reduces surprises', 'Proactive failure injection'],
                    ['Datadog', 'Follow-the-sun with 3 regions', 'Nobody paged outside business hours']
                ]
            }
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul><li><strong>Ownership mentality</strong> — "I was on-call when X happened, here is what I did"</li><li><strong>Process thinking</strong> — Do you have a framework for triaging?</li><li><strong>Empathy for team</strong> — How do you prevent burnout?</li><li><strong>Continuous improvement</strong> — Every incident should make the system better</li><li><strong>Pragmatism</strong> — Mitigate first, root-cause second</li><li><strong>Communication</strong> — Can you run an incident channel?</li></ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul><li>On-call is a team sport — design for sustainability, not heroics</li><li>Alert quality matters more than alert quantity</li><li>Runbooks are living documents — update after every incident</li><li>Toil is the enemy — automate the top-3 manual tasks quarterly</li><li>Escalation is healthy — celebrate asking for help</li><li>Operational reviews close the loop — without measurement, nothing improves</li><li>Shadowing builds confidence — never throw someone into primary cold</li><li>Compensation matters — respect people's time outside work hours</li></ul>`
        }
    ],
    questions: [
        {
            id: 'oncall-q1',
            level: 'mid',
            title: 'How would you design an on-call rotation for a team of 5 engineers?',
            answer: `<p>Key considerations:</p><ul><li><strong>Weekly rotation</strong> — each person primary every 5 weeks (sustainable threshold)</li><li><strong>Primary + secondary</strong> — secondary covers if primary is overwhelmed</li><li><strong>Handoff day</strong> — Monday morning with written handoff note</li><li><strong>Shadow period</strong> — new members shadow for 2 rotations before primary</li><li><strong>Swap protocol</strong> — advance notice via scheduling tool</li><li><strong>Compensation</strong> — stipend + time-off-in-lieu for incidents exceeding 2 hours</li><li><strong>Escalation</strong> — 5-min ACK timeout to secondary, 15-min to manager</li></ul><p>With 5 people, the burden is 1 week in 5 — right at sustainability. Below 4, you need to hire or share across teams.</p>`
        },
        {
            id: 'oncall-q2',
            level: 'mid',
            title: 'What makes a good runbook?',
            answer: `<p>A good runbook gets a sleepy engineer from alert to resolution with minimal cognitive effort:</p><ul><li><strong>Alert context</strong> — what fired, what it means, what service</li><li><strong>Severity assessment</strong> — how to determine P1 vs P3</li><li><strong>Diagnostic steps</strong> — exact commands/dashboards (copy-pasteable)</li><li><strong>Mitigation steps</strong> — how to restore service immediately</li><li><strong>Root cause investigation</strong> — where to look after service is restored</li><li><strong>Escalation criteria</strong> — when to wake more people</li><li><strong>Communication template</strong> — status page update text</li><li><strong>Last updated</strong> — date + author; stale runbooks are dangerous</li></ul><p>Anti-pattern: a runbook that says "investigate and fix." That is not a runbook.</p>`
        },
        {
            id: 'oncall-q3',
            level: 'senior',
            title: 'How do you reduce alert fatigue without missing real incidents?',
            answer: `<p>Systematic approach:</p><ol><li><strong>Audit existing alerts</strong> — classify as actionable, informational, or noise. Delete noise.</li><li><strong>Alert on symptoms, not causes</strong> — "HTTP 5xx rate > 1%" not "Pod restarted"</li><li><strong>Tune thresholds with data</strong> — if dismissed 48/50 times, raise the threshold</li><li><strong>Use alert routing</strong> — P1 (page), P2 (Slack + 30min), P3 (ticket, next business day)</li><li><strong>Aggregate correlated alerts</strong> — one incident should not fire 15 alerts</li><li><strong>Auto-resolve transient spikes</strong> — require sustained for N minutes before firing</li><li><strong>Weekly alert quality review</strong> — track noise ratio; target less than 20% no-action</li><li><strong>Ownership</strong> — every alert has an owning team; unowned alerts get deleted</li></ol><p>Metric: <strong>Actionable Alert Ratio</strong> = alerts requiring human intervention / total alerts. Target > 80%.</p>`
        },
        {
            id: 'oncall-q4',
            level: 'junior',
            title: 'What is the difference between MTTA, MTTD, and MTTR?',
            answer: `<p>These are key incident response metrics:</p><ul><li><strong>MTTD (Mean Time to Detect)</strong> — Time from when a problem starts to when monitoring detects it. Improved by better alerting, lower thresholds, synthetic monitoring.</li><li><strong>MTTA (Mean Time to Acknowledge)</strong> — Time from alert firing to engineer acknowledging. Improved by better paging, escalation policies, follow-the-sun.</li><li><strong>MTTR (Mean Time to Resolve/Recover)</strong> — Time from detection to service restored. Improved by runbooks, automation, rollback capability.</li></ul><p>Total incident duration = MTTD + MTTA + MTTR. Each metric targets different improvements.</p>`
        },
        {
            id: 'oncall-q5',
            level: 'senior',
            title: 'How do you measure and reduce toil?',
            answer: `<p><strong>Toil</strong> (per Google SRE) is work that is: manual, repetitive, automatable, reactive, has no enduring value, and scales linearly with service growth.</p><p><strong>Measuring toil:</strong></p><ul><li>Track time spent on operational tasks vs engineering work</li><li>Categorize each on-call action: incident, toil, or engineering</li><li>Google SRE target: max 50% toil, min 50% engineering</li></ul><p><strong>Reducing toil:</strong></p><ol><li>Identify top-3 most frequent manual actions from on-call logs</li><li>Automate them: self-healing scripts, auto-scaling, auto-rollback</li><li>Eliminate the source: fix the bug that causes the recurring restart</li><li>Track toil budget quarterly — if growing, escalate for engineering time</li></ol><p>If toil exceeds 50%, the SRE team can refuse to onboard new services until it is addressed.</p>`
        },
        {
            id: 'oncall-q6',
            level: 'senior',
            title: 'How do you prevent on-call burnout?',
            answer: `<p>Burnout prevention requires structural solutions, not just goodwill:</p><ul><li><strong>Fair rotation</strong> — algorithmic scheduling that accounts for holidays, incidents</li><li><strong>Incident load tracking</strong> — if someone had 5 incidents in their week, reduce their next rotation</li><li><strong>Compensation</strong> — real money or real time off, not just "thanks"</li><li><strong>Shadow support</strong> — nobody handles a P1 alone; always pair</li><li><strong>Toil reduction investment</strong> — allocate engineering time specifically to reduce on-call burden</li><li><strong>Alert quality gates</strong> — new alerts require runbook + owner before activation</li><li><strong>Blameless culture</strong> — escalation celebrated, mistakes are learning opportunities</li><li><strong>Regular check-ins</strong> — manager asks "how was on-call?" not just "did you fix it?"</li></ul><p>Structural signal that burnout is happening: people trading shifts, calling in sick during on-call weeks, or leaving the team.</p>`
        },
        {
            id: 'oncall-q7',
            level: 'architect',
            title: 'How would you design an on-call system for a 200-person engineering org?',
            answer: `<p>At scale, on-call becomes an organizational design problem:</p><ul><li><strong>Team-level rotations</strong> — each team owns their services; no central SRE handling everything</li><li><strong>Tiered escalation</strong> — Team on-call → Team lead → Service area lead → Incident Commander</li><li><strong>Follow-the-sun</strong> — 3 regions means nobody gets paged outside business hours</li><li><strong>Incident Commander rotation</strong> — senior engineers rotate as IC for cross-team incidents</li><li><strong>Shared tooling</strong> — centralized PagerDuty/OpsGenie, standardized runbook format, common dashboards</li><li><strong>On-call quality metrics per team</strong> — published weekly; teams below threshold get engineering investment</li><li><strong>Minimum viable rotation size</strong> — enforce 4+ people per rotation; small teams share cross-team</li><li><strong>Budget for on-call engineering</strong> — 20% of eng time allocated to reliability work (runbooks, automation, alerting)</li></ul><p>Key principle: "You build it, you run it" — but with guardrails to prevent burnout.</p>`
        },
        {
            id: 'oncall-q8',
            level: 'architect',
            title: 'How do you run a blameless postmortem? What makes them effective?',
            answer: `<p>A blameless postmortem focuses on <strong>systemic causes</strong>, not individual blame:</p><p><strong>Structure:</strong></p><ol><li><strong>Timeline</strong> — exact sequence of events with timestamps</li><li><strong>Impact</strong> — users affected, duration, revenue impact</li><li><strong>Root cause</strong> — the systemic reason (not "John made a mistake")</li><li><strong>Contributing factors</strong> — what made the incident worse or delayed resolution</li><li><strong>What went well</strong> — what worked in the response</li><li><strong>Action items</strong> — specific, assigned, time-bound improvements</li></ol><p><strong>What makes them effective:</strong></p><ul><li>Written within 48 hours while memory is fresh</li><li>Facilitated by someone NOT involved in the incident</li><li>Focus on "what" and "how", never "who"</li><li>Action items have owners and deadlines (not "we should improve monitoring")</li><li>Shared publicly within engineering (transparency builds trust)</li><li>Follow-up meeting to check action item completion</li></ul><p>The test: would an engineer feel safe admitting they caused an outage? If not, you do not have blameless culture yet.</p>`
        }
    ]
});
