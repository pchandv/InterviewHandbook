/* Reusable Phase D injector. Run: node tools/_inject.mjs */
import fs from 'node:fs';

const BATCH = {
  'data/angular-core.js': [
    {
      question: 'What is the difference between Angular components and directives, and what are the kinds of directives?',
      difficulty: 'easy',
      answer: '<p>A <strong>component</strong> is a directive <em>with a template</em> — it controls a view. A <strong>directive</strong> attaches behavior to existing elements without its own template. There are three kinds: <strong>components</strong> (directive + template), <strong>structural directives</strong> (change DOM layout by adding/removing elements — <code>*ngIf</code>, <code>*ngFor</code>, <code>@if</code>/<code>@for</code> in modern control flow), and <strong>attribute directives</strong> (change appearance/behavior of an element — <code>ngClass</code>, <code>ngStyle</code>, custom ones).</p><p>Use a component when you own a piece of UI; use a directive to add reusable behavior across many elements.</p>',
      explanation: 'A component is a fully furnished room (structure + contents). A directive is a modification you apply to existing rooms — knocking out a wall (structural) or repainting it (attribute).',
      bestPractices: ['Use components for views, directives for cross-cutting element behavior', 'Prefer the new @if/@for control flow in modern Angular', 'Keep directives focused and reusable'],
      commonMistakes: ['Duplicating behavior across components instead of a directive', 'Heavy logic in structural directives', 'Confusing structural (*) with attribute directives'],
      interviewTip: 'Say "a component is a directive with a template," then list the three directive kinds — that framing shows you understand the model.',
      followUp: ['How do structural directives use <ng-template>?', 'What changed with the new @if/@for control flow?', 'How do you build a custom attribute directive?']
    },
    {
      question: 'What are Angular Signals, and how do they differ from RxJS and traditional change detection?',
      difficulty: 'hard',
      answer: '<p><strong>Signals</strong> (Angular 16+) are reactive primitives holding a value that notify dependents when it changes: <code>signal()</code> for writable state, <code>computed()</code> for derived values, and <code>effect()</code> for side effects. They enable <strong>fine-grained reactivity</strong> — Angular can update exactly the DOM bindings that depend on a changed signal, rather than checking the whole component tree.</p><p>Vs <strong>RxJS</strong>: signals are synchronous, pull-based value containers ideal for component state, while RxJS observables model asynchronous streams/events over time (HTTP, user events) — they complement each other. Vs <strong>Zone.js change detection</strong>: signals move Angular toward zoneless, targeted updates instead of broad dirty-checking on every async event.</p>',
      explanation: 'A signal is a live cell in a spreadsheet: change it and only the formulas referencing it recalculate. RxJS is a conveyor belt of events over time. Old change detection re-checked the whole spreadsheet on any change.',
      bestPractices: ['Use signals for synchronous component state and derived values', 'Use RxJS for async streams (HTTP, events); interop via toSignal', 'Keep effects for side effects, not deriving state (use computed)'],
      commonMistakes: ['Using effects to compute derived state instead of computed()', 'Treating signals as a full replacement for RxJS streams', 'Mutating objects in a signal without a new reference'],
      interviewTip: 'Contrast signals (sync, pull-based, fine-grained) with RxJS (async streams) and note they complement each other; mention the move toward zoneless.',
      followUp: ['When do you use computed vs effect?', 'How do toSignal/toObservable bridge to RxJS?', 'What is zoneless change detection?']
    }
  ],
  'data/angular-rxjs.js': [
    {
      question: 'Compare switchMap, mergeMap, concatMap, and exhaustMap. When do you use each?',
      difficulty: 'hard',
      answer: '<p>All are higher-order mapping operators that flatten an inner observable per source emission; they differ in how they handle overlap: <strong>switchMap</strong> cancels the previous inner observable when a new value arrives (latest wins) — ideal for type-ahead search and route params. <strong>mergeMap</strong> runs all inner observables concurrently (no cancellation, no ordering) — for independent parallel work. <strong>concatMap</strong> queues them and runs one at a time in order — when order matters and each must complete. <strong>exhaustMap</strong> ignores new source values while an inner is still running — ideal for preventing duplicate submits (login button spam).</p>',
      explanation: 'switchMap = "cancel the old order, I changed my mind" (search box). mergeMap = "start all orders at once." concatMap = "one at a time, in line." exhaustMap = "ignore new orders until this one is done" (double-click guard).',
      bestPractices: ['switchMap for latest-wins (search, route changes)', 'concatMap when order/completion matters', 'exhaustMap to prevent duplicate submissions'],
      commonMistakes: ['mergeMap for search (stale results race in)', 'switchMap for writes that must all complete (cancels in-flight saves)', 'Nested subscribes instead of a flattening operator'],
      interviewTip: 'Give the canonical use case for each (search=switchMap, submit-guard=exhaustMap, ordered=concatMap, parallel=mergeMap) — that mapping is exactly what interviewers probe.',
      followUp: ['Why is switchMap dangerous for save operations?', 'What happens to unsubscribed inner observables?', 'How do these help with race conditions?']
    },
    {
      question: 'How do you prevent memory leaks from RxJS subscriptions in Angular?',
      difficulty: 'medium',
      answer: '<p>A subscription that outlives its component keeps the component (and its DOM/closures) alive — a leak. Prevent it by <strong>unsubscribing</strong> when the component is destroyed. Best options: the <strong>async pipe</strong> (<code>obs$ | async</code>) which subscribes and unsubscribes automatically; <strong>takeUntilDestroyed()</strong> (Angular 16+) or <code>takeUntil(destroy$)</code> tied to ngOnDestroy; or converting to <strong>signals</strong> via <code>toSignal</code> which manages cleanup.</p><p>Operators that complete on their own (like a single HttpClient call) do not leak, but long-lived streams (route params, event streams, intervals, stores) must be cleaned up.</p>',
      explanation: 'An open subscription is like leaving a tap running after you leave the room — it keeps consuming even though nobody is using it. The async pipe is a tap that shuts itself off when you leave.',
      bestPractices: ['Prefer the async pipe (auto-unsubscribe)', 'Use takeUntilDestroyed() / takeUntil(destroy$) for manual subscribes', 'Convert streams to signals with toSignal where suitable'],
      commonMistakes: ['Manual subscribe with no unsubscribe in ngOnDestroy', 'Subscribing inside templates or loops', 'Assuming all observables complete on their own'],
      interviewTip: 'Lead with the async pipe as the cleanest fix and takeUntilDestroyed for manual cases; note that self-completing HTTP calls are fine.',
      followUp: ['When does an HttpClient subscription not leak?', 'What does takeUntilDestroyed do?', 'Why can nested subscribes leak?']
    }
  ],
  'data/angular-routing.js': [
    {
      question: 'What are route guards in Angular, and what are the main guard types?',
      difficulty: 'medium',
      answer: '<p><strong>Route guards</strong> are functions that decide whether navigation may proceed, returning a boolean, a <code>UrlTree</code> (redirect), or an async (Promise/Observable) of those. Modern Angular uses functional guards. Main types: <strong>CanActivate</strong> (may the user enter this route? — auth checks), <strong>CanActivateChild</strong> (guard child routes), <strong>CanDeactivate</strong> (may the user leave? — unsaved-changes prompts), <strong>CanMatch</strong> (whether a route config matches at all — feature flags, role-based route selection), and <strong>resolve</strong> (pre-fetch data before activation).</p><p>Guards centralize navigation authorization/side effects instead of scattering checks in components.</p>',
      explanation: 'Guards are checkpoints on a road: CanActivate checks your pass to enter, CanDeactivate asks "are you sure you want to leave without saving?", and resolve makes sure the destination is prepared before you arrive.',
      bestPractices: ['Use CanActivate for auth, CanDeactivate for unsaved-changes', 'Return a UrlTree to redirect instead of manual navigation', 'Use CanMatch for role/feature-flag route selection'],
      commonMistakes: ['Putting auth checks in components instead of guards', 'Long-running work in guards blocking navigation', 'Forgetting resolve error handling'],
      interviewTip: 'List the guard types with a concrete use each (CanActivate=auth, CanDeactivate=unsaved changes, resolve=prefetch) — practical mapping over definitions.',
      followUp: ['How does returning a UrlTree work?', 'When use CanMatch vs CanActivate?', 'What are the trade-offs of resolve vs loading in the component?']
    },
    {
      question: 'What is lazy loading in Angular routing, and why does it matter?',
      difficulty: 'medium',
      answer: '<p><strong>Lazy loading</strong> defers loading a feature\'s code until its route is visited, using <code>loadComponent</code> (standalone) or <code>loadChildren</code> in the route config. Angular splits that feature into a separate bundle downloaded on demand.</p><p>It matters for <strong>performance</strong>: the initial bundle stays small, so first load and time-to-interactive are faster — critical for large apps. Combine it with <strong>preloading strategies</strong> (e.g., PreloadAllModules or a custom strategy) to fetch likely-next routes in the background after the app loads, balancing fast startup with quick subsequent navigation.</p>',
      explanation: 'Lazy loading is a restaurant that only cooks a dish when someone orders it, instead of cooking the entire menu at opening — the kitchen (initial load) starts much faster.',
      bestPractices: ['Lazy-load feature routes with loadComponent/loadChildren', 'Use a preloading strategy for likely-next routes', 'Keep the initial (eager) bundle minimal'],
      commonMistakes: ['Eagerly loading the whole app, bloating initial bundle', 'No preloading, causing a delay on first navigation to a feature', 'Lazy-loading tiny features with negligible benefit'],
      interviewTip: 'Tie it to initial bundle size / TTI and mention preloading strategies as the way to keep subsequent navigation snappy.',
      followUp: ['What preloading strategies exist?', 'How does lazy loading affect bundle splitting?', 'How do guards interact with lazy routes (CanMatch)?']
    }
  ],
  'data/angular-state.js': [
    {
      question: 'When do you need a state management library (like NgRx) versus simple service-with-signals state?',
      difficulty: 'hard',
      answer: '<p>Not every app needs a store. A <strong>service holding signals</strong> (or a BehaviorSubject) is enough for local or moderately-shared state — simple, low-boilerplate. Reach for a <strong>store (NgRx/NgRx Signal Store)</strong> when state is complex and shared across many unrelated components, when you need predictable state transitions, time-travel debugging, strong traceability of "what changed and why," or sophisticated side-effect orchestration (effects).</p><p>The trade-off is boilerplate and indirection. Rule of thumb: start with service+signals; adopt a store when shared-state complexity, debuggability, and team scale justify the ceremony.</p>',
      explanation: 'A signals service is a shared notepad on the wall — perfect for a small team. NgRx is a full records office with logged, auditable changes — worth it when many departments touch the same data and you need a paper trail.',
      bestPractices: ['Start with service + signals for most state', 'Adopt a store for complex, widely-shared, traceable state', 'Keep components dumb; centralize state transitions'],
      commonMistakes: ['Adding NgRx to a small app (needless boilerplate)', 'Scattering shared state across components', 'Using effects for logic that belongs in reducers/computed'],
      interviewTip: 'Show judgment: "service+signals by default, a store when shared-state complexity and debuggability justify it" — avoid dogmatically recommending NgRx.',
      followUp: ['What does NgRx give you over a signals service?', 'What is the NgRx Signal Store?', 'How do you avoid store boilerplate?']
    },
    {
      question: 'What are the core building blocks of the NgRx (Redux) pattern, and how does data flow through them?',
      difficulty: 'hard',
      answer: '<p>NgRx follows the Redux one-way data flow with: <strong>Store</strong> (a single immutable state tree), <strong>Actions</strong> (plain events describing what happened), <strong>Reducers</strong> (pure functions computing the next state from current state + action), <strong>Selectors</strong> (memoized, composable reads of slices of state), and <strong>Effects</strong> (handle side effects like HTTP, listening to actions and dispatching new ones).</p><p>Flow: a component <em>dispatches</em> an Action → Reducers produce new state (pure, synchronous) → Selectors expose derived state to components; side effects (API calls) run in Effects, which dispatch success/failure Actions that feed back into reducers. The unidirectional, immutable, pure-reducer design makes state predictable and debuggable.</p>',
      explanation: 'It is a strict office mailroom: you file a request form (action), a clerk who never improvises updates the master ledger (reducer), you read the ledger through indexed views (selectors), and any phone calls to outside vendors happen in a separate department (effects) that files its own follow-up forms.',
      bestPractices: ['Keep reducers pure and synchronous', 'Put all side effects in Effects', 'Use memoized selectors for derived state'],
      commonMistakes: ['Side effects or async in reducers', 'Mutating state instead of returning new state', 'Deriving state in components instead of selectors'],
      interviewTip: 'Name the five pieces and the one-way flow (dispatch → reducer → store → selector; effects for async). Stress pure reducers + immutability as the source of predictability.',
      followUp: ['Why must reducers be pure?', 'How do selectors memoize?', 'How do Effects handle HTTP failures?']
    }
  ],
  'data/levels/level-07/angular-forms.js': [
    {
      question: 'What is the difference between template-driven and reactive forms in Angular?',
      difficulty: 'medium',
      answer: '<p><strong>Template-driven forms</strong> define the form model implicitly in the template with directives (<code>ngModel</code>) — simple, familiar, good for small/simple forms, but logic lives in the template and is harder to test. <strong>Reactive forms</strong> define the model explicitly in the component as <code>FormControl</code>/<code>FormGroup</code>/<code>FormArray</code> — more code, but the model is explicit, strongly typed, synchronously accessible, easily unit-tested, and better for complex/dynamic forms and custom validation.</p><p>Rule of thumb: reactive forms for anything non-trivial (dynamic fields, complex validation, testability); template-driven for quick, simple forms.</p>',
      explanation: 'Template-driven is assembling furniture by eye following the picture (quick, but hard to inspect). Reactive is having the full blueprint in hand (more upfront, but precise, testable, and easy to modify).',
      bestPractices: ['Use reactive forms for complex/dynamic/validated forms', 'Keep validation logic in the component (reactive) for testability', 'Use typed reactive forms for compile-time safety'],
      commonMistakes: ['Template-driven forms for complex dynamic scenarios', 'Untestable validation logic buried in templates', 'Mixing both approaches in one form'],
      interviewTip: 'Contrast implicit-in-template vs explicit-in-component and tie to testability/complexity; recommend reactive for non-trivial forms.',
      followUp: ['How do typed reactive forms help?', 'How do you build a dynamic form with FormArray?', 'How do custom validators differ between the two?']
    },
    {
      question: 'How do synchronous and asynchronous validators work in Angular reactive forms?',
      difficulty: 'medium',
      answer: '<p><strong>Synchronous validators</strong> are functions that take a control and return a validation-errors object or null immediately (e.g., <code>Validators.required</code>, custom range checks). <strong>Async validators</strong> return a Promise or Observable of errors/null, used for checks needing IO — like verifying a username is not already taken via an HTTP call.</p><p>Async validators run only after sync validators pass (to avoid needless server calls), and the control enters a <code>PENDING</code> state while they resolve. Best practice: debounce async validators (e.g., only after the user stops typing) and handle errors so a failed request does not falsely block the form.</p>',
      explanation: 'Sync validators are checks you can do instantly on paper (is the box filled in?). Async validators are checks that require phoning head office (is this username free?) — slower, so you wait (PENDING) and do not call for every keystroke.',
      bestPractices: ['Debounce async validators to limit server calls', 'Run async only after sync validators pass', 'Handle async validator errors gracefully'],
      commonMistakes: ['Async validation on every keystroke (server hammering)', 'Not handling the PENDING state in the UI', 'Blocking submit on a failed validator request'],
      interviewTip: 'Distinguish immediate (sync) vs IO-based (async, returns Promise/Observable, PENDING state) and mention debouncing — the practical concern interviewers want.',
      followUp: ['What is the PENDING state?', 'How do you debounce an async validator?', 'How do cross-field validators work?']
    }
  ],
  'data/levels/level-07/angular-testing.js': [
    {
      question: 'What is TestBed in Angular testing, and how do you test a component with dependencies?',
      difficulty: 'medium',
      answer: '<p><strong>TestBed</strong> is Angular\'s testing utility that creates a testing module — configuring declarations/imports and providers so you can instantiate a component in a realistic-but-controlled Angular environment and get a <code>ComponentFixture</code> to interact with it and its rendered DOM.</p><p>To test a component with dependencies, provide <strong>test doubles</strong> for its services (mocks/spies via <code>{ provide: Service, useValue: mock }</code>), create the component through TestBed, call <code>fixture.detectChanges()</code> to trigger change detection, then assert on component state or the rendered DOM. For simple logic, a plain unit test constructing the class with mocked deps (no TestBed) is faster.</p>',
      explanation: 'TestBed is a flight simulator for a component: it recreates enough of the Angular "cockpit" (DI, templates, change detection) to fly the component safely while you swap in fake instruments (mocked services).',
      bestPractices: ['Provide mocks/spies for dependencies via the TestBed providers', 'Call detectChanges() before asserting on the DOM', 'Skip TestBed for pure logic (construct the class directly)'],
      commonMistakes: ['Forgetting detectChanges(), so the DOM is stale', 'Using real services/HTTP in unit tests', 'Over-using TestBed where a plain unit test suffices'],
      interviewTip: 'Explain TestBed sets up a testing module + fixture, provide mocks via useValue, and remember detectChanges(); note plain unit tests for pure logic.',
      followUp: ['How do you test async code (fakeAsync/tick)?', 'How do you mock HttpClient (HttpTestingController)?', 'When avoid TestBed?']
    },
    {
      question: 'How do you test asynchronous code in Angular (fakeAsync, tick, async/whenStable)?',
      difficulty: 'hard',
      answer: '<p>Angular provides tools to make async deterministic. <strong>fakeAsync</strong> wraps a test so time is virtual: you call <strong>tick(ms)</strong> to synchronously advance timers and flush microtasks, making setTimeout/Promise-based code testable without real waiting. <strong>flush()</strong> drains all pending timers. Alternatively, <strong>waitForAsync</strong> (formerly async) with <code>fixture.whenStable()</code> waits for pending promises to settle before assertions.</p><p>For HTTP, use <strong>HttpTestingController</strong> to expect and flush requests synchronously. The goal is deterministic, fast tests — never rely on real delays.</p>',
      explanation: 'fakeAsync/tick is a TV remote for time: instead of actually waiting five seconds for something to happen, you fast-forward instantly and check the result — making flaky, slow async tests fast and reliable.',
      bestPractices: ['Use fakeAsync + tick/flush for timer/promise code', 'Use HttpTestingController to flush HTTP synchronously', 'Avoid real setTimeout delays in tests'],
      commonMistakes: ['Real delays causing slow/flaky tests', 'Forgetting to flush/verify pending HTTP requests', 'Asserting before async work has settled'],
      interviewTip: 'Name fakeAsync+tick (virtual time) and HttpTestingController (flush HTTP) as the deterministic tools; the point is removing real waits.',
      followUp: ['fakeAsync vs waitForAsync — when each?', 'How does HttpTestingController.verify() work?', 'What does flush() do vs tick()?']
    }
  ],
  'data/levels/level-07/angular-performance.js': [
    {
      question: 'How does OnPush change detection work, and when should you use it?',
      difficulty: 'hard',
      answer: '<p>By default Angular checks every component on each change-detection cycle. With <strong>ChangeDetectionStrategy.OnPush</strong>, a component is only re-checked when: an <code>@Input</code> reference changes, an event fires within it, an observable bound via the async pipe emits, or you manually mark it. This skips re-checking large subtrees whose inputs did not change, greatly reducing work in big apps.</p><p>Use OnPush with <strong>immutable data</strong> and reference changes (new object/array rather than mutation), or with signals. It is a key performance lever, but requires discipline: mutating an input in place will not trigger an update under OnPush.</p>',
      explanation: 'Default change detection re-inspects every room in the house on any noise. OnPush only re-inspects a room when its door handle (input reference) actually changes — far less work, as long as you replace items rather than quietly editing them.',
      bestPractices: ['Adopt OnPush with immutable data / new references', 'Combine with async pipe and signals', 'Avoid in-place mutation of @Input objects'],
      commonMistakes: ['Mutating an input object in place (no update under OnPush)', 'Expecting OnPush to detect deep mutations', 'Not using immutable updates'],
      interviewTip: 'List the four OnPush triggers (input ref change, event, async pipe emit, manual mark) and stress immutability — mutating in place is the classic OnPush bug.',
      followUp: ['How do signals interact with OnPush?', 'How do you manually trigger detection (markForCheck)?', 'What is zoneless change detection?']
    },
    {
      question: 'What causes poor Angular runtime performance, and how do you diagnose and fix it?',
      difficulty: 'hard',
      answer: '<p>Common causes: excessive change-detection work (default strategy on large trees, heavy method/getter calls in templates), <code>*ngFor</code> without <code>trackBy</code> (re-rendering whole lists), large eager bundles (slow load), memory leaks from unsubscribed observables, and heavy synchronous work on the main thread.</p><p>Fixes: use <strong>OnPush</strong> (or signals) to limit change detection; add <strong>trackBy</strong> to lists so only changed items re-render; avoid function calls in templates (precompute or use pure pipes); <strong>lazy-load</strong> features and use preloading; virtualize long lists (CDK virtual scroll); and profile with Angular DevTools\' change-detection profiler and browser performance tools to find the real hot spot before optimizing.</p>',
      explanation: 'It is like a sluggish kitchen: stop re-cooking dishes nobody changed (OnPush), label plates so you only remake the changed ones (trackBy), and prep ingredients only when ordered (lazy load). Measure which station is slow before rearranging the whole kitchen.',
      bestPractices: ['OnPush/signals + trackBy on lists', 'No function calls in templates; use pure pipes/precomputed values', 'Lazy-load and virtualize long lists; profile with Angular DevTools'],
      commonMistakes: ['*ngFor without trackBy', 'Calling functions/getters in templates each cycle', 'Optimizing without profiling first'],
      interviewTip: 'Give a prioritized, diagnosable list (OnPush, trackBy, no template functions, lazy load, virtual scroll) and stress profiling with Angular DevTools before optimizing.',
      followUp: ['Why is trackBy important?', 'Why avoid function calls in templates?', 'What is CDK virtual scrolling?']
    }
  ]
};

let total = 0;
for (const [file, questions] of Object.entries(BATCH)) {
  let src = fs.readFileSync(file, 'utf8');
  const anchor = src.match(/questions\s*:\s*\[/);
  if (!anchor) { console.error('NO ANCHOR', file); process.exit(1); }
  const at = anchor.index + anchor[0].length;
  const insert = '\n' + questions.map(q => '        ' + JSON.stringify(q) + ',').join('\n');
  src = src.slice(0, at) + insert + src.slice(at);
  fs.writeFileSync(file, src);
  total += questions.length;
  console.log('injected', questions.length, '->', file);
}
console.log('batch total questions injected:', total);
