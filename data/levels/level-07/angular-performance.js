/* ═══════════════════════════════════════════════════════════════════
   ANGULAR PERFORMANCE — Level 7: Angular (Angular Advanced)
   Change detection, OnPush, signals, trackBy, lazy loading, @defer,
   bundle size, zoneless, and runtime optimization.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('angular-performance', {

    title: 'Angular Performance',
    level: 7,
    group: 'angular-advanced',
    description: 'Optimizing Angular apps: change detection and OnPush, signals, trackBy, lazy loading and @defer, bundle size, zoneless change detection, and runtime profiling.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['angular-core', 'angular-rxjs'],

    sections: [

        {
            title: 'Introduction',
            content: `<p>Angular performance work splits into two halves: <strong>runtime</strong> performance (how
            efficiently the app updates the DOM via change detection) and <strong>load</strong> performance (how
            fast the bundle downloads and boots). Modern Angular gives you powerful levers for both: OnPush,
            signals, lazy loading, deferrable views, and even zoneless change detection.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>How change detection works and why it can be slow</li>
                <li>OnPush change detection and signals</li>
                <li>trackBy for efficient list rendering</li>
                <li>Lazy loading routes and deferrable views (@defer)</li>
                <li>Reducing bundle size</li>
                <li>Zoneless change detection and where Angular is heading</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Change Detection</h4>
            <p>Angular checks component bindings and updates the DOM when something may have changed. By default
            (Zone.js), any async event (click, HTTP, timer) triggers a check of the whole component tree.</p>
            <h4>OnPush</h4>
            <p>A change-detection strategy that only re-checks a component when its <code>@Input</code> references
            change, an event fires within it, or an observable it subscribes to (via async pipe) emits. This skips
            large subtrees, dramatically reducing work.</p>
            <h4>Signals</h4>
            <p>Angular's reactive primitive (v16+). Reading a signal in a template creates a fine-grained dependency,
            so only the views that depend on a changed signal update — enabling precise, efficient updates and the
            path to zoneless apps.</p>
            <h4>trackBy</h4>
            <p>Tells <code>*ngFor</code> how to identify items so Angular reuses DOM nodes instead of destroying and
            recreating them when a list changes.</p>
            <h4>Lazy Loading &amp; @defer</h4>
            <p>Lazy-loaded routes split code into chunks loaded on demand. Deferrable views (<code>@defer</code>)
            lazy-load parts of a template based on triggers (viewport, interaction, idle).</p>`,
            mermaid: `graph TB
    Event[Async event: click/HTTP/timer] --> Zone[Zone.js notices]
    Zone --> CD{Change Detection}
    CD -->|Default| All[Check entire component tree]
    CD -->|OnPush| Some[Check only changed-input subtrees]
    Signals[Signals] -->|fine-grained| Precise[Update only dependent views]`
        },
        {
            title: 'How It Works',
            content: `<p>With the default strategy, Zone.js patches async APIs and tells Angular to run change detection
            after any async event, checking every component from root down. In a large app this is wasteful — most
            components didn't change.</p>
            <p><strong>OnPush</strong> narrows this: a component is only re-checked when its input references change
            (new object/value), an event originates inside it, or an async-piped observable emits. Combined with
            immutable data, this skips huge subtrees.</p>
            <p><strong>Signals</strong> go further: the framework tracks exactly which template expressions read which
            signals, so only those expressions re-evaluate when a signal changes — no tree walking at all.</p>`,
            code: `import { Component, ChangeDetectionStrategy, signal, computed, input } from '@angular/core';

@Component({
  selector: 'app-cart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,   // skip unless inputs change
  template: \`
    <p>Items: {{ count() }}</p>
    <p>Total: {{ total() }}</p>
  \`
})
export class CartComponent {
  // Signals: reads in the template create fine-grained dependencies
  items = signal<CartItem[]>([]);
  count = computed(() => this.items().length);
  total = computed(() =>
    this.items().reduce((sum, i) => sum + i.price * i.qty, 0));

  addItem(item: CartItem) {
    // Update via immutable replacement so OnPush + signals react
    this.items.update(list => [...list, item]);
  }
}`,
            language: 'typescript'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Lazy loading splits the bundle so initial load is small:</p>`,
            mermaid: `graph LR
    Initial[Initial bundle: shell + home] -->|user navigates| R1[Lazy: /admin chunk]
    Initial -->|user navigates| R2[Lazy: /reports chunk]
    Initial -->|scrolls into view| D1["@defer block: heavy chart"]
    style Initial fill:#bbf7d0,color:#1e293b
    style R1 fill:#fde68a,color:#1e293b
    style R2 fill:#fde68a,color:#1e293b
    style D1 fill:#dbeafe,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Key optimization techniques in practice:</p>`,
            tabs: [
                {
                    label: 'trackBy',
                    code: `@Component({
  template: \`
    <div *ngFor="let user of users; trackBy: trackById">
      {{ user.name }}
    </div>
  \`
})
export class UserListComponent {
  users: User[] = [];

  // Without trackBy, replacing the array re-creates every DOM node.
  // With trackBy, Angular reuses nodes whose id is unchanged.
  trackById = (_: number, user: User) => user.id;
}

// In modern control flow (@for), track is required:
// @for (user of users; track user.id) { <div>{{ user.name }}</div> }`,
                    language: 'typescript'
                },
                {
                    label: 'Lazy Routes + @defer',
                    code: `// Lazy-loaded route: /admin code is a separate chunk loaded on demand
export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component')
      .then(m => m.AdminComponent)
  }
];

// Deferrable view: load a heavy component only when it scrolls into view
// (in a standalone component template)
// @defer (on viewport) {
//   <app-heavy-chart [data]="data" />
// } @placeholder {
//   <div class="skeleton">Loading chart...</div>
// } @loading (minimum 200ms) {
//   <app-spinner />
// }`,
                    language: 'typescript'
                },
                {
                    label: 'Zoneless (v18+)',
                    code: `// Zoneless change detection removes Zone.js; updates are driven by signals,
// async pipe, and explicit markers. Smaller bundle, more predictable CD.
import { bootstrapApplication } from '@angular/platform-browser';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection()
  ]
});
// In zoneless mode, prefer signals for state so the framework knows
// precisely what changed and when to update the DOM.`,
                    language: 'typescript'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Use OnPush (or Signals) by Default</h4>
            <p>Make OnPush your default change-detection strategy and drive state with immutable updates or signals.
            This avoids checking unchanged subtrees.</p>
            <h4>Do: Always Provide trackBy / track</h4>
            <p>For any list that changes, give Angular a stable identity so it reuses DOM nodes instead of rebuilding
            the list.</p>
            <h4>Do: Lazy-Load Routes and Defer Heavy UI</h4>
            <p>Split rarely-used features into lazy chunks and use <code>@defer</code> for expensive below-the-fold
            components.</p>
            <h4>Do: Unsubscribe / Use async Pipe</h4>
            <p>Leaked subscriptions cause memory growth and redundant work. Prefer the async pipe or takeUntilDestroyed.</p>
            <h4>Do: Profile Before Optimizing</h4>
            <p>Use Angular DevTools' profiler and Chrome Performance to find the real bottleneck rather than guessing.</p>`,
            callout: {
                type: 'tip',
                title: 'Signals Are the Future',
                text: 'Angular is steadily moving toward signal-based, zoneless change detection. New components are well-served defaulting to signals for state and OnPush \u2014 it gives fine-grained updates today and a smooth path to zoneless apps.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Function Calls in Templates</h4>
            <p><code>{{ computeExpensive() }}</code> runs on every change detection cycle. Use a signal/computed,
            a pure pipe, or a precomputed property instead.</p>
            <h4>Mistake: No trackBy on Large Lists</h4>
            <p>Without trackBy, updating the array destroys and recreates every row — slow and loses focus/scroll
            state.</p>
            <h4>Mistake: Mutating Inputs with OnPush</h4>
            <p>OnPush detects new <em>references</em>. Mutating an array/object in place (push) won't trigger an
            update. Replace references immutably.</p>
            <h4>Mistake: Leaking Subscriptions</h4>
            <p>Forgetting to unsubscribe keeps observers and components alive, leaking memory and doing wasted work.</p>
            <h4>Mistake: Shipping a Giant Bundle</h4>
            <p>Eagerly importing everything (large libs, all routes) bloats the initial download. Lazy-load and
            analyze the bundle.</p>`,
            code: `// SLOW: method called on every CD cycle
// template: {{ getTotal() }}
getTotal() { return this.items.reduce((s, i) => s + i.price, 0); }

// FAST: computed signal recalculates only when items change
total = computed(() => this.items().reduce((s, i) => s + i.price, 0));
// template: {{ total() }}

// OnPush trap: in-place mutation is NOT detected
this.items.push(newItem);                 // no update with OnPush
this.items = [...this.items, newItem];    // new reference -> updates`,
            language: 'typescript'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Large Dashboards</h4>
            <p>Data-heavy dashboards use OnPush + signals + trackBy + virtual scrolling to stay responsive with
            thousands of rows and frequent updates.</p>
            <h4>Content Sites &amp; Marketing Pages</h4>
            <p>Lazy loading and @defer keep initial load tiny, improving Core Web Vitals (LCP, TBT) and SEO.</p>
            <h4>Enterprise Apps</h4>
            <p>Route-level lazy loading splits a sprawling app into per-feature chunks so users only download the
            modules they use.</p>
            <h4>Real-Time UIs</h4>
            <p>Live data (trading, monitoring, live odds) leans on signals/OnPush so only the cells that changed
            re-render, not the whole grid.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Change detection strategies compared:</p>`,
            table: {
                headers: ['Aspect', 'Default (Zone.js)', 'OnPush', 'Signals / Zoneless'],
                rows: [
                    ['Trigger', 'Any async event', 'Input ref change / event / async pipe', 'Signal change'],
                    ['Scope checked', 'Whole tree', 'Component + ancestors path', 'Only dependent views'],
                    ['Efficiency', 'Lowest', 'High', 'Highest (fine-grained)'],
                    ['Mental model', 'Simple', 'Immutability required', 'Reactive primitives'],
                    ['Bundle (Zone.js)', 'Includes Zone.js', 'Includes Zone.js', 'Can drop Zone.js'],
                    ['Maturity', 'Stable', 'Stable', 'Stable signals; zoneless emerging'],
                    ['Best for', 'Small/simple apps', 'Most apps', 'New, performance-sensitive apps']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>The biggest wins, in rough priority order:</p>
            <h4>Runtime</h4>
            <ul>
                <li><strong>OnPush + immutable data / signals:</strong> stop checking unchanged subtrees</li>
                <li><strong>trackBy / track:</strong> reuse DOM nodes in lists</li>
                <li><strong>Avoid template function calls:</strong> use computed/pure pipes</li>
                <li><strong>Virtual scrolling (CDK):</strong> render only visible rows in huge lists</li>
            </ul>
            <h4>Load</h4>
            <ul>
                <li><strong>Lazy-load routes</strong> and <strong>@defer</strong> heavy components</li>
                <li><strong>Bundle analysis</strong> (source-map-explorer) to find bloat</li>
                <li><strong>Tree-shakable imports</strong> and avoiding huge dependencies</li>
                <li><strong>SSR/hydration</strong> for fast first paint where appropriate</li>
            </ul>
            <h4>Measure</h4>
            <p>Use Angular DevTools profiler for CD hotspots and Lighthouse/Web Vitals for load metrics. Optimize
            what the data shows, not assumptions.</p>`,
            callout: {
                type: 'warning',
                title: 'Functions in Templates Are a Trap',
                text: 'A method bound in a template (e.g., {{ filterItems() }}) executes on every change-detection cycle \u2014 potentially many times per second. Replace it with a computed signal, a memoized value, or a pure pipe to avoid repeated work.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Verify performance characteristics, not just correctness.</p>
            <h4>Assert OnPush Behavior</h4>
            <p>Test that mutating an input in place does NOT update (and replacing it does), documenting the
            immutability contract.</p>
            <h4>Profile in CI (optional)</h4>
            <p>Track bundle size budgets in angular.json so a PR that bloats the bundle fails the build.</p>`,
            code: `// angular.json budgets fail the build if bundles exceed limits
// "budgets": [
//   { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" },
//   { "type": "anyComponentStyle", "maximumWarning": "2kb" }
// ]

// Test documenting OnPush immutability contract
it('updates only when the input reference changes', () => {
  fixture.componentRef.setInput('items', [{ id: 1 }]);
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('1 item');
});`,
            language: 'typescript'
        },
        {
            title: 'Interview Tips',
            content: `<p>Performance is a senior-level Angular differentiator:</p>
            <ul>
                <li><strong>Explain change detection</strong> and how OnPush narrows it</li>
                <li><strong>Describe signals</strong> and fine-grained reactivity vs Zone.js tree-walking</li>
                <li><strong>Know trackBy</strong> and why it matters for lists</li>
                <li><strong>Discuss lazy loading and @defer</strong> for load performance</li>
                <li><strong>Name the template-function-call pitfall</strong> — a very common real-world issue</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Senior Signal',
                text: 'Mentioning that you profile with Angular DevTools before optimizing \u2014 and that OnPush requires immutable updates to work \u2014 signals real production experience rather than cargo-culted advice.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Docs</h4>
            <ul>
                <li>Angular signals: angular.dev/guide/signals</li>
                <li>Deferrable views: angular.dev/guide/defer</li>
                <li>Change detection &amp; zoneless: angular.dev/guide/zoneless</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li>Angular DevTools (profiler)</li>
                <li>source-map-explorer / webpack-bundle-analyzer</li>
                <li>Lighthouse / Web Vitals</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Default CD checks the whole tree;</strong> OnPush checks only changed-input subtrees</li>
                <li><strong>Signals</strong> give fine-grained updates and the path to zoneless apps</li>
                <li><strong>OnPush requires immutable updates</strong> — replace references, don't mutate</li>
                <li><strong>Always use trackBy/track</strong> on dynamic lists to reuse DOM nodes</li>
                <li><strong>Lazy-load routes and @defer</strong> heavy components for fast initial load</li>
                <li><strong>Avoid function calls in templates</strong> — use computed/pure pipes</li>
                <li><strong>Profile first</strong> (Angular DevTools, Lighthouse) before optimizing</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Optimize a Slow List Page</h4>
            <ol>
                <li>Start with a component rendering 5,000 rows, Default CD, a template method for totals, no trackBy</li>
                <li>Profile it with Angular DevTools and note the change-detection cost</li>
                <li>Switch to OnPush and make state updates immutable</li>
                <li>Add trackBy/track to the list</li>
                <li>Replace the template method with a computed signal</li>
                <li>Add CDK virtual scrolling; re-profile and quantify the improvement</li>
            </ol>`,
            code: `// Before: <div *ngFor="let r of rows">{{ formatRow(r) }}</div>  (Default CD)
// TODO:
// 1. changeDetection: ChangeDetectionStrategy.OnPush
// 2. rows = signal<Row[]>([]); update immutably
// 3. @for (r of rows(); track r.id) { ... }
// 4. precomputed = computed(() => ...) instead of formatRow()
// 5. <cdk-virtual-scroll-viewport> for the 5000 rows
// Measure CD time before/after in Angular DevTools.`,
            language: 'typescript'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What triggers change detection with the default strategy vs OnPush?<br/>
                    <em>A: Default: any async event (click, HTTP, timer) checks the whole tree. OnPush: only when an
                    @Input reference changes, an event fires within the component, or an async-piped observable emits.</em></li>
                <li><strong>Q:</strong> Why must OnPush components use immutable updates?<br/>
                    <em>A: OnPush detects changes by comparing input references. Mutating an object/array in place keeps
                    the same reference, so the change isn't detected. You must assign a new reference.</em></li>
                <li><strong>Q:</strong> What does trackBy do and why does it matter?<br/>
                    <em>A: It gives *ngFor a stable identity per item so Angular reuses existing DOM nodes instead of
                    destroying and recreating the whole list — faster and preserves focus/scroll state.</em></li>
                <li><strong>Q:</strong> Why are method calls in templates a performance concern?<br/>
                    <em>A: They execute on every change-detection cycle, potentially many times per second. Use a
                    computed signal, memoized value, or pure pipe instead.</em></li>
            </ol>`
        }
    ],
    questions: [
        {"question":"How does OnPush change detection work, and when should you use it?","difficulty":"hard","answer":"<p>By default Angular checks every component on each change-detection cycle. With <strong>ChangeDetectionStrategy.OnPush</strong>, a component is only re-checked when: an <code>@Input</code> reference changes, an event fires within it, an observable bound via the async pipe emits, or you manually mark it. This skips re-checking large subtrees whose inputs did not change, greatly reducing work in big apps.</p><p>Use OnPush with <strong>immutable data</strong> and reference changes (new object/array rather than mutation), or with signals. It is a key performance lever, but requires discipline: mutating an input in place will not trigger an update under OnPush.</p>","explanation":"Default change detection re-inspects every room in the house on any noise. OnPush only re-inspects a room when its door handle (input reference) actually changes — far less work, as long as you replace items rather than quietly editing them.","bestPractices":["Adopt OnPush with immutable data / new references","Combine with async pipe and signals","Avoid in-place mutation of @Input objects"],"commonMistakes":["Mutating an input object in place (no update under OnPush)","Expecting OnPush to detect deep mutations","Not using immutable updates"],"interviewTip":"List the four OnPush triggers (input ref change, event, async pipe emit, manual mark) and stress immutability — mutating in place is the classic OnPush bug.","followUp":["How do signals interact with OnPush?","How do you manually trigger detection (markForCheck)?","What is zoneless change detection?"]},
        {"question":"What causes poor Angular runtime performance, and how do you diagnose and fix it?","difficulty":"hard","answer":"<p>Common causes: excessive change-detection work (default strategy on large trees, heavy method/getter calls in templates), <code>*ngFor</code> without <code>trackBy</code> (re-rendering whole lists), large eager bundles (slow load), memory leaks from unsubscribed observables, and heavy synchronous work on the main thread.</p><p>Fixes: use <strong>OnPush</strong> (or signals) to limit change detection; add <strong>trackBy</strong> to lists so only changed items re-render; avoid function calls in templates (precompute or use pure pipes); <strong>lazy-load</strong> features and use preloading; virtualize long lists (CDK virtual scroll); and profile with Angular DevTools' change-detection profiler and browser performance tools to find the real hot spot before optimizing.</p>","explanation":"It is like a sluggish kitchen: stop re-cooking dishes nobody changed (OnPush), label plates so you only remake the changed ones (trackBy), and prep ingredients only when ordered (lazy load). Measure which station is slow before rearranging the whole kitchen.","bestPractices":["OnPush/signals + trackBy on lists","No function calls in templates; use pure pipes/precomputed values","Lazy-load and virtualize long lists; profile with Angular DevTools"],"commonMistakes":["*ngFor without trackBy","Calling functions/getters in templates each cycle","Optimizing without profiling first"],"interviewTip":"Give a prioritized, diagnosable list (OnPush, trackBy, no template functions, lazy load, virtual scroll) and stress profiling with Angular DevTools before optimizing.","followUp":["Why is trackBy important?","Why avoid function calls in templates?","What is CDK virtual scrolling?"]},
        {
            question: 'What is the OnPush change detection strategy and when does a component update under it?',
            difficulty: 'easy',
            answer: `<p><strong>OnPush</strong> tells Angular to skip checking a component unless something it depends on
            actually changed. An OnPush component is re-checked when: an <code>@Input</code> reference changes, an
            event fires from within the component, an async-piped Observable it uses emits, or a signal it reads
            changes. This skips large unchanged subtrees, reducing change-detection work.</p>`,
            explanation: 'Default change detection is like re-reading every page of a book after any noise in the room. OnPush only re-reads a page when you are told that specific page changed.',
            bestPractices: ['Default to OnPush', 'Use immutable updates so reference changes are detected', 'Prefer the async pipe for observables'],
            commonMistakes: ['Mutating inputs in place (not detected)', 'Expecting OnPush to detect deep mutations'],
            interviewTip: 'List the exact triggers (input ref change, internal event, async pipe emit, signal change) — precision here signals real understanding.',
            followUp: ['How do signals interact with OnPush?', 'Why does in-place mutation break OnPush?']
        },
        {
            question: 'How do Angular signals improve performance compared to Zone.js change detection?',
            difficulty: 'medium',
            answer: `<p>With Zone.js, any async event triggers change detection that walks the component tree checking
            bindings — even components that didn't change. <strong>Signals</strong> provide fine-grained reactivity:
            when you read a signal in a template, Angular records that exact dependency. When the signal changes, only
            the views that read it update — no tree walking.</p>
            <p>This means fewer, more precise DOM updates, and it enables <strong>zoneless</strong> apps that drop
            Zone.js entirely (smaller bundle, more predictable behavior).</p>`,
            explanation: 'Zone.js is like ringing a bell that makes everyone in the building re-check their work after any event. Signals are like a wire connecting each light switch only to the lamp it controls — flip one and only that lamp reacts.',
            code: `count = signal(0);
double = computed(() => this.count() * 2);   // recomputes only when count changes
increment() { this.count.update(c => c + 1); }
// Template reading {{ double() }} updates only that expression on change.`,
            language: 'typescript',
            bestPractices: ['Use signals for component state', 'Use computed for derived values', 'Combine signals with OnPush (or zoneless)'],
            commonMistakes: ['Mixing heavy Zone.js patterns with signals unnecessarily', 'Calling signal setters in a way that creates feedback loops'],
            interviewTip: 'Contrast tree-walking (Zone.js) with fine-grained dependency tracking (signals) — that contrast is the core of the answer.',
            followUp: ['What is computed and how does it memoize?', 'What does zoneless change detection require?']
        },
        {
            question: 'A large Angular app has a slow, janky list view. Walk through how you would diagnose and fix it.',
            difficulty: 'hard',
            answer: `<p>A measurement-first process:</p>
            <ol>
                <li><strong>Profile:</strong> use Angular DevTools' profiler to see change-detection frequency and
                cost, and Chrome Performance for layout/paint. Confirm CD (not network/layout) is the bottleneck.</li>
                <li><strong>Eliminate template function calls:</strong> replace any <code>{{ method() }}</code> with
                computed signals or pure pipes so work isn't repeated every cycle.</li>
                <li><strong>Add trackBy/track:</strong> so list updates reuse DOM nodes instead of rebuilding all rows.</li>
                <li><strong>Adopt OnPush + immutable updates (or signals):</strong> stop re-checking unchanged subtrees.</li>
                <li><strong>Virtualize:</strong> use CDK virtual scrolling so only visible rows render for very large
                lists.</li>
                <li><strong>Re-profile:</strong> quantify the improvement and stop when it meets the target.</li>
            </ol>
            <p>For load-time jank, also lazy-load the route and @defer heavy child components.</p>`,
            explanation: 'Like diagnosing a slow checkout line: first watch where the delay actually happens (profile), then fix the specific causes — a cashier re-scanning every item (template methods), rebuilding the whole queue on each change (no trackBy), and checking lanes that have not changed (no OnPush) — and finally only staff the lanes customers are actually using (virtual scrolling).',
            code: `// Common fixes applied together:
@Component({ changeDetection: ChangeDetectionStrategy.OnPush, /* ... */ })
class ListComponent {
  rows = signal<Row[]>([]);
  visibleTotal = computed(() => this.rows().reduce((s, r) => s + r.value, 0));
  // template:
  // <cdk-virtual-scroll-viewport itemSize="48">
  //   <div *cdkVirtualFor="let r of rows(); trackBy: trackById">{{ r.label }}</div>
  // </cdk-virtual-scroll-viewport>
  trackById = (_: number, r: Row) => r.id;
}`,
            language: 'typescript',
            bestPractices: ['Profile before changing anything', 'Fix template function calls and add trackBy first (cheap, high impact)', 'OnPush/signals to cut CD scope', 'Virtual scrolling for very large lists', 'Re-measure after each change'],
            commonMistakes: ['Guessing at the cause without profiling', 'Adding virtual scrolling but leaving expensive template methods', 'Forgetting immutable updates after switching to OnPush'],
            interviewTip: 'Lead with "profile first" and present an ordered plan from cheapest/highest-impact (trackBy, template methods) to structural (OnPush, virtualization). Ordered, measured reasoning is the senior signal.',
            followUp: ['How does CDK virtual scrolling work?', 'How would you set a bundle-size budget to prevent regressions?'],
            seniorPerspective: 'I resist the urge to sprinkle OnPush everywhere as a first move. The profiler usually reveals one or two dominant costs \u2014 a method called in a template thousands of times per second, or a list rebuilding all nodes because trackBy is missing. Fixing those is often a bigger, cheaper win than a broad change-detection rewrite. I virtualize only when the row count genuinely demands it, and I lock in gains with a CI bundle/CD budget so the next PR cannot silently regress them.'
        },
        {
            question: 'How do deferrable views (@defer) work, what triggers are available, and how do you avoid hurting Core Web Vitals?',
            difficulty: 'medium',
            answer: `<p><code>@defer</code> (Angular 17+) lazy-loads the components inside its block into a separate chunk that is only fetched and rendered when a <strong>trigger</strong> fires. It has four block types: the main block, <code>@placeholder</code> (shown before load), <code>@loading</code> (shown while fetching), and <code>@error</code> (shown on failure).</p>
            <p>Triggers include <code>on idle</code> (default), <code>on viewport</code>, <code>on interaction</code>, <code>on hover</code>, <code>on timer(ms)</code>, and <code>when condition</code>. A separate <code>prefetch</code> trigger can fetch the chunk early without rendering. To protect CWV: never defer above-the-fold/LCP content, reserve placeholder space to avoid layout shift (CLS), and prefetch on idle so deferred content feels instant when reached.</p>`,
            explanation: '@defer is a curtain over part of the stage: the actors (and their code) only get called on when the audience looks that way (viewport), clicks (interaction), or after the show settles (idle). Prefetch is bringing the actors backstage in advance so there is no awkward pause when the curtain rises.',
            code: `// In a standalone component template (the deferred component is its own chunk):
//
// @defer (on viewport; prefetch on idle) {
//   <app-analytics-chart [data]="data()" />
// } @placeholder (minimum 300ms) {
//   <div class="chart-skeleton" style="height:320px"></div>   <!-- reserve space: no CLS -->
// } @loading (after 100ms; minimum 200ms) {
//   <app-spinner />
// } @error {
//   <p>Chart failed to load.</p>
// }
//
// Other triggers:
// @defer (on interaction) { ... }            // load when user clicks/keys the placeholder
// @defer (on hover) { ... }                  // load on hover
// @defer (on timer(2s)) { ... }              // load after a delay
// @defer (when isReady()) { ... }            // load when a signal/expression turns true

import { Component, signal } from '@angular/core';
@Component({ selector: 'app-dash', standalone: true, template: '' })
export class DashComponent {
  data = signal<number[]>([]);
  isReady = signal(false);
}`,
            language: 'typescript',
            bestPractices: [
                'Defer heavy, below-the-fold components (charts, maps, rich editors)',
                'Always reserve placeholder space to prevent cumulative layout shift',
                'Use prefetch (on idle/hover) so deferred content is ready before it is shown',
                'Pick the trigger that matches intent: viewport for scroll, interaction for click-to-reveal'
            ],
            commonMistakes: [
                'Deferring above-the-fold/LCP content, hurting perceived load',
                'Omitting a sized placeholder, causing layout shift when the block loads',
                'Deferring a component that is also eagerly imported elsewhere (no chunk split)',
                'Using @defer for trivially small components where the chunk overhead is not worth it'
            ],
            interviewTip: 'Name the four blocks (main/placeholder/loading/error) and the trigger list (idle, viewport, interaction, hover, timer, when), then connect it to CWV: placeholder sizing prevents CLS, and never defer the LCP element.',
            followUp: ['How does prefetch differ from the main trigger?', 'Why must the deferred component not be eagerly imported elsewhere?'],
            seniorPerspective: 'My pattern for dashboards is @defer (on viewport; prefetch on idle) around each heavy widget with a correctly sized skeleton. That trims initial JS substantially while the prefetch makes scrolling feel instant, and the sized placeholder keeps CLS near zero — which is the part people forget.',
            architectPerspective: '@defer brings code-splitting down to template granularity, so partitioning is no longer tied to routes. I treat each deferred block as a budgeted chunk and decide split boundaries by weight and visibility, the same way I reason about lazy routes — it is bundle architecture expressed in the template.'
        },
        {
            question: 'What is zoneless change detection, what does it require from your code, and how does it differ from Zone.js?',
            difficulty: 'hard',
            answer: `<p>By default Angular ships <strong>Zone.js</strong>, which monkey-patches async APIs (timers, events, XHR) and tells Angular to run change detection after any of them — checking the tree broadly. <strong>Zoneless</strong> mode (<code>provideExperimentalZonelessChangeDetection()</code>, Angular 18+) removes Zone.js: the framework no longer guesses when something changed.</p>
            <p>Instead, change detection is scheduled by explicit reactive signals: <code>signal</code> updates, the <code>async</code> pipe, <code>markForCheck()</code>, and template event bindings. This requires that all state that affects the view flows through these mechanisms — a plain mutated field updated in a <code>setTimeout</code> will not refresh the view. Benefits: a smaller bundle (no Zone.js), more predictable and fewer change-detection runs, and cleaner stack traces.</p>`,
            explanation: 'Zone.js is a smoke alarm that blares on any kitchen activity, prompting everyone to re-check everything. Zoneless removes the alarm and instead wires each appliance to report only its own status change. Quieter and more precise — but anything not wired in (a field you mutate off to the side) goes unnoticed.',
            code: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideExperimentalZonelessChangeDetection, Component, signal, ChangeDetectionStrategy } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [ provideExperimentalZonelessChangeDetection() ]  // drop Zone.js
});

@Component({
  selector: 'app-clock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // template: '<p>{{ time() }}</p>'
})
export class ClockComponent {
  time = signal(new Date().toLocaleTimeString());

  constructor() {
    // Works zoneless: signal.set() schedules change detection itself
    setInterval(() => this.time.set(new Date().toLocaleTimeString()), 1000);

    // WOULD NOT update the view zoneless (plain field, no signal/markForCheck):
    // setInterval(() => { this.plain = Date.now(); }, 1000);
  }
}`,
            language: 'typescript',
            bestPractices: [
                'Drive all view-affecting state through signals, async pipe, or events',
                'Use OnPush + signals as the on-ramp to zoneless before flipping the provider',
                'Audit setTimeout/setInterval/third-party callbacks that mutate plain fields',
                'Verify third-party libraries do not rely on Zone.js to trigger updates'
            ],
            commonMistakes: [
                'Mutating plain component fields in async callbacks and expecting the view to update',
                'Assuming every library works zoneless (some depend on Zone.js patching)',
                'Flipping to zoneless without first adopting signals/OnPush consistently',
                'Forgetting markForCheck() when bridging non-signal async sources to the view'
            ],
            interviewTip: 'Contrast "Zone.js guesses when to check (broad)" with "zoneless is told what changed (precise, via signals/async pipe/events)." The practical consequence to state: plain fields mutated outside these mechanisms will not refresh the view.',
            followUp: ['How do you migrate an existing app toward zoneless safely?', 'What happens to a third-party library that relies on Zone.js?'],
            seniorPerspective: 'I treat "OnPush + signals everywhere" as the migration path: once a feature is fully signal-driven, turning on zoneless is almost a no-op. The risk I scrutinize is third-party widgets and stray setTimeout field mutations — those are exactly what silently stop updating, so I grep for them before enabling it.',
            architectPerspective: 'Zoneless is the endgame of Angular\'s reactivity shift: change detection becomes a function of the signal graph rather than a global async sweep. Strategically it means a smaller runtime, predictable CD cost, and better interop with non-Angular code — but it makes "all view state must be reactive" a hard architectural constraint, which I bake into team conventions early.'
        },
        {
            question: 'Beyond runtime change detection, how do you analyze and reduce Angular bundle size for fast load performance?',
            difficulty: 'advanced',
            answer: `<p>Load performance is about shipping less JavaScript and shipping it later. The toolkit:</p>
            <ul>
                <li><strong>Measure first:</strong> <code>ng build --stats-json</code> + source-map-explorer / webpack-bundle-analyzer to see what dominates the bundle.</li>
                <li><strong>Lazy-load routes</strong> and <strong>@defer</strong> heavy components so the initial chunk stays small.</li>
                <li><strong>Tree-shaking:</strong> use ES module imports, <code>providedIn: 'root'</code> services, and avoid importing whole libraries (import only the lodash function, not all of lodash).</li>
                <li><strong>Budgets</strong> in <code>angular.json</code> fail the build when bundles exceed limits, preventing regressions.</li>
                <li><strong>SSR + hydration</strong> for fast first paint, and replace heavy dependencies (moment -> date-fns/Temporal) where possible.</li>
            </ul>`,
            explanation: 'Bundle optimization is like packing for a trip: weigh the suitcase first (analyzer) to see what is heavy, leave rarely used items at home to ship later (lazy load / defer), pack only the specific tools you need rather than the whole toolbox (tree-shaking), and put a luggage weight limit on the scale so you never over-pack again (budgets).',
            code: `// angular.json — budgets fail the build on regression
// "budgets": [
//   { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" },
//   { "type": "anyComponentStyle", "maximumWarning": "4kb" }
// ]

// Analyze what is in the bundle:
//   ng build --configuration production --stats-json
//   npx source-map-explorer dist/app/browser/*.js

// Tree-shakable imports: bring in only what you use
import { debounce } from 'lodash-es';     // GOOD: ES module, shakeable
// import _ from 'lodash';                 // BAD: pulls the whole library

// Lazy route keeps admin code out of the initial chunk
export const routes: Routes = [
  { path: '', loadComponent: () => import('./home.component').then(m => m.HomeComponent) },
  { path: 'admin', loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES) },
];

// SSR for fast first paint (Angular hydration is non-destructive)
// main.server.ts + provideClientHydration() on the client`,
            language: 'typescript',
            bestPractices: [
                'Profile the bundle before optimizing (stats-json + source-map-explorer)',
                'Set and enforce angular.json budgets in CI to prevent silent growth',
                'Lazy-load routes and @defer heavy components; tree-shake imports',
                'Swap heavy dependencies for lighter ones and add SSR/hydration for first paint'
            ],
            commonMistakes: [
                'Default/namespace-importing large libraries, defeating tree-shaking',
                'Eagerly importing a "lazy" component elsewhere, so it never splits',
                'No bundle budgets, letting initial size creep up release after release',
                'Optimizing by guesswork instead of reading the analyzer output'
            ],
            interviewTip: 'Lead with "measure first" (stats-json + analyzer), then give an ordered toolkit: lazy load / @defer, tree-shakable imports, budgets in CI, dependency swaps, SSR. Quantify with a before/after initial-bundle number if you can.',
            followUp: ['How do CI budgets prevent bundle regressions?', 'When is SSR worth the added complexity?'],
            seniorPerspective: 'The highest-leverage move I make on a bloated app is wiring source-map-explorer into the workflow and adding angular.json budgets to CI. Almost every time, the analyzer reveals one or two oversized dependencies or an accidentally-eager import doing most of the damage — far more impactful than micro-optimizing components.',
            architectPerspective: 'Bundle size is a shared resource that degrades silently without enforcement, so I make it a build-time contract via budgets rather than a periodic cleanup. Combined with route/@defer splitting and SSR for first paint, the goal is a small, predictable initial payload that stays small as the app and the number of contributing teams grow.'
        }
    ]
});
