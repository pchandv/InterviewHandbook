'use strict';

PageData.register('multitenancy', {
    title: 'Multi-Tenancy Patterns',
    description: 'Database isolation strategies, tenant resolution, noisy neighbor mitigation, and EF Core multi-tenancy',
    sections: [
        {
            title: 'Multi-Tenancy Overview',
            content: `<p>Multi-tenancy allows a single application instance to serve multiple customers (tenants) with logical data isolation.</p>
<ul>
<li><strong>Shared Database, Shared Schema</strong> - All tenants in same tables. Cheapest. Discriminator column for isolation.</li>
<li><strong>Shared Database, Separate Schema</strong> - Each tenant gets own schema. Moderate isolation and cost.</li>
<li><strong>Separate Database per Tenant</strong> - Complete isolation. Most expensive. Easiest compliance.</li>
<li><strong>Hybrid</strong> - Standard tenants share; premium/regulated tenants get dedicated resources.</li>
</ul>
<p>The choice depends on: number of tenants, isolation requirements (regulatory), performance needs, operational budget, and customization requirements.</p>`
        },
        {
            title: 'Isolation Strategy Comparison',
            mermaid: `graph TD
    A[Multi-Tenancy Strategy Decision] -->|Thousands of tenants, cost-sensitive| B[Shared DB + Discriminator]
    A -->|Hundreds of tenants, moderate isolation| C[Schema per Tenant]
    A -->|Regulated industry, strict isolation| D[Database per Tenant]
    A -->|Mix of requirements| E[Hybrid Approach]
    
    B --> B1[Pros: Cheapest, simplest ops]
    B --> B2[Cons: Noisy neighbor, cross-tenant query risk]
    
    C --> C1[Pros: Good isolation, one DB to manage]
    C --> C2[Cons: Complex migrations, connection management]
    
    D --> D1[Pros: Complete isolation, per-tenant backup/restore]
    D --> D2[Cons: Expensive, complex ops at scale]
    
    E --> E1[Standard: Shared DB]
    E --> E2[Premium: Dedicated DB]
    E --> E3[Regulated: Dedicated + encryption]`,
            content: `<p>Most SaaS applications start with shared database and migrate premium tenants to dedicated infrastructure as the product matures. Design for the migration path from day one.</p>`
        },
        {
            title: 'Shared Database with Discriminator Column',
            code: `// Every table has a TenantId column
public class Order
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }  // discriminator
    public string CustomerName { get; set; }
    public decimal Total { get; set; }
}

// EF Core global query filter - automatic tenant filtering
public class AppDbContext : DbContext
{
    private readonly ITenantProvider _tenantProvider;
    
    public DbSet<Order> Orders { get; set; }
    
    protected override void OnModelCreating(ModelBuilder builder)
    {
        // Every query automatically filters by tenant
        builder.Entity<Order>()
            .HasQueryFilter(o => o.TenantId == _tenantProvider.TenantId);
        
        // Composite index for performance
        builder.Entity<Order>()
            .HasIndex(o => new { o.TenantId, o.Id });
    }
    
    // Override SaveChanges to auto-set TenantId
    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        foreach (var entry in ChangeTracker.Entries<ITenantEntity>()
            .Where(e => e.State == EntityState.Added))
        {
            entry.Entity.TenantId = _tenantProvider.TenantId;
        }
        return base.SaveChangesAsync(ct);
    }
}

// Row-Level Security in SQL Server (database-enforced)
-- CREATE SECURITY POLICY TenantFilter
-- ADD FILTER PREDICATE dbo.fn_TenantPredicate(TenantId) ON dbo.Orders
-- WITH (STATE = ON);`,
            language: 'csharp'
        },
        {
            title: 'Database per Tenant',
            code: `// Connection string resolution per tenant
public class TenantConnectionFactory : ITenantConnectionFactory
{
    private readonly ITenantProvider _tenantProvider;
    private readonly ITenantRegistry _registry;
    
    public string GetConnectionString()
    {
        var tenant = _registry.GetTenant(_tenantProvider.TenantId);
        return tenant.ConnectionString; // each tenant has its own DB
    }
}

// DbContext configured per request
builder.Services.AddDbContext<AppDbContext>((provider, options) =>
{
    var factory = provider.GetRequiredService<ITenantConnectionFactory>();
    options.UseSqlServer(factory.GetConnectionString());
});

// Tenant registry (cached in memory, refreshed periodically)
public class TenantRegistry : ITenantRegistry
{
    private readonly IDistributedCache _cache;
    
    public async Task<TenantInfo> GetTenant(Guid tenantId)
    {
        var cached = await _cache.GetStringAsync($"tenant:{tenantId}");
        if (cached != null)
            return JsonSerializer.Deserialize<TenantInfo>(cached);
        
        // Load from master/catalog database
        var tenant = await _catalogDb.Tenants.FindAsync(tenantId);
        await _cache.SetStringAsync($"tenant:{tenantId}",
            JsonSerializer.Serialize(tenant),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) });
        
        return tenant;
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Tenant Resolution',
            code: `// Middleware to resolve tenant from request
public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    
    public async Task InvokeAsync(HttpContext context, ITenantProvider tenantProvider)
    {
        var tenantId = ResolveTenant(context);
        if (tenantId == null)
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsync("Tenant could not be resolved");
            return;
        }
        
        tenantProvider.SetTenant(tenantId.Value);
        await _next(context);
    }
    
    private Guid? ResolveTenant(HttpContext context)
    {
        // Strategy 1: Subdomain (tenant1.app.com)
        var host = context.Request.Host.Host;
        var subdomain = host.Split('.').First();
        
        // Strategy 2: Custom header (X-Tenant-Id)
        if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var headerValue))
            return Guid.Parse(headerValue);
        
        // Strategy 3: Route/path (/api/tenants/{tenantId}/orders)
        if (context.Request.RouteValues.TryGetValue("tenantId", out var routeValue))
            return Guid.Parse(routeValue.ToString());
        
        // Strategy 4: JWT claim
        var claim = context.User.FindFirst("tenant_id");
        if (claim != null) return Guid.Parse(claim.Value);
        
        return null;
    }
}

// Scoped tenant provider
public class TenantProvider : ITenantProvider
{
    public Guid TenantId { get; private set; }
    public void SetTenant(Guid tenantId) => TenantId = tenantId;
}

// Registration
builder.Services.AddScoped<ITenantProvider, TenantProvider>();
app.UseMiddleware<TenantResolutionMiddleware>();`,
            language: 'csharp'
        },
        {
            title: 'Noisy Neighbor Problem',
            mermaid: `graph TD
    A[Tenant A - Heavy Query] -->|Consumes| B[Shared Resources]
    C[Tenant B - Normal Load] -->|Degraded| B
    D[Tenant C - Normal Load] -->|Degraded| B
    
    B --> E[CPU]
    B --> F[Memory]
    B --> G[I/O]
    B --> H[Connections]
    
    I[Mitigation Strategies] --> J[Per-tenant resource quotas]
    I --> K[Request rate limiting per tenant]
    I --> L[Query timeout enforcement]
    I --> M[Connection pool per tenant]
    I --> N[Dedicated resources for heavy tenants]
    I --> O[Priority queues - premium tenants first]`,
            content: `<p>The <strong>noisy neighbor problem</strong> occurs when one tenant's heavy usage degrades performance for all others sharing the same infrastructure. Mitigation requires per-tenant resource governance.</p>
<p>Common causes: runaway queries, bulk data imports, high concurrency from a single tenant, memory-intensive operations.</p>`
        },
        {
            title: 'Tenant-Aware Dependency Injection',
            code: `// Tenant-aware DI - resolve services differently per tenant
public class TenantServiceProvider
{
    private readonly IServiceProvider _rootProvider;
    
    public T GetServiceForTenant<T>(Guid tenantId) where T : class
    {
        // Resolve tenant-specific configuration
        var tenantConfig = GetTenantConfig(tenantId);
        
        // Example: different storage per tenant
        return tenantConfig.StorageTier switch
        {
            "premium" => _rootProvider.GetRequiredService<PremiumStorage>() as T,
            "standard" => _rootProvider.GetRequiredService<StandardStorage>() as T,
            _ => _rootProvider.GetRequiredService<T>()
        };
    }
}

// Per-tenant feature flags
public class TenantFeatureService
{
    public bool IsFeatureEnabled(Guid tenantId, string feature)
    {
        var tenant = _registry.GetTenant(tenantId);
        return tenant.EnabledFeatures.Contains(feature);
    }
}

// Tenant-aware caching
public class TenantCache
{
    private readonly IDistributedCache _cache;
    private readonly ITenantProvider _tenant;
    
    public async Task<T> GetAsync<T>(string key)
    {
        // Namespace cache keys by tenant
        var tenantKey = $"t:{_tenant.TenantId}:{key}";
        var data = await _cache.GetStringAsync(tenantKey);
        return data != null ? JsonSerializer.Deserialize<T>(data) : default;
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Migration Strategies',
            content: `<p>Schema migrations in multi-tenant systems require careful planning:</p>
<ul>
<li><strong>Shared DB</strong> - Standard EF Core migrations apply to all tenants at once. Simple but risky (one bad migration affects everyone).</li>
<li><strong>Database per Tenant</strong> - Must migrate each tenant database individually. Rolling migration allows rollback per tenant.</li>
<li><strong>Schema per Tenant</strong> - Apply migration to each schema. Can be parallelized.</li>
</ul>
<p><strong>Best practices:</strong></p>
<ul>
<li>Backward-compatible migrations only (expand-contract pattern)</li>
<li>Rolling deployment: new code handles both old and new schema</li>
<li>Canary migrations: migrate one tenant first, validate, then roll out</li>
<li>Runbook for rollback per tenant</li>
<li>Track migration version per tenant (some may lag)</li>
</ul>
<p><strong>Expand-Contract pattern:</strong> Add new column → deploy code that writes to both old and new → migrate data → deploy code that reads from new only → remove old column. Never break running code.</p>`
        }
    ],
    questions: [
        {
            question: 'Compare the three main multi-tenancy data isolation strategies. What factors drive the decision?',
            difficulty: 'medium',
            answer: `<p><strong>1. Shared Database, Shared Schema (Discriminator Column):</strong></p>
<ul>
<li>All tenants in same tables, filtered by TenantId column</li>
<li>Best for: thousands of small tenants, cost-sensitive SaaS</li>
<li>Risk: cross-tenant data leak if filter missed, noisy neighbor</li>
</ul>
<p><strong>2. Schema per Tenant:</strong></p>
<ul>
<li>Each tenant gets own schema in same database</li>
<li>Best for: moderate tenant count, need logical isolation without DB overhead</li>
<li>Risk: complex connection management, migration coordination</li>
</ul>
<p><strong>3. Database per Tenant:</strong></p>
<ul>
<li>Complete physical isolation per tenant</li>
<li>Best for: regulated industries (HIPAA, GDPR), enterprise customers demanding isolation</li>
<li>Risk: operational complexity at scale, higher infrastructure cost</li>
</ul>
<p><strong>Decision factors:</strong></p>
<ul>
<li><strong>Tenant count</strong> - More tenants → shared is more economical</li>
<li><strong>Compliance</strong> - Regulatory requirements may mandate isolation</li>
<li><strong>Performance</strong> - Isolation eliminates noisy neighbor</li>
<li><strong>Customization</strong> - Separate DB allows per-tenant schema extensions</li>
<li><strong>Backup/restore</strong> - Per-tenant DB enables individual tenant restore</li>
</ul>`,
            interviewTip: 'Present as a spectrum of isolation vs cost. Show you can recommend based on specific business context rather than always choosing one approach.',
            followUp: ['Can you mix strategies for different tenant tiers?', 'How do you migrate from shared to dedicated?'],
            seniorPerspective: 'Start with shared database (cheapest, simplest). Design the abstraction so you CAN migrate to per-tenant DB later. Most startups never need the migration, but the option should exist.',
            architectPerspective: 'The tenant isolation strategy is an architectural decision that affects every layer: data access, caching, queuing, storage, and monitoring. Choose early and design all layers to be tenant-aware.'
        },
        {
            question: 'How do you prevent cross-tenant data leaks in a shared database?',
            difficulty: 'hard',
            answer: `<p>Cross-tenant data leaks are the #1 security risk in shared-database multi-tenancy. Defense-in-depth is required.</p>
<p><strong>Layers of protection:</strong></p>
<ol>
<li><strong>EF Core Global Query Filters</strong> - Automatic WHERE TenantId = @current on every query. Cannot be accidentally bypassed.</li>
<li><strong>Row-Level Security (SQL Server)</strong> - Database-enforced filtering. Even raw SQL respects it.</li>
<li><strong>Middleware validation</strong> - Every request must resolve to a valid tenant before proceeding.</li>
<li><strong>SaveChanges override</strong> - Auto-set TenantId on all new entities. Prevent saving without tenant.</li>
<li><strong>Integration tests</strong> - Test that Tenant A cannot access Tenant B data.</li>
</ol>
<pre><code>// Defense: Global query filter + RLS
builder.Entity&lt;Order&gt;().HasQueryFilter(o => o.TenantId == _tenantId);

// Defense: Block ignoring the filter without explicit bypass
// Custom analyzer or code review rule to flag .IgnoreQueryFilters()

// Defense: Validate on save
public override Task&lt;int&gt; SaveChangesAsync(CancellationToken ct)
{
    var invalid = ChangeTracker.Entries&lt;ITenantEntity&gt;()
        .Any(e => e.Entity.TenantId != _tenantProvider.TenantId
                   && e.State != EntityState.Unchanged);
    if (invalid) throw new SecurityException("Cross-tenant write attempt");</code></pre>
<p><strong>Testing:</strong> Seed test data for two tenants. Verify that querying as Tenant A never returns Tenant B data, even with raw SQL or complex joins.</p>`,
            interviewTip: 'Emphasize defense-in-depth. No single layer is sufficient. Mention RLS as the database-level backstop that catches bugs in application code.',
            followUp: ['How do you handle admin queries that need cross-tenant access?', 'What about shared reference data (lookup tables)?'],
            seniorPerspective: 'Treat cross-tenant data access as a P0 security vulnerability. Add specific integration tests. Consider it equivalent to SQL injection in severity.',
            architectPerspective: 'Row-Level Security at the database level is the ultimate safety net. Application bugs can bypass query filters, but RLS enforces isolation regardless of how the query arrives.'
        },
        {
            question: 'How does tenant resolution work? Compare subdomain vs header vs JWT approaches.',
            difficulty: 'medium',
            answer: `<p>Tenant resolution determines which tenant a request belongs to. It must happen early in the pipeline (before auth, before DB access).</p>
<p><strong>Subdomain (tenant1.app.com):</strong></p>
<ul>
<li>Pros: Clear separation in URLs, easy for users to understand their workspace</li>
<li>Cons: Requires wildcard DNS/TLS, complicates CORS for SPA, harder in development</li>
<li>Best for: B2B SaaS with branded tenant experiences (Slack, Notion)</li>
</ul>
<p><strong>Custom Header (X-Tenant-Id):</strong></p>
<ul>
<li>Pros: Flexible, works with any URL structure, easy API testing</li>
<li>Cons: Client must always set header, not visible in URL, easy to forget</li>
<li>Best for: API-first services, microservice-to-microservice calls</li>
</ul>
<p><strong>JWT Claim (tenant_id in token):</strong></p>
<ul>
<li>Pros: Cryptographically tied to authentication, cannot be forged</li>
<li>Cons: Tenant change requires re-authentication, token per tenant</li>
<li>Best for: Secure APIs where tenant is fixed for a session</li>
</ul>
<p><strong>Path Segment (/api/tenants/{id}/...):</strong></p>
<ul>
<li>Pros: RESTful, explicit in URL, easy to route</li>
<li>Cons: Verbose URLs, must validate user belongs to tenant</li>
<li>Best for: Admin APIs managing multiple tenants</li>
</ul>`,
            interviewTip: 'Discuss security implications of each. Header-based can be spoofed; JWT-based cannot. For production, JWT claim is the most secure.',
            followUp: ['How do you handle users who belong to multiple tenants?', 'How does tenant resolution work in background jobs?'],
            seniorPerspective: 'Use JWT claim for security-critical resolution. The tenant ID in the token is signed and cannot be tampered with. Headers and subdomains are convenience mechanisms layered on top.',
            architectPerspective: 'Tenant resolution must be consistent across all entry points: HTTP requests, message queue consumers, scheduled jobs, and SignalR connections. Define a unified ITenantProvider abstraction.'
        },
        {
            question: 'What is the noisy neighbor problem and how do you mitigate it?',
            difficulty: 'medium',
            answer: `<p>The <strong>noisy neighbor</strong> problem occurs when one tenant consumes disproportionate shared resources, degrading performance for other tenants.</p>
<p><strong>Symptoms:</strong> Increased latency for all tenants, timeout errors, resource exhaustion (CPU, memory, I/O, connection pool), cascading failures.</p>
<p><strong>Mitigation strategies:</strong></p>
<ul>
<li><strong>Per-tenant rate limiting</strong> - Cap API calls per tenant per time window</li>
<li><strong>Per-tenant connection pool limits</strong> - Prevent one tenant from consuming all DB connections</li>
<li><strong>Query timeouts</strong> - Kill long-running queries (per-tenant query budget)</li>
<li><strong>Resource quotas</strong> - CPU time limits, storage limits, row count limits</li>
<li><strong>Priority tiers</strong> - Premium tenants get dedicated resources; standard tenants share</li>
<li><strong>Request queuing with fairness</strong> - Round-robin or weighted fair queuing across tenants</li>
<li><strong>Circuit breaker per tenant</strong> - If one tenant causes errors, temporarily throttle them</li>
</ul>
<pre><code>// Per-tenant rate limiting middleware
services.AddRateLimiter(options =>
{
    options.AddPolicy("per-tenant", context =>
    {
        var tenantId = context.GetTenantId();
        return RateLimitPartition.GetSlidingWindowLimiter(tenantId, _ =>
            new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 1000,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 6
            });
    });
});</code></pre>`,
            interviewTip: 'Start by explaining the problem clearly, then present mitigation as a layered approach. Mention that this is why premium tiers often include dedicated resources.',
            followUp: ['How do you detect a noisy neighbor?', 'What metrics would you monitor per tenant?'],
            seniorPerspective: 'Monitoring per-tenant resource consumption is the first step. You cannot mitigate what you cannot measure. Add per-tenant metrics: request count, latency percentiles, error rate, DB query count.',
            architectPerspective: 'The noisy neighbor problem fundamentally drives the architecture decision. If mitigation is too complex or risky, separate databases become the answer. The cost of isolation vs the cost of a multi-tenant outage.'
        },
        {
            question: 'How do you handle database migrations in a multi-tenant system with database-per-tenant?',
            difficulty: 'hard',
            answer: `<p>Migrating hundreds or thousands of tenant databases requires automation, rollback capability, and gradual rollout.</p>
<p><strong>Strategy:</strong></p>
<ol>
<li><strong>Expand-contract pattern</strong> - Never make breaking schema changes. Add new → migrate data → remove old.</li>
<li><strong>Rolling migration</strong> - Migrate tenants in batches, not all at once.</li>
<li><strong>Canary tenants</strong> - Migrate internal/test tenants first. Validate. Then production tenants.</li>
<li><strong>Per-tenant version tracking</strong> - Catalog database stores current schema version per tenant.</li>
<li><strong>Automated migration service</strong> - Background worker applies pending migrations to next tenant.</li>
</ol>
<pre><code>// Migration orchestrator
public class TenantMigrationService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        var tenants = await _catalog.GetTenantsNeedingMigration();
        
        foreach (var batch in tenants.Chunk(10)) // 10 at a time
        {
            var tasks = batch.Select(t => MigrateTenantAsync(t, ct));
            var results = await Task.WhenAll(tasks);
            
            var failed = results.Where(r => !r.Success);
            if (failed.Any())
            {
                _logger.LogError("Migration failed for {Count} tenants", failed.Count());
                // Alert ops team, pause further migration
                break;
            }
            
            await Task.Delay(TimeSpan.FromSeconds(5), ct); // breathing room
        }
    }
    
    private async Task&lt;MigrationResult&gt; MigrateTenantAsync(TenantInfo tenant, CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService&lt;TenantDbContext&gt;();
            context.SetConnectionString(tenant.ConnectionString);
            await context.Database.MigrateAsync(ct);
            await _catalog.UpdateSchemaVersion(tenant.Id, _targetVersion);
            return MigrationResult.Success(tenant.Id);
        }
        catch (Exception ex)
        {
            return MigrationResult.Failed(tenant.Id, ex);
        }
    }
}</code></pre>`,
            interviewTip: 'Emphasize the rolling/canary approach. Migrating all tenants simultaneously is too risky. Show you think about operational safety.',
            followUp: ['How do you rollback a migration for one tenant?', 'How do you handle code that needs to work with both old and new schema?'],
            seniorPerspective: 'Make migrations backward-compatible by default. New code must work with both old and new schema during the rollout window. This enables safe rollback.',
            architectPerspective: 'Consider using a schema management tool like Flyway or custom tooling that tracks migrations per tenant with support for out-of-order application (some tenants may skip versions if they were offline).'
        },
        {
            question: 'How would you implement multi-tenancy with EF Core? Show the key patterns.',
            difficulty: 'medium',
            answer: `<p>EF Core supports multi-tenancy through global query filters, dynamic connection strings, and interceptors.</p>
<pre><code>// 1. Base entity with TenantId
public interface ITenantEntity
{
    Guid TenantId { get; set; }
}

// 2. DbContext with tenant filtering
public class MultiTenantDbContext : DbContext
{
    private readonly Guid _tenantId;
    
    public MultiTenantDbContext(DbContextOptions options, ITenantProvider tenant)
        : base(options)
    {
        _tenantId = tenant.TenantId;
    }
    
    protected override void OnModelCreating(ModelBuilder builder)
    {
        // Apply filter to ALL tenant entities automatically
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(MultiTenantDbContext)
                    .GetMethod(nameof(SetTenantFilter), BindingFlags.NonPublic | BindingFlags.Static)
                    .MakeGenericMethod(entityType.ClrType);
                method.Invoke(null, new object[] { builder, _tenantId });
            }
        }
    }
    
    private static void SetTenantFilter&lt;T&gt;(ModelBuilder builder, Guid tenantId) 
        where T : class, ITenantEntity
    {
        builder.Entity&lt;T&gt;().HasQueryFilter(e => e.TenantId == tenantId);
    }
}

// 3. For database-per-tenant, override OnConfiguring
protected override void OnConfiguring(DbContextOptionsBuilder options)
{
    var connectionString = _tenantFactory.GetConnectionString();
    options.UseSqlServer(connectionString);
}</code></pre>
<p>Remember: Global query filters do NOT apply to raw SQL or <code>.IgnoreQueryFilters()</code>. Add Row-Level Security as a backstop.</p>`,
            interviewTip: 'Show the automatic filter application pattern (reflection over entity types). This prevents developers from forgetting to add the filter to new entities.',
            followUp: ['How do you test that query filters are correctly applied?', 'How do you handle admin queries that bypass tenant filters?'],
            seniorPerspective: 'Automate tenant filter application. If a developer has to remember to add it manually, someone will forget. Use reflection or source generators to apply filters automatically to all ITenantEntity implementations.',
            architectPerspective: 'EF Core global query filters are a great first layer but are application-enforced. For high-security requirements, combine with database-level RLS that enforces isolation even for ad-hoc queries and reporting tools.'
        },
        {
            question: 'Design a hybrid multi-tenancy system where standard tenants share resources and premium tenants get dedicated infrastructure.',
            difficulty: 'expert',
            answer: `<p><strong>Architecture:</strong></p>
<pre><code>// Tenant catalog stores tier and routing info
public class TenantInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public TenantTier Tier { get; set; } // Standard, Premium, Enterprise
    public string ConnectionString { get; set; } // null for standard (uses shared)
    public string CachePrefix { get; set; }
    public ResourceLimits Limits { get; set; }
}

// Dynamic routing based on tenant tier
public class HybridTenantRouter
{
    public string GetConnectionString(TenantInfo tenant)
    {
        return tenant.Tier switch
        {
            TenantTier.Standard => _sharedConnectionString,
            TenantTier.Premium => tenant.ConnectionString, // dedicated DB
            TenantTier.Enterprise => tenant.ConnectionString, // dedicated + encryption
            _ => _sharedConnectionString
        };
    }
    
    public ResourceLimits GetLimits(TenantInfo tenant)
    {
        return tenant.Tier switch
        {
            TenantTier.Standard => new ResourceLimits 
            { 
                MaxRequestsPerMinute = 100, 
                MaxStorage = "1GB",
                MaxConcurrentConnections = 5
            },
            TenantTier.Premium => new ResourceLimits 
            { 
                MaxRequestsPerMinute = 10000, 
                MaxStorage = "100GB",
                MaxConcurrentConnections = 50
            },
            _ => ResourceLimits.Unlimited
        };
    }
}

// Upgrade path: migrate tenant from shared to dedicated
public async Task UpgradeToPremium(Guid tenantId)
{
    // 1. Provision new database
    var newConnString = await _provisioner.CreateDatabaseAsync(tenantId);
    // 2. Copy data from shared DB (filtered by TenantId)
    await _migrator.CopyTenantData(tenantId, _sharedConn, newConnString);
    // 3. Update catalog to point to new DB
    await _catalog.UpdateConnectionString(tenantId, newConnString);
    // 4. Delete from shared DB (after verification)
    await _cleaner.RemoveFromSharedDb(tenantId);
}</code></pre>
<p><strong>Key design principles:</strong></p>
<ul>
<li>Tenant routing is resolved once per request and flows through all layers</li>
<li>Application code is tier-agnostic (same code path regardless of isolation level)</li>
<li>Upgrade/downgrade is a data migration operation, not a code change</li>
<li>Monitor per-tenant metrics regardless of tier for capacity planning</li>
</ul>`,
            interviewTip: 'Show the upgrade path from standard to premium. This demonstrates you think about the product lifecycle, not just the initial implementation.',
            followUp: ['How do you handle the migration window when upgrading a tenant?', 'How do you test both code paths (shared and dedicated)?'],
            seniorPerspective: 'Design the abstraction layer so that application code never knows whether it is hitting a shared or dedicated database. The routing decision is infrastructure, not business logic.',
            architectPerspective: 'Hybrid tenancy is the pragmatic production architecture. Start all tenants on shared infrastructure. Offer dedicated as an upsell or compliance requirement. The provisioning and migration automation is the key investment.'
        },
        {
            question: 'How do you handle shared reference data (countries, currencies) in a multi-tenant system?',
            difficulty: 'easy',
            answer: `<p>Some data is shared across all tenants (lookup tables, reference data) while other data is tenant-specific.</p>
<p><strong>Approaches:</strong></p>
<ul>
<li><strong>Shared tables without TenantId</strong> - Countries, currencies, timezones are global. No query filter applied.</li>
<li><strong>System tenant</strong> - A special tenant ID (e.g., Guid.Empty) owns shared data. Query filter allows this tenant's data for all.</li>
<li><strong>Separate schema/database</strong> - Shared data in a common schema, tenant data in tenant schema.</li>
<li><strong>In-memory cache</strong> - Reference data loaded once and cached. No per-request DB query needed.</li>
</ul>
<pre><code>// Approach: Exempt shared entities from tenant filter
builder.Entity&lt;Country&gt;(); // No HasQueryFilter - available to all
builder.Entity&lt;Currency&gt;(); // No HasQueryFilter - available to all
builder.Entity&lt;Order&gt;().HasQueryFilter(o => o.TenantId == _tenantId); // Filtered

// Approach: System tenant
builder.Entity&lt;ReferenceData&gt;().HasQueryFilter(
    r => r.TenantId == _tenantId || r.TenantId == Guid.Empty); // shared + tenant</code></pre>
<p><strong>Best practice:</strong> Cache reference data aggressively (it rarely changes). Use IMemoryCache with long TTL or static readonly collections loaded at startup.</p>`,
            interviewTip: 'This is a common practical question. Show you have thought about it by distinguishing tenant-specific, shared, and hybrid (tenant can override) data.',
            followUp: ['What about data that is shared but tenant-customizable (e.g., tax rates)?', 'How do you handle reference data in database-per-tenant?'],
            seniorPerspective: 'Create clear conventions: ITenantEntity = filtered, no interface = shared. Make this a team standard enforced in code review and architecture documentation.',
            architectPerspective: 'In database-per-tenant, shared reference data must be replicated to each tenant DB or accessed from a central API. This adds complexity but maintains the isolation guarantee.'
        },
        {
            question: 'How do you handle background jobs and message queue consumers in a multi-tenant context?',
            difficulty: 'advanced',
            answer: `<p>Background jobs and message consumers do not have an HTTP request context, so tenant resolution must happen differently.</p>
<p><strong>Strategies:</strong></p>
<ul>
<li><strong>Tenant ID in message</strong> - Every message/job includes TenantId in payload or headers. Consumer sets tenant context before processing.</li>
<li><strong>Tenant ID in job data</strong> - Hangfire/Quartz jobs include TenantId as a parameter. Job sets tenant context at start.</li>
<li><strong>Per-tenant queues</strong> - Separate queue per tenant. Consumer knows tenant from queue name. Enables per-tenant scaling.</li>
</ul>
<pre><code>// Message consumer sets tenant context
public class OrderEventConsumer : IConsumer&lt;OrderPlacedEvent&gt;
{
    private readonly ITenantProvider _tenantProvider;
    
    public async Task Consume(ConsumeContext&lt;OrderPlacedEvent&gt; context)
    {
        // Extract tenant from message header
        var tenantId = context.Headers.Get&lt;Guid&gt;("X-Tenant-Id");
        _tenantProvider.SetTenant(tenantId);
        
        // Now all scoped services (DbContext etc.) are tenant-aware
        await ProcessOrder(context.Message);
    }
}

// Hangfire job with tenant context
public class TenantJobFilter : IServerFilter
{
    public void OnPerforming(PerformingContext context)
    {
        var tenantId = context.GetJobParameter&lt;Guid&gt;("TenantId");
        var provider = context.Resolve&lt;ITenantProvider&gt;();
        provider.SetTenant(tenantId);
    }
}

// Enqueue with tenant context
BackgroundJob.Enqueue(() => ProcessOrder(orderId), 
    new { TenantId = currentTenantId });</code></pre>
<p><strong>Key rule:</strong> Never process a background job without explicitly establishing tenant context first. A missing tenant context means operations run without filters (data leak risk).</p>`,
            interviewTip: 'Highlight the security risk of running without tenant context. This shows you think about the non-obvious attack vectors in multi-tenant systems.',
            followUp: ['How do you ensure all jobs have tenant context set?', 'How do you handle jobs that process multiple tenants?'],
            seniorPerspective: 'Create a TenantScope helper that must wrap all background processing. Fail loudly (throw) if code tries to access tenant-specific resources without an active tenant context.',
            architectPerspective: 'Consider a TenantContext ambient scope (similar to TransactionScope) that propagates through async flows. This ensures tenant isolation even in deeply nested code paths.'
        }
    ]
});
