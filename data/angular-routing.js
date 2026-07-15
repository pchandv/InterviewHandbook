/* ═══════════════════════════════════════════════════════════════════
   Angular — Routing, Guards, Resolvers, Lazy Loading, Interceptors
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('angular-routing', {
    title: 'Angular Routing & Guards',
    description: 'Modern Angular routing — functional guards, resolvers, lazy loading, route configuration, interceptors, and protecting routes with authentication and role-based access.',
    sections: [
        {
            title: 'Route Configuration & Lazy Loading',
            content: `<p>Angular 17+ uses standalone components with functional route configuration. <strong>Lazy loading</strong> splits the app into chunks loaded on demand — reducing initial bundle size.</p>`,
            code: `// app.routes.ts — top-level route configuration
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent) },
  
  // Protected routes with guard
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component'),
    canActivate: [authGuard]
  },
  
  // Lazy-loaded feature module (route group)
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard, roleGuard('Admin')]
  },
  
  // Route with resolver (pre-fetch data)
  {
    path: 'users/:id',
    loadComponent: () => import('./users/user-detail.component'),
    canActivate: [authGuard],
    resolve: { user: userResolver },
    title: 'User Profile'  // Sets document title automatically
  },
  
  // Wildcard (404)
  { path: '**', loadComponent: () => import('./not-found.component') }
];

// admin/admin.routes.ts — lazy-loaded child routes
export const ADMIN_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./admin-dashboard.component') },
  { path: 'users', loadComponent: () => import('./admin-users.component') },
  { path: 'settings', loadComponent: () => import('./admin-settings.component'), canActivate: [roleGuard('SuperAdmin')] }
];

// Bootstrap with router:
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, 
      withComponentInputBinding(),       // Route params as @Input
      withViewTransitions(),             // Smooth page transitions
      withPreloading(PreloadAllModules)  // Preload lazy chunks in background
    )
  ]
});`,
            language: 'typescript'
        },
        {
            title: 'Functional Guards (Angular 15+)',
            content: `<p>Modern Angular uses <strong>functional guards</strong> — simple functions that return boolean, UrlTree, or Observable. They replace class-based guards (CanActivate interface) and integrate naturally with DI via <code>inject()</code>.</p>`,
            code: `// Functional auth guard (replaces class-based CanActivate)
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;  // Allow navigation
  }
  
  // Redirect to login with return URL
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

// Role-based guard (factory function for reusability)
export function roleGuard(...requiredRoles: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    const userRoles = authService.currentUser()?.roles ?? [];
    const hasRole = requiredRoles.some(role => userRoles.includes(role));
    
    return hasRole || router.createUrlTree(['/unauthorized']);
  };
}

// Usage in routes:
{ path: 'admin', canActivate: [authGuard, roleGuard('Admin', 'SuperAdmin')] }

// Async guard (check server-side permission)
export const permissionGuard: CanActivateFn = (route) => {
  const permissionService = inject(PermissionService);
  const requiredPermission = route.data['permission'] as string;
  
  return permissionService.hasPermission(requiredPermission); // Returns Observable<boolean>
};

// canDeactivate — prevent leaving with unsaved changes
export const unsavedChangesGuard: CanDeactivateFn<{ hasUnsavedChanges: () => boolean }> = 
  (component) => {
    if (component.hasUnsavedChanges()) {
      return confirm('You have unsaved changes. Leave anyway?');
    }
    return true;
  };

// canMatch — conditionally load different components for same route
export const featureFlagGuard: CanMatchFn = () => {
  const features = inject(FeatureFlagService);
  return features.isEnabled('new-dashboard');
};`,
            language: 'typescript'
        },
        {
            title: 'Resolvers & Interceptors',
            content: `<p><strong>Resolvers</strong> pre-fetch data before a route activates — the component renders only when data is ready. <strong>Interceptors</strong> transform HTTP requests/responses globally (auth headers, error handling, logging).</p>`,
            code: `// Functional resolver — prefetch data before component loads
export const userResolver: ResolveFn<User> = (route) => {
  const userService = inject(UserService);
  const id = route.paramMap.get('id')!;
  return userService.getById(id); // Waits for this before activating route
};

// Usage in route:
{ path: 'users/:id', resolve: { user: userResolver }, component: UserDetailComponent }

// Component receives resolved data via input:
@Component({ /* ... */ })
export class UserDetailComponent {
  user = input.required<User>(); // Populated from resolver via withComponentInputBinding()
}

// Functional HTTP Interceptor (Angular 15+)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: \`Bearer \${token}\` }
    });
  }
  
  return next(req);
};

// Error handling interceptor
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          router.navigate(['/login']);
          break;
        case 403:
          toast.error('You do not have permission for this action');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
      }
      return throwError(() => error);
    })
  );
};

// Loading indicator interceptor
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.show();
  return next(req).pipe(finalize(() => loading.hide()));
};

// Registration:
provideHttpClient(
  withInterceptors([authInterceptor, errorInterceptor, loadingInterceptor])
)`,
            language: 'typescript'
        }
    ],
    questions: [
        {"question":"What are route guards in Angular, and what are the main guard types?","difficulty":"medium","answer":"<p><strong>Route guards</strong> are functions that decide whether navigation may proceed, returning a boolean, a <code>UrlTree</code> (redirect), or an async (Promise/Observable) of those. Modern Angular uses functional guards. Main types: <strong>CanActivate</strong> (may the user enter this route? — auth checks), <strong>CanActivateChild</strong> (guard child routes), <strong>CanDeactivate</strong> (may the user leave? — unsaved-changes prompts), <strong>CanMatch</strong> (whether a route config matches at all — feature flags, role-based route selection), and <strong>resolve</strong> (pre-fetch data before activation).</p><p>Guards centralize navigation authorization/side effects instead of scattering checks in components.</p>","explanation":"Guards are checkpoints on a road: CanActivate checks your pass to enter, CanDeactivate asks \"are you sure you want to leave without saving?\", and resolve makes sure the destination is prepared before you arrive.","bestPractices":["Use CanActivate for auth, CanDeactivate for unsaved-changes","Return a UrlTree to redirect instead of manual navigation","Use CanMatch for role/feature-flag route selection"],"commonMistakes":["Putting auth checks in components instead of guards","Long-running work in guards blocking navigation","Forgetting resolve error handling"],"interviewTip":"List the guard types with a concrete use each (CanActivate=auth, CanDeactivate=unsaved changes, resolve=prefetch) — practical mapping over definitions.","followUp":["How does returning a UrlTree work?","When use CanMatch vs CanActivate?","What are the trade-offs of resolve vs loading in the component?"]},
        {"question":"What is lazy loading in Angular routing, and why does it matter?","difficulty":"medium","answer":"<p><strong>Lazy loading</strong> defers loading a feature's code until its route is visited, using <code>loadComponent</code> (standalone) or <code>loadChildren</code> in the route config. Angular splits that feature into a separate bundle downloaded on demand.</p><p>It matters for <strong>performance</strong>: the initial bundle stays small, so first load and time-to-interactive are faster — critical for large apps. Combine it with <strong>preloading strategies</strong> (e.g., PreloadAllModules or a custom strategy) to fetch likely-next routes in the background after the app loads, balancing fast startup with quick subsequent navigation.</p>","explanation":"Lazy loading is a restaurant that only cooks a dish when someone orders it, instead of cooking the entire menu at opening — the kitchen (initial load) starts much faster.","bestPractices":["Lazy-load feature routes with loadComponent/loadChildren","Use a preloading strategy for likely-next routes","Keep the initial (eager) bundle minimal"],"commonMistakes":["Eagerly loading the whole app, bloating initial bundle","No preloading, causing a delay on first navigation to a feature","Lazy-loading tiny features with negligible benefit"],"interviewTip":"Tie it to initial bundle size / TTI and mention preloading strategies as the way to keep subsequent navigation snappy.","followUp":["What preloading strategies exist?","How does lazy loading affect bundle splitting?","How do guards interact with lazy routes (CanMatch)?"]},
        {
            question: 'How do Angular route guards work? Explain the different guard types.',
            difficulty: 'medium',
            answer: `<p>Route guards are functions that run before/during/after navigation to control access. They return <code>true</code> (allow), <code>false</code> (block), or a <code>UrlTree</code> (redirect). Modern Angular uses functional guards with <code>inject()</code> for DI access.</p>
            <ul>
                <li><code>canActivate</code> — can the user navigate TO this route?</li>
                <li><code>canDeactivate</code> — can the user navigate AWAY from this route?</li>
                <li><code>canMatch</code> — should this route definition be considered at all?</li>
                <li><code>resolve</code> — pre-fetch data before activating the route</li>
                <li><code>canActivateChild</code> — can child routes be activated?</li>
            </ul>`,
            code: `// canActivate — protect routes (authentication, authorization)
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() || router.createUrlTree(['/login']);
};

// canDeactivate — prevent leaving with unsaved data
export const dirtyFormGuard: CanDeactivateFn<FormComponent> = (component) => {
  return !component.isDirty() || confirm('Discard unsaved changes?');
};

// canMatch — feature flags, A/B testing
{ path: 'dashboard', canMatch: [() => inject(Features).isEnabled('v2-dashboard')],
  loadComponent: () => import('./dashboard-v2.component') },
{ path: 'dashboard', loadComponent: () => import('./dashboard-v1.component') },
// First matching route wins — v2 loads only if feature flag is on

// resolve — pre-fetch data
export const orderResolver: ResolveFn<Order> = (route) =>
  inject(OrderService).getById(+route.params['id']);

// Guard execution order:
// 1. canMatch (is this route even considered?)
// 2. canActivateChild (on parent)
// 3. canActivate (on target route)
// 4. resolve (fetch data)
// 5. Component renders

// Multiple guards — ALL must pass:
{ path: 'admin/users', canActivate: [authGuard, roleGuard('Admin')] }
// If authGuard returns false → roleGuard never runs`,
            language: 'typescript',
            bestPractices: [
                'Use functional guards (simpler than class-based, tree-shakeable)',
                'Return UrlTree for redirects (not router.navigate() which causes race conditions)',
                'Use factory functions for parameterized guards: roleGuard("Admin")',
                'Keep guards lightweight — heavy logic should be in services'
            ],
            commonMistakes: [
                'Calling router.navigate() instead of returning UrlTree (timing issues)',
                'Not handling async guard results (Observable/Promise) properly',
                'Putting business logic in guards (guards should delegate to services)',
                'Forgetting that guards run on EVERY navigation (keep them fast)'
            ],
            interviewTip: 'Show the modern functional approach with inject(). Explain why UrlTree is preferred over router.navigate() — returning a UrlTree lets the router handle the redirect atomically, avoiding race conditions with multiple guards.',
            followUp: ['What is the difference between canActivate and canMatch?', 'How do you handle token refresh in a guard?', 'Can guards be async?'],
            seniorPerspective: 'I structure guards as thin routing-level decisions that delegate to AuthService/PermissionService. The guard returns true/false/redirect — it doesn\'t contain auth logic itself. This keeps guards testable and services reusable across guards and components.',
            architectPerspective: 'Guards implement the security perimeter for client-side routing, but remember: they are a UX convenience, not true security. The API must always re-validate permissions. Guards prevent users from seeing unauthorized UI; the backend prevents unauthorized actions.'
        },
        {
            question: 'How does lazy loading work in Angular and why is it important?',
            difficulty: 'easy',
            answer: `<p><strong>Lazy loading</strong> splits the application into chunks (bundles) that are loaded on demand when the user navigates to a route — rather than downloading the entire app upfront. This dramatically reduces initial load time for large applications.</p>`,
            code: `// WITHOUT lazy loading — entire app in one bundle:
// main.js: 2.5MB (ALL components, ALL routes loaded upfront)
// Initial load: 3-5 seconds on slow networks

// WITH lazy loading — split into chunks:
// main.js: 200KB (shell + home route only)
// admin.chunk.js: 300KB (loaded only when user navigates to /admin)
// reports.chunk.js: 500KB (loaded only if user visits reports)
// Initial load: <1 second

// Implementation — loadComponent for standalone:
const routes: Routes = [
  { path: 'home', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },
  { path: 'admin', loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES) },
];

// Preloading strategies — load lazy chunks in background after initial load:
provideRouter(routes,
  // Option 1: Preload ALL lazy routes after initial render
  withPreloading(PreloadAllModules),
  
  // Option 2: Custom strategy (preload based on user role or network)
  // withPreloading(CustomPreloadStrategy)
)

// Custom preload strategy:
@Injectable({ providedIn: 'root' })
export class RoleBasedPreload implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>) {
    // Only preload routes the user has access to
    if (route.data?.['preload'] === true) return load();
    return of(null);
  }
}

// Route data for preloading control:
{ path: 'dashboard', loadComponent: ..., data: { preload: true } }
{ path: 'admin', loadChildren: ..., data: { preload: false } } // Only admin users

// Result: Users see the app in <1s, lazy chunks load seamlessly in background`,
            language: 'typescript',
            bestPractices: [
                'Lazy load ALL feature routes (only eagerly load the shell + login)',
                'Use PreloadAllModules for apps where most users visit most sections',
                'Use custom preloading for large apps with role-based access',
                'Monitor chunk sizes with Angular bundle analyzer (ng build --stats-json)'
            ],
            commonMistakes: [
                'Eagerly importing lazy-loaded components elsewhere (defeats code splitting)',
                'Not lazy loading admin/rarely-visited sections (bloats initial bundle)',
                'Ignoring shared module sizes (large shared modules loaded by first lazy chunk)',
                'Not using loadComponent for standalone components (still importing eagerly)'
            ],
            interviewTip: 'Quantify the impact: "Our app went from 3MB initial → 400KB initial with lazy loading, reducing First Contentful Paint from 4s to 1.2s." Then explain the preloading strategy that makes subsequent navigations instant.',
            followUp: ['What preloading strategies are available?', 'How does tree-shaking relate to lazy loading?', 'How do you analyze bundle sizes?'],
            seniorPerspective: 'I enforce a budget in angular.json: initial bundle max 500KB. Any feature that would exceed this MUST be lazy loaded. Combined with PreloadAllModules, users get fast initial load AND instant subsequent navigation.',
            architectPerspective: 'Lazy loading is the frontend equivalent of microservice decomposition — each route is an independently loadable unit. For very large apps (50+ routes), I combine lazy loading with Module Federation for micro-frontends: separate teams build separate chunks deployed independently.'
        },
        {
            question: 'How do resolvers work, and what are the trade-offs of pre-fetching data in a resolver versus loading it inside the component?',
            difficulty: 'medium',
            answer: `<p>A <strong>resolver</strong> (<code>ResolveFn</code>) runs after guards pass and before the route activates. The router waits for the returned Observable/Promise to emit/resolve, then activates the route with the data available via <code>ActivatedRoute.data</code> — or directly as a component input when <code>withComponentInputBinding()</code> is enabled.</p>
            <p><strong>Trade-off:</strong> resolvers guarantee data is ready before render (no flicker, no empty state), but they <em>delay navigation</em> — the user sees the old page until resolution finishes. Loading in the component shows the new page immediately with a skeleton/spinner. Use resolvers for small, fast, must-have data; load in-component for slow or non-blocking data.</p>`,
            explanation: 'A resolver is like a restaurant that only seats you once your whole table\'s food is plated — no waiting at the table, but you stand at the door longer. In-component loading seats you immediately and brings dishes as they are ready. Each suits a different kind of impatience.',
            code: `import { ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';

export const userResolver: ResolveFn<User | null> = (route) => {
  const users = inject(UserService);
  const router = inject(Router);
  const id = route.paramMap.get('id')!;
  return users.getById(id).pipe(
    // Resolver errors abort navigation by default — handle them
    catchError(() => { router.navigate(['/users']); return of(null); })
  );
};

// Route wiring
// { path: 'users/:id', resolve: { user: userResolver },
//   loadComponent: () => import('./user-detail.component') }

// With withComponentInputBinding(), the resolved key maps to an input:
@Component({ selector: 'app-user-detail', standalone: true, template: '' })
export class UserDetailComponent {
  user = input.required<User | null>();   // populated from resolve.user
}`,
            language: 'typescript',
            bestPractices: [
                'Use resolvers for small, fast, mandatory data needed before first paint',
                'Always handle resolver errors (an unhandled error cancels navigation)',
                'Enable withComponentInputBinding() to receive resolved data as inputs',
                'Load slow or optional data inside the component with a loading state'
            ],
            commonMistakes: [
                'Putting slow queries in resolvers, making navigation feel frozen',
                'Returning an observable that never completes (navigation hangs)',
                'Ignoring resolver errors so navigation silently fails',
                'Resolving large payloads that the component could lazy-load progressively'
            ],
            interviewTip: 'The core trade-off line: resolvers prevent empty/flicker states but delay navigation; component loading is instant but needs a skeleton. Mention that resolver errors abort navigation unless caught.',
            followUp: ['What happens to navigation if a resolver errors?', 'How does withComponentInputBinding change how the component reads resolved data?'],
            seniorPerspective: 'I keep resolvers thin and fast — typically a single id-keyed fetch — and push anything slow into the component with a skeleton. A heavy resolver makes the app feel laggy because the router blocks on it, and users perceive the previous page as frozen.',
            architectPerspective: 'Resolvers move the loading boundary from inside the view to the navigation layer. That is a UX-architecture decision: blocking navigation suits flows where a half-rendered page is worse than a brief wait (detail pages), while progressive loading suits dashboards. I set a team convention rather than leaving it per-developer.'
        },
        {
            question: 'How do functional HTTP interceptors work, why must requests be cloned, and how does interceptor order matter?',
            difficulty: 'hard',
            answer: `<p>A functional interceptor (<code>HttpInterceptorFn</code>) is a function <code>(req, next) => next(modifiedReq)</code> registered via <code>provideHttpClient(withInterceptors([...]))</code>. <code>HttpRequest</code> is <strong>immutable</strong>, so you cannot set headers in place — you call <code>req.clone({ setHeaders })</code> and pass the clone to <code>next</code>.</p>
            <p><strong>Order is significant:</strong> interceptors form a chain in array order on the way out (request) and unwind in reverse on the way back (response). So an auth interceptor listed before a logging interceptor adds the token before logging sees it, and a retry/error interceptor placed last wraps everything beneath it.</p>`,
            explanation: 'Interceptors are like a series of mail-sorting stations a letter passes through. You can\'t scribble on the sealed envelope (immutable request) — you make a copy with the new stamp and forward that. The order of stations decides who stamps before whom, and replies travel back through the stations in reverse.',
            code: `import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError, retry, timer } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (!token) return next(req);
  // Immutable: clone with the header rather than mutating req
  const authed = req.clone({ setHeaders: { Authorization: 'Bearer ' + token } });
  return next(authed);
};

export const retryInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    retry({ count: 2, delay: (e: HttpErrorResponse, n) =>
      e.status >= 500 ? timer(500 * n) : throwError(() => e) })
  );

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  return next(req).pipe(catchError((e: HttpErrorResponse) => {
    if (e.status === 401) router.navigate(['/login']);
    return throwError(() => e);
  }));
};

// Order: auth runs first (adds token), then retry wraps the call,
// then error handling is outermost on the response path.
provideHttpClient(withInterceptors([authInterceptor, retryInterceptor, errorInterceptor]));`,
            language: 'typescript',
            bestPractices: [
                'Always use req.clone() to modify a request — never mutate it',
                'Order interceptors deliberately: auth before logging, retry/error toward the end',
                'Keep each interceptor single-purpose (auth, retry, error, loading)',
                'Use inject() inside the function for DI rather than constructor injection'
            ],
            commonMistakes: [
                'Attempting to set headers on req directly (it is immutable)',
                'Assuming registration order does not affect behavior',
                'Doing async work without returning the resulting observable from next()',
                'Catching and swallowing errors so downstream interceptors/callers never see them'
            ],
            interviewTip: 'Three points score well: (1) requests are immutable so you clone, (2) functional interceptors use inject() for DI, (3) array order defines the request/response chain. Sketch the onion model of request-out / response-back.',
            followUp: ['How would you skip an interceptor for specific requests?', 'How do you avoid intercepting the token-refresh call itself?'],
            seniorPerspective: 'I keep interceptors tightly scoped and obsess over order during review — a retry interceptor placed before auth will retry unauthenticated requests, and a logging interceptor before auth will log requests without the token. I also tag requests with context tokens so individual interceptors can opt out (e.g., skip auth on the login call).',
            architectPerspective: 'Interceptors are cross-cutting middleware for the HTTP layer. Treating them as an ordered pipeline — not an unordered set — is essential; the chain order encodes policy precedence. I document the canonical order so new interceptors slot in intentionally rather than appended blindly.'
        },
        {
            question: 'What are the ways to read route parameters, and when do you use the paramMap observable, the snapshot, or withComponentInputBinding?',
            difficulty: 'medium',
            answer: `<p>Three approaches, each suited to a situation:</p>
            <ul>
                <li><code>ActivatedRoute.snapshot.paramMap.get('id')</code> — a one-time read. Fine when the component is recreated on each navigation, but it does <strong>not</strong> update if you navigate between params on the same route instance.</li>
                <li><code>ActivatedRoute.paramMap</code> (Observable) — emits on every param change. Required when the same component stays mounted while only the param changes (e.g., next/prev item).</li>
                <li><code>withComponentInputBinding()</code> — the router binds route params, query params, and resolved data directly to matching component <strong>inputs</strong>, so you can use a signal input and skip ActivatedRoute entirely.</li>
            </ul>`,
            explanation: 'The snapshot is a photograph — accurate the moment it was taken, but it won\'t change if the scene does. The paramMap observable is a live video feed. Input binding is the router quietly delivering the value to your doorstep so you never have to ask.',
            code: `import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

// 1) Snapshot — one-time read (component recreated per navigation)
const id = inject(ActivatedRoute).snapshot.paramMap.get('id');

// 2) Observable — reacts when only the param changes on a reused component
export class ItemComponent {
  private route = inject(ActivatedRoute);
  itemId = toSignal(this.route.paramMap.pipe(map(p => p.get('id'))));
  // switchMap off this to refetch when navigating item-to-item
}

// 3) withComponentInputBinding() — param becomes an input (no ActivatedRoute)
// bootstrap: provideRouter(routes, withComponentInputBinding())
@Component({ selector: 'app-item', standalone: true, template: '' })
export class ItemInputComponent {
  id = input.required<string>();        // matches route param :id
  page = input<number>();               // matches ?page query param
}`,
            language: 'typescript',
            bestPractices: [
                'Use the paramMap observable when the component is reused across param changes',
                'Use snapshot only when the component is destroyed/recreated each navigation',
                'Prefer withComponentInputBinding() to decouple components from ActivatedRoute',
                'Combine paramMap with switchMap to refetch data on param change'
            ],
            commonMistakes: [
                'Using snapshot on a reused component, so the view shows stale params',
                'Forgetting that navigating :id -> :id reuses the component by default',
                'Subscribing to paramMap without cleanup (use toSignal or takeUntilDestroyed)',
                'Mixing input binding and ActivatedRoute reads for the same value'
            ],
            interviewTip: 'The classic trap: snapshot does not update when navigating between two instances of the same route. Lead with that, then present the observable and input-binding alternatives. Mention switchMap for refetching.',
            followUp: ['Why does navigating :id to :id reuse the component?', 'How does RouteReuseStrategy affect snapshot reads?'],
            seniorPerspective: 'My default is now withComponentInputBinding() — it removes ActivatedRoute boilerplate and makes components trivially testable by just setting inputs. I only fall back to the paramMap observable when I need to react to param changes with a switchMap refetch on a reused component.',
            architectPerspective: 'Input binding aligns routing with the component contract, so a component does not need to know it is being driven by a router at all — it just has inputs. That decoupling improves testability and lets the same component be reused outside a routed context, which matters for component libraries and micro-frontends.'
        },
        {
            question: 'Design the authentication flow across a route guard and an HTTP interceptor. Where does token refresh belong and how do the pieces coordinate?',
            difficulty: 'advanced',
            answer: `<p>Guards and interceptors play distinct roles:</p>
            <ul>
                <li>The <strong>route guard</strong> is a UX gate — it decides whether to show a protected route, redirecting unauthenticated users to login (returning a <code>UrlTree</code>).</li>
                <li>The <strong>interceptor</strong> is the transport gate — it attaches the access token to outgoing requests and reacts to <code>401</code> responses.</li>
            </ul>
            <p><strong>Token refresh belongs in the interceptor</strong>, not the guard, because expiry is detected at request time. On a 401, the interceptor refreshes the token once and retries the failed request — and must <strong>share a single in-flight refresh</strong> (via a BehaviorSubject/shareReplay gate) so concurrent 401s do not trigger a refresh storm. The refresh call itself must skip the auth interceptor to avoid recursion. The server remains the real security boundary; the guard is convenience only.</p>`,
            explanation: 'The guard is the bouncer at the club door checking you have a wristband. The interceptor is the bartender who stamps every drink order with your tab and, if your tab expired, quietly re-opens it once and re-pours — rather than making every pending order re-open it separately.',
            code: `import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';

// Guard: UX gate only
export const authGuard: CanActivateFn = (_r, state) => {
  const auth = inject(AuthService), router = inject(Router);
  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

// Single shared refresh so concurrent 401s don't stampede
const refreshing$ = new BehaviorSubject<string | null>(null);
let isRefreshing = false;

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  if (req.context.get(SKIP_AUTH)) return next(req);          // refresh call opts out
  const withToken = (t: string) => req.clone({ setHeaders: { Authorization: 'Bearer ' + t } });

  return next(withToken(auth.accessToken()!)).pipe(
    catchError((e: HttpErrorResponse) => {
      if (e.status !== 401) return throwError(() => e);
      if (!isRefreshing) {
        isRefreshing = true; refreshing$.next(null);
        return auth.refresh().pipe(                            // refresh uses SKIP_AUTH
          switchMap(token => { isRefreshing = false; refreshing$.next(token);
            return next(withToken(token)); }),
          catchError(err => { isRefreshing = false; auth.logout(); return throwError(() => err); })
        );
      }
      // Queue behind the in-flight refresh, then retry once it lands
      return refreshing$.pipe(filter(Boolean), take(1), switchMap(t => next(withToken(t))));
    })
  );
};`,
            language: 'typescript',
            bestPractices: [
                'Keep the guard as a UX gate; do token refresh in the interceptor at request time',
                'Share a single in-flight refresh so concurrent 401s do not stampede',
                'Exclude the refresh request from the auth interceptor to avoid recursion',
                'Treat the server as the authoritative security boundary, not the guard'
            ],
            commonMistakes: [
                'Triggering an independent refresh per concurrent 401 (refresh storm)',
                'Letting the refresh request itself be intercepted, causing infinite recursion',
                'Putting refresh logic in the guard, which only runs on navigation not per request',
                'Treating client-side guards as real security instead of API-side authorization'
            ],
            interviewTip: 'Separate the two responsibilities crisply: guard = which routes render, interceptor = token on the wire + refresh. The standout senior detail is the shared single-flight refresh and excluding the refresh call from interception.',
            followUp: ['How do you prevent a refresh storm under concurrent requests?', 'Why is the guard not sufficient as a security control?'],
            seniorPerspective: 'I have debugged the refresh-storm bug more than once: ten parallel 401s each kicking off a refresh, invalidating each other\'s tokens. The fix is always a single shared refresh gate that queued requests subscribe to. I also make the guard dumb on purpose — all token lifecycle lives in the interceptor where expiry actually surfaces.',
            architectPerspective: 'This is defense-in-depth with clear layering: the guard improves UX, the interceptor manages the transport-level token lifecycle, and the API enforces real authorization. Conflating them — e.g., trusting the guard for security — is a classic vulnerability. I document this contract so every team builds auth the same way.'
        }
    ]
});
