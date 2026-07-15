PageData.register('architecture-under-uncertainty', {
    title: 'Architecture Under Uncertainty',
    description: 'Making architectural decisions with incomplete information: reversibility, option value, last responsible moment, two-way doors, evolutionary architecture, and decision journals — the meta-skill that separates staff engineers from seniors',
    sections: [
        {
            title: 'Introduction',
            content: `<p><strong>Architecture under uncertainty</strong> is the meta-skill of making structural decisions when you do not (and cannot) have complete information. It is the reality of every real system: requirements will change, scale will surprise you, technology will evolve, and some bets will be wrong.</p>
<p>This topic is not taught by any course or interview prep site because it is experiential wisdom — learned through years of making decisions, seeing consequences, and refining judgment. It is also the #1 differentiator between senior engineers (who optimize for known requirements) and staff+ engineers (who optimize for adaptability in the face of unknowns).</p>
<p><strong>Core thesis:</strong> The best architecture is not the one that perfectly solves today's requirements. It is the one that is cheapest to CHANGE when tomorrow's requirements inevitably differ from today's assumptions.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>The conceptual framework for deciding under uncertainty:</p>`,
            table: {
                headers: ['Concept', 'Definition', 'Application'],
                rows: [
                    ['Reversibility', 'Can you undo this decision at reasonable cost?', 'Reversible decisions should be made quickly; irreversible ones deserve more deliberation'],
                    ['Two-Way Door', 'Amazon term: a decision you can walk back through', 'Most architecture decisions are two-way doors — treat them as such and move fast'],
                    ['One-Way Door', 'A decision that is extremely costly to reverse', 'Choice of database engine, public API contract, data model exposed to clients'],
                    ['Last Responsible Moment', 'Delay irreversible decisions until the moment further delay would eliminate options', 'Gather information before committing; but do not delay past the point of usefulness'],
                    ['Option Value', 'Keeping options open has economic value even if you never exercise them', 'An abstraction layer costs a little now but preserves the option to swap implementations later'],
                    ['Time-to-Learn', 'How quickly can you validate an assumption?', 'Spike/prototype before committing to a risky architecture; reduce uncertainty through experiment'],
                    ['Evolutionary Architecture', 'Architecture that supports guided, incremental change', 'Fitness functions verify architectural properties as the system evolves'],
                    ['Decision Journal', 'Structured record of what you decided, why, and what you expected', 'Enables learning from past decisions; reveals systematic biases']
                ]
            }
        },
        {
            title: 'The Decision Framework',
            content: `<p>A systematic approach to architectural decisions under uncertainty:</p>`,
            mermaid: `graph TD
    A[Decision Needed] --> B{Is it reversible?}
    B -->|Yes - Two-Way Door| C[Decide quickly<br/>Bias toward action<br/>Delegate if possible]
    B -->|No - One-Way Door| D{Can you delay<br/>without losing options?}
    D -->|Yes| E[Delay: gather more info<br/>Prototype/spike<br/>Reduce uncertainty]
    D -->|No| F{Can you make it<br/>more reversible?}
    F -->|Yes| G[Add abstraction layer<br/>Feature flag<br/>Expand-contract pattern]
    F -->|No| H[Deliberate carefully<br/>Document reasoning - ADR<br/>Get broad input<br/>Accept the bet]
    
    E --> A
    
    style C fill:#22c55e,color:#fff
    style H fill:#ef4444,color:#fff
    style G fill:#3b82f6,color:#fff`
        },
        {
            title: 'Reversibility & Two-Way Doors',
            content: `<p>Amazon's Jeff Bezos popularized classifying decisions as Type 1 (irreversible, one-way door) or Type 2 (reversible, two-way door). Most architectural decisions are Type 2 but are treated as Type 1 — causing analysis paralysis.</p>
<h4>Examples:</h4>
<table>
<tr><th>Decision</th><th>Type</th><th>Why</th><th>Approach</th></tr>
<tr><td>Choose a logging library</td><td>Two-way</td><td>Can swap later with adapter pattern</td><td>Pick one quickly, move on</td></tr>
<tr><td>Choose a programming language for a new service</td><td>Mostly two-way</td><td>Service is replaceable; the interface matters, not internals</td><td>Decide within a week; don't agonize</td></tr>
<tr><td>Choose a primary database engine</td><td>One-way</td><td>Data migration is extremely expensive; query patterns baked into code</td><td>Prototype with real workload; deliberate carefully</td></tr>
<tr><td>Define a public API contract</td><td>One-way</td><td>Clients depend on it; breaking changes are costly</td><td>Design carefully; version from day 1; get it reviewed</td></tr>
<tr><td>Monolith vs microservices</td><td>Two-way (monolith → micro easier)</td><td>You can always extract services later; premature splitting is harder to undo</td><td>Start with monolith; extract when boundaries are clear</td></tr>
<tr><td>Build vs buy a component</td><td>Moderately reversible</td><td>Can switch later but at cost of integration rework</td><td>Try the buy/SaaS option first (faster time-to-learn); build only if it fails</td></tr>
</table>
<p><strong>Key insight:</strong> Making reversible decisions slowly is as wasteful as making irreversible decisions hastily. Speed on Type 2 decisions is a competitive advantage.</p>`
        },
        {
            title: 'Last Responsible Moment & Option Value',
            content: `<p><strong>Last Responsible Moment (LRM)</strong> says: delay an irreversible decision until the point where NOT deciding would eliminate options or create more risk than deciding now.</p>
<h4>Why delay (when appropriate):</h4>
<ul>
<li>You learn more over time — the best decision now may not be the best decision in 3 months</li>
<li>Requirements often clarify themselves if you wait</li>
<li>Technology options may emerge or mature</li>
<li>Early commitment based on assumptions locks you into a path that may be wrong</li>
</ul>
<h4>When NOT to delay:</h4>
<ul>
<li>When delay itself closes options (team needs to start building NOW)</li>
<li>When the cost of delay exceeds the cost of a wrong decision (opportunity cost)</li>
<li>When the decision is easily reversible (just decide!)</li>
<li>When you already have enough information (further delay is procrastination, not prudence)</li>
</ul>
<h4>Option Value:</h4>
<p>In finance, an option has value even if you never exercise it — because it gives you the RIGHT to act later. In architecture:</p>
<ul>
<li>An interface/abstraction layer costs a little now but preserves the OPTION to swap implementations later</li>
<li>A modular monolith costs slightly more than a ball-of-mud monolith but preserves the OPTION to extract microservices later</li>
<li>A feature flag costs minutes to add but preserves the OPTION to roll back instantly</li>
</ul>
<p><strong>The question is always:</strong> Is the cost of preserving this option worth the probability that you'll need it?</p>`,
            mermaid: `graph LR
    subgraph "Decision Timeline"
        T0["Day 0<br/>High uncertainty<br/>Many options open"] --> T1["Month 1<br/>Some learning<br/>Options narrowing"]
        T1 --> T2["Month 3<br/>Requirements clearer<br/>Fewer unknowns"]
        T2 --> T3["Month 6<br/>Must decide NOW<br/>or lose option"]
    end
    
    T0 -.->|"Decide too early<br/>(before learning)"| BAD1["Risk: wrong choice<br/>based on assumptions"]
    T3 -.->|"Decide too late<br/>(past LRM)"| BAD2["Risk: options closed<br/>forced into suboptimal path"]
    T2 -.->|"Last Responsible Moment<br/>(maximum info, options still open)"| GOOD["Best informed decision"]
    
    style GOOD fill:#22c55e,color:#fff
    style BAD1 fill:#ef4444,color:#fff
    style BAD2 fill:#ef4444,color:#fff`
        },
        {
            title: 'Evolutionary Architecture',
            content: `<p><strong>Evolutionary architecture</strong> supports guided, incremental change across multiple dimensions — rather than requiring big-bang rewrites when requirements change.</p>
<h4>Key enablers:</h4>
<ul>
<li><strong>Fitness functions:</strong> Automated tests that verify architectural properties remain satisfied as the system evolves (performance budgets, dependency rules, coupling limits)</li>
<li><strong>Modularity:</strong> Clean boundaries that allow replacing or evolving one part without rewriting others</li>
<li><strong>Incremental change:</strong> Architecture can evolve through small, safe steps rather than requiring large, risky migrations</li>
<li><strong>Reversibility:</strong> Decisions that can be undone cheaply as new information arrives</li>
</ul>
<h4>Anti-pattern: Big Design Up Front (BDUF)</h4>
<p>Spending 6 months designing the "perfect" architecture before writing code. This fails because:</p>
<ul>
<li>Requirements change during those 6 months</li>
<li>Assumptions are untested until code runs</li>
<li>The design optimizes for problems you think you'll have, not the ones you actually encounter</li>
</ul>
<h4>Better: Iterative architecture</h4>
<ul>
<li>Start with the simplest architecture that could work (often a modular monolith)</li>
<li>Validate assumptions with real traffic and real data</li>
<li>Evolve architecture in response to REAL pain points (not anticipated ones)</li>
<li>Use fitness functions to ensure evolution doesn't degrade quality attributes</li>
</ul>`
        },
        {
            title: 'Decision Journals & Learning from Decisions',
            content: `<p>A <strong>decision journal</strong> is a structured record of significant architectural decisions that enables you to learn from outcomes and improve future judgment.</p>
<h4>What to record (for each significant decision):</h4>
<ol>
<li><strong>Context:</strong> What situation/constraint led to this decision?</li>
<li><strong>Options considered:</strong> What alternatives did you evaluate?</li>
<li><strong>Decision:</strong> What did you choose?</li>
<li><strong>Reasoning:</strong> WHY this option over the others? What trade-offs did you accept?</li>
<li><strong>Assumptions:</strong> What do you BELIEVE to be true that you cannot verify yet?</li>
<li><strong>Expected outcome:</strong> What do you predict will happen? By when?</li>
<li><strong>Actual outcome (filled later):</strong> What actually happened? Were assumptions correct?</li>
<li><strong>Lessons:</strong> What would you do differently with hindsight?</li>
</ol>
<h4>Why this matters:</h4>
<ul>
<li><strong>Reduces hindsight bias:</strong> You recorded your reasoning BEFORE the outcome. You cannot retroactively claim "I knew all along."</li>
<li><strong>Reveals systematic patterns:</strong> "I consistently underestimate migration effort" or "I over-index on performance at the cost of maintainability"</li>
<li><strong>Improves calibration:</strong> Over time, you learn which assumptions tend to be wrong and adjust your decision-making</li>
<li><strong>Team knowledge:</strong> When the original decision-maker leaves, the reasoning survives. New engineers understand WHY, not just WHAT.</li>
</ul>
<p><strong>Implementation:</strong> ADRs (Architecture Decision Records) serve this purpose when they include the "assumptions" and "expected outcome" fields that most teams skip.</p>`
        },
        {
            title: 'Interview Tips',
            content: `<p>This topic reveals staff+ maturity — the ability to think about thinking, to reason about uncertainty, and to make decisions that age well:</p>`,
            callout: {
                type: 'tip',
                title: 'What Staff+ Interviews Are Really Testing',
                text: `<ul>
<li><strong>Decision-making framework</strong> — Do you have a systematic approach to decisions, or do you just pick whatever feels right? Can you articulate WHEN to decide fast vs slow?</li>
<li><strong>Comfort with ambiguity</strong> — Can you make progress without complete information? Or do you freeze until all unknowns are resolved (which they never will be)?</li>
<li><strong>Reversibility thinking</strong> — Do you instinctively assess "can I undo this?" and calibrate your investment accordingly?</li>
<li><strong>Learning orientation</strong> — Can you describe decisions that turned out WRONG and what you learned? Admitting mistakes with lessons is far more impressive than claiming you are always right.</li>
<li><strong>Option preservation</strong> — Do you design for adaptability, not just for today's requirements? Can you explain the cost-benefit of keeping options open?</li>
</ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
<li>Most architecture decisions are reversible (two-way doors) — decide quickly and iterate</li>
<li>For irreversible decisions: delay until the Last Responsible Moment (max info, options still open)</li>
<li>Option value is real: abstractions and modularity preserve future choices at modest current cost</li>
<li>Evolutionary architecture > Big Design Up Front: evolve in response to real signals, not predictions</li>
<li>Decision journals reveal your systematic biases and improve future calibration</li>
<li>The best architecture is not the one that perfectly solves today — it is the cheapest to change tomorrow</li>
<li>Time-to-learn: when uncertain, spike/prototype to reduce uncertainty before committing</li>
<li>Speed on reversible decisions is a competitive advantage; deliberation on irreversible ones is wisdom</li>
</ul>`
        }
    ],
    questions: [
        {
            id: 'auu-q1',
            level: 'mid',
            title: 'What are "two-way door" and "one-way door" decisions? Give examples of each in software architecture.',
            answer: `<p><strong>Two-way door (Type 2):</strong> A decision you can walk back through — reversible at reasonable cost. Most decisions are this type.</p>
<ul>
<li>Choice of logging library (swappable via adapter)</li>
<li>Internal service implementation language (service is replaceable)</li>
<li>Feature flag on/off (instant toggle)</li>
<li>Choosing a CI/CD tool (painful to switch but possible)</li>
</ul>
<p><strong>One-way door (Type 1):</strong> A decision that is extremely costly or impossible to reverse once made.</p>
<ul>
<li>Public API contract exposed to external clients (breaking changes = client breakage)</li>
<li>Primary database engine for a core system (data migration of TB+ is a multi-month project)</li>
<li>Choosing a cloud provider for deep integrations (vendor-specific services create lock-in)</li>
<li>Open-sourcing proprietary code (cannot un-publish)</li>
</ul>
<p><strong>The meta-insight:</strong> Many decisions that FEEL irreversible are actually reversible with an abstraction layer or a migration strategy. Part of architectural skill is making one-way doors into two-way doors through design (e.g., the Repository pattern makes your database choice a two-way door).</p>`
        },
        {
            id: 'auu-q2',
            level: 'senior',
            title: 'Explain the "Last Responsible Moment" principle. How do you know when that moment has arrived?',
            answer: `<p><strong>Last Responsible Moment (LRM)</strong> means: delay an irreversible decision until further delay would either close options or cost more than deciding now.</p>
<p><strong>How to know the moment has arrived:</strong></p>
<ul>
<li><strong>Team is blocked:</strong> Cannot make progress without this decision. Delay is costing velocity.</li>
<li><strong>Options are closing:</strong> A technology you're considering is being deprecated, or a vendor deal expires.</li>
<li><strong>Diminishing returns on information:</strong> More research/prototyping will not significantly reduce uncertainty.</li>
<li><strong>Cost of delay exceeds cost of wrong choice:</strong> Shipping something imperfect NOW is better than shipping something perfect in 6 months.</li>
</ul>
<p><strong>Anti-patterns:</strong></p>
<ul>
<li><strong>Deciding too early:</strong> Choosing a database on day 1 based on a blog post, before understanding your access patterns (3 months of learning lost)</li>
<li><strong>Deciding too late:</strong> Still debating monolith vs microservices when the team has been blocked for a month (opportunity cost exceeded decision risk)</li>
<li><strong>Never deciding (analysis paralysis):</strong> Endlessly researching without committing, disguised as "being responsible"</li>
</ul>
<p><strong>Practical heuristic:</strong> If you have enough information to be 70% confident AND the decision is reasonably reversible — decide now. Waiting for 95% confidence on a reversible decision is waste.</p>`
        },
        {
            id: 'auu-q3',
            level: 'senior',
            title: 'How do you decide between "build for flexibility" (option value) vs "keep it simple" (YAGNI)?',
            answer: `<p>This is the central tension in architecture under uncertainty: flexibility costs complexity, but simplicity risks expensive rework. The answer depends on the PROBABILITY and COST of change.</p>
<h4>Decision framework:</h4>
<table>
<tr><th></th><th>Low probability of needing flexibility</th><th>High probability of needing flexibility</th></tr>
<tr><td><strong>Low cost to add later</strong></td><td>YAGNI — don't build it now</td><td>YAGNI — but plan the seam (make it easy to add)</td></tr>
<tr><td><strong>High cost to add later</strong></td><td>Consider option value — cheap insurance against expensive rework</td><td>Build it now — the cost of not having it is high AND likely</td></tr>
</table>
<h4>Examples:</h4>
<ul>
<li><strong>YAGNI wins:</strong> "We MIGHT need multi-tenancy someday." If adding tenant isolation later is a 2-week refactor and the probability is 30% — don't build it now. Cost × probability = low.</li>
<li><strong>Flexibility wins:</strong> "We MIGHT need to swap payment providers." If the swap without abstraction is a 6-month rewrite and the probability is 60% (business is negotiating contracts) — add the abstraction now. The interface costs 2 days; the option it preserves is worth months.</li>
<li><strong>Middle ground:</strong> "We're not sure about the data model." Don't build the full abstraction — but DO put the data access behind a repository interface so the storage decision is isolated. Minimal cost, maximum option value.</li>
</ul>
<p><strong>Key principle:</strong> The answer is not "always flexible" or "always simple." It is "invest in flexibility proportional to the cost of change × probability of needing it."</p>`
        },
        {
            id: 'auu-q4',
            level: 'senior',
            title: 'Describe a time you made an architecture decision that turned out to be wrong. What did you learn?',
            answer: `<p><strong>This is the most revealing staff+ interview question.</strong> Interviewers want to see: honest reflection, learning, and improved judgment. Here's how to structure your answer:</p>
<h4>Framework (STAR + Reflection):</h4>
<ol>
<li><strong>Decision:</strong> What did you decide and why? (Show it was reasonable given the information at the time)</li>
<li><strong>What went wrong:</strong> What assumption was violated? What did you not foresee?</li>
<li><strong>Impact:</strong> What was the cost? (Quantify if possible: rework time, team disruption, technical debt)</li>
<li><strong>What you learned:</strong> What would you do differently WITH THE SAME INFORMATION you had then? (Not with hindsight — that's easy)</li>
<li><strong>How it changed your approach:</strong> What systematic change did you make to prevent the same class of error?</li>
</ol>
<h4>Example answer structure:</h4>
<p>"We chose to build a custom event bus rather than using Kafka because our volume was low and we wanted simplicity. The decision was reasonable — 500 events/day didn't justify Kafka's operational complexity. But we didn't anticipate how quickly event volume would grow when 3 more teams started publishing. Within 6 months we were at 50K events/sec and our custom bus couldn't keep up.</p>
<p>What I learned: I under-weighted the RATE of change. The volume today was fine; the trajectory was not. Now I explicitly ask 'what does this look like at 10x scale?' and if the answer is 'we'd need to replace this,' I ask whether the cost of starting with the scalable option is justified by the growth trajectory."</p>
<p><strong>What impresses interviewers:</strong></p>
<ul>
<li>Ownership (not blaming others or circumstances)</li>
<li>The learning is SYSTEMIC (not "I should have known" but "I now always check X")</li>
<li>You changed your process, not just your knowledge</li>
</ul>`
        },
        {
            id: 'auu-q5',
            level: 'lead',
            title: 'How do you help a team make progress when there is deep disagreement about an architectural direction?',
            answer: `<p><strong>Architectural disagreement is healthy — it means the team is thinking critically.</strong> The goal is not consensus (which often means the lowest-common-denominator) but a well-informed decision that the team can commit to.</p>
<h4>Resolution approaches (in order of preference):</h4>
<ol>
<li><strong>Clarify the decision criteria:</strong> Often disagreements are about values ("we value simplicity" vs "we value flexibility"), not facts. Make the criteria explicit: "What qualities are we optimizing for? What are we willing to sacrifice?"</li>
<li><strong>Reduce uncertainty through experiment:</strong> "We disagree because we don't know if approach A will scale. Let's spend 2 days on a spike to find out." Evidence resolves many arguments that opinion cannot.</li>
<li><strong>Time-box the decision:</strong> "We will decide by Friday. Between now and then, each side prepares their strongest argument + acknowledges the weakness of their approach." Prevents endless debate.</li>
<li><strong>Reversibility analysis:</strong> "Both options are roughly equivalent? Which is more reversible? Let's pick that one, learn from it, and change course if needed." Eliminates the paralysis of "which is the BEST?" when both are adequate.</li>
<li><strong>Disagree and commit:</strong> If a decision must be made and there is still disagreement, the decision-maker (tech lead, architect) makes the call, documents the reasoning in an ADR, and the team commits to executing it fully. Half-hearted execution of any approach is worse than full commitment to a suboptimal one.</li>
</ol>
<p><strong>Anti-patterns:</strong></p>
<ul>
<li>Endless debate without a decision deadline (analysis paralysis)</li>
<li>Compromise that satisfies nobody (worst of both worlds)</li>
<li>Highest-paid person's opinion (HiPPO) without reasoned justification</li>
<li>Passive-aggressive non-commitment after the decision ("I told you this would fail")</li>
</ul>`
        },
        {
            id: 'auu-q6',
            level: 'lead',
            title: 'What is a "time-to-learn" spike and when should you use one before committing to an architecture?',
            answer: `<p>A <strong>time-to-learn spike</strong> is a focused, time-boxed experiment designed to reduce uncertainty about a specific architectural question BEFORE making an irreversible commitment.</p>
<h4>When to spike (vs just deciding):</h4>
<ul>
<li>The decision is hard to reverse (one-way door or expensive to undo)</li>
<li>There's a specific, testable uncertainty: "Will Kafka handle our throughput?" "Can we migrate 1B rows in under 4 hours?"</li>
<li>The cost of being wrong is high (months of rework, data loss risk, performance cliff)</li>
<li>Opinions are split and no one has direct experience with the proposed approach</li>
</ul>
<h4>How to spike effectively:</h4>
<ol>
<li><strong>Define the question precisely:</strong> Not "explore Kafka" but "Can Kafka sustain 50K msgs/sec with our message size and consumer pattern, with p99 < 100ms?"</li>
<li><strong>Time-box strictly:</strong> 2-5 days maximum. If you can't answer the question in that time, you've scoped it wrong.</li>
<li><strong>Realistic conditions:</strong> Test with production-like data volume, network latency, and failure scenarios — not toy data.</li>
<li><strong>Decision criteria pre-defined:</strong> "If throughput > 50K and latency < 100ms, we go with Kafka. Otherwise, we evaluate Pulsar."</li>
<li><strong>Throwaway code:</strong> The spike code is NOT production code. Its purpose is to generate knowledge, not artifacts.</li>
</ol>
<p><strong>Output:</strong> A brief document: "We tested X. Result was Y. Based on pre-defined criteria, we recommend Z." Decision made with evidence, not opinion.</p>`
        },
        {
            id: 'auu-q7',
            level: 'architect',
            title: 'How do you design architecture that ages well — remaining valuable even as requirements change unpredictably over 5+ years?',
            answer: `<p><strong>Architecture that ages well optimizes for CHANGEABILITY, not for today's requirements.</strong></p>
<h4>Principles for longevity:</h4>
<ol>
<li><strong>Boundaries at the right granularity:</strong> Not too fine (microservice explosion) nor too coarse (monolithic ball of mud). Modules should map to business domains that change independently. When domain A changes, domain B should not need to redeploy.</li>
<li><strong>Stable abstractions at boundaries:</strong> The interfaces BETWEEN modules should be stable (domain language, business contracts). The implementations WITHIN modules can change freely. Invest heavily in API/contract design; be relaxed about internals.</li>
<li><strong>Evolutionary fitness functions:</strong> Automated verification that architectural properties hold as the system evolves. Coupling limits, performance budgets, dependency rules — all enforced in CI so the architecture cannot erode silently.</li>
<li><strong>Data model conservatism:</strong> Data schemas are the hardest thing to change. Be minimalist: store what you need, not what you might need. Evolve schemas with backward-compatible migrations (expand-contract).</li>
<li><strong>Technology selection for longevity:</strong> Prefer boring technology (proven, well-understood, large community) over exciting technology (novel, small community, unclear future). Excitement depreciates; boringness appreciates.</li>
<li><strong>Replace-friendly components:</strong> Each component should be replaceable without rewriting the system. This means: clear interfaces, data ownership boundaries, and no component that "knows everything."</li>
</ol>
<h4>What does NOT age well:</h4>
<ul>
<li>Architecture optimized for today's scale (if you are 10x larger in 3 years, the assumptions are wrong)</li>
<li>Tight coupling to specific vendor APIs without abstraction</li>
<li>Shared databases between services (prevents independent evolution)</li>
<li>Clever optimizations that sacrifice readability (the team cannot maintain what they cannot understand)</li>
</ul>
<p><strong>The paradox:</strong> Architecture that lasts is often BORING architecture — well-understood patterns, clean boundaries, minimal cleverness, maximum replaceability. It is not the architecture that impresses at a conference; it is the one that still works 5 years later with a team that has turned over twice.</p>`
        },
        {
            id: 'auu-q8',
            level: 'architect',
            title: 'What is your process for making high-stakes architectural decisions when you have incomplete information and time pressure?',
            answer: `<p><strong>A structured process for high-stakes decisions under constraints:</strong></p>
<h4>Step 1: Frame the decision (30 minutes)</h4>
<ul>
<li>What exactly are we deciding? (Not "how to build the system" but "should we use an event-driven or request-driven architecture for order processing?")</li>
<li>What makes it high-stakes? (Irreversibility, cost of wrong choice, blast radius)</li>
<li>What is the deadline? (Real deadline, not artificial urgency)</li>
</ul>
<h4>Step 2: Identify what you KNOW vs what you ASSUME (1 hour)</h4>
<ul>
<li>Known facts (measured, verified): current traffic, team capabilities, existing contracts</li>
<li>Assumptions (believed but unverified): future traffic growth, performance of proposed technology, team ability to learn new stack</li>
<li>Unknown unknowns (acknowledged gaps): how the market will change, what competitor will do</li>
</ul>
<h4>Step 3: Reduce uncertainty on the riskiest assumption (1-5 days)</h4>
<ul>
<li>Which assumption, if wrong, would most change the decision? (The riskiest one)</li>
<li>Can you test it quickly? (Spike, prototype, benchmark, talk to someone who has done it)</li>
<li>If you cannot test it, acknowledge it as a bet and make the risk explicit in the ADR</li>
</ul>
<h4>Step 4: Decide and document (1 hour)</h4>
<ul>
<li>Write the ADR: context, options, decision, reasoning, assumptions, risks accepted</li>
<li>Include "what would make us reconsider" — the conditions under which you'd revisit this decision</li>
<li>Get input from 2-3 experienced engineers (not consensus — informed input)</li>
</ul>
<h4>Step 5: Make it reversible (design)</h4>
<ul>
<li>Can you add a seam/abstraction that reduces the cost of changing your mind later?</li>
<li>Can you stage the commitment (phase 1 validates assumption before phase 2 commits fully)?</li>
</ul>
<p><strong>Key principle:</strong> You are not trying to make the PERFECT decision. You are trying to make a GOOD decision quickly, with explicit risks, that you can adapt as you learn more. Perfect is the enemy of progress.</p>`
        }
    ]
});
