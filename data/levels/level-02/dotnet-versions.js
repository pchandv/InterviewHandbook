PageData.register('dotnet-versions', {
    title: '.NET Core Version History',
    description: 'Complete guide to .NET evolution from .NET Core 1.0 through .NET 9, LTS vs STS releases, key features per version, and migration strategies.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>.NET has evolved rapidly since the open-source rewrite began in 2016. Understanding the version timeline, LTS vs STS (Standard Term Support) releases, and key features per version is essential for interviews — especially when discussing migration strategies, tech debt, and platform decisions.</p>
<p>This topic covers every major release, what each introduced, which to target for new projects, and how to migrate between versions safely.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>Key terminology:</p>
<ul>
<li><strong>LTS (Long Term Support)</strong> — 3 years of support. Production-safe. Currently: .NET 6 (Nov 2024 EOL), .NET 8 (Nov 2026 EOL)</li>
<li><strong>STS (Standard Term Support)</strong> — 18 months of support. Adopt for greenfield that will upgrade quickly. .NET 7, .NET 9.</li>
<li><strong>TFM (Target Framework Moniker)</strong> — e.g., net8.0, net6.0. Specifies which APIs are available.</li>
<li><strong>.NET Standard</strong> — Cross-platform API surface (deprecated concept; replaced by multi-targeting net6.0+)</li>
<li><strong>Global.json</strong> — Pins SDK version per repo for reproducible builds</li>
</ul>`,
            table: {
                headers: ['Version', 'Release', 'EOL', 'Support', 'Key Theme'],
                rows: [
                    ['.NET Core 1.0', 'Jun 2016', 'Jun 2019', 'LTS', 'Cross-platform rewrite begins'],
                    ['.NET Core 2.0', 'Aug 2017', 'Oct 2018', 'STS', '.NET Standard 2.0, Razor Pages'],
                    ['.NET Core 2.1', 'May 2018', 'Aug 2021', 'LTS', 'SignalR, HttpClientFactory, Span<T>'],
                    ['.NET Core 3.0', 'Sep 2019', 'Mar 2020', 'STS', 'WPF/WinForms, C# 8, gRPC, Worker Services'],
                    ['.NET Core 3.1', 'Dec 2019', 'Dec 2022', 'LTS', 'Blazor Server GA, last "Core" branding'],
                    ['.NET 5', 'Nov 2020', 'May 2022', 'STS', 'Unification (no more "Core"), C# 9, records, top-level statements'],
                    ['.NET 6', 'Nov 2021', 'Nov 2024', 'LTS', 'Minimal APIs, Hot Reload, MAUI, C# 10'],
                    ['.NET 7', 'Nov 2022', 'May 2024', 'STS', 'Rate Limiting, Output Caching, Native AOT preview, C# 11'],
                    ['.NET 8', 'Nov 2023', 'Nov 2026', 'LTS', 'Native AOT GA, Blazor United, Keyed DI, C# 12'],
                    ['.NET 9', 'Nov 2024', 'May 2026', 'STS', 'Performance, AI integration, Blazor improvements, C# 13']
                ]
            }
        },
        {
            title: 'How It Works',
            content: `<p>The .NET release cadence and support model:</p>
<ul>
<li><strong>Annual releases</strong> — Every November. Even-numbered = LTS, Odd-numbered = STS.</li>
<li><strong>Preview releases</strong> — Monthly previews starting in February; RC in September/October.</li>
<li><strong>Side-by-side</strong> — Multiple .NET versions can coexist on one machine. Apps target specific versions.</li>
<li><strong>Roll-forward</strong> — Apps can roll forward to compatible patch versions automatically.</li>
<li><strong>global.json</strong> — Pin exact SDK version per repository to avoid "works on my machine" issues.</li>
</ul>`,
            mermaid: `flowchart LR
    subgraph LTS["LTS (3 years)"]
        A[".NET 6<br/>Nov 2021"]
        B[".NET 8<br/>Nov 2023"]
        C[".NET 10<br/>Nov 2025"]
    end
    subgraph STS["STS (18 months)"]
        D[".NET 7<br/>Nov 2022"]
        E[".NET 9<br/>Nov 2024"]
        F[".NET 11<br/>Nov 2026"]
    end
    A --> D
    D --> B
    B --> E
    E --> C
    C --> F`
        },
        {
            title: 'Key Features by Version',
            content: `<p>What each major version introduced that matters for production:</p>
<h4>.NET 6 LTS — The Modern Baseline</h4>
<ul>
<li>Minimal APIs (no controllers needed for simple endpoints)</li>
<li>Hot Reload (edit code, see changes without restart)</li>
<li>Global usings + file-scoped namespaces (less boilerplate)</li>
<li>DateOnly/TimeOnly types</li>
<li>MAUI (cross-platform mobile/desktop)</li>
<li>HTTP/3 support</li>
</ul>
<h4>.NET 7 STS — Performance + Developer Experience</h4>
<ul>
<li>Rate Limiting middleware (built-in, no third-party needed)</li>
<li>Output Caching middleware</li>
<li>Native AOT preview (compile to native binary)</li>
<li>Generic math (static abstract members in interfaces)</li>
<li>Required members (required keyword for properties)</li>
</ul>
<h4>.NET 8 LTS — The Current Target</h4>
<ul>
<li>Native AOT GA (publish as single native executable)</li>
<li>Blazor United (SSR + Server + WASM in one project)</li>
<li>Keyed DI services (resolve by key, not just type)</li>
<li>Primary constructors for classes</li>
<li>TimeProvider (testable time abstraction)</li>
<li>FrozenDictionary/FrozenSet (immutable, optimized for reads)</li>
<li>Identity API endpoints (built-in auth endpoints)</li>
</ul>
<h4>.NET 9 STS — Latest</h4>
<ul>
<li>Improved Blazor component model</li>
<li>AI/ML integration (Microsoft.Extensions.AI)</li>
<li>HybridCache (combines memory + distributed cache)</li>
<li>LINQ improvements (CountBy, Index, AggregateBy)</li>
<li>Performance: faster JSON serialization, reduced allocations</li>
</ul>`,
            code: `// .NET 6: Minimal API
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.MapGet("/hello", () => "Hello World");
app.Run();

// .NET 7: Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 100;
        opt.QueueLimit = 10;
    });
});

// .NET 8: Keyed DI Services
builder.Services.AddKeyedSingleton<ICache>("redis", new RedisCache());
builder.Services.AddKeyedSingleton<ICache>("memory", new MemoryCache());
// Inject: ([FromKeyedServices("redis")] ICache cache)

// .NET 8: Primary Constructors
public class OrderService(IOrderRepository repo, ILogger<OrderService> logger)
{
    public async Task<Order> GetOrder(int id)
    {
        logger.LogInformation("Fetching order {Id}", id);
        return await repo.GetByIdAsync(id);
    }
}

// .NET 9: HybridCache
builder.Services.AddHybridCache(options =>
{
    options.DefaultEntryOptions = new() { Expiration = TimeSpan.FromMinutes(5) };
});
// Usage: var data = await hybridCache.GetOrCreateAsync(key, async ct => await FetchData(ct));`,
            language: 'csharp'
        },
        {
            title: 'Migration Strategy',
            content: `<p>How to migrate between .NET versions safely:</p>`,
            mermaid: `flowchart TD
    A[Assess Current Version] --> B{Is current EOL?}
    B -->|Yes| C[Urgent: Plan migration sprint]
    B -->|No| D[Schedule for next quarter]
    C --> E[Update TFM in .csproj]
    D --> E
    E --> F[Run dotnet build - fix breaks]
    F --> G[Update NuGet packages]
    G --> H[Address breaking changes]
    H --> I[Run full test suite]
    I --> J{Tests pass?}
    J -->|Yes| K[Deploy to staging]
    J -->|No| L[Fix issues, repeat]
    L --> I
    K --> M[Performance benchmarks]
    M --> N[Production deploy]`
        },
        {
            title: 'Best Practices',
            content: `<ul>
<li><strong>Target LTS for production</strong> — .NET 8 for new projects (supported until Nov 2026)</li>
<li><strong>Use global.json</strong> — Pin SDK version: <code>{ "sdk": { "version": "8.0.300" } }</code></li>
<li><strong>Multi-target shared libraries</strong> — Target net6.0;net8.0 for libraries consumed by multiple apps</li>
<li><strong>Stay one LTS behind at most</strong> — Being on EOL versions = security risk and no patches</li>
<li><strong>Read breaking changes docs</strong> — Every release has a migration guide with exact code changes needed</li>
<li><strong>Use .NET Upgrade Assistant</strong> — CLI tool that automates most TFM + package + code changes</li>
<li><strong>Benchmark after upgrade</strong> — Each version brings perf improvements; validate with BenchmarkDotNet</li>
<li><strong>Test on CI before merge</strong> — Build matrix: test against both old and new TFM during migration</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>Running on EOL versions</strong> — .NET Core 3.1 EOL was Dec 2022; still common in enterprises. No security patches.</li>
<li><strong>Skipping versions recklessly</strong> — Jumping from .NET Core 3.1 to .NET 8 in one step. Better: 3.1 → 6 → 8.</li>
<li><strong>Not updating NuGet packages</strong> — Upgrading TFM without updating packages leads to compatibility issues</li>
<li><strong>Confusing .NET Standard with .NET</strong> — .NET Standard is a bridge API, not a runtime. New code should target net8.0+.</li>
<li><strong>Ignoring nullable reference types</strong> — Enabled by default in .NET 6+; produces warnings that should be fixed, not suppressed</li>
<li><strong>Using STS in production without upgrade plan</strong> — .NET 7/9 only have 18 months; if you cannot upgrade yearly, use LTS</li>
</ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>Version awareness</strong> — Which version is current LTS? When does it EOL? (Shows you stay current)</li>
<li><strong>Migration experience</strong> — Have you migrated production apps? What broke? How did you handle it?</li>
<li><strong>Feature knowledge</strong> — Can you name 3 key features of .NET 8? (Primary constructors, Native AOT, Keyed DI, Blazor United)</li>
<li><strong>Decision rationale</strong> — Why LTS over STS? When would you use STS?</li>
<li><strong>Ecosystem understanding</strong> — How does EF Core versioning align? Which EF Core works with which .NET?</li>
</ul>`
            }
        }
    ],
    questions: [
        {
            id: 'dotnet-ver-q1',
            level: 'junior',
            title: 'What is the difference between LTS and STS .NET releases?',
            answer: `<p><strong>LTS (Long Term Support)</strong> — Even-numbered releases (.NET 6, 8, 10). Supported for 3 years. Get bug fixes and security patches for the full period. Recommended for production workloads.</p>
<p><strong>STS (Standard Term Support)</strong> — Odd-numbered releases (.NET 7, 9, 11). Supported for only 18 months. Get the newest features first but require upgrading sooner.</p>
<p>Rule of thumb: Use LTS unless you have a CI/CD pipeline that can upgrade every year and you want bleeding-edge features immediately.</p>`
        },
        {
            id: 'dotnet-ver-q2',
            level: 'junior',
            title: 'What .NET version should you target for a new production project in 2025?',
            answer: `<p><strong>.NET 8</strong> — it is the current LTS release (supported until November 2026). Reasons:</p>
<ul>
<li>3 years of security patches and bug fixes</li>
<li>All major NuGet packages support it</li>
<li>Native AOT is GA for performance-critical services</li>
<li>Entity Framework Core 8 is mature and performant</li>
<li>Blazor United provides full-stack .NET if needed</li>
</ul>
<p>Consider .NET 9 only if: you need a specific .NET 9 feature AND your team commits to upgrading to .NET 10 (next LTS) within 18 months.</p>`
        },
        {
            id: 'dotnet-ver-q3',
            level: 'mid',
            title: 'How would you migrate a .NET Core 3.1 application to .NET 8?',
            answer: `<p>Recommended approach: two-hop migration (3.1 → 6 → 8) rather than one big jump:</p>
<ol>
<li><strong>3.1 → 6</strong> — This is the bigger jump. Key changes: Startup.cs → Program.cs (optional), nullable enabled, new hosting model, System.Text.Json default. Use .NET Upgrade Assistant tool.</li>
<li><strong>6 → 8</strong> — Smaller jump. Update TFM, NuGet packages, adopt new features optionally (primary constructors, keyed DI).</li>
</ol>
<p><strong>Detailed steps per hop:</strong></p>
<ul>
<li>Update global.json SDK version</li>
<li>Change TargetFramework in .csproj: net8.0</li>
<li>Update ALL NuGet packages to .NET 8-compatible versions</li>
<li>Fix breaking changes (check docs.microsoft.com/dotnet/core/compatibility)</li>
<li>Run test suite — fix compilation errors, then runtime failures</li>
<li>Test in staging with production-like load</li>
<li>Deploy with rollback capability</li>
</ul>`
        },
        {
            id: 'dotnet-ver-q4',
            level: 'mid',
            title: 'What are the key features that .NET 8 introduced over .NET 6?',
            answer: `<p>Major features added between .NET 6 and .NET 8:</p>
<ul>
<li><strong>Native AOT</strong> — Compile to native binary, no JIT, instant startup (~10ms), smaller memory footprint. Ideal for serverless/containers.</li>
<li><strong>Keyed DI Services</strong> — Register multiple implementations of same interface, resolve by string key. Replaces manual factory patterns.</li>
<li><strong>Primary Constructors</strong> (C# 12) — Constructor parameters available in entire class body without explicit fields.</li>
<li><strong>Blazor United</strong> — Single Blazor project supports SSR, Server interactive, and WASM interactive per-component.</li>
<li><strong>TimeProvider</strong> — Abstraction over DateTime.Now for testable time-dependent code.</li>
<li><strong>FrozenDictionary/FrozenSet</strong> — Immutable collections optimized for read-heavy scenarios (faster than Dictionary for lookups after creation).</li>
<li><strong>Output Caching improvements</strong> — Tag-based invalidation, better Redis integration.</li>
<li><strong>Identity API endpoints</strong> — Built-in /register, /login, /refresh endpoints without Identity UI scaffolding.</li>
<li><strong>.NET Aspire</strong> — Opinionated cloud-native app composition (service discovery, telemetry, health checks).</li>
</ul>`
        },
        {
            id: 'dotnet-ver-q5',
            level: 'senior',
            title: 'When would you choose Native AOT and what are the trade-offs?',
            answer: `<p><strong>Choose Native AOT when:</strong></p>
<ul>
<li>Cold start time matters (serverless functions, CLI tools, short-lived containers)</li>
<li>Memory footprint is constrained (IoT, sidecar containers)</li>
<li>You need deterministic performance (no JIT pauses)</li>
<li>Deployment to environments without .NET runtime installed</li>
</ul>
<p><strong>Trade-offs:</strong></p>
<ul>
<li><strong>No reflection at runtime</strong> — Libraries using reflection (some DI containers, ORMs, serializers) may not work. Source generators are the replacement.</li>
<li><strong>No dynamic code generation</strong> — Expression.Compile(), Reflection.Emit are not available</li>
<li><strong>Larger binary</strong> — Self-contained native binary is larger than framework-dependent managed DLL</li>
<li><strong>Longer build times</strong> — AOT compilation is significantly slower than JIT</li>
<li><strong>Limited library compatibility</strong> — Check IsAotCompatible on NuGet packages; many are not yet</li>
<li><strong>No dynamic assembly loading</strong> — Plugin architectures need redesigning</li>
</ul>
<p>For most web APIs: JIT is fine. For Lambda/Azure Functions with cold starts: AOT is compelling.</p>`
        },
        {
            id: 'dotnet-ver-q6',
            level: 'senior',
            title: 'What is .NET Aspire and how does it change cloud-native development?',
            answer: `<p>.NET Aspire (introduced with .NET 8) is an opinionated stack for building cloud-native, distributed applications:</p>
<ul>
<li><strong>App Model</strong> — Declare your distributed app topology in C#: which services, databases, caches exist and how they connect</li>
<li><strong>Service Discovery</strong> — Automatic service-to-service discovery without manual URL configuration</li>
<li><strong>Telemetry</strong> — OpenTelemetry configured out-of-box (traces, metrics, logs) with dashboard</li>
<li><strong>Health Checks</strong> — Standardized health monitoring across all services</li>
<li><strong>Resilience</strong> — Built-in retry/circuit-breaker via Microsoft.Extensions.Http.Resilience</li>
<li><strong>Developer Dashboard</strong> — Local dashboard showing all services, logs, traces, metrics during development</li>
</ul>
<p>It does NOT replace Kubernetes or Docker — it is a development-time orchestrator that makes it easy to run multi-service apps locally and deploy to any cloud host.</p>`
        },
        {
            id: 'dotnet-ver-q7',
            level: 'mid',
            title: 'What is global.json and why should every team use it?',
            answer: `<p><code>global.json</code> pins the .NET SDK version for a repository:</p>
<pre><code>{
  "sdk": {
    "version": "8.0.300",
    "rollForward": "latestPatch"
  }
}</code></pre>
<p><strong>Why it matters:</strong></p>
<ul>
<li><strong>Reproducible builds</strong> — Everyone on the team uses the same SDK version, eliminating "works on my machine"</li>
<li><strong>CI consistency</strong> — Build server uses the same SDK as developers</li>
<li><strong>Controlled upgrades</strong> — Upgrade SDK intentionally via PR, not accidentally when someone installs a new version</li>
<li><strong>rollForward policy</strong> — "latestPatch" allows auto-update to 8.0.301 but not 8.1.x; "latestFeature" allows 8.1.x</li>
</ul>
<p>Place it in the repo root. Without it, whatever SDK is installed globally is used — dangerous in heterogeneous teams.</p>`
        },
        {
            id: 'dotnet-ver-q8',
            level: 'architect',
            title: 'How do you manage .NET version strategy across 20+ microservices?',
            answer: `<p>Enterprise .NET version governance:</p>
<ul>
<li><strong>Version policy document</strong> — "All services must target current or previous LTS. EOL versions get mandatory upgrade sprints."</li>
<li><strong>Shared build infrastructure</strong> — Central NuGet feed with vetted package versions; Directory.Build.props for consistent settings</li>
<li><strong>Upgrade waves</strong> — Not all 20 services at once. Group by risk: low-traffic services first, critical path last.</li>
<li><strong>Automated detection</strong> — CI pipeline checks TFM age; alert if service is within 6 months of EOL</li>
<li><strong>Shared library compatibility</strong> — Internal NuGet packages multi-target (net6.0;net8.0) so services can upgrade independently</li>
<li><strong>Deprecation timeline</strong> — When new LTS ships, teams have 12 months to migrate off previous LTS</li>
<li><strong>global.json per repo</strong> — Each service controls its own SDK version; no global surprises</li>
<li><strong>Cost tracking</strong> — Quantify cost of staying on old versions (security risk, missing features, slower dev velocity) to justify upgrade investment</li>
</ul>`
        }
    ]
});
