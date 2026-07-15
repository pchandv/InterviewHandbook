/* ═══════════════════════════════════════════════════════════════════
   OPEN SOURCE CONTRIBUTING — Level 16: Career & Interview Mastery
   Finding projects, first contributions, PR etiquette, community
   norms, licensing, and building a public reputation.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('open-source', {

    title: 'Open Source Contributing',
    level: 16,
    group: 'career-growth',
    description: 'Contributing to open source: finding projects, making first contributions, pull-request etiquette, community norms, licensing basics, and building a public reputation.',
    difficulty: 'beginner',
    estimatedMinutes: 30,
    prerequisites: [],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Open source contributing</strong> means improving publicly-available software that anyone
            can use, study, and modify. For engineers it is one of the highest-leverage career investments: you build
            real skills, a public portfolio, and a professional reputation — all while giving back to tools you rely on.</p>
            <p>Contributing is far more approachable than most people think. It doesn't require being an expert; many
            valuable contributions are documentation fixes, tests, small bug fixes, and triage.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>Why contributing helps your career</li>
                <li>How to find projects and good first issues</li>
                <li>The contribution workflow (fork, branch, PR)</li>
                <li>Pull-request etiquette and community norms</li>
                <li>Open-source licensing basics</li>
                <li>Building a public reputation over time</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Why Contribute</h4>
            <p>Real-world experience on production codebases, a public portfolio recruiters/interviewers can see,
            networking with strong engineers, learning collaboration at scale, and giving back to tools you use.</p>
            <h4>Types of Contributions</h4>
            <p>Not just code: documentation, tests, bug reports, triaging issues, reviewing PRs, answering questions,
            and translations all add value — and are great entry points.</p>
            <h4>Good First Issues</h4>
            <p>Many projects label beginner-friendly tasks <code>good first issue</code> or <code>help wanted</code> —
            scoped work meant for newcomers.</p>
            <h4>The Contribution Workflow</h4>
            <p>Fork the repo, clone it, create a branch, make focused changes, commit, push, and open a pull request
            (PR) for maintainers to review.</p>
            <h4>Community Norms (CONTRIBUTING.md / Code of Conduct)</h4>
            <p>Each project has its own process and culture, usually documented. Reading and following them is the
            single biggest factor in a contribution being accepted.</p>
            <h4>Licensing</h4>
            <p>Open-source licenses (MIT, Apache-2.0, GPL) govern how code can be used. Permissive (MIT/Apache) allow
            broad reuse; copyleft (GPL) requires derivatives to stay open. It matters for what you contribute and use.</p>`,
            mermaid: `flowchart LR
    Find[Find a project + good first issue] --> Read[Read CONTRIBUTING.md]
    Read --> Fork[Fork + branch]
    Fork --> Change[Small focused change + tests]
    Change --> PR[Open a PR]
    PR --> Review[Address review feedback]
    Review --> Merge[Merged - reputation grows]
    style Merge fill:#bbf7d0,color:#1e293b`
        },
        {
            title: 'How It Works',
            content: `<p>A typical first contribution, step by step:</p>
            <ol>
                <li><strong>Pick a project:</strong> ideally one you use and whose codebase/language you know. Check
                it's active and welcoming (recent commits, responsive maintainers).</li>
                <li><strong>Read the docs:</strong> CONTRIBUTING.md, README, and Code of Conduct — follow their
                process exactly.</li>
                <li><strong>Find a scoped issue:</strong> a <code>good first issue</code>, a doc gap, or a small bug.
                Comment to claim it and ask questions if unsure.</li>
                <li><strong>Fork, branch, change:</strong> make a small, focused change with tests; follow the
                project's style.</li>
                <li><strong>Open a clear PR:</strong> describe what and why, link the issue, keep it small.</li>
                <li><strong>Respond to review:</strong> address feedback graciously and promptly; iterate until merged.</li>
            </ol>`,
            code: `# Standard fork-and-PR workflow (GitHub)
git clone https://github.com/yourname/project.git   # your fork
cd project
git remote add upstream https://github.com/org/project.git  # original
git checkout -b fix/typo-in-readme        # focused branch

# ... make a small, focused change + add/adjust tests ...
git add .
git commit -m "docs: fix broken link in installation guide"
git push origin fix/typo-in-readme         # push to YOUR fork

# Open a PR from your branch to upstream's main.
# Keep your fork current later:
git fetch upstream && git rebase upstream/main`,
            language: 'bash'
        },
        {
            title: 'Visual Diagram',
            content: `<p>The fork-based contribution model:</p>`,
            mermaid: `flowchart LR
    Upstream[(Upstream repo<br/>org/project)] -->|fork| Fork[(Your fork)]
    Fork -->|clone| Local[Local clone]
    Local -->|branch + commit| Branch[Feature branch]
    Branch -->|push| Fork
    Fork -->|Pull Request| Upstream
    Upstream -->|review + merge| Merged[Contribution merged]`
        },
        {
            title: 'Implementation',
            content: `<p>Practical examples: a good PR description, finding issues, and licensing at a glance:</p>`,
            tabs: [
                {
                    label: 'Good PR Description',
                    code: `// A clear PR makes review fast and merge likely:
//
// Title: fix: prevent crash when config file is missing
//
// ## What
// Handle the case where config.json doesn't exist by falling back to defaults.
//
// ## Why
// Fixes #1234 - the app currently throws an unhandled error on first run
// when no config file is present.
//
// ## How
// - Check file existence before reading
// - Return DEFAULT_CONFIG when absent
// - Added a unit test for the missing-file case
//
// ## Notes
// Followed the existing error-handling pattern in config.js.
//
// Small, focused, linked to the issue, explains what/why/how, has tests.`,
                    language: 'javascript'
                },
                {
                    label: 'Finding Issues',
                    code: `# Where to find beginner-friendly work:
# - GitHub label search: "good first issue", "help wanted", "documentation"
# - Aggregators: goodfirstissue.dev, up-for-grabs.net, firsttimersonly.com
# - Projects YOU already use (you understand the problem + have motivation)
#
# Before claiming:
# - Check the issue isn't already assigned / has an open PR
# - Comment to express interest and ask clarifying questions
# - Confirm scope with a maintainer before large work
#
# Start small: docs, tests, a tiny bug fix - build trust before big changes.`,
                    language: 'bash'
                },
                {
                    label: 'Licenses at a Glance',
                    code: `// Common open-source licenses (know what you contribute to / use):
//
// MIT / BSD       - permissive: do almost anything, just keep the notice.
// Apache-2.0      - permissive + explicit patent grant; common for big projects.
// GPL / AGPL      - copyleft: derivatives must also be open-sourced
//                   (AGPL extends this to network/SaaS use). Be careful using
//                   GPL code in proprietary products.
// MPL / LGPL      - weak copyleft: file/library-level obligations.
//
// Your contributions are typically licensed under the project's license.
// Some projects require a CLA (Contributor License Agreement) - read it.`,
                    language: 'javascript'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Start Small and Build Trust</h4>
            <p>Begin with docs, tests, or small bug fixes. Maintainers gain confidence in you over time, opening the
            door to larger contributions.</p>
            <h4>Do: Read CONTRIBUTING.md First</h4>
            <p>Follow the project's documented process, style, and PR conventions. Ignoring them is the top reason
            contributions get rejected or stall.</p>
            <h4>Do: Keep PRs Small and Focused</h4>
            <p>One logical change per PR. Small PRs are reviewed faster and merged more often than sprawling ones.</p>
            <h4>Do: Communicate Before Big Work</h4>
            <p>Comment on the issue and confirm scope/approach with a maintainer before investing in a large change —
            avoid building something they won't accept.</p>
            <h4>Do: Be Gracious and Patient</h4>
            <p>Maintainers are often volunteers. Respond to feedback positively, be patient with review timelines, and
            follow the Code of Conduct.</p>
            <h4>Do: Write a Clear PR Description and Tests</h4>
            <p>Explain what/why/how, link the issue, and include tests. Make it easy for the maintainer to say yes.</p>`,
            callout: {
                type: 'tip',
                title: 'Read CONTRIBUTING.md Before Anything',
                text: 'The single biggest factor in getting a contribution accepted is following the project\u2019s documented process. CONTRIBUTING.md tells you how they want issues claimed, branches named, code styled, tests run, and PRs formatted. A technically-good PR that ignores the project\u2019s norms often stalls; a modest one that follows them sails through.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Huge Unsolicited PRs</h4>
            <p>Opening a massive PR with sweeping changes nobody asked for. It's hard to review and often rejected.
            Discuss first; keep changes focused.</p>
            <h4>Mistake: Ignoring the Project's Conventions</h4>
            <p>Not reading CONTRIBUTING.md, breaking the style, skipping tests, or wrong PR format. The fastest way to
            get a PR stalled or closed.</p>
            <h4>Mistake: Not Communicating</h4>
            <p>Silently building a big feature, or not claiming an issue (duplicating someone's work). Comment and
            align first.</p>
            <h4>Mistake: Taking Feedback Personally</h4>
            <p>Reacting defensively to review comments. Review is about the code, not you; engage graciously and
            iterate.</p>
            <h4>Mistake: Abandoning the PR</h4>
            <p>Opening a PR then disappearing when changes are requested. Follow through to merge; an abandoned PR
            wastes maintainer time.</p>
            <h4>Mistake: Ignoring Licensing</h4>
            <p>Copying code from incompatible-licensed sources into a project, or misunderstanding obligations (e.g.,
            GPL in proprietary code). Respect licenses.</p>`,
            code: `// Anti-pattern: the drive-by mega-PR
// (opens a 5,000-line PR rewriting the project's architecture, no prior
//  discussion, no tests, ignoring the style guide)
// -> overwhelms maintainers, almost always rejected or ignored.
//
// Better: open an issue first - "I'd like to improve X; here's my proposed
//  approach. Does this align with the project's direction?" - then submit
//  a small, focused, tested PR that follows CONTRIBUTING.md.`,
            language: 'javascript'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Career Portfolio</h4>
            <p>A public GitHub profile with merged PRs to known projects is concrete, verifiable evidence of skill —
            valuable in job searches and often discussed in interviews.</p>
            <h4>Skill Development</h4>
            <p>Working on real, production-grade codebases with experienced reviewers accelerates learning far beyond
            tutorials — you see professional standards and get expert feedback.</p>
            <h4>Networking &amp; Opportunities</h4>
            <p>Contributing connects you with maintainers and communities; many people find jobs, mentors, and
            collaborators through open source.</p>
            <h4>Giving Back &amp; Influence</h4>
            <p>Improving tools the whole industry relies on is impactful, and sustained contribution can grow into
            maintainer/committer roles with real influence over widely-used software.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Types of contributions — all valuable, varying in difficulty:</p>`,
            table: {
                headers: ['Contribution', 'Difficulty', 'Value', 'Great for'],
                rows: [
                    ['Documentation fixes', 'Low', 'High (often neglected)', 'First-ever contribution'],
                    ['Bug reports / triage', 'Low', 'High', 'Learning the project'],
                    ['Tests', 'Low-Medium', 'High', 'Understanding code safely'],
                    ['Small bug fixes', 'Medium', 'High', 'Building credibility'],
                    ['New features', 'High', 'High (if wanted)', 'Established contributors'],
                    ['Code review / answering Qs', 'Medium', 'High (community)', 'Growing into maintainer']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>"Performance" here is the impact and growth your contributions generate over time:</p>
            <h4>Consistency Compounds</h4>
            <p>Regular small contributions build reputation and relationships faster than one big drop. Sustained
            presence is how you grow into trusted-contributor and maintainer roles.</p>
            <h4>Quality Over Quantity</h4>
            <p>A few well-crafted, well-tested, accepted PRs to respected projects are worth far more (to your skills
            and portfolio) than many trivial or rejected ones.</p>
            <h4>Choose High-Leverage Work</h4>
            <p>Fixing a widely-hit bug, improving docs many people read, or adding a much-requested feature has
            outsized impact versus obscure changes.</p>
            <h4>Reputation Is Durable</h4>
            <p>A public track record of quality contributions is a lasting career asset that follows you across jobs —
            an investment that keeps paying off.</p>`,
            callout: {
                type: 'info',
                title: 'Documentation Is an Underrated First Contribution',
                text: 'Docs are perpetually under-maintained and a perfect first contribution: you learn the project, provide real value, and build trust with maintainers \u2014 all without needing deep knowledge of the internals. A clear fix to confusing setup instructions is genuinely appreciated and a low-risk way to make your first merged PR.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Quality contributions include tests and respect the project's verification process.</p>
            <h4>Run the Project's Tests Locally</h4>
            <p>Before opening a PR, run the existing test suite and linters (per CONTRIBUTING.md) so you don't submit
            something that breaks CI.</p>
            <h4>Add Tests for Your Change</h4>
            <p>A bug fix should include a test that fails without your fix and passes with it; a feature should be
            covered. Tests make maintainers far more comfortable merging.</p>
            <h4>Make CI Green</h4>
            <p>Most projects run CI on PRs. Address failures promptly; a red CI check will block merge regardless of
            how good the change is.</p>`,
            code: `# Before opening a PR, verify locally (commands vary - check CONTRIBUTING.md):
npm test          # or: pytest, go test ./..., cargo test, mvn test
npm run lint      # follow the project's style; fix lint errors

# Add a test for your fix (red without fix, green with it):
# - reproduces the bug, then your change makes it pass
# A PR with passing CI + a covering test is far more likely to be merged.`,
            language: 'bash'
        },
        {
            title: 'Interview Tips',
            content: `<p>Open-source experience is a talking point and credibility signal in interviews:</p>
            <ul>
                <li><strong>Reference real contributions</strong> as evidence of skill and collaboration</li>
                <li><strong>Tell the story of a contribution</strong> (STAR): what you fixed, how you navigated the
                community, the outcome</li>
                <li><strong>Show you understand collaboration norms</strong> — PR etiquette, review, communication</li>
                <li><strong>Mention licensing awareness</strong> if relevant to the role</li>
                <li><strong>A strong public profile</strong> can supplement or substitute for portfolio projects</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Contributions Are Verifiable Evidence',
                text: 'Unlike private work you can only describe, merged open-source PRs are public, verifiable proof of your skill, code quality, and ability to collaborate with a team you didn\u2019t control. Interviewers can read your actual code and how you handled review feedback \u2014 a powerful, credible signal.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Guides</h4>
            <ul>
                <li>opensource.guide (GitHub's official guides to contributing and maintaining)</li>
                <li>firsttimersonly.com / goodfirstissue.dev / up-for-grabs.net (finding beginner issues)</li>
                <li>choosealicense.com (understanding open-source licenses)</li>
            </ul>
            <h4>Reading</h4>
            <ul>
                <li>A project's own CONTRIBUTING.md and Code of Conduct (always read first)</li>
                <li><em>Working in Public</em> by Nadia Eghbal (open-source dynamics)</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Open source builds skills, a public portfolio, and reputation</strong> while giving back</li>
                <li><strong>Many valuable contributions aren't code:</strong> docs, tests, triage, reviews</li>
                <li><strong>Read CONTRIBUTING.md first</strong> and follow the project's norms — the top acceptance factor</li>
                <li><strong>Start small, keep PRs focused,</strong> and communicate before big work</li>
                <li><strong>Write clear PR descriptions and include tests;</strong> make CI green</li>
                <li><strong>Be gracious and patient</strong> with volunteer maintainers; follow through to merge</li>
                <li><strong>Understand licenses</strong> (permissive vs copyleft) for what you contribute and use</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Make Your First (or Next) Contribution</h4>
            <ol>
                <li>Pick an active project you use, in a language you know</li>
                <li>Read its README, CONTRIBUTING.md, and Code of Conduct</li>
                <li>Find a <code>good first issue</code> (or a doc gap / small bug) and comment to claim it</li>
                <li>Fork, branch, make a small focused change, run the tests/linters locally, and add a test</li>
                <li>Open a clear PR (what/why/how, linked issue) and make CI green</li>
                <li>Respond graciously to review feedback and iterate to merge; reflect on what you learned</li>
            </ol>`,
            code: `// Step-by-step:
// 1. choose project (use it + know the language)
// 2. read CONTRIBUTING.md / Code of Conduct
// 3. find + claim a good-first-issue (comment, ask Qs)
// 4. fork -> branch -> small change + test -> run suite + lint locally
// 5. open a focused PR (what/why/how + link issue), get CI green
// 6. address review feedback graciously -> merged. Reflect + repeat.`,
            language: 'bash'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What should you read before contributing to a project?<br/>
                    <em>A: The project's CONTRIBUTING.md (and README and Code of Conduct). Following the documented
                    process, style, and PR conventions is the biggest factor in a contribution being accepted.</em></li>
                <li><strong>Q:</strong> Why start with small contributions like docs or tests?<br/>
                    <em>A: They provide real value, help you learn the project, are low-risk, and build trust with
                    maintainers \u2014 opening the door to larger contributions later. Docs in particular are often neglected
                    and a great first PR.</em></li>
                <li><strong>Q:</strong> Why keep pull requests small and focused?<br/>
                    <em>A: Small, single-purpose PRs are easier and faster to review and far more likely to be merged. Huge
                    sprawling PRs overwhelm maintainers and often stall or get rejected.</em></li>
                <li><strong>Q:</strong> What's the difference between permissive and copyleft licenses?<br/>
                    <em>A: Permissive licenses (MIT, Apache-2.0) allow broad reuse including in proprietary software, just
                    keeping the notice. Copyleft licenses (GPL/AGPL) require derivative works to also be open-sourced \u2014
                    important to understand before using such code in closed products.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'Why should an engineer contribute to open source, and how do you start?',
            difficulty: 'easy',
            answer: `<p><strong>Why:</strong> it builds real skills on production codebases, creates a public, verifiable
            portfolio, connects you with strong engineers, teaches large-scale collaboration, and gives back to tools
            you use. It's one of the best career investments available to engineers.</p>
            <p><strong>How to start:</strong> pick an active project you use and know the language of; read its
            README and CONTRIBUTING.md; find a <code>good first issue</code> or a documentation gap; comment to claim
            it; then fork, branch, make a small focused change with tests, and open a clear PR. Start small (docs,
            tests, tiny fixes) to build trust before larger work.</p>`,
            explanation: 'It is like volunteering at a community workshop: you start with small, useful tasks, learn from experienced people, build relationships, and over time take on bigger projects \u2014 all while improving something everyone uses.',
            bestPractices: ['Pick projects you use and understand', 'Read CONTRIBUTING.md first', 'Start with docs/tests/small fixes', 'Keep the first PR small and focused'],
            commonMistakes: ['Starting with a huge unsolicited PR', 'Ignoring the project\u2019s process', 'Picking inactive/unwelcoming projects'],
            interviewTip: 'Frame it as a career investment (skills + verifiable portfolio + network) and show you know the practical starting path (good first issue + read CONTRIBUTING.md).',
            followUp: ['Where do you find beginner-friendly issues?', 'What non-code contributions are valuable?']
        },
        {
            question: 'What makes a pull request likely to be accepted, and what makes one likely to be rejected?',
            difficulty: 'medium',
            answer: `<p><strong>Likely accepted:</strong> it follows the project's CONTRIBUTING.md and style; is small and
            focused on one logical change; links to an issue and (for non-trivial work) was discussed/approved in
            advance; includes tests and passes CI; and has a clear description of what/why/how. The author responds
            graciously to review feedback and iterates.</p>
            <p><strong>Likely rejected/stalled:</strong> it's huge and unsolicited; ignores the project's conventions
            or style; lacks tests or breaks CI; wasn't discussed with maintainers; has an unclear description; or the
            author goes silent or reacts defensively to review. Essentially, the inverse of the good practices.</p>`,
            explanation: 'Maintainers are busy volunteers evaluating risk and effort. A small, well-tested, conventions-following PR with a clear description is low-risk and easy to say yes to. A giant, untested, style-violating PR with no context is high-risk and exhausting \u2014 so it stalls.',
            bestPractices: ['Follow CONTRIBUTING.md and style', 'Keep PRs small and focused', 'Discuss non-trivial changes first', 'Include tests; make CI green', 'Clear what/why/how description; respond graciously'],
            commonMistakes: ['Huge unsolicited PRs', 'Ignoring conventions/style', 'No tests / red CI', 'Going silent or defensive on review'],
            interviewTip: 'Frame it from the maintainer\u2019s perspective (low-risk, easy-to-review = accepted). Showing you understand the human side of review signals collaboration maturity.',
            followUp: ['How do you handle critical review feedback?', 'When should you open an issue before a PR?']
        },
        {
            question: 'What do you need to understand about open-source licenses as a contributor and a user?',
            difficulty: 'medium',
            answer: `<p>Licenses define how code can be used, modified, and redistributed. The key distinction:</p>
            <ul>
                <li><strong>Permissive (MIT, BSD, Apache-2.0):</strong> allow almost any use — including in
                proprietary/closed software — as long as you keep the copyright notice. Apache-2.0 also includes an
                explicit patent grant. Low-friction for both contributing and using.</li>
                <li><strong>Copyleft (GPL, AGPL):</strong> require that derivative works are also released under the
                same open license. AGPL extends this to software offered over a network (SaaS). Using GPL code in a
                proprietary product can obligate you to open-source it — a serious consideration.</li>
            </ul>
            <p>As a <strong>contributor</strong>, your contributions are generally licensed under the project's
            license, and some projects require signing a CLA. As a <strong>user</strong>, you must comply with the
            license of any code/library you incorporate — so understand the obligations (especially copyleft) before
            depending on it.</p>`,
            explanation: 'Permissive licenses are like a public recipe you can use in your own restaurant freely (just credit the author). Copyleft is like a recipe that requires any dish you make from it to also be shared publicly \u2014 great for the commons, but a problem if you wanted to keep your version secret.',
            bestPractices: ['Know permissive vs copyleft obligations', 'Check a dependency\u2019s license before using it in proprietary code', 'Read any required CLA', 'Don\u2019t copy incompatibly-licensed code into a project'],
            commonMistakes: ['Putting GPL code into a proprietary product unknowingly', 'Ignoring AGPL\u2019s network/SaaS clause', 'Assuming "open source" means "no obligations"'],
            interviewTip: 'Nail the permissive-vs-copyleft distinction and mention the AGPL/SaaS nuance \u2014 that depth signals real awareness, which matters for roles handling dependencies in commercial products.',
            followUp: ['Why might a company avoid GPL/AGPL dependencies?', 'What is a CLA and why do projects use one?']
        }
    ,
        {
            question: 'How do you make your first meaningful contribution to an open-source project?',
            difficulty: 'medium',
            answer: `<p>Start small, follow the project\u2019s norms, and build trust incrementally.</p>
            <ul>
                <li><strong>Find an on-ramp</strong> \u2014 look for "good first issue" / "help wanted" labels; pick something small and well-defined.</li>
                <li><strong>Read the contributing guide</strong> \u2014 CONTRIBUTING.md, code style, and the PR/test process; follow them exactly.</li>
                <li><strong>Engage before coding</strong> \u2014 comment on the issue to confirm it\u2019s available and your approach is welcome, avoiding wasted work.</li>
                <li><strong>Small, focused PR</strong> \u2014 one concern, with tests and a clear description; easier to review and merge.</li>
                <li><strong>Non-code counts</strong> \u2014 docs, tests, triage, and repro steps are valued contributions.</li>
            </ul>`,
            explanation: 'It is like joining an established kitchen: you don\u2019t rearrange the menu on day one. You take a small prep task, follow the head chef\u2019s rules, and earn bigger responsibilities over time.',
            bestPractices: ['Start with good-first-issue / help-wanted tasks', 'Read and follow CONTRIBUTING.md and code style precisely', 'Confirm the issue/approach on the thread before coding', 'Keep PRs small, focused, and well-tested with a clear description'],
            commonMistakes: ['Opening a huge unsolicited PR that rewrites things', 'Ignoring the contribution guidelines and style', 'Not commenting first, then duplicating someone\u2019s work', 'Taking review feedback personally'],
            interviewTip: 'Stress starting small, following norms, and engaging on the issue first. Mentioning that docs/tests/triage are real contributions shows you understand community dynamics.',
            followUp: ['How do you find a beginner-friendly project?', 'How do you respond to PR review feedback?', 'How do non-code contributions help?'],
            seniorPerspective: 'My first PR to a new project is deliberately tiny \u2014 a doc fix or a small bug \u2014 to learn the maintainers\u2019 process and earn trust before proposing anything substantial. Maintainer goodwill is the currency, and you build it gradually.',
            architectPerspective: 'Open source runs on trust and reputation built over many small, well-behaved interactions. Understanding that social architecture \u2014 norms, review culture, maintainer bandwidth \u2014 matters as much as the code you submit.'
        },
        {
            question: 'What is good PR etiquette when contributing to a project you don\u2019t own?',
            difficulty: 'medium',
            answer: `<p>Respect the maintainers\u2019 time and standards; you are a guest in their codebase.</p>
            <ul>
                <li><strong>One concern per PR</strong> \u2014 don\u2019t bundle unrelated changes; small PRs review and merge faster.</li>
                <li><strong>Explain the why</strong> \u2014 link the issue, describe the change and rationale, note how you tested it.</li>
                <li><strong>Match the codebase</strong> \u2014 follow existing style/conventions, not your personal preferences.</li>
                <li><strong>Include tests</strong> and ensure CI passes before requesting review.</li>
                <li><strong>Take feedback graciously</strong> \u2014 respond to all comments, push fixes promptly, don\u2019t argue defensively.</li>
                <li><strong>Be patient</strong> \u2014 maintainers are often volunteers; a polite nudge after a reasonable wait is fine.</li>
            </ul>`,
            explanation: 'A good PR is like a well-written letter to a busy person: clear purpose, easy to act on, respectful of their time \u2014 not a rambling demand they must decode.',
            bestPractices: ['Keep each PR to a single, focused concern with tests', 'Write a clear description: why, what, and how tested; link the issue', 'Follow the project\u2019s existing conventions and pass CI', 'Respond to review feedback promptly and without defensiveness'],
            commonMistakes: ['Massive PRs mixing refactors, features, and style changes', 'No description or test coverage, forcing reviewers to reverse-engineer', 'Imposing your style over the project\u2019s conventions', 'Arguing with or ignoring reviewer feedback'],
            interviewTip: 'Emphasize small, single-purpose PRs with clear descriptions and graceful handling of feedback. Patience with volunteer maintainers signals real community experience.',
            followUp: ['Why do small PRs get merged faster?', 'How do you handle a maintainer who goes silent?', 'How do you disagree with review feedback respectfully?'],
            seniorPerspective: 'I write the PR description for a reviewer who has zero context: linked issue, what changed, why, and how I verified it. Making review effortless is the single biggest factor in getting merged, far more than cleverness.',
            architectPerspective: 'PR hygiene scales beyond open source \u2014 small, single-concern, well-described changes are how high-velocity teams keep review fast and main branch healthy. The discipline that gets an OSS PR merged is the same that keeps internal delivery flowing.'
        },
        {
            question: 'Why contribute to open source, and how does it benefit your career?',
            difficulty: 'medium',
            answer: `<p>Open source offers concrete professional value beyond altruism:</p>
            <ul>
                <li><strong>Public portfolio</strong> \u2014 merged PRs are verifiable proof of skill that any employer can inspect.</li>
                <li><strong>Skill growth</strong> \u2014 exposure to high-quality codebases, rigorous review, and large-scale collaboration you may not get at work.</li>
                <li><strong>Network &amp; reputation</strong> \u2014 you build relationships with strong engineers and visibility in a community.</li>
                <li><strong>Influence the tools you use</strong> \u2014 fix the bug or add the feature your team depends on.</li>
                <li><strong>Understand dependencies deeply</strong> \u2014 contributing to a library you use makes you far better at using it.</li>
            </ul>
            <p>Be mindful of <strong>licensing</strong> and your employer\u2019s IP policy before contributing.</p>`,
            explanation: 'Open source is like a public apprenticeship: you learn from master craftspeople in the open, and the work you produce is a permanent, verifiable showcase of what you can do.',
            bestPractices: ['Treat merged contributions as a public, verifiable portfolio', 'Contribute to libraries you actually use to deepen mastery', 'Understand the project license and your employer\u2019s IP/contribution policy', 'Engage consistently to build reputation, not just one-off PRs'],
            commonMistakes: ['Contributing employer IP without checking policy/license', 'Chasing stars/commits as vanity metrics over real value', 'Ignoring license obligations (copyleft, attribution)', 'Expecting instant recognition rather than building reputation over time'],
            interviewTip: 'Frame it as portfolio + skill + network + influence, and flag licensing/employer-IP awareness \u2014 that last point signals professional maturity many candidates miss.',
            followUp: ['What licensing pitfalls should contributors know?', 'How do you choose a project to invest in?', 'How do employers view OSS contributions?'],
            seniorPerspective: 'My most valuable contributions are to libraries my team depends on \u2014 fixing the bug that blocks us both helps the project and deepens my mastery of a tool we rely on daily. That dual payoff is why I prioritize dependencies I actually use.',
            architectPerspective: 'Engaging with the open-source ecosystem informs better build/buy and dependency decisions: you understand a library\u2019s health, maintainer responsiveness, and internals before betting your architecture on it. Contribution is also due diligence.'
        },
        {
            question: 'How do you evaluate whether an open-source library is safe and well-maintained enough for production use?',
            difficulty: 'hard',
            answer: `<p>Evaluating an open-source dependency for production is a <strong>multi-dimensional risk assessment</strong> — not just "does it have stars on GitHub." You are betting your architecture on someone else\u2019s code.</p>
            <ul>
                <li><strong>Maintenance health</strong> — recent commits, responsive issue triage, active maintainers (bus-factor > 1), regular releases. A library last updated 2 years ago is a liability.</li>
                <li><strong>Community signals</strong> — usage by reputable companies, active discussions, quality of documentation, and presence of a contributor community beyond a single author.</li>
                <li><strong>Security posture</strong> — vulnerability disclosure process, history of CVEs and response time, dependency audit (what does it pull in?), and whether it runs in a security-sensitive context.</li>
                <li><strong>License compatibility</strong> — is the license compatible with your use case? Copyleft (GPL) has implications. Check transitive dependencies too.</li>
                <li><strong>API stability</strong> — does it follow semver? How often do breaking changes ship? Frequent breakage means ongoing maintenance cost for you.</li>
                <li><strong>Replaceability</strong> — can you wrap it behind an interface so you can swap it out if it dies? How deep is the coupling?</li>
                <li><strong>Test and code quality</strong> — browse the source: is it well-tested, readable, and reasonably structured? Poor internals predict future bugs and abandonment.</li>
            </ul>`,
            explanation: 'Adopting a dependency is like hiring a contractor: you check references (community), inspect past work (code quality), verify insurance (security/license), and confirm availability (maintenance). A cheap contractor who disappears mid-project costs more than doing it yourself.',
            bestPractices: ['Check maintenance pulse: recent commits, issue responsiveness, release cadence', 'Audit the dependency tree — what does it transitively pull in?', 'Verify license compatibility for your use case including transitive deps', 'Wrap external dependencies behind an interface for replaceability', 'Check security history: CVE response time, disclosure process, and audit results'],
            commonMistakes: ['Evaluating only by GitHub stars or download count (vanity metrics)', 'Ignoring transitive dependencies that bring in their own risks', 'Not checking license compatibility until legal raises it in production', 'Coupling deeply to a library with no abstraction layer for replacement', 'Assuming "popular" means "maintained" (many popular libs are abandoned)'],
            interviewTip: 'Name specific evaluation criteria beyond stars: maintenance health, security posture, license, API stability, and replaceability. The advanced signal is mentioning transitive dependency auditing and wrapping for replacement.',
            followUp: ['How do you handle a production dependency that becomes unmaintained?', 'How do you audit transitive dependencies at scale?', 'When is it worth forking vs replacing a dependency?'],
            seniorPerspective: 'I run a mental "bus factor" check on every dependency: if the sole maintainer disappears tomorrow, what is my plan? If the answer is "we\u2019re stuck", I either wrap it behind an interface or find an alternative with a healthier contributor base.',
            architectPerspective: 'Dependency evaluation is risk management: each library is a bet that someone else will maintain software your system depends on. I treat it like vendor due diligence — maintenance health, security posture, and exit strategy — because in production, abandoned dependencies are technical debt you cannot control.'
        },
        {
            question: 'How do you start contributing to open source as a strategy for career growth?',
            difficulty: 'medium',
            answer: `<p>Strategic open-source contribution builds a <strong>public portfolio, deepens expertise, and expands your professional network</strong> — but it requires focus and consistency, not random drive-by PRs.</p>
            <ul>
                <li><strong>Start with tools you already use</strong> — contributing to a library your team depends on has immediate professional value: you understand it deeply, and fixing its bugs helps your day job.</li>
                <li><strong>Begin with docs and tests</strong> — these are undervalued but real contributions. They help you learn the codebase, build trust with maintainers, and require less domain expertise.</li>
                <li><strong>Graduate to bug fixes</strong> — pick issues labeled "good-first-issue" or "help-wanted." Fix one real bug to learn the contribution workflow before attempting features.</li>
                <li><strong>Be consistent, not heroic</strong> — one small PR per month is more career-building than one massive PR per year. Consistency builds reputation and relationships.</li>
                <li><strong>Engage the community</strong> — comment on issues, review others\u2019 PRs, answer questions. Visibility comes from participation, not just code.</li>
                <li><strong>Showcase strategically</strong> — reference your contributions in interviews, your resume, and your brag doc. Merged PRs to respected projects are verified proof of skill.</li>
                <li><strong>Check your employer\u2019s policy</strong> — ensure you understand IP and contribution policies before submitting code.</li>
            </ul>`,
            explanation: 'Open-source contribution for career growth is like publishing research papers in academia: it builds a public, verifiable reputation that follows you between jobs. But just as a single paper rarely matters, consistent engagement in a community is what builds credibility.',
            bestPractices: ['Contribute to projects you use professionally for immediate dual value', 'Start with docs/tests to learn the process and build maintainer trust', 'Be consistent: regular small contributions beat rare large ones', 'Engage beyond code: reviews, issue triage, and community discussion build reputation', 'Reference contributions in interviews and growth documents as verifiable evidence'],
            commonMistakes: ['Starting with a huge feature PR to an unfamiliar project (likely rejected)', 'Contributing randomly to unrelated projects with no career focus', 'Expecting immediate recognition — reputation builds over months', 'Ignoring employer IP policy and accidentally contributing proprietary work', 'Only coding and never engaging the community (missing the relationship-building)'],
            interviewTip: 'Frame it as a deliberate strategy: contribute to tools you use, start small to build trust, be consistent, and engage the community. The mature insight is that docs and reviews are real contributions that build reputation.',
            followUp: ['How do you balance open-source contribution with a full-time job?', 'How do you choose which project to invest in?', 'How do employers view open-source contributions in hiring?'],
            seniorPerspective: 'I pick one project I use daily and become a consistent, helpful presence: triaging issues, reviewing PRs, and fixing bugs. After a few months, the maintainers know me and trust me — that reputation transfers directly to my resume and professional network.',
            architectPerspective: 'Open-source engagement at the architectural level means understanding the ecosystems your system depends on from the inside. Contributing teaches you the internal design, the maintainer\u2019s priorities, and the library\u2019s trajectory — knowledge that makes your technology decisions far more informed.'
        }
    ]
});
