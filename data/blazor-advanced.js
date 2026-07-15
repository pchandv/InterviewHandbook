/* ═══════════════════════════════════════════════════════════════════
   Blazor Advanced — State, JS Interop, Auth, Performance & Testing
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('blazor-advanced', {
    title: 'Blazor Advanced',
    description: 'Advanced patterns for production Blazor applications — state management strategies, JavaScript interop, authentication & authorization, error handling, performance optimization, SignalR integration, pre-rendering & SEO, and component testing with bUnit.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>Production Blazor applications require mastery beyond component basics. This covers the patterns that separate prototype-quality Blazor from production-grade systems:</p>
            <ul>
                <li><strong>State Management</strong> — from component state to Fluxor/Redux patterns and persistence</li>
                <li><strong>JavaScript Interop</strong> — calling JS from C# and C# from JS safely</li>
                <li><strong>Authentication</strong> — AuthenticationStateProvider, role/policy auth, token management</li>
                <li><strong>Error Boundaries</strong> — graceful failure handling per-component</li>
                <li><strong>Performance</strong> — virtualization, diffing optimization, lazy loading, AOT</li>
                <li><strong>SignalR</strong> — how Blazor Server works under the hood, custom hubs, scaling</li>
                <li><strong>SEO & Pre-rendering</strong> — streaming rendering, enhanced navigation</li>
                <li><strong>Testing</strong> — bUnit for component testing, mocking, and assertions</li>
            </ul>`
        },
        {
            title: 'Core Concepts — State Management',
            content: `<p>Blazor offers multiple state management approaches, from simple component state to full Redux patterns. The choice depends on app complexity and state sharing requirements.</p>
            <ul>
                <li><strong>Component state</strong> — private fields/properties, re-rendered via StateHasChanged</li>
                <li><strong>Cascading state</strong> — CascadingValue for ambient context (theme, auth)</li>
                <li><strong>Service-based state</strong> — Scoped DI service shared between components</li>
                <li><strong>Fluxor (Redux pattern)</strong> — centralized store with actions, reducers, and effects</li>
                <li><strong>Browser storage</strong> — localStorage/sessionStorage via JS interop for persistence</li>
            </ul>`,
            code: `// Pattern 1: Scoped State Service (simplest shared state)
public class CartState
{
    private readonly List<CartItem> _items = new();
    public IReadOnlyList<CartItem> Items => _items.AsReadOnly();
    public decimal Total => _items.Sum(i => i.Price * i.Quantity);

    public event Action? OnChange;

    public void AddItem(CartItem item)
    {
        _items.Add(item);
        OnChange?.Invoke();
    }

    public void Clear()
    {
        _items.Clear();
        OnChange?.Invoke();
    }
}

// Registration: builder.Services.AddScoped<CartState>();

// Component consuming state:
@inject CartState Cart
@implements IDisposable

<p>Items: @Cart.Items.Count — Total: @Cart.Total.ToString("C")</p>

@code {
    protected override void OnInitialized() => Cart.OnChange += StateHasChanged;
    public void Dispose() => Cart.OnChange -= StateHasChanged;
}

// Pattern 2: Fluxor (Redux for Blazor)
// State:
[FeatureState]
public record CartState(ImmutableList<CartItem> Items, bool IsLoading)
{
    public CartState() : this(ImmutableList<CartItem>.Empty, false) { }
    public decimal Total => Items.Sum(i => i.Price * i.Quantity);
}

// Actions:
public record AddToCartAction(CartItem Item);
public record ClearCartAction();
public record LoadCartAction();
public record CartLoadedAction(ImmutableList<CartItem> Items);

// Reducer:
public static class CartReducers
{
    [ReducerMethod]
    public static CartState OnAddToCart(CartState state, AddToCartAction action)
        => state with { Items = state.Items.Add(action.Item) };

    [ReducerMethod]
    public static CartState OnClear(CartState state, ClearCartAction _)
        => state with { Items = ImmutableList<CartItem>.Empty };
}

// Effect (side effects / async):
public class CartEffects
{
    private readonly ICartApi _api;
    public CartEffects(ICartApi api) => _api = api;

    [EffectMethod]
    public async Task HandleLoadCart(LoadCartAction action, IDispatcher dispatcher)
    {
        var items = await _api.GetCartAsync();
        dispatcher.Dispatch(new CartLoadedAction(items));
    }
}`,
            language: 'csharp'
        },
        {
            title: 'State Management Patterns',
            content: `<p>Choosing the right state management pattern depends on how many components share state and how complex the state transitions are.</p>`,
            mermaid: `flowchart TB
    subgraph Simple["Simple (1-3 components)"]
        CS["Component State<br/>private fields"]
        CS --> Bind["@bind / EventCallback<br/>parent ↔ child"]
    end
    subgraph Medium["Medium (feature-wide)"]
        SVC["Scoped State Service<br/>+ event OnChange"]
        SVC --> CASC["CascadingValue<br/>for ambient context"]
    end
    subgraph Complex["Complex (app-wide)"]
        FLUX["Fluxor / Redux<br/>Actions → Reducers → State"]
        FLUX --> EFF["Effects<br/>(async side effects)"]
        FLUX --> DEV["DevTools<br/>(time-travel debug)"]
    end
    subgraph Persistence["Cross-Session Persistence"]
        LS["localStorage<br/>(JS Interop)"]
        SS["sessionStorage<br/>(tab-scoped)"]
        PCS["PersistentComponentState<br/>(pre-render → interactive)"]
    end
    Simple --> Medium
    Medium --> Complex
    Complex --> Persistence`
        },
        {
            title: 'JavaScript Interop',
            content: `<p>Blazor provides <strong>IJSRuntime</strong> for calling JavaScript from C# and <strong>DotNetObjectReference</strong> for calling C# from JavaScript. Module isolation (<code>import()</code>) keeps JS scoped and tree-shakeable.</p>`,
            code: `// Calling JS from C# — basic
@inject IJSRuntime JS

@code {
    private async Task ShowAlert()
    {
        await JS.InvokeVoidAsync("alert", "Hello from Blazor!");
    }

    private async Task<string> GetLocalStorage(string key)
    {
        return await JS.InvokeAsync<string>("localStorage.getItem", key);
    }

    private async Task SetLocalStorage(string key, string value)
    {
        await JS.InvokeVoidAsync("localStorage.setItem", key, value);
    }
}

// Module isolation (recommended pattern):
// wwwroot/js/chart-interop.js
export function initChart(elementId, data) {
    const ctx = document.getElementById(elementId);
    return new Chart(ctx, { type: 'line', data });
}
export function updateChart(chartInstance, newData) {
    chartInstance.data = newData;
    chartInstance.update();
}
export function destroyChart(chartInstance) {
    chartInstance.destroy();
}

// C# component using module:
@implements IAsyncDisposable

@code {
    private IJSObjectReference? module;
    private IJSObjectReference? chartInstance;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            module = await JS.InvokeAsync<IJSObjectReference>(
                "import", "./js/chart-interop.js");
            chartInstance = await module.InvokeAsync<IJSObjectReference>(
                "initChart", "myCanvas", chartData);
        }
    }

    private async Task Refresh(object[] newData)
    {
        if (module is not null && chartInstance is not null)
            await module.InvokeVoidAsync("updateChart", chartInstance, newData);
    }

    public async ValueTask DisposeAsync()
    {
        if (chartInstance is not null)
            await module!.InvokeVoidAsync("destroyChart", chartInstance);
        if (module is not null)
            await module.DisposeAsync();
    }
}

// Calling C# from JS (DotNetObjectReference):
@implements IDisposable

@code {
    private DotNetObjectReference<MyComponent>? objRef;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            objRef = DotNetObjectReference.Create(this);
            await JS.InvokeVoidAsync("registerCallback", objRef);
        }
    }

    [JSInvokable]
    public async Task OnJsEvent(string data)
    {
        message = data;
        StateHasChanged(); // Already on Blazor context via IJSRuntime
    }

    public void Dispose() => objRef?.Dispose();
}

// JS side:
function registerCallback(dotNetObj) {
    window.addEventListener('resize', () => {
        dotNetObj.invokeMethodAsync('OnJsEvent', window.innerWidth.toString());
    });
}`,
            language: 'csharp'
        },
        {
            title: 'Authentication & Authorization',
            content: `<p>Blazor uses <strong>AuthenticationStateProvider</strong> as the abstraction for auth state. <strong>AuthorizeView</strong> controls UI visibility; <strong>[Authorize]</strong> attribute protects routes. Auth behaves differently in Server (session-based via circuit) vs WASM (token-based).</p>`,
            code: `// AuthorizeView — conditional rendering based on auth state
<AuthorizeView>
    <Authorized>
        <p>Hello, @context.User.Identity?.Name!</p>
        <NavLink href="/dashboard">Dashboard</NavLink>
    </Authorized>
    <NotAuthorized>
        <p>Please <a href="/login">log in</a>.</p>
    </NotAuthorized>
    <Authorizing>
        <p>Checking authentication...</p>
    </Authorizing>
</AuthorizeView>

// Role-based:
<AuthorizeView Roles="Admin,Manager">
    <Authorized><AdminPanel /></Authorized>
</AuthorizeView>

// Policy-based:
<AuthorizeView Policy="CanEditOrders">
    <button @onclick="EditOrder">Edit</button>
</AuthorizeView>

// Route-level protection:
@page "/admin"
@attribute [Authorize(Roles = "Admin")]
<h1>Admin Panel</h1>

// Custom AuthenticationStateProvider for WASM + JWT:
public class JwtAuthStateProvider : AuthenticationStateProvider
{
    private readonly ILocalStorageService _storage;
    private readonly HttpClient _http;

    public override async Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        var token = await _storage.GetItemAsync<string>("authToken");
        if (string.IsNullOrEmpty(token))
            return new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity()));

        // Validate token expiry
        var claims = ParseClaimsFromJwt(token);
        var expiry = claims.FirstOrDefault(c => c.Type == "exp");
        if (DateTimeOffset.FromUnixTimeSeconds(long.Parse(expiry!.Value)) < DateTimeOffset.UtcNow)
        {
            await _storage.RemoveItemAsync("authToken");
            return new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity()));
        }

        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var identity = new ClaimsIdentity(claims, "jwt");
        return new AuthenticationState(new ClaimsPrincipal(identity));
    }

    public void NotifyLogin(string token)
    {
        var claims = ParseClaimsFromJwt(token);
        var identity = new ClaimsIdentity(claims, "jwt");
        var state = Task.FromResult(new AuthenticationState(new ClaimsPrincipal(identity)));
        NotifyAuthenticationStateChanged(state);
    }

    public void NotifyLogout()
    {
        var state = Task.FromResult(new AuthenticationState(
            new ClaimsPrincipal(new ClaimsIdentity())));
        NotifyAuthenticationStateChanged(state);
    }
}

// Registration:
builder.Services.AddAuthorizationCore(options =>
{
    options.AddPolicy("CanEditOrders", policy =>
        policy.RequireClaim("permission", "orders:write"));
});
builder.Services.AddScoped<AuthenticationStateProvider, JwtAuthStateProvider>();`,
            language: 'csharp'
        },
        {
            title: 'Error Handling & ErrorBoundary',
            content: `<p>Blazor provides <strong>ErrorBoundary</strong> for catching unhandled exceptions per-component subtree. Without error boundaries, an unhandled exception crashes the entire circuit (Server) or app (WASM).</p>`,
            code: `// ErrorBoundary wraps child content — catches exceptions in lifecycle/rendering
<ErrorBoundary @ref="errorBoundary">
    <ChildContent>
        <RiskyComponent />
    </ChildContent>
    <ErrorContent Context="exception">
        <div class="alert alert-danger">
            <h4>Something went wrong</h4>
            <p>@exception.Message</p>
            <button @onclick="Recover">Try Again</button>
        </div>
    </ErrorContent>
</ErrorBoundary>

@code {
    private ErrorBoundary? errorBoundary;

    private void Recover() => errorBoundary?.Recover(); // Re-renders ChildContent
}

// Global error handling in App.razor:
<CascadingAuthenticationState>
    <ErrorBoundary>
        <ChildContent>
            <Router AppAssembly="@typeof(App).Assembly">
                <Found Context="routeData">
                    <RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)" />
                </Found>
                <NotFound>
                    <PageNotFound />
                </NotFound>
            </Router>
        </ChildContent>
        <ErrorContent>
            <GlobalErrorPage />
        </ErrorContent>
    </ErrorBoundary>
</CascadingAuthenticationState>

// Circuit disconnection handling (Blazor Server):
// In _Host.cshtml or App.razor:
<div id="reconnect-modal" class="components-reconnect-modal">
    <div class="show">Reconnecting to server...</div>
    <div class="failed">Connection lost. <a href="/">Reload</a></div>
    <div class="rejected">Reload required. <a href="/">Reload</a></div>
</div>

// Programmatic reconnection:
// blazor.server.js configures: Blazor.start({ circuit: { reconnectionOptions: {
//   maxRetries: 5, retryIntervalMilliseconds: 2000 } } });

// Global exception logging (both Server and WASM):
public class GlobalExceptionHandler : ILogger
{
    public void Log<TState>(LogLevel level, EventId id, TState state, Exception? ex, ...)
    {
        if (ex is not null && level >= LogLevel.Error)
        {
            // Send to Serilog, Application Insights, etc.
        }
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Performance Optimization',
            content: `<p>Blazor performance optimization spans rendering efficiency, payload optimization, and runtime execution. Key techniques include virtualization, diff optimization, lazy loading, and AOT compilation.</p>`,
            code: `// Virtualize — only renders visible items (essential for large lists)
<Virtualize Items="@allProducts" Context="product" ItemSize="50">
    <ItemContent>
        <div class="product-row">@product.Name — @product.Price.ToString("C")</div>
    </ItemContent>
    <Placeholder>
        <div class="skeleton-row">Loading...</div>
    </Placeholder>
</Virtualize>

// Virtualize with async item provider (server-side pagination):
<Virtualize ItemsProvider="LoadProducts" Context="product">
    <ItemContent>
        <ProductCard Product="@product" />
    </ItemContent>
</Virtualize>

@code {
    private async ValueTask<ItemsProviderResult<ProductDto>> LoadProducts(
        ItemsProviderRequest request)
    {
        var result = await ProductApi.GetPageAsync(
            request.StartIndex, request.Count, request.CancellationToken);
        return new ItemsProviderResult<ProductDto>(result.Items, result.TotalCount);
    }
}

// @key for stable diffing (prevents DOM reuse bugs):
@foreach (var item in items)
{
    <OrderRow @key="item.Id" Order="@item" />
    @* Without @key: reordering items reuses DOM elements incorrectly *@
}

// ShouldRender — skip unnecessary re-renders:
@code {
    private string? previousData;

    protected override bool ShouldRender()
    {
        var shouldRender = Data != previousData;
        previousData = Data;
        return shouldRender; // Only re-render if data actually changed
    }
}

// Lazy loading assemblies (WASM) — reduce initial download:
// In .csproj:
// <BlazorWebAssemblyLazyLoad Include="HeavyReporting.wasm" />

// Router configuration:
<Router AppAssembly="@typeof(App).Assembly"
        AdditionalAssemblies="@lazyLoadedAssemblies"
        OnNavigateAsync="OnNavigateAsync">
    ...
</Router>

@code {
    private List<Assembly> lazyLoadedAssemblies = new();

    private async Task OnNavigateAsync(NavigationContext context)
    {
        if (context.Path == "reports")
        {
            var assemblies = await LazyAssemblyLoader
                .LoadAssembliesAsync(new[] { "HeavyReporting.wasm" });
            lazyLoadedAssemblies.AddRange(assemblies);
        }
    }
}

// AOT Compilation (.NET 8 WASM) — trades build time for runtime performance:
// <RunAOTCompilation>true</RunAOTCompilation>
// Result: 2-5x faster execution, but 3-5x larger download + 10x build time
// Use for: computation-heavy apps (data grids, charting, crypto)
// Skip for: simple CRUD apps (download size matters more)`,
            language: 'csharp'
        },
        {
            title: 'Blazor Server vs WebAssembly Architecture',
            content: `<p>Understanding the fundamental architecture differences between Blazor Server and WebAssembly is crucial for making correct deployment and scaling decisions.</p>`,
            mermaid: `flowchart TB
    subgraph BlazorServer["Blazor Server Architecture"]
        direction TB
        Browser1["Browser<br/>(thin client)"]
        SR["SignalR Circuit<br/>(WebSocket)"]
        ServerProc["ASP.NET Server<br/>.NET Runtime<br/>Component State in Memory<br/>DOM Diff Engine"]
        DB1["Database / APIs"]
        Browser1 <-->|"UI events ↑<br/>DOM diffs ↓"| SR
        SR <--> ServerProc
        ServerProc --> DB1
    end
    subgraph BlazorWASM["Blazor WebAssembly Architecture"]
        direction TB
        Browser2["Browser<br/>(thick client)<br/>.NET WASM Runtime<br/>Component State<br/>DOM Diff Engine"]
        API["REST API<br/>(separate host)"]
        DB2["Database"]
        Browser2 <-->|"HTTP/gRPC calls"| API
        API --> DB2
    end
    subgraph Scaling["Scaling Considerations"]
        S1["Server: ~5000 circuits per server<br/>Sticky sessions required<br/>Redis backplane for multi-server"]
        S2["WASM: Unlimited clients<br/>Only API servers need scaling<br/>CDN for static assets"]
    end`
        },
        {
            title: 'SignalR Integration & Scaling',
            content: `<p>Blazor Server uses SignalR under the hood for all UI communication. Understanding the circuit model is essential for production deployments — especially around reconnection, scaling with sticky sessions, and custom hub integration.</p>`,
            code: `// How Blazor Server uses SignalR (internal circuit):
// - Each browser tab = 1 SignalR connection = 1 "circuit"
// - Circuit holds: component tree state, DI scope, render queue
// - UI event → sent to server via SignalR → processed → DOM diff sent back
// - Circuit timeout: ~3 minutes of disconnection before disposal

// Custom SignalR hub alongside Blazor (same server):
public class NotificationHub : Hub
{
    public async Task JoinGroup(string group)
        => await Groups.AddToGroupAsync(Context.ConnectionId, group);
}

// Component connecting to custom hub:
@inject NavigationManager Nav
@implements IAsyncDisposable

@code {
    private HubConnection? hubConnection;

    protected override async Task OnInitializedAsync()
    {
        hubConnection = new HubConnectionBuilder()
            .WithUrl(Nav.ToAbsoluteUri("/hubs/notifications"))
            .WithAutomaticReconnect(new[] { TimeSpan.FromSeconds(1),
                TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(10) })
            .Build();

        hubConnection.On<string>("ReceiveNotification", (message) =>
        {
            notifications.Add(message);
            InvokeAsync(StateHasChanged); // Must marshal to Blazor context
        });

        hubConnection.Reconnecting += _ =>
        {
            isReconnecting = true;
            InvokeAsync(StateHasChanged);
            return Task.CompletedTask;
        };

        hubConnection.Reconnected += _ =>
        {
            isReconnecting = false;
            InvokeAsync(StateHasChanged);
            return Task.CompletedTask;
        };

        await hubConnection.StartAsync();
    }

    public async ValueTask DisposeAsync()
    {
        if (hubConnection is not null)
            await hubConnection.DisposeAsync();
    }
}

// Scaling Blazor Server (production):
// 1. Sticky sessions (required — circuit state is in-memory):
//    Azure: ARR Affinity, AWS: ALB stickiness, Nginx: ip_hash
//
// 2. Redis backplane for SignalR (if using custom hubs across servers):
builder.Services.AddSignalR()
    .AddStackExchangeRedis(config["Redis:Connection"]!);

// 3. Circuit options:
builder.Services.AddServerSideBlazor(options =>
{
    options.DisconnectedCircuitRetentionPeriod = TimeSpan.FromMinutes(3);
    options.DisconnectedCircuitMaxRetained = 100;
    options.MaxBufferedUnacknowledgedRenderBatches = 10;
    options.JSInteropDefaultCallTimeout = TimeSpan.FromSeconds(30);
});

// 4. Monitor circuit count:
// Use ICircuitHandler to track active circuits for metrics/alerting
public class CircuitTracker : CircuitHandler
{
    private static int _count;
    public static int ActiveCircuits => _count;

    public override Task OnCircuitOpenedAsync(Circuit circuit, CancellationToken ct)
    { Interlocked.Increment(ref _count); return Task.CompletedTask; }

    public override Task OnCircuitClosedAsync(Circuit circuit, CancellationToken ct)
    { Interlocked.Decrement(ref _count); return Task.CompletedTask; }
}`,
            language: 'csharp'
        },
        {
            title: 'Pre-rendering, Streaming & SEO',
            content: `<p>.NET 8 introduces <strong>streaming rendering</strong> and <strong>enhanced navigation</strong> for optimal loading UX. Static SSR provides SEO while interactive modes add functionality.</p>`,
            code: `// Streaming rendering — send initial HTML immediately, fill in async data later:
@page "/products"
@attribute [StreamRendering(true)]

<h1>Products</h1>

@if (products is null)
{
    <p>Loading products...</p>  @* Sent immediately via SSR *@
}
else
{
    @foreach (var p in products)
    {
        <ProductCard Product="@p" />  @* Streamed in when data arrives *@
    }
}

@code {
    private List<Product>? products;

    protected override async Task OnInitializedAsync()
    {
        // This runs async — initial null state streams first,
        // then complete HTML streams when data loads
        products = await ProductService.GetAllAsync();
    }
}

// Enhanced navigation (.NET 8) — SPA-like routing for static SSR:
// Automatically intercepts link clicks, fetches new page via fetch(),
// patches DOM without full reload. Works without any interactive mode!
// Opt out per-link: <a href="/external" data-enhance-nav="false">

// Enhanced form handling (static SSR forms submit without interactivity):
<EditForm Model="@model" OnValidSubmit="Submit" FormName="contact" Enhance>
    <InputText @bind-Value="model.Name" />
    <button type="submit">Send</button>
</EditForm>

// PersistentComponentState — survive pre-render → interactive transition:
@inject PersistentComponentState PersistState

@code {
    private List<Product>? products;
    private PersistingComponentStateSubscription subscription;

    protected override async Task OnInitializedAsync()
    {
        subscription = PersistState.RegisterOnPersisting(PersistData);

        // Try to restore from pre-render first (avoids double-fetch):
        if (!PersistState.TryTakeFromJson<List<Product>>("products", out var restored))
        {
            products = await ProductService.GetAllAsync(); // Only fetches if not pre-rendered
        }
        else
        {
            products = restored;
        }
    }

    private Task PersistData()
    {
        PersistState.PersistAsJson("products", products);
        return Task.CompletedTask;
    }

    public void Dispose() => subscription.Dispose();
}

// SEO: Use Static SSR for public pages, add <HeadContent> for meta tags:
@page "/product/{Id:int}"
<PageTitle>@product?.Name - My Store</PageTitle>
<HeadContent>
    <meta name="description" content="@product?.Description" />
    <meta property="og:title" content="@product?.Name" />
</HeadContent>`,
            language: 'csharp'
        },
        {
            title: 'Component Testing with bUnit',
            content: `<p><strong>bUnit</strong> is the standard testing library for Blazor components. It renders components in a test host, provides DOM assertions, and supports mocking services, cascading parameters, and event simulation.</p>`,
            code: `// Basic bUnit test (xUnit):
public class CounterTests : TestContext
{
    [Fact]
    public void Counter_Increments_OnClick()
    {
        // Arrange — render the component
        var cut = RenderComponent<Counter>();

        // Act — find button and click
        cut.Find("button").Click();

        // Assert — check rendered output
        cut.Find("p").MarkupMatches("<p>Current count: 1</p>");
    }

    [Fact]
    public void Counter_Starts_At_Zero()
    {
        var cut = RenderComponent<Counter>();
        cut.Find("p").TextContent.Should().Contain("0");
    }
}

// Testing with parameters:
[Fact]
public void ProductCard_Displays_Product_Info()
{
    var product = new ProductDto { Name = "Widget", Price = 9.99m };

    var cut = RenderComponent<ProductCard>(parameters => parameters
        .Add(p => p.Product, product)
        .Add(p => p.ShowDetails, true));

    cut.Find(".product-name").TextContent.Should().Be("Widget");
    cut.Find(".product-price").TextContent.Should().Contain("$9.99");
}

// Mocking injected services:
[Fact]
public async Task OrderList_Loads_Orders_OnInit()
{
    var mockService = new Mock<IOrderService>();
    mockService.Setup(s => s.GetOrdersAsync())
        .ReturnsAsync(new List<OrderDto>
        {
            new() { Id = 1, Total = 50m },
            new() { Id = 2, Total = 75m }
        });

    Services.AddSingleton(mockService.Object);

    var cut = RenderComponent<OrderList>();

    // Wait for async initialization:
    cut.WaitForState(() => cut.FindAll(".order-row").Count == 2);

    cut.FindAll(".order-row").Should().HaveCount(2);
    mockService.Verify(s => s.GetOrdersAsync(), Times.Once);
}

// Testing EventCallback:
[Fact]
public void DeleteButton_Fires_OnDelete_EventCallback()
{
    var deletedId = 0;
    var cut = RenderComponent<DeleteButton>(parameters => parameters
        .Add(p => p.ItemId, 42)
        .Add(p => p.OnDelete, EventCallback.Factory.Create<int>(this, id => deletedId = id)));

    cut.Find("button.delete").Click();

    deletedId.Should().Be(42);
}

// Testing with CascadingValue (auth state):
[Fact]
public void AdminPanel_Shows_Only_For_Admin()
{
    var authState = Task.FromResult(new AuthenticationState(
        new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, "Admin")
        }, "test"))));

    Services.AddSingleton<AuthenticationStateProvider>(
        new FakeAuthStateProvider(authState));
    Services.AddAuthorizationCore();

    var cut = RenderComponent<AdminPanel>(parameters => parameters
        .AddCascadingValue(authState));

    cut.Find(".admin-content").Should().NotBeNull();
}`,
            language: 'csharp'
        },
        {
            title: 'Common Mistakes',
            content: `<p>Advanced Blazor patterns have subtle pitfalls that cause production issues:</p>
            <ul>
                <li><strong>JS interop during pre-render</strong> — IJSRuntime is not available during SSR; guard with <code>OnAfterRenderAsync(firstRender)</code></li>
                <li><strong>Not disposing DotNetObjectReference</strong> — causes memory leaks as GC cannot collect the C# object while JS holds a reference</li>
                <li><strong>Storing user state in Singleton (Server)</strong> — shared across all circuits; use Scoped services for per-user state</li>
                <li><strong>Missing @key on virtualized/dynamic lists</strong> — causes bizarre UI bugs where wrong data appears in wrong rows</li>
                <li><strong>Blocking the circuit with synchronous DB calls</strong> — blocks ALL rendering for that user; always use async</li>
                <li><strong>Not handling circuit disconnection gracefully</strong> — users see a dead page; implement reconnect UI and state recovery</li>
                <li><strong>Forgetting CancellationToken propagation</strong> — long-running operations continue after component disposal, wasting resources</li>
                <li><strong>Over-rendering</strong> — not using ShouldRender or @key, causing entire subtrees to re-render on unrelated state changes</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            content: `<p>Advanced Blazor interview questions test production experience and architectural thinking:</p>`,
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: '<ul><li><strong>State management reasoning</strong> — can you justify when to use simple service state vs Fluxor? Hint: start simple, add complexity only when needed.</li><li><strong>JS interop lifecycle awareness</strong> — know that JS is unavailable during pre-render, explain module isolation benefits, and always dispose references.</li><li><strong>Auth architecture for WASM</strong> — explain token storage trade-offs (localStorage vs cookies), refresh token flows, and why server-side validation is still required.</li><li><strong>SignalR circuit understanding</strong> — explain memory per circuit, sticky sessions requirement, and graceful disconnection handling.</li><li><strong>Performance optimization strategy</strong> — mention Virtualize first (biggest win), then @key, ShouldRender, and AOT as progressive optimizations.</li><li><strong>Testing approach</strong> — bUnit for components, integration tests for services, and why E2E tests complement but cannot replace unit tests.</li></ul>'
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>State management should match complexity</strong> — scoped services for simple apps, Fluxor for complex state machines with time-travel debugging</li>
                <li><strong>JS interop requires lifecycle discipline</strong> — import in OnAfterRenderAsync, always dispose IJSObjectReference and DotNetObjectReference</li>
                <li><strong>Auth differs by hosting model</strong> — Server uses circuit-scoped identity; WASM must manage tokens and refresh flows client-side</li>
                <li><strong>ErrorBoundary is per-component</strong> — nest them around risky sections; global boundary prevents full app crashes</li>
                <li><strong>Virtualize is the #1 performance win</strong> — never render 1000+ items without it; combine with ItemsProvider for server-side pagination</li>
                <li><strong>Blazor Server scaling = SignalR scaling</strong> — sticky sessions, Redis backplane, monitor circuit count</li>
                <li><strong>Streaming rendering (.NET 8)</strong> — send skeleton immediately, fill data as it loads; best UX for slow data sources</li>
                <li><strong>bUnit tests are fast and deterministic</strong> — test rendering output, event handlers, and async state transitions without a browser</li>
            </ul>`
        }
    ],
    questions: [
        {
            question: 'How would you implement state management in a large Blazor application? Compare the approaches available.',
            difficulty: 'hard',
            answer: `<p>Blazor state management options, from simple to complex:</p>
            <ol>
                <li><strong>Component state</strong> — private fields in @code. Fine for isolated components.</li>
                <li><strong>Cascading parameters</strong> — ambient context (theme, auth). Not for frequently-changing data.</li>
                <li><strong>Scoped state service</strong> — a DI-registered class with state + OnChange event. Components subscribe and call StateHasChanged. Good for feature-level shared state (cart, current order).</li>
                <li><strong>Fluxor (Redux pattern)</strong> — centralized immutable store with Actions, Reducers, and Effects. Provides predictable state transitions, time-travel debugging, and clear separation of concerns. Best for complex apps with many interacting state slices.</li>
            </ol>
            <p><strong>State persistence</strong> across sessions: use <code>PersistentComponentState</code> for pre-render transitions, and JS interop with localStorage/sessionStorage for cross-session persistence.</p>
            <p><strong>Key difference from React/Angular:</strong> Blazor lacks a built-in state management equivalent to Redux Toolkit or NgRx, making the community library choice (Fluxor) an important architectural decision.</p>`,
            interviewTip: 'Show progression: "I start with scoped services and only introduce Fluxor when I see state being shared across 5+ unrelated components or need time-travel debugging for complex workflows." This demonstrates pragmatism.',
            followUp: ['How does state persist across render mode transitions (Server → WASM)?', 'How would you handle optimistic updates in a Blazor Fluxor setup?', 'What are the trade-offs of browser storage vs server-side session state?'],
            seniorPerspective: 'I have seen teams adopt Fluxor on day one and drown in boilerplate for simple CRUD. My rule: if you can explain the state flow to a new developer in one sentence ("the cart service holds items"), you do not need Redux. I introduce Fluxor only when state mutations become hard to trace across components.',
            architectPerspective: 'State management is an architectural decision that affects testability, debugging, and team cognitive load. For enterprise apps, I standardize on one pattern per project: either scoped services with a clear notification contract, or full Fluxor with enforced action/reducer discipline. Mixing patterns creates confusion about where state lives and how it changes.'
        },
        {
            question: 'Explain JavaScript interop in Blazor. How do you call JS from C# and C# from JS? What are the disposal concerns?',
            difficulty: 'medium',
            answer: `<p><strong>C# → JS:</strong> Inject <code>IJSRuntime</code> and call <code>InvokeAsync&lt;T&gt;</code> or <code>InvokeVoidAsync</code>. For module isolation, import the JS file and get an <code>IJSObjectReference</code> — this keeps JS scoped and avoids global namespace pollution.</p>
            <p><strong>JS → C#:</strong> Create a <code>DotNetObjectReference&lt;T&gt;</code>, pass it to JS, and mark C# methods with <code>[JSInvokable]</code>. JS calls <code>dotNetObj.invokeMethodAsync('MethodName', args)</code>.</p>
            <p><strong>Disposal (critical):</strong></p>
            <ul>
                <li><code>IJSObjectReference</code> — must be disposed to free JS-side resources (chart instances, event listeners)</li>
                <li><code>DotNetObjectReference</code> — must be disposed or the C# object is pinned in memory (GC cannot collect it while JS holds a reference)</li>
                <li>Implement <code>IAsyncDisposable</code> on any component using JS interop</li>
            </ul>
            <p><strong>Timing constraint:</strong> JS interop is only available after <code>OnAfterRenderAsync</code> — never in <code>OnInitializedAsync</code> (the DOM does not exist yet during SSR).</p>`,
            interviewTip: 'Emphasize module isolation over global window functions — it shows you write production Blazor, not tutorial code. And always mention the disposal requirement.',
            followUp: ['How do you handle JS interop errors gracefully?', 'Can you use JS interop during pre-rendering?', 'What is the performance cost of crossing the interop boundary?'],
            seniorPerspective: 'I wrap all JS interop in a C# service that handles the lifecycle: lazy module loading, null-checking the reference, catching JSDisconnectedException (when the circuit drops), and disposing in a try-catch (disposal can fail if the user already closed the tab). Raw IJSRuntime calls scattered across components are a maintenance nightmare.',
            architectPerspective: 'JS interop is the escape hatch, not the primary tool. I audit interop usage and look for opportunities to replace it with pure Blazor (.NET 8 provides more built-in capabilities that previously required JS). When interop is necessary, I isolate it behind a service interface so components are testable without a browser runtime.'
        },
        {
            question: 'How does authentication work differently in Blazor Server vs Blazor WebAssembly?',
            difficulty: 'hard',
            answer: `<p><strong>Blazor Server:</strong> Authentication uses the same server-side mechanisms as traditional ASP.NET (cookie auth, Identity, OIDC). The user's identity flows naturally through the SignalR circuit. <code>HttpContext</code> is available (with caveats — only on initial connection, not during SignalR messages). AuthenticationState is circuit-scoped.</p>
            <p><strong>Blazor WebAssembly:</strong> The app runs in the browser, so it cannot directly access server-side auth. You must: (1) obtain a JWT or access token via an auth flow (OIDC/OAuth), (2) store it (typically in memory or a secure cookie — localStorage is XSS-vulnerable), (3) attach it to outgoing API requests, (4) implement a custom <code>AuthenticationStateProvider</code> that parses token claims.</p>
            <p><strong>Shared patterns:</strong> Both use <code>AuthorizeView</code> and <code>[Authorize]</code> attribute. Both use <code>CascadingAuthenticationState</code> to flow auth through the component tree. Authorization policies/roles are evaluated client-side for UI but MUST be enforced server-side on API calls.</p>`,
            interviewTip: 'Critical insight: client-side authorization (AuthorizeView, [Authorize] on WASM) is for UX only — any security enforcement must happen on the API server. Saying this shows production security awareness.',
            followUp: ['How do you handle token refresh in Blazor WASM?', 'What happens to auth state when a Server circuit disconnects and reconnects?', 'How do you integrate with Azure AD / Entra ID in Blazor?'],
            seniorPerspective: 'I never store JWTs in localStorage for WASM apps — it is readable by any XSS attack. I use the BFF (Backend-For-Frontend) pattern: a server-side companion that holds tokens in HttpOnly cookies and proxies API calls. The WASM app authenticates via the BFF, never touching tokens directly.',
            architectPerspective: 'Authentication architecture in Blazor depends on the render mode. For Interactive Auto, the component must work with both Server auth (circuit-scoped identity) and WASM auth (token-based). I design a unified IAuthService interface that abstracts the mechanism, letting components remain render-mode-agnostic while the implementation handles the specifics per hosting model.'
        },
        {
            question: 'How do you handle errors in Blazor? Explain ErrorBoundary and circuit disconnection.',
            difficulty: 'medium',
            answer: `<p><strong>ErrorBoundary</strong> is a built-in component that catches unhandled exceptions from child component rendering and lifecycle methods. It displays fallback UI instead of crashing the entire circuit/app.</p>
            <ul>
                <li>Wrap risky components: <code>&lt;ErrorBoundary&gt;&lt;ChildContent&gt;...&lt;/ChildContent&gt;&lt;ErrorContent&gt;...&lt;/ErrorContent&gt;&lt;/ErrorBoundary&gt;</code></li>
                <li>Call <code>errorBoundary.Recover()</code> to retry rendering after an error</li>
                <li>Nest ErrorBoundaries for granular error isolation (per-widget rather than full-page)</li>
            </ul>
            <p><strong>Circuit disconnection (Server):</strong> When the SignalR connection drops (network issue, server restart), the user sees a dead page. Handling:</p>
            <ul>
                <li>Configure automatic reconnection with exponential backoff</li>
                <li>Show reconnection UI (built-in CSS classes: <code>components-reconnect-show/failed/rejected</code>)</li>
                <li>After reconnection failure, prompt user to reload (state is lost)</li>
            </ul>
            <p><strong>WASM unhandled exceptions:</strong> crash the app entirely — there is no server to recover. Use ErrorBoundary and global exception handling middleware.</p>`,
            interviewTip: 'Mention that ErrorBoundary does NOT catch exceptions in event handlers by default — you need try-catch there. It only catches rendering and lifecycle exceptions.',
            followUp: ['How do you log errors in Blazor WASM back to the server?', 'How would you implement a global error notification system?', 'What is the difference between ErrorBoundary and a try-catch in OnInitializedAsync?'],
            seniorPerspective: 'I layer error handling: ErrorBoundary for rendering failures, try-catch in event handlers with user-friendly toast notifications, and a global ILogger that sends errors to Application Insights. The key is never showing raw exception messages to users while preserving full diagnostic context for developers.',
            architectPerspective: 'Error handling strategy maps to user experience tiers: transient errors (network blips) get automatic retry with progress indication; business errors (validation, conflicts) get inline feedback; infrastructure errors (circuit death, unrecoverable) get graceful degradation with session recovery. I design these as cross-cutting concerns in a base component, not per-component ad-hoc try-catches.'
        },
        {
            question: 'How do you optimize Blazor performance? Walk through your approach for a slow component.',
            difficulty: 'hard',
            answer: `<p>Performance optimization approach, in priority order:</p>
            <ol>
                <li><strong>Virtualize large lists</strong> — the biggest single win. Rendering 1000 items? Only ~30 visible items render at a time with <code>&lt;Virtualize&gt;</code>.</li>
                <li><strong>Use @key for dynamic lists</strong> — helps the diffing algorithm reuse DOM nodes correctly when items are added/removed/reordered.</li>
                <li><strong>Override ShouldRender</strong> — return false when nothing meaningful changed. Prevents cascade re-rendering of child component trees.</li>
                <li><strong>Avoid inline lambdas on hot paths</strong> — <code>@onclick="@(() => Delete(id))"</code> creates a new delegate on every render. For large lists, use a method reference or cache the delegate.</li>
                <li><strong>Choose the right render mode</strong> — Static SSR for content-heavy pages (zero client cost); Interactive Server for real-time (no WASM download); WASM for offline/heavy computation.</li>
                <li><strong>Lazy load assemblies (WASM)</strong> — defer downloading large feature modules until the user navigates there.</li>
                <li><strong>AOT compilation (WASM)</strong> — 2-5x faster execution for computation-heavy apps. Trade-off: larger download.</li>
            </ol>`,
            interviewTip: 'Lead with Virtualize — it solves 80% of Blazor performance problems. Then show you know the render diffing system (@key, ShouldRender). Mentioning AOT shows depth.',
            followUp: ['How does Blazor diffing compare to React virtual DOM?', 'What tools do you use to profile Blazor performance?', 'How do you reduce WASM initial load time?'],
            seniorPerspective: 'The first thing I check with a slow Blazor component is how many items it renders and whether it uses Virtualize. The second is whether a parent component re-renders too often (causing unnecessary child re-renders). I use browser DevTools to check render counts and Blazor diagnostic events to trace the diff tree.',
            architectPerspective: 'Performance is a render mode decision. I profile first: if latency comes from SignalR round-trips (Server mode), moving the component to WASM eliminates it. If the problem is large WASM download, Static SSR with targeted interactive islands solves it. The .NET 8 per-component render mode is the most powerful performance tool — use static where possible, interactive only where needed.'
        },
        {
            question: 'Explain how Blazor Server uses SignalR. What are the scaling implications?',
            difficulty: 'hard',
            answer: `<p>Blazor Server establishes a <strong>SignalR circuit</strong> (WebSocket connection) per browser tab. All interaction flows through this circuit:</p>
            <ul>
                <li>User clicks button → event sent to server via SignalR</li>
                <li>Server executes handler, re-renders component → calculates DOM diff</li>
                <li>Diff (minimal binary delta) sent back to browser via SignalR</li>
                <li>Browser JS applies diff to real DOM</li>
            </ul>
            <p><strong>Scaling implications:</strong></p>
            <ul>
                <li>Each circuit holds server memory (~250KB-2MB depending on component tree size)</li>
                <li>Practical limit: ~5,000 circuits per server (depends on memory/CPU)</li>
                <li><strong>Sticky sessions required</strong> — circuit state is in-memory on one server. Without stickiness, reconnections fail.</li>
                <li><strong>Redis backplane</strong> needed only for custom SignalR hubs (not for Blazor circuits themselves)</li>
                <li>Circuit timeout (default 3 min) determines how long disconnected state survives</li>
            </ul>
            <p><strong>Azure SignalR Service</strong> offloads connection management: clients connect to the Azure service, which proxies to your app servers. This removes the connection limit from your servers.</p>`,
            interviewTip: 'Quantify: "Each circuit uses ~250KB-2MB of server memory, so a 16GB server handles roughly 5,000 concurrent users." This shows you have done capacity planning.',
            followUp: ['How does Azure SignalR Service change the scaling model?', 'What happens if a user opens 10 tabs?', 'How would you implement graceful degradation when circuit limits are reached?'],
            seniorPerspective: 'I monitor active circuit count in production and alert at 70% capacity. I also configure DisconnectedCircuitRetentionPeriod to 1 minute (not default 3) for internal apps — users who walk away do not need their state preserved. For public-facing apps with unpredictable traffic, I prefer Interactive Auto mode to shift load to client WASM.',
            architectPerspective: 'Blazor Server scaling is a fundamentally different model than stateless REST APIs. You cannot simply add more servers behind a load balancer without sticky sessions or state externalization. For high-scale deployments, I use Azure SignalR Service (managed) or architect the app with Auto mode so the Server phase is temporary (fast start) and the steady-state runs on WASM (no server resources). This gives the best of both worlds: instant interaction AND horizontal scalability.'
        },
        {
            question: 'How do you achieve SEO with Blazor? Explain static SSR, streaming rendering, and enhanced navigation.',
            difficulty: 'medium',
            answer: `<p><strong>Static SSR (.NET 8)</strong> is the primary SEO solution. Components render to HTML on the server and deliver complete markup to crawlers — no JavaScript execution needed. Use <code>&lt;PageTitle&gt;</code> and <code>&lt;HeadContent&gt;</code> for meta tags.</p>
            <p><strong>Streaming rendering</strong> (<code>@attribute [StreamRendering(true)]</code>) sends initial HTML immediately (skeleton/loading state), then streams updated HTML as async data loads. Crawlers see the initial state; users see progressive loading. Great for pages with slow data sources.</p>
            <p><strong>Enhanced navigation</strong> intercepts link clicks in Static SSR pages, fetches the new page via <code>fetch()</code>, and patches the DOM — providing SPA-like navigation without any client-side framework or render mode. Forms can also be "enhanced" to submit without full page reload.</p>
            <p>The optimal SEO architecture: public pages use Static SSR (full crawlability), while authenticated/interactive sections use Interactive Server or Auto modes. This gives you both SEO and rich interactivity in the same app.</p>`,
            interviewTip: 'The key insight: .NET 8 Blazor can be an SEO-friendly server-rendered framework PLUS an SPA in the same project. This was impossible before .NET 8 — mention the unified model.',
            followUp: ['How does streaming rendering interact with HTTP response headers?', 'Can search engines render Blazor WebAssembly content?', 'How do you handle dynamic meta tags for social sharing?'],
            seniorPerspective: 'For e-commerce and content sites, I use Static SSR with enhanced navigation as the baseline — every page is crawlable, loads instantly, and navigates smoothly. I only add @rendermode Interactive for specific widgets that need real-time updates (stock indicators, live chat). This gives excellent Core Web Vitals scores.',
            architectPerspective: 'The .NET 8 render mode model solves the historic SSR-vs-SPA trade-off. I architect the app with a clear boundary: public-facing routes are Static SSR (SEO, performance, accessibility), authenticated routes use Interactive Auto (rich UX, offline capability). This maps cleanly to the business requirement: marketing pages must rank in search; app pages must be responsive and interactive.'
        },
        {
            question: 'How do you test Blazor components? Explain your testing strategy with bUnit.',
            difficulty: 'medium',
            answer: `<p><strong>bUnit</strong> renders Blazor components in a test host without a browser. It provides:</p>
            <ul>
                <li><strong>Component rendering</strong> — render with parameters, cascading values, and DI services</li>
                <li><strong>DOM assertions</strong> — find elements via CSS selectors, assert markup, text content</li>
                <li><strong>Event simulation</strong> — trigger click, input, change events and verify state changes</li>
                <li><strong>Async handling</strong> — <code>WaitForState</code> to await async lifecycle methods</li>
                <li><strong>Service mocking</strong> — register mock services in the test DI container</li>
            </ul>
            <p><strong>Testing strategy layers:</strong></p>
            <ol>
                <li><strong>Unit tests (bUnit)</strong> — test component rendering, event handlers, and state logic in isolation</li>
                <li><strong>Integration tests</strong> — test component interactions with real services (scoped to feature)</li>
                <li><strong>E2E tests (Playwright)</strong> — test full user flows including browser behavior, JS interop, and navigation</li>
            </ol>
            <p>bUnit tests run in milliseconds (no browser) and provide excellent coverage for rendering logic, parameter validation, and conditional UI.</p>`,
            interviewTip: 'Mention that bUnit tests are deterministic and fast (no browser, no network). Compare to React Testing Library as the conceptual equivalent. Show you know the testing pyramid for Blazor.',
            followUp: ['How do you test components that use JS interop?', 'Can bUnit test streaming rendering?', 'How do you test auth-dependent components?'],
            seniorPerspective: 'I write bUnit tests for every component that has conditional rendering logic or non-trivial event handling. For simple display components, I rely on TypeScript-style snapshot assertions (MarkupMatches). My rule: if a component has an @code block with more than 5 lines, it gets a test file.',
            architectPerspective: 'Testing strategy for Blazor applications: bUnit covers 80% of component behavior (rendering, events, state transitions). Integration tests with WebApplicationFactory cover API + component integration. Playwright E2E tests cover the 20% that requires real browser interaction (JS interop, navigation, animations). I invest most in bUnit because it is fast, deterministic, and catches regressions early.'
        },
        {
            question: 'How do you handle state persistence across Blazor render modes and pre-rendering?',
            difficulty: 'expert',
            answer: `<p>In .NET 8 Blazor with multiple render modes, state persistence is complex because:</p>
            <ul>
                <li><strong>Pre-rendering</strong>: Component initializes on server, then re-initializes on client (double-init problem)</li>
                <li><strong>Render mode switching</strong>: Auto mode starts on server (SignalR) then switches to WASM after download</li>
            </ul>
            <p><strong>Solutions:</strong></p>
            <ul>
                <li><code>PersistentComponentState</code> — serialize state during pre-render, restore on client init</li>
                <li><code>@rendermode</code> attribute — control where pre-rendering occurs</li>
                <li>Check <code>firstRender</code> in OnAfterRender to avoid duplicate API calls</li>
                <li>Use cascading state services registered as scoped (different scope per circuit/connection)</li>
            </ul>`,
            interviewTip: 'The double-initialization problem is a classic Blazor interview gotcha. Show you understand that OnInitializedAsync runs twice during pre-render and know PersistentComponentState as the fix.',
            followUp: ['What is the double-init problem?', 'How does PersistentComponentState serialize data?', 'When would you disable pre-rendering entirely?'],
            seniorPerspective: 'I always use PersistentComponentState for any component that fetches data in OnInitializedAsync with pre-rendering enabled. Without it, users see a flash of loading state as the component re-fetches on the client what was already fetched on the server.',
            architectPerspective: 'State management across render modes is the hardest part of .NET 8 Blazor architecture. I design state as a layered system: PersistentComponentState for hydration, cascading services for shared app state, and browser storage (via JS interop) for user preferences that survive page refreshes.'
        }
    ]
});
