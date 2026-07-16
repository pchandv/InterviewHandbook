/* ═══════════════════════════════════════════════════════════════════
   AI — Open Source & Local LLMs
   Hugging Face, Ollama, Local Models, Model Selection,
   Quantization, Fine-Tuning, and When to Self-Host.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('ai-local-models', {
    title: 'Open Source & Local LLMs',
    description: 'Open-source AI ecosystem: Hugging Face Model Hub, Ollama for local inference, model selection criteria, quantization (GGUF, GPTQ), fine-tuning basics, and when to self-host models vs use cloud APIs.',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    prerequisites: ['ai-fundamentals'],

    sections: [
        {
            title: 'Introduction',
            content: `<p>Not all AI work requires paid APIs. The open-source LLM ecosystem has exploded: Llama 3, Mistral, Phi-3, Gemma, and hundreds more run locally or on your own infrastructure. Understanding when and how to use open-source models is increasingly tested in interviews.</p>
            <p><strong>Key reasons to use local/open-source:</strong> data privacy (nothing leaves your network), cost (no per-token fees at scale), latency (no network round-trip), customization (fine-tune on your data), and offline capability.</p>`
        },
        {
            title: 'Hugging Face Ecosystem',
            content: `<p><strong>Hugging Face</strong> is the GitHub of AI &mdash; the central hub for models, datasets, and AI applications:</p>
            <ul>
                <li><strong>Model Hub</strong> &mdash; 500K+ models (text, image, audio, video). Download and run any model.</li>
                <li><strong>Datasets</strong> &mdash; 100K+ datasets for training and evaluation.</li>
                <li><strong>Spaces</strong> &mdash; Hosted demos/apps (Gradio, Streamlit). Try models before downloading.</li>
                <li><strong>Transformers library</strong> &mdash; Python library to load and run any model with 3 lines of code.</li>
                <li><strong>Inference API</strong> &mdash; Serverless API to run models without managing infrastructure.</li>
                <li><strong>GGUF format</strong> &mdash; Quantized models for CPU inference (used by Ollama, llama.cpp).</li>
            </ul>`
        },
        {
            title: 'Ollama & Local Inference',
            content: `<p><strong>Ollama</strong> makes running LLMs locally as easy as Docker. One command to download and run any model:</p>`,
            code: `# Install and run models locally with Ollama
# Download and run Llama 3 (8B parameters)
ollama run llama3

# Run Mistral (7B) for coding tasks
ollama run mistral

# Run Phi-3 (3.8B, Microsoft's small model)
ollama run phi3

# Run Code Llama for code generation
ollama run codellama

# Use from .NET via HTTP API (localhost:11434)
// Ollama exposes OpenAI-compatible API locally:
var client = new HttpClient { BaseAddress = new Uri("http://localhost:11434") };

var response = await client.PostAsJsonAsync("/api/generate", new
{
    model = "llama3",
    prompt = "Explain dependency injection in 3 sentences.",
    stream = false
});

var result = await response.Content.ReadFromJsonAsync<OllamaResponse>();
Console.WriteLine(result.Response);

// Or use OpenAI SDK pointed at Ollama (compatible API):
var openAiClient = new OpenAIClient(
    new ApiKeyCredential("unused"), // Ollama doesn't need a key
    new OpenAIClientOptions { Endpoint = new Uri("http://localhost:11434/v1") });

var chat = openAiClient.GetChatClient("llama3");
var reply = await chat.CompleteChatAsync("What is CQRS?");`,
            language: 'csharp'
        },
        {
            title: 'Model Selection Guide',
            content: `<p>Choosing the right model depends on task, budget, and infrastructure:</p>`,
            table: {
                headers: ['Model', 'Size', 'Strength', 'RAM Needed', 'Best For'],
                rows: [
                    ['Llama 3.1 (8B)', '8B params', 'General purpose, good reasoning', '8 GB', 'General tasks, good balance'],
                    ['Llama 3.1 (70B)', '70B params', 'Near GPT-4 quality', '48 GB', 'Complex reasoning (needs GPU)'],
                    ['Mistral 7B', '7B params', 'Fast, good coding', '6 GB', 'Code gen, quick responses'],
                    ['Phi-3 Mini (3.8B)', '3.8B params', 'Small but capable (Microsoft)', '4 GB', 'Edge/mobile, resource-constrained'],
                    ['CodeLlama (34B)', '34B params', 'Specialized for code', '24 GB', 'Code generation, completion'],
                    ['Gemma 2 (9B)', '9B params', 'Google, strong reasoning', '8 GB', 'General + multilingual'],
                    ['Mixtral 8x7B', '47B active', 'MoE (fast for size)', '32 GB', 'High quality with good speed']
                ]
            },
            callout: { type: 'tip', title: 'Rule of Thumb', text: 'For local development/testing: 7-8B models on a laptop with 16GB RAM. For production self-hosted: 70B+ models on GPU servers. For most production apps: just use OpenAI/Anthropic APIs (cheaper than running your own GPU fleet unless at massive scale).' }
        },
        {
            title: 'Quantization',
            content: `<p><strong>Quantization</strong> reduces model size by lowering numeric precision (32-bit &rarr; 4-bit). Makes large models runnable on consumer hardware with minimal quality loss.</p>
            <ul>
                <li><strong>FP16</strong> &mdash; Half precision (50% size reduction, minimal quality loss)</li>
                <li><strong>INT8</strong> &mdash; 8-bit integers (75% reduction, slight quality loss)</li>
                <li><strong>INT4 / Q4_K_M</strong> &mdash; 4-bit (87% reduction, noticeable on complex reasoning)</li>
                <li><strong>GGUF format</strong> &mdash; Standard format for quantized models (used by Ollama, llama.cpp)</li>
                <li><strong>GPTQ</strong> &mdash; GPU-optimized quantization (faster inference on NVIDIA GPUs)</li>
                <li><strong>AWQ</strong> &mdash; Activation-aware quantization (better quality than GPTQ at same bits)</li>
            </ul>
            <p><strong>Trade-off:</strong> Lower bits = smaller model = faster inference = lower quality. For most tasks, Q4_K_M (4-bit medium) is the sweet spot: 70B model fits in 48GB RAM with acceptable quality.</p>`
        },
        {
            title: 'When to Self-Host vs Use Cloud APIs',
            content: `<p>The critical architecture decision:</p>`,
            table: {
                headers: ['Factor', 'Self-Host (Ollama/vLLM)', 'Cloud API (OpenAI/Anthropic)'],
                rows: [
                    ['Data privacy', 'Full control (nothing leaves network)', 'Data sent to third party (review ToS)'],
                    ['Cost at low volume', 'High (GPU hardware idle cost)', 'Low (pay per token)'],
                    ['Cost at high volume', 'Low (fixed infra cost, unlimited tokens)', 'High (per-token adds up fast)'],
                    ['Quality', 'Good (7-70B), not GPT-4/Claude level', 'Best available (frontier models)'],
                    ['Latency', 'Low (no network), depends on hardware', 'Variable (200ms-2s first token)'],
                    ['Maintenance', 'You manage: updates, scaling, monitoring', 'Zero ops (managed)'],
                    ['Compliance', 'Full control (GDPR, HIPAA, air-gapped)', 'Depends on provider certifications'],
                    ['Breakeven', 'Typically 100K+ requests/day', 'Below 100K requests/day']
                ]
            },
            callout: { type: 'tip', title: 'Decision Framework', text: 'Use cloud APIs unless: (1) data cannot leave your network (healthcare, defense, financial PII), (2) you have 100K+ daily requests where per-token cost exceeds GPU cost, or (3) you need sub-50ms latency. For most enterprise apps, cloud APIs with proper DPA/BAA agreements are the right choice.' }
        },
        {
            title: 'Fine-Tuning Basics',
            content: `<p><strong>Fine-tuning</strong> adapts a pre-trained model to your specific domain or task. When few-shot prompting is not enough:</p>
            <ul>
                <li><strong>When to fine-tune:</strong> Consistent output format needed, domain-specific terminology, specific tone/style, reduce prompt size (internalize instructions)</li>
                <li><strong>When NOT to fine-tune:</strong> RAG can solve it (just retrieve context), few-shot works well enough, dataset is too small (&lt; 100 examples), domain changes frequently</li>
                <li><strong>LoRA / QLoRA:</strong> Efficient fine-tuning that only trains small adapter layers (1-5% of parameters). Cheap, fast, can be merged back into base model.</li>
                <li><strong>Dataset requirements:</strong> 100-10,000 high-quality examples in instruction/response format. Quality &gt; quantity.</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Hugging Face is the central hub for open-source AI (models, datasets, demos)</li>
                <li>Ollama makes local LLM inference trivial (one command to run any model)</li>
                <li>Quantization (4-bit) makes large models runnable on consumer hardware</li>
                <li>Self-host for: data privacy, high volume (100K+/day), ultra-low latency</li>
                <li>Use cloud APIs for: best quality, low/medium volume, zero ops</li>
                <li>Fine-tuning is a last resort after RAG and few-shot prompting fail</li>
                <li>Open-source models are competitive for most tasks; frontier models still win on complex reasoning</li>
            </ul>`
        }
    ],

    questions: [
        {
            id: 'local-q1',
            level: 'mid',
            title: 'When would you choose a local/self-hosted LLM over a cloud API?',
            answer: `<p><strong>Choose local/self-hosted when:</strong></p><ul><li><strong>Data privacy:</strong> Sensitive data (PII, medical, financial) that cannot leave your network</li><li><strong>Cost at scale:</strong> 100K+ requests/day where per-token pricing exceeds GPU server cost</li><li><strong>Latency:</strong> Need sub-50ms inference (no network round-trip)</li><li><strong>Compliance:</strong> Air-gapped environments, specific regulatory requirements</li><li><strong>Offline:</strong> Edge devices, disconnected environments</li></ul><p><strong>Choose cloud API for everything else</strong> (better quality, zero ops, pay-per-use).</p>`
        },
        {
            id: 'local-q2',
            level: 'senior',
            title: 'Explain quantization and its trade-offs for deploying LLMs.',
            answer: `<p><strong>Quantization</strong> reduces numeric precision of model weights (FP32 &rarr; INT4). A 70B parameter model at FP32 = 280GB. At Q4_K_M (4-bit) = ~40GB. Now fits in a single GPU.</p><p><strong>Trade-offs:</strong></p><ul><li><strong>Size/Speed:</strong> 4-bit is 7x smaller and faster than FP32</li><li><strong>Quality:</strong> Minimal loss for simple tasks (classification, extraction). Noticeable degradation for complex reasoning and math.</li><li><strong>Formats:</strong> GGUF (CPU-friendly, Ollama), GPTQ (GPU-optimized), AWQ (best quality-per-bit)</li></ul><p><strong>Rule:</strong> Start with Q4_K_M. If quality is insufficient for your task, try Q5 or Q8. If still insufficient, use larger model or cloud API.</p>`
        },
        {
            id: 'local-q3',
            level: 'senior',
            title: 'How would you integrate Ollama with an existing .NET application?',
            answer: `<p><strong>Integration approaches:</strong></p><ul><li><strong>HTTP API:</strong> Ollama exposes REST at localhost:11434. Use HttpClient directly.</li><li><strong>OpenAI-compatible:</strong> Ollama supports /v1/chat/completions endpoint. Use the standard OpenAI .NET SDK pointed at localhost.</li><li><strong>Semantic Kernel:</strong> Add Ollama as a chat completion service via the OpenAI connector with custom endpoint.</li></ul><p><strong>Production considerations:</strong> Run Ollama in Docker/K8s for scaling. Add health checks. Set memory limits. Use GPU passthrough for larger models. Cache responses (same as cloud APIs).</p>`
        },
        {
            id: 'local-q4',
            level: 'architect',
            title: 'Design a hybrid architecture using both cloud APIs and local models.',
            answer: `<p><strong>Hybrid approach:</strong></p><ul><li><strong>Local models for:</strong> PII-heavy tasks (summarize medical records), high-volume classification (10K docs/hour), embedding generation (no data leaves network)</li><li><strong>Cloud APIs for:</strong> Complex reasoning (system design, multi-step analysis), customer-facing quality (chatbot), tasks requiring frontier capability</li><li><strong>Router:</strong> Classify each request: can it use local? (privacy-sensitive or simple) &rarr; route to Ollama/vLLM. Needs frontier quality? &rarr; route to OpenAI/Anthropic.</li><li><strong>Fallback:</strong> If local model quality is insufficient for a specific request, escalate to cloud with PII redacted.</li></ul>`
        },
        {
            id: 'local-q5',
            level: 'mid',
            title: 'What is LoRA fine-tuning and when would you use it?',
            answer: `<p><strong>LoRA (Low-Rank Adaptation):</strong> Instead of training all model parameters (billions), train small adapter matrices (millions). The base model is frozen; adapters modify behavior.</p><p><strong>Benefits:</strong> 100x less compute, multiple adapters can share one base model (swap at runtime), easy to revert (remove adapter).</p><p><strong>When to use:</strong></p><ul><li>Model needs consistent output format that few-shot cannot achieve</li><li>Domain-specific terminology (legal, medical, your company jargon)</li><li>Specific tone/personality that instructions alone cannot maintain</li><li>Reducing prompt size (fine-tuned model internalizes instructions)</li></ul><p><strong>When NOT:</strong> RAG solves the problem (knowledge retrieval), you have &lt; 100 examples, requirements change frequently.</p>`
        },
        {
            id: 'local-q6',
            level: 'lead',
            title: 'How do you evaluate whether an open-source model is good enough for your production use case?',
            answer: `<p><strong>Evaluation framework:</strong></p><ol><li><strong>Define task-specific benchmarks:</strong> 50-100 test cases with expected outputs from YOUR domain (not generic benchmarks)</li><li><strong>Compare against baseline:</strong> Run same test cases on GPT-4o (your quality ceiling). Score both.</li><li><strong>Acceptable threshold:</strong> If open-source achieves &gt; 90% of GPT-4o quality on YOUR task, it is likely sufficient.</li><li><strong>Latency/cost modeling:</strong> Calculate break-even: local GPU cost vs cloud tokens for your volume.</li><li><strong>Edge case testing:</strong> Test adversarial inputs, unusual formats, multilingual if relevant.</li></ol><p><strong>Key insight:</strong> Generic benchmarks (MMLU, HumanEval) do not predict performance on YOUR specific task. Always evaluate on your own data.</p>`
        },
        {
            id: 'local-q7',
            level: 'architect',
            title: 'What are the infrastructure requirements for self-hosting a 70B parameter model in production?',
            answer: `<p><strong>Infrastructure for 70B model:</strong></p><ul><li><strong>GPU:</strong> 2x A100 80GB (or 4x A10G 24GB) for FP16. 1x A100 for Q4 quantized.</li><li><strong>Serving:</strong> vLLM (PagedAttention, continuous batching) or TGI (Hugging Face). NOT raw transformers (too slow).</li><li><strong>Scaling:</strong> Multiple replicas behind load balancer. Scale based on queue depth.</li><li><strong>Monitoring:</strong> GPU utilization, inference latency (P50/P95/P99), queue length, tokens/sec.</li><li><strong>Cost:</strong> ~$3-5/hour per A100 instance (cloud). vs $0.01-0.03 per 1K tokens on OpenAI.</li><li><strong>Break-even:</strong> At ~50K+ requests/day with average 500 tokens each, self-hosted becomes cheaper.</li></ul>`
        },
        {
            id: 'local-q8',
            level: 'mid',
            title: 'Compare Llama 3, Mistral, and Phi-3 for a code generation task.',
            answer: `<p><strong>For code generation:</strong></p><ul><li><strong>Llama 3.1 8B:</strong> Good general purpose, decent at code. Best balance of quality vs resources. 8GB RAM.</li><li><strong>Mistral 7B:</strong> Slightly faster than Llama at same size. Good at following instructions for code. 6GB RAM.</li><li><strong>Phi-3 Mini 3.8B:</strong> Surprisingly capable for its size (Microsoft trained on high-quality data). Best for constrained environments. 4GB RAM.</li><li><strong>CodeLlama 34B:</strong> Best code quality of the group (specialized). Needs 24GB+ RAM. Worth it if code is primary use case.</li></ul><p><strong>Recommendation:</strong> For a development assistant: CodeLlama 34B if you have GPU, Mistral 7B if laptop-only. For production code review: use cloud API (GPT-4o/Claude) for highest quality.</p>`
        }
    ]
});
