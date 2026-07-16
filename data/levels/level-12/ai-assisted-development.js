/* ═══════════════════════════════════════════════════════════════════
   AI — AI-Assisted Development & SDLC
   AI Pair Programming, Copilot/Cursor/Kiro, AI Code Reviews,
   AI Testing, AI-Assisted SDLC across the full lifecycle.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('ai-assisted-development', {
    title: 'AI-Assisted Development & SDLC',
    description: 'Using AI tools throughout the software development lifecycle: AI pair programming (Copilot, Cursor, Kiro), AI-powered code reviews, test generation, documentation, debugging, and how AI transforms every phase from requirements to monitoring.',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    prerequisites: ['ai-fundamentals'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>AI is transforming how engineers work at every stage of the SDLC. This is not about replacing developers &mdash; it is about <strong>amplifying</strong> them. Senior engineers are expected to understand these tools, use them effectively, and know their limitations.</p>
            <p>This topic covers: which AI tools to use when, how to get the best results, and the interview questions that test your AI-augmented workflow.</p>`
        },
        {
            title: 'AI Development Tools Landscape',
            content: `<p>The ecosystem of AI coding assistants (as of 2025-2026):</p>`,
            table: {
                headers: ['Tool', 'Strength', 'Best For', 'Model'],
                rows: [
                    ['GitHub Copilot', 'Inline completions, IDE-native, enterprise trust', 'Day-to-day coding, completions, snippets', 'GPT-4o / Custom'],
                    ['Cursor', 'Full-file edits, codebase-aware, chat + apply', 'Refactoring, multi-file changes, exploration', 'Claude / GPT-4o'],
                    ['Kiro', 'Spec-driven development, hooks, autonomous agent', 'Structured feature implementation, specs', 'Claude (Auto)'],
                    ['Claude (direct)', 'Long context (200K), careful reasoning', 'Architecture analysis, complex code review', 'Claude 3.5/Opus'],
                    ['ChatGPT', 'Broad knowledge, code interpreter, vision', 'Learning, prototyping, research', 'GPT-4o'],
                    ['Windsurf', 'Agent-first, cascading edits, flow state', 'Rapid prototyping, flow-based editing', 'Multi-model'],
                    ['Amazon Q', 'AWS-native, security scanning, migration', 'AWS workloads, Java/.NET modernization', 'Custom']
                ]
            }
        },
        {
            title: 'AI Pair Programming',
            content: `<p><strong>AI pair programming</strong> is using AI as a real-time collaborator while coding. Effective patterns:</p>
            <ul>
                <li><strong>Intent-driven:</strong> Write a comment describing what you want, let AI generate the implementation</li>
                <li><strong>Test-first:</strong> Write the test, let AI generate the implementation that passes it</li>
                <li><strong>Scaffold then refine:</strong> Let AI generate boilerplate, then refine the interesting parts yourself</li>
                <li><strong>Rubber duck with intelligence:</strong> Explain your approach to AI, ask it to find flaws</li>
                <li><strong>Explore unfamiliar:</strong> Ask AI to explain unfamiliar codebases or libraries while you navigate</li>
            </ul>`,
            callout: { type: 'tip', title: 'Productivity Pattern', text: 'The biggest productivity gain comes from using AI for the boring parts (boilerplate, repetitive patterns, test data, documentation) while you focus on the interesting parts (architecture decisions, edge cases, domain logic). Do not let AI make architectural decisions for you.' }
        },
        {
            title: 'AI Across the SDLC',
            content: `<p>AI applies to every phase of software delivery:</p>`,
            table: {
                headers: ['Phase', 'AI Application', 'Tools/Approach', 'Human Role'],
                rows: [
                    ['Requirements', 'Generate user stories from PRDs, identify gaps', 'ChatGPT/Claude on requirements docs', 'Validate completeness, prioritize'],
                    ['Design', 'Generate architecture options, evaluate trade-offs', 'AI + ADR templates, diagram generation', 'Make the decision, own the trade-offs'],
                    ['Coding', 'Inline completions, boilerplate, refactoring', 'Copilot, Cursor, Kiro', 'Review AI output, handle edge cases'],
                    ['Testing', 'Generate unit tests, edge cases, test data', 'Copilot test gen, AI test frameworks', 'Define what to test, review coverage'],
                    ['Code Review', 'Catch bugs, style issues, security vulnerabilities', 'Copilot PR review, CodeRabbit, custom', 'Architectural review, business logic'],
                    ['Documentation', 'Generate API docs, README, inline comments', 'AI doc generators, Copilot comments', 'Verify accuracy, maintain voice'],
                    ['Debugging', 'Analyze stack traces, suggest fixes, explain errors', 'Paste error + context into AI chat', 'Verify fix is correct, understand root cause'],
                    ['Deployment', 'Generate Terraform/YAML, CI/CD configs', 'AI on IaC, pipeline generation', 'Review security, validate configs'],
                    ['Monitoring', 'Generate alert rules, analyze log patterns', 'AI log analysis, anomaly detection', 'Set thresholds, validate alerts'],
                    ['Incidents', 'Suggest root causes from logs/traces, draft RCAs', 'AI on observability data, RCA assistants', 'Validate findings, implement fixes']
                ]
            },
            mermaid: `graph TD
    REQ[Requirements] -->|AI: generate stories| DES[Design]
    DES -->|AI: architecture options| CODE[Coding]
    CODE -->|AI: completions, refactoring| TEST[Testing]
    TEST -->|AI: generate tests, edge cases| REV[Code Review]
    REV -->|AI: catch bugs, security| DEPLOY[Deploy]
    DEPLOY -->|AI: generate configs| MON[Monitor]
    MON -->|AI: anomaly detection| INC[Incidents]
    INC -->|AI: RCA analysis| REQ

    style CODE fill:#3b82f6,color:#fff
    style TEST fill:#10b981,color:#fff
    style REV fill:#8b5cf6,color:#fff`
        },
        {
            title: 'AI Code Reviews',
            content: `<p>AI-assisted code review catches issues humans miss (and vice versa). Use both together:</p>
            <ul>
                <li><strong>AI catches:</strong> Typos, null reference risks, missing error handling, security patterns (SQL injection, XSS), style inconsistencies, unused imports</li>
                <li><strong>Humans catch:</strong> Wrong abstraction, business logic errors, architectural violations, performance implications at scale, team convention violations</li>
                <li><strong>Best practice:</strong> AI reviews first (catches mechanical issues), human reviews after (focuses on logic and architecture)</li>
            </ul>
            <p><strong>Tools:</strong> GitHub Copilot PR reviews, CodeRabbit, custom OpenAI-based reviewers with project-specific rules.</p>`
        },
        {
            title: 'AI Test Generation',
            content: `<p>AI excels at generating test boilerplate and edge cases you might miss:</p>`,
            code: `// Prompt pattern for AI test generation:
// "Generate unit tests for this method using xUnit and Moq.
//  Include: happy path, null inputs, boundary values,
//  exception cases, and concurrent access scenarios."

public class OrderServiceTests
{
    // AI-generated test (then human-reviewed):
    [Fact]
    public async Task PlaceOrder_WithInsufficientStock_ThrowsOutOfStockException()
    {
        // Arrange
        var mockRepo = new Mock<IInventoryRepository>();
        mockRepo.Setup(r => r.GetStockAsync("SKU-123"))
                .ReturnsAsync(0); // No stock

        var service = new OrderService(mockRepo.Object);
        var order = new Order { Sku = "SKU-123", Quantity = 5 };

        // Act & Assert
        await Assert.ThrowsAsync<OutOfStockException>(
            () => service.PlaceOrderAsync(order));

        mockRepo.Verify(r => r.ReserveStockAsync(It.IsAny<string>(), It.IsAny<int>()),
            Times.Never); // Should not attempt reservation
    }

    // AI is great at generating edge cases humans forget:
    [Theory]
    [InlineData(0)]    // Zero quantity
    [InlineData(-1)]   // Negative quantity
    [InlineData(int.MaxValue)] // Overflow risk
    public async Task PlaceOrder_WithInvalidQuantity_ThrowsValidationException(int qty)
    {
        var service = new OrderService(Mock.Of<IInventoryRepository>());
        var order = new Order { Sku = "SKU-123", Quantity = qty };

        await Assert.ThrowsAsync<ValidationException>(
            () => service.PlaceOrderAsync(order));
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Limitations & Anti-Patterns',
            content: `<ul>
                <li><strong>Blindly accepting AI output</strong> &mdash; AI makes plausible-looking mistakes. ALWAYS review.</li>
                <li><strong>Using AI for architectural decisions</strong> &mdash; AI does not know your business context, team, or constraints. YOU decide architecture.</li>
                <li><strong>Copy-paste without understanding</strong> &mdash; If you cannot explain what the AI-generated code does, you cannot maintain or debug it.</li>
                <li><strong>AI-generated tests that test nothing</strong> &mdash; AI can generate tests that pass but do not actually verify behavior. Check assertions are meaningful.</li>
                <li><strong>Leaking proprietary code</strong> &mdash; Be aware of what goes to external AI services. Use enterprise-approved tools with data retention policies.</li>
                <li><strong>Over-reliance killing skills</strong> &mdash; If you cannot write code without AI, you cannot debug production at 3am when the AI is down.</li>
            </ul>`,
            callout: { type: 'warning', title: 'The Golden Rule', text: 'AI is a power tool, not a replacement for engineering judgment. Use it to go faster on things you COULD do yourself. Never ship code you do not understand, regardless of who (or what) wrote it.' }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>AI applies to every SDLC phase: requirements through monitoring</li>
                <li>Best productivity: AI handles boilerplate/repetitive, you handle decisions/edge cases</li>
                <li>AI code review + human code review together catches more than either alone</li>
                <li>Always review AI output critically &mdash; plausible does not mean correct</li>
                <li>Use enterprise-approved tools for proprietary code (data retention matters)</li>
                <li>Test-first prompting: write test, let AI implement. Best quality pattern.</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'ai-dev-q1',
            level: 'mid',
            title: 'How do you use AI tools effectively without becoming dependent on them?',
            answer: `<p><strong>Balance strategy:</strong></p><ul><li>Use AI for the boring 60% (boilerplate, repetitive patterns, test scaffolding, docs) so you have energy for the interesting 40%</li><li>Understand everything AI generates before committing &mdash; if you cannot explain it, rewrite it</li><li>Periodically code without AI to maintain skills (especially during interviews)</li><li>Use AI to LEARN: ask it to explain unfamiliar patterns, then internalize them</li><li>AI augments; it does not replace judgment on architecture, security, and business logic</li></ul>`
        },
        {
            id: 'ai-dev-q2',
            level: 'senior',
            title: 'How would you introduce AI coding tools to an enterprise development team?',
            answer: `<p><strong>Rollout strategy:</strong></p><ol><li><strong>Security review:</strong> Evaluate data retention policies (does code leave your network?). Get legal/security approval.</li><li><strong>Pilot team:</strong> Start with 1 willing team for 4 weeks. Measure: velocity, quality, satisfaction.</li><li><strong>Guidelines:</strong> Document what AI can/cannot be used for (no proprietary algorithms, no customer data in prompts).</li><li><strong>Training:</strong> Workshop on effective prompting (most devs just accept first suggestion).</li><li><strong>Metrics:</strong> Track PR throughput, bug rate, developer satisfaction. Not lines of code.</li><li><strong>Expand:</strong> Share pilot results, roll out to more teams with lessons learned.</li></ol>`
        },
        {
            id: 'ai-dev-q3',
            level: 'lead',
            title: 'What are the risks of AI-generated code in production?',
            answer: `<p><strong>Risks:</strong></p><ul><li><strong>Subtle bugs:</strong> AI code looks correct but has logic errors (off-by-one, wrong null handling, race conditions)</li><li><strong>Security vulnerabilities:</strong> AI may generate insecure patterns (SQL string concat, hardcoded secrets, missing input validation)</li><li><strong>License contamination:</strong> AI may reproduce copyrighted code from training data (legal risk)</li><li><strong>Outdated patterns:</strong> AI trained on old data may suggest deprecated APIs or insecure practices</li><li><strong>Knowledge gap:</strong> Developer ships code they do not fully understand, cannot debug later</li></ul><p><strong>Mitigation:</strong> Mandatory code review (human), SAST/DAST scanning, license scanning (e.g., FOSSA), and a culture where AI output is treated as a draft, not a final product.</p>`
        },
        {
            id: 'ai-dev-q4',
            level: 'mid',
            title: 'Compare GitHub Copilot and Cursor for daily development work.',
            answer: `<p><strong>Copilot:</strong> Best for inline completions while you type. Lightweight, low-friction, good for: finishing lines, generating boilerplate, suggesting next steps. Limited multi-file awareness.</p><p><strong>Cursor:</strong> Best for larger edits: refactoring across files, applying changes from chat, codebase-aware context. More agent-like: you describe what you want and it applies changes. Higher learning curve but more powerful for complex tasks.</p><p><strong>Both together:</strong> Many devs use Copilot for line-by-line flow and Cursor/AI chat for bigger refactoring or exploration tasks. They complement rather than compete.</p>`
        },
        {
            id: 'ai-dev-q5',
            level: 'senior',
            title: 'How do you use AI to improve code review quality?',
            answer: `<p><strong>Two-pass review process:</strong></p><ol><li><strong>AI first pass:</strong> Catches mechanical issues (unused variables, null risks, missing error handling, security anti-patterns, style violations). Saves human reviewer time.</li><li><strong>Human second pass:</strong> Focuses on what AI cannot judge: architectural fit, business logic correctness, naming quality, performance implications at scale, team conventions.</li></ol><p><strong>Custom AI reviewer:</strong> Feed your team style guide and architecture rules into the AI prompt. It will catch project-specific violations (e.g., "all repositories must use IUnitOfWork").</p>`
        },
        {
            id: 'ai-dev-q6',
            level: 'architect',
            title: 'How does AI change the role of a senior engineer?',
            answer: `<p><strong>What stays the same:</strong> Architecture decisions, trade-off analysis, mentoring, production debugging, business domain understanding, stakeholder communication.</p><p><strong>What changes:</strong></p><ul><li>Less time writing boilerplate &rarr; more time on design and review</li><li>AI handles first-draft code &rarr; senior role shifts to reviewer/editor</li><li>Faster prototyping &rarr; more time exploring options before committing</li><li>AI generates tests &rarr; senior ensures tests are meaningful and edge cases covered</li></ul><p><strong>New responsibilities:</strong> Prompt engineering skill, evaluating AI output quality, setting AI usage guidelines for team, understanding AI limitations and knowing when NOT to use it.</p>`
        },
        {
            id: 'ai-dev-q7',
            level: 'mid',
            title: 'What is the test-first prompting pattern?',
            answer: `<p><strong>Test-first prompting:</strong> Write the test manually, then ask AI to generate the implementation that makes it pass. This is TDD with AI as the implementer.</p><p><strong>Why it works:</strong></p><ul><li>Tests define exact behavior expected (unambiguous specification)</li><li>AI has a clear target (make tests pass) vs vague "write a service"</li><li>You maintain control over WHAT the code should do</li><li>AI handles HOW (implementation details, boilerplate)</li><li>Tests are already written, so you verify AI output immediately</li></ul><p><strong>Pattern:</strong> Write test &rarr; Prompt: "Implement the class that makes this test pass" &rarr; Run test &rarr; Refine.</p>`
        },
        {
            id: 'ai-dev-q8',
            level: 'lead',
            title: 'How do you measure the ROI of AI coding tools for your team?',
            answer: `<p><strong>Metrics to track (before/after AI adoption):</strong></p><ul><li><strong>PR throughput:</strong> PRs merged per developer per week (expect +20-40%)</li><li><strong>Time to first commit:</strong> How quickly devs start new tasks (expect improvement on unfamiliar areas)</li><li><strong>Bug rate:</strong> Bugs per PR (should NOT increase &mdash; if it does, review process needs strengthening)</li><li><strong>Developer satisfaction:</strong> Survey &mdash; do devs feel more productive? Less frustrated?</li><li><strong>Test coverage:</strong> Often improves (AI generates tests devs would not have written)</li></ul><p><strong>What NOT to measure:</strong> Lines of code (Goodhart's Law). Time saved per task (unreliable self-reporting). Raw velocity (might mean shipping more bugs faster).</p>`
        }
    ]
});
