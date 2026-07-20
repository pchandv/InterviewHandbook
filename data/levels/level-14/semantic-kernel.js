/* Level 14 - AI Engineering: Semantic Kernel */
'use strict';
PageData.register('semantic-kernel', {
    "title": "Semantic Kernel",
    "description": "SK basics, plugins, memory, planning, function calling, multi-agent, RAG integration",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Semantic Kernel (SK) is Microsofts open-source SDK for building AI applications in .NET and Python. It provides a plugin architecture, memory abstractions, and planning capabilities for building production AI agents.</p>"
        },
        {
            "title": "Core Concepts",
            "content": "<p><strong>Kernel</strong>: orchestrator that connects plugins, memory, and AI services. <strong>Plugins</strong>: collections of functions (native code or prompts). <strong>Functions</strong>: units of work the kernel can invoke.</p>",
            "mermaid": "graph TD\n Kernel[Semantic Kernel] --> Plugins[Plugins]\n Kernel --> Memory[Memory Store]\n Kernel --> AI[AI Services]\n Plugins --> Native[Native Functions]\n Plugins --> Prompt[Prompt Functions]\n AI --> OpenAI[OpenAI]\n AI --> Azure[Azure OpenAI]"
        },
        {
            "title": "Plugins",
            "content": "<p>Group related functions. Native plugins: C# methods with descriptions. Prompt plugins: templated prompts. Auto-described for function calling. Import from OpenAPI specs.</p>"
        },
        {
            "title": "Memory and RAG",
            "content": "<p>SK provides memory abstractions for vector storage. Store facts, retrieve relevant context. Integrates with: Azure AI Search, Qdrant, Pinecone, pgvector. Built-in text chunking.</p>"
        },
        {
            "title": "Planning",
            "content": "<p>Planner analyzes available functions and creates execution plans. Handlebars planner, Stepwise planner. Auto-selects which functions to call in what order to achieve a goal.</p>"
        },
        {
            "title": "Multi-Agent with SK",
            "content": "<p>Agent framework in SK: define agents with instructions and tools. Chat between agents. AgentGroupChat for multi-turn collaboration. Selection and termination strategies.</p>"
        },
        {
            "title": "Best Practices",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "SK Patterns",
                "text": "<ul><li>Small focused plugins (single responsibility)</li><li>Descriptive function metadata (model reads it)</li><li>Use DI for service registration</li><li>Structured output with response types</li><li>Test plugins independently</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>SK vs LangChain</li><li>Plugin design principles</li><li>Memory/RAG integration</li><li>When to use planning vs explicit orchestration</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "What is Semantic Kernel?",
            "answer": "<p>Microsoft SDK for AI apps. Provides: kernel (orchestrator), plugins (functions), memory (vector store), AI services (OpenAI/Azure). Works in .NET and Python.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "What are SK plugins?",
            "answer": "<p>Collections of functions: native (C# methods) or prompt-based (templates). Decorated with descriptions for auto-discovery. Kernel invokes them via function calling.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "SK memory usage?",
            "answer": "<p>Vector store abstraction. Save facts with embeddings, retrieve relevant context. Integrates with Azure AI Search, Qdrant, pgvector. Enables RAG patterns in SK apps.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "SK vs LangChain?",
            "answer": "<p>SK: .NET-first, enterprise-focused, plugin architecture, Microsoft ecosystem. LangChain: Python-first, larger community, more integrations. SK better for .NET shops; LangChain for Python/research.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "SK planning strategies?",
            "answer": "<p>Auto function calling (model decides), Handlebars planner (template-based plan), Stepwise (iterative). For production: explicit orchestration preferred over auto-planning for reliability.</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "SK in enterprise architecture?",
            "answer": "<p>Kernel as singleton service, plugins per domain, memory backed by managed vector store, AI services via Azure OpenAI, DI registration, telemetry integration.</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "SK multi-agent design?",
            "answer": "<p>Specialized agents (research, writer, reviewer), AgentGroupChat for collaboration, selection strategy for turn-taking, termination on goal met, cost tracking per agent.</p>"
        }
    ]
});
