/* ═══════════════════════════════════════════════════════════════════
   Angular — Components, Signals, Change Detection, Lifecycle
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('angular-core', {
    title: 'Angular Components & Signals',
    description: 'Modern Angular 17+ component patterns — standalone components, signals, input/output, change detection strategies, lifecycle hooks, and the shift from zone.js to signal-based reactivity.',
    quickRecall: [
        'Standalone components: no NgModule needed, imports declared per-component',
        'Signals: synchronous reactive primitives — signal(), computed(), effect()',
        'Observables: async streams for HTTP, WebSocket, complex event chains',
        'OnPush change detection: only checks on input reference change or signal',
        'input() / output(): signal-based replacements for @Input/@Output decorators',
        'Signals + OnPush = optimal performance with fine-grained reactivity'
    ],
    sections: [
        {
            title: 'Standalone Components (Angular 17+)',
            content: `<p><strong>Standalone components</strong> are the default in Angular 17+. They eliminate NgModules for most use cases — each component declares its own dependencies directly via the <code>imports</code> array.</p>`,
            code: `// Standalone component (no NgModule needed)
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: \`
    <div class="user-card">
      <h3>{{ user().name }}</h3>
      <p>{{ user().email }}</p>
      <p>Joined: {{ user().createdAt | date:'mediumDate' }}</p>
      <button (click)="edit.emit(user())">Edit</button>
    </div>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCardComponent {
  // Signal-based input (Angular 17.1+)
  user = input.required<User>();
  
  // Output
  edit = output<User>();
}

// Bootstrapping without AppModule:
// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
  ]
});

// Lazy loading with standalone:
const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component')
      .then(m => m.AdminComponent)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/routes')
      .then(m => m.DASHBOARD_ROUTES)
  }
];`,
            language: 'typescript'
        },
        {
            title: 'Signals — The New Reactivity Model',
            content: `<p><strong>Signals</strong> (Angular 16+) are reactive primitives that notify consumers when their value changes. They replace many uses of RxJS BehaviorSubjects and enable fine-grained change detection without zone.js.</p>`,
            code: `// Signal basics
import { signal, computed, effect } from '@angular/core';

// Writable signal
const count = signal(0);
console.log(count()); // Read: 0
count.set(5);         // Write: set to 5
count.update(n => n + 1); // Write: increment

// Computed signal (derived, read-only, auto-tracked)
const doubleCount = computed(() => count() * 2);
// Automatically re-computes when count changes

// Effect (side effects when signals change)
effect(() => {
  console.log('Count changed:', count());
  // Runs whenever count() is read inside this effect
});

// In a component:
@Component({
  selector: 'app-counter',
  standalone: true,
  template: \`
    <p>Count: {{ count() }}</p>
    <p>Double: {{ doubleCount() }}</p>
    <button (click)="increment()">+1</button>
    <button (click)="reset()">Reset</button>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CounterComponent {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increment() { this.count.update(n => n + 1); }
  reset() { this.count.set(0); }
}

// Signal inputs (Angular 17.1+) — replace @Input() decorator
@Component({ /* ... */ })
export class UserProfileComponent {
  // Required signal input
  userId = input.required<string>();
  
  // Optional with default
  showEmail = input(true);
  
  // Transformed input
  name = input('', { transform: (v: string) => v.trim().toUpperCase() });
  
  // Computed from input signal
  profileUrl = computed(() => \`/users/\${this.userId()}\`);
}

// Model signals (two-way binding, Angular 17.2+)
@Component({
  template: '<input [ngModel]="name()" (ngModelChange)="name.set($event)">'
})
export class FormComponent {
  name = model(''); // Two-way bindable signal
}`,
            language: 'typescript',
            callout: { type: 'info', title: 'Signals vs RxJS', text: 'Signals handle synchronous state. RxJS handles async streams (HTTP, WebSocket, timers). They complement each other — use signals for component state and RxJS for async operations. toSignal() and toObservable() bridge between them.' }
        },
        {
            title: 'Change Detection & OnPush',
            content: `<p>Angular's change detection checks component templates for changes and updates the DOM. <strong>Default</strong> strategy checks every component on every event. <strong>OnPush</strong> only checks when inputs change (by reference) or signals/observables emit — dramatically improving performance.</p>`,
            code: `// Default strategy — checks on EVERY browser event
// (click, HTTP response, timer, etc.)
@Component({
  changeDetection: ChangeDetectionStrategy.Default // Checks always
})

// OnPush strategy — checks ONLY when:
// 1. Input reference changes (not deep mutations!)
// 2. Event handler fires IN this component
// 3. Async pipe emits new value
// 4. Signal value changes
// 5. Manual markForCheck() called
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush // Efficient!
})
export class OptimizedComponent {
  // Signal — automatically triggers change detection
  data = signal<User[]>([]);
  
  // Input (reference must change for OnPush to detect)
  items = input<Item[]>([]);
  
  // Observable with async pipe — triggers on emit
  users$ = inject(UserService).getUsers();
}

// Common OnPush pitfall:
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class BrokenComponent {
  @Input() items: Item[] = [];
  
  addItem(item: Item) {
    this.items.push(item); // MUTATION — OnPush won't detect!
    // FIX: this.items = [...this.items, item]; // New reference!
  }
}

// Zoneless Angular (future — Angular 18+):
// Signals enable removing zone.js entirely
// Change detection triggered ONLY by signal changes
// provideExperimentalZonelessChangeDetection()
bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection(), // No zone.js!
  ]
});`,
            language: 'typescript'
        },
        {
            title: 'Lifecycle Hooks & Content Projection',
            content: `<p>Angular components have lifecycle hooks that run at specific phases. Understanding their order and purpose is essential for initialization, cleanup, and responding to changes.</p>`,
            code: `// Lifecycle hook order:
// 1. constructor()         — DI injection (don't do complex logic here)
// 2. ngOnChanges()         — Input values changed (first call before ngOnInit)
// 3. ngOnInit()            — Component initialized (inputs available)
// 4. ngDoCheck()           — Custom change detection
// 5. ngAfterContentInit()  — Projected content initialized
// 6. ngAfterContentChecked()
// 7. ngAfterViewInit()     — View (template) fully initialized
// 8. ngAfterViewChecked()
// 9. ngOnDestroy()         — Cleanup (unsubscribe, detach listeners)

// Modern alternative: DestroyRef (Angular 16+)
export class ModernComponent {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    // Auto-unsubscribe when component is destroyed
    this.http.get('/api/data').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => this.process(data));
  }
}

// Or inline in constructor with takeUntilDestroyed():
export class InlineComponent {
  data = toSignal(
    inject(HttpClient).get<User[]>('/api/users'),
    { initialValue: [] }
  );
  // Automatically unsubscribes on destroy!
}

// Content projection (ng-content / slots):
@Component({
  selector: 'app-card',
  template: \`
    <div class="card">
      <div class="card-header">
        <ng-content select="[card-title]"></ng-content>
      </div>
      <div class="card-body">
        <ng-content></ng-content>
      </div>
      <div class="card-footer">
        <ng-content select="[card-actions]"></ng-content>
      </div>
    </div>
  \`
})
export class CardComponent {}

// Usage:
// <app-card>
//   <h2 card-title>User Profile</h2>
//   <p>Main content here</p>
//   <button card-actions>Save</button>
// </app-card>`,
            language: 'typescript'
        },
        {
            title: 'Component Lifecycle Hooks',
            content: `<p>Angular components go through a well-defined lifecycle. Each hook serves a specific purpose:</p>
<ul>
<li><strong>constructor()</strong> — DI only. Do NOT access inputs/DOM here.</li>
<li><strong>ngOnChanges(changes)</strong> — Called when any input() property changes. Receives SimpleChanges map with previous/current values.</li>
<li><strong>ngOnInit()</strong> — Called once after first ngOnChanges. Initialize data fetching, subscriptions, and derived state here.</li>
<li><strong>ngDoCheck()</strong> — Custom change detection. Called every CD cycle. Use sparingly (performance risk).</li>
<li><strong>ngAfterContentInit()</strong> — After projected content (ng-content) is initialized. Access ContentChild/ContentChildren here.</li>
<li><strong>ngAfterContentChecked()</strong> — After projected content is checked. Runs every CD cycle.</li>
<li><strong>ngAfterViewInit()</strong> — After component view + child views are initialized. Access ViewChild/ViewChildren here. Safe for DOM measurements.</li>
<li><strong>ngAfterViewChecked()</strong> — After view is checked. Runs every CD cycle.</li>
<li><strong>ngOnDestroy()</strong> — Cleanup: unsubscribe observables, clear intervals, detach event listeners.</li>
</ul>
<p><strong>Modern alternative (Angular 16+):</strong> Use <code>DestroyRef</code> with <code>takeUntilDestroyed()</code> for automatic cleanup instead of manual ngOnDestroy:</p>`,
            code: `// Modern lifecycle with DestroyRef (Angular 16+)
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [AsyncPipe],
  template: \`<div>{{ user()?.name }}</div>\`
})
export class UserProfileComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  
  user = signal<User | null>(null);

  ngOnInit() {
    // Auto-cleanup with takeUntilDestroyed
    this.route.params.pipe(
      switchMap(params => this.userService.getUser(params['id'])),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(user => this.user.set(user));
  }

  // Or use effect() — auto-tracks and auto-cleans up
  private logEffect = effect(() => {
    console.log('Current user:', this.user()?.name);
    // Automatically disposed when component is destroyed
  });

  ngOnDestroy() {
    // Only needed for non-RxJS cleanup (timers, DOM listeners, etc.)
    console.log('Component destroyed');
  }
}

// ngOnChanges — react to input changes
@Component({ selector: 'app-chart', standalone: true, template: '' })
export class ChartComponent implements OnChanges {
  @Input() data: ChartData[] = [];
  @Input() config: ChartConfig = {};

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] || changes['config']) {
      // Only re-render chart when inputs actually change
      this.renderChart();
    }
    
    if (changes['data'] && !changes['data'].firstChange) {
      // Skip first render, only react to subsequent changes
      this.animateTransition(changes['data'].previousValue, changes['data'].currentValue);
    }
  }
}`,
            language: 'typescript'
        },
        {
            title: 'Parent-Child Communication',
            content: `<p>Angular provides multiple patterns for component communication:</p>
<ul>
<li><strong>@Input / input()</strong> — Parent passes data down to child</li>
<li><strong>@Output / output()</strong> — Child emits events up to parent</li>
<li><strong>ViewChild / ContentChild</strong> — Parent accesses child component instance directly</li>
<li><strong>Template variables</strong> — #ref on child element for direct template access</li>
<li><strong>Services (shared state)</strong> — For sibling or distant component communication</li>
<li><strong>model()</strong> — Two-way binding signal (Angular 17.2+): parent and child both read/write</li>
</ul>`,
            code: `// ═══ Parent → Child: input() ═══
// child.component.ts
@Component({ selector: 'app-child', standalone: true, template: \`<p>{{ name() }}</p>\` })
export class ChildComponent {
  name = input.required<string>();       // Required input (signal-based)
  color = input('blue');                 // Optional with default
  config = input<Config | undefined>();  // Optional, no default
}
// parent template: <app-child [name]="userName" [color]="'red'" />

// ═══ Child → Parent: output() ═══
@Component({
  selector: 'app-child',
  standalone: true,
  template: \`<button (click)="save.emit(data())">Save</button>\`
})
export class ChildComponent {
  data = input.required<FormData>();
  save = output<FormData>();             // Signal-based output
  delete = output<void>();               // No payload
}
// parent: <app-child (save)="onSave($event)" (delete)="onDelete()" />

// ═══ Two-Way Binding: model() (Angular 17.2+) ═══
@Component({
  selector: 'app-slider',
  standalone: true,
  template: \`<input type="range" [value]="value()" (input)="value.set(+$event.target.value)">\`
})
export class SliderComponent {
  value = model(50); // Parent can two-way bind: [(value)]="mySignal"
}
// parent: <app-slider [(value)]="volume" />

// ═══ ViewChild — access child instance ═══
@Component({
  selector: 'app-parent',
  standalone: true,
  imports: [ChildComponent],
  template: \`<app-child #childRef /><button (click)="doSomething()">Go</button>\`
})
export class ParentComponent {
  child = viewChild.required(ChildComponent); // Signal-based query

  doSomething() {
    this.child().reset(); // Call child method directly
  }
}

// ═══ ContentChild — projected content ═══
@Component({
  selector: 'app-tab-group',
  standalone: true,
  template: \`<div class="tabs"><ng-content /></div>\`
})
export class TabGroupComponent {
  tabs = contentChildren(TabComponent); // Signal-based query
  
  activateFirst = effect(() => {
    const allTabs = this.tabs();
    if (allTabs.length > 0) allTabs[0].active.set(true);
  });
}`,
            language: 'typescript'
        },
        {
            title: 'Services & Dependency Injection',
            content: `<p>Angular services are injectable classes that encapsulate shared logic, state, and API communication. The DI system is hierarchical — you can scope services to different levels:</p>
<ul>
<li><strong>providedIn: "root"</strong> — Singleton across entire app (most common)</li>
<li><strong>providedIn: "any"</strong> — One instance per lazy-loaded module (rarely used)</li>
<li><strong>Component providers</strong> — New instance per component (scoped state)</li>
<li><strong>Route providers</strong> — Scoped to route and children</li>
</ul>`,
            code: `// ═══ Root-level singleton service ═══
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private http = inject(HttpClient);

  user = this.currentUser.asReadonly(); // Expose read-only signal
  isAuthenticated = computed(() => this.currentUser() !== null);

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<User>('/api/auth/login', credentials).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  logout(): void {
    this.currentUser.set(null);
    this.http.post('/api/auth/logout', {}).subscribe();
  }
}

// ═══ Component-scoped service (new instance per component) ═══
@Injectable() // NOT providedIn: 'root'
export class FormStateService {
  private dirty = signal(false);
  isDirty = this.dirty.asReadonly();
  
  markDirty() { this.dirty.set(true); }
  markPristine() { this.dirty.set(false); }
}

@Component({
  selector: 'app-edit-form',
  standalone: true,
  providers: [FormStateService], // New instance per component
  template: \`...\`
})
export class EditFormComponent {
  formState = inject(FormStateService); // Gets its own instance
}

// ═══ Functional injection (inject() outside constructor) ═══
// Utility function that uses DI
export function injectLogger(prefix: string) {
  const logger = inject(LoggerService);
  return {
    log: (msg: string) => logger.log(\`[\${prefix}] \${msg}\`),
    error: (msg: string) => logger.error(\`[\${prefix}] \${msg}\`)
  };
}

// In component:
export class MyComponent {
  private logger = injectLogger('MyComponent');
  // Use: this.logger.log('initialized');
}

// ═══ Route-level providers ═══
const routes: Routes = [
  {
    path: 'admin',
    providers: [AdminStateService], // Shared across admin routes only
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent }
    ]
  }
];`,
            language: 'typescript'
        }
    ],
    questions: [
        {"question":"What is the difference between Angular components and directives, and what are the kinds of directives?","difficulty":"easy","answer":"<p>A <strong>component</strong> is a directive <em>with a template</em> — it controls a view. A <strong>directive</strong> attaches behavior to existing elements without its own template. There are three kinds: <strong>components</strong> (directive + template), <strong>structural directives</strong> (change DOM layout by adding/removing elements — <code>*ngIf</code>, <code>*ngFor</code>, <code>@if</code>/<code>@for</code> in modern control flow), and <strong>attribute directives</strong> (change appearance/behavior of an element — <code>ngClass</code>, <code>ngStyle</code>, custom ones).</p><p>Use a component when you own a piece of UI; use a directive to add reusable behavior across many elements.</p>","explanation":"A component is a fully furnished room (structure + contents). A directive is a modification you apply to existing rooms — knocking out a wall (structural) or repainting it (attribute).","bestPractices":["Use components for views, directives for cross-cutting element behavior","Prefer the new @if/@for control flow in modern Angular","Keep directives focused and reusable"],"commonMistakes":["Duplicating behavior across components instead of a directive","Heavy logic in structural directives","Confusing structural (*) with attribute directives"],"interviewTip":"Say \"a component is a directive with a template,\" then list the three directive kinds — that framing shows you understand the model.","followUp":["How do structural directives use <ng-template>?","What changed with the new @if/@for control flow?","How do you build a custom attribute directive?"]},
        {"question":"What are Angular Signals, and how do they differ from RxJS and traditional change detection?","difficulty":"hard","answer":"<p><strong>Signals</strong> (Angular 16+) are reactive primitives holding a value that notify dependents when it changes: <code>signal()</code> for writable state, <code>computed()</code> for derived values, and <code>effect()</code> for side effects. They enable <strong>fine-grained reactivity</strong> — Angular can update exactly the DOM bindings that depend on a changed signal, rather than checking the whole component tree.</p><p>Vs <strong>RxJS</strong>: signals are synchronous, pull-based value containers ideal for component state, while RxJS observables model asynchronous streams/events over time (HTTP, user events) — they complement each other. Vs <strong>Zone.js change detection</strong>: signals move Angular toward zoneless, targeted updates instead of broad dirty-checking on every async event.</p>","explanation":"A signal is a live cell in a spreadsheet: change it and only the formulas referencing it recalculate. RxJS is a conveyor belt of events over time. Old change detection re-checked the whole spreadsheet on any change.","bestPractices":["Use signals for synchronous component state and derived values","Use RxJS for async streams (HTTP, events); interop via toSignal","Keep effects for side effects, not deriving state (use computed)"],"commonMistakes":["Using effects to compute derived state instead of computed()","Treating signals as a full replacement for RxJS streams","Mutating objects in a signal without a new reference"],"interviewTip":"Contrast signals (sync, pull-based, fine-grained) with RxJS (async streams) and note they complement each other; mention the move toward zoneless.","followUp":["When do you use computed vs effect?","How do toSignal/toObservable bridge to RxJS?","What is zoneless change detection?"]},
        {
            question: 'What are Angular Signals and how do they change the reactivity model?',
            difficulty: 'medium',
            answer: `<p><strong>Signals</strong> are synchronous reactive primitives that track dependencies automatically. When a signal's value changes, all computed signals and effects that depend on it are notified. They replace many BehaviorSubject/Observable patterns for synchronous state and enable fine-grained, zone-free change detection.</p>`,
            code: `// Before signals (RxJS-heavy):
export class OldComponent {
  private countSubject = new BehaviorSubject(0);
  count$ = this.countSubject.asObservable();
  double$ = this.count$.pipe(map(n => n * 2));
  
  increment() { this.countSubject.next(this.countSubject.value + 1); }
}
// Template: {{ count$ | async }}, {{ double$ | async }}

// After signals (simpler, synchronous):
export class NewComponent {
  count = signal(0);
  double = computed(() => this.count() * 2);
  
  increment() { this.count.update(n => n + 1); }
}
// Template: {{ count() }}, {{ double() }}

// Bridging signals <-> observables:
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

// Observable → Signal
users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });

// Signal → Observable
count = signal(0);
count$ = toObservable(this.count); // Emits when signal changes

// Key differences from RxJS:
// Signals: synchronous, glitch-free, auto-tracked dependency graph
// Observables: async streams, operators, backpressure, complex flows
// Use signals for: component state, derived values, simple reactivity
// Use RxJS for: HTTP, WebSocket, debounce, complex async flows`,
            language: 'typescript',
            bestPractices: [
                'Use signals for component-local synchronous state',
                'Use computed() for derived values (replaces many pipe(map()) chains)',
                'Use toSignal() to convert observables to signals in components',
                'Always provide initialValue with toSignal for non-nullable types'
            ],
            commonMistakes: [
                'Using signals for complex async flows (use RxJS instead)',
                'Forgetting to call the signal as a function: count() not count',
                'Mutating signal values instead of creating new references with update()',
                'Creating effects in services without proper cleanup'
            ],
            interviewTip: 'Explain the motivation: zone.js patches every async API to trigger change detection globally. Signals enable targeted, fine-grained updates — only components reading a changed signal re-render. This is Angular\'s path to removing zone.js.',
            followUp: ['How do signals enable zoneless Angular?', 'What is the difference between signal and BehaviorSubject?', 'How does computed() handle diamond dependencies?'],
            seniorPerspective: 'I\'m migrating components from BehaviorSubject + async pipe to signals incrementally. The reduction in boilerplate is significant, and OnPush + signals is the performance sweet spot without zone.js complexity.',
            architectPerspective: 'Signals represent Angular\'s strategic shift toward fine-grained reactivity (similar to Solid.js, Vue 3 refs). For large applications, this means predictable performance without manual optimization — the framework tracks exactly what changed and updates only what\'s needed.'
        },
        {
            question: 'Explain OnPush change detection. Why is it important and what are the pitfalls?',
            difficulty: 'medium',
            answer: `<p><code>ChangeDetectionStrategy.OnPush</code> tells Angular to skip checking a component unless: (1) an input reference changes, (2) an event fires within the component, (3) an async pipe or signal emits, or (4) markForCheck() is called manually. This dramatically reduces the number of checks in large component trees.</p>`,
            code: `// Without OnPush: A single click anywhere triggers CD on EVERY component
// With OnPush: Only affected branches of the component tree are checked

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <h2>{{ title() }}</h2>
    @for (item of items(); track item.id) {
      <app-item [item]="item" />
    }
  \`
})
export class ListComponent {
  title = input.required<string>();
  items = input.required<Item[]>();
}

// PITFALL: Object mutation
// Parent:
addItem() {
  this.items.push(newItem); // WRONG! Same reference — OnPush ignores!
  this.items = [...this.items, newItem]; // CORRECT! New reference
  // Or with signals:
  this.items.update(list => [...list, newItem]); // Signal creates new ref
}

// PITFALL: Async data without signals/async pipe
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class BrokenComponent {
  data: User[] = [];
  
  ngOnInit() {
    // BROKEN: setTimeout runs outside Angular's knowledge
    setTimeout(() => {
      this.data = fetchedData; // View won't update!
    }, 1000);
  }
}

// FIX 1: Use signals
data = signal<User[]>([]);
ngOnInit() { setTimeout(() => this.data.set(fetchedData), 1000); } // Works!

// FIX 2: Use async pipe
data$ = timer(1000).pipe(switchMap(() => this.http.get<User[]>('/api')));
// Template: @for (item of data$ | async; track item.id)

// FIX 3: Inject ChangeDetectorRef (last resort)
constructor(private cdr: ChangeDetectorRef) {}
ngOnInit() {
  setTimeout(() => { this.data = fetched; this.cdr.markForCheck(); }, 1000);
}`,
            language: 'typescript',
            bestPractices: [
                'Use OnPush on EVERY component by default',
                'Use signals or async pipe for all reactive data',
                'Never mutate input objects — always create new references',
                'Use @for with track to optimize list rendering'
            ],
            commonMistakes: [
                'Mutating arrays/objects instead of creating new references',
                'Using setTimeout/setInterval without signals or markForCheck',
                'Mixing Default and OnPush strategies inconsistently',
                'Using markForCheck() as a band-aid instead of fixing data flow'
            ],
            interviewTip: 'The key insight: OnPush components are "pure" — they only re-render when their inputs (by reference) change. This makes them predictable and fast. Combined with signals, you get automatic fine-grained updates without any manual intervention.',
            followUp: ['How does OnPush interact with signals?', 'What triggers change detection in OnPush components?', 'How will zoneless Angular change this?'],
            seniorPerspective: 'I enforce OnPush via lint rules on every project. It catches mutation bugs early and forces proper reactive patterns. The initial discipline pays off with significant performance gains in complex UIs.',
            architectPerspective: 'OnPush is not optional at scale — a 500-component app with Default strategy re-checks everything on every click. OnPush + signals reduces this to checking only the 2-3 components that actually need updating. It\'s the difference between O(n) and O(1) rendering.'
        },
        {
            question: 'How do signal-based inputs, outputs, and model() differ from the @Input() and @Output() decorators?',
            difficulty: 'medium',
            answer: `<p>Angular 17.1+ replaces the decorator API with function-based members:</p>
            <ul>
                <li><code>input()</code> / <code>input.required()</code> return a read-only <strong>signal</strong> — reading it in a template or computed creates a reactive dependency, so derived values update automatically.</li>
                <li><code>output()</code> returns an emitter with an <code>emit()</code> method — it is NOT a signal and replaces <code>@Output()</code> + <code>EventEmitter</code>.</li>
                <li><code>model()</code> creates a writable signal that supports two-way binding (the <code>[(value)]</code> banana-in-a-box syntax), replacing the <code>@Input()</code> + <code>@Output()</code> "valueChange" pair.</li>
            </ul>
            <p>The big win: inputs are signals, so you can build <code>computed()</code> values directly on them without <code>ngOnChanges</code>.</p>`,
            explanation: 'Decorator inputs are like a mailbox you have to keep checking (ngOnChanges) to notice new mail. Signal inputs are like a doorbell wired straight to the rooms that care — anything derived from the input reacts the moment it changes.',
            code: `import { Component, input, output, model, computed } from '@angular/core';

@Component({
  selector: 'app-price-tag',
  standalone: true,
  // template: '<span>{{ formatted() }}</span>
  //            <button (click)="remove.emit(id())">x</button>'
})
export class PriceTagComponent {
  // Required input signal (compile error if binding missing)
  id = input.required<number>();

  // Optional input with default + transform
  amount = input(0, { transform: (v: number | string) => Number(v) });

  // Computed derived directly from the input signal — no ngOnChanges needed
  formatted = computed(() => '$' + this.amount().toFixed(2));

  // Output emitter (replaces @Output() EventEmitter)
  remove = output<number>();
}

@Component({
  selector: 'app-rating',
  standalone: true,
  // template: '<input type="number" [value]="value()"
  //              (input)="value.set(+$any($event.target).value)" />'
})
export class RatingComponent {
  // Two-way bindable signal: parent uses [(value)]="score"
  value = model(0);
}`,
            language: 'typescript',
            bestPractices: [
                'Use input.required() for inputs the component cannot function without',
                'Derive state from input signals with computed() instead of ngOnChanges',
                'Use the transform option to coerce/normalize values at the boundary',
                'Use model() only for genuine two-way binding scenarios (form-like controls)'
            ],
            commonMistakes: [
                'Treating output() like a signal and calling it as a function instead of .emit()',
                'Trying to .set() an input() signal — inputs are read-only from inside the component',
                'Keeping ngOnChanges to recompute values that a computed() could handle',
                'Overusing model() where a one-way input plus an explicit output is clearer'
            ],
            interviewTip: 'Emphasize that input() returns a read-only signal while model() returns a writable one, and output() is not a signal at all. Mention that signal inputs eliminate most ngOnChanges usage because computed() reacts automatically.',
            followUp: ['When would you still need ngOnChanges with signal inputs?', 'How does input transform interact with type safety?'],
            seniorPerspective: 'I migrate leaf/presentational components to signal inputs first — they have the clearest win because derived display values become computed() one-liners and ngOnChanges disappears. I reserve model() for control-like components; elsewhere explicit input + output reads more clearly in code review.',
            architectPerspective: 'Function-based members align the component contract with the signal graph, so the framework can track exactly which inputs feed which views. At scale this is what makes zoneless change detection viable — the dependency edges are explicit rather than inferred from a global change-detection sweep.'
        },
        {
            question: 'What do standalone components solve, and how does bootstrapApplication configure dependency injection without NgModules?',
            difficulty: 'medium',
            answer: `<p><strong>Standalone components</strong> (default since Angular 17) declare their own template dependencies via the <code>imports</code> array, removing the NgModule indirection where a component, its module, and the module's exports all had to stay in sync.</p>
            <p>Application-wide providers move from <code>@NgModule({ providers })</code> to the <code>providers</code> array of <code>bootstrapApplication()</code>, configured through <strong>provider functions</strong> like <code>provideRouter</code>, <code>provideHttpClient</code>, and <code>provideAnimations</code>. These functions are tree-shakable — features you do not call are dropped from the bundle.</p>`,
            explanation: 'NgModules were like requiring every tool to be registered in a central tool shed before any worker could use it. Standalone components let each worker carry exactly the tools they need, and the app sets up shared services once at the front door.',
            code: `// main.ts — no AppModule
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    // Plain provider for a token/service
    { provide: API_BASE_URL, useValue: '/api/v2' },
  ]
}).catch(err => console.error(err));

// A standalone component imports only what its template uses
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, DatePipe],
  // template: '<a routerLink="/home">{{ now | date }}</a>'
})
export class ShellComponent { now = Date.now(); }`,
            language: 'typescript',
            bestPractices: [
                'Import only the directives/pipes a component template actually uses',
                'Configure cross-cutting concerns with provide* functions in bootstrapApplication',
                'Use environment injectors / route-level providers to scope services to features',
                'Prefer providedIn: "root" services so they stay tree-shakable'
            ],
            commonMistakes: [
                'Recreating a giant "SharedModule" and importing it everywhere (defeats the purpose)',
                'Forgetting to add an imported pipe/directive to the component imports array',
                'Putting feature-only providers at the root, keeping them in the initial bundle',
                'Mixing NgModule and standalone bootstrapping inconsistently during migration'
            ],
            interviewTip: 'Explain that imports moved from the module to the component, and providers moved from @NgModule to bootstrapApplication via tree-shakable provide* functions. Mention route-level providers as the replacement for lazy feature-module providers.',
            followUp: ['How do you scope a provider to a lazy-loaded route?', 'How do you migrate an existing NgModule app incrementally?'],
            seniorPerspective: 'During migration I avoid the trap of a monolithic SharedModule-as-standalone-barrel. I let each component import its own dependencies and use route-level providers for feature scoping. The payoff is real tree-shaking and far fewer "why is this in the initial bundle" surprises.',
            architectPerspective: 'Standalone + provider functions turn DI configuration into explicit, composable code rather than declarative module metadata. This is what enables fine-grained lazy loading and per-route injector scopes, which matter enormously for bundle budgets in large multi-team apps.'
        },
        {
            question: 'Compare the classic lifecycle hooks with DestroyRef, afterNextRender, and afterRender. When do you reach for each?',
            difficulty: 'hard',
            answer: `<p>The classic hooks (<code>ngOnInit</code>, <code>ngOnChanges</code>, <code>ngAfterViewInit</code>, <code>ngOnDestroy</code>) still exist, but Angular 16+ adds injectable, more composable alternatives:</p>
            <ul>
                <li><code>inject(DestroyRef)</code> + <code>onDestroy(fn)</code> lets any service, directive, or helper register cleanup without implementing OnDestroy — and powers <code>takeUntilDestroyed()</code>.</li>
                <li><code>afterNextRender(fn)</code> runs once after the next render — the right place for one-time DOM measurement or third-party browser-only libraries.</li>
                <li><code>afterRender(fn)</code> runs after every render — used sparingly for DOM-dependent work that must stay in sync.</li>
            </ul>
            <p>Crucially, <code>afterRender</code>/<code>afterNextRender</code> only run in the browser, so they are SSR-safe for DOM access, unlike <code>ngAfterViewInit</code>.</p>`,
            explanation: 'Old hooks are fixed stops on a conveyor belt — you must stand at the right station to act. DestroyRef and the afterRender callbacks are more like subscriptions you can register from anywhere, including reusable helpers, and they know whether they are running in a browser or on a server.',
            code: `import {
  Component, inject, DestroyRef, afterNextRender, afterRender, ElementRef
} from '@angular/core';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({ selector: 'app-chart', standalone: true, template: '<canvas #c></canvas>' })
export class ChartComponent {
  private destroyRef = inject(DestroyRef);
  private host = inject(ElementRef<HTMLElement>);

  constructor() {
    // Auto-unsubscribe via DestroyRef-powered operator
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(t => this.tick(t));

    // Browser-only, one-time: safe DOM measurement / lib init (SSR-safe)
    afterNextRender(() => {
      const canvas = this.host.nativeElement.querySelector('canvas')!;
      this.initThirdPartyChart(canvas);
    });

    // Runs after every render — keep it cheap, no state writes that re-trigger CD
    afterRender(() => this.syncOverlayPosition());

    // Manual cleanup from anywhere, no OnDestroy needed
    this.destroyRef.onDestroy(() => this.disposeChart());
  }

  private tick(_: number) {}
  private initThirdPartyChart(_: HTMLCanvasElement) {}
  private syncOverlayPosition() {}
  private disposeChart() {}
}`,
            language: 'typescript',
            bestPractices: [
                'Use takeUntilDestroyed(DestroyRef) for subscriptions instead of manual OnDestroy',
                'Use afterNextRender for one-time DOM/third-party setup (SSR-safe)',
                'Keep afterRender callbacks cheap and free of state writes that re-trigger rendering',
                'Reserve ngOnInit for input-dependent initialization that does not touch the DOM'
            ],
            commonMistakes: [
                'Accessing the DOM in ngOnInit (view not built) or assuming ngAfterViewInit runs under SSR',
                'Writing signals/state inside afterRender, causing render loops',
                'Implementing OnDestroy in many small helpers instead of injecting DestroyRef',
                'Doing heavy synchronous work in afterRender that runs on every cycle'
            ],
            interviewTip: 'Stress the SSR angle: afterNextRender/afterRender only run in the browser, making them the correct place for DOM access, whereas ngAfterViewInit fires during server rendering too. Tie DestroyRef back to takeUntilDestroyed.',
            followUp: ['Why is afterNextRender safer than ngAfterViewInit for SSR DOM access?', 'How does DestroyRef enable cleanup in non-component code?'],
            seniorPerspective: 'I treat DestroyRef as the default cleanup mechanism because it works in services and directives, not just components, and it composes with RxJS via takeUntilDestroyed. For any third-party charting/map library I use afterNextRender so the same component renders cleanly under SSR without guarding every DOM call.',
            architectPerspective: 'These APIs separate "lifecycle as a position in a fixed sequence" from "lifecycle as injectable capability." That decoupling is what lets Angular run the same components on the server and the client safely, and it is foundational for hydration and zoneless rendering strategies.'
        },
        {
            question: 'How does the built-in @if / @for / @switch control flow differ from *ngIf / *ngFor, and what does @defer add?',
            difficulty: 'advanced',
            answer: `<p>Angular 17 introduced <strong>built-in control flow</strong> in templates that replaces the structural directives:</p>
            <ul>
                <li><code>@if / @else if / @else</code> replaces <code>*ngIf</code> and supports an <code>as</code> alias without an extra <code>ng-template</code>.</li>
                <li><code>@for</code> replaces <code>*ngFor</code> and <strong>requires</strong> a <code>track</code> expression, plus built-in <code>@empty</code> and contextual variables (<code>$index</code>, <code>$first</code>, <code>$count</code>).</li>
                <li><code>@switch</code> replaces <code>ngSwitch</code>.</li>
            </ul>
            <p>It is compiled directly (no directive instances), so it is faster, smaller, and type-checked. <code>@defer</code> goes further: it lazy-loads a template block on a trigger (<code>on viewport</code>, <code>on interaction</code>, <code>on idle</code>, <code>when</code>), with <code>@placeholder</code>, <code>@loading</code>, and <code>@error</code> blocks — code-splitting at the template level.</p>`,
            explanation: 'The old structural directives were add-on attachments the framework had to instantiate and manage. The new control flow is built into the template language itself — like the difference between a bolt-on accessory and a feature designed into the chassis. @defer is a trapdoor that only loads the room behind it when someone actually walks up to it.',
            code: `// Built-in control flow (no CommonModule needed for these)
// template:
// @if (user(); as u) {
//   <h2>{{ u.name }}</h2>
// } @else {
//   <app-login />
// }
//
// @for (item of items(); track item.id) {
//   <li [class.first]="$first">{{ $index + 1 }}. {{ item.label }}</li>
// } @empty {
//   <li>No items</li>
// }
//
// @switch (status()) {
//   @case ('loading') { <app-spinner /> }
//   @case ('error')   { <app-error /> }
//   @default          { <app-content /> }
// }
//
// Deferrable view: heavy chart loads only when scrolled into view
// @defer (on viewport; prefetch on idle) {
//   <app-heavy-chart [data]="data()" />
// } @placeholder (minimum 300ms) {
//   <div class="skeleton"></div>
// } @loading (after 100ms; minimum 200ms) {
//   <app-spinner />
// } @error {
//   <p>Failed to load chart.</p>
// }

import { Component, signal } from '@angular/core';
@Component({ selector: 'app-feed', standalone: true, template: '' })
export class FeedComponent {
  items = signal<{ id: number; label: string }[]>([]);
  status = signal<'loading' | 'error' | 'ready'>('loading');
}`,
            language: 'typescript',
            bestPractices: [
                'Migrate to @if/@for/@switch for new templates (faster, type-checked, no import)',
                'Always choose a stable track key in @for (an id, not $index, for mutable lists)',
                'Use @defer (on viewport) for below-the-fold heavy components',
                'Use prefetch triggers so deferred chunks are ready before the user needs them'
            ],
            commonMistakes: [
                'Tracking by $index on a reorderable list, causing wrong DOM reuse',
                'Forgetting that @defer requires the deferred component to be standalone and only used inside the block',
                'Putting critical, above-the-fold content inside @defer (hurts LCP)',
                'Expecting @defer to lazy-load something also eagerly imported elsewhere'
            ],
            interviewTip: 'Highlight that @for makes track mandatory (the old optional trackBy is now required) and that the new control flow is compiled, not directive-based. For @defer, name the triggers (viewport, interaction, idle, timer, when) and the four block types.',
            followUp: ['Why is track mandatory in @for and what breaks with track $index?', 'How does @defer interact with SSR and hydration?'],
            seniorPerspective: 'I run the official migration schematic to convert *ngIf/*ngFor in bulk, then hand-tune track keys — the schematic defaults can be wrong for reorderable lists. @defer has been the cleanest win for dashboards: wrapping heavy charts in @defer (on viewport; prefetch on idle) cut initial JS noticeably without any manual lazy-route plumbing.',
            architectPerspective: 'Built-in control flow folds branching and iteration into the compiler, which improves both runtime cost and type-checking fidelity. @defer brings code-splitting down to the template granularity — previously only routes could split code, now any subtree can, which reshapes how we budget bundles across a large app.'
        }
    ]
});
