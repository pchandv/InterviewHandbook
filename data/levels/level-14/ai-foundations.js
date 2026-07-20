/* Level 14 - AI Engineering: AI & ML Foundations */
'use strict';
PageData.register('ai-foundations', {
    "title": "AI & ML Foundations",
    "description": "Machine Learning vs Deep Learning vs Generative AI, transformer architecture, tokens, embeddings, context windows",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>AI Engineering requires understanding the foundation: how models work, what transformers are, how tokens and embeddings represent meaning, and the constraints (context windows, hallucinations, temperature) that shape application design.</p>"
        },
        {
            "title": "ML vs DL vs GenAI",
            "content": "<p><strong>Machine Learning</strong>: algorithms learn from data (regression, classification, clustering). <strong>Deep Learning</strong>: neural networks with many layers (CNNs, RNNs). <strong>Generative AI</strong>: models that create new content (text, images, code) using transformer architecture.</p>",
            "mermaid": "graph TD\n AI[Artificial Intelligence] --> ML[Machine Learning]\n ML --> DL[Deep Learning]\n DL --> GenAI[Generative AI]\n GenAI --> LLMs[Large Language Models]\n GenAI --> Diffusion[Image Models]\n GenAI --> Multimodal[Multimodal]"
        },
        {
            "title": "Transformer Architecture",
            "content": "<p>Self-attention mechanism processes all tokens in parallel (not sequential like RNNs). Encoder-decoder or decoder-only (GPT). Key innovation: attention weights learn which tokens are relevant to each other regardless of distance.</p>",
            "mermaid": "graph LR\n Input[Token Embeddings] --> PE[Position Encoding]\n PE --> SA[Self-Attention]\n SA --> FF[Feed Forward]\n FF --> Norm[Layer Norm]\n Norm --> Output[Next Token Probabilities]"
        },
        {
            "title": "Tokens and Embeddings",
            "content": "<p>Tokens: sub-word units (not characters, not full words). BPE tokenization. ~4 chars per token. Embeddings: dense vector representations capturing semantic meaning. Similar concepts = close vectors in embedding space.</p>"
        },
        {
            "title": "Context Windows",
            "content": "<p>Maximum tokens model can process in one call (input + output). GPT-4: 128K, Claude: 200K. Longer context = more cost, potential quality degradation at extremes. Strategies: chunking, summarization, RAG for exceeding limits.</p>"
        },
        {
            "title": "Temperature and Sampling",
            "content": "<p>Temperature controls randomness: 0 = deterministic (best for code/facts), 0.7 = creative (writing), 1.0+ = very random. Top-p (nucleus sampling) alternative to temperature.</p>"
        },
        {
            "title": "Hallucinations",
            "content": "<p>Models generate plausible-sounding but factually incorrect content. Causes: training data gaps, statistical generation, no real understanding. Mitigation: RAG, fact-checking, confidence scores, constrained generation.</p>"
        },
        {
            "title": "Common Mistakes",
            "content": "",
            "callout": {
                "type": "warning",
                "title": "Pitfalls",
                "text": "<ul><li>Treating LLMs as knowledge bases (they hallucinate)</li><li>Ignoring token limits (truncation loses context)</li><li>Temperature 0 for creative tasks</li><li>Not understanding tokenization costs</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Key Areas",
                "text": "<ul><li>Explain transformers vs RNNs</li><li>What are embeddings and why they matter</li><li>Hallucination mitigation strategies</li><li>When NOT to use GenAI</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "What is the difference between ML, DL, and GenAI?",
            "answer": "<p>ML: algorithms learn patterns from data. DL: multi-layer neural networks for complex patterns. GenAI: models that create new content using transformer architecture (LLMs, diffusion models).</p>"
        },
        {
            "id": "q2",
            "level": "junior",
            "title": "What are tokens?",
            "answer": "<p>Sub-word units that LLMs process. Approximately 4 characters per token. BPE tokenization splits text into common sub-word pieces. Token count determines cost and context usage.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "How do transformers work?",
            "answer": "<p>Self-attention mechanism processes all tokens in parallel. Attention weights learn relevance between any token pair regardless of distance. Multi-head attention captures different relationship types.</p>"
        },
        {
            "id": "q4",
            "level": "mid",
            "title": "What are embeddings?",
            "answer": "<p>Dense vector representations of tokens/text capturing semantic meaning. Similar concepts cluster in vector space. Enable semantic search, similarity comparison, and RAG retrieval.</p>"
        },
        {
            "id": "q5",
            "level": "mid",
            "title": "What causes hallucinations?",
            "answer": "<p>Statistical generation without real understanding. Training data gaps. Models optimize for plausibility not truth. Mitigation: RAG grounding, fact-checking, confidence thresholds, constrained outputs.</p>"
        },
        {
            "id": "q6",
            "level": "senior",
            "title": "Context window strategies for large documents?",
            "answer": "<p>Chunking with overlap, hierarchical summarization (map-reduce), RAG (retrieve relevant chunks only), sliding window approaches, document-level embeddings for routing.</p>"
        },
        {
            "id": "q7",
            "level": "senior",
            "title": "Temperature vs top-p?",
            "answer": "<p>Temperature scales logits before softmax (0=deterministic, higher=random). Top-p (nucleus): sample from smallest set of tokens whose cumulative probability exceeds p. Top-p adapts to distribution shape; temperature is uniform scaling.</p>"
        },
        {
            "id": "q8",
            "level": "lead",
            "title": "When should you NOT use GenAI?",
            "answer": "<p>Deterministic logic, exact calculations, safety-critical decisions without human review, low-latency real-time systems, when training data doesnt cover domain, when explainability is legally required.</p>"
        },
        {
            "id": "q9",
            "level": "architect",
            "title": "Design token-efficient system for high-throughput?",
            "answer": "<p>Prompt caching, semantic caching (similar queries), tiered models (fast cheap for simple, expensive for complex), batching requests, async processing, pre-computed responses for common patterns.</p>"
        }
    ]
});
