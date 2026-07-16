/* ═══════════════════════════════════════════════════════════════════
   AI Engineering 2.0 — MCP, Agents & Multi-Agent Systems
   Model Context Protocol, AI Agent architectures, A2A, Tool Calling,
   Multi-Agent orchestration, and Semantic Kernel advanced patterns.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('ai-mcp-agents', {
    title: 'MCP, Agents & Multi-Agent Systems',
    description: 'Model Context Protocol (MCP), AI agent design patterns, multi-agent orchestration, Agent-to-Agent (A2A) communication, advanced tool calling, and production agent architectures with Semantic Kernel.',
    difficulty: 'advanced',
    estimatedMinutes: 50,
    prerequisites: ['ai-fundamentals', 'ai-agents'],

    sections: [
        {
            title: 'Introduction',
            content: `<p><strong>AI Agents</strong> are autonomous systems that use LLMs to reason, plan, and execute actions via tools. The <strong>Model Context Protocol (MCP)</strong> standardizes how agents discover and call tools. <strong>Multi-Agent Systems</strong> coordinate multiple specialized agents to solve complex problems.</p>
            <p>This is the fastest-evolving area in AI engineering (2024-2026) and increasingly appears in senior interviews at Microsoft, Google, Amazon, and AI-first startups.</p>
            <ul>
                <li><strong>MCP</strong> — Open protocol (Anthropic) for connecting AI models to external tools/data</li>
                <li><strong>AI Agents</strong> — LLM + reasoning + tool use + memory + planning</li>
                <li><strong>Multi-Agent</strong> — Multiple specialized agents collaborating on complex tasks</li>
                <li><strong>A2A</strong> — Google protocol for agent-to-agent communication</li>
            </ul>`
        },
        {
            title: 'Model Context Protocol (MCP)',
            content: `<p><strong>MCP</strong> is a standardized JSON-RPC protocol that lets AI models discover and invoke external tools, access data resources, and use prompt templates. Think of it as "USB-C for AI" — one protocol, any model, any tool server.</p>
            <ul>
                <li><strong>Server</strong> — Exposes tools, resources, and prompts via JSON-RPC</li>
                <li><strong>Client</strong> — The AI host (Claude, Copilot, Kiro) that discovers and calls servers</li>
                <li><strong>Transport</strong> — stdio (local) or HTTP+SSE (remote)</li>
                <li><strong>Tools</strong> — Functions the model can call (with schema)</li>
                <li><strong>Resources</strong> — Data the model can read (files, DB records, APIs)</li>
                <li><strong>Prompts</strong> — Reusable prompt templates with parameters</li>
            </ul>`,
            code: `// MCP Server in C# (using ModelContextProtocol SDK)
using ModelContextProtocol.Server;
using ModelContextProtocol.Protocol;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddMcpServer(options =>
{
    options.ServerInfo = new ServerInfo("OrderService", "1.0.0");
});

// Register a tool
builder.Services.AddMcpTool<OrderLookupTool>();

var app = builder.Build();
app.MapMcpSse(); // HTTP+SSE transport
app.Run();

// Tool definition
[McpTool("lookup_order", "Look up order details by ID")]
public class OrderLookupTool
{
    [McpParameter("orderId", "The order ID to look up", required: true)]
    public int OrderId { get; set; }

    public async Task<McpToolResult> ExecuteAsync(IOrderService orders)
    {
        var order = await orders.GetByIdAsync(OrderId);
        if (order is null)
            return McpToolResult.Error("Order not found");

        return McpToolResult.Success(JsonSerializer.Serialize(order));
    }
}

// MCP Client configuration (mcp.json)
// {
//   "mcpServers": {
//     "order-service": {
//       "command": "dotnet",
//       "args": ["run", "--project", "OrderMcp"],
//       "env": { "ASPNETCORE_URLS": "http://localhost:5100" }
//     }
//   }
// }`,
            language: 'csharp',
            mermaid: `sequenceDiagram
    participant User
    participant LLM as AI Model (Client)
    participant MCP as MCP Server
    participant DB as Database

    User->>LLM: "What is order #123 status?"
    LLM->>MCP: tools/list (discover)
    MCP-->>LLM: [lookup_order, cancel_order, ...]
    LLM->>MCP: tools/call {name: lookup_order, args: {orderId: 123}}
    MCP->>DB: SELECT * FROM Orders WHERE Id = 123
    DB-->>MCP: {id: 123, status: "Shipped", ...}
    MCP-->>LLM: {result: {status: "Shipped", tracking: "1Z..."}}
    LLM-->>User: "Order #123 has shipped. Tracking: 1Z..."`
        },
        {
            title: 'AI Agent Architecture Patterns',
            content: `<p>Modern AI agents follow several architectural patterns, each suited to different complexity levels:</p>
            <ul>
                <li><strong>ReAct (Reason + Act)</strong> — Think, then call a tool, observe result, repeat</li>
                <li><strong>Plan-and-Execute</strong> — Create a plan first, then execute steps sequentially</li>
                <li><strong>Tree of Thought</strong> — Explore multiple reasoning paths, select the best</li>
                <li><strong>Reflexion</strong> — Agent critiques its own output and retries</li>
                <li><strong>Tool-Augmented Generation</strong> — LLM decides when to call tools mid-generation</li>
            </ul>`,
            code: `// Semantic Kernel — Agent with automatic function calling
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Agents;

// 1. Build kernel with plugins (tools)
var kernel = Kernel.CreateBuilder()
    .AddAzureOpenAIChatCompletion("gpt-4o", endpoint, credential)
    .Build();

kernel.ImportPluginFromType<OrderPlugin>();
kernel.ImportPluginFromType<CustomerPlugin>();
kernel.ImportPluginFromType<InventoryPlugin>();

// 2. Create a ChatCompletion Agent
var agent = new ChatCompletionAgent
{
    Name = "OrderAssistant",
    Instructions = """
        You are an order management assistant.
        Use available tools to look up orders, check inventory,
        and help customers. Always verify before making changes.
        """,
    Kernel = kernel,
    Arguments = new KernelArguments(
        new OpenAIPromptExecutionSettings
        {
            ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions,
            Temperature = 0.1f
        })
};

// 3. Agent conversation loop
var chat = new AgentGroupChat(agent);
chat.AddChatMessage(new ChatMessageContent(AuthorRole.User,
    "Cancel order #456 if it hasn't shipped yet"));

await foreach (var message in chat.InvokeAsync())
{
    Console.WriteLine($"[{message.AuthorName}]: {message.Content}");
    // Agent will: 1) call GetOrder(456), 2) check status,
    // 3) call CancelOrder(456) if not shipped, 4) respond
}`,
            language: 'csharp'
        },
        {
            title: 'Multi-Agent Systems',
            content: `<p><strong>Multi-Agent Systems</strong> use multiple specialized agents that collaborate to solve complex problems no single agent could handle alone. Each agent has its own role, tools, and expertise.</p>
            <ul>
                <li><strong>Orchestrator Pattern</strong> — One agent coordinates others (manager/worker)</li>
                <li><strong>Peer-to-Peer</strong> — Agents communicate directly with each other</li>
                <li><strong>Pipeline</strong> — Agents process sequentially (research → write → review)</li>
                <li><strong>Debate</strong> — Agents argue different positions, synthesize best answer</li>
                <li><strong>Swarm</strong> — Lightweight handoff between specialized agents</li>
            </ul>`,
            code: `// Semantic Kernel — Multi-Agent Group Chat
using Microsoft.SemanticKernel.Agents;
using Microsoft.SemanticKernel.Agents.Chat;

// Define specialized agents
var researcher = new ChatCompletionAgent
{
    Name = "Researcher",
    Instructions = "You research topics thoroughly. Cite sources. Be factual.",
    Kernel = kernel
};

var writer = new ChatCompletionAgent
{
    Name = "Writer",
    Instructions = "You write clear, engaging content based on research provided.",
    Kernel = kernel
};

var reviewer = new ChatCompletionAgent
{
    Name = "Reviewer",
    Instructions = """
        You review content for accuracy, clarity, and completeness.
        Approve with 'APPROVED' or request specific changes.
        """,
    Kernel = kernel
};

// Orchestrate with termination strategy
var chat = new AgentGroupChat(researcher, writer, reviewer)
{
    ExecutionSettings = new AgentGroupChatSettings
    {
        SelectionStrategy = new SequentialSelectionStrategy(),
        TerminationStrategy = new ApprovalTerminationStrategy
        {
            Agents = [reviewer],
            MaximumIterations = 6
        }
    }
};

chat.AddChatMessage(new ChatMessageContent(AuthorRole.User,
    "Write a technical blog post about circuit breaker patterns"));

await foreach (var msg in chat.InvokeAsync())
    Console.WriteLine($"[{msg.AuthorName}]: {msg.Content}");`,
            language: 'csharp',
            mermaid: `graph TD
    U[User Request] --> O[Orchestrator Agent]
    O --> R[Researcher Agent]
    O --> W[Writer Agent]
    O --> V[Reviewer Agent]
    R -->|"facts, sources"| O
    O -->|"research results"| W
    W -->|"draft content"| O
    O -->|"draft for review"| V
    V -->|"APPROVED / changes"| O
    O --> U2[Final Response]

    style O fill:#4f46e5,color:#fff
    style R fill:#10b981,color:#fff
    style W fill:#f59e0b,color:#fff
    style V fill:#ef4444,color:#fff`
        },
        {
            title: 'Agent-to-Agent (A2A) Communication',
            content: `<p><strong>A2A</strong> (Google, 2025) is a protocol for agents to discover, negotiate capabilities, and delegate tasks to each other — similar to how microservices communicate, but for AI agents.</p>
            <ul>
                <li><strong>Agent Card</strong> — JSON metadata describing an agent (name, capabilities, endpoint)</li>
                <li><strong>Task Delegation</strong> — One agent requests another to perform a subtask</li>
                <li><strong>Capability Discovery</strong> — Agents advertise what they can do</li>
                <li><strong>MCP vs A2A</strong> — MCP connects models to tools; A2A connects agents to agents</li>
            </ul>
            <p><strong>Key difference:</strong> MCP is model↔tool (vertical), A2A is agent↔agent (horizontal). They are complementary — an agent uses MCP to call tools, and A2A to delegate to peer agents.</p>`,
            table: {
                headers: ['Aspect', 'MCP', 'A2A'],
                rows: [
                    ['Purpose', 'Model ↔ Tool communication', 'Agent ↔ Agent communication'],
                    ['Protocol', 'JSON-RPC over stdio/HTTP+SSE', 'HTTP REST + Agent Cards'],
                    ['Discovery', 'tools/list, resources/list', 'Agent Card at /.well-known/agent.json'],
                    ['Interaction', 'Synchronous tool calls', 'Async task delegation'],
                    ['Use Case', 'Database lookup, API call, file read', 'Delegate research to specialist agent'],
                    ['Analogy', 'USB-C for AI tools', 'HTTP for AI agents']
                ]
            }
        },
        {
            title: 'Tool Calling & Structured Outputs',
            content: `<p><strong>Tool calling</strong> (function calling) is how LLMs invoke external functions. The model outputs a structured JSON call instead of text, and the runtime executes the function and feeds results back.</p>
            <ul>
                <li><strong>Parallel tool calls</strong> — Model can request multiple tools in one turn</li>
                <li><strong>Structured outputs</strong> — Force model to output valid JSON matching a schema</li>
                <li><strong>Tool choice</strong> — auto (model decides), required (must call), none (disabled)</li>
                <li><strong>Streaming + tools</strong> — Stream text while tool calls are pending</li>
            </ul>`,
            code: `// .NET — Tool calling with OpenAI SDK
using OpenAI.Chat;

// Define tools as JSON schema
var tools = new List<ChatTool>
{
    ChatTool.CreateFunctionTool(
        "get_weather",
        "Get current weather for a location",
        BinaryData.FromString("""
        {
            "type": "object",
            "properties": {
                "location": { "type": "string", "description": "City name" },
                "units": { "type": "string", "enum": ["celsius", "fahrenheit"] }
            },
            "required": ["location"]
        }
        """))
};

var options = new ChatCompletionOptions();
foreach (var tool in tools) options.Tools.Add(tool);

// First call — model decides to use a tool
var result = await client.CompleteChatAsync(messages, options);

if (result.Value.FinishReason == ChatFinishReason.ToolCalls)
{
    foreach (var toolCall in result.Value.ToolCalls)
    {
        // Execute the function
        var args = JsonDocument.Parse(toolCall.FunctionArguments);
        var location = args.RootElement.GetProperty("location").GetString();
        var weather = await weatherService.GetCurrentAsync(location);

        // Feed result back
        messages.Add(new ToolChatMessage(toolCall.Id,
            JsonSerializer.Serialize(weather)));
    }

    // Second call — model generates final response with tool results
    var finalResult = await client.CompleteChatAsync(messages, options);
    Console.WriteLine(finalResult.Value.Content[0].Text);
}`,
            language: 'csharp'
        },
        {
            title: 'AI Workflow Orchestration',
            content: `<p>Production AI systems rarely use a single prompt. They orchestrate complex workflows combining multiple LLM calls, tool invocations, conditional logic, and human-in-the-loop steps.</p>
            <ul>
                <li><strong>Semantic Kernel Process Framework</strong> — Define workflows as state machines</li>
                <li><strong>LangGraph</strong> — Graph-based agent workflow orchestration</li>
                <li><strong>Durable Functions + AI</strong> — Azure Durable Functions for long-running AI workflows</li>
                <li><strong>Patterns</strong> — Router, map-reduce, human approval gates, retry with escalation</li>
            </ul>`,
            code: `// Semantic Kernel — Process (workflow) framework
using Microsoft.SemanticKernel.Process;

// Define a document processing workflow
var process = new ProcessBuilder("DocumentProcessor");

// Steps
var extractStep = process.AddStepFromType<ExtractDataStep>();
var validateStep = process.AddStepFromType<ValidateStep>();
var approveStep = process.AddStepFromType<HumanApprovalStep>();
var saveStep = process.AddStepFromType<SaveToDbStep>();

// Transitions
process.OnInputEvent("DocumentReceived")
    .SendEventTo(new ProcessFunctionTargetBuilder(extractStep));

extractStep.OnEvent("DataExtracted")
    .SendEventTo(new ProcessFunctionTargetBuilder(validateStep));

validateStep.OnEvent("Valid")
    .SendEventTo(new ProcessFunctionTargetBuilder(approveStep));

validateStep.OnEvent("Invalid")
    .SendEventTo(new ProcessFunctionTargetBuilder(extractStep)); // retry

approveStep.OnEvent("Approved")
    .SendEventTo(new ProcessFunctionTargetBuilder(saveStep));

// Run
var kernelProcess = process.Build();
await kernelProcess.StartAsync(kernel, new KernelProcessEvent
{
    Id = "DocumentReceived",
    Data = new { FilePath = "invoice.pdf" }
});`,
            language: 'csharp'
        },
        {
            title: 'Best Practices',
            content: `<p>Production agent systems require careful engineering:</p>
            <ul>
                <li><strong>Limit tool scope</strong> — Give agents only the tools they need (principle of least privilege)</li>
                <li><strong>Add guardrails</strong> — Validate tool arguments before execution; confirm destructive actions</li>
                <li><strong>Set iteration limits</strong> — Prevent infinite loops (max 10 tool calls per turn)</li>
                <li><strong>Log everything</strong> — Every tool call, every LLM response, every decision for debugging</li>
                <li><strong>Human-in-the-loop</strong> — For high-stakes actions (payments, deletions, deployments)</li>
                <li><strong>Test with adversarial inputs</strong> — Prompt injection attempts, malformed tool responses</li>
                <li><strong>Graceful degradation</strong> — If a tool fails, agent should explain and suggest alternatives</li>
                <li><strong>Cost awareness</strong> — Multi-agent loops can burn tokens fast; add budget limits</li>
            </ul>`,
            callout: { type: 'tip', title: 'Interview Tip', text: 'When asked about AI agents, always discuss guardrails and failure modes. Interviewers want to hear you think about production safety, not just the happy path. Mention: tool validation, rate limiting, human approval gates, and observability.' }
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Over-engineering</strong> — Using multi-agent when a single prompt + tool call suffices</li>
                <li><strong>No termination condition</strong> — Agents looping forever without convergence criteria</li>
                <li><strong>Too many tools</strong> — LLMs get confused with 50+ tools; use routing or sub-agents</li>
                <li><strong>Ignoring cost</strong> — Multi-agent debate can use 10-50x tokens vs single call</li>
                <li><strong>No observability</strong> — Cannot debug agent failures without tracing each step</li>
                <li><strong>Trusting tool outputs blindly</strong> — Agent should validate tool responses make sense</li>
                <li><strong>Mixing MCP and A2A concepts</strong> — MCP is for tools, A2A is for agent delegation</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>MCP standardizes model↔tool communication (JSON-RPC, tools/resources/prompts)</li>
                <li>AI Agents = LLM + reasoning + tool use + memory; use ReAct or plan-and-execute patterns</li>
                <li>Multi-Agent Systems coordinate specialists; use orchestrator, pipeline, or debate patterns</li>
                <li>A2A is for agent↔agent delegation; complementary to MCP</li>
                <li>Tool calling enables models to invoke structured functions with validated schemas</li>
                <li>Always add guardrails, iteration limits, cost budgets, and observability to production agents</li>
                <li>Semantic Kernel is Microsoft's primary SDK for building .NET AI agents</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'mcp-agents-q1',
            level: 'mid',
            title: 'What is the Model Context Protocol (MCP) and why was it created?',
            answer: `<p>MCP is an open protocol (created by Anthropic) that standardizes how AI models connect to external tools and data sources. It uses JSON-RPC over stdio or HTTP+SSE transport.</p>
            <p><strong>Why it exists:</strong> Before MCP, every AI tool integration was custom — different APIs, different auth, different discovery. MCP provides a universal interface so any MCP-compatible model can use any MCP-compatible tool server, similar to how USB-C standardized device connectivity.</p>
            <p><strong>Three primitives:</strong> Tools (functions to call), Resources (data to read), Prompts (reusable templates).</p>`,
            followUp: ['How does MCP handle authentication?', 'What is the difference between stdio and HTTP+SSE transport?']
        },
        {
            id: 'mcp-agents-q2',
            level: 'senior',
            title: 'Compare MCP and A2A. When would you use each?',
            answer: `<p><strong>MCP</strong> connects a model to tools (vertical: model↔tool). <strong>A2A</strong> connects agents to other agents (horizontal: agent↔agent). They are complementary.</p>
            <p><strong>Use MCP when:</strong> Your agent needs to call a database, API, file system, or any external service.</p>
            <p><strong>Use A2A when:</strong> You have multiple specialized agents and one needs to delegate a subtask to another (e.g., a planning agent delegates research to a specialist).</p>
            <p><strong>Analogy:</strong> MCP is like REST APIs for tools. A2A is like service mesh for agents.</p>`,
            interviewTip: 'Show you understand the ecosystem is converging: MCP for tools, A2A for agent collaboration, and SDKs like Semantic Kernel for orchestration.'
        },
        {
            id: 'mcp-agents-q3',
            level: 'senior',
            title: 'Design a multi-agent system for an e-commerce customer service platform.',
            answer: `<p><strong>Architecture:</strong></p>
            <ul>
                <li><strong>Router Agent</strong> — Classifies intent (order, refund, product info, complaint)</li>
                <li><strong>Order Agent</strong> — Tools: order lookup, shipping tracking, cancel/modify</li>
                <li><strong>Refund Agent</strong> — Tools: refund eligibility check, process refund, escalate</li>
                <li><strong>Product Agent</strong> — Tools: catalog search, inventory check, recommendations</li>
                <li><strong>Escalation Agent</strong> — Human-in-the-loop for complex cases</li>
            </ul>
            <p><strong>Pattern:</strong> Orchestrator (Router) dispatches to specialists. Each agent has limited tool access (least privilege). Escalation has approval gates.</p>
            <p><strong>Guardrails:</strong> Refund agent cannot process amounts over $500 without human approval. All agents have 5-turn conversation limit before escalating.</p>`,
            followUp: ['How would you handle a request that spans multiple agents?', 'How do you test this system?', 'What observability would you add?']
        },
        {
            id: 'mcp-agents-q4',
            level: 'architect',
            title: 'What are the failure modes of multi-agent systems and how do you mitigate them?',
            answer: `<p><strong>Failure modes:</strong></p>
            <ul>
                <li><strong>Infinite loops</strong> — Agents keep delegating to each other without resolution → Mitigation: max iteration count, timeout, convergence detection</li>
                <li><strong>Cascading hallucination</strong> — One agent hallucinates, others build on false info → Mitigation: fact-checking agent, grounding in retrieved data</li>
                <li><strong>Cost explosion</strong> — Multi-agent debate uses exponential tokens → Mitigation: token budgets per agent, early termination on agreement</li>
                <li><strong>Deadlock</strong> — Two agents waiting on each other → Mitigation: async task queues, timeout-based fallback</li>
                <li><strong>Context overflow</strong> — Shared context grows beyond window → Mitigation: summarization agent, sliding window, selective memory</li>
            </ul>
            <p><strong>Production mitigations:</strong> Circuit breakers per agent, distributed tracing (correlate agent→sub-agent calls), budget alerts, graceful degradation to single-agent fallback.</p>`,
            interviewTip: 'Discussing failure modes unprompted shows production maturity. Always pair a pattern with its failure mode and mitigation.'
        },
        {
            id: 'mcp-agents-q5',
            level: 'mid',
            title: 'Explain the ReAct pattern for AI agents.',
            answer: `<p><strong>ReAct</strong> (Reason + Act) is the foundational agent loop:</p>
            <ol>
                <li><strong>Thought</strong> — The model reasons about what to do next</li>
                <li><strong>Action</strong> — The model calls a tool with specific arguments</li>
                <li><strong>Observation</strong> — The tool result is fed back to the model</li>
                <li><strong>Repeat</strong> — Until the model has enough information to answer</li>
            </ol>
            <p>This is how most production agents work under the hood. Semantic Kernel's auto-function-calling implements ReAct implicitly.</p>`,
            code: `// Pseudo-code for ReAct loop
while (not done && iterations < MAX_ITERATIONS)
{
    // Thought: LLM decides what to do
    var response = await llm.Complete(messages);

    if (response.HasToolCalls)
    {
        // Action: Execute tool
        foreach (var call in response.ToolCalls)
        {
            var result = await ExecuteTool(call);
            // Observation: Add result to context
            messages.Add(new ToolMessage(call.Id, result));
        }
        iterations++;
    }
    else
    {
        // Final answer
        done = true;
        return response.Content;
    }
}`,
            language: 'csharp'
        },
        {
            id: 'mcp-agents-q6',
            level: 'senior',
            title: 'How would you implement an MCP server for a database?',
            answer: `<p>An MCP server for a database would expose read-only query tools and optionally write tools with confirmation:</p>
            <ul>
                <li><strong>Tools:</strong> query_table (parameterized SQL), get_schema, search_records</li>
                <li><strong>Resources:</strong> Table schemas, sample data, relationships</li>
                <li><strong>Security:</strong> Read-only by default, parameterized queries only (no raw SQL), row-level access control</li>
                <li><strong>Transport:</strong> stdio for local dev, HTTP+SSE for remote with auth</li>
            </ul>
            <p><strong>Critical:</strong> Never expose raw SQL execution. Always parameterize. Add query timeout. Log all queries. Rate limit.</p>`,
            commonMistakes: ['Allowing raw SQL execution (SQL injection risk)', 'No rate limiting (model could spam queries)', 'Returning too much data (context overflow)', 'Not validating table/column names against allowlist']
        },
        {
            id: 'mcp-agents-q7',
            level: 'architect',
            title: 'Design the architecture for a coding assistant that uses MCP to access a codebase.',
            answer: `<p><strong>Architecture:</strong></p>
            <ul>
                <li><strong>MCP Servers:</strong> file-system (read/write files), git (status/diff/commit), language-server (diagnostics/symbols), terminal (run commands), search (ripgrep)</li>
                <li><strong>Agent:</strong> Semantic Kernel agent with auto-function-calling, connected to all MCP servers</li>
                <li><strong>Memory:</strong> Conversation history + project context (key files, architecture notes)</li>
                <li><strong>Guardrails:</strong> Confirm before write operations, never push to main, never modify .env files</li>
                <li><strong>Observability:</strong> Log every tool call, track token usage, measure task completion rate</li>
            </ul>
            <p>This is essentially how Kiro, Cursor, and GitHub Copilot Workspace work under the hood.</p>`,
            followUp: ['How would you handle large codebases that exceed context windows?', 'How do you test a coding assistant?', 'What security concerns exist?']
        },
        {
            id: 'mcp-agents-q8',
            level: 'mid',
            title: 'What is Semantic Kernel and how does it compare to LangChain?',
            answer: `<p><strong>Semantic Kernel</strong> is Microsoft's SDK for building AI agents in .NET (and Python). <strong>LangChain</strong> is the Python-first equivalent.</p>
            <table><thead><tr><th>Aspect</th><th>Semantic Kernel</th><th>LangChain</th></tr></thead>
            <tbody>
                <tr><td>Language</td><td>C# (primary), Python</td><td>Python (primary), JS</td></tr>
                <tr><td>Agent Framework</td><td>Built-in Agents, Group Chat</td><td>LangGraph, AgentExecutor</td></tr>
                <tr><td>Tool Integration</td><td>Plugins (KernelFunction)</td><td>Tools (BaseTool)</td></tr>
                <tr><td>Memory</td><td>Chat history, vector store</td><td>Various memory types</td></tr>
                <tr><td>Enterprise</td><td>Strong (Azure-native, DI-friendly)</td><td>Startup-oriented</td></tr>
                <tr><td>MCP Support</td><td>Via ModelContextProtocol SDK</td><td>Via mcp package</td></tr>
            </tbody></table>
            <p>Choose Semantic Kernel for .NET enterprise apps. Choose LangChain for Python-first or rapid prototyping.</p>`
        },
        {
            id: 'mcp-agents-q9',
            level: 'lead',
            title: 'How do you decide between a single agent and a multi-agent system?',
            answer: `<p><strong>Use single agent when:</strong></p>
            <ul>
                <li>Task is well-defined with clear tool set (< 10 tools)</li>
                <li>One domain of expertise suffices</li>
                <li>Low latency required (multi-agent adds round trips)</li>
                <li>Cost sensitivity (single call vs N calls)</li>
            </ul>
            <p><strong>Use multi-agent when:</strong></p>
            <ul>
                <li>Task requires multiple domains of expertise</li>
                <li>You need checks-and-balances (writer + reviewer)</li>
                <li>Tool count exceeds model's effective limit (>15-20)</li>
                <li>You need different temperature/model for different subtasks</li>
                <li>Human approval gates at specific steps</li>
            </ul>
            <p><strong>Rule of thumb:</strong> Start with single agent. Add agents only when you can identify clear specialization boundaries.</p>`,
            interviewTip: 'The best answer shows you resist over-engineering. Start simple, add complexity only when single-agent measurably fails.'
        },
        {
            id: 'mcp-agents-q10',
            level: 'architect',
            title: 'How would you add observability to a multi-agent production system?',
            answer: `<p><strong>Observability stack for agents:</strong></p>
            <ul>
                <li><strong>Distributed tracing</strong> — Correlation ID across agent→sub-agent→tool calls (OpenTelemetry)</li>
                <li><strong>Token metering</strong> — Track input/output tokens per agent per turn</li>
                <li><strong>Tool call logging</strong> — Every tool invocation with args, duration, result status</li>
                <li><strong>Decision tracing</strong> — Log the model's reasoning (thought steps) for debugging</li>
                <li><strong>Quality metrics</strong> — Task success rate, hallucination rate, escalation rate</li>
                <li><strong>Cost dashboards</strong> — Dollar cost per conversation, per agent, per tool</li>
                <li><strong>Alerting</strong> — Infinite loop detection, cost spike, error rate threshold</li>
            </ul>
            <p><strong>Tools:</strong> Azure AI Studio, LangSmith, Phoenix (Arize), custom OpenTelemetry exporters.</p>`,
            bestPractices: ['Use structured logging with agent name, turn number, and correlation ID', 'Record model reasoning traces for post-hoc analysis', 'Set up cost alerts before hitting production', 'A/B test agent configurations with quality evaluation']
        }
    ]
});
