/* ═══════════════════════════════════════════════════════════════════
   AI — LLMs, Prompt Engineering, RAG, Semantic Kernel
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('ai-fundamentals', {
    title: 'LLM & Prompt Engineering',
    description: 'Large Language Models, prompt engineering techniques, RAG (Retrieval-Augmented Generation), embeddings, vector databases, Semantic Kernel, and integrating AI into .NET applications.',
    sections: [
        {
            title: 'LLMs & How They Work',
            content: `<p><strong>Large Language Models</strong> (GPT-4, Claude, Llama) are neural networks trained on vast text corpora to predict the next token. They exhibit emergent capabilities: reasoning, code generation, summarization, and conversation — but they have limitations: hallucination, knowledge cutoff, and no real-time data.</p>
            <ul>
                <li><strong>Tokens</strong> — text broken into subword pieces (~4 chars/token in English)</li>
                <li><strong>Context Window</strong> — maximum input+output tokens (4K to 200K+)</li>
                <li><strong>Temperature</strong> — controls randomness (0 = deterministic, 1 = creative)</li>
                <li><strong>System/User/Assistant</strong> — message roles that structure the conversation</li>
            </ul>`,
            code: `// Calling Azure OpenAI / OpenAI from .NET:
using Azure.AI.OpenAI;

var client = new AzureOpenAIClient(
    new Uri("https://myinstance.openai.azure.com/"),
    new DefaultAzureCredential());

var chatClient = client.GetChatClient("gpt-4o");

var response = await chatClient.CompleteChatAsync(new[]
{
    new SystemChatMessage("You are a helpful coding assistant specializing in C# and .NET."),
    new UserChatMessage("Explain the difference between Task and ValueTask in 3 sentences.")
});

Console.WriteLine(response.Value.Content[0].Text);

// Streaming response (for real-time UI):
await foreach (var update in chatClient.CompleteChatStreamingAsync(messages))
{
    if (update.ContentUpdate.Count > 0)
        Console.Write(update.ContentUpdate[0].Text);
}

// Key parameters:
// Temperature: 0.0 (factual/deterministic) → 1.0 (creative/varied)
// MaxTokens: limit response length (cost control)
// TopP: nucleus sampling (alternative to temperature)
// Stop sequences: tokens that end generation`,
            language: 'csharp'
        },
        {
            title: 'Prompt Engineering Techniques',
            content: `<p><strong>Prompt engineering</strong> is the art of crafting inputs to get optimal outputs from LLMs. Effective prompts include context, examples, constraints, and output format specifications.</p>`,
            code: `// Technique 1: System prompt (set behavior and constraints)
var systemPrompt = """
    You are a senior .NET code reviewer. 
    Rules:
    - Only comment on issues, not praise
    - Categorize issues: Bug, Performance, Security, Style
    - Suggest specific fixes with code
    - Rate severity: Critical, Major, Minor
    Output format: JSON array of {category, severity, line, issue, fix}
    """;

// Technique 2: Few-shot examples (teach by example)
var prompt = """
    Classify the following customer messages as Positive, Negative, or Neutral.
    
    Examples:
    "Great product, love it!" → Positive
    "It broke after one day" → Negative
    "I received my order" → Neutral
    
    Classify: "The delivery was late but the product quality is excellent"
    """;

// Technique 3: Chain of thought (improve reasoning)
var prompt = """
    Analyze this code for thread safety issues.
    Think step by step:
    1. Identify shared mutable state
    2. Check if access is synchronized
    3. Consider race conditions
    4. Suggest fixes
    """;

// Technique 4: Output format constraint
var prompt = """
    Extract entities from this text and return as JSON:
    {"people": [], "places": [], "dates": [], "amounts": []}
    
    Text: "John Smith transferred $5000 to the London office on March 15th."
    """;

// Technique 5: RAG prompt template
var ragPrompt = $"""
    Answer the question based ONLY on the provided context.
    If the context doesn't contain the answer, say "I don't have that information."
    
    Context:
    {retrievedDocuments}
    
    Question: {userQuestion}
    """;`,
            language: 'csharp'
        },
        {
            title: 'RAG (Retrieval-Augmented Generation)',
            content: `<p><strong>RAG</strong> combines search with LLMs: retrieve relevant documents from your data, then pass them as context to the LLM. This grounds responses in your actual data, reducing hallucination and enabling domain-specific answers.</p>`,
            code: `// RAG Pipeline:
// 1. INDEXING (offline): Documents → Chunks → Embeddings → Vector DB
// 2. QUERYING (online): Question → Embedding → Vector Search → Top-K docs → LLM

// Step 1: Generate embeddings and store
var embeddingClient = client.GetEmbeddingClient("text-embedding-3-small");
var embedding = await embeddingClient.GenerateEmbeddingAsync("Your document chunk text here");
float[] vector = embedding.Value.Vector.ToArray();
// Store vector + text in vector DB (Azure AI Search, Pinecone, Qdrant)

// Step 2: Search and generate
public class RagService
{
    private readonly IChatClient _chat;
    private readonly IVectorStore _vectorStore;

    public async Task<string> AskAsync(string question)
    {
        // 1. Convert question to embedding
        var queryVector = await _embedding.GenerateEmbeddingAsync(question);
        
        // 2. Find relevant documents (semantic search)
        var relevantDocs = await _vectorStore.SearchAsync(queryVector, topK: 5);
        
        // 3. Build prompt with retrieved context
        var context = string.Join("\\n---\\n", relevantDocs.Select(d => d.Text));
        
        var messages = new[]
        {
            new SystemChatMessage("Answer based ONLY on the provided context. Cite sources."),
            new UserChatMessage($"Context:\\n{context}\\n\\nQuestion: {question}")
        };
        
        // 4. Generate grounded answer
        var response = await _chat.CompleteChatAsync(messages);
        return response.Value.Content[0].Text;
    }
}

// Semantic Kernel (Microsoft's AI orchestration framework):
var kernel = Kernel.CreateBuilder()
    .AddAzureOpenAIChatCompletion("gpt-4o", endpoint, credential)
    .Build();

// Add plugins (tools the LLM can call):
kernel.ImportPluginFromType<OrderPlugin>();
kernel.ImportPluginFromType<CustomerPlugin>();

// Auto-invoke tools based on user intent:
var settings = new OpenAIPromptExecutionSettings { ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions };
var result = await kernel.InvokePromptAsync("What is the status of order #12345?", new(settings));`,
            language: 'csharp'
        }
    ],
    questions: [
        {
            question: 'What is RAG and why is it important for enterprise AI applications?',
            difficulty: 'medium',
            answer: `<p><strong>RAG (Retrieval-Augmented Generation)</strong> combines information retrieval with LLM generation. Instead of relying solely on the model\'s training data, RAG first searches your own documents/databases for relevant information, then provides that as context to the LLM. This grounds responses in your actual data, reduces hallucination, keeps information current, and enables domain-specific answers without fine-tuning.</p>`,
            bestPractices: ['Chunk documents into semantically meaningful pieces (not arbitrary splits)', 'Use hybrid search (vector + keyword) for better retrieval accuracy', 'Include metadata and source references in retrieved chunks for citation', 'Evaluate retrieval quality separately from generation quality (measure both)'],
            commonMistakes: ['Chunks too large (exceeds context window) or too small (loses meaning)', 'Not evaluating retrieval recall (LLM can only use what it receives)', 'Ignoring the "garbage in, garbage out" principle for document quality', 'Not implementing guardrails against prompt injection via retrieved documents'],
            interviewTip: 'Explain the two-phase architecture: offline indexing (document → chunks → embeddings → vector store) and online querying (question → embedding → similarity search → top-K retrieval → LLM with context → answer). Show you understand why each step matters.',
            followUp: ['How do you evaluate RAG quality?', 'What is the difference between RAG and fine-tuning?', 'How do you handle document chunking strategies?'],
            seniorPerspective: 'I implement RAG for internal knowledge bases, documentation search, and customer support bots. The key insight: retrieval quality matters more than the LLM model. A perfect LLM with bad retrieval gives bad answers. I invest 70% of effort in chunking, embedding, and search quality.',
            architectPerspective: 'RAG is the pragmatic enterprise AI pattern because it separates knowledge from reasoning: update documents without retraining, audit what context was used, control access per user/role, and ground responses in authoritative sources. It fits existing security and compliance frameworks.'
        },
        {
            question: 'What are the key prompt engineering techniques for getting reliable outputs from LLMs?',
            difficulty: 'medium',
            answer: `<p>Effective prompt engineering combines: (1) <strong>System prompts</strong> for behavior/persona/constraints, (2) <strong>Few-shot examples</strong> showing expected input→output pairs, (3) <strong>Chain of thought</strong> (step-by-step reasoning), (4) <strong>Output format specification</strong> (JSON schema, structured response), (5) <strong>Guardrails</strong> (what NOT to do, boundaries). The goal: turn non-deterministic LLMs into reliable, predictable components.</p>`,
            bestPractices: ['Always specify output format explicitly (JSON, bullet points, table)', 'Use few-shot examples (3-5) for complex classification tasks', 'Add chain-of-thought for reasoning tasks (think step by step)', 'Set temperature=0 for deterministic factual outputs, higher for creative tasks'],
            commonMistakes: ['Vague instructions without examples (LLM guesses format and style)', 'Relying on a single prompt without iteration (prompt engineering is iterative)', 'Not testing edge cases (LLMs fail unpredictably on unusual inputs)', 'Ignoring context window limits (too much context degrades quality)'],
            interviewTip: 'Show practical techniques: system prompt for role/constraints, few-shot for output format consistency, chain-of-thought for complex reasoning. Mention temperature/top-p for controlling randomness. Relate to real use cases you have built.',
            followUp: ['How do you prevent prompt injection attacks?', 'What is the difference between zero-shot and few-shot prompting?', 'How do you evaluate prompt quality systematically?'],
            seniorPerspective: 'I treat prompts as code: version-controlled, tested with evaluation datasets, and reviewed in PRs. A well-engineered system prompt with examples and guardrails turns an unreliable LLM into a production-grade component.',
            architectPerspective: 'Prompt engineering is the new API design — the prompt IS the contract between your application and the LLM. I establish prompt libraries (versioned templates per use case), automated evaluation pipelines, and monitoring for quality drift over time.'
        },
        {
            question: 'What are tokens and the context window, and how do they affect cost, latency, and design decisions?',
            difficulty: 'medium',
            answer: `<p><strong>Tokens</strong> are the subword units an LLM reads and generates (roughly 4 characters or 0.75 words in English). The model never sees raw characters — text is encoded into token IDs by a tokenizer. The <strong>context window</strong> is the maximum number of tokens (input + output combined) the model can process in a single call, ranging from a few thousand to 200K+ depending on the model.</p>
            <ul>
                <li><strong>Cost</strong> — you pay per input <em>and</em> output token, so prompt size and response length directly drive spend</li>
                <li><strong>Latency</strong> — generation time grows with output tokens; large prompts also add processing time</li>
                <li><strong>Truncation/eviction</strong> — exceeding the window forces you to trim, summarize, or drop history, which can silently lose information</li>
                <li><strong>Design</strong> — RAG retrieves only the most relevant chunks instead of stuffing entire documents to stay within budget</li>
            </ul>`,
            explanation: 'Think of the context window as the desk space the model can lay papers on at once. A bigger desk holds more, but every sheet you place costs money and slows the model down as it scans them. You only put the pages that actually matter on the desk.',
            code: `# Estimating tokens before a call (tiktoken for OpenAI models)
import tiktoken

enc = tiktoken.encoding_for_model("gpt-4o")
prompt = "Explain the difference between Task and ValueTask."
tokens = enc.encode(prompt)
print(len(tokens))   # ~10 tokens

# Budget check: keep input + expected output under the model's window
MAX_WINDOW = 128_000
reserved_for_output = 1_000
budget_for_input = MAX_WINDOW - reserved_for_output
assert len(tokens) < budget_for_input`,
            language: 'python',
            bestPractices: ['Estimate token counts before calls to enforce budgets and avoid truncation', 'Reserve headroom for the output when sizing the input', 'Summarize or window long conversation history instead of resending everything', 'Retrieve only relevant chunks (RAG) rather than dumping whole documents'],
            commonMistakes: ['Assuming 1 word = 1 token (English averages ~0.75 words/token)', 'Forgetting output tokens count against the same window', 'Letting conversation history grow unbounded until requests fail or costs spike', 'Ignoring that different models/tokenizers count tokens differently'],
            interviewTip: 'Connect tokens to the three things interviewers care about: cost, latency, and the hard window limit. Mention that input and output share the budget — many candidates forget the output side.',
            followUp: ['How do you handle a document larger than the context window?', 'Why might a long system prompt be worth caching?'],
            seniorPerspective: 'I instrument token usage per request and per feature, because cost regressions hide in prompt growth. When someone "just adds a bit more context," I want a dashboard that shows the token and dollar impact before it ships.',
            architectPerspective: 'The context window is a finite shared resource, so I design context budgets per use case: a fixed allocation for system instructions, retrieved context, and history. RAG plus summarization keeps us inside the window deterministically rather than hoping prompts stay small.'
        },
        {
            question: 'How do embeddings, vector databases, and semantic search work together to enable retrieval?',
            difficulty: 'hard',
            answer: `<p><strong>Embeddings</strong> are dense numeric vectors (e.g., 1536 dimensions) produced by an embedding model that capture the <em>meaning</em> of text — semantically similar texts map to nearby points in vector space. <strong>Semantic search</strong> ranks documents by closeness in that space (typically <strong>cosine similarity</strong>) rather than by keyword overlap, so "car" matches "automobile" even with no shared words.</p>
            <ul>
                <li><strong>Indexing</strong> — chunk documents, embed each chunk, store the vector plus text and metadata in a <strong>vector database</strong> (pgvector, Pinecone, Qdrant, Azure AI Search)</li>
                <li><strong>Querying</strong> — embed the query with the <em>same</em> model, then run an approximate nearest-neighbor (ANN) search (HNSW, IVF) to fetch the top-K closest chunks</li>
                <li><strong>Hybrid search</strong> — combine vector similarity with keyword/BM25 scoring to catch exact terms (names, IDs) that pure semantics can miss</li>
            </ul>`,
            explanation: 'Embeddings are like GPS coordinates for meaning: every sentence gets a location, and sentences about similar ideas end up in the same neighborhood. Semantic search just finds the nearest neighbors to your question, regardless of the exact words used.',
            code: `# Embed, store, and search (conceptual, OpenAI + numpy cosine similarity)
import numpy as np
from openai import OpenAI

client = OpenAI()

def embed(text: str) -> np.ndarray:
    resp = client.embeddings.create(model="text-embedding-3-small", input=text)
    return np.array(resp.data[0].embedding)

def cosine(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

# Index (offline): store (vector, text) — a real system uses a vector DB with ANN
docs = ["Refunds are processed in 5 business days.",
        "Our office is open 9am to 5pm."]
index = [(embed(d), d) for d in docs]

# Query (online): embed question, rank by similarity, take top-K
q = embed("How long do refunds take?")
ranked = sorted(index, key=lambda item: cosine(q, item[0]), reverse=True)
print(ranked[0][1])   # -> the refunds document`,
            language: 'python',
            bestPractices: ['Use the same embedding model for indexing and querying', 'Chunk on semantic boundaries (paragraphs/sections) with slight overlap', 'Store metadata (source, section, permissions) alongside vectors for filtering and citation', 'Use hybrid (vector + keyword) search and re-ranking for higher precision'],
            commonMistakes: ['Mixing embedding models between index and query (vectors become incomparable)', 'Arbitrary fixed-size chunks that split sentences and lose meaning', 'Relying on pure vector search for exact identifiers like SKUs or names', 'Ignoring approximate-search recall tuning (HNSW/IVF parameters)'],
            interviewTip: 'Explain that embeddings turn meaning into geometry, then semantic search is just nearest-neighbor lookup. Bonus points for naming cosine similarity, ANN algorithms (HNSW), and hybrid search.',
            followUp: ['Why is hybrid search often better than pure vector search?', 'How does dimensionality affect storage and search cost?'],
            seniorPerspective: 'Most "the AI gives bad answers" complaints I investigate are retrieval problems, not model problems. I evaluate retrieval recall independently — if the right chunk never reaches the prompt, no model can answer correctly, so I tune chunking, embeddings, and re-ranking first.',
            architectPerspective: 'I treat the vector store as a first-class datastore with its own indexing strategy, access control, and refresh pipeline. Embeddings must be re-generated when the model or chunking changes, so I version the index and plan re-embedding as a migration, not an afterthought.'
        },
        {
            question: 'What is temperature, and how does it relate to hallucination and output reliability?',
            difficulty: 'medium',
            answer: `<p><strong>Temperature</strong> scales the randomness of token sampling. At <code>0</code> the model is near-deterministic (it picks the highest-probability token), while higher values (up to ~1–2) flatten the probability distribution so less likely tokens get chosen, producing more varied/creative output. Related controls include <strong>top-p</strong> (nucleus sampling) and <strong>top-k</strong>.</p>
            <p><strong>Hallucination</strong> — confident but false output — is a separate phenomenon: it stems from the model predicting plausible-sounding tokens without grounding in facts. Temperature does <em>not</em> cause hallucination, but higher temperature can increase its likelihood by encouraging less probable continuations. Lowering temperature makes output more stable but a low-temperature model can still hallucinate confidently.</p>`,
            explanation: 'Temperature is the creativity dial, not the truth dial. Turning it down makes the model repeat its most confident answer; it does not make that answer correct. To fix wrong answers you ground the model (RAG), not just lower the temperature.',
            code: `// Choose temperature by task type
// Extraction / classification / structured output -> deterministic
var factual = await chatClient.CompleteChatAsync(messages, new ChatCompletionOptions
{
    Temperature = 0f          // stable, repeatable
});

// Brainstorming / marketing copy -> allow variation
var creative = await chatClient.CompleteChatAsync(messages, new ChatCompletionOptions
{
    Temperature = 0.9f
});
// NOTE: temperature 0 reduces variance, NOT hallucination.
// Ground with RAG + citations to address factual errors.`,
            language: 'csharp',
            bestPractices: ['Use temperature 0 for extraction, classification, and structured output', 'Reserve higher temperature for genuinely creative generation', 'Address hallucination with grounding (RAG) and source citations, not temperature alone', 'Validate output regardless of temperature — even deterministic output can be wrong'],
            commonMistakes: ['Believing temperature 0 prevents hallucination', 'Using high temperature for tasks that need consistency', 'Tuning temperature and top-p aggressively at the same time without measuring', 'Assuming temperature 0 is fully deterministic (minor nondeterminism can remain)'],
            interviewTip: 'The trap question is "how do you reduce hallucination?" — answering "lower temperature" is a red flag. Separate randomness (temperature) from factual grounding (RAG, citations, refusal-when-unsure).',
            followUp: ['How is top-p different from temperature?', 'Why can a model still produce different outputs at temperature 0?'],
            seniorPerspective: 'I default new structured/extraction features to temperature 0 and treat any nondeterminism as a testing concern. For factual reliability I never reach for the temperature dial — I reach for grounding, citations, and a guardrail that makes the model say "I do not know" when retrieval comes back empty.',
            architectPerspective: 'I codify sampling settings per use case in configuration rather than scattering magic numbers in code, so the org has a clear policy: deterministic tasks pinned to 0, creative tasks allowed variance, and all of it covered by evals so a settings change cannot silently degrade quality.'
        },
        {
            question: 'When should you choose RAG versus fine-tuning to adapt an LLM, and can they be combined?',
            difficulty: 'advanced',
            answer: `<p>They solve different problems. <strong>RAG</strong> injects knowledge at inference time by retrieving documents into the prompt — best when information is dynamic, proprietary, large, or must be cited. <strong>Fine-tuning</strong> adjusts the model's weights on example data — best for teaching a consistent <em>style, format, or behavior</em>, or improving a narrow task, rather than for injecting facts.</p>
            <ul>
                <li><strong>Choose RAG</strong> for current/changing knowledge, citations, access control per document, and avoiding retraining</li>
                <li><strong>Choose fine-tuning</strong> for consistent tone/format, domain-specific phrasing, classification accuracy, or reducing prompt size for a repetitive task</li>
                <li><strong>Combine them</strong> — fine-tune for behavior/format and use RAG for up-to-date facts; this is common in production</li>
            </ul>
            <p>Key trade-offs: fine-tuning has upfront training cost, data-curation effort, and goes stale as knowledge changes; RAG adds retrieval infrastructure and per-call context cost but keeps knowledge fresh and auditable.</p>`,
            explanation: 'Fine-tuning is like sending an employee to training so they internalize how your company writes and behaves. RAG is like giving that same employee an always-current reference binder to consult before answering. Training changes who they are; the binder changes what they know right now — and most teams want both.',
            bestPractices: ['Reach for RAG first when the need is knowledge — it is cheaper and stays current', 'Fine-tune for consistent style/format/behavior, not for facts that change', 'Combine fine-tuning (behavior) with RAG (fresh facts) for production assistants', 'Curate and version fine-tuning datasets like code; measure with held-out evals'],
            commonMistakes: ['Fine-tuning to "add knowledge" that changes frequently (it goes stale)', 'Expecting fine-tuning to eliminate hallucination', 'Choosing fine-tuning before exhausting prompt engineering and RAG', 'Underestimating the data-curation and re-training cost of fine-tuning'],
            interviewTip: 'Frame it as knowledge vs behavior: RAG for what the model knows, fine-tuning for how it behaves. State clearly that fine-tuning is a poor way to inject changing facts — that distinction separates seniors from juniors.',
            followUp: ['What data do you need to fine-tune well, and how do you evaluate it?', 'How would you architect a system that uses both RAG and a fine-tuned model?'],
            seniorPerspective: 'My default order is prompt engineering, then RAG, then fine-tuning — each step costs more and is harder to change. I only fine-tune once I have evidence that behavior/format consistency (not knowledge) is the real gap, because a fine-tuned model is an asset I now have to retrain, version, and monitor.',
            architectPerspective: 'I separate the two concerns architecturally: a knowledge layer (vector store + retrieval) that updates continuously, and a model layer whose behavior may be fine-tuned and versioned independently. That separation lets us refresh knowledge daily without touching the model and swap or retrain the model without re-indexing the corpus.'
        },
        {
            question: 'How do you evaluate and mitigate hallucinations in a production LLM application?',
            difficulty: 'hard',
            answer: `<p><strong>Hallucination</strong> is when an LLM generates plausible-sounding but factually incorrect information. In production, this is not just a quality issue — it's a reliability and trust risk.</p>
<h4>Detection strategies:</h4>
<ul>
<li><strong>Grounding verification:</strong> For RAG systems, check if the generated answer is actually supported by the retrieved documents. Flag responses that contain claims not traceable to source chunks.</li>
<li><strong>Self-consistency checking:</strong> Generate multiple responses to the same query; if they contradict each other, confidence is low.</li>
<li><strong>Factual entailment models:</strong> Use a separate NLI (Natural Language Inference) model to verify generated claims against known facts.</li>
<li><strong>Citation validation:</strong> Force the model to cite sources; verify citations are real and contain the claimed information.</li>
</ul>
<h4>Mitigation strategies:</h4>
<ul>
<li><strong>RAG with strict grounding:</strong> Instruct the model to ONLY answer from retrieved context; say "I don't know" if context is insufficient.</li>
<li><strong>Temperature control:</strong> Lower temperature (0.0-0.3) for factual tasks reduces creative hallucination.</li>
<li><strong>Structured output:</strong> Force JSON schema compliance — constrains the output space, reducing free-form hallucination.</li>
<li><strong>Human-in-the-loop:</strong> For high-stakes decisions (medical, legal, financial), require human verification before acting on LLM output.</li>
<li><strong>Confidence scoring:</strong> Return a confidence indicator; route low-confidence responses to human review or fallback.</li>
</ul>
<p><strong>Key principle:</strong> You cannot eliminate hallucination — you can only detect it, reduce its frequency, and design systems that fail safely when it occurs.</p>`,
            bestPractices: ['Ground LLM responses in retrieved documents (RAG) and verify grounding', 'Use low temperature for factual tasks; structured output to constrain response space', 'Always provide a "I don\'t know" path — better than confident hallucination', 'Monitor hallucination rate in production using automated grounding checks'],
            commonMistakes: ['Trusting LLM output without verification for high-stakes decisions', 'No grounding verification in RAG (retrieval does not guarantee the answer uses retrieved context)', 'High temperature for factual queries (encourages creative/hallucinated responses)', 'No fallback path when the model is uncertain'],
            interviewTip: 'Show you understand hallucination is inherent (not a bug to fix) and describe the LAYERED mitigation: grounding + temperature + structured output + human-in-the-loop. Production maturity = designing for graceful failure.',
            followUp: ['How do you measure hallucination rate in production?', 'When should you use RAG vs fine-tuning to reduce hallucination?']
        },
        {
            question: 'Explain the RAG architecture. When would you use RAG vs fine-tuning?',
            difficulty: 'medium',
            answer: `<p><strong>RAG (Retrieval-Augmented Generation)</strong> combines a retrieval system with a generative LLM: it first searches a knowledge base for relevant documents, then provides those documents as context to the LLM to generate a grounded answer.</p>
<h4>RAG Architecture:</h4>
<ol>
<li><strong>Indexing (offline):</strong> Documents → chunked → embedded via embedding model → stored in vector database (Pinecone, Weaviate, pgvector)</li>
<li><strong>Retrieval (query time):</strong> User query → embedded → vector similarity search finds top-K relevant chunks</li>
<li><strong>Generation:</strong> Retrieved chunks + user query assembled into a prompt → LLM generates answer grounded in the retrieved context</li>
</ol>
<h4>RAG vs Fine-tuning decision:</h4>
<table>
<tr><th>Factor</th><th>RAG</th><th>Fine-tuning</th></tr>
<tr><td>Knowledge freshness</td><td>Real-time (update documents anytime)</td><td>Stale (must retrain to update)</td></tr>
<tr><td>Hallucination control</td><td>Better (grounded in real documents)</td><td>Worse (knowledge baked into weights)</td></tr>
<tr><td>Cost</td><td>Cheaper (no training, only inference + retrieval)</td><td>Expensive (GPU training hours)</td></tr>
<tr><td>Style/format adaptation</td><td>Weak (doesn't change how model writes)</td><td>Strong (model learns your tone/format)</td></tr>
<tr><td>Domain reasoning</td><td>Limited (model must reason from context)</td><td>Better (model internalizes domain patterns)</td></tr>
<tr><td>Setup complexity</td><td>Moderate (chunking, embedding, vector DB)</td><td>High (training data curation, compute)</td></tr>
</table>
<p><strong>Use RAG when:</strong> Knowledge changes frequently, you need source citations, factual accuracy is critical, or you cannot afford to train.</p>
<p><strong>Use fine-tuning when:</strong> You need the model to adopt a specific writing style, reason deeply about a narrow domain, or consistently produce a specific output format.</p>
<p><strong>Use BOTH when:</strong> Fine-tune for style/format + RAG for factual grounding (increasingly common in production).</p>`,
            bestPractices: ['Chunk documents into 200-500 token segments with overlap for context continuity', 'Use hybrid search (vector + keyword BM25) for better retrieval than vector alone', 'Include metadata filtering (date, source, category) to narrow retrieval scope', 'Evaluate retrieval quality separately from generation quality (they are different failure modes)'],
            commonMistakes: ['Chunks too large (dilutes relevance) or too small (loses context)', 'No evaluation of retrieval step — bad retrieval guarantees bad generation', 'Using RAG when the problem is style/format (need fine-tuning instead)', 'Not handling the "no relevant documents found" case (model hallucinates without grounding)'],
            interviewTip: 'Draw the 3-step flow (index → retrieve → generate) and explain the trade-off table. Mentioning hybrid search and the need to evaluate retrieval separately shows production depth.',
            followUp: ['How do you evaluate retrieval quality in a RAG pipeline?', 'What chunking strategies work best for different document types?']
        }
    ]
});
