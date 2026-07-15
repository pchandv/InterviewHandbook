PageData.register('aurelia-framework', {
    title: 'Aurelia Framework',
    description: 'Convention-over-configuration JavaScript framework with native dependency injection, two-way binding, and a powerful router. Covers Aurelia 1 and Aurelia 2.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>Aurelia is a modern JavaScript framework that embraces web standards and conventions over configuration. Created by Rob Eisenberg (former Angular 2 team member), it provides a clean, extensible architecture with native dependency injection, an adaptive binding system, and a powerful router.</p>
<p>While less popular than Angular or React, Aurelia is used in enterprise applications where its conventions reduce boilerplate and its standards-compliance ensures longevity. Interviews may ask about Aurelia specifically or use it as a comparison point to Angular/React architecture.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>Aurelia is built on these foundational principles:</p>
<ul>
<li><strong>Convention over Configuration</strong> — A view-model named <code>user-list.ts</code> automatically pairs with <code>user-list.html</code>. No explicit wiring needed.</li>
<li><strong>Dependency Injection</strong> — Built-in DI container, constructor injection by default. No decorators required for simple cases.</li>
<li><strong>Two-Way Data Binding</strong> — Adaptive binding system that chooses the most efficient observation strategy per property (dirty checking, Object.observe, proxies).</li>
<li><strong>Custom Elements</strong> — Web-component-like custom elements with lifecycle hooks, bindable properties, and slot-based content projection.</li>
<li><strong>Value Converters</strong> — Transform data in bindings (like Angular pipes). Bidirectional: can convert both to-view and from-view.</li>
<li><strong>Router</strong> — First-class client-side router with child routers, route pipelines, navigation strategies, and auth guards.</li>
<li><strong>Composition</strong> — The <code>&lt;compose&gt;</code> element dynamically renders view-models based on runtime data.</li>
</ul>`
        },
        {
            title: 'How It Works',
            content: `<p>Aurelia's architecture follows a modular pipeline:</p>
<ol>
<li><strong>Bootstrap</strong> — Aurelia.start() initializes the DI container, configures plugins, and sets the root component</li>
<li><strong>Composition</strong> — The composition engine pairs view-models (.ts/.js) with views (.html) by convention</li>
<li><strong>Binding</strong> — The binding engine parses templates, creates observation strategies, and connects view to view-model</li>
<li><strong>Rendering</strong> — The templating engine renders the DOM using a fast, incremental approach</li>
<li><strong>Lifecycle</strong> — Components go through created → binding → bound → attaching → attached (and reverse for teardown)</li>
</ol>`,
            mermaid: `flowchart TD
    A[Aurelia.start] --> B[Configure DI Container]
    B --> C[Load Root Component]
    C --> D[Composition Engine]
    D --> E[Match ViewModel + View]
    E --> F[Binding Engine]
    F --> G[Create Observers]
    G --> H[Render DOM]
    H --> I[Lifecycle: attached]
    I --> J[Router Activates]
    J --> K[Child Routes Load]`
        },
        {
            title: 'Visual Diagram',
            content: `<p>Aurelia component lifecycle and binding flow:</p>`,
            mermaid: `flowchart LR
    subgraph Lifecycle
        A[constructor] --> B[created]
        B --> C[binding]
        C --> D[bound]
        D --> E[attaching]
        E --> F[attached]
        F --> G[detaching]
        G --> H[unbinding]
        H --> I[dispose]
    end
    subgraph Binding Modes
        J[".bind = adaptive"]
        K[".one-way = to-view"]
        L[".two-way = bidirectional"]
        M[".one-time = once"]
        N[".from-view = vm update"]
    end`
        },
        {
            title: 'Implementation',
            content: `<p>Key Aurelia patterns with complete examples:</p>`,
            code: `// ═══ Custom Element with Bindable Properties ═══
// user-card.ts (view-model)
import { bindable, customElement } from 'aurelia-framework';

@customElement('user-card')
export class UserCard {
    @bindable user: { name: string; email: string; role: string };
    @bindable onSelect: (user: any) => void;

    // Lifecycle: called when all bindings are initially set
    bound() {
        console.log('UserCard bound with:', this.user?.name);
    }

    // Change handler: called when 'user' bindable changes
    userChanged(newVal, oldVal) {
        console.log('User changed from', oldVal?.name, 'to', newVal?.name);
    }

    selectUser() {
        this.onSelect?.(this.user);
    }
}

// user-card.html (view - matched by convention)
// <template>
//   <div class="card">
//     <h3>\${user.name}</h3>
//     <p>\${user.email}</p>
//     <span class="badge">\${user.role | capitalize}</span>
//     <button click.trigger="selectUser()">Select</button>
//   </div>
// </template>

// ═══ Dependency Injection ═══
// user-service.ts
import { HttpClient } from 'aurelia-fetch-client';
import { inject } from 'aurelia-framework';

@inject(HttpClient)
export class UserService {
    constructor(private http: HttpClient) {}

    async getUsers(): Promise<User[]> {
        const response = await this.http.fetch('/api/users');
        return response.json();
    }

    async getById(id: number): Promise<User> {
        const response = await this.http.fetch(\`/api/users/\${id}\`);
        return response.json();
    }
}

// ═══ Value Converter (bidirectional) ═══
// date-format.ts
import { valueConverter } from 'aurelia-framework';

@valueConverter('dateFormat')
export class DateFormatValueConverter {
    toView(value: string | Date, format = 'short'): string {
        if (!value) return '';
        const date = new Date(value);
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: format as any
        }).format(date);
    }

    fromView(value: string): Date {
        return new Date(value);
    }
}
// Usage in template: \${order.createdAt | dateFormat:'medium'}

// ═══ Router Configuration ═══
// app.ts
import { RouterConfiguration, Router } from 'aurelia-router';

export class App {
    router: Router;

    configureRouter(config: RouterConfiguration, router: Router) {
        config.title = 'My App';
        config.addPipelineStep('authorize', AuthorizeStep);
        config.map([
            { route: ['', 'home'], name: 'home', moduleId: 'pages/home' },
            { route: 'users', name: 'users', moduleId: 'pages/user-list', nav: true, title: 'Users' },
            { route: 'users/:id', name: 'user-detail', moduleId: 'pages/user-detail' },
            { route: 'admin', name: 'admin', moduleId: 'pages/admin', settings: { roles: ['admin'] } }
        ]);
        this.router = router;
    }
}

// Auth pipeline step
class AuthorizeStep {
    run(instruction, next) {
        const route = instruction.getAllInstructions()
            .find(i => i.config.settings?.roles);
        if (route) {
            const userRole = getCurrentUserRole();
            if (!route.config.settings.roles.includes(userRole)) {
                return next.cancel(new Redirect('unauthorized'));
            }
        }
        return next();
    }
}`,
            language: 'typescript'
        },
        {
            title: 'Comparison',
            content: `<p>How Aurelia compares to Angular and React:</p>`,
            table: {
                headers: ['Feature', 'Aurelia', 'Angular', 'React'],
                rows: [
                    ['DI', 'Built-in, convention-based', 'Built-in, decorator-heavy', 'None (prop drilling or Context)'],
                    ['Binding', 'Adaptive two-way', 'Two-way with [(ngModel)]', 'One-way (controlled components)'],
                    ['Templates', 'Standards-based HTML', 'Extended HTML (ngIf, ngFor)', 'JSX (JavaScript)'],
                    ['Routing', 'First-class, child routers', 'First-class, lazy loading', 'Third-party (React Router)'],
                    ['Convention', 'High (filename matching)', 'Medium (NgModule declarations)', 'Low (explicit imports)'],
                    ['Bundle Size', '~60KB gzipped', '~120KB gzipped', '~40KB + router + state'],
                    ['Learning Curve', 'Low (standards-based)', 'High (many concepts)', 'Medium (ecosystem choices)'],
                    ['Ecosystem', 'Small but focused', 'Large (Google-backed)', 'Massive (Meta-backed)'],
                    ['TypeScript', 'First-class', 'Required', 'Optional'],
                    ['Web Standards', 'Strong alignment', 'Some deviation', 'JSX is non-standard']
                ]
            }
        },
        {
            title: 'Best Practices',
            content: `<ul>
<li><strong>Use conventions</strong> — Let Aurelia match view-models to views by name; avoid explicit viewStrategy unless necessary</li>
<li><strong>Leverage DI scoping</strong> — Use @inject() for singletons, @transient() for per-instance services</li>
<li><strong>Prefer .bind over .two-way</strong> — .bind adapts to context (two-way for form controls, one-way for text content)</li>
<li><strong>Use computedFrom</strong> — Declare computed property dependencies explicitly for efficient observation</li>
<li><strong>Child routers for features</strong> — Each feature area gets its own router configuration for isolation</li>
<li><strong>Value converters over template logic</strong> — Keep templates clean; move formatting to reusable converters</li>
<li><strong>Avoid direct DOM manipulation</strong> — Use bindings and custom attributes instead of querySelector in view-models</li>
<li><strong>Use EventAggregator for cross-cutting</strong> — Loosely coupled pub/sub for events across unrelated components</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>Mutating arrays without observation</strong> — push/pop are observed, but arr[index] = x is NOT. Use splice() or array mutation methods.</li>
<li><strong>Circular DI dependencies</strong> — Service A depends on B which depends on A. Use lazy injection or EventAggregator.</li>
<li><strong>Over-using two-way binding</strong> — Two-way on non-form elements creates confusing data flow. Prefer one-way + events.</li>
<li><strong>Forgetting to deactivate</strong> — Router lifecycle canDeactivate is needed to warn users about unsaved changes.</li>
<li><strong>Large view-models</strong> — Single responsibility: split into smaller custom elements rather than mega-components.</li>
<li><strong>Not using computedFrom</strong> — Without it, Aurelia dirty-checks computed properties every 120ms (performance hit).</li>
<li><strong>Ignoring Aurelia 2 migration</strong> — Aurelia 1 is maintenance-only; new projects should use Aurelia 2.</li>
</ul>`
        },
        {
            title: 'Aurelia 2 Differences',
            content: `<p>Aurelia 2 is a ground-up rewrite with modern patterns:</p>
<ul>
<li><strong>No more @inject decorator</strong> — Uses static inject property or TypeScript metadata (emitDecoratorMetadata)</li>
<li><strong>Template controllers</strong> — if.bind, repeat.for etc. are now template controllers with consistent semantics</li>
<li><strong>Shadow DOM support</strong> — Native shadow DOM encapsulation option for custom elements</li>
<li><strong>Improved performance</strong> — Proxy-based observation (no dirty checking), faster template compilation</li>
<li><strong>Better tree-shaking</strong> — Modular architecture allows smaller bundles</li>
<li><strong>Watch decorator</strong> — @watch() replaces computedFrom with cleaner syntax</li>
<li><strong>Async template compilation</strong> — Templates can be compiled ahead-of-time for faster startup</li>
</ul>`,
            code: `// Aurelia 2 - Modern syntax
import { customElement, bindable, watch } from '@aurelia/runtime-html';

@customElement({ name: 'order-total', template: '<span>\${formatted}</span>' })
export class OrderTotal {
    @bindable items: OrderItem[] = [];

    // Watch decorator replaces computedFrom
    @watch('items.length')
    get total(): number {
        return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    }

    get formatted(): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD'
        }).format(this.total);
    }
}`,
            language: 'typescript'
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>Understanding conventions</strong> — Can you explain how Aurelia reduces boilerplate vs Angular?</li>
<li><strong>DI knowledge</strong> — How does Aurelia DI compare to Angular or .NET DI containers?</li>
<li><strong>Binding system depth</strong> — Do you understand adaptive binding and observation strategies?</li>
<li><strong>Migration awareness</strong> — What is the Aurelia 1 → 2 migration path?</li>
<li><strong>Trade-off thinking</strong> — When would you choose Aurelia over Angular/React? (Smaller team, convention preference, standards alignment)</li>
<li><strong>Real project experience</strong> — Describe a complex feature you built with Aurelia (routing, DI, custom elements)</li>
</ul>`
            }
        }
    ],
    questions: [
        {
            id: 'aurelia-q1',
            level: 'junior',
            title: 'What is "convention over configuration" in Aurelia and how does it work?',
            answer: `<p>Aurelia automatically pairs view-models with views by file name convention:</p>
<ul>
<li><code>user-list.ts</code> (view-model) is automatically paired with <code>user-list.html</code> (view)</li>
<li>No need to register components in a module declaration (unlike Angular NgModule)</li>
<li>Custom elements are auto-discovered: <code>&lt;user-card&gt;</code> matches <code>user-card.ts</code> + <code>user-card.html</code></li>
<li>This reduces boilerplate significantly — you just create files with matching names and Aurelia wires them together</li>
</ul>
<p>You can override conventions with explicit configuration when needed (e.g., <code>@useView('custom-path.html')</code>), but the default handles 90% of cases.</p>`
        },
        {
            id: 'aurelia-q2',
            level: 'junior',
            title: 'How does data binding work in Aurelia? What are the binding modes?',
            answer: `<p>Aurelia has an adaptive binding system with these modes:</p>
<ul>
<li><strong>.bind</strong> — Adaptive: uses two-way for form elements (input, select), one-way for everything else</li>
<li><strong>.one-way / .to-view</strong> — Data flows from view-model to view only</li>
<li><strong>.two-way</strong> — Bidirectional: changes in either direction sync automatically</li>
<li><strong>.one-time</strong> — Binds once at initialization, then disconnects (best for static data)</li>
<li><strong>.from-view</strong> — Data flows from view to view-model only (rare, used for write-only scenarios)</li>
</ul>
<p>Example: <code>&lt;input value.bind="name"&gt;</code> — because it is an input, .bind uses two-way automatically.</p>
<p><code>&lt;p&gt;\${name}&lt;/p&gt;</code> — string interpolation is always one-way (to-view).</p>`
        },
        {
            id: 'aurelia-q3',
            level: 'mid',
            title: 'How does Aurelia dependency injection differ from Angular DI?',
            answer: `<p>Key differences:</p>
<table>
<tr><th>Aspect</th><th>Aurelia DI</th><th>Angular DI</th></tr>
<tr><td>Registration</td><td>Automatic (class = injectable)</td><td>Explicit (providers array or @Injectable)</td></tr>
<tr><td>Decorator need</td><td>Optional (@inject for ambiguous cases)</td><td>Required (@Injectable + providedIn)</td></tr>
<tr><td>Scope</td><td>Root container + child containers per component</td><td>Module injector + component injector hierarchy</td></tr>
<tr><td>Lifetime</td><td>Singleton by default, @transient for per-instance</td><td>Singleton in root, instance per component if in providers</td></tr>
<tr><td>Resolution</td><td>TypeScript metadata (type info from constructor params)</td><td>Token-based (InjectionToken + metadata)</td></tr>
</table>
<p>Aurelia DI is simpler for basic cases but less configurable for advanced multi-tenant/module-scoped scenarios. Angular DI is more powerful but more verbose.</p>`
        },
        {
            id: 'aurelia-q4',
            level: 'mid',
            title: 'What are Value Converters and how do they differ from Angular Pipes?',
            answer: `<p>Value Converters transform data in template bindings. They can be <strong>bidirectional</strong> (unlike Angular pipes which are one-way only):</p>
<ul>
<li><code>toView(value)</code> — Transforms data for display (like Angular pipe transform)</li>
<li><code>fromView(value)</code> — Transforms user input back to model format (Angular pipes cannot do this)</li>
</ul>
<p>Example use case: A currency converter that displays "$1,234.56" but parses "1234.56" from user input.</p>
<p>Key difference: Angular pipes are stateless pure functions by default. Aurelia value converters can be stateful and bidirectional, making them more powerful for form scenarios.</p>
<p>Naming convention: <code>SortValueConverter</code> in code becomes <code>| sort</code> in templates (Aurelia strips "ValueConverter" suffix).</p>`
        },
        {
            id: 'aurelia-q5',
            level: 'mid',
            title: 'Explain the Aurelia component lifecycle hooks.',
            answer: `<p>Aurelia components go through these lifecycle phases:</p>
<ol>
<li><strong>constructor()</strong> — DI resolves dependencies, instance created</li>
<li><strong>created()</strong> — View is created but not yet bound (Aurelia 2 only)</li>
<li><strong>binding()</strong> — About to start binding; can set initial values</li>
<li><strong>bound()</strong> — All bindings are connected; safe to access bound properties</li>
<li><strong>attaching()</strong> — About to attach to DOM (good for animations setup)</li>
<li><strong>attached()</strong> — In DOM; safe to measure elements, start intervals, add event listeners</li>
<li><strong>detaching()</strong> — About to leave DOM; clean up DOM-specific resources</li>
<li><strong>unbinding()</strong> — Bindings being disconnected; clean up subscriptions</li>
<li><strong>dispose()</strong> — Final cleanup (Aurelia 2); instance will be garbage collected</li>
</ol>
<p>Router adds: <code>canActivate</code>, <code>activate</code>, <code>canDeactivate</code>, <code>deactivate</code> for navigation guards.</p>`
        },
        {
            id: 'aurelia-q6',
            level: 'senior',
            title: 'How does Aurelia observation work internally and what are the performance implications?',
            answer: `<p>Aurelia uses an <strong>adaptive observation</strong> strategy — it picks the most efficient mechanism per property:</p>
<ul>
<li><strong>Getter/Setter</strong> — For plain properties, Aurelia redefines them with Object.defineProperty to intercept sets. Most efficient.</li>
<li><strong>Proxy</strong> (Aurelia 2) — Uses ES6 Proxy for deep observation of objects and arrays. Catches all mutations.</li>
<li><strong>Dirty Checking</strong> — For computed properties without @computedFrom, Aurelia polls every 120ms. This is the fallback and is expensive.</li>
<li><strong>Array observation</strong> — Patches array mutation methods (push, splice, etc.) to emit change records. Direct index assignment (arr[i] = x) is NOT observed.</li>
</ul>
<p><strong>Performance implications:</strong></p>
<ul>
<li>Always declare <code>@computedFrom('dep1', 'dep2')</code> (Aurelia 1) or <code>@watch</code> (Aurelia 2) on computed properties to avoid dirty checking</li>
<li>Use one-time bindings for static data to avoid observation overhead entirely</li>
<li>Large arrays with frequent mutations: consider manual signaling over observation</li>
</ul>`
        },
        {
            id: 'aurelia-q7',
            level: 'senior',
            title: 'How would you implement a plugin or shared library for Aurelia?',
            answer: `<p>Aurelia plugins follow a standard pattern using the <code>configure</code> function:</p>
<pre><code>// my-plugin/index.ts
import { FrameworkConfiguration } from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
    // Register global resources (custom elements, value converters, etc.)
    config.globalResources([
        './elements/data-grid',
        './elements/modal-dialog',
        './converters/date-format',
        './attributes/tooltip'
    ]);

    // Register services in DI container
    config.container.registerSingleton(NotificationService);

    // Accept plugin options
    // config.withOptions({ theme: 'dark' });
}
</code></pre>
<p>Consumer registers: <code>aurelia.use.plugin('my-plugin', { theme: 'dark' })</code></p>
<p>Best practices: export types separately for tree-shaking, use peer dependencies for aurelia-framework, provide TypeScript declarations, test with a minimal Aurelia host app.</p>`
        },
        {
            id: 'aurelia-q8',
            level: 'senior',
            title: 'When would you choose Aurelia over Angular or React for a new project?',
            answer: `<p>Choose Aurelia when:</p>
<ul>
<li><strong>Small-to-medium team values conventions</strong> — Less boilerplate = faster feature development for teams that prefer "just works" over explicit configuration</li>
<li><strong>Web standards matter</strong> — Aurelia templates are valid HTML; easier for designers to collaborate</li>
<li><strong>DI-heavy architecture</strong> — If your team thinks in DI patterns (common in .NET teams), Aurelia feels natural</li>
<li><strong>Existing Aurelia codebase</strong> — Migration from Aurelia 1 to 2 is smoother than rewriting in Angular/React</li>
<li><strong>Two-way binding is core</strong> — Form-heavy enterprise apps benefit from Aurelia bidirectional binding + value converters</li>
</ul>
<p>Choose Angular/React instead when:</p>
<ul>
<li>Hiring pool matters (Angular/React developers are 50x more available)</li>
<li>Ecosystem size is critical (UI libraries, third-party integrations)</li>
<li>Team is large (Angular module system scales better for huge codebases)</li>
<li>SSR/SSG is needed (Next.js/Nuxt/Angular Universal are more mature)</li>
</ul>`
        },
        {
            id: 'aurelia-q9',
            level: 'architect',
            title: 'How would you migrate a large Aurelia 1 application to Aurelia 2?',
            answer: `<p>Aurelia 2 is a breaking rewrite. Migration strategy:</p>
<ol>
<li><strong>Assessment</strong> — Inventory custom elements, value converters, plugins, DI registrations. Size the effort.</li>
<li><strong>Compatibility plugin</strong> — Aurelia 2 provides a compat package that bridges some Aurelia 1 APIs. Enable it first.</li>
<li><strong>Module-by-module</strong> — Migrate feature areas independently. Aurelia 2 can coexist with 1 via micro-frontend patterns if needed.</li>
<li><strong>Key changes to address:</strong>
<ul>
<li>@inject → static inject array or @inject decorator from new package</li>
<li>@computedFrom → @watch decorator</li>
<li>value-converters remain similar but import from @aurelia/runtime-html</li>
<li>Router API changed significantly — rewrite route configs</li>
<li>Plugin configure() signature changed</li>
</ul></li>
<li><strong>Testing</strong> — Aurelia 2 testing utils are different; rewrite component tests</li>
<li><strong>Incremental deploy</strong> — Use feature flags to roll out migrated sections</li>
</ol>
<p>Timeline estimate: 1-2 developers can migrate ~50 components/month with good test coverage.</p>`
        },
        {
            id: 'aurelia-q10',
            level: 'architect',
            title: 'How does Aurelia handle micro-frontends or module federation?',
            answer: `<p>Aurelia supports micro-frontend patterns through:</p>
<ul>
<li><strong>Compose element</strong> — <code>&lt;compose view-model.bind="dynamicVM"&gt;</code> can load any view-model at runtime, including from different bundles</li>
<li><strong>Child routers</strong> — Each feature area has its own router; teams can develop independently with isolated routing</li>
<li><strong>DI child containers</strong> — Create isolated containers per micro-frontend to prevent service conflicts</li>
<li><strong>Webpack Module Federation</strong> — Aurelia 2 works with module federation; expose components as remote modules</li>
<li><strong>Web Components</strong> — Aurelia 2 can compile custom elements to native web components, consumable by any framework</li>
</ul>
<p>Architecture pattern for enterprise: shell app (Aurelia router + shared services) loads feature bundles dynamically. Each team owns a feature bundle with its own build pipeline. Shared design system as a plugin.</p>`
        }
    ]
});
