/* ═══════════════════════════════════════════════════════════════════
   Engineering Laws & Principles
   Conway, Brooks, Murphy, Goodhart, Gall, Pareto, Amdahl, Little
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('engineering-laws', {
    title: 'Engineering Laws & Principles',
    description: "Fundamental laws that govern software engineering: Conway's Law, Brooks' Law, Goodhart's Law, Gall's Law, Amdahl's Law, Little's Law, Pareto Principle, and more.",
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    prerequisites: ['arch-principles'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>These laws are observed truths about how software and organizations behave. Senior engineers reference them in design discussions, interviews, and postmortems. They give you a vocabulary for explaining WHY things fail.</p>`
        },
        {
            title: "Conway's Law",
            content: `<p><strong>"Organizations design systems that mirror their communication structures."</strong> &mdash; Melvin Conway, 1967</p>
            <ul>
                <li>A company with 4 teams produces a 4-component architecture</li>
                <li><strong>Inverse Conway Maneuver:</strong> Structure teams to match desired architecture</li>
                <li>Want microservices? Create independent teams first.</li>
            </ul>`,
            callout: { type: 'tip', title: 'Interview Tip', text: "Referencing Conway's Law when discussing architecture signals staff-level thinking." }
        },
        {
            title: "Brooks' Law",
            content: `<p><strong>"Adding manpower to a late software project makes it later."</strong> &mdash; Fred Brooks, 1975</p>
            <ul>
                <li>New members need ramp-up time (weeks to months)</li>
                <li>Communication overhead grows quadratically: n(n-1)/2</li>
                <li>Existing team loses productivity onboarding newcomers</li>
                <li><strong>When it does NOT apply:</strong> Parallelizable work with clear boundaries</li>
            </ul>`
        },
        {
            title: "Goodhart's Law",
            content: `<p><strong>"When a measure becomes a target, it ceases to be a good measure."</strong> &mdash; Charles Goodhart, 1975</p>
            <ul>
                <li>Measure lines of code &rarr; developers write verbose code</li>
                <li>Measure velocity &rarr; teams inflate story points</li>
                <li>Measure deployment frequency &rarr; teams deploy empty changes</li>
                <li><strong>Fix:</strong> Use multiple balanced metrics (DORA + SPACE together)</li>
            </ul>`
        },
        {
            title: "Gall's Law",
            content: `<p><strong>"A complex system that works evolved from a simple system that worked."</strong> &mdash; John Gall, 1975</p>
            <ul>
                <li>You cannot design a complex system from scratch and expect it to work</li>
                <li>Start simple, iterate, evolve complexity only when needed</li>
                <li><strong>Application:</strong> Start with monolith, extract microservices when proven necessary</li>
                <li><strong>Anti-pattern:</strong> Big bang rewrite &mdash; use Strangler Fig instead</li>
            </ul>`
        },
        {
            title: "Amdahl's Law",
            content: `<p><strong>"Speedup is limited by the sequential fraction."</strong> &mdash; Gene Amdahl, 1967</p>
            <ul>
                <li>If 50% of work is sequential, max speedup with infinite cores = 2x</li>
                <li>Formula: Speedup = 1 / (S + P/N) where S=serial, P=parallel, N=processors</li>
                <li><strong>Application:</strong> Before parallelizing, find the bottleneck. If DB query is 80% of time, more threads for compute will not help.</li>
            </ul>`
        },
        {
            title: "Little's Law",
            content: `<p><strong>"L = &lambda; &times; W"</strong> (Items in system = Arrival rate &times; Time in system) &mdash; John Little, 1961</p>
            <ul>
                <li>10 requests/sec at 2 sec each = 20 concurrent requests</li>
                <li>Used for capacity planning: how many threads/connections/pods needed?</li>
                <li>If latency doubles, concurrent connections double (need more capacity)</li>
                <li><strong>Interview:</strong> "1000 RPS at 200ms = need at least 200 concurrent connections"</li>
            </ul>`
        },
        {
            title: "Pareto Principle (80/20)",
            content: `<p><strong>"80% of consequences come from 20% of causes."</strong></p>
            <ul>
                <li>80% of bugs from 20% of code</li>
                <li>80% of performance issues from 20% of queries</li>
                <li>80% of user value from 20% of features</li>
                <li><strong>Application:</strong> Profile first, optimize the hottest 20%</li>
            </ul>`
        },
        {
            title: 'Other Important Laws',
            content: `<p>Additional laws that appear in senior interviews:</p>`,
            table: {
                headers: ['Law', 'Statement', 'Application'],
                rows: [
                    ["Murphy's Law", "Anything that can go wrong will", "Design for failure: timeouts, retries, circuit breakers"],
                    ["Hofstadter's Law", "Always takes longer than expected, even accounting for this law", "Add buffer; track estimation accuracy"],
                    ["Parkinson's Law", "Work expands to fill time available", "Set tight deadlines; time-box spikes"],
                    ["Hyrum's Law", "Any observable behavior will be depended upon", "Every API detail becomes a contract; version carefully"],
                    ["Postel's Law", "Be conservative in what you send, liberal in what you accept", "Accept flexible input, produce strict output"],
                    ["Peter Principle", "People rise to their level of incompetence", "Promote based on next-role skills, not current performance"]
                ]
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Conway's: architecture mirrors team structure (use Inverse Conway)</li>
                <li>Brooks': adding people late makes things worse</li>
                <li>Goodhart's: metrics-as-targets get gamed</li>
                <li>Gall's: complex systems evolve from simple ones</li>
                <li>Amdahl's: parallelism limited by sequential bottleneck</li>
                <li>Little's: L = rate x time (capacity planning essential)</li>
                <li>Referencing these in interviews shows systems thinking maturity</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'laws-q1',
            level: 'senior',
            title: "How does Conway's Law affect microservices architecture?",
            answer: `<p>System architecture mirrors team communication. For microservices: each independent team produces an independent service. If teams must coordinate heavily, their services will be tightly coupled regardless of intent.</p><p><strong>Inverse Conway:</strong> Structure teams FIRST to match desired architecture. Want a separate payments service? You need a dedicated payments team.</p>`,
            interviewTip: "Shows you understand architecture as a sociotechnical problem, not just technical."
        },
        {
            id: 'laws-q2',
            level: 'mid',
            title: "Project is 2 months late. Management wants to add 5 devs. What do you say?",
            answer: `<p><strong>Brooks' Law:</strong> Adding people to a late project makes it later because:</p><ul><li>New devs need 2-4 weeks ramp-up</li><li>Existing devs lose productivity mentoring</li><li>Communication channels grow quadratically</li></ul><p><strong>Better alternatives:</strong> Reduce scope, extend timeline honestly, parallelize only truly independent work, add specialists for specific bottlenecks.</p>`
        },
        {
            id: 'laws-q3',
            level: 'lead',
            title: "How would you use Little's Law for capacity planning?",
            answer: `<p><strong>L = &lambda; &times; W.</strong> If API receives 500 req/sec and average response = 100ms, then L = 500 &times; 0.1 = 50 concurrent requests.</p><p><strong>Implications:</strong> Need at least 50 threads/connections. If latency doubles (200ms), concurrency doubles to 100. If traffic spikes 3x, need 3x capacity (150). This determines thread pool, DB pool, and pod count.</p>`
        },
        {
            id: 'laws-q4',
            level: 'architect',
            title: "Give an example where Goodhart's Law damaged engineering culture.",
            answer: `<p><strong>Example:</strong> Company measured deployment frequency as KPI tied to performance reviews. Teams started deploying README changes and config tweaks as separate deployments. Frequency went up 10x but feature delivery was unchanged. QA overwhelmed.</p><p><strong>Fix:</strong> Measure deployment frequency as ONE of four DORA metrics. Never solo target. Pair with change failure rate (quality gate).</p>`
        },
        {
            id: 'laws-q5',
            level: 'senior',
            title: "How does Gall's Law apply to system rewrites?",
            answer: `<p>You cannot design a complex replacement from scratch. Big bang rewrites almost always fail (Netscape, Perl 6).</p><p><strong>Correct approach:</strong> Strangler Fig &mdash; incrementally replace pieces while old system remains running. Each piece is simple, tested, working before the next begins.</p>`
        },
        {
            id: 'laws-q6',
            level: 'mid',
            title: "Explain Amdahl's Law with a real example.",
            answer: `<p><strong>Scenario:</strong> API takes 1s total: 200ms DB query (serial) + 800ms processing 8 items (parallelizable).</p><p>With 8 threads: processing = 100ms. Total = 300ms. Speedup = 3.3x (not 8x).</p><p>With 100 threads: processing = 8ms. Total = 208ms. Speedup = 4.8x max.</p><p><strong>Lesson:</strong> The serial 200ms DB call limits max speedup to 5x. Fix the bottleneck first (cache the query).</p>`
        },
        {
            id: 'laws-q7',
            level: 'architect',
            title: "Which engineering laws are most relevant for distributed systems?",
            answer: `<p><strong>Multiple laws apply simultaneously:</strong></p><ul><li><strong>CAP:</strong> Cannot have consistency + availability + partition tolerance</li><li><strong>Murphy's:</strong> Network WILL fail. Design for it.</li><li><strong>Conway's:</strong> Service boundaries match team boundaries</li><li><strong>Little's:</strong> Cascading latency multiplies concurrency needs</li><li><strong>Fallacies of Distributed Computing:</strong> Network is NOT reliable, latency is NOT zero</li></ul>`
        },
        {
            id: 'laws-q8',
            level: 'lead',
            title: "How do you apply Pareto Principle to performance optimization?",
            answer: `<p><strong>80/20 rule:</strong> 80% of latency comes from 20% of code paths.</p><ol><li>Profile first &mdash; never optimize without data</li><li>Focus on the biggest slice (one N+1 query taking 70% of time)</li><li>Know when to stop &mdash; diminishing returns after top 20%</li></ol><p><strong>Real example:</strong> Profiled checkout API. One N+1 query was 70% of time. Batch query fix reduced P95 from 2s to 400ms.</p>`
        }
    ]
});
