/* ═══════════════════════════════════════════════════════════════════
   AI — Hands-On Labs & Projects
   Build RAG App, MCP Server, Multi-Agent Workflow, AI Chatbot,
   Document Q&A, Evaluation Pipeline — guided project specs.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('ai-hands-on-labs', {
    title: 'AI Hands-On Labs & Projects',
    description: 'Guided project specifications for building production AI systems: RAG application, MCP server, multi-agent workflow, AI chatbot, document Q&A system, and evaluation pipeline. Each lab includes architecture, tech stack, implementation steps, and evaluation criteria.',
    difficulty: 'advanced',
    estimatedMinutes: 50,
    prerequisites: ['ai-mcp-agents', 'ai-rag-advanced', 'ai-production'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Theory without practice is incomplete. These labs are designed as <strong>portfolio projects</strong> that demonstrate AI engineering skills to interviewers. Each project is scoped for 1-3 days of focused work and produces a deployable artifact you can discuss in interviews.</p>
            <p><strong>Why projects matter in AI interviews:</strong> "Tell me about an AI system you built" is now a standard question. Having real projects with architecture diagrams, trade-off decisions, and lessons learned sets you apart from candidates who only used ChatGPT.</p>`
        },
        {
            title: 'Lab 1: Build a RAG Application',
            content: `<p><strong>Goal:</strong> Build a document Q&A system that answers questions about your company documentation using RAG.</p>
            <p><strong>Architecture:</strong></p>
            <ul>
                <li><strong>Ingestion:</strong> Load docs (PDF/Markdown) &rarr; chunk (512 tokens, 50 overlap) &rarr; embed &rarr; store in vector DB</li>
                <li><strong>Retrieval:</strong> Query &rarr; embed &rarr; hybrid search (vector + BM25) &rarr; re-rank &rarr; top-5</li>
                <li><strong>Generation:</strong> System prompt + retrieved context + user query &rarr; LLM &rarr; answer with citations</li>
            </ul>`,
            code: `// RAG Application skeleton (.NET + Semantic Kernel)
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.AzureAISearch;

// 1. Ingestion Pipeline
public class DocumentIngester
{
    public async Task IngestAsync(string filePath)
    {
        var text = await ExtractTextAsync(filePath); // PDF/MD parser
        var chunks = TextChunker.SplitPlainTextParagraphs(
            TextChunker.SplitPlainTextLines(text, 100), 512, 50);

        foreach (var chunk in chunks)
        {
            var embedding = await _embedder.GenerateEmbeddingAsync(chunk);
            await _vectorStore.UpsertAsync(new()
            {
                Id = Guid.NewGuid().ToString(),
                Content = chunk,
                Embedding = embedding,
                Source = filePath,
                ChunkIndex = chunks.IndexOf(chunk)
            });
        }
    }
}

// 2. RAG Query Pipeline
public class RagService
{
    public async Task<RagResponse> QueryAsync(string question)
    {
        // Embed query
        var queryEmbedding = await _embedder.GenerateEmbeddingAsync(question);

        // Hybrid search (vector + keyword)
        var results = await _search.HybridSearchAsync(question, queryEmbedding, topK: 10);

        // Re-rank (cross-encoder or semantic ranker)
        var reranked = await _reranker.RerankAsync(question, results, topK: 5);

        // Generate answer with citations
        var context = string.Join("\\n---\\n",
            reranked.Select(r => $"[Source: {r.Source}]\\n{r.Content}"));

        var answer = await _llm.CompleteAsync($"""
            Answer the question based ONLY on the context below.
            If the answer is not in the context, say "I don't know."
            Cite sources using [Source: filename] format.

            Context:
            {context}

            Question: {question}
            """);

        return new RagResponse(answer, reranked.Select(r => r.Source));
    }
}`,
            language: 'csharp',
            mermaid: `graph TD
    D[Documents<br/>PDF, MD, HTML] -->|"extract text"| C[Chunker<br/>512 tokens, 50 overlap]
    C -->|"embed"| VS[(Vector Store<br/>Azure AI Search)]

    Q[User Query] -->|"embed"| HS[Hybrid Search<br/>Vector + BM25]
    HS --> VS
    VS -->|"top-10"| RR[Re-Ranker<br/>Cross-Encoder]
    RR -->|"top-5"| GEN[LLM Generation<br/>+ Citation Instructions]
    GEN --> A[Answer + Sources]

    style VS fill:#3b82f6,color:#fff
    style RR fill:#f59e0b,color:#fff
    style GEN fill:#8b5cf6,color:#fff`
        },
        {
            title: 'Lab 2: Build an MCP Server',
            content: `<p><strong>Goal:</strong> Create an MCP server that exposes your application data to AI agents (e.g., order lookup, customer search).</p>
            <p><strong>Specifications:</strong></p>
            <ul>
                <li><strong>Transport:</strong> stdio for local development, HTTP+SSE for production</li>
                <li><strong>Tools:</strong> 3-5 tools (search_orders, get_customer, check_inventory, create_ticket)</li>
                <li><strong>Resources:</strong> Database schema, API documentation, business rules</li>
                <li><strong>Security:</strong> Read-only by default, parameterized queries, rate limiting</li>
            </ul>`,
            code: `// MCP Server in .NET (ModelContextProtocol SDK)
using ModelContextProtocol.Server;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddMcpServer(options =>
{
    options.ServerInfo = new("order-service-mcp", "1.0.0");
});
builder.Services.AddMcpTool<SearchOrdersTool>();
builder.Services.AddMcpTool<GetCustomerTool>();
builder.Services.AddMcpTool<CheckInventoryTool>();

var app = builder.Build();
app.MapMcpSse(); // HTTP+SSE endpoint at /mcp
app.Run();

// Tool implementation
[McpTool("search_orders", "Search orders by customer email or order ID")]
public class SearchOrdersTool
{
    [McpParameter("query", "Customer email or order ID", required: true)]
    public string Query { get; set; } = "";

    [McpParameter("limit", "Max results to return", required: false)]
    public int Limit { get; set; } = 5;

    public async Task<McpToolResult> ExecuteAsync(IOrderRepository repo)
    {
        var orders = await repo.SearchAsync(Query, Limit);
        if (!orders.Any())
            return McpToolResult.Text("No orders found for: " + Query);

        var summary = orders.Select(o =>
            $"Order #{o.Id} | {o.Status} | {o.Total:C} | {o.Date:d}");
        return McpToolResult.Text(string.Join("\\n", summary));
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Lab 3: Multi-Agent Document Processor',
            content: `<p><strong>Goal:</strong> Build a pipeline of 3 agents that collaborate to process and analyze documents.</p>
            <p><strong>Agent roles:</strong></p>
            <ul>
                <li><strong>Extractor Agent:</strong> Reads document, extracts structured data (names, dates, amounts, entities)</li>
                <li><strong>Validator Agent:</strong> Checks extracted data for consistency, flags anomalies</li>
                <li><strong>Summarizer Agent:</strong> Produces executive summary + action items from validated data</li>
            </ul>
            <p><strong>Key patterns to demonstrate:</strong></p>
            <ul>
                <li>Sequential pipeline (output of one feeds the next)</li>
                <li>Structured outputs between agents (JSON contracts)</li>
                <li>Error handling (what if extraction fails? Retry or escalate)</li>
                <li>Human-in-the-loop (flag low-confidence extractions for review)</li>
            </ul>`,
            mermaid: `graph LR
    DOC[Document Input] --> E[Extractor Agent<br/>Structured Output JSON]
    E -->|entities, dates, amounts| V[Validator Agent<br/>Consistency Check]
    V -->|valid| S[Summarizer Agent<br/>Executive Summary]
    V -->|anomaly| H[Human Review Queue]
    H -->|corrected| S
    S --> OUT[Summary + Action Items]

    style E fill:#3b82f6,color:#fff
    style V fill:#f59e0b,color:#fff
    style S fill:#10b981,color:#fff
    style H fill:#ef4444,color:#fff`
        },
        {
            title: 'Lab 4: AI Chatbot with Memory',
            content: `<p><strong>Goal:</strong> Build a customer-facing chatbot with conversation memory, tool access, and guardrails.</p>
            <p><strong>Features to implement:</strong></p>
            <ul>
                <li><strong>Conversation memory:</strong> Remember context within session (sliding window + summarization)</li>
                <li><strong>Tool access:</strong> Look up orders, check account balance, submit support tickets</li>
                <li><strong>Guardrails:</strong> PII detection, topic restriction, profanity filter, escalation to human</li>
                <li><strong>Streaming:</strong> Stream responses token-by-token for responsive UX</li>
                <li><strong>Evaluation:</strong> Log all conversations, measure quality weekly</li>
            </ul>
            <p><strong>Tech stack:</strong> ASP.NET Core + SignalR (streaming) + Semantic Kernel (agent) + Redis (session memory) + Azure OpenAI (LLM)</p>`
        },
        {
            title: 'Lab 5: AI Evaluation Pipeline',
            content: `<p><strong>Goal:</strong> Build an automated system that evaluates AI output quality and detects regressions.</p>
            <p><strong>Components:</strong></p>
            <ul>
                <li><strong>Golden dataset:</strong> 100 test cases with expected outputs (manually curated)</li>
                <li><strong>Automated scorer:</strong> LLM-as-judge scoring relevancy, faithfulness, helpfulness (1-5 scale)</li>
                <li><strong>Regression detection:</strong> Compare current scores against baseline. Alert on >5% drop.</li>
                <li><strong>Report generator:</strong> Daily quality report with trends, worst-performing queries, cost breakdown</li>
                <li><strong>A/B framework:</strong> Test new prompts/models against baseline on subset of traffic</li>
            </ul>
            <p><strong>This project demonstrates production maturity</strong> &mdash; most candidates build AI features but never evaluate them. Having an evaluation pipeline is a strong staff-level signal.</p>`
        },
        {
            title: 'Lab 6: Chunking Strategy Comparison',
            content: `<p><strong>Goal:</strong> Empirically compare different chunking strategies to find the best for your document type.</p>
            <p><strong>Experiment design:</strong></p>
            <ol>
                <li>Take 50 documents + 100 test questions with known answers</li>
                <li>Implement 4 chunking strategies: fixed-size (256, 512, 1024), semantic, document-structure, parent-child</li>
                <li>For each strategy: ingest, retrieve for each question, measure recall@5</li>
                <li>Compare: which strategy retrieves the right passage most often?</li>
                <li>Document findings with charts (retrieval quality vs chunk size)</li>
            </ol>
            <p><strong>Expected insight:</strong> Document-structure chunking (split on headings) usually wins for technical docs. Fixed 512 wins for unstructured text. Parent-child wins when you need both precision and context.</p>`
        },
        {
            title: 'Project Evaluation Criteria',
            content: `<p>What makes a portfolio AI project impressive in interviews:</p>`,
            table: {
                headers: ['Criteria', 'Junior Level', 'Senior Level', 'Staff Level'],
                rows: [
                    ['Architecture', 'Single script/notebook', 'Proper service with DI, config', 'Multi-service with gateway, caching, fallback'],
                    ['Error handling', 'Try/catch basic', 'Retry, timeout, graceful degradation', 'Circuit breaker, fallback model, partial responses'],
                    ['Evaluation', 'Manual testing', 'Golden test set with automated scoring', 'A/B framework + regression detection + dashboards'],
                    ['Cost awareness', 'Not considered', 'Token counting, model selection', 'Routing, caching, batch processing, cost dashboards'],
                    ['Security', 'API key in code', 'Key Vault, input validation', 'Guardrails pipeline, PII detection, prompt injection defense'],
                    ['Observability', 'Console.log', 'Structured logging', 'Distributed tracing, token metrics, quality signals']
                ]
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Build at least 2 AI projects for your portfolio: one RAG, one agent-based</li>
                <li>Include: architecture diagram, trade-off decisions, evaluation results, and cost analysis</li>
                <li>Production concerns (guardrails, caching, fallback, eval) differentiate senior from junior projects</li>
                <li>You do not need to deploy publicly &mdash; a GitHub repo with good README + architecture doc is sufficient</li>
                <li>Be ready to discuss: "What would you change at 10x scale?" and "What were the hardest trade-offs?"</li>
                <li>The evaluation pipeline lab (Lab 5) is the strongest staff-level signal</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'labs-q1',
            level: 'senior',
            title: 'Walk me through how you would build a RAG application from scratch.',
            answer: `<p><strong>Step-by-step:</strong></p><ol><li><strong>Data preparation:</strong> Collect documents, clean (remove nav/boilerplate), choose chunking strategy (512 tokens, document-structure-aware, 50 overlap)</li><li><strong>Embedding:</strong> Choose model (text-embedding-3-small for cost, ada-002 for compatibility). Embed all chunks.</li><li><strong>Vector store:</strong> Azure AI Search (for enterprise) or Qdrant (self-hosted). Store embeddings + metadata (source, date).</li><li><strong>Retrieval:</strong> Hybrid search (vector + BM25) with RRF fusion. Re-rank top-10 to top-5.</li><li><strong>Generation:</strong> System prompt with instructions + retrieved context + user query. Force citations.</li><li><strong>Evaluation:</strong> Golden test set, measure recall@5 for retrieval and faithfulness for generation.</li></ol>`
        },
        {
            id: 'labs-q2',
            level: 'architect',
            title: 'How would you scale a RAG system from 1,000 to 1,000,000 documents?',
            answer: `<p><strong>Scaling challenges and solutions:</strong></p><ul><li><strong>Ingestion:</strong> Batch processing with queue (Azure Service Bus). Parallel embedding workers. Incremental updates (only re-embed changed docs).</li><li><strong>Storage:</strong> Distributed vector DB (Qdrant cluster, Azure AI Search multi-replica). Partition by collection/tenant.</li><li><strong>Retrieval:</strong> Two-stage: coarse filter (metadata/keyword) narrows to 10K candidates, then vector search on those. Reduces search space.</li><li><strong>Freshness:</strong> CDC pipeline (change data capture) &rarr; re-embed on doc update. Track last-embedded timestamp.</li><li><strong>Cost:</strong> At 1M docs, embedding cost is one-time. Search cost scales with queries, not documents.</li></ul>`
        },
        {
            id: 'labs-q3',
            level: 'senior',
            title: 'What would you include in an MCP server for an e-commerce platform?',
            answer: `<p><strong>Tools (actions):</strong></p><ul><li><code>search_orders</code> &mdash; By customer email, order ID, date range</li><li><code>get_order_details</code> &mdash; Full order with items, shipping, payment</li><li><code>check_inventory</code> &mdash; Stock level for a product SKU</li><li><code>get_customer_profile</code> &mdash; Tier, order history count, preferences</li><li><code>create_support_ticket</code> &mdash; With confirmation gate (human-in-the-loop for writes)</li></ul><p><strong>Resources (read-only data):</strong></p><ul><li>Return policy document</li><li>Product catalog schema</li><li>Shipping zones and rates</li></ul><p><strong>Security:</strong> Read-only tools by default. Write tools require human approval. All queries parameterized. Rate limited per session.</p>`
        },
        {
            id: 'labs-q4',
            level: 'mid',
            title: 'What is the most important thing to evaluate in a RAG system?',
            answer: `<p><strong>Retrieval quality is the #1 factor.</strong> If retrieval fails (wrong chunks), generation will hallucinate regardless of LLM quality.</p><p><strong>Key metrics:</strong></p><ul><li><strong>Recall@K:</strong> Did the correct document appear in top-K results? (target: >90%)</li><li><strong>MRR:</strong> How high is the correct document ranked? (target: top-3)</li><li><strong>Faithfulness:</strong> Is the generated answer grounded in retrieved context? (target: >95%)</li><li><strong>Answer relevancy:</strong> Does the answer actually address the question?</li></ul><p><strong>Common mistake:</strong> Optimizing the LLM prompt without first verifying retrieval is finding the right documents. Fix retrieval first (chunking, search, re-ranking), then optimize generation.</p>`
        },
        {
            id: 'labs-q5',
            level: 'lead',
            title: 'How would you structure an AI evaluation pipeline for CI/CD?',
            answer: `<p><strong>Pipeline stages:</strong></p><ol><li><strong>On every prompt change PR:</strong> Run golden test set (100 queries), compare scores against baseline. Block merge if >5% regression.</li><li><strong>Nightly:</strong> Full evaluation suite (500+ queries), generate quality report, trend analysis.</li><li><strong>Weekly:</strong> Human review of 20 lowest-scoring responses. Update golden set with new edge cases.</li><li><strong>On model change:</strong> Full A/B test: new model on 10% traffic for 48 hours, compare quality + cost + latency.</li></ol><p><strong>Scoring:</strong> LLM-as-judge (GPT-4o rates responses 1-5 on relevancy, faithfulness, helpfulness). Average across golden set.</p>`
        },
        {
            id: 'labs-q6',
            level: 'architect',
            title: 'Design a multi-agent system for automated document processing in a legal firm.',
            answer: `<p><strong>Agents:</strong></p><ul><li><strong>Document Classifier:</strong> Determines document type (contract, brief, letter, filing)</li><li><strong>Entity Extractor:</strong> Pulls parties, dates, amounts, obligations, deadlines</li><li><strong>Compliance Checker:</strong> Verifies against regulatory requirements (using RAG on regulation docs)</li><li><strong>Summarizer:</strong> Produces 1-page executive summary + action items</li><li><strong>QA Agent:</strong> Reviews other agents outputs for consistency and completeness</li></ul><p><strong>Orchestration:</strong> Sequential pipeline with quality gates. If QA agent flags issues, loop back to relevant agent. Human review for anything below 80% confidence.</p><p><strong>Key design decisions:</strong> Structured outputs between agents (JSON contracts). Separate tool sets per agent (principle of least privilege). Full audit trail of every decision.</p>`
        },
        {
            id: 'labs-q7',
            level: 'mid',
            title: 'What should a good AI project README include for interview purposes?',
            answer: `<p><strong>Interview-ready README structure:</strong></p><ul><li><strong>Problem statement:</strong> What real problem does this solve? (not "I wanted to learn RAG")</li><li><strong>Architecture diagram:</strong> Mermaid/draw.io showing components and data flow</li><li><strong>Tech stack:</strong> With justification for each choice</li><li><strong>Trade-offs:</strong> What alternatives were considered? Why this approach?</li><li><strong>Results:</strong> Evaluation metrics (recall, faithfulness, latency, cost per query)</li><li><strong>Lessons learned:</strong> What surprised you? What would you change?</li><li><strong>How to run:</strong> Docker compose or clear setup steps</li></ul><p>This structure mirrors how staff engineers communicate: problem &rarr; approach &rarr; results &rarr; learnings.</p>`
        },
        {
            id: 'labs-q8',
            level: 'senior',
            title: 'How do you handle the cold-start problem in a new RAG system?',
            answer: `<p><strong>Cold-start challenges:</strong> No documents embedded yet, no quality baseline, no user feedback to improve from.</p><p><strong>Solutions:</strong></p><ul><li><strong>Seed data:</strong> Start with FAQ + most-accessed docs. Cover 80% of expected queries with 20% of documents (Pareto).</li><li><strong>Synthetic evaluation:</strong> Generate test questions from your docs using LLM, create golden set before launch.</li><li><strong>Fallback:</strong> If retrieval returns low-confidence results, fall back to general LLM response with disclaimer "I could not find specific documentation."</li><li><strong>Feedback loop:</strong> Log all queries. After 1 week, identify unanswered queries &rarr; add those documents.</li><li><strong>Progressive rollout:</strong> Internal users first (1 week), then beta customers (2 weeks), then GA.</li></ul>`
        }
    ]
});
