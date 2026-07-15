/* ═══════════════════════════════════════════════════════════════════
   RESPONSIBLE AI — Level 12: AI & LLMs (AI Applications)
   Ethics, bias and fairness, transparency, privacy, accountability,
   governance, and safe deployment of AI systems.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('ai-responsible', {

    title: 'Responsible AI',
    level: 12,
    group: 'ai-applications',
    description: 'Building AI responsibly: fairness and bias, transparency and explainability, privacy, accountability, human oversight, governance, and emerging regulation.',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    prerequisites: ['ai-fundamentals'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Responsible AI</strong> is the practice of designing, building, and deploying AI systems that
            are fair, transparent, private, accountable, and safe. As AI makes or influences consequential decisions
            — lending, hiring, healthcare, content moderation — the engineering choices have real human impact and
            increasing legal weight.</p>
            <p>For engineers, responsible AI is not abstract ethics; it is concrete practice: choosing data, measuring
            bias, enabling explanation, protecting privacy, and keeping humans in control.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>The core principles of responsible AI</li>
                <li>Bias and fairness — sources and mitigations</li>
                <li>Transparency and explainability</li>
                <li>Privacy and data governance</li>
                <li>Accountability and human oversight</li>
                <li>Governance frameworks and regulation</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Fairness</h4>
            <p>AI should not produce unjustified, disparate outcomes across protected groups. Fairness has multiple,
            sometimes conflicting mathematical definitions (demographic parity, equal opportunity) — choosing one is a
            value decision.</p>
            <h4>Transparency &amp; Explainability</h4>
            <p>Stakeholders should understand how a system works and why it made a decision. Explainability is harder
            for complex models ("black boxes") and often legally required for consequential decisions.</p>
            <h4>Privacy</h4>
            <p>Respect data rights: minimize collection, get consent, protect personal data, and prevent models from
            leaking training data or PII.</p>
            <h4>Accountability</h4>
            <p>A human/organization is answerable for the system's outcomes. Decisions must be auditable and there
            must be recourse for those affected.</p>
            <h4>Human Oversight</h4>
            <p>Humans stay in (or on) the loop for high-stakes decisions — able to review, override, and intervene.</p>
            <h4>Safety &amp; Robustness</h4>
            <p>Systems should behave reliably, resist manipulation, fail safely, and be monitored for drift and harm
            after deployment.</p>`,
            mermaid: `graph TB
    RAI[Responsible AI] --> F[Fairness / no unjust bias]
    RAI --> T[Transparency / explainability]
    RAI --> P[Privacy / data rights]
    RAI --> A[Accountability / auditability]
    RAI --> H[Human oversight]
    RAI --> S[Safety / robustness]`
        },
        {
            title: 'How It Works',
            content: `<p>Responsible AI is embedded across the lifecycle, not bolted on at the end:</p>
            <ol>
                <li><strong>Problem framing:</strong> Should AI be used here at all? What are the harms of errors?</li>
                <li><strong>Data:</strong> assess representativeness; document datasets (datasheets); check for
                historical bias the model would learn</li>
                <li><strong>Model:</strong> evaluate accuracy <em>and</em> fairness metrics across subgroups; prefer
                interpretable models where decisions are consequential</li>
                <li><strong>Deployment:</strong> add human oversight for high-stakes decisions, explanations, and
                appeal/recourse paths</li>
                <li><strong>Monitoring:</strong> watch for drift, disparate impact, and harm in production; have a
                kill switch and incident process</li>
                <li><strong>Governance:</strong> document decisions, assign accountability, and comply with regulation</li>
            </ol>`,
            code: `// Conceptual: measure fairness, not just accuracy, across subgroups
// (e.g., using a fairness library on predictions vs ground truth)
//
// Overall accuracy: 92%  (looks great)
// But break it down:
//   Group A: false-positive rate 4%
//   Group B: false-positive rate 19%   <- disparate impact!
//
// A model can be "accurate" overall while harming a subgroup.
// Always slice metrics by protected attributes and define which
// fairness criterion (e.g., equal opportunity) you are optimizing for,
// because they cannot all be satisfied simultaneously.`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Bias can enter at every stage — and compound:</p>`,
            mermaid: `flowchart LR
    Hist[Historical bias in world] --> Data[Training data]
    Data --> Sample[Sampling/representation bias]
    Sample --> Label[Labeling bias]
    Label --> Model[Model learns bias]
    Model --> Deploy[Deployment / feedback loop]
    Deploy -->|reinforces| Hist
    style Model fill:#fecaca,color:#1e293b`
        },
        {
            title: 'Implementation',
            content: `<p>Practical responsible-AI controls in an application:</p>`,
            tabs: [
                {
                    label: 'Human-in-the-Loop',
                    code: `// High-stakes decisions: AI recommends, human decides (with explanation)
public async Task<LoanDecision> EvaluateAsync(Application app)
{
    var prediction = await _model.PredictAsync(app);

    // For consequential outcomes, never auto-deny without review
    if (prediction.Risk == RiskLevel.High || prediction.Confidence < 0.8)
    {
        return LoanDecision.RequiresHumanReview(
            prediction,
            explanation: _explainer.Explain(prediction),   // top contributing factors
            appealPath: "/appeals");
    }
    // Auto-approve low-risk only; log decision + features for audit
    _audit.Record(app.Id, prediction, decidedBy: "model");
    return LoanDecision.Approved(prediction);
}`,
                    language: 'csharp'
                },
                {
                    label: 'Privacy Controls',
                    code: `// Data minimization + PII handling for AI features
// 1. Collect only what the model needs; document why (purpose limitation)
// 2. Redact/avoid sending PII to third-party model providers
var redacted = _piiRedactor.Redact(userText);   // strip names, emails, ids
var summary = await _llm.SummarizeAsync(redacted);

// 3. Honor data-subject rights (access, deletion); track data lineage
// 4. Avoid training on personal data without consent/legal basis
// 5. Prefer private/enterprise endpoints with no-retention agreements
//    when handling sensitive data.`,
                    language: 'csharp'
                },
                {
                    label: 'Audit & Transparency',
                    code: `// Make decisions auditable and explainable
public record DecisionRecord(
    string SubjectId,
    string Decision,
    string ModelVersion,
    IReadOnlyList<FactorContribution> TopFactors,  // why (explainability)
    double Confidence,
    string DecidedBy,           // "model" or reviewer id (accountability)
    DateTime Timestamp);

// Log every consequential decision with its reasoning + model version
// so it can be reviewed, contested, and reproduced. Provide affected
// users a clear explanation and a path to appeal.`,
                    language: 'csharp'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Measure Fairness, Not Just Accuracy</h4>
            <p>Slice metrics by protected subgroups; a high overall accuracy can hide serious disparate impact.
            Choose and justify a fairness criterion explicitly.</p>
            <h4>Do: Keep Humans in the Loop for High Stakes</h4>
            <p>For consequential decisions (credit, hiring, medical, legal), AI should assist, not autonomously
            decide. Provide review, override, and appeal.</p>
            <h4>Do: Make Decisions Explainable and Auditable</h4>
            <p>Log inputs, model version, and contributing factors. Give affected people an understandable reason and
            recourse.</p>
            <h4>Do: Minimize and Protect Data</h4>
            <p>Collect only necessary data, get consent, redact PII before sending to providers, and honor deletion/
            access rights.</p>
            <h4>Do: Document and Govern</h4>
            <p>Use model cards / datasheets, assign clear accountability, run impact assessments, and align with
            regulation (EU AI Act, etc.).</p>
            <h4>Do: Monitor After Deployment</h4>
            <p>Watch for drift, emerging bias, and harm; have an incident process and a way to disable the system
            quickly.</p>`,
            callout: {
                type: 'tip',
                title: 'Accuracy Is Not Fairness',
                text: 'A model with 95% overall accuracy can still systematically disadvantage a subgroup (e.g., far higher false-positive rate for one group). Always evaluate metrics sliced by protected attributes \u2014 aggregate accuracy hides disparate impact.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Optimizing Only for Accuracy</h4>
            <p>Ignoring subgroup performance lets a model harm specific populations while looking good on average.</p>
            <h4>Mistake: "The Algorithm Decided"</h4>
            <p>Using AI to dodge accountability. Someone is always responsible; decisions must be auditable and
            contestable.</p>
            <h4>Mistake: Black-Box High-Stakes Decisions</h4>
            <p>Deploying unexplainable models for consequential, regulated decisions without transparency or recourse
            — increasingly illegal.</p>
            <h4>Mistake: Training on Biased/Inappropriate Data</h4>
            <p>"Garbage in, garbage out": models learn and amplify the biases in their training data. Unvetted data
            (including PII used without consent) is a major risk.</p>
            <h4>Mistake: Deploy and Forget</h4>
            <p>Models drift and the world changes. Without monitoring, bias and harm grow unnoticed, sometimes in
            self-reinforcing feedback loops.</p>
            <h4>Mistake: No Human Override</h4>
            <p>Fully automating high-stakes decisions with no way to review or override removes the safety valve.</p>`,
            code: `// Anti-pattern: fully automated, unexplained, unaccountable high-stakes decision
if (model.Predict(applicant) == "reject")
    return AutoReject();   // no explanation, no review, no appeal, no audit log

// Responsible: assist + explain + review + record (see Implementation tab)
// AI informs the decision; a human is accountable; the subject can understand
// and contest it; everything is logged for audit.`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Lending &amp; Insurance</h4>
            <p>Credit and underwriting models are heavily regulated for fairness and explainability (e.g.,
            "adverse action" notices must explain denials). Disparate impact testing is mandatory.</p>
            <h4>Hiring</h4>
            <p>Resume-screening tools have shown gender/ethnic bias; jurisdictions now require bias audits and
            candidate notice for automated hiring decisions.</p>
            <h4>Healthcare</h4>
            <p>Diagnostic and triage models require rigorous validation across populations and human oversight, given
            life-and-death stakes.</p>
            <h4>Content Moderation &amp; Generative AI</h4>
            <p>LLM products add safety filters, refuse harmful requests, watermark/label AI content, and guard against
            generating disinformation or biased output.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Different (sometimes conflicting) fairness definitions:</p>`,
            table: {
                headers: ['Fairness criterion', 'Means', 'Tension'],
                rows: [
                    ['Demographic parity', 'Equal positive rate across groups', 'May reduce accuracy; ignores base rates'],
                    ['Equal opportunity', 'Equal true-positive rate across groups', 'Cannot always hold with parity'],
                    ['Equalized odds', 'Equal TPR and FPR across groups', 'Hard to satisfy fully'],
                    ['Individual fairness', 'Similar individuals treated similarly', 'Defining "similar" is hard'],
                    ['Calibration', 'Scores mean the same across groups', 'Can conflict with equalized odds']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Responsible AI trades raw model metrics for broader system value and risk reduction:</p>
            <h4>Accuracy vs Fairness Trade-off</h4>
            <p>Enforcing a fairness constraint can reduce headline accuracy. The "best" model is the one that meets
            both quality and fairness/ethical requirements — not the highest accuracy alone.</p>
            <h4>Interpretability vs Power</h4>
            <p>Simpler, interpretable models (linear, trees) may be slightly less accurate than deep models but are
            explainable — often the right choice for regulated, high-stakes decisions.</p>
            <h4>Cost of Oversight</h4>
            <p>Human-in-the-loop adds latency and cost but is essential for high-stakes flows. Tier it: automate
            low-risk, route high-risk/low-confidence to humans.</p>
            <h4>Monitoring Overhead</h4>
            <p>Ongoing fairness/drift monitoring has operational cost but prevents far costlier harm and compliance
            failures.</p>`,
            callout: {
                type: 'warning',
                title: 'The Impossibility Result',
                text: 'It is mathematically proven that several intuitive fairness definitions (e.g., calibration and equalized odds) cannot all be satisfied simultaneously when base rates differ. Choosing which fairness criterion to optimize is therefore a value judgment, not a purely technical one \u2014 make it explicitly and document why.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Test for fairness, robustness, and safety — not just accuracy.</p>
            <h4>Disparate-Impact / Subgroup Testing</h4>
            <p>Evaluate metrics (FPR, TPR, accuracy) sliced by protected attributes; assert disparities stay within
            agreed thresholds. Treat a fairness regression like a failing test.</p>
            <h4>Robustness &amp; Adversarial Testing</h4>
            <p>Probe with edge cases, perturbed inputs, and adversarial/unsafe prompts to verify the system fails
            safely and resists manipulation.</p>
            <h4>Red-Teaming (Generative AI)</h4>
            <p>Deliberately attempt to elicit harmful, biased, or policy-violating output to find and close gaps
            before release.</p>`,
            code: `// Subgroup fairness as an automated test/gate
[Fact]
public void Model_FalsePositiveRate_IsEquitableAcrossGroups()
{
    var fprA = Evaluate(testSet.Where(x => x.Group == "A")).FalsePositiveRate;
    var fprB = Evaluate(testSet.Where(x => x.Group == "B")).FalsePositiveRate;

    // Fail if disparity exceeds the agreed fairness threshold (e.g., 5 points)
    Assert.True(Math.Abs(fprA - fprB) <= 0.05,
        $"Disparate impact: FPR A={fprA:P0} vs B={fprB:P0}");
}
// Run on every model/prompt change so fairness can't silently regress.`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Responsible AI questions increasingly appear for senior/AI roles:</p>
            <ul>
                <li><strong>Know that accuracy is not fairness</strong> — evaluate subgroups for disparate impact</li>
                <li><strong>Name fairness definitions</strong> and that they can conflict (impossibility result)</li>
                <li><strong>Advocate human-in-the-loop</strong> for high-stakes decisions</li>
                <li><strong>Stress explainability and auditability</strong> — reasons and recourse for affected people</li>
                <li><strong>Mention governance/regulation</strong> (EU AI Act, model cards, bias audits)</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Senior Signal',
                text: 'Acknowledging that fairness criteria conflict (and that choosing one is a documented value decision), plus framing responsible AI as lifecycle engineering (data -> model -> deploy -> monitor) rather than a checkbox, signals maturity beyond "the model is accurate."'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Frameworks &amp; Standards</h4>
            <ul>
                <li>NIST AI Risk Management Framework</li>
                <li>EU AI Act (risk-based regulation)</li>
                <li>Microsoft Responsible AI Standard; Google AI Principles</li>
            </ul>
            <h4>Books &amp; Tools</h4>
            <ul>
                <li><em>Weapons of Math Destruction</em> by Cathy O'Neil</li>
                <li><em>Fairness and Machine Learning</em> by Barocas, Hardt, Narayanan (free online)</li>
                <li>Tools: Fairlearn, AI Fairness 360, SHAP/LIME (explainability), model cards</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Responsible AI</strong> = fairness, transparency, privacy, accountability, human oversight, safety</li>
                <li><strong>Accuracy is not fairness</strong> — slice metrics by subgroup to find disparate impact</li>
                <li><strong>Fairness definitions conflict</strong> (impossibility result); choosing one is a documented value decision</li>
                <li><strong>Keep humans in the loop</strong> for high-stakes, consequential decisions</li>
                <li><strong>Make decisions explainable and auditable;</strong> provide reasons and recourse</li>
                <li><strong>Minimize/protect data;</strong> guard privacy and honor data rights</li>
                <li><strong>Govern and monitor</strong> across the lifecycle; comply with emerging regulation</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Responsible-AI Review of a Hiring Screener</h4>
            <p>A team proposes an ML model to auto-screen resumes. Conduct a responsible-AI review:</p>
            <ol>
                <li>Identify bias sources (historical hiring data, proxies for protected attributes)</li>
                <li>Choose a fairness metric to monitor and justify it; define an acceptable disparity threshold</li>
                <li>Design human-in-the-loop: which decisions are automated vs require review</li>
                <li>Define explainability: what reason is given to a rejected candidate</li>
                <li>Specify privacy controls and what data is/ isn't used</li>
                <li>Define post-deployment monitoring and an incident/rollback plan</li>
                <li>Decide: should AI even make this decision, and to what degree?</li>
            </ol>`,
            code: `// Deliverables:
// 1. Bias sources + mitigations (drop proxy features, balance data)
// 2. Fairness metric (e.g., equal opportunity) + threshold + subgroup eval
// 3. HITL policy: AI ranks/assists; humans decide; no auto-reject
// 4. Candidate-facing explanation + appeal path
// 5. Data minimization; exclude protected attributes & proxies
// 6. Drift + disparate-impact monitoring; kill switch
// 7. Recommendation on appropriate level of automation`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> Why is high overall accuracy insufficient to call a model fair?<br/>
                    <em>A: Aggregate accuracy can mask disparate impact \u2014 the model may perform much worse (e.g., higher
                    false-positive rate) for a specific subgroup. Fairness requires evaluating metrics sliced by
                    protected attributes.</em></li>
                <li><strong>Q:</strong> Why can't you satisfy all fairness definitions at once?<br/>
                    <em>A: It is mathematically proven (the impossibility result) that criteria like calibration and
                    equalized odds cannot all hold simultaneously when group base rates differ. Choosing one is a value
                    decision.</em></li>
                <li><strong>Q:</strong> When should a human stay in the loop?<br/>
                    <em>A: For high-stakes, consequential decisions (lending, hiring, medical, legal). AI should assist
                    and the human decides, with the ability to review, override, and provide recourse.</em></li>
                <li><strong>Q:</strong> What does accountability require in an AI system?<br/>
                    <em>A: A responsible human/organization, auditable decisions (logged inputs, model version, reasons),
                    and a recourse path for affected people. "The algorithm decided" is not acceptable.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'Why is measuring only accuracy insufficient for evaluating an AI model responsibly?',
            difficulty: 'easy',
            answer: `<p>Overall accuracy is an <em>aggregate</em> that can hide serious problems for specific groups. A
            model can be 95% accurate overall while having, say, a much higher false-positive rate for one
            demographic — causing real harm (disparate impact) that the headline number conceals.</p>
            <p>Responsible evaluation slices metrics (accuracy, FPR, TPR) by protected subgroups and checks for
            unjustified disparities, choosing an explicit fairness criterion to optimize.</p>`,
            explanation: 'It is like saying a hospital has a 95% survival rate — impressive until you learn one ward has a 60% rate dragging against others. The average hides where the harm is concentrated.',
            bestPractices: ['Slice metrics by subgroup', 'Pick and justify a fairness criterion', 'Treat fairness regressions like failing tests'],
            commonMistakes: ['Reporting only aggregate accuracy', 'Ignoring base-rate differences across groups'],
            interviewTip: 'State plainly "accuracy is not fairness" and explain subgroup slicing — concrete and memorable.',
            followUp: ['Name two fairness metrics.', 'How would you set a disparity threshold?']
        },
        {
            question: 'What is explainability and why does it matter for AI in high-stakes decisions?',
            difficulty: 'medium',
            answer: `<p><strong>Explainability</strong> is the ability to understand and communicate why a model made a
            particular decision — which factors contributed and how. It ranges from inherently interpretable models
            (linear models, decision trees) to post-hoc techniques (SHAP, LIME) for complex models.</p>
            <p>It matters for high-stakes decisions because:</p>
            <ul>
                <li><strong>Trust:</strong> stakeholders and users need to understand and trust outcomes</li>
                <li><strong>Recourse:</strong> affected people deserve a reason and a way to contest (e.g., loan
                denial "adverse action" notices are legally required)</li>
                <li><strong>Debugging:</strong> explanations reveal when a model relies on spurious or biased features</li>
                <li><strong>Compliance:</strong> regulations increasingly mandate explanation for automated decisions</li>
            </ul>`,
            explanation: 'If a doctor refuses treatment, "the computer said no" is unacceptable — patients need to know why and to challenge it. Explainability turns an opaque verdict into a reasoned decision people can understand and appeal.',
            bestPractices: ['Prefer interpretable models for consequential decisions', 'Provide clear, human-readable reasons + appeal paths', 'Use SHAP/LIME for complex models', 'Log contributing factors for audit'],
            commonMistakes: ['Black-box models for regulated decisions', 'Explanations too technical for affected users', 'No recourse/appeal mechanism'],
            interviewTip: 'Connect explainability to concrete needs: trust, recourse, debugging, compliance. Mentioning adverse-action notices shows real-world awareness.',
            followUp: ['Interpretable model vs SHAP on a black box — when each?', 'What makes a good user-facing explanation?']
        },
        {
            question: 'How would you build responsible AI into the lifecycle of a consequential decision system (e.g., loan approvals)?',
            difficulty: 'hard',
            answer: `<p>Embed it at every stage, not as a final review:</p>
            <ol>
                <li><strong>Framing:</strong> decide whether and how much AI should decide; given the stakes, design AI
                to assist, not autonomously deny.</li>
                <li><strong>Data:</strong> audit training data for historical bias and proxies for protected attributes
                (e.g., zip code as a race proxy); document with datasheets; ensure representativeness.</li>
                <li><strong>Model:</strong> evaluate accuracy AND fairness across subgroups; pick and justify a fairness
                criterion; prefer interpretable models or add robust explanations.</li>
                <li><strong>Deployment:</strong> human-in-the-loop for denials/low-confidence; clear adverse-action
                explanations; an appeal/recourse path; full audit logging (inputs, version, reasons, decider).</li>
                <li><strong>Monitoring:</strong> track disparate impact, drift, and outcomes in production; alert on
                fairness regression; maintain a kill switch and incident process.</li>
                <li><strong>Governance:</strong> assign accountability, run impact assessments, and comply with
                regulation (e.g., fair-lending laws, EU AI Act high-risk requirements).</li>
            </ol>
            <p>I would also explicitly document the value decisions (which fairness metric, what disparity threshold)
            so they are reviewable, not buried in code.</p>`,
            explanation: 'Responsible AI for loans is like building a fair, transparent courtroom rather than a vending machine: the evidence (data) is vetted, the reasoning (explanation) is on the record, a human judge is accountable for high-stakes verdicts, the accused can appeal (recourse), and an oversight body audits for systemic bias over time.',
            bestPractices: ['AI assists; humans decide high-stakes outcomes', 'Audit data for bias and proxy features', 'Evaluate + monitor subgroup fairness with thresholds', 'Explainable decisions + adverse-action notices + appeals', 'Full audit trail and clear accountability', 'Comply with fair-lending / AI regulation'],
            commonMistakes: ['Fully automated denials with no explanation/appeal', 'Proxy features encoding protected attributes', 'Accuracy-only evaluation', 'Deploy-and-forget with no fairness monitoring', 'Undocumented fairness/value choices'],
            interviewTip: 'Walk the lifecycle (frame -> data -> model -> deploy -> monitor -> govern) with a responsible-AI control at each stage. Naming proxy features (zip code as race proxy) and adverse-action notices shows domain depth.',
            followUp: ['How do you detect proxy features for protected attributes?', 'What goes in an adverse-action explanation?', 'How do you monitor for fairness drift in production?'],
            seniorPerspective: 'The two failure modes I guard hardest against in consequential systems are proxy features and deploy-and-forget. A model that never sees race can still discriminate via correlated proxies (zip code, certain purchase patterns), so I test for that explicitly rather than assuming "we removed the protected attribute" is enough. And fairness is not a launch gate you pass once \u2014 base rates and populations shift, so disparate-impact monitoring runs continuously with alerting, and a human is always accountable for and able to override high-stakes denials. I also insist the value choices \u2014 which fairness definition, what disparity tolerance \u2014 are written down and signed off, because those are organizational decisions, not something an engineer should quietly bake into a loss function.'
        },
        {
            question: 'What privacy and data-governance risks are specific to AI systems, and how do you mitigate them?',
            difficulty: 'medium',
            answer: `<p>AI systems introduce privacy risks beyond ordinary applications because they ingest large amounts of data and can memorize or expose it:</p>
            <ul>
                <li><strong>Training-data memorization/leakage</strong> — models can regurgitate verbatim PII or secrets present in training data</li>
                <li><strong>PII sent to third-party providers</strong> — calling an external LLM can transmit personal/sensitive data outside your control</li>
                <li><strong>Re-identification</strong> — combining "anonymous" features can re-identify individuals</li>
                <li><strong>Purpose creep</strong> — data collected for one purpose reused to train models without consent or legal basis</li>
                <li><strong>Data-subject rights</strong> — honoring access/deletion is hard once data is baked into model weights</li>
            </ul>
            <p>Mitigations follow privacy-by-design: <strong>data minimization</strong> (collect/send only what is needed), <strong>PII redaction</strong> before sending to providers, <strong>purpose limitation and consent/legal basis</strong> for any training use, <strong>private/enterprise endpoints with no-retention agreements</strong> for sensitive data, <strong>data lineage</strong> tracking, and processes to honor access/deletion rights.</p>`,
            explanation: 'An LLM is like an employee with a perfect, leaky memory: whatever confidential paperwork you hand it might resurface in a later conversation with someone else. So you redact documents before sharing, only hand over what the task needs, and use a vetted contractor who agrees not to keep copies.',
            bestPractices: ['Minimize data collected and sent; redact PII before calling external providers', 'Establish consent/legal basis and purpose limitation before training on personal data', 'Use private/enterprise endpoints with no-retention terms for sensitive data', 'Track data lineage and build processes to honor access/deletion (data-subject) rights'],
            commonMistakes: ['Sending raw PII to third-party model APIs without redaction or agreements', 'Reusing data collected for one purpose to train models without a legal basis', 'Assuming removing names makes data anonymous (re-identification risk)', 'No plan for deletion requests once data is embedded in model weights'],
            interviewTip: 'Name AI-specific risks (memorization/leakage, PII to providers, re-identification) rather than generic security points, then map each to a privacy-by-design mitigation. Mentioning data minimization and no-retention enterprise endpoints shows practical awareness.',
            followUp: ['How do you handle a deletion request for data used to train a model?', 'When would you choose a self-hosted model over a third-party API for privacy?'],
            seniorPerspective: 'My default stance is that nothing sensitive leaves our boundary unredacted, and I make engineers justify every field that goes into a prompt or training set. For regulated data I push for enterprise endpoints with contractual no-retention, or self-hosting, because "the provider probably does not train on it" is not a control I can audit or defend.',
            architectPerspective: 'I treat data flowing into AI as a governed pipeline: classified at the source, redacted at the boundary, and logged for lineage so we can answer "what data trained or prompted this model." Right-to-deletion is the hardest constraint and shapes architecture early \u2014 it pushes toward RAG (where knowledge lives in a deletable store) over baking personal data into weights.'
        },
        {
            question: 'How does the EU AI Act\u2019s risk-based approach shape how you design and govern an AI system?',
            difficulty: 'hard',
            answer: `<p>The <strong>EU AI Act</strong> regulates AI by <em>risk tier</em> rather than by technology, and your obligations scale with the tier:</p>
            <ul>
                <li><strong>Unacceptable risk</strong> — banned outright (e.g., social scoring, certain manipulative or biometric-categorization uses)</li>
                <li><strong>High risk</strong> — permitted but heavily regulated (e.g., AI in hiring, credit, education, critical infrastructure, law enforcement). Requires risk management, data governance, technical documentation, logging/traceability, human oversight, accuracy/robustness, and conformity assessment</li>
                <li><strong>Limited risk</strong> — transparency obligations (e.g., disclosing that users are interacting with AI; labeling AI-generated content/deepfakes)</li>
                <li><strong>Minimal risk</strong> — largely unregulated (e.g., spam filters, game AI)</li>
            </ul>
            <p>In practice it means you must first <strong>classify the system's risk tier</strong>, then build the corresponding controls in from the start: documented risk assessments, dataset governance and bias checks, audit logging, meaningful human oversight for high-risk decisions, transparency disclosures, and post-market monitoring. It also pushes <strong>accountability</strong> and documentation (model cards, technical files) from "nice to have" to legal requirement, with significant fines for non-compliance.</p>`,
            explanation: 'The Act works like building codes scaled to a structure\u2019s danger: a garden shed barely needs paperwork, but a hospital needs inspections, documented safety systems, and a responsible engineer who signs off. You first decide what you are building, then meet the obligations that tier demands.',
            bestPractices: ['Classify the system\u2019s risk tier early and design controls to match', 'Maintain technical documentation, model cards, and audit logs for high-risk systems', 'Build in meaningful human oversight and transparency disclosures by design', 'Run dataset governance, bias evaluation, and post-market monitoring as ongoing obligations'],
            commonMistakes: ['Assuming regulation is only about the model, not the whole use case/context', 'Treating compliance as a one-time launch gate rather than continuous monitoring', 'No transparency disclosure when users interact with AI or AI-generated content', 'Skipping documentation/traceability that high-risk classification legally requires'],
            interviewTip: 'Show you understand the tiers (unacceptable/high/limited/minimal) and that obligations scale with risk. The senior point: classification drives architecture (logging, human oversight, documentation), and compliance is continuous, not a checkbox.',
            followUp: ['What makes a use case "high risk" under the Act?', 'How does this compare with the NIST AI Risk Management Framework?'],
            seniorPerspective: 'The first question I ask of any new AI feature is "what risk tier does this fall into?" because that single answer dictates how much engineering overhead \u2014 logging, human oversight, documentation, monitoring \u2014 we must build. I would rather over-classify a borderline hiring or credit feature as high-risk and bake in oversight and audit trails from day one than retrofit them under regulatory pressure later.',
            architectPerspective: 'Regulation like the AI Act makes traceability and human oversight non-negotiable architectural requirements, not features. I design high-risk systems so every consequential decision is logged with inputs, model version, and rationale, a human can review and override, and the whole pipeline is documented \u2014 because the conformity assessment and post-market monitoring obligations assume those capabilities already exist in the system\u2019s design.'
        },
        {
            question: 'Where does bias enter an AI system, and what concrete techniques mitigate it across the lifecycle?',
            difficulty: 'advanced',
            answer: `<p>Bias is not a single defect; it enters at multiple stages and can compound:</p>
            <ul>
                <li><strong>Historical bias</strong> — the world (and thus the data) already reflects inequity; a model trained on past hiring learns past discrimination</li>
                <li><strong>Sampling/representation bias</strong> — some groups are under-represented in the training data</li>
                <li><strong>Labeling bias</strong> — human annotators inject subjective or prejudiced labels</li>
                <li><strong>Proxy/feature bias</strong> — features correlated with protected attributes (zip code as a race proxy) reintroduce bias even when the protected attribute is removed</li>
                <li><strong>Feedback loops</strong> — biased predictions shape future data (more policing where you predicted crime), reinforcing the bias</li>
            </ul>
            <p>Mitigations map to the lifecycle: <strong>pre-processing</strong> (audit/document datasets, rebalance or augment under-represented groups, remove proxy features), <strong>in-processing</strong> (fairness-constrained training, reweighting, adversarial debiasing), and <strong>post-processing</strong> (threshold adjustment per group, calibrated outputs). Crucially, these are paired with <strong>subgroup evaluation</strong> against an explicit fairness criterion, plus <strong>continuous monitoring</strong> for disparate impact and feedback-loop effects in production.</p>`,
            explanation: 'Bias is like contamination that can seep in at the well (historical data), the pipes (sampling and labeling), or downstream taps (proxies and feedback loops). Testing only the final water (overall accuracy) misses it \u2014 you have to check each stage and keep monitoring, because new contamination keeps arriving.',
            bestPractices: ['Audit and document datasets (datasheets) for representation and historical bias', 'Detect and remove proxy features that encode protected attributes', 'Apply pre/in/post-processing debiasing and choose an explicit fairness criterion', 'Continuously monitor subgroup metrics and feedback-loop effects after deployment'],
            commonMistakes: ['Believing that dropping the protected attribute removes bias (proxies remain)', 'Only checking aggregate accuracy, never subgroup metrics', 'Ignoring feedback loops that let bias compound over time', 'Treating debiasing as a one-time fix rather than ongoing monitoring'],
            interviewTip: 'Enumerate the sources (historical, sampling, labeling, proxy, feedback loop) and then map mitigations to pre/in/post-processing plus monitoring. The standout insight is proxy features and feedback loops \u2014 they show you understand why "we removed race" is insufficient.',
            followUp: ['How would you detect that a feature is acting as a proxy for a protected attribute?', 'How do feedback loops amplify bias, and how do you break them?'],
            seniorPerspective: 'I assume bias is present until proven otherwise, because the training data reflects an unequal world by default. The subtle killers are proxies and feedback loops: a model can discriminate without ever seeing the protected attribute, and a biased deployment quietly manufactures its own confirming data. So I test for proxies explicitly and monitor production outcomes by subgroup, not just at launch but continuously.',
            architectPerspective: 'Bias mitigation has to be lifecycle infrastructure, not a single training trick: dataset documentation at ingestion, fairness evaluation as a CI gate, and disparate-impact monitoring with alerting in production. Because fairness criteria conflict and cannot all be satisfied, I make the chosen criterion and disparity thresholds explicit, documented decisions that the system is then built and monitored against.'
        },
        {
            question: 'How do you detect and mitigate bias in an AI system that affects real users?',
            difficulty: 'hard',
            answer: `<p><strong>Bias</strong> in AI systems means the model systematically produces unfair outcomes for specific groups, often reflecting biases in training data or design choices.</p>
<h4>Detection methods:</h4>
<ul>
<li><strong>Disaggregated evaluation:</strong> Don't just measure overall accuracy. Break down performance by demographic groups (age, gender, ethnicity, geography). A model that is 95% accurate overall but 70% accurate for a specific group is biased.</li>
<li><strong>Fairness metrics:</strong>
<ul>
<li>Demographic parity: equal positive prediction rates across groups</li>
<li>Equal opportunity: equal true positive rates across groups</li>
<li>Predictive parity: equal precision across groups</li>
</ul></li>
<li><strong>Counterfactual testing:</strong> Change only the protected attribute (e.g., name suggesting different ethnicity) and check if the output changes — it shouldn't for fair systems.</li>
<li><strong>Red-teaming for bias:</strong> Adversarial testing specifically targeting biased outputs across different demographic inputs.</li>
</ul>
<h4>Mitigation strategies:</h4>
<ul>
<li><strong>Training data audit:</strong> Identify and correct representation imbalances in training data</li>
<li><strong>Debiasing techniques:</strong> Re-weighting training examples, adversarial debiasing, calibrated equalized odds post-processing</li>
<li><strong>Human review:</strong> Regular audits of model outputs for bias patterns, with diverse reviewer panels</li>
<li><strong>Monitoring in production:</strong> Continuous fairness metric tracking with alerts when disparities exceed thresholds</li>
<li><strong>Documentation:</strong> Model cards documenting known limitations, tested populations, and performance disparities</li>
</ul>
<p><strong>Key principle:</strong> Bias is not a one-time fix — it requires continuous monitoring because data distributions shift and new groups appear over time.</p>`,
            bestPractices: ['Disaggregate all evaluation metrics by relevant demographic groups', 'Define fairness criteria BEFORE building (which metric matters for THIS application)', 'Monitor fairness metrics in production continuously, not just at launch', 'Document known biases transparently (model cards)'],
            commonMistakes: ['Only measuring aggregate performance (hides group-level disparities)', 'Assuming "we removed protected attributes" prevents bias (proxies exist)', 'Treating bias as a one-time check rather than continuous monitoring', 'Using one fairness metric without understanding the inherent trade-offs between metrics'],
            interviewTip: 'Name specific fairness metrics (demographic parity, equal opportunity) and explain they are MUTUALLY EXCLUSIVE (you must choose based on context). This shows depth beyond "be fair."',
            followUp: ['Why cant you satisfy all fairness metrics simultaneously?', 'How do you handle bias in generative AI vs classification models?']
        },
        {
            question: 'What are the key principles of responsible AI governance in an organization?',
            difficulty: 'medium',
            answer: `<p><strong>Responsible AI governance</strong> is the organizational framework that ensures AI systems are developed and deployed ethically, safely, and in compliance with regulations.</p>
<h4>Core principles:</h4>
<ol>
<li><strong>Transparency:</strong> Users know when they're interacting with AI. Explanations are available for how decisions are made. No "black box" decisions affecting people's lives.</li>
<li><strong>Fairness:</strong> Systems are evaluated and monitored for bias. Disparate impact on protected groups is measured and mitigated.</li>
<li><strong>Privacy:</strong> Training data is ethically sourced. PII is protected. Data minimization — collect only what's needed.</li>
<li><strong>Safety:</strong> Systems have guardrails, fail-safes, and human oversight for high-risk decisions. Testing includes adversarial scenarios.</li>
<li><strong>Accountability:</strong> Clear ownership of AI systems. When things go wrong, there's a responsible party and a remediation process.</li>
<li><strong>Human oversight:</strong> Humans remain in the loop for consequential decisions (hiring, lending, healthcare). AI augments, doesn't replace, human judgment for high-stakes choices.</li>
</ol>
<h4>Governance mechanisms:</h4>
<ul>
<li><strong>AI Ethics Board:</strong> Cross-functional group (engineering, legal, ethics, product) that reviews high-risk AI applications before launch</li>
<li><strong>Risk classification:</strong> Tier AI uses by risk level (low: recommendations, medium: content moderation, high: hiring/lending/medical)</li>
<li><strong>Model cards:</strong> Standardized documentation for each model covering: purpose, limitations, training data, performance by group, known biases</li>
<li><strong>Incident response:</strong> Process for handling AI-related incidents (biased outputs, harmful content, privacy breaches)</li>
<li><strong>Regulation awareness:</strong> EU AI Act, NIST AI RMF, industry-specific regulations</li>
</ul>`,
            bestPractices: ['Classify AI uses by risk tier and apply governance proportionally', 'Require model cards and bias evaluation before any high-risk deployment', 'Establish clear ownership and accountability for each AI system', 'Monitor continuously — governance is ongoing, not a launch gate only'],
            commonMistakes: ['Treating responsible AI as a checkbox ("we added a disclaimer") rather than ongoing practice', 'No risk classification — applying the same scrutiny to a recommendation engine and a hiring tool', 'Ethics board as a bottleneck that blocks all AI work (should be risk-proportional)', 'No monitoring after launch — bias can emerge or shift over time'],
            interviewTip: 'Structure your answer around the 6 principles (transparency, fairness, privacy, safety, accountability, human oversight) and the governance mechanisms. Mentioning EU AI Act and model cards shows awareness of the evolving regulatory landscape.',
            followUp: ['How does the EU AI Act classify AI risk levels?', 'What should a model card contain?']
        }
    ]
});
