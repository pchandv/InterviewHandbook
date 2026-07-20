/* Level 14 - AI Engineering: Responsible AI */
'use strict';
PageData.register('responsible-ai', {
    "title": "Responsible AI",
    "description": "Hallucinations, prompt injection, jailbreaks, PII protection, bias, governance, guardrails",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Responsible AI ensures AI systems are safe, fair, transparent, and trustworthy. Covers threats (injection, hallucination), protections (guardrails, PII handling), and governance (policies, compliance).</p>"
        },
        {
            "title": "Hallucinations",
            "content": "<p>Models generate plausible but false content. Mitigation: RAG grounding, fact-checking pipelines, confidence scoring, constrained generation, source attribution. Never trust LLM output for critical decisions without verification.</p>"
        },
        {
            "title": "Prompt Injection",
            "content": "<p>Attacker embeds instructions in user input to override system prompt. Direct (user types instructions) and indirect (malicious content in retrieved documents). Defense: input sanitization, instruction hierarchy, output validation.</p>",
            "mermaid": "graph TD\n User[User Input] --> Check{Injection Detection}\n Check -->|Clean| LLM\n Check -->|Suspicious| Block[Block/Sanitize]\n LLM --> Validate{Output Valid?}\n Validate -->|Yes| Response\n Validate -->|No| Fallback[Safe Fallback]"
        },
        {
            "title": "Jailbreaks",
            "content": "<p>Techniques to bypass model safety training. Defense-in-depth: system prompt hardening, output filtering, behavioral monitoring, model updates. No single defense is sufficient.</p>"
        },
        {
            "title": "PII Protection",
            "content": "<p>Detect and redact PII before sending to LLM. On output: scan for inadvertent PII exposure. Techniques: regex patterns, NER models, data masking, tokenization.</p>"
        },
        {
            "title": "Bias and Fairness",
            "content": "<p>Models reflect training data biases. Audit outputs for demographic bias. Test with diverse inputs. Provide bias documentation. Human review for high-stakes decisions.</p>"
        },
        {
            "title": "Governance Framework",
            "content": "<p>AI usage policies, model approval process, risk assessment per use case, incident response for AI failures, regular audits, compliance documentation.</p>"
        },
        {
            "title": "Guardrails Implementation",
            "content": "<p>Input guardrails (validate, sanitize, detect threats). Output guardrails (filter harmful content, check factuality, enforce format). Structural guardrails (cost limits, rate limits, scope restrictions).</p>",
            "mermaid": "graph LR\n Input --> IG[Input Guardrails]\n IG --> Model[AI Model]\n Model --> OG[Output Guardrails]\n OG --> User[Safe Response]\n IG -.->|Block| Reject[Rejected]\n OG -.->|Block| Fallback[Fallback]"
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>Prompt injection defense strategies</li><li>PII handling in AI pipelines</li><li>Governance framework components</li><li>Testing for bias</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "What are hallucinations?",
            "answer": "<p>LLMs generating plausible but factually incorrect content. They dont know what they dont know. Mitigate with RAG, fact-checking, confidence scores.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "What is prompt injection?",
            "answer": "<p>Attacker puts instructions in input to override system prompt. Direct: user types it. Indirect: malicious content in documents retrieved by RAG. Defense: detection + sanitization + output validation.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "PII protection in AI systems?",
            "answer": "<p>Detect PII before sending to model (regex, NER). Redact or mask. On output: scan for leaked PII. Never send unnecessary personal data to external models.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Guardrail architecture?",
            "answer": "<p>Three layers: input (validate, detect injection, block harmful), output (filter content, check accuracy, format validation), structural (cost/rate limits, tool restrictions, timeout).</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "Testing for prompt injection?",
            "answer": "<p>Red team with known attack patterns, automated fuzzing, indirect injection via documents, jailbreak attempts, boundary testing. Continuous testing as models update.</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "AI governance framework?",
            "answer": "<p>Use case risk tiers, model approval process, data handling policies, incident response playbook, regular bias audits, compliance documentation, responsible AI training for teams.</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "Defense-in-depth for AI?",
            "answer": "<p>Input sanitization + system prompt hardening + model safety training + output filtering + behavioral monitoring + human review for high-stakes + audit logging + circuit breakers.</p>"
        }
    ]
});
