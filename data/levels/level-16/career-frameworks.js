/* ═══════════════════════════════════════════════════════════════════
   CAREER FRAMEWORKS — Level 16: Career & Interview Mastery
   Career ladders, IC vs management tracks, leveling, promotion,
   scope/impact/autonomy, and navigating engineering growth.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('career-frameworks', {

    title: 'Career Frameworks',
    level: 16,
    group: 'career-growth',
    description: 'Navigating engineering careers: career ladders, the IC vs management tracks, leveling, scope/impact/autonomy, how promotions work, and planning deliberate growth.',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    prerequisites: [],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Career frameworks</strong> (career ladders) define the levels, expectations, and growth
            paths in an engineering organization. Understanding them helps you see where you are, what's expected at
            the next level, and how to grow deliberately rather than hoping promotion "just happens."</p>
            <p>A common surprise: senior growth is less about coding harder and more about increasing your
            <strong>scope, impact, and autonomy</strong> — and there's usually a fork between the individual
            contributor (IC) and management tracks.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>What career ladders are and why they exist</li>
                <li>The IC track vs the management track</li>
                <li>Leveling and the scope/impact/autonomy progression</li>
                <li>How promotions actually work</li>
                <li>Planning deliberate growth</li>
                <li>Common career-navigation mistakes</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Career Ladder</h4>
            <p>A documented set of levels (e.g., E3/E4/E5... or SWE I/II/Senior/Staff/Principal) with expectations at
            each. It makes growth transparent and promotions fairer and more consistent.</p>
            <h4>Scope, Impact, Autonomy</h4>
            <p>The three dimensions that grow with seniority: <strong>scope</strong> (task -> feature -> system ->
            multiple systems -> org), <strong>impact</strong> (your work -> team -> org -> company), and
            <strong>autonomy</strong> (needs direction -> self-directed -> sets direction for others).</p>
            <h4>IC vs Management Track</h4>
            <p>At senior+ levels, careers usually fork: the <strong>IC track</strong> (senior -> staff -> principal -> distinguished)
            deepens technical leadership; the <strong>management track</strong> (EM -> senior manager -> director)
            leads through people. They're parallel and (often) equally valued — not "up = management."</p>
            <h4>Terminal vs Promotion Levels</h4>
            <p>"Senior" is often a <strong>terminal level</strong> — you can stay there indefinitely; beyond it
            (staff+) promotion requires demonstrated broader impact and is not expected of everyone.</p>
            <h4>Promotion = Already Operating at the Level</h4>
            <p>Promotions typically <em>recognize</em> that you're already consistently performing at the next level,
            rather than granting it in hope you'll grow into it.</p>`,
            mermaid: `flowchart TB
    Junior[Junior / SWE I-II<br/>scope: tasks, needs direction] --> Senior[Senior<br/>scope: systems, self-directed]
    Senior --> Fork{Track fork}
    Fork --> IC[IC: Staff → Principal<br/>technical leadership, org scope]
    Fork --> Mgmt[Manager → Director<br/>leads through people]
    style Senior fill:#bbf7d0,color:#1e293b`
        },
        {
            title: 'How It Works',
            content: `<p>Growing through the levels is about consistently expanding scope and impact:</p>
            <ol>
                <li><strong>Understand your ladder:</strong> read your company's level expectations; know what the
                next level requires.</li>
                <li><strong>Identify the gap:</strong> compare your current scope/impact/autonomy to the next level's
                expectations.</li>
                <li><strong>Seek work at the next level:</strong> take on bigger-scope projects, lead, mentor, and
                drive impact beyond your immediate tasks — operate at the next level before the title.</li>
                <li><strong>Build a track record &amp; visibility:</strong> deliver consistently and make your impact
                visible (docs, demos, your manager's awareness).</li>
                <li><strong>Get sponsorship:</strong> your manager (and often a committee) advocates for you with
                evidence. Promotion recognizes demonstrated performance.</li>
                <li><strong>Choose your track:</strong> at senior+, decide IC vs management based on what energizes
                you — not on which seems "higher."</li>
            </ol>`,
            code: `// What grows with level (the real promotion criteria):
//
// Level        Scope                Impact         Autonomy
// -----------------------------------------------------------------
// Junior       well-defined tasks   self           needs guidance
// Mid          features             team area      self-directed on tasks
// Senior       systems/projects     team           drives projects
// Staff        multiple systems     multiple teams  sets technical direction
// Principal    org-wide             org/company     shapes org strategy
//
// To get promoted: consistently OPERATE at the next level's scope/impact/
// autonomy FIRST; the title recognizes it. Find the work, then the title.`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>The dual-track ladder (IC and management are parallel, not "up = manager"):</p>`,
            mermaid: `flowchart LR
    E[Entry] --> M[Mid] --> S[Senior]
    S --> Staff[Staff Engineer]
    S --> EM[Engineering Manager]
    Staff --> Principal[Principal] --> Distinguished[Distinguished]
    EM --> SrEM[Sr Manager] --> Dir[Director] --> VP[VP Eng]
    Staff -.parallel/equivalent.-> EM
    Principal -.parallel.-> Dir
    style Staff fill:#dbeafe,color:#1e293b
    style EM fill:#fde68a,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Practical tools: a self-assessment, a growth plan, and the IC/management decision:</p>`,
            tabs: [
                {
                    label: 'Level Self-Assessment',
                    code: `// Assess yourself honestly against the NEXT level's expectations.
// For each dimension, where are you consistently operating?
//
// Scope:    Am I owning systems/projects, or just assigned tasks?
// Impact:   Does my work affect my team, multiple teams, or just me?
// Autonomy: Do I need direction, work independently, or set direction for others?
// Leadership: Do I mentor, drive design, influence beyond my code?
//
// Be honest about CONSISTENT performance, not one-off peaks. The gap to the
// next level is your growth plan. Ask your manager to calibrate your read.`,
                    language: 'csharp'
                },
                {
                    label: 'Growth Plan',
                    code: `// A simple, deliberate growth plan (review with your manager in 1:1s):
//
// Target level: <next level> by <rough timeframe>
// Gap (from self-assessment): e.g., "need broader cross-team impact + design leadership"
// Actions:
//   - Lead the upcoming <project> end-to-end (scope + autonomy)
//   - Mentor a junior; run a design review (leadership)
//   - Drive an initiative that helps another team (cross-team impact)
//   - Write up impact regularly so it's visible at review time
// Evidence to collect: shipped outcomes, scope owned, people grown
//
// Promotions recognize demonstrated performance - engineer the evidence.`,
                    language: 'csharp'
                },
                {
                    label: 'IC vs Management',
                    code: `// Choosing a track at senior+ - based on what ENERGIZES you, not "higher":
//
// Lean IC (Staff/Principal) if you love:
//   deep technical problems, architecture, hands-on building, being the
//   technical authority and force-multiplier across teams.
//
// Lean Management (EM) if you love:
//   growing people, building teams, coordinating, unblocking, and getting
//   impact through others (less hands-on coding over time).
//
// Both are senior leadership with comparable level/comp at good companies.
// You can also switch later (or do a "tour of duty" in management).
// Pick what you'd enjoy doing daily, not what looks more prestigious.`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Read and Use Your Career Ladder</h4>
            <p>Know your level's expectations and the next level's. Use them to self-assess and plan, and to align
            with your manager on what growth looks like.</p>
            <h4>Do: Grow Scope, Impact, and Autonomy</h4>
            <p>Beyond mid-level, advancement is about bigger scope and broader impact, not just better code. Seek work
            that stretches these dimensions.</p>
            <h4>Do: Operate at the Next Level First</h4>
            <p>Demonstrate you're already performing at the target level; promotion recognizes it. Find next-level
            work, don't wait for the title.</p>
            <h4>Do: Make Impact Visible</h4>
            <p>Deliver, then ensure your manager and the org see it (write-ups, demos, regular 1:1 updates). Quiet
            impact is hard to promote.</p>
            <h4>Do: Choose Your Track Deliberately</h4>
            <p>Pick IC vs management based on what you enjoy and are good at — both are valued senior paths.</p>
            <h4>Do: Get a Sponsor and Feedback</h4>
            <p>Your manager advocates for you; ask explicitly what's needed for the next level and get regular
            calibrating feedback.</p>`,
            callout: {
                type: 'tip',
                title: 'Promotion Recognizes, It Doesn\u2019t Grant',
                text: 'At most companies you get promoted by already consistently operating at the next level \u2014 the title recognizes demonstrated performance, it isn\u2019t given in hope you\u2019ll grow into it. So the strategy is: find and do next-level work first, make it visible, then the promotion follows. "Act at the level you want."'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Assuming "Up" Means Management</h4>
            <p>Believing you must become a manager to advance. The IC track (staff/principal) is a parallel,
            equally-senior path. Choose by fit, not by perceived prestige.</p>
            <h4>Mistake: Waiting to Be Promoted</h4>
            <p>Doing your current-level job well and waiting for a promotion to "come." You generally must operate at
            the next level first and make it visible.</p>
            <h4>Mistake: Only Improving Coding Skill</h4>
            <p>Beyond senior, more/better code alone doesn't advance you — broader scope, impact, leadership, and
            influence do. Pure coding has a ceiling for advancement.</p>
            <h4>Mistake: Going into Management for the Wrong Reasons</h4>
            <p>Becoming a manager for status/pay when you'd rather build, then being unhappy and ineffective.
            Management is a different job, not a promotion from engineering.</p>
            <h4>Mistake: Invisible Work</h4>
            <p>Doing high-impact work nobody knows about. If your impact isn't visible at review time, it can't be
            recognized. Communicate it.</p>
            <h4>Mistake: No Plan or Feedback</h4>
            <p>Drifting without knowing the next-level expectations or getting calibrating feedback. Ask your manager
            explicitly.</p>`,
            code: `// Anti-pattern: "I'm a great coder and I've been senior for 3 years, why
//  am I not Staff?"
// -> Staff is about ORG-LEVEL impact, technical leadership, and influence
//    across teams - not coding harder. The gap is usually scope/impact/
//    leadership, not technical skill.
//
// Better: ask your manager "what specific evidence of Staff-level impact do
//  you need to see from me?" -> then go create that evidence deliberately.`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Public Career Ladders</h4>
            <p>Many companies publish their engineering ladders (e.g., progression.fyi aggregates them), helping
            engineers understand expectations and benchmark across the industry.</p>
            <h4>Dual-Track Adoption</h4>
            <p>Most mature tech companies maintain parallel IC and management tracks with comparable levels/comp, so
            strong engineers aren't forced into management to advance.</p>
            <h4>Leveling in Hiring</h4>
            <p>The same scope/impact/autonomy framework determines what level you're hired at — and interview
            performance (especially system design and behavioral) maps to it.</p>
            <h4>Performance Reviews &amp; Promotion Packets</h4>
            <p>Promotions are typically argued in a packet of evidence (impact, scope, peer feedback) reviewed by a
            committee — which is why making impact visible and tracking it matters.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>IC track vs management track at senior+ levels:</p>`,
            table: {
                headers: ['Dimension', 'IC Track (Staff/Principal)', 'Management Track (EM/Director)'],
                rows: [
                    ['Primary work', 'Technical leadership, architecture', 'Leading and growing people'],
                    ['Impact through', 'Technical decisions + force-multiplying', 'The team/teams you lead'],
                    ['Hands-on coding', 'Significant (decreases at principal+)', 'Minimal/none over time'],
                    ['Core skills', 'Deep tech, influence, design', 'People, coordination, hiring, strategy'],
                    ['Day-to-day', 'Design, build, mentor, align tech', 'Meetings, 1:1s, planning, unblocking'],
                    ['Level/comp', 'Comparable to mgmt track', 'Comparable to IC track'],
                    ['Reversible?', 'Yes (can switch tracks)', 'Yes (can return to IC)']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Think of career growth as compounding investments, not a race:</p>
            <h4>Scope/Impact Compound</h4>
            <p>Each level of broader scope and impact builds the track record and skills for the next. Deliberately
            taking stretch work compounds your growth over years.</p>
            <h4>Visibility Multiplies Recognition</h4>
            <p>The same work, made visible (write-ups, demos, sponsorship), is far more likely to be recognized and
            rewarded than quiet work. Communication is a career multiplier.</p>
            <h4>Avoid Over-Optimizing for Titles</h4>
            <p>Chasing title/level over learning, fit, and enjoyment leads to burnout and wrong-track moves. Optimize
            for growth and work you value; titles tend to follow.</p>
            <h4>Terminal Levels Are OK</h4>
            <p>"Senior" is a respected terminal level; not everyone needs to reach staff+. Sustainable, fulfilling
            work at a level you enjoy is a valid, healthy goal.</p>`,
            callout: {
                type: 'info',
                title: 'Sponsorship Beats Just Hard Work',
                text: 'Hard work is necessary but not sufficient. Promotions usually require a sponsor (your manager, plus peers/committee) who advocates for you with evidence. That means building relationships, making your impact visible, and explicitly asking your manager what next-level evidence they need \u2014 not silently grinding and hoping it\u2019s noticed.'
            }
        },
        {
            title: 'Testing',
            content: `<p>"Test" your growth by calibrating honestly and seeking feedback.</p>
            <h4>Calibrate Against the Ladder</h4>
            <p>Regularly self-assess against the next level's written expectations, and ask your manager to calibrate
            your read — your self-perception and the official bar can differ.</p>
            <h4>Seek Specific Feedback</h4>
            <p>Ask "what specific evidence of next-level impact do you need from me?" rather than vague "how am I
            doing?" Specific answers become your plan.</p>
            <h4>Track Your Impact</h4>
            <p>Keep a running "brag doc" of your impact, scope owned, and people grown — invaluable for reviews,
            promotion packets, and honest self-assessment.</p>`,
            code: `// Keep a "brag doc" (impact journal) - update it monthly, not at review time:
// - Shipped: <project>, impact: <metric/outcome>
// - Scope owned: <system/area>; led: <initiative>
// - People: mentored <X>, ran <design review/onboarding>
// - Cross-team: helped <team> with <thing>
//
// This is your evidence for promotion packets AND your honest gauge of
// whether you're operating at the next level yet.`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Career frameworks come up when negotiating level and in growth-focused conversations:</p>
            <ul>
                <li><strong>Know how leveling maps to scope/impact/autonomy</strong> when discussing your target level</li>
                <li><strong>In interviews, demonstrate next-level signals</strong> (scope, leadership, trade-offs) to
                be leveled higher</li>
                <li><strong>Ask about the company's ladder and IC track</strong> — shows career awareness and helps
                you assess fit</li>
                <li><strong>Be honest about IC vs management interest</strong> when asked about goals</li>
                <li><strong>Use behavioral stories that show scope/impact</strong> matching your target level</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Level Is Negotiable \u2014 with Evidence',
                text: 'When changing jobs, the level you\u2019re hired at is often where you "reset" \u2014 and it\u2019s negotiable based on evidence of your scope and impact. Understand the target company\u2019s ladder, and present your experience in terms of scope/impact/autonomy to be leveled (and compensated) appropriately.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Books</h4>
            <ul>
                <li><em>The Staff Engineer's Path</em> by Tanya Reilly (IC track)</li>
                <li><em>Staff Engineer</em> by Will Larson</li>
                <li><em>The Manager's Path</em> by Camille Fournier (management track)</li>
            </ul>
            <h4>Online</h4>
            <ul>
                <li>progression.fyi / levels.fyi — public career ladders and leveling</li>
                <li>StaffEng.com — stories and the staff-engineer archetypes</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Career ladders</strong> define levels and expectations; read and use yours to plan growth</li>
                <li><strong>Growth = expanding scope, impact, and autonomy</strong> — not just better code</li>
                <li><strong>IC and management are parallel tracks;</strong> choose by fit, not perceived prestige</li>
                <li><strong>Promotion recognizes demonstrated performance</strong> — operate at the next level first</li>
                <li><strong>Make impact visible</strong> and get a sponsor; hard work alone isn't enough</li>
                <li><strong>"Senior" is a valid terminal level;</strong> not everyone needs staff+</li>
                <li><strong>Optimize for growth/fit/enjoyment;</strong> titles tend to follow</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Build Your Career Growth Plan</h4>
            <ol>
                <li>Find your company's career ladder (or use a public one like progression.fyi)</li>
                <li>Self-assess honestly against your current and next level on scope/impact/autonomy/leadership</li>
                <li>Identify the specific gap to the next level</li>
                <li>Write a growth plan: concrete next-level work, leadership, and cross-team impact to pursue</li>
                <li>Reflect on the IC vs management fork — which energizes you and why?</li>
                <li>Draft questions to ask your manager: "what specific evidence of next-level impact do you need?"</li>
            </ol>`,
            code: `// Deliverables:
// 1. Current level + next level expectations (from the ladder)
// 2. Honest self-assessment (scope/impact/autonomy/leadership)
// 3. The gap, named specifically
// 4. Growth plan: stretch project, mentoring, cross-team initiative, visibility
// 5. IC vs management reflection
// 6. Specific questions for your manager + start a brag doc`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What three dimensions grow with seniority?<br/>
                    <em>A: Scope (tasks -> systems -> org), impact (self -> team -> org/company), and autonomy (needs
                    direction -> self-directed -> sets direction for others). Advancement is about expanding these, not
                    just coding skill.</em></li>
                <li><strong>Q:</strong> Is becoming a manager the only way to advance past senior?<br/>
                    <em>A: No. The IC track (staff -> principal -> distinguished) is a parallel, equally-senior path that
                    deepens technical leadership. You choose IC vs management by fit and what energizes you, not by
                    prestige.</em></li>
                <li><strong>Q:</strong> How do promotions typically work?<br/>
                    <em>A: They recognize that you're already consistently operating at the next level, supported by
                    evidence and a sponsor (manager/committee). You generally need to do next-level work and make it
                    visible first \u2014 the title follows.</em></li>
                <li><strong>Q:</strong> Why is making your impact visible important?<br/>
                    <em>A: Promotions are argued with evidence; quiet, invisible work can't be recognized or rewarded.
                    Communicating impact (write-ups, demos, a brag doc) and having a sponsor advocate for you is essential,
                    not just hard work.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'What is the difference between the IC track and the management track, and how do you choose?',
            difficulty: 'easy',
            answer: `<p>Past the senior level, engineering careers usually fork into two parallel tracks. The
            <strong>IC (Individual Contributor) track</strong> — senior -> staff -> principal -> distinguished —
            deepens technical leadership: architecture, hard problems, and influencing many teams technically, while
            staying hands-on (less so at the top). The <strong>management track</strong> — EM -> senior manager ->
            director -> VP — leads through people: growing the team, hiring, coordination, and strategy, with little
            hands-on coding over time.</p>
            <p>At good companies they have <strong>comparable levels and compensation</strong>, so neither is "higher."
            Choose based on what you genuinely enjoy doing day-to-day — deep technical work vs developing people — not
            on perceived prestige. The choice is also usually reversible.</p>`,
            explanation: 'It is two summits of equal height with different paths: one is a technical mountain (IC), the other a people-leadership mountain (management). Both are senior; you pick the climb you\u2019ll actually enjoy.',
            bestPractices: ['Choose by daily-work fit, not prestige', 'Know both are senior, comparable paths', 'Remember it\u2019s usually reversible'],
            commonMistakes: ['Assuming management is the only way up', 'Going into management for status/pay despite preferring to build'],
            interviewTip: 'Emphasize that the tracks are parallel and equally valued, and that the choice should be about what energizes you. That framing shows career maturity.',
            followUp: ['Can you switch tracks later?', 'What does a staff engineer actually do?']
        },
        {
            question: 'How do promotions actually work, and how do you position yourself for one?',
            difficulty: 'medium',
            answer: `<p>At most companies, a promotion <strong>recognizes that you're already consistently operating at
            the next level</strong> — it isn't granted in hope you'll grow into it. So the path is to demonstrate
            next-level performance first.</p>
            <p>To position yourself:</p>
            <ul>
                <li><strong>Know the bar:</strong> read the next level's expectations (scope/impact/autonomy/
                leadership) and ask your manager exactly what evidence they need.</li>
                <li><strong>Seek next-level work:</strong> take on bigger scope, lead, mentor, and drive cross-team
                impact — operate at the level before the title.</li>
                <li><strong>Make impact visible:</strong> write it up, demo it, keep a brag doc; promotions are argued
                with evidence to a committee.</li>
                <li><strong>Get a sponsor:</strong> your manager (and peers) advocate for you. Build that relationship
                and keep them informed.</li>
            </ul>`,
            explanation: 'Getting promoted is like getting cast in a bigger role after consistently performing it in rehearsals \u2014 the director casts what they\u2019ve already seen you do well, not a hope. So you perform at the next level first, where people can see it.',
            bestPractices: ['Operate at the next level before the title', 'Ask your manager for specific next-level evidence needed', 'Make impact visible (brag doc, write-ups)', 'Cultivate a sponsor'],
            commonMistakes: ['Doing current-level work and waiting', 'Invisible high-impact work', 'Not knowing the next-level bar', 'No sponsor/advocate'],
            interviewTip: 'The key insight to state: "promotion recognizes demonstrated performance, so I find and do next-level work and make it visible." That shows you understand how advancement actually works.',
            followUp: ['How do you make impact visible without bragging?', 'What if you\u2019re operating at the next level but not promoted?']
        },
        {
            question: 'You\u2019ve been a strong senior engineer for years but haven\u2019t reached staff. What\u2019s likely missing and how would you address it?',
            difficulty: 'hard',
            answer: `<p>The most common reason isn't technical skill — it's that staff+ requires a <strong>different
            kind of impact</strong> that senior engineers often don't naturally expand into:</p>
            <ul>
                <li><strong>Scope &amp; impact beyond your team:</strong> staff engineers drive outcomes across
                multiple teams or the org, not just deliver excellent work on their own team. The gap is usually
                org-level impact, not coding.</li>
                <li><strong>Technical leadership &amp; influence:</strong> setting technical direction, aligning
                teams, making decisions that multiply others' effectiveness — often without authority.</li>
                <li><strong>Visibility &amp; sponsorship:</strong> the impact must be seen and advocated for; quiet
                excellence stalls.</li>
            </ul>
            <p>How I'd address it: (1) ask my manager for the <strong>specific</strong> evidence of staff-level impact
            they need; (2) deliberately seek a high-impact, cross-team problem to lead end-to-end; (3) practice
            influence — drive a design across teams, write an influential RFC, mentor broadly; (4) make the impact
            visible and secure a sponsor; (5) honestly assess whether I <em>want</em> staff-level work (more
            leadership/influence, sometimes less hands-on) — senior is a respected terminal level, and staying there
            is a valid choice.</p>`,
            explanation: 'It is like a star player wondering why they aren\u2019t captain: the answer usually isn\u2019t "score more goals" but "lift the whole team \u2014 set strategy, make others better, lead beyond your own position." Staff is a change in the KIND of impact, not just more of the same.',
            bestPractices: ['Recognize staff is org-level impact + technical leadership, not more coding', 'Get specific evidence requirements from your manager', 'Lead a cross-team, high-impact initiative', 'Build influence and visibility; secure a sponsor', 'Honestly decide if you want staff-level work'],
            commonMistakes: ['Assuming the gap is technical skill', 'Waiting to be recognized for quiet team-level work', 'Not seeking cross-team scope', 'No sponsor or visibility'],
            interviewTip: 'Diagnose it as a scope/impact/leadership gap (not technical), and show a concrete plan to expand cross-team impact and visibility. Acknowledging that staying senior is a legitimate choice signals maturity.',
            followUp: ['How do you find a cross-team problem to lead?', 'How do you build influence without authority?', 'When is staying at senior the right call?'],
            seniorPerspective: 'I have mentored many excellent senior engineers stuck at this exact plateau, and it is almost never a coding gap \u2014 it is that staff is a qualitatively different job centered on org-level impact and influence. The reframe that unlocks it: stop asking "how do I code at a higher level?" and start asking "what problem affecting multiple teams can I own and solve, and how do I get others aligned behind it?" I also make sure they hear that this is a genuine choice, not a mandate \u2014 senior is a fulfilling terminal level, and pushing to staff only makes sense if the leadership-and-influence work actually appeals to them, because that\u2019s what the day-to-day becomes.'
        }
    ,
        {
            question: 'What distinguishes the IC (individual contributor) track from the management track at senior levels?',
            difficulty: 'medium',
            answer: `<p>Both tracks grow in <strong>scope and impact</strong>, but through different means. They are parallel ladders, not a demotion/promotion relationship.</p>
            <ul>
                <li><strong>Senior IC (staff/principal)</strong> \u2014 impact through technical leadership: architecture, hard problems, setting technical direction, multiplying other engineers via design and mentorship.</li>
                <li><strong>Manager</strong> \u2014 impact through people and execution: hiring, growth, prioritization, team health, delivery.</li>
                <li><strong>Both</strong> require influence, communication, and judgment; the difference is whether your primary lever is technical or organizational.</li>
            </ul>
            <p>The choice should follow energy: what work you want to do daily, not which has higher status.</p>`,
            explanation: 'It is two different ladders against the same wall: one climbs through deep technical leverage, the other through leading people. Both reach the same heights of impact \u2014 they just use different rungs.',
            bestPractices: ['Choose based on the work you enjoy daily, not perceived status', 'Recognize both tracks demand influence and communication', 'For staff IC, focus on cross-team technical impact and multiplying others', 'For management, focus on people growth, prioritization, and delivery'],
            commonMistakes: ['Going into management only for the perceived promotion/status', 'Assuming staff IC means "just code harder" (it is leadership)', 'Believing the tracks never require the other\u2019s skills', 'Thinking the switch is irreversible'],
            interviewTip: 'Frame them as parallel ladders differing in primary lever (technical vs organizational), both scaling scope/impact. Saying the choice should follow the work you want to do signals self-awareness.',
            followUp: ['What does a staff engineer do that a senior does not?', 'Can you switch tracks later?', 'How does scope grow on the IC ladder?'],
            seniorPerspective: 'I advise people to pick the track whose daily work energizes them \u2014 a reluctant manager who misses building, or a staff IC who actually wanted to lead people, both burn out. Status is a bad reason; both ladders reach high impact.',
            architectPerspective: 'Healthy orgs make the ladders truly parallel so deep technical leadership is valued equally with management. The staff+ IC exists precisely so architectural impact does not require abandoning hands-on technical work for people management.'
        },
        {
            question: 'What does scope, impact, and autonomy mean for leveling, and how do you grow them?',
            difficulty: 'advanced',
            answer: `<p>Promotion is recognizing you already operate at the next level on three axes:</p>
            <ul>
                <li><strong>Scope</strong> \u2014 the breadth of what you affect: a task \u2192 a feature \u2192 a system \u2192 multiple teams \u2192 the org.</li>
                <li><strong>Impact</strong> \u2014 the magnitude/durability of outcomes: a bug fix vs an architecture that unblocks the roadmap for a year.</li>
                <li><strong>Autonomy</strong> \u2014 how much ambiguity you handle alone: needing well-defined tickets vs taking a vague goal and driving it.</li>
            </ul>
            <p>You grow them by deliberately taking on larger, more ambiguous problems <em>before</em> the title, making your impact visible, and seeking feedback against the next level\u2019s expectations.</p>`,
            explanation: 'Leveling is like getting a black belt: you earn it by already performing at that level in practice, then the belt formalizes it. You demonstrate the scope first; the promotion follows.',
            bestPractices: ['Operate at the next level before expecting the title', 'Take on ambiguous, higher-scope problems deliberately', 'Make impact visible and tie it to business outcomes', 'Get explicit feedback against the next level\u2019s rubric'],
            commonMistakes: ['Expecting promotion for tenure or output volume alone', 'Doing great work invisibly with no scope growth', 'Waiting to be handed bigger scope instead of seeking it', 'Not knowing the leveling rubric you\u2019re being measured against'],
            interviewTip: 'Use the scope/impact/autonomy vocabulary explicitly \u2014 it is exactly how leveling rubrics are written. Stress that you demonstrate the level first, then it is recognized.',
            followUp: ['How do you make your impact visible without bragging?', 'How do you find higher-scope work?', 'Why might strong work still not get promoted?'],
            seniorPerspective: 'I coach engineers to start acting at the next level now \u2014 take the ambiguous, cross-team problem nobody owns. Promotions follow demonstrated scope; waiting for the title before showing the behavior is backwards.',
            architectPerspective: 'These axes scale cleanly into staff/principal: scope spans org-wide systems, impact is measured in years and teams unblocked, and autonomy means turning fuzzy business problems into technical direction. The rubric is the same language all the way up.'
        },
        {
            question: 'How do you build a case for your own promotion?',
            difficulty: 'medium',
            answer: `<p>Treat it like a evidence-based proposal, prepared over time, not a one-off ask.</p>
            <ul>
                <li><strong>Know the rubric</strong> \u2014 get the explicit expectations for the target level from your manager.</li>
                <li><strong>Collect evidence</strong> \u2014 a brag doc of projects, impact (quantified), scope, and peer recognition mapped to those expectations.</li>
                <li><strong>Operate at the level first</strong> \u2014 demonstrate next-level behavior consistently before asking.</li>
                <li><strong>Make your manager an ally</strong> \u2014 they advocate for you in calibration; align early and ask what gaps remain.</li>
                <li><strong>Get peer support</strong> \u2014 promotions are often peer-reviewed; visible cross-team impact matters.</li>
            </ul>`,
            explanation: 'A promotion case is like a pull request for your career: you gather the evidence, map it to the acceptance criteria (the rubric), and line up reviewers (your manager and peers) before submitting.',
            bestPractices: ['Get the target-level rubric and map your work to it', 'Keep an ongoing brag doc with quantified impact', 'Demonstrate next-level scope consistently before asking', 'Align with your manager early and recruit peer support'],
            commonMistakes: ['Assuming good work is automatically noticed and rewarded', 'Asking with no evidence mapped to the leveling criteria', 'Not knowing the actual expectations for the next level', 'Neglecting the manager relationship and calibration process'],
            interviewTip: 'Stress the brag doc + rubric mapping + manager alignment. The mature point: you build the case continuously and demonstrate the level before asking, rather than making a surprise plea.',
            followUp: ['What goes in a brag doc?', 'How do you handle a "not yet" decision?', 'How do calibration committees work?'],
            seniorPerspective: 'I keep a running brag doc so promotion season is assembling evidence, not reconstructing a year from memory. The conversation with my manager is continuous \u2014 "what would it take?" \u2014 so the actual promotion is a formality, not a surprise.',
            architectPerspective: 'Promotion processes reward demonstrated, visible scope. The architectural-career lesson is to choose high-leverage work that is both impactful and legible to the org, because invisible impact rarely gets recognized no matter how real it is.'
        },
        {
            question: 'How do you demonstrate staff-level impact in a growth document when your work is mostly collaborative/enabling?',
            difficulty: 'hard',
            answer: `<p>Enabling work is <strong>the hallmark of staff-level impact</strong>, not a disadvantage. The challenge is making it visible and quantifiable when the deliverables have other people\u2019s names on them.</p>
            <ul>
                <li><strong>Trace your contribution to outcomes</strong> — "I designed the API contract and migration strategy that enabled 3 teams to ship independently" links your enabling work to measurable delivery.</li>
                <li><strong>Quantify the multiplier</strong> — how many teams, engineers, or features did your work unblock? "My shared library reduced onboarding time for new services from 3 weeks to 3 days."</li>
                <li><strong>Capture the counterfactual</strong> — what would not have happened without you? "Without the architectural direction I set, these teams would have built 4 incompatible solutions."</li>
                <li><strong>Document before/after states</strong> — "Before: each team built auth independently, averaging 2 weeks. After my shared auth module: 2 hours to integrate."</li>
                <li><strong>Collect testimonials</strong> — ask teams you unblocked to describe the impact in their words. Peer quotes in your growth doc carry weight in calibration.</li>
                <li><strong>Show the artifacts</strong> — RFCs you authored, ADRs you drove, design docs that set direction, review comments that caught critical issues. These are tangible evidence of enabling leadership.</li>
            </ul>`,
            explanation: 'Enabling work is like being an offensive lineman in football: you don\u2019t score touchdowns, but the quarterback gets sacked without you. Your growth doc must show the sacks prevented and the yards gained — not wait for someone to notice you blocking.',
            bestPractices: ['Trace enabling contributions to measurable team outcomes', 'Quantify the multiplier: teams unblocked, time saved, incidents prevented', 'Use before/after comparisons to make impact tangible', 'Collect peer quotes and testimonials from teams you enabled', 'Document artifacts: RFCs, ADRs, design docs, critical review comments'],
            commonMistakes: ['Listing activities ("wrote an RFC") without connecting to outcomes', 'Letting collaborative work be invisible because others delivered the final product', 'Not tracking impact in real-time and trying to reconstruct it at review time', 'Describing the work without quantifying the multiplier effect', 'Assuming enabling work is obviously valued without making it legible'],
            interviewTip: 'Use the "multiplier" framing: how many teams, engineers, or features did your work enable? And capture the counterfactual — what would have gone wrong without your intervention. This is exactly how calibration committees evaluate staff impact.',
            followUp: ['How do you avoid taking credit for others\u2019 work while demonstrating your contribution?', 'How does enabling impact differ from management impact?', 'How do you track enabling impact in real-time?'],
            seniorPerspective: 'I keep a running log every time someone says "thanks, that unblocked us" or "your RFC saved us from building the wrong thing." Those moments are my evidence, and I record them immediately — they are invisible in sprint boards but central to staff-level growth docs.',
            architectPerspective: 'The most impactful architectural work is inherently enabling: setting direction, creating shared abstractions, and preventing bad decisions. Making it legible requires connecting artifacts (RFCs, ADRs, architecture reviews) to measurable org-wide outcomes. The growth doc is really a narrative of systemic impact.'
        },
        {
            question: 'What is the difference between senior and staff engineer expectations in practice?',
            difficulty: 'hard',
            answer: `<p>The shift from senior to staff is primarily about <strong>scope, ambiguity tolerance, and organizational impact</strong> — not just harder technical problems.</p>
            <ul>
                <li><strong>Scope: team → multi-team/org</strong> — seniors own features and systems within their team. Staff engineers own technical direction across teams, set standards, and solve problems that span organizational boundaries.</li>
                <li><strong>Ambiguity: defined → undefined</strong> — seniors execute well-scoped work. Staff engineers take vague, undefined problems ("our reliability is bad") and turn them into actionable technical strategies.</li>
                <li><strong>Impact: direct → multiplied</strong> — seniors create impact through their own output. Staff engineers multiply others: mentoring, setting direction, creating abstractions that make everyone faster.</li>
                <li><strong>Communication: team → org</strong> — seniors communicate within their team. Staff engineers write RFCs, present to leadership, and align multiple teams around technical direction.</li>
                <li><strong>Autonomy: guided → self-directed</strong> — seniors have their priorities set by their manager. Staff engineers identify the most important problems themselves and drive them without being asked.</li>
                <li><strong>Judgment: technical → sociotechnical</strong> — seniors optimize for technical correctness. Staff engineers optimize for organizational delivery: what is the right solution that this org can actually build, deploy, and maintain?</li>
            </ul>`,
            explanation: 'A senior engineer is an excellent player who wins games. A staff engineer is a player-coach who wins championships — they still play at an elite level, but they also call the plays, develop other players, and ensure the team\u2019s strategy is sound for the whole season.',
            bestPractices: ['Demonstrate multi-team scope by taking on cross-cutting technical problems', 'Show ambiguity tolerance by turning vague problems into concrete strategies', 'Multiply others through mentoring, standards, and shared abstractions', 'Communicate at the organizational level through RFCs and leadership presentations', 'Self-direct: identify the most important problems without waiting to be assigned them'],
            commonMistakes: ['Thinking staff = "even harder individual technical work" (it is about scope and influence)', 'Waiting for the manager to assign staff-level work instead of self-identifying it', 'Only working within your team\u2019s boundaries (staff scope is cross-team by definition)', 'Not communicating widely enough — invisible staff work does not get recognized', 'Ignoring the organizational dimension (team capacity, migration paths, operational cost)'],
            interviewTip: 'Frame the difference across five axes: scope, ambiguity, impact mode, communication audience, and autonomy. Give a concrete example showing one of these shifts in your own work.',
            followUp: ['How do you find staff-level work on your current team?', 'Can you be staff-level without writing code?', 'How does staff differ from principal?'],
            seniorPerspective: 'The moment that made me staff-ready was when I stopped waiting for my manager to tell me the important problems and started identifying them myself. The shift from "give me a task" to "here is the biggest risk to our platform and my plan to address it" is the fundamental change.',
            architectPerspective: 'Staff is where engineering becomes sociotechnical: you cannot succeed by technical excellence alone. You must navigate org boundaries, influence without authority, and design solutions that account for team capacity, migration cost, and operational reality. The rubric shift is from "excellent engineer" to "organizational technical leader."'
        }
    ]
});
