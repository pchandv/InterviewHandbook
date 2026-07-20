/* Level 14 - AI Engineering: AI System Architecture */
'use strict';
PageData.register('ai-architecture', {
    "title": "AI System Architecture",
    "description": "AI microservices, AI gateway, model routing, fallback models, observability, security",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Production AI systems require thoughtful architecture: centralized gateways for routing and policy, model selection strategies, caching for cost/latency, observability for debugging, and security layers for protection.</p>"
        },
        {
            "title": "AI Gateway Pattern",
            "content": "<p>Centralized proxy between applications and LLM providers. Handles: authentication, rate limiting, cost tracking, model routing, caching, logging, retry/fallback. Single point of control and observability.</p>",
            "mermaid": "graph TD\n App1[App 1] --> GW[AI Gateway]\n App2[App 2] --> GW\n App3[App 3] --> GW\n GW --> GPT4[GPT-4]\n GW --> Claude[Claude]\n GW --> Local[Local Model]\n GW --> Cache[Response Cache]"
        },
        {
            "title": "Model Routing",
            "content": "<p>Route requests to appropriate model based on: task complexity, cost sensitivity, latency requirements, content type. Simple classification routes cheap requests to fast models.</p>"
        },
        {
            "title": "Caching Strategies",
            "content": "<p>Exact match cache (same prompt = cached response). Semantic cache (similar prompts). Prompt-level cache (reuse system prompt processing). Significant cost savings for repeated patterns.</p>"
        },
        {
            "title": "Fallback and Resilience",
            "content": "<p>Primary model unavailable: fallback to alternative. Circuit breaker per provider. Graceful degradation: return cached or simplified response. Never let AI failure break the application.</p>"
        },
        {
            "title": "AI Observability",
            "content": "<p>Track: latency per request, token usage, cost per request/user, quality scores, error rates, model distribution. Custom metrics beyond standard APM.</p>"
        },
        {
            "title": "AI Security",
            "content": "<p>Input: prompt injection detection, PII redaction before sending. Output: content filtering, PII detection in responses. Access: per-user rate limits, model access policies.</p>",
            "mermaid": "graph LR\n Input --> PII[PII Redactor]\n PII --> Injection[Injection Detector]\n Injection --> LLM\n LLM --> Filter[Content Filter]\n Filter --> PIIOut[PII Check Output]\n PIIOut --> Response"
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>Gateway pattern benefits</li><li>Model routing strategies</li><li>Cost optimization</li><li>Security layers for AI</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "mid",
            "title": "What is an AI gateway?",
            "answer": "<p>Centralized proxy: auth, rate limiting, routing, caching, logging, fallback. Single control point for all AI interactions across applications.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "Semantic caching?",
            "answer": "<p>Cache responses for semantically similar (not just identical) prompts. Embed queries, find similar cached, return if similarity above threshold. Saves cost on repeated concepts.</p>"
        },
        {
            "id": "q3",
            "level": "senior",
            "title": "Model routing strategy?",
            "answer": "<p>Classify request complexity/type, route to appropriate model. Simple queries to fast/cheap, complex to powerful. Based on: token count, topic, required quality, cost budget.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "AI security architecture?",
            "answer": "<p>Layers: input PII redaction, prompt injection detection, model-level content filtering, output PII scanning, response validation, per-user access control and rate limits.</p>"
        },
        {
            "id": "q5",
            "level": "lead",
            "title": "AI cost management?",
            "answer": "<p>Per-team budgets, model routing by cost, caching (exact + semantic), token optimization, batch processing for non-urgent, alerts on spend spikes, chargeback model.</p>"
        },
        {
            "id": "q6",
            "level": "architect",
            "title": "Enterprise AI platform design?",
            "answer": "<p>AI gateway (routing, policy), model registry, prompt management, cost allocation, security layers (PII, injection), observability, multi-tenant isolation, compliance audit.</p>"
        }
    ]
});
