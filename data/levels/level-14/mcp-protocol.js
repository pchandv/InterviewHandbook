/* Level 14 - AI Engineering: Model Context Protocol */
'use strict';
PageData.register('mcp-protocol', {
    "title": "Model Context Protocol",
    "description": "MCP architecture, servers, clients, tools, resources, prompts, building MCP servers",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Model Context Protocol (MCP) is an open standard for connecting AI models to external tools, data sources, and services. It provides a standardized way for LLMs to interact with the outside world through a client-server architecture.</p>"
        },
        {
            "title": "MCP Architecture",
            "content": "<p>Host (IDE/app) contains MCP Client. Client connects to MCP Servers. Servers expose: Tools (actions the model can invoke), Resources (data the model can read), Prompts (reusable templates). Transport: stdio, HTTP/SSE.</p>",
            "mermaid": "graph LR\n Host[Host App] --> Client[MCP Client]\n Client --> S1[Server: Files]\n Client --> S2[Server: Database]\n Client --> S3[Server: API]\n S1 --> Tools1[Tools + Resources]\n S2 --> Tools2[Tools + Resources]\n S3 --> Tools3[Tools + Resources]"
        },
        {
            "title": "Tools",
            "content": "<p>Functions the model can call. Defined with name, description, input schema (JSON Schema). Server executes and returns results. Examples: search files, query database, call API, run code.</p>"
        },
        {
            "title": "Resources",
            "content": "<p>Data the model can read. URI-based access. Types: file contents, database records, API responses. Can be listed and subscribed for changes.</p>"
        },
        {
            "title": "Building MCP Server",
            "content": "<p>Implement server in any language (.NET, Python, TypeScript). Define tools with schemas. Handle tool calls. Return structured results. Package for distribution.</p>"
        },
        {
            "title": "MCP vs Function Calling",
            "content": "<p>Function calling: per-model, per-provider. MCP: universal standard, any model/any server. MCP servers are reusable across different AI hosts. Like USB for AI tools.</p>",
            "table": {
                "headers": [
                    "Aspect",
                    "Function Calling",
                    "MCP"
                ],
                "rows": [
                    [
                        "Standard",
                        "Provider-specific",
                        "Open protocol"
                    ],
                    [
                        "Reusability",
                        "Per-integration",
                        "Any host"
                    ],
                    [
                        "Discovery",
                        "Static",
                        "Dynamic"
                    ],
                    [
                        "Transport",
                        "HTTP only",
                        "stdio/HTTP/SSE"
                    ]
                ]
            }
        },
        {
            "title": "Best Practices",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "MCP Design",
                "text": "<ul><li>Small, focused servers (one concern each)</li><li>Clear tool descriptions (model reads them)</li><li>Input validation on server side</li><li>Error handling with useful messages</li><li>Security: limit server permissions</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>MCP vs function calling</li><li>Server design principles</li><li>Security considerations</li><li>When to build custom MCP server</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "What is MCP?",
            "answer": "<p>Model Context Protocol. Open standard connecting AI models to external tools and data. Client-server architecture where servers expose tools, resources, and prompts.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "MCP vs function calling?",
            "answer": "<p>Function calling is provider-specific. MCP is a universal standard: any server works with any host. Like USB for AI tools - plug and play across different models.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "What are MCP tools?",
            "answer": "<p>Actions the model can invoke. Defined with name, description (model reads this), and input JSON schema. Server executes and returns results to model.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "MCP server design principles?",
            "answer": "<p>Single responsibility (one concern per server), clear descriptions, input validation, graceful error handling, minimal permissions, stateless where possible.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "MCP security considerations?",
            "answer": "<p>Server runs with limited OS permissions, validate all inputs, sanitize outputs, dont expose secrets in tool responses, transport encryption for HTTP mode.</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "When to build custom MCP server?",
            "answer": "<p>When model needs access to: internal APIs, proprietary databases, custom business logic, hardware interfaces. Prefer existing servers for common tools (files, git, search).</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "MCP in enterprise architecture?",
            "answer": "<p>MCP gateway for auth/routing, server registry, permission model per user/role, audit logging of tool calls, rate limiting, sandboxed execution environments.</p>"
        }
    ]
});
