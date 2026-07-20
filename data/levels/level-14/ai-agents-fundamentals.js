/* Level 14 - AI Engineering: AI Agents Fundamentals */
'use strict';
PageData.register('ai-agents-fundamentals', {
    "title": "AI Agents Fundamentals",
    "description": "Planning, reflection, memory, workflow agents, autonomous agents, human-in-the-loop",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>AI agents are LLM-powered systems that can plan, use tools, reflect on results, and iteratively work toward goals. They go beyond single prompt-response to multi-step autonomous task completion.</p>"
        },
        {
            "title": "What Are Agents",
            "content": "<p>An agent = LLM + Tools + Memory + Planning loop. The LLM reasons about what to do next, selects tools, evaluates results, and decides whether to continue or return. Key difference from chains: agents make dynamic decisions.</p>",
            "mermaid": "graph TD\n Goal[User Goal] --> Plan[Plan Steps]\n Plan --> Act[Execute Tool]\n Act --> Observe[Observe Result]\n Observe --> Reflect{Goal met?}\n Reflect -->|No| Plan\n Reflect -->|Yes| Return[Return Answer]"
        },
        {
            "title": "Planning",
            "content": "<p>Decompose complex tasks into sub-tasks. Methods: ReAct (Reason+Act), Plan-and-Execute (plan all steps first), Tree of Thought (explore multiple paths). Planning quality determines agent success.</p>"
        },
        {
            "title": "Reflection",
            "content": "<p>Agent evaluates its own output quality. Self-critique: is the answer correct? complete? Does it need another attempt? Reflection loops improve output quality at cost of more LLM calls.</p>"
        },
        {
            "title": "Memory",
            "content": "<p><strong>Short-term</strong>: conversation context within a task. <strong>Long-term</strong>: persistent knowledge across sessions (vector store, summaries). <strong>Working memory</strong>: scratchpad for current reasoning.</p>"
        },
        {
            "title": "Workflow vs Autonomous Agents",
            "content": "<p>Workflow agents: predefined steps, deterministic flow, reliable. Autonomous agents: dynamic planning, creative, unpredictable. Most production systems use workflow agents for reliability.</p>",
            "table": {
                "headers": [
                    "Type",
                    "Planning",
                    "Reliability",
                    "Use Case"
                ],
                "rows": [
                    [
                        "Workflow",
                        "Predefined",
                        "High",
                        "Known processes"
                    ],
                    [
                        "Autonomous",
                        "Dynamic",
                        "Variable",
                        "Exploration"
                    ],
                    [
                        "Hybrid",
                        "Structured + flexible",
                        "Medium-High",
                        "Complex but bounded"
                    ]
                ]
            }
        },
        {
            "title": "Human-in-the-Loop",
            "content": "<p>Agent pauses for human approval at critical points. Patterns: approve before action, review before submit, escalation on uncertainty. Balances autonomy with safety.</p>"
        },
        {
            "title": "Common Mistakes",
            "content": "",
            "callout": {
                "type": "warning",
                "title": "Agent Pitfalls",
                "text": "<ul><li>Too much autonomy without guardrails</li><li>No cost limits (infinite loops)</li><li>Agents calling agents without depth limits</li><li>No observability into agent reasoning</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>Agent vs chain vs simple prompt</li><li>When agents are overkill</li><li>Planning strategies</li><li>Safety and guardrails</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "What is an AI agent?",
            "answer": "<p>LLM + tools + memory + planning loop. Makes dynamic decisions about what tool to use and when, iterates until goal is met. Beyond single prompt-response.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "ReAct pattern?",
            "answer": "<p>Reason + Act: model thinks about what to do (reasoning trace), takes action (tool call), observes result, repeats. Interleaves thinking and doing.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "Agent memory types?",
            "answer": "<p>Short-term: current conversation. Long-term: persistent across sessions (vector store). Working: scratchpad for current task reasoning.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Workflow vs autonomous agents?",
            "answer": "<p>Workflow: predefined steps, reliable, bounded. Autonomous: dynamic planning, creative, unpredictable. Production prefers workflow for reliability. Hybrid combines both.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "Agent safety patterns?",
            "answer": "<p>Human approval gates, cost/step limits, tool permission scoping, output validation, depth limits for nested agents, kill switch.</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "Design agent for complex workflow?",
            "answer": "<p>Decompose into workflow agent with defined steps. Each step can be agentic (tool selection). Human gates at irreversible actions. Observability at every step. Graceful failure modes.</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "Multi-agent production system?",
            "answer": "<p>Orchestrator agent delegates to specialist agents. Message passing protocol. Shared memory/context. Hierarchical planning. Cost budgets per agent. Timeout and fallback strategies.</p>"
        }
    ]
});
