/* ═══════════════════════════════════════════════════════════════════
   AI — Agents, MCP, Semantic Kernel, AI Architecture
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('ai-agents', {
    title: 'AI Agents & Tools',
    description: 'Semantic Kernel, LangChain, Model Context Protocol (MCP), AI agents with tool use, GitHub Copilot patterns, and architecting AI-powered applications.',
    sections: [
        {
            title: 'AI Agents & Semantic Kernel',
            content: `<p><strong>AI Agents</strong> are LLM-powered systems that can reason, plan, and take actions by calling tools/functions. <strong>Semantic Kernel</strong> is Microsoft's SDK for building AI agents in .NET — orchestrating LLMs with plugins (tools) the model can invoke.</p>`,
            code: `// Semantic Kernel — AI orchestration in .NET
var kernel = Kernel.CreateBuilder()
    .AddAzureOpenAIChatCompletion("gpt-4o", endpoint, credential)
    .Build();

// Define plugins (tools the LLM can call):
public class OrderPlugin
{
    [KernelFunction, Description("Get order details by order ID")]
    public async Task<OrderDto> GetOrder(
        [Description("The order ID to look up")] int orderId,
        IOrderService orderService)
    {
        return await orderService.GetByIdAsync(orderId);
    }

    [KernelFunction, Description("Cancel an order if it hasn't shipped yet")]
    public async Task<string> CancelOrder(int orderId, IOrderService orderService)
    {
        var result = await orderService.CancelAsync(orderId);
        return result ? "Order cancelled successfully" : "Cannot cancel — already shipped";
    }
}

// Register plugins and enable auto-function-calling:
kernel.ImportPluginFromType<OrderPlugin>();
kernel.ImportPluginFromType<CustomerPlugin>();
kernel.ImportPluginFromType<ProductPlugin>();

var settings = new OpenAIPromptExecutionSettings
{
    ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions
};

// Agent conversation:
var chatHistory = new ChatHistory();
chatHistory.AddSystemMessage("You are a customer service agent. Help users with their orders.");
chatHistory.AddUserMessage("What is the status of my order #12345?");

var response = await kernel.GetRequiredService<IChatCompletionService>()
    .GetChatMessageContentAsync(chatHistory, settings, kernel);
// LLM automatically calls GetOrder(12345), gets result, responds in natural language

// MODEL CONTEXT PROTOCOL (MCP):
// Standardized protocol for connecting AI models to external tools/data
// Server exposes: tools (functions), resources (data), prompts (templates)
// Client (AI agent) discovers and calls these via JSON-RPC
// Benefit: any MCP-compatible model can use any MCP-compatible tool server`,
            language: 'csharp'
        },
        {
            title: 'AI Architecture Patterns',
            content: `<p>Architecting AI into production applications requires handling: non-determinism, latency, cost, safety guardrails, and graceful degradation when AI is unavailable.</p>`,
            code: `// AI ARCHITECTURE PATTERNS:

// 1. HUMAN-IN-THE-LOOP: AI suggests, human approves
// Use: content moderation, medical diagnosis, financial decisions
// Pattern: AI generates → human reviews → system executes

// 2. RAG + AGENT: retrieve context, reason, act
// Use: customer support, internal knowledge bots, code assistants
// Pattern: query → retrieve docs → LLM reasons → calls tools → responds

// 3. GUARDRAILS: prevent harmful/incorrect outputs
// Input guardrails: reject prompt injection, validate intent
// Output guardrails: check for PII, hallucination, harmful content
// Pattern: input filter → LLM → output filter → user

// 4. FALLBACK: graceful degradation when AI fails
// If LLM timeout/error → fall back to rule-based system
// If confidence low → escalate to human
// Never let AI failure break the primary user flow

// 5. EVALUATION & MONITORING:
// Track: accuracy, latency, cost per request, user satisfaction
// A/B test AI features against non-AI baseline
// Log all prompts + responses for debugging (redact PII!)

// Production considerations:
// - Rate limiting: LLM APIs have TPM (tokens per minute) limits
// - Cost control: GPT-4 is 10-30x more expensive than GPT-3.5
// - Latency: LLM calls take 1-10 seconds (cache where possible)
// - Non-determinism: same input may give different output (temperature)
// - Security: prompt injection attacks (user manipulates system prompt)

// Cost optimization:
// - Use smaller models for simple tasks (GPT-3.5 for classification)
// - Cache frequent queries (same question = same answer)
// - Batch processing for non-real-time (cheaper batch API pricing)
// - Fine-tune small model for specific tasks (replaces expensive large model)`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'What is an AI Agent and how does function calling / tool use work?',
            difficulty: 'medium',
            answer: `<p>An <strong>AI Agent</strong> is an LLM-powered system that can reason about tasks and take actions by calling external tools/functions. The LLM decides WHICH tool to call and with WHAT parameters based on the user request and available tool descriptions. The system executes the tool, returns results to the LLM, and the LLM formulates a natural language response.</p>`,
            bestPractices: ['Define clear, well-documented tool descriptions (the LLM reads these to decide what to call)', 'Implement guardrails on tool execution (validate parameters, limit destructive actions)', 'Use Semantic Kernel or LangChain for orchestration (don\'t build from scratch)', 'Design for graceful degradation (agent fails → fallback to non-AI path)'],
            commonMistakes: ['Giving agents unrestricted access to destructive operations (delete, payment)', 'Poor tool descriptions (LLM cannot determine when/how to use the tool)', 'Not handling tool execution failures (LLM needs error context to recover)', 'Ignoring cost and latency (agent loops calling tools can be expensive)'],
            interviewTip: 'Explain the loop: User prompt → LLM reasons → decides to call Tool X with params → System executes tool → Result returned to LLM → LLM may call another tool or respond to user. This "ReAct" (Reason + Act) loop is the core of AI agents.',
            followUp: ['What is the Model Context Protocol (MCP)?', 'How do you prevent prompt injection in agents?', 'What is Semantic Kernel vs LangChain?'],
            seniorPerspective: 'I build AI agents with strict permission boundaries: read-only tools are auto-invoked, but any write/delete operation requires explicit user confirmation. The agent suggests the action, but the human approves execution. This prevents expensive mistakes.',
            architectPerspective: 'AI agents are the new integration pattern — instead of building dedicated UIs for every operation, a well-tooled agent provides natural language access to your entire system. The architectural challenge: governing what the agent can do, auditing what it did, and ensuring it cannot be manipulated via prompt injection to exceed its permissions.'
        },
        {
            question: 'What problem does the Model Context Protocol (MCP) solve, and how is it architected?',
            difficulty: 'hard',
            answer: `<p>The <strong>Model Context Protocol (MCP)</strong> is an open standard (introduced by Anthropic) that solves the <strong>M×N integration problem</strong>: without it, every AI application has to build a bespoke connector for every tool/data source, so M apps times N tools means M×N custom integrations. MCP turns this into M+N — each tool implements one MCP server, and each AI host implements one MCP client.</p>
<p>Architecture:</p>
<ul>
<li><strong>Host</strong>: the AI application (e.g., an IDE, Claude Desktop, a custom agent) that contains one or more clients.</li>
<li><strong>Client</strong>: maintains a 1:1 session with a server and handles the protocol.</li>
<li><strong>Server</strong>: exposes capabilities — <code>tools</code> (callable functions), <code>resources</code> (readable data/context), and <code>prompts</code> (reusable templates).</li>
</ul>
<p>Communication is <strong>JSON-RPC 2.0</strong> over a transport: <code>stdio</code> for local servers or <strong>Streamable HTTP</strong> (with Server-Sent Events) for remote servers. The session begins with a capability-negotiation handshake, after which the client can discover and invoke what the server offers.</p>`,
            explanation: 'MCP is like USB-C for AI tools. Before, every device needed its own special cable to every laptop. Now there is one standard port, so any tool plugs into any AI app.',
            code: `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_order",
    "arguments": { "orderId": 12345 }
  }
}
// Server response:
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      { "type": "text", "text": "Order 12345: shipped on 2024-03-10, total $89.99" }
    ],
    "isError": false
  }
}`,
            language: 'json',
            bestPractices: ['Expose narrow, well-described tools per server so the model can reliably choose them', 'Use stdio transport for local/desktop integrations and Streamable HTTP for remote/multi-user servers', 'Authenticate and authorize at the server boundary — MCP defines the protocol, not your trust model', 'Version your server capabilities and negotiate them during the initialize handshake'],
            commonMistakes: ['Treating MCP as a security boundary by itself (you still must auth, sandbox, and authorize tool calls)', 'Building one giant server with dozens of overlapping tools, confusing the model\'s selection', 'Ignoring that resources (read context) and tools (actions) are distinct capabilities with different risk', 'Hardcoding a single transport instead of supporting the appropriate one for local vs remote'],
            interviewTip: 'Anchor on the M×N to M+N framing — that one sentence shows you understand why MCP exists, not just what it is.',
            followUp: ['How does MCP differ from OpenAI function calling?', 'How would you secure a remote MCP server?', 'What are resources vs tools vs prompts in MCP?'],
            seniorPerspective: 'In practice MCP\'s value is reuse: I built one MCP server wrapping our internal order system, and the same server now powers our IDE assistant, a support bot, and an internal ops agent without re-integrating each time. The discipline it forces — clear tool descriptions and a clean capability surface — is what makes the agents reliable.',
            architectPerspective: 'MCP decouples model providers from tool providers, which is strategically important: it prevents lock-in to a single LLM vendor\'s function-calling format. At the org level I treat MCP servers as governed internal products with their own authn/authz, audit logging, and rate limiting, because they become shared access points to critical systems across many agents.'
        },
        {
            question: 'Design a production RAG (Retrieval-Augmented Generation) pipeline. What are the main failure modes?',
            difficulty: 'advanced',
            answer: `<p><strong>RAG</strong> grounds an LLM in your own data by retrieving relevant context at query time and injecting it into the prompt, reducing hallucination and avoiding the need to fine-tune. A production pipeline has two phases:</p>
<ul>
<li><strong>Ingestion (offline)</strong>: load documents → <strong>chunk</strong> them (semantically, with overlap) → generate <strong>embeddings</strong> → store vectors plus metadata in a vector store (e.g., Azure AI Search, pgvector, Pinecone).</li>
<li><strong>Query (online)</strong>: embed the user query → <strong>retrieve</strong> top-k similar chunks (often hybrid: vector + keyword/BM25) → optionally <strong>rerank</strong> → assemble a grounded prompt with citations → call the LLM → return the answer with sources.</li>
</ul>
<p>Main failure modes:</p>
<ul>
<li><strong>Poor chunking</strong>: chunks too large dilute relevance; too small lose context. Splitting mid-sentence/table destroys meaning.</li>
<li><strong>Retrieval miss</strong>: the right chunk is not in top-k (embedding mismatch, no hybrid search), so the model answers from parametric memory and hallucinates.</li>
<li><strong>Context window overflow / lost-in-the-middle</strong>: stuffing too many chunks degrades the model's use of them.</li>
<li><strong>Stale index</strong>: source data changed but embeddings were not re-indexed.</li>
<li><strong>No grounding enforcement</strong>: the model ignores retrieved context and answers anyway.</li>
</ul>`,
            explanation: 'RAG is like an open-book exam. Instead of memorizing everything, the student looks up the relevant page and answers from it. If they grab the wrong page or a torn one, the answer is wrong.',
            code: `# Query-time RAG flow (pseudocode)
query_vec = embed(user_query)

# Hybrid retrieval: combine semantic + keyword, then rerank
candidates = vector_store.search(query_vec, top_k=20)
candidates += keyword_search(user_query, top_k=20)
top_chunks = rerank(user_query, candidates)[:5]

# Build a grounded prompt that forces citation
context = "\\n\\n".join(f"[{c.id}] {c.text}" for c in top_chunks)
prompt = f"""Answer ONLY using the context. Cite sources by [id].
If the answer is not in the context, say you don't know.

Context:
{context}

Question: {user_query}"""

answer = llm.complete(prompt, temperature=0)`,
            language: 'python',
            bestPractices: ['Use hybrid retrieval (vector + keyword) plus a reranker rather than pure vector similarity', 'Chunk on semantic boundaries with overlap and store rich metadata for filtering', 'Instruct the model to answer only from context and to say "I don\'t know" when unsupported', 'Return citations and evaluate retrieval quality separately from generation quality'],
            commonMistakes: ['Blaming the LLM for hallucination when the real problem is retrieval missing the relevant chunk', 'Fixed-size character chunking that splits tables, code, or sentences mid-thought', 'Never re-indexing, so the vector store drifts out of sync with the source of truth', 'Stuffing dozens of chunks into the prompt, hitting context limits and lost-in-the-middle degradation'],
            interviewTip: 'Separate retrieval quality from generation quality in your answer — most RAG failures are retrieval problems, and saying so signals real production experience.',
            followUp: ['How do you evaluate a RAG system?', 'When would you fine-tune instead of using RAG?', 'What is reranking and why does it help?'],
            seniorPerspective: 'Most "the model is hallucinating" tickets I have triaged were actually retrieval failures — the answer simply was not in the top-k. I instrument the pipeline to log retrieved chunks alongside answers, then measure retrieval recall first; fixing chunking and adding hybrid search usually moves the needle far more than swapping the LLM.',
            architectPerspective: 'RAG is a data engineering problem wearing an AI hat. The hard, ongoing cost is the ingestion pipeline: change-data-capture to keep embeddings fresh, access control so retrieval respects per-user permissions, and cost/latency budgets for embedding at scale. I architect the vector store and re-indexing pipeline with the same rigor as a primary datastore, because retrieval quality caps the entire system\'s usefulness.'
        },
        {
            question: 'How do you defend an LLM agent against prompt injection, and why are output guardrails not enough?',
            difficulty: 'expert',
            answer: `<p><strong>Prompt injection</strong> is when untrusted input manipulates the model into ignoring its instructions or misusing its tools. There are two forms: <strong>direct</strong> (the user types "ignore previous instructions...") and the more dangerous <strong>indirect</strong>, where malicious instructions are hidden in content the agent retrieves (a web page, document, email, or tool result) and then acts on.</p>
<p>Because the model fundamentally cannot reliably distinguish trusted instructions from untrusted data in the same context window, you cannot fully "prompt your way out" of injection. Defense must be architectural — defense in depth:</p>
<ul>
<li><strong>Least privilege on tools</strong>: the agent's tools should only do what it needs; no broad delete/payment/admin capability.</li>
<li><strong>Human-in-the-loop for high-impact actions</strong>: the model proposes, a human approves irreversible/sensitive operations.</li>
<li><strong>Deterministic authorization outside the model</strong>: enforce permissions in code on every tool call, scoped to the end user — never trust the model to self-restrict.</li>
<li><strong>Input/content isolation</strong>: clearly delimit and treat retrieved/tool content as data, strip or sandbox instructions, and limit what injected text can reach.</li>
<li><strong>Output guardrails</strong>: scan for PII leakage, policy violations, and unsafe content before returning.</li>
</ul>
<p><strong>Output guardrails alone are insufficient</strong> because by the time you inspect the output, a tool with side effects (sending an email, issuing a refund, deleting a record) may have already executed. The damage from an agent happens at <em>action</em> time, not at response time, so the critical controls must sit on the tool-invocation path, not just the final text.</p>`,
            explanation: 'Telling a new employee "don\'t do anything bad" is an output check. But if you also hand them the keys to the vault, a clever con artist can talk them into opening it before anyone reviews what they said. The real fix is not giving them the keys without a second person approving.',
            code: `// Authorization enforced in code on every tool call — not trusted to the model
[KernelFunction, Description("Issue a refund for an order")]
public async Task<string> IssueRefund(int orderId, decimal amount, AgentContext ctx)
{
    // 1. Deterministic permission check scoped to the real end user
    if (!await _authz.CanRefund(ctx.UserId, orderId))
        return "Not authorized to refund this order.";

    // 2. Hard policy limits the model cannot override
    if (amount > 500m)
        return "Refunds over $500 require human approval."; // human-in-the-loop

    // 3. Audit every action the agent takes
    _audit.Log(ctx.UserId, "refund_attempt", orderId, amount);

    return await _orders.RefundAsync(orderId, amount);
}`,
            language: 'csharp',
            bestPractices: ['Enforce authorization deterministically in code on every tool call, scoped to the authenticated end user', 'Require human approval for irreversible or high-value actions (refunds, deletes, external sends)', 'Apply least privilege: give the agent the narrowest set of tools and data it needs', 'Treat all retrieved/tool content as untrusted data and isolate it from trusted instructions; log and audit every action'],
            commonMistakes: ['Relying on system-prompt wording ("never reveal X") as the primary defense — it is bypassable', 'Putting guardrails only on the model\'s text output while tools with side effects run unchecked', 'Auto-invoking write/delete tools without confirmation or per-user authorization', 'Ignoring indirect injection from retrieved documents, web pages, and tool results'],
            interviewTip: 'The standout point is that damage happens at action time — say that output filtering is too late for tools with side effects, and that authorization must live outside the model.',
            followUp: ['What is indirect (second-order) prompt injection?', 'How do you sandbox tool execution?', 'How would you audit and detect a compromised agent session?'],
            seniorPerspective: 'I design agents on the assumption that the model will eventually be tricked. So the question I ask is "what is the worst a manipulated agent can do?" — and I make sure the answer is bounded by code-level authorization and human approval gates, not by the model\'s good behavior. Read-only tools auto-invoke; anything with side effects goes through deterministic checks.',
            architectPerspective: 'Prompt injection reframes the agent as an untrusted client to your backend, even though it runs inside your system. The correct architecture mirrors classic security: the model is the UI, but the policy enforcement point sits in the API/tool layer with per-user scopes, rate limits, and full audit. Treating the LLM as an enforcement boundary is the root architectural mistake.'
        },
        {
            question: 'Compare Semantic Kernel and LangChain, and describe the agentic orchestration patterns (ReAct, plan-and-execute, multi-agent) you would choose between.',
            difficulty: 'advanced',
            answer: `<p>Both are orchestration frameworks that sit between your app and the LLM, managing prompts, tool calling, memory, and multi-step flows — but they target different ecosystems and philosophies:</p>
<ul>
<li><strong>Semantic Kernel</strong>: Microsoft's SDK, first-class in <strong>.NET</strong> (also Python/Java), enterprise-leaning. Concepts: <em>plugins/functions</em> (tools), <em>planners</em>, and tight Azure OpenAI integration. Favored when you are in the Microsoft stack and want production governance, DI, and telemetry baked in.</li>
<li><strong>LangChain</strong>: Python-first (with JS), the largest ecosystem of integrations, vector stores, and prebuilt chains; <strong>LangGraph</strong> adds explicit graph-based stateful agent orchestration. Favored for rapid experimentation and breadth of connectors.</li>
</ul>
<p>Orchestration patterns to choose between:</p>
<ul>
<li><strong>ReAct (Reason + Act)</strong>: the model interleaves reasoning with tool calls in a loop until it has the answer. Simple and flexible; good default for single-agent tool use. Risk: unbounded loops and cost.</li>
<li><strong>Plan-and-execute</strong>: the model first produces a multi-step plan, then executes steps (optionally re-planning). More predictable and auditable for complex tasks; better cost control.</li>
<li><strong>Multi-agent</strong>: specialized agents (e.g., researcher, coder, reviewer) coordinated by an orchestrator. Powerful for decomposable problems but adds latency, cost, and coordination complexity.</li>
</ul>`,
            explanation: 'The frameworks are like two project-management toolkits. ReAct is one worker who thinks, does a task, thinks again, and repeats. Plan-and-execute is a worker who writes the to-do list first, then ticks items off. Multi-agent is a small team with a manager handing out specialized jobs.',
            code: `// Semantic Kernel auto plan-and-invoke (.NET): model plans which functions to call
var settings = new OpenAIPromptExecutionSettings
{
    ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions, // SK orchestrates the loop
    Temperature = 0
};

// Guard the agent loop: cap iterations and cost
var maxToolCalls = 8;
var result = await chat.GetChatMessageContentAsync(history, settings, kernel);
// In production: count tool invocations, enforce maxToolCalls, log every step for audit`,
            language: 'csharp',
            bestPractices: ['Pick the framework that matches your stack — Semantic Kernel for .NET/Azure governance, LangChain/LangGraph for Python breadth', 'Default to ReAct for simple tool use, but switch to plan-and-execute when tasks are multi-step and need auditability', 'Cap agent iterations, token budget, and wall-clock time to prevent runaway loops and cost', 'Reserve multi-agent designs for genuinely decomposable problems where the added latency/cost pays off'],
            commonMistakes: ['Reaching for multi-agent orchestration when a single ReAct agent with good tools would suffice', 'Running unbounded ReAct loops with no iteration/cost ceiling, leading to surprise bills', 'Coupling business logic deeply to one framework instead of isolating it behind your own tool interfaces', 'Assuming the framework provides security — authorization and guardrails are still your responsibility'],
            interviewTip: 'Show you choose patterns by task shape (loop vs plan vs team) and that you always bound the loop — interviewers want to see cost/latency awareness, not framework name-dropping.',
            followUp: ['When does multi-agent actually beat a single agent?', 'How do you bound and observe an agent loop in production?', 'How does LangGraph model state compared to Semantic Kernel planners?'],
            seniorPerspective: 'I have seen multi-agent setups added for sophistication that just multiplied latency and token cost while making failures harder to debug. My rule is to start with the simplest pattern (single ReAct agent with well-described tools), measure where it actually fails, and only add planning or extra agents when the data justifies it.',
            architectPerspective: 'The framework is an implementation detail; the durable architectural decision is isolating orchestration behind your own interfaces so you can swap Semantic Kernel for LangChain — or a future framework — without rewriting business logic. I treat the agent loop like any other untrusted, resource-consuming subsystem: bounded, observable, audited, and decoupled from the domain it acts on.'
        }
    ,
        {
            question: 'How do you evaluate and test the reliability of an AI agent before and after deployment?',
            difficulty: 'advanced',
            answer: `<p>Agents are non-deterministic and call tools with side effects, so you test them with <strong>evaluation suites</strong>, not just unit asserts. Layers:</p>
            <ul>
                <li><strong>Golden eval set</strong> \u2014 curated tasks with expected behaviors; score end-to-end success, not just final text.</li>
                <li><strong>Tool-call accuracy</strong> \u2014 did the agent pick the right tool with valid arguments? Assert on the structured tool calls, which are deterministic to check.</li>
                <li><strong>Deterministic plumbing tests</strong> \u2014 mock the LLM to test routing, parsing, guardrails, and authorization in isolation.</li>
                <li><strong>LLM-as-judge / rubric scoring</strong> \u2014 for open-ended outputs where exact match is impossible.</li>
                <li><strong>Adversarial / regression</strong> \u2014 prompt-injection and unsafe-request cases run on every prompt or model change to catch silent regressions.</li>
            </ul>`,
            explanation: 'You cannot grade a creative employee with a fill-in-the-blank key, so you use a rubric and a standard set of test scenarios. You also separately check the mechanical parts \u2014 did they file the right form correctly \u2014 which you can verify exactly.',
            code: `// Deterministic test of the plumbing with a mocked LLM + asserted tool call
[Fact]
public async Task Agent_OrderStatusQuery_CallsGetOrderWithParsedId()
{
    var llm = Substitute.For<ILlmClient>();
    llm.CompleteAsync(Arg.Any<ChatMessage[]>(), Arg.Any<Tool[]>())
       .Returns(new LlmResponse { ToolCall = new ToolCall("get_order_status", "{\\"orderId\\":5}") });

    var orders = Substitute.For<IOrderService>();
    var agent = new SupportAgent(llm, orders);

    await agent.HandleAsync("where is order 5?");

    await orders.Received(1).GetStatusAsync(5);   // right tool, right parsed arg
}
// Separately: run a golden eval suite and score success-rate before/after changes.`,
            language: 'csharp',
            bestPractices: ['Maintain a versioned golden eval set and score end-to-end task success', 'Assert tool-call selection and arguments \u2014 they are deterministically checkable', 'Mock the LLM to test routing/parsing/guardrails deterministically', 'Run adversarial (prompt-injection/unsafe) cases on every prompt/model change'],
            commonMistakes: ['Tweaking prompts "by vibes" with no eval set to measure regressions', 'Only checking final text, never whether the right tool/args were chosen', 'No adversarial tests, so guardrails silently regress', 'Treating a one-off manual test as sufficient for a non-deterministic system'],
            interviewTip: 'Separate the deterministic parts (tool-call args, plumbing \u2014 unit-testable with a mocked LLM) from the probabilistic parts (output quality \u2014 eval sets and LLM-as-judge). That distinction is the senior signal.',
            followUp: ['How does LLM-as-judge work and what are its risks?', 'How would you detect quality drift in production?', 'How do you bound and test an agent loop for cost/runaway?'],
            seniorPerspective: 'No prompt or model change ships without running the eval suite \u2014 I have seen a "harmless" prompt tweak quietly drop task success by 15%. I also assert tool-call arguments in CI because those are exactly verifiable even when the prose is not.',
            architectPerspective: 'I treat evals as the CI gate for AI features, the same way tests gate code. The agent is an unreliable component, so reliability is an emergent property of the surrounding evaluation, guardrails, and monitoring \u2014 not of the model itself.'
        },
        {
            question: 'What is the Model Context Protocol (MCP) and how does it enable AI agent tool use?',
            difficulty: 'hard',
            answer: `<p><strong>MCP (Model Context Protocol)</strong> is a standard protocol that allows AI models/agents to discover and invoke external tools, data sources, and services in a structured, interoperable way.</p>
<h4>Core concept:</h4>
<ul>
<li>LLMs cannot natively access databases, APIs, or file systems. MCP provides a standard interface for "tool use" — the model describes what tool to call and with what parameters, and the runtime executes it.</li>
<li>Instead of custom integrations per tool, MCP defines a universal schema: tool discovery (what tools exist), tool invocation (call with parameters), and result return (structured response).</li>
</ul>
<h4>Architecture:</h4>
<ol>
<li><strong>MCP Server:</strong> Exposes tools (functions, data sources) with JSON Schema descriptions of parameters and return types</li>
<li><strong>MCP Client (AI agent):</strong> Discovers available tools, decides which to call based on user intent, constructs proper parameters</li>
<li><strong>Runtime:</strong> Executes the tool call, returns results to the model for incorporation into its response</li>
</ol>
<h4>Why it matters:</h4>
<ul>
<li><strong>Interoperability:</strong> Any MCP-compatible agent can use any MCP-compatible tool without custom integration</li>
<li><strong>Safety:</strong> Tools declare their schema; the runtime can validate parameters before execution</li>
<li><strong>Composability:</strong> Agents can chain multiple tool calls to solve complex tasks (search → analyze → write)</li>
</ul>
<p><strong>Real-world example:</strong> An AI coding assistant uses MCP to: read files (filesystem tool), search code (grep tool), run tests (terminal tool), and fetch documentation (web search tool) — all through the same protocol.</p>`,
            bestPractices: ['Define clear JSON schemas for tool parameters and return types', 'Implement permission/confirmation gates for destructive tool operations', 'Provide detailed tool descriptions so the model knows WHEN to use each tool', 'Handle tool failures gracefully — the model should adapt when a tool call fails'],
            commonMistakes: ['Vague tool descriptions that cause the model to misuse tools', 'No safety gates on destructive operations (delete, write, deploy)', 'Too many tools exposed at once (model gets confused about which to use)', 'Not handling tool timeout/failure — agent gets stuck'],
            interviewTip: 'Explain MCP as "USB for AI tools" — a standard interface so any agent can use any tool. The key value is interoperability + safety (schema validation + permission gates).',
            followUp: ['How do you prevent an AI agent from misusing a dangerous tool?', 'How does MCP compare to OpenAI function calling?']
        },
        {
            question: 'How do you evaluate an AI agent system in production? What metrics matter?',
            difficulty: 'expert',
            answer: `<p>AI agent evaluation is harder than standard ML because agents make sequences of decisions, use tools, and produce varied outputs. Traditional accuracy metrics don't capture the full picture.</p>
<h4>Key metrics:</h4>
<table>
<tr><th>Metric</th><th>What It Measures</th><th>How to Measure</th></tr>
<tr><td>Task completion rate</td><td>Does the agent achieve the user's goal?</td><td>Human evaluation on sample + automated checks where possible</td></tr>
<tr><td>Tool use accuracy</td><td>Does it call the right tools with correct parameters?</td><td>Log analysis: correct tool selected / total tool calls</td></tr>
<tr><td>Hallucination rate</td><td>How often does it make claims unsupported by retrieved/tool data?</td><td>Automated grounding checks against source data</td></tr>
<tr><td>Latency (time-to-answer)</td><td>How long does the full agent loop take?</td><td>End-to-end timing including all tool calls</td></tr>
<tr><td>Cost per interaction</td><td>Token usage + tool call costs</td><td>Aggregate tokens (input+output) × price + tool API costs</td></tr>
<tr><td>User satisfaction</td><td>Did the user find the response helpful?</td><td>Thumbs up/down, follow-up rate, task abandonment</td></tr>
<tr><td>Safety violations</td><td>Did the agent do something harmful/unauthorized?</td><td>Guardrail trigger rate, human review of flagged interactions</td></tr>
</table>
<h4>Evaluation approaches:</h4>
<ul>
<li><strong>Automated evals:</strong> Test suites with known-good inputs/expected outputs. Run on every model/prompt change.</li>
<li><strong>Human evaluation:</strong> Expert judges rate a sample of real interactions on correctness, helpfulness, safety.</li>
<li><strong>A/B testing:</strong> Compare agent versions on live traffic using task completion and satisfaction metrics.</li>
<li><strong>Red-teaming:</strong> Adversarial testing to find ways to make the agent misbehave (prompt injection, tool misuse).</li>
</ul>
<p><strong>Key insight:</strong> Agent reliability is NOT a model property — it emerges from the model + tools + guardrails + prompts. You must evaluate the whole system, not just the model.</p>`,
            bestPractices: ['Track task completion rate as the primary metric (did it actually help?)', 'Separate model quality from tool quality in evaluation (both can fail independently)', 'Run automated eval suites on every prompt/model change (regression detection)', 'Monitor cost per interaction and set budgets to prevent runaway token usage'],
            commonMistakes: ['Only measuring model perplexity/accuracy without end-to-end task evaluation', 'No cost monitoring — agent makes 50 tool calls per query burning $2/interaction', 'Not testing adversarial inputs (prompt injection, tool misuse attempts)', 'Evaluating in isolation without real user feedback'],
            interviewTip: 'Show the evaluation LAYERS: automated evals for regression, human evaluation for quality, A/B testing for comparison, red-teaming for safety. This demonstrates you treat AI systems as production software, not research experiments.',
            followUp: ['How do you detect prompt injection attacks against an agent?', 'How do you set cost budgets for agent interactions?']
        }
    ]
});
