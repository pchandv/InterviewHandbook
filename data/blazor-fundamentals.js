/* ═══════════════════════════════════════════════════════════════════
   Blazor Fundamentals — .NET 8 Render Modes, Components & Lifecycle
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('blazor-fundamentals', {
    title: 'Blazor Fundamentals',
    description: 'Understanding Blazor\'s place in the .NET ecosystem — render modes (.NET 8 unified model), component architecture, lifecycle hooks, event handling, forms & validation, routing, and dependency injection across Server and WebAssembly hosting models.',
    sections: [
        {
            title: 'Introduction',
            content: `<p><strong>Blazor</strong> is a .NET framework for building interactive web UIs using C# instead of JavaScript. With .NET 8, Blazor introduced a <strong>unified full-stack model</strong> where a single project can mix Static SSR, Interactive Server, Interactive WebAssembly, and Interactive Auto render modes per-component.</p>
            <ul>
                <li><strong>Blazor Server</strong> — UI logic runs on the server; DOM updates sent via SignalR</li>
                <li><strong>Blazor WebAssembly</strong> — .NET runtime runs in the browser via WASM</li>
                <li><strong>Blazor United (.NET 8)</strong> — mix render modes per-page or per-component</li>
                <li><strong>Razor Components (.razor)</strong> — the building block: markup + C# logic</li>
                <li><strong>No JavaScript required</strong> — full interactivity in C#, with JS interop when needed</li>
            </ul>`
        },
        {
            title: 'Core Concepts — Render Modes (.NET 8)',
            content: `<p>.NET 8 introduces <strong>render modes</strong> that control where and how a component executes. You can set render modes globally, per-page, or per-component — enabling granular optimization.</p>
            <ul>
                <li><strong>Static SSR</strong> — component renders HTML on server, no interactivity (fast initial load, SEO)</li>
                <li><strong>Interactive Server</strong> — runs on server, SignalR circuit for real-time updates</li>
                <li><strong>Interactive WebAssembly</strong> — downloaded to browser, runs entirely client-side</li>
                <li><strong>Interactive Auto</strong> — starts as Server (fast), then switches to WASM once downloaded</li>
            </ul>`,
            code: `// Setting render mode at the component level (.NET 8)
@page "/dashboard"
@rendermode InteractiveServer

<h1>Dashboard</h1>
<RealtimeChart />  @* Inherits parent's InteractiveServer mode *@

// Or set per-component in parent:
<Counter @rendermode="RenderMode.InteractiveWebAssembly" />
<AdminPanel @rendermode="RenderMode.InteractiveServer" />
<StaticFooter />  @* No rendermode = Static SSR *@

// Global default in App.razor:
<Routes @rendermode="RenderMode.InteractiveAuto" />

// Program.cs configuration:
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddInteractiveWebAssemblyComponents();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode()
    .AddInteractiveWebAssemblyRenderMode()
    .AddAdditionalAssemblies(typeof(Counter).Assembly);`,
            language: 'csharp'
        },
        {
            title: 'Render Modes Architecture',
            content: `<p>Understanding where each render mode executes code and how the browser communicates with the server is critical for choosing the right mode for each scenario.</p>`,
            mermaid: `flowchart TB
    subgraph Browser["Browser"]
        direction TB
        DOM["DOM / UI"]
        WASM["WASM Runtime<br/>.NET on client"]
    end
    subgraph Server["Server"]
        direction TB
        SSR["Static SSR<br/>(HTML only, no circuit)"]
        SRV["Interactive Server<br/>(.NET on server)"]
        AUTO["Auto Mode<br/>(Server first → WASM)"]
    end
    SSR -->|"HTML response<br/>(no WebSocket)"| DOM
    SRV <-->|"SignalR Circuit<br/>(real-time diffs)"| DOM
    WASM -->|"Direct DOM manipulation<br/>(no server needed)"| DOM
    AUTO -->|"Phase 1: SignalR"| DOM
    AUTO -.->|"Phase 2: downloads WASM<br/>then disconnects circuit"| WASM`
        },
        {
            title: 'Component Model — Parameters & Communication',
            content: `<p>Blazor components are self-contained units of UI. Parent-child communication uses <strong>[Parameter]</strong> for data down, <strong>EventCallback</strong> for events up, and <strong>CascadingValue/CascadingParameter</strong> for implicit context sharing across deep trees.</p>`,
            code: `// Parent component passing data down
<ChildComponent Title="Hello" Count="@currentCount"
                OnIncrement="HandleIncrement" />

// Child component receiving parameters
@code {
    [Parameter] public string Title { get; set; } = "";
    [Parameter] public int Count { get; set; }
    [Parameter] public EventCallback OnIncrement { get; set; }
    [Parameter] public EventCallback<string> OnMessage { get; set; }

    // Required parameter (throws if not provided)
    [Parameter, EditorRequired] public RenderFragment ChildContent { get; set; } = default!;

    private async Task IncrementClicked()
    {
        await OnIncrement.InvokeAsync();       // Notify parent
        await OnMessage.InvokeAsync("Done!");   // Pass data up
    }
}

// CascadingValue — implicit context for deep trees
// App.razor or layout:
<CascadingValue Value="@theme" Name="AppTheme">
    <Router AppAssembly="@typeof(App).Assembly">
        <Found Context="routeData">
            <RouteView RouteData="@routeData" />
        </Found>
    </Router>
</CascadingValue>

// Any descendant component (no matter how deep):
@code {
    [CascadingParameter(Name = "AppTheme")]
    public ThemeInfo Theme { get; set; } = default!;
}

// RenderFragment for templated components:
<Card>
    <Header><h3>My Card</h3></Header>
    <Body><p>Content here</p></Body>
</Card>

@code {
    [Parameter] public RenderFragment? Header { get; set; }
    [Parameter] public RenderFragment? Body { get; set; }
}`,
            language: 'csharp'
        },
        {
            title: 'Component Lifecycle',
            content: `<p>Blazor components follow a defined lifecycle. Understanding the order and purpose of each method is essential for correct initialization, data fetching, and cleanup.</p>
            <ul>
                <li><strong>SetParametersAsync</strong> — raw parameter assignment (rarely overridden)</li>
                <li><strong>OnInitialized / OnInitializedAsync</strong> — called once when component first renders (fetch data here)</li>
                <li><strong>OnParametersSet / OnParametersSetAsync</strong> — called after parameters change (re-fetch if ID changes)</li>
                <li><strong>OnAfterRender / OnAfterRenderAsync</strong> — DOM is available (JS interop safe here)</li>
                <li><strong>ShouldRender</strong> — return false to skip re-rendering (performance optimization)</li>
                <li><strong>Dispose / DisposeAsync</strong> — cleanup subscriptions, timers, JS references</li>
                <li><strong>StateHasChanged</strong> — manually trigger re-render (needed for async callbacks outside Blazor events)</li>
            </ul>`,
            mermaid: `sequenceDiagram
    participant P as Parent Component
    participant C as Child Component
    participant DOM as Browser DOM
    P->>C: Render with Parameters
    C->>C: SetParametersAsync()
    C->>C: OnInitialized() / OnInitializedAsync()
    C->>C: OnParametersSet() / OnParametersSetAsync()
    C->>C: BuildRenderTree()
    C->>DOM: Diff & Patch DOM
    DOM-->>C: DOM Ready
    C->>C: OnAfterRender(firstRender: true)
    Note over C: Subsequent parameter changes:
    P->>C: New parameters
    C->>C: SetParametersAsync()
    C->>C: OnParametersSet()
    C->>C: ShouldRender()? → true
    C->>DOM: Re-render
    C->>C: OnAfterRender(firstRender: false)
    Note over C: Disposal:
    P->>C: Component removed
    C->>C: Dispose() / DisposeAsync()`
        },
        {
            title: 'Lifecycle Implementation',
            content: `<p>A practical component demonstrating lifecycle hooks, async data loading, parameter change detection, and proper disposal patterns.</p>`,
            code: `@page "/product/{ProductId:int}"
@implements IAsyncDisposable

<h2>@product?.Name</h2>
<p>@product?.Description</p>

@if (loading)
{
    <p>Loading...</p>
}

@code {
    [Parameter] public int ProductId { get; set; }
    [Inject] private IProductService ProductService { get; set; } = default!;
    [Inject] private IJSRuntime JS { get; set; } = default!;

    private ProductDto? product;
    private bool loading = true;
    private int previousProductId;
    private CancellationTokenSource cts = new();
    private IJSObjectReference? jsModule;

    // Called ONCE on first render
    protected override async Task OnInitializedAsync()
    {
        await LoadProduct();
    }

    // Called EVERY TIME parameters change (including first time)
    protected override async Task OnParametersSetAsync()
    {
        if (ProductId != previousProductId)
        {
            previousProductId = ProductId;
            await LoadProduct(); // Re-fetch when navigating /product/1 → /product/2
        }
    }

    // DOM is ready — safe for JS interop
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            jsModule = await JS.InvokeAsync<IJSObjectReference>(
                "import", "./js/product-viewer.js");
            await jsModule.InvokeVoidAsync("initCarousel", "#product-images");
        }
    }

    // Performance: skip render if nothing meaningful changed
    protected override bool ShouldRender() => !loading || product != null;

    private async Task LoadProduct()
    {
        loading = true;
        cts.Cancel();
        cts = new CancellationTokenSource();
        try
        {
            product = await ProductService.GetByIdAsync(ProductId, cts.Token);
        }
        catch (OperationCanceledException) { /* navigation interrupted */ }
        finally { loading = false; }
    }

    // Cleanup: cancel pending ops, dispose JS module
    public async ValueTask DisposeAsync()
    {
        cts.Cancel();
        cts.Dispose();
        if (jsModule is not null)
            await jsModule.DisposeAsync();
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Event Handling & Data Binding',
            content: `<p>Blazor handles DOM events via C# delegates. <strong>@bind</strong> provides two-way binding (syntactic sugar for value + onchange), while explicit event handlers give full control over event args, preventing default behavior, and debouncing.</p>`,
            code: `@page "/events-demo"

<!-- Basic event handling -->
<button @onclick="HandleClick">Click Me</button>
<button @onclick="@(() => IncrementBy(5))">+5 (Lambda)</button>
<button @onclick="HandleClick" @onclick:preventDefault>No Default</button>
<button @onclick="HandleClick" @onclick:stopPropagation>No Bubble</button>

<!-- Two-way binding (@bind) -->
<input @bind="searchText" />                     @* Updates on blur (default) *@
<input @bind="searchText" @bind:event="oninput" /> @* Updates on every keystroke *@
<input @bind="birthDate" @bind:format="yyyy-MM-dd" />

<!-- Binding to component parameters -->
<ChildComponent @bind-Value="parentValue" />
@* Requires: [Parameter] public string Value { get; set; }
              [Parameter] public EventCallback<string> ValueChanged { get; set; } *@

<!-- Event arguments -->
<input @onkeydown="HandleKeyDown" />
<div @onmousemove="HandleMouse" style="width:200px;height:200px;background:#eee;">
    Position: @mouseX, @mouseY
</div>

@code {
    private string searchText = "";
    private DateTime birthDate = DateTime.Today;
    private string parentValue = "initial";
    private double mouseX, mouseY;

    private void HandleClick(MouseEventArgs e)
    {
        Console.WriteLine($"Clicked at ({e.ClientX}, {e.ClientY}), Shift: {e.ShiftKey}");
    }

    private void IncrementBy(int amount) => currentCount += amount;

    private void HandleKeyDown(KeyboardEventArgs e)
    {
        if (e.Key == "Enter") { /* submit logic */ }
    }

    private void HandleMouse(MouseEventArgs e)
    {
        mouseX = e.OffsetX;
        mouseY = e.OffsetY;
    }

    // Custom two-way binding in child:
    // [Parameter] public string Value { get; set; }
    // [Parameter] public EventCallback<string> ValueChanged { get; set; }
    // private Task OnInput(ChangeEventArgs e)
    //     => ValueChanged.InvokeAsync(e.Value?.ToString());
}`,
            language: 'csharp'
        },
        {
            title: 'Forms & Validation',
            content: `<p>Blazor provides <strong>EditForm</strong> with built-in validation via Data Annotations or custom validators. The <strong>EditContext</strong> tracks field state (modified, valid, invalid) and integrates with <strong>FluentValidation</strong> for complex rules.</p>`,
            code: `@page "/register"
@using System.ComponentModel.DataAnnotations

<EditForm Model="@model" OnValidSubmit="HandleSubmit" FormName="register">
    <DataAnnotationsValidator />
    <ValidationSummary />

    <div class="form-group">
        <label>Name</label>
        <InputText @bind-Value="model.Name" class="form-control" />
        <ValidationMessage For="@(() => model.Name)" />
    </div>

    <div class="form-group">
        <label>Email</label>
        <InputText @bind-Value="model.Email" class="form-control" />
        <ValidationMessage For="@(() => model.Email)" />
    </div>

    <div class="form-group">
        <label>Role</label>
        <InputSelect @bind-Value="model.Role">
            <option value="">-- Select --</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
        </InputSelect>
    </div>

    <div class="form-group">
        <InputCheckbox @bind-Value="model.AgreeToTerms" />
        <label>I agree to terms</label>
    </div>

    <button type="submit" disabled="@(!context.Validate())">Register</button>
</EditForm>

@code {
    private RegisterModel model = new();
    private EditContext? context;

    protected override void OnInitialized()
    {
        context = new EditContext(model);
    }

    private async Task HandleSubmit()
    {
        await AuthService.RegisterAsync(model);
        Navigation.NavigateTo("/welcome");
    }

    public class RegisterModel
    {
        [Required(ErrorMessage = "Name is required")]
        [StringLength(50, MinimumLength = 2)]
        public string Name { get; set; } = "";

        [Required, EmailAddress]
        public string Email { get; set; } = "";

        [Required]
        public string Role { get; set; } = "";

        [Range(typeof(bool), "true", "true", ErrorMessage = "Must agree")]
        public bool AgreeToTerms { get; set; }
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Routing & Navigation',
            content: `<p>Blazor routing uses <strong>@page</strong> directives with route templates. Route parameters support constraints, and <strong>NavigationManager</strong> enables programmatic navigation with state passing.</p>`,
            code: `// Multiple route templates for one component
@page "/orders"
@page "/orders/{OrderId:int}"
@page "/orders/{OrderId:int}/details"

// Route constraints
@page "/users/{UserId:guid}"
@page "/search/{Query:alpha}"
@page "/page/{PageNum:int:min(1)}"

// Catch-all parameter
@page "/docs/{*slug}"

@code {
    [Parameter] public int? OrderId { get; set; }
    [Parameter] public string? Slug { get; set; }

    // Query string parameters (.NET 6+)
    [SupplyParameterFromQuery(Name = "page")]
    public int CurrentPage { get; set; } = 1;

    [SupplyParameterFromQuery]
    public string? Filter { get; set; }
}

// NavigationManager for programmatic navigation:
@inject NavigationManager Nav

@code {
    private void GoToOrder(int id)
    {
        Nav.NavigateTo($"/orders/{id}");
    }

    private void GoWithQueryString()
    {
        Nav.NavigateTo("/search?q=blazor&page=2");
    }

    // Force reload (bypass client-side routing)
    private void HardReload()
    {
        Nav.NavigateTo("/external-page", forceLoad: true);
    }

    // Enhanced navigation (.NET 8) — intercept & prevent
    private void HandleLocationChanging(LocationChangingContext context)
    {
        if (hasUnsavedChanges)
            context.PreventNavigation();
    }
}

// NavLink — active CSS class management
<nav>
    <NavLink href="/" Match="NavLinkMatch.All">Home</NavLink>
    <NavLink href="/orders" Match="NavLinkMatch.Prefix">Orders</NavLink>
</nav>`,
            language: 'csharp'
        },
        {
            title: 'Dependency Injection in Components',
            content: `<p>Blazor uses .NET's built-in DI container. Service lifetimes behave differently between Server and WebAssembly — the key difference is <strong>Scoped</strong>: on Server it's per-circuit (user session), on WASM it's per-app (singleton-like since there's one "scope" per tab).</p>`,
            code: `// Injecting services in components
@page "/weather"
@inject IWeatherService WeatherService
@inject NavigationManager Nav
@inject ILogger<Weather> Logger

// Or via attribute in @code block:
@code {
    [Inject] private IWeatherService WeatherService { get; set; } = default!;
    [Inject] private IHttpClientFactory HttpFactory { get; set; } = default!;
}

// Service registration — lifetime matters!
// Program.cs:
builder.Services.AddScoped<IWeatherService, WeatherService>();
// Server: Scoped = per SignalR circuit (essentially per-user-session)
// WASM:   Scoped = per app instance (only 1 scope exists in browser tab)

builder.Services.AddSingleton<ICacheService, MemoryCacheService>();
// Server: Shared across ALL users/circuits — be thread-safe!
// WASM:   Same as Scoped (one instance per tab)

builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();
// Both: New instance every time injected — stateless services

// Keyed services (.NET 8):
builder.Services.AddKeyedScoped<INotifier, EmailNotifier>("email");
builder.Services.AddKeyedScoped<INotifier, SmsNotifier>("sms");

// Inject keyed service:
@inject [FromKeyedServices("email")] INotifier EmailNotifier

// HttpClient registration for WASM:
builder.Services.AddScoped(sp =>
    new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

// Named HttpClient for Server:
builder.Services.AddHttpClient("api", client =>
{
    client.BaseAddress = new Uri("https://api.example.com");
    client.DefaultRequestHeaders.Add("X-Api-Key", config["ApiKey"]);
});`,
            language: 'csharp'
        },
        {
            title: 'Common Mistakes',
            content: `<p>Blazor has several common pitfalls that trip up developers transitioning from MVC/Razor Pages or SPA frameworks:</p>
            <ul>
                <li><strong>Calling StateHasChanged from non-Blazor threads</strong> — use <code>InvokeAsync(StateHasChanged)</code> when updating from Timer callbacks or external events</li>
                <li><strong>Async void event handlers</strong> — Blazor cannot track <code>async void</code>; use <code>async Task</code> to ensure proper re-rendering</li>
                <li><strong>Not disposing resources</strong> — forgetting <code>IDisposable</code>/<code>IAsyncDisposable</code> on components with timers, event subscriptions, or JS object references causes memory leaks</li>
                <li><strong>Heavy computation in OnInitializedAsync on Server</strong> — blocks the SignalR circuit; use streaming rendering or background services instead</li>
                <li><strong>Confusing Scoped lifetimes</strong> — on Server, Scoped = per-circuit (survives navigation); on WASM, Scoped ≈ Singleton per tab</li>
                <li><strong>Mutating [Parameter] properties directly</strong> — parameters are owned by the parent; mutate local state instead and notify via EventCallback</li>
                <li><strong>Missing @key on lists</strong> — without @key, Blazor's diffing reuses DOM elements incorrectly when items are reordered/removed</li>
                <li><strong>Not handling pre-render null state</strong> — during Static SSR pre-render, async data is null on first render; always null-check</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            content: `<p>Key areas interviewers focus on for Blazor positions:</p>`,
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: '<ul><li><strong>Render mode trade-offs</strong> — can you explain when to use Server vs WASM vs Auto vs Static SSR? Reference latency, scalability, offline, and SEO.</li><li><strong>Component lifecycle mastery</strong> — describe the full sequence, know where to fetch data (OnInitializedAsync), where JS interop is safe (OnAfterRenderAsync), and how to handle parameter changes.</li><li><strong>State management across render modes</strong> — how does component state persist (or not) when switching from pre-render to interactive?</li><li><strong>Blazor vs React/Angular comparison</strong> — be ready to compare: C# vs JavaScript ecosystem, virtual DOM diffing, component model, bundle size, and tooling maturity.</li><li><strong>SignalR circuit awareness</strong> — on Server, know the connection limits (~5000 per server), reconnection UX, and what happens when the circuit drops.</li><li><strong>Performance patterns</strong> — mention Virtualize, @key, ShouldRender, lazy assembly loading, and AOT compilation.</li></ul>'
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>.NET 8 unified model</strong> — one project, mixed render modes per-component; no more separate Server/WASM projects</li>
                <li><strong>Render mode selection is architectural</strong> — choose based on latency needs, offline requirements, server resources, and SEO</li>
                <li><strong>Components are the unit of everything</strong> — UI, state, lifecycle, and render mode are all scoped to a component</li>
                <li><strong>Lifecycle order matters</strong> — OnInitialized → OnParametersSet → Render → OnAfterRender; async versions allow Task-based loading</li>
                <li><strong>@bind is syntactic sugar</strong> — it generates value + event handler; understand what it desugars to</li>
                <li><strong>DI scoping differs by hosting model</strong> — Scoped on Server = per-circuit; on WASM = per-app</li>
                <li><strong>Always implement IDisposable/IAsyncDisposable</strong> — for components with subscriptions, timers, JS references, or CancellationTokenSource</li>
                <li><strong>Pre-rendering requires null-safety</strong> — data fetched in OnInitializedAsync is null during the initial SSR pass</li>
            </ul>`
        }
    ],
    questions: [
        {
            question: 'Explain the four render modes in .NET 8 Blazor and when you would choose each one.',
            difficulty: 'medium',
            answer: `<p><strong>Static SSR</strong> — renders HTML on the server with no interactivity. Best for content pages, SEO, and fast initial paint. No SignalR, no WASM download.</p>
            <p><strong>Interactive Server</strong> — component logic runs on the server; UI updates flow via SignalR. Best when you need real-time interactivity, access to server resources, and fast startup without large downloads. Trade-off: every interaction requires a server round-trip, and scales with concurrent connections.</p>
            <p><strong>Interactive WebAssembly</strong> — .NET runtime and app assemblies download to browser; runs entirely client-side. Best for offline scenarios, reduced server load, and thick-client experiences. Trade-off: large initial download (~5-15MB), limited to browser sandbox (no direct DB access).</p>
            <p><strong>Interactive Auto</strong> — starts as Server (instant interactivity while WASM downloads in background), then transitions to WebAssembly on subsequent visits. Best of both worlds but most complex: components must work in both environments (no server-only dependencies).</p>`,
            interviewTip: 'Structure your answer as a trade-off matrix: startup time, ongoing latency, server resources, offline capability, and SEO. Mention that Auto mode requires components to be location-agnostic.',
            followUp: ['How does component state survive the Server-to-WASM handoff in Auto mode?', 'What happens to a Server-rendered component if the SignalR circuit drops?', 'Can you mix render modes within a single page?'],
            seniorPerspective: 'I default to Static SSR for all content pages and only opt into interactivity per-component where needed. Most pages in an enterprise app are 80% static content with small interactive islands. This approach minimizes server resources and gives the best Core Web Vitals scores.',
            architectPerspective: 'Render mode selection is a capacity planning decision. Interactive Server means every active tab holds a SignalR connection and server memory for component state. At 10,000 concurrent users, that is 10,000 persistent connections. I design around Static SSR with targeted interactive islands, and use Auto mode only for features that genuinely benefit from instant-start-then-offline (like a mobile-first dashboard).'
        },
        {
            question: 'Describe the Blazor component lifecycle. In what order do lifecycle methods fire, and where should you put data-fetching logic?',
            difficulty: 'medium',
            answer: `<p>The lifecycle sequence is:</p>
            <ol>
                <li><strong>SetParametersAsync</strong> — receives raw parameters from parent (rarely overridden)</li>
                <li><strong>OnInitialized / OnInitializedAsync</strong> — runs once when component first creates. Put initial data fetching here.</li>
                <li><strong>OnParametersSet / OnParametersSetAsync</strong> — runs after every parameter update (including the first). Use for re-fetching when route parameters change (e.g., /product/1 → /product/2).</li>
                <li><strong>BuildRenderTree</strong> — builds virtual DOM (implicit from .razor markup)</li>
                <li><strong>OnAfterRender / OnAfterRenderAsync</strong> — DOM is committed. Safe for JS interop. Check <code>firstRender</code> to avoid repeated setup.</li>
            </ol>
            <p><strong>StateHasChanged()</strong> triggers re-render manually (needed when state changes outside Blazor's event handling, like Timer callbacks). <strong>ShouldRender()</strong> returns false to skip unnecessary renders.</p>`,
            interviewTip: 'Key insight: OnInitializedAsync runs ONCE but OnParametersSetAsync runs on EVERY parameter change. Explain why you need both — same component, new route parameter means you must re-fetch but OnInitialized will not fire again.',
            followUp: ['What happens if OnInitializedAsync takes 3 seconds — does the user see a blank page?', 'When would you override ShouldRender?', 'How does streaming rendering change the lifecycle?'],
            seniorPerspective: 'The most common bug I see: developers put data-fetching in OnInitializedAsync but forget that navigating from /order/1 to /order/2 reuses the same component instance. OnInitialized does not fire again — you must also implement OnParametersSetAsync with a previous-ID check.',
            architectPerspective: 'I establish a base component class that standardizes lifecycle patterns: loading state management, cancellation token propagation, and error boundary integration. Every data-fetching component inherits this, ensuring consistent UX for loading and error states across the application.'
        },
        {
            question: 'How does two-way data binding work in Blazor? What does @bind desugar to?',
            difficulty: 'easy',
            answer: `<p><code>@bind</code> is syntactic sugar that generates a value property and an event handler. <code>&lt;input @bind="name" /&gt;</code> expands to <code>&lt;input value="@name" @onchange="(e) => name = e.Value" /&gt;</code>.</p>
            <p>By default, @bind fires on the <strong>change</strong> event (blur). Use <code>@bind:event="oninput"</code> for immediate updates on every keystroke. Use <code>@bind:format</code> for date/number formatting.</p>
            <p>For custom components, the convention is: <code>[Parameter] public T Value { get; set; }</code> paired with <code>[Parameter] public EventCallback&lt;T&gt; ValueChanged { get; set; }</code>. The parent then uses <code>@bind-Value</code>.</p>`,
            interviewTip: 'Show you understand the convention-based naming: @bind-X requires X and XChanged parameters. This is how all input components (InputText, InputNumber, etc.) work internally.',
            followUp: ['How would you implement debounced binding?', 'Can you bind to a nested property?', 'What is the difference between @bind and manual value/oninput?'],
            seniorPerspective: 'I rarely use @bind directly for complex scenarios. I prefer explicit value + event handler because it gives me a hook for validation, transformation, and analytics tracking before updating state. @bind is great for simple forms but hides control flow.',
            architectPerspective: 'Two-way binding is a convenience that works well for forms but can create implicit coupling in complex UIs. For larger applications, I prefer a unidirectional data flow where components receive state via parameters and emit intent via EventCallback, making state mutations traceable.'
        },
        {
            question: 'How does EditForm validation work in Blazor? How would you integrate FluentValidation?',
            difficulty: 'medium',
            answer: `<p><strong>EditForm</strong> creates an <strong>EditContext</strong> that tracks field state (modified, valid). The <code>DataAnnotationsValidator</code> component hooks into EditContext and validates using <code>[Required]</code>, <code>[StringLength]</code>, etc.</p>
            <p>Validation triggers on submit (<code>OnValidSubmit</code>/<code>OnInvalidSubmit</code>) and per-field (as user edits). <code>ValidationMessage</code> shows per-field errors; <code>ValidationSummary</code> shows all errors.</p>
            <p>For <strong>FluentValidation</strong>, use a community package like <code>Blazored.FluentValidation</code> which replaces <code>DataAnnotationsValidator</code> with <code>&lt;FluentValidationValidator /&gt;</code>. It resolves the validator from DI:</p>
            <pre><code>public class RegisterModelValidator : AbstractValidator&lt;RegisterModel&gt;
{
    public RegisterModelValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).MinimumLength(8)
            .Matches("[A-Z]").Matches("[0-9]");
    }
}</code></pre>`,
            interviewTip: 'Mention that EditForm in .NET 8 supports the FormName parameter for static SSR form posting — forms work even without interactivity. This shows you know the new enhanced form handling.',
            followUp: ['How do you do server-side validation that checks the database (e.g., unique email)?', 'How does form handling work in Static SSR mode?', 'What is the difference between OnValidSubmit and OnSubmit?'],
            seniorPerspective: 'I always implement validation at two layers: client-side with FluentValidation for UX, and server-side in the API layer for security. The Blazor validator is for user experience only — never trust it as your security boundary.',
            architectPerspective: 'I share validation rules between Blazor and API by placing FluentValidation validators in a shared library. The same validator runs in the browser (via WASM) for instant feedback and in the API for authoritative enforcement. This eliminates validation logic duplication.'
        },
        {
            question: 'Explain the difference between EventCallback and Action/Func delegates for component communication.',
            difficulty: 'medium',
            answer: `<p><strong>EventCallback</strong> is Blazor's preferred mechanism for child-to-parent communication. Unlike raw delegates (<code>Action</code>/<code>Func</code>), EventCallback:</p>
            <ul>
                <li>Automatically triggers <strong>StateHasChanged</strong> on the parent component after invocation (ensures re-render)</li>
                <li>Supports <strong>async</strong> operations transparently</li>
                <li>Handles <strong>null safety</strong> — calling an unassigned EventCallback is safe (no-op)</li>
                <li>Prevents unnecessary renders by tracking which component "owns" the callback</li>
            </ul>
            <p>If you use <code>[Parameter] public Action OnClick { get; set; }</code> instead, the parent will NOT re-render after the action executes — leading to stale UI bugs that are hard to diagnose.</p>`,
            interviewTip: 'The automatic StateHasChanged behavior is the key differentiator. Always explain WHY EventCallback exists (re-rendering) not just WHAT it does.',
            followUp: ['When would you use EventCallback<T> vs a simple EventCallback?', 'How do you avoid creating new delegate instances on every render?', 'Can EventCallback be used across render modes?'],
            seniorPerspective: 'The most subtle bug: using Action<T> as a parameter and then wondering why the parent UI never updates. I enforce EventCallback in code reviews — Action/Func parameters are a code smell in Blazor components unless explicitly needed for non-UI callbacks.',
            architectPerspective: 'EventCallback enforces a unidirectional data flow pattern where the child signals intent and the parent decides how to respond. This is architecturally cleaner than shared mutable state, but for complex event flows spanning many components, I layer in a mediator pattern or state container.'
        },
        {
            question: 'How does routing work in Blazor? Explain route parameters, constraints, and query strings.',
            difficulty: 'easy',
            answer: `<p>Blazor uses <code>@page</code> directives to define route templates. Components can have multiple @page directives. Route parameters map URL segments to component <code>[Parameter]</code> properties.</p>
            <p><strong>Constraints</strong> restrict matching: <code>{Id:int}</code>, <code>{Name:alpha}</code>, <code>{Date:datetime}</code>, <code>{Slug:regex(^[a-z]+$)}</code>. A catch-all parameter (<code>{*rest}</code>) captures remaining path segments.</p>
            <p><strong>Query strings</strong> (.NET 6+): use <code>[SupplyParameterFromQuery]</code> to bind query parameters directly to component properties. NavigationManager provides programmatic navigation with <code>NavigateTo()</code>.</p>
            <p><strong>NavLink</strong> renders anchor tags with automatic active CSS class management. <code>Match="NavLinkMatch.Prefix"</code> activates for any URL starting with the href.</p>`,
            interviewTip: 'Mention that .NET 8 enhanced navigation intercepts link clicks client-side and patches the DOM without full page reloads — similar to SPA routing but works with Static SSR.',
            followUp: ['How do you handle 404/not-found routes?', 'What is the difference between NavigateTo with and without forceLoad?', 'How does enhanced navigation in .NET 8 work?'],
            seniorPerspective: 'I use route constraints to prevent components from receiving garbage parameters. Without constraints, /product/abc would match a {ProductId:int} route and cause a runtime error. Constraints make routing fail gracefully to a 404 instead.',
            architectPerspective: 'For large apps, I organize routes by feature module and use layout nesting to control shared chrome. The key architectural decision is whether pages are top-level routes or nested components — this affects state lifetime, since route changes destroy and recreate components.'
        },
        {
            question: 'What are CascadingValue and CascadingParameter? When should you use them vs dependency injection?',
            difficulty: 'medium',
            answer: `<p><strong>CascadingValue</strong> provides implicit data to all descendant components without explicitly passing it through every intermediate component. <strong>CascadingParameter</strong> receives the value in any descendant.</p>
            <p>Use cases: theme data, current user info, layout configuration, or any cross-cutting concern that many components need but passing via [Parameter] through 5+ levels would be verbose.</p>
            <p><strong>CascadingValue vs DI:</strong></p>
            <ul>
                <li>Use <strong>CascadingValue</strong> when the data is UI-contextual and may change per render subtree (e.g., a form's EditContext, a theme that varies by section)</li>
                <li>Use <strong>DI services</strong> when the data is application-wide or infrastructure (e.g., HttpClient, AuthenticationState, business services)</li>
            </ul>
            <p>CascadingValues trigger re-render on change by default; use <code>IsFixed="true"</code> for values that never change to avoid unnecessary diffing.</p>`,
            interviewTip: 'The follow-up question is usually about performance — mention IsFixed="true" for static values and note that cascading re-renders the entire subtree when the value changes.',
            followUp: ['What is the performance impact of CascadingValue?', 'Can you have multiple CascadingValues of the same type?', 'How does CascadingAuthenticationState work under the hood?'],
            seniorPerspective: 'I use CascadingValue sparingly — it is implicit coupling. When a component reads a CascadingParameter, it is not obvious from its API what it depends on. I prefer explicit [Parameter] for anything that is not truly ambient (auth state, theme, culture).',
            architectPerspective: 'CascadingValue is Blazor\'s equivalent of React Context. Like Context, overuse creates hidden dependencies that make components hard to test and reason about. I reserve it for genuine cross-cutting concerns and expose everything else via explicit parameters or DI-registered state containers.'
        },
        {
            question: 'How does dependency injection scoping differ between Blazor Server and Blazor WebAssembly?',
            difficulty: 'hard',
            answer: `<p>The DI container in both models supports Transient, Scoped, and Singleton. The behavioral difference is in <strong>Scoped</strong>:</p>
            <ul>
                <li><strong>Blazor Server</strong>: Scoped = per SignalR circuit (one per browser tab). It lives as long as the connection is open. Multiple tabs = multiple scopes. Circuit death = scope disposal.</li>
                <li><strong>Blazor WebAssembly</strong>: Scoped ≈ Singleton in practice. There is only one DI scope per browser tab (the app itself). Opening another tab creates a completely separate app instance.</li>
            </ul>
            <p><strong>Singleton on Server</strong> is shared across ALL users — a common source of threading bugs. Never store user-specific state in a Singleton on Server.</p>
            <p><strong>Transient on both</strong> — new instance every injection. Be careful with IDisposable transients: Blazor disposes scoped services but transients resolved from the scope container also get disposed when the scope ends.</p>`,
            interviewTip: 'The gotcha interviewers love: "what happens if you register a DbContext as Singleton on Blazor Server?" — it gets shared across all users, causing concurrency exceptions. Always use Scoped for per-user services.',
            followUp: ['How do you handle DbContext lifetime in Blazor Server?', 'What is IDbContextFactory and why does Blazor need it?', 'How do keyed services (.NET 8) change the DI landscape?'],
            seniorPerspective: 'I use IDbContextFactory<T> in Blazor Server rather than injecting DbContext directly. A Scoped DbContext lives as long as the circuit (potentially hours), causing stale data and memory bloat. The factory creates short-lived contexts per operation, matching the unit-of-work pattern.',
            architectPerspective: 'DI scoping is a deployment topology concern. I design services to be scope-agnostic by keeping them stateless where possible. When stateful services are necessary (caches, user context), I use explicit lifetime management with OwningComponentBase to create nested scopes per component, giving me EF Core-style short-lived contexts within long-lived circuits.'
        },
        {
            question: 'Compare Blazor to React and Angular. When would you choose Blazor over a JavaScript SPA framework?',
            difficulty: 'hard',
            answer: `<p><strong>Choose Blazor when:</strong></p>
            <ul>
                <li>Your team is strong in C#/.NET and weak in JavaScript/TypeScript</li>
                <li>You want to share models, validation, and business logic between client and server (same language)</li>
                <li>You need tight integration with the .NET ecosystem (EF Core, Identity, SignalR)</li>
                <li>Your app benefits from Server-side rendering with islands of interactivity (.NET 8 model)</li>
            </ul>
            <p><strong>Choose React/Angular when:</strong></p>
            <ul>
                <li>You need a mature ecosystem of UI component libraries and community packages</li>
                <li>Bundle size is critical (React: ~40KB gzipped vs Blazor WASM: ~5-15MB initial)</li>
                <li>You need advanced client-side capabilities (complex animations, canvas, heavy DOM manipulation)</li>
                <li>You are hiring from a talent pool that is JavaScript-first</li>
            </ul>
            <p><strong>Key architectural differences:</strong> Blazor uses a virtual DOM diff similar to React but over a SignalR circuit (Server) or local WASM runtime. Angular uses Zone.js for change detection; Blazor uses explicit StateHasChanged. React hooks ≈ Blazor lifecycle methods.</p>`,
            interviewTip: 'Never trash the other framework — show you understand trade-offs. The winning answer acknowledges Blazor WASM download size as a real limitation and positions Blazor Server/Auto as the mitigation.',
            followUp: ['How does Blazor WASM bundle size compare after AOT compilation?', 'Can Blazor and React coexist in the same app?', 'What is the Blazor equivalent of React hooks?'],
            seniorPerspective: 'I choose based on team composition and existing infrastructure. A .NET shop with five C# developers and zero JS expertise will ship faster with Blazor than trying to adopt React. Conversely, a team already running Next.js in production gains nothing from introducing Blazor.',
            architectPerspective: 'The architecture decision is less about framework features and more about organizational topology. Blazor unifies the full stack under one language and toolchain, reducing cognitive load and deployment complexity. But it also creates tighter coupling between frontend and backend — microservices with independent frontend deployments favor React/Angular with separate CI/CD pipelines.'
        },
        {
            question: 'How do you handle the "pre-render then interactive" problem in .NET 8 Blazor?',
            difficulty: 'hard',
            answer: `<p>In .NET 8, components using Interactive Server or Auto mode are <strong>pre-rendered by default</strong> (Static SSR on first request for fast initial paint). This causes a specific problem: <code>OnInitializedAsync</code> runs <strong>twice</strong> — once during pre-render (server-side, no circuit) and again when the component becomes interactive.</p>
            <p><strong>Problems this causes:</strong></p>
            <ul>
                <li>Data fetched twice (duplicate API/DB calls)</li>
                <li>State from pre-render is lost when interactive mode activates</li>
                <li>JS interop fails during pre-render (no browser DOM yet)</li>
            </ul>
            <p><strong>Solutions:</strong></p>
            <ul>
                <li><code>@rendermode="new InteractiveServerRenderMode(prerender: false)"</code> — disable pre-render for that component</li>
                <li><strong>PersistentComponentState</strong> — serialize state during pre-render, deserialize when interactive mode activates (avoids double-fetch)</li>
                <li>Guard JS interop: <code>if (firstRender)</code> in OnAfterRenderAsync</li>
            </ul>`,
            interviewTip: 'This is a .NET 8-specific question that separates candidates who have actually built with the new model from those reading docs. Mention PersistentComponentState by name — it shows real experience.',
            followUp: ['How does PersistentComponentState work under the hood?', 'What is streaming rendering and how does it differ from pre-rendering?', 'How do you handle authentication during pre-render?'],
            seniorPerspective: 'I wrap data-fetching in a service that checks PersistentComponentState first: if state was persisted from pre-render, use it and skip the API call. This gives us SEO-friendly pre-render without the performance cost of double-fetching. I also use a base component that handles this pattern consistently.',
            architectPerspective: 'Pre-rendering is an architectural trade-off between initial load performance (TTFB) and implementation complexity. For internal enterprise apps, I typically disable pre-render — the SEO benefit is irrelevant and the double-execution complexity is not worth it. For public-facing apps where Core Web Vitals matter, I invest in PersistentComponentState with a shared infrastructure layer.'
        },
        {
            question: 'What is StateHasChanged and when do you need to call it manually?',
            difficulty: 'easy',
            answer: `<p><strong>StateHasChanged()</strong> notifies Blazor that the component's state has changed and it should re-render. Blazor calls it automatically after:</p>
            <ul>
                <li>Event handlers (@onclick, @onchange, etc.)</li>
                <li>EventCallback invocations</li>
                <li>Lifecycle methods completing</li>
            </ul>
            <p><strong>You must call it manually when</strong> state changes outside Blazor's awareness:</p>
            <ul>
                <li>Timer callbacks (<code>System.Timers.Timer.Elapsed</code>)</li>
                <li>External event subscriptions (e.g., a service raising an event)</li>
                <li>Task continuations that are not directly awaited in a lifecycle method</li>
            </ul>
            <p><strong>Critical rule:</strong> If calling from a non-Blazor thread (Timer, external event), you must use <code>await InvokeAsync(StateHasChanged)</code> to marshal back to the synchronization context. Direct calls from background threads cause race conditions.</p>`,
            interviewTip: 'Explain the threading angle — InvokeAsync is the Blazor equivalent of WPF Dispatcher.Invoke. It shows you understand the single-threaded render model.',
            followUp: ['What happens if you call StateHasChanged in an infinite loop?', 'How does StateHasChanged interact with ShouldRender?', 'Why does EventCallback auto-trigger StateHasChanged but Action does not?'],
            seniorPerspective: 'I see teams sprinkling StateHasChanged everywhere as a "fix" for UI not updating. The real fix is usually: use EventCallback instead of Action, or await your async operations instead of fire-and-forget. Needing manual StateHasChanged is a code smell except for Timer/external event scenarios.',
            architectPerspective: 'Excessive manual StateHasChanged calls indicate a design problem — likely shared mutable state being modified from multiple sources. I refactor toward a reactive state container where components subscribe to state changes and re-render automatically, eliminating manual triggers.'
        }
    ]
});
