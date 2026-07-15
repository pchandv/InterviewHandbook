'use strict';

PageData.register('web-accessibility', {
    title: 'Accessibility (WCAG)',
    description: 'WCAG 2.1 AA principles, ARIA patterns, keyboard navigation, testing tools, and accessible component patterns',
    sections: [
        {
            title: 'WCAG 2.1 Principles (POUR)',
            content: `<p>WCAG is organized around four principles that form the foundation of web accessibility:</p>
<ul>
<li><strong>Perceivable</strong> - Information must be presentable in ways all users can perceive (text alternatives, captions, adaptable content, distinguishable content).</li>
<li><strong>Operable</strong> - UI components must be operable by all users (keyboard accessible, enough time, no seizure triggers, navigable).</li>
<li><strong>Understandable</strong> - Information and UI operation must be understandable (readable, predictable, input assistance).</li>
<li><strong>Robust</strong> - Content must be robust enough to work with current and future assistive technologies (valid markup, compatible).</li>
</ul>
<p><strong>Conformance levels:</strong></p>
<ul>
<li><strong>Level A</strong> - Minimum accessibility (basic requirements)</li>
<li><strong>Level AA</strong> - Target for most organizations (legal standard in many jurisdictions)</li>
<li><strong>Level AAA</strong> - Highest level (not always achievable for all content)</li>
</ul>`
        },
        {
            title: 'Accessibility Requirements by Principle',
            mermaid: `graph TD
    A[WCAG 2.1 AA] --> B[Perceivable]
    A --> C[Operable]
    A --> D[Understandable]
    A --> E[Robust]
    
    B --> B1[Text alternatives for images]
    B --> B2[Captions for video/audio]
    B --> B3[Color contrast 4.5:1 text / 3:1 large]
    B --> B4[Content adapts to zoom 200%]
    B --> B5[Do not rely on color alone]
    
    C --> C1[All interactive via keyboard]
    C --> C2[No keyboard traps]
    C --> C3[Skip navigation links]
    C --> C4[Focus visible indicators]
    C --> C5[Timeout warnings]
    
    D --> D1[Language declared]
    D --> D2[Consistent navigation]
    D --> D3[Error identification]
    D --> D4[Labels and instructions]
    
    E --> E1[Valid HTML]
    E --> E2[ARIA used correctly]
    E --> E3[Status messages announced]`,
            content: `<p>WCAG AA is the legal standard referenced by the ADA (US), EN 301 549 (EU), and most accessibility laws. Meeting AA requires addressing all Level A and AA success criteria.</p>`
        },
        {
            title: 'ARIA Roles, States, and Properties',
            code: `<!-- ARIA roles - define what an element IS -->
<div role="alert">Error: Payment failed</div>
<nav role="navigation" aria-label="Main">...</nav>
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">Tab 2</button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">Content</div>

<!-- ARIA states - dynamic properties that change -->
<button aria-expanded="false" aria-controls="menu-1">Menu</button>
<ul id="menu-1" aria-hidden="true">...</ul>

<button aria-pressed="false">Toggle Dark Mode</button>
<input aria-invalid="true" aria-describedby="error-msg">
<span id="error-msg" role="alert">Email format is invalid</span>

<!-- ARIA properties - static relationships -->
<input aria-label="Search products" type="search">
<input aria-labelledby="fname-label" id="fname">
<label id="fname-label">First Name</label>
<input aria-describedby="password-hint">
<p id="password-hint">Must be at least 8 characters</p>

<!-- Live regions - announce dynamic content -->
<div aria-live="polite" aria-atomic="true">
  <!-- Content changes here are announced by screen readers -->
  3 items added to cart
</div>
<div aria-live="assertive">
  <!-- Interrupts current reading for urgent messages -->
  Session expiring in 2 minutes
</div>

<!-- IMPORTANT: First rule of ARIA -->
<!-- Use native HTML elements when possible! -->
<!-- <button> is better than <div role="button" tabindex="0"> -->`,
            language: 'html'
        },
        {
            title: 'Keyboard Navigation',
            code: `<!-- Keyboard navigation patterns -->

<!-- Skip navigation link (first focusable element) -->
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <nav><!-- navigation here --></nav>
  <main id="main-content" tabindex="-1">
    <!-- Main content -->
  </main>
</body>

<style>
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 9999;
  padding: 0.5rem 1rem;
  background: #000;
  color: #fff;
}
.skip-link:focus {
  top: 0; /* Visible only when focused via keyboard */
}
</style>

<!-- Focus management for dynamic content -->
<script>
// When opening a modal, move focus to it
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.setAttribute('aria-hidden', 'false');
  // Store last focused element to return to on close
  modal.lastFocusedElement = document.activeElement;
  // Move focus to first focusable element inside modal
  const firstFocusable = modal.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  firstFocusable?.focus();
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.setAttribute('aria-hidden', 'true');
  // Return focus to trigger element
  modal.lastFocusedElement?.focus();
}

// Trap focus within modal (Tab cycles within modal only)
modal.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    const focusables = modal.querySelectorAll(focusableSelector);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  if (e.key === 'Escape') closeModal(modalId);
});
</script>`,
            language: 'html'
        },
        {
            title: 'Focus Management Flow',
            mermaid: `graph TD
    A[User presses Tab] --> B{Is next element focusable?}
    B -->|Yes| C[Move focus to next element]
    B -->|No - tabindex=-1| D[Skip element]
    C --> E{Inside modal/trap?}
    E -->|Yes| F{Is last focusable in trap?}
    F -->|Yes| G[Wrap to first focusable in trap]
    F -->|No| H[Move to next in trap]
    E -->|No| I[Normal document order]
    
    J[Modal Opens] --> K[Store previously focused element]
    K --> L[Move focus into modal]
    L --> M[Trap Tab within modal]
    
    N[Modal Closes] --> O[Restore focus to stored element]
    
    P[Route Change - SPA] --> Q[Move focus to new page heading/content]
    Q --> R[Announce new page title to screen reader]`,
            content: `<p>Focus management is the most commonly broken accessibility pattern in SPAs. When content changes dynamically (route navigation, modal open/close, content updates), focus must be explicitly managed to maintain a logical reading order.</p>`
        },
        {
            title: 'Color Contrast and Visual Design',
            content: `<p><strong>WCAG AA contrast requirements:</strong></p>
<ul>
<li><strong>Normal text</strong> (< 24px / < 18.66px bold): 4.5:1 contrast ratio</li>
<li><strong>Large text</strong> (>= 24px / >= 18.66px bold): 3:1 contrast ratio</li>
<li><strong>UI components and graphics</strong>: 3:1 against adjacent colors</li>
<li><strong>Focus indicators</strong>: 3:1 against background</li>
</ul>
<p><strong>Common failures:</strong></p>
<ul>
<li>Light gray text on white backgrounds (placeholder text is the worst offender)</li>
<li>Conveying information by color alone (error states shown only in red)</li>
<li>Focus outlines removed without replacement (<code>outline: none</code> without visible alternative)</li>
<li>Disabled states that are nearly invisible</li>
</ul>
<p><strong>Best practices:</strong></p>
<ul>
<li>Use color PLUS text/icon/pattern to convey meaning</li>
<li>Test with color blindness simulators (8% of men have color vision deficiency)</li>
<li>Design with sufficient contrast in your token system from the start</li>
<li>Custom focus styles: <code>:focus-visible</code> shows focus only for keyboard users</li>
</ul>`
        },
        {
            title: 'Form Accessibility',
            code: `<!-- Accessible form patterns -->
<form aria-labelledby="form-title">
  <h2 id="form-title">Create Account</h2>
  
  <!-- Always associate labels with inputs -->
  <div class="field">
    <label for="email">Email address <span aria-hidden="true">*</span></label>
    <input 
      id="email" 
      type="email" 
      required
      aria-required="true"
      aria-describedby="email-hint email-error"
      aria-invalid="false"
    >
    <p id="email-hint" class="hint">We will never share your email</p>
    <p id="email-error" class="error" role="alert" aria-live="polite">
      <!-- Dynamically populated on validation error -->
    </p>
  </div>
  
  <!-- Fieldset groups related inputs -->
  <fieldset>
    <legend>Notification preferences</legend>
    <div>
      <input type="checkbox" id="notify-email" name="notifications" value="email">
      <label for="notify-email">Email notifications</label>
    </div>
    <div>
      <input type="checkbox" id="notify-sms" name="notifications" value="sms">
      <label for="notify-sms">SMS notifications</label>
    </div>
  </fieldset>
  
  <!-- Error summary at top of form -->
  <div role="alert" aria-live="polite" id="error-summary">
    <h3>Please fix the following errors:</h3>
    <ul>
      <li><a href="#email">Email: Please enter a valid email address</a></li>
    </ul>
  </div>
  
  <button type="submit">Create Account</button>
</form>`,
            language: 'html'
        },
        {
            title: 'Testing Tools and Workflow',
            content: `<p><strong>Automated testing (catches ~30-40% of issues):</strong></p>
<ul>
<li><strong>axe-core / axe DevTools</strong> - Browser extension and CI integration. Industry standard.</li>
<li><strong>Lighthouse</strong> - Built into Chrome DevTools. Accessibility score and recommendations.</li>
<li><strong>eslint-plugin-jsx-a11y</strong> - Catch ARIA misuse in JSX at compile time.</li>
<li><strong>Pa11y</strong> - CLI tool for CI pipeline integration.</li>
<li><strong>Playwright/Cypress</strong> - axe integration for automated accessibility testing in E2E suites.</li>
</ul>
<p><strong>Manual testing (catches the other 60-70%):</strong></p>
<ul>
<li><strong>Keyboard-only navigation</strong> - Tab through entire page. Can you reach and operate everything?</li>
<li><strong>Screen reader testing</strong> - NVDA (Windows free), VoiceOver (Mac), JAWS (Windows paid).</li>
<li><strong>Zoom to 200%</strong> - Does content reflow without horizontal scroll?</li>
<li><strong>Color contrast checker</strong> - WebAIM contrast checker, Stark plugin.</li>
<li><strong>Heading hierarchy</strong> - h1 → h2 → h3 in logical order (no skipping levels).</li>
</ul>
<p><strong>Testing workflow:</strong> Automated in CI (axe-core on every PR) + Manual testing for new features (keyboard + screen reader) + Periodic full audit (quarterly).</p>`
        }
    ],
    questions: [
        {
            question: 'What are the WCAG 2.1 AA principles and why do they matter for developers?',
            difficulty: 'easy',
            answer: `<p><strong>POUR principles:</strong></p>
<ul>
<li><strong>Perceivable</strong> - Can users perceive the content? (alt text, captions, contrast, not color-only)</li>
<li><strong>Operable</strong> - Can users operate the interface? (keyboard access, no traps, enough time)</li>
<li><strong>Understandable</strong> - Can users understand the content and UI? (clear language, consistent navigation, error help)</li>
<li><strong>Robust</strong> - Does it work with assistive technologies? (valid HTML, correct ARIA, status messages)</li>
</ul>
<p><strong>Why it matters for developers:</strong></p>
<ul>
<li><strong>Legal</strong> - ADA lawsuits increased 300%+ since 2018. WCAG AA is the legal standard.</li>
<li><strong>Business</strong> - 15-20% of population has some disability. Inaccessible = lost customers.</li>
<li><strong>Technical quality</strong> - Accessible code is semantic, well-structured, and more maintainable.</li>
<li><strong>SEO</strong> - Screen reader best practices (alt text, heading hierarchy) directly improve SEO.</li>
</ul>
<p>Note: Full WCAG validation requires manual testing with assistive technologies and expert accessibility review.</p>`,
            interviewTip: 'Know the four principles by name. Being able to give one concrete example per principle shows practical knowledge.',
            followUp: ['What is the difference between A, AA, and AAA conformance?', 'Which WCAG criteria are most commonly violated?'],
            seniorPerspective: 'Accessibility is not a feature to add later - it is a quality dimension like performance or security. Retrofitting is 10x more expensive than building accessible from the start.',
            architectPerspective: 'Build accessibility into your component library and design system at the foundation level. When the building blocks are accessible, applications built from them inherit accessibility.'
        },
        {
            question: 'What is ARIA and what is the first rule of ARIA?',
            difficulty: 'easy',
            answer: `<p><strong>ARIA</strong> (Accessible Rich Internet Applications) is a set of HTML attributes that define roles, states, and properties to make dynamic web content accessible to assistive technologies.</p>
<p><strong>The First Rule of ARIA: Do not use ARIA if you can use native HTML.</strong></p>
<p>Native HTML elements have built-in accessibility semantics, keyboard handling, and focus management. ARIA should only add what native HTML cannot express.</p>
<pre><code>&lt;!-- BAD: reinventing the wheel --&gt;
&lt;div role="button" tabindex="0" onclick="submit()"
     onkeydown="if(e.key==='Enter')submit()"&gt;Submit&lt;/div&gt;

&lt;!-- GOOD: native button handles everything --&gt;
&lt;button onclick="submit()"&gt;Submit&lt;/button&gt;

&lt;!-- GOOD ARIA use: no native equivalent exists --&gt;
&lt;div role="tablist"&gt;
  &lt;button role="tab" aria-selected="true"&gt;Tab 1&lt;/button&gt;
&lt;/div&gt;</code></pre>
<p><strong>When ARIA is appropriate:</strong></p>
<ul>
<li>Custom widgets with no HTML equivalent (tabs, trees, combobox)</li>
<li>Defining relationships between elements (aria-describedby, aria-controls)</li>
<li>Communicating dynamic state changes (aria-expanded, aria-live)</li>
<li>Providing accessible names when visible labels are not possible (aria-label)</li>
</ul>`,
            interviewTip: 'Lead with the first rule. Many candidates overuse ARIA. Showing restraint demonstrates deeper understanding than showing all the ARIA attributes you know.',
            followUp: ['What is the difference between aria-label, aria-labelledby, and aria-describedby?', 'When is aria-hidden appropriate?'],
            seniorPerspective: 'Misused ARIA is worse than no ARIA. role="button" without keyboard handling creates a "lie" - screen readers announce it as a button, but it does not behave like one.',
            architectPerspective: 'Build a component library where complex ARIA patterns (combobox, tree, tabs) are encapsulated. Application developers use the component without needing ARIA expertise.'
        },
        {
            question: 'How do you manage focus in a single-page application (SPA)?',
            difficulty: 'hard',
            answer: `<p>SPAs break the natural focus flow because page navigation does not trigger a full page load. Focus must be managed explicitly.</p>
<p><strong>Key scenarios:</strong></p>
<ul>
<li><strong>Route changes</strong> - Move focus to the new page heading or main content area. Announce the new page title.</li>
<li><strong>Modal dialogs</strong> - Move focus into modal on open, trap Tab within modal, return focus to trigger on close.</li>
<li><strong>Dynamic content</strong> - When content loads asynchronously, announce it via aria-live or move focus if appropriate.</li>
<li><strong>Delete/remove</strong> - When an item is removed from a list, move focus to the next logical element.</li>
</ul>
<pre><code>// Route change focus management (React example)
useEffect(() => {
  // After route change, focus the page heading
  const heading = document.querySelector('h1');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus();
    // Announce to screen reader
    document.title = \`\${pageTitle} - My App\`;
  }
}, [location.pathname]);

// Angular example with route events
this.router.events.pipe(
  filter(event => event instanceof NavigationEnd)
).subscribe(() => {
  const mainContent = document.getElementById('main-content');
  mainContent?.focus();
});</code></pre>
<p><strong>Common mistakes:</strong></p>
<ul>
<li>Focus stays on clicked link after route change (user is lost)</li>
<li>Focus disappears into removed DOM element (screen reader announces nothing)</li>
<li>Auto-focus on page load without user action (disorienting)</li>
</ul>`,
            interviewTip: 'Focus management in SPAs is the #1 accessibility challenge for modern web apps. Showing you understand this problem demonstrates real-world experience.',
            followUp: ['How does inert attribute help with focus management?', 'How do you test focus management?'],
            seniorPerspective: 'Every SPA framework needs a focus management strategy. In React, use a FocusManager wrapper. In Angular, use a route guard that manages focus. Build it once, use everywhere.',
            architectPerspective: 'Focus management should be a framework-level concern, not left to individual developers. Build route-level focus management into your app shell so it happens automatically.'
        },
        {
            question: 'What are live regions and when would you use them?',
            difficulty: 'medium',
            answer: `<p><strong>Live regions</strong> announce dynamic content changes to screen readers without moving focus. They solve the problem of "how does a blind user know something changed on screen?"</p>
<p><strong>Types:</strong></p>
<ul>
<li><code>aria-live="polite"</code> - Announces at the next pause in reading (non-urgent updates)</li>
<li><code>aria-live="assertive"</code> - Interrupts current reading immediately (critical alerts)</li>
<li><code>role="status"</code> - Implicit polite live region for status updates</li>
<li><code>role="alert"</code> - Implicit assertive live region for errors/warnings</li>
</ul>
<p><strong>Use cases:</strong></p>
<ul>
<li><strong>Form validation errors</strong> - Announce "Email is invalid" when shown (role="alert")</li>
<li><strong>Toast notifications</strong> - Announce success/error messages (aria-live="polite")</li>
<li><strong>Loading states</strong> - "Loading..." and "Content loaded" (role="status")</li>
<li><strong>Cart updates</strong> - "Item added to cart. Cart total: $45.99" (aria-live="polite")</li>
<li><strong>Chat messages</strong> - New messages announced as they arrive</li>
<li><strong>Countdown timers</strong> - Session expiring warning (aria-live="assertive")</li>
</ul>
<pre><code>&lt;!-- Live region must exist in DOM before content changes --&gt;
&lt;div aria-live="polite" aria-atomic="true" class="sr-only"&gt;
  &lt;!-- Content injected dynamically gets announced --&gt;
&lt;/div&gt;

&lt;!-- aria-atomic="true" announces entire region content --&gt;
&lt;!-- aria-atomic="false" announces only changed nodes --&gt;</code></pre>`,
            interviewTip: 'Mention the key gotcha: the live region element must exist in the DOM BEFORE you inject content into it. Creating it dynamically does not work in all screen readers.',
            followUp: ['What is the difference between aria-atomic true and false?', 'How do you prevent too many announcements from overwhelming the user?'],
            seniorPerspective: 'Create a centralized announcement service that manages live regions. This prevents multiple components from fighting over screen reader attention and allows throttling.',
            architectPerspective: 'Live regions are an announcement channel to the user. Design an announcement priority system: critical (assertive), informational (polite), and debounced (batch multiple updates).'
        },
        {
            question: 'How do you make a custom dropdown/combobox accessible?',
            difficulty: 'hard',
            answer: `<p>Custom dropdowns are one of the hardest patterns to make accessible. Follow the ARIA combobox pattern.</p>
<pre><code>&lt;div class="combobox-wrapper"&gt;
  &lt;label id="combo-label" for="combo-input"&gt;Choose a country&lt;/label&gt;
  &lt;div role="combobox" aria-expanded="false" aria-haspopup="listbox" aria-owns="listbox-1"&gt;
    &lt;input 
      id="combo-input"
      type="text"
      aria-autocomplete="list"
      aria-controls="listbox-1"
      aria-activedescendant=""
      aria-labelledby="combo-label"
    &gt;
  &lt;/div&gt;
  &lt;ul id="listbox-1" role="listbox" aria-labelledby="combo-label" hidden&gt;
    &lt;li id="opt-1" role="option" aria-selected="false"&gt;Australia&lt;/li&gt;
    &lt;li id="opt-2" role="option" aria-selected="false"&gt;Canada&lt;/li&gt;
    &lt;li id="opt-3" role="option" aria-selected="true"&gt;Germany&lt;/li&gt;
  &lt;/ul&gt;
&lt;/div&gt;</code></pre>
<p><strong>Required keyboard interactions:</strong></p>
<ul>
<li>Down Arrow: Open dropdown, move to next option</li>
<li>Up Arrow: Move to previous option</li>
<li>Enter: Select current option, close dropdown</li>
<li>Escape: Close dropdown without selecting, return focus to input</li>
<li>Home/End: Move to first/last option</li>
<li>Type-ahead: Jump to matching option</li>
</ul>
<p><strong>State management:</strong></p>
<ul>
<li>Update <code>aria-expanded</code> when opening/closing</li>
<li>Update <code>aria-activedescendant</code> to point to highlighted option</li>
<li>Update <code>aria-selected</code> on chosen option</li>
<li>Announce option count: "3 results available"</li>
</ul>
<p><strong>Recommendation:</strong> Use a tested library (Headless UI, Radix, React Aria) rather than building from scratch. The ARIA pattern has many edge cases.</p>`,
            interviewTip: 'Acknowledge the complexity and recommend using tested libraries. Building an accessible combobox from scratch is a multi-day task with extensive testing.',
            followUp: ['What is aria-activedescendant and why not use real DOM focus?', 'How do you announce the number of filtered results?'],
            seniorPerspective: 'Custom dropdowns are responsible for a disproportionate number of accessibility bugs. Use headless component libraries (Radix, React Aria, Headless UI) that handle the ARIA complexity for you.',
            architectPerspective: 'Invest in accessible headless primitives once and reuse everywhere. The ARIA interaction patterns for combobox, tree, grid are complex - encapsulate that complexity in your component library.'
        },
        {
            question: 'What testing tools and workflows do you use for accessibility?',
            difficulty: 'medium',
            answer: `<p><strong>Layered testing approach:</strong></p>
<p><strong>Layer 1 - Development time (instant feedback):</strong></p>
<ul>
<li>ESLint jsx-a11y plugin - catches ARIA misuse in code</li>
<li>IDE extensions (axe Accessibility Linter) - inline warnings</li>
<li>Storybook a11y addon - visual accessibility panel per component</li>
</ul>
<p><strong>Layer 2 - CI/CD (automated gates):</strong></p>
<ul>
<li>axe-core in Playwright/Cypress tests - fail PR on violations</li>
<li>Pa11y CI - automated full-page scans in pipeline</li>
<li>Lighthouse CI - accessibility score regression detection</li>
</ul>
<pre><code>// Playwright + axe-core example
import AxeBuilder from '@axe-core/playwright';

test('homepage has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});</code></pre>
<p><strong>Layer 3 - Manual testing (catches remaining 60%):</strong></p>
<ul>
<li>Keyboard navigation walkthrough (Tab, Enter, Escape, Arrow keys)</li>
<li>Screen reader testing (VoiceOver on Mac, NVDA on Windows)</li>
<li>Zoom to 200% and 400% - check reflow</li>
<li>Forced colors mode (Windows High Contrast)</li>
</ul>
<p><strong>Layer 4 - Expert audit (periodic):</strong></p>
<ul>
<li>Quarterly audit by accessibility specialist</li>
<li>User testing with people who use assistive technology</li>
</ul>`,
            interviewTip: 'Show the layered approach. Automated testing catches 30-40% of issues. Manual testing is still essential. Say "automation catches the easy stuff; real testing needs screen readers."',
            followUp: ['What are the most common issues axe-core catches?', 'How do you prioritize accessibility fixes?'],
            seniorPerspective: 'Integrate axe-core into your CI pipeline with zero tolerance for violations. This prevents regression. Manual testing catches the nuanced issues that automation cannot.',
            architectPerspective: 'Accessibility testing should be as automated as possible and as manual as necessary. Build the automated layer into your CI from day one. Schedule manual audits quarterly.'
        },
        {
            question: 'How do you make a modal dialog fully accessible?',
            difficulty: 'hard',
            answer: `<p>An accessible modal requires careful attention to focus, keyboard interaction, and screen reader announcements.</p>
<pre><code>&lt;!-- Accessible modal pattern --&gt;
&lt;div 
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-desc"
&gt;
  &lt;h2 id="modal-title"&gt;Confirm Deletion&lt;/h2&gt;
  &lt;p id="modal-desc"&gt;This action cannot be undone.&lt;/p&gt;
  &lt;button&gt;Cancel&lt;/button&gt;
  &lt;button&gt;Delete&lt;/button&gt;
&lt;/div&gt;

&lt;!-- Background content marked inert --&gt;
&lt;main inert&gt;...&lt;/main&gt;</code></pre>
<p><strong>Requirements:</strong></p>
<ol>
<li><strong>Focus on open:</strong> Move focus to first focusable element (or the dialog itself)</li>
<li><strong>Focus trap:</strong> Tab/Shift+Tab cycles within modal only</li>
<li><strong>Escape closes:</strong> Keyboard shortcut to dismiss</li>
<li><strong>Focus on close:</strong> Return focus to the element that triggered the modal</li>
<li><strong>Background inert:</strong> Content behind modal is not focusable or readable by AT (<code>inert</code> attribute or <code>aria-hidden="true"</code>)</li>
<li><strong>Labeling:</strong> <code>aria-labelledby</code> pointing to the title, <code>aria-describedby</code> for additional context</li>
<li><strong>Click outside:</strong> Clicking backdrop closes modal (with focus return)</li>
</ol>
<p><strong>The inert attribute</strong> (modern browsers) makes all content in the background non-interactive and hidden from AT in one step. This is the modern replacement for manually setting aria-hidden on siblings.</p>`,
            interviewTip: 'Cover the full lifecycle: open (focus move), use (trap), close (focus return). The inert attribute is the modern approach - mention it.',
            followUp: ['How does the native dialog element handle accessibility?', 'What is the inert attribute and which browsers support it?'],
            seniorPerspective: 'Use the native <dialog> element where possible - it handles focus trapping and inert automatically. For custom modals, the inert attribute simplifies background management significantly.',
            architectPerspective: 'Build one modal component that handles all accessibility requirements. Application developers should never implement modal focus management themselves - it is too easy to get wrong.'
        },
        {
            question: 'What is the difference between aria-label, aria-labelledby, and aria-describedby?',
            difficulty: 'easy',
            answer: `<p>These three attributes provide accessible names and descriptions but in different ways:</p>
<p><strong>aria-label:</strong></p>
<ul>
<li>Provides a string directly as the accessible name</li>
<li>Use when no visible text label exists</li>
<li>Overrides any other labeling mechanism</li>
<li>Example: <code>&lt;button aria-label="Close"&gt;X&lt;/button&gt;</code></li>
</ul>
<p><strong>aria-labelledby:</strong></p>
<ul>
<li>Points to another element's ID whose text becomes the accessible name</li>
<li>Can reference multiple IDs (space-separated)</li>
<li>Use when a visible label exists elsewhere in the DOM</li>
<li>Example: <code>&lt;input aria-labelledby="fname-label unit-label"&gt;</code></li>
</ul>
<p><strong>aria-describedby:</strong></p>
<ul>
<li>Points to an element providing additional description (announced after the name)</li>
<li>Does NOT replace the name - adds supplementary info</li>
<li>Use for hints, constraints, errors</li>
<li>Example: <code>&lt;input aria-describedby="password-requirements"&gt;</code></li>
</ul>
<p><strong>Priority order:</strong> aria-labelledby > aria-label > <label> > title attribute. Screen readers use the first one found.</p>`,
            interviewTip: 'The key distinction: labelledby/label provide the NAME (what is it), describedby provides DESCRIPTION (additional help). Screen readers announce name first, then description.',
            followUp: ['Can aria-labelledby reference hidden elements?', 'What happens if both aria-label and aria-labelledby are present?'],
            seniorPerspective: 'Prefer visible labels over aria-label when possible. Visible labels benefit all users, not just screen reader users. aria-label is for when visual design truly cannot accommodate a label.',
            architectPerspective: 'Define naming conventions in your component library. Inputs always get visible labels. Icon buttons always get aria-label. This eliminates decision fatigue for developers.'
        },
        {
            question: 'How do you ensure accessibility in a component library used by multiple teams?',
            difficulty: 'advanced',
            answer: `<p><strong>Build accessibility INTO the component library so consuming teams get it for free.</strong></p>
<p><strong>Component-level:</strong></p>
<ul>
<li>All interactive components include keyboard handling by default</li>
<li>Required ARIA attributes are built-in (not opt-in)</li>
<li>Props enforce accessibility: <code>&lt;Button&gt;</code> requires children or aria-label</li>
<li>Focus management encapsulated within complex components (modals, dropdowns)</li>
</ul>
<p><strong>Testing:</strong></p>
<ul>
<li>Each component has axe-core unit tests</li>
<li>Storybook accessibility addon for visual testing</li>
<li>Keyboard interaction tests in the component test suite</li>
<li>Screen reader testing for complex widgets</li>
</ul>
<p><strong>Documentation:</strong></p>
<ul>
<li>Each component documents accessibility features and usage requirements</li>
<li>Do/Don't examples showing accessible vs inaccessible usage</li>
<li>ARIA pattern reference linked for complex widgets</li>
</ul>
<p><strong>Enforcement:</strong></p>
<ul>
<li>TypeScript props that require accessible names (aria-label or children)</li>
<li>Runtime warnings in development mode for missing accessibility props</li>
<li>Linting rules specific to the component library</li>
</ul>
<pre><code>// TypeScript enforced accessibility
type ButtonProps = {
  children: React.ReactNode; // visible text required
} | {
  'aria-label': string; // OR aria-label for icon buttons
  children?: React.ReactNode;
};

// Runtime warning
if (!props.children && !props['aria-label']) {
  console.warn('Button requires either children or aria-label for accessibility');
}</code></pre>`,
            interviewTip: 'The key insight is that accessibility belongs in the component library, not in the consuming application. If the building blocks are accessible, the application inherits it.',
            followUp: ['How do you handle teams that override component styles and break accessibility?', 'How do you track accessibility compliance across teams?'],
            seniorPerspective: 'TypeScript can enforce accessibility at compile time. Require aria-label props on icon buttons, require alt on images. Shift accessibility left into the type system.',
            architectPerspective: 'A well-built component library is the single most effective accessibility investment. It amortizes the cost of getting complex patterns right across every application that uses it.'
        },
        {
            question: 'Design an accessible tabs component from scratch. What ARIA patterns and keyboard interactions are required?',
            difficulty: 'expert',
            answer: `<p><strong>ARIA Tabs pattern:</strong></p>
<pre><code>&lt;div class="tabs"&gt;
  &lt;div role="tablist" aria-label="Product information"&gt;
    &lt;button 
      role="tab" 
      id="tab-1" 
      aria-selected="true" 
      aria-controls="panel-1"
      tabindex="0"
    &gt;Description&lt;/button&gt;
    &lt;button 
      role="tab" 
      id="tab-2" 
      aria-selected="false" 
      aria-controls="panel-2"
      tabindex="-1"
    &gt;Reviews&lt;/button&gt;
    &lt;button 
      role="tab" 
      id="tab-3" 
      aria-selected="false" 
      aria-controls="panel-3"
      tabindex="-1"
    &gt;Shipping&lt;/button&gt;
  &lt;/div&gt;
  
  &lt;div role="tabpanel" id="panel-1" aria-labelledby="tab-1" tabindex="0"&gt;
    &lt;p&gt;Product description content...&lt;/p&gt;
  &lt;/div&gt;
  &lt;div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden&gt;
    &lt;p&gt;Reviews content...&lt;/p&gt;
  &lt;/div&gt;
&lt;/div&gt;</code></pre>
<p><strong>Required keyboard interactions:</strong></p>
<ul>
<li><strong>Tab</strong> - Moves focus into the tablist (to the active tab), then to the tabpanel content</li>
<li><strong>Arrow Left/Right</strong> - Moves between tabs (wraps at ends)</li>
<li><strong>Home</strong> - First tab</li>
<li><strong>End</strong> - Last tab</li>
<li><strong>Enter/Space</strong> - Activate tab (if using manual activation mode)</li>
</ul>
<p><strong>Key design decisions:</strong></p>
<ul>
<li><strong>Automatic vs manual activation</strong> - Automatic: arrow keys immediately show panel. Manual: arrow keys move focus, Enter activates. Automatic is recommended unless panel loading is slow.</li>
<li><strong>Roving tabindex</strong> - Only active tab has tabindex="0". Others have tabindex="-1". This means Tab key skips inactive tabs (one Tab stop for the entire tablist).</li>
</ul>`,
            interviewTip: 'The roving tabindex pattern is the key insight. Inactive tabs are not in the Tab order. Arrow keys navigate within the tablist. This matches how radio buttons work natively.',
            followUp: ['What is roving tabindex and why is it used here?', 'How does this pattern change for vertical tabs?'],
            seniorPerspective: 'Follow the WAI-ARIA Authoring Practices (APG) exactly for complex widgets. Do not invent custom interactions - users with assistive technology expect standard patterns.',
            architectPerspective: 'Complex ARIA patterns (tabs, trees, grids) should be implemented once in a component library with extensive testing. Application developers should never need to write these patterns from scratch.'
        }
    ]
});
