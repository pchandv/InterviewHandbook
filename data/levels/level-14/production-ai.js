/* Level 14 - AI Engineering: Production AI Operations */
'use strict';
PageData.register('production-ai', {
    "title": "Production AI Operations",
    "description": "AI monitoring, metrics, evaluation, prompt testing, regression testing, versioning, feedback loops",
    "level": 14,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Running AI in production requires operational practices beyond traditional software: prompt versioning, quality evaluation, regression detection, feedback loops, and AI-specific monitoring.</p>"
        },
        {
            "title": "AI Monitoring",
            "content": "<p>Beyond standard APM: track token usage, response quality scores, hallucination rate, cost per request, model latency distribution, user satisfaction signals. Custom dashboards for AI health.</p>",
            "mermaid": "graph TD\n AI[AI System] --> Metrics[Metrics]\n AI --> Quality[Quality Scores]\n AI --> Cost[Cost Tracking]\n Metrics --> Dashboard[AI Dashboard]\n Quality --> Dashboard\n Cost --> Dashboard\n Dashboard --> Alerts[Alert Rules]"
        },
        {
            "title": "Evaluation Pipeline",
            "content": "<p>Automated quality assessment: LLM-as-judge, reference-based scoring, custom metrics per use case. Run on: every deployment, regularly on production traffic sample, regression detection.</p>"
        },
        {
            "title": "Prompt Testing",
            "content": "<p>Golden dataset: input + expected output pairs. Run prompts against dataset, score results, compare to baseline. CI/CD integration: prompt changes trigger eval suite. Prevent quality regressions.</p>"
        },
        {
            "title": "Regression Detection",
            "content": "<p>Model updates, prompt changes, or data changes can degrade quality. Detect: automated eval scores drop, user feedback negative spike, hallucination rate increase. Alert and rollback.</p>"
        },
        {
            "title": "Versioning",
            "content": "<p>Version: prompts (like code), model configurations, evaluation datasets, guardrail rules. Track which version produced which results. Enable rollback to last-known-good.</p>",
            "mermaid": "graph LR\n V1[Prompt v1] --> Eval1[Eval Score: 0.85]\n V2[Prompt v2] --> Eval2[Eval Score: 0.91]\n V3[Prompt v3] --> Eval3[Eval Score: 0.78]\n Eval3 --> Rollback[Rollback to v2]"
        },
        {
            "title": "Feedback Loops",
            "content": "<p>Collect: thumbs up/down, corrections, escalations. Use feedback to: improve prompts, add to eval dataset, identify gaps in knowledge base, prioritize improvements. Flywheel effect.</p>"
        },
        {
            "title": "Canary Deployments for AI",
            "content": "<p>Route small percentage to new prompt/model version. Compare quality metrics against baseline. Gradually increase if quality maintained. Instant rollback if degraded.</p>"
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>AI monitoring vs traditional monitoring</li><li>Prompt regression testing</li><li>Feedback loop design</li><li>Canary for AI changes</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "How is AI monitoring different?",
            "answer": "<p>Beyond latency/errors: track token usage, response quality, hallucination rate, cost per request, user satisfaction. AI-specific metrics that standard APM doesnt capture.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "What is prompt regression testing?",
            "answer": "<p>Golden dataset of input/expected outputs. Run after prompt changes. Compare scores to baseline. Catch quality drops before production. Like unit tests for prompts.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "Feedback loop design?",
            "answer": "<p>Collect signals (thumbs up/down, corrections, escalations). Route to: prompt improvement, eval dataset expansion, knowledge base gaps. Measure improvement over time.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "AI canary deployment?",
            "answer": "<p>Route 5-10% to new version. Compare quality metrics (eval scores, user feedback) against control. Gradual rollout if quality maintained. Instant rollback if degraded.</p>"
        },
        {
            "id": "q5",
            "level": "senior",
            "title": "Versioning strategy for AI?",
            "answer": "<p>Version everything: prompts, model configs, eval datasets, guardrails. Track outputs per version. Enable rollback. CI/CD: eval gate before deploy. Audit trail.</p>"
        },
        {
            "id": "q6",
            "level": "lead",
            "title": "AI ops maturity model?",
            "answer": "<p>Level 1: manual prompts, no eval. Level 2: version control, basic eval. Level 3: CI/CD with eval gates, monitoring. Level 4: automated feedback loops, canary, continuous improvement. Level 5: self-optimizing.</p>"
        },
        {
            "id": "q7",
            "level": "architect",
            "title": "Enterprise AI operations platform?",
            "answer": "<p>Prompt registry + eval framework + A/B testing + monitoring + feedback collection + cost management + compliance audit + model governance + team collaboration tools.</p>"
        }
    ]
});
