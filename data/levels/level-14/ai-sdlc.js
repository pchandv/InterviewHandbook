/* Level 14 - AI Engineering: AI in the SDLC */
'use strict';
PageData.register('ai-sdlc', {
    "title": "AI in the SDLC",
    "description": "AI-assisted requirements, design, coding, testing, documentation, deployment, and monitoring",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>AI transforms every phase of the Software Development Lifecycle. From requirements gathering through monitoring, AI tools augment human judgment to increase speed and quality.</p>"
        },
        {
            "title": "AI in Requirements",
            "content": "<p>Analyze user stories for ambiguity, generate acceptance criteria, identify missing requirements, create user personas, suggest edge cases from similar systems.</p>"
        },
        {
            "title": "AI in Design",
            "content": "<p>Generate architecture diagrams from descriptions, suggest design patterns for problems, review designs for anti-patterns, create API specifications from natural language.</p>"
        },
        {
            "title": "AI in Coding",
            "content": "<p>Code completion, generation from specs, refactoring suggestions, boilerplate automation. Most mature AI application in SDLC.</p>"
        },
        {
            "title": "AI in Testing",
            "content": "<p>Generate test cases from requirements, create test data, identify untested paths, mutation testing suggestions, visual regression detection.</p>"
        },
        {
            "title": "AI in Documentation",
            "content": "<p>Generate API docs from code, create README files, write inline comments, maintain changelogs, create architecture decision records.</p>"
        },
        {
            "title": "AI in Operations",
            "content": "<p>Anomaly detection, root cause analysis, auto-remediation suggestions, capacity planning, incident summarization, runbook generation.</p>",
            "mermaid": "graph LR\n Req[Requirements] --> Design\n Design --> Code\n Code --> Test\n Test --> Deploy\n Deploy --> Monitor\n Monitor --> Req\n style Req fill:#e1f5fe\n style Code fill:#e1f5fe"
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>Which SDLC phases benefit most from AI?</li><li>AI limitations in each phase</li><li>Human oversight requirements</li><li>Measuring AI impact on quality</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "Where can AI help in SDLC?",
            "answer": "<p>Every phase: requirements analysis, design suggestions, code generation, test creation, documentation, deployment automation, monitoring anomaly detection.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "AI limitations in testing?",
            "answer": "<p>Cant validate business intent (only structure), may generate tests that pass but dont verify behavior, needs human review for completeness, struggles with integration context.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "AI for documentation?",
            "answer": "<p>Generate API docs from code, inline comments, README creation, changelogs from commits. Limitation: cant know why decisions were made without context.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Measuring AI ROI in development?",
            "answer": "<p>Track: cycle time, bug escape rate, test coverage delta, documentation freshness, developer satisfaction. Compare teams with/without AI tools.</p>"
        },
        {
            "id": "q5",
            "level": "lead",
            "title": "AI adoption across SDLC phases?",
            "answer": "<p>Start with highest-impact/lowest-risk: code completion, test generation, documentation. Then: design review, requirements analysis. Last: autonomous deployment decisions.</p>"
        },
        {
            "id": "q6",
            "level": "architect",
            "title": "AI-native development process?",
            "answer": "<p>Spec-driven with AI generation, continuous AI review in CI, AI-generated tests as quality gate, AI monitoring with auto-remediation, human governance at decision points.</p>"
        }
    ]
});
