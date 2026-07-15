/* ═══════════════════════════════════════════════════════════════════
   SECURITY TESTING — Level 10: Security (Advanced Security)
   SAST, DAST, IAST, dependency/SCA scanning, penetration testing,
   threat modeling, and shifting security left in CI/CD.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('security-testing', {

    title: 'Security Testing',
    level: 10,
    group: 'security-advanced',
    description: 'Security testing techniques: SAST, DAST, IAST, dependency/SCA scanning, secret scanning, penetration testing, threat modeling, and integrating security into CI/CD (shift left).',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['secure-coding'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Security testing</strong> systematically probes software for vulnerabilities before attackers
            do. It spans automated scanning (static and dynamic), dependency analysis, manual penetration testing,
            and proactive threat modeling — ideally integrated throughout the development lifecycle rather than bolted
            on at the end.</p>
            <p>The modern approach is to <strong>shift left</strong>: catch issues early (in the IDE and CI) where
            they are cheapest to fix, while still running deeper tests (DAST, pen tests) before and after release.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>SAST, DAST, and IAST — what each finds and misses</li>
                <li>Software Composition Analysis (dependency scanning)</li>
                <li>Secret scanning</li>
                <li>Threat modeling (STRIDE)</li>
                <li>Penetration testing and bug bounties</li>
                <li>Integrating security into CI/CD</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>SAST (Static Application Security Testing)</h4>
            <p>Analyzes source code (or bytecode) without running it, finding patterns like SQL injection, hardcoded
            secrets, and unsafe APIs. Runs early (IDE/CI), but produces false positives and misses runtime issues.</p>
            <h4>DAST (Dynamic Application Security Testing)</h4>
            <p>Tests the running application from the outside (black box), like an attacker — finding issues such as
            misconfigurations, auth flaws, and injection that only appear at runtime. Misses code it doesn't reach.</p>
            <h4>IAST (Interactive)</h4>
            <p>Instruments the running app to observe code execution during tests, combining SAST's code visibility
            with DAST's runtime accuracy — fewer false positives.</p>
            <h4>SCA (Software Composition Analysis)</h4>
            <p>Scans third-party dependencies for known vulnerabilities (CVEs) and license issues. Critical given how
            much code is open-source dependencies.</p>
            <h4>Threat Modeling</h4>
            <p>A proactive design-time exercise (e.g., STRIDE) to identify threats and design mitigations before code
            exists.</p>
            <h4>Penetration Testing</h4>
            <p>Skilled humans (or advanced tools) actively attempt to exploit the system, finding complex,
            chained vulnerabilities automation misses.</p>`,
            mermaid: `graph TB
    Design[Design] --> TM[Threat Modeling - STRIDE]
    Code[Code] --> SAST[SAST + secret scan in IDE/CI]
    Build[Build] --> SCA[SCA dependency scan]
    Deployed[Running app] --> DAST[DAST]
    Deployed --> IAST[IAST during tests]
    PreRelease[Pre-release] --> Pen[Penetration test]
    TM --> SAST --> SCA --> DAST --> Pen`
        },
        {
            title: 'How It Works',
            content: `<p>A mature program layers these techniques across the lifecycle (shift left, but defense in
            depth):</p>
            <ol>
                <li><strong>Design:</strong> threat model the feature (STRIDE) to find risks before coding</li>
                <li><strong>Code:</strong> SAST and secret scanning in the IDE and on every commit/PR</li>
                <li><strong>Build:</strong> SCA scans dependencies for known CVEs and fails the build on critical ones</li>
                <li><strong>Test:</strong> DAST/IAST against a deployed test environment</li>
                <li><strong>Pre-release:</strong> periodic penetration testing of critical releases</li>
                <li><strong>Production:</strong> continuous monitoring, bug bounty, and re-scanning as new CVEs emerge</li>
            </ol>`,
            code: `# Security gates in a CI pipeline (conceptual GitHub Actions)
jobs:
  security:
    steps:
      - uses: actions/checkout@v4
      # 1. Secret scanning - fail if a credential was committed
      - run: gitleaks detect --no-banner
      # 2. SAST - static code analysis
      - uses: github/codeql-action/analyze@v3
      # 3. SCA - dependency vulnerability scan
      - run: dotnet list package --vulnerable --include-transitive
      - run: snyk test --severity-threshold=high
      # 4. (post-deploy) DAST against the test environment
      - run: zap-baseline.py -t https://test.example.com -I`,
            language: 'yaml'
        },
        {
            title: 'Visual Diagram',
            content: `<p>STRIDE threat categories used in threat modeling:</p>`,
            mermaid: `graph LR
    S[Spoofing] --> A[Authentication]
    T[Tampering] --> I[Integrity]
    R[Repudiation] --> NR[Non-repudiation/audit]
    ID[Information Disclosure] --> C[Confidentiality]
    D[Denial of Service] --> AV[Availability]
    E[Elevation of Privilege] --> AU[Authorization]`
        },
        {
            title: 'Implementation',
            content: `<p>Examples of applying security testing techniques:</p>`,
            tabs: [
                {
                    label: 'Dependency Scan (SCA)',
                    code: `# .NET: list vulnerable packages (built-in)
dotnet list package --vulnerable --include-transitive

# npm: audit dependencies
npm audit --audit-level=high

# Fail CI on high/critical findings; auto-PR upgrades with Dependabot/Renovate.
# SBOM generation for supply-chain transparency:
syft packages dir:. -o cyclonedx-json > sbom.json`,
                    language: 'bash'
                },
                {
                    label: 'Threat Model (STRIDE)',
                    code: `// Threat model a "password reset" feature with STRIDE:
//
// Spoofing  - Can someone request a reset for another user?
//   Mitigation: send token only to the verified email on file.
// Tampering - Can the reset token be forged/modified?
//   Mitigation: cryptographically random, single-use, short-lived token.
// Repudiation - Can a user deny resetting?
//   Mitigation: audit-log reset requests with timestamp + IP.
// Info Disclosure - Does the response reveal if an email exists?
//   Mitigation: identical response whether or not the account exists.
// DoS - Can resets be spammed?
//   Mitigation: rate-limit reset requests per email/IP.
// Elevation - Can the flow grant more than a password change?
//   Mitigation: token scope limited strictly to password reset.`,
                    language: 'csharp'
                },
                {
                    label: 'Abuse-Case Test',
                    code: `// Automated security regression test for an auth flaw
[Fact]
public async Task ResetPassword_DoesNotRevealAccountExistence()
{
    var existing = await _client.PostAsJsonAsync("/reset",
        new { email = "real@user.com" });
    var unknown = await _client.PostAsJsonAsync("/reset",
        new { email = "nobody@nowhere.com" });

    // Both must return identical status/body (no user enumeration)
    Assert.Equal(existing.StatusCode, unknown.StatusCode);
    Assert.Equal(await existing.Content.ReadAsStringAsync(),
                 await unknown.Content.ReadAsStringAsync());
}`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Shift Security Left</h4>
            <p>Run fast checks (SAST, secret scan, SCA) in the IDE and on every PR so issues are caught when they are
            cheapest to fix.</p>
            <h4>Do: Layer Techniques</h4>
            <p>No single tool finds everything. Combine SAST + DAST + SCA + manual pen testing; each covers the
            others' blind spots.</p>
            <h4>Do: Automate Dependency Scanning</h4>
            <p>Most modern vulnerabilities are in dependencies. Scan continuously and auto-upgrade with Dependabot/
            Renovate; generate an SBOM.</p>
            <h4>Do: Threat Model Early</h4>
            <p>STRIDE the design before coding. The cheapest vulnerability to fix is one you designed out.</p>
            <h4>Do: Triage and Track Findings</h4>
            <p>Prioritize by exploitability and impact; track remediation. Don't let scanners produce noise nobody
            acts on.</p>`,
            callout: {
                type: 'tip',
                title: 'No Single Tool Is Enough',
                text: 'SAST sees code but not runtime; DAST sees runtime but not all code; SCA covers dependencies; pen testing finds chained logic flaws. A real program layers them. Treating any one scanner as "security done" leaves large gaps.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Security Only at the End</h4>
            <p>Pen testing a finished product finds expensive-to-fix issues late. Shift left so most are caught in
            development.</p>
            <h4>Mistake: Ignoring Dependency Vulnerabilities</h4>
            <p>Log4Shell showed a single transitive dependency can be catastrophic. Unscanned dependencies are a
            massive blind spot.</p>
            <h4>Mistake: Alert/Finding Fatigue</h4>
            <p>Thousands of unanitized scanner findings (many false positives) get ignored. Tune tools, triage, and
            fail builds only on real, high-severity issues.</p>
            <h4>Mistake: Treating Scanners as Complete</h4>
            <p>Automated tools miss business-logic flaws (e.g., manipulating prices, authorization gaps). Manual
            testing and threat modeling are still essential.</p>
            <h4>Mistake: No Re-Scanning</h4>
            <p>Code that was safe yesterday may have a newly-disclosed CVE today. Re-scan dependencies continuously,
            not once.</p>`,
            code: `// Business-logic flaw that scanners typically MISS:
[HttpPost("checkout")]
public IActionResult Checkout(CartDto cart)
{
    // BUG: trusts client-supplied price instead of looking it up server-side
    var total = cart.Items.Sum(i => i.Quantity * i.ClientPrice);  // attacker sets price=0
    return Ok(Charge(total));
}
// FIX: always compute price from the trusted server-side catalog.
// Threat modeling / manual review catches this; SAST/DAST usually do not.`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>DevSecOps Pipelines</h4>
            <p>Organizations embed SAST, SCA, and secret scanning into CI so every PR is security-checked, with
            DAST against staging — security as a continuous, automated gate.</p>
            <h4>Supply-Chain Security</h4>
            <p>After incidents like SolarWinds and Log4Shell, SBOMs, dependency pinning, and provenance verification
            became standard practice.</p>
            <h4>Bug Bounty Programs</h4>
            <p>Companies (Google, Microsoft, GitHub) pay external researchers to find vulnerabilities — crowdsourced
            pen testing at scale.</p>
            <h4>Compliance &amp; Audits</h4>
            <p>Standards like PCI-DSS, SOC 2, and ISO 27001 require documented security testing — SAST/DAST results,
            pen test reports, and remediation tracking.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Security testing techniques compared:</p>`,
            table: {
                headers: ['Technique', 'When', 'Finds', 'Misses', 'False Positives'],
                rows: [
                    ['SAST', 'Code/CI (early)', 'Code-level flaws, secrets', 'Runtime/config issues', 'Higher'],
                    ['DAST', 'Running app', 'Runtime, auth, config flaws', 'Unreached code paths', 'Lower'],
                    ['IAST', 'During tests', 'Code + runtime combined', 'Untested paths', 'Low'],
                    ['SCA', 'Build/continuous', 'Known dependency CVEs', 'Custom-code flaws', 'Low'],
                    ['Pen Test', 'Pre-release/periodic', 'Chained & logic flaws', 'What testers do not reach', 'Very low'],
                    ['Threat Modeling', 'Design', 'Design-level risks', 'Implementation bugs', 'N/A']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>"Performance" here is about pipeline speed and signal quality, not runtime:</p>
            <h4>Keep CI Gates Fast</h4>
            <p>Run quick checks (secret scan, SCA, incremental SAST) on every PR; reserve slow full DAST scans for
            nightly or pre-release runs so developer feedback stays fast.</p>
            <h4>Tune for Signal</h4>
            <p>Configure rulesets and suppress known false positives so findings are actionable. A noisy tool that
            blocks builds spuriously gets disabled — the worst outcome.</p>
            <h4>Fail on Severity Threshold</h4>
            <p>Fail the build only on high/critical, newly-introduced issues; report (don't block) lower-severity
            findings to avoid grinding delivery to a halt.</p>
            <h4>Incremental Scanning</h4>
            <p>Scan only changed code/dependencies on PRs for speed; run full scans on a schedule.</p>`,
            callout: {
                type: 'warning',
                title: 'Noisy Gates Get Bypassed',
                text: 'A security gate that floods developers with false positives or slows every PR by 20 minutes will be circumvented or disabled. Tune rulesets, scan incrementally, and fail only on real high-severity issues so the gate stays trusted and enabled.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Security findings should become permanent automated tests.</p>
            <h4>Regression Tests for Vulnerabilities</h4>
            <p>When a vulnerability is found (by a scan, pen test, or incident), write an automated abuse-case test
            that reproduces it, then fix it. The test prevents regression forever.</p>
            <h4>Security Unit/Integration Tests</h4>
            <p>Test authorization boundaries (IDOR), input rejection (injection payloads), and auth flows (no user
            enumeration) as part of the normal suite.</p>`,
            code: `// Turn a pen-test finding into a permanent regression test
[Fact]
public async Task AdminEndpoint_AsNonAdmin_ReturnsForbidden()
{
    var client = CreateClientAs(role: "user");
    var resp = await client.GetAsync("/admin/users");
    Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);  // privilege escalation blocked
}

[Theory]
[InlineData("'; DROP TABLE Users;--")]
[InlineData("<img src=x onerror=alert(1)>")]
public async Task Search_MaliciousInput_IsSafe(string payload)
{
    var resp = await _client.GetAsync($"/search?q={Uri.EscapeDataString(payload)}");
    Assert.NotEqual(HttpStatusCode.InternalServerError, resp.StatusCode);
    // assert no injection side effect / payload returned unescaped
}`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Security testing questions probe a holistic, layered mindset:</p>
            <ul>
                <li><strong>Distinguish SAST vs DAST</strong> (white box/static vs black box/runtime) and what each misses</li>
                <li><strong>Stress dependency scanning (SCA)</strong> — most vulnerabilities live in dependencies now</li>
                <li><strong>Explain shift-left</strong> and why early detection is cheaper</li>
                <li><strong>Know STRIDE</strong> for threat modeling</li>
                <li><strong>Note that tools miss business-logic flaws</strong> — manual testing matters</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'SAST vs DAST in One Line',
                text: 'SAST reads the code without running it (early, sees source, more false positives, misses runtime). DAST attacks the running app from outside (later, fewer false positives, misses code it can\u2019t reach). They are complementary \u2014 strong programs run both.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Resources</h4>
            <ul>
                <li>OWASP Testing Guide and OWASP ASVS</li>
                <li>OWASP Threat Dragon / Microsoft Threat Modeling Tool</li>
                <li><em>The Web Application Hacker's Handbook</em> by Stuttard &amp; Pinto</li>
                <li>NIST Secure Software Development Framework (SSDF)</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li>SAST: CodeQL, Semgrep, SonarQube</li>
                <li>DAST: OWASP ZAP, Burp Suite</li>
                <li>SCA: Snyk, Dependabot, OWASP Dependency-Check</li>
                <li>Secrets: gitleaks, trufflehog</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>SAST</strong> = static/code (early, more false positives); <strong>DAST</strong> = dynamic/runtime (fewer FPs, misses unreached code)</li>
                <li><strong>SCA</strong> scans dependencies — where most modern vulnerabilities live</li>
                <li><strong>Threat modeling (STRIDE)</strong> finds design risks before code exists</li>
                <li><strong>Shift left:</strong> fast checks in IDE/CI; slow scans nightly/pre-release</li>
                <li><strong>Layer techniques</strong> — no single tool finds everything</li>
                <li><strong>Tools miss business-logic flaws;</strong> manual testing and review remain essential</li>
                <li><strong>Turn findings into regression tests</strong> so vulnerabilities never return</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Build a Security Pipeline + Threat Model</h4>
            <ol>
                <li>Threat model a "file upload" feature with STRIDE; list mitigations per category</li>
                <li>Add secret scanning (gitleaks) and SCA (dotnet list/npm audit or Snyk) to a CI pipeline</li>
                <li>Add a SAST step (CodeQL or Semgrep) and configure it to fail on high severity only</li>
                <li>Add a nightly DAST baseline scan (OWASP ZAP) against the test environment</li>
                <li>Write two abuse-case regression tests (e.g., uploading an executable, path traversal)</li>
                <li>Document how you triage and track findings</li>
            </ol>`,
            code: `// 1. STRIDE the upload feature:
//    Spoofing/AuthZ: only authenticated users; verify ownership
//    Tampering: validate content-type + magic bytes, not just extension
//    Info Disclosure: store outside webroot; randomized names
//    DoS: size limits + rate limiting + virus scan
//    Elevation: never execute uploaded files
// 2-4. CI: gitleaks + SCA + CodeQL (fail high) ; nightly ZAP baseline
// 5. tests: reject .exe disguised as .jpg ; reject ../ path traversal`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What is the difference between SAST and DAST?<br/>
                    <em>A: SAST analyzes source code statically (early, sees code, more false positives, misses runtime
                    issues). DAST tests the running application from the outside (later, fewer false positives, misses
                    code paths it doesn't reach). They are complementary.</em></li>
                <li><strong>Q:</strong> Why is dependency scanning (SCA) so important?<br/>
                    <em>A: Most application code is third-party dependencies, and known CVEs in them (e.g., Log4Shell) can
                    be catastrophic. SCA continuously detects vulnerable dependencies that custom-code scanners miss.</em></li>
                <li><strong>Q:</strong> What does STRIDE stand for and what is it for?<br/>
                    <em>A: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of
                    privilege \u2014 a framework for threat modeling a design to identify and mitigate risks before coding.</em></li>
                <li><strong>Q:</strong> Why can't automated scanners replace manual security testing?<br/>
                    <em>A: They miss business-logic flaws (e.g., trusting a client-supplied price, authorization gaps) and
                    complex chained exploits that require human reasoning about intent and context.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'What is the difference between SAST and DAST?',
            difficulty: 'easy',
            answer: `<p><strong>SAST (Static)</strong> analyzes source code or bytecode <em>without running it</em>, early in
            the lifecycle. It sees the code (white box), finds patterns like injection and hardcoded secrets, but
            produces more false positives and misses runtime/config issues.</p>
            <p><strong>DAST (Dynamic)</strong> tests the <em>running</em> application from the outside (black box), like
            an attacker. It finds runtime, configuration, and auth issues with fewer false positives, but misses code
            paths it never reaches and runs later. They are complementary — use both.</p>`,
            explanation: 'SAST is like proofreading a recipe for dangerous instructions before cooking. DAST is like actually cooking the dish and tasting it to see what goes wrong. Each catches problems the other cannot.',
            bestPractices: ['Run SAST in IDE/CI for early feedback', 'Run DAST against a deployed test environment', 'Use both plus SCA'],
            commonMistakes: ['Relying on only one technique', 'Treating SAST false positives as all real'],
            interviewTip: 'Use the static-vs-runtime and white-box-vs-black-box contrast, then explicitly say they are complementary.',
            followUp: ['Where does IAST fit?', 'What does neither catch?']
        },
        {
            question: 'Why is software composition analysis (dependency scanning) critical, and how do you operationalize it?',
            difficulty: 'medium',
            answer: `<p>Modern applications are mostly third-party code — a typical project has hundreds of direct and
            transitive dependencies. A vulnerability in any of them (e.g., Log4Shell in Log4j) can compromise your
            app even though your own code is flawless. <strong>SCA</strong> detects dependencies with known CVEs and
            license problems.</p>
            <p>Operationalize it by: running SCA in CI to fail builds on high/critical CVEs, using automated upgrade
            bots (Dependabot/Renovate) to keep dependencies current, generating an SBOM for supply-chain
            transparency, and re-scanning continuously since new CVEs are disclosed daily.</p>`,
            explanation: 'Your code is one room you built carefully, but the building also includes hundreds of pre-fabricated rooms (dependencies) you did not inspect. SCA is the inspector who continuously checks whether any of those pre-fab rooms has just been recalled for a safety defect.',
            code: `dotnet list package --vulnerable --include-transitive   # .NET
npm audit --audit-level=high                            # npm
# Fail CI on high/critical; Dependabot auto-PRs upgrades; generate SBOM.`,
            language: 'bash',
            bestPractices: ['Scan continuously, not once', 'Fail builds on high/critical CVEs', 'Automate upgrades (Dependabot/Renovate)', 'Generate and track an SBOM'],
            commonMistakes: ['Never updating dependencies', 'Ignoring transitive dependencies', 'Scanning once and assuming safe forever'],
            interviewTip: 'Cite Log4Shell as the canonical example and emphasize continuous re-scanning — CVEs appear after you ship.',
            followUp: ['What is an SBOM?', 'How do you handle a CVE with no available patch?']
        },
        {
            question: 'How would you build a security testing strategy across the SDLC for a new product?',
            difficulty: 'hard',
            answer: `<p>I would layer techniques across the lifecycle, shifting left while keeping defense in depth:</p>
            <ol>
                <li><strong>Design:</strong> threat model key features with STRIDE; design out the worst risks and
                define security requirements.</li>
                <li><strong>Code:</strong> developer IDE plugins + SAST and secret scanning on every PR for fast, cheap
                feedback; security-focused code review.</li>
                <li><strong>Build:</strong> SCA on dependencies, failing on high/critical CVEs; generate an SBOM.</li>
                <li><strong>Test:</strong> DAST/IAST against a deployed staging environment; automated abuse-case tests
                in the normal suite.</li>
                <li><strong>Pre-release:</strong> penetration testing for major releases; manual review of
                business-logic-sensitive flows (payments, authz).</li>
                <li><strong>Production:</strong> continuous dependency re-scanning, runtime monitoring/anomaly
                detection, a bug bounty or responsible-disclosure process, and turning every finding into a
                regression test.</li>
            </ol>
            <p>I would tune tools for signal (fail only on real high-severity issues), triage and track findings, and
            measure outcomes (mean time to remediate, escaped-defect rate) rather than just running scanners.</p>`,
            explanation: 'Think of layered airport security: design checks (who is allowed in), document scans at check-in (SAST/SCA), the metal detector and pat-down at the gate (DAST/pen test), and ongoing surveillance after boarding (production monitoring). No single checkpoint is trusted alone.',
            bestPractices: ['Threat model at design time', 'Fast SAST/secret/SCA in CI; slow DAST/pen tests later', 'Layer techniques (defense in depth)', 'Tune for signal and triage findings', 'Convert findings into regression tests; measure MTTR'],
            commonMistakes: ['Security only as a pre-release gate', 'Noisy tools that get disabled', 'Scanners without manual testing of business logic', 'No tracking/remediation of findings'],
            interviewTip: 'Walk the SDLC stages and place the right technique at each, then add the meta-points: tune for signal, triage, and measure remediation. Mentioning business-logic review and turning findings into regression tests shows maturity.',
            followUp: ['How do you keep the CI security gate fast and trusted?', 'How do you prioritize a backlog of findings?', 'How do you measure whether the program is working?'],
            seniorPerspective: 'The two things that make or break a security testing program are signal quality and ownership. If the tools cry wolf, developers route around them, so I invest heavily in tuning rulesets, suppressing known false positives, and failing builds only on real, newly-introduced high-severity issues. And I insist every confirmed finding becomes an automated regression test owned by the team \u2014 otherwise the same class of bug reappears. Scanners are necessary but they do not find business-logic flaws like a manipulable price or a broken authorization boundary, which is why threat modeling and targeted manual review of money/authz paths stay in the process permanently.'
        },
        {
            question: 'What is IAST and how does it differ from SAST and DAST? When is it worth adopting?',
            difficulty: 'medium',
            answer: `<p><strong>IAST (Interactive Application Security Testing)</strong> instruments the running application — via an agent inside the runtime — and observes code execution <em>while functional or DAST tests exercise it</em>. It sees both the source/data flow (like SAST) and the real runtime behavior (like DAST) at the same time.</p>
            <ul>
                <li><strong>SAST</strong> reads code statically: early, broad coverage, but high false positives and no runtime context.</li>
                <li><strong>DAST</strong> attacks from outside: real runtime issues, low false positives, but no code visibility and limited to reached endpoints.</li>
                <li><strong>IAST</strong> correlates the attack with the exact code path and data flow, producing very low false positives and precise remediation pointers — but only for code paths your tests actually execute.</li>
            </ul>
            <p>It is worth adopting when you have solid functional/integration test coverage to drive it, a supported runtime (JVM, .NET, Node), and want accurate, low-noise findings tied to specific lines. Its blind spot is identical to your test coverage: untested paths are unanalyzed.</p>`,
            explanation: 'SAST proofreads the recipe, DAST tastes the finished dish, and IAST is a sensor inside the kitchen watching exactly which step burned the sauce while the chef cooks — it pinpoints the failing line because it sees both the code and the live execution.',
            bestPractices: ['Drive IAST with strong functional/integration test suites for coverage', 'Use IAST to triage and confirm SAST findings (it kills false positives)', 'Run it in QA/integration environments where realistic flows execute', 'Treat coverage gaps explicitly — IAST only sees executed paths'],
            commonMistakes: ['Assuming IAST covers code your tests never exercise', 'Running it without enough functional tests to drive meaningful paths', 'Treating it as a full replacement for SAST/DAST rather than a complement', 'Ignoring the runtime/performance overhead of the instrumentation agent'],
            interviewTip: 'Position IAST as the hybrid that correlates a runtime attack with the exact vulnerable line, then immediately name its blind spot: coverage equals your test coverage.',
            followUp: ['Why does IAST have fewer false positives than SAST?', 'What limits IAST coverage?'],
            seniorPerspective: 'I have had the most value from IAST not as a standalone gate but as a false-positive killer layered on top of SAST: when SAST flags a potential injection, IAST confirms whether tainted data actually reaches a dangerous sink at runtime, which lets the team trust the queue instead of drowning in maybes. The catch is that it is only as good as the functional tests driving it, so I treat investment in integration coverage as a prerequisite, not an afterthought.'
        },
        {
            question: 'Why is secret scanning a distinct security control, and how do you implement it effectively across history and CI?',
            difficulty: 'hard',
            answer: `<p>Hardcoded credentials (API keys, connection strings, private keys, tokens) are one of the most common and highest-impact leaks — a single committed AWS key can lead to full account compromise. <strong>Secret scanning</strong> is distinct from SAST because it hunts for high-entropy strings and known credential patterns rather than insecure code constructs, and it must consider <em>git history</em>, not just the current tree.</p>
            <p>Implement it in layers:</p>
            <ul>
                <li><strong>Pre-commit hooks</strong> (e.g., gitleaks) so secrets never get committed locally.</li>
                <li><strong>CI scanning</strong> on every PR, failing the build on a finding.</li>
                <li><strong>Full-history scans</strong> — a secret committed months ago is still exposed even if later deleted, because git retains history.</li>
                <li><strong>Push protection</strong> at the platform (GitHub/GitLab) to block pushes containing detected secrets.</li>
            </ul>
            <p>Critically, detection is only step one: <strong>any leaked secret must be rotated/revoked immediately</strong>, because once pushed (especially to a public repo) it must be assumed compromised — deleting the commit does not undo exposure.</p>`,
            explanation: 'A leaked key is like accidentally mailing your house key to a stranger. Shredding your copy of the letter (deleting the commit) does nothing — the stranger already has the key. The only real fix is changing the locks (rotating the credential).',
            code: `# Layered secret scanning
# 1. Local pre-commit hook - block before it ever lands
gitleaks protect --staged --no-banner

# 2. CI on every PR - scan the diff, fail on findings
gitleaks detect --no-banner --redact

# 3. Full-history audit - secrets deleted later are still in history
gitleaks detect --log-opts="--all" --no-banner

# On ANY hit: revoke + rotate the credential immediately, then purge history
# (git filter-repo / BFG) - rotation is mandatory, history rewrite is cleanup.`,
            language: 'bash',
            bestPractices: ['Scan the full git history, not just the working tree', 'Block at pre-commit and via platform push protection', 'Rotate/revoke any exposed secret immediately — assume compromise', 'Move secrets to a vault/managed identity so there is nothing to leak'],
            commonMistakes: ['Only scanning current files, missing secrets buried in history', 'Deleting the commit but never rotating the leaked credential', 'Relying on .gitignore alone (it does not remove already-committed secrets)', 'No push protection, so secrets reach remote before anyone notices'],
            interviewTip: 'The senior signal is insisting that detection without rotation is worthless — once a secret is pushed it must be treated as compromised, full stop.',
            followUp: ['Why does deleting the commit not fix a leaked secret?', 'How do managed identities eliminate the problem entirely?'],
            seniorPerspective: 'Every secret-leak incident I have handled came down to the same lesson: the moment a credential hits a remote, the clock is already running and you rotate first and clean up history second. I push teams toward managed identities and short-lived vault-issued credentials precisely so that the blast radius of an inevitable accidental commit is "rotate one ephemeral token" rather than "a long-lived key with production access has been public for three weeks."',
            architectPerspective: 'Architecturally I try to design the problem away: if services authenticate via workload/managed identities and pull config from a secrets manager at runtime, there are no static secrets in the repo to leak. Secret scanning then becomes a backstop for the exceptions rather than the primary line of defense, which is a far more robust posture than scanning your way out of a credential-in-code culture.'
        },
        {
            question: 'Compare penetration testing and a bug bounty program. How do they complement automated scanning in a mature program?',
            difficulty: 'advanced',
            answer: `<p>Both bring human attackers, but differ in structure, timing, and economics:</p>
            <ul>
                <li><strong>Penetration testing</strong> is a time-boxed, scoped engagement by a hired team (internal or vendor) against defined targets, usually before major releases or for compliance (PCI-DSS, SOC 2). You get a structured report, methodology coverage, and accountability, but only a point-in-time snapshot of a fixed scope.</li>
                <li><strong>Bug bounty</strong> is continuous, crowdsourced testing where many independent researchers probe production for vulnerabilities and are paid per valid finding. You get diverse perspectives and ongoing coverage, but variable quality, triage overhead, and a need for a mature response process.</li>
            </ul>
            <p>They complement automation because <strong>scanners (SAST/DAST/SCA) find known patterns and regressions cheaply and continuously</strong>, while humans find <strong>business-logic flaws and chained exploits</strong> automation cannot reason about (e.g., manipulating a multi-step checkout to get free goods). A mature program layers all three: automated gates catch the bulk early and cheaply, periodic pen tests provide deep scoped assurance, and a bug bounty provides continuous real-world coverage of production.</p>`,
            explanation: 'Automated scanning is a building\'s alarm system running 24/7 on known triggers. A penetration test is hiring expert burglars for a week to try every door and window and write you a report. A bug bounty is offering a standing reward to anyone in the world who can break in — continuous, diverse, but you must be ready to handle whatever they bring.',
            bestPractices: ['Layer automation (continuous) + pen tests (deep, periodic) + bounty (continuous, diverse)', 'Scope pen tests to high-risk releases and compliance needs', 'Stand up a triage/response process before launching a bounty', 'Feed every human finding back into automated regression tests'],
            commonMistakes: ['Treating an annual pen test as sufficient ongoing security', 'Launching a bug bounty without capacity to triage and pay promptly', 'Expecting scanners to find business-logic or chained flaws', 'Not converting findings into permanent regression tests'],
            interviewTip: 'Frame it as point-in-time-scoped (pen test) versus continuous-crowdsourced (bounty), and stress that both exist because automation cannot reason about business logic.',
            followUp: ['Why can automated tools not find business-logic flaws?', 'What must be in place before launching a bug bounty?'],
            seniorPerspective: 'The mistake I most often see is treating a yearly pen test as "security done" — it is a point-in-time snapshot of a fixed scope, and the system changes every sprint. I sequence them deliberately: automation runs every PR as the cheap continuous net, pen tests give deep assurance around major releases and compliance, and a bug bounty provides the always-on adversarial pressure on production. The non-negotiable for a bounty is operational readiness — if you cannot triage and pay researchers quickly, you get a flood of frustrated reporters and public disclosure instead of coordinated fixes.',
            architectPerspective: 'I view these as a portfolio balancing cost, coverage, and assurance: scanners are cheap and continuous but shallow, pen tests are expensive and deep but periodic, and bounties are continuous and broad but operationally demanding. The architectural decision is which assets warrant which level — crown-jewel, money-handling, and authz-critical paths justify all three plus mandatory manual review, while low-risk internal tooling may only need the automated gate.'
        },
        {
            question: 'How do you integrate security testing into a CI/CD pipeline without slowing down delivery?',
            difficulty: 'hard',
            answer: `<p>The key is <strong>layered, parallel, severity-gated</strong> security checks:</p>
<ol>
<li><strong>Pre-commit (seconds):</strong> git-secrets/gitleaks hooks catch hardcoded credentials before they enter the repo</li>
<li><strong>PR/Build (parallel, minutes):</strong> SAST (incremental, changed files only) + SCA (dependency CVE check) + container scan — run alongside unit tests, not after</li>
<li><strong>Staging (async, 10-30 min):</strong> DAST baseline scan — runs against deployed staging, does NOT block production deploy but alerts on findings</li>
<li><strong>Nightly (hours):</strong> Full SAST scan + comprehensive DAST crawl — deeper analysis without blocking any deploy</li>
</ol>
<h4>Speed strategies:</h4>
<ul>
<li><strong>Incremental SAST:</strong> Only scan changed files on PR; full scan on main branch nightly</li>
<li><strong>Severity gating:</strong> Block only on HIGH/CRITICAL new findings. Medium/Low create tickets but don't block.</li>
<li><strong>Parallel execution:</strong> Security scans run in parallel with tests, not sequentially after</li>
<li><strong>Cached results:</strong> Don't re-scan unchanged dependencies every build</li>
<li><strong>False positive suppression:</strong> Maintain a suppress file for verified false positives so they don't re-block</li>
</ul>
<p><strong>Result:</strong> Security adds 1-3 minutes to PR feedback (parallel), never blocks on low-severity, and deep scans run off the critical path. Teams trust the gate because it is fast and accurate.</p>`,
            bestPractices: ['Parallel not sequential — security scans alongside tests', 'Incremental on PRs, full scans nightly', 'Block only on critical/high new findings; ticket the rest', 'Maintain false-positive suppressions so gate stays trusted'],
            commonMistakes: ['Sequential security gate after all tests (adds 20+ minutes to every PR)', 'All severity levels block equally (teams disable the gate)', 'No incremental mode — full SAST on every PR even for a README change', 'DAST blocking production deploy (too slow, should run async against staging)'],
            interviewTip: 'Name the parallel + incremental + severity-gated strategy explicitly. Mentioning that noisy gates get disabled shows you understand the human side of security tooling.',
            followUp: ['How do you handle a critical finding that blocks a time-sensitive deploy?', 'How do you manage false positives across 50+ services?']
        },
        {
            question: 'What is threat modeling and how does STRIDE help you identify security risks systematically?',
            difficulty: 'hard',
            answer: `<p><strong>Threat modeling</strong> identifies security threats during design — before code exists — so mitigations are designed in rather than patched later.</p>
<h4>STRIDE categories:</h4>
<table>
<tr><th>Threat</th><th>Meaning</th><th>Example</th><th>Mitigation</th></tr>
<tr><td><strong>S</strong>poofing</td><td>Impersonating identity</td><td>Forged JWT, stolen session</td><td>Strong auth, token validation</td></tr>
<tr><td><strong>T</strong>ampering</td><td>Modifying data</td><td>MitM altering request body</td><td>TLS, signatures, integrity checks</td></tr>
<tr><td><strong>R</strong>epudiation</td><td>Denying action</td><td>User denies placing bet</td><td>Audit logs, digital signatures</td></tr>
<tr><td><strong>I</strong>nfo Disclosure</td><td>Data exposure</td><td>IDOR, verbose errors, log leaks</td><td>AuthZ, encryption, data masking</td></tr>
<tr><td><strong>D</strong>oS</td><td>Availability attack</td><td>Resource exhaustion, DDoS</td><td>Rate limiting, WAF, auto-scale</td></tr>
<tr><td><strong>E</strong>levation</td><td>Privilege escalation</td><td>User accessing admin API</td><td>RBAC, least privilege</td></tr>
</table>
<h4>Process:</h4>
<ol>
<li>Draw data flow diagram with trust boundaries</li>
<li>For each flow crossing a boundary, ask all 6 STRIDE questions</li>
<li>Rate threats (likelihood × impact) and prioritize</li>
<li>Design specific mitigations → these become security requirements in the backlog</li>
</ol>
<p><strong>When to threat model:</strong> New features, architecture changes, external integrations, and compliance-required systems. Not every bug fix — focus on design decisions with security implications.</p>`,
            bestPractices: ['Threat model at design time (before code), not after implementation', 'Focus on trust boundaries — where data crosses zones is where attacks happen', 'Involve developers (they know the code) AND security engineers (they know attack patterns)', 'Output must be actionable: specific mitigations tracked as backlog items with owners'],
            commonMistakes: ['Treating it as a one-time exercise instead of updating when architecture changes', 'Too abstract — not grounded in the actual data flow diagram', 'Identifying threats but never implementing mitigations (documentation theater)', 'Only security team does it — developers need to understand threats in their code'],
            interviewTip: 'Walk through STRIDE with a concrete example. Show you can systematically identify threats at trust boundaries, not just list OWASP Top 10 from memory.',
            followUp: ['How do you prioritize when you identify 50+ threats?', 'How often should threat models be updated?']
        }
    ]
});
