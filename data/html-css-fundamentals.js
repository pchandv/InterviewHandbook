'use strict';

PageData.register('html-css-fundamentals', {
    title: 'HTML, CSS & Responsive Design',
    description: 'Semantic HTML5, flexbox vs grid, responsive patterns, CSS architecture, and modern layout techniques',
    sections: [
        {
            title: 'Semantic HTML5',
            content: `<p>Semantic HTML uses elements that convey meaning about the content structure, improving accessibility, SEO, and maintainability.</p>
<ul>
<li><strong>&lt;header&gt;</strong> - Introductory content or navigation for a section</li>
<li><strong>&lt;nav&gt;</strong> - Navigation links</li>
<li><strong>&lt;main&gt;</strong> - Primary content (one per page)</li>
<li><strong>&lt;article&gt;</strong> - Self-contained content (could stand alone)</li>
<li><strong>&lt;section&gt;</strong> - Thematic grouping of content</li>
<li><strong>&lt;aside&gt;</strong> - Tangentially related content (sidebars)</li>
<li><strong>&lt;footer&gt;</strong> - Footer for nearest sectioning ancestor</li>
<li><strong>&lt;figure&gt; / &lt;figcaption&gt;</strong> - Self-contained content with caption</li>
<li><strong>&lt;time&gt;</strong> - Machine-readable date/time</li>
<li><strong>&lt;mark&gt;</strong> - Highlighted/relevant text</li>
</ul>
<p><strong>Why it matters:</strong> Screen readers use semantic structure for navigation. Search engines weight semantic elements for relevance. Developers understand document structure at a glance.</p>`
        },
        {
            title: 'Document Structure',
            code: `<!-- Semantic document outline -->
<body>
  <header>
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/products">Products</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <article>
      <header>
        <h1>Article Title</h1>
        <time datetime="2024-01-15">January 15, 2024</time>
      </header>
      
      <section>
        <h2>Introduction</h2>
        <p>Content here...</p>
      </section>
      
      <section>
        <h2>Details</h2>
        <figure>
          <img src="chart.png" alt="Sales growth chart showing 40% increase">
          <figcaption>Figure 1: Quarterly sales growth</figcaption>
        </figure>
      </section>
    </article>
    
    <aside aria-label="Related articles">
      <h2>Related</h2>
      <ul>
        <li><a href="/related-1">Related Article 1</a></li>
      </ul>
    </aside>
  </main>

  <footer>
    <p>&copy; 2024 Company Name</p>
  </footer>
</body>`,
            language: 'html'
        },
        {
            title: 'Flexbox vs Grid Decision',
            mermaid: `graph TD
    A[Layout Decision] -->|One-dimensional| B[Flexbox]
    A -->|Two-dimensional| C[CSS Grid]
    
    B --> B1[Row OR column at a time]
    B --> B2[Content-driven sizing]
    B --> B3[Alignment and distribution]
    B --> B4["Use for: navbars, card rows, centering, toolbars"]
    
    C --> C1[Rows AND columns simultaneously]
    C --> C2[Layout-driven sizing]
    C --> C3[Precise placement control]
    C --> C4["Use for: page layouts, dashboards, image galleries"]
    
    D[Both together] --> E[Grid for page structure]
    D --> F[Flex for component internals]`,
            content: `<p><strong>Flexbox</strong> is content-first: items determine how space is distributed. <strong>Grid</strong> is layout-first: you define the grid then place items into it.</p>
<p>In practice, use Grid for the overall page layout (header, sidebar, content, footer) and Flexbox for component internals (aligning items in a navbar, distributing card content).</p>`
        },
        {
            title: 'Flexbox Patterns',
            code: `/* Centering - the classic flexbox use case */
.center-both {
  display: flex;
  justify-content: center;  /* main axis */
  align-items: center;      /* cross axis */
  min-height: 100vh;
}

/* Navigation bar - space between */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}

/* Card layout - equal height cards */
.card-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.card {
  flex: 1 1 300px; /* grow, shrink, min-width basis */
  display: flex;
  flex-direction: column;
}
.card-body { flex: 1; } /* pushes footer down */
.card-footer { margin-top: auto; }

/* Holy grail layout with flexbox */
.holy-grail {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.holy-grail main { flex: 1; }
.holy-grail .content-area {
  display: flex;
}
.holy-grail .sidebar { flex: 0 0 250px; }
.holy-grail .main-content { flex: 1; }`,
            language: 'css'
        },
        {
            title: 'CSS Grid Patterns',
            code: `/* Basic grid layout */
.page-layout {
  display: grid;
  grid-template-columns: 250px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  min-height: 100vh;
  gap: 1rem;
}
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.aside   { grid-area: aside; }
.footer  { grid-area: footer; }

/* Responsive grid - no media queries needed */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

/* Dashboard grid with spanning */
.dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 200px);
  gap: 1rem;
}
.widget-large { grid-column: span 2; grid-row: span 2; }
.widget-wide  { grid-column: span 2; }
.widget-tall  { grid-row: span 2; }

/* Subgrid - inherit parent grid tracks */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.card {
  display: grid;
  grid-template-rows: subgrid; /* align internal rows across cards */
  grid-row: span 3;
}`,
            language: 'css'
        },
        {
            title: 'Responsive Design',
            code: `/* Mobile-first approach - base styles for mobile, enhance for larger */
.container {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Progressively enhance for tablets and desktop */
@media (min-width: 768px) {
  .container { padding: 2rem; }
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}

/* Container queries - responsive to parent, not viewport */
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card { flex-direction: row; }
  .card-image { width: 40%; }
}

@container card (min-width: 700px) {
  .card { gap: 2rem; }
  .card-image { width: 30%; }
}

/* Fluid typography - scales smoothly between breakpoints */
h1 {
  font-size: clamp(1.5rem, 4vw + 1rem, 3.5rem);
}

/* Responsive images */
img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Modern aspect ratio */
.video-wrapper {
  aspect-ratio: 16 / 9;
  width: 100%;
}`,
            language: 'css'
        },
        {
            title: 'CSS Custom Properties and Architecture',
            code: `/* Design tokens as CSS custom properties */
:root {
  /* Colors */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-surface: #ffffff;
  --color-border: #e5e7eb;
  
  /* Spacing scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  
  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
}

/* Dark mode with custom properties */
@media (prefers-color-scheme: dark) {
  :root {
    --color-text: #f9fafb;
    --color-surface: #111827;
    --color-border: #374151;
  }
}

/* Component using tokens */
.button {
  background: var(--color-primary);
  color: white;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  border: none;
  cursor: pointer;
  transition: background 150ms ease;
}
.button:hover { background: var(--color-primary-hover); }`,
            language: 'css'
        },
        {
            title: 'CSS Specificity and Cascade',
            mermaid: `graph TD
    A[CSS Cascade Order - highest to lowest priority] --> B["1. !important declarations"]
    B --> C["2. Inline styles (style attr)"]
    C --> D["3. ID selectors (#id) - specificity 1,0,0"]
    D --> E["4. Class, attribute, pseudo-class (.class, [attr], :hover) - 0,1,0"]
    E --> F["5. Element, pseudo-element (div, ::before) - 0,0,1"]
    F --> G["6. Universal (*) and combinators - 0,0,0"]
    
    H[Same specificity?] --> I[Later declaration wins]
    
    J[Modern: @layer] --> K["Layers have lower priority than unlayered styles"]
    K --> L["@layer reset, base, components, utilities"]`,
            content: `<p>Understanding specificity prevents reliance on !important and overly complex selectors. Modern CSS uses <code>@layer</code> to create explicit cascade layers, giving architects control over which styles take precedence without specificity wars.</p>`
        },
        {
            title: 'BEM Methodology',
            code: `/* BEM: Block__Element--Modifier */

/* Block: standalone component */
.card { }

/* Element: part of a block (double underscore) */
.card__header { }
.card__body { }
.card__footer { }
.card__title { }

/* Modifier: variation of block or element (double hyphen) */
.card--featured { border-color: gold; }
.card--compact { padding: 0.5rem; }
.card__title--large { font-size: 1.5rem; }

/* Real example */
.search-form { }
.search-form__input { }
.search-form__button { }
.search-form__button--disabled { opacity: 0.5; }

/* BEM avoids nesting - flat selectors = low specificity */
/* BAD: .card .header .title { } - hard to override */
/* GOOD: .card__title { } - single class, predictable */

/* Modern alternative: CSS Modules (scoped by default) */
/* .title { } compiles to .card_title_x7f2a { } */`,
            language: 'css'
        }
    ],
    questions: [
        {
            question: 'When would you use Flexbox vs CSS Grid? Can they be combined?',
            difficulty: 'easy',
            answer: `<p><strong>Use Flexbox when:</strong></p>
<ul>
<li>Laying out items in a single direction (row OR column)</li>
<li>Content should determine sizing (items grow/shrink based on content)</li>
<li>Centering and alignment are the primary concerns</li>
<li>Component internals: navbars, button groups, card contents</li>
</ul>
<p><strong>Use CSS Grid when:</strong></p>
<ul>
<li>Two-dimensional layout needed (rows AND columns)</li>
<li>You want to define the layout first and place items into it</li>
<li>Complex layouts with spanning, overlapping, or named areas</li>
<li>Page-level structure: sidebars, dashboards, galleries</li>
</ul>
<p><strong>Combining them:</strong></p>
<ul>
<li>Grid for the overall page layout (macro)</li>
<li>Flex inside grid cells for component alignment (micro)</li>
<li>Example: Grid defines the page columns; Flexbox aligns items within the header</li>
</ul>
<p><strong>Quick rule:</strong> If you need <code>flex-wrap</code> with equal-sized items, Grid (<code>auto-fit/minmax</code>) is probably cleaner.</p>`,
            interviewTip: 'The one-dimensional vs two-dimensional distinction is the key answer. Follow up with "but in practice, I use both together - Grid for layout, Flex for alignment."',
            followUp: ['What is the auto-fit vs auto-fill difference in Grid?', 'How does subgrid work?'],
            seniorPerspective: 'Modern layouts rarely need one or the other exclusively. The skill is knowing which tool fits each part of the layout. Overusing one leads to hacks.',
            architectPerspective: 'Establish team conventions: Grid for page/section layouts, Flex for component internals. This creates predictable, maintainable CSS across a large codebase.'
        },
        {
            question: 'Explain the CSS specificity calculation. How do you avoid specificity wars?',
            difficulty: 'medium',
            answer: `<p><strong>Specificity is calculated as a tuple (a, b, c):</strong></p>
<ul>
<li><strong>a</strong> = number of ID selectors</li>
<li><strong>b</strong> = number of class selectors, attribute selectors, pseudo-classes</li>
<li><strong>c</strong> = number of element selectors, pseudo-elements</li>
</ul>
<pre><code>/* Examples */
p { }                    /* 0,0,1 */
.card { }               /* 0,1,0 */
#main { }               /* 1,0,0 */
p.card { }              /* 0,1,1 */
#main .card p { }       /* 1,1,1 */
.card .card__title { }  /* 0,2,0 */</code></pre>
<p><strong>Avoiding specificity wars:</strong></p>
<ul>
<li>Use single-class selectors (BEM methodology) - flat specificity</li>
<li>Avoid IDs in CSS (reserve for JS hooks and anchor links)</li>
<li>Never use !important except for utility overrides</li>
<li>Use CSS Layers (<code>@layer</code>) to control cascade explicitly</li>
<li>Use CSS Modules or Tailwind to eliminate global scope conflicts</li>
</ul>
<p><strong>CSS Layers (modern):</strong></p>
<pre><code>@layer base, components, utilities;
@layer base { a { color: blue; } }
@layer utilities { .text-red { color: red; } } /* always wins over base */</code></pre>`,
            interviewTip: 'Calculate specificity for a few examples to demonstrate understanding. Then pivot to prevention strategies (BEM, layers) to show you solve the problem architecturally.',
            followUp: ['How do :is() and :where() affect specificity?', 'What is @layer and how does it change the cascade?'],
            seniorPerspective: 'Specificity problems are architecture problems. If you need !important, your selector strategy is broken. Fix the architecture (adopt BEM, modules, or utilities) rather than fighting specificity.',
            architectPerspective: 'CSS Layers (@layer) are transformative for large projects. Define explicit layers (reset, base, components, utilities) and eliminate specificity conflicts by design rather than by convention.'
        },
        {
            question: 'What is mobile-first design and how does it differ from desktop-first?',
            difficulty: 'easy',
            answer: `<p><strong>Mobile-first:</strong> Base styles target the smallest screen. Media queries add complexity for larger screens using <code>min-width</code>.</p>
<p><strong>Desktop-first:</strong> Base styles target desktop. Media queries constrain for smaller screens using <code>max-width</code>.</p>
<p><strong>Why mobile-first is preferred:</strong></p>
<ul>
<li><strong>Progressive enhancement</strong> - Start simple, add features as viewport allows</li>
<li><strong>Performance</strong> - Mobile devices download only the CSS they need; larger-screen styles are behind media queries</li>
<li><strong>Forces prioritization</strong> - Designing for mobile first means identifying core content and interactions</li>
<li><strong>Easier to add than remove</strong> - Adding a sidebar at 1024px is simpler than hiding one at 768px</li>
</ul>
<pre><code>/* Mobile-first */
.sidebar { display: none; }
@media (min-width: 768px) { .sidebar { display: block; } }

/* Desktop-first (harder to maintain) */
.sidebar { display: block; }
@media (max-width: 767px) { .sidebar { display: none; } }</code></pre>
<p><strong>Modern approaches:</strong> Container queries let components respond to their container size, making responsive design truly component-based rather than viewport-based.</p>`,
            interviewTip: 'Focus on the WHY, not just the how. Performance (fewer bytes on mobile), forcing content prioritization, and progressive enhancement are the key reasons.',
            followUp: ['What are container queries and how do they change responsive design?', 'How does prefers-reduced-motion relate to mobile-first?'],
            seniorPerspective: 'Mobile-first is about design philosophy, not just CSS syntax. It forces product decisions about what matters on constrained devices. The CSS follows the design decision.',
            architectPerspective: 'Container queries fundamentally shift responsive design from global (viewport) to local (component). This enables truly reusable components that adapt to their container regardless of page layout.'
        },
        {
            question: 'Explain CSS custom properties. How do they differ from preprocessor variables?',
            difficulty: 'medium',
            answer: `<p><strong>CSS Custom Properties (--var):</strong></p>
<ul>
<li>Live in the DOM - cascade, inherit, can be changed at runtime</li>
<li>Scoped to elements - can be overridden for specific subtrees</li>
<li>Accessible via JavaScript: <code>element.style.setProperty('--color', 'red')</code></li>
<li>Support fallback values: <code>var(--color, blue)</code></li>
</ul>
<p><strong>Preprocessor Variables (Sass $var):</strong></p>
<ul>
<li>Compile-time only - replaced with values during build</li>
<li>No runtime changes possible</li>
<li>Lexically scoped to the file/block</li>
<li>More features: math, maps, lists, control flow</li>
</ul>
<p><strong>Key difference:</strong> Custom properties are reactive. Changing <code>--primary-color</code> on <code>:root</code> updates every element using it. Sass variables are static after compilation.</p>
<pre><code>/* Theming with custom properties - runtime switchable */
:root { --bg: white; --text: black; }
[data-theme="dark"] { --bg: #111; --text: #eee; }

/* Component inherits from nearest ancestor */
.card { --card-padding: 1rem; }
.card--compact { --card-padding: 0.5rem; }
.card__body { padding: var(--card-padding); } /* inherits */</code></pre>`,
            interviewTip: 'Emphasize the runtime reactivity. This is what makes custom properties powerful for theming, dark mode, and responsive adjustments.',
            followUp: ['How do you animate custom properties?', 'What is @property and how does it enable transitions on custom properties?'],
            seniorPerspective: 'Use custom properties for design tokens (colors, spacing, typography). Use Sass for build-time logic (mixins, loops, conditionals). They complement each other.',
            architectPerspective: 'Custom properties enable multi-theme and white-label systems without rebuilding CSS. A single CSS bundle supports any number of themes by swapping property values.'
        },
        {
            question: 'Compare CSS-in-JS, utility-first (Tailwind), and traditional CSS methodologies for large projects.',
            difficulty: 'hard',
            answer: `<p><strong>CSS-in-JS (styled-components, Emotion):</strong></p>
<ul>
<li>Pros: Scoped by default, dynamic styles with JS logic, co-located with components, dead code elimination</li>
<li>Cons: Runtime cost (generating styles), bundle size, SSR complexity, JS dependency</li>
<li>Best for: Component libraries, highly dynamic UIs, React ecosystems</li>
</ul>
<p><strong>Utility-first (Tailwind CSS):</strong></p>
<ul>
<li>Pros: No naming decisions, tiny production CSS (purged), consistent design system, fast prototyping</li>
<li>Cons: Verbose templates, learning curve, less readable HTML, custom designs need config</li>
<li>Best for: Marketing sites, rapid development, teams wanting enforced consistency</li>
</ul>
<p><strong>Traditional (BEM, ITCSS, SMACSS):</strong></p>
<ul>
<li>Pros: No tooling dependency, full CSS control, works with any framework, cacheable</li>
<li>Cons: Naming fatigue, global scope (requires discipline), dead CSS accumulates</li>
<li>Best for: Long-lived projects, teams experienced with CSS, framework-agnostic codebases</li>
</ul>
<p><strong>Modern hybrid:</strong> CSS Modules (scoped traditional CSS with zero runtime) is gaining ground as a middle path - write normal CSS, get automatic scoping.</p>`,
            interviewTip: 'Avoid strong opinions. Show you can evaluate tradeoffs for a given context. The right choice depends on team, project type, and performance requirements.',
            followUp: ['What is the runtime performance cost of CSS-in-JS?', 'How do CSS Modules work?'],
            seniorPerspective: 'The trend is moving away from runtime CSS-in-JS toward zero-runtime solutions (CSS Modules, Tailwind, vanilla-extract). Runtime style generation adds unnecessary latency.',
            architectPerspective: 'For a large organization, pick one approach and standardize. The consistency benefit of everyone using the same system outweighs marginal differences between approaches.'
        },
        {
            question: 'How do CSS animations and transitions differ? When would you use each?',
            difficulty: 'medium',
            answer: `<p><strong>Transitions:</strong> Animate between two states triggered by a state change (hover, focus, class toggle).</p>
<p><strong>Animations (@keyframes):</strong> Define multi-step animations that can run independently, loop, and have complex timing.</p>
<pre><code>/* Transition - simple A to B on state change */
.button {
  background: blue;
  transform: scale(1);
  transition: transform 200ms ease, background 300ms ease;
}
.button:hover {
  background: darkblue;
  transform: scale(1.05);
}

/* Animation - multi-step, auto-running */
@keyframes fadeSlideIn {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
.card { animation: fadeSlideIn 0.3s ease-out forwards; }

/* Infinite animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loader { animation: spin 1s linear infinite; }</code></pre>
<p><strong>Use transitions for:</strong> Hover effects, focus states, element entering/exiting, smooth state changes.</p>
<p><strong>Use animations for:</strong> Loading indicators, attention-grabbing effects, multi-step sequences, elements appearing on scroll.</p>
<p><strong>Performance:</strong> Animate only <code>transform</code> and <code>opacity</code> for 60fps. These use GPU compositing. Animating width, height, margin triggers expensive layout recalculation.</p>`,
            interviewTip: 'Mention the performance aspect - only transform and opacity are cheap to animate. This shows you understand the rendering pipeline.',
            followUp: ['What properties trigger layout vs paint vs composite?', 'How does will-change work?'],
            seniorPerspective: 'Respect prefers-reduced-motion. Some users have vestibular disorders. Provide reduced or no animation for users who request it.',
            architectPerspective: 'Define animation durations and easings as design tokens. Consistent motion language across an application feels polished. Inconsistent animations feel broken.'
        },
        {
            question: 'What are container queries and how do they change responsive design?',
            difficulty: 'hard',
            answer: `<p><strong>Container queries</strong> let elements respond to the size of their container rather than the viewport. This enables truly reusable components.</p>
<pre><code>/* Define a containment context */
.card-wrapper {
  container-type: inline-size;
  container-name: card-container;
}

/* Component responds to its container's width */
@container card-container (min-width: 500px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
  }
}

@container card-container (min-width: 800px) {
  .card {
    grid-template-columns: 300px 1fr 200px;
  }
}</code></pre>
<p><strong>Why this is transformative:</strong></p>
<ul>
<li>Components are self-contained - same card component works in a sidebar (narrow) and main content (wide)</li>
<li>No more "this component breaks at 768px because it is in a sidebar now"</li>
<li>Enables true component-driven development without viewport awareness</li>
<li>Works with any CSS framework or methodology</li>
</ul>
<p><strong>Container query units:</strong> <code>cqw</code> (container query width), <code>cqh</code> (height) enable fluid sizing relative to the container.</p>`,
            interviewTip: 'This is a modern CSS feature that many interviewers are learning about. Demonstrating knowledge here shows you stay current. Explain the problem it solves (reusable components in different layouts).',
            followUp: ['What is container-type: inline-size vs size?', 'How does containment affect layout performance?'],
            seniorPerspective: 'Container queries mark the shift from page-responsive to component-responsive design. This aligns CSS with component-based architectures (React, Angular, Vue).',
            architectPerspective: 'Container queries enable design systems to ship truly portable components. A component adapts to wherever it is placed without the consuming application writing responsive overrides.'
        },
        {
            question: 'How would you architect CSS for a large-scale application with 50+ developers?',
            difficulty: 'advanced',
            answer: `<p><strong>Architecture requirements:</strong> Scalable, maintainable, performant, consistent, and hard to break.</p>
<p><strong>Recommended approach:</strong></p>
<ol>
<li><strong>Design tokens</strong> - Single source of truth for colors, spacing, typography (CSS custom properties or JSON → CSS generation)</li>
<li><strong>Component scoping</strong> - CSS Modules, Tailwind, or Shadow DOM to prevent leaks</li>
<li><strong>Layered architecture</strong> - Using <code>@layer</code>: reset → base → components → utilities</li>
<li><strong>Component library</strong> - Shared UI kit (Storybook) with documented patterns</li>
<li><strong>Linting</strong> - Stylelint with custom rules (no !important, max specificity, naming conventions)</li>
</ol>
<p><strong>Practical strategies:</strong></p>
<ul>
<li><strong>Token-driven</strong> - All values reference tokens. No magic numbers in component CSS.</li>
<li><strong>Composition over inheritance</strong> - Small utility classes composed together, not deep inheritance chains.</li>
<li><strong>Documentation</strong> - Living style guide (Storybook) that shows every component variation.</li>
<li><strong>Code review standards</strong> - CSS review checklist (no global selectors, uses tokens, accessible).</li>
<li><strong>Performance budget</strong> - Monitor CSS bundle size. Alert on regression.</li>
</ul>
<p><strong>Testing:</strong> Visual regression testing (Chromatic, Percy) catches unintended style changes across the application.</p>`,
            interviewTip: 'This is a leadership question. Show you think about developer experience, consistency enforcement, and scalability - not just CSS techniques.',
            followUp: ['How do you enforce CSS standards in CI?', 'How do you handle CSS performance at scale?'],
            seniorPerspective: 'CSS architecture decisions should be made once and enforced automatically (linting, code review templates). The worst outcome is 50 developers each using different approaches in the same codebase.',
            architectPerspective: 'Invest in a design system team that owns tokens, components, and documentation. Individual feature teams consume the system. This prevents divergence and ensures accessibility compliance at the component level.'
        },
        {
            question: 'Explain the box model. What is the difference between content-box and border-box?',
            difficulty: 'easy',
            answer: `<p>The CSS box model defines how element dimensions are calculated: content + padding + border + margin.</p>
<p><strong>content-box (default):</strong></p>
<ul>
<li><code>width</code> and <code>height</code> set the content area only</li>
<li>Padding and border are added on top: total width = width + padding + border</li>
<li>Confusing: <code>width: 300px</code> with <code>padding: 20px</code> = 340px total</li>
</ul>
<p><strong>border-box (recommended):</strong></p>
<ul>
<li><code>width</code> and <code>height</code> include padding and border</li>
<li>Content area shrinks to fit: total width = width (exactly as specified)</li>
<li>Intuitive: <code>width: 300px</code> is always 300px regardless of padding/border</li>
</ul>
<pre><code>/* Always use border-box globally */
*, *::before, *::after {
  box-sizing: border-box;
}

/* Why it matters */
.column {
  width: 50%;
  padding: 1rem;
  border: 1px solid gray;
  /* content-box: overflows parent (50% + padding + border > 50%) */
  /* border-box: fits perfectly (50% total including padding and border) */
}</code></pre>
<p>Every modern CSS reset includes <code>box-sizing: border-box</code> globally. Without it, layouts with percentage widths and padding break.</p>`,
            interviewTip: 'Explain why border-box is universally preferred. The practical impact on percentage-based layouts and grid/flexbox sizing is the key point.',
            followUp: ['Does margin collapse and how?', 'How does box-sizing affect flexbox and grid?'],
            seniorPerspective: 'The universal border-box reset is non-negotiable. Include it in your CSS reset/normalize. Any project without it will have constant layout bugs.',
            architectPerspective: 'CSS resets and normalization are the foundation of your CSS architecture. Choose a minimal reset (modern-normalize) and ensure it is the first thing loaded.'
        },
        {
            question: 'How do you handle responsive images and media for performance?',
            difficulty: 'medium',
            answer: `<p>Responsive images serve appropriately sized files based on viewport, pixel density, and container size.</p>
<pre><code>&lt;!-- srcset with width descriptors - browser picks best size --&gt;
&lt;img 
  srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 600px"
  src="image-800.jpg"
  alt="Product photo"
  loading="lazy"
  decoding="async"
&gt;

&lt;!-- Picture element for art direction --&gt;
&lt;picture&gt;
  &lt;source media="(min-width: 1024px)" srcset="hero-wide.webp" type="image/webp"&gt;
  &lt;source media="(min-width: 768px)" srcset="hero-medium.webp" type="image/webp"&gt;
  &lt;source srcset="hero-mobile.webp" type="image/webp"&gt;
  &lt;img src="hero-fallback.jpg" alt="Hero banner"&gt;
&lt;/picture&gt;</code></pre>
<p><strong>Performance techniques:</strong></p>
<ul>
<li><code>loading="lazy"</code> - Native lazy loading for below-fold images</li>
<li><code>decoding="async"</code> - Non-blocking image decode</li>
<li><code>fetchpriority="high"</code> - Prioritize LCP (Largest Contentful Paint) image</li>
<li>WebP/AVIF format - 25-50% smaller than JPEG at same quality</li>
<li><code>aspect-ratio</code> on CSS - Prevents layout shift (CLS) during load</li>
</ul>`,
            interviewTip: 'Connect responsive images to Core Web Vitals (LCP, CLS). Show you understand how image loading affects user experience metrics.',
            followUp: ['What is the difference between srcset and picture?', 'How does lazy loading interact with LCP?'],
            seniorPerspective: 'Images are typically the largest page weight. Automated image optimization (CDN transforms, build-time compression, format selection) is more reliable than manual per-image configuration.',
            architectPerspective: 'Use an image CDN (Cloudinary, imgix, Cloudflare Images) that handles format negotiation, resizing, and caching. Developers provide the source image; the CDN handles responsive delivery.'
        }
    ]
});
