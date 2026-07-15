'use strict';

PageData.register('git-version-control', {
    title: 'Git & Version Control',
    description: 'Branching strategies, merge workflows, and advanced Git operations for team collaboration',
    sections: [
        {
            title: 'Branching Strategies Overview',
            content: `<p>Branching strategies define how teams organize parallel work. The right choice depends on team size, release cadence, and deployment model.</p>
<ul>
<li><strong>GitFlow</strong> - Feature branches, develop, release branches, hotfix branches. Best for versioned releases (mobile apps, SDKs).</li>
<li><strong>Trunk-Based Development</strong> - Short-lived branches (< 1 day), feature flags, continuous integration to main. Best for CI/CD with frequent deploys.</li>
<li><strong>GitHub Flow</strong> - Feature branches off main, PR review, merge to main, deploy immediately. Best for web apps with simple release model.</li>
</ul>
<p>Key decision factors: How often do you release? How many versions do you support? How large is the team?</p>`
        },
        {
            title: 'Branching Strategy Decision Diagram',
            mermaid: `graph TD
    A[How often do you release?] -->|Multiple times/day| B[Trunk-Based Development]
    A -->|Weekly/Biweekly| C[GitHub Flow]
    A -->|Versioned releases| D[GitFlow]
    B --> E[Feature Flags Required]
    B --> F[Strong CI/CD Pipeline]
    C --> G[PR Review Process]
    C --> H[Auto-deploy on merge]
    D --> I[Release Branches]
    D --> J[Hotfix Branches]
    D --> K[Develop Branch]
    E --> L[Short-lived branches < 1 day]
    I --> M[Support multiple versions]`,
            content: `<p>Trunk-based development requires mature CI/CD and feature flags. GitFlow adds overhead but supports complex release cycles. GitHub Flow is the pragmatic middle ground for most web teams.</p>`
        },
        {
            title: 'Merge vs Rebase',
            content: `<p>Both integrate changes from one branch into another, but they produce different histories.</p>
<ul>
<li><strong>Merge</strong> creates a merge commit preserving the full branch topology. Use for shared/public branches.</li>
<li><strong>Rebase</strong> replays commits on top of the target, creating a linear history. Use for local/private branches before pushing.</li>
</ul>
<p><strong>Golden Rule:</strong> Never rebase commits that have been pushed to a shared branch. Rewriting shared history forces all collaborators to reconcile divergent histories.</p>`
        },
        {
            title: 'Merge vs Rebase Workflow',
            mermaid: `gitGraph
    commit id: "A"
    commit id: "B"
    branch feature
    commit id: "C"
    commit id: "D"
    checkout main
    commit id: "E"
    checkout feature
    merge main id: "Merge" tag: "merge approach"`,
            content: `<p>With merge, the feature branch retains its commits and a merge commit ties them together. With rebase, commits C and D would be replayed after E, producing C' and D' with new SHAs.</p>`
        },
        {
            title: 'Pull Request Workflow',
            content: `<p>Pull requests are the collaboration checkpoint between writing code and merging it.</p>
<ul>
<li><strong>Draft PRs</strong> - Signal work-in-progress, enable early feedback without formal review.</li>
<li><strong>PR Size</strong> - Keep under 400 lines of meaningful change. Large PRs get rubber-stamped.</li>
<li><strong>Review Checklist</strong> - Logic correctness, edge cases, test coverage, naming, security implications.</li>
<li><strong>CI Gates</strong> - Build, test, lint, security scan must pass before merge.</li>
<li><strong>Squash vs Merge Commit</strong> - Squash for clean history, merge commit for preserving granular commits.</li>
</ul>`
        },
        {
            title: 'Conflict Resolution',
            code: `# See which files have conflicts
git status

# Open conflicted file - markers look like:
<<<<<<< HEAD
// your changes
=======
// their changes
>>>>>>> feature-branch

# After resolving, mark as resolved
git add resolved-file.cs
git commit  # or continue rebase
git rebase --continue

# Abort if resolution goes wrong
git merge --abort
git rebase --abort

# Use a merge tool
git mergetool

# Re-use recorded resolution (rerere)
git config rerere.enabled true`,
            language: 'bash'
        },
        {
            title: 'Interactive Rebase & History Rewriting',
            code: `# Rewrite last 5 commits
git rebase -i HEAD~5

# In the editor, change 'pick' to:
# pick   - keep commit as-is
# reword - change commit message
# edit   - stop to amend the commit
# squash - meld into previous commit (keep message)
# fixup  - meld into previous commit (discard message)
# drop   - remove commit entirely

# Example: squash WIP commits before PR
pick abc1234 Add user service
fixup def5678 WIP: fix tests
fixup ghi9012 WIP: more fixes
pick jkl3456 Add user controller

# Autosquash with fixup commits
git commit --fixup=abc1234
git rebase -i --autosquash main`,
            language: 'bash'
        },
        {
            title: 'Cherry-Pick and Git Bisect',
            code: `# Cherry-pick: apply specific commit to current branch
git cherry-pick abc1234

# Cherry-pick without committing (stage changes only)
git cherry-pick --no-commit abc1234

# Cherry-pick a range
git cherry-pick A..B

# Git bisect: binary search for bug-introducing commit
git bisect start
git bisect bad          # current commit is broken
git bisect good v1.0    # this tag was working

# Git tests each midpoint - you mark good/bad
git bisect good  # or git bisect bad

# Automate with a test script
git bisect start HEAD v1.0
git bisect run npm test

# When done
git bisect reset`,
            language: 'bash'
        },
        {
            title: 'Git Hooks and Automation',
            code: `#!/bin/sh
# .git/hooks/pre-commit - runs before each commit

# Lint staged files only
npx lint-staged

# Run unit tests for changed files
dotnet test --filter "Category=Unit" --no-build

# Prevent commits to main
branch=$(git symbolic-ref --short HEAD)
if [ "$branch" = "main" ]; then
    echo "Direct commits to main are not allowed. Use a feature branch."
    exit 1
fi

# commit-msg hook - enforce conventional commits
# .git/hooks/commit-msg
commit_msg=$(cat "$1")
pattern="^(feat|fix|docs|style|refactor|test|chore)(\\(.+\\))?: .{1,72}$"
if ! echo "$commit_msg" | grep -qE "$pattern"; then
    echo "Commit message must follow Conventional Commits format"
    echo "Example: feat(auth): add OAuth2 login flow"
    exit 1
fi`,
            language: 'bash'
        },
        {
            title: 'Monorepo Considerations',
            content: `<p>Monorepos store multiple projects in a single repository. They require special Git strategies:</p>
<ul>
<li><strong>Sparse Checkout</strong> - Clone only the directories you need. Reduces clone size for large repos.</li>
<li><strong>CODEOWNERS</strong> - Route PR reviews to the right team based on file paths.</li>
<li><strong>Path-based CI</strong> - Only build/test projects affected by the changeset.</li>
<li><strong>Git LFS</strong> - Store large binary files outside the main repo history.</li>
<li><strong>Shallow Clone</strong> - <code>git clone --depth 1</code> for CI pipelines that only need latest.</li>
</ul>
<p>Tools like Nx, Turborepo, and Bazel add dependency-aware build caching on top of monorepos.</p>`
        },
        {
            title: 'Git Internals - Object Model',
            mermaid: `graph LR
    A[Working Directory] -->|git add| B[Staging Area / Index]
    B -->|git commit| C[Local Repository]
    C -->|git push| D[Remote Repository]
    D -->|git fetch| C
    C -->|git checkout| A
    D -->|git pull = fetch + merge| A
    
    E[Commit Object] --> F[Tree Object]
    F --> G[Blob - file content]
    F --> H[Tree - subdirectory]
    E --> I[Parent Commit]`,
            content: `<p>Understanding the object model helps debug complex scenarios. Every commit points to a tree (snapshot of all files), which points to blobs (file contents). Branches are just pointers to commits. HEAD is a pointer to the current branch.</p>`
        }
    ],
    questions: [
        {
            question: 'When would you choose trunk-based development over GitFlow, and what prerequisites must be in place?',
            difficulty: 'medium',
            answer: `<p>Choose trunk-based development when you deploy frequently (multiple times per day) and want to minimize merge conflicts from long-lived branches.</p>
<p><strong>Prerequisites:</strong></p>
<ul>
<li>Strong CI/CD pipeline with fast feedback (< 10 min build+test)</li>
<li>Feature flags infrastructure to decouple deployment from release</li>
<li>High test coverage and confidence in automated testing</li>
<li>Team discipline for small, incremental commits</li>
<li>Code review via pair programming or rapid PR turnaround</li>
</ul>
<p><strong>Choose GitFlow when:</strong> You ship versioned releases, support multiple versions in production, or have regulatory requirements around release branches.</p>`,
            interviewTip: 'Frame this as a tradeoff discussion. Show you understand that trunk-based is not universally better - it requires organizational maturity.',
            followUp: ['How do feature flags work with trunk-based development?', 'How do you handle database migrations with trunk-based?'],
            seniorPerspective: 'At senior level, discuss how branching strategy affects team velocity, merge conflict frequency, and release confidence. Mention that most GitFlow adoptions stem from lack of CI/CD maturity rather than genuine need for complex branching.',
            architectPerspective: 'Architects should consider how branching strategy interacts with microservices boundaries, shared libraries, and deployment pipelines. A monorepo with trunk-based development requires sophisticated build tooling.'
        },
        {
            question: 'Explain the difference between merge and rebase. When is rebase dangerous?',
            difficulty: 'easy',
            answer: `<p><strong>Merge</strong> creates a new commit that combines two branch histories. The original commits remain unchanged.</p>
<p><strong>Rebase</strong> moves (replays) commits from one branch onto another, rewriting commit SHAs to create a linear history.</p>
<p><strong>Rebase is dangerous when:</strong></p>
<ul>
<li>Commits have already been pushed to a shared branch - other developers have based work on those commits</li>
<li>Force-pushing after rebase forces all collaborators to reconcile divergent histories</li>
<li>It can silently drop conflict resolutions if not careful</li>
</ul>
<p><strong>Safe rebase pattern:</strong> Only rebase your local, unpushed commits onto the latest main before creating a PR.</p>`,
            interviewTip: 'Mention the "golden rule" - never rebase public history. Show you understand the practical implications, not just the mechanics.',
            followUp: ['What happens to other developers if you force-push a rebased branch?', 'How does rerere help with repeated conflict resolution?'],
            seniorPerspective: 'Senior engineers establish team conventions: rebase before PR (local cleanup), merge to integrate (preserve context). Document these in CONTRIBUTING.md.',
            architectPerspective: 'In large teams, consider branch protection rules that prevent force-push and require linear history via squash-merge as a compromise between clean history and safety.'
        },
        {
            question: 'How would you use git bisect to find a regression in a large codebase?',
            difficulty: 'medium',
            answer: `<p><strong>git bisect</strong> performs a binary search through commit history to find the first commit that introduced a bug.</p>
<p><strong>Manual process:</strong></p>
<ol>
<li><code>git bisect start</code></li>
<li><code>git bisect bad</code> - mark current (broken) commit</li>
<li><code>git bisect good v2.1.0</code> - mark a known-good commit</li>
<li>Git checks out the midpoint. Test it, then mark <code>good</code> or <code>bad</code></li>
<li>Repeat until Git identifies the first bad commit</li>
<li><code>git bisect reset</code> to return to original state</li>
</ol>
<p><strong>Automated:</strong> <code>git bisect run dotnet test --filter "TestName"</code> - Git runs the command at each step, using exit code 0 (good) vs non-zero (bad).</p>
<p>For 1000 commits, bisect finds the culprit in ~10 steps (log2(1000)).</p>`,
            interviewTip: 'Demonstrate you have actually used this tool. Mention the automated approach - it shows you value efficiency.',
            followUp: ['What if the test is flaky - how do you handle that with bisect?', 'Can you skip commits during bisect?'],
            seniorPerspective: 'Bisect works best when each commit is independently buildable and testable. This reinforces why atomic commits matter - a commit that breaks the build makes bisect unreliable.',
            architectPerspective: 'Automated bisect scripts can be part of incident response runbooks. Combined with good commit hygiene, they dramatically reduce mean time to identify root cause.'
        },
        {
            question: 'Describe a conflict resolution strategy for a team of 10+ developers working on the same codebase.',
            difficulty: 'hard',
            answer: `<p><strong>Prevention is better than resolution:</strong></p>
<ul>
<li><strong>Small PRs</strong> - Merge within 1-2 days. Long-lived branches are the #1 conflict source.</li>
<li><strong>CODEOWNERS</strong> - Clear ownership reduces overlapping changes to the same files.</li>
<li><strong>Feature flags</strong> - Multiple teams can merge incomplete features without conflicting on release timing.</li>
<li><strong>Interface-first design</strong> - Teams agree on contracts before implementing, reducing integration conflicts.</li>
</ul>
<p><strong>When conflicts occur:</strong></p>
<ul>
<li>Enable <code>git rerere</code> (reuse recorded resolution) for recurring conflicts</li>
<li>The developer whose PR is later is responsible for resolving conflicts</li>
<li>Use semantic conflict detection (not just textual) - tests catch logical conflicts that Git cannot see</li>
<li>For major refactors: announce in advance, do them in a single large PR with team coordination, or use automated codemods</li>
</ul>`,
            interviewTip: 'This tests team process thinking, not just Git commands. Emphasize prevention over resolution.',
            followUp: ['How do you handle a conflict in a generated file like package-lock.json?', 'What is a semantic conflict vs a textual conflict?'],
            seniorPerspective: 'Senior engineers recognize that frequent conflicts are a symptom of poor architecture (tight coupling) or poor process (long-lived branches). Fix the root cause.',
            architectPerspective: 'Module boundaries, clear interfaces, and service decomposition are architectural tools for reducing merge conflicts. If two teams constantly conflict on the same file, that file probably needs to be split.'
        },
        {
            question: 'What are Git hooks and how would you enforce code quality standards across a team?',
            difficulty: 'medium',
            answer: `<p><strong>Git hooks</strong> are scripts that run at specific points in the Git workflow (pre-commit, commit-msg, pre-push, etc.).</p>
<p><strong>Enforcement approach:</strong></p>
<ul>
<li><strong>pre-commit</strong> - Run linters, formatters, and type checks on staged files only (use lint-staged for performance)</li>
<li><strong>commit-msg</strong> - Validate conventional commit format</li>
<li><strong>pre-push</strong> - Run unit tests before pushing</li>
</ul>
<p><strong>Team distribution:</strong></p>
<ul>
<li>Use <strong>Husky</strong> (Node) or <strong>pre-commit</strong> (Python) frameworks to auto-install hooks from package.json</li>
<li>Store hook configs in the repo (<code>.husky/</code> directory)</li>
<li>Hooks install automatically on <code>npm install</code></li>
</ul>
<p><strong>Important:</strong> Hooks can be bypassed with <code>--no-verify</code>. They are a convenience, not security. Server-side CI is the real enforcement layer.</p>`,
            interviewTip: 'Mention that hooks are client-side and bypassable. This shows you understand the security model - real enforcement happens in CI.',
            followUp: ['What is the difference between client-side and server-side hooks?', 'How do you handle slow hooks blocking developer flow?'],
            seniorPerspective: 'Balance developer experience with quality gates. Pre-commit should be fast (< 5 seconds on staged files). Move slow checks to pre-push or CI.',
            architectPerspective: 'In a monorepo, hooks need to be path-aware - only run checks relevant to the changed packages. This requires tooling like Nx affected or Turborepo filtering.'
        },
        {
            question: 'Explain interactive rebase. How would you clean up a messy branch history before creating a PR?',
            difficulty: 'hard',
            answer: `<p><strong>Interactive rebase</strong> (<code>git rebase -i</code>) lets you rewrite commit history by reordering, squashing, editing, or dropping commits.</p>
<p><strong>Cleanup workflow:</strong></p>
<ol>
<li><code>git rebase -i main</code> - rebase all commits since branching from main</li>
<li>In the editor, reorganize commits logically (group related changes)</li>
<li>Squash WIP/fixup commits into meaningful units</li>
<li>Reword unclear commit messages</li>
<li>Drop debug or temporary commits</li>
</ol>
<p><strong>Best practice with fixup:</strong></p>
<ol>
<li>During development: <code>git commit --fixup=&lt;target-sha&gt;</code></li>
<li>Before PR: <code>git rebase -i --autosquash main</code></li>
<li>Fixup commits automatically squash into their targets</li>
</ol>
<p><strong>Result:</strong> A clean, logical series of commits that tell a story a reviewer can follow.</p>`,
            interviewTip: 'Walk through a concrete example. "I had 15 commits including 8 WIP commits. I squashed them into 3 logical commits: schema migration, service implementation, and API endpoint."',
            followUp: ['What if you mess up during interactive rebase?', 'How does reflog help recover from rebase mistakes?'],
            seniorPerspective: 'The goal is not fewer commits - it is logical commits. Each commit should be independently buildable, testable, and revertable. This makes bisect and revert reliable.',
            architectPerspective: 'Commit hygiene enables reliable automated tooling: changelog generation from conventional commits, automated versioning, and meaningful blame annotations.'
        },
        {
            question: 'How do you handle secrets that were accidentally committed to a Git repository?',
            difficulty: 'hard',
            answer: `<p><strong>Immediate actions:</strong></p>
<ol>
<li><strong>Rotate the secret immediately</strong> - assume it is compromised regardless of repo visibility</li>
<li><strong>Remove from history</strong> using <code>git filter-branch</code> or the faster <code>git filter-repo</code></li>
<li><strong>Force-push</strong> the cleaned history (coordinate with team)</li>
<li><strong>Clear remote caches</strong> - GitHub/GitLab may cache the old commits</li>
</ol>
<p><strong>Prevention:</strong></p>
<ul>
<li><code>.gitignore</code> for .env files, key files, and credential stores</li>
<li><strong>Pre-commit hooks</strong> with tools like <code>detect-secrets</code> or <code>gitleaks</code></li>
<li><strong>Git-secrets</strong> by AWS scans for patterns matching AWS keys</li>
<li><strong>CI scanning</strong> - tools like TruffleHog scan PRs for high-entropy strings</li>
<li><strong>Environment variables</strong> and secret managers (Azure Key Vault, AWS Secrets Manager) instead of config files</li>
</ul>
<p><strong>Important:</strong> Even after removing from history, the secret was exposed in any clone or fork made before cleanup. Always rotate.</p>`,
            interviewTip: 'Lead with "rotate the secret first" - this shows security-first thinking. The history cleanup is secondary to preventing active exploitation.',
            followUp: ['How does git filter-repo differ from filter-branch?', 'What about forks that already have the secret?'],
            seniorPerspective: 'Build defense-in-depth: .gitignore + pre-commit scanning + CI scanning + secret rotation policies. No single layer is sufficient.',
            architectPerspective: 'Design systems so secrets never need to be in code repositories. Use managed identities, workload identity federation, and runtime secret injection.'
        },
        {
            question: 'What is a monorepo and what Git challenges does it introduce? How do you solve them?',
            difficulty: 'advanced',
            answer: `<p>A <strong>monorepo</strong> stores multiple projects/services in a single repository, enabling atomic cross-project changes and shared tooling.</p>
<p><strong>Git challenges:</strong></p>
<ul>
<li><strong>Clone size</strong> - History grows large. Solution: shallow clones (<code>--depth 1</code>), sparse checkout, Git LFS for binaries.</li>
<li><strong>CI performance</strong> - Cannot build everything on every commit. Solution: affected/changed detection (Nx, Turborepo, Bazel).</li>
<li><strong>Ownership</strong> - Who reviews what? Solution: CODEOWNERS file with path-based rules.</li>
<li><strong>Merge conflicts</strong> - More developers, more contention. Solution: strong module boundaries, trunk-based development.</li>
<li><strong>Permissions</strong> - Not all developers should access all code. Solution: path-based access (limited Git support; GitLab has better support than GitHub).</li>
</ul>
<p><strong>When a monorepo makes sense:</strong> Shared libraries, coordinated releases, consistent tooling, atomic refactors across services.</p>
<p><strong>When it does not:</strong> Teams with very different tech stacks, strict access control requirements, or independent release cycles.</p>`,
            interviewTip: 'Show balanced thinking - monorepos have real tradeoffs. Google and Microsoft use them successfully, but they invested heavily in custom tooling.',
            followUp: ['How does sparse checkout work?', 'How do you version shared libraries in a monorepo?'],
            seniorPerspective: 'The decision between monorepo and polyrepo is an organizational decision as much as a technical one. It affects team boundaries, CI infrastructure, and deployment pipelines.',
            architectPerspective: 'Monorepos work best with strong build systems (Bazel, Nx, Turborepo) that understand the dependency graph and can cache/skip unchanged packages. Without this tooling, a monorepo at scale becomes a liability.'
        },
        {
            question: 'Explain cherry-pick. When is it appropriate and what are the risks?',
            difficulty: 'easy',
            answer: `<p><strong>Cherry-pick</strong> applies the changes from a specific commit onto your current branch, creating a new commit with the same diff but a different SHA.</p>
<p><strong>Appropriate uses:</strong></p>
<ul>
<li>Applying a hotfix from main to a release branch</li>
<li>Pulling a single bugfix from a feature branch that is not ready to merge</li>
<li>Backporting fixes to older supported versions</li>
</ul>
<p><strong>Risks:</strong></p>
<ul>
<li><strong>Duplicate commits</strong> - The same change exists as two different commits, which can cause confusion and conflicts when branches eventually merge</li>
<li><strong>Missing context</strong> - A commit may depend on earlier commits in the branch that you did not cherry-pick</li>
<li><strong>Conflict on merge</strong> - When the source branch is later merged, Git may flag the already-applied change as a conflict</li>
</ul>
<p><strong>Mitigation:</strong> Use cherry-pick sparingly. For regular workflows, prefer merge or rebase. Reserve cherry-pick for hotfix scenarios.</p>`,
            interviewTip: 'Give a concrete scenario - "We had a critical bug in production. The fix was on a feature branch with 50 other commits. Cherry-pick let us extract just the fix for an immediate hotfix release."',
            followUp: ['How do you cherry-pick a merge commit?', 'What flag recreates the commit without auto-committing?'],
            seniorPerspective: 'If your team cherry-picks frequently, your branching strategy may need adjustment. Frequent cherry-picking is a smell indicating branches live too long.',
            architectPerspective: 'In a multi-version support model (e.g., v1.x and v2.x maintained simultaneously), cherry-pick is a standard tool for backporting. Automate it with CI tooling where possible.'
        },
        {
            question: 'Design a Git workflow for a team migrating from a monolith to microservices. How do you handle the transition period?',
            difficulty: 'expert',
            answer: `<p><strong>Transition strategy:</strong></p>
<ol>
<li><strong>Phase 1 - Monorepo with boundaries:</strong> Keep single repo but establish clear module boundaries with CODEOWNERS. Extract interfaces between would-be services.</li>
<li><strong>Phase 2 - Gradual extraction:</strong> Use <code>git filter-repo</code> to extract services with history. Maintain the shared repo for orchestration and contracts.</li>
<li><strong>Phase 3 - Independent repos:</strong> Each service gets its own repo, CI pipeline, and release cycle.</li>
</ol>
<p><strong>During transition:</strong></p>
<ul>
<li><strong>Shared libraries</strong> - Extract to a separate repo published as packages (NuGet, npm). Version with SemVer.</li>
<li><strong>Contract testing</strong> - Use Pact or similar to verify service boundaries before physical separation.</li>
<li><strong>Git submodules or subtree</strong> - Temporarily reference shared code during extraction (submodules for read-only deps, subtree for copied code).</li>
<li><strong>CI/CD per path</strong> - In the monorepo phase, trigger builds only for affected paths.</li>
</ul>
<p><strong>Key principle:</strong> Separate the organizational change (team ownership) from the technical change (repo splitting). Teams should own boundaries before repos split.</p>`,
            interviewTip: 'This is a design question. Show you think about people and process, not just Git commands. The hardest part is organizational, not technical.',
            followUp: ['How do you preserve Git history when extracting a service?', 'How do you handle shared database schemas during extraction?'],
            seniorPerspective: 'The extraction order matters. Start with the service that has the clearest boundary and fewest shared-state dependencies. Use the Strangler Fig pattern.',
            architectPerspective: 'Repository structure should mirror team boundaries (Conway Law). Split repos when teams can deploy independently. Avoid splitting before the service boundary is proven - a distributed monolith is worse than a modular monolith.'
        }
    ]
});
