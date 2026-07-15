/* ═══════════════════════════════════════════════════════════════════
   Angular — RxJS & Observables
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('angular-rxjs', {
    title: 'RxJS & Observables',
    description: 'Reactive programming with RxJS — Observables, Subjects, essential operators, error handling, memory leak prevention, and patterns for HTTP, forms, and real-time data in Angular.',
    sections: [
        {
            title: 'Observables & Subjects',
            content: `<p>An <strong>Observable</strong> is a lazy push-based collection — it emits values over time and doesn't execute until subscribed. <strong>Subjects</strong> are both Observable and Observer — they multicast to multiple subscribers.</p>`,
            code: `// Observable — lazy, cold (each subscriber gets independent execution)
const http$ = this.http.get<User[]>('/api/users');
// Nothing happens until subscribe:
http$.subscribe(users => console.log(users));

// Subject — hot, multicast (shared execution)
const action$ = new Subject<string>();
action$.subscribe(a => console.log('Sub 1:', a));
action$.subscribe(a => console.log('Sub 2:', a));
action$.next('click'); // Both subscribers receive 'click'

// Subject variants:
// BehaviorSubject — has current value, emits last value to new subscribers
const user$ = new BehaviorSubject<User | null>(null);
user$.getValue(); // Access current value synchronously
user$.next(newUser); // Emit new value

// ReplaySubject — replays N last values to new subscribers
const events$ = new ReplaySubject<Event>(5); // Buffer last 5
events$.next(event1);
events$.next(event2);
events$.subscribe(e => {}); // Receives event1, event2 immediately

// AsyncSubject — emits only the LAST value, only on complete
const result$ = new AsyncSubject<number>();
result$.next(1); result$.next(2); result$.next(3);
result$.complete(); // Subscriber receives only 3

// Cold vs Hot:
// Cold: each subscriber gets independent execution (HTTP calls)
// Hot: shared execution, late subscribers miss past emissions (WebSocket, user events)

// Converting to signal (Angular 16+):
const users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });`,
            language: 'typescript'
        },
        {
            title: 'Essential Operators',
            content: `<p>RxJS operators transform, filter, combine, and control observable streams. Mastering the top 15-20 operators covers 95% of real-world scenarios.</p>`,
            code: `import { map, filter, switchMap, mergeMap, concatMap, exhaustMap,
         debounceTime, distinctUntilChanged, catchError, retry,
         takeUntil, tap, combineLatest, forkJoin, withLatestFrom,
         shareReplay, startWith } from 'rxjs/operators';

// TRANSFORMATION
// map — transform each emitted value
users$.pipe(map(users => users.filter(u => u.isActive)));

// switchMap — cancel previous inner observable (HTTP search, route params)
searchInput$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => this.http.get(\`/api/search?q=\${term}\`))
  // Previous HTTP request cancelled when new term emitted!
);

// mergeMap — run inner observables concurrently (parallel operations)
fileIds$.pipe(
  mergeMap(id => this.http.get(\`/api/files/\${id}\`), 3) // Max 3 concurrent
);

// concatMap — run inner observables sequentially (order matters)
actions$.pipe(
  concatMap(action => this.http.post('/api/actions', action))
  // Each request waits for previous to complete
);

// exhaustMap — ignore new emissions while inner is active (prevent double-submit)
submitBtn$.pipe(
  exhaustMap(() => this.http.post('/api/orders', order))
  // Clicks during pending request are IGNORED
);

// COMBINATION
// combineLatest — emits when ANY source emits (all must have emitted once)
combineLatest([filter$, sort$, page$]).pipe(
  switchMap(([filter, sort, page]) => this.loadData(filter, sort, page))
);

// forkJoin — emits when ALL sources complete (parallel HTTP)
forkJoin({
  users: this.http.get<User[]>('/api/users'),
  roles: this.http.get<Role[]>('/api/roles'),
  config: this.http.get<Config>('/api/config')
}).subscribe(({ users, roles, config }) => { /* all loaded */ });

// shareReplay — multicast + replay for shared HTTP results
private users$ = this.http.get<User[]>('/api/users').pipe(
  shareReplay({ bufferSize: 1, refCount: true }) // Cache result, cleanup when no subscribers
);`,
            language: 'typescript'
        },
        {
            title: 'Error Handling & Retry',
            content: `<p>Observable error handling differs from try/catch — errors propagate through the stream and terminate the subscription unless caught with <code>catchError</code>. Retry operators provide resilience for transient failures.</p>`,
            code: `// catchError — handle error and return fallback
this.http.get<User[]>('/api/users').pipe(
  catchError(err => {
    console.error('Failed to load users:', err);
    return of([]); // Return empty array as fallback
  })
);

// retry — automatically retry on failure
this.http.get('/api/data').pipe(
  retry({ count: 3, delay: 1000 }) // 3 retries, 1s between each
);

// Exponential backoff retry:
this.http.get('/api/data').pipe(
  retry({
    count: 3,
    delay: (error, retryCount) => timer(Math.pow(2, retryCount) * 1000)
    // 2s, 4s, 8s delays
  })
);

// Conditional retry (only retry transient errors):
this.http.get('/api/data').pipe(
  retry({
    count: 3,
    delay: (error, retryCount) => {
      if (error.status === 404) return throwError(() => error); // Don't retry 404
      if (error.status >= 500) return timer(retryCount * 1000); // Retry server errors
      return throwError(() => error); // Don't retry other client errors
    }
  }),
  catchError(err => {
    this.notificationService.showError('Failed after retries');
    return EMPTY; // Complete without emitting
  })
);

// Error handling in effects/services (global):
@Injectable()
export class ApiService {
  private handleError(operation: string) {
    return (error: HttpErrorResponse) => {
      if (error.status === 401) {
        this.authService.logout();
        return EMPTY;
      }
      this.logger.error(\`\${operation} failed: \${error.message}\`);
      return throwError(() => new AppError(operation, error));
    };
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users').pipe(
      retry({ count: 2, delay: 1000 }),
      catchError(this.handleError('getUsers'))
    );
  }
}`,
            language: 'typescript'
        },
        {
            title: 'Memory Leaks & Unsubscription',
            content: `<p>Subscriptions that outlive their component cause memory leaks — the component is destroyed but the subscription keeps running, holding references. Angular provides several patterns to prevent this.</p>`,
            code: `// PROBLEM: Subscription leaks when component is destroyed
@Component({ /* ... */ })
export class LeakyComponent implements OnInit {
  ngOnInit() {
    this.dataService.stream$.subscribe(data => {
      this.data = data; // Runs FOREVER even after component destroyed!
    });
  }
}

// SOLUTION 1: takeUntilDestroyed (Angular 16+ — RECOMMENDED)
export class SafeComponent {
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.dataService.stream$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => this.process(data));
  }
}

// SOLUTION 2: toSignal (Angular 16+ — BEST for templates)
export class SignalComponent {
  // Auto-subscribes AND auto-unsubscribes
  data = toSignal(this.dataService.stream$, { initialValue: null });
  // Template: {{ data() }}
}

// SOLUTION 3: async pipe (classic — auto-unsubscribes)
@Component({
  template: \`
    @if (users$ | async; as users) {
      @for (user of users; track user.id) {
        <app-user [user]="user" />
      }
    }
  \`
})
export class AsyncPipeComponent {
  users$ = this.http.get<User[]>('/api/users');
  // async pipe subscribes in template, unsubscribes on destroy
}

// SOLUTION 4: takeUntil with destroy subject (pre-Angular 16)
export class OlderComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.stream$.pipe(
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// What does NOT need unsubscription:
// - HTTP calls (HttpClient completes automatically after response)
// - Router events (handled by Angular)
// - async pipe (auto-unsubscribes)
// - toSignal (auto-unsubscribes)
// - Finite observables (of(), from(), timer() without repeat)

// What DOES need unsubscription:
// - interval(), WebSocket streams, Subject subscriptions
// - fromEvent() subscriptions
// - Infinite streams (real-time data, polling)`,
            language: 'typescript',
            callout: { type: 'warning', title: 'Memory Leak Detection', text: 'Use Angular DevTools or browser Memory tab to detect leaks. Common symptom: detached DOM nodes growing over time as you navigate between routes. Enforce takeUntilDestroyed() or toSignal() via ESLint rules (rxjs/no-subscribe in templates).' }
        }
    ],
    questions: [
        {"question":"Compare switchMap, mergeMap, concatMap, and exhaustMap. When do you use each?","difficulty":"hard","answer":"<p>All are higher-order mapping operators that flatten an inner observable per source emission; they differ in how they handle overlap: <strong>switchMap</strong> cancels the previous inner observable when a new value arrives (latest wins) — ideal for type-ahead search and route params. <strong>mergeMap</strong> runs all inner observables concurrently (no cancellation, no ordering) — for independent parallel work. <strong>concatMap</strong> queues them and runs one at a time in order — when order matters and each must complete. <strong>exhaustMap</strong> ignores new source values while an inner is still running — ideal for preventing duplicate submits (login button spam).</p>","explanation":"switchMap = \"cancel the old order, I changed my mind\" (search box). mergeMap = \"start all orders at once.\" concatMap = \"one at a time, in line.\" exhaustMap = \"ignore new orders until this one is done\" (double-click guard).","bestPractices":["switchMap for latest-wins (search, route changes)","concatMap when order/completion matters","exhaustMap to prevent duplicate submissions"],"commonMistakes":["mergeMap for search (stale results race in)","switchMap for writes that must all complete (cancels in-flight saves)","Nested subscribes instead of a flattening operator"],"interviewTip":"Give the canonical use case for each (search=switchMap, submit-guard=exhaustMap, ordered=concatMap, parallel=mergeMap) — that mapping is exactly what interviewers probe.","followUp":["Why is switchMap dangerous for save operations?","What happens to unsubscribed inner observables?","How do these help with race conditions?"]},
        {"question":"How do you prevent memory leaks from RxJS subscriptions in Angular?","difficulty":"medium","answer":"<p>A subscription that outlives its component keeps the component (and its DOM/closures) alive — a leak. Prevent it by <strong>unsubscribing</strong> when the component is destroyed. Best options: the <strong>async pipe</strong> (<code>obs$ | async</code>) which subscribes and unsubscribes automatically; <strong>takeUntilDestroyed()</strong> (Angular 16+) or <code>takeUntil(destroy$)</code> tied to ngOnDestroy; or converting to <strong>signals</strong> via <code>toSignal</code> which manages cleanup.</p><p>Operators that complete on their own (like a single HttpClient call) do not leak, but long-lived streams (route params, event streams, intervals, stores) must be cleaned up.</p>","explanation":"An open subscription is like leaving a tap running after you leave the room — it keeps consuming even though nobody is using it. The async pipe is a tap that shuts itself off when you leave.","bestPractices":["Prefer the async pipe (auto-unsubscribe)","Use takeUntilDestroyed() / takeUntil(destroy$) for manual subscribes","Convert streams to signals with toSignal where suitable"],"commonMistakes":["Manual subscribe with no unsubscribe in ngOnDestroy","Subscribing inside templates or loops","Assuming all observables complete on their own"],"interviewTip":"Lead with the async pipe as the cleanest fix and takeUntilDestroyed for manual cases; note that self-completing HTTP calls are fine.","followUp":["When does an HttpClient subscription not leak?","What does takeUntilDestroyed do?","Why can nested subscribes leak?"]},
        {
            question: 'What is the difference between switchMap, mergeMap, concatMap, and exhaustMap?',
            difficulty: 'medium',
            answer: `<p>These are "higher-order mapping" operators — they map each emission to an inner Observable and flatten the results. They differ in how they handle concurrent inner subscriptions:</p>
            <ul>
                <li><code>switchMap</code> — cancels previous inner observable when new emission arrives (latest only)</li>
                <li><code>mergeMap</code> — runs all inner observables concurrently (parallel)</li>
                <li><code>concatMap</code> — queues and runs inner observables sequentially (ordered)</li>
                <li><code>exhaustMap</code> — ignores new emissions while inner is still running (first wins)</li>
            </ul>`,
            code: `// switchMap — CANCEL previous (search, route params, autocomplete)
searchInput$.pipe(
  switchMap(term => this.http.get(\`/search?q=\${term}\`))
  // User types "ang" → HTTP fires
  // User types "angular" → previous HTTP CANCELLED, new one fires
  // Only latest result matters!
);

// mergeMap — ALL run concurrently (bulk operations, independent requests)
selectedIds$.pipe(
  mergeMap(id => this.http.delete(\`/api/items/\${id}\`), 5)
  // All deletions run in parallel (max 5 concurrent)
  // Order of completion doesn't matter
);

// concatMap — QUEUE sequentially (order-dependent operations)
chatMessages$.pipe(
  concatMap(msg => this.http.post('/api/messages', msg))
  // Each message sent AFTER previous completes
  // Guarantees server receives in order
);

// exhaustMap — IGNORE while busy (prevent double-submit)
submitButton$.pipe(
  exhaustMap(() => this.http.post('/api/orders', this.form.value))
  // First click → fires request
  // Clicks during pending request → IGNORED
  // After response → next click works again
);

// Decision guide:
// "I only care about the latest"     → switchMap (search, navigation)
// "Do all of them in parallel"       → mergeMap (bulk operations)
// "Do them in order, one at a time"  → concatMap (sequential writes)
// "Ignore until current finishes"    → exhaustMap (form submit, login)`,
            language: 'typescript',
            bestPractices: [
                'Use switchMap for search/autocomplete (cancel stale requests)',
                'Use exhaustMap for form submissions (prevent double-submit)',
                'Use concatMap for ordered writes (messages, sequential API calls)',
                'Limit mergeMap concurrency parameter for bulk operations'
            ],
            commonMistakes: [
                'Using mergeMap for search (stale results arrive after current results)',
                'Using switchMap for form submit (cancels the save if user triggers another action)',
                'Nesting subscribes instead of using higher-order operators (callback hell)',
                'Not limiting concurrency in mergeMap (overwhelming the server)'
            ],
            interviewTip: 'Draw a marble diagram for each. The visual makes the difference clear instantly: switchMap unsubscribes (cancels), mergeMap keeps all alive, concatMap queues, exhaustMap drops. Relate each to a real use case.',
            followUp: ['What happens if the inner observable errors in switchMap?', 'How do you limit concurrency in mergeMap?', 'When would concatMap cause performance issues?'],
            seniorPerspective: 'I have a mental decision tree: user-triggered search = switchMap, button click = exhaustMap, background sync = concatMap, batch processing = mergeMap with concurrency limit. Getting this wrong causes bugs that are hard to reproduce.',
            architectPerspective: 'These operators encode concurrency policies declaratively. In event-driven architectures, choosing the wrong flattening strategy causes race conditions, lost updates, or overwhelmed backends. I enforce operator choice via code review guidelines per use case category.'
        },
        {
            question: 'How do you prevent memory leaks from Observable subscriptions in Angular?',
            difficulty: 'medium',
            answer: `<p>Memory leaks occur when subscriptions outlive their component — the component is destroyed but the subscription keeps firing, holding references to the dead component. Modern Angular provides several patterns: <code>takeUntilDestroyed()</code>, <code>toSignal()</code>, async pipe, and the classic takeUntil + Subject pattern.</p>`,
            code: `// BEST: toSignal (Angular 16+) — auto-subscribe + auto-unsubscribe
export class BestComponent {
  users = toSignal(inject(HttpClient).get<User[]>('/api/users'), {
    initialValue: []
  });
  // Template: {{ users() }} — no subscription management!
}

// GREAT: takeUntilDestroyed (Angular 16+)
export class GreatComponent {
  private destroyRef = inject(DestroyRef);
  
  ngOnInit() {
    interval(1000).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(tick => this.update(tick));
    // Automatically unsubscribes when component is destroyed
  }
}

// GOOD: async pipe (classic Angular)
@Component({
  template: \`<div>{{ data$ | async }}</div>\`
})
export class GoodComponent {
  data$ = this.service.getData(); // async pipe handles lifecycle
}

// ACCEPTABLE: Manual subscription tracking (pre-Angular 16)
export class OlderComponent implements OnDestroy {
  private subs: Subscription[] = [];
  
  ngOnInit() {
    this.subs.push(
      this.stream1$.subscribe(/*...*/),
      this.stream2$.subscribe(/*...*/)
    );
  }
  
  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }
}

// NO unsubscription needed for:
// - HttpClient (completes after single response)
// - ActivatedRoute.params (managed by router)
// - Finite observables: of(), from([1,2,3])

// ALWAYS unsubscribe for:
// - interval(), timer() with repeat
// - fromEvent()
// - WebSocket / SignalR streams
// - BehaviorSubject subscriptions in services
// - Any stream that doesn't complete on its own`,
            language: 'typescript',
            bestPractices: [
                'Default to toSignal() for data displayed in templates',
                'Use takeUntilDestroyed() for side-effect subscriptions',
                'Use async pipe when signals aren\'t applicable',
                'Know which observables complete automatically (HTTP) vs run forever (interval)'
            ],
            commonMistakes: [
                'Subscribing in ngOnInit without any unsubscription strategy',
                'Assuming all observables complete (interval and fromEvent never complete)',
                'Using takeUntil without completing the destroy Subject (memory leak in the subject itself)',
                'Unsubscribing from HTTP calls (unnecessary — they complete after response)'
            ],
            interviewTip: 'Show the evolution: manual unsubscribe → takeUntil + Subject → takeUntilDestroyed → toSignal. Each generation is simpler and less error-prone. Modern Angular makes memory leak prevention almost automatic.',
            followUp: ['How do you detect memory leaks in Angular?', 'What is the difference between unsubscribe and complete?', 'Does the async pipe trigger change detection?'],
            seniorPerspective: 'I enforce an ESLint rule that flags .subscribe() without takeUntilDestroyed or equivalent. In new code, I use toSignal() for 90% of cases and takeUntilDestroyed for side effects. Manual subscription management is a code smell.',
            architectPerspective: 'Memory leaks are the #1 production issue in long-running Angular apps (dashboards, admin panels). I establish team patterns: toSignal for data, takeUntilDestroyed for effects, and automated leak detection in CI via Playwright + heap snapshots.'
        },
        {
            question: 'Explain cold vs hot observables and how shareReplay turns a cold source into a shared one.',
            difficulty: 'medium',
            answer: `<p>A <strong>cold</strong> observable starts its producer fresh for each subscriber — every <code>subscribe()</code> on <code>http.get()</code> fires a new HTTP request. A <strong>hot</strong> observable shares a single producer across subscribers; late subscribers miss earlier emissions (e.g., a Subject, WebSocket, or DOM events).</p>
            <p><code>shareReplay</code> multicasts a cold source so all subscribers share one execution and replays the last N values to late subscribers. With <code>{ bufferSize: 1, refCount: true }</code> it caches the latest value and tears the source down when the subscriber count drops to zero — the standard pattern for a shared, cached HTTP result.</p>`,
            explanation: 'A cold observable is like everyone getting their own freshly cooked meal when they order. A hot observable is a live concert — show up late and you miss the opening songs. shareReplay is recording the concert and replaying the latest bit to anyone who walks in, while only running one show.',
            code: `import { shareReplay, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);

  // Without shareReplay: every subscriber triggers a new GET /api/config
  // With shareReplay: ONE request, result cached and replayed
  readonly config$: Observable<AppConfig> = this.http.get<AppConfig>('/api/config').pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
}

// Two components subscribing -> still only one HTTP call
// refCount:true  -> source unsubscribed when last subscriber leaves
//                   (a new subscriber later re-fetches)
// refCount:false -> source stays alive forever (true cache for app lifetime)

// Pitfall: refCount:false keeps the stream alive even with no subscribers,
// which is what you want for a permanent cache but a leak for transient data.`,
            language: 'typescript',
            bestPractices: [
                'Use shareReplay({ bufferSize: 1, refCount: true }) for shared HTTP results',
                'Reach for refCount:false only for genuinely app-lifetime caches',
                'Remember HttpClient observables are cold — each subscribe re-requests',
                'Prefer toSignal() when the shared value is consumed in templates'
            ],
            commonMistakes: [
                'Subscribing to the same cold HTTP observable in multiple places, firing duplicate requests',
                'Using shareReplay without refCount and leaking a never-completing source',
                'Assuming a Subject is cold — it is hot, late subscribers miss past values',
                'Caching with shareReplay when the data must always be fresh'
            ],
            interviewTip: 'Define cold (per-subscriber execution) vs hot (shared execution) first, then position shareReplay as the bridge. The bufferSize/refCount options are the detail interviewers probe — explain what each controls.',
            followUp: ['What is the difference between refCount true and false?', 'How does shareReplay differ from a BehaviorSubject as a cache?'],
            seniorPerspective: 'I default shared lookups (config, current user, reference data) to shareReplay({ bufferSize: 1, refCount: true }) so I get request de-duplication for free. When I need a permanent app-lifetime cache I switch to refCount:false deliberately and document why, because that variant never tears down.',
            architectPerspective: 'Cold-vs-hot is really about who owns the producer. Getting it wrong shows up as duplicate network load or stale shared state. I codify shared-data access through services that own the shareReplay so call sites cannot accidentally multiply requests.'
        },
        {
            question: 'How does error handling work in RxJS, and how do you build resilient retry with backoff while distinguishing transient from permanent failures?',
            difficulty: 'hard',
            answer: `<p>An RxJS error terminates the stream — no further emissions, and operators downstream of the failure never run. You recover with <code>catchError</code>, which must return a replacement observable (a fallback, <code>EMPTY</code> to complete silently, or <code>throwError</code> to rethrow).</p>
            <p><strong>Placement matters:</strong> a <code>catchError</code> inside a <code>switchMap</code>'s inner pipeline recovers without killing the outer stream; a top-level <code>catchError</code> ends the whole stream. For resilience, use <code>retry</code> with a <code>delay</code> function for exponential backoff, and only retry transient errors (5xx, network) — rethrow permanent ones (4xx) so you do not hammer the server on a guaranteed failure.</p>`,
            explanation: 'An error is like a tripped circuit breaker — everything downstream goes dark. catchError is the electrician who decides whether to flip it back on (retry), swap in a backup generator (fallback), or quietly close up shop (EMPTY). Retrying a 404 is like flipping a breaker that is off because the wire was cut — pointless.',
            code: `import { timer, throwError, EMPTY, of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

getReport(id: string) {
  return this.http.get<Report>('/api/reports/' + id).pipe(
    retry({
      count: 3,
      delay: (error: HttpErrorResponse, retryCount) => {
        // Only retry transient failures
        const transient = error.status === 0 || error.status >= 500;
        if (!transient) return throwError(() => error);   // 4xx: fail fast
        const backoffMs = Math.min(1000 * 2 ** (retryCount - 1), 8000); // 1s,2s,4s
        return timer(backoffMs);
      }
    }),
    catchError(err => {
      this.logger.error('getReport failed', err);
      // Recover with a safe fallback so the UI does not break
      return err.status === 404 ? of(EMPTY_REPORT) : throwError(() => err);
    })
  );
}

// Inner vs outer catchError with switchMap:
search$ = this.term$.pipe(
  switchMap(term =>
    this.http.get<Result[]>('/api/search?q=' + term).pipe(
      catchError(() => of([]))   // inner: a failed search does NOT kill the stream
    )
  )
);`,
            language: 'typescript',
            bestPractices: [
                'Return EMPTY to complete quietly, throwError to propagate, or a value to recover',
                'Retry only transient errors (network/5xx); fail fast on 4xx',
                'Use exponential backoff with a cap to avoid thundering-herd retries',
                'Place catchError inside switchMap when the outer stream must survive inner failures'
            ],
            commonMistakes: [
                'Putting catchError at the top level so one error permanently kills a long-lived stream',
                'Retrying non-idempotent writes or 4xx errors that will never succeed',
                'Returning nothing from catchError (it must return an observable)',
                'Infinite/unbounded retry with no delay, overwhelming a struggling backend'
            ],
            interviewTip: 'Two senior signals: (1) catchError placement relative to switchMap determines whether the outer stream survives, and (2) retry should be conditional with backoff, not blind. Mention idempotency before retrying writes.',
            followUp: ['Why does catchError inside switchMap behave differently than outside?', 'When is retrying a write operation unsafe?'],
            seniorPerspective: 'For user-facing search/typeahead I always nest catchError inside switchMap so a single failed keystroke does not dead-end the stream and freeze the box. For writes I gate retries on idempotency and status code — blindly retrying a POST can double-charge a customer.',
            architectPerspective: 'Retry-with-backoff is a client-side reliability policy that must be coordinated with server rate limits and circuit breakers. Uncapped client retries can amplify an outage. I standardize a shared retry policy (transient-only, capped exponential backoff, jitter) across the data layer rather than letting each call invent its own.'
        },
        {
            question: 'When do you use combineLatest, forkJoin, and withLatestFrom? They look similar but behave very differently.',
            difficulty: 'medium',
            answer: `<p>All three combine multiple streams, but their timing differs:</p>
            <ul>
                <li><code>forkJoin</code> waits for <strong>all</strong> sources to <strong>complete</strong>, then emits the last value of each once. Ideal for parallel one-shot HTTP calls (like Promise.all).</li>
                <li><code>combineLatest</code> emits whenever <strong>any</strong> source emits, after <strong>every</strong> source has emitted at least once. Ideal for reactive UI derived from multiple live inputs (filter + sort + page).</li>
                <li><code>withLatestFrom</code> emits only when the <strong>primary</strong> source emits, pulling the latest value of the others. Ideal for "on submit, grab the current form/user state."</li>
            </ul>`,
            explanation: 'forkJoin is waiting for every runner to cross the finish line before reading the results. combineLatest is a scoreboard that updates every time any player scores. withLatestFrom is a photographer who only snaps when the lead actor moves, capturing whoever else happens to be standing there.',
            code: `import { forkJoin, combineLatest, withLatestFrom, map } from 'rxjs';

// forkJoin — parallel HTTP, emit once when ALL complete
forkJoin({
  user: this.http.get<User>('/api/me'),
  perms: this.http.get<Perm[]>('/api/permissions'),
}).subscribe(({ user, perms }) => this.init(user, perms));

// combineLatest — recompute results whenever ANY filter changes
results$ = combineLatest([this.filter$, this.sort$, this.page$]).pipe(
  switchMap(([filter, sort, page]) => this.api.search(filter, sort, page))
);

// withLatestFrom — on button click, read the latest form value (form doesn't trigger)
save$ = this.saveClicks$.pipe(
  withLatestFrom(this.formValue$),
  switchMap(([, form]) => this.api.save(form))
);

// Gotcha: combineLatest never emits until EVERY source has emitted once.
// Use startWith() to seed sources that may not emit immediately.
ready$ = combineLatest([
  this.a$.pipe(startWith(null)),
  this.b$.pipe(startWith(null)),
]);`,
            language: 'typescript',
            bestPractices: [
                'Use forkJoin for parallel one-shot requests that complete',
                'Use combineLatest for derived state from multiple live inputs',
                'Seed combineLatest sources with startWith if they may not emit early',
                'Use withLatestFrom to sample passive state on an active trigger'
            ],
            commonMistakes: [
                'Using forkJoin with a source that never completes (it will never emit)',
                'Expecting combineLatest to emit before every source has produced a value',
                'Using combineLatest where withLatestFrom is correct, causing extra emissions',
                'forkJoin silently emitting nothing because one inner errored or did not complete'
            ],
            interviewTip: 'Anchor each to a use case: forkJoin = parallel HTTP (completes), combineLatest = reactive derived UI (live), withLatestFrom = sample-on-trigger. The forkJoin-needs-completion and combineLatest-needs-all-emitted gotchas are the common traps.',
            followUp: ['Why does forkJoin never emit if one source does not complete?', 'How does zip differ from combineLatest?'],
            seniorPerspective: 'The bug I see most is forkJoin used over a stream that never completes (an interval or a BehaviorSubject) — it just hangs. I keep forkJoin strictly for HTTP-style one-shots and reach for combineLatest the moment any input is long-lived.',
            architectPerspective: 'These operators encode coordination semantics declaratively. Choosing the wrong one produces subtle timing bugs — missing emissions or emission storms — that are hard to reproduce. I review combinator choice as carefully as any concurrency decision because it is effectively defining the data-flow contract.'
        },
        {
            question: 'Compare BehaviorSubject, ReplaySubject, and AsyncSubject, and explain when to convert a Subject-based store to signals with toSignal.',
            difficulty: 'advanced',
            answer: `<p>The Subject variants differ in what they hand to new subscribers:</p>
            <ul>
                <li><code>Subject</code> — no initial value, late subscribers miss past emissions.</li>
                <li><code>BehaviorSubject</code> — requires an initial value, emits the current value immediately; <code>getValue()</code> reads it synchronously. The classic state-store primitive.</li>
                <li><code>ReplaySubject(n)</code> — replays the last n values (and can buffer by time) to new subscribers; no initial value required.</li>
                <li><code>AsyncSubject</code> — emits only the final value, and only on <code>complete()</code>.</li>
            </ul>
            <p>For synchronous component/UI state, a BehaviorSubject + async pipe is increasingly replaced by a <strong>signal</strong> (or <code>toSignal()</code> over an existing stream): signals are glitch-free, read synchronously without <code>getValue()</code>, and integrate with fine-grained change detection. Keep RxJS for async streams; expose them to templates via <code>toSignal</code>.</p>`,
            explanation: 'BehaviorSubject is a whiteboard always showing the current number. ReplaySubject is a security camera that replays the last few moments to anyone who tunes in. AsyncSubject is a sealed envelope opened only at the very end. Signals are like a smart whiteboard wired so every dependent display updates the instant you change the number.',
            code: `import { BehaviorSubject } from 'rxjs';
import { signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

// Classic RxJS store
class CartStoreRx {
  private state$ = new BehaviorSubject<CartItem[]>([]);
  items$ = this.state$.asObservable();
  add(item: CartItem) { this.state$.next([...this.state$.getValue(), item]); }
}

// Signal-based store (synchronous, glitch-free, no getValue())
class CartStore {
  private items = signal<CartItem[]>([]);
  readonly all = this.items.asReadonly();
  readonly total = computed(() => this.items().reduce((s, i) => s + i.price, 0));
  add(item: CartItem) { this.items.update(list => [...list, item]); }
}

// Bridge: existing async stream -> signal for template consumption
class LivePrices {
  private socket$ = inject(PriceSocket).stream$;          // hot observable
  prices = toSignal(this.socket$, { initialValue: {} as PriceMap });
  // template reads {{ prices() }} — auto subscribe/unsubscribe
}`,
            language: 'typescript',
            bestPractices: [
                'Use BehaviorSubject (or a signal) when consumers need a current value immediately',
                'Use ReplaySubject when late subscribers must see recent history',
                'Prefer signals for synchronous state; keep RxJS for async streams',
                'Expose async streams to templates via toSignal for automatic cleanup'
            ],
            commonMistakes: [
                'Using a plain Subject for state, so late subscribers get nothing until the next emit',
                'Reaching for getValue() everywhere instead of modeling state as a signal',
                'Using AsyncSubject and forgetting it emits nothing until complete()',
                'Duplicating state in both a BehaviorSubject and a signal, causing drift'
            ],
            interviewTip: 'Differentiate by "what new subscribers receive": Behavior = current, Replay = recent history, Async = final-on-complete. Then make the modern point: synchronous state belongs in signals, async pipelines stay in RxJS, and toSignal bridges them.',
            followUp: ['Why are signals described as glitch-free compared to combined BehaviorSubjects?', 'When would you still choose a BehaviorSubject over a signal?'],
            seniorPerspective: 'I now model synchronous app/component state with signals and keep BehaviorSubjects only where a service must expose an Observable to RxJS-heavy collaborators. The synchronous read and lack of getValue() boilerplate removes a whole class of "stale value" bugs. For live feeds I keep the RxJS source and surface it with toSignal.',
            architectPerspective: 'Subject variants are a manual reactivity toolkit; signals are a managed dependency graph. Mixing both invites duplicated, drifting state. I draw a clear boundary — RxJS at async edges (sockets, HTTP, timers), signals for in-app state — with toSignal/toObservable as the only sanctioned bridges, so there is one source of truth per piece of state.'
        }
    ]
});
