/* Level 14 - AI Engineering: RAG Advanced */
'use strict';
PageData.register('rag-advanced', {
    "title": "RAG Advanced",
    "description": "Reranking, metadata filtering, RAG architecture patterns, evaluation, production RAG",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Advanced RAG goes beyond basic retrieve-and-generate. Reranking improves precision, metadata filtering scopes searches, and evaluation frameworks ensure quality in production.</p>"
        },
        {
            "title": "Reranking",
            "content": "<p>Two-stage retrieval: (1) fast vector search returns top-K candidates, (2) cross-encoder reranker scores each candidate against query for precise relevance. Cohere Rerank, BGE-reranker. Significantly improves precision.</p>",
            "mermaid": "graph LR\n Q[Query] --> VDB[Vector Search Top-50]\n VDB --> Rerank[Cross-Encoder Rerank]\n Rerank --> Top5[Top-5 Results]\n Top5 --> LLM[Generate Answer]"
        },
        {
            "title": "Metadata Filtering",
            "content": "<p>Filter by document attributes before/after vector search: date, department, access level, document type. Reduces noise, enforces access control, enables scoped queries.</p>"
        },
        {
            "title": "RAG Patterns",
            "content": "<p>Naive RAG (basic), Advanced RAG (reranking, query expansion), Modular RAG (composable pipeline), Agentic RAG (agent decides what to retrieve). Each adds complexity and capability.</p>"
        },
        {
            "title": "Query Expansion",
            "content": "<p>Rephrase query multiple ways, search with all variants, merge results. HyDE: generate hypothetical answer, embed it, search for similar documents. Multi-query improves recall.</p>"
        },
        {
            "title": "Evaluation",
            "content": "<p>Metrics: retrieval relevance (precision@k, recall@k, MRR), generation quality (faithfulness, answer relevance, context utilization). Tools: RAGAS, TruLens, custom eval pipelines.</p>"
        },
        {
            "title": "Production Concerns",
            "content": "<p>Incremental indexing, document versioning, access control, cost per query tracking, latency budgets, failure handling (retrieval fails gracefully).</p>"
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>When to add reranking</li><li>Evaluation metrics for RAG</li><li>Agentic vs static RAG</li><li>Access control in RAG</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "mid",
            "title": "What is reranking in RAG?",
            "answer": "<p>Two-stage: fast vector search gets candidates, then cross-encoder precisely scores each against query. Improves precision significantly at small latency cost.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "RAG evaluation metrics?",
            "answer": "<p>Retrieval: precision@k, recall@k, MRR. Generation: faithfulness (grounded in sources), relevance (answers question), context utilization (uses retrieved info).</p>"
        },
        {
            "id": "q3",
            "level": "senior",
            "title": "Agentic RAG vs static RAG?",
            "answer": "<p>Static: fixed pipeline (retrieve then generate). Agentic: AI decides what to search, when, iterates if results insufficient. More capable but complex and costly.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Query expansion techniques?",
            "answer": "<p>Multi-query (rephrase N ways), HyDE (generate hypothetical doc, embed it), step-back (ask broader question first). All improve recall for ambiguous queries.</p>"
        },
        {
            "id": "q5",
            "level": "lead",
            "title": "Production RAG pipeline design?",
            "answer": "<p>Async ingestion, incremental indexing, retrieval service with caching, reranking layer, prompt assembly with citation tracking, evaluation in CI, A/B testing.</p>"
        },
        {
            "id": "q6",
            "level": "architect",
            "title": "Enterprise RAG challenges?",
            "answer": "<p>Multi-source (docs + DB + APIs), access control per user, freshness requirements, evaluation at scale, cost optimization, multi-language support.</p>"
        }
    ]
});
