/* Level 14 - AI Engineering: AI Real-World Projects */
'use strict';
PageData.register('ai-real-projects', {
    "title": "AI Real-World Projects",
    "description": "Chatbot, Document Q&A, Resume Analyzer, Code Review Assistant, Knowledge Base build guides",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Practical AI engineering means building real systems. This topic provides architecture blueprints and implementation guidance for common AI projects: chatbots, document Q&A, code review assistants, and knowledge bases.</p>"
        },
        {
            "title": "Conversational Chatbot",
            "content": "<p>Architecture: conversation memory + tool use + personality via system prompt. Handle: multi-turn context, topic switching, graceful failure, escalation to human. Production: rate limiting, logging, feedback collection.</p>",
            "mermaid": "graph TD\n User[User Message] --> Memory[Load History]\n Memory --> Classify{Intent?}\n Classify -->|Question| RAG[Retrieve Docs]\n Classify -->|Action| Tools[Execute Tool]\n Classify -->|Chat| Direct[Direct Response]\n RAG --> LLM\n Tools --> LLM\n Direct --> LLM\n LLM --> Save[Save to Memory]\n Save --> Response"
        },
        {
            "title": "Document Q&A System",
            "content": "<p>RAG-based: ingest documents (chunk, embed, store), user asks question, retrieve relevant chunks, generate grounded answer with citations. Production concerns: access control, freshness, evaluation.</p>"
        },
        {
            "title": "Code Review Assistant",
            "content": "<p>Analyze PRs/diffs for: bugs, security issues, performance, style. Architecture: parse diff, chunk by function, analyze each chunk, aggregate findings, present with severity and suggestions.</p>"
        },
        {
            "title": "Knowledge Base Builder",
            "content": "<p>Auto-organize and index company knowledge. Crawl sources (docs, wikis, Slack), chunk and embed, maintain freshness, provide search + Q&A interface. Handle: stale content, access control, conflicting information.</p>"
        },
        {
            "title": "Resume/Document Analyzer",
            "content": "<p>Structured extraction from unstructured text. Use: function calling for schema enforcement, multi-step (extract then validate then enrich). Handle: varied formats, missing data, confidence scoring.</p>"
        },
        {
            "title": "Common Architecture Patterns",
            "content": "<p>All projects share: ingestion pipeline, embedding + vector store, retrieval layer, LLM generation, evaluation, feedback loop. Differ in: domain specifics, quality requirements, update frequency.</p>",
            "mermaid": "graph LR\n Sources[Data Sources] --> Ingest[Ingest Pipeline]\n Ingest --> Store[Vector Store]\n Query[User Query] --> Retrieve[Retrieval]\n Store --> Retrieve\n Retrieve --> Generate[LLM Generate]\n Generate --> Eval[Evaluate]\n Eval --> Feedback[User Feedback]\n Feedback --> Improve[Improve Pipeline]"
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>Architecture for specific AI project</li><li>Evaluation strategy</li><li>Production readiness checklist</li><li>Scale and cost considerations</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "Basic chatbot architecture?",
            "answer": "<p>System prompt (personality), conversation memory, user input, LLM response. Add tools for actions, RAG for knowledge, memory management for long conversations.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "Document Q&A system design?",
            "answer": "<p>Ingest: chunk docs, embed, store in vector DB. Query: embed question, retrieve top-K chunks, augment prompt, generate answer with citations. Evaluate retrieval quality.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "How to handle document freshness?",
            "answer": "<p>Incremental indexing on change detection, TTL on embeddings, re-embed on document update, version tracking, stale content warnings in responses.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Code review AI architecture?",
            "answer": "<p>Parse diff into chunks (per function), analyze each for bugs/security/style, aggregate findings with severity, present actionable suggestions. Multi-model: fast for style, powerful for logic bugs.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "Evaluation for RAG system?",
            "answer": "<p>Retrieval: precision@k, recall@k. Generation: faithfulness, relevance, completeness. End-to-end: user satisfaction, task completion rate. Automated + human eval.</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "Production AI project checklist?",
            "answer": "<p>Evaluation pipeline, monitoring (quality + cost + latency), graceful degradation, user feedback loop, content freshness strategy, access control, compliance documentation.</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "Scaling AI project to enterprise?",
            "answer": "<p>Multi-tenant isolation, per-team access control on knowledge bases, cost allocation, SLA definitions, shared AI platform vs per-team instances, compliance certification.</p>"
        }
    ]
});
