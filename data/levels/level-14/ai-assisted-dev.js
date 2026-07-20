/* Level 14 - AI Engineering: AI-Assisted Development */
'use strict';
PageData.register('ai-assisted-dev', {
    "title": "AI-Assisted Development",
    "description": "Copilot, ChatGPT, Claude, AI code review, test generation, refactoring, debugging",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>AI-assisted development transforms how engineers write, review, test, and debug code. Tools like GitHub Copilot, ChatGPT, and Claude augment developer productivity when used effectively.</p>"
        },
        {
            "title": "Code Generation Tools",
            "content": "<p>GitHub Copilot (IDE inline), ChatGPT/Claude (conversational), Cursor (AI-native editor), Amazon Q. Each has different strengths: Copilot for flow-state completion, chat models for complex design questions.</p>"
        },
        {
            "title": "AI Code Review",
            "content": "<p>AI identifies: bugs, security issues, performance problems, style violations, missing tests. Best as first-pass before human review. Limitations: context window, cant understand full system architecture.</p>"
        },
        {
            "title": "AI Test Generation",
            "content": "<p>Generate unit tests, edge cases, integration test scaffolds. Effective for: increasing coverage, finding boundary conditions, generating test data. Always review: AI tests may not test the right things.</p>"
        },
        {
            "title": "AI Refactoring",
            "content": "<p>Rename, extract method, simplify logic, modernize patterns. AI understands intent better than regex-based tools. Provide context about desired architecture for best results.</p>"
        },
        {
            "title": "AI Debugging",
            "content": "<p>Paste error + code, get diagnosis. Explain complex stack traces. Suggest fixes with reasoning. Effective for unfamiliar frameworks and cryptic error messages.</p>"
        },
        {
            "title": "Best Practices",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Effective AI Usage",
                "text": "<ul><li>Always review AI output (dont blindly accept)</li><li>Provide context (requirements, constraints)</li><li>Use for acceleration not replacement</li><li>Understand what AI generates</li><li>Keep security awareness (dont paste secrets)</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>How do you use AI in your workflow?</li><li>When is AI NOT appropriate?</li><li>How do you validate AI-generated code?</li><li>Impact on code review process</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "How do you use AI tools in development?",
            "answer": "<p>Code completion (Copilot), understanding unfamiliar code, generating boilerplate, writing tests, debugging errors, learning new APIs/frameworks.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "Risks of AI-generated code?",
            "answer": "<p>Hallucinated APIs, security vulnerabilities, license issues from training data, subtle logic errors that look correct, over-reliance reducing understanding.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "AI for code review?",
            "answer": "<p>First-pass for bugs, security, style. Limitations: no system context, cant validate business logic, may miss architectural concerns. Augments not replaces human review.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "AI-assisted testing strategy?",
            "answer": "<p>Generate unit tests for uncovered code, edge case discovery, property-based test generation. Always review: verify tests actually validate behavior not just cover lines.</p>"
        },
        {
            "id": "q5",
            "level": "lead",
            "title": "AI adoption strategy for engineering team?",
            "answer": "<p>Pilot with willing team, measure productivity impact, establish guidelines (security, review requirements), training on effective prompting, share patterns that work.</p>"
        },
        {
            "id": "q6",
            "level": "architect",
            "title": "AI code generation governance?",
            "answer": "<p>Security scanning AI output, license compliance checks, mandatory review for AI-generated code, dont commit without understanding, enterprise tool selection with data policies.</p>"
        }
    ]
});
