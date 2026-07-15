'use strict';

PageData.register('pe-platform-engineering', {
  title: 'Platform Engineering',
  description: 'Internal Developer Platforms, golden paths, self-service infrastructure, DevEx metrics, and platform team design',
  sections: [
    {
      title: 'Introduction',
      content: `
        <p>Platform engineering is the discipline of building and maintaining internal developer platforms (IDPs) that enable self-service capabilities for software engineering teams. It sits at the intersection of DevOps, infrastructure, and developer experience — providing paved roads that make the right thing the easy thing.</p>
        <p>As organizations scale beyond 10-20 teams, the cognitive load of managing infrastructure, CI/CD, observability, and security becomes unsustainable for individual product teams. Platform engineering addresses this by creating abstractions that hide complexity while preserving flexibility.</p>
        <p>For principal engineers, platform engineering requires balancing standardization with autonomy, measuring developer productivity, and building platforms that teams actually want to use — not ones they're forced to use.</p>
      `
    },
    {
      title: 'Core Concepts',
      content: `
        <h3>Internal Developer Platform (IDP)</h3>
        <p>An IDP is a layer on top of existing infrastructure that provides self-service capabilities to development teams. It typically includes:</p>
        <ul>
          <li>Service catalog and scaffolding (create new services from templates)</li>
          <li>Infrastructure provisioning (databases, queues, caches via API/UI)</li>
          <li>CI/CD pipelines (standardized but extensible)</li>
          <li>Observability stack (metrics, logs, traces pre-configured)</li>
          <li>Security controls (secrets management, certificate rotation, compliance scanning)</li>
        </ul>

        <h3>Golden Paths vs Golden Cages</h3>
        <ul>
          <li><strong>Golden Paths</strong> — Opinionated, well-supported defaults that make common tasks easy. Teams CAN deviate but lose platform support. "If you use our path, we handle operations for you."</li>
          <li><strong>Golden Cages</strong> — Mandatory constraints with no escape hatch. Teams CANNOT deviate even when they have legitimate reasons. Creates frustration and shadow IT.</li>
        </ul>
        <p>The distinction is critical: golden paths attract adoption through superior developer experience. Golden cages enforce compliance through restriction.</p>

        <h3>SPACE Framework (Developer Productivity)</h3>
        <ul>
          <li><strong>S</strong>atisfaction and well-being — Developer happiness, burnout indicators</li>
          <li><strong>P</strong>erformance — Outcomes delivered (features shipped, bugs fixed)</li>
          <li><strong>A</strong>ctivity — Observable actions (commits, PRs, deployments) — use carefully, avoid Goodhart's Law</li>
          <li><strong>C</strong>ommunication and collaboration — Code review quality, knowledge sharing, mentoring</li>
          <li><strong>E</strong>fficiency and flow — Uninterrupted time, wait time, tooling friction</li>
        </ul>

        <h3>Platform as a Product</h3>
        <p>Successful platforms treat developers as customers:</p>
        <ul>
          <li>Product management: roadmap, user research, prioritization</li>
          <li>Customer success: onboarding, documentation, support channels</li>
          <li>Marketing: internal advocacy, showcasing wins, evangelism</li>
          <li>Feedback loops: satisfaction surveys, usage metrics, feature requests</li>
        </ul>
      `
    },
    {
      title: 'Platform Architecture',
      mermaid: `graph TB
        subgraph "Developer Interface Layer"
          Portal[Developer Portal - Backstage/Port]
          CLI[Platform CLI]
          API[Platform API]
          Templates[Service Templates]
        end

        subgraph "Platform Capabilities"
          SC[Service Catalog]
          IP[Infrastructure Provisioning]
          CICD[CI/CD Pipelines]
          OBS[Observability Stack]
          SEC[Security Controls]
          DOCS[Documentation Hub]
        end

        subgraph "Infrastructure Layer"
          K8S[Kubernetes Clusters]
          TF[Terraform Modules]
          VAULT[HashiCorp Vault]
          GIT[GitOps - ArgoCD/Flux]
        end

        subgraph "Governance"
          POL[Policy Engine - OPA]
          COST[Cost Controls]
          COMP[Compliance Checks]
          AUDIT[Audit Trail]
        end

        Portal --> SC
        Portal --> IP
        CLI --> CICD
        API --> OBS
        Templates --> SEC

        SC --> K8S
        IP --> TF
        CICD --> GIT
        SEC --> VAULT
        OBS --> K8S

        POL --> IP
        COST --> IP
        COMP --> CICD
        AUDIT --> Portal`
    },
    {
      title: 'Implementation',
      content: `
        <p>A practical platform engineering implementation using API-first design:</p>
        <pre><code class="language-csharp">// Platform API - Service Provisioning
public class PlatformServiceController : ControllerBase
{
    private readonly IServiceProvisioner _provisioner;
    private readonly ITemplateEngine _templates;
    private readonly IPolicyEngine _policies;

    [HttpPost("api/v1/services")]
    public async Task&lt;ActionResult&lt;ServiceResponse&gt;&gt; CreateService(
        [FromBody] CreateServiceRequest request)
    {
        // Validate against organizational policies
        var policyResult = await _policies.Evaluate(new PolicyContext
        {
            TeamId = request.TeamId,
            ServiceType = request.Type,
            RequestedResources = request.Resources,
            ComplianceRequirements = request.Compliance
        });

        if (!policyResult.Allowed)
            return BadRequest(new { Violations = policyResult.Violations });

        // Generate from golden path template
        var scaffold = await _templates.Generate(new TemplateContext
        {
            Template = request.Type switch
            {
                ServiceType.RestApi => "golden-path-dotnet-api",
                ServiceType.EventProcessor => "golden-path-worker",
                ServiceType.Frontend => "golden-path-react-spa",
                _ => throw new ArgumentException("Unknown service type")
            },
            Variables = new Dictionary&lt;string, string&gt;
            {
                ["serviceName"] = request.Name,
                ["team"] = request.TeamId,
                ["owner"] = request.OwnerEmail,
                ["tier"] = request.Tier.ToString()
            }
        });

        // Provision infrastructure
        var infra = await _provisioner.Provision(new InfraRequest
        {
            ServiceName = request.Name,
            Environment = "dev", // Start with dev, promote via pipeline
            Resources = ApplyTierDefaults(request.Resources, request.Tier),
            Observability = new ObsConfig
            {
                MetricsEnabled = true,
                TracingEnabled = true,
                LogLevel = "Information",
                SloTarget = request.Tier == ServiceTier.Critical ? 0.999 : 0.995
            }
        });

        return Created($"/api/v1/services/{infra.ServiceId}", new ServiceResponse
        {
            ServiceId = infra.ServiceId,
            Repository = scaffold.RepoUrl,
            Pipeline = infra.PipelineUrl,
            Dashboard = infra.DashboardUrl,
            Documentation = $"/docs/services/{request.Name}",
            Status = "provisioning"
        });
    }
}

// Developer Experience Metrics Collection
public class DevExMetricsService
{
    // SPACE framework implementation
    public async Task&lt;DevExReport&gt; GenerateReport(string teamId, DateRange period)
    {
        return new DevExReport
        {
            Team = teamId,
            Period = period,

            // Satisfaction
            Satisfaction = new SatisfactionMetrics
            {
                DeveloperSurveyScore = await GetLatestSurveyScore(teamId),
                NPS = await GetPlatformNPS(teamId),
                TopFrictions = await GetTopFrictionPoints(teamId)
            },

            // Performance
            Performance = new PerformanceMetrics
            {
                DeploymentFrequency = await GetDeployFrequency(teamId, period),
                LeadTimeForChanges = await GetLeadTime(teamId, period),
                ChangeFailureRate = await GetChangeFailureRate(teamId, period),
                MeanTimeToRecover = await GetMTTR(teamId, period)
            },

            // Efficiency
            Efficiency = new EfficiencyMetrics
            {
                TimeToFirstDeploy = await GetTimeToFirstDeploy(teamId, period),
                PipelineDuration = await GetAvgPipelineDuration(teamId, period),
                EnvironmentProvisionTime = await GetProvisionTime(teamId, period),
                WaitTimeForReviews = await GetReviewWaitTime(teamId, period),
                ToilPercentage = await GetToilPercentage(teamId, period)
            },

            // Platform-specific
            PlatformAdoption = new PlatformMetrics
            {
                GoldenPathAdoption = await GetGoldenPathPercent(teamId),
                SelfServiceUsage = await GetSelfServiceRate(teamId, period),
                SupportTicketsCreated = await GetSupportTickets(teamId, period),
                DocumentationCoverage = await GetDocCoverage(teamId)
            }
        };
    }
}

// Golden Path Template Registry
public class GoldenPathRegistry
{
    private readonly Dictionary&lt;string, GoldenPath&gt; _paths = new()
    {
        ["golden-path-dotnet-api"] = new GoldenPath
        {
            Name = ".NET REST API",
            Description = "Production-ready API with auth, observability, health checks",
            Includes = new[]
            {
                "OpenTelemetry instrumentation",
                "Health check endpoints",
                "Structured logging with correlation IDs",
                "Authentication middleware",
                "Dockerfile + Helm chart",
                "GitHub Actions pipeline",
                "Grafana dashboard template",
                "Load test baseline (k6)"
            },
            SupportLevel = SupportLevel.FullyManaged,
            UpgradeStrategy = "Automated PRs for dependency updates via Renovate"
        },
        ["golden-path-worker"] = new GoldenPath
        {
            Name = "Event Processing Worker",
            Description = "Kafka/RabbitMQ consumer with dead-letter handling",
            Includes = new[]
            {
                "Consumer group configuration",
                "Dead-letter queue with retry policy",
                "Backpressure handling",
                "Graceful shutdown",
                "Lag monitoring dashboard",
                "Auto-scaling based on queue depth"
            },
            SupportLevel = SupportLevel.FullyManaged,
            UpgradeStrategy = "Automated PRs for dependency updates via Renovate"
        }
    };
}</code></pre>
      `
    },
    {
      title: 'Common Mistakes',
      content: `
        <ul>
          <li><strong>Building a platform nobody asked for</strong> — Start with developer pain points, not cool technology. User research first.</li>
          <li><strong>Golden cages instead of golden paths</strong> — Forcing all teams through rigid workflows without escape hatches creates shadow IT and resentment.</li>
          <li><strong>No product management</strong> — Treating the platform as an infrastructure project rather than a product with users, roadmap, and feedback loops.</li>
          <li><strong>Over-abstracting too early</strong> — Building a generic platform before understanding specific use cases. Start with concrete solutions, abstract patterns later.</li>
          <li><strong>Ignoring adoption metrics</strong> — If teams aren't using the platform voluntarily, the platform has failed regardless of technical quality.</li>
          <li><strong>Insufficient documentation</strong> — Developers won't adopt what they can't understand. Documentation is a feature, not an afterthought.</li>
          <li><strong>Not investing in migration</strong> — Building the new platform but not helping teams migrate from the old way. Migration support is critical.</li>
          <li><strong>Measuring activity instead of outcomes</strong> — Counting deployments instead of measuring developer satisfaction and lead time reduction.</li>
        </ul>
      `
    },
    {
      title: 'Interview Tips',
      callout: {
        type: 'tip',
        title: 'What Interviewers Look For',
        text: `<ul>
          <li>Understanding that platform engineering is a product discipline, not just infrastructure automation</li>
          <li>Ability to balance standardization with team autonomy (golden paths vs golden cages)</li>
          <li>Knowledge of developer experience metrics and how to measure platform success (SPACE, DORA)</li>
          <li>Experience with platform portals (Backstage, Port) and service catalog design</li>
          <li>Understanding of platform team economics: when does a platform team pay for itself?</li>
          <li>API-first thinking for platform capabilities (everything accessible programmatically)</li>
          <li>Organizational design skills: team topologies, interaction modes (X-as-a-Service, collaboration, facilitation)</li>
        </ul>`
      }
    },
    {
      title: 'Key Takeaways',
      content: `
        <ul>
          <li>Platform engineering reduces cognitive load on product teams by providing self-service abstractions over complex infrastructure.</li>
          <li>Golden paths attract adoption through superior developer experience. Golden cages enforce compliance through restriction. Always prefer paths.</li>
          <li>Treat your platform as a product: user research, roadmap, documentation, support channels, and satisfaction metrics.</li>
          <li>Measure success through developer outcomes (DORA metrics, time to first deploy, satisfaction) not platform activity metrics.</li>
          <li>Start small: solve one painful workflow end-to-end rather than building a comprehensive platform nobody uses.</li>
          <li>API-first design enables both UI portals and CLI tools. Never build capabilities accessible only through a UI.</li>
          <li>Platform teams should be funded as shared investment, not charged back per-use (perverse incentive to avoid the platform).</li>
          <li>The best platform is one that teams choose to use even when alternatives exist.</li>
        </ul>
      `
    }
  ],
  questions: [
    {
      id: 'plat-q1',
      level: 'senior',
      title: 'How do you distinguish between golden paths and golden cages? Give examples of each.',
      answer: `<p><strong>Golden Paths</strong> are opinionated defaults that make the right thing easy. Teams can deviate, but the path offers the best supported experience.</p>
        <p><strong>Golden Cages</strong> are mandatory constraints that prevent teams from solving their unique problems, creating frustration and shadow IT.</p>
        <p><strong>Golden Path examples:</strong></p>
        <ul>
          <li>"Use our service template and get CI/CD, observability, and auto-scaling configured automatically. Want custom setup? You own the operational burden."</li>
          <li>"Deploy via our Helm charts and get canary deployments for free. Manual kubectl is allowed but unsupported."</li>
          <li>"Use our approved language list (Go, TypeScript, C#) for full platform support. Other languages can deploy but without official templates or support."</li>
        </ul>
        <p><strong>Golden Cage examples:</strong></p>
        <ul>
          <li>"All services MUST use Java. No exceptions." (Even for CLI tools or data pipelines where other languages are clearly better.)</li>
          <li>"All deployments go through our pipeline. No manual process exists." (Even during critical production incidents when the pipeline is down.)</li>
          <li>"All data must use our shared PostgreSQL cluster." (Even for time-series data that would be 10x more efficient in InfluxDB.)</li>
        </ul>
        <p><strong>Design principles for paths over cages:</strong></p>
        <ul>
          <li>Always provide an escape hatch (even if it comes with reduced support)</li>
          <li>Make the golden path genuinely superior (not just mandated)</li>
          <li>Document why the path exists and what tradeoffs alternatives involve</li>
          <li>Review path constraints annually — yesterday's good constraint may be today's cage</li>
        </ul>`
    },
    {
      id: 'plat-q2',
      level: 'architect',
      title: 'Design an Internal Developer Platform for an organization with 200 engineers across 25 teams.',
      answer: `<p><strong>Platform scope for 200 engineers:</strong></p>
        <p>At this scale, the platform should cover the 80% case excellently rather than attempting 100% coverage:</p>
        <p><strong>Core capabilities (Phase 1 — 3 months):</strong></p>
        <ul>
          <li><strong>Service Catalog</strong> — Backstage-based portal showing all services, ownership, documentation, APIs, dependencies</li>
          <li><strong>Service Scaffolding</strong> — "Create new service" button that provisions repo, pipeline, infrastructure, and observability in under 10 minutes</li>
          <li><strong>Infrastructure Self-Service</strong> — Request databases, caches, queues via Terraform modules exposed through UI/CLI</li>
        </ul>
        <p><strong>Extended capabilities (Phase 2 — 6 months):</strong></p>
        <ul>
          <li><strong>Environment Management</strong> — Ephemeral preview environments for PRs, shared staging with namespace isolation</li>
          <li><strong>Secrets Management</strong> — Vault integration with auto-rotation and team-scoped access</li>
          <li><strong>Cost Visibility</strong> — Per-service cost dashboards with optimization recommendations</li>
        </ul>
        <p><strong>Platform team structure (7-9 people):</strong></p>
        <ul>
          <li>1 Product Manager (developer experience focus)</li>
          <li>1 Tech Lead / Architect</li>
          <li>2-3 Platform Engineers (infrastructure, IaC, Kubernetes)</li>
          <li>2 Developer Experience Engineers (portals, CLIs, documentation)</li>
          <li>1 SRE (platform reliability, on-call for platform itself)</li>
        </ul>
        <p><strong>Success metrics:</strong></p>
        <ul>
          <li>Time from "new service idea" to "first production deploy" < 1 day (from current 2 weeks)</li>
          <li>Platform NPS > 40 (measured quarterly)</li>
          <li>Golden path adoption > 80% of new services</li>
          <li>Support tickets per team per month < 2</li>
          <li>Zero-touch infrastructure provisioning for standard requests</li>
        </ul>
        <p><strong>Funding model:</strong> Central investment (not chargeback). Platform is infrastructure that makes everyone faster — charging for it creates perverse incentive to avoid it.</p>`
    },
    {
      id: 'plat-q3',
      level: 'mid',
      title: 'What is the SPACE framework and how does it measure developer productivity?',
      answer: `<p>SPACE is a framework from Microsoft Research (2021) that provides a multi-dimensional view of developer productivity, counteracting the tendency to rely on single metrics:</p>
        <ul>
          <li><strong>Satisfaction and well-being</strong> — How developers feel about their work, tools, and team. Measured via surveys, retention rates, burnout indicators.</li>
          <li><strong>Performance</strong> — The outcomes of development work. Measured by quality (defect rate, reliability), customer impact (feature adoption), and business outcomes.</li>
          <li><strong>Activity</strong> — Countable outputs like commits, PRs, deployments, code reviews. Important caveat: activity alone is misleading (Goodhart's Law). Use only in combination with other dimensions.</li>
          <li><strong>Communication and collaboration</strong> — How well teams share knowledge, review code, and work together. Measured by review turnaround time, documentation contributions, mentoring.</li>
          <li><strong>Efficiency and flow</strong> — Ability to complete work without interruptions or unnecessary delays. Measured by flow state time, wait times (CI, review, environments), context switches.</li>
        </ul>
        <p><strong>Key principles:</strong></p>
        <ul>
          <li>Never use fewer than 3 dimensions — single metrics are gameable and misleading</li>
          <li>Combine self-reported data (surveys) with system data (telemetry)</li>
          <li>Measure at team level, not individual level (avoids perverse competition)</li>
          <li>Track trends over time rather than absolute numbers</li>
        </ul>
        <p><strong>For platform teams specifically:</strong> The platform's success is measured by improvement in product teams' SPACE metrics — not the platform team's own activity.</p>`
    },
    {
      id: 'plat-q4',
      level: 'architect',
      title: 'How do you measure whether a platform team is delivering enough value to justify its cost?',
      answer: `<p><strong>Platform ROI framework:</strong></p>
        <p><strong>1. Direct value measurement:</strong></p>
        <pre><code class="language-typescript">interface PlatformROI {
  // Time savings (largest contributor)
  avgTimeToProvisionBefore: '2 weeks';
  avgTimeToProvisionAfter: '2 hours';
  provisioningsPerMonth: 15;
  engineerCostPerHour: 150; // fully loaded
  monthlySavings_provisioning: number; // (2w - 2h) * 15 * $150/hr = ~$315K

  // Reliability improvement
  incidentReductionPercent: 30;
  avgIncidentCost: 25000; // lost revenue + engineer time
  incidentsPerMonthBefore: 8;
  monthlySavings_reliability: number; // 30% * 8 * $25K = $60K

  // Platform team cost
  teamSize: 8;
  avgFullyCostPerEngineer: 25000; // monthly fully loaded
  monthlyPlatformCost: 200000;

  // ROI
  monthlyValueDelivered: 375000;
  monthlyTeamCost: 200000;
  roi: '1.9x'; // value / cost
}</code></pre>
        <p><strong>2. Leading indicators (predict future value):</strong></p>
        <ul>
          <li>Golden path adoption rate (growing = more future value)</li>
          <li>Developer satisfaction trend (predicts retention)</li>
          <li>Time to first deploy for new engineers (onboarding efficiency)</li>
          <li>Ratio of self-service to manual requests (decreasing tickets = scaling)</li>
        </ul>
        <p><strong>3. Counterfactual analysis:</strong></p>
        <ul>
          <li>What would happen without the platform? Each team would need 0.5-1 infrastructure engineer</li>
          <li>25 teams × 0.5 engineer × $25K/month = $312K/month in distributed infrastructure work</li>
          <li>Platform centralizes this at $200K with better quality and consistency</li>
        </ul>
        <p><strong>When a platform team is NOT justified:</strong></p>
        <ul>
          <li>Fewer than 5 product teams (overhead exceeds benefit)</li>
          <li>Very homogeneous workloads where a simple script suffices</li>
          <li>Organization moving too fast to maintain platform stability</li>
        </ul>`
    },
    {
      id: 'plat-q5',
      level: 'junior',
      title: 'What is an Internal Developer Platform and why do organizations need one?',
      answer: `<p>An <strong>Internal Developer Platform (IDP)</strong> is a set of tools and self-service capabilities that allows developers to independently build, deploy, and operate their applications without needing to understand all the underlying infrastructure complexity.</p>
        <p><strong>What it typically provides:</strong></p>
        <ul>
          <li>Create a new service (with all the "boring" stuff pre-configured: CI/CD, monitoring, logging)</li>
          <li>Provision infrastructure (need a database? Click a button, get one in minutes)</li>
          <li>Deploy to production (push to main, pipeline handles the rest)</li>
          <li>See what's running (service catalog showing all services, their owners, and status)</li>
        </ul>
        <p><strong>Why organizations need one:</strong></p>
        <ul>
          <li><strong>Cognitive load</strong> — Modern infrastructure is complex. Developers shouldn't need to learn Kubernetes, Terraform, and networking to ship a feature.</li>
          <li><strong>Consistency</strong> — Without a platform, every team invents their own deployment process, monitoring setup, and security configuration.</li>
          <li><strong>Speed</strong> — Creating a new service from scratch takes weeks without a platform, minutes with one.</li>
          <li><strong>Scaling teams</strong> — A small DevOps team can't manually serve 20+ product teams. Self-service is the only way to scale.</li>
        </ul>
        <p><strong>Analogy:</strong> An IDP is like a building's electrical system. Tenants plug into standard outlets without understanding the wiring, transformers, or power grid. The platform team maintains the infrastructure; product teams consume it.</p>`
    },
    {
      id: 'plat-q6',
      level: 'senior',
      title: 'How do you design a platform that teams want to use versus one they are forced to use?',
      answer: `<p><strong>Principles for voluntary adoption:</strong></p>
        <p><strong>1. Solve real pain points:</strong></p>
        <ul>
          <li>Start with developer interviews: "What's the most frustrating part of your week?"</li>
          <li>Observe actual workflows (time studies, diary studies)</li>
          <li>Build for the pain that exists, not the architecture you wish existed</li>
        </ul>
        <p><strong>2. Exceptional developer experience:</strong></p>
        <ul>
          <li>10x better than the alternative (if it's only 2x better, inertia wins)</li>
          <li>Fast feedback loops (provision in seconds, deploy in minutes, not hours)</li>
          <li>Excellent error messages and documentation</li>
          <li>Both CLI and UI access (developers have preferences)</li>
        </ul>
        <p><strong>3. Gradual adoption path:</strong></p>
        <ul>
          <li>Don't require all-or-nothing migration</li>
          <li>Allow teams to adopt one capability at a time</li>
          <li>Provide migration scripts and support, not just documentation</li>
          <li>Celebrate early adopters, learn from their friction</li>
        </ul>
        <p><strong>4. Escape hatches:</strong></p>
        <ul>
          <li>Every abstraction should be bypassable for power users</li>
          <li>"Platform handles 90% of cases. For the other 10%, here's how to do it yourself."</li>
          <li>Never trap teams in a situation where the platform can't serve their needs AND they can't work around it</li>
        </ul>
        <p><strong>5. Visible investment in quality:</strong></p>
        <ul>
          <li>The platform itself should be reliable (SLOs for platform services)</li>
          <li>Responsive support (Slack channel with fast response times)</li>
          <li>Regular improvements visible to users (changelog, release notes)</li>
          <li>Public roadmap that incorporates developer feedback</li>
        </ul>
        <p><strong>Anti-pattern:</strong> Mandating adoption via management decree. This creates compliance without buy-in, and teams will route around the platform at the first opportunity.</p>`
    },
    {
      id: 'plat-q7',
      level: 'architect',
      title: 'How would you implement Backstage (or similar) as a developer portal for a large organization?',
      answer: `<p><strong>Backstage implementation strategy for a large org (200+ engineers):</strong></p>
        <p><strong>Phase 1: Software Catalog (Month 1-2)</strong></p>
        <ul>
          <li>Import all existing services, their ownership, and API definitions</li>
          <li>Each service gets a catalog-info.yaml in their repo (auto-generated for existing services)</li>
          <li>TechDocs integration for documentation (docs-as-code from each repo)</li>
          <li>Immediate value: "Who owns this service?" is now answerable in seconds</li>
        </ul>
        <p><strong>Phase 2: Software Templates (Month 3-4)</strong></p>
        <ul>
          <li>Create templates for common service types (REST API, event consumer, scheduled job)</li>
          <li>Templates generate: repo, pipeline, infrastructure definitions, observability config</li>
          <li>One-click "Create Service" that handles all scaffolding</li>
        </ul>
        <p><strong>Phase 3: Plugins & Integration (Month 5-6)</strong></p>
        <ul>
          <li>Kubernetes plugin (view pod status, logs from the catalog)</li>
          <li>CI/CD plugin (see pipeline status, trigger deploys)</li>
          <li>Cost plugin (per-service cloud spend)</li>
          <li>PagerDuty plugin (on-call schedule, recent incidents)</li>
          <li>SonarQube plugin (code quality metrics)</li>
        </ul>
        <p><strong>Key success factors:</strong></p>
        <ul>
          <li><strong>Data freshness</strong>: If the catalog is stale, no one trusts it. Automate syncing from source of truth (repos, Kubernetes, cloud APIs).</li>
          <li><strong>Low friction catalog registration</strong>: Auto-discover services rather than requiring manual registration.</li>
          <li><strong>Customization for your org</strong>: Build custom plugins for internal tools rather than forcing teams to leave the portal.</li>
          <li><strong>Governance without gatekeeping</strong>: Use scorecards (service maturity scores) rather than blocking deployments.</li>
        </ul>`
    },
    {
      id: 'plat-q8',
      level: 'mid',
      title: 'What is the difference between a platform team and a DevOps/SRE team?',
      answer: `<p><strong>Platform Team:</strong></p>
        <ul>
          <li>Builds products (tools, services, abstractions) consumed by other engineering teams</li>
          <li>Success measured by: developer adoption, self-service rate, developer satisfaction</li>
          <li>Interaction mode: X-as-a-Service (provide capabilities, teams consume independently)</li>
          <li>Focus: Developer experience, reducing cognitive load, enabling autonomy</li>
          <li>Doesn't operate application services — provides the means for teams to operate their own</li>
        </ul>
        <p><strong>DevOps Team (traditional):</strong></p>
        <ul>
          <li>Often becomes a ticket queue: teams request infrastructure changes, DevOps executes</li>
          <li>Success measured by: tickets closed, changes deployed, infrastructure uptime</li>
          <li>Interaction mode: Collaboration or (anti-pattern) gatekeeper</li>
          <li>Focus: Bridging development and operations, CI/CD, automation</li>
          <li>Risk: Becomes a bottleneck that recreates the Dev/Ops wall it was meant to eliminate</li>
        </ul>
        <p><strong>SRE Team:</strong></p>
        <ul>
          <li>Ensures production reliability of specific services or the overall system</li>
          <li>Success measured by: SLOs met, error budgets maintained, toil reduced, incident response quality</li>
          <li>Interaction mode: Embedded in product teams or consulting</li>
          <li>Focus: Reliability, performance, incident management, capacity planning</li>
          <li>Often carries pager for production services they support</li>
        </ul>
        <p><strong>In practice:</strong> Many organizations have all three. Platform provides the tools and golden paths, SRE ensures reliability standards, and "DevOps" practices are embedded in every team. The platform team's explicit goal is to make the DevOps ticket queue unnecessary through self-service.</p>`
    }
  ]
});
