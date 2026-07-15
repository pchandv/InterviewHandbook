/* ═══════════════════════════════════════════════════════════════════
   FORMS & VALIDATION — Level 7: Angular (Angular Advanced)
   Reactive vs template-driven forms, FormGroup/Control/Array, typed
   forms, built-in + custom + async validators, cross-field validation.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('angular-forms', {

    title: 'Forms & Validation',
    level: 7,
    group: 'angular-advanced',
    description: 'Angular forms: reactive vs template-driven, FormGroup/FormControl/FormArray, typed forms, built-in and custom validators, async validators, and cross-field validation.',
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    prerequisites: ['angular-core', 'angular-rxjs'],

    sections: [

        {
            title: 'Introduction',
            content: `<p>Forms are the heart of most business applications — login, checkout, settings, data entry.
            Angular provides two distinct approaches: <strong>template-driven</strong> forms (simple, declarative,
            logic in the HTML) and <strong>reactive</strong> forms (explicit, programmatic, logic in the component).</p>
            <p>Reactive forms are the recommended choice for anything non-trivial: they are testable, scalable,
            strongly typed (since Angular 14), and give you full control over validation and dynamic structure.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>Reactive vs template-driven forms and when to use each</li>
                <li>FormControl, FormGroup, and FormArray building blocks</li>
                <li>Typed reactive forms for compile-time safety</li>
                <li>Built-in, custom, and async validators</li>
                <li>Cross-field validation (e.g., password confirmation)</li>
                <li>Displaying validation state and errors cleanly</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>FormControl</h4>
            <p>Represents a single input's value and validation state (valid, dirty, touched, errors).</p>
            <h4>FormGroup</h4>
            <p>A collection of controls keyed by name, representing a form or a logical section. Its validity is the
            aggregate of its children.</p>
            <h4>FormArray</h4>
            <p>An ordered list of controls/groups for dynamic, repeatable inputs (e.g., a list of phone numbers).</p>
            <h4>Typed Forms (Angular 14+)</h4>
            <p>FormControl&lt;string&gt;, FormGroup with a typed model — the compiler catches wrong field names and
            value types, a major safety improvement over the old untyped API.</p>
            <h4>Validators</h4>
            <p>Functions returning null (valid) or an errors object (invalid). Built-in (required, minLength,
            email), custom (your own rules), and async (server checks returning an Observable).</p>
            <h4>Control State</h4>
            <p>Each control tracks: <code>valid/invalid</code>, <code>pristine/dirty</code> (changed?),
            <code>touched/untouched</code> (blurred?), and <code>pending</code> (async validation running).</p>`,
            mermaid: `graph TB
    FG[FormGroup: registrationForm] --> C1[FormControl: email]
    FG --> C2[FormControl: password]
    FG --> FA[FormArray: phones]
    FA --> P1[FormControl: phone 0]
    FA --> P2[FormControl: phone 1]
    C1 --> V1[Validators: required, email]
    C2 --> V2[Validators: required, minLength, custom]`
        },
        {
            title: 'How It Works',
            content: `<p>With reactive forms you build the form model in the component, then bind it to the template
            with <code>[formGroup]</code> and <code>formControlName</code>. The form is the single source of truth:
            value and validity flow from the model, and user input updates the model reactively.</p>
            <ol>
                <li>Construct the FormGroup/FormControls (typically via FormBuilder)</li>
                <li>Attach validators to each control</li>
                <li>Bind controls to inputs in the template</li>
                <li>Subscribe to <code>valueChanges</code>/<code>statusChanges</code> Observables for reactivity</li>
                <li>On submit, read <code>form.value</code> (already validated)</li>
            </ol>`,
            code: `import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="email" placeholder="Email" />
      <small *ngIf="form.controls.email.touched && form.controls.email.invalid">
        Enter a valid email
      </small>
      <input formControlName="password" type="password" />
      <button [disabled]="form.invalid">Register</button>
    </form>\`
})
export class RegisterComponent {
  private fb = inject(FormBuilder);

  // Typed form: compiler knows email is string, password is string
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  submit() {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();  // typed { email, password }
    // ... send to API
  }
}`,
            language: 'typescript'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Validation state transitions for a control:</p>`,
            mermaid: `stateDiagram-v2
    [*] --> Pristine_Untouched
    Pristine_Untouched --> Dirty: user types
    Pristine_Untouched --> Touched: blur
    Dirty --> Pending: async validator runs
    Pending --> Valid: server says OK
    Pending --> Invalid: server says taken
    Dirty --> Valid: passes sync validators
    Dirty --> Invalid: fails validators
    Invalid --> Valid: corrected
    Valid --> [*]: submit`
        },
        {
            title: 'Implementation',
            content: `<p>Validators and dynamic form structure:</p>`,
            tabs: [
                {
                    label: 'Custom + Cross-field',
                    code: `import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Custom validator: no whitespace-only values
export function notBlank(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null =>
    (c.value ?? '').trim().length === 0 ? { blank: true } : null;
}

// Cross-field validator on the GROUP: password === confirm
export function passwordsMatch(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pw = group.get('password')?.value;
    const confirm = group.get('confirm')?.value;
    return pw === confirm ? null : { mismatch: true };
  };
}

// Apply group-level validator
form = this.fb.group({
  password: ['', Validators.required],
  confirm: ['', Validators.required]
}, { validators: passwordsMatch() });`,
                    language: 'typescript'
                },
                {
                    label: 'Async Validator',
                    code: `import { AsyncValidatorFn, AbstractControl } from '@angular/forms';
import { map, catchError, of } from 'rxjs';

// Server check: is this username already taken?
export function usernameAvailable(api: UserApi): AsyncValidatorFn {
  return (c: AbstractControl) =>
    api.checkUsername(c.value).pipe(
      map(taken => taken ? { taken: true } : null),
      catchError(() => of(null))   // treat errors as valid; do not block UX
    );
}

// Usage: 3rd argument is async validators
username = new FormControl('', {
  validators: [Validators.required],
  asyncValidators: [usernameAvailable(this.api)],
  updateOn: 'blur'   // run on blur, not every keystroke -> fewer API calls
});`,
                    language: 'typescript'
                },
                {
                    label: 'FormArray (dynamic)',
                    code: `// Dynamic list of phone numbers
form = this.fb.group({
  name: ['', Validators.required],
  phones: this.fb.array([ this.fb.control('', Validators.required) ])
});

get phones() { return this.form.get('phones') as FormArray; }

addPhone() { this.phones.push(this.fb.control('', Validators.required)); }
removePhone(i: number) { this.phones.removeAt(i); }

// Template:
// <div formArrayName="phones">
//   <div *ngFor="let p of phones.controls; let i = index">
//     <input [formControlName]="i" />
//     <button (click)="removePhone(i)">Remove</button>
//   </div>
// </div>`,
                    language: 'typescript'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Prefer Reactive Forms for Non-Trivial Forms</h4>
            <p>They are testable, typed, and scale to complex/dynamic scenarios. Reserve template-driven for very
            simple forms.</p>
            <h4>Do: Use Typed Forms</h4>
            <p>Build with FormBuilder.nonNullable or typed FormControls so the compiler catches field-name and type
            errors.</p>
            <h4>Do: Show Errors Only After Interaction</h4>
            <p>Display validation messages when a control is <code>touched</code> or <code>dirty</code>, not on
            initial render — avoid yelling at users before they type.</p>
            <h4>Do: Debounce/Blur Async Validators</h4>
            <p>Set <code>updateOn: 'blur'</code> or debounce to avoid hammering the server on every keystroke.</p>
            <h4>Do: Centralize Reusable Validators</h4>
            <p>Keep custom validators in a shared module so rules (e.g., strong password) stay consistent.</p>`,
            callout: {
                type: 'tip',
                title: 'Group-Level vs Control-Level Validators',
                text: 'Cross-field rules (password confirmation, date-range start < end) must be validators on the FormGroup, not an individual control, because they need to read multiple controls. Single-field rules live on the FormControl.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Putting Cross-Field Validation on One Control</h4>
            <p>A confirm-password validator on the confirm control can't see the password control reliably. Put it
            on the parent group.</p>
            <h4>Mistake: Showing Errors Immediately</h4>
            <p>Displaying "required" errors before the user touches a field is poor UX. Gate on touched/dirty.</p>
            <h4>Mistake: Async Validator on Every Keystroke</h4>
            <p>Without updateOn:'blur' or debouncing, you fire an API call per character — wasteful and laggy.</p>
            <h4>Mistake: Mutating form.value Directly</h4>
            <p>Treat form.value as read-only output. Update via <code>setValue</code>/<code>patchValue</code>, not by
            mutating the object.</p>
            <h4>Mistake: Using Untyped Forms</h4>
            <p>Legacy untyped forms let typos in control names slip through to runtime. Use typed forms.</p>`,
            code: `// WRONG: confirm validator on the control can't reliably read sibling
confirm: ['', [Validators.required, /* can't easily see password here */]]

// RIGHT: validate at the group level where both controls are visible
this.fb.group(
  { password: ['', Validators.required], confirm: ['', Validators.required] },
  { validators: passwordsMatch() }   // reads group.get('password') & get('confirm')
);`,
            language: 'typescript'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Registration &amp; Checkout Flows</h4>
            <p>Multi-section forms with cross-field rules (password match, billing = shipping) and async checks
            (email/username availability) are reactive-forms bread and butter.</p>
            <h4>Dynamic Surveys &amp; Builders</h4>
            <p>FormArray powers add/remove rows — questionnaires, line items, tag lists — where the number of inputs
            isn't known up front.</p>
            <h4>Admin/Settings Panels</h4>
            <p>Large typed forms with conditional fields (show X only if Y is checked) rely on reactive
            valueChanges subscriptions.</p>
            <h4>Wizards</h4>
            <p>Multi-step forms split into per-step FormGroups, validated independently, then combined on final
            submit.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Reactive vs template-driven forms:</p>`,
            table: {
                headers: ['Aspect', 'Reactive Forms', 'Template-Driven Forms'],
                rows: [
                    ['Where logic lives', 'Component (TypeScript)', 'Template (HTML)'],
                    ['Setup', 'Explicit model (FormGroup)', 'Implicit via ngModel'],
                    ['Type safety', 'Strong (typed forms)', 'Weak'],
                    ['Testability', 'High (test the model)', 'Lower (needs the DOM)'],
                    ['Dynamic forms', 'Easy (FormArray)', 'Hard'],
                    ['Async validation', 'First-class', 'More awkward'],
                    ['Best for', 'Complex, dynamic, validated forms', 'Simple forms (login, search box)'],
                    ['Module', 'ReactiveFormsModule', 'FormsModule']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Forms performance is usually fine, but a few patterns matter:</p>
            <h4>updateOn Strategy</h4>
            <p>Default <code>updateOn: 'change'</code> validates on every keystroke. For expensive validators or
            large forms, use <code>'blur'</code> or <code>'submit'</code> to reduce validation churn.</p>
            <h4>Async Validator Cost</h4>
            <p>Each async validator is an HTTP call. Debounce or run on blur to avoid flooding the server and the
            change-detection cycle.</p>
            <h4>OnPush + Reactive Forms</h4>
            <p>Reactive forms work cleanly with OnPush change detection because state changes flow through
            Observables, minimizing unnecessary checks.</p>
            <h4>Large FormArrays</h4>
            <p>Thousands of dynamic controls can slow rendering; use trackBy in the ngFor and consider virtual
            scrolling for very large lists.</p>`,
            callout: {
                type: 'info',
                title: 'updateOn: blur',
                text: 'Setting updateOn:\'blur\' (or \'submit\') on a control or group changes when value/validity updates fire. It is the simplest lever to cut validation work and async calls on large or expensive forms.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Reactive forms are highly testable because the model is plain TypeScript — you can test
            validation without rendering the DOM.</p>
            <h4>Test the Form Model Directly</h4>
            <p>Instantiate the component (or just the FormGroup), set values, and assert validity and errors.</p>
            <h4>Test Custom Validators in Isolation</h4>
            <p>Validators are pure functions — call them with a fake control and assert the returned errors object.</p>`,
            code: `import { passwordsMatch } from './validators';
import { FormBuilder } from '@angular/forms';

describe('RegisterComponent form', () => {
  const fb = new FormBuilder();

  it('is invalid when passwords differ', () => {
    const form = fb.group(
      { password: ['abc12345'], confirm: ['different'] },
      { validators: passwordsMatch() }
    );
    expect(form.errors).toEqual({ mismatch: true });
    expect(form.valid).toBe(false);
  });

  it('is valid when passwords match and rules pass', () => {
    const form = fb.group(
      { password: ['abc12345'], confirm: ['abc12345'] },
      { validators: passwordsMatch() }
    );
    expect(form.valid).toBe(true);
  });
});`,
            language: 'typescript'
        },
        {
            title: 'Interview Tips',
            content: `<p>Angular forms are a common front-end interview topic:</p>
            <ul>
                <li><strong>Compare reactive vs template-driven</strong> and justify reactive for complex forms</li>
                <li><strong>Explain cross-field validation</strong> at the group level (password match is the classic)</li>
                <li><strong>Describe async validators</strong> and how to avoid spamming the server (blur/debounce)</li>
                <li><strong>Know control state</strong> (touched, dirty, pending) and how it drives error display</li>
                <li><strong>Mention typed forms</strong> (Angular 14+) as a key modern improvement</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Classic Question',
                text: 'Implementing password-confirmation validation is a frequent live exercise. The key insight interviewers look for: the validator must be on the FormGroup (so it can read both controls), returning { mismatch: true } on the group, not on either control individually.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Docs</h4>
            <ul>
                <li>Angular Forms guide: angular.dev/guide/forms</li>
                <li>Reactive Forms &amp; Typed Forms: angular.dev/guide/forms/reactive-forms</li>
                <li>Form Validation: angular.dev/guide/forms/form-validation</li>
            </ul>
            <h4>Articles</h4>
            <ul>
                <li>Angular blog: Typed Reactive Forms announcement</li>
                <li>Community guides on dynamic forms with FormArray</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Reactive forms</strong> (model in component) are preferred for non-trivial forms; template-driven for simple ones</li>
                <li><strong>Building blocks:</strong> FormControl, FormGroup, FormArray</li>
                <li><strong>Typed forms (14+)</strong> give compile-time safety — always use them</li>
                <li><strong>Cross-field validators go on the FormGroup;</strong> single-field on the FormControl</li>
                <li><strong>Async validators</strong> should run on blur/debounced to avoid server spam</li>
                <li><strong>Gate error display</strong> on touched/dirty for good UX</li>
                <li><strong>Interview signal:</strong> password-match at the group level; reactive vs template-driven trade-offs</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Build a Validated Signup Form</h4>
            <ol>
                <li>Reactive, typed form: email (required + email), password (required + min 8 + custom strength), confirm</li>
                <li>Group-level validator ensuring password === confirm</li>
                <li>Async validator checking email availability (run on blur)</li>
                <li>A FormArray of "interests" with add/remove buttons</li>
                <li>Show each error only after the control is touched</li>
                <li>Unit-test the strength validator and the password-match group validator in isolation</li>
            </ol>`,
            code: `// Build with FormBuilder; target shape:
// { email: string; password: string; confirm: string; interests: string[] }
// Validators: Validators.required/email/minLength + custom strength + passwordsMatch (group)
//             + async emailAvailable (updateOn: 'blur')
// TODO: implement component + template + tests for the two custom validators`,
            language: 'typescript'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> When should you use reactive forms over template-driven?<br/>
                    <em>A: For anything non-trivial — complex validation, dynamic structure, type safety, or
                    testability. Template-driven suits very simple forms (a login box, a search field).</em></li>
                <li><strong>Q:</strong> Where do you put a password-confirmation validator and why?<br/>
                    <em>A: On the FormGroup, because it must read both the password and confirm controls. A control-level
                    validator can't reliably access its siblings.</em></li>
                <li><strong>Q:</strong> How do you prevent an async validator from calling the server on every keystroke?<br/>
                    <em>A: Set updateOn: 'blur' (or 'submit') on the control, or debounce — so validation runs when the
                    user leaves the field, not on each character.</em></li>
                <li><strong>Q:</strong> What do touched, dirty, and pending mean?<br/>
                    <em>A: touched = the control has been blurred; dirty = its value has changed; pending = an async
                    validator is currently running. These drive when/whether to show errors.</em></li>
            </ol>`
        }
    ],
    questions: [
        {"question":"What is the difference between template-driven and reactive forms in Angular?","difficulty":"medium","answer":"<p><strong>Template-driven forms</strong> define the form model implicitly in the template with directives (<code>ngModel</code>) — simple, familiar, good for small/simple forms, but logic lives in the template and is harder to test. <strong>Reactive forms</strong> define the model explicitly in the component as <code>FormControl</code>/<code>FormGroup</code>/<code>FormArray</code> — more code, but the model is explicit, strongly typed, synchronously accessible, easily unit-tested, and better for complex/dynamic forms and custom validation.</p><p>Rule of thumb: reactive forms for anything non-trivial (dynamic fields, complex validation, testability); template-driven for quick, simple forms.</p>","explanation":"Template-driven is assembling furniture by eye following the picture (quick, but hard to inspect). Reactive is having the full blueprint in hand (more upfront, but precise, testable, and easy to modify).","bestPractices":["Use reactive forms for complex/dynamic/validated forms","Keep validation logic in the component (reactive) for testability","Use typed reactive forms for compile-time safety"],"commonMistakes":["Template-driven forms for complex dynamic scenarios","Untestable validation logic buried in templates","Mixing both approaches in one form"],"interviewTip":"Contrast implicit-in-template vs explicit-in-component and tie to testability/complexity; recommend reactive for non-trivial forms.","followUp":["How do typed reactive forms help?","How do you build a dynamic form with FormArray?","How do custom validators differ between the two?"]},
        {"question":"How do synchronous and asynchronous validators work in Angular reactive forms?","difficulty":"medium","answer":"<p><strong>Synchronous validators</strong> are functions that take a control and return a validation-errors object or null immediately (e.g., <code>Validators.required</code>, custom range checks). <strong>Async validators</strong> return a Promise or Observable of errors/null, used for checks needing IO — like verifying a username is not already taken via an HTTP call.</p><p>Async validators run only after sync validators pass (to avoid needless server calls), and the control enters a <code>PENDING</code> state while they resolve. Best practice: debounce async validators (e.g., only after the user stops typing) and handle errors so a failed request does not falsely block the form.</p>","explanation":"Sync validators are checks you can do instantly on paper (is the box filled in?). Async validators are checks that require phoning head office (is this username free?) — slower, so you wait (PENDING) and do not call for every keystroke.","bestPractices":["Debounce async validators to limit server calls","Run async only after sync validators pass","Handle async validator errors gracefully"],"commonMistakes":["Async validation on every keystroke (server hammering)","Not handling the PENDING state in the UI","Blocking submit on a failed validator request"],"interviewTip":"Distinguish immediate (sync) vs IO-based (async, returns Promise/Observable, PENDING state) and mention debouncing — the practical concern interviewers want.","followUp":["What is the PENDING state?","How do you debounce an async validator?","How do cross-field validators work?"]},
        {
            question: 'What is the difference between reactive and template-driven forms in Angular?',
            difficulty: 'easy',
            answer: `<p><strong>Reactive forms</strong> define the form model explicitly in the component class
            (FormGroup/FormControl) — logic lives in TypeScript, making them typed, testable, and scalable.
            <strong>Template-driven forms</strong> build the model implicitly through directives like ngModel in the
            HTML — simpler for basic forms but less testable and not strongly typed.</p>
            <p>Use reactive for complex, dynamic, or heavily-validated forms; template-driven for simple cases like a
            login or search box.</p>`,
            explanation: 'Reactive forms are like writing a blueprint in code first, then wiring the UI to it. Template-driven forms are like sketching directly on the page and letting Angular infer the structure.',
            bestPractices: ['Default to reactive forms for business forms', 'Use ReactiveFormsModule and typed forms', 'Reserve template-driven for trivial forms'],
            commonMistakes: ['Using template-driven for complex dynamic forms', 'Mixing both approaches in one form'],
            interviewTip: 'State where the logic lives (component vs template) as the core distinction, then give one use case for each.',
            followUp: ['Why are reactive forms easier to test?', 'How do typed forms improve safety?']
        },
        {
            question: 'How do you implement cross-field validation, such as confirming a password matches?',
            difficulty: 'medium',
            answer: `<p>Cross-field validation must be a validator on the <strong>FormGroup</strong> (not an individual
            control), because it needs to read multiple controls. The validator reads the sibling controls from the
            group and returns an errors object on the group if they don't satisfy the rule.</p>`,
            explanation: 'A single control only knows about itself. To compare two fields you need a referee standing above both — that referee is the FormGroup-level validator.',
            code: `function passwordsMatch(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pw = group.get('password')?.value;
    const confirm = group.get('confirm')?.value;
    return pw === confirm ? null : { mismatch: true };
  };
}

form = this.fb.group(
  { password: ['', Validators.required], confirm: ['', Validators.required] },
  { validators: passwordsMatch() }
);
// Display: *ngIf="form.errors?.['mismatch'] && form.get('confirm')?.touched"`,
            language: 'typescript',
            bestPractices: ['Attach cross-field validators at the group level', 'Show the error near the relevant field once touched', 'Keep validators pure and reusable'],
            commonMistakes: ['Placing the validator on one control', 'Forgetting to display the group-level error in the template'],
            interviewTip: 'The key insight is "group-level validator" — say it explicitly and show reading both controls from the group.',
            followUp: ['How would you validate a date range (start < end)?', 'Where do you display a group-level error?']
        },
        {
            question: 'How do async validators work and how do you keep them from harming UX/performance?',
            difficulty: 'hard',
            answer: `<p><strong>Async validators</strong> return an Observable (or Promise) that resolves to an errors
            object or null — used for checks that require a server, like "is this username taken?". While the
            Observable is pending, the control's status is <code>PENDING</code>; you can show a spinner and should
            disable submit.</p>
            <p>To protect UX and the server:</p>
            <ul>
                <li>Run on blur (<code>updateOn: 'blur'</code>) or debounce so you don't call per keystroke</li>
                <li>Use switchMap so a newer request cancels an in-flight stale one</li>
                <li>catchError to a valid result so a failing availability check doesn't permanently block the user</li>
                <li>Combine with sync validators that run first (don't call the server for an empty/invalid field)</li>
            </ul>`,
            explanation: 'An async validator is like asking the front desk to confirm a room is available — you do not want to phone them after every letter the guest types. You ask once they have finished typing (blur), cancel the old call if they change their mind (switchMap), and do not lock them out if the phone line drops (catchError).',
            code: `username = new FormControl('', {
  validators: [Validators.required, Validators.minLength(3)],  // sync run first
  asyncValidators: [usernameAvailable(this.api)],
  updateOn: 'blur'   // only check the server when the user leaves the field
});

function usernameAvailable(api: UserApi): AsyncValidatorFn {
  return c => api.check(c.value).pipe(
    map(taken => taken ? { taken: true } : null),
    catchError(() => of(null))   // network error -> don't block the user
  );
}`,
            language: 'typescript',
            bestPractices: ['Run async validators on blur or debounced', 'Use switchMap to cancel stale requests', 'catchError to null so transient failures do not block submission', 'Let sync validators gate before hitting the server'],
            commonMistakes: ['Async validation on every keystroke (server spam)', 'No pending/spinner UX while validating', 'Letting a network error leave the field permanently invalid'],
            interviewTip: 'Mention the PENDING state and the switchMap cancellation pattern — those details show real RxJS + forms experience.',
            followUp: ['How does the PENDING status affect submit button state?', 'Why switchMap over mergeMap here?'],
            seniorPerspective: 'I treat async validators as a UX feature as much as a correctness one: they must be debounced/blur-triggered, cancel stale requests with switchMap, degrade gracefully on network failure (never trap the user in an invalid state), and pair with a visible pending indicator. I also keep the authoritative uniqueness check on the server at submit time \u2014 the async validator is a fast convenience, not the security boundary.'
        },
        {
            question: 'What are typed reactive forms (Angular 14+) and how does FormBuilder.nonNullable change control behavior?',
            difficulty: 'medium',
            answer: `<p><strong>Typed forms</strong> give every control, group, and array a concrete value type, so the compiler catches wrong field names and value types and <code>form.value</code> is fully typed. <code>FormBuilder</code> infers types from initial values, and <code>NonNullableFormBuilder</code> (or the <code>nonNullable: true</code> option) makes controls non-nullable.</p>
            <p>The key behavioral difference: a normal control resets to <code>null</code>, so its type is <code>T | null</code>. A <strong>nonNullable</strong> control resets to its <em>initial value</em> instead of null, so its type is just <code>T</code> — eliminating null checks throughout your code.</p>`,
            explanation: 'A normal control is a form field that, when you hit reset, wipes itself blank (null). A nonNullable control is a field that snaps back to its factory default on reset. Knowing it can never be empty means you stop writing "if not null" guards everywhere.',
            code: `import { FormBuilder, Validators } from '@angular/forms';

const fb = inject(FormBuilder);

// Nullable by default: reset() sets controls to null -> value is T | null
const a = fb.group({
  name: ['', Validators.required],          // FormControl<string | null>
});
a.reset();                                   // name === null

// nonNullable: reset() restores the initial value -> value is T
const b = fb.group({
  name: fb.nonNullable.control('', Validators.required), // FormControl<string>
  age:  fb.nonNullable.control(0),
});
b.reset();                                   // name === '' (initial), not null

// getRawValue() is fully typed (includes disabled controls)
const value: { name: string; age: number } = b.getRawValue();

// Wrong field name / type is a COMPILE error now:
// b.controls.naem;            // error: property does not exist
// b.controls.age.setValue(''); // error: string not assignable to number`,
            language: 'typescript',
            bestPractices: [
                'Use typed forms everywhere — never the legacy UntypedFormGroup in new code',
                'Prefer nonNullable controls so values are T, not T | null',
                'Use getRawValue() when you need disabled-control values, fully typed',
                'Let FormBuilder infer types from initial values rather than annotating manually'
            ],
            commonMistakes: [
                'Falling back to UntypedFormControl, losing all compile-time safety',
                'Forgetting that a normal control resets to null, causing runtime null errors',
                'Annotating control types redundantly instead of relying on inference',
                'Assuming form.value includes disabled controls (it omits them; getRawValue does not)'
            ],
            interviewTip: 'The crisp distinction interviewers want: a plain control is T | null because reset() yields null, while a nonNullable control is T because reset() restores the initial value. Tie it to fewer null checks.',
            followUp: ['What is the difference between form.value and form.getRawValue()?', 'How do typed forms handle optional/dynamically added controls?'],
            seniorPerspective: 'I default to nonNullable for almost every control because the T-not-null typing removes a flood of optional-chaining noise in submit handlers and template bindings. The few genuinely nullable fields (an optional date) I type explicitly so the nullability is intentional, not accidental.',
            architectPerspective: 'Typed forms shift an entire class of field-name and value-type bugs from runtime to compile time, which is exactly where you want them in a large form-heavy app. I treat UntypedForm* in new code as a lint failure — the type safety is free once initial values are provided.'
        },
        {
            question: 'How do you build dynamic forms with FormArray, and what are the pitfalls of binding and validating array items?',
            difficulty: 'hard',
            answer: `<p><strong>FormArray</strong> holds an ordered, runtime-variable list of controls or groups — ideal for repeatable inputs (phone numbers, line items, survey answers) where the count is unknown up front. You <code>push</code>/<code>removeAt</code>/<code>insert</code> controls and bind with <code>formArrayName</code> plus a numeric <code>[formControlName]="i"</code> (or <code>formGroupName</code> for arrays of groups).</p>
            <p>Pitfalls: bind by <strong>index</strong> correctly, give each row a stable identity with <code>trackBy</code> so removing a middle row does not reuse the wrong DOM/state, and validate at the right level — per-item validators on each control, and array-level validators (e.g., "at least one") on the FormArray itself.</p>`,
            explanation: 'A FormArray is like a spreadsheet column you can add or delete rows from at will. The danger is row identity: if you delete row 3 but the UI tracks rows by position, the inputs below silently shift up and you can end up editing the wrong cell. trackBy pins each row to its real identity.',
            code: `import { FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';

const fb = inject(FormBuilder);

form = fb.group({
  name: fb.nonNullable.control('', Validators.required),
  // Array of GROUPS (each line item has fields)
  items: fb.array<FormGroup>([], { validators: [atLeastOne] }),
});

get items(): FormArray { return this.form.get('items') as FormArray; }

addItem() {
  this.items.push(fb.group({
    sku: fb.nonNullable.control('', Validators.required),
    qty: fb.nonNullable.control(1, [Validators.min(1)]),
  }));
}
removeItem(i: number) { this.items.removeAt(i); }

// Array-level validator: the list must not be empty
function atLeastOne(arr: AbstractControl): ValidationErrors | null {
  return (arr as FormArray).length > 0 ? null : { empty: true };
}

// Template (note formGroupName by index + trackBy for stable rows):
// <div formArrayName="items">
//   @for (group of items.controls; track group; let i = $index) {
//     <div [formGroupName]="i">
//       <input formControlName="sku" />
//       <input type="number" formControlName="qty" />
//       <button type="button" (click)="removeItem(i)">Remove</button>
//     </div>
//   }
// </div>`,
            language: 'typescript',
            bestPractices: [
                'Expose a typed getter for the FormArray to keep templates clean',
                'Track array rows by identity (track group), not by index, when rows can be removed/reordered',
                'Put per-item rules on each control and list-level rules on the FormArray',
                'Use formGroupName by index for arrays of groups, formControlName by index for arrays of controls'
            ],
            commonMistakes: [
                'Tracking by $index so removing a middle row reuses the wrong row state',
                'Casting the array inline in many places instead of a single getter',
                'Putting a "at least one item" rule on a child control instead of the array',
                'Mutating the underlying array directly instead of using push/removeAt/insert'
            ],
            interviewTip: 'Show both the component API (push/removeAt + typed getter) and the template binding (formArrayName + indexed formGroupName/formControlName), then call out the track-by-identity pitfall and array-level validation. That breadth signals real dynamic-form experience.',
            followUp: ['Why track by identity instead of $index in an editable list?', 'How would you validate that SKUs across the array are unique?'],
            seniorPerspective: 'The recurring production bug with FormArrays is row-identity: tracking by index means deleting row 2 visually shifts every row below and users edit the wrong data. I always track by the group/control reference and keep a single typed getter so the template never re-casts. For very large arrays I virtualize and switch validation to blur/submit.',
            architectPerspective: 'FormArray is where reactive forms earn their keep — dynamic structure is painful in template-driven forms. I model line-item/repeatable sections as arrays of typed groups with clearly separated item-level and collection-level validation, which keeps complex builders (quotes, surveys, configurators) maintainable as requirements grow.'
        },
        {
            question: 'How do valueChanges/statusChanges and the updateOn strategy let you build reactive, OnPush-friendly forms?',
            difficulty: 'advanced',
            answer: `<p>Every control and group exposes <code>valueChanges</code> and <code>statusChanges</code> Observables. You use them to drive conditional fields, dependent dropdowns, autosave, and derived UI reactively rather than reading values imperatively. Because the form pushes changes through Observables (or signals via <code>toSignal</code>), reactive forms compose cleanly with <strong>OnPush</strong> change detection.</p>
            <p>The <code>updateOn</code> option (<code>'change' | 'blur' | 'submit'</code>) controls <em>when</em> these streams fire and validation runs. Switching expensive validation or autosave to <code>'blur'</code> dramatically cuts churn. Combine with <code>debounceTime</code>, <code>distinctUntilChanged</code>, and <code>takeUntilDestroyed</code> for efficient, leak-free reactivity.</p>`,
            explanation: 'valueChanges is a live wire broadcasting every edit; you tap it to make the form react to itself. updateOn is the volume knob that decides whether it broadcasts on every keystroke, only when you leave a field, or only on submit — turning it down is the simplest way to stop a chatty form from flooding your logic.',
            code: `import { inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

export class ProfileFormComponent {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // updateOn:'blur' -> valueChanges/validation fire on blur, not per keystroke
  form = this.fb.group({
    country: this.fb.nonNullable.control(''),
    state:   this.fb.nonNullable.control({ value: '', disabled: true }),
  }, { updateOn: 'blur' });

  constructor() {
    // Conditional field: enable state only when a country is chosen
    this.form.controls.country.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(c => c ? this.form.controls.state.enable()
                       : this.form.controls.state.disable());

    // Autosave: debounce + react to status so we only save valid states
    this.form.valueChanges.pipe(
      debounceTime(500),
      switchMap(v => this.form.valid ? this.api.autosave(v) : []),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}`,
            language: 'typescript',
            bestPractices: [
                'Drive conditional/dependent fields off valueChanges, not imperative reads',
                'Use updateOn:"blur" or "submit" to reduce validation and stream churn',
                'Always pair form subscriptions with takeUntilDestroyed (or async pipe/toSignal)',
                'Debounce autosave/search reactions and gate on statusChanges/valid'
            ],
            commonMistakes: [
                'Subscribing to valueChanges without cleanup, leaking on every form instance',
                'Leaving updateOn:"change" for expensive validators, validating on every keystroke',
                'Calling setValue inside a valueChanges handler without { emitEvent: false }, causing infinite loops',
                'Reacting to value before checking status, autosaving invalid data'
            ],
            interviewTip: 'Mention the infinite-loop trap: updating a control inside its own valueChanges re-emits unless you pass { emitEvent: false }. Pair that with updateOn and takeUntilDestroyed to show you handle reactivity safely.',
            followUp: ['How do you prevent a valueChanges feedback loop when patching values?', 'Why do reactive forms work well with OnPush?'],
            seniorPerspective: 'I lean on valueChanges for everything dependent-field related and immediately add takeUntilDestroyed plus { emitEvent: false } on any programmatic patch — the self-triggering loop is the bug I have seen most. For large or expensive forms, flipping updateOn to "blur" is the single highest-leverage change for perceived performance.',
            architectPerspective: 'valueChanges/statusChanges make the form a reactive data source rather than a passive value bag, which fits naturally with OnPush and signal-based change detection. I standardize the reactive plumbing (debounce, distinct, takeUntilDestroyed, emitEvent control) so every complex form behaves predictably and stays leak-free across the app.'
        }
    ]
});
