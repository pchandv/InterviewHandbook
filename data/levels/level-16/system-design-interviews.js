/* ═══════════════════════════════════════════════════════════════════
   SYSTEM DESIGN INTERVIEWS — Level 16: Career & Interview Mastery
   How to perform in the design round: structure, communication,
   whiteboarding, time management, and level-appropriate depth.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('system-design-interviews', {

    title: 'System Design Interviews',
    level: 16,
    group: 'interview-prep',
    description: 'Performing in the system design round: structured approach, driving the conversation, whiteboarding, time management, depth vs breadth, and what interviewers actually score.',
    difficulty: 'advanced',
    estimatedMinutes: 35,
    prerequisites: ['sd-framework'],

    sections: [

        {
            title: 'Introduction',
            content: `<p>The <strong>system design interview</strong> is an open-ended round where you design a
            large-scale system from a vague prompt. It is less about a "correct" answer and more about how you
            think, communicate, structure ambiguity, and reason about trade-offs. This module focuses on
            <em>interview performance</em> — the meta-skills — building on the design framework from Level 13.</p>
            <p>Strong candidates treat it as a collaborative design conversation, driving structure while adapting to
            the interviewer's signals.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>How the round is scored (what interviewers look for)</li>
                <li>Driving the conversation with a structured approach</li>
                <li>Time management across the round</li>
                <li>Depth vs breadth and level-appropriate signals</li>
                <li>Whiteboarding and thinking out loud</li>
                <li>Common performance pitfalls</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>It's a Conversation, Not a Monologue</h4>
            <p>The interviewer is a collaborator. Check in, ask clarifying questions, and respond to their nudges —
            they often steer you toward what they want to assess.</p>
            <h4>Structure Beats Brilliance</h4>
            <p>A clear, methodical approach (requirements -> estimate -> design -> deep dive -> trade-offs) signals
            more than scattered clever ideas. Structure is itself a scored competency.</p>
            <h4>Think Out Loud</h4>
            <p>Your reasoning is the product. Narrate assumptions, options, and why you choose one — silent designing
            denies the interviewer the signal they need.</p>
            <h4>Depth vs Breadth</h4>
            <p>Cover the whole system at a high level (breadth), then go deep on 1-2 critical components (depth).
            Senior candidates are expected to go deeper and discuss more trade-offs.</p>
            <h4>Trade-offs Over Absolutes</h4>
            <p>There's rarely one right answer. Present options, state the trade-offs, make a decision, and justify
            it. "It depends, and here's on what" is a strong stance.</p>
            <h4>Level-Appropriate Signals</h4>
            <p>Juniors: solid fundamentals and a working design. Senior/staff: scale, failure modes, trade-offs,
            operational concerns, and driving the conversation independently.</p>`,
            mermaid: `flowchart LR
    Prompt[Vague prompt] --> Clarify[Clarify + scope - drive it]
    Clarify --> Structure[Structured approach]
    Structure --> Narrate[Think out loud]
    Narrate --> Tradeoffs[Trade-offs + decisions]
    Tradeoffs --> Signal[Strong hire signal]
    style Signal fill:#bbf7d0,color:#1e293b`
        },
        {
            title: 'How It Works',
            content: `<p>A typical 45-minute round, with rough time budget:</p>
            <ol>
                <li><strong>Clarify requirements (~5 min):</strong> ask questions, scope functional + non-functional
                needs, state assumptions. Drive this — don't wait.</li>
                <li><strong>Estimate (~5 min):</strong> rough QPS/storage to justify later decisions.</li>
                <li><strong>High-level design (~10 min):</strong> draw the major components and data flow; get a
                working end-to-end design on the board.</li>
                <li><strong>Deep dive (~15 min):</strong> go deep where the interviewer steers, or on the
                bottleneck/most interesting component.</li>
                <li><strong>Trade-offs, scaling, wrap-up (~10 min):</strong> discuss failure modes, bottlenecks at
                10x, and alternatives.</li>
            </ol>
            <p>Throughout: narrate, check in ("does this direction make sense?"), and adapt to the interviewer's
            interests.</p>`,
            code: `// Time-box a 45-min round (adapt as the interviewer steers):
//   ~5m  Requirements + scope (ask, assume, confirm)
//   ~5m  Estimation (QPS, storage -> justifies caching/sharding)
//   ~10m High-level design (working end-to-end on the board)
//   ~15m Deep dive (the bottleneck or where they nudge you)
//   ~10m Trade-offs, failure modes, 10x scaling, wrap-up
//
// Watch the clock. Spending 20m on requirements means you never reach the
// deep dive - exactly where senior signal is demonstrated.`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Breadth first, then targeted depth — the shape of a strong round:</p>`,
            mermaid: `flowchart TB
    HL[High-level design<br/>BREADTH: whole system] --> Pick{Pick a component}
    Pick --> Deep[DEEP DIVE: 1-2 critical parts]
    Deep --> TO[Trade-offs + failure modes]
    TO --> Scale[Scale to 10x]
    style HL fill:#dbeafe,color:#1e293b
    style Deep fill:#bbf7d0,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Phrases and patterns that demonstrate strong performance:</p>`,
            tabs: [
                {
                    label: 'Driving Phrases',
                    code: `// Phrases that show you're driving and thinking like a designer:
//
// Clarifying:  "Before I design, let me confirm the scope and scale..."
//              "Should I assume we need X, or is that out of scope?"
// Estimating:  "At ~100K reads/sec, this is read-heavy, so I'll lean on
//               caching and replicas - let me justify that with numbers."
// Deciding:    "We could use SQL or NoSQL here. Given [criteria], I'll choose
//               X, trading away Y. Does that align with what you'd prioritize?"
// Checking in: "I'll start with a simple design and then scale it - does that
//               approach work for you?"
// Going deep:  "The interesting part here is [X]; let me deep-dive into it."`,
                    language: 'csharp'
                },
                {
                    label: 'Handling "I Don\'t Know"',
                    code: `// You will hit something you don't know. Handle it like a senior engineer:
//
// DON'T: freeze, bluff, or make up confident nonsense.
// DO:    reason from first principles + state assumptions:
//   "I haven't used technology X specifically, but for this requirement I'd
//    need a system that does [properties]. Options I'd evaluate are [A/B], and
//    I'd choose based on [criteria]. I'd validate with a spike."
//
// Showing how you'd REASON and DECIDE under uncertainty is often a stronger
// signal than knowing the exact tool - it's what the job actually requires.`,
                    language: 'csharp'
                },
                {
                    label: 'Reading the Interviewer',
                    code: `// The interviewer steers toward what they want to assess - follow the nudge.
//
// "How would this handle a sudden 10x traffic spike?" -> they want scaling
// "What happens if this database goes down?"          -> they want failure modes
// "Walk me through what happens on a write."          -> they want the data flow
// "Is there a simpler way?"                           -> you over-engineered
// "How would you store this?"                         -> go to data model/storage
//
// Treat questions as signposts. Don't rigidly stick to your plan if they're
// pulling you somewhere - that's where the points are.`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Drive with Structure</h4>
            <p>Lead with a clear framework (requirements -> estimate -> design -> deep dive -> trade-offs). Structure
            is a scored competency and prevents freezing.</p>
            <h4>Do: Clarify and Scope First</h4>
            <p>Spend the first minutes nailing requirements and scale. Confirm what to optimize for before designing.</p>
            <h4>Do: Think Out Loud</h4>
            <p>Narrate your reasoning, assumptions, and trade-offs continuously. Your thought process is what's being
            evaluated.</p>
            <h4>Do: Start Simple, Then Scale</h4>
            <p>Get a working high-level design first, then evolve it for scale/failures. Don't open with maximal
            complexity.</p>
            <h4>Do: Follow the Interviewer's Nudges</h4>
            <p>Their questions point to what they want to assess. Adapt your plan to go where they steer.</p>
            <h4>Do: Manage Time</h4>
            <p>Budget the round so you reach the deep dive and trade-offs — where senior signal lives.</p>`,
            callout: {
                type: 'tip',
                title: 'The Interviewer Is a Collaborator',
                text: 'Treat the interviewer as a teammate in a design discussion, not an examiner. Ask clarifying questions, check in on your direction, and respond to their nudges. They are often actively trying to steer you toward demonstrating the specific signal they need \u2014 follow their lead.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Jumping Straight to Components</h4>
            <p>Drawing boxes before clarifying requirements/scale. You risk designing the wrong system. Clarify first.</p>
            <h4>Mistake: Over-Engineering the Opening</h4>
            <p>Starting with microservices, Kafka, and sharding for a simple prompt signals poor judgment. Start
            simple; add complexity when scale justifies it.</p>
            <h4>Mistake: Designing Silently</h4>
            <p>Working quietly denies the interviewer your reasoning. Narrate continuously.</p>
            <h4>Mistake: Poor Time Management</h4>
            <p>Spending 20 minutes on requirements (or one component) and never reaching the deep dive/trade-offs
            where senior signal is shown.</p>
            <h4>Mistake: Ignoring the Interviewer's Hints</h4>
            <p>Rigidly following your own plan while the interviewer is clearly steering elsewhere. Their questions
            are where the points are.</p>
            <h4>Mistake: Refusing to Commit</h4>
            <p>Listing options endlessly without deciding reads as indecision. State trade-offs, then choose and
            justify.</p>`,
            code: `// Anti-pattern opening for "Design a URL shortener":
// "I'll use Kubernetes, Kafka, Cassandra, a service mesh, and 10 microservices."
// -> over-engineered; no requirements; no estimation; poor judgment signal.
//
// Strong opening:
// "Let me clarify scope and scale first... [asks Qs] ...At ~1K writes/s and
//  100K reads/s it's read-heavy. I'll start simple: LB -> stateless app
//  servers -> KV store, with a cache for hot reads, then scale from there.
//  Does that work as a starting point?"`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>FAANG / Senior Loops</h4>
            <p>System design is a core round at most senior+ software interviews and often the deciding factor for
            leveling (whether you come in as senior vs staff).</p>
            <h4>Architecture Reviews at Work</h4>
            <p>The same skills — clarifying requirements, estimating, proposing a design, and defending trade-offs —
            are exactly what real architecture/design reviews and ADRs require.</p>
            <h4>Leveling Signal</h4>
            <p>The depth, scope, and independence you show in the round directly map to seniority: a staff candidate
            drives, anticipates failure modes, and discusses operational concerns unprompted.</p>
            <h4>Cross-Functional Communication</h4>
            <p>The ability to explain a complex system clearly and adapt to the audience is a daily senior-engineering
            skill the round is testing for.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>What the round looks like at different levels:</p>`,
            table: {
                headers: ['Dimension', 'Junior/Mid', 'Senior', 'Staff+'],
                rows: [
                    ['Driving', 'Needs prompting', 'Drives the round', 'Drives + anticipates'],
                    ['Depth', 'Working design', 'Deep on key components', 'Deep + operational concerns'],
                    ['Trade-offs', 'Some, with help', 'Clear, justified', 'Nuanced, business-aware'],
                    ['Failure modes', 'If asked', 'Proactively raised', 'Designed for upfront'],
                    ['Scale reasoning', 'Basic', 'Estimation-driven', 'Bottleneck-aware at 10x+'],
                    ['Scope', 'Single service', 'Multi-component', 'Cross-system / org impact']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>What actually moves your score in the round:</p>
            <h4>Communication Clarity</h4>
            <p>A clearly explained simpler design scores higher than a complex one you can't articulate. Clarity and
            structure are heavily weighted.</p>
            <h4>Trade-off Reasoning</h4>
            <p>The depth and honesty of your trade-off discussion is a primary differentiator — show you understand
            costs, not just benefits.</p>
            <h4>Reaching Depth</h4>
            <p>Time management to reach the deep dive matters: that's where senior/staff signal is demonstrated.
            Practice keeps you on schedule.</p>
            <h4>Adaptability</h4>
            <p>Responding well to curveballs ("now 10x traffic", "the DB just failed") shows real engineering
            judgment under changing constraints.</p>`,
            callout: {
                type: 'info',
                title: 'A Simple Design You Can Defend Beats a Complex One You Can\u2019t',
                text: 'Interviewers consistently rate a clear, well-reasoned, appropriately-simple design above an impressive-looking complex one the candidate can\u2019t fully explain or justify. Optimize for clarity, sound trade-offs, and depth where it matters \u2014 not for name-dropping technologies.'
            }
        },
        {
            title: 'Testing',
            content: `<p>You prepare for the round through realistic, timed practice.</p>
            <h4>Timed Mock Designs</h4>
            <p>Practice full prompts end-to-end within 45 minutes with a peer playing interviewer (asking clarifying
            questions and curveballs). This builds time management and the habit of driving.</p>
            <h4>Practice Estimation and Trade-offs</h4>
            <p>Drill back-of-the-envelope math and rehearse articulating trade-offs aloud — these are the parts most
            candidates fumble under pressure.</p>
            <h4>Review Real Architectures</h4>
            <p>Study engineering blogs (Netflix, Uber, Discord) and common designs (URL shortener, news feed, chat,
            rate limiter) so you have patterns to draw on.</p>`,
            code: `// Mock-interview checklist (have a peer score you):
// [ ] Clarified requirements + scale before designing?
// [ ] Did back-of-envelope estimation and used it?
// [ ] Got a working high-level design on the board?
// [ ] Reached a deep dive on a key component?
// [ ] Discussed trade-offs + failure modes + 10x scaling?
// [ ] Drove the conversation and thought out loud throughout?
// [ ] Finished on time?
//
// Practice common prompts: URL shortener, news feed, chat, rate limiter,
// notification system, ride-hailing, video streaming.`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>The highest-leverage performance tips for the design round:</p>
            <ul>
                <li><strong>Always clarify first;</strong> never design the wrong thing fast</li>
                <li><strong>Use a framework and narrate</strong> — structure and thinking-out-loud are scored</li>
                <li><strong>Start simple, then scale;</strong> don't over-engineer the opening</li>
                <li><strong>Follow the interviewer's nudges</strong> — their questions are the rubric</li>
                <li><strong>Commit to decisions with trade-offs;</strong> avoid endless option-listing</li>
                <li><strong>Manage time to reach the deep dive</strong> and trade-offs</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'When You Don\u2019t Know Something',
                text: 'You will hit unfamiliar territory. Don\u2019t bluff. Reason from first principles: "I haven\u2019t used X, but I need something with these properties; I\u2019d evaluate A vs B on these criteria and validate with a spike." Demonstrating sound reasoning under uncertainty is often a stronger signal than knowing the specific tool.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Resources</h4>
            <ul>
                <li><em>System Design Interview</em> Vol 1 &amp; 2 by Alex Xu</li>
                <li>Grokking the System Design Interview (educative.io)</li>
                <li>ByteByteGo (Alex Xu) — videos and newsletter</li>
                <li>Engineering blogs: Netflix, Uber, Discord, Stripe, Cloudflare</li>
                <li>The "System Design Framework" topic (Level 13) for the underlying methodology</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>It's a collaborative conversation,</strong> not a monologue — clarify, check in, adapt</li>
                <li><strong>Structure is scored:</strong> requirements -> estimate -> design -> deep dive -> trade-offs</li>
                <li><strong>Think out loud;</strong> your reasoning is the product being evaluated</li>
                <li><strong>Start simple, then scale;</strong> don't over-engineer the opening</li>
                <li><strong>Follow the interviewer's nudges</strong> — their questions are the rubric</li>
                <li><strong>Commit to decisions with clear trade-offs;</strong> manage time to reach the deep dive</li>
                <li><strong>A simple design you can defend beats a complex one you can't</strong></li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Run a Full Timed Mock</h4>
            <ol>
                <li>Pick a common prompt (design a news feed, chat app, rate limiter, or notification system)</li>
                <li>Set a 45-minute timer and have a peer act as interviewer (clarifying Qs + one curveball)</li>
                <li>Clarify requirements/scale, estimate, then build a high-level design while narrating</li>
                <li>Deep-dive one component the "interviewer" steers you toward</li>
                <li>Handle the curveball (e.g., "now 10x traffic" or "the DB failed") and discuss trade-offs</li>
                <li>Debrief against the mock checklist; identify where you lost time or stopped narrating</li>
            </ol>`,
            code: `// Run the loop, then score yourself on the mock-interview checklist
// (clarify, estimate, high-level, deep dive, trade-offs, drove + narrated,
//  finished on time). Repeat with different prompts until it's automatic.`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What should you do in the first few minutes of a system design round?<br/>
                    <em>A: Clarify requirements (functional + non-functional) and scope, and do rough estimation \u2014 driving
                    the conversation \u2014 before drawing any architecture. Designing the wrong system fast is worse than
                    starting deliberately.</em></li>
                <li><strong>Q:</strong> Why is thinking out loud essential?<br/>
                    <em>A: Your reasoning is what's being scored. The interviewer assesses how you think, weigh options,
                    and decide \u2014 silent designing hides exactly the signal they need.</em></li>
                <li><strong>Q:</strong> How should you handle a question you don't know the answer to?<br/>
                    <em>A: Don't bluff. Reason from first principles: state the properties you need, the options you'd
                    evaluate, the criteria for choosing, and that you'd validate with a spike. Reasoning under
                    uncertainty is a strong signal.</em></li>
                <li><strong>Q:</strong> What do the interviewer's questions usually indicate?<br/>
                    <em>A: They're steering you toward what they want to assess (scaling, failure modes, data flow, or
                    that you over-engineered). Treat them as signposts and follow the nudge \u2014 that's where the points are.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'How should you start a system design interview?',
            difficulty: 'easy',
            answer: `<p>Start by <strong>clarifying requirements and scope</strong> — don't jump to drawing components.
            Ask about functional requirements (what features), non-functional requirements (scale, latency,
            availability, consistency), and confirm what's in/out of scope. Then do quick <strong>estimation</strong>
            (QPS, storage) to ground later decisions.</p>
            <p>This shows you design deliberately and avoid building the wrong system. It also buys you a clear mental
            model before you commit to an architecture. Drive this phase actively rather than waiting for direction.</p>`,
            explanation: 'It is like an architect meeting a client: you don\u2019t start drawing the house before asking how many bedrooms, the budget, and the plot size. Clarifying first prevents designing something impressive but wrong.',
            bestPractices: ['Clarify functional + non-functional needs', 'Confirm scope (in/out)', 'Estimate scale to justify decisions', 'Drive the conversation'],
            commonMistakes: ['Jumping straight to components', 'Skipping non-functional requirements', 'Not estimating'],
            interviewTip: 'Lead with "let me clarify requirements and scale first" — it immediately signals a structured, senior approach.',
            followUp: ['What non-functional requirements do you always ask about?', 'How does estimation change your design?']
        },
        {
            question: 'What are interviewers actually evaluating in a system design round?',
            difficulty: 'medium',
            answer: `<p>Not a "correct" answer — they evaluate your <strong>thinking and engineering judgment</strong>:</p>
            <ul>
                <li><strong>Structure:</strong> do you approach ambiguity methodically?</li>
                <li><strong>Communication:</strong> can you explain a complex design clearly and think out loud?</li>
                <li><strong>Trade-off reasoning:</strong> do you weigh options and justify decisions, understanding
                costs not just benefits?</li>
                <li><strong>Technical depth:</strong> can you go deep on critical components and discuss failure modes
                and scale?</li>
                <li><strong>Judgment/seniority:</strong> do you start simple, avoid over-engineering, and drive the
                conversation independently (more so at senior+)?</li>
                <li><strong>Adaptability:</strong> do you respond well to curveballs and the interviewer's steering?</li>
            </ul>`,
            explanation: 'The whiteboard design is almost a prop; the real subject is your mind. They want to see how you\u2019d actually approach a real ambiguous design problem with a teammate \u2014 because that\u2019s the job.',
            bestPractices: ['Demonstrate structure and clarity', 'Reason explicitly about trade-offs', 'Go deep where it matters', 'Drive and adapt'],
            commonMistakes: ['Optimizing for a "right answer"', 'Name-dropping tech without justification', 'Silent designing', 'Over-engineering'],
            interviewTip: 'Show you know the round assesses thinking, not trivia: narrate, justify trade-offs, and calibrate depth to the level you\u2019re targeting.',
            followUp: ['How does the bar differ for senior vs staff?', 'How do you show seniority in the round?']
        },
        {
            question: 'How do you handle it when the interviewer pushes back or introduces a curveball (e.g., "now 10x the traffic")?',
            difficulty: 'hard',
            answer: `<p>Treat pushback and curveballs as <strong>opportunities to demonstrate judgment</strong>, not
            attacks:</p>
            <ol>
                <li><strong>Stay calm and engage:</strong> a curveball usually means they want to assess a specific
                competency (scaling, failure handling). Lean in.</li>
                <li><strong>Re-anchor on the bottleneck:</strong> for "10x traffic," identify what breaks first
                (using your estimates) — the database, a hot service, the cache — and address that specifically.</li>
                <li><strong>Apply scaling levers with trade-offs:</strong> caching, read replicas, horizontal scaling,
                sharding, async/queues — and explain what each costs (e.g., sharding adds complexity).</li>
                <li><strong>For "X failed," show resilience thinking:</strong> redundancy, failover, graceful
                degradation, and how you'd detect/recover.</li>
                <li><strong>If they push back on a decision,</strong> don't get defensive — either defend it with
                sound reasoning or, if they have a point, adapt gracefully ("good point, that changes the trade-off;
                I'd reconsider X"). Being able to update on evidence is a positive signal.</li>
            </ol>
            <p>The key is to reason transparently under the new constraint rather than freezing or stubbornly
            defending a now-wrong choice.</p>`,
            explanation: 'A curveball is the interviewer handing you a spotlight: "show me you can handle scale/failure/changing constraints." The worst responses are freezing or rigidly defending the original plan; the best is calmly reasoning through the new constraint and adapting, just like you would when real requirements change.',
            bestPractices: ['Treat curveballs as signals of what to demonstrate', 'Identify the bottleneck first, then apply scaling levers with trade-offs', 'Show resilience thinking for failure scenarios', 'Adapt gracefully if the pushback is valid'],
            commonMistakes: ['Freezing or panicking', 'Stubbornly defending a now-wrong decision', 'Throwing tech at it without identifying the bottleneck', 'Getting defensive about feedback'],
            interviewTip: 'For "10x traffic," explicitly identify what breaks FIRST and address it, rather than generically "add more servers." Updating your design gracefully when the interviewer has a valid point is a strong maturity signal.',
            followUp: ['For 10x reads, what breaks first and how do you fix it?', 'How would you handle a database failure in your design?', 'When should you defend vs change your decision under pushback?'],
            seniorPerspective: 'I coach candidates to hear pushback as collaboration, not combat. When an interviewer says "now 10x the traffic," they are inviting me to demonstrate scaling judgment \u2014 so I go straight to "let me identify what saturates first given our estimates" rather than reflexively adding boxes. And when they challenge a decision, I hold two things in tension: defend it if my reasoning is sound, but visibly update if they have surfaced a real flaw. The candidates who score highest aren\u2019t the ones who are never wrong \u2014 they\u2019re the ones who reason transparently and adapt gracefully as constraints change, because that is exactly what real architecture work demands.'
        }
    ,
        {
            question: 'How do you manage time across the phases of a 45-minute system design interview?',
            difficulty: 'hard',
            answer: `<p>Budget the time explicitly so you cover breadth before depth:</p>
            <ul>
                <li><strong>~5 min Requirements</strong> \u2014 clarify functional + non-functional, constraints, and scale; agree on what's in/out of scope.</li>
                <li><strong>~5 min Estimation</strong> \u2014 back-of-envelope: QPS, storage, bandwidth \u2014 enough to drive decisions.</li>
                <li><strong>~10 min High-level design</strong> \u2014 core components, APIs, data model, the boxes-and-arrows.</li>
                <li><strong>~15 min Deep dive</strong> \u2014 go deep on 1\u20132 areas the interviewer cares about (or the hardest part).</li>
                <li><strong>~5\u201310 min Trade-offs / wrap</strong> \u2014 bottlenecks, scaling, failure modes, what you\u2019d do next.</li>
            </ul>
            <p>Watch the clock and let the interviewer steer toward what they want to probe.</p>`,
            explanation: 'It is like sketching a house: agree on the requirements, rough out the whole floor plan first, then zoom into the tricky kitchen plumbing \u2014 rather than perfecting the front door while the rest is blank.',
            bestPractices: ['Time-box each phase and say your plan out loud', 'Establish requirements and scale before drawing anything', 'Get a complete high-level design before going deep', 'Let the interviewer direct which area to deep-dive'],
            commonMistakes: ['Jumping into detailed design before clarifying requirements', 'Spending so long on one component the design stays incomplete', 'Skipping estimation, then making unjustified scaling choices', 'Ignoring the interviewer\u2019s hints about where to focus'],
            interviewTip: 'State your time plan early ("I\u2019ll spend ~5 min on requirements, then high-level, then deep-dive"). Finishing a complete-but-shallow design beats a perfect fragment.',
            followUp: ['What do you do if you\u2019re running out of time?', 'How do you choose which component to deep-dive?', 'How much estimation detail is enough?'],
            seniorPerspective: 'I drive the structure rather than waiting to be led \u2014 announcing the phases signals seniority and keeps me from rat-holing. The most common failure I see is a beautiful auth flow and no actual system.',
            architectPerspective: 'The round is testing whether you can scope, prioritize, and reason about trade-offs under constraints \u2014 the same skills as real design work. Managing breadth-before-depth under a clock is itself part of the signal.'
        },
        {
            question: 'How do you decide between depth and breadth, and handle a curveball, in a system design round?',
            difficulty: 'advanced',
            answer: `<p>Establish <strong>breadth first</strong> (a complete high-level design), then go <strong>deep</strong> where it matters most \u2014 the riskiest component or wherever the interviewer points. A curveball ("now it must handle 100x traffic" or "the database region fails") is an invitation to show adaptive reasoning.</p>
            <ul>
                <li><strong>Acknowledge the new constraint</strong> and restate its impact before redesigning.</li>
                <li><strong>Reason out loud</strong> \u2014 they are testing your thought process, not a memorized answer.</li>
                <li><strong>Apply patterns</strong> \u2014 caching, sharding, async, replication, CDC \u2014 and name their trade-offs.</li>
                <li><strong>Stay calm and structured</strong> \u2014 a curveball is expected; flailing is the only wrong response.</li>
            </ul>`,
            explanation: 'A curveball is the interviewer poking your design to see if it bends or shatters. They don\u2019t expect a perfect instant answer \u2014 they want to watch you reason through the stress on your structure.',
            bestPractices: ['Complete a breadth-first design before deep-diving', 'Deep-dive the highest-risk component or interviewer\u2019s pick', 'Think out loud so your reasoning is visible', 'Restate the new constraint before adapting the design'],
            commonMistakes: ['Going so deep early that breadth never gets covered', 'Freezing or guessing randomly on a curveball', 'Silent thinking, leaving the interviewer with no signal', 'Defending the original design instead of adapting'],
            interviewTip: 'Treat curveballs as the point of the interview \u2014 narrate your reasoning, name the relevant pattern, and state the trade-off. Calm, structured adaptation is exactly the signal they\u2019re grading.',
            followUp: ['How do you respond to "now scale it 100x"?', 'How do you handle a topic you don\u2019t know deeply?', 'How deep is deep enough on one component?'],
            seniorPerspective: 'When I hit something I\u2019m unsure about, I say so and reason from first principles rather than bluffing \u2014 interviewers spot fabrication instantly, and honest reasoning scores better than a confidently wrong memorized answer.',
            architectPerspective: 'Real architecture is constant curveballs \u2014 requirements shift, scale changes, components fail. The interview compresses that into 45 minutes; demonstrating structured adaptation under new constraints is precisely the senior competency being measured.'
        },
        {
            question: 'What signals distinguish a junior from a senior/staff answer in a system design interview?',
            difficulty: 'advanced',
            answer: `<p>The same problem is answered very differently by level:</p>
            <ul>
                <li><strong>Trade-offs over solutions</strong> \u2014 seniors present options with explicit pros/cons ("SQL gives consistency, but..."), juniors name one tool.</li>
                <li><strong>Non-functional fluency</strong> \u2014 seniors weave in availability, consistency, latency, cost, and failure modes unprompted.</li>
                <li><strong>Failure thinking</strong> \u2014 seniors ask "what happens when this dies?" and design for partial failure.</li>
                <li><strong>Realistic scale reasoning</strong> \u2014 estimation drives decisions, not buzzwords.</li>
                <li><strong>Drives the conversation</strong> \u2014 seniors structure the round and make justified assumptions instead of waiting to be led.</li>
            </ul>`,
            explanation: 'A junior says "use Kafka". A senior says "we need durable, replayable, ordered events for this part, which is why a log like Kafka fits \u2014 here\u2019s the cost". Same word; vastly different signal.',
            bestPractices: ['Frame choices as trade-offs with explicit pros/cons', 'Bring in availability/consistency/cost/failure unprompted', 'Design for failure modes, not just the happy path', 'Drive structure and state assumptions instead of waiting'],
            commonMistakes: ['Name-dropping technologies without justification', 'Only the happy path; no failure or scaling discussion', 'Waiting passively for the interviewer to lead every step', 'Treating buzzwords as a substitute for reasoning'],
            interviewTip: 'Consciously verbalize trade-offs and failure modes \u2014 that single habit is the clearest level signal. Justify every technology choice against the specific requirement.',
            followUp: ['How do you show staff-level scope in design?', 'How much should you proactively discuss cost?', 'How do you justify a technology choice?'],
            seniorPerspective: 'I assume the interviewer can tell whether I\u2019m reasoning or reciting. So I tie every component to a requirement and a trade-off \u2014 that is what turns "I know the tools" into "I can make sound decisions with them".',
            architectPerspective: 'Level is read through judgment under ambiguity: weighing competing non-functionals, designing for failure, and justifying decisions. Those are the daily realities of architecture, which is why the interview optimizes for exactly those signals.'
        },
        {
            question: 'How do you handle a system design interview when the interviewer gives vague requirements?',
            difficulty: 'hard',
            answer: `<p>Vague requirements are not a problem — they are <strong>the point</strong>. The interviewer is testing whether you can structure ambiguity into a tractable design problem. Treat vagueness as an invitation to demonstrate requirements-gathering skill.</p>
            <ul>
                <li><strong>Ask clarifying questions purposefully</strong> — focus on questions that change the design: scale (QPS, storage), consistency vs availability, read-heavy vs write-heavy, latency requirements, and who the users are.</li>
                <li><strong>Make explicit assumptions</strong> — when the interviewer says "up to you", state your assumption clearly: "I\u2019ll assume 10M daily active users and optimize for read-heavy traffic. Let me know if you want me to adjust."</li>
                <li><strong>Prioritize requirements by impact</strong> — don\u2019t ask 20 questions. Ask 5–7 that have the highest architectural impact, then move forward.</li>
                <li><strong>Use back-of-envelope estimation</strong> — derive numbers rather than guessing: "If 10M users each make 5 reads/day, that\u2019s ~580 QPS average, ~2900 peak."</li>
                <li><strong>Revisit assumptions</strong> — as you design, check back: "does this assumption still hold, or should I adjust?"</li>
            </ul>
            <p>The senior signal is <strong>not needing perfect requirements to make progress</strong>. You scope, assume, communicate, and iterate.</p>`,
            explanation: 'It is like an architect designing a building when the client says "make it nice": you don\u2019t freeze — you ask how many floors, what\u2019s the budget, residential or commercial, and then sketch. Driving clarity from vagueness IS the job, and the interview is testing exactly that.',
            bestPractices: ['Ask 5–7 high-impact questions that change architectural decisions', 'State assumptions explicitly so the interviewer can redirect if needed', 'Use estimation to derive requirements you cannot ask about', 'Move forward with stated assumptions rather than waiting for perfect clarity', 'Revisit and adjust assumptions as the design evolves'],
            commonMistakes: ['Freezing and waiting for the interviewer to provide requirements', 'Asking 20 low-impact questions before drawing anything', 'Making assumptions silently without stating them', 'Designing without any requirements clarification at all'],
            interviewTip: 'Treat vagueness as a feature, not a bug. Say "Let me clarify a few things that will drive the architecture" and ask questions grouped by impact. Making explicit, justified assumptions is the senior-level behavior being tested.',
            followUp: ['How do you prioritize which questions to ask?', 'How do you know when you have enough requirements?', 'How do you handle an interviewer who refuses to answer your questions?'],
            seniorPerspective: 'I explicitly say my assumptions out loud and invite correction: "I\u2019m assuming eventual consistency is acceptable for the feed — if you need strong consistency, the design changes significantly." This shows I know what matters and gives the interviewer a clear branch point to explore.',
            architectPerspective: 'Real system design always starts with vague requirements — the ability to impose structure on ambiguity and make progress with incomplete information is the core architectural skill. The interview mirrors reality: clients never hand you a perfect spec.'
        },
        {
            question: 'What are the signals that differentiate a senior vs staff-level system design answer?',
            difficulty: 'expert',
            answer: `<p>Staff-level answers operate at a <strong>higher scope</strong>, demonstrate <strong>organizational awareness</strong>, and show <strong>judgment about what not to build</strong> — not just how to build it.</p>
            <ul>
                <li><strong>Scope beyond the system</strong> — staff answers consider the broader ecosystem: how this system interacts with existing services, team ownership boundaries, migration from the current state, and organizational capacity to operate it.</li>
                <li><strong>Build vs buy vs partner</strong> — staff engineers evaluate whether to build at all. "We could use an existing managed service for this component" shows strategic thinking.</li>
                <li><strong>Operational realism</strong> — not just "what if this fails?" but "who pages at 3am? what\u2019s the runbook? how do we deploy safely? what\u2019s the rollback?" The answer considers the ongoing cost of operating the system.</li>
                <li><strong>Migration and incremental delivery</strong> — staff answers show how to get from the current state to the target state safely, not just the end-state architecture. They plan the seams, feature flags, and strangler patterns.</li>
                <li><strong>Organizational trade-offs</strong> — team boundaries, skill availability, hiring plan, and time-to-market factor into the design. Architecture reflects the org (Conway\u2019s Law).</li>
                <li><strong>What to defer</strong> — staff engineers explicitly identify what NOT to build now and why, showing prioritization judgment: "This component can be a manual process for the first 6 months while we validate demand."</li>
            </ul>`,
            explanation: 'A senior answer designs a technically sound system. A staff answer designs a system that an organization can build, deploy, operate, and evolve — while acknowledging what not to build. It is the difference between solving the technical puzzle and solving the business problem.',
            bestPractices: ['Show awareness of the broader system ecosystem and organizational context', 'Consider build vs buy explicitly for commodity components', 'Include migration strategy: how to get from here to there incrementally', 'Address operational concerns: who owns it, deployment, monitoring, rollback', 'Explicitly state what to defer or not build now, with justification'],
            commonMistakes: ['Designing a perfect greenfield system with no migration path from reality', 'Only considering the technical merits, ignoring team capacity and org structure', 'Building everything custom without considering managed services or existing tools', 'No discussion of operation: monitoring, deployment, on-call, cost', 'Treating the design as a puzzle to solve perfectly rather than a system to evolve incrementally'],
            interviewTip: 'Consciously include one build-vs-buy callout, one migration consideration, and one "what to defer" statement. These are the staff signals that senior candidates almost never provide unprompted.',
            followUp: ['How does Conway\u2019s Law affect your system design?', 'How do you decide what to defer vs what to build now?', 'How do you communicate the phased delivery plan?'],
            seniorPerspective: 'What shifted my answers from senior to staff was adding "and here\u2019s how we get there from the current state" and "this component I would buy, not build." Those two additions signal that I think about real-world delivery, not just architecture diagrams.',
            architectPerspective: 'The staff/principal signal is designing for organizational reality: team boundaries, incremental delivery, operational burden, and what to explicitly leave out. I look for candidates who treat architecture as a sociotechnical discipline — the system must fit the org that builds and runs it.'
        }
    ]
});
