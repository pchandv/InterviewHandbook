/* ═══════════════════════════════════════════════════════════════════
   Enterprise Software Delivery — Team Structures & Terminology
   Squads, Pods, Team Topologies, Enterprise Jargon, RACI, OKRs
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('enterprise-teams', {
    title: 'Team Structures & Enterprise Terms',
    description: 'Enterprise team models (Squads, Pods, Tribes, Team Topologies), common enterprise terminology (BAU, RCA, UAT, OKRs, KPIs, RACI), project status language, and the vocabulary of professional software delivery.',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    prerequisites: [],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Senior engineers work within organizational structures and communicate using enterprise vocabulary daily. Understanding team models and terminology is essential for:</p>
            <ul>
                <li>Interview conversations about "how you work in a team"</li>
                <li>Onboarding at new companies (every org uses these terms)</li>
                <li>Cross-functional communication with PMs, QA, ops, leadership</li>
                <li>Designing architectures that align with team structures (Conway Law)</li>
            </ul>`
        },
        {
            title: 'Team Topologies',
            content: `<p><strong>Team Topologies</strong> (Skelton & Pais, 2019) defines four fundamental team types and three interaction modes. This is the most influential modern model for software team design.</p>
            <ul>
                <li><strong>Stream-aligned Team</strong> — Delivers value end-to-end for a business capability. The primary team type (~80% of teams).</li>
                <li><strong>Platform Team</strong> — Provides internal services/tools that reduce cognitive load for stream-aligned teams.</li>
                <li><strong>Enabling Team</strong> — Helps other teams adopt new practices (temporary coaching).</li>
                <li><strong>Complicated-Subsystem Team</strong> — Owns complex domain requiring specialist knowledge (ML, cryptography).</li>
            </ul>`,
            mermaid: `graph TD
    SA1[Stream-aligned<br/>Team: Payments] --> P[Platform Team<br/>Internal Developer Platform]
    SA2[Stream-aligned<br/>Team: Checkout] --> P
    SA3[Stream-aligned<br/>Team: Search] --> P
    E[Enabling Team<br/>Cloud Migration] -.->|coaching| SA1
    CS[Complicated-Subsystem<br/>Team: ML Ranking] -->|"provides API"| SA3

    style SA1 fill:#3b82f6,color:#fff
    style SA2 fill:#3b82f6,color:#fff
    style SA3 fill:#3b82f6,color:#fff
    style P fill:#10b981,color:#fff
    style E fill:#f59e0b,color:#fff
    style CS fill:#8b5cf6,color:#fff`
        },
        {
            title: 'Spotify Model & Squads',
            content: `<p>The <strong>Spotify Model</strong> (popularized 2012) introduced vocabulary many companies still use:</p>`,
            table: {
                headers: ['Term', 'Definition', 'Typical Size'],
                rows: [
                    ['Squad', 'Cross-functional team owning a feature/product area', '6-10 people'],
                    ['Tribe', 'Collection of squads working in a related area', '40-150 people'],
                    ['Chapter', 'People with same skill across squads (e.g., all backend devs)', '5-15 people'],
                    ['Guild', 'Voluntary community of interest across the org', 'Any size'],
                    ['POD', 'Generic term for a small cross-functional team (same as squad)', '5-8 people'],
                    ['Feature Team', 'Team organized around a feature (end-to-end ownership)', '5-9 people'],
                    ['Component Team', 'Team organized around a tech component (e.g., database team)', '4-8 people'],
                    ['Platform Team', 'Builds internal tools/infrastructure for other teams', '5-10 people']
                ]
            }
        },
        {
            title: 'Enterprise Terminology — Glossary',
            content: `<p>Every enterprise uses these acronyms and terms. Know them cold.</p>`,
            table: {
                headers: ['Term', 'Full Form', 'Meaning'],
                rows: [
                    ['BAU', 'Business As Usual', 'Day-to-day operational work (not project work)'],
                    ['RCA', 'Root Cause Analysis', 'Investigation after an incident to find the underlying cause'],
                    ['PIR', 'Post-Incident Review', 'Meeting to discuss what happened and prevent recurrence'],
                    ['KT', 'Knowledge Transfer', 'Sharing knowledge between team members (during handoff)'],
                    ['UAT', 'User Acceptance Testing', 'End users test the system before go-live'],
                    ['SIT', 'System Integration Testing', 'Testing multiple systems working together'],
                    ['DR', 'Disaster Recovery', 'Plan/process to recover from catastrophic failure'],
                    ['BCP', 'Business Continuity Plan', 'How business operates during a disaster'],
                    ['OKR', 'Objectives and Key Results', 'Goal-setting framework (what + measurable outcomes)'],
                    ['KPI', 'Key Performance Indicator', 'Metric that measures success of an objective'],
                    ['RACI', 'Responsible, Accountable, Consulted, Informed', 'Matrix showing who does what for each task'],
                    ['RAID', 'Risks, Assumptions, Issues, Dependencies', 'Project tracking log for risk management'],
                    ['MVP', 'Minimum Viable Product', 'Smallest release that delivers value and enables learning'],
                    ['POC', 'Proof of Concept', 'Quick experiment to validate feasibility'],
                    ['Spike', 'Research/exploration task', 'Time-boxed investigation to reduce uncertainty'],
                    ['Tech Debt', 'Technical Debt', 'Shortcuts that save time now but cost more later'],
                    ['Brownfield', 'Existing system/codebase', 'Working with legacy code (vs greenfield = new project)'],
                    ['Shift Left', 'Move testing/security earlier', 'Find issues earlier in development (cheaper to fix)']
                ]
            }
        },
        {
            title: 'Project Status Language',
            content: `<p>When communicating with leadership, use standard status terminology:</p>
            <ul>
                <li><strong>RAG Status</strong> — Red (off track, needs intervention), Amber (at risk, needs attention), Green (on track)</li>
                <li><strong>Blocked</strong> — Cannot proceed without external dependency being resolved</li>
                <li><strong>Critical Path</strong> — The sequence of tasks that determines minimum project duration</li>
                <li><strong>Milestone</strong> — Significant checkpoint (not a task, but a state: "API complete")</li>
                <li><strong>Escalated</strong> — Raised to higher management because team cannot resolve alone</li>
            </ul>`,
            callout: { type: 'tip', title: 'Communication Tip', text: 'In status updates, always lead with RAG, then explain WHY. "Amber — blocked on API team delivering auth endpoint (ETA: 3 days). Mitigation: mocking auth locally to continue frontend work." This shows you communicate like a lead, not just a developer.' }
        },
        {
            title: 'RACI Matrix',
            content: `<p>The <strong>RACI matrix</strong> clarifies ownership for every task or decision:</p>
            <ul>
                <li><strong>R — Responsible</strong> — Does the work (can be multiple people)</li>
                <li><strong>A — Accountable</strong> — Ultimately answerable (ONE person only)</li>
                <li><strong>C — Consulted</strong> — Provides input before decision/action</li>
                <li><strong>I — Informed</strong> — Notified after decision/action</li>
            </ul>`,
            table: {
                headers: ['Activity', 'Dev Team', 'Tech Lead', 'Product Owner', 'QA', 'DevOps'],
                rows: [
                    ['Write Code', 'R', 'A', 'I', 'I', 'I'],
                    ['Architecture Decision', 'C', 'R/A', 'C', 'I', 'C'],
                    ['Feature Prioritization', 'C', 'C', 'R/A', 'C', 'I'],
                    ['Test Strategy', 'C', 'C', 'I', 'R/A', 'C'],
                    ['Deploy to Production', 'C', 'A', 'I', 'C', 'R'],
                    ['Incident Response', 'R', 'A', 'I', 'I', 'R']
                ]
            }
        },
        {
            title: 'OKRs vs KPIs',
            content: `<p>Both measure success but serve different purposes:</p>
            <ul>
                <li><strong>OKRs</strong> — Aspirational goals with measurable results. Set quarterly. Should be stretch (70% achievement = good).</li>
                <li><strong>KPIs</strong> — Ongoing health metrics. Tracked continuously. Should be 100% (it is a standard, not a stretch).</li>
            </ul>
            <p><strong>Example OKR:</strong> Objective: "Improve developer experience." KR1: Reduce CI build time from 12min to 5min. KR2: Achieve 90% developer satisfaction in quarterly survey.</p>
            <p><strong>Example KPIs:</strong> API uptime > 99.9%, P95 latency < 200ms, deployment frequency > 5/week.</p>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Team Topologies (stream-aligned, platform, enabling, complicated-subsystem) is the modern standard</li>
                <li>Squad/Tribe/Chapter is the Spotify model vocabulary — widely adopted, not always well-executed</li>
                <li>Enterprise terms (BAU, RCA, UAT, RACI, RAID, OKR) are the language of professional delivery</li>
                <li>RAG status (Red/Amber/Green) is universal project communication</li>
                <li>RACI ensures clear ownership — Accountable must be exactly one person</li>
                <li>Conway's Law: architecture mirrors team structure (and vice versa)</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'teams-q1',
            level: 'mid',
            title: 'Describe the four team types in Team Topologies.',
            answer: `<p><strong>1. Stream-aligned:</strong> End-to-end ownership of a value stream (e.g., "Payments team"). Most teams should be this type.</p><p><strong>2. Platform:</strong> Provides internal services (CI/CD, cloud infrastructure, developer tools) that reduce cognitive load for stream-aligned teams.</p><p><strong>3. Enabling:</strong> Temporary coaching team that helps others adopt new practices (e.g., cloud migration specialists). Works itself out of a job.</p><p><strong>4. Complicated-subsystem:</strong> Owns domain requiring deep specialist knowledge (ML, cryptography, video encoding). Provides APIs to stream-aligned teams.</p>`
        },
        {
            id: 'teams-q2',
            level: 'senior',
            title: 'How does Conway Law affect your architecture decisions?',
            answer: `<p><strong>Conway's Law:</strong> "Organizations design systems that mirror their communication structures."</p><p><strong>Practical implications:</strong></p><ul><li>If you want microservices, you need independent teams (one service per team)</li><li>A shared database often means a shared team boundary (monolith)</li><li>Cross-team APIs emerge at organizational boundaries</li></ul><p><strong>Inverse Conway Maneuver:</strong> Structure teams to match your desired architecture. Want loosely-coupled services? Create loosely-coupled teams first.</p>`,
            interviewTip: "Referencing Conway\u2019s Law shows you think about sociotechnical systems, not just code. Staff+ engineers always consider team structure when designing architecture."
        },
        {
            id: 'teams-q3',
            level: 'lead',
            title: 'You are forming a new team for a greenfield product. How would you structure it?',
            answer: `<p><strong>Stream-aligned team (Team Topologies):</strong></p><ul><li><strong>Size:</strong> 6-8 people (two-pizza rule)</li><li><strong>Composition:</strong> 3-4 developers (frontend + backend), 1 QA, 1 DevOps/platform engineer, with access to PO and UX designer</li><li><strong>Ownership:</strong> Full end-to-end (code, test, deploy, monitor)</li><li><strong>Autonomy:</strong> Can deploy independently, own their CI/CD, choose tech within guardrails</li></ul><p><strong>Key decisions:</strong></p><ul><li>Define clear boundaries (bounded context from DDD)</li><li>Minimize external dependencies (team can deliver independently)</li><li>Establish team API (how other teams interact with you)</li><li>Start with Scrum, consider Kanban once stable</li></ul>`
        },
        {
            id: 'teams-q4',
            level: 'mid',
            title: 'Explain RACI. Who should be Accountable for a production deployment?',
            answer: `<p><strong>RACI:</strong> Responsible (does work), Accountable (one person who answers for outcome), Consulted (input before), Informed (notified after).</p><p><strong>For production deployment:</strong></p><ul><li><strong>R:</strong> DevOps/SRE (executes the deployment)</li><li><strong>A:</strong> Tech Lead or Engineering Manager (accountable if something goes wrong)</li><li><strong>C:</strong> QA (sign-off on test results), Security (for sensitive changes)</li><li><strong>I:</strong> Product Owner, stakeholders, on-call team</li></ul><p><strong>Key rule:</strong> Exactly ONE person is Accountable. If nobody is, accountability is diffused and incidents get worse.</p>`
        },
        {
            id: 'teams-q5',
            level: 'senior',
            title: 'What is the difference between a Feature Team and a Component Team?',
            answer: `<p><strong>Feature Team:</strong> Owns a user-facing feature end-to-end (frontend, backend, database). Can deliver independently. Aligned to business capability.</p><p><strong>Component Team:</strong> Owns a technical component (e.g., "database team", "API gateway team"). Other teams depend on them for changes.</p><p><strong>Trade-offs:</strong></p><ul><li>Feature teams: faster delivery, higher autonomy, but potential code duplication</li><li>Component teams: deeper expertise, consistency, but creates bottlenecks (every feature needs 3 team's tickets)</li></ul><p><strong>Modern consensus:</strong> Prefer feature/stream-aligned teams. Use component teams only for genuinely complicated subsystems (Team Topologies model).</p>`
        },
        {
            id: 'teams-q6',
            level: 'lead',
            title: 'How do you write effective OKRs for an engineering team?',
            answer: `<p><strong>Good OKR structure:</strong></p><ul><li><strong>Objective:</strong> Qualitative, inspiring, time-bound ("Achieve best-in-class API reliability this quarter")</li><li><strong>Key Results:</strong> Quantitative, measurable, specific (3-5 per objective)</li></ul><p><strong>Example:</strong></p><ul><li>O: Improve developer productivity</li><li>KR1: Reduce PR merge time from 4h to 1h (measured via GitHub metrics)</li><li>KR2: Achieve 95% CI pipeline success rate (currently 82%)</li><li>KR3: Zero production incidents caused by deployment (currently 2/month)</li></ul><p><strong>Anti-patterns:</strong> Output-based KRs ("ship 10 features"), unmeasurable ("improve quality"), sandbagged (100% achievable = not ambitious enough).</p>`
        }
    ]
});
