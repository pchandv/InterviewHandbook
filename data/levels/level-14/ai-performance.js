/* Level 14 - AI Engineering: AI Performance and Cost */
'use strict';
PageData.register('ai-performance', {
    "title": "AI Performance and Cost",
    "description": "Token optimization, cost management, latency, streaming, batching, caching, rate limits",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>AI system performance and cost optimization are critical for production viability. Token usage drives cost, latency affects UX, and smart architecture (caching, batching, model routing) dramatically reduces both.</p>"
        },
        {
            "title": "Token Optimization",
            "content": "<p>Every token costs money and adds latency. Strategies: concise system prompts, compress conversation history (summarize old messages), remove redundant context, use shorter model responses with structured output.</p>"
        },
        {
            "title": "Cost Management",
            "content": "<p>Track cost per: request, user, feature, team. Budget alerts. Model tiering: cheap model for simple tasks, expensive for complex. Caching eliminates repeated calls. Batch non-urgent requests.</p>",
            "mermaid": "graph TD\n Request --> Router{Complexity?}\n Router -->|Simple| Cheap[GPT-3.5 .001/1K]\n Router -->|Complex| Expensive[GPT-4 .03/1K]\n Router -->|Cached| Cache[Free]\n Cheap --> Track[Cost Tracker]\n Expensive --> Track\n Cache --> Track"
        },
        {
            "title": "Latency Optimization",
            "content": "<p>Streaming (time-to-first-token), prompt caching (reuse prefix computation), parallel calls where possible, model selection by speed, pre-computation of common responses.</p>"
        },
        {
            "title": "Streaming Implementation",
            "content": "<p>SSE delivers tokens as generated. Critical for chat UX. Handle: partial JSON accumulation, error mid-stream, connection drops, backpressure.</p>"
        },
        {
            "title": "Batching",
            "content": "<p>Group non-urgent requests and process together. Lower per-request cost (some APIs offer batch pricing). Async processing queue with priority levels.</p>"
        },
        {
            "title": "Caching Strategies",
            "content": "<p>Exact cache: identical prompts. Semantic cache: similar prompts (embed + similarity threshold). KV-cache reuse: shared prompt prefix. TTL-based invalidation for freshness.</p>"
        },
        {
            "title": "Rate Limit Handling",
            "content": "<p>Respect provider limits (tokens per minute, requests per minute). Implement: exponential backoff, request queuing, load spreading across API keys, graceful degradation on limit hit.</p>"
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>Cost per request optimization</li><li>Latency vs quality tradeoffs</li><li>Caching strategy for AI</li><li>Scaling AI systems cost-effectively</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "Why does token count matter?",
            "answer": "<p>Tokens determine cost (pay per token) and latency (more tokens = slower). Also limited by context window. Optimize: concise prompts, summarize history, structured outputs.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "AI caching strategies?",
            "answer": "<p>Exact match (same prompt = cached response), semantic cache (similar prompts via embedding similarity), prompt prefix caching (reuse system prompt computation). Significant cost savings.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "Model routing for cost?",
            "answer": "<p>Classify request complexity. Route simple to cheap fast models, complex to expensive powerful models. 80% of requests often handleable by cheaper model.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Streaming implementation?",
            "answer": "<p>SSE from API. Accumulate tokens for display. Handle: partial JSON, mid-stream errors, connection drops. Important for chat UX (reduces perceived latency).</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "Rate limit architecture?",
            "answer": "<p>Token bucket per API key, request queuing with priority, load spreading across keys, backoff on 429, graceful degradation (serve cached or simplified), monitoring usage vs limits.</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "Cost optimization at scale?",
            "answer": "<p>Tiered models, semantic caching, batch non-urgent, compress prompts, per-team budgets with alerts, regular prompt optimization reviews, negotiate volume pricing.</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "AI platform cost architecture?",
            "answer": "<p>Centralized gateway with cost tracking, chargeback per team, budget enforcement, automated alerting, model recommendation based on task/budget, historical cost analytics.</p>"
        }
    ]
});
