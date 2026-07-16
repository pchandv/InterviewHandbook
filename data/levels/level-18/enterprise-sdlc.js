/* ═══════════════════════════════════════════════════════════════════
   Enterprise Software Delivery — SDLC & Agile Frameworks
   Waterfall, Agile, Scrum, Kanban, SAFe, estimation, ceremonies
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('enterprise-sdlc', {
    title: 'SDLC & Agile Frameworks',
    description: 'Software Development Life Cycle models, Agile frameworks (Scrum, Kanban, SAFe), sprint ceremonies, estimation techniques, and how real enterprise teams deliver software.',
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    prerequisites: [],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Every engineering team follows some form of <strong>SDLC</strong> (Software Development Life Cycle). Understanding these models is essential for senior engineers — you will be asked about process in interviews, expected to improve it on the job, and need to communicate effectively with PMs, QA, and leadership.</p>
            <p>This is NOT just a PM topic. Senior engineers are expected to:</p>
            <ul>
                <li>Choose appropriate processes for their team</li>
                <li>Identify when process is helping vs hurting</li>
                <li>Estimate work accurately</li>
                <li>Run ceremonies effectively</li>
                <li>Communicate delivery risk to stakeholders</li>
            </ul>`
        },
        {
            title: 'SDLC Models',
            content: `<p>Different models suit different contexts. No single model is universally "best."</p>`,
            table: {
                headers: ['Model', 'Flow', 'Best For', 'Weakness'],
                rows: [
                    ['Waterfall', 'Linear: Requirements → Design → Code → Test → Deploy', 'Regulatory, fixed-scope contracts, hardware', 'No feedback until end; costly changes'],
                    ['Agile', 'Iterative: short cycles with continuous feedback', 'Most software; evolving requirements', 'Needs discipline; can become chaotic'],
                    ['Scrum', 'Time-boxed sprints (1-4 weeks) with defined roles', 'Teams of 5-9, product development', 'Overhead for small teams; sprint rigidity'],
                    ['Kanban', 'Continuous flow with WIP limits', 'Support, ops, continuous delivery', 'Less structure; needs mature team'],
                    ['Spiral', 'Iterative + risk analysis at each cycle', 'High-risk projects, R&D', 'Complex; needs risk expertise'],
                    ['SAFe', 'Scaled Agile for large orgs (ARTs, PIs)', 'Enterprise with 50+ developers', 'Heavy process; expensive to adopt'],
                    ['Hybrid', 'Agile delivery + Waterfall governance', 'Enterprise with compliance needs', 'Can get worst of both worlds']
                ]
            },
            mermaid: `graph LR
    W[Waterfall] -->|"evolve"| A[Agile]
    A -->|"structure"| S[Scrum]
    A -->|"flow"| K[Kanban]
    A -->|"scale"| SAFe[SAFe]
    S -->|"combine"| SK[Scrumban]

    style W fill:#ef4444,color:#fff
    style A fill:#3b82f6,color:#fff
    style S fill:#8b5cf6,color:#fff
    style K fill:#10b981,color:#fff
    style SAFe fill:#f59e0b,color:#fff`
        },
        {
            title: 'Scrum Deep Dive',
            content: `<p><strong>Scrum</strong> is the most common Agile framework. Key elements:</p>
            <ul>
                <li><strong>Roles:</strong> Product Owner (what to build), Scrum Master (process), Development Team (how to build)</li>
                <li><strong>Artifacts:</strong> Product Backlog, Sprint Backlog, Increment</li>
                <li><strong>Events:</strong> Sprint Planning, Daily Standup, Sprint Review, Sprint Retrospective</li>
                <li><strong>Sprint:</strong> 1-4 week time-box (2 weeks most common)</li>
            </ul>`,
            table: {
                headers: ['Ceremony', 'Purpose', 'Duration (2wk sprint)', 'Who Attends'],
                rows: [
                    ['Sprint Planning', 'Select and decompose work for the sprint', '2-4 hours', 'Whole team + PO'],
                    ['Daily Standup', 'Sync on progress, surface blockers', '15 minutes', 'Dev team (PO optional)'],
                    ['Sprint Review', 'Demo increment to stakeholders', '1-2 hours', 'Team + stakeholders'],
                    ['Sprint Retro', 'Reflect on process, identify improvements', '1-1.5 hours', 'Team only'],
                    ['Backlog Grooming', 'Refine upcoming stories, estimate', '1-2 hours', 'Team + PO']
                ]
            }
        },
        {
            title: 'Estimation Techniques',
            content: `<p>Estimation is one of the hardest skills and a common interview topic. Key approaches:</p>
            <ul>
                <li><strong>Story Points</strong> — Relative sizing (Fibonacci: 1, 2, 3, 5, 8, 13). Measures complexity, not time.</li>
                <li><strong>T-Shirt Sizing</strong> — XS, S, M, L, XL. Good for roadmap-level estimates.</li>
                <li><strong>Planning Poker</strong> — Team votes independently, discuss outliers, converge.</li>
                <li><strong>Three-Point</strong> — (Optimistic + 4*Likely + Pessimistic) / 6 = Expected duration.</li>
                <li><strong>No Estimates</strong> — Track throughput instead; forecast by counting stories.</li>
            </ul>
            <p><strong>Velocity</strong> = average story points completed per sprint. Used for forecasting, NOT as a productivity metric.</p>`,
            callout: { type: 'warning', title: 'Common Trap', text: 'Never use velocity to compare teams or pressure developers. Velocity is a planning tool for the team itself, not a management KPI. Saying this in an interview shows maturity.' }
        },
        {
            title: 'Kanban vs Scrum',
            content: `<p>Both are Agile but suit different contexts:</p>`,
            table: {
                headers: ['Aspect', 'Scrum', 'Kanban'],
                rows: [
                    ['Cadence', 'Fixed sprints (1-4 weeks)', 'Continuous flow'],
                    ['Roles', 'PO, SM, Dev Team', 'No prescribed roles'],
                    ['Planning', 'Sprint Planning every sprint', 'Replenish when capacity allows'],
                    ['WIP Limits', 'Sprint backlog is the limit', 'Explicit per-column WIP limits'],
                    ['Changes', 'Avoid mid-sprint changes', 'New items can enter anytime'],
                    ['Metrics', 'Velocity, burndown', 'Lead time, cycle time, throughput'],
                    ['Best For', 'Product development, new features', 'Support, ops, continuous delivery'],
                    ['Overhead', 'Higher (ceremonies)', 'Lower (fewer meetings)']
                ]
            }
        },
        {
            title: 'SAFe (Scaled Agile Framework)',
            content: `<p><strong>SAFe</strong> scales Agile to large organizations (50-500+ developers). Key concepts:</p>
            <ul>
                <li><strong>ART (Agile Release Train)</strong> — 50-125 people aligned to a value stream</li>
                <li><strong>PI (Program Increment)</strong> — 8-12 week planning cycle (4-5 sprints)</li>
                <li><strong>PI Planning</strong> — 2-day event where all teams align on objectives</li>
                <li><strong>RTE (Release Train Engineer)</strong> — Like a Scrum Master for the ART</li>
                <li><strong>Features → Stories</strong> — PMs write features, teams decompose to stories</li>
            </ul>
            <p><strong>When to use:</strong> Multiple teams building one product. Not suitable for small teams or startups.</p>`,
            mermaid: `graph TD
    PO[Portfolio] --> VS[Value Streams]
    VS --> ART1[ART 1: Platform]
    VS --> ART2[ART 2: Customer]
    ART1 --> T1[Team 1]
    ART1 --> T2[Team 2]
    ART1 --> T3[Team 3]
    ART2 --> T4[Team 4]
    ART2 --> T5[Team 5]

    PI[PI Planning<br/>Every 10 weeks] -.->|aligns| ART1
    PI -.->|aligns| ART2

    style PI fill:#f59e0b,color:#fff
    style ART1 fill:#3b82f6,color:#fff
    style ART2 fill:#8b5cf6,color:#fff`
        },
        {
            title: 'Interview Tips',
            callout: { type: 'tip', title: 'What Interviewers Look For', text: 'Senior engineers should articulate WHY they prefer one process over another, not just describe them. Show you can adapt process to context: "For our 4-person team, Scrum was too heavy — we switched to Kanban with weekly planning and our throughput improved 30%." Real examples beat textbook definitions.' }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>No SDLC is universally best — choose based on team size, domain, and risk tolerance</li>
                <li>Scrum works for most product teams (5-9 people, evolving requirements)</li>
                <li>Kanban suits support/ops/continuous-delivery (flow over cadence)</li>
                <li>SAFe scales Agile to large organizations via ARTs and PI Planning</li>
                <li>Estimation is about managing expectations, not predicting the future</li>
                <li>Velocity is a planning tool, not a productivity metric</li>
                <li>Senior engineers improve process, not just follow it</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'sdlc-q1',
            level: 'junior',
            title: 'What is the difference between Agile and Scrum?',
            answer: `<p><strong>Agile</strong> is a set of values and principles (the Agile Manifesto). <strong>Scrum</strong> is a specific framework that implements Agile with defined roles, events, and artifacts.</p><p>Agile says "respond to change." Scrum says "here is exactly how: 2-week sprints, daily standups, PO/SM roles, etc."</p><p>You can be Agile without using Scrum (e.g., Kanban is also Agile).</p>`
        },
        {
            id: 'sdlc-q2',
            level: 'mid',
            title: 'When would you choose Waterfall over Agile?',
            answer: `<p><strong>Waterfall is appropriate when:</strong></p><ul><li>Requirements are fixed and well-understood upfront (e.g., regulatory compliance)</li><li>The project has contractual obligations with fixed scope/price</li><li>Hardware or embedded systems where changes are physically expensive</li><li>Audit/compliance requires signed-off requirements documents before coding</li></ul><p><strong>In practice:</strong> Many enterprises use "Water-Scrum-Fall" — Waterfall governance (approvals, gates) with Agile delivery internally.</p>`
        },
        {
            id: 'sdlc-q3',
            level: 'senior',
            title: 'Your team consistently fails to complete sprint commitments. How do you diagnose and fix this?',
            answer: `<p><strong>Diagnosis steps:</strong></p><ul><li>Check if stories are too large (not decomposed) — average should be 3-5 points</li><li>Look at unplanned work ratio — if >30% is urgent bugs/interrupts, address quality</li><li>Check estimation accuracy — are 5-point stories actually taking 8-point effort?</li><li>Review scope creep — are stories growing mid-sprint?</li><li>Assess team capacity — accounting for meetings, on-call, vacations?</li></ul><p><strong>Fixes:</strong> Reduce sprint commitment by 20% (build trust), enforce Definition of Ready, track interrupts separately, improve grooming quality, protect team from mid-sprint scope additions.</p>`,
            interviewTip: 'Show systematic thinking. Do not just say "estimate better." Demonstrate you would look at data (velocity trend, unplanned %) and address root causes.'
        },
        {
            id: 'sdlc-q4',
            level: 'senior',
            title: 'How do you estimate a project you have never done before?',
            answer: `<p><strong>Approach for novel work:</strong></p><ol><li><strong>Spike first</strong> — Time-box 1-2 days to explore the unknown, reduce uncertainty</li><li><strong>Decompose</strong> — Break into smallest knowable pieces, estimate those</li><li><strong>Three-point estimation</strong> — Best case, likely, worst case for each piece</li><li><strong>Reference class forecasting</strong> — "Similar projects historically took X"</li><li><strong>Communicate uncertainty</strong> — Give a range, not a number: "2-4 weeks, depends on API stability"</li></ol><p><strong>Key insight:</strong> The goal is not accuracy — it is managing stakeholder expectations and identifying risks early.</p>`
        },
        {
            id: 'sdlc-q5',
            level: 'lead',
            title: 'How would you transition a team from Scrum to Kanban?',
            answer: `<p><strong>When to consider:</strong> Team is doing mostly maintenance/support, sprint boundaries feel artificial, work items are unpredictable in size.</p><p><strong>Transition steps:</strong></p><ol><li>Visualize current flow (board with columns: To Do, In Progress, Review, Done)</li><li>Introduce WIP limits gradually (start generous, tighten over time)</li><li>Replace sprint planning with replenishment meetings (weekly)</li><li>Keep standups (shorter — focus on flow, not status)</li><li>Replace velocity with throughput + cycle time metrics</li><li>Keep retros (monthly instead of every sprint)</li></ol><p><strong>Common mistake:</strong> Dropping all meetings at once. Keep structure, just reduce cadence.</p>`
        },
        {
            id: 'sdlc-q6',
            level: 'mid',
            title: 'Explain story points. Why not estimate in hours?',
            answer: `<p><strong>Story points</strong> measure relative complexity/effort, not time. A 5-point story is roughly 2.5x the effort of a 2-point story.</p><p><strong>Why not hours:</strong></p><ul><li>Hours imply precision that does not exist ("8 hours" feels like a promise)</li><li>Different developers take different time — points normalize this</li><li>Managers misuse hours as productivity metrics</li><li>Points encourage decomposition over precise time estimation</li></ul><p><strong>How they work:</strong> Team agrees on a reference story (e.g., "this login feature is a 3"). Everything else is estimated relative to that anchor.</p>`
        },
        {
            id: 'sdlc-q7',
            level: 'lead',
            title: 'Your organization wants to adopt SAFe. What concerns would you raise?',
            answer: `<p><strong>Legitimate concerns:</strong></p><ul><li><strong>Cost:</strong> SAFe requires extensive training, tooling, and new roles (RTE, Solution Architect)</li><li><strong>Overhead:</strong> PI Planning is a 2-day event every 10 weeks with 100+ people</li><li><strong>Rigidity:</strong> Can reduce team autonomy and slow decision-making</li><li><strong>Cultural fit:</strong> Works best with buy-in from leadership; forced adoption fails</li><li><strong>Alternatives:</strong> LeSS, Nexus, or ad-hoc coordination may be lighter</li></ul><p><strong>When SAFe works:</strong> Multiple teams with genuine dependencies building one product. When it fails: teams are independent and just need alignment, not orchestration.</p>`,
            interviewTip: 'Showing awareness of SAFe drawbacks demonstrates you think critically about process, not just follow trends.'
        },
        {
            id: 'sdlc-q8',
            level: 'architect',
            title: 'How does software architecture influence the choice of SDLC/process?',
            answer: `<p><strong>Conway's Law applies:</strong> Architecture shapes process, and vice versa.</p><ul><li><strong>Monolith</strong> → Needs more coordination (one team's change affects others) → Scrum with careful planning</li><li><strong>Microservices</strong> → Independent teams can use Kanban (deploy independently) → Less cross-team ceremony</li><li><strong>Platform team</strong> → Kanban (support + internal product mix)</li><li><strong>New product</strong> → Scrum (structured discovery + delivery)</li></ul><p><strong>Key insight:</strong> If your architecture requires teams to coordinate on every release, no amount of process will make them "Agile." Fix the architecture (loose coupling) to enable process flexibility.</p>`
        }
    ]
});
