/* ═══════════════════════════════════════════════════════════════════
   FRONTEND PERFORMANCE — Level 11: Performance (Advanced Performance)
   Core Web Vitals, critical rendering path, code splitting, lazy
   loading, caching, images, and SSR/hydration.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('frontend-perf', {

    title: 'Frontend Performance',
    level: 11,
    group: 'performance-advanced',
    description: 'Web performance: Core Web Vitals (LCP/INP/CLS), the critical rendering path, code splitting, lazy loading, caching, image optimization, and SSR/hydration trade-offs.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['networking-basics'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Frontend performance</strong> directly shapes user experience, conversion, and SEO. Users
            abandon slow pages; search engines rank fast ones higher. Performance is measured from the user's
            perspective — how fast the page becomes visible, interactive, and stable.</p>
            <p>Google's <strong>Core Web Vitals</strong> formalize this into measurable metrics that affect search
            ranking. This module covers what they are and the techniques to improve them.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>Core Web Vitals: LCP, INP, CLS</li>
                <li>The critical rendering path</li>
                <li>Code splitting and lazy loading</li>
                <li>Caching, CDNs, and compression</li>
                <li>Image and asset optimization</li>
                <li>SSR, SSG, and hydration trade-offs</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Core Web Vitals</h4>
            <ul>
                <li><strong>LCP (Largest Contentful Paint):</strong> time to render the largest visible element —
                measures loading. Target &lt; 2.5s.</li>
                <li><strong>INP (Interaction to Next Paint):</strong> responsiveness to user input — measures
                interactivity. Target &lt; 200ms. (Replaced FID in 2024.)</li>
                <li><strong>CLS (Cumulative Layout Shift):</strong> visual stability — how much content jumps around.
                Target &lt; 0.1.</li>
            </ul>
            <h4>Critical Rendering Path</h4>
            <p>The sequence the browser follows to turn HTML/CSS/JS into pixels. Render-blocking resources (CSS, sync
            JS) delay first paint. Minimizing and prioritizing them speeds perceived load.</p>
            <h4>Bundle Size &amp; Code Splitting</h4>
            <p>Large JS bundles delay interactivity (parse/execute cost). Code splitting ships only what a route/view
            needs, loading the rest on demand.</p>
            <h4>Caching &amp; CDN</h4>
            <p>Browser cache and CDN edge caching serve assets without round trips to the origin, cutting latency.</p>
            <h4>Rendering Strategies</h4>
            <p>CSR (client renders), SSR (server renders HTML), SSG (pre-rendered at build), and hydration (attaching
            JS to server HTML) trade off first paint, interactivity, and server cost.</p>`,
            mermaid: `graph LR
    HTML[HTML] --> DOM[DOM]
    CSS[CSS] --> CSSOM[CSSOM]
    DOM --> Render[Render Tree]
    CSSOM --> Render
    Render --> Layout[Layout] --> Paint[Paint] --> Composite[Composite]
    JS[Render-blocking JS] -.delays.-> DOM`
        },
        {
            title: 'How It Works',
            content: `<p>Improving frontend performance means optimizing what loads, when, and how stable it is:</p>
            <ol>
                <li><strong>Measure:</strong> Lighthouse / PageSpeed / field data (CrUX) for LCP, INP, CLS</li>
                <li><strong>Reduce bytes:</strong> minify, compress (gzip/brotli), tree-shake, split bundles</li>
                <li><strong>Prioritize critical content:</strong> inline critical CSS, defer non-critical JS,
                preload key assets</li>
                <li><strong>Load less, later:</strong> lazy-load images and below-the-fold components/routes</li>
                <li><strong>Serve from the edge:</strong> CDN + cache headers to cut round trips</li>
                <li><strong>Stabilize layout:</strong> reserve space for images/ads to avoid CLS</li>
            </ol>`,
            code: `<!-- Prioritize the critical path -->
<link rel="preload" href="/hero.webp" as="image">   <!-- preload LCP image -->
<link rel="stylesheet" href="/critical.css">         <!-- critical CSS -->
<script src="/app.js" defer></script>                <!-- defer non-critical JS -->

<!-- Prevent CLS: reserve space with explicit dimensions -->
<img src="/banner.webp" width="1200" height="400" alt="..."
     loading="lazy" decoding="async">                <!-- lazy-load offscreen images -->

<!-- Responsive images: serve right size per device -->
<img srcset="/img-400.webp 400w, /img-800.webp 800w, /img-1200.webp 1200w"
     sizes="(max-width: 600px) 400px, 800px" src="/img-800.webp" alt="...">`,
            language: 'html'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Rendering strategies on the first-paint vs interactivity spectrum:</p>`,
            mermaid: `graph TB
    SSG[SSG: pre-rendered at build<br/>fastest paint, static] --> Hybrid
    SSR[SSR: rendered per request<br/>fast paint, dynamic] --> Hydrate[Hydration: attach JS]
    CSR[CSR: blank then JS renders<br/>slow paint, simple infra] --> Interactive
    Hydrate --> Interactive[Interactive]
    style SSG fill:#bbf7d0,color:#1e293b
    style SSR fill:#fde68a,color:#1e293b
    style CSR fill:#fecaca,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Code splitting, lazy loading, and caching in practice:</p>`,
            tabs: [
                {
                    label: 'Code Splitting',
                    code: `// Route-level code splitting (lazy load a chunk on navigation)
// React
const Admin = React.lazy(() => import('./Admin'));
// <Suspense fallback={<Spinner/>}><Admin/></Suspense>

// Angular
// { path: 'admin', loadComponent: () => import('./admin').then(m => m.AdminComponent) }

// Dynamic import for a heavy library used only on demand
async function exportPdf(data) {
  const { generatePdf } = await import('./heavy-pdf-lib');  // not in initial bundle
  return generatePdf(data);
}`,
                    language: 'typescript'
                },
                {
                    label: 'Caching Headers',
                    code: `# Long-cache fingerprinted static assets (filename changes on content change)
# app.4f3a2b.js  ->  safe to cache for a year
Cache-Control: public, max-age=31536000, immutable

# HTML should revalidate so users get new asset references promptly
Cache-Control: no-cache            # or short max-age + must-revalidate

# CDN sits in front, serving cached assets from edge nodes near the user.
# Use a CDN + Brotli/gzip compression for text assets (JS/CSS/HTML).`,
                    language: 'bash'
                },
                {
                    label: 'Measuring (Web Vitals)',
                    code: `// Measure real-user Core Web Vitals in the field
import { onLCP, onINP, onCLS } from 'web-vitals';

function report(metric) {
  // send to your analytics/RUM endpoint
  navigator.sendBeacon('/vitals', JSON.stringify(metric));
}
onLCP(report);   // loading
onINP(report);   // interactivity
onCLS(report);   // visual stability

// Lab tools (Lighthouse) catch regressions in CI;
// field data (RUM / CrUX) reflects real users on real networks/devices.`,
                    language: 'typescript'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Optimize for Core Web Vitals</h4>
            <p>Target LCP &lt; 2.5s, INP &lt; 200ms, CLS &lt; 0.1. They reflect real UX and affect SEO ranking.</p>
            <h4>Do: Ship Less JavaScript</h4>
            <p>JS is the most expensive resource (download + parse + execute). Code-split, tree-shake, and lazy-load.
            The fastest code is the code you don't ship.</p>
            <h4>Do: Optimize Images</h4>
            <p>Images are usually the largest bytes. Use modern formats (WebP/AVIF), responsive srcset, correct
            dimensions, and lazy-load offscreen images. Often the biggest single win.</p>
            <h4>Do: Use a CDN and Long-Cache Static Assets</h4>
            <p>Serve fingerprinted assets from the edge with immutable long-cache headers; revalidate HTML.</p>
            <h4>Do: Prevent Layout Shift</h4>
            <p>Reserve space for images, ads, and dynamic content (width/height, aspect-ratio) so content doesn't jump.</p>
            <h4>Do: Measure Field Data, Not Just Lab</h4>
            <p>Lighthouse is lab; real users on slow devices/networks differ. Use RUM/CrUX for ground truth.</p>`,
            callout: {
                type: 'tip',
                title: 'JavaScript Is the Bottleneck',
                text: 'A 1 MB image is "just" download time, but 1 MB of JavaScript must be downloaded, parsed, compiled, AND executed \u2014 far more expensive, especially on low-end mobile CPUs. Reducing JS payload is often the highest-impact frontend optimization.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Huge JavaScript Bundles</h4>
            <p>Shipping the entire app (and large libraries) up front delays interactivity. Split and lazy-load.</p>
            <h4>Mistake: Unoptimized Images</h4>
            <p>Serving full-resolution PNGs/JPEGs in oversized dimensions bloats LCP. Use WebP/AVIF, responsive sizes,
            and lazy loading.</p>
            <h4>Mistake: Layout Shift (Bad CLS)</h4>
            <p>Images/ads without reserved space, or fonts that swap and reflow, push content around and frustrate
            users. Reserve dimensions; use font-display strategies.</p>
            <h4>Mistake: Render-Blocking Resources</h4>
            <p>Large synchronous CSS/JS in the head blocks first paint. Inline critical CSS, defer/async non-critical
            scripts.</p>
            <h4>Mistake: Optimizing Lab, Ignoring Field</h4>
            <p>A perfect Lighthouse score on a fast machine can hide poor real-world performance on mobile. Trust RUM
            field data.</p>
            <h4>Mistake: No Caching / No CDN</h4>
            <p>Serving static assets from a single origin with no caching adds latency for every user worldwide.</p>`,
            code: `// MISTAKE: importing an entire library for one function (bloats bundle)
import _ from 'lodash';            // ~70KB+
const r = _.debounce(fn, 300);

// BETTER: import only what you use (tree-shakable) or write a tiny helper
import debounce from 'lodash-es/debounce';   // just debounce
// or a 6-line debounce of your own -> 0 dependency weight`,
            language: 'typescript'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>E-Commerce</h4>
            <p>Studies repeatedly show faster pages increase conversion and revenue; large retailers invest heavily in
            LCP and INP. Every 100ms can measurably affect sales.</p>
            <h4>Media &amp; Content</h4>
            <p>News and content sites use SSG/SSR + CDN for instant first paint and SEO, lazy-loading images and ads
            to keep initial load light.</p>
            <h4>Web Apps &amp; SaaS</h4>
            <p>Dashboards code-split by route and defer heavy widgets; they monitor INP to keep interactions snappy as
            features grow.</p>
            <h4>Global Audiences</h4>
            <p>CDNs serve assets from edge locations worldwide, and adaptive image/format delivery tailors payloads to
            device and network conditions.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Rendering strategies compared:</p>`,
            table: {
                headers: ['Strategy', 'First Paint', 'Interactivity', 'SEO', 'Server Cost', 'Best for'],
                rows: [
                    ['CSR', 'Slow (blank then JS)', 'After JS loads', 'Weaker', 'Low', 'Apps behind login'],
                    ['SSR', 'Fast (HTML from server)', 'After hydration', 'Strong', 'Higher (per request)', 'Dynamic, SEO-critical'],
                    ['SSG', 'Fastest (prebuilt)', 'After hydration', 'Strong', 'Lowest (static)', 'Mostly-static content'],
                    ['ISR/Hybrid', 'Fast', 'After hydration', 'Strong', 'Medium', 'Large mostly-static + some dynamic'],
                    ['Islands/Partial', 'Fast', 'Fast (minimal JS)', 'Strong', 'Medium', 'Content + isolated interactivity']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Where the time and bytes go, and the highest-impact levers:</p>
            <h4>Byte Budget</h4>
            <p>Set performance budgets (e.g., &lt; 170KB JS on initial load) and fail CI if exceeded. What you don't
            ship can't slow you down.</p>
            <h4>The Cost of JS vs Images</h4>
            <p>Images: download + decode. JS: download + parse + compile + execute — the CPU cost dominates on
            mobile. Prioritize cutting JS, then images.</p>
            <h4>Network Round Trips</h4>
            <p>Each request has latency; bundle/inline critical resources, use HTTP/2-3 multiplexing, preconnect to
            key origins, and serve from a CDN.</p>
            <h4>Perceived Performance</h4>
            <p>Skeletons, streaming SSR, and showing content progressively make a page <em>feel</em> faster even at
            the same total load time.</p>`,
            callout: {
                type: 'warning',
                title: 'Test on Real Mobile Devices',
                text: 'Low-end mobile CPUs parse and execute JavaScript several times slower than a developer laptop. A site that feels instant on your machine can be painfully slow for real users. Throttle CPU/network in DevTools and validate with field (RUM) data.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Make performance a CI gate, not an afterthought.</p>
            <h4>Lighthouse CI &amp; Budgets</h4>
            <p>Run Lighthouse in CI and fail the build if Core Web Vitals or bundle-size budgets regress.</p>
            <h4>Real-User Monitoring (RUM)</h4>
            <p>Collect field LCP/INP/CLS from real users (web-vitals + analytics) to catch regressions lab tests miss
            and to prioritize by real impact.</p>`,
            code: `# lighthouse-ci budget assertions (lighthouserc.json)
# {
#   "ci": {
#     "assert": {
#       "assertions": {
#         "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
#         "cumulative-layout-shift":  ["error", { "maxNumericValue": 0.1 }],
#         "total-byte-weight":        ["warn",  { "maxNumericValue": 1000000 }]
#       }
#     }
#   }
# }
# Run on every PR; block merges that regress vitals or bundle size.`,
            language: 'bash'
        },
        {
            title: 'Interview Tips',
            content: `<p>Frontend performance is key for senior web/UI roles:</p>
            <ul>
                <li><strong>Know Core Web Vitals</strong> (LCP, INP, CLS) and their targets</li>
                <li><strong>Explain why JS is the costliest resource</strong> (parse/execute on mobile)</li>
                <li><strong>Describe code splitting and lazy loading</strong></li>
                <li><strong>Compare CSR/SSR/SSG</strong> and when each fits</li>
                <li><strong>Stress measuring field data,</strong> not just Lighthouse lab scores</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Senior Signal',
                text: 'Distinguishing lab metrics (Lighthouse) from field metrics (real-user CrUX/RUM) and explaining that JS has CPU cost beyond download \u2014 not just bytes \u2014 signals you understand real-world performance on the devices users actually have.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Resources</h4>
            <ul>
                <li>web.dev (Core Web Vitals, performance guides) by Google</li>
                <li><em>High Performance Browser Networking</em> by Ilya Grigorik (free online)</li>
                <li>MDN Web Performance docs</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li>Lighthouse / PageSpeed Insights, WebPageTest</li>
                <li>web-vitals library, Chrome DevTools Performance panel</li>
                <li>Bundle analyzers (webpack-bundle-analyzer, source-map-explorer)</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Core Web Vitals:</strong> LCP &lt; 2.5s (loading), INP &lt; 200ms (interactivity), CLS &lt; 0.1 (stability)</li>
                <li><strong>JavaScript is the costliest resource</strong> (download + parse + compile + execute) — ship less</li>
                <li><strong>Code-split and lazy-load</strong> so the initial bundle is small</li>
                <li><strong>Optimize images</strong> (WebP/AVIF, responsive, lazy) — often the biggest single win</li>
                <li><strong>CDN + long-cache fingerprinted assets;</strong> revalidate HTML</li>
                <li><strong>Reserve space</strong> to prevent layout shift (CLS)</li>
                <li><strong>Measure field data (RUM), not just lab;</strong> test on real/throttled mobile</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Improve a Slow Landing Page</h4>
            <ol>
                <li>Audit a page with Lighthouse; record LCP, INP, CLS and total JS/image bytes</li>
                <li>Convert images to WebP/AVIF, add responsive srcset + width/height, lazy-load offscreen</li>
                <li>Code-split a heavy below-the-fold widget and defer non-critical scripts</li>
                <li>Add a CDN + long-cache headers for fingerprinted assets; enable Brotli</li>
                <li>Fix CLS by reserving space for the hero image and ad slot</li>
                <li>Re-audit and add a Lighthouse CI budget so regressions fail the build</li>
            </ol>`,
            code: `// Targets after optimization: LCP < 2.5s, CLS < 0.1, INP < 200ms
// 1. baseline Lighthouse run
// 2. <img srcset/sizes width height loading="lazy"> + WebP/AVIF
// 3. dynamic import() for heavy widget; <script defer>
// 4. CDN + Cache-Control: immutable for /static; brotli
// 5. reserve hero/ad dimensions (aspect-ratio)
// 6. lighthouserc.json budget in CI`,
            language: 'typescript'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What are the three Core Web Vitals and what does each measure?<br/>
                    <em>A: LCP (Largest Contentful Paint) = loading; INP (Interaction to Next Paint) = interactivity/
                    responsiveness; CLS (Cumulative Layout Shift) = visual stability.</em></li>
                <li><strong>Q:</strong> Why is JavaScript more expensive than an equivalent size of image?<br/>
                    <em>A: An image is downloaded and decoded; JavaScript must be downloaded, parsed, compiled, AND
                    executed. The CPU cost (especially on low-end mobile) makes JS far more expensive per byte.</em></li>
                <li><strong>Q:</strong> When would you choose SSG over SSR?<br/>
                    <em>A: For mostly-static content that doesn't need per-request data \u2014 SSG pre-renders at build time
                    for the fastest possible first paint and cheapest hosting. SSR suits dynamic, per-request content
                    that still needs fast paint and SEO.</em></li>
                <li><strong>Q:</strong> Why prefer field data over lab data?<br/>
                    <em>A: Lab tools (Lighthouse) run on controlled hardware/network and may not reflect real users on
                    slow devices/connections. Field data (RUM/CrUX) captures actual user experience, which is what
                    matters and what affects SEO.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'What are Core Web Vitals and why do they matter?',
            difficulty: 'easy',
            answer: `<p><strong>Core Web Vitals</strong> are Google's user-centric performance metrics:</p>
            <ul>
                <li><strong>LCP</strong> (Largest Contentful Paint) — loading; target &lt; 2.5s</li>
                <li><strong>INP</strong> (Interaction to Next Paint) — responsiveness; target &lt; 200ms</li>
                <li><strong>CLS</strong> (Cumulative Layout Shift) — visual stability; target &lt; 0.1</li>
            </ul>
            <p>They matter because they reflect real user experience and are a Google search ranking factor — poor
            vitals hurt both UX (abandonment) and SEO (visibility).</p>`,
            explanation: 'They answer three questions a real user feels: "Did the page show up quickly?" (LCP), "Did it respond when I clicked?" (INP), and "Did things stop jumping around?" (CLS).',
            bestPractices: ['Track all three with field data', 'Set budgets and gate in CI', 'Optimize the biggest contributor first'],
            commonMistakes: ['Optimizing only lab scores', 'Ignoring CLS until users complain'],
            interviewTip: 'Name all three with their targets and the metric each represents (loading/interactivity/stability) — precise recall signals you actually work with them.',
            followUp: ['What replaced FID and why?', 'Which techniques most improve LCP?']
        },
        {
            question: 'How does code splitting improve performance, and how do you decide what to split?',
            difficulty: 'medium',
            answer: `<p><strong>Code splitting</strong> breaks the JavaScript bundle into smaller chunks loaded on demand
            instead of one large file up front. This reduces the initial bundle the browser must download, parse, and
            execute before the page is interactive — improving INP/TTI.</p>
            <p>What to split:</p>
            <ul>
                <li><strong>By route:</strong> each page/route is its own chunk, loaded on navigation (biggest win)</li>
                <li><strong>Below-the-fold / heavy components:</strong> charts, editors, modals loaded when needed</li>
                <li><strong>Large libraries used rarely:</strong> dynamic import() only when the feature is used</li>
            </ul>
            <p>Don't over-split — too many tiny chunks add request overhead. Split along natural boundaries where
            code is genuinely deferred.</p>`,
            explanation: 'Instead of making every visitor download the entire store catalog before entering (huge initial bundle), code splitting hands them only the section they walked into and fetches other sections when they actually go there.',
            code: `const Reports = React.lazy(() => import('./Reports'));   // route chunk
async function openEditor() {
  const { Editor } = await import('./HeavyEditor');     // on-demand chunk
}`,
            language: 'typescript',
            bestPractices: ['Split by route first', 'Lazy-load heavy/below-the-fold components', 'Dynamic-import rarely-used large libs', 'Avoid over-splitting into tiny chunks'],
            commonMistakes: ['Shipping the whole app in one bundle', 'Splitting so granularly that request overhead dominates', 'Eagerly importing large libs for one function'],
            interviewTip: 'Tie it to the metric it helps (initial JS -> interactivity) and give the route-level split as the primary, highest-impact strategy.',
            followUp: ['How do you avoid a flash/spinner when a chunk loads?', 'What is tree shaking and how does it complement splitting?']
        },
        {
            question: 'A page has a slow LCP and janky interactions on mobile. How do you diagnose and fix it?',
            difficulty: 'hard',
            answer: `<p>Measure with both lab and field tools, then target the specific contributors:</p>
            <ol>
                <li><strong>Diagnose with field + lab:</strong> check CrUX/RUM for real mobile LCP and INP; run
                Lighthouse with mobile CPU/network throttling; use the Performance panel to find long tasks.</li>
                <li><strong>Fix LCP:</strong> identify the LCP element (usually the hero image or a large text block).
                Preload it, serve an optimized modern-format responsive image, remove render-blocking CSS/JS,
                consider SSR/SSG so HTML arrives fast.</li>
                <li><strong>Fix INP/jank:</strong> long JavaScript tasks block the main thread. Break them up (yield,
                <code>requestIdleCallback</code>, web workers), reduce/ defer JS, debounce expensive handlers, and
                minimize hydration cost.</li>
                <li><strong>Reduce JS payload:</strong> code-split, tree-shake, drop heavy dependencies — the root
                cause of most mobile jank is too much JS executing on a weak CPU.</li>
                <li><strong>Re-measure on real/throttled mobile</strong> and lock in with CI budgets.</li>
            </ol>`,
            explanation: 'A slow LCP on mobile is usually a too-big hero image or render-blocking resources delaying the first meaningful paint; janky interactions are usually the main thread being hogged by heavy JavaScript. You fix the first by delivering the key content faster, and the second by giving the CPU less work and breaking it into smaller pieces so the page stays responsive.',
            bestPractices: ['Diagnose with throttled mobile + field data', 'Optimize/preload the LCP element', 'Break up long main-thread tasks; reduce JS', 'Use SSR/SSG for fast first paint', 'Enforce budgets in CI'],
            commonMistakes: ['Testing only on a fast laptop', 'Adding more JS to "fix" perf', 'Ignoring the actual LCP element', 'Blocking the main thread with synchronous work'],
            interviewTip: 'Separate the two problems explicitly: LCP = deliver key content faster (image/render-blocking), INP/jank = reduce and break up main-thread JS. Mention throttled mobile + field data as the diagnostic basis.',
            followUp: ['What is a "long task" and why does it hurt INP?', 'How can a web worker help?', 'How does hydration affect interactivity?'],
            seniorPerspective: 'On mobile, almost every "janky and slow" complaint traces back to JavaScript: too much of it, executing in long unbroken tasks on a CPU several times slower than our laptops. So after the obvious LCP image/render-blocking fixes, my real focus is cutting and chunking JS \u2014 code splitting, removing heavyweight dependencies, deferring hydration, and breaking long tasks so the main thread stays free to respond to input. I refuse to trust a green Lighthouse score from my machine; the only metrics I act on are field LCP/INP/CLS from real users, which is where regressions actually show up.'
        },
        {
            question: 'What is the critical rendering path, and how do render-blocking resources delay first paint?',
            difficulty: 'medium',
            answer: `<p>The <strong>critical rendering path</strong> is the sequence the browser follows to turn HTML, CSS, and JS into pixels: parse HTML into the <strong>DOM</strong>, parse CSS into the <strong>CSSOM</strong>, combine them into the <strong>render tree</strong>, compute <strong>layout</strong>, then <strong>paint</strong> and composite. The browser cannot paint meaningful content until it has both the DOM and the CSSOM.</p>
            <p><strong>Render-blocking resources</strong> stall this path:</p>
            <ul>
                <li><strong>CSS is render-blocking:</strong> the browser won't paint until all stylesheets in the head are downloaded and parsed (to avoid a flash of unstyled content). A large or slow CSS file delays first paint directly.</li>
                <li><strong>Synchronous JS is parser-blocking:</strong> a plain <code>&lt;script&gt;</code> in the head halts HTML parsing until the script downloads and executes, and it can also wait on pending CSS.</li>
            </ul>
            <p>The fixes minimize and reorder critical work: inline critical (above-the-fold) CSS and defer the rest, add <code>defer</code> or <code>async</code> to scripts so parsing isn't blocked, and <code>preload</code> key resources so they fetch early.</p>`,
            explanation: 'The browser is assembling a stage before raising the curtain: it needs the script (DOM) and the lighting plan (CSSOM) before any scene appears. A render-blocking stylesheet is the lighting crew not done yet, and a synchronous script is an actor standing in the doorway blocking everyone behind them from walking on.',
            code: `<!-- BLOCKS first paint: big CSS + sync script in the head -->
<head>
  <link rel="stylesheet" href="/all-styles.css">  <!-- render-blocking -->
  <script src="/app.js"></script>                  <!-- parser-blocking -->
</head>

<!-- FASTER: inline critical CSS, defer the rest, defer JS -->
<head>
  <style>/* critical above-the-fold CSS inlined here */</style>
  <link rel="preload" href="/rest.css" as="style"
        onload="this.rel='stylesheet'">             <!-- non-critical CSS, async -->
  <link rel="preload" href="/hero.webp" as="image"> <!-- fetch LCP image early -->
  <script src="/app.js" defer></script>            <!-- runs after parse, in order -->
</head>`,
            language: 'html',
            bestPractices: ['Inline critical above-the-fold CSS; load the rest asynchronously', 'Add defer (or async for independent scripts) so JS does not block HTML parsing', 'Preload the LCP image and key fonts so they fetch early', 'Keep critical CSS small — large stylesheets directly delay first paint'],
            commonMistakes: ['Putting large synchronous scripts in the head (blocks parsing and paint)', 'Shipping one giant CSS bundle so paint waits on the whole file', 'Using async for scripts whose execution order matters (use defer instead)', 'Loading web fonts without a font-display strategy, blocking text render'],
            interviewTip: 'Walk the path in order (DOM + CSSOM -> render tree -> layout -> paint) and then explain that CSS is render-blocking and sync JS is parser-blocking. Naming defer vs async correctly (defer preserves order, runs after parse) is a strong signal.',
            followUp: ['What is the difference between defer and async?', 'Why is CSS render-blocking by default?', 'How does font-display affect text rendering?'],
            seniorPerspective: 'The highest-impact critical-path win I repeatedly apply is inlining a small slice of critical CSS and deferring everything else, combined with preloading the LCP image. It directly attacks the gap between "HTML arrived" and "user sees content." I am wary of over-engineering critical-CSS extraction, though — for many apps, simply splitting CSS per route and deferring non-critical bundles gets most of the benefit without a fragile build step.'
        },
        {
            question: 'Images are usually the heaviest bytes on a page. How do you optimize them for performance?',
            difficulty: 'medium',
            answer: `<p>Images dominate page weight and are often the LCP element, so optimizing them is frequently the single biggest frontend win. The levers:</p>
            <ul>
                <li><strong>Modern formats:</strong> serve WebP or AVIF instead of JPEG/PNG — substantially smaller at equivalent quality.</li>
                <li><strong>Responsive images:</strong> use <code>srcset</code>/<code>sizes</code> so each device downloads an appropriately-sized image, not a desktop-resolution image on a phone.</li>
                <li><strong>Correct dimensions + compression:</strong> never ship a 4000px image into a 400px slot; compress to a sensible quality.</li>
                <li><strong>Lazy loading:</strong> <code>loading="lazy"</code> on offscreen images so they don't compete with critical content.</li>
                <li><strong>Reserve space:</strong> set <code>width</code>/<code>height</code> (or aspect-ratio) to prevent layout shift (CLS) as images load.</li>
                <li><strong>Prioritize the LCP image:</strong> preload it and do <em>not</em> lazy-load it (lazy-loading the hero hurts LCP).</li>
            </ul>`,
            explanation: 'Shipping a giant image into a small slot is like mailing a poster folded into an envelope when a postcard would do — wasted bytes and time. Responsive images send the right size for each mailbox, modern formats use lighter paper, and reserving space keeps the page from reshuffling when the image finally arrives.',
            code: `<!-- Responsive + modern format + dimensions + lazy (offscreen) -->
<picture>
  <source type="image/avif"
          srcset="/p-400.avif 400w, /p-800.avif 800w, /p-1200.avif 1200w"
          sizes="(max-width: 600px) 400px, 800px">
  <source type="image/webp"
          srcset="/p-400.webp 400w, /p-800.webp 800w, /p-1200.webp 1200w"
          sizes="(max-width: 600px) 400px, 800px">
  <img src="/p-800.jpg" width="800" height="600" alt="Product"
       loading="lazy" decoding="async">         <!-- reserves space, lazy offscreen -->
</picture>

<!-- The LCP/hero image: preload it and DO NOT lazy-load it -->
<link rel="preload" as="image" href="/hero-800.avif">
<img src="/hero-800.avif" width="1200" height="500" alt="Hero" fetchpriority="high">`,
            language: 'html',
            bestPractices: ['Serve WebP/AVIF with a fallback via <picture>', 'Use srcset/sizes so devices download right-sized images', 'Always set width/height (or aspect-ratio) to prevent CLS', 'Preload and prioritize the LCP image; lazy-load only offscreen images'],
            commonMistakes: ['Shipping full-resolution images scaled down by CSS (huge wasted bytes)', 'Lazy-loading the LCP/hero image (delays the very metric you care about)', 'Omitting width/height, causing layout shift as images load', 'Using PNG for photographs (far larger than WebP/AVIF/JPEG)'],
            interviewTip: 'Lead with "images are usually the LCP element and the heaviest bytes, so this is often the biggest win." Then list format, responsive srcset, dimensions for CLS, and the key nuance: preload the LCP image but never lazy-load it.',
            followUp: ['Why should you not lazy-load the LCP image?', 'How does fetchpriority help?', 'When would you inline an image as a data URI?'],
            seniorPerspective: 'Image optimization is the cheapest large win in frontend performance and the one teams most often leave on the table. An automated image pipeline (format conversion, responsive sizes, compression) at build or CDN time beats hand-tuning every image. The one subtlety I always check in reviews is that nobody has lazy-loaded the hero — it is a common copy-paste mistake that quietly wrecks LCP while looking like a best practice.'
        },
        {
            question: 'Compare CSR, SSR, and SSG, and explain how a CDN fits into delivering them.',
            difficulty: 'hard',
            answer: `<p><strong>CSR (Client-Side Rendering):</strong> the server sends a near-empty HTML shell and JS renders the page in the browser. Simple infra and cheap hosting, but slow first paint (blank until JS loads/executes) and weaker SEO. Best for apps behind a login where SEO and first paint matter less.</p>
            <p><strong>SSR (Server-Side Rendering):</strong> the server renders full HTML per request, so first paint is fast and SEO is strong; the page then <strong>hydrates</strong> (JS attaches to make it interactive). Costs more server compute per request and interactivity waits for hydration. Best for dynamic, SEO-critical, per-request content.</p>
            <p><strong>SSG (Static Site Generation):</strong> pages are pre-rendered to static HTML at build time, giving the fastest possible first paint and the cheapest hosting (just files), then hydrate. Best for mostly-static content that doesn't need per-request data. Variants like ISR regenerate static pages periodically for large mostly-static sites.</p>
            <p><strong>The CDN</strong> serves content from edge nodes geographically near users, cutting round-trip latency. SSG output is ideal for a CDN (static files cached globally). SSR responses can be edge-cached when cacheable, and static assets (JS/CSS/images) for any strategy should be served from the CDN with long-cache, fingerprinted filenames. A CDN also provides compression (Brotli/gzip) and HTTP/2-3 at the edge.</p>`,
            explanation: 'CSR is shipping flat-pack furniture: cheap to send, but the customer assembles it before use. SSR is assembling it per order before shipping: ready to use, more work per order. SSG is pre-building popular models and warehousing them: instant to hand over. A CDN is regional warehouses near customers so delivery is fast wherever they are.',
            code: `// Decision sketch
// Mostly-static marketing/blog/docs  -> SSG (+ CDN). Fastest paint, cheapest.
// Dynamic + SEO-critical (product pages, listings) -> SSR (+ edge cache where possible).
// App behind login, SEO irrelevant   -> CSR is fine (simplest).
// Large mostly-static + some dynamic  -> ISR / hybrid.

// Regardless of strategy: static assets via CDN, long-cache, fingerprinted
// Cache-Control: public, max-age=31536000, immutable   // app.4f3a2b.js
// HTML: revalidate so users pick up new asset references
// Cache-Control: no-cache                              // (or short max-age)`,
            language: 'typescript',
            bestPractices: ['Match strategy to content: SSG for static, SSR for dynamic+SEO, CSR for app-behind-login', 'Serve static assets from a CDN with immutable long-cache + fingerprinting', 'Edge-cache SSR responses where the content is cacheable', 'Use hybrid/ISR for large sites that are mostly static with some dynamic pages'],
            commonMistakes: ['Using CSR for SEO-critical public pages (poor indexing, slow paint)', 'SSR everything (high server cost) when much of the site is static', 'Forgetting that hydration delays interactivity even when paint is fast', 'Not putting static assets behind a CDN, adding global latency for every user'],
            interviewTip: 'Give the trade-off table from memory: first paint, interactivity, SEO, server cost. Then add the nuance that SSR/SSG still hydrate (so interactivity lags paint), and position the CDN as the delivery layer that makes SSG nearly instant and accelerates assets for every strategy.',
            followUp: ['What is hydration and why can it hurt INP?', 'When is ISR a better fit than pure SSG?', 'How do islands/partial hydration reduce JS cost?'],
            seniorPerspective: 'I pick rendering strategy per route, not per app. A single site often has static marketing pages (SSG), SEO-critical dynamic listings (SSR), and a logged-in dashboard (CSR is fine). Forcing one strategy everywhere is where teams overpay — SSR on a blog burns compute for no benefit, CSR on a product page tanks SEO. The CDN is non-negotiable in all cases: even a pure CSR app should ship its assets from the edge with aggressive caching.',
            architectPerspective: 'At the architecture level the decision is driven by data freshness needs, SEO requirements, and cost. I favor static-first (SSG/ISR) with a CDN for everything that can be, falling back to SSR only for genuinely per-request, SEO-sensitive content, and increasingly to partial/island hydration to cap the JavaScript cost that hurts INP. The CDN is the backbone — it turns rendering strategy into a delivery-and-caching strategy, where the real latency wins for a global audience live.'
        },
        {
            question: 'How do Core Web Vitals (LCP, INP, CLS) affect SEO and user experience, and how do you optimize each?',
            difficulty: 'hard',
            answer: `<p><strong>Core Web Vitals</strong> are Google's user-centric performance metrics that directly influence search ranking (since 2021) and correlate strongly with user engagement and conversion rates.</p>
            <h4>The Three Metrics:</h4>
            <ul>
                <li><strong>LCP (Largest Contentful Paint)</strong>: Time until the largest visible element renders. Target: &lt; 2.5s. Measures perceived load speed.</li>
                <li><strong>INP (Interaction to Next Paint)</strong>: Latency from user interaction to visual response. Target: &lt; 200ms. Replaced FID in March 2024. Measures responsiveness throughout the page lifecycle.</li>
                <li><strong>CLS (Cumulative Layout Shift)</strong>: Sum of unexpected layout shifts. Target: &lt; 0.1. Measures visual stability.</li>
            </ul>
            <h4>Optimization Strategies:</h4>
            <table><thead><tr><th>Metric</th><th>Common Causes</th><th>Fixes</th></tr></thead><tbody>
                <tr><td>LCP</td><td>Large unoptimized images, render-blocking JS/CSS, slow server response</td><td>Preload LCP image, inline critical CSS, use CDN, optimize server TTFB, responsive images with srcset</td></tr>
                <tr><td>INP</td><td>Long tasks blocking main thread, heavy JS execution, large DOM</td><td>Break long tasks with yield/scheduler, use web workers for computation, reduce DOM size, debounce handlers</td></tr>
                <tr><td>CLS</td><td>Images without dimensions, late-loading ads/embeds, font swap</td><td>Set explicit width/height on images/video, reserve space for dynamic content, use font-display: optional</td></tr>
            </tbody></table>
            <h4>SEO Impact:</h4>
            <p>Core Web Vitals are a ranking signal in Google's page experience update. Pages in the "good" threshold for all three metrics get a ranking boost. More importantly, poor vitals correlate with high bounce rates — a 100ms LCP improvement can increase conversions by 1-3%.</p>`,
            bestPractices: ['Measure in the field (CrUX data, RUM) not just lab (Lighthouse) — real user conditions vary', 'Prioritize LCP first (biggest SEO and UX impact), then INP, then CLS', 'Use the Performance API and web-vitals library for Real User Monitoring', 'Set performance budgets in CI that fail the build if vitals regress'],
            commonMistakes: ['Optimizing only for Lighthouse score (lab) while ignoring field data (real users on slow connections)', 'Lazy-loading the LCP image (delays the most important element)', 'Adding layout-shifting elements after page load without reserving space', 'Blocking the main thread with synchronous third-party scripts (kills INP)'],
            interviewTip: 'Name all three metrics with their targets (LCP < 2.5s, INP < 200ms, CLS < 0.1), explain the SEO connection, and give one specific optimization per metric. Mentioning that INP replaced FID in 2024 shows current knowledge.',
            followUp: ['How do you measure Core Web Vitals in production vs lab?', 'What is the difference between FID and INP?', 'How do third-party scripts affect Core Web Vitals?'],
            seniorPerspective: 'I treat Core Web Vitals as a product KPI, not just a technical metric. We track them via RUM (Real User Monitoring) and set alerts when p75 approaches the threshold. The business case is clear: every 100ms of LCP improvement measurably increases engagement. I wire performance budgets into CI so regressions are caught before production.',
            architectPerspective: 'Core Web Vitals force architectural decisions: choosing SSR/SSG for LCP, code splitting and lazy loading for INP, and design systems with explicit dimension contracts for CLS. I treat performance as an architectural constraint from the start — bolting it on after the app is built is 10x harder than designing for it. The CDN and rendering strategy decisions flow directly from CWV targets.'
        },
        {
            question: 'How do you implement effective code splitting in a large Angular/React application?',
            difficulty: 'hard',
            answer: `<p><strong>Code splitting</strong> reduces initial bundle size by loading JavaScript on demand — only shipping what the user needs for the current view, and loading the rest as they navigate. In large applications, this can reduce initial load from 2-5MB to 200-500KB.</p>
            <h4>Angular Approach (Lazy-Loaded Routes):</h4>
            <ul>
                <li><strong>Lazy routes</strong>: <code>loadComponent: () => import('./feature/feature.component')</code> creates a separate chunk loaded only when the route is visited.</li>
                <li><strong>Standalone components</strong>: Angular 19 standalone components with lazy loading eliminate NgModule boilerplate.</li>
                <li><strong>Preloading strategies</strong>: <code>PreloadAllModules</code> loads lazy chunks after initial render (fast first paint + fast subsequent navigation). Custom strategies can prioritize likely-next routes.</li>
                <li><strong>Deferrable views</strong>: <code>@defer (on viewport)</code> loads component code when it scrolls into view.</li>
            </ul>
            <h4>React Approach (React.lazy + Suspense):</h4>
            <ul>
                <li><strong>Route-level splitting</strong>: <code>React.lazy(() => import('./Dashboard'))</code> with <code>&lt;Suspense&gt;</code> fallback.</li>
                <li><strong>Component-level splitting</strong>: Heavy components (charts, editors, modals) loaded on interaction.</li>
                <li><strong>Named chunks</strong>: <code>/* webpackChunkName: "dashboard" */</code> for predictable filenames and caching.</li>
            </ul>
            <h4>Advanced Strategies:</h4>
            <ul>
                <li><strong>Route-based prefetching</strong>: On hover over a nav link, start loading that route's chunk (instant navigation perception).</li>
                <li><strong>Shared chunks</strong>: Extract common dependencies (lodash, moment) into shared chunks cached across routes.</li>
                <li><strong>Bundle analysis</strong>: Use webpack-bundle-analyzer or source-map-explorer to identify what is in each chunk and find optimization opportunities.</li>
            </ul>`,
            bestPractices: ['Split at route boundaries first (biggest impact, simplest implementation)', 'Analyze bundle composition with source-map-explorer before splitting', 'Use preloading strategies so lazy chunks are ready before user navigates', 'Set a performance budget: initial bundle < 200KB gzipped for fast 3G load'],
            commonMistakes: ['Splitting too granularly (100 tiny chunks = 100 HTTP requests = slow)', 'Not preloading (lazy routes feel slow because chunk loads on navigation click)', 'Forgetting to split third-party libraries (one large vendor chunk defeats the purpose)', 'No loading states (user sees blank screen while chunk loads)'],
            interviewTip: 'Structure as: route-level splitting (primary), component-level for heavy widgets (secondary), and preloading strategies (UX polish). Mention bundle analysis as the diagnostic step that informs splitting decisions.',
            followUp: ['How do you handle loading states during chunk loading?', 'What is tree shaking and how does it complement code splitting?', 'How do you split vendor bundles effectively?'],
            seniorPerspective: 'In large Angular apps, I enforce lazy-loaded routes as a team convention — every feature module loads independently. The initial bundle contains only the shell, auth, and navigation. Combined with Angular\u2019s @defer for below-fold content, we keep initial load under 200KB gzipped even for apps with 50+ routes.',
            architectPerspective: 'Code splitting is part of a broader delivery architecture: split by route at the build level, cache chunks independently at the CDN level (content-hash filenames), and prefetch intelligently at the runtime level. The architecture goal is that adding a new feature (new route, new chunk) does not slow down existing routes — each team ships independently without inflating everyone else\u2019s bundle.'
        }
    ]
});
