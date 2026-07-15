/* ═══════════════════════════════════════════════════════════════════
   ANGULAR TESTING — Level 7: Angular (Angular Advanced)
   TestBed, component testing, Jasmine/Karma vs Jest, spies, mocking
   services, HttpTestingController, harnesses, and E2E.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('angular-testing', {

    title: 'Angular Testing',
    level: 7,
    group: 'angular-advanced',
    description: 'Testing Angular apps: TestBed, component and service tests, Jasmine/Karma vs Jest, spies and service mocks, HttpTestingController, component harnesses, and E2E with Playwright/Cypress.',
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    prerequisites: ['angular-core', 'testing-fundamentals'],

    sections: [

        {
            title: 'Introduction',
            content: `<p>Angular ships with a complete testing toolkit built around <strong>TestBed</strong>, which creates
            a testing module mirroring how Angular wires components, services, and dependency injection at runtime.
            Combined with Jasmine (or Jest) and component harnesses, you can test units, components, and full flows.</p>
            <p>Good Angular tests verify behavior — what the user sees and what services are called — not internal
            implementation, so they survive refactoring.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>TestBed and the ComponentFixture</li>
                <li>Jasmine/Karma vs Jest trade-offs</li>
                <li>Spies and mocking injected services</li>
                <li>Testing HTTP with HttpTestingController</li>
                <li>Component Test Harnesses for robust DOM queries</li>
                <li>Where E2E (Playwright/Cypress) fits</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>TestBed</h4>
            <p>Configures a testing NgModule: declares the component under test, provides (real or mock)
            dependencies, and compiles everything. It is the foundation of most Angular tests.</p>
            <h4>ComponentFixture</h4>
            <p>A wrapper around a created component instance and its rendered DOM. Use <code>fixture.componentInstance</code>
            for the class and <code>fixture.nativeElement</code> / <code>fixture.debugElement</code> for the DOM.
            Call <code>fixture.detectChanges()</code> to run change detection.</p>
            <h4>Spies</h4>
            <p>Test doubles that record calls and can return canned values. Jasmine: <code>jasmine.createSpyObj</code>;
            Jest: <code>jest.fn()</code>. Used to mock services and verify interactions.</p>
            <h4>HttpTestingController</h4>
            <p>From HttpClientTestingModule — intercepts HTTP requests so you can assert them and flush fake
            responses without real network calls.</p>
            <h4>Component Harness</h4>
            <p>A stable API (from @angular/cdk/testing) for interacting with components in tests, decoupled from the
            DOM structure — more robust than raw CSS selectors.</p>
            <h4>fakeAsync / async</h4>
            <p>Utilities to control time and resolve async operations deterministically (tick(), flush()).</p>`,
            mermaid: `graph TB
    Test[Test spec] --> TB[TestBed: configure module]
    TB --> Fix[ComponentFixture]
    Fix --> Inst[componentInstance]
    Fix --> DOM[nativeElement / debugElement]
    TB --> Mocks[Mock providers / spies]
    TB --> HTTP[HttpTestingController]
    Test --> Assert[Assert behavior + DOM]`
        },
        {
            title: 'How It Works',
            content: `<p>A typical component test follows arrange-act-assert:</p>
            <ol>
                <li><strong>Configure TestBed</strong> with the component and mock dependencies</li>
                <li><strong>Create the fixture</strong> and trigger initial change detection</li>
                <li><strong>Act</strong> — set inputs, click elements, or call methods</li>
                <li><strong>Detect changes</strong> to update the DOM</li>
                <li><strong>Assert</strong> on the rendered output and/or mock interactions</li>
            </ol>`,
            code: `import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  let fixture: ComponentFixture<CounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent]   // standalone component
    }).compileComponents();
    fixture = TestBed.createComponent(CounterComponent);
    fixture.detectChanges();        // initial render
  });

  it('increments the displayed count on click', () => {
    const button = fixture.nativeElement.querySelector('button.increment');
    button.click();
    fixture.detectChanges();        // re-render after state change
    const count = fixture.nativeElement.querySelector('.count').textContent;
    expect(count).toContain('1');   // assert observable behavior
  });
});`,
            language: 'typescript'
        },
        {
            title: 'Visual Diagram',
            content: `<p>The testing pyramid applied to Angular:</p>`,
            mermaid: `graph TB
    E2E["E2E (Playwright/Cypress)<br/>Few - full user flows in a real browser"]
    INT["Component/Integration (TestBed)<br/>Some - component + template + DI"]
    UNIT["Unit (plain TS / Jest)<br/>Many - services, pipes, pure logic"]
    E2E --- INT --- UNIT
    style UNIT fill:#bbf7d0,color:#1e293b
    style INT fill:#fde68a,color:#1e293b
    style E2E fill:#fecaca,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Mocking services and testing HTTP — the two most common needs:</p>`,
            tabs: [
                {
                    label: 'Mock a Service',
                    code: `import { TestBed } from '@angular/core/testing';
import { UserListComponent } from './user-list.component';
import { UserService } from './user.service';
import { of } from 'rxjs';

describe('UserListComponent', () => {
  it('renders users from the service', () => {
    // Spy object standing in for the real service
    const userServiceSpy = jasmine.createSpyObj<UserService>('UserService', ['getUsers']);
    userServiceSpy.getUsers.and.returnValue(of([{ id: 1, name: 'Alice' }]));

    TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [{ provide: UserService, useValue: userServiceSpy }]
    });

    const fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Alice');
    expect(userServiceSpy.getUsers).toHaveBeenCalledTimes(1);
  });
});`,
                    language: 'typescript'
                },
                {
                    label: 'HttpTestingController',
                    code: `import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController }
  from '@angular/common/http/testing';
import { UserApi } from './user.api';

describe('UserApi', () => {
  let api: UserApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserApi, provideHttpClient(), provideHttpClientTesting()]
    });
    api = TestBed.inject(UserApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());   // no unexpected outstanding requests

  it('GETs users and maps the response', () => {
    let result: any;
    api.getUsers().subscribe(r => (result = r));

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, name: 'Alice' }]);   // provide fake response

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Alice');
  });
});`,
                    language: 'typescript'
                },
                {
                    label: 'fakeAsync',
                    code: `import { fakeAsync, tick } from '@angular/core/testing';

it('debounces search input', fakeAsync(() => {
  const component = TestBed.createComponent(SearchComponent).componentInstance;
  const spy = spyOn(component, 'search');

  component.onInput('ang');
  tick(200);                 // advance virtual time within debounce window
  expect(spy).not.toHaveBeenCalled();

  tick(200);                 // total 400ms > 300ms debounce
  expect(spy).toHaveBeenCalledWith('ang');
}));`,
                    language: 'typescript'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Test Behavior, Not Implementation</h4>
            <p>Assert on rendered output and meaningful service interactions, not private methods or internal state.
            This keeps tests stable across refactors.</p>
            <h4>Do: Mock External Dependencies</h4>
            <p>Stub services and HTTP so component tests are fast and deterministic. Use HttpTestingController rather
            than hitting real endpoints.</p>
            <h4>Do: Prefer Harnesses for Material/Component Queries</h4>
            <p>Component harnesses survive DOM changes far better than brittle CSS selectors.</p>
            <h4>Do: Keep the Pyramid</h4>
            <p>Many fast unit tests (services, pipes), some component tests, few E2E. Don't push everything to E2E.</p>
            <h4>Do: Use fakeAsync for Time</h4>
            <p>Control debounce/timers/async deterministically with fakeAsync + tick, avoiding flaky real delays.</p>`,
            callout: {
                type: 'tip',
                title: 'Query by Role/Text, Not Brittle Selectors',
                text: 'Prefer querying by accessible role, label, or test-id (data-testid) over deep CSS selectors tied to structure. It makes tests resilient to markup changes and nudges you toward accessible markup.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Forgetting detectChanges()</h4>
            <p>The DOM won't reflect state changes until change detection runs. A test that "fails to see" updated
            text usually missed a <code>fixture.detectChanges()</code>.</p>
            <h4>Mistake: Real HTTP in Unit Tests</h4>
            <p>Hitting real endpoints makes tests slow, flaky, and network-dependent. Always use
            HttpTestingController.</p>
            <h4>Mistake: Over-Mocking</h4>
            <p>Mocking everything tests your mocks, not your code. Mock only true boundaries (HTTP, external services).</p>
            <h4>Mistake: Brittle DOM Selectors</h4>
            <p>Selectors tied to deep structure (<code>div > span:nth-child(2)</code>) break on any markup change.
            Use roles/test-ids/harnesses.</p>
            <h4>Mistake: Not Verifying Outstanding HTTP</h4>
            <p>Skipping <code>httpMock.verify()</code> lets unexpected or unflushed requests pass silently.</p>`,
            code: `// BUG: assertion runs before the DOM updates
button.click();
expect(el.querySelector('.count').textContent).toContain('1');  // FAILS

// FIX: run change detection before asserting on the DOM
button.click();
fixture.detectChanges();
expect(el.querySelector('.count').textContent).toContain('1');  // passes`,
            language: 'typescript'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Component Libraries</h4>
            <p>Design systems test each component's behavior and accessibility with TestBed + harnesses to prevent
            regressions across hundreds of consumers.</p>
            <h4>Business Apps in CI</h4>
            <p>Unit and component tests gate every PR; fast feedback catches regressions before merge.</p>
            <h4>Critical Flows with E2E</h4>
            <p>Checkout, login, and payment flows get a handful of Playwright/Cypress E2E tests that exercise the
            real browser end to end.</p>
            <h4>Refactor Safety</h4>
            <p>Behavior-focused tests let teams refactor components and services confidently, knowing breakages
            surface immediately.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Jasmine/Karma vs Jest vs E2E tools:</p>`,
            table: {
                headers: ['Aspect', 'Jasmine + Karma', 'Jest', 'Playwright/Cypress (E2E)'],
                rows: [
                    ['Runs in', 'Real browser', 'Node (jsdom)', 'Real browser'],
                    ['Speed', 'Slower (browser)', 'Fast', 'Slowest'],
                    ['Default in Angular', 'Historically yes', 'Increasingly common', 'Separate setup'],
                    ['Scope', 'Unit/component', 'Unit/component', 'Full user flows'],
                    ['Snapshot testing', 'No (native)', 'Yes', 'N/A'],
                    ['Flakiness', 'Medium', 'Low', 'Higher'],
                    ['Best for', 'Component DOM tests', 'Fast unit/component', 'Critical journeys']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Test-suite speed determines whether developers actually run tests:</p>
            <h4>Prefer Plain Unit Tests Where Possible</h4>
            <p>Services, pipes, and pure functions can be tested without TestBed — far faster than spinning up a
            component fixture.</p>
            <h4>Jest for Speed</h4>
            <p>Jest runs in Node with jsdom and parallelizes well, typically much faster than Karma's real-browser
            runs. Many Angular teams migrate to Jest for CI speed.</p>
            <h4>Minimize Heavy TestBed Setup</h4>
            <p>Share TestBed configuration in beforeEach, mock heavy dependencies, and avoid importing the whole app
            module into a component test.</p>
            <h4>Limit E2E Count</h4>
            <p>E2E tests are slow and flaky — reserve them for critical paths and run the bulk of verification at the
            unit/component layer.</p>`,
            callout: {
                type: 'warning',
                title: 'Slow Suites Get Skipped',
                text: 'If the unit/component suite takes many minutes, developers stop running it locally. Keep the fast layer fast (favor plain unit tests, consider Jest) so the suite runs on every change.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Meta-note: how to keep Angular tests themselves high quality.</p>
            <h4>Review Tests as Code</h4>
            <p>Tests need clarity and independence too. A confusing or order-dependent test is a liability.</p>
            <h4>Avoid Implementation Coupling</h4>
            <p>Don't assert on private fields or call order unless that IS the contract. Assert on what the user/DOM
            sees and on meaningful outputs.</p>`,
            code: `// GOOD: behavior-focused, survives refactor
it('shows an error message when login fails', fakeAsync(() => {
  authSpy.login.and.returnValue(throwError(() => new Error('bad creds')));
  const fixture = TestBed.createComponent(LoginComponent);
  fixture.detectChanges();

  fixture.componentInstance.submit({ email: 'a@b.com', password: 'x' });
  tick();
  fixture.detectChanges();

  expect(fixture.nativeElement.textContent).toContain('Invalid credentials');
}));`,
            language: 'typescript'
        },
        {
            title: 'Interview Tips',
            content: `<p>Angular testing questions assess practical front-end discipline:</p>
            <ul>
                <li><strong>Explain TestBed</strong> and the ComponentFixture/detectChanges flow</li>
                <li><strong>Describe mocking services</strong> with spies and provider overrides</li>
                <li><strong>Know HttpTestingController</strong> — expectOne, flush, verify</li>
                <li><strong>Discuss Jasmine/Karma vs Jest</strong> and why teams move to Jest</li>
                <li><strong>Place E2E correctly</strong> in the pyramid — few, for critical flows</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Common Gotcha',
                text: 'A frequent interview/debug scenario: "my test does not see the updated DOM." The answer is almost always a missing fixture.detectChanges() after the state change. Knowing this shows hands-on experience.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Docs</h4>
            <ul>
                <li>Angular testing guide: angular.dev/guide/testing</li>
                <li>Component harnesses: material.angular.io/cdk/test-harnesses</li>
                <li>HttpClient testing: angular.dev/guide/http/testing</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li>jest-preset-angular for Jest setup</li>
                <li>Playwright (playwright.dev) / Cypress (cypress.io) for E2E</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>TestBed</strong> configures a testing module; <strong>ComponentFixture</strong> wraps the instance + DOM</li>
                <li><strong>Call detectChanges()</strong> after state changes to update the DOM before asserting</li>
                <li><strong>Mock services with spies;</strong> mock HTTP with HttpTestingController (expectOne/flush/verify)</li>
                <li><strong>Test behavior, not implementation</strong> — assert on output and meaningful interactions</li>
                <li><strong>Jest</strong> is faster than Karma (Node + jsdom); many teams migrate for CI speed</li>
                <li><strong>Keep the pyramid:</strong> many unit, some component, few E2E</li>
                <li><strong>Interview signal:</strong> the missing detectChanges gotcha and HttpTestingController usage</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Test a Search Component</h4>
            <ol>
                <li>A component with a debounced search input calling a SearchService.search()</li>
                <li>Mock SearchService with a spy returning of([...results])</li>
                <li>Use fakeAsync + tick to verify debounce (no call before the delay, one call after)</li>
                <li>Assert the results render in the DOM after detectChanges()</li>
                <li>Add an HttpTestingController test for the SearchService itself (expectOne/flush/verify)</li>
                <li>Write one Playwright E2E for the happy-path search flow</li>
            </ol>`,
            code: `// TODO:
// 1. SearchComponent test with jasmine.createSpyObj(SearchService) + fakeAsync/tick
// 2. SearchService test with provideHttpClientTesting + HttpTestingController
// 3. assert DOM after fixture.detectChanges()
// 4. (bonus) Playwright spec: type query -> see results`,
            language: 'typescript'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What does TestBed do?<br/>
                    <em>A: It configures a testing NgModule (declaring the component, providing real or mock dependencies)
                    and compiles it, mirroring how Angular wires things at runtime.</em></li>
                <li><strong>Q:</strong> Why might a test not see updated DOM after an action?<br/>
                    <em>A: Change detection hasn't run. Call fixture.detectChanges() after the state change to update the
                    rendered DOM before asserting.</em></li>
                <li><strong>Q:</strong> How do you test a service's HTTP calls without a real server?<br/>
                    <em>A: Use HttpClientTestingModule/provideHttpClientTesting + HttpTestingController to intercept
                    requests, assert them (expectOne), provide a fake response (flush), and verify() no leftovers.</em></li>
                <li><strong>Q:</strong> Where do E2E tests fit relative to unit/component tests?<br/>
                    <em>A: At the top of the pyramid — few in number, for critical end-to-end user flows. The bulk of
                    verification stays in fast unit and component tests.</em></li>
            </ol>`
        }
    ],
    questions: [
        {"question":"What is TestBed in Angular testing, and how do you test a component with dependencies?","difficulty":"medium","answer":"<p><strong>TestBed</strong> is Angular's testing utility that creates a testing module — configuring declarations/imports and providers so you can instantiate a component in a realistic-but-controlled Angular environment and get a <code>ComponentFixture</code> to interact with it and its rendered DOM.</p><p>To test a component with dependencies, provide <strong>test doubles</strong> for its services (mocks/spies via <code>{ provide: Service, useValue: mock }</code>), create the component through TestBed, call <code>fixture.detectChanges()</code> to trigger change detection, then assert on component state or the rendered DOM. For simple logic, a plain unit test constructing the class with mocked deps (no TestBed) is faster.</p>","explanation":"TestBed is a flight simulator for a component: it recreates enough of the Angular \"cockpit\" (DI, templates, change detection) to fly the component safely while you swap in fake instruments (mocked services).","bestPractices":["Provide mocks/spies for dependencies via the TestBed providers","Call detectChanges() before asserting on the DOM","Skip TestBed for pure logic (construct the class directly)"],"commonMistakes":["Forgetting detectChanges(), so the DOM is stale","Using real services/HTTP in unit tests","Over-using TestBed where a plain unit test suffices"],"interviewTip":"Explain TestBed sets up a testing module + fixture, provide mocks via useValue, and remember detectChanges(); note plain unit tests for pure logic.","followUp":["How do you test async code (fakeAsync/tick)?","How do you mock HttpClient (HttpTestingController)?","When avoid TestBed?"]},
        {"question":"How do you test asynchronous code in Angular (fakeAsync, tick, async/whenStable)?","difficulty":"hard","answer":"<p>Angular provides tools to make async deterministic. <strong>fakeAsync</strong> wraps a test so time is virtual: you call <strong>tick(ms)</strong> to synchronously advance timers and flush microtasks, making setTimeout/Promise-based code testable without real waiting. <strong>flush()</strong> drains all pending timers. Alternatively, <strong>waitForAsync</strong> (formerly async) with <code>fixture.whenStable()</code> waits for pending promises to settle before assertions.</p><p>For HTTP, use <strong>HttpTestingController</strong> to expect and flush requests synchronously. The goal is deterministic, fast tests — never rely on real delays.</p>","explanation":"fakeAsync/tick is a TV remote for time: instead of actually waiting five seconds for something to happen, you fast-forward instantly and check the result — making flaky, slow async tests fast and reliable.","bestPractices":["Use fakeAsync + tick/flush for timer/promise code","Use HttpTestingController to flush HTTP synchronously","Avoid real setTimeout delays in tests"],"commonMistakes":["Real delays causing slow/flaky tests","Forgetting to flush/verify pending HTTP requests","Asserting before async work has settled"],"interviewTip":"Name fakeAsync+tick (virtual time) and HttpTestingController (flush HTTP) as the deterministic tools; the point is removing real waits.","followUp":["fakeAsync vs waitForAsync — when each?","How does HttpTestingController.verify() work?","What does flush() do vs tick()?"]},
        {
            question: 'What is TestBed and why is it central to Angular testing?',
            difficulty: 'easy',
            answer: `<p><strong>TestBed</strong> is Angular's primary testing utility. It creates a testing module that
            mirrors how Angular configures components, services, and dependency injection at runtime. You declare the
            component under test, provide real or mock dependencies, compile, and then create a
            <strong>ComponentFixture</strong> to interact with the instance and its rendered DOM.</p>`,
            explanation: 'TestBed is like a miniature, controlled version of your app set up just for one test — you decide exactly which real and fake parts to wire together.',
            bestPractices: ['Configure TestBed in beforeEach', 'Provide mocks for external dependencies', 'Call detectChanges() to render'],
            commonMistakes: ['Importing the entire app module into a component test', 'Forgetting compileComponents for external templates'],
            interviewTip: 'Mention that TestBed mirrors Angular DI — it is what lets you swap real services for mocks via providers.',
            followUp: ['What is a ComponentFixture?', 'How do you override a provider with a mock?']
        },
        {
            question: 'How do you test a component that calls an HTTP service?',
            difficulty: 'medium',
            answer: `<p>Two layers. For the <strong>component</strong>, mock the service with a spy that returns an
            Observable (<code>of([...])</code>), so the component test is fast and deterministic. For the
            <strong>service</strong> itself, use <code>HttpClientTestingModule</code>/<code>provideHttpClientTesting</code>
            with <code>HttpTestingController</code> to intercept requests, assert them, and flush fake responses —
            verifying no real network call happens.</p>`,
            explanation: 'You test the component against a stand-in service (a puppet that returns scripted data) and separately test the real service against a fake network that you fully control.',
            code: `// Service test
api.getUsers().subscribe(r => result = r);
const req = httpMock.expectOne('/api/users');
expect(req.request.method).toBe('GET');
req.flush([{ id: 1, name: 'Alice' }]);
httpMock.verify();`,
            language: 'typescript',
            bestPractices: ['Mock the service in component tests', 'Use HttpTestingController for service tests', 'Always call httpMock.verify() in afterEach'],
            commonMistakes: ['Making real HTTP calls in unit tests', 'Not flushing the request, leaving the observable unresolved'],
            interviewTip: 'Separate the two layers explicitly — mock the service for component tests, test the service against HttpTestingController. That distinction shows clear testing strategy.',
            followUp: ['What does httpMock.verify() catch?', 'How would you test an error response (req.flush with error)?']
        },
        {
            question: 'How do you write Angular tests that survive refactoring, and what makes a test brittle?',
            difficulty: 'hard',
            answer: `<p>Refactor-proof tests assert on <strong>behavior and observable output</strong>, not internal
            structure. Concretely:</p>
            <ul>
                <li>Query the DOM by role, label, or <code>data-testid</code> rather than deep CSS selectors
                (<code>div > span:nth-child(2)</code>) that break on markup changes</li>
                <li>Assert on what the user sees (rendered text, visible state) and on meaningful service calls — not
                private methods or internal field values</li>
                <li>Mock only true boundaries (HTTP, external services); over-mocking couples tests to internal call
                sequences</li>
                <li>Use component harnesses (CDK) which expose a stable API independent of DOM structure</li>
                <li>Avoid asserting on internal call order unless ordering is the actual contract</li>
            </ul>
            <p>Brittleness comes from coupling to implementation: structural selectors, private-state assertions,
            and verifying internal call sequences that change during harmless refactors.</p>`,
            explanation: 'A robust test is like checking that a vending machine dispenses the right snack when you press B4 — it does not care how the wiring inside is arranged. A brittle test inspects the exact wiring and snaps the moment you reorganize it, even though the snack still comes out.',
            code: `// BRITTLE: structural selector + internal assertion
expect(fixture.nativeElement
  .querySelector('div.container > ul > li:nth-child(2)').textContent).toBe('Bob');

// ROBUST: query by test-id / role, assert visible behavior
const item = fixture.nativeElement.querySelector('[data-testid="user-Bob"]');
expect(item).toBeTruthy();`,
            language: 'typescript',
            bestPractices: ['Query by role/label/test-id', 'Assert visible behavior and meaningful interactions', 'Use CDK harnesses for components', 'Mock only real boundaries'],
            commonMistakes: ['Deep structural CSS selectors', 'Asserting on private state or exact internal call order', 'Over-mocking collaborators'],
            interviewTip: 'Frame it as "test behavior, not implementation" and give the test-id-vs-nth-child example — concrete contrast lands the point.',
            followUp: ['What are component harnesses and why are they more robust?', 'When is verifying call order legitimately part of the contract?'],
            seniorPerspective: 'I push teams to add data-testid attributes (or rely on accessible roles) precisely so tests stop breaking on cosmetic markup changes. The litmus test I use in review: "if I refactor this component\u2019s internals without changing what the user sees, should this test still pass?" If the answer is no, the test is coupled to implementation and I rewrite it to assert behavior instead.'
        },
        {
            question: 'How do fakeAsync, tick, and flush work, and when do you use them instead of async/whenStable?',
            difficulty: 'medium',
            answer: `<p><code>fakeAsync</code> runs a test in a special zone where time is <strong>virtual</strong> — timers, <code>setTimeout</code>, debounce, and microtasks queue up instead of running for real. You advance them deterministically:</p>
            <ul>
                <li><code>tick(ms)</code> — advance virtual time by a specific amount (drains timers due within that window).</li>
                <li><code>tick()</code> — flush pending microtasks (resolved promises) with no time advance.</li>
                <li><code>flush()</code> — run all remaining queued (macro)tasks until the queue is empty.</li>
            </ul>
            <p>Use <code>fakeAsync</code> for deterministic control of timers/debounce. Use <code>async</code> + <code>fixture.whenStable()</code> when you cannot fake time — e.g., real promises/XHR you do not control. <code>fakeAsync</code> will throw if a timer is left pending at the end, catching leaked timers.</p>`,
            explanation: 'fakeAsync is a TARDIS for your test: instead of waiting 300ms for a debounce, you turn the clock dial forward with tick(300) and the effect happens instantly and predictably. async/whenStable is just patiently waiting for real async work to settle.',
            code: `import { fakeAsync, tick, flush } from '@angular/core/testing';

it('debounces search by 300ms', fakeAsync(() => {
  const fixture = TestBed.createComponent(SearchComponent);
  const cmp = fixture.componentInstance;
  const spy = spyOn(cmp['api'], 'search').and.returnValue(of([]));

  cmp.onInput('an');
  tick(200);                       // not yet past the 300ms debounce
  expect(spy).not.toHaveBeenCalled();

  cmp.onInput('ang');              // resets debounce
  tick(300);                       // now it fires once with the latest term
  expect(spy).toHaveBeenCalledOnceWith('ang');

  flush();                         // drain anything left so fakeAsync doesn't throw
}));

// Use async/whenStable when you can't fake the timer source:
it('loads on init', async () => {
  const fixture = TestBed.createComponent(ProfileComponent);
  fixture.detectChanges();
  await fixture.whenStable();      // wait for real pending promises
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('Alice');
});`,
            language: 'typescript',
            bestPractices: [
                'Use fakeAsync + tick to test debounce, timers, and polling deterministically',
                'Call flush() or discardPeriodicTasks() to clear queues before the test ends',
                'Use async/whenStable when the async source cannot be virtualized',
                'Assert intermediate states (before and after tick) to verify timing logic'
            ],
            commonMistakes: [
                'Leaving a pending timer so fakeAsync throws "N periodic timer(s) still in the queue"',
                'Using real setTimeout delays in tests, making them slow and flaky',
                'Forgetting detectChanges() after tick so the DOM does not reflect the change',
                'Mixing fakeAsync with actual XHR (use HttpTestingController instead)'
            ],
            interviewTip: 'Distinguish tick(ms) (advance macrotasks/timers) from tick() (flush microtasks) and flush() (drain everything). Mention that fakeAsync surfaces leaked timers — a nice correctness bonus that whenStable does not give you.',
            followUp: ['What is the difference between tick() and flush()?', 'Why might fakeAsync throw at the end of a test?'],
            seniorPerspective: 'fakeAsync is my default for anything time-based because flaky timing tests erode trust in the whole suite. The pending-timer error it throws is a feature — it has caught real leaked intervals in components that forgot to clean up. I reserve async/whenStable for the rare case where the async source genuinely cannot be faked.',
            architectPerspective: 'Deterministic time control is what makes a CI suite trustworthy; real delays produce intermittent failures that teams learn to ignore, which is worse than no test. I standardize fakeAsync for timer/debounce logic and HttpTestingController for network, so almost no test depends on wall-clock timing.'
        },
        {
            question: 'What are CDK component harnesses and why are they more robust than querying the DOM directly?',
            difficulty: 'hard',
            answer: `<p>A <strong>component harness</strong> (from <code>@angular/cdk/testing</code>) is a class that exposes a stable, semantic API for interacting with a component in tests — methods like <code>getText()</code>, <code>click()</code>, <code>isChecked()</code> — instead of raw CSS selectors and manual event dispatch. You obtain them through a <code>HarnessLoader</code> (e.g., <code>TestbedHarnessEnvironment.loader(fixture)</code>).</p>
            <p>They are robust because they decouple tests from internal DOM structure: when a component's markup changes, the harness implementation updates once and every test keeps working. Angular Material ships harnesses for its components, and you can author custom harnesses for your own. They also auto-handle change detection and async stabilization between interactions.</p>`,
            explanation: 'Querying the DOM directly is like operating a machine by reaching inside and pulling specific wires — rearrange the wiring and your test snaps. A harness is the labeled control panel on the front: press "submit", read "error text". The panel stays stable even when the internals are rewired.',
            code: `import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';

describe('LoginComponent', () => {
  let loader: HarnessLoader;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LoginComponent] }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);   // harness loader from fixture
  });

  it('enables submit after entering credentials', async () => {
    const email = await loader.getHarness(MatInputHarness.with({ selector: '[data-testid=email]' }));
    await email.setValue('a@b.com');                       // harness handles events + CD

    const submit = await loader.getHarness(MatButtonHarness.with({ text: 'Sign in' }));
    expect(await submit.isDisabled()).toBe(false);
    await submit.click();
  });
});

// Custom harness sketch for your own component:
// class UserCardHarness extends ComponentHarness {
//   static hostSelector = 'app-user-card';
//   private name = this.locatorFor('.name');
//   async getName() { return (await this.name()).text(); }
// }`,
            language: 'typescript',
            bestPractices: [
                'Use Material harnesses for Material components instead of CSS selectors',
                'Author custom harnesses for shared/design-system components',
                'Filter harnesses with .with({ selector/text }) to target the right instance',
                'Let harnesses manage change detection rather than scattering detectChanges()'
            ],
            commonMistakes: [
                'Reaching into Material internal DOM with brittle selectors instead of a harness',
                'Forgetting harness methods are async and not awaiting them',
                'Mixing direct DOM queries and harness calls inconsistently in one test',
                'Not writing harnesses for reusable components, so every consumer writes fragile tests'
            ],
            interviewTip: 'Frame harnesses as a stable contract that survives DOM refactors, and note they are async (await every call) and handle change detection for you. Mentioning custom harnesses for a design system shows scale thinking.',
            followUp: ['How would you write a custom harness for your own component?', 'Why are harness methods asynchronous?'],
            seniorPerspective: 'For any design-system component I ship a harness alongside it, the same way I would ship a public API. Consumers then test against the harness, so when we restructure the component internals we fix one harness instead of chasing breakages across dozens of app test suites.',
            architectPerspective: 'Harnesses formalize the testing contract of a component, decoupling consumer tests from implementation. In a multi-team setup with a shared component library this is what keeps test maintenance from exploding — internal refactors stay internal because the harness API is the stable boundary.'
        },
        {
            question: 'How do you test a signal-based, OnPush standalone component, including signal inputs and computed values?',
            difficulty: 'advanced',
            answer: `<p>Modern components use signal inputs (<code>input()</code>), <code>computed()</code>, and OnPush. The testing essentials:</p>
            <ul>
                <li>Set signal inputs with <code>fixture.componentRef.setInput('name', value)</code> — you cannot just assign to the input signal from a test.</li>
                <li>Call <code>fixture.detectChanges()</code> after setting inputs so the template re-renders (still required even with signals under TestBed).</li>
                <li>Read <code>computed()</code> values by calling the signal (<code>cmp.total()</code>) and assert; they recompute automatically from their dependencies.</li>
                <li>For OnPush, verify the view updates when an input <em>reference</em> changes via setInput, which is exactly how the framework drives OnPush.</li>
            </ul>
            <p>You generally do not need <code>TestBed.flushEffects()</code> for template reads, but for <code>effect()</code> side effects you trigger change detection (or use the effect testing utilities) so the effect runs.</p>`,
            explanation: 'Testing a signal component is like checking a spreadsheet: you type a value into an input cell (setInput), let it recalculate (detectChanges), then read the formula cell (the computed signal). You never poke the formula cell directly — you change inputs and confirm the formula reacted.',
            code: `import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // template: '<span class="total">{{ total() }}</span>'
})
class CartSummaryComponent {
  items = input.required<{ price: number; qty: number }[]>();
  total = computed(() => this.items().reduce((s, i) => s + i.price * i.qty, 0));
}

describe('CartSummaryComponent', () => {
  let fixture: ComponentFixture<CartSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartSummaryComponent] }).compileComponents();
    fixture = TestBed.createComponent(CartSummaryComponent);
  });

  it('computes the total from the items input', () => {
    fixture.componentRef.setInput('items', [{ price: 10, qty: 2 }, { price: 5, qty: 1 }]);
    fixture.detectChanges();
    expect(fixture.componentInstance.total()).toBe(25);
    expect(fixture.nativeElement.querySelector('.total').textContent).toContain('25');
  });

  it('reacts to a new input reference (OnPush)', () => {
    fixture.componentRef.setInput('items', [{ price: 1, qty: 1 }]);
    fixture.detectChanges();
    fixture.componentRef.setInput('items', [{ price: 1, qty: 1 }, { price: 2, qty: 3 }]);
    fixture.detectChanges();
    expect(fixture.componentInstance.total()).toBe(7);
  });
});`,
            language: 'typescript',
            bestPractices: [
                'Set signal inputs via componentRef.setInput, never by assigning to the signal',
                'Call detectChanges() after setInput to render under TestBed',
                'Assert computed() outputs by invoking the signal directly',
                'Test OnPush by changing input references and confirming the view updates'
            ],
            commonMistakes: [
                'Trying to assign to an input() signal from the test (it is read-only)',
                'Mutating the existing input array instead of passing a new reference for OnPush',
                'Forgetting detectChanges() and asserting stale DOM',
                'Expecting effect() side effects without triggering change detection'
            ],
            interviewTip: 'The key API to name is fixture.componentRef.setInput() for signal inputs — many candidates still try to set the input field directly. Note that computed values need no special handling; you just read them after detectChanges.',
            followUp: ['How do you test an effect() side effect?', 'Why must OnPush tests pass a new input reference rather than mutate?'],
            seniorPerspective: 'Signal components are actually easier to test than the old @Input/ngOnChanges style: setInput + read the computed is a tight arrange-assert with no lifecycle ceremony. The one gotcha I flag in review is still detectChanges — under TestBed you drive it manually even though production may be zoneless.',
            architectPerspective: 'Because signal inputs and computed values make data flow explicit, tests become declarative: set inputs, read derived outputs, no reaching into internal state. That testability is a direct dividend of the reactive model and is why I steer new components toward signals and OnPush as the default.'
        }
    ]
});
