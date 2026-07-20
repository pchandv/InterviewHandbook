/* Level 14 - AI Engineering: LangChain and LangGraph */
'use strict';
PageData.register('langchain-concepts', {
    "title": "LangChain and LangGraph",
    "description": "Chains, agents, graph workflows, state machines, orchestration, multi-agent",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>LangChain provides abstractions for building LLM applications (chains, agents, tools). LangGraph extends it with stateful, graph-based workflows for complex multi-step agent systems.</p>"
        },
        {
            "title": "Chains",
            "content": "<p>Sequential composition of LLM calls, tools, and transformations. Simple chain: prompt template + LLM + output parser. LCEL (LangChain Expression Language) for declarative chaining.</p>"
        },
        {
            "title": "Agents in LangChain",
            "content": "<p>LLM decides which tools to use. ReAct agent, OpenAI functions agent, structured chat agent. Agent loop: think, act, observe, repeat until done.</p>",
            "mermaid": "graph LR\n Input --> Agent[Agent LLM]\n Agent --> Tool1[Search]\n Agent --> Tool2[Calculator]\n Agent --> Tool3[Code]\n Tool1 --> Agent\n Tool2 --> Agent\n Tool3 --> Agent\n Agent --> Output"
        },
        {
            "title": "LangGraph",
            "content": "<p>Graph-based orchestration for complex workflows. Nodes = functions/agents. Edges = transitions (conditional/unconditional). State persists across nodes. Enables: loops, branching, human-in-loop, checkpointing.</p>",
            "mermaid": "graph TD\n Start --> Research[Research Node]\n Research --> Decide{Quality OK?}\n Decide -->|Yes| Write[Write Node]\n Decide -->|No| Research\n Write --> Review[Review Node]\n Review --> End"
        },
        {
            "title": "State Management",
            "content": "<p>LangGraph state: typed dictionary passed between nodes. Each node reads/writes state. Checkpointing enables: resume after failure, time-travel debugging, human approval points.</p>"
        },
        {
            "title": "Multi-Agent Patterns",
            "content": "<p>Supervisor pattern: one agent routes to specialists. Collaborative: agents pass work product between each other. Hierarchical: tree of agents with escalation.</p>"
        },
        {
            "title": "When to Use What",
            "content": "<p>Simple chain: linear A to B to C. Agent: dynamic tool selection. LangGraph: complex flows with loops, branching, state, human-in-loop. Dont over-engineer simple tasks.</p>",
            "table": {
                "headers": [
                    "Pattern",
                    "Complexity",
                    "Use Case"
                ],
                "rows": [
                    [
                        "Chain",
                        "Low",
                        "Linear transformations"
                    ],
                    [
                        "Agent",
                        "Medium",
                        "Dynamic tool use"
                    ],
                    [
                        "LangGraph",
                        "High",
                        "Complex stateful workflows"
                    ],
                    [
                        "Multi-Agent",
                        "Very High",
                        "Specialized collaboration"
                    ]
                ]
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>Chain vs agent vs graph</li><li>State management in LangGraph</li><li>When graphs are overkill</li><li>Comparison with Semantic Kernel</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "What is LangChain?",
            "answer": "<p>Framework for building LLM applications. Provides: chains (sequential), agents (dynamic tool use), tools, memory, retrievers. Python and JavaScript.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "Chain vs Agent?",
            "answer": "<p>Chain: predefined sequential steps. Agent: LLM dynamically decides tools and order. Chain for known flows; agent for exploratory tasks.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "What is LangGraph?",
            "answer": "<p>Graph-based workflow engine built on LangChain. Nodes (functions), edges (transitions), state management, checkpointing. For complex stateful multi-step flows.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "LangGraph state and checkpointing?",
            "answer": "<p>Typed state dict persists across nodes. Checkpoints save state at each step. Enables: resume after failure, human-in-loop (pause/resume), time-travel debugging.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "LangChain vs Semantic Kernel?",
            "answer": "<p>LangChain: Python-first, larger ecosystem, more integrations, research-oriented. SK: .NET-first, enterprise, plugin architecture. LangChain for Python teams; SK for .NET shops.</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "When to use LangGraph vs simple agent?",
            "answer": "<p>LangGraph when: loops/retries needed, complex branching, persistent state, human approval gates, multi-agent coordination. Simple agent: single-pass tool use without loops.</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "Production LangGraph system?",
            "answer": "<p>Persistent checkpointing (Redis/Postgres), observability (LangSmith), error recovery strategies, cost budgets per graph execution, A/B testing graph topologies.</p>"
        }
    ]
});
