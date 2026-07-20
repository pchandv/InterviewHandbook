/* Level 14 - AI Engineering: LLM API Integration */
'use strict';
PageData.register('llm-integration', {
    "title": "LLM API Integration",
    "description": "OpenAI API, Azure OpenAI, function calling, tool calling, structured outputs, streaming",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Integrating LLMs into applications requires understanding API patterns: chat completions, function/tool calling for structured interactions, streaming for responsiveness, and multi-provider strategies for resilience.</p>"
        },
        {
            "title": "Chat Completions API",
            "content": "<p>Messages array with roles: system (behavior), user (input), assistant (previous responses). Stateless: send full conversation each call. Parameters: model, temperature, max_tokens, response_format.</p>"
        },
        {
            "title": "Function/Tool Calling",
            "content": "<p>Declare available functions with JSON schema. Model decides when to call which function with what arguments. Application executes function and returns result. Enables: API calls, DB queries, calculations, external data retrieval.</p>",
            "mermaid": "graph LR\n User[User Query] --> LLM\n LLM --> FC[Function Call Decision]\n FC --> App[App Executes Function]\n App --> LLM\n LLM --> Response[Final Response]"
        },
        {
            "title": "Structured Outputs",
            "content": "<p>JSON mode, response_format with schema, tool calling for guaranteed structure. Essential for programmatic consumption. Retry logic for malformed responses.</p>"
        },
        {
            "title": "Streaming",
            "content": "<p>Server-Sent Events deliver tokens as generated. Reduces time-to-first-token. Handle partial JSON, accumulate chunks, display progressively. Essential for chat UX.</p>"
        },
        {
            "title": "Multi-Provider Strategy",
            "content": "<p>Primary + fallback models. Route by: task complexity, cost sensitivity, latency requirements. Circuit breaker for provider outages. Abstract provider behind interface.</p>",
            "mermaid": "graph TD\n Request --> Router[Model Router]\n Router --> Primary[GPT-4]\n Router --> Fallback[Claude]\n Router --> Fast[GPT-3.5]\n Primary -.->|Timeout| Fallback"
        },
        {
            "title": "Error Handling",
            "content": "<p>Rate limits (429), token limits, content filters, timeouts. Exponential backoff with jitter. Token counting before sending. Graceful degradation.</p>"
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>Function calling flow</li><li>Streaming implementation</li><li>Rate limit handling</li><li>Multi-model architecture</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "How does the chat completions API work?",
            "answer": "<p>Send messages array (system + user + assistant history). Stateless - full context each call. Returns assistant message. Parameters control behavior (temperature, max_tokens).</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "What is function calling?",
            "answer": "<p>Declare available functions with schemas. Model decides when to call what with which args. App executes, returns result to model. Enables structured tool use.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "How does streaming work?",
            "answer": "<p>Server-Sent Events deliver tokens incrementally. Reduces time-to-first-token. Client accumulates chunks for display. Handle connection drops and partial content.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Multi-provider fallback design?",
            "answer": "<p>Abstract behind interface. Primary model + fallbacks. Circuit breaker per provider. Route by task type/cost/latency. Consistent prompt format across providers.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "Token management at scale?",
            "answer": "<p>Count tokens before sending (tiktoken), truncate/summarize conversation history, cache system prompts, budget per request, alert on cost spikes.</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "LLM gateway architecture?",
            "answer": "<p>Centralized proxy: rate limiting, auth, logging, cost tracking, model routing, caching, prompt injection detection, retry/fallback logic. Single point of observability.</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "Enterprise LLM platform?",
            "answer": "<p>API gateway + model registry + prompt management + cost allocation + security (PII detection, content filtering) + observability + multi-tenant isolation.</p>"
        }
    ]
});
