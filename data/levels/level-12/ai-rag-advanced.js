/* ═══════════════════════════════════════════════════════════════════
   AI Engineering 2.0 — Advanced RAG & Memory Architectures
   Knowledge Graphs, Hybrid Search, Vector DB Comparison,
   Chunking Strategies, Re-ranking, and Memory Patterns.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('ai-rag-advanced', {
    title: 'Advanced RAG & Memory',
    description: 'Production RAG architectures including memory patterns, knowledge graph augmentation, hybrid search (semantic + keyword), vector database selection, chunking strategies, and re-ranking for optimal retrieval quality.',
    difficulty: 'advanced',
    estimatedMinutes: 45,
    prerequisites: ['ai-fundamentals', 'ai-integration'],

    sections: [
        {
            title: 'Introduction',
            content: `<p><strong>RAG (Retrieval-Augmented Generation)</strong> grounds LLM responses in real data. Basic RAG is straightforward — advanced RAG is where production quality lives. This topic covers the patterns that separate prototype from production.</p>
            <ul>
                <li><strong>Basic RAG</strong> — Embed docs → vector search → stuff into prompt → generate</li>
                <li><strong>Advanced RAG</strong> — Hybrid search, re-ranking, multi-step retrieval, graph-augmented</li>
                <li><strong>Memory</strong> — How agents maintain context across conversations and sessions</li>
                <li><strong>Production concerns</strong> — Freshness, accuracy, cost, latency, evaluation</li>
            </ul>`
        },
        {
            title: 'RAG Architecture Patterns',
            content: `<p>Production RAG systems use multiple patterns layered together:</p>`,
            table: {
                headers: ['Pattern', 'How It Works', 'When to Use'],
                rows: [
                    ['Naive RAG', 'Embed → Retrieve top-K → Generate', 'Prototypes, simple Q&A'],
                    ['Hybrid Search', 'Combine vector (semantic) + BM25 (keyword)', 'Most production systems'],
                    ['Re-ranking', 'Retrieve 50, re-rank to top-5 with cross-encoder', 'When precision matters'],
                    ['Multi-Query', 'Generate multiple query variants, merge results', 'Ambiguous queries'],
                    ['HyDE', 'Generate hypothetical answer, embed THAT, then search', 'Low-quality queries'],
                    ['Recursive/Iterative', 'Retrieve → Evaluate → Retrieve more if needed', 'Complex multi-hop questions'],
                    ['Graph RAG', 'Retrieve from knowledge graph + vector store', 'Structured relationships, reasoning'],
                    ['Agentic RAG', 'Agent decides what/how to retrieve dynamically', 'Complex research tasks']
                ]
            },
            mermaid: `graph TD
    Q[User Query] --> QT[Query Transform]
    QT --> HY[HyDE: Hypothetical Doc]
    QT --> MQ[Multi-Query Expansion]
    QT --> RW[Query Rewrite]

    HY --> VS[Vector Search]
    MQ --> VS
    RW --> KW[Keyword Search BM25]

    VS --> F[Fusion / RRF]
    KW --> F

    F --> RR[Re-Ranker<br/>Cross-Encoder]
    RR --> TOP[Top-K Results]
    TOP --> LLM[LLM Generation]
    LLM --> A[Answer + Citations]

    style Q fill:#3b82f6,color:#fff
    style RR fill:#f59e0b,color:#fff
    style LLM fill:#8b5cf6,color:#fff`
        },
        {
            title: 'Chunking Strategies',
            content: `<p><strong>Chunking</strong> is how you split documents before embedding. It dramatically affects retrieval quality.</p>
            <ul>
                <li><strong>Fixed-size</strong> — Split every N tokens (simple, loses context)</li>
                <li><strong>Recursive character</strong> — Split on paragraphs → sentences → words (LangChain default)</li>
                <li><strong>Semantic</strong> — Split when embedding similarity drops (preserves meaning)</li>
                <li><strong>Document-structure</strong> — Split on headings, sections, code blocks (respects structure)</li>
                <li><strong>Sliding window</strong> — Overlapping chunks to preserve cross-boundary context</li>
                <li><strong>Parent-child</strong> — Index small chunks, retrieve parent document for context</li>
            </ul>`,
            code: `// C# — Semantic Kernel text chunking
using Microsoft.SemanticKernel.Text;

// Fixed-size with overlap
var chunks = TextChunker.SplitPlainTextParagraphs(
    TextChunker.SplitPlainTextLines(document, maxTokensPerLine: 100),
    maxTokensPerParagraph: 512,
    overlapTokens: 50  // 50-token overlap between chunks
);

// For structured documents (Markdown)
var markdownChunks = TextChunker.SplitMarkdownParagraphs(
    TextChunker.SplitMarkdownLines(markdown, maxTokensPerLine: 100),
    maxTokensPerParagraph: 512,
    overlapTokens: 50
);

// Parent-child pattern: embed small, retrieve large
var smallChunks = TextChunker.SplitPlainTextParagraphs(lines, 128);
var parentMap = new Dictionary<string, string>(); // chunkId → parentDocId

foreach (var (chunk, idx) in smallChunks.Select((c, i) => (c, i)))
{
    var embedding = await embeddingModel.GenerateEmbeddingAsync(chunk);
    await vectorDb.UpsertAsync(new VectorRecord
    {
        Id = $"chunk-{idx}",
        Embedding = embedding,
        Text = chunk,
        ParentId = documentId  // Link to full parent
    });
}

// At retrieval: find small chunk, return parent document
var results = await vectorDb.SearchAsync(queryEmbedding, topK: 5);
var parentDocs = results.Select(r => GetParentDocument(r.ParentId)).Distinct();`,
            language: 'csharp'
        },
        {
            title: 'Hybrid Search & Re-ranking',
            content: `<p><strong>Hybrid search</strong> combines semantic (vector) and lexical (BM25/keyword) search. Each catches what the other misses:</p>
            <ul>
                <li><strong>Vector</strong> — Good at meaning/paraphrase, bad at exact terms (IDs, codes, names)</li>
                <li><strong>BM25/Keyword</strong> — Good at exact match, bad at synonyms/concepts</li>
                <li><strong>Fusion</strong> — Reciprocal Rank Fusion (RRF) merges ranked lists without score normalization</li>
            </ul>
            <p><strong>Re-ranking</strong> uses a cross-encoder (e.g., Cohere Rerank, BGE Reranker) to score each candidate against the query. Much more accurate than bi-encoder similarity but too slow for initial retrieval.</p>`,
            code: `// Hybrid search with Azure AI Search
using Azure.Search.Documents;
using Azure.Search.Documents.Models;

// Azure AI Search supports hybrid natively
var options = new SearchOptions
{
    // Vector search (semantic)
    VectorSearch = new()
    {
        Queries = { new VectorizedQuery(queryEmbedding)
        {
            KNearestNeighborsCount = 50,
            Fields = { "contentVector" }
        }}
    },
    // Keyword search (BM25) — automatic with SearchText
    Size = 50,
    // Semantic ranker (re-ranking built-in)
    QueryType = SearchQueryType.Semantic,
    SemanticSearch = new()
    {
        SemanticConfigurationName = "default",
        QueryCaption = new(QueryCaptionType.Extractive)
    }
};

// This single call does: BM25 + Vector + RRF fusion + Semantic re-rank
var results = await searchClient.SearchAsync<Document>(
    "How does circuit breaker pattern work?", options);

await foreach (var result in results.Value.GetResultsAsync())
{
    Console.WriteLine($"Score: {result.Score} | {result.Document.Title}");
    // SemanticSearch provides captions (highlighted relevant passages)
    Console.WriteLine($"Caption: {result.SemanticSearch.Captions[0].Text}");
}`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Graph + RAG',
            content: `<p><strong>Graph RAG</strong> augments vector retrieval with structured knowledge graphs, enabling multi-hop reasoning and relationship-aware answers.</p>
            <ul>
                <li><strong>Entity extraction</strong> — LLM extracts entities and relationships from documents</li>
                <li><strong>Graph construction</strong> — Build a knowledge graph (Neo4j, Azure Cosmos Gremlin)</li>
                <li><strong>Graph + Vector retrieval</strong> — Query graph for structure, vectors for content</li>
                <li><strong>Use cases</strong> — "Who reports to the CTO?", "What services depend on Redis?"</li>
            </ul>
            <p><strong>Microsoft GraphRAG</strong> (open source) automatically builds community summaries from document collections, enabling global queries that naive RAG cannot answer.</p>`,
            mermaid: `graph LR
    D[Documents] -->|"extract entities"| KG[Knowledge Graph]
    D -->|"embed chunks"| VS[Vector Store]

    Q[Query] --> QA[Query Analysis]
    QA -->|"entity query"| KG
    QA -->|"semantic query"| VS

    KG -->|"structured context"| C[Combined Context]
    VS -->|"relevant passages"| C
    C --> LLM[LLM Generation]
    LLM --> A[Answer with<br/>graph-grounded reasoning]

    style KG fill:#10b981,color:#fff
    style VS fill:#3b82f6,color:#fff
    style LLM fill:#8b5cf6,color:#fff`
        },
        {
            title: 'Vector Database Comparison',
            content: `<p>Choosing the right vector database depends on scale, hosting preference, and feature needs:</p>`,
            table: {
                headers: ['Database', 'Type', 'Strengths', 'Best For'],
                rows: [
                    ['Azure AI Search', 'Managed (Azure)', 'Hybrid search, semantic ranker, enterprise', '.NET/Azure shops, enterprise'],
                    ['Pinecone', 'Managed (cloud)', 'Simple API, serverless, fast scaling', 'Startups, quick prototypes'],
                    ['Qdrant', 'Self-hosted / Cloud', 'Rust-based, fast, rich filtering', 'High-performance, self-hosted'],
                    ['Weaviate', 'Self-hosted / Cloud', 'Multi-modal, GraphQL API, modules', 'Multi-modal RAG (images + text)'],
                    ['Milvus', 'Self-hosted / Cloud', 'Massive scale, GPU support', 'Billions of vectors, ML teams'],
                    ['Chroma', 'Embedded / Cloud', 'Simple, Python-native, lightweight', 'Dev/test, small projects'],
                    ['pgvector', 'PostgreSQL extension', 'Use existing Postgres, SQL familiar', 'Teams already on Postgres'],
                    ['Redis Vector', 'Redis module', 'In-memory speed, existing Redis infra', 'Low-latency, caching + search']
                ]
            }
        },
        {
            title: 'Memory Architectures',
            content: `<p><strong>Memory</strong> allows agents to maintain context across conversations, sessions, and even users. Different memory types serve different needs:</p>
            <ul>
                <li><strong>Short-term (conversation)</strong> — Chat history buffer, sliding window, summarization</li>
                <li><strong>Long-term (persistent)</strong> — Vector store of past interactions, facts learned</li>
                <li><strong>Episodic</strong> — Specific past events ("last time you asked about X...")</li>
                <li><strong>Semantic</strong> — General knowledge extracted from interactions</li>
                <li><strong>Working memory</strong> — Scratchpad for current task (intermediate results)</li>
            </ul>`,
            code: `// Semantic Kernel — Memory with vector store
using Microsoft.SemanticKernel.Memory;

// Save memories
await memory.SaveInformationAsync("user-preferences",
    "User prefers dark mode and concise answers",
    id: "pref-001",
    additionalMetadata: "extracted from session on 2025-01-15");

await memory.SaveInformationAsync("project-context",
    "The user is working on a .NET 8 microservices project using Kafka",
    id: "ctx-001");

// Recall relevant memories for current query
var memories = await memory.SearchAsync("project-context",
    query: "How should I handle message ordering?",
    limit: 3,
    minRelevanceScore: 0.7);

// Inject into system prompt
var systemPrompt = $"""
    You are a helpful assistant. Context about the user:
    {string.Join("\\n", memories.Select(m => m.Metadata.Text))}
    """;

// Memory management patterns:
// 1. Sliding window — keep last N messages
// 2. Summarization — compress old messages into summary
// 3. Selective — only remember what user explicitly asks to remember
// 4. Decay — reduce relevance score over time (forget old info)`,
            language: 'csharp'
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Wrong chunk size</strong> — Too small loses context; too large dilutes relevance. 256-512 tokens is a good starting point.</li>
                <li><strong>No overlap</strong> — Key information at chunk boundaries gets split and lost</li>
                <li><strong>Vector-only search</strong> — Misses exact matches (error codes, product IDs). Always add keyword/hybrid.</li>
                <li><strong>No re-ranking</strong> — Top-K from vector search has ~60-70% precision; re-ranking improves to 85-95%</li>
                <li><strong>Stale embeddings</strong> — Documents change but embeddings are not re-computed</li>
                <li><strong>Ignoring metadata filters</strong> — Not filtering by date, source, or access level before search</li>
                <li><strong>No evaluation</strong> — Shipping RAG without measuring retrieval quality (recall@k, MRR)</li>
                <li><strong>Embedding everything</strong> — Tables, navigation, boilerplate reduce quality. Clean data first.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: { type: 'tip', title: 'What Interviewers Want to Hear', text: 'When discussing RAG, always mention: 1) Chunking strategy and why, 2) Hybrid search (not just vector), 3) Re-ranking for precision, 4) How you evaluate quality (retrieval metrics + end-to-end), 5) How you handle stale data. This shows production thinking beyond the tutorial level.' }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Production RAG = hybrid search + re-ranking + proper chunking + evaluation</li>
                <li>Chunking strategy dramatically affects quality — use document-aware splitting with overlap</li>
                <li>Hybrid search (vector + BM25) catches what each approach alone misses</li>
                <li>Re-ranking with cross-encoders is the highest-ROI improvement for retrieval precision</li>
                <li>Graph RAG enables multi-hop reasoning and relationship queries</li>
                <li>Memory architectures let agents maintain context across sessions</li>
                <li>Choose vector DB based on scale, hosting, and existing infrastructure</li>
                <li>Always evaluate RAG quality with metrics (recall@k, MRR, RAGAS framework)</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'rag-adv-q1',
            level: 'mid',
            title: 'Explain the difference between naive RAG and production RAG.',
            answer: `<p><strong>Naive RAG:</strong> Embed documents → vector similarity search → top-K into prompt → generate. Works for demos but has poor precision in production.</p>
            <p><strong>Production RAG adds:</strong></p>
            <ul>
                <li>Query transformation (rewrite, expand, HyDE)</li>
                <li>Hybrid search (vector + keyword/BM25)</li>
                <li>Re-ranking (cross-encoder scoring)</li>
                <li>Metadata filtering (date, source, access level)</li>
                <li>Parent-child chunking (index small, retrieve large)</li>
                <li>Evaluation pipeline (automated quality checks)</li>
                <li>Freshness management (re-embed on change)</li>
            </ul>`
        },
        {
            id: 'rag-adv-q2',
            level: 'senior',
            title: 'How would you design a RAG system for internal company documentation?',
            answer: `<p><strong>Architecture:</strong></p>
            <ol>
                <li><strong>Ingestion:</strong> Crawl Confluence/SharePoint → extract text → clean (remove nav, boilerplate) → chunk (heading-aware, 512 tokens, 50 overlap) → embed → store in Azure AI Search</li>
                <li><strong>Access control:</strong> Tag each chunk with source permissions. At query time, filter by user's access groups.</li>
                <li><strong>Search:</strong> Hybrid (vector + BM25) → RRF fusion → semantic re-rank → top-5</li>
                <li><strong>Generation:</strong> System prompt with retrieved chunks + citation instruction</li>
                <li><strong>Freshness:</strong> Webhook on doc update → re-embed changed chunks. Daily full re-sync.</li>
                <li><strong>Evaluation:</strong> Weekly sampling of Q&A pairs, human-rated relevance + faithfulness</li>
            </ol>`,
            followUp: ['How do you handle documents with tables and images?', 'How do you measure if the system is hallucinating vs retrieving correctly?']
        },
        {
            id: 'rag-adv-q3',
            level: 'senior',
            title: 'What is Reciprocal Rank Fusion (RRF) and why is it used in hybrid search?',
            answer: `<p><strong>RRF</strong> merges multiple ranked lists into one without needing comparable scores. Formula: <code>RRF(d) = sum(1 / (k + rank_i(d)))</code> where k is typically 60.</p>
            <p><strong>Why RRF:</strong> Vector similarity scores (0.0-1.0) and BM25 scores (0-50+) are on different scales. You cannot simply add them. RRF uses ranks (positions) instead of scores, making it scale-agnostic.</p>
            <p><strong>Example:</strong> Document appears at rank 2 in vector search and rank 5 in BM25: RRF = 1/(60+2) + 1/(60+5) = 0.016 + 0.015 = 0.031. Higher RRF = better combined relevance.</p>`
        },
        {
            id: 'rag-adv-q4',
            level: 'architect',
            title: 'When would you choose Graph RAG over standard vector RAG?',
            answer: `<p><strong>Use Graph RAG when:</strong></p>
            <ul>
                <li>Questions require multi-hop reasoning ("What teams use services that depend on Redis?")</li>
                <li>Data has explicit relationships (org charts, service dependencies, legal citations)</li>
                <li>You need global summarization across many documents (not just local retrieval)</li>
                <li>Answers require aggregation ("How many projects use .NET 8?")</li>
            </ul>
            <p><strong>Use standard vector RAG when:</strong></p>
            <ul>
                <li>Questions are about content/meaning (not relationships)</li>
                <li>Documents are independent (blog posts, FAQs, manuals)</li>
                <li>Simpler architecture is sufficient for the use case</li>
            </ul>
            <p><strong>Hybrid approach:</strong> Use both — vector for content retrieval, graph for relationship queries. Let the agent decide which to use based on query type.</p>`
        },
        {
            id: 'rag-adv-q5',
            level: 'mid',
            title: 'How do you choose the right chunk size for a RAG system?',
            answer: `<p><strong>Guidelines:</strong></p>
            <ul>
                <li><strong>256-512 tokens</strong> — Good default for most documents. Balances specificity and context.</li>
                <li><strong>128 tokens</strong> — For highly specific retrieval (FAQ, definitions). Use parent-child pattern.</li>
                <li><strong>1024+ tokens</strong> — For long-form reasoning where surrounding context matters.</li>
            </ul>
            <p><strong>How to decide:</strong></p>
            <ol>
                <li>Start at 512 with 50-token overlap</li>
                <li>Measure retrieval recall@5 on a test set</li>
                <li>Try 256 and 1024 — compare recall</li>
                <li>Use document-structure-aware splitting (headings, code blocks)</li>
            </ol>
            <p><strong>Key insight:</strong> There is no universal best size. It depends on document type, query patterns, and embedding model. Always measure.</p>`
        },
        {
            id: 'rag-adv-q6',
            level: 'senior',
            title: 'Compare Pinecone, Qdrant, and Azure AI Search for a .NET enterprise application.',
            answer: `<p><strong>For a .NET enterprise app, Azure AI Search is usually the best fit:</strong></p>
            <ul>
                <li><strong>Azure AI Search:</strong> Built-in hybrid search, semantic ranker, managed, Azure-native auth (Entra ID), .NET SDK, SOC2/HIPAA compliant. Higher cost but lowest operational burden.</li>
                <li><strong>Qdrant:</strong> Best raw performance (Rust), rich filtering, self-hosted option for data sovereignty. Requires infrastructure management. Good .NET client.</li>
                <li><strong>Pinecone:</strong> Simplest API, serverless scaling, no ops. Less filtering capability. Limited .NET support (REST only). Good for startups.</li>
            </ul>
            <p><strong>Decision factors:</strong> Already on Azure? → Azure AI Search. Need self-hosted? → Qdrant. Want zero ops + small scale? → Pinecone.</p>`
        },
        {
            id: 'rag-adv-q7',
            level: 'architect',
            title: 'How do you implement memory for a conversational AI agent that serves thousands of users?',
            answer: `<p><strong>Multi-tenant memory architecture:</strong></p>
            <ul>
                <li><strong>Per-user vector namespace</strong> — Each user's memories stored in isolated namespace/partition</li>
                <li><strong>Tiered memory:</strong> Hot (recent conversation in Redis) → Warm (session summary in vector DB) → Cold (archived in blob storage)</li>
                <li><strong>Memory extraction:</strong> After each conversation, extract key facts/preferences → embed → store</li>
                <li><strong>Relevance decay:</strong> Reduce score of old memories over time (exponential decay)</li>
                <li><strong>Capacity limits:</strong> Max memories per user (1000), auto-summarize oldest when full</li>
                <li><strong>Privacy:</strong> User can view/delete their memories (GDPR right to erasure)</li>
            </ul>
            <p><strong>At query time:</strong> Retrieve top-5 relevant memories → inject into system prompt → generate with personal context.</p>`,
            followUp: ['How do you handle contradictory memories?', 'How do you prevent memory poisoning from adversarial inputs?']
        },
        {
            id: 'rag-adv-q8',
            level: 'lead',
            title: 'How do you evaluate RAG quality in production?',
            answer: `<p><strong>Evaluation framework (RAGAS-style):</strong></p>
            <ul>
                <li><strong>Retrieval metrics:</strong> Recall@K (did we find relevant docs?), MRR (rank of first relevant), NDCG</li>
                <li><strong>Generation metrics:</strong> Faithfulness (is answer grounded in retrieved context?), Answer relevancy (does it address the question?)</li>
                <li><strong>End-to-end:</strong> Human-rated quality samples (weekly batch), user feedback (thumbs up/down)</li>
            </ul>
            <p><strong>Automated pipeline:</strong></p>
            <ol>
                <li>Maintain golden Q&A test set (50-100 pairs with known-good answers)</li>
                <li>Run nightly: query → retrieve → generate → compare to golden</li>
                <li>Alert on regression (faithfulness drops below threshold)</li>
                <li>LLM-as-judge for scalable evaluation</li>
            </ol>`,
            interviewTip: 'Discussing evaluation unprompted is a strong senior signal. Most candidates only talk about building RAG, not measuring it.'
        }
    ]
});
