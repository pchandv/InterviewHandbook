/* ═══════════════════════════════════════════════════════════════════
   AI — Architecture Patterns for AI-Powered Applications
   AI Gateway, Model Routing, AI Caching, Fallback Patterns,
   AI Microservices, and System Design for AI applications.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('ai-architecture-patterns', {
    title: 'AI Architecture Patterns',
    description: 'Production architecture patterns for AI-powered applications: AI Gateway, model routing, prompt and semantic caching, fallback strategies, AI microservices, orchestration, and system design patterns for building reliable, cost-efficient AI systems at scale.',
    difficulty: 'advanced',
    estimatedMinutes: 45,
    prerequisites: ['ai-integration', 'ai-production', 'arch-styles'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Building a chat demo is easy. Building a <strong>production AI system</strong> that is reliable, cost-efficient, and maintainable requires architectural thinking. This topic covers the patterns that separate prototype-grade AI from enterprise-grade AI applications.</p>
            <p>These patterns are increasingly asked in system design interviews: "Design an AI-powered customer service system that handles 10K concurrent conversations."</p>`
        },
        {
            title: 'AI Gateway Pattern',
            content: `<p>An <strong>AI Gateway</strong> is a centralized proxy that sits between your application services and LLM providers. Similar to an API Gateway but specialized for AI workloads.</p>
            <ul>
                <li><strong>Centralized auth</strong> &mdash; API keys managed in one place (not scattered across services)</li>
                <li><strong>Rate limiting</strong> &mdash; Prevent any single service from exhausting your token budget</li>
                <li><strong>Model routing</strong> &mdash; Route to different models based on task complexity</li>
                <li><strong>Caching</strong> &mdash; Semantic cache for repeated/similar queries</li>
                <li><strong>Observability</strong> &mdash; Token usage, latency, cost tracking per service/user</li>
                <li><strong>Fallback</strong> &mdash; If primary model is down, route to secondary</li>
                <li><strong>Content safety</strong> &mdash; Input/output filtering centralized</li>
            </ul>`,
            mermaid: `graph TD
    S1[Service A] --> GW[AI Gateway]
    S2[Service B] --> GW
    S3[Service C] --> GW

    GW --> CACHE{Cache Hit?}
    CACHE -->|Yes| RES[Return Cached]
    CACHE -->|No| ROUTE[Model Router]
    ROUTE -->|simple| MINI[GPT-4o-mini]
    ROUTE -->|complex| FULL[GPT-4o]
    ROUTE -->|fallback| CLAUDE[Claude]

    GW --> OBS[Observability<br/>Tokens, Cost, Latency]
    GW --> GUARD[Guardrails<br/>Input/Output Filter]

    style GW fill:#3b82f6,color:#fff
    style CACHE fill:#10b981,color:#fff
    style ROUTE fill:#f59e0b,color:#fff`,
            code: `// AI Gateway implementation in ASP.NET Core
public class AiGatewayMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        var request = await ParseAiRequest(context);

        // 1. Rate limiting (per service, per user)
        if (!await _rateLimiter.AllowAsync(request.ServiceId, request.UserId))
            return Results.StatusCode(429);

        // 2. Input guardrails
        var guardResult = await _guardrails.CheckInputAsync(request.Prompt);
        if (!guardResult.IsAllowed)
            return Results.BadRequest(guardResult.Reason);

        // 3. Cache lookup (semantic similarity)
        var cached = await _semanticCache.GetAsync(request.Prompt, threshold: 0.95f);
        if (cached != null)
        {
            _metrics.RecordCacheHit(request.ServiceId);
            return Results.Ok(cached);
        }

        // 4. Model routing (complexity-based)
        var model = _router.SelectModel(request);

        // 5. Call LLM with circuit breaker
        var response = await _circuitBreaker.ExecuteAsync(
            () => _llmClient.CompleteAsync(model, request));

        // 6. Output guardrails
        var outputCheck = await _guardrails.CheckOutputAsync(response);
        if (!outputCheck.IsAllowed)
            response = _fallback.GetSafeResponse();

        // 7. Cache response
        await _semanticCache.SetAsync(request.Prompt, response);

        // 8. Record metrics
        _metrics.Record(request.ServiceId, model, response.TokensUsed, response.Latency);

        return Results.Ok(response);
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Model Routing',
            content: `<p><strong>Model routing</strong> directs requests to different LLMs based on task characteristics. This saves 60-80% cost while maintaining quality.</p>`,
            table: {
                headers: ['Request Type', 'Route To', 'Why', 'Cost Savings'],
                rows: [
                    ['Simple Q&A, classification', 'GPT-4o-mini / Claude Haiku', 'Small models handle simple tasks well', '90% cheaper per token'],
                    ['Complex reasoning, code gen', 'GPT-4o / Claude Sonnet', 'Needs deeper reasoning capability', 'Baseline cost'],
                    ['Critical decisions, novel problems', 'Claude Opus / GPT-4o (high temp)', 'Maximum capability for hard problems', 'Most expensive'],
                    ['Embeddings', 'text-embedding-3-small', 'Cheaper embedding model for most use cases', '5x cheaper than large'],
                    ['Batch processing (non-urgent)', 'OpenAI Batch API', '50% discount for 24h turnaround', '50% savings']
                ]
            },
            code: `// Model routing implementation
public class ModelRouter
{
    public ModelSelection SelectModel(AiRequest request)
    {
        // Rule-based routing (simple, fast)
        if (request.TaskType == TaskType.Classification)
            return new("gpt-4o-mini", MaxTokens: 100);

        if (request.TaskType == TaskType.CodeGeneration && request.Complexity == "high")
            return new("gpt-4o", MaxTokens: 4096);

        // Complexity estimation (token count + keywords)
        var complexity = EstimateComplexity(request.Prompt);

        return complexity switch
        {
            < 0.3f => new("gpt-4o-mini", MaxTokens: 500),
            < 0.7f => new("gpt-4o", MaxTokens: 2000),
            _ => new("claude-3-5-sonnet", MaxTokens: 4096)
        };
    }

    private float EstimateComplexity(string prompt)
    {
        // Heuristics: token count, question complexity markers,
        // multi-step indicators, technical depth signals
        var score = 0f;
        if (prompt.Length > 500) score += 0.2f;
        if (prompt.Contains("design") || prompt.Contains("architect")) score += 0.3f;
        if (prompt.Contains("compare") || prompt.Contains("trade-off")) score += 0.2f;
        if (prompt.Split('?').Length > 2) score += 0.2f; // Multiple questions
        return Math.Min(score, 1.0f);
    }
}`,
            language: 'csharp'
        },
        {
            title: 'AI Caching Strategies',
            content: `<p>Caching AI responses dramatically reduces cost and latency. Three levels:</p>
            <ul>
                <li><strong>Exact match cache</strong> &mdash; Same prompt = same response (Redis key-value). Cheapest but limited hit rate.</li>
                <li><strong>Semantic cache</strong> &mdash; Similar prompts (cosine similarity > 0.95) = cached response. Higher hit rate but needs embedding computation.</li>
                <li><strong>Prompt prefix cache</strong> &mdash; Provider-level (Anthropic/OpenAI): repeated system prompts cached automatically. 50-90% savings on prefix tokens.</li>
            </ul>`,
            code: `// Semantic cache implementation
public class SemanticCache
{
    private readonly IVectorStore _vectors;
    private readonly IEmbeddingGenerator _embedder;

    public async Task<string?> GetAsync(string prompt, float threshold = 0.95f)
    {
        // Embed the query
        var embedding = await _embedder.GenerateAsync(prompt);

        // Search for similar cached prompts
        var results = await _vectors.SearchAsync(embedding, topK: 1);

        if (results.Any() && results[0].Score >= threshold)
        {
            _metrics.RecordHit();
            return results[0].Metadata["response"];
        }

        _metrics.RecordMiss();
        return null;
    }

    public async Task SetAsync(string prompt, string response, TimeSpan? ttl = null)
    {
        var embedding = await _embedder.GenerateAsync(prompt);
        await _vectors.UpsertAsync(new VectorRecord
        {
            Embedding = embedding,
            Metadata = new() { ["prompt"] = prompt, ["response"] = response },
            ExpiresAt = ttl.HasValue ? DateTime.UtcNow + ttl.Value : null
        });
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Fallback & Resilience Patterns',
            content: `<p>LLM providers have outages. Production AI systems need resilience:</p>
            <ul>
                <li><strong>Multi-provider fallback</strong> &mdash; Primary: Azure OpenAI. Secondary: direct OpenAI. Tertiary: Anthropic. Circuit breaker switches on failure.</li>
                <li><strong>Degraded mode</strong> &mdash; If all LLMs down: return cached responses, show "AI temporarily unavailable", route to human.</li>
                <li><strong>Quality fallback</strong> &mdash; If cheap model returns low-confidence answer, retry with expensive model.</li>
                <li><strong>Timeout with partial response</strong> &mdash; If generation takes too long, return partial streaming response + "still thinking" UX.</li>
            </ul>`,
            mermaid: `graph TD
    REQ[Request] --> CB{Circuit Breaker}
    CB -->|Closed| P1[Azure OpenAI<br/>Primary]
    CB -->|Open| P2[OpenAI Direct<br/>Secondary]
    P1 -->|Success| RES[Response]
    P1 -->|Failure/Timeout| P2
    P2 -->|Success| RES
    P2 -->|Failure| P3[Anthropic<br/>Tertiary]
    P3 -->|Success| RES
    P3 -->|Failure| DEG[Degraded Mode<br/>Cached / Human]

    style P1 fill:#3b82f6,color:#fff
    style P2 fill:#f59e0b,color:#fff
    style P3 fill:#8b5cf6,color:#fff
    style DEG fill:#ef4444,color:#fff`
        },
        {
            title: 'AI Microservices Architecture',
            content: `<p>For complex AI applications, decompose into specialized services:</p>`,
            table: {
                headers: ['Service', 'Responsibility', 'Why Separate'],
                rows: [
                    ['AI Gateway', 'Routing, caching, rate limiting, auth', 'Cross-cutting concerns shared by all AI consumers'],
                    ['Embedding Service', 'Generate/cache embeddings for documents and queries', 'GPU-intensive, different scaling needs'],
                    ['RAG Service', 'Retrieval pipeline (chunk, embed, search, rerank)', 'Complex pipeline with its own data stores'],
                    ['Agent Orchestrator', 'Manage multi-step agent workflows', 'Stateful, long-running conversations'],
                    ['Guardrail Service', 'Input/output safety checks', 'Shared policy enforcement, independent updates'],
                    ['Evaluation Service', 'Quality monitoring, A/B testing, metrics', 'Non-blocking, async processing'],
                    ['Prompt Registry', 'Store, version, serve prompt templates', 'Decouple prompt changes from code deploys']
                ]
            }
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Direct LLM calls from every service</strong> &mdash; No centralized management = scattered API keys, no cost visibility, no caching. Use an AI Gateway.</li>
                <li><strong>Single provider dependency</strong> &mdash; If Azure OpenAI goes down, everything fails. Always have a fallback provider.</li>
                <li><strong>No caching</strong> &mdash; Same questions asked thousands of times daily without caching = 10-100x unnecessary cost.</li>
                <li><strong>Synchronous-only</strong> &mdash; Blocking on 3-10 second LLM responses in request path. Use streaming + async patterns.</li>
                <li><strong>AI in the critical path without fallback</strong> &mdash; If LLM is down, entire product is down. AI features should degrade gracefully.</li>
                <li><strong>One model for everything</strong> &mdash; Using GPT-4o for classification tasks that GPT-4o-mini handles perfectly at 1/20th the cost.</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>AI Gateway centralizes: auth, routing, caching, guardrails, observability (build or buy one)</li>
                <li>Model routing saves 60-80% cost: route simple tasks to cheap models</li>
                <li>Semantic cache has higher hit rate than exact-match cache (similar queries get cached responses)</li>
                <li>Multi-provider fallback with circuit breaker prevents total AI outages</li>
                <li>AI should never be a single point of failure &mdash; always have degraded mode</li>
                <li>Decompose complex AI systems into focused services (gateway, RAG, agents, eval)</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'ai-arch-q1',
            level: 'architect',
            title: 'Design the architecture for an AI-powered customer service system handling 10K concurrent conversations.',
            answer: `<p><strong>Architecture:</strong></p><ul><li><strong>API layer:</strong> WebSocket connections for real-time chat, backed by Azure SignalR Service for scale</li><li><strong>Conversation service:</strong> Manages conversation state, history, context window management</li><li><strong>AI Gateway:</strong> Routes to models, caches, rate limits per customer tier</li><li><strong>RAG service:</strong> Company knowledge base (product docs, policies, FAQs) with hybrid search</li><li><strong>Agent orchestrator:</strong> Multi-step workflows (lookup order, check refund eligibility, process)</li><li><strong>Guardrail service:</strong> Input safety, PII detection, output compliance checking</li><li><strong>Escalation service:</strong> Routes to human agents on low confidence or customer frustration</li></ul><p><strong>Scaling:</strong> Conversation service = stateless pods (state in Redis). AI Gateway handles token budgets per customer. Embedding service scales independently (GPU).</p>`
        },
        {
            id: 'ai-arch-q2',
            level: 'senior',
            title: 'Why would you build an AI Gateway instead of calling LLM APIs directly?',
            answer: `<p><strong>Without gateway:</strong> Every service has its own API keys, no cost visibility, no caching, no fallback, scattered guardrails, impossible to enforce rate limits across services.</p><p><strong>With gateway:</strong></p><ul><li>Centralized API key management (rotate in one place)</li><li>Cost visibility per service/team/user</li><li>Semantic caching across all services (shared cache = higher hit rate)</li><li>Unified guardrails (input/output filtering in one place)</li><li>Model routing (simple requests to cheap models automatically)</li><li>Circuit breaker + fallback (provider outage handled transparently)</li></ul>`
        },
        {
            id: 'ai-arch-q3',
            level: 'senior',
            title: 'How does semantic caching work and when would you use it?',
            answer: `<p><strong>How:</strong> When a query comes in, embed it to a vector. Search cache for similar vectors (cosine similarity > 0.95). If found, return cached response without calling LLM.</p><p><strong>When to use:</strong></p><ul><li>FAQ-heavy applications (same questions asked differently)</li><li>Customer support (common issues with standard answers)</li><li>Documentation Q&A (finite set of topics, many phrasings)</li></ul><p><strong>When NOT to use:</strong> Unique/personalized queries, time-sensitive data, creative tasks where variety matters, conversations requiring context.</p><p><strong>Trade-off:</strong> Stale answers if underlying data changes. Set TTL. Invalidate on data updates.</p>`
        },
        {
            id: 'ai-arch-q4',
            level: 'lead',
            title: 'How do you implement multi-provider resilience for LLM calls?',
            answer: `<p><strong>Implementation with Polly (.NET):</strong></p><ul><li>Primary: Azure OpenAI (lowest latency, enterprise SLA)</li><li>Secondary: OpenAI direct (same models, different infrastructure)</li><li>Tertiary: Anthropic Claude (different provider entirely)</li><li>Circuit breaker: After 3 failures in 30s, open circuit, route to next provider</li><li>Timeout: 10s per call (LLM calls can hang). Cancel and try next on timeout.</li><li>Health checks: Periodic lightweight calls to all providers; pre-warm the fallback connection.</li></ul><p><strong>Key insight:</strong> Different providers have different model names and APIs. Use an abstraction layer (Microsoft.Extensions.AI) so routing is transparent to consumers.</p>`
        },
        {
            id: 'ai-arch-q5',
            level: 'mid',
            title: 'What is the difference between prompt caching and semantic caching?',
            answer: `<p><strong>Prompt caching (provider-level):</strong> The LLM provider (Anthropic, OpenAI) caches the processed KV-cache of your system prompt prefix. You still make an API call, but cached prefix tokens are 50-90% cheaper. Transparent &mdash; just keep prefix identical between calls.</p><p><strong>Semantic caching (application-level):</strong> You cache the FULL response for similar queries. No API call at all for cache hits. You manage the cache (vector DB, TTL, invalidation). 100% cost savings on hits but risk of stale/incorrect cached responses.</p><p><strong>Use both:</strong> Prompt caching for all calls (free optimization). Semantic caching for repetitive query patterns (FAQ, common support questions).</p>`
        },
        {
            id: 'ai-arch-q6',
            level: 'architect',
            title: 'How would you add AI features to an existing .NET monolith without a big rewrite?',
            answer: `<p><strong>Incremental approach (Strangler Fig for AI):</strong></p><ol><li><strong>AI Gateway as sidecar:</strong> Deploy a lightweight AI proxy service alongside the monolith. Monolith calls it via HTTP.</li><li><strong>Start with one feature:</strong> Pick lowest-risk AI use case (e.g., document summarization, search enhancement). Ship it behind a feature flag.</li><li><strong>Shared prompt registry:</strong> Store prompts externally so you can iterate without monolith deploys.</li><li><strong>Async where possible:</strong> AI calls are slow (2-10s). Use background jobs for non-interactive features (email classification, batch analysis).</li><li><strong>Cache aggressively:</strong> Most AI features have repeating patterns. Cache early, measure hit rate.</li></ol><p><strong>Do NOT:</strong> Embed LLM calls directly in controller actions (too slow, too fragile). Do NOT make AI a blocking dependency (always have fallback).</p>`
        },
        {
            id: 'ai-arch-q7',
            level: 'senior',
            title: 'How do you handle streaming LLM responses in a .NET API?',
            answer: `<p><strong>Pattern: Server-Sent Events (SSE) or streaming HTTP response:</strong></p><ul><li>Client connects to your API endpoint</li><li>Your API calls LLM with streaming enabled</li><li>As tokens arrive from LLM, immediately write them to client response stream</li><li>Client receives tokens incrementally (time-to-first-token = 200-500ms vs full wait = 2-10s)</li></ul><p><strong>Implementation:</strong> ASP.NET Core <code>IAsyncEnumerable&lt;string&gt;</code> return type with <code>text/event-stream</code> content type. Or SignalR for bidirectional streaming.</p><p><strong>Why it matters:</strong> Users perceive streaming as 5-10x faster even though total generation time is the same. First token in 300ms vs waiting 5s for complete response.</p>`
        },
        {
            id: 'ai-arch-q8',
            level: 'architect',
            title: 'What are the cost implications of different AI architecture choices?',
            answer: `<p><strong>Cost model awareness:</strong></p><ul><li><strong>Token pricing:</strong> Input tokens (cheap) + Output tokens (2-4x more expensive). Minimize output length.</li><li><strong>Model selection:</strong> GPT-4o-mini is 20x cheaper than GPT-4o. Route appropriately.</li><li><strong>Caching ROI:</strong> Semantic cache with 40% hit rate on 10K daily queries saves $X/month. Calculate break-even.</li><li><strong>Batch vs real-time:</strong> OpenAI Batch API is 50% cheaper. Use for non-urgent processing.</li><li><strong>Context window:</strong> Stuffing 100K tokens of context per call is expensive. Use RAG to retrieve only relevant 2-3K tokens.</li></ul><p><strong>Monthly cost formula:</strong> (requests/day) &times; (avg tokens per request) &times; (price per token) &times; (1 - cache hit rate) &times; 30 days. Model routing + caching can reduce this by 70-80%.</p>`
        }
    ]
});
