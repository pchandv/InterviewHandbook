/* ═══════════════════════════════════════════════════════════════════
   BEHAVIORAL INTERVIEWS — Level 16: Career & Interview Mastery
   STAR method, story preparation, leadership principles, handling
   conflict/failure questions, and authentic storytelling.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('behavioral-interviews', {

    title: 'Behavioral Interviews',
    level: 16,
    group: 'interview-prep',
    description: 'Mastering behavioral interviews: the STAR method, preparing a story bank, leadership principles, handling conflict/failure/ambiguity questions, and authentic, structured storytelling.',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    prerequisites: [],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Behavioral interviews</strong> assess how you've actually behaved in past situations as a
            predictor of future performance — your collaboration, leadership, conflict resolution, dealing with
            failure, and judgment. For senior roles they often carry as much weight as the technical rounds.</p>
            <p>The premise: "past behavior predicts future behavior." Interviewers ask for specific real examples
            ("Tell me about a time when...") and listen for how you think, act, and reflect.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>The STAR method for structuring answers</li>
                <li>Building a reusable story bank</li>
                <li>Common question themes and what they probe</li>
                <li>Handling conflict, failure, and ambiguity questions</li>
                <li>Authenticity, ownership, and reflection</li>
                <li>Common pitfalls that sink behavioral answers</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>STAR Method</h4>
            <p>The standard structure for behavioral answers: <strong>Situation</strong> (context),
            <strong>Task</strong> (your responsibility/goal), <strong>Action</strong> (what <em>you</em> specifically
            did), <strong>Result</strong> (the outcome, ideally quantified + what you learned).</p>
            <h4>Story Bank</h4>
            <p>A prepared set of 6-10 real stories from your experience, each tagged to themes (leadership, conflict,
            failure, impact) so you can adapt them to many questions instead of inventing on the spot.</p>
            <h4>Question Themes</h4>
            <p>Most behavioral questions map to a few themes: leadership/influence, conflict/disagreement, failure/
            mistakes, ambiguity/initiative, impact/delivery, and growth/feedback.</p>
            <h4>"I" vs "We"</h4>
            <p>Interviewers want <em>your</em> contribution. Describe the team context, but be clear about what
            <strong>you</strong> specifically did. Overusing "we" hides your role.</p>
            <h4>Authenticity &amp; Reflection</h4>
            <p>Real, specific stories beat polished generic ones. Showing what you learned (especially from failures)
            demonstrates growth and self-awareness.</p>
            <h4>Leadership Principles</h4>
            <p>Many companies (notably Amazon) map behavioral questions to explicit principles (ownership, bias for
            action, customer obsession). Knowing the target company's values helps you choose relevant stories.</p>`,
            mermaid: `flowchart LR
    Q[Behavioral question] --> S[Situation: brief context]
    S --> T[Task: your goal/responsibility]
    T --> A[Action: what YOU did - the bulk]
    A --> R[Result: outcome + what you learned]
    style A fill:#bbf7d0,color:#1e293b`
        },
        {
            title: 'How It Works',
            content: `<p>Preparing for and answering behavioral questions:</p>
            <ol>
                <li><strong>Build a story bank:</strong> list 6-10 significant experiences (a hard project, a
                conflict, a failure, a leadership moment) and write each in STAR form.</li>
                <li><strong>Tag stories to themes:</strong> one strong story often covers multiple questions
                (leadership + conflict + impact).</li>
                <li><strong>Research the company's values:</strong> map your stories to their leadership principles.</li>
                <li><strong>In the interview, listen for the theme</strong> and pick the best-fitting story.</li>
                <li><strong>Answer in STAR</strong>, spending most time on <em>your</em> Action and the Result.</li>
                <li><strong>Reflect:</strong> end with the outcome and what you learned/would do differently.</li>
            </ol>`,
            code: `// A STAR answer skeleton (keep S and T brief; A is the bulk; R quantified)
//
// Q: "Tell me about a time you dealt with a difficult technical disagreement."
//
// Situation (15s): "Two senior engineers on my team disagreed on whether to
//   adopt event sourcing for a new billing service; it stalled the design."
// Task (10s): "As tech lead, I needed to get us to a decision the team would
//   commit to, without one side feeling steamrolled."
// Action (bulk): "I had each present their case with data; I reframed it
//   around our actual requirements (auditability + team familiarity); I ran a
//   small spike to test the riskiest assumption; I documented the decision and
//   trade-offs in an ADR so the rationale was clear..."
// Result: "We chose the simpler approach, shipped on time, and the dissenting
//   engineer told me he felt heard. I learned to defuse disagreement with data
//   and a spike rather than debate."`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>One story, mapped to multiple question themes (the power of a good story bank):</p>`,
            mermaid: `flowchart TB
    Story[A hard cross-team launch story] --> Lead[Q: leadership]
    Story --> Conflict[Q: disagreement]
    Story --> Ambiguity[Q: ambiguity/initiative]
    Story --> Impact[Q: biggest impact]
    Story --> Fail[Q: what went wrong/learned]
    style Story fill:#bbf7d0,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Story-bank planning and theme-to-story mapping:</p>`,
            tabs: [
                {
                    label: 'Story Bank Template',
                    code: `// Prepare 6-10 stories; write each in STAR. Tag with themes it covers.
//
// Story: "Rescued the failing payments migration"
//   Situation: migration 3 weeks behind, exec pressure, team morale low
//   Task: as senior eng, get it back on track without burning out the team
//   Action: re-scoped to a phased rollout; cut non-critical scope; paired
//     with two engineers on the riskiest module; set up daily 10-min syncs;
//     communicated a realistic new date to stakeholders
//   Result: shipped phase 1 in 2 weeks; full migration 1 week late (vs 3+);
//     zero incidents; learned to phase risky work + communicate early
//   Themes: leadership, delivery under pressure, stakeholder mgmt, scoping
//
// Aim for stories covering: leadership, conflict, failure, ambiguity,
// impact, mentoring/feedback.`,
                    language: 'csharp'
                },
                {
                    label: 'Theme -> Story Map',
                    code: `// Map common question themes to your prepared stories so you can pick fast.
//
// Leadership/influence  -> [payments rescue], [cross-team API alignment]
// Conflict/disagreement -> [event-sourcing debate], [PR review standoff]
// Failure/mistake       -> [outage I caused], [missed deadline]
// Ambiguity/initiative  -> [undefined project I shaped], [found+fixed gap]
// Impact/delivery       -> [latency win], [payments rescue]
// Mentoring/feedback    -> [grew a junior], [hard feedback I gave]
//
// In the interview: identify the theme -> pick the best-fitting story.
// One strong story can answer several themes from different angles.`,
                    language: 'csharp'
                },
                {
                    label: 'Failure Question',
                    code: `// "Tell me about a time you failed." - they want OWNERSHIP + LEARNING.
//
// DO: pick a real, meaningful failure where you had genuine responsibility.
//   - Own your part honestly (no "my only flaw is perfectionism")
//   - Explain what you learned and how you APPLIED it later
//   - Show the system change you made so it wouldn't recur
//
// DON'T: blame others, pick a trivial/fake failure, or a humble-brag.
//
// Example close: "...I shipped without enough test coverage and caused an
//   outage. I owned it in the postmortem, added the missing tests, and
//   pushed our team to adopt a coverage gate. We never had that class of
//   bug again. It taught me to treat testing as part of 'done'."`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Use STAR, Emphasize Your Action</h4>
            <p>Structure every answer; keep Situation/Task brief and spend the most time on what <em>you</em> did and
            the result. The Action is where your competency shows.</p>
            <h4>Do: Prepare a Story Bank</h4>
            <p>Have 6-10 real stories ready in STAR form, tagged to themes, so you adapt rather than improvise under
            pressure.</p>
            <h4>Do: Quantify Results</h4>
            <p>Concrete outcomes ("cut latency 40%", "shipped 2 weeks early", "reduced incidents by half") are far
            more convincing than vague "it went well".</p>
            <h4>Do: Say "I" for Your Contribution</h4>
            <p>Credit the team, but be explicit about your specific role and decisions. Interviewers are evaluating
            <em>you</em>.</p>
            <h4>Do: Show Reflection and Growth</h4>
            <p>End with what you learned or would do differently — especially for failure/conflict questions.
            Self-awareness is a strong positive signal.</p>
            <h4>Do: Research the Company's Values</h4>
            <p>Map your stories to the company's leadership principles/values so your examples land as relevant.</p>`,
            callout: {
                type: 'tip',
                title: 'Spend 60% on Action',
                text: 'A common mistake is spending most of the answer setting up the Situation. Keep S and T to ~15-20 seconds combined; spend the bulk on YOUR specific Actions and the Result. The Action is what the interviewer is actually evaluating \u2014 it is where your skills and judgment show.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Rambling Without Structure</h4>
            <p>Meandering, context-heavy answers that never reach the point. Use STAR to stay crisp and land the
            result.</p>
            <h4>Mistake: Overusing "We"</h4>
            <p>Describing what the team did without isolating your contribution. The interviewer can't assess you if
            "we" did everything.</p>
            <h4>Mistake: Vague, Generic Stories</h4>
            <p>Hypothetical or abstract answers ("I always communicate well") instead of a specific real example.
            Specificity is credibility.</p>
            <h4>Mistake: No Real Failure</h4>
            <p>Picking a fake/trivial failure or a humble-brag ("I work too hard"). Interviewers see through it; they
            want genuine ownership and learning.</p>
            <h4>Mistake: Blaming Others</h4>
            <p>Framing conflict/failure as someone else's fault signals poor ownership and self-awareness. Own your
            part.</p>
            <h4>Mistake: No Reflection</h4>
            <p>Ending at "and it worked out" without what you learned. The reflection is often what most impresses.</p>`,
            code: `// WEAK (vague, all "we", no result, no reflection):
// "We had some issues on a project but we worked together and figured it out
//  and it was fine in the end."  <- tells the interviewer nothing about YOU.
//
// STRONG (STAR, "I", quantified, reflective):
// "Our release was slipping (S). As tech lead I owned getting us back on
//  track (T). I re-scoped to a phased rollout, paired on the risky module,
//  and reset stakeholder expectations with a realistic date (A). We shipped
//  phase 1 in two weeks with zero incidents (R); I learned to phase risky
//  work and communicate early."`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Leadership-Principle Interviews</h4>
            <p>Amazon's bar-raiser process maps questions directly to its 16 Leadership Principles; candidates prepare
            STAR stories tagged to each. Many companies have adopted similar values-based behavioral loops.</p>
            <h4>Senior &amp; Management Loops</h4>
            <p>For senior/staff/EM roles, behavioral rounds probe leadership, conflict, influence, and judgment as
            heavily as technical skill — sometimes decisively.</p>
            <h4>Hiring-Manager &amp; Team-Fit Rounds</h4>
            <p>These assess collaboration, communication, and how you'd operate on the team — behavioral storytelling
            is the primary signal.</p>
            <h4>Real Workplace Value</h4>
            <p>The reflection the prep forces — articulating your impact, lessons, and growth — is also genuinely
            useful for performance reviews, promotions, and self-development.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>What common question themes are really probing, and which story to bring:</p>`,
            table: {
                headers: ['Question theme', 'What they assess', 'Bring a story showing'],
                rows: [
                    ['"Time you led..."', 'Leadership/influence', 'Driving an outcome through others'],
                    ['"Disagreement with..."', 'Conflict resolution', 'Data-driven, respectful resolution'],
                    ['"Time you failed..."', 'Ownership + growth', 'Honest ownership + applied learning'],
                    ['"Ambiguous situation..."', 'Initiative/judgment', 'Bringing clarity, taking action'],
                    ['"Biggest impact..."', 'Delivery/results', 'Quantified, meaningful outcome'],
                    ['"Hard feedback..."', 'Self-awareness/EQ', 'Receiving/giving feedback well']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Behavioral interview "performance" is about signal clarity and authenticity:</p>
            <h4>Structure Aids Recall and Impact</h4>
            <p>STAR keeps you concise and ensures you deliver the result — interviewers rate structured, complete
            answers higher than rambling ones with the same underlying story.</p>
            <h4>Specificity = Credibility</h4>
            <p>Concrete names, numbers, and decisions signal a real experience; vague generalities read as fabricated
            or shallow.</p>
            <h4>Calibrate to Level</h4>
            <p>Senior candidates should show scope and influence (cross-team, mentoring, ambiguity); junior candidates
            show learning and collaboration. Mismatched scope hurts.</p>
            <h4>Practice Out Loud</h4>
            <p>Rehearsing answers aloud (mock interviews) dramatically improves delivery, timing, and confidence —
            silent prep is far less effective.</p>`,
            callout: {
                type: 'info',
                title: 'Authenticity Beats Polish',
                text: 'Over-rehearsed, scripted answers can sound hollow and fall apart under follow-up questions. Know your stories well, but tell them naturally and be ready to go deeper when probed. Genuine ownership and reflection land better than a memorized monologue.'
            }
        },
        {
            title: 'Testing',
            content: `<p>You "test" behavioral readiness through realistic practice and feedback.</p>
            <h4>Mock Interviews</h4>
            <p>Practice with a peer or mentor who asks real behavioral questions and probes with follow-ups. This
            surfaces rambling, weak results, and "we" overuse you can't see yourself.</p>
            <h4>Record and Review</h4>
            <p>Record your answers; listen for structure (STAR), length (too long?), specificity, and whether the
            result and learning came through.</p>
            <h4>Stress-Test with Follow-ups</h4>
            <p>Have someone drill into a story ("what would you do differently?", "what was the hardest part?") to
            ensure it holds up beyond the rehearsed version.</p>`,
            code: `// Self-review checklist after a practice answer:
// [ ] Used STAR structure (didn't ramble)?
// [ ] Situation/Task brief; most time on MY actions + result?
// [ ] Said "I" for my contribution (not all "we")?
// [ ] Result quantified / concrete?
// [ ] Ended with a reflection / lesson learned?
// [ ] Story is REAL and specific (names, numbers, decisions)?
// [ ] Holds up under "what would you do differently?" follow-up?
//
// Run mock interviews until these are automatic.`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Meta-tips for the behavioral round itself:</p>
            <ul>
                <li><strong>Prepare a story bank</strong> (6-10 STAR stories) tagged to themes before the interview</li>
                <li><strong>Listen for the theme,</strong> then pick the best-fitting story</li>
                <li><strong>Answer in STAR, 60% on your Action;</strong> quantify the Result</li>
                <li><strong>Own failures honestly</strong> and show what you learned</li>
                <li><strong>Research the company's values/principles</strong> and map stories to them</li>
                <li><strong>Practice out loud</strong> and handle follow-up probes</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Have a Genuine Failure Story Ready',
                text: 'The "tell me about a failure" question trips up many candidates. Prepare a real, meaningful failure where you had genuine responsibility, own your part without blaming others, and \u2014 most importantly \u2014 show the concrete lesson you learned and applied afterward. Ownership + growth is exactly what they\u2019re looking for.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Resources</h4>
            <ul>
                <li>Amazon Leadership Principles (amazon.jobs) — the canonical principle-based framework</li>
                <li><em>Cracking the Coding Interview</em> by Gayle Laakmann McDowell — behavioral chapter</li>
                <li><em>The STAR Method</em> guides and company-specific interview prep resources</li>
                <li>Levels.fyi / Glassdoor — company-specific behavioral question banks</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Behavioral interviews</strong> use past behavior to predict future performance</li>
                <li><strong>STAR:</strong> Situation, Task, Action (the bulk), Result + reflection</li>
                <li><strong>Prepare a story bank</strong> (6-10 stories) tagged to themes; one story covers many questions</li>
                <li><strong>Say "I"</strong> for your contribution; <strong>quantify results</strong></li>
                <li><strong>Own failures honestly</strong> and show applied learning</li>
                <li><strong>Research company values</strong> and map stories to them</li>
                <li><strong>Authenticity beats polish;</strong> practice out loud and survive follow-ups</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Build Your Story Bank</h4>
            <ol>
                <li>List 8 significant experiences (a hard project, conflict, failure, leadership moment, ambiguous
                situation, big impact, mentoring, hard feedback)</li>
                <li>Write each in STAR form, keeping Situation/Task brief and detailing your Actions</li>
                <li>Quantify each Result and add a one-line reflection (what you learned)</li>
                <li>Tag each story with the question themes it can answer</li>
                <li>Map them to a target company's leadership principles/values</li>
                <li>Do a mock interview: have someone ask 5 questions and probe with follow-ups; refine</li>
            </ol>`,
            code: `// For each story:
//   Title | Situation (1-2 lines) | Task | Actions (3-5 bullets, YOU) |
//   Result (quantified) | Lesson | Themes covered
//
// Target ~8 stories spanning: leadership, conflict, failure, ambiguity,
// impact, mentoring, feedback. Then mock-interview and iterate on delivery.`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What does STAR stand for and where should most of your answer go?<br/>
                    <em>A: Situation, Task, Action, Result. Keep Situation/Task brief and spend most of the answer on your
                    specific Actions (and the Result), since that's what the interviewer is assessing.</em></li>
                <li><strong>Q:</strong> Why prepare a "story bank"?<br/>
                    <em>A: So you can adapt prepared, real STAR stories to many questions instead of improvising under
                    pressure. One strong story often covers several themes (leadership, conflict, impact).</em></li>
                <li><strong>Q:</strong> Why avoid overusing "we" in your answers?<br/>
                    <em>A: The interviewer is evaluating YOU. Credit the team for context, but be explicit about your
                    specific role, decisions, and actions \u2014 otherwise your contribution is invisible.</em></li>
                <li><strong>Q:</strong> What are interviewers really looking for in a "tell me about a failure" answer?<br/>
                    <em>A: Genuine ownership (no blaming, no fake/trivial failure) and growth \u2014 a real lesson you learned
                    and applied afterward, ideally a change you made so it wouldn't recur.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'What is the STAR method and why is it effective for behavioral questions?',
            difficulty: 'easy',
            answer: `<p><strong>STAR</strong> structures a behavioral answer into four parts: <strong>Situation</strong>
            (brief context), <strong>Task</strong> (your responsibility/goal), <strong>Action</strong> (what you
            specifically did — the bulk of the answer), and <strong>Result</strong> (the outcome, ideally quantified,
            plus what you learned).</p>
            <p>It's effective because it keeps you concise and complete: you set just enough context, focus on your
            own contribution, and always deliver a concrete result — which is exactly the signal interviewers are
            scoring. It prevents the most common failure modes: rambling and never reaching the point.</p>`,
            explanation: 'STAR is like a good news report: it quickly tells you where and when (situation), what was at stake (task), what was done (action), and the outcome (result) \u2014 no wandering, no missing the headline.',
            bestPractices: ['Keep Situation/Task brief', 'Spend ~60% on your Actions', 'Quantify the Result', 'Add a one-line reflection/lesson'],
            commonMistakes: ['Over-investing in the Situation', 'Forgetting to state the result', 'Saying "we" instead of "I"'],
            interviewTip: 'Name the four letters and immediately note that Action should be the bulk — that detail signals you actually use it well.',
            followUp: ['How long should a STAR answer be?', 'How do you handle a follow-up that probes deeper?']
        },
        {
            question: 'How do you answer "tell me about a time you failed" effectively?',
            difficulty: 'medium',
            answer: `<p>Pick a <strong>real, meaningful failure</strong> where you had genuine responsibility — not a
            trivial one or a humble-brag ("I care too much"). Then, in STAR form: briefly set the context, explain
            what went wrong and <strong>own your part honestly</strong> (without blaming others), and — most
            importantly — describe <strong>what you learned and how you applied it</strong> afterward, ideally a
            concrete change you made so it wouldn't recur.</p>
            <p>The question isn't really about the failure; it's testing self-awareness, ownership, and growth.
            Demonstrating those turns a failure story into a strong positive signal.</p>`,
            explanation: 'Interviewers aren\u2019t looking for someone who never fails (no one believes that) \u2014 they\u2019re looking for someone who fails, owns it, and gets better. The story is a vehicle to show that resilience and learning.',
            code: `// Structure:
// S/T: brief - what you owned and what was at stake
// A:   what went wrong + YOUR honest part in it (no blame-shifting)
// R:   impact, then the LESSON + the change you made so it didn't recur
//
// e.g., "I shipped without enough tests and caused an outage. I owned it in
//  the postmortem, added the tests, and pushed for a coverage gate. We never
//  saw that bug class again."`,
            language: 'csharp',
            bestPractices: ['Choose a real failure with genuine ownership', 'Own your part without blaming', 'Emphasize the applied lesson / systemic fix', 'Keep it concise and reflective'],
            commonMistakes: ['Fake/trivial failure or humble-brag', 'Blaming others or circumstances', 'No lesson learned', 'A failure with no real stakes/ownership'],
            interviewTip: 'Have one genuine failure story ready in advance. The differentiator is the applied lesson — show the concrete change you made afterward.',
            followUp: ['What would you do differently now?', 'How did you rebuild trust after that?']
        },
        {
            question: 'How would you answer a question about a conflict or disagreement with a coworker?',
            difficulty: 'hard',
            answer: `<p>The goal is to show <strong>mature, respectful, outcome-focused</strong> conflict resolution — not
            that you "won." In STAR:</p>
            <ul>
                <li><strong>Situation/Task:</strong> briefly set up a genuine, substantive disagreement (ideally
                technical/professional, not petty) and your role in resolving it.</li>
                <li><strong>Action:</strong> emphasize that you <em>sought to understand</em> the other view first
                (steelman it), grounded the discussion in <em>data and shared goals</em> rather than ego, looked for
                common ground, and used an objective tie-breaker where possible (a spike, the requirements, a
                decision owner). Show you separated the person from the problem.</li>
                <li><strong>Result:</strong> a decision the team could commit to, a preserved (ideally strengthened)
                relationship, and what you learned about handling disagreement.</li>
            </ul>
            <p>Crucially: be willing to show a case where you <em>changed your mind</em> given better evidence, or
            where you disagreed and then committed. Insisting you were right and "won" reads as poor collaboration.</p>`,
            explanation: 'Interviewers aren\u2019t scoring who was technically correct \u2014 they\u2019re scoring whether you can disagree productively, keep relationships intact, and get the team to a good decision. The best stories often show you genuinely considering (or adopting) the other view.',
            bestPractices: ['Pick a substantive, professional disagreement', 'Show you sought to understand the other view first', 'Ground it in data and shared goals, not ego', 'Use an objective tie-breaker (spike/requirements/owner)', 'Show commitment to the final decision + relationship preserved'],
            commonMistakes: ['Framing it as "I was right and won"', 'Making the coworker the villain', 'A petty/personal conflict', 'No resolution or no relationship outcome'],
            interviewTip: 'Choose a story where the outcome was a good team decision and a maintained relationship \u2014 bonus if you changed your mind on evidence. That signals collaboration over ego.',
            followUp: ['Tell me about a time you were wrong in a disagreement.', 'How did the relationship evolve afterward?', 'What if the other person still disagreed after the decision?'],
            seniorPerspective: 'The trap in conflict questions is telling a story where you "won," because that actually reveals ego, not maturity. My strongest conflict stories are ones where I genuinely tried to understand the other position, grounded the debate in our real requirements and a quick spike rather than opinion, and sometimes changed my own mind \u2014 or disagreed and then committed wholeheartedly. What interviewers (and real teams) value is someone who can separate the person from the problem, drive to a decision the group will support, and keep the working relationship strong afterward. "I was right" is a weak ending; "we made a good decision together and still trust each other" is a strong one.'
        }
    ,
        {
            question: 'How do you structure an answer to a behavioral question using the STAR method?',
            difficulty: 'medium',
            answer: `<p><strong>STAR</strong> = Situation, Task, Action, Result. It turns a rambling anecdote into a tight, evaluable story.</p>
            <ul>
                <li><strong>Situation</strong> \u2014 brief context (1\u20132 sentences); set the stage, don't dwell.</li>
                <li><strong>Task</strong> \u2014 your specific responsibility or the problem you owned.</li>
                <li><strong>Action</strong> \u2014 what <em>you</em> did (the bulk of the answer; use "I", not "we").</li>
                <li><strong>Result</strong> \u2014 the outcome, quantified where possible, plus what you learned.</li>
            </ul>
            <p>Spend most of your time on Action and Result \u2014 that is where signal lives.</p>`,
            explanation: 'STAR is the three-act structure for a work story: quick setup, clear stakes, the things you personally did, and how it ended. Without it, answers wander and the interviewer can\u2019t tell what you actually contributed.',
            bestPractices: ['Keep Situation/Task brief; spend most time on Action and Result', 'Use "I" to make your individual contribution clear', 'Quantify the Result (metrics, impact) whenever possible', 'End with a brief reflection/learning'],
            commonMistakes: ['Over-explaining the situation and running out of time for actions', 'Saying "we" throughout so your role is invisible', 'No result/impact, leaving the story unresolved', 'Rambling without structure'],
            interviewTip: 'Practice 6\u20138 STAR stories that each flex to multiple questions. The most common failure is too much Situation and too little Action \u2014 weight your time accordingly.',
            followUp: ['How many stories should you prepare?', 'How do you handle a question you have no story for?', 'How do you quantify results in a non-metric role?'],
            seniorPerspective: 'I keep a "story bank" of 6\u20138 real situations covering conflict, failure, leadership, and impact, each rehearsed in STAR. Most behavioral questions map onto one of them, so I am never improvising from scratch.',
            architectPerspective: 'At senior levels, behavioral answers are evaluated for scope and judgment: did you influence beyond your team, navigate ambiguity, and own outcomes. Pick stories that demonstrate breadth of impact, not just task completion.'
        },
        {
            question: 'How should you answer "tell me about a time you failed" without hurting yourself?',
            difficulty: 'medium',
            answer: `<p>Pick a <strong>real, genuine failure</strong> with real stakes, take clear ownership, and focus on the learning and change that followed. Interviewers are testing self-awareness, accountability, and growth \u2014 not whether you are flawless.</p>
            <ul>
                <li><strong>Own it</strong> \u2014 your role in the failure, no blaming others or external forces.</li>
                <li><strong>Real stakes</strong> \u2014 a genuine failure, not a humblebrag ("I work too hard").</li>
                <li><strong>The lesson + change</strong> \u2014 what you learned and the concrete behavior change, ideally with evidence it stuck.</li>
                <li><strong>Don't dwell</strong> \u2014 enough detail to be credible, then pivot to growth.</li>
            </ul>`,
            explanation: 'It is like a blameless postmortem about yourself: state honestly what went wrong and your part in it, then focus on the fix that ensures it does not happen again. Pretending you have never failed is the real red flag.',
            bestPractices: ['Choose a genuine failure with real consequences', 'Take clear personal ownership without blaming others', 'Emphasize the lesson and the behavior change that followed', 'Show evidence the change stuck (a later success)'],
            commonMistakes: ['Fake failures / humblebrags ("too much of a perfectionist")', 'Blaming the team, manager, or circumstances', 'Dwelling on the failure with no growth arc', 'Picking something catastrophic and unredeemed'],
            interviewTip: 'The trap is the humblebrag \u2014 it signals low self-awareness. A real, owned failure with a concrete lesson scores far higher than a fake weakness.',
            followUp: ['How candid should you be about a serious failure?', 'How do you frame a failure that was partly others\u2019 fault?', 'What if the lesson was "trust my instincts more"?'],
            seniorPerspective: 'I pick a failure where I genuinely owned a bad call, because the interviewer is reading for accountability. Showing I can name my own mistake and what changed afterward signals exactly the maturity senior roles require.',
            architectPerspective: 'How someone narrates failure predicts how they will run postmortems and lead under pressure. I want to hear blameless, systems-aware reflection applied to themselves \u2014 it is the same muscle that makes a healthy incident culture.'
        },
        {
            question: 'How do you demonstrate leadership in behavioral answers when you were not the manager?',
            difficulty: 'hard',
            answer: `<p>Leadership is about <strong>influence and ownership</strong>, not title. Choose stories where you drove an outcome through others without authority.</p>
            <ul>
                <li><strong>Initiative</strong> \u2014 you saw a problem and owned it rather than waiting to be assigned.</li>
                <li><strong>Influence</strong> \u2014 you aligned peers/stakeholders, built consensus, or drove a decision.</li>
                <li><strong>Force-multiplying</strong> \u2014 you improved the team (mentoring, unblocking others, raising standards), not just your own output.</li>
                <li><strong>Use "I" for your actions, "we" for outcomes</strong> \u2014 own your contribution while crediting the team.</li>
            </ul>`,
            explanation: 'Leadership signal is the engineer who, with no title, notices the team keeps tripping over the same problem, rallies people to fix it, and leaves the team better \u2014 versus one who just closes their own tickets.',
            bestPractices: ['Pick stories of influence/ownership without formal authority', 'Show you multiplied others (mentoring, unblocking, standards)', 'Balance "I" (your actions) with "we" (shared outcome)', 'Highlight initiative \u2014 acting before being told to'],
            commonMistakes: ['Equating leadership with having direct reports', 'Only individual-contribution stories with no team impact', 'Taking all the credit ("we" never appears)', 'Vague claims of "leading" with no concrete actions'],
            interviewTip: 'Define leadership as influence + ownership + force-multiplying, then pick a no-authority story. This is exactly the signal interviewers want for senior/staff IC tracks.',
            followUp: ['What is the difference between IC leadership and management?', 'How do you show staff-level scope without a title?', 'How do you credit the team while showing your role?'],
            seniorPerspective: 'My strongest leadership stories have no org-chart authority in them \u2014 just me seeing a gap, taking ownership, and pulling people along. That demonstrates the influence that senior and staff roles are actually built on.',
            architectPerspective: 'Technical leadership scales through others: setting direction, raising the bar, and unblocking teams. Behavioral answers that show force-multiplying impact map directly onto the scope expected at principal/architect levels.'
        },
        {
            question: 'How do you structure an answer to "Tell me about a time you failed" without sounding incompetent?',
            difficulty: 'hard',
            answer: `<p>The key is a <strong>four-part arc: real failure → clear ownership → concrete lesson → evidence of change</strong>. This demonstrates self-awareness and growth without undermining confidence in your abilities.</p>
            <ul>
                <li><strong>Pick a genuine, bounded failure</strong> — real stakes, real consequences, but not catastrophic. Avoid career-ending disasters and humblebrags equally.</li>
                <li><strong>Own your specific role clearly</strong> — "I underestimated the integration complexity" not "the timeline was unrealistic." Use "I", take the hit directly.</li>
                <li><strong>Articulate the specific lesson</strong> — what did you learn about yourself, your process, or your judgment? Be concrete: "I learned to spike unknowns before estimating."</li>
                <li><strong>Show the behavioral change stuck</strong> — describe a later situation where you applied the lesson successfully. This closes the narrative arc and proves growth.</li>
                <li><strong>Keep it proportional</strong> — 20% on the failure, 80% on the learning and the changed behavior.</li>
            </ul>
            <p>The goal is: "I am someone who fails forward — I learn, change, and improve." That is <em>more</em> impressive than pretending to be flawless.</p>`,
            explanation: 'It is like a surgeon explaining a complication: they describe what happened factually, what they learned about their technique, and what they changed in their protocol. This builds trust because the patient knows the doctor will not make that error again — compared to one who claims they never have complications (unbelievable and frightening).',
            bestPractices: ['Choose a real failure with meaningful stakes — not a humblebrag', 'Take direct ownership using "I" — no blaming external factors', 'Spend most time on the lesson and the behavioral change, not the disaster itself', 'Show evidence the change stuck with a later success story', 'Practice the story so it sounds reflective, not rehearsed or defensive'],
            commonMistakes: ['Humblebrag failures ("I worked too hard") that signal low self-awareness', 'Blaming others or circumstances while pretending to own it', 'No growth arc — just describing the failure with no lesson or change', 'Picking something so catastrophic it raises red flags about judgment', 'Spending too long on the failure details and running out of time for the lesson'],
            interviewTip: 'Rehearse so your ratio is 20% failure / 80% lesson + change. The strongest signal is a later example where the lesson was applied — it proves the growth was real and durable.',
            followUp: ['How many failure stories should you prepare?', 'How do you handle follow-up probing about the failure?', 'What if the failure involved others — how do you own your part without throwing them under the bus?'],
            seniorPerspective: 'I pick a failure where my judgment was wrong — not an execution mistake, but a decision mistake. At senior level, interviewers care about judgment. Showing you can identify and correct a bad strategic call is exactly the maturity signal they want.',
            architectPerspective: 'I look for candidates whose failure stories reveal systems thinking: not just "I made a bug" but "I designed a system that lacked a feedback loop, and here is how I now design for observability." That shows the failure created lasting architectural intuition, not just a surface-level patch.'
        },
        {
            question: 'How do you demonstrate leadership impact when you\u2019ve been an IC (individual contributor)?',
            difficulty: 'hard',
            answer: `<p>IC leadership is about <strong>influence, force-multiplication, and ownership of outcomes that extend beyond your own code</strong>. You demonstrate it by choosing stories that show you made others and the system better.</p>
            <ul>
                <li><strong>Multiplied others</strong> — mentored engineers, raised review quality, established standards or tooling that improved the whole team\u2019s output.</li>
                <li><strong>Drove cross-cutting initiatives</strong> — identified a systemic problem (performance, reliability, developer experience) and drove the fix across teams without being told to.</li>
                <li><strong>Made decisions under ambiguity</strong> — took ownership of an unclear problem, scoped it, chose an approach, and drove it to completion without waiting for a manager to define it.</li>
                <li><strong>Influenced direction</strong> — proposed an architectural direction through an RFC or design doc, built consensus, and saw it adopted. Leadership without authority.</li>
                <li><strong>Operated at the next scope level</strong> — show impact beyond your immediate team: unblocking other teams, improving shared infrastructure, or setting technical direction for a product area.</li>
            </ul>
            <p>Frame every story with the <strong>scope axis</strong>: task → feature → system → team → org. IC leadership stories should show system-or-above scope impact.</p>`,
            explanation: 'An IC leader is like a player-coach in sports: they are on the field performing, but they also elevate everyone around them — calling plays, setting the tempo, mentoring rookies, and improving how the team practices. The scorecard is not just their personal stats but the team\u2019s performance.',
            bestPractices: ['Choose stories that show impact beyond your own code output', 'Emphasize force-multiplying: mentoring, tooling, standards that raised the whole team', 'Show initiative — you identified and drove solutions to problems nobody assigned', 'Use the scope framework (task → feature → system → team → org) to show breadth', 'Balance "I" (your actions) with "we" (team outcomes you enabled)'],
            commonMistakes: ['Only telling stories of personal technical achievement with no team impact', 'Equating leadership with managing people (it is about influence and ownership)', 'Vague claims of "leading" without concrete actions or measurable outcomes', 'Not articulating the scope — the interviewer needs to see beyond-team impact'],
            interviewTip: 'Define IC leadership as "influence + ownership + force-multiplication at system-or-above scope." Then give a concrete example of each. This maps directly to staff/principal leveling criteria.',
            followUp: ['What is the difference between IC leadership and people management?', 'How do you quantify force-multiplying impact?', 'How do you get credit for enabling work that others delivered?'],
            seniorPerspective: 'My best IC leadership story is always one where no one told me to do it: I saw the team hitting the same problem repeatedly, proposed a solution (RFC), built consensus, and delivered it. That ownership without authority is exactly what "staff-level" means in practice.',
            architectPerspective: 'At the architect level, every impactful thing you do is IC leadership — you set direction, multiply teams, and own outcomes through influence. The behavioral interview is checking whether you already operate this way, because the role is 80% influence and 20% hands-on. Stories must show organizational-scope impact.'
        }
    ]
});
