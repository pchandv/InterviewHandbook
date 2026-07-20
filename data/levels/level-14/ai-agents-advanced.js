/* Level 14 - AI Engineering: AI Agents Advanced */
'use strict';
PageData.register('ai-agents-advanced', {
    "title": "AI Agents Advanced",
    "description": "Multi-agent systems, A2A communication, guardrails, frameworks, orchestration",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Advanced agent patterns involve multiple agents collaborating, communicating via protocols, operating within guardrails, and being orchestrated by frameworks like AutoGen, CrewAI, or custom systems.</p>"
        },
        {
            "title": "Multi-Agent Systems",
            "content": "<p>Multiple specialized agents collaborating on complex tasks. Patterns: supervisor (one coordinates), peer-to-peer (agents communicate directly), hierarchical (tree of agents).</p>",
            "mermaid": "graph TD\n Orch[Orchestrator Agent] --> R[Research Agent]\n Orch --> W[Writer Agent]\n Orch --> Rev[Reviewer Agent]\n R --> Orch\n W --> Orch\n Rev --> Orch"
        },
        {
            "title": "Agent-to-Agent Communication",
            "content": "<p>A2A protocol for inter-agent messaging. Agent Cards describe capabilities. Task delegation with context passing. Standardized message format for interoperability.</p>"
        },
        {
            "title": "Guardrails",
            "content": "<p>Input guardrails: detect prompt injection, validate requests. Output guardrails: check for PII, harmful content, off-topic responses. Structural guardrails: cost limits, step limits, tool restrictions.</p>"
        },
        {
            "title": "Agent Frameworks",
            "content": "<p>AutoGen (Microsoft): multi-agent conversations. CrewAI: role-based agents with tasks. LangGraph: stateful agent graphs. Semantic Kernel: .NET-native with plugins. Choose based on language/complexity/team.</p>",
            "table": {
                "headers": [
                    "Framework",
                    "Language",
                    "Strength",
                    "Best For"
                ],
                "rows": [
                    [
                        "AutoGen",
                        "Python",
                        "Multi-agent chat",
                        "Research tasks"
                    ],
                    [
                        "CrewAI",
                        "Python",
                        "Role-based crews",
                        "Structured workflows"
                    ],
                    [
                        "LangGraph",
                        "Python",
                        "State machines",
                        "Complex flows"
                    ],
                    [
                        "Semantic Kernel",
                        ".NET/Python",
                        "Enterprise",
                        "Production .NET"
                    ]
                ]
            }
        },
        {
            "title": "Orchestration Patterns",
            "content": "<p>Sequential (pipeline), parallel (fan-out/fan-in), conditional (routing), iterative (refine until quality). State management across agent interactions.</p>",
            "mermaid": "graph LR\n subgraph Sequential\n S1[Agent 1] --> S2[Agent 2] --> S3[Agent 3]\n end\n subgraph Parallel\n P[Router] --> PA[Agent A]\n P --> PB[Agent B]\n PA --> Merge\n PB --> Merge\n end"
        },
        {
            "title": "Production Concerns",
            "content": "<p>Cost tracking per agent, timeout management, error recovery (retry vs escalate), observability (trace agent decisions), rate limiting nested calls.</p>"
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>When multi-agent vs single agent</li><li>Guardrail design</li><li>Framework selection criteria</li><li>Cost management for agents</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "mid",
            "title": "When use multi-agent vs single?",
            "answer": "<p>Multi-agent: complex tasks needing different expertise, long workflows, parallel sub-tasks. Single: focused tasks, simple tools, cost-sensitive scenarios.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "What are guardrails?",
            "answer": "<p>Safety boundaries: input validation (block injection), output checking (PII, harmful), structural (cost/step limits, tool restrictions). Prevent misuse and runaway agents.</p>"
        },
        {
            "id": "q3",
            "level": "senior",
            "title": "Agent framework selection?",
            "answer": "<p>Consider: language (.NET = SK, Python = all), complexity (simple = LangChain, complex = LangGraph), team size, production requirements, vendor lock-in tolerance.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Multi-agent error handling?",
            "answer": "<p>Per-agent retry with backoff, fallback to simpler approach, escalation to human, graceful degradation (return partial result), circuit breaker on repeated failures.</p>"
        },
        {
            "id": "q5",
            "level": "lead",
            "title": "Design multi-agent code review system?",
            "answer": "<p>Agents: Code Analyzer (patterns/bugs), Security Scanner, Performance Reviewer, Style Checker. Orchestrator merges findings. Human approves final review. Parallel execution for speed.</p>"
        },
        {
            "id": "q6",
            "level": "architect",
            "title": "Enterprise multi-agent platform?",
            "answer": "<p>Agent registry with capabilities, permission model, cost allocation per team, shared memory/context store, audit trail, A/B testing agent configurations, graceful degradation.</p>"
        }
    ]
});
