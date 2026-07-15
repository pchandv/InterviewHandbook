/* ═══════════════════════════════════════════════════════════════════
   Leadership — Technical Leadership, Code Reviews, Mentoring
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('leadership-core', {
    title: 'Technical Leadership',
    description: 'Code review best practices, mentoring developers, conflict resolution, stakeholder management, technical decision making, and growing from senior engineer to tech lead.',
    sections: [
        {
            title: 'Effective Code Reviews',
            content: `<p>Code reviews are the highest-leverage activity for code quality, knowledge sharing, and team growth. A senior engineer sets the standard through thoughtful, constructive reviews.</p>`,
            code: `// Code Review Framework (what to look for, in priority order):

// 1. CORRECTNESS — Does it work? Does it handle edge cases?
//    - Business logic accuracy
//    - Error handling (what happens when things fail?)
//    - Null/empty/boundary conditions
//    - Concurrency safety (if applicable)

// 2. SECURITY — Is it safe?
//    - SQL injection, XSS, CSRF risks
//    - Authorization checks (not just authentication)
//    - Secrets handling (no hardcoded credentials)
//    - Input validation

// 3. PERFORMANCE — Will it scale?
//    - N+1 queries, missing indexes
//    - Unnecessary allocations in hot paths
//    - Appropriate caching
//    - Async where needed

// 4. MAINTAINABILITY — Can the next person understand it?
//    - Clear naming (intent-revealing)
//    - Single responsibility
//    - Appropriate abstraction level (not over-engineered)
//    - Test coverage for complex logic

// 5. STYLE — Does it follow team conventions?
//    - LOWEST priority (automate with linters!)
//    - Only mention if readability is genuinely affected

// How to give feedback:
// BAD: "This is wrong." (judgmental, no context)
// BAD: "Why did you do it this way?" (feels accusatory)
// GOOD: "Have you considered using Dictionary here? It would make the lookup O(1) instead of O(n)."
// GOOD: "This could throw NullReferenceException if order.Customer is null. Adding a null check here would prevent that."
// GOOD: "Nit: naming suggestion — 'processOrder' → 'submitOrder' better conveys the intent."

// Prefix system:
// "Nit:" — optional style suggestion, up to author
// "Question:" — seeking understanding, not necessarily a change request
// "Suggestion:" — improvement idea, author decides
// "Must fix:" — blocking issue that must be addressed`,
            language: 'csharp'
        },
        {
            title: 'Mentoring & Growing Engineers',
            content: `<p>A tech lead's impact multiplies through the people they develop. Effective mentoring combines technical guidance with career coaching and creating growth opportunities.</p>`,
            code: `// Mentoring Framework:

// LEVELS OF SUPPORT (adjust based on mentee's experience):
// Junior (0-3 years): Directive — show them how, pair program, explain why
// Mid (3-7 years): Coaching — ask questions that lead to answers, review approach
// Senior (7+ years): Sponsoring — advocate for them, give stretch assignments

// Delegation framework for tech leads:
// Level 1: "Do exactly this" (new team members, critical tasks)
// Level 2: "Research options, I'll decide" (building judgment)
// Level 3: "Decide and tell me before executing" (building confidence)
// Level 4: "Decide, execute, brief me after" (trusted autonomy)
// Level 5: "Own this entirely" (full delegation)

// 1:1 Meeting structure:
// - What's blocking you? (unblock immediately)
// - What went well this week? (reinforce good patterns)
// - What would you do differently? (encourage reflection)
// - What skill do you want to develop next? (growth focus)
// - How can I better support you? (servant leadership)

// Growth opportunities to create:
// - Design document ownership (thinking at scale)
// - Cross-team collaboration (influence without authority)
// - Incident response lead (crisis management)
// - Tech talk/presentation (communication skills)
// - Code review of your code (psychological safety)
// - Architecture decision records (decision making)`,
            language: 'csharp'
        },
        {
            title: 'Technical Decision Making',
            content: `<p>Senior engineers and tech leads make high-impact decisions daily — technology choices, architecture trade-offs, and prioritization. The best decisions are reversible, well-documented, and made with the right level of information.</p>`,
            code: `// Architecture Decision Record (ADR) template:
// Title: ADR-001: Use PostgreSQL for primary database
// Status: Accepted
// Date: 2024-03-15
// Context: We need a primary database for our order management system.
//   Requirements: ACID transactions, complex queries, 10K TPS, team expertise.
// Decision: Use PostgreSQL (Aurora Serverless v2) over:
//   - MongoDB (no strong transactions across collections)
//   - SQL Server (licensing cost, team prefers open-source)
//   - DynamoDB (complex query patterns don't fit key-value)
// Consequences:
//   - Team needs PostgreSQL-specific knowledge (not a concern, 3 experts)
//   - Slightly higher operational complexity vs managed DynamoDB
//   - Enables complex reporting queries without separate system
// Revisit: If we exceed 100K TPS or need global distribution

// Decision-making frameworks:
// 1. REVERSIBILITY: Is this a one-way or two-way door?
//    - One-way (database choice, cloud provider): more analysis, broader input
//    - Two-way (library choice, API design): decide quickly, iterate

// 2. COST OF DELAY: What happens if we don't decide now?
//    - High cost: team blocked, deadline at risk → decide with 70% information
//    - Low cost: no urgency → gather more data, prototype

// 3. BLAST RADIUS: What breaks if we're wrong?
//    - High: architecture, data model, public API → invest in analysis
//    - Low: internal implementation detail → just pick one and move on

// Communication patterns for technical decisions:
// Stakeholders: "We chose X because it solves Y without Z risk"
// Team: "Here's the ADR with context and trade-offs, comments welcome"
// Management: "This reduces delivery risk by X and costs Y"`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'How do you conduct effective code reviews? What do you prioritize?',
            difficulty: 'medium',
            answer: `<p>Effective code reviews prioritize: (1) correctness and edge cases, (2) security vulnerabilities, (3) performance issues, (4) maintainability and clarity, (5) style (lowest — automate this). The tone should be constructive and educational, using a prefix system (Must fix / Suggestion / Nit / Question) to communicate severity.</p>`,
            bestPractices: ['Review for correctness and security first, style last (automate style checks)', 'Use prefix system to indicate severity (blocking vs suggestion vs nit)', 'Explain WHY, not just what — teach through reviews', 'Limit review size: if PR is >400 lines, ask to split it'],
            commonMistakes: ['Focusing only on style/formatting (should be automated)', 'Being overly critical without being constructive (damages psychological safety)', 'Rubber-stamping reviews without reading carefully (defeats the purpose)', 'Blocking PRs over subjective preferences that don\'t affect correctness'],
            interviewTip: 'Show your philosophy: code review is a collaboration tool, not a gatekeeping mechanism. Mention that you review for bugs/security FIRST (highest impact), and automate style enforcement (lowest value human activity).',
            followUp: ['How do you handle disagreements in code review?', 'How do you review code from someone more senior?', 'What is your approach to large PRs?'],
            seniorPerspective: 'I spend 30% of my review time on what the code DOESN\'T do: missing error handling, unhandled edge cases, missing validation. The happy path usually works — bugs hide in the unhappy path that developers don\'t think about.',
            architectPerspective: 'Code review is a cultural tool as much as a quality tool. I establish team review guidelines: 24-hour turnaround SLA, review checklist, auto-assigned reviewers, and a culture where reviewing IS core work (not interruption). The goal: every team member improves through every review they give or receive.'
        },
        {
            question: 'How do you handle technical disagreements within a team?',
            difficulty: 'advanced',
            answer: `<p>Technical disagreements are healthy — they surface trade-offs and improve decisions. Resolution approach: (1) seek to understand each position fully, (2) align on shared constraints and goals, (3) evaluate objectively with data/prototypes when possible, (4) make a time-boxed decision, (5) document the rationale, (6) commit fully once decided — disagree and commit.</p>`,
            bestPractices: ['Separate the person from the position (it is the idea being evaluated, not the person)', 'Use data and prototypes to resolve subjective debates objectively', 'Time-box the decision — analysis paralysis is worse than a suboptimal choice', 'Document decisions via ADRs so context is preserved for future team members'],
            commonMistakes: ['Letting seniority or loudness win instead of merit (HiPPO effect)', 'Avoiding conflict (unresolved disagreements fester into resentment)', 'Revisiting decided topics repeatedly (undermines team trust)', 'Making it personal ("your approach is wrong" vs "this approach has trade-off X")'],
            interviewTip: 'Give a concrete example from your experience: "We disagreed about X. I proposed we prototype both approaches for 2 days, measure performance, then decide based on data. Approach B won, I committed fully to it even though I initially preferred A."',
            followUp: ['What is "disagree and commit"?', 'How do you make decisions when data is unavailable?', 'How do you handle a team member who won\'t accept the team\'s decision?'],
            seniorPerspective: 'My rule: if we cannot resolve in 30 minutes of discussion, we prototype or timebox a spike. Most technical debates are about predictions ("this will be faster/simpler") — prototyping turns predictions into measurements.',
            architectPerspective: 'I frame disagreements as reversibility decisions. If the choice is easily reversible (library choice, implementation detail), I empower the implementer to decide. If it is hard to reverse (database choice, public API contract), I invest more in collaborative analysis and broader stakeholder input.'
        },
        {
            question: 'How do you approach estimation and communicate timelines to stakeholders?',
            difficulty: 'medium',
            answer: `<p>Effective estimation communicates uncertainty, not false precision. Use ranges (not points), decompose large work, track velocity empirically, and always communicate assumptions and risks alongside the estimate.</p>`,
            bestPractices: ['Estimate in ranges: "likely 2 weeks, could be 3 if integration is complex"', 'Break large items into smaller pieces (anything > 1 week is too large to estimate accurately)', 'Track team velocity empirically — don\'t guess capacity, measure it from past sprints', 'Include time for testing, code review, deployment, and unexpected issues (buffer 20-30%)'],
            commonMistakes: ['Single-point estimates ("it will take 2 weeks" — where is the uncertainty?)', 'Estimating without decomposing (large items are always underestimated)', 'Treating estimates as commitments (they are predictions, not promises)', 'Not re-estimating when you learn new information (estimates are living documents)'],
            interviewTip: 'Show you understand estimation is about risk communication, not prediction. Mention techniques: T-shirt sizing for high-level, story points for sprint planning, three-point estimates for critical path items. Emphasize that you track accuracy and improve over time.',
            followUp: ['How do you handle pressure to give lower estimates?', 'What is the difference between estimates and commitments?', 'How do you estimate work with high uncertainty?'],
            seniorPerspective: 'I never give a single number. I say: "best case 1 week, most likely 2 weeks, worst case 3 weeks if the external API integration is harder than expected. I will know more after Thursday\'s spike." This sets expectations while communicating uncertainty honestly.',
            architectPerspective: 'At the program level, I use probabilistic forecasting (Monte Carlo simulations on historical velocity data) rather than summing individual estimates. Individual estimates have ±50% error; aggregate velocity-based forecasts converge to ±20%. The data removes the politics from timeline discussions.'
        }
    ,
        {
            question: 'How do you give effective feedback to an engineer whose code quality is slipping?',
            difficulty: 'medium',
            answer: `<p>Use a structured, specific, and timely approach. The <strong>SBI model</strong> (Situation\u2013Behavior\u2013Impact) keeps feedback factual and non-personal: describe the situation, the observed behavior, and its impact \u2014 then collaborate on a path forward.</p>
            <ul>
                <li><strong>Private and prompt</strong> \u2014 deliver constructive feedback 1:1, soon after, not saved up for review season.</li>
                <li><strong>Specific, not characterizing</strong> \u2014 "this PR had three untested edge cases" beats "you're careless".</li>
                <li><strong>Two-way</strong> \u2014 ask for their perspective; quality dips often signal overload, unclear standards, or personal issues.</li>
                <li><strong>Agree on actions</strong> and follow up, reinforcing improvement when you see it.</li>
            </ul>`,
            explanation: 'Good feedback is like a code review comment, not a performance verdict: it points at a specific line and explains why, so the person can fix it without feeling attacked.',
            bestPractices: ['Use SBI \u2014 separate observed behavior from personal judgment', 'Deliver privately and promptly, tied to concrete examples', 'Make it a dialogue; uncover root causes (overload, unclear expectations)', 'Agree on specific next steps and follow up positively'],
            commonMistakes: ['Vague characterizations ("be more careful") with no examples', 'Saving feedback for the annual review instead of addressing it now', 'Feedback as a monologue that ignores the person\u2019s context', 'Only ever giving negative feedback, never reinforcing improvement'],
            interviewTip: 'Name a framework (SBI) and stress specific + private + timely + two-way. Mentioning that a quality dip often has a root cause shows empathy and leadership maturity.',
            followUp: ['How do you handle a defensive reaction to feedback?', 'How is feedback different for a senior vs a junior engineer?', 'When does repeated feedback become a performance issue?'],
            seniorPerspective: 'I separate a one-off slip from a pattern. The first conversation is curious, not corrective \u2014 usually there is a cause (burnout, unclear standards). I only escalate to a formal performance discussion if the pattern persists after support and clear expectations.',
            architectPerspective: 'Persistent quality issues across a team are usually systemic, not individual: missing standards, no automated gates, or unrealistic deadlines. I invest in linters, review norms, and definition-of-done so quality is enforced by the system, not just by feedback.'
        },
        {
            question: 'How do you resolve a technical disagreement between two strong engineers?',
            difficulty: 'medium',
            answer: `<p>Move the debate from opinions to <strong>evidence and shared goals</strong>. The job is not to pick a winner but to reach the best decision the team will commit to.</p>
            <ul>
                <li><strong>Establish the criteria first</strong> \u2014 agree on what "better" means here (latency, maintainability, time-to-ship, risk) before arguing solutions.</li>
                <li><strong>Make it data-driven</strong> \u2014 prototype, benchmark, or spike to replace "I think" with measurements.</li>
                <li><strong>Reversibility</strong> \u2014 for cheap-to-reverse decisions, just pick one and move; reserve deep debate for one-way doors.</li>
                <li><strong>Disagree and commit</strong> \u2014 once decided (and documented in an ADR), everyone backs it, even those who preferred the alternative.</li>
            </ul>`,
            explanation: 'It is like settling an argument about the fastest route by actually timing both drives instead of debating \u2014 and agreeing beforehand whether you\u2019re optimizing for speed or for scenery.',
            bestPractices: ['Agree on decision criteria before comparing solutions', 'Resolve with data: spikes, benchmarks, prototypes', 'Weigh reversibility \u2014 don\u2019t over-debate two-way doors', 'Document the decision (ADR) and apply disagree-and-commit'],
            commonMistakes: ['Letting seniority or volume win instead of evidence', 'Endless debate over an easily reversible choice', 'No agreed criteria, so the argument is really about different goals', 'Deciding with no record, so the same debate recurs'],
            interviewTip: 'Show you depersonalize it: agree on criteria, get data, weigh reversibility, then disagree-and-commit with an ADR. That sequence signals you lead decisions rather than adjudicate egos.',
            followUp: ['What goes in an ADR?', 'How do you handle it when the data is inconclusive?', 'When do you escalate vs decide yourself?'],
            seniorPerspective: 'My first move is to ask "what are we actually optimizing for?" \u2014 most "technical" disagreements are really unstated differences in goals. Once criteria are explicit, the right answer is usually obvious or cheaply testable.',
            architectPerspective: 'I classify decisions by reversibility (Bezos one-way vs two-way doors). Two-way doors get a fast default and a quick experiment; one-way doors get rigorous analysis and an ADR. This keeps velocity high without gambling on irreversible choices.'
        },
        {
            question: 'How do you mentor engineers and grow them toward the next level?',
            difficulty: 'medium',
            answer: `<p>Mentoring is about increasing someone's <strong>scope, autonomy, and impact</strong> over time, not solving their problems for them.</p>
            <ul>
                <li><strong>Meet them where they are</strong> \u2014 understand current level and growth goals; tailor support accordingly.</li>
                <li><strong>Delegate stretch work</strong> \u2014 hand off problems slightly beyond their comfort zone with a safety net, not just well-scoped tickets.</li>
                <li><strong>Teach problem-solving, not answers</strong> \u2014 ask guiding questions so they build judgment; resist taking the keyboard.</li>
                <li><strong>Create visibility</strong> \u2014 give them ownership of areas, exposure to stakeholders, and credit for outcomes.</li>
                <li><strong>Regular 1:1s</strong> focused on growth, not just status.</li>
            </ul>`,
            explanation: 'Mentoring is teaching someone to fish: it is slower than handing them the fish, and tempting to just do it yourself, but the goal is an engineer who no longer needs you for that class of problem.',
            bestPractices: ['Tailor support to the person\u2019s current level and goals', 'Delegate stretch assignments with a safety net to build autonomy', 'Ask guiding questions instead of handing over answers', 'Create visibility and give credit to grow their scope and reputation'],
            commonMistakes: ['Solving problems for them, which stalls growth', 'Only delegating safe, well-scoped work (no stretch)', 'Treating 1:1s as status meetings instead of growth conversations', 'Taking credit or shielding them from all stakeholder exposure'],
            interviewTip: 'Frame growth in terms of scope, autonomy, and impact \u2014 the same axes promotions use. Emphasize teaching judgment over giving answers, and creating visibility.',
            followUp: ['How do you mentor someone more senior than the work requires?', 'How do you know when someone is ready for the next level?', 'How do you mentor without becoming a bottleneck?'],
            seniorPerspective: 'The hardest discipline is sitting on my hands \u2014 I can solve it in ten minutes, but if I do, they learn nothing. I optimize for their long-term autonomy over my short-term throughput, and I measure success by what they can now do without me.',
            architectPerspective: 'Scaling myself through mentoring is the highest-leverage thing I do: a senior who grows three engineers multiplies impact far beyond personal output. I treat growing people as a core engineering responsibility, not a soft-skill extra.'
        },
        {
            question: 'How do you give effective technical feedback in code reviews without being demotivating?',
            difficulty: 'hard',
            answer: `<p>The goal is to <strong>raise the bar while preserving psychological safety</strong>. Feedback that teaches is embraced; feedback that judges is resisted.</p>
            <ul>
                <li><strong>Critique the code, not the coder</strong> — "this function has a race condition" vs "you wrote a race condition".</li>
                <li><strong>Explain the why</strong> — don't just say what's wrong; explain the consequence and what a better approach achieves.</li>
                <li><strong>Use questions over directives</strong> — "Have you considered what happens if this throws?" invites thinking; "Fix this" invites resentment.</li>
                <li><strong>Prefix by severity</strong> — distinguish blocking issues from suggestions from nits, so the author knows what must change vs what's optional.</li>
                <li><strong>Acknowledge what's good</strong> — calling out strong patterns or clever solutions normalizes positive feedback and balances critique.</li>
                <li><strong>Keep it timely and proportional</strong> — a 500-line PR with 40 comments feels like an attack. Limit to the most impactful items or ask to pair.</li>
            </ul>`,
            explanation: 'Think of code review like coaching a sport: pointing out the missed shot is fine, but you also demonstrate the technique and celebrate the plays that worked. If every interaction is correction, the player stops listening.',
            bestPractices: ['Separate severity levels: blocking / suggestion / nit / praise', 'Explain the consequence of the issue, not just its existence', 'Use questions to prompt thinking rather than commands to demand compliance', 'Balance critique with genuine acknowledgment of good work', 'Offer to pair on complex changes rather than writing 30 comments'],
            commonMistakes: ['Only ever giving negative feedback, never positive', 'Comments that sound judgmental or condescending ("obviously this should be...")', 'Treating preferences as requirements without labeling them', 'Piling on dozens of comments on a single PR without prioritizing'],
            interviewTip: 'Name specific techniques: prefix system, questions over directives, and acknowledging good work. The signal interviewers want is that you can raise quality without damaging team morale.',
            followUp: ['How do you handle a team member who takes all review feedback personally?', 'How do you review code from a more senior engineer?', 'When should you take a review offline vs keep it in comments?'],
            seniorPerspective: 'I lead with a genuine positive comment on what I liked, then address the important issues as questions. The ratio matters: if every review from me is pure critique, people dread seeing my name on the reviewer list, which defeats the whole purpose.',
            architectPerspective: 'Review culture is architecture: a team where engineers avoid submitting code for fear of harsh review ships slower and takes fewer risks. I invest in making reviews psychologically safe because it directly enables the bold, iterative engineering I need from the team.'
        },
        {
            question: 'How do you handle a situation where a senior engineer disagrees with an architectural direction you\u2019ve set?',
            difficulty: 'expert',
            answer: `<p>This tests your ability to <strong>lead through influence, not authority</strong>, and to remain open to being wrong while still driving decisions forward.</p>
            <ul>
                <li><strong>Listen fully first</strong> — understand their objection in technical terms; they may see a risk you missed.</li>
                <li><strong>Separate the concern from the emotion</strong> — "I don't like it" may really be "this creates a maintenance burden in my area". Surface the real issue.</li>
                <li><strong>Revisit the decision criteria</strong> — if the original decision was data-driven (ADR), walk through the criteria together. If new information emerged, update the assessment.</li>
                <li><strong>Offer influence, not veto</strong> — let them propose an alternative that meets the same constraints. Often a middle path emerges.</li>
                <li><strong>Make the decision explicit</strong> — if you ultimately hold the direction after genuine consideration, explain why and ask for disagree-and-commit. Document the dissent in the ADR.</li>
                <li><strong>Follow up</strong> — after implementation, check if their concern materialized. Acknowledge it if they were right; this builds trust for next time.</li>
            </ul>`,
            explanation: 'It is like a pilot and co-pilot disagreeing on the approach: the captain listens to the concern, evaluates it seriously, and decides — but ignoring the co-pilot\u2019s valid warning has caused real crashes, so the process must genuinely incorporate dissent.',
            bestPractices: ['Genuinely listen and consider that you might be wrong', 'Surface the underlying concern behind the stated objection', 'Use the ADR criteria as an objective framework for evaluation', 'Document the dissent and the reasoning for the final call', 'Follow up post-implementation to validate the decision'],
            commonMistakes: ['Pulling rank: "I\u2019m the architect, we\u2019re doing it my way"', 'Avoiding the disagreement and hoping it resolves itself', 'Caving to every pushback and never making hard calls', 'Not following up, so the dissenter never feels heard'],
            interviewTip: 'Show that you genuinely incorporate dissent into your process and that you\u2019re willing to be wrong. The expert signal is holding a direction when justified while documenting dissent transparently.',
            followUp: ['What if the senior engineer undermines the decision after it\u2019s made?', 'How do you rebuild trust with someone whose proposal you overrode?', 'When should you reverse a decision based on new pushback?'],
            seniorPerspective: 'I have been wrong enough times that I take disagreement from strong engineers as a gift, not a threat. My rule: if I cannot articulate their objection back to them convincingly, I have not understood it well enough to override it.',
            architectPerspective: 'Architectural authority that cannot tolerate challenge is fragile architecture. I want engineers to push back, because the decisions that survive scrutiny are the ones teams actually commit to. My job is to facilitate the best decision, not to be right.'
        }
    ],
    extraSections: [
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Rubber-stamp code reviews</strong>: "LGTM" without reading the code. Reviews should catch design issues, not just typos.</li>
                <li><strong>Mentoring as telling</strong>: Giving answers instead of guiding discovery. Ask questions that lead the mentee to the solution.</li>
                <li><strong>Avoiding difficult conversations</strong>: Not giving honest feedback because it's uncomfortable. Kind honesty is kinder than polite silence.</li>
                <li><strong>Decision by committee</strong>: Seeking consensus on every technical decision. Some decisions need a single owner who decides and communicates.</li>
                <li><strong>Leading by authority</strong>: "Do it because I said so." Influence through explanation, evidence, and earned trust.</li>
                <li><strong>Micromanaging implementation</strong>: Specifying HOW instead of WHAT. Give the problem and constraints, let the team find the solution.</li>
                <li><strong>No written decisions</strong>: Verbal decisions get forgotten or disputed. Document decisions in ADRs or design docs.</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Code reviews: teach through reviews. Ask questions rather than demanding changes. Prioritize design over style.</li>
                <li>Mentoring: create growth opportunities (stretch tasks, pair programming, ownership of features). Don't just assign easy work.</li>
                <li>Conflict resolution: address directly and early. Focus on the problem, not the person. Find shared goals.</li>
                <li>Stakeholder management: translate technical constraints into business impact. Give options with trade-offs, not excuses.</li>
                <li>Decision making: decide quickly for reversible decisions. Invest time for irreversible ones. Document either way.</li>
                <li>Influence without authority: build trust through reliability, technical credibility, and genuine care for others' success.</li>
                <li>Delegation: delegate outcomes, not tasks. Provide context and constraints, not step-by-step instructions.</li>
            </ul>`
        }
    ]
});
