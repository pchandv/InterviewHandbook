/* ═══════════════════════════════════════════════════════════════════
   Angular — State Management: NgRx, Signals, Component Store
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('angular-state', {
    title: 'Angular State Management',
    description: 'NgRx Store, Component Store, signal-based state, when to use global vs local state, and managing complex application state in large Angular applications.',
    sections: [
        {
            title: 'Version Comparison: Old vs Modern State Management',
            content: `<p>Angular state management has evolved dramatically. Understanding the <strong>before and after</strong> helps you migrate legacy code and answer interview questions about trade-offs between approaches across Angular versions.</p>`,
            table: {
                headers: ['Concern', 'Angular 2-14 (Old)', 'Angular 16-19 (Modern)'],
                rows: [
                    ['Reactive state', 'BehaviorSubject + async pipe', 'signal() + computed() — synchronous, auto-tracked'],
                    ['Derived state', 'combineLatest + map or tap', 'computed() — glitch-free, no subscription'],
                    ['Global store', 'NgRx Store: actions → reducers → effects', 'NgRx SignalStore: withState → withMethods → rxMethod'],
                    ['Feature-scoped state', 'Feature module + StoreModule.forFeature()', 'ComponentStore or signalStore({ providedIn: route })'],
                    ['Input-driven state', 'ngOnChanges + manual mapping', 'input() signals → computed() auto-reacts'],
                    ['Store read', 'store.select(selector) | async', 'store.selectSignal(selector)() — no pipe needed'],
                    ['Side effects', 'createEffect with class (Actions + ofType)', 'Functional createEffect or rxMethod in SignalStore'],
                    ['Unsubscribe', 'takeUntil(destroy$) / async pipe', 'toSignal() auto-cleans up; takeUntilDestroyed()'],
                    ['Module registration', '@NgModule + StoreModule.forRoot()', 'provideStore() / provideState() in bootstrapApplication'],
                    ['DevTools', 'Redux DevTools via StoreDevtoolsModule', 'provideStoreDevtools() — same functionality']
                ]
            },
            code: `// ═══ BEFORE (Angular 12, BehaviorSubject + NgModule) ═══
// user.service.ts
@Injectable({ providedIn: 'root' })
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();
  activeUsers$ = this.users$.pipe(
    map(users => users.filter(u => u.isActive))
  );

  loadUsers(): void {
    this.http.get<User[]>('/api/users').subscribe(
      users => this.usersSubject.next(users)
      // Leak risk! No unsubscription
    );
  }
}

// component.ts
@Component({
  template: \`<div *ngFor="let u of users$ | async">{{ u.name }}</div>\`
})
export class UserListComponent implements OnInit, OnDestroy {
  users$ = this.userService.activeUsers$;
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}
  ngOnInit() { this.userService.loadUsers(); }
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}

// ═══ AFTER (Angular 18+, Signals) ═══
// user.state.ts
@Injectable({ providedIn: 'root' })
export class UserState {
  private http = inject(HttpClient);
  private _users = signal<User[]>([]);

  readonly users = this._users.asReadonly();
  readonly activeUsers = computed(() => this._users().filter(u => u.isActive));
  readonly count = computed(() => this.activeUsers().length);

  loadUsers(): void {
    this.http.get<User[]>('/api/users').pipe(
      takeUntilDestroyed()  // auto-cleanup
    ).subscribe(users => this._users.set(users));
  }
}

// component.ts
@Component({
  template: \`@for (u of state.activeUsers(); track u.id) { <span>{{ u.name }}</span> }\`
})
export class UserListComponent {
  protected state = inject(UserState);
  constructor() { this.state.loadUsers(); }
  // No OnDestroy, no Subject, no async pipe, no subscription management
}`,
            language: 'typescript',
            callout: { type: 'info', title: 'Migration tip', text: 'You can mix both approaches during migration. Use toSignal() to convert existing observables to signals, and toObservable() to feed signals into RxJS pipelines. Migrate leaf components first (presentational), then work inward.' }
        },
        {
            title: 'NgRx Store (Redux Pattern)',
            content: `<p><strong>NgRx</strong> implements the Redux pattern in Angular: a single immutable store, actions describe events, reducers produce new state, effects handle side effects. Best for large apps with complex shared state.</p>`,
            code: `// 1. State interface
export interface AppState {
  users: UserState;
}
export interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
}

// 2. Actions — describe what happened
export const loadUsers = createAction('[Users] Load');
export const loadUsersSuccess = createAction('[Users] Load Success', props<{ users: User[] }>());
export const loadUsersFailure = createAction('[Users] Load Failure', props<{ error: string }>());

// 3. Reducer — pure function producing new state
export const userReducer = createReducer(
  { users: [], loading: false, error: null },
  on(loadUsers, state => ({ ...state, loading: true, error: null })),
  on(loadUsersSuccess, (state, { users }) => ({ ...state, users, loading: false })),
  on(loadUsersFailure, (state, { error }) => ({ ...state, error, loading: false }))
);

// 4. Effects — handle side effects (API calls)
export const loadUsers$ = createEffect((
  actions$ = inject(Actions),
  userService = inject(UserService)
) => actions$.pipe(
  ofType(loadUsers),
  exhaustMap(() => userService.getAll().pipe(
    map(users => loadUsersSuccess({ users })),
    catchError(err => of(loadUsersFailure({ error: err.message })))
  ))
), { functional: true });

// 5. Selectors — derive data from state
export const selectUsers = createSelector(
  (state: AppState) => state.users,
  userState => userState.users
);
export const selectActiveUsers = createSelector(selectUsers, users => users.filter(u => u.isActive));

// 6. Component usage
@Component({ template: \`@for (user of users(); track user.id) { <app-user [user]="user" /> }\` })
export class UserListComponent {
  private store = inject(Store);
  users = this.store.selectSignal(selectActiveUsers); // Signal from store!
  
  ngOnInit() { this.store.dispatch(loadUsers()); }
}`,
            language: 'typescript'
        },
        {
            title: 'Lightweight Alternatives: Signals & Component Store',
            content: `<p>Not every app needs NgRx. For simpler state, <strong>signals</strong> (Angular 16+) or <strong>Component Store</strong> provide reactive state without the Redux ceremony.</p>`,
            code: `// SIGNAL-BASED STATE SERVICE (simplest approach):
@Injectable({ providedIn: 'root' })
export class UserStateService {
  private _users = signal<User[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  
  // Public read-only signals
  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly activeUsers = computed(() => this._users().filter(u => u.isActive));
  readonly userCount = computed(() => this._users().length);

  private http = inject(HttpClient);

  loadUsers(): void {
    this._loading.set(true);
    this.http.get<User[]>('/api/users').pipe(
      finalize(() => this._loading.set(false))
    ).subscribe({
      next: users => this._users.set(users),
      error: err => this._error.set(err.message)
    });
  }

  addUser(user: User): void {
    this._users.update(list => [...list, user]);
  }
}

// COMPONENT STORE (NgRx, but local to a component/feature):
@Injectable()
export class UserListStore extends ComponentStore<UserState> {
  readonly users$ = this.select(state => state.users);
  readonly loading$ = this.select(state => state.loading);

  readonly loadUsers = this.effect<void>(trigger$ => trigger$.pipe(
    tap(() => this.patchState({ loading: true })),
    switchMap(() => this.userService.getAll().pipe(
      tapResponse(
        users => this.patchState({ users, loading: false }),
        error => this.patchState({ error, loading: false })
      )
    ))
  ));
}

// DECISION GUIDE:
// Simple app / few shared states → Signal-based services
// Feature-level complex state   → Component Store
// Large app / many shared flows → NgRx Store
// Rule of thumb: start simple, add ceremony only when complexity demands it`,
            language: 'typescript'
        },
        {
            title: 'NgRx SignalStore (@ngrx/signals)',
            content: `<p><strong>NgRx SignalStore</strong> (Angular 17+) is a signal-native store that replaces the action/reducer/effect triad with a functional, composable API. State is exposed as signals, derived state uses <code>computed()</code>, and methods replace action dispatch.</p>
            <p>It is the recommended approach for new NgRx features when you want signal-first ergonomics without sacrificing structured state management.</p>`,
            code: `import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';

// ═══ Old: Classic NgRx Store (actions + reducer + effect + selector = 4 files) ═══
// users.actions.ts:  createAction('[Users] Load'), createAction('[Users] Load Success', props<...>())
// users.reducer.ts:  createReducer(initialState, on(loadUsers, ...), on(loadUsersSuccess, ...))
// users.effects.ts:  createEffect(actions$ => actions$.pipe(ofType(loadUsers), ...))
// users.selectors.ts: createSelector(selectUserState, state => state.users)
// Component: store.dispatch(loadUsers()); store.select(selectUsers) | async

// ═══ New: NgRx SignalStore (one file, signal-native) ═══
interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
}

export const UsersStore = signalStore(
  { providedIn: 'root' },  // or provide at component level for scoped lifecycle

  withState<UsersState>({ users: [], loading: false, error: null }),

  withComputed(({ users }) => ({
    activeUsers: computed(() => users().filter(u => u.isActive)),
    count: computed(() => users().length),
    hasError: computed(() => !!users()),  // derives from state signals
  })),

  withMethods((store, userService = inject(UserService)) => ({
    // Synchronous updater
    clearError() { patchState(store, { error: null }); },

    // Async method with RxJS (rxMethod handles subscription lifecycle)
    loadUsers: rxMethod<void>(pipe(
      tap(() => patchState(store, { loading: true })),
      switchMap(() => userService.getAll().pipe(
        tapResponse({
          next: (users) => patchState(store, { users, loading: false }),
          error: (e: Error) => patchState(store, { error: e.message, loading: false }),
        })
      ))
    )),

    // Method with parameters
    addUser: rxMethod<CreateUserDto>(pipe(
      exhaustMap((dto) => userService.create(dto).pipe(
        tapResponse({
          next: (user) => patchState(store, { users: [...store.users(), user] }),
          error: (e: Error) => patchState(store, { error: e.message }),
        })
      ))
    )),
  })),

  withHooks({
    onInit(store) { store.loadUsers(); },  // load on first injection
    onDestroy() { console.log('store destroyed'); }
  })
);

// Component usage — dramatically simpler:
@Component({
  template: \\\`
    @if (store.loading()) { <app-spinner /> }
    @for (user of store.activeUsers(); track user.id) {
      <app-user-card [user]="user" />
    }
    <p>Total: {{ store.count() }}</p>
  \\\`,
  providers: [UsersStore]  // scoped to this component if not root
})
export class UserListComponent {
  protected store = inject(UsersStore);
}

// Custom store features (reusable "withX" plugins):
export function withLoadingState() {
  return signalStoreFeature(
    withState({ loading: false }),
    withMethods((store) => ({
      setLoading(loading: boolean) { patchState(store, { loading }); }
    }))
  );
}
// Usage: signalStore(withLoadingState(), withState({ data: [] }), ...)`,
            language: 'typescript',
            callout: { type: 'warning', title: 'Trade-off vs Classic Store', text: 'SignalStore trades the central action log (and thus Redux DevTools time-travel) for lower boilerplate. If your team relies on action tracing across features or complex middleware, classic Store still wins. For new features, SignalStore is the NgRx team\u2019s recommended default.' }
        },
        {
            title: 'Selectors Deep Dive: Memoization & Performance',
            content: `<p><strong>Selectors</strong> are memoized functions that derive state slices. Understanding their caching behavior is critical for performance — an improperly written selector can cause re-renders on every store update.</p>`,
            code: `// ═══ How memoization works ═══
// createSelector checks inputs by REFERENCE (===).
// If all inputs are the same reference, it returns the cached result.

// GOOD: memoized — only recomputes when userState.users reference changes
export const selectActiveUsers = createSelector(
  selectUsers,
  (users) => users.filter(u => u.isActive)  // expensive filter
);

// BAD: always returns a new reference (breaks memoization downstream)
export const selectBroken = createSelector(
  selectUsers,
  (users) => ({ data: users, count: users.length })
  // Returns a NEW object literal every time — even if users hasn't changed!
  // Every subscriber re-renders because object !== previous object
);

// FIX: split into separate selectors
export const selectUserData = createSelector(selectUsers, users => users);
export const selectUserCount = createSelector(selectUsers, users => users.length);

// ═══ Parameterized selectors (cache-size-1 problem) ═══
// WRONG: one selector called with alternating IDs thrashes the cache
export const selectUserById = createSelector(
  selectUsers,
  (users, props: { id: string }) => users.find(u => u.id === props.id)
);
// Called with id='A' then id='B' then id='A' → recomputes every time!

// FIX: factory function — each call creates its own memoized selector
export const selectUserById = (id: string) => createSelector(
  selectUsers,
  (users) => users.find(u => u.id === id)
);
// Component creates ONE instance: this.user = this.store.selectSignal(selectUserById('abc'));
// Each instance has its own 1-entry cache — no thrashing.

// ═══ Custom memoization (advanced) ═══
import { createSelectorFactory, defaultMemoize } from '@ngrx/store';

// Deep-equality memoization for selectors returning arrays that are
// structurally equal but different references (e.g., after re-fetch)
export const selectUsersDeepEqual = createSelectorFactory(
  (projector) => defaultMemoize(projector, undefined, (a, b) => JSON.stringify(a) === JSON.stringify(b))
)(selectUserState, state => state.users.filter(u => u.isActive));

// ═══ selectSignal vs select (Angular 16+) ═══
// Old: this.store.select(selectUsers).pipe(...) — returns Observable, needs async pipe
// New: this.store.selectSignal(selectUsers) — returns Signal, read with ()
const users = this.store.selectSignal(selectActiveUsers);
// Template: {{ users().length }} — no pipe, no subscription`,
            language: 'typescript'
        },
        {
            title: 'Optimistic Updates & Rollback',
            content: `<p><strong>Optimistic updates</strong> immediately reflect a change in local state before the server confirms it — giving instant UI feedback. The challenge is <strong>rolling back</strong> cleanly on failure and handling concurrent edits.</p>`,
            code: `// ═══ Pattern: Optimistic Update with Correlation ID + Rollback ═══

// 1. Actions carry a correlationId + snapshot for rollback
export const updateTodo = createAction('[Todos] Update',
  props<{ todo: Todo; correlationId: string; previous: Todo }>());
export const updateTodoSuccess = createAction('[Todos] Update Success',
  props<{ todo: Todo; correlationId: string }>());
export const updateTodoFailure = createAction('[Todos] Update Failure',
  props<{ previous: Todo; correlationId: string; error: string }>());

// 2. Reducer: apply optimistically on dispatch, confirm/revert on response
export const todosReducer = createReducer(initialState,
  // Optimistic: update immediately + mark pending
  on(updateTodo, (state, { todo }) =>
    adapter.updateOne({ id: todo.id, changes: { ...todo, _pending: true } }, state)),

  // Confirmed: remove pending flag
  on(updateTodoSuccess, (state, { todo }) =>
    adapter.updateOne({ id: todo.id, changes: { ...todo, _pending: false } }, state)),

  // Failed: ROLLBACK to the snapshotted previous value
  on(updateTodoFailure, (state, { previous }) =>
    adapter.updateOne({ id: previous.id, changes: { ...previous, _pending: false } }, state))
);

// 3. Effect: use mergeMap (NOT switchMap!) so concurrent edits aren't cancelled
export const updateTodo$ = createEffect((
  actions$ = inject(Actions),
  api = inject(TodoApi),
  toast = inject(ToastService)
) => actions$.pipe(
  ofType(updateTodo),
  mergeMap(({ todo, correlationId, previous }) =>
    api.update(todo).pipe(
      map(saved => updateTodoSuccess({ todo: saved, correlationId })),
      catchError(err => {
        toast.error("Save failed — change reverted");
        return of(updateTodoFailure({ previous, correlationId, error: err.message }));
      })
    )
  )
), { functional: true });

// 4. Component dispatches with snapshot:
save(updated: Todo) {
  const previous = this.store.selectSignal(selectTodoById(updated.id))();
  this.store.dispatch(updateTodo({
    todo: updated,
    previous,
    correlationId: crypto.randomUUID()
  }));
}

// KEY RULES:
// • mergeMap for writes (switchMap cancels in-flight saves!)
// • Snapshot BEFORE dispatching so rollback is exact
// • correlationId ties async result to the specific edit
// • Show _pending state in UI (e.g., greyed out, spinner)`,
            language: 'typescript'
        },
        {
            title: 'State Persistence & Rehydration',
            content: `<p>Persisting state to <code>localStorage</code> or <code>IndexedDB</code> lets users resume where they left off after a page reload. Implemented via <strong>meta-reducers</strong> — middleware that wraps the root reducer.</p>`,
            code: `// ═══ Meta-Reducer Pattern for Persistence ═══

interface PersistedState {
  version: number;  // Schema version for migration
  data: Partial<AppState>;
}

const STORAGE_KEY = 'app-state-v2';
const CURRENT_VERSION = 2;

export function persistStateMetaReducer(
  reducer: ActionReducer<AppState>
): ActionReducer<AppState> {
  return (state, action) => {
    // ─── REHYDRATE on app init ───
    if (action.type === INIT || action.type === UPDATE) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const persisted: PersistedState = JSON.parse(raw);
          if (persisted.version === CURRENT_VERSION) {
            // Merge persisted data into initial state
            state = { ...state, ...persisted.data } as AppState;
          } else {
            // Version mismatch → migrate or discard
            const migrated = migrateState(persisted);
            if (migrated) state = { ...state, ...migrated } as AppState;
            // else: discard stale state, start fresh
          }
        } catch { /* corrupt data — discard silently */ }
      }
    }

    const nextState = reducer(state, action);

    // ─── PERSIST after every action (selective slices only!) ───
    const toPersist: PersistedState = {
      version: CURRENT_VERSION,
      data: {
        user: nextState.user,        // ✅ durable: user preferences
        cart: nextState.cart,         // ✅ durable: shopping cart
        // ❌ NEVER persist: loading, error, ui flags, auth tokens
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));

    return nextState;
  };
}

// State migration (when schema changes between deploys)
function migrateState(old: PersistedState): Partial<AppState> | null {
  if (old.version === 1) {
    // v1 → v2: renamed user.preferences to user.settings
    return {
      user: { ...old.data.user, settings: (old.data.user as any)?.preferences }
    } as any;
  }
  return null; // Unknown version — discard
}

// Registration:
// bootstrapApplication(AppComponent, {
//   providers: [
//     provideStore(reducers, { metaReducers: [persistStateMetaReducer] })
//   ]
// });

// ═══ Throttled persistence (performance) ═══
// For chatty state, throttle writes to avoid blocking the main thread:
let writeTimeout: any;
function throttledPersist(data: PersistedState) {
  clearTimeout(writeTimeout);
  writeTimeout = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, 1000); // Write at most once per second
}`,
            language: 'typescript',
            callout: { type: 'warning', title: 'Security', text: 'NEVER persist auth tokens or sensitive PII in localStorage — it is readable by any XSS. Use HttpOnly cookies for tokens. Only persist user preferences, UI state, and non-sensitive application data.' }
        },
        {
            title: 'Decision Matrix: Which State Tool When?',
            content: `<p>Use this matrix to choose the right state approach based on your actual requirements:</p>`,
            table: {
                headers: ['Requirement', 'signal() service', 'ComponentStore', 'NgRx Store', 'NgRx SignalStore'],
                rows: [
                    ['Simple component state', '\u2705 Best', '\u2705 OK', '\u274c Overkill', '\u2705 OK'],
                    ['Feature-scoped async', '\u2705 OK', '\u2705 Best', '\u2705 OK', '\u2705 Best'],
                    ['Cross-feature shared state', '\u2705 OK', '\u274c (lifecycle)', '\u2705 Best', '\u2705 Best'],
                    ['Time-travel debugging', '\u274c No', '\u274c No', '\u2705 Best', '\u26a0\ufe0f Limited'],
                    ['Action traceability/audit', '\u274c No', '\u274c No', '\u2705 Best', '\u274c No'],
                    ['Low boilerplate', '\u2705 Best', '\u2705 Good', '\u274c Heavy', '\u2705 Good'],
                    ['Optimistic updates', '\u26a0\ufe0f Manual', '\u2705 OK', '\u2705 Best', '\u2705 Good'],
                    ['State persistence', '\u26a0\ufe0f Manual', '\u274c No built-in', '\u2705 Best (meta-reducer)', '\u26a0\ufe0f Manual'],
                    ['Large team (10+ devs)', '\u274c Ad-hoc', '\u2705 OK', '\u2705 Best (enforced patterns)', '\u2705 Good'],
                    ['SSR/hydration', '\u2705 (transferState)', '\u2705 OK', '\u2705 Built-in', '\u2705 OK']
                ]
            }
        }
    ],
    questions: [
        {"question":"When do you need a state management library (like NgRx) versus simple service-with-signals state?","difficulty":"hard","answer":"<p>Not every app needs a store. A <strong>service holding signals</strong> (or a BehaviorSubject) is enough for local or moderately-shared state — simple, low-boilerplate. Reach for a <strong>store (NgRx/NgRx Signal Store)</strong> when state is complex and shared across many unrelated components, when you need predictable state transitions, time-travel debugging, strong traceability of \"what changed and why,\" or sophisticated side-effect orchestration (effects).</p><p>The trade-off is boilerplate and indirection. Rule of thumb: start with service+signals; adopt a store when shared-state complexity, debuggability, and team scale justify the ceremony.</p>","explanation":"A signals service is a shared notepad on the wall — perfect for a small team. NgRx is a full records office with logged, auditable changes — worth it when many departments touch the same data and you need a paper trail.","bestPractices":["Start with service + signals for most state","Adopt a store for complex, widely-shared, traceable state","Keep components dumb; centralize state transitions"],"commonMistakes":["Adding NgRx to a small app (needless boilerplate)","Scattering shared state across components","Using effects for logic that belongs in reducers/computed"],"interviewTip":"Show judgment: \"service+signals by default, a store when shared-state complexity and debuggability justify it\" — avoid dogmatically recommending NgRx.","followUp":["What does NgRx give you over a signals service?","What is the NgRx Signal Store?","How do you avoid store boilerplate?"]},
        {"question":"What are the core building blocks of the NgRx (Redux) pattern, and how does data flow through them?","difficulty":"hard","answer":"<p>NgRx follows the Redux one-way data flow with: <strong>Store</strong> (a single immutable state tree), <strong>Actions</strong> (plain events describing what happened), <strong>Reducers</strong> (pure functions computing the next state from current state + action), <strong>Selectors</strong> (memoized, composable reads of slices of state), and <strong>Effects</strong> (handle side effects like HTTP, listening to actions and dispatching new ones).</p><p>Flow: a component <em>dispatches</em> an Action → Reducers produce new state (pure, synchronous) → Selectors expose derived state to components; side effects (API calls) run in Effects, which dispatch success/failure Actions that feed back into reducers. The unidirectional, immutable, pure-reducer design makes state predictable and debuggable.</p>","explanation":"It is a strict office mailroom: you file a request form (action), a clerk who never improvises updates the master ledger (reducer), you read the ledger through indexed views (selectors), and any phone calls to outside vendors happen in a separate department (effects) that files its own follow-up forms.","bestPractices":["Keep reducers pure and synchronous","Put all side effects in Effects","Use memoized selectors for derived state"],"commonMistakes":["Side effects or async in reducers","Mutating state instead of returning new state","Deriving state in components instead of selectors"],"interviewTip":"Name the five pieces and the one-way flow (dispatch → reducer → store → selector; effects for async). Stress pure reducers + immutability as the source of predictability.","followUp":["Why must reducers be pure?","How do selectors memoize?","How do Effects handle HTTP failures?"]},
        {
            question: 'When would you use NgRx vs signal-based services for state management?',
            difficulty: 'medium',
            answer: `<p>Use <strong>signal-based services</strong> for simple-to-moderate state (most apps). Use <strong>NgRx</strong> when you need: complex shared state across many components, time-travel debugging, strict unidirectional data flow enforcement, or when your team is large and needs the structure Redux provides. NgRx adds ceremony that only pays off in complex scenarios.</p>`,
            bestPractices: ['Start with signal services — only add NgRx when complexity warrants it', 'Use NgRx selectors for derived state (memoized automatically)', 'Use effects for all side effects (HTTP, WebSocket, timers)', 'Use Component Store for feature-scoped state that does not need to be global'],
            commonMistakes: ['Using NgRx for simple CRUD apps (over-engineering with boilerplate)', 'Putting ALL state in NgRx (local UI state belongs in components)', 'Not using selectors (deriving state in components causes re-computation)', 'Fat reducers with side effects (side effects belong in effects, not reducers)'],
            interviewTip: 'Show pragmatism: "I start with signal-based services for 80% of state needs. NgRx comes in when we have complex cross-feature state, need debugging tools (Redux DevTools), or the team benefits from enforced patterns. Over-engineering state management is worse than under-engineering it."',
            followUp: ['What are NgRx selectors and why are they important?', 'How do signals change state management in Angular?', 'What is the Component Store?'],
            seniorPerspective: 'My rule: if I can manage the state in a signal service with < 50 lines, NgRx is overkill. NgRx shines when state flows are complex (undo/redo, optimistic updates, complex caching) or when 5+ developers need shared patterns to stay consistent.',
            architectPerspective: 'State management choice reflects team size and app complexity. 1-3 devs: signals. 5-10 devs on a large app: NgRx gives structure and prevents ad-hoc state patterns. The key: whatever you choose, be consistent. A mix of approaches across features is the worst outcome.'
        },
        {
            question: 'Explain how NgRx selectors achieve memoization and why createSelector composition matters at scale.',
            difficulty: 'hard',
            answer: `<p><strong>Selectors</strong> are pure functions that derive a slice of state. <code>createSelector</code> wraps them in a memoizing function that caches the <em>last input arguments</em> and the <em>last result</em>. On each emission it does a reference (<code>===</code>) check of the input projector arguments; if all inputs are referentially equal to the previous call, it returns the cached result without re-running the projector.</p><ul><li><strong>Composition:</strong> selectors compose — a selector can take other selectors as inputs, building a dependency graph. Each level memoizes independently, so an expensive transform only recomputes when its specific input slice changes.</li><li><strong>Why it matters at scale:</strong> because reducers return new references only for changed slices, an unrelated state change does not invalidate a selector whose inputs are unchanged. This keeps <code>OnPush</code> components from re-rendering and avoids re-running heavy derivations (filtering, sorting, joins).</li><li><strong>Caveat:</strong> the default memoization cache size is 1. A selector called with alternating inputs (e.g., parameterized via a factory) thrashes the cache. Use selector factories per-instance or <code>createSelectorFactory</code> with a custom memoizer.</li></ul>`,
            explanation: 'A selector is like a spreadsheet cell with a formula: it only recalculates when one of the cells it references actually changes, otherwise it hands back the value it already computed.',
            code: `export const selectUserState = (state: AppState) => state.users;

export const selectUsers = createSelector(selectUserState, s => s.users);

// Expensive derivation — only recomputes when selectUsers reference changes
export const selectSortedActiveUsers = createSelector(
  selectUsers,
  users => users.filter(u => u.isActive).sort((a, b) => a.name.localeCompare(b.name))
);

// Parameterized selector via factory (avoids cache-size-1 thrashing)
export const selectUserById = (id: string) => createSelector(
  selectUsers,
  users => users.find(u => u.id === id)
);

// In component: create one instance per id so each keeps its own memo cache
readonly user = this.store.selectSignal(selectUserById(this.id));`,
            language: 'typescript',
            bestPractices: ['Compose selectors instead of reaching into deep state in components', 'Keep projector functions pure and free of side effects', 'Use selector factories for parameterized selectors to preserve memoization', 'Co-locate selectors with their feature state and export a public surface'],
            commonMistakes: ['Doing filtering/sorting inside the component template instead of a selector', 'Reusing one parameterized selector with changing args (cache size 1 thrashing)', 'Returning new object/array literals inside a projector unconditionally (breaks downstream memoization)', 'Putting business logic in selectors that belongs in effects or services'],
            interviewTip: 'Mention the cache-size-1 default and the selector-factory pattern — it signals you have actually debugged a real memoization problem rather than just read the docs.',
            followUp: ['How would you debug a selector that recomputes too often?', 'What is the difference between selectSignal and select?', 'How does createSelectorFactory let you customize equality?'],
            seniorPerspective: 'On a dashboard with 30+ widgets each subscribing to derived slices, I traced jank to selectors returning fresh array references every tick. Splitting the raw slice from the derived projection, and making projections only emit on genuine input changes, cut change-detection cycles dramatically. I also profile with Redux DevTools and the Angular DevTools profiler together.',
            architectPerspective: 'Selectors are the read-model boundary of the store — they are where I enforce that components never know the shape of global state, only the view-models they consume. That indirection lets me refactor state shape without touching components, and it is where I would later insert entity-adapter normalization or cross-feature joins without leaking complexity outward.'
        },
        {
            question: 'How do you decide between the global Store, ComponentStore, and a signal-based service for a given feature?',
            difficulty: 'advanced',
            answer: `<p>The decision is driven by <strong>scope of sharing</strong>, <strong>lifecycle</strong>, and <strong>complexity of side effects</strong>:</p><ul><li><strong>Signal-based service:</strong> reactive local or app state with minimal side-effect orchestration. Lowest ceremony, synchronous reads via <code>computed</code>, ideal for UI state and simple caches.</li><li><strong>ComponentStore:</strong> feature- or component-scoped state with non-trivial async flows (debounced search, cancellation via <code>switchMap</code>) that should be torn down with the component. It gives you effects and <code>tapResponse</code> without polluting global state.</li><li><strong>Global Store (NgRx):</strong> state shared across many lazy-loaded features, requiring time-travel debugging, action-based traceability, or strict separation of dispatch/reduce/effect for a large team.</li></ul><p>A key signal is <strong>lifecycle</strong>: ComponentStore dies with its provider, so it is perfect for "state that should not survive navigation." Global Store persists for the app session.</p>`,
            explanation: 'Pick the smallest container that still holds everything that needs to share the state: a drawer for one room (signal service), a cabinet for one department (ComponentStore), or a central warehouse for the whole company (global Store).',
            bestPractices: ['Default to the narrowest scope; promote to global only when sharing demands it', 'Use ComponentStore for state whose lifetime should match a route/component', 'Keep a single consistent approach per feature rather than mixing within one feature', 'Expose read-only signals/observables and keep mutation methods explicit'],
            commonMistakes: ['Putting transient UI state (modal open, active tab) in the global Store', 'Using a root-provided signal service for state that should reset on navigation', 'Mixing ComponentStore and global Store for the same data, causing dual sources of truth', 'Reaching for NgRx purely for HTTP calls that a service handles fine'],
            interviewTip: 'Frame the answer around lifecycle and sharing scope, not personal preference — interviewers want to see you reason about teardown and source-of-truth, not just recite tooling.',
            followUp: ['How does ComponentStore handle teardown of in-flight effects?', 'When would you migrate a signal service to NgRx?', 'How do you avoid two sources of truth across stores?'],
            seniorPerspective: 'I have seen teams default everything to global NgRx and end up with a store littered with ephemeral UI flags and stale entries after navigation. My heuristic: if removing the component should erase the state, it belongs in ComponentStore or a component-provided signal service, never in the root store.',
            architectPerspective: 'This is fundamentally about bounded contexts inside the client. The global Store is shared infrastructure with a governance cost; ComponentStore and signal services are local autonomy. I document a decision tree in the front-end architecture guide so 10+ engineers make the same call consistently, because inconsistency here is what makes large Angular apps unmaintainable.'
        },
        {
            question: 'NgRx SignalStore (@ngrx/signals) — how does it differ from the classic Store, and when would you adopt it?',
            difficulty: 'advanced',
            answer: `<p><strong>SignalStore</strong> is NgRx's signal-native state container built with <code>signalStore()</code>, <code>withState</code>, <code>withComputed</code>, <code>withMethods</code>, and <code>withHooks</code>. It replaces the action/reducer/effect triad with a more direct, functional API while keeping reactivity.</p><ul><li><strong>State is signals:</strong> <code>withState</code> exposes deeply nested state as signals, and <code>withComputed</code> gives memoized derived signals — no <code>createSelector</code> boilerplate.</li><li><strong>Methods over actions:</strong> <code>withMethods</code> defines updaters and async flows (often using <code>rxMethod</code> for RxJS interop) instead of dispatching string-typed actions.</li><li><strong>No global reducer registry:</strong> stores are providable at root or component level, giving the same lifecycle flexibility as ComponentStore.</li><li><strong>Trade-off:</strong> you lose the central action log and Redux DevTools time-travel that the classic Store provides (though a DevTools bridge exists). For audit-heavy debugging, classic Store still wins.</li></ul><p><strong>Adopt it</strong> for new feature state where you want low boilerplate and signal-first ergonomics; keep classic Store where action traceability across a large team is the priority.</p>`,
            explanation: 'SignalStore is like upgrading from filling out formal request forms (actions) to calling methods directly — faster and less paperwork, but you give up the detailed paper trail that the form system gave you.',
            code: `export const UsersStore = signalStore(
  { providedIn: 'root' },
  withState<{ users: User[]; loading: boolean }>({ users: [], loading: false }),
  withComputed(({ users }) => ({
    activeUsers: computed(() => users().filter(u => u.isActive)),
    count: computed(() => users().length),
  })),
  withMethods((store, userService = inject(UserService)) => ({
    loadUsers: rxMethod<void>(pipe(
      tap(() => patchState(store, { loading: true })),
      switchMap(() => userService.getAll().pipe(
        tapResponse({
          next: users => patchState(store, { users, loading: false }),
          error: () => patchState(store, { loading: false }),
        })
      ))
    )),
  })),
);`,
            language: 'typescript',
            bestPractices: ['Use withComputed for derived state instead of recomputing in templates', 'Use rxMethod for async flows needing cancellation/debounce semantics', 'Provide store at component level when state should be feature-scoped', 'Group cohesive logic with custom features (withX) for reuse across stores'],
            commonMistakes: ['Expecting Redux DevTools time-travel to work identically out of the box', 'Mutating state directly instead of using patchState', 'Mixing SignalStore and classic Store for the same domain data', 'Overusing root-provided SignalStores for state that should be scoped/disposed'],
            interviewTip: 'Acknowledge the trade-off explicitly: SignalStore trades the central action log for ergonomics — saying that shows you understand why classic NgRx existed in the first place.',
            followUp: ['What is rxMethod and how does it manage subscriptions?', 'How do custom store features (withX) enable reuse?', 'How would you add DevTools support to a SignalStore?'],
            seniorPerspective: 'On a greenfield Angular 18 feature I moved a team off classic NgRx to SignalStore and the reducer/effect/action file count dropped roughly threefold, which materially cut onboarding time. The cost was that one engineer who relied on action-log time travel for a gnarly race condition had to switch to signal-based debugging.',
            architectPerspective: 'SignalStore aligns state management with Angular\'s signal-first direction, reducing the impedance mismatch between RxJS-era NgRx and the reactive primitives the framework now favors. Architecturally I treat the choice as a long-term bet: new code on SignalStore, existing large action-driven domains left on classic Store, with a clear rule preventing the two from owning the same slice.'
        },
        {
            question: 'How do you manage optimistic updates with rollback in NgRx, including correlating success/failure?',
            difficulty: 'expert',
            answer: `<p>An <strong>optimistic update</strong> applies the change to local state immediately, then reconciles with the server response. The hard parts are <strong>rollback on failure</strong> and <strong>correlating</strong> the async result with the specific optimistic change.</p><ul><li><strong>Apply optimistically:</strong> the reducer for the initiating action updates state right away, ideally tagging the entity with a temporary/pending marker (e.g., a client-generated correlation id).</li><li><strong>Effect performs the request:</strong> dispatch success/failure actions carrying the same correlation id so the reducer knows exactly which optimistic change to confirm or revert.</li><li><strong>Rollback:</strong> on failure, restore the prior value. Either snapshot the pre-update entity in the action payload, or recompute from a known-good source. With <code>@ngrx/entity</code> you can <code>updateOne</code> back to the original.</li><li><strong>Concurrency:</strong> use <code>mergeMap</code> (not <code>switchMap</code>) so concurrent optimistic edits are not cancelled, and rely on correlation ids to apply results in any order safely.</li></ul>`,
            explanation: 'It is like writing an answer in pencil before the teacher confirms it: you act as if it is correct, but you keep an eraser (the saved old value) ready so you can undo it cleanly if the teacher says no.',
            code: `// Action carries a correlationId + snapshot for rollback
export const updateUser = createAction('[Users] Update',
  props<{ user: User; correlationId: string }>());
export const updateUserSuccess = createAction('[Users] Update Success',
  props<{ user: User; correlationId: string }>());
export const updateUserFailure = createAction('[Users] Update Failure',
  props<{ previous: User; correlationId: string }>());

// Reducer: apply optimistically, then confirm/revert by id
on(updateUser, (state, { user }) => adapter.updateOne(
  { id: user.id, changes: { ...user, pending: true } }, state)),
on(updateUserSuccess, (state, { user }) => adapter.updateOne(
  { id: user.id, changes: { ...user, pending: false } }, state)),
on(updateUserFailure, (state, { previous }) => adapter.updateOne(
  { id: previous.id, changes: { ...previous, pending: false } }, state)),

// Effect: mergeMap keeps concurrent edits alive; correlationId ties result back
updateUser$ = createEffect((actions$ = inject(Actions), api = inject(UserApi)) =>
  actions$.pipe(
    ofType(updateUser),
    mergeMap(({ user, correlationId }) => api.update(user).pipe(
      map(saved => updateUserSuccess({ user: saved, correlationId })),
      catchError(() => of(updateUserFailure({ previous: user, correlationId })))
    ))
  ), { functional: true });`,
            language: 'typescript',
            bestPractices: ['Snapshot the previous entity so rollback is exact, not a guess', 'Use a correlation id to match async results to the originating change', 'Use mergeMap for independent concurrent edits; reserve switchMap for latest-wins reads', 'Surface a pending flag so the UI can show in-flight/failed state'],
            commonMistakes: ['Using switchMap for writes, cancelling earlier in-flight saves', 'Rolling back to a stale value because no snapshot was taken', 'Not handling out-of-order responses for concurrent edits', 'Leaving entities stuck in pending state when an error path is missed'],
            interviewTip: 'Lead with the two hard problems — rollback fidelity and result correlation — then show how the action payload (snapshot + correlationId) solves both; this proves you have shipped this, not just theorized.',
            followUp: ['How would you handle a conflict where the server returns a newer version (ETag)?', 'When is switchMap actually correct here?', 'How do you test optimistic rollback paths?'],
            seniorPerspective: 'On a collaborative editing surface, naive optimistic updates with switchMap silently dropped saves under rapid edits. Switching to mergeMap plus correlation ids and a per-entity pending flag eliminated lost updates, and we added an ETag/version check so a stale optimistic write surfaces a conflict instead of clobbering newer server data.',
            architectPerspective: 'Optimistic UI is a deliberate consistency trade-off: you choose perceived latency over strict read-after-write consistency, so you must design the reconciliation and conflict story up front. At scale I pair it with server-side versioning (ETags/optimistic concurrency) so the client and API agree on how conflicts resolve, rather than letting the UI assume it always wins.'
        }
    ,
        {
            question: 'How do you persist and rehydrate NgRx state across reloads, and what are the pitfalls?',
            difficulty: 'hard',
            answer: `<p>State persistence is implemented with a <strong>meta-reducer</strong> that (1) writes selected slices to storage on every action and (2) seeds the initial state from storage on startup (rehydration). Libraries like <code>ngrx-store-localstorage</code> wrap this, but the pattern is simple to hand-roll.</p>
            <ul>
                <li><strong>Persist selectively</strong> — only durable slices (user prefs, cart), never transient UI or loading flags.</li>
                <li><strong>Rehydrate</strong> by providing the parsed stored object as the initial state in the meta-reducer.</li>
                <li><strong>Version &amp; migrate</strong> — stored shape can drift from the current reducer shape; keep a version and migrate or discard on mismatch.</li>
            </ul>`,
            explanation: 'Persistence is like saving your game: you write a snapshot to disk so reloading the page resumes where you left off. But if the game updated and the old save format changed, you need a migration or the load will corrupt the new game.',
            code: `export function persistState(reducer: ActionReducer<AppState>): ActionReducer<AppState> {
  return (state, action) => {
    // Rehydrate on init
    if (action.type === INIT && !state) {
      const saved = localStorage.getItem('app-state');
      if (saved) { try { state = JSON.parse(saved); } catch { /* discard corrupt */ } }
    }
    const next = reducer(state, action);
    // Persist only durable slices
    const { user, cart } = next;
    localStorage.setItem('app-state', JSON.stringify({ user, cart }));
    return next;
  };
}
// providers: [provideStore(reducers, { metaReducers: [persistState] })]`,
            language: 'typescript',
            bestPractices: ['Persist only durable slices; never transient UI/loading/error state', 'Version the stored shape and migrate or discard on mismatch', 'Wrap JSON.parse in try/catch and discard corrupt data gracefully', 'Throttle writes for very chatty state to avoid blocking the main thread'],
            commonMistakes: ['Persisting the entire store, including loading flags and ephemeral UI', 'No version/migration, so a reducer shape change corrupts rehydration', 'Storing sensitive data (tokens, PII) in localStorage where XSS can read it', 'Synchronous localStorage writes on every action causing jank'],
            interviewTip: 'Lead with "meta-reducer for both persist and rehydrate" and immediately raise versioning/migration and not storing secrets \u2014 those are the pitfalls interviewers probe.',
            followUp: ['Why is localStorage risky for auth tokens?', 'How would you migrate persisted state after a shape change?', 'When would you persist to IndexedDB instead?'],
            seniorPerspective: 'I persist a deliberate allow-list of slices, never the whole store, and always version it \u2014 the bug that bites teams is a refactor that changes state shape and silently breaks every returning user until they clear storage.',
            architectPerspective: 'Persistence turns the client store into a cache of server truth, so I design it as such: server remains authoritative, persisted state is a fast-start optimization that can be discarded on version mismatch, and nothing security-sensitive lives there.'
        },
        {
            title: 'State Management Decision Framework',
            content: `<p>Choosing the right state management pattern depends on scope, complexity, and team size:</p>`,
            table: {
                headers: ['Scenario', 'Recommended Pattern', 'Why'],
                rows: [
                    ['Simple form state', 'signal() in component', 'Local, no sharing needed, disposed with component'],
                    ['Shared across 2-3 siblings', 'Service with signals', 'Injectable, minimal boilerplate, testable'],
                    ['Feature-level (10+ components)', 'ComponentStore or signalStore', 'Structured updates, devtools, computed selectors'],
                    ['App-wide (auth, cart, preferences)', 'NgRx Store or global signalStore', 'Actions/effects for complex async flows, time-travel debug'],
                    ['Server cache (API responses)', 'TanStack Query or custom cache service', 'Auto-refetch, stale-while-revalidate, no manual store wiring'],
                    ['URL-driven state', 'Router params + computed signals', 'Shareable via URL, browser back/forward works'],
                    ['Real-time state (WebSocket)', 'Service + signal + RxJS pipe', 'Observable stream → signal for template, auto-reconnect logic']
                ]
            },
            code: `// ═══ Lightweight signal-based service (most common pattern) ═══
@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>([]);
  
  // Expose read-only
  readonly cartItems = this.items.asReadonly();
  readonly total = computed(() => 
    this.items().reduce((sum, i) => sum + i.price * i.qty, 0));
  readonly count = computed(() => 
    this.items().reduce((sum, i) => sum + i.qty, 0));
  readonly isEmpty = computed(() => this.items().length === 0);

  addItem(product: Product, qty = 1): void {
    this.items.update(items => {
      const existing = items.find(i => i.productId === product.id);
      if (existing) {
        return items.map(i => i.productId === product.id 
          ? { ...i, qty: i.qty + qty } : i);
      }
      return [...items, { productId: product.id, name: product.name, 
                          price: product.price, qty }];
    });
  }

  removeItem(productId: string): void {
    this.items.update(items => items.filter(i => i.productId !== productId));
  }

  clear(): void { this.items.set([]); }
}

// ═══ NgRx SignalStore (structured, scalable) ═══
export const TodoStore = signalStore(
  { providedIn: 'root' },
  withState({ todos: [] as Todo[], filter: 'all' as Filter, loading: false }),
  withComputed(({ todos, filter }) => ({
    filteredTodos: computed(() => {
      const all = todos();
      switch (filter()) {
        case 'active': return all.filter(t => !t.completed);
        case 'completed': return all.filter(t => t.completed);
        default: return all;
      }
    }),
    stats: computed(() => ({
      total: todos().length,
      completed: todos().filter(t => t.completed).length,
      active: todos().filter(t => !t.completed).length
    }))
  })),
  withMethods((store, todoApi = inject(TodoApiService)) => ({
    async loadTodos() {
      patchState(store, { loading: true });
      const todos = await firstValueFrom(todoApi.getAll());
      patchState(store, { todos, loading: false });
    },
    addTodo(title: string) {
      patchState(store, { todos: [...store.todos(), { id: crypto.randomUUID(), title, completed: false }] });
    },
    toggleTodo(id: string) {
      patchState(store, { todos: store.todos().map(t => t.id === id ? { ...t, completed: !t.completed } : t) });
    },
    setFilter(filter: Filter) { patchState(store, { filter }); }
  }))
);`,
            language: 'typescript'
        }
    ]
});
