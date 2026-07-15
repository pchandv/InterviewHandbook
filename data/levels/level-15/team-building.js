/* ═══════════════════════════════════════════════════════════════════
   TEAM BUILDING — Level 15: Leadership (Engineering Management)
   Hiring, onboarding, psychological safety, culture, 1:1s, growth,
   feedback, and building high-performing engineering teams.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('team-building', {

    title: 'Team Building',
    level: 15,
    group: 'leadership-advanced',
    description: 'Building high-performing engineering teams: hiring, onboarding, psychological safety, culture, effective 1:1s, growth/career development, and giving feedback.',
    difficulty: 'expert',
    estimatedMinutes: 35,
    prerequisites: ['leadership-core'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Team building</strong> is the work of assembling, growing, and sustaining a group of
            engineers who consistently deliver great results and want to keep doing so. Technology problems are
            usually solvable; the durable advantage is a healthy, high-performing team — and that is built
            deliberately, not by accident.</p>
            <p>For tech leads and managers, this is often the highest-leverage work: a great team outperforms a
            collection of great individuals.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>Hiring for the team you want to build</li>
                <li>Effective onboarding</li>
                <li>Psychological safety and team culture</li>
                <li>Running effective 1:1s</li>
                <li>Career growth and development</li>
                <li>Giving and receiving feedback</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Psychological Safety</h4>
            <p>The shared belief that it's safe to take risks, ask questions, admit mistakes, and disagree without
            fear of punishment or humiliation. Google's Project Aristotle found it the #1 predictor of team
            effectiveness.</p>
            <h4>Hiring for the Team</h4>
            <p>Hiring is the highest-leverage decision a manager makes. Hire for trajectory and complementary
            strengths, with structured, fair, bias-resistant processes — not just raw skill.</p>
            <h4>Onboarding</h4>
            <p>A deliberate ramp that gets a new hire productive and connected quickly: environment setup, a buddy, a
            first meaningful task, and clear 30/60/90-day expectations.</p>
            <h4>1:1s</h4>
            <p>Regular one-on-one meetings — the engineer's time, not a status update. For trust, growth, feedback,
            unblocking, and career conversations.</p>
            <h4>Growth &amp; Career Development</h4>
            <p>Helping each engineer grow toward their goals via stretch work, mentoring, and a clear understanding of
            the career ladder/expectations.</p>
            <h4>Feedback</h4>
            <p>Specific, timely, actionable input — both positive and constructive — delivered with care. The
            lifeblood of growth and a healthy team.</p>`,
            mermaid: `graph TB
    Safety[Psychological Safety<br/>foundation] --> Trust[Trust]
    Trust --> Feedback[Honest feedback flows]
    Trust --> Risk[Safe to take risks / admit mistakes]
    Feedback --> Growth[Individual growth]
    Risk --> Innovation[Innovation + learning]
    Growth --> Perf[High-performing team]
    Innovation --> Perf
    style Safety fill:#bbf7d0,color:#1e293b`
        },
        {
            title: 'How It Works',
            content: `<p>Building a high-performing team is a continuous cycle:</p>
            <ol>
                <li><strong>Hire well:</strong> structured, fair process selecting for trajectory and complementary
                strengths, and culture <em>add</em> (not just "fit").</li>
                <li><strong>Onboard deliberately:</strong> ramp new hires with a buddy, early wins, and clear
                expectations so they're productive and connected fast.</li>
                <li><strong>Establish safety &amp; culture:</strong> model vulnerability, welcome questions and
                dissent, and make it safe to fail and learn.</li>
                <li><strong>Develop people:</strong> regular 1:1s, feedback, stretch assignments, and clear growth
                paths.</li>
                <li><strong>Retain &amp; sustain:</strong> recognition, autonomy, mastery, purpose, and addressing
                issues early before they fester.</li>
            </ol>`,
            code: `// A 1:1 is the engineer's meeting, not a status report.
// Structure (flexible) - the manager listens more than talks:
//
// 1. Their agenda first: what's on their mind, blockers, frustrations
// 2. Growth: progress toward goals, skills they want to build
// 3. Feedback: both directions (give specific feedback; ask for it)
// 4. Career: periodically zoom out to longer-term aspirations
// 5. Manager asks: "How can I help?" / "What would make this better?"
//
// Cadence: weekly or biweekly, protected, rarely cancelled.
// Status updates belong in standups/tools - NOT in the 1:1.`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Maslow-style hierarchy of what engineers need to thrive (foundation up):</p>`,
            mermaid: `flowchart TB
    Purpose[Purpose: meaningful work, impact]
    Mastery[Mastery: growth, learning, challenge]
    Autonomy[Autonomy: trust, ownership]
    Belonging[Belonging: psychological safety, inclusion]
    Basics[Basics: fair pay, tools, clear expectations]
    Basics --> Belonging --> Autonomy --> Mastery --> Purpose
    style Basics fill:#e2e8f0,color:#1e293b
    style Purpose fill:#bbf7d0,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Practical structures: structured interviews, onboarding plan, and feedback (SBI):</p>`,
            tabs: [
                {
                    label: 'Structured Hiring',
                    code: `// Structured interviews reduce bias and improve signal vs gut-feel chats.
// - Define the role's competencies BEFORE interviewing
// - Each interviewer owns specific competencies (not overlapping vibes)
// - Same core questions + rubric across candidates -> comparable signal
// - Use a scorecard; debrief with evidence, not "I just liked them"
//
// Competency example (Senior Engineer):
//   Technical depth | System design | Code quality | Collaboration |
//   Communication | Ownership
// Hire for TRAJECTORY and complementary strengths + culture ADD
// (what they bring that the team lacks), not sameness.`,
                    language: 'csharp'
                },
                {
                    label: 'Onboarding Plan',
                    code: `// 30/60/90-day onboarding plan - ramp productivity AND belonging
//
// Week 1:  environment set up day 1; assign a BUDDY; meet the team;
//          ship a tiny real change (build confidence + validate setup)
// 30 days: own a small but real feature; understand the codebase + domain;
//          know who to ask for what
// 60 days: contributing independently; participating in reviews/design
// 90 days: fully ramped; owning meaningful work; giving back (docs, reviews)
//
// Clear expectations at each milestone reduce anxiety and accelerate ramp.
// A buddy (separate from manager) gives a safe person to ask "dumb" questions.`,
                    language: 'csharp'
                },
                {
                    label: 'Feedback (SBI)',
                    code: `// SBI model: Situation - Behavior - Impact (specific, not personal)
//
// Vague:   "You did great on that project." / "Your code is sloppy."
// SBI (positive): "In yesterday's incident (S), you calmly coordinated the
//   rollback and kept stakeholders updated (B), which got us recovered in
//   6 minutes and kept everyone calm (I)."
// SBI (constructive): "In the PR for the order service (S), the methods had
//   no tests and unclear names (B), which made review slow and risks
//   regressions (I). Let's pair on adding tests."
//
// Specific + timely + about behavior/impact (not character) = actionable
// and safe. Give far more positive than negative, but be honest.`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Build Psychological Safety First</h4>
            <p>Model fallibility (admit your own mistakes), welcome questions and dissent, and never punish honest
            errors. It is the foundation everything else rests on.</p>
            <h4>Do: Hire Deliberately and Fairly</h4>
            <p>Use structured interviews and rubrics; hire for trajectory and culture <em>add</em>. A bad hire costs
            the whole team; take the time to get it right.</p>
            <h4>Do: Invest in Onboarding</h4>
            <p>A buddy, early wins, and clear 30/60/90 expectations turn months of flailing into weeks of
            productivity and belonging.</p>
            <h4>Do: Protect and Use 1:1s Well</h4>
            <p>Hold them regularly, make them the engineer's agenda, listen more than you talk, and don't turn them
            into status updates.</p>
            <h4>Do: Give Specific, Timely Feedback</h4>
            <p>Use SBI; deliver constructive feedback privately and promptly, praise specifically (often publicly),
            and ask for feedback on yourself.</p>
            <h4>Do: Support Growth</h4>
            <p>Give stretch assignments, mentor, and make the career ladder/expectations explicit so people see a
            path.</p>`,
            callout: {
                type: 'tip',
                title: 'Psychological Safety Is the Foundation',
                text: 'Google\u2019s Project Aristotle studied what makes teams effective and found psychological safety \u2014 feeling safe to take risks and be vulnerable \u2014 was the single most important factor, above individual talent. Without it, people hide mistakes, avoid hard questions, and don\u2019t speak up; with it, teams learn and perform.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Hiring for "Culture Fit" (Sameness)</h4>
            <p>"Fit" often becomes hiring people like the existing team, reducing diversity of thought. Hire for
            culture <em>add</em> — what new strengths/perspectives they bring.</p>
            <h4>Mistake: No or Cancelled 1:1s</h4>
            <p>Skipping 1:1s ("we talk all day anyway") removes the dedicated space for trust, growth, and surfacing
            problems early. Issues then fester until someone quits.</p>
            <h4>Mistake: Status-Update 1:1s</h4>
            <p>Turning the engineer's growth/trust meeting into a project status check wastes its real value. Status
            belongs elsewhere.</p>
            <h4>Mistake: Withholding or Sugarcoating Feedback</h4>
            <p>Avoiding constructive feedback to be "nice" denies people the chance to grow and lets small issues
            become big ones. Be kind <em>and</em> honest.</p>
            <h4>Mistake: Blame Culture</h4>
            <p>Punishing mistakes destroys psychological safety; people hide problems and stop taking risks. Treat
            failures as learning (blameless).</p>
            <h4>Mistake: Ignoring Growth</h4>
            <p>Engineers who see no growth path disengage and leave. Invest in development before retention becomes a
            crisis.</p>`,
            code: `// Anti-pattern: the cancelled 1:1
// "Let's skip our 1:1, we're heads-down and talk all the time anyway."
// -> Repeated, this signals the person isn't a priority, removes the safe
//    space to raise concerns, and means you learn they're unhappy only at
//    their resignation. Protect 1:1s; reschedule rather than cancel.
//
// Anti-pattern: "culture fit"
// "They wouldn't fit our culture" (often = "not like us")
// -> Prefer "culture ADD": what perspective/strength do they bring that we lack?`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Google Project Aristotle</h4>
            <p>Google's large study of team effectiveness identified psychological safety as the top factor —
            shaping how many companies now think about team health over raw talent.</p>
            <h4>Spotify Squads / Team Topologies</h4>
            <p>Organizing into small, autonomous, cross-functional teams with clear ownership (and managing cognitive
            load per Team Topologies) is a deliberate team-building strategy at scale.</p>
            <h4>Structured Hiring at Scale</h4>
            <p>Companies use structured interviews, rubrics, and hiring committees to reduce bias and improve hiring
            quality and fairness across many interviewers.</p>
            <h4>Career Ladders</h4>
            <p>Published engineering career ladders (e.g., from companies like Rent the Runway/CircleCI examples
            shared publicly) make growth expectations explicit and promotions fairer.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>High-performing vs struggling team dynamics:</p>`,
            table: {
                headers: ['Aspect', 'Struggling Team', 'High-Performing Team'],
                rows: [
                    ['Mistakes', 'Hidden, blamed', 'Surfaced, learned from'],
                    ['Questions', 'Seen as weakness', 'Welcomed'],
                    ['Disagreement', 'Suppressed', 'Healthy, respectful'],
                    ['Feedback', 'Rare or harsh', 'Frequent, specific, kind'],
                    ['1:1s', 'Skipped / status only', 'Protected, growth-focused'],
                    ['Hiring', 'Gut feel, "fit"', 'Structured, culture add'],
                    ['Ownership', 'Diffuse', 'Clear and felt'],
                    ['Growth', 'Stagnant', 'Visible paths + stretch']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Team health is measurable and directly drives delivery performance:</p>
            <h4>Team Health Signals</h4>
            <p>Track engagement/eNPS, retention/attrition, and qualitative 1:1 themes. Declining engagement or rising
            regrettable attrition are leading indicators of trouble.</p>
            <h4>Delivery Outcomes</h4>
            <p>Healthy teams ship more reliably; DORA metrics and predictable delivery reflect team health, not just
            tooling. A burned-out or fearful team's metrics degrade.</p>
            <h4>The Cost of a Bad Hire / Regretted Attrition</h4>
            <p>A bad hire or losing a strong engineer is enormously expensive (hiring cost, lost productivity, morale,
            knowledge). Investing in hiring quality and retention has high ROI.</p>
            <h4>Onboarding Ramp Time</h4>
            <p>Time-to-first-meaningful-contribution and time-to-full-productivity measure onboarding effectiveness —
            good onboarding compresses these dramatically.</p>`,
            callout: {
                type: 'info',
                title: 'People Problems Are the Hard Problems',
                text: 'Most technical problems have known solutions; the durable challenges in engineering leadership are people and team dynamics. A healthy, safe, growing team will out-deliver a more individually-talented but dysfunctional one over any meaningful time horizon. Invest accordingly.'
            }
        },
        {
            title: 'Testing',
            content: `<p>You "test" team health by actively gathering signal, not assuming things are fine.</p>
            <h4>Surveys &amp; eNPS</h4>
            <p>Regular, (often anonymous) engagement surveys surface issues people won't raise directly. Track trends,
            and crucially, act on the results visibly.</p>
            <h4>Retrospectives</h4>
            <p>Regular team retros test how the team is working and create a safe forum to improve process and raise
            concerns — a recurring health check.</p>
            <h4>Skip-Levels &amp; 1:1 Themes</h4>
            <p>Skip-level conversations and patterns across 1:1s reveal systemic issues (a frustrating process, a
            difficult dynamic) before they cause attrition.</p>`,
            code: `// Lightweight team-health pulse (run periodically, act on it)
// Rate 1-5 + comment, anonymous:
//   - I feel safe to take risks and admit mistakes on this team
//   - I understand what's expected of me and how I'm doing
//   - I'm growing and learning here
//   - I get useful feedback
//   - My work feels meaningful
//
// Falling scores on safety/growth are EARLY warnings. The survey is
// worthless unless you visibly act on what it reveals.`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Team building comes up in EM/lead behavioral and leadership interviews:</p>
            <ul>
                <li><strong>Know psychological safety</strong> (Project Aristotle) as the foundation</li>
                <li><strong>Have real stories</strong> (STAR) of hiring, growing, or turning around a team member</li>
                <li><strong>Describe how you run 1:1s and give feedback</strong> (SBI)</li>
                <li><strong>Discuss culture add vs fit</strong> and structured, fair hiring</li>
                <li><strong>Show you treat people problems as first-class engineering work</strong></li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Behavioral Story Tip',
                text: 'For leadership rounds, prepare STAR stories about: helping an underperformer improve, resolving a team conflict, growing someone into a bigger role, and a hiring decision. Emphasize psychological safety, specific feedback, and the outcome \u2014 concrete people-leadership beats abstract philosophy.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Books</h4>
            <ul>
                <li><em>The Manager's Path</em> by Camille Fournier</li>
                <li><em>An Elegant Puzzle</em> by Will Larson</li>
                <li><em>The Fearless Organization</em> by Amy Edmondson (psychological safety)</li>
                <li><em>Team Topologies</em> by Skelton &amp; Pais</li>
                <li><em>Radical Candor</em> by Kim Scott (feedback)</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Psychological safety is the #1 driver</strong> of team effectiveness (Project Aristotle)</li>
                <li><strong>Hire deliberately and fairly</strong> (structured + rubric) for trajectory and culture ADD</li>
                <li><strong>Onboard intentionally:</strong> buddy, early wins, clear 30/60/90 expectations</li>
                <li><strong>1:1s are the engineer's meeting</strong> — growth and trust, not status updates; protect them</li>
                <li><strong>Give specific, timely feedback</strong> (SBI); be kind and honest</li>
                <li><strong>Invest in growth</strong> with stretch work, mentoring, and clear ladders</li>
                <li><strong>People problems are the hard, high-leverage problems</strong> — treat them as first-class work</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Design Your Team Operating System</h4>
            <ol>
                <li>Define a structured interview process for one role (competencies + rubric + who assesses what)</li>
                <li>Write a 30/60/90-day onboarding plan with a buddy and early wins</li>
                <li>Draft a 1:1 format that centers the engineer's agenda and growth</li>
                <li>Write two pieces of SBI feedback (one positive, one constructive) for realistic situations</li>
                <li>Design a short anonymous team-health pulse and decide how you'll act on results</li>
                <li>Sketch how you'd build psychological safety in your first 90 days leading the team</li>
            </ol>`,
            code: `// 1. Role competencies + scorecard; interviewers own distinct areas
// 2. Onboarding: day-1 setup + buddy + tiny shipped change; 30/60/90 goals
// 3. 1:1 template: their agenda -> growth -> feedback both ways -> "how can I help?"
// 4. SBI feedback examples (specific situation/behavior/impact)
// 5. Pulse survey (safety/clarity/growth/feedback/meaning) + visible follow-up
// 6. Safety plan: model fallibility, welcome questions, blameless retros`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What is psychological safety and why does it matter?<br/>
                    <em>A: The shared belief that it's safe to take risks, ask questions, admit mistakes, and disagree
                    without fear of punishment. Google's Project Aristotle found it the top predictor of team
                    effectiveness \u2014 without it, people hide mistakes and don't speak up.</em></li>
                <li><strong>Q:</strong> What should a 1:1 meeting be (and not be)?<br/>
                    <em>A: It's the engineer's meeting \u2014 for trust, growth, feedback, and unblocking, with the manager
                    listening more than talking. It should NOT be a project status update (that belongs in standups/tools).</em></li>
                <li><strong>Q:</strong> What is "culture add" vs "culture fit"?<br/>
                    <em>A: Culture fit often means hiring people similar to the existing team (reducing diversity of
                    thought). Culture add means valuing the new strengths and perspectives a candidate brings that the
                    team currently lacks.</em></li>
                <li><strong>Q:</strong> What makes feedback effective (SBI)?<br/>
                    <em>A: It is specific, timely, and about behavior/impact rather than character: describe the Situation,
                    the Behavior, and its Impact. This makes it actionable and safe rather than vague or personal.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'What is psychological safety and how do you build it on a team?',
            difficulty: 'medium',
            answer: `<p><strong>Psychological safety</strong> is the shared belief that the team is a safe place to take
            interpersonal risks — to ask questions, admit mistakes, propose ideas, and disagree — without fear of
            embarrassment or punishment. Google's Project Aristotle found it the single biggest predictor of team
            effectiveness.</p>
            <p>You build it by: <strong>modeling fallibility</strong> (admit your own mistakes and what you don't
            know), <strong>responding to errors with curiosity not blame</strong> (blameless postmortems),
            <strong>welcoming questions and dissent</strong> (thank people for raising concerns), <strong>giving
            credit and not punishing honest failure</strong>, and <strong>showing you act on input</strong>. It is
            built slowly through consistent behavior and destroyed quickly by one public blaming.</p>`,
            explanation: 'It is like a gym where beginners feel comfortable trying exercises badly because no one mocks them. In that environment people attempt hard things, ask for help, and improve. In a judgmental gym they hide, avoid challenges, and never grow.',
            bestPractices: ['Model admitting mistakes and not-knowing', 'Respond to failure with learning, not blame', 'Explicitly welcome questions and dissent', 'Act visibly on feedback'],
            commonMistakes: ['Punishing or blaming honest mistakes', 'Shutting down dissent', 'Only the leader\u2019s ideas being safe to challenge'],
            interviewTip: 'Cite Project Aristotle and emphasize that you build safety through your own behavior (modeling fallibility) — leaders set the tone first.',
            followUp: ['How do you keep safety while still holding a high bar?', 'How does blameless postmortem culture relate?']
        },
        {
            question: 'How do you run effective 1:1s, and why do they matter?',
            difficulty: 'medium',
            answer: `<p>An effective <strong>1:1</strong> is the engineer's meeting, not a status report. Run it by:
            letting <strong>their agenda come first</strong> (what's on their mind, blockers, frustrations);
            <strong>listening more than talking</strong>; covering <strong>growth and career</strong> periodically;
            <strong>exchanging feedback in both directions</strong>; and asking <strong>"how can I help?"</strong>.
            Hold them on a regular cadence (weekly/biweekly), protect them, and reschedule rather than cancel.</p>
            <p>They matter because they create dedicated space for trust, growth, and surfacing problems early.
            Without 1:1s, you typically discover someone is unhappy only when they resign — far too late. Status
            updates belong in standups and tools; the 1:1 is for the human.</p>`,
            explanation: 'A 1:1 is like a regular health check-up rather than waiting for the emergency room. Small issues (a frustration, a growth itch) get caught and addressed early, before they become a resignation or a crisis.',
            bestPractices: ['Engineer\u2019s agenda first; listen more', 'Protect the cadence; reschedule don\u2019t cancel', 'Cover growth/career, not just current work', 'Exchange feedback both ways'],
            commonMistakes: ['Turning it into a status update', 'Skipping/cancelling repeatedly', 'Manager dominating the conversation'],
            interviewTip: 'The key differentiator: "it is the engineer\u2019s meeting, not a status update, and I listen more than I talk." That framing signals real management experience.',
            followUp: ['What do you do if an engineer has "nothing" for the 1:1?', 'How do you surface a sensitive concern?']
        },
        {
            question: 'How would you turn around an underperforming or disengaged team member?',
            difficulty: 'hard',
            answer: `<p>Approach it with curiosity and structure, not judgment:</p>
            <ol>
                <li><strong>Diagnose the root cause first:</strong> in a safe 1:1, understand <em>why</em>. Is it a
                skill gap, unclear expectations, a personal/life issue, misalignment of work to strengths/interests,
                burnout, or a team dynamic? The remedy depends entirely on the cause.</li>
                <li><strong>Clarify expectations:</strong> often "underperformance" is unclear or misaligned
                expectations. Make "good" concrete and ensure they understand it.</li>
                <li><strong>Give specific, kind, timely feedback (SBI):</strong> name the gap with examples and
                impact, framed as something you'll solve together — not an attack.</li>
                <li><strong>Create a concrete improvement plan:</strong> clear goals, support (mentoring, pairing,
                training), and a realistic timeline, with regular check-ins.</li>
                <li><strong>Address root causes you control:</strong> reassign work to strengths, fix a process, or
                address burnout where that's the issue.</li>
                <li><strong>Be honest about outcomes:</strong> if, with genuine support and clear expectations, it
                doesn't improve, a respectful, fair exit may be right — for them and the team. Document and follow a
                fair process.</li>
            </ol>
            <p>Throughout: maintain dignity and psychological safety; most "performance problems" are solvable when
            the real cause is found and addressed.</p>`,
            explanation: 'It is like a doctor with a patient who is unwell: you do not prescribe before diagnosing. The same symptom (low output) can stem from a skill gap, unclear goals, burnout, or wrong-fit work \u2014 and each needs a completely different treatment. Jumping to "they\u2019re a bad engineer" is misdiagnosis.',
            bestPractices: ['Diagnose root cause before acting', 'Make expectations concrete', 'Specific kind feedback + a supported improvement plan', 'Address causes within your control (fit, process, burnout)', 'Be honest and fair if it doesn\u2019t improve'],
            commonMistakes: ['Assuming malice/incompetence without diagnosis', 'Vague feedback ("step it up")', 'No support or plan, just pressure', 'Avoiding the issue until it festers', 'Skipping a fair, documented process'],
            interviewTip: 'Lead with "diagnose the root cause first" and show empathy + structure. Acknowledging that sometimes a respectful exit is the right outcome (handled fairly) shows maturity, not just optimism.',
            followUp: ['How do you tell skill gap from motivation gap?', 'How do you handle it if burnout is the cause?', 'When is a PIP appropriate and how do you run it humanely?'],
            seniorPerspective: 'The biggest mistake I see new managers make is treating underperformance as a character verdict and skipping straight to pressure or paperwork. In my experience the cause is usually environmental \u2014 unclear expectations, work mismatched to the person\u2019s strengths, an unaddressed life situation, or quiet burnout \u2014 and naming the real cause in a safe conversation often unlocks a fast turnaround. I clarify what "good" looks like concretely, provide real support, and set check-ins. If it genuinely doesn\u2019t improve despite that, I move with honesty and dignity \u2014 a fair, well-documented exit is kinder to everyone than letting the situation drag, demoralize the team, and corrode trust.'
        }
    ,
        {
            question: 'What is psychological safety and how do you build it on an engineering team?',
            difficulty: 'medium',
            answer: `<p><strong>Psychological safety</strong> is the shared belief that you can speak up, ask questions, admit mistakes, and challenge ideas without fear of punishment or humiliation. Google's Project Aristotle found it the single biggest differentiator of effective teams.</p>
            <ul>
                <li><strong>Model vulnerability</strong> \u2014 as a leader, admit your own mistakes and say "I don't know".</li>
                <li><strong>Blameless culture</strong> \u2014 treat failures as system/process learning, not individual fault.</li>
                <li><strong>Reward speaking up</strong> \u2014 thank people for surfacing problems, dissent, and bad news early.</li>
                <li><strong>Equal voice</strong> \u2014 ensure quieter members are heard, not just the loudest.</li>
            </ul>`,
            explanation: 'It is the difference between a team where someone says "I think this design is risky" out loud, and one where they stay silent and let the iceberg hit \u2014 because last time someone spoke up, they got blamed.',
            bestPractices: ['Model fallibility: admit your own mistakes and gaps', 'Run blameless postmortems focused on systems, not people', 'Actively thank people for raising problems and dissent', 'Create space for quieter voices (round-robins, written input)'],
            commonMistakes: ['Blaming individuals for failures, teaching people to hide them', 'Leaders who never admit being wrong, signaling it is unsafe', 'Letting the loudest voice dominate every decision', 'Confusing psychological safety with lack of accountability'],
            interviewTip: 'Define it precisely (safe to speak up / admit mistakes / dissent) and cite that it predicts team effectiveness. Stress it is NOT the absence of accountability \u2014 a common misconception.',
            followUp: ['How is psychological safety different from being nice?', 'How do you measure it?', 'How do you maintain it while holding a high bar?'],
            seniorPerspective: 'I build it deliberately by going first \u2014 admitting my own mistakes in retros makes it safe for others. The payoff is that problems surface early, when they are cheap, instead of being hidden until they are expensive.',
            architectPerspective: 'Safety and accountability are not opposites; the best teams have both \u2014 high standards held in a way that makes it safe to fail and learn. That combination is what lets a team take on ambitious, uncertain work without freezing.'
        },
        {
            question: 'How do you structure effective 1:1s with your engineers?',
            difficulty: 'medium',
            answer: `<p>1:1s are <strong>the report's meeting</strong>, focused on them \u2014 growth, blockers, and well-being \u2014 not a status update you could get from the board.</p>
            <ul>
                <li><strong>Their agenda first</strong> \u2014 let them drive; you listen more than you talk.</li>
                <li><strong>Beyond status</strong> \u2014 career growth, feedback (both directions), relationships, and obstacles you can remove.</li>
                <li><strong>Consistent and protected</strong> \u2014 regular cadence, rarely cancelled; cancelling signals they don't matter.</li>
                <li><strong>Actionable</strong> \u2014 capture follow-ups and actually close them, building trust over time.</li>
            </ul>`,
            explanation: 'A 1:1 is not a stand-up. Stand-up is "what did the project do"; the 1:1 is "how are you doing, and what do you need from me" \u2014 the person, not the tickets.',
            bestPractices: ['Let the report set the agenda; spend more time listening', 'Cover growth, feedback, and blockers \u2014 not just project status', 'Hold them on a consistent cadence and protect the time', 'Track and follow through on action items'],
            commonMistakes: ['Turning 1:1s into status meetings (status belongs elsewhere)', 'Frequently cancelling or rescheduling them', 'Manager dominates the conversation', 'No follow-through on commitments, eroding trust'],
            interviewTip: 'Stress that the 1:1 belongs to the report and is about them, not status. Consistency and follow-through are what build the trust that makes 1:1s valuable.',
            followUp: ['How do 1:1s change for a struggling vs thriving report?', 'What questions surface real issues?', 'How do you keep them from becoming status updates?'],
            seniorPerspective: 'My best 1:1s are the ones where I barely talk. If I am doing most of the talking, I have turned their growth-and-support time into my broadcast channel, which defeats the purpose.',
            architectPerspective: 'Consistent 1:1s are an early-warning system: disengagement, friction, and attrition risk surface there long before they show up in delivery metrics. Skipping them trades a small time cost now for expensive surprises later.'
        },
        {
            question: 'How do you onboard a new engineer so they become productive quickly?',
            difficulty: 'medium',
            answer: `<p>Great onboarding is structured, not "here\u2019s the repo, good luck". The goal is early wins, growing autonomy, and belonging.</p>
            <ul>
                <li><strong>Ramp plan</strong> \u2014 a 30/60/90 plan with concrete milestones (environment up, first PR, first feature, owns an area).</li>
                <li><strong>First-week win</strong> \u2014 a small, real, shippable task to build confidence and exercise the whole pipeline.</li>
                <li><strong>Onboarding buddy</strong> \u2014 a go-to peer for the "dumb questions", separate from the manager.</li>
                <li><strong>Context, not just code</strong> \u2014 the why: domain, customers, architecture decisions, team norms.</li>
                <li><strong>Improve the docs</strong> \u2014 have them fix onboarding docs as they go; fresh eyes find the gaps.</li>
            </ul>`,
            explanation: 'Onboarding is like a guided trail with markers, not dropping someone in the forest with a map and wishing them luck. Early markers (first PR, first feature) build confidence and direction.',
            bestPractices: ['Provide a 30/60/90 ramp plan with concrete milestones', 'Ship a small real task in week one to exercise the full pipeline', 'Assign an onboarding buddy separate from the manager', 'Teach domain/architecture context, not just where the code is'],
            commonMistakes: ['"Here\u2019s the repo, good luck" with no structure', 'First task is huge or vague, killing early confidence', 'No buddy, so they hesitate to ask basic questions', 'Teaching code mechanics but not the business/domain why'],
            interviewTip: 'Mention a 30/60/90 plan, an early shippable win, and a buddy. The detail that lands: have them improve onboarding docs as they go \u2014 fresh eyes catch what veterans no longer see.',
            followUp: ['How does onboarding differ for senior vs junior hires?', 'How do you onboard remotely?', 'How do you measure onboarding success?'],
            seniorPerspective: 'I optimize for a real shipped change in the first week \u2014 nothing builds confidence and reveals pipeline friction like going end-to-end early. I also treat their first-month questions as a free audit of our documentation.',
            architectPerspective: 'Onboarding time is a systemic metric: if it routinely takes months, that is a signal of accidental complexity, poor docs, or tangled architecture. Investing in fast onboarding pays back on every future hire and reflects overall system health.'
        },
        {
            question: 'How do you create psychological safety in a team that has experienced blame culture?',
            difficulty: 'hard',
            answer: `<p>Rebuilding psychological safety after blame culture requires <strong>consistent, visible behavior change over time</strong> — not a single announcement. Trust is rebuilt in small moments, not grand gestures.</p>
            <ul>
                <li><strong>Model vulnerability first</strong> — publicly own your own mistakes: "I got that wrong, here's what I learned." If the leader is never wrong, nobody else will admit mistakes either.</li>
                <li><strong>Respond to failure with curiosity, not punishment</strong> — when something breaks, ask "what did we learn?" and "what systemic fix prevents this?" not "who did this?"</li>
                <li><strong>Blameless post-mortems religiously</strong> — run them for every incident and visibly protect the people involved. One blame incident undoes months of trust-building.</li>
                <li><strong>Reward transparency</strong> — publicly praise people who surface problems early, admit gaps, or ask for help. What you reward signals what is safe.</li>
                <li><strong>Small wins compound</strong> — every meeting where someone asks a "dumb" question and gets a respectful answer builds safety for the next person.</li>
                <li><strong>Address toxic behavior immediately</strong> — one person who mocks or blames will destroy safety for the whole team. This is not optional to address.</li>
            </ul>`,
            explanation: 'Psychological safety is like a garden after a fire: you cannot just declare "it\u2019s safe now." You rebuild the soil one interaction at a time, protect the new growth from anything that would burn it again, and model the vulnerability you want to see.',
            bestPractices: ['Model vulnerability by publicly owning your own mistakes first', 'Run blameless post-mortems and visibly protect participants', 'Reward early problem-surfacing and help-seeking publicly', 'Address toxic/blaming behavior immediately — one bad actor undoes months of work', 'Be patient: rebuilding trust takes consistent behavior over months, not a memo'],
            commonMistakes: ['Declaring safety without changing behavior (words without action)', 'Allowing one blame incident to slip through unchallenged', 'Expecting instant change after years of blame culture', 'Only addressing the team without changing your own behavior first'],
            interviewTip: 'Lead with modeling vulnerability yourself and responding to failure with curiosity. The hard-level signal is recognizing that one slip undoes months of trust-building, so consistency is non-negotiable.',
            followUp: ['How do you measure psychological safety?', 'How do you handle a senior engineer who blames others publicly?', 'How long does it take to rebuild safety after blame culture?'],
            seniorPerspective: 'The single most powerful thing I did was say "I was wrong about X and here\u2019s what I\u2019ve changed" in a team meeting. Once the leader is visibly fallible, it becomes safe for everyone else to be too. But one reversion to blame-mode and you\u2019re back to zero.',
            architectPerspective: 'Psychological safety is not a soft nice-to-have — it is the prerequisite for the risk-taking that good engineering requires. Teams that fear blame ship safe, boring, incremental work because bold experiments require admitting what did not work. Safety is architecture infrastructure.'
        },
        {
            question: 'How do you onboard a senior engineer effectively so they\u2019re productive within 2 weeks?',
            difficulty: 'hard',
            answer: `<p>Senior onboarding must balance <strong>quick autonomy with deep context</strong>. Seniors need less hand-holding on mechanics but more on domain, architecture decisions, team dynamics, and organizational context.</p>
            <ul>
                <li><strong>Pre-day-one setup</strong> — accounts, access, dev environment, and hardware ready before they arrive. Zero time wasted on logistics.</li>
                <li><strong>Architecture context in day 1–2</strong> — walk through the system architecture, key ADRs, and the "why" behind major decisions. Seniors need to understand the design rationale, not just the code.</li>
                <li><strong>Meaningful first task by day 3</strong> — not a toy task: a real bug, a small feature, or a refactor that exercises the codebase and pipeline end-to-end.</li>
                <li><strong>1:1 stakeholder introductions</strong> — introduce them to key collaborators (product, ops, dependent teams) so they can navigate independently.</li>
                <li><strong>Assign a context buddy</strong> — a peer who knows the history and can answer "why did we..." questions without judgment.</li>
                <li><strong>Explicit expectations</strong> — what does "productive" mean by week 2? First merged PR? First design contribution? Being clear prevents both over-caution and overwhelm.</li>
                <li><strong>Let them challenge</strong> — fresh senior eyes see what veterans have normalized. Encourage "this seems odd" observations as a feature, not a threat.</li>
            </ul>`,
            explanation: 'Onboarding a senior is like integrating a seasoned chef into a new kitchen: they know how to cook, but they need to learn your menu, your ingredient suppliers, and why the walk-in fridge is organized that particular way. Give them the context, hand them a real order quickly, and let them ask "why" freely.',
            bestPractices: ['Have everything (access, environment, hardware) ready before day one', 'Lead with architecture context and decision rationale, not just code walkthroughs', 'Give a meaningful, real task by day 3 that exercises the full pipeline', 'Introduce them to key stakeholders so they can self-navigate', 'Welcome their fresh-eyes observations as valuable, not threatening'],
            commonMistakes: ['Treating senior onboarding the same as junior onboarding (too basic)', 'Giving toy tasks that insult their experience and delay real contribution', 'No architecture/ADR context, forcing them to reverse-engineer decisions', 'Forgetting stakeholder introductions, leaving them isolated from context', 'Day one spent fighting access/environment issues instead of learning'],
            interviewTip: 'Stress speed-to-meaningful-contribution: architecture context early, real task by day 3, and explicit success criteria for week 2. The distinguishing detail: letting them challenge existing decisions is a feature of senior onboarding.',
            followUp: ['How does senior onboarding differ from junior onboarding?', 'How do you handle a senior hire who is still unproductive at week 4?', 'How do you balance onboarding structure with senior autonomy?'],
            seniorPerspective: 'My week-one goal for a senior hire is a shipped PR and two "why do we do it this way?" conversations. The PR proves the pipeline works; the questions surface where our architecture or docs are unclear — both are valuable outputs.',
            architectPerspective: 'Senior onboarding speed is an architecture health metric. If a competent senior cannot contribute within two weeks, the system has too much accidental complexity, undocumented decisions, or tribal knowledge. I use onboarding friction as diagnostic signal for where to invest in simplification.'
        }
    ]
});
