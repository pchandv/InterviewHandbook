/* ═══════════════════════════════════════════════════════════════════
   DevOps — CI/CD Pipelines, Azure Pipelines, Deployment Strategies
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('devops-pipelines', {
    title: 'Azure Pipelines & CI/CD',
    description: 'YAML pipelines, multi-stage deployments, artifact management, approvals, deployment strategies (blue-green, canary), and CI/CD best practices for .NET applications.',
    sections: [
        {
            title: 'YAML Pipeline Structure',
            content: `<p>Azure Pipelines uses YAML for pipeline-as-code — versioned alongside your application code. A pipeline has <strong>stages</strong> → <strong>jobs</strong> → <strong>steps</strong>.</p>`,
            code: `# azure-pipelines.yml — complete .NET API pipeline
trigger:
  branches:
    include: [main, release/*]
  paths:
    exclude: ['docs/**', '*.md']

variables:
  buildConfiguration: 'Release'
  dotnetVersion: '8.0.x'
  imageName: 'myregistry.azurecr.io/my-api'

stages:
  - stage: Build
    jobs:
      - job: BuildAndTest
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: UseDotNet@2
            inputs:
              version: $(dotnetVersion)

          - script: dotnet restore
            displayName: 'Restore packages'

          - script: dotnet build -c $(buildConfiguration) --no-restore
            displayName: 'Build'

          - script: dotnet test --no-build -c $(buildConfiguration) --collect:"XPlat Code Coverage" --logger trx
            displayName: 'Run tests'

          - task: PublishTestResults@2
            inputs:
              testResultsFormat: 'VSTest'
              testResultsFiles: '**/*.trx'

          - task: PublishCodeCoverageResults@2
            inputs:
              summaryFileLocation: '**/coverage.cobertura.xml'

          - script: dotnet publish src/MyApi -c $(buildConfiguration) -o $(Build.ArtifactStagingDirectory)
            displayName: 'Publish'

          - task: Docker@2
            displayName: 'Build & Push Docker image'
            inputs:
              containerRegistry: 'ACR-Connection'
              repository: 'my-api'
              command: 'buildAndPush'
              Dockerfile: 'src/MyApi/Dockerfile'
              tags: |
                $(Build.BuildId)
                latest

  - stage: DeployStaging
    dependsOn: Build
    condition: succeeded()
    jobs:
      - deployment: DeployToStaging
        environment: 'staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: KubernetesManifest@0
                  inputs:
                    action: 'deploy'
                    manifests: 'k8s/staging/*.yml'
                    containers: '$(imageName):$(Build.BuildId)'

  - stage: DeployProduction
    dependsOn: DeployStaging
    condition: succeeded()
    jobs:
      - deployment: DeployToProd
        environment: 'production'  # Requires manual approval
        strategy:
          canary:
            increments: [10, 50]   # 10% → 50% → 100%
            deploy:
              steps:
                - task: KubernetesManifest@0
                  inputs:
                    action: 'deploy'
                    manifests: 'k8s/production/*.yml'
                    containers: '$(imageName):$(Build.BuildId)'`,
            language: 'yaml'
        },
        {
            title: 'Deployment Strategies',
            content: `<p>Choosing the right deployment strategy balances release speed, risk, and rollback capabilities.</p>`,
            table: {
                headers: ['Strategy', 'How It Works', 'Risk Level', 'Best For'],
                rows: [
                    ['Rolling Update', 'Replace instances gradually (old → new)', 'Medium', 'K8s default, stateless APIs'],
                    ['Blue-Green', 'Run old and new side-by-side, switch traffic', 'Low', 'Zero-downtime with instant rollback'],
                    ['Canary', 'Route small % of traffic to new version', 'Low', 'Validating in production with real traffic'],
                    ['Feature Flags', 'Deploy code dark, enable for subset of users', 'Very Low', 'Trunk-based development, A/B testing'],
                    ['Recreate', 'Stop all old, start all new (brief downtime)', 'High', 'Dev/test environments, schema-breaking changes']
                ]
            }
        },
        {
            title: 'CI/CD Best Practices',
            content: `<p>A mature CI/CD pipeline provides fast feedback, automated quality gates, and safe deployments.</p>`,
            code: `# Quality gates checklist for production-ready CI/CD:

# BUILD STAGE:
# - Compile (fail fast on syntax errors)
# - Run unit tests (fast feedback, <5 min)
# - Code coverage threshold (e.g., >80%)
# - Static analysis (SonarQube, Roslyn analyzers)
# - Dependency vulnerability scan (Snyk, Dependabot)
# - Build Docker image + push to registry

# STAGING STAGE:
# - Deploy to staging environment
# - Run integration tests against staging
# - Run E2E/smoke tests (Playwright, Selenium)
# - Performance baseline test (k6, Artillery)
# - Security scan (OWASP ZAP DAST)

# PRODUCTION STAGE:
# - Manual approval gate (for production)
# - Canary deployment (10% traffic first)
# - Monitor error rates and latency
# - Auto-rollback if error threshold exceeded
# - Notify team via Slack/Teams

# Pipeline principles:
# 1. Fail fast — cheapest checks first (lint → build → unit test → integration)
# 2. Immutable artifacts — build once, deploy same artifact to all environments
# 3. Environment parity — staging mirrors production (same infra, different scale)
# 4. Pipeline as code — YAML in repo, versioned, reviewed like any other code
# 5. Trunk-based development — short-lived branches, merge to main frequently`,
            language: 'yaml'
        }
    ],
    questions: [
        {
            question: 'Describe a production-ready CI/CD pipeline for a .NET microservice.',
            difficulty: 'medium',
            answer: `<p>A production-ready pipeline includes: automated build + test on every commit, quality gates (coverage, security scanning), immutable artifact creation (Docker image), staged deployment (staging → production), deployment strategies (canary/blue-green), monitoring-based auto-rollback, and manual approval for production.</p>`,
            bestPractices: ['Build once, deploy the same artifact to all environments (immutable artifacts)', 'Run tests in parallel for faster feedback (unit tests < 5 min target)', 'Use environment-specific configuration (not baked into artifacts)', 'Implement auto-rollback based on error rate metrics post-deploy'],
            commonMistakes: ['Building separate artifacts for each environment (inconsistency risk)', 'Skipping integration tests in CI (bugs caught only in staging/production)', 'No rollback strategy (stuck with broken deployment)', 'Manual deployment steps that are not codified in the pipeline'],
            interviewTip: 'Walk through the pipeline stages: Commit → Build → Unit Test → Package → Deploy Staging → Integration Test → Approve → Deploy Production → Monitor. For each stage, explain what quality gate it enforces and what fails if you skip it.',
            followUp: ['How do you handle database migrations in CI/CD?', 'What is a canary deployment?', 'How do you implement feature flags?'],
            seniorPerspective: 'My pipeline philosophy: developers should be able to deploy to production within 30 minutes of merging to main, with confidence. This requires: comprehensive automated tests, canary deployment with auto-rollback, and feature flags for incomplete work.',
            architectPerspective: 'CI/CD is the foundation of developer velocity. I measure: lead time (commit → production), deployment frequency (daily target), change failure rate (<5%), and mean time to recovery (<1 hour). These four DORA metrics indicate engineering health better than any code metric.'
        },
        {
            question: 'How do you structure reusable Azure Pipelines templates, and what is the difference between step, job, stage, and variable templates?',
            difficulty: 'hard',
            answer: `<p>Azure Pipelines supports <strong>template files</strong> that are included via <code>template:</code> at different levels, with parameters passed via <code>parameters:</code>. Templates are expanded at <em>compile time</em> (before runtime), which is why they use the <code>\${{ }}</code> template-expression syntax.</p><ul><li><strong>Step templates:</strong> reusable sequences of steps (e.g., a standard build-and-test block) inserted inside a job with <code>- template: steps/build.yml</code>.</li><li><strong>Job templates:</strong> reusable whole jobs, including pool and dependencies, inserted under <code>jobs:</code>.</li><li><strong>Stage templates:</strong> reusable stages (e.g., a standard deploy stage parameterized by environment).</li><li><strong>Variable templates:</strong> shared variable sets included under <code>variables:</code>.</li></ul><p>Parameters are strongly typed (<code>string</code>, <code>number</code>, <code>boolean</code>, <code>object</code>, <code>stepList</code>) and support defaults. For governance, host templates in a separate repo referenced via <code>resources.repositories</code> so platform teams own the pipeline contract.</p>`,
            explanation: 'Templates are like cookie cutters: you define the shape once (build steps, deploy stage) and stamp it into many pipelines, passing in parameters like which environment to target instead of copy-pasting YAML everywhere.',
            code: `# templates/steps/build-test.yml
parameters:
  - name: buildConfiguration
    type: string
    default: 'Release'
  - name: runTests
    type: boolean
    default: true

steps:
  - script: dotnet build -c \${{ parameters.buildConfiguration }}
    displayName: 'Build'
  - \${{ if eq(parameters.runTests, true) }}:
    - script: dotnet test -c \${{ parameters.buildConfiguration }} --logger trx
      displayName: 'Test'

---
# azure-pipelines.yml referencing a template repo
resources:
  repositories:
    - repository: templates
      type: git
      name: Platform/pipeline-templates
      ref: refs/tags/v2

stages:
  - stage: Build
    jobs:
      - job: BuildAndTest
        pool: { vmImage: 'ubuntu-latest' }
        steps:
          - template: templates/steps/build-test.yml@templates
            parameters:
              buildConfiguration: 'Release'
              runTests: true`,
            language: 'yaml',
            bestPractices: ['Host shared templates in a dedicated repo and pin with ref/tags for stability', 'Use typed parameters with sensible defaults to make templates self-documenting', 'Prefer template expressions (${{ }}) for compile-time logic like conditional steps', 'Keep templates focused — one concern per template (build, scan, deploy)'],
            commonMistakes: ['Confusing compile-time ${{ }} expressions with runtime $() and $[] expressions', 'Inlining environment-specific values instead of parameterizing them', 'Not pinning the template repo ref, so a template change silently breaks many pipelines', 'Over-parameterizing a template until it is harder to read than duplicated YAML'],
            interviewTip: 'Call out that templates expand at compile time — that single fact explains the ${{ }} syntax, why you cannot use runtime variables in template logic, and why a template change can break every consumer at once.',
            followUp: ['What is the difference between ${{ }}, $(), and $[]?', 'How do you version and roll out a breaking template change?', 'How do extends templates enforce security policy?'],
            seniorPerspective: 'I centralize templates in a platform repo so 40+ service pipelines share one build/scan/deploy contract. The win is consistency and one-place upgrades; the discipline required is semantic versioning of templates via tags, because an unpinned change once broke a dozen pipelines on the same morning.',
            architectPerspective: 'Pipeline templates are an internal platform product: the platform team owns the contract, service teams consume it via parameters, and `extends` templates can enforce non-negotiable controls (mandatory scanning, approved pools). This is how you scale governance without becoming a manual gatekeeper for every team.'
        },
        {
            question: 'Explain Azure Pipelines environments, approvals, and checks. How do you gate a production deployment safely?',
            difficulty: 'advanced',
            answer: `<p>An <strong>environment</strong> is a named deployment target (e.g., <code>production</code>) referenced by <code>deployment</code> jobs. Environments are where you attach <strong>approvals and checks</strong> — controls that run <em>before</em> a deployment job is allowed to execute.</p><ul><li><strong>Approvals:</strong> require named users/groups to manually approve. Configure timeout, and disallow the requester from self-approving for separation of duties.</li><li><strong>Branch control:</strong> restrict which branches may deploy (e.g., only <code>main</code> or <code>release/*</code>).</li><li><strong>Business hours:</strong> block deploys outside an allowed window.</li><li><strong>Invoke REST API / Azure Function:</strong> programmatic gate (e.g., query an external change-management system or check error budget).</li><li><strong>Exclusive lock:</strong> serialize deployments so two pipelines do not race the same environment.</li></ul><p>Checks are defined on the environment resource, not the YAML, so platform/security teams control them independently of the pipeline author.</p>`,
            explanation: 'An environment is like a guarded door to production: the YAML says "deploy here," but the guards (approvals, branch rules, time windows) decide whether the door actually opens — and those guards are set by the security team, not the person knocking.',
            code: `stages:
  - stage: DeployProd
    dependsOn: DeployStaging
    condition: succeeded()
    jobs:
      - deployment: Deploy
        environment: 'production'   # approvals & checks attached in the UI/REST
        strategy:
          runOnce:
            deploy:
              steps:
                - download: current
                  artifact: drop
                - task: AzureWebApp@1
                  inputs:
                    appName: 'my-prod-api'
                    package: '$(Pipeline.Workspace)/drop/**/*.zip'`,
            language: 'yaml',
            bestPractices: ['Attach approvals and checks to the environment, not inline in YAML, so security owns them', 'Disable self-approval and require a separate approver for production', 'Use branch control to ensure only release branches reach prod', 'Add an exclusive lock check to prevent concurrent prod deployments'],
            commonMistakes: ['Relying only on a YAML condition for protection (anyone editing YAML can bypass it)', 'Letting the deployer approve their own deployment', 'No timeout on approvals, leaving pipelines hanging indefinitely', 'Forgetting an exclusive lock, causing two runs to deploy to prod simultaneously'],
            interviewTip: 'Emphasize that checks live on the environment resource, separate from pipeline YAML — that separation of duties is exactly what auditors and security reviewers look for.',
            followUp: ['How would you integrate an external change-management approval?', 'What is the exclusive lock check and when is it essential?', 'How do environments give you per-resource deployment history?'],
            seniorPerspective: 'For a regulated client we wired an "Invoke REST API" check that queried ServiceNow for an approved change ticket before any prod deploy proceeded — no ticket, no deploy, fully automated. Combined with branch control and non-self-approval, it satisfied the auditors without slowing the team down.',
            architectPerspective: 'Environments turn deployment governance into a resource-level concern rather than a pipeline-author concern, which is the correct boundary: developers describe how to deploy, the platform decides when it is permitted. That split is what lets you grant teams pipeline autonomy while keeping centralized, auditable control over production.'
        },
        {
            question: 'How do you handle secrets in Azure Pipelines, and why are secret variables not enough on their own?',
            difficulty: 'advanced',
            answer: `<p>Options, from weakest to strongest:</p><ul><li><strong>Secret pipeline variables:</strong> marked secret in the UI/variable group; masked in logs and not passed to scripts as environment variables unless explicitly mapped via <code>env:</code>. Good for low-sensitivity values.</li><li><strong>Variable groups linked to Azure Key Vault:</strong> secrets stay in Key Vault and are fetched at runtime; rotation happens in Key Vault, not the pipeline.</li><li><strong>Workload identity federation (OIDC):</strong> the preferred modern approach — the service connection authenticates to Azure with a short-lived federated token, so there is <em>no</em> stored client secret to leak or rotate.</li></ul><p><strong>Why secret variables alone are insufficient:</strong> they can be exfiltrated by a malicious script/task in the pipeline (e.g., echoed in a transformed form, or sent to an external host), they require manual rotation, and they are masked only by exact-string matching — a base64 or split value can slip past masking. Defense requires least-privilege service connections, restricting which branches/pipelines can use a secret, and preferring federated credentials over stored ones.</p>`,
            explanation: 'A secret variable is like writing a password on a sticky note that the system tries to black out in photos — better than nothing, but anyone with access to the desk can still copy it. Key Vault and federated identity are like never bringing the password into the room at all.',
            code: `# Variable group backed by Key Vault, secret mapped explicitly into the step
variables:
  - group: 'prod-secrets'   # linked to Azure Key Vault

steps:
  - task: AzureCLI@2
    displayName: 'Deploy with federated identity (no stored secret)'
    inputs:
      azureSubscription: 'prod-oidc-connection'  # workload identity federation
      scriptType: bash
      scriptLocation: inlineScript
      inlineScript: |
        az webapp deploy --name my-prod-api --src-path ./drop/app.zip
    env:
      DB_PASSWORD: $(dbPassword)   # secret must be mapped explicitly to be visible`,
            language: 'yaml',
            bestPractices: ['Prefer workload identity federation (OIDC) so no client secret is stored at all', 'Source secrets from Key Vault via variable groups for central rotation and audit', 'Map secrets into steps explicitly with env: rather than relying on auto-injection', 'Scope service connections and variable groups to specific pipelines/branches'],
            commonMistakes: ['Assuming secret masking is foolproof (transformed/encoded secrets can leak)', 'Storing long-lived service principal secrets instead of using federation', 'Granting a service connection broad subscription-wide Contributor rights', 'Letting PRs from forks or feature branches access production variable groups'],
            interviewTip: 'Volunteer the threat model: a malicious task in the pipeline can exfiltrate a secret variable, so the real control is least-privilege federated identity plus restricting which pipelines/branches can touch the secret.',
            followUp: ['How does OIDC/workload identity federation actually work?', 'How do you prevent a fork PR from accessing secrets?', 'How do you audit secret access in Azure DevOps?'],
            seniorPerspective: 'Migrating service connections from stored SPN secrets to workload identity federation removed an entire class of incidents — no more expired-secret outages and no secret to rotate or leak. The remaining hardening was scoping connections to least privilege and blocking secret access from non-protected branches.',
            architectPerspective: 'Secret handling in CI/CD is really an identity problem: the goal is short-lived, scoped, auditable credentials rather than long-lived shared secrets. I treat the pipeline as an untrusted execution surface — anything it can read, a compromised dependency can read — so the architecture leans on federation, least privilege, and protected-branch policy rather than trusting log masking.'
        },
        {
            question: 'A self-hosted agent pool intermittently fails builds under load. How do you diagnose and harden it?',
            difficulty: 'expert',
            answer: `<p>Intermittent failures on self-hosted agents usually trace to <strong>resource exhaustion, dirty workspaces, or capability/demand mismatches</strong> rather than the pipeline logic.</p><ul><li><strong>Triage:</strong> correlate failures with agent (the run log names the agent), then check that agent's CPU/memory/disk. Out-of-disk from accumulated <code>_work</code> directories and Docker layers is the classic cause.</li><li><strong>Workspace hygiene:</strong> set <code>workspace: clean</code> appropriately and prune Docker images; stale state causes "works on one agent, fails on another."</li><li><strong>Capacity:</strong> agents run jobs sequentially by default. Under load, queue depth grows and timeouts fire. Scale out the pool or use scale-set/elastic agents, and right-size parallelism per agent.</li><li><strong>Capabilities vs demands:</strong> a job may route to an agent missing a required tool version; pin via <code>demands</code> and standardize agent images.</li><li><strong>Isolation:</strong> two jobs on the same agent fighting over a shared port, file lock, or global tool cache cause flakiness — prefer containerized jobs for isolation.</li></ul>`,
            explanation: 'It is like a shared workshop where several people use the same bench: if one leaves a mess (disk full), the bench is missing a tool (capability mismatch), or two people grab it at once (no isolation), the next person\'s work fails unpredictably — even though their instructions were fine.',
            code: `# Harden a self-hosted job: clean workspace, demands, timeout, container isolation
jobs:
  - job: Build
    pool:
      name: 'SelfHosted-Linux'
      demands:
        - Agent.OS -equals Linux
        - dotnet -equals 8.0
    workspace:
      clean: all          # wipe _work between runs to avoid stale state
    timeoutInMinutes: 30
    container: mcr.microsoft.com/dotnet/sdk:8.0   # isolate toolchain per job
    steps:
      - script: |
          df -h            # surface disk pressure in logs
          docker system prune -af --volumes || true
        displayName: 'Disk + Docker hygiene'
      - script: dotnet build -c Release
        displayName: 'Build'`,
            language: 'yaml',
            bestPractices: ['Standardize agent images so capabilities are identical across the pool', 'Run jobs in containers for toolchain isolation and reproducibility', 'Set workspace clean and prune Docker/artifacts to prevent disk exhaustion', 'Use elastic/scale-set agents so capacity scales with queue depth'],
            commonMistakes: ['Assuming flakiness is a code bug when it is an agent resource/state issue', 'Letting _work and Docker layers grow until disk fills mid-build', 'Hand-configured pet agents that drift in installed tool versions', 'No per-job timeout, so a hung job blocks an agent and starves the queue'],
            interviewTip: 'Show a systematic triage: identify the failing agent from the log first, then check resources/state/capabilities — jumping straight to "add more agents" without diagnosing disk or drift is a junior reflex.',
            followUp: ['How do scale-set agents differ from a static pool?', 'How do you make builds reproducible across agents?', 'How would you set up auto-scaling and health checks for the pool?'],
            seniorPerspective: 'I once chased "random" test failures for a week before realizing one agent in the pool had an older Node version — capability drift. The fix was treating agents as cattle: scale-set agents from a single golden image, containerized jobs, and clean workspaces, after which the flakiness vanished and onboarding a new agent became a config change, not a manual install.',
            architectPerspective: 'Self-hosted agents are infrastructure and must be treated as immutable, observable, and disposable — pets-versus-cattle applied to CI. At scale I provision them via scale sets with autoscaling on queue depth, ship agent metrics (disk, queue time, job duration) to the same observability stack as production, and isolate jobs in containers so the build environment is reproducible regardless of which agent runs it.'
        }
    ,
        {
            question: 'How do you handle database schema migrations safely inside a CI/CD pipeline?',
            difficulty: 'hard',
            answer: `<p>The core rule is <strong>backward-compatible, expand-contract migrations</strong> so the schema and the running code are always compatible during a rolling deploy. You never make a breaking change in one step.</p>
            <ul>
                <li><strong>Expand</strong> — add the new column/table (nullable or with default), deploy code that writes to both old and new.</li>
                <li><strong>Migrate</strong> — backfill data in batches.</li>
                <li><strong>Contract</strong> — once all instances use the new shape, drop the old column in a later release.</li>
            </ul>
            <p>Run migrations as a distinct, ordered pipeline step (idempotent, versioned, e.g., EF Core migrations, DbUp, Flyway) <em>before</em> the app rollout, gate prod behind approval, and ensure each migration is forward-only with a tested rollback path.</p>`,
            explanation: 'It is like renovating a shop while staying open: you add the new counter before removing the old one, let both work for a while, move everyone over, and only then tear out the old counter \u2014 customers never hit a closed store.',
            code: `# Pipeline ordering
stages:
  - stage: Migrate          # runs FIRST, against the target DB
    jobs:
      - job: ApplyMigrations
        steps:
          - script: dotnet ef database update --connection "$(DbConnection)"
            displayName: 'Apply EF Core migrations (expand-only, backward compatible)'
  - stage: Deploy           # app rollout only after schema is ready
    dependsOn: Migrate
    condition: succeeded()`,
            language: 'yaml',
            bestPractices: ['Use expand-contract so schema and code are always compatible during rollout', 'Make migrations idempotent, versioned, and forward-only with a tested rollback', 'Run migrations as a separate gated step before app deployment', 'Backfill large tables in batches to avoid long locks'],
            commonMistakes: ['Breaking changes (rename/drop) in the same release as the code change', 'Running migrations from app startup across many instances (race conditions)', 'Long-running ALTERs that lock tables and cause downtime', 'No rollback plan or untested down migrations'],
            interviewTip: 'Say "expand-contract / backward-compatible migrations" early, then walk add \u2192 backfill \u2192 switch \u2192 drop across separate releases. Note migrations run as a gated step before the app, not from app startup.',
            followUp: ['How do you add a NOT NULL column with zero downtime?', 'Why is running migrations from app startup risky at scale?', 'How do you backfill a billion-row table safely?'],
            seniorPerspective: 'I treat every schema change as at least two deploys. The temptation is to rename a column in one PR; I split it into expand and contract releases so a rollback never lands code on an incompatible schema.',
            architectPerspective: 'Zero-downtime data evolution is a first-class architectural constraint: code and schema must be independently deployable and mutually compatible for at least one version window. That discipline is what makes continuous delivery on a live database possible.'
        },
        {
            question: 'How do you design a multi-stage CI/CD pipeline with proper separation between build, test, and deploy? What gates should exist between stages?',
            difficulty: 'hard',
            answer: `<p>A well-designed pipeline has distinct stages with quality gates that increase confidence progressively:</p>
<h4>Pipeline stages:</h4>
<ol>
<li><strong>Build stage (seconds-minutes):</strong> Compile, restore packages, generate artifacts. Gate: compilation succeeds, no warnings-as-errors.</li>
<li><strong>Unit test stage (minutes):</strong> Fast tests with no external dependencies. Gate: 100% pass, coverage threshold met (e.g., 80% on new code).</li>
<li><strong>Static analysis (minutes):</strong> SonarQube, Roslyn analyzers, security scanning. Gate: no new critical/blocker issues, quality gate passes.</li>
<li><strong>Integration test stage (minutes):</strong> Tests with real dependencies (Testcontainers for DB, message broker). Gate: all integration tests pass.</li>
<li><strong>Deploy to staging (minutes):</strong> Automated deployment to staging environment. Gate: health checks pass, smoke tests succeed.</li>
<li><strong>Approval gate:</strong> Manual or automated approval before production. For critical services: require 1-2 reviewer approvals.</li>
<li><strong>Deploy to production (minutes):</strong> Canary/rolling/blue-green deployment. Gate: metrics healthy for bake period (error rate, latency within SLO).</li>
<li><strong>Post-deploy verification:</strong> Synthetic tests against production, SLO monitoring for 15-30 minutes.</li>
</ol>
<h4>Key principles:</h4>
<ul>
<li><strong>Fast feedback first:</strong> Unit tests run before integration tests — fail fast on cheap checks.</li>
<li><strong>Artifact promotion:</strong> Build once, deploy the same artifact to every environment. Never rebuild for production.</li>
<li><strong>Immutable artifacts:</strong> Docker images tagged with commit SHA, stored in registry. What you tested is what you deploy.</li>
<li><strong>Parallelism:</strong> Independent stages run in parallel (linting || unit tests || security scan).</li>
</ul>`,
            bestPractices: ['Build once, promote the same artifact through environments', 'Fast stages first (lint, unit) before slow stages (integration, deploy)', 'Automated gates for objective criteria, manual approval only for subjective risk decisions', 'Include rollback as a first-class pipeline action, not an afterthought'],
            commonMistakes: ['Rebuilding for each environment (staging artifact != production artifact)', 'No gate between staging and production (deploy automatically without verification)', 'All tests in one stage (slow feedback — a lint error waits for integration tests to finish)', 'Manual deployment steps that vary between operators'],
            interviewTip: 'Draw the pipeline stages left-to-right and name the gate between each. Mentioning artifact promotion and "build once" is the signal that you understand immutable deployments.',
            followUp: ['How do you handle pipeline templates shared across 50+ services?', 'What is the difference between a deployment pipeline and a release pipeline?']
        },
        {
            question: 'How do you implement pipeline templates/shared libraries so 50+ services maintain consistent CI/CD without duplication?',
            difficulty: 'expert',
            answer: `<p>At scale, each team writing their own pipeline YAML leads to inconsistency, drift, and duplicated effort. The solution is <strong>centralized pipeline templates</strong> that teams extend.</p>
<h4>Approaches by platform:</h4>
<ul>
<li><strong>Azure DevOps:</strong> Template repositories with <code>extends</code> keyword. Teams reference a shared template and override parameters (service name, test command, deploy target).</li>
<li><strong>GitLab CI:</strong> <code>include</code> directive to pull shared <code>.gitlab-ci.yml</code> templates from a central repo. Teams add service-specific jobs alongside.</li>
<li><strong>GitHub Actions:</strong> Reusable workflows (<code>workflow_call</code>) and composite actions published to an internal actions repo.</li>
</ul>
<h4>Template design principles:</h4>
<ol>
<li><strong>Convention over configuration:</strong> Templates assume standard project layout (src/, tests/, Dockerfile). If you follow conventions, zero config needed.</li>
<li><strong>Parameterized escape hatches:</strong> Override points for non-standard needs (custom test command, extra deploy targets).</li>
<li><strong>Versioned templates:</strong> Templates are versioned (tags/branches). Teams can pin to a version and upgrade deliberately, not break on template changes.</li>
<li><strong>Central quality gates baked in:</strong> Security scanning, coverage thresholds, and approval policies are in the template — teams cannot skip them.</li>
</ol>
<h4>Governance:</h4>
<ul>
<li>Platform team owns the templates and reviews changes (they affect all services)</li>
<li>Breaking changes to templates require migration period (old version supported for N weeks)</li>
<li>Compliance dashboard: "Which services are on the latest template version?"</li>
</ul>
<p><strong>Key benefit:</strong> When you need to add a security scan to every pipeline, you change ONE template file — not 50 individual pipeline definitions.</p>`,
            bestPractices: ['Version templates so teams can upgrade at their pace', 'Bake mandatory quality gates into templates (teams cannot skip security scanning)', 'Provide override parameters for legitimate customization needs', 'Track template adoption: which services are on which version'],
            commonMistakes: ['Forcing all teams onto one template with no customization (too rigid, teams fork)', 'Unversioned templates that break all pipelines when updated', 'Templates that only work for one technology stack (need .NET, Node, Python variants)', 'No testing of the templates themselves (a bug in the template breaks 50 pipelines)'],
            interviewTip: 'Name the specific mechanism for your platform (extends, include, workflow_call) and explain the versioning strategy. Mentioning that mandatory gates live in the template shows you think about governance.',
            followUp: ['How do you test changes to a shared pipeline template without breaking all consumers?', 'How do you handle a team that needs something fundamentally different from the standard template?']
        }
    ]
});
