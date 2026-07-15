/* ═══════════════════════════════════════════════════════════════════
   FEATURE FLAGS & ROLLOUTS — Level 14: Production Engineering
   Feature toggles, progressive rollouts, canary, A/B testing, kill
   switches, and decoupling deploy from release.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('feature-flags', {

    title: 'Feature Flags & Rollouts',
    level: 14,
    group: 'production-practices',
    description: 'Feature flags/toggles, progressive and canary rollouts, A/B testing, kill switches, decoupling deploy from release, and managing flag lifecycle and technical debt.',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    prerequisites: ['devops-strategies'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Feature flags</strong> (feature toggles) are conditional switches that let you turn
            functionality on or off at runtime without deploying new code. They decouple <em>deployment</em> (shipping
            code to production) from <em>release</em> (exposing a feature to users) — a foundational practice for safe,
            continuous delivery.</p>
            <p>With flags you can roll out gradually, run experiments, and instantly disable a broken feature without
            a rollback or redeploy.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>What feature flags are and the deploy/release decoupling</li>
                <li>Flag types: release, ops/kill-switch, experiment, permission</li>
                <li>Progressive rollouts and canary releases</li>
                <li>A/B testing with flags</li>
                <li>Kill switches for instant disable</li>
                <li>Managing flag lifecycle and avoiding flag debt</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Deploy vs Release</h4>
            <p>Deploying code puts it in production (dormant behind a flag). Releasing turns the flag on for users.
            Decoupling them means you can deploy continuously and release on your own schedule, instantly, and
            partially.</p>
            <h4>Flag Types</h4>
            <ul>
                <li><strong>Release toggles:</strong> hide in-progress features until ready (short-lived).</li>
                <li><strong>Ops / kill switches:</strong> instantly disable a feature or degrade gracefully under
                load/incident.</li>
                <li><strong>Experiment toggles:</strong> A/B tests — show variant A vs B to measure impact.</li>
                <li><strong>Permission toggles:</strong> enable features for specific users/segments (beta, premium).</li>
            </ul>
            <h4>Progressive Rollout</h4>
            <p>Enable a feature for an increasing percentage of users (1% -> 10% -> 50% -> 100%), watching metrics at
            each step, so problems are caught at small scale.</p>
            <h4>Canary Release</h4>
            <p>Route a small slice of traffic to the new version/feature first; if healthy, expand. Often combined
            with flags.</p>
            <h4>Flag Lifecycle</h4>
            <p>Flags should be temporary (especially release toggles): create, roll out, then <em>remove</em>. Stale
            flags accumulate as "flag debt."</p>`,
            mermaid: `flowchart LR
    Deploy[Deploy code<br/>flag OFF] --> R1[Release: 1% users]
    R1 --> R2[10%]
    R2 --> R3[50%]
    R3 --> R4[100%]
    R1 -.->|problem| Kill[Kill switch: flag OFF instantly]
    R4 --> Cleanup[Remove flag - avoid flag debt]`
        },
        {
            title: 'How It Works',
            content: `<p>A feature flag is a conditional check around new behavior, evaluated at runtime against a flag
            service/config:</p>
            <ol>
                <li><strong>Deploy</strong> the new code wrapped in a flag check, defaulted OFF</li>
                <li><strong>Target</strong> who sees it: a percentage, specific users, or segments</li>
                <li><strong>Roll out progressively</strong>, monitoring metrics (errors, latency, conversion) at each
                stage</li>
                <li><strong>React instantly:</strong> if something breaks, flip the flag off — no redeploy, seconds
                not minutes</li>
                <li><strong>Complete &amp; clean up:</strong> once at 100% and stable, remove the flag and the old
                code path</li>
            </ol>`,
            code: `// A flag check decouples deploy from release
public async Task<IActionResult> Checkout(CartDto cart)
{
    // New checkout flow is deployed but only active when the flag is on
    // for this user/segment/percentage (evaluated by the flag service).
    if (await _flags.IsEnabledAsync("new-checkout-flow", _user))
    {
        return await NewCheckoutAsync(cart);     // released gradually
    }
    return await LegacyCheckoutAsync(cart);      // safe default for everyone else
}

// Targeting examples (configured in the flag service, no redeploy):
//   percentage: 5% of users
//   segment:    users in beta program
//   user:       internal employees (dogfooding) first
//   kill switch: set to 0% instantly if errors spike`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Decoupling deploy from release enables continuous delivery:</p>`,
            mermaid: `sequenceDiagram
    participant Dev as Developer
    participant Prod as Production
    participant Users as Users
    Dev->>Prod: Deploy code (flag OFF)
    Note over Prod: Code live but dormant - zero user impact
    Dev->>Prod: Enable flag for 1% (internal)
    Prod->>Users: 1% see new feature
    Note over Dev,Users: Monitor metrics, expand gradually
    Dev->>Prod: 100% rollout
    Dev->>Prod: Remove flag + old code
`
        },
        {
            title: 'Implementation',
            content: `<p>Flag evaluation, kill switches, and A/B testing:</p>`,
            tabs: [
                {
                    label: 'Targeting & Rollout',
                    code: `// Percentage + segment targeting (e.g., LaunchDarkly / OpenFeature style)
var ctx = new EvaluationContext(userId: _user.Id,
    attributes: new { plan = _user.Plan, country = _user.Country });

// Gradual rollout: the flag service returns true for an increasing %
bool showNewUI = await _flags.GetBooleanAsync("new-dashboard", ctx, defaultValue: false);

// Default value is critical: if the flag service is unreachable, fall back
// to a SAFE default (usually OFF / the old behavior) so an outage in the
// flag system doesn't break the app.`,
                    language: 'csharp'
                },
                {
                    label: 'Kill Switch',
                    code: `// Ops kill switch: instantly disable an expensive/risky feature under load
// or during an incident - NO redeploy, takes effect in seconds.
if (await _flags.IsEnabledAsync("enable-recommendations"))
{
    recommendations = await _recs.GetAsync(userId);   // can be turned off instantly
}
// During an incident or traffic spike, set "enable-recommendations" = false
// to shed the expensive call and protect the core experience (load shedding
// via flag = graceful degradation you control in real time).`,
                    language: 'csharp'
                },
                {
                    label: 'A/B Experiment',
                    code: `// Experiment toggle: assign users to a variant and measure outcomes
var variant = await _flags.GetStringAsync("checkout-button-experiment", ctx,
    defaultValue: "control");   // "control" | "variant-a" | "variant-b"

var buttonText = variant switch
{
    "variant-a" => "Buy Now",
    "variant-b" => "Complete Purchase",
    _           => "Checkout"          // control
};
// Track conversion per variant; the flag service ensures consistent
// assignment per user and reports which variant performs best.`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Decouple Deploy from Release</h4>
            <p>Deploy code dark behind a flag, then release on your schedule. This enables continuous deployment with
            controlled, low-risk exposure.</p>
            <h4>Do: Roll Out Progressively</h4>
            <p>Start internal/1%, watch metrics, then expand. Catch problems at small scale before they hit everyone.</p>
            <h4>Do: Provide Safe Defaults</h4>
            <p>If the flag service is unavailable, evaluation must fall back to a safe default (usually the old
            behavior) so the flag system isn't a single point of failure.</p>
            <h4>Do: Use Kill Switches for Risky Features</h4>
            <p>Wrap expensive or risky features so you can disable them instantly during incidents/spikes — graceful
            degradation under your control.</p>
            <h4>Do: Manage the Flag Lifecycle</h4>
            <p>Treat release flags as temporary: remove them (and the dead code path) once fully rolled out. Track
            flags and set expiry/cleanup.</p>
            <h4>Do: Keep Flag Logic Simple</h4>
            <p>Avoid deeply nested/interdependent flags — combinatorial explosion of states is untestable.</p>`,
            callout: {
                type: 'tip',
                title: 'Deploy != Release',
                text: 'The single biggest value of feature flags: you can deploy code to production continuously (small, safe, frequent) while controlling exactly when, to whom, and how fast a feature is exposed to users \u2014 and turn it off instantly if needed. This is the foundation of safe continuous delivery.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Flag Debt (Never Removing Flags)</h4>
            <p>Stale flags accumulate, cluttering code with dead branches, increasing the state space, and creating
            confusion ("is this flag still used?"). Remove flags after rollout.</p>
            <h4>Mistake: No Safe Default on Flag-Service Failure</h4>
            <p>If a flag evaluation throws or the service is down and you don't default safely, an outage in the flag
            system breaks your app. Always default to safe behavior.</p>
            <h4>Mistake: Too Many Interdependent Flags</h4>
            <p>Nested/combinatorial flags create an explosion of states you can't test, leading to bugs only certain
            flag combinations trigger.</p>
            <h4>Mistake: Using Flags for Long-Lived Config</h4>
            <p>Confusing short-lived release toggles with permanent configuration. They have different lifecycles;
            don't let release flags become permanent.</p>
            <h4>Mistake: Not Monitoring During Rollout</h4>
            <p>Flipping to 100% without watching metrics at each stage defeats the purpose of progressive rollout.</p>
            <h4>Mistake: Flags Affecting Security Silently</h4>
            <p>A flag that toggles an auth check is dangerous; test both states and treat security-affecting flags
            with extra care.</p>`,
            code: `// Flag debt: code rotting with stale, never-removed flags
if (await _flags.IsEnabledAsync("new-checkout-2023")) { ... }       // shipped long ago
else if (await _flags.IsEnabledAsync("checkout-experiment-v1")) { } // dead
else if (await _flags.IsEnabledAsync("legacy-checkout-fallback")) { } // ???
// Nobody knows which are live. Untestable combinations.
//
// FIX: once a release flag is 100% and stable, DELETE the flag and the
// losing/old code path. Track flags with owners + expiry dates.`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Continuous Delivery at Scale</h4>
            <p>Companies like Facebook, Google, and Netflix deploy constantly behind flags, releasing features
            gradually and dark-launching to detect issues before full exposure.</p>
            <h4>Trunk-Based Development</h4>
            <p>Flags let teams merge incomplete features to main (hidden behind a flag) instead of long-lived
            branches — enabling trunk-based development and avoiding merge hell.</p>
            <h4>Experimentation Platforms</h4>
            <p>A/B testing platforms (built on flags) drive product decisions by measuring variant impact on
            conversion, engagement, and revenue.</p>
            <h4>Operational Resilience</h4>
            <p>Kill switches let ops disable expensive features (heavy recommendations, non-critical widgets) during
            traffic spikes or incidents to protect the core experience.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Feature flags vs alternatives for controlling releases:</p>`,
            table: {
                headers: ['Approach', 'Granularity', 'Rollback speed', 'Enables CD', 'Cost'],
                rows: [
                    ['Feature flags', 'Per feature/user/%', 'Instant (toggle)', 'Yes', 'Flag mgmt + debt risk'],
                    ['Blue-green deploy', 'Whole app version', 'Fast (switch)', 'Partial', 'Double infra'],
                    ['Canary deploy', 'Traffic %', 'Fast (reroute)', 'Partial', 'Routing complexity'],
                    ['Rollback redeploy', 'Whole app', 'Slow (redeploy)', 'No', 'Low'],
                    ['Long-lived branches', 'N/A', 'N/A', 'No', 'Merge hell']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Flag evaluation must be fast and resilient since it's on the request path:</p>
            <h4>Evaluate Locally / Cached</h4>
            <p>Flag SDKs typically stream rules to the app and evaluate <em>in-process</em> (no network call per
            check), so evaluation is microseconds. Avoid a remote call per flag check on the hot path.</p>
            <h4>Resilient to Flag-Service Outage</h4>
            <p>Cache the last-known ruleset and default safely if the flag service is unreachable — flag evaluation
            should never block or fail the request.</p>
            <h4>Minimize Flag-Check Overhead</h4>
            <p>Evaluate a flag once per request (not repeatedly in a loop). Keep targeting rules simple to keep
            evaluation cheap.</p>
            <h4>Rollout as a Performance Safety Net</h4>
            <p>Progressive rollout itself protects performance: a feature that degrades latency is caught at 1% and
            disabled before it affects everyone.</p>`,
            callout: {
                type: 'info',
                title: 'Local Evaluation',
                text: 'Mature flag systems (LaunchDarkly, Unleash, OpenFeature providers) stream flag rules to the application and evaluate them in-process. This makes each flag check effectively free (microseconds, no network) and resilient \u2014 the app keeps working with the last-known rules even if the flag service is briefly unreachable.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Flags multiply code paths — test both states and avoid combinatorial explosion.</p>
            <h4>Test Both Flag States</h4>
            <p>For every flag, test the on and off paths. A feature that works only when the flag is on but breaks
            the off (fallback) path is a latent bug.</p>
            <h4>Control Flags in Tests</h4>
            <p>Inject flag values deterministically in tests (a fake flag provider) so tests aren't flaky and you can
            assert each path.</p>
            <h4>Limit Combinations</h4>
            <p>Keep flags independent so you don't face 2^N untestable combinations. Test the combinations that
            actually occur.</p>`,
            code: `// Deterministically control flags in tests via a fake provider
[Theory]
[InlineData(true)]
[InlineData(false)]
public async Task Checkout_WorksWithFlagOnAndOff(bool flagOn)
{
    var flags = new FakeFlagProvider();
    flags.Set("new-checkout-flow", flagOn);
    var sut = new CheckoutController(flags, _services);

    var result = await sut.Checkout(_cart);

    Assert.IsType<OkObjectResult>(result);   // BOTH paths must work
}
// Always test the OFF/fallback path - it is your safety net.`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Feature flags come up in CD, DevOps, and senior delivery discussions:</p>
            <ul>
                <li><strong>Lead with "decouple deploy from release"</strong> — the core value</li>
                <li><strong>Name the flag types</strong> (release, ops/kill, experiment, permission) and their lifecycles</li>
                <li><strong>Explain progressive rollout</strong> and instant kill switches</li>
                <li><strong>Raise flag debt</strong> proactively — managing/removing flags shows maturity</li>
                <li><strong>Mention safe defaults</strong> so the flag service isn't a SPOF</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Senior Signal',
                text: 'Proactively raising flag debt (the need to remove flags after rollout, with owners and expiry) and safe-default behavior on flag-service failure signals you have operated flags at scale \u2014 not just used them. Many engineers add flags but never clean them up.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Resources</h4>
            <ul>
                <li>Martin Fowler: "Feature Toggles (aka Feature Flags)"</li>
                <li>OpenFeature (open standard) docs; LaunchDarkly / Unleash guides</li>
                <li><em>Accelerate</em> by Forsgren, Humble, Kim (CD practices)</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li>LaunchDarkly, Unleash, Flagsmith, Split.io</li>
                <li>OpenFeature (vendor-neutral SDK standard)</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Feature flags decouple deploy from release</strong> — ship dark, release on your schedule</li>
                <li><strong>Flag types:</strong> release (temporary), ops/kill-switch, experiment (A/B), permission</li>
                <li><strong>Progressive rollout</strong> (1% -> 100%) catches problems at small scale</li>
                <li><strong>Kill switches</strong> disable risky features instantly, no redeploy</li>
                <li><strong>Safe defaults</strong> so the flag service isn't a single point of failure</li>
                <li><strong>Manage flag debt:</strong> remove release flags after rollout, with owners + expiry</li>
                <li><strong>Test both on/off paths;</strong> evaluate flags in-process for speed/resilience</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Roll Out a Risky Feature Safely</h4>
            <ol>
                <li>Wrap a new payment-flow feature in a release flag, defaulted OFF and safe on flag-service failure</li>
                <li>Roll out: internal -> 1% -> 10% -> 50% -> 100%, defining the metric you watch at each stage</li>
                <li>Add an ops kill switch so it can be disabled instantly during an incident</li>
                <li>Add an A/B experiment on the button text and define the success metric</li>
                <li>Write tests for both flag states (and the off/fallback path)</li>
                <li>Define the cleanup plan: when and how the flag and old code path get removed</li>
            </ol>`,
            code: `// 1. if (flags.IsEnabled("new-payment-flow", user, default:false)) {...} else legacy
// 2. rollout stages with a metric gate (error rate / conversion) per stage
// 3. ops flag "enable-new-payment" as kill switch
// 4. experiment flag "pay-button-text" -> control/variant-a, track conversion
// 5. [Theory] test on and OFF paths via a fake flag provider
// 6. cleanup: at 100% + 2 weeks stable -> delete flag + legacy path (owner + date)`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What does it mean to "decouple deploy from release"?<br/>
                    <em>A: Deploying puts code in production dormant behind a flag; releasing turns the flag on for users.
                    Decoupling lets you deploy continuously and control exactly when/to whom/how fast a feature is exposed,
                    and disable it instantly.</em></li>
                <li><strong>Q:</strong> What is a kill switch and why is it valuable?<br/>
                    <em>A: An ops flag that instantly disables a feature with no redeploy. It enables real-time graceful
                    degradation \u2014 shedding expensive/risky features during incidents or spikes in seconds.</em></li>
                <li><strong>Q:</strong> What is "flag debt" and how do you avoid it?<br/>
                    <em>A: Accumulation of stale, never-removed flags cluttering code with dead branches and untestable
                    states. Avoid it by treating release flags as temporary: track them with owners/expiry and remove
                    the flag and old code path after full rollout.</em></li>
                <li><strong>Q:</strong> Why must flag evaluation have a safe default?<br/>
                    <em>A: So that if the flag service is unreachable or evaluation fails, the app falls back to safe
                    behavior (usually the old path) rather than breaking \u2014 the flag system must not be a single point of
                    failure.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'What are feature flags and what is their primary benefit?',
            difficulty: 'easy',
            answer: `<p><strong>Feature flags</strong> (toggles) are runtime switches that turn functionality on or off
            without deploying new code. Their primary benefit is <strong>decoupling deployment from release</strong>:
            you can deploy code to production (dormant behind a flag) continuously, then control independently when,
            to whom, and how fast the feature is actually exposed to users — and turn it off instantly if needed.</p>`,
            explanation: 'It is like installing a new light fixture but leaving it switched off until you are ready. The wiring (code) is in place; flipping the switch (flag) is a separate, instant, reversible decision.',
            bestPractices: ['Default flags OFF and safe', 'Roll out progressively', 'Remove flags after rollout'],
            commonMistakes: ['Letting flags become permanent (flag debt)', 'No safe default on flag-service failure'],
            interviewTip: 'Lead with "decouple deploy from release" — it is the canonical one-line answer interviewers want.',
            followUp: ['How does this enable continuous deployment?', 'What types of flags are there?']
        },
        {
            question: 'How do feature flags enable safe, progressive rollouts and instant rollback?',
            difficulty: 'medium',
            answer: `<p>For <strong>progressive rollout</strong>, a flag targets an increasing audience — internal users,
            then 1%, 10%, 50%, 100% — while you monitor metrics (errors, latency, conversion) at each stage. Problems
            surface at small scale, affecting few users, before full exposure.</p>
            <p>For <strong>instant rollback</strong>, because the feature is gated by a flag, you simply flip the flag
            off — the change takes effect in seconds with no redeploy or code rollback. This is far faster and safer
            than redeploying the previous version, and it is scoped (you can disable just the broken feature, not the
            whole release).</p>`,
            explanation: 'Progressive rollout is like testing a new recipe on a few tables before serving the whole restaurant; the kill switch is being able to pull the dish from the menu instantly if guests react badly \u2014 no need to close and re-open the kitchen.',
            code: `// Roll out by percentage, monitor, and kill instantly if needed
if (await _flags.IsEnabledAsync("new-feature", user))   // 1% -> 10% -> ... 100%
    return NewPath();
return OldPath();
// Incident? Set "new-feature" to 0% in the flag service -> off in seconds.`,
            language: 'csharp',
            bestPractices: ['Monitor metrics at each rollout stage', 'Start internal/small, expand gradually', 'Use the flag as an instant kill switch', 'Keep the old path working until cleanup'],
            commonMistakes: ['Jumping straight to 100%', 'Not monitoring during rollout', 'No safe fallback path'],
            interviewTip: 'Contrast flag-flip rollback (seconds, scoped) with redeploy rollback (minutes, whole app) to highlight the speed and granularity advantage.',
            followUp: ['How does this compare to canary/blue-green deploys?', 'What metrics gate each rollout stage?']
        },
        {
            question: 'What are the downsides and risks of feature flags, and how do you manage them?',
            difficulty: 'hard',
            answer: `<p>Flags are powerful but introduce real risks if unmanaged:</p>
            <ul>
                <li><strong>Flag debt:</strong> stale flags accumulate, littering code with dead branches and
                untestable states. <em>Manage:</em> treat release flags as temporary — track with owners and expiry,
                and remove the flag and old code path once fully rolled out.</li>
                <li><strong>Combinatorial complexity:</strong> N independent flags create 2^N possible states; nested/
                interdependent flags are untestable. <em>Manage:</em> keep flags independent and few; test the
                combinations that actually occur.</li>
                <li><strong>Flag service as a SPOF:</strong> if evaluation fails or the service is down. <em>Manage:</em>
                evaluate in-process from a cached ruleset and default to safe behavior on failure.</li>
                <li><strong>Testing burden:</strong> every flag doubles code paths. <em>Manage:</em> test both on/off
                paths, inject flag values deterministically in tests.</li>
                <li><strong>Security/behavior risk:</strong> a flag toggling auth or critical logic is dangerous.
                <em>Manage:</em> extra review and testing for security-affecting flags.</li>
                <li><strong>Performance:</strong> remote evaluation per check on the hot path. <em>Manage:</em> local
                in-process evaluation.</li>
            </ul>
            <p>The overarching discipline: governance — a flag inventory with owners, purpose, type, and expiry, plus
            a routine to clean up. Flags are an asset when managed and a liability when not.</p>`,
            explanation: 'Feature flags are like temporary scaffolding on a building: essential and safe while constructing, but if you never take it down, it accumulates, obstructs, and eventually becomes a hazard nobody remembers the purpose of. The discipline is putting it up deliberately and tearing it down promptly.',
            bestPractices: ['Track flags with owner, type, and expiry; remove after rollout', 'Keep flags independent and few', 'Local evaluation + safe defaults on failure', 'Test on/off paths deterministically', 'Extra care for security-affecting flags'],
            commonMistakes: ['Never removing flags (debt)', 'Deeply nested interdependent flags', 'No safe default -> flag service becomes a SPOF', 'Forgetting to test the off path'],
            interviewTip: 'Lead with flag debt and the 2^N combinatorial problem, then governance (inventory + expiry + cleanup). Acknowledging the downsides of a tool you advocate signals senior balance.',
            followUp: ['How would you implement a flag-cleanup process?', 'How do you prevent the flag service from being a single point of failure?', 'How do you test a feature gated behind multiple flags?'],
            seniorPerspective: 'I love feature flags and I am ruthless about removing them, because the failure mode I have repeatedly seen is a codebase where nobody can reason about behavior anymore due to dozens of stale, interacting toggles. So I treat every release flag as carrying a removal ticket from the day it is created, with an owner and an expiry, and I run periodic flag audits. I also insist on safe-default-on-failure: more than once I have seen a flag-service outage take down apps because evaluation threw instead of defaulting to the old path. Flags should make the system safer, never add a new single point of failure.'
        },
        {
            question: 'What are the main types of feature flags, and why do their different lifecycles matter?',
            difficulty: 'medium',
            answer: `<p>Flags look identical in code but serve very different purposes and live for very different lengths of
            time. Conflating them is a common source of flag debt and bugs.</p>
            <ul>
                <li><strong>Release toggles:</strong> hide in-progress features until they are ready (and enable
                trunk-based development). <em>Short-lived</em> \u2014 removed once the feature is fully rolled out.</li>
                <li><strong>Ops / kill-switch toggles:</strong> let operators disable a feature or degrade gracefully under
                load or during an incident. <em>Longer-lived</em> \u2014 they exist as a safety control for as long as the
                feature is risky/expensive.</li>
                <li><strong>Experiment toggles:</strong> assign users to A/B variants to measure impact.
                <em>Medium-lived</em> \u2014 they live for the duration of the experiment, then the winner is hardcoded.</li>
                <li><strong>Permission toggles:</strong> enable features for specific users/segments (beta, premium,
                internal). <em>Long-lived / permanent</em> \u2014 they are really entitlement logic, not temporary toggles.</li>
            </ul>
            <p>Lifecycle matters because <strong>how dynamic and how long-lived a flag is should match its type</strong>. A
            release toggle that is never removed becomes flag debt and dead code; treating a permanent permission toggle as
            a temporary release flag (and deleting it) breaks entitlements. Naming, governing, and cleaning up flags by type
            \u2014 with owners and expiry for the short-lived ones \u2014 is what keeps the flag system maintainable.</p>`,
            explanation: 'It is like the difference between scaffolding, a fire extinguisher, a survey clipboard, and a door lock. Scaffolding (release toggle) comes down when the work is done; the extinguisher (kill switch) stays mounted for emergencies; the clipboard (experiment) is collected once the survey ends; the lock (permission) is permanent infrastructure. Treating them all the same is how you end up with scaffolding you never remove.',
            code: `// Same API, different intent and lifecycle - name and govern accordingly:
if (await _flags.IsEnabledAsync("release-new-checkout", user))   // release: short-lived
    return NewCheckout();

if (await _flags.IsEnabledAsync("ops-enable-recommendations"))   // ops/kill: long-lived
    recs = await _recs.GetAsync(user.Id);

var variant = await _flags.GetStringAsync("exp-buy-button", ctx,  // experiment: medium
    defaultValue: "control");

if (await _flags.IsEnabledAsync("perm-premium-analytics", user)) // permission: permanent
    ShowPremiumAnalytics();
// A naming convention (release-/ops-/exp-/perm-) makes lifecycle/cleanup obvious.`,
            language: 'csharp',
            bestPractices: ['Classify each flag by type and give it a matching lifecycle', 'Use a naming convention so the type/lifecycle is obvious in code', 'Assign owners and expiry to short-lived (release/experiment) flags', 'Keep permission/ops flags as deliberate long-lived controls'],
            commonMistakes: ['Treating all flags as the same thing', 'Never removing release toggles (flag debt)', 'Deleting a permanent permission flag and breaking entitlements', 'No owner or expiry on temporary flags'],
            interviewTip: 'Name the four types and pair each with its lifecycle (release=short, experiment=medium, ops/permission=long). The lifecycle point is what shows you have managed flags at scale, not just used them.',
            followUp: ['Which flag types should have an expiry date and which should not?', 'How would a naming convention help govern flag cleanup?'],
            seniorPerspective: 'The single most useful thing I have done with flags is enforce a type-based naming convention, because it makes lifecycle visible: anyone reviewing the code knows a release- flag should have been deleted after rollout, while a perm- flag is meant to stay. Without that, every flag looks permanent, and the codebase slowly fills with toggles nobody dares remove because they cannot tell which were temporary.',
            architectPerspective: 'I think of the flag inventory as a governed asset with a schema: each flag carries a type, an owner, a purpose, and (for short-lived types) an expiry, and tooling flags overdue release toggles for cleanup. That governance is what keeps flags a net positive at scale \u2014 the alternative is combinatorial state explosion and a system whose behavior no one can fully reason about. Treating flag lifecycle as an explicit, enforced policy is the difference between flags as a delivery accelerator and flags as long-term technical debt.'
        },
        {
            question: 'How does an ops/kill-switch flag enable real-time graceful degradation, and how should you design it?',
            difficulty: 'hard',
            answer: `<p>An <strong>ops/kill-switch flag</strong> wraps an expensive, risky, or non-critical feature so operators
            can disable it <strong>instantly, with no redeploy</strong>, taking effect in seconds. It turns graceful
            degradation into a real-time control you can pull during an incident or traffic spike.</p>
            <h4>How it degrades the system gracefully</h4>
            <p>During an incident or overload, flipping the kill switch sheds the expensive call (e.g., heavy
            recommendations, a non-critical enrichment) so the <strong>core experience stays fast and available</strong>.
            It is load-shedding you control by hand, far faster and more surgical than a rollback or a scaling change.</p>
            <h4>Design considerations</h4>
            <ul>
                <li><strong>Identify core vs non-core paths</strong> in advance and put kill switches on the non-core,
                expensive ones \u2014 so under stress you can drop the optional and protect the essential.</li>
                <li><strong>Default to safe behavior on flag-service failure:</strong> if evaluation fails, fall back to a
                safe state so the kill switch (and the flag service) is never itself a single point of failure.</li>
                <li><strong>Fast propagation:</strong> evaluate in-process from a streamed/cached ruleset so the toggle
                takes effect in seconds across the fleet.</li>
                <li><strong>Test the OFF path:</strong> the degraded behavior is the safety net \u2014 it must be tested and
                actually graceful (cached/default response), not a crash.</li>
                <li><strong>Make it operable:</strong> documented in runbooks, with clear ownership, so on-call knows the
                switch exists and when to use it.</li>
            </ul>`,
            explanation: 'It is the load-shedding a power grid does on a heatwave: rather than letting demand collapse the whole grid, the operator deliberately drops non-essential load (dimming, rolling brownouts) to keep hospitals and core services powered. A kill switch is that lever for your service \u2014 drop the optional feature instantly to keep the core alive.',
            code: `// Kill switch: shed an expensive, non-core feature instantly during an incident
public async Task<ProductPage> GetProductPage(int id)
{
    var product = await _catalog.GetAsync(id);   // CORE - must always work

    var recommendations = Array.Empty<Product>();
    // Ops can set "ops-enable-recommendations" = false to shed this expensive call
    // in seconds during a spike/incident - no redeploy. Default-safe if flags fail.
    if (await _flags.IsEnabledAsync("ops-enable-recommendations", defaultValue: false))
    {
        try { recommendations = await _recs.GetAsync(id); }
        catch { recommendations = Array.Empty<Product>(); }   // degrade, don't fail
    }

    // Page still renders the core product even with recommendations shed off.
    return new ProductPage(product, recommendations);
}`,
            language: 'csharp',
            bestPractices: ['Put kill switches on expensive/non-core features identified in advance', 'Default to safe behavior if flag evaluation fails (no SPOF)', 'Evaluate in-process for second-level propagation', 'Test the OFF/degraded path; document the switch in runbooks'],
            commonMistakes: ['No kill switch on a known-expensive feature', 'Degraded path that crashes instead of returning a safe default', 'Flag-service failure breaking the app instead of defaulting safe', 'On-call unaware the switch exists or how to use it'],
            interviewTip: 'Frame the kill switch as operator-controlled, real-time graceful degradation/load-shedding \u2014 faster and more surgical than rollback. Stress identifying core vs non-core and safe-default-on-failure.',
            followUp: ['How does a kill switch compare to rolling back a deploy?', 'How do you decide which features get a kill switch?'],
            seniorPerspective: 'Kill switches are the flags I value most operationally, because during an incident the fastest lever is rarely a deploy \u2014 it is flipping off the one expensive, non-essential feature that is amplifying the load. I make sure every heavy, optional code path has one, that on-call knows it exists, and that it is in the runbook. The corollary I enforce hard: the off path must be genuinely safe, because a kill switch whose degraded behavior throws an exception is not a safety control, it is a second outage.',
            architectPerspective: 'I treat kill switches as a deliberate part of the degradation architecture: the system is designed with a clear core that must never fail and a set of optional enrichments, each independently shed-able. That lets the service trade functionality for survival under stress in a controlled, pre-planned way rather than collapsing unpredictably. Combined with safe-default-on-failure evaluation, this gives operators a real-time dial on the functionality-vs-load trade-off \u2014 which, at scale, is one of the most powerful reliability tools available short of full autoscaling.'
        },
        {
            question: 'How do you run a statistically valid A/B test using feature flags, and what are the common pitfalls?',
            difficulty: 'expert',
            answer: `<p>An experiment toggle assigns users to variants (control vs treatment) so you can <strong>measure</strong>
            the causal impact of a change on a metric (conversion, engagement, revenue). Doing it validly is as much
            statistics as engineering.</p>
            <h4>Running it correctly</h4>
            <ul>
                <li><strong>Consistent (sticky) assignment:</strong> a user must see the <em>same</em> variant on every
                request and visit \u2014 typically a deterministic hash of a stable user/session id, not a per-request random
                draw. Inconsistent assignment ruins the experiment and the user experience.</li>
                <li><strong>Random, representative split</strong> of the population into control and treatment, with a
                clearly defined <strong>primary success metric</strong> chosen <em>before</em> the test.</li>
                <li><strong>Adequate sample size and duration:</strong> compute the sample size for the minimum effect you
                care about, and run for full business cycles (e.g., whole weeks) to avoid day-of-week bias.</li>
                <li><strong>Statistical significance:</strong> only conclude when results reach a pre-set significance
                level (p-value/confidence interval) and the test has run its planned duration.</li>
                <li><strong>Guardrail metrics:</strong> watch for regressions in latency, errors, or other key metrics, not
                just the target metric.</li>
            </ul>
            <h4>Common pitfalls</h4>
            <ul>
                <li><strong>Peeking / stopping early</strong> the moment results look significant \u2014 this massively inflates
                false positives.</li>
                <li><strong>Too-small sample</strong> or too-short duration \u2014 underpowered, results are noise.</li>
                <li><strong>Sample-ratio mismatch</strong> (the split is not actually 50/50) signals a bugged assignment and
                invalidates results.</li>
                <li><strong>Inconsistent assignment</strong> (per-request randomness) so a user flips between variants.</li>
                <li><strong>Running too many overlapping experiments</strong> that interact and confound each other.</li>
                <li><strong>Forgetting to clean up:</strong> after concluding, hardcode the winner and remove the
                experiment flag (flag debt).</li>
            </ul>`,
            explanation: 'It is a clinical drug trial: you randomly assign patients to drug or placebo, keep each patient on the same arm throughout, pre-register the primary outcome and sample size, and only judge the result at the end. Peeking at the data and stopping the trial the moment the drug looks good is exactly how you fool yourself into approving something that does not work.',
            code: `// Consistent (sticky) variant assignment via a deterministic hash of a stable id.
// A mature flag platform does this for you; the principle is what matters.
public string AssignVariant(string experiment, string userId)
{
    // Same user + experiment -> SAME bucket every time (no per-request randomness).
    var hash = SHA256.HashData(Encoding.UTF8.GetBytes($"{experiment}:{userId}"));
    var bucket = BitConverter.ToUInt32(hash, 0) % 100;   // stable 0-99 bucket

    return bucket switch
    {
        < 50 => "control",     // 50%  (verify actual split == 50/50: no sample-ratio mismatch)
        _    => "treatment"    // 50%
    };
    // Track outcomes per variant; only conclude at the pre-planned sample size +
    // duration and required significance. Do NOT stop early because it "looks" significant.
}`,
            language: 'csharp',
            bestPractices: ['Use deterministic, sticky per-user assignment (hash of a stable id)', 'Pre-register the primary metric, sample size, and duration; run full business cycles', 'Only conclude at planned significance; monitor guardrail metrics', 'After concluding, hardcode the winner and remove the experiment flag'],
            commonMistakes: ['Peeking and stopping early when results look good (false positives)', 'Underpowered tests (sample too small / duration too short)', 'Per-request random assignment so users flip variants', 'Sample-ratio mismatch from a bugged split; overlapping confounding experiments'],
            interviewTip: 'Show you know the statistics, not just the plumbing: sticky assignment, pre-registered metric/sample size/duration, significance, and the peeking pitfall. Mentioning sample-ratio mismatch and guardrail metrics is a strong senior/expert signal.',
            followUp: ['Why is stopping an experiment early when it looks significant dangerous?', 'What is a sample-ratio mismatch and what does it usually indicate?'],
            seniorPerspective: 'The engineering part of A/B testing is easy; the discipline is hard. The mistake I see most is peeking \u2014 someone watches the dashboard and calls the result the moment p dips below 0.05, which is statistically meaningless and ships changes that do nothing. I insist on a pre-registered metric, sample size, and end date, and on sticky assignment so a user never flips variants. And I treat sample-ratio mismatch as a hard stop: if your 50/50 split is actually 53/47, your assignment is bugged and every conclusion is suspect.',
            architectPerspective: 'At scale, experimentation is a platform concern, not a per-team script. I want a shared experimentation system that guarantees consistent assignment, prevents conflicting overlapping experiments, enforces sample-size and duration gates, and computes significance centrally \u2014 so individual teams cannot accidentally run invalid tests or peek their way to false wins. Tying that platform into the flag system also closes the loop on cleanup: when an experiment concludes, the winning variant is promoted and the flag is retired automatically, keeping experimentation from becoming the next source of flag debt.'
        },
        {
            question: 'What is feature flag debt, and how do you prevent it from accumulating?',
            difficulty: 'hard',
            answer: `<p><strong>Flag debt</strong> is the accumulation of stale, completed, or abandoned feature flags that remain in the codebase long after their purpose is served. It creates dead code paths, cognitive overhead, testing complexity, and potential bugs.</p>
<h4>How flag debt forms:</h4>
<ul>
<li>Feature ships successfully → flag stays in code "just in case" → never removed</li>
<li>Experiment concludes → winner hardcoded → experiment flag left in evaluation code</li>
<li>Kill switch added for incident → incident resolved months ago → switch still in code</li>
<li>Over years: 500+ flags, half of which nobody knows the purpose of</li>
</ul>
<h4>Costs of flag debt:</h4>
<ul>
<li><strong>Testing combinatorial explosion:</strong> N flags = potentially 2^N code paths to test</li>
<li><strong>Cognitive load:</strong> Developers must understand which flags are active and why</li>
<li><strong>Bug risk:</strong> Stale flags can be accidentally toggled, activating dead code paths</li>
<li><strong>Performance:</strong> Evaluating hundreds of flags per request adds latency</li>
</ul>
<h4>Prevention strategies:</h4>
<ol>
<li><strong>Expiration dates:</strong> Every flag gets a TTL at creation. After expiration, the flag platform alerts the owner to remove it.</li>
<li><strong>Lint rules:</strong> CI fails if a flag older than 90 days has no removal PR in progress.</li>
<li><strong>Ownership enforcement:</strong> Every flag has an owner. When a team member leaves, their flags are reassigned or retired.</li>
<li><strong>Quarterly flag audits:</strong> Review all flags: fully rolled out → remove code paths. Dead experiments → hardcode winner. Unused kill switches → evaluate if still needed.</li>
<li><strong>Automated cleanup:</strong> Flag platform detects flags that have been 100% ON for 30+ days and auto-creates removal PRs.</li>
</ol>`,
            bestPractices: ['Set TTL/expiration at flag creation time — forces conscious lifecycle management', 'Track flag count as a metric; alert if growing faster than being retired', 'Automated detection: flags at 100% for 30+ days → generate removal ticket', 'Include flag removal as part of the Definition of Done for the feature'],
            commonMistakes: ['Creating flags without expiration — they live forever', 'No ownership — when the creator leaves, nobody knows what the flag does', 'Treating flag removal as low priority — it never gets scheduled', 'Testing only the ON path — the OFF path (dead code) rots and may crash if accidentally activated'],
            interviewTip: 'Naming "flag debt" as a concept and proposing TTL + automated detection shows you have operated flag systems at scale. Most candidates only discuss flag creation, not lifecycle.',
            followUp: ['How would you safely remove a flag that has been in production for 2 years?', 'What is the maximum number of active flags a team should have?']
        },
        {
            question: 'Describe progressive rollout with feature flags. How do you decide the rollout stages?',
            difficulty: 'hard',
            answer: `<p><strong>Progressive rollout</strong> gradually increases the percentage of users exposed to a new feature, with monitoring at each stage to detect problems before they affect everyone.</p>
<h4>Typical rollout stages:</h4>
<table>
<tr><th>Stage</th><th>Audience</th><th>Duration</th><th>Purpose</th></tr>
<tr><td>1. Internal</td><td>Engineering team (dogfooding)</td><td>1-3 days</td><td>Catch obvious bugs with high-context users</td></tr>
<tr><td>2. Canary</td><td>1-5% of production users</td><td>1-2 days</td><td>Verify with real traffic, minimal blast radius</td></tr>
<tr><td>3. Early adopters</td><td>10-25% of users</td><td>3-5 days</td><td>Statistical significance for metrics; wider device/browser coverage</td></tr>
<tr><td>4. Broad rollout</td><td>50%</td><td>2-3 days</td><td>Confidence before full release; A/B comparison</td></tr>
<tr><td>5. General availability</td><td>100%</td><td>Permanent</td><td>Full release; begin flag retirement process</td></tr>
</table>
<h4>Gate criteria between stages:</h4>
<ul>
<li><strong>Error rate:</strong> No increase in 5xx errors for the flagged cohort vs control</li>
<li><strong>Latency:</strong> No p99 regression beyond threshold (e.g., < 10% increase)</li>
<li><strong>Business metrics:</strong> Conversion rate, engagement not degraded (or improved)</li>
<li><strong>Support tickets:</strong> No spike in related customer complaints</li>
</ul>
<p><strong>Automated progressive delivery:</strong> Tools like Flagger, Argo Rollouts, or LaunchDarkly can automatically advance stages when metrics are healthy and automatically roll back if metrics degrade — making progressive rollout hands-free for simple cases.</p>`,
            bestPractices: ['Define gate criteria BEFORE starting rollout (not ad hoc)', 'Include a "bake time" at each stage — do not advance within minutes', 'Monitor both technical metrics (errors, latency) and business metrics (conversion)', 'Have an automatic rollback trigger if metrics breach thresholds'],
            commonMistakes: ['Jumping from 1% to 100% without intermediate stages', 'No monitoring between stages — advancing blindly', 'Manual-only advancement — someone forgets to advance for weeks', 'Not comparing flagged vs unflagged cohorts — missing regressions hidden in aggregate metrics'],
            interviewTip: 'Show the stages table and gate criteria. Mentioning automated progressive delivery tools (Flagger/Argo) and the distinction between technical vs business metrics signals operational maturity.',
            followUp: ['How do you handle a rollout where the feature looks fine at 5% but degrades at 50%?', 'How does progressive rollout differ from canary deployment?']
        }
    ]
});
