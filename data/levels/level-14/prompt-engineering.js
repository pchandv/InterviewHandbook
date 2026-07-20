/* Level 14 - AI Engineering: Prompt Engineering */
'use strict';
PageData.register('prompt-engineering', {
    "title": "Prompt Engineering",
    "description": "Zero/few-shot, Chain of Thought, role prompting, structured outputs, prompt chaining and versioning",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Prompt engineering is the art and science of crafting inputs to LLMs to get reliable, high-quality outputs. From basic techniques (zero-shot) to advanced patterns (chain-of-thought, tree-of-thought), mastering prompts is essential for AI engineers.</p>"
        },
        {
            "title": "Zero, One, and Few-Shot",
            "content": "<p><strong>Zero-shot</strong>: no examples, rely on instruction. <strong>One-shot</strong>: one example to set pattern. <strong>Few-shot</strong>: multiple examples for complex patterns. More examples = more consistent but more tokens.</p>"
        },
        {
            "title": "Chain of Thought",
            "content": "<p>Ask model to reason step-by-step before answering. Dramatically improves accuracy on math, logic, and multi-step problems. Variants: auto-CoT, let-me-think, scratchpad.</p>",
            "mermaid": "graph LR\n Q[Question] --> CoT[Step 1 reasoning]\n CoT --> S2[Step 2 reasoning]\n S2 --> S3[Step 3 reasoning]\n S3 --> A[Final Answer]"
        },
        {
            "title": "Role Prompting",
            "content": "<p>Assign a persona/role to shape response style and expertise. System message defines behavior constraints. Effective for consistent tone and domain expertise.</p>"
        },
        {
            "title": "Structured Outputs",
            "content": "<p>Force JSON/XML/specific format responses. Techniques: format instructions, JSON mode, function calling, output parsers. Essential for programmatic consumption of LLM outputs.</p>"
        },
        {
            "title": "Prompt Chaining",
            "content": "<p>Break complex tasks into sequential prompts where output of one feeds into next. Enables: verification steps, progressive refinement, modular prompt design, easier debugging.</p>",
            "mermaid": "graph LR\n P1[Extract entities] --> P2[Classify intent]\n P2 --> P3[Generate response]\n P3 --> P4[Validate output]"
        },
        {
            "title": "Prompt Versioning",
            "content": "<p>Treat prompts like code: version control, A/B testing, regression testing, performance tracking. Prompt registries for team collaboration.</p>"
        },
        {
            "title": "Common Mistakes",
            "content": "",
            "callout": {
                "type": "warning",
                "title": "Anti-Patterns",
                "text": "<ul><li>Vague instructions (be specific)</li><li>Too many instructions at once</li><li>No output format specification</li><li>Not testing edge cases</li><li>Ignoring token budget</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>When to use few-shot vs zero-shot</li><li>CoT for reasoning tasks</li><li>Structured output techniques</li><li>Prompt testing methodology</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "Zero-shot vs few-shot prompting?",
            "answer": "<p>Zero-shot: just instructions, no examples. Few-shot: provide examples of input-output pairs. Few-shot more reliable for complex/specific formats.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "What is Chain of Thought?",
            "answer": "<p>Asking model to show reasoning steps before final answer. Improves accuracy on logic/math. Add: Let me think step by step or show worked examples.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "How to get structured JSON output?",
            "answer": "<p>Methods: JSON mode flag, function calling (tool use), explicit format in prompt with examples, output parsers that retry on invalid JSON.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Prompt chaining design?",
            "answer": "<p>Decompose complex tasks into sequential prompts. Each step: focused, verifiable, debuggable. Pass context forward. Add validation between steps. Enables modular prompt engineering.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "Prompt versioning strategy?",
            "answer": "<p>Version control prompts like code. Track: input, output, metrics. A/B test variants. Regression test on golden datasets. Prompt registry for team sharing.</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "Design prompt testing pipeline?",
            "answer": "<p>Golden dataset of input/expected outputs. Automated evaluation (LLM-as-judge, metrics). CI/CD for prompt changes. Regression detection. Human review for subjective quality.</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "Prompt strategy for enterprise?",
            "answer": "<p>Prompt registry (shared, versioned), guardrails (input/output validation), cost tracking per prompt, tiered models by task complexity, caching for common patterns.</p>"
        }
    ]
});
