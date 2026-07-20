/* Level 14 - AI Engineering: RAG Fundamentals */
'use strict';
PageData.register('rag-fundamentals', {
    "title": "RAG Fundamentals",
    "description": "What/why RAG, chunking strategies, embeddings, vector databases, semantic search, hybrid search",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Retrieval-Augmented Generation (RAG) combines LLMs with external knowledge retrieval. Instead of relying solely on training data, RAG retrieves relevant documents and includes them in the prompt, grounding responses in factual sources.</p>"
        },
        {
            "title": "Why RAG",
            "content": "<p>Solves: hallucinations (grounded in sources), stale knowledge (live data), domain specificity (company docs), traceability (cite sources). Alternative to fine-tuning: cheaper, updatable, attributable.</p>",
            "mermaid": "graph LR\n Q[User Query] --> Embed[Embed Query]\n Embed --> Search[Vector Search]\n Search --> Docs[Retrieved Chunks]\n Docs --> Prompt[Augmented Prompt]\n Prompt --> LLM\n LLM --> Answer[Grounded Answer]"
        },
        {
            "title": "Chunking Strategies",
            "content": "<p>Split documents into retrievable pieces. Methods: fixed-size (simple, overlap), semantic (paragraph/section boundaries), recursive (hierarchical splitting). Chunk size tradeoffs: small = precise retrieval, large = more context. Typical: 500-1000 tokens with 10-20% overlap.</p>"
        },
        {
            "title": "Embeddings",
            "content": "<p>Convert text to dense vectors capturing meaning. Models: OpenAI ada-002, Cohere, sentence-transformers. Dimension: 768-1536. Similar meaning = close vectors. Quality of embeddings determines retrieval quality.</p>"
        },
        {
            "title": "Vector Databases",
            "content": "<p>Store and search embeddings efficiently. Options: Pinecone (managed), Weaviate (open source), Qdrant, Milvus, pgvector (PostgreSQL). Support: similarity search, metadata filtering, hybrid search.</p>",
            "table": {
                "headers": [
                    "Database",
                    "Type",
                    "Strengths",
                    "Use Case"
                ],
                "rows": [
                    [
                        "Pinecone",
                        "Managed",
                        "Easy, scalable",
                        "Production SaaS"
                    ],
                    [
                        "pgvector",
                        "Extension",
                        "Existing Postgres",
                        "Simple RAG"
                    ],
                    [
                        "Qdrant",
                        "Self-hosted",
                        "Fast, flexible",
                        "On-prem"
                    ],
                    [
                        "Weaviate",
                        "Open source",
                        "Hybrid search",
                        "Complex queries"
                    ]
                ]
            }
        },
        {
            "title": "Semantic Search",
            "content": "<p>Find documents by meaning not keywords. Embed query, find nearest vectors. Cosine similarity or dot product. Returns relevant chunks regardless of exact word match.</p>"
        },
        {
            "title": "Hybrid Search",
            "content": "<p>Combine semantic (vector) + keyword (BM25) search. Reciprocal Rank Fusion merges results. Better than either alone: catches exact matches semantic might miss, and meaning keyword search misses.</p>",
            "mermaid": "graph TD\n Q[Query] --> VS[Vector Search]\n Q --> KW[Keyword BM25]\n VS --> RRF[Reciprocal Rank Fusion]\n KW --> RRF\n RRF --> Results[Ranked Results]"
        },
        {
            "title": "Common Mistakes",
            "content": "",
            "callout": {
                "type": "warning",
                "title": "RAG Pitfalls",
                "text": "<ul><li>Chunks too large (noisy retrieval)</li><li>Chunks too small (missing context)</li><li>No overlap (broken sentences)</li><li>Wrong embedding model for domain</li><li>No metadata filtering</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>RAG vs fine-tuning tradeoffs</li><li>Chunking strategy for your use case</li><li>Vector DB selection criteria</li><li>Evaluation metrics for retrieval</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "What is RAG?",
            "answer": "<p>Retrieval-Augmented Generation. Retrieve relevant documents from a knowledge base, include them in the LLM prompt, get grounded answers with sources.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "RAG vs fine-tuning?",
            "answer": "<p>RAG: external knowledge, updatable, attributable, cheaper. Fine-tuning: changes model behavior/style, permanent, expensive. RAG for knowledge, fine-tuning for behavior.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "Chunking strategy considerations?",
            "answer": "<p>Size: 500-1000 tokens typical. Overlap: 10-20% prevents breaking context. Method: semantic boundaries preferred over fixed-size. Balance: precision vs context.</p>"
        },
        {
            "id": "q4",
            "level": "mid",
            "title": "What are embeddings?",
            "answer": "<p>Dense vector representations of text meaning. Similar text = close vectors. Enable semantic search. Quality of embedding model determines retrieval relevance.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "Vector DB selection criteria?",
            "answer": "<p>Scale (documents), latency requirements, metadata filtering needs, hybrid search support, managed vs self-hosted, cost, existing infrastructure compatibility.</p>"
        },
        {
            "id": "q6",
            "level": "senior",
            "title": "Hybrid search advantages?",
            "answer": "<p>Combines semantic (meaning) + keyword (exact match). Catches what either alone misses. RRF merges rankings. Better recall for diverse query types.</p>"
        },
        {
            "id": "q7",
            "level": "lead",
            "title": "Production RAG architecture?",
            "answer": "<p>Ingestion pipeline (chunk, embed, store), retrieval service (search, rerank, filter), generation (prompt assembly, LLM call), evaluation (relevance metrics, user feedback).</p>"
        },
        {
            "id": "q8",
            "level": "architect",
            "title": "RAG at enterprise scale?",
            "answer": "<p>Multi-tenant isolation, access control on documents, incremental indexing, evaluation pipeline, A/B testing retrieval strategies, cost monitoring per query.</p>"
        }
    ]
});
